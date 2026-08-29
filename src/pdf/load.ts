import { PDFDocument } from 'pdf-lib'

export type LoadedDoc = {
  id: string
  name: string
  pageCount: number
  size: number
  bytes: Uint8Array
}

const PDF_HEADER = '%PDF-'

let seq = 0

export async function loadDocument(file: File): Promise<LoadedDoc> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const header = new TextDecoder().decode(bytes.subarray(0, 8))
  if (!header.startsWith(PDF_HEADER)) throw new Error(`${file.name} is not a PDF`)

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

  return {
    id: `${++seq}-${file.name}`,
    name: file.name,
    pageCount: doc.getPageCount(),
    size: file.size,
    bytes,
  }
}
