import type * as FirebaseAdmin from 'firebase-admin'

type FirebaseAdminModule = {
  admin: typeof FirebaseAdmin
  initializeFirebaseAdmin: () => typeof FirebaseAdmin
}

const { admin, initializeFirebaseAdmin } = require('./firebaseAdminConfig.js') as FirebaseAdminModule

try {
  initializeFirebaseAdmin()
} catch (error) {
  // Do not throw at import time — this can break route initialization.
  // API routes should handle errors when using the admin SDK.
  // eslint-disable-next-line no-console
  console.warn(
    `[firebase-admin] Initialization failed at module load: ${
      (error as Error)?.message ?? 'Unknown error'
    }. Routes will handle usage-time failures.`
  )
}

export { admin }


