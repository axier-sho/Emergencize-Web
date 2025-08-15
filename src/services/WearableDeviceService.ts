import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'
import { rateLimitService } from './RateLimitService'

export interface WearableDevice {
  id: string
  name: string
  type: 'smartwatch' | 'fitness_tracker' | 'medical_device' | 'emergency_button' | 'smart_ring' | 'patch' | 'custom'
  brand: string
  model: string
  userId: string
  isConnected: boolean
  lastSeen: string
  batteryLevel?: number
  firmwareVersion?: string
  capabilities: WearableCapability[]
  settings: WearableDeviceSettings
  createdAt: string
  updatedAt: string
}

export interface WearableCapability {
  type: 'heart_rate' | 'location' | 'fall_detection' | 'sos_button' | 'step_counter' | 'sleep_tracking' | 'emergency_alert' | 'voice_command' | 'haptic_feedback' | 'health_monitoring'
  isEnabled: boolean
  accuracy?: 'low' | 'medium' | 'high'
  updateFrequency?: number // milliseconds
  lastCalibrated?: string
}

export interface WearableDeviceSettings {
  emergencyContacts: string[] // Contact IDs
  fallDetectionEnabled: boolean
  fallDetectionSensitivity: 'low' | 'medium' | 'high'
  heartRateMonitoring: {
    enabled: boolean
    alertThresholds: {
      lowBpm: number
      highBpm: number
    }
    continuousMonitoring: boolean
  }
  sosButtonConfig: {
    enabled: boolean
    longPressRequired: boolean
    pressDurationMs: number
    hapticFeedback: boolean
  }
  locationSharing: {
    enabled: boolean
    precision: 'approximate' | 'precise'
    updateInterval: number
  }
  notificationSettings: {
    vibrationEnabled: boolean
    soundEnabled: boolean
    ledEnabled: boolean
    vibrationPattern: number[]
  }
  privacySettings: {
    dataRetentionDays: number
    shareWithContacts: boolean
    shareWithMedical: boolean
  }
}

export interface WearableData {
  deviceId: string
  type: 'heart_rate' | 'location' | 'activity' | 'sleep' | 'health_metric' | 'emergency_event'
  value: any
  unit?: string
  timestamp: string
  accuracy?: number
  metadata?: Record<string, any>
}

export interface EmergencyEvent {
  id: string
  deviceId: string
  type: 'fall_detected' | 'sos_pressed' | 'heart_rate_critical' | 'no_movement' | 'device_removed' | 'panic_button'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  location?: {
    lat: number
    lng: number
    accuracy: number
  }
  vitals?: {
    heartRate?: number
    oxygenSaturation?: number
    temperature?: number
  }
  confidence: number // 0-1 scale
  autoConfirmed: boolean
  userResponse?: 'confirmed' | 'false_alarm' | 'need_help'
  responseTimeout: number // milliseconds
}

export interface DeviceConnection {
  deviceId: string
  connectionType: 'bluetooth' | 'wifi' | 'cellular' | 'nfc' | 'api'
  isConnected: boolean
  signalStrength?: number
  lastConnected: string
  connectionErrors: string[]
}

export class WearableDeviceService {
  private static instance: WearableDeviceService
  private devices: Map<string, WearableDevice> = new Map()
  private deviceConnections: Map<string, DeviceConnection> = new Map()
  private dataBuffer: Map<string, WearableData[]> = new Map()
  private eventCallbacks: Map<string, Function[]> = new Map()
  private connectionWatchers: Map<string, any> = new Map()
  private isMonitoring = false

