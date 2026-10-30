// Ərəb kursu (src/data/arabicCourse.js + components/arabic/*): 28 hərf, 4 forma,
// ayə istinadları, 5 dildə dolu sahələr, səs faylları və atribusiya, yoxlama generatoru,
// irəliləyişin yaddaşı.
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  COURSE_LANGS, LETTERS, MAKHRAJ, HARAKAT, TAJWEED, LESSONS, QW, PRACTICE_AYAHS, PRACTICE_SURAHS,
  READING_TWO, READING_THREE, NON_JOINING, SYLLABLE_MODES, syllables, letterForms,
} from '../../src/data/arabicCourse.js'
import { ARABIC_AUDIO_FILES, ARABIC_AUDIO_SOURCES } from '../../src/data/arabicCourseCredits.js'
import { UI } from '../../src/components/arabic/strings.js'
import { buildQuiz, QUIZ_LENGTH } from '../../src/components/arabic/quizzes.js'
import {
  readProgress, writeProgress, withResult, percentDone, resumeLesson, isPassed, PROGRESS_KEY,
} from '../../src/components/arabic/progress.js'

const ROOT = path.resolve(__dirname, '../..')
const ARABIC = /^[؀-ۿݐ-ݿࢠ-ࣿ\s]+$/
const MARKS = /[ً-ٰٟۖ-ۭـ]/g
const plain = (s) => s.replace(MARKS, '').replace(/ٱ/g, 'ا')
const filled5 = (o) => COURSE_LANGS.every(l => typeof o?.[l] === 'string' && o[l].trim().length > 0)

