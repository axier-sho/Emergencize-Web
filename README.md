# Emergencize - Secure Real-Time Emergency Alert System

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101) ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

A sophisticated, real-time emergency alert system built with Next.js, Socket.io, and Firebase. Features enterprise-grade security, comprehensive monitoring, accessibility compliance, and intelligent emergency response capabilities.

**🚨 What does it do?** Send instant emergency alerts to your emergency contacts with your GPS location. Works like a panic button that notifies your trusted contacts immediately when you need help.

**⚡ Key Features:**
- **HELP & DANGER buttons** - Two alert types for different emergency levels
- **Real-time notifications** - Instant alerts via Socket.io when contacts are online  
- **GPS location sharing** - Automatic location inclusion in emergency alerts
- **Offline support** - Alerts queue and send when connection restored
- **Contact management** - Add emergency contacts via email invitation
- **Emergency chat** - Group messaging during emergencies
- **3 Connection modes** - Works with full features, basic features, or offline

## Features

### Emergency Alert System
- **Dual Alert Types** with intelligent targeting:
  - **HELP Button** - Non-critical assistance requests (instant press, online contacts only)
  - **DANGER Button** - Critical emergencies (3-second hold protection, all contacts including offline)
- **Real-time Delivery** - Instant notifications via Socket.io to emergency contacts
- **Location Integration** - GPS coordinates automatically included when permission granted
- **Smart Contact Targeting** - Context-aware delivery based on alert severity
- **Emergency Chat** - Direct messaging and group communication during emergencies
- **Voice Call Signaling** - WebRTC integration for emergency voice communication

### Contact Management & Presence
- **Friend Request System** - Secure contact addition via email invitation
- **Real-time Online Status** - Live presence tracking of emergency contacts
- **Contact Customization** - Nicknames and relationship categorization
- **Connection Status Indicators** - Visual feedback for system connectivity
- **Contact Response Tracking** - Monitor alert acknowledgments and responses

### Geofencing & Location Services
- **Safe Zone Management** - Create and monitor custom geographic boundaries
- **Zone Types** - Home, work, school, hospital, and custom locations
- **Enter/Exit Notifications** - Automated alerts for safe zone transitions
- **High-Accuracy GPS** - Precise location tracking during emergency situations
- **Location Privacy Controls** - User-controlled location sharing preferences

### Security Architecture
- **Multi-Layer Input Sanitization** - XSS, SQL injection, and command injection protection
- **Advanced Rate Limiting** - Operation-specific limits to prevent abuse
- **Real-time Security Monitoring** - Comprehensive audit logging and threat detection
- **Risk Scoring System** - Automated risk assessment for user actions
- **Session Security** - Secure authentication with automatic token refresh
- **Firebase Security Rules** - Database-level access control and validation

### User Experience & Accessibility
- **WCAG 2.1 AA Compliance** - Full accessibility support with screen reader compatibility
- **Keyboard Navigation** - Complete keyboard-only operation for alerts and navigation
- **Visual Animations** - Smooth Framer Motion animations with motion reduction options
- **Glass Morphism Design** - Modern translucent UI with gradient backgrounds
- **Progressive Web App** - App-like experience with offline capabilities
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Error Boundaries** - Graceful error handling with user-friendly recovery options

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd emergencize-web

# Install all dependencies
npm install
```

### 2. Set Up Firebase (Required)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** > Sign-in method > **Email/Password**
3. Enable **Firestore Database** in test mode
4. Enable **Realtime Database** in test mode
5. Copy your Firebase config and create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Optional: For push notifications (web-push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### 3. Run the Application

**Recommended (starts both servers):**
```bash
npm run dev:all
```

**Alternative (separate terminals):**
```bash
# Terminal 1 - Next.js frontend
npm run dev

# Terminal 2 - Socket.io server
npm run dev:server
```

### 4. Open and Test

1. Open [http://localhost:3000](http://localhost:3000)
2. Create an account with email/password
3. Open in multiple browser windows to test real-time features
4. The app works in three modes:
   - **Real-time Mode**: Both servers running (full features)
   - **Standard Mode**: Only frontend running (database alerts)
   - **Offline Mode**: No internet (queued alerts)

### 5. Deploy Firebase Security Rules (Important!)

For production or to prevent authentication errors:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (choose existing project)
firebase init

# Deploy security rules
firebase deploy --only firestore:rules,database
```

## Project Structure

```
/
  src/
    app/
      page.tsx                     # Landing page with authentication
      dashboard/page.tsx           # Main emergency dashboard
      about/page.tsx              # About page
      notifications/page.tsx      # Notification center
      how-to-use/page.tsx         # User guide
      layout.tsx                  # App layout and global providers
      globals.css                 # Global styles and animations
    components/
      accessibility/
        AccessibilityProvider.tsx  # WCAG compliance provider
        AccessibilitySettings.tsx  # Accessibility configuration
      error-handling/
        ErrorBoundary.tsx         # React error boundaries
        ErrorNotifications.tsx     # Error display system
        SocketErrorHandler.tsx     # Socket connection error handling
      geofencing/
        GeofenceManager.tsx       # Safe zone management UI
      onboarding/
        OnboardingFlow.tsx        # User onboarding process
        OnboardingProvider.tsx    # Onboarding state management
      EmergencyButton.tsx         # Emergency alert buttons
      AlertNotification.tsx       # Enhanced alert notifications
      OnlineUsers.tsx            # User presence display
      ContactManager.tsx         # Contact management interface
      DashboardStats.tsx         # Dashboard metrics display
      QuickActions.tsx           # Quick action buttons
      EmergencyChat.tsx          # Emergency chat system
      ChatWindow.tsx             # Individual chat interface
      SettingsModal.tsx          # User settings configuration
      LoadingAnimation.tsx       # Animated loading screen
      AuthModal.tsx              # Authentication modal
    hooks/
      useAuth.ts                 # Firebase authentication
      useSecureAuth.ts           # Enhanced auth with token refresh
      useSocket.ts               # Socket.io connection management
      useContacts.ts             # Contact management
      useFriendRequests.ts       # Friend request system
      useAccessibility.ts        # Accessibility preferences
      useErrorHandler.ts         # Error handling utilities
      usePushNotifications.ts    # Push notification management
    services/
      InputSanitizationService.ts # XSS protection & sanitization
      ValidationService.ts        # Schema-based data validation
      RateLimitService.ts         # Rate limiting & abuse prevention
      SecurityMonitoringService.ts # Audit logging & threat detection
      PushNotificationService.ts  # Background notifications
      GeofencingService.ts        # Safe zone management
      LocationService.ts          # GPS and location handling
      MedicalDataService.ts       # Medical information encryption
      PrivacyControlService.ts    # Privacy settings management
      LocalizationService.ts     # Multi-language support
    utils/
      securityUtils.ts           # Security utility functions
    lib/
      firebase.ts                # Firebase configuration
      database.ts                # Database operations and queries
  server.js                      # Enhanced Socket.io server with security
  firestore.rules                # Firestore security rules
  database.rules.json            # Realtime Database security rules
  package.json                   # Dependencies and scripts
  FIREBASE_SETUP.md              # Firebase configuration guide
```

## Design Features

### Animations
- **Loading Screen** - Elastic logo animation with gradient background
- **Emergency Buttons** - Hover effects, ripple animations, danger pulsing
- **Notifications** - Slide-in alerts with smooth transitions
- **Page Transitions** - Fade-in effects throughout the UI

### Visual Elements
- **Glass Morphism** - Translucent elements with backdrop blur
- **Gradient Backgrounds** - Modern purple-to-blue gradients
- **Round Buttons** - Circular emergency buttons with shadows
- **Status Indicators** - Animated online/offline dots

## Technical Implementation

### Real-Time Communication Architecture
- **Socket.io Server** - Node.js/Express server with comprehensive message validation
- **User Presence System** - Live tracking of online/offline status with automatic cleanup
- **Room-Based Messaging** - Secure, authenticated connections with user-specific rooms
- **Message Validation** - Server-side sanitization and validation of all socket messages
- **Automatic Reconnection** - Robust connection handling with graceful degradation
- **Rate Limiting** - Per-user, per-operation limits to prevent abuse and spam

### Emergency Alert Flow
1. **Button Interaction** - HELP (instant) or DANGER (3-second hold with progress indicator)
2. **Location Capture** - GPS coordinates obtained if user permission granted
3. **Contact Targeting** - Smart routing based on alert type and contact availability
4. **Dual Delivery** - Real-time Socket.io + persistent Firebase storage
5. **Visual Feedback** - Animated notifications with alert-specific styling and sounds
6. **Response Tracking** - Acknowledgment system with response time monitoring

