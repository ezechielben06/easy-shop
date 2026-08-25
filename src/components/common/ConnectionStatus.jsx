import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      setTimeout(() => setWasOffline(false), 4000)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !wasOffline) return null

  return (
    <div className={`fixed top-16 left-4 right-4 z-50 max-w-md mx-auto transition-all duration-500 ${
      wasOffline ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'
    }`}>
      <div className={`rounded-xl px-4 py-2.5 shadow-lg flex items-center justify-between ${
        isOnline 
          ? 'bg-emerald-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? '✅ Connecté' : '📡 Hors ligne'}
          </span>
        </div>
        {isOnline && wasOffline && (
          <span className="text-xs opacity-80">Données synchronisées</span>
        )}
        {!isOnline && (
          <span className="text-xs opacity-80">Données en cache</span>
        )}
      </div>
    </div>
  )
}

export default ConnectionStatus