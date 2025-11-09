import type * as firebaseAdmin from 'firebase-admin'

declare const firebaseAdminConfig: {
  admin: typeof firebaseAdmin
  initializeFirebaseAdmin: () => typeof firebaseAdmin
  isFirebaseAdminInitialized: () => boolean
}

export = firebaseAdminConfig

