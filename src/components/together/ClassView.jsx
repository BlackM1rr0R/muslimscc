// ═══════════════════════════════════════════════════════
// Müəllim sinfi (/together#k=<id>) — server/classes.js
// Müəllim: qeyd (≤200), dəvət, şablon tapşırıqlar, şagird siyahısı — fərdi vəziyyət YALNIZ razılıq verən
// şagird üçün (server də göndərmir), "Məni yoxla" keçidi (server/hifzTest.js — nəticə şagirdin SRS-inə).
// Şagird: tapşırıqlar + "etdim", müəllimlə paylaşma (razılıq; rəqəmlər bu cihazda — utils/familyStats).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { pathFor } from '../../seo/routes'
import CopyLink from '../readroom/CopyLink'
import { surahInfo } from '../../utils/mushaf'
import { surahLabel } from '../hifz/surahLabel'
import { checkLink } from '../../api/hifzCheck'
import { computeFamilyStats } from '../../utils/familyStats'
import {
  getClass, updateClass, deleteClass, newClassInvite, leaveClass, removeStudent, addAssignment, deleteAssignment,
  markAssignment, shareWithTeacher, stopSharingWithTeacher, createClassTest, classJoinLink, localToday,
} from '../../api/together'
import { tgError } from './togetherText'
import { Confirm, Msg, fmtDay, nf } from './tgUi'

const CLASS_FIELDS = ['hifzAyahs', 'quranAyahsTotal', 'quranDaysWeek']
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localToday(d) }

export function assignmentText(a, t, lang) {
  if (a.kind === 'read') return t.cls.asg.read(a.from, a.to)
  return t.cls.asg[a.kind](surahLabel(a.surah, lang), a.from, a.to)
}

function SurahSelect({ id, value, onChange, lang, label }) {
  return (
    <label className="ui-field" htmlFor={id}>
      <span className="ui-field__label">{label}</span>
      <select id={id} className="ui-select" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {Array.from({ length: 114 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}. {surahLabel(i + 1, lang)}</option>)}
      </select>
    </label>
  )
}

