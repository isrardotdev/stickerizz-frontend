import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import SignUpPage from '../pages/SignUpPage'
import DashboardPage from '../pages/DashboardPage'
import MyGalleryPage from '../pages/MyGalleryPage'
import TemplatesPage from '../pages/TemplatesPage'
import CanvasRoutePage from '../pages/CanvasRoutePage'
import RequireAuth from './RequireAuth'
import DashboardLayout from '../components/layout/DashboardLayout'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="my-gallery" element={<MyGalleryPage />} />
      </Route>

      <Route
        path="/canvas"
        element={
          <RequireAuth>
            <CanvasRoutePage />
          </RequireAuth>
        }
      />
      <Route
        path="/canvas/:designId"
        element={
          <RequireAuth>
            <CanvasRoutePage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
