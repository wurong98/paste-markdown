'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  code: string
}

let mermaidInitialized = false

export default function MermaidBlock({ code }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, theme: 'default' })
          mermaidInitialized = true
        }
        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(id, code)
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg
        }
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }

    render()
    return () => { cancelled = true }
  }, [code])

  if (error) {
    return (
      <pre className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg p-4 text-sm overflow-auto">
        {error}
      </pre>
    )
  }

  return <div ref={ref} className="my-4 flex justify-center" />
}
