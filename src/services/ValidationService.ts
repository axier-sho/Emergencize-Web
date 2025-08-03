'use client'

import { inputSanitizationService, ValidationResult } from './InputSanitizationService'

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'email' | 'coordinates' | 'url' | 'array'
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    allowedValues?: any[]
    custom?: (value: any) => ValidationResult
  }
}

export interface ValidationResults {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  sanitizedData: Record<string, any>
}

export interface EmergencyAlert {
  type: 'help' | 'danger'
  message: string
  fromUserId: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  contactIds?: string[]
  timestamp: string
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  bio?: string
  isPublic?: boolean
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalProfileId?: string
  privacySettings?: PrivacySettings
  onboardingCompleted?: boolean
}

export interface PrivacySettings {
  locationSharing: 'precise' | 'approximate' | 'static'
  medicalDataSharing: boolean
  contactVisibility: 'all' | 'contacts' | 'none'
  profileVisibility: 'public' | 'contacts' | 'private'
  dataRetentionDays: number
}

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

export interface SafeZone {
  name: string
  center: {
    lat: number
    lng: number
  }
  radiusMeters: number
  type: 'home' | 'work' | 'school' | 'hospital' | 'custom'
  description?: string
  isActive?: boolean
}

export interface ChatMessage {
  message: string
  fromUserId: string
  toUserId?: string
  chatId?: string
  timestamp: string
}

