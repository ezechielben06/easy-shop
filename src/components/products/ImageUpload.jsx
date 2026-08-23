import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Upload, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ImageUpload = ({ productId, currentImage, onImageUploaded }) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB')
      return
    }

    // Si c'est un nouveau produit, on garde l'image en mémoire
    if (!productId || productId === 'new') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const tempUrl = e.target.result
        setPreview(tempUrl)
        if (onImageUploaded) {
          onImageUploaded(tempUrl)
        }
        toast.success('Image ajoutée (sera sauvegardée à l\'enregistrement)')
      }
      reader.readAsDataURL(file)
      return
    }

    // Pour un produit existant, upload direct
    await uploadImage(file)
  }

  const uploadImage = async (file) => {
    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtenir l'URL publique
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
      toast.success('Image uploadée avec succès !')
      
      if (onImageUploaded) {
        onImageUploaded(publicUrl)
      }

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

  // Fonction pour uploader une image temporaire après création du produit
  const uploadTempImage = async (base64Image, productId) => {
    try {
      // Convertir base64 en Blob
      const response = await fetch(base64Image)
      const blob = await response.blob()
      const file = new File([blob], `${productId}-${Date.now()}.jpg`, { type: 'image/jpeg' })

      const filePath = `products/${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

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
      if (onImageUploaded) {
        onImageUploaded(publicUrl)
      }
      toast.success('Image sauvegardée !')

      return publicUrl
    } catch (error) {
      console.error('Error uploading temp image:', error)
      toast.error('Erreur lors de la sauvegarde de l\'image')
      return null
    }
  }

  const removeImage = async () => {
    if (!preview) return

    // Si c'est une URL temporaire (data:image)
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
                    PNG, JPG, WEBP (max 5MB)
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

// Exporter la fonction uploadTempImage pour l'utiliser dans Products
export const uploadTempImage = ImageUpload.uploadTempImage