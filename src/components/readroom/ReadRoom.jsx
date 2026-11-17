// ═══════════════════════════════════════════════════════
// "Birlikdə Quran oxu" otağı: yuxarı panel (ad, iştirakçılar, izlə, dəvət, çıx) + Mushaf vərəqi.
// Server → klient: EventSource (SSE). Hər mesaj otağın TAM vəziyyətidir (server/readTogether.js);
// bağlantı qırılanda yeni bilet alınıb yenidən qoşulur (artan fasilə). Aparıcı vərəqi çevirir
// və oxunan ayəni işarələyir; "Aparıcını izlə" söndürülübsə iştirakçı öz səhifəsində gəzir.
// a11y: səhifə / işarə / qoşulma dəyişiklikləri aria-live ilə elan olunur; ayəni klaviatura ilə
// seçmək üçün aparıcıya siyahı (select) da var.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { MushafSheet, useMushafPage } from '../quran/MushafSheet'
import { MUSHAF_PAGES, clampPage, wbwLang, prefetchMushafPage } from '../../utils/mushaf'
import { getTicket, eventsUrl, roomAction, dropSession, inviteLink, AuthError } from '../../api/readRoom'
import { rtError } from './readRoomText'
import CopyLink from './CopyLink'

const PREFS = { tajweed: false, wbw: false, spread: false }
const noop = () => () => {}

/** SSE bağlantısı: { state, conn: 'connecting'|'live'|'retry', end: null|'closed'|'kicked' } */
function useRoomStream(room, me) {
  const [state, setState] = useState(me.state || null)
  // Köhnə (gec gələn) vəziyyət yenisini əvəz etməsin — seq yalnız artır
  const apply = useCallback((s) => setState((cur) => (!cur || !s || s.seq >= cur.seq ? s : cur)), [])
  const [conn, setConn] = useState('connecting')
  const [end, setEnd] = useState(null)
  useEffect(() => {
    let es = null, timer = 0, alive = true, delay = 500
    const stop = () => { if (es) { es.close(); es = null } clearTimeout(timer) }
    const retry = () => {
      stop()
      if (!alive) return
      setConn('retry')
      timer = setTimeout(connect, delay)
      delay = Math.min(delay * 2, 15000)
    }
    async function connect() {
      if (!alive) return
      let ticket
      try { ticket = await getTicket(room, me) } catch (e) {
        if (!alive) return
        if (e instanceof AuthError && (e.status === 403 || e.status === 404)) { setEnd('closed'); return }
        retry(); return
      }
      if (!alive) return
      es = new EventSource(eventsUrl(room, ticket))
      es.addEventListener('state', (ev) => {
        try { apply(JSON.parse(ev.data)); setConn('live'); delay = 500 } catch { /* pozuq mesaj */ }
      })
      es.addEventListener('closed', () => { setEnd('closed'); alive = false; stop() })
      es.addEventListener('kicked', () => { setEnd('kicked'); alive = false; stop() })
      es.onerror = retry
    }
    connect()
    return () => { alive = false; stop() }
  }, [room, me, apply])
  return { state, conn, end, apply }
}

function Avatar({ name, online, host }) {
  const ch = ([...String(name || '?').trim()][0] || '?').toLocaleUpperCase()
  return (
    <span className={`rt-ava${online ? ' is-online' : ''}${host ? ' is-host' : ''}`} aria-hidden="true">
      {ch}<span className="rt-ava__dot" />
    </span>
  )
}

