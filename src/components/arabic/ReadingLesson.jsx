// ═══════════════════════════════════════════════════════
// Dərs 3 — Hecalar və oxu: iki/üç hərfli Quran sözləri, sonra qısa
// surələr söz-söz (Fatihə, İxlas, Fələq, Nas). Sözə toxunanda
// transliterasiya açılır; bütöv ayəni qarinin səsi ilə dinləmək olar.
// ═══════════════════════════════════════════════════════

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { PRACTICE_AYAHS, PRACTICE_SURAHS, QW, READING_THREE, READING_TWO } from '../../data/arabicCourse.js'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import { ui, pick } from './strings.js'
import { AudioButton } from './parts.jsx'
import { ayahUrls } from './useCourseAudio.js'

/** Toxunanda transliterasiyası açılan söz */
function WordChip({ w, tl, always, id }) {
  const [open, setOpen] = useState(false)
  const show = always || open
  return (
    <button type="button" className={`ac-word ${show ? 'is-open' : ''}`} aria-expanded={always ? undefined : open}
      aria-describedby={show ? id : undefined} onClick={() => setOpen(o => !o)}>
      <span className="ac-word__ar ui-arabic" lang="ar">{w}</span>
      <span id={id} className="ac-word__tl ac-tl" lang="und-Latn" dir="ltr" aria-hidden={!show}>{tl}</span>
    </button>
  )
}

export default function ReadingLesson({ lang, audio }) {
  const navigate = useNavigate()
  const t = ui(lang)
  const [surah, setSurah] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const ayahs = PRACTICE_AYAHS[surah] || []
  const surahHref = pathFor('quran', lang, surah)

  const wordBlock = (keys, head) => (
    <section className="ac-words-sec" aria-label={head}>
      <h3 className="ac-h3">{head}</h3>
      <ul className="ac-words" lang="ar" dir="rtl" data-reveal="stagger-zoom">
        {keys.map(k => {
          const it = QW[k]
          const key = `ayah-${it.ref}`
          return (
            <li key={k} className="ac-word-card">
              <WordChip w={it.w} tl={it.tl} id={`ac-tl-${k}`} always={showAll} />
              <span className="ac-word-card__ref" lang={lang} dir="auto">
                <bdi className="ui-num">{it.ref}</bdi>
                <AudioButton iconOnly playing={audio.playing === key} label={`${t.listenAyah} — ${it.ref}`} stopLabel={t.stop}
                  onClick={() => audio.play(key, ayahUrls(it))} />
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )

  return (
    <div className="ac-reading-lesson">
      <div className="ac-row-between">
        <p className="ac-muted">{t.wordsLead}</p>
        <label className="ac-switch">
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
          <span className="ac-switch__track" aria-hidden="true"><span className="ac-switch__thumb" /></span>
          <span>{t.showTl}</span>
        </label>
      </div>
      {wordBlock(READING_TWO, t.twoHead)}
      {wordBlock(READING_THREE, t.threeHead)}

      <section className="ac-surah-sec" aria-labelledby="ac-surah-h">
        <h3 id="ac-surah-h" className="ac-h3">{t.surahHead}</h3>
        <p className="ac-muted">{t.surahLead}</p>
        <div className="ac-chips" role="group" aria-label={t.surahHead}>
          {PRACTICE_SURAHS.map(s => (
            <button key={s.n} type="button" className="ui-chip" aria-pressed={surah === s.n} onClick={() => setSurah(s.n)}>
              {pick(s.name, lang)}
            </button>
          ))}
        </div>
        <ol className="ac-ayahs" key={surah}>
          {ayahs.map((a, i) => {
            const key = `ayah-${a.ref}`
            const n = a.ref.split(':')[1]
            return (
              <li key={a.ref} className="ui-card ac-ayah" style={{ '--i': i }}>
                <div className="ac-ayah__head">
                  <span className="ac-ayah__num ui-num" aria-label={t.ayah(n)}>{n}</span>
                  <AudioButton playing={audio.playing === key} label={t.listenAyah} stopLabel={t.stop}
                    onClick={() => audio.play(key, ayahUrls(a))} />
                </div>
                <div className="ac-ayah__words" lang="ar" dir="rtl">
                  {a.words.map(([w, tl], j) => (
                    <WordChip key={`${a.ref}-${j}`} w={w} tl={tl} id={`ac-tl-${a.ref}-${j}`} always={showAll} />
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
        <a className="ui-link" href={surahHref}
          onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigate(surahHref) } }}>
          {t.openSurah} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
        </a>
      </section>
    </div>
  )
}
