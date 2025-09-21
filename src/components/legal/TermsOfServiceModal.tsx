'use client'

import React, { useState, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, ExternalLink, Calendar, Building2 } from 'lucide-react'
import Link from 'next/link'

interface TermsOfServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept?: () => void
  showAcceptButton?: boolean
}

export function TermsOfServiceModal({ 
  isOpen, 
  onClose, 
  onAccept, 
  showAcceptButton = false 
}: TermsOfServiceModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const [activeSection, setActiveSection] = useState<string>('section-1')
  // TOC container ref for auto-scrolling active item
  const tocContainerRef = useRef<HTMLUListElement | null>(null)

  // Table of contents sections
  const toc = [
    { id: 'section-1', label: '1. Preamble' },
    { id: 'section-7', label: '7. Acceptable Use' },
    { id: 'section-17', label: '17. Warranties' },
    { id: 'section-18', label: '18. Liability' },
    { id: 'section-22', label: '22. Accessibility' },
    { id: 'section-32', label: '32. Acceptance' }
  ]

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50
    setHasScrolledToBottom(isScrolledToBottom)
  }

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false)
      // Save previously focused element
      previouslyFocusedRef.current = document.activeElement as HTMLElement
      // Delay to ensure content measured
      requestAnimationFrame(() => {
        const el = contentRef.current
        if (el) {
          // If not scrollable, mark as bottom already
            if (el.scrollHeight <= el.clientHeight + 2) {
              setHasScrolledToBottom(true)
            }
        }
        // Focus first focusable element (close button or accept button)
        const focusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      })
      // Lock body scroll
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = originalOverflow }
    }
  }, [isOpen])

  // Escape key & focus trap
  useEffect(() => {
    if (!isOpen) {
      // Restore focus
      previouslyFocusedRef.current?.focus()
      return
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'Tab') {
        // Basic focus trap
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [isOpen, onClose])

  // Observe headings within scroll container to sync active section
  useEffect(() => {
    if (!isOpen) return
    const root = contentRef.current
    if (!root) return
    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h3[id]'))
    if (!headings.length) return

    const observer = new IntersectionObserver(
      entries => {
        // Sort entries by boundingClientRect top to pick the nearest visible
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) {
          setActiveSection(visible[0].target.id)
        } else {
          // Fallback: find the last heading above the viewport
          const scrollTop = root.scrollTop
          let current = headings[0].id
            headings.forEach(h => {
              if (h.offsetTop - 16 <= scrollTop) current = h.id
            })
          setActiveSection(current)
        }
      },
      { root, threshold: 0.4 }
    )
    headings.forEach(h => observer.observe(h))
    return () => observer.disconnect()
  }, [isOpen])

  // Auto-scroll TOC so active item stays visible (simplified pattern provided by user)
  useEffect(() => {
    if (!isOpen) return
    const container = tocContainerRef.current
    if (!container) return
    const activeEl = container.querySelector<HTMLAnchorElement>('.toc-item.active')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeSection, isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          aria-hidden={!isOpen}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="w-full max-w-4xl h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h2 id={headingId} className="text-xl font-bold">Terms of Service</h2>
                  <p className="text-blue-100 text-sm">Please read carefully before proceeding</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/60"
                >
                  <ExternalLink size={16} />
                  <span>Open in New Tab</span>
                </Link>
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/60"
                  aria-label="Close terms of service"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Document Info */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Building2 className="w-4 h-4" />
                  <span>Emergencize</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Effective: Aug 15, 2025</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Organization: Axier (a non-profit organization incorporated under the laws of Japan)
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Tokyo, Japan
                </div>
              </div>
            </div>

            {/* Content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto p-6 outline-none"
              onScroll={handleScroll}
              tabIndex={0}
            >
              <div className="flex gap-8 w-full">
                {/* Sidebar TOC */}
                <nav aria-label="Terms sections" className="hidden md:block w-56 flex-shrink-0">
                  <ul
                    ref={tocContainerRef}
                    className="space-y-1 sticky top-0 max-h-[calc(90vh-12rem)] overflow-auto pr-2"
                  >
                    {toc.map(item => {
                      const active = activeSection === item.id
                      return (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            onClick={(e) => {
                              e.preventDefault()
                              const el = contentRef.current?.querySelector<HTMLElement>(`#${item.id}`)
                              if (el) {
                                contentRef.current?.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' })
                              }
                            }}
                            className={`toc-item block rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${active ? 'active bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-200'}`}
                            aria-current={active ? 'true' : undefined}
                          >
                            {item.label}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
                {/* Main Article */}
                <div className="prose prose-gray dark:prose-invert max-w-none flex-1">
                  <div className="mb-8" id="section-1">
                    <h3 id="section-1" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      1. Preamble and Acceptance of Terms
                    </h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">1.1 Binding Agreement</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      These Terms of Service constitute a legally binding agreement between you and Axier governing your access to and use of the Emergencize platform located at emergencize.com and all associated services.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">1.2 Affirmative Acceptance</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You must affirmatively accept these Terms before creating an account or accessing non-public features. If you do not agree, do not access or use the Platform.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">1.6 Non-Medical/Non-Professional Premise</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      The Platform provides informational, community, and supportive resources only. It does not provide medical, legal, financial, therapeutic, or other professional advice or services.
                    </p>
                  </div>
                </div>

                <div className="mb-8" id="section-7">
                  <h3 id="section-7" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    7. Acceptable Use; Community Standards
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">7.1 Prohibited Conduct</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">You will not:</p>
                    <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 ml-4">
                      <li>• Engage in unlawful, abusive, harassing, discriminatory, hateful, exploitative, or harmful behavior</li>
                      <li>• Post violent, pornographic, sexually explicit, or otherwise inappropriate content</li>
                      <li>• Provide or solicit medical/clinical/professional advice without proper credentials</li>
                      <li>• Disseminate harmful misinformation</li>
                      <li>• Impersonate others or misrepresent affiliation or qualifications</li>
                      <li>• Infringe intellectual property, privacy, or publicity rights</li>
                    </ul>
                  </div>
                </div>

                <div className="mb-8" id="section-17">
                  <h3 id="section-17" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    17. Disclaimers of Warranties
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">17.1 &quot;As Is&quot; Provision</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      The Platform and all features are provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, including merchantability, fitness for a particular purpose, or reliability.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">17.4 Emergency Disclaimer</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium text-red-600 dark:text-red-400">
                      The Platform is not intended for emergency communications. If you are in crisis or danger, contact local emergency services immediately.
                    </p>
                  </div>
                </div>

                <div className="mb-8" id="section-18">
                  <h3 id="section-18" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    18. Limitation of Liability
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Axier&apos;s aggregate liability for all claims shall not exceed the greater of: (a) the total amount you paid to Axier in the twelve months preceding the event, or (b) USD $50.
                  </p>
                </div>

                <div className="mb-8" id="section-22">
                  <h3 id="section-22" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    22. Accessibility
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    We strive to improve accessibility and align with applicable standards (e.g., WCAG) where feasible. Users requiring accommodations may contact us for reasonable efforts within technical and resource constraints.
                  </p>
                </div>

                <div className="mb-8" id="section-32">
                  <h3 id="section-32" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    32. Acceptance and Final Affirmations
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    By clicking &quot;I Agree,&quot; checking a box, or otherwise affirmatively consenting, you acknowledge that you have read, understood, and agree to be bound by these Terms and incorporated Policies. You further acknowledge Axier&apos;s disclaimers, limitations of liability, and other risk allocations to the maximum extent permitted by law.
                  </p>
                </div>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Important:</strong> This is a condensed version of our Terms of Service highlighting key sections. For the complete legal document, please visit our full Terms of Service page.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    — End of Terms Summary —
                  </p>
                </div>
                </div>{/* end article */}
              </div>{/* end flex */}
            </div>

            {/* Footer */}
            {showAcceptButton && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {!hasScrolledToBottom && (
                      <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-sm">Please scroll to read the complete terms</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={hasScrolledToBottom ? onAccept : undefined}
                      disabled={!hasScrolledToBottom}
                      className={`px-6 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:focus:ring-0
                        ${hasScrolledToBottom
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`
                      }
                      aria-disabled={!hasScrolledToBottom}
                      aria-describedby={!hasScrolledToBottom ? `${headingId}-scrollhint` : undefined}
                    >
                      I Accept These Terms
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default TermsOfServiceModal