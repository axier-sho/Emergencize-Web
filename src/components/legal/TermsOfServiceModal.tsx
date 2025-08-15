'use client'

import React, { useState, useEffect } from 'react'
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50
    setHasScrolledToBottom(isScrolledToBottom)
  }

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-4xl h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">Terms of Service</h2>
                  <p className="text-blue-100 text-sm">Please read carefully before proceeding</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/terms"
                  target="_blank"
                  className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm"
                >
                  <ExternalLink size={16} />
                  <span>Open in New Tab</span>
                </Link>
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
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
                  Organization: Axiom
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Tokyo, Japan
                </div>
              </div>
            </div>

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto p-6"
              onScroll={handleScroll}
            >
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    1. Preamble and Acceptance of Terms
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">1.1 Binding Agreement</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      These Terms of Service constitute a legally binding agreement between you and Axiom governing your access to and use of the Emergencize platform located at sho1228.com and all associated services.
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

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    17. Disclaimers of Warranties
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">17.1 "As Is" Provision</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      The Platform and all features are provided "as is" and "as available," without warranties of any kind, including merchantability, fitness for a particular purpose, or reliability.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">17.4 Emergency Disclaimer</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium text-red-600 dark:text-red-400">
                      The Platform is not intended for emergency communications. If you are in crisis or danger, contact local emergency services immediately.
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    18. Limitation of Liability
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Axiom's aggregate liability for all claims shall not exceed the greater of: (a) the total amount you paid to Axiom in the twelve months preceding the event, or (b) USD $50.
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    22. Accessibility
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    We strive to improve accessibility and align with applicable standards (e.g., WCAG) where feasible. Users requiring accommodations may contact us for reasonable efforts within technical and resource constraints.
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    32. Acceptance and Final Affirmations
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    By clicking "I Agree," checking a box, or otherwise affirmatively consenting, you acknowledge that you have read, understood, and agree to be bound by these Terms and incorporated Policies. You further acknowledge Axiom's disclaimers, limitations of liability, and other risk allocations to the maximum extent permitted by law.
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
              </div>
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
                      onClick={onAccept}
                      disabled={!hasScrolledToBottom}
                      className={`
                        px-6 py-2 rounded-lg font-medium transition-all
                        ${hasScrolledToBottom
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }
                      `}
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