import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import '../styles/DuaJournalPage.css'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Dua gündəliyi', subtitle:'Şəxsi dualarını yaz və izlə', active:'Aktiv dualar', answered:'Qəbul olunanlar', add:'Dua əlavə et', placeholder:'Duanı yaz...', personal:'Şəxsi', family:'Ailə', health:'Sağlamlıq', work:'İş', ummah:'Ümmət', low:'Aşağı', medium:'Orta', high:'Yüksək', markAnswered:'Qəbul oldu', delete:'Sil', noActive:'Aktiv dua yoxdur', noAnswered:'Hələ qəbul olunan yoxdur', answeredOn:'Qəbul tarixi', priority:'Prioritet', category:'Kateqoriya', total:'Ümumi', save:'Saxla', cancel:'Ləğv et', confirmDelete:'Bu dua silinsin?' },
  en: { title:'Dua Journal', subtitle:'Write and track your personal duas', active:'Active Duas', answered:'Answered', add:'Add dua', placeholder:'Write your dua...', personal:'Personal', family:'Family', health:'Health', work:'Work', ummah:'Ummah', low:'Low', medium:'Medium', high:'High', markAnswered:'Answered', delete:'Delete', noActive:'No active duas', noAnswered:'No answered duas yet', answeredOn:'Answered on', priority:'Priority', category:'Category', total:'Total', save:'Save', cancel:'Cancel', confirmDelete:'Delete this dua?' },
  ru: { title:'Дневник дуа', subtitle:'Записывай и отслеживай свои дуа', active:'Активные', answered:'Отвеченные', add:'Добавить дуа', placeholder:'Напиши дуа...', personal:'Личное', family:'Семья', health:'Здоровье', work:'Работа', ummah:'Умма', low:'Низкий', medium:'Средний', high:'Высокий', markAnswered:'Отвечено', delete:'Удалить', noActive:'Нет активных дуа', noAnswered:'Пока нет отвеченных', answeredOn:'Дата ответа', priority:'Приоритет', category:'Категория', total:'Всего', save:'Сохранить', cancel:'Отмена', confirmDelete:'Удалить это дуа?' },
  ar: { title:'مذكرة الدعاء', subtitle:'اكتب وتتبع أدعيتك الشخصية', active:'أدعية نشطة', answered:'مستجابة', add:'أضف دعاء', placeholder:'اكتب دعاءك...', personal:'شخصي', family:'عائلة', health:'صحة', work:'عمل', ummah:'أمة', low:'منخفض', medium:'متوسط', high:'عالي', markAnswered:'استُجيب', delete:'حذف', noActive:'لا أدعية نشطة', noAnswered:'لا أدعية مستجابة بعد', answeredOn:'تاريخ الإجابة', priority:'الأولوية', category:'الفئة', total:'الإجمالي', save:'حفظ', cancel:'إلغاء', confirmDelete:'هل تريد حذف هذا الدعاء؟' },
  tr: { title:'Dua Günlüğü', subtitle:'Kişisel dualarını yaz ve takip et', active:'Aktif dualar', answered:'Kabul edilenler', add:'Dua ekle', placeholder:'Duanı yaz...', personal:'Kişisel', family:'Aile', health:'Sağlık', work:'İş', ummah:'Ümmet', low:'Düşük', medium:'Orta', high:'Yüksek', markAnswered:'Kabul edildi', delete:'Sil', noActive:'Aktif dua yok', noAnswered:'Henüz kabul edilen yok', answeredOn:'Kabul tarihi', priority:'Öncelik', category:'Kategori', total:'Toplam', save:'Kaydet', cancel:'İptal', confirmDelete:'Bu dua silinsin mi?' },
}

const CATEGORIES = ['personal', 'family', 'health', 'work', 'ummah']
const PRIORITIES = ['low', 'medium', 'high']
const STORAGE_KEY = 'dua_journal'

// Kateqoriya ikonları (Icon.jsx adları; prioritet rəngləri CSS-dədir: .dj-dot--low|medium|high)
const CATEGORY_ICONS = { personal:'user', family:'jamaat', health:'donate', work:'list', ummah:'globe' }

