'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import {
  sendFriendRequest,
  getFriendRequests,
  getSentFriendRequests,
  respondToFriendRequest,
  type FriendRequest
} from '@/lib/database'

export function useFriendRequests() {
  const { user } = useAuth()
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setFriendRequests([])
      setSentRequests([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribeReceived = getFriendRequests(user.uid, (requests) => {
      setFriendRequests(requests)
      setError(null)
    })
    const unsubscribeSent = getSentFriendRequests(user.uid, (requests) => {
      setSentRequests(requests)
      setError(null)
    })

    setLoading(false)

    return () => {
      unsubscribeReceived()
      unsubscribeSent()
    }
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

  const respondToRequest = async (requestId: string, response: 'accepted' | 'declined' | 'blocked', nickname?: string) => {
    try {
      await respondToFriendRequest(requestId, response, nickname)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    friendRequests,
    sentRequests,
    loading,
    sending,
    error,
    sendFriendRequest: sendRequest,
    respondToFriendRequest: respondToRequest
  }
}