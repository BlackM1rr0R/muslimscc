// Xətm şəhadətnaməsi (utils/khatmCert) — xətmlərin aşkarlanması, forma, kolleksiya, kətan
import { describe, it, expect } from 'vitest'
import {
  CERTS_KEY, sanitizeCerts, readCerts, writeCerts, upsertCert, removeCert, planKhatm, lifeKhatms,
  khatmEvents, durationDays, certData, certFileName, drawKhatmCert, NAME_MAX, DED_MAX,
} from '../../src/utils/khatmCert.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

const mem = () => {
  const m = new Map()
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }
}

describe('xətmlərin aşkarlanması', () => {
  it('plan: yalnız 604 səhifə bitəndə; son gün — log-un sonuncusu', () => {
    expect(planKhatm({ start: '2026-10-01', done: 603, log: [] })).toBe(null)
    expect(planKhatm({ start: '2026-10-01', done: 604, log: ['2026-10-29', '2026-10-30', 'x'] }))
      .toEqual({ id: 'plan:2026-10-01', src: 'plan', start: '2026-10-01', end: '2026-10-30' })
    expect(planKhatm({ start: '2026-10-01', done: 604 }).end).toBe('2026-10-01')
    expect(planKhatm(null)).toBe(null)
  })
  it('mozaika xətmləri + şəhadətnaməsi olmayanlar "pending"', () => {
    const ks = [{ s: '2026-01-01', e: '2026-03-01' }, { s: 'pozuq', e: '2026-04-01' }]
    expect(lifeKhatms(ks)).toEqual([{ id: 'life:1:2026-03-01', src: 'life', start: '2026-01-01', end: '2026-03-01' }])
    const plan = { start: '2026-10-01', done: 604, log: ['2026-10-30'] }
    const ev = khatmEvents({ plan, ks, certs: [{ id: 'life:1:2026-03-01' }] })
    expect(ev.all.map(k => k.id)).toEqual(['life:1:2026-03-01', 'plan:2026-10-01'])
    expect(ev.pending.map(k => k.id)).toEqual(['plan:2026-10-01'])
    expect(khatmEvents({}).all).toEqual([])
  })
})

describe('forma məlumatı', () => {
  it('müddət (hər iki gün daxil)', () => {
    expect(durationDays('2026-01-01', '2026-01-30')).toBe(30)
    expect(durationDays('2026-01-01', '2026-01-01')).toBe(1)
    expect(durationDays('x', '2026-01-01')).toBe(0)
    // yay saatı keçidi günü itirmir
    expect(durationDays('2026-03-01', '2026-03-31')).toBe(31)
  })
  it('yoxlama: ad, tarixlər, gələcək tarix yox', () => {
    expect(certData({ name: '  ', start: '2026-01-01', end: '2026-01-02' })).toEqual({ error: 'name' })
    expect(certData({ name: 'Əli', start: '2026-02-01', end: '2026-01-02' })).toEqual({ error: 'dates' })
    expect(certData({ name: 'Əli', start: '2026-01-01', end: '2026-12-01', today: '2026-11-17' })).toEqual({ error: 'dates' })
    const ok = certData({ name: ' Əli\n Vəli ', start: '2026-10-01', end: '2026-10-30', ded: 'Anam üçün', today: '2026-11-17' })
    expect(ok).toEqual({ name: 'Əli Vəli', start: '2026-10-01', end: '2026-10-30', ded: 'Anam üçün', days: 30 })
    expect(certData({ name: 'x'.repeat(200), start: '2026-10-01', end: '2026-10-01', ded: 'y'.repeat(300) }))
      .toMatchObject({ name: 'x'.repeat(NAME_MAX), ded: 'y'.repeat(DED_MAX) })
  })
  it('fayl adı', () => {
    expect(certFileName('Əli Vəli', '2026-10-30')).toBe('muslims-cc-khatm-əli-vəli-2026-10-30.png')
    expect(certFileName('***', '2026-10-30')).toBe('muslims-cc-khatm-khatm-2026-10-30.png')
  })
})

describe('kolleksiya', () => {
  it('təmizləmə, əlavə/yeniləmə, silmə, yaddaş', () => {
    expect(sanitizeCerts([{ id: 'a', start: '2026-02-01', end: '2026-01-01' }, null, { id: '', start: '2026-01-01', end: '2026-01-02' }])).toEqual([])
    let list = upsertCert([], { id: 'plan:2026-10-01', src: 'plan', start: '2026-10-01', end: '2026-10-30', name: 'Əli', ded: '', made: '2026-10-30' })
    list = upsertCert(list, { id: 'life:1:2026-03-01', src: 'life', start: '2026-01-01', end: '2026-03-01', name: 'Əli', made: '2026-03-02' })
    expect(list.map(c => c.id)).toEqual(['life:1:2026-03-01', 'plan:2026-10-01'])
    list = upsertCert(list, { id: 'plan:2026-10-01', src: 'plan', start: '2026-10-01', end: '2026-10-30', name: 'Əli Vəli', made: '2026-11-01' })
    expect(list).toHaveLength(2)
    expect(list[1].name).toBe('Əli Vəli')
    const s = mem()
    writeCerts(list, s)
    expect(readCerts(s)).toEqual(list)
    writeCerts(removeCert(removeCert(list, 'plan:2026-10-01'), 'life:1:2026-03-01'), s)
    expect(s.m.has(CERTS_KEY)).toBe(false)
    expect(isBackupKey(CERTS_KEY)).toBe(true)
  })
})

describe('kətan', () => {
  it('çəkiliş xətasız bitir və adı, Bəsmələni, dövrü yazır', () => {
    const texts = []
    const noop = () => {}
    const ctx = new Proxy({}, {
      get: (o, k) => {
        if (k === 'fillText') return (t) => texts.push(t)
        if (k === 'measureText') return (t) => ({ width: String(t).length * 20 })
        if (k === 'createRadialGradient') return () => ({ addColorStop: noop })
        if (k in o) return o[k]
        return noop
      },
      set: (o, k, v) => { o[k] = v; return true },
    })
    drawKhatmCert(ctx, { name: 'Əli', t: { basmala: 'بسم', title: 'Xətm', intro: 'Bu sənəd', deed: 'Quranı xətm etdi', period: '1 — 30 oktyabr', duration: '30 gün', ded: 'Anam üçün', brand: 'muslims.cc' } })
    expect(texts).toEqual(expect.arrayContaining(['بسم', 'Əli', 'Quranı xətm etdi', '1 — 30 oktyabr', '30 gün', '“Anam üçün”', 'muslims.cc']))
  })
})
