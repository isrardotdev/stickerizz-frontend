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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[2rem] border border-white bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,252,0.98))] shadow-[0_24px_80px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/80"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/75 px-5 py-4 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              Stickerizz
            </div>
            <div className="truncate font-serif text-2xl tracking-tight text-slate-950">
              {title}
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-brand-200 hover:text-brand-800"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="overflow-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>
        {footer ? (
          <div className="border-t border-slate-200 bg-white/70 px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

export default Modal
