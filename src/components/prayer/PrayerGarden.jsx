// ═══════════════════════════════════════════════════════
// PrayerGarden — "Namaz bağçası": son 30 gün bitki kimi (yalnız bu cihazda)
//
//   <PrayerGarden snap={snap} periods={periods} today="2026-11-05" streak={12} best={20}
//     lang="az" onPick={(dateKey) => …} />
//
// • Hər qılınan namaz (vaxtında və ya qəza) — bir yaşıl yarpaq; qılınmayan
//   ("missed") — solmuş, aşağı əyilmiş yarpaq; 5/5 gün — bitki çiçək açır.
// • Üzrlü gün (heyz / nifas) CƏZA DEYİL: bitki hilal altında "dincəlir".
// • Seriya ağacı: ardıcıl tam günlər artdıqca fidandan böyük ağaca qədər böyüyür.
// • Bitki — düymə: toxunanda həmin gün redaktə üçün açılır (onPick).
// • Əlçatanlıq: bütöv bağça üçün mətn xülasəsi; hər bitkinin <title>-ı və aria-label-ı.
// Stillər: src/styles/PrayerGarden.css
// ═══════════════════════════════════════════════════════
import { memo, useMemo } from 'react'
import { dayState, lastNDays } from '../../utils/prayerTracker'
import '../../styles/PrayerGarden.css'

const TXT = {
  az: { title: 'Namaz bağçası', lead: 'Hər qılınan namaz bir yarpaqdır; beş vaxtın hamısı qılınan gün bitki çiçək açır. Üzrlü günlərdə bitki dincəlir.',
    tree: 'Seriya ağacı', days: 'gün', complete: 'Tam gün', partial: 'Yarımçıq', missed: 'Qılınmayan', excused: 'Üzrlü gün', today: 'Bu gün',
    summary: 'Son 30 gün: {c} tam gün, {p} yarımçıq, {e} üzrlü. Ardıcıl: {s} gün.', private: 'Bağça yalnız bu cihazda və yalnız sizə görünür.',
    open: 'Bu günü aç', stage: ['Toxum', 'Cücərti', 'Fidan', 'Gənc ağac', 'Ağac', 'Böyük ağac'] },
  en: { title: 'Prayer garden', lead: 'Every prayer you pray is a leaf; on a day with all five prayers the plant blooms. On excused days the plant rests.',
    tree: 'Streak tree', days: 'days', complete: 'Full day', partial: 'Partial', missed: 'Missed', excused: 'Excused day', today: 'Today',
    summary: 'Last 30 days: {c} full days, {p} partial, {e} excused. Streak: {s} days.', private: 'The garden is only on this device and only you can see it.',
    open: 'Open this day', stage: ['Seed', 'Sprout', 'Sapling', 'Young tree', 'Tree', 'Great tree'] },
  ru: { title: 'Сад намазов', lead: 'Каждый совершённый намаз — лист; в день, когда совершены все пять, растение цветёт. В дни освобождения растение отдыхает.',
    tree: 'Дерево серии', days: 'дн.', complete: 'Полный день', partial: 'Частично', missed: 'Пропущен', excused: 'День освобождения', today: 'Сегодня',
    summary: 'Последние 30 дней: полных {c}, частичных {p}, освобождения {e}. Серия: {s} дн.', private: 'Сад есть только на этом устройстве, и видите его только вы.',
    open: 'Открыть этот день', stage: ['Семя', 'Росток', 'Саженец', 'Молодое дерево', 'Дерево', 'Большое дерево'] },
  ar: { title: 'حديقة الصلاة', lead: 'كل صلاة تؤديها ورقة؛ وفي اليوم الذي تؤدي فيه الصلوات الخمس تزهر النبتة. وفي أيام العذر تستريح النبتة.',
    tree: 'شجرة المداومة', days: 'يوم', complete: 'يوم كامل', partial: 'ناقص', missed: 'فائتة', excused: 'يوم عذر', today: 'اليوم',
    summary: 'آخر 30 يومًا: {c} يومًا كاملًا، {p} ناقصًا، {e} أيام عذر. المداومة: {s} يوم.', private: 'الحديقة على هذا الجهاز فقط ولا يراها غيرك.',
    open: 'افتح هذا اليوم', stage: ['بذرة', 'برعم', 'شتلة', 'شجرة صغيرة', 'شجرة', 'شجرة كبيرة'] },
  tr: { title: 'Namaz bahçesi', lead: 'Kılınan her namaz bir yapraktır; beş vaktin hepsinin kılındığı gün bitki çiçek açar. Mazeretli günlerde bitki dinlenir.',
    tree: 'Seri ağacı', days: 'gün', complete: 'Tam gün', partial: 'Yarım', missed: 'Kılınmayan', excused: 'Mazeretli gün', today: 'Bugün',
    summary: 'Son 30 gün: {c} tam gün, {p} yarım, {e} mazeretli. Seri: {s} gün.', private: 'Bahçe yalnızca bu cihazda ve yalnızca size görünür.',
    open: 'Bu günü aç', stage: ['Tohum', 'Filiz', 'Fidan', 'Genç ağaç', 'Ağaç', 'Büyük ağaç'] },
}
const fill = (s, o) => s.replace(/\{(\w)\}/g, (_, k) => o[k])

