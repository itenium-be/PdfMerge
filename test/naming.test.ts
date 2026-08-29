import { describe, expect, test } from 'vitest'
import { outputName } from '../src/model/naming'
import type { PageRef } from '../src/model/pages'

const ref = (docId: string, name?: string): PageRef => ({ docId, page: 1, rot: 0, cut: false, name })
const names = { a: 'Q3-invoices.pdf', b: 'agreement.pdf' }

describe('outputName', () => {
  test('keeps the source name when the only output comes from one document', () => {
    expect(outputName(names, [ref('a'), ref('a')], 0, 1)).toBe('Q3-invoices.pdf')
  })

  test('numbers the parts when one document is split', () => {
    expect(outputName(names, [ref('a')], 1, 3)).toBe('Q3-invoices-2.pdf')
  })

  test('calls it merged when an output draws on several documents', () => {
    expect(outputName(names, [ref('a'), ref('b')], 0, 1)).toBe('merged.pdf')
  })

  test('numbers merged parts too', () => {
    expect(outputName(names, [ref('a'), ref('b')], 2, 3)).toBe('merged-3.pdf')
  })

  test('uses the name the output was given', () => {
    expect(outputName(names, [ref('a', 'appendix'), ref('b')], 1, 3)).toBe('appendix.pdf')
  })

  test('does not double the extension on a name that already has one', () => {
    expect(outputName(names, [ref('a', 'appendix.pdf')], 0, 2)).toBe('appendix.pdf')
  })

  test('strips the extension of the source before adding its own', () => {
    expect(outputName({ a: 'scan.PDF' }, [ref('a')], 0, 2)).toBe('scan-1.pdf')
  })
})
