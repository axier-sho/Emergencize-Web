import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db, isFirebaseInitialized } from './firebase'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

// Helper to check if Firebase is initialized
const requireDb = () => {
  if (!db || !isFirebaseInitialized()) {
    throw new Error('Firebase is not configured. Please check your environment variables.')
  }
  return db
}

// Types
export interface User {
  uid: string
  email: string
  normalizedEmail?: string
  displayName?: string
  photoURL?: string
  createdAt: Timestamp
  lastActive: Timestamp
  isOnline: boolean
}

export interface Contact {
  id: string
  userId: string // Owner of the contact
  contactUserId: string // The actual user being added as contact
  nickname?: string
  relationship?: string
  createdAt: Timestamp
  status: 'active' | 'blocked'
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromUserEmail: string
  toUserEmail: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  createdAt: Timestamp
  respondedAt?: Timestamp
}

export interface Alert {
  id: string
  fromUserId: string
  type: 'help' | 'danger'
  message: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  createdAt: Timestamp
  readBy: string[] // Array of user IDs who have read the alert
}

export interface NotificationHistory {
  id: string
  userId: string
  type: 'alert_sent' | 'alert_received' | 'friend_request_sent' | 'friend_request_received' | 'contact_added'
  title: string
  message: string
  createdAt: Timestamp
  isRead: boolean
  relatedId?: string // ID of related alert, friend request, etc.
}

// User functions
export const createUserProfile = async (userData: Omit<User, 'createdAt' | 'lastActive' | 'isOnline'>) => {
  const firestoreDb = requireDb()
  const userRef = doc(firestoreDb, 'users', userData.uid)
  
  // Filter out undefined values to prevent Firestore errors
  const cleanedData: any = {}
  Object.keys(userData).forEach((key) => {
    const value = (userData as any)[key]
    if (value !== undefined) {
      cleanedData[key] = value
    }
  })
  
  await setDoc(userRef, {
    ...cleanedData,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    isOnline: true,
    normalizedEmail: normalizeEmail(userData.email)
  })
}

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const firestoreDb = requireDb()
  const userRef = doc(firestoreDb, 'users', uid)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as User
  }
  return null
}

// Update user profile (partial). Does not change email/createdAt per rules
export const updateUserProfile = async (uid: string, updates: Partial<User> & Record<string, any>) => {
  const firestoreDb = requireDb()
  const userRef = doc(firestoreDb, 'users', uid)

  const cleanedUpdates: Record<string, any> = {}
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedUpdates[key] = value
    }
  })

  if (typeof cleanedUpdates.email === 'string') {
    cleanedUpdates.normalizedEmail = normalizeEmail(cleanedUpdates.email)
  }

  cleanedUpdates.updatedAt = serverTimestamp()

  await setDoc(userRef, cleanedUpdates, { merge: true })
}

export const updateUserStatus = async (uid: string, isOnline: boolean) => {
  if (!db || !isFirebaseInitialized()) {
    // Silently fail if Firebase is not configured - this is called on auth state change
    console.warn('Firebase not configured, skipping user status update')
    return
  }
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    isOnline,
    lastActive: serverTimestamp()
  })
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const firestoreDb = requireDb()
  const normalized = normalizeEmail(email)
  const normalizedQuery = query(collection(firestoreDb, 'users'), where('normalizedEmail', '==', normalized))
  const normalizedSnapshot = await getDocs(normalizedQuery)

  if (!normalizedSnapshot.empty) {
    const userDoc = normalizedSnapshot.docs[0]
    return { uid: userDoc.id, ...userDoc.data() } as User
  }

  const fallbackQuery = query(collection(firestoreDb, 'users'), where('email', '==', normalized))
  const fallbackSnapshot = await getDocs(fallbackQuery)

  if (!fallbackSnapshot.empty) {
    const userDoc = fallbackSnapshot.docs[0]
    return { uid: userDoc.id, ...userDoc.data() } as User
  }

  return null
}

// Contact functions
export const addContact = async (userId: string, contactUserId: string, nickname?: string, relationship?: string) => {
  const firestoreDb = requireDb()
  if (userId === contactUserId) {
    throw new Error('You cannot add yourself as a contact.')
  }

  const existingQuery = query(
    collection(firestoreDb, 'contacts'),
    where('userId', '==', userId),
    where('contactUserId', '==', contactUserId),
    where('status', '==', 'active')
  )
  const existingSnapshot = await getDocs(existingQuery)
  if (!existingSnapshot.empty) {
    return existingSnapshot.docs[0].id
  }

  const contactRef = collection(firestoreDb, 'contacts')
  const docRef = await addDoc(contactRef, {
    userId,
    contactUserId,
    nickname,
    relationship,
    createdAt: serverTimestamp(),
    status: 'active'
  })

  return docRef.id
}

export const getUserContacts = (userId: string, callback: (contacts: Contact[]) => void) => {
  const firestoreDb = requireDb()
  const q = query(
    collection(firestoreDb, 'contacts'),
    where('userId', '==', userId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const contacts: Contact[] = []
    querySnapshot.forEach((doc) => {
      contacts.push({ id: doc.id, ...doc.data() } as Contact)
    })
    callback(contacts)
  })
}

