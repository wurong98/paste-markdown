import { MAX_CONTENT_BYTES, VALID_EXPIRES_IN } from '@/lib/constants'
import { saveShare } from '@/lib/storage'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { content, expiresIn } = body as Record<string, unknown>

  if (typeof content !== 'string' || content.trim() === '') {
    return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 })
  }

  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Content exceeds maximum size (1MB)' },
      { status: 413 }
    )
  }

  if (typeof expiresIn !== 'string' || !VALID_EXPIRES_IN.includes(expiresIn as never)) {
    return NextResponse.json({ success: false, error: 'Invalid expiresIn value' }, { status: 400 })
  }

  try {
    const data = await saveShare(content, expiresIn)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    return NextResponse.json({
      success: true,
      uid: data.uid,
      shareUrl: `${baseUrl}/share/${data.uid}`,
      expiresAt: data.expiresAt,
    })
  } catch (err) {
    console.error('saveShare error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
