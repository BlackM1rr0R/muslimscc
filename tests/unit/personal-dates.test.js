// Şəxsi xatırlatmaların klient tarixləri (src/utils/personalDates.js) — serverlə (server/personal.js) eyni;
// məktub çatdırılma günü (il, Ramazan, ad günü), zəkat arxivi (localStorage), paylaşma tokeni hash-dan.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import * as pd from '../../src/utils/personalDates.js'
import { readFollowToken, followLink } from '../../src/api/personal.js'
import { gregorianToHijri, parseGKey } from '../../src/utils/hijri.js'

const srv = createRequire(import.meta.url)('../../server/personal.js')

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) } }

describe('personalDates ≡ server/personal.js', () => {
  it('hövl — eyni tarix', () => {
    const froms = ['2026-01-01', '2026-11-17', '2027-03-05', '2028-02-28']
    for (const s of ['2026-01-10', '2025-03-01', '2026-11-17', '2024-08-31']) for (const f of froms) {
      expect(pd.hawlDue(s, f)).toBe(srv.hawlDue(s, f))
    }
  })
  // Vəfat ildönümü hesabı silinib (2026-11-23): sevdiklərim üçün xatırlatma vəfat tarixinə bağlı deyil
  it('ildönümü funksiyası yoxdur (klient və server)', () => {
    expect(pd.nextAnniversary).toBeUndefined()
    expect(srv.nextAnniversary).toBeUndefined()
  })
})

describe('məktubun çatdırılma günü', () => {
  const now = new Date(2026, 10, 17, 15, 0)     // 17 noyabr 2026, yerli
  it('öz tarix: bu gün və gələcək — bəli; keçmiş — yox', () => {
    expect(pd.letterDeliverOn('date', { now, date: '2026-11-17' })).toBe('2026-11-17')
    expect(pd.letterDeliverOn('date', { now, date: '2027-05-01' })).toBe('2027-05-01')
    expect(pd.letterDeliverOn('date', { now, date: '2026-11-16' })).toBeNull()
    expect(pd.letterDeliverOn('date', { now, date: '2026-02-30' })).toBeNull()
  })
  it('1 il sonra və gələn Ramazanın 1-i', () => {
    expect(pd.letterDeliverOn('year', { now })).toBe('2027-11-17')
    const r = pd.letterDeliverOn('ramadan', { now })
    expect(gregorianToHijri(parseGKey(r))).toMatchObject({ month: 9, day: 1 })
    expect(r > '2026-11-17').toBe(true)
  })
  it('ad günü: növbəti (bu gün daxil), 29 fevral; doğum tarixinin özü qaytarılmır', () => {
    expect(pd.letterDeliverOn('birthday', { now, birth: '1990-11-17' })).toBe('2026-11-17')
    expect(pd.letterDeliverOn('birthday', { now, birth: '1990-03-05' })).toBe('2027-03-05')
    expect(pd.nextBirthday('2000-02-29', now)).toBe('2027-02-28')
    expect(pd.letterDeliverOn('birthday', { now, birth: '' })).toBeNull()
  })
})

describe('zəkat arxivi (localStorage)', () => {
  it('yazılır, eyni gün əvəz olunur, yararsız atılır, silinir', () => {
    const s = mem()
    pd.saveZakatArchive({ date: '2025-11-01', total: 10000, zakat: 250, currency: 'AZN' }, s)
    pd.saveZakatArchive({ date: '2026-11-01', total: 12000.456, zakat: 300.011, currency: 'AZN' }, s)
    let l = pd.saveZakatArchive({ date: '2026-11-01', total: 13000, zakat: 325, currency: 'AZN' }, s)
    expect(l.map((e) => e.date)).toEqual(['2026-11-01', '2025-11-01'])
    expect(l[0].zakat).toBe(325)
    l = pd.saveZakatArchive({ date: 'x', total: 1, zakat: 1, currency: 'AZN' }, s)
    expect(l).toHaveLength(2)
    s.setItem(pd.ZAKAT_ARCHIVE_KEY, JSON.stringify([...l, { date: '2020-01-01', total: -5, zakat: 1, currency: 'AZN' }, 'zibil']))
    expect(pd.loadZakatArchive(s)).toHaveLength(2)
    expect(pd.removeZakatArchive('2025-11-01', s).map((e) => e.date)).toEqual(['2026-11-01'])
  })
})

describe('paylaşma keçidi', () => {
  it('token hash-da; yalnız 43 simvol base64url', () => {
    const tok = 'A'.repeat(43)
    const url = followLink('https://muslims.cc', '/en/account', tok)
    expect(url).toBe(`https://muslims.cc/en/account#follow=${tok}`)
    expect(readFollowToken(new URL(url).hash)).toBe(tok)
    expect(readFollowToken('#follow=short')).toBe('')
    expect(readFollowToken('#x=1&follow=' + tok)).toBe(tok)
  })
})
