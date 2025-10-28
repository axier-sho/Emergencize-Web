'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface SocketErrorHandlerProps {
  isConnected: boolean
  onRetry?: () => void
  children: React.ReactNode
}

interface ConnectionState {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'failed'
  attempts: number
  lastError?: string
}

export default function SocketErrorHandler({ 
  isConnected, 
  onRetry, 
  children 
}: SocketErrorHandlerProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connected',
    attempts: 0
  })
  const [showNotification, setShowNotification] = useState(false)
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null)

  const MAX_RETRY_ATTEMPTS = 5
  const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000] // Progressive delays

  useEffect(() => {
    if (isConnected) {
      if (connectionState.status !== 'connected') {
        setConnectionState({
          status: 'connected',
          attempts: 0
        })
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
      }
    } else {
      if (connectionState.status === 'connected') {
        setConnectionState(prev => ({
          ...prev,
          status: 'disconnected'
        }))
        setShowNotification(true)
        
        // Start automatic retry
        handleAutoRetry()
      }
    }
  }, [isConnected, connectionState.status, handleAutoRetry])

  const handleAutoRetry = useCallback(() => {
    if (connectionState.attempts >= MAX_RETRY_ATTEMPTS) {
      setConnectionState(prev => ({
        ...prev,
        status: 'failed',
        lastError: 'Maximum retry attempts reached'
      }))
      return
    }

    const delay = RETRY_DELAYS[Math.min(connectionState.attempts, RETRY_DELAYS.length - 1)]
    
    setConnectionState(prev => ({
      ...prev,
      status: 'reconnecting',
      attempts: prev.attempts + 1
    }))

    const timer = setTimeout(() => {
      onRetry?.()
    }, delay)

    setRetryTimer(timer)
  }, [RETRY_DELAYS, connectionState.attempts, MAX_RETRY_ATTEMPTS, onRetry])

  const handleManualRetry = () => {
    if (retryTimer) {
      clearTimeout(retryTimer)
      setRetryTimer(null)
    }

    setConnectionState({
      status: 'reconnecting',
      attempts: 0
    })

    onRetry?.()
  }

  const getNotificationContent = () => {
    switch (connectionState.status) {
      case 'connected':
        return {
          icon: <CheckCircle2 size={20} className="text-green-400" />,
          title: 'Connection Restored',
          message: 'Real-time emergency alerts are now working',
          bgColor: 'bg-green-500 bg-opacity-20 border-green-400'
        }
      case 'disconnected':
        return {
          icon: <WifiOff size={20} className="text-yellow-400" />,
          title: 'Connection Lost',
          message: 'Attempting to reconnect automatically...',
          bgColor: 'bg-yellow-500 bg-opacity-20 border-yellow-400'
        }
      case 'reconnecting':
        return {
          icon: <RotateCcw size={20} className="text-blue-400 animate-spin" />,
          title: 'Reconnecting',
          message: `Attempt ${connectionState.attempts}/${MAX_RETRY_ATTEMPTS}`,
          bgColor: 'bg-blue-500 bg-opacity-20 border-blue-400'
        }
      case 'failed':
        return {
          icon: <AlertTriangle size={20} className="text-red-400" />,
          title: 'Connection Failed',
          message: 'Unable to connect to emergency alert system',
          bgColor: 'bg-red-500 bg-opacity-20 border-red-400'
        }
      default:
        return null
    }
  }

  const notificationContent = getNotificationContent()

  return (
    <>
      {children}
      
      {/* Connection Status Indicator */}
      <div className="fixed top-4 left-4 z-50">
        <motion.div
          className={`flex items-center space-x-2 px-3 py-2 rounded-full backdrop-blur-sm border ${
            isConnected 
              ? 'bg-green-500 bg-opacity-20 border-green-400' 
              : 'bg-red-500 bg-opacity-20 border-red-400'
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={isConnected ? {} : { scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {isConnected ? (
              <Wifi size={16} className="text-green-400" />
            ) : (
              <WifiOff size={16} className="text-red-400" />
            )}
          </motion.div>
          
          <span className={`text-sm font-medium ${
            isConnected ? 'text-green-300' : 'text-red-300'
          }`}>
            {isConnected ? 'Online' : 'Offline'}
          </span>
        </motion.div>
      </div>

      {/* Detailed Notification */}
      <AnimatePresence>
        {showNotification && notificationContent && (
          <motion.div
            className="fixed top-20 right-4 z-50 max-w-sm"
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
          >
            <div className={`glass-effect rounded-xl p-4 border-l-4 ${notificationContent.bgColor} shadow-2xl`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {notificationContent.icon}
                  <h3 className="text-white font-semibold text-sm">
                    {notificationContent.title}
                  </h3>
                </div>
                
                <button
                  onClick={() => setShowNotification(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-300 text-sm mb-3">
                {notificationContent.message}
              </p>

              {/* Action Buttons */}
              {(connectionState.status === 'failed' || connectionState.status === 'disconnected') && (
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleManualRetry}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Retry connection manually"
                  >
                    <RotateCcw size={12} />
                    <span>Retry Now</span>
                  </motion.button>
                  
                  {connectionState.status === 'failed' && (
                    <motion.button
                      onClick={() => window.location.reload()}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Refresh page"
                    >
                      Refresh Page
                    </motion.button>
                  )}
                </div>
              )}

              {/* Progress indicator for reconnecting */}
              {connectionState.status === 'reconnecting' && (
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <motion.div
                      className="bg-blue-400 h-1 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ 
                        duration: RETRY_DELAYS[Math.min(connectionState.attempts - 1, RETRY_DELAYS.length - 1)] / 1000,
                        ease: "linear"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Fallback Overlay */}
      {connectionState.status === 'failed' && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="glass-effect rounded-2xl p-8 w-full max-w-md text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
            
            <h2 className="text-xl font-bold text-white mb-4">
              Emergency System Offline
            </h2>
            
            <p className="text-gray-300 mb-6 text-sm">
              The real-time emergency alert system is currently unavailable. 
              For immediate emergencies, please contact emergency services directly.
            </p>

            <div className="flex flex-col gap-3">
              <motion.button
                onClick={handleManualRetry}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Connecting Again
              </motion.button>
              
              <motion.button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Refresh Application
              </motion.button>
            </div>

            <div className="mt-6 p-3 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 rounded-lg">
              <p className="text-red-200 text-xs">
                <strong>Emergency:</strong> Call your local emergency number (911, 112, etc.) for immediate help
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}