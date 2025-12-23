import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import Modal from '../ui/Modal'
import { getCroppedImageBlob } from './imageUtils'
import { removeBackground } from '../../api'

type ImageEditModalProps = {
  file: File | null
  isOpen: boolean
  onClose: () => void
  onAddToCanvas: (image: Blob) => void
}

type ImageSize = { width: number; height: number }

const ImageEditModal = ({
  file,
  isOpen,
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)

  const aspect = useMemo(() => {
    if (cropMode === 'square') return 1
    if (!imageSize?.width || !imageSize?.height) return undefined
    return imageSize.width / imageSize.height
  }, [cropMode, imageSize])

  useEffect(() => {
    if (!file || !isOpen) {
      setImageUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isOpen])

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

  const handleRemoveBackground = async () => {
    if (!imageUrl) return
    const area = getActiveCropArea()
    if (!area) return

    setIsProcessing(true)
    setError(null)

    try {
      const croppedBlob = await getCroppedImageBlob(imageUrl, area)
      const resultBlob = await removeBackground(croppedBlob)
      const resultUrl = URL.createObjectURL(resultBlob)

      setProcessedBlob(resultBlob)
      setProcessedUrl(resultUrl)
      setStep('erase')
    } catch (err) {
      setError('Background removal failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddDirectToCanvas = async () => {
    if (!imageUrl) return
    const area = getActiveCropArea()
    if (!area) return

    setIsProcessing(true)
    setError(null)

    try {
      const croppedBlob = await getCroppedImageBlob(imageUrl, area)
      onAddToCanvas(croppedBlob)
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
      onAddToCanvas(processedBlob)
      onClose()
      return
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/png')
    })

    onAddToCanvas(blob ?? processedBlob)
    onClose()
  }

  const footer =
    step === 'crop' ? (
      <div className="modal-actions">
        <button
          type="button"
          className="modal-button modal-button--ghost"
          onClick={handleAddDirectToCanvas}
          disabled={isProcessing || !imageUrl}
        >
          Add to canvas
        </button>
        <button
          type="button"
          className="modal-button modal-button--ghost"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="modal-button modal-button--primary"
          onClick={handleRemoveBackground}
          disabled={isProcessing || !imageUrl}
        >
          Magic remove background
        </button>
      </div>
    ) : (
      <div className="modal-actions">
        <button
          type="button"
          className="modal-button modal-button--ghost"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="modal-button modal-button--primary"
          onClick={handleAddToCanvas}
        >
          Add to canvas
        </button>
      </div>
    )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prepare image"
      footer={footer}
    >
      {step === 'crop' ? (
        <div className="image-edit">
          <div className="cropper-container">
            {imageUrl ? (
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
            ) : (
              <div className="image-edit__placeholder">Loading image...</div>
            )}
          </div>
          <div className="cropper-controls">
            <div className="cropper-toggle">
              <span className="cropper-toggle__label">Crop</span>
              <button
                type="button"
                className={`chip-button${
                  cropMode === 'free' ? ' chip-button--active' : ''
                }`}
                onClick={() => setCropMode('free')}
              >
                Free
              </button>
              <button
                type="button"
                className={`chip-button${
                  cropMode === 'square' ? ' chip-button--active' : ''
                }`}
                onClick={() => setCropMode('square')}
              >
                Square
              </button>
            </div>
            <label className="cropper-label">
              Zoom
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
          </div>
          {error ? <div className="image-edit__error">{error}</div> : null}
          {isProcessing ? (
            <div className="image-edit__processing">Removing background...</div>
          ) : null}
        </div>
      ) : (
        <div className="image-edit">
          <div className="erase-toolbar">
            <button
              type="button"
              className={`modal-button ${
                isErasing ? 'modal-button--primary' : 'modal-button--ghost'
              }`}
              onClick={() => setIsErasing((prev) => !prev)}
            >
              {isErasing ? 'Eraser on' : 'Eraser off'}
            </button>
            <label className="cropper-label">
              Brush
              <input
                type="range"
                min="8"
                max="80"
                step="1"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              className="modal-button modal-button--ghost"
              onClick={handleResetErase}
            >
              Reset erase
            </button>
          </div>
          <div className="erase-canvas">
            <canvas
              ref={canvasRef}
              className="erase-canvas__surface"
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
