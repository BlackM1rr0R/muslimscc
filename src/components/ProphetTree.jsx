// ═══════════════════════════════════════════════════════
// ProphetTree (v6.1) — "Peyğəmbərlər şəcərəsi" (/history → Peyğəmbərlər)
//
//   <ProphetTree lang="az" prophets={PROPHETS} />
//
// • Yalnız Quranın özünün dediyi əlaqələr — data/prophetTree.js (hər xəttin ayəsi testlə yoxlanılıb).
//   Düz xətt — qohumluq; qırıq xətt — başqa əlaqə (iman, himayə, dua, müjdə).
// • Düyünə toxun / üzərinə gəl → əlaqələri parlayır, aşağıda ayələr (Quran səhifəsinə keçid).
// • Görünəndə xətlər bir dəfə "çəkilir" (stroke-dashoffset); hərəkət azaldılıbsa — dərhal.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { TREE_NODES, TREE_EDGES, TREE_REL } from '../data/prophetTree'
import { getSurahLocal } from '../data/surahNamesAz'
import { SURAH_TABLE } from '../data/mushafIndex'
import { pathFor } from '../seo/routes'
import '../styles/ProphetTree.css'

const T = {
  az: { ey: 'Şəcərə', title: 'Peyğəmbərlər şəcərəsi', lead: 'Yalnız Quranın özünün dediyi əlaqələr — hər xəttin yanında ayəsi. Bir peyğəmbərə toxunun.', solid: 'qohumluq', dashed: 'başqa əlaqə (iman, himayə, dua, müjdə)', hint: 'Bir ada toxunun — əlaqələri və ayələri görünsün.', others: 'Quranda bir-biri ilə qohumluğu açıq deyilməyən peyğəmbərlər', note: 'Rəvayət və təfsirdən gələn əlaqələr (məsələn, Lutun İbrahimin qardaşı oğlu olması) burada çəkilmir — yalnız ayənin açıq dediyi.' },
  en: { ey: 'Lineage', title: 'Family tree of the prophets', lead: 'Only the ties the Quran itself states — each line with its ayah. Tap a prophet.', solid: 'kinship', dashed: 'another tie (faith, care, prayer, glad tidings)', hint: 'Tap a name to see its ties and ayahs.', others: 'Prophets whose kinship with one another the Quran does not state', note: 'Ties known from narrations and tafsir (for example, Lut being Ibrahim’s nephew) are not drawn here — only what the ayah states plainly.' },
  ru: { ey: 'Родословная', title: 'Родословное древо пророков', lead: 'Только связи, о которых говорит сам Коран, — у каждой линии свой аят. Коснитесь пророка.', solid: 'родство', dashed: 'другая связь (вера, попечение, мольба, благая весть)', hint: 'Коснитесь имени — появятся связи и аяты.', others: 'Пророки, о родстве которых между собой Коран прямо не говорит', note: 'Связи из преданий и тафсира (например, что Лут — племянник Ибрахима) здесь не показаны — только то, что прямо сказано в аяте.' },
  ar: { ey: 'النسب', title: 'شجرة الأنبياء', lead: 'الصلات التي نصّ عليها القرآن نفسه فقط — مع آية كل خط. المس نبيًا.', solid: 'قرابة', dashed: 'صلة أخرى (إيمان، كفالة، دعاء، بشارة)', hint: 'المس اسمًا لتظهر صلاته وآياته.', others: 'أنبياء لم يصرّح القرآن بقرابة بينهم', note: 'الصلات المعروفة من الروايات والتفسير (ككون لوط ابن أخي إبراهيم) لا تُرسم هنا — فقط ما صرّحت به الآية.' },
  tr: { ey: 'Soy', title: 'Peygamberler soy ağacı', lead: 'Yalnızca Kur’an’ın bizzat bildirdiği bağlar — her çizginin yanında âyeti. Bir peygambere dokunun.', solid: 'akrabalık', dashed: 'başka bağ (iman, himaye, dua, müjde)', hint: 'Bağlarını ve âyetlerini görmek için bir isme dokunun.', others: 'Birbiriyle akrabalığını Kur’an’ın açıkça bildirmediği peygamberler', note: 'Rivayet ve tefsirden bilinen bağlar (ör. Lût’un İbrahim’in yeğeni olması) burada çizilmez — yalnızca âyetin açıkça söylediği.' },
}
const R = { p: 40, o: 34 }
// Qövs: iki nöqtə arası yumşaq əyri (uzun xətlər daha çox əyilir)
function curve([x1, y1], [x2, y2]) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1
  const k = Math.min(60, len * 0.12)
  const cx = mx - (dy / len) * k, cy = my + (dx / len) * k
  return { d: `M${x1},${y1} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}`, lx: (x1 + 2 * cx + x2) / 4, ly: (y1 + 2 * cy + y2) / 4, len: len * 1.08 }
}

