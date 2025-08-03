import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '@/components/error-handling/ErrorBoundary'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'

export const metadata: Metadata = {
  title: 'Emergencize - Emergency Alert System',
  description: 'Real-time emergency alerts with accessibility features, push notifications, and geofencing',
  keywords: 'emergency alerts, real-time notifications, accessibility, geofencing, safety',
  authors: [{ name: 'Sho' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.svg',
    apple: '/icon-192x192.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">

      <body className="antialiased">
        <ErrorBoundary>
          <AccessibilityProvider>
            {children}
          </AccessibilityProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}