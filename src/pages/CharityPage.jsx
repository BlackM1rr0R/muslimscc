import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import '../styles/CharityPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { exitDelay } from '../utils/promptCoordinator'
import PageLink, { isPlainClick } from '../components/PageLink'
import LessonBlocks, { pick } from '../components/lesson/LessonBlocks'
import { useNavigate } from 'react-router-dom'
import { pathFor } from '../seo/routes'
import { CHARITY_GUIDE, CHARITY_GUIDE_LINKS } from '../data/pageGuides/CharityPage'
import '../styles/LessonsPage.css'
import { StatTile, ChartFigure, ColumnChart, BarChart } from '../components/viz'

// Əməl növləri. icon — Icon.jsx adı (emoji əvəzinə: rəngi tokendən,
// bütün sistemlərdə eyni). Dəqiq ikonu olmayanlar üçün ən yaxın:
// yemək → leaf, gülüş → kids (təbəssüm), geyim → gift
const DEED_TYPES = [
  { key:'money', icon:'zakat', az:'Pul', en:'Money', ru:'Деньги', ar:'مال', tr:'Para' },
  { key:'food', icon:'leaf', az:'Yemək', en:'Food', ru:'Еда', ar:'طعام', tr:'Yemek' },
  { key:'smile', icon:'kids', az:'Gülüş', en:'Smile', ru:'Улыбка', ar:'ابتسامة', tr:'Gülümseme' },
  { key:'knowledge', icon:'books', az:'Elm', en:'Knowledge', ru:'Знание', ar:'علم', tr:'İlim' },
  { key:'dua', icon:'duas', az:'Dua', en:'Dua', ru:'Дуа', ar:'دعاء', tr:'Dua' },
  { key:'helping', icon:'jamaat', az:'Kömək', en:'Helping', ru:'Помощь', ar:'مساعدة', tr:'Yardım' },
  { key:'clothing', icon:'gift', az:'Geyim', en:'Clothing', ru:'Одежда', ar:'ملابس', tr:'Giyim' },
  { key:'other', icon:'sparkle', az:'Digər', en:'Other', ru:'Другое', ar:'أخرى', tr:'Diğer' },
]

// İkon kafelinin variantı: pul — qızılı, qalanları — brend (bir vurğu rəngi)
const tileClass = (key) => `ui-icon-tile${key === 'money' ? ' ui-icon-tile--accent' : ''}`

