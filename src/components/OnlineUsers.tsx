'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Circle, MessageCircle } from 'lucide-react'
import ChatWindow from './ChatWindow'

interface User {
  id: string
  name: string
  isOnline: boolean
  lastSeen?: Date
}

interface OnlineUsersProps {
  users: User[]
  currentUserId?: string
}

export default function OnlineUsers({ users, currentUserId }: OnlineUsersProps) {
  const [selectedChat, setSelectedChat] = useState<User | null>(null)
  
  const onlineUsers = users.filter(user => user.isOnline && user.id !== currentUserId)
  const offlineUsers = users.filter(user => !user.isOnline && user.id !== currentUserId)

  return (
    <motion.div
      className="glass-effect rounded-2xl p-6 w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center space-x-3 mb-4">
        <Users className="text-white" size={24} />
        <h2 className="text-white text-xl font-semibold">Emergency Contacts</h2>
      </div>

      <div className="space-y-4">
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div>
            <h3 className="text-green-300 text-sm font-medium mb-2 flex items-center">
              <Circle size={8} className="text-green-400 mr-2 fill-current" />
              Online ({onlineUsers.length})
            </h3>
            <AnimatePresence>
              {onlineUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-white bg-opacity-10 rounded-lg mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="online-indicator"></div>
                    <span className="text-white font-medium">{user.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => setSelectedChat(user)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Start Chat"
                    >
                      <MessageCircle size={16} />
                    </motion.button>
                    <motion.div
                      className="text-green-300 text-sm"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Available
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Offline Users */}
        {offlineUsers.length > 0 && (
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-2 flex items-center">
              <Circle size={8} className="text-gray-500 mr-2 fill-current" />
              Offline ({offlineUsers.length})
            </h3>
            <AnimatePresence>
              {offlineUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg mb-2 opacity-60"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.6, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="offline-indicator"></div>
                    <span className="text-gray-300 font-medium">{user.name}</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {user.lastSeen ? 
                      `Last seen ${user.lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                      : 'Offline'
                    }
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* No users message */}
        {users.length === 0 && (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Users size={48} className="text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300">No emergency contacts added yet</p>
            <p className="text-gray-400 text-sm mt-1">Add contacts to send emergency alerts</p>
          </motion.div>
        )}
      </div>

      {onlineUsers.length > 0 && (
        <motion.div
          className="mt-4 p-3 bg-green-500 bg-opacity-20 rounded-lg border border-green-400 border-opacity-30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <p className="text-green-200 text-sm text-center">
            {onlineUsers.length} contact{onlineUsers.length > 1 ? 's' : ''} available for emergency alerts
          </p>
        </motion.div>
      )}

      {/* Chat Window */}
      {selectedChat && currentUserId && (
        <ChatWindow
          isOpen={!!selectedChat}
          onClose={() => setSelectedChat(null)}
          contact={{
            id: selectedChat.id,
            userId: selectedChat.id,
            name: selectedChat.name,
            isOnline: selectedChat.isOnline
          }}
          currentUserId={currentUserId}
        />
      )}
    </motion.div>
  )
}