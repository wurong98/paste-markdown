import { describe, expect, it } from 'bun:test'
import { generateUid } from './uid'

describe('generateUid', () => {
  it('generates 12-character alphanumeric string', () => {
    const uid = generateUid()
    expect(uid).toMatch(/^[A-Za-z0-9]{12}$/)
  })

  it('generates unique values', () => {
    const uids = new Set(Array.from({ length: 100 }, () => generateUid()))
    expect(uids.size).toBe(100)
  })
})
