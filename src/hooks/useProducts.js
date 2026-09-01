import { useState, useEffect } from 'react'
import { supabase, TABLES } from '../lib/supabaseClient'
import { getCachedData, cacheData } from './useOfflineCache'
import toast from 'react-hot-toast'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      fetchProducts()
    }
    const handleOffline = () => {
      setIsOffline(true)
      toast.info('📡 Mode hors ligne - Données en cache', { duration: 2000 })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Récupérer tous les produits
  const fetchProducts = async (filters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      if (navigator.onLine) {
        let query = supabase
          .from(TABLES.PRODUCTS)
          .select('*')

        if (filters.category) {
          query = query.eq('category', filters.category)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,category.ilike.%${filters.search}%`)
        }
        if (filters.lowStock) {
          query = query.filter('quantity', 'lte', 'min_quantity')
        }

        const { data, error } = await query.order('name')

        if (error) throw error
        
        if (data) {
          await cacheData('products', data)
          setProducts(data)
          setIsOffline(false)
          return data
        }
      }

      const cached = await getCachedData('products')
      if (cached && cached.length > 0) {
        setProducts(cached)
        setIsOffline(true)
        if (!navigator.onLine) {
          toast.info('📡 Mode hors ligne - Données en cache', { duration: 2000 })
        }
        return cached
      }

      setProducts([])
      return []
      
    } catch (error) {
      setError(error.message)
      console.error('Error fetching products:', error)
      
      const cached = await getCachedData('products')
      if (cached && cached.length > 0) {
        setProducts(cached)
        setIsOffline(true)
        toast.info('📡 Mode hors ligne - Données en cache', { duration: 2000 })
        return cached
      }
      
      toast.error('Erreur lors du chargement des produits')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Récupérer un produit par ID (avec fallback Supabase si hors cache)
  const getProductById = async (id) => {
    try {
      // 1. Chercher d'abord dans le cache local
      const cachedProducts = await getCachedData('products')
      const foundInCache = cachedProducts?.find(p => p.id === id)
      
      if (foundInCache) {
        return foundInCache
      }

      // 2. Chercher dans le state products
      const foundInState = products.find(p => p.id === id)
      if (foundInState) {
        return foundInState
      }

      // 3. Si en ligne, chercher dans Supabase
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from(TABLES.PRODUCTS)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        
        if (data) {
          // Mettre à jour le cache avec ce produit
          const currentCache = await getCachedData('products') || []
          const exists = currentCache.some(p => p.id === data.id)
          if (!exists) {
            await cacheData('products', [...currentCache, data])
          }
          return data
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching product by ID:', error)
      return null
    }
  }

  // Récupérer un produit par ID (synchrone - depuis le state)
  const getProductFromState = (id) => {
    return products.find(p => p.id === id)
  }

  // Créer un produit
  const createProduct = async (productData) => {
    try {
      setLoading(true)
      
      const sku = `${productData.name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`
      
      const newProduct = { 
        ...productData, 
        sku,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (!navigator.onLine) {
        const tempId = `temp-${Date.now()}`
        newProduct.id = tempId
        
        const currentProducts = await getCachedData('products')
        await cacheData('products', [...currentProducts, newProduct])
        setProducts([...products, newProduct])
        
        await addPendingChange({
          type: 'create',
          table: TABLES.PRODUCTS,
          data: newProduct,
          recordId: tempId
        })
        
        toast.success('Produit créé en mode hors ligne (sync différée)')
        return newProduct
      }

      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert([newProduct])
        .select()
        .single()

      if (error) throw error
      
      const currentProducts = await getCachedData('products')
      await cacheData('products', [...currentProducts, data])
      setProducts([...products, data])
      
      toast.success('Produit créé avec succès')
      return data
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error(error.message || 'Erreur lors de la création du produit')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Mettre à jour un produit
  const updateProduct = async (id, updates) => {
    try {
      setLoading(true)
      
      const updatedData = { 
        ...updates,
        updated_at: new Date().toISOString()
      }

      if (!navigator.onLine) {
        const currentProducts = await getCachedData('products')
        const updatedProducts = currentProducts.map(p => 
          p.id === id ? { ...p, ...updatedData } : p
        )
        await cacheData('products', updatedProducts)
        setProducts(updatedProducts)
        
        await addPendingChange({
          type: 'update',
          table: TABLES.PRODUCTS,
          data: updatedData,
          recordId: id
        })
        
        toast.success('Produit mis à jour en mode hors ligne (sync différée)')
        return { ...updatedData, id }
      }

      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update(updatedData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const currentProducts = await getCachedData('products')
      const updatedProducts = currentProducts.map(p => 
        p.id === id ? { ...p, ...data } : p
      )
      await cacheData('products', updatedProducts)
      setProducts(updatedProducts)
      
      toast.success('Produit mis à jour avec succès')
      return data
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour du produit')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Supprimer un produit
  const deleteProduct = async (id) => {
    try {
      setLoading(true)
      
      const productToDelete = products.find(p => p.id === id)
      
      if (!navigator.onLine) {
        const currentProducts = await getCachedData('products')
        const updatedProducts = currentProducts.filter(p => p.id !== id)
        await cacheData('products', updatedProducts)
        setProducts(updatedProducts)
        
        await addPendingChange({
          type: 'delete',
          table: TABLES.PRODUCTS,
          recordId: id,
          data: { id }
        })
        
        toast.success('Produit supprimé en mode hors ligne (sync différée)')
        return true
      }

      if (productToDelete?.image_url) {
        try {
          const urlParts = productToDelete.image_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const filePath = `products/${fileName}`
          
          await supabase.storage
            .from('product-images')
            .remove([filePath])
        } catch (storageError) {
          console.warn('Error deleting image from storage:', storageError)
        }
      }

      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id)

      if (error) throw error
      
      const currentProducts = await getCachedData('products')
      const updatedProducts = currentProducts.filter(p => p.id !== id)
      await cacheData('products', updatedProducts)
      setProducts(updatedProducts)
      
      toast.success('Produit supprimé avec succès')
      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Erreur lors de la suppression du produit')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Mettre à jour le stock
  const updateStock = async (productId, quantity, type, reason = '') => {
    try {
      setLoading(true)
      
      const product = products.find(p => p.id === productId)
      if (!product) {
        toast.error('Produit non trouvé')
        return false
      }
      
      const newQuantity = type === 'in' 
        ? product.quantity + quantity 
        : product.quantity - quantity

      if (newQuantity < 0) {
        toast.error('Quantité insuffisante en stock')
        return false
      }

      const stockUpdate = {
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      }

      if (!navigator.onLine) {
        const currentProducts = await getCachedData('products')
        const updatedProducts = currentProducts.map(p => 
          p.id === productId ? { ...p, ...stockUpdate } : p
        )
        await cacheData('products', updatedProducts)
        setProducts(updatedProducts)
        
        await addPendingChange({
          type: 'update',
          table: TABLES.PRODUCTS,
          data: stockUpdate,
          recordId: productId
        })
        
        toast.success(`Stock mis à jour (hors ligne): ${product.name}`)
        return true
      }

      const { error: updateError } = await supabase
        .from(TABLES.PRODUCTS)
        .update(stockUpdate)
        .eq('id', productId)
      
      if (updateError) throw updateError
      
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_id: productId,
          quantity: type === 'in' ? quantity : -quantity,
          type: type,
          reason: reason || (type === 'in' ? 'Réapprovisionnement' : 'Vente'),
          old_quantity: product.quantity,
          new_quantity: newQuantity,
          created_at: new Date().toISOString()
        }])
      
      if (movementError) throw movementError
      
      const currentProducts = await getCachedData('products')
      const updatedProducts = currentProducts.map(p => 
        p.id === productId ? { ...p, ...stockUpdate } : p
      )
      await cacheData('products', updatedProducts)
      setProducts(updatedProducts)
      
      toast.success(`Stock mis à jour : ${product.name}`)
      return true
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour du stock')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Récupérer un produit par SKU
  const getProductBySku = async (sku) => {
    try {
      const found = products.find(p => p.sku === sku)
      if (found) return found

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from(TABLES.PRODUCTS)
          .select('*')
          .eq('sku', sku)
          .single()

        if (error) throw error
        return data
      }

      return null
    } catch (error) {
      console.error('Error fetching product by SKU:', error)
      return null
    }
  }

  // Récupérer les produits en stock faible
  const getLowStockProducts = async () => {
    try {
      const lowStock = products.filter(p => p.quantity <= p.min_quantity)
      
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from(TABLES.PRODUCTS)
          .select('*')
          .filter('quantity', 'lte', 'min_quantity')
          .order('quantity', { ascending: true })

        if (error) throw error
        return data || []
      }

      return lowStock
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      return []
    }
  }

  // Récupérer toutes les catégories
  const getCategories = async () => {
    try {
      const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
      
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from(TABLES.PRODUCTS)
          .select('category')
          .not('category', 'is', null)
          .neq('category', '')

        if (error) throw error

        const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))]
        return uniqueCategories.sort()
      }

      return categories.sort()
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  // Fonctions pour les changements en attente (hors ligne)
  const getPendingChanges = async () => {
    const changes = await getCachedData('pending_changes')
    return changes || []
  }

  const addPendingChange = async (change) => {
    const changes = await getPendingChanges()
    changes.push({
      ...change,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    })
    await cacheData('pending_changes', changes)
  }

  return {
    products,
    loading,
    error,
    isOffline,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getProductBySku,
    getProductById,
    getProductFromState,
    getLowStockProducts,
    getCategories,
    getPendingChanges
  }
}