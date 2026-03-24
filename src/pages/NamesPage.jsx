import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/NamesPage.css'

const NAMES_99 = [
  { n:1,  ar:'ٱللَّهُ',         tr:'Allah',        az:'Uca Allah',               en:'Allah',             ru:'Аллах' },
  { n:2,  ar:'ٱلرَّحۡمَٰنُ',   tr:'Ar-Rahman',    az:'Rəhman (Çox Rəhimli)',    en:'The Most Gracious', ru:'Всемилостивый' },
  { n:3,  ar:'ٱلرَّحِيمُ',     tr:'Ar-Rahim',     az:'Rəhim (Çox Mərhəmətli)',  en:'The Most Merciful', ru:'Милосердный' },
  { n:4,  ar:'ٱلۡمَلِكُ',      tr:'Al-Malik',     az:'Malik (Hökmdar)',          en:'The King',          ru:'Царь' },
  { n:5,  ar:'ٱلۡقُدُّوسُ',    tr:'Al-Quddus',    az:'Quddus (Müqəddəs)',       en:'The Most Holy',     ru:'Священный' },
  { n:6,  ar:'ٱلسَّلَٰمُ',     tr:'As-Salam',     az:'Salam (Əmin-Amanlıq)',    en:'The Source of Peace',ru:'Мир' },
  { n:7,  ar:'ٱلۡمُؤۡمِنُ',    tr:"Al-Mu'min",    az:"Mömin (Güvən Verən)",     en:'The Guardian of Faith',ru:'Дающий веру' },
  { n:8,  ar:'ٱلۡمُهَيۡمِنُ',  tr:'Al-Muhaymin',  az:'Müheymin (Gözetən)',      en:'The Protector',     ru:'Хранитель' },
  { n:9,  ar:'ٱلۡعَزِيزُ',     tr:"Al-'Aziz",     az:"Əziz (Güclü, Üstün)",    en:'The Almighty',      ru:'Могущественный' },
  { n:10, ar:'ٱلۡجَبَّارُ',    tr:'Al-Jabbar',    az:'Cəbbar (Qüdrətli)',       en:'The Compeller',     ru:'Всесильный' },
  { n:11, ar:'ٱلۡمُتَكَبِّرُ', tr:'Al-Mutakabbir',az:'Mütəkəbbir (Uca)',        en:'The Supreme',       ru:'Превеликий' },
  { n:12, ar:'ٱلۡخَٰلِقُ',     tr:'Al-Khaliq',    az:'Xaliq (Yaradan)',          en:'The Creator',       ru:'Творец' },
  { n:13, ar:'ٱلۡبَارِئُ',     tr:"Al-Bari'",     az:"Bari (Var Edən)",         en:'The Originator',    ru:'Создатель' },
  { n:14, ar:'ٱلۡمُصَوِّرُ',   tr:'Al-Musawwir',  az:'Müsavvir (Şəkilverən)',   en:'The Fashioner',     ru:'Дающий облик' },
  { n:15, ar:'ٱلۡغَفَّارُ',    tr:'Al-Ghaffar',   az:'Ğaffar (Çox Bağışlayan)', en:'The Ever-Forgiving',ru:'Всепрощающий' },
  { n:16, ar:'ٱلۡقَهَّارُ',    tr:'Al-Qahhar',    az:'Qahhar (Qalib Gələn)',    en:'The Subduer',       ru:'Всепобеждающий' },
  { n:17, ar:'ٱلۡوَهَّابُ',    tr:'Al-Wahhab',    az:'Vəhhab (Çox Bəxş Edən)', en:'The Bestower',      ru:'Щедродарящий' },
  { n:18, ar:'ٱلرَّزَّاقُ',    tr:'Ar-Razzaq',    az:'Rəzzaq (Ruzi Verən)',     en:'The Provider',      ru:'Питающий' },
  { n:19, ar:'ٱلۡفَتَّاحُ',    tr:'Al-Fattah',    az:'Fəttah (Açan)',           en:'The Opener',        ru:'Открывающий' },
  { n:20, ar:'ٱلۡعَلِيمُ',     tr:"Al-'Alim",     az:"Əlim (Hər Şeyi Bilən)",  en:'The All-Knowing',   ru:'Всезнающий' },
  { n:21, ar:'ٱلۡقَابِضُ',     tr:'Al-Qabid',     az:'Qabiz (Tutan)',           en:'The Restrainer',    ru:'Сжимающий' },
  { n:22, ar:'ٱلۡبَاسِطُ',     tr:'Al-Basit',     az:'Basit (Genişləndirən)',   en:'The Extender',      ru:'Расширяющий' },
  { n:23, ar:'ٱلۡخَافِضُ',     tr:'Al-Khafid',    az:'Xafiz (Alçaldan)',        en:'The Abaser',        ru:'Унижающий' },
  { n:24, ar:'ٱلرَّافِعُ',     tr:'Ar-Rafi',      az:'Rafi (Yüksəldən)',        en:'The Exalter',       ru:'Возвышающий' },
  { n:25, ar:'ٱلۡمُعِزُّ',     tr:"Al-Mu'izz",    az:"Müizz (İzzət Verən)",    en:'The Bestower of Honor',ru:'Дающий достоинство' },
  { n:26, ar:'ٱلۡمُذِلُّ',     tr:'Al-Mudhill',   az:'Müzill (Alçaldan)',       en:'The Humiliator',    ru:'Унижающий' },
  { n:27, ar:'ٱلسَّمِيعُ',     tr:'As-Sami',      az:'Səmi (Eşidən)',           en:'The All-Hearing',   ru:'Всеслышащий' },
  { n:28, ar:'ٱلۡبَصِيرُ',     tr:'Al-Basir',     az:'Bəsir (Görən)',           en:'The All-Seeing',    ru:'Всевидящий' },
  { n:29, ar:'ٱلۡحَكَمُ',      tr:'Al-Hakam',     az:'Həkəm (Hökm Edən)',       en:'The Judge',         ru:'Судья' },
  { n:30, ar:'ٱلۡعَدۡلُ',      tr:"Al-'Adl",      az:"Ədl (Ədalətli)",         en:'The Just',          ru:'Справедливый' },
  { n:31, ar:'ٱللَّطِيفُ',     tr:'Al-Latif',     az:'Lətif (Nazik, Xeyirxah)',en:'The Subtle',        ru:'Тонкий' },
  { n:32, ar:'ٱلۡخَبِيرُ',     tr:'Al-Khabir',    az:'Xəbir (Xəbərdar)',       en:'The All-Aware',     ru:'Осведомлённый' },
  { n:33, ar:'ٱلۡحَلِيمُ',     tr:'Al-Halim',     az:'Həlim (Həlim)',           en:'The Forbearing',    ru:'Кроткий' },
  { n:34, ar:'ٱلۡعَظِيمُ',     tr:"Al-'Azim",     az:"Əzim (Böyük)",           en:'The Great',         ru:'Великий' },
  { n:35, ar:'ٱلۡغَفُورُ',     tr:'Al-Ghafur',    az:'Ğəfur (Bağışlayan)',     en:'The Forgiving',     ru:'Прощающий' },
  { n:36, ar:'ٱلشَّكُورُ',     tr:'Ash-Shakur',   az:'Şəkur (Şükür Edən)',     en:'The Appreciative',  ru:'Благодарный' },
  { n:37, ar:'ٱلۡعَلِيُّ',     tr:"Al-'Aliyy",    az:"Əliy (Uca)",             en:'The Most High',     ru:'Всевышний' },
  { n:38, ar:'ٱلۡكَبِيرُ',     tr:'Al-Kabir',     az:'Kəbir (Böyük)',          en:'The Most Great',    ru:'Величайший' },
  { n:39, ar:'ٱلۡحَفِيظُ',     tr:'Al-Hafiz',     az:'Həfiz (Qoruyan)',        en:'The Preserver',     ru:'Хранящий' },
  { n:40, ar:'ٱلۡمُقِيتُ',     tr:'Al-Muqit',     az:'Müqit (Qüvvət Verən)',  en:'The Nourisher',     ru:'Питающий' },
  { n:41, ar:'ٱلۡحَسِيبُ',     tr:'Al-Hasib',     az:'Həsib (Hesablayan)',     en:'The Reckoner',      ru:'Учитывающий' },
  { n:42, ar:'ٱلۡجَلِيلُ',     tr:'Al-Jalil',     az:'Cəlil (Əzəmətli)',       en:'The Majestic',      ru:'Величественный' },
  { n:43, ar:'ٱلۡكَرِيمُ',     tr:'Al-Karim',     az:'Kərim (Kərəmli)',        en:'The Generous',      ru:'Щедрый' },
  { n:44, ar:'ٱلرَّقِيبُ',     tr:'Ar-Raqib',     az:'Rəqib (Gözetən)',        en:'The Watchful',      ru:'Бдительный' },
  { n:45, ar:'ٱلۡمُجِيبُ',     tr:'Al-Mujib',     az:'Mücib (Cavab Verən)',    en:'The Responsive',    ru:'Отвечающий' },
  { n:46, ar:'ٱلۡوَٰسِعُ',     tr:'Al-Wasi',      az:'Vasi (Genişlik Verən)',  en:'The All-Encompassing',ru:'Объемлющий' },
  { n:47, ar:'ٱلۡحَكِيمُ',     tr:'Al-Hakim',     az:'Həkim (Hikmət Sahibi)',  en:'The Wise',          ru:'Мудрый' },
  { n:48, ar:'ٱلۡوَدُودُ',     tr:'Al-Wadud',     az:'Vədud (Sevən)',          en:'The Loving',        ru:'Любящий' },
  { n:49, ar:'ٱلۡمَجِيدُ',     tr:'Al-Majid',     az:'Məcid (Şanlı)',          en:'The Most Glorious', ru:'Славный' },
  { n:50, ar:'ٱلۡبَاعِثُ',     tr:'Al-Ba\'ith',   az:"Ba'is (Dirilən)",       en:'The Resurrector',   ru:'Воскрешающий' },
  { n:51, ar:'ٱلشَّهِيدُ',     tr:'Ash-Shahid',   az:'Şəhid (Şahid Olan)',    en:'The Witness',       ru:'Свидетель' },
  { n:52, ar:'ٱلۡحَقُّ',       tr:'Al-Haqq',      az:'Həqq (Haqq)',           en:'The Truth',         ru:'Истинный' },
  { n:53, ar:'ٱلۡوَكِيلُ',     tr:'Al-Wakil',     az:'Vəkil (Vəkil)',         en:'The Trustee',       ru:'Попечитель' },
  { n:54, ar:'ٱلۡقَوِيُّ',     tr:'Al-Qawiyy',    az:'Qəvi (Güclü)',          en:'The Strong',        ru:'Сильный' },
  { n:55, ar:'ٱلۡمَتِينُ',     tr:'Al-Matin',     az:'Mətin (Möhkəm)',        en:'The Firm',          ru:'Твёрдый' },
  { n:56, ar:'ٱلۡوَلِيُّ',     tr:'Al-Waliyy',    az:'Vəliy (Dost)',          en:'The Protecting Friend',ru:'Покровитель' },
  { n:57, ar:'ٱلۡحَمِيدُ',     tr:'Al-Hamid',     az:'Həmid (Həmd Edilən)',   en:'The Praiseworthy',  ru:'Достохвальный' },
  { n:58, ar:'ٱلۡمُحۡصِيُّ',   tr:'Al-Muhsi',     az:'Mühsi (Sayan)',         en:'The Counter',       ru:'Исчисляющий' },
  { n:59, ar:'ٱلۡمُبۡدِئُ',    tr:"Al-Mubdi'",    az:"Mübdi (İbtida Edən)",   en:'The Originator',    ru:'Зачинающий' },
  { n:60, ar:'ٱلۡمُعِيدُ',     tr:'Al-Mu\'id',    az:"Müid (Geri Qaytaran)",  en:'The Restorer',      ru:'Возвращающий' },
  { n:61, ar:'ٱلۡمُحۡيِيُ',    tr:'Al-Muhyi',     az:'Mühyi (Dirildən)',      en:'The Giver of Life', ru:'Дарующий жизнь' },
  { n:62, ar:'ٱلۡمُمِيتُ',     tr:'Al-Mumit',     az:'Mümiyt (Öldürən)',      en:'The Taker of Life', ru:'Умерщвляющий' },
  { n:63, ar:'ٱلۡحَيُّ',       tr:'Al-Hayy',      az:'Həyy (Diri Olan)',      en:'The Ever-Living',   ru:'Живой' },
  { n:64, ar:'ٱلۡقَيُّومُ',    tr:'Al-Qayyum',    az:'Qayyum (Özü Mövcud)',   en:'The Self-Sustaining',ru:'Самодостаточный' },
  { n:65, ar:'ٱلۡوَاجِدُ',     tr:'Al-Wajid',     az:'Vacid (Mövcud)',        en:'The Finder',        ru:'Обнаруживающий' },
  { n:66, ar:'ٱلۡمَاجِدُ',     tr:'Al-Majid',     az:'Macid (Böyük)',         en:'The Noble',         ru:'Благородный' },
  { n:67, ar:'ٱلۡوَاحِدُ',     tr:'Al-Wahid',     az:'Vahid (Bir Olan)',      en:'The One',           ru:'Единый' },
  { n:68, ar:'ٱلۡأَحَدُ',      tr:'Al-Ahad',      az:'Əhəd (Yeganə)',         en:'The Unique',        ru:'Единственный' },
  { n:69, ar:'ٱلصَّمَدُ',      tr:'As-Samad',     az:'Saməd (Ehtiyacsız)',    en:'The Eternal',       ru:'Самодостаточный' },
  { n:70, ar:'ٱلۡقَادِرُ',     tr:'Al-Qadir',     az:'Qadir (Qadir Olan)',    en:'The All-Powerful',  ru:'Всемогущий' },
  { n:71, ar:'ٱلۡمُقۡتَدِرُ',  tr:'Al-Muqtadir',  az:'Müqtədir (Güclü)',     en:'The Powerful',      ru:'Могущественный' },
  { n:72, ar:'ٱلۡمُقَدِّمُ',   tr:'Al-Muqaddim',  az:'Müqəddim (Öndə Tutan)',en:'The Expediter',     ru:'Опережающий' },
  { n:73, ar:'ٱلۡمُؤَخِّرُ',   tr:'Al-Mu\'akhkhir',az:"Mü'əxxir (Arxada Tutan)",en:'The Delayer',    ru:'Откладывающий' },
  { n:74, ar:'ٱلۡأَوَّلُ',     tr:'Al-Awwal',     az:'Əvvəl (İlk Olan)',      en:'The First',         ru:'Первый' },
  { n:75, ar:'ٱلۡآخِرُ',       tr:'Al-Akhir',     az:'Axir (Son Olan)',       en:'The Last',          ru:'Последний' },
  { n:76, ar:'ٱلظَّاهِرُ',     tr:'Az-Zahir',     az:'Zahir (Aşkar Olan)',    en:'The Manifest',      ru:'Явный' },
  { n:77, ar:'ٱلۡبَاطِنُ',     tr:'Al-Batin',     az:'Batin (Gizli Olan)',    en:'The Hidden',        ru:'Скрытый' },
  { n:78, ar:'ٱلۡوَالِي',      tr:'Al-Wali',      az:'Vali (Hökmran)',        en:'The Governing',     ru:'Управляющий' },
  { n:79, ar:'ٱلۡمُتَعَالِي',  tr:'Al-Muta\'ali', az:'Mütəali (Yüksək)',     en:'The Most Exalted',  ru:'Превозвышенный' },
  { n:80, ar:'ٱلۡبَرُّ',       tr:'Al-Barr',      az:'Bərr (Yaxşılıq Edən)',  en:'The Source of Goodness',ru:'Источник добра' },
  { n:81, ar:'ٱلتَّوَّابُ',    tr:'At-Tawwab',    az:'Təvvab (Tövbəni Qəbul Edən)',en:'The Acceptor of Repentance',ru:'Принимающий покаяние' },
  { n:82, ar:'ٱلۡمُنۡتَقِمُ',  tr:'Al-Muntaqim',  az:'Müntəqim (İntiqam Alan)',en:'The Avenger',      ru:'Мстящий' },
  { n:83, ar:'ٱلۡعَفُوُّ',     tr:"Al-'Afuww",    az:"Əfuv (Əfv Edən)",      en:'The Pardoner',      ru:'Прощающий' },
  { n:84, ar:'ٱلرَّءُوفُ',     tr:"Ar-Ra'uf",     az:"Rəuf (Şəfqətli)",      en:'The Most Kind',     ru:'Снисходительный' },
  { n:85, ar:'مَالِكُ ٱلۡمُلۡكِ',tr:'Malikul Mulk',az:'Maliküllmülk (Mülkün Sahibi)',en:'Owner of Sovereignty',ru:'Обладатель власти' },
  { n:86, ar:'ذُو ٱلۡجَلَٰلِ وَٱلۡإِكۡرَامِ',tr:"Dhul Jalali wal Ikram",az:'Zülcəlali vəl-İkram',en:'Lord of Majesty',ru:'Обладатель величия' },
  { n:87, ar:'ٱلۡمُقۡسِطُ',    tr:'Al-Muqsit',    az:'Müqsit (Ədalətli)',     en:'The Equitable',     ru:'Справедливый' },
  { n:88, ar:'ٱلۡجَامِعُ',     tr:'Al-Jami',      az:'Cami (Toplayan)',       en:'The Gatherer',      ru:'Собирающий' },
  { n:89, ar:'ٱلۡغَنِيُّ',     tr:'Al-Ghani',     az:'Ğani (Ehtiyacsız)',     en:'The Rich',          ru:'Богатый' },
  { n:90, ar:'ٱلۡمُغۡنِي',     tr:'Al-Mughni',    az:'Müğni (Zənginləşdirən)',en:'The Enricher',      ru:'Обогащающий' },
  { n:91, ar:'ٱلۡمَانِعُ',     tr:'Al-Mani',      az:'Mani (Mane Olan)',      en:'The Preventer',     ru:'Препятствующий' },
  { n:92, ar:'ٱلضَّارُّ',      tr:'Ad-Darr',      az:'Zar (Zərər Verən)',     en:'The Distresser',    ru:'Причиняющий вред' },
  { n:93, ar:'ٱلنَّافِعُ',     tr:'An-Nafi',      az:'Nafi (Fayda Verən)',    en:'The Benefiter',     ru:'Приносящий пользу' },
  { n:94, ar:'ٱلنُّورُ',       tr:'An-Nur',       az:'Nur (İşıq Verən)',      en:'The Light',         ru:'Свет' },
  { n:95, ar:'ٱلۡهَادِيُ',     tr:'Al-Hadi',      az:'Hadi (Hidayət Edən)',   en:'The Guide',         ru:'Ведущий' },
  { n:96, ar:'ٱلۡبَدِيعُ',     tr:"Al-Badi'",     az:"Bədi (Hər Şeyi Yenidən Yaradan)",en:'The Originator',ru:'Несравненный творец' },
  { n:97, ar:'ٱلۡبَاقِي',      tr:'Al-Baqi',      az:'Baqi (Əbədi Olan)',     en:'The Everlasting',   ru:'Вечный' },
  { n:98, ar:'ٱلۡوَارِثُ',     tr:'Al-Warith',    az:'Varis (Mirasyedi)',     en:'The Inheritor',     ru:'Наследующий' },
  { n:99, ar:'ٱلرَّشِيدُ',     tr:'Ar-Rashid',    az:'Rəşid (Doğru Yollu)',  en:'The Guide to Right Path',ru:'Направляющий на истину' },
]

