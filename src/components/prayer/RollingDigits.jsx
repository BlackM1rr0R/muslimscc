// Fırlanan rəqəmlər — geri sayım / saat üçün (dizayn v4).
// Hər simvol ayrı <span>-dadır; DƏYİŞƏN rəqəmin açarı (key) dəyişir və o
// yenidən qurularaq yuxarıdan "düşür" (ToolsMotion.css → .tm-roll__d).
// Mətn (textContent) dəyişmir — ekran oxuyucu və testlər eyni sətri görür.
import '../../styles/ToolsMotion.css'

export default function RollingDigits({ value, className = '' }) {
  const s = value == null ? '' : String(value)
  return (
    <span className={`tm-roll${className ? ` ${className}` : ''}`}>
      {Array.from(s).map((ch, i) => (/\d/.test(ch)
        ? <span key={`${i}-${ch}`} className="tm-roll__d">{ch}</span>
        : <span key={`s${i}`} className="tm-roll__s">{ch}</span>))}
    </span>
  )
}
