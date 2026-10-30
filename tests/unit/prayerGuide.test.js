// Namaz bələdçisi (src/data/prayerGuide.js): hər addımın dəlili var, 5 dildə
// sahələr doludur, 2/3/4 rükətli ardıcıllıq düzgündür, səs faylları və
// lisenziyaları yerindədir.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  ACTIONS, ZIKR, PRAYERS, WUDU, WUDU_AFTER, PG_TEXT, COLLECTIONS, BOOKS,
  buildSequence, refText, refUrl,
} from '../../src/data/prayerGuide.js'
import { AUDIO_CREDITS } from '../../src/data/prayerGuideCredits.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const TL_LANGS = ['az', 'en', 'ru', 'tr'] // ərəbcədə transliterasiya yoxdur — mətnin özü
const ROOT = path.resolve(__dirname, '../..')
const filled = v => typeof v === 'string' && v.trim().length > 0

function expectLangs(obj, label, langs = LANGS) {
  for (const l of langs) expect(filled(obj?.[l]), `${label} [${l}]`).toBe(true)
}

describe('prayerGuide — addımlar', () => {
  it('hər namaz addımının adı, izahı 5 dildədir və ən azı bir istinadı var', () => {
    for (const [id, a] of Object.entries(ACTIONS)) {
      expectLangs(a.name, `${id}.name`)
      expectLangs(a.do, `${id}.do`)
      expect(Array.isArray(a.refs) && a.refs.length > 0, `${id}.refs`).toBe(true)
      for (const r of a.refs) {
        if (r.book) expect(BOOKS[r.book], `${id}: kitab ${r.book}`).toBeTruthy()
        else {
          expect(COLLECTIONS[r.c], `${id}: toplu ${r.c}`).toBeTruthy()
          expect(r.n, `${id}: nömrə`).toMatch(/^\d+(:\d+)?$/)
        }
      }
      if (a.note) expectLangs(a.note, `${id}.note`)
      for (const z of [...a.say, ...(a.lead ? [a.lead] : [])]) expect(ZIKR[z], `${id} → zikr ${z}`).toBeTruthy()
    }
  })

  it('ixtilaf olan addımlarda "imamınızdan soruşun" qeydi var', () => {
    for (const id of ['itidal', 'sujud', 'tashahhud1']) {
      expect(ACTIONS[id].askImam, id).toBe(true)
      expectLangs(ACTIONS[id].note, `${id}.note`)
    }
  })

  it('hər zikrin ərəb mətni, transliterasiyası (4 dil) və mənası (5 dil) var', () => {
    for (const [id, z] of Object.entries(ZIKR)) {
      expect(filled(z.ar) && /[؀-ۿ]/.test(z.ar), `${id}.ar`).toBe(true)
      expectLangs(z.tl, `${id}.tl`, TL_LANGS)
      expectLangs(z.mean, `${id}.mean`)
      // az transliterasiyasında türk hərfləri, tr-də "ə" olmamalıdır
      expect(z.tl.tr, `${id}.tl.tr`).not.toMatch(/[əƏ]/)
      expect(z.mean.tr, `${id}.mean.tr`).not.toMatch(/[əƏ]/)
      expect(z.tl.en, `${id}.tl.en`).not.toMatch(/[əƏа-яё]/i)
    }
  })

  it('istinad mətni hər dildə öz əlifbasındadır, ünvan düzgün qurulur', () => {
    expect(refText({ c: 'bukhari', n: '735' }, 'az')).toBe('Buxari 735')
    expect(refText({ c: 'bukhari', n: '735' }, 'en')).toBe('Bukhari 735')
    expect(refText({ c: 'abudawud', n: '775' }, 'en')).toMatch(/^Abu Dawud 775 \(al-Albani: sahih\)$/)
    expect(refText({ c: 'ibnkhuzayma', n: '479' }, 'en')).not.toMatch(/[əƏ]/)
    expect(refUrl({ c: 'muslim', n: '772' })).toBe('https://sunnah.com/muslim:772')
    expect(refUrl({ c: 'quran', n: '16:98' })).toBe('https://quran.com/16/98')
    expect(refUrl({ book: 'albani' })).toBe('')
  })
})

