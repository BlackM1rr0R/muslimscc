// ═══════════════════════════════════════════════════════
// "Kart yarat" düyməsi — istənilən ayə / hədis / mətni sitat kartı
// generatorunda (/quotes) açır. Həqiqi <a href> (PageLink nümunəsi):
// Ctrl/orta klik yeni tabda açır, adi klik SPA ilə keçir.
//
// İstifadə (mətn heç vaxt yaddaşdan yazılmır — mənbədən götürülür):
//   <ShareCardButton ayah="2:255" />                 — ayə API-dən gətirilir
//   <ShareCardButton hadith={h.id} />               — hədis bazasından id ilə
//   <ShareCardButton text={t} ar={ar} src="Buxari 1" /> — sərbəst mətn
//   əlavə: tpl="night" fmt="story" variant="icon" | "button" (susma)
// ═══════════════════════════════════════════════════════
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import { isPlainClick } from './PageLink'
import { buildQuery } from './quote/content'
import Icon from './Icon'

const LABEL = {
  az: 'Kart yarat',
  en: 'Create card',
  ru: 'Создать карточку',
  ar: 'إنشاء بطاقة',
  tr: 'Kart oluştur',
}

export default function ShareCardButton({ ayah, hadith, text, ar, src, tpl, fmt, variant = 'button', className = '' }) {
  const { lang } = useLang()
  const navigate = useNavigate()
  const label = LABEL[lang] || LABEL.en
  const href = pathFor('quotes', lang) + buildQuery({ ayah, hadith, text, ar, src, tpl, fmt })

  const onClick = (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    window.scrollTo(0, 0)
  }

  if (variant === 'icon') {
    return (
      <a href={href} onClick={onClick} className={`ui-icon-btn ${className}`.trim()} aria-label={label} title={label}>
        <Icon name="image" size={18} />
      </a>
    )
  }
  return (
    <a href={href} onClick={onClick} className={`ui-btn ui-btn--secondary ui-btn--sm ${className}`.trim()}>
      <Icon name="image" className="ui-btn__icon" /> {label}
    </a>
  )
}
