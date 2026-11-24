// ═══════════════════════════════════════════════════════
// Hisnul-Müslim — bir zikrin səhifəsi: /ar/hisnul-muslim/<fəsil>-<bənd> (2026-11-24)
//
// YALNIZ ərəbcə (sahibin qərarı): ərəb mətni, təkrar sayı və təxric public/data/hisn/ar.json-dan
// OLDUĞU KİMİ — tərcümə yoxdur (az/en/ru/tr tərcümələri AI köməyi ilədir, ayrıca indekslənən səhifə olmur).
// Yalnız hisnmuslim.com ilə tutuşdurulmuş bəndlər (src/seo/hisnIds.js ← scripts/build-hisn-verified.mjs);
// başqa dildə bu ünvan siyahıya keçir (routes.js → parsePath fallback).
// Statik SEO bloku (scripts/seo-body.mjs → hisnDuaBody) eyni məzmunu daşıyır; React onu bununla əvəz edir.
// HisnPage bu komponenti tənbəl yükləyir (yalnız detal ünvanında).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import DuaListen from '../DuaListen'
import { isPlainClick } from '../PageLink'
import { pathFor } from '../../seo/routes'
import { HISN_DUA_IDS } from '../../seo/hisnIds'
import { HISN_AR as T, HISN_BOOK, hisnItem, hisnCrumb } from '../../seo/hisnDua'
import { brandName } from '../../config/brand'
import '../../styles/Breadcrumb.css'

/**
 * @param {{ slug: string, load: () => Promise<{ chapters: any[] }>, setPage?: (key: string) => void }} props
 *   load — ərəbcə faylın yükləyicisi (HisnPage-in keşi: /data/hisn/ar.json)
 */
