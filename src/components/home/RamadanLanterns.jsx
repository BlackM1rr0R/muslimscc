// ═══════════════════════════════════════════════════════
// RamadanLanterns — Ramazanda ana səhifənin hero-sunda asılı fənərlər (dekor)
// Yalnız html[data-season="ramadan"] olanda görünür (utils/wow.js mövsümü
// hicri tarixdən qoyur; sınaq: ?season=ramadan). Yellənmə yalnız transform.
// ═══════════════════════════════════════════════════════
import '../../styles/RamadanLanterns.css'

const Lantern = ({ cls }) => (
  <span className={`rl ${cls}`}>
    <span className="rl__cord" />
    <svg className="rl__svg" viewBox="0 0 40 74" focusable="false">
      <path className="rl__metal" d="M14 6h12l-2 6H16z" />
      <circle className="rl__metal" cx="20" cy="4" r="3" fill="none" strokeWidth="1.6" />
      <path className="rl__glass" d="M12 14h16l6 12v20l-6 12H12L6 46V26z" />
      <path className="rl__frame" d="M12 14h16l6 12v20l-6 12H12L6 46V26zM20 14v44M6 26h28M6 46h28" fill="none" />
      <ellipse className="rl__flame" cx="20" cy="38" rx="3.2" ry="5.5" />
      <path className="rl__metal" d="M13 58h14l-3 6h-8zM18 64h4l-2 8z" />
    </svg>
  </span>
)

export default function RamadanLanterns() {
  return (
    <div className="rl-wrap" aria-hidden="true">
      <Lantern cls="rl--1" />
      <Lantern cls="rl--2" />
      <Lantern cls="rl--3" />
    </div>
  )
}
