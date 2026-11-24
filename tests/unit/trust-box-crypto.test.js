// "Əmanət qutusu" klient kriptoqrafiyası (src/utils/trustBoxCrypto.js) — Node WebCrypto ilə
import { describe, it, expect } from 'vitest'
import {
  sealBox, openBox, encryptPayload, decryptPayload, deriveBoxKey, newBoxSalt, normalizePassphrase, checkPassphrase,
  generatePassphrase, newLinkToken, linkHashOf, parseTrustHash, sanitizePayload, emptyPayload, hasContent, importDebts,
  PASS_MIN, LIMITS,
} from '../../src/utils/trustBoxCrypto.js'
import { remaining, isSettled } from '../../src/utils/debtLedger.js'
import { validSalt, validBlob } from '../../server/trustBox.js'

const PASS = 'nənəmin bağçasında üç alma ağacı'
const SECRET = 'Kağızlar mətbəx şkafının üst rəfindədir — QZX-MARKER-91'
const payload = () => ({
  ...emptyPayload(), from: 'Əli', will: 'Üçdə birdən az — məscidə.', docs: SECRET, words: 'Sizi sevirəm',
  debts: [{ k: 'owe', p: 'Rəşad', a: 150, cu: 'AZN', no: '' }, { k: 'owed', p: 'Kamran', a: '20.555', cu: 'usd', no: 'telefon' }],
})

describe('əmanət qutusu: şifrələmə', () => {
  it('round-trip: düzgün parol eyni məzmunu qaytarır; blok serverin formatına uyğundur', async () => {
    const { salt, blob } = await sealBox(payload(), PASS)
    expect(salt).toMatch(/^pbkdf2-sha256\$600000\$[A-Za-z0-9_-]{22}$/)
    expect(validSalt(salt)).toBe(true)
    expect(validBlob(blob)).toBe(true)
    // açıq mətn blokda görünmür (nə birbaşa, nə base64 kimi)
    expect(blob).not.toContain('MARKER')
    expect(Buffer.from(blob, 'base64url').toString('utf8')).not.toContain('MARKER')
    const { payload: back } = await openBox({ salt, blob }, PASS)
    expect(back.docs).toBe(SECRET)
    expect(back.from).toBe('Əli')
    expect(back.debts).toEqual([
      { k: 'owe', p: 'Rəşad', a: 150, cu: 'AZN', no: '' },
      { k: 'owed', p: 'Kamran', a: 20.56, cu: '', no: 'telefon' },   // valyuta 3 böyük hərf deyil → boş
    ])
  }, 20000)

  it('səhv parol → wrong_passphrase (yarımçıq nəticə yoxdur); pozulmuş blok → xəta', async () => {
    const { salt, blob } = await sealBox(payload(), PASS)
    await expect(openBox({ salt, blob }, PASS + '!')).rejects.toThrow('wrong_passphrase')
    await expect(openBox({ salt, blob }, '')).rejects.toThrow('wrong_passphrase')
    const bytes = Buffer.from(blob, 'base64url'); bytes[bytes.length - 1] ^= 1
    await expect(openBox({ salt, blob: bytes.toString('base64url') }, PASS)).rejects.toThrow('wrong_passphrase')
    await expect(openBox({ salt, blob: 'AAAA' }, PASS)).rejects.toThrow('bad_blob')
    await expect(openBox({ salt: 'pbkdf2-sha256$1000$AAAAAAAAAAAAAAAAAAAAAA', blob }, PASS)).rejects.toThrow('bad_salt')
  }, 20000)

  it('parol kağızdan köçürməyə dözümlüdür: boşluqlar, NFC; yaradılmış kod hərf ölçüsündən asılı deyil', async () => {
    expect(normalizePassphrase('  a   b\tc  ')).toBe('a b c')
    expect(normalizePassphrase('Ə'.normalize('NFD'))).toBe('Ə')
    const code = generatePassphrase()
    expect(code).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){5}$/)
    const salt = newBoxSalt()
    const key = await deriveBoxKey(code, salt)
    const blob = await encryptPayload(key, payload())
    const key2 = await deriveBoxKey(` ${code.toLowerCase().replace(/-/g, ' ')} `, salt)
    expect((await decryptPayload(key2, blob)).docs).toBe(SECRET)
  }, 20000)

  it('parol gücü: qısa və zəif rədd, yaradılmış kod keçir', () => {
    expect(checkPassphrase('x'.repeat(PASS_MIN - 1))).toBe('short')
    expect(checkPassphrase('aaaaaaaaaaaaaaa')).toBe('weak')
    expect(checkPassphrase('123456789012345')).toBe('weak')
    expect(checkPassphrase('password12345678')).toBe('weak')
    expect(checkPassphrase(PASS)).toBeNull()
    expect(checkPassphrase(generatePassphrase())).toBeNull()
  })
})

