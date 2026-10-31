import { useEffect, useMemo, useState } from 'react'
import { guessLang } from '../utils/textLang'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReportErrorButton from '../components/ReportErrorButton'
import { NAWAWI_40, NAWAWI_INTRO, NAWAWI_SOURCES } from '../data/nawawi40'
import '../styles/Nawawi40Page.css'

/* ══════════════════════════════════════════════════════════════════
   İMAM ƏN-NƏVƏVİNİN 40 HƏDİSİ — /nawawi40
   Hər hədis: ərəb mətni, tərcümə, mənbə (ən-Nəvəvinin göstərdiyi kimi),
   dərəcə qeydi (alimlərin zəif saydığı hədislərdə) və əsas faydalar.
   Məlumat: src/data/nawawi40.js. Ünvan: /nawawi40#h-12 — həmin hədis açılır.
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: { eyebrow: 'Hədis', title: 'Ən-Nəvəvinin 40 hədisi', search: 'Hədis axtar...', clear: 'Axtarışı təmizlə', source: 'Mənbə', grade: 'Dərəcəsi', benefits: 'Faydaları', none: 'Heç nə tapılmadı.', open: 'Aç', close: 'Bağla', sources: 'Mənbələr', copy: 'Kopyala', copied: 'Kopyalandı', expandAll: 'Hamısını aç', collapseAll: 'Hamısını bağla' },
  en: { eyebrow: 'Hadith', title: 'An-Nawawi’s Forty Hadith', search: 'Search hadith...', clear: 'Clear search', source: 'Source', grade: 'Grade', benefits: 'Benefits', none: 'Nothing found.', open: 'Open', close: 'Close', sources: 'Sources', copy: 'Copy', copied: 'Copied', expandAll: 'Expand all', collapseAll: 'Collapse all' },
  ru: { eyebrow: 'Хадисы', title: '40 хадисов ан-Навави', search: 'Поиск хадиса...', clear: 'Очистить поиск', source: 'Источник', grade: 'Степень', benefits: 'Польза', none: 'Ничего не найдено.', open: 'Открыть', close: 'Закрыть', sources: 'Источники', copy: 'Копировать', copied: 'Скопировано', expandAll: 'Раскрыть все', collapseAll: 'Свернуть все' },
  ar: { eyebrow: 'الحديث', title: 'الأربعون النووية', search: 'ابحث في الأحاديث...', clear: 'مسح البحث', source: 'التخريج', grade: 'الدرجة', benefits: 'من فوائد الحديث', none: 'لم يُعثر على شيء.', open: 'فتح', close: 'إغلاق', sources: 'المصادر', copy: 'نسخ', copied: 'تم النسخ', expandAll: 'فتح الكل', collapseAll: 'إغلاق الكل' },
  tr: { eyebrow: 'Hadis', title: 'Nevevî’nin Kırk Hadisi', search: 'Hadis ara...', clear: 'Aramayı temizle', source: 'Kaynak', grade: 'Derecesi', benefits: 'Faydaları', none: 'Bir şey bulunamadı.', open: 'Aç', close: 'Kapat', sources: 'Kaynaklar', copy: 'Kopyala', copied: 'Kopyalandı', expandAll: 'Tümünü aç', collapseAll: 'Tümünü kapat' },
}

const pick = (o, lang) => (o && (o[lang] || o.en)) || ''
const HARAKAT = /[ً-ْٰـ]/g
const norm = (s, lang) => String(s || '').replace(HARAKAT, '').toLocaleLowerCase(lang)

export default function Nawawi40Page() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const isAr = lang === 'ar'
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(() => new Set())
  const [copied, setCopied] = useState(0)

  // #h-12 → 12-ci hədisi aç və ona sürüş
  useEffect(() => {
    const m = /^#h-(\d+)$/.exec(window.location.hash)
    if (!m) return
    const n = Number(m[1])
    setOpen(new Set([n]))
    requestAnimationFrame(() => document.getElementById(`h-${n}`)?.scrollIntoView({ block: 'start' }))
  }, [])

  const list = useMemo(() => {
    const s = norm(q.trim(), lang)
    if (!s) return NAWAWI_40
    return NAWAWI_40.filter(h => String(h.n) === s || [pick(h.title, lang), h.ar, pick(h.text, lang)].some(v => norm(v, lang).includes(s)))
  }, [q, lang])

  const toggle = (n) => setOpen(prev => {
    const next = new Set(prev)
    if (next.has(n)) next.delete(n); else next.add(n)
    return next
  })
  const allOpen = list.length > 0 && list.every(h => open.has(h.n))
  const copy = async (h) => {
    try {
      await navigator.clipboard.writeText([h.ar, !isAr && pick(h.text, lang), `— ${pick(h.src, lang)}`].filter(Boolean).join('\n\n'))
      setCopied(h.n)
      setTimeout(() => setCopied(c => (c === h.n ? 0 : c)), 1800)
    } catch { /* icazə yoxdur */ }
  }

  return (
    <div className="nw-page">
      <header className="ui-page-hero nw-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          {!isAr && <p className="nw-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الأربعون النووية</p>}
          <p className="ui-lead">{pick(NAWAWI_INTRO, lang)}</p>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container nw-layout">
          <div className="nw-toolbar">
            <div className="nw-search">
              <Icon name="search" size={19} className="nw-search__icon" />
              <input className="ui-input nw-search__input" type="search" aria-label={L.search} placeholder={L.search}
                enterKeyHint="search" value={q} onChange={e => setQ(e.target.value)} />
              {q && (
                <button type="button" className="ui-icon-btn nw-search__clear" onClick={() => setQ('')} aria-label={L.clear} title={L.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm"
              onClick={() => setOpen(allOpen ? new Set() : new Set(list.map(h => h.n)))}>
              <Icon name={allOpen ? 'minus' : 'plus'} className="ui-btn__icon" /> {allOpen ? L.collapseAll : L.expandAll}
            </button>
          </div>

          {list.length === 0 && <p className="nw-none" role="status">{L.none}</p>}
          <ol className="nw-list">
            {list.map(h => {
              const isOpen = open.has(h.n)
              return (
                <li key={h.n} id={`h-${h.n}`} className={`ui-card nw-item${isOpen ? ' is-open' : ''}`}>
                  <button type="button" className="nw-item__head" aria-expanded={isOpen} aria-controls={`h-${h.n}-body`} onClick={() => toggle(h.n)}>
                    <span className="nw-item__n ui-num">{h.n}</span>
                    <span className="nw-item__title">{pick(h.title, lang)}</span>
                    <Icon name="chevronDown" size={18} className="nw-item__chev" />
                  </button>
                  {isOpen && (
                    <div id={`h-${h.n}-body`} className="nw-item__body">
                      <p className="nw-item__ar ui-arabic" lang="ar" dir="rtl">{h.ar}</p>
                      {!isAr && <p className="nw-item__text">{pick(h.text, lang)}</p>}
                      <p className="nw-item__src"><strong>{L.source}:</strong> <cite>{pick(h.src, lang)}</cite></p>
                      {h.grade && <p className="nw-item__grade"><Icon name="info" size={15} /> <span><strong>{L.grade}:</strong> {pick(h.grade, lang)}</span></p>}
                      {(h.benefits?.[lang] || h.benefits?.en)?.length > 0 && (
                        <div className="nw-item__benefits">
                          <h3 className="nw-item__btitle">{L.benefits}</h3>
                          <ul>{(h.benefits[lang] || h.benefits.en).map((b, i) => <li key={i}>{b}</li>)}</ul>
                        </div>
                      )}
                      <div className="nw-item__actions">
                        <ReportErrorButton refText={`${L.title} №${h.n}`} kind="translation" />
                        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => copy(h)}>
                          <Icon name={copied === h.n ? 'check' : 'copy'} className="ui-btn__icon" /> {copied === h.n ? L.copied : L.copy}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          {NAWAWI_SOURCES?.length > 0 && (
            <section className="ui-card ui-card--sunken nw-sources" aria-labelledby="nw-sources-h">
              <h2 id="nw-sources-h" className="nw-sources__title">{L.sources}</h2>
              <ul>
                {NAWAWI_SOURCES.map((s, i) => (
                  <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto" lang={guessLang(s.label)}>{s.label}</a> : <span dir="auto" lang={guessLang(s.label)}>{s.label}</span>}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
