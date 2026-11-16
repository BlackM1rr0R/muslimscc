// ═══════════════════════════════════════════════════════
// StickerPack — WhatsApp / Telegram üçün stikerlər (/quotes)
//
// 10 ifadə ("Cümə mübarək", "Bayramınız mübarək", "Allah qəbul etsin"…) ərəb xətti
// ilə (rüq'ə / kufi / nəsx), 3 rəng. Hər stiker 512×512 şəffaf PNG (WebP dəstəklənirsə
// WhatsApp üçün WebP də). Toxun → paylaş (telefon) və ya yüklə. Veb sayt stikeri
// birbaşa WhatsApp-a "quraşdıra" bilmir — necə əlavə ediləcəyi addımlarla yazılıb.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { PHRASES, PALETTES, SCRIPTS, drawSticker, STICKER_SIZE } from '../utils/stickers'
import { saveBlob, preopenWindow, canShareFile } from '../utils/quoteCard'
import '../styles/CalligraphyFonts.css'
import '../styles/StickerPack.css'

const T = {
  az: { ey: 'Paylaşmaq üçün', title: 'Stikerlər', lead: 'Cümə, bayram, Ramazan təbrikləri və gündəlik ifadələr — ərəb xətti ilə. Stikerə toxunun: telefonda paylaşın və ya şəkil kimi yükləyin.', script: 'Xətt', color: 'Rəng', ribbon: 'Altda yazı', scripts: { ruqaa: 'Rüq\'ə', kufi: 'Kufi', naskh: 'Nəsx' }, colors: { emerald: 'Zümrüd', lapis: 'Lacivərd', rose: 'Qızılgül' }, share: 'Paylaş', save: 'Yüklə', all: 'Hamısını paylaş', // lang-ok[Stikerlər,Stikerə]: az-da işlənən söz (stiker)
    howT: 'Telefona stiker kimi necə əlavə edilir?', how: ['WhatsApp: stikeri yükləyin → çatda stikerlər bölməsi → "Stiker yarat" → yüklədiyiniz şəkli seçin.', 'Telegram: @Stickers botuna /newpack yazın → yüklənmiş PNG faylları (512×512) bir-bir göndərin → paketə ad verin.', 'Və ya sadəcə "Paylaş" düyməsi ilə şəkil kimi göndərin.'] }, // lang-ok[Stickers,newpack,PNG,stiker,stikeri]: botun adı, əmr və fayl növü
  en: { ey: 'To share', title: 'Stickers', lead: 'Friday, Eid and Ramadan greetings and everyday phrases — in Arabic calligraphy. Tap a sticker: share it from your phone or download it as an image.', script: 'Script', color: 'Colour', ribbon: 'Caption below', scripts: { ruqaa: 'Ruqʿa', kufi: 'Kufic', naskh: 'Naskh' }, colors: { emerald: 'Emerald', lapis: 'Lapis', rose: 'Rose' }, share: 'Share', save: 'Download', all: 'Share all',
    howT: 'How do I add them as stickers?', how: ['WhatsApp: download the sticker → in a chat open stickers → “Create sticker” → pick the downloaded image.', 'Telegram: send /newpack to the @Stickers bot → send the downloaded PNG files (512×512) one by one → name the pack.', 'Or simply send it as an image with “Share”.'] },
  ru: { ey: 'Чтобы поделиться', title: 'Стикеры', lead: 'Поздравления с пятницей, праздником и Рамаданом и повседневные фразы — арабской каллиграфией. Нажмите на стикер: поделитесь с телефона или скачайте как изображение.', script: 'Почерк', color: 'Цвет', ribbon: 'Подпись внизу', scripts: { ruqaa: 'Рика', kufi: 'Куфи', naskh: 'Насх' }, colors: { emerald: 'Изумруд', lapis: 'Лазурит', rose: 'Роза' }, share: 'Поделиться', save: 'Скачать', all: 'Поделиться всеми',
    howT: 'Как добавить их как стикеры?', how: ['WhatsApp: скачайте стикер → в чате откройте стикеры → «Создать стикер» → выберите скачанное изображение.', 'Telegram: отправьте /newpack боту @Stickers → по одному отправьте скачанные PNG (512×512) → назовите набор.', 'Или просто отправьте как изображение кнопкой «Поделиться».'] }, // lang-ok[newpack,Stickers,PNG]: команда, бот и тип файла
  tr: { ey: 'Paylaşmak için', title: 'Çıkartmalar', lead: 'Cuma, bayram ve Ramazan tebrikleri ile gündelik ifadeler — Arap hattıyla. Bir çıkartmaya dokunun: telefondan paylaşın veya resim olarak indirin.', script: 'Hat', color: 'Renk', ribbon: 'Altta yazı', scripts: { ruqaa: 'Rika', kufi: 'Kûfî', naskh: 'Nesih' }, colors: { emerald: 'Zümrüt', lapis: 'Lacivert', rose: 'Gül' }, share: 'Paylaş', save: 'İndir', all: 'Hepsini paylaş',
    howT: 'Çıkartma olarak nasıl eklenir?', how: ['WhatsApp: çıkartmayı indirin → sohbette çıkartmalar → “Çıkartma oluştur” → indirdiğiniz resmi seçin.', 'Telegram: @Stickers botuna /newpack yazın → indirilen PNG dosyalarını (512×512) tek tek gönderin → pakete ad verin.', 'Ya da “Paylaş” ile resim olarak gönderin.'] },
  ar: { ey: 'للمشاركة', title: 'ملصقات', lead: 'تهاني الجمعة والعيد ورمضان وعبارات يومية — بالخط العربي. المس الملصق: شاركه من هاتفك أو نزّله صورة.', script: 'الخط', color: 'اللون', ribbon: 'شريط بالأسفل', scripts: { ruqaa: 'رقعة', kufi: 'كوفي', naskh: 'نسخ' }, colors: { emerald: 'زمردي', lapis: 'لازوردي', rose: 'وردي' }, share: 'شارك', save: 'نزّل', all: 'شارك الكل',
    howT: 'كيف أضيفها ملصقات؟', how: ['واتساب: نزّل الملصق ← افتح الملصقات في المحادثة ← «إنشاء ملصق» ← اختر الصورة.', 'تيليغرام: أرسل /newpack إلى البوت @Stickers ← أرسل ملفات PNG (512×512) واحدًا تلو الآخر ← سمِّ الحزمة.', 'أو أرسلها صورةً بزر «شارك».'] }, // lang-ok[newpack,Stickers,PNG]: أمر البوت ونوع الملف
}

