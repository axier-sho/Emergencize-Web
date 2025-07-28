'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  pushNotificationService, 
  NotificationPermissionResult,
  PushSubscriptionData,
  NotificationPayload 
} from '@/services/PushNotificationService'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize service
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        
        const supported = pushNotificationService.isSupported()
        setIsSupported(supported)
        
        if (!supported) {
          setError('Push notifications not supported in this browser')
          return
        }

        const initialized = await pushNotificationService.initialize()
        setIsInitialized(initialized)
        
        if (!initialized) {
          setError('Failed to initialize push notification service')
          return
        }

        // Check current permission status
        const currentPermission = pushNotificationService.getPermissionStatus()
        setPermission(currentPermission)

        // Check subscription status
        const subscriptionStatus = await pushNotificationService.getSubscriptionStatus()
        setIsSubscribed(subscriptionStatus)

        setError(null)
      } catch (err) {
        console.error('Error initializing push notifications:', err)
        setError('Failed to initialize push notifications')
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermissionResult> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await pushNotificationService.requestPermission()
      
      if (result.granted) {
        setPermission('granted')
      } else {
        setPermission('denied')
        setError(result.error || 'Permission denied')
      }

      return result
    } catch (err) {
      const errorMessage = 'Failed to request permission'
      setError(errorMessage)
      console.error('Error requesting permission:', err)
      return { granted: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      // First ensure we have permission
      if (permission !== 'granted') {
        const permissionResult = await requestPermission()
        if (!permissionResult.granted) {
          return false
        }
      }

      const subscriptionData = await pushNotificationService.subscribeToPush()
      
      if (subscriptionData) {
        setSubscription(subscriptionData)
        setIsSubscribed(true)
        
        // TODO: Send subscription to backend
        console.log('Subscription data:', subscriptionData)
        
        return true
      } else {
        setError('Failed to create push subscription')
        return false
      }
    } catch (err) {
      const errorMessage = 'Failed to subscribe to push notifications'
      setError(errorMessage)
      console.error('Error subscribing:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [permission, requestPermission])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const success = await pushNotificationService.unsubscribeFromPush()
      
      if (success) {
        setIsSubscribed(false)
        setSubscription(null)
        
        // TODO: Remove subscription from backend
        
        return true
      } else {
        setError('Failed to unsubscribe from push notifications')
        return false
      }
    } catch (err) {
      const errorMessage = 'Failed to unsubscribe'
      setError(errorMessage)
      console.error('Error unsubscribing:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Send local notification
  const showLocalNotification = useCallback(async (payload: NotificationPayload): Promise<void> => {
    try {
      await pushNotificationService.showLocalNotification(payload)
    } catch (err) {
      console.error('Error showing local notification:', err)
      setError('Failed to show notification')
    }
  }, [])

  // Send push notification to subscription
  const sendPushNotification = useCallback(async (
    targetSubscription: PushSubscriptionData,
    payload: NotificationPayload
  ): Promise<boolean> => {
    try {
      return await pushNotificationService.sendPushNotification(targetSubscription, payload)
    } catch (err) {
      console.error('Error sending push notification:', err)
      setError('Failed to send push notification')
      return false
    }
  }, [])

  // Test notification
  const testNotification = useCallback(async (): Promise<void> => {
    try {
      await pushNotificationService.testNotification()
    } catch (err) {
      console.error('Error testing notification:', err)
      setError('Failed to send test notification')
    }
  }, [])

  // Cache alert for offline
  const cacheAlertForOffline = useCallback(async (payload: NotificationPayload): Promise<void> => {
    try {
      await pushNotificationService.cacheAlertForOffline(payload)
    } catch (err) {
      console.error('Error caching alert for offline:', err)
    }
  }, [])

  // Get feature status
  const getStatus = useCallback(() => {
    return {
      isSupported,
      isInitialized,
      permission,
      isSubscribed,
      hasSubscription: !!subscription,
      isLoading,
      error
    }
  }, [isSupported, isInitialized, permission, isSubscribed, subscription, isLoading, error])

  // Auto-request permission for emergency apps (optional)
  const requestPermissionWithPrompt = useCallback(async (showPrompt = true): Promise<NotificationPermissionResult> => {
    if (!showPrompt) {
      return requestPermission()
    }

    // Show user-friendly prompt before requesting permission
    const userConsent = window.confirm(
      'Emergencize would like to send you push notifications for emergency alerts. ' +
      'This helps ensure you receive critical alerts even when the app is closed. ' +
      'Allow notifications?'
    )

    if (!userConsent) {
      return { granted: false, error: 'User declined notification permission' }
    }

    return requestPermission()
  }, [requestPermission])

  return {
    // Status
    isSupported,
    isInitialized,
    permission,
    isSubscribed,
    subscription,
    isLoading,
    error,
    getStatus,

    // Actions
    requestPermission,
    requestPermissionWithPrompt,
    subscribe,
    unsubscribe,
    showLocalNotification,
    sendPushNotification,
    testNotification,
    cacheAlertForOffline
  }
}