import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { ChartFigure, BarChart } from '../viz'
import { AdminHeader, SectionTitle } from './AdminUi'
import { pickUi } from '../../utils/uiText'

// ═══════════════════════════════════════════════════════
// Admin — İdarə paneli (dizayn v3)
//   • rəqəm kafelləri: ümumi + hər məzmun növü (kafel bölməyə aparır)
//   • "Məzmun bölgüsü" — üfüqi zolaq qrafiki (components/viz)
//   • sürətli əməliyyatlar + sistem keçidləri — ikonlu siyahı
// Əvvəlki tünd "Ümumi məzmun" zolağı eyni rəqəmləri ikinci dəfə göstərirdi — silindi.
// ═══════════════════════════════════════════════════════

const LABELS = {
  az: { welcome:'Xoş gəldiniz, Admin!', sub:'Saytın məzmununu, bildirişləri və parametrləri buradan idarə edin', total:'Ümumi məzmun', totalHint:'admin əlavə etdiyi', quickAdd:'Sürətli əməliyyat', videos:'Video', books:'Kitab', hadiths:'Hədis', duas:'Dua', announcements:'Elan', quotes:'Sitat', events:'Hadisə', addVideo:'Video əlavə et', addBook:'Kitab əlavə et', addHadith:'Hədis əlavə et', addDua:'Dua əlavə et', addAnnouncement:'Elan əlavə et', stats:'Statistika', chart:'Məzmun bölgüsü', chartSub:'növlər üzrə say', system:'Sistem', analytics:'Sayt statistikası', feedback:'Səhv bildirişləri', push:'Anlıq bildiriş göndər', backup:'Ehtiyat nüsxə' },
  en: { welcome:'Welcome, Admin!', sub:'Manage the site’s content, notifications and settings from here', total:'Total content', totalHint:'added by admins', quickAdd:'Quick actions', videos:'Videos', books:'Books', hadiths:'Hadiths', duas:'Duas', announcements:'Announcements', quotes:'Quotes', events:'Events', addVideo:'Add Video', addBook:'Add Book', addHadith:'Add Hadith', addDua:'Add Dua', addAnnouncement:'Add Announcement', stats:'Statistics', chart:'Content breakdown', chartSub:'count by type', system:'System', analytics:'Site analytics', feedback:'Error reports', push:'Send a push notification', backup:'Backup' },
  ru: { welcome:'Добро пожаловать, администратор!', sub:'Управляйте материалами, уведомлениями и настройками сайта', total:'Всего контента', totalHint:'добавлено админами', quickAdd:'Быстрые действия', videos:'Видео', books:'Книги', hadiths:'Хадисы', duas:'Дуа', announcements:'Объявления', quotes:'Цитаты', events:'События', addVideo:'Добавить видео', addBook:'Добавить книгу', addHadith:'Добавить хадис', addDua:'Добавить дуа', addAnnouncement:'Добавить объявление', stats:'Статистика', chart:'Состав контента', chartSub:'число по типам', system:'Система', analytics:'Статистика сайта', feedback:'Сообщения об ошибках', push:'Отправить уведомление', backup:'Резервная копия' },
  ar: { welcome:'مرحبًا بك أيها المشرف!', sub:'أدِر محتوى الموقع والإشعارات والإعدادات من هنا', total:'إجمالي المحتوى', totalHint:'أضافه المشرفون', quickAdd:'إجراءات سريعة', videos:'فيديوهات', books:'كتب', hadiths:'أحاديث', duas:'أدعية', announcements:'إعلانات', quotes:'اقتباسات', events:'أحداث', addVideo:'إضافة فيديو', addBook:'إضافة كتاب', addHadith:'إضافة حديث', addDua:'إضافة دعاء', addAnnouncement:'إضافة إعلان', stats:'الإحصائيات', chart:'توزيع المحتوى', chartSub:'العدد حسب النوع', system:'النظام', analytics:'إحصائيات الموقع', feedback:'بلاغات الأخطاء', push:'إرسال إشعار فوري', backup:'النسخ الاحتياطي' },
  tr: { welcome:'Hoş geldiniz, Yönetici!', sub:'Sitenin içeriğini, bildirimlerini ve ayarlarını buradan yönetin', total:'Toplam içerik', totalHint:'yöneticilerin eklediği', quickAdd:'Hızlı işlemler', videos:'Video', books:'Kitap', hadiths:'Hadis', duas:'Dua', announcements:'Duyuru', quotes:'Alıntı', events:'Olay', addVideo:'Video Ekle', addBook:'Kitap Ekle', addHadith:'Hadis Ekle', addDua:'Dua Ekle', addAnnouncement:'Duyuru Ekle', stats:'İstatistikler', chart:'İçerik dağılımı', chartSub:'türe göre sayı', system:'Sistem', analytics:'Site istatistikleri', feedback:'Hata bildirimleri', push:'Anlık bildirim gönder', backup:'Yedekleme' },
}

