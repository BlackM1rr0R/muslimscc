import { describe, it, expect } from 'vitest'
import { partNow } from '../../src/components/hisn/adhkarState'

describe('adhkarState.partNow', () => {
  it('namaz fazasına görə: əsrdən sonra axşam, gündüz səhər', () => {
    expect(partNow(13, 'day')).toBe('morning')
    expect(partNow(16, 'asr')).toBe('evening')
    expect(partNow(23, 'night')).toBe('evening')
    expect(partNow(3, 'night')).toBe('morning')
  })
  it('faza yoxdursa — saat', () => {
    expect(partNow(9, '')).toBe('morning')
    expect(partNow(17, '')).toBe('evening')
  })
})
