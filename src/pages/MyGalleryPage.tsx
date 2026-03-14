import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDesigns } from '../api/designs'
import { SurfaceCard } from '../components/layout/DashboardPrimitives'
import Button from '../components/ui/Button'

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
    <div className="flex flex-col gap-6">
      {error ? (
        <SurfaceCard className="border-red-200 bg-red-50 text-red-700 ring-0">
          {error}
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl tracking-tight text-slate-950">My gallery</h2>
          <Link to="/canvas">
            <Button tone="light" variant="primary">
              New design
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Loading designs…
          </div>
        ) : designs.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <div className="text-sm text-slate-600">No designs yet.</div>
            <div className="mt-4">
              <Link to="/canvas">
                <Button tone="light" variant="outline">
                  Create your first design
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {designs.map((design) => (
              <Link
                key={design.id}
                to={`/canvas/${design.id}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition-colors hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="h-56 border-b border-slate-200 bg-slate-100">
                  <img
                    src={design.previewUrl}
                    alt={design.title ?? 'Design'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <div className="text-lg font-semibold text-slate-900">
                    {design.title ?? 'Untitled design'}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Updated {new Date(design.updatedAt).toLocaleString()}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-brand-800">
                    Reopen design
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}

export default MyGalleryPage
