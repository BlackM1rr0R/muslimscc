// ═══════════════════════════════════════════════════════
// /calendar — Sünnə orucları izləyicisi (dizayn v3.2)
//
// • Qarşıdakı sünnə oruc günləri: bazar ertəsi / cümə axşamı (Tirmizi 747),
//   ağ günlər 13–15 (Tirmizi 761), Tasua və Aşura (Müslim 1134, 1162),
//   Ərəfə — hacı olmayan üçün (Müslim 1162), Şəvvalın altı günü (Müslim 1164).
//   Mənbələr data/lessons/sunnah-fasts.js dərsi ilə eynidir.
// • Göstərilmir: Ramazan (oruc fərzdir), bayram günləri və təşriq günləri
//   (oruc qadağandır), Zülhiccədə ağ günlər (13-ü təşriq günüdür — təqvimin
//   hadisə siyahısı ilə eyni qayda). Rəcəb və 15 Şaban orucu yoxdur — sabit deyil.
// • Qeydlər yalnız bu cihazda: localStorage 'muslim_cc_sunnah_fasts_v1'
//   ({ days: ['YYYY-MM-DD', …] }). Qəza orucu sayğacı /qada ilə eyni yaddaşdır
//   (utils/qada.js, 'muslim_cc_qada_v1').
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { isPlainClick } from '../PageLink'
import { pathFor } from '../../seo/routes'
import { haptic } from '../../hooks/useHaptic'
import { loadQada, saveQada, adjustOwed, makeUp, undoMakeUp, dayKey } from '../../utils/qada'
import { pickUi } from '../../utils/uiText'

export const SUNNAH_FASTS_KEY = 'muslim_cc_sunnah_fasts_v1'
const KEEP_DAYS = 800

