// ═══════════════════════════════════════════════════════
// Ağıllı hifz — saf məntiq (React-sız, yan təsirsiz; tests/unit/hifzSrs.test.js)
//
// • Aralıqlı təkrar (SM-2 üslubu, ayə-ayə): Yenidən / Çətin / Yaxşı / Asan
// • Gündəlik jurnal, ardıcıllıq (streak), "bu gün təkrar" növbəsi
// • Qrafik üçün zaman sırası, surə üzrə irəliləyiş
// • Ərəbcə mətnin normallaşdırılması və tanınmış sözlərlə TƏXMİNİ müqayisə
//   (təcvidi qiymətləndirmir — yalnız sözlərin ardıcıllığına baxır)
//
// Yaddaş: localStorage 'hifz_srs' (bu fayl yalnız formanı yoxlayır/təmizləyir).
// Köhnə 'hifz_progress' açarı ({ surə: 1|2 }) dəyişmir və oxunaqlı qalır.
// Tarixlər yerli gün kimi 'YYYY-MM-DD' sətirləridir — hesab UTC ilə aparılır,
// ona görə yay/qış saatı keçidi bir günü "itirmir".
// ═══════════════════════════════════════════════════════

export const SRS_KEY = 'hifz_srs'
export const SRS_VERSION = 1
export const GRADES = ['again', 'hard', 'good', 'easy']
export const DEFAULT_EASE = 2.5
export const MIN_EASE = 1.3
export const MAX_EASE = 3.2
export const MAX_INTERVAL = 365
export const DEFAULT_GOAL = 5
export const GOAL_MIN = 1
export const GOAL_MAX = 50

// ── Tarix köməkçiləri ──
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const isDate = s => typeof s === 'string' && DATE_RE.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'))

/** Yerli gün → 'YYYY-MM-DD' */
export function dateKey(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export function addDays(day, n) {
  const t = Date.parse(day + 'T00:00:00Z') + Math.round(n) * 86400000
  return new Date(t).toISOString().slice(0, 10)
}
export function daysBetween(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000)
}

// ── Ayə açarı ──
export const itemKey = (s, a) => `${s}:${a}`
export function parseKey(k) {
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(String(k))
  if (!m) return null
  const s = Number(m[1]), a = Number(m[2])
  return s >= 1 && s <= 114 && a >= 1 && a <= 286 ? { s, a } : null
}

// ── Vəziyyət ──
export const emptyState = () => ({ v: SRS_VERSION, items: {}, log: {}, goal: DEFAULT_GOAL })

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))
const nonNegInt = x => (Number.isFinite(Number(x)) && Number(x) >= 0 ? Math.floor(Number(x)) : 0)

/** Yaddaşdan gələn (bəlkə pozuq) dəyəri təhlükəsiz vəziyyətə çevirir. */
export function sanitizeState(raw) {
  const st = emptyState()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return st
  if (raw.items && typeof raw.items === 'object' && !Array.isArray(raw.items)) {
    for (const [k, v] of Object.entries(raw.items)) {
      const ref = parseKey(k)
      if (!ref || !v || typeof v !== 'object') continue
      if (!isDate(v.due) || !isDate(v.added)) continue
      st.items[itemKey(ref.s, ref.a)] = {
        s: ref.s, a: ref.a,
        ease: clamp(Number(v.ease) || DEFAULT_EASE, MIN_EASE, MAX_EASE),
        interval: clamp(nonNegInt(v.interval), 0, MAX_INTERVAL),
        reps: nonNegInt(v.reps),
        lapses: nonNegInt(v.lapses),
        due: v.due,
        added: v.added,
        last: isDate(v.last) ? v.last : null,
      }
    }
  }
  if (raw.log && typeof raw.log === 'object' && !Array.isArray(raw.log)) {
    for (const [d, v] of Object.entries(raw.log)) {
      if (!isDate(d) || !v || typeof v !== 'object') continue
      const reviews = nonNegInt(v.reviews), added = nonNegInt(v.new)
      if (reviews || added) st.log[d] = { reviews, new: added }
    }
  }
  const g = Number(raw.goal)
  if (Number.isInteger(g)) st.goal = clamp(g, GOAL_MIN, GOAL_MAX)
  return st
}

export function loadState(storage = globalThis.localStorage) {
  try { return sanitizeState(JSON.parse(storage?.getItem(SRS_KEY) || 'null')) } catch { return emptyState() }
}
export function saveState(state, storage = globalThis.localStorage) {
  try { storage?.setItem(SRS_KEY, JSON.stringify(state)) } catch { /* yaddaş bağlıdır */ }
}

// ── SM-2 üslubunda planlama ──
/** Yeni (heç qiymətləndirilməmiş) ayənin ilkin vəziyyəti */
export const newItem = (s, a, today) => ({ s, a, ease: DEFAULT_EASE, interval: 0, reps: 0, lapses: 0, due: today, added: today, last: null })

/**
 * Qiymətə görə növbəti vəziyyət (tarixsiz hissə).
 *   again — sıfırdan: bu gün yenidən (interval 0), asanlıq −0.2, səhv +1
 *   hard  — interval × 1.2 (ən az 1 gün), asanlıq −0.15
 *   good  — SM-2: 1 → 6 → interval × asanlıq
 *   easy  — good-dan 1.3 dəfə uzun (yenidə 4 gün), asanlıq +0.15
 * Növbəti interval həmişə əvvəlkindən az olmur (again-dən başqa).
 */
export function schedule(item, grade) {
  if (!GRADES.includes(grade)) throw new Error('bad-grade')
  const ease0 = item.ease || DEFAULT_EASE
  const prev = item.interval || 0
  const reps = item.reps || 0
  let ease = ease0, interval, nextReps = reps + 1, lapses = item.lapses || 0
  if (grade === 'again') {
    ease = ease0 - 0.2; interval = 0; nextReps = 0; lapses += 1
  } else if (grade === 'hard') {
    ease = ease0 - 0.15
    interval = Math.max(1, Math.round(prev * 1.2), reps === 0 ? 1 : prev + 1)
  } else {
    const good = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(prev * ease0)
    if (grade === 'good') interval = Math.max(good, prev + 1)
    else { ease = ease0 + 0.15; interval = Math.max(reps === 0 ? 4 : Math.round(good * 1.3), prev + 1) }
  }
  return {
    ...item,
    ease: Math.round(clamp(ease, MIN_EASE, MAX_EASE) * 100) / 100,
    interval: clamp(interval, 0, MAX_INTERVAL),
    reps: nextReps,
    lapses,
  }
}

/** Dörd qiymətin hər biri üçün neçə gün sonra (düymələrin altındakı ipucu) */
export function previewIntervals(item) {
  const out = {}
  for (const g of GRADES) out[g] = schedule(item, g).interval
  return out
}

/**
 * Ayəni qiymətləndirir: vəziyyət + jurnal yenilənir (dəyişməz — yeni obyekt).
 * Ayə hələ siyahıda yoxdursa, "yeni" kimi əlavə olunur və gündəlik hədəfə sayılır.
 */
export function gradeItem(state, s, a, grade, today) {
  const key = itemKey(s, a)
  const existing = state.items[key]
  const base = existing || newItem(s, a, today)
  const next = schedule(base, grade)
  next.due = addDays(today, next.interval)
  next.last = today
  const day = state.log[today] || { reviews: 0, new: 0 }
  const log = { ...state.log, [today]: existing ? { ...day, reviews: day.reviews + 1 } : { ...day, new: day.new + 1 } }
  return { ...state, items: { ...state.items, [key]: next }, log }
}

export function setGoal(state, goal) {
  const g = Math.round(Number(goal))
  return Number.isFinite(g) ? { ...state, goal: clamp(g, GOAL_MIN, GOAL_MAX) } : state
}

/** Bu gün (və ya keçmiş) vaxtı çatmış ayələr — ən gecikmiş əvvəl, sonra Quran sırası */
export function dueItems(state, today) {
  return Object.values(state.items)
    .filter(it => it.due <= today)
    .sort((x, y) => (x.due < y.due ? -1 : x.due > y.due ? 1 : x.s - y.s || x.a - y.a))
}

/** Surədə hələ öyrənilməmiş növbəti ayələr (from-dan başlayaraq), ən çox limit */
export function nextNewAyahs(state, surah, totalAyahs, from = 1, limit = DEFAULT_GOAL) {
  const out = []
  for (let a = Math.max(1, from); a <= totalAyahs && out.length < limit; a++) {
    if (!state.items[itemKey(surah, a)]) out.push({ s: surah, a })
  }
  return out
}

export function todayStats(state, today) {
  const day = state.log[today] || { reviews: 0, new: 0 }
  const due = dueItems(state, today).length
  return { due, reviewed: day.reviews, learned: day.new, goal: state.goal, goalLeft: Math.max(0, state.goal - day.new), total: Object.keys(state.items).length }
}

/**
 * Ardıcıl fəal günlər. Bu gün hələ heç nə edilməyibsə, dünən bitən zəncir
 * qırılmış sayılmır (gün bitməyib).
 */
export function streak(state, today) {
  const active = d => { const x = state.log[d]; return !!x && (x.reviews > 0 || x.new > 0) }
  let d = active(today) ? today : addDays(today, -1)
  let n = 0
  while (active(d)) { n++; d = addDays(d, -1) }
  return n
}

