// İstifadəçi hesabı — klient tərəfi (src/api/userSession.js, src/api/userAuth.js) və marşrutlar
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  safeStorage, hasLoginHint, HINT_KEY, authFetch, AuthError, getAuthState, setCurrentUser, refreshMe, logoutUser, initialOf,
} from '../../src/api/userSession.js'
import {
  errorKey, passwordStrength, readHashToken, safeNext, assignableRoles, validMosqueId, validEmail, register, login,
  adminSetRole, changePassword, deleteAccount, isPanelRole, MIN_PASSWORD,
} from '../../src/api/userAuth.js'
import { parsePath, pathFor, PAGES, INDEXABLE, NOINDEX_KEYS } from '../../src/seo/routes.js'

function memoryStorage() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
    _m: m,
  }
}

const json = (status, body, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (h) => headers[h] ?? headers[h.toLowerCase()] ?? null },
  json: async () => body,
})

let calls
function mockFetch(...responses) {
  calls = []
  const queue = [...responses]
  globalThis.fetch = vi.fn(async (url, init) => {
    calls.push({ url, init, body: init && init.body ? JSON.parse(init.body) : undefined })
    const r = queue.shift()
    if (r instanceof Error) throw r
    return r
  })
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage(), configurable: true, writable: true })
  setCurrentUser(null)
})
afterEach(() => {
  delete globalThis.fetch
  delete globalThis.localStorage
})

describe('safeStorage / ipucu', () => {
  it('localStorage müraciəti xəta atırsa (özəl rejim) — null, ipucu yoxdur', () => {
    Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('SecurityError') }, configurable: true })
    expect(safeStorage()).toBeNull()
    expect(hasLoginHint()).toBe(false)
    expect(() => setCurrentUser({ id: 1 })).not.toThrow()
  })

  it('giriş ipucu yazır, çıxış silir', () => {
    setCurrentUser({ id: 1, email: 'a@x.az' })
    expect(globalThis.localStorage.getItem(HINT_KEY)).toBe('1')
    expect(getAuthState()).toMatchObject({ status: 'user', user: { id: 1 } })
    setCurrentUser(null)
    expect(globalThis.localStorage.getItem(HINT_KEY)).toBeNull()
    expect(getAuthState().status).toBe('anon')
  })

  it('avatar hərfi: ad, yoxdursa e-poçt', () => {
    expect(initialOf({ displayName: 'əli', email: 'z@x.az' })).toBe('Ə')
    expect(initialOf({ displayName: '', email: 'zeyneb@x.az' })).toBe('Z')
    expect(initialOf(null)).toBe('')
  })
})

describe('authFetch', () => {
  it('cookie, CSRF başlığı və JSON göndərir', async () => {
    mockFetch(json(200, { ok: true }))
    await authFetch('/api/auth/login', { method: 'POST', body: { email: 'a@x.az', password: 'p' } })
    const { url, init } = calls[0]
    expect(url).toBe('/api/auth/login')
    expect(init.credentials).toBe('same-origin')
    expect(init.headers['X-Requested-With']).toBe('fetch')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ email: 'a@x.az', password: 'p' })
  })

  it('GET-də gövdə və Content-Type yoxdur', async () => {
    mockFetch(json(200, { id: 1 }))
    await authFetch('/api/auth/me')
    expect(calls[0].init.body).toBeUndefined()
    expect(calls[0].init.headers['Content-Type']).toBeUndefined()
  })

  it('səhvdə {error, code} və Retry-After oxunur', async () => {
    mockFetch(json(429, { error: 'Too many', code: 'rate_limited' }, { 'Retry-After': '42' }))
    const e = await authFetch('/api/auth/login', { method: 'POST', body: {} }).catch(x => x)
    expect(e).toBeInstanceOf(AuthError)
    expect(e).toMatchObject({ status: 429, code: 'rate_limited', retryAfter: 42, message: 'Too many' })
  })

  it('JSON olmayan səhv cavabı da AuthError-dur', async () => {
    mockFetch({ ok: false, status: 502, headers: { get: () => null }, json: async () => { throw new Error('html') } })
    const e = await authFetch('/api/auth/me').catch(x => x)
    expect(e).toMatchObject({ status: 502, code: '' })
  })
})

