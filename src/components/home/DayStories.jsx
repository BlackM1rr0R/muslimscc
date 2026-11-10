// ═══════════════════════════════════════════════════════
// DayStories (v5.9) — ana səhifə: günün ayəsi, hədisi, duası və zikri "story" kimi
//
//   <DayStories lang="az" />
//
// • Məzmun — günün zolağının özü (DailyReminderBar → buildDailyItems: QUOTES, DUAS_DATA,
//   DHIKRS — mənbələri ilə). Yeni dini mətn YOXDUR; mənbə adı dilə görə (localizeSource).
// • Dairələr: baxılmayan — qızılı halqa, baxılan — boz (bu gün üçün, localStorage).
// • Baxış: tam ekran, yuxarıda irəliləmə xətləri, 8 s sonra növbəti; sol/sağ yarıya toxun —
//   əvvəlki/növbəti, basıb saxla — pauza, aşağı sürüşdür / Esc — bağla, ←/→ klaviatura.
// • Hərəkət azaldılıbsa — avtomatik keçid yoxdur (yalnız toxunuşla).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { buildDailyItems, dayNumber } from '../DailyReminderBar'
import { localizeSource } from '../../utils/sourceNames'
import '../../styles/DayStories.css'

const T = {
  az: { aria: 'Günün hekayələri', ayah: 'Ayə', hadith: 'Hədis', dua: 'Dua', dhikr: 'Zikr', close: 'Bağla', open: 'Bölməni aç', share: 'Paylaş', copied: 'Kopyalandı', of: '{a} / {b}', today: 'Bu gün' },
  en: { aria: 'Stories of the day', ayah: 'Ayah', hadith: 'Hadith', dua: 'Dua', dhikr: 'Dhikr', close: 'Close', open: 'Open the section', share: 'Share', copied: 'Copied', of: '{a} / {b}', today: 'Today' },
  ru: { aria: 'Истории дня', ayah: 'Аят', hadith: 'Хадис', dua: 'Дуа', dhikr: 'Зикр', close: 'Закрыть', open: 'Открыть раздел', share: 'Поделиться', copied: 'Скопировано', of: '{a} / {b}', today: 'Сегодня' },
  ar: { aria: 'قصص اليوم', ayah: 'آية', hadith: 'حديث', dua: 'دعاء', dhikr: 'ذكر', close: 'إغلاق', open: 'افتح القسم', share: 'مشاركة', copied: 'تم النسخ', of: '{a} / {b}', today: 'اليوم' },
  tr: { aria: 'Günün hikâyeleri', ayah: 'Âyet', hadith: 'Hadis', dua: 'Dua', dhikr: 'Zikir', close: 'Kapat', open: 'Bölümü aç', share: 'Paylaş', copied: 'Kopyalandı', of: '{a} / {b}', today: 'Bugün' },
}
const ICON = { ayah: 'quran', hadith: 'hadith', dua: 'duas', dhikr: 'dhikr' }
const DUR = 8000
const seenKey = (day) => `stories_seen:${day}`
const readSeen = (day) => { try { return new Set(JSON.parse(localStorage.getItem(seenKey(day)) || '[]')) } catch { return new Set() } }
const reducedNow = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user') } catch { return false }
}

