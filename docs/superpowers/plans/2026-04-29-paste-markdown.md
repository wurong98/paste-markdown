# Paste Markdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个轻量级 Markdown 临时分享工具，用户可粘贴/拖拽上传 Markdown，获得带过期时间的唯一链接，访问时自动渲染。

**Architecture:** Next.js 15 App Router，API Routes 处理创建/读取分享，文件系统 JSON 存储，懒删除过期策略。首页双栏（编辑+预览），分享详情页 SSR 渲染。

**Tech Stack:** Next.js 15, React, Tailwind CSS, react-markdown, remark-gfm, remark-math, rehype-katex, shiki, Bun

---

## File Map

| 文件 | 职责 |
|---|---|
| `lib/constants.ts` | 常量：过期时间映射、最大内容大小、合法 expiresIn 值 |
| `lib/uid.ts` | 生成 12 字符 base62 UID |
| `lib/storage.ts` | 读写 JSON 文件、过期检查、懒删除 |
| `lib/highlight.ts` | shiki 服务端封装（`codeToHtml`） |
| `app/api/share/route.ts` | `POST /api/share` — 创建分享 |
| `app/api/share/[uid]/route.ts` | `GET /api/share/[uid]` — 获取分享 |
| `components/UploadArea.tsx` | 拖拽 + 粘贴区域（含 textarea） |
| `components/ExpiresSelect.tsx` | 过期时间下拉框 + 过期提示 |
| `components/MarkdownRenderer.tsx` | react-markdown 封装，统一渲染逻辑 |
| `components/ShareLink.tsx` | 分享链接展示 + 一键复制 |
| `app/page.tsx` | 首页（编辑 + 实时预览 + 分享） |
| `app/share/[uid]/page.tsx` | 分享详情页（SSR） |
| `app/share/[uid]/not-found.tsx` | 过期/不存在提示页 |
| `app/layout.tsx` | 根布局（字体、全局样式） |
| `data/shares/` | JSON 文件存储目录（gitignored） |

---

## Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.gitignore`

- [ ] **Step 1: 用 Bun 创建 Next.js 项目**

```bash
bun create next-app . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

当提示"目录已有文件"时选择继续。

- [ ] **Step 2: 安装 Markdown 和高亮依赖**

```bash
bun add react-markdown remark-gfm remark-math rehype-katex shiki
```

- [ ] **Step 3: 确认 next.config.ts 允许服务端使用 shiki**

编辑 `next.config.ts`，内容如下：

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['shiki'],
  },
}

export default nextConfig
```

- [ ] **Step 4: 在 .gitignore 追加数据目录**

在 `.gitignore` 末尾追加：

```
# paste-markdown data
data/shares/
```

- [ ] **Step 5: 创建数据目录并添加占位文件**

```bash
mkdir -p data/shares
touch data/shares/.gitkeep
```

- [ ] **Step 6: 确认项目能启动**

```bash
bun run dev &
sleep 3
curl -s http://localhost:3000 | head -5
kill %1
```

期望：输出 HTML 内容（`<!DOCTYPE html>` 或 Next.js 默认页面片段）。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "chore: init Next.js project with Tailwind + Markdown deps"
```

---

## Task 2: 常量与 UID 生成

**Files:**
- Create: `lib/constants.ts`
- Create: `lib/uid.ts`
- Create: `lib/uid.test.ts`

- [ ] **Step 1: 写常量文件**

创建 `lib/constants.ts`：

```ts
export const EXPIRES_MAP: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '5h': 5 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
}

export const VALID_EXPIRES_IN = Object.keys(EXPIRES_MAP) as Array<keyof typeof EXPIRES_MAP>

export const MAX_CONTENT_BYTES = 1024 * 1024 // 1MB

export const UID_LENGTH = 12

export const UID_PATTERN = /^[A-Za-z0-9]{12}$/

export const DATA_DIR = 'data/shares'
```

- [ ] **Step 2: 写 UID 生成失败测试**

创建 `lib/uid.test.ts`：

```ts
import { describe, expect, it } from 'bun:test'
import { generateUid } from './uid'

