// ═══════════════════════════════════════════════════════
// NamesMandala — 99 ad dairəvi kalliqrafiya mandalası (/names)
//
//   <NamesMandala names={NAMES_99} known={[1, 5]} lang="az" meaningOf={fn} onOpen={(n, el) => …} />
//
// • Üç halqa (22 + 33 + 44 ad); adlar radial yazılır (mərkəzdən çölə), sol yarıda
//   180° çevrilir ki, heç biri baş-aşağı oxunmasın.
// • Toxunuş / klik → ad seçilir: mərkəzdən ada qızıl şüa çəkilir, mərkəzdə
//   ərəbcə ad, transliterasiya və məna; ikinci toxunuş və ya "Aç" — adın pəncərəsi.
// • Əzbərlənmiş adlar qızılıdır (NamesPage-in əzbərləmə yaddaşı).
// • Klaviatura: mandala bir fokus nöqtəsidir; ←/→ (↑/↓) — əvvəlki/növbəti,
//   Home/End, Enter — aç. Seçim aria-live ilə elan olunur. Tam siyahı
//   səhifədə ayrıca qalır (bu, vizual giriş yoludur).
// • Animasiya bir dəfəlik: halqalar fırlanaraq açılır (transform/opacity),
//   şüa stroke-dashoffset ilə çəkilir. Stillər: src/styles/NamesMandala.css
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useRef } from 'react'
import { haptic } from '../hooks/useHaptic'
import '../styles/NamesMandala.css'
import { pickUi } from '../utils/uiText'

const T = {
  az: { label: 'Allahın 99 adı — mandala. Oxlarla adı seçin, giriş düyməsi ilə açın.', hint: 'Ada toxunun', open: 'Aç', known: (k) => `${k} / 99 əzbərlənib`, legendKnown: 'əzbərlənib', legendNew: 'öyrənilməyib' },
  en: { label: 'The 99 names of Allah — mandala. Use arrow keys to choose, Enter to open.', hint: 'Tap a name', open: 'Open', known: (k) => `${k} / 99 memorised`, legendKnown: 'memorised', legendNew: 'not yet' },
  ru: { label: '99 имён Аллаха — мандала. Стрелками выберите имя, клавишей ввода — откройте.', hint: 'Коснитесь имени', open: 'Открыть', known: (k) => `${k} / 99 выучено`, legendKnown: 'выучено', legendNew: 'ещё нет' },
  tr: { label: 'Allah’ın 99 ismi — mandala. Okla ismi seçin, Enter ile açın.', hint: 'Bir isme dokunun', open: 'Aç', known: (k) => `${k} / 99 ezberlendi`, legendKnown: 'ezberlendi', legendNew: 'henüz değil' },
  ar: { label: 'أسماء الله الحسنى — دائرة. اختر الاسم بالأسهم واضغط مفتاح الإدخال للفتح.', hint: 'المس اسمًا', open: 'افتح', known: (k) => `${k} / 99 محفوظ`, legendKnown: 'محفوظ', legendNew: 'لم يُحفظ' },
}

const VB = 1000, C = VB / 2
// Halqa: orta radius, şrift ölçüsü, neçə ad (radiusa mütənasib — aralıqlar bərabər)
const RINGS = [{ r: 222, fs: 23, n: 22 }, { r: 332, fs: 25, n: 33 }, { r: 442, fs: 27, n: 44 }]
// Hərəkələr sayılmır — uzun adın şrifti bir az kiçilir ki, qonşu halqaya keçməsin
const letters = (s) => Math.max(1, s.replace(/[ً-ٰٟۖ-ۭ]/g, '').length)
const ROSETTE =Array.from({ length: 16 }, (_, i) => (i * 360) / 16)

export function mandalaLayout(count = 99) {
  return Array.from({ length: count }, (_, i) => {
    let ring = 0, k = i
    while (ring < RINGS.length - 1 && k >= RINGS[ring].n) { k -= RINGS[ring].n; ring++ }
    const per = RINGS[ring].n
    // Hər halqa yarım addım sürüşür — adlar şüa kimi bir xəttə düzülmür
    const deg = -90 + (k + (ring % 2 ? 0.5 : 0)) * (360 / per)
    const a = (deg * Math.PI) / 180
    const { r, fs } = RINGS[ring]
    const norm = ((deg % 360) + 360) % 360
    const flip = norm > 90 && norm < 270
    return { i, ring, deg, r, fs, x: C + r * Math.cos(a), y: C + r * Math.sin(a), rot: flip ? deg + 180 : deg }
  })
}

