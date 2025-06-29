'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import {
  getUserContacts,
  addContact,
  removeContact,
  updateContact,
  blockContact,
  getUserProfile,
  type Contact,
  type User
} from '@/lib/database'

export interface ContactWithUser extends Contact {
  user: User | null
  isOnline: boolean
}

export function useContacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<ContactWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setContacts([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = getUserContacts(user.uid, async (contactsData) => {
      try {
        // Fetch user data for each contact
        const contactsWithUsers = await Promise.all(
          contactsData.map(async (contact) => {
            const contactUser = await getUserProfile(contact.contactUserId)
            return {
              ...contact,
              user: contactUser,
              isOnline: contactUser?.isOnline || false
            }
          })
        )
        
        setContacts(contactsWithUsers)
        setError(null)
      } catch (err) {
        console.error('Error fetching contact details:', err)
        setError('Failed to load contacts')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [user])

  const addNewContact = async (contactUserId: string, nickname?: string, relationship?: string) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      await addContact(user.uid, contactUserId, nickname, relationship)
    } catch (err) {
      console.error('Error adding contact:', err)
      throw err
    }
  }

  const removeContactById = async (contactId: string) => {
    try {
      await removeContact(contactId)
    } catch (err) {
      console.error('Error removing contact:', err)
      throw err
    }
  }

  const updateContactById = async (contactId: string, updates: Partial<Contact>) => {
    try {
      await updateContact(contactId, updates)
    } catch (err) {
      console.error('Error updating contact:', err)
      throw err
    }
  }

  const blockContactById = async (contactId: string) => {
    try {
      await blockContact(contactId)
    } catch (err) {
      console.error('Error blocking contact:', err)
      throw err
    }
  }

  return {
    contacts,
    loading,
    error,
    addContact: addNewContact,
    removeContact: removeContactById,
    updateContact: updateContactById,
    blockContact: blockContactById
  }
}