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

      const { toPng } = await import('html-to-image')

      // html-to-image 用 SVG foreignObject 渲染，不需要跨域请求
      const dataUrl = await toPng(el, {
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        filter: (node) => {
          // 跳过外部图片，避免 CORS 报错
          if (node instanceof HTMLImageElement) {
            const src = node.src ?? ''
            return src.startsWith('data:') || src.startsWith(window.location.origin)
          }
          return true
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
