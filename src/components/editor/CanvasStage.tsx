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

type CanvasStageProps = {
  nodes: EditorNode[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (node: EditorNode) => void
  canvasWidth: number
  canvasHeight: number
  isCanvasValid: boolean
}

type Size = { width: number; height: number }

const EditorImage = ({
  node,
  onSelect,
  onChange,
  setRef,
}: {
  node: ImageNode
  onSelect: () => void
  onChange: (node: ImageNode) => void
  setRef: (node: Konva.Node | null) => void
}) => {
  const [image, status] = useImage(node.src)

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
      ref={setRef}
      onDragEnd={(event) => {
        onChange({
          ...node,
          x: event.target.x(),
          y: event.target.y(),
        })
      }}
      onTransformEnd={(event) => {
        const target = event.target
        const scaleX = target.scaleX()
        const scaleY = target.scaleY()
        const nextWidth = Math.max(MIN_NODE_SIZE, target.width() * scaleX)
        const nextHeight = Math.max(MIN_NODE_SIZE, target.height() * scaleY)
        target.scaleX(1)
        target.scaleY(1)
        onChange({
          ...node,
          x: target.x(),
          y: target.y(),
          rotation: target.rotation(),
          width: nextWidth,
          height: nextHeight,
        })
      }}
    />
  )
}

const CanvasStage = ({
  nodes,
  selectedId,
  onSelect,
  onChange,
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
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  })

  const { handleWheel } = useStageZoomPan(stageRef)

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
    textarea.style.fontFamily = 'inherit'
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

    onChange({
      ...node,
      x: target.x(),
      y: target.y(),
      rotation: target.rotation(),
      fontSize: nextFontSize,
    })
  }

  return (
    <div ref={containerRef} className="editor-canvas-container">
      {!isCanvasValid ? (
        <div className="canvas-placeholder">Enter a valid canvas size.</div>
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
                return (
                  <KonvaText
                    key={node.id}
                    text={node.text}
                    x={node.x}
                    y={node.y}
                    fontSize={node.fontSize}
                    rotation={node.rotation}
                    fill="#111827"
                    draggable
                    onClick={() => onSelect(node.id)}
                    onTap={() => onSelect(node.id)}
                    onDblClick={() => openTextEditor(node)}
                    onDblTap={() => openTextEditor(node)}
                    ref={(ref) => {
                      nodeRefs.current[node.id] = ref
                    }}
                    onDragEnd={(event) => {
                      onChange({
                        ...node,
                        x: event.target.x(),
                        y: event.target.y(),
                      })
                    }}
                    onTransformEnd={(event) => {
                      handleTextTransform(node, event.target)
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
