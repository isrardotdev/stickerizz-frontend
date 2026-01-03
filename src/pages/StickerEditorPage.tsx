import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type Konva from 'konva'
import EditorLayout from '../components/editor/EditorLayout'
import Toolbar from '../components/editor/Toolbar'
import CanvasStage from '../components/editor/CanvasStage'
import LayersPanel from '../components/editor/LayersPanel'
import { cmToPx } from '../components/editor/cmPx'
import { generateId } from '../components/editor/types'
import ImageEditModal from '../components/editor/ImageEditModal'
import type { EditorNode, ShapeType } from '../components/editor/types'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { uploadImage } from '../api/assets'
import { createDesign, getDesign, updateDesign } from '../api/designs'
import { getTemplate } from '../api/templates'
import { isEditorDocumentV1 } from '../components/editor/document'

const DEFAULT_WIDTH_CM = '15'
const DEFAULT_HEIGHT_CM = '15'
const DEFAULT_TEXT_FONT = 'Bebas Neue'
const DEFAULT_TEXT_COLOR = '#111827'
const DEFAULT_LETTER_SPACING = 0
const DEFAULT_STROKE_COLOR = '#0f172a'
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_STROKE_JOIN: 'miter' | 'round' | 'bevel' = 'round'
const DEFAULT_SHAPE_FILL = '#60a5fa'
const DEFAULT_SHAPE_STROKE_COLOR = '#0f172a'
const DEFAULT_SHAPE_STROKE_WIDTH = 2
const DEFAULT_SHAPE_CORNER_RADIUS = 16
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

type EditorSnapshot = {
  widthCm: string
  heightCm: string
  nodes: EditorNode[]
}

type StickerEditorPageProps = {
  designId?: string
  templateId?: string
}

