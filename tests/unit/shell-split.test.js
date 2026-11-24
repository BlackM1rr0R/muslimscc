// ═══════════════════════════════════════════════════════
// İlk yüklənmə qoruyucuları (2026-11-24, mobil ~2× sürət):
//   • Seo.jsx meta.js-i (bütün səhifə mətnləri, ~56 KB gzip) STATİK import etmir — ./seoApply.js tənbəldir
//   • qabığın ilk ekrana lazım olmayan hissələri (Footer, InstallBanner, AutoSyncToast, FloatingDock,
//     SideNav) App.jsx/Header.jsx-də statik import olunmur
//   • PWA "beforeinstallprompt" hadisəsi əsas paketdəki utils/installPrompt.js-də ilk andan tutulur
//   • SideNav.css tənbəl yükləndiyi üçün əvvəl başqa fayllarda olan üstələmələr onun SONUNDADIR
//   • /hadith HTML-i hədis məlumatını (~110 KB gzip) yalnız aşağı prioritetlə preload edir
// ═══════════════════════════════════════════════════════
import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'

const read = (f) => fs.readFileSync(f, 'utf8')
const staticImports = (src) => [...src.matchAll(/^import\s[^;]*?from\s+['"]([^'"]+)['"]|^import\s+['"]([^'"]+)['"]/gm)].map(m => m[1] || m[2])

describe('Seo.jsx — head yazıcısı tənbəldir', () => {
  const seo = read('src/seo/Seo.jsx')
  it('meta.js, sxem qurucuları statik import olunmur; seoApply dinamik yüklənir', () => {
    const imps = staticImports(seo)
    for (const heavy of ['./meta', './siteSchema', './pageJsonLd', './profileSeo', './seoApply']) {
      expect(imps.some(p => p.replace(/\.js$/, '') === heavy)).toBe(false)
    }
    expect(seo).toMatch(/import\('\.\/seoApply\.js'\)/)
  })
  it('seoApply.js applySeo və applySelfSeo ixrac edir (Seo.jsx-in çağırdığı imza)', () => {
    const src = read('src/seo/seoApply.js')
    expect(src).toMatch(/export function applySeo\(page, lang, param, detail, bootNotFound = false\)/)
    expect(src).toMatch(/export function applySelfSeo\(page, lang, s\)/)
    // prerender.mjs ilə eyni: sayt sxemi yalnız ana səhifədə
    expect(src).toMatch(/const SITE_JSONLD_PAGES = \['home'\]/)
    expect(read('scripts/prerender.mjs')).toMatch(/const SITE_JSONLD_PAGES = \['home'\]/)
  })
})