const TX = {
  eyebrow: { az: 'Könüllü oruc', en: 'Voluntary fasting', ru: 'Добровольный пост', ar: 'صيام التطوع', tr: 'Nafile oruç' },
  title: { az: 'Sünnə orucları', en: 'Sunnah fasts', ru: 'Желательные посты', ar: 'صيام السنة', tr: 'Sünnet oruçlar' },
  lead: { az: 'Qarşıdakı sünnə oruc günləri, tutduğunuz orucların qeydi və Ramazan qəzası — hamısı bu cihazda saxlanılır.', en: 'Upcoming Sunnah fast days, a log of the fasts you keep and your Ramadan make-up days — all stored on this device.', ru: 'Ближайшие дни желательного поста, учёт ваших постов и восполнение Рамадана — всё хранится на этом устройстве.', ar: 'أيام صيام السنة القادمة، وسجلّ ما صمته، وقضاء رمضان — كل ذلك محفوظ على هذا الجهاز.', tr: 'Yaklaşan sünnet oruç günleri, tuttuğunuz oruçların kaydı ve Ramazan kazası — hepsi bu cihazda saklanır.' },
  today: { az: 'Bu gün', en: 'Today', ru: 'Сегодня', ar: 'اليوم', tr: 'Bugün' },
  todayIs: { az: 'Bu gün sünnə oruc günüdür', en: 'Today is a Sunnah fast day', ru: 'Сегодня день желательного поста', ar: 'اليوم من أيام صيام السنة', tr: 'Bugün sünnet oruç günüdür' },
  todayNot: { az: 'Bu gün xüsusi sünnə oruc günü deyil — könüllü oruc yenə tutula bilər.', en: 'Today is not a specific Sunnah fast day — a voluntary fast may still be kept.', ru: 'Сегодня нет особого желательного поста — но добровольный пост можно держать.', ar: 'ليس اليوم من الأيام المخصوصة، ويجوز صيام التطوع فيه.', tr: 'Bugün özel bir sünnet oruç günü değil — nafile oruç yine tutulabilir.' },
  todayRam: { az: 'Ramazan — oruc fərzdir.', en: 'Ramadan — fasting is obligatory.', ru: 'Рамадан — пост обязателен.', ar: 'رمضان — الصيام فريضة.', tr: 'Ramazan — oruç farzdır.' },
  todayHaram: { az: 'Bu gün oruc tutulmur (bayram və ya təşriq günü).', en: 'No fasting today (Eid or a day of Tashreeq).', ru: 'Сегодня не постятся (праздник или дни ташрика).', ar: 'لا يُصام اليوم (عيد أو أيام التشريق).', tr: 'Bugün oruç tutulmaz (bayram veya teşrik günü).' },
  logToday: { az: 'Bu gün oruc tuturam', en: 'I am fasting today', ru: 'Сегодня я пощусь', ar: 'أنا صائم اليوم', tr: 'Bugün oruçluyum' },
  logged: { az: 'Qeyd edildi', en: 'Logged', ru: 'Отмечено', ar: 'تم التسجيل', tr: 'Kaydedildi' },
  week: { az: 'Son 7 gün — toxunaraq qeyd edin', en: 'Last 7 days — tap to log', ru: 'Последние 7 дней — нажмите, чтобы отметить', ar: 'آخر 7 أيام — اضغط للتسجيل', tr: 'Son 7 gün — dokunarak kaydedin' },
  total: { az: 'cəmi oruc', en: 'fasts logged', ru: 'всего постов', ar: 'إجمالي الصيام', tr: 'toplam oruç' },
  month: { az: 'bu hicri ayda', en: 'this Hijri month', ru: 'в этом месяце хиджры', ar: 'هذا الشهر الهجري', tr: 'bu kameri ayda' },
  streak: { az: 'həftə ardıcıl', en: 'weeks in a row', ru: 'недель подряд', ar: 'أسابيع متتالية', tr: 'hafta üst üste' },
  shawwal: { az: 'Şəvvalın 6 günü', en: 'Six of Shawwal', ru: 'Шесть дней шавваля', ar: 'ست من شوال', tr: 'Şevval’in 6 günü' },
  upcoming: { az: 'Qarşıdakı sünnə oruc günləri', en: 'Upcoming Sunnah fast days', ru: 'Ближайшие дни желательного поста', ar: 'أيام صيام السنة القادمة', tr: 'Yaklaşan sünnet oruç günleri' },
  tomorrow: { az: 'sabah', en: 'tomorrow', ru: 'завтра', ar: 'غدًا', tr: 'yarın' },
  inDays: { az: '{n} gün sonra', en: 'in {n} days', ru: 'через {n} дн.', ar: 'بعد {n} يومًا', tr: '{n} gün kaldı' },
  qadaTitle: { az: 'Ramazan qəzası', en: 'Ramadan make-up fasts', ru: 'Восполнение постов Рамадана', ar: 'قضاء رمضان', tr: 'Ramazan kazası' },
  qadaLead: { az: 'Üzrlə tutulmayan Ramazan günləri sonra sayı qədər qəza edilir (Bəqərə 2:184).', en: 'Ramadan days missed for a valid excuse are made up later, day for day (al-Baqarah 2:184).', ru: 'Дни Рамадана, пропущенные по уважительной причине, восполняются позже — столько же дней (аль-Бакара 2:184).', ar: 'ما أُفطر من رمضان لعذر يُقضى بعدده من أيام أُخر (البقرة 2:184).', tr: 'Mazeretle tutulamayan Ramazan günleri sonra sayısınca kaza edilir (Bakara 2:184).' },
  owed: { az: 'qalan', en: 'left', ru: 'осталось', ar: 'متبقٍ', tr: 'kalan' },
  done: { az: 'qəza edildi', en: 'made up', ru: 'восполнено', ar: 'تم قضاؤه', tr: 'kaza edildi' },
  dec: { az: 'Azalt', en: 'Decrease', ru: 'Уменьшить', ar: 'إنقاص', tr: 'Azalt' },
  inc: { az: 'Artır', en: 'Increase', ru: 'Увеличить', ar: 'زيادة', tr: 'Artır' },
  madeOne: { az: 'Birini tutdum', en: 'I fasted one', ru: 'Восполнил один', ar: 'قضيتُ يومًا', tr: 'Birini tuttum' },
  undo: { az: 'Geri al', en: 'Undo', ru: 'Отменить', ar: 'تراجع', tr: 'Geri al' },
  openQada: { az: 'Qəza izləyicisini aç', en: 'Open the make-up tracker', ru: 'Открыть трекер восполнения', ar: 'افتح متتبّع القضاء', tr: 'Kaza takipçisini aç' },
  evidence: { az: 'Dəlillər', en: 'Evidence', ru: 'Доказательства', ar: 'الأدلة', tr: 'Deliller' },
  lesson: { az: 'Dərs: Sünnə orucları', en: 'Lesson: Sunnah fasts', ru: 'Урок: желательные посты', ar: 'درس: صيام التطوع', tr: 'Ders: Sünnet oruçlar' },
  note: { az: 'Hicri tarixlər Ümmül-Qura təqviminə görədir; yerli elan bir gün fərqlənə bilər. Rəcəb ayı və 15 Şaban üçün xüsusi oruc sabit deyil, ona görə burada yoxdur.', en: 'Hijri dates follow Umm al-Qura; local announcements may differ by a day. No special fast is established for Rajab or 15 Sha‘ban, so they are not listed.', ru: 'Даты хиджры — по Умм аль-Кура; местные объявления могут отличаться на день. Особый пост в раджаб и 15 шабана не установлен, поэтому их здесь нет.', ar: 'التواريخ الهجرية وفق أم القرى، وقد يختلف الإعلان المحلي بيوم. ولم يثبت صيام مخصوص لرجب ولا للنصف من شعبان، فلم يُذكرا.', tr: 'Hicri tarihler Ümmü’l-Kura’ya göredir; yerel duyuru bir gün farklı olabilir. Recep ayı ve 15 Şaban için özel oruç sabit değildir, bu yüzden burada yoktur.' },
}

