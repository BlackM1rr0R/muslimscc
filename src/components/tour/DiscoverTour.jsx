// ═══════════════════════════════════════════════════════
// DiscoverTour — "Kəşf et": 60 saniyəlik bələdçi tur (tənbəl chunk; TourHost açır)
//
// • Addımlar saytın HƏQİQİ elementlərini göstərir (işıq ləkəsi + izah kartı): axtarış (Ctrl+K),
//   yan menyunun qrupları, namaz vaxtları, Quran, hesab/sinxronizasiya, əlçatanlıq paneli,
//   "Yeniliklər". Element bu ekranda yoxdursa (telefon, ölçü) — növbəti seçici, o da yoxdursa
//   kart ortada (telefonda aşağıda) göstərilir. Telefonda çox şey ☰ menyusundadır.
// • Son addım: 3 təklif — yalnız yerli siqnallarla (utils/tour → suggestFeatures). Heç nə
//   göndərilmir, analitika yoxdur.
// • Əlçatanlıq: role="dialog" + aria-modal, hər addımda fokus başlığa keçir (ekran oxuyucu
//   başlığı və "Addım 2 / 9" oxuyur), Tab kartın içində qalır, Esc bağlayır, bağlananda fokus
//   açan düyməyə qayıdır. Oxlar: irəli/geri (ərəbcədə güzgülü). 360px-də aşağı vərəq.
// • Hərəkət: yalnız transform/opacity keçidləri; "hərəkəti azalt"da yoxdur (CSS).
// • Ölçü: hədəf yalnız addım dəyişəndə və resize/scroll-da rAF ilə bir dəfə ölçülür.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { navLabel } from '../../data/navigation'
import { pathFor } from '../../seo/routes'
import { suggestFeatures, storageGetter, writeTourState } from '../../utils/tour'
import Icon, { hasIcon } from '../Icon'
import '../../styles/DiscoverTour.css'

// Addımlar — hədəf seçiciləri sıra ilə yoxlanır (ilk görünən götürülür)
export const TOUR_STEPS = [
  { id: 'welcome', icon: 'compass', targets: [] },
  { id: 'search', icon: 'search', targets: ['.qm-sn--rail .qm-sn-search', '.header .nav-search-btn'] },
  { id: 'menu', icon: 'list', targets: ['.qm-sn--rail .qm-sn-body', '.header .hdr-burger'] },
  { id: 'prayer', icon: 'prayer', targets: ['.header .hdr-ring', '.qm-sn--rail a.qm-sn-item[href$="/prayer"]', '.header .nav-desktop a[href$="/prayer"]'] },
  { id: 'quran', icon: 'quran', targets: ['.header .nav-desktop a[href$="/quran"]', '.qm-sn--rail a.qm-sn-item[href$="/quran"]', '.header .hdr-burger'] },
  { id: 'account', icon: 'user', targets: ['.header .hdr-account', '.qm-sn--rail .qm-sn-account', '.header .hdr-burger'] },
  { id: 'a11y', icon: 'a11y', targets: ['.qm-dock-toggle', '.header .hdr-burger'] },
  { id: 'whatsnew', icon: 'whatsnew', targets: ['.qm-sn--rail a.qm-sn-item[href$="/whats-new"]', '.header .hdr-burger'] },
  { id: 'finish', icon: 'sparkle', targets: [] },
]

