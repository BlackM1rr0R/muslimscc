import { useState, useRef, useMemo, lazy, Suspense } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReaderDialog from '../components/reader/ReaderDialog'
import '../styles/IslamicHistoryPage.css'
// Yer fotoları (Wikimedia Commons) və siyər xəritələri (öz SVG) — canlı təsvir yoxdur
import PlacePhoto from '../components/media/PlacePhoto'
import { HijraMap, SirahMap, SpreadMap } from '../components/media/SiraMaps'
import RelatedLinks from '../components/media/RelatedLinks'
// Canlı yayılma xəritəsi (d3-geo + sahil xətləri) — ayrıca yüklənir; o vaxta qədər statik sxem
const SpreadTimeline = lazy(() => import('../components/media/SpreadTimeline'))
import { PLACE_PHOTOS } from '../data/placeImages'
// Məlumat — src/data/islamicHistory.js (peyğəmbərlər, hadisələr, dövrlər)
import { PROPHETS, EVENTS, EVENTS_SORTED, HISTORY_ERAS, eraOfEvent, ULUL_AZM } from '../data/islamicHistory'

/* ══════════════════════════════════════════════════════════════════
   İSLAMİ TARİX — dizayn v3
   Hero (split: mətn + Quba fotosu) → bölmə seçimi (Peyğəmbərlər /
   Tarixi hadisələr) →
     • Peyğəmbərlər: "ülul-əzm" qeydi + nömrəli kart şəbəkəsi
     • Hadisələr: dövr lenti (filtr) + dövrlərə bölünmüş zaman xətti
   → Xəritələr və yerlər (həmişə görünür) → Əlaqəli bölmələr.
   Əsas fakt / Quran istinadı <details> içindədir — səhifə yorucu olmasın.
   ══════════════════════════════════════════════════════════════════ */

// Hadisə → yer fotosu (yalnız hadisənin baş verdiyi məlum yer)
const EVENT_PHOTO = {
  'First Revelation': 'jabal-an-nur',
  'Isra and Miraj': 'al-aqsa',
  'Hijra to Medina': 'jabal-thawr',
  'Battle of Badr': 'badr',
  'Battle of Uhud': 'uhud',
  'Conquest of Mecca': 'masjid-al-haram',
  "Farewell Hajj & Prophet's Passing": 'mina',
}
// "Xəritələr və yerlər" bölməsi (5 dil)
const MAPS_L = {
  az: { eyebrow: 'Xəritələr', title: 'Siyərin coğrafiyası', lead: 'Hicrət yolu, döyüşlərin yerləri və İslamın yayılması — sxematik xəritələrdə.', places: 'Siyər yerləri' },
  en: { eyebrow: 'Maps', title: 'The geography of the Sirah', lead: 'The route of the Hijrah, the sites of the battles and the spread of Islam — on schematic maps.', places: 'Places of the Sirah' },
  ru: { eyebrow: 'Карты', title: 'География сиры', lead: 'Путь хиджры, места сражений и распространение ислама — на схематичных картах.', places: 'Места сиры' },
  ar: { eyebrow: 'خرائط', title: 'جغرافيا السيرة', lead: 'طريق الهجرة ومواضع الغزوات وانتشار الإسلام — في خرائط تخطيطية.', places: 'أماكن من السيرة' },
  tr: { eyebrow: 'Haritalar', title: 'Siyerin coğrafyası', lead: 'Hicret yolu, savaşların yerleri ve İslam’ın yayılışı — şematik haritalarda.', places: 'Siyer mekânları' },
}

