// Zəif cihaz → avtomatik "hərəkəti azalt" (utils/liteDevice → wantsLite)
import { it, expect } from 'vitest'
import { wantsLite } from '../../src/utils/liteDevice.js'

it('≤4 nüvə, ≤4 GB yaddaş və ya Save-Data — yüngül; güclü cihaz — tam', () => {
  expect(wantsLite({ cores: 8, memory: 8 })).toBe(false)
  expect(wantsLite({ cores: 4, memory: 8 })).toBe(true)
  expect(wantsLite({ cores: 8, memory: 4 })).toBe(true)
  expect(wantsLite({ cores: 8, memory: 8, saveData: true })).toBe(true)
  expect(wantsLite({ cores: 6, memory: 6 })).toBe(false)
})
it('istifadəçi seçimi üstündür (localStorage muslim_cc_motion)', () => {
  expect(wantsLite({ cores: 2, memory: 2, override: 'full' })).toBe(false)
  expect(wantsLite({ cores: 16, memory: 16, override: 'lite' })).toBe(true)
})
it('bilinməyən dəyər (0/undefined) zəif sayılmır', () => {
  expect(wantsLite({ cores: 0, memory: 0 })).toBe(false)
  expect(wantsLite({})).toBe(false)
})
