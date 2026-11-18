// ═══════════════════════════════════════════════════════
// /khatm — "Ümmətin Canlı Xətmi" (server/globalKhatm.js, components/khatm/*)
//
// • Hamı (qonaq da) izləyir: canlı halqa (qlobus + 604 bölmə), oxunan səhifə sayı, indi oxuyanlar,
//   "Ümmətin xətm kitabı" (arxiv) və Ramazan sayı. Canlı axın — ictimai SSE (GET /api/khatm/live).
// • Daxil olmuş istifadəçi: "Bir səhifə götür" (istəyə bağlı ithaf + şəhərin 1°-lik xanası) → səhifə
//   Mushaf vərəqində açılır; səhifə ekranda ≥ 10 s qalanda ayələri ömürlük mozaikaya yazılır
//   (utils/quranLife) və serverin minimum vaxtı keçəndə "Oxudum" açılır (şərəf sistemi).
// • Dövr tamamlananda səhifədəki hər kəs təbrik pəncərəsini görür; iştirakçının yaddaşında
//   (utils/worldKhatm) dövr "tamamlandı" qeyd olunur → "Ümmət xətmində iştirak" möhürü.
// • Reytinq / şəxsi ictimai statistika yoxdur — yalnız ümumi rəqəmlər.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import HeroOrnament from '../components/HeroOrnament'
import { ProgressBar, StatTile } from '../components/viz'
import { useAuthUser, refreshMe, safeStorage } from '../api/userSession'
import {
  KHATM_TOTAL, LIVE_URL, MAX_DEDICATION, khatmState, khatmRounds, khatmMe, khatmClaim, khatmComplete, khatmRelease,
  deleteDedication, decodeBits, withPage, countPages,
} from '../api/khatm'
import { KT, khatmError, fmtDuration } from '../components/khatm/khatmText'
import { apiErrCode } from '../components/account/verifyEmailText'
import VerifyEmailNote from '../components/account/VerifyEmailNote'
import { RT } from '../components/readroom/readRoomText'
import { MushafSheet, useMushafPage } from '../components/quran/MushafSheet'
import { surahsOnPage, surahInfo, wbwLang } from '../utils/mushaf'
import { getSurahLocal } from '../data/surahNamesAz'
import { recordAyahs, pageAyahs } from '../utils/quranLife'
import { addPage, markDone, readKhatm, syncRounds, dayOf } from '../utils/worldKhatm'
import { getPrayerLocation } from '../utils/prayerLocation'
import { useReduced } from '../motion/reduced'
import '../styles/MushafPage.css'
import '../styles/Khatm.css'

const KhatmGlobe = lazy(() => import('../components/khatm/KhatmGlobe'))

const CELL_PREF = 'world_khatm_cell'
const DWELL_MS = 10_000
const PREFS = { tajweed: false, wbw: false, spread: false }
const noop = () => () => {}
const DATE_LOC = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }

function surahName(n, lang) {
  if (!n) return ''
  if (lang === 'ar') return surahInfo(n)?.ar || ''
  return getSurahLocal(n, lang)?.name || surahInfo(n)?.latin || ''
}
const pageTitle = (page, lang) => surahName(surahsOnPage(page)[0], lang)

