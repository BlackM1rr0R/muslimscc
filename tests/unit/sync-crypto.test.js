// Sinxronizasiya kriptoqrafiyası (src/utils/syncCrypto.js) — Node 24 WebCrypto ilə
import { describe, it, expect } from 'vitest'
import {
  generateCode, normalizeCode, deriveKeys, encryptText, decryptText, toBase32, fromBase32,
} from '../../src/utils/syncCrypto.js'

describe('bərpa kodu', () => {
  it('format: 6 qrup × 4 Crockford simvolu; hər dəfə fərqli', () => {
    const a = generateCode(), b = generateCode()
    expect(a).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){5}$/)
    expect(a).not.toBe(b)
  })
  it('normalizeCode: kiçik hərf, boşluq, O/0 və I/L/1 qarışıqlığı bağışlanır', () => {
    const c = generateCode()
    expect(normalizeCode(c.toLowerCase().replace(/-/g, ' '))).toBe(c)
    expect(normalizeCode('0000-1111-2222-3333-4444-5555')).toBe('0000-1111-2222-3333-4444-5555')
    expect(normalizeCode('OOOO-IIII-LLLL-3333-4444-5555')).toBe('0000-1111-1111-3333-4444-5555')
    expect(normalizeCode('short')).toBeNull()
    expect(normalizeCode('UUUU-1111-2222-3333-4444-5555')).toBeNull()   // U əlifbada yoxdur
  })
  it('base32 gediş-dönüş', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 128, 7, 9, 10, 11, 12, 13, 14, 15, 16])
    expect([...fromBase32(toBase32(bytes))]).toEqual([...bytes])
  })
})

describe('açarlar və şifrələmə', () => {
  it('id determinist, 64 hex; fərqli kod — fərqli id', async () => {
    const c = generateCode()
    const a = await deriveKeys(c), b = await deriveKeys(c.toLowerCase())
    expect(a.id).toMatch(/^[0-9a-f]{64}$/)
    expect(a.id).toBe(b.id)
    expect((await deriveKeys(generateCode())).id).not.toBe(a.id)
  })
  it('şifrələ → aç (Unicode, böyük mətn); blok base64url; səhv kod açmır', async () => {
    const { key } = await deriveKeys(generateCode())
    const text = JSON.stringify({ ar: 'بِسْمِ اللَّهِ', az: 'Əlhəmdulillah', big: 'x'.repeat(50000) })
    const blob = await encryptText(key, text)
    expect(blob).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(blob.length).toBeLessThan(text.length / 4)            // gzip işləyir
    expect(await decryptText(key, blob)).toBe(text)
    const other = (await deriveKeys(generateCode())).key
    await expect(decryptText(other, blob)).rejects.toBeTruthy()
  })
  it('eyni mətn hər dəfə fərqli blok verir (təsadüfi IV)', async () => {
    const { key } = await deriveKeys(generateCode())
    expect(await encryptText(key, 'salam')).not.toBe(await encryptText(key, 'salam'))
  })
})
