'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, Volume2, CheckCircle, XCircle, AlertTriangle, Settings, Play } from 'lucide-react'
import VoiceCommandService from '@/services/VoiceCommandService'
import { useLocalization } from '../localization/LocalizationProvider'

interface VoiceCommandSetupProps {
  onSetupComplete?: (enabled: boolean) => void
  className?: string
}

export function VoiceCommandSetup({ onSetupComplete, className = '' }: VoiceCommandSetupProps) {
  const { t } = useLocalization()
  const [isSupported, setIsSupported] = useState(false)
  const [systemTest, setSystemTest] = useState<{
    recognition: boolean
    synthesis: boolean
    microphone: boolean
  } | null>(null)
  const [isTestingVoice, setIsTestingVoice] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [isEnabled, setIsEnabled] = useState(false)

  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
    { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
    { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German (Germany)', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italian (Italy)', flag: '🇮🇹' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
    { code: 'ja-JP', name: 'Japanese (Japan)', flag: '🇯🇵' },
    { code: 'ko-KR', name: 'Korean (Korea)', flag: '🇰🇷' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', flag: '🇸🇦' },
    { code: 'hi-IN', name: 'Hindi (India)', flag: '🇮🇳' },
    { code: 'ru-RU', name: 'Russian (Russia)', flag: '🇷🇺' }
  ]

  const emergencyCommands = [
    'Help me',
    'Send help alert',
    'I need help',
    'Emergency danger',
    'Send danger alert',
    'Danger alert'
  ]

  useEffect(() => {
    checkVoiceSupport()
  }, [])

  const checkVoiceSupport = async () => {
    const supported = VoiceCommandService.isSupported()
    setIsSupported(supported)

    if (supported) {
      try {
        const testResults = await VoiceCommandService.testVoiceSystem()
        setSystemTest(testResults)
        setPermissionGranted(testResults.microphone)
      } catch (error) {
        console.error('Voice system test failed:', error)
        setPermissionGranted(false)
      }
    }
  }

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setPermissionGranted(true)
      
      // Re-run system test
      const testResults = await VoiceCommandService.testVoiceSystem()
      setSystemTest(testResults)
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setPermissionGranted(false)
    }
  }

  const testVoiceFeedback = async () => {
    setIsTestingVoice(true)
    try {
      await VoiceCommandService.provideFeedback({
        text: "Voice feedback test. Emergency voice commands are now ready to use.",
        urgency: 'medium'
      })
    } catch (error) {
      console.error('Voice feedback test failed:', error)
    } finally {
      setIsTestingVoice(false)
    }
  }

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    VoiceCommandService.updateConfig({
      language: languageCode
    })
  }

  const handleEnableToggle = (enabled: boolean) => {
    setIsEnabled(enabled)
    if (onSetupComplete) {
      onSetupComplete(enabled)
    }
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse" />
    return status 
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusText = (status: boolean | null, successText: string, failText: string) => {
    if (status === null) return 'Testing...'
    return status ? successText : failText
  }

  if (!isSupported) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            Voice Commands Not Supported
          </h3>
        </div>
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          Your browser doesn't support voice recognition or speech synthesis. Voice commands will not be available.
        </p>
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Supported browsers include Chrome, Edge, and Safari (iOS 14.5+).
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Voice Command Setup
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure voice commands for hands-free emergency alerts
        </p>
      </div>

      {/* System Requirements Check */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          System Compatibility
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Speech Recognition</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(systemTest?.recognition ?? null)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusText(systemTest?.recognition ?? null, 'Supported', 'Not Available')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Voice Synthesis</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(systemTest?.synthesis ?? null)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusText(systemTest?.synthesis ?? null, 'Supported', 'Not Available')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Microphone Access</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(permissionGranted)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusText(permissionGranted, 'Granted', 'Permission Needed')}
              </span>
            </div>
          </div>
        </div>

        {permissionGranted === false && (
          <motion.button
            onClick={requestPermissions}
            className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Grant Microphone Permission
          </motion.button>
        )}
      </div>

      {/* Language Selection */}
      {systemTest?.recognition && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Voice Recognition Language
          </h3>
          
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Choose the language you'll use for voice commands
          </p>
        </div>
      )}

      {/* Emergency Commands Reference */}
      {systemTest?.recognition && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Emergency Voice Commands
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyCommands.map((command, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  "{command}"
                </span>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Important Tips:</p>
                <ul className="space-y-1">
                  <li>• Speak clearly and at normal volume</li>
                  <li>• Wait for voice feedback confirmation</li>
                  <li>• Use "cancel alert" to stop false alarms</li>
                  <li>• Voice commands work even when screen is locked</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Feedback Test */}
      {systemTest?.synthesis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Voice Feedback Test
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Test voice feedback to ensure you can hear system responses
          </p>
          
          <motion.button
            onClick={testVoiceFeedback}
            disabled={isTestingVoice}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
            whileHover={isTestingVoice ? {} : { scale: 1.02 }}
            whileTap={isTestingVoice ? {} : { scale: 0.98 }}
          >
            {isTestingVoice ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isTestingVoice ? 'Playing...' : 'Test Voice Feedback'}</span>
          </motion.button>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Enable Voice Commands
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Activate hands-free emergency alerts via voice
            </p>
          </div>
          
          <motion.button
            onClick={() => handleEnableToggle(!isEnabled)}
            disabled={!systemTest?.recognition || !systemTest?.synthesis || !permissionGranted}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
              ${(!systemTest?.recognition || !systemTest?.synthesis || !permissionGranted) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            whileHover={(!systemTest?.recognition || !systemTest?.synthesis || !permissionGranted) ? {} : { scale: 1.05 }}
            whileTap={(!systemTest?.recognition || !systemTest?.synthesis || !permissionGranted) ? {} : { scale: 0.95 }}
          >
            <motion.span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
              layout
            />
          </motion.button>
        </div>

        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Voice commands are now active and ready for emergencies
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default VoiceCommandSetup