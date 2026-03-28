import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Konva from 'konva'
import { Image as KonvaImage, Layer, Rect, Stage } from 'react-konva'
import useImage from 'use-image'
import Button from '../components/ui/Button'
import { listStickers } from '../api/stickers'
import type { SavedSticker } from '../api/stickers'
import {
  cancelPendingPrintJob,
  createPrintCheckoutSession,
  getLatestPendingPrintJob,
} from '../api/print'
import type { PendingPrintJob } from '../api/print'
import type { PaperSize } from '../api/print'
import Modal from '../components/ui/Modal'
import { SurfaceCard } from '../components/layout/DashboardPrimitives'

type Size = { width: number; height: number }

type PlacedSticker = {
  id: string
  stickerId: string
  xMm: number
  yMm: number
  rotationDeg: number
}

const PAPER_SIZES: Record<PaperSize, { widthMm: number; heightMm: number }> = {
  A4: { widthMm: 210, heightMm: 297 },
  LETTER: { widthMm: 215.9, heightMm: 279.4 },
}

const DEFAULT_MARGIN_MM = 7
const DEFAULT_STICKER_GAP_MM = 2
const UNIT_PRICE_INR: Record<PaperSize, number> = {
  A4: 300,
  LETTER: 240,
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

const getExpandedRect = (
  rect: { x: number; y: number; width: number; height: number },
  pad: number
) => ({
  x: rect.x - pad,
  y: rect.y - pad,
  width: rect.width + pad * 2,
  height: rect.height + pad * 2,
})

const getRotatedBounds = (width: number, height: number, rotationDeg: number) => {
  const theta = (rotationDeg * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const w = Math.abs(width * cos) + Math.abs(height * sin)
  const h = Math.abs(width * sin) + Math.abs(height * cos)
  return { width: w, height: h }
}

const SheetStickerImage = ({
  sticker,
  placement,
  selected,
  showBounds,
  gapMm,
  onSelect,
  onChange,
  sheetOriginPx,
  scalePxPerMm,
  allNodeRefs,
}: {
  sticker: SavedSticker
  placement: PlacedSticker
  selected: boolean
  showBounds: boolean
  gapMm: number
  onSelect: () => void
  onChange: (next: PlacedSticker, node?: Konva.Node) => void
  sheetOriginPx: { x: number; y: number }
  scalePxPerMm: number
  allNodeRefs: React.MutableRefObject<Record<string, Konva.Node | null>>
}) => {
  const [image] = useImage(sticker.imageUrl, 'anonymous')
  const widthMm = sticker.widthMm ?? 0
  const heightMm = sticker.heightMm ?? 0

  if (!widthMm || !heightMm) return null

  const widthPx = widthMm * scalePxPerMm
  const heightPx = heightMm * scalePxPerMm
  const xPx = sheetOriginPx.x + (placement.xMm + widthMm / 2) * scalePxPerMm
  const yPx = sheetOriginPx.y + (placement.yMm + heightMm / 2) * scalePxPerMm
  const gapPx = Math.max(0, gapMm) * scalePxPerMm

  return (
    <KonvaImage
      id={placement.id}
      image={image ?? undefined}
      x={xPx}
      y={yPx}
      offsetX={widthPx / 2}
      offsetY={heightPx / 2}
      width={widthPx}
      height={heightPx}
      rotation={placement.rotationDeg}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      ref={(ref) => {
        allNodeRefs.current[placement.id] = ref
      }}
      onDragEnd={(event) => {
        const target = event.target
        const xMm = (target.x() - sheetOriginPx.x) / scalePxPerMm - widthMm / 2
        const yMm = (target.y() - sheetOriginPx.y) / scalePxPerMm - heightMm / 2
        onChange({ ...placement, xMm, yMm }, target)
      }}
      onTransformEnd={() => {}}
      opacity={selected ? 0.95 : 1}
      stroke={showBounds ? (selected ? '#3b82f6' : '#94a3b8') : undefined}
      strokeWidth={showBounds ? Math.max(1, gapPx > 0 ? gapPx / 3 : 1) : 0}
      listening
      perfectDrawEnabled={false}
      shadowEnabled={false}
    />
  )
}

const PrintPage = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({})
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 })

  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const [marginMm, setMarginMm] = useState(DEFAULT_MARGIN_MM)
  const gapMm = DEFAULT_STICKER_GAP_MM
  const [stickers, setStickers] = useState<SavedSticker[]>([])
  const [placed, setPlaced] = useState<PlacedSticker[]>([])
  const placedRef = useRef<PlacedSticker[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCheckoutConfirmOpen, setIsCheckoutConfirmOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [pendingJob, setPendingJob] = useState<PendingPrintJob | null>(null)
  const [isPendingPromptOpen, setIsPendingPromptOpen] = useState(false)
  const [isResolvingPendingJob, setIsResolvingPendingJob] = useState(false)
  const showStickerBounds = true

  const paper = PAPER_SIZES[paperSize]

  const printableRect = useMemo(() => {
    const m = Math.max(0, marginMm)
    return {
      x: m,
      y: m,
      width: paper.widthMm - m * 2,
      height: paper.heightMm - m * 2,
    }
  }, [marginMm, paper.heightMm, paper.widthMm])

  const stageTransform = useMemo(() => {
    if (!containerSize.width || !containerSize.height) {
      return { scale: 1, x: 0, y: 0 }
    }
    const padding = 16
    const availableW = Math.max(1, containerSize.width - padding * 2)
    const availableH = Math.max(1, containerSize.height - padding * 2)
    const scale = Math.min(availableW / paper.widthMm, availableH / paper.heightMm)
    const x = (containerSize.width - paper.widthMm * scale) / 2
    const y = (containerSize.height - paper.heightMm * scale) / 2
    return { scale, x, y }
  }, [containerSize.height, containerSize.width, paper.heightMm, paper.widthMm])

  const sheetOriginPx = useMemo(
    () => ({ x: stageTransform.x, y: stageTransform.y }),
    [stageTransform.x, stageTransform.y]
  )
  const scalePxPerMm = stageTransform.scale
  const mmToPx = (mm: number) => mm * scalePxPerMm

  const printableRectPx = useMemo(() => {
    return {
      x: sheetOriginPx.x + mmToPx(printableRect.x),
      y: sheetOriginPx.y + mmToPx(printableRect.y),
      width: mmToPx(printableRect.width),
      height: mmToPx(printableRect.height),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printableRect, sheetOriginPx.x, sheetOriginPx.y, scalePxPerMm])

  const stickerLookup = useMemo(() => {
    return new Map(stickers.map((sticker) => [sticker.id, sticker]))
  }, [stickers])

  const getPlacementRectPx = (placement: PlacedSticker) => {
    const sticker = stickerLookup.get(placement.stickerId)
    if (!sticker?.widthMm || !sticker.heightMm) return null

    const gapPx = Math.max(0, gapMm) * scalePxPerMm
    const widthPx = mmToPx(sticker.widthMm)
    const heightPx = mmToPx(sticker.heightMm)
    const center = {
      x: sheetOriginPx.x + mmToPx(placement.xMm) + widthPx / 2,
      y: sheetOriginPx.y + mmToPx(placement.yMm) + heightPx / 2,
    }

    const rotated = getRotatedBounds(widthPx, heightPx, placement.rotationDeg)
    const rect = {
      x: center.x - rotated.width / 2,
      y: center.y - rotated.height / 2,
      width: rotated.width,
      height: rotated.height,
    }

    return getExpandedRect(rect, gapPx)
  }

  const validatePlacementRect = (next: PlacedSticker, placements: PlacedSticker[]) => {
    const rect = getPlacementRectPx(next)
    if (!rect) return false

    const inside =
      rect.x >= printableRectPx.x &&
      rect.y >= printableRectPx.y &&
      rect.x + rect.width <= printableRectPx.x + printableRectPx.width &&
      rect.y + rect.height <= printableRectPx.y + printableRectPx.height
    if (!inside) return false

    for (const other of placements) {
      if (other.id === next.id) continue
      const otherRect = getPlacementRectPx(other)
      if (!otherRect) continue
      if (rectsIntersect(rect, otherRect)) return false
    }

    return true
  }

  const findFirstValidPlacement = (args: {
    base: PlacedSticker
    placements: PlacedSticker[]
    start: { xMm: number; yMm: number }
  }) => {
    const { base, placements, start } = args
    const sticker = stickerLookup.get(base.stickerId)
    if (!sticker?.widthMm || !sticker.heightMm) return null

    const stepMm = Math.max(2, gapMm)
    const rings = 140
    const angles = 24

    const tryAt = (xMm: number, yMm: number) => {
      const candidate: PlacedSticker = { ...base, xMm, yMm }
      return validatePlacementRect(candidate, placements) ? candidate : null
    }

    const direct = tryAt(start.xMm, start.yMm)
    if (direct) return direct

    const axis = [
      { dx: stepMm, dy: 0 },
      { dx: -stepMm, dy: 0 },
      { dx: 0, dy: stepMm },
      { dx: 0, dy: -stepMm },
    ]
    for (const { dx, dy } of axis) {
      const found = tryAt(start.xMm + dx, start.yMm + dy)
      if (found) return found
    }

    for (let ring = 1; ring <= rings; ring += 1) {
      const rMm = ring * stepMm
      for (let i = 0; i < angles; i += 1) {
        const theta = (i / angles) * Math.PI * 2
        const found = tryAt(start.xMm + Math.cos(theta) * rMm, start.yMm + Math.sin(theta) * rMm)
        if (found) return found
      }
    }

    return null
  }

  const selectedPlacement = selectedId
    ? placed.find((item) => item.id === selectedId) ?? null
    : null
  const selectedSticker = selectedPlacement
    ? stickers.find((sticker) => sticker.id === selectedPlacement.stickerId) ?? null
    : null

  const applyPendingJobPayloadToCanvas = (job: PendingPrintJob) => {
    const payload = job.payload
    const restored = payload.placements.map((item) => ({
      id: `placed_${Math.random().toString(36).slice(2, 10)}`,
      stickerId: item.stickerId,
      xMm: item.xMm,
      yMm: item.yMm,
      rotationDeg: item.rotationDeg,
    }))
    setPaperSize(payload.paperSize)
    setMarginMm(Math.max(0, payload.marginMm))
    setPlaced(restored)
    setSelectedId(restored[0]?.id ?? null)
    setQuantity(job.quantity > 0 ? job.quantity : payload.quantity ?? 1)
    setError(null)
  }

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
    setIsLoading(true)
    listStickers()
      .then((items) => {
        setStickers(items)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load stickers.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    getLatestPendingPrintJob()
      .then((job) => {
        if (cancelled || !job) return
        setPendingJob(job)
        setIsPendingPromptOpen(true)
      })
      .catch((err) => {
        if (cancelled) return
        console.warn(
          '[print] failed to fetch pending print job',
          err instanceof Error ? err.message : err
        )
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    placedRef.current = placed
  }, [placed])

  useEffect(() => {
    // Keep the refs map trimmed so we don't validate against stale nodes.
    const ids = new Set(placed.map((item) => item.id))
    for (const key of Object.keys(nodeRefs.current)) {
      if (!ids.has(key)) {
        delete nodeRefs.current[key]
      }
    }
  }, [placed])

  const addStickerToSheet = (sticker: SavedSticker) => {
    if (!sticker.widthMm || !sticker.heightMm) {
      setError('This sticker is missing print size metadata. Re-export it from the editor.')
      return
    }

    const id = `placed_${Math.random().toString(36).slice(2, 10)}`
    const base: PlacedSticker = {
      id,
      stickerId: sticker.id,
      xMm: printableRect.x,
      yMm: printableRect.y,
      rotationDeg: 0,
    }
    const found = findFirstValidPlacement({
      base,
      placements: placedRef.current,
      start: { xMm: printableRect.x, yMm: printableRect.y },
    })
    if (!found) {
      window.alert('No space left on the sheet for this sticker.')
      return
    }
    setPlaced((prev) => [...prev, found])
    setSelectedId(found.id)
  }

  const validatePlacement = (
    next: PlacedSticker,
    placements: PlacedSticker[],
    options?: { gapPxOverride?: number }
  ) => {
    const sticker = stickers.find((item) => item.id === next.stickerId)
    if (!sticker?.widthMm || !sticker.heightMm) return false

    const stage = stageRef.current
    const node = nodeRefs.current[next.id]
    if (!stage || !node) return true

    const rect = node.getClientRect({ skipShadow: true, skipStroke: true })
    const gapPx = options?.gapPxOverride ?? Math.max(0, gapMm) * scalePxPerMm
    const expandedRect = getExpandedRect(rect, gapPx)

    const inside =
      expandedRect.x >= printableRectPx.x &&
      expandedRect.y >= printableRectPx.y &&
      expandedRect.x + expandedRect.width <= printableRectPx.x + printableRectPx.width &&
      expandedRect.y + expandedRect.height <= printableRectPx.y + printableRectPx.height

    if (!inside) return false

    for (const other of placements) {
      if (other.id === next.id) continue
      const otherNode = nodeRefs.current[other.id]
      if (!otherNode) continue
      const otherRect = otherNode.getClientRect({ skipShadow: true, skipStroke: true })
      const expandedOther = getExpandedRect(otherRect, gapPx)
      if (rectsIntersect(expandedRect, expandedOther)) {
        return false
      }
    }

    return true
  }

  const findNearestValidCenterPx = (args: {
    node: Konva.Node
    base: PlacedSticker
    sticker: { widthMm: number; heightMm: number }
    placements: PlacedSticker[]
    startCenter: { x: number; y: number }
    originalCenter: { x: number; y: number }
    maxRadiusPx: number
    stepPx: number
    gapPx: number
  }) => {
    const { node, base, sticker, placements, startCenter, originalCenter, maxRadiusPx, stepPx, gapPx } =
      args
    const originalPos = { x: node.x(), y: node.y() }
    const stage = stageRef.current
    if (!stage) return null

    const placementFromCenter = (center: { x: number; y: number }): PlacedSticker => ({
      ...base,
      xMm: (center.x - sheetOriginPx.x) / scalePxPerMm - sticker.widthMm / 2,
      yMm: (center.y - sheetOriginPx.y) / scalePxPerMm - sticker.heightMm / 2,
    })

    const tryCenter = (center: { x: number; y: number }) => {
      node.position(center)
      const candidate = placementFromCenter(center)
      return validatePlacement(candidate, placements, { gapPxOverride: gapPx })
    }

    // First try the requested drop position.
    if (tryCenter(startCenter)) {
      node.position(originalPos)
      stage.batchDraw()
      return startCenter
    }

    // Prefer axis-aligned nudges before spiral search (feels more natural).
    const axisCandidates = [
      { x: startCenter.x + stepPx, y: startCenter.y },
      { x: startCenter.x - stepPx, y: startCenter.y },
      { x: startCenter.x, y: startCenter.y + stepPx },
      { x: startCenter.x, y: startCenter.y - stepPx },
    ]
    for (const candidate of axisCandidates) {
      if (tryCenter(candidate)) {
        node.position(originalPos)
        stage.batchDraw()
        return candidate
      }
    }

    const angles = 20
    for (let r = stepPx; r <= maxRadiusPx; r += stepPx) {
      for (let i = 0; i < angles; i += 1) {
        const theta = (i / angles) * Math.PI * 2
        const center = {
          x: startCenter.x + Math.cos(theta) * r,
          y: startCenter.y + Math.sin(theta) * r,
        }
        if (tryCenter(center)) {
          node.position(originalPos)
          stage.batchDraw()
          return center
        }
      }
    }

    // Finally try snapping back to original position.
    if (tryCenter(originalCenter)) {
      node.position(originalPos)
      stage.batchDraw()
      return originalCenter
    }

    node.position(originalPos)
    stage.batchDraw()
    return null
  }

  const resolvePlacement = (
    next: PlacedSticker,
    existing: PlacedSticker,
    node: Konva.Node,
    placements: PlacedSticker[]
  ) => {
    const sticker = stickers.find((item) => item.id === next.stickerId)
    if (!sticker?.widthMm || !sticker.heightMm) return null

    const widthPx = mmToPx(sticker.widthMm)
    const heightPx = mmToPx(sticker.heightMm)
    const startCenter = {
      x: sheetOriginPx.x + mmToPx(next.xMm) + widthPx / 2,
      y: sheetOriginPx.y + mmToPx(next.yMm) + heightPx / 2,
    }
    const originalCenter = {
      x: sheetOriginPx.x + mmToPx(existing.xMm) + widthPx / 2,
      y: sheetOriginPx.y + mmToPx(existing.yMm) + heightPx / 2,
    }

    const gapPx = Math.max(0, gapMm) * scalePxPerMm
    const stepPx = Math.max(8, gapPx || 0)
    const maxRadiusPx = Math.max(
      200,
      Math.min(printableRectPx.width, printableRectPx.height)
    )

    return findNearestValidCenterPx({
      node,
      base: next,
      sticker: { widthMm: sticker.widthMm, heightMm: sticker.heightMm },
      placements,
      startCenter,
      originalCenter,
      maxRadiusPx,
      stepPx,
      gapPx,
    })
  }

  const updatePlacement = (next: PlacedSticker, node?: Konva.Node) => {
    setPlaced((prev) => {
      const existing = prev.find((item) => item.id === next.id)
      if (!existing) return prev

      const valid = validatePlacement(next, prev)
      if (valid) {
        return prev.map((item) => (item.id === next.id ? next : item))
      }

      const targetNode = node ?? nodeRefs.current[next.id]
      if (!targetNode) return prev

      const resolved = resolvePlacement(next, existing, targetNode, prev)
      if (!resolved) {
        // Revert to existing placement.
        const sticker = stickers.find((item) => item.id === next.stickerId)
        if (sticker?.widthMm && sticker.heightMm) {
          const widthPx = mmToPx(sticker.widthMm)
          const heightPx = mmToPx(sticker.heightMm)
          targetNode.position({
            x: sheetOriginPx.x + mmToPx(existing.xMm) + widthPx / 2,
            y: sheetOriginPx.y + mmToPx(existing.yMm) + heightPx / 2,
          })
        }
        return prev
      }

      const sticker = stickers.find((item) => item.id === next.stickerId)
      if (!sticker?.widthMm || !sticker.heightMm) return prev
      const xMm =
        (resolved.x - sheetOriginPx.x) / scalePxPerMm - sticker.widthMm / 2
      const yMm =
        (resolved.y - sheetOriginPx.y) / scalePxPerMm - sticker.heightMm / 2
      const patched: PlacedSticker = { ...next, xMm, yMm }
      return prev.map((item) => (item.id === next.id ? patched : item))
    })
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setPlaced((prev) => prev.filter((item) => item.id !== selectedId))
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    if (!selectedPlacement) return
    const id = `placed_${Math.random().toString(36).slice(2, 10)}`
    const base: PlacedSticker = {
      ...selectedPlacement,
      id,
      xMm: selectedPlacement.xMm + (selectedSticker?.widthMm ?? 10) + gapMm,
      yMm: selectedPlacement.yMm,
    }
    const found = findFirstValidPlacement({
      base,
      placements: placedRef.current,
      start: { xMm: base.xMm, yMm: base.yMm },
    })
    if (!found) {
      window.alert('No space left on the sheet to duplicate this sticker.')
      return
    }
    setPlaced((prev) => [...prev, found])
    setSelectedId(found.id)
  }

  const handleResumePendingJob = () => {
    if (!pendingJob) return
    applyPendingJobPayloadToCanvas(pendingJob)
    setIsPendingPromptOpen(false)
    setPendingJob(null)
  }

  const handleStartNewFromPendingJob = async () => {
    if (!pendingJob) {
      setIsPendingPromptOpen(false)
      return
    }

    setIsResolvingPendingJob(true)
    try {
      await cancelPendingPrintJob(pendingJob.id)
      setPendingJob(null)
      setPlaced([])
      setSelectedId(null)
      setError(null)
      setIsPendingPromptOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel previous pending order.')
    } finally {
      setIsResolvingPendingJob(false)
    }
  }

  const continuePendingCheckout = () => {
    if (!pendingJob?.checkoutUrl) {
      setError('No checkout URL found for this pending order. Create a fresh order.')
      return
    }
    window.location.href = pendingJob.checkoutUrl
  }

  const createCheckoutSession = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      if (pendingJob?.status === 'PENDING_PAYMENT') {
        await cancelPendingPrintJob(pendingJob.id)
        setPendingJob(null)
      }
      const response = await createPrintCheckoutSession({
        paperSize,
        marginMm,
        placements: placed.map((item) => ({
          stickerId: item.stickerId,
          xMm: item.xMm,
          yMm: item.yMm,
          rotationDeg: item.rotationDeg,
        })),
        quantity,
      })
      setIsCheckoutConfirmOpen(false)
      window.location.href = response.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session.')
    } finally {
      setIsGenerating(false)
    }
  }

  const headerPortal = document.getElementById('header-actions-portal')

  return (
    <>
      {headerPortal && createPortal(
        <div className="flex items-center gap-2">
          <select
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-brand-500"
            value={paperSize}
            onChange={(event) => {
              setPaperSize(event.target.value as PaperSize)
              setPlaced([])
              setSelectedId(null)
            }}
          >
            <option value="A4">A4</option>
            <option value="LETTER">Letter</option>
          </select>
          <Button
            type="button"
            variant="outline"
            tone="light"
            onClick={() => {
              setPlaced([])
              setSelectedId(null)
            }}
          >
            Clear sheet
          </Button>
          <Button
            type="button"
            variant="primary"
            tone="light"
            disabled={placed.length === 0 || isGenerating}
            onClick={() => setIsCheckoutConfirmOpen(true)}
          >
            {isGenerating ? 'Redirecting…' : 'Print my sticker sheet'}
          </Button>
        </div>,
        headerPortal
      )}

      <div className="flex h-full flex-col gap-4">
        {error ? (
          <SurfaceCard className="shrink-0 border-red-200 bg-red-50 text-red-700 ring-0">
            {error}
          </SurfaceCard>
        ) : null}
        {pendingJob ? (
          <SurfaceCard className="shrink-0 border-amber-200 bg-amber-50 ring-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-amber-900">
                You have a pending print order from {new Date(pendingJob.createdAt).toLocaleString()}.
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  tone="light"
                  onClick={handleResumePendingJob}
                >
                  Restore layout
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  tone="light"
                  onClick={continuePendingCheckout}
                  disabled={!pendingJob.checkoutUrl}
                >
                  Continue payment
                </Button>
              </div>
            </div>
          </SurfaceCard>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-4">
          <SurfaceCard className="flex min-h-0 flex-col xl:col-span-1">
            <h2 className="shrink-0 font-serif text-2xl tracking-tight text-slate-950">Stickers</h2>
            {isLoading ? (
              <div className="mt-4 text-sm text-slate-600">Loading…</div>
            ) : (
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col gap-3">
                  {stickers.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      No saved stickers yet. Export stickers first.
                    </div>
                  ) : (
                    stickers.map((sticker) => (
                      <div
                        key={sticker.id}
                        className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-3"
                      >
                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-white p-2">
                          <img
                            src={sticker.imageUrl}
                            alt={sticker.title ?? 'Sticker'}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {sticker.title ?? 'Sticker'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {sticker.widthMm && sticker.heightMm
                              ? `${sticker.widthMm.toFixed(1)}×${sticker.heightMm.toFixed(1)}mm`
                              : 'Missing print size'}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          tone="light"
                          onClick={() => addStickerToSheet(sticker)}
                          disabled={!sticker.widthMm || !sticker.heightMm}
                        >
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </SurfaceCard>

          <div className="grid min-h-0 gap-4 xl:col-span-3 lg:grid-cols-3">
            <SurfaceCard className="flex min-h-0 flex-col lg:col-span-2">
              <div
                ref={containerRef}
                className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100"
              >
                <Stage
                  ref={stageRef}
                  width={containerSize.width}
                  height={containerSize.height}
                  scaleX={1}
                  scaleY={1}
                  x={0}
                  y={0}
                >
                  <Layer>
                    <Rect
                      x={sheetOriginPx.x}
                      y={sheetOriginPx.y}
                      width={mmToPx(paper.widthMm)}
                      height={mmToPx(paper.heightMm)}
                      fill="#ffffff"
                      stroke="#cbd5e1"
                      strokeWidth={0.5}
                      shadowColor="rgba(15,23,42,0.18)"
                      shadowBlur={12}
                      shadowOffset={{ x: 0, y: 6 }}
                    />
                    <Rect
                      x={printableRectPx.x}
                      y={printableRectPx.y}
                      width={printableRectPx.width}
                      height={printableRectPx.height}
                      stroke="#94a3b8"
                      strokeWidth={0.4}
                      dash={[2, 2]}
                      listening={false}
                    />
                  </Layer>
                  <Layer>
                    {placed.map((item) => {
                      const sticker = stickers.find((s) => s.id === item.stickerId)
                      if (!sticker) return null
                      return (
                        <SheetStickerImage
                          key={item.id}
                          sticker={sticker}
                          placement={item}
                          selected={selectedId === item.id}
                          showBounds={showStickerBounds}
                          gapMm={gapMm}
                          sheetOriginPx={sheetOriginPx}
                          scalePxPerMm={scalePxPerMm}
                          allNodeRefs={nodeRefs}
                          onSelect={() => setSelectedId(item.id)}
                          onChange={(next) => {
                            updatePlacement(next)
                          }}
                        />
                      )
                    })}
                  </Layer>
                </Stage>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <h2 className="font-serif text-2xl tracking-tight text-slate-950">Selection</h2>
              {!selectedPlacement || !selectedSticker ? (
                <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Select a sticker on the sheet.
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-4">
                  <div className="text-lg font-semibold text-slate-900">
                    {selectedSticker.title ?? 'Sticker'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedSticker.widthMm?.toFixed(1)}×{selectedSticker.heightMm?.toFixed(1)}mm
                  </div>

                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Rotation ({Math.round(selectedPlacement.rotationDeg)}°)
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={selectedPlacement.rotationDeg}
                      onChange={(event) => {
                        const next: PlacedSticker = {
                          ...selectedPlacement,
                          rotationDeg: Number(event.target.value),
                        }
                        setPlaced((prev) => prev.map((item) => (item.id === next.id ? next : item)))
                        requestAnimationFrame(() => {
                          const node = nodeRefs.current[next.id]
                          if (!node) return
                          updatePlacement(next, node)
                        })
                      }}
                      className="accent-brand-600"
                    />
                  </label>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" tone="light" className="w-full" onClick={duplicateSelected}>
                      Duplicate
                    </Button>
                    <Button type="button" variant="danger" className="w-full" onClick={deleteSelected}>
                      Delete
                    </Button>
                  </div>

                  <div className="text-xs text-slate-500">
                    Stickers can’t overlap and must stay inside the printable area.
                  </div>
                </div>
              )}
            </SurfaceCard>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isPendingPromptOpen && Boolean(pendingJob)}
        title="Resume Pending Print Order?"
        onClose={() => {
          if (isResolvingPendingJob) return
          setIsPendingPromptOpen(false)
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              tone="light"
              disabled={isResolvingPendingJob}
              onClick={() => void handleStartNewFromPendingJob()}
            >
              {isResolvingPendingJob ? 'Please wait…' : 'Start New'}
            </Button>
            <Button
              type="button"
              variant="primary"
              tone="light"
              disabled={isResolvingPendingJob}
              onClick={handleResumePendingJob}
            >
              Resume
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm leading-6 text-slate-600">
          <p>
            We found a pending print order that has not been paid yet.
          </p>
          <p>
            Choose <span className="font-semibold">Resume</span> to restore the saved layout and continue checkout,
            or <span className="font-semibold">Start New</span> to cancel it and create a fresh order.
          </p>
        </div>
      </Modal>
      <Modal
        isOpen={isCheckoutConfirmOpen}
        title="Confirm Print Order"
        onClose={() => {
          if (isGenerating) return
          setIsCheckoutConfirmOpen(false)
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCheckoutConfirmOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              tone="light"
              onClick={() => void createCheckoutSession()}
              disabled={isGenerating}
            >
              {isGenerating ? 'Please wait…' : 'Print Order'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm leading-6 text-slate-600">
          <p>
            You are about to place a print order for a {paperSize} sheet.
          </p>
          <p>
            Quantity: <span className="font-semibold">{quantity}</span>
          </p>
          <p>
            Price: <span className="font-semibold">INR {UNIT_PRICE_INR[paperSize]} each</span>
          </p>
          <p>
            Total:{' '}
            <span className="font-semibold">
              INR {UNIT_PRICE_INR[paperSize] * quantity}
            </span>
          </p>
          <p className="text-xs text-slate-500">
            You will be redirected to WooCommerce checkout to complete payment.
          </p>
        </div>
      </Modal>
    </>
  )
}

export default PrintPage
