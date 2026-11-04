// ═══════════════════════════════════════════════════════
// SunDial — 24 saatlıq dairəvi günəş saatı (namaz vaxtları)
//
//   <SunDial times={{ fajr:'05:38', sunrise, dhuhr, asr, maghrib, isha }} nowMin={1034}
//     names={{ fajr:'Sübh', … }} nextKey="maghrib" centerTop="17:14" centerBottom="Məğrib · 20 dəq"
//     label="Günün saatı" />
//
// • Gecə yarısı AŞAĞIDA, günorta YUXARIDA — günəş dairə boyu saat əqrəbi ilə
//   gəzir (sübh solda-aşağıda, məğrib sağda-aşağıda).
// • Qövslər: gecə (işa→sübh) · şəfəq (sübh→günəş, məğrib→işa) · gündüz.
// • Namaz nöqtələri ad + saatla (rəng tək daşıyıcı deyil); növbəti namaz vurğulanır.
// • "İndi" əqrəbi: gündüz günəş, gecə ay işarəsi.
// • Əlçatanlıq: role="img" + aria-label (bütün vaxtlar mətn kimi).
// Stillər: src/styles/SunDial.css
// ═══════════════════════════════════════════════════════
import { memo, useId } from 'react'
import { hmToMin } from '../PrayerDayline'
import '../../styles/SunDial.css'

const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
const C = 200          // mərkəz
const R = 150          // halqanın radiusu
const pad = (n) => String(n).padStart(2, '0')
const fmt = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`

/** dəqiqə → bucaq (dərəcə, yuxarıdan saat əqrəbi ilə; 0:00 = 180° aşağı) */
export const minToDeg = (m) => ((m / 1440) * 360 + 180) % 360
const pt = (m, r) => {
  const a = (minToDeg(m) * Math.PI) / 180
  return [C + r * Math.sin(a), C - r * Math.cos(a)]
}
/** m1 → m2 saat əqrəbi ilə qövs (gecə yarısını keçə bilər) */
function arc(m1, m2, r) {
  const span = ((m2 - m1) + 1440) % 1440
  const [x1, y1] = pt(m1, r)
  const [x2, y2] = pt(m2, r)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${span > 720 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

function SunDial({ times, nowMin, names = {}, nextKey = null, centerTop = '', centerBottom = '', label = '', className = '' }) {
  const gid = useId().replace(/:/g, '')
  const t = {}
  for (const k of ORDER) t[k] = hmToMin(times?.[k])
  if (ORDER.some(k => t[k] == null)) return null
  const now = Number.isFinite(nowMin) ? ((nowMin % 1440) + 1440) % 1440 : null
  const isDay = now != null && now >= t.sunrise && now < t.maghrib
  const aria = `${label ? `${label}: ` : ''}${ORDER.map(k => `${names[k] || k} ${fmt(t[k])}`).join(', ')}`

  return (
    <figure className={`psd ${className}`} role="img" aria-label={aria}>
      <svg viewBox="-70 -24 540 448" className="psd__svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${gid}-day`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--psd-dawn)" />
            <stop offset="0.5" stopColor="var(--psd-day)" />
            <stop offset="1" stopColor="var(--psd-dusk)" />
          </linearGradient>
          {/* Hilal: dairədən sürüşdürülmüş dairə kəsilir (fon rəngindən asılı deyil) */}
          <mask id={`${gid}-moon`} maskUnits="userSpaceOnUse" x={C - 16} y={C - R - 16} width="32" height="32">
            <circle cx={C} cy={C - R} r="11" fill="#fff" />
            <circle cx={C + 5} cy={C - R - 3.5} r="9.5" fill="#000" />
          </mask>
          <radialGradient id={`${gid}-sun`}>
            <stop offset="0" stopColor="#fff6d8" />
            <stop offset="0.45" stopColor="#ffcf6e" />
            <stop offset="1" stopColor="#ffb24a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* İz + saat bölgüləri */}
        <circle cx={C} cy={C} r={R} className="psd__track" />
        {Array.from({ length: 24 }, (_, h) => {
          const [x1, y1] = pt(h * 60, R - 20)
          const [x2, y2] = pt(h * 60, R - (h % 6 === 0 ? 30 : 25))
          return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} className={`psd__tick${h % 6 === 0 ? ' is-major' : ''}`} />
        })}
        {[0, 6, 12, 18].map(h => {
          const [x, y] = pt(h * 60, R - 44)
          return <text key={h} x={x} y={y} className="psd__hour" textAnchor="middle" dominantBaseline="central">{pad(h)}</text>
        })}

        {/* Qövslər (çəkilərək görünür) */}
        <path d={arc(t.isha, t.fajr, R)} className="psd__arc psd__arc--night" pathLength="1" />
        <path d={arc(t.fajr, t.sunrise, R)} className="psd__arc psd__arc--twilight" pathLength="1" />
        <path d={arc(t.maghrib, t.isha, R)} className="psd__arc psd__arc--twilight" pathLength="1" />
        <path d={arc(t.sunrise, t.maghrib, R)} className="psd__arc psd__arc--day" stroke={`url(#${gid}-day)`} pathLength="1" />

        {/* Namaz nöqtələri və etiketlər */}
        {ORDER.map((k, i) => {
          const [x, y] = pt(t[k], R)
          const [lx, ly] = pt(t[k], R + 34)
          const anchor = Math.abs(lx - C) < 24 ? 'middle' : lx > C ? 'start' : 'end'
          const on = k === nextKey
          return (
            <g key={k} className={`psd__mark${on ? ' is-next' : ''}${k === 'sunrise' ? ' is-sunrise' : ''}`} style={{ '--i': i }}>
              {on && <circle cx={x} cy={y} r="11" className="psd__pulse" />}
              <circle cx={x} cy={y} r={on ? 8 : 6} className="psd__dot" />
              <text x={lx} y={ly - 8} textAnchor={anchor} className="psd__name">{names[k] || k}</text>
              <text x={lx} y={ly + 10} textAnchor={anchor} className="psd__time">{fmt(t[k])}</text>
            </g>
          )
        })}

        {/* İndi əqrəbi */}
        {now != null && (
          <g className="psd__hand" style={{ '--a': `${minToDeg(now)}deg` }}>
            {/* Mərkəz mətnin altından keçməsin deyə əqrəb yalnız halqanın yanında */}
            <line x1={C} y1={C - R + 58} x2={C} y2={C - R + 24} className="psd__hand-line" />
            {isDay ? (
              <g className="psd__body">
                <circle cx={C} cy={C - R} r="22" fill={`url(#${gid}-sun)`} />
                <circle cx={C} cy={C - R} r="9" className="psd__sun" />
              </g>
            ) : (
              <g className="psd__body">
                <circle cx={C} cy={C - R} r="16" className="psd__moon-glow" />
                <circle cx={C} cy={C - R} r="11" className="psd__moon" mask={`url(#${gid}-moon)`} />
              </g>
            )}
          </g>
        )}
      </svg>
      {(centerTop || centerBottom) && (
        <figcaption className="psd__center">
          {centerTop && <span className="psd__center-top ui-num">{centerTop}</span>}
          {centerBottom && <span className="psd__center-bottom">{centerBottom}</span>}
        </figcaption>
      )}
    </figure>
  )
}

export default memo(SunDial)
