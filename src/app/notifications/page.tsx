'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  AlertTriangle, 
  UserPlus, 
  Search,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Home,
  Settings,
  LogOut,
  Filter,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getUserNotifications, markNotificationAsRead, type NotificationHistory } from '@/lib/database'

type NotificationFilter = 'all' | 'alerts' | 'requests' | 'contacts'

export default function NotificationsPage() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState<NotificationHistory[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<NotificationFilter>('all')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribe = getUserNotifications(user.uid, (notifs) => {
      setNotifications(notifs)
      setFilteredNotifications(notifs)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    let filtered = notifications

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(notif => {
        switch (filter) {
          case 'alerts':
            return notif.type.includes('alert')
          case 'requests':
            return notif.type.includes('request')
          case 'contacts':
            return notif.type === 'contact_added'
          default:
            return true
        }
      })
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(notif =>
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }, [filter, searchQuery, notifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes('alert')) {
      return <AlertTriangle size={20} className="text-red-400" />
    } else if (type.includes('request')) {
      return <UserPlus size={20} className="text-blue-400" />
    }
    return <Bell size={20} className="text-slate-400" />
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="modern-card max-w-md mx-4 p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Bell size={48} className="text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-slate-300 mb-6">Please sign in to view your notifications</p>
          <Link href="/">
            <button className="btn-primary w-full">
              <Home className="mr-2 inline" size={18} />
              Go to Home
            </button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <motion.header
        className="backdrop-blur-xl bg-slate-900/40 border-b border-white/10 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <motion.button
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={20} />
                  <span className="hidden sm:inline">Back</span>
                </motion.button>
              </Link>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Bell size={20} className="text-blue-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Notifications</h1>
                  {unreadCount > 0 && (
                    <p className="text-xs text-slate-400">{unreadCount} unread</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <motion.button
                  className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Home size={20} />
                </motion.button>
              </Link>

              <motion.button
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {(['all', 'alerts', 'requests', 'contacts'] as NotificationFilter[]).map((f) => (
                <motion.button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-blue-500"></div>
            <p className="text-slate-400 mt-4">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            className="modern-card p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Bell size={48} className="text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Notifications</h3>
            <p className="text-slate-400">
              {searchQuery || filter !== 'all'
                ? 'No notifications match your search or filter'
                : "You're all caught up!"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  className={`modern-card p-6 ${!notification.isRead ? 'border-l-4 border-blue-500' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icon */}
                      <div className={`p-3 rounded-xl ${
                        notification.type.includes('alert')
                          ? 'bg-red-500/20'
                          : notification.type.includes('request')
                          ? 'bg-blue-500/20'
                          : 'bg-slate-500/20'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 mb-2">{notification.message}</p>
                        <div className="flex items-center text-sm text-slate-400">
                          <Clock size={14} className="mr-1" />
                          <span>
                            {notification.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {!notification.isRead && (
                        <motion.button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Mark as read"
                        >
                          <CheckCircle2 size={20} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
