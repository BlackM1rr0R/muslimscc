import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang, resolveSiteDark } from '../contexts/LangContext'
import Icon from './Icon'
import '../styles/AccessibilityWidget.css'

const STORAGE_KEY = 'muslim_cc_a11y_prefs_v2'

const DEFAULT_PREFS = {
  // Text
  fontSize: 0,         // -1, 0, +1, +2, +3
  lineSpacing: 0,      // 0=normal, 1=larger, 2=xlarger
  letterSpacing: 0,    // 0=normal, 1=larger, 2=xlarger
  dyslexia: false,
  // Color & contrast
  contrast: 'normal',  // normal | high | inverted
  theme: 'auto',       // auto | light | dark | sepia
  saturation: 100,     // 0-150
  grayscale: false,
  // Visual helpers
  underlineLinks: false,
  highlightHeadings: false,
  highlightFocus: false,
  biggerCursor: false,
  readingGuide: false,
  hideImages: false,
  // Interaction
  largerTargets: false,
  readAloud: false,
  // Motion
  reduceMotion: false,
  pauseMedia: false,
}

const PROFILES = {
  lowVision:   { fontSize: 2, contrast: 'high', biggerCursor: true, lineSpacing: 1, highlightFocus: true, underlineLinks: true },
  dyslexia:    { dyslexia: true, lineSpacing: 2, letterSpacing: 1, readingGuide: true, fontSize: 1 },
  motor:       { largerTargets: true, highlightFocus: true, biggerCursor: true, fontSize: 1 },
  colorblind:  { saturation: 0, highlightFocus: true, underlineLinks: true, highlightHeadings: true },
  calm:        { reduceMotion: true, theme: 'sepia', saturation: 80, pauseMedia: true, hideImages: false },
  seizure:     { reduceMotion: true, pauseMedia: true, saturation: 60 },
}

