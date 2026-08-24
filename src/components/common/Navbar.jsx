import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../hooks/useDarkMode'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Boxes,
  FileText,
  Settings,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Store,
  Bell,
  User
} from 'lucide-react'

const Navbar = () => {
  const { signOut, user, profile } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (['/login', '/register'].includes(location.pathname)) return null

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ventes', href: '/sales', icon: ShoppingBag },
    { name: 'Produits', href: '/products', icon: Package },
    { name: 'Stock', href: '/stock', icon: Boxes },
    { name: 'Inventaire', href: '/inventory', icon: ClipboardList },
    { name: 'Rapports', href: '/reports', icon: FileText },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-lg' 
        : 'bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-700/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Easy-Shop
              </span>
              <span className="hidden sm:inline-block text-xs text-gray-400 dark:text-gray-500 ml-1 font-medium">
                Gestion
              </span>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Basculer le mode sombre"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {profile?.role || 'cashier'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Menu mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Navigation Mobile */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {profile?.role || 'cashier'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar