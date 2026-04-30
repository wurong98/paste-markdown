'use client'

import CodeBlock from '@/components/CodeBlock'
import MermaidBlock from '@/components/MermaidBlock'
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
          children={content}
          components={{
            // Override pre so it doesn't wrap our custom CodeBlock in an extra <pre>
            pre({ children }) {
              return <>{children}</>
            },
            code({ className, children, node, ...props }) {
              const match = /language-(\w+)/.exec(className ?? '')
              const lang = match?.[1] ?? ''
              const code = String(children).replace(/\n$/, '')

              // inline code — no language class AND no newlines
              if (!match) {
                if (!code.includes('\n')) {
                  return (
                    <code
                      className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded px-1 py-0.5 text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                }
                // fenced block with no language tag — fall through as plaintext
              }

              const effectiveLang = lang || 'plaintext'
              const key = `${effectiveLang}:${code}`

              if (lang === 'mermaid') {
                return <MermaidBlock code={code} />
              }

              return (
                <CodeBlock
                  code={code}
                  lang={effectiveLang}
                  highlightedHtml={highlightedBlocks[key]}
                />
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
