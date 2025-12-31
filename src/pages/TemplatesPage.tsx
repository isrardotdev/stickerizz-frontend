import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTemplates } from '../api/templates'

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
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Templates</h1>
        <p className="mt-1 text-sm text-slate-600">Start from a template.</p>
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
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">No templates yet.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              to={`/canvas?templateId=${template.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full bg-slate-100">
                {template.previewUrl ? (
                  <img
                    src={template.previewUrl}
                    alt={template.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    No preview
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold text-slate-900">
                  {template.title}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Updated {new Date(template.updatedAt).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default TemplatesPage