/** Seriyaya görə ağacın mərhələsi 0..5 (saf funksiya — test olunur) */
export function treeStage(streak) {
  const s = Math.max(0, streak | 0)
  return s === 0 ? 0 : s < 3 ? 1 : s < 7 ? 2 : s < 14 ? 3 : s < 30 ? 4 : 5
}

const COLS = 15
const CELL = 40
const ROW_H = 112

/** Bir gün — bitki. x,y — torpaq nöqtəsi. */
function Plant({ d, x, y, isToday, label, onPick }) {
  const leaves = []
  const total = d.performed + d.missed
  const stemH = d.state === 'excused' ? 22 : 14 + Math.min(5, Math.max(total, d.performed)) * 11
  // Yarpaqlar gövdə boyu növbə ilə sağa-sola; əvvəl qılınanlar, sonra qılınmayanlar
  for (let i = 0; i < total && d.state !== 'excused'; i++) {
    const missed = i >= d.performed
    const side = i % 2 ? -1 : 1
    const ly = y - 10 - i * 11
    leaves.push(
      <path key={i} className={`pg-leaf${missed ? ' is-missed' : ''}`} style={{ '--i': i }}
        d={missed
          ? `M ${x} ${ly} q ${side * 7} 2 ${side * 11} 9 q ${side * -6} -1 ${side * -11} -9 z`
          : `M ${x} ${ly} q ${side * 8} -9 ${side * 14} -4 q ${side * -5} 7 ${side * -14} 4 z`} />
    )
  }
  const topY = y - stemH
  return (
    <g className={`pg-plant pg-plant--${d.state}${isToday ? ' is-today' : ''}`} role="button" tabIndex={0}
      aria-label={label} onClick={onPick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick() } }}>
      <title>{label}</title>
      <rect x={x - CELL / 2} y={y - ROW_H + 8} width={CELL} height={ROW_H} className="pg-hit" />
      {isToday && <ellipse cx={x} cy={y + 2} rx="16" ry="5" className="pg-today-glow" />}
      <ellipse cx={x} cy={y + 1} rx="9" ry="2.6" className="pg-soil" />
      {d.state === 'none' ? (
        <circle cx={x} cy={y - 2} r="2.4" className="pg-seed" />
      ) : (
        <>
          <path className="pg-stem" d={`M ${x} ${y} C ${x - 2} ${y - stemH / 2} ${x + 2} ${y - stemH / 2} ${x} ${topY}`} style={{ '--len': stemH }} />
          {leaves}
          {d.state === 'complete' && (
            <g className="pg-flower" transform={`translate(${x} ${topY})`}>
              {[0, 72, 144, 216, 288].map(a => <ellipse key={a} rx="3.6" ry="6.4" cy="-5.4" transform={`rotate(${a})`} className="pg-petal" />)}
              <circle r="3" className="pg-core" />
            </g>
          )}
          {d.state === 'excused' && (
            <g className="pg-rest" transform={`translate(${x} ${topY - 10})`}>
              <path d="M 4 -5 a 6 6 0 1 0 0 10 a 4.6 4.6 0 1 1 0 -10 z" className="pg-moon" />
            </g>
          )}
        </>
      )}
    </g>
  )
}

