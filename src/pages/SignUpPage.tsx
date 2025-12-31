import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import TextInput from '../components/ui/TextInput'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { registerThunk } from '../store/authSlice'

const SignUpPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, user, error } = useAppSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!user || status !== 'authenticated') return
    navigate('/dashboard', { replace: true })
  }, [navigate, status, user])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Stickerizz
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          Sign up
        </h1>
        <p className="mt-1 text-sm text-slate-600">Create your Stickerizz account.</p>

        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            dispatch(registerThunk({ name: name.trim() || undefined, email, password }))
          }}
        >
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Name (optional)
            <TextInput
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </label>

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
              autoComplete="new-password"
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
            {status === 'loading' ? 'Creating…' : 'Create account'}
          </Button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="font-medium text-brand-700 hover:underline" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
