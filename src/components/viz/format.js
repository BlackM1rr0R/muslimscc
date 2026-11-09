// ═══════════════════════════════════════════════════════
// viz v2 — dilə görə rəqəm/tarix/nisbi vaxt formatı (Intl) və qrafiklərin
// öz kiçik yazıları (5 dildə; əlavə dillər pickUi lüğəti ilə).
//
//   const f = makeFormat('az')
//   f.num(1234.5) → "1 234,5"   f.compact(12500) → "12,5 min"   f.pct(12.3) → "12,3%"
//   f.date(d, { day:'numeric', month:'short' })   f.rel(Date.now() - 7*60e3) → "7 dəq. əvvəl"
//
// Ərəbcədə rəqəmlər latın (ar-u-nu-latn) — saytın qalan hissəsi kimi.
// Bəzi brauzerlərdə 'az' lokalı yoxdur (Chromium "Mon"/"M06" yazır) — az üçün
// ay/həftə günü adları və nisbi vaxt burada əl ilə verilir.
// ═══════════════════════════════════════════════════════
import { pickUi } from '../../utils/uiText'
import { relUnit } from './scale.js'

export const LOCALES = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar-u-nu-latn', tr: 'tr-TR' }
export const localeOf = (lang) => LOCALES[lang] || (typeof lang === 'string' && lang.length <= 3 ? lang : 'en-GB')
export const isRtlLang = (lang) => lang === 'ar' || lang === 'fa' || lang === 'ur' || lang === 'he'

const AZ_WD_SHORT = ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.']
const AZ_WD_LONG = ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə']
const AZ_MON_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek']
const AZ_MON_LONG = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']

