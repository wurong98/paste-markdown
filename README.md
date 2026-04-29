# Paste Markdown

临时 Markdown 分享工具。粘贴内容，生成链接，自动渲染，到期失效。

---

## 快速上手

### 环境要求

- [Bun](https://bun.sh) >= 1.0

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 生产构建

```bash
bun run build
bun run start
```

---

## 使用方法

### 网页端

1. 打开首页，在左侧编辑区**粘贴或输入** Markdown 内容
2. 也可以直接**拖拽** `.md` / `.markdown` / `.txt` 文件到编辑区
3. 右侧实时预览渲染效果
4. 选择**过期时间**（1小时 / 5小时 / 1天 / 1周 / 1个月）
5. 点击**「→ 生成分享链接」**
6. 复制链接分享给任何人，链接到期后自动失效

### 分享页功能

打开分享链接后：

- **复制全文** — 复制原始 Markdown 文本
- **转 PNG** — 将渲染内容导出为图片（适合截图分享）

---

## API 调用

支持通过 HTTP API 创建分享，适合脚本/机器人调用。

### 创建分享

```bash
curl -X POST https://your-domain.com/api/share \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Hello\n\n这是一段 Markdown",
    "expiresIn": "1d"
  }'
```

**参数：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `content` | string | ✅ | Markdown 内容，最大 1MB |
| `expiresIn` | string | ✅ | 过期时间：`1h` `5h` `1d` `1w` `1m` |

**返回：**

```json
{
  "success": true,
  "uid": "a1b2c3d4e5f6",
  "shareUrl": "https://your-domain.com/share/a1b2c3d4e5f6",
  "expiresAt": "2026-04-30T10:30:00Z"
}
```

### 获取分享内容

```bash
curl https://your-domain.com/api/share/a1b2c3d4e5f6
```

**返回：**

```json
{
  "success": true,
  "uid": "a1b2c3d4e5f6",
  "content": "# Hello\n\n这是一段 Markdown",
  "createdAt": "2026-04-29T10:30:00Z",
  "expiresAt": "2026-04-30T10:30:00Z"
}
```

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 15 (App Router) |
| 样式 | Tailwind CSS v4 |
| Markdown 渲染 | marked + react-markdown |
| 代码高亮 | shiki（服务端） |
| 存储 | 本地文件系统 JSON |
| 运行时 | Bun |

---

## 项目结构

```
paste-markdown/
├── app/
│   ├── page.tsx                 # 首页（输入 + 预览）
│   ├── share/[uid]/page.tsx     # 分享详情页（SSR）
│   └── api/share/               # API Routes
├── components/
│   ├── UploadArea.tsx           # 拖拽 + 输入区域
│   ├── MarkdownPreview.tsx      # 首页实时预览
│   ├── ExpiresSelect.tsx        # 过期时间选择
│   ├── ShareLink.tsx            # 分享链接展示
│   └── ShareActions.tsx         # 复制/导出按钮
├── lib/
│   ├── storage.ts               # 文件读写 + 懒删除
│   ├── uid.ts                   # UID 生成
│   ├── highlight.ts             # shiki 高亮封装
│   └── constants.ts             # 常量
└── data/shares/                 # JSON 存储（自动创建）
```

---

## 部署

### Vercel（推荐）

```bash
vercel deploy
```

> ⚠️ Vercel 无状态文件系统，`data/shares/` 不会持久化。生产环境建议挂载持久存储或替换为数据库。

### 自托管（VPS）

```bash
bun run build
bun run start
```

建议用 `pm2` 或 `systemd` 保持进程运行，并配置 Nginx 反代。

---

## 数据存储

分享内容存储为 `data/shares/{uid}.json`，采用**懒删除**策略：

- 不运行后台定时任务
- 访问时检查 `expiresAt`，过期则删除文件并返回 404
- 存储自动释放，无需维护

---

## 已知问题

- **PNG 导出长图模糊**：浏览器对超大 SVG 渲染有限制，长内容下半部分可能模糊。计划用服务端截图（Playwright）解决。
