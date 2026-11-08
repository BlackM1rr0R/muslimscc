// ═══════════════════════════════════════════════════════
// HijriYearWheel (v5.6) — "Hicri il təkəri" (/calendar)
//
//   <HijriYearWheel lengths={[30,29,…]} monthNames={[…]} today={{ year, month, day }}
//     events={[{ month, day, label, type }]} selMonth={3} onPick={(m) => …} lang="az" />
//
// • 12 ay — dairəvi qövslər, uzunluğu ayın gün sayına (29/30) mütənasib;
//   yuxarıdan saat əqrəbi istiqamətində (Məhərrəm → Zülhiccə).
// • 4 haram ay qızılı (Tövbə 9:36; Buxari 3197), Ramazan — zümrüd.
// • Əsas hadisələr (bayramlar, Qədr gecələri, Ərəfə, Aşura) — səhifənin öz
//   EVENTS siyahısından (mənbələri orada); yeni heç nə əlavə olunmur.
// • "Bu gün" əqrəbi + ilin keçən hissəsi incə halqa ilə; mərkəzdə tarix və %.
// • Aya toxunuş → aşağıdakı ay şəbəkəsi həmin aya keçir (onPick).
// • Açılış: qövslər növbə ilə görünür, əqrəb yerinə fırlanır (hərəkət azaldılıbsa yox).
// Stillər: src/styles/HijriYearWheel.css
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { pickUi } from '../../utils/uiText'
import '../../styles/HijriYearWheel.css'

const TXT = {
  az: { title: 'Hicri il bir baxışda', sacred: 'Haram aylar', ramadan: 'Ramazan', today: 'Bu gün', passed: (p) => `ilin ${p}%-i keçib`, label: 'Hicri ilin dairəvi təqvimi', pick: 'Ayı aç' },
  en: { title: 'The Hijri year at a glance', sacred: 'Sacred months', ramadan: 'Ramadan', today: 'Today', passed: (p) => `${p}% of the year passed`, label: 'Circular calendar of the Hijri year', pick: 'Open month' },
  ru: { title: 'Год хиджры одним взглядом', sacred: 'Запретные месяцы', ramadan: 'Рамадан', today: 'Сегодня', passed: (p) => `прошло ${p}% года`, label: 'Круговой календарь года хиджры', pick: 'Открыть месяц' },
  ar: { title: 'السنة الهجرية في لمحة', sacred: 'الأشهر الحرم', ramadan: 'رمضان', today: 'اليوم', passed: (p) => `مضى ${p}% من السنة`, label: 'تقويم دائري للسنة الهجرية', pick: 'افتح الشهر' },
  tr: { title: 'Hicri yıl bir bakışta', sacred: 'Haram aylar', ramadan: 'Ramazan', today: 'Bugün', passed: (p) => `yılın %${p}'i geçti`, label: 'Hicri yılın dairesel takvimi', pick: 'Ayı aç' },
}
const SACRED = new Set([0, 6, 10, 11])   // Məhərrəm, Rəcəb, Zülqədə, Zülhiccə
const S = 340, C = S / 2, RO = 150, RI = 112, GAP = 0.012

const pt = (a, r) => [C + Math.cos(a) * r, C + Math.sin(a) * r]
function arc(a0, a1, ro, ri) {
  const [x0, y0] = pt(a0, ro), [x1, y1] = pt(a1, ro), [x2, y2] = pt(a1, ri), [x3, y3] = pt(a0, ri)
  const big = a1 - a0 > Math.PI ? 1 : 0
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${ro},${ro} 0 ${big} 1 ${x1.toFixed(2)},${y1.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}A${ri},${ri} 0 ${big} 0 ${x3.toFixed(2)},${y3.toFixed(2)}Z`
}

export default function HijriYearWheel({ lengths = [], monthNames = [], today, events = [], selMonth, onPick, lang = 'az' }) {
  const t = pickUi(TXT, lang, 'en')
  const [hover, setHover] = useState(null)
  const [shown, setShown] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') { setShown(true); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const lens = lengths.map(l => l || 29.5)
  const total = lens.reduce((a, b) => a + b, 0) || 354
  // Hər ayın başlanğıc günü (ilin içində) → bucaq
  const starts = []
  lens.reduce((acc, l, i) => { starts[i] = acc; return acc + l }, 0)
  const ang = (dayOfYear) => (dayOfYear / total) * Math.PI * 2 - Math.PI / 2
  const todayIdx = today ? starts[today.month - 1] + today.day - 1 : 0
  const pct = Math.round((todayIdx / total) * 100)
  const aToday = ang(todayIdx + 0.5)
  const hovered = hover != null ? events[hover] : null

  return (
    <section className="ui-card hyw" ref={ref} aria-labelledby="hyw-ttl">
      <h2 id="hyw-ttl" className="hyw-title">{t.title}</h2>
      <div className="hyw-wrap">
        {/* Təkər — vizual; eyni əməliyyatlar (aylar) yandakı düymələrlə əlçatandır,
            ona görə ekran oxuyucusu üçün gizlidir (iç-içə interaktiv element olmasın) */}
        <svg viewBox={`0 0 ${S} ${S}`} className={`hyw-svg${shown ? ' is-in' : ''}`} aria-hidden="true" focusable="false" dir="ltr">
          {lens.map((l, i) => {
            const a0 = ang(starts[i]) + GAP, a1 = ang(starts[i] + l) - GAP
            const mid = (a0 + a1) / 2
            const [lx, ly] = pt(mid, (RO + RI) / 2)
            const cls = `hyw-m${SACRED.has(i) ? ' is-sacred' : ''}${i === 8 ? ' is-ramadan' : ''}${i === selMonth ? ' is-sel' : ''}${today && i === today.month - 1 ? ' is-now' : ''}`
            return (
              <g key={i} className={cls} style={{ '--i': i }} onClick={() => onPick?.(i)}>
                <path d={arc(a0, a1, RO, RI)} />
                <text x={lx} y={ly + 4} textAnchor="middle">{i + 1}</text>
              </g>
            )
          })}
          {/* İlin keçən hissəsi — daxildə incə halqa */}
          {todayIdx > 0 && (
            <path className="hyw-progress" d={arc(-Math.PI / 2, aToday, RI - 6, RI - 10)} />
          )}
          {/* Hadisələr — qövsün çöl kənarında nöqtələr */}
          {events.map((e, i) => {
            const a = ang(starts[e.month] + e.day - 0.5)
            const [x, y] = pt(a, RO + 7)
            return <circle key={i} className={`hyw-ev hyw-ev--${e.type}${i === hover ? ' is-hover' : ''}`} cx={x} cy={y} r={i === hover ? 6 : 4.5}
              onPointerEnter={() => setHover(i)} onClick={() => setHover(i)}
              onPointerLeave={(ev) => { if (ev.pointerType === 'mouse') setHover(null) }} />
          })}
          {/* Bu gün əqrəbi */}
          {today && (
            <g className="hyw-needle" style={{ '--rot': `${((todayIdx + 0.5) / total) * 360}deg` }}>
              <line x1={C} y1={C - RI + 14} x2={C} y2={C - RO - 4} />
              <circle cx={C} cy={C - RO - 6} r="5.5" />
            </g>
          )}
          <text className="hyw-c1" x={C} y={C - 10} textAnchor="middle">{today ? `${today.day} ${monthNames[today.month - 1] || ''}` : ''}</text>
          <text className="hyw-c2" x={C} y={C + 10} textAnchor="middle">{today?.year}</text>
          <text className="hyw-c3" x={C} y={C + 30} textAnchor="middle">{t.passed(pct)}</text>
        </svg>
        <div className="hyw-side">
          <p className={`hyw-ev-name${hovered ? '' : ' is-empty'}`} aria-live="polite">{hovered ? <><b>{hovered.day} {monthNames[hovered.month]}</b> — {hovered.label}</> : null}</p>
          <ol className="hyw-months">
            {monthNames.map((n, i) => (
              <li key={i}>
                <button type="button" className={`hyw-mbtn${SACRED.has(i) ? ' is-sacred' : ''}${i === 8 ? ' is-ramadan' : ''}${i === selMonth ? ' is-sel' : ''}`} onClick={() => onPick?.(i)}>
                  <span className="hyw-mnum ui-num">{i + 1}</span>{n}<span className="hyw-mlen ui-num">{lengths[i] || ''}</span>
                </button>
              </li>
            ))}
          </ol>
          <ul className="hyw-legend">
            <li><i className="hyw-sw is-sacred" />{t.sacred}</li>
            <li><i className="hyw-sw is-ramadan" />{t.ramadan}</li>
            <li><i className="hyw-sw is-today" />{t.today}</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
