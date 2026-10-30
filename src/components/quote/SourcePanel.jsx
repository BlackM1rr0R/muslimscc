// ═══════════════════════════════════════════════════════
// "Mətn" bölməsi — kartın məzmunu haradan gəlir:
//   Sitatlar (quotes.js + admin) · Ayə (surə:ayə, API) · Hədis (baza) · Öz mətnim
// Bütün vəziyyət səhifədədir (QuoteGeneratorPage) — burada yalnız idarələr.
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import Icon from '../Icon'
import { POPULAR_AYAHS } from './content'
import { getSurahLocal } from '../../data/surahNamesAz'
import { localizeSource } from '../../utils/sourceNames'

const SOURCES = ['library', 'ayah', 'hadith', 'custom']
const SRC_LABEL = { library: 'srcLibrary', ayah: 'srcAyah', hadith: 'srcHadith', custom: 'srcCustom' }
const CATEGORIES = ['all', 'quran', 'hadith', 'dua', 'wisdom']
const PAGE = 12

const norm = (s) => String(s || '').toLocaleLowerCase().normalize('NFKD').replace(/[̀-ًͯ-ٰٟ]/g, '')

export default function SourcePanel({
  t, lang, source, onSource,
  category, onCategory, onShuffle, onStep, libraryPos,
  ayahForm, onAyahForm, onAyahSubmit, ayahState,
  hadiths, hadithId, onHadith, onRandomHadith,
  custom, onCustom,
}) {
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)

  const results = useMemo(() => {
    if (!hadiths) return []
    const n = norm(q.trim())
    const list = n
      ? hadiths.filter(h => norm(h.text).includes(n) || norm(h.source).includes(n) || norm(localizeSource(h.source, lang)).includes(n) || norm(h.ar).includes(n))
      : hadiths
    return list
  }, [hadiths, q, lang])

  const surahName = getSurahLocal(Number(ayahForm.s), lang)?.name || ''

  return (
    <div className="qg-source">
      <div className="m-seg qg-seg" role="group" aria-label={t.srcLabel}>
        {SOURCES.map(s => (
          <button key={s} type="button" className="m-seg-btn" aria-pressed={source === s} onClick={() => onSource(s)}>
            {t[SRC_LABEL[s]]}
          </button>
        ))}
      </div>

      {source === 'library' && (
        <div className="qg-sub">
          <div className="qg-chips chip-scroll wrap-desktop" role="group" aria-label={t.category}>
            {CATEGORIES.map(cat => (
              <button key={cat} type="button" className="ui-chip" aria-pressed={category === cat} onClick={() => onCategory(cat)}>
                {t[cat]}
              </button>
            ))}
          </div>
          <div className="qg-stepper">
            <button type="button" className="ui-icon-btn qg-step" aria-label={t.prev} title={t.prev} onClick={() => onStep(-1)}>
              <Icon name="chevronLeft" className="ui-flip-rtl" />
            </button>
            <button type="button" className="ui-btn ui-btn--secondary qg-shuffle" onClick={onShuffle}>
              <Icon name="sparkle" className="ui-btn__icon" /> {t.generate}
            </button>
            <button type="button" className="ui-icon-btn qg-step" aria-label={t.next} title={t.next} onClick={() => onStep(1)}>
              <Icon name="chevron" className="ui-flip-rtl" />
            </button>
            <span className="qg-pos ui-num" aria-live="polite">{libraryPos}</span>
          </div>
        </div>
      )}

      {source === 'ayah' && (
        <form className="qg-sub" onSubmit={(e) => { e.preventDefault(); onAyahSubmit() }}>
          <div className="qg-ayah-row">
            <label className="ui-field qg-num-field">
              <span className="ui-field__label">{t.surah}</span>
              <input
                className="ui-input" type="number" inputMode="numeric" min="1" max="114" required
                value={ayahForm.s} onChange={e => onAyahForm({ ...ayahForm, s: e.target.value })}
                aria-describedby="qg-surah-name"
              />
            </label>
            <span className="qg-ayah-colon" aria-hidden="true">:</span>
            <label className="ui-field qg-num-field">
              <span className="ui-field__label">{t.ayahNo}</span>
              <input
                className="ui-input" type="number" inputMode="numeric" min="1" max="286" required
                value={ayahForm.a} onChange={e => onAyahForm({ ...ayahForm, a: e.target.value })}
              />
            </label>
            <button type="submit" className="ui-btn ui-btn--primary qg-ayah-go" disabled={ayahState.status === 'loading'}>
              {ayahState.status === 'loading' ? <span className="ui-spin" aria-hidden="true" /> : <Icon name="search" className="ui-btn__icon" />}
              {t.showAyah}
            </button>
          </div>
          <p className="qg-hint" id="qg-surah-name">{surahName ? <strong>{surahName}</strong> : null}{surahName ? ' · ' : ''}{t.ayahHint}</p>
          {ayahState.status === 'error' && <p className="qg-error" role="alert">{t.ayahError}</p>}
          <div className="qg-quick">
            <span className="qg-label">{t.popular}</span>
            <div className="qg-chips chip-scroll wrap-desktop">
              {POPULAR_AYAHS.map(ref => {
                const [s, a] = ref.split(':')
                const on = ayahState.ref === ref
                return (
                  <button key={ref} type="button" className="ui-chip ui-num" aria-pressed={on} onClick={() => onAyahSubmit({ s, a })}>
                    {ref}
                  </button>
                )
              })}
            </div>
          </div>
        </form>
      )}

      {source === 'hadith' && (
        <div className="qg-sub">
          <div className="qg-hsearch">
            <label className="ui-field qg-grow">
              <span className="ui-field__label">{t.hadithSearch}</span>
              <input className="ui-input" type="search" value={q} placeholder={t.hadithPh} onChange={e => { setQ(e.target.value); setLimit(PAGE) }} />
            </label>
            <button type="button" className="ui-btn ui-btn--secondary qg-hrandom" onClick={onRandomHadith} disabled={!hadiths}>
              <Icon name="sparkle" className="ui-btn__icon" /> {t.randomHadith}
            </button>
          </div>
          {!hadiths && <p className="qg-hint" role="status">{t.hadithLoading}</p>}
          {hadiths && results.length === 0 && <p className="qg-hint">{t.noResults}</p>}
          {hadiths && results.length > 0 && (
            <ul className="qg-hlist">
              {results.slice(0, limit).map(h => (
                <li key={h.id}>
                  <button type="button" className="qg-hitem" aria-pressed={hadithId === h.id} onClick={() => onHadith(h)}>
                    <span className="qg-hitem__text">{lang === 'ar' ? h.ar : h.text}</span>
                    <span className="qg-hitem__src"><bdi>{localizeSource(h.source, lang)}</bdi></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {hadiths && results.length > limit && (
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm qg-more" onClick={() => setLimit(l => l + PAGE)}>{t.more}</button>
          )}
        </div>
      )}

      {source === 'custom' && (
        <div className="qg-sub">
          <label className="ui-field">
            <span className="ui-field__label">{t.yourText}</span>
            <textarea
              className="ui-input qg-textarea" rows={4} maxLength={1200} value={custom.text} placeholder={t.textPh}
              dir="auto" onChange={e => onCustom({ ...custom, text: e.target.value })}
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">{t.yourSource}</span>
            <input
              className="ui-input" type="text" maxLength={120} value={custom.src} placeholder={t.sourcePh}
              dir="auto" onChange={e => onCustom({ ...custom, src: e.target.value })}
            />
            <span className="ui-field__hint">{t.sourceHint}</span>
          </label>
        </div>
      )}
    </div>
  )
}
