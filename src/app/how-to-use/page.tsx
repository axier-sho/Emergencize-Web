'use client'

import { motion } from 'framer-motion'
import { 
  UserPlus, 
  AlertTriangle, 
  Heart, 
  Users, 
  Smartphone,
  MapPin,
  Bell,
  Shield,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function HowToUsePage() {
  const steps = [
    {
      icon: <UserPlus size={32} />,
      title: "Create Your Account",
      description: "Sign up with your email to create your emergency alert account.",
      details: ["Enter your email and password", "Verify your account", "Complete your profile"]
    },
    {
      icon: <Users size={32} />,
      title: "Add Emergency Contacts",
      description: "Send friend requests to people you want as emergency contacts.",
      details: ["Click 'Send Friend Request' button", "Enter their email address", "They'll receive a notification to accept"]
    },
    {
      icon: <Bell size={32} />,
      title: "Accept Friend Requests",
      description: "Review and accept incoming friend requests from your contacts.",
      details: ["Check the 'Friend Requests' tab", "Accept, decline, or block requests", "Both become emergency contacts when accepted"]
    },
    {
      icon: <Heart size={32} />,
      title: "Send Help Alerts",
      description: "Use the HELP button for non-urgent assistance requests.",
      details: ["Click the blue HELP button", "Alert sent instantly to online contacts", "Include your location if enabled"]
    },
    {
      icon: <AlertTriangle size={32} />,
      title: "Send Danger Alerts",
      description: "Use the DANGER button for critical emergency situations.",
      details: ["Hold the red DANGER button for 3 seconds", "Confirms before sending critical alert", "All contacts notified immediately"]
    },
    {
      icon: <MapPin size={32} />,
      title: "Location Sharing",
      description: "Your location is automatically included in emergency alerts.",
      details: ["Allow location access when prompted", "GPS coordinates sent with alerts", "Helps contacts find you quickly"]
    }
  ]

  const features = [
    {
      icon: <Smartphone size={24} />,
      title: "Mobile Optimized",
      description: "Works perfectly on phones and tablets with touch-friendly buttons."
    },
    {
      icon: <Shield size={24} />,
      title: "Secure & Private",
      description: "Your data is encrypted and only shared with your chosen contacts."
    },
    {
      icon: <Clock size={24} />,
      title: "Real-time Alerts",
      description: "Instant notifications sent only to contacts who are currently online."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800">
      {/* Header */}
      <motion.header
        className="backdrop-blur-sm bg-white bg-opacity-10 border-b border-white border-opacity-20 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">E</span>
              </div>
              <span className="text-white font-semibold">Emergencize</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <motion.button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dashboard
                </motion.button>
              </Link>
              <Link href="/">
                <motion.button
                  className="px-4 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Home
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", stiffness: 200 }}
          >
            <AlertTriangle size={48} className="text-red-500" />
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            How to Use Emergencize
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Learn how to set up your emergency alert system and protect yourself and your loved ones
          </p>
        </motion.div>

        {/* Step-by-Step Guide */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Step-by-Step Setup Guide
          </h2>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="glass-effect rounded-2xl p-8"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="text-2xl font-bold text-blue-300">
                      Step {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-blue-200 text-lg mb-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center text-gray-300">
                          <CheckCircle size={16} className="text-green-400 mr-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <motion.div
                      className="hidden lg:block text-blue-400"
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight size={24} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Key Features */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="glass-effect rounded-xl p-6 text-center hover:bg-white hover:bg-opacity-15 transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
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
          </div>
        </motion.div>

        {/* Emergency Button Guide */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Emergency Button Guide
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              className="glass-effect rounded-2xl p-8"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <Heart size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">HELP Button</h3>
                  <p className="text-blue-200">Non-urgent assistance</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  Single click to activate
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  For non-emergency help requests
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  Sends to all online contacts
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  Includes your location
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              className="glass-effect rounded-2xl p-8"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <AlertTriangle size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">DANGER Button</h3>
                  <p className="text-red-200">Critical emergency</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  Hold for 3 seconds to activate
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  For critical emergencies only
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  Alerts ALL your contacts
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  Prevents accidental activation
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          className="glass-effect rounded-2xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            Pro Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Test Your System</h4>
              <p className="text-gray-300 text-sm">Send test alerts to make sure everything works properly.</p>
            </div>
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Keep Contacts Updated</h4>
              <p className="text-gray-300 text-sm">Regularly review and update your emergency contact list.</p>
            </div>
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Enable Location</h4>
              <p className="text-gray-300 text-sm">Always allow location access for more effective emergency response.</p>
            </div>
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Use Responsibly</h4>
              <p className="text-gray-300 text-sm">Only use the DANGER button for real emergencies.</p>
            </div>
          </div>
          
          <motion.div className="mt-8">
            <Link href="/dashboard">
              <motion.button
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors flex items-center mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Now
                <ArrowRight size={20} className="ml-2" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}