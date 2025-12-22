import { Outlet } from 'react-router-dom'
import { TopNavigation } from './TopNavigation'

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30">
      <TopNavigation />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