const LABELS = {
  az: { title:'Sədəqə gündəliyi', subtitle:'Gündəlik xeyir əməllərinizi qeyd edin', heroArabic:'صَدَقَة', total:'Ümumi əməl', totalAmount:'Ümumi məbləğ', streak:'Ardıcıl gün', addTitle:'Yeni əməl əlavə et', date:'Tarix', type:'Növ', amount:'Məbləğ (istəyə bağlı)', description:'Təsvir', add:'Əlavə et', entries:'Qeydlər', noEntries:'Hələ heç bir qeyd yoxdur', delete:'Sil', all:'Hamısı', filterBy:'Süzgəc', descPh:'Məs.: qonşuya yemək apardım', added:'Əlavə edildi', guideMore:'Ətraflı', how:'Hər xeyir əməlini — pul, yemək, kömək, dua — tarixi ilə yazın. Qeydlər yalnız bu cihazda saxlanılır.', actAdd:'Əməl əlavə et', actWhat:'Nələr sədəqədir?', ovEy:'Xülasə', ovTitle:'Əməlləriniz bir baxışda', ovLead:'Qrafiklər yalnız sizin qeydlərinizdən qurulur.', monthsTitle:'Son 6 ay', monthsSub:'ayda əməl sayı', typesTitle:'Növlərə görə', typesSub:'əməl sayı', noData:'İlk əməlinizi əlavə edin — burada aylıq qrafik və növlər görünəcək.', guideEy:'Bələdçi', addEy:'Gündəlik' },
  en: { title:'Charity Diary', subtitle:'Track your daily good deeds', heroArabic:'صَدَقَة', total:'Total Deeds', totalAmount:'Total Amount', streak:'Day Streak', addTitle:'Add New Deed', date:'Date', type:'Type', amount:'Amount (optional)', description:'Description', add:'Add', entries:'Entries', noEntries:'No entries yet', delete:'Delete', all:'All', filterBy:'Filter', descPh:'E.g. took food to a neighbour', added:'Added', guideMore:'Read more', how:'Log every good deed — money, food, help, dua — with its date. Entries are stored only on this device.', actAdd:'Add a deed', actWhat:'What counts as charity?', ovEy:'Overview', ovTitle:'Your deeds at a glance', ovLead:'The charts are built only from your own entries.', monthsTitle:'Last 6 months', monthsSub:'deeds per month', typesTitle:'By type', typesSub:'number of deeds', noData:'Add your first deed — a monthly chart and the types will appear here.', guideEy:'Guide', addEy:'Journal' },
  ru: { title:'Дневник садаки', subtitle:'Записывайте ваши ежедневные добрые дела', heroArabic:'صَدَقَة', total:'Всего дел', totalAmount:'Общая сумма', streak:'Дней подряд', addTitle:'Добавить дело', date:'Дата', type:'Тип', amount:'Сумма (необязательно)', description:'Описание', add:'Добавить', entries:'Записи', noEntries:'Пока нет записей', delete:'Удалить', all:'Все', filterBy:'Фильтр', descPh:'Напр.: отнёс еду соседу', added:'Добавлено', guideMore:'Подробнее', how:'Записывайте каждое доброе дело — деньги, еду, помощь, дуа — с датой. Записи хранятся только на этом устройстве.', actAdd:'Добавить дело', actWhat:'Что считается милостыней?', ovEy:'Обзор', ovTitle:'Ваши дела с первого взгляда', ovLead:'Графики строятся только по вашим записям.', monthsTitle:'Последние 6 месяцев', monthsSub:'дел в месяц', typesTitle:'По типам', typesSub:'количество дел', noData:'Добавьте первое дело — здесь появятся график по месяцам и типы.', guideEy:'Руководство', addEy:'Дневник' },
  ar: { title:'يوميات الصدقة', subtitle:'سجّل أعمالك الخيرية اليومية', heroArabic:'صَدَقَة', total:'إجمالي الأعمال', totalAmount:'المبلغ الإجمالي', streak:'أيام متتالية', addTitle:'أضف عملاً جديداً', date:'التاريخ', type:'النوع', amount:'المبلغ (اختياري)', description:'الوصف', add:'أضف', entries:'السجلات', noEntries:'لا توجد سجلات بعد', delete:'حذف', all:'الكل', filterBy:'تصفية', descPh:'مثال: أخذت طعاماً إلى الجار', added:'تمت الإضافة', guideMore:'للمزيد', how:'سجّل كل عمل خير — مالًا أو طعامًا أو عونًا أو دعاءً — بتاريخه. تُحفظ السجلات على هذا الجهاز فقط.', actAdd:'أضف عملًا', actWhat:'ما يُعدّ صدقة', ovEy:'ملخص', ovTitle:'أعمالك في لمحة', ovLead:'تُبنى الرسوم من سجلاتك أنت فقط.', monthsTitle:'آخر ٦ أشهر', monthsSub:'عدد الأعمال في الشهر', typesTitle:'حسب النوع', typesSub:'عدد الأعمال', noData:'أضف أول عمل لك لتظهر هنا الرسوم الشهرية والأنواع.', guideEy:'دليل', addEy:'السجل' },
  tr: { title:'Sadaka Günlüğü', subtitle:'Günlük hayır işlerinizi kaydedin', heroArabic:'صَدَقَة', total:'Toplam İş', totalAmount:'Toplam Tutar', streak:'Ardışık Gün', addTitle:'Yeni İş Ekle', date:'Tarih', type:'Tür', amount:'Tutar (isteğe bağlı)', description:'Açıklama', add:'Ekle', entries:'Kayıtlar', noEntries:'Henüz kayıt yok', delete:'Sil', all:'Tümü', filterBy:'Filtre', descPh:'Örn.: komşuya yemek götürdüm', added:'Eklendi', guideMore:'Daha fazlası', how:'Her hayır işini — para, yemek, yardım, dua — tarihiyle yazın. Kayıtlar yalnızca bu cihazda saklanır.', actAdd:'İş ekle', actWhat:'Neler sadakadır?', ovEy:'Özet', ovTitle:'İşleriniz bir bakışta', ovLead:'Grafikler yalnızca sizin kayıtlarınızdan oluşur.', monthsTitle:'Son 6 ay', monthsSub:'ayda iş sayısı', typesTitle:'Türlere göre', typesSub:'iş sayısı', noData:'İlk işinizi ekleyin — burada aylık grafik ve türler görünecek.', guideEy:'Rehber', addEy:'Günlük' },
}

