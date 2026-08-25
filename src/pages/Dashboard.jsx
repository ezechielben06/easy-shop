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
  Clock,
  Eye,
  BarChart3,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  List,
  Grid
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

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
  const [todayProducts, setTodayProducts] = useState([])
  const [todayProductsTotal, setTodayProductsTotal] = useState(0)
  const [recentActivities, setRecentActivities] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const today = await getDailySales()
      setTodayStats(today)
      setTodaySales(today.sales || [])
      
      await loadTodayProducts(today.sales || [])
      
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

  const loadTodayProducts = async (sales) => {
    const productMap = {}
    let totalQuantity = 0
    
    for (const sale of sales) {
      const { data: items } = await supabase
        .from('sale_items')
        .select(`
          *,
          products (
            id,
            name,
            image_url,
            price,
            category
          )
        `)
        .eq('sale_id', sale.id)
      
      if (items) {
        items.forEach(item => {
          const product = item.products
          if (product) {
            if (!productMap[product.id]) {
              productMap[product.id] = {
                ...product,
                total_quantity: 0,
                total_revenue: 0,
                sale_count: 0
              }
            }
            productMap[product.id].total_quantity += item.quantity
            productMap[product.id].total_revenue += item.total_price
            productMap[product.id].sale_count += 1
            totalQuantity += item.quantity
          }
        })
      }
    }
    
    const sortedProducts = Object.values(productMap)
      .sort((a, b) => b.total_quantity - a.total_quantity)
    
    setTodayProducts(sortedProducts)
    setTodayProductsTotal(totalQuantity)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  const totalSales = todayStats.count || 0
  const cashPercentage = totalSales > 0 ? Math.round((todayStats.cashCount / totalSales) * 100) : 0
  const creditPercentage = totalSales > 0 ? Math.round((todayStats.creditCount / totalSales) * 100) : 0

  return (
    <div className="space-y-3 pb-24 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(), "EEEE d MMMM", { locale: fr })}
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Stats principales - 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Ventes</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{todayStats.count}</p>
          <p className="text-[10px] text-gray-400">{todayStats.total.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm bg-emerald-50/30 dark:bg-emerald-900/5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Espèces</span>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{todayStats.cashCount}</p>
          <p className="text-[10px] text-gray-400">{todayStats.cashTotal.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm bg-orange-50/30 dark:bg-orange-900/5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Crédit</span>
          </div>
          <p className="text-xl font-bold text-orange-500">{todayStats.creditCount}</p>
          <p className="text-[10px] text-gray-400">{todayStats.creditTotal.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm bg-purple-50/30 dark:bg-purple-900/5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Produits</span>
          </div>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{todayProductsTotal}</p>
          <p className="text-[10px] text-gray-400">{todayProducts.length} différents</p>
        </div>
      </div>

      {/* Répartition - barre */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Répartition</span>
          <span className="text-[10px] text-gray-400">{totalSales} vente{totalSales > 1 ? 's' : ''}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${cashPercentage}%` }} />
          <div className="bg-orange-500 transition-all duration-500" style={{ width: `${creditPercentage}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px]">
          <span className="text-emerald-600 dark:text-emerald-400">Espèces {cashPercentage}%</span>
          <span className="text-orange-500">Crédit {creditPercentage}%</span>
        </div>
      </div>

      {/* Produits vendus aujourd'hui */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top produits</h3>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
              {todayProductsTotal} unités
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setViewMode('list')} className={`p-1 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-400'}`}>
              <List className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-400'}`}>
              <Grid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {todayProducts.length === 0 ? (
          <div className="text-center py-4">
            <ShoppingBag className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-1" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Aucun produit vendu</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {todayProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-8 h-8 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{product.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{product.total_quantity}</span>
                  <span className="text-[10px] text-gray-400 ml-1">unités</span>
                </div>
              </div>
            ))}
            {todayProducts.length > 5 && (
              <p className="text-[10px] text-center text-gray-400">+ {todayProducts.length - 5} autres produits</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto">
            {todayProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded-lg mx-auto mb-1" />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-1 flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <p className="text-[10px] font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{product.total_quantity}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock faible - alerte */}
      {lowStockProducts.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs font-medium text-orange-800 dark:text-orange-300">Stock faible</p>
                <p className="text-[10px] text-orange-600 dark:text-orange-400">{lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <Link to="/products" className="text-orange-600 dark:text-orange-400">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Actions rapides - 2 colonnes */}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/sales/new" className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl text-center transition-all active:scale-[0.97]">
          Nouvelle vente
        </Link>
        <Link to="/inventory" className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 rounded-xl text-center transition-all active:scale-[0.97]">
          Inventaire
        </Link>
      </div>

      {/* Ventes du jour - compact */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ventes du jour</h3>
          </div>
          <Link to="/sales" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
            Voir <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        
        {todaySales.length === 0 ? (
          <div className="text-center py-4">
            <ShoppingBag className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-1" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Aucune vente aujourd'hui</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {todaySales.slice(0, 4).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{sale.invoice_number}</span>
                    {sale.is_credit ? (
                      <span className="text-[10px] bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">📝</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">💵</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">{format(new Date(sale.created_at), 'HH:mm')} • {sale.sale_items?.length || 0} articles</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{sale.grand_total?.toLocaleString()} FCFA</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats mois - compact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{monthlyStats?.totalSales || 0}</p>
          <p className="text-[10px] text-gray-400">Ventes</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{monthlyStats?.totalRevenue?.toLocaleString() || 0}</p>
          <p className="text-[10px] text-gray-400">CA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{monthlyStats?.averageTicket?.toLocaleString() || 0}</p>
          <p className="text-[10px] text-gray-400">Panier</p>
        </div>
      </div>

      {/* Activités récentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <Eye className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activités</h3>
        </div>
        {recentActivities.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">Aucune activité</p>
        ) : (
          <div className="space-y-1.5">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className={`w-1.5 h-1.5 rounded-full ${activity.isCredit ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{activity.message}</span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {formatDistanceToNow(new Date(activity.time), { locale: fr, addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard