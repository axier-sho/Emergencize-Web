'use client'

import { useEffect, useState } from 'react'
import { User, onAuthStateChanged, getIdToken, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { validationService } from '@/services/ValidationService'

export interface AuthUser extends User {
  token?: string
  tokenExpiry?: number
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  authenticated: boolean
  error: string | null
}

export interface AuthActions {
  refreshToken: () => Promise<void>
  logout: () => Promise<void>
  checkTokenExpiry: () => boolean
  getValidToken: () => Promise<string | null>
}

export const useSecureAuth = (): AuthState & AuthActions => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Token refresh interval (45 minutes - tokens expire after 1 hour)
  const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000
  const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000 // 5 minutes buffer

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setError(null)
        
        if (firebaseUser) {
          // Validate user data
          const userValidation = validationService.validateUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined
          })

          if (!userValidation.isValid) {
            throw new Error('Invalid user data: ' + Object.values(userValidation.errors).flat().join(', '))
          }

          // Get initial token
          const token = await getIdToken(firebaseUser, true)
          const tokenResult = await firebaseUser.getIdTokenResult()
          
          const authUser: AuthUser = {
            ...firebaseUser,
            token,
            tokenExpiry: new Date(tokenResult.expirationTime).getTime()
          }

          setUser(authUser)

          // Set up automatic token refresh
          if (refreshInterval) {
            clearInterval(refreshInterval)
          }

          refreshInterval = setInterval(async () => {
            try {
              await refreshToken()
            } catch (error) {
              console.error('Token refresh failed:', error)
              setError('Session expired. Please log in again.')
              await logout()
            }
          }, TOKEN_REFRESH_INTERVAL)

        } else {
          setUser(null)
          if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setError(error instanceof Error ? error.message : 'Authentication error')
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    // Cleanup on unmount
    return () => {
      unsubscribe()
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  const refreshToken = async (): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user')
    }

    try {
      const token = await getIdToken(auth.currentUser, true)
      const tokenResult = await auth.currentUser.getIdTokenResult()
      
      setUser(prevUser => {
        if (!prevUser) return null
        
        return {
          ...prevUser,
          token,
          tokenExpiry: new Date(tokenResult.expirationTime).getTime()
        }
      })

      console.log('Token refreshed successfully')
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setError(null)
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      setError(error instanceof Error ? error.message : 'Logout failed')
      throw error
    }
  }

  const checkTokenExpiry = (): boolean => {
    if (!user?.tokenExpiry) return false
    
    const now = Date.now()
    const timeUntilExpiry = user.tokenExpiry - now
    
    // Return true if token expires within the buffer time
    return timeUntilExpiry <= TOKEN_EXPIRY_BUFFER
  }

  const getValidToken = async (): Promise<string | null> => {
    if (!user) return null

    // Check if token is about to expire
    if (checkTokenExpiry()) {
      try {
        await refreshToken()
      } catch (error) {
        console.error('Failed to refresh token:', error)
        return null
      }
    }

    return user.token || null
  }

  // Security monitoring
  useEffect(() => {
    if (user) {
      // Log successful authentication for monitoring
      console.log('User authenticated:', {
        uid: user.uid,
        email: user.email,
        timestamp: new Date().toISOString(),
        tokenExpiry: user.tokenExpiry ? new Date(user.tokenExpiry).toISOString() : null
      })

      // Check for suspicious activity
      const lastLogin = localStorage.getItem('lastLogin')
      const currentTime = Date.now()
      
      if (lastLogin) {
        const timeSinceLastLogin = currentTime - parseInt(lastLogin)
        // If more than 24 hours, log for monitoring
        if (timeSinceLastLogin > 24 * 60 * 60 * 1000) {
          console.log('Long time since last login:', {
            uid: user.uid,
            timeSinceLastLogin: Math.floor(timeSinceLastLogin / (1000 * 60 * 60)) + ' hours'
          })
        }
      }
      
      localStorage.setItem('lastLogin', currentTime.toString())
    } else {
      // User logged out or session expired
      localStorage.removeItem('lastLogin')
    }
  }, [user])

  return {
    user,
    loading,
    authenticated: !!user && !loading,
    error,
    refreshToken,
    logout,
    checkTokenExpiry,
    getValidToken
  }
}

// Hook for checking if user has valid authentication
export const useAuthGuard = () => {
  const { user, loading, authenticated, getValidToken } = useSecureAuth()

  const requireAuth = async (): Promise<boolean> => {
    if (loading) return false
    if (!authenticated) return false
    
    const token = await getValidToken()
    return !!token
  }

  const requireAuthOrThrow = async (): Promise<string> => {
    const token = await getValidToken()
    if (!token) {
      throw new Error('Authentication required')
    }
    return token
  }

  return {
    user,
    loading,
    authenticated,
    requireAuth,
    requireAuthOrThrow
  }
}

// Utility function for making authenticated API calls
export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {},
  authUser?: AuthUser | null
): Promise<Response> => {
  // Avoid using React hooks here to prevent invalid hook call errors.
  // Prefer a provided authUser; otherwise fall back to firebase auth currentUser.
  let token: string | null = null

  try {
    if (authUser) {
      token = await getIdToken(authUser, false)
    } else if (auth.currentUser) {
      token = await getIdToken(auth.currentUser, false)
    }
  } catch (e) {
    // ignore; handled below
  }

  if (!token) {
    throw new Error('No valid authentication token')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

// Rate limiting for authentication attempts
const authRateLimit = new Map<string, number[]>()

export const checkAuthRateLimit = (identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean => {
  const now = Date.now()
  const windowStart = now - windowMs
  
  if (!authRateLimit.has(identifier)) {
    authRateLimit.set(identifier, [])
  }
  
  const attempts = authRateLimit.get(identifier)!
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(timestamp => timestamp > windowStart)
  authRateLimit.set(identifier, recentAttempts)
  
  // Check if limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    return false // Rate limited
  }
  
  // Add current attempt
  recentAttempts.push(now)
  return true // Not rate limited
}

// Security event logging
export const logSecurityEvent = (event: {
  type: 'login_success' | 'login_failure' | 'logout' | 'token_refresh' | 'token_expired' | 'suspicious_activity'
  userId?: string
  details?: any
}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: event.type,
    userId: event.userId || 'anonymous',
    details: event.details || {},
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  console.log('SECURITY EVENT:', logEntry)
  
  // In production, you'd want to send this to a security monitoring service
  // For now, we'll store in session storage for debugging
  const existingLogs = JSON.parse(sessionStorage.getItem('securityLogs') || '[]')
  existingLogs.push(logEntry)
  
  // Keep only last 100 logs
  if (existingLogs.length > 100) {
    existingLogs.splice(0, existingLogs.length - 100)
  }
  
  sessionStorage.setItem('securityLogs', JSON.stringify(existingLogs))
}