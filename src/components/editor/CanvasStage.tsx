import { useEffect, useRef, useState } from 'react'
import Konva from 'konva'
import {
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

type CanvasStageProps = {
  nodes: EditorNode[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (node: EditorNode) => void
  onEditImage?: (id: string) => void
  canvasWidth: number
  canvasHeight: number
  isCanvasValid: boolean
}

type Size = { width: number; height: number }

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
}: {
  node: ImageNode
  onSelect: () => void
  onChange: (node: ImageNode) => void
  onEdit?: () => void
  lockUniformScale?: boolean
  setRef: (node: Konva.Node | null) => void
  canvasWidth: number
  canvasHeight: number
}) => {
  const [image, status] = useImage(node.src)
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
      onDragEnd={(event) => {
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
  selectedId,
  onSelect,
  onChange,
  onEditImage,
  canvasWidth,
  canvasHeight,
  isCanvasValid,
}: CanvasStageProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({})
  const editingRef = useRef<HTMLTextAreaElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  })

  const { handleWheel } = useStageZoomPan(stageRef)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftPressed(true)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftPressed(false)
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

    const node = selectedId ? nodeRefs.current[selectedId] : null
    if (node) {
      transformer.nodes([node])
      transformer.getLayer()?.batchDraw()
    } else {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
    }
  }, [nodes, selectedId])

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

  const handleStagePointerDown = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    if (isEditing) return
    const clickedOnEmpty = event.target === event.target.getStage()
    if (clickedOnEmpty) {
      onSelect(null)
    }
  }

  const handleStageMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    handleStagePointerDown(event)
  }

  const handleStageTouchStart = (event: Konva.KonvaEventObject<TouchEvent>) => {
    handleStagePointerDown(event)
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
    textarea.style.width = `${textRect.width}px`
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
          draggable={!isEditing}
          onWheel={isEditing ? undefined : handleWheel}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageTouchStart}
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
                    onClick={() => onSelect(node.id)}
                    onTap={() => onSelect(node.id)}
                    dragBoundFunc={createDragBoundFunc(
                      canvasWidth,
                      canvasHeight
                    )}
                    onDblClick={() => openTextEditor(node)}
                    onDblTap={() => openTextEditor(node)}
                    ref={(ref) => {
                      nodeRefs.current[node.id] = ref
                    }}
                    onDragEnd={(event) => {
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

              return (
                <EditorImage
                  key={node.id}
                  node={node}
                  onSelect={() => onSelect(node.id)}
                  onChange={onChange}
                  onEdit={() => onEditImage?.(node.id)}
                  lockUniformScale={isShiftPressed}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  setRef={(ref) => {
                    nodeRefs.current[node.id] = ref
                  }}
                />
              )
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < MIN_NODE_SIZE || newBox.height < MIN_NODE_SIZE) {
                  return oldBox
                }
                return newBox
              }}
            />
          </Layer>
        </Stage>
      )}
    </div>
  )
}

export default CanvasStage
