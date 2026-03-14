import { useEffect, useRef, useState } from 'react'
import { HiChevronLeft } from 'react-icons/hi'
import { HiChevronRight, HiOutlinePhoto, HiOutlineSquare2Stack } from 'react-icons/hi2'
import { TbLetterT } from 'react-icons/tb'
import Button, { buttonClassName } from '../ui/Button'
import type { ShapeType } from './types'

type ToolbarProps = {
  onBack: () => void
  onOpenCanvasSize: () => void
  onAddText: () => void
  onUploadImage: (file: File) => void
  onAddShape: (shape: ShapeType) => void
  isCanvasValid: boolean
  errorMessage: string | null
}

const Toolbar = ({
  onBack,
  onOpenCanvasSize,
  onAddText,
  onUploadImage,
  onAddShape,
  isCanvasValid,
  errorMessage,
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
      <div className="p-2">
        <button
          type="button"
          className="flex items-start gap-3 text-left"
          onClick={onBack}
        >
          <span className="mt-1 flex h-8 w-8 items-center justify-center text-slate-700">
            <HiChevronLeft className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-serif text-3xl leading-none tracking-tight text-slate-950">
              Sticker editor
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Customzie your design
            </span>
          </span>
        </button>
        {errorMessage ? (
          <div className="mt-3 text-xs text-red-600">{errorMessage}</div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Insert
          </div>
          <button
            type="button"
            className="cursor-pointer text-[11px] font-semibold underline underline-offset-4 text-brand-800 transition-colors hover:text-brand-900"
            onClick={onOpenCanvasSize}
          >
            Canvas size
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          <Button
            tone="light"
            variant="outline"
            align="start"
            onClick={onAddText}
            disabled={!isCanvasValid}
            className="w-full"
          >
            <TbLetterT className="mr-2 h-4 w-4" aria-hidden="true" />
            Text
          </Button>
          <div ref={shapeMenuRef} className="relative">
            <Button
              tone="light"
              variant="outline"
              align="start"
              onClick={() => setIsShapeMenuOpen((prev) => !prev)}
              disabled={!isCanvasValid}
              className="w-full"
            >
              <HiOutlineSquare2Stack className="mr-2 h-4 w-4" aria-hidden="true" />
              Shapes
              <HiChevronRight className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
            </Button>
            {isShapeMenuOpen ? (
              <div className="absolute left-full top-0 z-50 ml-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/80">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-brand-50"
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
                  className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-brand-50"
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
              tone: 'light',
              variant: 'outline',
              align: 'start',
              className: uploadDisabled
                ? 'w-full cursor-not-allowed opacity-50'
                : 'w-full',
          })}
          htmlFor="editor-upload"
          aria-disabled={uploadDisabled}
        >
          <HiOutlinePhoto className="mr-2 h-4 w-4" aria-hidden="true" />
          Image
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
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tips
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500">
          <div>Drag across the canvas to select more than one item.</div>
          <div>Hold Shift to add or remove items from your selection.</div>
          <div>Hold Space and drag to move around the canvas.</div>
          <div>Use your scroll wheel to zoom in or out.</div>
          <div>Double-click text to change the wording.</div>
        </div>
      </div>
    </div>
  )
}

export default Toolbar
