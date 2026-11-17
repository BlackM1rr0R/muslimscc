// ═══════════════════════════════════════════════════════
// StoryBooks (v8) — uşaqlar üçün şəkilli, canlı hekayə kitabları (/kids)
//
// • Hər kitab — uşaq bölməsində ARTIQ olan bir peyğəmbər hekayəsidir
//   (data/pageGuides/KidsPage.js → STORIES). Mətn OLDUĞU KİMİ götürülür,
//   yalnız cümlə sərhədlərində səhifələrə bölünür (utils/storyBooks.js →
//   paginate; testdə: səhifələrin birləşməsi === orijinal mətn). Yeni dini
//   mətn yazılmayıb — yalnız kiçik interfeys yazıları (T).
// • Şəkillər əl ilə çəkilmiş SVG səhnələridir (components/storybook/*):
//   dəniz, gəmi, ulduzlar, od və güllər, quyu, əsa və yarılan dəniz,
//   xurma, beşik… Heç bir CANLI təsviri yoxdur (sahibin qərarı): insan,
//   peyğəmbər, mələk, heyvan, quş, balıq, həşərat — siluet də. Hər kitabın öz palitrası, hər səhifənin öz səhnə variantı
//   (səhnə addımı + kamera/parallaks).
// • Rəf → kitabı aç (üz qabığı açılır) → səhifə çevrilir (3D vərəq, yalnız
//   transform). Düymələr, sürüşdürmə (pointer), ox düymələri, nöqtələr,
//   "Yenidən oxu", sonda Quran istinadları + "Quranda oxu" keçidi.
// • Səsli oxu (speechSynthesis) — standart olaraq söndürülüb, yalnız həmin
//   dildə səs varsa görünür. Səs yazılmır, tanınmır.
// • Son səhifə yaddaşı: localStorage "muslim_cc_storybooks" (yalnız try içində).
// • Hərəkəti azalt: səhifə dərhal dəyişir, səhnələr tərpənmir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { getSurahLocal } from '../data/surahNamesAz'
import { SURAH_TABLE } from '../data/mushafIndex'
import { STORIES } from '../data/pageGuides/KidsPage'
import { paginate, pageFraction, beatAt, bookId, parseRef, loadProgress, saveProgress } from '../utils/storyBooks'
import { BOOK_ART, CAMS } from './storybook/books'
import StoryScene from './storybook/StoryScene'
import Icon from './Icon'
import '../styles/StoryBooks.css'

const T = {
  az: { ey: 'Uşaqlar üçün', title: 'Şəkilli hekayə kitabları', lead: 'Uşaq bölməsindəki peyğəmbər hekayələri indi şəkilli kitab kimidir: kitabı seç, aç və vərəqlə. Şəkillərdə insan təsviri yoxdur — hekayəni təbiət və əşyalar danışır.', open: 'Kitabı aç', next: 'Növbəti səhifə', prev: 'Əvvəlki səhifə', close: 'Bağla', end: 'Son', again: 'Yenidən oxu', quran: 'Quranda oxu', from: 'Qurandan', listen: 'Səsli oxu', page: 'Səhifə', cont: 'Davam et', other: 'Başqa kitab seç', lesson: 'Bu hekayədən', swipe: 'Vərəqləmək üçün sürüşdür' },
  en: { ey: 'For children', title: 'Picture storybooks', lead: 'The prophet stories from the kids’ section, now as picture books: pick a book, open it and turn the pages. There are no pictures of people — nature and objects tell the story.', open: 'Open the book', next: 'Next page', prev: 'Previous page', close: 'Close', end: 'The end', again: 'Read again', quran: 'Read in the Quran', from: 'From the Quran', listen: 'Read aloud', page: 'Page', cont: 'Continue', other: 'Choose another book', lesson: 'From this story', swipe: 'Swipe to turn the page' },
  ru: { ey: 'Для детей', title: 'Книжки с картинками', lead: 'Рассказы о пророках из детского раздела — теперь книжки с картинками: выбери книгу, открой и листай. Людей на рисунках нет — историю рассказывают природа и предметы.', open: 'Открыть книгу', next: 'Следующая страница', prev: 'Предыдущая страница', close: 'Закрыть', end: 'Конец', again: 'Читать снова', quran: 'Читать в Коране', from: 'Из Корана', listen: 'Читать вслух', page: 'Страница', cont: 'Продолжить', other: 'Выбрать другую книгу', lesson: 'Из этого рассказа', swipe: 'Проведи, чтобы перелистнуть' },
  ar: { ey: 'للأطفال', title: 'كتب القصص المصوّرة', lead: 'قصص الأنبياء من قسم الأطفال صارت كتبًا مصوّرة: اختر كتابًا وافتحه وقلّب صفحاته. لا صور للناس فيها، بل تحكي القصةَ الطبيعةُ والأشياء.', open: 'افتح الكتاب', next: 'الصفحة التالية', prev: 'الصفحة السابقة', close: 'إغلاق', end: 'النهاية', again: 'اقرأ من جديد', quran: 'اقرأ في القرآن', from: 'من القرآن', listen: 'القراءة بصوت', page: 'صفحة', cont: 'تابِع', other: 'اختر كتابًا آخر', lesson: 'من هذه القصة', swipe: 'اسحب لتقليب الصفحة' },
  tr: { ey: 'Çocuklar için', title: 'Resimli hikâye kitapları', lead: 'Çocuk bölümündeki peygamber kıssaları artık resimli kitap: bir kitap seç, aç ve sayfaları çevir. Resimlerde insan yok — kıssayı tabiat ve eşyalar anlatıyor.', open: 'Kitabı aç', next: 'Sonraki sayfa', prev: 'Önceki sayfa', close: 'Kapat', end: 'Son', again: 'Yeniden oku', quran: 'Kur’an’da oku', from: 'Kur’an’dan', listen: 'Sesli oku', page: 'Sayfa', cont: 'Devam et', other: 'Başka kitap seç', lesson: 'Bu kıssadan', swipe: 'Sayfayı çevirmek için kaydır' },
}

