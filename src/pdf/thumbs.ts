import type { getDocument as GetDocument } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { LoadedDoc } from './load'

const WIDTH = 320

/* pdf.js is the heaviest thing here: it only loads once a page actually needs a thumbnail. */
let pdfjs: Promise<{ getDocument: typeof GetDocument }> | null = null
const library = () => {
  pdfjs ??= import('pdfjs-dist').then(mod => {
    mod.GlobalWorkerOptions.workerSrc = workerUrl
    return mod
  })
  return pdfjs
}

const documents = new Map<string, Awaited<ReturnType<typeof openTask>>>()
const thumbs = new Map<string, Promise<string>>()

/* pdf.js takes ownership of the buffer it is handed, so it gets a copy of bytes pdf-lib still needs. */
const openTask = async (doc: LoadedDoc) => {
  const { getDocument } = await library()
  return getDocument({ data: doc.bytes.slice() })
}

const open = async (doc: LoadedDoc) => {
  let task = documents.get(doc.id)
  if (!task) {
    task = await openTask(doc)
    documents.set(doc.id, task)
  }
  return task.promise
}

/** Renders one page to a PNG data URL, once per page for the lifetime of the tab. */
export function thumbnail(doc: LoadedDoc, pageNumber: number): Promise<string> {
  const key = `${doc.id}:${pageNumber}`
  let pending = thumbs.get(key)
  if (!pending) {
    pending = render(doc, pageNumber)
    thumbs.set(key, pending)
  }
  return pending
}

async function render(doc: LoadedDoc, pageNumber: number): Promise<string> {
  const pdf = await open(doc)
  const page = await pdf.getPage(pageNumber)
  const scale = WIDTH / page.getViewport({ scale: 1 }).width
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise
  return canvas.toDataURL('image/png')
}

export function forget(docId: string) {
  void documents.get(docId)?.destroy()
  documents.delete(docId)
  for (const key of thumbs.keys()) if (key.startsWith(docId + ':')) thumbs.delete(key)
}
