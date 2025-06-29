'use client'

import { motion } from 'framer-motion'
import { Users, Settings, Plus, Bell, MessageCircle, MapPin, Zap, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface QuickActionsProps {
  onAddContact: () => void
  onOpenSettings: () => void
  onViewAlerts: () => void
  onOpenChat: () => void
}

export default function QuickActions({
  onAddContact,
  onOpenSettings,
  onViewAlerts,
  onOpenChat
}: QuickActionsProps) {
  const actions = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: "Add Contact",
      description: "Add emergency contact",
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: onAddContact
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Emergency Chat",
      description: "Group communication",
      color: "bg-green-600 hover:bg-green-700",
      onClick: onOpenChat
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Alert History",
      description: "View past alerts",
      color: "bg-yellow-600 hover:bg-yellow-700",
      onClick: onViewAlerts,
      isLink: true
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
      description: "Manage preferences",
      color: "bg-gray-600 hover:bg-gray-700",
      onClick: onOpenSettings
    }
  ]

  return (
    <motion.div
      className="glass-effect rounded-2xl p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Zap className="w-5 h-5 mr-2 text-yellow-400" />
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          if (action.isLink) {
            return (
              <Link
                key={index}
                href="/notifications"
                target="_blank"
                className={`${action.color} text-white p-4 rounded-xl transition-all text-left group block`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="flex items-center mb-2"
                >
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3 group-hover:bg-opacity-30 transition-all">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm flex items-center">
                      {action.label}
                      <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                    </h3>
                    <p className="text-xs opacity-80">
                      {action.description}
                    </p>
                  </div>
                </motion.div>
              </Link>
            )
          }

          return (
            <motion.button
              key={index}
              onClick={action.onClick}
              className={`${action.color} text-white p-4 rounded-xl transition-all text-left group block`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="flex items-center mb-2"
              >
                <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3 group-hover:bg-opacity-30 transition-all">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm flex items-center">
                    {action.label}
                  </h3>
                  <p className="text-xs opacity-80">
                    {action.description}
                  </p>
                </div>
              </motion.div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}