export const TOUR_TEXT = {
  az: {
    label: 'Saytla tanışlıq turu',
    step: (i, n) => `Addım ${i} / ${n}`,
    next: 'Növbəti', back: 'Geri', skip: 'Turu ötür', done: 'Bitir', close: 'Turu bağla',
    suggest: 'Sizə uyğun ola bilər',
    private: 'Təkliflər yalnız bu cihazdakı qeydlərə əsaslanır — heç nə göndərilmir.',
    welcome: { t: 'Xoş gəlmisiniz!', d: 'Bu bir dəqiqəlik tur saytda nə edə biləcəyinizi göstərir. «Növbəti» və «Geri» ilə keçin; istənilən vaxt Esc ilə çıxa bilərsiniz.' },
    search: { t: 'Hər şeyi axtarın', d: 'Ayə, hədis, dua, Allahın adları və bölmələr bir yerdə axtarılır. Klaviaturada: Ctrl+K və ya «/».' },
    menu: { t: 'Bütün bölmələr menyudadır', d: 'Quran, hədis, namaz, dua, Həcc, zəkat və digərləri qruplar üzrə yan menyudadır. Telefonda onu menyu düyməsi ilə açın.' },
    prayer: { t: 'Namaz vaxtları', d: 'Şəhərinizin namaz vaxtları; başlıqdakı halqa növbəti namaza qalan vaxtı göstərir.' },
    quran: { t: 'Quran', d: 'Tərcümə, təfsir və qiraətlə oxuyun, dinləyin — oxuduğunuz yer yadda qalır.' },
    account: { t: 'Hesab və sinxronizasiya', d: 'İstəsəniz daxil olun: irəliləyişiniz cihazlar arasında şifrəli şəkildə keçir. Hesabsız da hər şey işləyir. Telefonda menyudadır.' },
    a11y: { t: 'Əlçatanlıq', d: 'Az görmə, disleksiya və sakit oxu üçün hazır profillər, yazı ölçüsü, kontrast və hərəkət ayarları. Telefonda menyudadır.' },
    whatsnew: { t: 'Yeniliklər', d: 'Yeni bölmələrin menyuda «Yeni» nişanı olur. «Yeniliklər» səhifəsi hamısını tarix sırası ilə göstərir.' },
    finish: { t: 'Hazırdır!', d: 'Tur bitdi. Buradan başlaya bilərsiniz:' },
  },
  en: {
    label: 'Site tour',
    step: (i, n) => `Step ${i} of ${n}`,
    next: 'Next', back: 'Back', skip: 'Skip tour', done: 'Finish', close: 'Close the tour',
    suggest: 'You might like',
    private: 'Suggestions are based only on what is stored on this device — nothing is sent anywhere.',
    welcome: { t: 'Welcome!', d: 'This one-minute tour shows what you can do on the site. Use Next and Back; press Esc to leave at any time.' },
    search: { t: 'Search everything', d: 'Verses, hadith, duas, the names of Allah and site sections are searched together. On a keyboard: Ctrl+K or “/”.' },
    menu: { t: 'Every section is in the menu', d: 'Quran, hadith, prayer, duas, Hajj, zakat and more are grouped in the side menu. On a phone, open it with the menu button.' },
    prayer: { t: 'Prayer times', d: 'Prayer times for your city; the ring in the header counts down to the next prayer.' },
    quran: { t: 'The Quran', d: 'Read and listen with translation, tafsir and recitation — your place is remembered.' },
    account: { t: 'Account and sync', d: 'Sign in if you like: your progress moves between devices, encrypted. Everything works without an account too. On a phone it is in the menu.' },
    a11y: { t: 'Accessibility', d: 'Ready profiles for low vision, dyslexia and calm reading, plus text size, contrast and motion settings. On a phone it is in the menu.' },
    whatsnew: { t: 'What’s new', d: 'New sections carry a “New” badge in the menu. The What’s new page lists everything by date.' },
    finish: { t: 'All set!', d: 'The tour is over. Here is where you could start:' },
  },
  ru: {
    label: 'Тур по сайту',
    step: (i, n) => `Шаг ${i} из ${n}`,
    next: 'Далее', back: 'Назад', skip: 'Пропустить тур', done: 'Готово', close: 'Закрыть тур',
    suggest: 'Вам может подойти',
    private: 'Предложения основаны только на данных этого устройства — ничего никуда не отправляется.',
    welcome: { t: 'Добро пожаловать!', d: 'Этот тур на одну минуту покажет, что можно делать на сайте. Листайте кнопками «Далее» и «Назад»; выйти можно в любой момент клавишей Esc.' },  // lang-ok[Esc]: klaviatura düyməsinin adı
    search: { t: 'Ищите всё', d: 'Аяты, хадисы, дуа, имена Аллаха и разделы сайта ищутся вместе. С клавиатуры: Ctrl+K или «/».' },  // lang-ok[Ctrl,K]: klaviatura qısayolu
    menu: { t: 'Все разделы — в меню', d: 'Коран, хадисы, намаз, дуа, хадж, закят и другое сгруппированы в боковом меню. На телефоне откройте его кнопкой меню.' },
    prayer: { t: 'Время намаза', d: 'Время намаза для вашего города; кольцо в шапке отсчитывает время до следующего намаза.' },
    quran: { t: 'Коран', d: 'Читайте и слушайте с переводом, тафсиром и чтецами — место чтения запоминается.' },
    account: { t: 'Аккаунт и синхронизация', d: 'Войдите, если хотите: прогресс переносится между устройствами в зашифрованном виде. Без аккаунта тоже всё работает. На телефоне — в меню.' },
    a11y: { t: 'Доступность', d: 'Готовые профили для слабого зрения, дислексии и спокойного чтения, а также размер текста, контраст и движение. На телефоне — в меню.' },
    whatsnew: { t: 'Что нового', d: 'У новых разделов в меню есть метка «Новое». Страница «Что нового» показывает всё по датам.' },
    finish: { t: 'Готово!', d: 'Тур окончен. Можно начать отсюда:' },
  },
  ar: {
    label: 'جولة في الموقع',
    step: (i, n) => `الخطوة ${i} من ${n}`,
    next: 'التالي', back: 'السابق', skip: 'تخطَّ الجولة', done: 'إنهاء', close: 'أغلق الجولة',
    suggest: 'قد يعجبك',
    private: 'الاقتراحات مبنية على ما هو محفوظ في هذا الجهاز فقط — لا يُرسَل أي شيء.',
    welcome: { t: 'أهلًا بك!', d: 'تعرض هذه الجولة القصيرة ما يمكنك فعله في الموقع. تنقّل بـ«التالي» و«السابق»، واضغط Esc للخروج في أي وقت.' },  // lang-ok[Esc]: klaviatura düyməsinin adı
    search: { t: 'ابحث في كل شيء', d: 'الآيات والأحاديث والأدعية وأسماء الله وأقسام الموقع يُبحث فيها معًا. من لوحة المفاتيح: Ctrl+K أو «/».' },  // lang-ok[Ctrl,K]: klaviatura qısayolu
    menu: { t: 'كل الأقسام في القائمة', d: 'القرآن والحديث والصلاة والأدعية والحج والزكاة وغيرها مجمّعة في القائمة الجانبية. على الهاتف افتحها بزر القائمة.' },
    prayer: { t: 'مواقيت الصلاة', d: 'مواقيت الصلاة لمدينتك، والحلقة في أعلى الصفحة تعدّ الوقت المتبقي للصلاة القادمة.' },
    quran: { t: 'القرآن الكريم', d: 'اقرأ واستمع مع الترجمة والتفسير والتلاوة — ويُحفظ موضع قراءتك.' },
    account: { t: 'الحساب والمزامنة', d: 'سجّل الدخول إن شئت: ينتقل تقدّمك بين أجهزتك مشفّرًا. وكل شيء يعمل دون حساب أيضًا. على الهاتف تجده في القائمة.' },
    a11y: { t: 'إمكانية الوصول', d: 'ملفات جاهزة لضعف البصر وعسر القراءة والقراءة الهادئة، مع حجم الخط والتباين والحركة. على الهاتف تجدها في القائمة.' },
    whatsnew: { t: 'ما الجديد', d: 'الأقسام الجديدة تحمل شارة «جديد» في القائمة، وصفحة «ما الجديد» تعرض كل شيء بالتاريخ.' },
    finish: { t: 'انتهينا!', d: 'انتهت الجولة. يمكنك أن تبدأ من هنا:' },
  },
  tr: {
    label: 'Site turu',
    step: (i, n) => `Adım ${i} / ${n}`,
    next: 'İleri', back: 'Geri', skip: 'Turu geç', done: 'Bitir', close: 'Turu kapat',
    suggest: 'Hoşunuza gidebilir',
    private: 'Öneriler yalnızca bu cihazda kayıtlı olanlara dayanır — hiçbir şey gönderilmez.',
    welcome: { t: 'Hoş geldiniz!', d: 'Bu bir dakikalık tur sitede neler yapabileceğinizi gösterir. “İleri” ve “Geri” ile ilerleyin; istediğiniz an Esc ile çıkabilirsiniz.' },
    search: { t: 'Her şeyi arayın', d: 'Ayetler, hadisler, dualar, Allah’ın isimleri ve site bölümleri birlikte aranır. Klavyede: Ctrl+K veya “/”.' },
    menu: { t: 'Bütün bölümler menüde', d: 'Kur’an, hadis, namaz, dua, hac, zekât ve dahası yan menüde gruplanmıştır. Telefonda menü düğmesiyle açın.' },
    prayer: { t: 'Namaz vakitleri', d: 'Şehrinizin namaz vakitleri; başlıktaki halka sıradaki namaza kalan süreyi gösterir.' },
    quran: { t: 'Kur’an', d: 'Meal, tefsir ve tilavetle okuyun, dinleyin — kaldığınız yer hatırlanır.' },
    account: { t: 'Hesap ve eşitleme', d: 'İsterseniz giriş yapın: ilerlemeniz cihazlar arasında şifreli taşınır. Hesapsız da her şey çalışır. Telefonda menüdedir.' },
    a11y: { t: 'Erişilebilirlik', d: 'Az görme, disleksi ve sakin okuma için hazır profiller; yazı boyutu, kontrast ve hareket ayarları. Telefonda menüdedir.' },
    whatsnew: { t: 'Yenilikler', d: 'Yeni bölümlerin menüde “Yeni” etiketi olur. Yenilikler sayfası hepsini tarih sırasıyla gösterir.' },
    finish: { t: 'Hazır!', d: 'Tur bitti. Buradan başlayabilirsiniz:' },
  },
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
const PAD = 6          // işıq ləkəsinin hədəf ətrafında boşluğu
const GAP = 14         // kartla hədəf arası
const CARD_W = 360
const NARROW = 640     // bundan dar ekranda kart aşağı vərəqdir

/** Elementin ölçüsü var və gizli deyil? */
function isShown(el) {
  if (!el || !el.getClientRects().length) return false
  const st = window.getComputedStyle(el)
  return st.visibility !== 'hidden' && st.display !== 'none'
}

/** Seçicilərdən ilk görünən element */
export function findTarget(selectors) {
  for (const sel of selectors) {
    let list = []
    try { list = document.querySelectorAll(sel) } catch { list = [] }
    for (const el of list) if (isShown(el)) return el
  }
  return null
}

/** Kartın mövqeyi (fixed, fiziki koordinatlar) — hədəfə görə */
function placeCard(rect, vw, vh, cardH) {
  if (vw < NARROW) {
    // Telefon: aşağı vərəq; hədəf aşağı yarıdadırsa — yuxarıda
    return rect && rect.y + rect.h / 2 > vh / 2 ? { mode: 'sheet-top' } : { mode: 'sheet' }
  }
  if (!rect) return { mode: 'center' }
  const w = Math.min(CARD_W, vw - 24)
  const h = cardH || 280
  const cx = Math.min(Math.max(rect.x + rect.w / 2 - w / 2, 12), vw - w - 12)
  if (rect.y + rect.h + GAP + h <= vh - 12) return { mode: 'pos', left: cx, top: rect.y + rect.h + GAP }
  if (rect.y - GAP - h >= 12) return { mode: 'pos', left: cx, top: rect.y - GAP - h }
  const top = Math.min(Math.max(rect.y + rect.h / 2 - h / 2, 12), vh - h - 12)
  if (vw - (rect.x + rect.w) >= w + GAP + 12) return { mode: 'pos', left: rect.x + rect.w + GAP, top }
  if (rect.x >= w + GAP + 12) return { mode: 'pos', left: rect.x - GAP - w, top }
  return { mode: 'center' }
}

export default function DiscoverTour({ onClose, onFinish, setPage }) {
  const { lang, dir } = useLang()
  const s = pickUi(TOUR_TEXT, lang, 'en')
  const rtl = (dir || (lang === 'ar' ? 'rtl' : 'ltr')) === 'rtl'
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const [cardH, setCardH] = useState(0)
  const cardRef = useRef(null)
  const titleRef = useRef(null)
  const returnRef = useRef(null)
  const step = TOUR_STEPS[i]
  const n = TOUR_STEPS.length
  const last = i === n - 1
  const text = s[step.id]
  // Təkliflər — yalnız yerli siqnallar (mount-da bir dəfə)
  const picks = useMemo(() => suggestFeatures(storageGetter()), [])

  // Açılış: tur görülüb sayılır (ilk gəliş təklifi daha çıxmır); fokus sonda qayıdır
  useEffect(() => {
    returnRef.current = document.activeElement
    writeTourState({ offered: true })
    document.documentElement.classList.add('qm-tour-on')
    return () => {
      document.documentElement.classList.remove('qm-tour-on')
      const el = returnRef.current
      if (el && document.contains(el) && typeof el.focus === 'function') el.focus({ preventScroll: true })
    }
  }, [])

  // Hədəfi tap, lazım olsa yan paneldə görünən yerə gətir, ölç; resize/scroll — rAF ilə
  useLayoutEffect(() => {
    const el = findTarget(step.targets)
    if (el && el.closest('.qm-sn--rail') && !el.classList.contains('qm-sn-body')) {
      try { el.scrollIntoView({ block: 'nearest' }) } catch { /* köhnə brauzer */ }
    }
    let raf = 0
    const measure = () => {
      raf = 0
      const vw = window.innerWidth, vh = window.innerHeight
      setVp((p) => (p.w === vw && p.h === vh ? p : { w: vw, h: vh }))
      if (!el || !document.contains(el)) { setRect(null); return }
      const r = el.getBoundingClientRect()
      const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw
      if (!visible) { setRect(null); return }
      // Ekrandan kənara çıxan hissə kəsilir (məs. hündür yan panel)
      const top = Math.max(r.top, 4), bottom = Math.min(r.bottom, vh - 4)
      setRect({ x: r.left, y: top, w: r.width, h: bottom - top })
    }
    measure()
    const onChange = () => { if (!raf) raf = requestAnimationFrame(measure) }
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, { passive: true, capture: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, { capture: true })
    }
  }, [step])

  // Kartın hündürlüyü (yerləşdirmə üçün) və hər addımda fokus başlığa
  useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight || 0
    setCardH((p) => (p === h ? p : h))
  }, [i, lang])
  useEffect(() => { titleRef.current?.focus({ preventScroll: true }) }, [i])

  const finish = useCallback(() => { onFinish?.(); onClose() }, [onClose, onFinish])
  const next = useCallback(() => { if (last) finish(); else setI((x) => Math.min(x + 1, n - 1)) }, [last, finish, n])
  const back = useCallback(() => setI((x) => Math.max(x - 1, 0)), [])

  // Klaviatura: Esc, Tab tələsi, oxlar (ərəbcədə güzgülü)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); return }
      // Tur açıqkən axtarış qısayolları (Ctrl+K, "/") arxadakı səhifədə dialoq açmasın (Header defaultPrevented-ə baxır)
      if (((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') || e.key === '/') { e.preventDefault(); return }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const fwd = (e.key === 'ArrowRight') !== rtl
        e.preventDefault()
        if (fwd) { if (!last) next() } else back()
        return
      }
      if (e.key !== 'Tab' || !cardRef.current) return
      const items = [...cardRef.current.querySelectorAll(FOCUSABLE)]
      if (!items.length) return
      const first = items[0], lastEl = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === titleRef.current || !cardRef.current.contains(active))) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && (active === lastEl || !cardRef.current.contains(active))) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [finish, next, back, rtl, last])

  const go = (e, key) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onFinish?.()
    // Fokus açan düyməyə yox — yeni səhifəyə (marşrutlayıcı özü idarə edir)
    returnRef.current = null
    onClose()
    setPage?.(key)
  }

  const pos = placeCard(rect, vp.w, vp.h, cardH)
  const cardStyle = pos.mode === 'pos' ? { left: `${Math.round(pos.left)}px`, top: `${Math.round(pos.top)}px` } : undefined
  const spot = rect ? {
    left: `${Math.round(rect.x - PAD)}px`, top: `${Math.round(rect.y - PAD)}px`,
    width: `${Math.round(rect.w + PAD * 2)}px`, height: `${Math.round(rect.h + PAD * 2)}px`,
  } : null

  return createPortal(
    <div className={`tour-root${spot ? ' has-spot' : ''}`} dir={rtl ? 'rtl' : 'ltr'} data-testid="discover-tour">
      {spot ? <div className="tour-spot" style={spot} aria-hidden="true" /> : <div className="tour-shade" aria-hidden="true" />}
      <div
        ref={cardRef}
        className={`tour-card tour-card--${pos.mode}`}
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-label={s.label}
        aria-describedby="tour-step-n tour-step-d"
      >
        <div className="tour-card__top">
          <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--accent" aria-hidden="true"><Icon name={step.icon} /></span>
          <span id="tour-step-n" className="tour-card__n">{s.step(i + 1, n)}</span>
          <button type="button" className="ui-icon-btn tour-card__x" onClick={finish} aria-label={s.close} title={s.close}><Icon name="close" size={18} /></button>
        </div>
        <div className="tour-dots" aria-hidden="true">
          {TOUR_STEPS.map((x, k) => <span key={x.id} className={`tour-dot${k === i ? ' is-on' : ''}${k < i ? ' is-past' : ''}`} />)}
        </div>
        <h2 ref={titleRef} className="tour-card__title" tabIndex={-1}>{text.t}</h2>
        <p id="tour-step-d" className="tour-card__text">{text.d}</p>

        {last && (
          <>
            <h3 className="tour-card__h">{s.suggest}</h3>
            <ul className="tour-picks">
              {picks.map((k) => (
                <li key={k}>
                  <a href={pathFor(k, lang)} onClick={(e) => go(e, k)} className="tour-pick">
                    <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={hasIcon(k) ? k : 'arrow'} /></span>
                    <span>{navLabel(k, lang) || k}</span>
                    <Icon name="chevron" size={16} className="ui-flip-rtl tour-pick__chev" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="tour-card__private"><Icon name="shield" size={14} /> {s.private}</p>
          </>
        )}

        <div className="tour-card__actions">
          {!last && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm tour-card__skip" onClick={finish}>{s.skip}</button>}
          <span className="tour-card__spacer" />
          {i > 0 && (
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={back}>
              <Icon name="arrow" size={16} className="ui-btn__icon tour-flip" /> {s.back}
            </button>
          )}
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={next}>
            {last ? s.done : s.next} {!last && <Icon name="arrow" size={16} className="ui-btn__icon ui-flip-rtl" />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
