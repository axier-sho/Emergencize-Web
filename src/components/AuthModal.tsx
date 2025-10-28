'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff, ExternalLink, Phone, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase'
import { RecaptchaVerifier, PhoneAuthProvider, PhoneMultiFactorGenerator } from 'firebase/auth'

type Country = { code: string; name: string; dialCode: string }
const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'RU', name: 'Russia', dialCode: '+7' }
]
import Link from 'next/link'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
  lockMode?: boolean // When true, prevents toggling between modes
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login', lockMode = false }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [signupVerifying, setSignupVerifying] = useState(false)
  const [loginResolver, setLoginResolver] = useState<any>(null)
  const [loginVerifying, setLoginVerifying] = useState(false)
  const [countryCode, setCountryCode] = useState<string>('US')

  const { login, register, sendMfaEnrollmentCode, enrollMfaWithCode } = useAuth()

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // Reset state when opening/closing or switching modes
  useEffect(() => {
    setError('')
    setLoading(false)
    setPhoneNumber('')
    setSmsCode('')
    setVerificationId(null)
    setSignupVerifying(false)
    setLoginResolver(null)
    setLoginVerifying(false)
  }, [isOpen, mode])

  const selectedDial = (COUNTRIES.find(c => c.code === countryCode)?.dialCode) || '+1'
  const e164FromSelection = (): string => {
    const digits = phoneNumber.replace(/\D/g, '')
    return `${selectedDial}${digits}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        // Step 1: Normal login
        if (!loginVerifying) {
          try {
            await login(email, password)
            onClose()
            return
          } catch (err: any) {
            if (err?.code === 'auth/multi-factor-auth-required') {
              const resolver = err.resolver
              // Only handle phone MFA for now
              const phoneHintIndex = resolver.hints.findIndex((h: any) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID)
              if (phoneHintIndex === -1) {
                throw new Error('Unsupported second factor')
              }
              const phoneInfoOptions = {
                multiFactorHint: resolver.hints[phoneHintIndex],
                session: resolver.session
              }
              const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-login', { size: 'invisible' })
              const provider = new PhoneAuthProvider(auth)
              const vId = await provider.verifyPhoneNumber(phoneInfoOptions as any, verifier)
              setVerificationId(vId)
              setLoginResolver(resolver)
              setLoginVerifying(true)
              setError('SMS code sent. Please enter the code to complete sign-in.')
              setLoading(false)
              return
            }
            throw err
          }
        } else {
          // Step 2: Complete MFA sign-in with SMS code
          if (!verificationId || !loginResolver) {
            throw new Error('Verification not initialized')
          }
          const cred = PhoneAuthProvider.credential(verificationId, smsCode)
          const assertion = PhoneMultiFactorGenerator.assertion(cred)
          await loginResolver.resolveSignIn(assertion)
          onClose()
          return
        }
      } else {
        // Sign up flow with MFA enrollment
        if (!signupVerifying) {
          // Check Terms of Service acceptance for signup
          if (!acceptedTerms) {
            setError('You must accept the Terms of Service to create an account.')
            setLoading(false)
            return
          }
          if (!phoneNumber) {
            setError('Please provide a phone number for SMS verification.')
            setLoading(false)
            return
          }
          await register(email, password)
          const fullPhone = e164FromSelection()
          const vId = await sendMfaEnrollmentCode(fullPhone, 'recaptcha-container-enroll')
          setVerificationId(vId)
          setSignupVerifying(true)
          setError('We sent an SMS code. Enter it below to verify your phone.')
          setLoading(false)
          return
        } else {
          if (!verificationId) {
            throw new Error('Verification not initialized')
          }
          await enrollMfaWithCode(verificationId, smsCode)
          onClose()
          return
        }
      }
      // Reset form
      setEmail('')
      setPassword('')
      setName('')
      setAcceptedTerms(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    if (lockMode) return // Prevent toggling when locked
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
    setAcceptedTerms(false)
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
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name field (signup only) */}
                {mode === 'signup' && !signupVerifying && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-white text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                        placeholder="Enter your full name"
                        required={mode === 'signup'}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Email field */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="Enter your password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Phone number (signup, step 1) */}
                {mode === 'signup' && !signupVerifying && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Phone Number (for SMS verification)
                    </label>
                    <div className="flex gap-2">
                      <div className="w-28 relative h-12 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400 transition-colors">
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 text-white">
                          <span aria-hidden="true">{selectedDial}</span>
                          <ChevronDown size={16} aria-hidden="true" className="opacity-70" />
                        </div>
                        <select
                          aria-label="Select country"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-gray-900 text-white">
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                          placeholder={`e.g. ${selectedDial} 650-555-1234`}
                          required
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">We will send an SMS to {selectedDial} {phoneNumber || 'your number'}.</p>
                  </div>
                )}

                {/* SMS code (signup verify or login verify) */}
                {(signupVerifying || loginVerifying) && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Enter SMS verification code
                    </label>
                    <input
                      type="text"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="6-digit code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                    />
                  </div>
                )}

                {/* Terms of Service Checkbox (signup only) */}
                {mode === 'signup' && !signupVerifying && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start space-x-3"
                  >
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-2 border-white border-opacity-30 rounded focus:ring-blue-500 focus:ring-2"
                      required
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
                      {' '}and acknowledge the platform&apos;s emergency disclaimers and limitations.
                    </label>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading || (mode === 'signup' && !signupVerifying && !acceptedTerms)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    signupVerifying ? 'Verify Phone' : loginVerifying ? 'Verify Sign-in' : (mode === 'login' ? 'Sign In' : 'Create Account')
                  )}
                </motion.button>
              </form>

              {/* Invisible reCAPTCHA containers for phone verification */}
              <div id="recaptcha-container-enroll" className="hidden" />
              <div id="recaptcha-container-login" className="hidden" />

              {/* Toggle Mode */}
              {!lockMode && !signupVerifying && !loginVerifying && (
                <div className="mt-6 text-center">
                  <span className="text-gray-300">
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  </span>
                  <button
                    onClick={toggleMode}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}