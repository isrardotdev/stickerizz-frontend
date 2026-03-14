import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const routeMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Design workspace',
    description: 'Create and manage sticker work.',
  },
  '/templates': {
    title: 'Template library',
    description: 'Choose a template and start editing.',
  },
  '/my-gallery': {
    title: 'Saved gallery',
    description: 'Open and continue saved designs.',
  },
  '/my-stickers': {
    title: 'Sticker exports',
    description: 'View and manage exported stickers.',
  },
  '/print': {
    title: 'Print composer',
    description: 'Arrange stickers on a printable sheet.',
  },
}

const DashboardLayout = () => {
  const location = useLocation()
  const meta = routeMeta[location.pathname] ?? routeMeta['/']

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex min-h-screen flex-col lg:block">
        <Sidebar />
        <div className="min-w-0 flex-1 lg:pl-72">
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <header className="rounded-3xl border border-white bg-white/80 px-6 py-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-100 backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Dashboard
                  </div>
                  <h1 className="font-serif text-3xl tracking-tight text-slate-950">
                    {meta.title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    {meta.description}
                  </p>
                </div>
              </div>
            </header>

            <main className="mt-6 min-w-0 flex-1">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
