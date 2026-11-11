// ═══════════════════════════════════════════════════════
// ScholarChain (v5.9) — "Elm zənciri" (/scholars): kim kimdən öyrənib — əsrlər boyu canlı şəcərə
//
//   <ScholarChain scholars={SCHOLARS} lang="az" nameOf={s => …} hrefOf={s => …} onOpen={(s, e) => …} />
//
// • Əlaqələr — alim kartlarının öz müəllim/tələbə siyahılarından (utils/scholarChain: dəqiq ad
//   uyğunluğu + xronologiya yoxlaması). Kartlarda olmayan əlaqə çəkilmir — zəncirdə boşluqlar
//   ola bilər (siyahıdakı müəllimlərin çoxu bu saytda ayrıca kart deyil).
// • X oxu — vəfat ili (hicri), dövr zolaqları; uzun boşluq olan dövrlər arası sıxılıb.
//   Ulduza toxunanda/üzərinə gələndə onun BÜTÜN müəllim zənciri (yuxarı) və tələbə zənciri
//   (aşağı) parlayır; klik — alimin kartı. Telefonda üfüqi sürüşür.
// • Animasiya: xətlər bir dəfə "çəkilir" (stroke-dashoffset); hərəkət azaldılıbsa — dərhal.
// ═══════════════════════════════════════════════════════
import { useMemo, useRef, useState } from 'react'
import { pickUi } from '../utils/uiText'
import { buildChain } from '../utils/scholarChain'
import '../styles/ScholarChain.css'

const T = {
  az: { ey: 'Elm zənciri', title: 'Kim kimdən öyrənib?', lead: 'Hər ulduz bir alimdir, xətlər — müəllimdən tələbəyə. Bir alimin üzərinə gəlin: onun müəllimlərinin və tələbələrinin bütün zənciri parlayacaq. Əlaqələr alim kartlarındakı siyahılardandır.', hint: 'Alimə toxunun — zənciri görünsün; ikinci toxunuş kartını açır.', teachers: 'müəllim', students: 'tələbə', open: 'Kartı aç', gaps: 'Boşluqlar: kartlarda adı çəkilən müəllimlərin çoxu bu saytda ayrıca kart deyil — zəncir yalnız saytdakı alimlər arasında çəkilib.', ah: 'h.' },
  en: { ey: 'Chain of knowledge', title: 'Who learned from whom?', lead: 'Each star is a scholar; the lines run from teacher to student. Hover over a scholar to light up the whole chain of their teachers and students. The links come from the lists on the scholars’ cards.', hint: 'Tap a scholar to see their chain; tap again to open the card.', teachers: 'teachers', students: 'students', open: 'Open the card', gaps: 'Gaps: most teachers named on the cards do not have their own card on this site — the chain is drawn only between the scholars here.', ah: 'AH' },
  ru: { ey: 'Цепь знания', title: 'Кто у кого учился?', lead: 'Каждая звезда — учёный, линии идут от учителя к ученику. Наведите на учёного — загорится вся цепь его учителей и учеников. Связи взяты из списков на карточках учёных.', hint: 'Коснитесь учёного — появится цепь; повторное касание открывает карточку.', teachers: 'учителя', students: 'ученики', open: 'Открыть карточку', gaps: 'Пробелы: у большинства учителей из карточек нет своей карточки на сайте — цепь проведена только между учёными сайта.', ah: 'г. х.' },
  ar: { ey: 'سلسلة العلم', title: 'من أخذ عمّن؟', lead: 'كل نجمة عالم، والخطوط من الشيخ إلى التلميذ. مرّر على عالم لتضيء سلسلة شيوخه وتلاميذه كلها. الروابط مأخوذة من القوائم في بطاقات العلماء.', hint: 'المس عالمًا لترى سلسلته؛ واللمسة الثانية تفتح بطاقته.', teachers: 'شيوخ', students: 'تلاميذ', open: 'افتح البطاقة', gaps: 'فجوات: أكثر الشيوخ المذكورين في البطاقات ليست لهم بطاقة مستقلة في الموقع — فالسلسلة مرسومة بين علماء الموقع فقط.', ah: 'هـ' },
  tr: { ey: 'İlim zinciri', title: 'Kim kimden öğrendi?', lead: 'Her yıldız bir âlimdir, çizgiler hocadan talebeye uzanır. Bir âlimin üzerine gelin: hocalarının ve talebelerinin bütün zinciri parlayacak. Bağlantılar âlim kartlarındaki listelerden alınmıştır.', hint: 'Bir âlime dokunun — zinciri görünsün; ikinci dokunuş kartını açar.', teachers: 'hoca', students: 'talebe', open: 'Kartı aç', gaps: 'Boşluklar: kartlarda adı geçen hocaların çoğunun bu sitede ayrı kartı yok — zincir yalnızca sitedeki âlimler arasında çizildi.', ah: 'h.' },
}
// Dövr zolaqları (hicri vəfat ili) — boşluqlar sıxılır
const BANDS = [
  { key: 'salaf', from: 80, to: 320 },
  { key: 'classical', from: 660, to: 860 },
  { key: 'revival', from: 1190, to: 1220 },
  { key: 'contemporary', from: 1370, to: 1450 },
]
const BAND_W = [520, 380, 210, 500], GAP = 80, PADX = 90, H = 520, TOP = 70, BOT = 50
const W = PADX * 2 + BAND_W.reduce((a, b) => a + b, 0) + GAP * (BANDS.length - 1)

