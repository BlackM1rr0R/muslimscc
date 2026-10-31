import { useCallback, useEffect, useMemo, useState } from 'react'
import { guessLang } from '../utils/textLang'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReportErrorButton from '../components/ReportErrorButton'
import { ChartFigure, Donut, ProgressRing } from '../components/viz'
import { NAWAWI_40, NAWAWI_INTRO, NAWAWI_SOURCES } from '../data/nawawi40'
import '../styles/Nawawi40Page.css'

/* ══════════════════════════════════════════════════════════════════
   İMAM ƏN-NƏVƏVİNİN 40 HƏDİSİ — /nawawi40
   Hər hədis: ərəb mətni, tərcümə, mənbə (ən-Nəvəvinin göstərdiyi kimi),
   dərəcə qeydi (alimlərin zəif saydığı hədislərdə) və əsas faydalar.
   Məlumat: src/data/nawawi40.js. Ünvan: /nawawi40#h-12 — həmin hədis açılır.

   Dizayn v3: kompakt hero (açar rəqəmlər) → axtarış → akkordeon siyahı →
   "Kitab haqqında": 42 xanalı xəritə (öyrənilənlər), mənbələr diaqramı
   (Donut — data/nawawi40.js-in öz "src" sahəsindən hesablanır), mənbələr.
   "Öyrəndim" işarələri yalnız bu cihazda: localStorage "nawawi40_learned_v1".
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: { eyebrow: 'Hədis', title: 'Ən-Nəvəvinin 40 hədisi', search: 'Hədis axtar...', clear: 'Axtarışı təmizlə', source: 'Mənbə', grade: 'Dərəcəsi', benefits: 'Faydaları', none: 'Heç nə tapılmadı.', open: 'Aç', close: 'Bağla', sources: 'Mənbələr', copy: 'Kopyala', copied: 'Kopyalandı', expandAll: 'Hamısını aç', collapseAll: 'Hamısını bağla',
    lead: 'Dinin əsaslarını toplayan 42 qısa hədis — ərəbcə mətn, tərcümə, mənbə və faydaları ilə.',
    how: 'Hədisin başlığına toxunun — mətn və faydaları açılır. Əzbərlədiyiniz və ya öyrəndiyiniz hədisi «Öyrəndim» ilə işarələyin.',
    statHadith: 'hədis', statAgreed: 'Buxari və Müslimdə', statLearned: 'öyrənilib',
    learn: 'Öyrəndim', learned: 'Öyrənilib', aboutEyebrow: 'Kitab haqqında', aboutTitle: 'Kitab, irəliləyiş və mənbələr',
    mapTitle: 'Hədislər xəritəsi', mapLead: 'Nömrəyə toxunun — hədis açılır. Yaşıl — öyrəndikləriniz (yalnız bu cihazda).', progress: 'Öyrənilib',
    chartTitle: 'Hədislər hansı toplulardandır', chartSub: 'ən-Nəvəvinin göstərdiyi mənbəyə görə',
    agreed: 'Buxari və Müslim', bukhari: 'Yalnız Buxari', muslim: 'Yalnız Müslim', other: 'Digər toplular', of: 'hədis',
    chartNote: 'Hesablama hər hədisin altındakı mənbə sətrindəndir. «Digər» — Tirmizi, Əbu Davud, İbn Macə, Darəqutni və s.' },
  en: { eyebrow: 'Hadith', title: 'An-Nawawi’s Forty Hadith', search: 'Search hadith...', clear: 'Clear search', source: 'Source', grade: 'Grade', benefits: 'Benefits', none: 'Nothing found.', open: 'Open', close: 'Close', sources: 'Sources', copy: 'Copy', copied: 'Copied', expandAll: 'Expand all', collapseAll: 'Collapse all',
    lead: '42 short hadiths that gather the foundations of the religion — with the Arabic text, a translation, the source and the benefits.',
    how: 'Tap a hadith’s title to open its text and benefits. Mark the hadiths you have memorised or studied with “Learned”.',
    statHadith: 'hadiths', statAgreed: 'in Bukhari and Muslim', statLearned: 'learned',
    learn: 'Learned', learned: 'Learned', aboutEyebrow: 'About the book', aboutTitle: 'The book, your progress and the sources',
    mapTitle: 'Map of the hadiths', mapLead: 'Tap a number to open the hadith. Green — the ones you have learned (on this device only).', progress: 'Learned',
    chartTitle: 'Which collections the hadiths come from', chartSub: 'by the source an-Nawawi cites',
    agreed: 'Bukhari and Muslim', bukhari: 'Bukhari only', muslim: 'Muslim only', other: 'Other collections', of: 'hadiths',
    chartNote: 'Counted from the source line under each hadith. “Other” — at-Tirmidhi, Abu Dawud, Ibn Majah, ad-Daraqutni etc.' },
  ru: { eyebrow: 'Хадисы', title: '40 хадисов ан-Навави', search: 'Поиск хадиса...', clear: 'Очистить поиск', source: 'Источник', grade: 'Степень', benefits: 'Польза', none: 'Ничего не найдено.', open: 'Открыть', close: 'Закрыть', sources: 'Источники', copy: 'Копировать', copied: 'Скопировано', expandAll: 'Раскрыть все', collapseAll: 'Свернуть все',
    lead: '42 кратких хадиса, собравших основы религии, — с арабским текстом, переводом, источником и пользой.',
    how: 'Нажмите на заголовок хадиса — откроются текст и польза. Отмечайте выученные или изученные хадисы кнопкой «Выучено».',
    statHadith: 'хадиса', statAgreed: 'у Бухари и Муслима', statLearned: 'выучено',
    learn: 'Выучено', learned: 'Выучено', aboutEyebrow: 'О книге', aboutTitle: 'Книга, прогресс и источники',
    mapTitle: 'Карта хадисов', mapLead: 'Нажмите на номер — хадис откроется. Зелёные — выученные (только на этом устройстве).', progress: 'Выучено',
    chartTitle: 'Из каких сборников хадисы', chartSub: 'по источнику, который указал ан-Навави',
    agreed: 'Бухари и Муслим', bukhari: 'Только Бухари', muslim: 'Только Муслим', other: 'Другие сборники', of: 'хадисов',
    chartNote: 'Подсчитано по строке источника под каждым хадисом. «Другие» — ат-Тирмизи, Абу Дауд, Ибн Маджа, ад-Даракутни и др.' },
  ar: { eyebrow: 'الحديث', title: 'الأربعون النووية', search: 'ابحث في الأحاديث...', clear: 'مسح البحث', source: 'التخريج', grade: 'الدرجة', benefits: 'من فوائد الحديث', none: 'لم يُعثر على شيء.', open: 'فتح', close: 'إغلاق', sources: 'المصادر', copy: 'نسخ', copied: 'تم النسخ', expandAll: 'فتح الكل', collapseAll: 'إغلاق الكل',
    lead: 'اثنان وأربعون حديثًا جامعًا لأصول الدين، بنصها وتخريجها وفوائدها.',
    how: 'اضغط على عنوان الحديث ليظهر نصه وفوائده، وعلِّم ما حفظته أو درسته بزر «حفظته».',
    statHadith: 'حديثًا', statAgreed: 'في الصحيحين', statLearned: 'محفوظ',
    learn: 'حفظته', learned: 'محفوظ', aboutEyebrow: 'عن الكتاب', aboutTitle: 'الكتاب وتقدّمك والمصادر',
    mapTitle: 'خريطة الأحاديث', mapLead: 'اضغط على الرقم ليُفتح الحديث. الأخضر: ما حفظته (على هذا الجهاز فقط).', progress: 'المحفوظ',
    chartTitle: 'من أي كتب هذه الأحاديث', chartSub: 'بحسب تخريج النووي',
    agreed: 'البخاري ومسلم', bukhari: 'البخاري وحده', muslim: 'مسلم وحده', other: 'كتب أخرى', of: 'حديثًا',
    chartNote: 'محسوب من سطر التخريج تحت كل حديث. «أخرى»: الترمذي وأبو داود وابن ماجه والدارقطني وغيرهم.' },
  tr: { eyebrow: 'Hadis', title: 'Nevevî’nin Kırk Hadisi', search: 'Hadis ara...', clear: 'Aramayı temizle', source: 'Kaynak', grade: 'Derecesi', benefits: 'Faydaları', none: 'Bir şey bulunamadı.', open: 'Aç', close: 'Kapat', sources: 'Kaynaklar', copy: 'Kopyala', copied: 'Kopyalandı', expandAll: 'Tümünü aç', collapseAll: 'Tümünü kapat',
    lead: 'Dinin esaslarını toplayan 42 kısa hadis — Arapça metin, tercüme, kaynak ve faydalarıyla.',
    how: 'Hadisin başlığına dokunun — metin ve faydaları açılır. Ezberlediğiniz veya öğrendiğiniz hadisi «Öğrendim» ile işaretleyin.',
    statHadith: 'hadis', statAgreed: 'Buhârî ve Müslim’de', statLearned: 'öğrenildi',
    learn: 'Öğrendim', learned: 'Öğrenildi', aboutEyebrow: 'Kitap hakkında', aboutTitle: 'Kitap, ilerleme ve kaynaklar',
    mapTitle: 'Hadis haritası', mapLead: 'Numaraya dokunun — hadis açılır. Yeşil — öğrendikleriniz (yalnızca bu cihazda).', progress: 'Öğrenildi',
    chartTitle: 'Hadisler hangi eserlerden', chartSub: 'Nevevî’nin gösterdiği kaynağa göre',
    agreed: 'Buhârî ve Müslim', bukhari: 'Yalnız Buhârî', muslim: 'Yalnız Müslim', other: 'Diğer eserler', of: 'hadis',
    chartNote: 'Her hadisin altındaki kaynak satırından sayıldı. «Diğer» — Tirmizî, Ebû Dâvûd, İbn Mâce, Dârekutnî vb.' },
}

const pick = (o, lang) => (o && (o[lang] || o.en)) || ''
const HARAKAT = /[ً-ْٰـ]/g
const norm = (s, lang) => String(s || '').replace(HARAKAT, '').toLocaleLowerCase(lang)

// Mənbə qrupu — data-dakı ingiliscə "src" sətrinin əvvəlinə görə
function srcGroup(h) {
  const s = String(h.src?.en || '')
  if (s.startsWith('al-Bukhari')) return /Muslim \d/.test(s) ? 'agreed' : 'bukhari'
  if (s.startsWith('Muslim')) return 'muslim'
  return 'other'
}
const GROUP_COUNTS = NAWAWI_40.reduce((acc, h) => { const g = srcGroup(h); acc[g] = (acc[g] || 0) + 1; return acc }, {})

const LEARN_KEY = 'nawawi40_learned_v1'
function readLearned() {
  try { const v = JSON.parse(localStorage.getItem(LEARN_KEY)); return Array.isArray(v) ? v.filter(Number.isInteger) : [] } catch { return [] }
}

export default function Nawawi40Page() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const isAr = lang === 'ar'
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(() => new Set())
  const [copied, setCopied] = useState(0)
  const [learned, setLearned] = useState(readLearned)
  const learnedSet = useMemo(() => new Set(learned), [learned])

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
  const toggleLearned = useCallback((n) => setLearned(prev => {
    const next = prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b)
    try { localStorage.setItem(LEARN_KEY, JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
    return next
  }), [])
  // Xəritədən: axtarışı təmizlə, hədisi aç və ona sürüş
  const goTo = (n) => {
    setQ('')
    setOpen(prev => new Set(prev).add(n))
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(`h-${n}`)
      el?.scrollIntoView({ block: 'start' })
      el?.querySelector('.nw-item__head')?.focus({ preventScroll: true })
    }))
  }
  const allOpen = list.length > 0 && list.every(h => open.has(h.n))
  const copy = async (h) => {
    try {
      await navigator.clipboard.writeText([h.ar, !isAr && pick(h.text, lang), `— ${pick(h.src, lang)}`].filter(Boolean).join('\n\n'))
      setCopied(h.n)
      setTimeout(() => setCopied(c => (c === h.n ? 0 : c)), 1800)
    } catch { /* icazə yoxdur */ }
  }
  const learnedCount = NAWAWI_40.filter(h => learnedSet.has(h.n)).length

  return (
    <div className="nw-page">
      <header className="ui-page-hero nw-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          {!isAr && <p className="nw-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الأربعون النووية</p>}
          <p className="ui-lead">{L.lead}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {L.how}</p>
          <ul className="ui-page-hero__stats">
            <li><b className="ui-num">{NAWAWI_40.length}</b><span>{L.statHadith}</span></li>
            <li><b className="ui-num">{GROUP_COUNTS.agreed || 0}</b><span>{L.statAgreed}</span></li>
            <li><b className="ui-num"><bdi dir="ltr">{learnedCount} / {NAWAWI_40.length}</bdi></b><span>{L.statLearned}</span></li>
          </ul>
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
              const isLearned = learnedSet.has(h.n)
              return (
                <li key={h.n} id={`h-${h.n}`} className={`ui-card nw-item${isOpen ? ' is-open' : ''}${isLearned ? ' is-learned' : ''}`}>
                  <button type="button" className="nw-item__head" aria-expanded={isOpen} aria-controls={`h-${h.n}-body`} onClick={() => toggle(h.n)}>
                    <span className="nw-item__n ui-num">{h.n}</span>
                    <span className="nw-item__title">{pick(h.title, lang)}</span>
                    {isLearned && <span className="nw-item__learned"><Icon name="check" size={14} /><span className="ui-sr-only">{L.learned}</span></span>}
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
                        <button type="button" className={`ui-btn ui-btn--sm ${isLearned ? 'ui-btn--primary' : 'ui-btn--secondary'} nw-learn-btn`}
                          aria-pressed={isLearned} onClick={() => toggleLearned(h.n)}>
                          <Icon name="check" className="ui-btn__icon" /> {L.learn}
                        </button>
                        <span className="nw-item__spacer" />
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
        </div>
      </div>

      <section className="ui-section ui-section--alt nw-about" aria-labelledby="nw-about-h">
        <div className="ui-container nw-layout nw-layout--wide">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{L.aboutEyebrow}</span>
            <h2 id="nw-about-h" className="ui-title ui-title--sm">{L.aboutTitle}</h2>
            <p className="nw-about__intro">{pick(NAWAWI_INTRO, lang)}</p>
          </div>

          <div className="nw-about__grid">
            <div className="ui-card nw-map">
              <div className="nw-map__head">
                <ProgressRing value={learnedCount} max={NAWAWI_40.length} size={64} thickness={7}
                  label={L.progress} sub={`⁦${learnedCount} / ${NAWAWI_40.length}⁩`} />
              </div>
              <h3 className="nw-map__title">{L.mapTitle}</h3>
              <p className="nw-map__lead">{L.mapLead}</p>
              <ol className="nw-map__grid">
                {NAWAWI_40.map(h => (
                  <li key={h.n}>
                    <button type="button" className={`nw-map__cell ui-num${learnedSet.has(h.n) ? ' is-learned' : ''}`}
                      onClick={() => goTo(h.n)} title={pick(h.title, lang)}
                      aria-label={`${h.n}. ${pick(h.title, lang)}${learnedSet.has(h.n) ? ` — ${L.learned}` : ''}`}>
                      {h.n}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <ChartFigure className="nw-chart" title={L.chartTitle} sub={L.chartSub} note={L.chartNote}>
              <Donut size={140} thickness={18} format={(v) => `${v} ${L.of}`}
                center={{ value: String(NAWAWI_40.length), label: L.statHadith }}
                segments={[
                  { key: 'agreed', label: L.agreed, value: GROUP_COUNTS.agreed || 0, tone: 1 },
                  { key: 'bukhari', label: L.bukhari, value: GROUP_COUNTS.bukhari || 0, tone: 2 },
                  { key: 'muslim', label: L.muslim, value: GROUP_COUNTS.muslim || 0, tone: 3 },
                  { key: 'other', label: L.other, value: GROUP_COUNTS.other || 0, tone: 'muted' },
                ]} />
            </ChartFigure>
          </div>

          {NAWAWI_SOURCES?.length > 0 && (
            <div className="nw-sources" aria-labelledby="nw-sources-h">
              <h3 id="nw-sources-h" className="nw-sources__title">{L.sources}</h3>
              <ul>
                {NAWAWI_SOURCES.map((s, i) => (
                  <li key={i}>
                    <Icon name={s.url ? 'external' : 'books'} size={15} />
                    {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto" lang={guessLang(s.label)}>{s.label}</a> : <span dir="auto" lang={guessLang(s.label)}>{s.label}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
