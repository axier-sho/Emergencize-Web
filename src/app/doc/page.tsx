'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function DocumentationPage() {
  const sections = [
    {
      title: "Getting Started",
      content: `Welcome to Emergencize! To get started, visit the website and click "Get Started" to create your account. 
      Enter your email address and create a strong password, then click "Sign Up". If you already have an account, 
      click "Sign In" and enter your credentials to access your dashboard.`
    },
    {
      title: "Adding Emergency Contacts",
      content: `Your emergency contacts are the people who will receive your alerts. Go to your Dashboard and click 
      "Contacts" or "Add Contact". Enter your contact's email address and click "Send Request". Your contact needs 
      to have an Emergencize account and must accept your friend request. Once accepted, they'll appear in your 
      contacts list. You can customize contacts by adding nicknames and setting their relationship (Family, Friend, 
      Coworker, etc.).`
    },
    {
      title: "Sending Emergency Alerts",
      content: `Emergencize has two types of emergency buttons: HELP Button (Blue) for non-critical situations like 
      car trouble, lost wallet, or needing a ride - this sends alerts instantly to online contacts only with one tap. 
      DANGER Button (Red) for life-threatening emergencies like medical crises or immediate danger - press and HOLD 
      for 3 seconds to prevent accidental activation, and it sends to ALL contacts (both online and offline). After 
      sending an alert, your contacts receive an instant notification, your GPS coordinates are included (if enabled), 
      you'll see a visual confirmation, and the alert is saved in your notification history.`
    },
    {
      title: "Location Sharing",
      content: `When you first use Emergencize, your browser will ask for location permission - click "Allow" to enable 
      location sharing. Your contacts can see exactly where you are during an emergency, which helps first responders or 
      friends find you quickly. Location is only shared when YOU send an alert and is not tracked or stored when you're 
      not sending alerts. You can revoke permission anytime in browser settings. Look for the location icon on your 
      dashboard: Green means location is enabled, Red or crossed out means location is disabled.`
    },
    {
      title: "Emergency Chat",
      content: `To use the chat feature, click the "Chat" icon on your dashboard or the chat button in the sidebar. 
      Type your message in the text box at the bottom and press Enter or click the send button - messages appear in 
      real-time. All your emergency contacts can see and respond in the group chat, making it perfect for coordinating 
      during emergencies. Use chat to provide updates on your situation, coordinate meeting points or actions, and share 
      additional information beyond the initial alert.`
    },
    {
      title: "Dashboard Overview",
      content: `The dashboard contains several key elements: Emergency Buttons (large blue HELP button and red DANGER 
      button in the center, always visible and easy to access), Online Contacts (see which contacts are currently online 
      with green dots for available contacts and gray dots for offline contacts), Stats Cards (view your alert history, 
      total contacts, and connection status), and Navigation Bar (Home, Dashboard, Notifications, and Settings).`
    },
    {
      title: "Notifications",
      content: `To view your notifications, click the bell icon in the navigation bar or click "Notifications" in the menu. 
      You'll see alerts you've sent, alerts you've received from contacts, friend requests, and system notifications. 
      You can mark alerts as read, view location details, see timestamps, and delete old notifications.`
    },
    {
      title: "Settings & Customization",
      content: `Open Settings by clicking the gear icon or "Settings" button. In Profile Settings, you can update your 
      display name, change email address, update password, and add emergency information like medical conditions and 
      allergies. Notification Settings allow you to enable/disable sound alerts, push notifications, and vibration. 
      Accessibility Settings include high contrast, font size adjustment, screen reader optimization, keyboard navigation, 
      and reduced motion options. Privacy Settings let you control location sharing, online status visibility, and alert history.`
    },
    {
      title: "Connection Status",
      content: `Your dashboard shows your current connection status in three modes: Real-Time Mode (Green) - fully 
      connected to internet and servers with instant notifications and all features available; Standard Mode (Yellow) - 
      connected to internet with some possible delays but all features work and alerts saved to database; Offline Mode (Red) - 
      no internet connection with alerts queued locally that will send when connection returns. In Offline Mode, don't panic - 
      the app still works, alerts are saved locally on your device, they'll automatically send when connection returns, and 
      you should keep the browser tab open if possible.`
    },
    {
      title: "Safe Zones (Geofencing)",
      content: `If your version includes geofencing, you can set up safe zones. Open Geofence Manager in Settings or 
      Dashboard and click "Create Safe Zone". Select zone type (Home, Work, School, etc.), set the location (address or GPS), 
      choose radius (how large the zone is), and enable entry/exit notifications. You'll get notified when you enter or 
      leave a safe zone, and contacts can see if you're in a known safe location.`
    },
    {
      title: "Quick Actions",
      content: `Quick Actions provide fast access to common tasks including: Add Contact (quickly invite someone new), 
      Test Alert (send a test notification), View Location (check your current GPS coordinates), Emergency Info (access 
      emergency numbers), and Settings (jump to settings).`
    },
    {
      title: "Tips for Best Experience",
      content: `Before an emergency: Add at least 3-5 trusted contacts, send test alerts to verify everything works, 
      always keep location services on, add to home screen on mobile, and keep your contact list current. During an 
      emergency: Stay calm and take a breath before sending alert, choose the right button (HELP for assistance, DANGER 
      for critical situations), send the alert following button instructions, use chat to provide updates, and focus on 
      safety after alert is sent. After an emergency: Let contacts know you're safe, check notification history, 
      appreciate those who responded, and adjust settings if needed.`
    },
    {
      title: "Safety & Privacy",
      content: `Your data is protected with encryption for all communications, privacy controls ensuring location is only 
      shared when you send alerts, you control who receives your alerts, and password-protected account security. Best 
      practices: Don't share your password, use a strong unique password, only add people you trust as contacts, review 
      your contacts regularly, and log out on shared devices.`
    },
    {
      title: "Connection Methods",
      content: `Alerts reach your contacts through two methods: Real-Time (Fastest) uses live internet connection for 
      instant delivery when both you and contact are online. Database (Reliable) saves to secure database where contact 
      receives when they log in, working even if they're offline. Emergencize uses both methods for reliability, ensuring 
      alerts always get through with redundancy for critical situations.`
    },
    {
      title: "Frequently Asked Questions",
      content: `Is Emergencize free? Yes, the basic emergency alert features are free for everyone. Do contacts need an 
      account? Yes, your emergency contacts must create an Emergencize account to receive your alerts. Can I use this on 
      my phone? Yes! Emergencize works on any device with a web browser and you can add it to your home screen. What's 
      the difference between HELP and DANGER? HELP is for non-critical situations and sends to online contacts only. 
      DANGER is for life-threatening emergencies and sends to ALL contacts. Can I cancel an alert after sending? Once 
      sent, an alert cannot be cancelled, but you can immediately send a follow-up message via chat to clarify.`
    },
    {
      title: "Mobile Device Tips",
      content: `To add Emergencize to your home screen on iPhone/iPad: Open Emergencize in Safari, tap the Share button, 
      scroll down and tap "Add to Home Screen", then tap "Add". On Android: Open Emergencize in Chrome, tap the menu 
      (3 dots), tap "Add to Home Screen", then tap "Add". Mobile advantages include quick access from home screen, 
      works like a native app, faster loading, offline capabilities, and push notifications.`
    },
    {
      title: "Making the Most of Emergencize",
      content: `Recommended setup includes: Add family, close friends, and coworkers as multiple contacts; test alerts 
      monthly to ensure everything works; keep your profile and contacts current; bookmark on desktop for easy access; 
      create home screen shortcut for quick mobile access. For emergency preparedness: Discuss with contacts how they 
      should respond to alerts, share your emergency plan with trusted contacts, keep important medical information in 
      your profile, know local emergency numbers (911, etc.), and have backup communication methods.`
    },
    {
      title: "Important Reminders",
      content: `DO: Add trusted contacts who can actually help in emergencies, keep location services enabled for accurate 
      alerts, test your alerts regularly, use HELP for non-critical situations, use DANGER only for real emergencies, 
      keep your contact list updated, and enable notifications for instant alerts. DON'T: Share your password with anyone, 
      use DANGER button for non-emergencies, add people you don't trust, ignore location permission requests, forget to 
      test your setup, rely solely on this app (always call 911 for life-threatening emergencies), or send spam alerts 
      to test repeatedly.`
    },
    {
      title: "When to Call Emergency Services",
      content: `Always call 911 (or your local emergency number) first for: Life-threatening medical emergencies, active 
      crimes in progress, fires, serious accidents, or any situation requiring police, fire, or ambulance. Emergencize is 
      a supplement to, not a replacement for, official emergency services. Use Emergencize to alert your personal network 
      while waiting for professional help.`
    },
    {
      title: "Success Checklist",
      content: `Ensure you're fully set up by completing these steps: Create Emergencize account, log in successfully, 
      add at least 3 emergency contacts, have contacts accept friend requests, enable location services, send and receive 
      test alert, explore emergency chat feature, customize settings and preferences, add app to home screen (mobile), 
      enable push notifications, review alert types (HELP vs DANGER), and discuss emergency response with contacts.`
    },
    {
      title: "Accessibility Features",
      content: `Emergencize is designed to be accessible for everyone with built-in accessibility features including: 
      Screen Reader Support (compatible with all major screen readers), Keyboard Navigation (full keyboard control), 
      High Contrast Mode (better visibility), Customizable Font Sizes (adjust text size), Motion Controls (reduce or 
      disable animations), and Color-Blind Friendly design (clear visual indicators beyond color). To enable these 
      features: Open Settings, go to Accessibility section, toggle desired features on/off, adjust to your preferences, 
      and save changes.`
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
    const targets = Array.from(document.querySelectorAll('[data-doc-section="true"]')) as HTMLElement[]
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
            <BookOpen className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            User Documentation
          </h1>
          <p className="text-lg text-slate-300">
            Complete guide to using Emergencize effectively
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
                Emergencize is a supplementary alert system designed to notify your personal emergency 
                contacts. It should NOT replace calling 911 or local emergency services in life-threatening 
                situations. Always contact official emergency services first in genuine emergencies.
              </p>
            </div>
          </div>
        </motion.div>

        {/* TOC + Documentation Sections */}
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
                    className={`block px-3 py-2 rounded-lg transition-colors border border-transparent text-sm ${
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
                  data-doc-section="true"
                  key={id}
                  className="scroll-mt-28 py-6 border-b border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                >
                  <h2 className="text-xl font-bold text-white mb-3">{section.title}</h2>
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
          <h3 className="text-2xl font-bold text-white mb-3">Need More Help?</h3>
          <p className="text-slate-300 mb-6">
            If you have any questions about using Emergencize, please reach out to us.
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

        {/* Footer Note */}
        <motion.div
          className="text-center mt-8 text-slate-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <p>
            This documentation is designed to help you use Emergencize safely and effectively. 
            Please read through all sections to ensure you understand how to use the emergency alert system.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
