// ═══════════════════════════════════════════════════════
// "Bu səhifə necə işləyir?" köməkçisi — hər səhifədə (başlıqdakı ⓘ düyməsi
// və ya klaviaturada "?" açır). Heç bir səhifəyə ayrıca mətn yazmadan
// avtomatik qurulur:
//   • başlıq + bir cümlə: bölmənin adı (navigation.js) və SEO təsviri
//     (seo/meta.js descFor — 49 dildə var)
//   • "Necə işləyir": səhifə hero-sundakı `.ui-page-hero__how` mətni (varsa)
//   • "Bu səhifədə": əsas sütundakı h2 başlıqları — klikləyəndə ora sürüşür
//   • "Əlaqəli bölmələr": eyni menyu qrupunun digər səhifələri
// Panel tənbəl chunk-dır (Header.jsx yalnız açılanda yükləyir).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { NAV_GROUPS, navLabel, navGroupOf, navGroupLabel } from '../data/navigation'
import { descFor } from '../seo/meta'
import { pathFor } from '../seo/routes'
import Icon, { hasIcon } from './Icon'
import { useBackToClose } from '../utils/useBackToClose'
import { pickUi } from '../utils/uiText'

// Mətnlər saytda artıq var (44 lüğətdə tərcüməsi hazırdır)
const L = {
  az: { how: 'Necə işləyir', onPage: 'Bu səhifədə', related: 'Əlaqəli bölmələr', close: 'Bağla' },
  en: { how: 'How it works', onPage: 'On this page', related: 'Related sections', close: 'Close' },
  ru: { how: 'Как это работает', onPage: 'На этой странице', related: 'Связанные разделы', close: 'Закрыть' },
  ar: { how: 'طريقة العمل', onPage: 'في هذه الصفحة', related: 'أقسام ذات صلة', close: 'إغلاق' },
  tr: { how: 'Nasıl işler', onPage: 'Bu sayfada', related: 'İlgili bölümler', close: 'Kapat' },
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function plainClick(e) {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

/** Səhifənin əsas sütunundan h2 başlıqları və "necə işlədilir" mətni */
function readPage() {
  const main = document.querySelector('#main-content') || document.querySelector('main') || document.body
  const heads = [...main.querySelectorAll('h2')]
    .filter(h => !h.closest('footer, dialog, [role="dialog"], [aria-hidden="true"], .footer') && h.offsetParent !== null)
    .map(h => ({ el: h, text: h.textContent.replace(/\s+/g, ' ').trim() }))
    .filter(h => h.text && h.text.length < 90)
  // Təkrar başlıqlar (məs. kart başlıqları) — bir dəfə
  const seen = new Set()
  const uniq = heads.filter(h => (seen.has(h.text) ? false : seen.add(h.text))).slice(0, 10)
  // "Necə işlədilir: …" prefiksi bölmə başlığını təkrarlayır — atılır
  const how = (main.querySelector('.ui-page-hero__how')?.textContent || '')
    .replace(/\s+/g, ' ').trim().replace(/^[^:：]{2,28}[:：]\s*/, '')
  return { heads: uniq, how }
}

export default function PageHelp({ page, onClose, onNavigate }) {
  const { lang } = useLang()
  const l = pickUi(L, lang)
  const panelRef = useRef(null)
  const returnRef = useRef(null)
  useBackToClose(true, onClose)

  const info = useMemo(() => readPage(), [])
  const group = navGroupOf(page)
  const related = useMemo(() => {
    const g = NAV_GROUPS.find(x => x.key === group)
    return g ? g.items.map(i => i.key).filter(k => k !== page).slice(0, 8) : []
  }, [group, page])

  const title = navLabel(page, lang)
  const desc = descFor(page, lang)

  // Fokus, sürüşmə kilidi, Esc, Tab tələsi
  useEffect(() => {
    returnRef.current = document.activeElement
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }))
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)]
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      root.style.overflow = prev
      const el = returnRef.current
      if (el && document.contains(el)) el.focus?.({ preventScroll: true })
    }
  }, [onClose])

  const jump = (el) => {
    onClose()
    // Pəncərə bağlanandan sonra (sürüşmə kilidi açılır)
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.setAttribute('tabindex', '-1')
      el.focus({ preventScroll: true })
    })
  }

  return createPortal(
    <div className="ui-dialog-backdrop vx-help-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={panelRef} className="ui-dialog ui-dialog--sheet vx-help" role="dialog" aria-modal="true" aria-labelledby="vx-help-ttl" tabIndex={-1}>
        <div className="ui-dialog__head">
          <span className="ui-icon-tile vx-help__ic" aria-hidden="true"><Icon name={hasIcon(page) ? page : 'info'} /></span>
          <div className="vx-help__titles">
            {group && <span className="ui-eyebrow">{navGroupLabel(group, lang)}</span>}
            <h2 id="vx-help-ttl" className="ui-dialog__title">{title}</h2>
          </div>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label={l.close} title={l.close}><Icon name="close" /></button>
        </div>
        <div className="ui-dialog__body vx-help__body">
          {desc && <p className="vx-help__lead">{desc}</p>}

          {info.how && (
            <section className="vx-help__sec">
              <h3 className="vx-help__h"><Icon name="info" size={16} /> {l.how}</h3>
              <p className="vx-help__how">{info.how}</p>
            </section>
          )}

          {info.heads.length > 1 && (
            <section className="vx-help__sec">
              <h3 className="vx-help__h"><Icon name="learn" size={16} /> {l.onPage}</h3>
              <ol className="vx-help__toc">
                {info.heads.map((h, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => jump(h.el)}>
                      <span className="vx-help__n" aria-hidden="true">{i + 1}</span>
                      <span>{h.text}</span>
                      <Icon name="chevron" size={16} className="ui-flip-rtl vx-help__chev" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {related.length > 0 && (
            <section className="vx-help__sec">
              <h3 className="vx-help__h"><Icon name="arrow" size={16} className="ui-flip-rtl" /> {l.related}</h3>
              <ul className="vx-help__rel">
                {related.map(k => (
                  <li key={k}>
                    <a href={pathFor(k, lang)} onClick={(e) => { if (plainClick(e)) { e.preventDefault(); onClose(); onNavigate(k) } }}>
                      <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={hasIcon(k) ? k : 'chevron'} /></span>
                      <span>{navLabel(k, lang)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
