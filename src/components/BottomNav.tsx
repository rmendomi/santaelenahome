import { NavLink } from 'react-router-dom'
import { Home, ReceiptText, List, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { to: '/',          icon: Home,        label: 'Inicio'   },
  { to: '/boletas',   icon: ReceiptText, label: 'Boletas'  },
  { to: '/historial', icon: List,        label: 'Historial'},
  { to: '/resumen',   icon: BarChart2,   label: 'Resumen'  },
  { to: '/ajustes',   icon: Settings,    label: 'Ajustes'  },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe-bottom shadow-lg">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                <span className={`text-xs leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
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
