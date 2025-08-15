import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'
import { rateLimitService } from './RateLimitService'
import { geofencingService } from './GeofencingService'

export interface CheckInSchedule {
  id: string
  name: string
  userId: string
  type: 'regular' | 'travel' | 'work' | 'activity' | 'medical' | 'custom'
  frequency: 'hourly' | 'daily' | 'weekly' | 'custom'
  customInterval?: number // minutes for custom frequency
  
  // Schedule configuration
  schedule: {
    startTime: string // HH:mm
    endTime: string   // HH:mm
    timezone: string
    activeDays: number[] // 0-6, Sunday = 0
  }
  
  // Check-in requirements
  requirements: {
    locationRequired: boolean
    photoRequired: boolean
    messageRequired: boolean
    vitalsRequired: boolean
    safeWordRequired: boolean
  }
  
  // Emergency escalation
  escalation: {
    missedCheckInTimeoutMinutes: number
    escalationLevels: EscalationLevel[]
    emergencyContacts: string[] // Contact IDs
    autoAlertEnabled: boolean
  }
  
  // Advanced settings
  settings: {
    gracePeriodMinutes: number
    reminderMinutes: number[]
    quietHours: {
      enabled: boolean
      startTime: string
      endTime: string
    }
    locationTolerance: number // meters
    allowLateCheckIn: boolean
    maxLateMinutes: number
  }
  
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EscalationLevel {
  level: number
  delayMinutes: number
  actions: EscalationAction[]
  contacts: string[] // Contact IDs for this level
}

export interface EscalationAction {
  type: 'sms' | 'call' | 'email' | 'push_notification' | 'emergency_services' | 'location_sharing'
  enabled: boolean
  message?: string
  priority: 'normal' | 'urgent' | 'emergency'
}

export interface CheckIn {
  id: string
  scheduleId: string
  userId: string
  status: 'pending' | 'completed' | 'missed' | 'late' | 'escalated'
  scheduledTime: string
  actualTime?: string
  
  // Check-in data
  data: {
    location?: {
      lat: number
      lng: number
      accuracy: number
      address?: string
    }
    photo?: {
      url: string
      thumbnail: string
      timestamp: string
    }
    message?: string
    vitals?: {
      heartRate?: number
      temperature?: number
      oxygenSaturation?: number
      mood?: 'excellent' | 'good' | 'okay' | 'poor' | 'terrible'
    }
    safeWord?: string
    customData?: Record<string, any>
  }
  
  // Response information
  response: {
    method: 'app' | 'sms' | 'call' | 'voice' | 'wearable' | 'manual'
    deviceInfo?: string
    ipAddress?: string
    userAgent?: string
  }
  
  // Verification
  verification: {
    isVerified: boolean
    verificationMethod?: 'biometric' | 'passcode' | 'safe_word' | 'location' | 'manual'
    verificationScore: number // 0-1 confidence score
    anomalies: string[] // Any detected anomalies
  }
  
  createdAt: string
  completedAt?: string
}

export interface CheckInReminder {
  id: string
  scheduleId: string
  checkInId: string
  userId: string
  type: 'upcoming' | 'overdue' | 'escalation'
  scheduledFor: string
  sent: boolean
  sentAt?: string
  method: 'push' | 'sms' | 'email' | 'call'
  message: string
}

export interface EscalationEvent {
  id: string
  checkInId: string
  scheduleId: string
  userId: string
  level: number
  status: 'active' | 'resolved' | 'cancelled'
  triggeredAt: string
  resolvedAt?: string
  
  // Actions taken
  actionsTaken: {
    type: EscalationAction['type']
    timestamp: string
    success: boolean
    response?: string
    error?: string
  }[]
  
