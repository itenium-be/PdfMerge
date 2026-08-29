import { describe, expect, test } from 'vitest'
import { PDFDocument, degrees } from 'pdf-lib'
import { buildPdf } from '../src/pdf/build'
import type { PageRef } from '../src/model/pages'

/** Every page gets its own width, so page order survives as something a test can read back. */
async function source(widths: number[], rotate = 0) {
  const doc = await PDFDocument.create()
  widths.forEach(w => doc.addPage([w, 500]).setRotation(degrees(rotate)))
  return doc.save()
}

const ref = (docId: string, page: number, extra: Partial<PageRef> = {}): PageRef =>
  ({ docId, page, rot: 0, cut: false, ...extra })

async function widthsOf(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes)
  return doc.getPages().map(p => Math.round(p.getWidth()))
}

describe('buildPdf', () => {
  test('writes the pages in the order they are given, across documents', async () => {
    const sources = { a: await source([101, 102]), b: await source([201]) }
    const out = await buildPdf(sources, [ref('b', 1), ref('a', 2), ref('a', 1)])
    expect(await widthsOf(out)).toEqual([201, 102, 101])
  })

  test('leaves out the pages that are not listed', async () => {
    const sources = { a: await source([101, 102, 103]) }
    const out = await buildPdf(sources, [ref('a', 1), ref('a', 3)])
    expect(await widthsOf(out)).toEqual([101, 103])
  })

  test('applies the rotation the workbench shows', async () => {
    const sources = { a: await source([101, 102]) }
    const out = await buildPdf(sources, [ref('a', 1, { rot: 90 }), ref('a', 2)])
    const doc = await PDFDocument.load(out)
    expect(doc.getPages().map(p => p.getRotation().angle)).toEqual([90, 0])
  })

  test('adds the workbench rotation to a page that was already rotated', async () => {
    const sources = { a: await source([101], 90) }
    const out = await buildPdf(sources, [ref('a', 1, { rot: 90 })])
    const doc = await PDFDocument.load(out)
    expect(doc.getPages()[0].getRotation().angle).toBe(180)
  })

  test('writes the title it is given', async () => {
    const sources = { a: await source([101]) }
    const out = await buildPdf(sources, [ref('a', 1)], { title: 'Q3 invoices' })
    const doc = await PDFDocument.load(out)
    expect(doc.getTitle()).toBe('Q3 invoices')
  })

  test('refuses an empty page list rather than writing a broken PDF', async () => {
    await expect(buildPdf({ a: await source([101]) }, [])).rejects.toThrow(/no pages/i)
  })
})
