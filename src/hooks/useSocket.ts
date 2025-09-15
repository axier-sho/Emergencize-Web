'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketProps {
  userId?: string
  onUserOnline?: (userId: string) => void
  onUserOffline?: (userId: string) => void
  onEmergencyAlert?: (alert: any) => void
  onChatMessage?: (message: any) => void
  onGroupMessage?: (message: any) => void
  onUserTyping?: (data: any) => void
  onUserStoppedTyping?: (data: any) => void
  onVoiceCallOffer?: (data: any) => void
  onVoiceCallAnswer?: (data: any) => void
  onVoiceCallEnd?: (data: any) => void
  onIceCandidate?: (data: any) => void
}

export function useSocket({ 
  userId, 
  onUserOnline, 
  onUserOffline, 
  onEmergencyAlert,
  onChatMessage,
  onGroupMessage,
  onUserTyping,
  onUserStoppedTyping,
  onVoiceCallOffer,
  onVoiceCallAnswer,
  onVoiceCallEnd,
  onIceCandidate
}: UseSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)

  // Store callback refs to avoid recreation
  const callbackRefs = useRef({
    onUserOnline,
    onUserOffline,
    onEmergencyAlert,
    onChatMessage,
    onGroupMessage,
    onUserTyping,
    onUserStoppedTyping,
    onVoiceCallOffer,
    onVoiceCallAnswer,
    onVoiceCallEnd,
    onIceCandidate
  })

  // Update callback refs when they change
  useEffect(() => {
    callbackRefs.current = {
      onUserOnline,
      onUserOffline,
      onEmergencyAlert,
      onChatMessage,
      onGroupMessage,
      onUserTyping,
      onUserStoppedTyping,
      onVoiceCallOffer,
      onVoiceCallAnswer,
      onVoiceCallEnd,
      onIceCandidate
    }
  })

  useEffect(() => {
    if (!userId) return

    // Connect to Socket.io server
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Join user to their personal room
    newSocket.emit('user-join', userId)

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to server')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from server')
    })

    // User presence events
    newSocket.on('user-online', (onlineUserId: string) => {
      setOnlineUsers(prev => [...prev.filter(id => id !== onlineUserId), onlineUserId])
      callbackRefs.current.onUserOnline?.(onlineUserId)
    })

    newSocket.on('user-offline', (offlineUserId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== offlineUserId))
      callbackRefs.current.onUserOffline?.(offlineUserId)
    })

    newSocket.on('online-users', (users: string[]) => {
      setOnlineUsers(users.filter(id => id !== userId))
    })

    // Emergency alert events
    newSocket.on('emergency-alert', (alert: any) => {
      callbackRefs.current.onEmergencyAlert?.(alert)
    })

    // Chat message events
    newSocket.on('chat-message', (message: any) => {
      callbackRefs.current.onChatMessage?.(message)
    })

    // Group chat events
    newSocket.on('group-message', (message: any) => {
      callbackRefs.current.onGroupMessage?.(message)
    })

    newSocket.on('user-typing-group', (data: any) => {
      callbackRefs.current.onUserTyping?.(data)
    })

    newSocket.on('user-stopped-typing-group', (data: any) => {
      callbackRefs.current.onUserStoppedTyping?.(data)
    })

    // Voice call events
    newSocket.on('voice-call-offer', (data: any) => {
      callbackRefs.current.onVoiceCallOffer?.(data)
    })

    newSocket.on('voice-call-answer', (data: any) => {
      callbackRefs.current.onVoiceCallAnswer?.(data)
    })

    newSocket.on('voice-call-end', (data: any) => {
      callbackRefs.current.onVoiceCallEnd?.(data)
    })

    newSocket.on('ice-candidate', (data: any) => {
      callbackRefs.current.onIceCandidate?.(data)
    })

    // Cleanup on unmount
    return () => {
      newSocket.disconnect()
      socketRef.current = null
    }
  }, [userId]) // Only depend on userId to prevent constant reconnections

  const sendEmergencyAlert = (alert: {
    type: 'help' | 'danger'
    message: string
    location?: { lat: number; lng: number; address?: string }
    contactIds?: string[]
  }) => {
    if (socket && isConnected) {
      socket.emit('emergency-alert', {
        ...alert,
        fromUserId: userId,
        timestamp: new Date().toISOString()
      })
    }
  }

  const updateUserStatus = useCallback((status: 'online' | 'offline') => {
    if (socket && isConnected) {
      socket.emit('user-status', { userId, status })
    }
  }, [socket, isConnected, userId])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserStatus('online')
      } else {
        updateUserStatus('offline')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [updateUserStatus])

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        socketRef.current.emit('user-disconnect', userId)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [userId])

  return {
    socket,
    isConnected,
    onlineUsers,
    sendEmergencyAlert,
    updateUserStatus
  }
}