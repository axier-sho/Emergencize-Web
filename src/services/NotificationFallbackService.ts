import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'
import { rateLimitService } from './RateLimitService'

export interface FallbackNotificationConfig {
  smsEnabled: boolean
  voiceEnabled: boolean
  emailEnabled: boolean
  smsProvider: 'twilio' | 'aws_sns' | 'vonage' | 'custom'
  voiceProvider: 'twilio' | 'aws_polly' | 'custom'
  emailProvider: 'sendgrid' | 'aws_ses' | 'mailgun' | 'custom'
  maxRetries: number
  retryDelayMs: number
  emergencyOverride: boolean
}

export interface NotificationAttempt {
  id: string
  userId: string
  contactId: string
  type: 'sms' | 'voice' | 'email'
  provider: string
  message: string
  phoneNumber?: string
  email?: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'rate_limited'
  errorMessage?: string
  attemptedAt: Date
  deliveredAt?: Date
  cost?: number
  messageId?: string
}

export interface EmergencyAlert {
  id: string
  fromUserId: string
  type: 'help' | 'danger'
  message: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  timestamp: Date
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface ContactNotificationPreferences {
  contactId: string
  smsEnabled: boolean
  voiceEnabled: boolean
  emailEnabled: boolean
  phoneNumber?: string
  email?: string
  preferredMethod: 'push' | 'sms' | 'voice' | 'email'
  emergencyOverride: boolean
  quietHours?: {
    enabled: boolean
    startHour: number
    endHour: number
    timezone: string
  }
}

export class NotificationFallbackService {
  private static instance: NotificationFallbackService
  private config: FallbackNotificationConfig = {
    smsEnabled: true,
    voiceEnabled: true,
    emailEnabled: true,
    smsProvider: 'twilio',
    voiceProvider: 'twilio',
    emailProvider: 'sendgrid',
    maxRetries: 3,
    retryDelayMs: 30000, // 30 seconds
    emergencyOverride: true
  }

  private constructor() {}

  static getInstance(): NotificationFallbackService {
    if (!NotificationFallbackService.instance) {
      NotificationFallbackService.instance = new NotificationFallbackService()
    }
    return NotificationFallbackService.instance
  }

  async sendFallbackNotification(
    alert: EmergencyAlert,
    contactId: string,
    preferences: ContactNotificationPreferences,
    primaryNotificationFailed: boolean = false
  ): Promise<NotificationAttempt[]> {
    try {
      const attempts: NotificationAttempt[] = []

      // Check rate limiting
      const rateLimitResult = await rateLimitService.checkRateLimit(
        alert.fromUserId,
        'fallback_notification'
      )

      if (!rateLimitResult.allowed && !this.shouldOverrideForEmergency(alert)) {
        throw new Error('Rate limit exceeded for fallback notifications')
      }

      // Determine which fallback methods to use
      const fallbackMethods = this.determineFallbackMethods(
        alert,
        preferences,
        primaryNotificationFailed
      )

      // Send notifications via each fallback method
      for (const method of fallbackMethods) {
        try {
          const attempt = await this.sendNotificationViaMethod(
            alert,
            contactId,
            preferences,
            method
          )
          attempts.push(attempt)
        } catch (error) {
          console.error(`Failed to send ${method} notification:`, error)
          
          const failedAttempt: NotificationAttempt = {
            id: crypto.randomUUID(),
            userId: alert.fromUserId,
            contactId,
            type: method,
            provider: this.getProviderForMethod(method),
            message: this.formatAlertMessage(alert, method),
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            attemptedAt: new Date(),
            phoneNumber: method === 'sms' || method === 'voice' ? preferences.phoneNumber : undefined,
            email: method === 'email' ? preferences.email : undefined
          }
          attempts.push(failedAttempt)
        }
      }

      // Log fallback notification attempts
      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'authentication_success',
        severity: alert.urgency === 'critical' ? 'high' : 'medium',
        details: {
          action: 'fallback_notification_sent',
          alertId: alert.id,
          fromUserId: alert.fromUserId,
          contactId,
          methods: fallbackMethods,
          successfulAttempts: attempts.filter(a => a.status === 'sent').length,
          failedAttempts: attempts.filter(a => a.status === 'failed').length,
          emergencyOverride: this.shouldOverrideForEmergency(alert)
        },
        userId: alert.fromUserId
      })

      return attempts
    } catch (error) {
      console.error('Failed to send fallback notifications:', error)
      throw error
    }
  }

  private determineFallbackMethods(
    alert: EmergencyAlert,
    preferences: ContactNotificationPreferences,
    primaryFailed: boolean
  ): Array<'sms' | 'voice' | 'email'> {
    const methods: Array<'sms' | 'voice' | 'email'> = []

    // For critical alerts, use all available methods
    if (alert.urgency === 'critical' && this.config.emergencyOverride) {
      if (preferences.smsEnabled && preferences.phoneNumber) methods.push('sms')
      if (preferences.voiceEnabled && preferences.phoneNumber) methods.push('voice')
      if (preferences.emailEnabled && preferences.email) methods.push('email')
      return methods
    }

    // Check quiet hours
    if (this.isQuietHours(preferences.quietHours) && alert.urgency !== 'critical') {
      // During quiet hours, only use email unless it's critical
      if (preferences.emailEnabled && preferences.email) {
        methods.push('email')
      }
      return methods
    }

    // Normal fallback logic
    if (primaryFailed || alert.urgency === 'high') {
      // Use preferred method first
      switch (preferences.preferredMethod) {
        case 'sms':
          if (preferences.smsEnabled && preferences.phoneNumber) methods.push('sms')
          break
        case 'voice':
          if (preferences.voiceEnabled && preferences.phoneNumber) methods.push('voice')
          break
        case 'email':
          if (preferences.emailEnabled && preferences.email) methods.push('email')
          break
      }

      // Add additional methods for high priority
      if (alert.urgency === 'high') {
        if (preferences.smsEnabled && preferences.phoneNumber && !methods.includes('sms')) {
          methods.push('sms')
        }
        if (preferences.emailEnabled && preferences.email && !methods.includes('email')) {
          methods.push('email')
        }
      }
    }

    return methods
  }

  private async sendNotificationViaMethod(
    alert: EmergencyAlert,
    contactId: string,
    preferences: ContactNotificationPreferences,
    method: 'sms' | 'voice' | 'email'
  ): Promise<NotificationAttempt> {
    const message = this.formatAlertMessage(alert, method)
    const attemptId = crypto.randomUUID()

    const baseAttempt: NotificationAttempt = {
      id: attemptId,
      userId: alert.fromUserId,
      contactId,
      type: method,
      provider: this.getProviderForMethod(method),
      message,
      status: 'pending',
      attemptedAt: new Date(),
      phoneNumber: method === 'sms' || method === 'voice' ? preferences.phoneNumber : undefined,
      email: method === 'email' ? preferences.email : undefined
    }

    try {
      switch (method) {
        case 'sms':
          return await this.sendSMS(baseAttempt, alert)
        case 'voice':
          return await this.sendVoiceCall(baseAttempt, alert)
        case 'email':
          return await this.sendEmail(baseAttempt, alert)
        default:
          throw new Error(`Unsupported notification method: ${method}`)
      }
    } catch (error) {
      return {
        ...baseAttempt,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async sendSMS(attempt: NotificationAttempt, alert: EmergencyAlert): Promise<NotificationAttempt> {
    try {
      // Validate phone number
      if (!attempt.phoneNumber) {
        throw new Error('Phone number is required for SMS')
      }

      const validationResult = this.validatePhoneNumber(attempt.phoneNumber)
      if (!validationResult.isValid) {
        throw new Error(`Invalid phone number: ${validationResult.error}`)
      }

      // In a real implementation, integrate with SMS provider
      const messageId = await this.sendSMSViaProvider(
        attempt.phoneNumber,
        attempt.message,
        this.config.smsProvider
      )

      return {
        ...attempt,
        status: 'sent',
        messageId,
        cost: this.calculateSMSCost(attempt.message)
      }
    } catch (error) {
      throw new Error(`SMS sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async sendVoiceCall(attempt: NotificationAttempt, alert: EmergencyAlert): Promise<NotificationAttempt> {
    try {
      if (!attempt.phoneNumber) {
        throw new Error('Phone number is required for voice call')
      }

      const validationResult = this.validatePhoneNumber(attempt.phoneNumber)
      if (!validationResult.isValid) {
        throw new Error(`Invalid phone number: ${validationResult.error}`)
      }

      // Convert text to speech-friendly format
      const voiceMessage = this.formatMessageForVoice(attempt.message, alert)

      // In a real implementation, integrate with voice provider
      const callId = await this.makeVoiceCallViaProvider(
        attempt.phoneNumber,
        voiceMessage,
        this.config.voiceProvider
      )

      return {
        ...attempt,
        status: 'sent',
        messageId: callId,
        cost: this.calculateVoiceCost(voiceMessage)
      }
    } catch (error) {
      throw new Error(`Voice call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async sendEmail(attempt: NotificationAttempt, alert: EmergencyAlert): Promise<NotificationAttempt> {
    try {
      if (!attempt.email) {
        throw new Error('Email address is required for email notification')
      }

      const validationResult = ValidationService.getInstance().validateUserProfile({ email: attempt.email })
      if (!validationResult.isValid) {
        throw new Error('Invalid email address')
      }

      // Format email content
      const emailContent = this.formatEmailContent(attempt.message, alert)

      // In a real implementation, integrate with email provider
      const messageId = await this.sendEmailViaProvider(
        attempt.email,
        emailContent,
        this.config.emailProvider
      )

      return {
        ...attempt,
        status: 'sent',
        messageId,
        cost: this.calculateEmailCost()
      }
    } catch (error) {
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private formatAlertMessage(alert: EmergencyAlert, method: 'sms' | 'voice' | 'email'): string {
    const urgencyPrefix = alert.urgency === 'critical' ? '🚨 CRITICAL ALERT' : 
                         alert.urgency === 'high' ? '⚠️ HIGH PRIORITY' :
                         alert.urgency === 'medium' ? '🔔 ALERT' : 'ℹ️ NOTIFICATION'

    const typeText = alert.type === 'danger' ? 'DANGER ALERT' : 'HELP REQUEST'
    
    let message = `${urgencyPrefix}: ${typeText}\n\n${alert.message}`

    if (alert.location) {
      const locationText = alert.location.address || 
        `Location: ${alert.location.lat.toFixed(6)}, ${alert.location.lng.toFixed(6)}`
      message += `\n\nLocation: ${locationText}`
    }

    // Add method-specific formatting
    switch (method) {
      case 'sms':
        // SMS character limit considerations
        if (message.length > 140) {
          message = message.substring(0, 137) + '...'
        }
        break
      case 'voice':
        // Voice-friendly formatting handled in formatMessageForVoice
        break
      case 'email':
        // Email can be longer and formatted
        message += `\n\nTime: ${alert.timestamp.toLocaleString()}`
        message += '\n\nThis is an automated emergency notification from Emergencize.'
        break
    }

    return message
  }

  private formatMessageForVoice(message: string, alert: EmergencyAlert): string {
    // Convert to speech-friendly format
    let voiceMessage = message
      .replace(/🚨/g, 'Critical Alert: ')
      .replace(/⚠️/g, 'High Priority Alert: ')
      .replace(/🔔/g, 'Alert: ')
      .replace(/ℹ️/g, 'Notification: ')
      .replace(/\n\n/g, '. ')
      .replace(/\n/g, '. ')

    // Add pauses for better comprehension
    voiceMessage = voiceMessage.replace(/\. /g, '. <break time="0.5s"/> ')

    // Repeat critical messages
    if (alert.urgency === 'critical') {
      voiceMessage = `This is a critical emergency alert. I repeat, this is a critical emergency alert. ${voiceMessage}`
    }

    return voiceMessage
  }

  private formatEmailContent(message: string, alert: EmergencyAlert): { subject: string; body: string; html: string } {
    const subject = `Emergency Alert: ${alert.type === 'danger' ? 'Danger Alert' : 'Help Request'}`
    
    const body = `${message}\n\nTime: ${alert.timestamp.toLocaleString()}\nAlert ID: ${alert.id}\n\nThis is an automated emergency notification from Emergencize.`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${alert.urgency === 'critical' ? '#dc2626' : '#ea580c'}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Emergency Alert</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${alert.type === 'danger' ? 'Danger Alert' : 'Help Request'}</p>
        </div>
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; line-height: 1.5; white-space: pre-line;">${message}</p>
          ${alert.location ? `<p><strong>Location:</strong> ${alert.location.address || `${alert.location.lat}, ${alert.location.lng}`}</p>` : ''}
          <p><strong>Time:</strong> ${alert.timestamp.toLocaleString()}</p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
            This is an automated emergency notification from Emergencize.<br>
            Alert ID: ${alert.id}
          </p>
        </div>
      </div>
    `

    return { subject, body, html }
  }

  private shouldOverrideForEmergency(alert: EmergencyAlert): boolean {
    return this.config.emergencyOverride && 
           (alert.urgency === 'critical' || alert.type === 'danger')
  }

  private isQuietHours(quietHours?: ContactNotificationPreferences['quietHours']): boolean {
    if (!quietHours?.enabled) return false

    try {
      const now = new Date()
      const currentHour = now.getHours()
      
      // Simple hour-based check (could be enhanced with timezone support)
      if (quietHours.startHour <= quietHours.endHour) {
        return currentHour >= quietHours.startHour && currentHour < quietHours.endHour
      } else {
        // Quiet hours span midnight
        return currentHour >= quietHours.startHour || currentHour < quietHours.endHour
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error)
      return false
    }
  }

  private validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/
    if (!e164Regex.test(phoneNumber)) {
      return { isValid: false, error: 'Phone number must be in E.164 format (+1234567890)' }
    }
    return { isValid: true }
  }

  private getProviderForMethod(method: 'sms' | 'voice' | 'email'): string {
    switch (method) {
      case 'sms': return this.config.smsProvider
      case 'voice': return this.config.voiceProvider
      case 'email': return this.config.emailProvider
      default: return 'unknown'
    }
  }

  private calculateSMSCost(message: string): number {
    // SMS cost calculation (example: $0.01 per 160 characters)
    const segments = Math.ceil(message.length / 160)
    return segments * 0.01
  }

  private calculateVoiceCost(message: string): number {
    // Voice cost calculation (example: $0.02 per minute, estimate based on message length)
    const estimatedMinutes = Math.ceil(message.length / 200) // ~200 chars per minute
    return estimatedMinutes * 0.02
  }

  private calculateEmailCost(): number {
    // Email cost calculation (example: $0.0001 per email)
    return 0.0001
  }

  // Provider integration methods (placeholder implementations)
  private async sendSMSViaProvider(phoneNumber: string, message: string, provider: string): Promise<string> {
    // In a real implementation, integrate with SMS providers like Twilio, AWS SNS, etc.
    console.log(`Sending SMS via ${provider} to ${phoneNumber}: ${message}`)
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async makeVoiceCallViaProvider(phoneNumber: string, message: string, provider: string): Promise<string> {
    // In a real implementation, integrate with voice providers
    console.log(`Making voice call via ${provider} to ${phoneNumber}: ${message}`)
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async sendEmailViaProvider(email: string, content: { subject: string; body: string; html: string }, provider: string): Promise<string> {
    // In a real implementation, integrate with email providers
    console.log(`Sending email via ${provider} to ${email}:`, content)
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Configuration methods
  updateConfig(newConfig: Partial<FallbackNotificationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): FallbackNotificationConfig {
    return { ...this.config }
  }

  // Retry failed notifications
  async retryFailedNotification(attempt: NotificationAttempt): Promise<NotificationAttempt> {
    if (attempt.status !== 'failed') {
      throw new Error('Can only retry failed notifications')
    }

    // Check retry limit
    const retryCount = await this.getRetryCount(attempt.id)
    if (retryCount >= this.config.maxRetries) {
      throw new Error('Maximum retry attempts exceeded')
    }

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs))

    // Retry based on method
    const newAttempt: NotificationAttempt = {
      ...attempt,
      id: crypto.randomUUID(),
      status: 'pending',
      attemptedAt: new Date(),
      errorMessage: undefined
    }

    try {
      switch (attempt.type) {
        case 'sms':
          return await this.sendSMS(newAttempt, this.createAlertFromAttempt(attempt))
        case 'voice':
          return await this.sendVoiceCall(newAttempt, this.createAlertFromAttempt(attempt))
        case 'email':
          return await this.sendEmail(newAttempt, this.createAlertFromAttempt(attempt))
        default:
          throw new Error(`Unsupported retry method: ${attempt.type}`)
      }
    } catch (error) {
      return {
        ...newAttempt,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Retry failed'
      }
    }
  }

  private async getRetryCount(originalAttemptId: string): Promise<number> {
    // In a real implementation, query database for retry count
    return 0
  }

  private createAlertFromAttempt(attempt: NotificationAttempt): EmergencyAlert {
    // Create a basic alert object from attempt data
    return {
      id: 'retry_' + attempt.id,
      fromUserId: attempt.userId,
      type: 'help', // Default type for retries
      message: attempt.message,
      timestamp: new Date(),
      urgency: 'medium'
    }
  }
}

export default NotificationFallbackService.getInstance()