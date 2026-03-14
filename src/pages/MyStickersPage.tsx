import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { deleteSticker, listStickers } from '../api/stickers'
import type { SavedSticker } from '../api/stickers'
import { SurfaceCard } from '../components/layout/DashboardPrimitives'

const MyStickersPage = () => {
  const navigate = useNavigate()
  const [stickers, setStickers] = useState<SavedSticker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SavedSticker | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsLoading(true)
    listStickers()
      .then((data) => {
        setStickers(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load stickers.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!openMenuId) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRootRef.current?.contains(target)) return
      setOpenMenuId(null)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuId])

  const downloadWhatsAppPng = async (sticker: SavedSticker) => {
    try {
      const response = await fetch(sticker.imageUrl, { credentials: 'omit' })
      if (!response.ok) {
        throw new Error(`Failed to download image (${response.status})`)
      }
      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)

      const size = 512
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to create canvas context')

      ctx.clearRect(0, 0, size, size)
      const scale = Math.min(size / bitmap.width, size / bitmap.height)
      const drawW = Math.round(bitmap.width * scale)
      const drawH = Math.round(bitmap.height * scale)
      const dx = Math.round((size - drawW) / 2)
      const dy = Math.round((size - drawH) / 2)
      ctx.drawImage(bitmap, dx, dy, drawW, drawH)

      const outputBlob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error('Failed to encode PNG'))
            return
          }
          resolve(result)
        }, 'image/png')
      })

      const url = URL.createObjectURL(outputBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${(sticker.title ?? 'sticker').replaceAll(' ', '_')}_whatsapp.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[stickers] whatsapp download failed', error)
      window.open(sticker.imageUrl, '_blank', 'noreferrer')
    }
  }

  const downloadOriginalPng = (sticker: SavedSticker) => {
    const link = document.createElement('a')
    link.href = sticker.imageUrl
    link.download = `${(sticker.title ?? 'sticker').replaceAll(' ', '_')}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const id = pendingDelete.id
    await deleteSticker(id)
    setStickers((prev) => prev.filter((sticker) => sticker.id !== id))
    setPendingDelete(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <SurfaceCard>
          <div className="text-sm text-slate-600">Loading stickers…</div>
        </SurfaceCard>
      ) : error ? (
        <SurfaceCard className="border-red-200 bg-red-50 text-red-700 ring-0">
          {error}
        </SurfaceCard>
      ) : stickers.length === 0 ? (
        <SurfaceCard>
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-600">
            No saved stickers yet. Export one from the editor.
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard>
          <h2 className="font-serif text-2xl tracking-tight text-slate-950">My stickers</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-square border-b border-slate-200 bg-slate-50">
                <img
                  src={sticker.imageUrl}
                  alt={sticker.title ?? 'Sticker'}
                  className="h-full w-full object-contain p-6"
                  loading="lazy"
                />
                <div
                  className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100"
                  ref={openMenuId === sticker.id ? menuRootRef : undefined}
                >
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-slate-700 hover:border-brand-200 hover:text-brand-800"
                    aria-label="Sticker actions"
                    onClick={() =>
                      setOpenMenuId((prev) => (prev === sticker.id ? null : sticker.id))
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M12 6h.01" />
                      <path d="M12 12h.01" />
                      <path d="M12 18h.01" />
                    </svg>
                  </button>
                  {openMenuId === sticker.id ? (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70">
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-brand-50"
                        onClick={() => {
                          setOpenMenuId(null)
                          void downloadWhatsAppPng(sticker)
                        }}
                      >
                        Download for digital sticker
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-brand-50 disabled:text-slate-400"
                        disabled={!sticker.designId}
                        onClick={() => {
                          if (!sticker.designId) return
                          setOpenMenuId(null)
                          navigate(`/canvas/${sticker.designId}`)
                        }}
                      >
                        Open design file
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setOpenMenuId(null)
                          setPendingDelete(sticker)
                        }}
                      >
                        Delete
                      </button>
                      <div className="border-t border-slate-200 px-4 py-2">
                        <button
                          type="button"
                          className="text-xs font-medium text-slate-500 hover:text-slate-700"
                          onClick={() => {
                            setOpenMenuId(null)
                            downloadOriginalPng(sticker)
                          }}
                        >
                          Download original PNG
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900">
                    {sticker.title ?? 'Sticker'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {sticker.widthPx}×{sticker.heightPx}px
                    {sticker.bytes ? ` · ${(sticker.bytes / 1024).toFixed(0)}KB` : ''}
                  </div>
                </div>
                <a
                  href={sticker.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand-800"
                >
                  View
                </a>
              </div>
            </div>
          ))}
          </div>
        </SurfaceCard>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete sticker?"
        content="This will delete the exported image from your library."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  )
}

export default MyStickersPage
