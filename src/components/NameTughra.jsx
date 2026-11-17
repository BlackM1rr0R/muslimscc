// ═══════════════════════════════════════════════════════
// NameTughra — "Ad tuğrası"
//
// İstifadəçinin adı Osmanlı tuğrası üslubunda bədii kompozisiyaya çevrilir:
//   • ad ərəb hərflərinə saytın öz ad alətləri ilə keçirilir (utils/arabicName:
//     əvvəl lüğət, tapılmasa — açıq-aydın "təxmini" fonetik yazılış);
//   • kompozisiya prosedur çəkilir (utils/tughra.js): altda sere (ad, rüq‘ə
//     şrifti), üç tuğ, zülfələr, iki beyze (içi nəbati bəzəkli) və sağa kollar;
//   • 3 rəng sxemi, latın adı göstər/gizlət;
//   • ixrac: kvadrat 2048×2048 və hekayə 1080×1920 PNG (paylaş və ya yüklə).
// Animasiya yoxdur — kətan yalnız ad/sxem/şrift dəyişəndə yenidən çəkilir.
// Bu, dini mətn deyil, bədii üslubdur. Şəbəkə yoxdur, ad heç yerə getmir.
// ═══════════════════════════════════════════════════════
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { toArabic } from '../utils/arabicName'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import { FONT_FAMILY, SCHEMES, SQUARE, STORY_H, STORY_W, fileName, renderTughra } from '../utils/tughra'
import '../styles/CalligraphyFonts.css'
import '../styles/NameTughra.css'

const DEFAULT_NAME = { az: 'Yusif', en: 'Yusuf', ru: 'Юсуф', ar: 'Yusuf', tr: 'Yusuf' } // lang-ok[Yusuf]: ad latın hərfləri ilə yazılır (giriş sahəsi latın/kiril qəbul edir)
const SWATCH = { navy: ['#0b1736', '#e2bd6a'], ivory: ['#f2e6c9', '#1d2f6e'], crimson: ['#4a0f19', '#e2bd6a'] }

const T = {
  az: {
    ey: 'Osmanlı xəttatlığı', title: 'Ad tuğrası',
    lead: 'Adınızı yazın — o, Osmanlı sultanlarının imza-möhürü olan tuğra üslubunda qızılı kompozisiyaya çevriləcək. Şəkli yükləyib paylaşa bilərsiniz.',
    label: 'Adınız (latın və ya kiril hərfləri ilə)', ph: 'məs. Yusif',
    scheme: 'Rəng', schemes: { navy: 'Lacivərd və qızıl', ivory: 'Fil sümüyü kağız', crimson: 'Tünd qırmızı' },
    latin: 'Latın yazılışını göstər', canvas: 'Ad tuğrası',
    dict: 'Standart ərəb yazılışı (lüğətimizdən).', approx: 'Təxmini ərəb yazılışı — ərəb dilini bilən birinə yoxladın.',
    empty: 'Adınızı yazın.',
    download: 'Kvadrat PNG (2048)', story: 'Hekayə (1080×1920)', share: 'Paylaş',
    parts: 'Tuğranın hissələri',
    partList: [
      ['Sere', 'altda — adın yazıldığı gövdə'], // lang-ok[Sere]: Osmanlı tuğrasının hissəsinin adı (termin)
      ['Tuğ', 'yuxarı qalxan üç uca şaquli xətt'],
      ['Zülfe', 'tuğlardan enən dalğalı bayraqcıqlar'], // lang-ok[Zülfe]: Osmanlı termini
      ['Beyze', 'solda iç-içə iki böyük ilmə'], // lang-ok[Beyze]: Osmanlı termini
      ['Kol', 'sağa uzanan iki uzun qol'],
    ],
    note: 'Tuğra — Osmanlı sultanlarının imza-möhürü üslubu; bu, bədii kompozisiyadır.',
  },
  en: {
    ey: 'Ottoman calligraphy', title: 'Your name as a tughra',
    lead: 'Type your name — it becomes a golden composition in the style of the tughra, the signature-seal of the Ottoman sultans. Download it or share it.',
    label: 'Your name (Latin or Cyrillic letters)', ph: 'e.g. Yusuf',
    scheme: 'Colours', schemes: { navy: 'Lapis and gold', ivory: 'Ivory paper', crimson: 'Deep crimson' },
    latin: 'Show the Latin spelling', canvas: 'Name tughra',
    dict: 'Standard Arabic spelling (from our dictionary).', approx: 'Approximate Arabic spelling — check with someone who knows Arabic.',
    empty: 'Type your name.',
    download: 'Square PNG (2048)', story: 'Story (1080×1920)', share: 'Share',
    parts: 'Parts of a tughra',
    partList: [
      ['Sere', 'the base, where the name is written'],
      ['Tuğ', 'three tall upright strokes'], // lang-ok[Tuğ]: Ottoman term
      ['Zülfe', 'the wavy flags falling from them'],
      ['Beyze', 'two large nested loops on the left'],
      ['Kol', 'two long arms reaching to the right'],
    ],
    note: 'The tughra was the signature-seal style of the Ottoman sultans; this is an artistic composition.',
  },
  ru: {
    ey: 'Османская каллиграфия', title: 'Имя в виде тугры',
    lead: 'Введите имя — оно превратится в золотую композицию в стиле тугры, подписи-печати османских султанов. Изображение можно скачать или отправить.',
    label: 'Ваше имя (латиницей или кириллицей)', ph: 'напр. Юсуф',
    scheme: 'Цвета', schemes: { navy: 'Лазурь и золото', ivory: 'Бумага цвета слоновой кости', crimson: 'Тёмно-красный' },
    latin: 'Показать имя латиницей', canvas: 'Тугра с именем',
    dict: 'Стандартное арабское написание (из нашего словаря).', approx: 'Приблизительное арабское написание — проверьте у знающего арабский.',
    empty: 'Введите имя.',
    download: 'Квадрат PNG (2048)', story: 'Сторис (1080×1920)', share: 'Поделиться',
    parts: 'Части тугры',
    partList: [
      ['Сере', 'основание, где написано имя'],
      ['Туг', 'три высокие вертикальные линии'],
      ['Зюльфе', 'волнистые флажки, спадающие с них'],
      ['Бейзе', 'две большие вложенные петли слева'],
      ['Кол', 'две длинные «руки», уходящие вправо'],
    ],
    note: 'Тугра — стиль подписи-печати османских султанов; это художественная композиция.',
  },
  ar: {
    ey: 'الخط العثماني', title: 'اسمك على هيئة طغراء',
    lead: 'اكتب اسمك فيتحوّل إلى تكوين ذهبي على طراز الطغراء، توقيع السلاطين العثمانيين وختمهم. يمكنك تنزيل الصورة أو مشاركتها.',
    label: 'اسمك (بالحروف اللاتينية أو الكيريلية)', ph: 'مثلًا: يوسف',
    scheme: 'الألوان', schemes: { navy: 'لازوردي وذهبي', ivory: 'ورق عاجي', crimson: 'قرمزي داكن' },
    latin: 'إظهار الاسم بالحروف اللاتينية', canvas: 'طغراء الاسم',
    dict: 'الكتابة العربية المعتادة (من معجمنا).', approx: 'كتابة عربية تقريبية — راجِعها مع من يعرف العربية.',
    empty: 'اكتب اسمك.',
    download: 'صورة مربعة (2048)', story: 'قصة (1080×1920)', share: 'مشاركة',
    parts: 'أجزاء الطغراء',
    partList: [
      ['السِّره', 'القاعدة التي يُكتب فيها الاسم'],
      ['الطُّوغ', 'ثلاثة خطوط قائمة طويلة'],
      ['الزُّلفة', 'الرايات المتموّجة النازلة منها'],
      ['البَيضة', 'حلقتان كبيرتان متداخلتان إلى اليسار'],
      ['الكول', 'ذراعان طويلتان تمتدان إلى اليمين'],
    ],
    note: 'الطغراء طراز توقيع السلاطين العثمانيين وختمهم؛ وهذا تكوين فني.',
  },
  tr: {
    ey: 'Osmanlı hattı', title: 'İsim tuğrası',
    lead: 'Adınızı yazın — Osmanlı padişahlarının imza-mührü olan tuğra üslubunda altın bir kompozisyona dönüşsün. Görseli indirip paylaşabilirsiniz.',
    label: 'Adınız (Latin veya Kiril harfleriyle)', ph: 'ör. Yusuf',
    scheme: 'Renk', schemes: { navy: 'Lacivert ve altın', ivory: 'Fildişi kâğıt', crimson: 'Koyu kırmızı' },
    latin: 'Latin yazılışını göster', canvas: 'İsim tuğrası',
    dict: 'Standart Arapça yazılış (sözlüğümüzden).', approx: 'Yaklaşık Arapça yazılış — Arapça bilen birine kontrol ettirin.',
    empty: 'Adınızı yazın.',
    download: 'Kare PNG (2048)', story: 'Hikâye (1080×1920)', share: 'Paylaş',
    parts: 'Tuğranın bölümleri',
    partList: [
      ['Sere', 'altta — ismin yazıldığı gövde'],
      ['Tuğ', 'yukarı yükselen üç uzun dikey çizgi'],
      ['Zülfe', 'tuğlardan inen dalgalı bayrakçıklar'],
      ['Beyze', 'solda iç içe iki büyük kavis'],
      ['Kol', 'sağa uzanan iki uzun kol'],
    ],
    note: 'Tuğra, Osmanlı padişahlarının imza-mührü üslubudur; bu, sanatsal bir kompozisyondur.',
  },
}

function makeBlob(opts, story) {
  const c = document.createElement('canvas')
  c.width = story ? STORY_W : SQUARE
  c.height = story ? STORY_H : SQUARE
  const ctx = c.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  renderTughra(ctx, c.width, c.height, { ...opts, story })
  return new Promise(res => c.toBlob(res, 'image/png'))
}

export default function NameTughra() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const [name, setName] = useState(() => DEFAULT_NAME[lang] || DEFAULT_NAME.en)
  const [scheme, setScheme] = useState('navy')
  const [showLatin, setShowLatin] = useState(true)
  const [fontTick, setFontTick] = useState(0)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef(null)
  const sizeRef = useRef({ w: 0, dpr: 1 })

  const typed = useDeferredValue(name)
  const conv = useMemo(() => toArabic(typed), [typed])
  const ar = conv.ar
  const latin = typed.trim()

  const draw = useCallback(() => {
    const c = canvasRef.current
    const { w, dpr } = sizeRef.current
    if (!c || !w) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const px = Math.round(w * dpr)
    if (c.width !== px) { c.width = px; c.height = px }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    renderTughra(ctx, px, px, { ar, latin, showLatin, scheme, family: FONT_FAMILY })
  }, [ar, latin, showLatin, scheme])

  // Ölçü: ResizeObserver + DPR (≤ 2)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return undefined
    const fit = () => {
      const w = c.clientWidth
      if (!w || w === sizeRef.current.w) return
      sizeRef.current = { w, dpr: Math.min(2, window.devicePixelRatio || 1) }
      draw()
    }
    fit()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fit); ro.observe(c) }
    else window.addEventListener('resize', fit)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit) }
  }, [draw])

  useEffect(() => { draw() }, [draw, fontTick])

  // Rüq‘ə şrifti gələndə yenidən çək
  useEffect(() => {
    if (!ar || typeof document === 'undefined' || !document.fonts?.load) return undefined
    let off = false
    Promise.all([
      document.fonts.load('400 100px "Aref Ruqaa"', ar),
      document.fonts.load("600 40px 'Amiri'", latin || 'a'),
    ]).catch(() => {}).then(() => { if (!off) setFontTick(t => t + 1) })
    return () => { off = true }
  }, [ar, latin])

  const opts = { ar, latin, showLatin, scheme, family: FONT_FAMILY }
  const ready = Boolean(ar)

  const fontsReady = async () => {
    try { await document.fonts?.load?.('400 100px "Aref Ruqaa"', ar) } catch { /* köhnə brauzer */ }
  }
  const download = async (story) => {
    if (!ready) return
    const win = preopenWindow()
    setBusy(true)
    try {
      await fontsReady()
      const blob = await makeBlob(opts, story)
      if (blob) saveBlob(blob, fileName(latin, story ? 'story' : 'square'), win)
    } finally { setBusy(false) }
  }
  const share = async () => {
    if (!ready) return
    setBusy(true)
    try {
      await fontsReady()
      const blob = await makeBlob(opts, false)
      if (!blob) return
      const fn = fileName(latin)
      const file = new File([blob], fn, { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(blob, fn)
    } finally { setBusy(false) }
  }

  return (
    <section className="ui-card nt" aria-labelledby="nt-title" data-testid="name-tughra" data-ar={ar}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="nt-title" className="nt__title">{u.title}</h2>
      <p className="nt__lead">{u.lead}</p>
      <div className="nt__grid">
        <div className="nt__stage">
          <canvas
            ref={canvasRef}
            className="nt__canvas"
            data-testid="nt-canvas"
            role="img"
            aria-label={ar ? `${u.canvas}: ${latin} — ${ar}` : u.canvas}
          />
        </div>
        <div className="nt__panel">
          <label className="nt__field">
            <span>{u.label}</span>
            <input
              type="text"
              value={name}
              maxLength={40}
              placeholder={u.ph}
              autoComplete="off"
              spellCheck={false}
              data-testid="nt-name"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {ar
            ? (
              <p className="nt__conv">
                <b lang="ar" dir="rtl" className="nt__ar">{ar}</b>
                <span className={conv.approximate ? 'nt__approx' : 'nt__dict'}>{conv.approximate ? u.approx : u.dict}</span>
              </p>
            )
            : <p className="nt__conv nt__dict">{u.empty}</p>}
          <fieldset className="nt__group">
            <legend>{u.scheme}</legend>
            <div className="nt__chips">
              {SCHEMES.map(s => (
                <button key={s.id} type="button" className="ui-chip nt__chip" aria-pressed={scheme === s.id}
                  data-scheme={s.id} onClick={() => setScheme(s.id)}>
                  <i className="nt__sw" style={{ '--a': SWATCH[s.id][0], '--b': SWATCH[s.id][1] }} aria-hidden="true" />
                  {u.schemes[s.id]}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="nt__check">
            <input type="checkbox" checked={showLatin} onChange={(e) => setShowLatin(e.target.checked)} data-testid="nt-latin" />
            <span>{u.latin}</span>
          </label>
          <div className="nt__btns">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="nt-download" onClick={() => download(false)} disabled={busy || !ready}>
              <Icon name="download" size={16} />{u.download}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-testid="nt-story" onClick={() => download(true)} disabled={busy || !ready}>
              <Icon name="phone" size={16} />{u.story}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" data-testid="nt-share" onClick={share} disabled={busy || !ready}>
              <Icon name="share" size={16} />{u.share}
            </button>
          </div>
          <div className="nt__parts">
            <strong>{u.parts}</strong>
            <dl>
              {u.partList.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
          <p className="nt__note">{u.note}</p>
        </div>
      </div>
    </section>
  )
}
