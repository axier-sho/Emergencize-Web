import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'

export interface SupportedLanguage {
  code: string
  name: string
  nativeName: string
  rtl: boolean
  flag: string
}

export interface TranslationContent {
  [key: string]: string | TranslationContent
}

export interface Translations {
  [languageCode: string]: TranslationContent
}

export class LocalizationService {
  private static instance: LocalizationService
  private currentLanguage: string = 'en'
  private fallbackLanguage: string = 'en'
  private translations: Translations = {}
  private supportedLanguages: SupportedLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false, flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false, flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', rtl: false, flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false, flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false, flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false, flag: '🇵🇹' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false, flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false, flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false, flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, flag: '🇸🇦' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true, flag: '🇮🇱' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false, flag: '🇮🇳' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false, flag: '🇷🇺' }
  ]

  private constructor() {
    this.initializeTranslations()
    this.detectBrowserLanguage()
  }

  static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService()
    }
    return LocalizationService.instance
  }

  private initializeTranslations(): void {
    this.translations = {
      en: {
        common: {
          emergency: 'Emergency',
          help: 'Help',
          danger: 'Danger',
          location: 'Location',
          contacts: 'Contacts',
          settings: 'Settings',
          profile: 'Profile',
          signIn: 'Sign In',
          signUp: 'Sign Up',
          logout: 'Logout',
          cancel: 'Cancel',
          save: 'Save',
          delete: 'Delete',
          edit: 'Edit',
          send: 'Send',
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          warning: 'Warning',
          continue: 'Continue',
          back: 'Back',
          next: 'Next',
          finish: 'Finish',
          skip: 'Skip'
        },
        navigation: {
          dashboard: 'Dashboard',
          alerts: 'Alerts',
          geofencing: 'Safe Zones',
          medical: 'Medical Info',
          privacy: 'Privacy',
          notifications: 'Notifications',
          onboarding: 'Setup'
        },
        alerts: {
          sendHelpAlert: 'Send Help Alert',
          sendDangerAlert: 'Send Danger Alert',
          alertSent: 'Alert sent successfully',
          alertFailed: 'Failed to send alert',
          helpDescription: 'Non-critical assistance request',
          dangerDescription: 'Critical emergency situation',
          locationShared: 'Location will be shared with your contacts',
          medicalInfoIncluded: 'Medical information will be included'
        },
        onboarding: {
          welcome: 'Welcome to Emergencize',
          subtitle: 'Your personal emergency alert system',
          setupProfile: 'Setup Your Profile',
          addContacts: 'Add Emergency Contacts',
          configureSafeZones: 'Configure Safe Zones',
          medicalInfo: 'Medical Information',
          privacySettings: 'Privacy Settings',
          testSystem: 'Test Your System',
          allSetup: 'You\'re all set!',
          getStarted: 'Get Started'
        },
        medical: {
          bloodType: 'Blood Type',
          allergies: 'Allergies',
          medications: 'Current Medications',
          conditions: 'Medical Conditions',
          emergencyContact: 'Emergency Medical Contact',
          insuranceInfo: 'Insurance Information',
          doctorInfo: 'Primary Doctor',
          medicalNotes: 'Additional Medical Notes'
        },
        privacy: {
          locationSharing: 'Location Sharing',
          preciseLocation: 'Precise GPS coordinates',
          approximateLocation: 'Approximate area only',
          staticLocation: 'Predefined address only',
          medicalDataSharing: 'Medical Data Sharing',
          contactVisibility: 'Contact Visibility',
          dataRetention: 'Data Retention Settings'
        },
        errors: {
          networkError: 'Network connection error',
          authError: 'Authentication failed',
          locationError: 'Unable to access location',
          permissionDenied: 'Permission denied',
          invalidInput: 'Invalid input provided',
          serverError: 'Server error occurred'
        }
      },
      es: {
        common: {
          emergency: 'Emergencia',
          help: 'Ayuda',
          danger: 'Peligro',
          location: 'Ubicación',
          contacts: 'Contactos',
          settings: 'Configuración',
          profile: 'Perfil',
          signIn: 'Iniciar Sesión',
          signUp: 'Registrarse',
          logout: 'Cerrar Sesión',
          cancel: 'Cancelar',
          save: 'Guardar',
          delete: 'Eliminar',
          edit: 'Editar',
          send: 'Enviar',
          loading: 'Cargando...',
          error: 'Error',
          success: 'Éxito',
          warning: 'Advertencia',
          continue: 'Continuar',
          back: 'Atrás',
          next: 'Siguiente',
          finish: 'Finalizar',
          skip: 'Omitir'
        },
        navigation: {
          dashboard: 'Panel',
          alerts: 'Alertas',
          geofencing: 'Zonas Seguras',
          medical: 'Info Médica',
          privacy: 'Privacidad',
          notifications: 'Notificaciones',
          onboarding: 'Configuración'
        },
        alerts: {
          sendHelpAlert: 'Enviar Alerta de Ayuda',
          sendDangerAlert: 'Enviar Alerta de Peligro',
          alertSent: 'Alerta enviada correctamente',
          alertFailed: 'Error al enviar alerta',
          helpDescription: 'Solicitud de asistencia no crítica',
          dangerDescription: 'Situación de emergencia crítica',
          locationShared: 'La ubicación se compartirá con tus contactos',
          medicalInfoIncluded: 'Se incluirá información médica'
        },
        onboarding: {
          welcome: 'Bienvenido a Emergencize',
          subtitle: 'Tu sistema personal de alertas de emergencia',
          setupProfile: 'Configura Tu Perfil',
          addContacts: 'Agregar Contactos de Emergencia',
          configureSafeZones: 'Configurar Zonas Seguras',
          medicalInfo: 'Información Médica',
          privacySettings: 'Configuración de Privacidad',
          testSystem: 'Prueba Tu Sistema',
          allSetup: '¡Todo listo!',
          getStarted: 'Comenzar'
        }
      }
    }
  }

  private detectBrowserLanguage(): void {
    try {
      const browserLanguage = navigator.language.split('-')[0]
      if (this.isLanguageSupported(browserLanguage)) {
        this.currentLanguage = browserLanguage
      }
      
      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'language_detection',
        severity: 'low',
        details: {
          detectedLanguage: browserLanguage,
          selectedLanguage: this.currentLanguage,
          browserLanguages: navigator.languages
        },
        userId: 'system',
        timestamp: new Date(),
        riskScore: 0
      })
    } catch (error) {
      console.warn('Failed to detect browser language:', error)
    }
  }

  async setLanguage(languageCode: string): Promise<boolean> {
    try {
      const validationResult = ValidationService.validateLanguageCode({ languageCode })
      if (!validationResult.isValid) {
        throw new Error(`Invalid language code: ${validationResult.errors.join(', ')}`)
      }

      if (!this.isLanguageSupported(languageCode)) {
        throw new Error(`Unsupported language: ${languageCode}`)
      }

      const previousLanguage = this.currentLanguage
      this.currentLanguage = languageCode

      // Update document direction for RTL languages
      const language = this.getSupportedLanguages().find(lang => lang.code === languageCode)
      if (language) {
        document.documentElement.dir = language.rtl ? 'rtl' : 'ltr'
        document.documentElement.lang = languageCode
      }

      // Store language preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('emergencize_language', languageCode)
      }

      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'language_change',
        severity: 'low',
        details: {
          previousLanguage,
          newLanguage: languageCode,
          userAgent: navigator.userAgent
        },
        userId: 'current_user',
        timestamp: new Date(),
        riskScore: 0
      })

      return true
    } catch (error) {
      console.error('Failed to set language:', error)
      return false
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.supportedLanguages]
  }

  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode)
  }

  isRTL(languageCode?: string): boolean {
    const lang = languageCode || this.currentLanguage
    const language = this.supportedLanguages.find(l => l.code === lang)
    return language?.rtl || false
  }

  translate(key: string, params?: Record<string, string>): string {
    try {
      let translation = this.getTranslationByKey(key, this.currentLanguage)
      
      if (!translation && this.currentLanguage !== this.fallbackLanguage) {
        translation = this.getTranslationByKey(key, this.fallbackLanguage)
      }

      if (!translation) {
        console.warn(`Translation not found for key: ${key}`)
        return key
      }

      // Replace parameters if provided
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          translation = translation.replace(`{{${param}}}`, value)
        })
      }

      return translation
    } catch (error) {
      console.error('Translation error:', error)
      return key
    }
  }

  private getTranslationByKey(key: string, languageCode: string): string {
    const languageTranslations = this.translations[languageCode]
    if (!languageTranslations) return ''

    const keys = key.split('.')
    let current: any = languageTranslations

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return ''
      }
    }

    return typeof current === 'string' ? current : ''
  }

  // Utility method for React components
  t = (key: string, params?: Record<string, string>): string => {
    return this.translate(key, params)
  }

  // Format numbers based on locale
  formatNumber(number: number): string {
    try {
      return new Intl.NumberFormat(this.currentLanguage).format(number)
    } catch (error) {
      return number.toString()
    }
  }

  // Format dates based on locale
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.currentLanguage, options).format(date)
    } catch (error) {
      return date.toLocaleString()
    }
  }

  // Format relative time (e.g., "2 minutes ago")
  formatRelativeTime(date: Date): string {
    try {
      const rtf = new Intl.RelativeTimeFormat(this.currentLanguage, { numeric: 'auto' })
      const diffInSeconds = (date.getTime() - Date.now()) / 1000

      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(Math.round(diffInSeconds), 'second')
      } else if (Math.abs(diffInSeconds) < 3600) {
        return rtf.format(Math.round(diffInSeconds / 60), 'minute')
      } else if (Math.abs(diffInSeconds) < 86400) {
        return rtf.format(Math.round(diffInSeconds / 3600), 'hour')
      } else {
        return rtf.format(Math.round(diffInSeconds / 86400), 'day')
      }
    } catch (error) {
      return date.toLocaleString()
    }
  }

  // Load user's saved language preference
  async loadSavedLanguage(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const savedLanguage = localStorage.getItem('emergencize_language')
        if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
          await this.setLanguage(savedLanguage)
        }
      }
    } catch (error) {
      console.warn('Failed to load saved language:', error)
    }
  }

  // Add new translations dynamically
  addTranslations(languageCode: string, translations: TranslationContent): boolean {
    try {
      if (!this.isLanguageSupported(languageCode)) {
        return false
      }

      this.translations[languageCode] = {
        ...this.translations[languageCode],
        ...translations
      }

      return true
    } catch (error) {
      console.error('Failed to add translations:', error)
      return false
    }
  }
}

export default LocalizationService.getInstance()