  // Resolution
  resolution?: {
    method: 'check_in_received' | 'manual_cancel' | 'false_alarm' | 'emergency_confirmed'
    resolvedBy: string // User ID or 'system'
    notes?: string
  }
}

export interface SafetyCheckInStats {
  totalSchedules: number
  activeSchedules: number
  completedCheckIns: number
  missedCheckIns: number
  lateCheckIns: number
  escalationEvents: number
  responseRate: number // Percentage
  averageResponseTime: number // Minutes
  lastCheckIn?: string
  nextCheckIn?: string
}

export class SafetyCheckInService {
  private static instance: SafetyCheckInService
  private schedules: Map<string, CheckInSchedule> = new Map()
  private checkIns: Map<string, CheckIn> = new Map()
  private reminders: Map<string, CheckInReminder> = new Map()
  private escalations: Map<string, EscalationEvent> = new Map()
  private reminderTimers: Map<string, NodeJS.Timeout> = new Map()
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map()
  private eventCallbacks: Map<string, Function[]> = new Map()
  private isMonitoring = false

  private constructor() {
    this.loadData()
    this.initializeScheduleMonitoring()
  }

  static getInstance(): SafetyCheckInService {
    if (!SafetyCheckInService.instance) {
      SafetyCheckInService.instance = new SafetyCheckInService()
    }
    return SafetyCheckInService.instance
  }

  private loadData(): void {
    try {
      // Load schedules
      const savedSchedules = localStorage.getItem('emergencize-checkin-schedules')
      if (savedSchedules) {
        const schedulesArray: CheckInSchedule[] = JSON.parse(savedSchedules)
        schedulesArray.forEach(schedule => {
          this.schedules.set(schedule.id, schedule)
        })
      }

      // Load check-ins
      const savedCheckIns = localStorage.getItem('emergencize-checkins')
      if (savedCheckIns) {
        const checkInsArray: CheckIn[] = JSON.parse(savedCheckIns)
        checkInsArray.forEach(checkIn => {
          this.checkIns.set(checkIn.id, checkIn)
        })
      }

      // Load escalations
      const savedEscalations = localStorage.getItem('emergencize-escalations')
      if (savedEscalations) {
        const escalationsArray: EscalationEvent[] = JSON.parse(savedEscalations)
        escalationsArray.forEach(escalation => {
          this.escalations.set(escalation.id, escalation)
        })
      }
    } catch (error) {
      console.error('Error loading safety check-in data:', error)
    }
  }

  private saveData(): void {
    try {
      // Save schedules
      const schedulesArray = Array.from(this.schedules.values())
      localStorage.setItem('emergencize-checkin-schedules', JSON.stringify(schedulesArray))

      // Save check-ins (keep only last 1000)
      const checkInsArray = Array.from(this.checkIns.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 1000)
      localStorage.setItem('emergencize-checkins', JSON.stringify(checkInsArray))

      // Save escalations (keep only last 100)
      const escalationsArray = Array.from(this.escalations.values())
        .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
        .slice(0, 100)
      localStorage.setItem('emergencize-escalations', JSON.stringify(escalationsArray))
    } catch (error) {
      console.error('Error saving safety check-in data:', error)
    }
  }

  private initializeScheduleMonitoring(): void {
    // Check for pending check-ins every minute
    setInterval(() => {
      if (this.isMonitoring) {
        this.checkScheduledCheckIns()
        this.processOverdueCheckIns()
      }
    }, 60000) // 1 minute

    console.log('Safety check-in monitoring initialized')
  }

  async startMonitoring(): Promise<boolean> {
    try {
      if (this.isMonitoring) {
        console.warn('Safety check-in monitoring already active')
        return true
      }

      this.isMonitoring = true
      
      // Schedule all active check-ins
      this.schedules.forEach(schedule => {
        if (schedule.isActive) {
          this.scheduleNextCheckIn(schedule)
        }
      })

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'safety_checkin_monitoring_started',
        severity: 'low',
        details: {
          activeSchedules: Array.from(this.schedules.values()).filter(s => s.isActive).length,
          totalSchedules: this.schedules.size
        },
        userId: 'system',
        timestamp: new Date(),
        riskScore: 5
      })

      console.log('Safety check-in monitoring started')
      this.emit('monitoringStarted', {})
      
      return true
    } catch (error) {
      console.error('Failed to start safety check-in monitoring:', error)
      return false
    }
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    // Clear all timers
    this.reminderTimers.forEach(timer => clearTimeout(timer))
    this.escalationTimers.forEach(timer => clearTimeout(timer))
    this.reminderTimers.clear()
    this.escalationTimers.clear()

