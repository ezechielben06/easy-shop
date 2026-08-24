import React, { useState, useEffect } from 'react'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'
import { Link } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  ShoppingBag, 
  DollarSign,
  Package,
  AlertTriangle,
  ArrowRight,
  Loader2,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  BarChart3,
  Users,
  Calendar,
  ChevronRight
} from 'lucide-react'

const Dashboard = () => {
  const { getDailySales, getSalesStats, fetchSales } = useSales()
  const { products, fetchProducts } = useProducts()
  const [todayStats, setTodayStats] = useState({ 
    total: 0, 
    count: 0, 
    cashTotal: 0, 
    cashCount: 0, 
    creditTotal: 0, 
    creditCount: 0,
    sales: []
  })
  const [monthlyStats, setMonthlyStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [todaySales, setTodaySales] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const today = await getDailySales()
      setTodayStats(today)
      setTodaySales(today.sales || [])
      
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
      setTotalProducts(allProducts.length)
      const lowStock = allProducts.filter(p => p.quantity <= p.min_quantity)
      setLowStockProducts(lowStock)
      
      const recentSales = await fetchSales({})
      const activities = recentSales.slice(0, 5).map(sale => ({
        id: sale.id,
        type: 'sale',
        message: `Vente #${sale.invoice_number} - ${sale.grand_total.toLocaleString()} FCFA`,
        time: sale.created_at,
        isCredit: sale.is_credit
      }))
      setRecentActivities(activities)
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  const totalSales = todayStats.count || 0
  const cashPercentage = totalSales > 0 ? Math.round((todayStats.cashCount / totalSales) * 100) : 0
  const creditPercentage = totalSales > 0 ? Math.round((todayStats.creditCount / totalSales) * 100) : 0

  const statCards = [
    { label: 'Ventes du jour', value: todayStats.count, sub: `${todayStats.total.toLocaleString()} FCFA`, icon: ShoppingBag, color: 'blue' },
    { label: 'Espèces', value: todayStats.cashCount, sub: `${todayStats.cashTotal.toLocaleString()} FCFA`, icon: Wallet, color: 'emerald' },
    { label: 'Crédit', value: todayStats.creditCount, sub: `${todayStats.creditTotal.toLocaleString()} FCFA`, icon: CreditCard, color: 'orange' },
    { label: 'Produits', value: totalProducts, sub: `${lowStockProducts.length} en stock faible`, icon: Package, color: 'purple' },
  ]

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="btn-secondary text-sm py-2 px-4"
        >
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const colorMap = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
            orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
            purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
          }
          return (
            <div key={index} className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">{stat.label}</p>
                  <p className="stat-value">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${colorMap[stat.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Répartition */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Répartition des ventes
          </h3>
          <span className="text-xs text-gray-500">{totalSales} vente{totalSales > 1 ? 's' : ''}</span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div 
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${cashPercentage}%` }}
          />
          <div 
            className="bg-orange-500 transition-all duration-500"
            style={{ width: `${creditPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Espèces {cashPercentage}%
          </span>
          <span className="flex items-center gap-1.5 text-orange-500">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Crédit {creditPercentage}%
          </span>
        </div>
      </div>

      {/* Alertes stock */}
      {lowStockProducts.length > 0 && (
        <div className="card p-6 border-orange-200/60 dark:border-orange-800/30 bg-orange-50/50 dark:bg-orange-900/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
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
            <Link to="/products" className="btn-outline text-sm py-1.5 px-4 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20">
              Voir
            </Link>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/sales/new" className="btn-primary py-3 text-center">
          Nouvelle vente
        </Link>
        <Link to="/inventory" className="btn-secondary py-3 text-center">
          Inventaire
        </Link>
        <Link to="/products" className="btn-secondary py-3 text-center">
          Produits
        </Link>
        <Link to="/reports" className="btn-secondary py-3 text-center">
          Rapports
        </Link>
      </div>

      {/* Ventes du jour */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Ventes du jour
            </h3>
          </div>
          <Link to="/sales" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            Voir tout <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        
        {todaySales.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune vente aujourd'hui</p>
            <Link to="/sales/new" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
              Créer une vente
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todaySales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {sale.invoice_number}
                    </span>
                    {sale.is_credit ? (
                      <span className="badge-orange">📝 Crédit</span>
                    ) : (
                      <span className="badge-green">💵 Espèces</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {format(new Date(sale.created_at), 'HH:mm')} • {sale.sale_items?.length || 0} articles
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {sale.grand_total?.toLocaleString()} FCFA
                  </p>
                  {sale.is_credit && (
                    <span className={`text-xs ${
                      sale.credit_status === 'paid' ? 'text-emerald-500' :
                      sale.credit_status === 'overdue' ? 'text-red-500' : 'text-orange-500'
                    }`}>
                      {sale.credit_status === 'paid' ? '✅ Payé' :
                       sale.credit_status === 'overdue' ? '⚠️ En retard' : '⏳ En attente'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {todaySales.length > 5 && (
              <div className="text-center pt-2">
                <Link to="/sales" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  + {todaySales.length - 5} autres ventes
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats mensuelles et activités */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Statistiques du mois
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthlyStats?.totalSales || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ventes</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {monthlyStats?.totalRevenue?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">CA</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {monthlyStats?.averageTicket?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Panier moyen</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Activités récentes
            </h3>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Aucune activité
            </p>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${activity.isCredit ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {activity.message}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.time), { locale: fr, addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard