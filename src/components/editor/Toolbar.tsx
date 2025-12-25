import Button, { buttonClassName } from '../ui/Button'
import TextInput from '../ui/TextInput'

type ToolbarProps = {
  widthCm: string
  heightCm: string
  onWidthCmChange: (value: string) => void
  onHeightCmChange: (value: string) => void
  onAddText: () => void
  onUploadImage: (file: File) => void
  onDeleteSelected: () => void
  canDelete: boolean
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
  onDeleteSelected,
  canDelete,
  isCanvasValid,
  errorMessage,
  canvasPx,
}: ToolbarProps) => {
  const uploadDisabled = !isCanvasValid

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
        <Button
          variant="outline"
          align="start"
          onClick={onDeleteSelected}
          disabled={!canDelete}
          className="w-full"
        >
          Delete Selected
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-xs uppercase tracking-[0.08em] text-slate-400">
          Hints
        </div>
        <div className="text-xs text-slate-400">- Drag empty space to pan</div>
        <div className="text-xs text-slate-400">- Scroll to zoom</div>
        <div className="text-xs text-slate-400">- Double click text to edit</div>
      </div>
    </div>
  )
}

export default Toolbar
