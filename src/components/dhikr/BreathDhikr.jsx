// ═══════════════════════════════════════════════════════
// BreathDhikr — nəfəsli zikr: dairə genişlənir (nəfəs al), daralır (nəfəs ver,
// zikri de). Hər nəfəs bir sayılır — tələsmədən, düşünərək zikr üçün.
//
// • Temp: yavaş 5+5 / orta 4+4 / tez 3+3 saniyə. Hədəf zikrin öz hədəfidir (33/100).
// • Dairə yalnız transform: scale ilə (GPU — DESIGN.md §7.3). "Hərəkəti azalt"da
//   dairə hərəkətsizdir, mərhələ mətn ilə göstərilir; say yenə işləyir.
// • Say yaddaşa yazılmır (seans) — sərbəst sayğac üçün digər rejimlər var.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { DHIKRS } from '../../data/dhikr'
import { haptic } from '../../hooks/useHaptic'
import Icon from '../Icon'
import '../../styles/BreathDhikr.css'
import { playSound } from '../../utils/uiSound'

const TXT = {
  title: { az: 'Nəfəsli zikr', en: 'Breathing dhikr', ru: 'Зикр с дыханием', ar: 'الذكر مع التنفس', tr: 'Nefesli zikir' },
  lead: { az: 'Dairə böyüyəndə yavaşca nəfəs alın, kiçiləndə nəfəs verərək zikri deyin. Hər nəfəs bir sayılır — tələsmədən, mənasını düşünərək.', en: 'Breathe in slowly as the circle grows, and say the dhikr as you breathe out while it shrinks. Each breath counts once — unhurried, reflecting on its meaning.', ru: 'Медленно вдыхайте, когда круг растёт, и произносите зикр на выдохе, когда он сжимается. Каждый вдох-выдох — один счёт, без спешки, с размышлением о смысле.', ar: 'تنفّس ببطء حين تكبر الدائرة، وقل الذكر مع الزفير حين تصغر. كل نفَس يُعدّ مرة — بلا عجلة، مع تدبّر المعنى.', tr: 'Daire büyürken yavaşça nefes alın, küçülürken nefes vererek zikri söyleyin. Her nefes bir sayılır — acele etmeden, anlamını düşünerek.' },
  inhale: { az: 'Nəfəs alın', en: 'Breathe in', ru: 'Вдох', ar: 'شهيق', tr: 'Nefes alın' },
  exhale: { az: 'Nəfəs verin — deyin', en: 'Breathe out — say', ru: 'Выдох — произнесите', ar: 'زفير — قل', tr: 'Nefes verin — söyleyin' },
  start: { az: 'Başla', en: 'Start', ru: 'Начать', ar: 'ابدأ', tr: 'Başla' },
  pause: { az: 'Dayandır', en: 'Pause', ru: 'Пауза', ar: 'إيقاف مؤقت', tr: 'Duraklat' },
  reset: { az: 'Sıfırla', en: 'Reset', ru: 'Сбросить', ar: 'إعادة', tr: 'Sıfırla' },
  done: { az: 'Tamamlandı — Allah qəbul etsin', en: 'Complete — may Allah accept it', ru: 'Завершено — да примет Аллах', ar: 'اكتمل — تقبّل الله', tr: 'Tamamlandı — Allah kabul etsin' },
  tempo: { az: 'Temp', en: 'Pace', ru: 'Темп', ar: 'الإيقاع', tr: 'Tempo' },
  slow: { az: 'Yavaş', en: 'Slow', ru: 'Медленно', ar: 'بطيء', tr: 'Yavaş' },
  mid: { az: 'Orta', en: 'Medium', ru: 'Средне', ar: 'متوسط', tr: 'Orta' },
  fast: { az: 'Tez', en: 'Fast', ru: 'Быстро', ar: 'سريع', tr: 'Hızlı' },
  pick: { az: 'Zikr', en: 'Dhikr', ru: 'Зикр', ar: 'الذكر', tr: 'Zikir' },
}
const tx = (o, lang) => o[lang] || o.en
const TEMPOS = [['slow', 5000], ['mid', 4000], ['fast', 3000]]
const CHOICES = DHIKRS.slice(0, 6)

