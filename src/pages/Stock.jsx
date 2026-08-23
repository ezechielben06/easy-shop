import React, { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { 
  Search, 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Circle,
  RefreshCw,
  Loader2,
  DollarSign,
  ShoppingBag,
  Box
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Stock = () => {
  const { products, loading, fetchProducts } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('quantity')
  const [sortOrder, setSortOrder] = useState('asc')
  const [expandedProduct, setExpandedProduct] = useState(null)
  const [viewMode, setViewMode] = useState('cards') // 'cards' ou 'table'

  useEffect(() => {
    fetchProducts()
  }, [])

  // Statistiques
  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  const lowStockCount = products.filter(p => p.quantity <= p.min_quantity).length
  const outOfStockCount = products.filter(p => p.quantity === 0).length
  const healthyStockCount = products.filter(p => p.quantity > p.min_quantity).length

  // Filtrer et trier
  const filteredProducts = products
    .filter(product => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchFilter = filter === 'all' ||
        (filter === 'low' && product.quantity <= product.min_quantity) ||
        (filter === 'out' && product.quantity === 0) ||
        (filter === 'healthy' && product.quantity > product.min_quantity)
      
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name)
      else if (sortBy === 'quantity') comparison = a.quantity - b.quantity
      else if (sortBy === 'price') comparison = a.price - b.price
      else if (sortBy === 'category') comparison = (a.category || '').localeCompare(b.category || '')
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { label: 'Rupture', color: 'red', icon: AlertTriangle }
    if (product.quantity <= product.min_quantity) return { label: 'Stock faible', color: 'orange', icon: AlertTriangle }
    return { label: 'Stock OK', color: 'green', icon: Circle }
  }

  const getStockPercentage = (product) => {
    const max = product.quantity + product.min_quantity
    return Math.min((product.quantity / max) * 100, 100)
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
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Box className="h-6 w-6 text-blue-500" />
              Gestion des stocks
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Suivez vos niveaux de stock en temps réel
            </p>
          </div>
          <button
            onClick={() => fetchProducts()}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalProducts}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total produits</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalStock}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Unités en stock</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalValue.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Valeur totale</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{lowStockCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Stock faible</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Rupture</p>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field py-2 text-sm min-w-[130px]"
            >
              <option value="all">Tous les stocks</option>
              <option value="healthy">✅ Stock OK</option>
              <option value="low">⚠️ Stock faible</option>
              <option value="out">🚫 Rupture</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field py-2 text-sm min-w-[120px]"
            >
              <option value="name">Nom</option>
              <option value="quantity">Quantité</option>
              <option value="price">Prix</option>
              <option value="category">Catégorie</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary text-sm py-2 px-3 flex items-center gap-1"
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <Package className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      {filteredProducts.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {searchTerm || filter !== 'all' ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => {
            const status = getStockStatus(product)
            const percentage = getStockPercentage(product)
            const StatusIcon = status.icon

            return (
              <div
                key={product.id}
                className="card p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h4>
                    {product.category && (
                      <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        {product.category}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{product.sku || 'SKU: ---'}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    status.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    status.color === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Stock: {product.quantity}</span>
                    <span>Min: {product.min_quantity}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        product.quantity === 0 ? 'bg-red-500' :
                        product.quantity <= product.min_quantity ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Détails */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Prix</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.price.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Valeur stock</p>
                    <p className="font-medium text-blue-600 dark:text-blue-400">
                      {(product.price * product.quantity).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>

                {/* Expand */}
                <AnimatePresence>
                  {expandedProduct === product.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Prix d'achat</p>
                          <p className="font-medium">{product.cost_price?.toLocaleString() || 0} FCFA</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Marge</p>
                          <p className="font-medium text-green-500">
                            {product.cost_price ? Math.round(((product.price - product.cost_price) / product.price) * 100) : 0}%
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Description</p>
                          <p className="text-sm">{product.description || 'Aucune description'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      ) : (
        /* Vue tableau */
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Produit
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Catégorie
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Quantité
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Min
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Prix
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Valeur
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product)
                const StatusIcon = status.icon

                return (
                  <tr key={product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {product.category || '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {product.quantity}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">
                      {product.min_quantity}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {product.price.toLocaleString()} FCFA
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {(product.price * product.quantity).toLocaleString()} FCFA
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        status.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        status.color === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Légende */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Légende :</span>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Circle className="h-3 w-3 fill-green-500" />
            <span>Stock OK</span>
          </div>
          <div className="flex items-center gap-1 text-orange-500">
            <AlertTriangle className="h-3 w-3" />
            <span>Stock faible</span>
          </div>
          <div className="flex items-center gap-1 text-red-500">
            <AlertTriangle className="h-3 w-3" />
            <span>Rupture</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stock