export default function HisnDua({ slug, load, setPage }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  const h1Ref = useRef(null)

  useEffect(() => {
    let live = true
    setStatus(s => (s === 'ok' ? s : 'loading'))
    load()
      .then(d => { if (live) { setData(d); setStatus('ok') } })
      .catch(() => { if (live) setStatus('error') })
    return () => { live = false }
  }, [load, attempt])
  useEffect(() => () => clearTimeout(timer.current), [])

  const x = useMemo(() => (data ? hisnItem(data.chapters, slug) : null), [data, slug])
  const i = HISN_DUA_IDS.indexOf(slug)
  const near = (j) => {
    if (j < 0 || j >= HISN_DUA_IDS.length || !data) return null
    const y = hisnItem(data.chapters, HISN_DUA_IDS[j])
    return y ? { slug: HISN_DUA_IDS[j], name: hisnCrumb(y.ar) } : null
  }
  const prev = near(i - 1)
  const next = near(i + 1)

  // Əvvəlki/növbəti zikrə keçəndə fokus başlığa (klaviatura və ekran oxuyucusu üçün)
  const moved = useRef(false)
  useEffect(() => {
    if (moved.current && x) h1Ref.current?.focus({ preventScroll: true })
  }, [slug, x])

  const listPath = pathFor('hisn', 'ar')
  const chapterPath = x ? `${listPath}#hs-${x.chapter}` : listPath
  const go = (to, opts = {}) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    if (opts.detail) moved.current = true
    if (opts.page && setPage) setPage(opts.page)
    else navigate(to)
  }

  const copy = async () => {
    if (!x) return
    try {
      await navigator.clipboard.writeText([x.ar, x.src ? `— ${x.src}` : '', `${window.location.origin}${pathFor('hisn', 'ar', slug)}`].filter(Boolean).join('\n\n'))
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1800)
    } catch { /* icazə yoxdur */ }
  }

  const title = x ? (x.count > 1 ? `${x.chapterTitle} (${x.n})` : x.chapterTitle) : HISN_BOOK.short

  return (
    <div className="hs-page hs-dua" lang="ar" dir="rtl">
      <header className="ui-page-hero hs-hero hs-dua__hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <nav className="breadcrumb bc" aria-label={T.crumbs}>
            <ol className="bc-list">
              <li className="bc-item">
                <a className="bc-home" href={pathFor('home', 'ar')} onClick={go(pathFor('home', 'ar'), { page: 'home' })}>{brandName('ar')}</a>
              </li>
              <li className="bc-item">
                <span className="bc-sep" aria-hidden="true"><Icon name="chevron" size={14} strokeWidth={2} className="ui-flip-rtl" /></span>
                <a className="bc-home" href={listPath} onClick={go(listPath, { page: 'hisn' })}>{HISN_BOOK.short}</a>
              </li>
              {x && (
                <li className="bc-item">
                  <span className="bc-sep" aria-hidden="true"><Icon name="chevron" size={14} strokeWidth={2} className="ui-flip-rtl" /></span>
                  <a className="bc-home" href={chapterPath} onClick={go(chapterPath)}>{x.chapterTitle}</a>
                </li>
              )}
            </ol>
          </nav>
          <span className="ui-eyebrow">{T.chapter}{x ? ` ${x.chapter}` : ''}</span>
          <h1 className="ui-display hs-dua__title" ref={h1Ref} tabIndex={-1}>{title}</h1>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container hs-layout hs-dua__body">
          {status === 'loading' && !x && (
            <div className="hs-loading" role="status">
              <span className="ui-skeleton ui-skeleton--card" />
              <span className="ui-sr-only">{T.loading}</span>
            </div>
          )}
          {status === 'error' && !x && (
            <div className="ui-card ui-card--sunken hs-empty" role="alert">
              <p>{T.error}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAttempt(a => a + 1)}>
                <Icon name="refresh" className="ui-btn__icon" /> {T.retry}
              </button>
            </div>
          )}

          {x && (
            <article className="ui-card hs-item hs-dua__card" aria-labelledby="hs-dua-ar">
              <div className="hs-item__head">
                <span className="hs-item__n ui-num" aria-hidden="true" dir="ltr">{x.chapter}-{x.n}</span>
                <span className="hs-item__tools">
                  <button type="button" className="ui-icon-btn hs-item__copy" onClick={copy} aria-label={copied ? T.copied : T.copy} title={copied ? T.copied : T.copy}>
                    <Icon name={copied ? 'check' : 'copy'} size={16} />
                  </button>
                </span>
              </div>
              <p id="hs-dua-ar" className="hs-item__ar ui-arabic hs-dua__ar" lang="ar" dir="rtl">{x.ar}</p>
              <dl className="hs-dua__facts">
                {x.repeat > 1 && (
                  <div><dt>{T.repeat}</dt><dd className="ui-num">{T.times(x.repeat)}</dd></div>
                )}
                {x.src && (
                  <div><dt>{T.src}</dt><dd><cite>{x.src}</cite></dd></div>
                )}
              </dl>
              <div className="hs-item__foot">
                <DuaListen akey={`${x.chapter}:${x.index}`} lang="ar" />
              </div>
              <span className="ui-sr-only" aria-live="polite">{copied ? T.copied : ''}</span>
            </article>
          )}

          {x && (
            <p className="hs-dua__book">
              <Icon name="books" size={15} /> {T.book(HISN_BOOK)}{' '}
              <a href={chapterPath} onClick={go(chapterPath)}>{T.chapter}: {x.chapterTitle}</a>
            </p>
          )}

          {(prev || next) && (
            <nav className="hs-dua__pager" aria-label={T.pager}>
              {prev ? (
                <a className="ui-card hs-dua__near" rel="prev" href={pathFor('hisn', 'ar', prev.slug)} onClick={go(pathFor('hisn', 'ar', prev.slug), { detail: true })}>
                  <small><Icon name="chevron" size={14} /> {T.prev}</small>
                  <span>{prev.name}</span>
                </a>
              ) : <span />}
              {next ? (
                <a className="ui-card hs-dua__near hs-dua__near--next" rel="next" href={pathFor('hisn', 'ar', next.slug)} onClick={go(pathFor('hisn', 'ar', next.slug), { detail: true })}>
                  <small>{T.next} <Icon name="chevronLeft" size={14} /></small>
                  <span>{next.name}</span>
                </a>
              ) : <span />}
            </nav>
          )}

          <p className="hs-dua__all">
            <a className="ui-btn ui-btn--secondary ui-btn--sm" href={listPath} onClick={go(listPath, { page: 'hisn' })}>
              <Icon name="hisn" className="ui-btn__icon" /> {T.all}
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
