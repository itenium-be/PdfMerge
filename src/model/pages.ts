/** One page of one loaded document, at one position in the workbench. */
export type PageRef = {
  docId: string
  /** 1-based page number in the document it came from. */
  page: number
  rot: number
  /** This page starts a new output file. */
  cut: boolean
  /** The file name for the output this page starts; meaningless on any other page. */
  name?: string
}

export type Output = {
  /** Position of the output's first page in the full page list. */
  start: number
  pages: PageRef[]
  /** What the user called this output, if they renamed it. */
  name?: string
}

export function outputs(pages: readonly PageRef[]): Output[] {
  const out: Output[] = []
  pages.forEach((page, i) => {
    if (i === 0 || page.cut) out.push({ start: i, pages: [], name: page.name })
    out[out.length - 1].pages.push(page)
  })
  return out
}

/** A cut on the first page would describe an output that starts before the document does. */
const normalize = (pages: PageRef[]): PageRef[] =>
  pages.map((page, i) => (i === 0 && page.cut ? { ...page, cut: false } : page))

export const nameOutput = (pages: readonly PageRef[], start: number, name: string): PageRef[] =>
  pages.map((page, i) => (i === start ? { ...page, name: name.trim() || undefined } : page))

export const splitBefore = (pages: readonly PageRef[], at: number): PageRef[] =>
  normalize(pages.map((page, i) => (i === at ? { ...page, cut: true } : page)))

export const joinAt = (pages: readonly PageRef[], at: number): PageRef[] =>
  pages.map((page, i) => (i === at ? { ...page, cut: false } : page))

export function movePages(pages: readonly PageRef[], moving: readonly number[], to: number): PageRef[] {
  const picked = new Set(moving)
  const target = pages[to]
  /* A moved page no longer starts the output it was named for, so the name goes with the cut. */
  const carried = pages.filter((_, i) => picked.has(i)).map(page => ({ ...page, cut: false, name: undefined }))
  const rest = pages.filter((_, i) => !picked.has(i))
  const at = rest.indexOf(target)
  const insert = at === -1 ? rest.length : at
  return normalize([...rest.slice(0, insert), ...carried, ...rest.slice(insert)])
}

export function removePages(pages: readonly PageRef[], removing: readonly number[]): PageRef[] {
  const dropped = new Set(removing)
  const kept: PageRef[] = []
  let orphaned: { cut: boolean; name?: string } | null = null
  pages.forEach((page, i) => {
    if (dropped.has(i)) {
      if (page.cut || page.name) orphaned = { cut: page.cut || !!orphaned?.cut, name: page.name ?? orphaned?.name }
      return
    }
    kept.push(orphaned ? { ...page, cut: orphaned.cut, name: orphaned.name ?? page.name } : page)
    orphaned = null
  })
  return normalize(kept)
}

export const rotatePages = (pages: readonly PageRef[], turning: readonly number[], degrees: number): PageRef[] => {
  const picked = new Set(turning)
  return pages.map((page, i) => (picked.has(i) ? { ...page, rot: (((page.rot + degrees) % 360) + 360) % 360 } : page))
}
