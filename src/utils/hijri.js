// ═══════════════════════════════════════════════════════
// Hicri ↔ miladi çevirmə — saf köməkçilər (/hijri-converter, testlər)
//
// Miladi → hicri: brauzerin Intl Ümmül-Qura təqvimi ('islamic-umalqura',
// /calendar, /jamaat və /prayer ilə eyni mənbə). Bütün hesablar UTC günorta
// ilə aparılır — saat qurşağı və yay vaxtı günü sürüşdürmür.
// Hicri → miladi: cədvəlli (arifmetik) təqvimlə təxmin, sonra təxminin
// ±5 günü Intl ilə yoxlanılır — dəqiq uyğun gün tapılmasa, belə tarix yoxdur
// (məs. 29 günlük ayın 30-u).
// Intl Ümmül-Qura dəstəkləmirsə (köhnə brauzer) hər iki istiqamət
// arifmetik təqvimə düşür; isApproximate() bunu bildirir.
//
// Qeyd: Ümmül-Qura hesablanmış təqvimdir. Ay başlanğıcı şəriətdə hilalın
// görülməsi ilə müəyyən olunur — "Onu (hilalı) görəndə oruc tutun, onu
// görəndə orucu açın" (Buxari 1909, Muslim 1081) — ona görə yerli elan bir
// gün fərqlənə bilər.
// ═══════════════════════════════════════════════════════

export const UMQ_MIN_YEAR = 1300   // ICU-nun Ümmül-Qura cədvəlinin hüdudları;
export const UMQ_MAX_YEAR = 1600   // bunlardan kənarda Intl özü də arifmetikdir
export const MIN_G_YEAR = 622
export const MAX_G_YEAR = 2400
export const MIN_H_YEAR = 1
export const MAX_H_YEAR = 1850

const DAY = 86400000

/** UTC günorta (il < 100 üçün də düzgün) */
export function utcNoon(y, m, d) {
  const dt = new Date(Date.UTC(2000, 0, 1, 12))
  dt.setUTCFullYear(y, m - 1, d)
  return dt
}