export default function NamesPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.names || T.az.names
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return NAMES_99
    return NAMES_99.filter(n =>
      n.ar.includes(q) || n.tr.toLowerCase().includes(q) ||
      (n[lang]||n.en||'').toLowerCase().includes(q) ||
      String(n.n).includes(q)
    )
  }, [search, lang])

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-arabic">أَسۡمَاءُ ٱللَّهِ ٱلۡحُسۡنَىٰ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="names-hadith-banner">
            <p className="names-hadith-text">{t.hadith}</p>
            <span className="names-hadith-ref">— {t.hadithRef}</span>
          </div>

          <div className="input-wrap" style={{ maxWidth:420, marginBottom:24 }}>
            <span className="input-icon">🔍</span>
            <input className="input-base input-with-icon" placeholder={t.searchPh}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="names-grid">
            {filtered.map(name => (
              <div key={name.n}
                className={`name-card ${selected===name.n?'active':''}`}
                onClick={() => setSelected(selected===name.n?null:name.n)}>
                <div className="name-num">{name.n}</div>
                <div className="name-arabic">{name.ar}</div>
                <div className="name-translit">{name.tr}</div>
                <div className="name-meaning">{name[lang] || name.en}</div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state"><span>⭐</span><p>{lang==='az'?'Ad tapılmadı':lang==='ru'?'Ничего не найдено':lang==='ar'?'لم يتم العثور على شيء':lang==='tr'?'Bulunamadı':'Not found'}</p></div>
          )}
        </div>
      </div>
    </>
  )
}