/* ── Etiketlər ── */
const LABELS = {
  az: {
    eyebrow: 'Hədis və bilik', sections: 'Bölmələr', title: 'İslami tarix',
    subtitle: 'Quranda adı keçən 25 peyğəmbər və vəhydən bu günə İslam tarixinin mühüm hadisələri — bir zaman xəttində.',
    how: 'Bölməni seçin. Hadisələrdə dövr lentinə toxunaraq yalnız o dövrü göstərin; hər kartda «Əsas fakt» açılır.',
    prophets: 'Peyğəmbərlər', events: 'Tarixi hadisələr', eras: 'dövr', maps: 'xəritə',
    keyFact: 'Əsas fakt', quranRef: 'Quran istinadı', more: 'Əsas fakt və istinad',
    prophetsTitle: 'Quranda adı keçən peyğəmbərlər', prophetsLead: 'Adəmdən (ə.s.) Muhəmmədə ﷺ qədər — Quranda adı çəkilən 25 peyğəmbər, təxmini ardıcıllıqla.',
    ululTitle: 'Beş böyük peyğəmbər', ululText: 'Nuh, İbrahim, Musa, İsa və Muhəmməd ﷺ — Quranda (Əhzab 33:7, Şura 42:13) adları birlikdə çəkilir; alimlər onları «ülul-əzm» (qətiyyət sahibləri, Əhqaf 46:35) adlandırır. Kartlarda qızılı nişanla göstərilib.',
    ulul: 'Ülul-əzm',
    eventsTitle: 'Dövrlər üzrə hadisələr', eventsLead: 'Dövrü seçin — zaman xətti yalnız onu göstərsin. «Bütün dövrlər» hadisələri il ardıcıllığı ilə açır.',
    allEras: 'Bütün dövrlər', eraFilter: 'Dövr', nEvents: (n) => `${n} hadisə`, now: 'bu gün',
    relEyebrow: 'Davamı', relTitle: 'Əlaqəli bölmələr',
    read: 'Ətraflı', close: 'Bağla', prev: 'Əvvəlki', next: 'Növbəti', search: 'Peyğəmbər axtar...', onlyUlul: 'Yalnız ülul-əzm', noResults: 'Nəticə tapılmadı',
  },
  en: {
    eyebrow: 'Hadith & knowledge', sections: 'Sections', title: 'Islamic History',
    subtitle: 'The 25 prophets named in the Quran and the major events of Islamic history from the first revelation to today — on one timeline.',
    how: 'Pick a section. In events, tap an era on the strip to show only that era; open “Key fact” on any card.',
    prophets: 'Prophets', events: 'Historical Events', eras: 'eras', maps: 'maps',
    keyFact: 'Key fact', quranRef: 'Quran reference', more: 'Key fact and reference',
    prophetsTitle: 'Prophets named in the Quran', prophetsLead: 'From Adam to Muhammad ﷺ — the 25 prophets named in the Quran, in approximate order.',
    ululTitle: 'The five great prophets', ululText: 'Nuh, Ibrahim, Musa, Isa and Muhammad ﷺ are named together in the Quran (al-Ahzab 33:7, ash-Shura 42:13); the scholars call them “ulul-‘azm” (those of resolve, al-Ahqaf 46:35). They carry a gold badge on the cards.',
    ulul: 'Ulul-‘azm',
    eventsTitle: 'Events by era', eventsLead: 'Pick an era to show only it on the timeline. “All eras” lists every event in order of year.',
    allEras: 'All eras', eraFilter: 'Era', nEvents: (n) => `${n} ${n === 1 ? 'event' : 'events'}`, now: 'today',
    relEyebrow: 'Continue', relTitle: 'Related sections',
    read: 'Details', close: 'Close', prev: 'Previous', next: 'Next', search: 'Search prophets...', onlyUlul: 'Only ulul-‘azm', noResults: 'No results found',
  },
  ru: {
    eyebrow: 'Хадисы и знание', sections: 'Разделы', title: 'Исламская история',
    subtitle: '25 пророков, названных в Коране, и важнейшие события исламской истории от первого откровения до наших дней — на одной шкале времени.',
    how: 'Выберите раздел. В событиях нажмите на эпоху на ленте, чтобы показать только её; в каждой карточке раскрывается «Ключевой факт».',
    prophets: 'Пророки', events: 'Исторические события', eras: 'эпох', maps: 'карты',
    keyFact: 'Ключевой факт', quranRef: 'Ссылка на Коран', more: 'Ключевой факт и ссылка',
    prophetsTitle: 'Пророки, названные в Коране', prophetsLead: 'От Адама до Мухаммада ﷺ — 25 пророков, названных в Коране, в приблизительном порядке.',
    ululTitle: 'Пять великих пророков', ululText: 'Нух, Ибрахим, Муса, Иса и Мухаммад ﷺ названы в Коране вместе (аль-Ахзаб 33:7, аш-Шура 42:13); учёные называют их «улюль-‘азм» (обладатели решимости, аль-Ахкаф 46:35). На карточках они отмечены золотым знаком.',
    ulul: 'Улюль-‘азм',
    eventsTitle: 'События по эпохам', eventsLead: 'Выберите эпоху, чтобы шкала показала только её. «Все эпохи» — все события по годам.',
    allEras: 'Все эпохи', eraFilter: 'Эпоха', nEvents: (n) => `${n} ${ruPlural(n, 'событие', 'события', 'событий')}`, now: 'сегодня',
    relEyebrow: 'Дальше', relTitle: 'Связанные разделы',
    read: 'Подробнее', close: 'Закрыть', prev: 'Назад', next: 'Далее', search: 'Поиск пророка...', onlyUlul: 'Только улюль-‘азм', noResults: 'Ничего не найдено',
  },
  ar: {
    eyebrow: 'الحديث والعلم', sections: 'الأقسام', title: 'التاريخ الإسلامي',
    subtitle: 'الأنبياء الخمسة والعشرون المذكورون في القرآن، وأبرز أحداث التاريخ الإسلامي من أول الوحي إلى اليوم — على خط زمني واحد.',
    how: 'اختر القسم. في الأحداث اضغط على حقبة في الشريط لعرضها وحدها، وافتح «حقيقة أساسية» في كل بطاقة.',
    prophets: 'الأنبياء', events: 'أحداث تاريخية', eras: 'حقب', maps: 'خرائط',
    keyFact: 'حقيقة أساسية', quranRef: 'مرجع قرآني', more: 'حقيقة أساسية ومرجع',
    prophetsTitle: 'الأنبياء المذكورون في القرآن', prophetsLead: 'من آدم إلى محمد ﷺ — خمسة وعشرون نبيًا ذُكروا في القرآن، على الترتيب التقريبي.',
    ululTitle: 'أولو العزم من الرسل', ululText: 'نوح وإبراهيم وموسى وعيسى ومحمد ﷺ ذُكروا معًا في القرآن (الأحزاب ٧، الشورى ١٣)، ويسميهم العلماء «أولي العزم» (الأحقاف ٣٥). عليهم في البطاقات علامة ذهبية.',
    ulul: 'أولو العزم',
    eventsTitle: 'الأحداث حسب الحقب', eventsLead: 'اختر حقبة ليعرضها الخط الزمني وحدها، و«كل الحقب» يعرض جميع الأحداث حسب السنة.',
    allEras: 'كل الحقب', eraFilter: 'الحقبة', nEvents: (n) => (n === 1 ? 'حدث واحد' : n === 2 ? 'حدثان' : n <= 10 ? `${n} أحداث` : `${n} حدثًا`), now: 'اليوم',
    relEyebrow: 'للمتابعة', relTitle: 'أقسام ذات صلة',
    read: 'التفاصيل', close: 'إغلاق', prev: 'السابق', next: 'التالي', search: 'ابحث عن نبي...', onlyUlul: 'أولو العزم فقط', noResults: 'لم يتم العثور على نتائج',
  },
  tr: {
    eyebrow: 'Hadis ve ilim', sections: 'Bölümler', title: 'İslam Tarihi',
    subtitle: 'Kur’an’da adı geçen 25 peygamber ve ilk vahiyden bugüne İslam tarihinin önemli olayları — tek bir zaman çizelgesinde.',
    how: 'Bölümü seçin. Olaylarda şeritteki bir döneme dokunarak yalnız onu gösterin; her kartta «Önemli bilgi» açılır.',
    prophets: 'Peygamberler', events: 'Tarihi Olaylar', eras: 'dönem', maps: 'harita',
    keyFact: 'Önemli bilgi', quranRef: 'Kuran referansı', more: 'Önemli bilgi ve kaynak',
    prophetsTitle: 'Kur’an’da adı geçen peygamberler', prophetsLead: 'Âdem’den Muhammed’e ﷺ kadar — Kur’an’da adı geçen 25 peygamber, yaklaşık sırayla.',
    ululTitle: 'Beş büyük peygamber', ululText: 'Nuh, İbrâhim, Mûsâ, Îsâ ve Muhammed ﷺ Kur’an’da birlikte anılır (Ahzâb 33:7, Şûrâ 42:13); âlimler onlara «ülü’l-azm» (azim sahipleri, Ahkâf 46:35) der. Kartlarda altın renkli işaretle gösterilir.',
    ulul: 'Ülü’l-azm',
    eventsTitle: 'Dönemlere göre olaylar', eventsLead: 'Bir dönem seçin — zaman çizelgesi yalnız onu göstersin. «Tüm dönemler» bütün olayları yıl sırasıyla açar.',
    allEras: 'Tüm dönemler', eraFilter: 'Dönem', nEvents: (n) => `${n} olay`, now: 'bugün',
    relEyebrow: 'Devamı', relTitle: 'İlgili bölümler',
    read: 'Ayrıntılar', close: 'Kapat', prev: 'Önceki', next: 'Sonraki', search: 'Peygamber ara...', onlyUlul: 'Yalnızca ülü’l-azm', noResults: 'Sonuç bulunamadı',
  },
}

