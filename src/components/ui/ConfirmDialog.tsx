import type { ReactNode } from 'react'
import Modal from './Modal'
import Button from './Button'

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  content: ReactNode
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onClose: () => void
}

const ConfirmDialog = ({
  isOpen,
  title,
  content,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-slate-300">{content}</div>
    </Modal>
  )
}

export default ConfirmDialog

