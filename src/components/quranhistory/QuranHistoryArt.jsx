// ═══════════════════════════════════════════════════════
// /quran-history — mərhələlərin SVG təsvirləri (400×400, yalnız bəzək: aria-hidden)
//
// • Canlı varlıq YOXDUR: dağ, ulduzlar, hilal, səhifələr, qələm, mürəkkəb, xəritə nöqtələri.
// • Qradiyent/filtr yoxdur (eyni id-li <defs> iki SVG-də toqquşmasın; display:none SVG-də
//   qradiyent çəkilmir) — yalnız semantik rəng tokenləri: açıq və tünd mövzu avtomatik.
// • Hərəkət CSS-dədir (QuranHistoryPage.css): yalnız transform/opacity, "is-on" sinfi ilə.
// • Xəritə: real koordinatlar sadə ekvirektangulyar proyeksiya ilə; sahil xətləri sxematikdir.
// ═══════════════════════════════════════════════════════
import { QH_CITIES, QH_BY_ID } from '../../data/quranCompilation'

// Xəritə qutusu: uzunluq 34–50° Ş, enlik 19–35° Ş → 30…370 px
const LON0 = 34, LAT0 = 35, K = 340 / 16
export const project = ([lat, lon]) => [Math.round((30 + (lon - LON0) * K) * 10) / 10, Math.round((40 + (LAT0 - lat) * K) * 10) / 10]
const line = (pts) => 'M' + pts.map(p => project(p).join(' ')).join(' L')

// Sxematik sahillər (enlik, uzunluq)
const RED_SEA = line([[29.5, 34.9], [28.0, 34.8], [26.6, 36.2], [25.2, 37.2], [24.0, 38.2], [22.6, 39.0], [21.4, 39.2], [20.2, 40.1], [19.0, 41.0]])
const LEVANT = line([[35.0, 35.9], [33.9, 35.5], [33.0, 35.1], [32.1, 34.8], [31.3, 34.3]])
const GULF = line([[30.0, 47.9], [29.3, 48.1], [28.4, 48.6], [27.3, 49.5], [26.4, 50.0]])

// «Oxu!» — 96:1-in ilk sözü, saytın Quran mətnindən (əldən yazılmır)
const HIRA_IQRA = QH_BY_ID.hira.ayahs[0].ar.split(' ')[0]