export const removeContact = async (contactId: string) => {
  const firestoreDb = requireDb()
  const contactRef = doc(firestoreDb, 'contacts', contactId)
  await deleteDoc(contactRef)
}

export const updateContact = async (contactId: string, updates: Partial<Contact>) => {
  const firestoreDb = requireDb()
  const contactRef = doc(firestoreDb, 'contacts', contactId)
  await updateDoc(contactRef, updates)
}

export const blockContact = async (contactId: string) => {
  const firestoreDb = requireDb()
  const contactRef = doc(firestoreDb, 'contacts', contactId)
  await updateDoc(contactRef, { 
    status: 'blocked',
    blockedAt: serverTimestamp()
  })
}

// Friend Request functions
export const sendFriendRequest = async (fromUserId: string, toUserEmail: string, fromUserEmail: string) => {
  const firestoreDb = requireDb()
  // Check if user exists
  const toUser = await findUserByEmail(toUserEmail)
  if (!toUser) {
    throw new Error('User not found')
  }

  // Check if request already exists
  const q = query(
    collection(firestoreDb, 'friendRequests'),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUser.uid),
    where('status', 'in', ['pending', 'accepted'])
  )
  const existingRequests = await getDocs(q)
  
  if (!existingRequests.empty) {
    throw new Error('Friend request already exists')
  }

  // Check if they're already contacts
  const contactQuery = query(
    collection(firestoreDb, 'contacts'),
    where('userId', '==', fromUserId),
    where('contactUserId', '==', toUser.uid),
    where('status', '==', 'active')
  )
  const existingContacts = await getDocs(contactQuery)
  
  if (!existingContacts.empty) {
    throw new Error('User is already in your contacts')
  }

  // Create friend request
  await addDoc(collection(firestoreDb, 'friendRequests'), {
    fromUserId,
    toUserId: toUser.uid,
    fromUserEmail,
    toUserEmail,
    status: 'pending',
    createdAt: serverTimestamp()
  })

  return toUser
}

export const getFriendRequests = (userId: string, callback: (requests: FriendRequest[]) => void) => {
  const firestoreDb = requireDb()
  const q = query(
    collection(firestoreDb, 'friendRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const requests: FriendRequest[] = []
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as FriendRequest)
    })
    callback(requests)
  })
}

export const respondToFriendRequest = async (requestId: string, response: 'accepted' | 'declined' | 'blocked') => {
  const firestoreDb = requireDb()
  const requestRef = doc(firestoreDb, 'friendRequests', requestId)
  const requestSnap = await getDoc(requestRef)
  
  if (!requestSnap.exists()) {
    throw new Error('Friend request not found')
  }

  const request = requestSnap.data() as FriendRequest

  // Update request status
  await updateDoc(requestRef, {
    status: response,
    respondedAt: serverTimestamp()
  })

  // If accepted, add each other as contacts
  if (response === 'accepted') {
    await Promise.all([
      addContact(request.toUserId, request.fromUserId),
      addContact(request.fromUserId, request.toUserId)
    ])
  }
}

// Alert functions
export const saveAlert = async (alertData: Omit<Alert, 'id' | 'createdAt' | 'readBy'>) => {
  const firestoreDb = requireDb()
  await addDoc(collection(firestoreDb, 'alerts'), {
    ...alertData,
    createdAt: serverTimestamp(),
    readBy: []
  })
}

export const getUserAlerts = (
  userId: string,
  callback: (alerts: Alert[]) => void,
  options: { limit?: number } = {}
) => {
  const firestoreDb = requireDb()
  // Get alerts where user is the sender or receiver (through contacts)
  const limitCount = Math.max(options.limit ?? 50, 1)
  const q = query(
    collection(firestoreDb, 'alerts'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const alerts: Alert[] = []
    querySnapshot.forEach((doc) => {
      const alert = { id: doc.id, ...doc.data() } as Alert
      // Filter logic can be enhanced based on contact relationships
      alerts.push(alert)
    })
    callback(alerts)
  })
}

export const markAlertAsRead = async (alertId: string, userId: string) => {
  const firestoreDb = requireDb()
  const alertRef = doc(firestoreDb, 'alerts', alertId)
  const alertSnap = await getDoc(alertRef)
  
  if (alertSnap.exists()) {
    const alert = alertSnap.data() as Alert
    if (!alert.readBy.includes(userId)) {
      await updateDoc(alertRef, {
        readBy: [...alert.readBy, userId]
      })
    }
  }
}

// Notification History functions
export const addNotification = async (notificationData: Omit<NotificationHistory, 'id' | 'createdAt'>) => {
  const firestoreDb = requireDb()
  await addDoc(collection(firestoreDb, 'notifications'), {
    ...notificationData,
    createdAt: serverTimestamp()
  })
}

export const getUserNotifications = (userId: string, callback: (notifications: NotificationHistory[]) => void) => {
  const firestoreDb = requireDb()
  const q = query(
    collection(firestoreDb, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const notifications: NotificationHistory[] = []
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as NotificationHistory)
    })
    callback(notifications)
  })
}

export const markNotificationAsRead = async (notificationId: string) => {
  const firestoreDb = requireDb()
  const notificationRef = doc(firestoreDb, 'notifications', notificationId)
  await updateDoc(notificationRef, { isRead: true })
}