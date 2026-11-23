// ═══════════════════════════════════════════════════════
// TourOffer — ilk gəlişdə BİR DƏFƏ "Saytla 1 dəqiqədə tanış olun?" kartı (TourHost açır)
//
// • Məzmunu bağlamır: kiçik üzən kart (dialoq deyil, fokus oğurlamır), promptCoordinator
//   slotu ilə — quraşdırma banneri / bildiriş / elan ilə eyni anda çıxmır ("xahiş" tipli).
// • Göstərilən kimi "qm_tour_v1".offered = true — bir daha təklif olunmur.
//   "Xeyr, sağ olun" → dismissed (həmişəlik). Tur hər zaman "Burada nə edə bilərəm?" düyməsindən açılır.
// • Ekran oxuyucu: görünəndə status sətri bir dəfə oxunur (boş role="alert" yoxdur).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { usePromptSlot, engagedMs } from '../../utils/promptCoordinator'
import { writeTourState } from '../../utils/tour'
import Icon from '../Icon'
import '../../styles/DiscoverTour.css'

const T = {
  az: { title: 'Saytda yenisiniz?', text: 'Bir dəqiqəlik tur əsas imkanları göstərir: axtarış, menyu, namaz vaxtları, Quran və daha çoxu.', start: 'Turu başlat', no: 'Xeyr, sağ olun', later: 'Turu istənilən vaxt «Burada nə edə bilərəm?» düyməsindən aça bilərsiniz.', close: 'Bağla' },
  en: { title: 'New here?', text: 'A one-minute tour shows the main things you can do: search, the menu, prayer times, the Quran and more.', start: 'Start the tour', no: 'No, thanks', later: 'You can open the tour any time from the “What can I do here?” button.', close: 'Close' },
  ru: { title: 'Вы здесь впервые?', text: 'Тур на одну минуту покажет главное: поиск, меню, время намаза, Коран и многое другое.', start: 'Начать тур', no: 'Нет, спасибо', later: 'Тур можно открыть в любое время кнопкой «Что здесь можно делать?».', close: 'Закрыть' },
  ar: { title: 'جديد هنا؟', text: 'جولة مدتها دقيقة تعرض أهم ما يمكنك فعله: البحث والقائمة ومواقيت الصلاة والقرآن وغير ذلك.', start: 'ابدأ الجولة', no: 'لا، شكرًا', later: 'يمكنك فتح الجولة في أي وقت من زر «ماذا يمكنني أن أفعل هنا؟».', close: 'إغلاق' },
  tr: { title: 'Burada yeni misiniz?', text: 'Bir dakikalık tur temel imkânları gösterir: arama, menü, namaz vakitleri, Kur’an ve dahası.', start: 'Turu başlat', no: 'Hayır, teşekkürler', later: 'Turu istediğiniz zaman “Burada neler yapabilirim?” düğmesinden açabilirsiniz.', close: 'Kapat' },
}

// Səhifədə ən azı bu qədər görünən vaxt keçsin (fon tabı sayılmır)
const MIN_ENGAGED_MS = 5000

// Açıq (görünən) modal dialoq varsa gözlə. Bağlı çəkmə menyu da DOM-da role="dialog" ilə qalır
// (visibility: hidden) — ona görə yalnız görünənlər sayılır.
const openModal = () => [...document.querySelectorAll('[role="dialog"][aria-modal="true"], dialog[open]')]
  .some((el) => el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden')

const eligible = () => engagedMs() >= MIN_ENGAGED_MS && !openModal()

export default function TourOffer({ onStart, onDismiss }) {
  const { lang, dir } = useLang()
  const t = pickUi(T, lang, 'en')
  const [shown, hide] = usePromptSlot('tour', eligible, { ask: true })
  const marked = useRef(false)

  useEffect(() => {
    if (shown && !marked.current) { marked.current = true; writeTourState({ offered: true }) }
  }, [shown])

  if (!shown) return null
  const start = () => { hide(); onStart() }
  const no = () => { writeTourState({ offered: true, dismissed: true }); hide(); onDismiss() }
  const close = () => { hide(); onDismiss() }

  return (
    <section className="tour-offer" aria-labelledby="tour-offer-ttl" dir={dir || (lang === 'ar' ? 'rtl' : 'ltr')} data-testid="tour-offer">
      <p className="ui-sr-only" role="status">{t.title}</p>
      <span className="ui-icon-tile ui-icon-tile--accent tour-offer__ic" aria-hidden="true"><Icon name="tour" /></span>
      <div className="tour-offer__body">
        <h2 id="tour-offer-ttl" className="tour-offer__title">{t.title}</h2>
        <p className="tour-offer__text">{t.text}</p>
        <div className="tour-offer__actions">
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={start} aria-haspopup="dialog">{t.start}</button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={no}>{t.no}</button>
        </div>
        <p className="tour-offer__later">{t.later}</p>
      </div>
      <button type="button" className="ui-icon-btn tour-offer__x" onClick={close} aria-label={t.close} title={t.close}><Icon name="close" size={18} /></button>
    </section>
  )
}
