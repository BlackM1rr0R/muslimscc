import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { isPlainClick } from '../PageLink'
import { pathFor } from '../../seo/routes'
import { ChartFigure, BarChart, ColumnChart, Donut, StackedBar, Timeline, StatTile } from '../viz'
import { pickUi } from '../../utils/uiText'

/* ══════════════════════════════════════════════════════════════════
   Dərs blokları — src/data/lessons/README.md-dəki formatın göstərilməsi.
   Mətnlərin hamısı məlumatdandır; burada heç bir fakt əlavə olunmur.
   Hər blok tək komponentdir — başqa səhifələr də (Ramazan, Qiblə, Təqvim,
   Məscidlər, İanə, Sədəqə, Uşaqlar, Dua gündəliyi …) eyni bloku işlədir.
   Sinif adları (.ls-p, .ls-ayah, .ls-steps …) sabitdir — başqa səhifələrin
   CSS-i onlara istinad edir. Stillər: src/styles/LessonsPage.css.

   v3 yeni bloklar (vizual): stats · chart · timeline · links
   ══════════════════════════════════════════════════════════════════ */

export const pick = (obj, lang) => (obj && (typeof obj === 'string' ? obj : (pickUi(obj, lang, 'en') || obj.az))) || ''

// "2:255" / "2:255-257" → Quran səhifəsindəki surəyə link
function ayahHref(ref, lang) {
  const n = Number(String(ref).split(':')[0])
  return Number.isInteger(n) && n >= 1 && n <= 114 ? pathFor('quran', lang, n) : null
}

const LBL = {
  az: { quran: 'Quran', hadith: 'Hədis', quote: 'Alimin sözü', dua: 'Dua', grade: 'Dərəcəsi', source: 'Mənbə', translit: 'Oxunuşu', fatwa: 'Fətva', note: 'Qeyd', warn: 'Diqqət', tip: 'Faydalı', table: 'Cədvəl' },
  en: { quran: 'Quran', hadith: 'Hadith', quote: 'Scholar’s words', dua: 'Dua', grade: 'Grade', source: 'Source', translit: 'Transliteration', fatwa: 'Fatwa', note: 'Note', warn: 'Caution', tip: 'Tip', table: 'Table' },
  ru: { quran: 'Коран', hadith: 'Хадис', quote: 'Слова учёного', dua: 'Дуа', grade: 'Степень', source: 'Источник', translit: 'Транслитерация', fatwa: 'Фетва', note: 'Примечание', warn: 'Внимание', tip: 'Полезно', table: 'Таблица' },
  ar: { quran: 'القرآن', hadith: 'الحديث', quote: 'من كلام العلماء', dua: 'الدعاء', grade: 'الدرجة', source: 'المصدر', translit: 'النطق', fatwa: 'الفتوى', note: 'تنبيه', warn: 'تحذير', tip: 'فائدة', table: 'جدول' },
  tr: { quran: 'Kur’an', hadith: 'Hadis', quote: 'Âlimin sözü', dua: 'Dua', grade: 'Derecesi', source: 'Kaynak', translit: 'Okunuşu', fatwa: 'Fetva', note: 'Not', warn: 'Dikkat', tip: 'Faydalı', table: 'Tablo' },
}

// Blokun yuxarısındakı kiçik mono etiket ("QURAN", "HƏDİS") — ekran oxuyucu
// üçün təkrar olmasın deyə aria-hidden (mənbə figcaption-da oxunur)
function Kicker({ icon, children }) {
  return (
    <span className="ls-kicker" aria-hidden="true">
      <Icon name={icon} size={14} />
      {children}
    </span>
  )
}

// Daxili keçid: { page: 'learn', param?: 'mustalah', hash?: 'grades' } — SPA ilə;
// xarici: { href: 'https://…' } — yeni tabda
function LinksBlock({ b, lang }) {
  const navigate = useNavigate()
  return (
    <ul className="ui-list ls-links">
      {(b.items || []).map((it, i) => {
        const external = !!it.href
        const href = external ? it.href : `${pathFor(it.page, lang, it.param)}${it.hash ? `#${it.hash}` : ''}`
        const onClick = external ? undefined : (e) => {
          if (!isPlainClick(e)) return
          e.preventDefault()
          navigate(href)
        }
        return (
          <li key={i}>
            <a className="ui-list__item ls-links__item" href={href} onClick={onClick}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>
              <Icon name={it.icon || (external ? 'external' : it.page === 'learn' ? 'learn' : 'link')} size={18} />
              <span>
                {pick(it.title, lang)}
                {it.text && <small>{pick(it.text, lang)}</small>}
              </span>
              <Icon name={external ? 'external' : 'chevron'} size={16} className={`ui-list__chev${external ? '' : ' ui-flip-rtl'}`} />
            </a>
          </li>
        )
      })}
    </ul>
  )
}

