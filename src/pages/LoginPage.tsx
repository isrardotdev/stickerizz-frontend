import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { HiEye, HiEyeSlash } from 'react-icons/hi2'
import { GoogleLogin } from '@react-oauth/google'
import AuthShell from '../components/layout/AuthShell'
import Button from '../components/ui/Button'
import TextInput from '../components/ui/TextInput'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginThunk, googleLoginThunk } from '../store/authSlice'

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
        <p className="text-center">
          Don&apos;t have an account?{' '}
          <a className="font-semibold text-brand-800 hover:underline" href="/sign-up">
            Sign up
          </a>
        </p>
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

        <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          or
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Full-width custom Google button — transparent GoogleLogin overlay handles the actual auth click */}
        <div className="relative mt-4 h-11 w-full cursor-pointer overflow-hidden rounded-full bg-slate-950 hover:bg-slate-800 transition-colors">
          {/* Visual layer */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 text-sm font-semibold text-white">
            <svg className="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </div>
          {/* Invisible GoogleLogin — receives the actual click and opens Google auth */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                const idToken = credentialResponse.credential
                if (idToken) {
                  void dispatch(googleLoginThunk(idToken)).then((action) => {
                    if (googleLoginThunk.fulfilled.match(action)) {
                      const name = action.payload.user.name
                      toast.success(name ? `Welcome back, ${name}!` : 'Welcome back!')
                    }
                  })
                }
              }}
              onError={() => {
                toast.error('Google sign-in failed. Please try again.')
              }}
              useOneTap={false}
              size="large"
              width={400}
            />
          </div>
        </div>
    </AuthShell>
  )
}

export default LoginPage
