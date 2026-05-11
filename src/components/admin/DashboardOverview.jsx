import { useLang } from '../../contexts/LangContext'

const LABELS = {
  az: { welcome:'Xoş gəldiniz, Admin!', sub:'Burada bütün məzmunu idarə edə bilərsiniz', total:'Ümumi məzmun', quickAdd:'Sürətli əməliyyat', videos:'Video', books:'Kitab', hadiths:'Hədis', duas:'Dua', announcements:'Elan', addVideo:'Video əlavə et', addBook:'Kitab əlavə et', addHadith:'Hədis əlavə et', addDua:'Dua əlavə et', addAnnouncement:'Elan əlavə et', stats:'Statistika' },
  en: { welcome:'Welcome, Admin!', sub:'Manage all content from here', total:'Total content', quickAdd:'Quick actions', videos:'Videos', books:'Books', hadiths:'Hadiths', duas:'Duas', announcements:'Announcements', addVideo:'Add Video', addBook:'Add Book', addHadith:'Add Hadith', addDua:'Add Dua', addAnnouncement:'Add Announcement', stats:'Statistics' },
  ru: { welcome:'Добро пожаловать, Админ!', sub:'Управляйте всем контентом', total:'Всего контента', quickAdd:'Быстрые действия', videos:'Видео', books:'Книги', hadiths:'Хадисы', duas:'Дуа', announcements:'Объявления', addVideo:'Добавить видео', addBook:'Добавить книгу', addHadith:'Добавить хадис', addDua:'Добавить дуа', addAnnouncement:'Добавить объявление', stats:'Статистика' },
  ar: { welcome:'مرحباً يا أدمن!', sub:'إدارة جميع المحتويات', total:'إجمالي المحتوى', quickAdd:'إجراءات سريعة', videos:'فيديوهات', books:'كتب', hadiths:'أحاديث', duas:'أدعية', announcements:'إعلانات', addVideo:'إضافة فيديو', addBook:'إضافة كتاب', addHadith:'إضافة حديث', addDua:'إضافة دعاء', addAnnouncement:'إضافة إعلان', stats:'الإحصائيات' },
  tr: { welcome:'Hoş geldiniz, Yönetici!', sub:'Tüm içerikleri buradan yönetin', total:'Toplam içerik', quickAdd:'Hızlı işlemler', videos:'Video', books:'Kitap', hadiths:'Hadis', duas:'Dua', announcements:'Duyuru', addVideo:'Video Ekle', addBook:'Kitap Ekle', addHadith:'Hadis Ekle', addDua:'Dua Ekle', addAnnouncement:'Duyuru Ekle', stats:'İstatistikler' },
}

export default function DashboardOverview({ counts, setActiveTab }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const total = (counts.videos || 0) + (counts.books || 0) + (counts.hadiths || 0) + (counts.duas || 0) + (counts.announcements || 0)

  const cards = [
    { key:'videos',        icon:'📹', label:l.videos,        count:counts.videos || 0,        color:'#10b981', tab:'videos' },
    { key:'books',         icon:'📚', label:l.books,         count:counts.books || 0,         color:'#f59e0b', tab:'books' },
    { key:'hadiths',       icon:'📜', label:l.hadiths,       count:counts.hadiths || 0,       color:'#ea580c', tab:'hadiths' },
    { key:'duas',          icon:'🤲', label:l.duas,          count:counts.duas || 0,          color:'#8b5cf6', tab:'duas' },
    { key:'announcements', icon:'📣', label:l.announcements, count:counts.announcements || 0, color:'#ef4444', tab:'announcements' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge">👋</div>
          <div className="admin-header-info">
            <h1>{l.welcome}</h1>
            <p>{l.sub}</p>
          </div>
        </div>
      </div>

      {/* Total stats card */}
      <div className="admin-section" style={{
        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary), var(--primary-light))',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.08)', top:-60, right:-40}} />
        <div style={{position:'absolute', width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.05)', bottom:-40, left:-20}} />
        <div style={{position:'relative', zIndex:1}}>
          <div style={{fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', opacity:0.9, marginBottom:6}}>
            {l.total}
          </div>
          <div style={{fontSize:48, fontWeight:800, letterSpacing:-2, lineHeight:1}}>{total}</div>
          <div style={{fontSize:13, opacity:0.85, marginTop:8, fontWeight:600}}>
            📹 {counts.videos || 0} · 📚 {counts.books || 0} · 📜 {counts.hadiths || 0} · 🤲 {counts.duas || 0} · 📣 {counts.announcements || 0}
          </div>
        </div>
      </div>

      {/* Content count cards */}
      <div className="admin-stats">
        {cards.map(card => (
          <div
            key={card.key}
            className="admin-stat-card"
            style={{'--accent':card.color, '--accent-bg':card.color+'15', cursor:'pointer'}}
            onClick={() => setActiveTab(card.tab)}
          >
            <div className="admin-stat-icon">{card.icon}</div>
            <div className="admin-stat-num">{card.count}</div>
            <div className="admin-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">⚡</span>
          {l.quickAdd}
        </h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12}}>
          <button className="admin-submit-btn" onClick={() => setActiveTab('videos')} style={{background:'linear-gradient(135deg, #10b981, #059669)'}}>
            <span>📹</span> {l.addVideo}
          </button>
          <button className="admin-submit-btn" onClick={() => setActiveTab('books')} style={{background:'linear-gradient(135deg, #f59e0b, #d97706)'}}>
            <span>📚</span> {l.addBook}
          </button>
          <button className="admin-submit-btn" onClick={() => setActiveTab('hadiths')} style={{background:'linear-gradient(135deg, #ea580c, #c2410c)'}}>
            <span>📜</span> {l.addHadith}
          </button>
          <button className="admin-submit-btn" onClick={() => setActiveTab('duas')} style={{background:'linear-gradient(135deg, #8b5cf6, #7c3aed)'}}>
            <span>🤲</span> {l.addDua}
          </button>
          <button className="admin-submit-btn" onClick={() => setActiveTab('announcements')} style={{background:'linear-gradient(135deg, #ef4444, #dc2626)'}}>
            <span>📣</span> {l.addAnnouncement}
          </button>
        </div>
      </div>
    </div>
  )
}
