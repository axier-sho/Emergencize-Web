'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Shield, Users, Zap, Github, Info, ArrowRight, LogIn, UserPlus, CheckCircle, MapPin, Sparkles } from 'lucide-react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { useClient } from '@/hooks/useClient'

export default function LandingPage() {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [lockAuthMode, setLockAuthMode] = useState(false)
  const isClient = useClient()
  const { user, logout } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Alerts",
      description: "Real-time emergency notifications delivered in milliseconds",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Smart Contacts",
      description: "Intelligent contact management with online presence tracking",
      color: "from-blue-400 to-indigo-500"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Location Sharing",
      description: "Automatic GPS coordinates with every emergency alert",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Enterprise-grade security with end-to-end encryption",
      color: "from-purple-400 to-pink-500"
    }
  ]

  return (
    <div className="min-h-screen relative">
      {/* Navigation */}
      <motion.nav
        className="relative z-50 flex justify-between items-center p-6 md:px-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg glow-blue">
            <img src="/icon-1280x1280.PNG" alt="Emergencize" className="w-full h-full object-cover" />
          </div>
          <span className="text-white text-2xl font-bold">Emergencize</span>
        </motion.div>

        <div className="flex items-center space-x-4">
          <Link href="/about">
            <motion.button
              className="hidden md:flex items-center space-x-2 text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Info size={18} />
              <span>About</span>
            </motion.button>
          </Link>
          
          <motion.a
            href="https://github.com/axier-sho"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center space-x-2 text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Github size={18} />
            <span>GitHub</span>
          </motion.a>

          {!user ? (
            <>
              <motion.button
                onClick={() => {
                  setAuthMode('login')
                  setLockAuthMode(false)
                  setAuthModalOpen(true)
                }}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/10 rounded-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Sign In</span>
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setAuthMode('signup')
                  setLockAuthMode(true)
                  setAuthModalOpen(true)
                }}
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus size={18} className="inline mr-2" />
                <span>Get Started</span>
              </motion.button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dashboard
                </motion.button>
              </Link>
              <motion.button
                onClick={logout}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
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
          <div className="relative z-10">
            {/* Main Hero */}
            <div className="container mx-auto px-6 pt-20 pb-32">
              <div className="max-w-5xl mx-auto text-center">
                {/* Badge */}
                <motion.div
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">Next-Gen Emergency Response System</span>
                </motion.div>

                {/* Main Title */}
                <motion.h1
                  className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Emergency Alerts,
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Instant Response
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Real-time emergency alert system with GPS tracking, contact management, and intelligent notifications. Your safety network, always ready.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <motion.button
                    onClick={() => {
                      if (user) {
                        router.push('/dashboard')
                      } else {
                        setAuthMode('signup')
                        setLockAuthMode(true)
                        setAuthModalOpen(true)
                      }
                    }}
                    className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-2xl transition-all transform hover:-translate-y-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex items-center justify-center">
                      Start Protecting Yourself
                      <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>

                  <Link href="/about">
                    <motion.button
                      className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-semibold text-lg transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Learn More
                    </motion.button>
                  </Link>
                </motion.div>
              </div>

              {/* Features Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="modern-card group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                    whileHover={{ y: -8 }}
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Emergency Types Section */}
              <motion.div
                className="mt-32 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <h2 className="text-4xl font-bold text-white text-center mb-12">
                  Two Alert Types for Every Situation
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    className="modern-card border-l-4 border-blue-500"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">HELP</h3>
                    </div>
                    <p className="text-slate-300 mb-4">
                      Non-critical assistance requests sent instantly to online contacts. Perfect for urgent but non-life-threatening situations.
                    </p>
                    <div className="flex items-center text-sm text-blue-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Instant one-tap activation
                    </div>
                  </motion.div>

                  <motion.div
                    className="modern-card border-l-4 border-red-500"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-red-500/20 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">DANGER</h3>
                    </div>
                    <p className="text-slate-300 mb-4">
                      Critical emergency alerts sent to all contacts with 3-second hold protection to prevent accidental activation.
                    </p>
                    <div className="flex items-center text-sm text-red-400">
                      <Shield className="w-4 h-4 mr-2" />
                      Protected activation (3s hold)
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Developer Credit */}
              <motion.div
                className="text-center mt-32"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
              >
                <p className="text-slate-400 text-sm mb-2">Built with passion by</p>
                <motion.a
                  href="https://github.com/axier-sho"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-white text-lg font-semibold hover:text-blue-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <span>Sho𓆑</span>
                  <Github size={20} />
                </motion.a>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        lockMode={lockAuthMode}
      />
    </div>
  )
}