const TURN_MS = 720
const OPEN_MS = 950
const SPEECH_LANG = { az: 'az', en: 'en', ru: 'ru', ar: 'ar', tr: 'tr' }

const txt = (o, lang) => (o ? (pickUi(o, lang, 'en') || o.en || o.az || '') : '')

function surahName(s, lang) {
  const loc = getSurahLocal(s, lang)?.name
  if (loc) return loc
  const row = SURAH_TABLE[s - 1]
  return row ? (lang === 'ar' ? row[4] : row[5]) : String(s)
}

/** Kitabın səhifə modeli (dil üzrə) */
function useBook(story, lang) {
  return useMemo(() => {
    const id = bookId(story)
    const art = BOOK_ART[id] || BOOK_ART.adam
    const textLang = story.text[lang] ? lang : 'en'
    const text = txt(story.text, lang)
    const pages = paginate(text).map((p, i) => {
      const k = art.beats[beatAt(art.beats, pageFraction(p, text.length))].k
      return { ...p, k, cam: CAMS[i % CAMS.length] }
    })
    return { id, art, text, textLang, pages, total: pages.length + 1 }
  }, [story, lang])
}

// ── Üz qabığı (rəfdə və açılış animasiyasında) ──
function CoverFace({ story, lang, art, id, still = true }) {
  const ref0 = story.refs[0]
  const pr = parseRef(ref0)
  return (
    <span className="sb-cover__face">
      <span className="sb-cover__spine" aria-hidden="true" />
      <span className={`sb-cover__art${still ? '' : ' sb-live'}`}>
        <StoryScene book={id} k={art.beats[art.cover].k} cam={0} pal={art.pal} />
        <span className="sb-cover__ar" lang="ar" dir="rtl">{story.ar}</span>
      </span>
      <span className="sb-cover__plate">
        <span className="sb-cover__title">{txt(story.title, lang)}</span>
        {pr && <span className="sb-cover__ref"><bdi>{surahName(pr.s, lang)}</bdi> <bdi className="ui-num" dir="ltr">{ref0}</bdi></span>}
      </span>
    </span>
  )
}

// ── Bir səhifə: səhnə + kağız ──
function PageView({ book, idx, lang, u, story, onAgain, onClose, part = 'all' }) {
  const isEnd = idx >= book.pages.length
  const pg = isEnd ? null : book.pages[idx]
  // son səhifə: üz qabığının səhnəsi (sonuncu səhifə ilə eynidirsə, başqa kamera ilə)
  const endK = book.art.beats[book.art.cover].k
  const endCam = book.pages.length && book.pages[book.pages.length - 1].k === endK ? 0.8 : 0
  const dir = book.textLang === 'ar' ? 'rtl' : 'ltr'
  const scene = (
    <div className="sb-page__scene">
      <StoryScene book={book.id} k={isEnd ? endK : pg.k} cam={isEnd ? endCam : pg.cam} pal={book.art.pal} />
    </div>
  )
  if (part === 'scene') return scene
  return (
    <div className={`sb-page${isEnd ? ' sb-page--end' : ''}`}>
      {scene}
      <div className="sb-paper">
        {isEnd ? (
          <div className="sb-endpage">
            <p className="sb-end__title">{u.end}</p>
            <p className="sb-end__lesson" lang={book.textLang} dir={dir}>
              <span className="sb-end__lbl"><Icon name="bulb" size={18} /> {u.lesson}</span>
              {txt(story.lesson, lang)}
            </p>
            <div className="sb-end__refs">
              <span className="sb-end__lbl">{u.from}</span>
              <ul>
                {story.refs.map(r => {
                  const p = parseRef(r)
                  if (!p) return null
                  return (
                    <li key={r}>
                      <span className="sb-end__ref"><bdi>{surahName(p.s, lang)}</bdi> <bdi className="ui-num" dir="ltr">{r}</bdi></span>
                      <a className="ui-link sb-end__link" href={`${pathFor('quran', lang, p.s)}?a=${p.a}`}>{u.quran} <Icon name="arrow" size={14} className="sb-flip" /></a>
                    </li>
                  )
                })}
              </ul>
            </div>
            {onAgain && (
              <div className="sb-end__btns">
                <button type="button" className="ui-btn ui-btn--primary" onClick={onAgain}><Icon name="refresh" size={18} className="ui-btn__icon" /> {u.again}</button>
                <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>{u.other}</button>
              </div>
            )}
          </div>
        ) : (
          <p className={`sb-text${idx === 0 ? ' sb-text--first' : ''}`} lang={book.textLang} dir={dir}>{pg.text.trim()}</p>
        )}
        <span className="sb-folio ui-num" aria-hidden="true">{idx + 1}</span>
      </div>
    </div>
  )
}

