# Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为所有页面添加白天/夜晚/跟随系统三态主题切换功能，零依赖，防止 FOUC 闪烁。

**Architecture:** 将 Tailwind darkMode 从 `'media'` 改为 `'class'`，由 `<html>` 上的 `dark` class 控制主题。新建 `ThemeToggle` 客户端组件管理三态（system/light/dark）并同步到 localStorage。在 layout.tsx 的 `<head>` 注入同步内联脚本，在 hydration 之前应用初始主题，避免 FOUC。

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, TypeScript, localStorage, matchMedia API

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `tailwind.config.ts` | 修改 | darkMode 改为 'class' |
| `app/globals.css` | 修改 | 删除 media query dark 块，shiki dark 改为 .dark 选择器 |
| `app/layout.tsx` | 修改 | 注入防闪烁脚本 |
| `components/ThemeToggle.tsx` | 新建 | 三态切换客户端组件 |
| `app/page.tsx` | 修改 | header 右侧加入 ThemeToggle |
| `app/share/[uid]/page.tsx` | 修改 | 顶部操作栏加入 ThemeToggle |

---

### Task 1: 修改 Tailwind 配置和全局 CSS

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: 修改 tailwind.config.ts**

将 `darkMode: 'media'` 改为 `darkMode: 'class'`：

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
```

- [ ] **Step 2: 修改 app/globals.css**

删除两处 `@media (prefers-color-scheme: dark)` 块，改为 `.dark` 选择器。完整文件内容：

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

/* shiki dual-theme support */
.shiki,
.shiki span {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
}

.dark .shiki,
.dark .shiki span {
  color: var(--shiki-dark);
  background-color: var(--shiki-dark-bg);
}

.shiki {
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.6;
}
```

- [ ] **Step 3: 提交**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat: switch Tailwind darkMode to class-based"
```

---

### Task 2: 新建 ThemeToggle 组件

**Files:**
- Create: `components/ThemeToggle.tsx`

- [ ] **Step 1: 创建组件文件**

```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add components/ThemeToggle.tsx
git commit -m "feat: add ThemeToggle component with system/light/dark modes"
```

---

### Task 3: 添加防闪烁脚本到 layout.tsx

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: 修改 layout.tsx，添加防闪烁脚本**

在 `<html>` 标签内、`<body>` 之前添加内联 `<script>`。注意使用 `dangerouslySetInnerHTML` 并在 `<head>` 中注入：

```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Paste Markdown',
  description: '快速分享 Markdown，自动渲染，支持过期时间',
}

const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
  } catch(e) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add app/layout.tsx
git commit -m "feat: inject anti-FOUC theme script in layout head"
```

---

### Task 4: 集成 ThemeToggle 到首页

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 修改 app/page.tsx，在 header 右侧添加 ThemeToggle**

在文件顶部 import 区域加入：
```typescript
import ThemeToggle from '@/components/ThemeToggle'
```

将 `<header>` 部分改为：
```tsx
<header className="mb-8 flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
      Paste Markdown
    </h1>
    <p className="text-slate-500 text-sm mt-1">快速分享 Markdown，自动渲染，支持过期时间</p>
  </div>
  <ThemeToggle />
</header>
```

- [ ] **Step 2: 提交**

```bash
git add app/page.tsx
git commit -m "feat: add ThemeToggle to homepage header"
```

---

### Task 5: 集成 ThemeToggle 到分享详情页

**Files:**
- Modify: `app/share/[uid]/page.tsx`

- [ ] **Step 1: 修改 app/share/[uid]/page.tsx，在顶部操作栏添加 ThemeToggle**

在文件顶部 import 区域加入：
```typescript
import ThemeToggle from '@/components/ThemeToggle'
```

将顶部 `<div className="flex items-center justify-between mb-6">` 内容改为：
```tsx
<div className="flex items-center justify-between mb-6">
  <Link
    href="/"
    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
  >
    ← 新建分享
  </Link>
  <div className="flex items-center gap-2">
    <ThemeToggle />
    <ShareActions rawContent={data.content} contentSelector="#md-content" />
  </div>
</div>
```

- [ ] **Step 2: 提交**

```bash
git add app/share/[uid]/page.tsx
git commit -m "feat: add ThemeToggle to share page header"
```

---

### Task 6: 手动验证

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

打开 http://localhost:3000，验证：
1. 首页 header 右侧出现主题切换按钮（默认显示 🌐）
2. 点击循环：🌐 → ☀️ → 🌙 → 🌐
3. 切换到 🌙 后，页面变为暗色；切换到 ☀️ 后，页面变为亮色
4. 刷新页面后，主题保持（localStorage 持久化）
5. 切换到 🌐 后，跟随系统（可在系统设置切换验证）

- [ ] **Step 2: 验证分享页**

创建一个分享链接，打开分享页，验证：
1. 顶部操作栏右侧出现主题切换按钮
2. 首页切换的主题在分享页也生效（同一个 localStorage key）

- [ ] **Step 3: 验证防闪烁**

以暗色模式打开页面（系统切换到暗色），硬刷新（Ctrl+Shift+R），确认没有白色闪烁。
