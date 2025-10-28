'use client'

import { useState, useEffect } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  PhoneAuthProvider,
  multiFactor,
  PhoneMultiFactorGenerator
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { createUserProfile, getUserProfile, updateUserStatus } from '@/lib/database'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Keep a cache of RecaptchaVerifier instances by container id to avoid duplicates
  const [recaptchaCache] = useState<Record<string, RecaptchaVerifier>>({})

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update user status to online
        try {
          await updateUserStatus(user.uid, true)
        } catch (error) {
          console.error('Error updating user status:', error)
        }
      }
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      // rethrow original error so callers can inspect error.code and error.resolver
      throw error
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Create user profile in Firestore
      // Only include fields that are not undefined
      const profileData: any = {
        uid: user.uid,
        email: user.email!
      }
      
      if (user.displayName) {
        profileData.displayName = user.displayName
      }
      
      if (user.photoURL) {
        profileData.photoURL = user.photoURL
      }
      
      await createUserProfile(profileData)
      
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  // Sends an SMS code to enroll Phone as a multi-factor during signup
  // Returns the verificationId which must be used with the user's code
  const sendMfaEnrollmentCode = async (phoneNumber: string, recaptchaContainerId: string): Promise<string> => {
    if (!auth.currentUser) {
      throw new Error('Must be signed in to enroll MFA')
    }

    const mfaSession = await multiFactor(auth.currentUser).getSession()

    let verifier = recaptchaCache[recaptchaContainerId]
    if (!verifier) {
      verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' })
      recaptchaCache[recaptchaContainerId] = verifier
    }

    const phoneInfoOptions = { phoneNumber, session: mfaSession }
    const provider = new PhoneAuthProvider(auth)
    const verificationId = await provider.verifyPhoneNumber(phoneInfoOptions, verifier)
    return verificationId
  }

  // Completes MFA enrollment with the code user received by SMS
  const enrollMfaWithCode = async (verificationId: string, verificationCode: string, displayName = 'SMS') => {
    if (!auth.currentUser) {
      throw new Error('Must be signed in to enroll MFA')
    }
    const cred = PhoneAuthProvider.credential(verificationId, verificationCode)
    const assertion = PhoneMultiFactorGenerator.assertion(cred)
    await multiFactor(auth.currentUser).enroll(assertion, displayName)
  }

  const logout = async () => {
    try {
      if (user) {
        // Update user status to offline before signing out
        await updateUserStatus(user.uid, false)
      }
      await signOut(auth)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    sendMfaEnrollmentCode,
    enrollMfaWithCode
  }
}