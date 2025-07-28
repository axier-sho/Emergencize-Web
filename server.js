const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

// Basic validation utilities for Node.js (simplified version)
const validateSocketMessage = (messageType, data) => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'], sanitizedData: {} }
  }

  const sanitizeString = (str, maxLength = 1000) => {
    if (typeof str !== 'string') return { isValid: false, sanitizedValue: '', errors: ['Must be a string'] }
    
    // Basic XSS pattern detection
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /[<>'"\`]/g
    ]
    
    let sanitized = str.trim().replace(/\s+/g, ' ')
    const foundDangerous = dangerousPatterns.some(pattern => pattern.test(sanitized))
    
    if (foundDangerous) {
      dangerousPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '')
      })
    }
    
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }
    
    return {
      isValid: !foundDangerous,
      sanitizedValue: sanitized,
      errors: foundDangerous ? ['Dangerous content detected and removed'] : []
    }
  }

  const validateCoordinates = (lat, lng) => {
    return typeof lat === 'number' && typeof lng === 'number' &&
           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  }

  const schemas = {
    'emergency-alert': {
      type: { required: true, allowedValues: ['help', 'danger'] },
      message: { required: true, maxLength: 500 },
      contactIds: { required: false, type: 'array' }
    },
    'chat-message': {
      message: { required: true, maxLength: 1000 },
      toUserId: { required: true, maxLength: 128 }
    },
    'group-message': {
      message: { required: true, maxLength: 1000 },
      recipients: { required: true, type: 'array' }
    },
    'user-status': {
      userId: { required: true, maxLength: 128 },
      status: { required: true, allowedValues: ['online', 'offline'] }
    }
  }

  const schema = schemas[messageType]
  if (!schema) {
    return { isValid: false, errors: ['Unknown message type'], sanitizedData: {} }
  }

  const errors = []
  const sanitizedData = {}

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]

    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`)
      continue
    }

    if (value === undefined || value === null) continue

    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
      errors.push(`${field} must be one of: ${rules.allowedValues.join(', ')}`)
      continue
    }

    if (typeof value === 'string') {
      const result = sanitizeString(value, rules.maxLength)
      if (!result.isValid) {
        errors.push(`${field}: ${result.errors.join(', ')}`)
      }
      sanitizedData[field] = result.sanitizedValue
    } else if (rules.type === 'array' && Array.isArray(value)) {
      sanitizedData[field] = value.filter(item => typeof item === 'string').slice(0, 50) // Limit array size
    } else {
      sanitizedData[field] = value
    }
  }

  // Special validation for location data
  if (data.location && typeof data.location === 'object') {
    if (!validateCoordinates(data.location.lat, data.location.lng)) {
      errors.push('Invalid location coordinates')
    } else {
      sanitizedData.location = {
        lat: Math.round(data.location.lat * 1000000) / 1000000,
        lng: Math.round(data.location.lng * 1000000) / 1000000
      }
      if (data.location.address) {
        const addressResult = sanitizeString(data.location.address, 200)
        sanitizedData.location.address = addressResult.sanitizedValue
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  }
}

// Rate limiting storage
const rateLimits = new Map()

// Rate limiting function
const isRateLimited = (userId, action, intervalMinutes = 1, maxRequests = 10) => {
  const key = `${userId}_${action}`
  const now = Date.now()
  const windowStart = now - (intervalMinutes * 60 * 1000)
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, [])
  }
  
  const requests = rateLimits.get(key)
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart)
  rateLimits.set(key, recentRequests)
  
  // Check if limit exceeded
  if (recentRequests.length >= maxRequests) {
    return true
  }
  
  // Add current request
  recentRequests.push(now)
  return false
}

// Security audit logging
const auditLog = (userId, action, data, result) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    valid: result.isValid,
    errors: result.errors,
    ip: data.ip || 'unknown'
  }
  
  console.log('SECURITY AUDIT:', logEntry)
  
  // In production, you'd want to log to a file or database
  // Consider implementing log rotation and monitoring
}

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
})

app.use(cors())
app.use(express.json())

// Store online users
const onlineUsers = new Map()
const userSockets = new Map()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // User joins with their ID
  socket.on('user-join', (userId) => {
    console.log('User joined:', userId)
    
    // Store user info
    onlineUsers.set(userId, {
      socketId: socket.id,
      joinedAt: new Date(),
      isOnline: true
    })
    userSockets.set(socket.id, userId)
    
    // Join user to their personal room
    socket.join(userId)
    
    // Broadcast to all users that this user is online
    socket.broadcast.emit('user-online', userId)
    
    // Send current online users to the newly joined user
    const currentOnlineUsers = Array.from(onlineUsers.keys())
    socket.emit('online-users', currentOnlineUsers)
    
    console.log('Online users:', currentOnlineUsers)
  })

  // Handle emergency alerts
  socket.on('emergency-alert', (alertData) => {
    console.log('Emergency alert received:', alertData)
    
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) {
      socket.emit('error', { message: 'User not authenticated' })
      return
    }

    // Rate limiting check
    if (isRateLimited(fromUserId, 'emergency-alert', 1, 5)) {
      socket.emit('error', { message: 'Rate limit exceeded. Maximum 5 alerts per minute.' })
      auditLog(fromUserId, 'emergency-alert', { ip: socket.handshake.address }, { isValid: false, errors: ['Rate limit exceeded'] })
      return
    }

    // Validate and sanitize the alert data
    const validation = validateSocketMessage('emergency-alert', alertData)
    auditLog(fromUserId, 'emergency-alert', { ip: socket.handshake.address }, validation)
    
    if (!validation.isValid) {
      socket.emit('error', { message: 'Invalid alert data', errors: validation.errors })
      return
    }

    const alert = {
      ...validation.sanitizedData,
      fromUserId,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }

    // Send alert to specified contacts or all online users if no contacts specified
    if (validation.sanitizedData.contactIds && validation.sanitizedData.contactIds.length > 0) {
      let sentCount = 0
      let offlineCount = 0
      
      validation.sanitizedData.contactIds.forEach(contactUserId => {
        if (contactUserId !== fromUserId) {
          if (onlineUsers.has(contactUserId)) {
            // Send to online users immediately
            io.to(contactUserId).emit('emergency-alert', alert)
            sentCount++
          } else {
            // For offline users, we'll store in database (handled by client)
            offlineCount++
          }
        }
      })
      
      console.log(`Alert sent to ${sentCount} online contacts, ${offlineCount} offline contacts will be notified when they come online`)
    } else {
      // Fallback: Send to all online users except the sender
      onlineUsers.forEach((userInfo, userId) => {
        if (userId !== fromUserId) {
          io.to(userId).emit('emergency-alert', alert)
        }
      })
      console.log('Alert sent to', onlineUsers.size - 1, 'users')
    }
  })

  // Handle chat messages
  socket.on('chat-message', (messageData) => {
    console.log('Chat message received:', messageData)
    
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) {
      socket.emit('error', { message: 'User not authenticated' })
      return
    }

    // Rate limiting check
    if (isRateLimited(fromUserId, 'chat-message', 1, 60)) {
      socket.emit('error', { message: 'Rate limit exceeded. Maximum 60 messages per minute.' })
      auditLog(fromUserId, 'chat-message', { ip: socket.handshake.address }, { isValid: false, errors: ['Rate limit exceeded'] })
      return
    }

    // Validate and sanitize the message data
    const validation = validateSocketMessage('chat-message', messageData)
    auditLog(fromUserId, 'chat-message', { ip: socket.handshake.address }, validation)
    
    if (!validation.isValid) {
      socket.emit('error', { message: 'Invalid message data', errors: validation.errors })
      return
    }

    const message = {
      ...validation.sanitizedData,
      fromUserId,
      timestamp: new Date().toISOString()
    }

    // Send message to the recipient if they're online
    if (onlineUsers.has(validation.sanitizedData.toUserId)) {
      io.to(validation.sanitizedData.toUserId).emit('chat-message', message)
    }

    console.log('Chat message sent to:', messageData.toUserId)
  })

  // Handle voice call signaling
  socket.on('voice-call-offer', (data) => {
    console.log('Voice call offer:', data)
    if (onlineUsers.has(data.to)) {
      io.to(data.to).emit('voice-call-offer', {
        from: userSockets.get(socket.id),
        offer: data.offer
      })
    }
  })

  socket.on('voice-call-answer', (data) => {
    console.log('Voice call answer:', data)
    if (onlineUsers.has(data.to)) {
      io.to(data.to).emit('voice-call-answer', {
        from: userSockets.get(socket.id),
        answer: data.answer
      })
    }
  })

  socket.on('voice-call-end', (data) => {
    console.log('Voice call end:', data)
    if (onlineUsers.has(data.to)) {
      io.to(data.to).emit('voice-call-end', {
        from: userSockets.get(socket.id)
      })
    }
  })

  socket.on('ice-candidate', (data) => {
    if (onlineUsers.has(data.to)) {
      io.to(data.to).emit('ice-candidate', {
        from: userSockets.get(socket.id),
        candidate: data.candidate
      })
    }
  })

  // Handle group chat messages
  socket.on('group-message', (messageData) => {
    console.log('Group message received:', messageData)
    
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) {
      socket.emit('error', { message: 'User not authenticated' })
      return
    }

    // Rate limiting check
    if (isRateLimited(fromUserId, 'group-message', 1, 30)) {
      socket.emit('error', { message: 'Rate limit exceeded. Maximum 30 group messages per minute.' })
      auditLog(fromUserId, 'group-message', { ip: socket.handshake.address }, { isValid: false, errors: ['Rate limit exceeded'] })
      return
    }

    // Validate and sanitize the message data
    const validation = validateSocketMessage('group-message', messageData)
    auditLog(fromUserId, 'group-message', { ip: socket.handshake.address }, validation)
    
    if (!validation.isValid) {
      socket.emit('error', { message: 'Invalid group message data', errors: validation.errors })
      return
    }

    const message = {
      ...validation.sanitizedData,
      fromUserId,
      timestamp: new Date().toISOString()
    }

    // Send message to all specified recipients who are online
    if (validation.sanitizedData.recipients && validation.sanitizedData.recipients.length > 0) {
      validation.sanitizedData.recipients.forEach(recipientId => {
        if (onlineUsers.has(recipientId) && recipientId !== fromUserId) {
          io.to(recipientId).emit('group-message', message)
        }
      })
    }

    console.log('Group message sent to recipients')
  })

  // Handle group typing indicators
  socket.on('typing-group', (data) => {
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) return

    // Broadcast typing indicator to all other users
    socket.broadcast.emit('user-typing-group', {
      userId: fromUserId,
      userName: data.userName
    })
  })

  socket.on('stop-typing-group', (data) => {
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) return

    // Broadcast stop typing indicator to all other users
    socket.broadcast.emit('user-stopped-typing-group', {
      userId: fromUserId
    })
  })

  // Handle user status updates
  socket.on('user-status', (statusData) => {
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) {
      socket.emit('error', { message: 'User not authenticated' })
      return
    }

    // Rate limiting check
    if (isRateLimited(fromUserId, 'user-status', 1, 30)) {
      socket.emit('error', { message: 'Rate limit exceeded. Maximum 30 status updates per minute.' })
      auditLog(fromUserId, 'user-status', { ip: socket.handshake.address }, { isValid: false, errors: ['Rate limit exceeded'] })
      return
    }

    // Validate and sanitize the status data
    const validation = validateSocketMessage('user-status', statusData)
    auditLog(fromUserId, 'user-status', { ip: socket.handshake.address }, validation)
    
    if (!validation.isValid) {
      socket.emit('error', { message: 'Invalid status data', errors: validation.errors })
      return
    }

    const { userId, status } = validation.sanitizedData
    
    // Ensure user can only update their own status
    if (userId !== fromUserId) {
      socket.emit('error', { message: 'Cannot update another user\'s status' })
      auditLog(fromUserId, 'user-status', { ip: socket.handshake.address }, { isValid: false, errors: ['Unauthorized status update'] })
      return
    }

    if (onlineUsers.has(userId)) {
      onlineUsers.set(userId, {
        ...onlineUsers.get(userId),
        isOnline: status === 'online',
        lastSeen: new Date()
      })

      if (status === 'online') {
        socket.broadcast.emit('user-online', userId)
      } else {
        socket.broadcast.emit('user-offline', userId)
      }
    }
  })

  // Handle user disconnect
  socket.on('user-disconnect', (userId) => {
    handleUserDisconnect(socket, userId)
  })

  // Handle socket disconnect
  socket.on('disconnect', () => {
    const userId = userSockets.get(socket.id)
    handleUserDisconnect(socket, userId)
  })

  function handleUserDisconnect(socket, userId) {
    if (userId) {
      console.log('User disconnected:', userId)
      
      // Remove user from online users
      onlineUsers.delete(userId)
      userSockets.delete(socket.id)
      
      // Broadcast to all users that this user is offline
      socket.broadcast.emit('user-offline', userId)
      
      console.log('Remaining online users:', Array.from(onlineUsers.keys()))
    }
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    onlineUsers: onlineUsers.size
  })
})

// Get online users endpoint
app.get('/api/online-users', (req, res) => {
  const users = Array.from(onlineUsers.entries()).map(([userId, info]) => ({
    userId,
    isOnline: info.isOnline,
    joinedAt: info.joinedAt,
    lastSeen: info.lastSeen
  }))
  
  res.json({ users, count: users.length })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Emergency Alert Server running on port ${PORT}`)
  console.log(`Socket.io server ready for connections`)
})