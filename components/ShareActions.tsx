'use client'

import html2canvas from 'html2canvas'
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
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = 'paste-markdown.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopyText}
        className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600
          text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100
          dark:hover:bg-slate-800 transition-colors"
      >
        {copied ? '已复制 ✓' : '复制全文'}
      </button>
      <button
        onClick={handleExportPng}
        disabled={exporting}
        className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600
          text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100
          dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {exporting ? '导出中...' : '转 PNG'}
      </button>
    </div>
  )
}
