import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logoutThunk } from '../../store/authSlice'
import { cn } from '../ui/classNames'

const icons = {
  dashboard: (
    <path d="M4 13h7V4H4v9Zm9 7h7v-6h-7v6Zm0-9h7V4h-7v7ZM4 20h7v-4H4v4Z" />
  ),
  templates: (
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 17.5v-11Zm3 1.5h8M8 12h8M8 16h5" />
  ),
  gallery: (
    <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Zm2.5 7 2.2-2.2a1 1 0 0 1 1.4 0l1.4 1.4 2.8-3a1 1 0 0 1 1.5 0l1.2 1.3M9 9.75h.01" />
  ),
  stickers: <path d="M7 4h7a6 6 0 0 1 6 6v1a9 9 0 0 1-9 9H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm5 0v4a3 3 0 0 0 3 3h5" />,
  print: <path d="M7 8V5h10v3M6 17H5a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2h-1M7 14h10v6H7v-6Z" />,
  canvas: <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4" />,
} as const

const SidebarLink = ({
  to,
  label,
  note,
  icon,
}: {
  to: string
  label: string
  note: string
  icon: keyof typeof icons
}) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      cn(
        'group relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors',
        isActive
          ? 'bg-brand-50 text-brand-950 shadow-sm ring-1 ring-brand-100'
          : 'text-slate-600 hover:bg-white hover:text-slate-900'
      )
    }
  >
    {({ isActive }) => (
      <>
        <span
          className={cn(
            'absolute inset-y-2 left-0 w-1 rounded-full transition-colors',
            isActive ? 'bg-brand-700' : 'bg-transparent'
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-2xl border bg-white transition-colors',
            isActive
              ? 'border-brand-200 bg-brand-100 text-brand-800'
              : 'border-slate-200 text-slate-500 group-hover:border-brand-200 group-hover:text-brand-700'
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            {icons[icon]}
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{label}</span>
          <span
            className={cn(
              'block text-xs',
              isActive ? 'text-brand-700' : 'text-slate-500'
            )}
          >
            {note}
          </span>
        </span>
      </>
    )}
  </NavLink>
)

const Sidebar = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isProfileOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (profileRef.current?.contains(target)) return
      setIsProfileOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileOpen])

  return (
    <aside className="w-full border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col lg:px-4 lg:py-4">
        <div className="px-2 py-3">
          <div className="font-serif text-3xl tracking-tight text-slate-950">
            Stickerizz
          </div>
          <div className="mt-1 text-sm text-slate-500">Studio dashboard</div>
        </div>

        <div className="mt-4 border-t border-slate-200" />

        <nav className="mt-6 flex flex-col gap-2">
          <SidebarLink to="/" label="Dashboard" note="Overview and shortcuts" icon="dashboard" />
          <SidebarLink to="/templates" label="Templates" note="Start from a base" icon="templates" />
          <SidebarLink to="/my-gallery" label="Gallery" note="Saved design files" icon="gallery" />
          <SidebarLink to="/my-stickers" label="Stickers" note="Exports ready to share" icon="stickers" />
          <SidebarLink to="/print" label="Print" note="Arrange sticker sheets" icon="print" />
          <SidebarLink to="/canvas" label="New canvas" note="Create from scratch" icon="canvas" />
        </nav>

        <div className="mt-auto pt-6" ref={profileRef}>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/50"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                {(user?.email?.[0] ?? 'U').toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {user?.email ?? 'Account'}
                </span>
                <span className="block text-xs text-slate-500">Account</span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  'h-4 w-4 text-slate-500 transition-transform',
                  isProfileOpen ? 'rotate-180' : null
                )}
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {isProfileOpen ? (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/80">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setIsProfileOpen(false)
                    dispatch(logoutThunk())
                    navigate('/login')
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
