'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Send, 
  MessageCircle, 
  Users, 
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Video
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface Message {
  id: string
  fromUserId: string
  fromUserName: string
  content: string
  timestamp: Date
  type: 'text' | 'location' | 'alert' | 'system'
  location?: {
    lat: number
    lng: number
    address?: string
  }
}

interface Contact {
  id: string
  userId: string
  name: string
  isOnline: boolean
}

interface EmergencyChatProps {
  isOpen: boolean
  onClose: () => void
  contacts: Contact[]
  currentUserId: string
  currentUserName: string
}

export default function EmergencyChat({ 
  isOpen, 
  onClose, 
  contacts, 
  currentUserId, 
  currentUserName 
}: EmergencyChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { socket } = useSocket({
    userId: currentUserId,
    onGroupMessage: handleReceiveMessage,
    onUserTyping: handleUserTyping,
    onUserStoppedTyping: handleUserStoppedTyping
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // System message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const systemMessage: Message = {
        id: Date.now().toString(),
        fromUserId: 'system',
        fromUserName: 'System',
        content: 'Emergency group chat activated. All online contacts can see this conversation.',
        timestamp: new Date(),
        type: 'system'
      }
      setMessages([systemMessage])
    }
  }, [isOpen])

  function handleReceiveMessage(message: Message) {
    setMessages(prev => [...prev, message])
  }

  function handleUserTyping(data: { userId: string; userName: string }) {
    if (data.userId !== currentUserId) {
      setIsTyping(prev => [...prev.filter(id => id !== data.userId), data.userId])
    }
  }

  function handleUserStoppedTyping(data: { userId: string }) {
    setIsTyping(prev => prev.filter(id => id !== data.userId))
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return

    const message: Message = {
      id: Date.now().toString(),
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      content: newMessage,
      timestamp: new Date(),
      type: 'text'
    }

    // Emit to group chat
    socket.emit('group-message', {
      ...message,
      recipients: contacts.map(c => c.userId)
    })

    setMessages(prev => [...prev, message])
    setNewMessage('')
    
    // Stop typing indicator
    socket.emit('stop-typing-group', { userId: currentUserId })
  }

  const shareLocation = () => {
    if (!navigator.geolocation || !socket) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationMessage: Message = {
          id: Date.now().toString(),
          fromUserId: currentUserId,
          fromUserName: currentUserName,
          content: 'Shared their location',
          timestamp: new Date(),
          type: 'location',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }

        socket.emit('group-message', {
          ...locationMessage,
          recipients: contacts.map(c => c.userId)
        })

        setMessages(prev => [...prev, locationMessage])
      },
      (error) => {
        console.error('Error getting location:', error)
      }
    )
  }

  const sendEmergencyAlert = () => {
    if (!socket) return

    const alertMessage: Message = {
      id: Date.now().toString(),
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      content: 'EMERGENCY: Immediate assistance needed!',
      timestamp: new Date(),
      type: 'alert'
    }

    socket.emit('group-message', {
      ...alertMessage,
      recipients: contacts.map(c => c.userId)
    })

    setMessages(prev => [...prev, alertMessage])
  }

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing-group', {
        userId: currentUserId,
        userName: currentUserName,
        recipients: contacts.map(c => c.userId),
      })
    }
  }

  const handleStopTyping = () => {
    if (socket) {
      socket.emit('stop-typing-group', {
        userId: currentUserId,
        recipients: contacts.map(c => c.userId),
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
      handleStopTyping()
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'location':
        return <MapPin size={16} className="text-blue-400" />
      case 'alert':
        return <AlertTriangle size={16} className="text-red-400" />
      case 'system':
        return <MessageCircle size={16} className="text-gray-400" />
      default:
        return null
    }
  }

  const getMessageStyle = (type: string, fromCurrentUser: boolean) => {
    if (type === 'system') {
      return 'bg-gray-600 bg-opacity-30 text-gray-300 text-center border border-gray-500 border-opacity-30'
    }
    if (type === 'alert') {
      return 'bg-red-600 bg-opacity-40 text-red-100 border border-red-400 border-opacity-50'
    }
    if (type === 'location') {
      return 'bg-blue-600 bg-opacity-40 text-blue-100 border border-blue-400 border-opacity-50'
    }
    return fromCurrentUser 
      ? 'bg-blue-600 text-white' 
      : 'bg-white bg-opacity-10 text-gray-100'
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
            {/* Chat Window */}
            <motion.div
              className="glass-effect rounded-2xl w-full max-w-4xl h-[700px] flex flex-col overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-white border-opacity-20">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Emergency Group Chat</h3>
                    <p className="text-gray-300 text-sm flex items-center">
                      <Users size={14} className="mr-1" />
                      {contacts.filter(c => c.isOnline).length} online, {contacts.length} total contacts
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Quick Actions */}
                  <motion.button
                    onClick={shareLocation}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Share Location"
                  >
                    <MapPin size={18} />
                  </motion.button>
                  
                  <motion.button
                    onClick={sendEmergencyAlert}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Send Emergency Alert"
                  >
                    <AlertTriangle size={18} />
                  </motion.button>
                  
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${
                      message.type === 'system' 
                        ? 'justify-center' 
                        : message.fromUserId === currentUserId 
                          ? 'justify-end' 
                          : 'justify-start'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className={`max-w-xs px-4 py-3 rounded-lg ${
                      getMessageStyle(message.type, message.fromUserId === currentUserId)
                    }`}>
                      {message.type !== 'system' && message.fromUserId !== currentUserId && (
                        <p className="text-xs opacity-70 mb-1 font-medium">
                          {message.fromUserName}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        {getMessageIcon(message.type)}
                        <p className="text-sm flex-1">{message.content}</p>
                      </div>
                      
                      {message.location && (
                        <motion.div
                          className="mt-2 p-2 bg-black bg-opacity-20 rounded text-xs"
                          whileHover={{ scale: 1.02 }}
                        >
                          <p>📍 Lat: {message.location.lat.toFixed(6)}</p>
                          <p>📍 Lng: {message.location.lng.toFixed(6)}</p>
                          {message.location.address && (
                            <p className="mt-1">{message.location.address}</p>
                          )}
                        </motion.div>
                      )}
                      
                      <p className="text-xs opacity-70 mt-2 flex items-center">
                        <Clock size={10} className="mr-1" />
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {/* Typing indicators */}
                {isTyping.length > 0 && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="bg-white bg-opacity-10 px-4 py-2 rounded-lg">
                      <p className="text-gray-300 text-sm">
                        {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
                      </p>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-white border-opacity-20">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    onKeyPress={handleKeyPress}
                    onBlur={handleStopTyping}
                    placeholder="Type an emergency message..."
                    className="flex-1 px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                  
                  <motion.button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    whileHover={{ scale: newMessage.trim() ? 1.1 : 1 }}
                    whileTap={{ scale: newMessage.trim() ? 0.9 : 1 }}
                  >
                    <Send size={18} />
                  </motion.button>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <p>Press Enter to send • Shift+Enter for new line</p>
                  <p>{contacts.filter(c => c.isOnline).length} participants online</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}