export type FileKind = 'pdf' | 'png' | 'jpg' | 'unknown'

const starts = (bytes: Uint8Array, signature: number[]) =>
  signature.every((byte, i) => bytes[i] === byte)

/** What a file is, according to the file itself rather than its name or the browser's guess. */
export function sniff(bytes: Uint8Array): FileKind {
  if (starts(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf'
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (starts(bytes, [0xff, 0xd8, 0xff])) return 'jpg'
  return 'unknown'
}

export type Box = { width: number; height: number; x: number; y: number }

/** The largest centred box with the image's proportions that still fits the page. */
export function fitInside(imageWidth: number, imageHeight: number, pageWidth: number, pageHeight: number): Box {
  const scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale
  return { width, height, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2 }
}
