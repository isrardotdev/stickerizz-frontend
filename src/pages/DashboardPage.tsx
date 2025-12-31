import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

const DashboardPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium text-slate-600">Your workspace</div>
          <div className="text-2xl font-semibold tracking-tight text-slate-900">
            Create, customize, and save sticker designs.
          </div>
          <div className="mt-2 max-w-2xl text-sm text-slate-600">
            Start from a template for speed, or begin with a blank canvas. Save to
            your gallery to keep iterating.
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/templates">
            <Button tone="light" variant="primary">
              Browse templates
            </Button>
          </Link>
          <Link to="/canvas">
            <Button tone="light" variant="outline">
              New canvas
            </Button>
          </Link>
          <Link to="/my-gallery">
            <Button tone="light" variant="ghost">
              Open gallery
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quick Start
          </div>
          <div className="mt-2 text-sm text-slate-700">
            Pick a template and swap text/images.
          </div>
          <div className="mt-4">
            <Link to="/templates" className="text-sm font-medium text-brand-700 hover:underline">
              View templates
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your Gallery
          </div>
          <div className="mt-2 text-sm text-slate-700">
            Saved designs will appear here once persistence is wired.
          </div>
          <div className="mt-4">
            <Link to="/my-gallery" className="text-sm font-medium text-brand-700 hover:underline">
              Go to gallery
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Editor
          </div>
          <div className="mt-2 text-sm text-slate-700">
            Fine-tune text, spacing, stroke and images.
          </div>
          <div className="mt-4">
            <Link to="/canvas" className="text-sm font-medium text-brand-700 hover:underline">
              Open editor
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Recent activity</div>
            <div className="mt-1 text-sm text-slate-600">
              This section will list your latest designs and templates used.
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              Coming soon
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No saved designs yet.
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No templates opened yet.
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
