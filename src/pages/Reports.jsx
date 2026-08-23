import React, { useState, useEffect } from 'react'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'
import { 
  Calendar,
  Download,
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
  Printer,
  Loader2
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import toast from 'react-hot-toast'

const Reports = () => {
  const { getSalesStats, fetchSales } = useSales()
  const { products } = useProducts()
  const [period, setPeriod] = useState('month')
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  })
  const [stats, setStats] = useState(null)
  const [dailySales, setDailySales] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState('line')

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
      
      // Générer les données quotidiennes
      await generateDailyData()
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Erreur lors du chargement des statistiques')
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

  const periods = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' },
    { value: 'custom', label: 'Personnalisé' }
  ]

  const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 animate-slide-up">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Rapports
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Analysez les performances de votre boutique
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
            <button className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="input-label">Période</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input-field py-2"
            >
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="input-label">Du</label>
            <input
              type="date"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({
                ...dateRange,
                start: new Date(e.target.value)
              })}
              className="input-field py-2"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="input-label">Au</label>
            <input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({
                ...dateRange,
                end: new Date(e.target.value)
              })}
              className="input-field py-2"
            />
          </div>
          <button onClick={loadStats} className="btn-primary py-2 px-4">
            Appliquer
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">CA</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {stats?.totalRevenue?.toLocaleString() || 0} FCFA
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Ventes</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {stats?.totalSales || 0}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <PieChart className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Panier moyen</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {stats?.averageTicket?.toLocaleString() || 0} FCFA
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-500" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Période</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {dailySales.length} jours
          </p>
        </div>
      </div>

      {/* Graphique des ventes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Évolution des ventes
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                chartType === 'line' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Ligne
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                chartType === 'bar' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Barres
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                chartType === 'area' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Aire
            </button>
          </div>
        </div>

        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="CA (FCFA)"
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                  name="Nombre de ventes"
                />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                  name="CA (FCFA)"
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.2}
                  name="Nombre de ventes"
                />
              </AreaChart>
            ) : (
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="CA (FCFA)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="count" fill="#22c55e" name="Nombre de ventes" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top produits et répartition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top produits */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Top produits
          </h3>
          {stats?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {item.name || 'Produit'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.quantity} unités
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-blue-500 rounded-full h-1.5 transition-all duration-500"
                        style={{ 
                          width: `${(item.quantity / (stats.topProducts[0]?.quantity || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
              Aucune donnée disponible
            </p>
          )}
        </div>

        {/* Graphique circulaire */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Répartition des ventes
          </h3>
          {stats?.topProducts?.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={stats.topProducts.map((item, index) => ({
                      name: item.name || 'Produit',
                      value: item.quantity || 0
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => `${value} unités`}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
              Aucune donnée disponible
            </p>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="card text-center">
        <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Exporter le rapport
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Générez un rapport PDF ou Excel de cette période
        </p>
        <div className="flex justify-center gap-3">
          <button className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports