import { NavLink, useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logoutThunk } from '../../store/authSlice'
import { cn } from '../ui/classNames'

const SidebarLink = ({ to, label }: { to: string; label: string }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      cn(
        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-brand-50 text-brand-800'
          : 'text-slate-700 hover:bg-slate-100'
      )
    }
  >
    {label}
  </NavLink>
)

const Sidebar = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  return (
    <aside className="w-[260px] shrink-0 border-r border-slate-200 bg-white px-4 py-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight text-slate-900">
          Stickerizz
        </div>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
          MVP
        </span>
      </div>

      <div className="mt-2 truncate text-xs text-slate-500">{user?.email}</div>

      <nav className="mt-6 flex flex-col gap-1">
        <SidebarLink to="/" label="Dashboard" />
        <SidebarLink to="/templates" label="Templates" />
        <SidebarLink to="/my-gallery" label="My Gallery" />
        <SidebarLink to="/my-stickers" label="My Stickers" />
        <SidebarLink to="/print" label="Print" />
        <SidebarLink to="/canvas" label="New Canvas" />
      </nav>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-700">Tip</div>
        <div className="mt-1 text-xs text-slate-600">
          Start from templates, then save to your gallery.
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
  )
}

export default Sidebar
