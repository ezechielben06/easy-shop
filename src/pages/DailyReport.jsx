import React, { useState } from 'react'
import { Calendar, Download, TrendingUp, TrendingDown } from 'lucide-react'

const DailyReport = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rapport Journalier
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suivi quotidien des performances
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field pl-10 w-48"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Ventes</p>
              <h3 className="text-2xl font-bold mt-1">0</h3>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">0 FCFA</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chiffre d'affaires</p>
              <h3 className="text-2xl font-bold mt-1">0 FCFA</h3>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">+0% vs hier</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Panier moyen</p>
              <h3 className="text-2xl font-bold mt-1">0 FCFA</h3>
            </div>
            <TrendingDown className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Moyenne</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Meilleur vendeur</p>
              <h3 className="text-2xl font-bold mt-1">-</h3>
            </div>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">0 produits</p>
        </div>
      </div>

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
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Aucune vente pour cette journée
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DailyReport