const StickerEditorPage = ({ designId, templateId }: StickerEditorPageProps) => {
  const navigate = useNavigate()
  const [widthCm, setWidthCm] = useState(DEFAULT_WIDTH_CM)
  const [heightCm, setHeightCm] = useState(DEFAULT_HEIGHT_CM)
  const [nodes, setNodes] = useState<EditorNode[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [editingImageSrc, setEditingImageSrc] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const rightPanelRef = useRef<HTMLDivElement | null>(null)
  const [rightSplitRatio, setRightSplitRatio] = useState(0.5)
  const [isStrokeOpen, setIsStrokeOpen] = useState(true)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const pendingImageBlobsRef = useRef<Record<string, Blob>>({})
  const sourceTemplateIdRef = useRef<string | null>(null)
  const savedHashRef = useRef<string>('')
  const snapshotRef = useRef<EditorSnapshot>({ widthCm: DEFAULT_WIDTH_CM, heightCm: DEFAULT_HEIGHT_CM, nodes: [] })
  const historyRef = useRef<{
    past: EditorSnapshot[]
    present: EditorSnapshot
    future: EditorSnapshot[]
    lastCoalesceKey: string | null
    lastCoalesceAt: number
  }>({
    past: [],
    present: { widthCm: DEFAULT_WIDTH_CM, heightCm: DEFAULT_HEIGHT_CM, nodes: [] },
    future: [],
    lastCoalesceKey: null,
    lastCoalesceAt: 0,
  })
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null
  const selectedNode =
    selectedId ? nodes.find((node) => node.id === selectedId) ?? null : null

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

  const hashSnapshot = (snapshot: EditorSnapshot) =>
    JSON.stringify({ widthCm: snapshot.widthCm, heightCm: snapshot.heightCm, nodes: snapshot.nodes })

  const syncSnapshotRef = (snapshot: EditorSnapshot) => {
    snapshotRef.current = snapshot
  }

  const refreshUndoRedoFlags = () => {
    setCanUndo(historyRef.current.past.length > 0)
    setCanRedo(historyRef.current.future.length > 0)
  }

  const applySnapshot = (snapshot: EditorSnapshot) => {
    setWidthCm(snapshot.widthCm)
    setHeightCm(snapshot.heightCm)
    setNodes(snapshot.nodes)
    setSelectedIds((prev) => {
      if (prev.length === 0) return prev
      const ids = new Set(snapshot.nodes.map((node) => node.id))
      const next = prev.filter((id) => ids.has(id))
      return next.length ? next : []
    })
    syncSnapshotRef(snapshot)
    setIsDirty(hashSnapshot(snapshot) !== savedHashRef.current)
  }

  const resetHistory = (snapshot: EditorSnapshot, markSaved: boolean) => {
    historyRef.current = {
      past: [],
      present: snapshot,
      future: [],
      lastCoalesceKey: null,
      lastCoalesceAt: 0,
    }
    if (markSaved) {
      savedHashRef.current = hashSnapshot(snapshot)
    }
    applySnapshot(snapshot)
    refreshUndoRedoFlags()
  }

  const commitSnapshot = (
    next: EditorSnapshot,
    options?: { coalesceKey?: string; coalesceWindowMs?: number }
  ) => {
    const now = Date.now()
    const key = options?.coalesceKey ?? null
    const windowMs = options?.coalesceWindowMs ?? 450
    const canCoalesce =
      key &&
      historyRef.current.lastCoalesceKey === key &&
      now - historyRef.current.lastCoalesceAt <= windowMs

    if (!canCoalesce) {
      historyRef.current.past.push(historyRef.current.present)
    }
    historyRef.current.present = next
    historyRef.current.future = []
    historyRef.current.lastCoalesceKey = key
    historyRef.current.lastCoalesceAt = now

    applySnapshot(next)
    refreshUndoRedoFlags()
  }

  const patchPresentWithoutHistory = (next: EditorSnapshot) => {
    historyRef.current.present = next
    historyRef.current.lastCoalesceKey = null
    historyRef.current.lastCoalesceAt = 0
    applySnapshot(next)
  }

  const undo = () => {
    const past = historyRef.current.past
    if (past.length === 0) return
    const previous = past[past.length - 1]
    historyRef.current.past = past.slice(0, -1)
    historyRef.current.future = [historyRef.current.present, ...historyRef.current.future]
    historyRef.current.present = previous
    historyRef.current.lastCoalesceKey = null
    historyRef.current.lastCoalesceAt = 0
    applySnapshot(previous)
    refreshUndoRedoFlags()
  }

  const redo = () => {
    const future = historyRef.current.future
    if (future.length === 0) return
    const next = future[0]
    historyRef.current.future = future.slice(1)
    historyRef.current.past = [...historyRef.current.past, historyRef.current.present]
    historyRef.current.present = next
    historyRef.current.lastCoalesceKey = null
    historyRef.current.lastCoalesceAt = 0
    applySnapshot(next)
    refreshUndoRedoFlags()
  }

  useEffect(() => {
    // Keep snapshotRef in sync for async callbacks.
    syncSnapshotRef({ widthCm, heightCm, nodes })
  }, [heightCm, nodes, widthCm])

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
      strokeEnabled: false,
      strokeColor: DEFAULT_STROKE_COLOR,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      strokeJoin: DEFAULT_STROKE_JOIN,
      x: canvasPx.width / 2 - 120,
      y: canvasPx.height / 2 - 20,
      rotation: 0,
    }
    const base = snapshotRef.current
    commitSnapshot(
      { ...base, nodes: [...base.nodes, node] },
      { coalesceKey: `add-node:${id}`, coalesceWindowMs: 0 }
    )
    setSelectedIds([id])
  }

  const addImageNode = (file: Blob) => {
    if (!canvasPx) return

    const id = generateId()
    const objectUrl = URL.createObjectURL(file)
    pendingImageBlobsRef.current[id] = file
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
        assetOwner: 'user' as const,
      }

      const base = snapshotRef.current
      commitSnapshot(
        { ...base, nodes: [...base.nodes, node] },
        { coalesceKey: `add-node:${id}`, coalesceWindowMs: 0 }
      )
      setSelectedIds([id])
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
    }

    image.src = objectUrl
  }

  const addShapeNode = (shape: ShapeType) => {
    if (!canvasPx) return
    const id = generateId()

    if (shape === 'rect') {
      const width = Math.max(120, canvasPx.width * 0.3)
      const height = Math.max(90, canvasPx.height * 0.2)
      const node: EditorNode = {
        id,
        type: 'shape',
        shape: 'rect',
        width,
        height,
        cornerRadius: DEFAULT_SHAPE_CORNER_RADIUS,
        fill: DEFAULT_SHAPE_FILL,
        strokeEnabled: false,
        strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
        strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
        x: (canvasPx.width - width) / 2,
        y: (canvasPx.height - height) / 2,
        rotation: 0,
      }
      const base = snapshotRef.current
      commitSnapshot(
        { ...base, nodes: [...base.nodes, node] },
        { coalesceKey: `add-node:${id}`, coalesceWindowMs: 0 }
      )
      setSelectedIds([id])
      return
    }

    const radius = Math.max(50, Math.min(canvasPx.width, canvasPx.height) * 0.12)
    const node: EditorNode = {
      id,
      type: 'shape',
      shape: 'circle',
      radius,
      fill: DEFAULT_SHAPE_FILL,
      strokeEnabled: false,
      strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
      strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
      x: canvasPx.width / 2,
      y: canvasPx.height / 2,
      rotation: 0,
    }
    const base = snapshotRef.current
    commitSnapshot(
      { ...base, nodes: [...base.nodes, node] },
      { coalesceKey: `add-node:${id}`, coalesceWindowMs: 0 }
    )
    setSelectedIds([id])
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
    setSelectedIds([id])
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
    pendingImageBlobsRef.current[editingImageId] = file
    const base = snapshotRef.current
    const nextNodes = base.nodes.map((node) => {
        if (node.id !== editingImageId) return node
        if (node.type !== 'image') return node
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
          assetOwner: 'user' as const,
        }
      })
    commitSnapshot({ ...base, nodes: nextNodes }, { coalesceKey: 'image-edit' })
  }

  const updateNode = (
    updatedNode: EditorNode,
    options?: { coalesceKey?: string; coalesceWindowMs?: number }
  ) => {
    const base = snapshotRef.current
    const nextNodes = base.nodes.map((node) =>
      node.id === updatedNode.id ? updatedNode : node
    )
    const isMulti = selectedIds.length > 1 && selectedIds.includes(updatedNode.id)
    commitSnapshot(
      { ...base, nodes: nextNodes },
      isMulti
        ? { coalesceKey: 'multi-transform', coalesceWindowMs: 900 }
        : options
    )
  }

  const updateSelectedTextNode = (
    updates: Partial<Extract<EditorNode, { type: 'text' }>>
  ) => {
    if (!selectedNode || selectedNode.type !== 'text') return
    updateNode(
      { ...selectedNode, ...updates },
      { coalesceKey: `text-props:${selectedNode.id}`, coalesceWindowMs: 650 }
    )
  }

  const updateSelectedShapeNode = (
    updates: Partial<Extract<EditorNode, { type: 'shape' }>>
  ) => {
    if (!selectedNode || selectedNode.type !== 'shape') return
    updateNode(
      { ...selectedNode, ...updates } as EditorNode,
      { coalesceKey: `shape-props:${selectedNode.id}`, coalesceWindowMs: 650 }
    )
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

  const requestDeleteNodes = (ids: string[]) => {
    if (ids.length === 0) return
    setPendingDeleteIds(ids)
  }

  const confirmDeleteNodes = () => {
    if (!pendingDeleteIds?.length) return
    const ids = new Set(pendingDeleteIds)
    const base = snapshotRef.current
    const nextNodes = base.nodes.filter((node) => !ids.has(node.id))
    commitSnapshot({ ...base, nodes: nextNodes }, { coalesceKey: 'delete-node', coalesceWindowMs: 0 })
    setSelectedIds((prev) => prev.filter((id) => !ids.has(id)))
    setPendingDeleteIds(null)
  }

  const reorderNodes = (orderedIds: string[]) => {
    const base = snapshotRef.current
    const lookup = new Map(base.nodes.map((node) => [node.id, node]))
    const ordered = orderedIds
      .map((id) => lookup.get(id))
      .filter((node): node is EditorNode => Boolean(node))
    commitSnapshot(
      { ...base, nodes: ordered.reverse() },
      { coalesceKey: 'reorder', coalesceWindowMs: 0 }
    )
  }

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

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    const load = async () => {
      setSaveError(null)

      if (designId) {
        const design = await getDesign(designId)
        const doc = design.canvasData
        if (!isEditorDocumentV1(doc)) {
          throw new Error('Unsupported design format.')
        }
        const defaultOwner: 'template' | 'user' = design.sourceTemplateId
          ? 'template'
          : 'user'
        const snapshot: EditorSnapshot = {
          widthCm: doc.canvas.widthCm,
          heightCm: doc.canvas.heightCm,
          nodes: doc.nodes.map((node) => {
            if (node.type !== 'image') return node
            return {
              ...node,
              assetOwner: node.assetOwner ?? defaultOwner,
            }
          }),
        }
        resetHistory(snapshot, true)
        setSelectedIds([])
        pendingImageBlobsRef.current = {}
        sourceTemplateIdRef.current = design.sourceTemplateId
        return
      }

      if (templateId) {
        const template = await getTemplate(templateId)
        const doc = template.canvasData
        if (!isEditorDocumentV1(doc)) {
          throw new Error('Unsupported template format.')
        }
        const snapshot: EditorSnapshot = {
          widthCm: doc.canvas.widthCm,
          heightCm: doc.canvas.heightCm,
          nodes: doc.nodes.map((node) => {
            if (node.type !== 'image') return node
            return {
              ...node,
              assetOwner: node.assetOwner ?? 'template',
            }
          }),
        }
        resetHistory(snapshot, true)
        setSelectedIds([])
        pendingImageBlobsRef.current = {}
        sourceTemplateIdRef.current = templateId
        return
      }

      const snapshot: EditorSnapshot = {
        widthCm: DEFAULT_WIDTH_CM,
        heightCm: DEFAULT_HEIGHT_CM,
        nodes: [],
      }
      resetHistory(snapshot, true)
      sourceTemplateIdRef.current = null
    }

    load().catch((error) => {
      setSaveError(error instanceof Error ? error.message : 'Failed to load.')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId, templateId])

  const handleSave = async () => {
    if (!stageRef.current) {
      setSaveError('Canvas not ready.')
      return
    }
    if (!canvasPx) {
      setSaveError('Enter a valid canvas size before saving.')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const baseSnapshot = snapshotRef.current
      let nextNodes = baseSnapshot.nodes
      const pending = pendingImageBlobsRef.current

      const uploadIds = Object.keys(pending)
      console.info('[editor.save] start', {
        designId: designId ?? null,
        pendingImages: uploadIds.length,
        nodeCount: baseSnapshot.nodes.length,
      })
      for (const id of uploadIds) {
        const blob = pending[id]
        if (!blob) continue
        const existingNode = nextNodes.find(
          (node) => node.id === id && node.type === 'image'
        )
        if (!existingNode || existingNode.type !== 'image') {
          delete pending[id]
          continue
        }
        console.info('[editor.save] uploading design image', { nodeId: id, size: blob.size })
        const asset = await uploadImage(blob, `image_${id}.png`)
        console.info('[editor.save] uploaded design image', {
          nodeId: id,
          publicId: asset.publicId,
        })
        nextNodes = nextNodes.map((node) => {
          if (node.id !== id || node.type !== 'image') return node
          if (node.src.startsWith('blob:')) {
            URL.revokeObjectURL(node.src)
          }
          return {
            ...node,
            src: asset.url,
            assetPublicId: asset.publicId,
            assetOwner: 'user' as const,
          }
        })
        delete pending[id]
      }

      const stage = stageRef.current
      const previousScale = stage.scale()
      const previousPosition = stage.position()

      console.info('[editor.save] generating preview', {
        width: Math.round(canvasPx.width),
        height: Math.round(canvasPx.height),
      })

      let dataUrl = ''
      try {
        stage.scale({ x: 1, y: 1 })
        stage.position({ x: 0, y: 0 })
        stage.batchDraw()
        dataUrl = stage.toDataURL({
          x: 0,
          y: 0,
          width: canvasPx.width,
          height: canvasPx.height,
          pixelRatio: 2,
        })
      } finally {
        stage.scale(previousScale)
        stage.position(previousPosition)
        stage.batchDraw()
      }

      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        throw new Error(
          'Failed to generate preview image. If you have external images, ensure they allow CORS.'
        )
      }
      const previewBlob = await (await fetch(dataUrl)).blob()
      console.info('[editor.save] uploading preview', {
        size: previewBlob.size,
      })
      const previewAsset = await uploadImage(previewBlob, 'preview.png')
      console.info('[editor.save] uploaded preview', { publicId: previewAsset.publicId })

      const canvasData = {
        schemaVersion: 1 as const,
        canvas: { widthCm: baseSnapshot.widthCm, heightCm: baseSnapshot.heightCm },
        nodes: nextNodes,
        meta: {
          ...(sourceTemplateIdRef.current
            ? { sourceTemplateId: sourceTemplateIdRef.current }
            : {}),
          previewAssetPublicId: previewAsset.publicId,
          previewBytes: previewBlob.size,
          previewWidth: previewAsset.width,
          previewHeight: previewAsset.height,
        },
      }

      if (designId) {
        console.info('[editor.save] updating design', { designId })
        await updateDesign(designId, { canvasData, previewUrl: previewAsset.url })
        const nextSnapshot: EditorSnapshot = { ...baseSnapshot, nodes: nextNodes }
        patchPresentWithoutHistory(nextSnapshot)
        savedHashRef.current = hashSnapshot(nextSnapshot)
        setIsDirty(false)
        console.info('[editor.save] update complete', { designId })
        return
      }

      console.info('[editor.save] creating design')
      const created = await createDesign({
        canvasData,
        previewUrl: previewAsset.url,
        sourceTemplateId: sourceTemplateIdRef.current ?? undefined,
      })
      const nextSnapshot: EditorSnapshot = { ...baseSnapshot, nodes: nextNodes }
      patchPresentWithoutHistory(nextSnapshot)
      savedHashRef.current = hashSnapshot(nextSnapshot)
      setIsDirty(false)
      console.info('[editor.save] create complete', { designId: created.id })
      navigate(`/canvas/${created.id}`, { replace: true })
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save failed.')
    } finally {
      setIsSaving(false)
    }
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
      if (isEditableElementFocused()) return
      const isMeta = event.metaKey || event.ctrlKey
      if (!isMeta) return

      if (event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }

      if (event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full w-full flex-col">
      <EditorLayout
        topBar={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Stickerizz Editor</span>
              {isDirty ? (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200">
                  Unsaved
                </span>
              ) : null}
              {saveError ? (
                <span className="text-xs text-red-300">{saveError}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={undo}
                disabled={!canUndo}
              >
                Undo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={redo}
                disabled={!canRedo}
              >
                Redo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        }
        toolbar={
          <Toolbar
            widthCm={widthCm}
            heightCm={heightCm}
            onWidthCmChange={(value) => {
              const base = snapshotRef.current
              commitSnapshot(
                { ...base, widthCm: value },
                { coalesceKey: 'canvas-size', coalesceWindowMs: 900 }
              )
            }}
            onHeightCmChange={(value) => {
              const base = snapshotRef.current
              commitSnapshot(
                { ...base, heightCm: value },
                { coalesceKey: 'canvas-size', coalesceWindowMs: 900 }
              )
            }}
            onAddText={addTextNode}
            onAddShape={addShapeNode}
            onUploadImage={handleUploadImage}
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
                selectedIds={selectedIds}
                onSelect={(id) => setSelectedIds([id])}
                onReorder={reorderNodes}
                onDelete={(id) => requestDeleteNodes([id])}
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
              {selectedIds.length > 1 ? (
                <div className="flex h-full flex-col gap-4">
                  <div className="text-xs uppercase tracking-[0.08em] text-slate-400">
                    Selection
                  </div>
                  <div className="text-sm text-slate-200">
                    {selectedIds.length} items selected
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    className="w-full"
                    onClick={() => requestDeleteNodes(selectedIds)}
                  >
                    Delete selected
                  </Button>
                  <div className="text-xs text-slate-400">
                    Bulk tools (align, distribute, styles) will appear here.
                  </div>
                </div>
              ) : !selectedNode ? (
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
                  <div className="rounded-lg border border-slate-800">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-xs uppercase tracking-[0.08em] text-slate-300"
                      onClick={() => setIsStrokeOpen((prev) => !prev)}
                    >
                      <span>Stroke</span>
                      <span className="text-slate-400">
                        {isStrokeOpen ? '˄' : '˅'}
                      </span>
                    </button>
                    {isStrokeOpen ? (
                      <div className="flex flex-col gap-3 border-t border-slate-800 px-3 py-3 text-sm text-slate-300">
                        {(() => {
                          const strokeEnabled = selectedNode.strokeEnabled ?? false
                          const strokeColor =
                            selectedNode.strokeColor ?? DEFAULT_STROKE_COLOR
                          const strokeWidth =
                            selectedNode.strokeWidth ?? DEFAULT_STROKE_WIDTH
                          const strokeJoin =
                            selectedNode.strokeJoin ?? DEFAULT_STROKE_JOIN
                          return (<>
                        <label className="flex items-center justify-between gap-3">
                          <span>Enable</span>
                          <input
                            type="checkbox"
                            checked={strokeEnabled}
                            onChange={(event) =>
                              updateSelectedTextNode({
                                strokeEnabled: event.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-blue-500"
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3">
                          <span>Color</span>
                          <input
                            type="color"
                            className="h-8 w-10 cursor-pointer rounded-md border border-slate-700 bg-slate-900"
                            value={strokeColor}
                            onChange={(event) =>
                              updateSelectedTextNode({
                                strokeColor: event.target.value,
                              })
                            }
                            disabled={!strokeEnabled}
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          Thickness
                          <input
                            type="range"
                            min="0"
                            max="16"
                            step="0.5"
                            value={strokeWidth}
                            onChange={(event) =>
                              updateSelectedTextNode({
                                strokeWidth: Number(event.target.value),
                              })
                            }
                            disabled={!strokeEnabled}
                            className="w-full"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={strokeWidth}
                            onChange={(event) =>
                              updateSelectedTextNode({
                                strokeWidth: Number(event.target.value),
                              })
                            }
                            disabled={!strokeEnabled}
                            className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          Type
                          <select
                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200"
                            value={strokeJoin}
                            onChange={(event) =>
                              updateSelectedTextNode({
                                strokeJoin: event.target.value as
                                  | 'miter'
                                  | 'round'
                                  | 'bevel',
                              })
                            }
                            disabled={!strokeEnabled}
                          >
                            <option value="round">Round</option>
                            <option value="miter">Miter</option>
                            <option value="bevel">Bevel</option>
                          </select>
                        </label>
                         </> )
                        })()}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : selectedNode.type === 'shape' ? (
                <div className="flex h-full flex-col gap-4">
                  <div className="text-xs uppercase tracking-[0.08em] text-slate-400">
                    Shape Tools
                  </div>
                  <div className="text-sm text-slate-200">
                    {selectedNode.shape === 'rect' ? 'Rectangle' : 'Circle'}
                  </div>

                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    Fill
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-9 w-12 cursor-pointer rounded-md border border-slate-700 bg-slate-900"
                        value={selectedNode.fill}
                        onChange={(event) =>
                          updateSelectedShapeNode({ fill: event.target.value })
                        }
                      />
                      <span className="text-xs text-slate-400">{selectedNode.fill}</span>
                    </div>
                  </label>

                  {selectedNode.shape === 'rect' ? (
                    <label className="flex flex-col gap-2 text-sm text-slate-300">
                      Corner radius
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="120"
                          step="1"
                          value={selectedNode.cornerRadius}
                          onChange={(event) =>
                            updateSelectedShapeNode({
                              cornerRadius: Number(event.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={selectedNode.cornerRadius}
                          onChange={(event) =>
                            updateSelectedShapeNode({
                              cornerRadius: Number(event.target.value),
                            })
                          }
                          className="w-20 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200"
                        />
                      </div>
                    </label>
                  ) : null}

                  <div className="rounded-lg border border-slate-800">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-xs uppercase tracking-[0.08em] text-slate-300"
                      onClick={() => setIsStrokeOpen((prev) => !prev)}
                    >
                      <span>Stroke</span>
                      <span className="text-slate-400">{isStrokeOpen ? '˄' : '˅'}</span>
                    </button>
                    {isStrokeOpen ? (
                      <div className="flex flex-col gap-3 border-t border-slate-800 px-3 py-3 text-sm text-slate-300">
                        <label className="flex items-center justify-between gap-2">
                          <span>Enable</span>
                          <input
                            type="checkbox"
                            checked={selectedNode.strokeEnabled}
                            onChange={(event) =>
                              updateSelectedShapeNode({
                                strokeEnabled: event.target.checked,
                              })
                            }
                            className="h-4 w-4"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          Color
                          <input
                            type="color"
                            className="h-9 w-12 cursor-pointer rounded-md border border-slate-700 bg-slate-900"
                            value={selectedNode.strokeColor}
                            onChange={(event) =>
                              updateSelectedShapeNode({ strokeColor: event.target.value })
                            }
                            disabled={!selectedNode.strokeEnabled}
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          Thickness
                          <input
                            type="range"
                            min="0"
                            max="32"
                            step="0.5"
                            value={selectedNode.strokeWidth}
                            onChange={(event) =>
                              updateSelectedShapeNode({
                                strokeWidth: Number(event.target.value),
                              })
                            }
                            disabled={!selectedNode.strokeEnabled}
                            className="w-full"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={selectedNode.strokeWidth}
                            onChange={(event) =>
                              updateSelectedShapeNode({
                                strokeWidth: Number(event.target.value),
                              })
                            }
                            disabled={!selectedNode.strokeEnabled}
                            className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200"
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
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
          selectedIds={selectedIds}
          onSelectIds={setSelectedIds}
          onChange={updateNode}
          onEditImage={handleEditImage}
          stageRef={stageRef}
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
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteIds?.length)}
        title={
          pendingDeleteIds && pendingDeleteIds.length > 1
            ? `Delete ${pendingDeleteIds.length} items?`
            : 'Delete layer?'
        }
        content={
          pendingDeleteIds && pendingDeleteIds.length > 1
            ? 'This will remove the selected items from the canvas.'
            : 'This will remove the item from the canvas.'
        }
        confirmText={pendingDeleteIds && pendingDeleteIds.length > 1 ? 'Delete all' : 'Delete'}
        confirmVariant="danger"
        onConfirm={confirmDeleteNodes}
        onClose={() => setPendingDeleteIds(null)}
      />
    </div>
  )
}

export default StickerEditorPage
