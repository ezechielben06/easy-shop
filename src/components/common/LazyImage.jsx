import React, { useState, useEffect, useRef } from 'react'
import { Package } from 'lucide-react'

const LazyImage = ({ src, alt, className = "w-full h-full object-cover", fallback = null }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Réinitialiser quand la source change
    setIsLoaded(false)
    setHasError(false)
    setIsVisible(false)

    if (!src) {
      setHasError(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { 
        rootMargin: '100px',
        threshold: 0.1
      }
    )

    const currentContainer = containerRef.current
    if (currentContainer) {
      observer.observe(currentContainer)
    }

    return () => {
      observer.disconnect()
    }
  }, [src])

  // Gestionnaire d'erreur pour l'image
  const handleError = () => {
    setHasError(true)
    setIsLoaded(false)
  }

  // Si pas d'image ou erreur
  if (hasError || !src) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
        {fallback || <Package className="h-8 w-8 text-gray-400" />}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Placeholder */}
      {!isLoaded && (
        <div className={`${className} bg-gray-100 dark:bg-gray-700 animate-pulse flex items-center justify-center absolute inset-0`}>
          <Package className="h-8 w-8 text-gray-300 dark:text-gray-600" />
        </div>
      )}

      {/* Image - seulement si visible */}
      {isVisible && (
        <img
          ref={imgRef}
          src={src}
          alt={alt || 'Image produit'}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 relative`}
          onLoad={() => {
            setIsLoaded(true)
          }}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  )
}

export default LazyImage