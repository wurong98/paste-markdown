'use client'

import { EXPIRES_MAP } from '@/lib/constants'

const OPTIONS: Array<{ value: string; label: string }> = [
  { value: '1h', label: '1 小时' },
  { value: '5h', label: '5 小时' },
  { value: '1d', label: '1 天' },
  { value: '1w', label: '1 周' },
  { value: '1m', label: '1 个月' },
]

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function ExpiresSelect({ value, onChange }: Props) {
  const expiresAt = new Date(Date.now() + EXPIRES_MAP[value])
  const formatted = expiresAt.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 text-sm">
      <label htmlFor="expires" className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
        过期时间
      </label>
      <select
        id="expires"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="text-slate-400 text-xs">将于 {formatted} 过期</span>
    </div>
  )
}
