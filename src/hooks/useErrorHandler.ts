'use client'

import { useState, useCallback } from 'react'
import { useAccessibilityContext } from '@/components/accessibility/AccessibilityProvider'

export interface ErrorState {
  id: string
  type: 'connection' | 'permission' | 'location' | 'notification' | 'firebase' | 'generic'
  message: string
  details?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  isRecoverable: boolean
  recoveryAction?: string
  onRetry?: () => void
  onDismiss?: () => void
}

export interface ErrorHandlerOptions {
  showNotification?: boolean
  announceToScreenReader?: boolean
  playAudioCue?: boolean
  autoRetry?: boolean
  retryDelay?: number
  maxRetries?: number
}

export function useErrorHandler() {
  const [errors, setErrors] = useState<ErrorState[]>([])
  const { announce, playAudioCue } = useAccessibilityContext()

  const addError = useCallback((
    error: Omit<ErrorState, 'id' | 'timestamp'>,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showNotification = true,
      announceToScreenReader = true,
      playAudioCue: shouldPlayAudio = true,
      autoRetry = false,
      retryDelay = 3000,
      maxRetries = 3
    } = options

    const errorState: ErrorState = {
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    setErrors(prev => [...prev, errorState])

    // Accessibility announcements
    if (announceToScreenReader) {
      const urgency = errorState.severity === 'critical' || errorState.severity === 'high' 
        ? 'assertive' 
        : 'polite'
      announce(`Error: ${errorState.message}`, urgency)
    }

    if (shouldPlayAudio) {
      const audioType = errorState.severity === 'critical' || errorState.severity === 'high' 
        ? 'error' 
        : 'warning'
      playAudioCue(audioType)
    }

    // Auto-retry logic
    if (autoRetry && errorState.onRetry && errorState.isRecoverable) {
      let retryCount = 0
      const attemptRetry = () => {
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(() => {
            try {
              errorState.onRetry?.()
            } catch (retryError) {
              console.error('Retry failed:', retryError)
              if (retryCount < maxRetries) {
                attemptRetry()
              }
            }
          }, retryDelay * retryCount) // Exponential backoff
        }
      }
      attemptRetry()
    }

    console.error(`[${errorState.type}] ${errorState.message}`, errorState.details)
    return errorState.id
  }, [announce, playAudioCue])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback((type?: ErrorState['type']) => {
    if (type) {
      setErrors(prev => prev.filter(error => error.type !== type))
    } else {
      setErrors([])
    }
  }, [])

  const getErrorsByType = useCallback((type: ErrorState['type']) => {
    return errors.filter(error => error.type === type)
  }, [errors])

  const getErrorsBySeverity = useCallback((severity: ErrorState['severity']) => {
    return errors.filter(error => error.severity === severity)
  }, [errors])

  // Predefined error handlers for common scenarios
  const handleConnectionError = useCallback((
    details?: string,
    onRetry?: () => void
  ) => {
    return addError({
      type: 'connection',
      message: 'Connection lost. Attempting to reconnect...',
      details,
      severity: 'medium',
      isRecoverable: true,
      recoveryAction: 'Retry connection',
      onRetry
    }, {
      autoRetry: true,
      maxRetries: 5,
      retryDelay: 2000
    })
  }, [addError])

  const handlePermissionError = useCallback((
    permissionType: string,
    onRetry?: () => void
  ) => {
    return addError({
      type: 'permission',
      message: `${permissionType} permission required`,
      details: `Please enable ${permissionType} permission in your browser settings to use this feature.`,
      severity: 'high',
      isRecoverable: true,
      recoveryAction: 'Grant permission',
      onRetry
    })
  }, [addError])

  const handleLocationError = useCallback((
    errorCode: number,
    onRetry?: () => void
  ) => {
    const messages = {
      1: 'Location access denied. Please enable location permissions.',
      2: 'Location unavailable. Please check your GPS settings.',
      3: 'Location request timed out. Please try again.'
    }

    return addError({
      type: 'location',
      message: messages[errorCode as keyof typeof messages] || 'Location error occurred',
      details: `Error code: ${errorCode}`,
      severity: errorCode === 1 ? 'high' : 'medium',
      isRecoverable: true,
      recoveryAction: 'Retry location request',
      onRetry
    })
  }, [addError])

  const handleNotificationError = useCallback((
    details?: string,
    onRetry?: () => void
  ) => {
    return addError({
      type: 'notification',
      message: 'Notification system error',
      details: details || 'Failed to initialize notification system',
      severity: 'medium',
      isRecoverable: true,
      recoveryAction: 'Retry notification setup',
      onRetry
    })
  }, [addError])

  const handleFirebaseError = useCallback((
    error: any,
    onRetry?: () => void
  ) => {
    let message = 'Database error occurred'
    let severity: ErrorState['severity'] = 'medium'
    let isRecoverable = true

    // Parse Firebase error codes
    if (error?.code) {
      switch (error.code) {
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.'
          severity = 'medium'
          break
        case 'auth/too-many-requests':
          message = 'Too many requests. Please wait before trying again.'
          severity = 'high'
          break
        case 'permission-denied':
          message = 'Access denied. Please check your permissions.'
          severity = 'high'
          isRecoverable = false
          break
        case 'unavailable':
          message = 'Service temporarily unavailable. Please try again.'
          severity = 'medium'
          break
        default:
          message = error.message || 'Unknown database error'
      }
    }

    return addError({
      type: 'firebase',
      message,
      details: error?.code || error?.message,
      severity,
      isRecoverable,
      recoveryAction: isRecoverable ? 'Retry operation' : undefined,
      onRetry: isRecoverable ? onRetry : undefined
    })
  }, [addError])

  const handleGenericError = useCallback((
    message: string,
    details?: string,
    severity: ErrorState['severity'] = 'medium',
    onRetry?: () => void
  ) => {
    return addError({
      type: 'generic',
      message,
      details,
      severity,
      isRecoverable: !!onRetry,
      recoveryAction: onRetry ? 'Retry' : undefined,
      onRetry
    })
  }, [addError])

  // Emergency fallback
  const handleCriticalError = useCallback((
    message: string,
    details?: string
  ) => {
    return addError({
      type: 'generic',
      message: `CRITICAL: ${message}`,
      details,
      severity: 'critical',
      isRecoverable: false,
      recoveryAction: 'Please refresh the page'
    }, {
      announceToScreenReader: true,
      playAudioCue: true
    })
  }, [addError])

  // Batch error operations
  const hasErrorsOfType = useCallback((type: ErrorState['type']) => {
    return errors.some(error => error.type === type)
  }, [errors])

  const hasErrorsOfSeverity = useCallback((severity: ErrorState['severity']) => {
    return errors.some(error => error.severity === severity)
  }, [errors])

  const getCriticalErrors = useCallback(() => {
    return errors.filter(error => error.severity === 'critical')
  }, [errors])

  const getRecoverableErrors = useCallback(() => {
    return errors.filter(error => error.isRecoverable)
  }, [errors])

  return {
    // State
    errors,
    hasErrors: errors.length > 0,
    errorCount: errors.length,

    // Actions
    addError,
    removeError,
    clearErrors,

    // Queries
    getErrorsByType,
    getErrorsBySeverity,
    hasErrorsOfType,
    hasErrorsOfSeverity,
    getCriticalErrors,
    getRecoverableErrors,

    // Specialized handlers
    handleConnectionError,
    handlePermissionError,
    handleLocationError,
    handleNotificationError,
    handleFirebaseError,
    handleGenericError,
    handleCriticalError
  }
}