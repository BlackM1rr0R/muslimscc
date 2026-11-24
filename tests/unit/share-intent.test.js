// PWA paylaşma hədəfi (/share) — ünvanın oxunması, təsnifat, dua gündəliyinə yazma, manifest və SW
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  readShareParams, classifyShare, safeHttpUrl, findUrl, arabicQuery, barcodeOf, duaTextFromShare,
  halalQuery, appendDuaJournal, DUA_JOURNAL_KEY, LIMITS,
} from '../../src/utils/shareIntent.js'
import { PAGES, NOINDEX_KEYS, pathFor } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

describe('readShareParams', () => {
  it('sahələri oxuyur, kəsir; yalnız http(s) URL', () => {
    const p = readShareParams(`?title=${encodeURIComponent(' Başlıq ')}&text=${'a'.repeat(5000)}&url=${encodeURIComponent('javascript:alert(1)')}`)
    expect(p.title).toBe('Başlıq')
    expect(p.text).toHaveLength(LIMITS.text)
    expect(p.url).toBe('')
    expect(readShareParams('?url=https%3A%2F%2Fexample.com%2Fx').url).toBe('https://example.com/x')
    expect(readShareParams('')).toEqual({ title: '', text: '', url: '' })
  })
  it('safeHttpUrl / findUrl', () => {
    expect(safeHttpUrl('data:text/html,hi')).toBe('')
    expect(safeHttpUrl('not a url')).toBe('')
    expect(findUrl('Baxın: https://muslims.cc/quran/2?a=255. Gözəldir')).toBe('https://muslims.cc/quran/2?a=255')
    expect(findUrl('keçid yoxdur')).toBe('')
  })
})