/** Canlı vəziyyət: ilk sorğu (state) + ictimai SSE (hello | page | round | active) */
function useKhatmLive() {
  const [snap, setSnap] = useState(null)       // { roundNo, startedAt, bits, readCount, active }
  const [conn, setConn] = useState('connecting')
  const [pulse, setPulse] = useState(null)     // { seq, page, cell }
  const [round, setRound] = useState(null)     // son "round" hadisəsi
  const seq = useRef(0)
  // Gec gələn köhnə dövr vəziyyəti (məs. state sorğusu "round" hadisəsindən sonra) yenisini əvəz etmir
  const fromServer = useCallback((s) => setSnap((cur) => (cur && cur.roundNo > s.roundNo ? cur
    : { roundNo: s.roundNo, startedAt: s.startedAt, bits: decodeBits(s.bits), readCount: s.readCount, active: s.active })), [])
  useEffect(() => {
    let alive = true
    khatmState().then((s) => { if (alive) fromServer(s) }).catch(() => {})
    if (typeof EventSource === 'undefined') return () => { alive = false }
    const es = new EventSource(LIVE_URL)
    const on = (name, fn) => es.addEventListener(name, (ev) => { try { fn(JSON.parse(ev.data)) } catch { /* pozuq mesaj */ } })
    on('hello', (s) => { fromServer(s); setConn('live') })
    on('page', (e) => {
      setConn('live')
      setSnap((cur) => {
        if (!cur || cur.roundNo !== e.roundNo) return cur
        const bits = withPage(cur.bits, e.page)
        return { ...cur, bits, readCount: Math.max(e.readCount || 0, countPages(bits)), active: Number.isInteger(e.active) ? e.active : cur.active }
      })
      setPulse({ seq: ++seq.current, page: e.page, cell: e.cell || null })
    })
    on('round', (e) => {
      setRound(e)
      setSnap({ roundNo: e.nextRoundNo || e.roundNo + 1, startedAt: e.completedAt, bits: decodeBits(''), readCount: 0, active: 0 })
    })
    on('active', (e) => setSnap((cur) => (cur && cur.roundNo === e.roundNo ? { ...cur, active: e.active } : cur)))
    es.onerror = () => { if (alive) setConn(es.readyState === EventSource.CLOSED ? 'closed' : 'retry') }
    es.onopen = () => setConn('live')
    return () => { alive = false; es.close() }
  }, [fromServer])
  return { snap, setSnap, conn, pulse, setPulse, round, setRound, seq }
}

