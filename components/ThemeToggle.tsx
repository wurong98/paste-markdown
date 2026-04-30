'use client'

import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

const ICONS: Record<Theme, string> = {
  system: '🌐',
  light: '☀️',
  dark: '🌙',
}

const NEXT: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const LABELS: Record<Theme, string> = {
  system: '跟随系统 → 切换为白天',
  light: '白天模式 → 切换为夜晚',
  dark: '夜晚模式 → 切换为跟随系统',
}

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'system'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  // 初始化：从 localStorage 读取
  useEffect(() => {
    setTheme(getInitialTheme())
  }, [])

  // 监听系统主题变化（仅 system 模式）
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // 每次 theme 变化时应用
  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  function toggle() {
    setTheme(prev => NEXT[prev])
  }

  return (
    <button
      onClick={toggle}
      title={LABELS[theme]}
      className="text-xl w-9 h-9 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={LABELS[theme]}
    >
      {ICONS[theme]}
    </button>
  )
}
