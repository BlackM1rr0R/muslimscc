// K4: məscid ekranının qoşulu rejimi — ?m=<id> oxunuşu və serverin qaydalarının yerli ayarın üstünə yazılması
import { describe, it, expect } from 'vitest'
import { parseMosqueId, applyLiveConfig, serializeConfig, DEFAULT_CONFIG } from '../../src/utils/iqamah.js'

describe('iqamah — qoşulu rejim', () => {
  it('parseMosqueId: yalnız etibarlı id', () => {
    expect(parseMosqueId('?m=n123')).toBe('n123')
    expect(parseMosqueId('city=Baku&m=w-9_x')).toBe('w-9_x')
    expect(parseMosqueId('?m=bad id')).toBe(null)
    expect(parseMosqueId('?m=' + 'x'.repeat(65))).toBe(null)
    expect(parseMosqueId('')).toBe(null)
  })
  it('applyLiveConfig: serverin qaydası olan namaz əvəzlənir, qalanı yerli; ad və Cümə vaxtı', () => {
    const cfg = { ...DEFAULT_CONFIG, iq: [20, 10, 10, 5, 10], jumua: '', name: 'Yerli' }
    const out = applyLiveConfig(cfg, { iqama: { fajr: 25, dhuhr: '13:30', isha: 999 }, jumuah: { time: '13:00' }, name: 'Təzəpir' })
    expect(out.iq).toEqual([25, '13:30', 10, 5, 10])   // isha: yararsız → yerli
    expect(out.jumua).toBe('13:00')
    expect(out.name).toBe('Təzəpir')
    expect(applyLiveConfig(cfg, { iqama: {}, jumuah: { time: '' }, name: '' })).toMatchObject({ iq: cfg.iq, jumua: '', name: 'Yerli' })
    expect(applyLiveConfig(cfg, null)).toBe(cfg)
  })
  it('serializeConfig: m parametri saxlanır', () => {
    expect(serializeConfig(DEFAULT_CONFIG, { m: 'n123' })).toMatch(/(^|&)m=n123(&|$)/)
    expect(serializeConfig(DEFAULT_CONFIG, { m: 'bad id' })).not.toMatch(/m=/)
  })
})
