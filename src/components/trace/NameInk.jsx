// ═══════════════════════════════════════════════════════
// NameInk (v7) — ad ərəbcə "qələmlə yazılır": SVG maska sağdan sola açılır,
// eyni anda hərflərin konturu çəkilir və mürəkkəb dolur; qələm ucu yazının
// önündə gedir. InkText-in yanaşması (getBBox ilə ölçü), amma seçilən şriftlə.
//   <NameInk text="محمد" family="'Aref Ruqaa', serif" weight={400} />
// • key dəyişəndə animasiya yenidən oynayır. "Hərəkəti azalt" — dərhal hazır.
// • Əsl mətn ekran oxuyucusu üçün ayrıca; SVG aria-hidden.
// ═══════════════════════════════════════════════════════
import { useId, useLayoutEffect, useRef, useState } from 'react'

const FS = 100, PAD = 16

export default function NameInk({ text, family, weight = 400 }) {
  const ref = useRef(null)
  const mid = `nm${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    let alive = true
    const measure = () => {
      const el = ref.current
      if (!el || !alive) return
      try {
        const b = el.getBBox()
        if (b.width > 0) setBox({ x: b.x, y: b.y, w: b.width, h: b.height })
      } catch { /* ölçülmədi — adi mətn qalır */ }
    }
    measure()
    const fam = (family.match(/'([^']+)'/) || [])[1]
    if (fam && document.fonts?.load) document.fonts.load(`${weight} ${FS}px "${fam}"`, text).then(measure, () => {})
    return () => { alive = false }
  }, [text, family, weight])

  const n = Array.from(text.replace(/\s/g, '')).length
  const dur = Math.min(4.6, Math.max(1.6, 1 + n * 0.32))
  const vb = box ? `${(box.x - PAD).toFixed(1)} ${(box.y - PAD).toFixed(1)} ${(box.w + PAD * 2).toFixed(1)} ${(box.h + PAD * 2).toFixed(1)}` : `0 -${FS} ${FS * 4} ${FS * 1.6}`
  return (
    <div className={`nink${box ? ' is-ready' : ''}`} lang="ar" dir="rtl" style={{ '--nink-dur': `${dur}s` }}>
      <span className="ui-sr-only">{text}</span>
      <svg className="nink__svg" viewBox={vb} aria-hidden="true" focusable="false">
        {box && (
          <defs>
            <mask id={mid} maskUnits="userSpaceOnUse" x={box.x - PAD} y={box.y - PAD} width={box.w + PAD * 2} height={box.h + PAD * 2}>
              <rect className="nink__sweep" x={box.x - PAD} y={box.y - PAD} width={box.w + PAD * 2} height={box.h + PAD * 2} fill="#fff" />
            </mask>
          </defs>
        )}
        <g mask={box ? `url(#${mid})` : undefined}>
          <text ref={ref} x="0" y="0" fontSize={FS} className="nink__glyphs" style={{ fontFamily: family, fontWeight: weight }}>{text}</text>
        </g>
        {box && (
          <g className="nink__pen" style={{ '--nink-w': `${box.w}px` }}>
            <circle cx={box.x + box.w} cy={box.y + box.h * 0.55} r="5.5" />
          </g>
        )}
      </svg>
    </div>
  )
}
