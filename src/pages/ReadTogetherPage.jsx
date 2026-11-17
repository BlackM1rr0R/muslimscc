// ═══════════════════════════════════════════════════════
// /read-together — "Birlikdə Quran oxu" (server/readTogether.js, components/readroom/*)
//
//   /read-together?p=<səhifə>  — lobbi: (girişli) otaq yarat + açıq otaqlarım; girişsiz — "daxil olun"
//   /read-together#j=<dəvət>   — qoşulma: ləqəb → otaq (hesab lazım deyil)
//   /read-together#r=<otaq>    — otaq (bu cihazda iştirak sirri varsa; sahib başqa cihazdadırsa — reclaim)
// Sirlər URL fraqmentindədir — serverə, nginx loguna və Referer-ə getmir. noindex (src/seo/routes.js).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import HeroOrnament from '../components/HeroOrnament'
import { useAuthUser, refreshMe } from '../api/userSession'
import { MUSHAF_PAGES, isValidPage, readLastPage } from '../utils/mushaf'
import {
  createRoom, myRooms, reclaimRoom, joinRoom, loadSession, saveSession, readInvite, readRoomParam, MAX_NAME, MAX_TITLE,
} from '../api/readRoom'
import { RT, rtError } from '../components/readroom/readRoomText'
import ReadRoom from '../components/readroom/ReadRoom'
import '../styles/MushafPage.css'
import '../styles/ReadTogether.css'

const setHash = (h) => { try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${h}`) } catch { /* */ } }

export default function ReadTogetherPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(RT, lang, 'en')
  const location = useLocation()
  const { status, user } = useAuthUser()
  // view: lobby | join | room | ended | left
  const [view, setView] = useState('lobby')
  const [invite, setInvite] = useState(null)
  const [room, setRoom] = useState(null)        // { id, me: { pid, secret, invite?, state? } }
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])

  const enterRoom = useCallback((id, me) => {
    saveSession(id, me)
    setRoom({ id, me })
    setHash(`#r=${id}`)
    setView('room')
  }, [])
  // Bu cihazda iştirak sirri yoxdursa — sahib hesabla aparıcılığı bərpa edir (reclaim)
  const openRoom = useCallback((id) => {
    const s = loadSession(id)
    if (s) { enterRoom(id, s); return }
    reclaimRoom(id)
      .then((r) => enterRoom(id, { pid: r.pid, secret: r.secret, invite: r.invite, state: r.state, host: true }))
      .catch(() => setView('ended'))
  }, [enterRoom])

  // Fraqment → görünüş
  useEffect(() => {
    const h = window.location.hash
    const inv = readInvite(h)
    if (inv) { setInvite(inv); setView('join'); return }
    const rid = readRoomParam(h)
    if (!rid) return
    const s = loadSession(rid)
    if (s) { setRoom({ id: rid, me: s }); setView('room') }
    else if (status === 'user') openRoom(rid)
    else if (status === 'anon') setView('ended')
  }, [location.hash, status, openRoom])

  const onEnded = useCallback((why) => { setView(why === 'kicked' ? 'left' : 'ended') }, [])
  const inviteBase = pathFor('readtogether', siteLang)

  const hero = (
    <header className="ui-page-hero rt-hero">
      <HeroOrnament />
      <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
      <div className="ui-container">
        <span className="ui-eyebrow">{t.eyebrow}</span>
        <h1 className="ui-display">{t.title}</h1>
        <p className="ui-lead">{t.lead}</p>
      </div>
    </header>
  )

  if (view === 'room' && room) {
    return (
      <div className="rt-page">
        <h1 className="ui-sr-only">{t.title}</h1>
        <div className="ui-section ui-section--tight">
          <div className="ui-container rt-container">
            <ReadRoom key={room.id} room={room.id} me={room.me} t={t} lang={lang} inviteBase={inviteBase}
              onLeave={(why) => { setHash(''); onEnded(why) }} onEnded={onEnded} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rt-page">
      {hero}
      <div className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow rt-container">
          {(view === 'ended' || view === 'left') && (
            <section className="ui-card rt-card rt-ended" data-testid="rt-ended" role="status">
              <span className="ui-icon-tile" aria-hidden="true"><Icon name="mushaf" size={20} /></span>
              <h2 className="rt-card__title">{view === 'left' ? t.kicked : t.ended}</h2>
              {view === 'ended' && <p>{t.endedLead}</p>}
              <div className="rt-row">
                <a className="ui-btn ui-btn--primary ui-btn--sm" href={pathFor('mushaf', siteLang)}><Icon name="mushaf" className="ui-btn__icon" /> {t.backMushaf}</a>
                {status === 'user' && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setHash(''); setView('lobby') }}>{t.newRoom}</button>}
              </div>
            </section>
          )}
          {view === 'join' && invite && (
            <JoinCard t={t} invite={invite} defaultName={user?.displayName || ''} busy={busy} setBusy={setBusy} err={err} setErr={setErr}
              onJoined={(r) => enterRoom(r.room, { pid: r.pid, secret: r.secret, state: r.state })} />
          )}
          {view === 'lobby' && status === 'unknown' && <p className="rt-note" role="status">{t.connecting}</p>}
          {view === 'lobby' && status !== 'unknown' && (
            status === 'user'
              ? <Lobby t={t} user={user} search={location.search} busy={busy} setBusy={setBusy} err={err} setErr={setErr}
                  onCreated={(r) => enterRoom(r.room, { pid: r.pid, secret: r.secret, invite: r.invite, state: r.state, host: true })}
                  onOpen={openRoom} />
              : (
                <section className="ui-card rt-card" data-testid="rt-signin">
                  <p>{t.signIn}</p>
                  <a className="ui-btn ui-btn--primary ui-btn--sm" href={`${pathFor('login', siteLang)}?next=${encodeURIComponent(pathFor('readtogether', siteLang) + location.search)}`}>
                    <Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.signInBtn}
                  </a>
                </section>
              )
          )}
          <p className="rt-note rt-privacy"><Icon name="shield" size={15} /> {t.privacy}</p>
        </div>
      </div>
    </div>
  )
}

