'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useLocalization } from './LocalizationProvider'
import { SupportedLanguage } from '@/services/LocalizationService'

interface LanguageSelectorProps {
  className?: string
  compact?: boolean
  showFlags?: boolean
}

export function LanguageSelector({ 
  className = '', 
  compact = false, 
  showFlags = true 
}: LanguageSelectorProps) {
  const { 
    currentLanguage, 
    supportedLanguages, 
    setLanguage, 
    t, 
    isRTL 
  } = useLocalization()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage)

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false)
      return
    }

    setIsChanging(true)
    try {
      const success = await setLanguage(languageCode)
      if (success) {
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const toggleDropdown = () => {
    if (!isChanging) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Language Selector Button */}
      <motion.button
        onClick={toggleDropdown}
        disabled={isChanging}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border
          bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
          hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${compact ? 'text-sm' : 'text-base'}
          ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}
        `}
        whileHover={{ scale: isChanging ? 1 : 1.02 }}
        whileTap={{ scale: isChanging ? 1 : 0.98 }}
      >
        {/* Globe Icon */}
        <Globe 
          size={compact ? 16 : 20} 
          className="text-gray-600 dark:text-gray-300" 
        />
        
        {/* Current Language */}
        <div className="flex items-center space-x-2">
          {showFlags && currentLang && (
            <span className="text-lg">{currentLang.flag}</span>
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {compact 
              ? currentLang?.code.toUpperCase() 
              : currentLang?.nativeName || t('common.loading')
            }
          </span>
        </div>

        {/* Dropdown Arrow */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown 
            size={compact ? 14 : 16} 
            className="text-gray-500 dark:text-gray-400" 
          />
        </motion.div>

        {/* Loading Indicator */}
        {isChanging && (
          <motion.div
            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg 
              z-50 max-h-64 overflow-y-auto
              ${isRTL ? 'right-0' : 'left-0'}
            `}
          >
            <div className="py-2">
              {/* Header */}
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('common.selectLanguage')}
                </h3>
              </div>

              {/* Language Options */}
              <div className="py-1">
                {supportedLanguages.map((language: SupportedLanguage) => (
                  <motion.button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    disabled={isChanging}
                    className={`
                      w-full flex items-center justify-between px-4 py-3
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${currentLanguage === language.code 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-900 dark:text-gray-100'
                      }
                      ${isRTL ? 'flex-row-reverse' : ''}
                    `}
                    whileHover={{ 
                      backgroundColor: isChanging ? undefined : 'rgba(59, 130, 246, 0.05)' 
                    }}
                  >
                    <div className={`flex items-center space-x-3 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {showFlags && (
                        <span className="text-lg">{language.flag}</span>
                      )}
                      <div className={`text-left ${isRTL ? 'text-right' : ''}`}>
                        <div className="font-medium">{language.nativeName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {language.name}
                        </div>
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {currentLanguage === language.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check size={16} className="text-blue-600 dark:text-blue-400" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default LanguageSelector