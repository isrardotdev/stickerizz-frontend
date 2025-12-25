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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[920px] flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="text-base text-slate-200">{title}</div>
          <button
            type="button"
            className="rounded-full border border-transparent px-2 py-1 text-slate-400 transition-colors hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close dialog"
          >
            x
          </button>
        </div>
        <div className="overflow-auto px-5 py-5">{children}</div>
        {footer ? (
          <div className="border-t border-slate-800 px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

export default Modal
