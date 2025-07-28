'use client'

import { validationService } from '@/services/ValidationService'
import { inputSanitizationService } from '@/services/InputSanitizationService'
import { rateLimitService } from '@/services/RateLimitService'
import { securityMonitoringService } from '@/services/SecurityMonitoringService'

/**
 * High-level security utility functions for common operations
 */

/**
 * Secure data processing pipeline
 */
export const secureDataPipeline = async <T>(
  data: any,
  validationType: 'emergencyAlert' | 'userProfile' | 'safeZone' | 'chatMessage' | 'contact' | 'friendRequest',
  userId: string,
  operation = 'data_processing'
): Promise<{
  isValid: boolean
  sanitizedData: T | null
  errors: string[]
  warnings: string[]
}> => {
  try {
    // Step 1: Rate limiting check
    const rateLimitResult = await rateLimitService.checkRateLimit(userId, operation)
    if (!rateLimitResult.allowed) {
      await securityMonitoringService.logRateLimitExceeded(userId, operation, {
        retryAfter: rateLimitResult.retryAfter
      })
      
      return {
        isValid: false,
        sanitizedData: null,
        errors: [`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`],
        warnings: []
      }
    }

    // Step 2: Validation and sanitization
    let validationResult
    switch (validationType) {
      case 'emergencyAlert':
        validationResult = validationService.validateEmergencyAlert(data)
        break
      case 'userProfile':
        validationResult = validationService.validateUserProfile(data)
        break
      case 'safeZone':
        validationResult = validationService.validateSafeZone(data)
        break
      case 'chatMessage':
        validationResult = validationService.validateChatMessage(data)
        break
      case 'contact':
        validationResult = validationService.validateContact(data)
        break
      case 'friendRequest':
        validationResult = validationService.validateFriendRequest(data)
        break
      default:
        throw new Error(`Unsupported validation type: ${validationType}`)
    }

    // Step 3: Log validation results
    if (!validationResult.isValid) {
      await securityMonitoringService.logInputValidationFailure(userId, JSON.stringify(data), {
        validationType,
        errors: validationResult.errors
      })
    }

    return {
      isValid: validationResult.isValid,
      sanitizedData: validationResult.isValid ? validationResult.sanitizedData as T : null,
      errors: Object.values(validationResult.errors).flat(),
      warnings: Object.values(validationResult.warnings).flat()
    }

  } catch (error) {
    await securityMonitoringService.logSecurityEvent({
      type: 'system_error',
      severity: 'medium',
      userId,
      details: {
        operation: 'secureDataPipeline',
        validationType,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return {
      isValid: false,
      sanitizedData: null,
      errors: ['Security processing failed'],
      warnings: []
    }
  }
}

/**
 * Secure string processing with context awareness
 */
export const secureStringProcessing = (
  input: string,
  context: 'alert_message' | 'chat_message' | 'user_profile' | 'general',
  options: {
    maxLength?: number
    allowHtml?: boolean
    trimWhitespace?: boolean
  } = {}
) => {
  const contextDefaults = {
    alert_message: { maxLength: 500, allowHtml: false },
    chat_message: { maxLength: 1000, allowHtml: false },
    user_profile: { maxLength: 200, allowHtml: false },
    general: { maxLength: 1000, allowHtml: false }
  }

  const config = { ...contextDefaults[context], ...options }
  
  return inputSanitizationService.sanitizeString(input, config)
}

/**
 * Coordinate validation and sanitization
 */
export const secureCoordinateProcessing = (lat: number, lng: number) => {
  return inputSanitizationService.sanitizeCoordinates(lat, lng)
}

/**
 * Email validation and sanitization
 */
export const secureEmailProcessing = (email: string) => {
  return inputSanitizationService.sanitizeEmail(email)
}

/**
 * URL validation and sanitization
 */
export const secureUrlProcessing = (url: string) => {
  return inputSanitizationService.sanitizeUrl(url)
}

/**
 * File name validation and sanitization
 */
export const secureFileNameProcessing = (fileName: string) => {
  return inputSanitizationService.sanitizeFileName(fileName)
}

/**
 * Bulk socket message validation
 */
export const secureSocketMessageProcessing = (message: Record<string, any>) => {
  return inputSanitizationService.sanitizeSocketMessage(message)
}

/**
 * Security-aware error handling
 */
export const secureErrorHandler = async (
  error: Error,
  context: string,
  userId?: string,
  additionalDetails: Record<string, any> = {}
) => {
  // Determine if error contains sensitive information
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /api[_-]?key/i,
    /auth/i
  ]

  const containsSensitiveInfo = sensitivePatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.stack || '')
  )

  const logDetails = {
    context,
    errorType: error.constructor.name,
    containsSensitiveInfo,
    stack: containsSensitiveInfo ? '[REDACTED]' : error.stack,
    ...additionalDetails
  }

  if (userId) {
    await securityMonitoringService.logSecurityEvent({
      type: 'system_error',
      severity: containsSensitiveInfo ? 'high' : 'medium',
      userId,
      details: logDetails
    })
  }

  // Return sanitized error message
  return {
    message: containsSensitiveInfo ? 'An error occurred. Please try again.' : error.message,
    code: error.name,
    containsSensitiveInfo
  }
}

/**
 * Generate secure random tokens
 */
export const generateSecureToken = (length = 32): string => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Simple encryption/decryption for local storage (not cryptographically secure)
 */
export const simpleEncrypt = (text: string, key: string): string => {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i)
    const keyChar = key.charCodeAt(i % key.length)
    result += String.fromCharCode(textChar ^ keyChar)
  }
  return btoa(result)
}