describe('refreshMe / logoutUser', () => {
  it('200 → istifadəçi; 401 → anonim və ipucu silinir', async () => {
    mockFetch(json(200, { id: 7, email: 'a@x.az', role: 'user' }))
    expect(await refreshMe()).toMatchObject({ id: 7 })
    expect(getAuthState().status).toBe('user')
    expect(hasLoginHint()).toBe(true)

    mockFetch(json(401, { error: 'Unauthorized', code: 'unauthenticated' }))
    expect(await refreshMe()).toBeNull()
    expect(getAuthState().status).toBe('anon')
    expect(hasLoginHint()).toBe(false)
  })

  it('şəbəkə xətası vəziyyəti dəyişmir (oflayn ziyarətçi "çıxmış" görünmür)', async () => {
    setCurrentUser({ id: 1 })
    mockFetch(new TypeError('Failed to fetch'))
    await expect(refreshMe()).rejects.toThrow(TypeError)
    expect(getAuthState().status).toBe('user')
    expect(hasLoginHint()).toBe(true)
  })

  it('eyni anda iki çağırış — tək sorğu', async () => {
    mockFetch(json(200, { id: 1 }))
    await Promise.all([refreshMe(), refreshMe()])
    expect(calls).toHaveLength(1)
  })

  it('çıxış şəbəkə alınmasa da ipucunu silir', async () => {
    setCurrentUser({ id: 1 })
    mockFetch(new TypeError('offline'))
    await logoutUser().catch(() => {})
    expect(hasLoginHint()).toBe(false)
  })
})

describe('endpoint köməkçiləri', () => {
  it('register: 202 → checkEmail (cookie/istifadəçi yox), 201 → daxil olur', async () => {
    mockFetch(json(202, { ok: true, checkEmail: true }))
    expect(await register({ email: ' a@x.az ', password: 'uzun-şifrə-123', displayName: '  ', lang: 'en' })).toEqual({ checkEmail: true })
    expect(calls[0].body).toEqual({ email: 'a@x.az', password: 'uzun-şifrə-123', lang: 'en' })
    expect(getAuthState().status).toBe('anon')

    mockFetch(json(201, { ok: true, user: { id: 2 }, verificationSent: true }))
    expect(await register({ email: 'b@x.az', password: 'uzun-şifrə-123', displayName: 'Əli' })).toEqual({ user: { id: 2 }, verificationSent: true })
    expect(calls[0].body.displayName).toBe('Əli')
    expect(getAuthState().status).toBe('user')
  })

  it('login səhv şifrədə istifadəçini qoymur', async () => {
    mockFetch(json(401, { error: 'Invalid credentials', code: 'invalid_credentials' }))
    const e = await login('a@x.az', 'x').catch(x => x)
    expect(errorKey(e)).toBe('errCreds')
    expect(getAuthState().status).toBe('anon')
  })

  it('şifrəsiz hesabda "current" göndərilmir; silmə — şifrə və ya DELETE', async () => {
    mockFetch(json(200, { ok: true }), json(200, { ok: true }), json(200, { ok: true }))
    await changePassword('', 'yeni-uzun-şifrə')
    await changePassword('köhnə', 'yeni-uzun-şifrə')
    expect(calls[0].body).toEqual({ next: 'yeni-uzun-şifrə' })
    expect(calls[1].body).toEqual({ current: 'köhnə', next: 'yeni-uzun-şifrə' })
    setCurrentUser({ id: 1 })
    await deleteAccount({ confirm: 'DELETE' })
    expect(calls[2].body).toEqual({ confirm: 'DELETE' })
    expect(getAuthState().status).toBe('anon')
  })

  it('admin rol dəyişikliyi: mosqueId yalnız mosque_rep üçün', async () => {
    mockFetch(json(200, { ok: true }), json(200, { ok: true }))
    await adminSetRole(5, 'mosque_rep', 'baku-taza-pir')
    await adminSetRole(5, 'editor', 'baku-taza-pir')
    expect(calls[0].url).toBe('/api/admin/users/5/role')
    expect(calls[0].body).toEqual({ role: 'mosque_rep', mosqueId: 'baku-taza-pir' })
    expect(calls[1].body).toEqual({ role: 'editor' })
  })
})

