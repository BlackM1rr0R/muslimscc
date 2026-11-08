// ═══════════════════════════════════════════════════════
// PalmGarden (v5.8) — "Sübhanəllahil-əzimi və bihəmdihi" zikrinin xurma bağı (/dhikr)
//
//   <PalmGarden count={123} virtue="…" source="Tirmizi 3464" lang="az" />
//
// • Fəzilət və mənbə saytın zikr məlumatındandır (src/data/dhikr.js — DHIKRS-də həmin
//   zikrin virtue/source sahələri): "Deyənə Cənnətdə bir xurma ağacı əkilir" (Tirmizi 3464).
//   Hər deyiş bir ağacdır — sayğac hər toxunuşu yazır (utils/palms).
// • Bağ SVG-dir: ağaclar dərinliyə doğru sıralarla düzülür (uzaqdakılar kiçik); ekranda
//   ən çox 48 ağac çəkilir, qalanı rəqəmlə. Yeni ağac "böyüyərək" çıxır, yarpaqlar küləkdə
//   yellənir (yalnız transform). Gündüz / gecə — canlı səmanın fazası (html[data-sky]).
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { pickUi } from '../../utils/uiText'
import { localizeSource } from '../../utils/sourceNames'
import '../../styles/PalmGarden.css'

const T = {
  az: { title: 'Cənnətdəki xurma bağınız', trees: 'ağac', empty: 'Bu zikri deyin — bağınızda ilk xurma ağacı bitsin.', only: 'Yalnız bu cihazda sayılır.' },
  en: { title: 'Your palm grove in Paradise', trees: 'trees', empty: 'Say this dhikr — and the first palm tree grows in your grove.', only: 'Counted on this device only.' },
  ru: { title: 'Ваша пальмовая роща в Раю', trees: 'пальм', empty: 'Произнесите этот зикр — и в вашей роще вырастет первая пальма.', only: 'Считается только на этом устройстве.' },
  ar: { title: 'بستان نخلك في الجنة', trees: 'نخلة', empty: 'قل هذا الذكر لتنبت أول نخلة في بستانك.', only: 'يُحسب على هذا الجهاز فقط.' },
  tr: { title: 'Cennetteki hurma bahçeniz', trees: 'ağaç', empty: 'Bu zikri söyleyin — bahçenizde ilk hurma ağacı yeşersin.', only: 'Yalnızca bu cihazda sayılır.' },
}
const MAX_DRAWN = 48

/** Ağacların yerləri: 6 sıra, arxa sıralar kiçik və yuxarıda (deterministik) */
export function palmLayout(n) {
  const out = []
  const rows = [9, 9, 8, 8, 7, 7]  // öndən arxaya
  let i = 0
  for (let r = 0; r < rows.length && i < n; r++) {
    const k = rows[r], depth = r / (rows.length - 1)
    for (let c = 0; c < k && i < n; c++, i++) {
      const jitter = ((i * 37) % 11) / 11 - 0.5
      out.push({ x: 8 + (c + 0.5 + jitter * 0.4 + (r % 2) * 0.5) * (200 / k), y: 98 - depth * 36, s: 1.05 - depth * 0.62, d: (i % 5) * 0.4, i })
    }
  }
  return out.sort((a, b) => a.y - b.y)   // arxadakılar əvvəl çəkilsin
}

function Palm({ x, y, s, d, fresh }) {
  return (
    <g className={`pg-palm${fresh ? ' is-new' : ''}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="pg-trunk" d="M0 0 C -1.2 -6 1.2 -12 0.4 -18" />
      <g className="pg-crown" style={{ '--d': `${d}s` }} transform="translate(0.4 -18)">
        <path d="M0 0 C -4 -3 -8 -2 -11 1 C -7 -1 -4 0 0 0Z" />
        <path d="M0 0 C 4 -3 8 -2 11 1 C 7 -1 4 0 0 0Z" />
        <path d="M0 0 C -3 -5 -6 -7 -9 -7 C -6 -5 -3 -3 0 0Z" />
        <path d="M0 0 C 3 -5 6 -7 9 -7 C 6 -5 3 -3 0 0Z" />
        <path d="M0 0 C -1 -5 0 -8 1 -10 C 1 -6 1 -3 0 0Z" />
        <circle className="pg-dates" cx="0" cy="1.2" r="1.1" />
      </g>
    </g>
  )
}

export default function PalmGarden({ count = 0, virtue, source, lang = 'az' }) {
  const t = pickUi(T, lang)
  const drawn = Math.min(count, MAX_DRAWN)
  const palms = useMemo(() => palmLayout(drawn), [drawn])
  const night = typeof document !== 'undefined' && ['night', 'isha', 'maghrib', 'fajr'].includes(document.documentElement.dataset.sky)
  return (
    <section className={`ui-card pg${night ? ' pg--night' : ''}`} aria-labelledby="pg-h" data-testid="palm-garden">
      <div className="pg__head">
        <h3 id="pg-h" className="pg__title">{t.title}</h3>
        <span className="pg__count"><b className="ui-num" data-testid="pg-count">{count.toLocaleString(lang === 'ar' ? 'ar-EG' : undefined)}</b> {t.trees}</span>
      </div>
      <svg className="pg__svg" viewBox="0 0 220 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${t.title}: ${count} ${t.trees}`}>
        <defs>
          <linearGradient id="pg-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="pg-sky1" /><stop offset="1" className="pg-sky2" />
          </linearGradient>
        </defs>
        <rect width="220" height="100" fill="url(#pg-sky)" />
        <circle className="pg-sun" cx="186" cy="20" r="8" />
        <path className="pg-hill pg-hill--far" d="M0 58 Q 55 46 110 54 T 220 50 V100 H0Z" />
        <path className="pg-hill" d="M0 66 Q 66 56 132 63 T 220 60 V100 H0Z" />
        <path className="pg-river" d="M0 76 C 66 70 120 84 220 74 L220 79 C 130 90 66 76 0 81Z" />
        {palms.map(p => <Palm key={p.i} {...p} fresh={p.i === drawn - 1 && count <= MAX_DRAWN} />)}
      </svg>
      <p className="pg__virtue">{count ? virtue : t.empty}{source ? <span className="pg__src"> — {localizeSource(source, lang)}</span> : null}</p>
      <small className="pg__note">{t.only}{count > MAX_DRAWN ? ` · ${MAX_DRAWN}+` : ''}</small>
    </section>
  )
}
