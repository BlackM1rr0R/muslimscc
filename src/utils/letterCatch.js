// ═══════════════════════════════════════════════════════
// Hərf tutma oyunu — saf məntiq (components/LetterCatch.jsx oxuyur)
//
// • Yuxarıda ərəbcə söz göstərilir; hərflər (tək forma) yuxarıdan düşür,
//   uşaq sözün hərflərini SIRA İLƏ toxunaraq tutur. Söz tamamlananda
//   hərflərin bitişik yazılışı göstərilir (tək → bitişik).
// • Səhv hərf → 1 can gedir (3 can). Düzgün hərfi buraxmaq cəzasızdır.
// • Səviyyə: 1 — 3 hərfli, 2 — 4 hərfli, 3+ — 5 hərfli sözlər; hər
//   səviyyədə düşmə sürəti artır, hərflər daha tez çıxır.
// • Sözlər: kursdakı sözlər (data/arabicCourse.js → QW) Quran sözləridir və
//   mənası yoxdur, ona görə burada çox işlənən, birmənalı isimlər seçilib;
//   yalnız 28 əsas hərf (həmzə, tə-mərbuta, əlif-məqsura yoxdur).
// • Koordinatlar meydanın payıdır: x — 0…1 (eninə), y — 0…1 (yuxarıdan).
// Bütün funksiyalar safdır: vəziyyəti dəyişmir, yenisini qaytarır.
// ═══════════════════════════════════════════════════════

/** m — mənası (az, en, ru, tr); ərəbcə interfeysdə məna göstərilmir */
const w = (plain, voc, az, en, ru, tr) => ({ id: plain, plain, voc, letters: [...plain], m: { az, en, ru, tr } })

export const WORDS = [
  // 3 hərf
  w('باب', 'بَاب', 'qapı', 'door', 'дверь', 'kapı'),
  w('قلم', 'قَلَم', 'qələm', 'pen', 'ручка', 'kalem'),
  w('بيت', 'بَيْت', 'ev', 'house', 'дом', 'ev'), // lang-ok: az və tr-da söz eynidir
  w('شمس', 'شَمْس', 'günəş', 'sun', 'солнце', 'güneş'),
  w('قمر', 'قَمَر', 'ay', 'moon', 'луна', 'ay'), // lang-ok: az və tr-da söz eynidir
  w('نور', 'نُور', 'işıq', 'light', 'свет', 'ışık'),
  w('جمل', 'جَمَل', 'dəvə', 'camel', 'верблюд', 'deve'),
  w('فيل', 'فِيل', 'fil', 'elephant', 'слон', 'fil'), // lang-ok: az və tr-da söz eynidir
  w('بحر', 'بَحْر', 'dəniz', 'sea', 'море', 'deniz'),
  w('نهر', 'نَهْر', 'çay', 'river', 'река', 'nehir'),
  w('عسل', 'عَسَل', 'bal', 'honey', 'мёд', 'bal'), // lang-ok: az və tr-da söz eynidir
  w('خبز', 'خُبْز', 'çörək', 'bread', 'хлеб', 'ekmek'),
  w('سمك', 'سَمَك', 'balıq', 'fish', 'рыба', 'balık'),
  w('عنب', 'عِنَب', 'üzüm', 'grapes', 'виноград', 'üzüm'), // lang-ok: az və tr-da söz eynidir
  w('تمر', 'تَمْر', 'xurma', 'dates', 'финики', 'hurma'),
  w('جبل', 'جَبَل', 'dağ', 'mountain', 'гора', 'dağ'), // lang-ok: az və tr-da söz eynidir
  w('ثلج', 'ثَلْج', 'qar', 'snow', 'снег', 'kar'),
  w('مطر', 'مَطَر', 'yağış', 'rain', 'дождь', 'yağmur'),
  // 4 hərf
  w('كتاب', 'كِتَاب', 'kitab', 'book', 'книга', 'kitap'),
  w('مسجد', 'مَسْجِد', 'məscid', 'mosque', 'мечеть', 'cami'),
  w('نجوم', 'نُجُوم', 'ulduzlar', 'stars', 'звёзды', 'yıldızlar'),
  w('سحاب', 'سَحَاب', 'buludlar', 'clouds', 'облака', 'bulutlar'),
  w('غزال', 'غَزَال', 'ceyran', 'gazelle', 'газель', 'ceylan'),
  w('رمان', 'رُمَّان', 'nar', 'pomegranate', 'гранат', 'nar'), // lang-ok: az və tr-da söz eynidir
  w('تفاح', 'تُفَّاح', 'alma', 'apples', 'яблоки', 'elma'),
  w('كرسي', 'كُرْسِيّ', 'stul', 'chair', 'стул', 'sandalye'),
  w('حليب', 'حَلِيب', 'süd', 'milk', 'молоко', 'süt'),
  w('دفتر', 'دَفْتَر', 'dəftər', 'notebook', 'тетрадь', 'defter'),
  w('ضفدع', 'ضِفْدَع', 'qurbağa', 'frog', 'лягушка', 'kurbağa'),
  // 5 hərf
  w('مفتاح', 'مِفْتَاح', 'açar', 'key', 'ключ', 'anahtar'),
  w('قنديل', 'قِنْدِيل', 'çıraq', 'lantern', 'светильник', 'kandil'),
  w('عصفور', 'عُصْفُور', 'sərçə', 'sparrow', 'воробей', 'serçe'),
  w('بستان', 'بُسْتَان', 'bağ', 'garden', 'сад', 'bahçe'),
  w('صابون', 'صَابُون', 'sabun', 'soap', 'мыло', 'sabun'), // lang-ok: az və tr-da söz eynidir
  w('زيتون', 'زَيْتُون', 'zeytun', 'olives', 'оливки', 'zeytin'),
]

/** 28 hərfin tək forması — yanlış (çaşdırıcı) hərflər buradan */
export const ALPHABET = [...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي']

export const LIVES = 3
export const WORDS_PER_LEVEL = 3
export const MAX_ITEMS = 6
const ITEM_R = 0.09 // hərfin "radiusu" (meydanın eninə görə) — üst-üstə düşməsin
const FORCE_AFTER = 2 // ən çox 2 yanlış hərfdən sonra lazım olan hərf mütləq çıxır
const DONE_PAUSE = 2.2 // söz tamamlananda bitişik yazılış neçə saniyə göstərilir
const WRONG_FADE = 0.45 // səhv toxunulan hərf neçə saniyə titrəyib yox olur

/** Səviyyədəki sözün hərf sayı */
export const wordLength = (level) => Math.min(5, 2 + Math.max(1, level))

/** Səviyyənin sürəti: fall — saniyədə meydan hündürlüyünün payı, every — hərflər arası saniyə */
export function levelSpeed(level, { reduced = false, slow = false } = {}) {
  const l = Math.max(1, level)
  let fall = Math.min(0.3, 0.11 + 0.025 * (l - 1))
  const every = Math.max(0.75, 1.5 - 0.12 * (l - 1))
  if (reduced) fall *= 0.6
  if (slow) fall = 0.01
  return { fall, every: reduced ? every * 1.3 : every }
}

/** Xal: düzgün hərf — 10 × səviyyə; söz tamamlananda — 25 × səviyyə + qalan can başına 5 */
export const letterPoints = (level) => 10 * level
export const wordBonus = (level, lives) => 25 * level + 5 * lives

/** Səviyyənin sözündən təsadüfi biri; used-dakılar (artıq çıxanlar) qurtarana qədər təkrar olmur */
export function pickWord(level, rng = Math.random, used = []) {
  const len = wordLength(level)
  const pool = WORDS.filter(x => x.letters.length === len)
  const fresh = pool.filter(x => !used.includes(x.id))
  const list = fresh.length ? fresh : pool
  return list[Math.floor(rng() * list.length) % list.length]
}

/** (x, y) nöqtəsi hansısa hərfin dairəsinə düşürmü (r — radius) */
export function hitTest(items, x, y, r = ITEM_R) {
  return items.find(it => !it.wrong && (it.x - x) ** 2 + (it.y - y) ** 2 < (2 * r) ** 2) || null
}

/** Yeni oyun (status: 'playing') */
export function newGame(rng = Math.random, level = 1) {
  const word = pickWord(level, rng)
  return {
    level, score: 0, lives: LIVES, word, idx: 0, used: [word.id], wordsDone: 0,
    items: [], nextId: 1, spawnIn: 0.3, sinceNeeded: 0, phase: 'catch', doneIn: 0, status: 'playing', levelUp: false,
  }
}

/** İndi tutulmalı hərf */
export const neededLetter = (s) => (s.phase === 'catch' ? s.word.letters[s.idx] : null)

function spawn(s, rng) {
  const need = neededLetter(s)
  const forced = s.sinceNeeded >= FORCE_AFTER
  const onScreen = s.items.some(it => !it.wrong && it.letter === need)
  const isNeed = forced || (!onScreen && rng() < 0.5) || rng() < 0.25
  let letter = need
  if (!isNeed) {
    // Çaşdırıcı: əsasən sözün digər hərfləri (oxşar hərflər öyrədir), bəzən istənilən hərf
    const others = s.word.letters.filter(c => c !== need)
    const pool = others.length && rng() < 0.5 ? others : ALPHABET.filter(c => c !== need)
    letter = pool[Math.floor(rng() * pool.length) % pool.length]
  }
  // Yuxarıda başqa hərflə üst-üstə düşməyən yer (5 cəhd)
  let x = 0.1 + rng() * 0.8
  for (let i = 0; i < 5 && hitTest(s.items, x, 0, ITEM_R); i++) x = 0.1 + rng() * 0.8
  const item = { id: s.nextId, letter, x, y: -0.12, hue: Math.floor(rng() * 6), wrong: 0 }
  return { ...s, items: [...s.items, item], nextId: s.nextId + 1, sinceNeeded: letter === need ? 0 : s.sinceNeeded + 1 }
}

/**
 * Bir kadr irəli (dt — saniyə). opts: { rng, reduced, slow }.
 * Qaytarır: yeni vəziyyət; `changed` — hərf əlavə/silindi və ya söz dəyişdi
 * (komponent yalnız onda yenidən render edir, qalan hərəkət transform ilə).
 */
export function step(s, dt, { rng = Math.random, reduced = false, slow = false } = {}) {
  if (s.status !== 'playing') return { ...s, changed: false }
  const d = Math.min(0.1, Math.max(0, dt)) // tab qayıdanda böyük sıçrayış olmasın
  let n = { ...s, levelUp: false }
  let changed = false

  if (n.phase === 'done') {
    n.doneIn -= d
    if (n.doneIn <= 0) {
      const level = n.wordsDone % WORDS_PER_LEVEL === 0 ? n.level + 1 : n.level
      const word = pickWord(level, rng, n.used)
      const used = n.used.length >= WORDS.length - 1 ? [word.id] : [...n.used, word.id]
      n = { ...n, level, word, used, idx: 0, phase: 'catch', items: [], spawnIn: 0.4, sinceNeeded: 0, levelUp: level !== s.level }
      changed = true
    }
    return { ...n, changed }
  }

  const { fall, every } = levelSpeed(n.level, { reduced, slow })
  const items = []
  for (const it of n.items) {
    if (it.wrong) {
      const left = it.wrong - d
      if (left > 0) items.push({ ...it, wrong: left })
      else changed = true
      continue
    }
    const y = it.y + fall * d
    if (y > 1.05) { changed = true; continue } // aşağı düşdü — cəzasız
    items.push({ ...it, y })
  }
  n.items = items
  n.spawnIn -= d
  if (n.spawnIn <= 0) {
    n.spawnIn += every
    if (n.items.length < MAX_ITEMS) { n = spawn(n, rng); changed = true }
  }
  return { ...n, changed }
}

/**
 * Hərfə toxunuş. Qaytarır: { state, result } — result: 'hit' | 'word' | 'wrong' | 'over' | 'none'.
 */
export function tap(s, id) {
  const it = s.items.find(x => x.id === id)
  if (s.status !== 'playing' || s.phase !== 'catch' || !it || it.wrong) return { state: s, result: 'none' }
  if (it.letter === s.word.letters[s.idx]) {
    const idx = s.idx + 1
    const score = s.score + letterPoints(s.level)
    if (idx >= s.word.letters.length) {
      return {
        state: { ...s, idx, items: [], phase: 'done', doneIn: DONE_PAUSE, wordsDone: s.wordsDone + 1, score: score + wordBonus(s.level, s.lives) },
        result: 'word',
      }
    }
    return { state: { ...s, idx, score, items: s.items.filter(x => x.id !== id) }, result: 'hit' }
  }
  const lives = s.lives - 1
  const items = s.items.map(x => (x.id === id ? { ...x, wrong: WRONG_FADE } : x))
  if (lives <= 0) return { state: { ...s, lives: 0, items, status: 'over' }, result: 'over' }
  return { state: { ...s, lives, items }, result: 'wrong' }
}

/** Hərfləri ayrı-ayrı (tək forma) göstərmək üçün — bitişməsin deyə aralarına boşluq */
export const isolatedForm = (word) => word.letters.join(' ')
