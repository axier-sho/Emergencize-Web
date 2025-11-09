import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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

if (missing.length > 0) {
  throw new Error(
    `Missing required Firebase config: ${missing.join(
      ', '
    )}. Please set the corresponding environment variables.`
  )
}

const app = initializeApp(firebaseConfig as FirebaseOptions)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app