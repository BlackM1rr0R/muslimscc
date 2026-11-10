// ═══════════════════════════════════════════════════════
// Sözə uzun basma menyusu (v7 "Toxunma") — Quran oxuyucusu (QuranPage, lazy)
//
// • Dairəvi menyu barmağın ətrafında yayla açılır (Motion m.*): Məna · Kök ·
//   Dinlə · Qeyd · Paylaş. Barmağı düyməyə sürüşdürüb buraxmaq və ya toxunmaq —
//   seçim. Esc / kənara toxunuş — bağlanır. Həndəsə: utils/radialMenu.js.
// • Klaviatura: «…» düyməsi eyni menyunu adi siyahı kimi açır (role=menu, oxlar,
//   Home/End, Esc fokusu düyməyə qaytarır).
// • Nəticə kiçik pəncərədə (sözün yanında): söz tərcüməsi (Quran.com; dil yoxdursa
//   ingiliscə + qeyd), kök (Quranic Arabic Corpus → /quran-roots), sözün səsi
//   (Əfasinin ayə faylından sözün vaxt aralığı; alınmasa ayə oxunur), qeyd və
//   rəngli vurğu (utils/quranNotes), paylaşma (mövcud paylaşma + şəkil kartı).
// • Dini mətn yazılmır — hər şey mövcud mənbələrdən gəlir.
// • Hərəkəti azalt: menyu animasiyasız görünür, funksiya eynidir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { m } from 'motion/react'
import Icon from '../Icon'
import ShareCardButton from '../ShareCardButton'
import { isPlainClick } from '../PageLink'
import { haptic } from '../../hooks/useHaptic'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { useReduced } from '../../motion/reduced'
import { SPRING, DUR, EASE } from '../../motion/presets'
import { RADIAL, layoutRadial, pickIndex, placePopover, cycleIndex } from '../../utils/radialMenu'
import { ayahWordTokens, fetchWordInfo, fetchWordAudio, wordLang, wordSegment } from '../../utils/ayahWords'
import { loadWordIndex, spacedRoot, ROOT_CAT_LABELS, verbFormLabel } from '../../utils/quranRoots'
import { NOTE_COLORS } from '../../utils/quranNotes'
import { wordRects } from './useWordPress'
import '../../styles/WordMenu.css'

const T = {
  az: {
    menu: 'Söz menyusu', meaning: 'Məna', root: 'Kök', listen: 'Dinlə', note: 'Qeyd', share: 'Paylaş',
    close: 'Bağla', prev: 'Əvvəlki söz', next: 'Növbəti söz', wordN: n => `${n}-ci söz`,
    loading: 'Yüklənir…', err: 'Yüklənmədi. İnternet bağlantısını yoxlayın.', retry: 'Yenidən cəhd et',
    fallback: 'Azərbaycanca söz tərcüməsi hələ yoxdur — ingiliscə göstərilir.',
    // lang-ok[Quran,Quran.com]: saytın rəsmi adı
    srcWbw: 'Söz-söz tərcümə: Quran.com',
    noRoot: 'Bu sözün kökü yoxdur — ədat, əvəzlik və ya başqa köksüz söz.',
    rootOpen: 'Bu kökdən olan bütün sözlər', lemma: 'Lüğət forması',
    srcRoot: 'Kök məlumatı: Quran korpusunun morfologiyası (Lids Universiteti)',
    playing: 'Söz oxunur…', replay: 'Yenidən dinlə', playAyah: 'Bütün ayəni dinlə', tapPlay: 'Dinləmək üçün toxunun',
    audioErr: 'Sözün səsi yüklənmədi — ayə oxunur.', reciter: 'Qari: Mişari əl-Əfasi',
    noteTitle: 'Ayəyə qeyd', color: 'Vurğu rəngi', noColor: 'Rəngsiz',
    colors: { gold: 'Qızılı', green: 'Yaşıl', blue: 'Mavi', rose: 'Çəhrayı', violet: 'Bənövşəyi' },
    notePh: 'Qeydiniz…', save: 'Saxla', saved: 'Saxlanıldı', del: 'Qeydi sil', deleted: 'Qeyd silindi',
    noteHint: 'Bu cihazda saxlanılır; sinxronizasiya açıqdırsa — digər cihazlarınızda da.',
    shareAyah: 'Ayəni paylaş', copyWord: 'Sözü kopyala', copied: 'Kopyalandı',
    hint: 'Barmağı düyməyə sürüşdürüb buraxın',
  },
  en: {
    menu: 'Word menu', meaning: 'Meaning', root: 'Root', listen: 'Listen', note: 'Note', share: 'Share',
    close: 'Close', prev: 'Previous word', next: 'Next word', wordN: n => `word ${n}`,
    loading: 'Loading…', err: 'Could not load. Check your internet connection.', retry: 'Try again',
    fallback: '',
    srcWbw: 'Word-by-word translation: Quran.com',
    noRoot: 'This word has no root — it is a particle, pronoun or another rootless word.',
    rootOpen: 'All words from this root', lemma: 'Dictionary form',
    srcRoot: 'Root data: Quranic Arabic Corpus morphology (University of Leeds)',
    playing: 'Playing the word…', replay: 'Listen again', playAyah: 'Listen to the whole verse', tapPlay: 'Tap to listen',
    audioErr: 'The word audio did not load — playing the verse.', reciter: 'Reciter: Mishary Alafasy',
    noteTitle: 'Note on this verse', color: 'Highlight colour', noColor: 'No colour',
    colors: { gold: 'Gold', green: 'Green', blue: 'Blue', rose: 'Rose', violet: 'Violet' },
    notePh: 'Your note…', save: 'Save', saved: 'Saved', del: 'Delete note', deleted: 'Note deleted',
    noteHint: 'Stored on this device; with sync turned on — on your other devices too.',
    shareAyah: 'Share verse', copyWord: 'Copy word', copied: 'Copied',
    hint: 'Slide your finger onto a button and release',
  },
  ru: {
    menu: 'Меню слова', meaning: 'Значение', root: 'Корень', listen: 'Слушать', note: 'Заметка', share: 'Поделиться',
    close: 'Закрыть', prev: 'Предыдущее слово', next: 'Следующее слово', wordN: n => `слово ${n}`,
    loading: 'Загрузка…', err: 'Не удалось загрузить. Проверьте подключение к интернету.', retry: 'Повторить',
    fallback: 'Пословного перевода на русский пока нет — показан английский.',
    // lang-ok[Quran,Quran.com]: официальное название сайта
    srcWbw: 'Пословный перевод: Quran.com',
    noRoot: 'У этого слова нет корня — это частица, местоимение или другое бескорневое слово.',
    rootOpen: 'Все слова этого корня', lemma: 'Словарная форма',
    srcRoot: 'Корни: морфология корпуса Корана (Университет Лидса)',
    playing: 'Звучит слово…', replay: 'Слушать снова', playAyah: 'Слушать весь аят', tapPlay: 'Нажмите, чтобы слушать',
    audioErr: 'Звук слова не загрузился — звучит аят.', reciter: 'Чтец: Мишари аль-Афаси',
    noteTitle: 'Заметка к аяту', color: 'Цвет выделения', noColor: 'Без цвета',
    colors: { gold: 'Золотой', green: 'Зелёный', blue: 'Синий', rose: 'Розовый', violet: 'Фиолетовый' },
    notePh: 'Ваша заметка…', save: 'Сохранить', saved: 'Сохранено', del: 'Удалить заметку', deleted: 'Заметка удалена',
    noteHint: 'Хранится на этом устройстве; при включённой синхронизации — и на других ваших устройствах.',
    shareAyah: 'Поделиться аятом', copyWord: 'Копировать слово', copied: 'Скопировано',
    hint: 'Проведите пальцем к кнопке и отпустите',
  },
  ar: {
    menu: 'قائمة الكلمة', meaning: 'المعنى', root: 'الجذر', listen: 'استمع', note: 'ملاحظة', share: 'مشاركة',
    close: 'إغلاق', prev: 'الكلمة السابقة', next: 'الكلمة التالية', wordN: n => `الكلمة ${n}`,
    loading: 'جارٍ التحميل…', err: 'تعذّر التحميل. تحقّق من اتصال الإنترنت.', retry: 'أعد المحاولة',
    fallback: 'ترجمة الكلمات بالعربية غير متاحة؛ تُعرض الترجمة الإنجليزية.',
    // lang-ok[Quran,Quran.com]: الاسم الرسمي للموقع
    srcWbw: 'ترجمة الكلمات: Quran.com',
    noRoot: 'ليس لهذه الكلمة جذر — هي حرف أو ضمير أو كلمة جامدة أخرى.',
    rootOpen: 'كل كلمات هذا الجذر', lemma: 'الصيغة المعجمية',
    srcRoot: 'بيانات الجذور: صرف مدوّنة القرآن العربية (جامعة ليدز)',
    playing: 'تُتلى الكلمة…', replay: 'استمع مجددًا', playAyah: 'استمع إلى الآية كاملة', tapPlay: 'المس للاستماع',
    audioErr: 'تعذّر تحميل صوت الكلمة — تُتلى الآية.', reciter: 'القارئ: مشاري العفاسي',
    noteTitle: 'ملاحظة على الآية', color: 'لون التمييز', noColor: 'بلا لون',
    colors: { gold: 'ذهبي', green: 'أخضر', blue: 'أزرق', rose: 'وردي', violet: 'بنفسجي' },
    notePh: 'ملاحظتك…', save: 'احفظ', saved: 'حُفظت', del: 'احذف الملاحظة', deleted: 'حُذفت الملاحظة',
    noteHint: 'تُحفظ على هذا الجهاز؛ وإن كانت المزامنة مفعّلة — على أجهزتك الأخرى أيضًا.',
    shareAyah: 'شارك الآية', copyWord: 'انسخ الكلمة', copied: 'نُسخ',
    hint: 'اسحب إصبعك إلى زر ثم ارفعه',
  },
  tr: {
    menu: 'Kelime menüsü', meaning: 'Anlam', root: 'Kök', listen: 'Dinle', note: 'Not', share: 'Paylaş',
    close: 'Kapat', prev: 'Önceki kelime', next: 'Sonraki kelime', wordN: n => `${n}. kelime`,
    loading: 'Yükleniyor…', err: 'Yüklenemedi. İnternet bağlantınızı kontrol edin.', retry: 'Tekrar dene',
    fallback: '',
    // lang-ok[Quran,Quran.com]: sitenin resmî adı
    srcWbw: 'Kelime kelime meal: Quran.com',
    noRoot: 'Bu kelimenin kökü yok — edat, zamir veya köksüz başka bir kelime.',
    rootOpen: 'Bu kökten gelen bütün kelimeler', lemma: 'Sözlük biçimi',
    srcRoot: 'Kök verisi: Kur’an derleminin morfolojisi (Leeds Üniversitesi)',
    playing: 'Kelime okunuyor…', replay: 'Tekrar dinle', playAyah: 'Ayetin tamamını dinle', tapPlay: 'Dinlemek için dokunun',
    audioErr: 'Kelimenin sesi yüklenemedi — ayet okunuyor.', reciter: 'Kâri: Mişari el-Afasi',
    noteTitle: 'Ayete not', color: 'Vurgu rengi', noColor: 'Renksiz',
    colors: { gold: 'Altın', green: 'Yeşil', blue: 'Mavi', rose: 'Pembe', violet: 'Mor' },
    notePh: 'Notunuz…', save: 'Kaydet', saved: 'Kaydedildi', del: 'Notu sil', deleted: 'Not silindi',
    noteHint: 'Bu cihazda saklanır; senkronizasyon açıksa diğer cihazlarınızda da.',
    shareAyah: 'Ayeti paylaş', copyWord: 'Kelimeyi kopyala', copied: 'Kopyalandı',
    hint: 'Parmağınızı bir düğmeye kaydırıp bırakın',
  },
}

