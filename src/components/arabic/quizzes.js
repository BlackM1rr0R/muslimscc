// ═══════════════════════════════════════════════════════
// Ərəb kursu — yoxlama suallarının generatoru (hər dərs üçün)
//
// Sual: { id, kind, prompt: { text, ar?, audio?: { key, urls } }, options: [{ key, label, ar }], answer }
//   ar: true — variant ərəbcədir (böyük Amiri şrifti ilə göstərilir)
// rnd — təsadüfi ədəd funksiyası (testdə sabit toxum vermək üçün)
// ═══════════════════════════════════════════════════════

import { LETTERS, QW, READING_TWO, READING_THREE, PRACTICE_AYAHS, TAJWEED, syllables } from '../../data/arabicCourse.js'
import { letterAudioUrl, ayahUrls } from './useCourseAudio.js'
import { ui, pick } from './strings.js'

export const QUIZ_LENGTH = { letters: 10, harakat: 10, reading: 8, tajweed: 8 }

function shuffle(arr, rnd) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const sample = (arr, n, rnd) => shuffle(arr, rnd).slice(0, n)

/** Düzgün cavab + (n−1) fərqli səhv variant, qarışdırılmış */
function withDistractors(correct, pool, n, rnd, keyOf = (x) => x.key) {
  const others = shuffle(pool.filter(x => keyOf(x) !== keyOf(correct)), rnd)
  const seen = new Set([keyOf(correct)])
  const picked = []
  for (const o of others) {
    if (picked.length >= n - 1) break
    if (seen.has(keyOf(o))) continue
    seen.add(keyOf(o)); picked.push(o)
  }
  return shuffle([correct, ...picked], rnd)
}

const letterOpt = (l) => ({ key: l.id, label: l.ch, ar: true })

function lettersQuiz(lang, rnd) {
  const t = ui(lang)
  const kinds = ['sound', 'name', 'form']
  return sample(LETTERS, QUIZ_LENGTH.letters, rnd).map((l, i) => {
    let kind = kinds[i % kinds.length]
    if (kind === 'sound' && !l.audio) kind = 'name'
    if (kind === 'sound') {
      return {
        id: `s-${l.id}`, kind, answer: l.id,
        prompt: { text: t.qSound, audio: { key: `quiz-${l.id}`, urls: [letterAudioUrl(l.audio)] } },
        options: withDistractors(letterOpt(l), LETTERS.map(letterOpt), 4, rnd),
      }
    }
    if (kind === 'name') {
      const opt = (x) => ({ key: x.id, label: `${pick(x.name, lang)} · ${x.tl}`, ar: false })
      return {
        id: `n-${l.id}`, kind, answer: l.id,
        prompt: { text: t.qName, ar: l.ch },
        options: withDistractors(opt(l), LETTERS.map(opt), 4, rnd, (x) => x.key),
      }
    }
    const pos = ['initial', 'medial', 'final'][Math.floor(rnd() * 3)]
    return {
      id: `f-${l.id}`, kind, answer: l.id,
      prompt: { text: `${t.qForm} (${t.forms[pos]})`, ar: l.forms[pos] },
      options: withDistractors(letterOpt(l), LETTERS.map(letterOpt), 4, rnd),
    }
  })
}

function harakatQuiz(lang, rnd) {
  const t = ui(lang)
  const modes = ['fatha', 'kasra', 'damma', 'tanwin', 'madd']
  const letters = LETTERS.filter(l => l.id !== 'alif')
  return sample(letters, QUIZ_LENGTH.harakat, rnd).map((l, i) => {
    const mode = modes[i % modes.length]
    const pool = ['fatha', 'kasra', 'damma', 'tanwin', 'madd'].flatMap(m => syllables(l, m))
    const list = syllables(l, mode)
    const s = list[Math.floor(rnd() * list.length)]
    const opt = (x) => ({ key: x.tl, label: x.tl, ar: false, tl: true })
    return {
      id: `h-${l.id}-${s.tl}`, kind: 'syllable', answer: s.tl,
      prompt: { text: t.qSyllable, ar: s.ar },
      options: withDistractors(opt(s), pool.map(opt), 4, rnd),
    }
  })
}

function readingQuiz(lang, rnd) {
  const t = ui(lang)
  // Eyni söz (məs. ٱلرَّحْمَٰنِ) kontekstdə fərqli transliterasiya ala bilər —
  // hər ərəbcə yazılış yalnız bir dəfə, səhv variantlar isə başqa sözlərdən
  const uniq = (arr) => arr.filter((x, i) => arr.findIndex(y => y.w === x.w || y.tl === x.tl) === i)
  const words = uniq([...READING_TWO, ...READING_THREE].map(k => ({ w: QW[k].w, tl: QW[k].tl })))
  const ayahWords = uniq(Object.values(PRACTICE_AYAHS).flat().flatMap(a => a.words.map(([w, tl]) => ({ w, tl }))))
    .filter(x => !words.some(y => y.w === x.w || y.tl === x.tl))
  const pool = [...words, ...ayahWords]
  const opt = (x) => ({ key: x.tl, label: x.tl, ar: false, tl: true })
  // Yarısı sadə sözlərdən, yarısı surələrdən
  const half = Math.ceil(QUIZ_LENGTH.reading / 2)
  const chosen = [...sample(words, half, rnd), ...sample(ayahWords, QUIZ_LENGTH.reading - half, rnd)]
  return shuffle(chosen, rnd).map((x, i) => ({
    id: `r-${i}-${x.tl}`, kind: 'word', answer: x.tl,
    prompt: { text: t.qWord, ar: x.w },
    options: withDistractors(opt(x), pool.filter(y => y.w !== x.w).map(opt), 4, rnd),
  }))
}

function tajweedQuiz(lang, rnd) {
  const t = ui(lang)
  const qs = []
  // Qrup daxilində: nümunə → qayda (variantlar yalnız həmin qrupun qaydaları — çaşqınlıq olmasın)
  for (const g of TAJWEED) {
    if (g.rules.length < 2) continue
    for (const r of g.rules) {
      for (const k of r.ex) {
        const opt = (x) => ({ key: x.id, label: pick(x.name, lang), ar: false })
        qs.push({
          id: `t-${r.id}-${k}`, kind: 'rule', answer: r.id,
          prompt: { text: t.qRule(pick(g.title, lang)), ar: QW[k].w, ref: QW[k].ref },
          options: withDistractors(opt(r), g.rules.map(opt), Math.min(4, g.rules.length), rnd),
        })
      }
    }
  }
  // Qalqalə: hərf tanıma
  const qal = TAJWEED.find(g => g.id === 'qalqala').rules[0].letters.split(' ')
  const non = LETTERS.map(l => l.ch).filter(c => !qal.includes(c) && c !== 'ا')
  for (const c of sample(qal, 2, rnd)) {
    const wrong = sample(non, 3, rnd)
    qs.push({
      id: `q-${c}`, kind: 'qalqala', answer: c,
      prompt: { text: t.qQalqala },
      options: shuffle([c, ...wrong], rnd).map(x => ({ key: x, label: x, ar: true })),
    })
  }
  return sample(qs, QUIZ_LENGTH.tajweed, rnd)
}

const GEN = { letters: lettersQuiz, harakat: harakatQuiz, reading: readingQuiz, tajweed: tajweedQuiz }

/** Dərs üçün sual dəsti */
export function buildQuiz(lessonId, lang, rnd = Math.random) {
  const g = GEN[lessonId]
  return g ? g(lang, rnd) : []
}
