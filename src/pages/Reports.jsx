import React, { useState, useEffect } from 'react'
import { useSales } from '../hooks/useSales'
import { 
  Calendar,
  Download,
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
  Printer,
  Loader2,
  Wallet,
  CreditCard,
  ChevronRight
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
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
    } finally {
      setLoading(false)
    }
  }

  const generateDailyData = async () => {
    const days = []
    let currentDate = new Date(dateRange.start)
    while (currentDate <= dateRange.end) {
      const start = new Date(currentDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(currentDate)
      end.setHours(23, 59, 59, 999)

      const sales = await fetchSales({
        dateFrom: start.toISOString(),
        dateTo: end.toISOString()
      })

      const total = sales.reduce((sum, s) => sum + (s.grand_total || 0), 0)
      const count = sales.length

      days.push({
        date: format(currentDate, 'dd/MM'),
        fullDate: currentDate,
        total: total,
        count: count,
        average: count > 0 ? total / count : 0
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    setDailySales(days)
  }

  const periods = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' },
    { value: 'custom', label: 'Personnalisé' }
  ]

  const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rapports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Analysez les performances de votre boutique
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
          <button className="btn-secondary text-sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="input-label">Période</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input"
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
              className="input"
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
              className="input"
            />
          </div>
          <button onClick={loadStats} className="btn-primary">
            Appliquer
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">CA total</p>
              <p className="stat-value">{stats?.totalRevenue?.toLocaleString() || 0} FCFA</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Ventes</p>
              <p className="stat-value">{stats?.totalSales || 0}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Panier moyen</p>
              <p className="stat-value">{stats?.averageTicket?.toLocaleString() || 0} FCFA</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Période</p>
              <p className="stat-value">{dailySales.length} jours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Répartition Espèces/Crédit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Répartition des paiements
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Espèces</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {stats?.cashTotal?.toLocaleString() || 0} FCFA
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.totalRevenue > 0 ? (stats.cashTotal / stats.totalRevenue) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Crédit</span>
                <span className="text-sm font-bold text-orange-500">
                  {stats?.creditTotal?.toLocaleString() || 0} FCFA
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.totalRevenue > 0 ? (stats.creditTotal / stats.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalSales || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total ventes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top produits */}
        <div className="card p-6">
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
      </div>

      {/* Graphique */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Évolution des ventes
          </h3>
          <div className="flex gap-1">
            {['line', 'bar', 'area'].map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  chartType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'line' ? 'Ligne' : type === 'bar' ? 'Barres' : 'Aire'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} name="CA (FCFA)" />
                <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="Nombre de ventes" />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                />
                <Legend />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} name="CA (FCFA)" />
                <Area type="monotone" dataKey="count" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Nombre de ventes" />
              </AreaChart>
            ) : (
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                />
                <Legend />
                <Bar dataKey="total" fill="#2563eb" name="CA (FCFA)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="count" fill="#22c55e" name="Nombre de ventes" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export */}
      <div className="card p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Exporter le rapport
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Générez un rapport PDF ou Excel de cette période
        </p>
        <div className="flex justify-center gap-3">
          <button className="btn-primary">
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button className="btn-secondary">
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports