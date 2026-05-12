import { useState, useMemo, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { DUAS_DATA } from '../data/duas'
import { subscribeToDuas } from '../data/adminContent'
import SEO, { getPageMeta } from '../components/SEO'
import '../styles/DuasPage.css'

// ── Kateqoriya tərcümələri ──────────────────────────────
const CAT_LABELS = {
  All:        { az:'Hamısı',     en:'All',          ru:'Все',           ar:'الكل',         tr:'Hepsi'        },
  Morning:    { az:'Səhər',      en:'Morning',      ru:'Утро',          ar:'الصباح',       tr:'Sabah'        },
  Evening:    { az:'Axşam',      en:'Evening',      ru:'Вечер',         ar:'المساء',       tr:'Akşam'        },
  Eating:     { az:'Yemək',      en:'Eating',       ru:'Еда',           ar:'الطعام',       tr:'Yemek'        },
  Sleeping:   { az:'Yatmaq',     en:'Sleeping',     ru:'Сон',           ar:'النوم',        tr:'Uyku'         },
  'Waking Up':{ az:'Oyanmaq',    en:'Waking Up',    ru:'Пробуждение',   ar:'الاستيقاظ',   tr:'Uyanış'       },
  Forgiveness:{ az:'Bağışlanma', en:'Forgiveness',  ru:'Прощение',      ar:'المغفرة',      tr:'Bağışlanma'   },
  Anxiety:    { az:'Narahatlıq', en:'Anxiety',      ru:'Тревога',       ar:'القلق',        tr:'Endişe'       },
  Gratitude:  { az:'Şükür',      en:'Gratitude',    ru:'Благодарность', ar:'الشكر',        tr:'Şükür'        },
  Prayer:     { az:'Namaz',      en:'Prayer',       ru:'Молитва',       ar:'الصلاة',       tr:'Namaz'        },
  Travel:     { az:'Səfər',      en:'Travel',       ru:'Путешествие',   ar:'السفر',        tr:'Seyahat'      },
  Health:     { az:'Sağlamlıq',  en:'Health',       ru:'Здоровье',      ar:'الصحة',        tr:'Sağlık'       },
  Rizq:       { az:'Ruzi',       en:'Provision',    ru:'Пропитание',    ar:'الرزق',        tr:'Rızık'        },
  Guidance:   { az:'Hidayət',    en:'Guidance',     ru:'Руководство',   ar:'الهداية',      tr:'Hidayet'      },
  Family:     { az:'Ailə',       en:'Family',       ru:'Семья',         ar:'الأسرة',       tr:'Aile'         },
  Knowledge:  { az:'Elm',        en:'Knowledge',    ru:'Знание',        ar:'العلم',        tr:'İlim'         },
  Protection: { az:'Qorunma',    en:'Protection',   ru:'Защита',        ar:'الحماية',      tr:'Korunma'      },
  Repentance: { az:'Tövbə',      en:'Repentance',   ru:'Покаяние',      ar:'التوبة',       tr:'Tövbe'        },
  Hardship:   { az:'Çətinlik',   en:'Hardship',     ru:'Трудности',     ar:'الشدة',        tr:'Zorluk'       },
  Salawat:    { az:'Salavat',    en:'Salawat',      ru:'Салават',       ar:'الصلاة على النبي', tr:'Salavat' },
  Dhikr:      { az:'Zikr',       en:'Dhikr',        ru:'Зикр',          ar:'الذكر',        tr:'Zikir'        },
  Misc:       { az:'Digər',      en:'Other',        ru:'Другое',        ar:'متنوع',        tr:'Diğer'        },
}

const EN_CATS = Object.keys(CAT_LABELS)

const FAV_LABELS = { az:'Sevimlilər', en:'Favorites', ru:'Избранные', ar:'المفضلة', tr:'Favoriler' }


const lk = (lang) => ['az','ru','ar','tr'].includes(lang) ? lang : 'en'

export default function DuasPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.duas || T.az.duas
  const l = lk(lang)
  const [selectedCat, setSelectedCat] = useState('All')
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem('dua_favs')) || [] } catch { return [] } })
  const [showFavs, setShowFavs] = useState(false)
  const [customDuas, setCustomDuas] = useState([])

  useEffect(() => localStorage.setItem('dua_favs', JSON.stringify(favs)), [favs])

  // Firebase real-time custom duas
  useEffect(() => {
    const unsubscribe = subscribeToDuas((items) => setCustomDuas(items))
    return () => unsubscribe?.()
  }, [])

  const toggleFav = (id) => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id])

  const shareDua = async (dua) => {
    const text = `${dua.ar}\n\n${dua[lang] || dua.en}\n\n— ${dua.source}\n\nmuslims.cc`
    if (navigator.share) {
      try { await navigator.share({ text }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); alert(lang === 'az' ? 'Kopyalandı!' : 'Copied!') } catch {}
    }
  }

  // Firebase custom duaları normal formata çevirək
  const customForLang = useMemo(() => {
    const catMap = { morning:'Morning', evening:'Evening', general:'Misc', forgiveness:'Forgiveness', gratitude:'Gratitude', travel:'Travel', food:'Eating', sleep:'Sleeping' }
    return customDuas.map(d => ({
      id: d.id,
      ar: d.ar || '',
      translit: d.translit || '',
      en: d.text?.en || '',
      az: d.text?.az || '',
      ru: d.text?.ru || '',
      tr: d.text?.tr || '',
      source: d.source || '',
      cat: catMap[d.category] || 'Misc',
      _custom: true,
    }))
  }, [customDuas])

  const filtered = useMemo(() => {
    let data = [...customForLang, ...DUAS_DATA]
    if (showFavs) data = data.filter(d => favs.includes(d.id))
    if (selectedCat !== 'All' && !showFavs) data = data.filter(d => d.cat === selectedCat)
    return data
  }, [selectedCat, showFavs, favs, customForLang])

  return (
    <>
      <SEO title={getPageMeta('duas', lang)?.title} description={getPageMeta('duas', lang)?.description} page="/duas" />
      <div className="page-hero theme-duas">
        <div className="page-hero-arabic">الأَدْعِيَة وَالأَذْكَار</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">

          {/* Kateqoriya filterleri — tərcümə edilmiş */}
          <div className="tag-filters" style={{ marginBottom:28 }}>
            <button className={`tag-btn ${showFavs ? 'active' : ''}`}
              onClick={() => setShowFavs(f => !f)}>
              ❤️ {FAV_LABELS[lang] || FAV_LABELS.en}
            </button>
            {EN_CATS.map(c => (
              <button
                key={c}
                className={`tag-btn ${selectedCat === c && !showFavs ? 'active' : ''}`}
                onClick={() => { setSelectedCat(c); setShowFavs(false) }}
              >
                {CAT_LABELS[c][l]}
              </button>
            ))}
          </div>

          {/* Dualar — həmişə açıq */}
          <div className="duas-list">
            {filtered.map(dua => (
              <div key={dua.id} className="dua-card dua-card-open">
                {/* Üst sətir: badge + iconlar */}
                <div className="dua-card-top">
                  <div className="dua-cat-badge">
                    {CAT_LABELS[dua.cat]?.[l] || dua.cat}
                  </div>
                  <div className="dua-card-actions">
                    <button className="dua-share-btn" onClick={() => shareDua(dua)} title="Share">📤</button>
                    <button className={`dua-fav-btn ${favs.includes(dua.id) ? 'active' : ''}`} onClick={() => toggleFav(dua.id)}>
                      {favs.includes(dua.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
                {/* Ərəb mətni */}
                <div className="dua-arabic">{dua.ar}</div>
                {/* Transliterasiya */}
                <p className="dua-translit">🔤 {dua.translit}</p>
                {/* Tərcümə */}
                <p className="dua-meaning">💬 {dua[lang] || dua.en}</p>
                {/* Mənbə */}
                <div className="dua-source">📚 {t.sourceLabel}: {dua.source}</div>
              </div>
            ))}
          </div>

          <div className="duas-banner">
            <div className="duas-banner-arabic">ادْعُونِي أَسْتَجِبْ لَكُمْ</div>
            <p className="duas-banner-trans">
              {lang==='az'?'"Mənə dua edin, duanızı qəbul edim." — Ğafir 40:60':
               lang==='ru'?'«Взывайте ко Мне, и Я отвечу вам» — Гафир 40:60':
               lang==='ar'?'"ادعوني أستجب لكم" — غافر ٤٠:٦٠':
               lang==='tr'?'"Bana dua edin, size cevap vereyim." — Ğafir 40:60':
               '"Call upon Me; I will respond to you." — Ghafir 40:60'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}