import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import ImageUpload from '../components/products/ImageUpload'
import LazyImage from '../components/common/LazyImage'
import { supabase } from '../lib/supabaseClient'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  AlertTriangle, 
  X,
  Loader2,
  Grid,
  List,
  Eye,
  Filter,
  ChevronDown,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Box
} from 'lucide-react'
import toast from 'react-hot-toast'

const Products = () => {
  const navigate = useNavigate()
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [tempImageData, setTempImageData] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    min_quantity: '5',
    category: '',
    image_url: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  const filteredProducts = products
    .filter(product => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchCategory = filterCategory === 'all' || product.category === filterCategory
      const matchStock = filterStock === 'all' || 
        (filterStock === 'low' && product.quantity <= product.min_quantity) ||
        (filterStock === 'out' && product.quantity === 0) ||
        (filterStock === 'healthy' && product.quantity > product.min_quantity)
      return matchSearch && matchCategory && matchStock
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'price') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'stock') return a.quantity - b.quantity
      return 0
    })

  const handleImageUploaded = (imageUrl) => {
    setFormData({ ...formData, image_url: imageUrl })
    if (imageUrl && imageUrl.startsWith('data:image')) {
      setTempImageData(imageUrl)
    } else {
      setTempImageData(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Le nom du produit est requis')
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Le prix doit être supérieur à 0')
      return
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      category: formData.category?.trim() || null,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity) || 0,
      min_quantity: parseInt(formData.min_quantity) || 5,
      image_url: null
    }

    try {
      let result

      if (editingProduct) {
        if (formData.image_url && !formData.image_url.startsWith('data:image')) {
          productData.image_url = formData.image_url
        }
        result = await updateProduct(editingProduct.id, productData)
        if (result && tempImageData) {
          await uploadTempImageToStorage(result.id, tempImageData)
        }
      } else {
        result = await createProduct(productData)
        if (result && tempImageData) {
          await uploadTempImageToStorage(result.id, tempImageData)
        }
      }

      if (result) {
        setShowForm(false)
        setEditingProduct(null)
        resetForm()
        await fetchProducts()
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const uploadTempImageToStorage = async (productId, base64Image) => {
    try {
      const response = await fetch(base64Image)
      const blob = await response.blob()
      const fileExt = blob.type.split('/')[1] || 'jpg'
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      const file = new File([blob], fileName, { type: blob.type })

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)

      if (updateError) throw updateError

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      setTempImageData(null)
      
      toast.success('Image sauvegardée !')
      await fetchProducts()
      
      return publicUrl
    } catch (error) {
      console.error('Error uploading temp image:', error)
      toast.error('Erreur lors de la sauvegarde de l\'image')
      return null
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      min_quantity: '5',
      category: '',
      image_url: ''
    })
    setTempImageData(null)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      min_quantity: product.min_quantity?.toString() || '5',
      category: product.category || '',
      image_url: product.image_url || ''
    })
    setTempImageData(null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      await deleteProduct(id)
    }
  }

  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  const lowStockCount = products.filter(p => p.quantity <= p.min_quantity).length
  const outOfStockCount = products.filter(p => p.quantity === 0).length

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { label: 'Rupture', color: 'red', icon: AlertTriangle }
    if (product.quantity <= product.min_quantity) return { label: 'Stock faible', color: 'orange', icon: AlertTriangle }
    return { label: 'En stock', color: 'green', icon: null }
  }

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Produits
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {products.length} produits en stock
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingProduct(null)
              resetForm()
              setShowForm(!showForm)
            }}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-3"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Stats rapides - mobile friendly */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 text-center shadow-sm">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalProducts}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 text-center shadow-sm">
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalStock}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">En stock</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 text-center shadow-sm">
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {totalValue.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Valeur</p>
        </div>
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 border text-center shadow-sm ${
          lowStockCount > 0 ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10' : 'border-gray-100 dark:border-gray-700'
        }`}>
          <p className={`text-xl font-bold ${lowStockCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {lowStockCount}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">⚠️ Stock faible</p>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="mx-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-blue-200/60 dark:border-blue-800/30 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingProduct(null)
                resetForm()
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Image du produit
                </label>
                <ImageUpload
                  productId={editingProduct?.id || 'new'}
                  currentImage={formData.image_url}
                  onImageUploaded={handleImageUploaded}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-2.5 px-4 text-sm"
                  placeholder="Ex: T-shirt Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-2.5 px-4 text-sm"
                  placeholder="Ex: Vêtements, Électronique..."
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Prix de vente (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-2.5 px-4 text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Quantité en stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-2.5 px-4 text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Stock minimum *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-2.5 px-4 text-sm"
                  placeholder="5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-2.5 px-4 text-sm"
                  rows="3"
                  placeholder="Description du produit..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingProduct(null)
                  resetForm()
                }}
                className="btn-secondary text-sm py-2.5 px-5"
              >
                Annuler
              </button>
              <button type="submit" className="btn-primary text-sm py-2.5 px-5" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  editingProduct ? 'Mettre à jour' : 'Enregistrer'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres et recherche - compact */}
      <div className="mx-4 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors flex-shrink-0 ${
                showFilters ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden xs:inline">Filtres</span>
              {filterStock !== 'all' && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>

            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <Grid className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <List className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Filtres déroulants - mobile friendly */}
          {showFilters && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 animate-slide-down">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-0.5">Catégorie</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-1.5 px-3 text-sm"
                    >
                      <option value="all">Toutes</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-0.5">Stock</label>
                    <select
                      value={filterStock}
                      onChange={(e) => setFilterStock(e.target.value)}
                      className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-1.5 px-3 text-sm"
                    >
                      <option value="all">Tous</option>
                      <option value="healthy">✅ Stock OK</option>
                      <option value="low">⚠️ Stock faible</option>
                      <option value="out">🚫 Rupture</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 py-1.5 px-3 text-sm flex-1 mr-2"
                  >
                    <option value="name">Nom A→Z</option>
                    <option value="price">Prix ↑</option>
                    <option value="price-desc">Prix ↓</option>
                    <option value="stock">Stock ↑</option>
                  </select>
                  <button
                    onClick={() => {
                      setFilterCategory('all')
                      setFilterStock('all')
                      setSortBy('name')
                    }}
                    className="text-xs text-blue-500 hover:text-blue-600 py-1.5 px-3 whitespace-nowrap"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Résultats - mobile friendly */}
      <div className="px-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
        </p>
        {filterStock !== 'all' && (
          <span className="text-[10px] text-blue-500">
            {filterStock === 'low' ? '⚠️ Stock faible' : filterStock === 'out' ? '🚫 Rupture' : '✅ Stock OK'}
          </span>
        )}
      </div>

      {/* Liste des produits - MOBILE FIRST */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mx-4 p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center shadow-sm">
          <Package className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun produit trouvé</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                <LazyImage
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {product.quantity <= product.min_quantity && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {product.quantity === 0 ? 'Rupture' : 'Stock faible'}
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Détail
                </div>
              </div>

              <div className="p-3">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                  {product.name}
                </h4>
                {product.category && (
                  <span className="inline-block text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full mt-0.5">
                    {product.category}
                  </span>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {product.price.toLocaleString()} FCFA
                  </span>
                  <span className={`text-xs font-medium ${product.quantity <= product.min_quantity ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {product.quantity}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(product)
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium py-1.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Modifier
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(product.id)
                    }}
                    className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium py-1.5 px-3 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MODE LISTE MOBILE-FIRST - Cartes verticales */
        <div className="px-4 space-y-2">
          {filteredProducts.map((product) => {
            const status = getStockStatus(product)
            const isLowStock = product.quantity <= product.min_quantity
            const isOutOfStock = product.quantity === 0
            
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="flex items-center gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                    <LazyImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                      {product.name}
                    </h4>
                    {product.category && (
                      <span className="inline-block text-[9px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full mt-0.5">
                        {product.category}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {product.price.toLocaleString()} FCFA
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium ${isLowStock ? 'text-orange-500' : 'text-emerald-500'}`}>
                          {product.quantity}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[8px] bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                            Rupture
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[8px] bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                            Faible
                          </span>
                        ) : (
                          <span className="text-[8px] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                            OK
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/products/${product.id}`)
                      }}
                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 text-blue-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(product)
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(product.id)
                      }}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
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

export default Products