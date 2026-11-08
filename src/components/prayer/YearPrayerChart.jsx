// ═══════════════════════════════════════════════════════
// YearPrayerChart (v5.6) — "İl boyu namaz vaxtları": seçilmiş şəhər üçün
// 365 günün sübh, günəş, zöhr, əsr, məğrib və işa vaxtları bir lentdə
//
//   <YearPrayerChart loc={location} lang="az" city="Bakı" />
//
// • Hesab yerli və şəbəkəsizdir (utils/prayCalc → computeTimes, Əbu Bəkr
//   məscidinin parametrləri — Azərbaycan üçün cədvəllə dəqiqəsinədək eyni).
//   Başqa ölkədə sübh/işa metod fərqinə görə bir neçə dəqiqə fərqlənə bilər —
//   qrafikin altında qeyd var, dəqiq vaxt yuxarıdakı cədvəldədir.
// • Zolaqlar: gecə (fon) · şəfəq (sübh→günəş) · gündüz (günəş→məğrib) ·
//   qürub (məğrib→işa); zöhr və əsr — xətlər. Yay saatı keçidi pillə kimi görünür.
// • Toxunuş / göstərici / ← → düymələri — günün vaxtları; "bu gün" xətti.
// • Ekrana girəndə lent soldan sağa "çəkilir" (clip-path, bir dəfə).
// Stillər: src/styles/YearPrayerChart.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { computeTimes, tzOffsetHours, CALC_METHODS, METHOD_ABUBAKR } from '../../utils/prayCalc'
import { PRAYER_NAMES } from '../../hooks/usePrayerTimes'
import { pickUi } from '../../utils/uiText'
import useMedia from '../../hooks/useMedia'
import '../../styles/YearPrayerChart.css'

const TXT = {
  az: { eyebrow: 'İl boyu', title: 'Namaz vaxtları il boyu necə dəyişir', lead: '{city} üçün ilin hər günü: şəfəq, gündüz və qürub zolaqları, zöhr və əsr xətləri. Toxunun və ya göstəricini aparın — həmin günün vaxtları görünür.', today: 'Bu gün', longest: 'Ən uzun gün', shortest: 'Ən qısa gün', earliestFajr: 'Ən erkən sübh', latestIsha: 'Ən gec işa', hours: (h, m) => `${h} saat ${m} dəq`, day: 'Gündüz', note: 'Qrafik yerli hesabdır (Əbu Bəkr məscidinin parametrləri). Başqa ölkədə sübh və işa bir neçə dəqiqə fərqlənə bilər — dəqiq vaxtlar yuxarıdakı cədvəldədir.', label: 'İl boyu namaz vaxtları qrafiki', dawn: 'Şəfəq', dusk: 'Qürub' },
  en: { eyebrow: 'All year', title: 'How prayer times change through the year', lead: 'Every day of the year for {city}: dawn, daylight and dusk bands, with Dhuhr and Asr lines. Tap or move the pointer to see that day’s times.', today: 'Today', longest: 'Longest day', shortest: 'Shortest day', earliestFajr: 'Earliest Fajr', latestIsha: 'Latest Isha', hours: (h, m) => `${h} h ${m} min`, day: 'Daylight', note: 'The chart is calculated locally (Abu Bakr Mosque parameters). In other countries Fajr and Isha may differ by a few minutes — exact times are in the table above.', label: 'Chart of prayer times through the year', dawn: 'Dawn', dusk: 'Dusk' },
  ru: { eyebrow: 'Весь год', title: 'Как меняются времена намаза в течение года', lead: 'Каждый день года для {city}: полосы рассвета, светового дня и сумерек, линии Зухра и Асра. Нажмите или ведите указателем — появятся времена этого дня.', today: 'Сегодня', longest: 'Самый длинный день', shortest: 'Самый короткий день', earliestFajr: 'Самый ранний Фаджр', latestIsha: 'Самый поздний Иша', hours: (h, m) => `${h} ч ${m} мин`, day: 'Световой день', note: 'График рассчитан локально (параметры мечети Абу Бакр). В других странах Фаджр и Иша могут отличаться на несколько минут — точные времена в таблице выше.', label: 'График времён намаза за год', dawn: 'Рассвет', dusk: 'Сумерки' },
  ar: { eyebrow: 'طوال العام', title: 'كيف تتغير مواقيت الصلاة خلال العام', lead: 'كل يوم من أيام السنة في {city}: أشرطة الفجر والنهار والشفق، مع خطَّي الظهر والعصر. المس أو حرّك المؤشر لترى مواقيت ذلك اليوم.', today: 'اليوم', longest: 'أطول نهار', shortest: 'أقصر نهار', earliestFajr: 'أبكر فجر', latestIsha: 'أخّر عشاء', hours: (h, m) => `${h} س ${m} د`, day: 'النهار', note: 'الرسم محسوب محليًا (معايير مسجد أبي بكر). في بلدان أخرى قد يختلف الفجر والعشاء ببضع دقائق — المواقيت الدقيقة في الجدول أعلاه.', label: 'رسم مواقيت الصلاة خلال العام', dawn: 'الفجر', dusk: 'الشفق' },
  tr: { eyebrow: 'Yıl boyu', title: 'Namaz vakitleri yıl boyunca nasıl değişir', lead: '{city} için yılın her günü: şafak, gündüz ve akşam kızıllığı bantları, öğle ve ikindi çizgileri. Dokunun veya imleci gezdirin — o günün vakitleri görünür.', today: 'Bugün', longest: 'En uzun gün', shortest: 'En kısa gün', earliestFajr: 'En erken sabah', latestIsha: 'En geç yatsı', hours: (h, m) => `${h} sa ${m} dk`, day: 'Gündüz', note: 'Grafik yerel olarak hesaplanır (Ebu Bekir Camii parametreleri). Diğer ülkelerde sabah ve yatsı birkaç dakika farklı olabilir — kesin vakitler yukarıdaki tablodadır.', label: 'Yıl boyu namaz vakitleri grafiği', dawn: 'Şafak', dusk: 'Akşam' },
}
// lang-ok: lokal kodları; az — əl ilə (brauzerlərin ICU-sunda az yoxdur)
const LOCALES = { en: 'en-GB', ru: 'ru-RU', ar: 'ar', tr: 'tr-TR' }
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
const AZ_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek']
const KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

const PR = 10, PT = 12, PB = 26
const toMin = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : NaN }
const hm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`

function yearDays(loc, year) {
  const out = []
  const start = Date.UTC(year, 0, 1)
  for (let i = 0; ; i++) {
    const d = new Date(start + i * 86400000)
    if (d.getUTCFullYear() !== year) break
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate()
    const tz = tzOffsetHours(loc.tz || 'Asia/Baku', y, m, day)
    const t = computeTimes({ year: y, month: m, day }, loc.lat, loc.lng, tz, CALC_METHODS.abubakr)
    const row = { i, m, day }
    for (const k of KEYS) row[k] = toMin(t[k])
    // İşa gecə yarısından sonradırsa (yüksək enlik, yay) — 24:00-dan o yana say
    if (row.isha < row.maghrib) row.isha += 1440
    out.push(row)
  }
  return out
}

export default function YearPrayerChart({ loc, lang = 'az', city = '' }) {
  const t = pickUi(TXT, lang, 'en')
  // Telefonda qrafik nisbətən hündür (ensiz ekranda lent nazik görünməsin)
  const narrow = useMedia('(max-width: 600px)', false)
  const W = narrow ? 400 : 720, H = narrow ? 380 : 340, PL = narrow ? 46 : 44
  const names = useMemo(() => Object.fromEntries(KEYS.map(k => [k, pickUi(PRAYER_NAMES[k], lang, 'en')])), [lang])
  const now = new Date()
  const year = now.getFullYear()
  const days = useMemo(() => (loc ? yearDays(loc, year) : []), [loc, year])
  const todayIdx = Math.min(days.length - 1, Math.floor((Date.UTC(year, now.getMonth(), now.getDate()) - Date.UTC(year, 0, 1)) / 86400000))
  const [sel, setSel] = useState(null)
  const [shown, setShown] = useState(false)
  const figRef = useRef(null)

  // Ekrana girəndə bir dəfə "çəkilmə" animasiyası
  useEffect(() => {
    const el = figRef.current
    if (!el || typeof IntersectionObserver !== 'function') { setShown(true); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const geo = useMemo(() => {
    if (!days.length) return null
    const lo = Math.max(0, Math.floor((Math.min(...days.map(d => d.fajr)) - 40) / 60) * 60)
    const hi = Math.min(1500, Math.ceil((Math.max(...days.map(d => d.isha)) + 40) / 60) * 60)
    const n = days.length
    const x = (i) => PL + (i / (n - 1)) * (W - PL - PR)
    const y = (min) => PT + ((min - lo) / (hi - lo)) * (H - PT - PB)
    const line = (k) => days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join('')
    const band = (a, b) => line(a) + days.slice().reverse().map((d, j) => `L${x(n - 1 - j).toFixed(1)},${y(d[b]).toFixed(1)}`).join('') + 'Z'
    const hours = []
    for (let m = lo; m <= hi; m += 120) hours.push(m)
    const months = []
    for (let i = 0; i < n; i++) if (days[i].day === 1) months.push({ i, m: days[i].m })
    // Statistika
    let longest = days[0], shortest = days[0], eFajr = days[0], lIsha = days[0]
    for (const d of days) {
      if (d.maghrib - d.sunrise > longest.maghrib - longest.sunrise) longest = d
      if (d.maghrib - d.sunrise < shortest.maghrib - shortest.sunrise) shortest = d
      if (d.fajr < eFajr.fajr) eFajr = d
      if (d.isha > lIsha.isha) lIsha = d
    }
    return { lo, hi, x, y, line, band, hours, months, longest, shortest, eFajr, lIsha, n }
  }, [days, W, H, PL])

  if (!geo) return null
  const loc0 = LOCALES[lang] || undefined
  const dateLabel = (d) => lang === 'az' ? `${d.day} ${AZ_MONTHS[d.m - 1]}`
    : new Date(Date.UTC(year, d.m - 1, d.day)).toLocaleDateString(loc0, { day: 'numeric', month: 'long', timeZone: 'UTC' })
  const monthLabel = (m) => lang === 'az' ? AZ_SHORT[m - 1]
    : new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString(loc0, { month: 'short', timeZone: 'UTC' })
  const dur = (min) => t.hours(Math.floor(min / 60), Math.round(min % 60))
  const cur = days[sel ?? todayIdx]
  const curX = geo.x(sel ?? todayIdx)

  const pick = (clientX) => {
    const r = figRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!r) return
    const vx = ((clientX - r.left) / r.width) * W
    const i = Math.round(((vx - PL) / (W - PL - PR)) * (geo.n - 1))
    setSel(Math.max(0, Math.min(geo.n - 1, i)))
  }
  const onKey = (e) => {
    const step = e.shiftKey ? 7 : 1
    if (e.key === 'ArrowRight') { e.preventDefault(); setSel(s => Math.min(geo.n - 1, (s ?? todayIdx) + step)) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setSel(s => Math.max(0, (s ?? todayIdx) - step)) }
    else if (e.key === 'Home') { e.preventDefault(); setSel(0) }
    else if (e.key === 'End') { e.preventDefault(); setSel(geo.n - 1) }
  }

  return (
    <div className="ui-card ypc" ref={figRef}>
      <div className="ypc-head">
        <span className="ui-eyebrow">{t.eyebrow}</span>
        <h2 className="ui-title ypc-title">{t.title}</h2>
        <p className="ui-lead ypc-lead">{t.lead.replace('{city}', city)}</p>
      </div>

      <div className="ypc-readout" aria-live="polite">
        <b className="ypc-date">{sel == null || sel === todayIdx ? `${t.today} · ` : ''}{dateLabel(cur)}</b>
        <ul className="ypc-times">
          {KEYS.map(k => (
            <li key={k} className={`ypc-t ypc-t--${k}`}><span>{names[k]}</span><b className="ui-num">{hm(cur[k])}</b></li>
          ))}
          <li className="ypc-t ypc-t--len"><span>{t.day}</span><b className="ui-num">{dur(cur.maghrib - cur.sunrise)}</b></li>
        </ul>
      </div>

      <div className="ypc-plot" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className={`ypc-svg${shown ? ' is-in' : ''}${narrow ? ' is-narrow' : ''}`} role="img" aria-label={t.label}
          tabIndex={0} onKeyDown={onKey}
          onPointerMove={(e) => pick(e.clientX)} onPointerDown={(e) => pick(e.clientX)}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') setSel(null) }}>
          <defs>
            <linearGradient id="ypc-day" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="ypc-stop-day1" />
              <stop offset="1" className="ypc-stop-day2" />
            </linearGradient>
          </defs>
          <rect className="ypc-night" x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} rx="8" />
          {geo.hours.map(m => (
            <g key={m} className="ypc-grid">
              <line x1={PL} x2={W - PR} y1={geo.y(m)} y2={geo.y(m)} />
              <text x={PL - 6} y={geo.y(m) + 4} textAnchor="end">{hm(m)}</text>
            </g>
          ))}
          <g className="ypc-bands">
            <path className="ypc-dawn" d={geo.band('fajr', 'sunrise')} />
            <path className="ypc-day" d={geo.band('sunrise', 'maghrib')} fill="url(#ypc-day)" />
            <path className="ypc-dusk" d={geo.band('maghrib', 'isha')} />
            <path className="ypc-line ypc-line--dhuhr" d={geo.line('dhuhr')} />
            <path className="ypc-line ypc-line--asr" d={geo.line('asr')} />
          </g>
          {geo.months.map(({ i, m }) => (
            <g key={m} className="ypc-month">
              <line x1={geo.x(i)} x2={geo.x(i)} y1={H - PB} y2={H - PB + 4} />
              {(!narrow || m % 2 === 1) && <text x={geo.x(i) + 3} y={H - 8}>{monthLabel(m)}</text>}
            </g>
          ))}
          <line className="ypc-today" x1={geo.x(todayIdx)} x2={geo.x(todayIdx)} y1={PT} y2={H - PB} />
          <g className="ypc-cursor" transform={`translate(${curX.toFixed(1)},0)`}>
            <line x1="0" x2="0" y1={PT} y2={H - PB} />
            {KEYS.map(k => <circle key={k} className={`ypc-dot ypc-dot--${k}`} cx="0" cy={geo.y(cur[k])} r="4" />)}
          </g>
        </svg>
        <ul className="ypc-legend" aria-hidden="true">
          <li><i className="ypc-sw ypc-sw--dawn" />{t.dawn}</li>
          <li><i className="ypc-sw ypc-sw--day" />{t.day}</li>
          <li><i className="ypc-sw ypc-sw--dusk" />{t.dusk}</li>
          <li><i className="ypc-sw ypc-sw--dhuhr" />{names.dhuhr}</li>
          <li><i className="ypc-sw ypc-sw--asr" />{names.asr}</li>
        </ul>
      </div>

      <ul className="ypc-stats">
        <li><span>{t.longest}</span><b>{dateLabel(geo.longest)}</b><small className="ui-num">{dur(geo.longest.maghrib - geo.longest.sunrise)}</small></li>
        <li><span>{t.shortest}</span><b>{dateLabel(geo.shortest)}</b><small className="ui-num">{dur(geo.shortest.maghrib - geo.shortest.sunrise)}</small></li>
        <li><span>{t.earliestFajr}</span><b>{dateLabel(geo.eFajr)}</b><small className="ui-num">{hm(geo.eFajr.fajr)}</small></li>
        <li><span>{t.latestIsha}</span><b>{dateLabel(geo.lIsha)}</b><small className="ui-num">{hm(geo.lIsha.isha)}</small></li>
      </ul>
      {Number(loc?.method) !== METHOD_ABUBAKR && <p className="ypc-note">{t.note}</p>}
    </div>
  )
}