export default function KhatmPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(KT, lang, 'en')
  const sheetL = pickUi(RT, lang, 'en').sheet
  const { status } = useAuthUser()
  const live = useKhatmLive()
  const { snap, conn, pulse, round } = live
  const [me, setMe] = useState(null)
  const [claim, setClaim] = useState(null)
  const [thanks, setThanks] = useState(null)
  const [msg, setMsg] = useState('')
  const [overlay, setOverlay] = useState(null)
  const [said, setSaid] = useState('')
  const lastSaid = useRef(0)

  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])
  const loadMe = useCallback(() => khatmMe().then((m) => {
    setMe(m)
    setClaim(m.claim)
    syncRounds(m.rounds)
  }).catch(() => {}), [])
  useEffect(() => { if (status === 'user') loadMe() }, [status, loadMe])

  // aria-live: canlı oxunuşlar — ən çox 8 saniyədə bir elan
  useEffect(() => {
    if (!pulse || !snap) return undefined
    const wait = Math.max(0, 8000 - (Date.now() - lastSaid.current))
    const id = setTimeout(() => { lastSaid.current = Date.now(); setSaid(t.livePage(pulse.page, snap.readCount)) }, wait)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse])

  // Dövr tamamlandı (canlı) — hamıya təbrik; iştirak etmisinizsə yaddaşda qeyd
  useEffect(() => {
    if (!round) return
    const mine = Boolean(readKhatm().r[String(round.roundNo)])
    if (mine) markDone(round.roundNo, dayOf(round.completedAt || Date.now()))
    setOverlay({ ...round, mine })
  }, [round])

  const onCompleted = useCallback((res, page) => {
    addPage(res.roundNo, page)
    live.setSnap((cur) => {
      if (!cur || cur.roundNo !== res.roundNo) return cur
      const bits = withPage(cur.bits, page)
      return { ...cur, bits, readCount: Math.max(res.readCount || 0, countPages(bits)) }
    })
    live.setPulse({ seq: ++live.seq.current, page, cell: null })
    setThanks(page)
    setClaim(null)
    if (res.roundCompleted) live.setRound(res.roundCompleted)
    loadMe()
  }, [live, loadMe])

  const loginHref = `${pathFor('login', siteLang)}?next=${encodeURIComponent(pathFor('khatm', siteLang))}`
  const total = KHATM_TOTAL
  const readCount = snap ? snap.readCount : 0

  return (
    <div className="kt-page">
      <header className="ui-page-hero kt-hero">
        <HeroOrnament />
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{t.eyebrow}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight" aria-labelledby="kt-live-title">
        <div className="ui-container kt-live">
          <div className="kt-live__text">
            <h2 className="ui-title" id="kt-live-title">{snap ? t.roundN(snap.roundNo) : t.ringTitle}</h2>
            <p className="kt-conn" role="status" data-testid="khatm-conn">
              <span className={`kt-dot kt-dot--${conn}`} aria-hidden="true" />
              {conn === 'live' ? t.live : conn === 'connecting' ? t.connecting : t.reconnecting}
            </p>
            <p className="ui-lead">{t.ringLead}</p>
            <div className="ui-stats kt-stats" data-testid="khatm-stats">
              <StatTile icon="mushaf" label={t.statPages} value={<span className="ui-num" data-testid="khatm-read">{readCount}</span>} unit={`/ ${total}`} />
              <StatTile icon="group" label={t.statReaders} value={<span className="ui-num" data-testid="khatm-active">{snap ? snap.active : 0}</span>} />
            </div>
            <ProgressBar value={readCount} max={total} label={t.readOf(readCount, total)} className="kt-meter" />
            <p className="kt-note">{t.readOf(readCount, total)}</p>
            <p className="ui-sr-only" aria-live="polite" data-testid="khatm-said">{said}</p>
          </div>
          <div className="kt-live__globe">
            <Suspense fallback={<div className="kg-wrap"><div className="kg-skel ui-skeleton" aria-hidden="true" /></div>}>
              <KhatmGlobe bits={snap?.bits} readCount={readCount} pulse={pulse} label={t.ringLabel(readCount, total)} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="ui-section ui-section--tight" aria-labelledby="kt-take-title">
        <div className="ui-container ui-container--narrow">
          <div className="ui-card kt-card" data-testid="khatm-action">
            <h2 className="kt-card__title" id="kt-take-title"><Icon name="mushaf" size={20} /> {claim ? t.yourPageLabel : t.takeTitle}</h2>
            {status === 'unknown' && <p className="kt-note" role="status">{t.connecting}</p>}
            {status === 'anon' && (
              <div data-testid="khatm-guest">
                <p>{t.watchNote}</p>
                <a className="ui-btn ui-btn--primary" href={loginHref}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.signIn}</a>
              </div>
            )}
            {status === 'user' && !claim && (
              <TakeForm t={t} lang={lang} me={me} thanks={thanks} msg={msg} setMsg={setMsg}
                onClaim={(c) => { setThanks(null); setClaim(c) }} />
            )}
            {status === 'user' && claim && (
              <Reader key={`${claim.roundNo}:${claim.page}`} t={t} lang={lang} sheetL={sheetL} claim={claim}
                onDone={onCompleted} onRelease={() => { setClaim(null); setThanks(null) }} onExpired={() => { setClaim(null); setMsg(t.err.expired) }} />
            )}
            <p className="kt-honor"><Icon name="shield" size={15} /> {t.honor}</p>
          </div>
          {status === 'user' && me && me.dedications && me.dedications.length > 0 && (
            <MyDedications t={t} items={me.dedications} onRemoved={loadMe} />
          )}
        </div>
      </section>

      <Archive t={t} lang={lang} refreshKey={round ? round.roundNo : 0} />

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <div className="ui-card kt-card kt-privacy">
            <h2 className="kt-card__title"><Icon name="shield" size={20} /> {t.privacyTitle}</h2>
            <p>{t.privacy}</p>
          </div>
        </div>
      </section>

      {overlay && <Celebration t={t} data={overlay} onClose={() => setOverlay(null)} />}
    </div>
  )
}

