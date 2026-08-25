const DB_NAME = 'easy-shop-cache'
const DB_VERSION = 1

// Ouvrir la base de données
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Créer les stores
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('pending_changes')) {
        db.createObjectStore('pending_changes', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('stats')) {
        db.createObjectStore('stats', { keyPath: 'key' })
      }
    }
  })
}

// Sauvegarder des données
export const cacheData = async (storeName, data) => {
  try {
    const db = await openDB()
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    
    const items = Array.isArray(data) ? data : [data]
    items.forEach(item => store.put(item))
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error caching data:', error)
    return false
  }
}

// Récupérer des données en cache
export const getCachedData = async (storeName) => {
  try {
    const db = await openDB()
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting cached data:', error)
    return []
  }
}

// Récupérer un élément spécifique
export const getCachedItem = async (storeName, id) => {
  try {
    const db = await openDB()
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting cached item:', error)
    return null
  }
}

// Supprimer des données en cache
export const clearCache = async (storeName) => {
  try {
    const db = await openDB()
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return false
  }
}