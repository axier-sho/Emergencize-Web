import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'

export interface OfflineAlert {
  id: string
  type: 'help' | 'danger'
  message: string
  fromUserId: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  timestamp: string
  urgency?: 'low' | 'medium' | 'high' | 'critical'
}

export interface QueuedAlert extends OfflineAlert {
  queuedAt: string
  attempts: number
  status: 'pending' | 'syncing' | 'failed' | 'completed'
  lastAttempt?: string
  nextRetry: string
  lastError?: string
}

export interface OfflineAlertStats {
  totalQueued: number
  pending: number
  syncing: number
  failed: number
  oldestQueuedAt?: string
  lastSyncAttempt?: string
}

export class OfflineAlertService {
  private static instance: OfflineAlertService
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private eventListeners: Map<string, Set<Function>> = new Map()

  private constructor() {
    this.initializeServiceWorker()
    this.setupServiceWorkerMessageListener()
  }

  static getInstance(): OfflineAlertService {
    if (!OfflineAlertService.instance) {
      OfflineAlertService.instance = new OfflineAlertService()
    }
    return OfflineAlertService.instance
  }

  private async initializeServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          this.serviceWorkerRegistration = registration
          console.log('OfflineAlertService: Service Worker found')
        } else {
          console.warn('OfflineAlertService: No Service Worker registration found')
        }
      }
    } catch (error) {
      console.error('OfflineAlertService: Failed to initialize Service Worker:', error)
    }
  }

  private setupServiceWorkerMessageListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, alertId, success, error, willRetry } = event.data

        switch (type) {
          case 'ALERT_SYNCED':
            this.emit('alertSynced', { alertId, success })
            break
          case 'ALERT_SYNC_FAILED':
            this.emit('alertSyncFailed', { alertId, error, willRetry })
            break
        }
      })
    }
  }

  async queueAlert(alert: OfflineAlert): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      // Validate alert locally first
      const validation = ValidationService.getInstance().validateEmergencyAlert(alert)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Alert validation failed: ${Object.values(validation.errors).flat().join(', ')}`
        }
      }

      // Check if we have a service worker
      if (!this.serviceWorkerRegistration) {
        throw new Error('Service Worker not available')
      }

      // Send message to service worker
      const result = await this.sendMessageToServiceWorker('QUEUE_OFFLINE_ALERT', alert)
      
      if (result.success) {
        // Log the offline queuing event
        SecurityMonitoringService.getInstance().logSecurityEvent({
          type: 'authentication_success',
          severity: alert.type === 'danger' ? 'high' : 'medium',
          details: {
            action: 'offline_alert_queued',
            alertType: alert.type,
            alertId: result.alertId,
            queuedAt: result.queuedAt,
            hasLocation: !!alert.location
          },
          userId: alert.fromUserId
        })

        this.emit('alertQueued', { alertId: result.alertId, alert })
      }

      return result
    } catch (error) {
      console.error('Failed to queue offline alert:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getQueuedAlerts(): Promise<QueuedAlert[]> {
    try {
      if (!this.serviceWorkerRegistration) {
        return []
      }

      const result = await this.sendMessageToServiceWorker('GET_QUEUED_ALERTS')
      return result.success ? result.alerts : []
    } catch (error) {
      console.error('Failed to get queued alerts:', error)
      return []
    }
  }

  async getQueueStats(): Promise<OfflineAlertStats> {
    try {
      const alerts = await this.getQueuedAlerts()
      
      const stats: OfflineAlertStats = {
        totalQueued: alerts.length,
        pending: alerts.filter(a => a.status === 'pending').length,
        syncing: alerts.filter(a => a.status === 'syncing').length,
        failed: alerts.filter(a => a.status === 'failed').length
      }

      if (alerts.length > 0) {
        // Find oldest queued alert
        const oldest = alerts.reduce((prev, current) => 
          new Date(prev.queuedAt) < new Date(current.queuedAt) ? prev : current
        )
        stats.oldestQueuedAt = oldest.queuedAt

        // Find most recent sync attempt
        const withAttempts = alerts.filter(a => a.lastAttempt)
        if (withAttempts.length > 0) {
          const mostRecent = withAttempts.reduce((prev, current) =>
            new Date(prev.lastAttempt!) > new Date(current.lastAttempt!) ? prev : current
          )
          stats.lastSyncAttempt = mostRecent.lastAttempt
        }
      }

      return stats
    } catch (error) {
      console.error('Failed to get queue stats:', error)
      return {
        totalQueued: 0,
        pending: 0,
        syncing: 0,
        failed: 0
      }
    }
  }

  async forceSyncAlerts(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!this.serviceWorkerRegistration) {
        return { success: false, error: 'Service Worker not available' }
      }

      const result = await this.sendMessageToServiceWorker('FORCE_SYNC_ALERTS')
      
      if (result.success) {
        this.emit('syncForced', {})
      }

      return result
    } catch (error) {
      console.error('Failed to force sync alerts:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async clearQueue(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!this.serviceWorkerRegistration) {
        return { success: false, error: 'Service Worker not available' }
      }

      const result = await this.sendMessageToServiceWorker('CLEAR_ALERT_QUEUE')
      
      if (result.success) {
        this.emit('queueCleared', {})
      }

      return result
    } catch (error) {
      console.error('Failed to clear alert queue:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async cleanupExpiredAlerts(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!this.serviceWorkerRegistration) {
        return { success: false, error: 'Service Worker not available' }
      }

      return await this.sendMessageToServiceWorker('CLEANUP_EXPIRED_ALERTS')
    } catch (error) {
      console.error('Failed to cleanup expired alerts:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  isOnline(): boolean {
    return navigator.onLine
  }

  isServiceWorkerAvailable(): boolean {
    return !!this.serviceWorkerRegistration
  }

  // Event system for real-time updates
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      })
    }
  }

  private async sendMessageToServiceWorker(type: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.serviceWorkerRegistration) {
        reject(new Error('Service Worker not available'))
        return
      }

      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }

      const activeWorker = this.serviceWorkerRegistration.active
      if (activeWorker) {
        activeWorker.postMessage(
          { type, payload },
          [messageChannel.port2]
        )
      } else {
        reject(new Error('No active Service Worker'))
      }
    })
  }

  // Utility methods for alert creation
  createHelpAlert(userId: string, message: string, location?: OfflineAlert['location']): OfflineAlert {
    return {
      id: crypto.randomUUID(),
      type: 'help',
      message: message.trim(),
      fromUserId: userId,
      location,
      timestamp: new Date().toISOString(),
      urgency: 'medium'
    }
  }

  createDangerAlert(userId: string, message: string, location?: OfflineAlert['location']): OfflineAlert {
    return {
      id: crypto.randomUUID(),
      type: 'danger',
      message: message.trim(),
      fromUserId: userId,
      location,
      timestamp: new Date().toISOString(),
      urgency: 'critical'
    }
  }

  // Monitor network status and auto-sync when online
  startNetworkMonitoring(): void {
    const handleOnline = async () => {
      console.log('Network is back online, checking for queued alerts')
      const stats = await this.getQueueStats()
      if (stats.totalQueued > 0) {
        console.log(`Found ${stats.totalQueued} queued alerts, triggering sync`)
        await this.forceSyncAlerts()
      }
    }

    const handleOffline = () => {
      console.log('Network went offline, alerts will be queued')
      this.emit('networkOffline', {})
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (navigator.onLine) {
      handleOnline()
    }
  }

  stopNetworkMonitoring(): void {
    window.removeEventListener('online', this.startNetworkMonitoring)
    window.removeEventListener('offline', this.stopNetworkMonitoring)
  }
}

export default OfflineAlertService.getInstance()