  // Supported device integrations
  private deviceAPIs = {
    'apple_watch': {
      name: 'Apple Watch',
      protocol: 'HealthKit',
      capabilities: ['heart_rate', 'fall_detection', 'sos_button', 'location', 'emergency_alert']
    },
    'samsung_galaxy_watch': {
      name: 'Samsung Galaxy Watch',
      protocol: 'Samsung Health',
      capabilities: ['heart_rate', 'fall_detection', 'location', 'health_monitoring']
    },
    'fitbit': {
      name: 'Fitbit',
      protocol: 'Fitbit Web API',
      capabilities: ['heart_rate', 'step_counter', 'sleep_tracking', 'health_monitoring']
    },
    'garmin': {
      name: 'Garmin',
      protocol: 'Connect IQ',
      capabilities: ['heart_rate', 'location', 'emergency_alert', 'health_monitoring']
    },
    'polar': {
      name: 'Polar',
      protocol: 'Polar AccessLink',
      capabilities: ['heart_rate', 'health_monitoring']
    },
    'medical_alert': {
      name: 'Medical Alert Device',
      protocol: 'Custom API',
      capabilities: ['sos_button', 'location', 'emergency_alert', 'fall_detection']
    }
  }

  private constructor() {
    this.initializeDeviceDetection()
    this.setupEventHandlers()
  }

  static getInstance(): WearableDeviceService {
    if (!WearableDeviceService.instance) {
      WearableDeviceService.instance = new WearableDeviceService()
    }
    return WearableDeviceService.instance
  }

  private initializeDeviceDetection(): void {
    // Initialize device detection based on available APIs
    if ('bluetooth' in navigator) {
      this.initializeBluetoothDetection()
    }
    
    if ('geolocation' in navigator) {
      this.initializeLocationBasedDetection()
    }

    // Check for Web Bluetooth API support
    if ('serviceWorker' in navigator) {
      this.initializeServiceWorkerIntegration()
    }
  }

  private async initializeBluetoothDetection(): Promise<void> {
    try {
      // Check if Web Bluetooth is available
      if (!navigator.bluetooth) {
        console.log('Web Bluetooth not supported')
        return
      }

      console.log('Bluetooth device detection initialized')
    } catch (error) {
      console.error('Failed to initialize Bluetooth detection:', error)
    }
  }

  private initializeLocationBasedDetection(): void {
    // Some wearables can be detected through location sharing patterns
    console.log('Location-based device detection initialized')
  }

  private initializeServiceWorkerIntegration(): void {
    // Set up service worker messaging for background device monitoring
    console.log('Service worker integration initialized')
  }

  private setupEventHandlers(): void {
    // Set up global event handlers
    window.addEventListener('online', () => this.handleNetworkChange(true))
    window.addEventListener('offline', () => this.handleNetworkChange(false))
  }

  async startMonitoring(): Promise<boolean> {
    try {
      if (this.isMonitoring) {
        console.warn('Wearable device monitoring already active')
        return true
      }

      // Start monitoring all connected devices
      for (const device of this.devices.values()) {
        if (device.isConnected) {
          await this.startDeviceMonitoring(device.id)
        }
      }

      this.isMonitoring = true
      console.log('Wearable device monitoring started')
      
      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'wearable_monitoring_started',
        severity: 'low',
        details: {
          deviceCount: this.devices.size,
          connectedDevices: Array.from(this.devices.values())
            .filter(d => d.isConnected)
            .map(d => ({ id: d.id, type: d.type, brand: d.brand }))
        },
        userId: 'system',
        timestamp: new Date(),
        riskScore: 5
      })

      return true
    } catch (error) {
      console.error('Failed to start wearable monitoring:', error)
      return false
    }
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return

    // Stop monitoring all devices
    this.connectionWatchers.forEach((watcher, deviceId) => {
      this.stopDeviceMonitoring(deviceId)
    })

    this.isMonitoring = false
    console.log('Wearable device monitoring stopped')
  }

  async registerDevice(deviceConfig: {
    name: string
    type: WearableDevice['type']
    brand: string
    model: string
    userId: string
    capabilities: WearableCapability[]
    settings?: Partial<WearableDeviceSettings>
  }): Promise<WearableDevice | null> {
    try {
      // Check rate limiting
      const canRegister = await RateLimitService.getInstance().checkRateLimit(
        deviceConfig.userId,
        'device_registration',
        5, // 5 device registrations per hour
        3600000
      )

      if (!canRegister) {
        throw new Error('Rate limit exceeded for device registration')
      }

      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      const defaultSettings: WearableDeviceSettings = {
        emergencyContacts: [],
        fallDetectionEnabled: true,
        fallDetectionSensitivity: 'medium',
        heartRateMonitoring: {
          enabled: false,
          alertThresholds: {
            lowBpm: 50,
            highBpm: 120
          },
          continuousMonitoring: false
        },
        sosButtonConfig: {
          enabled: true,
          longPressRequired: true,
          pressDurationMs: 3000,
          hapticFeedback: true
        },
        locationSharing: {
          enabled: false,
          precision: 'approximate',
          updateInterval: 300000 // 5 minutes
        },
        notificationSettings: {
          vibrationEnabled: true,
          soundEnabled: false,
          ledEnabled: true,
          vibrationPattern: [200, 100, 200]
        },
        privacySettings: {
          dataRetentionDays: 30,
          shareWithContacts: false,
          shareWithMedical: false
        }
      }

      const device: WearableDevice = {
        id: deviceId,
        name: deviceConfig.name,
        type: deviceConfig.type,
        brand: deviceConfig.brand,
        model: deviceConfig.model,
        userId: deviceConfig.userId,
        isConnected: false,
        lastSeen: now,
        capabilities: deviceConfig.capabilities,
        settings: { ...defaultSettings, ...deviceConfig.settings },
        createdAt: now,
        updatedAt: now
      }

      // Validate device configuration
      const validation = this.validateDeviceConfig(device)
      if (!validation.isValid) {
        throw new Error(`Device validation failed: ${validation.errors.join(', ')}`)
      }

      this.devices.set(deviceId, device)
      this.saveDevices()

      // Initialize device connection
      await this.initializeDeviceConnection(device)

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'wearable_device_registered',
        severity: 'medium',
        details: {
          deviceId,
          deviceType: device.type,
          brand: device.brand,
          model: device.model,
          capabilities: device.capabilities.map(c => c.type)
        },
        userId: deviceConfig.userId,
        timestamp: new Date(),
        riskScore: 15
      })

      console.log('Wearable device registered:', device.name)
      this.emit('deviceRegistered', device)
      
      return device
    } catch (error) {
      console.error('Failed to register wearable device:', error)
      return null
    }
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId)
      if (!device) {
        throw new Error('Device not found')
      }

      // Attempt device connection based on type
      const connected = await this.establishDeviceConnection(device)
      
      if (connected) {
        device.isConnected = true
        device.lastSeen = new Date().toISOString()
        device.updatedAt = new Date().toISOString()
        
        this.devices.set(deviceId, device)
        this.saveDevices()

        // Start monitoring if monitoring is active
        if (this.isMonitoring) {
          await this.startDeviceMonitoring(deviceId)
        }

        console.log('Device connected:', device.name)
        this.emit('deviceConnected', device)
        
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to connect device:', error)
      return false
    }
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId)
      if (!device) {
        throw new Error('Device not found')
      }

      device.isConnected = false
      device.updatedAt = new Date().toISOString()
      
      this.devices.set(deviceId, device)
      this.saveDevices()

      // Stop monitoring
      this.stopDeviceMonitoring(deviceId)

      console.log('Device disconnected:', device.name)
      this.emit('deviceDisconnected', device)
      
      return true
    } catch (error) {
      console.error('Failed to disconnect device:', error)
      return false
    }
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId)
      if (!device) {
        return false
      }

      // Disconnect first
      if (device.isConnected) {
        await this.disconnectDevice(deviceId)
      }

      // Remove device data
      this.devices.delete(deviceId)
      this.deviceConnections.delete(deviceId)
      this.dataBuffer.delete(deviceId)
      this.saveDevices()

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'wearable_device_removed',
        severity: 'medium',
        details: {
          deviceId,
          deviceName: device.name,
          deviceType: device.type
        },
        userId: device.userId,
        timestamp: new Date(),
        riskScore: 20
      })

      console.log('Device removed:', device.name)
      this.emit('deviceRemoved', { deviceId, device })
      
      return true
    } catch (error) {
      console.error('Failed to remove device:', error)
      return false
    }
  }

  processDeviceData(data: WearableData): void {
    try {
      // Validate data
      const validation = this.validateWearableData(data)
      if (!validation.isValid) {
        console.error('Invalid wearable data:', validation.errors)
        return
      }

      // Buffer data
      const deviceBuffer = this.dataBuffer.get(data.deviceId) || []
      deviceBuffer.push(data)
      
      // Keep only last 1000 data points
      if (deviceBuffer.length > 1000) {
        deviceBuffer.splice(0, deviceBuffer.length - 1000)
      }
      
      this.dataBuffer.set(data.deviceId, deviceBuffer)

      // Check for emergency conditions
      this.checkEmergencyConditions(data)

      // Emit data event
      this.emit('dataReceived', data)
    } catch (error) {
      console.error('Failed to process device data:', error)
    }
  }

  private async checkEmergencyConditions(data: WearableData): Promise<void> {
    const device = this.devices.get(data.deviceId)
    if (!device) return

    // Heart rate emergency detection
    if (data.type === 'heart_rate' && device.settings.heartRateMonitoring.enabled) {
      const heartRate = data.value as number
      const thresholds = device.settings.heartRateMonitoring.alertThresholds
      
      if (heartRate < thresholds.lowBpm || heartRate > thresholds.highBpm) {
        await this.triggerEmergencyEvent({
          deviceId: data.deviceId,
          type: 'heart_rate_critical',
          severity: 'high',
          timestamp: data.timestamp,
          vitals: { heartRate },
          confidence: 0.8,
          autoConfirmed: false,
          responseTimeout: 60000 // 1 minute
        })
      }
    }

    // Fall detection
    if (data.type === 'emergency_event' && data.value.type === 'fall_detected') {
      await this.triggerEmergencyEvent({
        deviceId: data.deviceId,
        type: 'fall_detected',
        severity: 'critical',
        timestamp: data.timestamp,
        location: data.value.location,
        confidence: data.value.confidence || 0.7,
        autoConfirmed: false,
        responseTimeout: 30000 // 30 seconds
      })
    }

    // SOS button press
    if (data.type === 'emergency_event' && data.value.type === 'sos_pressed') {
      await this.triggerEmergencyEvent({
        deviceId: data.deviceId,
        type: 'sos_pressed',
        severity: 'critical',
        timestamp: data.timestamp,
        location: data.value.location,
        confidence: 1.0,
        autoConfirmed: true,
        responseTimeout: 0
      })
    }
  }

  private async triggerEmergencyEvent(event: Omit<EmergencyEvent, 'id'>): Promise<void> {
    const emergencyEvent: EmergencyEvent = {
      id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...event
    }

    const device = this.devices.get(event.deviceId)
    if (!device) return

    SecurityMonitoringService.getInstance().logSecurityEvent({
      type: 'wearable_emergency_detected',
      severity: 'critical',
      details: {
        emergencyId: emergencyEvent.id,
        emergencyType: emergencyEvent.type,
        deviceId: event.deviceId,
        deviceName: device.name,
        confidence: emergencyEvent.confidence,
        autoConfirmed: emergencyEvent.autoConfirmed
      },
      userId: device.userId,
      timestamp: new Date(),
      riskScore: 90
    })

    console.log('Emergency event triggered:', emergencyEvent.type)
    this.emit('emergencyEvent', emergencyEvent)

    // Send immediate notification if auto-confirmed or high confidence
    if (emergencyEvent.autoConfirmed || emergencyEvent.confidence > 0.8) {
      this.sendEmergencyAlert(emergencyEvent)
    } else {
      // Give user time to respond
      setTimeout(() => {
        this.sendEmergencyAlert(emergencyEvent)
      }, emergencyEvent.responseTimeout)
    }
  }

  private async sendEmergencyAlert(event: EmergencyEvent): Promise<void> {
    const device = this.devices.get(event.deviceId)
    if (!device) return

    // Send alert to emergency contacts
    const emergencyContacts = device.settings.emergencyContacts
    
    // Implementation would integrate with existing alert system
    console.log(`Sending emergency alert for ${event.type} to ${emergencyContacts.length} contacts`)
    
    this.emit('emergencyAlertSent', { event, contactIds: emergencyContacts })
  }

  // Device connection methods
  private async establishDeviceConnection(device: WearableDevice): Promise<boolean> {
    try {
      // Connection logic based on device type and available APIs
      switch (device.type) {
        case 'smartwatch':
          return await this.connectSmartwatch(device)
        case 'fitness_tracker':
          return await this.connectFitnessTracker(device)
        case 'medical_device':
          return await this.connectMedicalDevice(device)
        case 'emergency_button':
          return await this.connectEmergencyButton(device)
        default:
          return await this.connectGenericDevice(device)
      }
    } catch (error) {
      console.error('Device connection failed:', error)
      return false
    }
  }

  private async connectSmartwatch(device: WearableDevice): Promise<boolean> {
    // Smartwatch connection logic
    console.log('Connecting smartwatch:', device.name)
    
    // Simulate connection for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 1000)
    })
  }

  private async connectFitnessTracker(device: WearableDevice): Promise<boolean> {
    // Fitness tracker connection logic
    console.log('Connecting fitness tracker:', device.name)
    return true
  }

  private async connectMedicalDevice(device: WearableDevice): Promise<boolean> {
    // Medical device connection logic
    console.log('Connecting medical device:', device.name)
    return true
  }

  private async connectEmergencyButton(device: WearableDevice): Promise<boolean> {
    // Emergency button connection logic
    console.log('Connecting emergency button:', device.name)
    return true
  }

  private async connectGenericDevice(device: WearableDevice): Promise<boolean> {
    // Generic device connection logic
    console.log('Connecting generic device:', device.name)
    return true
  }

  private async initializeDeviceConnection(device: WearableDevice): Promise<void> {
    const connection: DeviceConnection = {
      deviceId: device.id,
      connectionType: 'bluetooth', // Default
      isConnected: false,
      lastConnected: new Date().toISOString(),
      connectionErrors: []
    }

    this.deviceConnections.set(device.id, connection)
  }

  private async startDeviceMonitoring(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId)
    if (!device || !device.isConnected) return

    // Set up periodic data collection based on device capabilities
    const monitoringInterval = setInterval(() => {
      this.collectDeviceData(deviceId)
    }, 10000) // Collect data every 10 seconds

    this.connectionWatchers.set(deviceId, monitoringInterval)
    console.log('Started monitoring device:', device.name)
  }

  private stopDeviceMonitoring(deviceId: string): void {
    const watcher = this.connectionWatchers.get(deviceId)
    if (watcher) {
      clearInterval(watcher)
      this.connectionWatchers.delete(deviceId)
    }
  }

  private async collectDeviceData(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId)
    if (!device || !device.isConnected) return

    // Simulate data collection for each capability
    for (const capability of device.capabilities) {
      if (!capability.isEnabled) continue

      const data = await this.simulateDeviceData(deviceId, capability.type)
      if (data) {
        this.processDeviceData(data)
      }
    }

    // Update last seen timestamp
    device.lastSeen = new Date().toISOString()
    this.devices.set(deviceId, device)
  }

  private async simulateDeviceData(deviceId: string, type: WearableCapability['type']): Promise<WearableData | null> {
    const timestamp = new Date().toISOString()

    switch (type) {
      case 'heart_rate':
        return {
          deviceId,
          type: 'heart_rate',
          value: Math.floor(Math.random() * (100 - 60) + 60), // 60-100 BPM
          unit: 'bpm',
          timestamp,
          accuracy: 0.95
        }
      
      case 'location':
        return {
          deviceId,
          type: 'location',
          value: {
            lat: 37.7749 + (Math.random() - 0.5) * 0.01,
            lng: -122.4194 + (Math.random() - 0.5) * 0.01
          },
          timestamp,
          accuracy: 0.9
        }
      
      case 'step_counter':
        return {
          deviceId,
          type: 'activity',
          value: Math.floor(Math.random() * 100),
          unit: 'steps',
          timestamp,
          accuracy: 0.8
        }
      
      default:
        return null
    }
  }

  private handleNetworkChange(isOnline: boolean): void {
    console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`)
    
    if (isOnline) {
      // Attempt to reconnect devices
      this.devices.forEach(async (device) => {
        if (!device.isConnected) {
          await this.connectDevice(device.id)
        }
      })
    }
  }

  // Validation methods
  private validateDeviceConfig(device: WearableDevice): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!device.name || device.name.trim().length < 2) {
      errors.push('Device name must be at least 2 characters')
    }

    if (!device.userId || device.userId.trim().length < 1) {
      errors.push('User ID is required')
    }

    if (device.capabilities.length === 0) {
      errors.push('At least one capability must be defined')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private validateWearableData(data: WearableData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.deviceId || data.deviceId.trim().length < 1) {
      errors.push('Device ID is required')
    }

    if (!data.type) {
      errors.push('Data type is required')
    }

    if (data.value === undefined || data.value === null) {
      errors.push('Data value is required')
    }

    if (!data.timestamp) {
      errors.push('Timestamp is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
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
  getDevices(): WearableDevice[] {
    return Array.from(this.devices.values())
  }

  getDevice(deviceId: string): WearableDevice | null {
    return this.devices.get(deviceId) || null
  }

  getConnectedDevices(): WearableDevice[] {
    return Array.from(this.devices.values()).filter(device => device.isConnected)
  }

  getDeviceData(deviceId: string, type?: WearableData['type']): WearableData[] {
    const data = this.dataBuffer.get(deviceId) || []
    return type ? data.filter(d => d.type === type) : data
  }

  getSupportedDeviceTypes(): string[] {
    return Object.keys(this.deviceAPIs)
  }

  updateDeviceSettings(deviceId: string, settings: Partial<WearableDeviceSettings>): boolean {
    const device = this.devices.get(deviceId)
    if (!device) return false

    device.settings = { ...device.settings, ...settings }
    device.updatedAt = new Date().toISOString()
    
    this.devices.set(deviceId, device)
    this.saveDevices()
    
    this.emit('deviceSettingsUpdated', { deviceId, settings })
    return true
  }

  // Storage methods
  private saveDevices(): void {
    try {
      const devicesArray = Array.from(this.devices.values())
      localStorage.setItem('emergencize-wearable-devices', JSON.stringify(devicesArray))
    } catch (error) {
      console.error('Error saving devices:', error)
    }
  }

  private loadDevices(): void {
    try {
      const saved = localStorage.getItem('emergencize-wearable-devices')
      if (saved) {
        const devicesArray: WearableDevice[] = JSON.parse(saved)
        devicesArray.forEach(device => {
          this.devices.set(device.id, device)
        })
      }
    } catch (error) {
      console.error('Error loading devices:', error)
    }
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring()
    this.devices.clear()
    this.deviceConnections.clear()
    this.dataBuffer.clear()
    this.eventCallbacks.clear()
    this.connectionWatchers.clear()
  }
}

export default WearableDeviceService.getInstance()