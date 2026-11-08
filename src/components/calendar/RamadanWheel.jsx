// ═══════════════════════════════════════════════════════
// RamadanWheel (v5.6) — "Ramazan fəsilləri dolaşır": 34 Ramazanın
// başlanğıcı miladi ilin dairəsində spiral kimi
//
//   <RamadanWheel lang="az" />
//
// • Dairə — miladi il (yanvar yuxarıda, saat əqrəbi istiqamətində), 4 fəsil
//   rəngli sektor (cənub yarımkürəsində fəsillər tərsinə). Hər nöqtə — bir
//   Ramazanın 1-i (Ümmül-Qura, utils/hijri); hər il ~11 gün geri, ~33 ildə
//   bütün dairə. İçəridən çölə — bu il → 33 il sonra.
// • Nöqtəyə toxunuş — həmin il: hicri il, miladi tarixlər, istifadəçinin
//   şəhərində orucun orta/ən qısa/ən uzun müddəti (sübh → məğrib, yerli hesab
//   — utils/prayCalc). Altda 34 il üzrə oruc müddəti sütunlarla.
// • Ay başlanğıcı hilalın görülməsi ilə müəyyən olunur — yerli elan bir gün
//   fərqlənə bilər (qeyd göstərilir).
// • Açılış: spiral çəkilir, nöqtələr növbə ilə görünür (hərəkət azaldılıbsa yox).
// Stillər: src/styles/RamadanWheel.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { gregorianToHijri, hijriToGregorian, hijriMonthLength, addGDays, fromLocalDate, G_MONTHS, G_MONTHS_SHORT } from '../../utils/hijri'
import { computeTimes, tzOffsetHours, CALC_METHODS } from '../../utils/prayCalc'
import { usePrayerLocation } from '../../utils/prayerLocation'
import { ColumnChart } from '../viz'
import { pickUi } from '../../utils/uiText'
import '../../styles/RamadanWheel.css'

const TXT = {
  az: { eyebrow: 'Ramazan fəsilləri dolaşır', title: 'Ramazan 33 ildə bütün fəsilləri gəzir', lead: 'Hicri il miladi ildən ~11 gün qısadır. Hər nöqtə bir Ramazanın başlanğıcıdır — içəridən çölə bu ildən 33 il sonraya. Nöqtəyə toxunun: orucun {city} üçün neçə saat olacağı görünür.', fast: 'Orta oruc', min: 'Ən qısa', max: 'Ən uzun', hours: (h, m) => `${h} saat ${m} dəq`, seasons: ['Qış', 'Yaz', 'Yay', 'Payız'], chart: 'Oruc müddəti illər üzrə (saat)', chartSub: 'Sübhdən məğribə qədər, orta', note: 'Tarixlər Ümmül-Qura təqvimi ilə hesablanır. Ayın başlanğıcı hilalın görülməsi ilə müəyyən olunur — yerli elan bir gün fərqlənə bilər.', label: 'Ramazanın 33 illik dövrünün dairəvi qrafiki', thisYear: 'bu il', prev: 'Əvvəlki il', next: 'Növbəti il' },
  en: { eyebrow: 'Ramadan through the seasons', title: 'Ramadan visits every season in 33 years', lead: 'The Hijri year is ~11 days shorter than the Gregorian one. Each dot is the start of a Ramadan — from this year (inside) to 33 years ahead (outside). Tap a dot to see how many hours the fast will be in {city}.', fast: 'Average fast', min: 'Shortest', max: 'Longest', hours: (h, m) => `${h} h ${m} min`, seasons: ['Winter', 'Spring', 'Summer', 'Autumn'], chart: 'Fasting length by year (hours)', chartSub: 'From Fajr to Maghrib, average', note: 'Dates follow the Umm al-Qura calendar. A month begins with the sighting of the crescent — the local announcement may differ by a day.', label: 'Circular chart of the 33-year Ramadan cycle', thisYear: 'this year', prev: 'Previous year', next: 'Next year' },
  ru: { eyebrow: 'Рамадан по временам года', title: 'За 33 года Рамадан проходит все времена года', lead: 'Год по хиджре короче григорианского примерно на 11 дней. Каждая точка — начало Рамадана: от этого года (внутри) до 33 лет вперёд (снаружи). Нажмите на точку — увидите, сколько часов будет длиться пост в {city}.', fast: 'Средний пост', min: 'Самый короткий', max: 'Самый длинный', hours: (h, m) => `${h} ч ${m} мин`, seasons: ['Зима', 'Весна', 'Лето', 'Осень'], chart: 'Длительность поста по годам (часы)', chartSub: 'От Фаджра до Магриба, в среднем', note: 'Даты рассчитаны по календарю Умм аль-Кура. Месяц начинается с наблюдения молодой луны — местное объявление может отличаться на день.', label: 'Круговая диаграмма 33-летнего цикла Рамадана', thisYear: 'этот год', prev: 'Предыдущий год', next: 'Следующий год' },
  ar: { eyebrow: 'رمضان عبر الفصول', title: 'يمرّ رمضان على الفصول كلها في 33 سنة', lead: 'السنة الهجرية أقصر من الميلادية بنحو 11 يومًا. كل نقطة بداية رمضان — من هذا العام (في الداخل) إلى 33 سنة قادمة (في الخارج). المس نقطة لترى كم ساعة سيكون الصوم في {city}.', fast: 'متوسط الصوم', min: 'الأقصر', max: 'الأطول', hours: (h, m) => `${h} س ${m} د`, seasons: ['الشتاء', 'الربيع', 'الصيف', 'الخريف'], chart: 'مدة الصوم حسب السنة (ساعات)', chartSub: 'من الفجر إلى المغرب، متوسط', note: 'التواريخ وفق تقويم أم القرى. يبدأ الشهر برؤية الهلال — وقد يختلف الإعلان المحلي بيوم.', label: 'رسم دائري لدورة رمضان في 33 سنة', thisYear: 'هذا العام', prev: 'السنة السابقة', next: 'السنة التالية' },
  tr: { eyebrow: 'Ramazan mevsimleri dolaşır', title: 'Ramazan 33 yılda bütün mevsimleri gezer', lead: 'Hicri yıl miladi yıldan ~11 gün kısadır. Her nokta bir Ramazan’ın başlangıcıdır — içeriden dışarıya bu yıldan 33 yıl sonrasına. Bir noktaya dokunun: orucun {city} için kaç saat olacağı görünür.', fast: 'Ortalama oruç', min: 'En kısa', max: 'En uzun', hours: (h, m) => `${h} sa ${m} dk`, seasons: ['Kış', 'İlkbahar', 'Yaz', 'Sonbahar'], chart: 'Yıllara göre oruç süresi (saat)', chartSub: 'İmsaktan akşama, ortalama', note: 'Tarihler Ümmü’l-Kura takvimiyle hesaplanır. Ay, hilalin görülmesiyle başlar — yerel duyuru bir gün farklı olabilir.', label: '33 yıllık Ramazan döngüsünün dairesel grafiği', thisYear: 'bu yıl', prev: 'Önceki yıl', next: 'Sonraki yıl' },
}

const YEARS = 34
const S = 360, C = S / 2, R0 = 50, DR = 2.95
const toMin = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : NaN }
const doy = (g) => (Date.UTC(g.year, g.month - 1, g.day) - Date.UTC(g.year, 0, 1)) / 86400000
const angle = (g) => (doy(g) / 365.25) * Math.PI * 2 - Math.PI / 2
const pt = (a, r) => [C + Math.cos(a) * r, C + Math.sin(a) * r]

/** Bir Ramazanın oruc müddətləri (dəqiqə) — sübh → məğrib, hər gün */
function fastStats(loc, start, len) {
  const out = []
  for (let i = 0; i < len; i++) {
    const g = addGDays(start, i)
    const tz = tzOffsetHours(loc.tz || 'Asia/Baku', g.year, g.month, g.day)
    const t = computeTimes(g, loc.lat, loc.lng, tz, CALC_METHODS.abubakr)
    const f = toMin(t.maghrib) - toMin(t.fajr)
    if (Number.isFinite(f)) out.push(f)
  }
  if (!out.length) return null
  return { avg: out.reduce((a, b) => a + b, 0) / out.length, min: Math.min(...out), max: Math.max(...out) }
}

export default function RamadanWheel({ lang = 'az' }) {
  const t = pickUi(TXT, lang, 'en')
  const loc = usePrayerLocation()
  const city = loc.city?.[lang] || loc.city?.en || ''
  const months = G_MONTHS_SHORT[lang] || G_MONTHS_SHORT.en
  const monthsLong = G_MONTHS[lang] || G_MONTHS.en
  const south = loc.lat < 0

  const list = useMemo(() => {
    const h0 = gregorianToHijri(fromLocalDate(new Date())).year
    const out = []
    for (let k = 0; k < YEARS; k++) {
      const hy = h0 + k
      const start = hijriToGregorian({ year: hy, month: 9, day: 1 })
      if (!start) continue
      const len = hijriMonthLength(hy, 9)
      out.push({ k, hy, start, end: addGDays(start, len - 1), len, fast: fastStats(loc, start, len) })
    }
    return out
  }, [loc])

  const [sel, setSel] = useState(0)
  const [shown, setShown] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') { setShown(true); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (!list.length) return null
  const cur = list[Math.min(sel, list.length - 1)]
  const dots = list.map(r => ({ ...r, xy: pt(angle(r.start), R0 + r.k * DR) }))
  const spiral = dots.map((d, i) => `${i ? 'L' : 'M'}${d.xy[0].toFixed(1)},${d.xy[1].toFixed(1)}`).join('')
  const dur = (min) => t.hours(Math.floor(min / 60), Math.round(min % 60))
  const gLabel = (g) => `${g.day} ${monthsLong[g.month - 1]} ${g.year}`
  // Fəsil sektorları: qış dek–fev, yaz mar–may, yay iyn–avq, payız sen–noy
  const seasonArc = (si) => {
    const startM = [11, 2, 5, 8][si]           // 0-based ay (dek=11)
    const a0 = ((startM * 30.44) / 365.25) * Math.PI * 2 - Math.PI / 2
    const a1 = a0 + Math.PI / 2
    const [x0, y0] = pt(a0, C - 6), [x1, y1] = pt(a1, C - 6)
    return `M${C},${C}L${x0.toFixed(1)},${y0.toFixed(1)}A${C - 6},${C - 6} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}Z`
  }
  const seasonOf = (si) => (south ? (si + 2) % 4 : si)   // cənub yarımkürəsi: dek–fev yaydır
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.min(list.length - 1, s + 1)) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
  }

  return (
    <section className="ui-card rmw" ref={ref} aria-labelledby="rmw-ttl">
      <div className="rmw-head">
        <span className="ui-eyebrow">{t.eyebrow}</span>
        <h2 id="rmw-ttl" className="ui-title rmw-title">{t.title}</h2>
        <p className="ui-lead rmw-lead">{t.lead.replace('{city}', city)}</p>
      </div>
      <div className="rmw-body">
        <div className="rmw-wheel" dir="ltr">
          <svg viewBox={`0 0 ${S} ${S}`} className={`rmw-svg${shown ? ' is-in' : ''}`} role="slider" tabIndex={0}
            aria-label={t.label} aria-valuemin={list[0].hy} aria-valuemax={list[list.length - 1].hy} aria-valuenow={cur.hy}
            aria-valuetext={`${cur.hy} · ${gLabel(cur.start)}`} onKeyDown={onKey}>
            {[0, 1, 2, 3].map(si => <path key={si} className={`rmw-season rmw-season--${seasonOf(si)}`} d={seasonArc(si)} />)}
            <circle className="rmw-hole" cx={C} cy={C} r={R0 - 14} />
            {months.map((m, i) => {
              const a = ((i * 30.44 + 15) / 365.25) * Math.PI * 2 - Math.PI / 2
              const [x, y] = pt(a, C - 14)
              return <text key={m} className="rmw-month" x={x} y={y + 4} textAnchor="middle">{m}</text>
            })}
            <path className="rmw-spiral" d={spiral} pathLength="1" />
            {dots.map((d, i) => (
              <circle key={d.hy} className={`rmw-dot${i === sel ? ' is-sel' : ''}${i === 0 ? ' is-now' : ''}`}
                cx={d.xy[0]} cy={d.xy[1]} r={i === sel ? 7 : 4.2} style={{ '--i': i }}
                onClick={() => setSel(i)} onPointerEnter={(e) => { if (e.pointerType === 'mouse') setSel(i) }} />
            ))}
            <text className="rmw-center-y" x={C} y={C - 2} textAnchor="middle">{cur.hy}</text>
            <text className="rmw-center-s" x={C} y={C + 14} textAnchor="middle">{cur.start.year}</text>
          </svg>
          <ul className="rmw-legend" aria-hidden="true">
            {[0, 1, 2, 3].map(i => <li key={i}><i className={`rmw-sw rmw-season--${i}`} />{t.seasons[i]}</li>)}
          </ul>
        </div>
        <div className="rmw-info" aria-live="polite">
          <div className="rmw-year">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm rmw-nav" onClick={() => setSel(s => Math.max(0, s - 1))} disabled={sel === 0} aria-label={t.prev}>‹</button>
            <b>Ramaḍān {cur.hy}</b>{sel === 0 && <span className="ui-badge rmw-now">{t.thisYear}</span>}
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm rmw-nav" onClick={() => setSel(s => Math.min(list.length - 1, s + 1))} disabled={sel === list.length - 1} aria-label={t.next}>›</button>
          </div>
          <p className="rmw-dates">{gLabel(cur.start)} — {gLabel(cur.end)}</p>
          {cur.fast && (
            <ul className="rmw-fast">
              <li className="is-main"><span>{t.fast}</span><b className="ui-num">{dur(cur.fast.avg)}</b></li>
              <li><span>{t.min}</span><b className="ui-num">{dur(cur.fast.min)}</b></li>
              <li><span>{t.max}</span><b className="ui-num">{dur(cur.fast.max)}</b></li>
            </ul>
          )}
        </div>
      </div>
      <div className="rmw-chart">
        <p className="rmw-chart-t"><b>{t.chart}</b> · {t.chartSub}</p>
        <ColumnChart height={110} showValues={false} label={t.chart}
          data={list.map((r, i) => ({ key: r.hy, label: i % 4 === 0 || i === sel ? `’${String(r.start.year).slice(2)}` : '', value: r.fast ? +(r.fast.avg / 60).toFixed(1) : 0, tone: i === sel ? 2 : 1, current: i === sel }))}
          format={(v) => `${v}`} />
      </div>
      <p className="rmw-note">{t.note}</p>
    </section>
  )
}
