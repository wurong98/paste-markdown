'use client'

import { DragEvent, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
}

const ALLOWED_EXTS = ['.md', '.markdown', '.txt']

export default function UploadArea({ value, onChange }: Props) {
  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) return
    const text = await file.text()
    onChange(text)
  }

  return (
    <div
      className={`relative flex flex-col h-full rounded-lg border-2 transition-colors ${
        dragging
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
          : 'border-slate-200 dark:border-slate-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {value === '' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-slate-400 text-center text-sm px-4">
            拖拽 .md 文件到此处
            <br />
            或直接粘贴 / 输入 Markdown
          </p>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full min-h-[400px] resize-none bg-transparent p-4 font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
        spellCheck={false}
      />
    </div>
  )
}
