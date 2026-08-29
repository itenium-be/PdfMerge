import { describe, expect, test } from 'vitest'
import { PDFDocument, degrees } from 'pdf-lib'
import { buildPdf } from '../src/pdf/build'
import { verifyBuild } from '../src/pdf/verify'
import type { PageRef } from '../src/model/pages'

async function source(widths: number[], rotate = 0) {
  const doc = await PDFDocument.create()
  widths.forEach(w => doc.addPage([w, 500]).setRotation(degrees(rotate)))
  return doc.save()
}

const ref = (docId: string, page: number, extra: Partial<PageRef> = {}): PageRef =>
  ({ docId, page, rot: 0, cut: false, ...extra })

describe('verifyBuild', () => {
  test('passes a PDF that matches the pages it was built from', async () => {
    const sources = { a: await source([101, 102]), b: await source([201]) }
    const pages = [ref('b', 1), ref('a', 2, { rot: 90 })]
    expect(await verifyBuild(sources, pages, await buildPdf(sources, pages))).toBeNull()
  })

  test('reports a page count that does not match', async () => {
    const sources = { a: await source([101, 102]) }
    const built = await buildPdf(sources, [ref('a', 1)])
    expect(await verifyBuild(sources, [ref('a', 1), ref('a', 2)], built)).toMatch(/2 pages.*got 1/i)
  })

  test('reports a page that came out at the wrong size', async () => {
    const sources = { a: await source([101, 102]) }
    const built = await buildPdf(sources, [ref('a', 2)])
    expect(await verifyBuild(sources, [ref('a', 1)], built)).toMatch(/page 1/i)
  })

  test('reports a page that came out at the wrong rotation', async () => {
    const sources = { a: await source([101]) }
    const built = await buildPdf(sources, [ref('a', 1)])
    expect(await verifyBuild(sources, [ref('a', 1, { rot: 90 })], built)).toMatch(/rotation/i)
  })
})

const PNG = Uint8Array.from(atob(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
), c => c.charCodeAt(0))

describe('verifyBuild with images', () => {
  test('passes an image page that came out A4 sized', async () => {
    const sources = { img: PNG, a: await source([101]) }
    const pages = [ref('img', 1), ref('a', 1)]
    expect(await verifyBuild(sources, pages, await buildPdf(sources, pages))).toBeNull()
  })

  test('reports an image page that is missing from the output', async () => {
    const sources = { img: PNG, a: await source([101]) }
    const built = await buildPdf(sources, [ref('a', 1)])
    expect(await verifyBuild(sources, [ref('img', 1)], built)).toMatch(/page 1/i)
  })
})
