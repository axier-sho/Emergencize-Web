import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'

export interface MedicalProfile {
  id: string
  userId: string
  bloodType?: string
  allergies: string[]
  medications: MedicalMedication[]
  conditions: MedicalCondition[]
  emergencyContact: EmergencyMedicalContact
  insuranceInfo?: InsuranceInformation
  doctorInfo?: DoctorInformation
  medicalNotes?: string
  lastUpdated: Date
  encryptionVersion: string
}

export interface MedicalMedication {
  name: string
  dosage: string
  frequency: string
  prescribedBy?: string
  startDate?: Date
  endDate?: Date
  critical: boolean
}

export interface MedicalCondition {
  name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  diagnosed: Date
  treatingPhysician?: string
  notes?: string
  active: boolean
}

export interface EmergencyMedicalContact {
  name: string
  relationship: string
  phone: string
  email?: string
  address?: string
}

export interface InsuranceInformation {
  provider: string
  policyNumber: string
  groupNumber?: string
  memberName: string
  effectiveDate?: Date
  expirationDate?: Date
}

export interface DoctorInformation {
  name: string
  specialty: string
  phone: string
  email?: string
  address?: string
  hospitalAffiliation?: string
}

export interface EncryptedMedicalData {
  encryptedData: string
  iv: string
  salt: string
  version: string
  timestamp: Date
}

export interface MedicalDataAccess {
  accessId: string
  userId: string
  requestedBy: string
  accessType: 'view' | 'emergency' | 'share'
  timestamp: Date
  approved: boolean
  expiresAt?: Date
  purpose: string
}

export class MedicalDataService {
  private static instance: MedicalDataService
  private encryptionKey: CryptoKey | null = null
  private readonly ENCRYPTION_ALGORITHM = 'AES-GCM'
  private readonly KEY_LENGTH = 256
  private readonly IV_LENGTH = 12
  private readonly SALT_LENGTH = 16
  private readonly CURRENT_VERSION = '1.0'

  private constructor() {
    this.initializeEncryption()
  }

