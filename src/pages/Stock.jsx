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
  Box,
  CheckCircle,
  XCircle
} from 'lucide-react'

const Stock = () => {
  const { products, loading, fetchProducts } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('quantity')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    fetchProducts()
  }, [])

  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  const lowStockCount = products.filter(p => p.quantity <= p.min_quantity).length
  const outOfStockCount = products.filter(p => p.quantity === 0).length

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
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { label: 'Rupture', color: 'red', icon: XCircle }
    if (product.quantity <= product.min_quantity) return { label: 'Stock faible', color: 'orange', icon: AlertTriangle }
    return { label: 'Stock OK', color: 'green', icon: CheckCircle }
  }

  const getStockPercentage = (product) => {
    const max = product.quantity + product.min_quantity
    return Math.min((product.quantity / max) * 100, 100)
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Box className="h-6 w-6 text-blue-500" />
            Gestion des stocks
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Suivez vos niveaux de stock en temps réel
          </p>
        </div>
        <button
          onClick={() => fetchProducts()}
          className="btn-secondary"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Total produits</p>
              <p className="stat-value">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Unités en stock</p>
              <p className="stat-value">{totalStock}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Valeur totale</p>
              <p className="stat-value">{totalValue.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Stock faible</p>
              <p className="stat-value text-orange-500">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Rupture</p>
              <p className="stat-value text-red-500">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input min-w-[130px]"
            >
              <option value="all">Tous les stocks</option>
              <option value="healthy">✅ Stock OK</option>
              <option value="low">⚠️ Stock faible</option>
              <option value="out">🚫 Rupture</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input min-w-[100px]"
            >
              <option value="name">Nom</option>
              <option value="quantity">Quantité</option>
              <option value="price">Prix</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary px-3"
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {filteredProducts.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {searchTerm || filter !== 'all' ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th className="text-right">Quantité</th>
                  <th className="text-right">Min</th>
                  <th className="text-right">Prix</th>
                  <th className="text-right">Valeur</th>
                  <th className="text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product)
                  const percentage = getStockPercentage(product)
                  const StatusIcon = status.icon
                  const statusColors = {
                    green: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
                    orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
                    red: 'text-red-500 bg-red-50 dark:bg-red-900/20'
                  }

                  return (
                    <tr key={product.id}>
                      <td>
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
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category || '-'}</td>
                      <td className="text-right font-medium">
                        {product.quantity}
                      </td>
                      <td className="text-right text-gray-500">
                        {product.min_quantity}
                      </td>
                      <td className="text-right font-medium text-blue-600 dark:text-blue-400">
                        {product.price.toLocaleString()} FCFA
                      </td>
                      <td className="text-right font-medium">
                        {(product.price * product.quantity).toLocaleString()} FCFA
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[status.color]}`}>
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
        </div>
      )}

      {/* Légende */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Légende :</span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            Stock OK
          </span>
          <span className="flex items-center gap-1.5 text-orange-500">
            <AlertTriangle className="h-4 w-4" />
            Stock faible
          </span>
          <span className="flex items-center gap-1.5 text-red-500">
            <XCircle className="h-4 w-4" />
            Rupture
          </span>
        </div>
      </div>
    </div>
  )
}

export default Stock