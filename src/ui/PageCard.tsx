import type { DragEvent } from 'react'
import type { LoadedDoc } from '../pdf/load'
import type { PageRef } from '../model/pages'
import { CloseGlyph, RotateRight, ScissorsGlyph } from './glyphs'
import { useThumbnail } from './useThumbnail'

type Props = {
  page: PageRef
  index: number
  /** Position within its own output file, which is what the page will be numbered when saved. */
  position: number
  doc: LoadedDoc
  color: string
  selected: boolean
  focused: boolean
  canSplit: boolean
  onFocus: (index: number, additive: boolean) => void
  onToggle: (index: number) => void
  onRotate: (index: number) => void
  onRemove: (index: number) => void
  onSplit: (index: number) => void
  onDragStart: (index: number) => void
  onDropOn: (index: number) => void
}

export function PageCard(props: Props) {
  const { page, index, position, doc, color, selected, focused, canSplit } = props
  const thumb = useThumbnail(doc, page.page)

  const allowDrop = (e: DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('dropbefore')
  }
  const clearDrop = (e: DragEvent) => e.currentTarget.classList.remove('dropbefore')

  return (
    <article
      className="pcard"
      draggable
      data-index={index}
      data-sel={selected}
      data-focus={focused}
      onClick={e => props.onFocus(index, e.ctrlKey || e.metaKey || e.shiftKey)}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.currentTarget.classList.add('dragging')
        props.onDragStart(index)
      }}
      onDragEnd={e => e.currentTarget.classList.remove('dragging')}
      onDragOver={allowDrop}
      onDragLeave={clearDrop}
      onDrop={e => {
        clearDrop(e)
        e.preventDefault()
        props.onDropOn(index)
      }}
    >
      {canSplit && (
        <button
          className="cutbtn"
          title="Split before this page"
          aria-label={`Split before page ${index + 1}`}
          onClick={e => {
            e.stopPropagation()
            props.onSplit(index)
          }}
        >
          <ScissorsGlyph />
        </button>
      )}

      <input
        className="psel"
        type="checkbox"
        checked={selected}
        aria-label={`Select page ${index + 1}`}
        onClick={e => e.stopPropagation()}
        onChange={() => props.onToggle(index)}
      />

      <div className="ptools">
        <button
          title="Rotate right"
          aria-label={`Rotate page ${index + 1}`}
          onClick={e => {
            e.stopPropagation()
            props.onRotate(index)
          }}
        >
          <RotateRight />
        </button>
        <button
          className="rm"
          title="Remove this page"
          aria-label={`Remove page ${index + 1}`}
          onClick={e => {
            e.stopPropagation()
            props.onRemove(index)
          }}
        >
          <CloseGlyph />
        </button>
      </div>

      <div className="frame">
        {thumb
          ? <img className="thumb" src={thumb} data-rot={page.rot} alt="" draggable={false} />
          : <div className="thumb thumb-pending" />}
      </div>

      <div className="cap">
        <span className="file">
          <span className="dot" style={{ background: color }} />
          <b title={doc.name}>{doc.name}</b>
        </span>
        <span className="orig">
          page {page.page}
          <span className="seq">#{position}</span>
        </span>
      </div>
    </article>
  )
}
