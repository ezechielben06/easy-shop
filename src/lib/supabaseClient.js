import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Fonctions utilitaires
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) throw error
  return data
}

// Tables
export const TABLES = {
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items',
  STOCK_MOVEMENTS: 'stock_movements',
  PROFILES: 'profiles'
}

// Types
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  TRANSFER: 'transfer'
}

export const SALE_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const STOCK_MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUST: 'adjust'
}

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier'
}

export default supabase