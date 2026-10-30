// ═══════════════════════════════════════════════════════
// Dərs 4 — Təcvidin əsasları (yalnız ümumi qəbul olunmuş oxu qaydaları,
// Həfs ən Asim). Qruplar: əl artikli, sakin nun/tənvin, sakin mim,
// qalqalə, mədd. Hər qaydada hərflər + Qurandan nümunə (ayə səsi ilə).
// ═══════════════════════════════════════════════════════

import { useState } from 'react'
import { QW, TAJWEED } from '../../data/arabicCourse.js'
import { ui, pick } from './strings.js'
import { QuranExample } from './parts.jsx'

export default function TajweedLesson({ lang, audio }) {
  const t = ui(lang)
  const [group, setGroup] = useState(TAJWEED[0].id)
  const g = TAJWEED.find(x => x.id === group) || TAJWEED[0]

  return (
    <div className="ac-tajweed-lesson">
      <p className="ui-card ui-card--sunken ac-note ac-text">{t.tajweedLead}</p>
      <div className="ac-chips ac-chips--scroll" role="group" aria-label={pick(g.title, lang)}>
        {TAJWEED.map(x => (
          <button key={x.id} type="button" className="ui-chip" aria-pressed={group === x.id} onClick={() => setGroup(x.id)}>
            {pick(x.title, lang)}
          </button>
        ))}
      </div>

      <section key={g.id} className="ac-tj-group" aria-labelledby={`ac-tj-${g.id}`}>
        <h3 id={`ac-tj-${g.id}`} className="ac-h3">
          {pick(g.title, lang)}
          {lang !== 'ar' && <span className="ac-h3__ar ui-arabic" lang="ar">{g.title.ar}</span>}
        </h3>
        {g.intro && <p className="ac-muted">{pick(g.intro, lang)}</p>}
        <div className="ac-tj-rules">
          {g.rules.map((r, i) => (
            <article key={r.id} className="ui-card ac-rule" style={{ '--i': i }}>
              <header className="ac-rule__head">
                <h4 className="ac-rule__name">{pick(r.name, lang)}</h4>
                {lang !== 'ar' && <span className="ac-rule__term ui-arabic" lang="ar">{r.name.ar}</span>}
              </header>
              <p className="ac-text">{pick(r.desc, lang)}</p>
              <dl className="ac-rule__facts">
                {(r.letters || g.id === 'mim') && (
                  <div>
                    <dt>{t.letters}</dt>
                    <dd>
                      {r.letters
                        ? <span className="ac-rule__letters ui-arabic" lang="ar" dir="rtl">{r.letters}</span>
                        : <span>{t.restLetters}</span>}
                    </dd>
                  </div>
                )}
                {r.len && (
                  <div>
                    <dt>{t.length}</dt>
                    <dd><span className="ui-num">{r.len}</span> {t.counts}</dd>
                  </div>
                )}
              </dl>
              <div className="ac-rule__ex">
                {r.ex.map(k => <QuranExample key={k} item={QW[k]} lang={lang} audio={audio} size="sm" />)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
