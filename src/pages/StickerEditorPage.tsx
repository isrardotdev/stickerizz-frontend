import { useMemo, useState } from 'react'
import EditorLayout from '../components/editor/EditorLayout'
import Toolbar from '../components/editor/Toolbar'
import CanvasStage from '../components/editor/CanvasStage'
import LayersPanel from '../components/editor/LayersPanel'
import { cmToPx } from '../components/editor/cmPx'
import { generateId } from '../components/editor/types'
import ImageEditModal from '../components/editor/ImageEditModal'
import type { EditorNode } from '../components/editor/types'

const DEFAULT_WIDTH_CM = '15'
const DEFAULT_HEIGHT_CM = '15'

const StickerEditorPage = () => {
  const [widthCm, setWidthCm] = useState(DEFAULT_WIDTH_CM)
  const [heightCm, setHeightCm] = useState(DEFAULT_HEIGHT_CM)
  const [nodes, setNodes] = useState<EditorNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

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

  const addTextNode = () => {
    if (!canvasPx) return
    const id = generateId()
    const node: EditorNode = {
      id,
      type: 'text',
      text: 'Double click to edit',
      fontSize: 28,
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
    setIsImageModalOpen(true)
  }

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false)
    setImageFile(null)
  }

  const updateNode = (updatedNode: EditorNode) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    )
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

  return (
    <div className="editor-page">
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
          <LayersPanel
            nodes={nodes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={reorderNodes}
          />
        }
      >
        <CanvasStage
          nodes={nodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={updateNode}
          canvasWidth={canvasPx?.width ?? 0}
          canvasHeight={canvasPx?.height ?? 0}
          isCanvasValid={isCanvasValid}
        />
      </EditorLayout>
      <ImageEditModal
        file={imageFile}
        isOpen={isImageModalOpen}
        onClose={handleCloseImageModal}
        onAddToCanvas={addImageNode}
      />
    </div>
  )
}

export default StickerEditorPage
