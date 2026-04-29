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
