/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 15
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://*.vercel-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://vitals.vercel-insights.com ws: wss:",
      "font-src 'self' data:",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'"
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'geolocation=(self), microphone=(), camera=(), browsing-topics=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' }
        ]
      }
    ]
  }
}

module.exports = nextConfig