### Security Implementation
- **Input Sanitization Service** - Comprehensive XSS, injection, and malicious payload detection
- **Validation Service** - Schema-based validation for all data structures
- **Security Monitoring Service** - Real-time audit logging with risk scoring
- **Rate Limit Service** - Configurable limits with automatic violation detection
- **Firebase Security Rules** - Multi-layered database protection with user-based access control

### Data Architecture
- **Firebase Firestore** - Primary database for persistent data with security rules
- **Firebase Realtime Database** - Live presence and real-time features
- **Local Storage** - Offline caching and security event storage
- **Session Management** - Secure token handling with automatic refresh

### Web Platform Features
- **Geolocation API** - High-accuracy GPS with fallback options
- **Web Audio API** - Dynamic alert sounds with different patterns for alert types
- **Vibration API** - Haptic feedback on supported mobile devices
- **Service Workers** - Background notifications and offline capabilities
- **Push Notifications** - Browser-based alerts when app is not active

## iPhone → Web Adaptations

| iPhone Feature      | Web Alternative                        |
|--------------------|----------------------------------------|
| Core Location      | Geolocation API                        |
| Push Notifications | Web Push API + Service Workers          |
| Haptic Feedback    | Vibration API + Visual feedback         |
| VoIP Calls         | WebRTC (future enhancement)             |
| Critical Alerts    | Browser notifications + screen flash    |
| Battery Monitoring | Removed (limited web support)           |
| Background Processing | Service workers (limited)            |

## Development

### Prerequisites
- Node.js 18+
- Firebase account
- Modern browser with WebSocket support

### Environment Variables
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Mobile Support

The app is fully responsive and includes mobile-specific features:
- Touch-friendly emergency buttons
- Vibration feedback on supported devices
- Responsive layout for all screen sizes
- PWA capabilities for app-like experience

## Security Architecture

### Comprehensive Multi-Layer Security System

#### Advanced Input Sanitization
- **XSS Protection**: Multi-pattern detection including script tags, iframes, javascript: URLs, and event handlers
- **SQL Injection Prevention**: Pattern detection and input validation for database queries
- **Command Injection Protection**: Detection and filtering of dangerous shell characters
- **Path Traversal Prevention**: Protection against directory traversal attacks
- **Schema-Based Validation**: Type-safe validation with configurable field rules and length limits
- **HTML Sanitization**: Safe HTML processing with allowed tag and attribute whitelisting

#### Authentication & Session Security
- **Firebase Authentication**: Enterprise-grade user authentication with automatic token refresh
- **Session Management**: Secure session handling with device fingerprinting and anomaly detection
- **Online Presence Tracking**: Real-time user status with automatic cleanup on disconnect
- **Rate-Limited Authentication**: Brute force protection with configurable attempt limits
- **Security Event Logging**: Comprehensive audit trail for all authentication events

#### Real-Time Communication Security
- **Socket Message Validation**: Server-side validation and sanitization of all Socket.io messages
- **Rate Limiting by Operation**: Granular limits (emergency alerts: 5/min, chat: 60/min, status: 30/min)
- **Authenticated Connections**: All socket connections require valid Firebase authentication
- **Message Sanitization**: Real-time content filtering and dangerous pattern removal
- **Connection State Management**: Secure user presence tracking with automatic cleanup

#### Database Security & Access Control
- **Firebase Security Rules**: Multi-layered access control for Firestore and Realtime Database
- **User-Based Data Access**: Strict per-user data isolation with relationship-based sharing
- **Emergency Alert Privacy**: Alerts only visible to sender and designated recipients
- **Contact System Security**: Friend request validation and contact verification
- **Location Data Protection**: Secure GPS coordinate handling with precision controls

#### Security Monitoring & Threat Detection
- **Real-Time Audit Logging**: Comprehensive logging of all security-relevant events
- **Risk Scoring System**: Automated risk assessment (0-100) based on event type and user behavior
- **Anomaly Detection**: Pattern recognition for suspicious activities and repeated failures
- **Security Alert Generation**: Automatic alert creation for high-risk events
- **Threat Intelligence**: Behavioral analysis and trend monitoring
- **Admin Notification System**: Real-time alerts for critical security events

