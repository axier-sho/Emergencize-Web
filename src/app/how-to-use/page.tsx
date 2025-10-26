'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { 
  ArrowLeft,
  UserPlus,
  Users,
  AlertTriangle,
  Heart,
  MapPin,
  Bell,
  Smartphone,
  CheckCircle,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function HowToUsePage() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      title: "Sign Up & Create Account",
      icon: <UserPlus className="w-8 h-8" />,
      gradient: "from-blue-500 to-indigo-500",
      description: "Create your emergency alert account in seconds",
      details: [
        "Click 'Get Started' on the home page",
        "Enter your email and create a secure password",
        "Verify your email address",
        "Complete your profile with emergency contact information"
      ]
    },
    {
      title: "Add Emergency Contacts",
      icon: <Users className="w-8 h-8" />,
      gradient: "from-purple-500 to-pink-500",
      description: "Build your safety network by adding trusted contacts",
      details: [
        "Go to your dashboard and click 'Add Contact'",
        "Enter the email address of your emergency contact",
        "Send them a friend request",
        "Wait for them to accept (they'll need an Emergencize account)",
        "Add nicknames and relationship tags for easy identification"
      ]
    },
    {
      title: "Enable Location Services",
      icon: <MapPin className="w-8 h-8" />,
      gradient: "from-green-500 to-emerald-500",
      description: "Allow GPS access for automatic location sharing",
      details: [
        "Click 'Allow' when prompted for location permissions",
        "Your location is only shared when you send an alert",
        "Location data is never stored permanently",
        "You can revoke access anytime in browser settings"
      ]
    },
    {
      title: "Test Your Alerts",
      icon: <Bell className="w-8 h-8" />,
      gradient: "from-yellow-500 to-orange-500",
      description: "Make sure everything works before an emergency",
      details: [
        "Send a test HELP alert to your contacts",
        "Verify they receive the notification",
        "Check that your location appears correctly",
        "Practice the 3-second hold for DANGER alerts"
      ]
    },
    {
      title: "Understand Alert Types",
      icon: <AlertTriangle className="w-8 h-8" />,
      gradient: "from-red-500 to-rose-500",
      description: "Know when to use HELP vs DANGER",
      details: [
        "HELP: Non-critical assistance (flat tire, lost, need pickup)",
        "HELP alerts go to online contacts only",
        "DANGER: Life-threatening emergencies (medical, assault, accident)",
        "DANGER alerts reach ALL contacts with highest priority",
        "DANGER requires 3-second hold to prevent accidents"
      ]
    },
    {
      title: "Stay Connected",
      icon: <Smartphone className="w-8 h-8" />,
      gradient: "from-cyan-500 to-blue-500",
      description: "Keep the app accessible for emergencies",
      details: [
        "Add Emergencize to your home screen",
        "Enable push notifications for instant alerts",
        "Keep your emergency contacts updated",
        "Test your connection regularly",
        "Review your alert history in notifications"
      ]
    }
  ]

  return (
    <div className="min-h-screen relative">
      {/* Header */}
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

        <Link href="/dashboard">
          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Dashboard
          </motion.button>
        </Link>
      </motion.nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        {/* Hero */}
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            How to Use Emergencize
          </h1>
          <p className="text-xl text-slate-300">
            Follow these simple steps to set up your emergency alert system and keep your loved ones informed.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`modern-card p-8 cursor-pointer transition-all ${
                  activeStep === index ? 'ring-2 ring-blue-500' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${step.gradient} shrink-0`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-white">{step.title}</h3>
                      <span className="text-3xl font-bold text-slate-600">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-4">{step.description}</p>
                    
                    {activeStep === index && (
                      <motion.ul
                        className="space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {step.details.map((detail, idx) => (
                          <motion.li
                            key={idx}
                            className="flex items-start space-x-2 text-sm text-slate-400"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <motion.div
          className="max-w-4xl mx-auto mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Quick Tips</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="modern-card p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Heart className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">HELP Button</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Use for non-life-threatening situations like car trouble, getting lost, or needing a ride. 
                One tap instantly alerts online contacts.
              </p>
            </div>

            <div className="modern-card p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">DANGER Button</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Reserved for genuine emergencies like medical crises, accidents, or immediate danger. 
                Hold for 3 seconds to alert ALL contacts.
              </p>
            </div>

            <div className="modern-card p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Location Sharing</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Your GPS location is automatically included with every alert. Contacts can see exactly 
                where you are and how to reach you.
              </p>
            </div>

            <div className="modern-card p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Always Available</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Add Emergencize to your home screen for instant access. Works offline and queues alerts 
                when connection is restored.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Link href="/dashboard">
            <motion.button
              className="btn-primary px-8 py-4 text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center">
                Get Started Now
                <ChevronRight size={20} className="ml-2" />
              </span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
