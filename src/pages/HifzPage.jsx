import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/HifzPage.css'

// ── localStorage helpers ──
const STORAGE_KEY = 'hifz_progress'
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch { return {} }
}
function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

const LABELS = {
  az: { title:'Hifz Tracker', subtitle:'Quran əzbərləmə izləyicisi', all:'Hamısı', memorized:'Əzbərləmişəm', inProgress:'Davam edir', notStarted:'Başlanmayıb', surahCount:'surə', ayahCount:'ayə', progress:'İrəliləyiş', juz:'Cüz', total:'Ümumi', reset:'Sıfırla', confirmReset:'Əminsiniz?' },
  en: { title:'Hifz Tracker', subtitle:'Quran memorization tracker', all:'All', memorized:'Memorized', inProgress:'In Progress', notStarted:'Not Started', surahCount:'surahs', ayahCount:'ayahs', progress:'Progress', juz:'Juz', total:'Total', reset:'Reset', confirmReset:'Are you sure?' },
  ru: { title:'Хифз Трекер', subtitle:'Отслеживание заучивания Корана', all:'Все', memorized:'Выучено', inProgress:'В процессе', notStarted:'Не начато', surahCount:'сур', ayahCount:'аятов', progress:'Прогресс', juz:'Джуз', total:'Всего', reset:'Сброс', confirmReset:'Вы уверены?' },
  ar: { title:'متابعة الحفظ', subtitle:'متابعة حفظ القرآن الكريم', all:'الكل', memorized:'محفوظ', inProgress:'قيد الحفظ', notStarted:'لم يبدأ', surahCount:'سورة', ayahCount:'آية', progress:'التقدم', juz:'جزء', total:'الإجمالي', reset:'إعادة', confirmReset:'هل أنت متأكد؟' },
  tr: { title:'Hıfz Takip', subtitle:'Kuran ezberleme takipçisi', all:'Tümü', memorized:'Ezberledim', inProgress:'Devam ediyor', notStarted:'Başlanmadı', surahCount:'sure', ayahCount:'ayet', progress:'İlerleme', juz:'Cüz', total:'Toplam', reset:'Sıfırla', confirmReset:'Emin misiniz?' },
}

// status: 0 = not started, 1 = in progress, 2 = memorized
const STATUS_LABELS = {
  az: ['Başlanmayıb','Davam edir','Əzbərləmişəm'],
  en: ['Not Started','In Progress','Memorized'],
  ru: ['Не начато','В процессе','Выучено'],
  ar: ['لم يبدأ','قيد الحفظ','محفوظ'],
  tr: ['Başlanmadı','Devam ediyor','Ezberledim'],
}

