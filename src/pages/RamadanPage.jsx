// ═══════════════════════════════════════════════════════
// /ramadan — İmsakiyyə: seçilmiş şəhər üçün bütöv Ramazan ayının cədvəli
//
// • Mənbə: aladhan.com /v1/hijriCalendar/{hicri il}/9 (utils/ramadan.js) —
//   imsak, sübh, günəş, zöhr, əsr, iftar (məğrib), işa. Ramazandan kənar
//   gələn Ramazanın cədvəli göstərilir.
// • Bu gün vurğulanır; "Cədvəli çap et" → sadə qara-ağ cədvəl (@media print).
// • Yuxarıda RamadanCard (Ramazanda geri sayım; ?ramadan=preview — sınaq).
// ═══════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { navGroupLabel } from '../data/navigation'
import { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import RamadanCard, { useRamadan, formatGregorian, RC_TXT } from '../components/RamadanCard'
import CityPicker from '../components/CityPicker'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { weekdayOf } from '../utils/ramadan'
import '../styles/RamadanPage.css'

const TXT = {
  title:   { az: 'İmsakiyyə', en: 'Ramadan timetable', ru: 'Расписание на Рамадан', ar: 'إمساكية رمضان', tr: 'İmsakiye' },
  lead:    { az: 'Seçdiyiniz şəhər üçün Ramazan ayının bütün günləri: səhurun sonu (imsak), namaz vaxtları və iftar.', en: 'Every day of Ramadan for your chosen city: the end of suhoor (imsak), prayer times and iftar.', ru: 'Все дни Рамадана для выбранного города: окончание сухура (имсак), время намазов и ифтар.', ar: 'جميع أيام رمضان في المدينة التي تختارها: وقت الإمساك ومواقيت الصلاة والإفطار.', tr: 'Seçtiğiniz şehir için Ramazan ayının tüm günleri: imsak, namaz vakitleri ve iftar.' },
  tableOf: { az: 'Ramazan {y} imsakiyyəsi', en: 'Ramadan {y} timetable', ru: 'Расписание Рамадана {y}', ar: 'إمساكية رمضان {y}', tr: 'Ramazan {y} imsakiyesi' },
  print:   { az: 'Cədvəli çap et', en: 'Print the timetable', ru: 'Распечатать', ar: 'طباعة الجدول', tr: 'Tabloyu yazdır' },
  day:     { az: 'Gün', en: 'Day', ru: 'День', ar: 'اليوم', tr: 'Gün' },
  date:    { az: 'Tarix', en: 'Date', ru: 'Дата', ar: 'التاريخ', tr: 'Tarih' },
  today:   { az: 'Bu gün', en: 'Today', ru: 'Сегодня', ar: 'اليوم', tr: 'Bugün' },
  error:   { az: 'Cədvəli yükləmək alınmadı. İnternet bağlantısını yoxlayın.', en: 'Could not load the timetable. Please check your connection.', ru: 'Не удалось загрузить расписание. Проверьте подключение.', ar: 'تعذّر تحميل الجدول. تحقّق من الاتصال بالإنترنت.', tr: 'Tablo yüklenemedi. İnternet bağlantınızı kontrol edin.' },
  retry:   { az: 'Yenidən cəhd et', en: 'Try again', ru: 'Повторить', ar: 'أعد المحاولة', tr: 'Tekrar dene' },
  note:    { az: 'Vaxtlar şəhərin koordinatı ilə hesablanıb (aladhan.com). İmsak — səhurun son anı, iftar — məğrib azanıdır. Yerli məscidin elan etdiyi vaxtla bir neçə dəqiqə fərq ola bilər.', en: 'Times are calculated from the city coordinates (aladhan.com). Imsak marks the end of suhoor, iftar is the Maghrib adhan. Your local mosque may differ by a few minutes.', ru: 'Время рассчитано по координатам города (aladhan.com). Имсак — окончание сухура, ифтар — азан магриба. Время местной мечети может отличаться на несколько минут.', ar: 'الأوقات محسوبة وفق إحداثيات المدينة (aladhan.com). الإمساك نهاية السحور، والإفطار عند أذان المغرب. قد يختلف توقيت المسجد المحلي ببضع دقائق.', tr: 'Vakitler şehrin koordinatlarına göre hesaplanmıştır (aladhan.com). İmsak sahurun son anı, iftar akşam ezanıdır. Yerel caminin vakitleriyle birkaç dakika fark olabilir.' },
  wait:    { az: 'Hicri tarix müəyyən edilir…', en: 'Determining the Hijri date…', ru: 'Определяется дата по хиджре…', ar: 'جارٍ تحديد التاريخ الهجري…', tr: 'Hicri tarih belirleniyor…' },
}
const pick = (o, lang) => o[lang] || o.en

// Cədvəl sütunları (imsak + 6 vaxt); iftar sütunu "İftar (məğrib)"
const COLS = ['imsak', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

function colLabel(key, lang) {
  if (key === 'imsak') return pick(RC_TXT.imsak, lang)
  if (key === 'maghrib') return `${pick(RC_TXT.iftar, lang)} (${PRAYER_NAMES.maghrib[lang] || PRAYER_NAMES.maghrib.en})`
  return PRAYER_NAMES[key]?.[lang] || PRAYER_NAMES[key]?.en || key
}

// Qısa həftə günü (az — əl ilə; qalanları Intl)
const AZ_WD = ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.']
// lang-ok: lokal kodları cədvəli, az əl ilə yazılır
const WD_LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar' }
function shortWeekday(dateKey, lang) {
  const wd = weekdayOf(dateKey)
  if (lang === 'az') return AZ_WD[wd]
  const [d, m, y] = dateKey.split('-').map(Number)
  try { return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(WD_LOCALES[lang] || 'en-GB', { weekday: 'short', timeZone: 'UTC' }) } catch { return '' }
}

export default function RamadanPage({ setPage }) {
  const { lang } = useLang()
  const st = useRamadan({ alwaysCalendar: true })
  const { calendar, calError, calLoading, reloadCalendar, year, loc, clock, preview, day } = st
  const city = loc.city?.[lang] || loc.city?.en || ''
  const title = pick(TXT.title, lang)

  // Vurğulanan gün: real tarix; önizləmədə simulyasiya olunan gün
  const todayDate = preview?.mode === 'preview' ? day?.date : clock.dateKey
  const todayRef = useRef(null)
  useEffect(() => {
    // Ramazandadırsa cədvəldə bugünkü sətir görünən yerə gəlsin (səhifə yox, cədvəlin öz sürüşməsi)
    const row = todayRef.current
    const box = row?.closest('.rp-scroll')
    if (row && box && box.scrollHeight > box.clientHeight) box.scrollTop = row.offsetTop - box.clientHeight / 3
  }, [calendar, todayDate])

  return (
    <div className="rp-root">
      <header className="ui-page-hero rp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{title}</h1>
          {lang !== 'ar' && <p className="rp-hero-ar ui-arabic" lang="ar" aria-hidden="true">إِمْسَاكِيَّةُ رَمَضَان</p>}
          <p className="ui-lead">{pick(TXT.lead, lang)}</p>
        </div>
      </header>

      <section className="ui-section rp-main">
        <div className="ui-container rp-stack">
          <RamadanCard state={st} />

          <div className="rp-print">
            <div className="rp-toolbar ui-card" data-reveal>
              <div className="rp-toolbar-head">
                <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="pin" /></span>
                <h2 className="rp-title" id="rp-table-title">
                  {year ? pick(TXT.tableOf, lang).replace('{y}', year) : title}
                  {city && <span className="rp-title-city"> · {city}</span>}
                </h2>
              </div>
              <div className="rp-actions">
                <CityPicker triggerId="ramadan-city-trigger" />
                <button type="button" className="ui-btn ui-btn--secondary rp-print-btn"
                  onClick={() => window.print()} disabled={!calendar}>
                  <Icon name="calendar" className="ui-btn__icon" /> {pick(TXT.print, lang)}
                </button>
              </div>
            </div>

            {calError ? (
              <div className="rp-state ui-card" role="alert">
                <p>{pick(TXT.error, lang)}</p>
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={reloadCalendar}>{pick(TXT.retry, lang)}</button>
              </div>
            ) : !calendar ? (
              <div className="rp-state ui-card" aria-busy="true">
                {!year && !calLoading ? <p>{pick(TXT.wait, lang)}</p> : null}
                {Array.from({ length: 6 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--text" style={{ '--w': `${90 - i * 6}%` }} />)}
              </div>
            ) : (
              <div className="rp-scroll ui-card ui-card--flush" tabIndex={0} role="region" aria-labelledby="rp-table-title">
                {/* tabIndex — sürüşən sahə klaviatura ilə də sürüşsün (axe: scrollable-region-focusable) */}
                <table className="rp-table" aria-labelledby="rp-table-title" data-testid="ramadan-table">
                  <thead>
                    <tr>
                      <th scope="col">{pick(TXT.day, lang)}</th>
                      <th scope="col">{pick(TXT.date, lang)}</th>
                      {COLS.map(k => <th key={k} scope="col" className={`rp-col-${k}`}>{colLabel(k, lang)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {calendar.map(e => {
                      const isToday = e.date === todayDate
                      return (
                        <tr key={e.date} ref={isToday ? todayRef : undefined} className={isToday ? 'is-today' : undefined}
                          aria-current={isToday ? 'date' : undefined}>
                          <th scope="row" className="ui-num">
                            {e.day}
                            {isToday && <span className="rp-today ui-badge ui-badge--solid">{pick(TXT.today, lang)}</span>}
                          </th>
                          <td className="rp-date">
                            {formatGregorian(e.date, lang, { day: 'numeric', month: 'short' })}
                            <span className="rp-wd"> {shortWeekday(e.date, lang)}</span>
                          </td>
                          {COLS.map(k => <td key={k} className={`ui-num rp-col-${k}`}>{e.times[k] || '—'}</td>)}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="rp-note">{pick(TXT.note, lang)}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
