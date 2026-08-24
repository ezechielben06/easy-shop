import React, { useState, useEffect } from 'react'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'
import { 
  ShoppingBag, 
  DollarSign,
  Package,
  AlertTriangle,
  ArrowRight,
  Loader2,
  CreditCard,
  Wallet
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const { getDailySales, getSalesStats } = useSales()
  const { products, fetchProducts } = useProducts()
  const [todayStats, setTodayStats] = useState({ 
    total: 0, 
    count: 0, 
    cashTotal: 0, 
    cashCount: 0, 
    creditTotal: 0, 
    creditCount: 0 
  })
  const [monthlyStats, setMonthlyStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lowStockProducts, setLowStockProducts] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const today = await getDailySales()
      setTodayStats(today)
      
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const endOfMonth = new Date()
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0)
      
      const stats = await getSalesStats(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      )
      setMonthlyStats(stats)
      
      const allProducts = await fetchProducts()
      const lowStock = allProducts.filter(p => p.quantity <= p.min_quantity)
      setLowStockProducts(lowStock)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4 animate-slide-up">
      {/* En-tête */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Package className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Stats du jour avec distinction Espèces/Crédit */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Espèces</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {todayStats.cashCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {todayStats.cashTotal.toLocaleString()} FCFA
          </p>
        </div>
        <div className="stat-card border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Crédit</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {todayStats.creditCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {todayStats.creditTotal.toLocaleString()} FCFA
          </p>
        </div>
      </div>

      {/* Stats mensuelles */}
      <div className="px-4">
        <div className="card">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthlyStats?.totalSales || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total ventes</p>
            </div>
            <div className="text-center border-x dark:border-gray-700">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {monthlyStats?.cashTotal?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Espèces</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">
                {monthlyStats?.creditTotal?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Crédit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes stock */}
      {lowStockProducts.length > 0 && (
        <div className="px-4">
          <div className="card border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Stock faible
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''} à réapprovisionner
                  </p>
                </div>
              </div>
              <Link to="/products" className="text-orange-600 dark:text-orange-400">
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/sales/new" className="btn-primary text-center">
            Nouvelle vente
          </Link>
          <Link to="/inventory" className="btn-secondary text-center">
            Inventaire
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard