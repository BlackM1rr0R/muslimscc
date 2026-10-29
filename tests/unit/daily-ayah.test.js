// Server: "Günün ayəsi" push planlayıcısının saf köməkçiləri (server/daily-ayah.js)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const d = require('../../server/daily-ayah.js')
const { nowIn } = require('../../server/prayer-utils.js')
const { QUOTES } = await import('../../src/data/quotes.js')
const { SURAH_AZ } = await import('../../src/data/surahNamesAz.js')

afterEach(() => vi.useRealTimers())

describe('ayə siyahısı', () => {
  it('quotes.js-dəki Quran istinadları ilə eynidir (təkrarsız, eyni sıra)', () => {
    const fromData = [...new Set(QUOTES
      .filter(q => q.cat === 'quran' && typeof q.source === 'string')
      .map(q => q.source.replace(/^Quran\s+/, '')))]
    expect(d.AYAH_REFS).toEqual(fromData)
  })
  it('ayə sayları cəmi 6236, 114 surə', () => {
    expect(d.AYAH_COUNTS).toHaveLength(114)
    expect(d.AYAH_COUNTS.reduce((a, b) => a + b, 0)).toBe(6236)
  })
  it('hər istinad mövcud ayəyə işarə edir', () => {
    for (const ref of d.AYAH_REFS) {
      const p = d.parseRef(ref)
      expect(p, ref).not.toBeNull()
      expect(p.to).toBeLessThanOrEqual(d.AYAH_COUNTS[p.s - 1])
    }
  })
  it('yararsız istinadlar rədd olunur', () => {
    for (const bad of ['', '0:1', '115:1', '1:8', '2:0', '2:5-3', 'x', '2:287']) expect(d.parseRef(bad), bad).toBeNull()
    expect(d.parseRef('103:1-2')).toEqual({ s: 103, a: 1, to: 2 })
  })
  it('az surə adları surahNamesAz.js ilə eynidir', () => {
    for (const ref of d.AYAH_REFS) {
      const { s } = d.parseRef(ref)
      expect(d.SURAH_NAMES_AZ[s], `surə ${s}`).toBe(SURAH_AZ[s].name)
    }
  })
})

describe('ayahForDate', () => {
  it('deterministikdir və saat qurşağından asılı deyil', () => {
    expect(d.ayahForDate('2026-10-30')).toEqual(d.ayahForDate('2026-10-30'))
    expect(d.dayNumber('1970-01-01')).toBe(0)
    expect(d.dayNumber('2026-10-30') - d.dayNumber('2026-10-29')).toBe(1)
  })
  it('siyahı uzunluğu qədər ardıcıl gündə hər ayə düz bir dəfə düşür', () => {
    const n = d.AYAH_REFS.length
    const start = d.dayNumber('2026-01-01')
    const seen = new Map()
    for (let i = 0; i < n; i++) {
      const t = new Date((start + i) * 86400000).toISOString().slice(0, 10)
      const p = d.ayahForDate(t)
      expect(d.AYAH_REFS).toContain(p.ref)
      expect(p.s).toBeGreaterThanOrEqual(1)
      seen.set(p.ref, (seen.get(p.ref) || 0) + 1)
    }
    expect(seen.size).toBe(n)
    expect([...seen.values()].every(c => c === 1)).toBe(true)
    // Dövr təkrarlanır
    const t0 = new Date(start * 86400000).toISOString().slice(0, 10)
    const tn = new Date((start + n) * 86400000).toISOString().slice(0, 10)
    expect(d.ayahForDate(tn)).toEqual(d.ayahForDate(t0))
  })
  it('1970-dən əvvəlki və uzaq tarixlərdə də diapazondadır', () => {
    for (const t of ['1960-05-05', '2100-12-31', '2028-02-29']) {
      expect(d.AYAH_REFS).toContain(d.ayahForDate(t).ref)
    }
  })
  it('istənilən siyahı uzunluğunda işləyir (addım qarşılıqlı sadə deyilsə 1)', () => {
    const refs = Array.from({ length: 37 }, (_, i) => `2:${i + 1}`)
    const got = new Set(Array.from({ length: 37 }, (_, i) =>
      d.ayahForDate(new Date(i * 86400000).toISOString().slice(0, 10), refs).ref))
    expect(got.size).toBe(37)
  })
})

describe('normDaily', () => {
  it('yalnız ayah:true olanda abunədir; saat yoxlanır', () => {
    expect(d.normDaily(undefined)).toBeNull()
    expect(d.normDaily({ ayah: false, hour: 8 })).toBeNull()
    expect(d.normDaily({ ayah: 'true', hour: 8 })).toBeNull()
    expect(d.normDaily({ ayah: true, hour: 20 })).toEqual({ hour: 20 })
    expect(d.normDaily({ ayah: true, hour: '7' })).toEqual({ hour: 7 })
    expect(d.normDaily({ ayah: true, hour: 25 })).toEqual({ hour: d.DEFAULT_HOUR })
    expect(d.normDaily({ ayah: true })).toEqual({ hour: d.DEFAULT_HOUR })
  })
})

describe('isDueNow + saat qurşaqları', () => {
  it('yalnız seçilmiş saatın 00 dəqiqəsində', () => {
    expect(d.isDueNow('08:00', 8)).toBe(true)
    expect(d.isDueNow('08:01', 8)).toBe(false)
    expect(d.isDueNow('07:59', 8)).toBe(false)
    expect(d.isDueNow('20:00', 20)).toBe(true)
    expect(d.isDueNow('20:00', 8)).toBe(false)
    expect(d.isDueNow('00:00', 0)).toBe(true)
    expect(d.isDueNow('', 8)).toBe(false)
  })
  it('eyni UTC anında hər şəhər öz yerli saatına görə yoxlanır', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-30T04:00:10Z'))   // Bakı 08:00, İstanbul 07:00, London 04:00
    expect(d.isDueNow(nowIn('Asia/Baku').hhmm, 8)).toBe(true)
    expect(d.isDueNow(nowIn('Europe/Istanbul').hhmm, 7)).toBe(true)
    expect(d.isDueNow(nowIn('Europe/Istanbul').hhmm, 8)).toBe(false)
    expect(d.isDueNow(nowIn('Europe/London').hhmm, 8)).toBe(false)
    // Yarım saatlıq qurşaqlar: Kabul (UTC+4:30) 00:00, Dehli (UTC+5:30) 01:00, Bakı 23:30
    vi.setSystemTime(new Date('2026-10-30T19:30:00Z'))
    expect(d.isDueNow(nowIn('Asia/Kabul').hhmm, 0)).toBe(true)
    expect(d.isDueNow(nowIn('Asia/Kolkata').hhmm, 1)).toBe(true)
    expect(d.isDueNow(nowIn('Asia/Baku').hhmm, 23)).toBe(false)
  })
  it('yerli tarix gecə yarısından sonra dəyişir — ayə də', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-30T21:30:00Z'))   // Bakı 31-i 01:30, London 30-u 21:30
    const baku = nowIn('Asia/Baku').dateKey, london = nowIn('Europe/London').dateKey
    expect(baku).toBe('2026-10-31')
    expect(london).toBe('2026-10-30')
    expect(d.ayahForDate(baku).ref).not.toBe(d.ayahForDate(london).ref)
  })
})

describe('truncateWords', () => {
  const long = 'Allah — there is no deity save Him, the Ever-Living, the Self-Subsistent Fount of All Being. Neither slumber overtakes Him, nor sleep. His is all that is in the heavens and all that is on earth.'
  it('qısa mətn olduğu kimi (boşluqlar səliqəyə salınır)', () => {
    expect(d.truncateWords('  Dində   məcburiyyət yoxdur ')).toBe('Dində məcburiyyət yoxdur')
  })
  it('limiti keçmir və söz ortasında kəsmir', () => {
    const out = d.truncateWords(long, 150)
    expect(out.length).toBeLessThanOrEqual(150)
    expect(out.endsWith('…')).toBe(true)
    const words = long.split(/\s+/)
    const kept = out.slice(0, -1).split(' ')
    // Hər saxlanan söz (sondakı durğu işarəsi atılmaqla) orijinalda tam sözdür
    kept.forEach((w, i) => expect(words[i].startsWith(w) && (w === words[i] || /^[,.;:!?—–-]+$/.test(words[i].slice(w.length)))).toBe(true))
  })
  it('müxtəlif limitlərdə də söz sərhədində', () => {
    for (let max = 20; max <= 160; max += 7) {
      const out = d.truncateWords(long, max)
      expect(out.length).toBeLessThanOrEqual(max)
      const body = out.replace(/…$/, '')
      const next = long.replace(/\s+/g, ' ')[body.length]
      // Kəsimdən sonrakı simvol boşluq və ya durğu işarəsidir (söz yarımçıq qalmayıb)
      expect([' ', ',', '.', ';', ':', '—', undefined]).toContain(next)
    }
  })
  it('boşluqsuz uzun mətn məcburi kəsilir', () => {
    const out = d.truncateWords('x'.repeat(400), 150)
    expect(out.length).toBe(150)
  })
})

describe('başlıq və keçid', () => {
  const pick = { s: 2, a: 255, to: 255, ref: '2:255' }
  const names = { en: 'Al-Baqara', ar: 'سُورَةُ البَقَرَةِ' }
  it('5 dilin başlıq formatı', () => {
    expect(d.ayahTitle('az', pick, names)).toBe('📖 Günün ayəsi — Bəqərə 2:255')
    expect(d.ayahTitle('en', pick, names)).toBe('📖 Verse of the day — Al-Baqara 2:255')
    expect(d.ayahTitle('ru', pick, names)).toBe('📖 Аят дня — Коран 2:255')
    expect(d.ayahTitle('tr', pick, names)).toBe("📖 Günün ayeti — Kur'an 2:255")
    expect(d.ayahTitle('ar', pick, names)).toBe('📖 آية اليوم — سُورَةُ البَقَرَةِ 2:255')
  })
  it('API adı yoxdursa "Quran", aralıq düzgün yazılır, naməlum dil → az', () => {
    expect(d.ayahTitle('en', pick, {})).toBe('📖 Verse of the day — Quran 2:255')
    expect(d.ayahTitle('az', { s: 103, a: 1, to: 2 }, {})).toBe('📖 Günün ayəsi — Əsr 103:1-2')
    expect(d.ayahTitle('xx', pick, {})).toBe('📖 Günün ayəsi — Bəqərə 2:255')
  })
  it('keçid dil prefiksi ilə', () => {
    expect(d.ayahLink('az', pick)).toBe('/quran?s=2&a=255')
    expect(d.ayahLink('en', pick)).toBe('/en/quran?s=2&a=255')
    expect(d.ayahLink('ar', { s: 103, a: 1, to: 2 })).toBe('/ar/quran?s=103&a=1')
  })
})

describe('alquran.cloud cavabı', () => {
  const item = (id, text, s = 112, a = 1) => ({
    text, numberInSurah: a, edition: { identifier: id },
    surah: { number: s, name: 'سُورَةُ الإِخۡلَاصِ', englishName: 'Al-Ikhlaas' },
  })
  const ok = {
    code: 200,
    data: [
      item('quran-uthmani', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ'),
      item('az.mammadaliyev', 'De: O Allah birdir'),
      item('en.asad', 'SAY: "He is the One God:'),
      item('ru.kuliev', 'Скажи: «Он - Аллах Единый,'),
      item('tr.diyanet', 'De ki: O Allah bir tektir.'),
    ],
  }
  it('bütün dillər + 1-ci ayədə təkrarlanan Bəsmələ göstərilmir', () => {
    const r = d.parseAyahResponse(ok, 112, 1)
    expect(r.texts.ar).toBe('قُلْ هُوَ ٱللَّهُ أَحَدٌ')
    expect(r.texts.en).toBe('SAY: "He is the One God:')
    expect(r.names).toEqual({ en: 'Al-Ikhlaas', ar: 'سُورَةُ الإِخۡلَاصِ' })
  })
  it('natamam və ya başqa ayəyə aid cavab → null (uydurma yox)', () => {
    expect(d.parseAyahResponse(null, 112, 1)).toBeNull()
    expect(d.parseAyahResponse({ code: 404, data: 'x' }, 112, 1)).toBeNull()
    expect(d.parseAyahResponse({ ...ok, data: ok.data.slice(1) }, 112, 1)).toBeNull()
    expect(d.parseAyahResponse(ok, 112, 2)).toBeNull()
    expect(d.parseAyahResponse({ ...ok, data: ok.data.map(x => ({ ...x, text: '' })) }, 112, 1)).toBeNull()
  })
  it('Fatihə 1:1-də Bəsmələ ayənin özüdür — silinmir', () => {
    const fat = { code: 200, data: ok.data.map(x => ({ ...x, surah: { ...x.surah, number: 1 } })) }
    expect(d.parseAyahResponse(fat, 1, 1).texts.ar.startsWith('بِسْمِ')).toBe(true)
  })
  it('aralıq birləşdirilir; bir hissə yoxdursa null', () => {
    const p = { texts: { ar: 'a', az: 'b', en: 'c', ru: 'd', tr: 'e' }, names: { en: 'X' } }
    expect(d.mergeAyahParts([p, p]).texts.az).toBe('b b')
    expect(d.mergeAyahParts([p, null])).toBeNull()
    expect(d.mergeAyahParts([])).toBeNull()
  })
  it('sorğu ünvanı 5 nəşri birlikdə istəyir', () => {
    expect(d.ayahApiUrl(2, 255)).toBe('https://api.alquran.cloud/v1/ayah/2:255/editions/quran-uthmani,az.mammadaliyev,en.asad,ru.kuliev,tr.diyanet')
  })
})
