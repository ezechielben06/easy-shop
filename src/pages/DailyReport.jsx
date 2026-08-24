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
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 animate-slide-up">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Rapport Journalier
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Suivi quotidien des performances
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field pl-10 w-40"
              />
            </div>
            <button className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
              <Download className="h-4 w-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total ventes</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.count || 0}</h3>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{stats?.total?.toLocaleString() || 0} FCFA</p>
        </div>

        <div className="stat-card bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Wallet className="h-4 w-4 text-green-500" />
                Espèces
              </p>
              <h3 className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                {stats?.cashCount || 0}
              </h3>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{stats?.cashTotal?.toLocaleString() || 0} FCFA</p>
        </div>

        <div className="stat-card bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-orange-500" />
                Crédit
              </p>
              <h3 className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">
                {stats?.creditCount || 0}
              </h3>
            </div>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{stats?.creditTotal?.toLocaleString() || 0} FCFA</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Panier moyen</p>
              <h3 className="text-2xl font-bold mt-1">
                {stats?.count > 0 ? Math.round(stats.total / stats.count).toLocaleString() : 0} FCFA
              </h3>
            </div>
            <TrendingDown className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {stats?.creditCount || 0} crédit(s)
          </p>
        </div>
      </div>

      {/* Détail des ventes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Détail des ventes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Heure
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Référence
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Montant
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {stats?.sales?.length > 0 ? (
                stats.sales.map((sale) => (
                  <tr key={sale.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(sale.created_at), 'HH:mm')}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {sale.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {sale.grand_total.toLocaleString()} FCFA
                    </td>
                    <td className="py-3 px-4">
                      {sale.is_credit ? (
                        <span className="inline-flex items-center gap-1 text-orange-500 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full text-xs">
                          <CreditCard className="h-3 w-3" />
                          Crédit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-500 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs">
                          <Wallet className="h-3 w-3" />
                          Espèces
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {sale.is_credit ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          sale.credit_status === 'paid' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : sale.credit_status === 'overdue'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {sale.credit_status === 'paid' ? '✅ Payé' : 
                           sale.credit_status === 'overdue' ? '⚠️ En retard' : '⏳ En attente'}
                        </span>
                      ) : (
                        <span className="text-green-500 text-xs">✅ Complété</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucune vente pour cette journée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DailyReport