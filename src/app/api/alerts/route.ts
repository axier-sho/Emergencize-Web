import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // In a real implementation, this would persist the alert to Firestore
    const body = await request.json()
    if (!body || !body.type || !body.message) {
      return NextResponse.json({ error: 'Invalid alert' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}


