import { useState, useEffect } from 'react'

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Vérifier si le mode sombre était activé dans localStorage
    const saved = localStorage.getItem('darkMode')
    // Vérifier la préférence du système
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return saved ? JSON.parse(saved) : prefersDark
  })

  useEffect(() => {
    // Sauvegarder la préférence
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    
    // Appliquer ou retirer la classe dark
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return { isDarkMode, toggleDarkMode }
}