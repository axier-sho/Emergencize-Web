/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 15
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production'

    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      isDev ? "'unsafe-eval'" : null,
      isDev ? "'wasm-unsafe-eval'" : null,
      'https://*.vercel-analytics.com',
      'https://www.gstatic.com',
      'https://www.google.com',
      'https://www.googletagmanager.com'
    ].filter(Boolean).join(' ')

    const connectSrc = [
      "'self'",
      'https://*.googleapis.com',
      'https://*.firebaseio.com',
      'https://firestore.googleapis.com',
      'https://www.googleapis.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://vitals.vercel-insights.com',
      'ws:',
      'wss:',
      isDev ? 'http://localhost:*' : null
    ].filter(Boolean).join(' ')

    const frameSrc = [
      "'self'",
      'https://www.google.com/recaptcha/',
      'https://recaptcha.google.com/recaptcha/'
    ].join(' ')

    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      `connect-src ${connectSrc}`,
      "font-src 'self' data:",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      `frame-src ${frameSrc}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(self), microphone=(), camera=(), browsing-topics=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }
        ]
      }
    ]
  }
}

module.exports = nextConfig