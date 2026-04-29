import ShareActions from '@/components/ShareActions'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { highlightCode } from '@/lib/highlight'
import { getShare } from '@/lib/storage'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ uid: string }>
}

async function buildHighlightedBlocks(content: string): Promise<Record<string, string>> {
  const blocks: Record<string, string> = {}
  const fenceRe = /```(\w*)\n([\s\S]*?)```/g
  let match
  while ((match = fenceRe.exec(content)) !== null) {
    const lang = match[1] || 'plaintext'
    const text = match[2].replace(/\n$/, '')
    const key = `${lang}:${text}`
    if (!blocks[key]) {
      blocks[key] = await highlightCode(text, lang)
    }
  }
  return blocks
}

export default async function SharePage({ params }: Props) {
  const { uid } = await params
  const data = await getShare(uid)
  if (!data) notFound()

  const highlightedBlocks = await buildHighlightedBlocks(data.content)

  const createdAt = new Date(data.createdAt).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  const expiresAt = new Date(data.expiresAt).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          ← 新建分享
        </Link>
        <ShareActions rawContent={data.content} contentSelector="#md-content" />
      </div>

      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
        创建于 {createdAt} · 将于 {expiresAt} 过期
      </div>

      <div
        id="md-content"
        className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 md:p-10"
      >
        <MarkdownRenderer content={data.content} highlightedBlocks={highlightedBlocks} />
      </div>
    </div>
  )
}
