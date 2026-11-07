// ═══════════════════════════════════════════════════════
// "Mənim günüm" — ana səhifədə bu günün ibadətləri bir baxışda (vau3.css §15).
// Məlumat yalnız bu cihazdandır (utils/myDay → localStorage). Dörd kafel:
//   namaz (5 hissəli halqa + namaz ikonları) · zikr (bu gün + 7 günlük xətt)
//   · Quran (ardıcıl günlər, bu gün oxunubmu) · gündəlik əməllər (halqa).
// Hər kafel öz bölməsinə aparır. Başqa tabda dəyişəndə (storage hadisəsi),
// səhifəyə qayıdanda və namaz qeyd ediləndə yenilənir.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { navLabel } from '../../data/navigation'
import { pathFor } from '../../seo/routes'
import { readMyDay } from '../../utils/myDay'
import { PRAYER_SYNC_EVENT } from '../../utils/prayerTracker'
import { PRAYER_NAMES } from '../../hooks/usePrayerTimes'
import { pickUi } from '../../utils/uiText'
import { Sparkline } from '../viz'
import { isPlainClick } from '../PageLink'
import Icon from '../Icon'

const L = {
  az: { ey: 'Bu cihazda', title: 'Mənim günüm', today: 'Bu gün', week: 'Son 7 gün', streak: 'ardıcıl gün', year: 'Mənim ilim', yearDec: 'İlin icmalı hazırdır' },
  en: { ey: 'On this device', title: 'My day', today: 'Today', week: 'Last 7 days', streak: 'day streak', year: 'My year', yearDec: 'Your year in review is ready' },
  ru: { ey: 'На этом устройстве', title: 'Мой день', today: 'Сегодня', week: 'Последние 7 дней', streak: 'дней подряд', year: 'Мой год', yearDec: 'Итоги года готовы' },
  ar: { ey: 'على هذا الجهاز', title: 'يومي', today: 'اليوم', week: 'آخر 7 أيام', streak: 'أيام متتالية', year: 'عامي', yearDec: 'حصاد العام جاهز' },
  tr: { ey: 'Bu cihazda', title: 'Benim günüm', today: 'Bu gün', week: 'Son 7 gün', streak: 'gün seri', year: 'Benim yılım', yearDec: 'Yılın özeti hazır' },
}

const ICON = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }
const KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

/** 5 hissəli halqa: hər namaz bir qövs (arada kiçik boşluq) */
function PrayerRing({ done }) {
  const R = 30, C = 2 * Math.PI * R, seg = C / 5, gap = 5
  return (
    <svg className="vx-md-ring" viewBox="0 0 72 72" aria-hidden="true">
      {KEYS.map((k, i) => (
        <circle key={k} cx="36" cy="36" r={R}
          className={done.includes(k) ? 'is-done' : ''}
          strokeDasharray={`${seg - gap} ${C - seg + gap}`}
          strokeDashoffset={-i * seg}
          transform="rotate(-90 36 36)" />
      ))}
    </svg>
  )
}

/** Gündəlik əməllər halqası (qızılı) */
function DeedRing({ frac }) {
  const R = 30, C = 2 * Math.PI * R
  return (
    <svg className="vx-md-ring vx-md-ring--gold" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r={R} />
      {frac > 0 && <circle cx="36" cy="36" r={R} className="is-done" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 36 36)" />}
    </svg>
  )
}

