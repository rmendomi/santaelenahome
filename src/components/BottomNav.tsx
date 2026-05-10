import { NavLink } from 'react-router-dom'
import { Home, List, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Hoy' },
  { to: '/historial', icon: List, label: 'Historial' },
  { to: '/resumen', icon: BarChart2, label: 'Resumen' },
  { to: '/ajustes', icon: Settings, label: 'Ajustes' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe-bottom">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
