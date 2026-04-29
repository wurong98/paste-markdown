# Paste Markdown 设计文档

**日期**: 2026-04-29
**项目**: Paste Markdown — 临时 Markdown 分享工具

---

## 1. 项目概述

Paste Markdown 是一个轻量级的临时文件分享工具，用户可以：

- 上传或粘贴 Markdown 内容
- 设置过期时间（1小时、5小时、1天、1周、1个月）
- 获得唯一分享链接
- 其他用户通过链接访问时自动渲染 Markdown

**设计目标**：

- Markdown 显示效果最优（GitHub 级别 + 代码高亮）
- 简洁易用的前端交互
- API 优先设计，便于机器人/脚本调用
- 轻量级文件存储，无需数据库

**访问控制**：纯公开分享，通过不可预测的 UID 实现"隐匿"（不可猜测而非加密）。

---

## 2. 技术栈

| 层 | 技术 | 选型理由 |
|---|---|---|
| 框架 | Next.js 15 (App Router) | SSR、API Routes、Vercel 部署友好 |
| 前端 | React + Tailwind CSS | 样式灵活，组件化 |
| Markdown 渲染 | react-markdown + remark-gfm | 最稳定的 React Markdown 方案，支持 GFM 表格/任务列表/删除线 |
| 代码高亮 | shiki（服务端） | 比 prism 更好看，主题丰富，Next.js SSR 友好 |
| 存储 | 本地文件系统 JSON | 轻量，无需数据库 |
| 运行时 | Node.js / Bun | 均可，Bun 启动更快 |

**核心依赖**：

```
react-markdown
remark-gfm
remark-math
rehype-katex
shiki
```

---

## 3. 功能需求

### 3.1 用户端功能

1. **输入 Markdown**
   - 拖拽 `.md` / `.markdown` / `.txt` 文件到指定区域
   - 粘贴 Markdown 文本到文本框（Ctrl+V 时自动填充）
   - 直接在 textarea 中手动输入

2. **设置过期时间**
   - 下拉框：1小时、5小时、1天（默认）、1周、1个月
   - 选中后实时显示"将于 XX 后过期"

3. **生成分享链接**
   - 点击"分享"按钮后提交，生成唯一链接
   - 一键复制，复制后 2 秒内显示"已复制 ✓"

4. **Markdown 渲染展示**
   - 实时预览（textarea 与预览并排或切换 Tab）
   - 完整 GFM 支持：表格、任务列表、删除线、脚注
   - 代码块语法高亮（shiki，服务端渲染，无需客户端 JS）
   - 响应式布局（移动端 100vw，桌面最大 900px）

### 3.2 API 端功能

1. `POST /api/share` — 创建分享
2. `GET /api/share/[uid]` — 获取分享内容（JSON）
3. 懒删除：访问时检查过期，过期即删除并返回 404

---

## 4. 数据模型

### 4.1 文件存储

**位置**：`./data/shares/{uid}.json`

**结构**：

```json
{
  "uid": "a1b2c3d4e5f6",
  "content": "# 标题\n\n内容...",
  "contentHash": "sha256:abcdef...",
  "createdAt": "2026-04-29T10:30:00Z",
  "expiresAt": "2026-04-29T11:30:00Z",
  "expiresIn": "1h",
  "version": 1
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `uid` | string | 12 字符，`[A-Za-z0-9]`，随机生成 |
| `content` | string | 原始 Markdown 文本，最大 1MB |
| `contentHash` | string | `sha256:` 前缀 + hex，用于去重/缓存 |
| `createdAt` | ISO 8601 | 创建时间 |
| `expiresAt` | ISO 8601 | 过期时间 |
| `expiresIn` | enum | `1h` `5h` `1d` `1w` `1m` |
| `version` | number | 数据格式版本（当前为 1） |

---

## 5. API 设计

### 5.1 创建分享

```
POST /api/share
Content-Type: application/json

