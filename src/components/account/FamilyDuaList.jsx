// ═══════════════════════════════════════════════════════
// Ailə dairəsi → "Ailə dua siyahısı" (server/familyDua.js). Yalnız dairə üzvləri görür.
// Üzv istək yazır (≤300); digərləri "Sizin üçün dua etdim" — yalnız say; müəllif "qəbul olundu" / sil;
// üzv uyğunsuz istəyi dairə sahibinə bildirir, sahib silir. FamilySection bu faylı tənbəl yükləyir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { FD } from './communityText'
import { Confirm, Msg, fmtMs } from '../community/CommunityUi'
import { getFamilyDuas, postFamilyDua, prayFamilyDua, answerFamilyDua, reportFamilyDua, deleteFamilyDua } from '../../api/community'
import '../../styles/Community.css'

export default function FamilyDuaList({ lang }) {
  const t = pickUi(FD, lang, 'en')
  const uid = useId()
  const [data, setData] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [reported, setReported] = useState(() => new Set())

  const load = useCallback(() => getFamilyDuas().then(setData).catch(() => setData(null)), [])
  useEffect(() => { load() }, [load])

  const run = async (fn) => {
    setBusy(true); setMsg(null)
    try { await fn(); await load(); return true } catch (e) { setMsg({ tone: 'bad', text: e && e.status === 429 ? t.limit : t.failed }); return false } finally { setBusy(false) }
  }
  const onPost = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    if (await run(() => postFamilyDua(text.trim()))) setText('')
  }

  if (!data) return null
  return (
    <div className="prf-form" data-testid="family-duas">
      <p className="rt-card__title"><Icon name="duas" size={18} /> {t.title}</p>
      <p className="rt-note">{t.lead}</p>
      <form onSubmit={onPost} className="ui-field">
        <label className="ui-sr-only" htmlFor={`${uid}-t`}>{t.title}</label>
        <textarea id={`${uid}-t`} className="ui-input" rows={2} maxLength={300} value={text} placeholder={t.ph} onChange={(e) => setText(e.target.value)} data-testid="family-dua-text" />
        <div className="rt-row">
          <span className="rt-note ui-num">{[...text].length} / 300</span>
          <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || !text.trim()} data-testid="family-dua-post"><Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {t.post}</button>
        </div>
      </form>
      {data.duas.length === 0 ? <p className="rt-note">{t.none}</p> : (
        <ul className="fd-list" data-testid="family-dua-list">
          {data.duas.map((d) => (
            <li key={d.id} className={`fd-item${d.answered ? ' is-answered' : ''}`}>
              <p className="fd-item__body"><bdi>{d.body}</bdi></p>
              <p className="fd-item__meta">
                <bdi>{d.self ? t.you : d.author}</bdi> · {fmtMs(d.createdAt, lang)} · <span data-testid="family-dua-count">{t.count(d.prayed)}</span>
                {d.answered && <> · <span className="rt-badge"><Icon name="check" size={12} /> {t.answered}</span></>}
                {data.owner && d.reports > 0 && <> · <span className="rt-badge"><Icon name="alert" size={12} /> {t.flags(d.reports)}</span></>}
              </p>
              <div className="rt-row">
                {!d.self && (
                  <button type="button" className={`ui-btn ui-btn--sm ${d.prayedByMe ? 'ui-btn--secondary' : 'ui-btn--primary'}`} disabled={busy || d.prayedByMe}
                    aria-pressed={d.prayedByMe} onClick={() => run(() => prayFamilyDua(d.id))} data-testid="family-dua-pray">
                    <Icon name={d.prayedByMe ? 'check' : 'duas'} className="ui-btn__icon" /> {d.prayedByMe ? t.prayedDone : t.prayed}
                  </button>
                )}
                {d.self && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => answerFamilyDua(d.id, !d.answered))} data-testid="family-dua-answered">
                    {d.answered ? t.unmark : t.markAnswered}
                  </button>
                )}
                {!d.self && !reported.has(d.id) && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy}
                    onClick={() => run(async () => { await reportFamilyDua(d.id); setReported((s) => new Set(s).add(d.id)) })}>{t.report}</button>
                )}
                {!d.self && reported.has(d.id) && <span className="rt-note">{t.reported}</span>}
                {(d.self || data.owner) && <Confirm t={t} label={t.del} onYes={() => run(() => deleteFamilyDua(d.id))} icon="trash" />}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Msg msg={msg} />
    </div>
  )
}
