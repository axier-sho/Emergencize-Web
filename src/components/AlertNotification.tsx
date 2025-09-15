'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Heart, X, MapPin, Clock, Phone, MessageCircle, CheckCircle2 } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { ScreenReaderOnly } from './accessibility/AccessibilityProvider'

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
  onCall?: (alertId: string) => void
  onMessage?: (alertId: string) => void
  onAcknowledge?: (alertId: string) => void
}

export default function AlertNotification({ 
  alerts, 
  onDismiss, 
  onRespond,
  onCall,
  onMessage,
  onAcknowledge 
}: AlertNotificationProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([])
  const [focusedAlertIndex, setFocusedAlertIndex] = useState<number>(-1)
  const alertRefs = useRef<(HTMLDivElement | null)[]>([])
  const announcementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const newVisibleAlerts = alerts.filter(alert => !alert.isRead)
    setVisibleAlerts(newVisibleAlerts)
    
    // Announce new alerts to screen readers
    if (newVisibleAlerts.length > visibleAlerts.length) {
      const newAlerts = newVisibleAlerts.slice(visibleAlerts.length)
      newAlerts.forEach(alert => {
        announceAlert(alert)
        playAlertSound(alert.type)
      })
    }
  }, [alerts, visibleAlerts.length])

  // Screen reader announcement function
  const announceAlert = (alert: Alert) => {
    const urgency = alert.type === 'danger' ? 'Emergency alert' : 'Help request'
    const location = alert.location ? `Location included` : ''
    const message = `${urgency} from ${alert.fromUser}. ${alert.message}. ${location}`.trim()
    
    if (announcementRef.current) {
      announcementRef.current.textContent = message
    }
  }

  // Shared AudioContext to prevent memory leaks
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Get or create AudioContext
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.error('Failed to create AudioContext:', error)
        return null
      }
    }
    
    // Resume if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    
    return audioContextRef.current
  }

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Play alert sound
  const playAlertSound = (type: 'help' | 'danger') => {
    try {
      const audioContext = getAudioContext()
      if (!audioContext) return
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different sound patterns for different alert types
      if (type === 'danger') {
        // Urgent triple beep for danger
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
        
        setTimeout(() => {
          const audioCtx = getAudioContext()
          if (!audioCtx) return
          
          const osc2 = audioCtx.createOscillator()
          const gain2 = audioCtx.createGain()
          osc2.connect(gain2)
          gain2.connect(audioCtx.destination)
          osc2.frequency.setValueAtTime(800, audioCtx.currentTime)
          gain2.gain.setValueAtTime(0.1, audioCtx.currentTime)
          osc2.start()
          osc2.stop(audioCtx.currentTime + 0.1)
        }, 150)
      } else {
        // Single gentle tone for help
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }
    } catch (error) {
      console.error('Error playing alert sound:', error)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (visibleAlerts.length === 0) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedAlertIndex(prev => 
            prev < visibleAlerts.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedAlertIndex(prev => 
            prev > 0 ? prev - 1 : visibleAlerts.length - 1
          )
          break
        case 'Enter':
        case ' ':
          if (focusedAlertIndex >= 0 && onRespond) {
            event.preventDefault()
            onRespond(visibleAlerts[focusedAlertIndex].id)
          }
          break
        case 'Escape':
          event.preventDefault()
          if (focusedAlertIndex >= 0) {
            onDismiss(visibleAlerts[focusedAlertIndex].id)
          }
          break
      }
    }

    if (focusedAlertIndex >= 0) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the alert
      alertRefs.current[focusedAlertIndex]?.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [focusedAlertIndex, visibleAlerts, onRespond, onDismiss])

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

  const handleDismiss = (alertId: string) => {
    onDismiss(alertId)
    // Reset focus if dismissing focused alert
    if (focusedAlertIndex >= 0) {
      setFocusedAlertIndex(-1)
    }
  }

  return (
    <>
      {/* Screen reader announcements */}
      <div 
        ref={announcementRef}
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      />

      <div 
        className="fixed top-4 right-4 z-50 space-y-3 max-w-sm"
        role="region"
        aria-label="Emergency alerts"
        aria-live="polite"
      >
        <AnimatePresence>
          {visibleAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              ref={(el: HTMLDivElement | null) => {
                alertRefs.current[index] = el;
                return undefined;
              }}
              className={`glass-effect rounded-xl p-4 border-l-4 ${
                alert.type === 'danger' 
                  ? 'border-red-500 bg-red-900 bg-opacity-20' 
                  : 'border-blue-500 bg-blue-900 bg-opacity-20'
              } shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                focusedAlertIndex === index ? 'ring-2 ring-blue-400' : ''
              }`}
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
              tabIndex={0}
              role="alert"
              aria-labelledby={`alert-title-${alert.id}`}
              aria-describedby={`alert-content-${alert.id}`}
              onClick={() => setFocusedAlertIndex(index)}
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
                    aria-hidden="true"
                  >
                    {alert.type === 'danger' ? (
                      <AlertTriangle size={20} className="text-red-400" />
                    ) : (
                      <Heart size={20} className="text-blue-400" />
                    )}
                  </motion.div>
                  <div>
                    <h3 
                      id={`alert-title-${alert.id}`}
                      className="text-white font-semibold text-sm"
                    >
                      {alert.type === 'danger' ? 'EMERGENCY ALERT' : 'HELP REQUEST'}
                    </h3>
                    <p className="text-gray-300 text-xs">from {alert.fromUser}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="text-gray-400 hover:text-white transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                  aria-label={`Dismiss ${alert.type} alert from ${alert.fromUser}`}
                >
                  <X size={16} />
                  <ScreenReaderOnly>Dismiss alert</ScreenReaderOnly>
                </button>
              </div>

              {/* Alert Message */}
              <div 
                id={`alert-content-${alert.id}`}
                className="text-white text-sm mb-3 leading-relaxed"
              >
                {alert.message}
              </div>

              {/* Location Info */}
              {alert.location && (
                <motion.div
                  className="flex items-center space-x-2 text-gray-300 text-xs mb-3 p-2 bg-white bg-opacity-10 rounded-lg"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  aria-label="Location information"
                >
                  <MapPin size={14} className="text-blue-400 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {alert.location.address || `Coordinates: ${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`}
                  </span>
                </motion.div>
              )}

              {/* Timestamp */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-1 text-gray-400 text-xs">
                  <Clock size={12} aria-hidden="true" />
                  <span>{formatTime(alert.timestamp)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {onRespond && (
                  <motion.button
                    onClick={() => onRespond(alert.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      alert.type === 'danger'
                        ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'
                        : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.3 }}
                    aria-label={`Respond to ${alert.type} alert from ${alert.fromUser}`}
                  >
                    <MessageCircle size={12} className="inline mr-1" aria-hidden="true" />
                    Respond
                  </motion.button>
                )}

                {onCall && (
                  <motion.button
                    onClick={() => onCall(alert.id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.4 }}
                    aria-label={`Call ${alert.fromUser}`}
                  >
                    <Phone size={12} className="inline mr-1" aria-hidden="true" />
                    Call
                  </motion.button>
                )}

                {onAcknowledge && (
                  <motion.button
                    onClick={() => onAcknowledge(alert.id)}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.5 }}
                    aria-label={`Acknowledge alert from ${alert.fromUser}`}
                  >
                    <CheckCircle2 size={12} className="inline mr-1" aria-hidden="true" />
                    Acknowledge
                  </motion.button>
                )}
              </div>

              {/* Urgent Pulse Effect for Danger Alerts */}
              {alert.type === 'danger' && (
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

              {/* Keyboard instructions for focused alert */}
              {focusedAlertIndex === index && (
                <ScreenReaderOnly>
                  <div aria-live="polite">
                    Use Arrow keys to navigate alerts, Enter to respond, Escape to dismiss
                  </div>
                </ScreenReaderOnly>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Visual indicator for total alerts */}
        {visibleAlerts.length > 0 && (
          <ScreenReaderOnly>
            <div aria-live="polite">
              {visibleAlerts.length} active emergency {visibleAlerts.length === 1 ? 'alert' : 'alerts'}
            </div>
          </ScreenReaderOnly>
        )}

        {/* Screen flash for critical alerts */}
        {visibleAlerts.some(alert => alert.type === 'danger') && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-30"
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
            aria-hidden="true"
          />
        )}
      </div>

      {/* Keyboard shortcuts help */}
      {visibleAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <motion.div
            className="glass-effect rounded-lg p-2 text-xs text-gray-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2 }}
          >
            <ScreenReaderOnly>
              Alert keyboard shortcuts available:
            </ScreenReaderOnly>
            <div className="sr-only">
              ↑↓ Navigate alerts, Enter Respond, Esc Dismiss
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}