// ═══════════════════════════════════════════════════════
// Dərs 2 — Hərəkələr: hər işarənin kartı + hərf × hərəkə cədvəli
// Hecaların açıq lisenziyalı səsi tapılmadı — burada səs düyməsi yoxdur.
// ═══════════════════════════════════════════════════════

import { useState } from 'react'
import { HARAKAT, LETTERS, QW, SYLLABLE_MODES, syllables } from '../../data/arabicCourse.js'
import { ui, pick } from './strings.js'
import { QuranExample } from './parts.jsx'

const TATWEEL = 'ـ'

export default function HarakatLesson({ lang, audio }) {
  const t = ui(lang)
  const [mode, setMode] = useState('fatha')

  return (
    <div className="ac-harakat-lesson">
      <h3 className="ac-h3">{t.harakatHead}</h3>
      <div className="ac-hk-grid" data-reveal="stagger">
        {HARAKAT.map(h => (
          <article key={h.id} className="ui-card ac-hk">
            <div className="ac-hk__head">
              <span className="ac-hk__mark ui-arabic" lang="ar" aria-hidden="true">
                {h.id === 'madd' ? 'ا و ي' : TATWEEL + h.mark}
              </span>
              <div>
                <h4 className="ac-hk__name">{pick(h.name, lang)}</h4>
                {lang !== 'ar' && <span className="ac-hk__term ui-arabic" lang="ar">{h.name.ar}</span>}
              </div>
            </div>
            <p className="ac-text">{pick(h.desc, lang)}</p>
            <div className="ac-hk__samples" lang="ar" dir="rtl">
              {(h.variants || [h]).map(v => (
                <span key={v.sample} className="ac-syl">
                  <span className="ac-syl__ar ui-arabic">{v.sample}</span>
                  <span className="ac-tl" lang="und-Latn" dir="ltr">{v.tl}</span>
                </span>
              ))}
            </div>
            <div className="ac-hk__ex">
              {(h.variants ? h.variants.map(v => v.ex) : [h.ex]).map(k => (
                <QuranExample key={k} item={QW[k]} lang={lang} audio={audio} size="sm" />
              ))}
            </div>
          </article>
        ))}
      </div>

      <section className="ac-table-sec" aria-labelledby="ac-table-h">
        <h3 id="ac-table-h" className="ac-h3">{t.tableHead}</h3>
        <p className="ac-muted">{t.tableLead}</p>
        <div className="ac-chips" role="group" aria-label={t.tableHead}>
          {SYLLABLE_MODES.map(m => (
            <button key={m} type="button" className="ui-chip" aria-pressed={mode === m} onClick={() => setMode(m)}>{t.modes[m]}</button>
          ))}
        </div>
        <p className="ac-muted ac-small">{t.syllableNoAudio}</p>
        {/* key={mode}: rejim dəyişəndə xanalar yenidən "açılır" (CSS animasiyası, yalnız transform/opacity) */}
        <ul className="ac-syl-grid" key={mode} lang="ar" dir="rtl">
          {LETTERS.map((l, i) => {
            const list = syllables(l, mode)
            if (!list.length) return null
            return (
              <li key={l.id} className="ac-syl-cell" style={{ '--i': Math.min(i, 27) }}>
                <span className="ac-syl-cell__letter ui-arabic" aria-hidden="true">{l.ch}</span>
                <span className="ac-syl-cell__list">
                  {list.map(s => (
                    <span key={s.ar} className="ac-syl">
                      <span className="ac-syl__ar ui-arabic">{s.ar}</span>
                      <span className="ac-tl" lang="und-Latn" dir="ltr">{s.tl}</span>
                    </span>
                  ))}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
