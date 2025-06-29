const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

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
    if (!fromUserId) return

    const alert = {
      ...alertData,
      fromUserId,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }

    // Send alert to specified contacts or all online users if no contacts specified
    if (alertData.contactIds && alertData.contactIds.length > 0) {
      let sentCount = 0
      let offlineCount = 0
      
      alertData.contactIds.forEach(contactUserId => {
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
    if (!fromUserId) return

    const message = {
      ...messageData,
      fromUserId,
      timestamp: new Date().toISOString()
    }

    // Send message to the recipient if they're online
    if (onlineUsers.has(messageData.toUserId)) {
      io.to(messageData.toUserId).emit('chat-message', message)
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
    if (!fromUserId) return

    const message = {
      ...messageData,
      fromUserId,
      timestamp: new Date().toISOString()
    }

    // Send message to all specified recipients who are online
    if (messageData.recipients && messageData.recipients.length > 0) {
      messageData.recipients.forEach(recipientId => {
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
  socket.on('user-status', ({ userId, status }) => {
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