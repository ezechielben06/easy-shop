import React, { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { Search, AlertTriangle, Package, ArrowUp, ArrowDown } from 'lucide-react'

const Stock = () => {
  const { products, loading, fetchProducts } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = filter === 'all' || 
      (filter === 'low' && p.quantity <= p.min_quantity) ||
      (filter === 'normal' && p.quantity > p.min_quantity)
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des stocks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez vos niveaux de stock en temps réel
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="all">Tous les stocks</option>
            <option value="low">Stock faible</option>
            <option value="normal">Stock normal</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Produit
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    SKU
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Quantité
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Min requis
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {product.sku || '-'}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {product.quantity}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                        {product.min_quantity || 5}
                      </td>
                      <td className="text-right py-3 px-4">
                        {product.quantity <= (product.min_quantity || 5) ? (
                          <span className="inline-flex items-center gap-1 text-orange-500 bg-orange-100 dark:bg-orange-900/20 px-3 py-1 rounded-full text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Stock faible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-500 bg-green-100 dark:bg-green-900/20 px-3 py-1 rounded-full text-sm">
                            <Package className="h-4 w-4" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Aucun produit trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Stock