import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import '../styles/DuaJournalPage.css'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Dua Gündəliyi', subtitle:'Şəxsi dualarını yaz və izlə', active:'Aktiv Dualar', answered:'Qəbul Olunanlar', add:'Dua əlavə et', placeholder:'Duanı yaz...', personal:'Şəxsi', family:'Ailə', health:'Sağlamlıq', work:'İş', ummah:'Ümmət', low:'Aşağı', medium:'Orta', high:'Yüksək', markAnswered:'Qəbul oldu', delete:'Sil', noActive:'Aktiv dua yoxdur', noAnswered:'Hələ qəbul olunan yoxdur', answeredOn:'Qəbul tarixi', priority:'Prioritet', category:'Kateqoriya', total:'Ümumi', save:'Saxla', cancel:'Ləğv et' },
  en: { title:'Dua Journal', subtitle:'Write and track your personal duas', active:'Active Duas', answered:'Answered', add:'Add dua', placeholder:'Write your dua...', personal:'Personal', family:'Family', health:'Health', work:'Work', ummah:'Ummah', low:'Low', medium:'Medium', high:'High', markAnswered:'Answered', delete:'Delete', noActive:'No active duas', noAnswered:'No answered duas yet', answeredOn:'Answered on', priority:'Priority', category:'Category', total:'Total', save:'Save', cancel:'Cancel' },
  ru: { title:'Дневник Дуа', subtitle:'Записывай и отслеживай свои дуа', active:'Активные', answered:'Отвеченные', add:'Добавить дуа', placeholder:'Напиши дуа...', personal:'Личное', family:'Семья', health:'Здоровье', work:'Работа', ummah:'Умма', low:'Низкий', medium:'Средний', high:'Высокий', markAnswered:'Отвечено', delete:'Удалить', noActive:'Нет активных дуа', noAnswered:'Пока нет отвеченных', answeredOn:'Дата ответа', priority:'Приоритет', category:'Категория', total:'Всего', save:'Сохранить', cancel:'Отмена' },
  ar: { title:'مذكرة الدعاء', subtitle:'اكتب وتتبع أدعيتك الشخصية', active:'أدعية نشطة', answered:'مستجابة', add:'أضف دعاء', placeholder:'اكتب دعاءك...', personal:'شخصي', family:'عائلة', health:'صحة', work:'عمل', ummah:'أمة', low:'منخفض', medium:'متوسط', high:'عالي', markAnswered:'استُجيب', delete:'حذف', noActive:'لا أدعية نشطة', noAnswered:'لا أدعية مستجابة بعد', answeredOn:'تاريخ الإجابة', priority:'الأولوية', category:'الفئة', total:'الإجمالي', save:'حفظ', cancel:'إلغاء' },
  tr: { title:'Dua Günlüğü', subtitle:'Kişisel dualarını yaz ve takip et', active:'Aktif Dualar', answered:'Kabul Edilenler', add:'Dua ekle', placeholder:'Duanı yaz...', personal:'Kişisel', family:'Aile', health:'Sağlık', work:'İş', ummah:'Ümmet', low:'Düşük', medium:'Orta', high:'Yüksek', markAnswered:'Kabul edildi', delete:'Sil', noActive:'Aktif dua yok', noAnswered:'Henüz kabul edilen yok', answeredOn:'Kabul tarihi', priority:'Öncelik', category:'Kategori', total:'Toplam', save:'Kaydet', cancel:'İptal' },
}

const CATEGORIES = ['personal', 'family', 'health', 'work', 'ummah']
const PRIORITIES = ['low', 'medium', 'high']
const STORAGE_KEY = 'dua_journal'

