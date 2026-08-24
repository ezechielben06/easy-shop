import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSales } from '../hooks/useSales'
import { 
  Plus, 
  Search, 
  Package, 
  Loader2,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const Sales = () => {
  const { sales, loading, fetchSales } = useSales()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSale, setExpandedSale] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'cash', 'credit'

  useEffect(() => {
    fetchSales()
  }, [])

  const filteredSales = sales.filter(sale => {
    const matchSearch = sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = filterType === 'all' ||
      (filterType === 'cash' && !sale.is_credit) ||
      (filterType === 'credit' && sale.is_credit)
    return matchSearch && matchFilter
  })

  const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
  }

  const getCreditStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      case 'overdue': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  const getCreditStatusLabel = (status) => {
    switch(status) {
      case 'paid': return '✅ Payé'
      case 'overdue': return '⚠️ En retard'
      default: return '⏳ En attente'
    }
  }

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
              {sales.length} vente{sales.length > 1 ? 's' : ''} enregistrée{sales.length > 1 ? 's' : ''}
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

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro de facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-2 rounded-xl text-sm transition-all ${
                filterType === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterType('cash')}
              className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1 ${
                filterType === 'cash'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Wallet className="h-4 w-4" />
              Espèces
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1 ${
                filterType === 'credit'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Crédit
            </button>
          </div>
        </div>
      </div>

      {/* Liste des ventes */}
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
        <div className="space-y-3">
          {filteredSales.map((sale) => (
            <div key={sale.id} className="card p-4 hover:shadow-lg transition-all">
              {/* En-tête de la vente */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {sale.invoice_number}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(sale.created_at)}
                    </span>
                    {sale.is_credit ? (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Crédit
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        Espèces
                      </span>
                    )}
                    {sale.is_credit && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCreditStatusColor(sale.credit_status)}`}>
                        {getCreditStatusLabel(sale.credit_status)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {sale.sale_items?.length || 0} article{sale.sale_items?.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {sale.grand_total?.toLocaleString() || 0} FCFA
                    </span>
                    {sale.is_credit && sale.due_date && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Échéance: {format(new Date(sale.due_date), 'dd/MM/yyyy')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {expandedSale === sale.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </div>
              </div>

              {/* Détails de la vente - avec images */}
              {expandedSale === sale.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Produits */}
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        Produits vendus
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {sale.sale_items?.map((item, index) => {
                          const product = item.products || {}
                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              {/* Image du produit */}
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name || 'Produit'}
                                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-600"
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package className="h-7 w-7 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {product.name || 'Produit'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{item.quantity} x {item.unit_price?.toLocaleString()} FCFA</span>
                                  {product.category && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <span className="text-gray-400">{product.category}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap">
                                {item.total_price?.toLocaleString()} FCFA
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Informations de la vente */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-500" />
                        Informations
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                          <span className="font-medium">{sale.total_amount?.toLocaleString() || 0} FCFA</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400">TVA (18%)</span>
                          <span className="font-medium">{sale.tax?.toLocaleString() || 0} FCFA</span>
                        </div>
                        {sale.discount > 0 && (
                          <div className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-gray-500 dark:text-gray-400">Remise</span>
                            <span className="font-medium text-red-500">{sale.discount?.toLocaleString() || 0} FCFA</span>
                          </div>
                        )}
                        <div className="flex justify-between p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {sale.grand_total?.toLocaleString() || 0} FCFA
                          </span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400">Paiement</span>
                          <span className="font-medium">
                            {sale.is_credit ? (
                              <span className="text-orange-500 flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                Crédit
                              </span>
                            ) : (
                              <span className="text-green-500 flex items-center gap-1">
                                <Wallet className="h-4 w-4" />
                                Espèces
                              </span>
                            )}
                          </span>
                        </div>
                        {sale.is_credit && sale.due_date && (
                          <div className="flex justify-between p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <span className="text-gray-500 dark:text-gray-400">Échéance</span>
                            <span className="font-medium text-orange-500">
                              {format(new Date(sale.due_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                        {sale.is_credit && sale.credit_status === 'paid' && sale.paid_at && (
                          <div className="flex justify-between p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <span className="text-gray-500 dark:text-gray-400">Payé le</span>
                            <span className="font-medium text-green-500">
                              {formatDate(sale.paid_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Sales