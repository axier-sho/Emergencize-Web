'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import LocalizationService, { SupportedLanguage } from '@/services/LocalizationService'

interface LocalizationContextType {
  currentLanguage: string
  supportedLanguages: SupportedLanguage[]
  setLanguage: (languageCode: string) => Promise<boolean>
  translate: (key: string, params?: Record<string, string>) => string
  t: (key: string, params?: Record<string, string>) => string
  formatNumber: (number: number) => string
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
  formatRelativeTime: (date: Date) => string
  isRTL: boolean
  isLoading: boolean
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined)

interface LocalizationProviderProps {
  children: ReactNode
}

export function LocalizationProvider({ children }: LocalizationProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en')
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRTL, setIsRTL] = useState(false)

  const localizationService = LocalizationService

  useEffect(() => {
    const initializeLocalization = async () => {
      try {
        // Load supported languages
        setSupportedLanguages(localizationService.getSupportedLanguages())
        
        // Load saved language preference
        await localizationService.loadSavedLanguage()
        
        // Update state
        const language = localizationService.getCurrentLanguage()
        setCurrentLanguage(language)
        setIsRTL(localizationService.isRTL(language))
        
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize localization:', error)
        setIsLoading(false)
      }
    }

    initializeLocalization()
  }, [localizationService])

  const setLanguage = async (languageCode: string): Promise<boolean> => {
    try {
      const success = await localizationService.setLanguage(languageCode)
      if (success) {
        setCurrentLanguage(languageCode)
        setIsRTL(localizationService.isRTL(languageCode))
      }
      return success
    } catch (error) {
      console.error('Failed to set language:', error)
      return false
    }
  }

  const translate = (key: string, params?: Record<string, string>): string => {
    return localizationService.translate(key, params)
  }

  const t = (key: string, params?: Record<string, string>): string => {
    return localizationService.t(key, params)
  }

  const formatNumber = (number: number): string => {
    return localizationService.formatNumber(number)
  }

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return localizationService.formatDate(date, options)
  }

  const formatRelativeTime = (date: Date): string => {
    return localizationService.formatRelativeTime(date)
  }

  const contextValue: LocalizationContextType = {
    currentLanguage,
    supportedLanguages,
    setLanguage,
    translate,
    t,
    formatNumber,
    formatDate,
    formatRelativeTime,
    isRTL,
    isLoading
  }

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  )
}

export function useLocalization(): LocalizationContextType {
  const context = useContext(LocalizationContext)
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider')
  }
  return context
}

export default LocalizationProvider