function xOf(died, era) {
  let x = PADX
  for (let i = 0; i < BANDS.length; i++) {
    const b = BANDS[i]
    if (b.key === era) {
      const d = Math.max(b.from, Math.min(b.to, died ?? b.to))
      return x + ((d - b.from) / (b.to - b.from)) * BAND_W[i]
    }
    x += BAND_W[i] + GAP
  }
  return x
}
const bandX = (i) => PADX + BAND_W.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i

export default function ScholarChain({ scholars, lang = 'az', nameOf, hrefOf, onOpen, eraLabel }) {
  const t = pickUi(T, lang)
  const [focus, setFocus] = useState(null)
  const g = useMemo(() => {
    const { nodes, edges } = buildChain(scholars)
    // Zolaq daxilində sıra: vəfat ilinə görə, y — növbə ilə sətirlərə (yaxın x-lər üst-üstə düşməsin)
    const pos = {}
    const lanes = 6
    for (const b of BANDS) {
      const list = nodes.filter(n => n.era === b.key).sort((a, c) => (a.died ?? 9999) - (c.died ?? 9999))
      list.forEach((n, i) => {
        const x = xOf(n.died, n.era)
        const lane = i % lanes
        pos[n.slug] = { x, y: TOP + 30 + lane * ((H - TOP - BOT - 60) / (lanes - 1)) }
      })
    }
    const up = {}, down = {}
    for (const e of edges) { (down[e.from] ||= []).push(e.to); (up[e.to] ||= []).push(e.from) }
    return { nodes, edges, pos, up, down }
  }, [scholars])
  const bySlug = useMemo(() => Object.fromEntries(scholars.map(s => [s.slug, s])), [scholars])

  // Seçilmiş alimin bütün zənciri (yuxarı və aşağı, rekursiv)
  const lit = useMemo(() => {
    if (!focus) return null
    const set = new Set([focus])
    const walk = (k, dir) => { for (const n of (dir === 'up' ? g.up : g.down)[k] || []) if (!set.has(n)) { set.add(n); walk(n, dir) } }
    walk(focus, 'up'); walk(focus, 'down')
    return set
  }, [focus, g])

  // Siçan: üzərinə gələndə zəncir görünür, klik — kart. Toxunuş: 1-ci toxunuş zəncir, 2-ci — kart
  // (telefonda toxunuş özü də "mouseenter" yaradır — ona görə göstərici növünə baxılır)
  const ptr = useRef('mouse')
  const tap = (s, e) => {
    if (ptr.current === 'mouse' || focus === s.slug) { onOpen?.(s, e); return }
    e.preventDefault(); setFocus(s.slug)
  }
  const info = focus ? bySlug[focus] : null
  const nT = focus ? (g.up[focus] || []).length : 0, nS = focus ? (g.down[focus] || []).length : 0

  return (
    <section className="ui-section sch" aria-labelledby="sch-title" data-testid="scholar-chain">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="sch-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        <div className="sch__frame">
          <div className="sch__scroll">
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="sch__svg" role="group" aria-label={t.title} style={{ direction: 'ltr' }}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse') setFocus(null) }}>
              <defs>
                <linearGradient id="sch-edge" x1="0" x2="1"><stop offset="0" stopColor="#c79a3a" stopOpacity=".25" /><stop offset="1" stopColor="#f6d77a" stopOpacity=".95" /></linearGradient>
                <radialGradient id="sch-glow"><stop offset="0" stopColor="#ffe9a8" stopOpacity=".85" /><stop offset="1" stopColor="#ffe9a8" stopOpacity="0" /></radialGradient>
              </defs>
              {BANDS.map((b, i) => (
                <g key={b.key} className="sch__band">
                  <rect x={bandX(i) - 16} y={TOP - 40} width={BAND_W[i] + 32} height={H - TOP - BOT + 70} rx="18" />
                  <text x={bandX(i) + BAND_W[i] / 2} y={TOP - 14} textAnchor="middle" className="sch__bandl">{eraLabel ? eraLabel(b.key) : b.key}</text>
                  <text x={bandX(i)} y={H - 18} className="sch__yr">{b.from} {t.ah}</text>
                  <text x={bandX(i) + BAND_W[i]} y={H - 18} textAnchor="end" className="sch__yr">{b.to}</text>
                </g>
              ))}
              {g.edges.map((e, i) => {
                const a = g.pos[e.from], b = g.pos[e.to]
                if (!a || !b) return null
                const on = lit ? lit.has(e.from) && lit.has(e.to) : false
                const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 40 - Math.abs(b.x - a.x) * 0.08
                return <path key={i} d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`} className={`sch__edge${on ? ' is-on' : ''}${lit && !on ? ' is-dim' : ''}`} pathLength="1" style={{ '--i': i }} />
              })}
              {scholars.map((s) => {
                const p = g.pos[s.slug]; if (!p) return null
                const deg = (g.up[s.slug]?.length || 0) + (g.down[s.slug]?.length || 0)
                const r = 5 + Math.min(7, deg * 1.2)
                const on = lit?.has(s.slug), dim = lit && !on
                return (
                  <a key={s.slug} href={hrefOf(s)} onClick={(e) => tap(s, e)} onPointerDown={(e) => { ptr.current = e.pointerType || 'mouse' }}
                    onPointerEnter={(e) => { if (e.pointerType === 'mouse') setFocus(s.slug) }} onFocus={(e) => { if (e.currentTarget.matches?.(':focus-visible')) setFocus(s.slug) }}
                    className={`sch__node${on ? ' is-on' : ''}${dim ? ' is-dim' : ''}${focus === s.slug ? ' is-focus' : ''}`} aria-label={nameOf(s)}>
                    <circle cx={p.x} cy={p.y} r={r * 3} fill="url(#sch-glow)" className="sch__halo" />
                    <circle cx={p.x} cy={p.y} r={r} className="sch__star" />
                    <text x={p.x} y={p.y + r + 15} textAnchor="middle" className="sch__name">{nameOf(s)}</text>
                  </a>
                )
              })}
            </svg>
          </div>
          <div className="sch__info" aria-live="polite">
            {info ? (
              <>
                <b>{nameOf(info)}</b>
                <span className="ui-num">{nT} {t.teachers} · {nS} {t.students}</span>
                <a className="ui-link" href={hrefOf(info)} onClick={(e) => onOpen?.(info, e)}>{t.open} →</a>
              </>
            ) : <span>{t.hint}</span>}
          </div>
        </div>
        <p className="sch__note">{t.gaps}</p>
      </div>
    </section>
  )
}
