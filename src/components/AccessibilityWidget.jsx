import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
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
    previewLink:'nümunə link',
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
    contrast:'Kontrast', theme:'Tema', saturation:'Doyğunluq',
    smaller:'Kiçik', normal:'Normal', larger:'Böyük', xlarger:'Ən böyük', huge:'Nəhəng',
    spaceN:'Normal', spaceL:'Geniş', spaceXL:'Çox geniş',
    contrastN:'Normal', contrastH:'Yüksək', contrastI:'Tərs',
    themeA:'Avto', themeL:'İşıqlı', themeD:'Tünd', themeS:'Sepia',
    dyslexia:'Disleksiya şrifti', dyslexiaSub:'Daha rahat oxunan şrift',
    underlineLinks:'Linklərin altını çək', underlineLinksSub:'Bütün linklər vurğulansın',
    highlightHeadings:'Başlıqları vurğula', highlightHeadingsSub:'h1, h2, h3 sarı fonlu',
    highlightFocus:'Fokusu vurğula', highlightFocusSub:'Klaviatura naviqasiyası',
    biggerCursor:'Böyük kursor', biggerCursorSub:'Daha asan görünən siçan',
    readingGuide:'Oxuma bələdçisi', readingGuideSub:'Siçanı izləyən xətt',
    hideImages:'Şəkilləri gizlə', hideImagesSub:'Diqqəti yayındırmasın',
    grayscale:'Boz tonlar', grayscaleSub:'Rənglər söndürülür',
    largerTargets:'Böyük düymələr', largerTargetsSub:'Daha asan toxunma',
    readAloud:'Oxu (audio)', readAloudSub:'Mətn üzərinə kliklə audio oxu',
    reduceMotion:'Animasiyaları azalt', reduceMotionSub:'Bütün hərəkətlər söndürülür',
    pauseMedia:'Media-nı dayandır', pauseMediaSub:'Auto-play video/audio dayandırılır',
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
    highlightHeadings:'Highlight headings', highlightHeadingsSub:'h1, h2, h3 with yellow bg',
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
    active:'активно', preview:'Превью',
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
    contrastN:'Нормальный', contrastH:'Высокий', contrastI:'Инверт.',
    themeA:'Авто', themeL:'Светлая', themeD:'Тёмная', themeS:'Сепия',
    dyslexia:'Шрифт для дислексии', dyslexiaSub:'Легко читаемый',
    underlineLinks:'Подчеркнуть ссылки', underlineLinksSub:'Все ссылки выделены',
    highlightHeadings:'Подсветка заголовков', highlightHeadingsSub:'h1-h3 жёлтым',
    highlightFocus:'Подсветка фокуса', highlightFocusSub:'Для клавиатуры',
    biggerCursor:'Большой курсор', biggerCursorSub:'Видимая мышь',
    readingGuide:'Линия чтения', readingGuideSub:'За курсором',
    hideImages:'Скрыть картинки', hideImagesSub:'Меньше отвлекает',
    grayscale:'Серый', grayscaleSub:'Без цветов',
    largerTargets:'Большие кнопки', largerTargetsSub:'Проще нажимать',
    readAloud:'Озвучка', readAloudSub:'Клик по тексту — аудио',
    reduceMotion:'Меньше анимации', reduceMotionSub:'Отключение движения',
    pauseMedia:'Пауза медиа', pauseMediaSub:'Стоп авто-воспроизв.',
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
    previewLink:'örnek link',
    previewAfter:'ve buton.',
    previewBtn:'Örnek buton',
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
    themeA:'Oto', themeL:'Açık', themeD:'Koyu', themeS:'Sepya',
    dyslexia:'Disleksi yazı tipi', dyslexiaSub:'Daha kolay okunur',
    underlineLinks:'Linklerin altını çiz', underlineLinksSub:'Tüm linkler vurgulansın',
    highlightHeadings:'Başlıkları vurgula', highlightHeadingsSub:'h1-h3 sarı arka plan',
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

function A11yIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="4.5" r="2.2" fill="currentColor" />
      <path
        d="M5.5 8.5C6.1 8.2 6.8 8.4 7 9L8.2 11.5L11.5 11.5L11.5 14L9 19.2C8.7 19.9 9.1 20.6 9.8 20.9C10.5 21.2 11.3 20.8 11.5 20.1L13 16.5L14.5 20.1C14.7 20.8 15.5 21.2 16.2 20.9C16.9 20.6 17.3 19.9 17 19.2L14.5 14L14.5 11.5L17.5 11.5C18.3 11.5 18.8 11 18.8 10.3C18.8 9.5 18.3 9 17.5 9L12 9C11.2 9 10.8 9.4 10.8 9.4L10.2 8.2C10 7.8 9.5 7.5 9 7.5L6 7.5C5.5 7.5 5 8 5 8.5Z"
        fill="currentColor"
      />
    </svg>
  )
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
  else html.removeAttribute('data-theme')

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

export default function AccessibilityWidget() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [open, setOpen] = useState(false)
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
      if (e.target.closest('.a11y-panel, .a11y-fab, button, input, select, textarea, a')) return
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

  // Escape to close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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

  return (
    <>
      {/* FAB */}
      <button
        className="a11y-fab"
        onClick={() => setOpen(o => !o)}
        aria-label={l.open}
        aria-expanded={open}
        title={l.open}
      >
        <div className="a11y-fab-ring"></div>
        <A11yIcon size={26} />
        {activeCount > 0 && <span className="a11y-fab-badge">{activeCount}</span>}
      </button>

      {open && (
        <>
          <div className="a11y-backdrop" onClick={() => setOpen(false)} />
          <div className="a11y-panel" role="dialog" aria-label={l.title}>
            <div className="a11y-header">
              <div className="a11y-header-info">
                <div className="a11y-header-icon"><A11yIcon size={24} /></div>
                <div>
                  <div className="a11y-name">{l.title}</div>
                  <div className="a11y-tagline">
                    {activeCount > 0 ? `${activeCount} ${l.active}` : l.subtitle}
                  </div>
                </div>
              </div>
              <button className="a11y-close" onClick={() => setOpen(false)} aria-label={l.close}>✕</button>
            </div>

            <div className="a11y-body">

              {/* ─── LIVE PREVIEW ─── */}
              <div className="a11y-preview">
                <div className="a11y-preview-label">👁️ {l.preview}</div>
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
                <div className="a11y-section-title">⚡ {l.profiles}</div>
                <div className="a11y-profiles">
                  <button className="a11y-profile" onClick={() => applyProfile('lowVision')}>
                    <span className="a11y-profile-icon">👁️</span>
                    <span className="a11y-profile-name">{l.profileLowVision}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('dyslexia')}>
                    <span className="a11y-profile-icon">📖</span>
                    <span className="a11y-profile-name">{l.profileDyslexia}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('motor')}>
                    <span className="a11y-profile-icon">✋</span>
                    <span className="a11y-profile-name">{l.profileMotor}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('colorblind')}>
                    <span className="a11y-profile-icon">🎨</span>
                    <span className="a11y-profile-name">{l.profileColorblind}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('calm')}>
                    <span className="a11y-profile-icon">🧘</span>
                    <span className="a11y-profile-name">{l.profileCalm}</span>
                  </button>
                  <button className="a11y-profile" onClick={() => applyProfile('seizure')}>
                    <span className="a11y-profile-icon">🛡️</span>
                    <span className="a11y-profile-name">{l.profileSeizure}</span>
                  </button>
                </div>
              </section>

              {/* ─── TEXT ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title">🔤 {l.textGroup}</div>

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
                      <span style={{ fontSize: opt.size, fontWeight: 800 }}>A</span>
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

                <Toggle icon="🔠" label={l.dyslexia} sub={l.dyslexiaSub} on={prefs.dyslexia} onClick={() => toggle('dyslexia')} />
              </section>

              {/* ─── COLOR & CONTRAST ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title">🌗 {l.colorGroup}</div>

                <div className="a11y-sub-label">{l.contrast}</div>
                <div className="a11y-btn-group a11y-grid-3">
                  <button className={`a11y-btn a11y-btn-text ${prefs.contrast === 'normal' ? 'active' : ''}`} onClick={() => update('contrast', 'normal')}>{l.contrastN}</button>
                  <button className={`a11y-btn a11y-btn-text ${prefs.contrast === 'high' ? 'active' : ''}`} onClick={() => update('contrast', 'high')}>{l.contrastH}</button>
                  <button className={`a11y-btn a11y-btn-text ${prefs.contrast === 'inverted' ? 'active' : ''}`} onClick={() => update('contrast', 'inverted')}>{l.contrastI}</button>
                </div>

                <div className="a11y-sub-label">{l.theme}</div>
                <div className="a11y-btn-group a11y-grid-4">
                  <button className={`a11y-btn a11y-btn-icon ${prefs.theme === 'auto' ? 'active' : ''}`} onClick={() => update('theme', 'auto')}>🔄<span>{l.themeA}</span></button>
                  <button className={`a11y-btn a11y-btn-icon ${prefs.theme === 'light' ? 'active' : ''}`} onClick={() => update('theme', 'light')}>☀️<span>{l.themeL}</span></button>
                  <button className={`a11y-btn a11y-btn-icon ${prefs.theme === 'dark' ? 'active' : ''}`} onClick={() => update('theme', 'dark')}>🌙<span>{l.themeD}</span></button>
                  <button className={`a11y-btn a11y-btn-icon ${prefs.theme === 'sepia' ? 'active' : ''}`} onClick={() => update('theme', 'sepia')}>📖<span>{l.themeS}</span></button>
                </div>

                <div className="a11y-sub-label">{l.saturation} — <strong>{prefs.saturation}%</strong></div>
                <input
                  type="range"
                  className="a11y-slider"
                  min="0"
                  max="150"
                  step="10"
                  value={prefs.saturation}
                  onChange={(e) => update('saturation', Number(e.target.value))}
                />

                <Toggle icon="◐" label={l.grayscale} sub={l.grayscaleSub} on={prefs.grayscale} onClick={() => toggle('grayscale')} />
              </section>

              {/* ─── VISUAL HELPERS ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title">✨ {l.helpersGroup}</div>
                <Toggle icon="🔗" label={l.underlineLinks} sub={l.underlineLinksSub} on={prefs.underlineLinks} onClick={() => toggle('underlineLinks')} />
                <Toggle icon="🏷️" label={l.highlightHeadings} sub={l.highlightHeadingsSub} on={prefs.highlightHeadings} onClick={() => toggle('highlightHeadings')} />
                <Toggle icon="🎯" label={l.highlightFocus} sub={l.highlightFocusSub} on={prefs.highlightFocus} onClick={() => toggle('highlightFocus')} />
                <Toggle icon="🖱️" label={l.biggerCursor} sub={l.biggerCursorSub} on={prefs.biggerCursor} onClick={() => toggle('biggerCursor')} />
                <Toggle icon="📏" label={l.readingGuide} sub={l.readingGuideSub} on={prefs.readingGuide} onClick={() => toggle('readingGuide')} />
                <Toggle icon="🖼️" label={l.hideImages} sub={l.hideImagesSub} on={prefs.hideImages} onClick={() => toggle('hideImages')} />
              </section>

              {/* ─── INTERACTION ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title">👆 {l.interactionGroup}</div>
                <Toggle icon="🔘" label={l.largerTargets} sub={l.largerTargetsSub} on={prefs.largerTargets} onClick={() => toggle('largerTargets')} />
                <Toggle icon="🔊" label={l.readAloud} sub={l.readAloudSub} on={prefs.readAloud} onClick={() => toggle('readAloud')} />
              </section>

              {/* ─── MOTION ─── */}
              <section className="a11y-section">
                <div className="a11y-section-title">🎬 {l.motionGroup}</div>
                <Toggle icon="⏸️" label={l.reduceMotion} sub={l.reduceMotionSub} on={prefs.reduceMotion} onClick={() => toggle('reduceMotion')} />
                <Toggle icon="⏹️" label={l.pauseMedia} sub={l.pauseMediaSub} on={prefs.pauseMedia} onClick={() => toggle('pauseMedia')} />
              </section>

              {/* ─── RESET ─── */}
              <button className="a11y-reset" onClick={reset}>
                🔄 {l.reset}
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
      <span className="a11y-toggle-icon">{icon}</span>
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
