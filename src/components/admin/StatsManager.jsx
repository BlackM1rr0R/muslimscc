import { useEffect, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, SectionTitle } from './AdminUi'
import Icon from '../Icon'
import { getUserStats } from '../../data/adminContent'

const LABELS = {
  az: { title:'Statistika', sub:'İstifadəçi fəaliyyəti və tətbiq məlumatları', prayer:'Namaz', quran:'Quran', interaction:'Qarşılıqlı əlaqə', misc:'Digər', storage:'Yaddaş', refresh:'Yenilə',
    prayerDays:'Namaz qılınan günlər', totalPrayers:'Ümumi namaz', quranSessions:'Quran oxuma sessiyaları', quranSurahs:'Oxunan surələr', hadithFavs:'Seçilmiş hədislər', duaFavs:'Seçilmiş dualar', dhikrSessions:'Zikr sessiyaları', totalDhikr:'Ümumi zikr sayı', charityDeeds:'Sədəqə əməlləri', charityTotal:'Ümumi sədəqə', hifzMemorized:'Əzbər surələr', storageSize:'Yaddaş ölçüsü' },
  en: { title:'Statistics', sub:'User activity and app data', prayer:'Prayer', quran:'Quran', interaction:'Interaction', misc:'Misc', storage:'Storage', refresh:'Refresh',
    prayerDays:'Prayer days', totalPrayers:'Total prayers', quranSessions:'Quran sessions', quranSurahs:'Surahs read', hadithFavs:'Favorite hadiths', duaFavs:'Favorite duas', dhikrSessions:'Dhikr sessions', totalDhikr:'Total dhikr count', charityDeeds:'Charity deeds', charityTotal:'Total charity', hifzMemorized:'Memorized surahs', storageSize:'Storage size' },
  ru: { title:'Статистика', sub:'Активность пользователей и данные приложения', prayer:'Намаз', quran:'Коран', interaction:'Взаимодействие', misc:'Прочее', storage:'Хранилище', refresh:'Обновить',
    prayerDays:'Дни намаза', totalPrayers:'Всего намазов', quranSessions:'Сессий Корана', quranSurahs:'Прочитано сур', hadithFavs:'Избранные хадисы', duaFavs:'Избранные дуа', dhikrSessions:'Сессий зикра', totalDhikr:'Всего зикров', charityDeeds:'Добрые дела (садака)', charityTotal:'Всего садаки', hifzMemorized:'Выучено сур', storageSize:'Размер хранилища' },
  ar: { title:'الإحصائيات', sub:'النشاط والبيانات', prayer:'الصلاة', quran:'القرآن', interaction:'التفاعل', misc:'متفرقات', storage:'التخزين', refresh:'تحديث',
    prayerDays:'أيام الصلاة', totalPrayers:'إجمالي الصلوات', quranSessions:'جلسات القرآن', quranSurahs:'سور مقروءة', hadithFavs:'أحاديث مفضلة', duaFavs:'أدعية مفضلة', dhikrSessions:'جلسات الذكر', totalDhikr:'مجموع الذكر', charityDeeds:'صدقات', charityTotal:'الإجمالي', hifzMemorized:'سور محفوظة', storageSize:'حجم التخزين' },
  tr: { title:'İstatistikler', sub:'Kullanıcı etkinliği ve uygulama verileri', prayer:'Namaz', quran:'Kuran', interaction:'Etkileşim', misc:'Diğer', storage:'Depolama', refresh:'Yenile',
    prayerDays:'Namaz günleri', totalPrayers:'Toplam namaz', quranSessions:'Kuran oturumları', quranSurahs:'Okunan sureler', hadithFavs:'Favori hadisler', duaFavs:'Favori dualar', dhikrSessions:'Zikir oturumları', totalDhikr:'Toplam zikir', charityDeeds:'Sadakalar', charityTotal:'Toplam sadaka', hifzMemorized:'Ezberlenen sureler', storageSize:'Depolama boyutu' },
}

// Yaddaş vahidləri hər dildə öz qısaltması ilə
const BYTE_UNITS = {
  az: ['B', 'KB', 'MB'], en: ['B', 'KB', 'MB'], tr: ['B', 'KB', 'MB'],
  ru: ['Б', 'КБ', 'МБ'], ar: ['بايت', 'ك.ب', 'م.ب'],
}
function formatBytes(bytes, lang) {
  const [b, kb, mb] = BYTE_UNITS[lang] || BYTE_UNITS.en
  if (bytes < 1024) return bytes + ' ' + b
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' ' + kb
  return (bytes / (1024 * 1024)).toFixed(2) + ' ' + mb
}

export default function StatsManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [stats, setStats] = useState(getUserStats())

  useEffect(() => { setStats(getUserStats()) }, [])

  const refresh = () => setStats(getUserStats())

  const groups = [
    { title:l.prayer, icon:'prayer', items:[
      { label:l.prayerDays,    value:stats.prayerDays },
      { label:l.totalPrayers,  value:stats.totalPrayers },
    ]},
    { title:l.quran, icon:'quran', items:[
      { label:l.quranSessions, value:stats.quranSessions },
      { label:l.quranSurahs,   value:stats.quranSurahs },
      { label:l.hifzMemorized, value:stats.hifzMemorized },
    ]},
    { title:l.interaction, icon:'donate', items:[
      { label:l.hadithFavs,    value:stats.hadithFavorites },
      { label:l.duaFavs,       value:stats.duaFavorites },
      { label:l.dhikrSessions, value:stats.dhikrSessions },
      { label:l.totalDhikr,    value:stats.totalDhikr },
    ]},
    { title:l.misc, icon:'gift', items:[
      { label:l.charityDeeds, value:stats.charityDeeds },
      { label:l.charityTotal, value:stats.charityTotal },
    ]},
  ]

  return (
    <div>
      <AdminHeader icon="analytics" title={l.title} sub={l.sub}>
        <button type="button" onClick={refresh} className="ui-btn ui-btn--secondary ui-btn--sm">
          <Icon name="refresh" className="ui-btn__icon" /> {l.refresh}
        </button>
      </AdminHeader>

      {/* Yaddaş ölçüsü — tünd zümrüd zolaq */}
      <section className="admin-hero" data-reveal="scale" aria-label={l.storage}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div>
          <div className="admin-hero-label">{l.storage}</div>
          <div className="admin-hero-num">{formatBytes(stats.storageSize, lang)}</div>
          <div className="admin-hero-sub">{l.storageSize}</div>
        </div>
      </section>

      {/* Qruplar — rəqəm/etiket cədvəli (dl) */}
      {groups.map(group => (
        <div key={group.title} className="admin-section" data-reveal>
          <SectionTitle icon={group.icon}>{group.title}</SectionTitle>
          <dl className="admin-metrics">
            {group.items.map(item => (
              <div key={item.label} className="admin-metric">
                <dt>{item.label}</dt>
                <dd>{typeof item.value === 'number' ? String(item.value) : item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
