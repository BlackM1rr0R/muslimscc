// ═══════════════════════════════════════════════════════
// PrayerNumbers — "Namaz vaxtları rəqəmlərlə" (/prayer, il boyu lentin altında)
//
//   <PrayerNumbers loc={location} lang="az" city="Bakı" />
//
// Hesab yerli və şəbəkəsizdir: YearPrayerChart.yearDays (utils/prayCalc →
// computeTimes, Əbu Bəkr məscidinin parametrləri) — il boyu lentlə eyni rəqəmlər.
// • Gündüz və oruc uzunluğu / sübh, günəş, məğrib, işa vaxtları il boyu (LineChart)
// • Bu ay vs seçilmiş ay: orta müddətlər (CompareBars)
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import NumbersSection from './NumbersSection'
import { KpiCard, ChartCard, RangeTabs, LineChart, CompareBars, useVizFormat } from '../viz'
import { yearDays } from '../prayer/YearPrayerChart'
import { METHOD_ABUBAKR } from '../../utils/prayCalc'
import { PRAYER_NAMES } from '../../hooks/usePrayerTimes'
import { monthDurations, yearExtremes } from '../../utils/numbersData'
import { pickUi } from '../../utils/uiText'

const TXT = {
  az: {
    title: 'Namaz vaxtları rəqəmlərlə', lead: '{city} üçün il boyu: gündüzün və orucun uzunluğu, sübh və işanın sürüşməsi, aylar arası fərq.',
    today: 'Bu gün gündüz', vsY: (m) => (m === 0 ? 'dünənki qədər' : `dünənə görə ${m > 0 ? '+' : '−'}${Math.abs(m)} dəq`),
    longest: 'Ən uzun gün', shortest: 'Ən qısa gün', spread: 'Fərq', spreadHint: 'ən uzun və ən qısa gündüz arasında',
    year: 'İl boyu', yearSub: { len: 'saat:dəqiqə — günəşdən məğribə və sübhdən məğribə', times: 'yerli vaxt' },
    mode: 'Göstərici', mLen: 'Uzunluq', mTimes: 'Vaxtlar', day: 'Gündüz', fast: 'Oruc (sübh → məğrib)',
    cmp: 'Aylar müqayisəsi', cmpSub: 'orta müddət, saat:dəqiqə', other: 'Müqayisə ayı', thisM: 'Bu ay',
    night: 'Gecə (məğrib → sübh)', dawn: 'Şəfəq (sübh → günəş)', dusk: 'Qürub (məğrib → işa)',
    note: 'Qrafik yerli hesabdır (Əbu Bəkr məscidinin parametrləri). Başqa ölkədə sübh və işa bir neçə dəqiqə fərqlənə bilər — dəqiq vaxtlar yuxarıdakı cədvəldədir.',
  },
  en: {
    title: 'Prayer times in numbers', lead: 'All year for {city}: the length of the day and of the fast, how Fajr and Isha shift, and the difference between months.',
    today: 'Daylight today', vsY: (m) => (m === 0 ? 'same as yesterday' : `${m > 0 ? '+' : '−'}${Math.abs(m)} min vs yesterday`),
    longest: 'Longest day', shortest: 'Shortest day', spread: 'Difference', spreadHint: 'between the longest and shortest daylight',
    year: 'Through the year', yearSub: { len: 'hours:minutes — sunrise to Maghrib and Fajr to Maghrib', times: 'local time' },
    mode: 'Show', mLen: 'Length', mTimes: 'Times', day: 'Daylight', fast: 'Fast (Fajr → Maghrib)',
    cmp: 'Compare months', cmpSub: 'average length, hours:minutes', other: 'Compare with', thisM: 'This month',
    night: 'Night (Maghrib → Fajr)', dawn: 'Dawn (Fajr → sunrise)', dusk: 'Dusk (Maghrib → Isha)',
    note: 'The chart is calculated locally (Abu Bakr Mosque parameters). In other countries Fajr and Isha may differ by a few minutes — exact times are in the table above.',
  },
  ru: {
    title: 'Времена намаза в цифрах', lead: 'Весь год для {city}: длина дня и поста, как смещаются Фаджр и Иша, разница между месяцами.',
    today: 'Световой день сегодня', vsY: (m) => (m === 0 ? 'как вчера' : `${m > 0 ? '+' : '−'}${Math.abs(m)} мин ко вчера`),
    longest: 'Самый длинный день', shortest: 'Самый короткий день', spread: 'Разница', spreadHint: 'между самым длинным и коротким днём',
    year: 'В течение года', yearSub: { len: 'часы:минуты — от восхода до Магриба и от Фаджра до Магриба', times: 'местное время' },
    mode: 'Показать', mLen: 'Длина', mTimes: 'Времена', day: 'Световой день', fast: 'Пост (Фаджр → Магриб)',
    cmp: 'Сравнение месяцев', cmpSub: 'средняя длина, часы:минуты', other: 'Сравнить с', thisM: 'Этот месяц',
    night: 'Ночь (Магриб → Фаджр)', dawn: 'Рассвет (Фаджр → восход)', dusk: 'Сумерки (Магриб → Иша)',
    note: 'График рассчитан локально (параметры мечети Абу Бакр). В других странах Фаджр и Иша могут отличаться на несколько минут — точные времена в таблице выше.',
  },
  ar: {
    title: 'مواقيت الصلاة بالأرقام', lead: 'طوال العام في {city}: طول النهار والصيام، وتحرّك الفجر والعشاء، والفرق بين الشهور.',
    today: 'النهار اليوم', vsY: (m) => (m === 0 ? 'مثل أمس' : `${m > 0 ? '+' : '−'}${Math.abs(m)} د مقارنة بأمس`),
    longest: 'أطول نهار', shortest: 'أقصر نهار', spread: 'الفرق', spreadHint: 'بين أطول نهار وأقصره',
    year: 'خلال العام', yearSub: { len: 'ساعات:دقائق — من الشروق إلى المغرب ومن الفجر إلى المغرب', times: 'التوقيت المحلي' },
    mode: 'العرض', mLen: 'المدة', mTimes: 'المواقيت', day: 'النهار', fast: 'الصيام (الفجر ← المغرب)',
    cmp: 'مقارنة الشهور', cmpSub: 'متوسط المدة، ساعات:دقائق', other: 'قارن مع', thisM: 'هذا الشهر',
    night: 'الليل (المغرب ← الفجر)', dawn: 'الفجر (الفجر ← الشروق)', dusk: 'الشفق (المغرب ← العشاء)',
    note: 'الرسم محسوب محليًا (معايير مسجد أبي بكر). في بلدان أخرى قد يختلف الفجر والعشاء ببضع دقائق — المواقيت الدقيقة في الجدول أعلاه.',
  },
  tr: {
    title: 'Rakamlarla namaz vakitleri', lead: '{city} için yıl boyu: gündüzün ve orucun uzunluğu, sabah ve yatsının kayması, aylar arasındaki fark.',
    today: 'Bugün gündüz', vsY: (m) => (m === 0 ? 'dünkü kadar' : `düne göre ${m > 0 ? '+' : '−'}${Math.abs(m)} dk`),
    longest: 'En uzun gün', shortest: 'En kısa gün', spread: 'Fark', spreadHint: 'en uzun ve en kısa gündüz arasında',
    year: 'Yıl boyu', yearSub: { len: 'saat:dakika — güneşten akşama ve sabahtan akşama', times: 'yerel saat' },
    mode: 'Göster', mLen: 'Uzunluk', mTimes: 'Vakitler', day: 'Gündüz', fast: 'Oruç (sabah → akşam)',
    cmp: 'Ayları karşılaştır', cmpSub: 'ortalama süre, saat:dakika', other: 'Karşılaştırılan ay', thisM: 'Bu ay',
    night: 'Gece (akşam → sabah)', dawn: 'Şafak (sabah → güneş)', dusk: 'Akşam kızıllığı (akşam → yatsı)',
    note: 'Grafik yerel olarak hesaplanır (Ebu Bekir Camii parametreleri). Diğer ülkelerde sabah ve yatsı birkaç dakika farklı olabilir — kesin vakitler yukarıdaki tablodadır.',
  },
}

const pad2 = (n) => String(n).padStart(2, '0')
const dur = (min) => `${Math.floor(min / 60)}:${pad2(Math.round(min % 60))}`
const clock = (min) => `${pad2(Math.floor(min / 60) % 24)}:${pad2(Math.round(min % 60))}`
// Eyni şəhər/il üçün 365 günlük hesabı bir dəfə aparaq (YearPrayerChart da hesablayır — ucuzdur, amma təkrar lazım deyil)
const cache = new Map()
function daysFor(loc, year) {
  const k = `${loc.lat},${loc.lng},${loc.tz},${year}`
  if (!cache.has(k)) { cache.set(k, yearDays(loc, year)); if (cache.size > 6) cache.delete(cache.keys().next().value) }
  return cache.get(k)
}

export default function PrayerNumbers({ loc, lang = 'az', city = '' }) {
  const t = pickUi(TXT, lang, 'en')
  const f = useVizFormat(lang)
  const now = new Date()
  const year = now.getFullYear()
  const days = useMemo(() => (loc ? daysFor(loc, year) : []), [loc, year])
  const ex = useMemo(() => yearExtremes(days), [days])
  const curM = now.getMonth() + 1
  const [mode, setMode] = useState('len')
  // Susma: ən fərqli ay — ən qısa gündüzlü ay yayda, ən uzun gündüzlü ay qışda seçilir
  const [otherM, setOtherM] = useState(() => (curM + 5) % 12 + 1)
  if (!days.length || !ex) return null

  const todayIdx = Math.min(days.length - 1, Math.floor((Date.UTC(year, now.getMonth(), now.getDate()) - Date.UTC(year, 0, 1)) / 864e5))
  const td = days[todayIdx], yd = days[Math.max(0, todayIdx - 1)]
  const tdLen = td.maghrib - td.sunrise, ydLen = yd.maghrib - yd.sunrise
  const dateOf = (d) => f.date(new Date(year, d.m - 1, d.day), { day: 'numeric', month: 'long' })
  const monthName = (m) => f.date(new Date(year, m - 1, 15), { month: 'long' })
  const labels = days.map(d => `${year}-${pad2(d.m)}-${pad2(d.day)}`)
  const xFmt = (k) => f.date(new Date(`${k}T12:00:00`), { day: 'numeric', month: 'short' })
  const names = Object.fromEntries(['fajr', 'sunrise', 'maghrib', 'isha'].map(k => [k, pickUi(PRAYER_NAMES[k], lang, 'en')]))
  const a = monthDurations(days, curM), b = monthDurations(days, otherM)
  const cmpItems = a && b ? [
    { key: 'day', label: t.day, value: a.day, prev: b.day, tone: 2 },
    { key: 'fast', label: t.fast, value: a.fast, prev: b.fast, tone: 1 },
    { key: 'night', label: t.night, value: a.night, prev: b.night, tone: 3 },
    { key: 'dawn', label: t.dawn, value: a.dawn, prev: b.dawn, tone: 4 },
    { key: 'dusk', label: t.dusk, value: a.dusk, prev: b.dusk, tone: 4 },
  ] : []
  const sub = t.yearSub[mode]

  return (
    <NumbersSection id="pp-numbers" lang={lang} title={t.title} lead={t.lead.replace('{city}', city)}>
      <KpiCard span={3} icon="sun" label={t.today} value={dur(tdLen)} hint={t.vsY(tdLen - ydLen)} spark={days.slice(Math.max(0, todayIdx - 30), todayIdx + 1).map(d => d.maghrib - d.sunrise)} sparkLabel={t.today} tone={2} />
      <KpiCard span={3} icon="sunrise" label={t.longest} value={dur(ex.long.maghrib - ex.long.sunrise)} hint={dateOf(ex.long)} />
      <KpiCard span={3} icon="moon" label={t.shortest} value={dur(ex.short.maghrib - ex.short.sunrise)} hint={dateOf(ex.short)} />
      <KpiCard span={3} icon="clock" label={t.spread} value={dur(ex.spread)} hint={t.spreadHint} />

      <ChartCard span={8} id="ppn-year" title={t.year} sub={sub}
        actions={<RangeTabs label={t.mode} value={mode} onChange={setMode} options={[{ value: 'len', label: t.mLen }, { value: 'times', label: t.mTimes }]} />}
        footer={Number(loc?.method) !== METHOD_ABUBAKR ? { note: t.note } : undefined}>
        {mode === 'len' ? (
          <LineChart key="len" height={260} label={`${t.year}: ${t.mLen}`} labels={labels} xFormat={xFmt} tooltipTitle={(k) => f.date(new Date(`${k}T12:00:00`), { day: 'numeric', month: 'long' })}
            yFormat={dur} valueFormat={dur} legendValue="avg" yMin={Math.max(0, Math.floor(Math.min(...days.map(d => d.maghrib - d.sunrise)) / 60) * 60 - 60)}
            series={[
              { key: 'day', label: t.day, values: days.map(d => d.maghrib - d.sunrise), tone: 2 },
              { key: 'fast', label: t.fast, values: days.map(d => d.maghrib - d.fajr), tone: 1 },
            ]} />
        ) : (
          <LineChart key="times" height={260} label={`${t.year}: ${t.mTimes}`} labels={labels} xFormat={xFmt} tooltipTitle={(k) => f.date(new Date(`${k}T12:00:00`), { day: 'numeric', month: 'long' })}
            yFormat={clock} valueFormat={clock} legendValue={false} yMin={Math.floor(Math.min(...days.map(d => d.fajr)) / 60) * 60}
            series={['fajr', 'sunrise', 'maghrib', 'isha'].map((k, i) => ({ key: k, label: names[k], values: days.map(d => d[k]), tone: i + 1 }))} />
        )}
      </ChartCard>

      <ChartCard span={4} id="ppn-cmp" title={t.cmp} sub={t.cmpSub}
        actions={
          <label className="nm-sel">
            <span className="ui-sr-only">{t.other}</span>
            <select className="ui-select" value={otherM} onChange={(e) => setOtherM(Number(e.target.value))} aria-label={t.other}>
              {Array.from({ length: 12 }, (_, i) => i + 1).filter(m => m !== curM).map(m => <option key={m} value={m}>{monthName(m)}</option>)}
            </select>
          </label>
        }>
        <CompareBars label={t.cmp} lang={lang} items={cmpItems} format={dur} currentLabel={`${t.thisM} (${monthName(curM)})`} prevLabel={monthName(otherM)} />
      </ChartCard>
    </NumbersSection>
  )
}
