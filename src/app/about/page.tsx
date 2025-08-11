'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  Github, 
  ArrowLeft, 
  Code, 
  Smartphone, 
  Globe, 
  Zap, 
  Users, 
  Shield,
  Heart,
  AlertTriangle,
  Star,
  ExternalLink,
  LogIn,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { useClient, useWindowSize } from '@/hooks/useClient'

export default function AboutPage() {
  const [showContent, setShowContent] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const windowSize = useWindowSize()
  const isClient = useClient()
  const { user, logout } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const technologies = [
    { name: "Next.js 15", icon: <Globe className="w-6 h-6" />, color: "text-blue-400" },
    { name: "TypeScript", icon: <Code className="w-6 h-6" />, color: "text-blue-500" },
    { name: "Framer Motion", icon: <Zap className="w-6 h-6" />, color: "text-purple-400" },
    { name: "Tailwind CSS", icon: <Star className="w-6 h-6" />, color: "text-cyan-400" },
    { name: "Socket.io", icon: <Users className="w-6 h-6" />, color: "text-green-400" },
    { name: "Firebase", icon: <Shield className="w-6 h-6" />, color: "text-orange-400" }
  ]

  const adaptations = [
    {
      from: "Core Location (iOS)",
      to: "Geolocation API",
      icon: <Globe className="w-5 h-5" />
    },
    {
      from: "Push Notifications (iOS)",
      to: "Web Push API + Service Workers",
      icon: <Zap className="w-5 h-5" />
    },
    {
      from: "Haptic Feedback (iOS)",
      to: "Vibration API + Visual Feedback",
      icon: <Smartphone className="w-5 h-5" />
    },
    {
      from: "VoIP Calls (iOS)",
      to: "WebRTC Integration",
      icon: <Users className="w-5 h-5" />
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Animated Background */}
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Floating Elements */}
      {isClient && windowSize.width > 0 && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => {
            const x = (i * 142 + 567) % windowSize.width
            const y = (i * 834 + 291) % windowSize.height
            const duration = 4 + (i % 3)
            const delay = i * 0.3
            
            return (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x,
                  y,
                  opacity: 0
                }}
                animate={{
                  y: [null, y - 50],
                  opacity: [0, 0.3, 0],
                  rotate: 360
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  delay
                }}
              >
                {i % 3 === 0 ? (
                  <AlertTriangle size={16} className="text-white" />
                ) : i % 3 === 1 ? (
                  <Heart size={16} className="text-red-300" />
                ) : (
                  <Shield size={16} className="text-blue-300" />
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Navigation */}
      <motion.nav
        className="relative z-10 flex justify-between items-center p-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link href="/">
          <motion.button
            className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </motion.button>
        </Link>

        <div className="flex items-center space-x-4">
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
                className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setAuthMode('signup')
                  setAuthModalOpen(true)
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus size={16} />
                <span>Sign Up</span>
              </motion.button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <motion.button
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dashboard
                </motion.button>
              </Link>
              <motion.button
                onClick={logout}
                className="px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Main Content */}
      <AnimatePresence>
        {showContent && (
          <motion.main
            className="relative z-10 px-6 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="max-w-6xl mx-auto">
              {/* Hero Section */}
              <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.div
                  className="mb-8"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 1, 
                    type: "spring",
                    stiffness: 200,
                    damping: 20 
                  }}
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mx-auto">
                    <AlertTriangle size={48} className="text-red-500" />
                  </div>
                </motion.div>

                <motion.h1
                  className="text-5xl md:text-6xl font-bold text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  About Emergencize
                </motion.h1>

                <motion.p
                  className="text-xl text-blue-200 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  A modern web adaptation of an iOS emergency alert system, 
                  rebuilt for the web with real-time communication and smooth animations.
                </motion.p>
              </motion.div>

              {/* Developer Section */}
              <motion.section
                className="mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="glass-effect rounded-3xl p-8 text-center">
                  <motion.div
                    className="mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-20 h-20 bg-[rgb(145,170,210)] rounded-full flex items-center justify-center shadow-xl mx-auto mb-4">
                      <span className="text-white text-2xl font-bold">S</span>
                    </div>
                  </motion.div>

                  <h2 className="text-3xl font-bold text-white mb-2">Sho𓆑</h2>
                  <p className="text-blue-200 mb-6">Full-Stack Developer & Emergency System Designer</p>
                  
                  <motion.a
                    href="https://github.com/Sho1228"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full text-white transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Github size={20} />
                    <span>Visit GitHub Profile</span>
                    <ExternalLink size={16} />
                  </motion.a>
                </div>
              </motion.section>

              {/* Project Story */}
              <motion.section
                className="mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="glass-effect rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Smartphone className="mr-3 text-blue-400" />
                      From iOS to Web
                    </h3>
                    <p className="text-blue-200 leading-relaxed">
                      Originally an iOS emergency app with native features like Core Location, 
                      push notifications, and haptic feedback. This web version adapts these 
                      iPhone-specific capabilities to work seamlessly in modern browsers.
                    </p>
                  </div>

                  <div className="glass-effect rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Users className="mr-3 text-green-400" />
                      Online-Only Alerts
                    </h3>
                    <p className="text-blue-200 leading-relaxed">
                      Unlike traditional emergency systems, Emergencize only sends alerts to 
                      users who are actively online. This ensures real-time response capability 
                      and prevents alert fatigue from offline notifications.
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* Technical Stack */}
              <motion.section
                className="mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <h3 className="text-3xl font-bold text-white mb-8 text-center">
                  Built With Modern Technology
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {technologies.map((tech, index) => (
                    <motion.div
                      key={index}
                      className="glass-effect rounded-xl p-4 text-center hover:bg-white hover:bg-opacity-10 transition-all"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <motion.div
                        className={`${tech.color} mb-3 flex justify-center`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        {tech.icon}
                      </motion.div>
                      <span className="text-white font-medium text-sm">{tech.name}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              {/* iOS to Web Adaptations */}
              <motion.section
                className="mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.6 }}
              >
                <h3 className="text-3xl font-bold text-white mb-8 text-center">
                  iPhone → Web Adaptations
                </h3>
                
                <div className="space-y-4">
                  {adaptations.map((adaptation, index) => (
                    <motion.div
                      key={index}
                      className="glass-effect rounded-xl p-6 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-red-400">
                          {adaptation.icon}
                        </div>
                        <div>
                          <span className="text-gray-300 line-through">{adaptation.from}</span>
                          <ArrowLeft className="w-4 h-4 text-blue-400 mx-2 inline rotate-180" />
                          <span className="text-white font-medium">{adaptation.to}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              {/* Key Features */}
              <motion.section
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2 }}
              >
                <h3 className="text-3xl font-bold text-white mb-8">
                  Emergency Features That Matter
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <motion.div
                    className="glass-effect rounded-2xl p-6"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart size={32} className="text-blue-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-white mb-2">Help Alerts</h4>
                    <p className="text-blue-200">Non-critical assistance requests with gentle notifications</p>
                  </motion.div>

                  <motion.div
                    className="glass-effect rounded-2xl p-6"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AlertTriangle size={32} className="text-red-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-white mb-2">Danger Alerts</h4>
                    <p className="text-blue-200">Critical emergency signals with urgent visual effects</p>
                  </motion.div>

                  <motion.div
                    className="glass-effect rounded-2xl p-6"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Globe size={32} className="text-green-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-white mb-2">Location Sharing</h4>
                    <p className="text-blue-200">Automatic GPS coordinates with every emergency alert</p>
                  </motion.div>
                </div>
              </motion.section>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  )
}