describe('generateUid', () => {
  it('generates 12-character alphanumeric string', () => {
    const uid = generateUid()
    expect(uid).toMatch(/^[A-Za-z0-9]{12}$/)
  })

  it('generates unique values', () => {
    const uids = new Set(Array.from({ length: 100 }, () => generateUid()))
    expect(uids.size).toBe(100)
  })
})
```

- [ ] **Step 3: 运行测试，确认失败**

```bash
bun test lib/uid.test.ts
```

期望：FAIL，错误类似 `Cannot find module './uid'`。

- [ ] **Step 4: 实现 UID 生成**

创建 `lib/uid.ts`：

```ts
import { randomBytes } from 'crypto'
import { UID_LENGTH } from './constants'

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function generateUid(): string {
  const bytes = randomBytes(UID_LENGTH * 2)
  let result = ''
  for (let i = 0; i < bytes.length && result.length < UID_LENGTH; i++) {
    const idx = bytes[i] % BASE62.length
    result += BASE62[idx]
  }
  return result
}
```

- [ ] **Step 5: 运行测试，确认通过**

```bash
bun test lib/uid.test.ts
```

期望：2 tests passed。

- [ ] **Step 6: 提交**

```bash
git add lib/
git commit -m "feat: add constants and uid generator"
```

---

## Task 3: 文件存储层

**Files:**
- Create: `lib/storage.ts`
- Create: `lib/storage.test.ts`

- [ ] **Step 1: 写存储层失败测试**

创建 `lib/storage.test.ts`：

```ts
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync } from 'fs'
import { join } from 'path'

// 测试时使用临时目录
process.env.DATA_DIR_OVERRIDE = 'data/test-shares'

import { deleteShare, getShare, saveShare } from './storage'

