import { useEffect, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { getUserStats } from '../../data/adminContent'

const LABELS = {
  az: { title:'Statistika', sub:'İstifadəçi fəaliyyəti və app məlumatları', prayer:'Namaz', quran:'Quran', interaction:'Qarşılıqlı əlaqə', misc:'Digər', storage:'Yaddaş', refresh:'Yenilə',
    prayerDays:'Namaz qılınan günlər', totalPrayers:'Ümumi namaz', quranSessions:'Quran oxuma sessiyaları', quranSurahs:'Oxunan surələr', hadithFavs:'Favorit hədislər', duaFavs:'Favorit dualar', dhikrSessions:'Zikr sessiyaları', totalDhikr:'Ümumi zikr sayı', charityDeeds:'Sədəqə əməlləri', charityTotal:'Ümumi sədəqə', hifzMemorized:'Əzbər surələr', storageSize:'Yaddaş ölçüsü' },
  en: { title:'Statistics', sub:'User activity and app data', prayer:'Prayer', quran:'Quran', interaction:'Interaction', misc:'Misc', storage:'Storage', refresh:'Refresh',
    prayerDays:'Prayer days', totalPrayers:'Total prayers', quranSessions:'Quran sessions', quranSurahs:'Surahs read', hadithFavs:'Favorite hadiths', duaFavs:'Favorite duas', dhikrSessions:'Dhikr sessions', totalDhikr:'Total dhikr count', charityDeeds:'Charity deeds', charityTotal:'Total charity', hifzMemorized:'Memorized surahs', storageSize:'Storage size' },
  ru: { title:'Статистика', sub:'Активность и данные', prayer:'Намаз', quran:'Коран', interaction:'Взаимодействие', misc:'Прочее', storage:'Хранилище', refresh:'Обновить',
    prayerDays:'Дни намаза', totalPrayers:'Всего намазов', quranSessions:'Сессий Корана', quranSurahs:'Прочитано сур', hadithFavs:'Избранные хадисы', duaFavs:'Избранные дуа', dhikrSessions:'Сессий зикра', totalDhikr:'Всего зикров', charityDeeds:'Милостыни', charityTotal:'Сумма', hifzMemorized:'Выучено сур', storageSize:'Размер хранилища' },
  ar: { title:'الإحصائيات', sub:'النشاط والبيانات', prayer:'الصلاة', quran:'القرآن', interaction:'التفاعل', misc:'متفرقات', storage:'التخزين', refresh:'تحديث',
    prayerDays:'أيام الصلاة', totalPrayers:'إجمالي الصلوات', quranSessions:'جلسات القرآن', quranSurahs:'سور مقروءة', hadithFavs:'أحاديث مفضلة', duaFavs:'أدعية مفضلة', dhikrSessions:'جلسات الذكر', totalDhikr:'مجموع الذكر', charityDeeds:'صدقات', charityTotal:'الإجمالي', hifzMemorized:'سور محفوظة', storageSize:'حجم التخزين' },
  tr: { title:'İstatistikler', sub:'Kullanıcı aktivitesi', prayer:'Namaz', quran:'Kuran', interaction:'Etkileşim', misc:'Diğer', storage:'Depolama', refresh:'Yenile',
    prayerDays:'Namaz günleri', totalPrayers:'Toplam namaz', quranSessions:'Kuran oturumları', quranSurahs:'Okunan sureler', hadithFavs:'Favori hadisler', duaFavs:'Favori dualar', dhikrSessions:'Zikir oturumları', totalDhikr:'Toplam zikir', charityDeeds:'Sadakalar', charityTotal:'Toplam sadaka', hifzMemorized:'Ezberlenmiş', storageSize:'Depolama boyutu' },
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default function StatsManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [stats, setStats] = useState(getUserStats())

  useEffect(() => { setStats(getUserStats()) }, [])

  const refresh = () => setStats(getUserStats())

  const groups = [
    { title:l.prayer, color:'#3b82f6', icon:'🕌', items:[
      { label:l.prayerDays,    value:stats.prayerDays },
      { label:l.totalPrayers,  value:stats.totalPrayers },
    ]},
    { title:l.quran, color:'#10b981', icon:'📖', items:[
      { label:l.quranSessions, value:stats.quranSessions },
      { label:l.quranSurahs,   value:stats.quranSurahs },
      { label:l.hifzMemorized, value:stats.hifzMemorized },
    ]},
    { title:l.interaction, color:'#8b5cf6', icon:'💖', items:[
      { label:l.hadithFavs,    value:stats.hadithFavorites },
      { label:l.duaFavs,       value:stats.duaFavorites },
      { label:l.dhikrSessions, value:stats.dhikrSessions },
      { label:l.totalDhikr,    value:stats.totalDhikr },
    ]},
    { title:l.misc, color:'#f59e0b', icon:'🎁', items:[
      { label:l.charityDeeds, value:stats.charityDeeds },
      { label:l.charityTotal, value:stats.charityTotal },
    ]},
  ]

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#a855f7,#9333ea)'}}>📊</div>
          <div className="admin-header-info"><h1>{l.title}</h1><p>{l.sub}</p></div>
        </div>
        <button onClick={refresh} className="admin-logout-btn">
          <span>🔄</span> {l.refresh}
        </button>
      </div>

      {/* Storage size card */}
      <div className="admin-section" style={{
        background:'linear-gradient(135deg, #a855f7, #7c3aed)',
        color:'#fff',
        position:'relative',
        overflow:'hidden',
      }}>
        <div style={{position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.1)', top:-60, right:-40}} />
        <div style={{position:'relative'}}>
          <div style={{fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', opacity:0.9, marginBottom:6}}>
            💾 {l.storage}
          </div>
          <div style={{fontSize:36, fontWeight:800, letterSpacing:-1}}>{formatBytes(stats.storageSize)}</div>
          <div style={{fontSize:13, opacity:0.85, marginTop:4}}>{l.storageSize}</div>
        </div>
      </div>

      {/* Stats groups */}
      {groups.map(group => (
        <div key={group.title} className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-title-icon" style={{background:group.color+'18'}}>{group.icon}</span>
            <span style={{color:group.color}}>{group.title}</span>
          </h2>

          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12}}>
            {group.items.map(item => (
              <div key={item.label} style={{
                background:'var(--bg-card2)',
                border:`1.5px solid ${group.color}25`,
                borderRadius:'var(--radius)',
                padding:18,
                borderLeft:`4px solid ${group.color}`,
              }}>
                <div style={{fontSize:28, fontWeight:800, color:group.color, letterSpacing:-1}}>
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </div>
                <div style={{fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginTop:4}}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