function ChartBlock({ b, lang }) {
  const unit = pick(b.unit, lang)
  const fmt = (v, d) => (d && d.display ? pick(d.display, lang) : `${v}${unit ? ` ${unit}` : ''}`)
  const data = (b.data || []).map((d, i) => ({
    key: i, label: pick(d.label, lang), value: Number(d.value) || 0, display: d.display,
    tone: d.tone, muted: d.muted, current: d.current, note: d.note ? pick(d.note, lang) : undefined,
  }))
  const title = pick(b.title, lang)
  let chart
  switch (b.kind) {
    case 'column':
      chart = <ColumnChart data={data} format={fmt} label={title} />
      break
    case 'donut':
      chart = <Donut segments={data} format={fmt} label={title} size={b.size || 132}
        center={b.center ? { value: pick(b.center.value, lang), label: pick(b.center.label, lang) } : undefined} />
      break
    case 'stacked':
      chart = <StackedBar segments={data} format={fmt} label={title} />
      break
    default:
      chart = <BarChart data={data} format={fmt} label={title} max={b.max} />
  }
  return (
    <ChartFigure className={`ls-chart ls-chart--${b.kind || 'bar'}`} title={title}
      sub={b.sub ? pick(b.sub, lang) : undefined} note={b.note ? pick(b.note, lang) : undefined}>
      {chart}
    </ChartFigure>
  )
}