describe('qabıq — ilk ekrana lazım olmayan hissələr ayrıca chunk-dır', () => {
  const app = read('src/App.jsx')
  const header = read('src/components/Header.jsx')
  it('App.jsx Footer, InstallBanner, AutoSyncToast, FloatingDock, SideNav-ı statik import etmir', () => {
    const imps = staticImports(app)
    for (const c of ['Footer', 'InstallBanner', 'AutoSyncToast', 'FloatingDock', 'SideNav']) {
      expect(imps).not.toContain(`./components/${c}`)
    }
    expect(app).toMatch(/import\('\.\/components\/Footer'\)/)
    expect(app).toMatch(/import\('\.\/components\/FloatingDock'\)/)
    expect(app).toMatch(/import\('\.\/components\/InstallBanner'\)/)
    expect(app).toMatch(/import\('\.\/components\/AutoSyncToast'\)/)
    expect(imps).toContain('./components/LazySideNav')
  })
  it('PWA hadisəsi və əlçatanlıq CSS-i əsas paketdə qalır', () => {
    const imps = staticImports(app)
    expect(imps).toContain('./utils/installPrompt')
    expect(imps).toContain('./styles/AccessibilityWidget.css')
    expect(read('src/components/InstallBanner.jsx')).not.toMatch(/addEventListener\('beforeinstallprompt'/)
  })
  it('əlçatanlıq tərcihləri açılışda (dok gözlənilmədən) həm tətbiq olunur, həm yaddaşa yazılır', () => {
    // Sinxronlanan açar: yazı autoSync-in ilk dövründən sonra olsa, iki cihazın birləşməsi pozulurdu
    const main = read('src/main.jsx')
    const render = main.indexOf('function render()')
    const save = main.indexOf('saveA11yPrefs(a11y)')
    expect(save).toBeGreaterThan(-1)
    expect(save).toBeLessThan(render)
    expect(main.indexOf('applyA11yPrefs(a11y)')).toBeLessThan(save)
  })
  it('Header.jsx çəkmə menyunu tənbəl SideNav ilə göstərir', () => {
    expect(staticImports(header)).toContain('./LazySideNav')
    expect(staticImports(header)).not.toContain('./SideNav')
  })
  it('prerender: lazyPage(…) nümunəsi App.jsx-də qalır (HomePage preload-u)', () => {
    expect(app).toMatch(/const HomePage = lazyPage\(\(\) => import\('\.\/pages\/HomePage'\)\)/)
  })
})

describe('installPrompt — hadisə modul səviyyəsində tutulur', () => {
  it('beforeinstallprompt: preventDefault, saxlanır, qm-installable göndərilir; appinstalled — unudulur', async () => {
    const listeners = {}
    const dispatched = []
    const store = {}
    vi.stubGlobal('window', {
      addEventListener: (t, fn) => { listeners[t] = fn },
      dispatchEvent: (e) => dispatched.push(e.type),
    })
    vi.stubGlobal('localStorage', { setItem: (k, v) => { store[k] = v }, getItem: (k) => store[k] ?? null })
    vi.resetModules()
    const m = await import('../../src/utils/installPrompt.js')
    expect(m.getSavedPrompt()).toBe(null)
    const ev = { prevented: false, preventDefault() { this.prevented = true } }
    listeners.beforeinstallprompt(ev)
    expect(ev.prevented).toBe(true)
    expect(m.getSavedPrompt()).toBe(ev)
    expect(dispatched).toContain(m.INSTALLABLE_EVENT)
    listeners.appinstalled()
    expect(m.getSavedPrompt()).toBe(null)
    expect(m.isInstalled()).toBe(true)
    vi.unstubAllGlobals()
  })
})

describe('CSS kaskadı — tənbəl SideNav.css', () => {
  const sn = read('src/styles/SideNav.css')
  it('toxunma ekranı üstələmələri və sistem şrifti qaydası faylın sonundadır (eyni çəkili qaydalardan sonra)', () => {
    const touch = sn.lastIndexOf('@media (hover: none), (pointer: coarse) {')
    expect(touch).toBeGreaterThan(sn.lastIndexOf('.qm-sn-backdrop {', touch - 1))
    expect(sn.slice(touch)).toMatch(/backdrop-filter: none/)
    const sys = sn.lastIndexOf('.qm-sn-morelangs__select, .qm-sn-morelangs__select option {')
    expect(sys).toBeGreaterThan(sn.indexOf('font: inherit'))
    expect(sn.slice(sys)).toMatch(/font-family: system-ui/)
    expect(read('src/styles/perf-touch.css')).not.toMatch(/\.qm-sn-backdrop\s*\{/)
  })
})

describe('/hadith — məlumat kritik yolu tutmur', () => {
  it('prerender hədis modulunu yalnız AŞAĞI prioritetlə preload edir; HadithPage hero-nu məlumatsız çəkir', () => {
    const pre = read('scripts/prerender.mjs')
    expect(pre).toMatch(/const hk = `virtual:hadiths\/\$\{lang\}\.js`/)
    expect(pre).toContain('<link rel="modulepreload" fetchpriority="low" crossorigin href="/${manifest[hk].file}" />')
    expect(pre).not.toMatch(/<link rel="modulepreload" crossorigin href="\/\$\{manifest\[hk\]\.file\}"/)
    const page = read('src/pages/HadithPage.jsx')
    expect(page).toMatch(/function HadithHero\(\{ lang \}\)/)
    expect(page).toMatch(/<Suspense fallback=\{<HadithBodyWait \/>\}>/)
    const hero = page.slice(page.indexOf('function HadithHero('), page.indexOf('function HadithBodyWait('))
    expect(hero).not.toMatch(/useHadithData|staticList|hadithData/)
  })
})
