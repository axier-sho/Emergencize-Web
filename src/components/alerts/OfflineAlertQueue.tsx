'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader,
  Signal,
  Download,
  Upload
} from 'lucide-react'
import OfflineAlertService, { QueuedAlert, OfflineAlertStats } from '@/services/OfflineAlertService'
import { useAuth } from '@/hooks/useAuth'

interface OfflineAlertQueueProps {
  className?: string
  compact?: boolean
  showManagementControls?: boolean
}

export function OfflineAlertQueue({ 
  className = '', 
  compact = false,
  showManagementControls = true 
}: OfflineAlertQueueProps) {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queuedAlerts, setQueuedAlerts] = useState<QueuedAlert[]>([])
  const [stats, setStats] = useState<OfflineAlertStats>({
    totalQueued: 0,
    pending: 0,
    syncing: 0,
    failed: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const refreshQueueData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [alerts, queueStats] = await Promise.all([
        OfflineAlertService.getQueuedAlerts(),
        OfflineAlertService.getQueueStats()
      ])
      setQueuedAlerts(alerts)
      setStats(queueStats)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to refresh queue data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshQueueData()

    // Set up event listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    const handleAlertQueued = () => refreshQueueData()
    const handleAlertSynced = () => refreshQueueData()
    const handleSyncForced = () => setIsSyncing(false)
    const handleQueueCleared = () => refreshQueueData()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    OfflineAlertService.on('alertQueued', handleAlertQueued)
    OfflineAlertService.on('alertSynced', handleAlertSynced)
    OfflineAlertService.on('alertSyncFailed', handleAlertSynced)
    OfflineAlertService.on('syncForced', handleSyncForced)
    OfflineAlertService.on('queueCleared', handleQueueCleared)

    // Start network monitoring
    OfflineAlertService.startNetworkMonitoring()

    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshQueueData, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      OfflineAlertService.off('alertQueued', handleAlertQueued)
      OfflineAlertService.off('alertSynced', handleAlertSynced)
      OfflineAlertService.off('alertSyncFailed', handleAlertSynced)
      OfflineAlertService.off('syncForced', handleSyncForced)
      OfflineAlertService.off('queueCleared', handleQueueCleared)
      
      clearInterval(interval)
    }
  }, [refreshQueueData])

  const handleForceSync = async () => {
    setIsSyncing(true)
    try {
      const result = await OfflineAlertService.forceSyncAlerts()
      if (!result.success) {
        console.error('Force sync failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to force sync:', error)
    }
    // isSyncing will be set to false by the event listener
  }

  const handleClearQueue = async () => {
    if (window.confirm('Are you sure you want to clear all queued alerts? This action cannot be undone.')) {
      try {
        const result = await OfflineAlertService.clearQueue()
        if (!result.success) {
          console.error('Clear queue failed:', result.error)
        }
      } catch (error) {
        console.error('Failed to clear queue:', error)
      }
    }
  }

  const handleCleanupExpired = async () => {
    try {
      const result = await OfflineAlertService.cleanupExpiredAlerts()
      if (result.success) {
        await refreshQueueData()
      } else {
        console.error('Cleanup failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to cleanup expired alerts:', error)
    }
  }

  const getStatusIcon = (status: QueuedAlert['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'syncing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: QueuedAlert['status']) => {
    switch (status) {
      case 'pending':
        return 'Waiting to sync'
      case 'syncing':
        return 'Syncing...'
      case 'failed':
        return 'Sync failed'
      case 'completed':
        return 'Synced'
      default:
        return 'Unknown'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Network Status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Queue Status */}
        {stats.totalQueued > 0 && (
          <div className="flex items-center space-x-1">
            <Upload className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {stats.totalQueued} queued
            </span>
          </div>
        )}

        {/* Sync Button */}
        {stats.totalQueued > 0 && isOnline && (
          <motion.button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </motion.button>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Offline Alert Queue
              </h3>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              onClick={refreshQueueData}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalQueued}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Queued</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.syncing}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Syncing</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.failed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
        </div>

        {stats.oldestQueuedAt && (
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Oldest queued: {formatTimeAgo(stats.oldestQueuedAt)}
          </div>
        )}
      </div>

      {/* Management Controls */}
      {showManagementControls && stats.totalQueued > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {isOnline && (
              <motion.button
                onClick={handleForceSync}
                disabled={isSyncing}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Force Sync'}</span>
              </motion.button>
            )}
            
            <motion.button
              onClick={handleCleanupExpired}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Clock className="w-4 h-4" />
              <span>Cleanup Expired</span>
            </motion.button>
            
            <motion.button
              onClick={handleClearQueue}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Alert List */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {queuedAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Signal className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No alerts in queue</p>
              <p className="text-sm mt-1">
                {isOnline 
                  ? 'All alerts are being sent directly'
                  : 'Alerts will be queued when you go offline'
                }
              </p>
            </div>
          ) : (
            queuedAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.type === 'danger'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {alert.type === 'danger' ? '🚨 Danger' : '💙 Help'}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(alert.status)}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {getStatusText(alert.status)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        Queued: {formatTimeAgo(alert.queuedAt)}
                      </div>
                      <div>
                        Attempts: {alert.attempts}/3
                      </div>
                    </div>
                    
                    {alert.lastError && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                        <strong>Error:</strong> {alert.lastError}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <div>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <div>
            Service Worker: {OfflineAlertService.isServiceWorkerAvailable() ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflineAlertQueue