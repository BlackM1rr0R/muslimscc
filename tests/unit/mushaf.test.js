// Mushaf görünüşü: səhifə cədvəlləri, sətir düzümü, təcvid sanitizeri, keş/sorğu.
// Testlərdə Quran mətni yoxdur — sözlər yer tutucudur (w1, w2 …).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SURAH_TABLE, JUZ_START_PAGES, MUSHAF_PAGES } from '../../src/data/mushafIndex.js'
import {
  clampPage, isValidPage, surahStartPage, juzStartPage, juzForPage, surahsOnPage, surahInfo, hizbFromRub,
  layoutPage, isCenteredLine, sanitizeTajweed, tajweedRulesIn, wbwLang, readLastPage, saveLastPage,
  compactPage, fetchMushafPage, MushafError, pageUrl,
} from '../../src/utils/mushaf.js'

function memStorage() {
  const m = new Map()
  return {
    get length() { return m.size },
    key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: k => { m.delete(k) },
    clear: () => m.clear(),
  }
}

// Sözlər: [surə, ayə, sətir, sözlərin sayı] → API-yə bənzər sıxılmış sözlər (+ ayə sonu)
function words(spec) {
  const out = []
  for (const [s, a, line, n] of spec) {
    for (let p = 1; p <= n; p++) out.push({ key: `${s}:${a}`, s, a, p, line, type: 'word', text: `w${p}` })
    out.push({ key: `${s}:${a}`, s, a, p: n + 1, line, type: 'end', text: String(a) })
  }
  return out
}
const kinds = lines => lines.map(l => `${l.n}:${l.kind}${l.surah ? l.surah : ''}`)

describe('səhifə cədvəlləri', () => {
  it('114 surə və 30 cüz, səhifələr artan sıradadır', () => {
    expect(MUSHAF_PAGES).toBe(604)
    expect(SURAH_TABLE).toHaveLength(114)
    expect(JUZ_START_PAGES).toHaveLength(30)
    for (let i = 1; i < 114; i++) {
      expect(SURAH_TABLE[i][0]).toBeGreaterThanOrEqual(SURAH_TABLE[i - 1][0])
      expect(SURAH_TABLE[i][0]).toBeGreaterThanOrEqual(SURAH_TABLE[i - 1][1] - 0)
    }
    for (let i = 1; i < 30; i++) expect(JUZ_START_PAGES[i]).toBeGreaterThan(JUZ_START_PAGES[i - 1])
    expect(SURAH_TABLE.reduce((n, r) => n + r[2], 0)).toBe(6236)
    expect(SURAH_TABLE[113][1]).toBe(604)
  })
  it('surə → səhifə, cüz → səhifə', () => {
    expect(surahStartPage(1)).toBe(1)
    expect(surahStartPage(2)).toBe(2)
    expect(surahStartPage(18)).toBe(293)
    expect(surahStartPage(114)).toBe(604)
    expect(surahStartPage(0)).toBeNull()
    expect(juzStartPage(1)).toBe(1)
    expect(juzStartPage(2)).toBe(22)
    expect(juzStartPage(30)).toBe(582)
    expect(juzStartPage(31)).toBeNull()
  })
  it('səhifə → cüz və surələr', () => {
    expect(juzForPage(1)).toBe(1)
    expect(juzForPage(21)).toBe(1)
    expect(juzForPage(22)).toBe(2)
    expect(juzForPage(604)).toBe(30)
    expect(surahsOnPage(1)).toEqual([1])
    expect(surahsOnPage(604)).toEqual([112, 113, 114])
    expect(surahsOnPage(50)).toEqual([3])
  })
  it('clampPage / isValidPage', () => {
    expect(clampPage(0)).toBe(1)
    expect(clampPage(700)).toBe(604)
    expect(clampPage('12')).toBe(12)
    expect(clampPage('abc')).toBe(1)
    expect(isValidPage(604)).toBe(true)
    expect(isValidPage(605)).toBe(false)
    expect(isValidPage(1.5)).toBe(false)
  })
  it('surahInfo, hizbFromRub', () => {
    expect(surahInfo(1)).toMatchObject({ number: 1, start: 1, end: 1, verses: 7, basmala: false })
    expect(surahInfo(9).basmala).toBe(false)
    expect(surahInfo(2).basmala).toBe(true)
    expect(hizbFromRub(1)).toEqual({ hizb: 1, quarter: 0 })
    expect(hizbFromRub(20)).toEqual({ hizb: 5, quarter: 3 })
    expect(hizbFromRub(240)).toEqual({ hizb: 60, quarter: 3 })
    expect(hizbFromRub(null)).toBeNull()
  })
})

