// ═══════════════════════════════════════════════════════
// TourButton — "Burada nə edə bilərəm?" düyməsi (bələdçi turu açır; utils/tour → openTour)
//
//   <TourButton />                       — ikincil kiçik düymə
//   <TourButton className="ui-btn ui-btn--ghost" />
//
// Ana səhifə və başqa yerlər üçün hazır giriş nöqtəsi. Prerender-də də eyni görünür
// (yaddaşdan heç nə oxumur). Tur TourHost-dadır (App.jsx).
// ═══════════════════════════════════════════════════════
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { openTour } from '../../utils/tour'
import Icon from '../Icon'

export const TOUR_BUTTON_LABEL = {
  az: 'Burada nə edə bilərəm?',
  en: 'What can I do here?',
  ru: 'Что здесь можно делать?',
  ar: 'ماذا يمكنني أن أفعل هنا؟',
  tr: 'Burada neler yapabilirim?',
}

export default function TourButton({ className = 'ui-btn ui-btn--secondary ui-btn--sm' }) {
  const { lang } = useLang()
  return (
    <button type="button" className={className} onClick={openTour} aria-haspopup="dialog" data-testid="tour-button">
      <Icon name="tour" size={16} className="ui-btn__icon" /> {pickUi(TOUR_BUTTON_LABEL, lang, 'en')}
    </button>
  )
}