// Yerli tarix (YYYY-MM-DD). toISOString() UTC-dir — Bakıda (UTC+4) gecə
// 00:00–03:59 arası forma dünənki tarixlə açılırdı.
function localDateKey(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function getToday() {
  return localDateKey()
}

// Qeyd tarixini dilə uyğun göstər. Chrome-un yığcam ICU-sunda "az" lokalı
// yoxdur ("2026 M09 19" çıxır) — ona görə azərbaycanca ay adları əl ilə yazılır.
const AZ_MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek']
const DATE_LOCALES = { en: 'en-GB', ru: 'ru-RU', ar: 'ar-u-nu-latn', tr: 'tr-TR' }

// Məbləğ saytın dilinə görə (Zəkat kalkulyatoru ilə eyni lokallar; ərəbcədə latın rəqəmləri)
const NUM_LOCALES = { az: 'az-AZ', en: 'en-US', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }
function formatAmount(v, lang) {
  const x = Number.isFinite(v) ? v : 0
  try { return x.toLocaleString(NUM_LOCALES[lang] || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) } catch { return x.toFixed(2) }
}

function formatEntryDate(key, lang) {
  const [y, m, d] = String(key || '').split('-').map(Number)
  if (!y || !m || !d) return key || ''
  if (lang === 'az' || !DATE_LOCALES[lang]) return `${d} ${AZ_MONTHS_SHORT[m - 1]} ${y}`
  try {
    return new Date(y, m - 1, d).toLocaleDateString(DATE_LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return key
  }
}

function calcStreak(entries) {
  if (!entries.length) return 0
  const uniqueDays = [...new Set(entries.map(e => e.date))].sort().reverse()
  const today = getToday()
  const yesterday = localDateKey(new Date(Date.now() - 86400000))
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diff = (prev - curr) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

export default function CharityPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az
  const navigate = useNavigate()
  // Dərsə keçid — həqiqi <a href>, adi klikdə SPA ilə
  const openLesson = (e, slug) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(pathFor('learn', lang, slug))
    window.scrollTo(0, 0)
  }

  // Yaddaşdakı qeydlər yoxlanılır: pozuq/köhnə forma ({}, "x", null element,
  // mətn məbləğ) əvvəl səhifəni tam ağ ekrana çevirirdi (reduce/toFixed xətası)
  const [entries, setEntries] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('charity_log'))
      if (!Array.isArray(raw)) return []
      return raw
        .filter(e => e && typeof e === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(e.date)))
        .map((e, i) => {
          const amt = parseFloat(e.amount)
          return {
            id: Number.isFinite(Number(e.id)) ? Number(e.id) : i + 1,
            date: e.date,
            type: DEED_TYPES.some(d => d.key === e.type) ? e.type : 'other',
            amount: Number.isFinite(amt) && amt > 0 ? amt : null,
            description: typeof e.description === 'string' ? e.description : '',
          }
        })
    } catch { return [] }
  })

  const [date, setDate] = useState(getToday())
  const [type, setType] = useState('money')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [filterType, setFilterType] = useState('all')
  // Əlavə təsdiqi: hər əlavədə yeni açar (mesaj animasiyası yenidən başlayır), 2.4 san. sonra gizlənir
  const [justAdded, setJustAdded] = useState(0)
  const addedTimer = useRef(0)
  useEffect(() => () => clearTimeout(addedTimer.current), [])

  useEffect(() => {
    try { localStorage.setItem('charity_log', JSON.stringify(entries)) } catch { /* yaddaş bağlıdır */ }
  }, [entries])

  const stats = useMemo(() => {
    const total = entries.length
    const totalAmount = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
    const streak = calcStreak(entries)
    return { total, totalAmount, streak }
  }, [entries])

  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    if (filterType === 'all') return sorted
    return sorted.filter(e => e.type === filterType)
  }, [entries, filterType])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!date || !type) return
    const entry = {
      id: Date.now(),
      date,
      type,
      // Yalnız sonlu, müsbət məbləğ ("1e999" → Infinity, mənfi — saxlanmır)
      amount: Number.isFinite(parseFloat(amount)) && parseFloat(amount) > 0 ? parseFloat(amount) : null,
      description: description.trim(),
    }
    setEntries(prev => [...prev, entry])
    setAmount('')
    setDescription('')
    haptic()
    setJustAdded(entry.id)
    clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setJustAdded(0), 2400)
  }

  // Silmə: sətir əvvəl yumşaq sönür (yalnız transform/opacity), sonra siyahıdan çıxır.
  // Fokus itməsin deyə növbəti (yoxdursa əvvəlki) sətrin "Sil" düyməsinə, siyahı
  // boşalırsa başlığa keçir — əvvəl fokus <body>-yə düşürdü.
  const [leaving, setLeaving] = useState(() => new Set())
  const entriesTitleRef = useRef(null)
  const leaveTimers = useRef([])
  useEffect(() => () => leaveTimers.current.forEach(clearTimeout), [])
  const handleDelete = (id, ev) => {
    if (leaving.has(id)) return
    const li = ev?.currentTarget?.closest('li')
    const sib = li?.nextElementSibling || li?.previousElementSibling
    setLeaving(prev => new Set(prev).add(id))
    leaveTimers.current.push(setTimeout(() => {
      setEntries(prev => prev.filter(e => e.id !== id))
      setLeaving(prev => { const n = new Set(prev); n.delete(id); return n })
      const next = sib?.isConnected && sib.querySelector('.ch-entry-delete')
      if (next) next.focus({ preventScroll: true })
      else entriesTitleRef.current?.focus({ preventScroll: true })
    }, exitDelay(220)))
  }

  const getDeedType = (key) => DEED_TYPES.find(d => d.key === key) || DEED_TYPES[7]

  // Son 6 ay — hər ayda neçə əməl (ColumnChart); cari ay vurğulanır
  const months = useMemo(() => {
    const now = new Date()
    const out = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      let label
      if (lang === 'az' || !DATE_LOCALES[lang]) label = AZ_MONTHS_SHORT[d.getMonth()]
      else { try { label = d.toLocaleDateString(DATE_LOCALES[lang], { month: 'short' }) } catch { label = String(d.getMonth() + 1) } }
      out.push({ key, label, value: entries.filter(e => e.date.startsWith(key)).length, current: i === 0 })
    }
    return out
  }, [entries, lang])

  // Növlərə görə say (BarChart) — yalnız qeydi olan növlər, çoxdan aza
  const byType = useMemo(() => DEED_TYPES
    .map(dt => ({ key: dt.key, label: dt[lang] || dt.en, value: entries.filter(e => e.type === dt.key).length }))
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value), [entries, lang])

  const amountText = stats.totalAmount > 0 && Number.isFinite(stats.totalAmount) ? formatAmount(stats.totalAmount, lang) : '0'

  return (
    <div className="ch-page">
      {/* Hero — v3: kompakt; eyebrow · h1 · bir cümlə · necə işlədilir · 2 düymə */}
      <header className="ui-page-hero ch-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('charity'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.subtitle}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {t.how}</p>
          <div className="ui-page-hero__actions">
            <a className="ui-btn ui-btn--primary ui-btn--sm" href="#ch-add"><Icon name="plus" className="ui-btn__icon" /> {t.actAdd}</a>
            <a className="ui-btn ui-btn--secondary ui-btn--sm" href="#ch-what-counts">{t.actWhat}</a>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ch-container">

          {/* Statistika — üç rəqəm kafeli */}
          <div className="ui-stats ch-stats" data-reveal="stagger">
            {/* key: dəyər dəyişəndə rəqəm bir dəfə yumşaq "döyünür" (CharityPage.css → .ch-bump) */}
            <StatTile icon="charity" label={t.total} value={<span className="ch-bump" key={stats.total}>{stats.total}</span>} />
            <StatTile icon="zakat" label={t.totalAmount} tone="accent" value={<span className="ch-bump" key={stats.totalAmount}>{amountText}</span>} />
            <StatTile icon="bolt" label={t.streak} tone="brand" value={<span className="ch-bump" key={stats.streak}>{stats.streak}</span>} />
          </div>

          <div className="ch-layout">
            {/* Əlavə forması (genişdə yan sütunda yapışqan) */}
            <div id="ch-add" className="ui-card ch-form-card" data-reveal="">
              <h2 className="ch-form-title">{t.addTitle}</h2>
              <form className="ch-form" onSubmit={handleAdd}>
                <div className="ch-form-row">
                  <label className="ui-field" htmlFor="ch-date">
                    <span className="ui-field__label">{t.date}</span>
                    <input
                      id="ch-date"
                      type="date"
                      className="ui-input"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                    />
                  </label>
                  <label className="ui-field" htmlFor="ch-amount">
                    <span className="ui-field__label">{t.amount}</span>
                    <input
                      id="ch-amount"
                      type="number"
                      inputMode="decimal"
                      className="ui-input"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder={formatAmount(0, lang)}
                      min="0"
                      step="0.01"
                    />
                  </label>
                </div>

                <div className="ui-field">
                  <span className="ui-field__label" id="ch-type-label">{t.type}</span>
                  <div className="ch-type-grid" role="group" aria-labelledby="ch-type-label">
                    {DEED_TYPES.map(dt => (
                      <button
                        key={dt.key}
                        type="button"
                        className="ch-type-btn"
                        aria-pressed={type === dt.key}
                        onClick={() => setType(dt.key)}
                      >
                        <Icon name={dt.icon} size={18} />
                        <span>{dt[lang] || dt.en}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="ui-field" htmlFor="ch-desc">
                  <span className="ui-field__label">{t.description}</span>
                  <input
                    id="ch-desc"
                    type="text"
                    className="ui-input"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t.descPh}
                    maxLength={200}
                  />
                </label>

                <div className="ch-form-foot">
                  <button type="submit" className="ui-btn ui-btn--primary ch-add-btn">
                    <Icon name="plus" className="ui-btn__icon" /> {t.add}
                  </button>
                  {/* Əlavə olunanda qısa təsdiq (ekran oxuyucusu da eşidir) */}
                  <span className="ch-added" role="status" aria-live="polite">
                    {justAdded > 0 && <span key={justAdded} className="ch-added-msg"><Icon name="check" size={16} /> {t.added}</span>}
                  </span>
                </div>
              </form>
            </div>

            <div className="ch-main">
              {/* Süzgəc — telefonda bir sətirdə üfüqi sürüşən çiplər, genişdə sarınır */}
              <div className="ch-filter">
                <span className="ch-filter-label" id="ch-filter-label">{t.filterBy}</span>
                <div className="chip-scroll wrap-desktop ch-chips" role="group" aria-labelledby="ch-filter-label">
                  <button
                    type="button"
                    className="ui-chip"
                    aria-pressed={filterType === 'all'}
                    onClick={() => setFilterType('all')}
                  >
                    {t.all}
                  </button>
                  {DEED_TYPES.map(dt => (
                    <button
                      key={dt.key}
                      type="button"
                      className="ui-chip"
                      aria-pressed={filterType === dt.key}
                      onClick={() => setFilterType(dt.key)}
                    >
                      <Icon name={dt.icon} size={15} /> {dt[lang] || dt.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qeydlər — yeni əlavə olunan sətir yumşaq "açılır" */}
              <div className="ch-entries">
                <h2 className="ch-entries-title" ref={entriesTitleRef} tabIndex={-1}>
                  {t.entries} <span className="ui-badge ui-num">{filteredEntries.length}</span>
                </h2>
                {filteredEntries.length === 0 && (
                  <div className="ui-empty ch-empty" data-reveal="fade">
                    <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="charity" /></span>
                    <p>{t.noEntries}</p>
                  </div>
                )}
                {filteredEntries.length > 0 && (
                  <ul className="ch-entry-list" data-reveal="stagger">
                    {filteredEntries.map(entry => {
                      const dt = getDeedType(entry.type)
                      return (
                        <li key={entry.id} className={`ch-entry${entry.id === justAdded ? ' is-new' : ''}${leaving.has(entry.id) ? ' is-leaving' : ''}`}>
                          <div className="ch-entry-card">
                            <span className={`${tileClass(dt.key)} ui-icon-tile--sm`}><Icon name={dt.icon} /></span>
                            <div className="ch-entry-body">
                              <div className="ch-entry-top">
                                <span className="ch-entry-type">{dt[lang] || dt.en}</span>
                                <time className="ch-entry-date" dateTime={entry.date}>{formatEntryDate(entry.date, lang)}</time>
                              </div>
                              {entry.description && (
                                <p className="ch-entry-desc">{entry.description}</p>
                              )}
                            </div>
                            {entry.amount != null && entry.amount > 0 && (
                              <span className="ch-entry-amount ui-num">{formatAmount(entry.amount, lang)}</span>
                            )}
                            <button
                              type="button"
                              className="ui-icon-btn ch-entry-delete"
                              onClick={(ev) => handleDelete(entry.id, ev)}
                              title={t.delete}
                              aria-label={t.delete}
                            >
                              <Icon name="trash" size={18} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Xülasə: aylıq sütun qrafiki + növlər ══ */}
      <section className="ui-section ui-section--tight ui-section--alt ch-overview" aria-labelledby="ch-ov-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{t.ovEy}</span>
            <h2 className="ui-title" id="ch-ov-title">{t.ovTitle}</h2>
            <p className="ui-lead">{entries.length ? t.ovLead : t.noData}</p>
          </div>
          <div className="ch-charts">
            <ChartFigure title={t.monthsTitle} sub={t.monthsSub}>
              <ColumnChart data={months} height={120} label={`${t.monthsTitle}: ${t.monthsSub}`} />
            </ChartFigure>
            <ChartFigure title={t.typesTitle} sub={t.typesSub}>
              {byType.length
                ? <BarChart data={byType} labelWidth="30%" label={`${t.typesTitle}: ${t.typesSub}`} />
                : <p className="ch-chart-empty">{t.noData}</p>}
            </ChartFigure>
          </div>
        </div>
      </section>

      {/* ══ "Nələr sədəqədir?" — gündəlikdəki növlərin dəlili (LessonBlocks formatı) ══ */}
      <section className="ui-section ch-guide ui-cv" style={{ '--cv-h': '1800px' }}>
        <div className="ui-container ui-container--narrow">
          {CHARITY_GUIDE.map(sec => (
            <section key={sec.id} id={`ch-${sec.id}`} className="ch-guide-sec" aria-labelledby={`ch-${sec.id}-title`}>
              <div className="ui-section-head" data-reveal>
                <span className="ui-eyebrow">{t.guideEy}</span>
                <h2 id={`ch-${sec.id}-title`} className="ui-title">{pick(sec.title, lang)}</h2>
              </div>
              <LessonBlocks blocks={sec.blocks} lang={lang} />
            </section>
          ))}
          <nav className="ch-guide-links" aria-label={t.guideMore}>
            <h2 className="ui-title ui-title--sm">{t.guideMore}</h2>
            <ul className="ui-list">
              {CHARITY_GUIDE_LINKS.map((l, i) => (
                <li key={i}>
                  {l.learn
                    ? <a className="ui-list__item" href={pathFor('learn', lang, l.learn)} onClick={(e) => openLesson(e, l.learn)}><Icon name="learn" /><span>{pick(l.label, lang)}</span><Icon name="chevron" className="ui-list__chev ui-flip-rtl" /></a>
                    : <PageLink className="ui-list__item" to={l.to} setPage={setPage} onNavigate={() => window.scrollTo(0, 0)}><Icon name={l.to} /><span>{pick(l.label, lang)}</span><Icon name="chevron" className="ui-list__chev ui-flip-rtl" /></PageLink>}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </div>
  )
}
