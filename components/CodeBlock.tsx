'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  code: string
  lang: string
  highlightedHtml?: string
}

export default function CodeBlock({ code, lang, highlightedHtml }: Props) {
  const [html, setHtml] = useState<string | null>(highlightedHtml ?? null)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (highlightedHtml) {
      setHtml(highlightedHtml)
      return
    }
    let cancelled = false
    async function highlight() {
      const { createHighlighter } = await import('shiki')
      if (cancelled) return
      const highlighter = await createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: [
          'typescript', 'javascript', 'tsx', 'jsx',
          'python', 'bash', 'sh', 'json', 'yaml',
          'markdown', 'html', 'css', 'sql', 'rust',
          'go', 'java', 'c', 'cpp', 'plaintext',
        ],
      })
      if (cancelled) return
      const supportedLangs = highlighter.getLoadedLanguages()
      const useLang = supportedLangs.includes(lang as never) ? lang : 'plaintext'
      const result = highlighter.codeToHtml(code, {
        lang: useLang,
        themes: { light: 'github-light', dark: 'github-dark' },
      })
      setHtml(result)
    }
    highlight()
    return () => { cancelled = true }
  }, [code, lang, highlightedHtml])

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="not-prose group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 my-4">
      {/* header bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 select-none">
          {lang || 'plaintext'}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
        >
          {copied ? '✓ 已复制' : '复制'}
        </button>
      </div>

      {/* code body */}
      {html ? (
        <div
          className="overflow-auto [&>pre]:!m-0 [&>pre]:!rounded-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-4 overflow-auto bg-white dark:bg-slate-900">
          <code className="font-mono text-sm text-slate-800 dark:text-slate-100">{code}</code>
        </pre>
      )}
    </div>
  )
}
