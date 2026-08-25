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
import { format } from 'date-fns'
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
          return { ...item, actual_quantity: newCount, difference, status }
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

      const { data: existing } = await supabase
        .from('daily_inventory')
        .select('id')
        .eq('date', inventoryDate)
        .maybeSingle()

      let result
      if (existing) {
        result = await supabase.from('daily_inventory').update(inventoryData).eq('date', inventoryDate)
      } else {
        result = await supabase.from('daily_inventory').insert([inventoryData])
      }

      if (result.error) throw result.error

      for (const item of inventoryItems) {
        if (item.difference !== 0) {
          await supabase.from('products').update({ quantity: item.actual_quantity }).eq('id', item.product_id)
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
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Inventaire</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(inventoryDate), 'EEEE d MMMM', { locale: fr })}
            </p>
          </div>
        </div>
        <input
          type="date"
          value={inventoryDate}
          onChange={(e) => setInventoryDate(e.target.value)}
          className="py-1.5 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-32"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-[10px] text-gray-400">Total</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/5 rounded-xl p-2 text-center border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.verified}</p>
          <p className="text-[10px] text-gray-400">✅ OK</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/5 rounded-xl p-2 text-center border border-orange-200 dark:border-orange-800">
          <p className="text-sm font-bold text-orange-500">{stats.discrepancies}</p>
          <p className="text-[10px] text-gray-400">⚠️ Écarts</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/5 rounded-xl p-2 text-center border border-red-200 dark:border-red-800">
          <p className="text-sm font-bold text-red-500">{stats.pending}</p>
          <p className="text-[10px] text-gray-400">⏳</p>
        </div>
      </div>

      {completed && (
        <div className="bg-emerald-50 dark:bg-emerald-900/5 rounded-xl p-2.5 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="text-xs text-emerald-700 dark:text-emerald-300">Inventaire terminé</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Liste */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucun produit</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredItems.map((item) => (
            <div key={item.product_id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                  <p className="text-[10px] text-gray-400">Théorique: {item.expected_quantity}</p>
                  {item.status === 'discrepancy' && (
                    <p className="text-[10px] text-orange-500">Écart: {item.difference > 0 ? '+' : ''}{item.difference}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateInventoryCount(item.product_id, item.actual_quantity - 1)}
                    className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center text-lg font-bold disabled:opacity-50"
                    disabled={completed}
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-lg font-bold text-gray-900 dark:text-white">{item.actual_quantity}</span>
                  <button
                    onClick={() => updateInventoryCount(item.product_id, item.actual_quantity + 1)}
                    className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 flex items-center justify-center text-lg font-bold disabled:opacity-50"
                    disabled={completed}
                  >
                    +
                  </button>
                </div>
                {item.status === 'correct' && <CheckCircle className="h-4 w-4 text-emerald-500 ml-1 flex-shrink-0" />}
                {item.status === 'discrepancy' && <AlertCircle className="h-4 w-4 text-orange-500 ml-1 flex-shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      {!completed && inventoryItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-20">
          <button
            onClick={saveInventory}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.97]"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  )
}

export default DailyInventory