const MyGalleryPage = () => {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">My Gallery</h1>
        <p className="mt-1 text-sm text-slate-600">
          Saved designs will appear here once we wire up persistence.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-slate-600">No designs yet.</div>
      </div>
    </div>
  )
}

export default MyGalleryPage
