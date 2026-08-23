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
  Smartphone,
  Database,
  RefreshCw,
  LogOut,
  Save,
  X,
  Check,
  Loader2,
  Globe,
  Languages,
  Printer,
  DollarSign,
  Package,
  TrendingUp,
  BarChart3,
  Lock,
  Key,
  Mail,
  Phone,
  MapPin,
  Edit2
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
  const [notifications, setNotifications] = useState({
    lowStock: true,
    dailyReport: true,
    newSale: false,
    inventoryReminder: true
  })
  const [preferences, setPreferences] = useState({
    currency: 'FCFA',
    language: 'fr',
    dateFormat: 'dd/MM/yyyy',
    printReceipt: true
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
      toast.success('Profil mis à jour avec succès')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await signOut()
    }
  }

  const handleResetData = () => {
    if (window.confirm('⚠️ Cette action supprimera toutes vos données de test. Continuer ?')) {
      toast.success('Données réinitialisées')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 animate-slide-up">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
            <SettingsIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Paramètres
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les paramètres de votre boutique
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ============================================ */}
        {/* 1. PROFIL */}
        {/* ============================================ */}
        <div className="card md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations personnelles
            </h3>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">
                  <User className="h-4 w-4 inline mr-1" />
                  Nom complet
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="input-field"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="input-label">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input-field bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                  disabled
                  placeholder="Email"
                />
                <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
              </div>
              <div>
                <label className="input-label">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Téléphone
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="input-field"
                  placeholder="+225 01 23 45 67"
                />
              </div>
              <div>
                <label className="input-label">
                  <Store className="h-4 w-4 inline mr-1" />
                  Nom de la boutique
                </label>
                <input
                  type="text"
                  value={profile.shop_name}
                  onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
                  className="input-field"
                  placeholder="Easy-Shop"
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={profile.shop_address}
                  onChange={(e) => setProfile({ ...profile, shop_address: e.target.value })}
                  className="input-field"
                  placeholder="Adresse de la boutique"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        </div>

        {/* ============================================ */}
        {/* 2. APPAREANCE */}
        {/* ============================================ */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-purple-500" />
              ) : (
                <Sun className="h-5 w-5 text-purple-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Apparence
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isDarkMode ? '🌙 Mode sombre' : '☀️ Mode clair'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isDarkMode ? 'Actif' : 'Inactif'}
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Langue</label>
                <select className="input-field">
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="es">🇪🇸 Español</option>
                </select>
              </div>
              <div>
                <label className="input-label">Devise</label>
                <select className="input-field">
                  <option value="FCFA">FCFA</option>
                  <option value="EUR">€ EUR</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 3. NOTIFICATIONS */}
        {/* ============================================ */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Bell className="h-5 w-5 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Stock faible</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Alertes de réapprovisionnement</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, lowStock: !notifications.lowStock })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.lowStock ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.lowStock ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Rapport journalier</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Résumé des ventes du jour</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, dailyReport: !notifications.dailyReport })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.dailyReport ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.dailyReport ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Rappel inventaire</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pensez à faire l'inventaire</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, inventoryReminder: !notifications.inventoryReminder })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.inventoryReminder ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.inventoryReminder ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 4. PREFERENCES */}
        {/* ============================================ */}
        <div className="card md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <SettingsIcon className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Préférences
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
              <Printer className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white text-sm">Impression</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Factures automatiques</p>
              <button
                onClick={() => setPreferences({ ...preferences, printReceipt: !preferences.printReceipt })}
                className={`text-xs px-3 py-1 rounded-full ${
                  preferences.printReceipt 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {preferences.printReceipt ? '✅ Activé' : '❌ Désactivé'}
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
              <Globe className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white text-sm">Format date</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Affichage des dates</p>
              <select className="input-field text-xs py-1 px-2">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
              <DollarSign className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white text-sm">Devise</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Symbole monétaire</p>
              <select className="input-field text-xs py-1 px-2">
                <option>FCFA</option>
                <option>€</option>
                <option>$</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white text-sm">Rapports</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Période par défaut</p>
              <select className="input-field text-xs py-1 px-2">
                <option>Mois en cours</option>
                <option>Semaine en cours</option>
                <option>Année en cours</option>
              </select>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 5. SÉCURITÉ */}
        {/* ============================================ */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sécurité
            </h3>
          </div>
          <div className="space-y-3">
            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <Key className="h-4 w-4" />
              Changer le mot de passe
            </button>
            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Authentification à deux facteurs
            </button>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                🔒 Dernière connexion : {new Date().toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📧 Email : {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 6. ACTIONS */}
        {/* ============================================ */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <Database className="h-5 w-5 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actions
            </h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => fetchProducts()}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser les données
            </button>
            <button
              onClick={handleResetData}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-orange-500 hover:text-orange-600"
            >
              <Database className="h-4 w-4" />
              Réinitialiser les données de test
            </button>
            <button
              onClick={handleLogout}
              className="btn-danger w-full flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* 7. INFORMATIONS */}
        {/* ============================================ */}
        <div className="card md:col-span-2 text-center">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
              <Store className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Easy-Shop v1.0.0
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Application de gestion commerciale
            </p>
            {/* <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
              <span>⚡ React 18</span>
              <span>🎨 TailwindCSS 3</span>
              <span>📦 Supabase</span>
              <span>📱 PWA Ready</span>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings