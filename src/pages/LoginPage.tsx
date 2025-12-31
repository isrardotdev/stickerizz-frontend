import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import TextInput from '../components/ui/TextInput'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginThunk } from '../store/authSlice'

const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, user, error } = useAppSelector((state) => state.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!user || status !== 'authenticated') return
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    navigate(from ?? '/dashboard', { replace: true })
  }, [location.state, navigate, status, user])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Stickerizz
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          Login
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to access templates and your gallery.
        </p>

        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            dispatch(loginThunk({ email, password }))
          }}
        >
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Email
            <TextInput
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Password
            <TextInput
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <Button
            type="submit"
            variant="primary"
            tone="light"
            disabled={status === 'loading'}
            className="w-full"
          >
            {status === 'loading' ? 'Signing in…' : 'Login'}
          </Button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          Don’t have an account?{' '}
          <Link className="font-medium text-brand-700 hover:underline" to="/sign-up">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
