'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, Skip, X } from 'lucide-react'
import { useOnboarding } from './OnboardingProvider'
import { useLocalization } from '../localization/LocalizationProvider'
import WelcomeStep from './steps/WelcomeStep'
import ProfileStep from './steps/ProfileStep'
import ContactsStep from './steps/ContactsStep'
import LocationStep from './steps/LocationStep'
import MedicalStep from './steps/MedicalStep'
import SafeZonesStep from './steps/SafeZonesStep'
import PrivacyStep from './steps/PrivacyStep'
import NotificationsStep from './steps/NotificationsStep'
import TestStep from './steps/TestStep'
import CompleteStep from './steps/CompleteStep'

interface OnboardingFlowProps {
  onComplete?: () => void
  onClose?: () => void
  className?: string
}

const stepComponents = {
  WelcomeStep,
  ProfileStep,
  ContactsStep,
  LocationStep,
  MedicalStep,
  SafeZonesStep,
  PrivacyStep,
  NotificationsStep,
  TestStep,
  CompleteStep
}

export function OnboardingFlow({ onComplete, onClose, className = '' }: OnboardingFlowProps) {
  const {
    steps,
    progress,
    currentStep,
    nextStep,
    previousStep,
    completeStep,
    skipStep,
    getStepProgress
  } = useOnboarding()

  const { t, isRTL } = useLocalization()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [stepData, setStepData] = useState<any>({})

  useEffect(() => {
    if (progress.isComplete && onComplete) {
      onComplete()
    }
  }, [progress.isComplete, onComplete])

  const handleNext = async () => {
    if (!currentStep || isTransitioning) return

    setIsTransitioning(true)
    try {
      // Complete current step with collected data
      if (stepData[currentStep.id]) {
        await completeStep(currentStep.id, stepData[currentStep.id])
      }

      // Move to next step
      await nextStep()
    } catch (error) {
      console.error('Failed to proceed to next step:', error)
    } finally {
      setIsTransitioning(false)
    }
  }

  const handlePrevious = () => {
    if (progress.currentStep > 0 && !isTransitioning) {
      previousStep()
    }
  }

  const handleSkip = async () => {
    if (!currentStep || currentStep.required || isTransitioning) return

    setIsTransitioning(true)
    try {
      await skipStep(currentStep.id)
      await nextStep()
    } catch (error) {
      console.error('Failed to skip step:', error)
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleStepDataChange = (stepId: string, data: any) => {
    setStepData(prev => ({
      ...prev,
      [stepId]: data
    }))
  }

  const canProceed = (): boolean => {
    if (!currentStep) return false
    
    // Check if step has required data
    if (currentStep.required) {
      const data = stepData[currentStep.id]
      return data && Object.keys(data).length > 0
    }
    
    return true
  }

  const progressPercentage = getStepProgress()

  if (!currentStep) return null

  const StepComponent = stepComponents[currentStep.component as keyof typeof stepComponents]

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl h-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t('onboarding.welcome')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('common.step')} {progress.currentStep + 1} {t('common.of')} {progress.totalSteps}
              </p>
            </div>
          </div>

          {onClose && (
            <motion.button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={24} />
            </motion.button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('common.progress')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {StepComponent && (
                <StepComponent
                  onDataChange={(data: any) => handleStepDataChange(currentStep.id, data)}
                  initialData={stepData[currentStep.id]}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className={`flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Previous Button */}
          <motion.button
            onClick={handlePrevious}
            disabled={progress.currentStep === 0 || isTransitioning}
            className={`
              flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400
              hover:text-gray-800 dark:hover:text-gray-200 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}
            `}
            whileHover={{ scale: isTransitioning ? 1 : 1.05 }}
            whileTap={{ scale: isTransitioning ? 1 : 0.95 }}
          >
            <ChevronLeft size={20} />
            <span>{t('common.back')}</span>
          </motion.button>

          {/* Center - Skip Button (for optional steps) */}
          <div className="flex-1 flex justify-center">
            {!currentStep.required && (
              <motion.button
                onClick={handleSkip}
                disabled={isTransitioning}
                className="flex items-center space-x-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                whileHover={{ scale: isTransitioning ? 1 : 1.05 }}
                whileTap={{ scale: isTransitioning ? 1 : 0.95 }}
              >
                <Skip size={16} />
                <span>{t('common.skip')}</span>
              </motion.button>
            )}
          </div>

          {/* Next/Finish Button */}
          <motion.button
            onClick={handleNext}
            disabled={!canProceed() || isTransitioning}
            className={`
              flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 
              text-white rounded-lg font-medium transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}
            `}
            whileHover={{ scale: isTransitioning ? 1 : 1.05 }}
            whileTap={{ scale: isTransitioning ? 1 : 0.95 }}
          >
            {isTransitioning ? (
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : progress.currentStep === steps.length - 1 ? (
              <>
                <Check size={20} />
                <span>{t('common.finish')}</span>
              </>
            ) : (
              <>
                <span>{t('common.next')}</span>
                <ChevronRight size={20} />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default OnboardingFlow