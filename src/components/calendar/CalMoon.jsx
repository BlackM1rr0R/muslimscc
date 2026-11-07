// ═══════════════════════════════════════════════════════
// Təqvimdə ay (v5.3) — hər günün axşamının ayı, ağ günlər, hilal təxmini
//
//   <CalDayMoon date={Date} />                 — xanada kiçik ay (aria-hidden)
//   <CalCrescent days={[{day,date}]} lang />   — ayın başında hilal nə vaxt görünə bilər
//   <CalMoonNote date lang />                  — seçilmiş günün paneli: faza + işıqlanma
//
// Hesab astronomikdir (utils/moonPhase, orta hərəkət, ±0.5 gün). Hicri ayın
// başlanğıcı hilalın GÖRÜNMƏSİ (ru'yət) ilə müəyyən olunur — bu hesab yalnız
// təxmindir, mətn bunu açıq deyir. Stillər: CalendarPage.css (§ Ay).
// ═══════════════════════════════════════════════════════
import { memo, useMemo } from 'react'
import { moonPhase, litPath } from '../../utils/moonPhase'
import { pickUi } from '../../utils/uiText'

// Günün axşamı (19:00 yerli) — ay o vaxt görünür
const evening = (d) => { const x = new Date(d); x.setHours(19, 0, 0, 0); return x }

const TX = {
  az: { crescent: (d) => `Hilal təxminən ${d} axşamı görünə bilər`, note: 'Astronomik təxmindir — ay hilalın görünməsi (ru’yət) ilə başlayır.', lit: 'işıqlı', bid: 'Ağ günlər — ay dolğundur, sünnə orucu' },
  en: { crescent: (d) => `The crescent may be visible on the evening of ${d}`, note: 'An astronomical estimate — the month begins with sighting the crescent (ru’yah).', lit: 'lit', bid: 'White days — the moon is full, sunnah fast' },
  ru: { crescent: (d) => `Молодой месяц, вероятно, будет виден вечером ${d}`, note: 'Астрономическая оценка — месяц начинается с наблюдения молодого месяца (ру’ят).', lit: 'освещено', bid: 'Белые дни — луна полная, желательный пост' },
  ar: { crescent: (d) => `قد يُرى الهلال مساء ${d}`, note: 'تقدير فلكي، والشهر يبدأ برؤية الهلال.', lit: 'مضاء', bid: 'الأيام البيض — القمر بدر، صيامها سنة' },
  tr: { crescent: (d) => `Hilal tahminen ${d} akşamı görülebilir`, note: 'Astronomik tahmindir — ay, hilalin görülmesiyle (rü’yet) başlar.', lit: 'aydınlık', bid: 'Beyaz günler — ay dolunay, sünnet oruç' },
}
const LOCALE = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar', tr: 'tr-TR' }
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
const fmtDay = (d, lang) => (lang === 'az' ? `${d.getDate()} ${AZ_MONTHS[d.getMonth()]}`
  : d.toLocaleDateString(LOCALE[lang] || lang || 'en-GB', { day: 'numeric', month: 'long' }))

function MoonSvg({ phase, size }) {
  const { d, mirror } = litPath(phase, 50)
  return (
    <svg className="cal-moon__svg" viewBox="-54 -54 108 108" width={size} height={size} aria-hidden="true" focusable="false">
      <circle r="50" className="cal-moon__dark" />
      <path d={d} className="cal-moon__lit" transform={mirror ? 'scale(-1 1)' : undefined} />
    </svg>
  )
}

/** Xanada kiçik ay — günün axşamının fazası */
export const CalDayMoon = memo(function CalDayMoon({ date, size = 13 }) {
  const m = useMemo(() => moonPhase(evening(date)), [date])
  return <span className="cal-moon" aria-hidden="true"><MoonSvg phase={m.phase} size={size} /></span>
})

/**
 * Ayın əvvəlində hilalın ilk görünə biləcəyi axşam: birləşmədən (təzə ay)
 * sonrakı ilk axşam ki, ayın yaşı ≥ ~18 saat və ≤ 2.5 gündür.
 */
export function crescentEvening(days) {
  if (!days?.length) return null
  const first = days[0].date
  for (let k = -3; k <= 1; k++) {
    const d = new Date(first); d.setDate(d.getDate() + k)
    const age = moonPhase(evening(d)).age
    if (age >= 0.75 && age <= 2.5) return d
  }
  return null
}

export function CalCrescent({ days, lang }) {
  const t = pickUi(TX, lang, 'en')
  const d = useMemo(() => crescentEvening(days), [days])
  if (!d) return null
  const m = moonPhase(evening(d))
  return (
    <p className="cal-crescent" title={t.note}>
      <span className="cal-crescent__moon"><MoonSvg phase={m.phase} size={22} /></span>
      <span className="cal-crescent__text">{t.crescent(fmtDay(d, lang))}<span className="cal-crescent__note">{t.note}</span></span>
    </p>
  )
}

/** Seçilmiş günün paneli üçün: iri ay + faza adı (MoonPhase adları) + işıqlanma */
export function CalMoonNote({ date, lang, name, isBid }) {
  const t = pickUi(TX, lang, 'en')
  const m = useMemo(() => moonPhase(evening(date)), [date])
  return (
    <div className={`cal-moonnote${isBid ? ' is-bid' : ''}`}>
      <MoonSvg phase={m.phase} size={36} />
      <span className="cal-moonnote__body">
        <span className="cal-moonnote__name">{name(m.key)}</span>
        <span className="cal-moonnote__lit ui-num">{Math.round(m.illumination * 100)}% {t.lit}</span>
        {isBid && <span className="cal-moonnote__bid">{t.bid}</span>}
      </span>
    </div>
  )
}