const TEST_DIR = 'data/test-shares'

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true })
})

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('saveShare', () => {
  it('saves and returns share data', async () => {
    const result = await saveShare('# Hello', '1h')
    expect(result.uid).toMatch(/^[A-Za-z0-9]{12}$/)
    expect(result.content).toBe('# Hello')
    expect(result.expiresIn).toBe('1h')
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('getShare', () => {
  it('returns null for nonexistent uid', async () => {
    const result = await getShare('nonexistent12')
    expect(result).toBeNull()
  })

  it('returns share content when valid', async () => {
    const saved = await saveShare('# Test', '1d')
    const result = await getShare(saved.uid)
    expect(result).not.toBeNull()
    expect(result!.content).toBe('# Test')
  })

  it('returns null and deletes file for expired share', async () => {
    // 直接写一个已过期的 JSON 文件
    const { writeFileSync } = await import('fs')
    const uid = 'expiredtest12'
    const expired = {
      uid,
      content: '# Expired',
      contentHash: 'sha256:abc',
      createdAt: new Date(Date.now() - 2000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      expiresIn: '1h',
      version: 1,
    }
    writeFileSync(join(TEST_DIR, `${uid}.json`), JSON.stringify(expired))

    const result = await getShare(uid)
    expect(result).toBeNull()

    // 文件应已被删除
    const { existsSync } = await import('fs')
    expect(existsSync(join(TEST_DIR, `${uid}.json`))).toBe(false)
  })
})

describe('deleteShare', () => {
  it('deletes existing share file', async () => {
    const saved = await saveShare('# Del', '1h')
    await deleteShare(saved.uid)
    const result = await getShare(saved.uid)
    expect(result).toBeNull()
  })

  it('does not throw for nonexistent uid', async () => {
    await expect(deleteShare('notfound1234')).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
bun test lib/storage.test.ts
```

期望：FAIL，错误类似 `Cannot find module './storage'`。

- [ ] **Step 3: 实现存储层**

创建 `lib/storage.ts`：

```ts
import { createHash } from 'crypto'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { DATA_DIR, EXPIRES_MAP, MAX_CONTENT_BYTES, UID_PATTERN, VALID_EXPIRES_IN } from './constants'
import { generateUid } from './uid'

const dataDir = process.env.DATA_DIR_OVERRIDE ?? DATA_DIR

function ensureDataDir() {
  mkdirSync(dataDir, { recursive: true })
}

export interface ShareData {
  uid: string
  content: string
  contentHash: string
  createdAt: string
  expiresAt: string
  expiresIn: string
  version: number
}

export async function saveShare(content: string, expiresIn: string): Promise<ShareData> {
  if (!VALID_EXPIRES_IN.includes(expiresIn as never)) {
    throw new Error('Invalid expiresIn value')
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
    throw new Error('Content exceeds maximum size (1MB)')
  }

  ensureDataDir()

  const uid = generateUid()
  const now = Date.now()
  const contentHash = 'sha256:' + createHash('sha256').update(content).digest('hex')
  const data: ShareData = {
    uid,
    content,
    contentHash,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + EXPIRES_MAP[expiresIn]).toISOString(),
    expiresIn,
    version: 1,
  }

  writeFileSync(join(dataDir, `${uid}.json`), JSON.stringify(data), 'utf8')
  return data
}

export async function getShare(uid: string): Promise<ShareData | null> {
  if (!UID_PATTERN.test(uid)) return null

  const filePath = join(dataDir, `${uid}.json`)
  if (!existsSync(filePath)) return null

  let data: ShareData
  try {
    const raw = await readFile(filePath, 'utf8')
    data = JSON.parse(raw) as ShareData
  } catch {
    return null
  }

  if (Date.now() > new Date(data.expiresAt).getTime()) {
    await deleteShare(uid)
    return null
  }

  return data
}

export async function deleteShare(uid: string): Promise<void> {
  const filePath = join(dataDir, `${uid}.json`)
  try {
    rmSync(filePath)
  } catch {
    // 文件不存在时忽略
  }
}
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
bun test lib/storage.test.ts
```

期望：所有测试 passed。

- [ ] **Step 5: 提交**

```bash
git add lib/storage.ts lib/storage.test.ts
git commit -m "feat: add file storage layer with lazy delete"
```

---

## Task 4: shiki 代码高亮封装

**Files:**
- Create: `lib/highlight.ts`

- [ ] **Step 1: 实现 shiki 封装**

创建 `lib/highlight.ts`：

```ts
import { createHighlighter } from 'shiki'

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [
        'typescript', 'javascript', 'tsx', 'jsx',
        'python', 'bash', 'sh', 'json', 'yaml',
        'markdown', 'html', 'css', 'sql', 'rust',
        'go', 'java', 'c', 'cpp', 'plaintext',
      ],
    })
  }
  return highlighterPromise
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter()
  const supportedLangs = highlighter.getLoadedLanguages()
  const useLang = supportedLangs.includes(lang as never) ? lang : 'plaintext'

  return highlighter.codeToHtml(code, {
    lang: useLang,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
  })
}
```

- [ ] **Step 2: 确认 shiki 能导入**

```bash
bun -e "import { createHighlighter } from 'shiki'; console.log('ok')"
```

期望：打印 `ok`，无报错。

- [ ] **Step 3: 提交**

```bash
git add lib/highlight.ts
git commit -m "feat: add shiki server-side highlight wrapper"
```

---

## Task 5: API Routes

**Files:**
- Create: `app/api/share/route.ts`
- Create: `app/api/share/[uid]/route.ts`

- [ ] **Step 1: 实现 POST /api/share**

创建 `app/api/share/route.ts`：

```ts
import { MAX_CONTENT_BYTES, VALID_EXPIRES_IN } from '@/lib/constants'
import { saveShare } from '@/lib/storage'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { content, expiresIn } = body as Record<string, unknown>

  if (typeof content !== 'string' || content.trim() === '') {
    return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 })
  }

  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Content exceeds maximum size (1MB)' },
      { status: 413 }
    )
  }

  if (typeof expiresIn !== 'string' || !VALID_EXPIRES_IN.includes(expiresIn as never)) {
    return NextResponse.json({ success: false, error: 'Invalid expiresIn value' }, { status: 400 })
  }

  try {
    const data = await saveShare(content, expiresIn)
    const baseUrl = request.nextUrl.origin
    return NextResponse.json({
      success: true,
      uid: data.uid,
      shareUrl: `${baseUrl}/share/${data.uid}`,
      expiresAt: data.expiresAt,
    })
  } catch (err) {
    console.error('saveShare error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 实现 GET /api/share/[uid]**

创建 `app/api/share/[uid]/route.ts`：

```ts
import { UID_PATTERN } from '@/lib/constants'
import { getShare } from '@/lib/storage'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params

  if (!UID_PATTERN.test(uid)) {
    return NextResponse.json({ success: false, error: 'Share not found or expired' }, { status: 404 })
  }

  const data = await getShare(uid)
  if (!data) {
    return NextResponse.json({ success: false, error: 'Share not found or expired' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    uid: data.uid,
    content: data.content,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
  })
}
```

- [ ] **Step 3: 手动测试 API（需先启动 dev server）**

```bash
bun run dev &
sleep 4

# 创建分享
curl -s -X POST http://localhost:3000/api/share \
  -H "Content-Type: application/json" \
  -d '{"content":"# Hello\n\n世界","expiresIn":"1d"}' | jq .

# 复制上面返回的 uid，替换下面的 <uid>
# curl -s http://localhost:3000/api/share/<uid> | jq .

kill %1
```

期望第一个 curl 返回：`{ "success": true, "uid": "...", "shareUrl": "...", "expiresAt": "..." }`

- [ ] **Step 4: 测试错误场景**

```bash
bun run dev &
sleep 4

# 缺少 content
curl -s -X POST http://localhost:3000/api/share \
  -H "Content-Type: application/json" \
  -d '{"expiresIn":"1d"}' | jq .
# 期望: { "success": false, "error": "content is required" }，status 400

# 非法 expiresIn
curl -s -X POST http://localhost:3000/api/share \
  -H "Content-Type: application/json" \
  -d '{"content":"# Hi","expiresIn":"2d"}' | jq .
# 期望: { "success": false, "error": "Invalid expiresIn value" }，status 400

# 不存在的 uid
curl -s http://localhost:3000/api/share/notfound1234 | jq .
# 期望: { "success": false, "error": "Share not found or expired" }，status 404

kill %1
```

- [ ] **Step 5: 提交**

```bash
git add app/api/
git commit -m "feat: add POST and GET API routes for share"
```

---

## Task 6: Markdown 渲染组件

**Files:**
- Create: `components/MarkdownRenderer.tsx`

- [ ] **Step 1: 实现 MarkdownRenderer**

创建 `components/MarkdownRenderer.tsx`：

```tsx
'use client'

import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface Props {
  content: string
  /** 服务端预渲染的代码块 HTML map（lang:code -> html），可选 */
  highlightedBlocks?: Record<string, string>
}

export default function MarkdownRenderer({ content, highlightedBlocks = {} }: Props) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
      />
      <div className="prose prose-slate max-w-none dark:prose-invert
        prose-pre:p-0 prose-pre:bg-transparent">
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

              // 服务端预渲染的代码块直接注入 HTML
              if (highlightedBlocks[key]) {
                return (
                  <div
                    className="not-prose rounded-lg overflow-auto text-sm"
                    dangerouslySetInnerHTML={{ __html: highlightedBlocks[key] }}
                  />
                )
              }

              // 行内代码
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

              // 无高亮回退
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
```

- [ ] **Step 2: 提交**

```bash
git add components/MarkdownRenderer.tsx
git commit -m "feat: add MarkdownRenderer component with GFM + math + highlight support"
```

---

## Task 7: 首页组件

**Files:**
- Create: `components/UploadArea.tsx`
- Create: `components/ExpiresSelect.tsx`
- Create: `components/ShareLink.tsx`

- [ ] **Step 1: 实现 UploadArea**

创建 `components/UploadArea.tsx`：

```tsx
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
      className={`relative flex flex-col h-full rounded-lg border-2 transition-colors
        ${dragging
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
            拖拽 .md 文件到此处<br />或直接粘贴 / 输入 Markdown
          </p>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full min-h-[400px] resize-none bg-transparent p-4
          font-mono text-sm text-slate-800 dark:text-slate-200
          focus:outline-none"
        spellCheck={false}
      />
    </div>
  )
}
```

- [ ] **Step 2: 实现 ExpiresSelect**

创建 `components/ExpiresSelect.tsx`：

```tsx
'use client'

import { EXPIRES_MAP } from '@/lib/constants'

const OPTIONS: Array<{ value: string; label: string }> = [
  { value: '1h', label: '1 小时' },
  { value: '5h', label: '5 小时' },
  { value: '1d', label: '1 天' },
  { value: '1w', label: '1 周' },
  { value: '1m', label: '1 个月' },
]

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function ExpiresSelect({ value, onChange }: Props) {
  const expiresAt = new Date(Date.now() + EXPIRES_MAP[value])
  const formatted = expiresAt.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 text-sm">
      <label htmlFor="expires" className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
        过期时间
      </label>
      <select
        id="expires"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-300 dark:border-slate-600
          bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
          px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="text-slate-400 text-xs">将于 {formatted} 过期</span>
    </div>
  )
}
```

- [ ] **Step 3: 实现 ShareLink**

创建 `components/ShareLink.tsx`：

```tsx
'use client'

