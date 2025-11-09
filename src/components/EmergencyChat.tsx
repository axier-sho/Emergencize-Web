'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  MessageCircle,
  Users,
  AlertTriangle,
  Clock,
  MapPin,
  Mic,
  MicOff
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { saveAlert } from '@/lib/database'

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
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const contactsRef = useRef<Contact[]>(contacts)

  const { socket } = useSocket({
    userId: isOpen ? currentUserId : undefined, // Only create socket when modal is open
    onGroupMessage: handleReceiveMessage,
    onUserTyping: handleUserTyping,
    onUserStoppedTyping: handleUserStoppedTyping
  })

  useEffect(() => {
    contactsRef.current = contacts
  }, [contacts])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // System message when chat opens, cleanup when closed
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const baseMessage: Message = {
        id: `${Date.now()}-system`,
        fromUserId: 'system',
        fromUserName: 'System',
        content: 'Emergency group chat activated. All online contacts can see this conversation.',
        timestamp: new Date(),
        type: 'system'
      }

      const practiceMessage: Message | null =
        contacts.length === 0
          ? {
              id: `${Date.now()}-practice`,
              fromUserId: 'system',
              fromUserName: 'System',
              content:
                'Practice mode is enabled because no contacts are online yet. Send a message to see a simulated response and test the experience.',
              timestamp: new Date(),
              type: 'system'
            }
          : null

      setMessages(practiceMessage ? [baseMessage, practiceMessage] : [baseMessage])
    } else if (!isOpen) {
      // Clear messages when chat is closed to free memory
      setMessages([])
      setIsTyping([])
    }
  }, [isOpen, messages.length, contacts.length])

  // Voice input setup
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsVoiceSupported(false)
      return
    }

    setIsVoiceSupported(true)
    const recog = new SpeechRecognition()
    recog.lang = 'en-US'
    recog.interimResults = true
    recog.continuous = false
    recog.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript
      }
      setNewMessage((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()))
    }
    recog.onstart = () => setIsListening(true)
    recog.onend = () => setIsListening(false)
    recog.onerror = () => setIsListening(false)
    recognitionRef.current = recog
  }, [])

  const toggleVoice = () => {
    if (!isVoiceSupported) return
    if (isListening) {
      try {
        recognitionRef.current?.stop()
      } catch (error) {
        console.error('Failed to stop voice input', error)
      }
      return
    }
    try {
      recognitionRef.current?.start()
    } catch (e) {
      console.error('Voice input start failed', e)
    }
  }

  function handleReceiveMessage(message: Message) {
    setMessages(prev => {
      const newMessages = [...prev, message]
      // Keep only the last 100 messages to prevent memory buildup
      return newMessages.length > 100 ? newMessages.slice(-100) : newMessages
    })
  }

  function handleUserTyping(data: { userId: string; userName: string }) {
    if (data.userId !== currentUserId) {
      setIsTyping(prev => [...prev.filter(id => id !== data.userId), data.userId])
    }
  }

  function handleUserStoppedTyping(data: { userId: string }) {
    setIsTyping(prev => prev.filter(id => id !== data.userId))
  }

  const schedulePracticeEcho = useCallback((userText: string) => {
    const trimmed = userText.trim()
    if (!trimmed) return

    setTimeout(() => {
      if (contactsRef.current.length > 0) return
      const response: Message = {
        id: `${Date.now()}-practice-response`,
        fromUserId: 'practice-companion',
        fromUserName: 'Practice Companion',
        content: `Practice response: "${trimmed}". Add emergency contacts to chat with real people.`,
        timestamp: new Date(),
        type: 'text'
      }

      setMessages((prev) => {
        const newMessages = [...prev, response]
        return newMessages.length > 100 ? newMessages.slice(-100) : newMessages
      })
    }, 700)
  }, [])

  const sendMessage = () => {
    const trimmedContent = newMessage.trim()
    if (!trimmedContent) return

    const message: Message = {
      id: Date.now().toString(),
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      content: trimmedContent,
      timestamp: new Date(),
      type: 'text'
    }

    // Emit to group chat
    if (socket) {
      socket.emit('group-message', {
        ...message,
        recipients: contacts.map((c) => c.userId)
      })
    }

    setMessages(prev => {
      const newMessages = [...prev, message]
      return newMessages.length > 100 ? newMessages.slice(-100) : newMessages
    })
    setNewMessage('')
    
    // Stop typing indicator
    if (socket) {
      socket.emit('stop-typing-group', { userId: currentUserId })
    }

    if (contacts.length === 0) {
      schedulePracticeEcho(trimmedContent)
    }
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

        setMessages(prev => {
          const newMessages = [...prev, locationMessage]
          return newMessages.length > 100 ? newMessages.slice(-100) : newMessages
        })
      },
      (error) => {
        console.error('Error getting location:', error)
      }
    )
  }

  const sendEmergencyAlert = async () => {
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

    setMessages(prev => {
      const newMessages = [...prev, alertMessage]
      return newMessages.length > 100 ? newMessages.slice(-100) : newMessages
    })

    // Persist to Firestore for alert history
    try {
      await saveAlert({
        fromUserId: currentUserId,
        type: 'danger',
        message: alertMessage.content
      })
    } catch (e) {
      console.error('Failed to save emergency alert:', e)
    }
  }

  // Global shortcut: Ctrl/Cmd + Shift + A to send alert (ignored while typing)
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as any).isContentEditable)
      if (typing) return
      const key = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'a') {
        e.preventDefault()
        sendEmergencyAlert()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

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
              className="glass-effect rounded-2xl w-full max-w-4xl h-[700px] flex flex-col overflow-hidden relative"
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
                    onClick={toggleVoice}
                    disabled={!isVoiceSupported}
                    className={`p-3 ${
                      isListening
                        ? 'bg-green-600 hover:bg-green-700'
                        : isVoiceSupported
                          ? 'bg-gray-600 hover:bg-gray-700'
                          : 'bg-gray-700 cursor-not-allowed'
                    } text-white rounded-lg transition-colors`}
                    whileHover={{ scale: isVoiceSupported ? 1.08 : 1 }}
                    whileTap={{ scale: isVoiceSupported ? 0.95 : 1 }}
                    title={
                      isVoiceSupported
                        ? isListening
                          ? 'Stop voice input'
                          : 'Start voice input'
                        : 'Voice input is not supported in this browser'
                    }
                    aria-disabled={!isVoiceSupported}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </motion.button>
                  
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
                {!isVoiceSupported && (
                  <p className="mt-2 text-xs text-gray-400">
                    Voice input isn&apos;t supported in this browser. Try Chrome or Edge to dictate messages hands-free.
                  </p>
                )}
              </div>

              {/* Floating Emergency FAB */}
              <div className="absolute bottom-24 right-4 md:right-6">
                <motion.button
                  onClick={sendEmergencyAlert}
                  className="w-14 h-14 md:w-16 md:h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Send Emergency Alert (Ctrl/Cmd + Shift + A)"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Send Emergency Alert"
                >
                  <AlertTriangle size={24} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}