describe('əmanət qutusu: keçid və məzmun', () => {
  it('token 43 simvol, heş 64 hex; fraqmentdən oxunur', async () => {
    const t = newLinkToken()
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(newLinkToken()).not.toBe(t)
    const h = await linkHashOf(t)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(h).not.toContain(t)
    expect(parseTrustHash(`#t=${t}`)).toBe(t)
    expect(parseTrustHash(`#x=1&t=${t}`)).toBe(t)
    expect(parseTrustHash('#t=short')).toBeNull()
    expect(parseTrustHash('')).toBeNull()
  })

  it('sanitizePayload: həddlər, yararsız borclar, idarə simvolları', () => {
    const p = sanitizePayload({
      from: 'x'.repeat(200), will: 'a\u0000b\r\nc', docs: 42, link: 'bad',
      debts: [null, { k: 'steal', p: 'A', a: -5 }, { p: '', no: '', a: '' }, ...Array.from({ length: 400 }, (_, i) => ({ k: 'owed', p: `P${i}`, a: 1 }))],
    })
    expect(p.from).toHaveLength(LIMITS.from)
    expect(p.will).toBe('ab\nc')
    expect(p.docs).toBe('')
    expect(p.link).toBe('')
    expect(p.debts).toHaveLength(LIMITS.debts)
    expect(p.debts[0]).toEqual({ k: 'owe', p: 'A', a: null, cu: '', no: '' })
    expect(hasContent(emptyPayload())).toBe(false)
    expect(hasContent(p)).toBe(true)
  })

  it('borc dəftərindən gətirmə: yalnız açıq borclar, qalıq məbləğ; təkrar gətirmə dublikat yaratmır', () => {
    const ledger = { l: [
      { id: 'dabc123', k: 'owe', p: 'Rəşad', a: 100, cu: 'AZN', d: '2026-01-01', r: [{ id: 'rx1234', d: '2026-02-01', a: 40 }], u: 1 },
      { id: 'dabc124', k: 'owed', p: 'Kamran', a: 50, cu: 'USD', d: '2026-01-01', r: [], s: true, u: 1 },
      { id: 'dabc125', k: 'owed', p: 'Səbinə', a: 10, cu: 'EUR', d: '2026-01-01', r: [], no: 'kitab', u: 1 },
    ] }
    const manual = { k: 'owe', p: 'Dükan', a: 5, cu: 'AZN', no: '' }
    let r = importDebts([manual], ledger, { remainingOf: remaining, settled: isSettled })
    expect(r.added).toBe(2)
    expect(r.debts).toEqual([
      manual,
      { k: 'owe', p: 'Rəşad', a: 60, cu: 'AZN', no: '', ref: 'dabc123' },
      { k: 'owed', p: 'Səbinə', a: 10, cu: 'EUR', no: 'kitab', ref: 'dabc125' },
    ])
    r = importDebts(r.debts, ledger, { remainingOf: remaining, settled: isSettled })
    expect(r.debts).toHaveLength(3)
  })
})