const SURAHS = [
  { num:1, name:'الفاتحة', en:'Al-Fatiha', ayahs:7, juz:1 },
  { num:2, name:'البقرة', en:'Al-Baqarah', ayahs:286, juz:1 },
  { num:3, name:'آل عمران', en:'Aal-E-Imran', ayahs:200, juz:3 },
  { num:4, name:'النساء', en:'An-Nisa', ayahs:176, juz:4 },
  { num:5, name:'المائدة', en:'Al-Ma\'idah', ayahs:120, juz:6 },
  { num:6, name:'الأنعام', en:'Al-An\'am', ayahs:165, juz:7 },
  { num:7, name:'الأعراف', en:'Al-A\'raf', ayahs:206, juz:8 },
  { num:8, name:'الأنفال', en:'Al-Anfal', ayahs:75, juz:9 },
  { num:9, name:'التوبة', en:'At-Tawbah', ayahs:129, juz:10 },
  { num:10, name:'يونس', en:'Yunus', ayahs:109, juz:11 },
  { num:11, name:'هود', en:'Hud', ayahs:123, juz:11 },
  { num:12, name:'يوسف', en:'Yusuf', ayahs:111, juz:12 },
  { num:13, name:'الرعد', en:'Ar-Ra\'d', ayahs:43, juz:13 },
  { num:14, name:'إبراهيم', en:'Ibrahim', ayahs:52, juz:13 },
  { num:15, name:'الحجر', en:'Al-Hijr', ayahs:99, juz:14 },
  { num:16, name:'النحل', en:'An-Nahl', ayahs:128, juz:14 },
  { num:17, name:'الإسراء', en:'Al-Isra', ayahs:111, juz:15 },
  { num:18, name:'الكهف', en:'Al-Kahf', ayahs:110, juz:15 },
  { num:19, name:'مريم', en:'Maryam', ayahs:98, juz:16 },
  { num:20, name:'طه', en:'Ta-Ha', ayahs:135, juz:16 },
  { num:21, name:'الأنبياء', en:'Al-Anbiya', ayahs:112, juz:17 },
  { num:22, name:'الحج', en:'Al-Hajj', ayahs:78, juz:17 },
  { num:23, name:'المؤمنون', en:'Al-Mu\'minun', ayahs:118, juz:18 },
  { num:24, name:'النور', en:'An-Nur', ayahs:64, juz:18 },
  { num:25, name:'الفرقان', en:'Al-Furqan', ayahs:77, juz:18 },
  { num:26, name:'الشعراء', en:'Ash-Shu\'ara', ayahs:227, juz:19 },
  { num:27, name:'النمل', en:'An-Naml', ayahs:93, juz:19 },
  { num:28, name:'القصص', en:'Al-Qasas', ayahs:88, juz:20 },
  { num:29, name:'العنكبوت', en:'Al-Ankabut', ayahs:69, juz:20 },
  { num:30, name:'الروم', en:'Ar-Rum', ayahs:60, juz:21 },
  { num:31, name:'لقمان', en:'Luqman', ayahs:34, juz:21 },
  { num:32, name:'السجدة', en:'As-Sajdah', ayahs:30, juz:21 },
  { num:33, name:'الأحزاب', en:'Al-Ahzab', ayahs:73, juz:21 },
  { num:34, name:'سبأ', en:'Saba', ayahs:54, juz:22 },
  { num:35, name:'فاطر', en:'Fatir', ayahs:45, juz:22 },
  { num:36, name:'يس', en:'Ya-Sin', ayahs:83, juz:22 },
  { num:37, name:'الصافات', en:'As-Saffat', ayahs:182, juz:23 },
  { num:38, name:'ص', en:'Sad', ayahs:88, juz:23 },
  { num:39, name:'الزمر', en:'Az-Zumar', ayahs:75, juz:23 },
  { num:40, name:'غافر', en:'Ghafir', ayahs:85, juz:24 },
  { num:41, name:'فصلت', en:'Fussilat', ayahs:54, juz:24 },
  { num:42, name:'الشورى', en:'Ash-Shura', ayahs:53, juz:25 },
  { num:43, name:'الزخرف', en:'Az-Zukhruf', ayahs:89, juz:25 },
  { num:44, name:'الدخان', en:'Ad-Dukhan', ayahs:59, juz:25 },
  { num:45, name:'الجاثية', en:'Al-Jathiyah', ayahs:37, juz:25 },
  { num:46, name:'الأحقاف', en:'Al-Ahqaf', ayahs:35, juz:26 },
  { num:47, name:'محمد', en:'Muhammad', ayahs:38, juz:26 },
  { num:48, name:'الفتح', en:'Al-Fath', ayahs:29, juz:26 },
  { num:49, name:'الحجرات', en:'Al-Hujurat', ayahs:18, juz:26 },
  { num:50, name:'ق', en:'Qaf', ayahs:45, juz:26 },
  { num:51, name:'الذاريات', en:'Adh-Dhariyat', ayahs:60, juz:26 },
  { num:52, name:'الطور', en:'At-Tur', ayahs:49, juz:27 },
  { num:53, name:'النجم', en:'An-Najm', ayahs:62, juz:27 },
  { num:54, name:'القمر', en:'Al-Qamar', ayahs:55, juz:27 },
  { num:55, name:'الرحمن', en:'Ar-Rahman', ayahs:78, juz:27 },
  { num:56, name:'الواقعة', en:'Al-Waqi\'ah', ayahs:96, juz:27 },
  { num:57, name:'الحديد', en:'Al-Hadid', ayahs:29, juz:27 },
  { num:58, name:'المجادلة', en:'Al-Mujadilah', ayahs:22, juz:28 },
  { num:59, name:'الحشر', en:'Al-Hashr', ayahs:24, juz:28 },
  { num:60, name:'الممتحنة', en:'Al-Mumtahanah', ayahs:13, juz:28 },
  { num:61, name:'الصف', en:'As-Saff', ayahs:14, juz:28 },
  { num:62, name:'الجمعة', en:'Al-Jumu\'ah', ayahs:11, juz:28 },
  { num:63, name:'المنافقون', en:'Al-Munafiqun', ayahs:11, juz:28 },
  { num:64, name:'التغابن', en:'At-Taghabun', ayahs:18, juz:28 },
  { num:65, name:'الطلاق', en:'At-Talaq', ayahs:12, juz:28 },
  { num:66, name:'التحريم', en:'At-Tahrim', ayahs:12, juz:28 },
  { num:67, name:'الملك', en:'Al-Mulk', ayahs:30, juz:29 },
  { num:68, name:'القلم', en:'Al-Qalam', ayahs:52, juz:29 },
  { num:69, name:'الحاقة', en:'Al-Haqqah', ayahs:52, juz:29 },
  { num:70, name:'المعارج', en:'Al-Ma\'arij', ayahs:44, juz:29 },
  { num:71, name:'نوح', en:'Nuh', ayahs:28, juz:29 },
  { num:72, name:'الجن', en:'Al-Jinn', ayahs:28, juz:29 },
  { num:73, name:'المزمل', en:'Al-Muzzammil', ayahs:20, juz:29 },
  { num:74, name:'المدثر', en:'Al-Muddaththir', ayahs:56, juz:29 },
  { num:75, name:'القيامة', en:'Al-Qiyamah', ayahs:40, juz:29 },
  { num:76, name:'الإنسان', en:'Al-Insan', ayahs:31, juz:29 },
  { num:77, name:'المرسلات', en:'Al-Mursalat', ayahs:50, juz:29 },
  { num:78, name:'النبأ', en:'An-Naba', ayahs:40, juz:30 },
  { num:79, name:'النازعات', en:'An-Nazi\'at', ayahs:46, juz:30 },
  { num:80, name:'عبس', en:'Abasa', ayahs:42, juz:30 },
  { num:81, name:'التكوير', en:'At-Takwir', ayahs:29, juz:30 },
  { num:82, name:'الانفطار', en:'Al-Infitar', ayahs:19, juz:30 },
  { num:83, name:'المطففين', en:'Al-Mutaffifin', ayahs:36, juz:30 },
  { num:84, name:'الانشقاق', en:'Al-Inshiqaq', ayahs:25, juz:30 },
  { num:85, name:'البروج', en:'Al-Buruj', ayahs:22, juz:30 },
  { num:86, name:'الطارق', en:'At-Tariq', ayahs:17, juz:30 },
  { num:87, name:'الأعلى', en:'Al-A\'la', ayahs:19, juz:30 },
  { num:88, name:'الغاشية', en:'Al-Ghashiyah', ayahs:26, juz:30 },
  { num:89, name:'الفجر', en:'Al-Fajr', ayahs:30, juz:30 },
  { num:90, name:'البلد', en:'Al-Balad', ayahs:20, juz:30 },
  { num:91, name:'الشمس', en:'Ash-Shams', ayahs:15, juz:30 },
  { num:92, name:'الليل', en:'Al-Layl', ayahs:21, juz:30 },
  { num:93, name:'الضحى', en:'Ad-Duha', ayahs:11, juz:30 },
  { num:94, name:'الشرح', en:'Ash-Sharh', ayahs:8, juz:30 },
  { num:95, name:'التين', en:'At-Tin', ayahs:8, juz:30 },
  { num:96, name:'العلق', en:'Al-Alaq', ayahs:19, juz:30 },
  { num:97, name:'القدر', en:'Al-Qadr', ayahs:5, juz:30 },
  { num:98, name:'البينة', en:'Al-Bayyinah', ayahs:8, juz:30 },
  { num:99, name:'الزلزلة', en:'Az-Zalzalah', ayahs:8, juz:30 },
  { num:100, name:'العاديات', en:'Al-Adiyat', ayahs:11, juz:30 },
  { num:101, name:'القارعة', en:'Al-Qari\'ah', ayahs:11, juz:30 },
  { num:102, name:'التكاثر', en:'At-Takathur', ayahs:8, juz:30 },
  { num:103, name:'العصر', en:'Al-Asr', ayahs:3, juz:30 },
  { num:104, name:'الهمزة', en:'Al-Humazah', ayahs:9, juz:30 },
  { num:105, name:'الفيل', en:'Al-Fil', ayahs:5, juz:30 },
  { num:106, name:'قريش', en:'Quraysh', ayahs:4, juz:30 },
  { num:107, name:'الماعون', en:'Al-Ma\'un', ayahs:7, juz:30 },
  { num:108, name:'الكوثر', en:'Al-Kawthar', ayahs:3, juz:30 },
  { num:109, name:'الكافرون', en:'Al-Kafirun', ayahs:6, juz:30 },
  { num:110, name:'النصر', en:'An-Nasr', ayahs:3, juz:30 },
  { num:111, name:'المسد', en:'Al-Masad', ayahs:5, juz:30 },
  { num:112, name:'الإخلاص', en:'Al-Ikhlas', ayahs:4, juz:30 },
  { num:113, name:'الفلق', en:'Al-Falaq', ayahs:5, juz:30 },
  { num:114, name:'الناس', en:'An-Nas', ayahs:6, juz:30 },
]

