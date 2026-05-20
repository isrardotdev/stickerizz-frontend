import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import AppRoutes from './router/AppRoutes'
import { useAppDispatch } from './store/hooks'
import { verifyThunk } from './store/authSlice'

const MOBILE_BREAKPOINT = 768

const MobileBlock = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    padding: '2rem',
    textAlign: 'center',
    background: '#0f0f0f',
    color: '#fff',
    fontFamily: 'sans-serif',
  }}>
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
      Mobile not supported yet
    </h1>
    <p style={{ fontSize: '0.95rem', color: '#aaa', maxWidth: '300px', lineHeight: 1.6 }}>
      Stickerizz is optimized for desktop. Please open it on a laptop or desktop computer for the best experience.
    </p>
  </div>
)

const App = () => {
  const dispatch = useAppDispatch()
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    dispatch(verifyThunk())
  }, [dispatch])

  if (isMobile) return <MobileBlock />

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  )
}

export default App
