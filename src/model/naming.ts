import type { Output } from './pages'

const base = (name: string) => name.replace(/\.pdf$/i, '')

/**
 * File names for every output at once: the first one sets the stem — its own name if it was
 * renamed, otherwise the document it starts with — and the splits after it are numbered from it.
 */
export function outputNames(docNames: Record<string, string>, outputs: readonly Output[]): string[] {
  const first = outputs[0]
  const stem = base(first?.name?.trim() || docNames[first?.pages[0].docId ?? ''] || 'merged')
  return outputs.map((output, i) => {
    const given = output.name?.trim()
    if (given) return `${base(given)}.pdf`
    return i === 0 ? `${stem}.pdf` : `${stem}-${i + 1}.pdf`
  })
}
