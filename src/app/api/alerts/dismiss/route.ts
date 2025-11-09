import { NextResponse } from 'next/server'
import { admin } from '@/lib/firebaseAdmin'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await admin.auth().verifyIdToken(token)
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    if (!body || !body.alertId) {
      return NextResponse.json({ error: 'Missing alertId' }, { status: 400 })
    }
    // No-op dismiss stub
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}


