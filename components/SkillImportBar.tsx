'use client'

import { useState } from 'react'
import { SKILLS } from '@/lib/skills'
import MarkdownRenderer from '@/components/MarkdownRenderer'

const FEEDBACK_RESET_TIMEOUT = 2000

interface SkillImportBarProps {
  skillId?: string
}

export default function SkillImportBar({ skillId }: SkillImportBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const skill = SKILLS.find(s => s.id === skillId) || SKILLS[0]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(skill.installCommand)
      setCopied(true)
      setCopyError(false)
      setTimeout(() => setCopied(false), FEEDBACK_RESET_TIMEOUT)
    } catch (err) {
      console.error('Failed to copy:', err)
      setCopyError(true)
      setTimeout(() => setCopyError(false), FEEDBACK_RESET_TIMEOUT)
    }
  }

  return (
    <div className="mb-6 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 rounded-lg">
      {/* 折叠状态 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-lg">📦</span>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              有用的 Skill：{skill.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {skill.shortDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`px-3 py-1 rounded text-sm text-white transition-colors whitespace-nowrap ${
              copyError
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {copyError ? '❌ 复制失败' : copied ? '✓ 已复制' : '复制导入命令'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 rounded text-sm border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </div>

      {/* 展开状态 */}
      {expanded && (
        <div className="border-t border-blue-300 dark:border-blue-700 p-4 bg-white dark:bg-slate-900 rounded-b-lg">
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              安装命令
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-sm overflow-x-auto text-slate-700 dark:text-slate-300 break-all">
              {skill.installCommand}
            </div>
          </div>

          <div className="text-sm text-slate-700 dark:text-slate-300 prose dark:prose-invert max-w-none">
            <MarkdownRenderer content={skill.documentation} />
          </div>
        </div>
      )}
    </div>
  )
}
