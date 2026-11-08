// ═══════════════════════════════════════════════════════
// SurahRhythm (v5.6) — "Surənin ritmi": hər ayə bir sütun, hündürlüyü —
// ayədəki ərəbcə söz sayı (/quran/<surə>)
//
//   <SurahRhythm verses={[{ n, ar }]} madani={false} lang="az" onPick={(n) => goToAyah(n)} />
//
// • Bəqərənin uzun ayələri ilə Rəhmanın qısa, təkrarlanan ayələri bir
//   baxışda fərqlənir. Söz sayı mətnin özündən hesablanır (boşluqla ayrılan,
//   içində ərəb hərfi olan hissələr; vəqf işarələri sayılmır) — təxmin yox.
// • Toxunuş / göstərici — "Ayə N · X söz"; klik/Enter — həmin ayəyə keçid.
//   ← → düymələri ilə ayədən ayəyə.
// • Ekrana girəndə sütunlar soldan sağa "dalğa" kimi açılır (bir clip-path
//   animasiyası — 286 ayəlik surədə də yüngül).
// Stillər: src/styles/SurahRhythm.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { pickUi } from '../../utils/uiText'
import '../../styles/SurahRhythm.css'

const TXT = {
  az: { title: 'Surənin ritmi', lead: 'Hər sütun bir ayədir, hündürlüyü — ayədəki söz sayı. Toxunun — həmin ayəyə keçin.', ayah: (n) => `Ayə ${n}`, words: (w) => `${w} söz`, total: 'Cəmi söz', longest: 'Ən uzun ayə', shortest: 'Ən qısa ayə', avg: 'Orta', label: 'Surənin ayələrinin uzunluq qrafiki', go: 'Ayəyə keç' },
  en: { title: 'The rhythm of the surah', lead: 'Each bar is one ayah; its height is the number of words. Tap to jump to that ayah.', ayah: (n) => `Ayah ${n}`, words: (w) => `${w} words`, total: 'Total words', longest: 'Longest ayah', shortest: 'Shortest ayah', avg: 'Average', label: 'Chart of ayah lengths in this surah', go: 'Go to ayah' },
  ru: { title: 'Ритм суры', lead: 'Каждый столбик — один аят, высота — число слов в нём. Нажмите, чтобы перейти к аяту.', ayah: (n) => `Аят ${n}`, words: (w) => `${w} слов`, total: 'Всего слов', longest: 'Самый длинный аят', shortest: 'Самый короткий аят', avg: 'В среднем', label: 'График длины аятов суры', go: 'Перейти к аяту' },
  ar: { title: 'إيقاع السورة', lead: 'كل عمود آية، وارتفاعه عدد كلماتها. المس للانتقال إلى الآية.', ayah: (n) => `الآية ${n}`, words: (w) => `${w} كلمة`, total: 'مجموع الكلمات', longest: 'أطول آية', shortest: 'أقصر آية', avg: 'المتوسط', label: 'رسم أطوال آيات السورة', go: 'انتقل إلى الآية' },
  tr: { title: 'Surenin ritmi', lead: 'Her sütun bir ayettir; yüksekliği ayetteki kelime sayısıdır. Dokunun — o ayete gidin.', ayah: (n) => `Ayet ${n}`, words: (w) => `${w} kelime`, total: 'Toplam kelime', longest: 'En uzun ayet', shortest: 'En kısa ayet', avg: 'Ortalama', label: 'Suredeki ayetlerin uzunluk grafiği', go: 'Ayete git' },
}

const ARABIC_LETTER = /[ء-يٱ-ۓ]/
/** Saf funksiya (test olunur): ayədəki söz sayı */
export function wordCount(ar) {
  return String(ar || '').split(/\s+/).filter(w => ARABIC_LETTER.test(w)).length
}

const W = 600, H = 96

