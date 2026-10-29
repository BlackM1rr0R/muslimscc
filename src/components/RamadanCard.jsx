// ═══════════════════════════════════════════════════════
// RamadanCard — Ramazan rejimi
//
// • Ramazanda (hicri 9-cu ay): bugünkü səhur (imsak) və iftar (məğrib),
//   növbəti hadisəyə canlı geri sayım, Ramazanın neçənci günü.
// • Şabanda (Ramazana ≤ 30 gün): sakit "Ramazana N gün qaldı" kartı.
// • Şəvvalın ilk 3 günü: "Bayramınız mübarək" kartı.
// • Qalan vaxt heç nə göstərmir (null).
//
// Vaxtlar istifadəçinin seçdiyi şəhər üçündür (usePrayerTimes + imsakiyyə
// utils/ramadan.js → aladhan hijriCalendar). Hicri tarix aladhan-dandır.
// Orucun niyyəti / iftar duası layihənin doğrulanmış dua məlumatında
// (data/duas.js) olmadığı üçün GÖSTƏRİLMİR — uydurma dini mətn yoxdur.
// Sınaq: ?ramadan=preview (&day=N) · ?ramadan=countdown · ?ramadan=eid
// ═══════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import usePrayerTimes from '../hooks/usePrayerTimes'
import Icon from './Icon'
import {
  parseRamadanMode, ramadanPhase, ramadanYearFor, loadRamadanCalendar, readCalendarCache,
  nextFastEvent, formatCountdown, fastProgress, ramadanDayLabel, daysUntilLabel,
  daysBetween, tzNow, COUNTDOWN_MAX_DAYS, normHijri,
} from '../utils/ramadan'
import '../styles/RamadanCard.css'

export const RC_TXT = {
  month:     { az: 'Ramazan', en: 'Ramadan', ru: 'Рамадан', ar: 'رمضان', tr: 'Ramazan' }, // lang-ok: ayın adı az və tr-də eyni yazılır
  greeting:  { az: 'Ramazan mübarək', en: 'Ramadan Mubarak', ru: 'Благословенного Рамадана', ar: 'رمضان مبارك', tr: 'Hayırlı Ramazanlar' },
  suhoor:    { az: 'Səhur', en: 'Suhoor', ru: 'Сухур', ar: 'السحور', tr: 'Sahur' },
  imsak:     { az: 'İmsak', en: 'Imsak', ru: 'Имсак', ar: 'الإمساك', tr: 'İmsak' },
  iftar:     { az: 'İftar', en: 'Iftar', ru: 'Ифтар', ar: 'الإفطار', tr: 'İftar' },
  maghrib:   { az: 'məğrib', en: 'Maghrib', ru: 'магриб', ar: 'المغرب', tr: 'akşam' },
  // {t} — geri sayım
  toIftar:   { az: 'İftara {t} qaldı', en: 'Iftar in {t}', ru: 'До ифтара {t}', ar: 'متبقٍ على الإفطار {t}', tr: 'İftara {t} kaldı' },
  toImsak:   { az: 'İmsaka {t} qaldı', en: 'Imsak in {t}', ru: 'До имсака {t}', ar: 'متبقٍ على الإمساك {t}', tr: 'İmsaka {t} kaldı' },
  tomorrow:  { az: 'sabah', en: 'tomorrow', ru: 'завтра', ar: 'غدًا', tr: 'yarın' },
  fastDay:   { az: 'Orucun gedişi', en: 'Fast progress', ru: 'Ход поста', ar: 'تقدم الصيام', tr: 'Orucun gidişi' },
  lastDone:  { az: 'Ramazanın son iftarı keçdi. Bayramınız mübarək!', en: 'The last iftar of Ramadan has passed. Eid Mubarak!', ru: 'Последний ифтар Рамадана позади. С праздником!', ar: 'انقضى آخر إفطار في رمضان. عيد مبارك!', tr: "Ramazan'ın son iftarı geçti. Bayramınız mübarek olsun!" },
  timetable: { az: 'İmsakiyyə cədvəli', en: 'Ramadan timetable', ru: 'Расписание на Рамадан', ar: 'إمساكية رمضان', tr: 'İmsakiye' },
  preview:   { az: 'Önizləmə', en: 'Preview', ru: 'Предпросмотр', ar: 'معاينة', tr: 'Önizleme' },
  calc:      { az: 'Vaxtlar şəhərin koordinatı ilə hesablanıb', en: 'Times are calculated from the city coordinates', ru: 'Время рассчитано по координатам города', ar: 'الأوقات محسوبة وفق إحداثيات المدينة', tr: 'Vakitler şehrin koordinatlarına göre hesaplanmıştır' },
  soonCap:   { az: 'Mübarək ay yaxınlaşır', en: 'The blessed month is near', ru: 'Благословенный месяц близко', ar: 'الشهر المبارك يقترب', tr: 'Mübarek ay yaklaşıyor' },
  soonText:  { az: 'Ramazanın 1-ci günü: {d}', en: 'First day of Ramadan: {d}', ru: 'Первый день Рамадана: {d}', ar: 'أول أيام رمضان: {d}', tr: "Ramazan'ın ilk günü: {d}" },
  eidCap:    { az: 'Ramazan bayramı', en: 'Eid al-Fitr', ru: 'Ураза-байрам', ar: 'عيد الفطر', tr: 'Ramazan Bayramı' },
  eidTitle:  { az: 'Bayramınız mübarək!', en: 'Eid Mubarak!', ru: 'С праздником Ураза-байрам!', ar: 'عيد مبارك!', tr: 'Bayramınız mübarek olsun!' },
  eidText:   { az: 'Bayram sevinci sizinlə və ailənizlə olsun.', en: 'May the joy of Eid stay with you and your family.', ru: 'Пусть радость праздника будет с вами и вашей семьёй.', ar: 'أعاده الله عليكم وعلى أهلكم بالخير والفرح.', tr: 'Bayram sevinci siz ve aileniz için daim olsun.' },
}

const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
const DATE_LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }

/** 'DD-MM-YYYY' → "8 fevral 2027" (Chrome-un ICU-sunda az lokalı yoxdur — əl ilə). */
export function formatGregorian(dateKey, lang, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const [d, m, y] = String(dateKey).split('-').map(Number)
  if (!d || !m || !y) return ''
  if (lang === 'az') return [opts.day && d, opts.month && AZ_MONTHS[m - 1], opts.year && y].filter(Boolean).join(' ')
  try {
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(DATE_LOCALES[lang] || 'en-GB', { ...opts, timeZone: 'UTC' })
  } catch { return `${d}.${m}.${y}` }
}

const pick = (o, lang) => o[lang] || o.en

/** Sınaq rejimi bir dəfə oxunur (SSR-də window yoxdur). */
function readPreview() {
  if (typeof window === 'undefined') return null
  return parseRamadanMode(window.location.search)
}

/**
 * Ramazan rejiminin bütün vəziyyəti (kart və /ramadan səhifəsi üçün ortaq).
 * opts.alwaysCalendar — səhifə imsakiyyəni Ramazandan kənar da göstərir.
 */
export function useRamadan({ alwaysCalendar = false } = {}) {
  const pt = usePrayerTimes()
  const loc = pt.location
  const [preview] = useState(readPreview)
  const phase = ramadanPhase(pt.hijri, preview)
  const year = ramadanYearFor(pt.hijri)
  const sig = `${year}|${loc.lat},${loc.lng},${loc.method}`

  // ── İmsakiyyə (bütöv Ramazan ayı) ──
  const needCal = !!year && (alwaysCalendar || phase.phase === 'ramadan' || phase.phase === 'before')
  const [cal, setCal] = useState(() => (year ? { sig, data: readCalendarCache(year, loc), error: null } : null))
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    if (!needCal) return undefined
    let alive = true
    const cached = readCalendarCache(year, loc)
    if (cached) { setCal({ sig, data: cached, error: null }); return undefined }
    setCal({ sig, data: null, error: null })
    loadRamadanCalendar(year, loc)
      .then(data => { if (alive) setCal({ sig, data, error: null }) })
      .catch(e => { if (alive) setCal({ sig, data: null, error: e?.name === 'AbortError' ? 'timeout' : 'network' }) })
    return () => { alive = false }
    // loc obyektinin özü yox, imzası izlənir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needCal, sig, reloadKey])
  const calendar = cal && cal.sig === sig ? cal.data : null
  const calError = cal && cal.sig === sig ? cal.error : null

  // ── Şəhərin saatı: Ramazanda hər saniyə (geri sayım), qalan vaxt dəqiqədə bir ──
  const [clock, setClock] = useState(() => tzNow(loc.tz))
  const fast = phase.phase === 'ramadan'
  useEffect(() => {
    setClock(tzNow(loc.tz))
    const id = setInterval(() => setClock(tzNow(loc.tz)), fast ? 1000 : 60000)
    return () => clearInterval(id)
  }, [loc.tz, fast])

  // ── Bugünkü (və sabahkı) oruc vaxtları ──
  const day = useMemo(() => {
    if (phase.phase !== 'ramadan') return null
    let idx = -1
    if (calendar) {
      idx = preview?.mode === 'preview'
        ? calendar.findIndex(e => e.day === phase.day)
        : calendar.findIndex(e => e.date === clock.dateKey)
      if (idx < 0 && preview?.mode === 'preview') idx = Math.min(calendar.length - 1, phase.day - 1)
    }
    const entry = idx >= 0 ? calendar[idx] : null
    // İmsakiyyə yoxdursa (şəbəkə) — bugünkü namaz vaxtları; imsak bilinmir
    const fromPrayers = () => {
      const o = {}
      for (const p of pt.prayers) o[p.key] = p.adhan
      return o.fajr ? { imsak: '', fajr: o.fajr, maghrib: o.maghrib } : null
    }
    const today = entry ? entry.times : (!preview && (calError || (calendar && idx < 0)) ? fromPrayers() : null)
    const tomorrow = entry ? (calendar[idx + 1]?.times || null) : (today && !preview ? today : null)
    return {
      number: entry?.day || phase.day,
      date: entry?.date || clock.dateKey,
      today,
      tomorrow,
      isLast: entry ? idx === calendar.length - 1 : false,
    }
  }, [phase.phase, phase.day, calendar, calError, clock.dateKey, preview, pt.prayers])

  const event = day?.today ? nextFastEvent(clock.secs, day.today, day.isLast ? null : day.tomorrow) : null
  const progress = day?.today ? fastProgress(clock.secs, day.today) : null

  // ── Ramazana neçə gün ──
  const firstDay = calendar?.[0]?.date || ''
  const daysLeft = firstDay ? daysBetween(clock.dateKey, firstDay) : null

  return {
    pt, loc, preview, phase, year, calendar, calError,
    calLoading: needCal && !calendar && !calError,
    reloadCalendar: () => setReloadKey(k => k + 1),
    clock, day, event, progress, firstDay, daysLeft,
    hijri: normHijri(pt.hijri),
  }
}

// ── Geri sayım: dəyişən rəqəm yenidən mount olur → yumşaq "düşmə" animasiyası ──
function Digits({ value }) {
  return (
    <span className="rc-digits ui-num" dir="ltr">
      {value.split('').map((ch, i) => (ch === ':'
        ? <span key={`c${i}`} className="rc-colon">:</span>
        : <span key={`${i}-${ch}`} className="rc-digit">{ch}</span>))}
    </span>
  )
}

/** "İftara {t} qaldı" — şablonu geri sayım elementi ilə böl. */
function Sentence({ tpl, children }) {
  const [a, b] = tpl.split('{t}')
  return <>{a}{children}{b}</>
}

/** İncə ay + ulduzlar (dekor). */
function Sky() {
  return (
    <svg className="rc-sky" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path className="rc-moon" d="M78 22a40 40 0 1 0 22 63 32 32 0 1 1-22-63z" />
      <path className="rc-star rc-star--1" d="M30 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      <path className="rc-star rc-star--2" d="M100 18l1.4 3.6 3.6 1.4-3.6 1.4L100 28l-1.4-3.6L95 23l3.6-1.4z" />
      <path className="rc-star rc-star--3" d="M18 70l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" />
    </svg>
  )
}

/**
 * Props:
 *   onOpenTimetable() — "İmsakiyyə cədvəli" düyməsi (yoxdursa düymə yoxdur)
 *   className         — yerləşdirən səhifənin əlavə sinfi
 *   state             — useRamadan() nəticəsi (səhifə özü çağırıbsa, təkrar yükləmə olmasın)
 */
export default function RamadanCard({ onOpenTimetable, className = '', state }) {
  const own = useRamadan()
  const s = state || own
  const { lang } = useLang()
  const { phase, loc, preview, day, event, progress, hijri, daysLeft, firstDay } = s
  const city = loc.city?.[lang] || loc.city?.en || ''
  const badge = preview ? <span className="ui-badge ui-badge--accent rc-badge">{pick(RC_TXT.preview, lang)}</span> : null
  const cls = (v) => `rc rc--${v} ui-enter-rise ${className}`.trim()

  // ── Ramazana N gün (yalnız son 30 gündə; önizləmədə həmişə) ──
  if (phase.phase === 'before') {
    if (daysLeft == null || daysLeft < 1 || (!preview && daysLeft > COUNTDOWN_MAX_DAYS)) return null
    return (
      <section className={cls('soon')} aria-labelledby="rc-soon-title" data-testid="ramadan-card" data-phase="before">
        <span className="ui-icon-tile ui-icon-tile--accent rc-soon-icon" aria-hidden="true"><Icon name="moon" /></span>
        <div className="rc-soon-body">
          <span className="ui-eyebrow">{pick(RC_TXT.soonCap, lang)}</span>
          <h2 className="rc-soon-title" id="rc-soon-title">{daysUntilLabel(daysLeft, lang)}</h2>
          <p className="rc-soon-text">{pick(RC_TXT.soonText, lang).replace('{d}', formatGregorian(firstDay, lang))}{city && ` · ${city}`}</p>
        </div>
        {badge}
        {onOpenTimetable && (
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm rc-soon-btn" onClick={onOpenTimetable}>
            <Icon name="calendar" className="ui-btn__icon" /> {pick(RC_TXT.timetable, lang)}
          </button>
        )}
      </section>
    )
  }

  // ── Bayram ──
  if (phase.phase === 'eid') {
    return (
      <section className={cls('eid')} aria-labelledby="rc-eid-title" data-testid="ramadan-card" data-phase="eid">
        <Sky />
        <div className="rc-body">
          <span className="rc-cap">{pick(RC_TXT.eidCap, lang)}</span>
          <h2 className="rc-title" id="rc-eid-title">{pick(RC_TXT.eidTitle, lang)}</h2>
          <p className="rc-sub">{pick(RC_TXT.eidText, lang)}</p>
          {lang !== 'ar' && <p className="rc-ar ui-arabic" lang="ar" aria-hidden="true">عِيد مُبَارَك</p>}
        </div>
        {badge}
      </section>
    )
  }

  if (phase.phase !== 'ramadan' || !day) return null

  // ── Ramazan ──
  const t = day.today
  const label = (k) => pick(RC_TXT[k], lang)
  const count = event ? formatCountdown(event.secsLeft) : ''
  return (
    <section className={cls('ramadan')} aria-labelledby="rc-title" data-testid="ramadan-card" data-phase="ramadan">
      <Sky />
      <div className="rc-body">
        <div className="rc-head">
          <span className="rc-cap">{label('greeting')}</span>
          {badge}
        </div>
        <h2 className="rc-title" id="rc-title">{ramadanDayLabel(day.number, lang)}</h2>
        <p className="rc-sub">
          {formatGregorian(day.date, lang)}
          {hijri && !preview && ` · ${day.number} ${label('month')} ${hijri.year}`}
          {city && ` · ${city}`}
        </p>

        {event ? (
          <p className="rc-count" data-testid="ramadan-countdown" data-kind={event.kind}>
            <Sentence tpl={label(event.kind === 'iftar' ? 'toIftar' : 'toImsak')}>
              <Digits value={count} />
            </Sentence>
            {event.tomorrow && <span className="rc-count-note"> ({label('tomorrow')})</span>}
          </p>
        ) : t ? (
          <p className="rc-count rc-count--done">{label('lastDone')}</p>
        ) : (
          <p className="rc-count"><span className="ui-skeleton ui-skeleton--text" style={{ '--w': '60%' }} /></p>
        )}

        {progress != null && (
          <div className="rc-bar" role="progressbar" aria-label={label('fastDay')}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <span style={{ transform: `scaleX(${progress.toFixed(4)})` }} />
          </div>
        )}

        <dl className="rc-times">
          <div className={`rc-time${event?.kind === 'imsak' ? ' is-next' : ''}`} data-testid="ramadan-suhoor">
            <dt><Icon name="moon" size={18} /> {label('suhoor')} <span className="rc-time-sub">({label('imsak')})</span></dt>
            <dd className="ui-num">{t ? (t.imsak || t.fajr) : '—'}</dd>
          </div>
          <div className={`rc-time${event?.kind === 'iftar' ? ' is-next' : ''}`} data-testid="ramadan-iftar">
            <dt><Icon name="sunset" size={18} /> {label('iftar')} <span className="rc-time-sub">({label('maghrib')})</span></dt>
            <dd className="ui-num">{t ? t.maghrib : '—'}</dd>
          </div>
        </dl>

        <div className="rc-foot">
          <span className="rc-note">{label('calc')}</span>
          {onOpenTimetable && (
            <button type="button" className="ui-btn ui-btn--inverse ui-btn--sm" onClick={onOpenTimetable}>
              <Icon name="calendar" className="ui-btn__icon" /> {label('timetable')}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
