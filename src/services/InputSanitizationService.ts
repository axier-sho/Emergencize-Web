'use client'

export interface SanitizationOptions {
  allowHtml?: boolean
  maxLength?: number
  allowedTags?: string[]
  allowedAttributes?: string[]
  trimWhitespace?: boolean
  normalizeSpaces?: boolean
}

export interface ValidationResult {
  isValid: boolean
  sanitizedValue: string
  errors: string[]
  warnings: string[]
}

class InputSanitizationService {
  private readonly dangerousPatterns = [
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    
    // JavaScript execution patterns
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi, // onclick, onload, etc.
    
    // SQL injection patterns (for completeness)
    /('|(\\')|;|(%3B)|(%27)|(\x27))/gi,
    /((%3D)|=)[^\n]*((%27)|(\')|;|(%3B))/gi,
    /\w*((%27)|(\'))((o|(%4F)|(%6F)))((%72)|r|(%52))/gi,
    
    // Command injection patterns
    /[;&|`$()\[\]{}]/gi,
    
    // Path traversal patterns
    /\.\.\//gi,
    /\.\.\\/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi
  ]

  private readonly htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }

  private readonly allowedHtmlTags = [
    'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span'
  ]

  private readonly allowedAttributes = [
    'class', 'id'
  ]

  /**
   * Sanitize a string value with comprehensive protection
   */
  sanitizeString(
    value: string, 
    options: SanitizationOptions = {}
  ): ValidationResult {
    const {
      allowHtml = false,
      maxLength = 1000,
      allowedTags = this.allowedHtmlTags,
      allowedAttributes = this.allowedAttributes,
      trimWhitespace = true,
      normalizeSpaces = true
    } = options

    const errors: string[] = []
    const warnings: string[] = []
    let sanitized = value

    // Input validation
    if (typeof value !== 'string') {
      errors.push('Input must be a string')
      return {
        isValid: false,
        sanitizedValue: '',
        errors,
        warnings
      }
    }

    // Trim whitespace if requested
    if (trimWhitespace) {
      sanitized = sanitized.trim()
    }

    // Normalize spaces if requested
    if (normalizeSpaces) {
      sanitized = sanitized.replace(/\s+/g, ' ')
    }

    // Check length
    if (sanitized.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength} characters`)
      sanitized = sanitized.substring(0, maxLength)
      warnings.push('Input was truncated to maximum length')
    }

    // Check for dangerous patterns
    const foundPatterns = this.dangerousPatterns.filter(pattern => 
      pattern.test(sanitized)
    )

    if (foundPatterns.length > 0) {
      errors.push('Input contains potentially dangerous content')
      // Remove dangerous patterns
      foundPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '')
      })
      warnings.push('Dangerous content was removed')
    }

    // Handle HTML
    if (allowHtml) {
      sanitized = this.sanitizeHtml(sanitized, allowedTags, allowedAttributes)
    } else {
      sanitized = this.escapeHtml(sanitized)
    }

    // Final validation
    const isValid = errors.length === 0

