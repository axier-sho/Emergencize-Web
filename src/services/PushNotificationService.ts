'use client'

import { auth } from '@/lib/firebase'

export interface NotificationPermissionResult {
  granted: boolean
  error?: string
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  message: string
  type: 'help' | 'danger'
  fromUser: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  timestamp: string
  alertId: string
}

class PushNotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private vapidPublicKey: string = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported')
        return false
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported')
        return false
      }

      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered successfully')

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      return true
    } catch (error) {
      console.error('Error initializing push notifications:', error)
      return false
    }
  }

  async requestPermission(): Promise<NotificationPermissionResult> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        return {
          granted: false,
          error: 'Notifications not supported in this browser'
        }
      }

      let permission = Notification.permission

      // Request permission if not already granted or denied
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }

      const granted = permission === 'granted'

      if (!granted) {
        return {
          granted: false,
          error: permission === 'denied' 
            ? 'Notification permission denied. Please enable in browser settings.'
            : 'Notification permission not granted'
        }
      }

      return { granted: true }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return {
        granted: false,
        error: 'Failed to request notification permission'
      }
    }
  }

  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        console.error('Service Worker not registered')
        return null
      }

      if (!this.vapidPublicKey) {
        console.warn('VAPID public key not configured. Skipping push subscription.')
        return null
      }

      // Check for existing subscription
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()

      if (!subscription) {
        // Create new subscription
        const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey)
        
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        })
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        }
      }

      console.log('Push subscription created:', subscriptionData)
      return subscriptionData
    } catch (error) {
      console.error('Error subscribing to push:', error)
      return null
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return false
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      
      if (subscription) {
        const success = await subscription.unsubscribe()
        console.log('Push unsubscription:', success ? 'successful' : 'failed')
        return success
      }

      return true
    } catch (error) {
      console.error('Error unsubscribing from push:', error)
      return false
    }
  }

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Check permission
      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted')
        return
      }

      const {
        title,
        message,
        type,
        fromUser,
        location,
        alertId
      } = payload

      const notificationTitle = type === 'danger' ? '🚨 EMERGENCY ALERT' : '💙 HELP REQUEST'
      const notificationOptions: NotificationOptions = {
        body: `From: ${fromUser}\n${message}${location ? '\n📍 Location included' : ''}`,
        icon: '/icon-1280x1280.PNG',
        tag: `alert-${alertId}`,
        requireInteraction: type === 'danger',
        silent: false,
        data: {
          alertId,
          type,
          fromUser,
          url: '/dashboard'
        }
      }

      const notification = new Notification(notificationTitle, notificationOptions)

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
        
        // Navigate to dashboard
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard'
        }
      }

      // Auto-close help requests after 10 seconds
      if (type === 'help') {
        setTimeout(() => {
          notification.close()
        }, 10000)
      }

    } catch (error) {
      console.error('Error showing local notification:', error)
    }
  }

  async sendPushNotification(
    subscription: PushSubscriptionData, 
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Include auth token if available
      let token: string | undefined
      try {
        token = await auth?.currentUser?.getIdToken()
      } catch {}

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          subscription,
          payload
        })
      })

      if (!response.ok) {
        throw new Error(`Push send failed: ${response.statusText}`)
      }

      console.log('Push notification sent successfully')
      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }

  async cacheAlertForOffline(payload: NotificationPayload): Promise<void> {
    try {
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'CACHE_ALERT',
          payload
        })
      }
    } catch (error) {
      console.error('Error caching alert for offline:', error)
    }
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window
  }

  async getSubscriptionStatus(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return false
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      return !!subscription
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String) {
      return new Uint8Array()
    }
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return ''
    
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach((b) => binary += String.fromCharCode(b))
    return window.btoa(binary)
  }

  // Test notification
  async testNotification(): Promise<void> {
    const testPayload: NotificationPayload = {
      title: 'Test Notification',
      message: 'This is a test emergency notification to verify your settings.',
      type: 'help',
      fromUser: 'System',
      timestamp: new Date().toISOString(),
      alertId: `test-${Date.now()}`
    }

    await this.showLocalNotification(testPayload)
  }
}

export const pushNotificationService = new PushNotificationService()