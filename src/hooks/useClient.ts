'use client'

import { useState, useEffect } from 'react'

export function useClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const isClient = useClient()

  useEffect(() => {
    if (!isClient) return

    const updateWindowSize = () => {
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      })
    }
    
    updateWindowSize()
    window.addEventListener('resize', updateWindowSize)
    return () => window.removeEventListener('resize', updateWindowSize)
  }, [isClient])

  return windowSize
}