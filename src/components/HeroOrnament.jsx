// ═══════════════════════════════════════════════════════
// HeroOrnament (v6.9) — "Nur xatəmi": səhifə başlıqlarında səkkizguşəli xatəm naxışı qızılı xətlə
// özünü çəkir (bir dəfə, ~4.5 s), sonra sakit qalır. Sahibin seçdiyi ana səhifə konseptindən (A).
//
//   <HeroOrnament />            — .ui-page-hero / .hp-hero-bg içində, dekorativ (aria-hidden)
//
// Yalnız SVG + CSS (stroke-dashoffset — kompozitor üçün yüngül), hərəkət azaldılıbsa — hazır naxış.
// Stillər: src/styles/HeroOrnament.css
// ═══════════════════════════════════════════════════════
import '../styles/HeroOrnament.css'

export default function HeroOrnament({ className = '' }) {
  return (
    <svg className={`hero-orn ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path pathLength="1" d="M50 6 L61 39 L94 50 L61 61 L50 94 L39 61 L6 50 L39 39 Z" />
      <path pathLength="1" className="b" d="M18.9 18.9 L50 30 L81.1 18.9 L70 50 L81.1 81.1 L50 70 L18.9 81.1 L30 50 Z" />
      <path pathLength="1" d="M50 22 A28 28 0 1 1 49.9 22 Z" />
      <path pathLength="1" className="t" d="M50 36 L54 46 L64 50 L54 54 L50 64 L46 54 L36 50 L46 46 Z" />
      <path pathLength="1" className="t" d="M50 1 A49 49 0 1 1 49.9 1 Z" />
    </svg>
  )
}
