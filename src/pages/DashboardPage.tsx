import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { SectionHeading, SurfaceCard } from '../components/layout/DashboardPrimitives'

const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <SurfaceCard>
        <SectionHeading
          title="Start"
          action={
            <div className="flex flex-wrap gap-3">
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
            </div>
          }
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Templates</h3>
            <p className="mt-2 text-sm text-slate-600">Start from an existing layout.</p>
            <Link to="/templates" className="mt-5 inline-flex text-sm font-semibold text-brand-800">
              Open templates
            </Link>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Gallery</h3>
            <p className="mt-2 text-sm text-slate-600">Continue a saved design.</p>
            <Link to="/my-gallery" className="mt-5 inline-flex text-sm font-semibold text-brand-800">
              Open gallery
            </Link>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Print</h3>
            <p className="mt-2 text-sm text-slate-600">Arrange exported stickers for print.</p>
            <Link to="/print" className="mt-5 inline-flex text-sm font-semibold text-brand-800">
              Open print
            </Link>
          </article>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading
          title="Recent"
          action={
            <Link to="/my-gallery">
              <Button tone="light" variant="ghost">
                Open gallery
              </Button>
            </Link>
          }
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-900">Recent designs</div>
            <p className="mt-2 text-sm text-slate-600">No saved designs yet.</p>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-900">Recent exports</div>
            <p className="mt-2 text-sm text-slate-600">No exports yet.</p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}

export default DashboardPage
