# Emergencize - Secure Real-Time Emergency Alert System

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101) ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) <br>

A modern, secure, and accessible web application for emergency alert management with real-time communication, comprehensive security features, and enterprise-level monitoring capabilities.

## Features

### Core Emergency Features
- **Real-time Emergency Alerts** - Instant notifications to online users with Socket.io
- **Location Sharing** - GPS coordinates included in emergency alerts
- **Geofencing & Safe Zones** - Set up safe zones and get alerts when contacts leave/enter areas
- **Push Notifications** - Background alerts when app is not active
- **Two Alert Types:**
  - **Help Alert** - Non-critical assistance requests
  - **Danger Alert** - Critical emergency situations
- **Voice Calling** - WebRTC integration for emergency voice communication

### User Experience
- **Modern Animated UI** - Smooth animations with Framer Motion
- **Accessibility Features** - WCAG 2.1 AA compliance with customizable settings
- **Online Presence System** - See who's currently online and available
- **Error Handling** - Graceful error boundaries with user-friendly messages
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Progressive Web App** - App-like experience with offline capabilities

### Security & Privacy
- **Enterprise-Grade Security** - Comprehensive input validation and sanitization
- **Rate Limiting** - Protection against abuse and spam
- **XSS Protection** - Advanced pattern detection and content sanitization
- **Secure Authentication** - Automatic token refresh and session management
- **Audit Logging** - Complete security event tracking and monitoring
- **Firebase Security Rules** - Multi-layered database protection

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies (in a separate terminal)
npm install express socket.io cors nodemon
```

### 2. Set Up Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore
3. **Important**: Copy the provided security rules to your Firebase project:
   - Update `firestore.rules` for Firestore security
   - Update `database.rules.json` for Realtime Database security
4. Copy your Firebase config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Run the Application

```bash
# Start the Socket.io server (Terminal 1)
node server.js

# Start the Next.js app (Terminal 2)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in multiple browser windows to test real-time functionality.

## Project Structure

```
/
  src/
    app/
      page.tsx                      # Main dashboard
      layout.tsx                    # App layout
      globals.css                   # Global styles
    components/
      accessibility/
        AccessibilitySettings.tsx   # WCAG compliance settings
      error-handling/
        ErrorBoundary.tsx          # React error boundaries
      notifications/
        AlertNotification.tsx      # Enhanced alert notifications
      ui/
        LoadingAnimation.tsx       # Opening animation
        EmergencyButton.tsx        # Emergency buttons
        OnlineUsers.tsx           # User presence display
    hooks/
      useAuth.ts                   # Firebase authentication
      useSecureAuth.ts            # Enhanced auth with token refresh
      useSocket.ts                # Socket.io connection
    services/
      InputSanitizationService.ts # XSS protection & sanitization
      ValidationService.ts        # Schema-based data validation
      RateLimitService.ts         # Rate limiting & abuse prevention
      SecurityMonitoringService.ts # Audit logging & threat detection
      PushNotificationService.ts  # Background notifications
      GeofencingService.ts        # Safe zone management
    utils/
      securityUtils.ts            # Security utility functions
    lib/
      firebase.ts                 # Firebase configuration
      database.ts                 # Database operations
  server.js                       # Enhanced Socket.io server with security
  firestore.rules                 # Firestore security rules
  database.rules.json             # Realtime Database security rules
  package.json                    # Dependencies
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

### Real-Time Communication
- **Socket.io** for instant message delivery
- **User Presence** tracking who's online
- **Room-based** messaging system
- **Automatic Reconnection** handling

### Emergency Alert Flow
1. User presses emergency button
2. Location is captured (if permitted)
3. Alert is sent via Socket.io to all online users
4. Recipients receive animated notification
5. Optional response system for acknowledgment

### Web-Optimized Features
- **Geolocation API** for location sharing
- **Vibration API** for haptic feedback (mobile)
- **Web Audio API** for alert sounds
- **Service Workers** for background notifications

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

### Multi-Layer Security System

#### Input Validation & Sanitization
- **XSS Protection**: Advanced pattern detection and HTML sanitization
- **SQL Injection Prevention**: Parameterized queries and input validation
- **Schema-Based Validation**: Type-safe validation for all data structures
- **Content Security Policy**: Strict CSP headers and dangerous content filtering

#### Authentication & Authorization
- **Secure Token Management**: Automatic JWT refresh and expiration handling
- **Session Security**: Secure session management with device fingerprinting
- **Multi-Factor Support**: Ready for MFA integration
- **Rate-Limited Auth**: Protection against brute force attacks

#### Real-Time Communication Security
- **Socket Validation**: All socket messages validated and sanitized
- **Rate Limiting**: Per-user, per-operation rate limits
- **Connection Security**: Authenticated socket connections only
- **Message Encryption**: Secure message transmission

#### Database Security
- **Firebase Security Rules**: Comprehensive Firestore and Realtime Database rules
- **Access Control**: User-based data access with strict validation
- **Data Sanitization**: All data sanitized before storage
- **Audit Logging**: Complete database operation logging

#### Monitoring & Threat Detection
- **Real-Time Monitoring**: Live security event tracking
- **Risk Scoring**: Automated risk assessment for user actions
- **Anomaly Detection**: Suspicious behavior pattern recognition
- **Alert System**: Automatic security alert generation
- **Audit Trail**: Complete security event history

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

## Browser Compatibility

- Chrome/Edge 88+ (recommended)
- Firefox 85+
- Safari 14+
- Mobile browsers with WebSocket support

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Important Security Notes

- **Production Setup**: Ensure all Firebase security rules are properly configured before deploying
- **Rate Limiting**: The system includes built-in rate limiting, but monitor for your specific use case
- **Emergency Use**: This system is designed for emergency situations - ensure proper testing and backup communication methods
- **Data Privacy**: All location and personal data is handled securely with user consent
- **Real-Time Alerts**: System only sends alerts to users who are actively online for immediate response capability

## Emergency Features Summary

- **Real-time alerts** with Socket.io
- **Location sharing** with privacy controls
- **Geofencing** for safe zone monitoring
- **Push notifications** for background alerts
- **Voice calling** via WebRTC
- **Accessibility** features for all users
- **Enterprise security** with comprehensive monitoring
- **Error handling** with graceful fallbacks
- **Rate limiting** to prevent abuse
- **Audit logging** for compliance
