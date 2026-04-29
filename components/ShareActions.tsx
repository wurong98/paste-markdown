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

      // 临时克隆节点，强制白底黑字，避免 dark mode 变量干扰
      const clone = el.cloneNode(true) as HTMLElement
      clone.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: ${el.offsetWidth}px;
        background: #ffffff;
        color: #1e293b;
        padding: 40px;
        box-sizing: border-box;
        z-index: -9999;
        font-family: ui-sans-serif, system-ui, sans-serif;
      `
      // 移除 dark: 相关的内联变量
      clone.querySelectorAll<HTMLElement>('[class]').forEach((node) => {
        node.style.color = ''
        node.style.backgroundColor = ''
        node.style.borderColor = ''
      })
      document.body.appendChild(clone)

      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        width: clone.offsetWidth,
      })

      document.body.removeChild(clone)

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
        className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-800
          text-white text-sm font-medium transition-colors"
      >
        {copied ? '已复制 ✓' : '复制全文'}
      </button>
      <button
        onClick={handleExportPng}
        disabled={exporting}
        className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-800
          text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {exporting ? '导出中...' : '转 PNG'}
      </button>
    </div>
  )
}
