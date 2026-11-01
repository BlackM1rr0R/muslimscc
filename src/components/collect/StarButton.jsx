import Icon from '../Icon'
import './collect.css'

/* Seçilmişlərə əlavə et / çıxar — ulduz düyməsi (44px toxunma hədəfi).
   label — ekran oxuyucu üçün (məs. "Seçilmişlərə əlavə et"),
   aria-pressed vəziyyəti göstərir. */
export default function StarButton({ on, onToggle, label, className = '', size = 18 }) {
  return (
    <button
      type="button"
      className={`ui-icon-btn cl-star${on ? ' is-on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle() }}
    >
      <Icon name="star" size={size} />
    </button>
  )
}

/* Kiçik "kopyalandı / paylaşıldı" bildirişi üçün status mətni */
export function CopyStatus({ text }) {
  return <span className="cl-status" role="status" aria-live="polite">{text}</span>
}
