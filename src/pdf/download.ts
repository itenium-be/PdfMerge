export function saveBytes(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  /* Revoking straight away cancels the download in Safari, so the tab keeps the URL until it closes. */
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
