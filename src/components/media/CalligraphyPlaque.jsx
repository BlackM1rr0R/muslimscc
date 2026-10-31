import './media.css'

/* ═══════════════════════════════════════════════════════
   Xəttatlıq lövhəsi — səhabənin ərəbcə adı + "رضي الله عنه/عنها"
   Canlı təsvir YOXDUR (Sələf mənhəci): yalnız yazı və həndəsi bəzək.
   • fon: tünd zümrüd (--surface-inverse — hər iki rejimdə tünd), xatəm
     (8 guşəli ulduz) naxışı, qum-qızılı ikiqat çərçivə, künclərdə ulduz
   • yazı: Amiri (layihədə var), qum-qızılı; dua daha kiçik, ayırıcı ilə
   • variant: "card" (siyahı kartının üstü) · "hero" (profil başlığı)
   Bəzəkdir (aria-hidden): ad onsuz da başlıqda / kartda mətn kimi var.
   ═══════════════════════════════════════════════════════ */

// 8 guşəli ulduz (iki kvadrat) — künc bəzəyi
const Star = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 1.5l3.1 4.4 5.3-.3-.3 5.3L22.5 12l-4.4 3.1.3 5.3-5.3-.3L12 22.5l-3.1-4.4-5.3.3.3-5.3L1.5 12l4.4-3.1-.3-5.3 5.3.3z" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
)

export default function CalligraphyPlaque({ ar, female = false, variant = 'card', className = '' }) {
  const honor = female ? 'رَضِيَ اللهُ عَنْهَا' : 'رَضِيَ اللهُ عَنْهُ'
  // Uzun adlarda şrift bir az kiçilir (sətir sayı sabit qalsın)
  const len = [...String(ar || '')].length
  const size = len > 16 ? 'long' : len > 11 ? 'mid' : 'short'
  return (
    <span className={`cq cq--${variant} cq--${size}${className ? ` ${className}` : ''}`} aria-hidden="true">
      <span className="cq__pattern" />
      <span className="cq__frame" />
      <Star className="cq__corner cq__corner--tl" />
      <Star className="cq__corner cq__corner--tr" />
      <Star className="cq__corner cq__corner--bl" />
      <Star className="cq__corner cq__corner--br" />
      <span className="cq__text" lang="ar" dir="rtl">
        <span className="cq__name">{ar}</span>
        <span className="cq__rule"><Star className="cq__rule-star" /></span>
        <span className="cq__honor">{honor}</span>
      </span>
    </span>
  )
}
