'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  AlertTriangle, 
  Heart, 
  UserPlus, 
  MessageCircle,
  Phone,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Home,
  Settings,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getUserNotifications, markNotificationAsRead, type NotificationHistory } from '@/lib/database'

type NotificationFilter = 'all' | 'alerts' | 'requests' | 'messages' | 'calls'

export default function NotificationsPage() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState<NotificationHistory[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<NotificationFilter>('all')

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const unsubscribe = getUserNotifications(user.uid, (notificationsData) => {
      setNotifications(notificationsData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    let filtered = notifications

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(notification => {
        switch (filter) {
          case 'alerts':
            return notification.type === 'alert_sent' || notification.type === 'alert_received'
          case 'requests':
            return notification.type === 'friend_request_sent' || notification.type === 'friend_request_received'
          case 'messages':
            return notification.type.includes('message')
          case 'calls':
            return notification.type.includes('call')
          default:
            return true
        }
      })
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchTerm, filter])

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert_sent':
      case 'alert_received':
        return <AlertTriangle size={20} className="text-red-400" />
      case 'friend_request_sent':
      case 'friend_request_received':
        return <UserPlus size={20} className="text-blue-400" />
      case 'contact_added':
        return <UserPlus size={20} className="text-green-400" />
      default:
        return <Bell size={20} className="text-gray-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert_sent':
      case 'alert_received':
        return 'border-red-400 bg-red-400'
      case 'friend_request_sent':
      case 'friend_request_received':
        return 'border-blue-400 bg-blue-400'
      case 'contact_added':
        return 'border-green-400 bg-green-400'
      default:
        return 'border-gray-400 bg-gray-400'
    }
  }

  const formatTimeAgo = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 flex items-center justify-center">
        <motion.div
          className="glass-effect rounded-2xl p-8 w-full max-w-md mx-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-blue-200">Please sign in to view your notifications</p>
          </div>
          
          <Link 
            href="/"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Home className="mr-2" size={20} />
            Return to Home
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800">
      {/* Header */}
      <motion.header
        className="backdrop-blur-sm bg-white bg-opacity-10 border-b border-white border-opacity-20 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <ArrowLeft size={20} className="text-white" />
                <span className="text-white">Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-white text-sm hidden sm:block">
                {user.email?.split('@')[0]}
              </span>
              
              <Link href="/dashboard">
                <motion.button
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Home size={20} />
                </motion.button>
              </Link>
              
              <motion.button
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings size={20} />
              </motion.button>
              
              <motion.button 
                onClick={logout}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", stiffness: 200 }}
          >
            <Bell size={32} className="text-blue-600" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Notification History
          </h1>
          <p className="text-blue-200">
            View all your past alerts, requests, and updates
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          className="glass-effect rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', icon: Bell },
                { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
                { key: 'requests', label: 'Requests', icon: UserPlus },
                { key: 'messages', label: 'Messages', icon: MessageCircle },
                { key: 'calls', label: 'Calls', icon: Phone }
              ].map(({ key, label, icon: Icon }) => (
                <motion.button
                  key={key}
                  onClick={() => setFilter(key as NotificationFilter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {loading ? (
            <div className="text-center py-12">
              <motion.div
                className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-gray-300 mt-4">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg mb-2">No notifications found</p>
              <p className="text-gray-400">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'Your notifications will appear here'
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  className={`glass-effect rounded-xl p-6 border-l-4 ${
                    notification.isRead ? 'opacity-70' : ''
                  } ${getNotificationColor(notification.type)} bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-white font-semibold">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          )}
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          <span className="capitalize">
                            {notification.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {notification.isRead && (
                      <CheckCircle2 size={20} className="text-green-400 flex-shrink-0 ml-4" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Statistics */}
        {!loading && notifications.length > 0 && (
          <motion.div
            className="glass-effect rounded-2xl p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-white font-semibold mb-4">Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {notifications.length}
                </div>
                <div className="text-gray-300 text-sm">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {notifications.filter(n => n.isRead).length}
                </div>
                <div className="text-gray-300 text-sm">Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {notifications.filter(n => n.type.includes('alert')).length}
                </div>
                <div className="text-gray-300 text-sm">Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {notifications.filter(n => n.type.includes('request')).length}
                </div>
                <div className="text-gray-300 text-sm">Requests</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}