// Ərəb kursu — kiçik ortaq hissələr: səs düyməsi, Quran nümunəsi
import Icon from '../Icon'
import { ui } from './strings.js'
import { ayahUrls } from './useCourseAudio.js'

/**
 * Səs düyməsi. iconOnly — yalnız ikon (aria-label məcburidir).
 * playing — bu düymənin səsi hazırda oxunur (pressed vəziyyəti).
 */
export function AudioButton({ playing, onClick, label, stopLabel, iconOnly = false, variant = 'secondary', className = '' }) {
  const text = playing ? (stopLabel || label) : label
  if (iconOnly) {
    return (
      <button type="button" className={`ui-icon-btn ac-audio-icon ${playing ? 'is-playing' : ''} ${className}`}
        aria-label={text} aria-pressed={playing} onClick={onClick}>
        <Icon name={playing ? 'pause' : 'volume'} size={20} />
      </button>
    )
  }
  return (
    <button type="button" className={`ui-btn ui-btn--${variant} ui-btn--sm ac-audio-btn ${playing ? 'is-playing' : ''} ${className}`}
      aria-pressed={playing} onClick={onClick}>
      <Icon name={playing ? 'pause' : 'volume'} className="ui-btn__icon" />
      <span>{text}</span>
      {playing && <span className="ac-eq" aria-hidden="true"><i /><i /><i /></span>}
    </button>
  )
}

/** Qurandan nümunə söz: ərəbcə, transliterasiya, istinad, ayənin səsi */
export function QuranExample({ item, lang, audio, size = 'md', showTl = true }) {
  const t = ui(lang)
  if (!item) return null
  const key = `ayah-${item.ref}`
  return (
    <div className={`ac-qex ac-qex--${size}`}>
      <p className="ac-qex__ar ui-arabic" lang="ar" dir="rtl">{item.w}</p>
      <div className="ac-qex__meta">
        {showTl && <span className="ac-tl" lang="und-Latn" dir="ltr">{item.tl}</span>}
        <span className="ac-ref"><span>{t.quran}</span> <bdi className="ui-num">{item.ref}</bdi></span>
        <AudioButton iconOnly playing={audio.playing === key} label={`${t.listenAyah} — ${item.ref}`} stopLabel={t.stop}
          onClick={() => audio.play(key, ayahUrls(item))} />
      </div>
    </div>
  )
}
