// ═══════════════════════════════════════════════════════
// TopicSky (v5.9) — "Quran mövzular kainatı" (/quran-roots): mövzular ulduz bürcləri kimi
//
//   <TopicSky roots={index.roots} topics={QURAN_TOPICS} lang="az" active="صبر" onPick={(root) => …} />
//
// • Mövzu = data/quranTopics-dəki kök (yalnız mənası birmənalı köklər, testlə yoxlanılır).
//   Ulduzun ölçüsü — həmin kökün işləndiyi ayələrin sayı; xətt — iki mövzunun EYNİ ayələrdə
//   birgə gəlməsi (kosinus oxşarlığı, utils/quranRoots → rootAyahIndex). Hamısı Quranic Arabic
//   Corpus morfologiyasından hesablanır — yeni iddia yoxdur.
// • Yerləşmə: sabit toxumla sadə qüvvə modeli (hər açılışda eyni şəkil).
// • Toxun/klik → həmin kök axtarılır (səhifənin öz siyahısı açılır). Klaviatura: Tab + Enter.
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import { pickUi } from '../utils/uiText'
import { rootAyahIndex } from '../utils/quranRoots'
import '../styles/TopicSky.css'

const T = {
  az: { title: 'Mövzular kainatı', lead: 'Hər ulduz bir mövzudur — ölçüsü Quranda neçə ayədə keçdiyini, xətlər isə mövzuların eyni ayələrdə birgə gəldiyini göstərir.', ayahs: '{n} ayə', with: 'ən çox birgə', pick: 'Mövzuya toxunun — ayələri aşağıda açılacaq.' },
  en: { title: 'The universe of topics', lead: 'Each star is a topic — its size shows how many ayahs it appears in, and the lines show topics that appear together in the same ayahs.', ayahs: '{n} ayahs', with: 'most often with', pick: 'Tap a topic — its ayahs open below.' },
  ru: { title: 'Вселенная тем', lead: 'Каждая звезда — тема: размер показывает, в скольких аятах она встречается, а линии — темы, которые встречаются вместе в одних аятах.', ayahs: '{n} аятов', with: 'чаще всего вместе с', pick: 'Коснитесь темы — её аяты откроются ниже.' },
  ar: { title: 'كون الموضوعات', lead: 'كل نجمة موضوع — حجمها يبيّن عدد الآيات التي ورد فيها، والخطوط تبيّن الموضوعات التي تجتمع في الآيات نفسها.', ayahs: '{n} آية', with: 'أكثر ما يقترن بـ', pick: 'المس موضوعًا — تُفتح آياته في الأسفل.' },
  tr: { title: 'Konular evreni', lead: 'Her yıldız bir konudur — boyutu Kur’an’da kaç âyette geçtiğini, çizgiler ise aynı âyetlerde birlikte geçen konuları gösterir.', ayahs: '{n} âyet', with: 'en çok birlikte', pick: 'Bir konuya dokunun — âyetleri aşağıda açılır.' },
}
const W = 720, H = 420
const fill = (s, n) => String(s).replace('{n}', n)

function layout(nodes, edges) {
  let seed = 3
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const p = nodes.map((_, i) => { const a = i * 2.39996, r = 60 + 14 * Math.sqrt(i) * 6; return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r * 0.62, vx: 0, vy: 0 } })
  for (let it = 0; it < 320; it++) {
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
      const dx = p[j].x - p[i].x, dy = p[j].y - p[i].y, d2 = Math.max(400, dx * dx + dy * dy), f = 2600 / d2
      const d = Math.sqrt(d2)
      p[i].vx -= (dx / d) * f; p[i].vy -= (dy / d) * f; p[j].vx += (dx / d) * f; p[j].vy += (dy / d) * f
    }
    for (const e of edges) {
      const a = p[e.a], b = p[e.b], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 150) * 0.012 * (0.5 + e.s * 3)
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f
    }
    for (const q of p) {
      q.vx += (W / 2 - q.x) * 0.004; q.vy += (H / 2 - q.y) * 0.007
      q.x = Math.max(60, Math.min(W - 60, q.x + q.vx * 0.5)); q.y = Math.max(44, Math.min(H - 44, q.y + q.vy * 0.5))
      q.vx *= 0.6; q.vy *= 0.6
    }
  }
  return p.map(q => ({ x: q.x + (rnd() - 0.5) * 2, y: q.y }))
}