function JoinCard({ t, invite, defaultName, busy, setBusy, err, setErr, onJoined }) {
  const [name, setName] = useState(defaultName)
  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setErr(t.err.name); return }
    setBusy(true); setErr('')
    try { onJoined(await joinRoom(invite, name.trim())) } catch (x) { setErr(rtError(x, t)) } finally { setBusy(false) }
  }
  return (
    <form className="ui-card rt-card" onSubmit={submit} data-testid="rt-join" noValidate>
      <h2 className="rt-card__title"><Icon name="group" size={20} /> {t.joinTitle}</h2>
      <label className="ui-field" htmlFor="rt-name">
        <span className="ui-field__label">{t.yourName}</span>
        <input id="rt-name" className="ui-input" value={name} maxLength={MAX_NAME} autoComplete="nickname" onChange={(e) => setName(e.target.value)}
          aria-invalid={err === t.err.name || undefined} aria-describedby="rt-join-note" required />
      </label>
      <p className="rt-note" id="rt-join-note">{t.joinNote}</p>
      {err && <p className="rt-msg" role="alert">{err}</p>}
      <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {busy ? t.joining : t.join}</button>
    </form>
  )
}

function Lobby({ t, user, search, busy, setBusy, err, setErr, onCreated, onOpen }) {
  const q = Number(new URLSearchParams(search || '').get('p'))
  const [page, setPage] = useState(() => String(isValidPage(q) ? q : readLastPage() || 1))
  const [title, setTitle] = useState('')
  const [anyone, setAnyone] = useState(false)
  const [rooms, setRooms] = useState(null)
  useEffect(() => { myRooms().then((r) => setRooms(r.rooms || [])).catch(() => setRooms([])) }, [])
  const submit = async (e) => {
    e.preventDefault()
    const p = Number(page)
    if (!isValidPage(p)) return
    setBusy(true); setErr('')
    try { onCreated(await createRoom({ page: p, title: title.trim(), anyoneTurns: anyone, name: user?.displayName || undefined })) } catch (x) { setErr(rtError(x, t)) } finally { setBusy(false) }
  }
  return (
    <>
      <form className="ui-card rt-card" onSubmit={submit} data-testid="rt-create" noValidate>
        <h2 className="rt-card__title"><Icon name="plus" size={20} /> {t.createTitle}</h2>
        <label className="ui-field" htmlFor="rt-title">
          <span className="ui-field__label">{t.roomName}</span>
          <input id="rt-title" className="ui-input" value={title} maxLength={MAX_TITLE} placeholder={t.roomNamePh} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="ui-field" htmlFor="rt-page">
          <span className="ui-field__label">{t.startPage}</span>
          <input id="rt-page" className="ui-input ui-num rt-page-input" type="number" inputMode="numeric" min={1} max={MUSHAF_PAGES} value={page} onChange={(e) => setPage(e.target.value)} />
        </label>
        <label className="rt-switch">
          <input type="checkbox" checked={anyone} onChange={(e) => setAnyone(e.target.checked)} />
          <span>{t.anyone}</span>
        </label>
        {err && <p className="rt-msg" role="alert">{err}</p>}
        <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}><Icon name="group" className="ui-btn__icon" /> {busy ? t.creating : t.create}</button>
      </form>
      {rooms && rooms.length > 0 && (
        <section className="ui-card rt-card" aria-labelledby="rt-mine">
          <h2 className="rt-card__title" id="rt-mine"><Icon name="mushaf" size={20} /> {t.mine}</h2>
          <ul className="rt-list">
            {rooms.map((r) => (
              <li key={r.id} className="rt-list__item">
                <span><strong>{r.title || t.title}</strong> · {t.livePage(r.page)} · {t.people(r.participants)} · {t.onlineN(r.online)}</span>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => onOpen(r.id)}>{t.open}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
