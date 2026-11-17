// ═══════════════════════════════════════════════════════
// DuaGardenLife — ömürlük dua bağçası (/duajournal, /account)
//
//   <DuaGardenLife lang="az" duas={journalDuas} compact moreHref onMore />
//
// • Məlumat: utils/duaGardenLife (dua_garden_v1) — qəbul olunan hər dua bir çiçək; gündəlikdən
//   silinsə də çiçəyi qalır. Hər il bağçada bir pillə (ən yeni yuxarıda), çiçək ilin içindəki
//   gününə görə soldan sağa; altında fəsil zolaqları (qış · yaz · yay · payız).
// • Klaviatura: hər pillə düymədir → həmin ilin qəbul olunan duaları siyahıda (mətn gündəlikdəndir).
// • Yalnız bitki və həndəsə — canlı varlıq yoxdur. Animasiya bir dəfəlik, hərəkət azaldılıbsa yox.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { formatGregorian, parseGKey } from '../utils/hijri'
import { readGarden, syncGardenFromStorage, terraces, CATS, GARDEN_EVENT, GARDEN_KEY } from '../utils/duaGardenLife'
import '../styles/DuaGarden.css'

const T = {
  az: {
    title: 'Ömürlük dua bağçası', lead: 'Qəbul olunan hər dua bir çiçək açır. Hər il bağçada yeni bir pillədir.',
    empty: 'Hələ çiçək yoxdur. Duanız qəbul olunanda gündəlikdə «Qəbul oldu» düyməsini basın — burada çiçək açacaq.',
    total: (n, y) => `${n} çiçək · ${y} il`, terrace: (y, n) => `${y}: ${n} çiçək — duaları göstər`,
    listTitle: (y) => `${y} — qəbul olunan dualar`, removed: 'gündəlikdən silinib', close: 'Siyahını bağla',
    seasons: ['qış', 'yaz', 'yay', 'payız'], more: 'Dua gündəliyinə keç',
  },
  en: {
    title: 'Lifetime dua garden', lead: 'Every answered dua blooms into a flower. Each year is a new terrace in the garden.',
    empty: 'No flowers yet. When a dua is answered, press «Answered» in the journal — a flower will bloom here.',
    total: (n, y) => `${n} flowers · ${y} years`, terrace: (y, n) => `${y}: ${n} flowers — show the duas`,
    listTitle: (y) => `${y} — answered duas`, removed: 'removed from the journal', close: 'Close the list',
    seasons: ['winter', 'spring', 'summer', 'autumn'], more: 'Open the dua journal',
  },
  ru: {
    title: 'Сад дуа на всю жизнь', lead: 'Каждое принятое дуа расцветает цветком. Каждый год — новая терраса сада.',
    empty: 'Цветов пока нет. Когда дуа будет принято, нажмите «Отвечено» в дневнике — здесь распустится цветок.',
    total: (n, y) => `цветов: ${n} · лет: ${y}`, terrace: (y, n) => `${y}: цветов ${n} — показать дуа`,
    listTitle: (y) => `${y} — принятые дуа`, removed: 'удалено из дневника', close: 'Закрыть список',
    seasons: ['зима', 'весна', 'лето', 'осень'], more: 'Открыть дневник дуа',
  },
  ar: {
    title: 'حديقة الدعاء مدى العمر', lead: 'كل دعاء مستجاب يتفتح زهرة، وكل سنة مدرّج جديد في الحديقة.',
    empty: 'لا أزهار بعد. إذا استُجيب دعاء فاضغط «استُجيب» في المذكرة — وستتفتح هنا زهرة.',
    total: (n, y) => `${n} زهرة · ${y} سنوات`, terrace: (y, n) => `${y}: ${n} زهرة — اعرض الأدعية`,
    listTitle: (y) => `${y} — الأدعية المستجابة`, removed: 'حُذف من المذكرة', close: 'أغلق القائمة',
    seasons: ['الشتاء', 'الربيع', 'الصيف', 'الخريف'], more: 'افتح مذكرة الدعاء',
  },
  tr: {
    title: 'Ömür boyu dua bahçesi', lead: 'Kabul edilen her dua bir çiçek açar. Her yıl bahçede yeni bir teras olur.',
    empty: 'Henüz çiçek yok. Duan kabul edilince günlükte «Kabul edildi» düğmesine bas — burada bir çiçek açacak.',
    total: (n, y) => `${n} çiçek · ${y} yıl`, terrace: (y, n) => `${y}: ${n} çiçek — duaları göster`,
    listTitle: (y) => `${y} — kabul edilen dualar`, removed: 'günlükten silindi', close: 'Listeyi kapat',
    seasons: ['kış', 'ilkbahar', 'yaz', 'sonbahar'], more: 'Dua günlüğünü aç',
  },
}
const CAT_COLOR = { personal: 'var(--viz-1)', family: 'var(--viz-2)', health: 'var(--viz-3)', work: 'var(--viz-4)', ummah: 'var(--gold, #c59a2c)' }
const W = 600, ROW = 58, PAD = 64
// Fəsil zolaqları (ilin payı): qış (yan–fev), yaz, yay, payız, qış (dek)
const SEASON_BANDS = [[0, 59 / 365, 0], [59 / 365, 151 / 365, 1], [151 / 365, 243 / 365, 2], [243 / 365, 334 / 365, 3], [334 / 365, 1, 0]]

