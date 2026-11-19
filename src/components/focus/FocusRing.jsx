// Diqqət seansının sakit irəliləyiş halqası (/focus) — dekor (aria-hidden); vaxt mətni ayrıca, role="timer".
// Yalnız stroke-dashoffset dəyişir (saniyədə bir); "hərəkəti azalt"da keçid animasiyası yoxdur (CSS).
const R = 46
const C = 2 * Math.PI * R

export default function FocusRing({ value = 0, phase = 'focus', children }) {
  const v = Math.min(1, Math.max(0, value))
  return (
    <div className={`fx-ring fx-ring--${phase}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle className="fx-ring__track" cx="50" cy="50" r={R} />
        <circle className="fx-ring__bar" cx="50" cy="50" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - v)} transform="rotate(-90 50 50)" />
      </svg>
      <div className="fx-ring__center">{children}</div>
    </div>
  )
}
