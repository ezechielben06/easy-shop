import React, { useState, useRef, useEffect } from 'react'
import Quagga from 'quagga'
import { X, Loader2, Barcode, AlertCircle, ScanLine, RefreshCw } from 'lucide-react'
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
  const [isScanningPaused, setIsScanningPaused] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
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
      setIsScanningPaused(false)
      
      containerRef.current.innerHTML = ''

      // Configuration améliorée pour les codes-barres
      const config = {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: containerRef.current,
          constraints: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
            aspectRatio: { ideal: 1.333 }
          },
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'upc_reader',
            'upc_e_reader',
            'code_128_reader',
            'code_39_reader',
            'codabar_reader',
            'i2of5_reader',
            'code_93_reader'
          ],
          multiple: false,
          debug: {
            showCanvas: false,
            showPatches: false,
            showFoundPatches: false,
            showSkeleton: false,
            showLabels: false,
            showPatchLabels: false,
            showRemainingPatchLabels: false,
            boxFromPatches: false,
            showBarcode: false,
            showFrequency: false,
            showMinFrequency: false,
            showPattern: false,
            showMultipleLabels: false,
            showSkeletonRemain: false,
            showHolePoints: false,
            showHole: false,
            showBestCodes: false,
          }
        },
        locate: true,
        frequency: 10, // Réduit pour moins de faux positifs
        numOfWorkers: 2,
        halfSample: true // Meilleure performance
      }

      Quagga.init(config, (err) => {
        if (err) {
          console.error('Erreur Quagga:', err)
          setError('Erreur d\'initialisation de la caméra')
          toast.error('Erreur d\'accès à la caméra')
          return
        }

        if (isMounted.current) {
          setIsReady(true)
          Quagga.start()
          console.log('✅ Scanner Quagga démarré')
        }
      })

      // Détection des codes-barres avec validation
      Quagga.onDetected((result) => {
        if (!result || !result.codeResult || !isMounted.current || isScanningPaused) return
        
        const code = result.codeResult.code
        
        // Valider le code détecté
        if (code && isValidBarcode(code)) {
          handleScan(code)
        } else {
          setDebugInfo(`Code invalide: ${code || 'vide'}`)
        }
      })

      Quagga.onProcessed((result) => {
        // Ignorer silencieusement
      })

      scannerRef.current = Quagga

    } catch (err) {
      if (!isMounted.current) return
      console.error('Erreur scanner:', err)
      setError('Impossible d\'accéder à la caméra')
      toast.error('Erreur d\'accès à la caméra')
    }
  }

  // Fonction de validation des codes-barres
  const isValidBarcode = (code) => {
    if (!code || typeof code !== 'string') return false
    
    // Nettoyer le code
    const cleanCode = code.trim()
    
    // Vérifier la longueur minimale (les codes-barres ont au moins 8 caractères)
    if (cleanCode.length < 8) return false
    
    // Vérifier si le code contient des caractères valides (chiffres principalement)
    const isValidFormat = /^[0-9A-Z\-]+$/.test(cleanCode)
    if (!isValidFormat) return false
    
    // Vérifier les formats courants
    // EAN-13: 13 chiffres
    if (/^\d{13}$/.test(cleanCode)) {
      // Vérifier la somme de contrôle EAN-13
      return validateEAN13(cleanCode)
    }
    
    // EAN-8: 8 chiffres
    if (/^\d{8}$/.test(cleanCode)) {
      return validateEAN8(cleanCode)
    }
    
    // UPC-A: 12 chiffres
    if (/^\d{12}$/.test(cleanCode)) {
      return validateUPC(cleanCode)
    }
    
    // Code-128, Code-39, etc. - on accepte si le format est bon
    return cleanCode.length >= 8
  }

  // Validation EAN-13
  const validateEAN13 = (code) => {
    if (code.length !== 13) return false
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code[i])
      sum += (i % 2 === 0) ? digit : digit * 3
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return parseInt(code[12]) === checkDigit
  }

  // Validation EAN-8
  const validateEAN8 = (code) => {
    if (code.length !== 8) return false
    let sum = 0
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(code[i])
      sum += (i % 2 === 0) ? digit * 3 : digit
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return parseInt(code[7]) === checkDigit
  }

  // Validation UPC-A
  const validateUPC = (code) => {
    if (code.length !== 12) return false
    let sum = 0
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(code[i])
      sum += (i % 2 === 0) ? digit * 3 : digit
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return parseInt(code[11]) === checkDigit
  }

  const handleScan = async (barcode) => {
    if (loading) return
    
    const now = Date.now()
    if (lastScanRef.current && now - lastScanRef.current < 2000) {
      return
    }
    lastScanRef.current = now

    try {
      setLoading(true)
      setError(null)
      setIsScanningPaused(true)
      
      // Nettoyer le code
      const cleanCode = barcode.trim()
      
      setScanCount(prev => prev + 1)
      
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }
      
      toast.success(`✅ Code détecté: ${cleanCode}`, { duration: 2000 })
      setDebugInfo(`Code: ${cleanCode}`)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (isMounted.current) {
        await onScan(cleanCode)
      }
      
    } catch (err) {
      console.error('Erreur traitement:', err)
      toast.error('Erreur de traitement')
    } finally {
      if (isMounted.current) {
        setLoading(false)
        setTimeout(() => {
          if (isMounted.current) {
            setIsScanningPaused(false)
          }
        }, 800)
      }
    }
  }

  const stopScanner = () => {
    try {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
        } catch (e) {}
        scannerRef.current = null
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      setIsReady(false)
      setIsScanningPaused(false)
    } catch (err) {
      console.debug('Stop scanner error:', err)
    }
  }

  const handleRetry = () => {
    if (!isMounted.current) return
    stopScanner()
    setDebugInfo('')
    setTimeout(() => {
      if (isMounted.current) {
        startScanner()
      }
    }, 500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative">
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
        <div className="relative aspect-square bg-black overflow-hidden" style={{ zIndex: 1 }}>
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

            {/* Debug info */}
            {debugInfo && (
              <div className="absolute bottom-16 left-4 right-4 text-center">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 inline-block mx-auto">
                  <p className="text-[10px] text-white/80 font-mono">
                    {debugInfo}
                  </p>
                </div>
              </div>
            )}

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
              {error ? 'Erreur' : isReady ? (isScanningPaused ? 'Traitement...' : 'Prêt à scanner') : 'Initialisation...'}
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