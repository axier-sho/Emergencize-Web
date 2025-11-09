'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { auth } from '@/lib/firebase'
import { logger } from '@/utils/logger'

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
  const [connectionAttempted, setConnectionAttempted] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectionAttemptControllerRef = useRef<AbortController | null>(null)
  const isConnectingRef = useRef(false)
  const activeAttemptIdRef = useRef(0)

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
  }, [onUserOnline, onUserOffline, onEmergencyAlert, onChatMessage, onGroupMessage, onUserTyping, onUserStoppedTyping, onVoiceCallOffer, onVoiceCallAnswer, onVoiceCallEnd, onIceCandidate])

  useEffect(() => {
    if (!userId) return

    let isCancelled = false
    let activeSocket: Socket | null = null
    setConnectionAttempted(true)

    const connectSocket = async () => {
      if (isConnectingRef.current && connectionAttemptControllerRef.current) {
        logger.debug('Aborting in-flight socket connection attempt before starting a new one')
        connectionAttemptControllerRef.current.abort()
      }

      const controller = new AbortController()
      const attemptId = activeAttemptIdRef.current + 1
      activeAttemptIdRef.current = attemptId
      connectionAttemptControllerRef.current = controller
      isConnectingRef.current = true

      const { signal } = controller
      const attemptIsActive = () =>
        !signal.aborted && !isCancelled && activeAttemptIdRef.current === attemptId

      try {
        const currentUser = auth.currentUser
        if (!currentUser || !attemptIsActive()) {
          return
        }

        let token: string
        try {
          token = await currentUser.getIdToken()
        } catch (error) {
          logger.error('Cannot connect socket without auth token:', error)
          return
        }

        if (!attemptIsActive()) {
          return
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
        logger.info('Attempting to connect to socket server: %s', socketUrl)

        const newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          timeout: 3000, // Shorter timeout
          reconnection: true,
          reconnectionAttempts: 2, // Fewer attempts
          reconnectionDelay: 2000,
          auth: { token }
        })

        if (!attemptIsActive()) {
          newSocket.disconnect()
          return
        }

        activeSocket = newSocket
        socketRef.current = newSocket
        setSocket(newSocket)

        connectionTimeoutRef.current = setTimeout(() => {
          if (!newSocket.connected) {
            logger.warn('Socket connection timeout - switching to offline mode')
            newSocket.disconnect()
            setIsConnected(false)
            setConnectionAttempted(true)
          }
        }, 10000)

        signal.addEventListener(
          'abort',
          () => {
            newSocket.disconnect()
          },
          { once: true }
        )

        newSocket.on('connect', () => {
          if (!attemptIsActive()) {
            return
          }
          setIsConnected(true)
          logger.info('Connected to socket server successfully')
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current)
            connectionTimeoutRef.current = null
          }
          newSocket.emit('user-join', userId)
        })

        newSocket.on('disconnect', (reason) => {
          if (!attemptIsActive()) {
            return
          }
          setIsConnected(false)
          logger.warn('Disconnected from server, reason: %s', reason)
        })

        newSocket.on('connect_error', (error) => {
          if (!attemptIsActive()) {
            return
          }
          setIsConnected(false)
          logger.warn('Socket server unavailable - running in offline mode')
          logger.debug('This is normal if the Socket.io server is not running')
        })

        newSocket.on('reconnect_attempt', async (attemptNumber) => {
          if (!attemptIsActive()) {
            return
          }
          logger.info('Reconnection attempt %d/2', attemptNumber)
          try {
            const refreshed = await auth.currentUser?.getIdToken(true)
            if (refreshed) {
              newSocket.auth = { token: refreshed }
            }
          } catch (error) {
            logger.error('Failed to refresh auth token during socket reconnection', error)
            setIsConnected(false)
            newSocket.disconnect()
          }
        })

        newSocket.on('reconnect_failed', () => {
          if (!attemptIsActive()) {
            return
          }
          logger.warn('Running in offline mode - emergency alerts will be saved to database')
          setIsConnected(false)
        })

        newSocket.on('user-online', (onlineUserId: string) => {
          setOnlineUsers((prev) => [...prev.filter((id) => id !== onlineUserId), onlineUserId])
          callbackRefs.current.onUserOnline?.(onlineUserId)
        })

        newSocket.on('user-offline', (offlineUserId: string) => {
          setOnlineUsers((prev) => prev.filter((id) => id !== offlineUserId))
          callbackRefs.current.onUserOffline?.(offlineUserId)
        })

        newSocket.on('online-users', (users: string[]) => {
          setOnlineUsers(users.filter((id) => id !== userId))
        })

        newSocket.on('emergency-alert', (alert: any) => {
          callbackRefs.current.onEmergencyAlert?.(alert)
        })

        newSocket.on('chat-message', (message: any) => {
          callbackRefs.current.onChatMessage?.(message)
        })

        newSocket.on('group-message', (message: any) => {
          callbackRefs.current.onGroupMessage?.(message)
        })

        newSocket.on('user-typing-group', (data: any) => {
          callbackRefs.current.onUserTyping?.(data)
        })

        newSocket.on('user-stopped-typing-group', (data: any) => {
          callbackRefs.current.onUserStoppedTyping?.(data)
        })

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
      } catch (error) {
        logger.error('Socket connection attempt failed:', error)
      } finally {
        if (activeAttemptIdRef.current === attemptId) {
          isConnectingRef.current = false
          connectionAttemptControllerRef.current = null
        }
      }
    }

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser && !isCancelled) {
        void connectSocket()
      }
    })

    if (auth.currentUser) {
      void connectSocket()
    } else {
      logger.info('Waiting for user authentication before connecting socket')
    }

    return () => {
      isCancelled = true
      unsubscribe()
      if (connectionAttemptControllerRef.current) {
        connectionAttemptControllerRef.current.abort()
        connectionAttemptControllerRef.current = null
      }
      activeAttemptIdRef.current += 1
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      if (activeSocket) {
        activeSocket.disconnect()
      }
      isConnectingRef.current = false
      socketRef.current = null
      setIsConnected(false)
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
        socketRef.current.emit('user-disconnect')
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