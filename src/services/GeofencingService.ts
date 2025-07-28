'use client'

import { locationService, Location } from './LocationService'

export interface SafeZone {
  id: string
  name: string
  center: Location
  radiusMeters: number
  type: 'home' | 'work' | 'school' | 'hospital' | 'custom'
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  description?: string
  contacts?: string[] // Contact IDs to notify
}

export interface GeofenceEvent {
  id: string
  type: 'enter' | 'exit'
  safeZone: SafeZone
  location: Location
  timestamp: string
  userId: string
}

export interface GeofenceAlert {
  id: string
  type: 'zone_exit' | 'zone_enter' | 'zone_violation'
  message: string
  safeZone: SafeZone
  location: Location
  timestamp: string
  severity: 'low' | 'medium' | 'high'
}

class GeofencingService {
  private safeZones: Map<string, SafeZone> = new Map()
  private currentLocation: Location | null = null
  private userStates: Map<string, { inZones: Set<string>; lastLocation: Location | null }> = new Map()
  private eventCallbacks: ((event: GeofenceEvent) => void)[] = []
  private alertCallbacks: ((alert: GeofenceAlert) => void)[] = []
  private isWatching = false
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.loadSafeZones()
    this.initializeLocationTracking()
  }

  // Initialize location tracking
  private initializeLocationTracking(): void {
    locationService.onLocationUpdate((location) => {
      this.currentLocation = location
      this.checkGeofences(location)
    })

    locationService.onLocationError((error) => {
      console.error('Geofencing location error:', error)
    })
  }

  // Start geofence monitoring
  async startMonitoring(): Promise<boolean> {
    try {
      if (this.isWatching) {
        console.warn('Geofence monitoring already active')
        return true
      }

      // Request location permission
      const hasPermission = await locationService.requestPermission()
      if (!hasPermission) {
        throw new Error('Location permission required for geofencing')
      }

      // Start location watching
      const started = locationService.startWatching({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      })

      if (!started) {
        throw new Error('Failed to start location watching')
      }

      this.isWatching = true

      // Set up periodic checks (fallback)
      this.checkInterval = setInterval(() => {
        const lastLocation = locationService.getLastKnownLocation()
        if (lastLocation) {
          this.checkGeofences(lastLocation)
        }
      }, 30000) // Check every 30 seconds

      console.log('Geofence monitoring started')
      return true
    } catch (error) {
      console.error('Error starting geofence monitoring:', error)
      return false
    }
  }

  // Stop geofence monitoring
  stopMonitoring(): void {
    if (!this.isWatching) return

    locationService.stopWatching()
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    this.isWatching = false
    console.log('Geofence monitoring stopped')
  }

  // Add safe zone
  addSafeZone(safeZone: Omit<SafeZone, 'id' | 'createdAt' | 'updatedAt'>): SafeZone {
    const id = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const newSafeZone: SafeZone = {
      ...safeZone,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.safeZones.set(id, newSafeZone)
    this.saveSafeZones()
    
    console.log('Safe zone added:', newSafeZone.name)
    return newSafeZone
  }

  // Update safe zone
  updateSafeZone(id: string, updates: Partial<SafeZone>): boolean {
    const safeZone = this.safeZones.get(id)
    if (!safeZone) {
      console.error('Safe zone not found:', id)
      return false
    }

    const updatedZone: SafeZone = {
      ...safeZone,
      ...updates,
      id, // Prevent ID change
      updatedAt: new Date().toISOString()
    }

    this.safeZones.set(id, updatedZone)
    this.saveSafeZones()
    
    console.log('Safe zone updated:', updatedZone.name)
    return true
  }

  // Remove safe zone
  removeSafeZone(id: string): boolean {
    const safeZone = this.safeZones.get(id)
    if (!safeZone) {
      console.error('Safe zone not found:', id)
      return false
    }

    this.safeZones.delete(id)
    this.saveSafeZones()
    
    // Remove from user states
    this.userStates.forEach((state) => {
      state.inZones.delete(id)
    })
    
    console.log('Safe zone removed:', safeZone.name)
    return true
  }

  // Get all safe zones
  getSafeZones(): SafeZone[] {
    return Array.from(this.safeZones.values())
  }

  // Get safe zone by ID
  getSafeZone(id: string): SafeZone | null {
    return this.safeZones.get(id) || null
  }

  // Check if location is in any safe zone
  isInSafeZone(location: Location): { inZone: boolean; zones: SafeZone[] } {
    const zones: SafeZone[] = []
    
    for (const safeZone of this.safeZones.values()) {
      if (!safeZone.isActive) continue
      
      const isInside = locationService.isWithinRadius(
        safeZone.center,
        location,
        safeZone.radiusMeters
      )
      
      if (isInside) {
        zones.push(safeZone)
      }
    }
    
    return {
      inZone: zones.length > 0,
      zones
    }
  }

  // Check geofences for current location
  private checkGeofences(location: Location, userId = 'current'): void {
    const userState = this.userStates.get(userId) || { 
      inZones: new Set<string>(), 
      lastLocation: null 
    }

    const currentZoneCheck = this.isInSafeZone(location)
    const currentZoneIds = new Set(currentZoneCheck.zones.map(z => z.id))
    const previousZoneIds = userState.inZones

    // Find zone entries and exits
    const enteredZones = new Set([...currentZoneIds].filter(id => !previousZoneIds.has(id)))
    const exitedZones = new Set([...previousZoneIds].filter(id => !currentZoneIds.has(id)))

    // Process zone entries
    enteredZones.forEach(zoneId => {
      const safeZone = this.safeZones.get(zoneId)
      if (safeZone) {
        const event: GeofenceEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'enter',
          safeZone,
          location,
          timestamp: new Date().toISOString(),
          userId
        }
        
        this.triggerEvent(event)
        this.checkForAlerts(event)
      }
    })

    // Process zone exits
    exitedZones.forEach(zoneId => {
      const safeZone = this.safeZones.get(zoneId)
      if (safeZone) {
        const event: GeofenceEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'exit',
          safeZone,
          location,
          timestamp: new Date().toISOString(),
          userId
        }
        
        this.triggerEvent(event)
        this.checkForAlerts(event)
      }
    })

    // Update user state
    userState.inZones = currentZoneIds
    userState.lastLocation = location
    this.userStates.set(userId, userState)
  }

  // Trigger geofence event
  private triggerEvent(event: GeofenceEvent): void {
    console.log(`Geofence ${event.type}:`, event.safeZone.name)
    
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in geofence event callback:', error)
      }
    })
    
    // Store event for history
    this.storeEvent(event)
  }

  // Check for alerts based on event
  private checkForAlerts(event: GeofenceEvent): void {
    const { type, safeZone } = event
    
    // Example alert logic - customize based on requirements
    if (type === 'exit' && safeZone.type === 'home') {
      // Alert when leaving home
      const alert: GeofenceAlert = {
        id: `alert_${Date.now()}`,
        type: 'zone_exit',
        message: `Left safe zone: ${safeZone.name}`,
        safeZone,
        location: event.location,
        timestamp: event.timestamp,
        severity: 'medium'
      }
      
      this.triggerAlert(alert)
    }
    
    if (type === 'enter' && safeZone.type === 'hospital') {
      // Alert when entering hospital
      const alert: GeofenceAlert = {
        id: `alert_${Date.now()}`,
        type: 'zone_enter',
        message: `Entered safe zone: ${safeZone.name}`,
        safeZone,
        location: event.location,
        timestamp: event.timestamp,
        severity: 'low'
      }
      
      this.triggerAlert(alert)
    }
  }

  // Trigger geofence alert
  private triggerAlert(alert: GeofenceAlert): void {
    console.log('Geofence alert:', alert.message)
    
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in geofence alert callback:', error)
      }
    })
  }

  // Event listeners
  onGeofenceEvent(callback: (event: GeofenceEvent) => void): () => void {
    this.eventCallbacks.push(callback)
    
    return () => {
      const index = this.eventCallbacks.indexOf(callback)
      if (index > -1) {
        this.eventCallbacks.splice(index, 1)
      }
    }
  }

  onGeofenceAlert(callback: (alert: GeofenceAlert) => void): () => void {
    this.alertCallbacks.push(callback)
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  // Get current status
  getCurrentStatus(): {
    isWatching: boolean
    currentLocation: Location | null
    currentZones: SafeZone[]
    totalZones: number
  } {
    const currentZones = this.currentLocation 
      ? this.isInSafeZone(this.currentLocation).zones 
      : []
    
    return {
      isWatching: this.isWatching,
      currentLocation: this.currentLocation,
      currentZones,
      totalZones: this.safeZones.size
    }
  }

  // Create predefined safe zones
  createPredefinedZones(location: Location): void {
    const predefinedZones = [
      {
        name: 'Home',
        center: location,
        radiusMeters: 100,
        type: 'home' as const,
        color: '#10b981',
        isActive: true,
        description: 'Your home location'
      },
      {
        name: 'Workplace',
        center: { ...location, lat: location.lat + 0.01 }, // Offset slightly
        radiusMeters: 200,
        type: 'work' as const,
        color: '#3b82f6',
        isActive: false,
        description: 'Your workplace location'
      }
    ]

    predefinedZones.forEach(zone => {
      this.addSafeZone(zone)
    })
  }

  // Storage methods
  private saveSafeZones(): void {
    try {
      const zonesArray = Array.from(this.safeZones.values())
      localStorage.setItem('emergencize-safe-zones', JSON.stringify(zonesArray))
    } catch (error) {
      console.error('Error saving safe zones:', error)
    }
  }

  private loadSafeZones(): void {
    try {
      const saved = localStorage.getItem('emergencize-safe-zones')
      if (saved) {
        const zonesArray: SafeZone[] = JSON.parse(saved)
        zonesArray.forEach(zone => {
          this.safeZones.set(zone.id, zone)
        })
      }
    } catch (error) {
      console.error('Error loading safe zones:', error)
    }
  }

  private storeEvent(event: GeofenceEvent): void {
    try {
      const events = this.getStoredEvents()
      events.push(event)
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }
      
      localStorage.setItem('emergencize-geofence-events', JSON.stringify(events))
    } catch (error) {
      console.error('Error storing geofence event:', error)
    }
  }

  getStoredEvents(): GeofenceEvent[] {
    try {
      const saved = localStorage.getItem('emergencize-geofence-events')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading geofence events:', error)
      return []
    }
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring()
    this.eventCallbacks = []
    this.alertCallbacks = []
    this.safeZones.clear()
    this.userStates.clear()
  }
}

export const geofencingService = new GeofencingService()