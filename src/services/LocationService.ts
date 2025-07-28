'use client'

export interface Location {
  lat: number
  lng: number
  accuracy?: number
  timestamp: number
}

export interface LocationError {
  code: number
  message: string
}

export interface LocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

class LocationService {
  private watchId: number | null = null
  private lastKnownLocation: Location | null = null
  private locationCallbacks: ((location: Location) => void)[] = []
  private errorCallbacks: ((error: LocationError) => void)[] = []

  constructor() {
    // Load last known location from storage
    this.loadLastKnownLocation()
  }

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator
  }

  // Request location permission
  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        throw new Error('Geolocation not supported')
      }

      // Try to get current position to trigger permission request
      await this.getCurrentPosition({ timeout: 5000 })
      return true
    } catch (error) {
      console.error('Location permission denied:', error)
      return false
    }
  }

  // Get current position once
  async getCurrentPosition(options: LocationOptions = {}): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation not supported'))
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 300000 // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          
          this.lastKnownLocation = location
          this.saveLastKnownLocation()
          resolve(location)
        },
        (error) => {
          const locationError: LocationError = {
            code: error.code,
            message: this.getErrorMessage(error.code)
          }
          reject(locationError)
        },
        defaultOptions
      )
    })
  }

  // Start watching position
  startWatching(options: LocationOptions = {}): boolean {
    try {
      if (!this.isSupported()) {
        console.error('Geolocation not supported')
        return false
      }

      if (this.watchId !== null) {
        console.warn('Already watching location')
        return true
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 15000,
        maximumAge: options.maximumAge ?? 60000 // 1 minute
      }

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          
          this.lastKnownLocation = location
          this.saveLastKnownLocation()
          
          // Notify all callbacks
          this.locationCallbacks.forEach(callback => {
            try {
              callback(location)
            } catch (error) {
              console.error('Error in location callback:', error)
            }
          })
        },
        (error) => {
          const locationError: LocationError = {
            code: error.code,
            message: this.getErrorMessage(error.code)
          }
          
          // Notify error callbacks
          this.errorCallbacks.forEach(callback => {
            try {
              callback(locationError)
            } catch (error) {
              console.error('Error in location error callback:', error)
            }
          })
        },
        defaultOptions
      )

      console.log('Started watching location')
      return true
    } catch (error) {
      console.error('Error starting location watch:', error)
      return false
    }
  }

  // Stop watching position
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
      console.log('Stopped watching location')
    }
  }

  // Add location update callback
  onLocationUpdate(callback: (location: Location) => void): () => void {
    this.locationCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.locationCallbacks.indexOf(callback)
      if (index > -1) {
        this.locationCallbacks.splice(index, 1)
      }
    }
  }

  // Add error callback
  onLocationError(callback: (error: LocationError) => void): () => void {
    this.errorCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback)
      if (index > -1) {
        this.errorCallbacks.splice(index, 1)
      }
    }
  }

  // Get last known location
  getLastKnownLocation(): Location | null {
    return this.lastKnownLocation
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180
    const φ2 = (point2.lat * Math.PI) / 180
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  // Check if point is within radius of center
  isWithinRadius(center: Location, point: Location, radiusMeters: number): boolean {
    const distance = this.calculateDistance(center, point)
    return distance <= radiusMeters
  }

  // Get human-readable address from coordinates (reverse geocoding)
  async getAddressFromCoordinates(location: Location): Promise<string | null> {
    try {
      // Use a free geocoding service (you might want to use Google Maps API or similar)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lng}&localityLanguage=en`
      )
      
      if (!response.ok) {
        throw new Error('Geocoding request failed')
      }
      
      const data = await response.json()
      
      // Format address
      const parts = []
      if (data.locality) parts.push(data.locality)
      if (data.principalSubdivision) parts.push(data.principalSubdivision)
      if (data.countryName) parts.push(data.countryName)
      
      return parts.join(', ') || null
    } catch (error) {
      console.error('Error getting address from coordinates:', error)
      return null
    }
  }

  // Get coordinates from address (geocoding)
  async getCoordinatesFromAddress(address: string): Promise<Location | null> {
    try {
      // Use a free geocoding service
      const response = await fetch(
        `https://api.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      
      if (!response.ok) {
        throw new Error('Geocoding request failed')
      }
      
      const data = await response.json()
      
      if (data.length === 0) {
        return null
      }
      
      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Error getting coordinates from address:', error)
      return null
    }
  }

  // Format location for display
  formatLocation(location: Location, includeAccuracy = false): string {
    const lat = location.lat.toFixed(6)
    const lng = location.lng.toFixed(6)
    const accuracy = location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ''
    
    return `${lat}, ${lng}${includeAccuracy ? accuracy : ''}`
  }

  // Get error message from code
  private getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied by user'
      case 2:
        return 'Location unavailable'
      case 3:
        return 'Location request timed out'
      default:
        return 'Unknown location error'
    }
  }

  // Save last known location to storage
  private saveLastKnownLocation(): void {
    try {
      if (this.lastKnownLocation) {
        localStorage.setItem('emergencize-last-location', JSON.stringify(this.lastKnownLocation))
      }
    } catch (error) {
      console.error('Error saving last known location:', error)
    }
  }

  // Load last known location from storage
  private loadLastKnownLocation(): void {
    try {
      const saved = localStorage.getItem('emergencize-last-location')
      if (saved) {
        this.lastKnownLocation = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading last known location:', error)
    }
  }

  // Check permission status
  async getPermissionStatus(): Promise<PermissionState> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        return permission.state
      }
      return 'prompt'
    } catch (error) {
      console.error('Error checking location permission:', error)
      return 'prompt'
    }
  }

  // Cleanup
  destroy(): void {
    this.stopWatching()
    this.locationCallbacks = []
    this.errorCallbacks = []
  }
}

export const locationService = new LocationService()