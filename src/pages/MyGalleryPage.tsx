import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDesigns } from '../api/designs'

const MyGalleryPage = () => {
  const [designs, setDesigns] = useState<
    Awaited<ReturnType<typeof listDesigns>>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    listDesigns()
      .then((data) => setDesigns(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load designs.')
      )
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">My Gallery</h1>
        <p className="mt-1 text-sm text-slate-600">Your saved designs.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Loading…</div>
        </div>
      ) : designs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">No designs yet.</div>
          <div className="mt-3 text-sm">
            <Link className="font-medium text-brand-700 hover:underline" to="/canvas">
              Create your first design
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => (
            <Link
              key={design.id}
              to={`/canvas/${design.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full bg-slate-100">
                <img
                  src={design.previewUrl}
                  alt={design.title ?? 'Design'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold text-slate-900">
                  {design.title ?? 'Design'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Updated {new Date(design.updatedAt).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyGalleryPage
