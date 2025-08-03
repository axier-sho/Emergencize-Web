'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { validationService } from '@/services/ValidationService'
import { securityMonitoringService } from '@/services/SecurityMonitoringService'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  component: string
  required: boolean
  completed: boolean
  data?: any
}

export interface OnboardingProgress {
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  isComplete: boolean
  startedAt?: Date
  completedAt?: Date
}

interface OnboardingContextType {
  steps: OnboardingStep[]
  progress: OnboardingProgress
  currentStep: OnboardingStep | null
  nextStep: () => Promise<boolean>
  previousStep: () => void
  goToStep: (stepId: string) => void
  completeStep: (stepId: string, data?: any) => Promise<boolean>
  skipStep: (stepId: string) => Promise<boolean>
  resetOnboarding: () => void
  saveProgress: () => Promise<void>
  loadProgress: () => Promise<void>
  isStepAccessible: (stepId: string) => boolean
  getStepProgress: () => number
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

interface OnboardingProviderProps {
  children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'onboarding.welcome',
      description: 'onboarding.subtitle',
      component: 'WelcomeStep',
      required: true,
      completed: false
    },
    {
      id: 'profile',
      title: 'onboarding.setupProfile',
      description: 'Complete your profile information',
      component: 'ProfileStep',
      required: true,
      completed: false
    },
    {
      id: 'contacts',
      title: 'onboarding.addContacts',
      description: 'Add emergency contacts who will receive your alerts',
      component: 'ContactsStep',
      required: true,
      completed: false
    },
    {
      id: 'location',
      title: 'Location Permissions',
      description: 'Enable location services for emergency alerts',
      component: 'LocationStep',
      required: true,
      completed: false
    },
    {
      id: 'medical',
      title: 'onboarding.medicalInfo',
      description: 'Add medical information for emergencies',
      component: 'MedicalStep',
      required: false,
      completed: false
    },
    {
      id: 'safezones',
      title: 'onboarding.configureSafeZones',
      description: 'Set up safe zones for automatic monitoring',
      component: 'SafeZonesStep',
      required: false,
      completed: false
    },
    {
      id: 'privacy',
      title: 'onboarding.privacySettings',
      description: 'Configure your privacy and sharing preferences',
      component: 'PrivacyStep',
      required: true,
      completed: false
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Configure notification preferences and permissions',
      component: 'NotificationsStep',
      required: true,
      completed: false
    },
    {
      id: 'test',
      title: 'onboarding.testSystem',
      description: 'Test your emergency alert system',
      component: 'TestStep',
      required: false,
      completed: false
    },
    {
      id: 'complete',
      title: 'onboarding.allSetup',
      description: 'You are ready to use Emergencize',
      component: 'CompleteStep',
      required: true,
      completed: false
    }
  ])

  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 0,
    totalSteps: steps.length,
    completedSteps: [],
    isComplete: false,
    startedAt: new Date()
  })

  const currentStep = steps[progress.currentStep] || null

  useEffect(() => {
    loadProgress()
  }, [])

  useEffect(() => {
    saveProgress()
  }, [progress])

  const nextStep = async (): Promise<boolean> => {
    try {
      if (progress.currentStep < steps.length - 1) {
        const newStepIndex = progress.currentStep + 1
        setProgress(prev => ({
          ...prev,
          currentStep: newStepIndex
        }))

        securityMonitoringService.logSecurityEvent({
          type: 'admin_action',
          severity: 'low',
          details: {
            stepId: steps[newStepIndex]?.id,
            stepIndex: newStepIndex,
            direction: 'forward'
          },
          userId: 'current_user'
        })

        return true
      }
      return false
    } catch (error) {
      console.error('Failed to go to next step:', error)
      return false
    }
  }

  const previousStep = (): void => {
    if (progress.currentStep > 0) {
      const newStepIndex = progress.currentStep - 1
      setProgress(prev => ({
        ...prev,
        currentStep: newStepIndex
      }))

      securityMonitoringService.logSecurityEvent({
        type: 'admin_action',
        severity: 'low',
        details: {
          stepId: steps[newStepIndex]?.id,
          stepIndex: newStepIndex,
          direction: 'backward'
        },
        userId: 'current_user'
      })
    }
  }

  const goToStep = (stepId: string): void => {
    const stepIndex = steps.findIndex(step => step.id === stepId)
    if (stepIndex !== -1 && isStepAccessible(stepId)) {
      setProgress(prev => ({
        ...prev,
        currentStep: stepIndex
      }))
    }
  }

  const completeStep = async (stepId: string, data?: any): Promise<boolean> => {
    try {
      // Validate step completion data if provided
      if (data) {
        const validationResult = validationService.validateOnboardingStep({ stepId, data })
        if (!validationResult.isValid) {
          throw new Error(`Invalid step data: ${Object.values(validationResult.errors).flat().join(', ')}`)
        }
      }

      // Update step completion
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === stepId 
            ? { ...step, completed: true, data }
            : step
        )
      )

      // Update progress
      setProgress(prev => {
        const newCompletedSteps = [...prev.completedSteps]
        if (!newCompletedSteps.includes(stepId)) {
          newCompletedSteps.push(stepId)
        }

        const allRequiredCompleted = steps
          .filter(step => step.required)
          .every(step => newCompletedSteps.includes(step.id) || step.id === stepId)

        return {
          ...prev,
          completedSteps: newCompletedSteps,
          isComplete: allRequiredCompleted,
          completedAt: allRequiredCompleted ? new Date() : prev.completedAt
        }
      })

      securityMonitoringService.logSecurityEvent({
        type: 'admin_action',
        severity: 'low',
        details: {
          stepId,
          hasData: !!data,
          completedStepsCount: progress.completedSteps.length + 1
        },
        userId: 'current_user'
      })

      return true
    } catch (error) {
      console.error('Failed to complete step:', error)
      return false
    }
  }

  const skipStep = async (stepId: string): Promise<boolean> => {
    try {
      const step = steps.find(s => s.id === stepId)
      if (!step) return false

      if (step.required) {
        throw new Error('Cannot skip required step')
      }

      // Mark as completed but with skipped flag
      setSteps(prevSteps => 
        prevSteps.map(s => 
          s.id === stepId 
            ? { ...s, completed: true, data: { skipped: true } }
            : s
        )
      )

      securityMonitoringService.logSecurityEvent({
        type: 'admin_action',
        severity: 'low',
        details: { stepId },
        userId: 'current_user'
      })

      return true
    } catch (error) {
      console.error('Failed to skip step:', error)
      return false
    }
  }

  const resetOnboarding = (): void => {
    setSteps(prevSteps => 
      prevSteps.map(step => ({ 
        ...step, 
        completed: false, 
        data: undefined 
      }))
    )
    
    setProgress({
      currentStep: 0,
      totalSteps: steps.length,
      completedSteps: [],
      isComplete: false,
      startedAt: new Date()
    })

    // Clear saved progress
    if (typeof window !== 'undefined') {
      localStorage.removeItem('emergencize_onboarding_progress')
    }
  }

  const saveProgress = async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        const progressData = {
          steps: steps.map(step => ({
            id: step.id,
            completed: step.completed,
            data: step.data
          })),
          progress,
          lastSaved: new Date().toISOString()
        }
        localStorage.setItem('emergencize_onboarding_progress', JSON.stringify(progressData))
      }
    } catch (error) {
      console.error('Failed to save onboarding progress:', error)
    }
  }

  const loadProgress = async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('emergencize_onboarding_progress')
        if (savedData) {
          const progressData = JSON.parse(savedData)
          
          // Restore step completion status
          if (progressData.steps) {
            setSteps(prevSteps => 
              prevSteps.map(step => {
                const savedStep = progressData.steps.find((s: any) => s.id === step.id)
                return savedStep 
                  ? { ...step, completed: savedStep.completed, data: savedStep.data }
                  : step
              })
            )
          }

          // Restore progress
          if (progressData.progress) {
            setProgress(prev => ({
              ...prev,
              ...progressData.progress,
              startedAt: new Date(progressData.progress.startedAt),
              completedAt: progressData.progress.completedAt 
                ? new Date(progressData.progress.completedAt) 
                : undefined
            }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
    }
  }

  const isStepAccessible = (stepId: string): boolean => {
    const stepIndex = steps.findIndex(step => step.id === stepId)
    if (stepIndex === -1) return false

    // First step is always accessible
    if (stepIndex === 0) return true

    // Check if all required previous steps are completed
    const previousSteps = steps.slice(0, stepIndex)
    const requiredPreviousSteps = previousSteps.filter(step => step.required)
    
    return requiredPreviousSteps.every(step => 
      progress.completedSteps.includes(step.id)
    )
  }

  const getStepProgress = (): number => {
    const requiredSteps = steps.filter(step => step.required)
    const completedRequiredSteps = requiredSteps.filter(step => 
      progress.completedSteps.includes(step.id)
    )
    return (completedRequiredSteps.length / requiredSteps.length) * 100
  }

  const contextValue: OnboardingContextType = {
    steps,
    progress,
    currentStep,
    nextStep,
    previousStep,
    goToStep,
    completeStep,
    skipStep,
    resetOnboarding,
    saveProgress,
    loadProgress,
    isStepAccessible,
    getStepProgress
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

export default OnboardingProvider