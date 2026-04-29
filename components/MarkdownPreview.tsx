'use client'

import { marked } from 'marked'
import { useEffect, useState } from 'react'

interface Props {
  content: string
}

export default function MarkdownPreview({ content }: Props) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    const result = marked.parse(content, { async: false }) as string
    setHtml(result)
  }, [content])

  if (!html) {
    return <div className="text-slate-400 text-sm">开始输入内容以预览...</div>
  }

  return (
    <div
      className="prose prose-slate max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
