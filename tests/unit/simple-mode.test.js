// P1: sadə rejim (utils/simpleMode) — tərcihlər, başlanğıc ekran qərarı, yalnız bu cihaz (ehtiyat nüsxə / sinxron yox)
import { describe, it, expect } from 'vitest'
import { sanitizeSimple, readSimple, writeSimple, shouldStartSimple, DEFAULT_SIMPLE, SIMPLE_KEY } from '../../src/utils/simpleMode.js'
import { isBackupKey } from '../../src/utils/userBackup.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { parsePath } from '../../src/seo/routes.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
}
const isHome = (p) => { const r = parsePath(p); return r.known !== false && r.key === 'home' }

describe('simpleMode', () => {
  it('təmizləmə: yanlış dəyərlər standarta düşür; ayə surənin hüdudunda', () => {
    expect(sanitizeSimple(null)).toEqual(DEFAULT_SIMPLE)
    expect(sanitizeSimple({ home: 'yes', xl: 1, s: 115, d: -1, c: 5 })).toEqual({ ...DEFAULT_SIMPLE, c: 5 })
    expect(sanitizeSimple({ s: 1, a: 99 })).toMatchObject({ s: 1, a: 1 })
    expect(sanitizeSimple({ s: 2, a: 255, home: true })).toMatchObject({ s: 2, a: 255, home: true })
  })
  it('yazma/oxuma; standart vəziyyətdə açar silinir', () => {
    const s = mem()
    expect(writeSimple({ home: true }, s).home).toBe(true)
    expect(readSimple(s).home).toBe(true)
    writeSimple({ home: false }, s)
    expect(s.getItem(SIMPLE_KEY)).toBeNull()
  })
  it('başlanğıc ekran: yalnız sayt ana səhifədən açılanda və seçim açıqdırsa', () => {
    const on = mem({ [SIMPLE_KEY]: JSON.stringify({ home: true }) })
    const off = mem()
    for (const p of ['/', '/en', '/ru', '/ar']) expect(shouldStartSimple(p, isHome, on)).toBe(true)
    expect(shouldStartSimple('/en/quran', isHome, on)).toBe(false)
    expect(shouldStartSimple('/en/simple', isHome, on)).toBe(false)
    expect(shouldStartSimple('/en/bilinmeyen-yol', isHome, on)).toBe(false)
    expect(shouldStartSimple('/en', isHome, off)).toBe(false)
    expect(shouldStartSimple('', isHome, on)).toBe(false)
  })
  it('yalnız bu cihaz: ehtiyat nüsxəyə / sinxrona düşmür, profilə aid deyil', () => {
    expect(isBackupKey(SIMPLE_KEY)).toBe(false)
    expect(PROFILE_KEYS).not.toContain(SIMPLE_KEY)
  })
})