function ruPlural(n, one, few, many) {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}

// "Əlaqəli bölmələr" — məzmunu təkrarlamırıq, keçid veririk
const RELATED = [
  { page: 'sahaba', title: { az: 'Səhabələr', en: 'Companions', ru: 'Сахабы', ar: 'الصحابة', tr: 'Sahabeler' },
    text: { az: 'Bu hadisələrin iştirakçıları — həyatı və fəziləti', en: 'The people of these events — their lives and virtues', ru: 'Участники этих событий — их жизнь и достоинства', ar: 'رجال هذه الأحداث — سيرهم وفضائلهم', tr: 'Bu olayların şahsiyetleri — hayatları ve faziletleri' } },
  { page: 'scholars', title: { az: 'Alimlər', en: 'Scholars', ru: 'Учёные', ar: 'العلماء', tr: 'Âlimler' },
    text: { az: 'Hər dövrün Sələf yolunda olan imamları', en: 'The imams upon the way of the Salaf in every era', ru: 'Имамы пути саляфов в каждую эпоху', ar: 'أئمة كل عصر على طريقة السلف', tr: 'Her dönemin Selef yolundaki imamları' } },
  { page: 'holyplaces', title: { az: 'Müqəddəs yerlər', en: 'Holy places', ru: 'Святые места', ar: 'الأماكن المقدسة', tr: 'Kutsal mekânlar' },
    text: { az: 'Məkkə, Mədinə və Qüds — fotolar və tarix', en: 'Makkah, Madinah and Jerusalem — photos and history', ru: 'Мекка, Медина и Иерусалим — фото и история', ar: 'مكة والمدينة والقدس — صور وتاريخ', tr: 'Mekke, Medine ve Kudüs — fotoğraflar ve tarih' } },
  { page: 'hijri', title: { az: 'Hicri təqvim', en: 'Hijri calendar', ru: 'Календарь хиджры', ar: 'التقويم الهجري', tr: 'Hicri takvim' },
    text: { az: 'Miladi və hicri tarixi bir-birinə çevirin', en: 'Convert between Gregorian and Hijri dates', ru: 'Перевод дат между григорианским календарём и хиджрой', ar: 'التحويل بين التاريخين الميلادي والهجري', tr: 'Miladi ve hicri tarihleri birbirine çevirin' } },
]

