import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useOffline } from '../../hooks/useOffline'

export function AppShell() {
  const { isOnline } = useOffline()

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {!isOnline && (
        <div className="bg-primary text-white text-center text-xs font-medium py-1.5 px-2">
          Sin conexion — modo offline
        </div>
      )}
      <main className="max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
