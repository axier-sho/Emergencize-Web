'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Camera, Check, AlertCircle } from 'lucide-react'
import { useLocalization } from '../../localization/LocalizationProvider'
import { validationService } from '@/services/ValidationService'

interface ProfileStepProps {
  onDataChange: (data: any) => void
  initialData?: any
}

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  avatar?: string
  emergencyContactName: string
  emergencyContactPhone: string
}

export function ProfileStep({ onDataChange, initialData }: ProfileStepProps) {
  const { t, isRTL } = useLocalization()
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)

  const validateAndUpdateData = useCallback(async () => {
    setIsValidating(true)
    try {
      const validationResult = validationService.validateUserProfile(profileData)
      
      if (validationResult.isValid) {
        setErrors({})
        onDataChange(profileData)
      } else {
        const errorMap: Record<string, string> = {}
        Object.entries(validationResult.errors).forEach(([field, fieldErrors]) => {
          errorMap[field] = fieldErrors.join(', ')
        })
        setErrors(errorMap)
      }
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setIsValidating(false)
    }
  }, [profileData, onDataChange])

  useEffect(() => {
    validateAndUpdateData()
  }, [validateAndUpdateData])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real app, you'd upload to a service and get a URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          avatar: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const inputFields = [
    {
      key: 'firstName',
      label: t('profile.firstName'),
      icon: User,
      type: 'text',
      required: true,
      placeholder: t('profile.firstNamePlaceholder')
    },
    {
      key: 'lastName',
      label: t('profile.lastName'),
      icon: User,
      type: 'text',
      required: true,
      placeholder: t('profile.lastNamePlaceholder')
    },
    {
      key: 'email',
      label: t('profile.email'),
      icon: Mail,
      type: 'email',
      required: true,
      placeholder: t('profile.emailPlaceholder')
    },
    {
      key: 'phone',
      label: t('profile.phone'),
      icon: Phone,
      type: 'tel',
      required: true,
      placeholder: t('profile.phonePlaceholder')
    },
    {
      key: 'address',
      label: t('profile.address'),
      icon: MapPin,
      type: 'text',
      required: false,
      placeholder: t('profile.addressPlaceholder')
    }
  ]

  const emergencyContactFields = [
    {
      key: 'emergencyContactName',
      label: t('profile.emergencyContactName'),
      icon: User,
      type: 'text',
      required: true,
      placeholder: t('profile.emergencyContactNamePlaceholder')
    },
    {
      key: 'emergencyContactPhone',
      label: t('profile.emergencyContactPhone'),
      icon: Phone,
      type: 'tel',
      required: true,
      placeholder: t('profile.emergencyContactPhonePlaceholder')
    }
  ]

  const isFormValid = Object.keys(errors).length === 0 && 
    profileData.firstName && profileData.lastName && profileData.email && 
    profileData.phone && profileData.emergencyContactName && 
    profileData.emergencyContactPhone

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('onboarding.setupProfile')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('onboarding.profileDescription')}
        </p>
      </motion.div>

      {/* Avatar Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="flex justify-center mb-8"
      >
        <div className="relative">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {profileData.avatar ? (
              <Image 
                src={profileData.avatar} 
                alt="Avatar" 
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} className="text-gray-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
            <Camera size={16} className="text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
        </div>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600 mb-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          {t('profile.personalInformation')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inputFields.map((field, index) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
              className={field.key === 'address' ? 'md:col-span-2' : ''}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <field.icon size={20} className="text-gray-400" />
                </div>
                <input
                  type={field.type}
                  value={profileData[field.key as keyof ProfileData] || ''}
                  onChange={(e) => handleInputChange(field.key as keyof ProfileData, e.target.value)}
                  placeholder={field.placeholder}
                  className={`
                    w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                    ${errors[field.key] 
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }
                    text-gray-900 dark:text-gray-100
                  `}
                />
                {errors[field.key] && (
                  <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}>
                    <AlertCircle size={20} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors[field.key] && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors[field.key]}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Emergency Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600 mb-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Phone className="w-5 h-5 mr-2" />
          {t('profile.emergencyContact')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('profile.emergencyContactDescription')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyContactFields.map((field, index) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <field.icon size={20} className="text-gray-400" />
                </div>
                <input
                  type={field.type}
                  value={profileData[field.key as keyof ProfileData] || ''}
                  onChange={(e) => handleInputChange(field.key as keyof ProfileData, e.target.value)}
                  placeholder={field.placeholder}
                  className={`
                    w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                    ${errors[field.key] 
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }
                    text-gray-900 dark:text-gray-100
                  `}
                />
                {errors[field.key] && (
                  <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}>
                    <AlertCircle size={20} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors[field.key] && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors[field.key]}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Validation Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className={`
          flex items-center justify-center space-x-2 p-4 rounded-lg
          ${isFormValid 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
          }
        `}
      >
        {isValidating ? (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : isFormValid ? (
          <Check className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span className="font-medium">
          {isValidating 
            ? t('common.validating')
            : isFormValid 
              ? t('profile.profileComplete')
              : t('profile.profileIncomplete')
          }
        </span>
      </motion.div>
    </div>
  )
}

export default ProfileStep