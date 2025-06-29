'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { AlertTriangle, Shield, Users, Zap, Github, Info, ArrowRight, LogIn, UserPlus, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { useClient, useWindowSize } from '@/hooks/useClient'

export default function LandingPage() {
  const [showContent, setShowContent] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const windowSize = useWindowSize()
  const isClient = useClient()
  const { user, logout } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Alerts",
      description: "Instant emergency notifications to online contacts"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Online Presence",
      description: "See who's available for emergency response"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Location Sharing",
      description: "GPS coordinates included in emergency alerts"
    },
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: "Dual Alert Types",
      description: "Help requests and critical danger alerts"
    }
  ]

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      
      {/* Floating particles */}
      {isClient && windowSize.width > 0 && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => {
            const x = (i * 123 + 456) % windowSize.width // Deterministic positioning
            const y = (i * 789 + 321) % windowSize.height
            const duration = 3 + (i % 3)
            const delay = i * 0.2
            
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white bg-opacity-20 rounded-full"
                initial={{
                  x,
                  y,
                  opacity: 0
                }}
                animate={{
                  y: [null, y - 100],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  delay
                }}
              />
            )
          })}
        </div>
      )}

      {/* Navigation */}
      <motion.nav
        className="relative z-10 flex justify-between items-center p-6"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <motion.div
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-blue-600 font-bold text-lg">E</span>
          </div>
          <span className="text-white text-xl font-bold">Emergencize</span>
        </motion.div>

        <div className="flex items-center space-x-4">
          <Link href="/about">
            <motion.button
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Info size={20} />
              <span>About</span>
            </motion.button>
          </Link>
          
          <motion.a
            href="https://github.com/Sho1228"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Github size={20} />
            <span>GitHub</span>
          </motion.a>

          {/* Auth Buttons in Header */}
          {!user ? (
            <>
              <motion.button
                onClick={() => {
                  setAuthMode('login')
                  setAuthModalOpen(true)
                }}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setAuthMode('signup')
                  setAuthModalOpen(true)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus size={18} />
                <span>Sign Up</span>
              </motion.button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <span className="text-white">Welcome!</span>
              <Link href="/dashboard">
                <motion.button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dashboard
                </motion.button>
              </Link>
              <motion.button
                onClick={logout}
                className="px-4 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <AnimatePresence>
        {showContent && (
          <motion.main
            className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Main Logo Animation */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1.5, 
                type: "spring",
                stiffness: 200,
                damping: 15 
              }}
            >
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6">
                <AlertTriangle size={64} className="text-red-500" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-6xl md:text-7xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Emergencize
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl md:text-2xl text-blue-200 mb-8 max-w-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Real-time emergency alert system for online contacts. 
              Send instant help requests and danger alerts with location sharing.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Link href="/dashboard">
                <motion.button
                  className="group flex items-center space-x-3 px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Get Started</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <Link href="/about">
                <motion.button
                  className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>

            {/* Auth Buttons */}
            {!user && (
              <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <motion.button
                  onClick={() => {
                    setAuthMode('login')
                    setAuthModalOpen(true)
                  }}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogIn size={20} />
                  <span>Sign In</span>
                </motion.button>
                <motion.button
                  onClick={() => {
                    setAuthMode('signup')
                    setAuthModalOpen(true)
                  }}
                  className="flex items-center justify-center space-x-2 px-6 py-3 border border-white border-opacity-30 text-white rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserPlus size={20} />
                  <span>Create Account</span>
                </motion.button>
              </motion.div>
            )}

            {/* Developer Credit */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <p className="text-blue-200 text-sm mb-2">Developed by</p>
              <motion.a
                href="https://github.com/Sho1228"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-white text-lg font-semibold hover:text-blue-200 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <span>Sho𓆑</span>
                <Github size={20} />
              </motion.a>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="glass-effect rounded-2xl p-6 text-center hover:bg-white hover:bg-opacity-15 transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div
                    className="text-blue-300 mb-4 flex justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-blue-200 text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Scroll Indicator */}
      <motion.button
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2 }}
        onClick={() => {
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm border-2 border-white border-opacity-40 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-30 hover:border-opacity-80 transition-all"
          animate={{ y: [0, -8, 0] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <ChevronDown 
            size={20} 
            className="text-white group-hover:text-blue-200 transition-colors" 
          />
        </motion.div>
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          Scroll to explore
        </motion.div>
      </motion.button>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  )
}