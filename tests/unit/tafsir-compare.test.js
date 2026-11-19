// Təfsirlərin müqayisəsi: kataloq (süni intellekt tərcüməsi yoxdur), seçim (localStorage),
// ayə naviqasiyası, mənbə/nəşr, saxta cavablarla sözbəsöz mətn və keş
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  COMPARE_TAFSIRS, COMPARE_MAX, DEFAULT_COMPARE, isComparable, cleanCompareIds, readCompareChoice,
  saveCompareChoice, toggleCompareId, ayahCount, neighbourAyah, surahLabel, compareSource, defaultCompare,
} from '../../src/utils/tafsirCompare.js'
import { fetchTafsir, clearTafsirCache, getTafsir } from '../../src/utils/tafsir.js'

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

beforeEach(() => {
  globalThis.sessionStorage = memStorage()
  globalThis.localStorage = memStorage()
  clearTafsirCache()
})

describe('kataloq', () => {
  it('saytın süni intellekt tərcüməsi (local) müqayisədə yoxdur, API təfsirləri var', () => {
    expect(COMPARE_TAFSIRS.some(t => t.local)).toBe(false)
    expect(isComparable(1016)).toBe(false)
    expect(COMPARE_TAFSIRS.map(t => t.id).sort((a, b) => a - b)).toEqual([14, 15, 16, 91, 94, 169, 170])
  })
  it('hər dil üçün susmaya görə 3 etibarlı, fərqli təfsir', () => {
    for (const [lang, ids] of Object.entries(DEFAULT_COMPARE)) {
      expect(ids, lang).toHaveLength(COMPARE_MAX)
      expect(new Set(ids).size, lang).toBe(3)
      expect(ids.every(isComparable), lang).toBe(true)
    }
    expect(defaultCompare('xx')).toEqual(DEFAULT_COMPARE.en)
    // nüsxə qaytarır — dəyişmək defolt massivi pozmur
    defaultCompare('az').push(1)
    expect(DEFAULT_COMPARE.az).toHaveLength(3)
  })
})

describe('seçim', () => {
  it('cleanCompareIds: səhv/təkrar id atılır, ən çox 3', () => {
    expect(cleanCompareIds([14, '91', 14, 1016, 999, 16, 169])).toEqual([14, 91, 16])
    expect(cleanCompareIds([1016])).toBeNull()
    expect(cleanCompareIds('14')).toBeNull()
    expect(cleanCompareIds(null)).toBeNull()
  })
  it('localStorage: dil üzrə saxlanır; pozuq yazı → susmaya görə', () => {
    expect(readCompareChoice('ru')).toEqual(DEFAULT_COMPARE.ru)
    saveCompareChoice('ru', [170, 15])
    saveCompareChoice('en', [169])
    expect(readCompareChoice('ru')).toEqual([170, 15])
    expect(readCompareChoice('en')).toEqual([169])
    expect(JSON.parse(localStorage.getItem('quran_tafsir_compare'))).toEqual({ ru: [170, 15], en: [169] })
    saveCompareChoice('ru', [])           // boş seçim yazılmır
    expect(readCompareChoice('ru')).toEqual([170, 15])
    localStorage.setItem('quran_tafsir_compare', '{pozuq')
    expect(readCompareChoice('ru')).toEqual(DEFAULT_COMPARE.ru)
  })
  it('localStorage bağlıdır — xəta atmır', () => {
    globalThis.localStorage = { getItem() { throw new Error('x') }, setItem() { throw new Error('x') } }
    expect(readCompareChoice('az')).toEqual(DEFAULT_COMPARE.az)
    expect(() => saveCompareChoice('az', [14])).not.toThrow()
  })
  it('toggleCompareId: əlavə (≤3), çıxar (sonuncu qalır), səhv id dəyişmir', () => {
    const one = [14]
    expect(toggleCompareId(one, 14)).toBe(one)
    expect(toggleCompareId(one, 91)).toEqual([14, 91])
    const three = [14, 91, 16]
    expect(toggleCompareId(three, 169)).toBe(three)
    expect(toggleCompareId(three, 91)).toEqual([14, 16])
    expect(toggleCompareId(three, 1016)).toBe(three)
  })
})

describe('ayə naviqasiyası', () => {
  it('surə daxilində və sərhəddə', () => {
    expect(ayahCount(2)).toBe(286)
    expect(ayahCount(115)).toBe(0)
    expect(neighbourAyah(2, 5, 1)).toEqual({ s: 2, a: 6 })
    expect(neighbourAyah(2, 5, -1)).toEqual({ s: 2, a: 4 })
    expect(neighbourAyah(1, 7, 1)).toEqual({ s: 2, a: 1 })
    expect(neighbourAyah(2, 1, -1)).toEqual({ s: 1, a: 7 })
    expect(neighbourAyah('3', '1', -1)).toEqual({ s: 2, a: 286 })
  })
  it('Quranın əvvəli/sonu və səhv ayə → null', () => {
    expect(neighbourAyah(1, 1, -1)).toBeNull()
    expect(neighbourAyah(114, 6, 1)).toBeNull()
    expect(neighbourAyah(1, 8, 1)).toBeNull()
    expect(neighbourAyah(0, 1, 1)).toBeNull()
  })
  it('surə adı: ar — ərəbcə, qalanları — latın', () => {
    expect(surahLabel(1, 'ar')).toBe('الفاتحة')
    expect(surahLabel(1, 'az')).toBe('Al-Fatihah')
    expect(surahLabel(200, 'en')).toBe('')
  })
})

describe('mənbə və mətn', () => {
  it('compareSource: quran.com linki və nəşr id-si', () => {
    expect(compareSource(91, 2, 255)).toEqual({
      url: 'https://quran.com/2:255/tafsirs/ar-tafseer-al-saddi',
      edition: 'Quran.com API v4 · #91 · ar-tafseer-al-saddi',
    })
    expect(compareSource(999, 1, 1)).toBeNull()
  })
  it('3 təfsir paralel: hər biri öz endpoint-indən, mətn sözbəsöz (yalnız sanitizer)', async () => {
    const TEXT = {
      14: '<p>قال ابن كثير: <span class="arabic">ٱلْحَمْدُ لِلَّهِ</span></p>',
      91: '<p>قال السعدي <script>alert(1)</script>نص</p>',
      169: '<h2>Praise</h2><p onclick="x()">All praise and thanks are Allah’s.</p>',
    }
    const f = vi.fn(async (url) => {
      const id = Number(/tafsirs\/(\d+)\//.exec(url)[1])
      return { ok: true, status: 200, json: async () => ({ tafsir: { resource_id: id, verses: { '1:2': { id: 2 } }, text: TEXT[id] } }) }
    })
    const ids = [14, 91, 169]
    const res = await Promise.all(ids.map(id => fetchTafsir(id, 1, 2, { fetchImpl: f })))
    expect(f.mock.calls.map(c => c[0])).toEqual(ids.map(id => `https://api.quran.com/api/v4/tafsirs/${id}/by_ayah/1:2`))
    expect(res[0].html).toBe('<p>قال ابن كثير: <span class="tfc-arabic">ٱلْحَمْدُ لِلَّهِ</span></p>')
    expect(res[1].html).toBe('<p>قال السعدي نص</p>')
    expect(res[2].html).toBe('<h3>Praise</h3><p>All praise and thanks are Allah’s.</p>')
    expect(getTafsir(169).lang).toBe('en')
    // Təkrar açılış (və ya əvvəlki ayəyə qayıdış) — şəbəkəyə getmir
    await Promise.all(ids.map(id => fetchTafsir(id, 1, 2, { fetchImpl: f })))
    expect(f).toHaveBeenCalledTimes(3)
  })
  it('bir təfsir xəta versə digərləri gəlir (sütunlar bir-birindən asılı deyil)', async () => {
    const f = vi.fn(async (url) => (url.includes('/91/')
      ? { ok: false, status: 500, json: async () => ({}) }
      : { ok: true, status: 200, json: async () => ({ tafsir: { verses: {}, text: '<p>ok</p>' } }) }))
    const res = await Promise.allSettled([14, 91, 16].map(id => fetchTafsir(id, 2, 3, { fetchImpl: f })))
    expect(res.map(r => r.status)).toEqual(['fulfilled', 'rejected', 'fulfilled'])
    expect(res[1].reason.kind).toBe('network')
    expect(res[0].value.verses).toEqual(['2:3'])
  })
})
