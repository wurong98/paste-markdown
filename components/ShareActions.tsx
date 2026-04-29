'use client'

import { useState } from 'react'

interface Props {
  rawContent: string
  contentSelector: string
}

export default function ShareActions({ rawContent, contentSelector }: Props) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleCopyText() {
    await navigator.clipboard.writeText(rawContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleExportPng() {
    setExporting(true)
    try {
      const el = document.querySelector(contentSelector) as HTMLElement
      if (!el) return

      // dom-to-image-more 支持现代 CSS 颜色函数（lab、oklch 等）
      const domtoimage = (await import('dom-to-image-more')).default

      const dataUrl = await domtoimage.toPng(el, {
        scale: 2,
        bgcolor: '#ffffff',
        style: {
          // 强制白底，避免 dark mode 变量
          background: '#ffffff',
          color: '#1e293b',
        },
      })

      const link = document.createElement('a')
      link.download = 'paste-markdown.png'
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Export PNG failed:', e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopyText}
        className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
      >
        {copied ? '已复制 ✓' : '复制全文'}
      </button>
      <button
        onClick={handleExportPng}
        disabled={exporting}
        className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {exporting ? '导出中...' : '转 PNG'}
      </button>
    </div>
  )
}