    return {
      isValid,
      sanitizedValue: sanitized,
      errors,
      warnings
    }
  }

  /**
   * Sanitize email addresses
   */
  sanitizeEmail(email: string): ValidationResult {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const sanitized = email.toLowerCase().trim()
    
    const errors: string[] = []
    const warnings: string[] = []

    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format')
    }

    if (sanitized.length > 254) {
      errors.push('Email address too long')
    }

    // Check for dangerous characters
    if (/[<>'"\\]/.test(sanitized)) {
      errors.push('Email contains invalid characters')
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors,
      warnings
    }
  }

  /**
   * Sanitize emergency alert messages
   */
  sanitizeAlertMessage(message: string): ValidationResult {
    return this.sanitizeString(message, {
      allowHtml: false,
      maxLength: 500,
      trimWhitespace: true,
      normalizeSpaces: true
    })
  }

  /**
   * Sanitize chat messages
   */
  sanitizeChatMessage(message: string): ValidationResult {
    return this.sanitizeString(message, {
      allowHtml: false,
      maxLength: 1000,
      trimWhitespace: true,
      normalizeSpaces: true
    })
  }

  /**
   * Sanitize user profile data
   */
  sanitizeUserProfile(profile: {
    displayName?: string
    bio?: string
    location?: string
  }): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {}

    if (profile.displayName) {
      results.displayName = this.sanitizeString(profile.displayName, {
        allowHtml: false,
        maxLength: 100,
        trimWhitespace: true,
        normalizeSpaces: true
      })
    }

    if (profile.bio) {
      results.bio = this.sanitizeString(profile.bio, {
        allowHtml: false,
        maxLength: 500,
        trimWhitespace: true,
        normalizeSpaces: true
      })
    }

    if (profile.location) {
      results.location = this.sanitizeString(profile.location, {
        allowHtml: false,
        maxLength: 200,
        trimWhitespace: true,
        normalizeSpaces: true
      })
    }

    return results
  }

  /**
   * Sanitize location coordinates
   */
  sanitizeCoordinates(lat: number, lng: number): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      errors.push('Coordinates must be numbers')
    }

    if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90')
    }

    if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180')
    }

    // Round to reasonable precision (6 decimal places ≈ 0.1 meter accuracy)
    const sanitizedLat = Math.round(lat * 1000000) / 1000000
    const sanitizedLng = Math.round(lng * 1000000) / 1000000

    return {
      isValid: errors.length === 0,
      sanitizedValue: `${sanitizedLat},${sanitizedLng}`,
      errors,
      warnings
    }
  }

  /**
   * Sanitize file names
   */
  sanitizeFileName(fileName: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Remove path traversal attempts
    let sanitized = fileName.replace(/[\/\\]/g, '')
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '')
    
    // Ensure file extension is safe
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx']
    const extension = sanitized.toLowerCase().substring(sanitized.lastIndexOf('.'))
    
    if (!allowedExtensions.includes(extension)) {
      errors.push('File type not allowed')
    }

    if (sanitized.length > 255) {
      errors.push('File name too long')
      sanitized = sanitized.substring(0, 255)
      warnings.push('File name was truncated')
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors,
      warnings
    }
  }

  /**
   * Sanitize URLs
   */
  sanitizeUrl(url: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    try {
      const urlObj = new URL(url)
      
      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:']
      if (!allowedProtocols.includes(urlObj.protocol)) {
        errors.push('URL protocol not allowed')
      }

      // Check for suspicious patterns
      if (urlObj.hostname.includes('..') || urlObj.pathname.includes('..')) {
        errors.push('URL contains suspicious patterns')
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue: urlObj.toString(),
        errors,
        warnings
      }
    } catch (error) {
      errors.push('Invalid URL format')
      return {
        isValid: false,
        sanitizedValue: '',
        errors,
        warnings
      }
    }
  }

  /**
   * Bulk sanitization for socket messages
   */
  sanitizeSocketMessage(message: Record<string, any>): {
    isValid: boolean
    sanitizedMessage: Record<string, any>
    errors: string[]
    warnings: string[]
  } {
    const sanitizedMessage: Record<string, any> = {}
    const allErrors: string[] = []
    const allWarnings: string[] = []

    for (const [key, value] of Object.entries(message)) {
      if (typeof value === 'string') {
        const result = this.sanitizeString(value, {
          allowHtml: false,
          maxLength: 1000,
          trimWhitespace: true
        })
        
        sanitizedMessage[key] = result.sanitizedValue
        allErrors.push(...result.errors.map(e => `${key}: ${e}`))
        allWarnings.push(...result.warnings.map(w => `${key}: ${w}`))
      } else if (typeof value === 'number') {
        if (isFinite(value)) {
          sanitizedMessage[key] = value
        } else {
          allErrors.push(`${key}: Invalid number`)
        }
      } else if (typeof value === 'boolean') {
        sanitizedMessage[key] = value
      } else if (Array.isArray(value)) {
        // Sanitize array elements (strings only)
        sanitizedMessage[key] = value
          .filter(item => typeof item === 'string')
          .map(item => {
            const result = this.sanitizeString(item, { maxLength: 100 })
            allErrors.push(...result.errors.map(e => `${key}[]: ${e}`))
            allWarnings.push(...result.warnings.map(w => `${key}[]: ${w}`))
            return result.sanitizedValue
          })
      } else {
        allWarnings.push(`${key}: Unsupported data type, skipped`)
      }
    }

    return {
      isValid: allErrors.length === 0,
      sanitizedMessage,
      errors: allErrors,
      warnings: allWarnings
    }
  }

  /**
   * Private method to escape HTML
   */
  private escapeHtml(text: string): string {
    return text.replace(/[&<>"'`=\/]/g, (char) => this.htmlEntities[char] || char)
  }

  /**
   * Private method to sanitize HTML (basic implementation)
   */
  private sanitizeHtml(
    html: string, 
    allowedTags: string[], 
    allowedAttributes: string[]
  ): string {
    // This is a basic implementation. For production, consider using a library like DOMPurify
    let sanitized = html

    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Remove dangerous attributes
    sanitized = sanitized.replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    sanitized = sanitized.replace(/javascript:/gi, '')
    
    // Keep only allowed tags (basic implementation)
    const tagRegex = /<\/?([a-zA-Z0-9]+)(\s+[^>]*)?>/g
    sanitized = sanitized.replace(tagRegex, (match, tagName, attributes) => {
      if (!allowedTags.includes(tagName.toLowerCase())) {
        return ''
      }
      
      // Clean attributes (basic implementation)
      if (attributes) {
        const cleanAttributes = attributes.replace(/\s+(on\w+|javascript:|data-)[^=]*=[^>\s]*/gi, '')
        return `<${tagName}${cleanAttributes}>`
      }
      
      return match
    })

    return sanitized
  }

  /**
   * Generate security report for monitoring
   */
  generateSecurityReport(
    operations: Array<{
      type: string
      input: string
      result: ValidationResult
      timestamp: Date
    }>
  ): {
    totalOperations: number
    validOperations: number
    invalidOperations: number
    commonErrors: Record<string, number>
    riskLevel: 'low' | 'medium' | 'high'
  } {
    const totalOperations = operations.length
    const validOperations = operations.filter(op => op.result.isValid).length
    const invalidOperations = totalOperations - validOperations

    const commonErrors: Record<string, number> = {}
    operations.forEach(op => {
      op.result.errors.forEach(error => {
        commonErrors[error] = (commonErrors[error] || 0) + 1
      })
    })

    const invalidPercentage = (invalidOperations / totalOperations) * 100
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    
    if (invalidPercentage > 50) {
      riskLevel = 'high'
    } else if (invalidPercentage > 20) {
      riskLevel = 'medium'
    }

    return {
      totalOperations,
      validOperations,
      invalidOperations,
      commonErrors,
      riskLevel
    }
  }
}

export const inputSanitizationService = new InputSanitizationService()