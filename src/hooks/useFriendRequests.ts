'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import {
  sendFriendRequest,
  getFriendRequests,
  respondToFriendRequest,
  type FriendRequest
} from '@/lib/database'

export function useFriendRequests() {
  const { user } = useAuth()
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setFriendRequests([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = getFriendRequests(user.uid, (requests) => {
      setFriendRequests(requests)
      setLoading(false)
      setError(null)
    })

    return unsubscribe
  }, [user])

  const sendRequest = async (toUserEmail: string) => {
    if (!user) throw new Error('User not authenticated')
    
    setSending(true)
    setError(null)
    
    try {
      const toUser = await sendFriendRequest(user.uid, toUserEmail, user.email!)
      return toUser
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setSending(false)
    }
  }

  const respondToRequest = async (requestId: string, response: 'accepted' | 'declined' | 'blocked') => {
    try {
      await respondToFriendRequest(requestId, response)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    friendRequests,
    loading,
    sending,
    error,
    sendFriendRequest: sendRequest,
    respondToFriendRequest: respondToRequest
  }
}