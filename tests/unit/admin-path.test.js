// İdarə panelinin ünvanı (src/seo/routes.js → ADMIN_PATH, docs/ADMIN-SECURITY.md → "Panelin ünvanı"):
// susmaya görə /account/panel (dil prefiksli də); /admin, /adminlogin (və dil prefiksliləri) HƏMİŞƏ 404 (known:false);
// ayrıca admin giriş səhifəsi (adminlogin açarı) yoxdur. İstəyə bağlı VITE_ADMIN_PATH paneli /<gizli>-yə köçürür.
// Sitemap/llms.txt-ə düşmür (noindex). Format yoxlaması (^/[a-z0-9-]{8,40}$).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ADMIN_PATH, ADMIN_HIDDEN, DEFAULT_ADMIN_PATH, resolveAdminPath, adminRoutePath, pathFor, parsePath, PAGES, NOINDEX_KEYS, INDEXABLE } from '../../src/seo/routes.js'

// Test üçün nümunə (həqiqi dəyər deyil — həqiqi dəyər yalnız GitHub sirrindədir)
const SAMPLE = '/test-panel-0000'
const LEGACY = ['/admin', '/adminlogin', '/en/admin', '/ru/adminlogin', '/az/admin', '/tr/admin/', '/ar/adminlogin', '/admin/login', '/id/admin']

describe('susmaya görə — panel /account/panel-də', () => {
  it('panel /account/panel, hər dildə tanınır; noindex, sitemap-a düşmür', () => {
    expect(DEFAULT_ADMIN_PATH).toBe('/account/panel')
    expect(ADMIN_PATH).toBe(DEFAULT_ADMIN_PATH)
    expect(ADMIN_HIDDEN).toBe(false)
    expect(pathFor('admin', 'az')).toBe('/account/panel')
    expect(pathFor('admin', 'en')).toBe('/en/account/panel')
    expect(pathFor('admin', 'ar')).toBe('/ar/account/panel')
    for (const p of ['/account/panel', '/en/account/panel', '/ru/account/panel', '/az/account/panel']) {
      expect(parsePath(p), p).toMatchObject({ key: 'admin', known: true })
    }
    expect(parsePath('/account/panel/x').known).toBe(false)
    // Hesab səhifəsi və e-poçt keçidləri dəyişmir
    expect(parsePath('/account')).toMatchObject({ key: 'account', known: true })
    expect(parsePath('/account/verify')).toMatchObject({ key: 'accountverify', known: true })
    expect(NOINDEX_KEYS.has('admin')).toBe(true)
    expect(INDEXABLE.some((p) => p.key === 'admin')).toBe(false)
  })

  it('/admin, /adminlogin (və dil prefiksliləri) — 404; ayrıca giriş səhifəsi yoxdur', () => {
    for (const p of LEGACY) expect(parsePath(p).known, p).toBe(false)
    expect(PAGES.some((p) => p.key === 'adminlogin')).toBe(false)
    expect(PAGES.some((p) => /^admin/.test(p.path))).toBe(false)
  })
})

describe('format yoxlaması', () => {
  it('yalnız ^/[a-z0-9-]{8,40}$ qəbul olunur, qalanı /account/panel', () => {
    expect(resolveAdminPath(SAMPLE)).toBe(SAMPLE)
    expect(resolveAdminPath(` ${SAMPLE} `)).toBe(SAMPLE)
    for (const bad of [undefined, null, '', '/admin', '/short', 'no-slash-here', '/UPPER-case-x', '/a/b-cdefghij', '/x'.padEnd(42, 'y'), '/sp ace-12345', 42]) {
      expect(resolveAdminPath(bad), String(bad)).toBe('/account/panel')
    }
    expect(adminRoutePath('/account/panel')).toBe('account/panel')
    expect(adminRoutePath(SAMPLE)).toBe(SAMPLE.slice(1))
  })
})

describe('VITE_ADMIN_PATH verilib (istəyə bağlı)', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

  it('panel gizli ünvanda; /admin, /adminlogin yenə 404; sitemap-a düşmür', async () => {
    vi.stubEnv('VITE_ADMIN_PATH', SAMPLE)
    vi.resetModules()
    const r = await import('../../src/seo/routes.js')
    expect(r.ADMIN_HIDDEN).toBe(true)
    expect(r.pathFor('admin', 'az')).toBe(SAMPLE)
    expect(r.pathFor('admin', 'ru')).toBe(`/ru${SAMPLE}`)
    for (const p of LEGACY) expect(r.parsePath(p).known, p).toBe(false)
    expect(r.parsePath(SAMPLE)).toMatchObject({ key: 'admin', known: true })
    expect(r.parsePath(`/en${SAMPLE}`)).toMatchObject({ key: 'admin', lang: 'en', known: true })
    expect(r.PAGES.some((p) => p.key === 'adminlogin')).toBe(false)
    expect(r.INDEXABLE.some((p) => p.path.includes(SAMPLE.slice(1)))).toBe(false)
    expect(r.NOINDEX_KEYS.has('admin')).toBe(true)
  })

  it('mövcud səhifə ilə üst-üstə düşən dəyər build-i dayandırır', async () => {
    vi.stubEnv('VITE_ADMIN_PATH', '/prayer-times-x')   // formatı düzgün, amma toqquşma yoxdur → keçir
    vi.resetModules()
    await expect(import('../../src/seo/routes.js')).resolves.toBeTruthy()
    vi.stubEnv('VITE_ADMIN_PATH', '/my-year-book')     // PAGES-də var (yearbook)
    vi.resetModules()
    await expect(import('../../src/seo/routes.js')).rejects.toThrow(/VITE_ADMIN_PATH/)
  })
})
