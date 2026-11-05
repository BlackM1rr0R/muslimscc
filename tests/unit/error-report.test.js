// Brauzer xətalarının hesabatı (utils/errorReport) — hesabatın forması
import { describe, it, expect } from 'vitest'
import { buildReport } from '../../src/utils/errorReport.js'

describe('buildReport', () => {
  it('Error obyekti: ad + mesaj, stack qısaldılır, sorğu atılır', () => {
    const e = new TypeError('x is undefined')
    const r = buildReport('error', e, { source: 'https://muslims.cc/a.js?v=2', line: 4, col: 2 })
    expect(r.message).toBe('TypeError: x is undefined')
    expect(r.source).toBe('https://muslims.cc/a.js')
    expect(r.stack.split('\n').length).toBeLessThanOrEqual(5)
    expect(r).toMatchObject({ kind: 'error', line: 4, col: 2 })
  })
  it('mətn və naməlum səbəb', () => {
    expect(buildReport('rejection', 'cancelled').message).toBe('cancelled')
    expect(buildReport('rejection', undefined).message).toBe('Unknown error')
  })
})
