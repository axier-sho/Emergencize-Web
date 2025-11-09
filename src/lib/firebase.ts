import { initializeApp, type FirebaseOptions, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const requiredFields: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
]

const missing = requiredFields.filter((field) => !firebaseConfig[field])

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

// Only initialize Firebase if config is present
// This allows the app to load even without Firebase config
if (missing.length === 0) {
  try {
    app = initializeApp(firebaseConfig as FirebaseOptions)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    // In development, log a helpful message
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Firebase initialization failed. Please check your environment variables:\n' +
        `Missing: ${missing.join(', ')}\n` +
        'Create a .env.local file with NEXT_PUBLIC_FIREBASE_* variables.'
      )
    }
  }
} else {
  // In development, show a helpful error
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `Missing required Firebase config: ${missing.join(', ')}.\n` +
      'Please set the corresponding environment variables in .env.local'
    )
  }
}

// Export with fallback checks
export { auth, db }
export default app

// Helper to check if Firebase is initialized
export function isFirebaseInitialized(): boolean {
  return app !== null && auth !== null && db !== null
}