describe('layoutPage', () => {
  it('səhifə 1: başlıq + 7 sətir (Fatihədə bəsmələ ayədir)', () => {
    const w = words([[1, 1, 2, 4], [1, 2, 3, 4], [1, 3, 4, 2], [1, 4, 4, 3], [1, 5, 5, 4], [1, 6, 6, 3], [1, 7, 7, 5], [1, 7, 8, 4]].map(x => x))
    const lines = layoutPage(w, 1)
    expect(lines).toHaveLength(8)
    expect(lines[0]).toMatchObject({ n: 1, kind: 'header', surah: 1 })
    expect(lines.slice(1).every(l => l.kind === 'words')).toBe(true)
  })
  it('səhifə 2: başlıq + bəsmələ, sonra sözlər', () => {
    const w = words([[2, 1, 3, 1], [2, 2, 3, 6], [2, 3, 4, 7], [2, 4, 6, 8], [2, 5, 8, 5]])
    expect(kinds(layoutPage(w, 2))).toEqual(['1:header2', '2:basmala2', '3:words', '4:words', '5:blank', '6:words', '7:blank', '8:words'])
  })
  it('səhifənin ortasında yeni surə (başlıq + bəsmələ)', () => {
    const spec = [[13, 43, 1, 8], [13, 43, 2, 8]]
    for (let l = 5; l <= 15; l++) spec.push([14, l - 4, l, 8])
    const lines = layoutPage(words(spec), 255)
    expect(lines).toHaveLength(15)
    expect(lines[2]).toMatchObject({ kind: 'header', surah: 14 })
    expect(lines[3]).toMatchObject({ kind: 'basmala', surah: 14 })
    expect(lines[4].kind).toBe('words')
  })
  it('Tövbə: yalnız başlıq, bəsmələ yoxdur', () => {
    const spec = []
    for (let l = 2; l <= 15; l++) spec.push([9, l - 1, l, 9])
    const lines = layoutPage(words(spec), 187)
    expect(lines[0]).toMatchObject({ kind: 'header', surah: 9 })
    expect(lines.filter(l => l.kind === 'basmala')).toHaveLength(0)
  })
  it('son səhifə: üç surə, hər birinə başlıq + bəsmələ', () => {
    const w = words([
      [112, 1, 3, 4], [112, 2, 3, 2], [112, 3, 4, 4], [112, 4, 4, 5],
      [113, 1, 7, 4], [113, 2, 7, 3], [113, 3, 8, 5], [113, 4, 8, 4], [113, 5, 9, 4],
      [114, 1, 12, 4], [114, 2, 12, 2], [114, 3, 13, 2], [114, 4, 13, 4], [114, 5, 14, 5], [114, 6, 15, 3],
    ])
    expect(kinds(layoutPage(w, 604))).toEqual([
      '1:header112', '2:basmala112', '3:words', '4:words', '5:header113', '6:basmala113', '7:words', '8:words', '9:words',
      '10:header114', '11:basmala114', '12:words', '13:words', '14:words', '15:words',
    ])
  })
  it('səhifə surə başlığı ilə bitir — növbəti surənin başlığı sonda', () => {
    const spec = []
    for (let l = 1; l <= 13; l++) spec.push([5, 100 + l, l, 8])
    const lines = layoutPage(words(spec), 120)
    expect(lines[13]).toMatchObject({ kind: 'header', surah: 6 })
    expect(lines[14]).toMatchObject({ kind: 'basmala', surah: 6 })
  })
  it('sözlər sətirlər üzrə sırasını saxlayır, yanlış sətir atılır', () => {
    const w = words([[2, 10, 3, 3]])
    w.push({ key: '2:10', s: 2, a: 10, p: 9, line: 99, type: 'word', text: 'x' })
    const lines = layoutPage(w, 3)
    expect(lines).toHaveLength(15)
    expect(lines[2].words.map(x => x.p)).toEqual([1, 2, 3, 4])
  })
  it('isCenteredLine', () => {
    expect(isCenteredLine({ kind: 'words', words: words([[1, 1, 1, 5]]) }, 1)).toBe(true)
    expect(isCenteredLine({ kind: 'words', words: words([[2, 6, 1, 6]]) }, 3)).toBe(false)
    expect(isCenteredLine({ kind: 'words', words: words([[2, 6, 1, 2]]) }, 3)).toBe(true)
    expect(isCenteredLine({ kind: 'header' }, 3)).toBe(true)
  })
})

