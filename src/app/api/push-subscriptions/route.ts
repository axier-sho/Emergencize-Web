import { NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'
import { logger } from '@/utils/logger'

async function authenticate(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

  if (!token) {
    throw new Error('Missing token')
  }

  const decoded = await admin.auth().verifyIdToken(token)
  return decoded.uid
}

export async function POST(request: Request) {
  let uid: string
  try {
    uid = await authenticate(request)
  } catch (error) {
    logger.warn('Unauthorized push subscription attempt:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const subscription = body?.subscription
    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.endpoint ||
      !subscription.keys ||
      typeof subscription.keys.p256dh !== 'string' ||
      typeof subscription.keys.auth !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
    }

    logger.info('Registered push subscription for user %s', uid)
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('Failed to register push subscription:', error)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  let uid: string
  try {
    uid = await authenticate(request)
  } catch (error) {
    logger.warn('Unauthorized push subscription removal attempt:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const endpoint = body?.endpoint
    if (endpoint && typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Invalid endpoint value' }, { status: 400 })
    }

    logger.info('Removed push subscription for user %s', uid)
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('Failed to remove push subscription:', error)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

