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
    // In a real implementation, this would persist the alert to Firestore
    const body = await request.json()
    if (!body || !body.type || !body.message) {
      return NextResponse.json({ error: 'Invalid alert' }, { status: 400 })
    }

    // Placeholder: attach uid for future auditing
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}


