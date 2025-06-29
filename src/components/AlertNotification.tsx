'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Heart, X, MapPin, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Alert {
  id: string
  type: 'help' | 'danger'
  fromUser: string
  message: string
  timestamp: Date
  location?: { lat: number; lng: number; address?: string }
  isRead?: boolean
}

interface AlertNotificationProps {
  alerts: Alert[]
  onDismiss: (alertId: string) => void
  onRespond?: (alertId: string) => void
}

export default function AlertNotification({ alerts, onDismiss, onRespond }: AlertNotificationProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([])

  useEffect(() => {
    setVisibleAlerts(alerts.filter(alert => !alert.isRead))
  }, [alerts])

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {visibleAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            className={`glass-effect rounded-xl p-4 border-l-4 ${
              alert.type === 'danger' 
                ? 'border-red-500 bg-red-900 bg-opacity-20' 
                : 'border-blue-500 bg-blue-900 bg-opacity-20'
            } shadow-2xl`}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            layout
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={alert.type === 'danger' ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, 0]
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  {alert.type === 'danger' ? (
                    <AlertTriangle size={20} className="text-red-400" />
                  ) : (
                    <Heart size={20} className="text-blue-400" />
                  )}
                </motion.div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {alert.type === 'danger' ? 'EMERGENCY ALERT' : 'HELP REQUEST'}
                  </h3>
                  <p className="text-gray-300 text-xs">from {alert.fromUser}</p>
                </div>
              </div>
              
              <button
                onClick={() => onDismiss(alert.id)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Alert Message */}
            <p className="text-white text-sm mb-3 leading-relaxed">
              {alert.message}
            </p>

            {/* Location Info */}
            {alert.location && (
              <motion.div
                className="flex items-center space-x-2 text-gray-300 text-xs mb-3 p-2 bg-white bg-opacity-10 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                <span className="truncate">
                  {alert.location.address || `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`}
                </span>
              </motion.div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-gray-400 text-xs">
                <Clock size={12} />
                <span>{formatTime(alert.timestamp)}</span>
              </div>

              {/* Response Buttons */}
              {onRespond && (
                <motion.button
                  onClick={() => onRespond(alert.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    alert.type === 'danger'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.3 }}
                >
                  Respond
                </motion.button>
              )}
            </div>

            {/* Urgent Pulse Effect for Danger Alerts */}
            {alert.type === 'danger' && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-red-500"
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Sound and Screen Flash for Critical Alerts */}
      {visibleAlerts.some(alert => alert.type === 'danger') && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40"
          animate={{
            backgroundColor: [
              'rgba(239, 68, 68, 0)',
              'rgba(239, 68, 68, 0.1)',
              'rgba(239, 68, 68, 0)'
            ]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}