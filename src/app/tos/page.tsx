'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function TermsOfServicePage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: `By accessing and using Emergencize, you accept and agree to be bound by these Terms of Service. 
      If you do not agree to these terms, please do not use this service. We reserve the right to update these 
      terms at any time, and continued use of the service constitutes acceptance of any changes.`
    },
    {
      title: "2. Emergency Use Disclaimer",
      content: `Emergencize is designed as a supplementary emergency alert system and should NOT be used as a 
      replacement for official emergency services (911, local emergency numbers). In case of a genuine emergency, 
      always contact local emergency services first. We cannot guarantee message delivery or response times, and 
      are not responsible for any consequences resulting from system failures, delays, or unavailability.`
    },
    {
      title: "3. User Responsibilities",
      content: `You are responsible for: (a) maintaining the security of your account credentials, (b) all activities 
      that occur under your account, (c) ensuring the accuracy of your emergency contact information, (d) using the 
      service appropriately and not sending false or misleading alerts, and (e) complying with all applicable laws 
      and regulations in your jurisdiction.`
    },
    {
      title: "4. Data Privacy & Security",
      content: `We take your privacy seriously. Location data is only shared when you send an alert and is not stored 
      permanently. Your emergency contacts and alert history are stored securely using Firebase with industry-standard 
      encryption. We do not sell your data to third parties. For detailed information, please review our Privacy Policy. 
      You have the right to request data deletion at any time.`
    },
    {
      title: "5. Service Availability",
      content: `While we strive to maintain 99.9% uptime, we cannot guarantee uninterrupted service availability. 
      The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control 
      (network outages, server issues, natural disasters). We are not liable for any damages resulting from service 
      interruptions. Offline functionality is provided on a best-effort basis.`
    },
    {
      title: "6. Acceptable Use Policy",
      content: `You agree not to: (a) send false emergency alerts, (b) abuse or spam the alert system, (c) harass or 
      threaten other users, (d) attempt to gain unauthorized access to the system, (e) use automated tools to scrape 
      or abuse the service, (f) violate any laws or regulations, or (g) impersonate others. Violation of these policies 
      may result in immediate account termination.`
    },
    {
      title: "7. Limitation of Liability",
      content: `Emergencize is provided "as is" without warranties of any kind. To the fullest extent permitted by law, 
      we disclaim all liability for: (a) any direct, indirect, incidental, or consequential damages, (b) loss of data 
      or privacy breaches, (c) personal injury or death resulting from use of the service, (d) failure to deliver alerts, 
      or (e) any other damages arising from use or inability to use the service. Your use of the service is at your own risk.`
    },
    {
      title: "8. Contact Information Accuracy",
      content: `You are solely responsible for ensuring your emergency contacts are accurate, up-to-date, and have 
      consented to receive emergency alerts from you. We are not responsible for alerts sent to incorrect or outdated 
      contacts. Regularly review and update your emergency contact list to ensure its accuracy.`
    },
    {
      title: "9. Account Termination",
      content: `We reserve the right to suspend or terminate your account at any time for violations of these terms, 
      suspicious activity, or any other reason at our sole discretion. You may delete your account at any time through 
      your account settings. Upon termination, your data will be deleted within 30 days, except as required by law or 
      for legitimate business purposes.`
    },
    {
      title: "10. Changes to Service",
      content: `We reserve the right to modify, suspend, or discontinue any aspect of the service at any time without 
      prior notice. We may also impose limits on certain features or restrict access to parts of the service. We are 
      not liable for any modifications, suspensions, or discontinuations of the service.`
    },
    {
      title: "11. Third-Party Services",
      content: `Emergencize integrates with third-party services (Firebase, mapping services, etc.). We are not 
      responsible for the availability, accuracy, or functionality of these third-party services. Your use of 
      third-party services is subject to their respective terms of service and privacy policies.`
    },
    {
      title: "12. Governing Law",
      content: `These Terms of Service are governed by and construed in accordance with applicable laws. Any disputes 
      arising from these terms or use of the service will be resolved through binding arbitration, except where 
      prohibited by law. You waive your right to participate in class action lawsuits.`
    }
  ]

  const slugify = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const toc = useMemo(() => sections.map((s) => ({ id: slugify(s.title), title: s.title })), [sections])
  const [activeId, setActiveId] = useState<string>(toc[0]?.id || '')

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('[data-tos-section="true"]')) as HTMLElement[]
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).id
          if (id && id !== activeId) {
            setActiveId(id)
            if (history.replaceState) {
              history.replaceState(null, '', `#${id}`)
            }
          }
        }
      },
      { rootMargin: '0px 0px -65% 0px', threshold: [0] }
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [activeId])

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
      <div className="mx-auto px-6 py-16 max-w-6xl">
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

        {/* TOC + Terms Sections */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* TOC */}
          <aside className="md:col-span-3">
            <div className="modern-card p-4 md:sticky md:top-28">
              <h3 className="text-white font-semibold mb-3">Contents</h3>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      const el = document.getElementById(item.id)
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className={`block px-3 py-2 rounded-lg transition-colors border border-transparent ${
                      activeId === item.id ? 'text-blue-400 bg-white/5 border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Sections */}
          <div className="md:col-span-9">
            {sections.map((section, index) => {
              const id = slugify(section.title)
              return (
                <motion.section
                  id={id}
                  data-tos-section="true"
                  key={id}
                  className="scroll-mt-28 py-6 border-b border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                >
                  <h2 className="text-xl font-bold text-white mb-2">{section.title}</h2>
                  <p className="text-slate-300 leading-relaxed">
                    {section.content}
                  </p>
                </motion.section>
              )
            })}
          </div>
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

        {/* Footer Links */}
        <motion.div
          className="text-center mt-8 pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <p className="text-slate-600 text-xs mb-4">© 2024 Emergencize. Open Source Emergency Response System.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/tos" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Terms of Service
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/privacy-policy" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Privacy Policy
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