// Sabit toxumlu təsadüfi ədəd (mulberry32) — test təkrarlanan olsun
function seeded(seed) {
  let a = seed
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

describe('hərflər', () => {
  it('28 hərf, əlifba sırası, təkrar yoxdur', () => {
    expect(LETTERS).toHaveLength(28)
    expect(LETTERS.map(l => l.ch).join('')).toBe('ابتثجحخدذرزسشصضطظعغفقكلمنهوي')
    expect(new Set(LETTERS.map(l => l.id)).size).toBe(28)
  })

  it('hər hərfin 4 forması var və hərfin özünü saxlayır', () => {
    for (const l of LETTERS) {
      const keys = Object.keys(l.forms)
      expect(keys.sort()).toEqual(['final', 'initial', 'isolated', 'medial'])
      for (const k of keys) {
        expect(l.forms[k], `${l.id}.${k}`).toBeTruthy()
        expect(l.forms[k].replace(/ـ/g, '')).toBe(l.ch)
      }
      expect(l.forms.isolated).toBe(l.ch)
      expect(l.forms.final.startsWith('ـ')).toBe(true)
    }
  })

  it('bitişməyən hərflər: ا د ذ ر ز و — sonrakına bitişmir', () => {
    expect(NON_JOINING.join(' ')).toBe('ا د ذ ر ز و')
    for (const l of LETTERS) {
      if (l.joins) {
        expect(l.forms.initial).toBe(l.ch + 'ـ')
        expect(l.forms.medial).toBe('ـ' + l.ch + 'ـ')
      } else {
        expect(l.forms.initial).toBe(l.ch)
        expect(l.forms.medial).toBe('ـ' + l.ch)
      }
    }
    expect(letterForms('ب', true).medial).toBe('ـبـ')
  })

  it('adı 5 dildə dolu, ərəbcə adı ərəb hərfləri ilə; transliterasiya var', () => {
    for (const l of LETTERS) {
      expect(filled5(l.name), l.id).toBe(true)
      expect(l.name.ar).toMatch(ARABIC)
      expect(l.tl).toMatch(/\S/)
      expect(l.snd).toMatch(/\S/)
    }
  })

  it('məxrəc mətni 5 dildə dolu', () => {
    for (const l of LETTERS) expect(filled5(MAKHRAJ[l.makhraj]), `${l.id} → ${l.makhraj}`).toBe(true)
    for (const [k, v] of Object.entries(MAKHRAJ)) expect(filled5(v), k).toBe(true)
  })

  it('nümunə söz Qurandandır (QW) və hərfi ehtiva edir', () => {
    for (const l of LETTERS) {
      const ex = QW[l.ex]
      expect(ex, `${l.id}: ${l.ex}`).toBeTruthy()
      const p = plain(ex.w)
      // əlif nümunəsi həmzəli əlifdir (أ)
      const variants = l.id === 'alif' ? ['ا', 'أ', 'إ', 'آ'] : [l.ch]
      expect(variants.some(c => p.includes(c)), `${l.id}: ${ex.w}`).toBe(true)
    }
  })
})

describe('Quran sözləri (QW) və oxu məşqi', () => {
  it('istinad formatı surə:ayə, ümumi nömrə 1…6236, söz ərəbcədir', () => {
    for (const [k, v] of Object.entries(QW)) {
      expect(v.ref, k).toMatch(/^([1-9]\d{0,2}):([1-9]\d{0,2})$/)
      const [s, a] = v.ref.split(':').map(Number)
      expect(s).toBeLessThanOrEqual(114)
      expect(a).toBeGreaterThan(0)
      expect(Number.isInteger(v.g) && v.g >= 1 && v.g <= 6236, k).toBe(true)
      expect(v.w, k).toMatch(ARABIC)
      expect(v.tl, k).toMatch(/\S/)
    }
  })

  it('məşq sözləri və hərəkə/təcvid nümunələri QW-də var', () => {
    for (const k of [...READING_TWO, ...READING_THREE]) expect(QW[k], k).toBeTruthy()
    for (const h of HARAKAT) {
      expect(QW[h.ex], h.id).toBeTruthy()
      for (const v of h.variants || []) expect(QW[v.ex], `${h.id} ${v.ex}`).toBeTruthy()
    }
    for (const g of TAJWEED) for (const r of g.rules) for (const k of r.ex) expect(QW[k], `${r.id} ${k}`).toBeTruthy()
  })

  it('surələr tam: Fatihə 7, İxlas 4, Fələq 5, Nas 6 ayə; hər sözün transliterasiyası var', () => {
    const counts = { 1: 7, 112: 4, 113: 5, 114: 6 }
    expect(PRACTICE_SURAHS.map(s => s.n)).toEqual([1, 112, 113, 114])
    for (const s of PRACTICE_SURAHS) {
      expect(filled5(s.name)).toBe(true)
      const ayahs = PRACTICE_AYAHS[s.n]
      expect(ayahs).toHaveLength(counts[s.n])
      ayahs.forEach((a, i) => {
        expect(a.ref).toBe(`${s.n}:${i + 1}`)
        expect(a.words.length).toBeGreaterThan(0)
        for (const [w, tl] of a.words) { expect(w).toMatch(ARABIC); expect(tl).toMatch(/\S/) }
      })
    }
    // Bəsmələ yalnız Fatihənin 1-ci ayəsidir — digər surələrdə təkrar gizlədilib
    expect(plain(PRACTICE_AYAHS[112][0].words[0][0])).toBe('قل')
    expect(PRACTICE_AYAHS[1][0].words.map(x => plain(x[0])).join(' ')).toBe('بسم الله الرحمن الرحيم')
    // Ümumi ayə nömrələri ardıcıl: 114:6 → 6236
    expect(PRACTICE_AYAHS[114][5].g).toBe(6236)
  })
})

describe('hərəkələr və heca cədvəli', () => {
  it('hər hərəkənin adı və izahı 5 dildə', () => {
    expect(HARAKAT.map(h => h.id)).toEqual(['fatha', 'kasra', 'damma', 'sukun', 'shadda', 'tanwin', 'madd'])
    for (const h of HARAKAT) { expect(filled5(h.name), h.id).toBe(true); expect(filled5(h.desc), h.id).toBe(true) }
    expect(HARAKAT.find(h => h.id === 'tanwin').variants).toHaveLength(3)
    expect(HARAKAT.find(h => h.id === 'madd').variants.map(v => v.mark)).toEqual(['ا', 'ي', 'و'])
  })

  it('syllables(): fəthə/kəsrə/dammə, tənvin və mədd üçün 3 heca, əlifdə həmzə', () => {
    const ba = LETTERS.find(l => l.id === 'ba')
    expect(syllables(ba, 'fatha')).toEqual([{ ar: 'بَ', tl: 'ba' }])
    expect(syllables(ba, 'kasra')[0].tl).toBe('bi')
    expect(syllables(ba, 'damma')[0].tl).toBe('bu')
    expect(syllables(ba, 'sukun')[0]).toEqual({ ar: 'أَبْ', tl: 'ab' })
    expect(syllables(ba, 'tanwin').map(s => s.tl)).toEqual(['ban', 'bin', 'bun'])
    expect(syllables(ba, 'madd').map(s => s.ar)).toEqual(['بَا', 'بِي', 'بُو'])
    const alif = LETTERS[0]
    expect(syllables(alif, 'kasra')[0].ar).toBe('إِ')
    expect(syllables(alif, 'sukun')).toEqual([])
    for (const l of LETTERS) for (const m of SYLLABLE_MODES) for (const s of syllables(l, m)) expect(s.ar).toMatch(ARABIC)
  })
})

describe('təcvid və dərslər', () => {
  it('qruplar: əl artikli, nun/tənvin (4 qayda), mim (3), qalqalə, mədd', () => {
    expect(TAJWEED.map(g => g.id)).toEqual(['lam', 'nun', 'mim', 'qalqala', 'madd'])
    expect(TAJWEED.find(g => g.id === 'nun').rules.map(r => r.id)).toEqual(['izhar', 'idgham', 'iqlab', 'ikhfa'])
    expect(TAJWEED.find(g => g.id === 'mim').rules).toHaveLength(3)
    for (const g of TAJWEED) {
      expect(filled5(g.title), g.id).toBe(true)
      if (g.intro) expect(filled5(g.intro)).toBe(true)
      for (const r of g.rules) { expect(filled5(r.name), r.id).toBe(true); expect(filled5(r.desc), r.id).toBe(true) }
    }
  })

  it('şəmsiyyə + qəməriyyə = 28 hərf; nun qaydalarının hərfləri 28-i örtür (həmzə ilə)', () => {
    const lam = TAJWEED.find(g => g.id === 'lam').rules.flatMap(r => r.letters.split(' '))
    expect(lam).toHaveLength(28)
    expect(new Set(lam).size).toBe(28)
    const nun = TAJWEED.find(g => g.id === 'nun').rules.flatMap(r => r.letters.split(' '))
    expect(nun).toHaveLength(6 + 6 + 1 + 15)
    expect(nun.filter(c => c !== 'ء').sort()).toEqual(LETTERS.map(l => l.ch).filter(c => c !== 'ا').sort())
    expect(TAJWEED.find(g => g.id === 'qalqala').rules[0].letters).toBe('ق ط ب ج د')
  })

  it('4 dərs, başlıq və təsvir 5 dildə', () => {
    expect(LESSONS.map(l => l.id)).toEqual(['letters', 'harakat', 'reading', 'tajweed'])
    for (const l of LESSONS) { expect(filled5(l.title)).toBe(true); expect(filled5(l.desc)).toBe(true) }
  })

  it('interfeys mətnləri: hər dildə eyni açarlar, boş mətn yoxdur', () => {
    const keys = Object.keys(UI.az).sort()
    for (const lang of COURSE_LANGS) {
      expect(Object.keys(UI[lang]).sort(), lang).toEqual(keys)
      for (const k of keys) {
        const v = UI[lang][k]
        if (typeof v === 'string') expect(v.trim(), `${lang}.${k}`).not.toBe('')
        else if (typeof v === 'function') expect(String(v(1, 2)).trim()).not.toBe('')
        else expect(Object.values(v).every(x => String(x).trim())).toBe(true)
      }
    }
  })
})

describe('səs faylları və atribusiya', () => {
  it('səsi olan hər hərfin faylı public/audio/arabic-dədir və mənbəyi qeyd olunub', () => {
    for (const l of LETTERS.filter(x => x.audio)) {
      const f = path.join(ROOT, 'public/audio/arabic', `${l.audio}.wav`)
      expect(fs.existsSync(f), f).toBe(true)
      const credit = ARABIC_AUDIO_FILES.find(c => c.id === l.audio)
      expect(credit, l.id).toBeTruthy()
      expect(credit.letter).toBe(l.ch)
      expect(credit.bytes).toBe(fs.statSync(f).size)
      expect(['CC0', 'CC BY-SA 3.0', 'CC BY 4.0']).toContain(credit.license)
      expect(credit.page).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      // WAV PCM başlığı (iOS Safari oxuyur)
      const head = fs.readFileSync(f).subarray(0, 12).toString('latin1')
      expect(head.startsWith('RIFF') && head.endsWith('WAVE')).toBe(true)
    }
    for (const s of ARABIC_AUDIO_SOURCES) expect(filled5(s.note)).toBe(true)
  })
})

describe('yoxlama generatoru', () => {
  for (const id of Object.keys(QUIZ_LENGTH)) {
    it(`${id}: ${QUIZ_LENGTH[id]} sual, cavab variantlar arasındadır, variantlar təkrarlanmır`, () => {
      for (const lang of COURSE_LANGS) {
        for (let seed = 1; seed <= 15; seed++) {
          const qs = buildQuiz(id, lang, seeded(seed))
          expect(qs).toHaveLength(QUIZ_LENGTH[id])
          for (const q of qs) {
            expect(q.prompt.text).toMatch(/\S/)
            expect(q.options.length).toBeGreaterThanOrEqual(2)
            expect(q.options.filter(o => o.key === q.answer)).toHaveLength(1)
            expect(new Set(q.options.map(o => o.key)).size).toBe(q.options.length)
            expect(new Set(q.options.map(o => o.label)).size).toBe(q.options.length)
            if (q.kind === 'sound') expect(q.prompt.audio.urls[0]).toMatch(/^\/audio\/arabic\/[a-z0-9]+\.wav$/)
          }
        }
      }
    })
  }
})

describe('irəliləyiş (localStorage)', () => {
  beforeEach(() => {
    const store = new Map()
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    }
  })

  it('boş və pozuq yaddaş çökdürmür', () => {
    expect(readProgress()).toEqual({ best: {}, last: null })
    localStorage.setItem(PROGRESS_KEY, '{pozuq')
    expect(readProgress()).toEqual({ best: {}, last: null })
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ best: { letters: 500, harakat: 80, x: 1 }, last: 'yox' }))
    expect(readProgress()).toEqual({ best: { harakat: 80 }, last: null })
  })

  it('yaddaş bağlıdırsa da işləyir', () => {
    globalThis.localStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
    expect(readProgress()).toEqual({ best: {}, last: null })
    expect(() => writeProgress({ best: {}, last: null })).not.toThrow()
  })

  it('ən yaxşı nəticə saxlanır, 70%-dən dərs tamamlanır, "Davam et" növbəti dərsə', () => {
    let p = readProgress()
    expect(resumeLesson(p)).toBe('letters')
    p = withResult(p, 'letters', 60)
    expect(isPassed(p, 'letters')).toBe(false)
    expect(resumeLesson(p)).toBe('letters')
    p = withResult(p, 'letters', 90)
    p = withResult(p, 'letters', 40)
    expect(p.best.letters).toBe(90)
    expect(resumeLesson(p)).toBe('harakat')
    expect(percentDone(p)).toBe(25)
    writeProgress(p)
    expect(readProgress()).toEqual(p)
  })
})
