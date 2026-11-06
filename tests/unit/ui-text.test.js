// Əlavə dillərin interfeys lüğəti (src/utils/uiText.js, src/i18n/<dil>.json)
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { pickUi, txt, setUiDict, uiDictLang } from '../../src/utils/uiText.js'
import { EXTRA_LANGS, EXTRA_CODES, UI_LANGS, hasPageInLang, langsFor, pathFor, LANGS } from '../../src/seo/routes.js'
import { titleFor, descFor } from '../../src/seo/meta.js'

const ROOT = path.resolve(__dirname, '../..')
const I18N = path.join(ROOT, 'src', 'i18n')
const L = { az: { a: 'Bağla', n: { b: 'Növbəti' } }, en: { a: 'Close', n: { b: 'Next' }, list: ['Close', 'Other'], f: (x) => `${x}` }, ru: { a: 'Закрыть' } }

afterEach(() => setUiDict(null))

describe('pickUi', () => {
  it('lüğətsiz: köhnə "X[lang] || X.az" davranışı', () => {
    expect(pickUi(L, 'ru').a).toBe('Закрыть')
    expect(pickUi(L, 'tr')).toBe(L.az)
    expect(pickUi(L, 'tr', 'en')).toBe(L.en)
    expect(pickUi(L, 'en')).toBe(L.en)
    expect(pickUi(null, 'en')).toBe(null)
  })

  it('lüğətlə: ingiliscə yazılar tərcümə olunur, olmayan qalır, obyekt sabitdir', () => {
    setUiDict('id', { Close: 'Tutup', Next: 'Berikutnya' })
    expect(uiDictLang()).toBe('id')
    const r = pickUi(L, 'en')
    expect(r.a).toBe('Tutup')
    expect(r.n.b).toBe('Berikutnya')
    expect(r.list).toEqual(['Tutup', 'Other'])
    expect(r.f('Close')).toBe('Tutup')
    expect(pickUi(L, 'en')).toBe(r) // yaddaş: eyni obyekt (useMemo asılılıqları üçün)
    // Əsas dillərə toxunulmur
    expect(pickUi(L, 'ru').a).toBe('Закрыть')
    expect(txt('Next')).toBe('Berikutnya')
    expect(txt('Unknown')).toBe('Unknown')
  })

  it('lüğət silinəndə ingiliscəyə qayıdır', () => {
    setUiDict('id', { Close: 'Tutup' })
    setUiDict(null)
    expect(pickUi(L, 'en').a).toBe('Close')
    expect(uiDictLang()).toBe(null)
  })
})

describe('ui dilləri', () => {
  it('ui: true dilinin lüğət faylı var', () => {
    for (const c of UI_LANGS) expect(fs.existsSync(path.join(I18N, `${c}.json`)), c).toBe(true)
  })

  it('ui dilində bütün səhifələr, digər əlavə dildə yalnız Quran', () => {
    for (const c of EXTRA_CODES) {
      expect(hasPageInLang('prayer', c)).toBe(UI_LANGS.includes(c))
      expect(hasPageInLang('quran', c)).toBe(true)
      expect(pathFor('prayer', c)).toBe(UI_LANGS.includes(c) ? `/${c}/prayer` : '/en/prayer')
    }
    expect(langsFor('prayer')).toEqual([...LANGS, ...UI_LANGS])
  })

  it('ui dilində səhifə başlığı lüğətdən gəlir', () => {
    for (const c of UI_LANGS) {
      const d = JSON.parse(fs.readFileSync(path.join(I18N, `${c}.json`), 'utf8'))
      setUiDict(c, d)
      expect(titleFor('prayer', c)).not.toBe(titleFor('prayer', 'en'))
      expect(descFor('prayer', c).length).toBeGreaterThan(40)
    }
  })
})

describe('lüğət faylları', () => {
  const files = fs.readdirSync(I18N).filter(f => /^[a-z]{2}\.json$/.test(f))
  const tokens = (s) => (String(s).match(/\{[\w.]+\}|\*\*|\[[^\]]*\]\([^)]*\)|<\/?\w+[^>]*>/g) || [])
    .map(x => (x.startsWith('[') ? x.replace(/^\[[^\]]*\]/, '[]') : x)).sort()

  it('fayl adı əlavə dildir, JSON düzgündür, dəyərlər boş deyil', () => {
    for (const f of files) {
      const lang = f.slice(0, 2)
      expect(EXTRA_LANGS[lang], f).toBeTruthy()
      const d = JSON.parse(fs.readFileSync(path.join(I18N, f), 'utf8'))
      for (const [k, v] of Object.entries(d)) {
        expect(typeof v, `${f}: ${k}`).toBe('string')
        expect(v.trim().length, `${f}: ${k}`).toBeGreaterThan(0)
      }
    }
  })

  it('yer tutucular və işarələmə ({n}, **, link, HTML, ﷺ) tərcümədə saxlanılıb', () => {
    for (const f of files) {
      const d = JSON.parse(fs.readFileSync(path.join(I18N, f), 'utf8'))
      for (const [k, v] of Object.entries(d)) {
        expect(tokens(v), `${f}: ${k}`).toEqual(tokens(k))
        // ﷺ silinməməlidir ("(PBUH)" → ﷺ əlavəsi isə düzgündür)
        if (k.includes('ﷺ')) expect(v, `${f}: ${k}`).toContain('ﷺ')
      }
    }
  })
})
