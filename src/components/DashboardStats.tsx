'use client'

import { motion } from 'framer-motion'
import { Users, Shield, Zap, Clock } from 'lucide-react'

interface DashboardStatsProps {
  onlineUsers: number
  totalContacts: number
  alertsSent: number
  responseTime: string
}

export default function DashboardStats({ 
  onlineUsers, 
  totalContacts, 
  alertsSent, 
  responseTime 
}: DashboardStatsProps) {
  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      label: "Online Contacts",
      value: onlineUsers,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      description: "Available now"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      label: "Total Contacts",
      value: totalContacts,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      description: "Emergency contacts"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: "Alerts Sent",
      value: alertsSent,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      description: "This month"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: "Avg Response",
      value: responseTime,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      description: "Response time"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="glass-effect rounded-2xl p-6 hover:bg-white hover:bg-opacity-10 transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {stat.value}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-1">
              {stat.label}
            </h3>
            <p className="text-gray-300 text-sm">
              {stat.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}