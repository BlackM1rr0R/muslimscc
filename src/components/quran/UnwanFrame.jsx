// ═══════════════════════════════════════════════════════
// Ünvan (təzhib) — surə adının qızılı ornamentli çərçivəsi (çap mushaflarındakı başlıq zolağı kimi)
//
//   <UnwanFrame><h1 …>سورة …</h1></UnwanFrame>
//
// Orijinal həndəsə (heç bir konkret mushafın naxışı köçürülməyib): iki xətli zolaq, ucları
// ogee qövslü "lövhə" kimi, ucda dördguşəli ulduz düyünü, ortada kiçik romb tacı.
// Beş SVG hissə (uc · uzanan orta · mərkəz düyünü · orta · uc) — orta hissə yalnız ENİNƏ uzanır
// (üfüqi xətlərin qalınlığı dəyişmir), uclar öz nisbətini saxlayır → istənilən endə iti.
// Uc və düyünün içi qonşu hissəyə 2 vahid daşır (overflow: visible) — kəsr enlərdə tikiş xətti görünmür.
// Çərçivə həmişə LTR düzülür (simmetrikdir), mətn öz istiqamətindədir — RTL təhlükəsiz.
//
// İlk görünüşdə çərçivə bir dəfə "çəkilir": data-draw → hooks/useReveal (ortaq utils/revealIO)
// data-draw-ready / data-drawn yazır; stillər styles/Unwan.css. Hərəkət azaldılıbsa
// useReveal heç nə etmir — çərçivə dərhal tam görünür.
// ═══════════════════════════════════════════════════════
import '../../styles/Unwan.css'

const CAP = (
  <>
    <path className="uw-fill" d="M50 10H48V9H31C25 9 21 17 16 24L9 32l7 8c5 7 9 15 15 15h17v-1h2Z" />
    <path className="uw-o" pathLength="1" d="M48 4H30C22 4 17 13 11 21L2.5 32 11 43c6 8 11 17 19 17h18" />
    <path className="uw-i" pathLength="1" d="M48 9H31C25 9 21 17 16 24L9 32l7 8c5 7 9 15 15 15h17" />
    <path className="uw-star" d="M26 25.5l1.6 4.9 4.9 1.6-4.9 1.6-1.6 4.9-1.6-4.9-4.9-1.6 4.9-1.6z" />
  </>
)

const MID = (
  <>
    <rect className="uw-fill" y="9" width="100" height="46" />
    <path className="uw-o" d="M0 4H100M0 60H100" />
    <path className="uw-i" d="M0 9H100M0 55H100" />
  </>
)

export default function UnwanFrame({ className = '', children }) {
  return (
    <div className={`uw ${className}`} data-draw="">
      <span className="uw-frame" aria-hidden="true">
        <svg className="uw-cap uw-cap--s" viewBox="0 0 48 64" focusable="false">{CAP}</svg>
        <svg className="uw-mid uw-mid--s" viewBox="0 0 100 64" preserveAspectRatio="none" focusable="false">{MID}</svg>
        <svg className="uw-knot" viewBox="0 0 40 64" focusable="false">
          <path className="uw-fill" d="M0 9H40V55H0ZM-1.5 10H41.5V54H-1.5Z" />
          <path className="uw-o" d="M0 4H13L20-1 27 4H40M0 60H13L20 65 27 60H40" />
          <path className="uw-i" d="M0 9H40M0 55H40" />
        </svg>
        <svg className="uw-mid uw-mid--e" viewBox="0 0 100 64" preserveAspectRatio="none" focusable="false">{MID}</svg>
        <svg className="uw-cap uw-cap--e" viewBox="0 0 48 64" focusable="false">{CAP}</svg>
      </span>
      <div className="uw-text">{children}</div>
    </div>
  )
}
