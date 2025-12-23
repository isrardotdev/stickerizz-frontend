import { useEffect } from 'react'
import type { ReactNode } from 'react'

type ModalProps = {
  isOpen: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

const Modal = ({ isOpen, title, onClose, children, footer }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
      >
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            x
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}

export default Modal