const LABELS = {
  az: {
    title:'Əlçatanlıq', subtitle:'Saytı öz ehtiyaclarınıza uyğunlaşdırın',
    open:'Əlçatanlıq menyusu', close:'Bağla', reset:'Hamısını sıfırla',
    active:'aktiv', preview:'Önizləmə',
    previewHeading:'Bismillah — Mərhəmətli Allahın adı ilə',
    previewText:'Bu mətn ayarlamaları görmək üçündür. Burada bir',
    previewLink:'nümunə keçid',
    previewAfter:'və düymə var.',
    previewBtn:'Düymə nümunəsi',
    profiles:'Hazır profillər',
    profileLowVision:'Zəif görmə',
    profileDyslexia:'Disleksiya',
    profileMotor:'Motor',
    profileColorblind:'Rəngkorluk',
    profileCalm:'Sakit',
    profileSeizure:'Tutmalardan qoruma',
    textGroup:'Mətn', colorGroup:'Rəng və kontrast', helpersGroup:'Vizual köməkçilər',
    interactionGroup:'Qarşılıqlı təsir', motionGroup:'Hərəkət',
    fontSize:'Mətn ölçüsü', lineSpacing:'Sətir arası', letterSpacing:'Hərf arası',
    contrast:'Kontrast', theme:'Tema', saturation:'Rəng doyğunluğu',
    smaller:'Kiçik', normal:'Normal', larger:'Böyük', xlarger:'Ən böyük', huge:'Nəhəng',
    spaceN:'Normal', spaceL:'Geniş', spaceXL:'Çox geniş',
    contrastN:'Normal', contrastH:'Yüksək', contrastI:'Tərs',
    themeA:'Avto', themeL:'İşıqlı', themeD:'Tünd', themeS:'Sepia',
    dyslexia:'Disleksiya şrifti', dyslexiaSub:'Daha rahat oxunan şrift',
    underlineLinks:'Keçidlərin altından xətt', underlineLinksSub:'Bütün keçidlər seçilsin',
    highlightHeadings:'Başlıqları vurğula', highlightHeadingsSub:'Başlıqlar fonla seçilir',
    highlightFocus:'Fokusu vurğula', highlightFocusSub:'Klaviatura naviqasiyası',
    biggerCursor:'Böyük kursor', biggerCursorSub:'Daha asan görünən siçan',
    readingGuide:'Oxuma bələdçisi', readingGuideSub:'Siçanı izləyən xətt',
    hideImages:'Şəkilləri gizlə', hideImagesSub:'Diqqəti yayındırmasın',
    grayscale:'Boz tonlar', grayscaleSub:'Rənglər söndürülür',
    largerTargets:'Böyük düymələr', largerTargetsSub:'Daha asan toxunma',
    readAloud:'Səsli oxu', readAloudSub:'Mətnə toxun — səsli oxunsun',
    reduceMotion:'Animasiyaları azalt', reduceMotionSub:'Bütün hərəkətlər söndürülür',
    pauseMedia:'Medianı dayandır', pauseMediaSub:'Avtomatik başlayan video və səs dayanır',
  },
  en: {
    title:'Accessibility', subtitle:'Customize the site to your needs',
    open:'Accessibility menu', close:'Close', reset:'Reset all',
    active:'active', preview:'Preview',
    previewHeading:'Bismillah — In the name of Allah',
    previewText:'This text shows how settings affect display. Here is a',
    previewLink:'sample link',
    previewAfter:'and a button.',
    previewBtn:'Sample button',
    profiles:'Quick profiles',
    profileLowVision:'Low vision', profileDyslexia:'Dyslexia', profileMotor:'Motor',
    profileColorblind:'Color blind', profileCalm:'Calm', profileSeizure:'Seizure safe',
    textGroup:'Text', colorGroup:'Color & contrast', helpersGroup:'Visual helpers',
    interactionGroup:'Interaction', motionGroup:'Motion',
    fontSize:'Text size', lineSpacing:'Line spacing', letterSpacing:'Letter spacing',
    contrast:'Contrast', theme:'Theme', saturation:'Saturation',
    smaller:'Smaller', normal:'Normal', larger:'Larger', xlarger:'Largest', huge:'Huge',
    spaceN:'Normal', spaceL:'Large', spaceXL:'Extra large',
    contrastN:'Normal', contrastH:'High', contrastI:'Inverted',
    themeA:'Auto', themeL:'Light', themeD:'Dark', themeS:'Sepia',
    dyslexia:'Dyslexia font', dyslexiaSub:'Easier-to-read font',
    underlineLinks:'Underline links', underlineLinksSub:'Highlight all links',
    highlightHeadings:'Highlight headings', highlightHeadingsSub:'Headings get a highlight',
    highlightFocus:'Highlight focus', highlightFocusSub:'For keyboard navigation',
    biggerCursor:'Bigger cursor', biggerCursorSub:'Easier-to-see mouse',
    readingGuide:'Reading guide', readingGuideSub:'Line follows cursor',
    hideImages:'Hide images', hideImagesSub:'Reduce visual distraction',
    grayscale:'Grayscale', grayscaleSub:'Remove all colors',
    largerTargets:'Larger targets', largerTargetsSub:'Easier to tap',
    readAloud:'Read aloud', readAloudSub:'Click any text to hear it',
    reduceMotion:'Reduce motion', reduceMotionSub:'Disable all animations',
    pauseMedia:'Pause media', pauseMediaSub:'Stop auto-play videos/audio',
  },
  ru: {
    title:'Доступность', subtitle:'Настройте сайт под себя',
    open:'Меню доступности', close:'Закрыть', reset:'Сбросить всё',
    active:'активно', preview:'Предпросмотр',
    previewHeading:'Бисмиллах — Во имя Аллаха',
    previewText:'Этот текст показывает применение настроек. Вот',
    previewLink:'пример ссылки',
    previewAfter:'и кнопка.',
    previewBtn:'Пример кнопки',
    profiles:'Быстрые профили',
    profileLowVision:'Слабовидящие', profileDyslexia:'Дислексия', profileMotor:'Моторика',
    profileColorblind:'Дальтонизм', profileCalm:'Спокойный', profileSeizure:'Без вспышек',
    textGroup:'Текст', colorGroup:'Цвет и контраст', helpersGroup:'Помощники',
    interactionGroup:'Взаимодействие', motionGroup:'Движение',
    fontSize:'Размер текста', lineSpacing:'Межстрочный', letterSpacing:'Межбуквенный',
    contrast:'Контраст', theme:'Тема', saturation:'Насыщенность',
    smaller:'Меньше', normal:'Нормальный', larger:'Больше', xlarger:'Самый большой', huge:'Огромный',
    spaceN:'Нормальный', spaceL:'Большой', spaceXL:'Очень большой',
    contrastN:'Нормальный', contrastH:'Высокий', contrastI:'Инверсия',
    themeA:'Авто', themeL:'Светлая', themeD:'Тёмная', themeS:'Сепия',
    dyslexia:'Шрифт для дислексии', dyslexiaSub:'Легко читаемый',
    underlineLinks:'Подчеркнуть ссылки', underlineLinksSub:'Все ссылки выделены',
    highlightHeadings:'Подсветка заголовков', highlightHeadingsSub:'Заголовки выделены фоном',
    highlightFocus:'Подсветка фокуса', highlightFocusSub:'Для клавиатуры',
    biggerCursor:'Большой курсор', biggerCursorSub:'Видимая мышь',
    readingGuide:'Линия чтения', readingGuideSub:'За курсором',
    hideImages:'Скрыть картинки', hideImagesSub:'Меньше отвлекает',
    grayscale:'Серый', grayscaleSub:'Без цветов',
    largerTargets:'Большие кнопки', largerTargetsSub:'Проще нажимать',
    readAloud:'Озвучка', readAloudSub:'Клик по тексту — аудио',
    reduceMotion:'Меньше анимации', reduceMotionSub:'Отключение движения',
    pauseMedia:'Пауза медиа', pauseMediaSub:'Без автовоспроизведения',
  },
  ar: {
    title:'إمكانية الوصول', subtitle:'خصص الموقع حسب احتياجاتك',
    open:'قائمة إمكانية الوصول', close:'إغلاق', reset:'إعادة تعيين الكل',
    active:'مفعّل', preview:'معاينة',
    previewHeading:'بسم الله الرحمن الرحيم',
    previewText:'هذا النص يوضح كيف تظهر الإعدادات. هنا',
    previewLink:'رابط مثال',
    previewAfter:'وزر.',
    previewBtn:'زر مثال',
    profiles:'إعدادات سريعة',
    profileLowVision:'ضعف البصر', profileDyslexia:'عسر القراءة', profileMotor:'حركة',
    profileColorblind:'عمى الألوان', profileCalm:'هادئ', profileSeizure:'آمن للنوبات',
    textGroup:'النص', colorGroup:'اللون والتباين', helpersGroup:'مساعدات',
    interactionGroup:'تفاعل', motionGroup:'حركة',
    fontSize:'حجم النص', lineSpacing:'تباعد الأسطر', letterSpacing:'تباعد الأحرف',
    contrast:'التباين', theme:'النمط', saturation:'تشبّع اللون',
    smaller:'أصغر', normal:'عادي', larger:'أكبر', xlarger:'الأكبر', huge:'ضخم',
    spaceN:'عادي', spaceL:'كبير', spaceXL:'كبير جداً',
    contrastN:'عادي', contrastH:'عالي', contrastI:'معكوس',
    themeA:'تلقائي', themeL:'فاتح', themeD:'داكن', themeS:'سيبيا',
    dyslexia:'خط ودود لعسر القراءة', dyslexiaSub:'أسهل قراءة',
    underlineLinks:'تسطير الروابط', underlineLinksSub:'إبراز كل الروابط',
    highlightHeadings:'إبراز العناوين', highlightHeadingsSub:'بخلفية صفراء',
    highlightFocus:'إبراز التركيز', highlightFocusSub:'لاستخدام لوحة المفاتيح',
    biggerCursor:'مؤشر أكبر', biggerCursorSub:'أوضح',
    readingGuide:'دليل القراءة', readingGuideSub:'خط يتبع المؤشر',
    hideImages:'إخفاء الصور', hideImagesSub:'تقليل الإلهاء',
    grayscale:'تدرج الرمادي', grayscaleSub:'إزالة الألوان',
    largerTargets:'أزرار أكبر', largerTargetsSub:'أسهل للضغط',
    readAloud:'قراءة صوتية', readAloudSub:'انقر للاستماع',
    reduceMotion:'تقليل الحركة', reduceMotionSub:'إيقاف الرسوم',
    pauseMedia:'إيقاف الوسائط', pauseMediaSub:'إيقاف التشغيل التلقائي',
  },
  tr: {
    title:'Erişilebilirlik', subtitle:'Siteyi ihtiyaçlarınıza göre özelleştirin',
    open:'Erişilebilirlik menüsü', close:'Kapat', reset:'Tümünü sıfırla',
    active:'aktif', preview:'Önizleme',
    previewHeading:'Bismillah — Allah\'ın adıyla',
    previewText:'Bu metin ayarların etkisini gösterir. İşte bir',
    previewLink:'örnek bağlantı',
    previewAfter:'ve düğme var.',
    previewBtn:'Örnek düğme',
    profiles:'Hazır profiller',
    profileLowVision:'Az gören', profileDyslexia:'Disleksi', profileMotor:'Motor',
    profileColorblind:'Renk körü', profileCalm:'Sakin', profileSeizure:'Nöbet güvenli',
    textGroup:'Metin', colorGroup:'Renk ve kontrast', helpersGroup:'Görsel yardımcılar',
    interactionGroup:'Etkileşim', motionGroup:'Hareket',
    fontSize:'Yazı boyutu', lineSpacing:'Satır arası', letterSpacing:'Harf arası',
    contrast:'Kontrast', theme:'Tema', saturation:'Doygunluk',
    smaller:'Küçük', normal:'Normal', larger:'Büyük', xlarger:'En büyük', huge:'Devasa',
    spaceN:'Normal', spaceL:'Geniş', spaceXL:'Çok geniş',
    contrastN:'Normal', contrastH:'Yüksek', contrastI:'Ters',
    themeA:'Otomatik', themeL:'Açık', themeD:'Koyu', themeS:'Sepya',
    dyslexia:'Disleksi yazı tipi', dyslexiaSub:'Daha kolay okunur',
    underlineLinks:'Bağlantıların altını çiz', underlineLinksSub:'Tüm bağlantılar vurgulansın',
    highlightHeadings:'Başlıkları vurgula', highlightHeadingsSub:'Başlıklar arka planla belirginleşir',
    highlightFocus:'Odağı vurgula', highlightFocusSub:'Klavye navigasyonu',
    biggerCursor:'Büyük imleç', biggerCursorSub:'Daha görünür',
    readingGuide:'Okuma kılavuzu', readingGuideSub:'İmleci takip eden çizgi',
    hideImages:'Resimleri gizle', hideImagesSub:'Dikkat dağıtmasın',
    grayscale:'Gri tonlama', grayscaleSub:'Renkler kapatılır',
    largerTargets:'Büyük hedefler', largerTargetsSub:'Daha kolay tıklama',
    readAloud:'Sesli oku', readAloudSub:'Metne tıkla, dinle',
    reduceMotion:'Hareketi azalt', reduceMotionSub:'Tüm animasyonlar kapanır',
    pauseMedia:'Medyayı durdur', pauseMediaSub:'Otomatik oynatmayı durdur',
  },
}

