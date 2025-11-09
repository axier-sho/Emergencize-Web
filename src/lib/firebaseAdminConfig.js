const admin = require('firebase-admin')

let initialized = false

function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    initialized = true
    return admin
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined

  try {
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      })
      console.log('[firebase-admin] Initialized with service account')
    } else {
      admin.initializeApp()
      console.warn(
        '[firebase-admin] Initialized with default credentials (ensure Application Default Credentials are configured)'
      )
    }
    initialized = true
  } catch (error) {
    initialized = false
    throw error
  }

  return admin
}

function isFirebaseAdminInitialized() {
  return initialized
}

module.exports = {
  admin,
  initializeFirebaseAdmin,
  isFirebaseAdminInitialized
}

