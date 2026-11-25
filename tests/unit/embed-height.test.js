// Yerləşdirilmiş məscid ekranının avtomatik hündürlüyü (src/utils/embedHeight.js):
// iframe tərəfinin ölçməsi, mesajın forması, ana səhifənin qaydası və dinləyici skriptin ÖZÜ
// (WordPress plagininin inline skripti və /widget-dəki əl ilə kod) saxta DOM-da işlədilir.
import { describe, it, expect } from 'vitest'
import {
  contentHeight, heightMessage, clampEmbedHeight, isHeightMessage, autoHeightScript, AUTOHEIGHT_JS_BODY,
  EMBED_HEIGHT_MSG, EMBED_MIN, EMBED_MAX,
} from '../../src/utils/embedHeight.js'

describe('iframe tərəfi: məzmunun hündürlüyü və mesaj', () => {
  it('ilk blokun yuxarısından sonuncunun aşağısına + padding; yuxarı yuvarlaqlaşdırılır', () => {
    const rows = [{ top: 40, bottom: 120, height: 80 }, { top: 132, bottom: 300.2, height: 168.2 }, { top: 312, bottom: 520, height: 208 }]
    expect(contentHeight(rows, 14, 14)).toBe(Math.ceil(520 - 40 + 28))
  })
  it('sürüşmədən asılı deyil (bütün qutular eyni qədər yerini dəyişir)', () => {
    const rows = [{ top: 10, bottom: 90, height: 80 }, { top: 100, bottom: 400, height: 300 }]
    const scrolled = rows.map(r => ({ ...r, top: r.top - 150, bottom: r.bottom - 150 }))
    expect(contentHeight(scrolled, 8, 8)).toBe(contentHeight(rows, 8, 8))
  })
  it('boş və sıfır hündürlüklü qutular nəzərə alınmır; heç nə yoxdursa 0', () => {
    expect(contentHeight([], 10, 10)).toBe(0)
    expect(contentHeight([{ top: 0, bottom: 0, height: 0 }, null])).toBe(0)
    expect(contentHeight([{ top: 0, bottom: 0, height: 0 }, { top: 20, bottom: 70, height: 50 }])).toBe(50)
    expect(contentHeight([{ top: 5, bottom: 55, height: 50 }], 'x', undefined)).toBe(50)
  })
  it('mesajda yalnız növ və tam ədəd var', () => {
    expect(heightMessage(561.2)).toEqual({ type: EMBED_HEIGHT_MSG, h: 562 })
    expect(Object.keys(heightMessage(300))).toEqual(['type', 'h'])
    expect(isHeightMessage(heightMessage(300))).toBe(true)
    for (const bad of [null, 'muslimscc:height', { type: EMBED_HEIGHT_MSG, h: '300' }, { type: EMBED_HEIGHT_MSG, h: Infinity }, { type: 'x', h: 300 }]) {
      expect(isHeightMessage(bad)).toBe(false)
    }
  })
})

describe('ana səhifənin qaydası (clampEmbedHeight)', () => {
  it('200–1600 aralığı, minimumdan aşağı düşmür; etibarsız → null', () => {
    expect(clampEmbedHeight(562, 500)).toBe(562)
    expect(clampEmbedHeight(330, 500)).toBe(500)
    expect(clampEmbedHeight(50)).toBe(EMBED_MIN)
    expect(clampEmbedHeight(99999, 500)).toBe(EMBED_MAX)
    // İstifadəçi 1600-dən hündür qoyubsa — kiçilmir
    expect(clampEmbedHeight(700, 1800)).toBe(1800)
    expect(clampEmbedHeight(612.4, 'x')).toBe(612)
    expect(clampEmbedHeight('600', 500)).toBe(null)
    expect(clampEmbedHeight(NaN, 500)).toBe(null)
  })
})

