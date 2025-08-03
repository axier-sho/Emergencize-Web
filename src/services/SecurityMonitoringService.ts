'use client'

import { doc, addDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type SecurityEventType = 
  | 'authentication_success'
  | 'authentication_failure' 
  | 'authorization_failure'
  | 'rate_limit_exceeded'
  | 'input_validation_failure'
  | 'suspicious_activity'
  | 'data_access_violation'
  | 'session_anomaly'
  | 'security_rule_violation'
  | 'malicious_payload_detected'
  | 'geolocation_anomaly'
  | 'device_change'
  | 'admin_action'
  | 'system_error'
  | 'medical_encryption_initialized'
  | 'medical_data_encrypted'
  | 'medical_data_decrypted'
  | 'medical_data_decryption_failed'
  | 'medical_profile_created'
  | 'medical_profile_updated'
  | 'medical_data_access_denied'
  | 'emergency_medical_access'
  | 'medical_profile_deleted'

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityEvent {
  id?: string
  timestamp: Date
  type: SecurityEventType
  severity: SecuritySeverity
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  url?: string
  details: Record<string, any>
  riskScore: number
  resolved?: boolean
  resolvedBy?: string
  resolvedAt?: Date
  tags?: string[]
}

export interface SecurityAlert {
  id?: string
  timestamp: Date
  type: SecurityEventType
  severity: SecuritySeverity
  userId: string
  title: string
  description: string
  events: string[] // Array of event IDs
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  createdBy: 'system' | 'user'
  riskScore: number
}

export interface SecurityMetrics {
  totalEvents: number
  eventsByType: Record<SecurityEventType, number>
  eventsBySeverity: Record<SecuritySeverity, number>
  averageRiskScore: number
  highRiskUsers: Array<{ userId: string; riskScore: number; eventCount: number }>
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

class SecurityMonitoringService {
  private static instance: SecurityMonitoringService
  private readonly MAX_RISK_SCORE = 100
  
  static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService()
    }
    return SecurityMonitoringService.instance
  }
  private readonly RISK_THRESHOLDS = {
    low: 20,
    medium: 50,
    high: 80
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'riskScore'>): Promise<string> {
    try {
      const enrichedEvent: SecurityEvent = {
        ...event,
        timestamp: new Date(),
        riskScore: this.calculateRiskScore(event.type, event.severity, event.details),
        ipAddress: event.ipAddress || this.getClientIP(),
        userAgent: event.userAgent || navigator.userAgent,
        url: event.url || window.location.href,
        sessionId: event.sessionId || this.getSessionId()
      }

      // Add to Firestore audit log
      const docRef = await addDoc(collection(db, 'auditLog'), {
        ...enrichedEvent,
        timestamp: Timestamp.fromDate(enrichedEvent.timestamp)
      })

      // Check if this event should trigger an alert
      await this.checkForSecurityAlert(enrichedEvent)

      // Store locally for immediate access
      this.storeEventLocally(enrichedEvent)

      console.log('Security event logged:', enrichedEvent)
      
      return docRef.id

    } catch (error) {
      console.error('Failed to log security event:', error)
      
      // Fallback to local storage if Firestore fails
      this.storeEventLocally({
        ...event,
        timestamp: new Date(),
        riskScore: this.calculateRiskScore(event.type, event.severity, event.details)
      })
      
      throw error
    }
  }

  /**
   * Create a security alert
   */
  async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'securityAlerts'), {
        ...alert,
        timestamp: Timestamp.fromDate(new Date())
      })

      console.warn('Security alert created:', alert)
      
      // In production, you'd want to notify administrators
      this.notifyAdministrators(alert)
      
      return docRef.id

    } catch (error) {
      console.error('Failed to create security alert:', error)
      throw error
    }
  }

  /**
   * Get security events for a user
   */
  async getUserSecurityEvents(
    userId: string, 
    limitCount = 50, 
    eventType?: SecurityEventType
  ): Promise<SecurityEvent[]> {
    try {
      let q = query(
        collection(db, 'auditLog'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      if (eventType) {
        q = query(
          collection(db, 'auditLog'),
          where('userId', '==', userId),
          where('type', '==', eventType),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        )
      }

      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as SecurityEvent[]

    } catch (error) {
      console.error('Failed to get user security events:', error)
      return []
    }
  }

  /**
   * Calculate risk score for an event
   */
  private calculateRiskScore(
    type: SecurityEventType, 
    severity: SecuritySeverity, 
    details: Record<string, any>
  ): number {
    let baseScore = 0

    // Base score by severity
    switch (severity) {
      case 'low': baseScore = 10; break
      case 'medium': baseScore = 30; break
      case 'high': baseScore = 60; break
      case 'critical': baseScore = 90; break
    }

    // Adjust by event type
    const typeMultipliers: Record<SecurityEventType, number> = {
      'authentication_failure': 1.2,
      'authorization_failure': 1.5,
      'rate_limit_exceeded': 1.1,
      'input_validation_failure': 1.3,
      'suspicious_activity': 1.8,
      'data_access_violation': 2.0,
      'session_anomaly': 1.4,
      'security_rule_violation': 1.6,
      'malicious_payload_detected': 2.0,
      'geolocation_anomaly': 1.2,
      'device_change': 1.1,
      'admin_action': 0.8,
      'system_error': 0.9,
      'authentication_success': 0.5,
      'medical_encryption_initialized': 0.8,
      'medical_data_encrypted': 0.7,
      'medical_data_decrypted': 1.2,
      'medical_data_decryption_failed': 1.8,
      'medical_profile_created': 0.6,
      'medical_profile_updated': 0.7,
      'medical_data_access_denied': 1.4,
      'emergency_medical_access': 1.0,
      'medical_profile_deleted': 1.1
    }

    baseScore *= typeMultipliers[type] || 1.0

    // Additional risk factors
    if (details.repeatedAttempts && details.repeatedAttempts > 3) {
      baseScore *= 1.3
    }

    if (details.fromUnknownLocation) {
      baseScore *= 1.2
    }

    if (details.suspiciousUserAgent) {
      baseScore *= 1.4
    }

    if (details.multipleFailuresInShortTime) {
      baseScore *= 1.5
    }

    return Math.min(Math.round(baseScore), this.MAX_RISK_SCORE)
  }

  /**
   * Check if an event should trigger a security alert
   */
  private async checkForSecurityAlert(event: SecurityEvent): Promise<void> {
    const alertConditions = [
      // Critical events always create alerts
      event.severity === 'critical',
      
      // High risk score
      event.riskScore >= this.RISK_THRESHOLDS.high,
      
      // Multiple failed auth attempts
      event.type === 'authentication_failure' && 
      event.details.consecutiveFailures >= 5,
      
      // Malicious payload detected
      event.type === 'malicious_payload_detected',
      
      // Data access violations
      event.type === 'data_access_violation',
      
      // Multiple rate limit violations
      event.type === 'rate_limit_exceeded' && 
      event.details.violationCount >= 3
    ]

    if (alertConditions.some(condition => condition)) {
      await this.createSecurityAlert({
        type: event.type,
        severity: event.severity,
        userId: event.userId || 'unknown',
        title: this.generateAlertTitle(event),
        description: this.generateAlertDescription(event),
        events: [event.id!],
        status: 'active',
        createdBy: 'system',
        riskScore: event.riskScore
      })
    }
  }

  /**
   * Generate alert title
   */
  private generateAlertTitle(event: SecurityEvent): string {
    const titles: Record<SecurityEventType, string> = {
      'authentication_failure': 'Multiple Authentication Failures',
      'authorization_failure': 'Authorization Violation',
      'rate_limit_exceeded': 'Rate Limit Abuse',
      'input_validation_failure': 'Input Validation Failure',
      'suspicious_activity': 'Suspicious Activity Detected',
      'data_access_violation': 'Unauthorized Data Access',
      'session_anomaly': 'Session Anomaly',
      'security_rule_violation': 'Security Rule Violation',
      'malicious_payload_detected': 'Malicious Payload Detected',
      'geolocation_anomaly': 'Unusual Location Access',
      'device_change': 'New Device Access',
      'admin_action': 'Administrative Action',
      'system_error': 'System Security Error',
      'authentication_success': 'Authentication Event',
      'medical_encryption_initialized': 'Medical Data Encryption Setup',
      'medical_data_encrypted': 'Medical Data Encrypted',
      'medical_data_decrypted': 'Medical Data Access',
      'medical_data_decryption_failed': 'Medical Data Decryption Failed',
      'medical_profile_created': 'Medical Profile Created',
      'medical_profile_updated': 'Medical Profile Updated',
      'medical_data_access_denied': 'Medical Data Access Denied',
      'emergency_medical_access': 'Emergency Medical Data Access',
      'medical_profile_deleted': 'Medical Profile Deleted'
    }

    return titles[event.type] || 'Security Event'
  }

  /**
   * Generate alert description
   */
  private generateAlertDescription(event: SecurityEvent): string {
    const userId = event.userId || 'Unknown user'
    const timestamp = event.timestamp.toISOString()
    
    return `Security event of type ${event.type} detected for user ${userId} at ${timestamp}. ` +
           `Risk score: ${event.riskScore}. Details: ${JSON.stringify(event.details)}`
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(timeframe = '24h'): Promise<SecurityMetrics> {
    try {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720 // 30d
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)

      const q = query(
        collection(db, 'auditLog'),
        where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('timestamp', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const events = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as SecurityEvent[]

      return this.calculateMetrics(events)

    } catch (error) {
      console.error('Failed to get security metrics:', error)
      return this.getEmptyMetrics()
    }
  }

  /**
   * Calculate metrics from events
   */
  private calculateMetrics(events: SecurityEvent[]): SecurityMetrics {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const week = 7 * day
    const month = 30 * day

    const eventsByType: Record<SecurityEventType, number> = {} as any
    const eventsBySeverity: Record<SecuritySeverity, number> = {} as any
    const userRiskScores: Record<string, { total: number; count: number }> = {}

    let totalRiskScore = 0

    events.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
      
      // Track user risk scores
      if (event.userId) {
        if (!userRiskScores[event.userId]) {
          userRiskScores[event.userId] = { total: 0, count: 0 }
        }
        userRiskScores[event.userId].total += event.riskScore
        userRiskScores[event.userId].count += 1
      }
      
      totalRiskScore += event.riskScore
    })

    // Calculate high risk users
    const highRiskUsers = Object.entries(userRiskScores)
      .map(([userId, scores]) => ({
        userId,
        riskScore: Math.round(scores.total / scores.count),
        eventCount: scores.count
      }))
      .filter(user => user.riskScore >= this.RISK_THRESHOLDS.medium)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)

    // Calculate trends
    const last24h = events.filter(e => now - e.timestamp.getTime() <= day).length
    const last7d = events.filter(e => now - e.timestamp.getTime() <= week).length
    const last30d = events.filter(e => now - e.timestamp.getTime() <= month).length

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      averageRiskScore: events.length > 0 ? Math.round(totalRiskScore / events.length) : 0,
      highRiskUsers,
      trends: { last24h, last7d, last30d }
    }
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): SecurityMetrics {
    return {
      totalEvents: 0,
      eventsByType: {} as any,
      eventsBySeverity: {} as any,
      averageRiskScore: 0,
      highRiskUsers: [],
      trends: { last24h: 0, last7d: 0, last30d: 0 }
    }
  }

  /**
   * Store event locally for offline access
   */
  private storeEventLocally(event: SecurityEvent): void {
    try {
      const events = JSON.parse(localStorage.getItem('securityEvents') || '[]')
      events.unshift(event)
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(100)
      }
      
      localStorage.setItem('securityEvents', JSON.stringify(events))
    } catch (error) {
      console.error('Failed to store event locally:', error)
    }
  }

  /**
   * Get client IP (simplified - would need backend support for accuracy)
   */
  private getClientIP(): string {
    // This is a placeholder - real IP detection requires backend
    return 'client-ip-unknown'
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('securitySessionId')
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('securitySessionId', sessionId)
    }
    return sessionId
  }

  /**
   * Notify administrators (placeholder)
   */
  private notifyAdministrators(alert: Omit<SecurityAlert, 'id' | 'timestamp'>): void {
    // In production, this would send notifications via email, Slack, etc.
    console.warn('ADMIN NOTIFICATION:', alert)
    
    // Store in local storage for demo purposes
    const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]')
    notifications.unshift({
      ...alert,
      timestamp: new Date().toISOString(),
      notified: false
    })
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50)
    }
    
    localStorage.setItem('adminNotifications', JSON.stringify(notifications))
  }

  /**
   * Quick logging functions for common events
   */
  async logAuthSuccess(userId: string, details: Record<string, any> = {}) {
    return this.logSecurityEvent({
      type: 'authentication_success',
      severity: 'low',
      userId,
      details: { loginMethod: 'password', ...details }
    })
  }

  async logAuthFailure(userId: string, reason: string, details: Record<string, any> = {}) {
    return this.logSecurityEvent({
      type: 'authentication_failure',
      severity: 'medium',
      userId,
      details: { reason, ...details }
    })
  }

  async logRateLimitExceeded(userId: string, operation: string, details: Record<string, any> = {}) {
    return this.logSecurityEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      userId,
      details: { operation, ...details }
    })
  }

  async logInputValidationFailure(userId: string, input: string, details: Record<string, any> = {}) {
    return this.logSecurityEvent({
      type: 'input_validation_failure',
      severity: 'high',
      userId,
      details: { invalidInput: input.substring(0, 100), ...details }
    })
  }

  async logSuspiciousActivity(userId: string, activity: string, details: Record<string, any> = {}) {
    return this.logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'high',
      userId,
      details: { activity, ...details }
    })
  }
}

