import Icon from '../Icon'
import { pathFor } from '../../seo/routes'

/* ══════════════════════════════════════════════════════════════════
   Dərs blokları — src/data/lessons/README.md-dəki formatın göstərilməsi.
   Mətnlərin hamısı məlumatdandır; burada heç bir fakt əlavə olunmur.
   Hər blok tək komponentdir — başqa səhifələr də (Hisnul-Müslim, 40 hədis)
   eyni görünüşü işlədə bilər.
   ══════════════════════════════════════════════════════════════════ */

export const pick = (obj, lang) => (obj && (typeof obj === 'string' ? obj : (obj[lang] || obj.en || obj.az))) || ''

// "2:255" / "2:255-257" → Quran səhifəsindəki surəyə link
function ayahHref(ref, lang) {
  const n = Number(String(ref).split(':')[0])
  return Number.isInteger(n) && n >= 1 && n <= 114 ? pathFor('quran', lang, n) : null
}

const LBL = {
  az: { quran: 'Quran', grade: 'Dərəcəsi', source: 'Mənbə', translit: 'Oxunuşu', fatwa: 'Fətva' },
  en: { quran: 'Quran', grade: 'Grade', source: 'Source', translit: 'Transliteration', fatwa: 'Fatwa' },
  ru: { quran: 'Коран', grade: 'Степень', source: 'Источник', translit: 'Транслитерация', fatwa: 'Фетва' },
  ar: { quran: 'القرآن', grade: 'الدرجة', source: 'المصدر', translit: 'النطق', fatwa: 'الفتوى' },
  tr: { quran: 'Kur’an', grade: 'Derecesi', source: 'Kaynak', translit: 'Okunuşu', fatwa: 'Fetva' },
}

export function Block({ b, lang }) {
  const isAr = lang === 'ar'
  const L = LBL[lang] || LBL.en
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
        <div className="ls-table-wrap" tabIndex={0}>
          {/* 3+ sütunlu cədvəl telefonda kartlara çevrilir (LessonsPage.css → .ls-table--stack):
              hər xananın başlığı data-label-dən göstərilir */}
          <table className={`ls-table${b.head && b.head.length > 2 ? ' ls-table--stack' : ''}`}>
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
                <span>{pick(it.q, lang)}</span>
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
    default:
      return null
  }
}

export default function LessonBlocks({ blocks, lang }) {
  return <>{(blocks || []).map((b, i) => <Block key={i} b={b} lang={lang} />)}</>
}
