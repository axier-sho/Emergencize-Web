import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { admin } from '@/lib/firebaseAdmin'

// Ensure this route runs on the Node.js runtime (not Edge) because web-push
// requires Node APIs like crypto and HTTP/2.
export const runtime = 'nodejs'

// Expect these env vars to be set (public key already exposed client-side)
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT

const missingVapidConfig = [
  !VAPID_PUBLIC_KEY ? 'NEXT_PUBLIC_VAPID_PUBLIC_KEY' : null,
  !VAPID_PRIVATE_KEY ? 'VAPID_PRIVATE_KEY' : null,
  !VAPID_SUBJECT ? 'VAPID_SUBJECT' : null
].filter(Boolean)

if (missingVapidConfig.length === 0) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT as string, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  } catch (e) {
    console.error('Failed to set VAPID details', e)
  }
} else {
  console.warn(
    `[push] VAPID configuration incomplete. Missing environment variables: ${missingVapidConfig.join(
      ', '
    )}. Push notifications will be disabled until all are set.`
  )
}

interface PushRequestBody {
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  payload: {
    title: string
    message: string
    type: 'help' | 'danger'
    fromUser: string
    location?: { lat: number; lng: number; address?: string }
    timestamp: string
    alertId: string
  }
  options?: {
    ttl?: number
    urgency?: 'very-low' | 'low' | 'normal' | 'high'
    topic?: string
  }
}

export async function POST(request: Request) {
  // Verify Firebase ID token from Authorization header
  let uid: string | null = null
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = await admin.auth().verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PushRequestBody | null = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || !body.subscription || !body.subscription.endpoint) {
    return NextResponse.json({ error: 'Missing subscription' }, { status: 400 })
  }
  if (!body.payload) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
  }
  // Minimal payload validation
  const msgLen = (body.payload.message || '').length
  if (msgLen < 1 || msgLen > 1000) {
    return NextResponse.json({ error: 'Invalid message length' }, { status: 400 })
  }

  if (missingVapidConfig.length > 0) {
    // Accept but indicate not delivered due to server config
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        reason: `Server missing VAPID configuration: ${missingVapidConfig.join(', ')}`
      },
      { status: 503 }
    )
  }

  // Server-side rate limit per user for push send
  try {
    const db = admin.firestore()
    const operationKey = `${uid}_push_send`
    const docRef = db.collection('rateLimits').doc(operationKey)
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute
    const maxRequests = 20

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef)
      let count = 0
      let windowStart = now
      if (snap.exists) {
        const data = snap.data() as any
        count = typeof data?.count === 'number' ? data.count : 0
        windowStart = typeof data?.windowStart === 'number' ? data.windowStart : now
      }
      // Reset window if expired
      if (windowStart < now - windowMs) {
        count = 0
        windowStart = now
      }
      if (count >= maxRequests) {
        const resetTime = windowStart + windowMs
        const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000))
        return { allowed: false, resetTime, retryAfter }
      }
      // Increment and persist
      tx.set(docRef, {
        count: count + 1,
        windowStart,
        lastRequest: now
      })
      return { allowed: true, resetTime: windowStart + windowMs }
    })

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: result.retryAfter },
        { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
      )
    }
  } catch (e) {
    // If rate limit storage fails, proceed but log
    // eslint-disable-next-line no-console
    console.error('[push] rate limit check failed:', e)
  }

  try {
    const payloadString = JSON.stringify(body.payload)
    await webpush.sendNotification(body.subscription as any, payloadString, body.options)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    // Handle subscription gone (410), not authorized (401/403) etc.
    const statusCode = (error?.statusCode as number) || 500
    const isGone = statusCode === 404 || statusCode === 410
    return NextResponse.json({ ok: false, error: error?.body || error?.message, subscriptionExpired: isGone }, { status: statusCode })
  }
}


