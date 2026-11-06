// ═══════════════════════════════════════════════════════
// MoonPhase — bu gecənin ayı (utils/moonPhase — astronomik hesab)
//
//   <MoonPhase lang="az" size={44} />                 kiçik (yalnız şəkil + title)
//   <MoonPhase lang="az" size={160} detailed />       iri: ad, işıqlanma, yaş, növbəti bədr / təzə ay
// ═══════════════════════════════════════════════════════
import { memo, useId, useMemo } from 'react'
import { moonPhase, litPath } from '../utils/moonPhase'
import '../styles/MoonPhase.css'
import { pickUi } from '../utils/uiText'

const NAMES = {
  az: { new: 'Təzə ay', waxingCrescent: 'Hilal (böyüyən)', firstQuarter: 'İlk dördəbir', waxingGibbous: 'Böyüyən ay', full: 'Bədr (tam ay)', waningGibbous: 'Kiçilən ay', lastQuarter: 'Son dördəbir', waningCrescent: 'Hilal (kiçilən)' },
  en: { new: 'New moon', waxingCrescent: 'Waxing crescent', firstQuarter: 'First quarter', waxingGibbous: 'Waxing gibbous', full: 'Full moon', waningGibbous: 'Waning gibbous', lastQuarter: 'Last quarter', waningCrescent: 'Waning crescent' },
  ru: { new: 'Новолуние', waxingCrescent: 'Растущий серп', firstQuarter: 'Первая четверть', waxingGibbous: 'Растущая луна', full: 'Полнолуние', waningGibbous: 'Убывающая луна', lastQuarter: 'Последняя четверть', waningCrescent: 'Убывающий серп' },
  ar: { new: 'المحاق', waxingCrescent: 'هلال متزايد', firstQuarter: 'التربيع الأول', waxingGibbous: 'أحدب متزايد', full: 'البدر', waningGibbous: 'أحدب متناقص', lastQuarter: 'التربيع الأخير', waningCrescent: 'هلال متناقص' },
  tr: { new: 'Yeni ay', waxingCrescent: 'Hilal (büyüyen)', firstQuarter: 'İlk dördün', waxingGibbous: 'Büyüyen ay', full: 'Dolunay', waningGibbous: 'Küçülen ay', lastQuarter: 'Son dördün', waningCrescent: 'Hilal (küçülen)' },
}
const TXT = {
  az: { title: 'Bu gecənin ayı', lit: 'işıqlı', age: 'Ayın yaşı', days: 'gün', nextFull: 'Növbəti bədr', nextNew: 'Növbəti təzə ay', note: 'Astronomik hesabdır. Hicri ayın başlanğıcı hilalın görünməsi (ru’yət) ilə müəyyən olunur.' },
  en: { title: 'Tonight’s moon', lit: 'lit', age: 'Moon age', days: 'days', nextFull: 'Next full moon', nextNew: 'Next new moon', note: 'This is an astronomical calculation. The start of a Hijri month is set by sighting the crescent (ru’yah).' },
  ru: { title: 'Луна этой ночью', lit: 'освещено', age: 'Возраст луны', days: 'дн.', nextFull: 'Следующее полнолуние', nextNew: 'Следующее новолуние', note: 'Это астрономический расчёт. Начало месяца по хиджре определяется по наблюдению молодого месяца (ру’ят).' },
  ar: { title: 'قمر هذه الليلة', lit: 'مضاء', age: 'عمر القمر', days: 'يوم', nextFull: 'البدر القادم', nextNew: 'المحاق القادم', note: 'هذا حساب فلكي، وبداية الشهر الهجري تثبت برؤية الهلال.' },
  tr: { title: 'Bu gecenin ayı', lit: 'aydınlık', age: 'Ayın yaşı', days: 'gün', nextFull: 'Sonraki dolunay', nextNew: 'Sonraki yeni ay', note: 'Astronomik hesaptır. Hicri ayın başlangıcı hilalin görülmesiyle (rü’yet) belirlenir.' },
}
const LOCALE = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar', tr: 'tr-TR' }
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
const fmtDay = (d, lang) => (lang === 'az' ? `${d.getDate()} ${AZ_MONTHS[d.getMonth()]}` : d.toLocaleDateString(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'long' }))

function MoonPhase({ lang = 'az', size = 44, detailed = false, date }) {
  const gid = useId().replace(/:/g, '')
  const m = useMemo(() => moonPhase(date || new Date()), [date])
  const name = (pickUi(NAMES, lang))[m.key]
  const t = pickUi(TXT, lang)
  const { d, mirror } = litPath(m.phase, 50)
  const pct = Math.round(m.illumination * 100)
  const label = `${name} · ${pct}% ${t.lit}`
  const svg = (
    <svg className="mph__svg" viewBox="-60 -60 120 120" width={size} height={size} role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <radialGradient id={`${gid}-lit`} cx="38%" cy="35%" r="75%">
          <stop offset="0" stopColor="#fffbea" />
          <stop offset="0.6" stopColor="#f3e6b5" />
          <stop offset="1" stopColor="#d9c27e" />
        </radialGradient>
      </defs>
      <circle r="58" className="mph__halo" />
      <circle r="50" className="mph__dark" />
      <path d={d} fill={`url(#${gid}-lit)`} transform={mirror ? 'scale(-1 1)' : undefined} />
      {/* kraterlər — çox zərif */}
      <g className="mph__craters">
        <circle cx="-14" cy="-12" r="7" /><circle cx="16" cy="10" r="9" /><circle cx="-6" cy="22" r="5" /><circle cx="22" cy="-20" r="4" />
      </g>
    </svg>
  )
  if (!detailed) return <span className="mph mph--sm">{svg}</span>
  return (
    <section className="ui-card mph mph--lg" aria-labelledby={`${gid}-t`}>
      <div className="mph__art">{svg}</div>
      <div className="mph__body">
        <h2 id={`${gid}-t`} className="mph__title">{t.title}</h2>
        <p className="mph__name">{name}</p>
        <dl className="mph__facts">
          <div><dt>{t.lit}</dt><dd className="ui-num">{pct}%</dd></div>
          <div><dt>{t.age}</dt><dd><span className="ui-num">{m.age.toFixed(1)}</span> {t.days}</dd></div>
          <div><dt>{t.nextFull}</dt><dd>{fmtDay(m.nextFull, lang)}</dd></div>
          <div><dt>{t.nextNew}</dt><dd>{fmtDay(m.nextNew, lang)}</dd></div>
        </dl>
        <p className="mph__note">{t.note}</p>
      </div>
    </section>
  )
}

export default memo(MoonPhase)