const pad = (n, w = 2) => String(n).padStart(w, '0')
/** { year, month, day } → 'YYYY-MM-DD' */
export const gKey = ({ year, month, day }) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`
/** 'YYYY-MM-DD' → { year, month, day } | null */
export function parseGKey(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''))
  if (!m) return null
  const g = { year: +m[1], month: +m[2], day: +m[3] }
  return isValidGregorian(g) ? g : null
}

export function gDaysInMonth(year, month) {
  return utcNoon(year, month + 1, 0).getUTCDate()
}
export function isValidGregorian(g) {
  if (!g) return false
  const { year, month, day } = g
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
    && year >= MIN_G_YEAR && year <= MAX_G_YEAR && month >= 1 && month <= 12
    && day >= 1 && day <= gDaysInMonth(year, month)
}

/** Date → { year, month, day } (yerli təqvim günü) */
export const fromLocalDate = (d) => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() })

/** 0 = bazar, 1 = bazar ertəsi … 6 = şənbə */
export const weekdayOf = (g) => utcNoon(g.year, g.month, g.day).getUTCDay()

export function addGDays(g, n) {
  const d = utcNoon(g.year, g.month, g.day)
  d.setTime(d.getTime() + n * DAY)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}
export const gDiffDays = (a, b) =>
  Math.round((utcNoon(b.year, b.month, b.day) - utcNoon(a.year, a.month, a.day)) / DAY)

// ── Arifmetik (cədvəlli) hicri təqvim — ehtiyat və təxmin üçün ──
const ISLAMIC_EPOCH = 1948439.5   // 1 Məhərrəm 1 (civil), Julian günü
function gToJd(y, m, d) {
  return Math.floor(utcNoon(y, m, d).getTime() / DAY) + 2440587.5
}
function jdToG(jd) {
  const d = new Date(Math.round((jd - 2440587.5) * DAY) + 12 * 3600000)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}
function hToJdCivil(y, m, d) {
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + ISLAMIC_EPOCH - 1
}
export function gregorianToHijriCivil(g) {
  const jd = Math.floor(gToJd(g.year, g.month, g.day)) + 0.5
  const year = Math.floor((30 * (jd - ISLAMIC_EPOCH) + 10646) / 10631)
  const month = Math.min(12, Math.ceil((jd - (29 + hToJdCivil(year, 1, 1))) / 29.5) + 1)
  const day = jd - hToJdCivil(year, month, 1) + 1
  return { year, month, day: Math.round(day) }
}
export const hijriToGregorianCivil = (h) => jdToG(hToJdCivil(h.year, h.month, h.day))

// ── Intl Ümmül-Qura ──
let fmt = null
let fmtTried = false
function umqFormatter() {
  if (fmtTried) return fmt
  fmtTried = true
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric',
    })
    if (String(f.resolvedOptions().calendar || '').startsWith('islamic')) fmt = f
  } catch { fmt = null }
  return fmt
}
/** Brauzer Ümmül-Qura təqvimini dəstəkləyirmi */
export const hasUmmAlQura = () => !!umqFormatter()

/** Miladi { year, month, day } → hicri { year, month, day } */
export function gregorianToHijri(g) {
  const f = umqFormatter()
  if (f) {
    try {
      const parts = f.formatToParts(utcNoon(g.year, g.month, g.day))
      const num = (t) => Number(parts.find(p => p.type === t)?.value)
      const h = { year: num('year'), month: num('month'), day: num('day') }
      if (h.month >= 1 && h.month <= 12 && h.day >= 1 && h.day <= 30 && h.year >= 1) return h
    } catch { /* aşağıdakı ehtiyat */ }
  }
  return gregorianToHijriCivil(g)
}

export function isValidHijriShape(h) {
  return !!h && Number.isInteger(h.year) && Number.isInteger(h.month) && Number.isInteger(h.day)
    && h.year >= MIN_H_YEAR && h.year <= MAX_H_YEAR && h.month >= 1 && h.month <= 12 && h.day >= 1 && h.day <= 30
}

/**
 * Hicri { year, month, day } → miladi { year, month, day } | null
 * (null — belə gün yoxdur, məs. 29 günlük ayın 30-u, və ya hüduddan kənar)
 */
export function hijriToGregorian(h) {
  if (!isValidHijriShape(h)) return null
  const est = hijriToGregorianCivil(h)
  if (!hasUmmAlQura()) return h.day === 30 && hijriMonthLengthCivil(h.year, h.month) < 30 ? null : est
  for (const off of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) {
    const g = addGDays(est, off)
    const x = gregorianToHijri(g)
    if (x.year === h.year && x.month === h.month && x.day === h.day) return isValidGregorian(g) ? g : null
  }
  return null
}

function hijriMonthLengthCivil(y, m) {
  return Math.round(hToJdCivil(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) - hToJdCivil(y, m, 1))
}

/** Hicri ayın gün sayı (29 və ya 30) */
export function hijriMonthLength(year, month) {
  return hijriToGregorian({ year, month, day: 30 }) ? 30 : 29
}

/** Çevirmə nəticəsi təxminidirmi (Ümmül-Qura cədvəli xaricində və ya Intl yoxdur) */
export const isApproximate = (hYear) => !hasUmmAlQura() || hYear < UMQ_MIN_YEAR || hYear > UMQ_MAX_YEAR

/** Bir hicri ay əvvəl/sonra: { year, month } */
export function shiftHijriMonth({ year, month }, n) {
  const idx = year * 12 + (month - 1) + n
  return { year: Math.floor(idx / 12), month: (idx % 12 + 12) % 12 + 1 }
}

/**
 * Hicri ayın şəbəkəsi: həftələr (7 xana; boş xana — null).
 * firstDow: həftənin ilk günü (1 = bazar ertəsi, 0 = bazar, 6 = şənbə).
 * Hər xana: { hDay, g: {year,month,day}, dow }
 */
export function hijriMonthGrid(year, month, firstDow = 1) {
  const start = hijriToGregorian({ year, month, day: 1 })
  if (!start) return { days: [], weeks: [], length: 0, start: null, end: null }
  const length = hijriMonthLength(year, month)
  const days = []
  for (let i = 0; i < length; i++) {
    const g = addGDays(start, i)
    days.push({ hDay: i + 1, g, dow: weekdayOf(g) })
  }
  const lead = (days[0].dow - firstDow + 7) % 7
  const cells = [...Array(lead).fill(null), ...days]
  while (cells.length % 7) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return { days, weeks, length, start, end: days[days.length - 1].g }
}

/** İki miladi tarix arasında (hər ikisi daxil) neçə gün Ramazana düşür */
export function countRamadanDays(from, to, cap = 40000) {
  if (!from || !to) return 0
  let a = from, b = to
  if (gDiffDays(a, b) < 0) [a, b] = [b, a]
  let n = 0, i = 0
  // Ay-ay irəlilə: hər Ramazanın uzunluğunu bir dəfə hesabla (gün-gün yox)
  let h = gregorianToHijri(a)
  let cur = { year: h.year, month: h.month }
  while (i++ < cap / 29) {
    if (cur.month === 9) {
      const s = hijriToGregorian({ year: cur.year, month: 9, day: 1 })
      if (s) {
        const len = hijriMonthLength(cur.year, 9)
        const e = addGDays(s, len - 1)
        const lo = gDiffDays(a, s) > 0 ? s : a
        const hi = gDiffDays(e, b) > 0 ? e : b
        const d = gDiffDays(lo, hi) + 1
        if (d > 0) n += d
      }
    }
    cur = shiftHijriMonth(cur, 1)
    const first = hijriToGregorian({ year: cur.year, month: cur.month, day: 1 })
    if (!first || gDiffDays(first, b) < 0) break
  }
  return n
}

// ═══ Adlar (5 dil) ═══
export const HIJRI_MONTHS_AR = ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الآخِر', 'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة']

export const HIJRI_MONTHS = {
  az: ['Məhərrəm', 'Səfər', 'Rəbiül-əvvəl', 'Rəbiül-axır', 'Cəmadiyəl-ula', 'Cəmadiyəl-axirə', 'Rəcəb', 'Şaban', 'Ramazan', 'Şəvval', 'Zülqədə', 'Zülhiccə'],
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Akhir', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul-Qadah', 'Dhul-Hijjah'],
  ru: ['Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби аль-ахир', 'Джумада аль-уля', 'Джумада аль-ахира', 'Раджаб', 'Шабан', 'Рамадан', 'Шавваль', 'Зуль-када', 'Зуль-хиджа'],
  ar: HIJRI_MONTHS_AR,
  tr: ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'],
}

// Elmi transliterasiya (bütün dillərdə eyni — ərəb adının oxunuşu)
export const HIJRI_MONTHS_TRANSLIT = ['Muḥarram', 'Ṣafar', 'Rabīʿ al-Awwal', 'Rabīʿ al-Ākhir', 'Jumādā al-Ūlā', 'Jumādā al-Ākhirah', 'Rajab', 'Shaʿbān', 'Ramaḍān', 'Shawwāl', 'Dhū al-Qaʿdah', 'Dhū al-Ḥijjah']

// Həftə günləri: 0 = bazar … 6 = şənbə
export const WEEKDAYS = {
  az: ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  tr: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
}
export const WEEKDAYS_SHORT = {
  az: ['B', 'Be', 'Ça', 'Ç', 'Ca', 'C', 'Ş'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  ar: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
}

// Miladi aylar — tarix içində (rusca yiyəlik halda: "18 февраля")
export const G_MONTHS = {
  az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
}
export const G_MONTHS_SHORT = {
  az: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sent', 'okt', 'noy', 'dek'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
}

export const HIJRI_SUFFIX = { az: 'h.', en: 'AH', ru: 'г. х.', ar: 'هـ', tr: 'h.' }
// Miladi il şəkilçisi yalnız rus və ərəb dillərində
const G_SUFFIX_RU = 'г.'
const G_SUFFIX_AR = 'م'

const pick = (obj, lang) => obj[lang] || obj.en

export function formatHijri(h, lang = 'en') {
  return `${h.day} ${pick(HIJRI_MONTHS, lang)[h.month - 1]} ${h.year} ${pick(HIJRI_SUFFIX, lang)}`.trim()
}
export function formatGregorian(g, lang = 'en') {
  return `${g.day} ${pick(G_MONTHS, lang)[g.month - 1]} ${g.year} ${lang === 'ru' ? G_SUFFIX_RU : lang === 'ar' ? G_SUFFIX_AR : ''}`.trim()
}
export const weekdayName = (g, lang = 'en') => pick(WEEKDAYS, lang)[weekdayOf(g)]
