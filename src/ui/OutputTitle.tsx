import { useEffect, useRef, useState } from 'react'
import { PencilGlyph, ScissorsGlyph } from './glyphs'

type Props = {
  name: string
  onRename: (name: string) => void
}

/** The output's file name, shown where its label used to be: what you read is what downloads. */
export function OutputTitle({ name, onRename }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (draft !== null) input.current?.select()
  }, [draft !== null])

  if (draft === null) {
    return (
      <span className="tag">
        <ScissorsGlyph />
        <b>{name}</b>
        <button className="rename" onClick={() => setDraft(name)} aria-label={`Rename ${name}`} title="Rename this file">
          <PencilGlyph />
        </button>
      </span>
    )
  }

  const commit = () => {
    onRename(draft)
    setDraft(null)
  }

  return (
    <span className="tag">
      <ScissorsGlyph />
      <input
        ref={input}
        className="rename-field"
        value={draft}
        aria-label="File name"
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setDraft(null)
        }}
      />
    </span>
  )
}
