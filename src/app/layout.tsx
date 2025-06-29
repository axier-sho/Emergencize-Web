import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Emergencize - Emergency Alert System',
  description: 'Real-time emergency alerts for online users',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}