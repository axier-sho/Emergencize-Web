'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Smartphone, 
  Globe, 
  Shield,
  Volume2,
  Vibrate,
  Save,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/hooks/useAuth'
import { updateUserProfile, getUserProfile } from '@/lib/database'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser?: {
    email: string
    displayName?: string
  }
}

export default function SettingsModal({ isOpen, onClose, currentUser }: SettingsModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'emergency'>('profile')
  const {
    permission,
    isSubscribed,
    isLoading: pushLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications()
  const [settings, setSettings] = useState({
    // Profile settings
    displayName: currentUser?.displayName || '',
    phone: '',
    emergencyInfo: '',
    
    // Notification settings
    soundEnabled: true,
    vibrationEnabled: true,
    pushNotifications: true,
    emailAlerts: true,
    
    // Privacy settings
    locationSharing: true,
    onlineStatus: true,
    profileVisibility: 'contacts', // 'contacts' | 'public' | 'private'
    
    // Emergency settings
    autoLocationShare: true,
    emergencyTimeout: 30, // seconds
    requireConfirmation: true,
    emergencyContacts: 3
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'emergency', label: 'Emergency', icon: Shield }
  ]

  useEffect(() => {
    if (!isOpen) {
      setSaveSuccess(false)
      setSaveError(null)
      return
    }

    if (!user?.uid) {
      return
    }

    let cancelled = false
    setProfileLoading(true)

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid)
        if (!profile || cancelled) {
          return
        }

        const profileAny = profile as Record<string, any>
        setSettings((prev) => ({
          ...prev,
          displayName:
            profile.displayName ??
            currentUser?.displayName ??
            prev.displayName ??
            '',
          phone: profileAny.phone ?? prev.phone ?? '',
          emergencyInfo: profileAny.emergencyInfo ?? prev.emergencyInfo ?? '',
          profileVisibility: profileAny.profileVisibility ?? prev.profileVisibility,
          soundEnabled:
            typeof profileAny.soundEnabled === 'boolean'
              ? profileAny.soundEnabled
              : prev.soundEnabled,
          vibrationEnabled:
            typeof profileAny.vibrationEnabled === 'boolean'
              ? profileAny.vibrationEnabled
              : prev.vibrationEnabled,
          pushNotifications:
            typeof profileAny.pushNotifications === 'boolean'
              ? profileAny.pushNotifications
              : prev.pushNotifications,
          emailAlerts:
            typeof profileAny.emailAlerts === 'boolean'
              ? profileAny.emailAlerts
              : prev.emailAlerts,
          locationSharing:
            typeof profileAny.locationSharing === 'boolean'
              ? profileAny.locationSharing
              : prev.locationSharing,
          onlineStatus:
            typeof profileAny.onlineStatus === 'boolean'
              ? profileAny.onlineStatus
              : prev.onlineStatus,
          autoLocationShare:
            typeof profileAny.autoLocationShare === 'boolean'
              ? profileAny.autoLocationShare
              : prev.autoLocationShare,
          emergencyTimeout:
            typeof profileAny.emergencyTimeout === 'number'
              ? profileAny.emergencyTimeout
              : prev.emergencyTimeout,
          requireConfirmation:
            typeof profileAny.requireConfirmation === 'boolean'
              ? profileAny.requireConfirmation
              : prev.requireConfirmation,
          emergencyContacts:
            typeof profileAny.emergencyContacts === 'number'
              ? profileAny.emergencyContacts
              : prev.emergencyContacts
        }))
      } catch (error) {
        console.error('Failed to load user profile settings:', error)
      } finally {
        if (!cancelled) {
          setProfileLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [isOpen, user?.uid, currentUser?.displayName])

  const handleSave = async () => {
    if (!user) {
      setSaveError('You need to be signed in to update your profile.')
      return
    }

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateUserProfile(user.uid, {
        displayName: settings.displayName,
        phone: settings.phone,
        emergencyInfo: settings.emergencyInfo,
        profileVisibility: settings.profileVisibility,
        soundEnabled: settings.soundEnabled,
        vibrationEnabled: settings.vibrationEnabled,
        pushNotifications: settings.pushNotifications,
        emailAlerts: settings.emailAlerts,
        locationSharing: settings.locationSharing,
        onlineStatus: settings.onlineStatus,
        autoLocationShare: settings.autoLocationShare,
        emergencyTimeout: settings.emergencyTimeout,
        requireConfirmation: settings.requireConfirmation,
        emergencyContacts: settings.emergencyContacts
      })
      setSaveSuccess(true)
    } catch (e) {
      console.error('Failed to save settings:', e)
      setSaveError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              className="glass-effect rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-white border-opacity-20">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <SettingsIcon className="mr-3 text-blue-400" size={28} />
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex h-[80vh] md:h-[600px] flex-col md:flex-row">
                {/* Mobile Tabs */}
                <div className="md:hidden px-4 pt-4 border-b border-white border-opacity-10">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 bg-white/5'
                          }`}
                          aria-pressed={activeTab === tab.id}
                        >
                          <Icon size={16} />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="hidden md:block md:w-64 border-r border-white border-opacity-20 p-6">
                  <nav className="space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <motion.button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                            activeTab === tab.id
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon size={20} />
                          <span>{tab.label}</span>
                        </motion.button>
                      )
                    })}
                  </nav>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                  {profileLoading && (
                    <div className="mb-4 flex items-center text-blue-200 text-sm gap-2">
                      <Loader size={16} className="animate-spin" />
                      <span>Loading your current settings…</span>
                    </div>
                  )}
                  {activeTab === 'profile' && (
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-xl font-semibold text-white mb-4">Profile Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={settings.displayName}
                            onChange={(e) => updateSetting('displayName', e.target.value)}
                            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                            placeholder="Enter your display name"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm font-medium mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={currentUser?.email || ''}
                            disabled
                            className="w-full px-4 py-3 bg-gray-600 bg-opacity-50 border border-white border-opacity-20 rounded-lg text-gray-300 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm font-medium mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={settings.phone}
                            onChange={(e) => updateSetting('phone', e.target.value)}
                            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                            placeholder="Enter your phone number"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-white text-sm font-medium mb-2">
                            Emergency Information
                          </label>
                          <textarea
                            value={settings.emergencyInfo}
                            onChange={(e) => updateSetting('emergencyInfo', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                            placeholder="Medical conditions, allergies, emergency contacts..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'notifications' && (
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-xl font-semibold text-white mb-4">Notification Preferences</h3>
                      
                      <div className="space-y-4">
                        {/* Push Notifications - Special handling */}
                        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-500/30">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <Bell size={24} className="text-blue-400 mt-1" />
                              <div className="flex-1">
                                <h4 className="text-white font-semibold text-lg">Push Notifications</h4>
                                <p className="text-gray-300 text-sm mb-3">Receive emergency alerts even when the app is closed</p>
                                
                                {/* Status Badge */}
                                <div className="flex items-center space-x-2 mb-3">
                                  {permission === 'granted' && isSubscribed ? (
                                    <div className="flex items-center space-x-1 text-green-400 text-sm">
                                      <CheckCircle size={16} />
                                      <span>Enabled & Active</span>
                                    </div>
                                  ) : permission === 'granted' ? (
                                    <div className="flex items-center space-x-1 text-yellow-400 text-sm">
                                      <AlertCircle size={16} />
                                      <span>Granted but not subscribed</span>
                                    </div>
                                  ) : permission === 'denied' ? (
                                    <div className="flex items-center space-x-1 text-red-400 text-sm">
                                      <AlertCircle size={16} />
                                      <span>Blocked - Enable in browser settings</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1 text-gray-400 text-sm">
                                      <AlertCircle size={16} />
                                      <span>Not enabled</span>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2">
                                  {permission !== 'granted' && (
                                    <motion.button
                                      onClick={async () => {
                                        const result = await requestPermission()
                                        if (result.granted) {
                                          await subscribe()
                                        }
                                      }}
                                      disabled={pushLoading || permission === 'denied'}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                      whileHover={permission !== 'denied' ? { scale: 1.02 } : {}}
                                      whileTap={permission !== 'denied' ? { scale: 0.98 } : {}}
                                    >
                                      {pushLoading ? (
                                        <>
                                          <Loader size={16} className="animate-spin" />
                                          <span>Enabling...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Bell size={16} />
                                          <span>Enable Notifications</span>
                                        </>
                                      )}
                                    </motion.button>
                                  )}

                                  {permission === 'granted' && !isSubscribed && (
                                    <motion.button
                                      onClick={subscribe}
                                      disabled={pushLoading}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      {pushLoading ? (
                                        <>
                                          <Loader size={16} className="animate-spin" />
                                          <span>Subscribing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle size={16} />
                                          <span>Subscribe</span>
                                        </>
                                      )}
                                    </motion.button>
                                  )}

                                  {permission === 'granted' && isSubscribed && (
                                    <>
                                      <motion.button
                                        onClick={testNotification}
                                        disabled={pushLoading}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <Bell size={16} />
                                        <span>Test Notification</span>
                                      </motion.button>

                                      <motion.button
                                        onClick={unsubscribe}
                                        disabled={pushLoading}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <X size={16} />
                                        <span>Disable</span>
                                      </motion.button>
                                    </>
                                  )}
                                </div>

                                {permission === 'denied' && (
                                  <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                                    <p className="text-red-200 text-sm">
                                      <strong>Notifications are blocked.</strong> To enable them:
                                    </p>
                                    <ol className="text-red-200 text-xs mt-2 space-y-1 ml-4 list-decimal">
                                      <li>Click the lock/info icon in your browser&apos;s address bar</li>
                                      <li>Find &quot;Notifications&quot; and change to &quot;Allow&quot;</li>
                                      <li>Refresh this page</li>
                                    </ol>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Other notification settings */}
                        {[
                          { key: 'soundEnabled', label: 'Sound Notifications', icon: Volume2, description: 'Play sound for incoming alerts' },
                          { key: 'vibrationEnabled', label: 'Vibration', icon: Vibrate, description: 'Vibrate device for alerts (mobile)' },
                          { key: 'emailAlerts', label: 'Email Alerts', icon: Mail, description: 'Send alerts to your email' }
                        ].map((option) => {
                          const Icon = option.icon
                          return (
                            <div key={option.key} className="bg-white bg-opacity-5 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Icon size={20} className="text-blue-400" />
                                  <div>
                                    <h4 className="text-white font-medium">{option.label}</h4>
                                    <p className="text-gray-300 text-sm">{option.description}</p>
                                  </div>
                                </div>
                                <motion.button
                                  onClick={() => updateSetting(option.key, !settings[option.key as keyof typeof settings])}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${
                                    settings[option.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-600'
                                  }`}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <motion.div
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                    animate={{
                                      x: settings[option.key as keyof typeof settings] ? 24 : 4
                                    }}
                                    transition={{ duration: 0.2 }}
                                  />
                                </motion.button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'privacy' && (
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-xl font-semibold text-white mb-4">Privacy & Security</h3>
                      
                      <div className="space-y-4">
                        {[
                          { key: 'locationSharing', label: 'Location Sharing', icon: Globe, description: 'Share location in emergency alerts' },
                          { key: 'onlineStatus', label: 'Online Status', icon: Smartphone, description: 'Show when you are online' }
                        ].map((option) => {
                          const Icon = option.icon
                          return (
                            <div key={option.key} className="bg-white bg-opacity-5 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Icon size={20} className="text-blue-400" />
                                  <div>
                                    <h4 className="text-white font-medium">{option.label}</h4>
                                    <p className="text-gray-300 text-sm">{option.description}</p>
                                  </div>
                                </div>
                                <motion.button
                                  onClick={() => updateSetting(option.key, !settings[option.key as keyof typeof settings])}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${
                                    settings[option.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-600'
                                  }`}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <motion.div
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                    animate={{
                                      x: settings[option.key as keyof typeof settings] ? 24 : 4
                                    }}
                                    transition={{ duration: 0.2 }}
                                  />
                                </motion.button>
                              </div>
                            </div>
                          )
                        })}

                        <div className="bg-white bg-opacity-5 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <User size={20} className="text-blue-400" />
                              <div>
                                <h4 className="text-white font-medium">Profile Visibility</h4>
                                <p className="text-gray-300 text-sm">Who can see your profile information</p>
                              </div>
                            </div>
                            <select
                              value={settings.profileVisibility}
                              onChange={(e) => updateSetting('profileVisibility', e.target.value)}
                              className="px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                            >
                              <option value="contacts">Contacts Only</option>
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'emergency' && (
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-xl font-semibold text-white mb-4">Emergency Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white bg-opacity-5 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Globe size={20} className="text-blue-400" />
                              <div>
                                <h4 className="text-white font-medium">Auto Location Share</h4>
                                <p className="text-gray-300 text-sm">Automatically include location in emergency alerts</p>
                              </div>
                            </div>
                            <motion.button
                              onClick={() => updateSetting('autoLocationShare', !settings.autoLocationShare)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                settings.autoLocationShare ? 'bg-blue-600' : 'bg-gray-600'
                              }`}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.div
                                className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                animate={{ x: settings.autoLocationShare ? 24 : 4 }}
                                transition={{ duration: 0.2 }}
                              />
                            </motion.button>
                          </div>
                        </div>

                        <div className="bg-white bg-opacity-5 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Shield size={20} className="text-blue-400" />
                              <div>
                                <h4 className="text-white font-medium">Require Confirmation</h4>
                                <p className="text-gray-300 text-sm">Require confirmation before sending DANGER alerts</p>
                              </div>
                            </div>
                            <motion.button
                              onClick={() => updateSetting('requireConfirmation', !settings.requireConfirmation)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                settings.requireConfirmation ? 'bg-blue-600' : 'bg-gray-600'
                              }`}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.div
                                className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                animate={{ x: settings.requireConfirmation ? 24 : 4 }}
                                transition={{ duration: 0.2 }}
                              />
                            </motion.button>
                          </div>
                        </div>

                        <div className="bg-white bg-opacity-5 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Bell size={20} className="text-blue-400" />
                              <div>
                                <h4 className="text-white font-medium">Emergency Timeout</h4>
                                <p className="text-gray-300 text-sm">Time to wait before auto-sending location updates</p>
                              </div>
                            </div>
                            <select
                              value={settings.emergencyTimeout}
                              onChange={(e) => updateSetting('emergencyTimeout', parseInt(e.target.value))}
                              className="px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                            >
                              <option value={15}>15 seconds</option>
                              <option value={30}>30 seconds</option>
                              <option value={60}>1 minute</option>
                              <option value={120}>2 minutes</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 md:p-6 border-t border-white border-opacity-20">
                <div className="min-h-[20px]">
                  {saveSuccess && (
                    <div className="flex items-center text-green-300 text-sm gap-2">
                      <CheckCircle size={16} />
                      <span>Settings saved successfully.</span>
                    </div>
                  )}
                  {saveError && (
                    <div className="flex items-center text-red-300 text-sm gap-2">
                      <AlertCircle size={16} />
                      <span>{saveError}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    onClick={onClose}
                    className="px-5 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSave}
                    disabled={saving || profileLoading}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/60 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center"
                    whileHover={!(saving || profileLoading) ? { scale: 1.02 } : {}}
                    whileTap={!(saving || profileLoading) ? { scale: 0.98 } : {}}
                  >
                    {saving ? (
                      <>
                        <Loader size={18} className="mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Save Settings
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}