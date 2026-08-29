import type { PDFDocument } from 'pdf-lib'
import { sniff } from './kind'
import type { FileKind } from './kind'

export type LoadedDoc = {
  id: string
  name: string
  /** What the bytes turned out to be: a document, or a single-page image. */
  kind: Exclude<FileKind, 'unknown'>
  pageCount: number
  size: number
  bytes: Uint8Array
}

let seq = 0

const identify = (file: File, kind: LoadedDoc['kind'], pageCount: number, bytes: Uint8Array): LoadedDoc =>
  ({ id: `${++seq}-${file.name}`, name: file.name, kind, pageCount, size: file.size, bytes })

export async function loadDocument(file: File): Promise<LoadedDoc> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniff(bytes)
  if (kind === 'unknown') throw new Error(`${file.name} is not a PDF, PNG or JPEG`)
  if (kind !== 'pdf') return identify(file, kind, 1, bytes)

  const { PDFDocument } = await import('pdf-lib')
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(bytes)
  } catch (e) {
    /* pdf-lib's EncryptedPDFError does not survive the cjs/esm split, so the message is the reliable signal. */
    if (e instanceof Error && /encrypted/i.test(e.message)) {
      throw new Error(`${file.name} is password protected — this tool cannot open it`)
    }
    throw new Error(`${file.name} could not be read`)
  }

  return identify(file, kind, doc.getPageCount(), bytes)
}
