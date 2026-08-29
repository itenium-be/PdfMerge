import type { PageRef } from './pages'

const base = (name: string) => name.replace(/\.pdf$/i, '')

/** Names one output after the document it came from, or "merged" when it draws on several. */
export function outputName(
  docNames: Record<string, string>,
  pages: readonly PageRef[],
  index: number,
  total: number,
): string {
  const sources = new Set(pages.map(p => p.docId))
  const stem = sources.size === 1 ? base(docNames[[...sources][0]] ?? 'merged') : 'merged'
  return total === 1 ? `${stem}.pdf` : `${stem}-${index + 1}.pdf`
}