describe('saf köməkçilər', () => {
  it('errorKey: server kodları, status, şəbəkə və WebAuthn', () => {
    const E = (status, code) => new AuthError(status, { error: 'x', code })
    expect(errorKey(E(409, 'link_requires_verification'))).toBe('errLinkVerify')
    expect(errorKey(E(400, 'weak_password'))).toBe('errWeak')
    expect(errorKey(E(403, 'script_only'))).toBe('errScriptOnly')
    expect(errorKey(E(403, 'superadmin_required'))).toBe('errSuperOnly')
    expect(errorKey(E(403, 'self'))).toBe('errSelf')
    expect(errorKey(E(429, 'rate_limited'))).toBe('errMany')
    expect(errorKey(E(401, 'unauthenticated'))).toBe('errSession')
    expect(errorKey(E(500, 'server_error'))).toBe('errUnknown')
    expect(errorKey(new TypeError('Failed to fetch'))).toBe('errNet')
    expect(errorKey(Object.assign(new Error('x'), { name: 'NotAllowedError' }))).toBe('cancelled')
    expect(errorKey(Object.assign(new Error('x'), { name: 'InvalidStateError' }))).toBe('errPasskeyExists')
  })

  it('şifrə gücü: qısa, zəif, güclü', () => {
    expect(passwordStrength('')).toEqual({ score: 0, short: true })
    expect(passwordStrength('a'.repeat(MIN_PASSWORD - 1)).short).toBe(true)
    expect(passwordStrength('1234567890').score).toBeLessThanOrEqual(1)
    expect(passwordStrength('aaaaaaaaaaaa').score).toBeLessThanOrEqual(1)
    expect(passwordStrength('zeyneb@x.az'.split('@')[0] + '12345', 'zeyneb@x.az').short).toBe(false)
    expect(passwordStrength('Bakı-Şəki 2026 yol!').score).toBe(4)
    expect(passwordStrength('correct horse battery').score).toBeGreaterThanOrEqual(3)
  })

  it('readHashToken: yalnız #token=…, təhlükəli simvolsuz', () => {
    const tok = 'A'.repeat(43)
    expect(readHashToken(`#token=${tok}`)).toBe(tok)
    expect(readHashToken(`#x=1&token=${tok}`)).toBe(tok)
    expect(readHashToken('#token=<script>')).toBe('')
    expect(readHashToken('')).toBe('')
    expect(readHashToken('#admin')).toBe('')
  })

  it('safeNext: yalnız saytın öz nisbi yolu', () => {
    expect(safeNext('/account', '/x')).toBe('/account')
    expect(safeNext('/en/quran?s=2', '/x')).toBe('/en/quran?s=2')
    expect(safeNext('//evil.com', '/x')).toBe('/x')
    expect(safeNext('/\\evil.com', '/x')).toBe('/x')
    expect(safeNext('https://evil.com', '/x')).toBe('/x')
    expect(safeNext('javascript:alert(1)', '/x')).toBe('/x')
    expect(safeNext(null, '/x')).toBe('/x')
  })

  it('təklif olunan rollar: superadmin heç vaxt, admin yalnız superadmin-ə', () => {
    expect(assignableRoles('admin')).toEqual(['user', 'mosque_rep', 'editor'])
    expect(assignableRoles('superadmin')).toEqual(['user', 'mosque_rep', 'editor', 'admin'])
    expect(assignableRoles('superadmin')).not.toContain('superadmin')
    expect(isPanelRole('editor')).toBe(true)
    expect(isPanelRole('mosque_rep')).toBe(false)
  })

  it('məscid ID-si və e-poçt yoxlaması serverlə eynidir', () => {
    expect(validMosqueId('baku-taza-pir')).toBe(true)
    expect(validMosqueId('')).toBe(false)
    expect(validMosqueId('Bakı')).toBe(false)
    expect(validMosqueId('a'.repeat(65))).toBe(false)
    expect(validEmail(' a@x.az ')).toBe(true)
    expect(validEmail('a@x')).toBe(false)
  })
})

describe('marşrutlar: /login, /signup, /account, /account/verify, /account/reset', () => {
  it('iki seqmentli yol öz səhifəsidir, dil prefiksi ilə də', () => {
    expect(parsePath('/account/verify')).toMatchObject({ lang: 'az', key: 'accountverify', known: true })
    expect(parsePath('/en/account/reset')).toMatchObject({ lang: 'en', key: 'accountreset', known: true })
    expect(parsePath('/ru/account')).toMatchObject({ lang: 'ru', key: 'account', known: true })
    expect(parsePath('/account/verify/x').known).toBe(false)
    expect(pathFor('accountreset', 'ar')).toBe('/ar/account/reset')
    expect(pathFor('login', 'az')).toBe('/login')
  })

  it('hamısı noindex — sitemap-a (INDEXABLE) düşmür', () => {
    for (const k of ['login', 'signup', 'account', 'accountverify', 'accountreset']) {
      expect(NOINDEX_KEYS.has(k), k).toBe(true)
      expect(INDEXABLE.some(p => p.key === k), k).toBe(false)
      expect(PAGES.some(p => p.key === k), k).toBe(true)
    }
    expect(NOINDEX_KEYS.has('admin')).toBe(true)
    expect(NOINDEX_KEYS.has('quran')).toBe(false)
  })
})