const fileOf = async (canvas, id) => {
  const webp = await new Promise((ok) => canvas.toBlob(ok, 'image/webp', 0.92))
  const blob = webp && webp.type === 'image/webp' ? webp : await new Promise((ok) => canvas.toBlob(ok, 'image/png'))
  if (!blob) return null
  const ext = blob.type === 'image/webp' ? 'webp' : 'png'
  return new File([blob], `muslims-cc-${id}.${ext}`, { type: blob.type })
}
const pngOf = async (canvas, id) => {
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/png'))
  return blob ? new File([blob], `muslims-cc-${id}.png`, { type: 'image/png' }) : null
}

export default function StickerPack() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const [script, setScript] = useState('ruqaa')
  const [palette, setPalette] = useState('emerald')
  const [ribbon, setRibbon] = useState(lang !== 'ar')
  const [fontsReady, setFontsReady] = useState(0)
  const [sel, setSel] = useState(null)
  const canvases = useRef({})

  useEffect(() => {
    const f = SCRIPTS[script]
    if (!document.fonts?.load) return
    let live = true
    document.fonts.load(`${f.weight} 64px ${f.family}`, 'جمعة مباركة').then(() => { if (live) setFontsReady((n) => n + 1) }).catch(() => {})
    return () => { live = false }
  }, [script])

  useEffect(() => {
    for (const p of PHRASES) {
      const c = canvases.current[p.id]
      if (!c) continue
      const label = ribbon ? (lang === 'ar' ? p.arT : pickUi(p, lang, 'en')) : ''
      drawSticker(c.getContext('2d'), { phrase: p, label: label === p.ar ? '' : label, palette, script })
    }
  }, [script, palette, ribbon, lang, fontsReady])

  const shareOne = async (p) => {
    const c = canvases.current[p.id]
    if (!c) return
    const file = await fileOf(c, p.id)
    if (file && canShareFile(file)) { try { await navigator.share({ files: [file] }); return } catch { return } }
    const png = await pngOf(c, p.id)
    if (png) saveBlob(png, png.name)
  }
  const saveOne = async (p) => {
    const win = preopenWindow()
    const c = canvases.current[p.id]
    const png = c && await pngOf(c, p.id)
    if (png) saveBlob(png, png.name, win)
  }
  const shareAll = async () => {
    const files = (await Promise.all(PHRASES.map((p) => canvases.current[p.id] && fileOf(canvases.current[p.id], p.id)))).filter(Boolean)
    try { if (files.length && navigator.canShare?.({ files })) { await navigator.share({ files }); return } } catch { return }
    for (const p of PHRASES.slice(0, 3)) await saveOne(p)
  }

  return (
    <section className="ui-section ui-section--tight stk" aria-labelledby="stk-h" data-testid="sticker-pack">
      <div className="ui-container">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="stk-h" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="stk-lead">{t.lead}</p>

        <div className="stk-controls">
          <div className="stk-group" role="group" aria-label={t.script}>
            <span className="stk-group__l">{t.script}</span>
            {Object.keys(SCRIPTS).map((k) => (
              <button key={k} type="button" className="ui-chip" aria-pressed={script === k} onClick={() => setScript(k)}>{t.scripts[k]}</button>
            ))}
          </div>
          <div className="stk-group" role="group" aria-label={t.color}>
            <span className="stk-group__l">{t.color}</span>
            {Object.keys(PALETTES).map((k) => (
              <button key={k} type="button" className="ui-chip stk-swatch" aria-pressed={palette === k} onClick={() => setPalette(k)}>
                <span className="stk-dot" style={{ background: PALETTES[k].bg2 }} aria-hidden="true" />{t.colors[k]}
              </button>
            ))}
          </div>
          <label className="stk-toggle">
            <input type="checkbox" checked={ribbon} onChange={(e) => setRibbon(e.target.checked)} /> {t.ribbon}
          </label>
        </div>

        <ul className="stk-grid">
          {PHRASES.map((p) => (
            <li key={p.id} className={`stk-item${sel === p.id ? ' is-sel' : ''}`}>
              <button type="button" className="stk-face" onClick={() => setSel(sel === p.id ? null : p.id)} aria-expanded={sel === p.id}
                aria-label={`${p.ar} — ${pickUi(p, lang, 'en')}`}>
                <canvas ref={(el) => { if (el) canvases.current[p.id] = el }} width={STICKER_SIZE} height={STICKER_SIZE} className="stk-canvas" aria-hidden="true" />
              </button>
              <div className="stk-acts">
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--square" onClick={() => shareOne(p)} aria-label={`${t.share}: ${pickUi(p, lang, 'en')}`}><Icon name="share" size={16} /></button>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--square" onClick={() => saveOne(p)} aria-label={`${t.save}: ${pickUi(p, lang, 'en')}`}><Icon name="download" size={16} /></button>
              </div>
            </li>
          ))}
        </ul>

        <div className="stk-foot">
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={shareAll}><Icon name="share" className="ui-btn__icon" /> {t.all}</button>
        </div>
        <details className="stk-how">
          <summary>{t.howT}</summary>
          <ol>{t.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
        </details>
      </div>
    </section>
  )
}
