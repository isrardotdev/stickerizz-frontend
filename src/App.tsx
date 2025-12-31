import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './router/AppRoutes'
import { useAppDispatch } from './store/hooks'
import { verifyThunk } from './store/authSlice'

const App = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(verifyThunk())
  }, [dispatch])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
