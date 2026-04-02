import { useState, useEffect } from 'react'
import Modal from './Modal'
import TextInput from './TextInput'
import Button from './Button'
import type { Address, AddressInput } from '../../api/addresses'

type AddressModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (input: AddressInput) => Promise<void>
  initial?: Address | null
}

const emptyFields = (): AddressInput => ({
  fullName: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  isDefault: false,
})

const AddressModal = ({ isOpen, onClose, onSave, initial }: AddressModalProps) => {
  const [fields, setFields] = useState<AddressInput>(emptyFields())
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingPincode, setIsFetchingPincode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFields(
        initial
          ? {
              fullName: initial.fullName,
              email: initial.email,
              phone: initial.phone,
              line1: initial.line1,
              line2: initial.line2 ?? '',
              city: initial.city,
              state: initial.state,
              postalCode: initial.postalCode,
              country: initial.country,
              isDefault: initial.isDefault,
            }
          : emptyFields()
      )
      setError(null)
    }
  }, [isOpen, initial])

  const set = (key: keyof AddressInput, value: string | boolean) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  const handlePincodeChange = async (value: string) => {
    set('postalCode', value)
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      setIsFetchingPincode(true)
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`)
        const data = (await res.json()) as Array<{
          Status: string
          PostOffice?: Array<{ District: string; Name: string; State: string }>
        }>
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.[0]) {
          const po = data[0].PostOffice[0]
          setFields((prev) => ({
            ...prev,
            city: po.District || po.Name || prev.city,
            state: po.State || prev.state,
          }))
        }
      } catch {
        // ignore — user can type manually
      } finally {
        setIsFetchingPincode(false)
      }
    }
  }

  const handleSave = async () => {
    if (
      !fields.fullName.trim() ||
      !fields.email.trim() ||
      !fields.phone.trim() ||
      !fields.line1.trim() ||
      !fields.city.trim() ||
      !fields.state.trim() ||
      !fields.postalCode.trim()
    ) {
      setError('Please fill in all required fields.')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await onSave(fields)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={initial ? 'Edit Address' : 'Add Address'}
      onClose={() => {
        if (isSaving) return
        onClose()
      }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            tone="light"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            tone="light"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Saving…' : 'Save address'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            <span>Full name <span className="text-red-500">*</span></span>
            <TextInput
              tone="light"
              className="rounded-lg"
              placeholder="Rahul Sharma"
              value={fields.fullName}
              onChange={(e) => set('fullName', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            <span>Email <span className="text-red-500">*</span></span>
            <TextInput
              tone="light"
              className="rounded-lg"
              type="email"
              placeholder="rahul@example.com"
              value={fields.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            <span>Phone <span className="text-red-500">*</span></span>
            <TextInput
              tone="light"
              className="rounded-lg"
              type="tel"
              placeholder="+91 98765 43210"
              value={fields.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            <span>PIN code <span className="text-red-500">*</span></span>
            <div className="relative">
              <TextInput
                tone="light"
                className="rounded-lg"
                placeholder="400001"
                maxLength={6}
                value={fields.postalCode}
                onChange={(e) => void handlePincodeChange(e.target.value)}
              />
              {isFetchingPincode ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  Looking up…
                </span>
              ) : null}
            </div>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          <span>Address line 1 <span className="text-red-500">*</span></span>
          <TextInput
            tone="light"
            className="rounded-lg"
            placeholder="Flat / house no., building name, street"
            value={fields.line1}
            onChange={(e) => set('line1', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          <span>Address line 2 <span className="text-xs text-slate-400">(optional)</span></span>
          <TextInput
            tone="light"
            className="rounded-lg"
            placeholder="Area, landmark"
            value={fields.line2 ?? ''}
            onChange={(e) => set('line2', e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            <span>City <span className="text-red-500">*</span></span>
            <TextInput
              tone="light"
              className="rounded-lg"
              placeholder="Mumbai"
              value={fields.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            <span>State <span className="text-red-500">*</span></span>
            <TextInput
              tone="light"
              className="rounded-lg"
              placeholder="Maharashtra"
              value={fields.state}
              onChange={(e) => set('state', e.target.value)}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-brand-600"
            checked={Boolean(fields.isDefault)}
            onChange={(e) => set('isDefault', e.target.checked)}
          />
          Set as default address
        </label>
      </div>
    </Modal>
  )
}

export default AddressModal
