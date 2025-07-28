'use client'

import { useState, useEffect, useCallback } from 'react'

export interface AccessibilitySettings {
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  reduceMotion: boolean
  screenReaderAnnouncements: boolean
  keyboardNavigationIndicators: boolean
  audioCues: boolean
  focusManagement: boolean
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: 'medium',
  reduceMotion: false,
  screenReaderAnnouncements: true,
  keyboardNavigationIndicators: true,
  audioCues: false,
  focusManagement: true
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('emergencize-accessibility')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
      
      // Check for system preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      if (prefersReducedMotion || prefersHighContrast) {
        setSettings(prev => ({
          ...prev,
          reduceMotion: prefersReducedMotion,
          highContrast: prefersHighContrast
        }))
      }
      
      setIsLoaded(true)
    } catch (error) {
      console.error('Error loading accessibility settings:', error)
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: AccessibilitySettings) => {
    try {
      localStorage.setItem('emergencize-accessibility', JSON.stringify(newSettings))
      setSettings(newSettings)
    } catch (error) {
      console.error('Error saving accessibility settings:', error)
    }
  }, [])

  // Update individual setting
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    saveSettings(newSettings)
  }, [settings, saveSettings])

  // Apply CSS classes based on settings
  useEffect(() => {
    if (!isLoaded) return

    const root = document.documentElement
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large')
    root.classList.add(`font-${settings.fontSize}`)
    
    // Reduced motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Keyboard navigation indicators
    if (settings.keyboardNavigationIndicators) {
      root.classList.add('show-focus-indicators')
    } else {
      root.classList.remove('show-focus-indicators')
    }
  }, [settings, isLoaded])

  // Screen reader announcement function
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.screenReaderAnnouncements) return

    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [settings.screenReaderAnnouncements])

  // Audio cue function
  const playAudioCue = useCallback((type: 'success' | 'error' | 'warning' | 'info') => {
    if (!settings.audioCues) return

    // Create simple audio cues using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different frequencies for different types
      const frequencies = {
        success: 800,
        error: 300,
        warning: 600,
        info: 1000
      }
      
      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.error('Error playing audio cue:', error)
    }
  }, [settings.audioCues])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    saveSettings(defaultSettings)
  }, [saveSettings])

  // Emergency accessibility mode (high contrast + large font + reduced motion)
  const enableEmergencyMode = useCallback(() => {
    const emergencySettings: AccessibilitySettings = {
      ...settings,
      highContrast: true,
      fontSize: 'large',
      reduceMotion: true,
      screenReaderAnnouncements: true,
      keyboardNavigationIndicators: true,
      audioCues: true,
      focusManagement: true
    }
    saveSettings(emergencySettings)
    announce('Emergency accessibility mode activated', 'assertive')
  }, [settings, saveSettings, announce])

  return {
    settings,
    isLoaded,
    updateSetting,
    saveSettings,
    announce,
    playAudioCue,
    resetToDefaults,
    enableEmergencyMode
  }
}