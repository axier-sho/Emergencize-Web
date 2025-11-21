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
  LogIn,
  UserPlus,
  CheckCircle,
  Layers,
  Lock,
  Wifi
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'

export default function AboutPage() {
  const [showContent, setShowContent] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    setShowContent(true)
  }, [])

  // Scroll detection for nav expansion
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const technologies = [
    { name: "Next.js 15", icon: <Globe className="w-6 h-6" />, gradient: "from-blue-500 to-cyan-500" },
    { name: "TypeScript", icon: <Code className="w-6 h-6" />, gradient: "from-blue-600 to-blue-700" },
    { name: "Framer Motion", icon: <Zap className="w-6 h-6" />, gradient: "from-purple-500 to-pink-500" },
    { name: "Tailwind CSS", icon: <Star className="w-6 h-6" />, gradient: "from-cyan-500 to-teal-500" },
    { name: "Socket.io", icon: <Wifi className="w-6 h-6" />, gradient: "from-green-500 to-emerald-500" },
    { name: "Firebase", icon: <Shield className="w-6 h-6" />, gradient: "from-orange-500 to-red-500" }
  ]

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Communication",
      description: "Socket.io enables instant alert delivery with WebSocket fallback support",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "Multi-layer input sanitization, rate limiting, and security monitoring",
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Contact Management",
      description: "Invite contacts via email with real-time presence tracking",
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Location Services",
      description: "Automatic GPS coordinates with geofencing and safe zones",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Accessibility First",
      description: "WCAG 2.1 AA compliant with screen reader and keyboard support",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Progressive Web App",
      description: "Works offline with service workers and background sync",
      gradient: "from-cyan-500 to-blue-500"
    }
  ]

  return (
    <div className="min-h-screen relative">
      {/* Upscayl-style Floating Navigation - Compact on scroll */}
      <div className={`fixed left-0 right-0 z-50 flex justify-center transition-all duration-500 ${
        isScrolled ? 'top-6 px-6' : 'top-0 px-0'
      }`}>
        <motion.nav
          className={`w-full backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] shadow-2xl transition-all duration-500 ${
            isScrolled ? 'max-w-6xl rounded-full' : 'max-w-full rounded-none border-t-0 border-x-0'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className={`flex justify-between items-center transition-all duration-500 ${
            isScrolled ? 'px-8 py-4' : 'px-8 md:px-16 lg:px-24 py-3'
          }`}>
        <Link href="/">
          <motion.button
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-all px-5 py-2.5 rounded-full hover:bg-white/5 text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </motion.button>
        </Link>

        <div className="flex items-center space-x-2">
          <motion.a
            href="https://github.com/axier-sho"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center text-slate-300 hover:text-white transition-all px-5 py-2.5 rounded-full hover:bg-white/[0.08] text-sm font-medium"
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
                onClick={() => {
                  setAuthMode('login')
                  setAuthModalOpen(true)
                }}
                className="flex items-center space-x-2 px-5 py-2.5 text-white hover:bg-white/[0.12] rounded-full transition-all text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <span className="hidden sm:inline">Sign In</span>
                <LogIn size={16} className="sm:hidden" />
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setAuthMode('signup')
                  setAuthModalOpen(true)
                }}
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

      {/* Main Content */}
      <AnimatePresence>
        {showContent && (
          <div className="relative z-10 container mx-auto px-6 pt-40 pb-20">
            {/* Upscayl-style Hero Section */}
            <motion.div
              className="max-w-5xl mx-auto text-center mb-32"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-10 shadow-2xl overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
              >
                <Image
                  src="/icon-1280x1280.PNG"
                  alt="Emergencize"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  priority
                />
              </motion.div>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
                About Emergencize
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-3xl mx-auto font-light">
                A modern, real-time emergency alert system built with cutting-edge web technologies. 
                Designed to keep you connected when it matters most.
              </p>
            </motion.div>

            {/* Mission Statement */}
            <motion.div
              className="backdrop-blur-sm bg-white/[0.05] border border-white/[0.12] rounded-3xl max-w-5xl mx-auto mb-32 p-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-start space-x-6">
                <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Heart className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Mission</h2>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    Emergencize was created to provide a reliable, fast, and accessible way to alert 
                    your emergency contacts during critical situations. We believe everyone deserves a 
                    safety network that works instantly, regardless of device or location.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              className="mb-32"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-20">Key Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="backdrop-blur-sm bg-white/[0.05] border border-white/[0.12] rounded-3xl p-8 transition-all duration-500 hover:bg-white/[0.08] hover:border-white/[0.2]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -6 }}
                  >
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 opacity-90 hover:opacity-100 transition-opacity`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Technology Stack */}
            <motion.div
              className="mb-32"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-20">Built With Modern Technology</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
                {technologies.map((tech, index) => (
                  <motion.div
                    key={index}
                    className="backdrop-blur-sm bg-white/[0.05] border border-white/[0.12] rounded-3xl p-8 text-center transition-all duration-500 hover:bg-white/[0.08] hover:border-white/[0.2]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                    whileHover={{ y: -6 }}
                  >
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${tech.gradient} mb-4 opacity-90 hover:opacity-100 transition-opacity`}>
                      {tech.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-white">{tech.name}</h3>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Alert Types */}
            <motion.div
              className="mb-32"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-20 leading-tight">
                Two Alert Types for
                <br />
                <span className="text-slate-400">Every Situation</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <motion.div
                  className="backdrop-blur-sm bg-white/[0.05] border border-white/[0.12] rounded-3xl p-10 transition-all duration-500 hover:bg-white/[0.08] hover:border-blue-500/40"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <Heart className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">HELP</h3>
                  </div>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    For non-critical situations requiring assistance. One tap sends instant notifications 
                    to your online contacts.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-blue-400 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Instant activation
                    </div>
                    <div className="flex items-center text-sm text-blue-400 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Online contacts only
                    </div>
                    <div className="flex items-center text-sm text-blue-400 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      GPS location included
                    </div>
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
                    For life-threatening emergencies. Hold for 3 seconds to alert ALL contacts with 
                    maximum priority.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-red-400 font-medium">
                      <Lock className="w-5 h-5 mr-2" />
                      3-second hold required
                    </div>
                    <div className="flex items-center text-sm text-red-400 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      All contacts notified
                    </div>
                    <div className="flex items-center text-sm text-red-400 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Priority delivery
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Developer */}
            <motion.div
              className="text-center mt-40 pb-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              <div className="max-w-2xl mx-auto">
                <p className="text-slate-500 text-sm mb-4 font-medium">Developed with passion by</p>
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
                <p className="text-slate-600 text-sm mt-6 max-w-md mx-auto">
                  Open source project dedicated to making emergency response accessible to everyone.
                </p>
                <p className="text-slate-600 text-xs mt-4">© 2024 Emergencize. All Rights Reserved.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        lockMode={false}
      />
    </div>
  )
}