function readJournal() {
  try { return JSON.parse(localStorage.getItem('dua_journal') || 'null')?.duas || [] } catch { return [] }
}

export default function DuaGardenLife({ lang = 'az', duas = null, compact = false, moreHref, onMore }) {
  const t = pickUi(T, lang, 'en')
  const uid = useId().replace(/:/g, '')
  const [garden, setGarden] = useState(() => (typeof window === 'undefined' ? { v: 1, b: [] } : readGarden()))
  const [open, setOpen] = useState(null)
  useEffect(() => {
    if (!duas) setGarden(syncGardenFromStorage())
    const re = () => setGarden(readGarden())
    const onStorage = (e) => { if (!e.key || e.key === GARDEN_KEY) re() }
    window.addEventListener(GARDEN_EVENT, re)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(GARDEN_EVENT, re); window.removeEventListener('storage', onStorage) }
  }, [duas])

  const rows = useMemo(() => terraces(garden).reverse(), [garden])
  const textOf = useMemo(() => {
    const m = new Map()
    for (const d of duas || (open != null ? readJournal() : [])) if (d && d.id != null) m.set(String(d.id), d.text)
    return m
  }, [duas, open])
  const H = rows.length * ROW + 12
  const total = garden.b.length
  const openRow = rows.find((r) => r.year === open)

  return (
    <figure className={`ui-card dgl${compact ? ' dgl--compact' : ''}`} data-testid="dua-garden-life" data-flowers={total} data-reveal="fade">
      <figcaption className="dg__head">
        <span className="dg__title">{t.title}</span>
        <span className="dg__lead">{total ? t.total(total, rows.length) : t.lead}</span>
      </figcaption>
      {!total ? <p className="dg__note">{t.empty}</p> : (
        <>
          <svg className="dgl__svg" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`${t.title}: ${t.total(total, rows.length)}`}>
            <defs>
              <g id={`${uid}-f`}>
                {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-4.2" rx="2.6" ry="4.4" transform={`rotate(${a})`} />)}
                <circle r="2" className="dgl__core" />
              </g>
            </defs>
            {rows.map((r, ri) => {
              const y0 = ri * ROW + 6
              const ground = y0 + ROW - 12
              const span = W - PAD - 14
              return (
                <g key={r.year}>
                  <text x="8" y={ground - 10} className="dgl__year" aria-hidden="true">{r.year}</text>
                  <text x="8" y={ground + 6} className="dgl__count" aria-hidden="true">{r.flowers.length}</text>
                  <g className={`dgl__row${open === r.year ? ' is-open' : ''}`} role="button" tabIndex={0}
                  aria-label={t.terrace(r.year, r.flowers.length)} aria-expanded={open === r.year}
                  onClick={() => setOpen((o) => (o === r.year ? null : r.year))}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => (o === r.year ? null : r.year)) } }}>
                  <rect x="0" y={y0} width={W} height={ROW - 4} rx="10" className="dgl__hit" />
                  {SEASON_BANDS.map(([a, b, s], i) => (
                    <rect key={i} x={PAD + a * span} y={ground} width={(b - a) * span} height="8" className={`dgl__season dgl__season--${s}`} />
                  ))}
                  <path className="dgl__ridge" d={`M${PAD - 6},${ground} H${W - 8}`} />
                  {r.flowers.map((f, i) => {
                    const x = PAD + f.t * span + ((i % 3) - 1) * 2.5
                    const h = 12 + ((i * 7) % 4) * 4
                    return (
                      <g key={f.id} className="dgl__plant" style={{ '--i': Math.min(i, 40), color: CAT_COLOR[CATS[f.cat]] || CAT_COLOR.personal }}>
                        <path className="dg__stem" d={`M${x},${ground} V${ground - h}`} />
                        <use href={`#${uid}-f`} x={x} y={ground - h} className="dgl__flower" />
                      </g>
                    )
                  })}
                  </g>
                </g>
              )
            })}
          </svg>
          <p className="dgl__legend" aria-hidden="true">
            {t.seasons.map((s, i) => <span key={s}><i className={`dgl__sw dgl__season--${i}`} /> {s}</span>)}
          </p>
          {openRow && (
            <div className="dgl__list" aria-live="polite">
              <div className="dgl__list-head">
                <strong>{t.listTitle(openRow.year)}</strong>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setOpen(null)}>
                  <Icon name="close" className="ui-btn__icon" /> {t.close}
                </button>
              </div>
              <ul>
                {openRow.flowers.slice().reverse().map((f) => {
                  const g = parseGKey(f.day)
                  const text = textOf.get(f.id)
                  return (
                    <li key={f.id}>
                      <span className="dgl__dot" style={{ background: CAT_COLOR[CATS[f.cat]] }} aria-hidden="true" />
                      <span className={text ? '' : 'dgl__removed'}>{text ? text.slice(0, 140) : t.removed}</span>
                      <span className="dg__date ui-num"> · {g ? formatGregorian(g, lang) : f.day}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
      {moreHref && (
        <a className="ui-link dgl__more" href={moreHref} onClick={(e) => { if (onMore && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); onMore() } }}>
          {t.more} <Icon name="arrow" size={14} className="ui-flip-rtl" />
        </a>
      )}
    </figure>
  )
}
