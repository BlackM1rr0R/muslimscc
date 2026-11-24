// ═══════════════════════════════════════════════════════
// Admin: icma lövhələri — panel rolu editor / admin / superadmin (hamısı)
//   Namaz otaqları (server/prayerRooms.js): GET /api/admin/prayer-rooms?status=, POST …/:id { approve|reject|delete }
//   Cənazə elanları (server/janaza.js):    GET /api/admin/janaza?status=,       POST …/:id — yalnız ictimai siyahı
//   Könüllülər (server/volunteers.js):     GET /api/admin/volunteers,           DELETE …/:id
// Moderator yalnız məzmunu görür — müəllifin e-poçtu, ailənin əlaqəsi, yazılanların adları göstərilmir
// (server onları göndərmir).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { AdminHeader, AdminEmpty, AdminAlert } from './AdminUi'
import { Confirm, fmtDay } from '../community/CommunityUi'
import { BM, PR, JZ, ROOM_TYPES, osmLink } from '../boards/boardsText'
import {
  adminPrayerRooms, adminDecidePrayerRoom, adminJanaza, adminDecideJanaza, adminVolunteers, adminDeleteVolunteerNeed,
} from '../../api/communityBoards'
import '../../styles/ReadTogether.css'
import '../../styles/Community.css'
import '../../styles/CommunityBoards.css'

const STATUSES = ['pending', 'reported', 'approved', 'rejected']

export default function CommunityBoardsModeration() {
  const { lang } = useLang()
  const l = pickUi(BM, lang, 'en')
  const [tab, setTab] = useState('rooms')
  return (
    <div className="cbm" data-testid="admin-boards">
      <AdminHeader icon="prayerrooms" title={l.title} sub={l.lead} />
      <div className="cbm__tabs" role="group" aria-label={l.title}>
        {Object.keys(l.tabs).map((k) => (
          <button key={k} type="button" className="ui-chip" aria-pressed={tab === k} onClick={() => setTab(k)} data-testid={`cbm-tab-${k}`}>{l.tabs[k]}</button>
        ))}
      </div>
      {tab === 'rooms' && <Queue key="rooms" l={l} lang={lang} kind="rooms" />}
      {tab === 'janaza' && <Queue key="janaza" l={l} lang={lang} kind="janaza" />}
      {tab === 'volunteers' && <VolunteerList l={l} lang={lang} />}
    </div>
  )
}

