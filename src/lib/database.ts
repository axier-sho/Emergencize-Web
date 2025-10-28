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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// Types
export interface User {
  uid: string
  email: string
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
  const userRef = doc(db, 'users', userData.uid)
  
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
    isOnline: true
  })
}

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as User
  }
  return null
}

export const updateUserStatus = async (uid: string, isOnline: boolean) => {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    isOnline,
    lastActive: serverTimestamp()
  })
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(collection(db, 'users'), where('email', '==', email))
  const querySnapshot = await getDocs(q)
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { uid: doc.id, ...doc.data() } as User
  }
  return null
}

// Contact functions
export const addContact = async (userId: string, contactUserId: string, nickname?: string, relationship?: string) => {
  const contactRef = collection(db, 'contacts')
  await addDoc(contactRef, {
    userId,
    contactUserId,
    nickname,
    relationship,
    createdAt: serverTimestamp(),
    status: 'active'
  })
}

export const getUserContacts = (userId: string, callback: (contacts: Contact[]) => void) => {
  const q = query(
    collection(db, 'contacts'),
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
  const contactRef = doc(db, 'contacts', contactId)
  await deleteDoc(contactRef)
}

export const updateContact = async (contactId: string, updates: Partial<Contact>) => {
  const contactRef = doc(db, 'contacts', contactId)
  await updateDoc(contactRef, updates)
}

export const blockContact = async (contactId: string) => {
  const contactRef = doc(db, 'contacts', contactId)
  await updateDoc(contactRef, { 
    status: 'blocked',
    blockedAt: serverTimestamp()
  })
}

// Friend Request functions
export const sendFriendRequest = async (fromUserId: string, toUserEmail: string, fromUserEmail: string) => {
  // Check if user exists
  const toUser = await findUserByEmail(toUserEmail)
  if (!toUser) {
    throw new Error('User not found')
  }

  // Check if request already exists
  const q = query(
    collection(db, 'friendRequests'),
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
    collection(db, 'contacts'),
    where('userId', '==', fromUserId),
    where('contactUserId', '==', toUser.uid),
    where('status', '==', 'active')
  )
  const existingContacts = await getDocs(contactQuery)
  
  if (!existingContacts.empty) {
    throw new Error('User is already in your contacts')
  }

  // Create friend request
  await addDoc(collection(db, 'friendRequests'), {
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
  const q = query(
    collection(db, 'friendRequests'),
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
  const requestRef = doc(db, 'friendRequests', requestId)
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
  await addDoc(collection(db, 'alerts'), {
    ...alertData,
    createdAt: serverTimestamp(),
    readBy: []
  })
}

export const getUserAlerts = (userId: string, callback: (alerts: Alert[]) => void) => {
  // Get alerts where user is the sender or receiver (through contacts)
  const q = query(
    collection(db, 'alerts'),
    orderBy('createdAt', 'desc')
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
  const alertRef = doc(db, 'alerts', alertId)
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
  await addDoc(collection(db, 'notifications'), {
    ...notificationData,
    createdAt: serverTimestamp()
  })
}

export const getUserNotifications = (userId: string, callback: (notifications: NotificationHistory[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
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
  const notificationRef = doc(db, 'notifications', notificationId)
  await updateDoc(notificationRef, { isRead: true })
}