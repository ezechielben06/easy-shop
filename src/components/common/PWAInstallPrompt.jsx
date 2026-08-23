import React, { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        console.log('PWA installée avec succès')
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Ne pas afficher si déjà installé ou si l'utilisateur a déjà fermé
  if (!showPrompt || localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null
  }

  // Vérifier si l'app est déjà installée
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Download className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              Installer Easy-Shop
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Installez l'application pour un accès rapide
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleInstall}
                className="btn-primary text-sm py-1.5 px-3"
              >
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Pas maintenant
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt