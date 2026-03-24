import { useState, useCallback, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { QUOTES } from '../data/quotes'
import '../styles/QuoteGeneratorPage.css'

/* ── Labels ── */
const LABELS = {
  az: { title:'Sitat Generatoru', subtitle:'Gözəl İslami sitatlar yaradın', generate:'Yeni sitat', copy:'Kopyala', share:'Paylaş', download:'Yüklə', copied:'Kopyalandı!', theme:'Rəng', category:'Kateqoriya', layout:'Dizayn', custom:'Fərdiləşdir', quran:'Quran', hadith:'Hədis', dua:'Dua', wisdom:'Hikmət', all:'Hamısı', watermark:'muslims.cc', fontSize:'Yazı ölçüsü', bgColor:'Arxa plan', textColor:'Yazı rəngi', borderWidth:'Sərhəd', borderColor:'Sərhəd rəngi', opacity:'Şəffaflıq', reset:'Sıfırla', customBg:'Öz rəng' },
  en: { title:'Quote Generator', subtitle:'Create beautiful Islamic quotes', generate:'New quote', copy:'Copy', share:'Share', download:'Download', copied:'Copied!', theme:'Color', category:'Category', layout:'Layout', custom:'Customize', quran:'Quran', hadith:'Hadith', dua:'Dua', wisdom:'Wisdom', all:'All', watermark:'muslims.cc', fontSize:'Font size', bgColor:'Background', textColor:'Text color', borderWidth:'Border', borderColor:'Border color', opacity:'Opacity', reset:'Reset', customBg:'Custom color' },
  ru: { title:'Генератор цитат', subtitle:'Создавайте красивые исламские цитаты', generate:'Новая цитата', copy:'Копировать', share:'Поделиться', download:'Скачать', copied:'Скопировано!', theme:'Цвет', category:'Категория', layout:'Дизайн', custom:'Настроить', quran:'Коран', hadith:'Хадис', dua:'Дуа', wisdom:'Мудрость', all:'Все', watermark:'muslims.cc', fontSize:'Размер шрифта', bgColor:'Фон', textColor:'Цвет текста', borderWidth:'Рамка', borderColor:'Цвет рамки', opacity:'Прозрачность', reset:'Сбросить', customBg:'Свой цвет' },
  ar: { title:'مولد الاقتباسات', subtitle:'أنشئ اقتباسات إسلامية جميلة', generate:'اقتباس جديد', copy:'نسخ', share:'مشاركة', download:'تحميل', copied:'تم النسخ!', theme:'اللون', category:'الفئة', layout:'التصميم', custom:'تخصيص', quran:'القرآن', hadith:'الحديث', dua:'الدعاء', wisdom:'حكمة', all:'الكل', watermark:'muslims.cc', fontSize:'حجم الخط', bgColor:'الخلفية', textColor:'لون النص', borderWidth:'الإطار', borderColor:'لون الإطار', opacity:'الشفافية', reset:'إعادة ضبط', customBg:'لون مخصص' },
  tr: { title:'Alıntı Oluşturucu', subtitle:'Güzel İslami alıntılar oluşturun', generate:'Yeni alıntı', copy:'Kopyala', share:'Paylaş', download:'İndir', copied:'Kopyalandı!', theme:'Renk', category:'Kategori', layout:'Tasarım', custom:'Özelleştir', quran:'Kuran', hadith:'Hadis', dua:'Dua', wisdom:'Hikmet', all:'Tümü', watermark:'muslims.cc', fontSize:'Yazı boyutu', bgColor:'Arka plan', textColor:'Yazı rengi', borderWidth:'Kenarlık', borderColor:'Kenarlık rengi', opacity:'Saydamlık', reset:'Sıfırla', customBg:'Özel renk' },
}

/* ── Theme configs — 12 tema ── */
const THEMES = [
  { id:'green',   gradient:['#0d4a27','#1a6b3a','#22874a'], textColor:'#ffffff' },
  { id:'gold',    gradient:['#8b6508','#b8860b','#d4a017'], textColor:'#ffffff' },
  { id:'dark',    gradient:['#1a1a2e','#16213e','#0f3460'], textColor:'#ffffff' },
  { id:'mosque',  gradient:['#2d5016','#1a6b3a'],           textColor:'#ffffff' },
  { id:'geo',     gradient:['#4a148c','#6a1b9a','#8e24aa'], textColor:'#ffffff' },
  { id:'minimal', gradient:['#f7f8f5','#f7f8f5'],           textColor:'#1a2e1e' },
  { id:'ocean',   gradient:['#0c4a6e','#0369a1','#0284c7'], textColor:'#ffffff' },
  { id:'sunset',  gradient:['#7c2d12','#9a3412','#ea580c'], textColor:'#ffffff' },
  { id:'rose',    gradient:['#881337','#be123c','#e11d48'], textColor:'#ffffff' },
  { id:'emerald', gradient:['#065f46','#059669','#34d399'], textColor:'#ffffff' },
  { id:'slate',   gradient:['#0f172a','#1e293b','#475569'], textColor:'#ffffff' },
  { id:'sand',    gradient:['#92400e','#d4a017','#fef3c7'], textColor:'#1a2e1e' },
]

const CATEGORIES = ['all','quran','hadith','dua','wisdom']

/* ── Layout / Dizayn seçimləri — 40 fərqli stil ── */
const LAYOUTS = [
  // ── FORMA (8) ──
  { id:'square',     label:'1:1',   ratio:'1/1',   radius:'20px',  decor:'bismillah', desc:'Kvadrat' },
  { id:'portrait',   label:'4:5',   ratio:'4/5',   radius:'20px',  decor:'bismillah', desc:'İnstagram' },
  { id:'story',      label:'9:16',  ratio:'9/16',  radius:'20px',  decor:'bismillah', desc:'Story' },
  { id:'landscape',  label:'16:9',  ratio:'16/9',  radius:'20px',  decor:'bismillah', desc:'Geniş' },
  { id:'circle',     label:'◯',     ratio:'1/1',   radius:'50%',   decor:'none',      desc:'Dairə' },
  { id:'rounded',    label:'▢',     ratio:'1/1',   radius:'60px',  decor:'bismillah', desc:'Yumru' },
  { id:'flat',       label:'□',     ratio:'1/1',   radius:'0',     decor:'none',      desc:'Düz' },
  { id:'pill',       label:'⏺',    ratio:'2/1',   radius:'999px', decor:'none',      desc:'Oval' },

  // ── ÇƏRÇİVƏ (8) ──
  { id:'frame-thin',   label:'▫',  ratio:'1/1', radius:'20px', decor:'frame',          desc:'Nazik çərçivə' },
  { id:'frame-thick',  label:'▪',  ratio:'1/1', radius:'20px', decor:'thickborder',    desc:'Qalın çərçivə' },
  { id:'frame-double', label:'⧈',  ratio:'1/1', radius:'20px', decor:'doubleframe',    desc:'İkiqat çərçivə' },
  { id:'frame-gradient',label:'◐', ratio:'1/1', radius:'20px', decor:'gradientborder', desc:'Gradient çərçivə' },
  { id:'frame-neon',   label:'◈',  ratio:'1/1', radius:'20px', decor:'neon',           desc:'Neon çərçivə' },
  { id:'frame-dashed', label:'▦',  ratio:'1/1', radius:'20px', decor:'dashedframe',    desc:'Kəsik çərçivə' },
  { id:'frame-corner', label:'⌜',  ratio:'1/1', radius:'0',    decor:'cornerframe',    desc:'Künc çərçivə' },
  { id:'frame-shadow', label:'▨',  ratio:'1/1', radius:'24px', decor:'bismillah',      desc:'Dərin kölgə', shadow:'deep' },

  // ── DEKOR (8) ──
  { id:'bismillah',  label:'﷽',  ratio:'1/1', radius:'20px', decor:'bismillah',  desc:'Bismillah' },
  { id:'ornament',   label:'❋',   ratio:'1/1', radius:'20px', decor:'ornament',   desc:'Ornament' },
  { id:'quotemark',  label:'❝',   ratio:'1/1', radius:'20px', decor:'quotemark',  desc:'Dırnaq' },
  { id:'topbar',     label:'▔',   ratio:'1/1', radius:'20px', decor:'topbar',     desc:'Üst xətt' },
  { id:'sideline',   label:'▏',   ratio:'4/5', radius:'20px', decor:'sideline',   desc:'Yan xətt' },
  { id:'dots',       label:'⋯',   ratio:'1/1', radius:'20px', decor:'dots',       desc:'Nöqtələr' },
  { id:'diamond',    label:'◇',   ratio:'1/1', radius:'20px', decor:'diamond',    desc:'Romb' },
  { id:'stars',      label:'✧',   ratio:'1/1', radius:'20px', decor:'starbg',     desc:'Ulduzlar' },

  // ── OVERLAY/TEXTURE (8) ──
  { id:'grid',       label:'⊞',   ratio:'1/1', radius:'20px', decor:'grid',       desc:'Tor' },
  { id:'hex',        label:'⬡',   ratio:'1/1', radius:'20px', decor:'hex',        desc:'Altıbucaq' },
  { id:'diagonal',   label:'╱',   ratio:'1/1', radius:'20px', decor:'diagonal',   desc:'Diaqonal' },
  { id:'circles-bg', label:'◎',   ratio:'1/1', radius:'20px', decor:'circlesbg',  desc:'Dairələr' },
  { id:'wave',       label:'〰',  ratio:'1/1', radius:'20px', decor:'wave',       desc:'Dalğa' },
  { id:'noise',      label:'░',   ratio:'1/1', radius:'20px', decor:'noise',      desc:'Toxunuş' },
  { id:'vignette',   label:'◉',   ratio:'1/1', radius:'20px', decor:'vignette',   desc:'Kölgə kənar' },
  { id:'spotlight',  label:'◍',   ratio:'1/1', radius:'20px', decor:'spotlight',  desc:'İşıq' },

  // ── YAZMA STİLİ (8) ──
  { id:'ar-big',     label:'عـ',   ratio:'1/1', radius:'20px', decor:'bismillah',  desc:'Böyük ərəb', arSize:'clamp(28px,5.5vw,42px)' },
  { id:'ar-small',   label:'عَ',   ratio:'1/1', radius:'20px', decor:'ornament',   desc:'Kiçik ərəb', arSize:'clamp(15px,2.5vw,20px)' },
  { id:'ar-only',    label:'ع',    ratio:'1/1', radius:'20px', decor:'none',       desc:'Yalnız ərəb', hideTranslation:true },
  { id:'tr-only',    label:'Aa',   ratio:'1/1', radius:'20px', decor:'bismillah',  desc:'Yalnız tərcümə', hideArabic:true },
  { id:'minimal',    label:'—',    ratio:'1/1', radius:'20px', decor:'none',       desc:'Minimal' },
  { id:'paper',      label:'📄',   ratio:'4/5', radius:'4px',  decor:'paper',      desc:'Kağız' },
  { id:'ticket',     label:'🎫',   ratio:'5/2', radius:'16px', decor:'line',       desc:'Bilet' },
  { id:'split',      label:'◧',    ratio:'1/1', radius:'20px', decor:'split',      desc:'Bölünmüş' },
]

/* ── Canvas text wrapping helper ── */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

/* ══════════════════════════════════════════════════════ */
export default function QuoteGeneratorPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az
  const cardRef = useRef(null)

  const [category, setCategory] = useState('all')
  const [themeIdx, setThemeIdx] = useState(0)
  const [layoutIdx, setLayoutIdx] = useState(0)
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [copied, setCopied] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [showCustom, setShowCustom] = useState(false)
  const [custom, setCustom] = useState({
    arFontSize: 24,    // px
    trFontSize: 15,    // px
    bgColor: '',       // override background (empty = use theme)
    textColor: '',     // override text color
    borderWidth: 0,    // px
    borderColor: '#ffffff',
    opacity: 100,      // %
  })

  const updateCustom = (key, val) => setCustom(prev => ({ ...prev, [key]: val }))
  const resetCustom = () => setCustom({ arFontSize: 24, trFontSize: 15, bgColor: '', textColor: '', borderWidth: 0, borderColor: '#ffffff', opacity: 100 })

  const theme = THEMES[themeIdx]
  const layout = LAYOUTS[layoutIdx]
  const filtered = category === 'all' ? QUOTES : QUOTES.filter(q => q.cat === category)
  const quote = filtered[quoteIdx % filtered.length] || QUOTES[0]

  /* ── Generate new random quote ── */
  const generateNew = useCallback(() => {
    const pool = category === 'all' ? QUOTES : QUOTES.filter(q => q.cat === category)
    let next
    do { next = Math.floor(Math.random() * pool.length) } while (next === quoteIdx && pool.length > 1)
    setQuoteIdx(next)
    setAnimKey(k => k + 1)
  }, [category, quoteIdx])

  /* ── Copy text ── */
  const copyText = useCallback(async () => {
    const translation = quote.text[lang] || quote.text.en
    const text = `${quote.ar}\n\n${translation}\n\n— ${quote.source}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }, [quote, lang])

  /* ── Share via Web Share API ── */
  const shareQuote = useCallback(async () => {
    const translation = quote.text[lang] || quote.text.en
    const text = `${quote.ar}\n\n${translation}\n\n— ${quote.source}\n\nmuslims.cc`
    if (navigator.share) {
      try { await navigator.share({ title: t.title, text }) } catch { /* user cancelled */ }
    } else {
      // Fallback: copy
      copyText()
    }
  }, [quote, lang, t.title, copyText])

  /* ── Download as image via Canvas API ── */
  const downloadQuote = useCallback(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1080
    const ctx = canvas.getContext('2d')

    // Draw gradient background
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080)
    const colors = theme.gradient
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1 || 1), c))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1080)

    // Grid pattern for mosque/geo themes
    if (theme.id === 'mosque' || theme.id === 'geo') {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 1080; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1080); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke()
      }
    }

    const textColor = theme.textColor
    const dimColor = theme.id === 'minimal' ? '#4a6052' : 'rgba(255,255,255,0.7)'

    // Decorative ornament top
    ctx.font = '48px serif'
    ctx.fillStyle = theme.id === 'minimal' ? 'rgba(26,107,58,0.4)' : 'rgba(255,255,255,0.3)'
    ctx.textAlign = 'center'
    ctx.fillText('﷽', 540, 140)

    // Arabic text
    ctx.font = '48px Amiri, serif'
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    const arLines = wrapText(ctx, quote.ar, 880)
    let arY = 300
    if (arLines.length > 3) arY = 240
    for (const line of arLines) {
      ctx.fillText(line, 540, arY)
      arY += 72
    }

    // Translation
    const translation = quote.text[lang] || quote.text.en
    ctx.font = '32px Inter, sans-serif'
    ctx.fillStyle = dimColor
    const trLines = wrapText(ctx, translation, 860)
    let trY = arY + 40
    for (const line of trLines) {
      ctx.fillText(line, 540, trY)
      trY += 48
    }

    // Divider
    ctx.fillStyle = theme.id === 'minimal' ? 'rgba(26,107,58,0.3)' : 'rgba(255,255,255,0.4)'
    ctx.fillRect(516, trY + 10, 48, 3)

    // Source
    ctx.font = '600 26px Inter, sans-serif'
    ctx.fillStyle = dimColor
    ctx.fillText('— ' + quote.source, 540, trY + 60)

    // Watermark
    ctx.font = '700 22px Inter, sans-serif'
    ctx.fillStyle = theme.id === 'minimal' ? 'rgba(26,107,58,0.2)' : 'rgba(255,255,255,0.25)'
    ctx.textAlign = 'right'
    ctx.fillText('muslims.cc', 1050, 1050)

    // Decorative ornament bottom
    ctx.font = '36px serif'
    ctx.fillStyle = theme.id === 'minimal' ? 'rgba(26,107,58,0.4)' : 'rgba(255,255,255,0.3)'
    ctx.textAlign = 'center'
    ctx.fillText('❁', 540, 1000)

    // Download
    const link = document.createElement('a')
    link.download = 'muslims-cc-quote.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [quote, theme, lang])

  /* ── Category change resets quote ── */
  const handleCategoryChange = useCallback((cat) => {
    setCategory(cat)
    const pool = cat === 'all' ? QUOTES : QUOTES.filter(q => q.cat === cat)
    setQuoteIdx(Math.floor(Math.random() * pool.length))
    setAnimKey(k => k + 1)
  }, [])

  const translation = quote.text[lang] || quote.text.en

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="breadcrumb">
          <button onClick={() => setPage('home')}>Ana səhifə</button>
          <span>/</span>
          <span>{t.title}</span>
        </div>
        <div className="page-hero-arabic">اقْتِبَاسَات</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner qg-layout">

          {/* Controls */}
          <div className="qg-controls">
            {/* Category filter */}
            <div className="qg-control-group" style={{ flex:1 }}>
              <span className="qg-control-label">{t.category}</span>
              <div className="qg-categories">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`tag-btn ${category === cat ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    {t[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme selector */}
            <div className="qg-control-group">
              <span className="qg-control-label">{t.theme}</span>
              <div className="qg-themes">
                {THEMES.map((th, i) => (
                  <button
                    key={th.id}
                    className={`qg-theme-btn ${themeIdx === i ? 'active' : ''}`}
                    data-theme-id={th.id}
                    onClick={() => setThemeIdx(i)}
                    title={th.id}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Layout selector */}
          <div className="qg-control-group" style={{ marginBottom: 24 }}>
            <span className="qg-control-label">{t.layout}</span>
            <div className="qg-layouts">
              {LAYOUTS.map((ly, i) => (
                <button
                  key={ly.id}
                  className={`qg-layout-btn ${layoutIdx === i ? 'active' : ''}`}
                  onClick={() => { setLayoutIdx(i); setAnimKey(k => k + 1) }}
                  title={ly.id}
                >
                  {ly.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customization Panel */}
          <div className="qg-custom-section">
            <button className={`qg-custom-toggle ${showCustom ? 'open' : ''}`} onClick={() => setShowCustom(!showCustom)}>
              🎨 {t.custom} {showCustom ? '▲' : '▼'}
            </button>
            {showCustom && (
              <div className="qg-custom-panel anim-fadeUp">
                <div className="qg-custom-row">
                  <label className="qg-custom-label">{t.fontSize} (Ərəb)</label>
                  <input type="range" min="14" max="48" value={custom.arFontSize} onChange={e => updateCustom('arFontSize', +e.target.value)} className="qg-custom-range" />
                  <span className="qg-custom-value">{custom.arFontSize}px</span>
                </div>
                <div className="qg-custom-row">
                  <label className="qg-custom-label">{t.fontSize} (Tərcümə)</label>
                  <input type="range" min="10" max="28" value={custom.trFontSize} onChange={e => updateCustom('trFontSize', +e.target.value)} className="qg-custom-range" />
                  <span className="qg-custom-value">{custom.trFontSize}px</span>
                </div>
                <div className="qg-custom-row">
                  <label className="qg-custom-label">{t.customBg}</label>
                  <input type="color" value={custom.bgColor || theme.gradient[0]} onChange={e => updateCustom('bgColor', e.target.value)} className="qg-custom-color" />
                  {custom.bgColor && <button className="qg-custom-clear" onClick={() => updateCustom('bgColor', '')}>✕</button>}
                </div>
                <div className="qg-custom-row">
                  <label className="qg-custom-label">{t.textColor}</label>
                  <input type="color" value={custom.textColor || theme.textColor} onChange={e => updateCustom('textColor', e.target.value)} className="qg-custom-color" />
                  {custom.textColor && <button className="qg-custom-clear" onClick={() => updateCustom('textColor', '')}>✕</button>}
                </div>
                <div className="qg-custom-row">
                  <label className="qg-custom-label">{t.borderWidth}</label>
                  <input type="range" min="0" max="10" value={custom.borderWidth} onChange={e => updateCustom('borderWidth', +e.target.value)} className="qg-custom-range" />
                  <span className="qg-custom-value">{custom.borderWidth}px</span>
                </div>
                {custom.borderWidth > 0 && (
                  <div className="qg-custom-row">
                    <label className="qg-custom-label">{t.borderColor}</label>
                    <input type="color" value={custom.borderColor} onChange={e => updateCustom('borderColor', e.target.value)} className="qg-custom-color" />
                  </div>
                )}
                <div className="qg-custom-row">
                  <label className="qg-custom-label">{t.opacity}</label>
                  <input type="range" min="30" max="100" value={custom.opacity} onChange={e => updateCustom('opacity', +e.target.value)} className="qg-custom-range" />
                  <span className="qg-custom-value">{custom.opacity}%</span>
                </div>
                <button className="qg-custom-reset" onClick={resetCustom}>↺ {t.reset}</button>
              </div>
            )}
          </div>

          {/* Quote Card Preview */}
          <div className="qg-card-wrap" key={animKey} ref={cardRef}>
            <div
              className={`qg-card qt-theme-${theme.id} qg-decor-${layout.decor} ${layout.shadow === 'deep' ? 'qg-shadow-deep' : ''}`}
              style={{
                aspectRatio: layout.ratio,
                borderRadius: layout.radius,
                ...(layout.arSize ? { '--qg-ar-size': layout.arSize } : {}),
                ...(custom.bgColor ? { background: custom.bgColor } : {}),
                ...(custom.textColor ? { color: custom.textColor, '--qg-text': custom.textColor } : {}),
                ...(custom.borderWidth > 0 ? { border: `${custom.borderWidth}px solid ${custom.borderColor}` } : {}),
                ...(custom.opacity < 100 ? { opacity: custom.opacity / 100 } : {}),
              }}
            >
              <div className="qg-card-overlay" />

              {layout.decor === 'frame' && <div className="qg-frame-border" />}
              {layout.decor === 'topbar' && <div className="qg-topbar" />}
              {layout.decor === 'sideline' && <div className="qg-sideline" />}
              {layout.decor === 'quotemark' && <div className="qg-quotemark">❝</div>}
              {layout.decor === 'neon' && <div className="qg-neon-border" />}
              {layout.decor === 'gradientborder' && <div className="qg-gradient-border" />}

              {/* Top dekor */}
              {layout.decor === 'bismillah' && <div className="qg-card-decor-top">﷽</div>}
              {layout.decor === 'ornament' && <div className="qg-card-decor-top">✦ ❋ ✦</div>}
              {layout.decor === 'dots' && <div className="qg-card-decor-top">· · · · ·</div>}
              {layout.decor === 'lines' && <div className="qg-card-decor-top">━━━</div>}
              {layout.decor === 'diamond' && <div className="qg-card-decor-top">◆</div>}
              {layout.decor === 'arch' && <div className="qg-card-decor-top">⌓</div>}
              {layout.decor === 'line' && <div className="qg-card-decor-top">───</div>}
              {layout.decor === 'hex' && <div className="qg-card-decor-top">⬡ ⬢ ⬡</div>}
              {layout.decor === 'wave' && <div className="qg-card-decor-top">〰〰〰</div>}
              {layout.decor === 'starbg' && <div className="qg-card-decor-top">✧ ✦ ✧</div>}
              {layout.decor === 'minimaldot' && <div className="qg-card-decor-top">·</div>}
              {layout.decor === 'paper' && <div className="qg-card-decor-top" style={{fontFamily:'serif',fontSize:20}}>❦</div>}
              {layout.decor === 'split' && <div className="qg-split-line" />}

              {/* Ərəb mətni */}
              {!layout.hideArabic && (
                <div className="qg-card-arabic" style={{
                  fontSize: layout.arSize || `${custom.arFontSize}px`,
                  ...(custom.textColor ? { color: custom.textColor } : {}),
                }}>
                  {quote.ar}
                </div>
              )}

              {/* Tərcümə */}
              {!layout.hideTranslation && (
                <div className="qg-card-translation" style={{
                  fontSize: `${custom.trFontSize}px`,
                  ...(custom.textColor ? { color: custom.textColor, opacity: 0.8 } : {}),
                }}>
                  {translation}
                </div>
              )}

              <div className="qg-card-divider" />
              <div className="qg-card-source">— {quote.source}</div>

              {/* Bottom dekor */}
              {layout.decor === 'bismillah' && <div className="qg-card-decor-bottom">❁</div>}
              {layout.decor === 'ornament' && <div className="qg-card-decor-bottom">✦ ❋ ✦</div>}
              {layout.decor === 'thickborder' && <div className="qg-card-decor-bottom">▪ ▪ ▪</div>}

              <div className="qg-card-watermark">{t.watermark}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="qg-actions">
            <button className="qg-action-btn primary" onClick={generateNew}>
              ✦ {t.generate}
            </button>
            <button
              className={`qg-action-btn ${copied ? 'copied' : 'secondary'}`}
              onClick={copyText}
            >
              {copied ? '✓' : '❐'} {copied ? t.copied : t.copy}
            </button>
            <button className="qg-action-btn ghost" onClick={shareQuote}>
              ↗ {t.share}
            </button>
            <button className="qg-action-btn ghost" onClick={downloadQuote}>
              ↓ {t.download}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