const t = (o, lang) => (o && (o[lang] || o.en)) || ''
// Hadisənin ili (miladi, rəqəmlə): "632-661 CE" → "632–661"
const whenOf = (e) => {
  const m = /(\d{3,4})\s*-\s*(\d{3,4})/.exec(e.year.en)
  return m ? `${m[1]}–${m[2]}` : (/\d{3,4}/.exec(e.year.en)?.[0] || '')
}

export default function IslamicHistoryPage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const M = MAPS_L[lang] || MAPS_L.en
  const isAr = lang === 'ar'
  const [tab, setTab] = useState('prophets')
  const [era, setEra] = useState('all')

  // Telefonda bölmə seçimi yapışqandır: siyahının ortasında bölmə dəyişəndə
  // yeni siyahının əvvəlinə qalx
  const tabsRef = useRef(null)
  const bodyRef = useRef(null)
  const switchTab = (next) => {
    setTab(next)
    requestAnimationFrame(() => {
      const bar = tabsRef.current
      const body = bodyRef.current
      if (!bar || !body || getComputedStyle(bar).position !== 'sticky') return
      if (body.getBoundingClientRect().top < bar.getBoundingClientRect().bottom) body.scrollIntoView({ block: 'start' })
    })
  }

  const eraCounts = useMemo(() => {
    const c = {}
    for (const e of EVENTS) { const k = eraOfEvent(e); c[k] = (c[k] || 0) + 1 }
    return c
  }, [])
  const groups = HISTORY_ERAS
    .filter(x => era === 'all' || x.key === era)
    .map(x => ({ era: x, items: EVENTS_SORTED.filter(e => eraOfEvent(e) === x.key) }))
    .filter(g => g.items.length)
  const span = (x) => `${x.from}–${x.to ?? L.now}`

  // ── Peyğəmbərlər: axtarış + ülul-əzm süzgəci ──
  const [pq, setPq] = useState('')
  const [ululOnly, setUlulOnly] = useState(false)
  const prophets = useMemo(() => {
    const q = pq.trim().toLocaleLowerCase()
    return PROPHETS.filter(p => (!ululOnly || ULUL_AZM.includes(p.num)) &&
      (!q || [p.name[lang], p.name.en, p.arabic].some(s => String(s || '').toLocaleLowerCase().includes(q))))
  }, [pq, ululOnly, lang])

  // ── Oxu pəncərəsi: { kind: 'p' | 'e', i } — cari (süzülmüş) siyahı üzrə əvvəlki/növbəti ──
  const [reader, setReader] = useState(null)
  const eventList = useMemo(() => groups.flatMap(g => g.items), [groups])
  const rList = reader?.kind === 'p' ? prophets : eventList
  const rItem = reader ? rList[reader.i] : null
  const openP = (i) => setReader({ kind: 'p', i })
  const openE = (e) => setReader({ kind: 'e', i: eventList.indexOf(e) })
  const onCard = (fn) => (e) => { if (e.target.closest('a, button, summary, input')) return; fn() }

  return (
    <div className="history-page">
      <header className="ui-page-hero ui-page-hero--split hist-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{L.eyebrow}</span>
            <h1 className="ui-display">{L.title}</h1>
            <p className="ui-lead">{L.subtitle}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {L.how}</p>
            <ul className="ui-page-hero__stats">
              <li><b className="ui-num" data-count={PROPHETS.length}>{PROPHETS.length}</b><span>{L.prophets}</span></li>
              <li><b className="ui-num" data-count={EVENTS.length}>{EVENTS.length}</b><span>{L.events}</span></li>
              <li><b className="ui-num">{HISTORY_ERAS.length}</b><span>{L.eras}</span></li>
              <li><b className="ui-num">3</b><span>{L.maps}</span></li>
            </ul>
          </div>
          <div className="ui-page-hero__aside hist-hero__aside">
            <PlacePhoto id="quba" lang={lang} eager sizes="(min-width: 900px) 420px, 100vw" />
          </div>
        </div>
      </header>

      <div className="ui-section ui-section--tight history-body">
        <div className="ui-container">
          {/* Bölmə seçimi — telefonda başlığın altında yapışır */}
          <div className="history-tabs" ref={tabsRef}>
            <div className="history-tabs-track" role="group" aria-label={L.sections}>
              <button type="button" className="ui-chip history-tab-btn" aria-pressed={tab === 'prophets'} onClick={() => switchTab('prophets')}>
                <Icon name="sahaba" size={17} /> <span className="history-tab-label">{L.prophets}</span>
                <span className="history-tab-count ui-num">{PROPHETS.length}</span>
              </button>
              <button type="button" className="ui-chip history-tab-btn" aria-pressed={tab === 'events'} onClick={() => switchTab('events')}>
                <Icon name="history" size={17} /> <span className="history-tab-label">{L.events}</span>
                <span className="history-tab-count ui-num">{EVENTS.length}</span>
              </button>
            </div>
          </div>

          <div ref={bodyRef} className="history-panel" key={tab}>
            {tab === 'prophets' ? (
              <section aria-labelledby="hx-prophets-h">
                <div className="ui-section-head">
                  <h2 id="hx-prophets-h" className="ui-title ui-title--sm">{L.prophetsTitle}</h2>
                  <p className="ui-lead">{L.prophetsLead}</p>
                </div>
                <aside className="ui-callout ui-callout--accent hx-ulul">
                  <Icon name="star" />
                  <div>
                    <strong className="ui-callout__title">{L.ululTitle}</strong>
                    <p>{L.ululText}</p>
                  </div>
                </aside>
                <div className="hx-toolbar">
                  <label className="hx-search">
                    <span className="ui-sr-only">{L.search}</span>
                    <Icon name="search" size={18} className="hx-search__ic" />
                    <input type="search" className="ui-input" placeholder={L.search} value={pq} onChange={e => setPq(e.target.value)} />
                  </label>
                  <button type="button" className="ui-chip hx-ulul-chip" aria-pressed={ululOnly} onClick={() => setUlulOnly(v => !v)}>
                    <Icon name="star" size={15} /> {L.onlyUlul} <span className="ui-num">{ULUL_AZM.length}</span>
                  </button>
                  <span className="hx-count ui-num" aria-live="polite">{prophets.length} / {PROPHETS.length}</span>
                </div>
                {prophets.length === 0 && (
                  <div className="ui-card ui-card--sunken hx-empty">
                    <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="search" /></span>
                    <p>{L.noResults}</p>
                  </div>
                )}
                <ol className="hx-prophets">
                  {prophets.map((p, pi) => {
                    const key = ULUL_AZM.includes(p.num)
                    return (
                      <li key={p.num} className={`ui-card hx-prophet hx-clickable${key ? ' is-key' : ''}`} onClick={onCard(() => openP(pi))}>
                        <div className="hx-prophet__head">
                          <span className="hx-prophet__num ui-num" aria-hidden="true">{p.num}</span>
                          <div className="hx-prophet__names">
                            <h3 className="hx-prophet__name">{t(p.name, lang)}</h3>
                            {!isAr && <span className="hx-prophet__ar ui-arabic" lang="ar" dir="rtl">{p.arabic}</span>}
                          </div>
                          {key && <span className="ui-badge ui-badge--accent hx-prophet__badge">{L.ulul}</span>}
                        </div>
                        <p className="hx-prophet__era"><Icon name="clock" size={14} /> {t(p.era, lang)}</p>
                        <p className="hx-prophet__desc">{t(p.desc, lang)}</p>
                        <button type="button" className="hx-open" onClick={() => openP(pi)} aria-haspopup="dialog">
                          <Icon name="learn" size={16} /> {L.more}<span className="ui-sr-only">: {t(p.name, lang)}</span>
                          <Icon name="arrow" size={15} className="ui-flip-rtl hx-open__arr" />
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ) : (
              <section aria-labelledby="hx-events-h">
                <div className="ui-section-head">
                  <h2 id="hx-events-h" className="ui-title ui-title--sm">{L.eventsTitle}</h2>
                  <p className="ui-lead">{L.eventsLead}</p>
                </div>
                {/* Dövr lenti — filtr (aria-pressed); hər dövrdə illər və hadisə sayı */}
                <div className="hx-eras" role="group" aria-label={L.eraFilter}>
                  <button type="button" className="hx-era hx-era--all" aria-pressed={era === 'all'} onClick={() => setEra('all')}>
                    <span className="hx-era__name">{L.allEras}</span>
                    <span className="hx-era__years ui-num">610–{L.now}</span>
                    <span className="hx-era__n">{L.nEvents(EVENTS.length)}</span>
                  </button>
                  {HISTORY_ERAS.map(x => (
                    <button key={x.key} type="button" className="hx-era" aria-pressed={era === x.key} onClick={() => setEra(x.key)}>
                      <span className="hx-era__name">{t(x.name, lang)}</span>
                      <span className="hx-era__years ui-num">{span(x)}</span>
                      <span className="hx-era__n">{L.nEvents(eraCounts[x.key] || 0)}</span>
                    </button>
                  ))}
                </div>

                <div className="hx-groups" key={era}>
                  {groups.map(g => (
                    <section key={g.era.key} className="hx-group" aria-labelledby={`hx-era-${g.era.key}`}>
                      <h3 id={`hx-era-${g.era.key}`} className="hx-group__title">
                        {t(g.era.name, lang)} <span className="hx-group__span ui-num">{span(g.era)}</span>
                      </h3>
                      <ol className="hx-tl">
                        {g.items.map(e => {
                          const photo = EVENT_PHOTO[e.title.en]
                          return (
                            <li key={`${e.title.en}|${e.year.en}`} className={`hx-ev hx-clickable${photo ? ' hx-ev--media' : ''}`} onClick={onCard(() => openE(e))}>
                              <span className="hx-ev__when ui-num">{whenOf(e)}</span>
                              <div className="hx-ev__body">
                                <h4 className="hx-ev__title">{t(e.title, lang)}</h4>
                                <p className="hx-ev__desc">{t(e.desc, lang)}</p>
                                <button type="button" className="hx-open" onClick={() => openE(e)} aria-haspopup="dialog">
                                  <Icon name="learn" size={16} /> {L.keyFact}<span className="ui-sr-only">: {t(e.title, lang)}</span>
                                  <Icon name="arrow" size={15} className="ui-flip-rtl hx-open__arr" />
                                </button>
                              </div>
                              {photo && (
                                <div className="hx-ev__media">
                                  <PlacePhoto id={photo} lang={lang} className="ph--zoom" creditLinks={false} sizes="(min-width: 768px) 200px, 100vw" />
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ol>
                    </section>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Xəritələr və yerlər — hər iki bölmədə görünür */}
      <section className="ui-section ui-section--alt history-maps" aria-labelledby="history-maps-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{M.eyebrow}</span>
            <h2 id="history-maps-h" className="ui-title">{M.title}</h2>
            <p className="ui-lead">{M.lead}</p>
          </div>
          <div className="history-maps-pair">
            <HijraMap lang={lang} />
            <SirahMap lang={lang} />
          </div>
          <Suspense fallback={<SpreadMap lang={lang} />}>
            <SpreadTimeline lang={lang} />
          </Suspense>
          <h3 className="history-places-title">{M.places}</h3>
          <div className="ph-strip" data-reveal="stagger">
            {['taif', 'al-baqi'].map(k => (
              <div key={k}>
                <PlacePhoto id={k} lang={lang} className="ph--zoom" sizes="(min-width: 1024px) 300px, 100vw" />
                <p className="ph-strip__cap">{PLACE_PHOTOS[k].name[lang] || PLACE_PHOTOS[k].name.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ui-section ui-section--tight hx-related" aria-labelledby="hx-rel-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{L.relEyebrow}</span>
            <h2 id="hx-rel-h" className="ui-title ui-title--sm">{L.relTitle}</h2>
          </div>
          <RelatedLinks items={RELATED} />
        </div>
      </section>

      <ReaderDialog
        open={!!rItem}
        onClose={() => setReader(null)}
        onPrev={reader && reader.i > 0 ? () => setReader({ ...reader, i: reader.i - 1 }) : undefined}
        onNext={reader && reader.i < rList.length - 1 ? () => setReader({ ...reader, i: reader.i + 1 }) : undefined}
        labelledBy="hx-read-title"
        position={reader ? `${reader.i + 1} / ${rList.length}` : null}
        labels={{ close: L.close, prev: L.prev, next: L.next }}
        contentKey={reader ? `${reader.kind}${reader.i}` : ''}
        className="hx-read"
        head={rItem && (reader.kind === 'p'
          ? <><span className="hx-prophet__num ui-num" aria-hidden="true">{rItem.num}</span>{ULUL_AZM.includes(rItem.num) && <span className="ui-badge ui-badge--accent">{L.ulul}</span>}</>
          : <span className="hx-ev__when ui-num">{whenOf(rItem)}</span>)}
      >
        {rItem && reader.kind === 'p' && (
          <article className="hx-read__body">
            <header className="hx-read__head">
              <h2 id="hx-read-title" className="hx-read__title">{t(rItem.name, lang)}</h2>
              {!isAr && <p className="hx-read__ar ui-arabic" lang="ar" dir="rtl">{rItem.arabic}</p>}
            </header>
            <p className="hx-prophet__era"><Icon name="clock" size={14} /> {t(rItem.era, lang)}</p>
            <p className="hx-read__desc">{t(rItem.desc, lang)}</p>
            <div className="hx-read__fact">
              <span className="hx-read__label">{L.keyFact}</span>
              <p>{t(rItem.keyFact, lang)}</p>
            </div>
            {rItem.quranRef && (
              <p className="hx-more__ref"><Icon name="quran" size={14} /> {L.quranRef}:{' '}
                <span dir="ltr" className="hx-more__refs">{rItem.quranRef.split(/,\s*/).map((r, i, a) => (
                  <span key={i}>{i > 0 && ' '}<span className="hx-more__refi">{r}{i < a.length - 1 ? ',' : ''}</span></span>
                ))}</span>
              </p>
            )}
          </article>
        )}
        {rItem && reader.kind === 'e' && (
          <article className="hx-read__body">
            <h2 id="hx-read-title" className="hx-read__title">{t(rItem.title, lang)}</h2>
            <p className="hx-prophet__era"><Icon name="history" size={14} /> {t(HISTORY_ERAS.find(x => x.key === eraOfEvent(rItem))?.name, lang)}</p>
            {EVENT_PHOTO[rItem.title.en] && (
              <div className="hx-read__media">
                <PlacePhoto id={EVENT_PHOTO[rItem.title.en]} lang={lang} sizes="(min-width: 768px) 700px, 100vw" />
              </div>
            )}
            <p className="hx-read__desc">{t(rItem.desc, lang)}</p>
            <div className="hx-read__fact">
              <span className="hx-read__label">{L.keyFact}</span>
              <p>{t(rItem.keyFact, lang)}</p>
            </div>
          </article>
        )}
      </ReaderDialog>
    </div>
  )
}
