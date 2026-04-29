export const EXPIRES_MAP: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '5h': 5 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
}

export const VALID_EXPIRES_IN = Object.keys(EXPIRES_MAP) as Array<keyof typeof EXPIRES_MAP>

export const MAX_CONTENT_BYTES = 1024 * 1024 // 1MB

export const UID_LENGTH = 12

export const UID_PATTERN = /^[A-Za-z0-9]{12}$/

export const DATA_DIR = 'data/shares'
