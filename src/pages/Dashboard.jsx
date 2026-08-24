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
  Calendar,
  ChevronRight,
  XCircle,
  CheckCircle,
  List,
  Grid,
  RefreshCw,
  TrendingUp as TrendingUpIcon
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
      
      // 1. Récupérer les ventes du jour
      const today = await getDailySales()
      setTodayStats(today)
      setTodaySales(today.sales || [])
      
      // 2. Récupérer les produits vendus aujourd'hui
      await loadTodayProducts(today.sales || [])
      
      // 3. Stats mensuelles
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const endOfMonth = new Date()
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0)
      
      const stats = await getSalesStats(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      )
      setMonthlyStats(stats)
      
      // 4. Produits en stock
      const allProducts = await fetchProducts()
      setTotalProducts(allProducts.length)
      const lowStock = allProducts.filter(p => p.quantity <= p.min_quantity)
      setLowStockProducts(lowStock)
      
      // 5. Activités récentes
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
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  const totalSales = todayStats.count || 0
  const cashPercentage = totalSales > 0 ? Math.round((todayStats.cashCount / totalSales) * 100) : 0
  const creditPercentage = totalSales > 0 ? Math.round((todayStats.creditCount / totalSales) * 100) : 0

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
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Ventes du jour</p>
              <p className="stat-value">{todayStats.count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {todayStats.total.toLocaleString()} FCFA
              </p>
            </div>
            <div className="stat-icon">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                Espèces
              </p>
              <p className="stat-value text-emerald-600 dark:text-emerald-400">
                {todayStats.cashCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {todayStats.cashTotal.toLocaleString()} FCFA
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card border-orange-200/60 dark:border-orange-800/30 bg-orange-50/30 dark:bg-orange-900/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Crédit
              </p>
              <p className="stat-value text-orange-500">
                {todayStats.creditCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {todayStats.creditTotal.toLocaleString()} FCFA
              </p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card border-purple-200/60 dark:border-purple-800/30 bg-purple-50/30 dark:bg-purple-900/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label flex items-center gap-1">
                <Package className="h-3 w-3" />
                Produits vendus
              </p>
              <p className="stat-value text-purple-600 dark:text-purple-400">
                {todayProductsTotal}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {todayProducts.length} produits différents
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Répartition Espèces/Crédit */}
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

      {/* ============================================ */}
      {/* LISTE DES PRODUITS VENDUS AUJOURD'HUI */}
      {/* ============================================ */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Produits vendus aujourd'hui
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              {todayProductsTotal} unités
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-400'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-400'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {todayProducts.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun produit vendu aujourd'hui</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400">
              <div className="col-span-5">Produit</div>
              <div className="col-span-3 text-center">Catégorie</div>
              <div className="col-span-2 text-center">Quantité</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            
            {todayProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 bg-gray-50 dark:bg-gray-800/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-8 h-8 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {product.name}
                  </span>
                </div>
                <div className="col-span-3 text-center text-xs text-gray-500 dark:text-gray-400 truncate">
                  {product.category || '-'}
                </div>
                <div className="col-span-2 text-center font-bold text-blue-600 dark:text-blue-400">
                  {product.total_quantity}
                </div>
                <div className="col-span-2 text-right font-medium text-gray-900 dark:text-white">
                  {product.total_revenue.toLocaleString()} FCFA
                </div>
              </div>
            ))}
            
            {/* Total général */}
            <div className="grid grid-cols-12 gap-2 px-3 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="col-span-7 font-semibold text-gray-900 dark:text-white">
                Total général
              </div>
              <div className="col-span-3 text-center font-bold text-blue-600 dark:text-blue-400">
                {todayProducts.reduce((sum, p) => sum + p.total_quantity, 0)} unités
              </div>
              <div className="col-span-2 text-right font-bold text-blue-600 dark:text-blue-400">
                {todayProducts.reduce((sum, p) => sum + p.total_revenue, 0).toLocaleString()} FCFA
              </div>
            </div>
          </div>
        ) : (
          /* Vue grille */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {todayProducts.map((product) => (
              <div key={product.id} className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl text-center hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-lg mx-auto mb-2"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Package className="h-7 w-7 text-gray-400" />
                  </div>
                )}
                <p className="font-medium text-gray-900 dark:text-white text-xs truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {product.category || '-'}
                </p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {product.total_quantity} unités
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.total_revenue.toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alertes stock */}
      {lowStockProducts.length > 0 && (
        <div className="card p-6 border-orange-200/60 dark:border-orange-800/30 bg-orange-50/30 dark:bg-orange-900/5">
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

      {/* Ventes du jour - Dernières ventes */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Dernières ventes
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
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {monthlyStats?.cashCount || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Espèces</p>
            </div>
            <div className="text-center bg-orange-50 dark:bg-orange-900/10 rounded-lg p-2">
              <p className="text-sm font-bold text-orange-500">
                {monthlyStats?.creditCount || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Crédit</p>
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