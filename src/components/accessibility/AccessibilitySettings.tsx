'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  Type, 
  Volume2, 
  VolumeX, 
  MousePointer, 
  Accessibility,
  RotateCcw,
  Zap,
  Monitor,
  Keyboard,
  MessageCircle
} from 'lucide-react'
import { useAccessibilityContext } from './AccessibilityProvider'

interface AccessibilitySettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccessibilitySettings({ isOpen, onClose }: AccessibilitySettingsProps) {
  const { 
    settings, 
    updateSetting, 
    resetToDefaults, 
    enableEmergencyMode, 
    announce,
    playAudioCue 
  } = useAccessibilityContext()

  if (!isOpen) return null

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSetting(key, value)
    playAudioCue(value ? 'success' : 'info')
    announce(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`)
  }

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    updateSetting('fontSize', size)
    playAudioCue('info')
    announce(`Font size changed to ${size}`)
  }

  const handleEmergencyMode = () => {
    enableEmergencyMode()
    playAudioCue('warning')
  }

  const handleReset = () => {
    resetToDefaults()
    playAudioCue('success')
    announce('Accessibility settings reset to defaults')
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-effect rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="accessibility-settings-title"
        aria-describedby="accessibility-settings-description"
      >
        {/* Header */}
        <div className="p-6 border-b border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Accessibility size={24} className="text-white" />
              </div>
              <div>
                <h2 id="accessibility-settings-title" className="text-2xl font-bold text-white">
                  Accessibility Settings
                </h2>
                <p id="accessibility-settings-description" className="text-blue-200 text-sm">
                  Customize your experience for better accessibility
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Close accessibility settings"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Quick Actions */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Zap size={20} className="text-blue-400" />
              <span>Quick Actions</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                onClick={handleEmergencyMode}
                className="p-4 bg-red-600 bg-opacity-20 border border-red-400 border-opacity-50 rounded-lg text-left hover:bg-opacity-30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-describedby="emergency-mode-desc"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Zap size={20} className="text-red-400" />
                  <span className="text-white font-medium">Emergency Mode</span>
                </div>
                <p id="emergency-mode-desc" className="text-red-200 text-sm">
                  Activate high contrast, large text, and audio cues
                </p>
              </motion.button>

              <motion.button
                onClick={handleReset}
                className="p-4 bg-gray-600 bg-opacity-20 border border-gray-400 border-opacity-50 rounded-lg text-left hover:bg-opacity-30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-describedby="reset-desc"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <RotateCcw size={20} className="text-gray-400" />
                  <span className="text-white font-medium">Reset to Defaults</span>
                </div>
                <p id="reset-desc" className="text-gray-300 text-sm">
                  Restore all settings to their default values
                </p>
              </motion.button>
            </div>
          </section>

          {/* Visual Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Eye size={20} className="text-blue-400" />
              <span>Visual Settings</span>
            </h3>
            
            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Monitor size={20} className="text-blue-400" />
                  <div>
                    <label htmlFor="high-contrast" className="text-white font-medium block">
                      High Contrast Mode
                    </label>
                    <p className="text-gray-300 text-sm">Increases contrast for better visibility</p>
                  </div>
                </div>
                
                <motion.button
                  id="high-contrast"
                  onClick={() => handleToggle('highContrast', !settings.highContrast)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.highContrast ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  role="switch"
                  aria-checked={settings.highContrast}
                  aria-labelledby="high-contrast"
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full"
                    animate={{ x: settings.highContrast ? 24 : 2 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </div>

              {/* Font Size */}
              <div className="p-4 bg-white bg-opacity-5 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Type size={20} className="text-blue-400" />
                  <div>
                    <span className="text-white font-medium block">Font Size</span>
                    <p className="text-gray-300 text-sm">Adjust text size for better readability</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => handleFontSizeChange(size)}
                      className={`p-3 rounded-lg border transition-colors ${
                        settings.fontSize === size
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-white bg-opacity-10 border-gray-600 text-gray-300 hover:bg-opacity-20'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-pressed={settings.fontSize === size}
                    >
                      <span className="capitalize text-sm font-medium">{size.replace('-', ' ')}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MousePointer size={20} className="text-blue-400" />
                  <div>
                    <label htmlFor="reduce-motion" className="text-white font-medium block">
                      Reduce Motion
                    </label>
                    <p className="text-gray-300 text-sm">Minimize animations and transitions</p>
                  </div>
                </div>
                
                <motion.button
                  id="reduce-motion"
                  onClick={() => handleToggle('reduceMotion', !settings.reduceMotion)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.reduceMotion ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  role="switch"
                  aria-checked={settings.reduceMotion}
                  aria-labelledby="reduce-motion"
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full"
                    animate={{ x: settings.reduceMotion ? 24 : 2 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </div>
            </div>
          </section>

          {/* Audio & Navigation Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Volume2 size={20} className="text-blue-400" />
              <span>Audio & Navigation</span>
            </h3>
            
            <div className="space-y-4">
              {/* Screen Reader Announcements */}
              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageCircle size={20} className="text-blue-400" />
                  <div>
                    <label htmlFor="screen-reader" className="text-white font-medium block">
                      Screen Reader Announcements
                    </label>
                    <p className="text-gray-300 text-sm">Announce important updates and changes</p>
                  </div>
                </div>
                
                <motion.button
                  id="screen-reader"
                  onClick={() => handleToggle('screenReaderAnnouncements', !settings.screenReaderAnnouncements)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.screenReaderAnnouncements ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  role="switch"
                  aria-checked={settings.screenReaderAnnouncements}
                  aria-labelledby="screen-reader"
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full"
                    animate={{ x: settings.screenReaderAnnouncements ? 24 : 2 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </div>

              {/* Audio Cues */}
              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                <div className="flex items-center space-x-3">
                  {settings.audioCues ? (
                    <Volume2 size={20} className="text-blue-400" />
                  ) : (
                    <VolumeX size={20} className="text-gray-400" />
                  )}
                  <div>
                    <label htmlFor="audio-cues" className="text-white font-medium block">
                      Audio Cues
                    </label>
                    <p className="text-gray-300 text-sm">Play sounds for different types of alerts</p>
                  </div>
                </div>
                
                <motion.button
                  id="audio-cues"
                  onClick={() => handleToggle('audioCues', !settings.audioCues)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.audioCues ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  role="switch"
                  aria-checked={settings.audioCues}
                  aria-labelledby="audio-cues"
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full"
                    animate={{ x: settings.audioCues ? 24 : 2 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </div>

              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Keyboard size={20} className="text-blue-400" />
                  <div>
                    <label htmlFor="keyboard-nav" className="text-white font-medium block">
                      Keyboard Navigation Indicators
                    </label>
                    <p className="text-gray-300 text-sm">Show visible focus indicators for keyboard users</p>
                  </div>
                </div>
                
                <motion.button
                  id="keyboard-nav"
                  onClick={() => handleToggle('keyboardNavigationIndicators', !settings.keyboardNavigationIndicators)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.keyboardNavigationIndicators ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  role="switch"
                  aria-checked={settings.keyboardNavigationIndicators}
                  aria-labelledby="keyboard-nav"
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full"
                    animate={{ x: settings.keyboardNavigationIndicators ? 24 : 2 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts Info */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h3>
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Emergency Alert:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-white">Ctrl+E</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Help Request:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-white">Ctrl+H</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Settings:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-white">Ctrl+,</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Accessibility:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-white">Ctrl+A</kbd>
                </div>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  )
}