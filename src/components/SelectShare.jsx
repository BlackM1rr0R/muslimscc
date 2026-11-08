// ═══════════════════════════════════════════════════════
// SelectShare (v5.8) — mətni seçəndə üzən menyu: Kopyala · Şəkil kartı · Paylaş
//
// • Bütün sayt (App.jsx, boş vaxtda). Yalnız əsas məzmunda (#qm-main), 12–1200 simvol;
//   giriş sahələri, düymələr və redaktə olunan sahələr istisnadır.
// • "Şəkil kartı" → /quotes?text=…&src=… (ərəbcə seçimdə ?ar=…) — sitat generatoru.
//   İstinad: seçimin ən yaxın [data-cite] atributu, yoxdursa səhifənin başlığı (h1).
// • "Paylaş" — Web Share (mətn + istinad + səhifənin ünvanı), yoxsa kopyalayır.
// • Mövqe: seçimin altında (telefonda sistemin öz menyusu yuxarıda olur), ekrandan çıxmır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import { buildQuery } from './quote/content'
import { pickUi } from '../utils/uiText'
import Icon from './Icon'
import '../styles/SelectShare.css'

const T = {
  az: { copy: 'Kopyala', copied: 'Kopyalandı', card: 'Şəkil kartı', share: 'Paylaş' },
  en: { copy: 'Copy', copied: 'Copied', card: 'Image card', share: 'Share' },
  ru: { copy: 'Копировать', copied: 'Скопировано', card: 'Карточка', share: 'Поделиться' },
  ar: { copy: 'نسخ', copied: 'تم النسخ', card: 'بطاقة صورة', share: 'مشاركة' },
  tr: { copy: 'Kopyala', copied: 'Kopyalandı', card: 'Görsel kart', share: 'Paylaş' },
}
const MIN = 12, MAX = 1200
const AR_RE = /[؀-ۿ]/g

/** Seçim haqqında: { text, rect, src } | null (saf DOM oxusu) */
export function readSelection() {
  const sel = typeof window !== 'undefined' ? window.getSelection?.() : null
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null
  const text = sel.toString().replace(/\s+\n/g, '\n').trim()
  if (text.length < MIN || text.length > MAX) return null
  const node = sel.anchorNode?.nodeType === 1 ? sel.anchorNode : sel.anchorNode?.parentElement
  if (!node || !node.closest('#qm-main') || node.closest('input, textarea, [contenteditable="true"], button, .no-select-share')) return null
  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (!rect || (!rect.width && !rect.height)) return null
  const cite = node.closest('[data-cite]')?.getAttribute('data-cite')
  const h1 = document.querySelector('#qm-main h1')?.textContent?.trim()
  return { text, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width }, src: (cite || h1 || document.title).slice(0, 120) }
}

export default function SelectShare() {
  const { lang } = useLang()
  const t = pickUi(T, lang)
  const navigate = useNavigate()
  const [st, setSt] = useState(null)
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  const boxRef = useRef(null)

  useEffect(() => {
    const update = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => { setSt(readSelection()); setCopied(false) }, 220)
    }
    const hide = () => setSt(null)
    document.addEventListener('selectionchange', update)
    window.addEventListener('scroll', hide, { passive: true })
    window.addEventListener('resize', hide)
    return () => {
      clearTimeout(timer.current)
      document.removeEventListener('selectionchange', update)
      window.removeEventListener('scroll', hide)
      window.removeEventListener('resize', hide)
    }
  }, [])

  if (!st || typeof document === 'undefined') return null
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const W = 280, vw = window.innerWidth, vh = window.innerHeight
  const left = Math.max(8, Math.min(vw - W - 8, st.rect.left + st.rect.width / 2 - W / 2))
  const below = coarse || st.rect.top < 70
  const top = below ? Math.min(vh - 60, st.rect.bottom + (coarse ? 44 : 10)) : Math.max(8, st.rect.top - 52)
  const isAr = (st.text.match(AR_RE) || []).length > st.text.length * 0.4

  const copy = async () => {
    try { await navigator.clipboard.writeText(`${st.text}\n— ${st.src}`); setCopied(true) } catch { /* */ }
  }
  const card = () => {
    const q = buildQuery(isAr ? { ar: st.text, src: st.src } : { text: st.text, src: st.src })
    window.getSelection()?.removeAllRanges()
    setSt(null)
    navigate(`${pathFor('quotes', lang)}${q}`)
  }
  const share = async () => {
    const body = `${st.text}\n— ${st.src}`
    if (navigator.share) {
      try { await navigator.share({ text: body, url: window.location.href }); return } catch (e) { if (e?.name === 'AbortError') return }
    }
    copy()
  }

  return createPortal(
    <div className="ssh" ref={boxRef} style={{ top, left, width: W }} role="toolbar" aria-label={t.share} data-testid="select-share"
      onMouseDown={(e) => e.preventDefault()}>
      <button type="button" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? t.copied : t.copy}</button>
      <button type="button" onClick={card} data-testid="ssh-card"><Icon name="image" size={15} /> {t.card}</button>
      <button type="button" onClick={share}><Icon name="share" size={15} /> {t.share}</button>
    </div>,
    document.body,
  )
}
