import { createHash } from 'crypto'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { DATA_DIR, EXPIRES_MAP, MAX_CONTENT_BYTES, UID_PATTERN, VALID_EXPIRES_IN } from './constants'
import { generateUid } from './uid'

function getDataDir() { return process.env.DATA_DIR_OVERRIDE ?? DATA_DIR }

function ensureDataDir() {
  mkdirSync(getDataDir(), { recursive: true })
}

export interface ShareData {
  uid: string
  content: string
  contentHash: string
  createdAt: string
  expiresAt: string
  expiresIn: string
  version: number
}

export async function saveShare(content: string, expiresIn: string): Promise<ShareData> {
  if (!VALID_EXPIRES_IN.includes(expiresIn as never)) {
    throw new Error('Invalid expiresIn value')
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
    throw new Error('Content exceeds maximum size (1MB)')
  }

  ensureDataDir()

  const uid = generateUid()
  const now = Date.now()
  const contentHash = 'sha256:' + createHash('sha256').update(content).digest('hex')
  const data: ShareData = {
    uid,
    content,
    contentHash,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + EXPIRES_MAP[expiresIn]).toISOString(),
    expiresIn,
    version: 1,
  }

  writeFileSync(join(getDataDir(), `${uid}.json`), JSON.stringify(data), 'utf8')
  return data
}

export async function getShare(uid: string): Promise<ShareData | null> {
  if (!UID_PATTERN.test(uid)) return null

  const filePath = join(getDataDir(), `${uid}.json`)
  if (!existsSync(filePath)) return null

  let data: ShareData
  try {
    const raw = await readFile(filePath, 'utf8')
    data = JSON.parse(raw) as ShareData
  } catch {
    return null
  }

  if (Date.now() > new Date(data.expiresAt).getTime()) {
    await deleteShare(uid)
    return null
  }

  return data
}

export async function deleteShare(uid: string): Promise<void> {
  const filePath = join(getDataDir(), `${uid}.json`)
  try {
    rmSync(filePath)
  } catch {
    // 文件不存在时忽略
  }
}
