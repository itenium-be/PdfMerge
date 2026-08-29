import { PDFDocument, degrees } from 'pdf-lib'
import type { PageRef } from '../model/pages'

export type Sources = Record<string, Uint8Array>

export type Meta = {
  title?: string
  author?: string
}

/** Builds one PDF out of pages taken from several loaded documents, in the given order. */
export async function buildPdf(sources: Sources, pages: readonly PageRef[], meta: Meta = {}): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error('Cannot build a PDF with no pages')

  const loaded = new Map<string, PDFDocument>()
  for (const docId of new Set(pages.map(p => p.docId))) {
    const bytes = sources[docId]
    if (!bytes) throw new Error(`No source loaded for ${docId}`)
    loaded.set(docId, await PDFDocument.load(bytes))
  }

  const out = await PDFDocument.create()
  for (const page of pages) {
    const [copied] = await out.copyPages(loaded.get(page.docId)!, [page.page - 1])
    if (page.rot) copied.setRotation(degrees(copied.getRotation().angle + page.rot))
    out.addPage(copied)
  }

  if (meta.title) out.setTitle(meta.title)
  if (meta.author) out.setAuthor(meta.author)
  return out.save()
}