export const simpleDecrypt = (encryptedText: string, key: string): string => {
  try {
    const text = atob(encryptedText)
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i)
      const keyChar = key.charCodeAt(i % key.length)
      result += String.fromCharCode(textChar ^ keyChar)
    }
    return result
  } catch {
    return ''
  }
}

/**
 * Secure local storage with encryption
 */
export const secureLocalStorage = {
  setItem: (key: string, value: string, encrypt = true): void => {
    try {
      const storageKey = `secure_${key}`
      const storageValue = encrypt ? simpleEncrypt(value, key) : value
      localStorage.setItem(storageKey, storageValue)
    } catch (error) {
      console.error('Failed to set secure local storage:', error)
    }
  },

  getItem: (key: string, decrypt = true): string | null => {
    try {
      const storageKey = `secure_${key}`
      const storageValue = localStorage.getItem(storageKey)
      if (!storageValue) return null
      return decrypt ? simpleDecrypt(storageValue, key) : storageValue
    } catch (error) {
      console.error('Failed to get secure local storage:', error)
      return null
    }
  },

  removeItem: (key: string): void => {
    try {
      const storageKey = `secure_${key}`
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to remove secure local storage:', error)
    }
  },

  clear: (): void => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('secure_'))
      keys.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('Failed to clear secure local storage:', error)
    }
  }
}

/**
 * Device fingerprinting for security
 */
export const getDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('Security check', 2, 2)
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|')

  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16)
}

/**
 * Check for suspicious user behavior
 */
export const detectSuspiciousBehavior = (
  userActions: Array<{
    type: string
    timestamp: number
    details?: any
  }>
): {
  isSuspicious: boolean
  reasons: string[]
  riskScore: number
} => {
  const reasons: string[] = []
  let riskScore = 0

  if (userActions.length === 0) {
    return { isSuspicious: false, reasons: [], riskScore: 0 }
  }

  const now = Date.now()
  const recent = userActions.filter(action => now - action.timestamp < 60000) // Last minute
  const lastHour = userActions.filter(action => now - action.timestamp < 3600000) // Last hour

  // Too many actions in short time
  if (recent.length > 20) {
    reasons.push('Too many actions in last minute')
    riskScore += 30
  }

  if (lastHour.length > 200) {
    reasons.push('Too many actions in last hour')
    riskScore += 20
  }

  // Repeated failed attempts
  const failedActions = userActions.filter(action => 
    action.type.includes('failed') || action.type.includes('error')
  )
  
  if (failedActions.length > 10) {
    reasons.push('Multiple failed attempts')
    riskScore += 25
  }

  // Unusual time patterns
  const hours = userActions.map(action => new Date(action.timestamp).getHours())
  const nightActivity = hours.filter(hour => hour >= 1 && hour <= 5).length
  
  if (nightActivity > userActions.length * 0.8) {
    reasons.push('Unusual activity hours')
    riskScore += 15
  }

  // Rapid location changes (if location data available)
  const locationActions = userActions.filter(action => action.details?.location)
  if (locationActions.length > 1) {
    // Check for impossible travel speeds
    // This is a simplified check - real implementation would be more sophisticated
    for (let i = 1; i < locationActions.length; i++) {
      const timeDiff = locationActions[i].timestamp - locationActions[i-1].timestamp
      if (timeDiff < 600000) { // Less than 10 minutes between location updates
        reasons.push('Rapid location changes')
        riskScore += 20
        break
      }
    }
  }

  return {
    isSuspicious: riskScore > 50,
    reasons,
    riskScore: Math.min(riskScore, 100)
  }
}

/**
 * IP address validation (client-side approximation)
 */
export const isValidIPAddress = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

/**
 * Check if request is from localhost/development
 */
export const isDevelopmentRequest = (): boolean => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname.startsWith('192.168.') ||
         hostname.endsWith('.local')
}

/**
 * Sanitize object recursively
 */
export const sanitizeObjectRecursive = (
  obj: any, 
  maxDepth = 5, 
  currentDepth = 0
): any => {
  if (currentDepth >= maxDepth) {
    return '[Max depth reached]'
  }

  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    const result = inputSanitizationService.sanitizeString(obj)
    return result.sanitizedValue
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map(item => 
      sanitizeObjectRecursive(item, maxDepth, currentDepth + 1)
    )
  }

  if (typeof obj === 'object') {
    const sanitized: any = {}
    const keys = Object.keys(obj).slice(0, 50) // Limit object keys
    
    for (const key of keys) {
      const sanitizedKey = inputSanitizationService.sanitizeString(key, { maxLength: 50 }).sanitizedValue
      sanitized[sanitizedKey] = sanitizeObjectRecursive(obj[key], maxDepth, currentDepth + 1)
    }
    
    return sanitized
  }

  return '[Unsupported type]'
}

/**
 * Performance monitoring for security operations
 */
export const withSecurityPerformanceMonitoring = async <T>(
  operation: string,
  fn: () => Promise<T>,
  userId?: string
): Promise<T> => {
  const startTime = performance.now()
  
  try {
    const result = await fn()
    const endTime = performance.now()
    const duration = endTime - startTime

    // Log slow operations
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow security operation: ${operation} took ${duration}ms`)
      
      if (userId) {
        await securityMonitoringService.logSecurityEvent({
          type: 'system_error',
          severity: 'low',
          userId,
          details: {
            operation,
            duration,
            type: 'slow_operation'
          }
        })
      }
    }

    return result
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime

    if (userId) {
      await securityMonitoringService.logSecurityEvent({
        type: 'system_error',
        severity: 'medium',
        userId,
        details: {
          operation,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'operation_failure'
        }
      })
    }

    throw error
  }
}