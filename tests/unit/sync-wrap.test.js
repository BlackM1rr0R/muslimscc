// Bərpa kodunun hesab qabı (src/utils/syncWrap.js) — PBKDF2 + AES-GCM, PRF (HKDF) — Node WebCrypto ilə
import { describe, it, expect } from 'vitest'
import { generateCode } from '../../src/utils/syncCrypto.js'
import {
  PBKDF2_ITERATIONS, wrapWithPassword, unwrapWithPassword, passwordKey, newPasswordSalt, parsePasswordSalt,
  prfKey, newPrfSalt, wrapCode, unwrapCode,
} from '../../src/utils/syncWrap.js'

const PW = 'yaxşı-uzun-şifrə-2026'

describe('şifrə qabı (PBKDF2-SHA256 + AES-256-GCM)', () => {
  it('susmaya görə ≥600 000 dövr, 16 bayt təsadüfi duz; salt sətrində dövr sayı', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600000)
    const a = newPasswordSalt(), b = newPasswordSalt()
    expect(a).toMatch(/^pbkdf2-sha256\$600000\$[A-Za-z0-9_-]{22}$/)
    expect(a).not.toBe(b)
    expect(parsePasswordSalt(a).salt).toHaveLength(16)
    expect(parsePasswordSalt('pbkdf2-sha256$1000$AAAAAAAAAAAAAAAAAAAAAA')).toBeNull()   // çox az dövr — qəbul olunmur
    expect(parsePasswordSalt('md5$x')).toBeNull()
  })

  it('gedib-qayıtma: şifrə ilə açılır; wrapped yalnız base64url, kodu açıq saxlamır', async () => {
    const code = generateCode()
    const { salt, wrapped } = await wrapWithPassword(code, PW)
    expect(wrapped).toMatch(/^[A-Za-z0-9_-]{40,512}$/)
    expect(wrapped).not.toContain(code.replace(/-/g, ''))
    expect(await unwrapWithPassword({ salt, wrapped }, PW)).toBe(code)
  }, 20000)

  it('səhv şifrə — təmiz Error("unwrap"), yarımçıq nəticə yoxdur', async () => {
    const code = generateCode()
    const w = await wrapWithPassword(code, PW, { iterations: 100000 })
    await expect(unwrapWithPassword(w, PW + '!')).rejects.toThrow('unwrap')
    await expect(unwrapWithPassword(w, '')).rejects.toThrow()
  }, 20000)

  it('pozulmuş qab, başqa növ (AAD) və ya başqa duz — açılmır', async () => {
    const code = generateCode()
    const salt = newPasswordSalt(100000)
    const key = await passwordKey(PW, salt)
    const wrapped = await wrapCode(key, code, 'password')
    expect(await unwrapCode(key, wrapped, 'password')).toBe(code)
    await expect(unwrapCode(key, wrapped, 'prf')).rejects.toThrow('unwrap')          // növ AAD-dədir
    const bytes = wrapped.split('')
    bytes[30] = bytes[30] === 'A' ? 'B' : 'A'
    await expect(unwrapCode(key, bytes.join(''), 'password')).rejects.toThrow('unwrap')
    await expect(unwrapCode(key, 'qısa', 'password')).rejects.toThrow('unwrap')
    const other = await passwordKey(PW, newPasswordSalt(100000))
    await expect(unwrapCode(other, wrapped, 'password')).rejects.toThrow('unwrap')
  }, 20000)

  it('eyni açarla iki dəfə — fərqli IV (fərqli qab), hər ikisi açılır', async () => {
    const code = generateCode()
    const key = await passwordKey(PW, newPasswordSalt(100000))
    const a = await wrapCode(key, code, 'password'), b = await wrapCode(key, code, 'password')
    expect(a).not.toBe(b)
    expect(await unwrapCode(key, b, 'password')).toBe(code)
  }, 20000)

  it('səhv kod qablanmır', async () => {
    const key = await passwordKey(PW, newPasswordSalt(100000))
    await expect(wrapCode(key, 'kod-deyil', 'password')).rejects.toThrow('bad_code')
  }, 20000)
})

describe('passkey PRF qabı (HKDF-SHA256)', () => {
  it('eyni PRF çıxışı açır, başqası açmır', async () => {
    const code = generateCode()
    const prf = crypto.getRandomValues(new Uint8Array(32))
    const salt = newPrfSalt()
    expect(salt).toMatch(/^hkdf-sha256\$[A-Za-z0-9_-]{22}$/)
    const wrapped = await wrapCode(await prfKey(prf, salt), code, 'prf')
    expect(await unwrapCode(await prfKey(prf.slice(), salt), wrapped, 'prf')).toBe(code)
    const other = crypto.getRandomValues(new Uint8Array(32))
    await expect(unwrapCode(await prfKey(other, salt), wrapped, 'prf')).rejects.toThrow('unwrap')
    await expect(prfKey(new Uint8Array(4), salt)).rejects.toThrow('bad_salt')
  })
})
