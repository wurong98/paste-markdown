import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync } from 'fs'
import { join } from 'path'

// 测试时使用临时目录
process.env.DATA_DIR_OVERRIDE = 'data/test-shares'

import { deleteShare, getShare, saveShare } from './storage'

const TEST_DIR = 'data/test-shares'

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true })
})

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('saveShare', () => {
  it('saves and returns share data', async () => {
    const result = await saveShare('# Hello', '1h')
    expect(result.uid).toMatch(/^[A-Za-z0-9]{12}$/)
    expect(result.content).toBe('# Hello')
    expect(result.expiresIn).toBe('1h')
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('getShare', () => {
  it('returns null for nonexistent uid', async () => {
    const result = await getShare('nonexistent12')
    expect(result).toBeNull()
  })

  it('returns share content when valid', async () => {
    const saved = await saveShare('# Test', '1d')
    const result = await getShare(saved.uid)
    expect(result).not.toBeNull()
    expect(result!.content).toBe('# Test')
  })

  it('returns null and deletes file for expired share', async () => {
    const { writeFileSync } = await import('fs')
    const uid = 'expiredtest1'
    const expired = {
      uid,
      content: '# Expired',
      contentHash: 'sha256:abc',
      createdAt: new Date(Date.now() - 2000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      expiresIn: '1h',
      version: 1,
    }
    writeFileSync(join(TEST_DIR, `${uid}.json`), JSON.stringify(expired))

    const result = await getShare(uid)
    expect(result).toBeNull()

    const { existsSync } = await import('fs')
    expect(existsSync(join(TEST_DIR, `${uid}.json`))).toBe(false)
  })
})

describe('deleteShare', () => {
  it('deletes existing share file', async () => {
    const saved = await saveShare('# Del', '1h')
    await deleteShare(saved.uid)
    const result = await getShare(saved.uid)
    expect(result).toBeNull()
  })

  it('does not throw for nonexistent uid', async () => {
    await expect(deleteShare('notfound1234')).resolves.toBeUndefined()
  })
})
