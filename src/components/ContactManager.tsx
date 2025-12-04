'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  User, 
  X, 
  Check, 
  UserPlus,
  Trash2,
  Edit3,
  UserCheck,
  UserX,
  Shield,
  Clock
} from 'lucide-react'
import { findUserByEmail } from '@/lib/database'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  isOnline: boolean
  lastSeen?: Date
  relationship?: string
}

interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromUserEmail: string
  toUserEmail: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  createdAt: any
}

interface ContactManagerProps {
  isOpen: boolean
  onClose: () => void
  contacts: Contact[]
  onAddContact: (contact: { email: string; name?: string; relationship?: string }) => void
  onRemoveContact: (contactId: string) => void
  onEditContact: (contactId: string, contact: Partial<Contact>) => void
  friendRequests?: FriendRequest[]
  onRespondToFriendRequest?: (requestId: string, response: 'accepted' | 'declined' | 'blocked', nickname?: string) => void
}

export default function ContactManager({
  isOpen,
  onClose,
  contacts,
  onAddContact,
  onRemoveContact,
  onEditContact,
  friendRequests = [],
  onRespondToFriendRequest
}: ContactManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  })
  const [activeTab, setActiveTab] = useState<'contacts' | 'requests'>('contacts')
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)
  const [duplicateNameModal, setDuplicateNameModal] = useState<{
    show: boolean
    requestId: string
    existingName: string
    newEmail: string
  }>({
    show: false,
    requestId: '',
    existingName: '',
    newEmail: ''
  })
  const [newNickname, setNewNickname] = useState('')
  const [checkEmailLoading, setCheckEmailLoading] = useState(false)
  const [checkEmailResult, setCheckEmailResult] = useState<null | { exists: boolean; name?: string }>(null)

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newContact.email) {
      try {
        await onAddContact({
          email: newContact.email,
          name: newContact.name || undefined,
          relationship: newContact.relationship || undefined
        })
        setNewContact({ name: '', email: '', phone: '', relationship: '' })
        setShowAddForm(false)
      } catch (error: any) {
        alert(error.message || 'Failed to send friend request')
      }
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    setDeletingContactId(contactId)
    
    // Wait for animation to start
    setTimeout(async () => {
      try {
        await onRemoveContact(contactId)
      } catch (error) {
        console.error('Error deleting contact:', error)
      } finally {
        setDeletingContactId(null)
      }
    }, 150) // Small delay to show the animation
  }

  const checkForDuplicateName = (email: string) => {
    // Extract name from email (part before @)
    const nameFromEmail = email.split('@')[0]
    const existingContact = contacts.find(contact => 
      contact.name.toLowerCase() === nameFromEmail.toLowerCase()
    )
    return existingContact
  }

  const handleAcceptFriendRequest = async (requestId: string, requestEmail: string) => {
    // Check for duplicate names before accepting
    const duplicateContact = checkForDuplicateName(requestEmail)
    
    if (duplicateContact) {
      setDuplicateNameModal({
        show: true,
        requestId,
        existingName: duplicateContact.name,
        newEmail: requestEmail
      })
      setNewNickname('')
    } else {
      // No duplicate, accept normally
      await onRespondToFriendRequest?.(requestId, 'accepted')
    }
  }

  const handleConfirmWithNickname = async () => {
    if (!newNickname.trim()) {
      alert('Please enter a nickname')
      return
    }

    try {
      // Accept the friend request with a custom nickname
      await onRespondToFriendRequest?.(duplicateNameModal.requestId, 'accepted', newNickname)
      
      setDuplicateNameModal({ show: false, requestId: '', existingName: '', newEmail: '' })
      setNewNickname('')
    } catch (error) {
      console.error('Error accepting friend request:', error)
      alert('Failed to accept friend request. Please try again.')
    }
  }

  const handleInviteByEmail = async (email: string) => {
    // This would send an email invitation
    console.log('Sending invitation to:', email)
    // You could integrate with email service here
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              className="glass-effect rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white border-opacity-20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <UserPlus className="mr-3 text-blue-400" size={28} />
                    Emergency Contacts
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('contacts')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'contacts'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
                    }`}
                  >
                    Contacts ({contacts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                      activeTab === 'requests'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
                    }`}
                  >
                    Friend Requests
                    {friendRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {friendRequests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {activeTab === 'contacts' ? (
                  <>
                    {/* Search and Add Button */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <motion.button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus size={20} className="mr-2" />
                    Send Friend Request
                  </motion.button>
                </div>

                {/* Add Contact Form */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      className="bg-white bg-opacity-5 rounded-xl p-6 mb-6 border border-white border-opacity-10"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">Send Friend Request</h3>
                      <form onSubmit={handleAddContact} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">
                              Nickname (Optional)
                            </label>
                            <input
                              type="text"
                              value={newContact.name}
                              onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                              placeholder="Enter nickname (optional)"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">
                              Email Address *
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="email"
                                value={newContact.email}
                                onChange={(e) => {
                                  setNewContact(prev => ({ ...prev, email: e.target.value }))
                                  setCheckEmailResult(null)
                                }}
                                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                                placeholder="Enter email address"
                                required
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!newContact.email) return
                                  setCheckEmailLoading(true)
                                  setCheckEmailResult(null)
                                  try {
                                    const user = await findUserByEmail(newContact.email)
                                    setCheckEmailResult(user ? { exists: true, name: (user as any).displayName || (user as any).email } : { exists: false })
                                  } catch {
                                    setCheckEmailResult({ exists: false })
                                  } finally {
                                    setCheckEmailLoading(false)
                                  }
                                }}
                                className="px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white hover:bg-white/20 transition-colors"
                              >
                                {checkEmailLoading ? 'Checking...' : 'Check'}
                              </button>
                            </div>
                            {checkEmailResult && (
                              <div className={`mt-2 text-sm ${checkEmailResult.exists ? 'text-green-300' : 'text-red-300'}`}>
                                {checkEmailResult.exists ? `User found: ${checkEmailResult.name}` : 'User not found'}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={newContact.phone}
                              onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">
                              Relationship
                            </label>
                            <select
                              value={newContact.relationship}
                              onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:border-blue-400 transition-colors"
                            >
                              <option value="">Select relationship</option>
                              <option value="family">Family</option>
                              <option value="friend">Friend</option>
                              <option value="colleague">Colleague</option>
                              <option value="neighbor">Neighbor</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <motion.button
                            type="submit"
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Check size={20} className="mr-2" />
                            Send Request
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Contacts List */}
                <div className="space-y-3">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-12">
                      <User size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 text-lg mb-2">No contacts found</p>
                      <p className="text-gray-400">Add your first emergency contact to get started</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        className={`bg-white bg-opacity-5 rounded-xl p-4 border border-white border-opacity-10 hover:bg-opacity-10 transition-all ${
                          deletingContactId === contact.id ? 'pointer-events-none' : ''
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: deletingContactId === contact.id ? 0 : 1, 
                          y: 0,
                          x: deletingContactId === contact.id ? -100 : 0,
                          scale: deletingContactId === contact.id ? 0.8 : 1
                        }}
                        exit={{ 
                          opacity: 0, 
                          x: -100, 
                          scale: 0.8,
                          transition: { duration: 0.3 }
                        }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {contact.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                                contact.isOnline ? 'bg-green-400' : 'bg-gray-400'
                              }`} />
                            </div>
                            
                            <div>
                              <h3 className="text-white font-semibold">
                                {contact.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-300">
                                <span className="flex items-center">
                                  <Mail size={14} className="mr-1" />
                                  {contact.email}
                                </span>
                                {contact.phone && (
                                  <span className="flex items-center">
                                    <Phone size={14} className="mr-1" />
                                    {contact.phone}
                                  </span>
                                )}
                              </div>
                              {contact.relationship && (
                                <span className="inline-block mt-1 px-2 py-1 bg-blue-500 bg-opacity-30 text-blue-200 text-xs rounded-full">
                                  {contact.relationship}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <motion.button
                              onClick={() => setEditingContact(contact.id)}
                              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit3 size={16} />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteContact(contact.id)}
                              disabled={deletingContactId === contact.id}
                              className={`p-2 transition-colors ${
                                deletingContactId === contact.id
                                  ? 'text-gray-600 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-400'
                              }`}
                              whileHover={{ scale: deletingContactId === contact.id ? 1 : 1.1 }}
                              whileTap={{ scale: deletingContactId === contact.id ? 1 : 0.9 }}
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                  </>
                ) : (
                  /* Friend Requests Tab */
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Pending Friend Requests</h3>
                    {friendRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <UserCheck size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300 text-lg mb-2">No pending requests</p>
                        <p className="text-gray-400">Friend requests will appear here</p>
                      </div>
                    ) : (
                      friendRequests.map((request, index) => (
                        <motion.div
                          key={request.id}
                          className="bg-white bg-opacity-5 rounded-xl p-4 border border-white border-opacity-10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {request.fromUserEmail.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-white font-semibold">{request.fromUserEmail}</h4>
                                <p className="text-gray-300 text-sm">Wants to add you as an emergency contact</p>
                                <div className="flex items-center text-xs text-gray-400 mt-1">
                                  <Clock size={12} className="mr-1" />
                                  {new Date(request.createdAt?.toDate?.() || request.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <motion.button
                                onClick={() => handleAcceptFriendRequest(request.id, request.fromUserEmail)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Accept"
                              >
                                <UserCheck size={16} />
                              </motion.button>
                              <motion.button
                                onClick={() => onRespondToFriendRequest?.(request.id, 'declined')}
                                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Decline"
                              >
                                <UserX size={16} />
                              </motion.button>
                              <motion.button
                                onClick={() => onRespondToFriendRequest?.(request.id, 'blocked')}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Block"
                              >
                                <Shield size={16} />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Duplicate Name Modal */}
      <AnimatePresence>
        {duplicateNameModal.show && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-effect rounded-2xl w-full max-w-md p-6"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Duplicate Contact Name</h3>
                <p className="text-gray-300 text-sm">
                  You already have a contact named &quot;{duplicateNameModal.existingName}&quot;. 
                  Please provide a nickname for &quot;{duplicateNameModal.newEmail}&quot; to avoid confusion.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Nickname for {duplicateNameModal.newEmail}
                  </label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="Enter a unique nickname"
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleConfirmWithNickname}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Accept with Nickname
                  </motion.button>
                  <motion.button
                    onClick={() => setDuplicateNameModal({ show: false, requestId: '', existingName: '', newEmail: '' })}
                    className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}