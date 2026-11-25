// Fırlanan rəqəmlər — geri sayım / saat üçün (dizayn v4).
// Hər simvol ayrı <span>-dadır; DƏYİŞƏN rəqəmin açarı (key) dəyişir və o
// yenidən qurularaq yuxarıdan "düşür" (ToolsMotion.css → .tm-roll__d).
// Ekran oxuyucu: inline-flex içində hər rəqəm ayrıca "söz" kimi oxunurdu
// ("1 1 : 2 0") — rəqəmlər aria-hidden, bütöv dəyər isə ui-sr-only mətnidir
// (a11y auditi 2026-11-25).
import '../../styles/ToolsMotion.css'

export default function RollingDigits({ value, className = '' }) {
  const s = value == null ? '' : String(value)
  return (
    <span className={`tm-roll${className ? ` ${className}` : ''}`}>
      <span className="ui-sr-only">{s}</span>
      {Array.from(s).map((ch, i) => (/\d/.test(ch)
        ? <span key={`${i}-${ch}`} className="tm-roll__d" aria-hidden="true">{ch}</span>
        : <span key={`s${i}`} className="tm-roll__s" aria-hidden="true">{ch}</span>))}
    </span>
  )
}
