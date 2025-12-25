import { useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import EditorLayout from '../components/editor/EditorLayout'
import Toolbar from '../components/editor/Toolbar'
import CanvasStage from '../components/editor/CanvasStage'
import LayersPanel from '../components/editor/LayersPanel'
import { cmToPx } from '../components/editor/cmPx'
import { generateId } from '../components/editor/types'
import ImageEditModal from '../components/editor/ImageEditModal'
import type { EditorNode } from '../components/editor/types'
import Button from '../components/ui/Button'

const DEFAULT_WIDTH_CM = '15'
const DEFAULT_HEIGHT_CM = '15'
const DEFAULT_TEXT_FONT = 'Bebas Neue'
const DEFAULT_TEXT_COLOR = '#111827'
const DEFAULT_LETTER_SPACING = 0
const FONT_OPTIONS = [
  'Bebas Neue',
  'Anton',
  'Bangers',
  'Luckiest Guy',
  'Fredoka',
  'Baloo 2',
  'Pacifico',
  'Oswald',
  'Montserrat',
  'Inter',
]

const StickerEditorPage = () => {
  const [widthCm, setWidthCm] = useState(DEFAULT_WIDTH_CM)
  const [heightCm, setHeightCm] = useState(DEFAULT_HEIGHT_CM)
  const [nodes, setNodes] = useState<EditorNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [editingImageSrc, setEditingImageSrc] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const rightPanelRef = useRef<HTMLDivElement | null>(null)
  const [rightSplitRatio, setRightSplitRatio] = useState(0.5)

  const widthValue = parseFloat(widthCm)
  const heightValue = parseFloat(heightCm)
  const isCanvasValid =
    Number.isFinite(widthValue) && widthValue > 0 && Number.isFinite(heightValue) && heightValue > 0

  const canvasPx = useMemo(() => {
    if (!isCanvasValid) return null
    return {
      width: cmToPx(widthValue),
      height: cmToPx(heightValue),
    }
  }, [heightValue, isCanvasValid, widthValue])

  const errorMessage = !isCanvasValid
    ? 'Enter positive width and height values.'
    : null
  const maxLetterSpacing = canvasPx ? Math.round(canvasPx.width) : 200

  const addTextNode = () => {
    if (!canvasPx) return
    const id = generateId()
    const node: EditorNode = {
      id,
      type: 'text',
      text: 'Double click to edit',
      fontSize: 28,
      fontFamily: DEFAULT_TEXT_FONT,
      fontStyle: 'normal',
      fill: DEFAULT_TEXT_COLOR,
      letterSpacing: DEFAULT_LETTER_SPACING,
      x: canvasPx.width / 2 - 120,
      y: canvasPx.height / 2 - 20,
      rotation: 0,
    }
    setNodes((prev) => [...prev, node])
    setSelectedId(id)
  }

  const addImageNode = (file: Blob) => {
    if (!canvasPx) return

    const id = generateId()
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      const maxWidth = canvasPx.width * 0.3
      const scale = Math.min(1, maxWidth / image.width)
      const width = image.width * scale
      const height = image.height * scale

      const node: EditorNode = {
        id,
        type: 'image',
        src: objectUrl,
        width,
        height,
        x: (canvasPx.width - width) / 2,
        y: (canvasPx.height - height) / 2,
        rotation: 0,
      }

      setNodes((prev) => [...prev, node])
      setSelectedId(id)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
    }

    image.src = objectUrl
  }

  const handleUploadImage = (file: File) => {
    setImageFile(file)
    setEditingImageId(null)
    setEditingImageSrc(null)
    setIsImageModalOpen(true)
  }

  const handleEditImage = (id: string) => {
    const node = nodes.find((item) => item.id === id && item.type === 'image')
    if (!node || node.type !== 'image') return
    setSelectedId(id)
    setImageFile(null)
    setEditingImageId(id)
    setEditingImageSrc(node.src)
    setIsImageModalOpen(true)
  }

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false)
    setImageFile(null)
    setEditingImageId(null)
    setEditingImageSrc(null)
  }

  const handleAddImageFromModal = (
    file: Blob,
    cropMeta?: {
      width: number
      height: number
      originalWidth: number
      originalHeight: number
    }
  ) => {
    if (!canvasPx) return
    if (!editingImageId) {
      addImageNode(file)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== editingImageId || node.type !== 'image') return node
        const widthScale =
          cropMeta && cropMeta.originalWidth
            ? cropMeta.width / cropMeta.originalWidth
            : 1
        const heightScale =
          cropMeta && cropMeta.originalHeight
            ? cropMeta.height / cropMeta.originalHeight
            : 1
        const nextWidth = node.width * widthScale
        const nextHeight = node.height * heightScale
        return {
          ...node,
          src: objectUrl,
          width: nextWidth,
          height: nextHeight,
          x: node.x + (node.width - nextWidth) / 2,
          y: node.y + (node.height - nextHeight) / 2,
        }
      })
    )
  }

  const updateNode = (updatedNode: EditorNode) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    )
  }

  const updateSelectedTextNode = (
    updates: Partial<Extract<EditorNode, { type: 'text' }>>
  ) => {
    if (!selectedNode || selectedNode.type !== 'text') return
    updateNode({ ...selectedNode, ...updates })
  }

  const toggleTextStyle = (style: 'bold' | 'italic') => {
    if (!selectedNode || selectedNode.type !== 'text') return
    const styles = new Set(
      selectedNode.fontStyle.split(' ').map((value) => value.trim()).filter(Boolean)
    )
    if (styles.has(style)) {
      styles.delete(style)
    } else {
      styles.add(style)
    }
    const nextStyle = styles.size ? Array.from(styles).join(' ') : 'normal'
    updateSelectedTextNode({ fontStyle: nextStyle })
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setNodes((prev) => prev.filter((node) => node.id !== selectedId))
    setSelectedId(null)
  }

  const reorderNodes = (orderedIds: string[]) => {
    setNodes((prev) => {
      const lookup = new Map(prev.map((node) => [node.id, node]))
      const ordered = orderedIds
        .map((id) => lookup.get(id))
        .filter((node): node is EditorNode => Boolean(node))
      return ordered.reverse()
    })
  }

  const selectedNode = selectedId
    ? nodes.find((node) => node.id === selectedId) ?? null
    : null

  const handleSplitDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startY = event.clientY
    const startRatio = rightSplitRatio

    const handleMove = (moveEvent: PointerEvent) => {
      const container = rightPanelRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const delta = moveEvent.clientY - startY
      const nextRatio = (startRatio * rect.height + delta) / rect.height
      setRightSplitRatio(Math.min(0.8, Math.max(0.2, nextRatio)))
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <EditorLayout
        topBar={<span>Stickerizz Editor</span>}
        toolbar={
          <Toolbar
            widthCm={widthCm}
            heightCm={heightCm}
            onWidthCmChange={setWidthCm}
            onHeightCmChange={setHeightCm}
            onAddText={addTextNode}
            onUploadImage={handleUploadImage}
            onDeleteSelected={deleteSelected}
            canDelete={Boolean(selectedId)}
            isCanvasValid={isCanvasValid}
            errorMessage={errorMessage}
            canvasPx={canvasPx}
          />
        }
        rightPanel={
          <div ref={rightPanelRef} className="flex h-full flex-col">
            <div
              className="border-b border-slate-800"
              style={{ flex: `${rightSplitRatio} 1 0%` }}
            >
              <LayersPanel
                nodes={nodes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onReorder={reorderNodes}
              />
            </div>
            <div
              className="relative h-6 w-full cursor-row-resize touch-none"
              onPointerDown={handleSplitDragStart}
            >
              <div className="absolute left-1/2 top-1/2 h-4 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-700 bg-slate-900 text-[10px] text-slate-400">
                <div className="flex h-full items-center justify-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-slate-500" />
                  <span className="h-1 w-1 rounded-full bg-slate-500" />
                  <span className="h-1 w-1 rounded-full bg-slate-500" />
                </div>
              </div>
              <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-800" />
            </div>
            <div
              className="p-4 text-sm text-slate-300"
              style={{ flex: `${1 - rightSplitRatio} 1 0%` }}
            >
              {!selectedNode ? (
                <div className="text-slate-400">Select an item for options</div>
              ) : selectedNode.type === 'text' ? (
                <div className="flex h-full flex-col gap-4">
                  <div className="text-xs uppercase tracking-[0.08em] text-slate-400">
                    Text Tools
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedNode.fontStyle.includes('bold') ? 'primary' : 'outline'}
                      onClick={() => toggleTextStyle('bold')}
                      className="w-full"
                    >
                      Bold
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedNode.fontStyle.includes('italic') ? 'primary' : 'outline'}
                      onClick={() => toggleTextStyle('italic')}
                      className="w-full"
                    >
                      Italic
                    </Button>
                  </div>
                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    Font
                    <select
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200"
                      value={selectedNode.fontFamily}
                      onChange={(event) =>
                        updateSelectedTextNode({ fontFamily: event.target.value })
                      }
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    Color
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-9 w-12 cursor-pointer rounded-md border border-slate-700 bg-slate-900"
                        value={selectedNode.fill}
                        onChange={(event) =>
                          updateSelectedTextNode({ fill: event.target.value })
                        }
                      />
                      <span className="text-xs text-slate-400">
                        {selectedNode.fill}
                      </span>
                    </div>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    Letter spacing
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="-2"
                        max={maxLetterSpacing}
                        step="0.5"
                        value={selectedNode.letterSpacing}
                        onChange={(event) =>
                          updateSelectedTextNode({
                            letterSpacing: Number(event.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <input
                        type="number"
                        step="0.5"
                        value={selectedNode.letterSpacing}
                        onChange={(event) =>
                          updateSelectedTextNode({
                            letterSpacing: Number(event.target.value),
                          })
                        }
                        className="w-20 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200"
                      />
                    </div>
                  </label>
                </div>
              ) : (
                <div>Image tools will appear here</div>
              )}
            </div>
          </div>
        }
      >
        <CanvasStage
          nodes={nodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={updateNode}
          onEditImage={handleEditImage}
          canvasWidth={canvasPx?.width ?? 0}
          canvasHeight={canvasPx?.height ?? 0}
          isCanvasValid={isCanvasValid}
        />
      </EditorLayout>
      <ImageEditModal
        file={imageFile}
        sourceUrl={editingImageSrc}
        isOpen={isImageModalOpen}
        onClose={handleCloseImageModal}
        allowBackgroundRemoval={!editingImageId}
        variant={editingImageId ? 'crop-only' : 'full'}
        onAddToCanvas={handleAddImageFromModal}
      />
    </div>
  )
}

export default StickerEditorPage