function Viewer({ items, start, lang, t, onClose, onSeen }) {
  const [i, setI] = useState(start)
  const [paused, setPaused] = useState(false)
  const [copied, setCopied] = useState(false)
  const auto = useMemo(() => !reducedNow(), [])
  const barRef = useRef(null)
  const closeRef = useRef(null)
  const touch = useRef(null)
  const navigate = useNavigate()
  const it = items[i]

  const next = useCallback(() => setI(x => { if (x >= items.length - 1) { onClose(); return x } return x + 1 }), [items.length, onClose])
  const prev = useCallback(() => setI(x => Math.max(0, x - 1)), [])
  useEffect(() => { onSeen(items[i].type); setCopied(false) }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  // İrəliləmə: CSS animasiyası (transform: scaleX) — bitəndə növbəti
  useEffect(() => {
    const el = barRef.current
    if (!el || !auto) return undefined
    const onEnd = () => next()
    el.addEventListener('animationend', onEnd)
    return () => el.removeEventListener('animationend', onEnd)
  }, [i, auto, next])

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') (lang === 'ar' ? prev : next)()
      else if (e.key === 'ArrowLeft') (lang === 'ar' ? next : prev)()
    }
    window.addEventListener('keydown', onKey)
    const ov = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ov }
  }, [lang, next, prev, onClose])

  const onTap = (e) => {
    if (e.target.closest('a, button')) return
    const r = e.currentTarget.getBoundingClientRect()
    const left = (e.clientX - r.left) < r.width * 0.35
    const back = lang === 'ar' ? !left : left
    back ? prev() : next()
  }
  const src = it.source ? localizeSource(it.source, lang) : ''
  const share = async () => {
    const url = `${window.location.origin}${pathFor(it.page, lang)}`
    const text = `${it.ar}${it.text ? `\n\n${it.text}` : ''}${src ? `\n— ${src}` : ''}`
    try { if (navigator.share) { await navigator.share({ text, url }); return } } catch (e) { if (e?.name === 'AbortError') return }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); setCopied(true) } catch { /* */ }
  }

  return createPortal(
    <div className={`dst dst--${it.type}${paused ? ' is-paused' : ''}`} role="dialog" aria-modal="true" aria-label={t.aria} data-testid="story-viewer"
      onPointerDown={(e) => { touch.current = { y: e.clientY, t: Date.now() }; setPaused(true) }}
      onPointerUp={(e) => {
        setPaused(false)
        const s = touch.current; touch.current = null
        if (s && e.clientY - s.y > 90) { onClose(); return }
        if (s && Date.now() - s.t < 300) onTap(e)
      }}
      onPointerCancel={() => setPaused(false)}>
      <div className="dst__bg" aria-hidden="true"><i /><i /></div>
      <div className="dst__bars" aria-hidden="true">
        {items.map((x, k) => (
          <span key={x.type} className="dst__bar">
            <b ref={k === i ? barRef : undefined} key={`${k}-${i}`} className={k < i ? 'is-done' : k === i ? (auto ? 'is-run' : 'is-done') : ''} style={{ animationDuration: `${DUR}ms` }} />
          </span>
        ))}
      </div>
      <header className="dst__top">
        <span className="dst__kind"><Icon name={ICON[it.type]} size={18} /> {t[it.type]} · {t.today}</span>
        <span className="dst__count ui-num">{t.of.replace('{a}', i + 1).replace('{b}', items.length)}</span>
        <button type="button" ref={closeRef} className="dst__x" onClick={onClose} aria-label={t.close}><Icon name="close" size={20} /></button>
      </header>
      <div className="dst__body" key={i} aria-live="polite">
        {it.ar && <p className="dst__ar" lang="ar" dir="rtl">{it.ar}</p>}
        {it.name && <p className="dst__name">{it.name}</p>}
        {it.text && <p className="dst__tr">{it.text}</p>}
        {src && <p className="dst__src">{src}</p>}
      </div>
      <footer className="dst__foot">
        <a className="ui-btn ui-btn--inverse ui-btn--sm" href={pathFor(it.page, lang)}
          onClick={(e) => { if (e.button || e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); onClose(); navigate(pathFor(it.page, lang)); window.scrollTo(0, 0) }}>{t.open} <Icon name="arrow" size={16} className="ui-flip-rtl" /></a>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dst__share" onClick={share}><Icon name={copied ? 'check' : 'share'} className="ui-btn__icon" />{copied ? t.copied : t.share}</button>
      </footer>
    </div>,
    document.body,
  )
}

export default function DayStories({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const day = useMemo(() => dayNumber(), [])
  const items = useMemo(() => buildDailyItems(lang, day, null).filter(x => ICON[x.type]).slice(0, 4), [lang, day])
  const [seen, setSeen] = useState(() => new Set())
  const [open, setOpen] = useState(-1)
  useEffect(() => { setSeen(readSeen(day)) }, [day])
  const markSeen = useCallback((type) => {
    setSeen(s => {
      if (s.has(type)) return s
      const n = new Set(s); n.add(type)
      try { localStorage.setItem(seenKey(day), JSON.stringify([...n])) } catch { /* */ }
      return n
    })
  }, [day])
  const close = useCallback(() => setOpen(-1), [])
  if (!items.length) return null
  return (
    <nav className="dsr" aria-label={t.aria} data-testid="day-stories">
      <ul className="dsr__list">
        {items.map((x, k) => (
          <li key={x.type}>
            <button type="button" className={`dsr__bubble dsr__bubble--${x.type}${seen.has(x.type) ? ' is-seen' : ''}`} onClick={() => setOpen(k)}>
              <span className="dsr__ring" aria-hidden="true"><span className="dsr__in"><Icon name={ICON[x.type]} size={24} /></span></span>
              <span className="dsr__label">{t[x.type]}</span>
            </button>
          </li>
        ))}
      </ul>
      {open >= 0 && <Viewer items={items} start={open} lang={lang} t={t} onClose={close} onSeen={markSeen} />}
    </nav>
  )
}
