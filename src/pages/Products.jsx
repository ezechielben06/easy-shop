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
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const Products = () => {
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tempImageData, setTempImageData] = useState(null) // Pour stocker l'image temporaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    quantity: '',
    min_quantity: '5',
    category: '', // Changé de category_id à category (texte libre)
    image_url: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleImageUploaded = (imageUrl) => {
    setFormData({ ...formData, image_url: imageUrl })
    // Si c'est une image temporaire (base64), on la garde pour plus tard
    if (imageUrl && imageUrl.startsWith('data:image')) {
      setTempImageData(imageUrl)
    } else {
      setTempImageData(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
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
      category: formData.category?.trim() || null, // Catégorie libre
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      min_quantity: parseInt(formData.min_quantity) || 5,
      image_url: null // On va gérer l'image après la création
    }

    try {
      let result

      if (editingProduct) {
        // Pour la modification, on garde l'image existante si aucune nouvelle
        if (formData.image_url && !formData.image_url.startsWith('data:image')) {
          productData.image_url = formData.image_url
        }
        result = await updateProduct(editingProduct.id, productData)
        
        // Si une nouvelle image temporaire a été ajoutée, on l'upload
        if (result && tempImageData) {
          await uploadTempImageToStorage(result.id, tempImageData)
        }
      } else {
        // Création du produit
        result = await createProduct(productData)
        
        // Si une image a été ajoutée (temporaire), on l'upload
        if (result && tempImageData) {
          await uploadTempImageToStorage(result.id, tempImageData)
        }
      }

      if (result) {
        setShowForm(false)
        setEditingProduct(null)
        resetForm()
        await fetchProducts() // Rafraîchir la liste
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  // Fonction pour uploader l'image temporaire
  const uploadTempImageToStorage = async (productId, base64Image) => {
    try {
      // Convertir base64 en Blob
      const response = await fetch(base64Image)
      const blob = await response.blob()
      const fileExt = blob.type.split('/')[1] || 'jpg'
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Créer un File depuis le Blob
      const file = new File([blob], fileName, { type: blob.type })

      // Upload vers Supabase
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      // Mettre à jour le produit avec l'URL
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)

      if (updateError) throw updateError

      // Mettre à jour le state local
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4 pb-20 animate-slide-up">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Produits
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {products.length} produits en stock
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              resetForm()
              setShowForm(!showForm)
            }}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingProduct(null)
                resetForm()
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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
                />
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

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Liste des produits */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="card p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {/* Image */}
                <div className="flex-shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {product.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {product.category && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            {product.category}
                          </span>
                        )}
                        <span className="text-gray-500 dark:text-gray-400">
                          {product.sku || 'SKU: ---'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {product.price.toLocaleString()} FCFA
                    </span>
                    <span className={`text-sm ${
                      product.quantity <= product.min_quantity 
                        ? 'text-orange-500' 
                        : 'text-green-500'
                    }`}>
                      Stock: {product.quantity}
                    </span>
                    {product.quantity <= product.min_quantity && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" />
                        Stock faible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Products