{
  "content": "# 标题\n\n内容",
  "expiresIn": "1d"
}
```

**参数**：

- `content`（string，必填）：Markdown 内容，最大 1MB（1,048,576 字节）
- `expiresIn`（string，必填）：枚举 `1h` `5h` `1d` `1w` `1m`

**成功响应（200）**：

```json
{
  "success": true,
  "uid": "a1b2c3d4e5f6",
  "shareUrl": "https://domain.com/share/a1b2c3d4e5f6",
  "expiresAt": "2026-04-29T11:30:00Z"
}
```

**错误响应**：

| 场景 | 状态码 | error 字段 |
|---|---|---|
| content 缺失或为空 | 400 | `"content is required"` |
| expiresIn 非法值 | 400 | `"Invalid expiresIn value"` |
| content 超过 1MB | 413 | `"Content exceeds maximum size (1MB)"` |
| 服务器错误 | 500 | `"Internal server error"` |

---

### 5.2 获取分享

```
GET /api/share/[uid]
```

**成功响应（200）**：

```json
{
  "success": true,
  "uid": "a1b2c3d4e5f6",
  "content": "# 标题\n\n内容",
  "createdAt": "2026-04-29T10:30:00Z",
  "expiresAt": "2026-04-29T11:30:00Z"
}
```

**错误响应（404）**：

```json
{
  "success": false,
  "error": "Share not found or expired"
}
```

---

### 5.3 页面路由

```
GET /                 # 首页（输入 + 预览）
GET /share/[uid]      # 分享详情页（纯渲染，SSR）
```

---

## 6. 前端设计

### 6.1 首页布局（桌面双栏，移动单栏）

```
┌──────────────────────────────────────────────────┐
│  Paste Markdown                         [GitHub] │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─── 编辑 ──────────┐  ┌─── 预览 ─────────────┐│
│  │                   │  │                       ││
│  │  [拖拽/粘贴区域]  │  │  # 标题               ││
│  │  <textarea>       │  │  内容渲染...           ││
│  │                   │  │                       ││
│  └───────────────────┘  └───────────────────────┘│
│                                                  │
│  过期时间: [1天 ▼]    [清空]   [→ 生成分享链接]  │
│                                                  │
│  ✓ 链接已生成：https://... [复制]                │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 6.2 分享详情页（SSR 渲染）

```
┌──────────────────────────────────────────────────┐
│  ← 新建分享                                      │
├──────────────────────────────────────────────────┤
│  创建于 2026-04-29 10:30 · 将于 2026-04-29 11:30 过期│
├──────────────────────────────────────────────────┤
│                                                  │
│  [完整渲染后的 Markdown 内容]                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 6.3 交互细节

- **拖拽**：`dragover` 高亮边框，`drop` 读取文件内容填充 textarea
- **粘贴**：监听 `paste` 事件，直接填充 textarea
- **实时预览**：`onChange` 触发，防抖 300ms，客户端 react-markdown 渲染
- **分享链接**：点击"复制"调用 `navigator.clipboard.writeText`，2 秒后恢复按钮文字
- **过期提示**：选择过期时间后，下方显示"将于 X 后过期（YYYY-MM-DD HH:mm）"

---

## 7. Markdown 渲染配置

### 7.1 react-markdown 组件配置

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// 代码块：服务端用 shiki 渲染为 HTML，客户端预览用 shiki 的 browser bundle
```

### 7.2 支持的 Markdown 语法

| 功能 | 支持 | 插件 |
|---|---|---|
| 标题 h1–h6 | ✅ | 内置 |
| 粗体、斜体、删除线 | ✅ | remark-gfm |
| 有序/无序列表 | ✅ | 内置 |
| 任务列表 `- [x]` | ✅ | remark-gfm |
| 代码块（高亮） | ✅ | shiki |
| 行内代码 | ✅ | 内置 |
| 引用块 | ✅ | 内置 |
| 表格 | ✅ | remark-gfm |
| 链接 / 图片 | ✅ | 内置 |
| 数学公式 | ✅ | remark-math + rehype-katex |
| HTML 标签 | ❌ | 禁用（XSS 防护） |

### 7.3 代码高亮（shiki）

- **主题**：`github-light`（浅色）/ `github-dark`（深色，跟随系统）
- **渲染位置**：分享详情页在服务端渲染（`codeToHtml`），首页预览在客户端渲染（shiki browser bundle 按需加载）
- **回退**：若 shiki 未加载完成，显示无高亮代码块

---

## 8. 存储与过期处理（懒删除）

### 8.1 写入流程

1. 生成 12 字符 UID（`crypto.randomBytes` 转 base62）
2. 计算 `contentHash`（`crypto.createHash('sha256')`）
3. 构建 JSON 对象，写入 `./data/shares/{uid}.json`
4. 返回 `uid` 和 `shareUrl`

### 8.2 读取流程（懒删除）

1. 验证 UID 格式：`/^[A-Za-z0-9]{12}$/`（防止路径遍历）
2. 读取 `./data/shares/{uid}.json`，文件不存在 → 404
3. 解析 `expiresAt`，与 `Date.now()` 对比
4. 已过期 → 删除文件 → 返回 404
5. 未过期 → 返回内容

### 8.3 过期时间映射

```ts
const EXPIRES_MAP: Record<string, number> = {
  '1h':  60 * 60 * 1000,
  '5h':  5 * 60 * 60 * 1000,
  '1d':  24 * 60 * 60 * 1000,
  '1w':  7 * 24 * 60 * 60 * 1000,
  '1m':  30 * 24 * 60 * 60 * 1000,
}
```