function Queue({ l, lang, kind }) {
  const uid = useId()
  const isRooms = kind === 'rooms'
  const pr = pickUi(PR, lang, 'en'), jz = pickUi(JZ, lang, 'en'), types = pickUi(ROOM_TYPES, lang, 'en')
  const [status, setStatus] = useState('pending')
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [reasonOf, setReasonOf] = useState({})
  const load = useCallback(() => {
    setFailed(false)
    return (isRooms ? adminPrayerRooms(status) : adminJanaza(status)).then(setData).catch(() => { setFailed(true); setData(null) })
  }, [isRooms, status])
  useEffect(() => { load() }, [load])
  const decide = (id, action) => {
    const reason = action === 'reject' ? (reasonOf[id] || data?.reasons?.[0]) : undefined
    return (isRooms ? adminDecidePrayerRoom(id, action, reason) : adminDecideJanaza(id, action, reason)).then(load).catch(() => setFailed(true))
  }
  const reasonLabel = (r) => (isRooms ? pr.reasons[r] : jz.reasons[r]) || r
  return (
    <section className="cbm" aria-label={l.tabs[kind]}>
      <div className="cbm__filters" role="group" aria-label={l.reason}>
        {STATUSES.map((s) => (
          <button key={s} type="button" className="ui-chip" aria-pressed={status === s} onClick={() => { if (s !== status) { setData(null); setStatus(s) } }} data-testid={`cbm-${kind}-${s}`}>
            {l.status[s]}{data?.counts && s !== 'reported' && data.counts[s] != null ? ` · ${data.counts[s]}` : ''}{data?.counts && s === 'reported' ? ` · ${data.counts.flagged}` : ''}
          </button>
        ))}
      </div>
      {failed && <AdminAlert>{l.loadErr}</AdminAlert>}
      {!data && !failed && <AdminEmpty icon="prayerrooms" busy>{l.loading}</AdminEmpty>}
      {data && data.items.length === 0 && <AdminEmpty icon="check">{l.empty}</AdminEmpty>}
      {data && data.items.map((it) => (
        <article key={it.id} className="cbm__item" data-testid={`cbm-${kind}-item`}>
          {isRooms ? (
            <>
              <p className="cb-strong" dir="auto">{it.name}</p>
              <p className="rt-note"><span className="rt-badge">{types[it.type] || it.type}</span> <bdi>{it.city}</bdi>{it.address && <> · <bdi>{it.address}</bdi></>}{it.floor && <> · {pr.floor}: <bdi>{it.floor}</bdi></>}</p>
              {it.notes && <p className="cm-pre" dir="auto">{it.notes}</p>}
              <p className="rt-note">{it.wudu ? pr.wudu : ''}{it.wudu && it.women ? ' · ' : ''}{it.women ? pr.women : ''}</p>
              <p><a className="ui-link" href={osmLink(it.lat, it.lng)} target="_blank" rel="noopener noreferrer" dir="ltr">{l.map} ({it.lat}, {it.lng})</a></p>
            </>
          ) : (
            <>
              <p className="cb-strong" dir="auto">{it.deceased}</p>
              <p className="rt-note"><span className="ui-num">{fmtDay(it.date, lang)}</span>{it.time && <> · <span className="ui-num" dir="ltr">{it.time}</span></>} · <bdi>{it.place}</bdi>{it.city && <>, <bdi>{it.city}</bdi></>}</p>
              {it.burial && <p className="rt-note">{jz.burial}: <bdi>{it.burial}</bdi></p>}
            </>
          )}
          {it.reason && <p className="rt-note">{l.reason}: {reasonLabel(it.reason)}</p>}
          {it.reports?.length > 0 && (
            <>
              <p className="rt-note">{l.reports}</p>
              <ul className="cbm__reports">
                {it.reports.map((r, i) => <li key={i}>{isRooms ? (pr.reportKinds[r.kind] || r.kind) : (jz.reportReasons[r.reason] || r.reason)}{r.note ? <> — <bdi>{r.note}</bdi></> : null}</li>)}
              </ul>
            </>
          )}
          <div className="rt-row">
            {(status !== 'approved') && <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => decide(it.id, 'approve')} data-testid={`cbm-${kind}-approve`}><Icon name="check" size={14} /> {l.approve}</button>}
            {status !== 'rejected' && (
              <>
                <label className="ui-sr-only" htmlFor={`${uid}-r${it.id}`}>{l.reason}</label>
                <select id={`${uid}-r${it.id}`} className="ui-select" value={reasonOf[it.id] || data.reasons[0]} onChange={(e) => setReasonOf((x) => ({ ...x, [it.id]: e.target.value }))}>
                  {data.reasons.map((r) => <option key={r} value={r}>{reasonLabel(r)}</option>)}
                </select>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => decide(it.id, 'reject')} data-testid={`cbm-${kind}-reject`}>{l.reject}</button>
              </>
            )}
            <Confirm t={{ confirm: l.confirm, yes: l.yes, cancel: l.cancel }} label={l.del} icon="trash" testId={`cbm-${kind}-del`} onYes={() => decide(it.id, 'delete')} />
          </div>
        </article>
      ))}
    </section>
  )
}

function VolunteerList({ l, lang }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(() => adminVolunteers().then((d) => { setData(d); setFailed(false) }).catch(() => setFailed(true)), [])
  useEffect(() => { load() }, [load])
  if (failed) return <AdminAlert>{l.loadErr}</AdminAlert>
  if (!data) return <AdminEmpty icon="volunteers" busy>{l.loading}</AdminEmpty>
  if (data.items.length === 0) return <AdminEmpty icon="volunteers">{l.empty}</AdminEmpty>
  return (
    <section className="cbm" aria-label={l.tabs.volunteers}>
      {data.items.map((n) => (
        <article key={n.id} className="cbm__item" data-testid="cbm-volunteers-item">
          <p className="cb-strong" dir="auto">{n.title}</p>
          <p className="rt-note"><bdi>{n.mosqueName}</bdi> (<span dir="ltr">{n.mosqueId}</span>) · <span className="ui-num">{fmtDay(n.date, lang)}</span>{n.time && <> · <span className="ui-num" dir="ltr">{n.time}</span></>}</p>
          {n.description && <p className="cm-pre" dir="auto">{n.description}</p>}
          <p className="rt-note ui-num">{l.slots(n.filled, n.slots)}</p>
          <div className="rt-row">
            <Confirm t={{ confirm: l.confirm, yes: l.yes, cancel: l.cancel }} label={l.del} icon="trash" testId="cbm-volunteers-del" onYes={() => adminDeleteVolunteerNeed(n.id).then(load).catch(() => setFailed(true))} />
          </div>
        </article>
      ))}
    </section>
  )
}