export default function SurahRhythm({ verses = [], madani = false, lang = 'az', onPick }) {
  const t = pickUi(TXT, lang, 'en')
  const rows = useMemo(() => verses.map(v => ({ n: v.n, w: wordCount(v.ar) })), [verses])
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(null)
  const [shown, setShown] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') { setShown(true); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [open])

  const stats = useMemo(() => {
    if (!rows.length) return null
    let lo = rows[0], hi = rows[0], sum = 0
    for (const r of rows) { sum += r.w; if (r.w > hi.w) hi = r; if (r.w < lo.w) lo = r }
    return { lo, hi, sum, avg: sum / rows.length, max: Math.max(1, hi.w) }
  }, [rows])

  if (!stats || rows.length < 3) return null
  const n = rows.length
  const bw = W / n
  const gap = bw > 4 ? Math.min(2, bw * 0.25) : 0
  const cur = hover != null ? rows[hover] : null

  const idxAt = (clientX) => {
    const r = ref.current?.querySelector('svg')?.getBoundingClientRect()
    if (!r) return null
    const i = Math.floor(((clientX - r.left) / r.width) * n)
    return Math.max(0, Math.min(n - 1, i))
  }
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const d = e.key === 'ArrowRight' ? 1 : -1
      setHover(h => Math.max(0, Math.min(n - 1, (h ?? -1) + d)))
    } else if ((e.key === 'Enter' || e.key === ' ') && hover != null) {
      e.preventDefault(); onPick?.(rows[hover].n)
    }
  }

  // Yığılmış: kiçik ritm önizləməsi olan düymə (surənin ilk ayəsi ekrandan itələnməsin)
  if (!open) {
    const step = Math.max(1, Math.ceil(n / 48))
    const mini = rows.filter((_, i) => i % step === 0)
    return (
      <button type="button" className={`srh-toggle${madani ? ' srh--madani' : ''}`} onClick={() => setOpen(true)} aria-expanded="false">
        <svg viewBox={`0 0 ${mini.length * 3} 20`} preserveAspectRatio="none" aria-hidden="true" className="srh-mini">
          {mini.map((r, i) => { const h = Math.max(2, (r.w / stats.max) * 20); return <rect key={i} x={i * 3} y={20 - h} width="2" height={h} rx="1" /> })}
        </svg>
        <span>{t.title}</span>
        <span className="srh-toggle__n ui-num">{t.words(stats.sum)}</span>
      </button>
    )
  }

  return (
    <section className={`ui-card srh${madani ? ' srh--madani' : ''}`} ref={ref} aria-labelledby="srh-ttl">
      <div className="srh-head">
        <h2 id="srh-ttl" className="srh-title">{t.title}</h2>
        <p className="srh-lead">{cur ? <b>{t.ayah(cur.n)} · {t.words(cur.w)}</b> : t.lead}</p>
      </div>
      <div className="srh-plot" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={`srh-svg${shown ? ' is-in' : ''}`}
          role="slider" aria-label={t.label} aria-valuemin={1} aria-valuemax={n}
          aria-valuenow={cur ? cur.n : 1} aria-valuetext={cur ? `${t.ayah(cur.n)} · ${t.words(cur.w)}` : t.label}
          tabIndex={0} onKeyDown={onKey}
          onPointerMove={(e) => setHover(idxAt(e.clientX))}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(null) }}
          onClick={(e) => { const i = idxAt(e.clientX); if (i != null) onPick?.(rows[i].n) }}>
          <g className="srh-bars">
            {rows.map((r, i) => {
              const h = Math.max(2, (r.w / stats.max) * (H - 4))
              return <rect key={r.n} className={`srh-bar${i === hover ? ' is-hover' : ''}${r === stats.hi ? ' is-max' : ''}`}
                x={i * bw + gap / 2} y={H - h} width={Math.max(0.6, bw - gap)} height={h} rx={bw > 6 ? 2 : 0} />
            })}
          </g>
          <line className="srh-avg" x1="0" x2={W} y1={H - (stats.avg / stats.max) * (H - 4)} y2={H - (stats.avg / stats.max) * (H - 4)} />
        </svg>
      </div>
      <ul className="srh-stats">
        <li><span>{t.total}</span><b className="ui-num">{stats.sum}</b></li>
        <li><button type="button" className="srh-jump" onClick={() => onPick?.(stats.hi.n)} title={t.go}><span>{t.longest}</span><b>{t.ayah(stats.hi.n)} · {t.words(stats.hi.w)}</b></button></li>
        <li><button type="button" className="srh-jump" onClick={() => onPick?.(stats.lo.n)} title={t.go}><span>{t.shortest}</span><b>{t.ayah(stats.lo.n)} · {t.words(stats.lo.w)}</b></button></li>
        <li><span>{t.avg}</span><b className="ui-num">{t.words(stats.avg.toFixed(1))}</b></li>
      </ul>
    </section>
  )
}
