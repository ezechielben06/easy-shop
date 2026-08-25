import React, { useState, useEffect } from 'react'
import { useSales } from '../hooks/useSales'
import { Calendar, Download, TrendingUp, TrendingDown, CreditCard, Wallet, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const DailyReport = () => {
  const { getDailySales } = useSales()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [date])

  const loadStats = async () => {
    setLoading(true)
    const data = await getDailySales(new Date(date))
    setStats(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Rapport</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Suivi quotidien</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-7 pr-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-32"
            />
          </div>
          <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Ventes</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.count || 0}</p>
          <p className="text-[10px] text-gray-400">{stats?.total?.toLocaleString() || 0} FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm bg-emerald-50/30 dark:bg-emerald-900/5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Espèces</span>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.cashCount || 0}</p>
          <p className="text-[10px] text-gray-400">{stats?.cashTotal?.toLocaleString() || 0} FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm bg-orange-50/30 dark:bg-orange-900/5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Crédit</span>
          </div>
          <p className="text-xl font-bold text-orange-500">{stats?.creditCount || 0}</p>
          <p className="text-[10px] text-gray-400">{stats?.creditTotal?.toLocaleString() || 0} FCFA</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Moyenne</span>
          </div>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {stats?.count > 0 ? Math.round(stats.total / stats.count).toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-gray-400">FCFA</p>
        </div>
      </div>

      {/* Détail */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Détail des ventes</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto">
          {stats?.sales?.length > 0 ? (
            stats.sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{sale.invoice_number}</span>
                    <span className="text-[10px] text-gray-400">{format(new Date(sale.created_at), 'HH:mm')}</span>
                    {sale.is_credit ? (
                      <span className="text-[10px] bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">📝</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">💵</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {sale.sale_items?.length || 0} articles
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {sale.grand_total?.toLocaleString()} FCFA
                  </p>
                  {sale.is_credit && (
                    <span className={`text-[10px] ${
                      sale.credit_status === 'paid' ? 'text-emerald-500' :
                      sale.credit_status === 'overdue' ? 'text-red-500' : 'text-orange-500'
                    }`}>
                      {sale.credit_status === 'paid' ? '✅' :
                       sale.credit_status === 'overdue' ? '⚠️' : '⏳'}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucune vente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DailyReport