---

## 9. 安全考虑

| 威胁 | 防护措施 |
|---|---|
| 路径遍历（`../`） | UID 严格匹配 `^[A-Za-z0-9]{12}$`，拒绝任何其他字符 |
| XSS | react-markdown 禁用 HTML（`allowElement` 不允许 `html` 节点）|
| 内容炸弹 | API 层检查 `content` 字节长度 ≤ 1MB，Next.js 设置 `bodySizeLimit` |
| 枚举 UID | 12 位 base62 ≈ 3.2×10²¹ 种，不可枚举 |
| 恶意文件上传 | 仅读取文件文本内容，不执行，不存储二进制 |

---

## 10. 错误处理

### API 层

所有错误统一格式：`{ "success": false, "error": "..." }`

### 前端层

| 场景 | 提示 |
|---|---|
| 分享成功 | 绿色横幅"✓ 分享链接已生成" |
| 文件超过 1MB | 红色提示"文件超过 1MB，请缩减内容" |
| 网络错误 | 红色提示"请求失败，请重试" |
| 访问过期分享 | 独立页面"此分享已过期或不存在" + 返回首页按钮 |
| 无效 UID 格式 | 同 404 页面 |

---

## 11. 文件结构

```
paste-markdown/
├── app/
│   ├── layout.tsx                  # 根布局（字体、全局样式）
│   ├── page.tsx                    # 首页（输入 + 实时预览）
│   ├── share/
│   │   └── [uid]/
│   │       ├── page.tsx            # 分享详情页（SSR 渲染）
│   │       └── not-found.tsx       # 过期/不存在提示页
│   └── api/
│       └── share/
│           ├── route.ts            # POST 创建分享
│           └── [uid]/
│               └── route.ts        # GET 获取分享
├── components/
│   ├── UploadArea.tsx              # 拖拽 + 粘贴区域（含 textarea）
│   ├── ExpiresSelect.tsx           # 过期时间下拉框 + 提示
│   ├── MarkdownRenderer.tsx        # 统一 Markdown 渲染组件（react-markdown）
│   ├── MarkdownPreview.tsx         # 首页实时预览（客户端）
│   └── ShareLink.tsx               # 分享链接展示 + 复制按钮
├── lib/
│   ├── storage.ts                  # 文件读写、过期检查、懒删除
│   ├── uid.ts                      # UID 生成（crypto.randomBytes + base62）
│   ├── highlight.ts                # shiki 封装（服务端 codeToHtml）
│   └── constants.ts                # EXPIRES_MAP、MAX_CONTENT_SIZE 等常量
├── data/
│   └── shares/                     # JSON 存储目录（gitignore）
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-29-paste-markdown-design.md
└── package.json
```

---

## 12. 实现步骤

1. **初始化项目** — `bun create next-app`，配置 Tailwind、依赖安装
2. **实现 `lib/` 层** — UID 生成、存储读写、过期检查、shiki 封装
3. **实现 API Routes** — `POST /api/share`、`GET /api/share/[uid]`
4. **实现首页** — `UploadArea`、`ExpiresSelect`、`MarkdownPreview`、`ShareLink`
5. **实现分享详情页** — SSR `page.tsx`，调用 `lib/storage` + `lib/highlight`
6. **样式打磨** — Tailwind 排版（prose 类）、响应式、代码块主题
7. **测试** — API 单元测试（Bun test）、手动 E2E 验证

---

## 13. 不在本期范围

- 用户认证 / 私有分享列表
- 分享访问统计
- 主题切换（深色/浅色手动切换，代码块自动跟随系统）
- Markdown 编辑器工具栏
- PDF 导出
- 密码保护
- 二维码生成

---

## 已知问题

### PNG 导出长图不清晰

**状态**: 未解决，暂时跳过

**现象**: 转 PNG 时，长内容的图片下半部分分辨率明显低于上半部分，字体模糊。

**已尝试**:
- `html2canvas` — 不支持 Tailwind v4 的 `lab()` CSS 颜色，崩溃
- `dom-to-image-more` — 输出 0 字节文件
- `html-to-image` + `pixelRatio: 3` — 短内容清晰，长内容下半部分模糊
- 导出前临时展开元素到 `scrollHeight` — 问题依旧

**根本原因猜测**: `html-to-image` 内部用 SVG `foreignObject` 渲染，浏览器对超大 SVG 有尺寸/内存限制，超过阈值后降级渲染质量。

**可能的后续方向**:
- 服务端渲染 PNG（Puppeteer / playwright 截图）
- 分段截图后拼接
- 换用 Playwright API Route 在服务端生成图片