/** az tarix formatı (Intl.DateTimeFormat-ın lazım olan alt çoxluğu) */
function azDate(d, o = {}) {
  const parts = []
  if (o.weekday) parts.push(o.weekday === 'long' ? AZ_WD_LONG[d.getDay()] : AZ_WD_SHORT[d.getDay()])
  const mon = o.month === 'long' ? AZ_MON_LONG[d.getMonth()] : o.month ? AZ_MON_SHORT[d.getMonth()] : ''
  const dm = [o.day ? d.getDate() : '', mon].filter(Boolean).join(' ')
  if (dm) parts.push(dm)
  if (o.year) parts.push(String(d.getFullYear()))
  let s = parts.join(o.weekday && dm ? ', ' : ' ')
  if (o.hour) s += `${s ? ', ' : ''}${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return s
}

const AZ_REL = {
  second: () => 'indicə',
  minute: (n) => `${n} dəq. əvvəl`, hour: (n) => `${n} saat əvvəl`,
  day: (n) => (n === 1 ? 'dünən' : `${n} gün əvvəl`), week: (n) => `${n} həftə əvvəl`,
  month: (n) => `${n} ay əvvəl`, year: (n) => `${n} il əvvəl`,
}

const nfCache = new Map()
function nf(locale, opts) {
  const k = locale + JSON.stringify(opts || {})
  if (!nfCache.has(k)) {
    try { nfCache.set(k, new Intl.NumberFormat(locale, opts)) } catch { nfCache.set(k, new Intl.NumberFormat('en-GB', opts)) }
  }
  return nfCache.get(k)
}

/** Dil üçün formatlayıcılar dəsti. */
export function makeFormat(lang = 'az') {
  const locale = localeOf(lang)
  // az: "2 961", "18,2" — brauzerdə az lokalı olmasa belə (ICU-suz Chromium en-ə düşür)
  const azNum = (v, opts) => nf('en-US', { maximumFractionDigits: 1, ...opts }).format(v).replace(/,/g, '\u00a0').replace('.', ',')
  const num = (v, opts) => (!Number.isFinite(v) ? '—' : lang === 'az' ? azNum(v, opts) : nf(locale, { maximumFractionDigits: 1, ...opts }).format(v))
  const compact = (v) => {
    if (!Number.isFinite(v)) return '—'
    if (Math.abs(v) < 10000) return num(v, { maximumFractionDigits: Math.abs(v) < 10 ? 1 : 0 })
    if (lang === 'az') {
      const a = Math.abs(v)
      const [d, s] = a >= 1e9 ? [1e9, ' mlrd'] : a >= 1e6 ? [1e6, ' mln'] : [1e3, ' min']
      return num(v / d, { maximumFractionDigits: 1 }) + s
    }
    return nf(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v)
  }
  const pct = (v, digits = 1) => {
    if (!Number.isFinite(v)) return '—'
    if (lang === 'az') return `${num(v, { maximumFractionDigits: digits })}%`
    return nf(locale, { style: 'percent', maximumFractionDigits: digits }).format(v / 100)
  }
  const date = (d, opts = { day: 'numeric', month: 'short' }) => {
    const dd = d instanceof Date ? d : new Date(d)
    if (Number.isNaN(+dd)) return ''
    if (lang === 'az') return azDate(dd, opts)
    try { return new Intl.DateTimeFormat(locale, opts).format(dd) } catch { return dd.toDateString() }
  }
  const rel = (then, now = Date.now(), o) => {
    const { value, unit } = relUnit(then, now, o)
    if (lang === 'az') {
      if (unit === 'day' && value === 0) return 'bu gün'
      if (value >= 0 && unit !== 'second') return date(new Date(+then), { day: 'numeric', month: 'short' })
      return AZ_REL[unit](Math.abs(value))
    }
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
      return unit === 'second' ? rtf.format(0, 'second') : rtf.format(value, unit)
    } catch { return date(new Date(+then)) }
  }
  return { lang, locale, rtl: isRtlLang(lang), num, compact, pct, date, rel }
}

// ── Qrafiklərin öz yazıları ──
const T = {
  az: { vs: 'əvvəlki dövrə görə', noData: 'Hələ məlumat yoxdur', total: 'Cəmi', prev: 'Əvvəlki dövr', now: 'İndi', remaining: 'Qalıb', pace: 'Temp', eta: 'Bitəcək', done: 'Tamamlandı', perDay: 'gündə', less: 'Az', more: 'Çox', keys: 'Ox düymələri ilə nöqtələri gəzin', ofStart: 'başlanğıcın', up: 'artıb', down: 'azalıb', same: 'dəyişməyib', share: 'Pay', value: 'Dəyər', date: 'Tarix', series: 'Seriya', current: 'Bu dövr', noPace: 'temp yoxdur', step: 'keçid' },
  en: { vs: 'vs previous period', noData: 'No data yet', total: 'Total', prev: 'Previous period', now: 'Now', remaining: 'Remaining', pace: 'Pace', eta: 'Finish by', done: 'Completed', perDay: 'per day', less: 'Less', more: 'More', keys: 'Use the arrow keys to move between points', ofStart: 'of start', up: 'up', down: 'down', same: 'unchanged', share: 'Share', value: 'Value', date: 'Date', series: 'Series', current: 'This period', noPace: 'no pace yet', step: 'step' },
  ru: { vs: 'к прошлому периоду', noData: 'Данных пока нет', total: 'Всего', prev: 'Прошлый период', now: 'Сейчас', remaining: 'Осталось', pace: 'Темп', eta: 'Завершение', done: 'Завершено', perDay: 'в день', less: 'Меньше', more: 'Больше', keys: 'Стрелками перемещайтесь между точками', ofStart: 'от начала', up: 'рост', down: 'снижение', same: 'без изменений', share: 'Доля', value: 'Значение', date: 'Дата', series: 'Ряд', current: 'Этот период', noPace: 'темпа пока нет', step: 'переход' },
  ar: { vs: 'مقارنة بالفترة السابقة', noData: 'لا بيانات بعد', total: 'المجموع', prev: 'الفترة السابقة', now: 'الآن', remaining: 'المتبقي', pace: 'الوتيرة', eta: 'الإتمام المتوقع', done: 'اكتمل', perDay: 'في اليوم', less: 'أقل', more: 'أكثر', keys: 'استخدم مفاتيح الأسهم للتنقل بين النقاط', ofStart: 'من البداية', up: 'ارتفاع', down: 'انخفاض', same: 'دون تغيير', share: 'النسبة', value: 'القيمة', date: 'التاريخ', series: 'السلسلة', current: 'هذه الفترة', noPace: 'لا وتيرة بعد', step: 'انتقال' },
  tr: { vs: 'önceki döneme göre', noData: 'Henüz veri yok', total: 'Toplam', prev: 'Önceki dönem', now: 'Şimdi', remaining: 'Kalan', pace: 'Tempo', eta: 'Bitiş', done: 'Tamamlandı', perDay: 'günde', less: 'Az', more: 'Çok', keys: 'Noktalar arasında ok tuşlarıyla gezinin', ofStart: 'başlangıcın', up: 'artış', down: 'düşüş', same: 'değişmedi', share: 'Pay', value: 'Değer', date: 'Tarih', series: 'Seri', current: 'Bu dönem', noPace: 'henüz tempo yok', step: 'geçiş' },
}
export const vizText = (lang) => pickUi(T, lang, 'en')
