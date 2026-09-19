import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import '../styles/CharityPage.css'
import Breadcrumb from '../components/Breadcrumb'

const DEED_TYPES = [
  { key:'money', icon:'💰', az:'Pul', en:'Money', ru:'Деньги', ar:'مال', tr:'Para' },
  { key:'food', icon:'🍞', az:'Yemək', en:'Food', ru:'Еда', ar:'طعام', tr:'Yemek' },
  { key:'smile', icon:'😊', az:'Gülüş', en:'Smile', ru:'Улыбка', ar:'ابتسامة', tr:'Gülümseme' },
  { key:'knowledge', icon:'📚', az:'Elm', en:'Knowledge', ru:'Знание', ar:'علم', tr:'İlim' },
  { key:'dua', icon:'🤲', az:'Dua', en:'Dua', ru:'Дуа', ar:'دعاء', tr:'Dua' },
  { key:'helping', icon:'🤝', az:'Kömək', en:'Helping', ru:'Помощь', ar:'مساعدة', tr:'Yardım' },
  { key:'clothing', icon:'👕', az:'Geyim', en:'Clothing', ru:'Одежда', ar:'ملابس', tr:'Giyim' },
  { key:'other', icon:'✨', az:'Digər', en:'Other', ru:'Другое', ar:'أخرى', tr:'Diğer' },
]

// Telefonda qeyd sətirlərindəki ikon kafelinin rəng tonu (motion.css → .icon-tile--*).
// Boş sətir — susma yaşıl ton.
const DEED_TONE = {
  money: 'gold', food: 'orange', smile: 'rose', knowledge: 'blue',
  dua: '', helping: 'teal', clothing: 'violet', other: 'slate',
}
const tileClass = (key) => `icon-tile${DEED_TONE[key] ? ` icon-tile--${DEED_TONE[key]}` : ''}`