describe('prayerGuide — ardıcıllıq', () => {
  it('addım sayları: 2 → 22, 3 → 29, 4 → 35', () => {
    expect(buildSequence(2)).toHaveLength(22)
    expect(buildSequence(3)).toHaveLength(29)
    expect(buildSequence(4)).toHaveLength(35)
  })

  it('4 rükətli namazın ardıcıllığı düzgündür', () => {
    const seq = buildSequence(4)
    const ids = seq.map(s => s.id)
    expect(ids.slice(0, 10)).toEqual(['niyyah', 'takbir', 'istiftah', 'fatiha', 'surah', 'ruku', 'itidal', 'sujud', 'jalsa', 'sujud2'])
    // rükət nömrələri artan və 1..4
    expect([...new Set(seq.map(s => s.rakat))]).toEqual([1, 2, 3, 4])
    for (let i = 1; i < seq.length; i++) expect(seq[i].rakat >= seq[i - 1].rakat).toBe(true)
    // hər rükətdə bir rüku və iki səcdə
    for (const r of [1, 2, 3, 4]) {
      const inR = seq.filter(s => s.rakat === r).map(s => s.id)
      expect(inR.filter(x => x === 'ruku'), `rükət ${r}`).toHaveLength(1)
      expect(inR.filter(x => x === 'sujud' || x === 'sujud2'), `rükət ${r}`).toHaveLength(2)
    }
    // birinci təşəhhüd 2-ci rükətin sonunda, üçüncü rükətə qalxmadan əvvəl
    const t1 = ids.indexOf('tashahhud1')
    expect(seq[t1].rakat).toBe(2)
    expect(ids[t1 + 1]).toBe('rise3')
    expect(ids[t1 - 1]).toBe('sujud2')
    // 3-cü və 4-cü rükətdə surə oxunmur (Buxari 776)
    expect(seq.filter(s => s.id === 'surah').map(s => s.rakat)).toEqual([1, 2])
    expect(ids).toContain('rise4')
    // son oturuş — təvərrük, sonra salavat, dua, salam sağa və sola
    expect(ids.slice(-5)).toEqual(['final34', 'salawat', 'dua', 'salamR', 'salamL'])
    expect(seq.slice(-5, -2).every(s => s.pose === 'tawarruk')).toBe(true)
  })

  it('2 rükətli namazda birinci təşəhhüd və təvərrük yoxdur; 3 rükətlidə var', () => {
    const two = buildSequence(2).map(s => s.id)
    expect(two).not.toContain('tashahhud1')
    expect(two).toContain('final2')
    expect(two).not.toContain('final34')
    const three = buildSequence(3).map(s => s.id)
    expect(three).toContain('tashahhud1')
    expect(three).toContain('rise3')
    expect(three).not.toContain('rise4')
    expect(three).toContain('final34')
  })

  it('namaz növləri: sübh 2, zöhr 4, əsr 4, axşam 3, işa 4', () => {
    expect(Object.fromEntries(PRAYERS.map(p => [p.key, p.rakats]))).toEqual({ fajr: 2, dhuhr: 4, asr: 4, maghrib: 3, isha: 4 })
    for (const p of PRAYERS) expectLangs(p.name, `${p.key}.name`)
  })
})

describe('prayerGuide — dəstəmaz, interfeys', () => {
  it('dəstəmazın hər addımı 5 dildədir və dəlili var', () => {
    expect(WUDU).toHaveLength(8)
    for (const w of WUDU) {
      expectLangs(w.name, `${w.id}.name`)
      expectLangs(w.do, `${w.id}.do`)
      expect(w.refs.length > 0, `${w.id}.refs`).toBe(true)
      for (const z of w.say) expect(ZIKR[z]).toBeTruthy()
    }
    expect(WUDU_AFTER.refs.length).toBeGreaterThan(0)
  })

  it('qunut bölməsi yoxdur (sahibin qərarı)', () => {
    expect(ZIKR.qunut).toBeUndefined()
    expect(Object.keys(PG_TEXT.az).some(k => /qunut/i.test(k))).toBe(false)
  })

  it('interfeys mətnlərinin açarları 5 dildə eynidir', () => {
    const keys = Object.keys(PG_TEXT.az).sort()
    for (const l of LANGS) expect(Object.keys(PG_TEXT[l]).sort(), l).toEqual(keys)
  })
})

describe('prayerGuide — səs', () => {
  it('fayl səsləri mövcuddur, lisenziyası qeyd olunub, OGG yoxdur (iOS)', () => {
    const files = Object.values(ZIKR).filter(z => z.audio?.file)
    expect(files.length).toBeGreaterThan(0)
    for (const z of files) {
      expect(z.audio.file).not.toMatch(/\.ogg$/i)
      expect(fs.existsSync(path.join(ROOT, 'public', z.audio.file)), z.audio.file).toBe(true)
      const c = AUDIO_CREDITS[z.audio.credit]
      expect(c, z.audio.credit).toBeTruthy()
      expect(c.file).toBe(z.audio.file)
      expect(filled(c.license) && filled(c.author) && /^https:\/\//.test(c.url)).toBe(true)
    }
  })

  it('Quran səsi Fatihə və İxlas üçün düzgün ümumi ayə nömrələri ilə qurulur', () => {
    expect(ZIKR.fatiha.quran).toMatchObject({ s: 1, first: 1 })
    expect(ZIKR.fatiha.quran.ayahs).toHaveLength(7)
    expect(ZIKR.ikhlas.quran).toMatchObject({ s: 112, first: 6222 })
    expect(ZIKR.ikhlas.quran.ayahs).toHaveLength(4)
  })
})
