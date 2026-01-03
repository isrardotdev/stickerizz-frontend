import { useEffect, useRef, useState } from 'react'
import Button, { buttonClassName } from '../ui/Button'
import TextInput from '../ui/TextInput'
import type { ShapeType } from './types'

type ToolbarProps = {
  widthCm: string
  heightCm: string
  onWidthCmChange: (value: string) => void
  onHeightCmChange: (value: string) => void
  onAddText: () => void
  onUploadImage: (file: File) => void
  onAddShape: (shape: ShapeType) => void
  isCanvasValid: boolean
  errorMessage: string | null
  canvasPx: { width: number; height: number } | null
}

const Toolbar = ({
  widthCm,
  heightCm,
  onWidthCmChange,
  onHeightCmChange,
  onAddText,
  onUploadImage,
  onAddShape,
  isCanvasValid,
  errorMessage,
  canvasPx,
}: ToolbarProps) => {
  const uploadDisabled = !isCanvasValid
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false)
  const shapeMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isShapeMenuOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (shapeMenuRef.current?.contains(target)) return
      setIsShapeMenuOpen(false)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [isShapeMenuOpen])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <div className="text-xs uppercase tracking-[0.08em] text-slate-400">
          Canvas Size (cm)
        </div>
        <div className="flex gap-2">
          <TextInput
            type="number"
            step="0.1"
            min="0"
            value={widthCm}
            onChange={(event) => onWidthCmChange(event.target.value)}
            placeholder="Width"
          />
          <TextInput
            type="number"
            step="0.1"
            min="0"
            value={heightCm}
            onChange={(event) => onHeightCmChange(event.target.value)}
            placeholder="Height"
          />
        </div>
        {errorMessage ? (
          <div className="text-xs text-red-300">{errorMessage}</div>
        ) : null}
        {isCanvasValid && canvasPx ? (
          <div className="text-xs text-slate-400">
            {widthCm}cm x {heightCm}cm · {Math.round(canvasPx.width)}px x{' '}
            {Math.round(canvasPx.height)}px
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-xs uppercase tracking-[0.08em] text-slate-400">
          Tools
        </div>
        <Button
          variant="outline"
          align="start"
          onClick={onAddText}
          disabled={!isCanvasValid}
          className="w-full"
        >
          Add Text
        </Button>
        <div ref={shapeMenuRef} className="relative">
          <Button
            variant="outline"
            align="start"
            onClick={() => setIsShapeMenuOpen((prev) => !prev)}
            disabled={!isCanvasValid}
            className="w-full"
          >
            Shapes
          </Button>
          {isShapeMenuOpen ? (
            <div className="absolute left-full top-0 z-50 ml-2 w-44 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  onAddShape('rect')
                  setIsShapeMenuOpen(false)
                }}
              >
                <span>Rectangle</span>
                <span className="text-xs text-slate-400">R</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  onAddShape('circle')
                  setIsShapeMenuOpen(false)
                }}
              >
                <span>Circle</span>
                <span className="text-xs text-slate-400">O</span>
              </button>
            </div>
          ) : null}
        </div>
        <label
          className={buttonClassName({
            variant: 'outline',
            align: 'start',
            className: uploadDisabled
              ? 'w-full cursor-not-allowed opacity-50'
              : 'w-full',
          })}
          htmlFor="editor-upload"
          aria-disabled={uploadDisabled}
        >
          Upload Image
        </label>
        <input
          id="editor-upload"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              onUploadImage(file)
            }
            event.target.value = ''
          }}
          disabled={uploadDisabled}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-xs uppercase tracking-[0.08em] text-slate-400">
          Hints
        </div>
        <div className="text-xs text-slate-400">- Drag on empty canvas to multi-select</div>
        <div className="text-xs text-slate-400">- Hold Shift to add/remove</div>
        <div className="text-xs text-slate-400">- Hold Space and drag to pan</div>
        <div className="text-xs text-slate-400">- Scroll to zoom</div>
        <div className="text-xs text-slate-400">- Double click text to edit</div>
      </div>
    </div>
  )
}

export default Toolbar