// ── Oxuyucu (dialoq) ──
function Reader({ story, lang, u, reduced, start, onClose, onPage }) {
  const book = useBook(story, lang)
  const [idx, setIdx] = useState(() => (start > 0 && start < book.total - 1 ? start : 0))
  const [turn, setTurn] = useState(null)       // { dir: 'next'|'prev', from, to, n }
  const [opening, setOpening] = useState(!reduced)
  const [hidden, setHidden] = useState(false)
  const [speak, setSpeak] = useState(false)
  const [voice, setVoice] = useState(null)
  const dlg = useRef(null)
  const ptr = useRef(null)
  const turnN = useRef(0)
  const rtl = lang === 'ar'

  const go = useCallback((n) => {
    if (n < 0 || n >= book.total || n === idx) return
    if (!reduced) {
      turnN.current += 1
      setTurn({ dir: n > idx ? 'next' : 'prev', from: idx, to: n, n: turnN.current })
    }
    setIdx(n)
    onPage(book.id, n)
  }, [book.total, book.id, idx, reduced, onPage])

  // vərəq animasiyası bitəndə (və ya tab gizlidirsə) — ehtiyat taymer
  useEffect(() => {
    if (!turn) return undefined
    const t = setTimeout(() => setTurn(cur => (cur && cur.n === turn.n ? null : cur)), TURN_MS + 160)
    return () => clearTimeout(t)
  }, [turn])
  useEffect(() => {
    if (!opening) return undefined
    const t = setTimeout(() => setOpening(false), OPEN_MS + 120)
    return () => clearTimeout(t)
  }, [opening])

  // fokus, səhifənin sürüşməsini kilidlə, tab gizlənəndə animasiyanı dayandır
  useEffect(() => {
    const el = dlg.current
    try { el?.focus({ preventScroll: true }) } catch { /* köhnə brauzer */ }
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    const vis = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', vis)
    return () => {
      html.style.overflow = prev
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  // Səsli oxu — yalnız həmin dildə səs varsa
  const sLang = SPEECH_LANG[book.textLang] || 'en'
  useEffect(() => {
    const ss = typeof window !== 'undefined' ? window.speechSynthesis : null
    if (!ss) return undefined
    const pickV = () => {
      try {
        const vs = ss.getVoices() || []
        setVoice(vs.find(v => String(v.lang || '').toLowerCase().startsWith(sLang)) || null)
      } catch { setVoice(null) }
    }
    pickV()
    try { ss.addEventListener('voiceschanged', pickV) } catch { /* */ }
    return () => {
      try { ss.removeEventListener('voiceschanged', pickV) } catch { /* */ }
      try { ss.cancel() } catch { /* */ }
    }
  }, [sLang])
  useEffect(() => {
    const ss = typeof window !== 'undefined' ? window.speechSynthesis : null
    if (!ss) return
    try { ss.cancel() } catch { /* */ }
    if (!speak || !voice) return
    const say = idx < book.pages.length ? book.pages[idx].text.trim() : `${u.end}. ${txt(story.lesson, lang)}`
    try {
      const ut = new SpeechSynthesisUtterance(say)
      ut.voice = voice
      ut.lang = voice.lang
      ut.rate = 0.9
      ss.speak(ut)
    } catch { /* səs alınmadı */ }
  }, [speak, voice, idx, book.pages, u.end, story.lesson, lang])

  const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight'
  const prevKey = rtl ? 'ArrowRight' : 'ArrowLeft'
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === nextKey) { e.preventDefault(); go(idx + 1) }
    else if (e.key === prevKey) { e.preventDefault(); go(idx - 1) }
    else if (e.key === 'Home') { e.preventDefault(); go(0) }
    else if (e.key === 'End') { e.preventDefault(); go(book.total - 1) }
    else if (e.key === 'Tab') {
      // sadə fokus tələsi
      const f = dlg.current?.querySelectorAll('button:not([disabled]), a[href]')
      if (!f || !f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }
  const onDown = (e) => {
    if (e.target.closest('a, button')) return
    ptr.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const onUp = (e) => {
    const p = ptr.current
    ptr.current = null
    if (!p || p.id !== e.pointerId) return
    const dx = e.clientX - p.x, dy = e.clientY - p.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.3) return
    const forward = rtl ? dx > 0 : dx < 0
    go(forward ? idx + 1 : idx - 1)
  }

  const base = turn && turn.dir === 'prev' ? turn.from : idx
  const isEnd = idx >= book.pages.length
  const title = txt(story.title, lang)
  const common = { book, lang, u, story }
  const art = book.art

  return (
      <div ref={dlg} className={`sb-reader${reduced ? ' sb-still' : ''}${hidden ? ' sb-paused' : ''}`}
        role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={onKey} dir={rtl ? 'rtl' : 'ltr'}
        data-testid="sb-reader" data-page={idx} data-pages={book.total} data-book={book.id}
        style={{ '--sb-a': art.pal.a, '--sb-b': art.pal.b, '--sb-c': art.pal.c, '--sb-d': art.pal.d, '--sb-paper': art.pal.paper, '--sb-dir': rtl ? -1 : 1 }}>
        <header className="sb-bar">
          <button type="button" className="sb-round sb-round--sm" onClick={onClose} aria-label={u.close} data-testid="sb-close">
            <Icon name="close" size={22} />
          </button>
          <div className="sb-bar__t">
            <span className="sb-bar__ar" lang="ar" dir="rtl">{story.ar}</span>
            <span className="sb-bar__title">{title}</span>
          </div>
          {voice ? (
            <button type="button" className={`sb-round sb-round--sm${speak ? ' is-on' : ''}`} aria-pressed={speak} aria-label={u.listen} title={u.listen}
              onClick={() => setSpeak(s => !s)}>
              <Icon name="volume" size={22} />
            </button>
          ) : <span className="sb-round--sm" aria-hidden="true" />}
        </header>

        <div className="sb-stage" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { ptr.current = null }}>
          <div className={`sb-book${opening ? ' is-opening' : ''}`}>
            <div className="sb-live sb-book__base" aria-live="polite">
              <PageView {...common} idx={base} onAgain={() => go(0)} onClose={onClose} />
            </div>
            {turn && (
              <div key={turn.n} className={`sb-leaf sb-leaf--${turn.dir}`} aria-hidden="true"
                onAnimationEnd={(e) => { if (e.target === e.currentTarget) setTurn(null) }}>
                <div className="sb-leaf__front">
                  <PageView {...common} idx={turn.dir === 'next' ? turn.from : turn.to} />
                </div>
                <div className="sb-leaf__back">
                  <PageView {...common} idx={turn.dir === 'next' ? turn.to : turn.from} part="scene" />
                </div>
                <span className="sb-leaf__shade" />
              </div>
            )}
            {opening && (
              <div className="sb-coverleaf" aria-hidden="true" onAnimationEnd={(e) => { if (e.target === e.currentTarget) setOpening(false) }}
                style={{ '--sb-a': art.pal.a, '--sb-b': art.pal.b }}>
                <span className="sb-cover sb-cover--big"><CoverFace story={story} lang={lang} art={art} id={book.id} /></span>
              </div>
            )}
          </div>
        </div>

        <nav className="sb-nav" aria-label={u.page}>
          <button type="button" className="sb-round sb-round--big" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label={u.prev} data-testid="sb-prev">
            <Icon name="chevron" size={30} strokeWidth={2.4} className="sb-flip sb-flip--back" />
          </button>
          <ol className="sb-dots">
            {Array.from({ length: book.total }, (_, i) => (
              <li key={i}>
                <button type="button" className={`sb-dot${i === idx ? ' is-on' : ''}${i === book.total - 1 ? ' sb-dot--end' : ''}`}
                  aria-label={`${u.page} ${i + 1}`} aria-current={i === idx ? 'page' : undefined} onClick={() => go(i)} />
              </li>
            ))}
          </ol>
          <button type="button" className="sb-round sb-round--big sb-round--next" onClick={() => go(idx + 1)} disabled={isEnd} aria-label={u.next} data-testid="sb-next">
            <Icon name="chevron" size={30} strokeWidth={2.4} className="sb-flip" />
          </button>
        </nav>
        <p className="sb-count ui-num" aria-hidden="true"><bdi>{idx + 1} / {book.total}</bdi></p>
      </div>
  )
}

export default function StoryBooks({ lang: langProp }) {
  const ctx = useLang()
  const lang = langProp || ctx?.lang || 'az'
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [progress, setProgress] = useState({})
  const [open, setOpen] = useState(null)       // bookId
  const lastBtn = useRef(null)

  useEffect(() => { setProgress(loadProgress()) }, [])

  const books = useMemo(() => STORIES.map(st => ({ id: bookId(st), st, art: BOOK_ART[bookId(st)] || BOOK_ART.adam })), [])
  const current = books.find(b => b.id === open)

  const onPage = useCallback((id, n) => {
    const saved = saveProgress(id, n)
    setProgress(saved || (p => ({ ...p, [id]: n })))
  }, [])
  const close = useCallback(() => {
    setOpen(null)
    requestAnimationFrame(() => { try { lastBtn.current?.focus({ preventScroll: true }) } catch { /* */ } })
  }, [])

  return (
    <section className="ui-card sb" data-testid="storybooks" dir={lang === 'ar' ? 'rtl' : undefined}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 className="sb__title">{u.title}</h2>
      <p className="sb__lead">{u.lead}</p>
      <ul className="sb-shelf">
        {books.map(b => {
          const p = progress[b.id] || 0
          return (
            <li key={b.id} className="sb-shelf__slot">
              <button type="button" className="sb-cover" data-book={b.id} aria-label={`${u.open}: ${txt(b.st.title, lang)}`}
                style={{ '--sb-a': b.art.pal.a, '--sb-b': b.art.pal.b, '--sb-c': b.art.pal.c }}
                onClick={(e) => { lastBtn.current = e.currentTarget; setOpen(b.id) }}>
                <CoverFace story={b.st} lang={lang} art={b.art} id={b.id} />
                {p > 0 && <span className="sb-cover__ribbon">{u.cont}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {current && typeof document !== 'undefined' && createPortal(
        <Reader key={current.id} story={current.st} lang={lang} u={u} reduced={reduced}
          start={progress[current.id] || 0} onClose={close} onPage={onPage} />,
        document.body,
      )}
    </section>
  )
}
