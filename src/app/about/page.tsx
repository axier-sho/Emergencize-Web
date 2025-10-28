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
  const { user, logout } = useAuth()

  useEffect(() => {
    setShowContent(true)
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
      {/* Navigation */}
      <motion.nav
        className="relative z-50 flex justify-between items-center p-6 md:px-12 backdrop-blur-xl bg-slate-900/40 border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link href="/">
          <motion.button
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </motion.button>
        </Link>

        <div className="flex items-center space-x-4">
          <motion.a
            href="https://github.com/axier-sho"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center space-x-2 text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
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
                  setAuthModalOpen(true)
                }}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/10 rounded-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Sign In</span>
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setAuthMode('signup')
                  setAuthModalOpen(true)
                }}
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus size={16} className="inline mr-2" />
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

      {/* Main Content */}
      <AnimatePresence>
        {showContent && (
          <div className="relative z-10 container mx-auto px-6 py-16">
            {/* Hero Section */}
            <motion.div
              className="max-w-4xl mx-auto text-center mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl overflow-hidden"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <Image
                  src="/icon-1280x1280.PNG"
                  alt="Emergencize"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  priority
                />
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                About Emergencize
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                A modern, real-time emergency alert system built with cutting-edge web technologies. 
                Designed to keep you connected with your emergency contacts when it matters most.
              </p>
            </motion.div>

            {/* Mission Statement */}
            <motion.div
              className="modern-card max-w-4xl mx-auto mb-16 p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Heart className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">Our Mission</h2>
                  <p className="text-slate-300 leading-relaxed">
                    Emergencize was created to provide a reliable, fast, and accessible way to alert 
                    your emergency contacts during critical situations. We believe everyone deserves a 
                    safety network that works instantly, regardless of device or location.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white text-center mb-12">Key Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="modern-card p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Technology Stack */}
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-white text-center mb-12">Built With Modern Technology</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {technologies.map((tech, index) => (
                  <motion.div
                    key={index}
                    className="modern-card p-6 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tech.gradient} mb-3`}>
                      {tech.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-white">{tech.name}</h3>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Alert Types */}
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <h2 className="text-3xl font-bold text-white text-center mb-12">Two Alert Types</h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <motion.div
                  className="modern-card p-8 border-l-4 border-blue-500"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <Heart className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">HELP</h3>
                  </div>
                  <p className="text-slate-300 mb-4">
                    For non-critical situations requiring assistance. One tap sends instant notifications 
                    to your online contacts.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-blue-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Instant activation
                    </div>
                    <div className="flex items-center text-sm text-blue-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Online contacts only
                    </div>
                    <div className="flex items-center text-sm text-blue-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      GPS location included
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="modern-card p-8 border-l-4 border-red-500"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">DANGER</h3>
                  </div>
                  <p className="text-slate-300 mb-4">
                    For life-threatening emergencies. Hold for 3 seconds to alert ALL contacts with 
                    maximum priority.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-red-400">
                      <Lock className="w-4 h-4 mr-2" />
                      3-second hold required
                    </div>
                    <div className="flex items-center text-sm text-red-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      All contacts notified
                    </div>
                    <div className="flex items-center text-sm text-red-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Priority delivery
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Developer */}
            <motion.div
              className="modern-card max-w-2xl mx-auto p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <p className="text-slate-400 mb-3">Developed with passion by</p>
              <motion.a
                href="https://github.com/axier-sho"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 text-2xl font-bold text-white hover:text-blue-400 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <span>Sho𓆑</span>
                <Github size={24} />
              </motion.a>
              <p className="text-slate-400 mt-4">
                Open source project dedicated to making emergency response accessible to everyone.
              </p>
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
