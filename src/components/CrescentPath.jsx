// ═══════════════════════════════════════════════════════
// CrescentPath — Ramazanın 30 günlük hilal yolu (/ramadan) — yalnız bu cihazda
//
//   <CrescentPath lang="az" today={12} year={1448} />
//
// • 30 ay qövs üzərində: hər günün ayı həmin gecənin fazasıdır (hilal → bədr → hilal).
// • Toxunuş dövrü: boş → oruc tutuldu (qızıl) → üzrlü / qəza (solğun, qırıq) → boş.
// • Son on gecə qeyd olunur; tək gecələr (21, 23, 25, 27, 29) — Qədr gecəsi
//   ümidi ilə ulduz (Buxari 2017: "Qədr gecəsini son on gecənin təklərində axtarın").
// • Yaddaş: localStorage 'muslim_cc_ramadan_fasts_v1' → { [hicri il]: { [gün]: 1|2 } }
// • Animasiya bir dəfəlik (transform/opacity). Stillər: src/styles/CrescentPath.css
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { haptic } from '../hooks/useHaptic'
import { moonOf, litPath } from '../utils/crescent'
import '../styles/CrescentPath.css'

export const FASTS_KEY = 'muslim_cc_ramadan_fasts_v1'
const T = {
  az: { title: 'Hilal yolu', lead: 'Hər gün bir aydır. Tutduğunuz orucu qeyd etmək üçün aya toxunun; ikinci toxunuş — üzrlü gün (qəzası qalır).', fasted: 'oruc', excused: 'üzrlü', left: 'qalan', qadr: 'Qədr gecəsi ümidi — son on gecənin təkləri', day: (n) => `${n}-ci gün`, today: 'bu gün', st: { 0: 'qeyd yoxdur', 1: 'oruc tutuldu', 2: 'üzrlü — qəzası qalır' } },
  en: { title: 'The crescent path', lead: 'Each day is a moon. Tap a moon to record the fast; tap again for an excused day (to be made up).', fasted: 'fasted', excused: 'excused', left: 'left', qadr: 'Hoped-for Laylat al-Qadr — the odd nights of the last ten', day: (n) => `Day ${n}`, today: 'today', st: { 0: 'not recorded', 1: 'fasted', 2: 'excused — to be made up' } },
  ru: { title: 'Путь полумесяца', lead: 'Каждый день — луна. Коснитесь луны, чтобы отметить пост; повторное касание — день освобождения (возместить позже).', fasted: 'пост', excused: 'освобождение', left: 'осталось', qadr: 'Надежда на Ночь предопределения — нечётные из последних десяти', day: (n) => `День ${n}`, today: 'сегодня', st: { 0: 'не отмечено', 1: 'пост соблюдён', 2: 'освобождение — нужно возместить' } },
  tr: { title: 'Hilal yolu', lead: 'Her gün bir aydır. Tuttuğunuz orucu işaretlemek için aya dokunun; ikinci dokunuş — mazeretli gün (kazası kalır).', fasted: 'oruç', excused: 'mazeretli', left: 'kalan', qadr: 'Kadir gecesi ümidi — son on gecenin tekleri', day: (n) => `${n}. gün`, today: 'bugün', st: { 0: 'işaret yok', 1: 'oruç tutuldu', 2: 'mazeretli — kazası kalır' } },
  ar: { title: 'طريق الهلال', lead: 'كل يوم قمر. المس القمر لتسجيل الصيام، ولمسة ثانية ليوم العذر (يُقضى لاحقًا).', fasted: 'صيام', excused: 'عذر', left: 'متبقٍّ', qadr: 'رجاء ليلة القدر — أوتار العشر الأواخر', day: (n) => `اليوم ${n}`, today: 'اليوم', st: { 0: 'لم يُسجَّل', 1: 'صام', 2: 'عذر — يُقضى' } },
}
const QADR = new Set([21, 23, 25, 27, 29])

function load(year) {
  try { const v = JSON.parse(localStorage.getItem(FASTS_KEY))?.[year]; return v && typeof v === 'object' ? v : {} } catch { return {} }
}
function save(year, days) {
  try {
    const all = JSON.parse(localStorage.getItem(FASTS_KEY) || '{}') || {}
    all[year] = days
    localStorage.setItem(FASTS_KEY, JSON.stringify(all))
  } catch { /* yaddaş bağlıdır */ }
}

export default function CrescentPath({ lang = 'az', today = null, year = 'x' }) {
  const t = T[lang] || T.az
  const [days, setDays] = useState(() => (typeof window === 'undefined' ? {} : load(year)))
  const cycle = (n) => {
    const next = { ...days }
    const v = ((days[n] || 0) + 1) % 3
    if (v) next[n] = v; else delete next[n]
    setDays(next); save(year, next)
    haptic(v === 1 ? 12 : 6)
  }
  const fasted = Object.values(days).filter(v => v === 1).length
  const excused = Object.values(days).filter(v => v === 2).length

  // Qövs: 30 nöqtə, iki sıra (1–15 yuxarı qövs, 16–30 aşağı qövs) — telefonda da sığır
  const pos = (n) => {
    const row = n <= 15 ? 0 : 1, i = (n - 1) % 15
    const x = 6 + (i / 14) * 88
    const y = row ? 74 - Math.sin((i / 14) * Math.PI) * 12 : 30 - Math.sin((i / 14) * Math.PI) * 14
    return { x, y }
  }

  return (
    <section className="ui-card cp" aria-labelledby="cp-title" data-testid="crescent-path" data-reveal="fade">
      <div className="cp__head">
        <h2 id="cp-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="cp__lead">{t.lead}</p>
      </div>
      <div className="cp__sky">
        <ol className="cp__moons">
          {Array.from({ length: 30 }, (_, k) => {
            const n = k + 1, v = days[n] || 0, m = moonOf(n), p = pos(n)
            const last10 = n >= 21
            return (
              <li key={n} style={{ left: `${p.x}%`, top: `${p.y}%`, '--i': k }}>
                <button type="button" className={`cp__moon cp__moon--${v}${today === n ? ' is-today' : ''}${last10 ? ' is-last10' : ''}`}
                  aria-label={`${t.day(n)}${today === n ? ` (${t.today})` : ''}: ${t.st[v]}${QADR.has(n) ? ` · ${t.qadr}` : ''}`}
                  aria-pressed={v === 1} onClick={() => cycle(n)}>
                  <svg viewBox="-12 -12 24 24" aria-hidden="true">
                    <circle r="10" className="cp__disc" />
                    <path d={litPath(10, m.lit, m.waxing)} className="cp__lit" />
                    {QADR.has(n) && <path className="cp__star" d="M9,-13 l1.2,2.6 2.8,.3 -2.1,1.9 .6,2.8 -2.5,-1.4 -2.5,1.4 .6,-2.8 -2.1,-1.9 2.8,-.3z" />}
                  </svg>
                  <span className="cp__n ui-num">{n}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      <ul className="cp__stats">
        <li><i className="cp__sw cp__sw--1" /> {t.fasted} <b className="ui-num" data-testid="cp-fasted">{fasted}</b></li>
        <li><i className="cp__sw cp__sw--2" /> {t.excused} <b className="ui-num">{excused}</b></li>
        <li>{t.left} <b className="ui-num">{Math.max(0, 30 - fasted - excused)}</b></li>
        <li className="cp__qadr"><i className="cp__sw cp__sw--q" /> {t.qadr}</li>
      </ul>
    </section>
  )
}
