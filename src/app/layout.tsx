import type { Metadata, Viewport } from 'next'
import './globals.css'
import ErrorBoundary from '@/components/error-handling/ErrorBoundary'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Emergencize - Emergency Alert System',
  description: 'Real-time emergency alerts with accessibility features, push notifications, and geofencing',
  keywords: 'emergency alerts, real-time notifications, accessibility, geofencing, safety',
  authors: [{ name: 'Sho' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.svg',
    apple: '/icon-192x192.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}