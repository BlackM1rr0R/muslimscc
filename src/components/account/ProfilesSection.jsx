// ═══════════════════════════════════════════════════════
// /account → "Profillər": bir hesabda ailə üzvləri üçün ayrıca irəliləyiş (utils/profiles).
// Keçid: aktiv profilin iş nüsxəsi saxlanır, digərininki yüklənir, səhifə yenilənir (bütün bölmələr
// yenidən oxusun). Uçdan-uca şifrəli sinxronizasiyaya hər profil ayrıca düşür. AccountPage tənbəl yükləyir.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import {
  AVATARS, COLORS, MAX_PROFILES, MAX_NAME, EVENT, readRegistry, activeId, enableProfiles, addProfile, updateProfile,
  removeProfile, switchProfile, disableProfiles, profileFilled,
} from '../../utils/profiles'
import { PRF } from './familyText'
import ProfileAvatar from './ProfileAvatar'
import '../../styles/ReadTogether.css'

function useRegistry() {
  const read = () => ({ reg: readRegistry(), active: activeId() })
  const [v, setV] = useState(read)
  useEffect(() => {
    const on = () => setV(read())
    window.addEventListener(EVENT, on)
    window.addEventListener('storage', on)
    return () => { window.removeEventListener(EVENT, on); window.removeEventListener('storage', on) }
  }, [])
  return v
}

function ProfileForm({ t, initial, onSave, onCancel, submitText, testId }) {
  const id = useId()
  const [name, setName] = useState(initial?.name || '')
  const [kid, setKid] = useState(Boolean(initial?.kid))
  const [avatar, setAvatar] = useState(initial?.avatar || 'star8')
  const [color, setColor] = useState(initial?.color || 'emerald')
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) { setErr(t.nameNeed); return }
    try { onSave({ name, kid, avatar, color }) } catch { setErr(t.nameNeed) }
  }
  return (
    <form className="prf-form" onSubmit={submit} data-testid={testId} noValidate>
      <label className="ui-field" htmlFor={`${id}-n`}>
        <span className="ui-field__label">{t.name}</span>
        <input id={`${id}-n`} className="ui-input" value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(err) || undefined} />
      </label>
      <label className="rt-switch"><input type="checkbox" checked={kid} onChange={(e) => setKid(e.target.checked)} /><span>{t.kid}</span></label>
      <fieldset className="prf-picker">
        <legend>{t.avatar}</legend>
        {AVATARS.map((a) => (
          <label key={a} className="prf-pick" title={t.avatars[a]}>
            <input type="radio" name={`${id}-a`} value={a} checked={avatar === a} onChange={() => setAvatar(a)} aria-label={t.avatars[a]} />
            <ProfileAvatar profile={{ name: name || '?', avatar: a, color }} size="sm" />
          </label>
        ))}
      </fieldset>
      <fieldset className="prf-picker">
        <legend>{t.color}</legend>
        {COLORS.map((c) => (
          <label key={c} className="prf-pick" title={t.colors[c]}>
            <input type="radio" name={`${id}-c`} value={c} checked={color === c} onChange={() => setColor(c)} aria-label={t.colors[c]} />
            <ProfileAvatar profile={{ name: name || '?', avatar: 'circle', color: c }} size="sm" />
          </label>
        ))}
      </fieldset>
      {err && <p className="rt-msg" role="alert">{err}</p>}
      <div className="rt-row">
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm">{submitText || t.save}</button>
        {onCancel && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onCancel}>{t.cancel}</button>}
      </div>
    </form>
  )
}