import { useState } from 'react'

interface Props {
  url: string
  expiresAt: string
}

export default function ShareLink({ url, expiresAt }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatted = new Date(expiresAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-green-300 dark:border-green-700
      bg-green-50 dark:bg-green-950 p-4">
      <p className="text-green-700 dark:text-green-300 text-sm font-medium mb-2">
        ✓ 分享链接已生成（将于 {formatted} 过期）
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-md border border-green-300 dark:border-green-700
            bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200
            px-3 py-1.5 text-sm font-mono focus:outline-none"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700
            text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          {copied ? '已复制 ✓' : '复制'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
git add components/
git commit -m "feat: add UploadArea, ExpiresSelect, ShareLink components"
```

---

## Task 8: 首页

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 实现根布局**

替换 `app/layout.tsx` 内容为：

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Paste Markdown',
  description: '快速分享 Markdown，自动渲染，支持过期时间',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: 实现首页**

替换 `app/page.tsx` 内容为：

```tsx
'use client'

import ExpiresSelect from '@/components/ExpiresSelect'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import ShareLink from '@/components/ShareLink'
import UploadArea from '@/components/UploadArea'
import { useState } from 'react'

const SAMPLE = `# 欢迎使用 Paste Markdown

粘贴或拖入你的 **Markdown** 文件，生成分享链接。

## 支持语法

- [x] GFM 表格 / 任务列表
- [x] 代码高亮（shiki）
- [x] 数学公式（KaTeX）
- [x] 删除线 ~~text~~

\`\`\`typescript
const greet = (name: string) => \`Hello, \${name}!\`
console.log(greet('World'))
\`\`\`
`

interface ShareResult {
  url: string
  expiresAt: string
}

export default function HomePage() {
  const [content, setContent] = useState(SAMPLE)
  const [expiresIn, setExpiresIn] = useState('1d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [share, setShare] = useState<ShareResult | null>(null)

  async function handleShare() {
    if (!content.trim()) {
      setError('请输入 Markdown 内容')
      return
    }
    setLoading(true)
    setError('')
    setShare(null)

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, expiresIn }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? '请求失败')
      } else {
        setShare({ url: data.shareUrl, expiresAt: data.expiresAt })
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setContent('')
    setShare(null)
    setError('')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Paste Markdown
        </h1>
        <p className="text-slate-500 text-sm mt-1">快速分享 Markdown，自动渲染，支持过期时间</p>
      </header>

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">编辑</p>
          <UploadArea value={content} onChange={setContent} />
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">预览</p>
          <div className="flex-1 rounded-lg border-2 border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-900 p-4 overflow-auto min-h-[400px]">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <ExpiresSelect value={expiresIn} onChange={setExpiresIn} />
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600
              text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-100
              dark:hover:bg-slate-800 transition-colors"
          >
            清空
          </button>
          <button
            onClick={handleShare}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white text-sm font-medium transition-colors"
          >
            {loading ? '生成中...' : '→ 生成分享链接'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-300 dark:border-red-700
          bg-red-50 dark:bg-red-950 p-3 text-red-700 dark:text-red-300 text-sm mb-4">
          ✗ {error}
        </div>
      )}

      {/* Share Link */}
      {share && <ShareLink url={share.url} expiresAt={share.expiresAt} />}
    </div>
  )
}
```

- [ ] **Step 3: 确认首页渲染正常**

```bash
bun run dev &
sleep 4
curl -s http://localhost:3000 | grep -c "Paste Markdown"
kill %1
```

期望：输出 `1` 或更大（找到页面标题）。

- [ ] **Step 4: 提交**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: implement home page with editor, preview, and share flow"
```

---

## Task 9: 分享详情页（SSR）

**Files:**
- Create: `app/share/[uid]/page.tsx`
- Create: `app/share/[uid]/not-found.tsx`

- [ ] **Step 1: 实现分享详情页**

创建 `app/share/[uid]/page.tsx`：

```tsx
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { highlightCode } from '@/lib/highlight'
import { getShare } from '@/lib/storage'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ uid: string }>
}

/** 提取 Markdown 中所有代码块，服务端批量高亮 */
async function buildHighlightedBlocks(content: string): Promise<Record<string, string>> {
  const blocks: Record<string, string> = {}
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const promises: Promise<void>[] = []

  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = match[1] ?? 'plaintext'
    const code = match[2].trimEnd()
    const key = `${lang}:${code}`
    if (!blocks[key]) {
      promises.push(
        highlightCode(code, lang).then((html) => {
          blocks[key] = html
        })
      )
    }
  }

  await Promise.all(promises)
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
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500
          hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors"
      >
        ← 新建分享
      </Link>

      {/* Meta */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700
        text-sm text-slate-500 dark:text-slate-400">
        创建于 {createdAt} · 将于 {expiresAt} 过期
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border
        border-slate-200 dark:border-slate-700 p-6 md:p-10">
        <MarkdownRenderer content={data.content} highlightedBlocks={highlightedBlocks} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 实现 not-found 页**

创建 `app/share/[uid]/not-found.tsx`：

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-6">🔗</p>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
        分享已过期或不存在
      </h1>
      <p className="text-slate-500 mb-8">
        该链接可能已过期，或从未存在。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
          bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
      >
        ← 新建分享
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: 端对端验证**

```bash
bun run dev &
sleep 4

# 创建分享，拿到 uid
UID=$(curl -s -X POST http://localhost:3000/api/share \
  -H "Content-Type: application/json" \
  -d '{"content":"# E2E Test\n\n```js\nconsole.log(1)\n```","expiresIn":"1h"}' \
  | jq -r .uid)

echo "uid: $UID"

# 访问分享详情页，确认包含内容
curl -s "http://localhost:3000/share/$UID" | grep -c "E2E Test"

# 访问不存在的 uid，确认 404 页面
curl -s "http://localhost:3000/share/notfound1234" | grep -c "已过期"

kill %1
```

期望：`uid` 打印正常，两个 `grep -c` 各输出 `1`。

- [ ] **Step 4: 提交**

```bash
git add app/share/
git commit -m "feat: add SSR share detail page with shiki highlighting and not-found page"
```

---

## Task 10: 样式打磨与响应式

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: 安装 Tailwind Typography 插件**

```bash
bun add -d @tailwindcss/typography
```

- [ ] **Step 2: 更新 tailwind.config.ts**

编辑 `tailwind.config.ts`，添加 typography 插件：

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
```

- [ ] **Step 3: 更新 globals.css，添加 shiki 双主题 CSS 变量**

在 `app/globals.css` 的现有内容后追加：

```css
/* shiki dual-theme support */
.shiki,
.shiki span {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
}

@media (prefers-color-scheme: dark) {
  .shiki,
  .shiki span {
    color: var(--shiki-dark);
    background-color: var(--shiki-dark-bg);
  }
}

.shiki {
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.6;
}
```

- [ ] **Step 4: 确认页面样式正常**

```bash
bun run dev &
sleep 4
curl -s http://localhost:3000 | grep -c "prose"
kill %1
```

期望：输出 `0`（prose 类在客户端组件中，不出现在 SSR HTML 里也正常），无报错即可。

- [ ] **Step 5: 提交**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "style: add Tailwind Typography and shiki dual-theme CSS"
```

---

## Task 11: 收尾检查

**Files:** 无新增文件

- [ ] **Step 1: 运行所有单元测试**

```bash
bun test
```

期望：所有测试 passed，无报错。

- [ ] **Step 2: 完整构建检查**

```bash
bun run build
```

期望：Build 成功，无 TypeScript 错误，无 ESLint 错误。

- [ ] **Step 3: 确认 data/shares/ 已在 .gitignore**

```bash
grep "data/shares" .gitignore
```

期望：输出 `data/shares/`。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git status  # 确认没有意外文件
git commit -m "chore: final cleanup and build verification" --allow-empty
```

---

## 自审结果

**Spec coverage 检查：**

| 需求 | 覆盖任务 |
|---|---|
| 拖拽 / 粘贴 / 输入 Markdown | Task 7 UploadArea |
| 过期时间下拉框 | Task 7 ExpiresSelect |
| 生成分享链接 + 一键复制 | Task 7 ShareLink + Task 8 首页 |
| 实时预览 | Task 8 首页（MarkdownRenderer client） |
| SSR 分享详情页 | Task 9 |
| 代码高亮（shiki） | Task 4 + Task 9 |
| GFM + 数学公式 | Task 6 |
| 懒删除 | Task 3 storage |
| API POST /api/share | Task 5 |
| API GET /api/share/[uid] | Task 5 |
| 安全：UID 格式校验 | Task 3 + Task 5 |
| 安全：禁用 HTML | Task 6 disallowedElements |
| 安全：1MB 限制 | Task 2 constants + Task 5 |
| 响应式 | Task 8（lg:grid-cols-2） |
| 404 / 过期提示页 | Task 9 not-found |
| Tailwind Typography（prose） | Task 10 |

所有需求均有对应实现任务，无遗漏。
