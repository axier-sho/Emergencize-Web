'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import VoiceCommandService, { VoiceSession } from '@/services/VoiceCommandService'
import { useAuth } from '@/hooks/useAuth'

interface VoiceCommandButtonProps {
  className?: string
  emergencyMode?: boolean
  onCommandExecuted?: (command: string) => void
  disabled?: boolean
}

export function VoiceCommandButton({
  className = '',
  emergencyMode = false,
  onCommandExecuted,
  disabled = false
}: VoiceCommandButtonProps) {
  const { user } = useAuth()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Check if voice commands are supported
    setIsSupported(VoiceCommandService.isSupported())
  }, [])

  useEffect(() => {
    // Monitor voice service state
    const checkServiceState = () => {
      setIsListening(VoiceCommandService.getIsListening())
      setCurrentSession(VoiceCommandService.getCurrentSession())
    }

    const interval = setInterval(checkServiceState, 500)
    return () => clearInterval(interval)
  }, [])

  const handleStartListening = async () => {
    if (!user || disabled) return

    try {
      setError(null)
      setFeedback('Starting voice recognition...')

      const session = emergencyMode
        ? await VoiceCommandService.activateEmergencyMode(user.uid)
        : await VoiceCommandService.startListening(user.uid, true)

      setCurrentSession(session)
      setFeedback(emergencyMode ? 'Emergency voice mode active' : 'Voice commands active')
    } catch (error) {
      console.error('Failed to start voice commands:', error)
      setError(error instanceof Error ? error.message : 'Failed to start voice recognition')
      setFeedback(null)
    }
  }

  const handleStopListening = async () => {
    try {
      await VoiceCommandService.stopListening()
      setFeedback('Voice recognition stopped')
      setTimeout(() => setFeedback(null), 2000)
    } catch (error) {
      console.error('Failed to stop voice commands:', error)
      setError('Failed to stop voice recognition')
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // In a real implementation, this would mute voice feedback
  }

  const clearError = () => {
    setError(null)
  }

  const getButtonColor = () => {
    if (disabled) return 'bg-gray-400'
    if (error) return 'bg-red-500 hover:bg-red-600'
    if (isListening) {
      return emergencyMode 
        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
        : 'bg-green-500 hover:bg-green-600 animate-pulse'
    }
    return emergencyMode 
      ? 'bg-red-500 hover:bg-red-600' 
      : 'bg-blue-600 hover:bg-blue-700'
  }

  const getButtonIcon = () => {
    if (error) return <XCircle size={24} />
    if (isListening) return <Mic size={24} />
    return <MicOff size={24} />
  }

  const getStatusText = () => {
    if (error) return 'Voice Error'
    if (feedback) return feedback
    if (isListening) {
      return emergencyMode ? 'Emergency Listening...' : 'Listening for commands...'
    }
    return emergencyMode ? 'Activate Emergency Voice' : 'Start Voice Commands'
  }

  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <MicOff size={20} />
        <span className="text-sm">Voice commands not supported</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Voice Button */}
      <motion.button
        onClick={isListening ? handleStopListening : handleStartListening}
        disabled={disabled || !user}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full text-white
          transition-all duration-200 shadow-lg
          ${getButtonColor()}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-xl'}
        `}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        aria-label={getStatusText()}
      >
        {getButtonIcon()}
        
        {/* Pulse animation for listening state */}
        {isListening && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-current opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.button>

      {/* Mute Toggle */}
      <motion.button
        onClick={toggleMute}
        className={`
          absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center
          ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}
          hover:scale-110 transition-all shadow-md
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </motion.button>

      {/* Status Display */}
      <AnimatePresence>
        {(isListening || error || feedback) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
          >
            <div
              className={`
                px-3 py-2 rounded-lg text-sm font-medium shadow-lg
                ${error 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : isListening
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                {error ? (
                  <XCircle size={16} />
                ) : isListening ? (
                  <Mic size={16} />
                ) : (
                  <CheckCircle size={16} />
                )}
                <span>{getStatusText()}</span>
                {error && (
                  <button
                    onClick={clearError}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Info (Debug/Development) */}
      {currentSession && process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full mt-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded max-w-xs"
        >
          <div>Session: {currentSession.id.slice(0, 8)}</div>
          <div>Status: {currentSession.status}</div>
          <div>Commands: {currentSession.commands.length}</div>
          {currentSession.commands.length > 0 && (
            <div>Latest: {currentSession.commands[currentSession.commands.length - 1].action}</div>
          )}
        </motion.div>
      )}

      {/* Emergency Mode Indicator */}
      {emergencyMode && (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
          <AlertTriangle size={10} className="text-white" />
        </div>
      )}
    </div>
  )
}

export default VoiceCommandButton