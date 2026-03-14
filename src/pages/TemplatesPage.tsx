import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTemplates } from '../api/templates'
import { SurfaceCard } from '../components/layout/DashboardPrimitives'
import Button from '../components/ui/Button'

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<
    Awaited<ReturnType<typeof listTemplates>>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    listTemplates()
      .then((data) => setTemplates(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load templates.')
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
          <h2 className="font-serif text-2xl tracking-tight text-slate-950">Templates</h2>
          <Link to="/canvas">
            <Button tone="light" variant="outline">
              New canvas
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Loading templates…
          </div>
        ) : templates.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            No templates yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <Link
                key={template.id}
                to={`/canvas?templateId=${template.id}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition-colors hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="h-56 border-b border-slate-200 bg-slate-100">
                  {template.previewUrl ? (
                    <img
                      src={template.previewUrl}
                      alt={template.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      No preview
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="text-lg font-semibold text-slate-900">
                    {template.title}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Updated {new Date(template.updatedAt).toLocaleString()}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-brand-800">
                    Use template
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

export default TemplatesPage