const LABELS = {
  az: { title:'Sədəqə Gündəliyi', subtitle:'Gündəlik xeyir əməllərinizi qeyd edin', heroArabic:'صَدَقَة', total:'Ümumi əməl', totalAmount:'Ümumi məbləğ', streak:'Ardıcıl gün', addTitle:'Yeni əməl əlavə et', date:'Tarix', type:'Növ', amount:'Məbləğ (istəyə bağlı)', description:'Təsvir', add:'Əlavə et', entries:'Qeydlər', noEntries:'Hələ heç bir qeyd yoxdur', delete:'Sil', all:'Hamısı', filterBy:'Süzgəc' },
  en: { title:'Charity Diary', subtitle:'Track your daily good deeds', heroArabic:'صَدَقَة', total:'Total Deeds', totalAmount:'Total Amount', streak:'Day Streak', addTitle:'Add New Deed', date:'Date', type:'Type', amount:'Amount (optional)', description:'Description', add:'Add', entries:'Entries', noEntries:'No entries yet', delete:'Delete', all:'All', filterBy:'Filter' },
  ru: { title:'Дневник милостыни', subtitle:'Записывайте ваши ежедневные добрые дела', heroArabic:'صَدَقَة', total:'Всего дел', totalAmount:'Общая сумма', streak:'Дней подряд', addTitle:'Добавить дело', date:'Дата', type:'Тип', amount:'Сумма (необязательно)', description:'Описание', add:'Добавить', entries:'Записи', noEntries:'Пока нет записей', delete:'Удалить', all:'Все', filterBy:'Фильтр' },
  ar: { title:'يوميات الصدقة', subtitle:'سجّل أعمالك الخيرية اليومية', heroArabic:'صَدَقَة', total:'إجمالي الأعمال', totalAmount:'المبلغ الإجمالي', streak:'أيام متتالية', addTitle:'أضف عملاً جديداً', date:'التاريخ', type:'النوع', amount:'المبلغ (اختياري)', description:'الوصف', add:'أضف', entries:'السجلات', noEntries:'لا توجد سجلات بعد', delete:'حذف', all:'الكل', filterBy:'تصفية' },
  tr: { title:'Sadaka Günlüğü', subtitle:'Günlük hayır işlerinizi kaydedin', heroArabic:'صَدَقَة', total:'Toplam İş', totalAmount:'Toplam Tutar', streak:'Ardışık Gün', addTitle:'Yeni İş Ekle', date:'Tarih', type:'Tür', amount:'Tutar (isteğe bağlı)', description:'Açıklama', add:'Ekle', entries:'Kayıtlar', noEntries:'Henüz kayıt yok', delete:'Sil', all:'Tümü', filterBy:'Filtre' },
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

  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('charity_log')) || []
    } catch { return [] }
  })

  const [date, setDate] = useState(getToday())
  const [type, setType] = useState('money')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [filterType, setFilterType] = useState('all')

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
      amount: amount ? parseFloat(amount) : null,
      description: description.trim(),
    }
    setEntries(prev => [...prev, entry])
    setAmount('')
    setDescription('')
    haptic()
  }

  const handleDelete = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const getDeedType = (key) => DEED_TYPES.find(d => d.key === key) || DEED_TYPES[7]

  return (
    <>
      {/* Hero */}
      <div className="page-hero hero-compact theme-charity">
        <Breadcrumb setPage={setPage} current={t.title} />
        <div className="page-hero-arabic">{t.heroArabic}</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="section">
        <div className="section-inner ch-container">

          {/* Stats — telefonda üç xanalı tək kart (CharityPage.css);
              səhifə girişini App.jsx-in .page-enter keçidi verir */}
          <div className="ch-stats">
            <div className="ch-stat-card">
              <span className="ch-stat-icon icon-tile" aria-hidden="true">🤲</span>
              <span className="ch-stat-value">{stats.total}</span>
              <span className="ch-stat-label">{t.total}</span>
            </div>
            <div className="ch-stat-card">
              <span className="ch-stat-icon icon-tile icon-tile--gold" aria-hidden="true">💰</span>
              <span className="ch-stat-value">{stats.totalAmount > 0 ? stats.totalAmount.toFixed(2) : '0'}</span>
              <span className="ch-stat-label">{t.totalAmount}</span>
            </div>
            <div className="ch-stat-card">
              <span className="ch-stat-icon icon-tile icon-tile--orange" aria-hidden="true">🔥</span>
              <span className="ch-stat-value">{stats.streak}</span>
              <span className="ch-stat-label">{t.streak}</span>
            </div>
          </div>

          {/* Add Form */}
          <div className="ch-form-card">
            <h2 className="ch-form-title">{t.addTitle}</h2>
            <form className="ch-form" onSubmit={handleAdd}>
              <div className="ch-form-row">
                <div className="ch-form-group">
                  <label className="ch-label" htmlFor="ch-date">{t.date}</label>
                  <input
                    id="ch-date"
                    type="date"
                    className="input-base"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="ch-form-group">
                  <label className="ch-label" htmlFor="ch-amount">{t.amount}</label>
                  <input
                    id="ch-amount"
                    type="number"
                    inputMode="decimal"
                    className="input-base"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="ch-form-group">
                <span className="ch-label" id="ch-type-label">{t.type}</span>
                <div className="ch-type-grid" role="group" aria-labelledby="ch-type-label">
                  {DEED_TYPES.map(dt => (
                    <button
                      key={dt.key}
                      type="button"
                      className={`ch-type-btn press${type === dt.key ? ' active' : ''}`}
                      aria-pressed={type === dt.key}
                      onClick={() => setType(dt.key)}
                    >
                      <span aria-hidden="true">{dt.icon}</span>
                      <span>{dt[lang] || dt.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ch-form-group">
                <label className="ch-label" htmlFor="ch-desc">{t.description}</label>
                <input
                  id="ch-desc"
                  type="text"
                  className="input-base"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="..."
                />
              </div>

              <button type="submit" className="btn-primary ch-add-btn">{t.add}</button>
            </form>
          </div>

          {/* Filter — telefonda bir sətirdə üfüqi sürüşən çiplər, genişdə sarınır */}
          <div className="ch-filter" data-reveal>
            <span className="ch-filter-label" id="ch-filter-label">{t.filterBy}:</span>
            <div className="tag-filters chip-scroll wrap-desktop" role="group" aria-labelledby="ch-filter-label">
              <button
                className={`tag-btn${filterType === 'all' ? ' active' : ''}`}
                aria-pressed={filterType === 'all'}
                onClick={() => setFilterType('all')}
              >
                {t.all}
              </button>
              {DEED_TYPES.map(dt => (
                <button
                  key={dt.key}
                  className={`tag-btn${filterType === dt.key ? ' active' : ''}`}
                  aria-pressed={filterType === dt.key}
                  onClick={() => setFilterType(dt.key)}
                >
                  {dt.icon} {dt[lang] || dt.en}
                </button>
              ))}
            </div>
          </div>

          {/* Entries — telefonda qruplaşdırılmış siyahı xanaları (.m-list/.m-row),
              genişdə əvvəlki ayrı kartlar (CharityPage.css ≥768px) */}
          <div className="ch-entries">
            <h2 className="ch-entries-title">{t.entries} ({filteredEntries.length})</h2>
            {filteredEntries.length === 0 && (
              <div className="ch-empty" data-reveal="fade">
                <span className="ch-empty-icon icon-tile icon-tile--lg icon-tile--round" aria-hidden="true">🤲</span>
                <p>{t.noEntries}</p>
              </div>
            )}
            {filteredEntries.length > 0 && (
              <ul className="ch-entry-list m-list" data-reveal="stagger">
                {filteredEntries.map(entry => {
                  const dt = getDeedType(entry.type)
                  return (
                    <li key={entry.id}>
                      <div className="ch-entry-card m-row">
                        <span className={`ch-entry-icon ${tileClass(dt.key)}`} aria-hidden="true">{dt.icon}</span>
                        <div className="ch-entry-body">
                          <div className="ch-entry-top">
                            <span className="ch-entry-type">{dt[lang] || dt.en}</span>
                            <time className="ch-entry-date" dateTime={entry.date}>{formatEntryDate(entry.date, lang)}</time>
                          </div>
                          {entry.description && (
                            <p className="ch-entry-desc">{entry.description}</p>
                          )}
                          {entry.amount != null && entry.amount > 0 && (
                            <span className="ch-entry-amount">{entry.amount.toFixed(2)}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="ch-entry-delete press"
                          onClick={() => handleDelete(entry.id)}
                          title={t.delete}
                          aria-label={t.delete}
                        >
                          &times;
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

        </div>
      </section>
    </>
  )
}
