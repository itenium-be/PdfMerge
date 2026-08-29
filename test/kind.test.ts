import { describe, expect, test } from 'vitest'
import { fitInside, sniff } from '../src/pdf/kind'

const bytes = (...values: number[]) => Uint8Array.from(values)

describe('sniff', () => {
  test('recognises a PDF by its header', () => {
    expect(sniff(new TextEncoder().encode('%PDF-1.7\n...'))).toBe('pdf')
  })

  test('recognises a PNG by its signature', () => {
    expect(sniff(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0))).toBe('png')
  })

  test('recognises a JPEG by its signature', () => {
    expect(sniff(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0))).toBe('jpg')
  })

  test('calls anything else unknown', () => {
    expect(sniff(new TextEncoder().encode('just text'))).toBe('unknown')
  })
})

describe('fitInside', () => {
  test('centres an image that is wider than it is tall', () => {
    expect(fitInside(200, 100, 400, 400)).toEqual({ width: 400, height: 200, x: 0, y: 100 })
  })

  test('centres an image that is taller than it is wide', () => {
    expect(fitInside(100, 200, 400, 400)).toEqual({ width: 200, height: 400, x: 100, y: 0 })
  })

  test('scales a small image up to fill the page', () => {
    expect(fitInside(50, 50, 400, 400)).toEqual({ width: 400, height: 400, x: 0, y: 0 })
  })
})