// Export both the class and an instance for flexibility
export { SecurityMonitoringService }
export const securityMonitoringService = new SecurityMonitoringService()

// React hook for security monitoring
export const useSecurityMonitoring = () => {
  const logEvent = (event: Omit<SecurityEvent, 'id' | 'timestamp' | 'riskScore'>) => {
    return securityMonitoringService.logSecurityEvent(event)
  }

  const logAuthSuccess = (userId: string, details?: Record<string, any>) => {
    return securityMonitoringService.logAuthSuccess(userId, details)
  }

  const logAuthFailure = (userId: string, reason: string, details?: Record<string, any>) => {
    return securityMonitoringService.logAuthFailure(userId, reason, details)
  }

  const logRateLimitExceeded = (userId: string, operation: string, details?: Record<string, any>) => {
    return securityMonitoringService.logRateLimitExceeded(userId, operation, details)
  }

  const logInputValidationFailure = (userId: string, input: string, details?: Record<string, any>) => {
    return securityMonitoringService.logInputValidationFailure(userId, input, details)
  }

  const logSuspiciousActivity = (userId: string, activity: string, details?: Record<string, any>) => {
    return securityMonitoringService.logSuspiciousActivity(userId, activity, details)
  }

  return {
    logEvent,
    logAuthSuccess,
    logAuthFailure,
    logRateLimitExceeded,
    logInputValidationFailure,
    logSuspiciousActivity,
    getUserEvents: securityMonitoringService.getUserSecurityEvents.bind(securityMonitoringService),
    getMetrics: securityMonitoringService.getSecurityMetrics.bind(securityMonitoringService)
  }
}