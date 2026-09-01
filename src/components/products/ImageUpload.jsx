import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Upload, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

// Fonction de compression d'image
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let width = img.width
        let height = img.height
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        
        // Créer le canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convertir en blob
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const ImageUpload = ({ productId, currentImage, onImageUploaded }) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Vérifications
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 10MB")
      return
    }

    // Si nouveau produit, on garde l'image en mémoire (compressée)
    if (!productId || productId === 'new') {
      setProgress(30)
      const compressed = await compressImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
        setProgress(100)
        if (onImageUploaded) {
          onImageUploaded(e.target.result)
        }
        toast.success('Image compressée et prête')
        setTimeout(() => setProgress(0), 500)
      }
      reader.readAsDataURL(compressed)
      return
    }

    // Pour un produit existant, upload direct avec compression
    await uploadImage(file)
  }

  const uploadImage = async (file) => {
    try {
      setUploading(true)
      setProgress(10)

      // Compression
      setProgress(30)
      const compressed = await compressImage(file, 800, 800, 0.7)
      setProgress(60)

      // Générer un nom de fichier
      const fileExt = 'jpg'
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressed, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError
      setProgress(80)

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      // Mettre à jour le produit
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)

      if (updateError) throw updateError

      setPreview(publicUrl)
      setProgress(100)
      toast.success('Image uploadée avec succès !')
      
      if (onImageUploaded) {
        onImageUploaded(publicUrl)
      }

      setTimeout(() => setProgress(0), 500)

    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = async () => {
    if (!preview) return

    // Image temporaire
    if (preview.startsWith('data:image')) {
      setPreview(null)
      if (onImageUploaded) {
        onImageUploaded(null)
      }
      toast.success('Image supprimée')
      return
    }

    try {
      setUploading(true)
      const urlParts = preview.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `products/${fileName}`

      await supabase.storage.from('product-images').remove([filePath])

      if (productId && productId !== 'new') {
        await supabase
          .from('products')
          .update({ image_url: null })
          .eq('id', productId)
      }

      setPreview(null)
      toast.success('Image supprimée')
      
      if (onImageUploaded) {
        onImageUploaded(null)
      }

    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Barre de progression */}
      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-500 h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="relative">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Product"
              className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={uploading}
              >
                Changer
              </button>
              <button
                onClick={removeImage}
                className="bg-red-500 text-white text-sm py-1.5 px-3 rounded-lg hover:bg-red-600 transition-colors"
                disabled={uploading}
              >
                Supprimer
              </button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload en cours...</p>
                <p className="text-xs text-gray-400">{Math.round(progress)}%</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cliquez pour ajouter une image
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, WEBP (max 10MB) - Compressé automatiquement
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {(!productId || productId === 'new') && preview && preview.startsWith('data:image') && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg text-center">
          ℹ️ L'image sera sauvegardée lors de l'enregistrement du produit
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  )
}

export default ImageUpload