    console.log('Safety check-in monitoring stopped')
    this.emit('monitoringStopped', {})
  }

  async createSchedule(config: {
    name: string
    userId: string
    type: CheckInSchedule['type']
    frequency: CheckInSchedule['frequency']
    customInterval?: number
    schedule: CheckInSchedule['schedule']
    requirements: CheckInSchedule['requirements']
    escalation: CheckInSchedule['escalation']
    settings?: Partial<CheckInSchedule['settings']>
  }): Promise<CheckInSchedule | null> {
    try {
      // Check rate limiting
      const canCreate = await RateLimitService.getInstance().checkRateLimit(
        config.userId,
        'checkin_schedule_creation',
        10, // 10 schedules per day
        24 * 60 * 60 * 1000
      )

      if (!canCreate) {
        throw new Error('Rate limit exceeded for schedule creation')
      }

      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      const defaultSettings: CheckInSchedule['settings'] = {
        gracePeriodMinutes: 15,
        reminderMinutes: [15, 5],
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '07:00'
        },
        locationTolerance: 100,
        allowLateCheckIn: true,
        maxLateMinutes: 60
      }

      const schedule: CheckInSchedule = {
        id: scheduleId,
        name: config.name,
        userId: config.userId,
        type: config.type,
        frequency: config.frequency,
        customInterval: config.customInterval,
        schedule: config.schedule,
        requirements: config.requirements,
        escalation: config.escalation,
        settings: { ...defaultSettings, ...config.settings },
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      // Validate schedule
      const validation = this.validateSchedule(schedule)
      if (!validation.isValid) {
        throw new Error(`Schedule validation failed: ${validation.errors.join(', ')}`)
      }

      this.schedules.set(scheduleId, schedule)
      this.saveData()

      // Schedule the first check-in if monitoring is active
      if (this.isMonitoring) {
        this.scheduleNextCheckIn(schedule)
      }

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'safety_checkin_schedule_created',
        severity: 'medium',
        details: {
          scheduleId,
          scheduleName: schedule.name,
          scheduleType: schedule.type,
          frequency: schedule.frequency,
          escalationLevels: schedule.escalation.escalationLevels.length
        },
        userId: config.userId,
        timestamp: new Date(),
        riskScore: 15
      })

      console.log('Safety check-in schedule created:', schedule.name)
      this.emit('scheduleCreated', schedule)
      
      return schedule
    } catch (error) {
      console.error('Failed to create check-in schedule:', error)
      return null
    }
  }

  async performCheckIn(checkInId: string, data: {
    location?: CheckIn['data']['location']
    photo?: CheckIn['data']['photo']
    message?: string
    vitals?: CheckIn['data']['vitals']
    safeWord?: string
    customData?: Record<string, any>
    method: CheckIn['response']['method']
    deviceInfo?: string
  }): Promise<boolean> {
    try {
      const checkIn = this.checkIns.get(checkInId)
      if (!checkIn) {
        throw new Error('Check-in not found')
      }

      if (checkIn.status !== 'pending') {
        throw new Error('Check-in already completed or expired')
      }

      const schedule = this.schedules.get(checkIn.scheduleId)
      if (!schedule) {
        throw new Error('Schedule not found')
      }

      // Validate check-in data against requirements
      const validation = this.validateCheckInData(schedule, data)
      if (!validation.isValid) {
        throw new Error(`Check-in validation failed: ${validation.errors.join(', ')}`)
      }

      const now = new Date()
      const scheduledTime = new Date(checkIn.scheduledTime)
      const isLate = now > scheduledTime

      // Update check-in
      checkIn.status = isLate ? 'late' : 'completed'
      checkIn.actualTime = now.toISOString()
      checkIn.data = { ...checkIn.data, ...data }
      checkIn.response = {
        method: data.method,
        deviceInfo: data.deviceInfo,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      }
      
      // Perform verification
      checkIn.verification = await this.verifyCheckIn(checkIn, schedule, data)
      checkIn.completedAt = now.toISOString()

      this.checkIns.set(checkInId, checkIn)
      this.saveData()

      // Cancel any pending escalations
      this.cancelEscalation(checkInId)

      // Clear reminders
      this.clearReminders(checkInId)

      // Schedule next check-in
      this.scheduleNextCheckIn(schedule)

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'safety_checkin_completed',
        severity: checkIn.verification.isVerified ? 'low' : 'medium',
        details: {
          checkInId,
          scheduleId: schedule.id,
          status: checkIn.status,
          isLate: isLate,
          verificationScore: checkIn.verification.verificationScore,
          anomalies: checkIn.verification.anomalies,
          method: data.method
        },
        userId: checkIn.userId,
        timestamp: new Date(),
        riskScore: checkIn.verification.isVerified ? 5 : 25
      })

      console.log('Safety check-in completed:', checkInId)
      this.emit('checkInCompleted', checkIn)
      
      return true
    } catch (error) {
      console.error('Failed to perform check-in:', error)
      return false
    }
  }

  private async verifyCheckIn(
    checkIn: CheckIn, 
    schedule: CheckInSchedule, 
    data: any
  ): Promise<CheckIn['verification']> {
    let verificationScore = 0.5
    const anomalies: string[] = []
    let isVerified = false
    let verificationMethod: CheckIn['verification']['verificationMethod'] = 'manual'

    // Location verification
    if (data.location && schedule.requirements.locationRequired) {
      const expectedLocation = await this.getExpectedLocation(schedule.userId)
      if (expectedLocation) {
        const distance = this.calculateDistance(data.location, expectedLocation)
        if (distance <= schedule.settings.locationTolerance) {
          verificationScore += 0.3
          verificationMethod = 'location'
        } else {
          anomalies.push(`Location ${distance}m from expected (tolerance: ${schedule.settings.locationTolerance}m)`)
        }
      }
    }

    // Safe word verification
    if (data.safeWord && schedule.requirements.safeWordRequired) {
      const expectedSafeWord = await this.getExpectedSafeWord(schedule.userId)
      if (expectedSafeWord && data.safeWord.toLowerCase() === expectedSafeWord.toLowerCase()) {
        verificationScore += 0.4
        verificationMethod = 'safe_word'
      } else {
        anomalies.push('Safe word mismatch')
      }
    }

    // Timing verification
    const timingScore = this.calculateTimingScore(checkIn.scheduledTime, checkIn.actualTime!)
    verificationScore += timingScore * 0.2

    // Response method verification
    if (data.method === 'app' || data.method === 'wearable') {
      verificationScore += 0.1
    }

    isVerified = verificationScore >= 0.7 && anomalies.length === 0

    return {
      isVerified,
      verificationMethod,
      verificationScore: Math.min(verificationScore, 1.0),
      anomalies
    }
  }

  private scheduleNextCheckIn(schedule: CheckInSchedule): void {
    if (!schedule.isActive) return

    const nextCheckInTime = this.calculateNextCheckInTime(schedule)
    if (!nextCheckInTime) return

    const checkInId = `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const checkIn: CheckIn = {
      id: checkInId,
      scheduleId: schedule.id,
      userId: schedule.userId,
      status: 'pending',
      scheduledTime: nextCheckInTime.toISOString(),
      data: {},
      response: { method: 'app' },
      verification: {
        isVerified: false,
        verificationScore: 0,
        anomalies: []
      },
      createdAt: new Date().toISOString()
    }

    this.checkIns.set(checkInId, checkIn)
    this.saveData()

    // Schedule reminders
    this.scheduleReminders(checkIn, schedule)

    console.log(`Next check-in scheduled for ${nextCheckInTime.toLocaleString()}: ${schedule.name}`)
    this.emit('checkInScheduled', checkIn)
  }

  private scheduleReminders(checkIn: CheckIn, schedule: CheckInSchedule): void {
    const checkInTime = new Date(checkIn.scheduledTime)
    
    schedule.settings.reminderMinutes.forEach(minutes => {
      const reminderTime = new Date(checkInTime.getTime() - (minutes * 60 * 1000))
      const delay = reminderTime.getTime() - Date.now()
      
      if (delay > 0) {
        const timer = setTimeout(() => {
          this.sendReminder(checkIn, schedule, 'upcoming', minutes)
        }, delay)
        
        this.reminderTimers.set(`${checkIn.id}_${minutes}`, timer)
      }
    })

    // Schedule escalation
    const escalationDelay = (schedule.escalation.missedCheckInTimeoutMinutes * 60 * 1000) + 
                           (schedule.settings.gracePeriodMinutes * 60 * 1000)
    const escalationTime = checkInTime.getTime() + escalationDelay
    const escalationTimer = setTimeout(() => {
      this.triggerEscalation(checkIn, schedule)
    }, escalationTime - Date.now())

    this.escalationTimers.set(checkIn.id, escalationTimer)
  }

  private async sendReminder(
    checkIn: CheckIn, 
    schedule: CheckInSchedule, 
    type: CheckInReminder['type'],
    minutesBefore?: number
  ): Promise<void> {
    const reminderId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const message = this.generateReminderMessage(schedule, type, minutesBefore)
    
    const reminder: CheckInReminder = {
      id: reminderId,
      scheduleId: schedule.id,
      checkInId: checkIn.id,
      userId: schedule.userId,
      type,
      scheduledFor: new Date().toISOString(),
      sent: false,
      method: 'push',
      message
    }

    // Send reminder (implementation would integrate with notification system)
    console.log(`Sending reminder: ${message}`)
    
    reminder.sent = true
    reminder.sentAt = new Date().toISOString()
    
    this.reminders.set(reminderId, reminder)
    this.emit('reminderSent', reminder)
  }

  private async triggerEscalation(checkIn: CheckIn, schedule: CheckInSchedule): Promise<void> {
    // Check if check-in was completed
    const currentCheckIn = this.checkIns.get(checkIn.id)
    if (!currentCheckIn || currentCheckIn.status !== 'pending') {
      return
    }

    // Mark check-in as missed
    currentCheckIn.status = 'missed'
    this.checkIns.set(checkIn.id, currentCheckIn)

    const escalationId = `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const escalation: EscalationEvent = {
      id: escalationId,
      checkInId: checkIn.id,
      scheduleId: schedule.id,
      userId: schedule.userId,
      level: 1,
      status: 'active',
      triggeredAt: new Date().toISOString(),
      actionsTaken: []
    }

    this.escalations.set(escalationId, escalation)
    this.saveData()

    // Execute escalation levels
    this.executeEscalationLevel(escalation, schedule, 1)

    SecurityMonitoringService.getInstance().logSecurityEvent({
      type: 'safety_checkin_escalation_triggered',
      severity: 'high',
      details: {
        escalationId,
        checkInId: checkIn.id,
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        missedTime: checkIn.scheduledTime
      },
      userId: schedule.userId,
      timestamp: new Date(),
      riskScore: 70
    })

    console.log(`Safety check-in escalation triggered for ${schedule.name}`)
    this.emit('escalationTriggered', escalation)
  }

  private async executeEscalationLevel(
    escalation: EscalationEvent, 
    schedule: CheckInSchedule, 
    level: number
  ): Promise<void> {
    const escalationLevel = schedule.escalation.escalationLevels.find(l => l.level === level)
    if (!escalationLevel) return

    // Execute actions for this level
    for (const action of escalationLevel.actions) {
      if (!action.enabled) continue

      try {
        const success = await this.executeEscalationAction(action, escalation, schedule)
        
        escalation.actionsTaken.push({
          type: action.type,
          timestamp: new Date().toISOString(),
          success,
          response: success ? 'Action completed' : 'Action failed'
        })
      } catch (error) {
        escalation.actionsTaken.push({
          type: action.type,
          timestamp: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Schedule next escalation level
    const nextLevel = schedule.escalation.escalationLevels.find(l => l.level === level + 1)
    if (nextLevel && escalation.status === 'active') {
      const delay = nextLevel.delayMinutes * 60 * 1000
      setTimeout(() => {
        const currentEscalation = this.escalations.get(escalation.id)
        if (currentEscalation?.status === 'active') {
          this.executeEscalationLevel(escalation, schedule, level + 1)
        }
      }, delay)
    }

    this.escalations.set(escalation.id, escalation)
    this.saveData()
  }

  private async executeEscalationAction(
    action: EscalationAction,
    escalation: EscalationEvent,
    schedule: CheckInSchedule
  ): Promise<boolean> {
    console.log(`Executing escalation action: ${action.type}`)
    
    switch (action.type) {
      case 'sms':
        return await this.sendEscalationSMS(action, escalation, schedule)
      case 'call':
        return await this.makeEscalationCall(action, escalation, schedule)
      case 'email':
        return await this.sendEscalationEmail(action, escalation, schedule)
      case 'push_notification':
        return await this.sendEscalationPush(action, escalation, schedule)
      case 'emergency_services':
        return await this.contactEmergencyServices(action, escalation, schedule)
      case 'location_sharing':
        return await this.shareLocation(action, escalation, schedule)
      default:
        return false
    }
  }

  // Escalation action implementations (placeholder)
  private async sendEscalationSMS(action: EscalationAction, escalation: EscalationEvent, schedule: CheckInSchedule): Promise<boolean> {
    console.log('Sending escalation SMS')
    return true
  }

  private async makeEscalationCall(action: EscalationAction, escalation: EscalationEvent, schedule: CheckInSchedule): Promise<boolean> {
    console.log('Making escalation call')
    return true
  }

  private async sendEscalationEmail(action: EscalationAction, escalation: EscalationEvent, schedule: CheckInSchedule): Promise<boolean> {
    console.log('Sending escalation email')
    return true
  }

  private async sendEscalationPush(action: EscalationAction, escalation: EscalationEvent, schedule: CheckInSchedule): Promise<boolean> {
    console.log('Sending escalation push notification')
    return true
  }

  private async contactEmergencyServices(action: EscalationAction, escalation: EscalationEvent, schedule: CheckInSchedule): Promise<boolean> {
    console.log('Contacting emergency services')
    // This would require careful implementation and proper authorization
    return false
  }

  private async shareLocation(action: EscalationAction, escalation: EscalationEvent, schedule: CheckInSchedule): Promise<boolean> {
    console.log('Sharing location with emergency contacts')
    return true
  }

  // Utility methods
  private calculateNextCheckInTime(schedule: CheckInSchedule): Date | null {
    const now = new Date()
    const scheduleConfig = schedule.schedule
    
    // Convert time strings to today's date
    const [startHour, startMinute] = scheduleConfig.startTime.split(':').map(Number)
    const [endHour, endMinute] = scheduleConfig.endTime.split(':').map(Number)
    
    let nextTime = new Date()
    nextTime.setHours(startHour, startMinute, 0, 0)
    
    // If start time has passed today, start from tomorrow
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1)
    }
    
    // Check if the day is active
    while (!scheduleConfig.activeDays.includes(nextTime.getDay())) {
      nextTime.setDate(nextTime.getDate() + 1)
      nextTime.setHours(startHour, startMinute, 0, 0)
    }
    
    // Apply frequency
    switch (schedule.frequency) {
      case 'hourly':
        // Find next hour within active period
        while (nextTime.getHours() > endHour || 
               (nextTime.getHours() === endHour && nextTime.getMinutes() > endMinute)) {
          nextTime.setDate(nextTime.getDate() + 1)
          nextTime.setHours(startHour, startMinute, 0, 0)
          
          // Find next active day
          while (!scheduleConfig.activeDays.includes(nextTime.getDay())) {
            nextTime.setDate(nextTime.getDate() + 1)
            nextTime.setHours(startHour, startMinute, 0, 0)
          }
        }
        break
        
      case 'daily':
        // Already calculated above
        break
        
      case 'weekly':
        // Find next week on the same day
        nextTime.setDate(nextTime.getDate() + 7)
        break
        
      case 'custom':
        if (schedule.customInterval) {
          nextTime.setMinutes(nextTime.getMinutes() + schedule.customInterval)
        }
        break
    }
    
    return nextTime
  }

  private validateSchedule(schedule: CheckInSchedule): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!schedule.name || schedule.name.trim().length < 2) {
      errors.push('Schedule name must be at least 2 characters')
    }

    if (!schedule.userId) {
      errors.push('User ID is required')
    }

    if (schedule.schedule.activeDays.length === 0) {
      errors.push('At least one active day must be selected')
    }

    if (schedule.escalation.escalationLevels.length === 0) {
      errors.push('At least one escalation level must be defined')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private validateCheckInData(schedule: CheckInSchedule, data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (schedule.requirements.locationRequired && !data.location) {
      errors.push('Location is required for this check-in')
    }

    if (schedule.requirements.photoRequired && !data.photo) {
      errors.push('Photo is required for this check-in')
    }

    if (schedule.requirements.messageRequired && !data.message) {
      errors.push('Message is required for this check-in')
    }

    if (schedule.requirements.vitalsRequired && !data.vitals) {
      errors.push('Vitals are required for this check-in')
    }

    if (schedule.requirements.safeWordRequired && !data.safeWord) {
      errors.push('Safe word is required for this check-in')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private calculateDistance(location1: any, location2: any): number {
    // Haversine formula implementation
    const R = 6371e3 // Earth's radius in meters
    const φ1 = location1.lat * Math.PI/180
    const φ2 = location2.lat * Math.PI/180
    const Δφ = (location2.lat-location1.lat) * Math.PI/180
    const Δλ = (location2.lng-location1.lng) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  private calculateTimingScore(scheduledTime: string, actualTime: string): number {
    const scheduled = new Date(scheduledTime).getTime()
    const actual = new Date(actualTime).getTime()
    const diffMinutes = Math.abs(actual - scheduled) / 60000
    
    // Score decreases with delay
    if (diffMinutes <= 5) return 1.0
    if (diffMinutes <= 15) return 0.8
    if (diffMinutes <= 30) return 0.6
    if (diffMinutes <= 60) return 0.4
    return 0.2
  }

  private generateReminderMessage(schedule: CheckInSchedule, type: CheckInReminder['type'], minutesBefore?: number): string {
    switch (type) {
      case 'upcoming':
        return `Safety check-in reminder: "${schedule.name}" due in ${minutesBefore} minutes`
      case 'overdue':
        return `Overdue safety check-in: "${schedule.name}" was due. Please check in now.`
      case 'escalation':
        return `URGENT: Missed safety check-in for "${schedule.name}". Emergency contacts will be notified.`
      default:
        return `Safety check-in reminder for "${schedule.name}"`
    }
  }

  private async getExpectedLocation(userId: string): Promise<any> {
    // Integration with user's current safe zones
    const currentZones = geofencingService.getCurrentStatus().currentZones
    return currentZones.length > 0 ? currentZones[0].center : null
  }

  private async getExpectedSafeWord(userId: string): Promise<string | null> {
    // Retrieve user's safe word from secure storage
    return 'safe123' // Placeholder
  }

  private getClientIP(): string {
    // In a real implementation, this would get the client IP
    return '127.0.0.1'
  }

  private checkScheduledCheckIns(): void {
    // Check for due check-ins and send notifications
    const now = new Date()
    
    this.checkIns.forEach(checkIn => {
      if (checkIn.status === 'pending') {
        const scheduledTime = new Date(checkIn.scheduledTime)
        if (now >= scheduledTime) {
          const schedule = this.schedules.get(checkIn.scheduleId)
          if (schedule) {
            this.sendReminder(checkIn, schedule, 'overdue')
          }
        }
      }
    })
  }

  private processOverdueCheckIns(): void {
    // Process check-ins that are overdue beyond grace period
    const now = new Date()
    
    this.checkIns.forEach(checkIn => {
      if (checkIn.status === 'pending') {
        const schedule = this.schedules.get(checkIn.scheduleId)
        if (schedule) {
          const scheduledTime = new Date(checkIn.scheduledTime)
          const graceEndTime = new Date(scheduledTime.getTime() + (schedule.settings.gracePeriodMinutes * 60 * 1000))
          
          if (now >= graceEndTime) {
            // This check-in is now officially overdue
            console.log(`Check-in ${checkIn.id} is overdue`)
          }
        }
      }
    })
  }

  private cancelEscalation(checkInId: string): void {
    // Find and cancel any active escalations for this check-in
    this.escalations.forEach(escalation => {
      if (escalation.checkInId === checkInId && escalation.status === 'active') {
        escalation.status = 'resolved'
        escalation.resolvedAt = new Date().toISOString()
        escalation.resolution = {
          method: 'check_in_received',
          resolvedBy: 'system'
        }
        this.escalations.set(escalation.id, escalation)
        console.log(`Escalation ${escalation.id} cancelled - check-in received`)
      }
    })

    // Clear escalation timer
    const timer = this.escalationTimers.get(checkInId)
    if (timer) {
      clearTimeout(timer)
      this.escalationTimers.delete(checkInId)
    }
  }

  private clearReminders(checkInId: string): void {
    // Clear all reminder timers for this check-in
    this.reminderTimers.forEach((timer, key) => {
      if (key.startsWith(checkInId)) {
        clearTimeout(timer)
        this.reminderTimers.delete(key)
      }
    })
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, [])
    }
    this.eventCallbacks.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in event callback:', error)
        }
      })
    }
  }

  // Public API methods
  getSchedules(userId?: string): CheckInSchedule[] {
    const schedules = Array.from(this.schedules.values())
    return userId ? schedules.filter(s => s.userId === userId) : schedules
  }

  getSchedule(scheduleId: string): CheckInSchedule | null {
    return this.schedules.get(scheduleId) || null
  }

  getCheckIns(scheduleId?: string, userId?: string): CheckIn[] {
    let checkIns = Array.from(this.checkIns.values())
    
    if (scheduleId) {
      checkIns = checkIns.filter(c => c.scheduleId === scheduleId)
    }
    
    if (userId) {
      checkIns = checkIns.filter(c => c.userId === userId)
    }
    
    return checkIns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getPendingCheckIns(userId?: string): CheckIn[] {
    return this.getCheckIns(undefined, userId).filter(c => c.status === 'pending')
  }

  getStats(userId?: string): SafetyCheckInStats {
    const schedules = this.getSchedules(userId)
    const checkIns = this.getCheckIns(undefined, userId)
    const escalations = Array.from(this.escalations.values())
      .filter(e => !userId || e.userId === userId)

    const completedCheckIns = checkIns.filter(c => c.status === 'completed' || c.status === 'late')
    const responseRate = checkIns.length > 0 ? (completedCheckIns.length / checkIns.length) * 100 : 0

    const responseTimes = completedCheckIns
      .filter(c => c.actualTime)
      .map(c => {
        const scheduled = new Date(c.scheduledTime).getTime()
        const actual = new Date(c.actualTime!).getTime()
        return (actual - scheduled) / 60000 // minutes
      })

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    const sortedCheckIns = checkIns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const lastCheckIn = sortedCheckIns.find(c => c.status === 'completed' || c.status === 'late')
    const nextCheckIn = sortedCheckIns.find(c => c.status === 'pending')

    return {
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter(s => s.isActive).length,
      completedCheckIns: checkIns.filter(c => c.status === 'completed').length,
      missedCheckIns: checkIns.filter(c => c.status === 'missed').length,
      lateCheckIns: checkIns.filter(c => c.status === 'late').length,
      escalationEvents: escalations.length,
      responseRate,
      averageResponseTime,
      lastCheckIn: lastCheckIn?.completedAt,
      nextCheckIn: nextCheckIn?.scheduledTime
    }
  }

  updateSchedule(scheduleId: string, updates: Partial<CheckInSchedule>): boolean {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) return false

    const updatedSchedule = { ...schedule, ...updates, updatedAt: new Date().toISOString() }
    
    // Validate updated schedule
    const validation = this.validateSchedule(updatedSchedule)
    if (!validation.isValid) {
      console.error('Schedule update validation failed:', validation.errors)
      return false
    }

    this.schedules.set(scheduleId, updatedSchedule)
    this.saveData()

    this.emit('scheduleUpdated', updatedSchedule)
    return true
  }

  deleteSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) return false

    // Cancel any pending check-ins
    this.checkIns.forEach(checkIn => {
      if (checkIn.scheduleId === scheduleId && checkIn.status === 'pending') {
        this.clearReminders(checkIn.id)
        this.cancelEscalation(checkIn.id)
      }
    })

    this.schedules.delete(scheduleId)
    this.saveData()

    this.emit('scheduleDeleted', { scheduleId, schedule })
    return true
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring()
    this.schedules.clear()
    this.checkIns.clear()
    this.reminders.clear()
    this.escalations.clear()
    this.eventCallbacks.clear()
  }
}

export default SafetyCheckInService.getInstance()