class ValidationService {
  private static instance: ValidationService
  
  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService()
    }
    return ValidationService.instance
  }
  
  /**
   * Emergency Alert validation schema
   */
  private readonly emergencyAlertSchema: ValidationSchema = {
    type: {
      type: 'string',
      required: true,
      allowedValues: ['help', 'danger']
    },
    message: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 500
    },
    fromUserId: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 128
    },
    'location.lat': {
      type: 'coordinates',
      required: false,
      min: -90,
      max: 90
    },
    'location.lng': {
      type: 'coordinates',
      required: false,
      min: -180,
      max: 180
    },
    'location.address': {
      type: 'string',
      required: false,
      maxLength: 200
    },
    contactIds: {
      type: 'array',
      required: false
    },
    timestamp: {
      type: 'string',
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    }
  }

  /**
   * User Profile validation schema
   */
  private readonly userProfileSchema: ValidationSchema = {
    uid: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 128
    },
    email: {
      type: 'email',
      required: true
    },
    displayName: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100
    },
    photoURL: {
      type: 'url',
      required: false,
      maxLength: 500
    },
    bio: {
      type: 'string',
      required: false,
      maxLength: 500
    },
    isPublic: {
      type: 'boolean',
      required: false
    },
    firstName: {
      type: 'string',
      required: false,
      minLength: 1,
      maxLength: 50
    },
    lastName: {
      type: 'string',
      required: false,
      minLength: 1,
      maxLength: 50
    },
    phone: {
      type: 'string',
      required: false,
      pattern: /^\+?[\d\s\-\(\)]{10,20}$/
    },
    address: {
      type: 'string',
      required: false,
      maxLength: 200
    },
    emergencyContactName: {
      type: 'string',
      required: false,
      minLength: 1,
      maxLength: 100
    },
    emergencyContactPhone: {
      type: 'string',
      required: false,
      pattern: /^\+?[\d\s\-\(\)]{10,20}$/
    },
    medicalProfileId: {
      type: 'string',
      required: false,
      maxLength: 128
    },
    onboardingCompleted: {
      type: 'boolean',
      required: false
    }
  }

  /**
   * Privacy Settings validation schema
   */
  private readonly privacySettingsSchema: ValidationSchema = {
    locationSharing: {
      type: 'string',
      required: true,
      allowedValues: ['precise', 'approximate', 'static']
    },
    medicalDataSharing: {
      type: 'boolean',
      required: true
    },
    contactVisibility: {
      type: 'string',
      required: true,
      allowedValues: ['all', 'contacts', 'none']
    },
    profileVisibility: {
      type: 'string',
      required: true,
      allowedValues: ['public', 'contacts', 'private']
    },
    dataRetentionDays: {
      type: 'number',
      required: true,
      min: 30,
      max: 3650
    }
  }

  /**
   * Medical Profile validation schema
   */
  private readonly medicalProfileSchema: ValidationSchema = {
    id: {
      type: 'string',
      required: true,
      maxLength: 128
    },
    userId: {
      type: 'string',
      required: true,
      maxLength: 128
    },
    bloodType: {
      type: 'string',
      required: false,
      allowedValues: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: {
      type: 'array',
      required: false,
      maxLength: 20
    },
    medications: {
      type: 'array',
      required: false,
      maxLength: 50
    },
    conditions: {
      type: 'array',
      required: false,
      maxLength: 20
    },
    'emergencyContact.name': {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100
    },
    'emergencyContact.relationship': {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 50
    },
    'emergencyContact.phone': {
      type: 'string',
      required: true,
      pattern: /^\+?[\d\s\-\(\)]{10,20}$/
    },
    'emergencyContact.email': {
      type: 'email',
      required: false
    },
    medicalNotes: {
      type: 'string',
      required: false,
      maxLength: 1000
    },
    encryptionVersion: {
      type: 'string',
      required: true,
      maxLength: 10
    }
  }

  /**
   * Medical Medication validation schema
   */
  private readonly medicalMedicationSchema: ValidationSchema = {
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100
    },
    dosage: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 50
    },
    frequency: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 50
    },
    prescribedBy: {
      type: 'string',
      required: false,
      maxLength: 100
    },
    critical: {
      type: 'boolean',
      required: true
    }
  }

  /**
   * Medical Condition validation schema
   */
  private readonly medicalConditionSchema: ValidationSchema = {
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100
    },
    severity: {
      type: 'string',
      required: true,
      allowedValues: ['low', 'medium', 'high', 'critical']
    },
    treatingPhysician: {
      type: 'string',
      required: false,
      maxLength: 100
    },
    notes: {
      type: 'string',
      required: false,
      maxLength: 500
    },
    active: {
      type: 'boolean',
      required: true
    }
  }

  /**
   * Safe Zone validation schema
   */
  private readonly safeZoneSchema: ValidationSchema = {
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100
    },
    'center.lat': {
      type: 'coordinates',
      required: true,
      min: -90,
      max: 90
    },
    'center.lng': {
      type: 'coordinates',
      required: true,
      min: -180,
      max: 180
    },
    radiusMeters: {
      type: 'number',
      required: true,
      min: 10,
      max: 5000
    },
    type: {
      type: 'string',
      required: true,
      allowedValues: ['home', 'work', 'school', 'hospital', 'custom']
    },
    description: {
      type: 'string',
      required: false,
      maxLength: 200
    },
    isActive: {
      type: 'boolean',
      required: false
    }
  }

  /**
   * Chat Message validation schema
   */
  private readonly chatMessageSchema: ValidationSchema = {
    message: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 1000
    },
    fromUserId: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 128
    },
    toUserId: {
      type: 'string',
      required: false,
      minLength: 1,
      maxLength: 128
    },
    chatId: {
      type: 'string',
      required: false,
      minLength: 1,
      maxLength: 128
    },
    timestamp: {
      type: 'string',
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    }
  }

  /**
   * Validate emergency alert data
   */
  validateEmergencyAlert(data: Partial<EmergencyAlert>): ValidationResults {
    return this.validate(data, this.emergencyAlertSchema)
  }

  /**
   * Validate user profile data
   */
  validateUserProfile(data: Partial<UserProfile>): ValidationResults {
    return this.validate(data, this.userProfileSchema)
  }

  /**
   * Validate safe zone data
   */
  validateSafeZone(data: Partial<SafeZone>): ValidationResults {
    return this.validate(data, this.safeZoneSchema)
  }

  /**
   * Validate chat message data
   */
  validateChatMessage(data: Partial<ChatMessage>): ValidationResults {
    return this.validate(data, this.chatMessageSchema)
  }

  /**
   * Validate privacy settings data
   */
  validatePrivacySettings(data: Partial<PrivacySettings>): ValidationResults {
    return this.validate(data, this.privacySettingsSchema)
  }

  /**
   * Validate medical profile data
   */
  validateMedicalProfile(data: Partial<MedicalProfile>): ValidationResults {
    return this.validate(data, this.medicalProfileSchema)
  }

  /**
   * Validate medical medication data
   */
  validateMedicalMedication(data: Partial<MedicalMedication>): ValidationResults {
    return this.validate(data, this.medicalMedicationSchema)
  }

  /**
   * Validate medical condition data
   */
  validateMedicalCondition(data: Partial<MedicalCondition>): ValidationResults {
    return this.validate(data, this.medicalConditionSchema)
  }

  /**
   * Validate onboarding step data
   */
  validateOnboardingStep(data: { stepId: string; data: any }): ValidationResults {
    const schemas: Record<string, ValidationSchema> = {
      profile: this.userProfileSchema,
      medical: this.medicalProfileSchema,
      privacy: this.privacySettingsSchema,
      safezones: this.safeZoneSchema
    }

    const schema = schemas[data.stepId]
    if (!schema) {
      return {
        isValid: true,
        errors: {},
        warnings: {},
        sanitizedData: data.data
      }
    }

    return this.validate(data.data, schema)
  }

  /**
   * Validate language code
   */
  validateLanguageCode(data: { languageCode: string }): ValidationResults {
    const schema: ValidationSchema = {
      languageCode: {
        type: 'string',
        required: true,
        pattern: /^[a-z]{2}(-[A-Z]{2})?$/,
        minLength: 2,
        maxLength: 5
      }
    }

    return this.validate(data, schema)
  }

  /**
   * Validate contact data
   */
  validateContact(data: any): ValidationResults {
    const schema: ValidationSchema = {
      contactUserId: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 128
      },
      nickname: {
        type: 'string',
        required: false,
        maxLength: 50
      },
      relationship: {
        type: 'string',
        required: false,
        maxLength: 30
      }
    }

    return this.validate(data, schema)
  }

  /**
   * Validate friend request data
   */
  validateFriendRequest(data: any): ValidationResults {
    const schema: ValidationSchema = {
      fromUserId: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 128
      },
      toUserId: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 128
      },
      fromUserEmail: {
        type: 'email',
        required: true
      },
      toUserEmail: {
        type: 'email',
        required: true
      },
      status: {
        type: 'string',
        required: true,
        allowedValues: ['pending', 'accepted', 'declined', 'blocked']
      }
    }

    return this.validate(data, schema)
  }

  /**
   * Validate socket message data
   */
  validateSocketMessage(messageType: string, data: any): ValidationResults {
    const schemas: Record<string, ValidationSchema> = {
      'emergency-alert': this.emergencyAlertSchema,
      'chat-message': this.chatMessageSchema,
      'user-status': {
        userId: {
          type: 'string',
          required: true,
          minLength: 1,
          maxLength: 128
        },
        status: {
          type: 'string',
          required: true,
          allowedValues: ['online', 'offline']
        }
      },
      'voice-call-offer': {
        to: {
          type: 'string',
          required: true,
          minLength: 1,
          maxLength: 128
        },
        offer: {
          type: 'string',
          required: true
        }
      },
      'voice-call-answer': {
        to: {
          type: 'string',
          required: true,
          minLength: 1,
          maxLength: 128
        },
        answer: {
          type: 'string',
          required: true
        }
      }
    }

    const schema = schemas[messageType]
    if (!schema) {
      return {
        isValid: false,
        errors: { general: ['Unknown message type'] },
        warnings: {},
        sanitizedData: {}
      }
    }

    return this.validate(data, schema)
  }

  /**
   * Core validation function
   */
  private validate(data: any, schema: ValidationSchema): ValidationResults {
    const errors: Record<string, string[]> = {}
    const warnings: Record<string, string[]> = {}
    const sanitizedData: Record<string, any> = {}

    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: { general: ['Data must be an object'] },
        warnings: {},
        sanitizedData: {}
      }
    }

    // Validate each field in the schema
    for (const [fieldPath, rules] of Object.entries(schema)) {
      const fieldValue = this.getNestedValue(data, fieldPath)
      const fieldErrors: string[] = []
      const fieldWarnings: string[] = []

      // Check if field is required
      if (rules.required && (fieldValue === undefined || fieldValue === null)) {
        fieldErrors.push('Field is required')
        continue
      }

      // Skip validation if field is not provided and not required
      if (fieldValue === undefined || fieldValue === null) {
        continue
      }

      // Type validation and sanitization
      let sanitizedValue: any = fieldValue

      switch (rules.type) {
        case 'string':
          if (typeof fieldValue !== 'string') {
            fieldErrors.push('Must be a string')
            break
          }

          const stringResult = inputSanitizationService.sanitizeString(fieldValue, {
            maxLength: rules.maxLength || 1000,
            trimWhitespace: true,
            normalizeSpaces: true
          })

          if (!stringResult.isValid) {
            fieldErrors.push(...stringResult.errors)
          }
          fieldWarnings.push(...stringResult.warnings)
          sanitizedValue = stringResult.sanitizedValue

          // Length validation
          if (rules.minLength && sanitizedValue.length < rules.minLength) {
            fieldErrors.push(`Must be at least ${rules.minLength} characters`)
          }
          if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
            fieldErrors.push(`Must be no more than ${rules.maxLength} characters`)
          }

          // Pattern validation
          if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
            fieldErrors.push('Invalid format')
          }

          // Allowed values validation
          if (rules.allowedValues && !rules.allowedValues.includes(sanitizedValue)) {
            fieldErrors.push(`Must be one of: ${rules.allowedValues.join(', ')}`)
          }
          break

        case 'email':
          const emailResult = inputSanitizationService.sanitizeEmail(fieldValue)
          if (!emailResult.isValid) {
            fieldErrors.push(...emailResult.errors)
          }
          fieldWarnings.push(...emailResult.warnings)
          sanitizedValue = emailResult.sanitizedValue
          break

        case 'number':
          if (typeof fieldValue !== 'number' || !isFinite(fieldValue)) {
            fieldErrors.push('Must be a valid number')
            break
          }

          if (rules.min !== undefined && fieldValue < rules.min) {
            fieldErrors.push(`Must be at least ${rules.min}`)
          }
          if (rules.max !== undefined && fieldValue > rules.max) {
            fieldErrors.push(`Must be no more than ${rules.max}`)
          }

          sanitizedValue = fieldValue
          break

        case 'coordinates':
          if (typeof fieldValue !== 'number' || !isFinite(fieldValue)) {
            fieldErrors.push('Must be a valid coordinate')
            break
          }

          if (rules.min !== undefined && fieldValue < rules.min) {
            fieldErrors.push(`Coordinate out of range (min: ${rules.min})`)
          }
          if (rules.max !== undefined && fieldValue > rules.max) {
            fieldErrors.push(`Coordinate out of range (max: ${rules.max})`)
          }

          // Round to 6 decimal places for precision
          sanitizedValue = Math.round(fieldValue * 1000000) / 1000000
          break

        case 'boolean':
          if (typeof fieldValue !== 'boolean') {
            fieldErrors.push('Must be a boolean')
            break
          }
          sanitizedValue = fieldValue
          break

        case 'url':
          if (typeof fieldValue !== 'string') {
            fieldErrors.push('Must be a string')
            break
          }

          const urlResult = inputSanitizationService.sanitizeUrl(fieldValue)
          if (!urlResult.isValid) {
            fieldErrors.push(...urlResult.errors)
          }
          fieldWarnings.push(...urlResult.warnings)
          sanitizedValue = urlResult.sanitizedValue
          break

        case 'array':
          if (!Array.isArray(fieldValue)) {
            fieldErrors.push('Must be an array')
            break
          }

          // Validate array length
          if (rules.minLength && fieldValue.length < rules.minLength) {
            fieldErrors.push(`Array must have at least ${rules.minLength} items`)
          }
          if (rules.maxLength && fieldValue.length > rules.maxLength) {
            fieldErrors.push(`Array must have no more than ${rules.maxLength} items`)
          }

          // Basic sanitization for array of strings
          if (fieldValue.every(item => typeof item === 'string')) {
            sanitizedValue = fieldValue.map(item => {
              const result = inputSanitizationService.sanitizeString(item, { maxLength: 100 })
              return result.sanitizedValue
            })
          } else {
            sanitizedValue = fieldValue
          }
          break

        default:
          fieldErrors.push('Unknown field type')
      }

      // Custom validation
      if (rules.custom && fieldErrors.length === 0) {
        const customResult = rules.custom(sanitizedValue)
        if (!customResult.isValid) {
          fieldErrors.push(...customResult.errors)
        }
        fieldWarnings.push(...customResult.warnings)
      }

      // Store results
      if (fieldErrors.length > 0) {
        errors[fieldPath] = fieldErrors
      }
      if (fieldWarnings.length > 0) {
        warnings[fieldPath] = fieldWarnings
      }

      this.setNestedValue(sanitizedData, fieldPath, sanitizedValue)
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      sanitizedData
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()
    
    if (!lastKey) return

    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }
      return current[key]
    }, obj)

    target[lastKey] = value
  }

  /**
   * Validate rate limiting data
   */
  validateRateLimit(userId: string, action: string): boolean {
    // This would integrate with actual rate limiting service
    // For now, basic validation
    return typeof userId === 'string' && 
           userId.length > 0 && 
           typeof action === 'string' && 
           action.length > 0
  }

  /**
   * Validate Firebase timestamp
   */
  validateTimestamp(timestamp: any): ValidationResult {
    const errors: string[] = []
    
    if (!timestamp) {
      errors.push('Timestamp is required')
      return { isValid: false, sanitizedValue: '', errors, warnings: [] }
    }

    // Check if it's a valid ISO string or Date object
    let date: Date | null = null;
    try {
      date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        errors.push('Invalid timestamp format')
        date = null;
      }
    } catch (error) {
      errors.push('Invalid timestamp')
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: date ? date.toISOString() : '',
      errors,
      warnings: []
    }
  }

  /**
   * Validate emergency group data
   */
  validateEmergencyGroup(data: any): ValidationResults {
    const schema: ValidationSchema = {
      name: {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 100
      },
      type: {
        type: 'string',
        required: true,
        allowedValues: ['family', 'work', 'neighborhood', 'custom']
      },
      admins: {
        type: 'array',
        required: true,
        minLength: 1,
        maxLength: 10
      },
      members: {
        type: 'array',
        required: true,
        maxLength: 100
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 500
      }
    }

    return this.validate(data, schema)
  }
}

// Export both the class and an instance for flexibility
export { ValidationService }
export const validationService = new ValidationService()