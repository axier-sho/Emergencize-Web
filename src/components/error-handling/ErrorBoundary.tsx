'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RotateCcw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Report error to service (could be added later)
    this.reportError(error, errorInfo)
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This could send error reports to a service like Sentry
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      // Store locally for now, could be sent to external service
      const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]')
      existingReports.push(errorReport)
      localStorage.setItem('errorReports', JSON.stringify(existingReports.slice(-10))) // Keep last 10
    } catch (e) {
      console.error('Failed to report error:', e)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportBug = () => {
    const bugReportUrl = 'https://github.com/Sho1228/emergencize-web/issues/new'
    const errorDetails = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}`
    const encodedDetails = encodeURIComponent(errorDetails)
    window.open(`${bugReportUrl}?body=${encodedDetails}`, '_blank')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 flex items-center justify-center p-4">
          <motion.div
            className="glass-effect rounded-2xl p-8 w-full max-w-lg mx-auto text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Error Icon */}
            <motion.div
              className="w-20 h-20 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <AlertTriangle size={40} className="text-red-400" />
            </motion.div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h2>
            
            <p className="text-blue-200 mb-6">
              We encountered an unexpected error. Don&apos;t worry, your emergency system is still working. 
              You can try refreshing or return to the home page.
            </p>

            {/* Error Details (in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 p-4 bg-black bg-opacity-20 rounded-lg">
                <summary className="text-white font-medium cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-red-300 text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={this.handleRetry}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Retry the application"
              >
                <RotateCcw size={20} />
                <span>Try Again</span>
              </motion.button>

              <motion.button
                onClick={this.handleGoHome}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Go to home page"
              >
                <Home size={20} />
                <span>Go Home</span>
              </motion.button>

              <motion.button
                onClick={this.handleReportBug}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Report this bug"
              >
                <Bug size={20} />
                <span>Report Bug</span>
              </motion.button>
            </div>

            {/* Emergency Fallback */}
            <div className="mt-6 p-4 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 rounded-lg">
              <p className="text-red-200 text-sm">
                <strong>Emergency Access:</strong> If you&apos;re in an emergency, 
                call emergency services directly at your local emergency number 
                (911, 112, etc.) instead of relying on this app.
              </p>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}