const KEY = 'pdfworkbench.theme.v1'

export type Theme = 'light' | 'dark'

export function initTheme(): Theme {
  const stored = (() => {
    try {
      return localStorage.getItem(KEY) as Theme | null
    } catch {
      return null
    }
  })()
  const theme = stored ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  applyTheme(theme)
  return theme
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* private mode: the toggle still works for this session */
  }
}
