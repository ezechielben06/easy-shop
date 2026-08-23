import React, { useState, useEffect, useRef } from 'react'
import { useProducts } from '../hooks/useProducts'
import ImageUpload from '../components/products/ImageUpload'
import { supabase } from '../lib/supabaseClient'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  AlertTriangle, 
  X,
  Image as ImageIcon,
  Loader2,
  Grid,
  List,
  Filter,
  ChevronDown,
  TrendingUp,
  DollarSign,
  ShoppingBag
} from 'lucide-react'
import toast from 'react-hot-toast'

const Products = () => {
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' ou 'list'
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [tempImageData, setTempImageData] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    quantity: '',
    min_quantity: '5',
    category: '',
    image_url: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  // Récupérer les catégories uniques
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  // Filtrer et trier les produits
  const filteredProducts = products
    .filter(product => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchCategory = filterCategory === 'all' || product.category === filterCategory
      return matchSearch && matchCategory
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'price') return a.price - b.price
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
      cost_price: parseFloat(formData.cost_price) || 0,
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
      cost_price: '',
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
      cost_price: product.cost_price?.toString() || '',
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

  // Statistiques
  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  const lowStockCount = products.filter(p => p.quantity <= p.min_quantity).length

  return (
    <div className="space-y-4 pb-20 animate-slide-up">
      {/* Header avec statistiques */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Catalogue Produits
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez votre inventaire en temps réel
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              resetForm()
              setShowForm(!showForm)
            }}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-4 w-4" />
            Nouveau produit
          </button>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalProducts}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total produits</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalStock}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">En stock</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalValue.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Valeur totale</p>
          </div>
          <div className={`${lowStockCount > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-800'} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
              {lowStockCount}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Stock faible</p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card animate-slide-up border-2 border-blue-200 dark:border-blue-800">
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
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image */}
              <div className="md:col-span-2">
                <label className="input-label">Image du produit</label>
                <ImageUpload
                  productId={editingProduct?.id || 'new'}
                  currentImage={formData.image_url}
                  onImageUploaded={handleImageUploaded}
                />
              </div>

              <div>
                <label className="input-label">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Ex: T-shirt Premium"
                />
              </div>
              <div>
                <label className="input-label">Catégorie</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
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
                <label className="input-label">Prix de vente (FCFA) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="input-label">Prix d'achat (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="input-label">Quantité en stock *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="input-label">Stock minimum *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                  className="input-field"
                  placeholder="5"
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Description du produit..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingProduct(null)
                  resetForm()
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
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
          
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field py-2 text-sm min-w-[120px]"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field py-2 text-sm min-w-[100px]"
            >
              <option value="name">Nom</option>
              <option value="price">Prix</option>
              <option value="stock">Stock</option>
            </select>

            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setEditingProduct(null)
                resetForm()
                setShowForm(true)
              }}
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter votre premier produit
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="card p-3 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {product.quantity <= product.min_quantity && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Stock faible
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="mt-3">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                  {product.name}
                </h4>
                {product.category && (
                  <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    {product.category}
                  </span>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {product.price.toLocaleString()} FCFA
                  </span>
                  <span className={`text-xs ${product.quantity <= product.min_quantity ? 'text-orange-500' : 'text-green-500'}`}>
                    Stock: {product.quantity}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 btn-secondary text-xs py-1 px-2 flex items-center justify-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="btn-danger text-xs py-1 px-2 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="card p-3 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              {/* Image */}
              <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h4>
                  {product.category && (
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0">
                      {product.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {product.price.toLocaleString()} FCFA
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className={`text-xs ${product.quantity <= product.min_quantity ? 'text-orange-500' : 'text-green-500'}`}>
                    Stock: {product.quantity}
                  </span>
                  {product.quantity <= product.min_quantity && (
                    <span className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Stock faible
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Products