export default function HifzPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az
  const sl = STATUS_LABELS[lang] || STATUS_LABELS.az

  const [progress, setProgress] = useState(loadProgress)
  const [filter, setFilter] = useState('all') // all, memorized, inProgress, notStarted

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const getStatus = (num) => progress[num] || 0

  const cycleStatus = (num) => {
    setProgress(prev => {
      const current = prev[num] || 0
      const next = (current + 1) % 3
      const updated = { ...prev }
      if (next === 0) delete updated[num]
      else updated[num] = next
      return updated
    })
  }

  const stats = useMemo(() => {
    let memorized = 0, inProg = 0, memAyahs = 0, progAyahs = 0
    SURAHS.forEach(s => {
      const st = progress[s.num] || 0
      if (st === 2) { memorized++; memAyahs += s.ayahs }
      if (st === 1) { inProg++; progAyahs += s.ayahs }
    })
    return { memorized, inProg, notStarted: 114 - memorized - inProg, memAyahs, progAyahs, pct: Math.round((memorized / 114) * 100) }
  }, [progress])

  const filtered = useMemo(() => {
    if (filter === 'all') return SURAHS
    if (filter === 'memorized') return SURAHS.filter(s => getStatus(s.num) === 2)
    if (filter === 'inProgress') return SURAHS.filter(s => getStatus(s.num) === 1)
    return SURAHS.filter(s => getStatus(s.num) === 0)
  }, [filter, progress])

  const handleReset = () => {
    if (window.confirm(t.confirmReset)) {
      setProgress({})
    }
  }

  const statusClass = (st) => st === 2 ? 'memorized' : st === 1 ? 'in-progress' : 'not-started'
  const statusIcon = (st) => st === 2 ? '✅' : st === 1 ? '📖' : ''

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-arabic">ٱلۡحِفۡظُ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner hifz-layout">

          {/* Stats bar */}
          <div className="hifz-stats">
            <div className="hifz-stat-card memorized">
              <span className="hifz-stat-num">{stats.memorized}</span>
              <span className="hifz-stat-label">{t.memorized}</span>
              <span className="hifz-stat-ayahs">{stats.memAyahs} {t.ayahCount}</span>
            </div>
            <div className="hifz-stat-card in-progress">
              <span className="hifz-stat-num">{stats.inProg}</span>
              <span className="hifz-stat-label">{t.inProgress}</span>
              <span className="hifz-stat-ayahs">{stats.progAyahs} {t.ayahCount}</span>
            </div>
            <div className="hifz-stat-card not-started">
              <span className="hifz-stat-num">{stats.notStarted}</span>
              <span className="hifz-stat-label">{t.notStarted}</span>
            </div>
            <div className="hifz-stat-card progress-card">
              <span className="hifz-stat-num">{stats.pct}%</span>
              <span className="hifz-stat-label">{t.progress}</span>
              <div className="hifz-progress-bar">
                <div className="hifz-progress-fill" style={{ width: `${stats.pct}%` }} />
              </div>
            </div>
          </div>

          {/* Filter + Reset */}
          <div className="hifz-controls">
            <div className="hifz-filters">
              {['all','memorized','inProgress','notStarted'].map(f => (
                <button key={f} className={`hifz-filter-btn ${filter===f?'active':''}`}
                  onClick={() => setFilter(f)}>
                  {t[f]}
                  <span className="hifz-filter-count">
                    {f==='all' ? 114 : f==='memorized' ? stats.memorized : f==='inProgress' ? stats.inProg : stats.notStarted}
                  </span>
                </button>
              ))}
            </div>
            <button className="btn-ghost hifz-reset-btn" onClick={handleReset}>
              {t.reset}
            </button>
          </div>

          {/* Surah grid */}
          <div className="hifz-grid">
            {filtered.map(s => {
              const st = getStatus(s.num)
              return (
                <button key={s.num} className={`hifz-card ${statusClass(st)}`}
                  onClick={() => cycleStatus(s.num)}
                  title={sl[st]}>
                  <div className="hifz-card-num">{s.num}</div>
                  <div className="hifz-card-body">
                    <div className="hifz-card-arabic">{s.name}</div>
                    <div className="hifz-card-en">{s.en}</div>
                    <div className="hifz-card-meta">
                      <span>{s.ayahs} {t.ayahCount}</span>
                      <span>{t.juz} {s.juz}</span>
                    </div>
                  </div>
                  <div className="hifz-card-status">
                    {statusIcon(st)}
                  </div>
                </button>
              )
            })}
          </div>

        </div>
      </div>
    </>
  )
}
