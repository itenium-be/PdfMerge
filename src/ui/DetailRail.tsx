import type { LoadedDoc } from '../pdf/load'
import type { Output, PageRef } from '../model/pages'
import { RotateLeft, RotateRight } from './glyphs'
import { useThumbnail } from './useThumbnail'

type Props = {
  pages: readonly PageRef[]
  docs: Record<string, LoadedDoc>
  outputs: Output[]
  focused: number | null
  selected: number[]
  onRotate: (indices: number[], degrees: number) => void
  onRemove: (indices: number[]) => void
  onSplit: (index: number) => void
}

export function DetailRail({ pages, docs, outputs, focused, selected, onRotate, onRemove, onSplit }: Props) {
  if (selected.length > 1) {
    return (
      <div className="sticky">
        <p className="eyebrow">Selection</p>
        <h3>{selected.length} pages selected</h3>
        <div className="selist">
          {selected.map(i => <span key={i}>#{i + 1}</span>)}
        </div>
        <div className="acts">
          <button className="btn btn-sm" onClick={() => onRotate(selected, 90)}>Rotate</button>
          <button className="btn btn-sm" onClick={() => onSplit(selected[0])} disabled={selected[0] === 0}>
            Split here
          </button>
          <button className="btn btn-sm wide" onClick={() => onRemove(selected)}>
            Remove {selected.length} pages
          </button>
        </div>
        <p className="hint">Drag any selected page to move all {selected.length} together.</p>
      </div>
    )
  }

  const page = focused === null ? undefined : pages[focused]
  if (!page || focused === null) {
    return (
      <div className="sticky">
        <p className="eyebrow">Outputs</p>
        <h3>{outputs.length} file{outputs.length === 1 ? '' : 's'} out</h3>
        <div className="outsum">
          {outputs.map((output, i) => (
            <div className="row" key={output.start}>
              Output {i + 1}
              <span className="n">{output.pages.length} pages</span>
            </div>
          ))}
        </div>
        <p className="empty">Click a page to see where it came from.</p>
      </div>
    )
  }

  const doc = docs[page.docId]
  const outputIndex = outputs.findIndex(o => o.start <= focused && focused < o.start + o.pages.length)
  const output = outputs[outputIndex]
  const position = focused - output.start + 1

  return (
    <div className="sticky">
      <p className="eyebrow">Page {position} of {output.pages.length}</p>
      <Preview doc={doc} page={page} />
      <h3>{doc.name}</h3>
      <dl className="sum">
        <dt>original page</dt><dd>{page.page} of {doc.pageCount}</dd>
        <dt>position</dt><dd>#{position}</dd>
        <dt>output</dt><dd>Output {outputIndex + 1}</dd>
        <dt>rotation</dt><dd>{page.rot}°</dd>
      </dl>
      <div className="acts">
        <button className="btn btn-sm" onClick={() => onRotate([focused], -90)}><RotateLeft /> Left</button>
        <button className="btn btn-sm" onClick={() => onRotate([focused], 90)}><RotateRight /> Right</button>
        <button className="btn btn-sm wide" onClick={() => onSplit(focused)} disabled={focused === 0}>
          Split before this page
        </button>
        <button className="btn btn-sm wide" onClick={() => onRemove([focused])}>Remove page</button>
      </div>
    </div>
  )
}

function Preview({ doc, page }: { doc: LoadedDoc; page: PageRef }) {
  const thumb = useThumbnail(doc, page.page)
  return (
    <div className="stage">
      {thumb
        ? <img className="thumb" src={thumb} data-rot={page.rot} alt={`Page ${page.page} of ${doc.name}`} />
        : <div className="thumb thumb-pending" />}
    </div>
  )
}
