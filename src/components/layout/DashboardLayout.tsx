import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="w-full grow overflow-auto bg-slate-50 px-6 py-8 max-md:px-4">
        <Outlet />
      </div>
    </div>
  )
}

export default DashboardLayout