export default function NamesMandala({ names, known = [], lang = 'az', meaningOf = () => '', onOpen }) {
  const t = pickUi(T, lang)
  const layout = useMemo(() => mandalaLayout(names.length), [names.length])
  const knownSet = useMemo(() => new Set(known), [known])
  const [sel, setSel] = useState(null) // indeks
  const rootRef = useRef(null)

  const cur = sel != null ? names[sel] : null
  const p = sel != null ? layout[sel] : null

  const pick = (i) => {
    if (i === sel && onOpen) { onOpen(names[i].n, rootRef.current); return }
    haptic(8)
    setSel(i)
  }
  const onKey = (e) => {
    const n = names.length
    const rtl = document.documentElement.dir === 'rtl'
    let d = 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = rtl && e.key === 'ArrowRight' ? -1 : 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') d = rtl && e.key === 'ArrowLeft' ? 1 : -1
    else if (e.key === 'Home') { e.preventDefault(); setSel(0); return }
    else if (e.key === 'End') { e.preventDefault(); setSel(n - 1); return }
    else if (e.key === 'Enter' && sel != null && onOpen) { e.preventDefault(); onOpen(names[sel].n, rootRef.current); return }
    if (!d) return
    e.preventDefault()
    setSel(s => (s == null ? (d > 0 ? 0 : n - 1) : (s + d + n) % n))
  }

  return (
    <div className="nm" data-reveal="fade">
      <div className="nm__stage" ref={rootRef} tabIndex={0} role="group" aria-label={t.label} onKeyDown={onKey} data-testid="names-mandala">
        <svg className="nm__svg" viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="nm-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--nm-gold)" stopOpacity=".22" />
              <stop offset="60%" stopColor="var(--nm-gold)" stopOpacity=".05" />
              <stop offset="100%" stopColor="var(--nm-gold)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={C} cy={C} r={490} fill="url(#nm-glow)" />
          {RINGS.map((rg, i) => (
            <circle key={i} className="nm__orbit" cx={C} cy={C} r={rg.r + 55} />
          ))}
          <g className="nm__rosette">
            {ROSETTE.map(d => (
              <rect key={d} x={C - 92} y={C - 92} width={184} height={184} rx={10} transform={`rotate(${d} ${C} ${C})`} />
            ))}
          </g>
          {p && <line key={sel} className="nm__ray" x1={C} y1={C} x2={p.x} y2={p.y} pathLength="1" />}
          {RINGS.map((rg, ri) => (
            <g key={ri} className="nm__ring" style={{ '--d': `${ri * 140}ms`, '--from': `${ri % 2 ? 14 : -14}deg` }}>
              {layout.filter(q => q.ring === ri).map(q => {
                const nm = names[q.i]
                const cls = `nm__name${knownSet.has(nm.n) ? ' is-known' : ''}${sel === q.i ? ' is-sel' : ''}`
                return (
                  <g key={nm.n} transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${q.rot.toFixed(2)})`}>
                    <text className={cls} fontSize={(q.fs * Math.min(1, 6.5 / letters(nm.ar))).toFixed(1)} textAnchor="middle" dominantBaseline="central"
                      onClick={() => pick(q.i)} data-n={nm.n}>{nm.ar}</text>
                  </g>
                )
              })}
            </g>
          ))}
        </svg>

        <div className="nm__center" aria-live="polite">
          {cur ? (
            <div className="nm__card" key={cur.n}>
              <span className="nm__num ui-num">{cur.n}</span>
              <span className="nm__ar ui-arabic" lang="ar" dir="rtl">{cur.ar}</span>
              <span className="nm__tl" dir="ltr">{cur.tr}</span>
              {meaningOf(cur, lang) && <span className="nm__mean">{meaningOf(cur, lang)}</span>}
              {onOpen && (
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm nm__open" tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); onOpen(cur.n, rootRef.current) }}>{t.open}</button>
              )}
            </div>
          ) : (
            <div className="nm__card nm__card--idle">
              <span className="nm__allah ui-arabic" lang="ar" dir="rtl">ٱللَّه</span>
              <span className="nm__hint">{t.hint}</span>
            </div>
          )}
        </div>
      </div>
      <div className="nm__legend">
        <span><i className="nm__dot nm__dot--known" /> {t.legendKnown}</span>
        <span><i className="nm__dot" /> {t.legendNew}</span>
        <span className="ui-num">{t.known(knownSet.size)}</span>
      </div>
    </div>
  )
}
