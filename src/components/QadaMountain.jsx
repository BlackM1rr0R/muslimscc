// ═══════════════════════════════════════════════════════
// QadaMountain — qəza borcu dağ kimi (/qada)
//
//   <QadaMountain done={120} owed={880} lang="az" />
//
// • Dağın ətəyindən zirvəyə ilan kimi cığır: qılınan qəza = keçilmiş yol (qızıl),
//   işıqlı nöqtə — hazırkı yer. Cığırda 10 düşərgə (hər 10%); keçilənlər dolur.
// • Mətn: zirvəyə qalan, növbəti 100-ə qalan (hər 100 namaz bir mərhələ).
// • Canlı varlıq təsviri yoxdur — yalnız dağ, cığır, işıq.
// • Hərəkət: cığır stroke-dashoffset ilə uzanır, nöqtə transform ilə (keçid, sonsuz deyil).
// Stillər: src/styles/QadaMountain.css · Hesab: utils/qadaMountain.js
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { TRAIL, trailPath, pointAt, CAMPS } from '../utils/qadaMountain'
import '../styles/QadaMountain.css'

const T = {
  az: { title: 'Qəza dağı', left: (n) => `Zirvəyə ${n} namaz qalıb`, top: 'Zirvədəsiniz — bütün qəza qılındı. Allah qəbul etsin!', next: (n) => `Növbəti 100-ə: ${n} namaz`, camps: (a, b) => `${a} / ${b} düşərgə keçildi`, label: (p) => `Qəza dağı: yolun ${p}%-i keçilib` },
  en: { title: 'The make-up mountain', left: (n) => `${n} prayers to the summit`, top: 'You reached the summit — every make-up prayer is done. May Allah accept it!', next: (n) => `To the next 100: ${n} prayers`, camps: (a, b) => `${a} / ${b} camps passed`, label: (p) => `Make-up mountain: ${p}% of the way climbed` },
  ru: { title: 'Гора возмещения', left: (n) => `До вершины: ${n} намазов`, top: 'Вы на вершине — все пропущенные намазы восполнены. Да примет Аллах!', next: (n) => `До следующей сотни: ${n}`, camps: (a, b) => `Пройдено стоянок: ${a} / ${b}`, label: (p) => `Гора возмещения: пройдено ${p}% пути` },
  tr: { title: 'Kaza dağı', left: (n) => `Zirveye ${n} namaz kaldı`, top: 'Zirvedesiniz — bütün kazalar kılındı. Allah kabul etsin!', next: (n) => `Sonraki 100’e: ${n} namaz`, camps: (a, b) => `${a} / ${b} konak geçildi`, label: (p) => `Kaza dağı: yolun %${p} kadarı geçildi` },
  ar: { title: 'جبل القضاء', left: (n) => `بقي إلى القمة ${n} صلاة`, top: 'بلغت القمة — قضيت كل الفوائت. تقبّل الله منك!', next: (n) => `إلى المئة التالية: ${n}`, camps: (a, b) => `اجتزت ${a} من ${b} محطات`, label: (p) => `جبل القضاء: قُطع ${p}٪ من الطريق` },
}

const fmtN = (n, lang) => n.toLocaleString(lang === 'ar' ? 'ar-u-nu-latn' : lang)

export default function QadaMountain({ done = 0, owed = 0, lang = 'az' }) {
  const t = T[lang] || T.az
  const total = done + owed
  const p = total > 0 ? done / total : 0
  const d = useMemo(() => trailPath(TRAIL), [])
  const me = pointAt(TRAIL, p)
  const passed = CAMPS.filter(c => c <= p + 1e-9).length
  const toNext = owed > 0 ? (owed % 100 || 100) : 0
  const pct = Math.floor(p * 1000) / 10

  return (
    <figure className="ui-card qm" data-testid="qada-mountain">
      <figcaption className="qm__head">
        <span className="qm__title">{t.title}</span>
        <span className="qm__pct ui-num">{pct}%</span>
      </figcaption>
      <svg className="qm__svg" viewBox="0 0 600 300" role="img" aria-label={t.label(pct)}>
        <defs>
          <linearGradient id="qm-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--qm-sky-1)" />
            <stop offset="1" stopColor="var(--qm-sky-2)" />
          </linearGradient>
          <linearGradient id="qm-rock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--qm-rock-1)" />
            <stop offset="1" stopColor="var(--qm-rock-2)" />
          </linearGradient>
          <radialGradient id="qm-glow"><stop offset="0" stopColor="#ffe7a3" /><stop offset="1" stopColor="#ffe7a3" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="600" height="300" fill="url(#qm-sky)" />
        <path className="qm__far" d="M0,300 L70,190 L140,235 L230,120 L300,200 L420,95 L520,180 L600,140 L600,300 Z" />
        <path d="M0,300 L120,210 L180,230 L330,22 L430,140 L480,120 L600,300 Z" fill="url(#qm-rock)" />
        <path className="qm__snow" d="M330,22 L360,57 L346,52 L334,64 L320,50 L306,58 Z" />
        <path className="qm__trail" d={d} />
        <path className="qm__trail-done" d={d} pathLength="1" style={{ strokeDashoffset: 1 - p }} />
        {CAMPS.map((c, i) => {
          const q = pointAt(TRAIL, c)
          return <circle key={i} className={`qm__camp${c <= p + 1e-9 ? ' is-on' : ''}`} cx={q.x} cy={q.y} r={i === CAMPS.length - 1 ? 0 : 4.5} />
        })}
        <g className="qm__flag" transform="translate(330 22)">
          <line x1="0" y1="0" x2="0" y2="-20" />
          <path d="M0,-20 L16,-15 L0,-10 Z" className={p >= 1 ? 'is-on' : ''} />
        </g>
        <g className="qm__me" style={{ transform: `translate(${me.x}px, ${me.y}px)` }}>
          <circle r="16" fill="url(#qm-glow)" />
          <circle r="5.5" className="qm__dot" />
        </g>
      </svg>
      <div className="qm__stats">
        <span className="qm__main">{owed > 0 ? t.left(fmtN(owed, lang)) : t.top}</span>
        {owed > 0 && <span>{t.next(fmtN(toNext, lang))}</span>}
        <span>{t.camps(passed, CAMPS.length)}</span>
      </div>
    </figure>
  )
}