function TakeForm({ t, lang, me, thanks, msg, setMsg, onClaim }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [needVerify, setNeedVerify] = useState(false)   // server 403 verify_email
  const loc = useMemo(() => { try { return getPrayerLocation() } catch { return null } }, [])
  const canCell = Boolean(loc && !loc.isDefault && Number.isFinite(loc.lat) && Number.isFinite(loc.lng))
  const [cellOn, setCellOn] = useState(() => { try { return safeStorage()?.getItem(CELL_PREF) === '1' } catch { return false } })
  const city = loc ? (loc.city?.[lang] || loc.city?.en || '') : ''
  const toggleCell = (on) => {
    setCellOn(on)
    try { if (on) safeStorage()?.setItem(CELL_PREF, '1'); else safeStorage()?.removeItem(CELL_PREF) } catch { /* yaddaş bağlıdır */ }
  }
  const take = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg(''); setNeedVerify(false)
    try {
      const cell = canCell && cellOn ? { lat: Math.round(loc.lat), lon: Math.round(loc.lng) } : null
      const r = await khatmClaim({ dedication: name.trim() || undefined, cell })
      onClaim(r.claim)
    } catch (x) {
      if (apiErrCode(x) === 'verify_email') setNeedVerify(true)
      else setMsg(khatmError(x, t))
    } finally { setBusy(false) }
  }
  const loved = me?.loved || []
  return (
    <form onSubmit={take} noValidate data-testid="khatm-take">
      {thanks && <p className="kt-thanks" role="status" data-testid="khatm-thanks"><Icon name="sparkle" size={18} /> {t.thanks(thanks)}</p>}
      <p className="kt-note">{t.takeLead}</p>
      <label className="ui-field" htmlFor="kt-ded">
        <span className="ui-field__label">{t.dedicateLabel}</span>
        <input id="kt-ded" className="ui-input" value={name} maxLength={MAX_DEDICATION} placeholder={t.dedicatePh} autoComplete="off"
          onChange={(e) => setName(e.target.value)} aria-describedby="kt-ded-note" />
      </label>
      <p className="kt-note" id="kt-ded-note">{t.dedicateNote}</p>
      {loved.length > 0 && (
        <div className="kt-loved" role="group" aria-label={t.fromLoved}>
          <span className="kt-note">{t.fromLoved}</span>
          {loved.slice(0, 12).map((n) => (
            <button key={n} type="button" className="ui-chip" aria-pressed={name === n} onClick={() => setName(name === n ? '' : n)}>{n}</button>
          ))}
        </div>
      )}
      {canCell && (
        <label className="kt-switch">
          <input type="checkbox" checked={cellOn} onChange={(e) => toggleCell(e.target.checked)} aria-describedby="kt-cell-note" />
          <span>{t.shareCell}</span>
        </label>
      )}
      {canCell && <p className="kt-note" id="kt-cell-note">{t.shareCellNote(city)}</p>}
      {needVerify && <VerifyEmailNote lang={lang} testId="khatm-verify" />}
      {msg && <p className="kt-msg" role="alert">{msg}</p>}
      <button type="submit" className="ui-btn ui-btn--primary" disabled={busy} data-testid="khatm-take-btn">
        <Icon name="mushaf" className="ui-btn__icon" /> {busy ? t.taking : thanks ? t.another : t.take}
      </button>
    </form>
  )
}

