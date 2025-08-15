import { NextResponse } from 'next/server'
import webpush from 'web-push'

// Expect these env vars to be set (public key already exposed client-side)
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  } catch (e) {
    console.error('Failed to set VAPID details', e)
  }
} else {
  console.warn('[push] VAPID keys missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to enable delivery.')
}

interface PushRequestBody {
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  payload: any
  options?: {
    ttl?: number
    urgency?: 'very-low' | 'low' | 'normal' | 'high'
    topic?: string
  }
}

export async function POST(request: Request) {
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
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    // Accept but indicate not delivered due to server config
    return NextResponse.json({ ok: false, skipped: true, reason: 'Server missing VAPID keys' }, { status: 503 })
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