export const WORD_ACTIONS = [
  { id: 'meaning', icon: 'glossary' },
  { id: 'root', icon: 'quranroots' },
  { id: 'listen', icon: 'volume' },
  { id: 'note', icon: 'edit' },
  { id: 'share', icon: 'share' },
]
const WORD_SCOPED = new Set(['meaning', 'root', 'listen'])
const LIST_W = 232

const isRtlDoc = () => { try { return document.documentElement.dir === 'rtl' } catch { return false } }
const docRect = r => ({ left: r.left + window.scrollX, right: r.right + window.scrollX, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY })
const union = rects => (rects.length ? {
  left: Math.min(...rects.map(r => r.left)), right: Math.max(...rects.map(r => r.right)),
  top: Math.min(...rects.map(r => r.top)), bottom: Math.max(...rects.map(r => r.bottom)),
} : null)

/**
 * req: { mode: 'radial'|'list', x, y, el, a, pos, tracking, gesture, focus, anchor, returnFocus, action }
 * verse: { n, ar, tr } · surah — surə nömrəsi · refLabel — «Bəqərə, 255-ci ayə»
 */
export default function WordMenu({ req, verse, surah, lang = 'az', refLabel = '', note, onSaveNote, onRemoveNote, onShareAyah, onPlayAyah, onPausePlayer, onClose }) {
  const t = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const rtl = useMemo(isRtlDoc, [])
  const tokens = useMemo(() => ayahWordTokens(req.el?.textContent || verse?.ar || ''), [req.el, verse])
  const [pos, setPos] = useState(() => Math.min(Math.max(1, req.pos || 1), Math.max(1, tokens.length)))
  const token = tokens.find(x => x.pos === pos) || tokens[0] || null
  const [action, setAction] = useState(req.action || null)
  const [hover, setHover] = useState(-1)
  const menuRef = useRef(null)
  const popRef = useRef(null)
  const itemRefs = useRef([])
  const key = `${surah}:${req.a}`

  const close = useCallback((restore = true) => {
    onClose?.()
    if (restore) { try { req.returnFocus?.focus({ preventScroll: true }) } catch { /* */ } }
  }, [onClose, req.returnFocus])

  // ── Menyu düzülüşü (bir dəfə — açılan anın ekranı) ──
  const layout = useMemo(() => {
    const vw = window.innerWidth, vh = window.innerHeight
    if (req.mode === 'radial') return layoutRadial({ x: req.x, y: req.y, count: WORD_ACTIONS.length, vw, vh, rtl })
    const a = req.anchor || { left: req.x, right: req.x, top: req.y, bottom: req.y }
    return { list: placePopover(a, { w: LIST_W, h: WORD_ACTIONS.length * 48 + 16 }, vw, vh, { gap: 6 }) }
  }, [req, rtl])

  const choose = useCallback((id) => {
    haptic(6)
    setHover(-1)
    setAction(id)
  }, [])

  // ── Barmağın davamı: sürüşdür → buraxanda seç ──
  const tracking = req.mode === 'radial' && req.tracking && !action
  useEffect(() => {
    if (!tracking) return undefined
    const g = req.gesture
    if (!g || g.up) return undefined
    const origin = { x: req.x, y: req.y }
    let raf = 0, last = null, prev = -1, done = false
    const flush = () => {
      raf = 0
      if (!last || done) return
      const i = pickIndex(layout.items, last.x, last.y, { origin })
      if (i !== prev) { prev = i; setHover(i); if (i >= 0) haptic(4) }
    }
    const move = (x, y) => { last = { x, y }; if (!raf) raf = requestAnimationFrame(flush) }
    const onPM = (e) => { if (e.pointerId === g.pointerId) move(e.clientX, e.clientY) }
    // Barmaq menyuda gəzərkən səhifə sürüşməsin (yalnız bu jest müddətində)
    const onTM = (e) => { if (e.cancelable) e.preventDefault(); const p = e.touches?.[0]; if (p) move(p.clientX, p.clientY) }
    const stop = () => {
      done = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPM)
      window.removeEventListener('touchmove', onTM)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
    function onUp(e) {
      if (e.pointerId !== g.pointerId) return
      const i = pickIndex(layout.items, e.clientX, e.clientY, { origin })
      stop()
      if (i >= 0) choose(WORD_ACTIONS[i].id)
      else setHover(-1)   // menyu açıq qalır — toxunmaqla seçmək olar
    }
    function onCancel(e) { if (e.pointerId === g.pointerId) { stop(); setHover(-1) } }
    window.addEventListener('pointermove', onPM, { passive: true })
    window.addEventListener('touchmove', onTM, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    move(g.x, g.y)
    return stop
  }, [tracking, req, layout, choose])

  // ── Esc, kənara toxunuş, sürüşmə ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true) }
    }
    const onDown = (e) => {
      const box = action ? popRef.current : menuRef.current
      if (box && box.contains(e.target)) return
      // «…» düyməsinin özü — onun klik işləyicisi menyunu bağlayır (təkrar açılmasın)
      if (req.returnFocus?.contains?.(e.target)) return
      close(false)
    }
    const onScroll = () => { if (!action) close(false) }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [action, close, req.returnFocus])

  // Klaviatura ilə açılıbsa — ilk düymə fokusda
  useEffect(() => {
    if (action) return
    if (req.focus || req.mode === 'list') requestAnimationFrame(() => itemRefs.current[0]?.focus({ preventScroll: true }))
  }, [action, req.focus, req.mode])

  const onMenuKey = (e) => {
    const n = WORD_ACTIONS.length
    const cur = itemRefs.current.findIndex(b => b === document.activeElement)
    let next = -1
    const fwd = req.mode === 'radial' && rtl ? ['ArrowLeft', 'ArrowDown'] : ['ArrowRight', 'ArrowDown']
    const back = req.mode === 'radial' && rtl ? ['ArrowRight', 'ArrowUp'] : ['ArrowLeft', 'ArrowUp']
    if (fwd.includes(e.key)) next = cycleIndex(cur < 0 ? -1 : cur, 1, n)
    else if (back.includes(e.key)) next = cycleIndex(cur < 0 ? 0 : cur, -1, n)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    else if (e.key === 'Tab') { e.preventDefault(); close(true); return }
    if (next >= 0) { e.preventDefault(); itemRefs.current[next]?.focus({ preventScroll: true }) }
  }

  // ── Sözün vurğusu (sənəd koordinatında — səhifə ilə birgə sürüşür) ──
  const [hl, setHl] = useState([])
  const [anchor, setAnchor] = useState(null)
  useLayoutEffect(() => {
    const showWord = !action || WORD_SCOPED.has(action)
    const rects = token && showWord && req.el?.isConnected ? wordRects(req.el, token) : []
    setHl(rects.map(docRect))
    const a = union(rects) || req.anchor || { left: req.x, right: req.x, top: req.y, bottom: req.y }
    setAnchor(docRect(a))
  }, [token, action, req])

  // ── Nəticə pəncərəsinin yeri: ölçüsü dəyişəndə yenidən ──
  const [popPos, setPopPos] = useState(null)
  useLayoutEffect(() => {
    if (!action || !anchor) return undefined
    const el = popRef.current
    if (!el) return undefined
    const place = () => {
      const sx = window.scrollX, sy = window.scrollY
      const a = { left: anchor.left - sx, right: anchor.right - sx, top: anchor.top - sy, bottom: anchor.bottom - sy }
      const p = placePopover(a, { w: el.offsetWidth, h: el.offsetHeight }, document.documentElement.clientWidth, window.innerHeight)
      setPopPos(prev => (prev && prev.left === p.left + sx && prev.top === p.top + sy ? prev : { left: p.left + sx, top: p.top + sy, side: p.side }))
    }
    place()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [action, anchor])
  // Pəncərə açılanda fokus ona keçir (ekran oxuyucusu başlığı oxuyur)
  useEffect(() => {
    if (action) requestAnimationFrame(() => popRef.current?.focus({ preventScroll: true }))
  }, [action])

  const step = (d) => setPos(p => Math.min(Math.max(1, p + d), tokens.length || 1))
  const onPopKey = (e) => {
    if (!WORD_SCOPED.has(action) || /^(INPUT|TEXTAREA|SELECT|A)$/.test(e.target.tagName)) return
    // Ərəb mətni sağdan sola: sol ox — növbəti söz
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(-1) }
  }

  const label = id => t[id]
  const hoverLabel = hover >= 0 ? label(WORD_ACTIONS[hover].id) : null

  const menu = !action && (
    req.mode === 'radial' ? (
      <div className="wm-radial" ref={menuRef} role="menu" aria-label={`${t.menu} — ${refLabel}`} onKeyDown={onMenuKey} data-testid="word-menu">
        <m.span className="wm-radial__origin" aria-hidden="true" style={{ left: req.x, top: req.y }}
          initial={reduced ? false : { scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduced ? { duration: 0 } : SPRING.bouncy} />
        {WORD_ACTIONS.map((it, i) => {
          const p = layout.items[i]
          return (
            <m.button key={it.id} type="button" role="menuitem" ref={el => { itemRefs.current[i] = el }}
              className={`wm-radial__item${hover === i ? ' is-hover' : ''}`} data-action={it.id}
              style={{ left: p.x - RADIAL.item / 2, top: p.y - RADIAL.item / 2 }}
              aria-label={label(it.id)} title={label(it.id)}
              initial={reduced ? false : { x: req.x - p.x, y: req.y - p.y, scale: 0.3, opacity: 0 }}
              animate={{ x: 0, y: 0, scale: hover === i ? 1.14 : 1, opacity: 1 }}
              transition={reduced ? { duration: 0 } : { ...SPRING.bouncy, delay: i * 0.025 }}
              onClick={() => choose(it.id)}>
              <Icon name={it.icon} size={20} />
            </m.button>
          )
        })}
        <span className="wm-radial__label" aria-hidden="true" data-side={layout.up ? 'up' : 'down'}
          style={{ left: (Math.min(...layout.items.map(p => p.x)) + Math.max(...layout.items.map(p => p.x))) / 2, top: layout.up ? Math.min(...layout.items.map(p => p.y)) - RADIAL.item / 2 - 8 : Math.max(...layout.items.map(p => p.y)) + RADIAL.item / 2 + 8 }}>
          <m.span className="wm-radial__pill" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={reduced ? { duration: 0 } : { duration: DUR.sm, ease: EASE.out, delay: 0.08 }}>
            {hoverLabel || (req.tracking && req.touch ? t.hint : <span lang="ar" dir="rtl">{token?.text}</span>)}
          </m.span>
        </span>
      </div>
    ) : (
      <m.div className="wm-list" ref={menuRef} role="menu" aria-label={`${t.menu} — ${refLabel}`} onKeyDown={onMenuKey} data-testid="word-menu"
        style={{ left: layout.list.left, top: layout.list.top, width: LIST_W }}
        initial={reduced ? false : { opacity: 0, scale: 0.96, y: layout.list.side === 'above' ? 6 : -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : SPRING.snappy}>
        {WORD_ACTIONS.map((it, i) => (
          <button key={it.id} type="button" role="menuitem" ref={el => { itemRefs.current[i] = el }} className="wm-list__item"
            data-action={it.id} onClick={() => choose(it.id)}>
            <Icon name={it.icon} size={18} /><span>{label(it.id)}</span>
          </button>
        ))}
      </m.div>
    )
  )

  const wordNav = action && WORD_SCOPED.has(action) && tokens.length > 1 && (
    <div className="wm-pop__nav" dir="rtl">
      <button type="button" className="wm-pop__navbtn" onClick={() => step(-1)} disabled={pos <= 1} aria-label={t.prev} title={t.prev}>
        <Icon name="chevron" size={18} />
      </button>
      <span className="wm-pop__navn ui-num" dir="ltr">{pos} / {tokens.length}</span>
      <button type="button" className="wm-pop__navbtn" onClick={() => step(1)} disabled={pos >= tokens.length} aria-label={t.next} title={t.next}>
        <Icon name="chevronLeft" size={18} />
      </button>
    </div>
  )

  const pop = action && (
    <m.div className="wm-pop" ref={popRef} role="dialog" tabIndex={-1} aria-labelledby="wm-pop-title" data-testid="word-popover" data-action={action}
      onKeyDown={onPopKey}
      style={{ left: popPos?.left ?? 0, top: popPos?.top ?? 0, visibility: popPos ? 'visible' : 'hidden' }}
      initial={reduced ? false : { opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : SPRING.soft}>
      <header className="wm-pop__head">
        <span className="wm-pop__icon" aria-hidden="true"><Icon name={WORD_ACTIONS.find(x => x.id === action)?.icon} size={18} /></span>
        <h2 id="wm-pop-title" className="wm-pop__title">{action === 'note' ? t.noteTitle : label(action)}</h2>
        <span className="wm-pop__ref ui-num" dir="ltr">{key}{WORD_SCOPED.has(action) ? `:${pos}` : ''}</span>
        <button type="button" className="wm-pop__close" onClick={() => close(true)} aria-label={t.close} title={t.close}>
          <Icon name="close" size={18} />
        </button>
      </header>
      {WORD_SCOPED.has(action) && token && (
        <div className="wm-pop__word">
          <p className="wm-pop__ar" lang="ar" dir="rtl">{token.text}</p>
          {wordNav}
        </div>
      )}
      <div className="wm-pop__body" aria-live="polite">
        {action === 'meaning' && <MeaningPanel k={key} pos={pos} lang={lang} t={t} />}
        {action === 'root' && <RootPanel k={key} pos={pos} lang={lang} t={t} onDone={() => close(false)} />}
        {action === 'listen' && <ListenPanel k={key} pos={pos} t={t} onPlayAyah={() => onPlayAyah?.(req.a)} onPausePlayer={onPausePlayer} />}
        {action === 'note' && <NotePanel k={key} note={note} word={token?.text} pos={pos} t={t} onSave={onSaveNote} onRemove={onRemoveNote} />}
        {action === 'share' && <SharePanel k={key} verse={verse} word={token?.text} refLabel={refLabel} t={t} onShareAyah={onShareAyah} />}
      </div>
    </m.div>
  )

  return createPortal(
    <div className="wm" data-rtl={rtl ? '' : undefined}>
      {hl.map((r, i) => (
        <span key={i} className="wm-hl" aria-hidden="true"
          style={{ left: r.left - 3, top: r.top - 1, width: r.right - r.left + 6, height: r.bottom - r.top + 2 }} />
      ))}
      {!action && <div className="wm-scrim" aria-hidden="true" />}
      {menu}
      {pop}
    </div>,
    document.body,
  )
}

// ── Məna: Quran.com söz-söz tərcüməsi ──
function MeaningPanel({ k, pos, lang, t }) {
  const wl = wordLang(lang)
  const [st, setSt] = useState({ words: null, err: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setSt({ words: null, err: false })
    fetchWordInfo(k, wl).then(words => { if (alive) setSt({ words, err: false }) }).catch(() => { if (alive) setSt({ words: null, err: true }) })
    return () => { alive = false }
  }, [k, wl, attempt])
  if (st.err) return <Failed t={t} onRetry={() => setAttempt(x => x + 1)} />
  if (!st.words) return <p className="wm-pop__muted">{t.loading}</p>
  const w = st.words.find(x => x.p === pos)
  return (
    <>
      {w?.tl && <p className="wm-pop__tl" dir="ltr">{w.tl}</p>}
      <p className="wm-pop__tr" lang={wl} data-testid="word-meaning">{w?.tr || '—'}</p>
      {wl !== lang && t.fallback && <p className="wm-pop__note"><Icon name="info" size={14} />{t.fallback}</p>}
      <p className="wm-pop__src">{t.srcWbw}</p>
    </>
  )
}

// ── Kök: Quranic Arabic Corpus (public/data/quran-roots.json) ──
function RootPanel({ k, pos, lang, t, onDone }) {
  const navigate = useNavigate()
  const [st, setSt] = useState({ map: null, err: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    loadWordIndex().then(map => { if (alive) setSt({ map, err: false }) }).catch(() => { if (alive) setSt({ map: null, err: true }) })
    return () => { alive = false }
  }, [attempt])
  if (st.err) return <Failed t={t} onRetry={() => setAttempt(x => x + 1)} />
  if (!st.map) return <p className="wm-pop__muted">{t.loading}</p>
  const info = st.map.get(`${k}:${pos}`)
  if (!info) return <><p className="wm-pop__muted">{t.noRoot}</p><p className="wm-pop__src">{t.srcRoot}</p></>
  const href = `${pathFor('quranroots', lang)}?root=${encodeURIComponent(info.root)}`
  const cat = (ROOT_CAT_LABELS[lang] || ROOT_CAT_LABELS.en)[info.cat] || ''
  const vf = info.cat === 'V' ? verbFormLabel(info.vf, lang) : ''
  return (
    <>
      <p className="wm-pop__root" lang="ar" dir="rtl" data-testid="word-root">{spacedRoot(info.root)}</p>
      <dl className="wm-pop__dl">
        <div><dt>{t.lemma}</dt><dd lang="ar" dir="rtl">{info.lemma}</dd></div>
        {(cat || vf) && <div><dt aria-hidden="true">·</dt><dd>{[cat, vf].filter(Boolean).join(' · ')}</dd></div>}
      </dl>
      <a className="ui-btn ui-btn--secondary ui-btn--sm wm-pop__cta" href={href}
        onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); onDone(); navigate(href); window.scrollTo(0, 0) }}>
        <Icon name="quranroots" className="ui-btn__icon" /> {t.rootOpen}
      </a>
      <p className="wm-pop__src">{t.srcRoot}</p>
    </>
  )
}

// ── Dinlə: Əfasinin ayə faylından sözün vaxt aralığı (utils/karaoke) ──
function ListenPanel({ k, pos, t, onPlayAyah, onPausePlayer }) {
  const [st, setSt] = useState('loading')   // loading | playing | done | blocked | err
  const audioRef = useRef(null)
  const rafRef = useRef(0)
  const runRef = useRef(0)

  const play = useCallback(async () => {
    const run = ++runRef.current
    cancelAnimationFrame(rafRef.current)
    setSt('loading')
    onPausePlayer?.()
    let data
    try { data = await fetchWordAudio(k) } catch { data = null }
    if (run !== runRef.current) return
    const seg = data && wordSegment(data, pos)
    if (!seg) { setSt('err'); onPlayAyah?.(); return }
    let a = audioRef.current
    if (!a || a.dataset.src !== data.url) {
      try { a?.pause() } catch { /* */ }
      a = new Audio(data.url)
      a.preload = 'auto'
      a.dataset.src = data.url
      audioRef.current = a
    }
    try {
      if (a.readyState < 1) await new Promise((res, rej) => { a.addEventListener('loadedmetadata', res, { once: true }); a.addEventListener('error', rej, { once: true }); a.load() })
      if (run !== runRef.current) return
      a.currentTime = seg.from / 1000
      await a.play()
    } catch (e) {
      if (run !== runRef.current) return
      if (e?.name === 'NotAllowedError') { setSt('blocked'); return }
      setSt('err'); onPlayAyah?.(); return
    }
    setSt('playing')
    const end = seg.to / 1000
    const tick = () => {
      if (run !== runRef.current) return
      if (a.paused || a.currentTime >= end) { a.pause(); setSt('done'); return }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [k, pos, onPlayAyah, onPausePlayer])

  useEffect(() => { play() }, [play])
  useEffect(() => () => { runRef.current++; cancelAnimationFrame(rafRef.current); try { audioRef.current?.pause() } catch { /* */ } }, [])

  return (
    <>
      <p className="wm-pop__muted" role="status">
        {st === 'loading' ? t.loading : st === 'playing' ? t.playing : st === 'err' ? t.audioErr : st === 'blocked' ? t.tapPlay : ' '}
      </p>
      <div className="wm-pop__row">
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={play} disabled={st === 'loading'}>
          <Icon name="play" className="ui-btn__icon" /> {st === 'blocked' ? t.listen : t.replay}
        </button>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { runRef.current++; try { audioRef.current?.pause() } catch { /* */ } setSt('done'); onPlayAyah?.() }}>
          <Icon name="volume" className="ui-btn__icon" /> {t.playAyah}
        </button>
      </div>
      <p className="wm-pop__src">{t.reciter}</p>
    </>
  )
}

// ── Qeyd və rəngli vurğu ──
function NotePanel({ k, note, word, pos, t, onSave, onRemove }) {
  const [c, setC] = useState(note?.c || '')
  const [txt, setTxt] = useState(note?.t || '')
  const [status, setStatus] = useState('')
  const has = !!note
  const save = () => {
    if (!c && !txt.trim()) { onRemove?.(k); setStatus(t.deleted); return }
    onSave?.(k, { c, t: txt, w: word, p: pos })
    setStatus(t.saved)
    haptic(8)
  }
  return (
    <form className="wm-note" onSubmit={(e) => { e.preventDefault(); save() }}>
      <fieldset className="wm-note__colors">
        <legend className="wm-note__legend">{t.color}</legend>
        {['', ...NOTE_COLORS].map(col => (
          <label key={col || 'none'} className="wm-note__swatch" data-c={col || 'none'} title={col ? t.colors[col] : t.noColor}>
            <input type="radio" name={`wm-color-${k}`} value={col} checked={c === col} onChange={() => { setC(col); setStatus('') }} />
            <span className="ui-sr-only">{col ? t.colors[col] : t.noColor}</span>
          </label>
        ))}
      </fieldset>
      <label className="ui-sr-only" htmlFor="wm-note-text">{t.noteTitle}</label>
      <textarea id="wm-note-text" className="ui-input wm-note__text" rows={3} maxLength={2000} value={txt} placeholder={t.notePh}
        onChange={(e) => { setTxt(e.target.value); setStatus('') }} />
      <div className="wm-pop__row">
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="note-save"><Icon name="check" className="ui-btn__icon" /> {t.save}</button>
        {has && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { onRemove?.(k); setC(''); setTxt(''); setStatus(t.deleted) }}>
            <Icon name="trash" className="ui-btn__icon" /> {t.del}
          </button>
        )}
        <span className="wm-note__status" role="status">{status}</span>
      </div>
      <p className="wm-pop__src">{t.noteHint}</p>
    </form>
  )
}