// Səbəb nişanları + dəlil (dərsdəki mənbələrlə eyni)
const REASON = {
  mon: { az: 'Bazar ertəsi', en: 'Monday', ru: 'Понедельник', ar: 'الاثنين', tr: 'Pazartesi' },
  thu: { az: 'Cümə axşamı', en: 'Thursday', ru: 'Четверг', ar: 'الخميس', tr: 'Perşembe' },
  bid: { az: 'Ağ günlər', en: 'White days', ru: 'Белые дни', ar: 'الأيام البيض', tr: 'Beyaz günler' },
  tasua: { az: 'Tasua', en: 'Tasu‘a', ru: 'Тасуа', ar: 'تاسوعاء', tr: 'Tasua' },
  ashura: { az: 'Aşura', en: 'Ashura', ru: 'Ашура', ar: 'عاشوراء', tr: 'Aşure' },
  arafah: { az: 'Ərəfə günü', en: 'Day of Arafah', ru: 'День Арафа', ar: 'يوم عرفة', tr: 'Arefe günü' },
  shawwal: { az: 'Şəvvalın 6 günü', en: 'Six of Shawwal', ru: 'Шесть дней шавваля', ar: 'ست من شوال', tr: 'Şevval’in 6 günü' },
}
const MAJOR = new Set(['ashura', 'arafah'])
const EVIDENCE = [
  { k: 'monthu', t: { az: 'Bazar ertəsi və cümə axşamı — Tirmizi 747 (səhih, əl-Albani)', en: 'Monday and Thursday — at-Tirmidhi 747 (sahih, al-Albani)', ru: 'Понедельник и четверг — ат-Тирмизи 747 (достоверный, аль-Альбани)', ar: 'الاثنين والخميس — الترمذي 747 (صحيح، الألباني)', tr: 'Pazartesi ve perşembe — Tirmizî 747 (sahih, Elbânî)' } },
  { k: 'bid', t: { az: 'Ağ günlər (13–15) — Tirmizi 761 (həsən səhih, əl-Albani)', en: 'White days (13–15) — at-Tirmidhi 761 (hasan sahih, al-Albani)', ru: 'Белые дни (13–15) — ат-Тирмизи 761 (хороший достоверный, аль-Альбани)', ar: 'الأيام البيض (13–15) — الترمذي 761 (حسن صحيح، الألباني)', tr: 'Beyaz günler (13–15) — Tirmizî 761 (hasen sahih, Elbânî)' } },
  { k: 'ashura', t: { az: 'Aşura və Ərəfə — Müslim 1162; Tasua — Müslim 1134', en: 'Ashura and Arafah — Muslim 1162; Tasu‘a — Muslim 1134', ru: 'Ашура и Арафа — Муслим 1162; Тасуа — Муслим 1134', ar: 'عاشوراء وعرفة — مسلم 1162؛ تاسوعاء — مسلم 1134', tr: 'Aşure ve Arefe — Müslim 1162; Tasua — Müslim 1134' } },
  { k: 'shawwal', t: { az: 'Şəvvalın altı günü — Müslim 1164', en: 'Six days of Shawwal — Muslim 1164', ru: 'Шесть дней шавваля — Муслим 1164', ar: 'ست من شوال — مسلم 1164', tr: 'Şevval’in altı günü — Müslim 1164' } },
]

