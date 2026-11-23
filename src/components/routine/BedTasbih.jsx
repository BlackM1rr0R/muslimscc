// ═══════════════════════════════════════════════════════
// Yatarkən təsbih sayğacı — 33 Sübhanəllah, 33 Əlhəmdulillah, 34 Allahu Əkbər
//
// • Saylar Hisnul-Müslimin "Yatarkən deyilən zikrlər" fəslindəndir (Buxari, Muslim) — bəndin
//   özü mənbəyi ilə addımda göstərilir. Zikr adları və ərəbcə mətnləri saytın data/dhikr.js-indəndir.
// • İri toxunma düyməsi; dekor — TasbihBeads (aria-hidden). Ekran oxuyucusu üçün status yalnız
//   mərhələ bitəndə dəyişir (hər toxunuşda danışmır).
// • Say yalnız bu açılışda yaddadır (gizli; heç yerə yazılmır).
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import TasbihBeads from '../TasbihBeads'
import { DHIKRS } from '../../data/dhikr'
import { pickUi } from '../../utils/uiText'
import { haptic } from '../../hooks/useHaptic'
import { tasbihPhase, TASBIH_PHASES, TASBIH_TOTAL } from '../../utils/sleepRoutine'

// Ru: 33 / 34 — «раза»; ümumi forma bütöv ifadə üçün
const ruTimes = (n) => {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return `${n} раз`
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return `${n} раза`
  return `${n} раз`
}
const arTimes = (n) => (n === 1 ? 'مرة واحدة' : n === 2 ? 'مرتين' : n <= 10 ? `${n} مرات` : `${n} مرة`)

const T = {
  az: {
    tap: (name, c, n) => `${name}: ${n} dəfədən ${c}`, phaseDone: (name, n) => `${name} — ${n} dəfə tamamlandı`,
    allDone: 'Təsbih tamamlandı', reset: 'Yenidən say', of: (c, n) => `${c} / ${n}`,
  },
  en: {
    tap: (name, c, n) => `${name}: ${c} of ${n}`, phaseDone: (name, n) => `${name} — ${n} times completed`,
    allDone: 'Tasbih completed', reset: 'Count again', of: (c, n) => `${c} / ${n}`,
  },
  ru: {
    tap: (name, c, n) => `${name}: ${c} из ${n}`, phaseDone: (name, n) => `${name} — ${ruTimes(n)}, выполнено`,
    allDone: 'Тасбих завершён', reset: 'Считать заново', of: (c, n) => `${c} / ${n}`,
  },
  ar: {
    tap: (name, c, n) => `${name}: ${c} من ${n}`, phaseDone: (name, n) => `${name} — اكتمل ${arTimes(n)}`,
    allDone: 'اكتمل التسبيح', reset: 'عُدّ من جديد', of: (c, n) => `${c} / ${n}`,
  },
  tr: {
    tap: (name, c, n) => `${name}: ${n} kezden ${c}`, phaseDone: (name, n) => `${name} — ${n} kez tamamlandı`,
    allDone: 'Tesbih tamamlandı', reset: 'Yeniden say', of: (c, n) => `${c} / ${n}`,
  },
}

// data/dhikr.js: 0 — Sübhanəllah, 1 — Əlhəmdulillah, 2 — Allahu Əkbər
const PHASE_DHIKR = [DHIKRS[0], DHIKRS[1], DHIKRS[2]]

export default function BedTasbih({ lang, onComplete }) {
  const t = pickUi(T, lang, 'en')
  const [count, setCount] = useState(0)
  const [said, setSaid] = useState('')
  const ph = tasbihPhase(count)
  const finished = ph.phase >= TASBIH_PHASES.length
  const d = PHASE_DHIKR[Math.min(ph.phase, PHASE_DHIKR.length - 1)]
  const name = d[lang] || d.en

  const tap = () => {
    if (finished) return
    const c = count + 1
    setCount(c)
    const nx = tasbihPhase(c)
    if (nx.phase !== ph.phase) {
      haptic(60)
      setSaid(nx.phase >= TASBIH_PHASES.length ? `${t.phaseDone(name, ph.target)}. ${t.allDone}` : t.phaseDone(name, ph.target))
      if (c >= TASBIH_TOTAL) onComplete?.()
    } else haptic(12)
  }

  return (
    <div className="slr-tasbih" data-testid="slr-tasbih" data-phase={ph.phase}>
      <ol className="slr-tasbih__phases">
        {PHASE_DHIKR.map((x, i) => (
          <li key={i} className={i < ph.phase ? 'is-done' : i === ph.phase ? 'is-on' : ''}>
            <span className="slr-tasbih__ar" lang="ar" dir="rtl">{x.arabic}</span>
            <span className="ui-num">{TASBIH_PHASES[i]}</span>
          </li>
        ))}
      </ol>
      <TasbihBeads count={finished ? ph.target : ph.inPhase} target={ph.target} />
      <button type="button" className={`slr-tasbih__tap${finished ? ' is-done' : ''}`} onClick={tap} disabled={finished}
        aria-label={finished ? t.allDone : t.tap(name, ph.inPhase, ph.target)} data-testid="slr-tasbih-tap">
        {finished ? <Icon name="check" size={44} /> : (
          <>
            <span className="slr-tasbih__name" lang="ar" dir="rtl" aria-hidden="true">{d.arabic}</span>
            {lang !== 'ar' && <span className="slr-tasbih__lat" aria-hidden="true">{name}</span>}
            <span className="slr-tasbih__n ui-num" aria-hidden="true" dir="ltr">{t.of(ph.inPhase, ph.target)}</span>
          </>
        )}
      </button>
      {count > 0 && (
        <button type="button" className="slr-btn slr-btn--ghost slr-btn--sm" onClick={() => { setCount(0); setSaid('') }}>
          <Icon name="refresh" size={16} /> {t.reset}
        </button>
      )}
      <p className="ui-sr-only" role="status" aria-live="polite">{said}</p>
    </div>
  )
}
