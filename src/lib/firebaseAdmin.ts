import type * as FirebaseAdmin from 'firebase-admin'

type FirebaseAdminModule = {
  admin: typeof FirebaseAdmin
  initializeFirebaseAdmin: () => typeof FirebaseAdmin
}

const { admin, initializeFirebaseAdmin } = require('./firebaseAdminConfig.js') as FirebaseAdminModule

try {
  initializeFirebaseAdmin()
} catch (error) {
  // Re-throw with context so the calling code can decide how to handle
  throw new Error(
    `[firebase-admin] Failed to initialize Firebase Admin SDK: ${
      (error as Error)?.message ?? 'Unknown error'
    }`
  )
}

export { admin }


