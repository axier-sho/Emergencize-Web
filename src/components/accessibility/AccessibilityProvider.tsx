'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAccessibility, AccessibilitySettings } from '@/hooks/useAccessibility'

interface AccessibilityContextType {
  settings: AccessibilitySettings
  isLoaded: boolean
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => void
  saveSettings: (newSettings: AccessibilitySettings) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  playAudioCue: (type: 'success' | 'error' | 'warning' | 'info') => void
  resetToDefaults: () => void
  enableEmergencyMode: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const accessibility = useAccessibility()

  return (
    <AccessibilityContext.Provider value={accessibility}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider')
  }
  return context
}

// Screen reader only component
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}