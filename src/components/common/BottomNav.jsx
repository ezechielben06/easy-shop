import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList,
  BarChart3,
  Settings,
  Package
} from 'lucide-react'

const BottomNav = () => {
  const location = useLocation()
  
  if (['/login', '/register'].includes(location.pathname)) return null

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { path: '/sales', icon: ShoppingBag, label: 'Ventes' },
    { path: '/inventory', icon: ClipboardList, label: 'Inventaire' },
    { path: '/products', icon: Package, label: 'Produits' },
    { path: '/settings', icon: Settings, label: 'Profil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 scale-105' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`
            }
          >
            <item.icon className={`h-6 w-6 transition-all ${location.pathname === item.path ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav