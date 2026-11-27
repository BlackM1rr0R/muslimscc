// ═══════════════════════════════════════════════════════
// SeerahMap — /seerah səhifəsinin Hicaz xəritəsi (öz SVG-miz; kafel/şəkil yoxdur)
//
//   <SeerahMap lang t active={placeId} also={[...]} hijrah={bool} onPick={(placeId) => …} />
//
// • Bəzəkdir (aria-hidden): eyni yerlər səhifədə əlçatan düymə siyahısı kimi var
//   (pages/SeerahPage.jsx → "Siyər yerləri"). Klik yalnız siçan/toxunuş üçün qısayoldur.
// • Aktiv yer qızılı halqa ilə işıqlanır; Məkkə/Mədinə ətrafındakı yerlər böyüdülmüş
//   çərçivələrdə, əsas xəritədə isə həmin ətrafın nöqtəsi işıqlanır.
// • Hicrət hadisəsi görünəndə yol çəkilir (stroke-dashoffset keçidi); hərəkət azaldılıbsa
//   keçid yoxdur — yol dərhal tam görünür (CSS).
// • SVG həmişə LTR (coğrafiya güzgülənmir).
// ═══════════════════════════════════════════════════════
import { memo, useId } from 'react'
import { SEERAH_PLACES } from '../../data/seerah'
import { pickUi } from '../../utils/uiText'
import {
  projector, MAIN_BOX, MAIN_W, INSETS, ARABIA_COAST, AFRICA_COAST, SINAI_COAST, HIJRA_ROUTE, EDGE_AT,
  smooth, landPath,
} from './seerahGeo'

const name = (id, lang) => pickUi(SEERAH_PLACES[id].name, lang, 'en') || id

// Yazının yeri: [anchor, dx, dy] — nöqtəyə görə
const LABEL = {
  makkah: ['start', 6, -6], thawr: ['end', -7, 12], mina: ['start', 6, 11], arafat: ['start', 7, 12],
  hudaybiyyah: ['start', -4, -8], hunayn: ['end', 2, -9],
  madinah: ['start', 8, 4], quba: ['start', 8, 5], uhud: ['start', 8, 4], khandaq: ['end', -8, 4],
  taif: ['start', 9, 4], badr: ['end', -9, 4], khaybar: ['end', -9, 4], tabuk: ['start', 9, 4],
}
// Əsas xəritədə ətrafın nöqtəsinin yazısı
const AREA_LABEL = { makkah: ['end', -9, -8], madinah: ['start', 9, 4] }
const MAIN_PLACES = ['taif', 'badr', 'khaybar', 'tabuk']

const prjMain = projector(MAIN_BOX, MAIN_W)
const INSET_PRJ = Object.fromEntries(Object.entries(INSETS).map(([k, v]) => [k, projector(v.box, v.w)]))
const TITLE_H = 18
const PAD = 8
function insetOrigin(k) {
  const pr = INSET_PRJ[k]
  return INSETS[k].at === 'top-right'
    ? [prjMain.W - PAD - pr.W, 30]
    : [PAD, prjMain.H - PAD - pr.H - TITLE_H]
}

function Marker({ id, x, y, lang, active, also, onPick, small, approx }) {
  const [anchor, dx, dy] = LABEL[id] || ['start', 8, 4]
  return (
    <g className={`srh-pt${active ? ' is-active' : ''}${also ? ' is-also' : ''}${approx ? ' is-approx' : ''}${small ? ' srh-pt--sm' : ''}`}
      data-place={id} onClick={() => onPick(id)}>
      <circle cx={x} cy={y} r="13" className="srh-pt__hit" />
      {active && <circle cx={x} cy={y} r="9" className="srh-pt__pulse" />}
      <circle cx={x} cy={y} r={small ? 3.6 : 4.6} className="srh-pt__dot" />
      <text x={x + dx} y={y + dy} textAnchor={anchor} className="srh-pt__label">{name(id, lang)}</text>
    </g>
  )
}

function Route({ pts, id, clip }) {
  const d = smooth(pts)
  return (
    <g clipPath={clip ? `url(#${clip})` : undefined}>
      <path d={d} className="srh-route srh-route--ghost" />
      <path d={d} className="srh-route srh-route--draw" pathLength="1" markerEnd={`url(#${id}-arr)`} />
    </g>
  )
}

function Inset({ k, lang, t, active, also, onPick, id }) {
  const pr = INSET_PRJ[k]
  const [ox, oy] = insetOrigin(k)
  const places = Object.keys(SEERAH_PLACES).filter(p => SEERAH_PLACES[p].area === k)
  const on = places.includes(active)
  const route = HIJRA_ROUTE.map(([a, b]) => pr.p(a, b))
  return (
    <g className={`srh-inset${on ? ' is-on' : ''}`} transform={`translate(${ox} ${oy})`} data-area={k}>
      <rect x="0" y="0" width={pr.W} height={pr.H + TITLE_H} rx="8" className="srh-inset__bg" />
      <text x="8" y="13" className="srh-inset__title">{k === 'makkah' ? t.makkahArea : t.madinahArea}</text>
      <g transform={`translate(0 ${TITLE_H})`}>
        <clipPath id={`${id}-clip-${k}`}><rect width={pr.W} height={pr.H} /></clipPath>
        <Route pts={route} id={id} clip={`${id}-clip-${k}`} />
        {places.map(p => {
          const [x, y] = pr.p(...SEERAH_PLACES[p].at)
          return <Marker key={p} id={p} x={x} y={y} lang={lang} active={active === p} also={also.includes(p)} onPick={onPick} small approx={SEERAH_PLACES[p].approx} />
        })}
      </g>
    </g>
  )
}

function SeerahMap({ lang = 'az', t, active, also = [], hijrah = false, onPick = () => {} }) {
  const id = `srh${useId().replace(/:/g, '')}`
  const { W, H } = prjMain
  const P = (pid) => prjMain.p(...SEERAH_PLACES[pid].at)
  const areaOf = (pid) => SEERAH_PLACES[pid]?.area
  const route = HIJRA_ROUTE.map(([a, b]) => prjMain.p(a, b))
  const [seaX, seaY] = prjMain.p(24.3, 36.75)
  const [nx, ny] = prjMain.p(23.0, 40.85)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`srh-map__svg${hijrah ? ' is-hijrah' : ''}`} aria-hidden="true" focusable="false" style={{ direction: 'ltr' }}
      data-testid="seerah-map-svg" data-active={active || ''}>
      <defs>
        <marker id={`${id}-arr`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 1 9 5 0 9z" className="srh-route__arrow" />
        </marker>
        <pattern id={`${id}-grid`} width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M42 0H0V42" className="srh-map__grid" />
        </pattern>
      </defs>
      <rect width={W} height={H} className="srh-map__sea" />
      <rect width={W} height={H} fill={`url(#${id}-grid)`} />
      <path d={landPath(prjMain, AFRICA_COAST, 'west')} className="srh-map__land srh-map__land--far" />
      <path d={landPath(prjMain, SINAI_COAST, 'west')} className="srh-map__land srh-map__land--far" />
      <path d={landPath(prjMain, ARABIA_COAST, 'east')} className="srh-map__land" />
      <text x={seaX} y={seaY} textAnchor="middle" className="srh-map__sea-label" transform={`rotate(-56 ${seaX} ${seaY})`}>{t.sea}</text>

      {/* Ətrafların böyüdülmüş çərçivələrinə aparan xətlər */}
      {Object.keys(INSETS).map(k => {
        const [ax, ay] = P(k)
        const [ox, oy] = insetOrigin(k)
        const pr = INSET_PRJ[k]
        const tx = INSETS[k].at === 'top-right' ? ox + pr.W / 2 : ox + pr.W
        const ty = INSETS[k].at === 'top-right' ? oy + pr.H + TITLE_H : oy + (pr.H + TITLE_H) / 2
        return <path key={k} d={`M${ax} ${ay} L${tx} ${ty}`} className="srh-map__leader" />
      })}

      <Route pts={route} id={id} />

      {/* Xəritədən kənar yerlər — kənarda ox */}
      {Object.entries(EDGE_AT).map(([pid, e]) => {
        const x = prjMain.p(MAIN_BOX.lat[1], e.lon)[0]
        const top = e.side === 'top'
        const y = top ? 4 : H - 4
        const on = active === pid || also.includes(pid)
        return (
          <g key={pid} className={`srh-edge${on ? ' is-active' : ''}`} data-place={pid} onClick={() => onPick(pid)}>
            <rect x={x - 12} y={top ? 0 : H - 30} width="120" height="30" className="srh-pt__hit" />
            <path d={top ? `M${x} ${y} l-5 9 h10 z` : `M${x} ${y} l-5 -9 h10 z`} className="srh-edge__arrow" />
            <text x={x + 10} y={top ? 14 : H - 7} className="srh-pt__label srh-edge__label">{name(pid, lang)}</text>
          </g>
        )
      })}

      {MAIN_PLACES.map(pid => {
        const [x, y] = P(pid)
        return <Marker key={pid} id={pid} x={x} y={y} lang={lang} active={active === pid} also={also.includes(pid)} onPick={onPick} />
      })}
      {/* Məkkə və Mədinə ətrafı — əsas xəritədə bir nöqtə */}
      {Object.keys(INSETS).map(k => {
        const [x, y] = P(k)
        const on = areaOf(active) === k
        const [anchor, dx, dy] = AREA_LABEL[k]
        return (
          <g key={k} className={`srh-pt srh-pt--area${on ? ' is-active' : ''}${also.some(a => areaOf(a) === k) ? ' is-also' : ''}`} data-place={k} onClick={() => onPick(k)}>
            <circle cx={x} cy={y} r="14" className="srh-pt__hit" />
            {on && <circle cx={x} cy={y} r="11" className="srh-pt__pulse" />}
            <circle cx={x} cy={y} r="6" className="srh-pt__dot" />
            <text x={x + dx} y={y + dy} textAnchor={anchor} className="srh-pt__label srh-pt__label--major">{name(k, lang)}</text>
          </g>
        )
      })}
      {Object.keys(INSETS).map(k => <Inset key={k} k={k} lang={lang} t={t} active={active} also={also} onPick={onPick} id={id} />)}

      <g className="srh-map__north" transform={`translate(${nx} ${ny})`}>
        <path d="M0-12 5 3 0 0-5 3z" />
        <text y="16" textAnchor="middle">{t.north}</text>
      </g>
    </svg>
  )
}

export default memo(SeerahMap)