describe('sanitizeTajweed', () => {
  it('qayda teqləri span-a çevrilir, iç-içə qalır', () => {
    expect(sanitizeTajweed('a<rule class=ham_wasl>b</rule>c')).toBe('a<span class="tj tj-ham_wasl">b</span>c')
    expect(sanitizeTajweed('<rule class=madda_normal><rule class=custom-alef-maksora>x</rule></rule>y'))
      .toBe('<span class="tj tj-madda_normal"><span>x</span></span>y')
    expect(sanitizeTajweed('<tajweed class="qalaqah">q</tajweed>')).toBe('<span class="tj tj-qalaqah">q</span>')
  })
  it('naməlum/təhlükəli teqlər və atributlar atılır, mətn qaçırılır', () => {
    expect(sanitizeTajweed('<script>alert(1)</script>x')).toBe('alert(1)x')
    expect(sanitizeTajweed('<img src=x onerror=alert(1)>y')).toBe('y')
    expect(sanitizeTajweed('<rule class=ghunnah onclick="evil()">g</rule>')).toBe('<span class="tj tj-ghunnah">g</span>')
    // Pozuq teq (açıq qalan dırnaq) — bütövlükdə mətn kimi qaçırılır
    const odd = sanitizeTajweed('<rule class="x" onmouseover=1">z</rule>')
    expect(odd.replace(/<\/?span[^>]*>/g, '')).not.toContain('<')
    expect(odd).toContain('&lt;rule')
    expect(sanitizeTajweed('<rule class="x" onmouseover="1">z</rule>')).toBe('<span>z</span>')
    expect(sanitizeTajweed('a & b " \' c')).toBe('a &amp; b &quot; &#39; c')
    expect(sanitizeTajweed('<span class=end>١</span>')).toBe('١')
    expect(sanitizeTajweed('x<rule class=ghunnah')).toBe('x')
  })
  it('bağlanmamış teq bağlanır, artıq bağlayıcı atılır', () => {
    expect(sanitizeTajweed('<rule class=iqlab>m')).toBe('<span class="tj tj-iqlab">m</span>')
    expect(sanitizeTajweed('m</rule></rule>')).toBe('m')
  })
  it('null/undefined → boş sətir; qaydaların siyahısı', () => {
    expect(sanitizeTajweed(null)).toBe('')
    expect(tajweedRulesIn(sanitizeTajweed('<rule class=ikhafa>a</rule><rule class=iqlab>b</rule><rule class=ikhafa>c</rule>'))).toEqual(['ikhafa', 'iqlab'])
  })
})

describe('söz tərcüməsinin dili, son səhifə', () => {
  it('wbwLang: yalnız en/tr; qalanları ingiliscə', () => {
    expect(wbwLang('tr')).toBe('tr')
    expect(wbwLang('en')).toBe('en')
    expect(wbwLang('az')).toBe('en')
    expect(wbwLang('ru')).toBe('en')
    expect(wbwLang('ar')).toBe('en')
  })
  it('readLastPage / saveLastPage', () => {
    const st = memStorage()
    expect(readLastPage(st)).toBeNull()
    saveLastPage(77, st)
    expect(readLastPage(st)).toBe(77)
    saveLastPage(999, st)
    expect(readLastPage(st)).toBe(77)
    st.setItem('mushaf_last_page', 'zibil')
    expect(readLastPage(st)).toBeNull()
  })
})

describe('compactPage + fetchMushafPage', () => {
  const api = {
    verses: [{
      verse_key: '2:1', juz_number: 1, hizb_number: 1, rub_el_hizb_number: 1, sajdah_number: null,
      words: [
        { position: 1, char_type_name: 'word', text_uthmani: 'w1', text_uthmani_tajweed: '<rule class=ghunnah>w</rule>1', line_number: 3, page_number: 2, translation: { text: 't1' }, transliteration: { text: 'l1' } },
        { position: 2, char_type_name: 'end', text_uthmani: '١', line_number: 3, page_number: 2 },
        { position: 3, char_type_name: 'pause', text_uthmani: '?', line_number: 3, page_number: 2 },
      ],
    }],
  }
  it('sözləri sıxır, təcvidi təmizləyir', () => {
    const c = compactPage(api, 2)
    expect(c).toMatchObject({ page: 2, juz: 1, rub: 1, hizb: 1 })
    expect(c.words).toHaveLength(2)
    expect(c.words[0]).toMatchObject({ key: '2:1', s: 2, a: 1, p: 1, line: 3, type: 'word', tr: 't1', tl: 'l1' })
    expect(c.words[0].tj).toBe('<span class="tj tj-ghunnah">w</span>1')
    expect(c.words[1].type).toBe('end')
    expect(compactPage({ verses: [] }, 2)).toBeNull()
  })
  it('URL-də dil və lazımi sahələr var', () => {
    const u = pageUrl(5, 'tr')
    expect(u).toContain('/verses/by_page/5?')
    expect(u).toContain('language=tr')
    expect(decodeURIComponent(u)).toContain('text_uthmani_tajweed')
    expect(decodeURIComponent(u)).toContain('line_number')
  })
  beforeEach(() => { vi.stubGlobal('sessionStorage', memStorage()) })
  it('yükləyir və keşləyir; xəta növləri', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => api }))
    const a = await fetchMushafPage(2, 'xx', { fetchImpl })
    const b = await fetchMushafPage(2, 'xx', { fetchImpl })
    expect(a).toBe(b)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const bad = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    await expect(fetchMushafPage(3, 'yy', { fetchImpl: bad })).rejects.toMatchObject({ kind: 'network' })
    const empty = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ verses: [] }) }))
    await expect(fetchMushafPage(4, 'yy', { fetchImpl: empty })).rejects.toBeInstanceOf(MushafError)
  })
})
