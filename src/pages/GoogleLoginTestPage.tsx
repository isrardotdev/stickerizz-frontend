import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { googleLoginThunk } from '../store/authSlice'

const GoogleLoginTestPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, user, error } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate('/', { replace: true })
    }
  }, [status, user, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Test page
        </p>
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Google Sign-In</h1>

        <div className="flex flex-col items-center gap-4">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const idToken = credentialResponse.credential
              if (idToken) {
                dispatch(googleLoginThunk(idToken))
              }
            }}
            onError={() => {
              console.error('Google login failed')
            }}
            useOneTap={false}
          />

          {status === 'loading' && (
            <p className="text-sm text-slate-500">Signing in…</p>
          )}

          {status === 'error' && error && (
            <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {status === 'authenticated' && user && (
            <div className="w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <p className="font-semibold">Signed in successfully</p>
              <p className="mt-1 text-xs text-green-700">{user.email}</p>
              <p className="text-xs text-green-700">Role: {user.role}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        This page is for testing only — not linked from the app.
      </p>
    </div>
  )
}

export default GoogleLoginTestPage
