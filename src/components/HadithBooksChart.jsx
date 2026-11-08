// ═══════════════════════════════════════════════════════
// HadithBooksChart (v5.6) — "Kitablar bir baxışda" (/hadith-library)
//
//   <HadithBooksChart books={BOOKS} data={BOOK_DATA} lang="az" onOpen={(book, sec) => …} />
//
// • Solda: 9 kitab hədis sayına görə üfüqi sütunlarla (sayı — mənbənin,
//   fawazahmed0/hadith-api, nömrələməsi; data/hadithLibrary.js → total).
// • Sağda: seçilmiş kitabın bütün bölmələri bir zolaqda — hər seqmentin eni
//   bölmədəki hədis sayına mütənasib. Toxunuş/göstərici — bölmənin adı və
//   sayı; klik — həmin bölmə açılır. Bölmə adları mənbədə ingiliscədir.
// • Dərəcə bölgüsü burada YOXDUR: dərəcələr yalnız bölmə açılanda yüklənir
//   (bütün kitabı yükləmək lazım gələrdi) — təxmin göstərilmir.
// • Açılış: sütunlar növbə ilə uzanır, zolaq soldan sağa açılır.
// Stillər: src/styles/HadithBooksChart.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { pickUi } from '../utils/uiText'
import '../styles/HadithBooksChart.css'

const TXT = {
  az: { title: 'Kitablar bir baxışda', lead: 'Kitabların həcmi və bölmələri. Kitabı seçin — bölmələri zolaqda görünür; bölməyə toxunun və açın.', hadiths: (n) => `${n} hədis`, sections: (n) => `${n} bölmə`, sec: (n) => `Bölmə ${n}`, unsectioned: 'Bölməsiz hədislər', open: 'Bölməni aç', hint: 'Zolağın bir hissəsinə toxunun — bölmənin adı və hədis sayı', label: 'Hədis kitablarının həcm qrafiki' },
  en: { title: 'The books at a glance', lead: 'The size of each book and its chapters. Pick a book to see its chapters in the strip; tap a chapter to open it.', hadiths: (n) => `${n} hadiths`, sections: (n) => `${n} chapters`, sec: (n) => `Chapter ${n}`, unsectioned: 'Hadiths without a chapter', open: 'Open chapter', hint: 'Tap a segment — chapter name and number of hadiths', label: 'Chart of the size of the hadith books' },
  ru: { title: 'Книги одним взглядом', lead: 'Объём каждой книги и её разделы. Выберите книгу — её разделы появятся на полосе; нажмите на раздел, чтобы открыть его.', hadiths: (n) => `${n} хадисов`, sections: (n) => `${n} разделов`, sec: (n) => `Раздел ${n}`, unsectioned: 'Хадисы без раздела', open: 'Открыть раздел', hint: 'Нажмите на сегмент — название раздела и число хадисов', label: 'График объёма книг хадисов' },
  ar: { title: 'الكتب في لمحة', lead: 'حجم كل كتاب وكتبه الداخلية. اختر كتابًا لترى أبوابه في الشريط، والمس الباب لفتحه.', hadiths: (n) => `${n} حديثًا`, sections: (n) => `${n} كتابًا`, sec: (n) => `الكتاب ${n}`, unsectioned: 'أحاديث بلا كتاب', open: 'افتح الكتاب', hint: 'المس جزءًا — اسم الكتاب وعدد أحاديثه', label: 'رسم أحجام كتب الحديث' },
  tr: { title: 'Kitaplar bir bakışta', lead: 'Her kitabın hacmi ve bölümleri. Bir kitap seçin — bölümleri şeritte görünür; bölüme dokunup açın.', hadiths: (n) => `${n} hadis`, sections: (n) => `${n} bölüm`, sec: (n) => `Bölüm ${n}`, unsectioned: 'Bölümsüz hadisler', open: 'Bölümü aç', hint: 'Bir parçaya dokunun — bölümün adı ve hadis sayısı', label: 'Hadis kitaplarının hacim grafiği' },
}

