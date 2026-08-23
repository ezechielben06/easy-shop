import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Créer le dossier icons s'il n'existe pas
const iconsDir = path.join(__dirname, 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Tailles d'icônes nécessaires
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Générer un fichier SVG simple si pas d'image source
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#3b82f6"/>
  <text x="256" y="280" font-family="Arial" font-size="180" font-weight="bold" fill="white" text-anchor="middle">🛍️</text>
  <text x="256" y="380" font-family="Arial" font-size="40" font-weight="bold" fill="white" text-anchor="middle">Easy-Shop</text>
</svg>`

// Générer des fichiers d'icônes vides (en attendant d'avoir de vraies images)
sizes.forEach(size => {
  const filePath = path.join(iconsDir, `icon-${size}x${size}.png`)
  if (!fs.existsSync(filePath)) {
    // Créer un fichier vide ou copier depuis une source
    console.log(`📝 Créer une icône de ${size}x${size}px`)
    // Note: Vous devrez ajouter vos propres images ou utiliser un générateur
  }
})

console.log('✅ Dossier icons créé avec succès !')
console.log(`📁 ${iconsDir}`)
console.log('📝 Placez vos images dans le dossier icons avec les noms:')
sizes.forEach(size => {
  console.log(`   - icon-${size}x${size}.png`)
})