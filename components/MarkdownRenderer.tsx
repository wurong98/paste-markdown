'use client'

import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface Props {
  content: string
  highlightedBlocks?: Record<string, string>
}

export default function MarkdownRenderer({ content, highlightedBlocks = {} }: Props) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
      />
      <div className="prose prose-slate max-w-none dark:prose-invert prose-pre:p-0 prose-pre:bg-transparent">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          disallowedElements={['script', 'iframe', 'object', 'embed']}
          unwrapDisallowed
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className ?? '')
              const lang = match?.[1] ?? ''
              const code = String(children).replace(/\n$/, '')
              const key = `${lang}:${code}`

              if (highlightedBlocks[key]) {
                return (
                  <div
                    className="not-prose rounded-lg overflow-auto text-sm"
                    dangerouslySetInnerHTML={{ __html: highlightedBlocks[key] }}
                  />
                )
              }

              if (!match) {
                return (
                  <code
                    className="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                )
              }

              return (
                <pre className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-auto">
                  <code className={`font-mono text-sm ${className ?? ''}`} {...props}>
                    {children}
                  </code>
                </pre>
              )
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto">
                  <table className="border-collapse border border-slate-300 dark:border-slate-600">
                    {children}
                  </table>
                </div>
              )
            },
            th({ children }) {
              return (
                <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 bg-slate-50 dark:bg-slate-800 font-semibold text-left">
                  {children}
                </th>
              )
            },
            td({ children }) {
              return (
                <td className="border border-slate-300 dark:border-slate-600 px-3 py-2">
                  {children}
                </td>
              )
            },
          }}
        />
      </div>
    </>
  )
}
