import { useState } from 'react'
import { supabase, TABLES } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

export const useSales = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSales = async (filters = {}) => {
    try {
      setLoading(true)
      let query = supabase
        .from(TABLES.SALES)
        .select(`
          *,
          sale_items (*)
        `)

      // Filtres
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setSales(data || [])
      return data || []
    } catch (error) {
      setError(error.message)
      console.error('Error fetching sales:', error)
      toast.error('Erreur lors du chargement des ventes')
      return []
    } finally {
      setLoading(false)
    }
  }

  const createSale = async (saleData) => {
    try {
      setLoading(true)
      
      // Générer un numéro de facture
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`
      
      // Créer la vente sans client
      const { data: sale, error: saleError } = await supabase
        .from(TABLES.SALES)
        .insert([{
          invoice_number: invoiceNumber,
          customer_id: null, // Pas de client
          total_amount: saleData.totalAmount,
          discount: 0,
          tax: 0,
          grand_total: saleData.grandTotal,
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (saleError) throw saleError

      // Ajouter les items de vente
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      }))

      const { error: itemsError } = await supabase
        .from(TABLES.SALE_ITEMS)
        .insert(saleItems)

      if (itemsError) throw itemsError

      toast.success(`Vente #${invoiceNumber} enregistrée avec succès`)
      await fetchSales()
      return sale
    } catch (error) {
      console.error('Error creating sale:', error)
      toast.error(error.message || 'Erreur lors de l\'enregistrement de la vente')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getDailySales = async (date = new Date()) => {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from(TABLES.SALES)
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .eq('status', 'completed')

      if (error) throw error
      
      const salesData = data || []
      return {
        sales: salesData,
        total: salesData.reduce((sum, sale) => sum + (sale.grand_total || 0), 0),
        count: salesData.length
      }
    } catch (error) {
      console.error('Error getting daily sales:', error)
      return { sales: [], total: 0, count: 0 }
    }
  }

  const getSalesStats = async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SALES)
        .select(`
          *,
          sale_items (
            product_id,
            quantity,
            total_price,
            products (name)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'completed')

      if (error) throw error

      const salesData = data || []
      const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)
      const totalSales = salesData.length
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0

      // Top produits
      const productSales = {}
      salesData.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const productName = item.products?.name || 'Produit inconnu'
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, total: 0 }
          }
          productSales[productName].quantity += item.quantity || 0
          productSales[productName].total += item.total_price || 0
        })
      })

      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      return {
        totalRevenue,
        totalSales,
        averageTicket,
        topProducts
      }
    } catch (error) {
      console.error('Error getting sales stats:', error)
      return { totalRevenue: 0, totalSales: 0, averageTicket: 0, topProducts: [] }
    }
  }

  return {
    sales,
    loading,
    error,
    fetchSales,
    createSale,
    getDailySales,
    getSalesStats
  }
}