// ── Paylaş: mövcud ayə paylaşması, sözün surəti, şəkil kartı ──
function SharePanel({ k, verse, word, refLabel, t, onShareAyah }) {
  const [copied, setCopied] = useState(false)
  const copyWord = async () => {
    try {
      await navigator.clipboard.writeText(`${word} — ${refLabel} (${k})`)
      setCopied(true)
    } catch { /* pano bağlıdır */ }
  }
  return (
    <>
      <p className="wm-pop__ar wm-pop__ar--sm" lang="ar" dir="rtl">{word}</p>
      <div className="wm-pop__row">
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => verse && onShareAyah?.(verse)}>
          <Icon name="share" className="ui-btn__icon" /> {t.shareAyah}
        </button>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={copyWord}>
          <Icon name={copied ? 'check' : 'copy'} className="ui-btn__icon" /> {copied ? t.copied : t.copyWord}
        </button>
        <ShareCardButton ayah={k} />
      </div>
      {copied && <span className="ui-sr-only" role="status">{t.copied}</span>}
    </>
  )
}

function Failed({ t, onRetry }) {
  return (
    <div className="wm-pop__err" role="alert">
      <p><Icon name="alert" size={14} /> {t.err}</p>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onRetry}><Icon name="refresh" className="ui-btn__icon" /> {t.retry}</button>
    </div>
  )
}