export default function ProphetTree({ lang = 'az', prophets = [] }) {
  const t = pickUi(T, lang)
  const [focus, setFocus] = useState(null)
  const [shown, setShown] = useState(false)
  const ref = useRef(null)
  const ptr = useRef('touch')   // siçanla üzərinə gələndə artıq seçilir — klik onu söndürməsin
  const byNum = (n) => prophets.find(p => p.num === n)
  const nameOf = (k) => { const n = TREE_NODES[k]; return n.num ? pickUi(byNum(n.num)?.name, lang) : pickUi(n.name, lang) }
  const arOf = (k) => { const n = TREE_NODES[k]; return n.num ? byNum(n.num)?.arabic : n.ar }
  const inTree = new Set(Object.values(TREE_NODES).map(n => n.num).filter(Boolean))
  const others = prophets.filter(p => !inTree.has(p.num))
  const rels = focus ? TREE_EDGES.filter(e => e[0] === focus || e[1] === focus) : []
  const lit = focus ? new Set(rels.flatMap(e => [e[0], e[1]])) : null
  const surah = (s) => getSurahLocal(s, lang)?.name || SURAH_TABLE[s - 1]?.[5] || s

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="ptr ui-card" aria-labelledby="ptr-title" data-testid="prophet-tree" ref={ref}>
      <div className="ptr__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h3 id="ptr-title" className="ui-title ui-title--sm">{t.title}</h3>
        <p className="ui-lead">{t.lead}</p>
        <p className="ptr__legend"><span className="ptr__key" /> {t.solid} <span className="ptr__key is-dash" /> {t.dashed}</p>
      </div>
      <div className="ptr__frame">
        <div className="ptr__scroll">
        <svg viewBox="0 0 1000 720" className={`ptr__svg${shown ? ' is-shown' : ''}`} role="group" aria-label={t.title} style={{ direction: 'ltr' }}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') setFocus(null) }}>
          <defs>
            <radialGradient id="ptr-glow"><stop offset="0" stopColor="var(--accent, #c79a3a)" stopOpacity=".35" /><stop offset="1" stopColor="var(--accent, #c79a3a)" stopOpacity="0" /></radialGradient>
          </defs>
          {TREE_EDGES.map(([a, b, kind, refs, dash], i) => {
            const c = curve(TREE_NODES[a].at, TREE_NODES[b].at)
            const on = focus && (a === focus || b === focus)
            return (
              <g key={i} className={`ptr__edge${dash ? ' is-dash' : ''}${on ? ' is-on' : ''}${focus && !on ? ' is-dim' : ''}`} style={{ '--len': c.len.toFixed(0), '--d': `${i * 90}ms` }}>
                <path d={c.d} />
                <text x={c.lx} y={c.ly - 6} textAnchor="middle" className="ptr__rel">{pickUi(TREE_REL[kind], lang)} · {refs[0][0]}</text>
              </g>
            )
          })}
          {Object.entries(TREE_NODES).map(([k, n]) => {
            const [x, y] = n.at, isP = Boolean(n.num), r = k === 'muhammad' ? 46 : isP ? R.p : R.o
            const on = !lit || lit.has(k)
            return (
              <g key={k} className={`ptr__node${isP ? '' : ' is-person'}${k === 'muhammad' ? ' is-last' : ''}${on ? '' : ' is-dim'}${focus === k ? ' is-focus' : ''}`}
                role="button" tabIndex={0} aria-pressed={focus === k} aria-label={nameOf(k)} data-testid={`ptr-${k}`}
                onPointerDown={(e) => { ptr.current = e.pointerType || 'mouse' }}
                onClick={() => setFocus(f => (ptr.current === 'mouse' ? k : f === k ? null : k))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocus(f => (f === k ? null : k)) } }}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setFocus(k) }}>
                {focus === k && <circle cx={x} cy={y} r={r + 26} fill="url(#ptr-glow)" />}
                <circle cx={x} cy={y} r={r} className="ptr__disc" />
                <text x={x} y={y - 4} textAnchor="middle" className="ptr__ar" lang="ar">{arOf(k)}</text>
                <text x={x} y={y + 16} textAnchor="middle" className="ptr__nm">{nameOf(k)}</text>
              </g>
            )
          })}
        </svg>
        </div>
        <div className="ptr__info" aria-live="polite" data-testid="ptr-info">
          {focus ? (
            <>
              <b>{nameOf(focus)}</b>
              <ul>
                {rels.map(([a, b, kind, refs], i) => (
                  <li key={i}>
                    <span>{nameOf(a)} → {nameOf(b)}: <i>{pickUi(TREE_REL[kind], lang)}</i></span>
                    <span className="ptr__refs">
                      {refs.map(([r]) => {
                        const [s, n] = r.split(':').map(Number)
                        return <a key={r} className="ui-link ui-num" href={`${pathFor('quran', lang, s)}?a=${n}`}>{surah(s)} {r} <Icon name="arrow" size={13} className="ui-flip-rtl" /></a>
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : <span>{t.hint}</span>}
        </div>
      </div>
      <p className="ptr__others-t">{t.others}</p>
      <ul className="ptr__others">
        {others.map(p => <li key={p.num}><span className="ui-chip">{pickUi(p.name, lang)}</span></li>)}
      </ul>
      <p className="ptr__note"><Icon name="info" size={14} /> {t.note}</p>
    </section>
  )
}