function Hira() {
  return (
    <>
      <rect className="qh-a__sky" x="0" y="0" width="400" height="400" rx="28" />
      <g className="qh-a__stars">
        {[[46, 52, 1.6], [96, 128, 1.1], [150, 40, 1.3], [318, 60, 1.7], [356, 140, 1.1], [270, 112, 1.2], [210, 70, 0.9], [60, 190, 1], [340, 210, 0.9]]
          .map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      <path className="qh-a__moon" d="M330 92a26 26 0 1 1-22-40 21 21 0 1 0 22 40z" />
      <g className="qh-a__rays qh-a__mv">
        <path d="M232 214 150 120M236 212 208 104M242 212 268 104M246 214 330 128" />
      </g>
      <path className="qh-a__mount qh-a__mount--far" d="M0 330 70 270 130 296 196 236 260 290 330 250 400 300V400H0z" />
      <path className="qh-a__mount" d="M0 400V336L92 282 150 300 238 196 300 268 352 250 400 286V400z" />
      <path className="qh-a__cave" d="M226 226c3-9 9-14 14-14s11 5 13 14z" />
      <text className="qh-a__iqra qh-a__mv" x="200" y="176" textAnchor="middle" lang="ar">{HIRA_IQRA}</text>
    </>
  )
}

function Materials() {
  return (
    <>
      <rect className="qh-a__paper" x="0" y="0" width="400" height="400" rx="28" />
      {/* Xurma budağı (العسب) */}
      <g className="qh-a__mv qh-a__m1">
        <g transform="rotate(-18 120 130)">
          <path className="qh-a__stalk" d="M40 122c50-10 110-12 170-4l4 14c-60-8-118-6-172 4z" />
          <path className="qh-a__ink qh-a__ink--thin" d="M64 126h56M128 123h60" />
        </g>
      </g>
      {/* Nazik yastı daş (اللخاف) */}
      <g className="qh-a__mv qh-a__m2">
        <path className="qh-a__stone" d="M238 60c32-8 74 0 104 18 12 22 8 52-10 66-40 12-86 10-114-8-12-26-6-60 20-76z" />
        <path className="qh-a__ink" d="M246 92h76M240 108h88M252 124h64" />
      </g>
      {/* Kürək sümüyü (الأكتاف) */}
      <g className="qh-a__mv qh-a__m3">
        <path className="qh-a__bone" d="M64 222c44-8 92-4 120 8l-22 104c-30 8-60 6-82-6z" />
        <path className="qh-a__ink" d="M84 248h76M86 266h70M90 284h62M96 302h50" />
      </g>
      {/* Dəri/perqament parçası (الرقاع) */}
      <g className="qh-a__mv qh-a__m4">
        <path className="qh-a__leather" d="M220 200l120-6 6 12-4 10 6 14-4 12 6 16-6 14 4 12-122 6-4-14 4-10-6-14 4-14-4-12 4-16z" />
        <path className="qh-a__ink" d="M236 222h90M236 240h96M236 258h84M236 276h92" />
      </g>
      {/* Qamış qələm və mürəkkəb qabı */}
      <g className="qh-a__pen">
        <path d="M226 384 290 338l6 8-64 46z" />
        <path className="qh-a__nib" d="M290 338l16-8-10 16z" />
      </g>
      <path className="qh-a__inkpot" d="M318 372h44v-14c0-8-6-12-10-14h-24c-4 2-10 6-10 14z" />
    </>
  )
}

function Gather() {
  // Səpələnmiş parçalar bir yığına toplanır (CSS: --dx/--dy-dən yerinə)
  const bits = [[-120, -110, -14], [110, -120, 12], [-130, 30, 8], [128, 20, -10], [-60, 120, 18], [70, 126, -16]]
  return (
    <>
      <rect className="qh-a__paper" x="0" y="0" width="400" height="400" rx="28" />
      <g className="qh-a__bits">
        {bits.map(([dx, dy, r], i) => (
          <g key={i} className="qh-a__bit" style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, '--r': `${r}deg`, '--i': i }}>
            <rect x="170" y="182" width="60" height="36" rx="5" />
            <path className="qh-a__ink" d="M180 196h40M180 206h30" />
          </g>
        ))}
      </g>
      <g className="qh-a__stack qh-a__mv">
        <rect className="qh-a__sheet" x="120" y="150" width="160" height="120" rx="6" transform="rotate(-4 200 210)" />
        <rect className="qh-a__sheet" x="120" y="146" width="160" height="120" rx="6" transform="rotate(3 200 206)" />
        <rect className="qh-a__sheet qh-a__sheet--top" x="120" y="142" width="160" height="120" rx="6" />
        <path className="qh-a__ink" d="M140 168h120M140 184h120M140 200h120M140 216h96M140 232h110" />
        <path className="qh-a__cord" d="M120 202h160M200 142v120" />
        <circle className="qh-a__seal" cx="200" cy="202" r="11" />
      </g>
    </>
  )
}

function Suhuf() {
  const seals = [[90, 96], [200, 64], [310, 96]]
  return (
    <>
      <rect className="qh-a__paper" x="0" y="0" width="400" height="400" rx="28" />
      <path className="qh-a__path" d="M90 96Q145 52 200 64T310 96" />
      {seals.map(([x, y], i) => (
        <g key={i} className="qh-a__keeper" style={{ '--i': i }}>
          <circle cx={x} cy={y} r="22" />
          <text x={x} y={y + 7} textAnchor="middle">{i + 1}</text>
        </g>
      ))}
      {/* Sandıq və içindəki səhifələr */}
      <g className="qh-a__chest qh-a__mv">
        <rect className="qh-a__sheet" x="134" y="168" width="132" height="70" rx="4" transform="rotate(-5 200 200)" />
        <rect className="qh-a__sheet qh-a__sheet--top" x="134" y="164" width="132" height="70" rx="4" />
        <path className="qh-a__ink" d="M150 184h100M150 198h100M150 212h70" />
        <path className="qh-a__box" d="M100 236h200v96a14 14 0 0 1-14 14H114a14 14 0 0 1-14-14z" />
        <path className="qh-a__band" d="M100 268h200M168 236v110M232 236v110" />
        <rect className="qh-a__lock" x="186" y="260" width="28" height="24" rx="5" />
      </g>
    </>
  )
}

