import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import Icon from './Icon'
import { CHECKIN_TEXT, TRACKER_TEXT, PRAYER_NAMES, fill, formatDay } from '../data/prayerTrackerText'
import {
  PRAYERS, isDateKey, toKey, addDays, loadSnapshot, prayerStatus, setPrayerStatus, loadQada, saveQada,
} from '../utils/prayerTracker'
import '../styles/PrayerCheckinCard.css'

// ═══════════════════════════════════════════════════════
// "Qıldınızmı?" kartı — /prayer?checkin=dhuhr&d=YYYY-MM-DD
//
// Push bildirişinə adi toxunuş (iOS-da düymə yoxdur; Android/masaüstündə
// düyməsiz klik) bu ünvanı açır. Kart cavabı cihazdakı izləyiciyə yazır
// (utils/prayerTracker.js) və parametrləri ünvandan silir — yeniləmədə
// təkrar görünməsin. Yalnız son 7 gün qəbul olunur.
// ═══════════════════════════════════════════════════════

function readParams() {
  try {
    const url = new URL(window.location.href)
    const prayer = url.searchParams.get('checkin')
    if (!PRAYERS.includes(prayer)) return null
    const today = toKey()
    const d = url.searchParams.get('d')
    const date = isDateKey(d) ? d : today
    if (date > today || date < addDays(today, -7)) return null
    return { prayer, date }
  } catch { return null }
}

function clearParams() {
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('checkin') && !url.searchParams.has('d')) return
    url.searchParams.delete('checkin')
    url.searchParams.delete('d')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  } catch { /* köhnə brauzer */ }
}

export default function PrayerCheckinCard({ trackerHref, onOpenTracker }) {
  const { lang } = useLang()
  const lk = CHECKIN_TEXT[lang] ? lang : 'en'
  const t = CHECKIN_TEXT[lk]
  const [req, setReq] = useState(readParams)
  const [answer, setAnswer] = useState(null)   // 'prayed' | 'missed'
  const [debtAdded, setDebtAdded] = useState(false)

  // Parametrlər oxundu — ünvandan sil (kart açıq qalır)
  useEffect(() => { if (req) clearParams() }, [req])

  // Artıq qeyd varsa — cavab kimi göstər (yenidən soruşmağa ehtiyac yoxdur)
  useEffect(() => {
    if (!req) return
    const cur = prayerStatus(loadSnapshot(), req.date, req.prayer)
    if (cur) setAnswer(cur === 'missed' ? 'missed' : 'prayed')
  }, [req])

  if (!req) return null
  const name = PRAYER_NAMES[lk][req.prayer]
  const isToday = req.date === toKey()

  const respond = (status) => {
    haptic()
    setPrayerStatus(req.date, req.prayer, status)
    setAnswer(status)
  }
  const addDebt = () => {
    const q = loadQada()
    q.prayers[req.prayer].debt += 1
    saveQada(q)
    setDebtAdded(true)
  }

  return (
    <section className="pc-card ui-card" role="region" aria-labelledby="pc-q" data-testid="checkin-card">
      <span className="pc-ic ui-icon-tile" aria-hidden="true"><Icon name="prayer" /></span>
      <div className="pc-body">
        <h2 className="pc-q" id="pc-q">{fill(t.q, { p: name })}</h2>
        {!isToday && <p className="pc-date">{formatDay(req.date, lk, { weekday: true })}</p>}
        {!answer ? (
          <div className="pc-actions">
            <button type="button" className="ui-btn ui-btn--primary" onClick={() => respond('prayed')}>
              <Icon name="check" className="ui-btn__icon" /> {t.yes}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => respond('missed')}>{t.no}</button>
          </div>
        ) : (
          <div className="pc-actions" role="status">
            <span className={`pc-saved${answer === 'prayed' ? ' is-yes' : ''}`}>
              {answer === 'prayed' && <Icon name="check" size={18} strokeWidth={2.2} />}
              {answer === 'prayed' ? t.savedYes : t.savedNo}
            </span>
            {answer === 'missed' && !debtAdded && (
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={addDebt}>{TRACKER_TEXT[lk].addDebt}</button>
            )}
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAnswer(null)}>{t.change}</button>
            {trackerHref && (
              <a className="ui-link pc-link" href={trackerHref}
                onClick={(e) => { if (onOpenTracker && e.button === 0 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onOpenTracker() } }}>
                {t.openTracker} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
              </a>
            )}
          </div>
        )}
      </div>
      <button type="button" className="ui-icon-btn pc-close" aria-label={t.close} onClick={() => setReq(null)}>
        <Icon name="close" size={18} />
      </button>
    </section>
  )
}