const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion') } catch { return true }
}

export default function BreathDhikr({ lang = 'az' }) {
  const [idx, setIdx] = useState(0)
  const [tempo, setTempo] = useState(4000)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState('rest')     // 'rest' | 'in' | 'out'
  const [count, setCount] = useState(0)
  const timer = useRef(0)
  const d = CHOICES[idx]
  const target = d.target
  const done = count >= target

  useEffect(() => {
    if (!running) return undefined
    // nəfəs al → nəfəs ver (+1) → ...
    const step = (next) => {
      setPhase(next)
      timer.current = setTimeout(() => {
        if (next === 'in') step('out')
        else {
          setCount(c => {
            const n = c + 1
            haptic(n >= target ? 40 : 10)
            playSound(n >= target ? 'done' : 'bead')
            if (n >= target) { setRunning(false); setPhase('rest') }
            return n
          })
          step('in')
        }
      }, tempo)
    }
    step('in')
    return () => clearTimeout(timer.current)
  }, [running, tempo, target])

  // Hədəfə çatanda növbəti dövrəyə keçmə — say dayanır
  useEffect(() => { if (done) clearTimeout(timer.current) }, [done])

  const toggle = () => {
    if (done) { setCount(0); setRunning(true); return }
    setRunning(r => !r)
    if (running) setPhase('rest')
  }
  const reset = () => { setRunning(false); setPhase('rest'); setCount(0) }
  const choose = (i) => { setIdx(i); reset() }

  const C = 2 * Math.PI * 92
  const still = reducedMotion()
  return (
    <div className="ui-card dk-mode-card bd" data-testid="breath-dhikr">
      <div className="dk-mode-head">
        <h2 className="dk-mode-title">{tx(TXT.title, lang)}</h2>
        <p className="dk-mode-lead">{tx(TXT.lead, lang)}</p>
      </div>

      <div className="bd-pick" role="group" aria-label={tx(TXT.pick, lang)}>
        {CHOICES.map((c, i) => (
          <button key={i} type="button" className="ui-chip" aria-pressed={idx === i} onClick={() => choose(i)}>
            <span lang="ar" dir="rtl" className="bd-pick__ar">{c.arabic}</span>
            {lang !== 'ar' && <span className="bd-pick__name">{c[lang] || c.en}</span>}
          </button>
        ))}
      </div>

      <div className={`bd-stage is-${phase}${still ? ' is-still' : ''}${done ? ' is-done' : ''}`} style={{ '--bd-ms': `${tempo}ms` }}>
        <svg className="bd-ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="92" className="bd-ring__track" />
          <circle cx="100" cy="100" r="92" className="bd-ring__bar" transform="rotate(-90 100 100)"
            strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, count / target))} />
        </svg>
        <div className="bd-orb" aria-hidden="true" />
        <div className="bd-center">
          <span className="bd-ar" lang="ar" dir="rtl">{d.arabic}</span>
          <span className="bd-phase" role="status" aria-live="polite">
            {done ? tx(TXT.done, lang) : phase === 'in' ? tx(TXT.inhale, lang) : phase === 'out' ? `${tx(TXT.exhale, lang)}` : ''}
          </span>
          <span className="bd-count ui-num" data-testid="breath-count">{count}<span className="bd-of"> / {target}</span></span>
        </div>
      </div>

      <div className="bd-controls">
        <button type="button" className="ui-btn ui-btn--primary" onClick={toggle} data-testid="breath-toggle">
          <Icon name={running ? 'pause' : 'play'} className="ui-btn__icon" />{running ? tx(TXT.pause, lang) : tx(TXT.start, lang)}
        </button>
        <button type="button" className="ui-btn ui-btn--secondary" onClick={reset} disabled={!count && !running}>
          <Icon name="refresh" className="ui-btn__icon" />{tx(TXT.reset, lang)}
        </button>
        <div className="ui-segmented bd-tempo" role="group" aria-label={tx(TXT.tempo, lang)}>
          {TEMPOS.map(([k, ms]) => (
            <button key={k} type="button" aria-pressed={tempo === ms} onClick={() => setTempo(ms)}>{tx(TXT[k], lang)}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