/** Seriya ağacı (mərhələ 0..5) */
function Tree({ stage, x, y }) {
  const h = [10, 26, 44, 64, 86, 108][stage]
  const crown = [0, 8, 16, 24, 32, 40][stage]
  return (
    <g className={`pg-tree pg-tree--${stage}`}>
      <ellipse cx={x} cy={y + 2} rx={20 + stage * 4} ry="5" className="pg-soil" />
      {stage === 0 ? <circle cx={x} cy={y - 3} r="3.2" className="pg-seed" /> : (
        <>
          <path className="pg-trunk" d={`M ${x - 3 - stage} ${y} Q ${x} ${y - h * 0.6} ${x} ${y - h} Q ${x} ${y - h * 0.6} ${x + 3 + stage} ${y} z`} />
          {stage >= 2 && <path className="pg-branch" d={`M ${x} ${y - h * 0.55} q ${crown * 0.5} -${crown * 0.3} ${crown * 0.8} -${crown * 0.6}`} />}
          {stage >= 3 && <path className="pg-branch" d={`M ${x} ${y - h * 0.65} q -${crown * 0.5} -${crown * 0.3} -${crown * 0.8} -${crown * 0.55}`} />}
          <g className="pg-crown">
            <circle cx={x} cy={y - h} r={crown} />
            {stage >= 2 && <circle cx={x - crown * 0.7} cy={y - h + crown * 0.35} r={crown * 0.7} />}
            {stage >= 2 && <circle cx={x + crown * 0.7} cy={y - h + crown * 0.3} r={crown * 0.72} />}
          </g>
          {stage >= 4 && [[-0.4, -0.2], [0.35, 0.1], [0.05, -0.55], [-0.6, 0.35], [0.6, -0.25]].slice(0, stage - 2).map(([dx, dy], i) => (
            <circle key={i} cx={x + dx * crown} cy={y - h + dy * crown} r={2.6} className="pg-fruit" style={{ '--i': i }} />
          ))}
        </>
      )}
    </g>
  )
}

function PrayerGarden({ snap, periods, today, streak = 0, lang = 'az', onPick }) {
  const t = TXT[lang] || TXT.az
  const days = useMemo(() => lastNDays(today, 30).map(k => ({ key: k, ...dayState(snap, periods, k, today) })), [snap, periods, today])
  const counts = days.reduce((m, d) => { m[d.state] = (m[d.state] || 0) + 1; return m }, {})
  const stage = treeStage(streak)
  const TREE_W = 150
  const W = TREE_W + COLS * CELL + 10
  const H = ROW_H * 2 + 24
  const fmt = (k) => { const [, m, d] = k.split('-'); return `${Number(d)}.${m}` }
  const summary = fill(t.summary, { c: counts.complete || 0, p: counts.partial || 0, e: counts.excused || 0, s: streak })

  return (
    <section className="ui-card pg" aria-labelledby="pg-title">
      <div className="pg-head">
        <div>
          <h2 id="pg-title" className="pg-title">{t.title}</h2>
          <p className="pg-lead">{t.lead}</p>
        </div>
        <p className="pg-tree-label"><b className="ui-num">{streak}</b> {t.days} · {t.stage[stage]}</p>
      </div>
      <svg className="pg-svg" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={summary}>
        <defs>
          <linearGradient id="pg-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--pg-ground-top)" />
            <stop offset="1" stopColor="var(--pg-ground-bot)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1].map(r => <rect key={r} x="0" y={ROW_H * (r + 1) - 2 + r * 12} width={W} height="22" rx="11" fill="url(#pg-ground)" />)}
        <Tree stage={stage} x={TREE_W / 2} y={ROW_H * 2 + 10} />
        <text x={TREE_W / 2} y={H - 2} textAnchor="middle" className="pg-tree-cap">{t.tree}</text>
        {days.map((d, i) => {
          const r = Math.floor(i / COLS), c = i % COLS
          const x = TREE_W + c * CELL + CELL / 2
          const y = ROW_H * (r + 1) + r * 12
          const stateLabel = d.state === 'complete' ? t.complete : d.state === 'excused' ? t.excused : d.state === 'partial' ? t.partial : '—'
          const label = `${fmt(d.key)}: ${stateLabel}${d.state === 'partial' || d.state === 'complete' ? ` (${d.performed}/5${d.missed ? `, ${t.missed}: ${d.missed}` : ''})` : ''}${d.key === today ? ` · ${t.today}` : ''} — ${t.open}`
          return <Plant key={d.key} d={d} x={x} y={y} isToday={d.key === today} label={label} onPick={() => onPick?.(d.key)} />
        })}
      </svg>
      <ul className="pg-legend">
        <li><span className="pg-dot pg-dot--complete" />{t.complete}</li>
        <li><span className="pg-dot pg-dot--partial" />{t.partial}</li>
        <li><span className="pg-dot pg-dot--missed" />{t.missed}</li>
        <li><span className="pg-dot pg-dot--excused" />{t.excused}</li>
      </ul>
      <p className="pg-private">{t.private}</p>
    </section>
  )
}

export default memo(PrayerGarden)