const AZ_WD_LONG = ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə']
const AZ_WD_SHORT = ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.']
const AZ_MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
// lang-ok: lokal kodları
const LOC = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }
const pick = (o, lang) => (o && (pickUi(o, lang, 'en'))) || ''
export function weekdayName(date, lang, style = 'long') {
  if (lang === 'az') return (style === 'short' ? AZ_WD_SHORT : AZ_WD_LONG)[date.getDay()]
  try { return date.toLocaleDateString(LOC[lang] || 'en-GB', { weekday: style }) } catch { return '' }
}
export function dayMonth(date, lang) {
  if (lang === 'az') return `${date.getDate()} ${AZ_MON[date.getMonth()]}`
  try { return date.toLocaleDateString(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long' }) } catch { return `${date.getDate()}.${date.getMonth() + 1}` }
}

/** Gün oruc baxımından: 'ramadan' | 'haram' | səbəblər massivi (boş ola bilər). Ay 1..12. */
export function fastStatus(h, date) {
  const { month: m, day: d } = h
  if (m === 9) return 'ramadan'
  if ((m === 10 && d === 1) || (m === 12 && d >= 10 && d <= 13)) return 'haram'
  const r = []
  if (m === 1 && d === 9) r.push('tasua')
  if (m === 1 && d === 10) r.push('ashura')
  if (m === 12 && d === 9) r.push('arafah')
  if (m === 10 && d >= 2) r.push('shawwal')
  if (d >= 13 && d <= 15 && m !== 12) r.push('bid')
  const wd = date.getDay()
  if (wd === 1) r.push('mon')
  if (wd === 4) r.push('thu')
  return r
}

function loadLog() {
  try {
    const raw = JSON.parse(localStorage.getItem(SUNNAH_FASTS_KEY))
    const days = Array.isArray(raw?.days) ? raw.days.filter(k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k)) : []
    return new Set(days)
  } catch { return new Set() }
}
function saveLog(set) {
  try {
    const days = [...set].sort().slice(-KEEP_DAYS)
    localStorage.setItem(SUNNAH_FASTS_KEY, JSON.stringify({ days }))
  } catch { /* yaddaş bağlıdır */ }
}
const keyToDate = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12) }
// Həftənin bazar ertəsi (yerli) — ardıcıl həftələr üçün
const weekStart = (date) => { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d) }

function safeQada() { try { return loadQada() } catch { return null } }

export default function CalSunnahFasts({ lang, hijriOf, monthNames }) {
  const navigate = useNavigate()
  const [log, setLog] = useState(loadLog)
  const [qada, setQada] = useState(safeQada)
  const now = new Date()
  const todayK = dayKey(now)

  const toggle = (k) => {
    haptic()
    setLog(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k); else next.add(k)
      saveLog(next)
      return next
    })
  }

  // Bu gündən 60 gün irəli + 6 gün geri (eyni hicri hesablama ilə)
  const days = useMemo(() => {
    const out = []
    for (let i = -6; i <= 60; i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12)
      const h = hijriOf(date)
      out.push({ i, date, key: dayKey(date), h, st: fastStatus(h, date) })
    }
    return out
  // 'now' hər render yenidir; gün dəyişəndə (todayK) yenidən hesablanır — qəsdən
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayK, hijriOf])
  const todayInfo = days.find(d => d.i === 0)
  const past7 = days.filter(d => d.i <= 0)
  const upcoming = days.filter(d => d.i > 0 && Array.isArray(d.st) && d.st.length).slice(0, 8)

  // Statistikalar
  const total = log.size
  const thisMonth = useMemo(() => {
    let n = 0
    const { year, month } = todayInfo.h
    for (const k of log) { const h = hijriOf(keyToDate(k)); if (h.year === year && h.month === month) n++ }
    return n
  }, [log, todayInfo, hijriOf])
  const shawwalDone = useMemo(() => {
    // Ən son (və ya cari) Şəvvalda qeyd olunan oruclar
    const y = todayInfo.h.month >= 10 ? todayInfo.h.year : todayInfo.h.year - 1
    let n = 0
    for (const k of log) { const h = hijriOf(keyToDate(k)); if (h.year === y && h.month === 10 && h.day >= 2) n++ }
    return Math.min(6, n)
  }, [log, todayInfo, hijriOf])
  const streak = useMemo(() => {
    const weeks = new Set([...log].map(k => weekStart(keyToDate(k))))
    const d = keyToDate(todayK)
    let cur = weekStart(d)
    if (!weeks.has(cur)) { const p = keyToDate(cur); p.setDate(p.getDate() - 7); cur = dayKey(p) }
    let n = 0
    while (weeks.has(cur)) { n++; const p = keyToDate(cur); p.setDate(p.getDate() - 7); cur = dayKey(p) }
    return n
  }, [log, todayK])

  const st = todayInfo.st
  const todayLogged = log.has(todayK)
  const reasonChips = (list) => list.map(r => (
    <span key={r} className={`ui-badge cal-sf-reason${MAJOR.has(r) ? ' ui-badge--accent' : ''}`}>{pick(REASON[r], lang)}</span>
  ))
  const inN = (n) => (n === 1 ? pick(TX.tomorrow, lang) : pick(TX.inDays, lang).replace('{n}', n))
  const hDate = (h) => `${h.day} ${monthNames[h.month - 1]}`

  // Qəza
  const fasts = qada?.fasts || { owed: 0, done: 0 }
  const upd = (fn) => setQada(prev => {
    if (!prev) return prev
    const next = fn(prev)
    try { saveQada(next) } catch { /* yaddaş bağlıdır */ }
    return next
  })
  const qadaHref = pathFor('qada', lang)
  const lessonHref = pathFor('learn', lang, 'sunnah-fasts')
  const go = (href) => (e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }

  return (
    <section className="ui-section ui-section--alt cal-sf" id="cal-fasts" aria-labelledby="cal-sf-title" data-testid="sunnah-fasts">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{pick(TX.eyebrow, lang)}</span>
          <h2 id="cal-sf-title" className="ui-title">{pick(TX.title, lang)}</h2>
          <p className="ui-lead">{pick(TX.lead, lang)}</p>
        </div>

        <div className="cal-sf__grid">
          {/* Bu gün + qeyd */}
          <div className="ui-card cal-sf__today" data-reveal="left">
            <div className="cal-sf__today-head">
              <span className="ui-icon-tile" aria-hidden="true"><Icon name="ramadan" /></span>
              <div className="cal-sf__today-txt">
                <span className="cal-sf__k">{pick(TX.today, lang)} · {weekdayName(now, lang)}</span>
                <b>{hDate(todayInfo.h)} · {dayMonth(now, lang)}</b>
              </div>
            </div>
            {st === 'ramadan' ? <p className="cal-sf__status">{pick(TX.todayRam, lang)}</p>
              : st === 'haram' ? <p className="cal-sf__status is-warn"><Icon name="alert" size={15} /> {pick(TX.todayHaram, lang)}</p>
              : st.length ? <div className="cal-sf__status is-yes"><Icon name="check" size={15} /> <span>{pick(TX.todayIs, lang)}</span><span className="cal-sf__chips">{reasonChips(st)}</span></div>
              : <p className="cal-sf__status">{pick(TX.todayNot, lang)}</p>}
            {st !== 'haram' && (
              <button type="button" className={`ui-btn ${todayLogged ? 'ui-btn--secondary' : 'ui-btn--primary'} cal-sf__log`}
                aria-pressed={todayLogged} onClick={() => toggle(todayK)} data-testid="sunnah-log-today">
                <Icon name={todayLogged ? 'check' : 'plus'} className="ui-btn__icon" /> {todayLogged ? pick(TX.logged, lang) : pick(TX.logToday, lang)}
              </button>
            )}
            <div className="cal-sf__week" role="group" aria-label={pick(TX.week, lang)}>
              <span className="cal-sf__k">{pick(TX.week, lang)}</span>
              <div className="cal-sf__week-row">
                {past7.map(d => {
                  const on = log.has(d.key)
                  const haram = d.st === 'haram'
                  const sun = Array.isArray(d.st) && d.st.length > 0
                  return (
                    <button key={d.key} type="button" disabled={haram}
                      className={`cal-sf__wd${on ? ' is-on' : ''}${sun ? ' is-sunnah' : ''}${d.i === 0 ? ' is-today' : ''}`}
                      aria-pressed={on} onClick={() => toggle(d.key)}
>
                      <span className="cal-sf__wd-n">{weekdayName(d.date, lang, 'short')}</span>
                      <span className="cal-sf__wd-d ui-num">{d.date.getDate()}</span>
                      <span className="ui-sr-only">{` — ${weekdayName(d.date, lang)}, ${dayMonth(d.date, lang)} — ${hDate(d.h)}${sun ? ' — ' + d.st.map(r => pick(REASON[r], lang)).join(', ') : ''}`}</span>
                      <span className="cal-sf__wd-ic" aria-hidden="true">{on ? <Icon name="check" size={12} /> : sun ? <span className="cal-sf__dot" /> : null}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <dl className="cal-sf__stats">
              <div><dd className="ui-num" data-testid="sunnah-total">{total}</dd><dt>{pick(TX.total, lang)}</dt></div>
              <div><dd className="ui-num">{thisMonth}</dd><dt>{pick(TX.month, lang)}</dt></div>
              <div><dd className="ui-num">{streak}</dd><dt>{pick(TX.streak, lang)}</dt></div>
              <div><dd className="ui-num">{shawwalDone}/6</dd><dt>{pick(TX.shawwal, lang)}</dt></div>
            </dl>
          </div>

          {/* Qarşıdakı günlər */}
          <div className="cal-sf__up" data-reveal="fade">
            <h3 className="cal-sf__h">{pick(TX.upcoming, lang)}</h3>
            <ol className="cal-sf__cards tm-cascade">
              {upcoming.map(d => (
                <li key={d.key} className={`ui-card cal-sf__card tm-shimmer${d.st.some(r => MAJOR.has(r)) ? ' is-major' : ''}`}>
                  <div className="cal-sf__date">
                    <span className="cal-sf__date-d ui-num">{d.date.getDate()}</span>
                    <span className="cal-sf__date-w">{weekdayName(d.date, lang, 'short')}</span>
                  </div>
                  <div className="cal-sf__card-body">
                    <span className="cal-sf__card-g">{dayMonth(d.date, lang)} · {hDate(d.h)}</span>
                    <span className="cal-sf__chips">{reasonChips(d.st)}</span>
                  </div>
                  <span className="cal-sf__in ui-num">{inN(d.i)}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Ramazan qəzası */}
          <div className="ui-card cal-sf__qada" data-testid="sunnah-qada">
            <h3 className="cal-sf__h"><Icon name="qada" size={18} /> {pick(TX.qadaTitle, lang)}</h3>
            <p className="cal-sf__muted">{pick(TX.qadaLead, lang)}</p>
            {qada ? (
              <>
                <div className="cal-sf__qrow">
                  <button type="button" className="ui-icon-btn" aria-label={`${pick(TX.dec, lang)}: ${pick(TX.qadaTitle, lang)}`}
                    disabled={!fasts.owed} onClick={() => upd(s => adjustOwed(s, 'fast', -1))}><Icon name="minus" /></button>
                  <div className="cal-sf__qnum">
                    <b className="ui-num" data-testid="qada-owed">{fasts.owed}</b>
                    <span>{pick(TX.owed, lang)} · <span className="ui-num">{fasts.done}</span> {pick(TX.done, lang)}</span>
                  </div>
                  <button type="button" className="ui-icon-btn" aria-label={`${pick(TX.inc, lang)}: ${pick(TX.qadaTitle, lang)}`}
                    onClick={() => upd(s => adjustOwed(s, 'fast', 1))}><Icon name="plus" /></button>
                </div>
                <div className="cal-sf__qact">
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={!fasts.owed}
                    onClick={() => { haptic(12); upd(s => makeUp(s, 'fast', todayK)) }}>
                    <Icon name="check" className="ui-btn__icon" /> {pick(TX.madeOne, lang)}
                  </button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={!(qada.log?.[todayK]?.f > 0)}
                    onClick={() => upd(s => undoMakeUp(s, 'fast', todayK))}>
                    <Icon name="refresh" className="ui-btn__icon" /> {pick(TX.undo, lang)}
                  </button>
                </div>
              </>
            ) : null}
            <a className="ui-link cal-sf__more" href={qadaHref} onClick={go(qadaHref)}>
              {pick(TX.openQada, lang)} <Icon name="arrow" size={14} className="ui-flip-rtl" />
            </a>
          </div>
        </div>

        <details className="ui-card ui-card--sunken cal-sf__ev">
          <summary><Icon name="info" size={15} /> {pick(TX.evidence, lang)} <Icon name="chevronDown" size={14} className="cal-sf__chev" /></summary>
          <ul>
            {EVIDENCE.map(e => <li key={e.k}>{pick(e.t, lang)}</li>)}
          </ul>
          <p className="cal-sf__muted">{pick(TX.note, lang)}</p>
          <a className="ui-chip" href={lessonHref} onClick={go(lessonHref)}><Icon name="learn" size={14} /> {pick(TX.lesson, lang)}</a>
        </details>
      </div>
    </section>
  )
}
