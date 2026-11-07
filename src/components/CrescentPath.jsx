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
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { isPlainClick } from './PageLink'

export const FASTS_KEY = 'muslim_cc_ramadan_fasts_v1'
const T = {
  az: { title: 'Hilal yolu', lead: 'Hər gün bir aydır. Tutduğunuz orucu qeyd etmək üçün aya toxunun; ikinci toxunuş — üzrlü gün (qəzası qalır).', fasted: 'oruc', excused: 'üzrlü', left: 'qalan', qadr: 'Qədr gecəsi ümidi — son on gecənin təkləri', day: (n) => `${n}-ci gün`, today: 'bu gün', st: { 0: 'qeyd yoxdur', 1: 'oruc tutuldu', 2: 'üzrlü — qəzası qalır' }, ey: 'Hilal yolu', title2: 'Ramazan orucu gündəliyi', how: ['Bir dəfə toxunun — oruc tutuldu', 'İkinci dəfə — üzrlü gün (qəzası qalır)', 'Üçüncü dəfə — qeydi silin'], phase: 'Ayın forması həmin gecənin fazasıdır — məlumat deyil.', before: 'Ramazan hələ başlamayıb — günləri Ramazanda qeyd edin.', toQada: 'Üzrlü günlərin qəzasını izləyin' },
  en: { title: 'The crescent path', lead: 'Each day is a moon. Tap a moon to record the fast; tap again for an excused day (to be made up).', fasted: 'fasted', excused: 'excused', left: 'left', qadr: 'Hoped-for Laylat al-Qadr — the odd nights of the last ten', day: (n) => `Day ${n}`, today: 'today', st: { 0: 'not recorded', 1: 'fasted', 2: 'excused — to be made up' }, ey: 'The crescent path', title2: 'Ramadan fast log', how: ['Tap once — fasted', 'Tap again — excused day (to be made up)', 'Tap a third time — clear'], phase: 'The moon’s shape is that night’s phase — not data.', before: 'Ramadan has not started yet — log the days during Ramadan.', toQada: 'Track making up excused days' },
  ru: { title: 'Путь полумесяца', lead: 'Каждый день — луна. Коснитесь луны, чтобы отметить пост; повторное касание — день освобождения (возместить позже).', fasted: 'пост', excused: 'освобождение', left: 'осталось', qadr: 'Надежда на Ночь предопределения — нечётные из последних десяти', day: (n) => `День ${n}`, today: 'сегодня', st: { 0: 'не отмечено', 1: 'пост соблюдён', 2: 'освобождение — нужно возместить' }, ey: 'Путь полумесяца', title2: 'Дневник поста в Рамадан', how: ['Одно касание — пост соблюдён', 'Второе — день освобождения (возместить)', 'Третье — очистить'], phase: 'Форма луны — фаза той ночи, а не данные.', before: 'Рамадан ещё не начался — отмечайте дни во время Рамадана.', toQada: 'Учёт возмещения пропущенных дней' },
  tr: { title: 'Hilal yolu', lead: 'Her gün bir aydır. Tuttuğunuz orucu işaretlemek için aya dokunun; ikinci dokunuş — mazeretli gün (kazası kalır).', fasted: 'oruç', excused: 'mazeretli', left: 'kalan', qadr: 'Kadir gecesi ümidi — son on gecenin tekleri', day: (n) => `${n}. gün`, today: 'bugün', st: { 0: 'işaret yok', 1: 'oruç tutuldu', 2: 'mazeretli — kazası kalır' }, ey: 'Hilal yolu', title2: 'Ramazan oruç günlüğü', how: ['Bir kez dokunun — oruç tutuldu', 'İkinci kez — mazeretli gün (kazası kalır)', 'Üçüncü kez — temizle'], phase: 'Ayın şekli o gecenin evresidir — veri değildir.', before: 'Ramazan henüz başlamadı — günleri Ramazan’da işaretleyin.', toQada: 'Mazeretli günlerin kazasını takip edin' },
  ar: { title: 'طريق الهلال', lead: 'كل يوم قمر. المس القمر لتسجيل الصيام، ولمسة ثانية ليوم العذر (يُقضى لاحقًا).', fasted: 'صيام', excused: 'عذر', left: 'متبقٍّ', qadr: 'رجاء ليلة القدر — أوتار العشر الأواخر', day: (n) => `اليوم ${n}`, today: 'اليوم', st: { 0: 'لم يُسجَّل', 1: 'صام', 2: 'عذر — يُقضى' }, ey: 'طريق الهلال', title2: 'سجل صيام رمضان', how: ['لمسة واحدة — صام', 'لمسة ثانية — يوم عذر (يُقضى)', 'لمسة ثالثة — مسح'], phase: 'شكل القمر هو طوره في تلك الليلة — ليس بيانات.', before: 'لم يبدأ رمضان بعد — سجّل الأيام في رمضان.', toQada: 'تابع قضاء أيام العذر' },
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

export default function CrescentPath({ lang = 'az', today = null, year = 'x', started = true, monthDays = 30, onNavigate }) {
  const t = pickUi(T, lang)
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
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="cp-title" className="ui-title ui-title--sm">{t.title2}</h2>
        {/* Necə işləyir — 3 vəziyyət vizual (rəng tək daşıyıcı deyil: ✓ və qırıq xətt) */}
        <ol className="cp__how" aria-label={t.lead}>
          <li><span className="cp__how-ic cp__how-ic--1" aria-hidden="true">✓</span>{t.how[0]}</li>
          <li><span className="cp__how-ic cp__how-ic--2" aria-hidden="true" />{t.how[1]}</li>
          <li><span className="cp__how-ic cp__how-ic--0" aria-hidden="true" />{t.how[2]}</li>
        </ol>
        {!started && <p className="cp__before" role="note">{t.before}</p>}
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
                  {v === 1 && <span className="cp__tick" aria-hidden="true">✓</span>}
                  <span className="cp__n ui-num">{n}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      <p className="cp__phase">{t.phase}</p>
      {/* Ayın irəliləyişi: tutulan · üzrlü · qalan (ayın uzunluğu 29/30) */}
      <div className="cp__bar" role="img" aria-label={`${t.fasted} ${fasted} · ${t.excused} ${excused} · ${t.left} ${Math.max(0, monthDays - fasted - excused)}`}>
        <i className="cp__bar-1" style={{ width: `${(fasted / monthDays) * 100}%` }} />
        <i className="cp__bar-2" style={{ width: `${(excused / monthDays) * 100}%` }} />
      </div>
      <ul className="cp__stats">
        <li><i className="cp__sw cp__sw--1" /> {t.fasted} <b className="ui-num" data-testid="cp-fasted">{fasted}</b></li>
        <li><i className="cp__sw cp__sw--2" /> {t.excused} <b className="ui-num">{excused}</b></li>
        <li>{t.left} <b className="ui-num">{Math.max(0, monthDays - fasted - excused)}</b></li>
        <li className="cp__qadr"><i className="cp__sw cp__sw--q" /> {t.qadr}</li>
      </ul>
      {excused > 0 && (
        <a className="ui-link cp__toqada" href={pathFor('qada', lang)} onClick={(e) => { if (onNavigate && isPlainClick(e)) { e.preventDefault(); onNavigate('qada') } }}>
          {t.toQada} <span className="ui-link__arrow ui-flip-rtl" aria-hidden="true">→</span>
        </a>
      )}
    </section>
  )
}