export default function DashboardOverview({ counts, setActiveTab }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang)

  // Rəqəm kafelləri (hər biri öz bölməsini açır)
  const cards = [
    { key:'videos',        icon:'videos',        label:l.videos,        add:l.addVideo },
    { key:'books',         icon:'books',         label:l.books,         add:l.addBook },
    { key:'hadiths',       icon:'hadith',        label:l.hadiths,       add:l.addHadith },
    { key:'duas',          icon:'duas',          label:l.duas,          add:l.addDua },
    { key:'quotes',        icon:'quotes',        label:l.quotes },
    { key:'announcements', icon:'announcements', label:l.announcements, add:l.addAnnouncement },
    { key:'events',        icon:'calendar',      label:l.events },
  ].map(c => ({ ...c, count: counts[c.key] || 0 }))
  const total = cards.reduce((s, c) => s + c.count, 0)

  const system = [
    { tab:'pushNotif', icon:'bell',      label:l.push },
    { tab:'analytics', icon:'analytics', label:l.analytics },
    { tab:'feedback',  icon:'alert',     label:l.feedback },
    { tab:'backup',    icon:'download',  label:l.backup },
  ]

  return (
    <div className="admin-dash">
      <AdminHeader icon="home" title={l.welcome} sub={l.sub} />

      <section className="admin-dash-stats" aria-label={l.stats}>
        <div className="admin-dash-total">
          <span className="admin-dash-total__label">{l.total}</span>
          {/* data-count — görünəndə 0-dan sayır; key: say gələndə yenidən */}
          <span className="admin-dash-total__num ui-num"><span key={total} data-count={total}>{total}</span></span>
          <span className="admin-dash-total__hint">{l.totalHint}</span>
        </div>
        <ul className="admin-stats">
          {cards.map(card => (
            <li key={card.key}>
              <button type="button" className="admin-stat-card" onClick={() => setActiveTab(card.key)}>
                <span className="admin-stat-head">
                  <span className="admin-stat-label">{card.label}</span>
                  <Icon name={card.icon} size={18} className="admin-stat-icon" />
                </span>
                <span className="admin-stat-num ui-num"><span key={card.count} data-count={card.count}>{card.count}</span></span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="admin-dash-grid">
        <ChartFigure title={l.chart} sub={l.chartSub} className="admin-dash-chart">
          <BarChart data={cards.map(c => ({ key: c.key, label: c.label, value: c.count }))} label={l.chart} labelWidth="34%" />
        </ChartFigure>

        <section className="admin-section admin-dash-actions" aria-label={l.quickAdd}>
          <SectionTitle icon="plus">{l.quickAdd}</SectionTitle>
          <ul className="admin-quick">
            {cards.filter(c => c.add).map(c => (
              <li key={c.key}>
                <button type="button" className="admin-quick-btn" onClick={() => setActiveTab(c.key)}>
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="plus" size={16} /></span>
                  <span>{c.add}</span>
                </button>
              </li>
            ))}
          </ul>
          <SectionTitle icon="bolt" tone="accent">{l.system}</SectionTitle>
          <ul className="admin-quick">
            {system.map(s => (
              <li key={s.tab}>
                <button type="button" className="admin-quick-btn" onClick={() => setActiveTab(s.tab)}>
                  <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral" aria-hidden="true"><Icon name={s.icon} size={16} /></span>
                  <span>{s.label}</span>
                  <Icon name="chevron" size={16} className="admin-quick-chev ui-flip-rtl" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
