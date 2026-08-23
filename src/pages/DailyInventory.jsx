import React, { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { supabase } from '../lib/supabaseClient'
import { 
  ClipboardList, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Save,
  Package,
  Calendar,
  Loader2
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

const DailyInventory = () => {
  const { products, loading, fetchProducts } = useProducts()
  const [inventoryDate, setInventoryDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [inventoryItems, setInventoryItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    await fetchProducts()
    await loadTodayInventory()
    setIsLoading(false)
  }

  const loadTodayInventory = async () => {
    try {
      // Utiliser maybeSingle au lieu de single pour éviter l'erreur 406
      const { data, error } = await supabase
        .from('daily_inventory')
        .select('*')
        .eq('date', inventoryDate)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading inventory:', error)
        return
      }

      if (data) {
        const items = products.map(product => ({
          product_id: product.id,
          product_name: product.name,
          expected_quantity: product.quantity,
          actual_quantity: data.items?.find(i => i.product_id === product.id)?.actual_quantity || product.quantity,
          difference: 0,
          status: 'pending'
        }))
        setInventoryItems(items)
        setCompleted(data.status === 'completed')
      } else {
        const items = products.map(product => ({
          product_id: product.id,
          product_name: product.name,
          expected_quantity: product.quantity,
          actual_quantity: product.quantity,
          difference: 0,
          status: 'pending'
        }))
        setInventoryItems(items)
        setCompleted(false)
      }
    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  // Recharger quand la date change
  useEffect(() => {
    if (products.length > 0) {
      loadTodayInventory()
    }
  }, [inventoryDate, products])

  const updateInventoryCount = (productId, newCount) => {
    if (newCount < 0) return
    
    setInventoryItems(items => 
      items.map(item => {
        if (item.product_id === productId) {
          const difference = newCount - item.expected_quantity
          const status = difference === 0 ? 'correct' : 'discrepancy'
          return {
            ...item,
            actual_quantity: newCount,
            difference,
            status
          }
        }
        return item
      })
    )
  }

  const saveInventory = async () => {
    if (inventoryItems.some(item => item.actual_quantity === undefined)) {
      toast.error('Veuillez vérifier tous les produits')
      return
    }

    setSaving(true)
    try {
      const inventoryData = {
        date: inventoryDate,
        items: inventoryItems.map(item => ({
          product_id: item.product_id,
          actual_quantity: item.actual_quantity,
          expected_quantity: item.expected_quantity,
          difference: item.difference
        })),
        status: 'completed',
        completed_at: new Date().toISOString()
      }

      // Vérifier si un inventaire existe déjà
      const { data: existing } = await supabase
        .from('daily_inventory')
        .select('id')
        .eq('date', inventoryDate)
        .maybeSingle()

      let result
      if (existing) {
        result = await supabase
          .from('daily_inventory')
          .update(inventoryData)
          .eq('date', inventoryDate)
      } else {
        result = await supabase
          .from('daily_inventory')
          .insert([inventoryData])
      }

      if (result.error) throw result.error

      // Mettre à jour les stocks des produits
      for (const item of inventoryItems) {
        if (item.difference !== 0) {
          await supabase
            .from('products')
            .update({ quantity: item.actual_quantity })
            .eq('id', item.product_id)
        }
      }

      setCompleted(true)
      toast.success('Inventaire enregistré avec succès !')
    } catch (error) {
      console.error('Error saving inventory:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const filteredItems = inventoryItems.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: inventoryItems.length,
    verified: inventoryItems.filter(i => i.status === 'correct').length,
    discrepancies: inventoryItems.filter(i => i.status === 'discrepancy').length,
    pending: inventoryItems.filter(i => i.status === 'pending').length
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-32 animate-slide-up">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ClipboardList className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Inventaire Journalier
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(parseISO(inventoryDate), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
          <input
            type="date"
            value={inventoryDate}
            onChange={(e) => setInventoryDate(e.target.value)}
            className="input-field text-sm py-2 w-32"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.verified}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">OK</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.discrepancies}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Écarts</p>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.pending}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
          </div>
        </div>

        {completed && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Inventaire terminé
            </span>
          </div>
        )}
      </div>

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

      {/* Inventory List */}
      <div className="space-y-2 px-4">
        {filteredItems.length === 0 ? (
          <div className="card text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Aucun produit trouvé</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.product_id} className="inventory-item">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {item.product_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Stock théorique: {item.expected_quantity}
                </p>
                {item.status === 'discrepancy' && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Écart: {item.difference > 0 ? '+' : ''}{item.difference}
                  </p>
                )}
              </div>
              <div className="inventory-count">
                <button
                  onClick={() => updateInventoryCount(item.product_id, item.actual_quantity - 1)}
                  className="minus"
                  disabled={completed}
                >
                  −
                </button>
                <span className="count">{item.actual_quantity}</span>
                <button
                  onClick={() => updateInventoryCount(item.product_id, item.actual_quantity + 1)}
                  className="plus"
                  disabled={completed}
                >
                  +
                </button>
              </div>
              {item.status === 'correct' && (
                <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
              )}
              {item.status === 'discrepancy' && (
                <AlertCircle className="h-5 w-5 text-yellow-500 ml-2" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Save Button */}
      {!completed && inventoryItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-20">
          <button
            onClick={saveInventory}
            disabled={saving}
            className="btn-success flex items-center justify-center gap-2 w-full"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer l\'inventaire'}
          </button>
        </div>
      )}
    </div>
  )
}

export default DailyInventory