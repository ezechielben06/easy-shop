import React, { useState, useRef, useEffect } from 'react'
import { useZxing } from 'react-zxing'
import { X, Camera, Loader2, Barcode, AlertCircle, ScanLine } from 'lucide-react'
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
  const lastScanRef = useRef(null)

  const { ref } = useZxing({
    onResult: (result) => {
      handleScan(result.getText())
    },
    onError: (err) => {
      console.error('Erreur de scan:', err)
      if (err?.message?.includes('Permission denied')) {
        setError('Permission caméra refusée')
        toast.error('Veuillez autoriser l\'accès à la caméra')
      } else {
        setError('Erreur d\'accès à la caméra')
      }
    },
    constraints: {
      facingMode: 'environment',
      audio: false,
    },
    paused: !isOpen,
  })

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setScanCount(0)
    }
  }, [isOpen])

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

      if (!barcode) {
        setError('Code-barres non valide')
        setLoading(false)
        return
      }

      setScanCount(prev => prev + 1)
      await onScan(barcode)
      
    } catch (error) {
      console.error('Erreur de scan:', error)
      setError('Erreur lors du traitement du code-barres')
      toast.error('Erreur de scan')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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

        {/* Scanner - avec z-index élevé pour éviter les superpositions */}
        <div className="relative aspect-square bg-black overflow-hidden" style={{ zIndex: 1 }}>
          <div ref={ref} className="w-full h-full" />

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
            <div className="absolute bottom-16 left-4 right-4 bg-red-500/90 text-white text-sm p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Prêt à scanner</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner