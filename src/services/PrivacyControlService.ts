import { validationService, PrivacySettings } from './ValidationService'
import { securityMonitoringService } from './SecurityMonitoringService'

export interface ContactPrivacySettings {
  contactId: string
  locationSharing: 'precise' | 'approximate' | 'static' | 'none'
  medicalDataSharing: boolean
  onlineStatusVisible: boolean
  alertPriority: 'high' | 'medium' | 'low'
  customLocationLabel?: string
  staticLocationCoords?: { lat: number; lng: number }
  emergencyOverride: boolean
}

export interface LocationPrivacyLevel {
  level: 'precise' | 'approximate' | 'static' | 'none'
  description: string
  accuracy: string
  dataShared: string[]
}

export interface PrivacyAuditLog {
  id: string
  userId: string
  action: 'settings_changed' | 'data_shared' | 'access_granted' | 'access_denied'
  details: {
    settingType: string
    oldValue?: any
    newValue?: any
    requestingParty?: string
    purpose?: string
  }
  timestamp: Date
  riskScore: number
}

export interface DataSharingPermission {
  id: string
  userId: string
  dataType: 'location' | 'medical' | 'contacts' | 'profile'
  granteeTo: string
  grantedBy: string
  purpose: string
  expiresAt?: Date
  autoRevoke: boolean
  conditions?: string[]
  active: boolean
  createdAt: Date
}

export class PrivacyControlService {
  private static instance: PrivacyControlService
  private defaultPrivacySettings: PrivacySettings = {
    locationSharing: 'approximate',
    medicalDataSharing: false,
    contactVisibility: 'contacts',
    profileVisibility: 'contacts',
    dataRetentionDays: 365
  }

  private constructor() {}

  static getInstance(): PrivacyControlService {
    if (!PrivacyControlService.instance) {
      PrivacyControlService.instance = new PrivacyControlService()
    }
    return PrivacyControlService.instance
  }