function Reader({ t, lang, sheetL, claim, onDone, onRelease, onExpired }) {
  const wl = wbwLang(lang)
  const [reload, setReload] = useState(0)
  const { data, error } = useMushafPage(claim.page, wl, reload)
  const [dwell, setDwell] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const sheetRef = useRef(null)

  // Səhifə ekranda ≥ 10 s (tab görünür) → ayələr ömürlük mozaikaya, "Oxudum" üçün şərtlərdən biri
  useEffect(() => {
    const el = sheetRef.current
    if (!el || !data || dwell) return undefined
    let timer = 0, visible = false
    const arm = () => {
      clearTimeout(timer)
      if (visible && document.visibilityState === 'visible') {
        timer = setTimeout(() => { recordAyahs(pageAyahs(data.words)); setDwell(true) }, DWELL_MS)
      }
    }
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([en]) => { visible = en.isIntersecting; arm() }, { threshold: 0.3 })
      : null
    if (io) io.observe(el); else { visible = true; arm() }
    document.addEventListener('visibilitychange', arm)
    return () => { clearTimeout(timer); io?.disconnect(); document.removeEventListener('visibilitychange', arm) }
  }, [data, dwell])

  const ready = dwell && now >= claim.readyAt
  // Geri sayım yalnız lazım olanda (hazır olana və ya vaxt bitənə qədər) — saniyədə bir
  useEffect(() => {
    if (ready && now < claim.expiresAt - 60_000) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [ready, now, claim.expiresAt])
  useEffect(() => { if (now >= claim.expiresAt) onExpired() }, [now, claim.expiresAt, onExpired])

  const waitS = Math.max(0, Math.ceil((claim.readyAt - now) / 1000))
  const minsLeft = Math.max(1, Math.ceil((claim.expiresAt - now) / 60000))
  const done = async () => {
    setBusy(true); setMsg('')
    try { onDone(await khatmComplete(claim.page), claim.page) } catch (x) {
      if (x && (x.code === 'expired' || x.code === 'no_claim')) { onExpired(); return }
      setMsg(khatmError(x, t))
    } finally { setBusy(false) }
  }
  const release = async () => {
    setBusy(true)
    try { await khatmRelease() } catch { /* server sonra özü buraxır */ }
    setBusy(false)
    onRelease()
  }
  const title = pageTitle(claim.page, lang)
  return (
    <div className="kt-reader" data-testid="khatm-reader">
      <p className="kt-page-title" data-testid="khatm-page-title"><b>{t.yourPage(claim.page, title)}</b></p>
      {claim.dedication && <p className="kt-note">{t.dedicatedTo(claim.dedication)}</p>}
      <p className="kt-note">{t.readHint} {t.expiresIn(minsLeft)}</p>
      <div className="mp-stage kt-stage" ref={sheetRef}>
        <div className="mp-book" dir="rtl">
          <MushafSheet page={claim.page} data={data} error={error} prefs={PREFS} sel={null} onWordClick={noop} L={sheetL} onRetry={() => setReload((n) => n + 1)} />
        </div>
      </div>
      {msg && <p className="kt-msg" role="alert">{msg}</p>}
      <div className="kt-row">
        <button type="button" className="ui-btn ui-btn--primary" onClick={done} disabled={!ready || busy} data-testid="khatm-done"
          aria-describedby="kt-honor-inline">
          <Icon name="check" className="ui-btn__icon" /> {busy ? t.completing : t.done}
          {!ready && dwell && waitS > 0 && <span className="kt-wait ui-num"> · {t.waitS(waitS)}</span>}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost" onClick={release} disabled={busy}>{t.release}</button>
      </div>
      <p className="kt-note" id="kt-honor-inline">{t.honor}</p>
    </div>
  )
}