export default function MyDay({ onNavigate }) {
  const { lang } = useLang()
  const l = pickUi(L, lang)
  const [d, setD] = useState(null)

  useEffect(() => {
    const load = () => setD(readMyDay())
    load()
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    window.addEventListener('storage', load)
    window.addEventListener(PRAYER_SYNC_EVENT, load)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('storage', load)
      window.removeEventListener(PRAYER_SYNC_EVENT, load)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const link = (page) => ({
    href: pathFor(page, lang),
    onClick: (e) => { if (isPlainClick(e)) { e.preventDefault(); onNavigate(page) } },
  })
  const navigate = useNavigate()
  const yearHref = `${pathFor('analytics', lang)}#year-review`
  const dec = new Date().getMonth() === 11
  const pname = (k) => PRAYER_NAMES[k]?.[lang] || PRAYER_NAMES[k]?.en || k

  return (
    <section className="ui-section ui-section--tight vx-md" aria-labelledby="vx-md-ttl">
      <div className="ui-container">
        <div className="ui-section-head ui-section-head--row" data-anim="blur">
          <div>
            <span className="ui-eyebrow"><Icon name="shield" size={14} /> {l.ey}</span>
            <h2 id="vx-md-ttl" className="ui-title">{l.title}</h2>
          </div>
          {/* v5.3: illik icmala keçid (analytics → YearReview); dekabrda önə çıxır */}
          <a className={`vx-md-year${dec ? ' is-dec' : ''}`} href={yearHref}
            onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigate(yearHref) } }} data-testid="md-year">
            <Icon name="sparkle" size={16} /> {dec ? l.yearDec : l.year} <Icon name="arrow" size={14} className="ui-flip-rtl" />
          </a>
        </div>
        {!d ? (
          <div className="vx-md-grid" aria-hidden="true">
            {[0, 1, 2, 3].map(i => <span key={i} className="ui-skeleton" style={{ height: 172, borderRadius: 16 }} />)}
          </div>
        ) : (
          <ul className="vx-md-grid" data-anim-stagger="70" data-anim="rise">
            {/* Namaz */}
            <li>
              <a className="ui-card ui-card--interactive vx-md-card" {...link('tracker')}>
                <span className="vx-md-lbl"><Icon name="prayer" size={16} /> {navLabel('tracker', lang)}</span>
                <div className="vx-md-main">
                  <div className="vx-md-ringwrap">
                    <PrayerRing done={d.prayers.done} />
                    <b className="vx-md-ringnum">{d.prayers.done.length}<small>/{d.prayers.total}</small></b>
                  </div>
                  <ol className="vx-md-prayers">
                    {KEYS.map(k => (
                      <li key={k} className={d.prayers.done.includes(k) ? 'is-done' : ''}>
                        <Icon name={d.prayers.done.includes(k) ? 'check' : ICON[k]} size={14} strokeWidth={2} />
                        <span>{pname(k)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </a>
            </li>
            {/* Zikr */}
            <li>
              <a className="ui-card ui-card--interactive vx-md-card" {...link('dhikr')}>
                <span className="vx-md-lbl"><Icon name="dhikr" size={16} /> {navLabel('dhikr', lang)}</span>
                <div className="vx-md-big"><b className="ui-num">{d.dhikr.today.toLocaleString()}</b><span>{l.today}</span></div>
                <div className="vx-md-spark">
                  <Sparkline values={d.dhikr.week} width={180} height={40} label={`${l.week}: ${d.dhikr.week.join(', ')}`} />
                  <small>{l.week}</small>
                </div>
              </a>
            </li>
            {/* Quran */}
            <li>
              <a className="ui-card ui-card--interactive vx-md-card" {...link('quran')}>
                <span className="vx-md-lbl"><Icon name="quran" size={16} /> {navLabel('quran', lang)}</span>
                <div className="vx-md-big"><b className="ui-num">{d.quran.streak}</b><span>{l.streak}</span></div>
                <span className={`vx-md-today${d.quran.today ? ' is-done' : ''}`}>
                  <Icon name={d.quran.today ? 'check' : 'quran'} size={14} strokeWidth={2} /> {l.today}
                </span>
              </a>
            </li>
            {/* Gündəlik əməllər */}
            <li>
              <a className="ui-card ui-card--interactive vx-md-card" {...link('dailytracker')}>
                <span className="vx-md-lbl"><Icon name="dailytracker" size={16} /> {navLabel('dailytracker', lang)}</span>
                <div className="vx-md-main">
                  <div className="vx-md-ringwrap">
                    <DeedRing frac={d.deeds.total ? d.deeds.done.length / d.deeds.total : 0} />
                    <b className="vx-md-ringnum">{d.deeds.done.length}<small>/{d.deeds.total}</small></b>
                  </div>
                </div>
              </a>
            </li>
          </ul>
        )}
      </div>
    </section>
  )
}
