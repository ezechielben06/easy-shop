import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList,
  BarChart3,
  Settings 
} from 'lucide-react'

const BottomNav = () => {
  const location = useLocation()
  
  // Cacher la bottom nav sur les pages d'auth
  const hideNav = ['/login', '/register'].includes(location.pathname)
  
  if (hideNav) return null

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { path: '/sales', icon: ShoppingBag, label: 'Ventes' },
    { path: '/inventory', icon: ClipboardList, label: 'Inventaire' },
    { path: '/reports', icon: BarChart3, label: 'Rapports' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-1 z-50 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors text-xs ${
                isActive 
                  ? 'text-blue-500 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
              }`
            }
          >
            <item.icon className="h-6 w-6 mb-0.5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav