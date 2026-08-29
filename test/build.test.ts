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

/* A real 1×1 PNG and a real 1×1 JPEG: pdf-lib refuses anything it cannot actually decode. */
const PNG = Uint8Array.from(atob(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
), c => c.charCodeAt(0))
const JPG = Uint8Array.from(atob(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='
), c => c.charCodeAt(0))

describe('buildPdf with images', () => {
  test('gives a PNG a page of its own, A4 sized', async () => {
    const out = await buildPdf({ img: PNG }, [ref('img', 1)])
    expect(await widthsOf(out)).toEqual([595])
    const doc = await PDFDocument.load(out)
    expect(Math.round(doc.getPages()[0].getHeight())).toBe(842)
  })

  test('takes a JPEG too', async () => {
    const out = await buildPdf({ img: JPG }, [ref('img', 1)])
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1)
  })

  test('rotates an image page like any other', async () => {
    const out = await buildPdf({ img: PNG }, [ref('img', 1, { rot: 270 })])
    expect((await PDFDocument.load(out)).getPages()[0].getRotation().angle).toBe(270)
  })

  test('mixes image pages and document pages in one file', async () => {
    const out = await buildPdf({ a: await source([101, 102]), img: PNG }, [ref('a', 2), ref('img', 1), ref('a', 1)])
    expect(await widthsOf(out)).toEqual([102, 595, 101])
  })
})
