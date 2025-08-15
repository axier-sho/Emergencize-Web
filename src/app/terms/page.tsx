'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Calendar, Building2, Globe, Scroll } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('')

  const sections = [
    { id: 'preamble', title: 'Preamble and Acceptance', number: '1' },
    { id: 'definitions', title: 'Definitions and Interpretations', number: '2' },
    { id: 'purpose', title: 'Purpose and Scope', number: '3' },
    { id: 'eligibility', title: 'Eligibility', number: '4' },
    { id: 'registration', title: 'Account Registration', number: '5' },
    { id: 'availability', title: 'Availability and Modifications', number: '6' },
    { id: 'conduct', title: 'Acceptable Use', number: '7' },
    { id: 'content', title: 'User Content', number: '8' },
    { id: 'ip', title: 'Intellectual Property', number: '9' },
    { id: 'third-party', title: 'Third-Party Services', number: '10' },
    { id: 'privacy', title: 'Privacy and Data', number: '11' },
    { id: 'data-mgmt', title: 'Data Management', number: '12' },
    { id: 'fees', title: 'Fees and Donations', number: '13' },
    { id: 'communications', title: 'Electronic Communications', number: '14' },
    { id: 'open-source', title: 'Open Source', number: '15' },
    { id: 'compliance', title: 'Export Controls', number: '16' },
    { id: 'disclaimers', title: 'Disclaimers of Warranties', number: '17' },
    { id: 'liability', title: 'Limitation of Liability', number: '18' },
    { id: 'indemnification', title: 'Indemnification', number: '19' },
    { id: 'governing-law', title: 'Governing Law', number: '20' },
    { id: 'international', title: 'International Use', number: '21' },
    { id: 'accessibility', title: 'Accessibility', number: '22' },
    { id: 'moderation', title: 'Moderation', number: '23' },
    { id: 'ip-claims', title: 'IP Claims', number: '24' },
    { id: 'security', title: 'Platform Integrity', number: '25' },
    { id: 'changes', title: 'Changes to Terms', number: '26' },
    { id: 'termination', title: 'Termination', number: '27' },
    { id: 'assignment', title: 'Assignment', number: '28' },
    { id: 'notices', title: 'Notices', number: '29' },
    { id: 'agreement', title: 'Entire Agreement', number: '30' },
    { id: 'acknowledgments', title: 'Acknowledgments', number: '31' },
    { id: 'final', title: 'Final Affirmations', number: '32' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200

      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetBottom = offsetTop + element.offsetHeight

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    handleScroll() // Set initial active section
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Emergencize</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Terms of Service</h1>
          </div>
          
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Table of Contents - Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="hidden lg:block w-80 flex-shrink-0"
        >
          <div className="sticky top-24">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Scroll className="w-5 h-5 mr-2" />
                Table of Contents
              </h2>
              <nav className="space-y-1 max-h-96 overflow-y-auto">
                {sections.map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200
                      ${activeSection === section.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="font-mono text-xs mr-2 text-gray-500">{section.number}.</span>
                    {section.title}
                  </motion.button>
                ))}
              </nav>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex-1 max-w-4xl"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Document Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
              <h1 className="text-3xl font-bold mb-4">Comprehensive Terms of Service</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-100">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>Emergencize (sho1228.com)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Effective: August 15, 2025</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>Organization: Axiom (Japan)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Tokyo, Japan</span>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 prose prose-gray dark:prose-invert max-w-none">
              
              <section id="preamble" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">1. Preamble and Acceptance of Terms</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">1.1 Binding Agreement</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  These Terms of Service (the "Terms," "Agreement," or "ToS") constitute a legally binding agreement between you ("you," "your," or "User") and Axiom ("Axiom," "we," "us," or "our") governing your access to and use of the Emergencize platform located at sho1228.com and all associated services, subdomains, applications, interfaces, and tools (collectively, the "Platform" or "Emergencize").
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">1.2 Affirmative Acceptance</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You must affirmatively accept these Terms (e.g., by clicking "I Agree," checking a box, or taking equivalent action) before creating an account or accessing non-public features. If you do not agree, do not access or use the Platform.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">1.3 Incorporated Policies</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Our Privacy Policy and any posted guidelines, community standards, or supplemental terms (collectively, "Policies") are incorporated by reference and form part of this Agreement. If there is any conflict, these Terms control unless a Policy expressly states otherwise.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">1.4 Capacity and Authority</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  By accepting these Terms, you represent and warrant that you are of the legal age of majority or digital consent in your jurisdiction, or you have verifiable parental/guardian consent, and you have the authority to enter into this Agreement. If you accept on behalf of an entity, you represent you have authority to bind that entity.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">1.5 Non-Transferable Consent</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Your acceptance is personal to you and may not be assigned or transferred except as expressly permitted herein.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">1.6 Non-Medical/Non-Professional Premise</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform provides informational, community, and supportive resources only. It does not provide medical, legal, financial, therapeutic, or other professional advice or services. Do not rely on the Platform for professional or emergency needs.
                </p>
              </section>

              <section id="definitions" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">2. Definitions and Interpretations</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">2.1 Key Terms</h3>
                <ul className="text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                  <li><strong>"Platform," "Service," "Website," or "Emergencize":</strong> The site at sho1228.com and all related subdomains, applications (including mobile), APIs, features, tools, content, and infrastructure.</li>
                  <li><strong>"Axiom," "we," "us," "our":</strong> Axiom, a non-profit entity under Japanese law, including affiliates, directors, officers, employees, agents, volunteers, contractors, successors, and assigns.</li>
                  <li><strong>"User," "you," "your":</strong> Any individual or entity accessing or using the Platform, including registered and guest users.</li>
                  <li><strong>"Content":</strong> Any text, images, audio, video, data, code, posts, messages, comments, profiles, metadata, or other materials available on or through the Platform.</li>
                  <li><strong>"User Content":</strong> Content submitted, posted, uploaded, transmitted, or otherwise provided by Users (e.g., forum posts, comments, messages, uploads).</li>
                  <li><strong>"Axiom Content":</strong> Content owned or controlled by Axiom or its licensors (e.g., software, features, site design, UI, informational materials).</li>
                  <li><strong>"Community Features":</strong> Forums, groups, messaging tools, discussion areas, or other interactive functionality enabling User communication or collaboration.</li>
                  <li><strong>"Tools":</strong> Assistive and informational features provided by the Platform (e.g., accessibility settings, resource locators, calculators), not professional tools.</li>
                  <li><strong>"Personal Data" or "Personal Information":</strong> Information that identifies or could reasonably identify an individual (e.g., name, email, disability-related information, usage data).</li>
                  <li><strong>"Third-Party Services":</strong> External sites, services, applications, or integrations not operated by Axiom.</li>
                  <li><strong>"Intellectual Property Rights":</strong> All copyrights, patents, trademarks, trade secrets, moral rights, publicity rights, and other proprietary rights.</li>
                  <li><strong>"Disability":</strong> Any physical, mental, cognitive, sensory, or developmental impairment recognized under applicable law.</li>
                  <li><strong>"Force Majeure Event":</strong> Circumstances beyond a party's reasonable control, including acts of God, disasters, pandemics, governmental actions, war, cyber-attacks, outages, or similar events.</li>
                  <li><strong>"Beta Features":</strong> Features labeled as beta, experimental, or preview that may change or be discontinued.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">2.2 Interpretations</h3>
                <ul className="text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                  <li>• Headings are for convenience and do not affect construction.</li>
                  <li>• Singular includes plural and vice versa; references to a gender include all genders.</li>
                  <li>• References to laws include amendments, consolidations, and re-enactments.</li>
                  <li>• "Writing" includes electronic communications and durable digital records.</li>
                  <li>• Ambiguities are interpreted consistent with the Platform's non-profit and supportive mission.</li>
                </ul>
              </section>

              <section id="purpose" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">3. Purpose, Nature, and Scope of the Platform</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">3.1 Mission</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Emergencize is designed to support people with disabilities by providing access to informational resources, peer-to-peer community features, and tools aimed at empowerment, connection, and self-education.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">3.2 No Professional Services; No Reliance</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Axiom is not a healthcare provider, therapist, counselor, lawyer, or financial advisor. Nothing on the Platform constitutes professional advice, diagnosis, or treatment. No physician-patient, therapist-client, attorney-client, fiduciary, or similar relationship is formed.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">3.3 Not for Emergencies</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <strong>IMPORTANT:</strong> The Platform is not designed for emergencies. If you or others are in danger or experiencing an emergency, call local emergency services and/or contact qualified professionals immediately.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">3.4 Service Description</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">The Platform may provide:</p>
                <ul className="text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                  <li>• Resource libraries with disability-related information and external references;</li>
                  <li>• Community features enabling respectful discussion and peer support;</li>
                  <li>• Tools and utilities to assist with organization and access (provided "as is").</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">3.5 Limitations</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform is provided without service-level commitments. Information may not be complete, current, or accurate. Features may be modified, suspended, or discontinued at any time.
                </p>
              </section>

              <section id="eligibility" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">4. Eligibility; Users with Disabilities; Minors</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">4.1 Eligibility</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You must be able to form a legally binding contract and meet age-of-consent requirements in your jurisdiction. If local law permits, minors may use the Platform only with parental/guardian consent and supervision.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">4.2 Users with Disabilities</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform is intended to support users with disabilities. Accessibility may vary by device, browser, assistive technology, network, or third-party integrations. Accessibility is an ongoing effort; perfect accessibility is not guaranteed.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">4.3 Representations</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You represent and warrant that your registration information is accurate and updated, your use complies with law, you are not barred from the Platform, and you will not use the Platform for unlawful or harmful purposes.
                </p>
              </section>

              <section id="registration" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">5. Account Registration and Security</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">5.1 Registration</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Certain features require an account with accurate, current, and complete information. <strong>You must accept these Terms during registration.</strong>
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">5.2 Credentials and Responsibility</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You are solely responsible for safeguarding credentials and for all activity under your account, whether authorized or not. Notify us promptly of suspected unauthorized use.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">5.3 One Account; Non-Transferability</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You may not sell, transfer, or share your account or rights, except as permitted for a parent/guardian supervising a minor under these Terms.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">5.4 Verification and Enforcement</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We may require identity or eligibility verification and may refuse, suspend, or terminate accounts at our discretion without liability.
                </p>
              </section>

              {/* Sections 6-16 abbreviated for space - would continue with all sections in full implementation */}
              <section id="availability" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">6. Availability; Modifications; Beta Features</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform may experience downtime or errors. We may add, modify, limit, or discontinue features at any time. Beta features are provided "as is" without warranties.
                </p>
              </section>

              <section id="conduct" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">7. Acceptable Use; Community Standards</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You agree to use the Platform respectfully and lawfully. Prohibited conduct includes harassment, harmful content, impersonation, intellectual property infringement, security breaches, and unauthorized commercial activities.
                </p>
              </section>

              <section id="content" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">8. User Content; License; Representations</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You retain ownership of your content but grant us necessary licenses to operate the Platform. You represent that your content complies with law and these Terms.
                </p>
              </section>

              <section id="ip" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">9. Intellectual Property; Platform License</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform and our content are protected by intellectual property laws. You receive a limited license to use the Platform for lawful, personal, non-commercial purposes.
                </p>
              </section>

              <section id="third-party" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">10. Third-Party Services; External Links</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform may integrate with third-party services. We do not endorse or control these services and assume no responsibility for their content or actions.
                </p>
              </section>

              <section id="privacy" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">11. Privacy; Data; Security</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Our Privacy Policy describes how we collect, use, and protect personal data. We employ reasonable security measures but cannot guarantee perfect security.
                </p>
              </section>

              <section id="data-mgmt" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">12. Data Management; Retention; Deletion</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We may retain content and data for operational purposes. You may request deletion of certain data, subject to legal and operational constraints.
                </p>
              </section>

              <section id="fees" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">13. Fees; Donations; Refunds; Taxes</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  As a non-profit, many features may be free. Optional donations or paid features may be available. Donations are generally non-refundable unless required by law.
                </p>
              </section>

              <section id="communications" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">14. Electronic Communications; Notices</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You consent to receive communications electronically. Your acceptance constitutes your electronic signature with the same force as a handwritten signature.
                </p>
              </section>

              <section id="open-source" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">15. Open Source; Third-Party Licenses</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform may include open-source components governed by their respective licenses, which may supersede certain provisions of these Terms.
                </p>
              </section>

              <section id="compliance" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">16. Export Controls; Sanctions; Compliance</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You agree to comply with applicable export control and sanctions laws and represent that you are not in a sanctioned jurisdiction.
                </p>
              </section>

              <section id="disclaimers" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">17. Disclaimers of Warranties</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">17.1 "As Is" and "As Available"</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform, all Content, Tools, and features are provided "as is" and "as available," with all faults and without warranties of any kind including merchantability, fitness for a particular purpose, or non-infringement.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">17.2 No Professional Advice</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  All information is general and informational. Always seek qualified professional advice for health, legal, safety, financial, or other specialized matters.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">17.3 Emergencies</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <strong>EMERGENCY DISCLAIMER:</strong> The Platform is not intended for emergency communications. If you are in crisis or danger, contact local emergency services immediately.
                </p>
              </section>

              <section id="liability" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">18. Limitation of Liability</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  To the fullest extent permitted by law, Axiom's liability is limited to the greater of amounts you paid us in the past 12 months or USD $50. We disclaim liability for indirect, incidental, or consequential damages.
                </p>
              </section>

              <section id="indemnification" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">19. Indemnification and Hold Harmless</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You agree to defend, indemnify, and hold harmless Axiom from claims arising from your use of the Platform, your content, or your violation of these Terms or law.
                </p>
              </section>

              <section id="governing-law" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">20. Governing Law; Dispute Resolution</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  These Terms are governed by Japanese law. Disputes shall be resolved by binding arbitration in Tokyo, Japan, except where prohibited by law.
                </p>
              </section>

              <section id="international" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">21. International Use; Region-Specific Terms</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform is controlled from Japan. You are responsible for local law compliance. Consumer protection laws may provide additional rights.
                </p>
              </section>

              <section id="accessibility" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">22. Accessibility; Limitations; Accommodation</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We strive to improve accessibility but do not warrant conformance with specific standards. Users requiring accommodations may contact us for reasonable efforts.
                </p>
              </section>

              <section id="moderation" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">23. Moderation; Enforcement</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We may monitor content and take enforcement actions at our discretion but have no obligation to do so. We may remove content or suspend accounts without liability.
                </p>
              </section>

              <section id="ip-claims" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">24. Intellectual Property Claims</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  If you believe content infringes your IP rights, submit a report via our IP policy mechanisms. We may remove allegedly infringing material and terminate repeat infringers.
                </p>
              </section>

              <section id="security" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">25. Platform Integrity; Security Research</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Do not interfere with the Platform's operation or circumvent access restrictions. Security testing requires prior written authorization.
                </p>
              </section>

              <section id="changes" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">26. Changes to Terms; Services</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We may revise these Terms from time to time. Your continued use signifies acceptance. We may add, modify, or discontinue features with or without notice.
                </p>
              </section>

              <section id="termination" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">27. Termination; Suspension; Survival</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We may suspend or terminate access at any time. You may cease using the Platform at any time. Certain sections survive termination.
                </p>
              </section>

              <section id="assignment" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">28. Assignment</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We may assign our rights and obligations to affiliates or successors. You may not assign these Terms without our prior written consent.
                </p>
              </section>

              <section id="notices" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">29. Notices; Communications</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Notices may be provided through in-Platform messages, email, or other electronic means. The Platform is not for professional or emergency communications.
                </p>
              </section>

              <section id="agreement" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">30. Entire Agreement; Severability</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  These Terms constitute the entire agreement between parties. If any provision is invalid, the remaining provisions remain in effect.
                </p>
              </section>

              <section id="acknowledgments" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">31. Acknowledgments; Independent Responsibility</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You acknowledge the Platform is informational and community-oriented, not professional or medical. You are responsible for your decisions and compliance with applicable laws.
                </p>
              </section>

              <section id="final" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">32. Effective Date; Acceptance and Final Affirmations</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">32.1 Effective Date</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  These Terms are effective on the date listed at the top of this Agreement.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">32.2 Acceptance Required</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  By clicking "I Agree," checking a box, or otherwise affirmatively consenting, you acknowledge that you have read, understood, and agree to be bound by these Terms and incorporated Policies. You further acknowledge and agree to Axiom's explicit disclaimers, limitations of liability, arbitration and class waiver provisions, and other allocations of risk to the maximum extent permitted by law.
                </p>
              </section>

              <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-center text-gray-600 dark:text-gray-400 font-medium">
                  — End of Comprehensive Terms of Service —
                </p>
                <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Last Updated: August 15, 2025
                </p>
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  )
}