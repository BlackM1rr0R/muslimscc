// ═══════════════════════════════════════════════════════
// MuhasabahSky — əməllərin gecə səması (/muhasabah) — yalnız bu cihazda
//
//   <MuhasabahSky entries={{ '2026-11-05': { c: ['salah','quran'] } }} items={ITEMS}
//     today="2026-11-05" labels={{ salah: 'Namaz', … }} lang="az" />
//
// • Hər əməl növü bir bürcdür (8 bürc); son 30 gündə hər qeyd olunan əməl —
//   bir ulduz. Ulduzlar tarixə görə xətlə birləşir — bürc böyüyür.
// • Yaxın günlərin ulduzu daha parlaq; bu günün ulduzları bir dəfə parıldayır.
// • Mövqe deterministikdir (tarix + əməl → həmişə eyni yer), təsadüfi deyil.
// • Bürcə toxunuş → adı və sayı. Stillər: src/styles/MuhasabahSky.css
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import { W, H, ANCHORS, skyStars } from '../utils/muhasabahSky'
import '../styles/MuhasabahSky.css'

const T = {
  az: { title: 'Əməllərin səması', lead: 'Son 30 gündə hər yaxşı əməl bir ulduzdur; eyni əməlin ulduzları bürc olur.', n: (k) => `${k} ulduz`, sum: (k) => `Son 30 gündə ${k} ulduz`, pick: 'Bürcə toxunun' },
  en: { title: 'The sky of deeds', lead: 'Each good deed of the last 30 days is a star; the stars of one deed form a constellation.', n: (k) => `${k} stars`, sum: (k) => `${k} stars in the last 30 days`, pick: 'Tap a constellation' },
  ru: { title: 'Небо дел', lead: 'Каждое доброе дело за 30 дней — звезда; звёзды одного дела складываются в созвездие.', n: (k) => `звёзд: ${k}`, sum: (k) => `за 30 дней звёзд: ${k}`, pick: 'Коснитесь созвездия' },
  tr: { title: 'Amellerin göğü', lead: 'Son 30 günde her güzel amel bir yıldızdır; aynı amelin yıldızları takımyıldız olur.', n: (k) => `${k} yıldız`, sum: (k) => `Son 30 günde ${k} yıldız`, pick: 'Bir takımyıldıza dokunun' },
  ar: { title: 'سماء الأعمال', lead: 'كل عمل صالح في آخر 30 يومًا نجمة، ونجوم العمل الواحد تصير كوكبة.', n: (k) => `${k} نجمة`, sum: (k) => `${k} نجمة في آخر 30 يومًا`, pick: 'المس كوكبة' },
}
// Bürc xətti: ulduzlar mərkəz ətrafında bucağa görə — dolaşmayan qapalı fiqur
const ring = (list, [ax, ay]) => {
  const pts = list.slice().sort((a, b) => Math.atan2(a.y - ay, a.x - ax) - Math.atan2(b.y - ay, b.x - ax))
  if (pts.length > 2) pts.push(pts[0])
  return pts.map(s => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(' ')
}

export default function MuhasabahSky({ entries, items, today, labels, lang = 'az' }) {
  const t = T[lang] || T.az
  const stars = useMemo(() => skyStars(entries, items, today), [entries, items, today])
  const total = stars.reduce((a, s) => a + s.length, 0)
  const [sel, setSel] = useState(null)

  return (
    <figure className="ms" data-testid="muhasabah-sky" data-reveal="fade">
      <figcaption className="ms__head">
        <span className="ms__title">{t.title}</span>
        <span className="ms__lead">{t.lead}</span>
      </figcaption>
      <svg className="ms__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.sum(total)}>
        <defs>
          <radialGradient id="ms-bg" cx="50%" cy="110%" r="90%"><stop offset="0" stopColor="#1d3f5c" /><stop offset="1" stopColor="#060d18" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#ms-bg)" rx="12" />
        {stars.map((list, i) => (
          <g key={items[i]} className={`ms__con${sel === i ? ' is-sel' : ''}`} onClick={() => setSel(s => (s === i ? null : i))}>
            <circle cx={ANCHORS[i][0]} cy={ANCHORS[i][1]} r="44" fill="transparent" />
            {list.length > 1 && <polyline className="ms__line" points={ring(list, ANCHORS[i])} />}
            {list.map(s => (
              <circle key={s.date} className={`ms__star${s.age === 0 ? ' is-today' : ''}`} cx={s.x} cy={s.y}
                r={(1.1 + (1 - s.age / 30) * 1.6).toFixed(2)} style={{ opacity: (0.45 + (1 - s.age / 30) * 0.55).toFixed(2) }} />
            ))}
            {(sel === i || list.length > 0) && (
              <text className="ms__lbl" x={ANCHORS[i][0]} y={Math.max(11, ANCHORS[i][1] + (ANCHORS[i][1] > 150 ? 30 : -36))} textAnchor="middle">
                {labels[items[i]]}{sel === i ? ` · ${list.length}` : ''}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="ms__note" aria-live="polite">
        {sel != null ? <><b>{labels[items[sel]]}</b> — {t.n(stars[sel].length)}</> : <>{t.sum(total)} · {t.pick}</>}
      </p>
    </figure>
  )
}
