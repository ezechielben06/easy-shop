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
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, startOfDay, endOfDay, subDays, addDays, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

const Sales = () => {
  const { sales, loading, fetchSales } = useSales()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSale, setExpandedSale] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('day') // 'day', 'week', 'month'

  useEffect(() => {
    loadSales()
  }, [selectedDate, viewMode])

  const loadSales = async () => {
    let dateFrom, dateTo
    
    if (viewMode === 'day') {
      dateFrom = startOfDay(selectedDate).toISOString()
      dateTo = endOfDay(selectedDate).toISOString()
    } else if (viewMode === 'week') {
      const start = new Date(selectedDate)
      start.setDate(start.getDate() - start.getDay())
      dateFrom = startOfDay(start).toISOString()
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      dateTo = endOfDay(end).toISOString()
    } else {
      const start = new Date(selectedDate)
      start.setDate(1)
      dateFrom = startOfDay(start).toISOString()
      const end = new Date(selectedDate)
      end.setMonth(end.getMonth() + 1, 0)
      dateTo = endOfDay(end).toISOString()
    }
    
    await fetchSales({ dateFrom, dateTo })
  }

  const filteredSales = sales.filter(sale => {
    const matchSearch = sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = filterType === 'all' ||
      (filterType === 'cash' && !sale.is_credit) ||
      (filterType === 'credit' && sale.is_credit)
    return matchSearch && matchFilter
  })

  const changeDate = (days) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + days)
      return newDate
    })
  }

  const getDateLabel = () => {
    if (isToday(selectedDate)) return "Aujourd'hui"
    if (isYesterday(selectedDate)) return 'Hier'
    return format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
  }

  const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
  }

  const getCreditStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
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
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ventes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {sales.length} vente{sales.length > 1 ? 's' : ''} enregistrée{sales.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/sales/new"
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Nouvelle vente
        </Link>
      </div>

      {/* Filtres et navigation */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro de facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-2 rounded-xl text-sm transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterType('cash')}
              className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1 ${
                filterType === 'cash'
                  ? 'bg-emerald-600 text-white'
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

        {/* Navigation par date */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getDateLabel()}
              </span>
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                viewMode === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Mois
            </button>
          </div>
        </div>
      </div>

      {/* Liste des ventes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {searchTerm ? 'Aucune vente trouvée' : 'Aucune vente pour cette période'}
          </p>
          <Link to="/sales/new" className="btn-primary mt-4">
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
                      <span className="badge-orange flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Crédit
                      </span>
                    ) : (
                      <span className="badge-green flex items-center gap-1">
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

              {/* Détails de la vente */}
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
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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

                    {/* Informations */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-500" />
                        Informations
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                          <span className="font-medium">{sale.total_amount?.toLocaleString() || 0} FCFA</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400">TVA (18%)</span>
                          <span className="font-medium">{sale.tax?.toLocaleString() || 0} FCFA</span>
                        </div>
                        {sale.discount > 0 && (
                          <div className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
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
                        <div className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-gray-500 dark:text-gray-400">Paiement</span>
                          <span className="font-medium">
                            {sale.is_credit ? (
                              <span className="text-orange-500 flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                Crédit
                              </span>
                            ) : (
                              <span className="text-emerald-500 flex items-center gap-1">
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
                          <div className="flex justify-between p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <span className="text-gray-500 dark:text-gray-400">Payé le</span>
                            <span className="font-medium text-emerald-500">
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