export default function ReadRoom({ room, me, t, lang, inviteBase, onLeave, onEnded }) {
  const { state, conn, end, apply } = useRoomStream(room, me)
  const [follow, setFollow] = useState(true)
  const [localPage, setLocalPage] = useState(() => me.state?.page || 1)
  const [msg, setMsg] = useState('')
  const [live, setLive] = useState('')
  const [invite, setInvite] = useState(me.invite || '')
  const [askClose, setAskClose] = useState(false)
  const [busy, setBusy] = useState(false)
  const stageRef = useRef(null)
  const prev = useRef(null)
  const wl = wbwLang(lang)

  const meP = state?.participants.find((p) => p.pid === me.pid)
  const isHost = Boolean(meP?.host)
  const canTurn = isHost || Boolean(state?.anyoneTurns)
  const roomPage = state?.page || 1
  const viewPage = follow ? roomPage : localPage
  const [reload, setReload] = useState(0)
  const { data, error } = useMushafPage(viewPage, wl, reload)

  useEffect(() => { if (end) onEnded(end) }, [end, onEnded])

  // aria-live: vərəq, işarə, qoşulma/ayrılma
  useEffect(() => {
    if (!state) return
    const p = prev.current
    prev.current = state
    if (!p) return
    const said = []
    if (p.page !== state.page) said.push(t.livePage(state.page))
    if (state.highlight && p.highlight !== state.highlight) said.push(t.liveMark(state.highlight))
    const before = new Map(p.participants.map((x) => [x.pid, x]))
    const after = new Map(state.participants.map((x) => [x.pid, x]))
    for (const [pid, x] of after) if (!before.has(pid) && pid !== me.pid) said.push(t.liveJoined(x.name))
    for (const [pid, x] of before) if (!after.has(pid)) said.push(t.liveLeft(x.name))
    if (said.length) setLive(said.join('. '))
  }, [state, t, me.pid])

  // Qonşu səhifələri qabaqcadan yüklə
  useEffect(() => {
    const id = setTimeout(() => { prefetchMushafPage(viewPage + 1, wl); prefetchMushafPage(viewPage - 1, wl) }, 600)
    return () => clearTimeout(id)
  }, [viewPage, wl])

  // Oxunan ayə: data-ak="s:a" olan sözlər parlayır (yalnız otaq səhifəsində)
  const highlight = state?.highlight && viewPage === roomPage ? state.highlight : null
  useEffect(() => {
    const st = stageRef.current
    if (!st) return undefined
    const els = highlight ? st.querySelectorAll(`[data-ak="${highlight}"]`) : []
    els.forEach((el) => el.classList.add('is-glow'))
    return () => els.forEach((el) => el.classList.remove('is-glow'))
  }, [highlight, data])

  const act = useCallback(async (body) => {
    setMsg('')
    try {
      const r = await roomAction(room, me, body)
      if (r?.state) apply(r.state)
      return r
    } catch (e) { setMsg(rtError(e, t)); return null }
  }, [room, me, t, apply])

  const turn = useCallback((p) => {
    const n = clampPage(p)
    if (follow && canTurn) act({ type: 'page', page: n })
    else { setFollow(false); setLocalPage(n) }
  }, [follow, canTurn, act])
  // Mushaf qaydası: növbəti səhifə SOLDADIR (← növbəti, → əvvəlki)
  const next = () => { if (viewPage < MUSHAF_PAGES) turn(viewPage + 1) }
  const prevPage = () => { if (viewPage > 1) turn(viewPage - 1) }
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (viewPage < MUSHAF_PAGES) turn(viewPage + 1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); if (viewPage > 1) turn(viewPage - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewPage, turn])

  // Aparıcı ayəyə toxunur → hamıda işarə
  const onStageClick = (e) => {
    if (!isHost || viewPage !== roomPage) return
    const el = e.target.closest?.('[data-ak]')
    if (!el) return
    const k = el.getAttribute('data-ak')
    act({ type: 'highlight', ayah: k === state?.highlight ? null : k })
  }
  const pageAyahs = useMemo(() => [...new Set((data?.words || []).map((w) => w.key))], [data])

  const toggleFollow = () => { setFollow((f) => { if (f) setLocalPage(roomPage); return !f }) }
  const leave = async () => {
    setBusy(true)
    await act({ type: isHost ? 'close' : 'leave' })
    dropSession(room)
    setBusy(false)
    onLeave(isHost ? 'closed' : 'kicked')
  }
  const newInvite = async () => {
    const r = await act({ type: 'invite' })
    if (r?.invite) setInvite(r.invite)
  }

  const L = t.sheet
  const title = state?.title || t.title
  const online = state ? state.participants.filter((p) => p.online).length : 0

  return (
    <div className="rt-room" data-testid="rt-room">
      <div className="rt-bar ui-card" role="region" aria-label={title}>
        <div className="rt-bar__top">
          <div className="rt-bar__title">
            <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="group" size={16} /></span>
            <div>
              <h2 className="rt-bar__name">{title}</h2>
              <p className="rt-bar__meta">
                <span data-testid="rt-room-page">{t.livePage(roomPage)}</span> · {t.onlineN(online)}
                {conn !== 'live' && <span className="rt-bar__conn" role="status"> · {conn === 'retry' ? t.reconnecting : t.connecting}</span>}
              </p>
            </div>
          </div>
          <div className="rt-bar__actions">
            {!isHost && (
              <label className="rt-switch">
                <input type="checkbox" checked={follow} onChange={toggleFollow} data-testid="rt-follow" />
                <span>{t.follow}</span>
              </label>
            )}
            {isHost ? (
              askClose ? (
                <span className="rt-confirm">
                  <span>{t.closeAsk}</span>
                  <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" onClick={leave} disabled={busy}>{t.yes}</button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAskClose(false)}>{t.cancel}</button>
                </span>
              ) : (
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAskClose(true)} data-testid="rt-close">
                  <Icon name="close" className="ui-btn__icon" /> {t.close}
                </button>
              )
            ) : (
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={leave} disabled={busy} data-testid="rt-leave">
                <Icon name="logout" className="ui-btn__icon ui-flip-rtl" /> {t.leave}
              </button>
            )}
          </div>
        </div>

        <ul className="rt-people" aria-label={t.participants}>
          {(state?.participants || []).map((p) => (
            <li key={p.pid} className="rt-people__item">
              <Avatar name={p.name} online={p.online} host={p.host} />
              <span className="rt-people__name"><bdi>{p.name}</bdi>{p.pid === me.pid ? ` (${t.you})` : ''}</span>
              <span className="ui-sr-only">{p.host ? `${t.host}, ` : ''}{p.online ? t.online : t.offline}</span>
              {p.host && <span className="rt-badge" aria-hidden="true">{t.host}</span>}
              {isHost && !p.host && (
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm rt-people__kick" onClick={() => act({ type: 'kick', target: p.pid })}
                  aria-label={`${t.kick}: ${p.name}`}><Icon name="close" size={14} /></button>
              )}
            </li>
          ))}
        </ul>

        {isHost && (
          <details className="rt-invite" open={!state || state.participants.length < 2}>
            <summary><Icon name="link" size={16} /> {t.invite}</summary>
            {invite && <CopyLink link={inviteLink(window.location.origin, inviteBase, invite)} label={t.invite} copyText={t.copy} copiedText={t.copied} shareText={t.share} title={t.title} testId="rt-invite-link" />}
            <p className="rt-note">{t.newInviteNote}</p>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={newInvite}><Icon name="refresh" className="ui-btn__icon" /> {t.newInvite}</button>
            <label className="rt-switch">
              <input type="checkbox" checked={Boolean(state?.anyoneTurns)} onChange={(e) => act({ type: 'settings', anyoneTurns: e.target.checked })} data-testid="rt-anyone" />
              <span>{t.anyone}</span>
            </label>
          </details>
        )}
        {msg && <p className="rt-msg" role="alert">{msg}</p>}
      </div>

      <nav className="mp-pager rt-pager" aria-label={t.pagerLabel} dir="ltr">
        <button type="button" className="ui-btn ui-btn--secondary mp-pager__btn" onClick={next} disabled={viewPage >= MUSHAF_PAGES || (follow && !canTurn)}
          aria-label={t.livePage(viewPage + 1)} data-testid="rt-next">
          <Icon name="chevronLeft" size={18} />
        </button>
        <p className="mp-pager__pos" dir="auto">
          <span className="ui-num" data-testid="rt-view-page">{viewPage}</span> <span className="mp-pager__of">/ {MUSHAF_PAGES}</span>
        </p>
        <button type="button" className="ui-btn ui-btn--secondary mp-pager__btn" onClick={prevPage} disabled={viewPage <= 1 || (follow && !canTurn)}
          aria-label={t.livePage(viewPage - 1)} data-testid="rt-prev">
          <Icon name="chevron" size={18} />
        </button>
      </nav>
      {!follow && (
        <p className="rt-hint"><button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setFollow(true)} data-testid="rt-back">{t.backToRoom(roomPage)}</button></p>
      )}
      {follow && !canTurn && <p className="rt-hint">{t.turnHint}</p>}
      {isHost && (
        <div className="rt-mark">
          <p className="rt-hint"><Icon name="touch" size={15} /> {t.hostHint}</p>
          <label className="ui-field rt-mark__field">
            <span className="ui-field__label">{t.markLabel}</span>
            <select className="ui-select" value={state?.highlight && pageAyahs.includes(state.highlight) ? state.highlight : ''}
              onChange={(e) => act({ type: 'highlight', ayah: e.target.value || null })} data-testid="rt-mark-select">
              <option value="">{t.clearMark}</option>
              {pageAyahs.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className={`mp-stage rt-stage${isHost ? ' is-host' : ''}`} ref={stageRef} onClick={onStageClick}>
        <div className="mp-book" dir="rtl" key={viewPage}>
          <MushafSheet page={viewPage} data={data} error={error} prefs={PREFS} sel={null} onWordClick={noop} L={L} onRetry={() => setReload((n) => n + 1)} />
        </div>
      </div>
      <p className="ui-sr-only" aria-live="polite" data-testid="rt-live">{live}</p>
    </div>
  )
}
