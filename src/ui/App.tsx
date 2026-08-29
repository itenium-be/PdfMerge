import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { joinAt, movePages, outputs as toOutputs, removePages, rotatePages, splitBefore } from '../model/pages'
import type { PageRef } from '../model/pages'
import { outputName } from '../model/naming'
import { loadDocument } from '../pdf/load'
import type { LoadedDoc } from '../pdf/load'
import { buildPdf } from '../pdf/build'
import { verifyBuild } from '../pdf/verify'
import { saveBytes } from '../pdf/download'
import { forget } from '../pdf/thumbs'
import { applyTheme, initTheme } from '../state/theme'
import type { Theme } from '../state/theme'
import { GithubGlyph, IteniumLogo, Mark, MoonGlyph, ScissorsGlyph, SunGlyph } from './glyphs'
import { PageCard } from './PageCard'
import { DetailRail } from './DetailRail'
import { useHistory } from './useHistory'

const REPO = 'https://github.com/itenium-be/PdfMerge'
/* One colour per loaded document: the dot on a page card is the only thing tying it to its source. */
const COLORS = ['#E78200', '#2B4BF2', '#12A594', '#B5297A', '#6B4EE6', '#3F8F3F']

type Notice = { kind: 'warn' | 'ok'; text: string }

export function App() {
  const [theme, setTheme] = useState<Theme>('light')
  const [docs, setDocs] = useState<LoadedDoc[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [focused, setFocused] = useState<number | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [dropping, setDropping] = useState(false)
  const [busy, setBusy] = useState(false)
  const { present: pages, set: setPages, undo, redo, canUndo, canRedo } = useHistory<PageRef[]>([])

  useEffect(() => setTheme(initTheme()), [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  const byId = useMemo(() => Object.fromEntries(docs.map(d => [d.id, d])), [docs])
  const colors = useMemo(() => Object.fromEntries(docs.map((d, i) => [d.id, COLORS[i % COLORS.length]])), [docs])
  const names = useMemo(() => Object.fromEntries(docs.map(d => [d.id, d.name])), [docs])
  const outputs = useMemo(() => toOutputs(pages), [pages])

  const edit = useCallback((next: PageRef[], keep: number[] = []) => {
    setPages(next)
    setSelected(keep)
    setFocused(current => (current === null ? null : Math.min(current, next.length - 1)))
  }, [setPages])

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setBusy(true)
    const loaded: LoadedDoc[] = []
    const failed: string[] = []
    for (const file of Array.from(files)) {
      try {
        loaded.push(await loadDocument(file))
      } catch (e) {
        failed.push(e instanceof Error ? e.message : `${file.name} could not be read`)
      }
    }
    if (loaded.length) {
      setDocs(current => [...current, ...loaded])
      setPages([
        ...pages,
        ...loaded.flatMap(doc =>
          Array.from({ length: doc.pageCount }, (_, i): PageRef => ({ docId: doc.id, page: i + 1, rot: 0, cut: false })),
        ),
      ])
    }
    setNotice(failed.length ? { kind: 'warn', text: failed.join(' · ') } : null)
    setBusy(false)
  }, [pages, setPages])

  const download = useCallback(async (index: number) => {
    const output = outputs[index]
    const name = outputName(names, output.pages, index, outputs.length)
    setBusy(true)
    try {
      const sources = Object.fromEntries(docs.map(d => [d.id, d.bytes]))
      const bytes = await buildPdf(sources, output.pages, { title: name.replace(/\.pdf$/, '') })
      const problem = await verifyBuild(sources, output.pages, bytes)
      if (problem) {
        setNotice({ kind: 'warn', text: `${name} did not come out right: ${problem}. Nothing was downloaded.` })
        return
      }
      saveBytes(bytes, name)
      setNotice({ kind: 'ok', text: `${name} · ${output.pages.length} pages, read back and checked before saving.` })
    } catch (e) {
      setNotice({ kind: 'warn', text: e instanceof Error ? e.message : 'The PDF could not be written' })
    } finally {
      setBusy(false)
    }
  }, [docs, names, outputs])

  const remove = useCallback((indices: number[]) => {
    const next = removePages(pages, indices)
    const gone = new Set(indices.map(i => pages[i].docId))
    const stillUsed = new Set(next.map(p => p.docId))
    gone.forEach(id => {
      if (!stillUsed.has(id)) forget(id)
    })
    setDocs(current => current.filter(d => stillUsed.has(d.id)))
    edit(next)
    setFocused(next.length ? Math.min(indices[0], next.length - 1) : null)
  }, [edit, pages])

  const move = useCallback((from: number, to: number) => {
    const moving = selected.includes(from) ? selected : [from]
    if (moving.includes(to)) return
    /* Where the block lands: the target's position once the moved pages are out of the list. */
    const rest = pages.filter((_, i) => !moving.includes(i))
    const at = rest.indexOf(pages[to]) === -1 ? rest.length : rest.indexOf(pages[to])
    edit(movePages(pages, moving, to), moving.length > 1 ? moving.map((_, i) => at + i) : [])
    setFocused(at)
  }, [edit, pages, selected])

  const focus = useCallback((index: number, additive: boolean) => {
    setFocused(index)
    if (additive) toggle(index)
  }, [])

  const toggle = (index: number) =>
    setSelected(current => (current.includes(index) ? current.filter(i => i !== index) : [...current, index].sort((a, b) => a - b)))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key.toLowerCase() !== 'z') return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
      setSelected([])
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [redo, undo])

  const picker = useRef<HTMLInputElement>(null)
  const dragFrom = useRef<number | null>(null)
  const pick = () => picker.current?.click()

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropping(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }


  return (
    <div
      className={'shell' + (dropping ? ' dragging-files' : '')}
      onDragOver={e => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setDropping(true)
        }
      }}
      onDragLeave={e => {
        if (e.currentTarget === e.target) setDropping(false)
      }}
      onDrop={onDrop}
    >
      <input
        ref={picker}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        aria-label="Add PDF files"
        onChange={e => {
          if (e.target.files?.length) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <header className="appbar">
        <div className="wordmark">
          <Mark />
          <h1>PDF Workbench</h1>
          <span>by itenium</span>
        </div>
        <span className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={undo} disabled={!canUndo}>Undo</button>
        <button className="btn btn-ghost btn-sm" onClick={redo} disabled={!canRedo}>Redo</button>
        <button className="btn btn-ghost btn-sm" onClick={pick} disabled={busy}>Add files</button>
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {theme === 'dark' ? <SunGlyph /> : <MoonGlyph />}
        </button>
      </header>

      {notice && (
        <p className={'note note-' + notice.kind}>
          <span aria-hidden="true">{notice.kind === 'ok' ? '✓' : '▲'}</span>
          <span className="grow">{notice.text}</span>
          <button className="btn btn-sm" onClick={() => setNotice(null)}>Dismiss</button>
        </p>
      )}

      {pages.length === 0 ? (
        <div className="blank">
          <div className="box">
            <h2>Drop your PDFs here</h2>
            <p>Merge them, drag the pages into the order you want, cut the stack into separate files.
              Everything happens in this tab — nothing is uploaded.</p>
            <div className="zone">
              <button className="btn btn-primary" onClick={pick} disabled={busy}>Choose files</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="work">
          <div className="canvas">
            {outputs.map((output, oi) => (
              <section className="output" key={output.start} data-alt={oi % 2}>
                <div className="band">
                  <span className="tag"><ScissorsGlyph /> Output {oi + 1}</span>
                  <span className="range">
                    pages {output.start + 1}–{output.start + output.pages.length} · {output.pages.length} pages
                  </span>
                  <span className="grow" />
                  {oi > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => edit(joinAt(pages, output.start))}>
                      Remove split
                    </button>
                  )}
                  <button className="btn btn-accent btn-sm" onClick={() => download(oi)} disabled={busy}>
                    Download PDF
                  </button>
                </div>
                <div className="pgrid">
                  {output.pages.map((page, pi) => {
                    const index = output.start + pi
                    return (
                      <PageCard
                        key={`${page.docId}:${page.page}:${index}`}
                        page={page}
                        index={index}
                        doc={byId[page.docId]}
                        color={colors[page.docId]}
                        selected={selected.includes(index)}
                        focused={focused === index}
                        canSplit={index > 0}
                        onFocus={focus}
                        onToggle={toggle}
                        onRotate={i => edit(rotatePages(pages, [i], 90), selected)}
                        onRemove={i => remove([i])}
                        onSplit={i => edit(splitBefore(pages, i), selected)}
                        onDragStart={i => { dragFrom.current = i }}
                        onDropOn={i => dragFrom.current !== null && move(dragFrom.current, i)}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
            <div className="drop-hint">Drop more PDFs here to add them to the end</div>
          </div>

          <aside className="aside">
            <DetailRail
              pages={pages}
              docs={byId}
              outputs={outputs}
              focused={focused}
              selected={selected}
              onRotate={(indices, degrees) => edit(rotatePages(pages, indices, degrees), selected)}
              onRemove={remove}
              onSplit={index => edit(splitBefore(pages, index), selected)}
            />
          </aside>
        </div>
      )}

      {selected.length > 1 && (
        <div className="actionbar">
          <span className="n">{selected.length} selected</span>
          <button className="btn btn-sm" onClick={() => edit(rotatePages(pages, selected, 90), selected)}>Rotate</button>
          <button
            className="btn btn-sm"
            onClick={() => edit(splitBefore(pages, selected[0]), selected)}
            disabled={selected[0] === 0}
          >
            Split here
          </button>
          <button className="btn btn-sm" onClick={() => remove(selected)}>Remove</button>
          <button className="close" onClick={() => setSelected([])} aria-label="Clear selection">✕</button>
        </div>
      )}

      <footer className="footer">
        <a href="https://itenium.be" target="_blank" rel="noreferrer noopener">
          <IteniumLogo />
        </a>
        <span className="grow" />
        <a href={REPO} target="_blank" rel="noreferrer noopener" aria-label="Source on GitHub">
          <span>Source</span>
          <GithubGlyph />
        </a>
      </footer>
    </div>
  )
}
