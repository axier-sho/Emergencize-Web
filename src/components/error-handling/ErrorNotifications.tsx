'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Wifi, 
  MapPin, 
  Bell, 
  Database, 
  X, 
  RotateCcw,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { ErrorState } from '@/hooks/useErrorHandler'
import { ScreenReaderOnly } from '../accessibility/AccessibilityProvider'

interface ErrorNotificationsProps {
  errors: ErrorState[]
  onDismiss: (id: string) => void
  onRetry: (id: string) => void
}

export default function ErrorNotifications({ errors, onDismiss, onRetry }: ErrorNotificationsProps) {
  const getErrorIcon = (type: ErrorState['type'], severity: ErrorState['severity']) => {
    const iconClass = severity === 'critical' || severity === 'high' ? 'text-red-400' : 'text-yellow-400'
    
    switch (type) {
      case 'connection':
        return <Wifi size={20} className={iconClass} />
      case 'location':
        return <MapPin size={20} className={iconClass} />
      case 'notification':
        return <Bell size={20} className={iconClass} />
      case 'firebase':
        return <Database size={20} className={iconClass} />
      case 'permission':
        return <AlertCircle size={20} className={iconClass} />
      default:
        return severity === 'critical' 
          ? <XCircle size={20} className="text-red-400" />
          : <AlertTriangle size={20} className={iconClass} />
    }
  }

  const getErrorColors = (severity: ErrorState['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-900 bg-opacity-30'
      case 'high':
        return 'border-red-400 bg-red-800 bg-opacity-20'
      case 'medium':
        return 'border-yellow-400 bg-yellow-800 bg-opacity-20'
      default:
        return 'border-blue-400 bg-blue-800 bg-opacity-20'
    }
  }

  const getPriorityOrder = (error: ErrorState): number => {
    const severityWeight = {
      critical: 1000,
      high: 100,
      medium: 10,
      low: 1
    }
    return severityWeight[error.severity] + (error.isRecoverable ? 1 : 0)
  }

  const sortedErrors = [...errors].sort((a, b) => getPriorityOrder(b) - getPriorityOrder(a))

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return timestamp.toLocaleDateString()
  }

  if (errors.length === 0) return null

  return (
    <div 
      className="fixed top-4 left-4 z-50 space-y-3 max-w-md"
      role="region"
      aria-label="Error notifications"
      aria-live="polite"
    >
      <AnimatePresence>
        {sortedErrors.map((error, index) => (
          <motion.div
            key={error.id}
            className={`glass-effect rounded-xl p-4 border-l-4 ${getErrorColors(error.severity)} shadow-2xl`}
            initial={{ opacity: 0, x: -300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.8 }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            layout
            role="alert"
            aria-labelledby={`error-title-${error.id}`}
            aria-describedby={`error-content-${error.id}`}
          >
            {/* Error Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={error.severity === 'critical' ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, 0]
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: error.severity === 'critical' ? Infinity : 0,
                    repeatDelay: 1
                  }}
                  aria-hidden="true"
                >
                  {getErrorIcon(error.type, error.severity)}
                </motion.div>
                <div>
                  <h3 
                    id={`error-title-${error.id}`}
                    className="text-white font-semibold text-sm"
                  >
                    {error.severity.toUpperCase()} ERROR
                  </h3>
                  <p className="text-gray-300 text-xs">
                    {error.type.replace('_', ' ')} • {formatTimestamp(error.timestamp)}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => onDismiss(error.id)}
                className="text-gray-400 hover:text-white transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                aria-label={`Dismiss ${error.type} error`}
              >
                <X size={16} />
                <ScreenReaderOnly>Dismiss error</ScreenReaderOnly>
              </button>
            </div>

            {/* Error Message */}
            <div 
              id={`error-content-${error.id}`}
              className="text-white text-sm mb-3 leading-relaxed"
            >
              {error.message}
            </div>

            {/* Error Details */}
            {error.details && (
              <details className="mb-3">
                <summary className="text-gray-300 text-xs cursor-pointer hover:text-white transition-colors">
                  Technical details
                </summary>
                <div className="mt-2 p-2 bg-black bg-opacity-20 rounded text-gray-400 text-xs font-mono">
                  {error.details}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {error.isRecoverable && error.onRetry && (
                <motion.button
                  onClick={() => {
                    onRetry(error.id)
                    error.onRetry?.()
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Retry ${error.type} operation`}
                >
                  <RotateCcw size={12} />
                  <span>{error.recoveryAction || 'Retry'}</span>
                </motion.button>
              )}

              {error.severity === 'critical' && (
                <motion.button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Refresh page to recover"
                >
                  Refresh Page
                </motion.button>
              )}

              <motion.button
                onClick={() => onDismiss(error.id)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Dismiss error notification"
              >
                Dismiss
              </motion.button>
            </div>

            {/* Urgent pulse effect for critical errors */}
            {error.severity === 'critical' && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-red-500 pointer-events-none"
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                aria-hidden="true"
              />
            )}

            {/* Screen reader context */}
            <ScreenReaderOnly>
              <div>
                Error type: {error.type}. 
                Severity: {error.severity}. 
                {error.isRecoverable ? 'This error can be retried.' : 'Manual intervention may be required.'}
                {error.recoveryAction && ` Suggested action: ${error.recoveryAction}.`}
              </div>
            </ScreenReaderOnly>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Summary for screen readers */}
      {errors.length > 0 && (
        <ScreenReaderOnly>
          <div aria-live="polite">
            {errors.length} active {errors.length === 1 ? 'error' : 'errors'}. 
            {errors.filter(e => e.severity === 'critical').length > 0 && 
              `${errors.filter(e => e.severity === 'critical').length} critical.`
            }
          </div>
        </ScreenReaderOnly>
      )}
    </div>
  )
}