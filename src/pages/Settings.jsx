import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { supabase } from '../lib/supabaseClient'
import { Settings as SettingsIcon, User, Store, Bell, Shield, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    shop_name: '',
    shop_address: '',
    phone: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      toast.success('Paramètres mis à jour')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Paramètres
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les paramètres de votre boutique
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profil */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profil
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Nom complet</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="input-field"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="input-label">Téléphone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="input-field"
                placeholder="Votre téléphone"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        {/* Boutique */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Store className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations boutique
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="input-label">Nom de la boutique</label>
              <input
                type="text"
                value={profile.shop_name}
                onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
                className="input-field"
                placeholder="Easy-Shop"
              />
            </div>
            <div>
              <label className="input-label">Adresse</label>
              <input
                type="text"
                value={profile.shop_address}
                onChange={(e) => setProfile({ ...profile, shop_address: e.target.value })}
                className="input-field"
                placeholder="Adresse de la boutique"
              />
            </div>
          </div>
        </div>

        {/* Apparence */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            {isDarkMode ? (
              <Moon className="h-6 w-6 text-blue-500" />
            ) : (
              <Sun className="h-6 w-6 text-blue-500" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Apparence
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {isDarkMode ? 'Mode sombre' : 'Mode clair'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isDarkMode ? 'Désactivé' : 'Activé'}
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.email}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Votre email est utilisé pour vous connecter
          </p>
        </div>

        {/* Sécurité */}
        <div className="card md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sécurité
            </h3>
          </div>
          <button className="btn-secondary w-full md:w-auto">
            Changer le mot de passe
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Dernière connexion : {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings