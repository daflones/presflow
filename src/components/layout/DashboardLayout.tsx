import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <TopNavigation />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