// Tarix interfeys dilində: "28 oktyabr 2026" (yaddaşda ISO "2026-10-28" qalır)
const LOCALE = { az:'az-AZ', en:'en-GB', ru:'ru-RU', ar:'ar', tr:'tr-TR' }
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
function formatDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  if (!m) return iso || ''
  // Bəzi brauzerlərdə az-AZ ay adları yoxdur ("2026 M10 28") — özümüz yazırıq
  if (lang === 'az') return `${+m[3]} ${AZ_MONTHS[+m[2] - 1] || m[2]} ${m[1]}`
  try {
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(LOCALE[lang] || 'az-AZ', { day:'numeric', month:'long', year:'numeric' })
  } catch { return iso }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { duas: [] }
  } catch { return { duas: [] } }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export default function DuaJournalPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az
  const fmtDate = (iso) => formatDate(iso, lang)

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

  // Silmə geri qaytarılmır — təsadüfi toxunuşa qarşı təsdiq soruşulur
  const deleteDua = (id) => {
    if (!window.confirm(t.confirmDelete)) return
    persist(duas.filter(d => d.id !== id))
  }

  const cancelForm = () => { setShowForm(false); setText('') }

  const activeDuas = duas.filter(d => !d.answered)
  const answeredDuas = duas.filter(d => d.answered)
  const list = tab === 'active' ? activeDuas : answeredDuas

  return (
    <div className="dua-journal-page">
      {/* Hero — dizayn v2 (sakit kağız fon + xatəm naxışı), bir <h1> */}
      <header className="ui-page-hero dj-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('duajournal'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="dj-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">رَبَّنَا تَقَبَّلْ مِنَّا</p>
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow dua-journal-layout">
          {/* Statistika — bir kartda üç göstərici */}
          <div className="ui-card dua-stats-row" data-reveal="stagger">
            <div className="ui-stat dua-stat-card">
              <span className="ui-stat__num dua-stat-value">{activeDuas.length}</span>
              <span className="ui-stat__label">{t.active}</span>
            </div>
            <div className="ui-stat dua-stat-card dua-stat-answered">
              <span className="ui-stat__num dua-stat-value">{answeredDuas.length}</span>
              <span className="ui-stat__label">{t.answered}</span>
            </div>
            <div className="ui-stat dua-stat-card">
              <span className="ui-stat__num dua-stat-value">{duas.length}</span>
              <span className="ui-stat__label">{t.total}</span>
            </div>
          </div>

          {/* Əlavə et — telefonda tam en (baş barmaqla rahat) */}
          {!showForm && (
            <button type="button" className="ui-btn ui-btn--primary ui-btn--lg dua-add-btn" onClick={() => setShowForm(true)}>
              <Icon name="plus" className="ui-btn__icon" /> {t.add}
            </button>
          )}

          {/* Forma — açılanda yumşaq qalxır (DuaJournalPage.css → djFormIn).
              Esc — ləğv, Ctrl/⌘+Enter — saxla */}
          {showForm && (
            <div className="ui-card dua-form"
              onKeyDown={e => {
                if (e.key === 'Escape') cancelForm()
                else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addDua()
              }}>
              <label className="ui-field">
                <span className="ui-field__label">{t.add}</span>
                <textarea
                  dir="auto"
                  className="ui-input dua-textarea"
                  placeholder={t.placeholder}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  autoFocus
                />
              </label>
              <div className="dua-form-options">
                <div className="dua-form-group">
                  <span className="ui-field__label" id="dj-cat-label">{t.category}</span>
                  <div className="dua-form-chips" role="group" aria-labelledby="dj-cat-label">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        type="button"
                        className="ui-chip"
                        aria-pressed={category === c}
                        onClick={() => setCategory(c)}
                      >
                        <Icon name={CATEGORY_ICONS[c]} size={16} /> {t[c]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="dua-form-group">
                  <span className="ui-field__label" id="dj-prio-label">{t.priority}</span>
                  {/* Prioritet — rəngli nöqtə kartdakı ilə eynidir */}
                  <div className="dua-form-chips" role="group" aria-labelledby="dj-prio-label">
                    {PRIORITIES.map(p => (
                      <button
                        key={p}
                        type="button"
                        className="ui-chip"
                        aria-pressed={priority === p}
                        onClick={() => setPriority(p)}
                      >
                        <span className={`dua-priority-dot dj-dot--${p}`} aria-hidden="true" />
                        {t[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="dua-form-actions">
                <button type="button" className="ui-btn ui-btn--ghost" onClick={cancelForm}>
                  <Icon name="close" className="ui-btn__icon" /> {t.cancel}
                </button>
                <button type="button" className="ui-btn ui-btn--primary" onClick={addDua} disabled={!text.trim()}>
                  <Icon name="check" className="ui-btn__icon" /> {t.save}
                </button>
              </div>
            </div>
          )}

          {/* Tablar — seqment idarəsi (.m-seg) */}
          <div className="dua-tabs m-seg" role="tablist">
            <button type="button" role="tab" id="dj-tab-active" aria-selected={tab === 'active'} aria-controls="dj-panel"
              className={`dua-tab m-seg-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>
              {t.active} <span className="dua-tab-count ui-num">{activeDuas.length}</span>
            </button>
            <button type="button" role="tab" id="dj-tab-answered" aria-selected={tab === 'answered'} aria-controls="dj-panel"
              className={`dua-tab m-seg-btn${tab === 'answered' ? ' active' : ''}`} onClick={() => setTab('answered')}>
              {t.answered} <span className="dua-tab-count ui-num">{answeredDuas.length}</span>
            </button>
          </div>

          {/* Siyahı — hər kart ekrana girəndə yumşaq qalxır (ilk 8-i növbə ilə) */}
          <div className="dj-list" id="dj-panel" role="tabpanel" aria-labelledby={tab === 'active' ? 'dj-tab-active' : 'dj-tab-answered'}>
            {list.length === 0 && (
              <div className="dua-empty" key={`empty-${tab}`} data-reveal="fade">
                <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--accent" aria-hidden="true">
                  <Icon name={tab === 'active' ? 'duajournal' : 'sparkle'} />
                </span>
                <p>{tab === 'active' ? t.noActive : t.noAnswered}</p>
              </div>
            )}
            {list.map((dua, i) => (
              <article
                key={dua.id}
                className={`ui-card dj-card${dua.answered ? ' dj-card-answered' : ''}`}
                data-reveal="" data-reveal-delay={Math.min(i, 7) * 40}
              >
                <div className="dj-card-top">
                  <span className="ui-badge ui-badge--brand dua-category-badge">
                    <Icon name={CATEGORY_ICONS[dua.category] || 'user'} size={14} /> {t[dua.category]}
                  </span>
                  <span className="dj-prio" title={`${t.priority}: ${t[dua.priority]}`}>
                    <span className={`dua-priority-dot dj-dot--${dua.priority}`} aria-hidden="true" />
                    <span className="dj-prio-label">{t[dua.priority]}</span>
                  </span>
                </div>
                <p className="dj-card-text" dir="auto">{dua.text}</p>
                <div className="dj-card-meta">
                  <span className="dj-card-date">
                    <Icon name="calendar" size={14} /> {fmtDate(dua.date)}
                  </span>
                  {dua.answered && dua.answeredDate && (
                    <span className="dj-card-answered-date">
                      <Icon name="check" size={14} /> {t.answeredOn}: {fmtDate(dua.answeredDate)}
                    </span>
                  )}
                </div>
                <div className="dj-card-actions">
                  {!dua.answered && (
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm dua-action-btn" onClick={() => markAnswered(dua.id)}>
                      <Icon name="check" className="ui-btn__icon" /> {t.markAnswered}
                    </button>
                  )}
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dua-action-btn dua-delete-btn" onClick={() => deleteDua(dua.id)}>
                    <Icon name="trash" className="ui-btn__icon" /> {t.delete}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