export default function TopicSky({ roots, topics, lang = 'az', active, onPick }) {
  const t = pickUi(T, lang)
  const [hover, setHover] = useState(null)
  const g = useMemo(() => {
    if (!roots) return null
    const { rootAyahs } = rootAyahIndex(roots)
    const nodes = topics.map(tp => ({ ...tp, set: rootAyahs.get(tp.root) || new Set() })).filter(n => n.set.size)
    const edges = []
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      let co = 0
      const [a, b] = nodes[i].set.size < nodes[j].set.size ? [nodes[i].set, nodes[j].set] : [nodes[j].set, nodes[i].set]
      for (const k of a) if (b.has(k)) co++
      if (co >= 3) edges.push({ a: i, b: j, co, s: co / Math.sqrt(nodes[i].set.size * nodes[j].set.size) })
    }
    // Hər mövzunun ən güclü 3 əlaqəsi (şəkil sıx olmasın)
    const keep = new Set()
    nodes.forEach((_, i) => edges.filter(e => e.a === i || e.b === i).sort((x, y) => y.s - x.s).slice(0, 3).forEach(e => keep.add(e)))
    const E = [...keep]
    const pos = layout(nodes, E)
    const max = Math.max(...nodes.map(n => n.set.size))
    return { nodes: nodes.map((n, i) => ({ ...n, ...pos[i], r: 6 + 16 * Math.sqrt(n.set.size / max) })), edges: E }
  }, [roots, topics])
  if (!g) return null
  const focus = hover ?? g.nodes.findIndex(n => n.root === active)
  const near = new Set(focus >= 0 ? g.edges.filter(e => e.a === focus || e.b === focus).flatMap(e => [e.a, e.b]) : [])
  const info = focus >= 0 ? g.nodes[focus] : null
  const best = info ? g.edges.filter(e => e.a === focus || e.b === focus).sort((x, y) => y.s - x.s)[0] : null
  const bestName = best ? pickUi(g.nodes[best.a === focus ? best.b : best.a].l, lang) : ''
  return (
    <figure className="tsky" data-testid="topic-sky">
      <figcaption className="tsky__cap"><strong>{t.title}</strong> <span>{t.lead}</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="tsky__svg" role="group" aria-label={t.title}>
        <defs>
          <radialGradient id="tsky-glow"><stop offset="0" stopColor="#ffe9a8" stopOpacity=".9" /><stop offset="1" stopColor="#ffe9a8" stopOpacity="0" /></radialGradient>
        </defs>
        {Array.from({ length: 70 }, (_, i) => <circle key={i} className="tsky__dust" cx={(i * 97.3) % W} cy={(i * 53.7 + (i % 7) * 31) % H} r={(i % 3) * 0.5 + 0.5} style={{ '--d': `${(i % 9) * 0.6}s` }} />)}
        {g.edges.map((e, i) => {
          const a = g.nodes[e.a], b = g.nodes[e.b], on = focus >= 0 && (e.a === focus || e.b === focus)
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`tsky__edge${on ? ' is-on' : ''}${focus >= 0 && !on ? ' is-dim' : ''}`} strokeWidth={0.6 + e.s * 6} />
        })}
        {g.nodes.map((n, i) => {
          const on = i === focus, dim = focus >= 0 && !on && !near.has(i)
          return (
            <g key={n.root} className={`tsky__node${on ? ' is-on' : ''}${dim ? ' is-dim' : ''}`} transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}
              tabIndex={0} role="button" aria-pressed={n.root === active} aria-label={`${pickUi(n.l, lang)} — ${fill(t.ayahs, n.set.size)}`}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              onClick={() => onPick?.(n.root)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick?.(n.root) } }}>
              <circle r={n.r * 2.4} fill="url(#tsky-glow)" className="tsky__halo" />
              <circle r={n.r} className="tsky__star" />
              <text y={n.r + 16} className="tsky__label" textAnchor="middle">{pickUi(n.l, lang)}</text>
            </g>
          )
        })}
      </svg>
      <p className="tsky__info" aria-live="polite">
        {info ? <><b>{pickUi(info.l, lang)}</b> · <span className="ui-num">{fill(t.ayahs, info.set.size)}</span>{bestName ? <> · {t.with}: <b>{bestName}</b></> : null}</> : t.pick}
      </p>
    </figure>
  )
}
