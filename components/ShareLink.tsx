'use client'

import { useState } from 'react'

interface Props {
  url: string
  expiresAt: string
}

export default function ShareLink({ url, expiresAt }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatted = new Date(expiresAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 p-4">
      <p className="text-green-700 dark:text-green-300 text-sm font-medium mb-2">
        ✓ 分享链接已生成（将于 {formatted} 过期）
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-md border border-green-300 dark:border-green-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1.5 text-sm font-mono focus:outline-none"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          {copied ? '已复制 ✓' : '复制'}
        </button>
      </div>
    </div>
  )
}