export function Block({ b, lang }) {
  const isAr = lang === 'ar'
  const L = pickUi(LBL, lang, 'en')
  switch (b.t) {
    case 'p':
      return <p className="ls-p">{pick(b.text, lang)}</p>
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul'
      return (
        <Tag className={`ls-list${b.ordered ? ' ls-list--ol' : ''}`}>
          {b.items.map((it, i) => <li key={i}>{pick(it, lang)}</li>)}
        </Tag>
      )
    }
    case 'steps':
      return (
        <ol className="ls-steps">
          {b.items.map((it, i) => (
            <li key={i} className="ls-step">
              <span className="ls-step__n ui-num" aria-hidden="true">{i + 1}</span>
              <div className="ls-step__body">
                {it.title && <strong className="ls-step__title">{pick(it.title, lang)}</strong>}
                {it.text && <p className="ls-step__text">{pick(it.text, lang)}</p>}
              </div>
            </li>
          ))}
        </ol>
      )
    case 'ayah': {
      const href = ayahHref(b.ref, lang)
      return (
        <figure className="ui-quote ls-ayah">
          <Kicker icon="quran">{L.quran}</Kicker>
          <blockquote>
            {b.ar && <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{b.ar}</p>}
            {!(isAr && b.ar) && <p className="ui-quote__text">{pick(b.text, lang)}</p>}
          </blockquote>
          <figcaption className="ui-quote__src">
            — {L.quran}, {href ? <a href={href} className="ls-ref" dir="ltr">{b.ref}</a> : <span dir="ltr">{b.ref}</span>}
          </figcaption>
        </figure>
      )
    }
    case 'hadith':
      return (
        <figure className="ui-quote ls-hadith">
          <Kicker icon="hadith">{L.hadith}</Kicker>
          <blockquote>
            {b.ar && <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{b.ar}</p>}
            {!(isAr && b.ar) && <p className="ui-quote__text">{pick(b.text, lang)}</p>}
          </blockquote>
          <figcaption className="ui-quote__src">
            — <cite>{pick(b.src, lang)}</cite>
            {b.grade && <span className="ls-grade"> · {L.grade}: {pick(b.grade, lang)}</span>}
          </figcaption>
        </figure>
      )
    case 'quote':
      return (
        <figure className="ui-quote ls-quote">
          <blockquote>
            {b.ar && <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{b.ar}</p>}
            {!(isAr && b.ar) && <p className="ui-quote__text">{pick(b.text, lang)}</p>}
          </blockquote>
          <figcaption className="ui-quote__src">— {pick(b.by, lang)}{b.ref && <>, <cite>{pick(b.ref, lang)}</cite></>}</figcaption>
        </figure>
      )
    case 'dua':
      return (
        <figure className="ui-card ls-dua">
          <Kicker icon="duas">{L.dua}</Kicker>
          <p className="ls-dua__ar ui-arabic" lang="ar" dir="rtl">{b.ar}</p>
          {!isAr && b.translit && <p className="ls-dua__tr"><span className="ui-sr-only">{L.translit}: </span>{pick(b.translit, lang)}</p>}
          {!isAr && <p className="ls-dua__text">{pick(b.text, lang)}</p>}
          {b.src && <figcaption className="ls-dua__src">{L.source}: <cite>{pick(b.src, lang)}</cite></figcaption>}
        </figure>
      )
    case 'note': {
      const kind = b.kind || 'info'
      const icon = kind === 'warn' ? 'alert' : kind === 'tip' ? 'bulb' : 'info'
      return (
        <div className={`ls-note ls-note--${kind}`} role="note">
          <Icon name={icon} size={18} className="ls-note__icon" />
          <p>{pick(b.text, lang)}</p>
        </div>
      )
    }
    case 'table':
      return (
        <div className="ls-table-wrap" tabIndex={0} role="region" aria-label={b.caption ? pick(b.caption, lang) : (b.head ? b.head.map(h => pick(h, lang)).join(' · ') : L.table)}>
          {/* 3+ sütunlu cədvəl telefonda kartlara çevrilir (LessonsPage.css → .ls-table--stack):
              hər xananın başlığı data-label-dən göstərilir */}
          <table className={`ls-table${b.head && b.head.length > 2 ? ' ls-table--stack' : ''}`}>
            {b.caption && <caption className="ls-table__cap">{pick(b.caption, lang)}</caption>}
            {b.head && (
              <thead><tr>{b.head.map((h, i) => <th key={i} scope="col">{pick(h, lang)}</th>)}</tr></thead>
            )}
            <tbody>
              {b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row">{pick(c, lang)}</th> : <td key={j} data-label={b.head ? pick(b.head[j], lang) : undefined}>{pick(c, lang)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )
    case 'qa':
      return (
        <div className="ls-qa">
          {b.items.map((it, i) => (
            <details key={i} className="ls-qa__item">
              <summary className="ls-qa__q">
                <span className="ls-qa__mark" aria-hidden="true">?</span>
                <span className="ls-qa__qtext">{pick(it.q, lang)}</span>
                <Icon name="chevronDown" size={18} className="ls-qa__chev" />
              </summary>
              <div className="ls-qa__a">
                <p>{pick(it.a, lang)}</p>
                {(it.ref || it.url) && (
                  <p className="ls-qa__ref">
                    {L.fatwa}:{' '}
                    {it.url
                      ? <a href={it.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{pick(it.ref, lang) || it.url}<Icon name="external" size={13} /></a>
                      : <cite>{pick(it.ref, lang)}</cite>}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      )

    /* ── v3: vizual bloklar ── */
    case 'stats':
      return (
        <div className="ls-stats">
          {b.title && <p className="ls-stats__title">{pick(b.title, lang)}</p>}
          <div className="ui-stats ls-stats__grid">
            {(b.items || []).map((it, i) => (
              <StatTile key={i} variant="sunken" tone={it.tone}
                value={pick(it.value, lang)} unit={it.unit ? pick(it.unit, lang) : undefined}
                label={pick(it.label, lang)} hint={it.hint ? pick(it.hint, lang) : undefined} />
            ))}
          </div>
          {b.note && <p className="ls-stats__note">{pick(b.note, lang)}</p>}
        </div>
      )
    case 'chart':
      return <ChartBlock b={b} lang={lang} />
    case 'timeline':
      return (
        <Timeline className="ls-timeline" headingLevel="h3"
          items={(b.items || []).map((it, i) => ({
            key: i, when: it.when == null ? null : pick(it.when, lang), title: pick(it.title, lang),
            text: it.text ? pick(it.text, lang) : undefined, highlight: it.highlight,
          }))} />
      )
    case 'links':
      return <LinksBlock b={b} lang={lang} />
    default:
      return null
  }
}

/* Ardıcıl dəlil blokları (ayə / hədis / dua) alt-alta uzun sütun yaratmasın —
   2+ olanda bir qrupa yığılır; LessonsPage.css → .ls-evgrid geniş ekranda
   onları yan-yana (2 sütun) düzür, telefonda tək sütundur. */
const EVIDENCE = new Set(['ayah', 'hadith', 'dua'])

export default function LessonBlocks({ blocks, lang }) {
  const list = blocks || []
  const out = []
  for (let i = 0; i < list.length; ) {
    if (EVIDENCE.has(list[i].t)) {
      let j = i
      while (j < list.length && EVIDENCE.has(list[j].t)) j++
      if (j - i >= 2) {
        out.push(
          <div key={i} className="ls-evgrid">
            {list.slice(i, j).map((b, k) => <Block key={i + k} b={b} lang={lang} />)}
          </div>
        )
        i = j
        continue
      }
    }
    out.push(<Block key={i} b={list[i]} lang={lang} />)
    i++
  }
  return <>{out}</>
}