/**
 * Qrafik: son `days` gündə hər günün sonunda əzbər siyahısındakı ayə sayı
 * (əlavə tarixinə görə yığılan). [{ date, count }]
 */
export function memorisedSeries(state, today, days = 30) {
  const added = Object.values(state.items).map(it => it.added).sort()
  const out = []
  let i = 0
  const start = addDays(today, -(days - 1))
  for (let k = 0; k < days; k++) {
    const d = addDays(start, k)
    while (i < added.length && added[i] <= d) i++
    out.push({ date: d, count: i })
  }
  return out
}

/** Surə üzrə: { surahNum: ayə sayı } — yalnız ən azı bir ayəsi olanlar */
export function perSurahCounts(state) {
  const c = {}
  for (const it of Object.values(state.items)) c[it.s] = (c[it.s] || 0) + 1
  return c
}

/**
 * Köhnə izləyicidə "əzbər" işarələnmiş surələri təkrar siyahısına köçürür.
 * Hamısı bir günə yığılmasın deyə vaxtlar sonrakı günlərə yayılır
 * (gündə ən çox perDay ayə). Artıq siyahıda olan ayələrə toxunulmur.
 * refs: [{ s, a }]
 */
export function seedItems(state, refs, today, perDay = 20) {
  const items = { ...state.items }
  let n = 0
  for (const { s, a } of refs) {
    const key = itemKey(s, a)
    if (items[key]) continue
    const offset = Math.floor(n / Math.max(1, perDay))
    items[key] = { s, a, ease: DEFAULT_EASE, interval: Math.max(1, offset), reps: 1, lapses: 0, due: addDays(today, offset), added: today, last: null }
    n++
  }
  return { ...state, items }
}

// ── Ərəbcə mətn: normallaşdırma və təxmini müqayisə ──
// Hərəkələr, Quran işarələri (vəqf, kiçik hərflər), təvil (ـ) silinir;
// əlif/həmzə formaları, ى/ي, ة/ه, ؤ/و, ئ/ي birləşdirilir.
const AR_DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ࣓-ࣿ]/g
export function normalizeArabic(text) {
  return String(text || '')
    .replace(/﻿/g, '')
    .replace(AR_DIACRITICS, '')
    .replace(/[آأإٱٲٳ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/[^ء-ي\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Ayəni göstəriləcək sözlərə bölür. Yalnız işarədən ibarət hissələr
 * (məs. ayrıca yazılmış vəqf işarəsi) əvvəlki sözə birləşdirilir.
 */
export function splitAyahWords(text) {
  const out = []
  for (const tok of String(text || '').replace(/﻿/g, '').split(/\s+/)) {
    if (!tok) continue
    if (!normalizeArabic(tok) && out.length) out[out.length - 1] += ' ' + tok
    else if (normalizeArabic(tok)) out.push(tok)
  }
  return out
}

function levenshtein(a, b) {
  if (a === b) return 0
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[n]
}

/**
 * İki normallaşdırılmış söz "eyni" sayılırmı: tam bərabər və ya yazılış fərqi
 * kiçikdir (Osmani rəsmi ilə adi yazı arasında: الصلوة ~ الصلاة və s.).
 */
export function wordsMatch(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  // Əl-/وال- kimi bitişik ön şəkilçidə tanıyıcı bəzən boşluq qoyur — bunu
  // ayrıca sözlər birləşdirilərək yox, oxşarlıqla örtürük
  const d = levenshtein(a, b)
  const len = Math.max(a.length, b.length)
  return len <= 3 ? d === 0 || (len === 3 && d <= 1 && a[0] === b[0]) : d / len <= 0.34
}

/**
 * Ayə sözlərini tanınmış mətnlə müqayisə edir (ən uzun ortaq ardıcıllıq,
 * qeyri-dəqiq söz bərabərliyi ilə). Qaytarır:
 *   { words: [{ word, matched }], matched, total, extra, score (0..1) }
 * Bu, TƏXMİNİDİR və təcvidi qiymətləndirmir.
 */
export function compareRecitation(ayahText, recognized) {
  const words = splitAyahWords(ayahText)
  const ref = words.map(normalizeArabic)
  const hyp = normalizeArabic(recognized).split(' ').filter(Boolean)
  const m = ref.length, n = hyp.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = wordsMatch(ref[i], hyp[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const hit = new Array(m).fill(false)
  let i = 0, j = 0
  while (i < m && j < n) {
    if (wordsMatch(ref[i], hyp[j]) && dp[i][j] === dp[i + 1][j + 1] + 1) { hit[i] = true; i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  const matched = hit.filter(Boolean).length
  return {
    words: words.map((word, k) => ({ word, matched: hit[k] })),
    matched,
    total: m,
    extra: Math.max(0, n - matched),
    score: m ? matched / m : 0,
  }
}
