import { describe, expect, test } from 'vitest'
import { joinAt, movePages, nameOutput, outputs, removePages, rotatePages, splitBefore } from '../src/model/pages'
import type { PageRef } from '../src/model/pages'

const p = (docId: string, page: number, extra: Partial<PageRef> = {}): PageRef =>
  ({ docId, page, rot: 0, cut: false, ...extra })

const ids = (out: { pages: readonly PageRef[] }) => out.pages.map(x => x.docId + x.page).join(' ')
const seq = (pages: readonly PageRef[]) => pages.map(x => x.docId + x.page).join(' ')

describe('outputs', () => {
  test('groups every page into one output when nothing is cut', () => {
    const pages = [p('a', 1), p('a', 2), p('b', 1)]
    expect(outputs(pages).map(o => o.pages.length)).toEqual([3])
  })

  test('starts a new output at each cut page', () => {
    const pages = [p('a', 1), p('a', 2, { cut: true }), p('b', 1)]
    expect(outputs(pages).map(ids)).toEqual(['a1', 'a2 b1'])
  })

  test('reports the position each output starts at', () => {
    const pages = [p('a', 1), p('a', 2, { cut: true }), p('b', 1)]
    expect(outputs(pages).map(o => o.start)).toEqual([0, 1])
  })
})

describe('splitBefore', () => {
  test('cuts before the given page', () => {
    const pages = splitBefore([p('a', 1), p('a', 2)], 1)
    expect(outputs(pages).map(ids)).toEqual(['a1', 'a2'])
  })

  test('refuses to cut before the first page', () => {
    const pages = splitBefore([p('a', 1), p('a', 2)], 0)
    expect(outputs(pages).map(ids)).toEqual(['a1 a2'])
  })
})

describe('joinAt', () => {
  test('merges an output back into the one before it', () => {
    const pages = joinAt([p('a', 1), p('a', 2, { cut: true })], 1)
    expect(outputs(pages).map(ids)).toEqual(['a1 a2'])
  })
})

describe('movePages', () => {
  test('moves a single page before the target', () => {
    const pages = movePages([p('a', 1), p('a', 2), p('a', 3)], [2], 0)
    expect(seq(pages)).toBe('a3 a1 a2')
  })

  test('keeps a multi-page selection together and in order', () => {
    const pages = movePages([p('a', 1), p('a', 2), p('a', 3), p('a', 4)], [0, 2], 3)
    expect(seq(pages)).toBe('a2 a1 a3 a4')
  })

  test('drops the cut of a moved page so the split stays where it was drawn', () => {
    const pages = movePages([p('a', 1), p('a', 2, { cut: true }), p('a', 3)], [1], 0)
    expect(outputs(pages).map(ids)).toEqual(['a2 a1 a3'])
  })

  test('appends when the target is past the last page', () => {
    const pages = movePages([p('a', 1), p('a', 2), p('a', 3)], [0], 3)
    expect(seq(pages)).toBe('a2 a3 a1')
  })

  test('never leaves a cut on the first page', () => {
    const pages = movePages([p('a', 1), p('a', 2), p('a', 3, { cut: true })], [0, 1], 3)
    expect(outputs(pages).map(ids)).toEqual(['a3 a1 a2'])
  })
})

describe('removePages', () => {
  test('removes the given positions', () => {
    expect(seq(removePages([p('a', 1), p('a', 2), p('a', 3)], [1]))).toBe('a1 a3')
  })

  test('hands the cut to the next page so the output survives', () => {
    const pages = removePages([p('a', 1), p('a', 2, { cut: true }), p('a', 3)], [1])
    expect(outputs(pages).map(ids)).toEqual(['a1', 'a3'])
  })

  test('drops the output when its last page goes', () => {
    const pages = removePages([p('a', 1), p('a', 2, { cut: true })], [1])
    expect(outputs(pages).map(ids)).toEqual(['a1'])
  })
})

describe('rotatePages', () => {
  test('turns the given pages a quarter clockwise', () => {
    expect(rotatePages([p('a', 1), p('a', 2)], [1], 90).map(x => x.rot)).toEqual([0, 90])
  })

  test('keeps rotation between 0 and 359 degrees', () => {
    expect(rotatePages([p('a', 1, { rot: 0 })], [0], -90)[0].rot).toBe(270)
    expect(rotatePages([p('a', 1, { rot: 270 })], [0], 90)[0].rot).toBe(0)
  })
})

describe('nameOutput', () => {
  test('gives the output a name of its own', () => {
    const pages = nameOutput([p('a', 1), p('a', 2, { cut: true })], 1, 'appendix.pdf')
    expect(outputs(pages).map(o => o.name)).toEqual([undefined, 'appendix.pdf'])
  })

  test('names the first output too, which starts without a cut', () => {
    const pages = nameOutput([p('a', 1), p('a', 2)], 0, 'contract.pdf')
    expect(outputs(pages)[0].name).toBe('contract.pdf')
  })

  test('clears the name when it is set to nothing', () => {
    const named = nameOutput([p('a', 1)], 0, 'contract.pdf')
    expect(outputs(nameOutput(named, 0, '  '))[0].name).toBeUndefined()
  })

  test('hands the name to the next page when the named page is removed', () => {
    const named = nameOutput([p('a', 1), p('a', 2, { cut: true }), p('a', 3)], 1, 'appendix.pdf')
    expect(outputs(removePages(named, [1])).map(o => o.name)).toEqual([undefined, 'appendix.pdf'])
  })

  test('drops the name of a page that is dragged out of its output', () => {
    const named = nameOutput([p('a', 1), p('a', 2, { cut: true }), p('a', 3)], 1, 'appendix.pdf')
    expect(outputs(movePages(named, [1], 0)).map(o => o.name)).toEqual([undefined])
  })
})
