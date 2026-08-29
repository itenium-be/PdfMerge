import { describe, expect, test } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { loadDocument } from '../src/pdf/load'

async function pdfFile(name: string, pages = 1) {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pages; i++) doc.addPage([200, 300])
  return new File([await doc.save() as BlobPart], name, { type: 'application/pdf' })
}

describe('loadDocument', () => {
  test('reads the name and page count', async () => {
    const doc = await loadDocument(await pdfFile('invoices.pdf', 3))
    expect(doc.name).toBe('invoices.pdf')
    expect(doc.pageCount).toBe(3)
  })

  test('gives every load its own id, even for the same file twice', async () => {
    const a = await loadDocument(await pdfFile('same.pdf'))
    const b = await loadDocument(await pdfFile('same.pdf'))
    expect(a.id).not.toBe(b.id)
  })

  test('says so when the file is neither a PDF nor an image', async () => {
    const file = new File(['just text'], 'notes.txt', { type: 'text/plain' })
    await expect(loadDocument(file)).rejects.toThrow(/pdf, png or jpeg/i)
  })

  test('takes a PNG as a one-page document', async () => {
    const png = Uint8Array.from(atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    ), c => c.charCodeAt(0))
    const doc = await loadDocument(new File([png as BlobPart], 'signature.png', { type: 'image/png' }))
    expect(doc.pageCount).toBe(1)
    expect(doc.kind).toBe('png')
  })

  test('says so when the PDF is password protected', async () => {
    const doc = await PDFDocument.create()
    doc.addPage()
    doc.context.trailerInfo.Encrypt = doc.context.register(doc.context.obj({ Filter: 'Standard', V: 1, R: 2 }))
    const file = new File([await doc.save() as BlobPart], 'locked.pdf', { type: 'application/pdf' })
    await expect(loadDocument(file)).rejects.toThrow(/password/i)
  })
})
