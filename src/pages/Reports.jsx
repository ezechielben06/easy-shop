import React, { useState, useEffect } from 'react'
import { useSales } from '../hooks/useSales'
import { 
  Calendar,
  Download,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  Printer,
  Loader2,
  Wallet,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Award,
  Zap,
  ShoppingBag,
  Package
} from 'lucide-react'  // ← TOUS LES IMPORTS DE LUCIDE-REACT ICI
import { format, startOfMonth, endOfMonth, addMonths, eachDayOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'  // ← TOUS LES IMPORTS DE RECHARTS ICI
import toast from 'react-hot-toast'

const Reports = () => {
  const { getSalesStats, fetchSales } = useSales()
  const [period, setPeriod] = useState('month')
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  })
  const [stats, setStats] = useState(null)
  const [dailySales, setDailySales] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState('line')
  const [viewMode, setViewMode] = useState('overview')

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await getSalesStats(
        dateRange.start.toISOString(),
        dateRange.end.toISOString()
      )
      setStats(data)
      await generateDailyData()
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const generateDailyData = async () => {
    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end
    })

    const dailyData = []
    for (const day of days) {
      const start = new Date(day)
      start.setHours(0, 0, 0, 0)
      const end = new Date(day)
      end.setHours(23, 59, 59, 999)

      const sales = await fetchSales({
        dateFrom: start.toISOString(),
        dateTo: end.toISOString()
      })

      const total = sales.reduce((sum, s) => sum + (s.grand_total || 0), 0)
      const count = sales.length

      dailyData.push({
        date: format(day, 'dd/MM'),
        fullDate: day,
        total: total,
        count: count,
        average: count > 0 ? total / count : 0
      })
    }

    setDailySales(dailyData)
  }

  const changeMonth = (direction) => {
    const newStart = addMonths(dateRange.start, direction)
    const newEnd = endOfMonth(newStart)
    setDateRange({ start: newStart, end: newEnd })
  }

  const periods = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' }
  ]

  // Calcul des tendances
  const getTrend = () => {
    if (dailySales.length < 2) return { direction: 'stable', percentage: 0 }
    const last = dailySales[dailySales.length - 1]?.total || 0
    const previous = dailySales[dailySales.length - 2]?.total || 0
    if (previous === 0) return { direction: 'stable', percentage: 0 }
    const change = ((last - previous) / previous) * 100
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(change)
    }
  }

  const trend = getTrend()

  // Meilleur jour
  const bestDay = dailySales.reduce((best, day) => 
    day.total > (best?.total || 0) ? day : best, null
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Rapports
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Analyse des performances
          </p>
        </div>
        <button 
          onClick={loadStats} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Navigation mois */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => changeMonth(-1)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {format(dateRange.start, 'MMMM yyyy', { locale: fr })}
            </span>
          </div>
          <button 
            onClick={() => changeMonth(1)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="flex justify-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                period === p.value
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats rapides - 4 colonnes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">CA</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {stats?.totalRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-[10px] text-gray-400">FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Ventes</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {stats?.totalSales || 0}
          </p>
          <p className="text-[10px] text-gray-400">transactions</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Espèces</span>
          </div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.cashCount || 0}
          </p>
          <p className="text-[10px] text-gray-400">{stats?.cashTotal?.toLocaleString() || 0} FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-orange-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Crédit</span>
          </div>
          <p className="text-lg font-bold text-orange-500">
            {stats?.creditCount || 0}
          </p>
          <p className="text-[10px] text-gray-400">{stats?.creditTotal?.toLocaleString() || 0} FCFA</p>
        </div>
      </div>

      {/* Tendance et meilleur jour */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Zap className={`h-4 w-4 ${
              trend.direction === 'up' ? 'text-emerald-500' : 
              trend.direction === 'down' ? 'text-red-500' : 'text-gray-400'
            }`} />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Tendance</span>
          </div>
          <p className={`text-base font-bold ${
            trend.direction === 'up' ? 'text-emerald-500' : 
            trend.direction === 'down' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'}
            {trend.percentage > 0 && ` ${trend.percentage.toFixed(1)}%`}
          </p>
          <p className="text-[10px] text-gray-400">vs jour précédent</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Meilleur jour</span>
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white">
            {bestDay?.date || '-'}
          </p>
          <p className="text-[10px] text-gray-400">{bestDay?.total?.toLocaleString() || 0} FCFA</p>
        </div>
      </div>

      {/* Top produits */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top produits</h3>
            <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">
              {stats?.topProducts?.length || 0}
            </span>
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            {viewMode === 'overview' ? 'Détail' : 'Résumé'}
          </button>
        </div>
        
        {stats?.topProducts?.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {stats.topProducts.slice(0, viewMode === 'overview' ? 3 : 5).map((item, index) => (
              <div key={index} className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className={`text-sm font-bold w-7 text-center ${
                  index === 0 ? 'text-yellow-500' : 
                  index === 1 ? 'text-gray-400' : 
                  index === 2 ? 'text-orange-400' : 'text-gray-400'
                }`}>
                  #{index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name || 'Produit'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {item.quantity} unités • {item.total?.toLocaleString() || 0} FCFA
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {((item.total / (stats?.totalRevenue || 1)) * 100).toFixed(1)}%
                  </span>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${Math.min((item.quantity / (stats.topProducts[0]?.quantity || 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée</p>
          </div>
        )}
      </div>

      {/* Graphique */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Évolution des ventes
          </h3>
          <div className="flex gap-1">
            {['line', 'bar', 'area'].map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-2.5 py-1 text-[10px] rounded-lg transition-colors ${
                  chartType === type 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'line' ? '📈' : type === 'bar' ? '📊' : '📉'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 h-52">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" fontSize={9} tick={{ fill: '#6b7280' }} tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} name="CA" />
                <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} name="Ventes" />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" fontSize={9} tick={{ fill: '#6b7280' }} tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} name="CA" />
                <Area type="monotone" dataKey="count" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="Ventes" />
              </AreaChart>
            ) : (
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" fontSize={9} tick={{ fill: '#6b7280' }} tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="total" fill="#2563eb" name="CA" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Reports