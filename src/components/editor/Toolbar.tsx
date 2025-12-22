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
    <div className="toolbar-section">
      <div className="toolbar-section">
        <div className="toolbar-title">Canvas Size (cm)</div>
        <div className="toolbar-row">
          <input
            type="number"
            step="0.1"
            min="0"
            value={widthCm}
            onChange={(event) => onWidthCmChange(event.target.value)}
            placeholder="Width"
          />
          <input
            type="number"
            step="0.1"
            min="0"
            value={heightCm}
            onChange={(event) => onHeightCmChange(event.target.value)}
            placeholder="Height"
          />
        </div>
        {errorMessage ? (
          <div className="toolbar-error">{errorMessage}</div>
        ) : null}
        {isCanvasValid && canvasPx ? (
          <div className="toolbar-hint">
            {widthCm}cm x {heightCm}cm · {Math.round(canvasPx.width)}px x{' '}
            {Math.round(canvasPx.height)}px
          </div>
        ) : null}
      </div>

      <div className="toolbar-section">
        <div className="toolbar-title">Tools</div>
        <button
          className="toolbar-button"
          onClick={onAddText}
          disabled={!isCanvasValid}
        >
          Add Text
        </button>
        <label
          className={`toolbar-button${uploadDisabled ? ' toolbar-button--disabled' : ''}`}
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
        <button
          className="toolbar-button"
          onClick={onDeleteSelected}
          disabled={!canDelete}
        >
          Delete Selected
        </button>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-title">Hints</div>
        <div className="toolbar-hint">- Drag empty space to pan</div>
        <div className="toolbar-hint">- Scroll to zoom</div>
        <div className="toolbar-hint">- Double click text to edit</div>
      </div>
    </div>
  )
}

export default Toolbar
