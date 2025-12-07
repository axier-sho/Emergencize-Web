'use client'

import { FormEvent, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  type TransitionDirection = 'forward' | 'backward'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('forward')
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)

  const { login, register } = useAuth()

  // Reset state when opening/closing
  useEffect(() => {
    setError('')
    setLoading(false)
    setFormValues({
      email: '',
      password: '',
      confirmPassword: ''
    })
    setAcceptedTerms(false)
    setAcceptedPrivacy(false)
  }, [isOpen, mode])

  const handleModeSwitch = (nextMode: 'login' | 'register') => {
    if (nextMode === mode) return
    setTransitionDirection(nextMode === 'register' ? 'forward' : 'backward')
    setMode(nextMode)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.email.trim() || !formValues.password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    if (mode === 'register') {
      if (formValues.password !== formValues.confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      if (!acceptedTerms || !acceptedPrivacy) {
        setError('You must accept both the Terms of Service and Privacy Policy to continue.')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        await login(formValues.email, formValues.password)
      } else {
        await register(formValues.email, formValues.password)
      }
      onClose()
    } catch (err: any) {
      const defaultMessage = mode === 'login'
        ? 'Failed to sign in. Please check your credentials.'
        : 'Failed to create an account. Please try again.'
      setError(err?.message || defaultMessage)
    } finally {
      setLoading(false)
    }
  }

  const renderDescription = () => {
    if (mode === 'login') {
      return 'Sign in with your Emergencize email and password to access emergency services.'
    }
    return 'Create an Emergencize account to coordinate emergency readiness with your team.'
  }

  const cardVariants = {
    enter: (direction: TransitionDirection) => ({
      opacity: 0,
      y: direction === 'forward' ? 12 : -12,
      scale: 0.98,
      filter: 'blur(6px)'
    }),
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)'
    },
    exit: (direction: TransitionDirection) => ({
      opacity: 0,
      y: direction === 'forward' ? -12 : 12,
      scale: 0.98,
      filter: 'blur(6px)'
    })
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

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  custom={transitionDirection}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                >
                  {/* Description */}
                  <p className="text-gray-300 text-center mb-6">
                    {renderDescription()}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="email" className="block text-sm text-gray-300 mb-1">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formValues.email}
                        onChange={(event) => setFormValues((prev) => ({
                          ...prev,
                          email: event.target.value
                        }))}
                        className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
                        Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        required
                        value={formValues.password}
                        onChange={(event) => setFormValues((prev) => ({
                          ...prev,
                          password: event.target.value
                        }))}
                        className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter a secure password"
                        minLength={6}
                      />
                    </div>

                    {mode === 'register' && (
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm text-gray-300 mb-1">
                          Confirm password
                        </label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          value={formValues.confirmPassword}
                          onChange={(event) => setFormValues((prev) => ({
                            ...prev,
                            confirmPassword: event.target.value
                          }))}
                          className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Re-enter your password"
                          minLength={6}
                        />
                      </div>
                    )}

                    {mode === 'register' && (
                      <div className="space-y-4">
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
                            I agree to the{' '}
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
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors flex items-center justify-center space-x-3 shadow-lg"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                      )}
                    </motion.button>
                  </form>

                  <div className="mt-6 text-center text-sm text-gray-300">
                    {mode === 'login' ? (
                      <>
                        Need an account?{' '}
                        <button
                          type="button"
                          onClick={() => handleModeSwitch('register')}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Create one
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => handleModeSwitch('login')}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}