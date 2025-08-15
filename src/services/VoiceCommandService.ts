import { ValidationService } from './ValidationService'
import { SecurityMonitoringService } from './SecurityMonitoringService'
import { rateLimitService } from './RateLimitService'

export interface VoiceCommand {
  id: string
  phrase: string
  action: 'send_help_alert' | 'send_danger_alert' | 'call_emergency' | 'check_status' | 'cancel_alert'
  parameters?: Record<string, any>
  confidence: number
  userId?: string
  timestamp: Date
}

export interface VoiceRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  confidenceThreshold: number
  timeoutMs: number
  emergencyPhrases: string[]
  cancelPhrases: string[]
}

export interface VoiceSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  status: 'listening' | 'processing' | 'completed' | 'cancelled' | 'error'
  commands: VoiceCommand[]
  errorMessage?: string
}

export interface VoiceFeedback {
  text: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  voice?: SpeechSynthesisVoice
  rate?: number
  pitch?: number
  volume?: number
}

// --- Minimal Web Speech API shims (remove if full types added) ---
// These prevent TS errors in strict mode when libs lack definitions.
interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  onstart: ((ev: Event) => any) | null
  onresult: ((ev: SpeechRecognitionEvent) => any) | null
  onerror: ((ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((ev: Event) => any) | null
}
interface SpeechRecognitionResultItem { transcript: string; confidence: number }
interface SpeechRecognitionResult { 0: SpeechRecognitionResultItem; isFinal: boolean; length: number }
interface SpeechRecognitionResultList { length: number; [index: number]: SpeechRecognitionResult }
interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; resultIndex: number }
interface SpeechRecognitionErrorEvent extends Event { error: string; message: string }
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition }
    webkitSpeechRecognition: { new(): SpeechRecognition }
  }
}

export class VoiceCommandService {
  private static instance: VoiceCommandService
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis | null = null
  private isListening = false
  private currentSession: VoiceSession | null = null
  private wakePhraseDetection = false

  private config: VoiceRecognitionConfig = {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    confidenceThreshold: 0.7,
    timeoutMs: 10000,
    emergencyPhrases: [
      'emergency help',
      'send help alert',
      'i need help',
      'help me',
      'emergency danger',
      'send danger alert',
      'danger alert',
      'emergency situation',
      'call for help',
      'urgent help needed'
    ],
    cancelPhrases: [
      'cancel alert',
      'stop alert',
      'false alarm',
      'never mind',
      'cancel emergency',
      'stop listening'
    ]
  }

  private commandPatterns = {
    help_alert: [
      /help\s+(alert|me|request)/i,
      /send\s+help/i,
      /i\s+need\s+help/i,
      /help\s+emergency/i
    ],
    danger_alert: [
      /danger\s+alert/i,
      /emergency\s+danger/i,
      /send\s+danger/i,
      /critical\s+emergency/i,
      /urgent\s+danger/i
    ],
    emergency_call: [
      /call\s+911/i,
      /call\s+emergency/i,
      /dial\s+emergency/i,
      /emergency\s+services/i
    ],
    cancel: [
      /cancel/i,
      /stop/i,
      /false\s+alarm/i,
      /never\s+mind/i
    ],
    status: [
      /check\s+status/i,
      /system\s+status/i,
      /are\s+you\s+listening/i
    ]
  }

  private constructor() {
    this.initializeVoiceRecognition()
    this.initializeVoiceSynthesis()
  }

  static getInstance(): VoiceCommandService {
    if (!VoiceCommandService.instance) {
      VoiceCommandService.instance = new VoiceCommandService()
    }
    return VoiceCommandService.instance
  }

