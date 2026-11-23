// ═══════════════════════════════════════════════════════
// YearBook — "Mənim ilim" kitabının səhifələri (ekranda önizləmə, çapda A4 səhifələr)
//
//   <YearBook book={buildYearBook(…)} t={YB[lang]} lang mode year include={{ quran: true, … }} showAmounts name today />
//
// • Üz qabığı (8 guşəli ulduz — xətti SVG, dekorativ), mündəricat + "il bir neçə rəqəmdə", bölmələr, yumşaq son səhifə.
// • Boş bölmə — sakit bir cümlə (heç bir müqayisə, sıralama, paylaşma yoxdur — kitab yalnız insanın özü üçündür).
// • İstifadəçi mətni (qeyd, dua) dir="auto" — ərəbcə/latınca qarışıq mətn düzgün axsın.
// • Tarixlər miladi göstərilir (formatGregorian — Intl-siz, dövrdə ucuz); üz qabığında aralıq hər iki təqvimdə.
// ═══════════════════════════════════════════════════════
import { formatGregorian, formatHijri, gregorianToHijri, parseGKey } from '../../utils/hijri'
import { surahLabel } from '../hifz/surahLabel'
import { stampName } from '../SpiritualPassport'
import { LIST_MAX } from '../../utils/yearBook'

export const SECTIONS = ['quran', 'hifz', 'notes', 'duas', 'ramadan', 'charity', 'stamps']
const RM_KEYS = ['f', 'x', 'q', 'su', 'k', 'dh', 'du', 'da', 'ii']

/** Bölmədə qeyd varmı */
export function sectionHas(book, key) {
  switch (key) {
    case 'quran': return book.khatms.length > 0 || book.surahs.length > 0
    case 'hifz': return book.hifz.length > 0
    case 'notes': return book.notes.length > 0
    case 'duas': return book.duas.length > 0
    case 'ramadan': return book.ramadan.length > 0
    case 'charity': return book.charity.count > 0
    case 'stamps': return book.stamps.length > 0
    default: return false
  }
}

const numFmt = new Map()
function fmtNum(n, lang) {
  let f = numFmt.get(lang)
  if (!f) { try { f = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }) } catch { f = new Intl.NumberFormat('en') } numFmt.set(lang, f) }
  return f.format(n)
}

/** 8 guşəli ulduz (xatəm) — iki kvadrat; dekorativ */
function Star({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect x="22" y="22" width="56" height="56" />
      <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="13" />
    </svg>
  )
}

function Mosaic({ read, label }) {
  const set = new Set(read)
  const COLS = 19, S = 14, G = 3
  return (
    <svg className="yb-mosaic" viewBox={`0 0 ${COLS * (S + G) - G} ${6 * (S + G) - G}`} role="img" aria-label={label} data-testid="yb-mosaic" data-read={read.length}>
      {Array.from({ length: 114 }, (_, i) => (
        <rect key={i} x={(i % COLS) * (S + G)} y={Math.floor(i / COLS) * (S + G)} width={S} height={S} rx="3"
          className={set.has(i + 1) ? 'is-read' : ''} />
      ))}
    </svg>
  )
}

function Sheet({ id, title, children, testid }) {
  return (
    <section className="yb-sheet" id={id} aria-labelledby={`${id}-h`} data-testid={testid}>
      <Star className="yb-sheet__star" />
      <h2 id={`${id}-h`} className="yb-sheet__h">{title}</h2>
      {children}
    </section>
  )
}

