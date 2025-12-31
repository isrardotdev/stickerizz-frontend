import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logoutThunk } from '../../store/authSlice'
import { cn } from '../ui/classNames'

type AppShellProps = {
  title?: string
  children: ReactNode
}

const NavItem = ({
  to,
  label,
  description,
}: {
  to: string
  label: string
  description?: string
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'group flex flex-col gap-0.5 rounded-xl px-3 py-2 transition-colors',
        isActive
          ? 'bg-brand-50 text-brand-900'
          : 'text-slate-700 hover:bg-slate-50'
      )
    }
  >
    <span className="text-sm font-medium">{label}</span>
    {description ? (
      <span className="text-xs text-slate-500 group-hover:text-slate-600">
        {description}
      </span>
    ) : null}
  </NavLink>
)

const AppShell = ({ title, children }: AppShellProps) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="w-[270px] border-r border-slate-200 bg-white px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-tight text-slate-900">
              Stickerizz
            </div>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              MVP
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-500">{user?.email}</div>

          <div className="mt-6 flex flex-col gap-1">
            <NavItem
              to="/dashboard"
              label="Dashboard"
              description="Overview and shortcuts"
            />
            <NavItem
              to="/templates"
              label="Templates"
              description="Start from a template"
            />
            <NavItem to="/my-gallery" label="My Gallery" description="Saved designs" />
            <NavItem to="/canvas" label="New Canvas" description="Start from scratch" />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-700">Tip</div>
            <div className="mt-1 text-xs text-slate-600">
              Use templates to iterate faster. Save to keep working later.
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              tone="light"
              variant="ghost"
              className="w-full justify-center"
              onClick={() => {
                dispatch(logoutThunk())
                navigate('/login')
              }}
            >
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 px-8 py-8">
          {title ? (
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell

