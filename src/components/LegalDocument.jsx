import { Fragment, useEffect, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, filled, tr, brandName } from '../config/brand'
import { LEGAL_KEYS, LEGAL_TITLES, legalPath, isRouted } from './legalLinks'
import Breadcrumb from './Breadcrumb'
import Icon from './Icon'
import { ChartFigure, BarChart, ProgressBar } from './viz'
import '../styles/LegalPage.css'

// ═══════════════════════════════════════════════════════
// Hüquqi sənəd şablonu — Məxfilik siyasəti, İstifadə şərtləri, Mənbələr.
//
// Səhifə (PrivacyPage və s.) yalnız MƏTNİ verir: { eyebrow, title, lead,
// sections:[{ id, h, when?, body:[blok…] }] }. Bu komponent hero-nu,
// məzmun cədvəlini (geniş ekranda yapışqan, telefonda açılan siyahı),
// bölmə lövbərlərini, "Son yenilənmə" tarixini və çap düyməsini qurur.
//
// Bloklar:
//   'mətn'                        → <p>
//   { ul: ['…', '…'] }            → siyahı
//   { table: { head:[…], rows:[[…]] } } → cədvəl (telefonda üfüqi sürüşür)
//   { note: '…' }                 → sakit qeyd qutusu
//   { contact: true }             → əlaqə siyahısı (BRAND.legal + Instagram)
//   { credits: [{ name, url, by, license, licenseUrl, note }] } → mənbə kartları
//   istənilən blokda when: 'email' | 'noEmail' | 'operator' | 'country' —
//   BRAND.legal-da həmin sahə boşdursa blok (bölmədə isə bütün bölmə) gizlənir.
//
// Sətirdaxili işarələmə (mətnlər sadə qalsın deyə):
//   **qalın**, [mətn](https://…) — xarici link (yeni tabda),
//   [mətn](#bolme) — eyni səhifədə lövbər, [mətn](page:terms) — saytdaxili link.
//   Yer tutucular: {brand} {domain} {operator} {email} {country} {instagram}
// ═══════════════════════════════════════════════════════

const L = {
  az: { crumbs: 'Hüquqi məlumat', updated: 'Son yenilənmə', toc: 'İçindəkilər', print: 'Çap et', other: 'Digər hüquqi sənədlər', email: 'E-poçt', operator: 'Xidməti idarə edən', instagram: 'Instagram', site: 'Sayt', license: 'Lisenziya', source: 'Mənbə', top: 'Yuxarı qayıt' },
  en: { crumbs: 'Legal', updated: 'Last updated', toc: 'Contents', print: 'Print', other: 'Other legal documents', email: 'Email', operator: 'Operated by', instagram: 'Instagram', site: 'Website', license: 'License', source: 'Source', top: 'Back to top' },
  ru: { crumbs: 'Правовая информация', updated: 'Последнее обновление', toc: 'Содержание', print: 'Распечатать', other: 'Другие правовые документы', email: 'Эл. почта', operator: 'Оператор сервиса', instagram: 'Инстаграм', site: 'Сайт', license: 'Лицензия', source: 'Источник', top: 'Наверх' },
  ar: { crumbs: 'معلومات قانونية', updated: 'آخر تحديث', toc: 'المحتويات', print: 'طباعة', other: 'وثائق قانونية أخرى', email: 'البريد الإلكتروني', operator: 'الجهة المشغِّلة', instagram: 'إنستغرام', site: 'الموقع', license: 'الترخيص', source: 'المصدر', top: 'العودة إلى الأعلى' },
  tr: { crumbs: 'Yasal bilgiler', updated: 'Son güncelleme', toc: 'İçindekiler', print: 'Yazdır', other: 'Diğer yasal belgeler', email: 'E-posta', operator: 'Hizmeti yürüten', instagram: 'Instagram', site: 'Site', license: 'Lisans', source: 'Kaynak', top: 'Başa dön' },
}

// Dizayn v3: hero rəqəmləri, oxu irəliləyişi, lisenziya bölgüsü qrafiki
const L3 = {
  az: { sections: 'bölmə', minutes: 'dəq oxu', sources: 'mənbə', progress: 'Oxu irəliləyişi', of: (a, b) => `${a} / ${b}`,
    chart: 'Mənbələr lisenziyaya görə', chartSub: 'mənbə sayı', chartNote: 'Bu səhifədəki kartlardan avtomatik sayılır.',
    fam: { open: 'Açıq məlumat ({cc}, {odbl})', font: 'Şrift lisenziyası ({ofl})', code: 'Proqram ({mit}, {apache})', rights: 'Hüquq müəllifə məxsus' } },
  en: { sections: 'sections', minutes: 'min read', sources: 'sources', progress: 'Reading progress', of: (a, b) => `${a} / ${b}`,
    chart: 'Sources by licence', chartSub: 'number of sources', chartNote: 'Counted automatically from the cards on this page.',
    fam: { open: 'Open data ({cc}, {odbl})', font: 'Font licence ({ofl})', code: 'Software ({mit}, {apache})', rights: 'Rights held by the author' } },
  ru: { sections: 'разделов', minutes: 'мин чтения', sources: 'источников', progress: 'Прогресс чтения', of: (a, b) => `${a} / ${b}`,
    chart: 'Источники по лицензиям', chartSub: 'число источников', chartNote: 'Подсчитано автоматически по карточкам на этой странице.',
    fam: { open: 'Открытые данные ({cc}, {odbl})', font: 'Шрифтовая лицензия ({ofl})', code: 'Программы ({mit}, {apache})', rights: 'Права у автора' } },
  ar: { sections: 'أقسام', minutes: 'دقائق قراءة', sources: 'مصدرًا', progress: 'تقدّم القراءة', of: (a, b) => `${a} / ${b}`,
    chart: 'المصادر حسب الترخيص', chartSub: 'عدد المصادر', chartNote: 'يُحسب تلقائيًا من البطاقات في هذه الصفحة.',
    fam: { open: 'بيانات مفتوحة ({cc} و{odbl})', font: 'ترخيص خطوط ({ofl})', code: 'برمجيات ({mit} و{apache})', rights: 'الحقوق لأصحابها' } },
  tr: { sections: 'bölüm', minutes: 'dk okuma', sources: 'kaynak', progress: 'Okuma ilerlemesi', of: (a, b) => `${a} / ${b}`,
    chart: 'Lisansa göre kaynaklar', chartSub: 'kaynak sayısı', chartNote: 'Bu sayfadaki kartlardan otomatik sayılır.',
    fam: { open: 'Açık veri ({cc}, {odbl})', font: 'Yazı tipi lisansı ({ofl})', code: 'Yazılım ({mit}, {apache})', rights: 'Haklar sahibine ait' } },
}

// Lisenziya adları — xüsusi isimlər, mətndə {cc} kimi yazılır
const LIC_NAMES = { cc: 'CC', odbl: 'ODbL', ofl: 'OFL', mit: 'MIT', apache: 'Apache' }
const famLabel = (str) => str.replace(/\{(\w+)\}/g, (m, k) => LIC_NAMES[k] ?? m)

// Lisenziya adı → ailə (qrafik 4 kateqoriyadan çox olmasın — DESIGN.md §5)
function licenseFamily(lic) {
  const x = String(lic || '').toLowerCase()
  if (!x) return 'rights'
  if (x.includes('cc ') || x.startsWith('cc') || x.includes('odbl') || x.includes('creative')) return 'open'
  if (x.includes('ofl') || x.includes('font')) return 'font'
  if (x.includes('mit') || x.includes('apache') || x.includes('bsd') || x.includes('isc')) return 'code'
  return 'rights'
}

// Sənədin bütün mətni (oxu müddəti üçün) — sətirlər, siyahılar, cədvəllər, kartlar
function docText(sections) {
  const out = []
  const walk = (b) => {
    if (b == null) return
    if (typeof b === 'string') { out.push(b); return }
    if (Array.isArray(b)) { b.forEach(walk); return }
    if (typeof b === 'object') {
      if (b.p) walk(b.p)
      if (b.li) walk(b.li)
      if (b.ul) walk(b.ul)
      if (b.note) walk(b.note)
      if (b.table) { walk(b.table.head); b.table.rows.forEach(walk) }
      if (b.credits) b.credits.forEach(c => out.push([c.name, c.by, c.note].map(v => (v && typeof v === 'object') ? Object.values(v)[0] : v).filter(Boolean).join(' ')))
    }
  }
  sections.forEach(s => { out.push(s.h); walk(s.body) })
  return out.join(' ')
}

const DATE_LOCALE = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar', tr: 'tr-TR' }

const isPlainClick = (e) => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

/** BRAND.legal sahələri — boş sətir/obyekt "yox" sayılır */
function legalValues(lang) {
  const lg = BRAND.legal || {}
  return {
    brand: brandName(lang),
    domain: BRAND.domain,
    operator: filled(lg.operator) ? tr(lg.operator, lang) : '',
    email: filled(lg.email) ? String(lg.email).trim() : '',
    country: filled(lg.country) ? tr(lg.country, lang) : '',
    instagram: filled(BRAND.instagram) ? BRAND.instagram : '',
  }
}

function passes(when, v) {
  if (!when) return true
  if (when === 'noEmail') return !v.email
  return Boolean(v[when])
}

// Xidmət və layihə adları — xüsusi isimlərdir, tərcümə olunmur. Mətnlərdə
// {cloudflare} kimi yazılır: ad bir yerdə saxlanılır (dəyişsə, bir sətir).
export const NAMES = {
  cloudflare: 'Cloudflare',
  firebase: 'Google Firebase',
  firestore: 'Cloud Firestore',
  fcm: 'Firebase Cloud Messaging',
  // Brauzerlərin öz push xidmətləri (Web Push — server/push.js → PUSH_HOSTS)
  pushsvc: 'Google, Mozilla, Apple, Microsoft',
  openrouter: 'OpenRouter',
  gemini: 'Google Gemini',
  aladhan: 'AlAdhan',
  alquran: 'AlQuran Cloud',
  islamicnetwork: 'Islamic Network',
  qurancom: 'Quran.com',
  overpass: 'Overpass API',
  overpassmirror: 'overpass.kumi.systems',
  osm: 'OpenStreetMap',
  openmeteo: 'Open-Meteo',
  geonames: 'GeoNames',
  exchangerate: 'ExchangeRate-API',
  youtube: 'YouTube',
  gmaps: 'Google Maps',
  nginx: 'nginx',
  docker: 'Docker',
  tanzil: 'Tanzil',
  letsencrypt: 'Let’s Encrypt',
  odbl: 'ODbL',
  ccby4: 'CC BY 4.0',
  ccby3: 'CC BY 3.0',
  ofl: 'SIL Open Font License 1.1',
  localstorage: 'localStorage',
  sessionstorage: 'sessionStorage',
  sw: 'service worker',
  ip: 'IP',
  gdpr: 'GDPR',
}

// Şərtli bloklar üçün sabitlər (mətn obyektlərində sətir yazılmasın deyə —
// dil yoxlayıcısı dil açarı altındakı hər sətri mətn sayır)
export const IF_EMAIL = 'email'
export const IF_NO_EMAIL = 'noEmail'
export const IF_OPERATOR = 'operator'
export const IF_COUNTRY = 'country'

// Link hədəfləri də yer tutucu ilə yazılır: {toContact} → '#contact' (lövbər),
// {toTerms} → 'page:terms' (digər hüquqi sənəd)
function linkTarget(k) {
  const id = k.slice(2, 3).toLowerCase() + k.slice(3)
  return LEGAL_KEYS.includes(id) ? `page:${id}` : `#${id}`
}

function fill(str, v) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => {
    if (k in v) return v[k] || ''
    if (/^to[A-Z]/.test(k)) return linkTarget(k)
    return NAMES[k] ?? m
  })
}

const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']

function formatDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''))
  if (!m) return ''
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  // Bir çox brauzerdə az-Latn ay adları yoxdur ("2026 M10 30" çıxırdı)
  if (lang === 'az') return `${+m[3]} ${AZ_MONTHS[+m[2] - 1]} ${m[1]}`
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE[lang] || lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)
  } catch {
    return iso
  }
}

/** Bölməyə hamar keçid; URL-də #lövbər qalır (replaceState — marşrut dəyişmir) */
function jumpTo(id) {
  const el = typeof document !== 'undefined' && document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  try { history.replaceState(history.state, '', `#${id}`) } catch { /* köhnə brauzer */ }
  // Klaviatura istifadəçisi üçün fokus bölməyə keçsin
  el.focus?.({ preventScroll: true })
}

// ── Sətirdaxili işarələmə ──
const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g

function Inline({ text, v, lang, setPage }) {
  const s = fill(text, v)
  const out = []
  let last = 0
  let m
  INLINE.lastIndex = 0
  while ((m = INLINE.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    if (m[1]) {
      out.push(<strong key={m.index}>{m[1]}</strong>)
    } else {
      const label = m[2]
      const href = m[3]
      if (href.startsWith('#')) {
        out.push(<a key={m.index} href={href} onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); jumpTo(href.slice(1)) } }}>{label}</a>)
      } else if (href.startsWith('page:')) {
        const key = href.slice(5)
        out.push(
          <a
            key={m.index}
            href={legalPath(key, lang)}
            onClick={(e) => { if (setPage && isRouted(key) && isPlainClick(e)) { e.preventDefault(); setPage(key) } }}
          >{label}</a>,
        )
      } else {
        out.push(<a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className="lg-ext">{label}</a>)
      }
    }
    last = INLINE.lastIndex
  }
  if (last < s.length) out.push(s.slice(last))
  return <>{out}</>
}

function Block({ b, v, lang, t, setPage }) {
  const I = (text) => <Inline text={text} v={v} lang={lang} setPage={setPage} />
  if (typeof b === 'string') return <p>{I(b)}</p>
  if (!passes(b.when, v)) return null
  if (b.p) return <p>{I(b.p)}</p>
  if (b.ul) return <ul>{b.ul.filter(x => typeof x === 'string' || passes(x.when, v)).map((x, i) => <li key={i}>{I(typeof x === 'string' ? x : x.li)}</li>)}</ul>
  if (b.note) return <p className="lg-note"><Icon name="info" size={18} className="lg-note__icon" />{' '}<span>{I(b.note)}</span></p>
  if (b.table) {
    return (
      <div className="lg-table-wrap" role="region" aria-label={b.table.caption ? fill(b.table.caption, v) : undefined} tabIndex={0}>
        <table className="lg-table">
          {b.table.caption && <caption>{fill(b.table.caption, v)}</caption>}
          <thead><tr>{b.table.head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {b.table.rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row">{I(c)}</th> : <td key={j}>{I(c)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (b.contact) {
    return (
      <dl className="lg-contact">
        {v.operator && <div><dt>{t.operator}</dt><dd>{v.operator}</dd></div>}
        {v.email && <div><dt>{t.email}</dt><dd><a href={`mailto:${v.email}`}>{v.email}</a></dd></div>}
        {v.instagram && (
          <div>
            <dt>{t.instagram}</dt>
            <dd><a href={`https://instagram.com/${v.instagram}`} target="_blank" rel="noopener noreferrer" className="lg-ltr">@{v.instagram}</a></dd>
          </div>
        )}
        <div><dt>{t.site}</dt><dd><a href={BRAND.url} className="lg-ltr">{BRAND.domain}</a></dd></div>
      </dl>
    )
  }
  if (b.credits) {
    return (
      <ul className="lg-credits">
        {b.credits.map((raw, i) => {
          // Sahələr ya sətir, ya 5 dilli obyekt ola bilər
          const c = { ...raw, name: tr(raw.name, lang), by: tr(raw.by, lang), note: tr(raw.note, lang) }
          return (
          // Açarda indeks də var: bir neçə mənbə eyni URL-i paylaşır
          // (məs. alquran.cloud/translations) — React təkrar açar xətası verirdi
          <li key={`${i}-${raw.url || c.name}`} className="lg-credit">
            <div className="lg-credit__head">
              <span className="lg-credit__name">
                {c.url
                  ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="lg-ext">{c.name}</a>
                  : c.name}
              </span>
              {c.license && (
                <span className="ui-badge lg-credit__lic">
                  {c.licenseUrl
                    ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer"><span className="qm-sr-only">{t.license}: </span>{c.license}</a>
                    : <><span className="qm-sr-only">{t.license}: </span>{c.license}</>}
                </span>
              )}
            </div>
            {c.by && <p className="lg-credit__by">{I(c.by)}</p>}
            {c.note && <p className="lg-credit__note">{I(c.note)}</p>}
          </li>
          )
        })}
      </ul>
    )
  }
  return null
}

/**
 * @param {{ docKey: 'privacy'|'terms'|'licenses', doc: object, setPage?: (k:string)=>void }} props
 *   doc — cari dildə sənəd: { eyebrow?, title, lead, sections:[…] }
 */
export default function LegalDocument({ docKey, doc, setPage }) {
  const { lang } = useLang()
  const t = L[lang] || L.az
  const v = legalValues(lang)
  const sections = Object.entries(doc.sections)
    .map(([id, s]) => ({ id, ...s }))
    .filter(s => passes(s.when, v))
  const date = BRAND.legal?.effectiveDate
  const [active, setActive] = useState(sections[0]?.id)
  const articleRef = useRef(null)

  // Ünvanda #lövbər varsa (paylaşılan link) — məzmun qurulandan sonra ora get
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    const tm = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) { el.scrollIntoView({ block: 'start' }); setActive(id) }
    }, 60)
    return () => clearTimeout(tm)
  }, [])

  // Məzmun cədvəlində cari bölmə vurğulansın (yüngül scrollspy)
  useEffect(() => {
    const root = articleRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const els = [...root.querySelectorAll('.lg-section[id]')]
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActive(vis[0].target.id)
    }, { rootMargin: '-15% 0px -70% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [lang, docKey])

  // Geniş ekranda məzmun cədvəli üfüqi çip zolağıdır — cari bölmənin çipi
  // zolağın görünən hissəsində qalsın (yalnız üfüqi sürüşmə, səhifə tərpənmir)
  const sideTocRef = useRef(null)
  useEffect(() => {
    const list = sideTocRef.current?.querySelector('.lg-toc__list')
    const a = list?.querySelector('a[aria-current]')
    if (!list || !a || list.scrollWidth <= list.clientWidth) return
    const lr = list.getBoundingClientRect()
    const ar = a.getBoundingClientRect()
    if (ar.left < lr.left + 16 || ar.right > lr.right - 24) {
      list.scrollLeft += (ar.left + ar.width / 2) - (lr.left + lr.width / 2)
    }
  }, [active])

  const tocLinks = (
    <ol className="lg-toc__list">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            aria-current={active === s.id ? 'location' : undefined}
            onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); setActive(s.id); jumpTo(s.id) } }}
          >
            <span className="lg-toc__num ui-num">{i + 1}</span>
            <span>{s.h}</span>
          </a>
        </li>
      ))}
    </ol>
  )

  const others = LEGAL_KEYS.filter(k => k !== docKey)
  const t3 = L3[lang] || L3.az
  // Oxu müddəti: ~200 söz/dəq (ərəbcə də təxminən eyni), ən azı 1 dəq
  const words = docText(sections).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  // Mənbə kartları (yalnız "Mənbələr" sənədində olur) → lisenziya ailələri
  const credits = sections.flatMap(s => s.body.filter(b => b && b.credits).flatMap(b => b.credits))
  const famCount = credits.reduce((acc, c) => { const f = licenseFamily(c.license); acc[f] = (acc[f] || 0) + 1; return acc }, {})
  const famBars = ['open', 'font', 'code', 'rights']
    .filter(f => famCount[f])
    .map((f, i) => ({ key: f, label: famLabel(t3.fam[f]), value: famCount[f], tone: i + 1 }))
  const activeIdx = Math.max(0, sections.findIndex(s => s.id === active))

  return (
    <div className="lg-root">
      <header className={`ui-page-hero lg-hero${famBars.length ? ' ui-page-hero--split' : ''}`}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
          <div className="ui-page-hero__crumbs"><Breadcrumb setPage={setPage} current={doc.title} /></div>
          <span className="ui-eyebrow">{doc.eyebrow || t.crumbs}</span>
          <h1 className="ui-display">{doc.title}</h1>
          {doc.lead && <p className="ui-lead"><Inline text={doc.lead} v={v} lang={lang} setPage={setPage} /></p>}
          <div className="lg-hero__meta">
            {date && (
              <span className="lg-updated">
                {t.updated}: <time dateTime={date}>{formatDate(date, lang)}</time>
              </span>
            )}
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm lg-print" onClick={() => window.print()}>
              {t.print}
            </button>
          </div>
          <ul className="ui-page-hero__stats lg-stats">
            <li><b>{sections.length}</b><span>{t3.sections}</span></li>
            <li><b>~{minutes}</b><span>{t3.minutes}</span></li>
            {credits.length > 0 && <li><b>{credits.length}</b><span>{t3.sources}</span></li>}
          </ul>
          </div>
          {famBars.length > 0 && (
            <div className="ui-page-hero__aside lg-hero__aside">
              <ChartFigure title={t3.chart} sub={t3.chartSub} note={t3.chartNote}>
                <BarChart data={famBars} label={t3.chart} labelWidth="52%" />
              </ChartFigure>
            </div>
          )}
        </div>
      </header>

      <div className="ui-container lg-layout">
        <aside className="lg-aside">
          {/* Geniş ekran: yapışqan siyahı */}
          <nav className="lg-toc lg-toc--side" aria-label={t.toc} ref={sideTocRef}>
            <p className="lg-toc__title">
              <span>{t.toc}</span>
              <span className="lg-toc__pos ui-num" aria-hidden="true">{t3.of(activeIdx + 1, sections.length)}</span>
            </p>
            <ProgressBar value={activeIdx + 1} max={sections.length} size="sm" label={t3.progress} className="lg-toc__meter" />
            {tocLinks}
          </nav>
          {/* Telefon/planşet: açılan siyahı (eyni linklər) */}
          <details className="lg-toc lg-toc--inline">
            <summary className="lg-toc__title">{t.toc} <Icon name="chevron" size={16} className="lg-toc__chev" /></summary>
            <nav aria-label={t.toc}>{tocLinks}</nav>
          </details>
        </aside>

        <article className="lg-article" ref={articleRef}>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="lg-section" tabIndex={-1} aria-labelledby={`${s.id}-h`} data-reveal="fade">
              <h2 id={`${s.id}-h`} className="lg-h2">
                <span className="lg-h2__num ui-num" aria-hidden="true">{i + 1}.</span>
                <span>{s.h}</span>
                <a className="lg-anchor" href={`#${s.id}`} aria-hidden="true" tabIndex={-1}
                  onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); jumpTo(s.id) } }}>#</a>
              </h2>
              {s.body.map((b, j) => <Fragment key={j}><Block b={b} v={v} lang={lang} t={t} setPage={setPage} /></Fragment>)}
            </section>
          ))}

          <nav className="lg-others" aria-label={t.other}>
            <p className="lg-others__title">{t.other}</p>
            <div className="lg-others__grid">
              {others.map(k => (
                <a
                  key={k}
                  className="ui-card ui-card--interactive lg-others__card"
                  href={legalPath(k, lang)}
                  onClick={(e) => { if (setPage && isRouted(k) && isPlainClick(e)) { e.preventDefault(); setPage(k) } }}
                >
                  <span>{tr(LEGAL_TITLES[k], lang)}</span>
                  <Icon name="arrow" size={18} className="ui-link__arrow ui-flip-rtl" />
                </a>
              ))}
            </div>
          </nav>
        </article>
      </div>
    </div>
  )
}
