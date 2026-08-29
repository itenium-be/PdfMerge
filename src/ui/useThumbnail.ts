import { useEffect, useState } from 'react'
import { thumbnail } from '../pdf/thumbs'
import type { LoadedDoc } from '../pdf/load'

export function useThumbnail(doc: LoadedDoc, page: number): string | null {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    thumbnail(doc, page).then(url => {
      if (live) setSrc(url)
    })
    return () => {
      live = false
    }
  }, [doc, page])
  return src
}
