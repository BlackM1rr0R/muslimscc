import { useState, useCallback, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/DhikrPage.css'

// ── localStorage helper-ləri ──
const STORAGE_KEY = 'dhikr_session'
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, selIdx: 0, log: [] }
    return JSON.parse(raw)
  } catch { return { count: 0, selIdx: 0, log: [] } }
}
function saveSession(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

const DHIKRS = [
  { az:'SubhanAllah',  en:'SubhanAllah',  ru:'СубханАллах',  ar:'سُبْحَانَ اللَّه',    tr:'Sübhanallah',  arabic:'سُبۡحَانَ ٱللَّهِ', target:33,  virtue:{ az:'Cənnətdə bir xurma ağacı əkilir', en:'A palm tree is planted in Paradise', ru:'Садится пальма в Рай', ar:'تُغرس له نخلة في الجنة', tr:'Cennette bir hurma ağacı dikilir' } },
  { az:'Alhamdulillah',en:'Alhamdulillah',ru:'Альхамдулиллях',ar:'الحَمْدُ لِلَّه',   tr:'Elhamdülillah',arabic:'ٱلۡحَمۡدُ لِلَّهِ',   target:33,  virtue:{ az:'Tərəzini doldurur', en:'Fills the scales', ru:'Наполняет весы', ar:'تملأ الميزان', tr:'Tartıları doldurur' } },
  { az:'Allahu Akbar', en:'Allahu Akbar', ru:'Аллаху Акбар',  ar:'اللَّهُ أَكْبَر',   tr:'Allahu Ekber', arabic:'ٱللَّهُ أَكۡبَرُ',    target:33,  virtue:{ az:'Göy ilə yer arasını doldurur', en:'Fills what is between heaven and earth', ru:'Заполняет пространство между небом и землёй', ar:'تملأ ما بين السماء والأرض', tr:'Gökyüzü ile yeryüzü arasını doldurur' } },
  { az:'La ilaha illallah', en:'La ilaha illallah', ru:'Ла иляха иллаллах', ar:'لَا إِلَهَ إِلَّا اللَّه', tr:'La ilahe illallah', arabic:'لَا إِلَٰهَ إِلَّا ٱللَّهُ', target:100, virtue:{ az:'Ən üstün zikrdir', en:'The best of all dhikr', ru:'Лучший из всех зикров', ar:'أفضل الذكر', tr:'En üstün zikirdir' } },
  { az:'Astaghfirullah', en:'Astaghfirullah', ru:'Астагфируллах', ar:'أَسْتَغْفِرُ اللَّه', tr:'Estağfirullah', arabic:'أَسۡتَغۡفِرُ ٱللَّهَ', target:100, virtue:{ az:'Günahları məhv edir', en:'Wipes out sins', ru:'Стирает грехи', ar:'يمحو الذنوب', tr:'Günahları siler' } },
  { az:'La həvlə vəla quvvətə illə billah', en:'La hawla wa la quwwata illa billah', ru:'Ла хауля ва ля куввата илля биллях', ar:'لاَ حَوْلَ وَلاَ قُوَّةَ إِلَّا بِاللَّه', tr:'La havle vela kuvvete illa billah', arabic:'لَا حَوۡلَ وَلَا قُوَّةَ إِلَّا بِٱللَّهِ', target:33, virtue:{ az:'Cənnət xəzinələrindən bir xəzinədir', en:'A treasure from the treasures of Paradise', ru:'Сокровище из сокровищ Рая', ar:'كنز من كنوز الجنة', tr:'Cennet hazinelerinden bir hazinedir' } },
  { az:'SubhanAllahi və bihamdihi', en:'SubhanAllahi wa bihamdihi', ru:'СубханАллахи ва бихамдихи', ar:'سُبْحَانَ اللَّهِ وَبِحَمْدِه', tr:'Sübhanallahi ve bihamdihi', arabic:'سُبۡحَانَ ٱللَّهِ وَبِحَمۡدِهِ', target:100, virtue:{ az:'Günahları dəniz köpüyü qədər olsa da silinir', en:'Sins forgiven even if like sea foam', ru:'Грехи прощаются, даже если их как морская пена', ar:'تحط خطاياه وإن كانت مثل زبد البحر', tr:'Deniz köpüğü kadar olsa da günahları silinir' } },
  { az:'SubhanAllahil-azim', en:'SubhanAllahil-Azeem', ru:'СубханАллахиль-Азым', ar:'سُبْحَانَ اللَّهِ الْعَظِيم', tr:'Sübhanallahil-azim', arabic:'سُبۡحَانَ ٱللَّهِ ٱلۡعَظِيمِ', target:33, virtue:{ az:'Ərşin altında xəzinə', en:'Treasure beneath the Throne', ru:'Сокровище под Троном', ar:'كنز تحت العرش', tr:'Arşın altında hazine' } },
  { az:'Salavat', en:'Salawat', ru:'Салават', ar:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّد', tr:'Salavat', arabic:'ٱللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', target:100, virtue:{ az:'Hər salavata 10 savab', en:'10 rewards for each salawat', ru:'10 наград за каждый салават', ar:'عشر حسنات بكل صلاة', tr:'Her salavata 10 sevap' } },
  { az:'Həsbunallahu və niməl vəkil', en:'Hasbunallahu wa ni\'mal wakeel', ru:'ХасбунАллаху ва ни\'маль вакиль', ar:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيل', tr:'Hasbünallahü ve ni\'mel vekil', arabic:'حَسۡبُنَا ٱللَّهُ وَنِعۡمَ ٱلۡوَكِيلُ', target:33, virtue:{ az:'İbrahimin atəşə atılarkən dediyi söz', en:'What Ibrahim said when thrown into the fire', ru:'Слова Ибрахима, когда его бросили в огонь', ar:'قالها إبراهيم حين ألقي في النار', tr:'İbrahim ateşe atıldığında söylediği söz' } },
]

export default function DhikrPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.dhikr || T.az.dhikr
  const saved = loadSession()
  const [selIdx, setSelIdx] = useState(saved.selIdx)
  const [count,  setCount]  = useState(saved.count)
  const [tap,    setTap]    = useState(false)
  const [log,    setLog]    = useState(saved.log)
  const totalAll = log.reduce((s, e) => s + (e.count || 0), 0) + count

  // Hər dəyişiklikdə localStorage-ə yaz
  useEffect(() => {
    saveSession({ count, selIdx, log })
  }, [count, selIdx, log])
  const dhikr = DHIKRS[selIdx]
  const progress = Math.min((count / dhikr.target) * 100, 100)
  const complete = count >= dhikr.target
  const CIRC = 2 * Math.PI * 70

  const handleTap = useCallback(() => {
    setCount(c => {
      const next = c + 1
      if (next >= dhikr.target) {
        setLog(l => [{ name: dhikr[lang] || dhikr.en, count: dhikr.target, time: new Date().toLocaleTimeString() }, ...l.slice(0,9)])
        // Hədəf tamamlandıqda uzun vibrasiə
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      }
      return next
    })
    // Vibrə et (mobil)
    if (navigator.vibrate) navigator.vibrate(30)
    setTap(true)
    setTimeout(() => setTap(false), 120)
  }, [dhikr, lang])

  return (
    <>
      <div className="page-hero theme-dhikr">
        <div className="page-hero-arabic">ٱلذِّكۡرُ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner dhikr-layout">

          {/* Selector */}
          <div className="dhikr-selector">
            {DHIKRS.map((d,i) => (
              <button key={i} className={`dhikr-sel-btn ${selIdx===i?'active':''}`}
                onClick={() => { setSelIdx(i); setCount(0) }}>
                <span className="dhikr-sel-arabic">{d.arabic}</span>
                <span className="dhikr-sel-label">{d[lang] || d.en}</span>
              </button>
            ))}
          </div>

          {/* Counter */}
          <div className="dhikr-center">
            <div className="dhikr-progress-ring">
              <svg viewBox="0 0 160 160" width="200" height="200">
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--primary-bg2)" strokeWidth="8"/>
                <circle cx="80" cy="80" r="70" fill="none"
                  stroke={complete ? 'var(--gold)' : 'var(--primary)'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress/100)}
                  transform="rotate(-90 80 80)"
                  style={{ transition:'stroke-dashoffset .3s ease, stroke .3s' }}
                />
              </svg>
              <button
                className={`dhikr-tap-btn ${tap?'tapped':''} ${complete?'complete':''}`}
                onClick={handleTap}
              >
                <span className="dhikr-tap-arabic">{dhikr.arabic}</span>
                <span className="dhikr-tap-count">{count}</span>
                <span className="dhikr-tap-target">/ {dhikr.target}</span>
              </button>
            </div>

            <div className="dhikr-info">
              <h2 className="dhikr-name">{dhikr[lang] || dhikr.en}</h2>
              <p className="dhikr-virtue">✨ {dhikr.virtue[lang] || dhikr.virtue.en}</p>
              {complete && (
                <div className="dhikr-complete-badge anim-scaleIn">
                  🎉 {t.complete}
                </div>
              )}
            </div>

            <div className="dhikr-actions">
              <button className="btn-ghost" onClick={() => setCount(0)}>🔄 {t.reset}</button>
              <span className="dhikr-progress-text">{Math.round(progress)}%</span>
            </div>

            <div className="dhikr-total-bar">
              <div className="dhikr-total-item">
                <span className="dhikr-total-num">{count}</span>
                <span className="dhikr-total-label">{lang==='az'?'Hazırki':lang==='ru'?'Текущий':lang==='ar'?'الحالي':lang==='tr'?'Mevcut':'Current'}</span>
              </div>
              <div className="dhikr-total-sep"/>
              <div className="dhikr-total-item">
                <span className="dhikr-total-num">{log.length}</span>
                <span className="dhikr-total-label">{lang==='az'?'Sessiya':lang==='ru'?'Сессий':lang==='ar'?'جلسات':lang==='tr'?'Oturum':'Sessions'}</span>
              </div>
              <div className="dhikr-total-sep"/>
              <div className="dhikr-total-item">
                <span className="dhikr-total-num">{totalAll}</span>
                <span className="dhikr-total-label">{lang==='az'?'Ümumi':lang==='ru'?'Всего':lang==='ar'?'الإجمالي':lang==='tr'?'Toplam':'Total'}</span>
              </div>
            </div>
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="dhikr-log">
              <div className="dhikr-log-header">
                <span>{t.session}</span>
                <button className="btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={() => setLog([])}>
                  {t.clearSession}
                </button>
              </div>
              {log.map((entry,i) => (
                <div key={i} className="log-entry">
                  <span className="log-name">{entry.name}</span>
                  <span className="log-count">×{entry.count}</span>
                  <span className="log-time">{entry.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
