'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "1. Introduction",
      content: `This Privacy Policy explains how Emergencize ("we," "us," or "our") collects, uses, discloses, and protects your personal information when you use our emergency alert platform. We are committed to protecting your privacy and handling your data with care, especially given the sensitive nature of emergency-related information.`
    },
    {
      title: "2. Information We Collect",
      content: `We collect several types of information: (a) Account Information: When you create an account, we collect your name, email address, and authentication details through Google Sign-In. (b) Location Data: When you send an emergency alert, we collect and share your real-time location with your designated emergency contacts. This data is only collected during active alerts. (c) Emergency Contacts: Names and contact information of people you designate to receive your emergency alerts. (d) Usage Data: Information about how you use the service, including alert history, feature usage, and interaction patterns. (e) Device Information: Device type, browser, operating system, and unique device identifiers. (f) Communications: Messages and interactions within the platform.`
    },
    {
      title: "3. How We Use Your Information",
      content: `We use your information to: (a) Provide and maintain emergency alert services, (b) Send emergency notifications to your designated contacts, (c) Improve service functionality and user experience, (d) Ensure platform security and prevent abuse, (e) Comply with legal obligations and respond to lawful requests, (f) Communicate with you about service updates and important notices, (g) Analyze usage patterns to enhance features and reliability. We do not use your data for advertising purposes or sell it to third parties.`
    },
    {
      title: "4. Location Data Handling",
      content: `Location data is collected ONLY when you actively send an emergency alert. We share your location with your emergency contacts in real-time during an alert. Location data is not continuously tracked or stored permanently. Historical alert locations may be retained for a limited period for service functionality and your reference, but are automatically deleted according to our retention policies. You have full control over when location data is shared.`
    },
    {
      title: "5. Data Sharing and Disclosure",
      content: `We share your information only in these circumstances: (a) Emergency Contacts: Your location and alert details are shared with your designated emergency contacts when you trigger an alert. (b) Service Providers: We use Firebase and other trusted third-party services to operate our platform. These providers are bound by confidentiality agreements. (c) Legal Requirements: We may disclose information when required by law, court order, or governmental request. (d) Safety and Security: We may share information to prevent harm, investigate abuse, or protect rights and safety. (e) Business Transfers: In the event of a merger or acquisition, your data may be transferred to the successor entity. We do NOT sell your personal information to advertisers or third parties.`
    },
    {
      title: "6. Data Security",
      content: `We implement industry-standard security measures to protect your data: (a) End-to-end encryption for sensitive communications, (b) Secure data storage using Firebase with encryption at rest, (c) Regular security audits and updates, (d) Access controls limiting who can access your data, (e) Secure authentication through Google OAuth. However, no method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security. You are responsible for maintaining the security of your account credentials.`
    },
    {
      title: "7. Data Retention",
      content: `We retain your data for different periods: (a) Account Information: Retained while your account is active and for a reasonable period after deletion for backup and legal purposes. (b) Alert History: Stored for 90 days unless you request earlier deletion. (c) Location Data: Real-time location is not stored permanently; historical locations from alerts are deleted after 90 days. (d) Communications: Retained according to service functionality requirements. You can request deletion of your data at any time through your account settings or by contacting us.`
    },
    {
      title: "8. Your Privacy Rights",
      content: `You have the following rights: (a) Access: Request a copy of your personal data. (b) Correction: Update or correct inaccurate information. (c) Deletion: Request deletion of your account and associated data. (d) Portability: Request your data in a portable format. (e) Opt-Out: Control certain data collection and sharing preferences. (f) Withdraw Consent: Withdraw consent for data processing where applicable. To exercise these rights, access your account settings or contact us directly. We will respond to requests within a reasonable timeframe and as required by applicable law.`
    },
    {
      title: "9. Children's Privacy",
      content: `Emergencize is not intended for users under 13 years of age (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately, and we will take steps to delete such information.`
    },
    {
      title: "10. International Data Transfers",
      content: `Your data may be transferred to and processed in countries other than your country of residence, including the United States and Japan. These countries may have different data protection laws. We ensure appropriate safeguards are in place through standard contractual clauses or other approved mechanisms to protect your data during international transfers.`
    },
    {
      title: "11. Cookies and Tracking",
      content: `We use cookies and similar technologies to: (a) Maintain your session and authentication status, (b) Remember your preferences and settings, (c) Analyze usage patterns and improve functionality, (d) Ensure security and prevent fraud. You can control cookies through your browser settings, but disabling certain cookies may limit platform functionality. We do not use cookies for advertising or third-party tracking.`
    },
    {
      title: "12. Third-Party Services",
      content: `Our platform integrates with third-party services including: (a) Firebase (Google): For authentication, database, and hosting. (b) Google Maps: For location display and mapping. (c) Google OAuth: For secure sign-in. These services have their own privacy policies. We recommend reviewing their policies to understand how they handle your data. We are not responsible for the privacy practices of third-party services.`
    },
    {
      title: "13. Changes to Privacy Policy",
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes by posting a notice on the platform or sending you an email. The "Last Updated" date at the top indicates when changes were made. Your continued use of the service after changes constitutes acceptance of the updated policy.`
    },
    {
      title: "14. Contact and Data Protection Officer",
      content: `If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us through our GitHub repository or the contact methods provided on the platform. For EU/EEA users with data protection concerns, you have the right to lodge a complaint with your local supervisory authority.`
    },
    {
      title: "15. California Privacy Rights",
      content: `California residents have additional rights under the CCPA: (a) Right to know what personal information is collected and how it's used, (b) Right to delete personal information, (c) Right to opt-out of sale of personal information (note: we do not sell personal information), (d) Right to non-discrimination for exercising privacy rights. To exercise these rights, contact us using the methods provided in this policy.`
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
    const targets = Array.from(document.querySelectorAll('[data-privacy-section="true"]')) as HTMLElement[]
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
          <div className="inline-flex p-4 bg-green-500/20 rounded-2xl mb-6">
            <Shield className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-300">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          className="modern-card p-6 mb-8 border-l-4 border-green-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-green-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Your Privacy Matters</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                We are committed to protecting your privacy and handling your emergency-related data with the utmost care and security. Your location is only shared when you actively trigger an alert, and we never sell your personal information to third parties.
              </p>
            </div>
          </div>
        </motion.div>

        {/* TOC + Privacy Sections */}
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
                      activeId === item.id ? 'text-green-400 bg-white/5 border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
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
                  data-privacy-section="true"
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
          <h3 className="text-2xl font-bold text-white mb-3">Questions About Your Privacy?</h3>
          <p className="text-slate-300 mb-6">
            If you have any questions or concerns about our Privacy Policy or how we handle your data, please contact us.
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
            By using Emergencize, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
