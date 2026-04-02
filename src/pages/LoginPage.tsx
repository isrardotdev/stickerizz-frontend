import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { HiEye, HiEyeSlash } from 'react-icons/hi2'
import AuthShell from '../components/layout/AuthShell'
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
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!user || status !== 'authenticated') return
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    navigate(from ?? '/', { replace: true })
  }, [location.state, navigate, status, user])

  return (
    <AuthShell
      eyebrow="Stickerizz"
      title="Welcome back"
      footer={
        <>
          Want early access?{' '}
          <a className="font-semibold text-brand-800 hover:underline" href="https://stickerizz.com">
            Join the waitlist
          </a>
        </>
      }
    >
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void dispatch(loginThunk({ email, password })).then((action) => {
              if (loginThunk.fulfilled.match(action)) {
                const name = action.payload.user.name
                toast.success(name ? `Welcome back, ${name}!` : 'Welcome back!')
              }
            })
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
              tone="light"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Password
            <div className="relative">
              <TextInput
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                tone="light"
                required
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            tone="light"
            disabled={status === 'loading'}
            className="mt-1 w-full justify-center border-slate-950 bg-slate-950 text-white shadow-sm hover:bg-slate-800"
          >
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
    </AuthShell>
  )
}

export default LoginPage
