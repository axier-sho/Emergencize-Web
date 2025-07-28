'use client'

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface RateLimitConfig {
  intervalMinutes: number
  maxRequests: number
  blockDurationMinutes?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitData {
  count: number
  windowStart: number
  lastRequest: number
  blocked?: boolean
  blockExpiry?: number
}

class RateLimitService {
  private readonly defaultConfigs: Record<string, RateLimitConfig> = {
    // Firebase operations
    'firestore_write': { intervalMinutes: 1, maxRequests: 10 },
    'firestore_read': { intervalMinutes: 1, maxRequests: 50 },
    'alert_creation': { intervalMinutes: 1, maxRequests: 5, blockDurationMinutes: 5 },
    'friend_request': { intervalMinutes: 60, maxRequests: 10, blockDurationMinutes: 30 },
    'profile_update': { intervalMinutes: 5, maxRequests: 3 },
    'contact_add': { intervalMinutes: 10, maxRequests: 20 },
    'chat_message': { intervalMinutes: 1, maxRequests: 60 },
    'location_update': { intervalMinutes: 1, maxRequests: 10 },
    'presence_update': { intervalMinutes: 1, maxRequests: 30 },
    
    // Authentication operations
    'login_attempt': { intervalMinutes: 15, maxRequests: 5, blockDurationMinutes: 15 },
    'password_reset': { intervalMinutes: 60, maxRequests: 3, blockDurationMinutes: 60 },
    
    // API operations
    'api_general': { intervalMinutes: 1, maxRequests: 100 },
    'search_operations': { intervalMinutes: 1, maxRequests: 20 },
    
    // Security-sensitive operations
    'admin_action': { intervalMinutes: 1, maxRequests: 5 },
    'bulk_operation': { intervalMinutes: 5, maxRequests: 3 }
  }

  /**
   * Check if an operation is rate limited for a user
   */
  async checkRateLimit(
    userId: string, 
    operation: string, 
    customConfig?: RateLimitConfig
  ): Promise<RateLimitResult> {
    const config = customConfig || this.defaultConfigs[operation]
    
    if (!config) {
      throw new Error(`No rate limit configuration found for operation: ${operation}`)
    }

    const rateLimitKey = `${userId}_${operation}`
    const now = Date.now()
    const windowMs = config.intervalMinutes * 60 * 1000
    const windowStart = now - windowMs

    try {
      // Get current rate limit data from Firestore
      const rateLimitRef = doc(db, 'rateLimits', rateLimitKey)
      const rateLimitDoc = await getDoc(rateLimitRef)
      
      let rateLimitData: RateLimitData = {
        count: 0,
        windowStart: now,
        lastRequest: now
      }

      if (rateLimitDoc.exists()) {
        rateLimitData = rateLimitDoc.data() as RateLimitData
      }

      // Check if user is currently blocked
      if (rateLimitData.blocked && rateLimitData.blockExpiry && now < rateLimitData.blockExpiry) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: rateLimitData.blockExpiry,
          retryAfter: Math.ceil((rateLimitData.blockExpiry - now) / 1000)
        }
      }

      // Reset window if it's expired
      if (rateLimitData.windowStart < windowStart) {
        rateLimitData = {
          count: 0,
          windowStart: now,
          lastRequest: now,
          blocked: false
        }
      }

      // Check if rate limit exceeded
      if (rateLimitData.count >= config.maxRequests) {
        // Block user if configured
        if (config.blockDurationMinutes) {
          const blockExpiry = now + (config.blockDurationMinutes * 60 * 1000)
          rateLimitData.blocked = true
          rateLimitData.blockExpiry = blockExpiry
          
          await setDoc(rateLimitRef, rateLimitData)
          
          // Log security event
          this.logRateLimitViolation(userId, operation, rateLimitData.count)
          
          return {
            allowed: false,
            remaining: 0,
            resetTime: blockExpiry,
            retryAfter: Math.ceil((blockExpiry - now) / 1000)
          }
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime: rateLimitData.windowStart + windowMs,
          retryAfter: Math.ceil((rateLimitData.windowStart + windowMs - now) / 1000)
        }
      }

      // Operation is allowed - increment counter
      rateLimitData.count += 1
      rateLimitData.lastRequest = now

      // Save updated rate limit data
      await setDoc(rateLimitRef, rateLimitData)

      return {
        allowed: true,
        remaining: config.maxRequests - rateLimitData.count,
        resetTime: rateLimitData.windowStart + windowMs
      }

    } catch (error) {
      console.error('Rate limit check failed:', error)
      
      // In case of error, allow the operation but log the issue
      this.logRateLimitError(userId, operation, error)
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + windowMs
      }
    }
  }

  /**
   * Decorator for rate limiting Firebase operations
   */
  withRateLimit<T extends any[], R>(
    operation: string,
    config?: RateLimitConfig
  ) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value

      descriptor.value = async function(userId: string, ...args: T): Promise<R> {
        const rateLimitService = new RateLimitService()
        const result = await rateLimitService.checkRateLimit(userId, operation, config)
        
        if (!result.allowed) {
          throw new Error(`Rate limit exceeded for ${operation}. Try again in ${result.retryAfter} seconds.`)
        }

        return originalMethod.apply(this, [userId, ...args])
      }

      return descriptor
    }
  }

  /**
   * Reset rate limit for a user and operation (admin function)
   */
  async resetRateLimit(userId: string, operation: string): Promise<void> {
    const rateLimitKey = `${userId}_${operation}`
    const rateLimitRef = doc(db, 'rateLimits', rateLimitKey)
    
    try {
      await setDoc(rateLimitRef, {
        count: 0,
        windowStart: Date.now(),
        lastRequest: Date.now(),
        blocked: false
      })
      
      console.log(`Rate limit reset for user ${userId}, operation ${operation}`)
    } catch (error) {
      console.error('Failed to reset rate limit:', error)
      throw error
    }
  }

  /**
   * Get current rate limit status for a user and operation
   */
  async getRateLimitStatus(userId: string, operation: string): Promise<{
    config: RateLimitConfig
    current: RateLimitData | null
    status: RateLimitResult
  }> {
    const config = this.defaultConfigs[operation]
    if (!config) {
      throw new Error(`No rate limit configuration found for operation: ${operation}`)
    }

    const rateLimitKey = `${userId}_${operation}`
    const rateLimitRef = doc(db, 'rateLimits', rateLimitKey)
    
    try {
      const rateLimitDoc = await getDoc(rateLimitRef)
      const current = rateLimitDoc.exists() ? rateLimitDoc.data() as RateLimitData : null
      
      // Get status without incrementing counter
      const status = await this.checkRateLimitStatus(userId, operation, config)
      
      return { config, current, status }
    } catch (error) {
      console.error('Failed to get rate limit status:', error)
      throw error
    }
  }

  /**
   * Check rate limit status without incrementing counter
   */
  private async checkRateLimitStatus(
    userId: string, 
    operation: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const rateLimitKey = `${userId}_${operation}`
    const now = Date.now()
    const windowMs = config.intervalMinutes * 60 * 1000

    try {
      const rateLimitRef = doc(db, 'rateLimits', rateLimitKey)
      const rateLimitDoc = await getDoc(rateLimitRef)
      
      if (!rateLimitDoc.exists()) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetTime: now + windowMs
        }
      }

      const rateLimitData = rateLimitDoc.data() as RateLimitData
      const windowStart = now - windowMs

      // Check if blocked
      if (rateLimitData.blocked && rateLimitData.blockExpiry && now < rateLimitData.blockExpiry) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: rateLimitData.blockExpiry,
          retryAfter: Math.ceil((rateLimitData.blockExpiry - now) / 1000)
        }
      }

      // Check if window expired
      if (rateLimitData.windowStart < windowStart) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetTime: now + windowMs
        }
      }

      // Check current usage
      const remaining = Math.max(0, config.maxRequests - rateLimitData.count)
      const allowed = remaining > 0

      return {
        allowed,
        remaining,
        resetTime: rateLimitData.windowStart + windowMs,
        retryAfter: allowed ? undefined : Math.ceil((rateLimitData.windowStart + windowMs - now) / 1000)
      }

    } catch (error) {
      console.error('Rate limit status check failed:', error)
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + windowMs
      }
    }
  }

  /**
   * Bulk check rate limits for multiple operations
   */
  async bulkCheckRateLimit(
    userId: string, 
    operations: string[]
  ): Promise<Record<string, RateLimitResult>> {
    const results: Record<string, RateLimitResult> = {}
    
    await Promise.all(
      operations.map(async (operation) => {
        try {
          results[operation] = await this.checkRateLimitStatus(userId, operation, this.defaultConfigs[operation])
        } catch (error) {
          console.error(`Failed to check rate limit for ${operation}:`, error)
          // Provide default result on error
          results[operation] = {
            allowed: true,
            remaining: this.defaultConfigs[operation]?.maxRequests || 10,
            resetTime: Date.now() + (this.defaultConfigs[operation]?.intervalMinutes || 1) * 60 * 1000
          }
        }
      })
    )

    return results
  }

  /**
   * Log rate limit violations for security monitoring
   */
  private logRateLimitViolation(userId: string, operation: string, attemptCount: number): void {
    const violation = {
      timestamp: new Date().toISOString(),
      userId,
      operation,
      attemptCount,
      type: 'rate_limit_violation',
      severity: attemptCount > 20 ? 'high' : attemptCount > 10 ? 'medium' : 'low'
    }

    console.warn('RATE LIMIT VIOLATION:', violation)

    // Store in session storage for debugging
    const violations = JSON.parse(sessionStorage.getItem('rateLimitViolations') || '[]')
    violations.push(violation)
    
    // Keep only last 50 violations
    if (violations.length > 50) {
      violations.splice(0, violations.length - 50)
    }
    
    sessionStorage.setItem('rateLimitViolations', JSON.stringify(violations))
  }

  /**
   * Log rate limit service errors
   */
  private logRateLimitError(userId: string, operation: string, error: any): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      userId,
      operation,
      error: error.message || 'Unknown error',
      type: 'rate_limit_error'
    }

    console.error('RATE LIMIT ERROR:', errorLog)
  }

  /**
   * Clean up old rate limit data (should be run periodically)
   */
  async cleanupOldRateLimitData(olderThanHours = 24): Promise<void> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
    
    console.log(`Cleaning up rate limit data older than ${olderThanHours} hours`)
    
    // Note: In a real implementation, you'd want to use Firebase Cloud Functions
    // to run this cleanup periodically, as this would be expensive to run from client
    
    // For now, we'll just log the intention
    console.log('Rate limit cleanup would remove data older than:', new Date(cutoffTime))
  }
}

export const rateLimitService = new RateLimitService()

// Utility hook for React components
export const useRateLimit = (userId: string | undefined) => {
  const checkRateLimit = async (operation: string, config?: RateLimitConfig): Promise<RateLimitResult> => {
    if (!userId) {
      throw new Error('User ID required for rate limiting')
    }
    
    return rateLimitService.checkRateLimit(userId, operation, config)
  }

  const getRateLimitStatus = async (operation: string) => {
    if (!userId) {
      throw new Error('User ID required for rate limiting')
    }
    
    return rateLimitService.getRateLimitStatus(userId, operation)
  }

  return {
    checkRateLimit,
    getRateLimitStatus,
    resetRateLimit: (operation: string) => userId ? rateLimitService.resetRateLimit(userId, operation) : Promise.reject('No user ID'),
    bulkCheckRateLimit: (operations: string[]) => userId ? rateLimitService.bulkCheckRateLimit(userId, operations) : Promise.reject('No user ID')
  }
}