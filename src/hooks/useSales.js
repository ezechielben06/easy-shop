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

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.isCredit !== undefined) {
        query = query.eq('is_credit', filters.isCredit)
      }
      if (filters.creditStatus) {
        query = query.eq('credit_status', filters.creditStatus)
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
      
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`
      
      const { data: sale, error: saleError } = await supabase
        .from(TABLES.SALES)
        .insert([{
          invoice_number: invoiceNumber,
          total_amount: saleData.totalAmount,
          discount: 0,
          tax: 0,
          grand_total: saleData.grandTotal,
          payment_method: 'cash',
          status: 'completed',
          is_credit: saleData.isCredit || false,
          credit_status: saleData.isCredit ? 'pending' : null,
          due_date: saleData.dueDate || null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (saleError) throw saleError

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

  const updateCreditStatus = async (saleId, status) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from(TABLES.SALES)
        .update({ 
          credit_status: status,
          paid_at: status === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', saleId)
        .select()
        .single()

      if (error) throw error
      
      toast.success(`Statut de crédit mis à jour: ${status === 'paid' ? '✅ Payé' : '⏳ En attente'}`)
      await fetchSales()
      return data
    } catch (error) {
      console.error('Error updating credit status:', error)
      toast.error('Erreur lors de la mise à jour')
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
      const totalSales = salesData.filter(s => !s.is_credit)
      const creditSales = salesData.filter(s => s.is_credit)
      
      return {
        sales: salesData,
        total: salesData.reduce((sum, sale) => sum + (sale.grand_total || 0), 0),
        count: salesData.length,
        cashTotal: totalSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0),
        cashCount: totalSales.length,
        creditTotal: creditSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0),
        creditCount: creditSales.length
      }
    } catch (error) {
      console.error('Error getting daily sales:', error)
      return { sales: [], total: 0, count: 0, cashTotal: 0, cashCount: 0, creditTotal: 0, creditCount: 0 }
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
      
      // Statistiques globales
      const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)
      const totalSales = salesData.length
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
      
      // Statistiques par type
      const cashSales = salesData.filter(s => !s.is_credit)
      const creditSales = salesData.filter(s => s.is_credit)
      
      const cashTotal = cashSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)
      const creditTotal = creditSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)

      // Top produits
      const productSales = {}
      salesData.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const productName = item.products?.name || 'Produit inconnu'
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, total: 0, credit: 0, cash: 0 }
          }
          productSales[productName].quantity += item.quantity || 0
          productSales[productName].total += item.total_price || 0
          if (sale.is_credit) {
            productSales[productName].credit += item.total_price || 0
          } else {
            productSales[productName].cash += item.total_price || 0
          }
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
        cashTotal,
        creditTotal,
        cashCount: cashSales.length,
        creditCount: creditSales.length,
        topProducts
      }
    } catch (error) {
      console.error('Error getting sales stats:', error)
      return { 
        totalRevenue: 0, 
        totalSales: 0, 
        averageTicket: 0,
        cashTotal: 0,
        creditTotal: 0,
        cashCount: 0,
        creditCount: 0,
        topProducts: [] 
      }
    }
  }

  return {
    sales,
    loading,
    error,
    fetchSales,
    createSale,
    updateCreditStatus,
    getDailySales,
    getSalesStats
  }
}