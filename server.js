const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const resolveLogger = () => {
  const defaultLogger = {
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    debug: (message, ...args) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[DEBUG] ${message}`, ...args)
      }
    }
  }

  const loggerPath = path.join(__dirname, 'server', 'logger.js')

  try {
    if (fs.existsSync(loggerPath)) {
      const loadedModule = require('./server/logger')
      if (loadedModule?.logger) {
        return loadedModule.logger
      }
      return loadedModule
    }

    console.warn(`[server] Logger module missing at ${loggerPath}; falling back to console logger`)
  } catch (error) {
    console.warn(
      `[server] Failed to load logger module; falling back to console logger: ${error?.message ?? 'Unknown error'}`
    )
  }

  return defaultLogger
}

const logger = resolveLogger()

const validateFirebaseAdminEnv = () => {
  const requiredEnvVars = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ]

  const missingVars = requiredEnvVars.filter((key) => {
    const value = process.env[key]
    if (value === undefined || value === null) return true
    const trimmed = String(value).trim()
    return trimmed.length === 0 || trimmed === 'undefined' || trimmed === 'null'
  })

  if (missingVars.length > 0) {
    logger.error(
      `FATAL: Missing required Firebase Admin environment variables: ${missingVars.join(', ')}`
    )
    process.exit(1)
  }

  const privateKey = String(process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '')
  if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
    logger.warn(
      'Firebase Admin private key is present but does not include the expected header; verify formatting (ensure escaped newlines are provided)'
    )
  }
}

validateFirebaseAdminEnv()

const {
  admin,
  initializeFirebaseAdmin,
  isFirebaseAdminInitialized
} = require('./src/lib/firebaseAdminConfig')

const LOCATION_PRECISION = Math.min(
  Math.max(Number(process.env.LOCATION_PRECISION ?? 4), 0),
  6
)
const LOCATION_SCALE = 10 ** LOCATION_PRECISION
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '1mb'
const RATE_LIMIT_RETENTION_MS =
  Number(process.env.RATE_LIMIT_RETENTION_MS) || 10 * 60 * 1000
const RATE_LIMIT_SWEEP_INTERVAL_MS =
  Number(process.env.RATE_LIMIT_SWEEP_INTERVAL_MS) || 5 * 60 * 1000
const DEFAULT_ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
const DEFAULT_ALLOWED_HEADERS = ['Content-Type', 'Authorization']

const RATE_LIMIT_CONFIG = {
  emergencyAlert: { windowMinutes: 1, maxRequests: 5 },
  chatMessage: { windowMinutes: 1, maxRequests: 60 },
  groupMessage: { windowMinutes: 1, maxRequests: 30 },
  userStatus: { windowMinutes: 1, maxRequests: 30 }
}

const formatRateLimitMessage = (config, unitLabel) => {
  const windowLabel = config.windowMinutes === 1 ? 'minute' : 'minutes'
  return `Rate limit exceeded. Maximum ${config.maxRequests} ${unitLabel} per ${config.windowMinutes} ${windowLabel}.`
}

let adminInitialized = false
try {
  initializeFirebaseAdmin()
  adminInitialized = isFirebaseAdminInitialized()
} catch (error) {
  logger.error('FATAL: Failed to initialize Firebase Admin:', error)
  process.exit(1)
}

if (!adminInitialized) {
  logger.error('FATAL: Firebase Admin SDK is required but failed to initialize')
  process.exit(1)
}

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
      /<[a-z][\s\S]*>/gi
    ]
    
    let sanitized = str.trim().replace(/\s+/g, ' ')
    const foundDangerous = dangerousPatterns.some(pattern => pattern.test(sanitized))
    
    if (foundDangerous) {
      return {
        isValid: false,
        sanitizedValue: '',
        errors: ['Message contains potentially dangerous content']
      }
    }
    
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }
    
    return {
      isValid: true,
      sanitizedValue: sanitized,
      errors: []
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
        lat: Math.round(data.location.lat * LOCATION_SCALE) / LOCATION_SCALE,
        lng: Math.round(data.location.lng * LOCATION_SCALE) / LOCATION_SCALE
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

setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of rateLimits.entries()) {
    const recent = timestamps.filter(
      (timestamp) => now - timestamp <= RATE_LIMIT_RETENTION_MS
    )
    if (recent.length === 0) {
      rateLimits.delete(key)
    } else {
      rateLimits.set(key, recent)
    }
  }
}).unref?.()

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
  
  logger.info('SECURITY AUDIT:', logEntry)
  
  // In production, you'd want to log to a file or database
  // Consider implementing log rotation and monitoring
}

const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)

const app = express()
const server = http.createServer(app)
const developmentOrigins = parseOrigins(
  process.env.SOCKET_CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001'
)
const productionOrigins = parseOrigins(process.env.PRODUCTION_ORIGIN).slice(0)
const io = socketIo(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? productionOrigins.length > 0
          ? productionOrigins
          : ['https://yourdomain.com']
        : developmentOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? productionOrigins.length > 0
      ? productionOrigins
      : ['https://yourdomain.com']
    : developmentOrigins

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: DEFAULT_ALLOWED_METHODS,
    allowedHeaders: DEFAULT_ALLOWED_HEADERS
  })
)
app.use(express.json({ limit: REQUEST_BODY_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }))

// Store online users
const onlineUsers = new Map()
const userSockets = new Map()

// Authenticate socket connections using Firebase ID token in handshake
io.use(async (socket, next) => {
  try {
    const headerAuth = socket.handshake.headers['authorization']
    const tokenFromHeader = headerAuth && headerAuth.startsWith('Bearer ') ? headerAuth.slice(7) : null
    const token = socket.handshake.auth?.token || tokenFromHeader
    if (!token) {
      return next(new Error('Authentication required'))
    }
    const decoded = await admin.auth().verifyIdToken(token)
    socket.data.userId = decoded.uid
    return next()
  } catch (err) {
    return next(new Error('Invalid authentication token'))
  }
})

io.on('connection', (socket) => {
  logger.info('User connected: %s', socket.id)
  const authedUserId = socket.data.userId
  if (!authedUserId) {
    logger.warn('Socket connected without authenticated user, disconnecting: %s', socket.id)
    socket.disconnect(true)
    return
  }

  // Register user as online immediately on connection
  onlineUsers.set(authedUserId, {
    socketId: socket.id,
    joinedAt: new Date(),
    isOnline: true
  })
  userSockets.set(socket.id, authedUserId)
  socket.join(authedUserId)
  socket.broadcast.emit('user-online', authedUserId)
  socket.emit('online-users', Array.from(onlineUsers.keys()))

  // User joins with their ID
  socket.on('user-join', (userId) => {
    // Backward compatibility: ignore provided userId and rely on authenticated uid
    logger.debug('User join event received (ignored userId param), authed uid: %s', authedUserId)
  })

  // Handle emergency alerts
  socket.on('emergency-alert', (alertData) => {
    logger.info('Emergency alert received:', alertData)
    
    const fromUserId = socket.data.userId || userSockets.get(socket.id)
    if (!fromUserId) {
      socket.emit('error', { message: 'User not authenticated' })
      return
    }

    // Rate limiting check
    if (
      isRateLimited(
        fromUserId,
        'emergency-alert',
        RATE_LIMIT_CONFIG.emergencyAlert.windowMinutes,
        RATE_LIMIT_CONFIG.emergencyAlert.maxRequests
      )
    ) {
      socket.emit('error', {
        message: formatRateLimitMessage(RATE_LIMIT_CONFIG.emergencyAlert, 'alerts')
      })
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
      
      logger.info(
        'Alert sent to %d online contacts, %d offline contacts will be notified when they come online',
        sentCount,
        offlineCount
      )
    } else {
      // Fallback: Send to all online users except the sender
      onlineUsers.forEach((userInfo, userId) => {
        if (userId !== fromUserId) {
          io.to(userId).emit('emergency-alert', alert)
        }
      })
      logger.info('Alert sent to %d users', Math.max(onlineUsers.size - 1, 0))
    }
  })

  // Handle chat messages
  socket.on('chat-message', (messageData) => {
    logger.info('Chat message received:', messageData)
    
    const fromUserId = socket.data.userId || userSockets.get(socket.id)
    if (!fromUserId) {
      socket.emit('error', { message: 'User not authenticated' })
      return
    }

    // Rate limiting check
    if (
      isRateLimited(
        fromUserId,
        'chat-message',
        RATE_LIMIT_CONFIG.chatMessage.windowMinutes,
        RATE_LIMIT_CONFIG.chatMessage.maxRequests
      )
    ) {
      socket.emit('error', {
        message: formatRateLimitMessage(RATE_LIMIT_CONFIG.chatMessage, 'messages')
      })
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

    logger.info('Chat message sent to: %s', messageData.toUserId)
  })

  // Handle voice call signaling
  socket.on('voice-call-offer', (data) => {
    logger.info('Voice call offer:', data)
    if (onlineUsers.has(data.to)) {
      io.to(data.to).emit('voice-call-offer', {
        from: socket.data.userId || userSockets.get(socket.id),
        offer: data.offer
      })
    }
  })

  socket.on('voice-call-answer', (data) => {
    logger.info('Voice call answer:', data)
    if (onlineUsers.has(data.to)) {
      io.to(data.to).emit('voice-call-answer', {
        from: socket.data.userId || userSockets.get(socket.id),
        answer: data.answer
      })
    }
  })

  socket.on('voice-call-end', (data) => {
    logger.info('Voice call end:', data)
    if (onlineUsers.has(data.to)) {
      io.to(data.to).emit('voice-call-end', {
        from: socket.data.userId || userSockets.get(socket.id)
      })
    }
  })

  socket.on('ice-candidate', (data) => {
    if (onlineUsers.has(data.to)) {
      io.to(data.to).emit('ice-candidate', {
        from: socket.data.userId || userSockets.get(socket.id),
        candidate: data.candidate
      })
    }
  })

  // Handle group chat messages
  socket.on('group-message', (messageData) => {
    logger.info('Group message received:', messageData)
    
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) {
      socket.emit('error', { message: 'User not authenticated' })
      return
    }

    // Rate limiting check
    if (
      isRateLimited(
        fromUserId,
        'group-message',
        RATE_LIMIT_CONFIG.groupMessage.windowMinutes,
        RATE_LIMIT_CONFIG.groupMessage.maxRequests
      )
    ) {
      socket.emit('error', {
        message: formatRateLimitMessage(RATE_LIMIT_CONFIG.groupMessage, 'group messages')
      })
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

    logger.info('Group message sent to recipients')
  })

  // Handle group typing indicators
  socket.on('typing-group', (data) => {
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) return

    // Broadcast typing indicator only to intended recipients when provided
    if (Array.isArray(data?.recipients) && data.recipients.length > 0) {
      data.recipients.forEach((recipientId) => {
        if (onlineUsers.has(recipientId) && recipientId !== fromUserId) {
          io.to(recipientId).emit('user-typing-group', {
            userId: fromUserId,
            userName: data.userName,
          })
        }
      })
    } else {
      // fallback to broadcast
      socket.broadcast.emit('user-typing-group', {
        userId: fromUserId,
        userName: data.userName,
      })
    }
  })

  socket.on('stop-typing-group', (data) => {
    const fromUserId = userSockets.get(socket.id)
    if (!fromUserId) return

    if (Array.isArray(data?.recipients) && data.recipients.length > 0) {
      data.recipients.forEach((recipientId) => {
        if (onlineUsers.has(recipientId) && recipientId !== fromUserId) {
          io.to(recipientId).emit('user-stopped-typing-group', {
            userId: fromUserId,
          })
        }
      })
    } else {
      socket.broadcast.emit('user-stopped-typing-group', {
        userId: fromUserId,
      })
    }
  })

  // Handle user status updates
  socket.on('user-status', (statusData) => {
    const fromUserId = socket.data.userId || userSockets.get(socket.id)
    if (!fromUserId) {
      socket.emit('error', { message: 'User not authenticated' })
      return
    }

    // Rate limiting check
    if (
      isRateLimited(
        fromUserId,
        'user-status',
        RATE_LIMIT_CONFIG.userStatus.windowMinutes,
        RATE_LIMIT_CONFIG.userStatus.maxRequests
      )
    ) {
      socket.emit('error', {
        message: formatRateLimitMessage(RATE_LIMIT_CONFIG.userStatus, 'status updates')
      })
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

    const { status } = validation.sanitizedData
    const userId = fromUserId
    
    // Ensure user can only update their own status
    // (userId is forced to authed user above)

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
  socket.on('user-disconnect', () => {
    handleUserDisconnect(socket, socket.data.userId)
  })

  // Handle socket disconnect
  socket.on('disconnect', () => {
    const userId = socket.data.userId || userSockets.get(socket.id)
    handleUserDisconnect(socket, userId)
  })

  function handleUserDisconnect(socket, userId) {
    if (userId) {
      logger.info('User disconnected: %s', userId)
      
      // Remove user from online users
      onlineUsers.delete(userId)
      userSockets.delete(socket.id)
      
      // Broadcast to all users that this user is offline
      socket.broadcast.emit('user-offline', userId)
      
      logger.debug('Remaining online users:', Array.from(onlineUsers.keys()))
    }
  }
})

// Health check endpoint
app.get('/health', async (req, res) => {
  let firebaseStatus = 'ok'
  try {
    await admin.auth().listUsers(1)
  } catch (error) {
    firebaseStatus = `error: ${(error && error.message) || 'Unknown error'}`
  }

  res.json({
    status: firebaseStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    onlineUsers: onlineUsers.size,
    firebase: firebaseStatus
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
  logger.info(`Emergency Alert Server running on port ${PORT}`)
  logger.info('Socket.io server ready for connections')
})