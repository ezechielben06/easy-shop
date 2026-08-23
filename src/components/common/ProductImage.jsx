import React from 'react'
import { Image as ImageIcon } from 'lucide-react'

const ProductImage = ({ src, alt, className = "w-20 h-20 rounded-xl" }) => {
  if (!src) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
        <ImageIcon className="h-8 w-8 text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt || 'Product'}
      className={`${className} object-cover`}
      onError={(e) => {
        // Si l'image ne charge pas, afficher l'icône par défaut
        e.target.style.display = 'none'
        const parent = e.target.parentElement
        const placeholder = document.createElement('div')
        placeholder.className = `${className} bg-gray-100 dark:bg-gray-700 flex items-center justify-center`
        placeholder.innerHTML = `<svg class="h-8 w-8 text-gray-400" ...>`
        parent?.appendChild(placeholder)
      }}
    />
  )
}

export default ProductImage