import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import LazyImage from '../components/common/LazyImage'
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Package, 
  AlertTriangle,
  ShoppingBag,
  Barcode,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Share2,
  Heart,
  Minus,
  Plus,
  Tag,
  Sparkles,
  Clock,
  Eye,
  Info
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, loading, fetchProducts, getProductById, deleteProduct } = useProducts()
  const [product, setProduct] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [imageError, setImageError] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const imageRef = useRef(null)

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    setIsLoading(true)
    setImageError(false)
    
    try {
      await fetchProducts()
      
      let found = products.find(p => p.id === id)
      
      if (!found) {
        found = await getProductById(id)
      }
      
      if (found) {
        setProduct(found)
        
        const related = products
          .filter(p => p.id !== id && p.category === found.category)
          .slice(0, 4)
        setRelatedProducts(related)
      } else {
        toast.error('Produit non trouvé')
        navigate('/products')
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error)
      toast.error('Erreur lors du chargement')
      navigate('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      const success = await deleteProduct(product.id)
      if (success) {
        navigate('/products')
      }
    }
  }

  const handleAddToCart = () => {
    setIsAddingToCart(true)
    setTimeout(() => {
      toast.success(`${product.name} ajouté au panier (x${quantity})`, {
        icon: '🛒',
        duration: 3000
      })
      setIsAddingToCart(false)
    }, 500)
  }

  const getStockStatus = () => {
    if (!product) return { label: 'Inconnu', color: 'gray', icon: null, text: 'Stock inconnu' }
    if (product.quantity === 0) return { label: 'Rupture', color: 'red', icon: XCircle, text: 'Produit indisponible' }
    if (product.quantity <= product.min_quantity) return { label: 'Stock faible', color: 'orange', icon: AlertTriangle, text: 'Plus que quelques unités' }
    return { label: 'En stock', color: 'green', icon: CheckCircle, text: 'Disponible' }
  }

  const getStockPercentage = () => {
    if (!product) return 0
    const max = product.quantity + product.min_quantity
    return Math.min((product.quantity / max) * 100, 100)
  }

  if (isLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement du produit...</p>
      </div>
    )
  }

  if (!product) return null

  const stockStatus = getStockStatus()
  const StatusIcon = stockStatus.icon
  const isLowStock = product.quantity <= product.min_quantity
  const stockPercentage = getStockPercentage()
  const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-36">
      {/* Header flottant */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/products')}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all active:scale-95"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                {product.name}
              </h1>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all active:scale-95"
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      text: `Découvrez ${product.name} sur Easy-Shop`,
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard?.writeText(window.location.href)
                    toast.success('Lien copié !')
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all active:scale-95"
              >
                <Share2 className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Image avec LazyImage */}
      <div className="relative bg-white dark:bg-gray-800">
        <div className="relative aspect-square max-h-[450px] w-full overflow-hidden">
          <LazyImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            fallback={<Package className="h-24 w-24 text-gray-400" />}
          />
          
          {/* Badges flottants */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isNew && (
              <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Nouveau
              </span>
            )}
            {isLowStock && product.quantity > 0 && (
              <span className="bg-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Stock faible
              </span>
            )}
            {product.quantity === 0 && (
              <span className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Rupture
              </span>
            )}
          </div>

          {/* Badge prix */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-xl">
            <span className="text-2xl font-bold">{product.price.toLocaleString()}</span>
            <span className="text-xs ml-1 opacity-80">FCFA</span>
          </div>

          {/* Indicateur de zoom */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white/70 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Zoom
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 py-4 space-y-4">
        {/* En-tête produit */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h2>
            {product.category && (
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                  <Tag className="h-3 w-3" />
                  {product.category}
                </span>
                {product.sku && (
                  <span className="text-xs text-gray-400">• SKU: {product.sku}</span>
                )}
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 ${
            stockStatus.color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
            stockStatus.color === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
            stockStatus.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
            {stockStatus.label}
          </div>
        </div>

        {/* Barre de stock */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-600 dark:text-gray-400">Stock disponible</span>
            <span className={`font-semibold ${isLowStock ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
              {product.quantity} unités
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-700 ${
                product.quantity === 0 ? 'bg-red-500' :
                isLowStock ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Stock minimum: {product.min_quantity} unités
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'details'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Info className="h-4 w-4 inline mr-1.5" />
            Détails
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'specs'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Package className="h-4 w-4 inline mr-1.5" />
            Infos
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="min-h-[120px]">
          {activeTab === 'details' ? (
            <div className="space-y-3">
              {product.description ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center text-gray-400 text-sm">
                  Aucune description disponible
                </div>
              )}
              
              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 text-center">
                  <Calendar className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Créé le</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {format(new Date(product.created_at), 'dd/MM/yy', { locale: fr })}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 text-center">
                  <Clock className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Mis à jour</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 text-center">
                  <Barcode className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Code</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {product.barcode || '---'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                  {product.sku || '---'}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {product.status || 'Actif'}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix unitaire</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {product.price.toLocaleString()} FCFA
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</p>
                <p className={`text-sm font-bold mt-0.5 ${isLowStock ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                  {product.quantity} unités
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Produits similaires avec LazyImage */}
        {relatedProducts.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Package className="h-4 w-4 text-blue-500" />
                Produits similaires
              </h3>
              <Link to="/products" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
                Voir tout <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <LazyImage
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {p.price.toLocaleString()} FCFA
                      </p>
                      {p.quantity <= p.min_quantity && (
                        <span className="text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-full">
                          Stock faible
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barre d'action flottante en bas */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Sélecteur de quantité */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded-l-xl transition-colors active:scale-95"
                disabled={product.quantity === 0}
              >
                <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="w-10 text-center font-bold text-sm text-gray-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded-r-xl transition-colors active:scale-95"
                disabled={product.quantity === 0 || quantity >= product.quantity}
              >
                <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Bouton Ajouter au panier */}
            <button
              onClick={handleAddToCart}
              disabled={product.quantity === 0 || isAddingToCart}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                product.quantity > 0 && !isAddingToCart
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Ajouter au panier
                </>
              )}
            </button>
          </div>
          
          {/* Total */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {product.quantity > 0 
                ? `${product.quantity} unités disponibles`
                : 'Produit indisponible'}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              Total: {(product.price * quantity).toLocaleString()} FCFA
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail