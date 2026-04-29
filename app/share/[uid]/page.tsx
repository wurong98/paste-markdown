import ShareActions from '@/components/ShareActions'
import { highlightCode } from '@/lib/highlight'
import { getShare } from '@/lib/storage'
import { marked, Renderer } from 'marked'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ uid: string }>
}

async function renderMarkdown(content: string): Promise<string> {
  const renderer = new Renderer()

  renderer.code = ({ text, lang }) => {
    return `__CODE_PLACEHOLDER_${encodeURIComponent(JSON.stringify({ text, lang: lang ?? 'plaintext' }))}__`
  }

  let html = await marked(content, { renderer, async: false }) as string

  const placeholders = html.match(/__CODE_PLACEHOLDER_[^_]+__/g) ?? []
  for (const placeholder of placeholders) {
    const encoded = placeholder.replace('__CODE_PLACEHOLDER_', '').replace('__', '')
    const { text, lang } = JSON.parse(decodeURIComponent(encoded))
    const highlighted = await highlightCode(text, lang)
    html = html.replace(placeholder, `<div class="not-prose my-4">${highlighted}</div>`)
  }

  return html
}

export default async function SharePage({ params }: Props) {
  const { uid } = await params
  const data = await getShare(uid)
  if (!data) notFound()

  const html = await renderMarkdown(data.content)

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
      {/* 顶部导航栏 */}
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
        <div
          className="prose prose-slate max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