  async updatePrivacySettings(userId: string, newSettings: Partial<PrivacySettings>): Promise<boolean> {
    try {
      // Validate new settings
      const validationResult = validationService.validatePrivacySettings(newSettings)
      if (!validationResult.isValid) {
        throw new Error(`Invalid privacy settings: ${Object.values(validationResult.errors).flat().join(', ')}`)
      }

      // Get current settings for comparison
      const currentSettings = await this.getPrivacySettings(userId)
      
      // Merge with current settings
      const updatedSettings: PrivacySettings = {
        ...currentSettings,
        ...validationResult.sanitizedData
      }

      // Save settings
      await this.savePrivacySettings(userId, updatedSettings)

      // Log privacy changes
      await this.logPrivacyChange(userId, 'settings_changed', {
        settingType: 'global_privacy',
        oldValue: currentSettings,
        newValue: updatedSettings
      })

      securityMonitoringService.logSecurityEvent({
        type: 'admin_action',
        severity: 'medium',
        details: {
          userId,
          changedSettings: Object.keys(newSettings),
          hasStricterSettings: this.isStricterPrivacy(currentSettings, updatedSettings)
        },
        userId
      })

      return true
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
      return false
    }
  }

  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      // In real implementation, fetch from database
      const savedSettings = await this.getPrivacySettingsFromDatabase(userId)
      return savedSettings || this.defaultPrivacySettings
    } catch (error) {
      console.error('Failed to get privacy settings:', error)
      return this.defaultPrivacySettings
    }
  }

  async updateContactPrivacySettings(userId: string, contactId: string, settings: Partial<ContactPrivacySettings>): Promise<boolean> {
    try {
      // Validate contact privacy settings
      const validationResult = this.validateContactPrivacySettings(settings)
      if (!validationResult.isValid) {
        throw new Error(`Invalid contact privacy settings: ${validationResult.errors.join(', ')}`)
      }

      // Get current contact settings
      const currentSettings = await this.getContactPrivacySettings(userId, contactId)
      
      // Merge settings
      const updatedSettings: ContactPrivacySettings = {
        ...currentSettings,
        ...settings,
        contactId
      }

      // Save contact privacy settings
      await this.saveContactPrivacySettings(userId, contactId, updatedSettings)

      // Log change
      await this.logPrivacyChange(userId, 'settings_changed', {
        settingType: 'contact_privacy',
        oldValue: currentSettings,
        newValue: updatedSettings,
        requestingParty: contactId
      })

      return true
    } catch (error) {
      console.error('Failed to update contact privacy settings:', error)
      return false
    }
  }

  async getContactPrivacySettings(userId: string, contactId: string): Promise<ContactPrivacySettings> {
    try {
      const settings = await this.getContactPrivacySettingsFromDatabase(userId, contactId)
      if (settings) {
        return settings
      }

      // Return default contact settings based on global privacy
      const globalSettings = await this.getPrivacySettings(userId)
      return {
        contactId,
        locationSharing: globalSettings.locationSharing,
        medicalDataSharing: globalSettings.medicalDataSharing,
        onlineStatusVisible: globalSettings.contactVisibility !== 'none',
        alertPriority: 'medium',
        emergencyOverride: true
      }
    } catch (error) {
      console.error('Failed to get contact privacy settings:', error)
      throw error
    }
  }

  async filterLocationDataByPrivacy(userId: string, requestingUserId: string, locationData: any): Promise<any> {
    try {
      const contactSettings = await this.getContactPrivacySettings(userId, requestingUserId)
      const globalSettings = await this.getPrivacySettings(userId)

      // Determine effective privacy level
      const effectiveLevel = this.getEffectivePrivacyLevel(contactSettings.locationSharing, globalSettings.locationSharing)

      switch (effectiveLevel) {
        case 'none':
          await this.logPrivacyChange(userId, 'access_denied', {
            settingType: 'location_access',
            requestingParty: requestingUserId,
            purpose: 'location_request'
          })
          return null

        case 'static':
          if (contactSettings.staticLocationCoords) {
            return {
              lat: contactSettings.staticLocationCoords.lat,
              lng: contactSettings.staticLocationCoords.lng,
              address: contactSettings.customLocationLabel || 'General area',
              accuracy: 'static'
            }
          }
          return null

        case 'approximate':
          // Reduce accuracy to ~100m radius
          const approximateLocation = this.approximateLocation(locationData, 100)
          await this.logPrivacyChange(userId, 'data_shared', {
            settingType: 'location_sharing',
            requestingParty: requestingUserId,
            purpose: 'emergency_alert'
          })
          return approximateLocation

        case 'precise':
          await this.logPrivacyChange(userId, 'data_shared', {
            settingType: 'location_sharing',
            requestingParty: requestingUserId,
            purpose: 'emergency_alert'
          })
          return locationData

        default:
          return null
      }
    } catch (error) {
      console.error('Failed to filter location data:', error)
      return null
    }
  }

  async canShareMedicalData(userId: string, requestingUserId: string, purpose: string): Promise<boolean> {
    try {
      const contactSettings = await this.getContactPrivacySettings(userId, requestingUserId)
      const globalSettings = await this.getPrivacySettings(userId)

      // Check for emergency override
      if (purpose === 'emergency' && contactSettings.emergencyOverride) {
        await this.logPrivacyChange(userId, 'access_granted', {
          settingType: 'medical_data_emergency_override',
          requestingParty: requestingUserId,
          purpose
        })
        return true
      }

      // Check explicit medical data sharing permission
      const canShare = contactSettings.medicalDataSharing && globalSettings.medicalDataSharing

      await this.logPrivacyChange(userId, canShare ? 'access_granted' : 'access_denied', {
        settingType: 'medical_data_sharing',
        requestingParty: requestingUserId,
        purpose
      })

      return canShare
    } catch (error) {
      console.error('Failed to check medical data sharing permission:', error)
      return false
    }
  }

  async grantDataSharingPermission(permission: Omit<DataSharingPermission, 'id' | 'createdAt'>): Promise<string> {
    try {
      const permissionId = crypto.randomUUID()
      const newPermission: DataSharingPermission = {
        ...permission,
        id: permissionId,
        createdAt: new Date()
      }

      // Validate permission
      const isValid = await this.validateDataSharingPermission(newPermission)
      if (!isValid) {
        throw new Error('Invalid data sharing permission')
      }

      // Save permission
      await this.saveDataSharingPermission(newPermission)

      // Log permission grant
      await this.logPrivacyChange(permission.userId, 'access_granted', {
        settingType: 'data_sharing_permission',
        requestingParty: permission.granteeTo,
        purpose: permission.purpose
      })

      securityMonitoringService.logSecurityEvent({
        type: 'admin_action',
        severity: 'medium',
        details: {
          permissionId,
          dataType: permission.dataType,
          granteeTo: permission.granteeTo,
          purpose: permission.purpose,
          hasExpiration: !!permission.expiresAt
        },
        userId: permission.        userId
      })

      return permissionId
    } catch (error) {
      console.error('Failed to grant data sharing permission:', error)
      throw error
    }
  }

  async revokeDataSharingPermission(userId: string, permissionId: string): Promise<boolean> {
    try {
      const permission = await this.getDataSharingPermission(permissionId)
      if (!permission || permission.userId !== userId) {
        throw new Error('Permission not found or access denied')
      }

      // Mark permission as inactive
      await this.updateDataSharingPermission(permissionId, { active: false })

      // Log revocation
      await this.logPrivacyChange(userId, 'access_denied', {
        settingType: 'data_sharing_permission_revoked',
        requestingParty: permission.granteeTo,
        purpose: permission.purpose
      })

      return true
    } catch (error) {
      console.error('Failed to revoke data sharing permission:', error)
      return false
    }
  }

  async getPrivacyAuditLog(userId: string, days: number = 30): Promise<PrivacyAuditLog[]> {
    try {
      const auditLogs = await this.getPrivacyAuditLogsFromDatabase(userId, days)
      return auditLogs
    } catch (error) {
      console.error('Failed to get privacy audit log:', error)
      return []
    }
  }

  getLocationPrivacyLevels(): LocationPrivacyLevel[] {
    return [
      {
        level: 'none',
        description: 'No location sharing',
        accuracy: 'No location data shared',
        dataShared: []
      },
      {
        level: 'static',
        description: 'Predefined location only',
        accuracy: 'Custom location label',
        dataShared: ['Custom address or label']
      },
      {
        level: 'approximate',
        description: 'General area (~100m radius)',
        accuracy: 'Within 100 meters',
        dataShared: ['Approximate coordinates', 'General address']
      },
      {
        level: 'precise',
        description: 'Exact GPS coordinates',
        accuracy: 'Within 3-5 meters',
        dataShared: ['Exact coordinates', 'Precise address', 'Altitude if available']
      }
    ]
  }

  private approximateLocation(locationData: any, radiusMeters: number): any {
    if (!locationData || !locationData.lat || !locationData.lng) {
      return null
    }

    // Add random offset within the specified radius
    const randomAngle = Math.random() * 2 * Math.PI
    const randomDistance = Math.random() * radiusMeters

    // Convert to approximate lat/lng offset (rough approximation)
    const latOffset = (randomDistance * Math.cos(randomAngle)) / 111320 // meters to degrees
    const lngOffset = (randomDistance * Math.sin(randomAngle)) / (111320 * Math.cos(locationData.lat * Math.PI / 180))

    return {
      lat: Math.round((locationData.lat + latOffset) * 1000) / 1000, // 3 decimal places (~100m precision)
      lng: Math.round((locationData.lng + lngOffset) * 1000) / 1000,
      address: this.generalizeAddress(locationData.address),
      accuracy: 'approximate'
    }
  }

  private generalizeAddress(address?: string): string {
    if (!address) return 'General area'

    // Remove specific building numbers and apartment numbers
    const generalizedAddress = address
      .replace(/\d+\s*[A-Za-z]?\s*(#|apt|apartment|unit|suite)\s*\d*[A-Za-z]?/gi, '')
      .replace(/^\d+\s+/, '')
      .trim()

    return generalizedAddress || 'General area'
  }

  private getEffectivePrivacyLevel(contactLevel: string, globalLevel: string): string {
    const levelHierarchy = ['none', 'static', 'approximate', 'precise']
    const contactIndex = levelHierarchy.indexOf(contactLevel)
    const globalIndex = levelHierarchy.indexOf(globalLevel)

    // Use the more restrictive (lower index) level
    return levelHierarchy[Math.min(contactIndex, globalIndex)]
  }

  private isStricterPrivacy(oldSettings: PrivacySettings, newSettings: PrivacySettings): boolean {
    const levelValues = { 'none': 0, 'static': 1, 'approximate': 2, 'precise': 3 }
    const visibilityValues = { 'none': 0, 'private': 1, 'contacts': 2, 'all': 2, 'public': 3 }

    return (
      levelValues[newSettings.locationSharing] < levelValues[oldSettings.locationSharing] ||
      !newSettings.medicalDataSharing && oldSettings.medicalDataSharing ||
      visibilityValues[newSettings.contactVisibility] < visibilityValues[oldSettings.contactVisibility] ||
      visibilityValues[newSettings.profileVisibility] < visibilityValues[oldSettings.profileVisibility]
    )
  }

  private validateContactPrivacySettings(settings: Partial<ContactPrivacySettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (settings.locationSharing && !['precise', 'approximate', 'static', 'none'].includes(settings.locationSharing)) {
      errors.push('Invalid location sharing level')
    }

    if (settings.alertPriority && !['high', 'medium', 'low'].includes(settings.alertPriority)) {
      errors.push('Invalid alert priority')
    }

    if (settings.staticLocationCoords) {
      const { lat, lng } = settings.staticLocationCoords
      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        errors.push('Invalid latitude for static location')
      }
      if (typeof lng !== 'number' || lng < -180 || lng > 180) {
        errors.push('Invalid longitude for static location')
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  private async validateDataSharingPermission(permission: DataSharingPermission): Promise<boolean> {
    try {
      // Check if data type is valid
      const validDataTypes = ['location', 'medical', 'contacts', 'profile']
      if (!validDataTypes.includes(permission.dataType)) {
        return false
      }

      // Check if expiration date is in the future
      if (permission.expiresAt && permission.expiresAt <= new Date()) {
        return false
      }

      // Additional validation logic here
      return true
    } catch (error) {
      return false
    }
  }

  private async logPrivacyChange(userId: string, action: PrivacyAuditLog['action'], details: PrivacyAuditLog['details']): Promise<void> {
    try {
      const auditLog: PrivacyAuditLog = {
        id: crypto.randomUUID(),
        userId,
        action,
        details,
        timestamp: new Date(),
        riskScore: this.calculateRiskScore(action, details)
      }

      await this.savePrivacyAuditLog(auditLog)
    } catch (error) {
      console.error('Failed to log privacy change:', error)
    }
  }

  private calculateRiskScore(action: PrivacyAuditLog['action'], details: PrivacyAuditLog['details']): number {
    let score = 0

    switch (action) {
      case 'settings_changed':
        score = 10
        break
      case 'data_shared':
        score = 20
        if (details.settingType === 'medical_data_sharing') score += 10
        break
      case 'access_granted':
        score = 15
        if (details.purpose === 'emergency') score -= 5
        break
      case 'access_denied':
        score = 5
        break
    }

    return Math.max(0, Math.min(100, score))
  }

  // Database operations (placeholder implementations)
  private async getPrivacySettingsFromDatabase(userId: string): Promise<PrivacySettings | null> {
    // Implementation would fetch from database
    return null
  }

  private async savePrivacySettings(userId: string, settings: PrivacySettings): Promise<void> {
    // Implementation would save to database
    console.log('Privacy settings saved for user:', userId)
  }

  private async getContactPrivacySettingsFromDatabase(userId: string, contactId: string): Promise<ContactPrivacySettings | null> {
    // Implementation would fetch from database
    return null
  }

  private async saveContactPrivacySettings(userId: string, contactId: string, settings: ContactPrivacySettings): Promise<void> {
    // Implementation would save to database
    console.log('Contact privacy settings saved:', userId, contactId)
  }

  private async saveDataSharingPermission(permission: DataSharingPermission): Promise<void> {
    // Implementation would save to database
    console.log('Data sharing permission saved:', permission.id)
  }

  private async getDataSharingPermission(permissionId: string): Promise<DataSharingPermission | null> {
    // Implementation would fetch from database
    return null
  }

  private async updateDataSharingPermission(permissionId: string, updates: Partial<DataSharingPermission>): Promise<void> {
    // Implementation would update in database
    console.log('Data sharing permission updated:', permissionId)
  }

  private async savePrivacyAuditLog(auditLog: PrivacyAuditLog): Promise<void> {
    // Implementation would save to database
    console.log('Privacy audit log saved:', auditLog.id)
  }

  private async getPrivacyAuditLogsFromDatabase(userId: string, days: number): Promise<PrivacyAuditLog[]> {
    // Implementation would fetch from database
    return []
  }
}

export default PrivacyControlService.getInstance()