  private initializeVoiceRecognition(): void {
    try {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        this.recognition = new SpeechRecognition()
        
        this.recognition.lang = this.config.language
        this.recognition.continuous = this.config.continuous
        this.recognition.interimResults = this.config.interimResults
        this.recognition.maxAlternatives = this.config.maxAlternatives

        this.setupRecognitionEventHandlers()
      } else {
        console.warn('Speech Recognition not supported in this browser')
      }
    } catch (error) {
      console.error('Failed to initialize voice recognition:', error)
    }
  }

  private initializeVoiceSynthesis(): void {
    try {
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis
      } else {
        console.warn('Speech Synthesis not supported in this browser')
      }
    } catch (error) {
      console.error('Failed to initialize voice synthesis:', error)
    }
  }

  private setupRecognitionEventHandlers(): void {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      // Log as generic system event since custom type not in union
      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'system_error',
        severity: 'low',
        details: {
          category: 'voice_recognition_started',
          sessionId: this.currentSession?.id,
          language: this.config.language
        },
        userId: this.currentSession?.userId || 'unknown'
      })
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleRecognitionResult(event)
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.handleRecognitionError(event)
    }

    this.recognition.onend = () => {
      this.isListening = false
      if (this.currentSession) {
        this.currentSession.status = 'completed'
        this.currentSession.endTime = new Date()
      }
    }
  }

  async startListening(userId: string, enableWakePhrase = false): Promise<VoiceSession> {
    try {
      if (!this.recognition) {
        throw new Error('Voice recognition not available')
      }

      // Check rate limiting
  const limit = await rateLimitService.checkRateLimit(userId, 'voice_command', { intervalMinutes: 1, maxRequests: 10 })
  if (!limit.allowed) throw new Error('Rate limit exceeded for voice commands')

      // Stop any existing session
      if (this.isListening) {
        await this.stopListening()
      }

      // Create new session
      this.currentSession = {
        id: crypto.randomUUID(),
        userId,
        startTime: new Date(),
        status: 'listening',
        commands: []
      }

      this.wakePhraseDetection = enableWakePhrase

      // Request microphone permission and start recognition
      try {
        await this.requestMicrophonePermission()
        this.recognition.start()
        
        // Set timeout
        setTimeout(() => {
          if (this.isListening && this.currentSession?.status === 'listening') {
            this.stopListening()
          }
        }, this.config.timeoutMs)

        return this.currentSession
      } catch (error) {
        this.currentSession.status = 'error'
        this.currentSession.errorMessage = 'Microphone permission denied'
        throw new Error('Microphone permission required for voice commands')
      }
    } catch (error) {
      console.error('Failed to start voice listening:', error)
      throw error
    }
  }

  async stopListening(): Promise<void> {
    try {
      if (this.recognition && this.isListening) {
        this.recognition.stop()
      }
      
      if (this.currentSession && this.currentSession.status === 'listening') {
        this.currentSession.status = 'completed'
        this.currentSession.endTime = new Date()
      }
      
      this.isListening = false
      this.wakePhraseDetection = false
    } catch (error) {
      console.error('Failed to stop voice listening:', error)
    }
  }

  private async requestMicrophonePermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately as we only needed permission
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      throw new Error('Microphone permission denied')
    }
  }

  private handleRecognitionResult(event: SpeechRecognitionEvent): void {
    try {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript.toLowerCase().trim()
        const confidence = result[0].confidence

        if (result.isFinal && confidence >= this.config.confidenceThreshold) {
          this.processVoiceCommand(transcript, confidence)
        } else if (this.wakePhraseDetection && this.isWakePhrase(transcript)) {
          // Wake phrase detected, start full command recognition
          this.provideFeedback({
            text: "I'm listening. How can I help you?",
            urgency: 'medium'
          })
        }
      }
    } catch (error) {
      console.error('Error handling recognition result:', error)
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
    console.error('Speech recognition error:', event.error, event.message)
    
    if (this.currentSession) {
      this.currentSession.status = 'error'
      this.currentSession.errorMessage = `Recognition error: ${event.error}`
      this.currentSession.endTime = new Date()
    }

    SecurityMonitoringService.getInstance().logSecurityEvent({
      type: 'system_error',
      severity: 'medium',
      details: {
        category: 'voice_recognition_error',
        error: event.error,
        message: event.message,
        sessionId: this.currentSession?.id
      },
      userId: this.currentSession?.userId || 'unknown'
    })

    // Provide user feedback
    this.provideFeedback({
      text: "Sorry, I didn't catch that. Please try again.",
      urgency: 'low'
    })
  }

  private async processVoiceCommand(transcript: string, confidence: number): Promise<void> {
    try {
      const command = this.parseVoiceCommand(transcript, confidence)
      
      if (!command) {
        this.provideFeedback({
          text: "I didn't understand that command. Try saying 'help me' or 'send danger alert'.",
          urgency: 'low'
        })
        return
      }

      // Add to current session
      if (this.currentSession) {
        this.currentSession.commands.push(command)
        this.currentSession.status = 'processing'
      }

      // Execute the command
      await this.executeVoiceCommand(command)

      // Log the command
      SecurityMonitoringService.getInstance().logSecurityEvent({
        type: 'system_error',
        severity: command.action.includes('danger') ? 'high' : 'medium',
        details: {
          category: 'voice_command_executed',
          command: command.action,
          phrase: command.phrase,
          confidence: command.confidence,
          sessionId: this.currentSession?.id
        },
        userId: command.userId || 'unknown'
      })
    } catch (error) {
      console.error('Failed to process voice command:', error)
      this.provideFeedback({
        text: "Sorry, I couldn't process that command. Please try again.",
        urgency: 'medium'
      })
    }
  }

  private parseVoiceCommand(transcript: string, confidence: number): VoiceCommand | null {
    const command: VoiceCommand = {
      id: crypto.randomUUID(),
      phrase: transcript,
      action: 'check_status', // default
      confidence,
      userId: this.currentSession?.userId,
      timestamp: new Date()
    }

    // Check for help alert patterns
    if (this.commandPatterns.help_alert.some(pattern => pattern.test(transcript))) {
      command.action = 'send_help_alert'
      return command
    }

    // Check for danger alert patterns
    if (this.commandPatterns.danger_alert.some(pattern => pattern.test(transcript))) {
      command.action = 'send_danger_alert'
      return command
    }

    // Check for emergency call patterns
    if (this.commandPatterns.emergency_call.some(pattern => pattern.test(transcript))) {
      command.action = 'call_emergency'
      return command
    }

    // Check for cancel patterns
    if (this.commandPatterns.cancel.some(pattern => pattern.test(transcript))) {
      command.action = 'cancel_alert'
      return command
    }

    // Check for status patterns
    if (this.commandPatterns.status.some(pattern => pattern.test(transcript))) {
      command.action = 'check_status'
      return command
    }

    // No matching pattern found
    return null
  }

  private async executeVoiceCommand(command: VoiceCommand): Promise<void> {
    try {
      switch (command.action) {
        case 'send_help_alert':
          await this.sendEmergencyAlert('help', command)
          this.provideFeedback({
            text: "Help alert sent to your emergency contacts.",
            urgency: 'medium'
          })
          break

        case 'send_danger_alert':
          await this.sendEmergencyAlert('danger', command)
          this.provideFeedback({
            text: "Danger alert sent to your emergency contacts. Stay safe.",
            urgency: 'high'
          })
          break

        case 'call_emergency':
          this.provideFeedback({
            text: "I cannot make emergency calls directly. Please dial 911 or your local emergency number immediately if this is a real emergency.",
            urgency: 'critical'
          })
          break

        case 'cancel_alert':
          this.provideFeedback({
            text: "Alert cancelled. Voice recognition stopped.",
            urgency: 'low'
          })
          await this.stopListening()
          break

        case 'check_status':
          this.provideFeedback({
            text: "Voice commands are active. Say 'help me' for help alert or 'danger alert' for emergency.",
            urgency: 'low'
          })
          break

        default:
          this.provideFeedback({
            text: "Command not recognized. Try 'help me' or 'danger alert'.",
            urgency: 'low'
          })
      }
    } catch (error) {
      console.error('Failed to execute voice command:', error)
      this.provideFeedback({
        text: "Sorry, I couldn't execute that command. Please try again or contact emergency services directly.",
        urgency: 'medium'
      })
    }
  }

  private async sendEmergencyAlert(type: 'help' | 'danger', command: VoiceCommand): Promise<void> {
    // In a real implementation, this would integrate with the existing alert system
    // For now, we'll simulate the alert sending
    console.log(`Sending ${type} alert via voice command:`, command)
    
    // This would typically call the existing emergency alert system
    // await emergencyAlertService.sendAlert({
    //   type,
    //   message: `Voice-activated ${type} alert`,
    //   fromUserId: command.userId!,
    //   triggeredBy: 'voice_command',
    //   voiceCommand: command
    // })
  }

  private isWakePhrase(transcript: string): boolean {
    return this.config.emergencyPhrases.some(phrase => 
      transcript.includes(phrase.toLowerCase())
    )
  }

  async provideFeedback(feedback: VoiceFeedback): Promise<void> {
    try {
      if (!this.synthesis) {
        console.log('Voice feedback (text only):', feedback.text)
        return
      }

      const utterance = new SpeechSynthesisUtterance(feedback.text)
      
      // Configure voice based on urgency
      switch (feedback.urgency) {
        case 'critical':
          utterance.rate = 1.2
          utterance.pitch = 1.1
          utterance.volume = 1.0
          break
        case 'high':
          utterance.rate = 1.1
          utterance.pitch = 1.0
          utterance.volume = 0.9
          break
        case 'medium':
          utterance.rate = 1.0
          utterance.pitch = 0.9
          utterance.volume = 0.8
          break
        case 'low':
          utterance.rate = 0.9
          utterance.pitch = 0.8
          utterance.volume = 0.7
          break
      }

      // Apply custom voice settings if provided
      if (feedback.rate) utterance.rate = feedback.rate
      if (feedback.pitch) utterance.pitch = feedback.pitch
      if (feedback.volume) utterance.volume = feedback.volume
      if (feedback.voice) utterance.voice = feedback.voice

      this.synthesis.speak(utterance)
    } catch (error) {
      console.error('Failed to provide voice feedback:', error)
    }
  }

  // Configuration methods
  updateConfig(newConfig: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (this.recognition) {
      this.recognition.lang = this.config.language
      this.recognition.continuous = this.config.continuous
      this.recognition.interimResults = this.config.interimResults
      this.recognition.maxAlternatives = this.config.maxAlternatives
    }
  }

  getConfig(): VoiceRecognitionConfig {
    return { ...this.config }
  }

  isSupported(): boolean {
    return !!(
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
      'speechSynthesis' in window
    )
  }

  getCurrentSession(): VoiceSession | null {
    return this.currentSession
  }

  getIsListening(): boolean {
    return this.isListening
  }

  // Emergency activation methods
  async activateEmergencyMode(userId: string): Promise<VoiceSession> {
    try {
      // Start listening with lower confidence threshold for emergency situations
      const originalThreshold = this.config.confidenceThreshold
      this.config.confidenceThreshold = 0.5 // Lower threshold for emergency
      
      const session = await this.startListening(userId, true)
      
      this.provideFeedback({
        text: "Emergency voice mode activated. Say 'help me' or 'danger alert' clearly.",
        urgency: 'high'
      })

      // Restore original threshold after session
      setTimeout(() => {
        this.config.confidenceThreshold = originalThreshold
      }, this.config.timeoutMs)

      return session
    } catch (error) {
      console.error('Failed to activate emergency voice mode:', error)
      throw error
    }
  }

  // Utility methods
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  async testVoiceSystem(): Promise<{ recognition: boolean; synthesis: boolean; microphone: boolean }> {
    const results = {
      recognition: !!this.recognition,
      synthesis: !!this.synthesis,
      microphone: false
    }

    try {
      await this.requestMicrophonePermission()
      results.microphone = true
    } catch (error) {
      results.microphone = false
    }

    return results
  }
}

export default VoiceCommandService.getInstance()