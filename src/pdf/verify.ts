import type { PDFDocument } from 'pdf-lib'
import type { PageRef } from '../model/pages'
import { A4 } from './build'
import type { Sources } from './build'
import { sniff } from './kind'

const size = (w: number, h: number) => Math.round(w) + '×' + Math.round(h)

/**
 * Reads a built PDF back and checks it against the pages it was supposed to contain.
 * Page size and rotation are the only per-page facts a reader can compare without
 * re-rendering, which is what makes them worth checking: a mix-up shows up here.
 */
export async function verifyBuild(
  sources: Sources,
  pages: readonly PageRef[],
  built: Uint8Array,
): Promise<string | null> {
  const { PDFDocument } = await import('pdf-lib')
  const out = await PDFDocument.load(built)
  const actual = out.getPages()
  if (actual.length !== pages.length) {
    return `Expected ${pages.length} pages, got ${actual.length}`
  }

  const loaded = new Map<string, PDFDocument>()
  for (const docId of new Set(pages.map(p => p.docId))) {
    if (sniff(sources[docId]) === 'pdf') loaded.set(docId, await PDFDocument.load(sources[docId]))
  }

  for (const [i, want] of pages.entries()) {
    const from = loaded.get(want.docId)?.getPages()[want.page - 1]
    const got = actual[i]
    const turned = ((from?.getRotation().angle ?? 0) + want.rot) % 360
    const expected = from ? size(from.getWidth(), from.getHeight()) : size(...A4)
    const found = size(got.getWidth(), got.getHeight())
    if (found !== expected) return `Page ${i + 1} is ${found}, expected ${expected}`
    if (got.getRotation().angle % 360 !== turned) {
      return `Page ${i + 1} has rotation ${got.getRotation().angle}°, expected ${turned}°`
    }
  }
  return null
}
