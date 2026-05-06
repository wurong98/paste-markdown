export interface Skill {
  id: string
  name: string
  description: string
  shortDescription: string
  installCommand: string
  documentation: string
  expiryOptions?: string[]
}

export const SKILLS: Skill[] = [
  {
    id: 'paste-bit64-share',
    name: 'paste-bit64-share',
    shortDescription: '一键分享文件/文本到 paste.bit64.site',
    description: '一键分享文件或文本内容到 paste.bit64.site，支持 Markdown，生成可预览链接。',
    installCommand: `mkdir -p ~/.hermes/skills/productivity/paste-bit64-share && curl -s https://raw.githubusercontent.com/your-repo/paste-markdown/main/skills/paste-bit64-share/SKILL.md -o ~/.hermes/skills/productivity/paste-bit64-share/SKILL.md`,
    documentation: `# paste.bit64.site 一键分享

## 使用方式

### 从文件分享（推荐用法）

\`\`\`bash
jq -Rs '{"content": ., "expiresIn": "1d"}' <文件路径> \\
  | curl -s -X POST https://paste.bit64.site/api/share \\
    -H "Content-Type: application/json" \\
    -d @- \\
  | jq -r '.shareUrl'
\`\`\`

### 过期时间选项

| 值   | 说明   |
|------|--------|
| \`1h\` | 1小时  |
| \`5h\` | 5小时  |
| \`1d\` | 1天    |
| \`1w\` | 1周    |
| \`1m\` | 1月    |

## 踩坑记录

- **\`curl -d @-\` vs \`-d "$(...)"\`**：后者触发 shell 转义，特殊字符会破坏 JSON。用 \`-d @-\` 从 stdin 读取是唯一安全做法。
- **TLS 错误**：本机 curl 访问此站 TLS 握手失败时，改用 python3 requests。
- **渲染限制**：paste 站 Markdown 渲染器不支持 Unicode 表格字符（\`┌─┬┐\` 等），需要表格请用 Markdown 标准格式（\`|---|\`）。`,
  },
]
