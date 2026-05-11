import { useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { HADITHS } from '../../data/hadiths'
import { DUAS_DATA } from '../../data/duas'
import { QUOTES as STATIC_QUOTES } from '../../data/quotes'
import { addCustomHadith, addCustomDua, addCustomQuote } from '../../data/adminContent'

const LABELS = {
  az: { title:'Default Məzmunu Firebase-ə Yüklə', sub:'Quraşdırılmış hədis, dua və sitatları Firebase-ə yükləyin ki, admin redaktə edə bilsin', warning:'Diqqət', warningText:'Bu əməliyyat hər icra olunduqda yenidən yükləyir. Yalnız bir dəfə icra edin!', seedHadiths:'Hədisləri yüklə', seedDuas:'Duaları yüklə', seedQuotes:'Sitatları yüklə', seedAll:'Hamısını yüklə', uploading:'Yüklənir...', uploaded:'Yükləndi!', count:'ədəd', hadiths:'Hədis', duas:'Dua', quotes:'Sitat', info:'Default məzmun statik fayllarda saxlanılır. Bunları Firebase-ə yükləsəniz, admin paneldən redaktə edə bilərsiniz.' },
  en: { title:'Seed Default Data to Firebase', sub:'Upload built-in hadiths, duas and quotes to Firebase so admin can edit', warning:'Warning', warningText:'This will re-upload every time. Run only once!', seedHadiths:'Seed Hadiths', seedDuas:'Seed Duas', seedQuotes:'Seed Quotes', seedAll:'Seed All', uploading:'Uploading...', uploaded:'Uploaded!', count:'items', hadiths:'Hadiths', duas:'Duas', quotes:'Quotes', info:'Default content is in static files. Upload to Firebase to edit from admin panel.' },
  ru: { title:'Загрузить контент в Firebase', sub:'Загрузить хадисы, дуа и цитаты в Firebase для редактирования', warning:'Внимание', warningText:'Каждый запуск перезагружает. Запустите только один раз!', seedHadiths:'Хадисы', seedDuas:'Дуа', seedQuotes:'Цитаты', seedAll:'Всё', uploading:'Загрузка...', uploaded:'Загружено!', count:'шт', hadiths:'Хадисы', duas:'Дуа', quotes:'Цитаты', info:'Контент по умолчанию в файлах. Загрузите в Firebase для редактирования.' },
  ar: { title:'تحميل المحتوى الافتراضي', sub:'تحميل الأحاديث والأدعية والاقتباسات إلى Firebase', warning:'تحذير', warningText:'هذا يعيد التحميل كل مرة!', seedHadiths:'الأحاديث', seedDuas:'الأدعية', seedQuotes:'الاقتباسات', seedAll:'الكل', uploading:'جارٍ التحميل...', uploaded:'تم!', count:'عنصر', hadiths:'حديث', duas:'دعاء', quotes:'اقتباس', info:'تحميل المحتوى الافتراضي إلى Firebase' },
  tr: { title:'Varsayılan İçeriği Yükle', sub:'Hadis, dua ve alıntıları Firebase\'e yükleyin', warning:'Uyarı', warningText:'Her seferinde yeniden yükler. Bir kez çalıştırın!', seedHadiths:'Hadisleri Yükle', seedDuas:'Duaları Yükle', seedQuotes:'Alıntıları Yükle', seedAll:'Tümünü Yükle', uploading:'Yükleniyor...', uploaded:'Yüklendi!', count:'adet', hadiths:'Hadis', duas:'Dua', quotes:'Alıntı', info:'Varsayılan içerik statik dosyalarda. Firebase\'e yükleyin.' },
}

const CAT_MAP_HADITH = { faith:'faith', character:'character', worship:'worship', prayer:'worship', quran:'knowledge', knowledge:'knowledge', fasting:'worship', zakat:'charity', dhikr:'worship', charity:'charity', patience:'patience', world:'general', afterlife:'faith', salawat:'worship', travel:'general', family:'family' }
const CAT_MAP_DUA = { Morning:'morning', Evening:'evening', Eating:'food', Sleeping:'sleep', 'Waking Up':'morning', Forgiveness:'forgiveness', Anxiety:'general', Gratitude:'gratitude', Prayer:'general', Travel:'travel', Health:'general', Rizq:'general', Guidance:'general', Family:'general', Knowledge:'general', Protection:'general', Repentance:'forgiveness', Hardship:'general', Salawat:'general', Dhikr:'general', Misc:'general' }

export default function SeedManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [uploading, setUploading] = useState(null)
  const [results, setResults] = useState({})

  const seedHadiths = async () => {
    setUploading('hadiths')
    const allHadiths = HADITHS.en || []
    let count = 0
    for (const h of allHadiths.slice(0, 50)) {
      try {
        await addCustomHadith({
          ar: h.ar || '',
          text: {
            az: HADITHS.az?.find(x => x.id === h.id)?.text || '',
            en: h.text || '',
            ru: HADITHS.ru?.find(x => x.id === h.id)?.text || '',
            ar: h.ar || '',
            tr: HADITHS.tr?.find(x => x.id === h.id)?.text || '',
          },
          source: h.source || '',
          category: CAT_MAP_HADITH[h.cat?.toLowerCase()] || 'general',
        })
        count++
      } catch (e) {
        console.error('Hadith seed error:', e)
      }
    }
    setResults(prev => ({ ...prev, hadiths: count }))
    setUploading(null)
  }

  const seedDuas = async () => {
    setUploading('duas')
    let count = 0
    for (const d of DUAS_DATA.slice(0, 50)) {
      try {
        await addCustomDua({
          ar: d.ar || '',
          translit: d.translit || '',
          text: {
            az: d.az || '',
            en: d.en || '',
            ru: d.ru || '',
            ar: d.ar || '',
            tr: d.tr || '',
          },
          source: d.source || '',
          category: CAT_MAP_DUA[d.cat] || 'general',
        })
        count++
      } catch (e) {
        console.error('Dua seed error:', e)
      }
    }
    setResults(prev => ({ ...prev, duas: count }))
    setUploading(null)
  }

  const seedQuotes = async () => {
    setUploading('quotes')
    let count = 0
    for (const q of STATIC_QUOTES.slice(0, 50)) {
      try {
        await addCustomQuote({
          ar: q.ar || '',
          text: q.text || { en:'', az:'', ru:'', ar:'', tr:'' },
          source: q.source || '',
          category: q.cat || 'wisdom',
        })
        count++
      } catch (e) {
        console.error('Quote seed error:', e)
      }
    }
    setResults(prev => ({ ...prev, quotes: count }))
    setUploading(null)
  }

  const seedAll = async () => {
    await seedHadiths()
    await seedDuas()
    await seedQuotes()
  }

  const Card = ({ icon, title, count, total, color, onClick, disabled, type }) => (
    <div style={{
      background: 'var(--bg-card2)',
      border: `2px solid ${color}30`,
      borderRadius: 'var(--radius-lg)',
      padding: 22,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
        {results[type] !== undefined
          ? `✅ ${results[type]}/${total} ${l.count}`
          : `${total} ${l.count}`}
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '100%',
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          color: '#fff',
          border: 'none',
          padding: '10px 16px',
          borderRadius: 'var(--radius)',
          fontWeight: 800,
          fontSize: 13,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {uploading === type ? '⏳ ' + l.uploading : '⬆️ ' + (type === 'hadiths' ? l.seedHadiths : type === 'duas' ? l.seedDuas : l.seedQuotes)}
      </button>
    </div>
  )

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#a855f7,#7c3aed)'}}>🌱</div>
          <div className="admin-header-info">
            <h1>{l.title}</h1>
            <p>{l.sub}</p>
          </div>
        </div>
      </div>

      <div className="admin-section" style={{
        background: 'linear-gradient(135deg, #f59e0b15, #f59e0b08)',
        border: '1.5px solid #f59e0b40',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <div>
            <h3 style={{ margin: '0 0 6px', color: '#d97706', fontSize: 16 }}>{l.warning}</h3>
            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6 }}>{l.warningText}</p>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <p style={{ color: 'var(--text-dim)', marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>
          ℹ️ {l.info}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Card
            icon="📚"
            title={l.hadiths}
            total={Math.min(50, (HADITHS.en || []).length)}
            color="#f59e0b"
            onClick={seedHadiths}
            disabled={!!uploading}
            type="hadiths"
          />
          <Card
            icon="🤲"
            title={l.duas}
            total={Math.min(50, DUAS_DATA.length)}
            color="#8b5cf6"
            onClick={seedDuas}
            disabled={!!uploading}
            type="duas"
          />
          <Card
            icon="💬"
            title={l.quotes}
            total={Math.min(50, STATIC_QUOTES.length)}
            color="#ec4899"
            onClick={seedQuotes}
            disabled={!!uploading}
            type="quotes"
          />
        </div>

        <button
          onClick={seedAll}
          disabled={!!uploading}
          className="admin-submit-btn"
          style={{
            width: '100%',
            marginTop: 20,
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            opacity: uploading ? 0.5 : 1,
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          🌱 {uploading ? l.uploading : l.seedAll}
        </button>
      </div>
    </div>
  )
}
