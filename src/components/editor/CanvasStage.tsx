import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import Konva from 'konva'
import {
  Circle,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text as KonvaText,
  Transformer,
} from 'react-konva'
import useImage from 'use-image'
import { useStageZoomPan } from './useStageZoomPan'
import type { EditorNode, ImageNode, TextNode } from './types'

const MIN_NODE_SIZE = 20
const MIN_FONT_SIZE = 10
const FALLBACK_FONT = 'Bebas Neue'
const FALLBACK_TEXT_COLOR = '#111827'
const FALLBACK_LETTER_SPACING = 0
const FALLBACK_STROKE_COLOR = '#0f172a'
const FALLBACK_SHAPE_FILL = '#60a5fa'

type CanvasStageProps = {
  nodes: EditorNode[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  onChange: (node: EditorNode) => void
  onEditImage?: (id: string) => void
  stageRef?: MutableRefObject<Konva.Stage | null>
  canvasWidth: number
  canvasHeight: number
  isCanvasValid: boolean
}

type Size = { width: number; height: number }

type GroupDragState = {
  startPositions: Record<string, { x: number; y: number }>
  groupRect: { x: number; y: number; width: number; height: number }
  draggedId: string
}

const clampNodePosition = (
  node: Konva.Node,
  canvasWidth: number,
  canvasHeight: number
) => {
  const stage = node.getStage()
  const rect = node.getClientRect({
    skipShadow: true,
    skipStroke: true,
    relativeTo: stage ?? undefined,
  })
  let dx = 0
  let dy = 0

  if (rect.x < 0) {
    dx = -rect.x
  } else if (rect.x + rect.width > canvasWidth) {
    dx = canvasWidth - (rect.x + rect.width)
  }

  if (rect.y < 0) {
    dy = -rect.y
  } else if (rect.y + rect.height > canvasHeight) {
    dy = canvasHeight - (rect.y + rect.height)
  }

  const current = node.position()
  return {
    x: current.x + dx,
    y: current.y + dy,
  }
}

const getBoundedDragPosition = (
  node: Konva.Node,
  pos: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number
) => {
  const stage = node.getStage()
  const rect = node.getClientRect({
    skipShadow: true,
    skipStroke: true,
    relativeTo: stage ?? undefined,
  })
  const current = node.absolutePosition()
  const deltaX = pos.x - current.x
  const deltaY = pos.y - current.y
  const nextRect = {
    x: rect.x + deltaX,
    y: rect.y + deltaY,
    width: rect.width,
    height: rect.height,
  }

  let x = pos.x
  let y = pos.y

  if (nextRect.x < 0) {
    x += -nextRect.x
  } else if (nextRect.x + nextRect.width > canvasWidth) {
    x -= nextRect.x + nextRect.width - canvasWidth
  }

  if (nextRect.y < 0) {
    y += -nextRect.y
  } else if (nextRect.y + nextRect.height > canvasHeight) {
    y -= nextRect.y + nextRect.height - canvasHeight
  }

  return { x, y }
}

const createDragBoundFunc = (canvasWidth: number, canvasHeight: number) =>
  function (this: Konva.Node, pos: { x: number; y: number }) {
    return getBoundedDragPosition(this, pos, canvasWidth, canvasHeight)
  }

const EditorImage = ({
  node,
  onSelect,
  onChange,
  onEdit,
  lockUniformScale,
  setRef,
  canvasWidth,
  canvasHeight,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}: {
  node: ImageNode
  onSelect: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (node: ImageNode) => void
  onEdit?: () => void
  lockUniformScale?: boolean
  setRef: (node: Konva.Node | null) => void
  canvasWidth: number
  canvasHeight: number
  onDragStart?: (event: Konva.KonvaEventObject<DragEvent>) => void
  onDragMove?: (event: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd?: (event: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd?: (event: Konva.KonvaEventObject<Event>) => void
}) => {
  const [image, status] = useImage(node.src, 'anonymous')
  const transformStateRef = useRef<{
    centerX: number
    centerY: number
    lockedScale: number
  } | null>(null)

  if (status === 'failed') {
    return null
  }

  return (
    <KonvaImage
      id={node.id}
      image={image ?? undefined}
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
      rotation={node.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onEdit}
      onDblTap={onEdit}
      dragBoundFunc={createDragBoundFunc(canvasWidth, canvasHeight)}
      ref={setRef}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(event) => {
        if (onDragEnd) {
          onDragEnd(event)
          return
        }
        const target = event.target
        const clamped = clampNodePosition(target, canvasWidth, canvasHeight)
        target.position(clamped)
        onChange({
          ...node,
          x: clamped.x,
          y: clamped.y,
        })
      }}
      onTransformStart={(event) => {
        if (!lockUniformScale) {
          transformStateRef.current = null
          return
        }

        const target = event.target
        const stage = target.getStage()
        if (!stage) return
        const rect = target.getClientRect({
          skipShadow: true,
          skipStroke: true,
          relativeTo: stage,
        })
        transformStateRef.current = {
          centerX: rect.x + rect.width / 2,
          centerY: rect.y + rect.height / 2,
          lockedScale: 1,
        }
      }}
      onTransform={(event) => {
        if (!lockUniformScale) {
          transformStateRef.current = null
          return
        }
        const target = event.target
        const stage = target.getStage()
        if (!stage) return

        const state = transformStateRef.current
        if (!state) {
          const rect = target.getClientRect({
            skipShadow: true,
            skipStroke: true,
            relativeTo: stage,
          })
          transformStateRef.current = {
            centerX: rect.x + rect.width / 2,
            centerY: rect.y + rect.height / 2,
            lockedScale: target.scaleX() || 1,
          }
          return
        }

        const rawScaleX = target.scaleX()
        const rawScaleY = target.scaleY()
        const deltaX = Math.abs(rawScaleX - state.lockedScale)
        const deltaY = Math.abs(rawScaleY - state.lockedScale)
        const nextScale = deltaX >= deltaY ? rawScaleX : rawScaleY

        target.scaleX(nextScale)
        target.scaleY(nextScale)

        const newRect = target.getClientRect({
          skipShadow: true,
          skipStroke: true,
          relativeTo: stage,
        })
        const newCenter = {
          x: newRect.x + newRect.width / 2,
          y: newRect.y + newRect.height / 2,
        }

        const dx = state.centerX - newCenter.x
        const dy = state.centerY - newCenter.y
        target.position({ x: target.x() + dx, y: target.y() + dy })
        state.lockedScale = nextScale
      }}
      onTransformEnd={(event) => {
        if (onTransformEnd) {
          onTransformEnd(event)
          transformStateRef.current = null
          return
        }
        const target = event.target
        const scaleX = target.scaleX()
        const scaleY = target.scaleY()
        const nextWidth = Math.max(MIN_NODE_SIZE, target.width() * scaleX)
        const nextHeight = Math.max(MIN_NODE_SIZE, target.height() * scaleY)
        target.scaleX(1)
        target.scaleY(1)
        target.width(nextWidth)
        target.height(nextHeight)
        const clamped = clampNodePosition(target, canvasWidth, canvasHeight)
        target.position(clamped)
        onChange({
          ...node,
          x: clamped.x,
          y: clamped.y,
          rotation: target.rotation(),
          width: nextWidth,
          height: nextHeight,
        })
        transformStateRef.current = null
      }}
    />
  )
}

const CanvasStage = ({
  nodes,
  selectedIds,
  onSelectIds,
  onChange,
  onEditImage,
  stageRef: stageRefExternal,
  canvasWidth,
  canvasHeight,
  isCanvasValid,
}: CanvasStageProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const localStageRef = useRef<Konva.Stage | null>(null)
  const stageRef = stageRefExternal ?? localStageRef
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({})
  const editingRef = useRef<HTMLTextAreaElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [selectionRect, setSelectionRect] = useState<{
    x: number
    y: number
    width: number
    height: number
    visible: boolean
  }>({ x: 0, y: 0, width: 0, height: 0, visible: false })
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)
  const groupDragRef = useRef<GroupDragState | null>(null)
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  })

  const { handleWheel } = useStageZoomPan(stageRef)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftPressed(true)
      if (event.code === 'Space') setIsSpacePressed(true)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftPressed(false)
      if (event.code === 'Space') setIsSpacePressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setContainerSize({ width, height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !isCanvasValid) return
    if (containerSize.width === 0 || containerSize.height === 0) return

    stage.scale({ x: 1, y: 1 })
    stage.position({
      x: (containerSize.width - canvasWidth) / 2,
      y: (containerSize.height - canvasHeight) / 2,
    })
    stage.batchDraw()
  }, [canvasWidth, canvasHeight, containerSize, isCanvasValid])

  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return

    const stage = stageRef.current
    const nextNodes = selectedIds
      .map((id) => nodeRefs.current[id])
      .filter((ref): ref is Konva.Node => Boolean(ref))
    transformer.nodes(nextNodes)
    transformer.getLayer()?.batchDraw()
    stage?.batchDraw()
  }, [nodes, selectedIds, stageRef])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const loadFonts = async () => {
      if (!document?.fonts?.load) {
        stage.batchDraw()
        return
      }

      const fontFamilies = Array.from(
        new Set(
          nodes
            .filter((node): node is TextNode => node.type === 'text')
            .map((node) => node.fontFamily || FALLBACK_FONT)
        )
      )

      await Promise.all(
        fontFamilies.map((font) => document.fonts.load(`16px "${font}"`))
      )
      stage.batchDraw()
    }

    loadFonts()
  }, [nodes])

  useEffect(() => {
    return () => {
      if (editingRef.current) {
        editingRef.current.remove()
        editingRef.current = null
      }
    }
  }, [])

  const getStagePointerPosition = () => {
    const stage = stageRef.current
    if (!stage) return null
    const pos = stage.getPointerPosition()
    if (!pos) return null
    const transform = stage.getAbsoluteTransform().copy()
    transform.invert()
    return transform.point(pos)
  }

  const rectsIntersect = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ) =>
    !(
      a.x + a.width < b.x ||
      a.x > b.x + b.width ||
      a.y + a.height < b.y ||
      a.y > b.y + b.height
    )

  const getNodeId = (konvaNode: Konva.Node) => {
    const raw = konvaNode.id?.()
    if (raw) return raw
    const attrsId =
      typeof konvaNode.getAttr === 'function'
        ? (konvaNode.getAttr('id') as string | undefined)
        : undefined
    return attrsId ?? null
  }

  const getNodesByIds = (ids: string[]) =>
    ids
      .map((id) => nodeRefs.current[id])
      .filter((ref): ref is Konva.Node => Boolean(ref))

  const getGroupRectForIds = (ids: string[]) => {
    const stage = stageRef.current
    if (!stage) return null
    const rects = getNodesByIds(ids).map((node) =>
      node.getClientRect({
        relativeTo: stage,
        skipShadow: true,
        skipStroke: true,
      })
    )
    if (rects.length === 0) return null
    return rects.reduce(
      (acc, rect) => {
        const x1 = Math.min(acc.x, rect.x)
        const y1 = Math.min(acc.y, rect.y)
        const x2 = Math.max(acc.x + acc.width, rect.x + rect.width)
        const y2 = Math.max(acc.y + acc.height, rect.y + rect.height)
        return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
      },
      { ...rects[0] }
    )
  }

  const clampDeltaToCanvas = (
    groupRect: { x: number; y: number; width: number; height: number },
    delta: { x: number; y: number }
  ) => {
    let dx = delta.x
    let dy = delta.y

    if (groupRect.x + dx < 0) dx = -groupRect.x
    if (groupRect.y + dy < 0) dy = -groupRect.y
    if (groupRect.x + groupRect.width + dx > canvasWidth) {
      dx = canvasWidth - (groupRect.x + groupRect.width)
    }
    if (groupRect.y + groupRect.height + dy > canvasHeight) {
      dy = canvasHeight - (groupRect.y + groupRect.height)
    }

    return { x: dx, y: dy }
  }

  useEffect(() => {
    const isEditableElementFocused = () => {
      const active = document.activeElement
      if (!active) return false
      if (active instanceof HTMLInputElement) return true
      if (active instanceof HTMLTextAreaElement) return true
      if (active instanceof HTMLSelectElement) return true
      if (active instanceof HTMLElement && active.isContentEditable) return true
      return false
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditing) return
      if (isEditableElementFocused()) return
      if (selectedIds.length === 0) return

      let dx = 0
      let dy = 0
      switch (event.key) {
        case 'ArrowLeft':
          dx = -1
          break
        case 'ArrowRight':
          dx = 1
          break
        case 'ArrowUp':
          dy = -1
          break
        case 'ArrowDown':
          dy = 1
          break
        default:
          return
      }

      event.preventDefault()

      const step = event.shiftKey ? 10 : 1
      const requestedDelta = { x: dx * step, y: dy * step }

      if (selectedIds.length > 1) {
        const groupRect = getGroupRectForIds(selectedIds)
        if (!groupRect) return
        const delta = clampDeltaToCanvas(groupRect, requestedDelta)
        if (delta.x === 0 && delta.y === 0) return

        for (const selectedId of selectedIds) {
          const ref = nodeRefs.current[selectedId]
          if (!ref) continue
          ref.position({ x: ref.x() + delta.x, y: ref.y() + delta.y })
        }

        for (const selectedId of selectedIds) {
          const ref = nodeRefs.current[selectedId]
          const model = nodes.find((node) => node.id === selectedId)
          if (!ref || !model) continue
          onChange({ ...model, x: ref.x(), y: ref.y() })
        }

        return
      }

      const selectedId = selectedIds[0]
      const ref = selectedId ? nodeRefs.current[selectedId] : null
      const model = selectedId ? nodes.find((node) => node.id === selectedId) : null
      if (!ref || !model) return

      ref.position({ x: ref.x() + requestedDelta.x, y: ref.y() + requestedDelta.y })
      const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
      ref.position(clamped)
      onChange({ ...model, x: clamped.x, y: clamped.y })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canvasHeight, canvasWidth, isEditing, nodes, onChange, selectedIds])

  const handleStagePointerDown = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    if (isEditing) return
    if (isSpacePressed) return
    const stage = event.target.getStage()
    const clickedOnEmpty = event.target === stage
    if (!clickedOnEmpty) return

    const pos = getStagePointerPosition()
    if (!pos) return

    selectionStartRef.current = pos
    setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true })

    const keepExisting = Boolean((event.evt as MouseEvent).shiftKey)
    if (!keepExisting && selectedIds.length > 0) {
      onSelectIds([])
    }
  }

  const handleStagePointerMove = () => {
    const start = selectionStartRef.current
    if (!start) return
    const pos = getStagePointerPosition()
    if (!pos) return

    const x = Math.min(start.x, pos.x)
    const y = Math.min(start.y, pos.y)
    const width = Math.abs(pos.x - start.x)
    const height = Math.abs(pos.y - start.y)

    setSelectionRect({ x, y, width, height, visible: true })
  }

  const handleStagePointerUp = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    const start = selectionStartRef.current
    if (!start) return
    selectionStartRef.current = null

    const stage = stageRef.current
    if (!stage) return

    const { x, y, width, height } = selectionRect
    setSelectionRect((prev) => ({ ...prev, visible: false }))

    if (width < 2 && height < 2) {
      onSelectIds([])
      return
    }

    const selectionBox = { x, y, width, height }
    const hits = nodes
      .map((node) => {
        const ref = nodeRefs.current[node.id]
        if (!ref) return null
        const rect = ref.getClientRect({
          relativeTo: stage,
          skipShadow: true,
          skipStroke: true,
        })
        return rectsIntersect(selectionBox, rect) ? node.id : null
      })
      .filter((id): id is string => Boolean(id))

    const keepExisting = Boolean((event.evt as MouseEvent).shiftKey)
    if (keepExisting) {
      const merged = new Set([...selectedIds, ...hits])
      onSelectIds(Array.from(merged))
    } else {
      onSelectIds(hits)
    }
  }

  const handleStageMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    handleStagePointerDown(event)
  }

  const handleStageMouseMove = () => {
    handleStagePointerMove()
  }

  const handleStageMouseUp = (event: Konva.KonvaEventObject<MouseEvent>) => {
    handleStagePointerUp(event)
  }

  const handleStageTouchStart = (event: Konva.KonvaEventObject<TouchEvent>) => {
    handleStagePointerDown(event)
  }

  const handleStageTouchMove = () => {
    handleStagePointerMove()
  }

  const handleStageTouchEnd = (event: Konva.KonvaEventObject<TouchEvent>) => {
    handleStagePointerUp(event)
  }

  const openTextEditor = (node: TextNode) => {
    if (isEditing) return
    const stage = stageRef.current
    const textNode = nodeRefs.current[node.id] as Konva.Text | null
    if (!stage || !textNode) return

    const stageBox = stage.container().getBoundingClientRect()
    const textRect = textNode.getClientRect({
      skipShadow: true,
      skipStroke: true,
    })

    const textarea = document.createElement('textarea')
    textarea.value = node.text
    textarea.className = 'editor-textarea'
    textarea.style.left = `${stageBox.left + textRect.x}px`
    textarea.style.top = `${stageBox.top + textRect.y}px`
    textarea.style.width = `${textRect.width + 10}px` // added extra px to avoid hidden texts
    textarea.style.height = `${textRect.height}px`
    textarea.style.fontSize = `${node.fontSize * stage.scaleX()}px`
    const fontFamily = node.fontFamily || FALLBACK_FONT
    const fontStyle = node.fontStyle || 'normal'
    const textColor = node.fill || FALLBACK_TEXT_COLOR
    const letterSpacing = node.letterSpacing ?? FALLBACK_LETTER_SPACING
    textarea.style.fontFamily = fontFamily
    textarea.style.fontStyle = fontStyle.includes('italic') ? 'italic' : 'normal'
    textarea.style.fontWeight = fontStyle.includes('bold') ? '700' : '400'
    textarea.style.color = textColor
    textarea.style.letterSpacing = `${letterSpacing}px`
    textarea.style.transform = `rotate(${textNode.rotation()}deg)`
    textarea.style.textAlign = textNode.align()

    document.body.appendChild(textarea)
    textarea.focus()
    editingRef.current = textarea
    setIsEditing(true)

    textNode.hide()
    transformerRef.current?.hide()
    stage.draw()

    const removeTextarea = (applyChanges: boolean) => {
      const value = textarea.value
      textarea.remove()
      editingRef.current = null
      textNode.show()
      transformerRef.current?.show()
      stage.draw()
      setIsEditing(false)

      if (applyChanges) {
        onChange({ ...node, text: value })
      }
    }

    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        removeTextarea(true)
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        removeTextarea(false)
      }
    })

    textarea.addEventListener('blur', () => {
      removeTextarea(true)
    })
  }

  const handleTextTransform = (node: TextNode, target: Konva.Node) => {
    const scaleX = target.scaleX()
    const scaleY = target.scaleY()
    const scale = (scaleX + scaleY) / 2
    const nextFontSize = Math.max(MIN_FONT_SIZE, node.fontSize * scale)

    target.scaleX(1)
    target.scaleY(1)
    if (target instanceof Konva.Text) {
      target.fontSize(nextFontSize)
    }
    return nextFontSize
  }

  const handleNodeDragStart = (event: Konva.KonvaEventObject<DragEvent>) => {
    if (isEditing) return
    const stage = stageRef.current
    if (!stage) return
    const target = event.target
    const id = getNodeId(target)
    if (!id) return
    if (!selectedIds.includes(id)) return
    if (selectedIds.length <= 1) return

    const startPositions: Record<string, { x: number; y: number }> = {}
    for (const selectedId of selectedIds) {
      const ref = nodeRefs.current[selectedId]
      if (!ref) continue
      startPositions[selectedId] = { x: ref.x(), y: ref.y() }
    }
    const groupRect = getGroupRectForIds(selectedIds)
    if (!groupRect) return

    groupDragRef.current = { startPositions, groupRect, draggedId: id }
  }

  const handleNodeDragMove = (event: Konva.KonvaEventObject<DragEvent>) => {
    const state = groupDragRef.current
    if (!state) return
    const target = event.target
    const id = getNodeId(target)
    if (!id || id !== state.draggedId) return
    const start = state.startPositions[id]
    if (!start) return

    const desiredDelta = { x: target.x() - start.x, y: target.y() - start.y }
    const delta = clampDeltaToCanvas(state.groupRect, desiredDelta)

    for (const selectedId of selectedIds) {
      const ref = nodeRefs.current[selectedId]
      const startPos = state.startPositions[selectedId]
      if (!ref || !startPos) continue
      ref.position({ x: startPos.x + delta.x, y: startPos.y + delta.y })
    }
  }

  const handleNodeDragEnd = () => {
    const state = groupDragRef.current
    groupDragRef.current = null
    if (!state) return

    for (const selectedId of selectedIds) {
      const ref = nodeRefs.current[selectedId]
      const model = nodes.find((node) => node.id === selectedId)
      if (!ref || !model) continue
      const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
      ref.position(clamped)
      onChange({ ...model, x: clamped.x, y: clamped.y })
    }
  }

  const handleTransformerTransformEnd = () => {
    if (selectedIds.length <= 1) return
    const stage = stageRef.current
    if (!stage) return

    for (const selectedId of selectedIds) {
      const ref = nodeRefs.current[selectedId]
      const model = nodes.find((node) => node.id === selectedId)
      if (!ref || !model) continue

      if (model.type === 'image') {
        const scaleX = ref.scaleX()
        const scaleY = ref.scaleY()
        const nextWidth = Math.max(MIN_NODE_SIZE, ref.width() * scaleX)
        const nextHeight = Math.max(MIN_NODE_SIZE, ref.height() * scaleY)
        ref.scaleX(1)
        ref.scaleY(1)
        ref.width(nextWidth)
        ref.height(nextHeight)
        const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
        ref.position(clamped)
        onChange({
          ...model,
          x: clamped.x,
          y: clamped.y,
          rotation: ref.rotation(),
          width: nextWidth,
          height: nextHeight,
        })
        continue
      }

      if (model.type === 'text') {
        const nextFontSize = handleTextTransform(model, ref)
        const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
        ref.position(clamped)
        onChange({
          ...model,
          x: clamped.x,
          y: clamped.y,
          rotation: ref.rotation(),
          fontSize: nextFontSize,
        })
        continue
      }

      if (model.type === 'shape') {
        if (model.shape === 'rect') {
          const scaleX = ref.scaleX()
          const scaleY = ref.scaleY()
          const nextWidth = Math.max(MIN_NODE_SIZE, ref.width() * scaleX)
          const nextHeight = Math.max(MIN_NODE_SIZE, ref.height() * scaleY)
          const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2 || 1
          const nextCornerRadius = Math.max(0, model.cornerRadius * avgScale)

          ref.scaleX(1)
          ref.scaleY(1)
          ref.width(nextWidth)
          ref.height(nextHeight)

          const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
          ref.position(clamped)

          onChange({
            ...model,
            x: clamped.x,
            y: clamped.y,
            rotation: ref.rotation(),
            width: nextWidth,
            height: nextHeight,
            cornerRadius: nextCornerRadius,
          })
          continue
        }

        if (model.shape === 'circle') {
          const scaleX = ref.scaleX()
          const scaleY = ref.scaleY()
          const nextScale = Math.max(
            Math.abs(scaleX) || 1,
            Math.abs(scaleY) || 1
          )
          const nextRadius = Math.max(MIN_NODE_SIZE / 2, model.radius * nextScale)
          ref.scaleX(1)
          ref.scaleY(1)
          if (ref instanceof Konva.Circle) {
            ref.radius(nextRadius)
          }

          const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
          ref.position(clamped)

          onChange({
            ...model,
            x: clamped.x,
            y: clamped.y,
            rotation: ref.rotation(),
            radius: nextRadius,
          })
        }
      }
    }

    transformerRef.current?.getLayer()?.batchDraw()
  }

  return (
    <div ref={containerRef} className="relative h-full w-full bg-slate-950">
      {!isCanvasValid ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
          Enter a valid canvas size.
        </div>
      ) : (
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          draggable={!isEditing && isSpacePressed}
          onWheel={isEditing ? undefined : handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageTouchStart}
          onTouchMove={handleStageTouchMove}
          onTouchEnd={handleStageTouchEnd}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill="#ffffff"
              stroke="#e2e8f0"
              shadowBlur={16}
              shadowColor="rgba(0,0,0,0.25)"
              shadowOffset={{ x: 0, y: 8 }}
              listening={false}
            />
          </Layer>
          <Layer>
            {nodes.map((node) => {
              if (node.type === 'text') {
                const strokeEnabled = node.strokeEnabled ?? false
                const strokeWidth = node.strokeWidth ?? 0
                const strokeColor = node.strokeColor || FALLBACK_STROKE_COLOR
                const strokeJoin = node.strokeJoin ?? 'round'
                return (
                  <KonvaText
                    key={node.id}
                    id={node.id}
                    text={node.text}
                    x={node.x}
                    y={node.y}
                    fontSize={node.fontSize}
                    rotation={node.rotation}
                    fontFamily={node.fontFamily || FALLBACK_FONT}
                    fontStyle={node.fontStyle || 'normal'}
                    fill={node.fill || FALLBACK_TEXT_COLOR}
                    letterSpacing={node.letterSpacing ?? FALLBACK_LETTER_SPACING}
                    stroke={node.strokeEnabled ? strokeColor : undefined}
                    strokeWidth={strokeEnabled ? strokeWidth : 0}
                    lineJoin={strokeJoin}
                    draggable
                    onClick={(evt) => {
                      const keep = Boolean((evt.evt as MouseEvent).shiftKey)
                      if (!keep) {
                        onSelectIds([node.id])
                        return
                      }
                      const next = selectedIds.includes(node.id)
                        ? selectedIds.filter((id) => id !== node.id)
                        : [...selectedIds, node.id]
                      onSelectIds(next)
                    }}
                    onTap={() => onSelectIds([node.id])}
                    dragBoundFunc={createDragBoundFunc(
                      canvasWidth,
                      canvasHeight
                    )}
                    onDragStart={handleNodeDragStart}
                    onDragMove={handleNodeDragMove}
                    onDblClick={() => openTextEditor(node)}
                    onDblTap={() => openTextEditor(node)}
                    ref={(ref) => {
                      nodeRefs.current[node.id] = ref
                    }}
                    onDragEnd={(event) => {
                      if (selectedIds.length > 1 && selectedIds.includes(node.id)) {
                        handleNodeDragEnd()
                        return
                      }
                      const target = event.target
                      const clamped = clampNodePosition(
                        target,
                        canvasWidth,
                        canvasHeight
                      )
                      target.position(clamped)
                      onChange({
                        ...node,
                        x: clamped.x,
                        y: clamped.y,
                      })
                    }}
                    onTransformEnd={(event) => {
                      if (selectedIds.length > 1 && selectedIds.includes(node.id)) {
                        return
                      }
                      const target = event.target
                      const nextFontSize = handleTextTransform(node, target)
                      const clamped = clampNodePosition(
                        target,
                        canvasWidth,
                        canvasHeight
                      )
                      target.position(clamped)
                      onChange({
                        ...node,
                        x: clamped.x,
                        y: clamped.y,
                        rotation: target.rotation(),
                        fontSize: nextFontSize,
                      })
                    }}
                  />
                )
              }

              if (node.type === 'shape') {
                const strokeEnabled = node.strokeEnabled ?? false
                const strokeWidth = node.strokeWidth ?? 0
                const strokeColor = node.strokeColor || FALLBACK_STROKE_COLOR
                const fill = node.fill || FALLBACK_SHAPE_FILL

                const handleSelect = (
                  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>
                ) => {
                  const keep = Boolean((evt.evt as MouseEvent).shiftKey)
                  if (!keep) {
                    onSelectIds([node.id])
                    return
                  }
                  const next = selectedIds.includes(node.id)
                    ? selectedIds.filter((id) => id !== node.id)
                    : [...selectedIds, node.id]
                  onSelectIds(next)
                }

                if (node.shape === 'rect') {
                  return (
                    <Rect
                      key={node.id}
                      id={node.id}
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rotation={node.rotation}
                      fill={fill}
                      stroke={strokeEnabled ? strokeColor : undefined}
                      strokeWidth={strokeEnabled ? strokeWidth : 0}
                      cornerRadius={node.cornerRadius}
                      draggable
                      onClick={handleSelect}
                      onTap={handleSelect}
                      dragBoundFunc={createDragBoundFunc(canvasWidth, canvasHeight)}
                      onDragStart={handleNodeDragStart}
                      onDragMove={handleNodeDragMove}
                      onDragEnd={() => {
                        if (selectedIds.length > 1 && selectedIds.includes(node.id)) {
                          handleNodeDragEnd()
                          return
                        }
                        const ref = nodeRefs.current[node.id]
                        if (!ref) return
                        const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
                        ref.position(clamped)
                        onChange({ ...node, x: clamped.x, y: clamped.y })
                      }}
                      onTransformEnd={() => {
                        if (selectedIds.length > 1 && selectedIds.includes(node.id)) {
                          return
                        }
                        const ref = nodeRefs.current[node.id]
                        if (!ref) return
                        const scaleX = ref.scaleX()
                        const scaleY = ref.scaleY()
                        const nextWidth = Math.max(MIN_NODE_SIZE, ref.width() * scaleX)
                        const nextHeight = Math.max(MIN_NODE_SIZE, ref.height() * scaleY)
                        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2 || 1
                        const nextCornerRadius = Math.max(0, node.cornerRadius * avgScale)

                        ref.scaleX(1)
                        ref.scaleY(1)
                        ref.width(nextWidth)
                        ref.height(nextHeight)
                        const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
                        ref.position(clamped)
                        onChange({
                          ...node,
                          x: clamped.x,
                          y: clamped.y,
                          rotation: ref.rotation(),
                          width: nextWidth,
                          height: nextHeight,
                          cornerRadius: nextCornerRadius,
                        })
                      }}
                      ref={(ref) => {
                        nodeRefs.current[node.id] = ref
                      }}
                    />
                  )
                }

                return (
                  <Circle
                    key={node.id}
                    id={node.id}
                    x={node.x}
                    y={node.y}
                    radius={node.radius}
                    rotation={node.rotation}
                    fill={fill}
                    stroke={strokeEnabled ? strokeColor : undefined}
                    strokeWidth={strokeEnabled ? strokeWidth : 0}
                    draggable
                    onClick={handleSelect}
                    onTap={handleSelect}
                    dragBoundFunc={createDragBoundFunc(canvasWidth, canvasHeight)}
                    onDragStart={handleNodeDragStart}
                    onDragMove={handleNodeDragMove}
                    onDragEnd={() => {
                      if (selectedIds.length > 1 && selectedIds.includes(node.id)) {
                        handleNodeDragEnd()
                        return
                      }
                      const ref = nodeRefs.current[node.id]
                      if (!ref) return
                      const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
                      ref.position(clamped)
                      onChange({ ...node, x: clamped.x, y: clamped.y })
                    }}
                    onTransform={(evt) => {
                      const target = evt.target
                      const rawScaleX = target.scaleX()
                      const rawScaleY = target.scaleY()
                      const nextScale =
                        Math.abs(rawScaleX) >= Math.abs(rawScaleY) ? rawScaleX : rawScaleY
                      target.scaleX(nextScale)
                      target.scaleY(nextScale)
                    }}
                    onTransformEnd={() => {
                      if (selectedIds.length > 1 && selectedIds.includes(node.id)) {
                        return
                      }
                      const ref = nodeRefs.current[node.id]
                      if (!ref) return
                      const scaleX = ref.scaleX()
                      const scaleY = ref.scaleY()
                      const nextScale = Math.max(
                        Math.abs(scaleX) || 1,
                        Math.abs(scaleY) || 1
                      )
                      const nextRadius = Math.max(MIN_NODE_SIZE / 2, node.radius * nextScale)
                      ref.scaleX(1)
                      ref.scaleY(1)
                      if (ref instanceof Konva.Circle) {
                        ref.radius(nextRadius)
                      }
                      const clamped = clampNodePosition(ref, canvasWidth, canvasHeight)
                      ref.position(clamped)
                      onChange({
                        ...node,
                        x: clamped.x,
                        y: clamped.y,
                        rotation: ref.rotation(),
                        radius: nextRadius,
                      })
                    }}
                    ref={(ref) => {
                      nodeRefs.current[node.id] = ref
                    }}
                  />
                )
              }

              return (
                <EditorImage
                  key={node.id}
                  node={node}
                  onSelect={(evt) => {
                    const keep = Boolean((evt.evt as MouseEvent).shiftKey)
                    if (!keep) {
                      onSelectIds([node.id])
                      return
                    }
                    const next = selectedIds.includes(node.id)
                      ? selectedIds.filter((id) => id !== node.id)
                      : [...selectedIds, node.id]
                    onSelectIds(next)
                  }}
                  onChange={onChange}
                  onEdit={() => onEditImage?.(node.id)}
                  lockUniformScale={isShiftPressed}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  setRef={(ref) => {
                    nodeRefs.current[node.id] = ref
                  }}
                  onDragStart={handleNodeDragStart}
                  onDragMove={handleNodeDragMove}
                  onDragEnd={(event) => {
                    if (selectedIds.length > 1 && selectedIds.includes(node.id)) {
                      handleNodeDragEnd()
                      return
                    }
                    const target = event.target
                    const clamped = clampNodePosition(target, canvasWidth, canvasHeight)
                    target.position(clamped)
                    onChange({ ...node, x: clamped.x, y: clamped.y })
                  }}
                  onTransformEnd={(event) => {
                    if (selectedIds.length > 1 && selectedIds.includes(node.id)) {
                      return
                    }
                    const target = event.target
                    const scaleX = target.scaleX()
                    const scaleY = target.scaleY()
                    const nextWidth = Math.max(MIN_NODE_SIZE, target.width() * scaleX)
                    const nextHeight = Math.max(MIN_NODE_SIZE, target.height() * scaleY)
                    target.scaleX(1)
                    target.scaleY(1)
                    target.width(nextWidth)
                    target.height(nextHeight)
                    const clamped = clampNodePosition(target, canvasWidth, canvasHeight)
                    target.position(clamped)
                    onChange({
                      ...node,
                      x: clamped.x,
                      y: clamped.y,
                      rotation: target.rotation(),
                      width: nextWidth,
                      height: nextHeight,
                    })
                  }}
                />
              )
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              onTransformEnd={handleTransformerTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < MIN_NODE_SIZE || newBox.height < MIN_NODE_SIZE) {
                  return oldBox
                }
                return newBox
              }}
            />
          </Layer>
          <Layer listening={false}>
            {selectionRect.visible ? (
              <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="rgba(59,130,246,0.12)"
                stroke="rgba(59,130,246,0.8)"
                strokeWidth={1}
                dash={[6, 4]}
              />
            ) : null}
          </Layer>
        </Stage>
      )}
    </div>
  )
}

export default CanvasStage
