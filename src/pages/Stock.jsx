import React, { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { 
  Search, 
  AlertTriangle, 
  Package, 
  Loader2,
  Box,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'

const Stock = () => {
  const { products, loading, fetchProducts } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0)
  const lowStockCount = products.filter(p => p.quantity <= p.min_quantity).length
  const outOfStockCount = products.filter(p => p.quantity === 0).length

  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchFilter = filter === 'all' ||
      (filter === 'low' && product.quantity <= product.min_quantity) ||
      (filter === 'out' && product.quantity === 0) ||
      (filter === 'healthy' && product.quantity > product.min_quantity)
    return matchSearch && matchFilter
  })

  const getStatus = (product) => {
    if (product.quantity === 0) return { label: 'Rupture', color: 'text-red-500', icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/10' }
    if (product.quantity <= product.min_quantity) return { label: 'Faible', color: 'text-orange-500', icon: AlertTriangle, bg: 'bg-orange-50 dark:bg-orange-900/10' }
    return { label: 'OK', color: 'text-emerald-500', icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-900/10' }
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
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Box className="h-5 w-5 text-blue-500" /> Stock
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Suivi des niveaux</p>
        </div>
        <button onClick={() => fetchProducts()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <RefreshCw className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{totalProducts}</p>
          <p className="text-[10px] text-gray-400">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{totalStock}</p>
          <p className="text-[10px] text-gray-400">Unités</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/5 rounded-xl p-2 text-center border border-orange-200 dark:border-orange-800">
          <p className="text-sm font-bold text-orange-500">{lowStockCount}</p>
          <p className="text-[10px] text-gray-400">Faible</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/5 rounded-xl p-2 text-center border border-red-200 dark:border-red-800">
          <p className="text-sm font-bold text-red-500">{outOfStockCount}</p>
          <p className="text-[10px] text-gray-400">Rupture</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="py-2 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[100px]"
        >
          <option value="all">Tous</option>
          <option value="healthy">✅ OK</option>
          <option value="low">⚠️ Faible</option>
          <option value="out">🚫 Rupture</option>
        </select>
      </div>

      {/* Liste */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucun produit</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredProducts.map((product) => {
            const status = getStatus(product)
            const StatusIcon = status.icon
            return (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</span>
                      {product.category && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">{product.category}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span>Stock: <strong className={product.quantity <= product.min_quantity ? 'text-orange-500' : 'text-emerald-500'}>{product.quantity}</strong></span>
                      <span>Min: {product.min_quantity}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-medium flex items-center gap-1 ${status.color} ${status.bg} px-2 py-0.5 rounded-full`}>
                      <StatusIcon className="h-3 w-3" /> {status.label}
                    </span>
                    <p className="text-[10px] text-gray-400">{product.price.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Stock