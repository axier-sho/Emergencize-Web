'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Phone, 
  PhoneOff, 
  X, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Clock
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface Message {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  timestamp: Date
  type: 'text' | 'voice_call_start' | 'voice_call_end'
}

interface Contact {
  id: string
  userId: string
  name: string
  isOnline: boolean
}

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact
  currentUserId: string
}

export default function ChatWindow({ isOpen, onClose, contact, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { socket } = useSocket({
    userId: currentUserId,
    onChatMessage: handleReceiveMessage,
    onVoiceCallOffer: handleVoiceCallOffer,
    onVoiceCallAnswer: handleVoiceCallAnswer,
    onVoiceCallEnd: handleVoiceCallEnd,
    onIceCandidate: handleIceCandidate
  })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize WebRTC configuration
  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    const peerConnection = new RTCPeerConnection(configuration)
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          to: contact.userId,
          candidate: event.candidate
        })
      }
    }

    peerConnection.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0]
      }
    }

    return peerConnection
  }

  function handleReceiveMessage(message: Message) {
    if (message.fromUserId === contact.userId || message.toUserId === contact.userId) {
      setMessages(prev => [...prev, message])
    }
  }

  function handleVoiceCallOffer(data: { from: string; offer: RTCSessionDescriptionInit }) {
    if (data.from === contact.userId) {
      // Handle incoming call
      setIsInCall(true)
      startCallTimer()
      
      const peerConnection = initializePeerConnection()
      peerConnectionRef.current = peerConnection
      
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => navigator.mediaDevices.getUserMedia({ audio: true }))
        .then((stream) => {
          localStreamRef.current = stream
          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream)
          })
          return peerConnection.createAnswer()
        })
        .then((answer) => {
          return peerConnection.setLocalDescription(answer)
        })
        .then(() => {
          if (socket) {
            socket.emit('voice-call-answer', {
              to: contact.userId,
              answer: peerConnection.localDescription
            })
          }
        })
        .catch(console.error)
    }
  }

  function handleVoiceCallAnswer(data: { from: string; answer: RTCSessionDescriptionInit }) {
    if (data.from === contact.userId && peerConnectionRef.current) {
      peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
    }
  }

  function handleVoiceCallEnd(data: { from: string }) {
    if (data.from === contact.userId) {
      endCall()
    }
  }

  function handleIceCandidate(data: { from: string; candidate: RTCIceCandidateInit }) {
    if (data.from === contact.userId && peerConnectionRef.current) {
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return

    const message: Message = {
      id: Date.now().toString(),
      fromUserId: currentUserId,
      toUserId: contact.userId,
      content: newMessage,
      timestamp: new Date(),
      type: 'text'
    }

    socket.emit('chat-message', message)
    setMessages(prev => [...prev, message])
    setNewMessage('')
  }

  const startCall = async () => {
    try {
      setIsInCall(true)
      startCallTimer()
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      
      const peerConnection = initializePeerConnection()
      peerConnectionRef.current = peerConnection
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })
      
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      
      if (socket) {
        socket.emit('voice-call-offer', {
          to: contact.userId,
          offer: peerConnection.localDescription
        })
      }

      // Add call start message
      const callMessage: Message = {
        id: Date.now().toString(),
        fromUserId: currentUserId,
        toUserId: contact.userId,
        content: 'Voice call started',
        timestamp: new Date(),
        type: 'voice_call_start'
      }
      setMessages(prev => [...prev, callMessage])
      
    } catch (error) {
      console.error('Error starting call:', error)
      setIsInCall(false)
    }
  }

  const endCall = () => {
    setIsInCall(false)
    stopCallTimer()
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    
    if (socket) {
      socket.emit('voice-call-end', { to: contact.userId })
    }

    // Add call end message
    const callMessage: Message = {
      id: Date.now().toString(),
      fromUserId: currentUserId,
      toUserId: contact.userId,
      content: `Voice call ended (${formatDuration(callDuration)})`,
      timestamp: new Date(),
      type: 'voice_call_end'
    }
    setMessages(prev => [...prev, callMessage])
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMuted
        setIsMuted(!isMuted)
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerOn ? 0 : 1
    }
  }

  const startCallTimer = () => {
    setCallDuration(0)
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
              className="glass-effect rounded-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-white border-opacity-20">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                      contact.isOnline ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{contact.name}</h3>
                    <p className="text-gray-300 text-sm">
                      {contact.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Voice Call Button */}
                  <motion.button
                    onClick={isInCall ? endCall : startCall}
                    disabled={!contact.isOnline}
                    className={`p-2 rounded-lg transition-colors ${
                      isInCall 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : contact.isOnline 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-gray-600 cursor-not-allowed'
                    } text-white`}
                    whileHover={{ scale: contact.isOnline ? 1.1 : 1 }}
                    whileTap={{ scale: contact.isOnline ? 0.9 : 1 }}
                  >
                    {isInCall ? <PhoneOff size={18} /> : <Phone size={18} />}
                  </motion.button>
                  
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Call Controls (when in call) */}
              {isInCall && (
                <motion.div
                  className="bg-green-600 bg-opacity-20 p-3 border-b border-white border-opacity-20"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-green-200">
                      <Phone size={16} />
                      <span className="text-sm">Call in progress</span>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span className="text-xs">{formatDuration(callDuration)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={toggleMute}
                        className={`p-2 rounded-lg transition-colors ${
                          isMuted ? 'bg-red-600' : 'bg-white bg-opacity-20'
                        } text-white`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                      </motion.button>
                      
                      <motion.button
                        onClick={toggleSpeaker}
                        className={`p-2 rounded-lg transition-colors ${
                          !isSpeakerOn ? 'bg-red-600' : 'bg-white bg-opacity-20'
                        } text-white`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isSpeakerOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle size={48} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-300">No messages yet</p>
                    <p className="text-gray-400 text-sm">Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      className={`flex ${message.fromUserId === currentUserId ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === 'text' 
                          ? message.fromUserId === currentUserId
                            ? 'bg-blue-600 text-white'
                            : 'bg-white bg-opacity-10 text-gray-100'
                          : 'bg-gray-600 bg-opacity-50 text-gray-300 text-center'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white border-opacity-20">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                    disabled={!contact.isOnline}
                  />
                  <motion.button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !contact.isOnline}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    whileHover={{ scale: newMessage.trim() && contact.isOnline ? 1.1 : 1 }}
                    whileTap={{ scale: newMessage.trim() && contact.isOnline ? 0.9 : 1 }}
                  >
                    <Send size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hidden Audio Elements */}
          <audio ref={localAudioRef} muted />
          <audio ref={remoteAudioRef} autoPlay />
        </>
      )}
    </AnimatePresence>
  )
}