function applyPreferences(prefs) {
  if (typeof document === 'undefined') return
  const html = document.documentElement

  // Font size scaling
  html.classList.toggle('a11y-text-smaller', prefs.fontSize === -1)
  html.classList.toggle('a11y-text-larger', prefs.fontSize === 1)
  html.classList.toggle('a11y-text-xlarger', prefs.fontSize === 2)
  html.classList.toggle('a11y-text-huge', prefs.fontSize === 3)

  // Line spacing
  html.classList.toggle('a11y-line-larger', prefs.lineSpacing === 1)
  html.classList.toggle('a11y-line-xlarger', prefs.lineSpacing === 2)

  // Letter spacing
  html.classList.toggle('a11y-letter-larger', prefs.letterSpacing === 1)
  html.classList.toggle('a11y-letter-xlarger', prefs.letterSpacing === 2)

  // Contrast
  html.classList.toggle('a11y-high-contrast', prefs.contrast === 'high')
  html.classList.toggle('a11y-inverted', prefs.contrast === 'inverted')

  // Theme
  if (prefs.theme === 'dark') html.setAttribute('data-theme', 'dark')
  else if (prefs.theme === 'light') html.setAttribute('data-theme', 'light')
  else if (prefs.theme === 'sepia') html.setAttribute('data-theme', 'sepia')
  else {
    // "Avto" — saytın öz tema seçimi (header-dəki ay/günəş düyməsi) qalsın.
    // Əvvəl burada data-theme həmişə silinirdi: hər hansı əlçatanlıq ayarı
    // dəyişəndə tünd rejim səhifə yenilənənə qədər sönürdü.
    // Saytın tema qərarı (saxlanmış seçim, yoxdursa telefonun sistem rejimi) —
    // yalnız localStorage-a baxanda sistem qaranlıq olan telefonda ayar dəyişəndə sayt işıqlanırdı
    const siteDark = resolveSiteDark()
    if (siteDark) html.setAttribute('data-theme', 'dark')
    else html.removeAttribute('data-theme')
  }

  // Saturation
  html.style.setProperty('--a11y-saturation', `${prefs.saturation}%`)
  html.classList.toggle('a11y-saturation-active', prefs.saturation !== 100)

  // Toggles
  html.classList.toggle('a11y-dyslexia', prefs.dyslexia)
  html.classList.toggle('a11y-underline-links', prefs.underlineLinks)
  html.classList.toggle('a11y-highlight-headings', prefs.highlightHeadings)
  html.classList.toggle('a11y-highlight-focus', prefs.highlightFocus)
  html.classList.toggle('a11y-bigger-cursor', prefs.biggerCursor)
  html.classList.toggle('a11y-hide-images', prefs.hideImages)
  html.classList.toggle('a11y-grayscale', prefs.grayscale)
  html.classList.toggle('a11y-larger-targets', prefs.largerTargets)
  html.classList.toggle('a11y-read-aloud', prefs.readAloud)
  html.classList.toggle('a11y-reduce-motion', prefs.reduceMotion)
  html.classList.toggle('a11y-reading-guide', prefs.readingGuide)
}