export default function YearBook({ book, t, lang, mode, year, include, showAmounts, name, today }) {
  const day = (d) => { const g = parseGKey(d); return g ? formatGregorian(g, lang) : d }
  const hday = (d) => { const g = parseGKey(d); return g ? formatHijri(gregorianToHijri(g), lang) : d }
  const secs = SECTIONS.filter((k) => include[k])
  const empty = <p className="yb-empty">{t.emptySec}</p>
  const title = mode === 'greg' ? t.coverG(year) : t.coverH(year)

  const body = {
    quran: (
      <>
        <p className="yb-lead">{book.khatms.length ? t.khatms(book.khatms.length) : t.noKhatm}</p>
        {book.khatms.length > 0 && (
          <ul className="yb-list">
            {book.khatms.map((k) => <li key={`${k.n}-${k.d}`}>{t.khatmOn(k.n, day(k.d))}</li>)}
          </ul>
        )}
        <h3 className="yb-sub">{t.mosaicH}</h3>
        <Mosaic read={book.surahs} label={t.mosaicAria(book.surahs.length)} />
        <p className="yb-lead">{t.mosaicCount(book.surahs.length)}</p>
        <p className="yb-note">{t.mosaicNote}</p>
        {book.ayahsLife > 0 && <p className="yb-note">{t.ayahsLife(fmtNum(book.ayahsLife, lang))}</p>}
      </>
    ),
    hifz: book.hifz.length ? (
      <>
        <p className="yb-lead">{t.hifzCount(book.hifz.length)}</p>
        <ul className="yb-list yb-list--cols">
          {book.hifz.map((h) => <li key={h.s}><b>{h.s}. {surahLabel(h.s, lang)}</b> <span className="yb-date">{day(h.d)}</span></li>)}
        </ul>
        <p className="yb-note">{t.hifzNote}</p>
      </>
    ) : empty,
    notes: book.notes.length ? (
      <>
        <p className="yb-lead">{t.notesCount(book.notes.length)}</p>
        <ul className="yb-entries">
          {book.notes.map((n) => (
            <li key={`${n.s}:${n.a}`} className={n.c ? `yb-entry yb-c-${n.c}` : 'yb-entry'}>
              <div className="yb-entry__meta"><b>{surahLabel(n.s, lang)} {n.s}:{n.a}</b> <span className="yb-date">{day(n.d)}</span></div>
              {n.t ? <p dir="auto" className="yb-entry__text">{n.t}</p> : <p className="yb-note">{t.highlight}</p>}
            </li>
          ))}
        </ul>
        {book.notes.length >= LIST_MAX && <p className="yb-note">{t.truncated(LIST_MAX)}</p>}
      </>
    ) : empty,
    duas: book.duas.length ? (
      <>
        <p className="yb-lead">{t.duasCount(book.duas.length)}</p>
        <ul className="yb-entries">
          {book.duas.map((d, i) => (
            <li key={`${d.d}-${i}`} className="yb-entry">
              <div className="yb-entry__meta"><span className="yb-date">{day(d.d)}</span> · <span>{t.cat[d.cat] || t.cat.personal}</span>
                {d.ans && <> · <b className="yb-ans">{d.ansD ? t.answeredOn(day(d.ansD)) : t.answered}</b></>}</div>
              <p dir="auto" className="yb-entry__text">{d.text}</p>
            </li>
          ))}
        </ul>
        {book.duas.length >= LIST_MAX && <p className="yb-note">{t.truncated(LIST_MAX)}</p>}
      </>
    ) : empty,
    ramadan: book.ramadan.length ? (
      <div className="yb-ramadan">
        {book.ramadan.map((c) => (
          <div key={c.y} className="yb-rm">
            <h3 className="yb-sub">{t.ramadanH(c.y)}</h3>
            <p className="yb-date">{t.coverRange(day(c.s), day(c.e))}</p>
            <ul className="yb-list">
              {RM_KEYS.filter((k) => c[k] > 0).map((k) => <li key={k}>{t.rm[k](c[k])}</li>)}
            </ul>
          </div>
        ))}
      </div>
    ) : empty,
    charity: book.charity.count ? (
      <>
        <p className="yb-private">{t.privateNote}</p>
        <p className="yb-lead">{t.charityCount(book.charity.count)}</p>
        <ul className="yb-list yb-list--cols">
          {book.charity.types.map((x) => (
            <li key={x.key}><b>{t.deed[x.key]}</b> · {fmtNum(x.count, lang)}{showAmounts && x.amount ? ` · ${fmtNum(x.amount, lang)}` : ''}</li>
          ))}
        </ul>
        {showAmounts
          ? (book.charity.withAmount > 0 && <p className="yb-note">{t.amountTotal(fmtNum(book.charity.amount, lang))} {t.noCurrency}</p>)
          : <p className="yb-note yb-noprint">{t.amountsHidden}</p>}
        <ul className="yb-entries yb-entries--compact">
          {book.charity.entries.map((e, i) => (
            <li key={`${e.d}-${i}`} className="yb-entry">
              <div className="yb-entry__meta"><span className="yb-date">{day(e.d)}</span> · <b>{t.deed[e.type]}</b>
                {showAmounts && e.amount ? <> · <span className="ui-num">{fmtNum(e.amount, lang)}</span></> : null}</div>
              {(e.to || e.desc) && <p dir="auto" className="yb-entry__text">{[e.to, e.desc].filter(Boolean).join(' — ')}</p>}
            </li>
          ))}
        </ul>
        {book.charity.count > book.charity.entries.length && <p className="yb-note">{t.truncated(LIST_MAX)}</p>}
      </>
    ) : empty,
    stamps: book.stamps.length ? (
      <>
        <p className="yb-lead">{t.stampsCount(book.stamps.length)}</p>
        <ul className="yb-stamps">
          {book.stamps.map((s) => (
            <li key={s.id} className="yb-stamp">
              <Star className="yb-stamp__star" />
              <b>{stampName(s.id, lang)}</b>
              <span className="yb-date">{t.stampOn(day(s.d))}</span>
            </li>
          ))}
        </ul>
      </>
    ) : empty,
  }

  return (
    <div className="yb-book" data-testid="yb-book" data-empty={book.empty ? '1' : '0'}>
      <section className="yb-sheet yb-cover" aria-labelledby="yb-cover-h" data-testid="yb-cover">
        <Star className="yb-cover__star" />
        <h2 id="yb-cover-h" className="yb-cover__title">{title}</h2>
        {name ? <p className="yb-cover__name" dir="auto">{name}</p> : null}
        <p className="yb-cover__range">{t.coverRange(day(book.from), day(book.to))}</p>
        <p className="yb-cover__range yb-cover__range--alt">{t.coverRange(hday(book.from), hday(book.to))}</p>
        <p className="yb-cover__note">{t.coverNote}</p>
      </section>

      <section className="yb-sheet" aria-labelledby="yb-toc-h" data-testid="yb-toc">
        <h2 id="yb-toc-h" className="yb-sheet__h">{t.toc}</h2>
        <ol className="yb-toc">
          {secs.map((k) => (
            <li key={k}><a href={`#yb-sec-${k}`}>{t.sec[k]}</a></li>
          ))}
        </ol>
        {book.empty && <p className="yb-empty" data-testid="yb-empty-all">{t.emptyAll}</p>}
        {book.glance.length > 0 && (
          <>
            <h3 className="yb-sub">{t.glanceH}</h3>
            <ul className="yb-list" data-testid="yb-glance">
              {book.glance.map((g) => <li key={g.k}>{t.glance[g.k](g.v)}</li>)}
            </ul>
          </>
        )}
      </section>

      {secs.map((k) => (
        <Sheet key={k} id={`yb-sec-${k}`} title={t.sec[k]} testid={`yb-sec-${k}`}>{body[k]}</Sheet>
      ))}

      <section className="yb-sheet yb-closing" aria-labelledby="yb-close-h" data-testid="yb-closing">
        <Star className="yb-closing__star" />
        <h2 id="yb-close-h" className="yb-sheet__h">{t.closingH}</h2>
        <p>{t.closing1}</p>
        <p>{t.closing2}</p>
        <p className="yb-note">{t.made(day(today))}</p>
      </section>
    </div>
  )
}
