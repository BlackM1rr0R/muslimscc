// ═══════════════════════════════════════════════════════
// Dərs 1 — Hərflər: 28 hərfin şəbəkəsi + seçilmiş hərfin kartı
// Kart: 4 forma, ad (ərəbcə + transliterasiya + cari dildə), məxrəc,
// bitişmə, qalın hərf nişanı, tələffüz səsi (varsa), Qurandan nümunə.
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { LETTERS, MAKHRAJ, QW } from '../../data/arabicCourse.js'
import { ui, pick } from './strings.js'
import { letterAudioUrl } from './useCourseAudio.js'
import { AudioButton, QuranExample } from './parts.jsx'

const FORM_KEYS = ['isolated', 'initial', 'medial', 'final']

export default function LetterLesson({ lang, audio }) {
  const t = ui(lang)
  const [filter, setFilter] = useState('all')
  const [selId, setSelId] = useState(LETTERS[0].id)
  const detailRef = useRef(null)
  const firstRender = useRef(true)

  const idx = LETTERS.findIndex(l => l.id === selId)
  const l = LETTERS[idx]
  const shown = LETTERS.filter(x => filter === 'all' || (filter === 'joining' ? x.joins : !x.joins))

  // Seçim dəyişəndə kart görünən yerə gəlsin (telefonda şəbəkə uzundur)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    const el = detailRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.top < 64 || r.top > window.innerHeight * 0.6) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
  }, [selId])

  const step = (d) => setSelId(LETTERS[(idx + d + LETTERS.length) % LETTERS.length].id)
  const audioKey = `letter-${l.id}`

  return (
    <div className="ac-letters-lesson">
      <div className="ac-split">
        {/* Seçilmiş hərfin kartı */}
        <article ref={detailRef} className="ui-card ac-detail" aria-live="polite" aria-labelledby="ac-detail-name">
          <div className="ac-detail__top">
            <div className="ac-detail__glyph-wrap" key={l.id}>
              <span className="ac-detail__glyph ui-arabic" lang="ar" aria-hidden="true">{l.ch}</span>
            </div>
            <div className="ac-detail__id">
              <span className="ac-detail__num ui-num">{idx + 1} / {LETTERS.length}</span>
              <h3 id="ac-detail-name" className="ac-detail__name">
                {pick(l.name, lang)}
                {lang !== 'ar' && <span className="ac-detail__name-ar ui-arabic" lang="ar">{l.name.ar}</span>}
              </h3>
              <span className="ac-tl" lang="und-Latn" dir="ltr">{l.tl}</span>
              <div className="ac-detail__badges">
                <span className={`ui-badge ${l.joins ? 'ui-badge--brand' : ''}`}>{l.joins ? t.joinsBoth : t.joinsBefore}</span>
                {l.heavy && <span className="ui-badge ac-badge-heavy">{t.heavy}</span>}
              </div>
              {l.audio
                ? <AudioButton variant="primary" playing={audio.playing === audioKey} label={t.listen} stopLabel={t.stop}
                    onClick={() => audio.play(audioKey, [letterAudioUrl(l.audio)])} />
                : <p className="ac-muted">{t.noAudio}</p>}
            </div>
          </div>

          <h4 className="ac-h4">{t.formsHead}</h4>
          <ol className="ac-forms" key={`f-${l.id}`}>
            {FORM_KEYS.map(k => (
              <li key={k} className="ac-form">
                <span className="ac-form__glyph ui-arabic" lang="ar">{l.forms[k]}</span>
                <span className="ac-form__label">{t.forms[k]}</span>
              </li>
            ))}
          </ol>

          <h4 className="ac-h4">{t.makhrajHead}</h4>
          <p className="ac-text">{pick(MAKHRAJ[l.makhraj], lang)}</p>

          <h4 className="ac-h4">{t.exampleHead}</h4>
          <QuranExample item={QW[l.ex]} lang={lang} audio={audio} />

          <div className="ac-detail__nav">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => step(-1)}>
              <Icon name="arrow" className="ui-btn__icon ac-back" /> {t.prevLetter}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => step(1)}>
              {t.nextLetter} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
            </button>
          </div>
        </article>

        {/* Hərflər şəbəkəsi */}
        <div className="ac-grid-col">
          <p className="ac-muted">{t.pickLetter}</p>
          <div className="ac-chips" role="group" aria-label={t.joinsTitle}>
            {['all', 'joining', 'nonJoining'].map(f => (
              <button key={f} type="button" className="ui-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {t[f]}
              </button>
            ))}
          </div>
          <ul className="ac-letter-grid" data-reveal="stagger-zoom" lang="ar" dir="rtl">
            {shown.map(x => (
              <li key={x.id}>
                <button type="button" className={`ac-tile ${x.joins ? '' : 'is-nonjoin'}`} aria-pressed={x.id === selId}
                  onClick={() => setSelId(x.id)} aria-label={`${pick(x.name, lang)} — ${x.ch}`}>
                  <span className="ac-tile__glyph ui-arabic" aria-hidden="true">{x.ch}</span>
                  <span className="ac-tile__name" lang={lang} dir="auto" aria-hidden="true">{pick(x.name, lang)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ac-notes">
        <div className="ui-card ui-card--sunken ac-note">
          <h3 className="ac-h4">{t.joinsTitle}</h3>
          <p className="ac-text">{t.joinsText}</p>
          <p className="ac-note__letters ui-arabic" lang="ar" dir="rtl">ا د ذ ر ز و</p>
        </div>
        <div className="ui-card ui-card--sunken ac-note">
          <h3 className="ac-h4">ء</h3>
          <p className="ac-text">{t.hamzaText}</p>
        </div>
      </div>
    </div>
  )
}
