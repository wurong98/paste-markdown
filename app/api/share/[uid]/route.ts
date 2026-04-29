import { UID_PATTERN } from '@/lib/constants'
import { getShare } from '@/lib/storage'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params

  if (!UID_PATTERN.test(uid)) {
    return NextResponse.json({ success: false, error: 'Share not found or expired' }, { status: 404 })
  }

  const data = await getShare(uid)
  if (!data) {
    return NextResponse.json({ success: false, error: 'Share not found or expired' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    uid: data.uid,
    content: data.content,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
  })
}
