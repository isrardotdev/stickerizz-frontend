import { Link, useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logoutThunk } from '../../store/authSlice'

const AppHeader = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  return (
    <header className="flex h-12 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="text-sm font-semibold text-slate-100">
          Stickerizz
        </Link>
        <nav className="flex items-center gap-2 text-sm text-slate-300">
          <Link to="/templates" className="hover:text-slate-100">
            Templates
          </Link>
          <Link to="/my-gallery" className="hover:text-slate-100">
            My Gallery
          </Link>
          <Link to="/canvas" className="hover:text-slate-100">
            Canvas
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">{user?.email}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            dispatch(logoutThunk())
            navigate('/login')
          }}
        >
          Logout
        </Button>
      </div>
    </header>
  )
}

export default AppHeader
