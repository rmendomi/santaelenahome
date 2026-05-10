import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ChatBot } from './ChatBot'

export function AppShell() {
  return (
    <div className="min-h-screen bg-warm flex flex-col">
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
      <ChatBot />
    </div>
  )
}
