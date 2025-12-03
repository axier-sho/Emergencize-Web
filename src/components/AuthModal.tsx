'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)

  const { loginWithGoogle } = useAuth()

  // Reset state when opening/closing
  useEffect(() => {
    setError('')
    setLoading(false)
    setAcceptedTerms(false)
    setAcceptedPrivacy(false)
  }, [isOpen])

  const handleGoogleSignIn = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      setError('You must accept both the Terms of Service and Privacy Policy to continue.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await loginWithGoogle()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
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
              className="glass-effect rounded-2xl p-8 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Welcome to Emergencize
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded-lg mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Description */}
              <p className="text-gray-300 text-center mb-6">
                Sign in with your Google account to access emergency services
              </p>

              {/* Terms of Service and Privacy Policy Checkboxes */}
              <div className="mb-6 space-y-4">
                {/* Terms of Service */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-2 border-white border-opacity-30 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-300 leading-relaxed">
                    I have read, understood, and agree to be bound by the{' '}
                    <Link 
                      href="/tos" 
                      target="_blank"
                      className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 transition-colors"
                    >
                      Terms of Service
                      <ExternalLink size={12} />
                    </Link>
                  </label>
                </div>

                {/* Privacy Policy */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="acceptPrivacy"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-2 border-white border-opacity-30 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="acceptPrivacy" className="text-sm text-gray-300 leading-relaxed">
                    I have read and understood the{' '}
                    <Link 
                      href="/privacy-policy" 
                      target="_blank"
                      className="text-green-400 hover:text-green-300 underline inline-flex items-center gap-1 transition-colors"
                    >
                      Privacy Policy
                      <ExternalLink size={12} />
                    </Link>
                    {' '}and how my data will be collected and used
                  </label>
                </div>
              </div>

              {/* Google Sign In Button */}
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors flex items-center justify-center space-x-3 shadow-lg"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                      <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                      <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                      <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.96.991 12.696 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.396 3.977 10 3.977z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </motion.button>

              {/* Security Note */}
              <p className="text-xs text-gray-400 text-center mt-6">
                Your information is secure and will only be used for emergency services
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}