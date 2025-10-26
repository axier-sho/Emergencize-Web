'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Shield, Lock, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function TermsOfServicePage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: <CheckCircle className="w-5 h-5" />,
      content: `By accessing and using Emergencize, you accept and agree to be bound by these Terms of Service. 
      If you do not agree to these terms, please do not use this service. We reserve the right to update these 
      terms at any time, and continued use of the service constitutes acceptance of any changes.`
    },
    {
      title: "2. Emergency Use Disclaimer",
      icon: <AlertTriangle className="w-5 h-5" />,
      content: `Emergencize is designed as a supplementary emergency alert system and should NOT be used as a 
      replacement for official emergency services (911, local emergency numbers). In case of a genuine emergency, 
      always contact local emergency services first. We cannot guarantee message delivery or response times, and 
      are not responsible for any consequences resulting from system failures, delays, or unavailability.`
    },
    {
      title: "3. User Responsibilities",
      icon: <FileText className="w-5 h-5" />,
      content: `You are responsible for: (a) maintaining the security of your account credentials, (b) all activities 
      that occur under your account, (c) ensuring the accuracy of your emergency contact information, (d) using the 
      service appropriately and not sending false or misleading alerts, and (e) complying with all applicable laws 
      and regulations in your jurisdiction.`
    },
    {
      title: "4. Data Privacy & Security",
      icon: <Lock className="w-5 h-5" />,
      content: `We take your privacy seriously. Location data is only shared when you send an alert and is not stored 
      permanently. Your emergency contacts and alert history are stored securely using Firebase with industry-standard 
      encryption. We do not sell your data to third parties. For detailed information, please review our Privacy Policy. 
      You have the right to request data deletion at any time.`
    },
    {
      title: "5. Service Availability",
      icon: <Shield className="w-5 h-5" />,
      content: `While we strive to maintain 99.9% uptime, we cannot guarantee uninterrupted service availability. 
      The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control 
      (network outages, server issues, natural disasters). We are not liable for any damages resulting from service 
      interruptions. Offline functionality is provided on a best-effort basis.`
    },
    {
      title: "6. Acceptable Use Policy",
      icon: <AlertTriangle className="w-5 h-5" />,
      content: `You agree not to: (a) send false emergency alerts, (b) abuse or spam the alert system, (c) harass or 
      threaten other users, (d) attempt to gain unauthorized access to the system, (e) use automated tools to scrape 
      or abuse the service, (f) violate any laws or regulations, or (g) impersonate others. Violation of these policies 
      may result in immediate account termination.`
    },
    {
      title: "7. Limitation of Liability",
      icon: <Shield className="w-5 h-5" />,
      content: `Emergencize is provided "as is" without warranties of any kind. To the fullest extent permitted by law, 
      we disclaim all liability for: (a) any direct, indirect, incidental, or consequential damages, (b) loss of data 
      or privacy breaches, (c) personal injury or death resulting from use of the service, (d) failure to deliver alerts, 
      or (e) any other damages arising from use or inability to use the service. Your use of the service is at your own risk.`
    },
    {
      title: "8. Contact Information Accuracy",
      icon: <FileText className="w-5 h-5" />,
      content: `You are solely responsible for ensuring your emergency contacts are accurate, up-to-date, and have 
      consented to receive emergency alerts from you. We are not responsible for alerts sent to incorrect or outdated 
      contacts. Regularly review and update your emergency contact list to ensure its accuracy.`
    },
    {
      title: "9. Account Termination",
      icon: <Lock className="w-5 h-5" />,
      content: `We reserve the right to suspend or terminate your account at any time for violations of these terms, 
      suspicious activity, or any other reason at our sole discretion. You may delete your account at any time through 
      your account settings. Upon termination, your data will be deleted within 30 days, except as required by law or 
      for legitimate business purposes.`
    },
    {
      title: "10. Changes to Service",
      icon: <Shield className="w-5 h-5" />,
      content: `We reserve the right to modify, suspend, or discontinue any aspect of the service at any time without 
      prior notice. We may also impose limits on certain features or restrict access to parts of the service. We are 
      not liable for any modifications, suspensions, or discontinuations of the service.`
    },
    {
      title: "11. Third-Party Services",
      icon: <FileText className="w-5 h-5" />,
      content: `Emergencize integrates with third-party services (Firebase, mapping services, etc.). We are not 
      responsible for the availability, accuracy, or functionality of these third-party services. Your use of 
      third-party services is subject to their respective terms of service and privacy policies.`
    },
    {
      title: "12. Governing Law",
      icon: <Shield className="w-5 h-5" />,
      content: `These Terms of Service are governed by and construed in accordance with applicable laws. Any disputes 
      arising from these terms or use of the service will be resolved through binding arbitration, except where 
      prohibited by law. You waive your right to participate in class action lawsuits.`
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
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex p-4 bg-blue-500/20 rounded-2xl mb-6">
            <FileText className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-slate-300">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          className="modern-card p-6 mb-8 border-l-4 border-yellow-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Important Notice</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Emergencize is a supplementary alert system and should NOT replace calling 911 or local 
                emergency services in life-threatening situations. Always contact official emergency services 
                first in genuine emergencies.
              </p>
                </div>
                </div>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              className="modern-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
              </div>
              <p className="text-slate-300 leading-relaxed ml-11">
                {section.content}
              </p>
            </motion.div>
          ))}
            </div>

        {/* Contact */}
        <motion.div
          className="modern-card p-8 mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <h3 className="text-2xl font-bold text-white mb-3">Questions About These Terms?</h3>
          <p className="text-slate-300 mb-6">
            If you have any questions or concerns about our Terms of Service, please contact us.
          </p>
          <motion.a
            href="https://github.com/axier-sho"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact Developer
          </motion.a>
        </motion.div>

        {/* Agreement */}
        <motion.div
          className="text-center mt-8 text-slate-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <p>
            By using Emergencize, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
