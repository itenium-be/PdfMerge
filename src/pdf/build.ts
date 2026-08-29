import type { PDFDocument } from 'pdf-lib'
import type { PageRef } from '../model/pages'
import { fitInside, sniff } from './kind'

/** Images get a page of their own; A4 keeps them stackable with the documents around them. */
export const A4: [number, number] = [595.28, 841.89]

export type Sources = Record<string, Uint8Array>

export type Meta = {
  title?: string
  author?: string
}

/** Builds one PDF out of pages taken from several loaded documents, in the given order. */
export async function buildPdf(sources: Sources, pages: readonly PageRef[], meta: Meta = {}): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error('Cannot build a PDF with no pages')

  const { PDFDocument, degrees } = await import('pdf-lib')

  const out = await PDFDocument.create()
  const loaded = new Map<string, PDFDocument>()
  for (const docId of new Set(pages.map(p => p.docId))) {
    const bytes = sources[docId]
    if (!bytes) throw new Error(`No source loaded for ${docId}`)
    if (sniff(bytes) === 'pdf') loaded.set(docId, await PDFDocument.load(bytes))
  }

  for (const page of pages) {
    const source = loaded.get(page.docId)
    if (source) {
      const [copied] = await out.copyPages(source, [page.page - 1])
      if (page.rot) copied.setRotation(degrees(copied.getRotation().angle + page.rot))
      out.addPage(copied)
      continue
    }

    const bytes = sources[page.docId]
    const image = sniff(bytes) === 'png' ? await out.embedPng(bytes) : await out.embedJpg(bytes)
    const sheet = out.addPage(A4)
    sheet.drawImage(image, fitInside(image.width, image.height, ...A4))
    if (page.rot) sheet.setRotation(degrees(page.rot))
  }

  if (meta.title) out.setTitle(meta.title)
  if (meta.author) out.setAuthor(meta.author)
  return out.save()
}
