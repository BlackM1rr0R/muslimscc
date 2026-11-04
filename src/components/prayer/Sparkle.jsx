// Həndəsi parıltı — uğur anı (namaz qılındı, gün tamamlandı və s.).
// Yalnız səkkizguşəli ulduzlar; canlı varlıq / konfeti fiquru yoxdur.
// İstifadə: valideyn position:relative; <Sparkle key={n} /> — açar dəyişəndə yenidən partlayır.
import '../../styles/ToolsMotion.css'

const STAR = 'M12 0l2.6 6.1L21 3l-3.1 6.4L24 12l-6.1 2.6L21 21l-6.4-3.1L12 24l-2.6-6.1L3 21l3.1-6.4L0 12l6.1-2.6L3 3l6.4 3.1z'

export default function Sparkle({ count = 8, radius = 46 }) {
  return (
    <span className="tm-sparkle" aria-hidden="true">
      {Array.from({ length: count }, (_, k) => (
        <span key={k} className="tm-sparkle__p"
          style={{ '--a': `${(360 / count) * k + 12}deg`, '--k': k, '--r': `${radius + (k % 3) * 8}px` }}>
          <svg viewBox="0 0 24 24"><path d={STAR} fill="currentColor" /></svg>
        </span>
      ))}
    </span>
  )
}