const pick = (o, lang) => (o ? (o[lang] ?? o.en) : '')
/** Bölmənin hədis sayı: [№, ad, ilk, son, (bölməsiz say)] */
export const secCount = (s) => (s[4] != null ? s[4] : Math.max(0, s[3] - s[2] + 1))

export default function HadithBooksChart({ books = [], data = {}, lang = 'az', onOpen, fmt = (n) => String(n) }) {
  const t = pickUi(TXT, lang, 'en')
  const rows = useMemo(() => books.map(b => ({ b, d: data[b.key] })).filter(r => r.d).sort((x, y) => y.d.total - x.d.total), [books, data])
  const max = rows.length ? rows[0].d.total : 1
  const [sel, setSel] = useState(rows[0]?.b.key || '')
  const [seg, setSeg] = useState(null)
  const [shown, setShown] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') { setShown(true); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const cur = rows.find(r => r.b.key === sel) || rows[0]
  if (!cur) return null
  const secs = cur.d.sections.map(s => ({ n: s[0], name: s[1], c: secCount(s) })).filter(s => s.c > 0)
  const secTotal = secs.reduce((a, s) => a + s.c, 0) || 1
  const hov = seg != null ? secs[seg] : null

  return (
    <section className={`ui-card hbc${shown ? ' is-in' : ''}`} ref={ref} aria-labelledby="hbc-ttl">
      <div className="hbc-head">
        <h2 id="hbc-ttl" className="hbc-title">{t.title}</h2>
        <p className="hbc-lead">{t.lead}</p>
      </div>
      <div className="hbc-body">
        <ul className="hbc-bars" aria-label={t.label}>
          {rows.map(({ b, d }, i) => (
            <li key={b.key}>
              <button type="button" className={`hbc-bar${b.key === cur.b.key ? ' is-sel' : ''}`} aria-pressed={b.key === cur.b.key}
                onClick={() => { setSel(b.key); setSeg(null) }} style={{ '--w': `${(d.total / max) * 100}%`, '--i': i }}>
                <span className="hbc-bar__name">{pick(b.name, lang)}</span>
                <span className="hbc-bar__track"><span className="hbc-bar__fill" /></span>
                <b className="hbc-bar__n ui-num">{fmt(d.total)}</b>
              </button>
            </li>
          ))}
        </ul>
        <div className="hbc-strip-wrap">
          <p className="hbc-cur"><b>{pick(cur.b.name, lang)}</b> · {t.hadiths(fmt(cur.d.total))}{secs.length > 1 ? ` · ${t.sections(secs.length)}` : ''}</p>
          <div className="hbc-strip" dir="ltr" key={cur.b.key} onPointerLeave={(e) => { if (e.pointerType === 'mouse') setSeg(null) }}>
            {secs.map((s, i) => (
              <button key={`${s.n}-${i}`} type="button" className={`hbc-seg${i === seg ? ' is-hover' : ''}`}
                style={{ flexGrow: s.c, '--h': i % 2 ? 40 : 160, '--l': 34 + ((i * 13) % 24) }}
                aria-label={`${s.n ? t.sec(s.n) : t.unsectioned}${s.name ? ': ' + s.name : ''} — ${t.hadiths(s.c)}`}
                onPointerEnter={() => setSeg(i)} onFocus={() => setSeg(i)}
                onClick={() => { if (seg === i || !window.matchMedia?.('(pointer: coarse)').matches) onOpen?.(cur.b.key, s.n || null); else setSeg(i) }} />
            ))}
          </div>
          <p className="hbc-seginfo" aria-live="polite">
            {hov
              ? <><b>{hov.n ? t.sec(hov.n) : t.unsectioned}</b>{hov.name ? ` — ${hov.name}` : ''} · <span className="ui-num">{t.hadiths(hov.c)}</span> · <span className="hbc-pct ui-num">{((hov.c / secTotal) * 100).toFixed(1)}%</span></>
              : t.hint}
          </p>
          {hov && (
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm hbc-open" onClick={() => onOpen?.(cur.b.key, hov.n || null)}>{t.open}</button>
          )}
        </div>
      </div>
    </section>
  )
}