#### Data Protection & Privacy
- **Medical Data Encryption**: Specialized encryption service for sensitive medical information
- **Privacy Control Service**: User-configurable privacy settings and data sharing controls
- **Location Privacy**: Granular controls for location sharing and GPS coordinate access
- **Contact Privacy**: Secure friend request system with email verification
- **Data Retention Policies**: Automatic cleanup of old security events and temporary data

### Security Services

#### InputSanitizationService
```typescript
// XSS protection for user input
const result = inputSanitizationService.sanitizeString(userInput, {
  allowHtml: false,
  maxLength: 500,
  trimWhitespace: true
})
```

#### ValidationService
```typescript
// Schema-based validation
const validation = validationService.validateEmergencyAlert({
  type: 'help',
  message: 'Need assistance',
  location: { lat: 37.7749, lng: -122.4194 }
})
```

#### RateLimitService
```typescript
// Rate limiting for operations
const rateLimitResult = await rateLimitService.checkRateLimit(
  userId, 
  'emergency-alert', 
  { intervalMinutes: 1, maxRequests: 5 }
)
```

#### SecurityMonitoringService
```typescript
// Security event logging
await securityMonitoringService.logSecurityEvent({
  type: 'authentication_failure',
  severity: 'medium',
  userId: 'user123',
  details: { reason: 'invalid_password', attemptCount: 3 }
})
```

### Security Metrics & Monitoring

- **Event Tracking**: All security events logged with timestamps and risk scores
- **Trend Analysis**: 24h, 7d, 30d security trend monitoring
- **High-Risk User Detection**: Automatic identification of suspicious users
- **Security Alerts**: Real-time alerts for critical security events
- **Performance Monitoring**: Security operation performance tracking

### Emergency Security Features

- **Panic Mode**: Enhanced security during emergency situations
- **Location Privacy**: Secure GPS coordinate handling
- **Contact Validation**: Verified emergency contact system
- **Secure Channels**: Encrypted emergency communication
- **Audit Compliance**: Full audit trail for emergency events

## Basic Usage

### Emergency Alert System

Once your app is running and you've created an account:

1. **Add Emergency Contacts**:
   - Click the "Contacts" button in the dashboard
   - Enter a friend's email address
   - They'll receive an invitation to join your emergency network

2. **Send Emergency Alerts**:
   - **HELP Button** (Blue): For non-urgent assistance
     - Instant send to online contacts only
     - "I need help, please respond when you can"
   - **DANGER Button** (Red): For critical emergencies
     - Hold for 3 seconds to prevent accidental activation
     - Sends to ALL contacts (online and offline)
     - "Emergency! I need immediate assistance!"

3. **Location Sharing**:
   - Allow location access when prompted
   - Your GPS coordinates are automatically included in alerts
   - Contacts see your exact location on the map

### Real-time Features

```javascript
// The app automatically detects your connection status:
// 🟢 Real-time Mode: Instant notifications, live presence
// 🔵 Standard Mode: Database alerts, delayed notifications  
// 🔴 Offline Mode: Queued alerts, sync when back online
```

### Emergency Chat

- Click the chat icon to open group emergency chat
- All emergency contacts can participate
- Messages work in real-time when Socket.io server is running
- Automatic message history and offline message queuing

## Troubleshooting

### Common Installation Issues

**❌ Firebase setup errors**
```bash
# Check your .env.local file exists and has correct values
cat .env.local

# Verify Firebase project is properly configured:
# 1. Authentication enabled with Email/Password
# 2. Firestore Database created
# 3. Realtime Database created
```

**❌ Socket.io server won't start**
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill any process using port 3001
kill -9 $(lsof -t -i:3001)

# Try starting with the helper script
./start-socket-server.sh
```

**❌ App shows "Connecting..." forever**
```
Solution: This is normal if Socket.io server isn't running
- App automatically switches to "Standard Mode"
- All emergency features still work via Firebase
- Start Socket.io server for real-time features
```

### Connection Status Issues

**"Offline Mode" showing despite internet connection**
```bash
# Check your browser's network settings
# Disable ad blockers temporarily
# Try in incognito/private mode
# Check browser console for Firebase errors
```

**Firebase "Failed to load resource" errors**
```
Usually caused by:
- Ad blockers blocking Firebase requests
- Incorrect Firebase configuration
- Missing Firebase security rules
- Network firewall restrictions

