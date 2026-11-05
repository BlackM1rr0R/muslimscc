// ═══════════════════════════════════════════════════════
// InkText — ərəbcə mətn "qələmlə yazılır": hər hərfin konturu çəkilir,
// sonra mürəkkəb dolur (Amiri şriftinin öz konturları — uydurma xətt yox).
//
//   <InkText text="ٱلرَّحْمَٰنُ" className="names-modal-ar" />
//
// • SVG <text> + stroke-dasharray (bir dəfəlik — DESIGN.md §7.3 sonsuz deyil).
// • Ölçü şrift yükləndikdən sonra getBBox() ilə — viewBox mətnə tam oturur.
// • Əlçatanlıq: əsl mətn ekran oxuyucusu üçün ayrıca, SVG aria-hidden.
// • "Hərəkəti azalt" — animasiya yox, dərhal dolu (CSS).
// Stillər: src/styles/InkText.css
// ═══════════════════════════════════════════════════════
import { useLayoutEffect, useRef, useState } from 'react'
import '../styles/InkText.css'

const FS = 100     // istifadəçi vahidində şrift ölçüsü
const PAD = 14

export default function InkText({ text, className = '', as: Tag = 'p' }) {
  const textRef = useRef(null)
  const [vb, setVb] = useState(null)

  useLayoutEffect(() => {
    let alive = true
    const measure = () => {
      const el = textRef.current
      if (!el || !alive) return
      try {
        const b = el.getBBox()
        if (b.width > 0) setVb(`${(b.x - PAD).toFixed(1)} ${(b.y - PAD).toFixed(1)} ${(b.width + PAD * 2).toFixed(1)} ${(b.height + PAD * 2).toFixed(1)}`)
      } catch { /* SVG ölçülmədi — adi mətn qalır */ }
    }
    measure()
    // Amiri gec yüklənərsə — yenidən ölç (ehtiyat şriftin ölçüsü fərqlidir)
    document.fonts?.load?.(`400 ${FS}px Amiri`, text).then(measure, () => {})
    return () => { alive = false }
  }, [text])

  return (
    <Tag className={`ink ${vb ? 'is-ready' : ''} ${className}`} lang="ar" dir="rtl">
      <span className="ink__text">{text}</span>
      <svg className="ink__svg" viewBox={vb || `0 -${FS} ${FS * 4} ${FS * 1.6}`} aria-hidden="true" focusable="false">
        <text ref={textRef} x="0" y="0" fontSize={FS} className="ink__glyphs">{text}</text>
      </svg>
    </Tag>
  )
}
