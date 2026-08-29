import { describe, expect, test } from 'vitest'
import { outputNames } from '../src/model/naming'
import type { Output, PageRef } from '../src/model/pages'

const ref = (docId: string): PageRef => ({ docId, page: 1, rot: 0, cut: false })
const out = (docIds: string[], name?: string): Output => ({ start: 0, pages: docIds.map(ref), name })
const names = { a: 'Q3-invoices.pdf', b: 'agreement.pdf' }

describe('outputNames', () => {
  test('names a single output after the document it starts with', () => {
    expect(outputNames(names, [out(['a', 'b'])])).toEqual(['Q3-invoices.pdf'])
  })

  test('numbers the outputs after the first one', () => {
    expect(outputNames(names, [out(['a']), out(['b']), out(['b'])]))
      .toEqual(['Q3-invoices.pdf', 'Q3-invoices-2.pdf', 'Q3-invoices-3.pdf'])
  })

  test('follows the first output when it is renamed', () => {
    expect(outputNames(names, [out(['a'], 'Antwerp'), out(['b'])]))
      .toEqual(['Antwerp.pdf', 'Antwerp-2.pdf'])
  })

  test('keeps the name an output was given for itself', () => {
    expect(outputNames(names, [out(['a']), out(['b'], 'appendix'), out(['b'])]))
      .toEqual(['Q3-invoices.pdf', 'appendix.pdf', 'Q3-invoices-3.pdf'])
  })

  test('does not double the extension on a name that already has one', () => {
    expect(outputNames(names, [out(['a'], 'appendix.pdf'), out(['b'])]))
      .toEqual(['appendix.pdf', 'appendix-2.pdf'])
  })

  test('strips the extension of the source before adding its own', () => {
    expect(outputNames({ a: 'scan.PDF' }, [out(['a']), out(['a'])])).toEqual(['scan.pdf', 'scan-2.pdf'])
  })

  test('falls back when the source is gone', () => {
    expect(outputNames({}, [out(['ghost'])])).toEqual(['merged.pdf'])
  })
})