export default function ProfilesSection({ lang, defaultName = '' }) {
  const t = pickUi(PRF, lang, 'en')
  const { reg, active } = useRegistry()
  const [msg, setMsg] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [ask, setAsk] = useState(null)
  const [first, setFirst] = useState(defaultName)
  const [second, setSecond] = useState('')

  const go = (id) => {
    if (!switchProfile(id)) { setMsg(t.failed); return }
    window.location.reload()
  }
  const enable = (e) => {
    e.preventDefault()
    if (!first.trim()) { setMsg(t.nameNeed); return }
    try {
      enableProfiles({ name: first, avatar: 'star8', color: 'emerald' }, second.trim() ? { name: second, avatar: 'crescent', color: 'amber', kid: true } : null)
      setMsg('')
    } catch { setMsg(t.failed) }
  }

  return (
    <section className="ui-card acc-section" aria-labelledby="prf-title" id="profiles" data-testid="profiles-section">
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name="user" size={20} /></span>
        <div>
          <h2 className="acc-section__title" id="prf-title">{t.title}</h2>
          <p className="acc-section__lead">{t.lead}</p>
        </div>
      </header>

      {!reg ? (
        <form className="prf-form" onSubmit={enable} data-testid="profiles-enable" noValidate>
          <p className="rt-note">{t.enableLead}</p>
          <label className="ui-field" htmlFor="prf-first">
            <span className="ui-field__label">{t.yourName}</span>
            <input id="prf-first" className="ui-input" value={first} maxLength={MAX_NAME} onChange={(e) => setFirst(e.target.value)} />
          </label>
          <label className="ui-field" htmlFor="prf-second">
            <span className="ui-field__label">{t.firstKid}</span>
            <input id="prf-second" className="ui-input" value={second} maxLength={MAX_NAME} onChange={(e) => setSecond(e.target.value)} />
          </label>
          <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm"><Icon name="plus" className="ui-btn__icon" /> {t.enable}</button>
        </form>
      ) : (
        <>
          <ul className="prf-grid" aria-label={t.title}>
            {reg.list.map((p) => {
              const isActive = p.id === active
              return (
                <li key={p.id} className={`prf-card${isActive ? ' is-active' : ''}`} data-testid={`profile-${p.name}`}>
                  <ProfileAvatar profile={p} />
                  <p className="prf-card__name"><bdi>{p.name}</bdi></p>
                  <p className="prf-card__meta">{p.kid ? `${t.kidBadge} · ` : ''}{t.filled(profileFilled(p.id))}</p>
                  {isActive
                    ? <span className="rt-badge" aria-current="true">{t.active}</span>
                    : <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => go(p.id)} aria-label={`${t.switchTo}: ${p.name}`}>{t.switchTo}</button>}
                  <div className="prf-card__actions">
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setEditing(p.id)} aria-label={`${t.edit}: ${p.name}`}><Icon name="edit" size={14} /></button>
                    {!isActive && (ask === p.id ? (
                      <span className="rt-confirm">
                        <span>{t.removeAsk}</span>
                        <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" onClick={() => { removeProfile(p.id); setAsk(null) }}>{t.yes}</button>
                        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(null)}>{t.cancel}</button>
                      </span>
                    ) : (
                      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(p.id)} aria-label={`${t.remove}: ${p.name}`}><Icon name="trash" size={14} /></button>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
          {editing && (
            <ProfileForm t={t} initial={reg.list.find((p) => p.id === editing)} testId="profile-edit"
              onSave={(v) => { updateProfile(editing, v); setEditing(null) }} onCancel={() => setEditing(null)} />
          )}
          {reg.list.length < MAX_PROFILES ? (
            adding
              ? <ProfileForm t={t} testId="profile-add" submitText={t.add} onSave={(v) => { addProfile(v); setAdding(false) }} onCancel={() => setAdding(false)} />
              : <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAdding(true)} data-testid="profile-add-open"><Icon name="plus" className="ui-btn__icon" /> {t.add}</button>
          ) : <p className="rt-note">{t.max(MAX_PROFILES)}</p>}
          {reg.list.length === 1 && (
            <p className="rt-note">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => disableProfiles()}>{t.disable}</button> {t.disableNote}
            </p>
          )}
          <p className="rt-note"><Icon name="lock" size={14} /> {t.sync}</p>
        </>
      )}
      {msg && <p className="rt-msg" role="alert">{msg}</p>}
    </section>
  )
}
