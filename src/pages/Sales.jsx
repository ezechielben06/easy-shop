import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSales } from '../hooks/useSales'
import { Plus, Search, Package, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const Sales = () => {
  const { sales, loading, fetchSales } = useSales()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSales()
  }, [])

  const filteredSales = sales.filter(sale =>
    sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 pb-20 animate-slide-up">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Ventes
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sales.length} ventes enregistrées
            </p>
          </div>
          <Link
            to="/sales/new"
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            <Plus className="h-4 w-4" />
            Nouvelle vente
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une vente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Liste des ventes */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="card text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucune vente trouvée' : 'Aucune vente enregistrée'}
            </p>
            <Link to="/sales/new" className="btn-primary inline-block mt-4">
              Créer une vente
            </Link>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {sale.invoice_number}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {sale.sale_items?.length || 0} articles
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {sale.grand_total?.toLocaleString() || 0} FCFA
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Complétée
                  </span>
                  <span className="text-xs text-gray-400">
                    {sale.sale_items?.length || 0} article{sale.sale_items?.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Sales