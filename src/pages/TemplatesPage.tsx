const TemplatesPage = () => {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Templates</h1>
        <p className="mt-1 text-sm text-slate-600">
          Published templates will show here once the template API is added.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-slate-600">No templates yet.</div>
      </div>
    </div>
  )
}

export default TemplatesPage
