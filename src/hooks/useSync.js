import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCachedData, cacheData } from './useOfflineCache'

export const useSync = () => {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [pendingChanges, setPendingChanges] = useState([])

  // Récupérer les changements en attente
  const getPendingChanges = async () => {
    const changes = await getCachedData('pending_changes')
    return changes || []
  }

  // Ajouter un changement en attente
  const addPendingChange = async (change) => {
    const changes = await getPendingChanges()
    changes.push({
      ...change,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    })
    await cacheData('pending_changes', changes)
    setPendingChanges(changes)
  }

  // Supprimer un changement traité
  const removePendingChange = async (changeId) => {
    const changes = await getPendingChanges()
    const filtered = changes.filter(c => c.id !== changeId)
    await cacheData('pending_changes', filtered)
    setPendingChanges(filtered)
  }

  // Synchroniser les changements
  const sync = async () => {
    if (!navigator.onLine) {
      console.log('Hors ligne - Sync différée')
      return
    }

    setSyncing(true)
    try {
      const changes = await getPendingChanges()
      
      for (const change of changes) {
        try {
          if (change.type === 'create') {
            // Créer en ligne
            const { error } = await supabase
              .from(change.table)
              .insert(change.data)
            
            if (!error) {
              await removePendingChange(change.id)
            }
          } else if (change.type === 'update') {
            // Mettre à jour en ligne
            const { error } = await supabase
              .from(change.table)
              .update(change.data)
              .eq('id', change.recordId)
            
            if (!error) {
              await removePendingChange(change.id)
            }
          } else if (change.type === 'delete') {
            // Supprimer en ligne
            const { error } = await supabase
              .from(change.table)
              .delete()
              .eq('id', change.recordId)
            
            if (!error) {
              await removePendingChange(change.id)
            }
          }
        } catch (error) {
          console.error('Error syncing change:', error)
        }
      }

      setLastSync(new Date())
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Sync automatique quand la connexion revient
  useEffect(() => {
    const handleOnline = () => {
      sync()
    }

    window.addEventListener('online', handleOnline)
    
    // Sync au chargement
    sync()

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return {
    syncing,
    lastSync,
    pendingChanges: pendingChanges.length,
    sync,
    addPendingChange
  }
}