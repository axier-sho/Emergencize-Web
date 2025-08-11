import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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


