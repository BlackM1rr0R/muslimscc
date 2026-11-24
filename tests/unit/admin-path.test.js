// Gizli admin ünvanı (VITE_ADMIN_PATH, src/seo/routes.js): verilməyibsə heç nə dəyişmir (/admin, /adminlogin);
// verilibsə panel /<gizli>, köhnə giriş /<gizli>/login, /admin və /adminlogin (dil prefiksli də) — 404 (known:false).
// Sitemap/llms.txt-ə düşmür (noindex). Format yoxlaması (^/[a-z0-9-]{8,40}$).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ADMIN_PATH, ADMIN_HIDDEN, DEFAULT_ADMIN_PATH, resolveAdminPath, adminRoutePaths, pathFor, parsePath, NOINDEX_KEYS, INDEXABLE } from '../../src/seo/routes.js'

// Test üçün nümunə (həqiqi dəyər deyil — həqiqi dəyər yalnız GitHub sirrindədir)
const SAMPLE = '/test-panel-0000'

describe('VITE_ADMIN_PATH verilməyib — köhnə davranış', () => {
  it('panel /admin, giriş /adminlogin, hər dildə tanınır', () => {
    expect(ADMIN_PATH).toBe(DEFAULT_ADMIN_PATH)
    expect(ADMIN_HIDDEN).toBe(false)
    expect(pathFor('admin', 'az')).toBe('/admin')
    expect(pathFor('adminlogin', 'az')).toBe('/adminlogin')
    expect(pathFor('admin', 'en')).toBe('/en/admin')
    for (const p of ['/admin', '/adminlogin', '/en/admin', '/ru/adminlogin']) expect(parsePath(p).known, p).toBe(true)
    expect(parsePath('/admin').key).toBe('admin')
    expect(parsePath('/adminlogin').key).toBe('adminlogin')
    expect(NOINDEX_KEYS.has('admin') && NOINDEX_KEYS.has('adminlogin')).toBe(true)
    expect(INDEXABLE.some((p) => p.key === 'admin' || p.key === 'adminlogin')).toBe(false)
  })
})

describe('format yoxlaması', () => {
  it('yalnız ^/[a-z0-9-]{8,40}$ qəbul olunur, qalanı /admin', () => {
    expect(resolveAdminPath(SAMPLE)).toBe(SAMPLE)
    expect(resolveAdminPath(` ${SAMPLE} `)).toBe(SAMPLE)
    for (const bad of [undefined, null, '', '/admin', '/short', 'no-slash-here', '/UPPER-case-x', '/a/b-cdefghij', '/x'.padEnd(42, 'y'), '/sp ace-12345', 42]) {
      expect(resolveAdminPath(bad), String(bad)).toBe('/admin')
    }
    expect(adminRoutePaths('/admin')).toEqual({ admin: 'admin', adminlogin: 'adminlogin' })
    expect(adminRoutePaths(SAMPLE)).toEqual({ admin: SAMPLE.slice(1), adminlogin: `${SAMPLE.slice(1)}/login` })
  })
})

describe('VITE_ADMIN_PATH verilib', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

  it('/admin, /adminlogin (və dil prefiksliləri) 404; panel gizli ünvanda; sitemap-a düşmür', async () => {
    vi.stubEnv('VITE_ADMIN_PATH', SAMPLE)
    vi.resetModules()
    const r = await import('../../src/seo/routes.js')
    expect(r.ADMIN_HIDDEN).toBe(true)
    expect(r.pathFor('admin', 'az')).toBe(SAMPLE)
    expect(r.pathFor('admin', 'ru')).toBe(`/ru${SAMPLE}`)
    expect(r.pathFor('adminlogin', 'az')).toBe(`${SAMPLE}/login`)
    for (const p of ['/admin', '/adminlogin', '/en/admin', '/ru/adminlogin', '/az/admin', '/tr/admin/']) {
      expect(r.parsePath(p).known, p).toBe(false)
    }
    expect(r.parsePath(SAMPLE)).toMatchObject({ key: 'admin', known: true })
    expect(r.parsePath(`/en${SAMPLE}`)).toMatchObject({ key: 'admin', lang: 'en', known: true })
    expect(r.parsePath(`${SAMPLE}/login`)).toMatchObject({ key: 'adminlogin', known: true })
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
