import React, { useState, useRef, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Loader2, Barcode, AlertCircle, ScanLine, RefreshCw, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

const BarcodeScanner = ({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "Scanner un code-barres",
  description = "Placez le code-barres devant la caméra"
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scanCount, setScanCount] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const scannerRef = useRef(null)
  const containerRef = useRef(null)
  const lastScanRef = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      stopScanner()
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      startScanner()
    } else {
      stopScanner()
    }
    return () => {
      stopScanner()
    }
  }, [isOpen])

  const startScanner = async () => {
    if (!containerRef.current || !isMounted.current) return

    try {
      setError(null)
      setIsReady(false)
      
      // Vider le conteneur
      containerRef.current.innerHTML = ''

      const scanner = new Html5Qrcode('scanner-container')

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 1.0,
      }

      const onSuccess = (decodedText) => {
        if (isMounted.current) {
          handleScan(decodedText)
        }
      }

      const onError = (err) => {
        // Ignorer silencieusement les erreurs
      }

      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        config,
        onSuccess,
        onError
      )

      if (isMounted.current) {
        setIsReady(true)
      }

    } catch (err) {
      if (!isMounted.current) return
      console.error('Erreur scanner:', err)
      setError('Impossible d\'accéder à la caméra')
      
      if (err.name === 'NotAllowedError') {
        toast.error('Veuillez autoriser l\'accès à la caméra')
      } else if (err.name === 'NotFoundError') {
        toast.error('Aucune caméra trouvée')
      } else {
        toast.error('Erreur d\'accès à la caméra')
      }
    }
  }

  const stopScanner = async () => {
    try {
      setIsReady(false)
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
          await scannerRef.current.clear()
        } catch (e) {}
        scannerRef.current = null
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    } catch (err) {
      console.debug('Stop scanner error:', err)
    }
  }

  const handleScan = async (barcode) => {
    if (loading) return
    
    const now = Date.now()
    if (lastScanRef.current && now - lastScanRef.current < 1500) {
      return
    }
    lastScanRef.current = now

    try {
      setLoading(true)
      setError(null)

      const cleanCode = barcode.trim()

      if (!cleanCode || cleanCode.length < 2) {
        toast.warning('Code-barres invalide', { duration: 1500 })
        setLoading(false)
        return
      }

      setScanCount(prev => prev + 1)
      
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }
      
      toast.success(`✅ Code détecté: ${cleanCode}`, { duration: 2000 })
      
      // Pause avant de traiter
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (isMounted.current) {
        // Mettre en pause le scanner
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop()
          } catch (e) {}
        }
        
        await onScan(cleanCode)
        
        // Redémarrer le scanner
        setTimeout(() => {
          if (isMounted.current && isOpen) {
            startScanner()
          }
        }, 500)
      }
      
    } catch (err) {
      console.error('Erreur traitement:', err)
      toast.error('Erreur de traitement')
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }

  const handleRetry = () => {
    if (!isMounted.current) return
    stopScanner()
    setTimeout(() => {
      if (isMounted.current && isOpen) {
        startScanner()
      }
    }, 500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        <div className="px-4 pt-3 pb-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {description}
          {scanCount > 0 && (
            <span className="ml-2 text-blue-500 font-medium">
              ({scanCount} scan{scanCount > 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Scanner */}
        <div className="relative aspect-square bg-black overflow-hidden">
          <div 
            ref={containerRef} 
            id="scanner-container"
            className="w-full h-full"
          />

          {/* Cadre de scan */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-4/5 h-1/3">
                <div className="absolute inset-0 border-2 border-blue-500/60 rounded-lg">
                  <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                </div>
                <div className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-lg shadow-blue-500/50 animate-scan-line" />
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center text-white/70 text-xs">
              <ScanLine className="h-5 w-5 mx-auto mb-1 opacity-50" />
              Alignez le code-barres dans le cadre
            </div>
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
                <p className="text-white text-sm mt-2">Traitement...</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
              <p className="text-white text-sm font-medium text-center">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isReady && !error ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {error ? 'Erreur' : isReady ? 'Prêt à scanner' : 'Initialisation...'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Redémarrer"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner