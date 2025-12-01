'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Timestamp } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { useContacts } from '@/hooks/useContacts'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { saveAlert, findUserByEmail, getUserAlerts } from '@/lib/database'
import { logger } from '@/utils/logger'
import LoadingAnimation from '@/components/LoadingAnimation'
import EmergencyButton from '@/components/EmergencyButton'
import OnlineUsers from '@/components/OnlineUsers'
import AlertNotification from '@/components/AlertNotification'
import DashboardStats from '@/components/DashboardStats'
import QuickActions from '@/components/QuickActions'
import ContactManager from '@/components/ContactManager'
import SettingsModal from '@/components/SettingsModal'
import EmergencyChat from '@/components/EmergencyChat'
import {
  Settings,
  LogOut,
  Home,
  Bell,
  Activity,
  Wifi,
  WifiOff,
  Navigation
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Alert {
  id: string
  type: 'help' | 'danger'
  fromUser: string
  message: string
  timestamp: Date
  location?: { lat: number; lng: number; address?: string }
  isRead?: boolean
  source?: 'history' | 'realtime'
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  isOnline: boolean
  lastSeen?: Date
  relationship?: string
  contactUserId?: string
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const { contacts, loading: contactsLoading, addContact, removeContact, updateContact } = useContacts()
  const { friendRequests, sendFriendRequest, respondToFriendRequest } = useFriendRequests()
  const [showLoading, setShowLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null)
  const [contactManagerOpen, setContactManagerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [emergencyChatOpen, setEmergencyChatOpen] = useState(false)
  const [lastAlertTime, setLastAlertTime] = useState<number>(0)

  const contactIds = useMemo(
    () =>
      contacts
        .map((contact) => contact.contactUserId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    [contacts]
  )

  const onlineContactIds = useMemo(
    () =>
      contacts
        .filter((c) => c.isOnline)
        .map((c) => c.contactUserId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    [contacts]
  )

  const onlineContacts = useMemo(() => contacts.filter((c) => c.isOnline), [contacts])
  const pushAlert = useCallback((alert: Alert) => {
    const normalized: Alert = {
      ...alert,
      source: alert.source ?? 'realtime',
      timestamp: alert.timestamp instanceof Date ? alert.timestamp : new Date(alert.timestamp)
    }

    setAlerts((prev) => {
      const updated = [normalized, ...prev]
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      return updated
        .filter((item) => item.timestamp.getTime() > oneDayAgo)
        .slice(0, 50)
    })
  }, [])

  const handleEmergencyAlertReceived = useCallback((alert: any) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      ...alert,
      timestamp: new Date(alert.timestamp),
      fromUser: alert.fromUserId || 'Unknown User'
    }
    pushAlert(newAlert)
  }, [pushAlert])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem('emergencize-alerts')
      if (!stored) return

      const parsed = JSON.parse(stored) as Array<Omit<Alert, 'timestamp'> & { timestamp: string }>
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const restored = parsed
        .map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        .filter((item) => item.timestamp.getTime() > oneDayAgo)
        .slice(0, 50)

      if (restored.length > 0) {
        setAlerts(restored)
      }
    } catch (error) {
      logger.error('Failed to restore alerts from local storage:', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const serialized = JSON.stringify(
        alerts.map((alert) => ({
          ...alert,
          timestamp: alert.timestamp.toISOString()
        }))
      )
      window.localStorage.setItem('emergencize-alerts', serialized)
    } catch (error) {
      logger.error('Failed to persist alerts to local storage:', error)
    }
  }, [alerts])

  useEffect(() => {
    if (!user?.uid) {
      return
    }

    const unsubscribe = getUserAlerts(
      user.uid,
      (items) => {
        setAlerts((prev) => {
          const historyAlerts: Alert[] = items.map((item) => {
            const createdAt =
              (item.createdAt as unknown as Timestamp | undefined)?.toDate?.() ?? new Date()
            return {
              id: item.id,
              type: item.type,
              fromUser: item.fromUserId === user.uid ? 'You' : item.fromUserId,
              message: item.message,
              timestamp: createdAt instanceof Date ? createdAt : new Date(createdAt),
              location: item.location,
              source: 'history'
            }
          })

          const bucketKey = (alert: Alert) =>
            `${alert.type}|${alert.message}|${Math.round(alert.timestamp.getTime() / 5000)}`

          const merged = new Map<string, Alert>()
          historyAlerts.forEach((alert) => {
            merged.set(bucketKey(alert), alert)
          })

          prev.forEach((alert) => {
            const key = bucketKey(alert)
            if (!merged.has(key)) {
              merged.set(key, alert)
            }
          })

          return Array.from(merged.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 50)
        })
      },
      { limit: 100 }
    )

    return unsubscribe
  }, [user?.uid])

  const { isConnected, onlineUsers, sendEmergencyAlert } = useSocket({
    userId: user?.uid,
    onEmergencyAlert: handleEmergencyAlertReceived
  })

  const networkStatus = useNetworkStatus(isConnected)

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          logger.warn('Location access denied:', error)
        }
      )
    }
  }, [])

  // Remove loading screen after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleEmergencyAlert = async (type: 'help' | 'danger') => {
    if (!user) return

    const now = Date.now()
    const RATE_LIMIT_MS = 5000
    if (now - lastAlertTime < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastAlertTime)) / 1000)
      pushAlert({
        id: `rate-limit-${now}`,
        type: 'help',
        fromUser: 'System',
        message: `Please wait ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} before sending another alert.`,
        timestamp: new Date(),
        isRead: false
      })
      logger.warn('Client-side rate limit prevented alert dispatch')
      return
    }
    setLastAlertTime(now)

    const message = type === 'danger'
      ? 'Emergency! I need immediate assistance!'
      : 'I need help, please respond when you can.'

    const alertData = {
      type,
      message,
      location: location || undefined,
      contactIds: type === 'danger' ? contactIds : onlineContactIds // DANGER alerts ALL contacts, HELP alerts only online
    }

    // Handle alert based on connection type
    if (networkStatus.connectionType === 'online') {
      // Real-time mode: Send via socket AND save to database
      sendEmergencyAlert(alertData)
      logger.info('Alert sent via real-time connection')
    } else if (networkStatus.connectionType === 'browser-only') {
      // Standard mode: Save to database only
      logger.info('Sending alert in standard mode (database only)')
    } else {
      // Offline: Queue for when back online
      logger.warn('Device offline - alert will be queued')
    }

    // Always try to save to database (Firebase works offline)
    try {
      await saveAlert({
        fromUserId: user.uid,
        type,
        message,
        location: location || undefined
      })

      if (networkStatus.connectionType !== 'online') {
        logger.info('Alert saved locally - will sync when online')
      }
    } catch (error) {
      logger.error('Failed to save alert:', error)
      // Even if database save fails, show confirmation to user
    }

    // Show confirmation based on connection type
    const targetCount = type === 'danger' ? contactIds.length : onlineContactIds.length
    let confirmationMessage = ''

    if (networkStatus.connectionType === 'online') {
      confirmationMessage = `${type.toUpperCase()} alert sent to ${targetCount} contact${targetCount !== 1 ? 's' : ''} (real-time)`
    } else if (networkStatus.connectionType === 'browser-only') {
      confirmationMessage = `${type.toUpperCase()} alert saved for ${targetCount} contact${targetCount !== 1 ? 's' : ''} (will notify when they're online)`
    } else {
      confirmationMessage = `${type.toUpperCase()} alert queued (will send when back online)`
    }

    const confirmationAlert: Alert = {
      id: Date.now().toString(),
      type,
      fromUser: 'You',
      message: confirmationMessage,
      timestamp: new Date()
    }
    pushAlert(confirmationAlert)
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ))
  }

  const respondToAlert = (alertId: string) => {
    logger.info('Responding to alert: %s', alertId)
    dismissAlert(alertId)
  }

  const handleAddContact = async (email: string, nickname?: string, relationship?: string) => {
    if (!user?.uid) {
      throw new Error('You must be signed in to add a contact.')
    }

    const targetUser = await findUserByEmail(email)
    if (!targetUser) {
      throw new Error('We could not find a user with that email address.')
    }

    if (targetUser.uid === user.uid) {
      throw new Error('You cannot add yourself as a contact.')
    }

    const alreadyContact = contacts.some(
      (contact) => contact.contactUserId === targetUser.uid && contact.userId === user.uid
    )
    if (alreadyContact) {
      throw new Error('This person is already in your emergency contacts.')
    }

    try {
      await sendFriendRequest(email)
      logger.info('Friend request sent to: %s', email)
    } catch (error: any) {
      logger.error('Error sending friend request:', error?.message ?? error)
      throw error
    }
  }

  const handleRemoveContact = async (contactId: string) => {
    try {
      await removeContact(contactId)
    } catch (error) {
      logger.error('Error removing contact:', error)
    }
  }

  const handleEditContact = async (contactId: string, updates: { nickname?: string; relationship?: string }) => {
    try {
      await updateContact(contactId, updates)
    } catch (error) {
      logger.error('Error updating contact:', error)
    }
  }

  if (authLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800" />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="glass-effect rounded-2xl p-8 w-full max-w-md mx-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-blue-200">Please sign in to access the emergency dashboard</p>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Home className="mr-2" size={20} />
              Return to Home
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {showLoading && <LoadingAnimation />}
      </AnimatePresence>

      <div className="min-h-screen relative">
        {/* Header */}
        <motion.header
          className="backdrop-blur-xl bg-slate-900/40 border-b border-white/10 sticky top-0 z-40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src="/icon-1280x1280.PNG"
                      alt="Emergencize"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                  <span className="text-white font-bold text-lg hidden sm:block">Emergencize</span>
                </Link>

                <div className="flex items-center space-x-2 text-sm">
                  {networkStatus.connectionType === 'online' ? (
                    <div className="flex items-center px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30">
                      <Wifi size={14} className="mr-1.5" />
                      <span className="hidden sm:inline font-medium">Real-time</span>
                    </div>
                  ) : networkStatus.connectionType === 'browser-only' ? (
                    <div className="flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
                      <Wifi size={14} className="mr-1.5" />
                      <span className="hidden sm:inline font-medium">Standard</span>
                    </div>
                  ) : (
                    <div className="flex items-center px-3 py-1 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
                      <WifiOff size={14} className="mr-1.5" />
                      <span className="hidden sm:inline font-medium">Offline</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-slate-300 text-sm hidden md:block">
                  Welcome, <span className="text-white font-semibold">{user.email?.split('@')[0]}</span>
                </span>

                <Link href="/notifications">
                  <motion.button
                    className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Notifications"
                  >
                    <Bell size={20} />
                  </motion.button>
                </Link>

                <Link href="/">
                  <motion.button
                    className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Home size={20} />
                  </motion.button>
                </Link>

                <motion.button
                  onClick={() => setSettingsOpen(true)}
                  className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings size={20} />
                </motion.button>

                <motion.button
                  onClick={logout}
                  className="p-2.5 text-red-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut size={20} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Stats */}
          <DashboardStats
            onlineUsers={onlineContacts.length}
            totalContacts={contacts.length}
            alertsSent={alerts.length}
            responseTime="2.3s"
          />

          {/* Quick Actions */}
          <QuickActions
            onAddContact={() => setContactManagerOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onViewAlerts={() => window.open('/notifications', '_blank')}
            onOpenChat={() => setEmergencyChatOpen(true)}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Emergency Buttons */}
            <div className="xl:col-span-2">
              <motion.div
                className="modern-card p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center">
                    <Activity className="mr-3 text-red-400" />
                    Emergency Dashboard
                  </h2>
                  <p className="text-slate-300 text-lg">
                    Press a button to alert your emergency contacts
                  </p>
                  {location && (
                    <motion.div
                      className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      <Navigation size={16} />
                      <span className="text-sm font-medium">Location sharing enabled</span>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <EmergencyButton
                    type="help"
                    onClick={() => handleEmergencyAlert('help')}
                    disabled={isConnected ? contacts.filter(c => c.isOnline).length === 0 : contacts.length === 0}
                  />
                  <EmergencyButton
                    type="danger"
                    onClick={() => handleEmergencyAlert('danger')}
                    disabled={contacts.length === 0}
                  />
                </div>

                {/* Status Messages */}
                {networkStatus.connectionType === 'browser-only' && contacts.length > 0 && (
                  <motion.div
                    className="bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-50 rounded-xl p-4 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1 }}
                  >
                    <Bell className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-200 font-medium mb-1">Standard Mode</p>
                    <p className="text-blue-300 text-sm">
                      Emergency alerts work normally. Contacts will be notified when they check the app.
                    </p>
                  </motion.div>
                )}
                {!networkStatus.isOnline && (
                  <motion.div
                    className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 rounded-xl p-4 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1 }}
                  >
                    <Bell className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-red-200 font-medium mb-1">No Internet Connection</p>
                    <p className="text-red-300 text-sm">
                      Alerts will be queued and sent when your connection is restored.
                    </p>
                  </motion.div>
                )}
                {networkStatus.connectionType === 'online' && contacts.filter(c => c.isOnline).length === 0 && contacts.length > 0 && (
                  <motion.div
                    className="bg-yellow-500 bg-opacity-20 border border-yellow-400 border-opacity-50 rounded-xl p-4 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1 }}
                  >
                    <Bell className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-yellow-200 font-medium mb-1">No contacts online</p>
                    <p className="text-yellow-300 text-sm">
                      Emergency alerts will be delivered instantly when your contacts come online.
                    </p>
                  </motion.div>
                )}
                {contacts.length === 0 && (
                  <motion.div
                    className="bg-orange-500 bg-opacity-20 border border-orange-400 border-opacity-50 rounded-xl p-4 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1 }}
                  >
                    <Bell className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <p className="text-orange-200 font-medium mb-1">No emergency contacts</p>
                    <p className="text-orange-300 text-sm">
                      Add contacts to start sending emergency alerts.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Online Users Sidebar */}
            <div className="xl:col-span-1">
              <OnlineUsers
                users={contacts.map(c => ({
                  id: c.id,
                  name: c.nickname || c.user?.displayName || c.user?.email?.split('@')[0] || 'Unknown',
                  isOnline: c.isOnline,
                  lastSeen: c.user?.lastActive?.toDate?.() || undefined
                }))}
                currentUserId={user?.uid}
              />
            </div>
          </div>
        </div>

        {/* Contact Manager Modal */}
        <ContactManager
          isOpen={contactManagerOpen}
          onClose={() => setContactManagerOpen(false)}
          contacts={contacts.map(c => ({
            id: c.id,
            name: c.nickname || c.user?.displayName || c.user?.email?.split('@')[0] || 'Unknown',
            email: c.user?.email || '',
            phone: '',
            isOnline: c.isOnline,
            relationship: c.relationship
          }))}
          onAddContact={async (data) => await handleAddContact(data.email, data.name, data.relationship)}
          onRemoveContact={handleRemoveContact}
          onEditContact={handleEditContact}
          friendRequests={friendRequests}
          onRespondToFriendRequest={respondToFriendRequest}
        />

        {/* Alert Notifications */}
        <AlertNotification
          alerts={alerts}
          onDismiss={dismissAlert}
          onRespond={respondToAlert}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentUser={{
            email: user?.email || '',
            displayName: user?.displayName || undefined
          }}
        />

        {/* Emergency Chat */}
        <EmergencyChat
          isOpen={emergencyChatOpen}
          onClose={() => setEmergencyChatOpen(false)}
          contacts={contacts.map(c => ({
            id: c.id,
            userId: c.contactUserId,
            name: c.nickname || c.user?.displayName || c.user?.email?.split('@')[0] || 'Unknown',
            isOnline: c.isOnline
          }))}
          currentUserId={user?.uid || ''}
          currentUserName={user?.displayName || user?.email?.split('@')[0] || 'Unknown'}
        />
      </div>
    </>
  )
}