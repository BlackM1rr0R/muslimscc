// ═══════════════════════════════════════════════════════
// Ramazana hazırlıq səhifələrinin ortaq hissələri: keçid çipləri, bələdçidən sitat, iki səhifə arasında keçid
//
// GuideQuote — saytın Ramazan bələdçisindən (src/data/ramadanGuide.js) bölmənin blokunu OLDUĞU KİMİ
// göstərir (LessonBlocks: ərəbcə mətn, tərcümə, mənbə). Burada heç bir dini mətn yazılmır.
// ═══════════════════════════════════════════════════════
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { isPlainClick } from '../PageLink'
import LessonBlocks from '../lesson/LessonBlocks'
import { pathFor } from '../../seo/routes'
import { navLabel } from '../../data/navigation'
import { pickUi } from '../../utils/uiText'
import { RAMADAN_GUIDE } from '../../data/ramadanGuide'

export const hrefOf = (l, lang) => `${pathFor(l.to, lang, l.param)}${l.hash ? `#${l.hash}` : ''}`

/** Bələdçinin bölməsi (id) */
export const guideSection = (id) => RAMADAN_GUIDE.find((s) => s.id === id) || null

/** Bölmənin "t" növlü ilk bloku */
export function guideBlock(sec, t) {
  const s = guideSection(sec)
  return s?.blocks.find((b) => b.t === t) || null
}

/** SPA keçidi (hash varsa səhifənin başına sürüşdürülmür — hədəf bölməyə özü gedir) */
export function useSpaGo() {
  const navigate = useNavigate()
  return (e, href) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    if (!href.includes('#')) window.scrollTo(0, 0)
  }
}

export function PrepLinks({ links, lang, className = '' }) {
  const go = useSpaGo()
  if (!links?.length) return null
  return (
    <ul className={`rpp-links ${className}`}>
      {links.map((l) => {
        const href = hrefOf(l, lang)
        // #rp-g-<bölmə> — etiket bələdçinin bölmə başlığıdır
        const sec = !l.label && l.hash?.startsWith('rp-g-') ? guideSection(l.hash.slice(5)) : null
        const label = l.label || sec?.title
        return (
          <li key={href}>
            <a className="ui-chip rpp-link" href={href} onClick={(e) => go(e, href)}>
              <Icon name={l.to === 'learn' && l.param ? 'learn' : l.to} size={16} />
              <span>{label ? pickUi(label, lang, 'en') : navLabel(l.to, lang)}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/** Bələdçidən sitat: { sec, t, item? } */
export function GuideQuote({ spec, lang, label }) {
  if (!spec) return null
  const s = guideSection(spec.sec)
  const b = guideBlock(spec.sec, spec.t)
  if (!s || !b) return null
  let body
  if (spec.t === 'steps') {
    const it = b.items?.[spec.item]
    if (!it) return null
    body = (
      <blockquote className="rpp-quote__step">
        <b>{pickUi(it.title, lang, 'en')}</b>
        <span>{pickUi(it.text, lang, 'en')}</span>
      </blockquote>
    )
  } else {
    body = <LessonBlocks blocks={[b]} lang={lang} />
  }
  return (
    <figure className="rpp-quote ls-page" data-testid={`rpp-quote-${spec.sec}-${spec.t}`}>
      {body}
      <figcaption className="rpp-quote__from">
        <Icon name="learn" size={14} /> {label}: {pickUi(s.title, lang, 'en')}
      </figcaption>
    </figure>
  )
}

/** /road-to-ramadan ↔ /last-ten-nights — iki səhifə, bir seqment (aria-current) */
export function PrepSwitch({ view, lang, t }) {
  const go = useSpaGo()
  const items = [
    { id: 'road', key: 'ramadanprep', icon: 'ramadanprep', label: t.road },
    { id: 'nights', key: 'lastten', icon: 'lastten', label: t.nights },
  ]
  return (
    <nav className="rpp-switch" aria-label={t.switchLabel}>
      {items.map((it) => {
        const href = pathFor(it.key, lang)
        const on = it.id === view
        return (
          <a key={it.id} href={href} aria-current={on ? 'page' : undefined} className={`rpp-switch__a${on ? ' is-on' : ''}`}
            onClick={(e) => { if (on) { e.preventDefault(); return } go(e, href) }} data-testid={`rpp-switch-${it.id}`}>
            <Icon name={it.icon} size={18} /> {it.label}
          </a>
        )
      })}
    </nav>
  )
}