/**
 * Əlçatanlıq paneli + saytda tətbiq olunan tərcihlər.
 *
 * Tərcihlər (şrift ölçüsü, kontrast və s.) panel bağlı olanda da tətbiq
 * olunur — ona görə bu komponent həmişə render edilməlidir.
 *
 * İki rejim:
 *  • İdarə olunan — `open` prop verilir (FloatingDock). Öz üzən düyməsini
 *    göstərmir; bağlananda `onClose()` çağırılır.
 *  • Köhnə (müstəqil) — prop yoxdur: öz düyməsi ilə açılır.
 *
 * @param {{ open?: boolean, onClose?: () => void, onActiveCountChange?: (n: number) => void }} props
 */
export default function AccessibilityWidget({ open: openProp, onClose, onActiveCountChange } = {}) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const controlled = openProp !== undefined
  const [openState, setOpenState] = useState(false)
  const open = controlled ? Boolean(openProp) : openState
  const setOpen = (value) => {
    if (controlled) { if (!value) onClose?.() }
    else setOpenState(value)
  }
  const closeRef = useRef(null)
  closeRef.current = () => setOpen(false)
  const closeBtnRef = useRef(null)

  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) }
    } catch {}
    return DEFAULT_PREFS
  })

  useEffect(() => {
    applyPreferences(prefs)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)) } catch {}
  }, [prefs])

  // Reading guide line
  useEffect(() => {
    if (!prefs.readingGuide) return
    const guide = document.createElement('div')
    guide.className = 'a11y-guide-line'
    document.body.appendChild(guide)
    const onMove = (e) => { guide.style.top = `${e.clientY}px` }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      guide.remove()
    }
  }, [prefs.readingGuide])

  // Read aloud — clicking any text reads it
  useEffect(() => {
    if (!prefs.readAloud) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const onClick = (e) => {
      // Skip clicks inside the widget itself
      if (e.target.closest('.a11y-panel, .a11y-fab, .qm-dock, button, input, select, textarea, a')) return
      const text = e.target.innerText || e.target.textContent
      if (!text || text.length < 3 || text.length > 800) return
      e.preventDefault()
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text.trim())
      const langMap = { az:'az-AZ', en:'en-US', ru:'ru-RU', ar:'ar-SA', tr:'tr-TR' }
      u.lang = langMap[lang] || 'en-US'
      u.rate = 0.95
      window.speechSynthesis.speak(u)
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.speechSynthesis?.cancel()
    }
  }, [prefs.readAloud, lang])

  // Pause media (auto-play)
  useEffect(() => {
    if (!prefs.pauseMedia) return
    const stopMedia = () => {
      document.querySelectorAll('video, audio').forEach(m => { try { m.pause() } catch {} })
    }
    stopMedia()
    const interval = setInterval(stopMedia, 500)
    return () => clearInterval(interval)
  }, [prefs.pauseMedia])

  // Escape ilə bağlama
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Açılanda fokus panelə keçsin (klaviatura istifadəçiləri üçün)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => closeBtnRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [open])

  // Açıq olduqda body-ə class əlavə et (mobil scroll kilidi, üzən düymələri gizlət).
  // Yalnız açıq ikən əlavə edib bağlananda silirik — panellər arasında
  // keçid zamanı bir panelin təmizləməsi digərinin sinfini silməsin.
  useEffect(() => {
    if (!open) return
    document.body.classList.add('panel-open')
    return () => document.body.classList.remove('panel-open')
  }, [open])

  // Başqa panel açılanda bunu bağla (yalnız müstəqil rejimdə —
  // idarə olunan rejimdə eyni anda bir paneli FloatingDock özü təmin edir)
  useEffect(() => {
    if (controlled) return
    const handler = (e) => {
      if (e.detail !== 'a11y') setOpenState(false)
    }
    window.addEventListener('close-other-panels', handler)
    return () => window.removeEventListener('close-other-panels', handler)
  }, [controlled])

  // Bu açılanda digərlərinə xəbər ver
  useEffect(() => {
    if (open && !controlled) window.dispatchEvent(new CustomEvent('close-other-panels', { detail: 'a11y' }))
  }, [open, controlled])

  const update = useCallback((key, value) => setPrefs(p => ({ ...p, [key]: value })), [])
  const toggle = useCallback((key) => setPrefs(p => ({ ...p, [key]: !p[key] })), [])
  const reset = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setPrefs(DEFAULT_PREFS)
  }
  const applyProfile = (key) => setPrefs(p => ({ ...DEFAULT_PREFS, ...PROFILES[key] }))

  // Active settings count
  const activeCount = (() => {
    let n = 0
    if (prefs.fontSize !== 0) n++
    if (prefs.lineSpacing !== 0) n++
    if (prefs.letterSpacing !== 0) n++
    if (prefs.contrast !== 'normal') n++
    if (prefs.theme !== 'auto') n++
    if (prefs.saturation !== 100) n++
    const toggles = ['dyslexia','underlineLinks','highlightHeadings','highlightFocus','biggerCursor','readingGuide','hideImages','grayscale','largerTargets','readAloud','reduceMotion','pauseMedia']
    toggles.forEach(k => { if (prefs[k]) n++ })
    return n
  })()

  // Aktiv ayar sayını dok menyusuna ötür (nişan üçün)
  useEffect(() => {
    onActiveCountChange?.(activeCount)
  }, [activeCount, onActiveCountChange])

  return (
    <>
      {/* FAB — yalnız müstəqil rejimdə (dokda bu düymə yoxdur) */}
      {!controlled && (
        <button
          className="a11y-fab"
          onClick={() => setOpenState(o => !o)}
          aria-label={l.open}
          aria-expanded={open}
          title={l.open}
        >
          <div className="a11y-fab-ring"></div>
          <Icon name="a11y" size={26} />
          {activeCount > 0 && <span className="a11y-fab-badge">{activeCount}</span>}
        </button>
      )}

      {open && (
        <>
          <div className="a11y-backdrop" onClick={() => setOpen(false)} />
          <div className="a11y-panel" role="dialog" aria-label={l.title}>
            <div className="a11y-header">
              <div className="a11y-header-info">
                <div className="a11y-header-icon" aria-hidden="true"><Icon name="a11y" size={22} /></div>
                <div>
                  <div className="a11y-name">{l.title}</div>
                  <div className="a11y-tagline">
                    {activeCount > 0 ? `${activeCount} ${l.active}` : l.subtitle}
                  </div>
                </div>
              </div>
              <button ref={closeBtnRef} className="a11y-close" onClick={() => setOpen(false)} aria-label={l.close}><Icon name="close" size={18} /></button>
            </div>

            <div className="a11y-body">

              {/* ─── LIVE PREVIEW ─── */}
              <div className="a11y-preview">
                <div className="a11y-preview-label"><Icon name="eye" size={14} /> {l.preview}</div>
                <div className="a11y-preview-content">
                  <h3 className="a11y-preview-h">{l.previewHeading}</h3>
                  <p className="a11y-preview-p">
                    {l.previewText} <a href="#" onClick={(e) => e.preventDefault()} className="a11y-preview-link">{l.previewLink}</a> {l.previewAfter}
                  </p>
                  <button className="a11y-preview-btn">{l.previewBtn}</button>
                </div>
              </div>

              {/* ─── PROFILES ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title"><Icon name="bolt" size={15} /> {l.profiles}</div>
                <div className="a11y-profiles">
                  <button className="a11y-profile" onClick={() => applyProfile('lowVision')}>
                    <span className="a11y-profile-icon" aria-hidden="true"><Icon name="eye" size={20} /></span>
                    <span className="a11y-profile-name">{l.profileLowVision}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('dyslexia')}>
                    <span className="a11y-profile-icon" aria-hidden="true"><Icon name="books" size={20} /></span>
                    <span className="a11y-profile-name">{l.profileDyslexia}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('motor')}>
                    <span className="a11y-profile-icon" aria-hidden="true"><Icon name="touch" size={20} /></span>
                    <span className="a11y-profile-name">{l.profileMotor}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('colorblind')}>
                    <span className="a11y-profile-icon" aria-hidden="true"><Icon name="palette" size={20} /></span>
                    <span className="a11y-profile-name">{l.profileColorblind}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('calm')}>
                    <span className="a11y-profile-icon" aria-hidden="true"><Icon name="leaf" size={20} /></span>
                    <span className="a11y-profile-name">{l.profileCalm}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('seizure')}>
                    <span className="a11y-profile-icon" aria-hidden="true"><Icon name="shield" size={20} /></span>
                    <span className="a11y-profile-name">{l.profileSeizure}</span>
                  </button>
                </div>
              </section>

              {/* ─── TEXT ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title"><Icon name="type" size={15} /> {l.textGroup}</div>

                <div className="a11y-sub-label">{l.fontSize}</div>
                <div className="a11y-btn-group a11y-grid-5">
                  {[
                    { val: -1, size: 13, name: l.smaller },
                    { val: 0,  size: 16, name: l.normal },
                    { val: 1,  size: 18, name: l.larger },
                    { val: 2,  size: 21, name: l.xlarger },
                    { val: 3,  size: 24, name: l.huge },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      className={`a11y-btn ${prefs.fontSize === opt.val ? 'active' : ''}`}
                      onClick={() => update('fontSize', opt.val)}
                      title={opt.name}
                    >
                      <span style={{ fontSize: opt.size, fontWeight: 600 }}>A</span>
                    </button>
                  ))}
                </div>

                <div className="a11y-sub-label">{l.lineSpacing}</div>
                <div className="a11y-btn-group a11y-grid-3">
                  <button className={`a11y-btn a11y-btn-text ${prefs.lineSpacing === 0 ? 'active' : ''}`} onClick={() => update('lineSpacing', 0)}>{l.spaceN}</button>
                  <button className={`a11y-btn a11y-btn-text ${prefs.lineSpacing === 1 ? 'active' : ''}`} onClick={() => update('lineSpacing', 1)}>{l.spaceL}</button>
                  <button className={`a11y-btn a11y-btn-text ${prefs.lineSpacing === 2 ? 'active' : ''}`} onClick={() => update('lineSpacing', 2)}>{l.spaceXL}</button>
                </div>

                <div className="a11y-sub-label">{l.letterSpacing}</div>
                <div className="a11y-btn-group a11y-grid-3">
                  <button className={`a11y-btn a11y-btn-text ${prefs.letterSpacing === 0 ? 'active' : ''}`} onClick={() => update('letterSpacing', 0)}>{l.spaceN}</button>
                  <button className={`a11y-btn a11y-btn-text ${prefs.letterSpacing === 1 ? 'active' : ''}`} onClick={() => update('letterSpacing', 1)}>{l.spaceL}</button>
                  <button className={`a11y-btn a11y-btn-text ${prefs.letterSpacing === 2 ? 'active' : ''}`} onClick={() => update('letterSpacing', 2)}>{l.spaceXL}</button>
                </div>

                <Toggle icon="type" label={l.dyslexia} sub={l.dyslexiaSub} on={prefs.dyslexia} onClick={() => toggle('dyslexia')} />
              </section>

              {/* ─── COLOR & CONTRAST ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title"><Icon name="contrast" size={15} /> {l.colorGroup}</div>

                <div className="a11y-sub-label">{l.contrast}</div>
                <div className="a11y-btn-group a11y-grid-3">
                  <button className={`a11y-btn a11y-btn-text ${prefs.contrast === 'normal' ? 'active' : ''}`} onClick={() => update('contrast', 'normal')}>{l.contrastN}</button>
                  <button className={`a11y-btn a11y-btn-text ${prefs.contrast === 'high' ? 'active' : ''}`} onClick={() => update('contrast', 'high')}>{l.contrastH}</button>
                  <button className={`a11y-btn a11y-btn-text ${prefs.contrast === 'inverted' ? 'active' : ''}`} onClick={() => update('contrast', 'inverted')}>{l.contrastI}</button>
                </div>

                <div className="a11y-sub-label">{l.theme}</div>
                <div className="a11y-btn-group a11y-grid-4">
                  <button className={`a11y-btn a11y-btn-icon ${prefs.theme === 'auto' ? 'active' : ''}`} onClick={() => update('theme', 'auto')}><Icon name="refresh" size={18} /><span>{l.themeA}</span></button>
                  <button className={`a11y-btn a11y-btn-icon ${prefs.theme === 'light' ? 'active' : ''}`} onClick={() => update('theme', 'light')}><Icon name="sun" size={18} /><span>{l.themeL}</span></button>
                  <button className={`a11y-btn a11y-btn-icon ${prefs.theme === 'dark' ? 'active' : ''}`} onClick={() => update('theme', 'dark')}><Icon name="moon" size={18} /><span>{l.themeD}</span></button>
                  <button className={`a11y-btn a11y-btn-icon ${prefs.theme === 'sepia' ? 'active' : ''}`} onClick={() => update('theme', 'sepia')}><Icon name="books" size={18} /><span>{l.themeS}</span></button>
                </div>

                <div className="a11y-sub-label">{l.saturation} — <strong>{prefs.saturation}%</strong></div>
                {/* --a11y-fill: zolağın dolu (yaşıl) hissəsi — rəng CSS-dədir */}
                <input
                  type="range"
                  className="a11y-slider"
                  min="0"
                  max="150"
                  step="10"
                  value={prefs.saturation}
                  aria-label={l.saturation}
                  aria-valuetext={`${prefs.saturation}%`}
                  style={{ '--a11y-fill': `${(prefs.saturation / 150) * 100}%` }}
                  onChange={(e) => update('saturation', Number(e.target.value))}
                />

                <Toggle icon="drop" label={l.grayscale} sub={l.grayscaleSub} on={prefs.grayscale} onClick={() => toggle('grayscale')} />
              </section>

              {/* ─── VISUAL HELPERS ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title"><Icon name="sparkle" size={15} /> {l.helpersGroup}</div>
                <Toggle icon="link" label={l.underlineLinks} sub={l.underlineLinksSub} on={prefs.underlineLinks} onClick={() => toggle('underlineLinks')} />
                <Toggle icon="heading" label={l.highlightHeadings} sub={l.highlightHeadingsSub} on={prefs.highlightHeadings} onClick={() => toggle('highlightHeadings')} />
                <Toggle icon="target" label={l.highlightFocus} sub={l.highlightFocusSub} on={prefs.highlightFocus} onClick={() => toggle('highlightFocus')} />
                <Toggle icon="cursor" label={l.biggerCursor} sub={l.biggerCursorSub} on={prefs.biggerCursor} onClick={() => toggle('biggerCursor')} />
                <Toggle icon="ruler" label={l.readingGuide} sub={l.readingGuideSub} on={prefs.readingGuide} onClick={() => toggle('readingGuide')} />
                <Toggle icon="image" label={l.hideImages} sub={l.hideImagesSub} on={prefs.hideImages} onClick={() => toggle('hideImages')} />
              </section>

              {/* ─── INTERACTION ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title"><Icon name="touch" size={15} /> {l.interactionGroup}</div>
                <Toggle icon="touch" label={l.largerTargets} sub={l.largerTargetsSub} on={prefs.largerTargets} onClick={() => toggle('largerTargets')} />
                <Toggle icon="volume" label={l.readAloud} sub={l.readAloudSub} on={prefs.readAloud} onClick={() => toggle('readAloud')} />
              </section>

              {/* ─── MOTION ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title"><Icon name="film" size={15} /> {l.motionGroup}</div>
                <Toggle icon="pause" label={l.reduceMotion} sub={l.reduceMotionSub} on={prefs.reduceMotion} onClick={() => toggle('reduceMotion')} />
                <Toggle icon="film" label={l.pauseMedia} sub={l.pauseMediaSub} on={prefs.pauseMedia} onClick={() => toggle('pauseMedia')} />
              </section>

              {/* ─── RESET ─── */}
              <button className="a11y-reset" onClick={reset}>
                <Icon name="refresh" size={16} /> {l.reset}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function Toggle({ icon, label, sub, on, onClick }) {
  return (
    <button className={`a11y-toggle ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on}>
      <span className="a11y-toggle-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <span className="a11y-toggle-text">
        <span className="a11y-toggle-label">{label}</span>
        <span className="a11y-toggle-sub">{sub}</span>
      </span>
      <span className="a11y-toggle-switch">
        <span className="a11y-toggle-knob"></span>
      </span>
    </button>
  )
}