function MapArt({ lang }) {
  const o = project(QH_CITIES.madinah.at)
  const dests = ['makkah', 'sham', 'kufa', 'basra']
  return (
    <>
      <rect className="qh-a__sea" x="0" y="0" width="400" height="400" rx="28" />
      <path className="qh-a__coast" d={RED_SEA} />
      <path className="qh-a__coast" d={LEVANT} />
      <path className="qh-a__coast" d={GULF} />
      {dests.map((k, i) => {
        const [x, y] = project(QH_CITIES[k].at)
        return (
          <g key={k} className="qh-a__route" style={{ '--i': i, transformOrigin: `${o[0]}px ${o[1]}px` }}>
            <path d={`M${o[0]} ${o[1]} L${x} ${y}`} />
          </g>
        )
      })}
      {dests.map((k, i) => {
        const [x, y] = project(QH_CITIES[k].at)
        const below = k === 'makkah'
        return (
          <g key={k} className="qh-a__city" style={{ '--i': i }} data-city={k}>
            <g className="qh-a__book" style={{ transformOrigin: `${x}px ${y}px` }}>
              <path d={`M${x - 10} ${y - 8}q5-2 10 1q5-3 10-1v14q-5-2-10 1q-5-3-10-1z`} />
              <path className="qh-a__spine" d={`M${x} ${y - 7}v14`} />
            </g>
            <text x={x} y={below ? y + 26 : y - 14} textAnchor="middle">{(QH_CITIES[k].name[lang] || QH_CITIES[k].name.en)}</text>
          </g>
        )
      })}
      <g className="qh-a__origin">
        <circle cx={o[0]} cy={o[1]} r="9" />
        <text x={o[0] + 14} y={o[1] + 5} textAnchor="start">{QH_CITIES.madinah.name[lang] || QH_CITIES.madinah.name.en}</text>
      </g>
    </>
  )
}

function Mushaf() {
  return (
    <>
      <rect className="qh-a__paper" x="0" y="0" width="400" height="400" rx="28" />
      {/* Rəhlə (kitab altlığı) */}
      <path className="qh-a__stand" d="M110 360 290 280M290 360 110 280" />
      <g className="qh-a__open qh-a__mv">
        <path className="qh-a__page" d="M200 110c-34-16-82-22-130-14v190c48-8 96-2 130 14z" />
        <path className="qh-a__page" d="M200 110c34-16 82-22 130-14v190c-48-8-96-2-130 14z" />
        <path className="qh-a__frame" d="M84 110c38-6 74-2 104 10v162c-30-12-66-16-104-10zM316 110c-38-6-74-2-104 10v162c30-12 66-16 104-10z" />
        <path className="qh-a__ink" d="M98 140h80M98 158h80M98 176h80M98 194h80M98 212h80M98 230h80M98 248h64M222 140h80M222 158h80M222 176h80M222 194h80M222 212h80M222 230h80M238 248h64" />
        <circle className="qh-a__rosette" cx="200" cy="96" r="10" />
      </g>
      <g className="qh-a__glow">
        <circle cx="200" cy="96" r="22" />
      </g>
    </>
  )
}

const ART = { hira: Hira, materials: Materials, gather: Gather, suhuf: Suhuf, map: MapArt, mushaf: Mushaf }

/** Bir mərhələnin təsvir qatı (<g>) — səhnə SVG-sinin içində və ya tək SVG kimi. */
export function SceneArt({ scene, lang, on }) {
  const A = ART[scene.art]
  return (
    <g className={`qh-a qh-a--${scene.art}${on ? ' is-on' : ''}`} data-scene={scene.id}>
      {A ? <A lang={lang} /> : null}
    </g>
  )
}
