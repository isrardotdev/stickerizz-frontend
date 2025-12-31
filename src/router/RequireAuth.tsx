import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

type RequireAuthProps = {
  children: ReactNode
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation()
  const { user, status } = useAppSelector((state) => state.auth)

  const isAuthed = Boolean(user) && status === 'authenticated'

  if (!user && status !== 'loading') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isAuthed) {
    return <div className="p-6 text-sm text-slate-300">Loading...</div>
  }

  return children
}

export default RequireAuth
