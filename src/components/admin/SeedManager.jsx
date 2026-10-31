import { useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, AdminAlert } from './AdminUi'
import Icon from '../Icon'
import { HADITHS } from '../../data/hadiths'
import { DUAS_DATA } from '../../data/duas'
import { QUOTES as STATIC_QUOTES } from '../../data/quotes'
import { addCustomHadith, addCustomDua, addCustomQuote } from '../../data/adminContent'

const LABELS = {
  az: { title:'İlkin məzmunu serverə yüklə', sub:'Quraşdırılmış hədis, dua və sitatları serverə yükləyin ki, admin redaktə edə bilsin', warning:'Diqqət', warningText:'Bu əməliyyat hər icra olunduqda yenidən yükləyir. Yalnız bir dəfə icra edin!', seedHadiths:'Hədisləri yüklə', seedDuas:'Duaları yüklə', seedQuotes:'Sitatları yüklə', seedAll:'Hamısını yüklə', uploading:'Yüklənir...', uploaded:'Yükləndi!', count:'ədəd', hadiths:'Hədis', duas:'Dua', quotes:'Sitat', info:'İlkin məzmun statik fayllarda saxlanılır. Bunları serverə yükləsəniz, admin paneldən redaktə edə bilərsiniz.' },
  en: { title:'Upload default content to the server', sub:'Upload built-in hadiths, duas and quotes to the server so admin can edit', warning:'Warning', warningText:'This will re-upload every time. Run only once!', seedHadiths:'Upload hadiths', seedDuas:'Upload duas', seedQuotes:'Upload quotes', seedAll:'Upload all', uploading:'Uploading...', uploaded:'Uploaded!', count:'items', hadiths:'Hadiths', duas:'Duas', quotes:'Quotes', info:'Default content is in static files. Upload them to the server to edit from the admin panel.' },
  ru: { title:'Загрузить контент на сервер', sub:'Загрузить хадисы, дуа и цитаты на сервер для редактирования', warning:'Внимание', warningText:'Каждый запуск перезагружает. Запустите только один раз!', seedHadiths:'Загрузить хадисы', seedDuas:'Загрузить дуа', seedQuotes:'Загрузить цитаты', seedAll:'Загрузить всё', uploading:'Загрузка...', uploaded:'Загружено!', count:'шт', hadiths:'Хадисы', duas:'Дуа', quotes:'Цитаты', info:'Контент по умолчанию в файлах. Загрузите на сервер для редактирования.' },
  ar: { title:'تحميل المحتوى الافتراضي', sub:'تحميل الأحاديث والأدعية والاقتباسات إلى الخادم', warning:'تحذير', warningText:'هذا يعيد التحميل كل مرة!', seedHadiths:'تحميل الأحاديث', seedDuas:'تحميل الأدعية', seedQuotes:'تحميل الاقتباسات', seedAll:'تحميل الكل', uploading:'جارٍ التحميل...', uploaded:'تم!', count:'عنصر', hadiths:'حديث', duas:'دعاء', quotes:'اقتباس', info:'تحميل المحتوى الافتراضي إلى الخادم' },
  tr: { title:'Varsayılan İçeriği Yükle', sub:'Hadis, dua ve alıntıları sunucuya yükleyin', warning:'Uyarı', warningText:'Her seferinde yeniden yükler. Bir kez çalıştırın!', seedHadiths:'Hadisleri Yükle', seedDuas:'Duaları Yükle', seedQuotes:'Alıntıları Yükle', seedAll:'Tümünü Yükle', uploading:'Yükleniyor...', uploaded:'Yüklendi!', count:'adet', hadiths:'Hadis', duas:'Dua', quotes:'Alıntı', info:'Varsayılan içerik statik dosyalarda. Sunucuya yükleyin.' },
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

  const Card = ({ icon, title, total, onClick, disabled, type }) => (
    <div className="admin-seed-card">
      <span className="ui-icon-tile ui-icon-tile--lg" aria-hidden="true"><Icon name={icon} /></span>
      <div className="admin-seed-title">{title}</div>
      <div className={`admin-seed-count${results[type] !== undefined ? ' is-done' : ''}`}>
        {results[type] !== undefined
          ? <><Icon name="check" size={14} /> {results[type]}/{total} {l.count}</>
          : `${total} ${l.count}`}
      </div>
      <button type="button" className="admin-submit-btn" onClick={onClick} disabled={disabled}>
        <Icon name={uploading === type ? 'refresh' : 'arrowUp'} /> {uploading === type ? l.uploading : (type === 'hadiths' ? l.seedHadiths : type === 'duas' ? l.seedDuas : l.seedQuotes)}
      </button>
    </div>
  )

  return (
    <div>
      <AdminHeader icon="leaf" title={l.title} sub={l.sub} />

      <AdminAlert tone="warn" className="admin-seed-warn"><b>{l.warning}</b>{l.warningText}</AdminAlert>

      <div className="admin-section" data-reveal>
        <AdminAlert tone="note" className="admin-seed-info">{l.info}</AdminAlert>

        <div className="admin-seed-grid" data-reveal="stagger">
          <Card icon="hadith" title={l.hadiths} total={Math.min(50, (HADITHS.en || []).length)} onClick={seedHadiths} disabled={!!uploading} type="hadiths" />
          <Card icon="duas" title={l.duas} total={Math.min(50, DUAS_DATA.length)} onClick={seedDuas} disabled={!!uploading} type="duas" />
          <Card icon="quotes" title={l.quotes} total={Math.min(50, STATIC_QUOTES.length)} onClick={seedQuotes} disabled={!!uploading} type="quotes" />
        </div>

        <div className="admin-form-actions admin-seed-all">
          <button type="button" onClick={seedAll} disabled={!!uploading} className="admin-submit-btn">
            <Icon name="leaf" /> {uploading ? l.uploading : l.seedAll}
          </button>
        </div>
      </div>
    </div>
  )
}
