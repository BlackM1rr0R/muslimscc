// ═══════════════════════════════════════════════════════
// Qrup çağırışının lövhəsi (/together#c=<id>) — server/challenges.js
// Lövhədə YALNIZ gün üzrə toplu say ("bu gün 5 nəfərdən 4-ü"); üzvün öz işarələri ayrıca.
// Ad, reytinq, fərdi say yoxdur. "khatm" şablonunda 30 cüz (yalnız götürülüb / oxunub / sizin).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react'
import Icon from '../Icon'
import { pathFor } from '../../seo/routes'
import CopyLink from '../readroom/CopyLink'
import {
  getChallenge, tickChallenge, juzChallenge, setChallengeReminder, leaveChallenge, deleteChallenge, newChallengeInvite, challengeJoinLink,
} from '../../api/together'
import { tgError } from './togetherText'
import { Confirm, Msg, challengeName, fmtDay } from './tgUi'

export default function ChallengeBoard({ id, t, lang, siteLang, onGone, initialToken = null }) {
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState(initialToken)
  const [remind, setRemind] = useState('')

  const load = useCallback(() => getChallenge(id).then((r) => { setC(r.challenge); setRemind(r.challenge.reminder?.at || '') })
    .catch((e) => setErr(e && e.status === 404 ? t.ch.notFound : tgError(e, t))), [id, t])
  useEffect(() => { load() }, [load])

  const run = async (fn, okText) => {
    setBusy(true); setMsg(null)
    try { const r = await fn(); if (r && r.challenge) setC(r.challenge); if (okText) setMsg({ tone: 'ok', text: okText }); return r } catch (e) { setMsg({ tone: 'bad', text: tgError(e, t) }); return null } finally { setBusy(false) }
  }

  if (err) return <p className="rt-msg" role="alert" data-testid="ch-error">{err}</p>
  if (!c) return <div className="spinner-wrap" role="status"><div className="spinner" /><span className="ui-sr-only">{t.common.loading}</span></div>

  const mine = new Set(c.mine)
  const todayRow = c.board.find((d) => d.day === c.today)
  const inRange = c.today >= c.startOn && c.today <= c.endOn
  const ended = c.today > c.endOn
  const name = challengeName(c, t)
  const togetherPath = pathFor('together', siteLang)

  return (
    <article className="ui-card acc-section tg-board" aria-labelledby="ch-title" data-testid="ch-board">
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name="group" size={20} /></span>
        <div>
          <h2 className="acc-section__title" id="ch-title"><bdi>{name}</bdi></h2>
          <p className="acc-section__lead">
            {t.ch.range(fmtDay(c.startOn, lang), fmtDay(c.endOn, lang))} · {t.ch.days(c.days)} · {t.ch.members(c.members)}
            {ended && <> · <span className="rt-badge">{t.ch.ended}</span></>}
          </p>
        </div>
      </header>

      {todayRow && (
        <div className="tg-today" data-testid="ch-today">
          <p className="tg-today__count" aria-live="polite">{t.ch.todayOf(todayRow.done, c.members)}</p>
          <div className="tg-bar" aria-hidden="true"><span style={{ inlineSize: `${c.members ? Math.round((todayRow.done / c.members) * 100) : 0}%` }} /></div>
          {inRange && (
            mine.has(c.today)
              ? <button type="button" className="ui-btn ui-btn--secondary" disabled={busy} onClick={() => run(() => tickChallenge(c.id, c.today, false))} data-testid="ch-untick"><Icon name="check" className="ui-btn__icon" /> {t.ch.youToday} · {t.ch.untick}</button>
              : <button type="button" className="ui-btn ui-btn--primary" disabled={busy} onClick={() => run(() => tickChallenge(c.id, c.today, true))} data-testid="ch-tick"><Icon name="check" className="ui-btn__icon" /> {t.ch.tickToday}</button>
          )}
        </div>
      )}
      {!todayRow && !ended && <p className="rt-note">{t.ch.starts(fmtDay(c.startOn, lang))}</p>}

      <h3 className="rt-card__title">{t.ch.board}</h3>
      <p className="rt-note">{t.ch.boardNote} {t.ch.markedDays(c.mine.length, c.days)}</p>
      <ol className="tg-days" data-testid="ch-days">
        {c.board.map((d, i) => {
          const open = d.day <= c.today
          const isMine = mine.has(d.day)
          const label = t.ch.dayLabel(i + 1, fmtDay(d.day, lang), d.done, c.members, isMine)
          return (
            <li key={d.day}>
              <button type="button" className={`tg-day${isMine ? ' is-mine' : ''}${d.day === c.today ? ' is-today' : ''}`} disabled={!open || busy}
                aria-pressed={isMine} title={label} onClick={() => run(() => tickChallenge(c.id, d.day, !isMine))} data-testid={`ch-day-${i + 1}`}>
                <span className="tg-day__n" aria-hidden="true">{i + 1}</span>
                <span className="tg-day__c ui-num" aria-hidden="true">{d.done}/{c.members}</span>
                <span className="ui-sr-only">{label}</span>
                <span className="tg-day__fill" style={{ blockSize: `${c.members ? Math.round((d.done / c.members) * 100) : 0}%` }} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ol>

      {c.juz && (
        <section className="prf-form" aria-labelledby="ch-juz-title" data-testid="ch-juz">
          <h3 className="rt-card__title" id="ch-juz-title">{t.ch.juzTitle}</h3>
          <p className="rt-note">{t.ch.juzLead} {t.ch.juzProgress(c.juz.filter((j) => j.done).length)}</p>
          <ul className="tg-juz">
            {c.juz.map((j) => (
              <li key={j.juz} className={`tg-juz__item${j.mine ? ' is-mine' : ''}${j.done ? ' is-done' : ''}`}>
                <span className="tg-juz__n">{t.ch.juzN(j.juz)}</span>
                <span className="tg-juz__st">{j.mine ? t.ch.yours : j.done ? t.ch.read : j.taken ? t.ch.taken : t.ch.free}{j.mine && j.done ? ` · ${t.ch.read}` : ''}</span>
                {!j.taken && !ended && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => juzChallenge(c.id, j.juz, 'take'))} aria-label={`${t.ch.take}: ${t.ch.juzN(j.juz)}`}>{t.ch.take}</button>}
                {j.mine && !j.done && (
                  <>
                    <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={() => run(() => juzChallenge(c.id, j.juz, 'done'))} aria-label={`${t.ch.readDone}: ${t.ch.juzN(j.juz)}`}>{t.ch.readDone}</button>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => juzChallenge(c.id, j.juz, 'release'))} aria-label={`${t.ch.release}: ${t.ch.juzN(j.juz)}`}>{t.ch.release}</button>
                  </>
                )}
                {j.mine && j.done && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => juzChallenge(c.id, j.juz, 'undone'))} aria-label={`${t.ch.undo}: ${t.ch.juzN(j.juz)}`}>{t.ch.undo}</button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!ended && (
        <form className="prf-form" onSubmit={(e) => { e.preventDefault(); run(() => setChallengeReminder(c.id, remind || null), remind ? t.ch.reminderSaved : t.ch.reminderCleared) }} data-testid="ch-reminder">
          <p className="rt-card__title"><Icon name="bell" size={18} /> {t.ch.reminder}</p>
          <p className="rt-note">{t.ch.reminderLead}</p>
          <div className="rt-row">
            <label className="ui-field" htmlFor="ch-remind">
              <span className="ui-field__label">{t.ch.remindAt}</span>
              <input id="ch-remind" className="ui-input ui-num" type="time" value={remind} onChange={(e) => setRemind(e.target.value)} />
            </label>
            <button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy}>{t.common.save}</button>
            {c.reminder?.at && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => { setRemind(''); run(() => setChallengeReminder(c.id, null), t.ch.reminderCleared) }}>{t.ch.reminderOff}</button>}
          </div>
        </form>
      )}

      {c.owner && !ended && (
        <div className="prf-form" data-testid="ch-invite">
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy}
            onClick={() => run(async () => { const r = await newChallengeInvite(c.id); setInvite(r.token); return r })} data-testid="ch-new-invite">
            <Icon name="link" className="ui-btn__icon" /> {invite ? t.ch.newInvite : t.ch.invite}
          </button>
          <p className="rt-note">{t.ch.inviteNote}</p>
          {invite && <CopyLink link={challengeJoinLink(window.location.origin, togetherPath, invite)} label={t.ch.invite} copyText={t.common.copy} copiedText={t.common.copied} shareText={t.common.share} title={name} testId="ch-invite-link" />}
        </div>
      )}

      <Msg msg={msg} />
      <div className="rt-row">
        {c.owner
          ? <Confirm t={t} label={t.ch.del} testId="ch-delete" onYes={() => run(() => deleteChallenge(c.id)).then((r) => r && onGone && onGone())} />
          : <Confirm t={t} label={t.ch.leave} testId="ch-leave" onYes={() => run(() => leaveChallenge(c.id)).then((r) => r && onGone && onGone())} />}
      </div>
    </article>
  )
}
