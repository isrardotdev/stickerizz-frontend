import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ChipButton from '../ui/ChipButton'
import { getCroppedImageBlob } from './imageUtils'
import { removeBackground } from '../../api'
import { cn } from '../ui/classNames'

type CropMeta = {
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}

type ImageEditVariant = 'full' | 'crop-only'

type ImageEditModalProps = {
  file: File | null
  sourceUrl?: string | null
  isOpen: boolean
  variant?: ImageEditVariant
  allowBackgroundRemoval?: boolean
  onClose: () => void
  onAddToCanvas: (image: Blob, cropMeta?: CropMeta) => void
}

type ImageSize = { width: number; height: number }
type CropHandle = 'top' | 'right' | 'bottom' | 'left'

const MIN_CROP_SIZE = 24

const ImageEditModal = ({
  file,
  sourceUrl,
  isOpen,
  variant = 'full',
  allowBackgroundRemoval = true,
  onClose,
  onAddToCanvas,
}: ImageEditModalProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [imageSize, setImageSize] = useState<ImageSize | null>(null)
  const [cropMode, setCropMode] = useState<'free' | 'square'>('free')
  const [step, setStep] = useState<'crop' | 'erase'>('crop')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [isErasing, setIsErasing] = useState(true)
  const [brushSize, setBrushSize] = useState(26)
  const [cropMeta, setCropMeta] = useState<CropMeta | null>(null)
  const [cropRect, setCropRect] = useState<Area | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cropImageRef = useRef<HTMLImageElement | null>(null)
  const dragStateRef = useRef<{
    handle: CropHandle
    startX: number
    startY: number
    startRect: Area
    scaleX: number
    scaleY: number
  } | null>(null)
  const isDrawingRef = useRef(false)

  const aspect = useMemo(() => (cropMode === 'square' ? 1 : undefined), [cropMode])

  useEffect(() => {
    if (!isOpen) {
      setImageUrl(null)
      return
    }

    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }

    if (sourceUrl) {
      setImageUrl(sourceUrl)
      return
    }

    setImageUrl(null)
  }, [file, isOpen, sourceUrl])

  useEffect(() => {
    if (!isOpen) {
      setStep('crop')
      setIsProcessing(false)
      setError(null)
      setProcessedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setProcessedBlob(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setImageSize(null)
      setCropMode('free')
      setIsErasing(true)
      setBrushSize(26)
      setCropMeta(null)
      setCropRect(null)
      isDrawingRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!processedUrl) return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const image = new Image()
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      context.globalCompositeOperation = 'source-over'
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0)
    }
    image.src = processedUrl
  }, [processedUrl])

  const handleCropComplete = (_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels)
  }

  const getActiveCropArea = () => {
    if (!imageSize) return null
    if (variant === 'crop-only') {
      return (
        cropRect ?? {
          x: 0,
          y: 0,
          width: imageSize.width,
          height: imageSize.height,
        }
      )
    }
    return (
      croppedArea ??
      ({
        x: 0,
        y: 0,
        width: imageSize.width,
        height: imageSize.height,
      } as Area)
    )
  }

  const getCropMeta = (area: Area) => {
    if (!imageSize) return null
    return {
      width: Math.round(area.width),
      height: Math.round(area.height),
      originalWidth: imageSize.width,
      originalHeight: imageSize.height,
    }
  }

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

  const getImageScale = () => {
    if (!cropImageRef.current || !imageSize) return null
    const rect = cropImageRef.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    return {
      scaleX: imageSize.width / rect.width,
      scaleY: imageSize.height / rect.height,
    }
  }

  const startCropDrag = (handle: CropHandle, event: PointerEvent) => {
    if (!cropRect || !imageSize) return
    const scale = getImageScale()
    if (!scale) return
    event.preventDefault()
    dragStateRef.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startRect: cropRect,
      scaleX: scale.scaleX,
      scaleY: scale.scaleY,
    }
    window.addEventListener('pointermove', handleCropDrag)
    window.addEventListener('pointerup', stopCropDrag)
  }

  const handleCropDrag = (event: globalThis.PointerEvent) => {
    const dragState = dragStateRef.current
    if (!dragState || !imageSize) return
    const dx = (event.clientX - dragState.startX) * dragState.scaleX
    const dy = (event.clientY - dragState.startY) * dragState.scaleY
    const start = dragState.startRect
    let next = { ...start }

    switch (dragState.handle) {
      case 'left': {
        const nextX = clamp(start.x + dx, 0, start.x + start.width - MIN_CROP_SIZE)
        next.x = nextX
        next.width = start.width - (nextX - start.x)
        break
      }
      case 'right': {
        const maxWidth = imageSize.width - start.x
        next.width = clamp(start.width + dx, MIN_CROP_SIZE, maxWidth)
        break
      }
      case 'top': {
        const nextY = clamp(start.y + dy, 0, start.y + start.height - MIN_CROP_SIZE)
        next.y = nextY
        next.height = start.height - (nextY - start.y)
        break
      }
      case 'bottom': {
        const maxHeight = imageSize.height - start.y
        next.height = clamp(start.height + dy, MIN_CROP_SIZE, maxHeight)
        break
      }
      default:
        break
    }

    setCropRect(next)
  }

  const stopCropDrag = () => {
    dragStateRef.current = null
    window.removeEventListener('pointermove', handleCropDrag)
    window.removeEventListener('pointerup', stopCropDrag)
  }

  useEffect(() => {
    return () => {
      stopCropDrag()
    }
  }, [])

  const handleRemoveBackground = async () => {
    if (!imageUrl) return
    const area = getActiveCropArea()
    if (!area) return

    setIsProcessing(true)
    setError(null)
    setCropMeta(getCropMeta(area))

    try {
      const croppedBlob = await getCroppedImageBlob(imageUrl, area)
      const resultBlob = await removeBackground(croppedBlob)
      const resultUrl = URL.createObjectURL(resultBlob)

      setProcessedBlob(resultBlob)
      setProcessedUrl(resultUrl)
      if (variant === 'full') {
        setStep('erase')
      }
    } catch (err) {
      setError('Background removal failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddDirectToCanvas = async () => {
    console.log("Adding direct to canvas", { area: getActiveCropArea(), variant });
    if (!imageUrl) return
    const area = getActiveCropArea()
    if (!area) return

    setIsProcessing(true)
    setError(null)
    const nextMeta = getCropMeta(area)

    try {
      const croppedBlob = await getCroppedImageBlob(imageUrl, area)
      onAddToCanvas(croppedBlob, nextMeta ?? undefined)
      onClose()
    } catch (err) {
      setError('Unable to crop the image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getPointerPosition = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isErasing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const point = getPointerPosition(event)
    if (!point) return

    event.currentTarget.setPointerCapture(event.pointerId)
    context.globalCompositeOperation = 'destination-out'
    context.lineWidth = brushSize
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = 'rgba(0,0,0,1)'
    context.beginPath()
    context.moveTo(point.x, point.y)
    isDrawingRef.current = true
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isErasing || !isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const point = getPointerPosition(event)
    if (!point) return

    context.lineTo(point.x, point.y)
    context.stroke()
  }

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    isDrawingRef.current = false
  }

  const handleResetErase = () => {
    if (!processedUrl) return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const image = new Image()
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      context.globalCompositeOperation = 'source-over'
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0)
    }
    image.src = processedUrl
  }

  const handleAddToCanvas = async () => {
    if (!processedBlob) return
    const canvas = canvasRef.current

    if (!canvas) {
      onAddToCanvas(processedBlob, cropMeta ?? undefined)
      onClose()
      return
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/png')
    })

    onAddToCanvas(blob ?? processedBlob, cropMeta ?? undefined)
    onClose()
  }

  const footer =
    step === 'crop' || variant === 'crop-only' ? (
      <div className="flex justify-end gap-2.5">
        <Button
          type="button"
          variant="ghost"
          onClick={handleAddDirectToCanvas}
          disabled={isProcessing || !imageUrl}
        >
          Add to canvas
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {allowBackgroundRemoval && variant === 'full' ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleRemoveBackground}
            disabled={isProcessing || !imageUrl}
          >
            Magic remove background
          </Button>
        ) : null}
      </div>
    ) : (
      <div className="flex justify-end gap-2.5">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={handleAddToCanvas}>
          Add to canvas
        </Button>
      </div>
    )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prepare image"
      footer={footer}
    >
      {step === 'crop' || variant === 'crop-only' ? (
        <div className="flex flex-col gap-4">
          <div className={cn("relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950", variant === 'crop-only' ? 'h-auto' : 'h-[360px]')}>
            {imageUrl ? (
              variant === 'crop-only' ? (
                <div className="relative flex h-full w-full items-center justify-center">
                  <div className="relative inline-block max-h-full max-w-full">
                    <img
                      ref={cropImageRef}
                      src={imageUrl}
                      alt="Crop source"
                      className="block max-h-full max-w-full"
                      onLoad={(event) => {
                        const image = event.currentTarget
                        const nextSize = {
                          width: image.naturalWidth,
                          height: image.naturalHeight,
                        }
                        setImageSize(nextSize)
                        setCropRect({
                          x: 0,
                          y: 0,
                          width: nextSize.width,
                          height: nextSize.height,
                        })
                      }}
                    />
                    {cropRect && imageSize ? (
                      <div
                        className="absolute rounded-md border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(8,10,15,0.65)]"
                        style={{
                          left: `${(cropRect.x / imageSize.width) * 100}%`,
                          top: `${(cropRect.y / imageSize.height) * 100}%`,
                          width: `${(cropRect.width / imageSize.width) * 100}%`,
                          height: `${(cropRect.height / imageSize.height) * 100}%`,
                        }}
                      >
                        <div
                          className="absolute left-1/2 -top-[6px] h-[10px] w-[44px] -translate-x-1/2 cursor-ns-resize rounded-full bg-blue-400 shadow-[0_2px_8px_rgba(15,23,42,0.45)] touch-none"
                          onPointerDown={(event) => startCropDrag('top', event)}
                        />
                        <div
                          className="absolute top-1/2 -right-[6px] h-[44px] w-[10px] -translate-y-1/2 cursor-ew-resize rounded-full bg-blue-400 shadow-[0_2px_8px_rgba(15,23,42,0.45)] touch-none"
                          onPointerDown={(event) => startCropDrag('right', event)}
                        />
                        <div
                          className="absolute left-1/2 -bottom-[6px] h-[10px] w-[44px] -translate-x-1/2 cursor-ns-resize rounded-full bg-blue-400 shadow-[0_2px_8px_rgba(15,23,42,0.45)] touch-none"
                          onPointerDown={(event) => startCropDrag('bottom', event)}
                        />
                        <div
                          className="absolute top-1/2 -left-[6px] h-[44px] w-[10px] -translate-y-1/2 cursor-ew-resize rounded-full bg-blue-400 shadow-[0_2px_8px_rgba(15,23,42,0.45)] touch-none"
                          onPointerDown={(event) => startCropDrag('left', event)}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                  onMediaLoaded={(media) => {
                    setImageSize({
                      width: media.naturalWidth,
                      height: media.naturalHeight,
                    })
                  }}
                  showGrid={false}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading image...
              </div>
            )}
          </div>
          {variant === 'full' ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400">
                  Crop
                </span>
                <ChipButton
                  isActive={cropMode === 'free'}
                  onClick={() => setCropMode('free')}
                >
                  Free
                </ChipButton>
                <ChipButton
                  isActive={cropMode === 'square'}
                  onClick={() => setCropMode('square')}
                >
                  Square
                </ChipButton>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-[180px]"
                />
              </label>
            </div>
          ) : null}
          {variant === 'full' && error ? (
            <div className="text-sm text-red-300">{error}</div>
          ) : null}
          {variant === 'full' && isProcessing ? (
            <div className="text-sm text-blue-300">Removing background...</div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant={isErasing ? 'primary' : 'ghost'}
              onClick={() => setIsErasing((prev) => !prev)}
            >
              {isErasing ? 'Eraser on' : 'Eraser off'}
            </Button>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Brush
              <input
                type="range"
                min="8"
                max="80"
                step="1"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
                className="w-[180px]"
              />
            </label>
            <Button type="button" size="sm" variant="ghost" onClick={handleResetErase}>
              Reset erase
            </Button>
          </div>
          <div className="flex h-[420px] items-center justify-center rounded-xl border border-slate-800 bg-[linear-gradient(45deg,#1b2230_25%,transparent_25%),linear-gradient(-45deg,#1b2230_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1b2230_75%),linear-gradient(-45deg,transparent_75%,#1b2230_75%)] bg-size-[24px_24px] bg-position-[0_0,0_12px,12px_-12px,-12px_0px]">
            <canvas
              ref={canvasRef}
              className="h-auto max-h-full w-auto max-w-full touch-none rounded-xl"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ImageEditModal
