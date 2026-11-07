// Sayılaraq dəyişən rəqəm (dizayn v4): dəyər dəyişəndə əvvəlki dəyərdən
// yenisinə ~700ms ərzində "axır". Son mətn həmişə format(value)-dur.
// Hərəkət azaldılıbsa / tab gizlidirsə dərhal yeni dəyər göstərilir.
import { useEffect, useRef, useState } from 'react'

function reduced() {
  try {
    // v5.5: zəif cihazda da sayılır (ucuzdur) — yalnız istifadəçi seçimi söndürür
    return document.documentElement.classList.contains('a11y-motion-user') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch { return true }
}

export default function TweenNumber({ value, format = (n) => String(n), duration = 700, className }) {
  const v = Number.isFinite(value) ? value : 0
  const [shown, setShown] = useState(v)
  const from = useRef(v)
  const raf = useRef(0)

  useEffect(() => {
    cancelAnimationFrame(raf.current)
    const start = from.current
    if (start === v || reduced() || document.hidden) { from.current = v; setShown(v); return }
    const t0 = performance.now()
    const ease = (t) => 1 - Math.pow(1 - t, 4)
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration)
      const cur = t >= 1 ? v : start + (v - start) * ease(t)
      from.current = cur
      setShown(cur)
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [v, duration])

  return <span className={className}>{format(shown === v ? v : shown)}</span>
}
