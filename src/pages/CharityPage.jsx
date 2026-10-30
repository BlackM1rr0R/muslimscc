import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import '../styles/CharityPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { exitDelay } from '../utils/promptCoordinator'

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
  az: { title:'Sədəqə gündəliyi', subtitle:'Gündəlik xeyir əməllərinizi qeyd edin', heroArabic:'صَدَقَة', total:'Ümumi əməl', totalAmount:'Ümumi məbləğ', streak:'Ardıcıl gün', addTitle:'Yeni əməl əlavə et', date:'Tarix', type:'Növ', amount:'Məbləğ (istəyə bağlı)', description:'Təsvir', add:'Əlavə et', entries:'Qeydlər', noEntries:'Hələ heç bir qeyd yoxdur', delete:'Sil', all:'Hamısı', filterBy:'Süzgəc', descPh:'Məs.: qonşuya yemək apardım', added:'Əlavə edildi' },
  en: { title:'Charity Diary', subtitle:'Track your daily good deeds', heroArabic:'صَدَقَة', total:'Total Deeds', totalAmount:'Total Amount', streak:'Day Streak', addTitle:'Add New Deed', date:'Date', type:'Type', amount:'Amount (optional)', description:'Description', add:'Add', entries:'Entries', noEntries:'No entries yet', delete:'Delete', all:'All', filterBy:'Filter', descPh:'E.g. took food to a neighbour', added:'Added' },
  ru: { title:'Дневник садаки', subtitle:'Записывайте ваши ежедневные добрые дела', heroArabic:'صَدَقَة', total:'Всего дел', totalAmount:'Общая сумма', streak:'Дней подряд', addTitle:'Добавить дело', date:'Дата', type:'Тип', amount:'Сумма (необязательно)', description:'Описание', add:'Добавить', entries:'Записи', noEntries:'Пока нет записей', delete:'Удалить', all:'Все', filterBy:'Фильтр', descPh:'Напр.: отнёс еду соседу', added:'Добавлено' },
  ar: { title:'يوميات الصدقة', subtitle:'سجّل أعمالك الخيرية اليومية', heroArabic:'صَدَقَة', total:'إجمالي الأعمال', totalAmount:'المبلغ الإجمالي', streak:'أيام متتالية', addTitle:'أضف عملاً جديداً', date:'التاريخ', type:'النوع', amount:'المبلغ (اختياري)', description:'الوصف', add:'أضف', entries:'السجلات', noEntries:'لا توجد سجلات بعد', delete:'حذف', all:'الكل', filterBy:'تصفية', descPh:'مثال: أخذت طعاماً إلى الجار', added:'تمت الإضافة' },
  tr: { title:'Sadaka Günlüğü', subtitle:'Günlük hayır işlerinizi kaydedin', heroArabic:'صَدَقَة', total:'Toplam İş', totalAmount:'Toplam Tutar', streak:'Ardışık Gün', addTitle:'Yeni İş Ekle', date:'Tarih', type:'Tür', amount:'Tutar (isteğe bağlı)', description:'Açıklama', add:'Ekle', entries:'Kayıtlar', noEntries:'Henüz kayıt yok', delete:'Sil', all:'Tümü', filterBy:'Filtre', descPh:'Örn.: komşuya yemek götürdüm', added:'Eklendi' },
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

  return (
    <div className="ch-page">
      {/* Hero — dizayn v2: sakit kağız fon + xatəm naxışı, bir <h1> */}
      <header className="ui-page-hero ch-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('charity'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="ch-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">{t.heroArabic}</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ch-container">

          {/* Statistika — bir kartda üç göstərici */}
          <div className="ui-card ch-stats" data-reveal="stagger">
            <div className="ch-stat">
              <span className="ui-icon-tile"><Icon name="charity" /></span>
              <div className="ui-stat">
                {/* key: dəyər dəyişəndə rəqəm bir dəfə yumşaq "döyünür" (CharityPage.css → .ch-bump) */}
                <span className="ui-stat__num ui-num ch-bump" key={stats.total}>{stats.total}</span>
                <span className="ui-stat__label">{t.total}</span>
              </div>
            </div>
            <div className="ch-stat">
              <span className="ui-icon-tile ui-icon-tile--accent"><Icon name="zakat" /></span>
              <div className="ui-stat">
                <span className="ui-stat__num ui-num ch-bump" key={stats.totalAmount}>{stats.totalAmount > 0 && Number.isFinite(stats.totalAmount) ? formatAmount(stats.totalAmount, lang) : '0'}</span>
                <span className="ui-stat__label">{t.totalAmount}</span>
              </div>
            </div>
            <div className="ch-stat">
              <span className="ui-icon-tile"><Icon name="bolt" /></span>
              <div className="ui-stat">
                <span className="ui-stat__num ui-num ch-bump" key={stats.streak}>{stats.streak}</span>
                <span className="ui-stat__label">{t.streak}</span>
              </div>
            </div>
          </div>

          <div className="ch-layout">
            {/* Əlavə forması (genişdə yan sütunda yapışqan) */}
            <div className="ui-card ch-form-card" data-reveal="">
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
                        <Icon name={dt.icon} size={20} />
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
                  <div className="ch-empty" data-reveal="fade">
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
                          <div className="ui-card ch-entry-card">
                            <span className={tileClass(dt.key)}><Icon name={dt.icon} /></span>
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
    </div>
  )
}
