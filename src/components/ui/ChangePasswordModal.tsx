import { useState } from 'react'
import { HiEye, HiEyeSlash } from 'react-icons/hi2'
import Modal from './Modal'
import Button from './Button'
import { changePassword } from '../../api/auth'
import { getApiErrorMessage } from '../../api/errors'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const PasswordField = ({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
}) => {
  const [visible, setVisible] = useState(false)

  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      {label}
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-brand-500"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  )
}

const ChangePasswordModal = ({ isOpen, onClose }: Props) => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const reset = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
  }

  const handleClose = () => {
    reset()
    setSuccess(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await changePassword({ oldPassword, newPassword })
      reset()
      setSuccess(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to change password. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} title="Reset password" onClose={handleClose}>
      {success ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-green-600" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Password updated</p>
            <p className="mt-1 text-sm text-slate-500">Your password has been changed successfully.</p>
          </div>
          <Button type="button" variant="primary" tone="light" onClick={handleClose} className="mt-2">
            Done
          </Button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <PasswordField
            label="Current password"
            value={oldPassword}
            onChange={setOldPassword}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" tone="light" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              tone="light"
              disabled={isLoading}
              className="border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
            >
              {isLoading ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default ChangePasswordModal