const CATEGORY_ICONS = { personal:'🤲', family:'👨‍👩‍👧‍👦', health:'💚', work:'💼', ummah:'🌍' }
const PRIORITY_COLORS = { low:'var(--info)', medium:'var(--warning)', high:'var(--danger)' }

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { duas: [] }
  } catch { return { duas: [] } }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export default function DuaJournalPage() {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const [duas, setDuas] = useState([])
  const [tab, setTab] = useState('active')
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [category, setCategory] = useState('personal')
  const [priority, setPriority] = useState('medium')

  useEffect(() => {
    const data = loadData()
    setDuas(data.duas || [])
  }, [])

  const persist = useCallback((updated) => {
    setDuas(updated)
    saveData({ duas: updated })
  }, [])

  const addDua = () => {
    if (!text.trim()) return
    const newDua = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: text.trim(),
      category,
      priority,
      date: new Date().toISOString().split('T')[0],
      answered: false,
      answeredDate: null,
    }
    persist([newDua, ...duas])
    setText('')
    setCategory('personal')
    setPriority('medium')
    setShowForm(false)
  }

  const markAnswered = (id) => {
    haptic()
    persist(duas.map(d => d.id === id ? { ...d, answered: true, answeredDate: new Date().toISOString().split('T')[0] } : d))
  }

  const deleteDua = (id) => {
    persist(duas.filter(d => d.id !== id))
  }

  const activeDuas = duas.filter(d => !d.answered)
  const answeredDuas = duas.filter(d => d.answered)
  const list = tab === 'active' ? activeDuas : answeredDuas

  return (
    <div className="dua-journal-page">
      {/* Hero */}
      <div className="page-hero hero-compact theme-duajournal">
        <div className="page-hero-arabic">رَبَّنَا تَقَبَّلْ مِنَّا</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="dua-journal-layout">
          {/* Stats — telefonda üç sütunlu tək kart */}
          <div className="dua-stats-row">
            <div className="dua-stat-card">
              <span className="dua-stat-value">{activeDuas.length}</span>
              <span className="dua-stat-label">{t.active}</span>
            </div>
            <div className="dua-stat-card dua-stat-answered">
              <span className="dua-stat-value">{answeredDuas.length}</span>
              <span className="dua-stat-label">{t.answered}</span>
            </div>
            <div className="dua-stat-card">
              <span className="dua-stat-value">{duas.length}</span>
              <span className="dua-stat-label">{t.total}</span>
            </div>
          </div>

          {/* Add button — telefonda tam en (baş barmaqla rahat) */}
          {!showForm && (
            <button type="button" className="btn-primary dua-add-btn" onClick={() => setShowForm(true)}>
              <span aria-hidden="true">＋</span> {t.add}
            </button>
          )}

          {/* Form — açılanda yumşaq qalxır (DuaJournalPage.css → djFormIn) */}
          {showForm && (
            <div className="dua-form card">
              <textarea
                dir="auto"
                aria-label={t.placeholder}
                className="input-base dua-textarea"
                placeholder={t.placeholder}
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="dua-form-options">
                <div className="dua-form-group">
                  <span className="dua-form-label" id="dj-cat-label">{t.category}</span>
                  <div className="dua-form-chips" role="group" aria-labelledby="dj-cat-label">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        type="button"
                        className="m-chip"
                        aria-pressed={category === c}
                        onClick={() => setCategory(c)}
                      >
                        <span aria-hidden="true">{CATEGORY_ICONS[c]}</span> {t[c]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="dua-form-group">
                  <span className="dua-form-label" id="dj-prio-label">{t.priority}</span>
                  {/* Prioritet — seqment idarəsi; rəngli nöqtə kartdakı ilə eynidir */}
                  <div className="m-seg dj-prio-seg" role="group" aria-labelledby="dj-prio-label">
                    {PRIORITIES.map(p => (
                      <button
                        key={p}
                        type="button"
                        className="m-seg-btn"
                        aria-pressed={priority === p}
                        onClick={() => setPriority(p)}
                      >
                        <span className="dua-priority-dot" style={{ background: PRIORITY_COLORS[p] }} aria-hidden="true" />
                        {t[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="dua-form-actions">
                <button type="button" className="btn-primary" onClick={addDua} disabled={!text.trim()}>{t.save}</button>
                <button type="button" className="btn-ghost" aria-label={t.cancel}
                  onClick={() => { setShowForm(false); setText('') }}>
                  ✕ {t.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Tabs — telefonda seqment idarəsi (.m-seg), genişdə alt xətli tablar */}
          <div className="dua-tabs m-seg" role="tablist">
            <button type="button" role="tab" id="dj-tab-active" aria-selected={tab === 'active'} aria-controls="dj-panel"
              className={`dua-tab m-seg-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>
              {t.active} <span className="dua-tab-count">{activeDuas.length}</span>
            </button>
            <button type="button" role="tab" id="dj-tab-answered" aria-selected={tab === 'answered'} aria-controls="dj-panel"
              className={`dua-tab m-seg-btn${tab === 'answered' ? ' active' : ''}`} onClick={() => setTab('answered')}>
              {t.answered} <span className="dua-tab-count">{answeredDuas.length}</span>
            </button>
          </div>

          {/* List — hər kart ekrana girəndə yumşaq qalxır (ilk 8-i növbə ilə) */}
          <div className="dj-list" id="dj-panel" role="tabpanel" aria-labelledby={tab === 'active' ? 'dj-tab-active' : 'dj-tab-answered'}>
            {list.length === 0 && (
              <div className="dua-empty" key={`empty-${tab}`} data-reveal="fade">
                <span className="icon-tile icon-tile--lg icon-tile--round dua-empty-icon" aria-hidden="true">{tab === 'active' ? '🤲' : '✨'}</span>
                <p>{tab === 'active' ? t.noActive : t.noAnswered}</p>
              </div>
            )}
            {list.map((dua, i) => (
              <div
                key={dua.id}
                className={`dj-card card${dua.answered ? ' dj-card-answered' : ''}`}
                data-reveal="" data-reveal-delay={Math.min(i, 7) * 40}
              >
                <div className="dj-card-top">
                  <span className="dua-category-badge" title={t[dua.category]}>
                    <span aria-hidden="true">{CATEGORY_ICONS[dua.category]}</span> {t[dua.category]}
                  </span>
                  {/* Prioritet: genişdə yalnız rəngli nöqtə (başlıq ipucu ilə), telefonda nöqtə + ad */}
                  <span className="dj-prio" title={`${t.priority}: ${t[dua.priority]}`}>
                    <span className="dua-priority-dot" style={{ background: PRIORITY_COLORS[dua.priority] }} aria-hidden="true" />
                    <span className="dj-prio-label">{t[dua.priority]}</span>
                  </span>
                </div>
                <p className="dj-card-text" dir="auto">{dua.text}</p>
                <div className="dj-card-meta">
                  <span className="dj-card-date">{dua.date}</span>
                  {dua.answered && dua.answeredDate && (
                    <span className="dj-card-answered-date">
                      ✅ {t.answeredOn}: {dua.answeredDate}
                    </span>
                  )}
                </div>
                <div className="dj-card-actions">
                  {!dua.answered && (
                    <button type="button" className="btn-secondary dua-action-btn" onClick={() => markAnswered(dua.id)}>
                      ✓ {t.markAnswered}
                    </button>
                  )}
                  <button type="button" className="btn-ghost dua-action-btn dua-delete-btn" onClick={() => deleteDua(dua.id)}>
                    🗑 {t.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
