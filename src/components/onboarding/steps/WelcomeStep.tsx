'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Shield, Users, Zap, Globe, Heart } from 'lucide-react'
import { useLocalization } from '../../localization/LocalizationProvider'
import LanguageSelector from '../../localization/LanguageSelector'

interface WelcomeStepProps {
  onDataChange: (data: any) => void
  initialData?: any
}

export function WelcomeStep({ onDataChange, initialData }: WelcomeStepProps) {
  const { t, isRTL } = useLocalization()

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('alerts.realTimeAlerts'),
      description: t('alerts.instantNotifications')
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('navigation.contacts'),
      description: t('alerts.onlinePresence')
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: t('common.location'),
      description: t('alerts.locationShared')
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: t('navigation.medical'),
      description: t('alerts.medicalInfoIncluded')
    }
  ]

  useEffect(() => {
    // Mark this step as having initial data (language selection)
    onDataChange({ 
      welcomed: true, 
      timestamp: new Date().toISOString(),
      ...initialData 
    })
  }, [onDataChange, initialData])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 1, 
            type: "spring",
            stiffness: 200,
            damping: 15 
          }}
          className="mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
            <AlertTriangle size={48} className="text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4"
        >
          {t('onboarding.welcome')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl text-gray-600 dark:text-gray-400 mb-8"
        >
          {t('onboarding.subtitle')}
        </motion.p>

        {/* Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('common.selectLanguage')}:
            </span>
            <LanguageSelector compact={true} />
          </div>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
            className={`
              bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600
              hover:shadow-md transition-shadow
              ${isRTL ? 'text-right' : 'text-left'}
            `}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className={`flex items-start space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="text-blue-600 dark:text-blue-400">
                  {feature.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Key Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          {t('onboarding.keyBenefits')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('onboarding.instantAlerts')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('onboarding.instantAlertsDesc')}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('onboarding.securePrivate')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('onboarding.securePrivateDesc')}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('onboarding.stayConnected')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('onboarding.stayConnectedDesc')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Setup Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t('onboarding.setupNotice')}
          </span>
        </div>
      </motion.div>
    </div>
  )
}

export default WelcomeStep