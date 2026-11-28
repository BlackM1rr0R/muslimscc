// ═══════════════════════════════════════════════════════
// Dua küpü — şüşə küp (SVG), içində parlayan kağız kağızçıqlar (canlı varlıq yoxdur).
// • Küpə toxunuş / Enter / Boşluq → bir kağız uçub çıxır və açılır: təsadüfi daxil edilmiş dua,
//   ardıcıl iki dəfə eyni olmur (rabbanaJar.pickNext).
// • Silkələmə (isteğe bağlı): yalnız toxunma ekranında, DeviceMotionEvent varsa; iOS-da icazə
//   düyməyə basanda (istifadəçi jesti) istənir. Yaddaşda saxlanmır.
// • Azaldılmış hərəkət: uçuş yoxdur, kağız sadəcə solğun görünür (opacity).
// • Prerender = ilk render: kağız yoxdur, silkələmə düyməsi mount-dan sonra yoxlanır.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Icon from '../Icon'
import AyahAudio from '../AyahAudio'
import { haptic } from '../../hooks/useHaptic'
import { useReduced } from '../../motion/reduced'
import { pickNext, isShake, refLabel, splitAyah } from './rabbanaJar'

// Küpdəki kağızçıqlar: x, y, fırlanma (sabit — prerender ilə eyni)
const SLIPS = [
  [62, 150, -18], [92, 160, 12], [122, 148, -6], [76, 124, 24], [108, 128, -22],
  [90, 104, 8], [128, 112, 16], [60, 100, -10], [104, 84, -14],
]

function JarSvg({ uid }) {
  return (
    <svg viewBox="0 0 180 210" className="rbn-jar__svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" className="rbn-glass-s1" />
          <stop offset=".45" className="rbn-glass-s2" />
          <stop offset="1" className="rbn-glass-s1" />
        </linearGradient>
        <radialGradient id={`${uid}l`} cx=".5" cy=".62" r=".5">
          <stop offset="0" className="rbn-light-s1" />
          <stop offset="1" className="rbn-light-s2" />
        </radialGradient>
        <clipPath id={`${uid}c`}>
          <path d="M58 46h64v10c0 6 8 10 16 18 9 9 14 22 14 40v52c0 18-12 30-30 30H58c-18 0-30-12-30-30v-52c0-18 5-31 14-40 8-8 16-12 16-18z" />
        </clipPath>
      </defs>
      {/* İşıq — kağızlardan gələn yumşaq parıltı */}
      <ellipse cx="90" cy="132" rx="70" ry="68" fill={`url(#${uid}l)`} className="rbn-jar__halo" />
      <g clipPath={`url(#${uid}c)`}>
        <rect x="20" y="40" width="140" height="170" fill={`url(#${uid}g)`} className="rbn-jar__fill" />
        {SLIPS.map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} className="rbn-jar__slip" style={{ '--d': `${(i % 5) * 0.6}s` }}>
            <rect x="-15" y="-9" width="30" height="18" rx="2.5" />
            <path d="M-15 0h30" className="rbn-jar__fold" />
          </g>
        ))}
      </g>
      {/* Şüşə: kontur, parıltı xətti, boğaz və tıxac */}
      <path d="M58 46h64v10c0 6 8 10 16 18 9 9 14 22 14 40v52c0 18-12 30-30 30H58c-18 0-30-12-30-30v-52c0-18 5-31 14-40 8-8 16-12 16-18z" className="rbn-jar__glass" />
      <path d="M44 100c-3 10-4 20-4 32v26" className="rbn-jar__shine" />
      <path d="M134 92c4 6 6 13 7 20" className="rbn-jar__shine rbn-jar__shine--thin" />
      <rect x="52" y="34" width="76" height="14" rx="5" className="rbn-jar__rim" />
      <path d="M60 34c0-10 6-16 30-16s30 6 30 16z" className="rbn-jar__cork" />
      <path d="M70 26h40M66 31h48" className="rbn-jar__cork-line" />
    </svg>
  )
}

export default function DuaJar({ items, t, lang, tr, hrefFor, onOpen }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const reduced = useReduced()
  const [idx, setIdx] = useState(-1)
  const [seq, setSeq] = useState(0)
  const [status, setStatus] = useState('')
  const [canShake, setCanShake] = useState(false)
  const [shake, setShake] = useState(false)
  const lastRef = useRef(-1)

  const draw = useCallback(() => {
    const i = pickNext(items.length, lastRef.current)
    if (i < 0) return
    lastRef.current = i
    haptic(12)
    setIdx(i)
    setSeq(s => s + 1)
    setStatus(t.drawn(refLabel(items[i], lang)))
  }, [items, t, lang])
  const drawRef = useRef(draw)
  useEffect(() => { drawRef.current = draw }, [draw])

  // Silkələmə dəstəyi — yalnız klientdə (toxunma ekranı + DeviceMotionEvent)
  useEffect(() => {
    try {
      setCanShake(typeof window.DeviceMotionEvent !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
    } catch { setCanShake(false) }
  }, [])

  useEffect(() => {
    if (!shake) return undefined
    let prev = null, last = 0
    const on = (e) => {
      const g = e.accelerationIncludingGravity
      if (!g) return
      const cur = { x: g.x, y: g.y, z: g.z }
      const now = Date.now()
      if (isShake(prev, cur) && now - last > 1200) { last = now; drawRef.current() }
      prev = cur
    }
    window.addEventListener('devicemotion', on)
    return () => window.removeEventListener('devicemotion', on)
  }, [shake])

  const toggleShake = async () => {
    if (shake) { setShake(false); return }
    const DM = window.DeviceMotionEvent
    // iOS 13+: icazə yalnız istifadəçi jestinin içində istənə bilər
    if (DM && typeof DM.requestPermission === 'function') {
      try {
        if ((await DM.requestPermission()) !== 'granted') { setStatus(t.shakeDenied); return }
      } catch { setStatus(t.shakeDenied); return }
    }
    setShake(true)
  }

  const it = idx >= 0 ? items[idx] : null
  const parts = it ? splitAyah(it) : null
  const label = it ? refLabel(it, lang) : ''
  const href = it ? hrefFor(it) : ''
  const trText = it && lang !== 'ar' ? tr?.tr?.[it.ref] : ''

  return (
    <section className="ui-card rbn-jarbox" aria-labelledby="rbn-jar-h" data-testid="rbn-jarbox">
      <div className="rbn-jarbox__left">
        <h2 id="rbn-jar-h" className="ui-title ui-title--sm rbn-jarbox__h">{t.jarTitle}</h2>
        <div className="rbn-stage">
          <button type="button" className="rbn-jar" onClick={draw} aria-label={t.jarBtn} aria-describedby="rbn-jar-hint"
            data-testid="rbn-jar">
            <JarSvg uid={uid} />
          </button>
          {it && !reduced && <span key={seq} className="rbn-fly" aria-hidden="true" />}
        </div>
        <p id="rbn-jar-hint" className="rbn-hint">{t.jarHint}</p>
        {canShake && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm rbn-shake" aria-pressed={shake} onClick={toggleShake}
            data-testid="rbn-shake">
            <Icon name="refresh" size={16} /> {shake ? t.shakeOn : t.shakeOff}
          </button>
        )}
        <p className="ui-sr-only" role="status" aria-live="polite" data-testid="rbn-status">{status}</p>
      </div>
      <div className="rbn-jarbox__right">
        {it ? (
          <>
            <article key={seq} className={`rbn-slip${reduced ? ' is-fade' : ''}`} data-testid="rbn-slip" data-ref={it.ref}
              aria-label={label}>
              <p className="ui-arabic rbn-slip__ar" lang="ar" dir="rtl">{parts.span}</p>
              {trText ? <p className="rbn-slip__tr">{trText}</p> : null}
              <div className="rbn-slip__foot">
                <a href={href} onClick={(e) => onOpen(e, href)} className="rbn-ref" data-testid="rbn-slip-ref"><bdi>{label}</bdi></a>
                <AyahAudio s={it.s} a={it.a} />
              </div>
            </article>
            <button type="button" className="ui-btn ui-btn--primary rbn-another" onClick={draw} data-testid="rbn-another">
              <Icon name="refresh" size={18} /> {t.another}
            </button>
          </>
        ) : (
          <div className="rbn-slip rbn-slip--empty" aria-hidden="true">
            <Icon name="duas" size={28} />
          </div>
        )}
      </div>
    </section>
  )
}