function MyDedications({ t, items, onRemoved }) {
  const [busy, setBusy] = useState(0)
  return (
    <section className="ui-card kt-card" aria-labelledby="kt-names-title" data-testid="khatm-names">
      <h2 className="kt-card__title" id="kt-names-title"><Icon name="duas" size={20} /> {t.myNames}</h2>
      <p className="kt-note">{t.dedicateNote}</p>
      <ul className="kt-list">
        {items.map((d) => (
          <li key={d.id}>
            <span>{d.name}</span> <span className="kt-note">· {t.roundN(d.roundNo)}</span>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy === d.id} aria-label={t.removeNameLabel(d.name)}
              onClick={async () => { setBusy(d.id); try { await deleteDedication(d.id) } catch { /* */ } setBusy(0); onRemoved() }}>{t.removeName}</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Archive({ t, lang, refreshKey }) {
  const [page, setPage] = useState(1)
  const [res, setRes] = useState(null)
  useEffect(() => {
    let alive = true
    khatmRounds(page).then((r) => { if (alive) setRes(r) }).catch(() => { if (alive) setRes((cur) => cur || { rounds: [], page: 1, pages: 1, total: 0, ramadan: null }) })
    return () => { alive = false }
  }, [page, refreshKey])
  const fmt = useMemo(() => {
    try { const f = new Intl.DateTimeFormat(DATE_LOC[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); return (ms) => f.format(new Date(ms)) } catch { return (ms) => new Date(ms).toISOString().slice(0, 16) }
  }, [lang])
  const ram = res?.ramadan
  return (
    <section className="ui-section ui-section--tight" aria-labelledby="kt-arch-title" data-testid="khatm-archive">
      <div className="ui-container ui-container--narrow">
        <div className="ui-section-head">
          <h2 className="ui-title" id="kt-arch-title">{t.archiveTitle}</h2>
          <p className="ui-lead">{t.archiveLead}</p>
        </div>
        {ram && (ram.current || ram.count > 0) && (
          <p className="kt-ramadan" data-testid="khatm-ramadan"><Icon name="moon" size={18} /> {ram.current ? t.ramadanNow(ram.count) : t.ramadanPast(ram.year, ram.count)}</p>
        )}
        {res && res.rounds.length === 0 && <p className="kt-note">{t.archiveEmpty}</p>}
        {res && res.rounds.length > 0 && (
          <div className="kt-table-wrap" tabIndex={0} role="region" aria-labelledby="kt-arch-title">
            <table className="kt-table">
              <thead>
                <tr>
                  <th scope="col">{t.colNo}</th><th scope="col">{t.colStart}</th><th scope="col">{t.colEnd}</th><th scope="col">{t.colDur}</th>
                  <th scope="col">{t.colPeople}</th><th scope="col">{t.colCountries}</th><th scope="col">{t.colNames}</th>
                </tr>
              </thead>
              <tbody>
                {res.rounds.map((r) => (
                  <tr key={r.no}>
                    <th scope="row" className="ui-num">№{r.no}</th>
                    <td>{fmt(r.startedAt)}</td><td>{fmt(r.completedAt)}</td><td>{fmtDuration(r.durationMs, t)}</td>
                    <td className="ui-num">{r.participants}</td><td className="ui-num">{r.countries}</td><td className="ui-num">{r.dedications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {res && res.pages > 1 && (
          <nav className="kt-row kt-pager" aria-label={t.archiveTitle}>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={res.page <= 1} onClick={() => setPage(res.page - 1)}>{t.prev}</button>
            <span className="kt-note ui-num">{t.pageOf(res.page, res.pages)}</span>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={res.page >= res.pages} onClick={() => setPage(res.page + 1)}>{t.next}</button>
          </nav>
        )}
      </div>
    </section>
  )
}

function Celebration({ t, data, onClose }) {
  const closeRef = useRef(null)
  const reduced = useReduced()
  useEffect(() => {
    closeRef.current?.focus()
    if (!reduced) import('../utils/celebrate').then((m) => m.celebrate({ size: 'big' })).catch(() => {})
    const key = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="kt-overlay" role="dialog" aria-modal="true" aria-labelledby="kt-done-title" data-testid="khatm-done-overlay">
      <div className="kt-overlay__card">
        <svg className="kt-rosette" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="60" cy="60" r="56" />
            <rect x="24" y="24" width="72" height="72" />
            <rect x="24" y="24" width="72" height="72" transform="rotate(45 60 60)" />
            <circle cx="60" cy="60" r="22" />
            <rect x="46" y="46" width="28" height="28" transform="rotate(45 60 60)" fill="currentColor" fillOpacity="0.18" />
          </g>
        </svg>
        <h2 className="kt-overlay__title" id="kt-done-title">{t.doneTitle(data.roundNo)}</h2>
        <p className="kt-overlay__line" data-testid="khatm-done-line">{t.doneLine(data.participants, data.countries, fmtDuration(data.durationMs, t))}</p>
        {data.dedications > 0 && <p>{t.doneNames(data.dedications)}</p>}
        {data.mine && <p className="kt-thanks">{t.doneYou}</p>}
        <p className="kt-note">{t.doneNext(data.nextRoundNo || data.roundNo + 1)}</p>
        <button ref={closeRef} type="button" className="ui-btn ui-btn--primary" onClick={onClose}>{t.close}</button>
      </div>
    </div>
  )
}
