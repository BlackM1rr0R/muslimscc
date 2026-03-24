import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/CharityPage.css'

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

const LABELS = {
  az: { title:'Sədəqə Gündəliyi', subtitle:'Gündəlik xeyir əməllərinizi qeyd edin', heroArabic:'صَدَقَة', total:'Ümumi əməl', totalAmount:'Ümumi məbləğ', streak:'Ardıcıl gün', addTitle:'Yeni əməl əlavə et', date:'Tarix', type:'Növ', amount:'Məbləğ (istəyə bağlı)', description:'Təsvir', add:'Əlavə et', entries:'Qeydlər', noEntries:'Hələ heç bir qeyd yoxdur', delete:'Sil', all:'Hamısı', filterBy:'Süzgəc' },
  en: { title:'Charity Diary', subtitle:'Track your daily good deeds', heroArabic:'صَدَقَة', total:'Total Deeds', totalAmount:'Total Amount', streak:'Day Streak', addTitle:'Add New Deed', date:'Date', type:'Type', amount:'Amount (optional)', description:'Description', add:'Add', entries:'Entries', noEntries:'No entries yet', delete:'Delete', all:'All', filterBy:'Filter' },
  ru: { title:'Дневник милостыни', subtitle:'Записывайте ваши ежедневные добрые дела', heroArabic:'صَدَقَة', total:'Всего дел', totalAmount:'Общая сумма', streak:'Дней подряд', addTitle:'Добавить дело', date:'Дата', type:'Тип', amount:'Сумма (необязательно)', description:'Описание', add:'Добавить', entries:'Записи', noEntries:'Пока нет записей', delete:'Удалить', all:'Все', filterBy:'Фильтр' },
  ar: { title:'يوميات الصدقة', subtitle:'سجّل أعمالك الخيرية اليومية', heroArabic:'صَدَقَة', total:'إجمالي الأعمال', totalAmount:'المبلغ الإجمالي', streak:'أيام متتالية', addTitle:'أضف عملاً جديداً', date:'التاريخ', type:'النوع', amount:'المبلغ (اختياري)', description:'الوصف', add:'أضف', entries:'السجلات', noEntries:'لا توجد سجلات بعد', delete:'حذف', all:'الكل', filterBy:'تصفية' },
  tr: { title:'Sadaka Günlüğü', subtitle:'Günlük hayır işlerinizi kaydedin', heroArabic:'صَدَقَة', total:'Toplam İş', totalAmount:'Toplam Tutar', streak:'Ardışık Gün', addTitle:'Yeni İş Ekle', date:'Tarih', type:'Tür', amount:'Tutar (isteğe bağlı)', description:'Açıklama', add:'Ekle', entries:'Kayıtlar', noEntries:'Henüz kayıt yok', delete:'Sil', all:'Tümü', filterBy:'Filtre' },
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function calcStreak(entries) {
  if (!entries.length) return 0
  const uniqueDays = [...new Set(entries.map(e => e.date))].sort().reverse()
  const today = getToday()
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
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
    localStorage.setItem('charity_log', JSON.stringify(entries))
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
  }

  const handleDelete = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const getDeedType = (key) => DEED_TYPES.find(d => d.key === key) || DEED_TYPES[7]

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="breadcrumb">
          <button onClick={() => setPage('home')}>muslims.cc</button>
          <span>/</span>
          <span>{t.title}</span>
        </div>
        <div className="page-hero-arabic">{t.heroArabic}</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="section">
        <div className="section-inner ch-container">

          {/* Stats */}
          <div className="ch-stats anim-fadeUp">
            <div className="ch-stat-card">
              <span className="ch-stat-icon">🤲</span>
              <span className="ch-stat-value">{stats.total}</span>
              <span className="ch-stat-label">{t.total}</span>
            </div>
            <div className="ch-stat-card">
              <span className="ch-stat-icon">💰</span>
              <span className="ch-stat-value">{stats.totalAmount > 0 ? stats.totalAmount.toFixed(2) : '0'}</span>
              <span className="ch-stat-label">{t.totalAmount}</span>
            </div>
            <div className="ch-stat-card">
              <span className="ch-stat-icon">🔥</span>
              <span className="ch-stat-value">{stats.streak}</span>
              <span className="ch-stat-label">{t.streak}</span>
            </div>
          </div>

          {/* Add Form */}
          <div className="ch-form-card anim-fadeUp d1">
            <h2 className="ch-form-title">{t.addTitle}</h2>
            <form className="ch-form" onSubmit={handleAdd}>
              <div className="ch-form-row">
                <div className="ch-form-group">
                  <label className="ch-label">{t.date}</label>
                  <input
                    type="date"
                    className="input-base"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="ch-form-group">
                  <label className="ch-label">{t.amount}</label>
                  <input
                    type="number"
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
                <label className="ch-label">{t.type}</label>
                <div className="ch-type-grid">
                  {DEED_TYPES.map(dt => (
                    <button
                      key={dt.key}
                      type="button"
                      className={`ch-type-btn${type === dt.key ? ' active' : ''}`}
                      onClick={() => setType(dt.key)}
                    >
                      <span>{dt.icon}</span>
                      <span>{dt[lang] || dt.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ch-form-group">
                <label className="ch-label">{t.description}</label>
                <input
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

          {/* Filter */}
          <div className="ch-filter anim-fadeUp d2">
            <span className="ch-filter-label">{t.filterBy}:</span>
            <div className="tag-filters">
              <button
                className={`tag-btn${filterType === 'all' ? ' active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                {t.all}
              </button>
              {DEED_TYPES.map(dt => (
                <button
                  key={dt.key}
                  className={`tag-btn${filterType === dt.key ? ' active' : ''}`}
                  onClick={() => setFilterType(dt.key)}
                >
                  {dt.icon} {dt[lang] || dt.en}
                </button>
              ))}
            </div>
          </div>

          {/* Entries */}
          <div className="ch-entries anim-fadeUp d3">
            <h2 className="ch-entries-title">{t.entries} ({filteredEntries.length})</h2>
            {filteredEntries.length === 0 && (
              <div className="ch-empty">{t.noEntries}</div>
            )}
            {filteredEntries.map(entry => {
              const dt = getDeedType(entry.type)
              return (
                <div key={entry.id} className="ch-entry-card">
                  <div className="ch-entry-icon">{dt.icon}</div>
                  <div className="ch-entry-body">
                    <div className="ch-entry-top">
                      <span className="ch-entry-type">{dt[lang] || dt.en}</span>
                      <span className="ch-entry-date">{entry.date}</span>
                    </div>
                    {entry.description && (
                      <p className="ch-entry-desc">{entry.description}</p>
                    )}
                    {entry.amount != null && entry.amount > 0 && (
                      <span className="ch-entry-amount">{entry.amount.toFixed(2)}</span>
                    )}
                  </div>
                  <button
                    className="ch-entry-delete"
                    onClick={() => handleDelete(entry.id)}
                    title={t.delete}
                  >
                    &times;
                  </button>
                </div>
              )
            })}
          </div>

        </div>
      </section>
    </>
  )
}