  static getInstance(): MedicalDataService {
    if (!MedicalDataService.instance) {
      MedicalDataService.instance = new MedicalDataService()
    }
    return MedicalDataService.instance
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      const keyData = await this.getOrGenerateEncryptionKey()
      this.encryptionKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: this.ENCRYPTION_ALGORITHM, length: this.KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
      )

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'medical_encryption_initialized',
        severity: 'medium',
        details: {
          algorithm: this.ENCRYPTION_ALGORITHM,
          keyLength: this.KEY_LENGTH,
          version: this.CURRENT_VERSION
        },
        userId: 'system',
        timestamp: new Date(),
        riskScore: 20
      })
    } catch (error) {
      console.error('Failed to initialize medical data encryption:', error)
      throw new Error('Medical data encryption initialization failed')
    }
  }

  private async getOrGenerateEncryptionKey(): Promise<ArrayBuffer> {
    try {
      // In a real application, this would be derived from user credentials
      // or retrieved from a secure key management service
      const keyData = crypto.getRandomValues(new Uint8Array(this.KEY_LENGTH / 8))
      return keyData.buffer
    } catch (error) {
      console.error('Failed to generate encryption key:', error)
      throw new Error('Encryption key generation failed')
    }
  }

  async encryptMedicalData(medicalProfile: MedicalProfile): Promise<EncryptedMedicalData> {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption()
      }

      // Validate medical data before encryption
      const validationResult = ValidationService.validateMedicalProfile(medicalProfile)
      if (!validationResult.isValid) {
        throw new Error(`Invalid medical data: ${validationResult.errors.join(', ')}`)
      }

      // Generate salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH))
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))

      // Serialize medical data
      const dataString = JSON.stringify(medicalProfile)
      const dataBuffer = new TextEncoder().encode(dataString)

      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ENCRYPTION_ALGORITHM,
          iv: iv
        },
        this.encryptionKey!,
        dataBuffer
      )

      const encryptedData: EncryptedMedicalData = {
        encryptedData: this.arrayBufferToBase64(encryptedBuffer),
        iv: this.arrayBufferToBase64(iv.buffer),
        salt: this.arrayBufferToBase64(salt.buffer),
        version: this.CURRENT_VERSION,
        timestamp: new Date()
      }

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'medical_data_encrypted',
        severity: 'medium',
        details: {
          userId: medicalProfile.userId,
          dataSize: dataString.length,
          version: this.CURRENT_VERSION
        },
        userId: medicalProfile.userId,
        timestamp: new Date(),
        riskScore: 15
      })

      return encryptedData
    } catch (error) {
      console.error('Failed to encrypt medical data:', error)
      throw new Error('Medical data encryption failed')
    }
  }

  async decryptMedicalData(encryptedData: EncryptedMedicalData): Promise<MedicalProfile> {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption()
      }

      // Convert base64 strings back to ArrayBuffers
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.encryptedData)
      const iv = this.base64ToArrayBuffer(encryptedData.iv)

      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ENCRYPTION_ALGORITHM,
          iv: iv
        },
        this.encryptionKey!,
        encryptedBuffer
      )

      // Convert back to string and parse
      const decryptedString = new TextDecoder().decode(decryptedBuffer)
      const medicalProfile = JSON.parse(decryptedString) as MedicalProfile

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'medical_data_decrypted',
        severity: 'high',
        details: {
          userId: medicalProfile.userId,
          version: encryptedData.version,
          accessReason: 'data_retrieval'
        },
        userId: medicalProfile.userId,
        timestamp: new Date(),
        riskScore: 25
      })

      return medicalProfile
    } catch (error) {
      console.error('Failed to decrypt medical data:', error)
      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'medical_data_decryption_failed',
        severity: 'critical',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          version: encryptedData.version
        },
        userId: 'unknown',
        timestamp: new Date(),
        riskScore: 80
      })
      throw new Error('Medical data decryption failed')
    }
  }

  async createMedicalProfile(userId: string, medicalData: Partial<MedicalProfile>): Promise<string> {
    try {
      const medicalProfile: MedicalProfile = {
        id: crypto.randomUUID(),
        userId,
        bloodType: medicalData.bloodType,
        allergies: medicalData.allergies || [],
        medications: medicalData.medications || [],
        conditions: medicalData.conditions || [],
        emergencyContact: medicalData.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        insuranceInfo: medicalData.insuranceInfo,
        doctorInfo: medicalData.doctorInfo,
        medicalNotes: medicalData.medicalNotes,
        lastUpdated: new Date(),
        encryptionVersion: this.CURRENT_VERSION
      }

      // Encrypt and store medical profile
      const encryptedData = await this.encryptMedicalData(medicalProfile)
      
      // In a real app, save to secure database
      await this.saveMedicalProfileToDatabase(medicalProfile.id, encryptedData)

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'medical_profile_created',
        severity: 'medium',
        details: {
          profileId: medicalProfile.id,
          userId,
          hasAllergies: medicalProfile.allergies.length > 0,
          hasMedications: medicalProfile.medications.length > 0,
          hasConditions: medicalProfile.conditions.length > 0
        },
        userId,
        timestamp: new Date(),
        riskScore: 20
      })

      return medicalProfile.id
    } catch (error) {
      console.error('Failed to create medical profile:', error)
      throw new Error('Medical profile creation failed')
    }
  }

  async updateMedicalProfile(profileId: string, updates: Partial<MedicalProfile>): Promise<boolean> {
    try {
      // Retrieve and decrypt existing profile
      const encryptedData = await this.getMedicalProfileFromDatabase(profileId)
      const existingProfile = await this.decryptMedicalData(encryptedData)

      // Apply updates
      const updatedProfile: MedicalProfile = {
        ...existingProfile,
        ...updates,
        id: profileId,
        lastUpdated: new Date()
      }

      // Re-encrypt and save
      const newEncryptedData = await this.encryptMedicalData(updatedProfile)
      await this.saveMedicalProfileToDatabase(profileId, newEncryptedData)

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'medical_profile_updated',
        severity: 'medium',
        details: {
          profileId,
          userId: updatedProfile.userId,
          updatedFields: Object.keys(updates)
        },
        userId: updatedProfile.userId,
        timestamp: new Date(),
        riskScore: 25
      })

      return true
    } catch (error) {
      console.error('Failed to update medical profile:', error)
      return false
    }
  }

  async getMedicalProfile(profileId: string, requestingUserId: string): Promise<MedicalProfile | null> {
    try {
      // Check access permissions
      const hasAccess = await this.checkMedicalDataAccess(profileId, requestingUserId)
      if (!hasAccess) {
        SecurityMonitoringService.getInstance().logSecurityEvent({
          type: 'medical_data_access_denied',
          severity: 'high',
          details: {
            profileId,
            requestingUserId,
            reason: 'insufficient_permissions'
          },
          userId: requestingUserId,
          timestamp: new Date(),
          riskScore: 60
        })
        throw new Error('Access denied to medical data')
      }

      const encryptedData = await this.getMedicalProfileFromDatabase(profileId)
      const medicalProfile = await this.decryptMedicalData(encryptedData)

      // Log access
      await this.logMedicalDataAccess({
        accessId: crypto.randomUUID(),
        userId: medicalProfile.userId,
        requestedBy: requestingUserId,
        accessType: 'view',
        timestamp: new Date(),
        approved: true,
        purpose: 'profile_retrieval'
      })

      return medicalProfile
    } catch (error) {
      console.error('Failed to get medical profile:', error)
      return null
    }
  }

  async getEmergencyMedicalInfo(userId: string): Promise<Partial<MedicalProfile> | null> {
    try {
      // Get user's medical profile
      const profileId = await this.getUserMedicalProfileId(userId)
      if (!profileId) return null

      const encryptedData = await this.getMedicalProfileFromDatabase(profileId)
      const medicalProfile = await this.decryptMedicalData(encryptedData)

      // Return only critical emergency information
      const emergencyInfo: Partial<MedicalProfile> = {
        bloodType: medicalProfile.bloodType,
        allergies: medicalProfile.allergies,
        medications: medicalProfile.medications.filter(med => med.critical),
        conditions: medicalProfile.conditions.filter(cond => cond.severity === 'critical' || cond.severity === 'high'),
        emergencyContact: medicalProfile.emergencyContact
      }

      // Log emergency access
      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'emergency_medical_access',
        severity: 'high',
        details: {
          userId,
          profileId,
          accessType: 'emergency_info'
        },
        userId,
        timestamp: new Date(),
        riskScore: 40
      })

      await this.logMedicalDataAccess({
        accessId: crypto.randomUUID(),
        userId,
        requestedBy: 'emergency_system',
        accessType: 'emergency',
        timestamp: new Date(),
        approved: true,
        purpose: 'emergency_alert'
      })

      return emergencyInfo
    } catch (error) {
      console.error('Failed to get emergency medical info:', error)
      return null
    }
  }

  async deleteMedicalProfile(profileId: string, userId: string): Promise<boolean> {
    try {
      // Verify ownership
      const encryptedData = await this.getMedicalProfileFromDatabase(profileId)
      const medicalProfile = await this.decryptMedicalData(encryptedData)

      if (medicalProfile.userId !== userId) {
        throw new Error('Access denied: Not profile owner')
      }

      // Delete from database
      await this.deleteMedicalProfileFromDatabase(profileId)

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'medical_profile_deleted',
        severity: 'high',
        details: {
          profileId,
          userId
        },
        userId,
        timestamp: new Date(),
        riskScore: 30
      })

      return true
    } catch (error) {
      console.error('Failed to delete medical profile:', error)
      return false
    }
  }

  private async checkMedicalDataAccess(profileId: string, requestingUserId: string): Promise<boolean> {
    try {
      // Check if user owns the profile
      const encryptedData = await this.getMedicalProfileFromDatabase(profileId)
      const medicalProfile = await this.decryptMedicalData(encryptedData)

      if (medicalProfile.userId === requestingUserId) {
        return true
      }

      // Check if user has been granted access (emergency contacts, etc.)
      const hasAccess = await this.checkGrantedAccess(profileId, requestingUserId)
      return hasAccess
    } catch (error) {
      console.error('Failed to check medical data access:', error)
      return false
    }
  }

  private async checkGrantedAccess(profileId: string, requestingUserId: string): Promise<boolean> {
    // Implementation would check database for granted access
    // For now, return false (owner-only access)
    return false
  }

  private async logMedicalDataAccess(access: MedicalDataAccess): Promise<void> {
    try {
      // Store access log in secure audit trail
      console.log('Medical data access logged:', access)
    } catch (error) {
      console.error('Failed to log medical data access:', error)
    }
  }

  private async getUserMedicalProfileId(userId: string): Promise<string | null> {
    // Implementation would query database for user's medical profile ID
    return `medical_profile_${userId}`
  }

  private async saveMedicalProfileToDatabase(profileId: string, encryptedData: EncryptedMedicalData): Promise<void> {
    // Implementation would save to secure database
    console.log('Medical profile saved:', profileId)
  }

  private async getMedicalProfileFromDatabase(profileId: string): Promise<EncryptedMedicalData> {
    // Implementation would retrieve from secure database
    throw new Error('Medical profile not found')
  }

  private async deleteMedicalProfileFromDatabase(profileId: string): Promise<void> {
    // Implementation would delete from secure database
    console.log('Medical profile deleted:', profileId)
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  // Utility methods for blood type validation
  static getValidBloodTypes(): string[] {
    return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  }

  static isValidBloodType(bloodType: string): boolean {
    return this.getValidBloodTypes().includes(bloodType)
  }

  // Utility methods for medical condition severity
  static getSeverityLevels(): Array<{ value: string; label: string }> {
    return [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' }
    ]
  }
}

export default MedicalDataService.getInstance()