'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Shield, Users, Zap, Github, Info, ArrowRight, LogIn, UserPlus, CheckCircle, MapPin, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { useClient } from '@/hooks/useClient'

export default function LandingPage() {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const isClient = useClient()
  const { user, logout } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Scroll detection for nav expansion
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
      {/* SVG Pattern Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <pattern id="plus-pattern" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            {/* Horizontal bar of plus */}
            <rect x="2" y="2.5" width="2" height="1" fill="rgba(148, 163, 184, 0.15)" />
            {/* Vertical bar of plus */}
            <rect x="2.5" y="2" width="1" height="2" fill="rgba(148, 163, 184, 0.15)" />
          </pattern>
        </defs>
      </svg>

      {/* Upscayl-style Floating Navigation - Compact on scroll */}
      <div className={`fixed left-0 right-0 z-50 flex justify-center transition-all duration-500 ${
        isScrolled ? 'top-6 px-6' : 'top-0 px-0'
      }`}>
        <motion.nav
          className={`w-full backdrop-blur-xl shadow-2xl transition-all duration-500 relative overflow-hidden ${
            isScrolled 
              ? 'max-w-6xl rounded-full bg-white/[0.005] border border-white/[0.15]' 
              : 'max-w-full rounded-none bg-transparent border border-transparent'
          }`}
          style={{
            backgroundImage: 'url(#plus-pattern)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Plus pattern overlay - only show when scrolled */}
          {isScrolled && (
            <div 
              className="absolute inset-0 opacity-100"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect x=\'2\' y=\'2.5\' width=\'2\' height=\'1\' fill=\'rgba(148, 163, 184, 0.15)\'/%3E%3Crect x=\'2.5\' y=\'2\' width=\'1\' height=\'2\' fill=\'rgba(148, 163, 184, 0.15)\'/%3E%3C/svg%3E")',
                backgroundSize: '6px 6px',
                backgroundRepeat: 'repeat',
                pointerEvents: 'none'
              }}
            />
          )}
          <div className={`flex justify-between items-center transition-all duration-500 relative z-10 bg-white/[0] ${
            isScrolled ? 'px-8 py-4' : 'px-8 md:px-16 lg:px-24 py-3'
          }`}>
        <Link href="/">
          <motion.div
            className="flex items-center space-x-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/icon-1280x1280.PNG"
                alt="Emergencize"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Emergencize</span>
          </motion.div>
        </Link>

        <div className="flex items-center space-x-2">
          <Link href="/about">
            <motion.button
              className="hidden md:flex items-center text-slate-300 hover:text-white transition-all px-5 py-2.5 rounded-full hover:bg-white/[0.08]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-sm font-medium">About</span>
            </motion.button>
          </Link>

          <Link href="/doc">
            <motion.button
              className="hidden md:flex items-center text-slate-300 hover:text-white transition-all px-5 py-2.5 rounded-full hover:bg-white/[0.08]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-sm font-medium">Documentation</span>
            </motion.button>
          </Link>
          
          <motion.a
            href="https://github.com/axier-sho"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center text-slate-300 hover:text-white transition-all px-5 py-2.5 rounded-full hover:bg-white/5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Github size={16} className="mr-2" />
            <span className="text-sm font-medium">GitHub</span>
          </motion.a>

          {!user ? (
            <>
              <motion.button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center space-x-2 px-5 py-2.5 text-white hover:bg-white/[0.12] rounded-full transition-all text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <span className="hidden sm:inline">Sign In</span>
                <LogIn size={16} className="sm:hidden" />
              </motion.button>
              
              <motion.button
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <span>Get Started</span>
              </motion.button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/dashboard">
                <motion.button
                  className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  Dashboard
                </motion.button>
              </Link>
              <motion.button
                onClick={logout}
                className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-white/[0.12] rounded-full transition-all text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Logout
              </motion.button>
            </div>
          )}
        </div>
          </div>
        </motion.nav>
      </div>

      {/* Hero Section */}
      <AnimatePresence>
        {showContent && (
          <div className="relative z-10">
            {/* Upscayl-style Hero Section - More spacing, larger text */}
            <div className="container mx-auto px-6 pt-40 pb-40">
              <div className="max-w-6xl mx-auto text-center">
                {/* Minimal Badge */}
                <motion.div
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.15] mb-12 backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-slate-300 text-sm font-medium">Real-Time Emergency Response</span>
                </motion.div>

                {/* Large Upscayl-style Title */}
                <motion.h1
                  className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-8 leading-[1.1] tracking-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  From Emergency
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    to Safety
                  </span>
                </motion.h1>

                {/* Clean Subtitle */}
                <motion.p
                  className="text-xl md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed font-light"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  Instant alerts to your emergency contacts with GPS location. Always connected, always protected.
                </motion.p>

                {/* Upscayl-style CTA Buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-5 justify-center mb-24"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <motion.button
                    onClick={() => {
                      if (user) {
                        router.push('/dashboard')
                      } else {
                        setAuthModalOpen(true)
                      }
                    }}
                    className="group px-10 py-5 bg-white text-black rounded-full font-semibold text-base shadow-2xl transition-all"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="flex items-center justify-center">
                      Get Started
                      <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>

                  <Link href="/about">
                    <motion.button
                      className="px-10 py-5 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-sm border border-white/[0.15] hover:border-white/[0.25] text-white rounded-full font-semibold text-base transition-all"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      Learn More
                    </motion.button>
                  </Link>
                </motion.div>
              </div>

              {/* Upscayl-style Features Grid - Cleaner cards with more spacing */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="group cursor-pointer backdrop-blur-sm bg-white/[0.05] border border-white/[0.12] rounded-3xl p-8 transition-all duration-500 hover:bg-white/[0.08] hover:border-white/[0.2]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    whileHover={{ y: -6 }}
                  >
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 opacity-90 group-hover:opacity-100 transition-all group-hover:scale-105`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-200 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Upscayl-style Alert Types Section */}
              <motion.div
                className="mt-40 max-w-5xl mx-auto"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
              >
                <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-20 leading-tight">
                  Two Alert Types for
                  <br />
                  <span className="text-slate-400">Every Situation</span>
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <motion.div
                    className="backdrop-blur-sm bg-white/[0.05] border border-white/[0.12] rounded-3xl p-10 transition-all duration-500 hover:bg-white/[0.08] hover:border-blue-500/40"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Users className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-3xl font-bold text-white">HELP</h3>
                    </div>
                    <p className="text-slate-400 mb-6 leading-relaxed">
                      Non-critical assistance requests sent instantly to online contacts. Perfect for urgent but non-life-threatening situations.
                    </p>
                    <div className="flex items-center text-sm text-blue-400 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Instant one-tap activation
                    </div>
                  </motion.div>

                  <motion.div
                    className="backdrop-blur-sm bg-white/[0.05] border border-white/[0.12] rounded-3xl p-10 transition-all duration-500 hover:bg-white/[0.08] hover:border-red-500/40"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                      </div>
                      <h3 className="text-3xl font-bold text-white">DANGER</h3>
                    </div>
                    <p className="text-slate-400 mb-6 leading-relaxed">
                      Critical emergency alerts sent to all contacts with 3-second hold protection to prevent accidental activation.
                    </p>
                    <div className="flex items-center text-sm text-red-400 font-medium">
                      <Shield className="w-5 h-5 mr-2" />
                      Protected activation (3s hold)
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Upscayl-style Footer */}
              <motion.div
                className="text-center mt-40 pb-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.3 }}
              >
                <div className="max-w-2xl mx-auto">
                  <p className="text-slate-500 text-sm mb-4 font-medium">Built with passion by</p>
                  <motion.a
                    href="https://github.com/axier-sho"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 text-white text-2xl font-bold hover:text-blue-400 transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span>Sho𓆑</span>
                    <Github size={24} />
                  </motion.a>
                  <p className="text-slate-600 text-xs mt-6">© 2024 Emergencize. Open Source Emergency Response System.</p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  )
}
