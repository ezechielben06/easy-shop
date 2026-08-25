import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { supabase } from '../lib/supabaseClient'
import { 
  Settings as SettingsIcon, 
  User, 
  Store, 
  Bell, 
  Shield, 
  Moon, 
  Sun,
  Database,
  RefreshCw,
  LogOut,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Key,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user, signOut } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    shop_name: '',
    shop_address: '',
    phone: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          shop_name: data.shop_name || '',
          shop_address: data.shop_address || '',
          phone: data.phone || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...profile,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      toast.success('Profil mis à jour')
    } catch (error) {
      toast.error(error.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Se déconnecter ?')) {
      await signOut()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-blue-500" />
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Gérez votre boutique</p>
        </div>
      </div>

      {/* Profil */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profil</h3>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Nom complet</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Téléphone</label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Boutique</label>
            <input
              type="text"
              value={profile.shop_name}
              onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Adresse</label>
            <input
              type="text"
              value={profile.shop_address}
              onChange={(e) => setProfile({ ...profile, shop_address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-xl text-sm transition-all active:scale-[0.97]"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Apparence */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          {isDarkMode ? <Moon className="h-4 w-4 text-purple-500" /> : <Sun className="h-4 w-4 text-purple-500" />}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Apparence</h3>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {isDarkMode ? '🌙 Mode sombre' : '☀️ Mode clair'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{isDarkMode ? 'Actif' : 'Inactif'}</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDarkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Email */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Email</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</p>
        <p className="text-xs text-gray-400 mt-1">Non modifiable</p>
      </div>

      {/* Sécurité */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sécurité</h3>
        </div>
        <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
          <Key className="h-4 w-4" />
          Changer le mot de passe
        </button>
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Dernière connexion : {new Date().toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Actions</h3>
        </div>
        <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
        <button
          onClick={handleLogout}
          className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>

      {/* Version */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        Easy-Shop v1.0.0
      </div>
    </div>
  )
}

export default Settings