function NumField({ id, label, value, onChange, max }) {
  return (
    <label className="ui-field" htmlFor={id}>
      <span className="ui-field__label">{label}</span>
      <input id={id} className="ui-input ui-num rt-page-input" type="number" inputMode="numeric" min={1} max={max} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export default function ClassView({ id, t, lang, siteLang, onGone, initialToken = null }) {
  const [v, setV] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => getClass(id).then(setV).catch((e) => setErr(e && e.status === 404 ? t.cls.notFound : tgError(e, t))), [id, t])
  useEffect(() => { load() }, [load])
  const run = async (fn, okText, { reload = false } = {}) => {
    setBusy(true); setMsg(null)
    try {
      const r = await fn()
      if (r && r.class) setV(r)
      else if (reload) await load()
      if (okText) setMsg({ tone: 'ok', text: okText })
      return r || true
    } catch (e) { setMsg({ tone: 'bad', text: tgError(e, t) }); return null } finally { setBusy(false) }
  }

  if (err) return <p className="rt-msg" role="alert" data-testid="cls-error">{err}</p>
  if (!v) return <div className="spinner-wrap" role="status"><div className="spinner" /><span className="ui-sr-only">{t.common.loading}</span></div>
  const teacher = v.class.role === 'teacher'

  return (
    <article className="ui-card acc-section tg-board" aria-labelledby="cls-title" data-testid={teacher ? 'cls-teacher' : 'cls-student'}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name="learn" size={20} /></span>
        <div>
          <h2 className="acc-section__title" id="cls-title"><bdi>{v.class.name}</bdi></h2>
          <p className="acc-section__lead">
            {t.cls.students(v.class.students)}{!teacher && v.class.teacher ? <> · <bdi>{t.cls.teacherIs(v.class.teacher)}</bdi></> : null}
          </p>
        </div>
      </header>
      {teacher
        ? <TeacherPanel v={v} t={t} lang={lang} siteLang={siteLang} busy={busy} run={run} initialToken={initialToken} onGone={onGone} />
        : <StudentPanel v={v} t={t} lang={lang} busy={busy} run={run} onGone={onGone} />}
      <Msg msg={msg} />
    </article>
  )
}

function TeacherPanel({ v, t, lang, siteLang, busy, run, initialToken, onGone }) {
  const c = v.class
  const [note, setNote] = useState(c.note || '')
  const [invite, setInvite] = useState(initialToken)
  const [created, setCreated] = useState(null)   // { studentId, token }
  return (
    <>
      <form className="prf-form" onSubmit={(e) => { e.preventDefault(); run(() => updateClass(c.id, { note }), t.cls.noteSaved) }} data-testid="cls-note-form">
        <label className="ui-field" htmlFor="cls-note">
          <span className="ui-field__label">{t.cls.noteLabel}</span>
          <textarea id="cls-note" className="ui-input" rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div><button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy}>{t.cls.saveNote}</button></div>
      </form>

      <div className="prf-form" data-testid="cls-invite">
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy}
          onClick={() => run(async () => { const r = await newClassInvite(c.id); setInvite(r.token); return null })} data-testid="cls-new-invite">
          <Icon name="link" className="ui-btn__icon" /> {invite ? t.cls.newInvite : t.cls.invite}
        </button>
        <p className="rt-note">{t.cls.inviteNote}</p>
        {invite && <CopyLink link={classJoinLink(window.location.origin, pathFor('together', siteLang), invite)} label={t.cls.invite} copyText={t.common.copy} copiedText={t.common.copied} shareText={t.common.share} title={c.name} testId="cls-invite-link" />}
      </div>

      <AssignmentForm t={t} lang={lang} busy={busy} onAdd={(body) => run(() => addAssignment(c.id, body))} />

      <h3 className="rt-card__title">{t.cls.assignments}</h3>
      {v.assignments.length === 0 ? <p className="rt-note">{t.cls.noAssignments}</p> : (
        <ul className="rt-list" data-testid="cls-assignments">
          {v.assignments.map((a) => (
            <li key={a.id} className="rt-list__item">
              <span><strong>{assignmentText(a, t, lang)}</strong><br /><span className="rt-note">{t.cls.dueOn(fmtDay(a.dueOn, lang))} · {t.cls.doneCount(a.doneCount, c.sharing)}</span></span>
              <Confirm t={t} label={t.common.remove} onYes={() => run(() => deleteAssignment(c.id, a.id), null, { reload: true })} />
            </li>
          ))}
        </ul>
      )}

      <h3 className="rt-card__title">{t.cls.roster}</h3>
      {v.students.length === 0 ? <p className="rt-note">{t.cls.none}</p> : (
        <ul className="fam-members" data-testid="cls-roster">
          {v.students.map((s) => (
            <li key={s.id} className="fam-member" data-testid={`cls-student-${s.id}`}>
              <div className="fam-member__head">
                <span className="fam-member__who"><bdi>{s.label}</bdi> <span className="rt-badge">{s.sharing ? t.cls.sharing : t.cls.notSharing}</span></span>
                <Confirm t={t} label={t.cls.removeStudent} onYes={() => run(() => removeStudent(c.id, s.id), null, { reload: true })} />
              </div>
              {s.sharing && (
                <dl className="fam-stats">
                  <div className="fam-stat"><dt>{t.cls.doneN(s.done.length, v.assignments.length)}</dt><dd className="ui-num">{nf(s.done.length, lang)}</dd></div>
                  {s.stats?.hifzAyahs != null && <div className="fam-stat"><dt>{t.cls.hifzN(s.stats.hifzAyahs)}</dt><dd className="ui-num">{nf(s.stats.hifzAyahs, lang)}</dd></div>}
                  {s.stats?.quranAyahsTotal != null && <div className="fam-stat"><dt>{t.cls.ayahsN(s.stats.quranAyahsTotal)}</dt><dd className="ui-num">{nf(s.stats.quranAyahsTotal, lang)}</dd></div>}
                  {s.stats?.quranDaysWeek != null && <div className="fam-stat"><dt>{t.cls.daysN(s.stats.quranDaysWeek)}</dt><dd className="ui-num">{nf(s.stats.quranDaysWeek, lang)}</dd></div>}
                </dl>
              )}
              {s.tests.length > 0 && (
                <ul className="tg-tests">
                  {s.tests.map((x) => <li key={x.id} className="rt-note">{surahLabel(x.surah, lang)} {x.from}–{x.to}: <span className="hc-pill">{t.cls.testStatus[x.status] || x.status}</span></li>)}
                </ul>
              )}
              <TestForm t={t} lang={lang} busy={busy} sid={s.id}
                onCreate={(body) => run(async () => { const r = await createClassTest(c.id, { studentId: s.id, ...body }); setCreated({ studentId: s.id, token: r.token }); return null }, null, { reload: true })} />
              {created && created.studentId === s.id && (
                <CopyLink link={checkLink(window.location.origin, pathFor('hifztest', siteLang), created.token)} label={t.cls.testLink}
                  copyText={t.common.copy} copiedText={t.common.copied} shareText={t.common.share} title={t.cls.test} testId={`cls-test-link-${s.id}`} />
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="rt-row"><Confirm t={t} label={t.cls.del} testId="cls-delete" onYes={() => run(() => deleteClass(c.id)).then((r) => r && onGone && onGone())} /></div>
    </>
  )
}

function AssignmentForm({ t, lang, busy, onAdd }) {
  const [kind, setKind] = useState('memorize')
  const [surah, setSurah] = useState(67)
  const [from, setFrom] = useState('1')
  const [to, setTo] = useState('10')
  const [due, setDue] = useState(() => plusDays(7))
  const [err, setErr] = useState('')
  const max = kind === 'read' ? 604 : (surahInfo(surah)?.verses || 7)
  const submit = (e) => {
    e.preventDefault()
    const a = Number(from), b = Number(to)
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b > max || a > b) { setErr(t.err.range); return }
    setErr('')
    onAdd({ kind, ...(kind === 'read' ? {} : { surah }), from: a, to: b, dueOn: due })
  }
  return (
    <form className="prf-form" onSubmit={submit} noValidate data-testid="cls-assignment-form">
      <p className="rt-card__title"><Icon name="plus" size={18} /> {t.cls.addAssignment}</p>
      <label className="ui-field" htmlFor="cls-kind">
        <span className="ui-field__label">{t.cls.kind}</span>
        <select id="cls-kind" className="ui-select" value={kind} onChange={(e) => { setKind(e.target.value); setFrom('1'); setTo(e.target.value === 'read' ? '2' : '10') }}>
          {['memorize', 'read', 'review'].map((k) => <option key={k} value={k}>{t.cls.kinds[k]}</option>)}
        </select>
      </label>
      {kind !== 'read' && <SurahSelect id="cls-surah" value={surah} onChange={(s) => { setSurah(s); setFrom('1'); setTo(String(Math.min(10, surahInfo(s)?.verses || 7))) }} lang={lang} label={t.cls.surah} />}
      <div className="rt-row">
        <NumField id="cls-from" label={kind === 'read' ? t.cls.fromPage : t.cls.fromAyah} value={from} onChange={setFrom} max={max} />
        <NumField id="cls-to" label={kind === 'read' ? t.cls.toPage : t.cls.toAyah} value={to} onChange={setTo} max={max} />
        <label className="ui-field" htmlFor="cls-due">
          <span className="ui-field__label">{t.cls.due}</span>
          <input id="cls-due" className="ui-input ui-num" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
      </div>
      {err && <p className="rt-msg" role="alert">{err}</p>}
      <div><button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} data-testid="cls-add-assignment"><Icon name="plus" className="ui-btn__icon" /> {t.cls.add}</button></div>
    </form>
  )
}

function TestForm({ t, lang, busy, sid, onCreate }) {
  const [surah, setSurah] = useState(67)
  const [from, setFrom] = useState('1')
  const [to, setTo] = useState('10')
  const max = surahInfo(surah)?.verses || 7
  return (
    <details className="tg-details">
      <summary>{t.cls.test}</summary>
      <form className="prf-form" onSubmit={(e) => { e.preventDefault(); onCreate({ surah, from: Number(from), to: Number(to) }) }} data-testid={`cls-test-form-${sid}`}>
        <p className="rt-note">{t.cls.testLead}</p>
        <SurahSelect id={`cls-ts-${sid}`} value={surah} onChange={(s) => { setSurah(s); setFrom('1'); setTo(String(Math.min(10, surahInfo(s)?.verses || 7))) }} lang={lang} label={t.cls.surah} />
        <div className="rt-row">
          <NumField id={`cls-tf-${sid}`} label={t.cls.fromAyah} value={from} onChange={setFrom} max={max} />
          <NumField id={`cls-tt-${sid}`} label={t.cls.toAyah} value={to} onChange={setTo} max={max} />
        </div>
        <div><button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy}><Icon name="hifz" className="ui-btn__icon" /> {t.cls.createTest}</button></div>
      </form>
    </details>
  )
}

function StudentPanel({ v, t, lang, busy, run, onGone }) {
  const c = v.class
  const stats = useMemo(() => computeFamilyStats(), [])
  const [consent, setConsent] = useState(false)
  const [err, setErr] = useState('')
  const payload = Object.fromEntries(CLASS_FIELDS.map((f) => [f, stats[f] || 0]))
  const share = () => {
    if (!v.consent && !consent) { setErr(t.common.consentNeed); return }
    setErr('')
    run(() => shareWithTeacher(c.id, payload, !v.consent), t.cls.shared)
  }
  return (
    <>
      {c.note && (
        <div className="tg-note" data-testid="cls-note">
          <p className="rt-card__title">{t.cls.note}</p>
          <p><bdi>{c.note}</bdi></p>
        </div>
      )}
      <h3 className="rt-card__title">{t.cls.assignments}</h3>
      {v.assignments.length === 0 ? <p className="rt-note">{t.cls.noAssignments}</p> : (
        <ul className="rt-list" data-testid="cls-assignments">
          {v.assignments.map((a) => (
            <li key={a.id} className="rt-list__item">
              <span><strong>{assignmentText(a, t, lang)}</strong><br /><span className="rt-note">{t.cls.dueOn(fmtDay(a.dueOn, lang))}</span></span>
              {a.done
                ? <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} aria-pressed="true" onClick={() => run(() => markAssignment(c.id, a.id, false))}><Icon name="check" className="ui-btn__icon" /> {t.cls.done} · {t.cls.undo}</button>
                : <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} aria-pressed="false" onClick={() => run(() => markAssignment(c.id, a.id, true))} data-testid={`cls-done-${a.id}`}>{t.cls.markDone}</button>}
            </li>
          ))}
        </ul>
      )}
      <div className="prf-form" data-testid="cls-share">
        <p className="rt-card__title">{t.cls.share}</p>
        <p className="rt-note">{t.cls.shareLead}</p>
        <ul className="rt-note tg-plain">
          <li>{t.cls.hifzN(stats.hifzAyahs)}</li>
          <li>{t.cls.ayahsN(stats.quranAyahsTotal)}</li>
          <li>{t.cls.daysN(stats.quranDaysWeek)}</li>
        </ul>
        {!v.consent && (
          <label className="acc-check" htmlFor="cls-consent">
            <input id="cls-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="cls-consent" />
            <span>{t.cls.consent}</span>
          </label>
        )}
        {err && <p className="rt-msg" role="alert">{err}</p>}
        <div className="rt-row">
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={share} data-testid="cls-share-btn">
            <Icon name="share" className="ui-btn__icon" /> {v.consent ? t.cls.updateShare : t.cls.shareBtn}
          </button>
          {v.consent && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => stopSharingWithTeacher(c.id), t.cls.stopped)} data-testid="cls-stop-share">{t.cls.stopShare}</button>}
        </div>
        <p className="rt-note">{v.consent ? t.cls.sharingYes : t.cls.sharingNo}</p>
      </div>
      <div className="rt-row"><Confirm t={t} label={t.cls.leave} testId="cls-leave" onYes={() => run(() => leaveClass(c.id)).then((r) => r && onGone && onGone())} /></div>
    </>
  )
}
