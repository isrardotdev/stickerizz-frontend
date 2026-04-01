import { useEffect, useState } from 'react'
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../api/addresses'
import type { Address, AddressInput } from '../api/addresses'
import { SurfaceCard } from '../components/layout/DashboardPrimitives'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import AddressModal from '../components/ui/AddressModal'
import { cn } from '../components/ui/classNames'

const AddressesPage = () => {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null)

  const load = () => {
    setIsLoading(true)
    listAddresses()
      .then((data) => {
        setAddresses(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load addresses.')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async (input: AddressInput) => {
    if (editingAddress) {
      const updated = await updateAddress(editingAddress.id, input)
      setAddresses((prev) => prev.map((a) => {
        if (updated.isDefault && a.id !== updated.id) return { ...a, isDefault: false }
        return a.id === updated.id ? updated : a
      }))
    } else {
      const created = await createAddress(input)
      setAddresses((prev) => {
        const next = created.isDefault
          ? prev.map((a) => ({ ...a, isDefault: false }))
          : prev
        return [created, ...next]
      })
    }
    setEditingAddress(null)
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    await deleteAddress(pendingDelete.id)
    setAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== pendingDelete.id)
      if (pendingDelete.isDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true }
      }
      return remaining
    })
    setPendingDelete(null)
  }

  const handleSetDefault = async (address: Address) => {
    const updated = await setDefaultAddress(address.id)
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === updated.id,
      }))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl tracking-tight text-slate-950">
            Saved Addresses
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your delivery addresses for print orders.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          tone="light"
          onClick={() => {
            setEditingAddress(null)
            setIsModalOpen(true)
          }}
        >
          Add address
        </Button>
      </div>

      {error ? (
        <SurfaceCard className="border-red-200 bg-red-50 text-red-700 ring-0">
          {error}
        </SurfaceCard>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : addresses.length === 0 ? (
        <SurfaceCard className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-slate-400"
              aria-hidden="true"
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-slate-900">No addresses yet</div>
            <div className="mt-1 text-sm text-slate-500">
              Add an address to use when placing print orders.
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            tone="light"
            onClick={() => {
              setEditingAddress(null)
              setIsModalOpen(true)
            }}
          >
            Add your first address
          </Button>
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={cn(
                'flex flex-col gap-4 rounded-3xl border p-5 transition-colors',
                address.isDefault
                  ? 'border-brand-200 bg-brand-50/60 ring-1 ring-brand-100'
                  : 'border-slate-200 bg-white'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{address.fullName}</span>
                    {address.isDefault ? (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-0.5 text-sm text-slate-600">
                    <div>{address.line1}</div>
                    {address.line2 ? <div>{address.line2}</div> : null}
                    <div>
                      {address.city}, {address.state} – {address.postalCode}
                    </div>
                    <div className="text-slate-500">{address.phone}</div>
                    <div className="text-slate-500">{address.email}</div>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2">
                {!address.isDefault ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    tone="light"
                    onClick={() => void handleSetDefault(address)}
                  >
                    Set default
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  tone="light"
                  onClick={() => {
                    setEditingAddress(address)
                    setIsModalOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  tone="light"
                  className="ml-auto text-red-600 hover:bg-red-50"
                  onClick={() => setPendingDelete(address)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        initial={editingAddress}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAddress(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete address?"
        content={`Remove "${pendingDelete?.fullName}"? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => void handleDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  )
}

export default AddressesPage
