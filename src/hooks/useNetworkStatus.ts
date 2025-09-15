'use client'

import { useState, useEffect } from 'react'

export interface NetworkStatus {
  isOnline: boolean
  isSocketConnected: boolean
  connectionType: 'online' | 'offline' | 'socket-only' | 'browser-only'
  lastOnlineTime: Date | null
}

export function useNetworkStatus(socketConnected?: boolean): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true)
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)
    if (navigator.onLine) {
      setLastOnlineTime(new Date())
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setLastOnlineTime(new Date())
      console.log('🌐 Browser is back online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('🌐 Browser went offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOffline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Determine connection type
  const getConnectionType = (): 'online' | 'offline' | 'socket-only' | 'browser-only' => {
    if (isOnline && socketConnected) return 'online'
    if (!isOnline && !socketConnected) return 'offline'
    if (!isOnline && socketConnected) return 'socket-only' // Unlikely but possible
    if (isOnline && !socketConnected) return 'browser-only'
    return 'offline'
  }

  return {
    isOnline,
    isSocketConnected: socketConnected || false,
    connectionType: getConnectionType(),
    lastOnlineTime
  }
}