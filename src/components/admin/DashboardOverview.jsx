import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { AdminHeader, SectionTitle } from './AdminUi'

const LABELS = {
  az: { welcome:'Xoş gəldiniz, Admin!', sub:'Burada bütün məzmunu idarə edə bilərsiniz', total:'Ümumi məzmun', quickAdd:'Sürətli əməliyyat', videos:'Video', books:'Kitab', hadiths:'Hədis', duas:'Dua', announcements:'Elan', addVideo:'Video əlavə et', addBook:'Kitab əlavə et', addHadith:'Hədis əlavə et', addDua:'Dua əlavə et', addAnnouncement:'Elan əlavə et', stats:'Statistika' },
  en: { welcome:'Welcome, Admin!', sub:'Manage all content from here', total:'Total content', quickAdd:'Quick actions', videos:'Videos', books:'Books', hadiths:'Hadiths', duas:'Duas', announcements:'Announcements', addVideo:'Add Video', addBook:'Add Book', addHadith:'Add Hadith', addDua:'Add Dua', addAnnouncement:'Add Announcement', stats:'Statistics' },
  ru: { welcome:'Добро пожаловать, администратор!', sub:'Управляйте всем контентом', total:'Всего контента', quickAdd:'Быстрые действия', videos:'Видео', books:'Книги', hadiths:'Хадисы', duas:'Дуа', announcements:'Объявления', addVideo:'Добавить видео', addBook:'Добавить книгу', addHadith:'Добавить хадис', addDua:'Добавить дуа', addAnnouncement:'Добавить объявление', stats:'Статистика' },
  ar: { welcome:'مرحبًا بك أيها المشرف!', sub:'إدارة جميع المحتويات', total:'إجمالي المحتوى', quickAdd:'إجراءات سريعة', videos:'فيديوهات', books:'كتب', hadiths:'أحاديث', duas:'أدعية', announcements:'إعلانات', addVideo:'إضافة فيديو', addBook:'إضافة كتاب', addHadith:'إضافة حديث', addDua:'إضافة دعاء', addAnnouncement:'إضافة إعلان', stats:'الإحصائيات' },
  tr: { welcome:'Hoş geldiniz, Yönetici!', sub:'Tüm içerikleri buradan yönetin', total:'Toplam içerik', quickAdd:'Hızlı işlemler', videos:'Video', books:'Kitap', hadiths:'Hadis', duas:'Dua', announcements:'Duyuru', addVideo:'Video Ekle', addBook:'Kitap Ekle', addHadith:'Hadis Ekle', addDua:'Dua Ekle', addAnnouncement:'Duyuru Ekle', stats:'İstatistikler' },
}

export default function DashboardOverview({ counts, setActiveTab }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const total = (counts.videos || 0) + (counts.books || 0) + (counts.hadiths || 0) + (counts.duas || 0) + (counts.announcements || 0)

  // Rəngli kartlar əvəzinə vahid görünüş: ikon kafeli (brend tonu) + rəqəm
  const cards = [
    { key:'videos',        icon:'videos',        label:l.videos,        count:counts.videos || 0,        tab:'videos',        add:l.addVideo },
    { key:'books',         icon:'books',         label:l.books,         count:counts.books || 0,         tab:'books',         add:l.addBook },
    { key:'hadiths',       icon:'hadith',        label:l.hadiths,       count:counts.hadiths || 0,       tab:'hadiths',       add:l.addHadith },
    { key:'duas',          icon:'duas',          label:l.duas,          count:counts.duas || 0,          tab:'duas',          add:l.addDua },
    { key:'announcements', icon:'announcements', label:l.announcements, count:counts.announcements || 0, tab:'announcements', add:l.addAnnouncement },
  ]

  return (
    <div>
      <AdminHeader icon="home" title={l.welcome} sub={l.sub} />

      {/* Ümumi məzmun — tünd zümrüd zolaq */}
      <section className="admin-hero" data-reveal="scale" aria-label={l.total}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div>
          <div className="admin-hero-label">{l.total}</div>
          {/* data-count — görünəndə 0-dan sayır; key: say gələndə yenidən */}
          <div className="admin-hero-num"><span key={total} data-count={total}>{total}</span></div>
        </div>
        <ul className="admin-hero-breakdown">
          {cards.map(c => (
            <li key={c.key}><Icon name={c.icon} size={16} /> <span>{c.label}</span> <b>{c.count}</b></li>
          ))}
        </ul>
      </section>

      {/* Məzmun sayları — kart bölməyə aparır */}
      <div className="admin-stats" data-reveal="stagger-zoom">
        {cards.map(card => (
          <button key={card.key} type="button" className="admin-stat-card" onClick={() => setActiveTab(card.tab)}>
            <span className="ui-icon-tile admin-stat-icon" aria-hidden="true"><Icon name={card.icon} /></span>
            <span className="admin-stat-num"><span key={card.count} data-count={card.count}>{card.count}</span></span>
            <span className="admin-stat-label">{card.label}</span>
          </button>
        ))}
      </div>

      {/* Sürətli əməliyyatlar */}
      <section className="admin-section" data-reveal>
        <SectionTitle icon="bolt" tone="accent">{l.quickAdd}</SectionTitle>
        <div className="admin-quick">
          {cards.map(c => (
            <button key={c.key} type="button" className="ui-btn ui-btn--secondary" onClick={() => setActiveTab(c.tab)}>
              <Icon name="plus" className="ui-btn__icon" /> {c.add}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
