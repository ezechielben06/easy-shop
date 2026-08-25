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
  Calendar,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Eye
} from 'lucide-react'
import { format, startOfDay, endOfDay, isToday, isYesterday, subDays, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

const Sales = () => {
  const { sales, loading, fetchSales } = useSales()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSale, setExpandedSale] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('day')

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
    setSelectedDate(prev => addDays(prev, days))
  }

  const getDateLabel = () => {
    if (isToday(selectedDate)) return "Aujourd'hui"
    if (isYesterday(selectedDate)) return 'Hier'
    return format(selectedDate, 'EEEE d MMMM', { locale: fr })
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

  const clearSearch = () => setSearchTerm('')

  // Calcul des stats du jour
  const todayCount = filteredSales.length
  const todayTotal = filteredSales.reduce((sum, s) => sum + (s.grand_total || 0), 0)
  const cashCount = filteredSales.filter(s => !s.is_credit).length
  const creditCount = filteredSales.filter(s => s.is_credit).length

  return (
    <div className="space-y-3 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Ventes</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {sales.length} vente{sales.length > 1 ? 's' : ''} enregistrée{sales.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/sales/new"
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.97] shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nouvelle
        </Link>
      </div>

      {/* Navigation date */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getDateLabel()}</span>
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        
        {/* Vue mode */}
        <div className="flex justify-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              viewMode === 'day'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Jour
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              viewMode === 'week'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Mois
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{todayCount}</p>
          <p className="text-[10px] text-gray-400">Ventes</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{todayTotal.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{cashCount}</p>
          <p className="text-[10px] text-gray-400">💵 Espèces</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl border transition-all ${
            showFilters ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'border-gray-200 dark:border-gray-700 text-gray-400'
          }`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Filtres déroulants */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm space-y-2 animate-slide-down">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 ${
                filterType === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterType('cash')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 flex items-center justify-center gap-1 ${
                filterType === 'cash'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Wallet className="h-3 w-3" /> Espèces
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 flex items-center justify-center gap-1 ${
                filterType === 'credit'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <CreditCard className="h-3 w-3" /> Crédit
            </button>
          </div>
          {filterType !== 'all' && (
            <div className="text-center text-[10px] text-gray-400">
              {filterType === 'cash' ? '💵 Ventes en espèces' : '📝 Ventes à crédit'}
            </div>
          )}
        </div>
      )}

      {/* Liste des ventes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {searchTerm ? 'Aucune vente trouvée' : 'Aucune vente pour cette période'}
          </p>
          <Link to="/sales/new" className="inline-block mt-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-xl transition-all">
            Créer une vente
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSales.map((sale) => {
            const isExpanded = expandedSale === sale.id
            const hasCredit = sale.is_credit

            return (
              <div key={sale.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {/* En-tête */}
                <div 
                  className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {sale.invoice_number}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(sale.created_at), 'HH:mm')}
                        </span>
                        {hasCredit ? (
                          <span className="text-[10px] bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <CreditCard className="h-2.5 w-2.5" /> Crédit
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Wallet className="h-2.5 w-2.5" /> Espèces
                          </span>
                        )}
                        {hasCredit && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getCreditStatusColor(sale.credit_status)}`}>
                            {getCreditStatusLabel(sale.credit_status)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{sale.sale_items?.length || 0} articles</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {sale.grand_total?.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Détails */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-800/30">
                    {/* Produits */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produits</p>
                      {sale.sale_items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          {item.products?.image_url ? (
                            <img src={item.products.image_url} alt="" className="w-8 h-8 object-cover rounded-lg flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                            {item.products?.name || 'Produit'}
                          </span>
                          <span className="text-[10px] text-gray-400">{item.quantity}×</span>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {item.total_price?.toLocaleString()} FCFA
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Infos supplémentaires */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400">Sous-total</p>
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{sale.total_amount?.toLocaleString()} FCFA</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400">Total</p>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{sale.grand_total?.toLocaleString()} FCFA</p>
                      </div>
                      {hasCredit && sale.due_date && (
                        <div className="col-span-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg p-2 border border-orange-200 dark:border-orange-800">
                          <p className="text-[10px] text-orange-500">📅 Échéance</p>
                          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                            {format(new Date(sale.due_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Sales