// ── Dinləyici skriptin özü — saxta pəncərə və iframe-lərlə ──
function fakePage(frames) {
  const listeners = []
  const win = { addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn) } }
  const doc = { getElementsByTagName: (t) => (t === 'iframe' ? frames : []) }
  const run = (code) => new Function('window', 'document', code)(win, doc)
  const post = (data, { origin = 'https://muslims.cc', source } = {}) => listeners.forEach(fn => fn({ data, origin, source }))
  return { listeners, run, post }
}
function fakeFrame(attrs = {}) {
  const contentWindow = {}
  return { contentWindow, style: { height: attrs.style || '' }, getAttribute: (k) => (k in attrs ? String(attrs[k]) : null) }
}

describe('dinləyici skript (WordPress inline + /widget əl ilə kod)', () => {
  it('yalnız https://muslims.cc mənşəyindən və göndərən iframe üçün; hündürlük minimumdan aşağı düşmür', () => {
    const a = fakeFrame({ 'data-muslimscc-min': 500, style: '500px' })
    const b = fakeFrame({ height: 280 })
    const p = fakePage([a, b])
    p.run(autoHeightScript())
    expect(p.listeners.length).toBe(1)

    // Başqa mənşə, saxta növ, rəqəm olmayan hündürlük — heç nə dəyişmir
    p.post({ type: 'muslimscc:height', h: 700 }, { origin: 'https://evil.example', source: a.contentWindow })
    p.post({ type: 'other', h: 700 }, { source: a.contentWindow })
    p.post({ type: 'muslimscc:height', h: '700' }, { source: a.contentWindow })
    p.post({ type: 'muslimscc:height', h: Infinity }, { source: a.contentWindow })
    p.post('muslimscc:height', { source: a.contentWindow })
    // Səhifədəki naməlum pəncərə (iframe deyil) — heç nə
    p.post({ type: 'muslimscc:height', h: 700 }, { source: {} })
    expect(a.style.height).toBe('500px')
    expect(b.style.height).toBe('')

    // Düzgün mesaj — yalnız göndərən iframe böyüyür
    p.post({ type: 'muslimscc:height', h: 612.4 }, { source: a.contentWindow })
    expect(a.style.height).toBe('612px')
    expect(b.style.height).toBe('')
    // Minimumdan (data-muslimscc-min) aşağı düşmür; height atributu da minimumdur
    p.post({ type: 'muslimscc:height', h: 300 }, { source: a.contentWindow })
    expect(a.style.height).toBe('500px')
    p.post({ type: 'muslimscc:height', h: 330 }, { source: b.contentWindow })
    expect(b.style.height).toBe('330px')
    p.post({ type: 'muslimscc:height', h: 120 }, { source: b.contentWindow })
    expect(b.style.height).toBe('280px')
    // Yuxarı hədd 1600
    p.post({ type: 'muslimscc:height', h: 50000 }, { source: b.contentWindow })
    expect(b.style.height).toBe('1600px')
  })

  it('atributsuz iframe — minimum 200; iki dəfə əlavə olunsa da bir dinləyici', () => {
    const f = fakeFrame()
    const p = fakePage([f])
    p.run(autoHeightScript())
    p.run(autoHeightScript())
    expect(p.listeners.length).toBe(1)
    p.post({ type: 'muslimscc:height', h: 10 }, { source: f.contentWindow })
    expect(f.style.height).toBe('200px')
  })

  it('mənşə parametrlə dəyişir (yerli test serveri üçün); mətn PHP tək dırnaqlı sətrində dəyişmədən durur', () => {
    const f = fakeFrame()
    const p = fakePage([f])
    p.run(autoHeightScript('http://127.0.0.1:4173'))
    p.post({ type: 'muslimscc:height', h: 640 }, { origin: 'https://muslims.cc', source: f.contentWindow })
    expect(f.style.height).toBe('')
    p.post({ type: 'muslimscc:height', h: 640 }, { origin: 'http://127.0.0.1:4173', source: f.contentWindow })
    expect(f.style.height).toBe('640px')
    expect(AUTOHEIGHT_JS_BODY).not.toMatch(/['\\]/)
    expect(autoHeightScript()).not.toMatch(/<\/script/i)
    expect(autoHeightScript()).toContain('var O="https://muslims.cc";')
    // Kiçik qalır (WordPress readme: "well under 1 KB")
    expect(autoHeightScript().length).toBeLessThan(1024)
  })
})