Solution: Check browser console, verify Firebase config
```

### Performance Issues

**Browser becomes slow/laggy on dashboard**
```
Fixed in recent updates:
- Memory usage limited to prevent 2GB+ RAM usage
- Alert history capped at 50 items
- Chat messages limited to 100 per conversation
- Refresh page if issues persist
```

**Emergency alerts not sending**
```bash
# Check these in order:
1. Do you have emergency contacts added?
2. Is the Firebase connection working?
3. Check browser console for errors
4. Try in a different browser/incognito mode
```

### Development Debugging

**Enable debug logging**
```javascript
// Open browser console and run:
localStorage.setItem('debug', 'emergencize:*')
// Refresh page to see detailed logs
```

**Test Socket.io connection**
```bash
# Check Socket.io server status
curl http://localhost:3001/socket.io/

# Should return: {"sid":"...","upgrades":["websocket"],"pingTimeout":...}
```

## Browser Compatibility

- **Recommended**: Chrome/Edge 88+, Firefox 85+, Safari 14+
- **Required**: WebSocket support, Geolocation API, Local Storage
- **Mobile**: iOS Safari 14+, Android Chrome 88+
- **Note**: Real-time features require WebSocket support

## Development & Production

### Security Best Practices
1. **Environment Variables**: Never commit sensitive Firebase config to version control
2. **HTTPS Only**: Always use HTTPS in production for security
3. **Regular Updates**: Keep dependencies updated for security patches
4. **Security Rules**: Deploy Firebase security rules before going live
5. **Rate Limiting**: Configure appropriate rate limits for your use case
6. **Monitoring**: Set up security event monitoring and alerting

### Performance Optimization
- Service workers for offline functionality
- Firebase SDK tree-shaking for smaller bundles
- Lazy loading for non-critical components
- Optimized real-time subscriptions

### Accessibility Compliance
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode
- Customizable font sizes
- Motion reduction options

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement security-first development practices
4. Test all security features thoroughly
5. Submit a pull request with security considerations documented

## License

This project is licensed under the GPL v3 License - see the [LICENSE](LICENSE) file for details.

---

## Important Security Notes

- **Production Setup**: Ensure all Firebase security rules are properly configured before deploying
- **Rate Limiting**: The system includes built-in rate limiting, but monitor for your specific use case
- **Emergency Use**: This system is designed for emergency situations - ensure proper testing and backup communication methods
- **Data Privacy**: All location and personal data is handled securely with user consent
- **Real-Time Alerts**: System only sends alerts to users who are actively online for immediate response capability

## Emergency Features Summary

### Core Emergency Capabilities
- **Dual Alert System** - HELP (instant) and DANGER (3-second hold) buttons with intelligent contact targeting
- **Real-Time Delivery** - Instant Socket.io notifications plus persistent Firebase storage for offline contacts
- **Location Integration** - Automatic GPS coordinate inclusion with user privacy controls
- **Emergency Chat** - Direct messaging and group communication during crisis situations
- **Voice Call Signaling** - WebRTC integration for emergency voice communication

### Contact & Presence Management
- **Friend Request System** - Secure contact addition with email verification
- **Live Presence Tracking** - Real-time online/offline status with automatic state management
- **Contact Customization** - Relationship categorization and nickname assignment
- **Response Monitoring** - Alert acknowledgment tracking and response time metrics

### Safety & Location Features
- **Geofencing Service** - Custom safe zone creation with enter/exit notifications
- **High-Accuracy GPS** - Precise location tracking with coordinate validation and privacy controls
- **Safe Zone Types** - Predefined categories (home, work, school, hospital) and custom zones
- **Location Privacy** - Granular user controls for GPS sharing and coordinate precision

### Security & Compliance
- **Enterprise-Grade Security** - Multi-layer input sanitization, XSS protection, and injection prevention
- **Real-Time Monitoring** - Comprehensive security event logging with automated risk scoring
- **Rate Limiting Protection** - Operation-specific limits to prevent abuse and ensure system stability
- **Accessibility Compliance** - WCAG 2.1 AA support with screen reader compatibility and keyboard navigation
- **Data Protection** - Medical data encryption, privacy controls, and secure contact management

### Technical Infrastructure
- **Progressive Web App** - App-like experience with offline capabilities and push notifications
- **Responsive Design** - Optimized experience across desktop, tablet, and mobile devices
- **Error Resilience** - Graceful error boundaries with user-friendly recovery options
- **Performance Optimization** - Efficient real-time subscriptions and optimized Firebase SDK usage
