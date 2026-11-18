// ═══════════════════════════════════════════════════════
// /u/<ləqəb> — könüllü açıq profil (server/publicProfile.js → GET /api/u/:handle). Klientdə render olunur,
// prerender YOXDUR. Naməlum / bağlı / moderasiya ilə gizlədilmiş profil → 404 səhifəsi (noindex).
// Susmaya görə noindex (routes.js → DETAILS.u.noindex); istifadəçi "axtarış sistemlərinə icazə ver" seçibsə
// robots meta-sı "index" olur. İzləyici sayı, müqayisə, reytinq yoxdur. Şikayət — girişli.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useId, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { parsePath, pathFor } from '../seo/routes'
import { SURAH_SLUGS } from '../seo/surahSlugs'
import Icon from '../components/Icon'
import { useAuthUser, refreshMe } from '../api/userSession'
import { PUB } from '../components/account/communityText'
import { nf } from '../components/community/CommunityUi'
import { getPublicProfile, reportProfile, HANDLE_RE } from '../api/community'
import { stampName } from '../components/SpiritualPassport'
import '../styles/ReadTogether.css'
import '../styles/Account.css'
import '../styles/Community.css'

const NotFoundPage = lazy(() => import('./NotFoundPage'))
const REASONS = ['spam', 'offensive', 'impersonation', 'personal_info', 'other']
const surahTitle = (n) => (SURAH_SLUGS[n - 1] || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-')

function setRobots(content) {
  try {
    const m = document.querySelector('meta[name="robots"]')
    if (m) m.setAttribute('content', content)
  } catch { /* SSR */ }
}

export default function PublicProfilePage({ setPage }) {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(PUB, lang, 'en')
  const location = useLocation()
  const { param } = parsePath(location.pathname)
  const handle = typeof param === 'string' && HANDLE_RE.test(param) ? param : null
  const [state, setState] = useState({ status: handle ? 'loading' : 'missing', profile: null })
  const { status } = useAuthUser()
  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])

  useEffect(() => {
    if (!handle) { setState({ status: 'missing', profile: null }); return undefined }
    let off = false
    setState({ status: 'loading', profile: null })
    getPublicProfile(handle)
      .then((p) => { if (!off) setState({ status: 'ok', profile: p }) })
      .catch(() => { if (!off) setState({ status: 'missing', profile: null }) })
    return () => { off = true }
  }, [handle])

  // İstifadəçi icazə veribsə indeksləmə (Seo.jsx susmaya görə noindex yazır — sonra üstünə yazılır)
  useEffect(() => {
    if (state.status !== 'ok') return undefined
    const want = state.profile.allowIndex ? 'index, follow' : 'noindex, nofollow'
    setRobots(want)
    const id = setTimeout(() => setRobots(want), 600)
    return () => { clearTimeout(id); setRobots('noindex, nofollow') }
  }, [state])

  if (state.status === 'missing') return <Suspense fallback={null}><NotFoundPage setPage={setPage} /></Suspense>
  if (state.status === 'loading') {
    return <div className="ui-container ui-container--narrow"><div className="spinner-wrap" role="status" aria-live="polite"><div className="spinner" /><span className="ui-sr-only">{t.loading}</span></div></div>
  }
  const p = state.profile
  const d = p.data || {}
  const shown = (f) => p.fields.includes(f) && d[f] != null
  const title = shown('displayName') ? d.displayName : `@${p.handle}`
  return (
    <div className="acc-account">
      <section className="ui-page-hero">
        <div className="ui-container ui-container--narrow">
          <p className="ui-eyebrow">{t.eyebrow}</p>
        </div>
      </section>
      <div className="ui-container ui-container--narrow acc-sections">
        <article className="ui-card pub-card" aria-labelledby="pub-name" data-testid="public-profile">
          <header className="pub-head">
            <span className="pub-avatar" aria-hidden="true">{[...String(title).replace('@', '')][0]?.toUpperCase() || '·'}</span>
            <div>
              <h1 className="pub-name" id="pub-name"><bdi>{title}</bdi></h1>
              {shown('kunya') && <p className="pub-kunya"><bdi>{d.kunya}</bdi></p>}
              <p className="rt-note" dir="ltr">@{p.handle}</p>
            </div>
          </header>
          {shown('bio') && <p className="pub-bio" dir="auto" data-testid="public-bio">{d.bio}</p>}
          {(shown('khatms') || shown('ummahKhatms') || shown('favSurah')) && (
            <dl className="pub-stats">
              {shown('khatms') && <div><dt>{t.khatms}</dt><dd className="ui-num">{nf(d.khatms, lang)}</dd></div>}
              {shown('ummahKhatms') && <div><dt>{t.ummah}</dt><dd className="ui-num">{nf(d.ummahKhatms, lang)}</dd></div>}
              {shown('favSurah') && (
                <div><dt>{t.fav}</dt><dd><a href={pathFor('quran', siteLang, d.favSurah)}>{t.surah(d.favSurah)} · <bdi dir="ltr">{surahTitle(d.favSurah)}</bdi></a></dd></div>
              )}
            </dl>
          )}
          {shown('stamps') && d.stamps.length > 0 && (
            <section aria-labelledby="pub-stamps">
              <h2 className="rt-card__title" id="pub-stamps"><Icon name="star" size={18} /> {t.stamps}</h2>
              <ul className="pub-stamps">{d.stamps.map((s) => <li key={s} className="ui-badge ui-badge--brand">{stampName(s, lang)}</li>)}</ul>
            </section>
          )}
          <p className="rt-note">{t.note}</p>
          <ReportBox t={t} handle={p.handle} signedIn={status === 'user'} loginHref={`${pathFor('login', siteLang)}?next=${encodeURIComponent(location.pathname)}`} />
        </article>
      </div>
    </div>
  )
}

function ReportBox({ t, handle, signedIn, loginHref }) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('spam')
  const [done, setDone] = useState(false)
  if (done) return <p className="rt-note" role="status">{t.reported}</p>
  if (!signedIn) return <div><a className="ui-btn ui-btn--ghost ui-btn--sm" href={loginHref}><Icon name="alert" size={14} /> {t.login}</a></div>
  if (!open) return <div><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setOpen(true)} data-testid="pub-report"><Icon name="alert" size={14} /> {t.report}</button></div>
  return (
    <div className="rt-row">
      <label className="ui-sr-only" htmlFor={`${uid}-r`}>{t.report}</label>
      <select id={`${uid}-r`} className="ui-select" value={reason} onChange={(e) => setReason(e.target.value)}>
        {REASONS.map((r) => <option key={r} value={r}>{t.reasons[r]}</option>)}
      </select>
      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => reportProfile(handle, reason).then(() => setDone(true)).catch(() => setOpen(false))}>{t.send}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setOpen(false)}>{t.cancel}</button>
    </div>
  )
}
