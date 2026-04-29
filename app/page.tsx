'use client'

import ExpiresSelect from '@/components/ExpiresSelect'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import ShareLink from '@/components/ShareLink'
import UploadArea from '@/components/UploadArea'
import { useState } from 'react'

const SAMPLE = `# 欢迎使用 Paste Markdown

粘贴或拖入你的 **Markdown** 文件，生成分享链接。

## 支持语法

- [x] GFM 表格 / 任务列表
- [x] 代码高亮（shiki）
- [x] 数学公式（KaTeX）
- [x] 删除线 ~~text~~

\`\`\`typescript
const greet = (name: string) => \`Hello, \${name}!\`
console.log(greet('World'))
\`\`\`
`

interface ShareResult {
  url: string
  expiresAt: string
}

export default function HomePage() {
  const [content, setContent] = useState(SAMPLE)
  const [expiresIn, setExpiresIn] = useState('1d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [share, setShare] = useState<ShareResult | null>(null)

  async function handleShare() {
    if (!content.trim()) {
      setError('请输入 Markdown 内容')
      return
    }
    setLoading(true)
    setError('')
    setShare(null)

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, expiresIn }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? '请求失败')
      } else {
        setShare({ url: data.shareUrl, expiresAt: data.expiresAt })
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setContent('')
    setShare(null)
    setError('')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Paste Markdown
        </h1>
        <p className="text-slate-500 text-sm mt-1">快速分享 Markdown，自动渲染，支持过期时间</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">编辑</p>
          <UploadArea value={content} onChange={setContent} />
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">预览</p>
          <div className="flex-1 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 overflow-auto min-h-[400px]">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <ExpiresSelect value={expiresIn} onChange={setExpiresIn} />
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            清空
          </button>
          <button
            onClick={handleShare}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {loading ? '生成中...' : '→ 生成分享链接'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 p-3 text-red-700 dark:text-red-300 text-sm mb-4">
          ✗ {error}
        </div>
      )}

      {share && <ShareLink url={share.url} expiresAt={share.expiresAt} />}
    </div>
  )
}