describe('classifyShare', () => {
  it('ərəbcə ayə → əvvəl Quranda tap, sonra məna, dua', () => {
    const c = classifyShare({ text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' })
    expect(c.arabic).toBe(true)
    expect(c.quranQuery).toBe('بسم الله الرحمن الرحيم')
    expect(c.actions).toEqual(['quran', 'meaning', 'dua'])
  })
  it('adi mətn → məna ilə axtarış birinci; Quran yoxdur', () => {
    const c = classifyShare({ text: 'Çətin gündə səbr haqqında' })
    expect(c.arabic).toBe(false)
    expect(c.actions).toEqual(['meaning', 'dua'])
  })
  it('tərkib siyahısı E-kodlarla → halal birinci', () => {
    const c = classifyShare({ text: 'Ingredients: sugar, gelatine, E471, E120, citric acid (E330)' })
    expect(c.ecodes).toEqual(['e471', 'e120', 'e330'])
    expect(c.actions[0]).toBe('halal')
    expect(halalQuery(c)).toBe(`?q=${encodeURIComponent('E471, E120, E330')}`)
  })
  it('tərkib sözü var, E-kod yoxdur → halal (sorğusuz)', () => {
    const c = classifyShare({ text: 'Tərkibi: un, şəkər, duz' })
    expect(c.ingredients).toBe(true)
    expect(c.actions[0]).toBe('halal')
    expect(halalQuery(c)).toBe('')
  })
  it('yalnız ştrixkod → halal (barcode), məna yoxdur', () => {
    const c = classifyShare({ text: ' 4600 0000 0000 0 ' })
    expect(c.barcode).toBe('4600000000000')
    expect(c.actions).toEqual(['halal', 'dua'])
    expect(halalQuery(c)).toBe('?barcode=4600000000000')
    expect(barcodeOf('12345')).toBe('')
  })
  it('yalnız keçid → yalnız dua gündəliyi; keçid mətndən çıxarılır', () => {
    const c = classifyShare({ text: 'https://example.com/article' })
    expect(c.url).toBe('https://example.com/article')
    expect(c.body).toBe('')
    expect(c.actions).toEqual(['dua'])
    expect(duaTextFromShare(c)).toBe('https://example.com/article')
  })
  it('başlıq + mətn + url birləşir, təkrar olmur', () => {
    const c = classifyShare({ title: 'Ailə üçün dua', text: 'Allahım, ailəmizi qoru', url: 'https://example.com/d' })
    expect(c.body).toBe('Ailə üçün dua\nAllahım, ailəmizi qoru')
    expect(duaTextFromShare(c)).toBe('Ailə üçün dua\nAllahım, ailəmizi qoru\nhttps://example.com/d')
  })
  it('qarışıq mətn (az ərəbcə) Quran axtarışı vermir; boş — əməl yoxdur', () => {
    expect(classifyShare({ text: 'Bu sözü bilirsən: صبر? Mənası səbrdir və çox gözəldir' }).arabic).toBe(false)
    expect(classifyShare({}).actions).toEqual([])
  })
  it('arabicQuery: hərəkə, tətvil, rəqəm və durğu silinir, ilk 6 söz', () => {
    expect(arabicQuery('قُلْ هُوَ ٱللَّهُ أَحَدٌ ﴿١﴾')).toBe('قل هو الله أحد')
    expect(arabicQuery('ا ب ت ث ج ح خ د').split(' ')).toHaveLength(6)
  })
})

describe('appendDuaJournal', () => {
  it('DuaJournalPage formatında əvvələ yazır, mövcud qeydlər qalır', () => {
    const old = { id: 'x1', text: 'köhnə', category: 'family', priority: 'high', date: '2026-11-01', answered: false, answeredDate: null }
    const s = mem({ [DUA_JOURNAL_KEY]: JSON.stringify({ duas: [old] }) })
    const id = appendDuaJournal(s, '  Yeni dua  ', { date: '2026-11-24', id: 'n1' })
    expect(id).toBe('n1')
    const data = JSON.parse(s.getItem(DUA_JOURNAL_KEY))
    expect(data.duas).toHaveLength(2)
    expect(data.duas[0]).toEqual({ id: 'n1', text: 'Yeni dua', category: 'personal', priority: 'medium', date: '2026-11-24', answered: false, answeredDate: null })
    expect(data.duas[1]).toEqual(old)
  })
  it('pozuq yaddaş, boş mətn, yazma xətası', () => {
    const s = mem({ [DUA_JOURNAL_KEY]: '{pozuq' })
    expect(appendDuaJournal(s, 'dua')).toBeTruthy()
    expect(JSON.parse(s.getItem(DUA_JOURNAL_KEY)).duas).toHaveLength(1)
    expect(appendDuaJournal(s, '   ')).toBe(null)
    expect(appendDuaJournal(null, 'x')).toBe(null)
    const broken = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded') } }
    expect(appendDuaJournal(broken, 'x')).toBe(null)
  })
  it('mətn 1000 simvola qədər kəsilir', () => {
    const s = mem()
    appendDuaJournal(s, 'd'.repeat(1500))
    expect(JSON.parse(s.getItem(DUA_JOURNAL_KEY)).duas[0].text).toHaveLength(1000)
  })
})

describe('manifest, marşrut, SW', () => {
  it('share_target GET /share (title, text, url)', () => {
    const m = JSON.parse(readFileSync(new URL('../../public/site.webmanifest', import.meta.url), 'utf8'))
    expect(m.share_target).toEqual({ action: '/share', method: 'GET', params: { title: 'title', text: 'text', url: 'url' } })
    expect(pathFor('share', 'az')).toBe(m.share_target.action)
  })
  it('/share noindex, meta 5 dildə', () => {
    expect(PAGES.some((p) => p.key === 'share')).toBe(true)
    expect(NOINDEX_KEYS.has('share')).toBe(true)
    for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(META.share[l].t).toBeTruthy()
  })
  it('SW sorğulu /share səhifəsini keşə yazmır', () => {
    const src = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8')
    const m = /const isPrivateShare = \(u\) => (\/.+\/)\.test\(u\.pathname\) && u\.search !== ''/.exec(src)
    expect(m, 'isPrivateShare tapılmadı').toBeTruthy()
    const re = new Function(`return ${m[1]}`)()
    for (const p of ['/share', '/en/share', '/ar/share/', '/fil/share']) expect(re.test(p), p).toBe(true)
    for (const p of ['/shares', '/quran', '/en/share/x']) expect(re.test(p), p).toBe(false)
    expect(src).toMatch(/if \(!priv\) putInCache\(CACHE_NAME, e\.request, res\)/)
  })
})
