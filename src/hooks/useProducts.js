import { useState, useEffect } from 'react'
import { supabase, TABLES } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProducts = async (filters = {}) => {
    try {
      setLoading(true)
      let query = supabase
        .from(TABLES.PRODUCTS)
        .select('*')

      // Appliquer les filtres
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
      setProducts(data || [])
      return data || []
    } catch (error) {
      setError(error.message)
      console.error('Error fetching products:', error)
      toast.error('Erreur lors du chargement des produits')
      return []
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (productData) => {
    try {
      setLoading(true)
      
      // Générer un SKU unique
      const sku = `${productData.name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`
      
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert([{ 
          ...productData, 
          sku,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      toast.success('Produit créé avec succès')
      await fetchProducts()
      return data
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error(error.message || 'Erreur lors de la création du produit')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateProduct = async (id, updates) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      toast.success('Produit mis à jour avec succès')
      await fetchProducts()
      return data
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour du produit')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id) => {
    try {
      setLoading(true)
      
      // Récupérer d'abord le produit pour avoir l'URL de l'image
      const { data: product, error: fetchError } = await supabase
        .from(TABLES.PRODUCTS)
        .select('image_url')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Supprimer l'image du storage si elle existe
      if (product?.image_url) {
        try {
          const urlParts = product.image_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const filePath = `products/${fileName}`
          
          await supabase.storage
            .from('product-images')
            .remove([filePath])
        } catch (storageError) {
          console.warn('Error deleting image from storage:', storageError)
          // On continue même si la suppression de l'image échoue
        }
      }

      // Supprimer le produit de la base de données
      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Produit supprimé avec succès')
      await fetchProducts()
      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Erreur lors de la suppression du produit')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async (productId, quantity, type, reason = '') => {
    try {
      setLoading(true)
      
      // Récupérer le produit
      const { data: product, error: fetchError } = await supabase
        .from(TABLES.PRODUCTS)
        .select('quantity, name')
        .eq('id', productId)
        .single()
      
      if (fetchError) throw fetchError
      
      const newQuantity = type === 'in' 
        ? product.quantity + quantity 
        : product.quantity - quantity

      if (newQuantity < 0) {
        toast.error('Quantité insuffisante en stock')
        return false
      }
      
      // Mettre à jour le stock
      const { error: updateError } = await supabase
        .from(TABLES.PRODUCTS)
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
      
      if (updateError) throw updateError
      
      // Enregistrer le mouvement
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
      
      toast.success(`Stock mis à jour : ${product.name}`)
      await fetchProducts()
      return true
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour du stock')
      return false
    } finally {
      setLoading(false)
    }
  }

  const getProductBySku = async (sku) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('sku', sku)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching product by SKU:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getLowStockProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .filter('quantity', 'lte', 'min_quantity')
        .order('quantity', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const getCategories = async () => {
    try {
      // Récupérer toutes les catégories uniques depuis les produits
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('category')
        .not('category', 'is', null)
        .neq('category', '')

      if (error) throw error

      // Extraire les catégories uniques
      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))]
      return uniqueCategories.sort()
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getProductBySku,
    getLowStockProducts,
    getCategories
  }
}