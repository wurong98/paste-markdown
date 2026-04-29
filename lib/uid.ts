import { randomBytes } from 'crypto'
import { UID_LENGTH } from './constants'

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function generateUid(): string {
  const bytes = randomBytes(UID_LENGTH * 2)
  let result = ''
  for (let i = 0; i < bytes.length && result.length < UID_LENGTH; i++) {
    const idx = bytes[i] % BASE62.length
    result += BASE62[idx]
  }
  return result
}
