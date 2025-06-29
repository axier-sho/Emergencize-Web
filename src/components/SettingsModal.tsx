'use client'

import { useState } from 'react'
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
  Phone
} from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser?: {
    email: string
    displayName?: string
  }
}

export default function SettingsModal({ isOpen, onClose, currentUser }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'emergency'>('profile')
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'emergency', label: 'Emergency', icon: Shield }
  ]

  const handleSave = () => {
    // Save settings to database
    console.log('Saving settings:', settings)
    onClose()
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
              className="glass-effect rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
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

              <div className="flex h-[600px]">
                {/* Sidebar */}
                <div className="w-64 border-r border-white border-opacity-20 p-6">
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
                <div className="flex-1 p-6 overflow-y-auto">
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
                        {[
                          { key: 'soundEnabled', label: 'Sound Notifications', icon: Volume2, description: 'Play sound for incoming alerts' },
                          { key: 'vibrationEnabled', label: 'Vibration', icon: Vibrate, description: 'Vibrate device for alerts (mobile)' },
                          { key: 'pushNotifications', label: 'Push Notifications', icon: Smartphone, description: 'Receive push notifications' },
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
              <div className="flex justify-end space-x-4 p-6 border-t border-white border-opacity-20">
                <motion.button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Save size={18} className="mr-2" />
                  Save Settings
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}