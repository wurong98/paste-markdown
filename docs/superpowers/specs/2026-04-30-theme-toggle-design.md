# 主题切换功能设计文档

**日期：** 2026-04-30  
**状态：** 已批准

---

## 需求

为所有页面（首页、分享详情页）添加白天 / 夜晚 / 跟随系统三态主题切换功能。

---

## 方案选择

采用 **方案 A：纯 CSS class 切换**，零额外依赖，与现有 Tailwind dark 类完全兼容。

---

## 架构

### 1. Tailwind 配置修改

`tailwind.config.ts` 中将 `darkMode` 从 `'media'` 改为 `'class'`。  
这样 dark 样式由 `<html>` 上的 `dark` class 控制，而非媒体查询。

`globals.css` 中的 `@media (prefers-color-scheme: dark)` 块也需同步删除，改为依赖 Tailwind 的 `dark:` 类。  
shiki 代码高亮的 dark 样式同理。

### 2. 防闪烁内联脚本

在 `app/layout.tsx` 的 `<head>` 中注入一段同步内联 `<script>`，在 HTML 解析阶段（React hydration 之前）立即读取 `localStorage.theme` 并决定是否给 `<html>` 添加 `dark` class，避免页面加载时出现白→暗的闪烁（FOUC）。

逻辑：
```
if localStorage.theme === 'dark'  → 添加 dark class
if localStorage.theme === 'light' → 不添加
if localStorage.theme === 'system' 或 未设置 → 读取 prefers-color-scheme 决定
```

### 3. ThemeToggle 组件

新建 `components/ThemeToggle.tsx`，客户端组件（`'use client'`）。

**三态循环：**  
`system（🌐）` → `light（☀️）` → `dark（🌙）` → `system（🌐）` → …

**状态存储：**  
`localStorage.theme`，值为 `'light'` / `'dark'` / `'system'`。初始值默认为 `'system'`。

**实际主题应用逻辑：**
- `light` → 移除 `<html>` 的 `dark` class
- `dark` → 添加 `<html>` 的 `dark` class
- `system` → 读取 `window.matchMedia('(prefers-color-scheme: dark)')` 决定，并监听 `change` 事件实时响应系统切换

**UI：**  
一个图标按钮，显示当前模式图标，有 hover 状态，带 `title` tooltip 说明当前模式及下一模式。

### 4. 页面集成

两个页面的 header 区域各放置一个 `<ThemeToggle />`：

- **首页（`app/page.tsx`）**：放在 `<header>` 右侧，与标题同行
- **分享详情页（`app/share/[uid]/page.tsx`）**：放在顶部操作栏右侧，与 `<ShareActions>` 同行

---

## 数据流

```
用户点击按钮
  → 更新 state（system/light/dark）
  → 写入 localStorage
  → 操作 document.documentElement.classList
  → Tailwind dark: 类响应变化
```

系统主题变化时（仅 system 模式）：
```
matchMedia change 事件
  → 重新计算实际主题
  → 操作 document.documentElement.classList
```

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `tailwind.config.ts` | 修改 | `darkMode: 'media'` → `darkMode: 'class'` |
| `app/globals.css` | 修改 | 删除 `@media (prefers-color-scheme: dark)` 块，shiki dark 样式改为 `.dark .shiki` |
| `app/layout.tsx` | 修改 | 添加防闪烁内联 `<script>`，引入 ThemeToggle（若需全局） |
| `components/ThemeToggle.tsx` | 新建 | 三态切换客户端组件 |
| `app/page.tsx` | 修改 | header 右侧加入 `<ThemeToggle />` |
| `app/share/[uid]/page.tsx` | 修改 | 顶部操作栏加入 `<ThemeToggle />` |

---

## 边界情况

- **SSR 阶段**：服务端无法读取 localStorage，防闪烁脚本在客户端同步执行，SSR HTML 不带 `dark` class 是正常的
- **JavaScript 禁用**：降级为跟随系统（`@media prefers-color-scheme` 在 CSS 层面仍有效，但 ThemeToggle 不可用）
- **localStorage 不可用**：用 try/catch 包裹，降级为 system 模式

---

## 不在范围内

- 动画过渡效果（可后续迭代）
- 主题持久化到服务端 / Cookie（无需登录系统，不必要）
