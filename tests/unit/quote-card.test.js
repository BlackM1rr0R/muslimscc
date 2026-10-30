// Sitat kartı generatoru (/quotes): istinad yazılışı, URL parametrləri,
// mətnin avtomatik sığdırılması (kanvas olmadan — saxta ölçmə ilə)
import { describe, it, expect } from 'vitest'
import { refLabel, parseAyahRef, readParams, buildQuery } from '../../src/components/quote/content.js'
import { fitText, wrapLines, mostlyArabic, contentBox, unitOf, TEMPLATES, FORMATS, DEFAULT_STYLE } from '../../src/utils/quoteCard.js'
import { QUOTES } from '../../src/data/quotes.js'

// Hər simvol şrift ölçüsünün yarısı enində (təxmini, determinist)
function fakeCtx() {
  return {
    font: '16px x',
    measureText(s) { const px = Number(/([\d.]+)px/.exec(this.font)?.[1] || 16); return { width: s.length * px * 0.5 } },
  }
}

describe('refLabel', () => {
  it('Quran istinadına surə adı əlavə olunur (az/ru/tr)', () => {
    expect(refLabel('Quran 2:255', 'az')).toBe('Bəqərə 2:255')
    expect(refLabel('Quran 103:1-2', 'az')).toMatch(/ 103:1-2$/)
    expect(refLabel('Quran 2:255', 'tr')).toMatch(/2:255$/)
  })
  it('en/ar-da surə adı API-dən gəlmirsə — "Quran"', () => {
    expect(refLabel('Quran 2:255', 'en')).toBe('Quran 2:255')
    expect(refLabel('Quran 2:255', 'ar')).toBe('القرآن 2:255')
    expect(refLabel('Quran 2:255', 'en', 'Al-Baqara')).toBe('Al-Baqara 2:255')
  })
  it('hədis mənbəyi dilə çevrilir, boş mənbə boş qalır', () => {
    expect(refLabel('Buxari 1', 'en')).toBe('Bukhari 1')
    expect(refLabel('', 'az')).toBe('')
  })
  it('quotes.js-dəki bütün mənbələr boş olmayan istinad verir', () => {
    for (const q of QUOTES) for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(refLabel(q.source, l)).not.toBe('')
  })
})

describe('URL parametrləri', () => {
  it('parseAyahRef', () => {
    expect(parseAyahRef('2:255')).toEqual({ s: 2, a: 255 })
    expect(parseAyahRef('115:1')).toBeNull()
    expect(parseAyahRef('abc')).toBeNull()
  })
  it('buildQuery → readParams geri oxunur', () => {
    expect(readParams(buildQuery({ ayah: '2:255', fmt: 'story' }))).toMatchObject({ ayah: { s: 2, a: 255 }, fmt: 'story' })
    expect(readParams(buildQuery({ hadith: 12 })).hadith).toBe(12)
    const r = readParams(buildQuery({ text: 'Salam & sülh', src: 'Buxari 1', ar: 'السلام' }))
    expect(r).toMatchObject({ text: 'Salam & sülh', src: 'Buxari 1', ar: 'السلام', ayah: null, hadith: null })
  })
})

describe('mətnin yerləşdirilməsi', () => {
  it('mostlyArabic', () => {
    expect(mostlyArabic('إِنَّ مَعَ الْعُسْرِ يُسْرًا')).toBe(true)
    expect(mostlyArabic('Salam dünya')).toBe(false)
  })
  it('wrapLines sətirləri enə sığdırır', () => {
    const ctx = fakeCtx()
    ctx.font = '20px x'
    const lines = wrapLines(ctx, 'bir iki üç dörd beş altı yeddi səkkiz doqquz on', 100)
    expect(lines.length).toBeGreaterThan(1)
    for (const l of lines) expect(l.length * 10).toBeLessThanOrEqual(100 + 60)
  })
  it('uzun mətn kiçilir və sahəyə sığır, qısa mətn kiçilmir', () => {
    const ctx = fakeCtx()
    const longest = QUOTES.reduce((a, q) => ((q.text.az || '').length > (a.text.az || '').length ? q : a))
    for (const f of FORMATS) {
      const box = contentBox(TEMPLATES[0], f.w, f.h)
      const u = unitOf(f.w, f.h)
      const card = { style: DEFAULT_STYLE, ar: longest.ar, text: longest.text.az, ref: 'Bəqərə 2:255', kicker: 'Ayə', lang: 'az' }
      const res = fitText(ctx, card, box, u)
      expect(res.overflow, f.id).toBe(false)
      expect(res.total).toBeLessThanOrEqual(box.h + 1)
      const short = fitText(ctx, { ...card, ar: 'اللَّهُ الصَّمَدُ', text: 'Allah Saməddir' }, box, u)
      expect(short.f).toBeGreaterThanOrEqual(res.f)
    }
  })
})
