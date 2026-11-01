import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import {
  VERIFIED_ON, FATWA_LANGS, LANG_LABELS, HADITH_TOOLS, GRADES, GRADE_TIPS,
  SOURCES, SOURCE_SHORT, TOPICS, COMMENTARIES,
} from '../data/fatwaSources'
import '../styles/FatwaPage.css'

/* ══════════════════════════════════════════════════════════════════
   FƏTVALAR VƏ ELM MƏNBƏLƏRİ — /fatwa
   Bizim fətva mətnimiz YOXDUR: yalnız Sələf alimlərinin rəsmi saytlarına və
   hədis bazalarına keçidlər kataloqu (src/data/fatwaSources.js — hər URL
   yoxlanıb, tarix: VERIFIED_ON). Bütün kənar keçidlər yeni vərəqdə,
   rel="noopener noreferrer". Hədis yoxlayıcısı yalnız axtarış URL-i qurur —
   sorğu bizim serverə getmir, kənar sayt oxunmur (scraping/API yoxdur).

   Quruluş: hero → yapışqan alət zolağı (axtarış + dil və mövzu çipləri) →
   1) hədis yoxlayıcısı + dərəcələr → 2) mənbə kartları → 3) mövzu kataloqu →
   4) mətnlərin şərhləri (bizdə eyni mətnin dərsi varsa — daxili keçid) → qeyd.
   ══════════════════════════════════════════════════════════════════ */

const L10N = {
  az: {
    eyebrow: 'Elm mənbələri', title: 'Fətvalar və elm mənbələri',
    lead: 'Sələf alimlərinin rəsmi saytları, mövzular üzrə fətva kataloqu, hədis yoxlayıcısı və əsas mətnlərin şərhləri — bir yerdə.',
    how: 'Burada bizim fətvamız yoxdur: cavablar müvafiq alimlərə məxsusdur, keçidlər kənar saytı yeni vərəqdə açır.',
    statSources: 'mənbə', statTopics: 'mövzu', statLinks: 'yoxlanmış keçid', verified: 'Keçidlər yoxlanıb',
    search: 'Mənbə, mövzu və ya kitab axtar...', clear: 'Axtarışı təmizlə', all: 'Hamısı',
    langFilter: 'Saytın dilinə görə süzgəc', topicFilter: 'Mövzuya görə süzgəc', langLabel: 'Dil', topicLabel: 'Mövzu',
    reset: 'Süzgəci sıfırla', none: 'Bu süzgəcə uyğun heç nə tapılmadı.',
    jump: 'Bölmələr', secChecker: 'Hədis yoxlayıcısı', secSources: 'Rəsmi mənbələr', secTopics: 'Mövzu kataloqu', secMutun: 'Mətnlərin şərhləri',
    checkerLead: 'Hədisin mətnini yazın və onu etibarlı hədis bazasında açın. Sorğu birbaşa seçdiyiniz sayta gedir.',
    checkerLabel: 'Hədisin mətni', checkerPh: 'Məs.: إنما الأعمال بالنيات', checkerHint: 'Ən dəqiq nəticə üçün ərəbcə mətnin bir hissəsini yazın.',
    open: 'Aç', openIn: 'Axtar', emptyQ: 'Əvvəlcə mətn yazın',
    gradesTitle: 'Dərəcəni necə oxumaq olar', gradesLead: 'Hədis bazası rəvayətin yanında mühəddisin hökmünü göstərir. Əsas dərəcələr:',
    ruling: 'Hökmü', mustalah: 'Ətraflı: hədis elminin əsasları (dərs)',
    sourcesLead: 'Alimlərin özlərinin və ya onların fətvalarını dərc edən rəsmi qurumların saytları.',
    kinds: { official: 'Rəsmi sayt', qa: 'Sual-cavab', library: 'Kitabxana', scholar: 'Alimin saytı' },
    visit: 'Sayta keç', versions: 'Dil versiyaları', sections: 'Bölmələr',
    topicsLead: 'Hər mövzu üzrə fətvaların toplandığı ümumi səhifələr — tək bir fətvaya deyil, bütöv bölməyə keçid.',
    mutunLead: 'Əsas əqidə və hədis mətnlərinin alimlər tərəfindən audio və yazılı şərhləri.',
    audio: 'Audio', book: 'Kitab', ourLesson: 'Bizdə bu mətnin dərsi', ourPage: 'Bizdə bu kitab',
    noteTitle: 'Qeyd', note: 'Bu səhifə yalnız kataloqdur. Fətvaların mətni və hüquqları müvafiq alimlərə və saytlara məxsusdur; biz onları dəyişmirik və köçürmürük. Hər keçid aşağıdakı tarixdə yoxlanıb; sayt ünvanı dəyişibsə, bizə bildirin.',
    external: 'yeni vərəqdə açılır', results: 'nəticə',
    months: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  },
  en: {
    eyebrow: 'Scholarly sources', title: 'Fatwas & scholarly sources',
    lead: 'Official sites of the scholars of the Salaf, a topic directory of fatwas, a hadith checker and commentaries on the core texts — in one place.',
    how: 'There are no fatwas of ours here: the answers belong to the respective scholars, and links open the external site in a new tab.',
    statSources: 'sources', statTopics: 'topics', statLinks: 'verified links', verified: 'Links verified',
    search: 'Search sources, topics or books...', clear: 'Clear search', all: 'All',
    langFilter: 'Filter by site language', topicFilter: 'Filter by topic', langLabel: 'Language', topicLabel: 'Topic',
    reset: 'Reset filters', none: 'Nothing matches these filters.',
    jump: 'Sections', secChecker: 'Hadith checker', secSources: 'Official sources', secTopics: 'Topic directory', secMutun: 'Commentaries on texts',
    checkerLead: 'Type the text of a hadith and open it in a trusted hadith database. The query goes straight to the site you choose.',
    checkerLabel: 'Hadith text', checkerPh: 'E.g.: إنما الأعمال بالنيات', checkerHint: 'For the most accurate result, type part of the Arabic text.',
    open: 'Open', openIn: 'Search', emptyQ: 'Type some text first',
    gradesTitle: 'How to read the grade', gradesLead: 'Hadith databases show the hadith scholar’s verdict next to each narration. The main grades:',
    ruling: 'Ruling', mustalah: 'More: the basics of hadith science (lesson)',
    sourcesLead: 'Sites of the scholars themselves, or of the official bodies that publish their fatwas.',
    kinds: { official: 'Official site', qa: 'Q&A', library: 'Library', scholar: 'Scholar’s site' },
    visit: 'Visit site', versions: 'Language versions', sections: 'Sections',
    topicsLead: 'Index pages that gather the fatwas on each topic — links to whole sections, not to single fatwas.',
    mutunLead: 'Audio and written commentaries by the scholars on the core texts of creed and hadith.',
    audio: 'Audio', book: 'Book', ourLesson: 'Our lesson on this text', ourPage: 'This book on our site',
    noteTitle: 'Note', note: 'This page is only a directory. The text of the fatwas and its rights belong to the respective scholars and sites; we neither change nor copy them. Each link was verified on the date below; if an address has changed, please let us know.',
    external: 'opens in a new tab', results: 'results',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  ru: {
    eyebrow: 'Источники знаний', title: 'Фетвы и источники знаний',
    lead: 'Официальные сайты учёных-саляфов, тематический каталог фетв, проверка хадисов и разъяснения основных текстов — в одном месте.',
    how: 'Наших фетв здесь нет: ответы принадлежат соответствующим учёным, а ссылки открывают внешний сайт в новой вкладке.',
    statSources: 'источников', statTopics: 'тем', statLinks: 'проверенных ссылок', verified: 'Ссылки проверены',
    search: 'Поиск источника, темы или книги...', clear: 'Очистить поиск', all: 'Все',
    langFilter: 'Фильтр по языку сайта', topicFilter: 'Фильтр по теме', langLabel: 'Язык', topicLabel: 'Тема',
    reset: 'Сбросить фильтры', none: 'По этим фильтрам ничего не найдено.',
    jump: 'Разделы', secChecker: 'Проверка хадиса', secSources: 'Официальные источники', secTopics: 'Каталог тем', secMutun: 'Разъяснения текстов',
    checkerLead: 'Введите текст хадиса и откройте его в надёжной базе хадисов. Запрос уходит напрямую на выбранный сайт.',
    checkerLabel: 'Текст хадиса', checkerPh: 'Напр.: إنما الأعمال بالنيات', checkerHint: 'Для самого точного результата введите часть арабского текста.',
    open: 'Открыть', openIn: 'Искать', emptyQ: 'Сначала введите текст',
    gradesTitle: 'Как читать степень хадиса', gradesLead: 'Базы хадисов показывают оценку мухаддиса рядом с каждым преданием. Основные степени:',
    ruling: 'Положение', mustalah: 'Подробнее: основы науки о хадисе (урок)',
    sourcesLead: 'Сайты самих учёных или официальных учреждений, публикующих их фетвы.',
    kinds: { official: 'Официальный сайт', qa: 'Вопрос-ответ', library: 'Библиотека', scholar: 'Сайт учёного' },
    visit: 'Перейти на сайт', versions: 'Языковые версии', sections: 'Разделы',
    topicsLead: 'Индексные страницы, где собраны фетвы по каждой теме, — ссылки на целые разделы, а не на отдельные фетвы.',
    mutunLead: 'Аудио- и письменные разъяснения учёных к основным текстам по акыде и хадису.',
    audio: 'Аудио', book: 'Книга', ourLesson: 'Наш урок по этому тексту', ourPage: 'Эта книга на нашем сайте',
    noteTitle: 'Примечание', note: 'Эта страница — только каталог. Тексты фетв и права на них принадлежат соответствующим учёным и сайтам; мы их не изменяем и не копируем. Каждая ссылка проверена в указанную ниже дату; если адрес изменился, сообщите нам.',
    external: 'открывается в новой вкладке', results: 'результатов',
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  },
  ar: {
    eyebrow: 'مصادر العلم', title: 'الفتاوى ومصادر العلم',
    lead: 'المواقع الرسمية لعلماء السلف، وفهرس موضوعي للفتاوى، وأداة للبحث عن درجة الحديث، وشروح المتون — في مكان واحد.',
    how: 'ليس هنا فتاوى من عندنا: الأجوبة لأصحابها من أهل العلم، والروابط تفتح المواقع الخارجية في لسان جديد.',
    statSources: 'مصدرًا', statTopics: 'موضوعًا', statLinks: 'رابطًا موثَّقًا', verified: 'تاريخ التحقق من الروابط',
    search: 'ابحث عن مصدر أو موضوع أو كتاب...', clear: 'مسح البحث', all: 'الكل',
    langFilter: 'التصفية بلغة الموقع', topicFilter: 'التصفية بالموضوع', langLabel: 'اللغة', topicLabel: 'الموضوع',
    reset: 'إعادة ضبط التصفية', none: 'لا توجد نتائج مطابقة.',
    jump: 'الأقسام', secChecker: 'البحث عن درجة الحديث', secSources: 'المصادر الرسمية', secTopics: 'الفهرس الموضوعي', secMutun: 'شروح المتون',
    checkerLead: 'اكتب نص الحديث وافتحه في قاعدة حديثية موثوقة، ويذهب البحث مباشرة إلى الموقع الذي تختاره.',
    checkerLabel: 'نص الحديث', checkerPh: 'مثال: إنما الأعمال بالنيات', checkerHint: 'للحصول على أدق نتيجة اكتب جزءًا من النص العربي.',
    open: 'فتح', openIn: 'ابحث', emptyQ: 'اكتب النص أولًا',
    gradesTitle: 'كيف تقرأ درجة الحديث', gradesLead: 'تذكر القواعد الحديثية حكم المحدِّث عند كل رواية، وأشهر الدرجات:',
    ruling: 'حكمه', mustalah: 'للمزيد: مبادئ علم مصطلح الحديث (درس)',
    sourcesLead: 'مواقع العلماء أنفسهم، أو الجهات الرسمية التي تنشر فتاواهم.',
    kinds: { official: 'موقع رسمي', qa: 'سؤال وجواب', library: 'مكتبة', scholar: 'موقع عالم' },
    visit: 'زيارة الموقع', versions: 'نسخ اللغات', sections: 'الأقسام',
    topicsLead: 'صفحات الفهارس التي تجمع الفتاوى في كل موضوع — روابط إلى الأبواب كاملة لا إلى فتاوى مفردة.',
    mutunLead: 'شروح صوتية ومكتوبة لأهل العلم على متون العقيدة والحديث.',
    audio: 'صوتي', book: 'كتاب', ourLesson: 'درسنا في هذا المتن', ourPage: 'هذا الكتاب في موقعنا',
    noteTitle: 'تنبيه', note: 'هذه الصفحة فهرس فقط، ونصوص الفتاوى وحقوقها لأصحابها من العلماء والمواقع، ولا نغيّرها ولا ننقلها. تم التحقق من كل رابط في التاريخ المذكور أدناه، فإن تغيّر عنوان فأخبرنا.',
    external: 'يفتح في لسان جديد', results: 'نتيجة',
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  },
  tr: {
    eyebrow: 'İlim kaynakları', title: 'Fetvalar ve ilim kaynakları',
    lead: 'Selef âlimlerinin resmî siteleri, konulara göre fetva kataloğu, hadis kontrol aracı ve temel metinlerin şerhleri — tek yerde.',
    how: 'Burada bizim fetvamız yoktur: cevaplar ilgili âlimlere aittir, bağlantılar dış siteyi yeni sekmede açar.',
    statSources: 'kaynak', statTopics: 'konu', statLinks: 'kontrol edilmiş bağlantı', verified: 'Bağlantılar kontrol edildi',
    search: 'Kaynak, konu veya kitap ara...', clear: 'Aramayı temizle', all: 'Hepsi',
    langFilter: 'Site diline göre filtre', topicFilter: 'Konuya göre filtre', langLabel: 'Dil', topicLabel: 'Konu',
    reset: 'Filtreyi sıfırla', none: 'Bu filtreye uyan bir şey bulunamadı.',
    jump: 'Bölümler', secChecker: 'Hadis kontrolü', secSources: 'Resmî kaynaklar', secTopics: 'Konu kataloğu', secMutun: 'Metin şerhleri',
    checkerLead: 'Hadisin metnini yazın ve güvenilir bir hadis veri tabanında açın. Sorgu doğrudan seçtiğiniz siteye gider.',
    checkerLabel: 'Hadis metni', checkerPh: 'Örn.: إنما الأعمال بالنيات', checkerHint: 'En doğru sonuç için Arapça metnin bir kısmını yazın.',
    open: 'Aç', openIn: 'Ara', emptyQ: 'Önce metin yazın',
    gradesTitle: 'Derece nasıl okunur', gradesLead: 'Hadis veri tabanları her rivayetin yanında muhaddisin hükmünü gösterir. Temel dereceler:',
    ruling: 'Hükmü', mustalah: 'Ayrıntılı: hadis usulünün temelleri (ders)',
    sourcesLead: 'Âlimlerin kendi siteleri veya fetvalarını yayımlayan resmî kurumların siteleri.',
    kinds: { official: 'Resmî site', qa: 'Soru-cevap', library: 'Kütüphane', scholar: 'Âlimin sitesi' },
    visit: 'Siteye git', versions: 'Dil sürümleri', sections: 'Bölümler',
    topicsLead: 'Her konudaki fetvaların toplandığı dizin sayfaları — tek bir fetvaya değil, bütün bölüme bağlantı.',
    mutunLead: 'Temel akide ve hadis metinlerinin âlimler tarafından sesli ve yazılı şerhleri.',
    audio: 'Ses', book: 'Kitap', ourLesson: 'Sitemizde bu metnin dersi', ourPage: 'Bu kitap sitemizde',
    noteTitle: 'Not', note: 'Bu sayfa yalnızca bir katalogdur. Fetvaların metni ve hakları ilgili âlimlere ve sitelere aittir; biz onları değiştirmiyor ve kopyalamıyoruz. Her bağlantı aşağıdaki tarihte kontrol edildi; bir adres değiştiyse lütfen bize bildirin.',
    external: 'yeni sekmede açılır', results: 'sonuç',
    months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  },
}

const pick = (o, lang) => (o && (o[lang] || o.en)) || ''
// Kənar URL-lərdə ərəb hərfləri və boşluq var — href üçün düzgün kodlaşdır
const safeHref = (u) => { try { return encodeURI(decodeURI(u)) } catch { return u } }
const norm = (s) => String(s || '').toLocaleLowerCase().normalize('NFKD').replace(/[ً-ٰٟ̀-ͯ]/g, '').replace(/[’‘'`]/g, '')
const blob = (...parts) => norm(parts.flatMap(p => (p && typeof p === 'object' ? Object.values(p) : [p])).join(' '))

function Ext({ href, children, className, title, label }) {
  return (
    <a className={className} href={safeHref(href)} target="_blank" rel="noopener noreferrer" title={title}>
      {children}<Icon name="external" size={13} className="fw-ext ui-flip-rtl" aria-hidden="true" />
      <span className="ui-sr-only"> ({label})</span>
    </a>
  )
}

export default function FatwaPage() {
  const { lang } = useLang()
  const T = L10N[lang] || L10N.en
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [fLang, setFLang] = useState('all')
  const [fTopic, setFTopic] = useState('all')
  const [hq, setHq] = useState('')

  const nq = norm(q.trim())
  const langOk = (l) => fLang === 'all' || l === fLang

  const sources = useMemo(() => SOURCES.filter(s => {
    const ls = Object.keys(s.urls || {})
    if (fLang !== 'all' && !ls.includes(fLang)) return false
    return !nq || blob(s.name, s.scholar, s.desc, s.host).includes(nq)
  }), [nq, fLang])

  const topics = useMemo(() => TOPICS
    .filter(t => fTopic === 'all' || t.id === fTopic)
    .map(t => ({ ...t, shown: t.links.filter(l => langOk(l[1])) }))
    .filter(t => t.shown.length && (!nq || blob(t.label, t.ar, ...t.shown.map(l => SOURCE_SHORT[l[0]])).includes(nq))),
  [nq, fLang, fTopic])

  const mutun = useMemo(() => COMMENTARIES
    .filter(c => fTopic === 'all' || c.topic === fTopic)
    .filter(() => fLang === 'all' || fLang === 'ar') // şərhlərin hamısı ərəbcədir
    .filter(c => !nq || blob(c.title, c.ar, c.author, ...c.links.map(l => l[1])).includes(nq)),
  [nq, fLang, fTopic])

  const linkCount = useMemo(() => {
    const s = new Set()
    SOURCES.forEach(x => { s.add(x.url); Object.values(x.urls || {}).forEach(u => s.add(u)); (x.extra || []).forEach(e => s.add(e.url)) })
    TOPICS.forEach(t => t.links.forEach(l => s.add(l[2])))
    COMMENTARIES.forEach(c => c.links.forEach(l => s.add(l[3])))
    return s.size
  }, [])

  const total = sources.length + topics.length + mutun.length
  const filtered = !!nq || fLang !== 'all' || fTopic !== 'all'
  const resetAll = () => { setQ(''); setFLang('all'); setFTopic('all') }
  const verifiedFmt = useMemo(() => {
    // Brauzerlərin bəzisində az lokalı yoxdur ("2026 M11 1") — ay adları əl ilə
    const [y, m, d] = VERIFIED_ON.split('-').map(Number)
    return `${d} ${T.months[m - 1]} ${y}`
  }, [T])

  const goInternal = (href) => (e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }
  const hqTrim = hq.trim()
  const onCheck = (e) => {
    e.preventDefault()
    if (!hqTrim) return
    window.open(HADITH_TOOLS[0].search(hqTrim, lang), '_blank', 'noopener,noreferrer')
  }
  const sourceMainUrl = (s) => (s.urls && (s.urls[lang] || s.urls[fLang])) || s.url
  const showChecker = !nq && (fLang === 'all' || ['ar', 'en'].includes(fLang)) && (fTopic === 'all' || fTopic === 'hadith')
  const mustalahHref = pathFor('learn', lang, 'mustalah')

  return (
    <div className="fw-page">
      <header className="ui-page-hero ui-page-hero--split fw-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{T.eyebrow}</span>
            <h1 className="ui-display">{T.title}</h1>
            {lang !== 'ar' && <p className="fw-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الفتاوى ومصادر العلم</p>}
            <p className="ui-lead">{T.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {T.how}</p>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card fw-hero__card">
              <ul className="ui-page-hero__stats fw-hero__stats">
                <li><b className="ui-num">{SOURCES.length}</b><span>{T.statSources}</span></li>
                <li><b className="ui-num">{TOPICS.length}</b><span>{T.statTopics}</span></li>
                <li><b className="ui-num">{linkCount}</b><span>{T.statLinks}</span></li>
              </ul>
              <p className="fw-hero__verified"><Icon name="check" size={14} /> {T.verified}: <time dateTime={VERIFIED_ON}>{verifiedFmt}</time></p>
              <nav className="fw-jump" aria-label={T.jump}>
                <a href="#fw-checker">{T.secChecker}</a>
                <a href="#fw-sources">{T.secSources}</a>
                <a href="#fw-topics">{T.secTopics}</a>
                <a href="#fw-mutun">{T.secMutun}</a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container fw-layout">
          {/* ── Yapışqan alət zolağı ── */}
          <div className="fw-toolbar">
            <div className="fw-toolbar__row">
              <div className="fw-search">
                <Icon name="search" size={19} className="fw-search__icon" />
                <input className="ui-input fw-search__input" type="search" aria-label={T.search} placeholder={T.search}
                  enterKeyHint="search" value={q} onChange={e => setQ(e.target.value)} />
                {q && (
                  <button type="button" className="ui-icon-btn fw-search__clear" onClick={() => setQ('')} aria-label={T.clear} title={T.clear}>
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
              <span className="fw-toolbar__count ui-num" aria-live="polite">{total} {T.results}</span>
            </div>
            <div className="fw-filters fw-filters--scroll" role="group" aria-label={T.langFilter}>
              <span className="fw-filters__label">{T.langLabel}</span>
              <button type="button" className="ui-chip" aria-pressed={fLang === 'all'} onClick={() => setFLang('all')}>{T.all}</button>
              {FATWA_LANGS.map(l => (
                <button key={l} type="button" className="ui-chip" aria-pressed={fLang === l} onClick={() => setFLang(l)} lang={l}>
                  {pick(LANG_LABELS[l], lang)}
                </button>
              ))}
            </div>
            <div className="fw-filters fw-filters--scroll" role="group" aria-label={T.topicFilter}>
              <span className="fw-filters__label">{T.topicLabel}</span>
              <button type="button" className="ui-chip" aria-pressed={fTopic === 'all'} onClick={() => setFTopic('all')}>{T.all}</button>
              {TOPICS.map(t => (
                <button key={t.id} type="button" className="ui-chip" aria-pressed={fTopic === t.id} onClick={() => setFTopic(t.id)}>
                  {pick(t.label, lang)}
                </button>
              ))}
            </div>
          </div>

          {/* ── 1) Hədis yoxlayıcısı ── */}
          {showChecker && (
            <section id="fw-checker" className="fw-section" aria-labelledby="fw-checker-h">
              <div className="ui-section-head">
                <span className="fw-step ui-num" aria-hidden="true">1</span>
                <h2 id="fw-checker-h" className="ui-title ui-title--sm">{T.secChecker}</h2>
                <p className="fw-section__lead">{T.checkerLead}</p>
              </div>
              <div className="fw-checker">
                <form className="ui-card fw-checker__form" onSubmit={onCheck} role="search">
                  <label htmlFor="fw-hq" className="fw-checker__label">{T.checkerLabel}</label>
                  <textarea id="fw-hq" className="ui-input fw-checker__input" rows={3} dir="auto" value={hq}
                    placeholder={T.checkerPh} onChange={e => setHq(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) onCheck(e) }} />
                  <p className="fw-checker__hint"><Icon name="info" size={14} /> {T.checkerHint}</p>
                  <div className="fw-checker__tools">
                    {HADITH_TOOLS.map((t, i) => (
                      <div key={t.id} className={`fw-tool${i === 0 ? ' is-primary' : ''}`}>
                        <div className="fw-tool__head">
                          <strong>{t.name}</strong>
                          <span className="fw-tool__ar ui-arabic" lang="ar" dir="rtl">{t.nameAr}</span>
                        </div>
                        <p className="fw-tool__desc">{pick(t.desc, lang)}</p>
                        <div className="fw-tool__actions">
                          {hqTrim ? (
                            <a className={`ui-btn ui-btn--sm ${i === 0 ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
                              href={t.search(hqTrim, lang)} target="_blank" rel="noopener noreferrer">
                              <Icon name="search" className="ui-btn__icon" /> {T.openIn}: {lang === 'ar' ? t.nameAr.split(' — ')[0] : t.name}
                              <span className="ui-sr-only"> ({T.external})</span>
                            </a>
                          ) : (
                            <button type="button" className={`ui-btn ui-btn--sm ${i === 0 ? 'ui-btn--primary' : 'ui-btn--secondary'}`} disabled title={T.emptyQ}>
                              <Icon name="search" className="ui-btn__icon" /> {T.openIn}: {lang === 'ar' ? t.nameAr.split(' — ')[0] : t.name}
                            </button>
                          )}
                          <Ext className="ui-link fw-tool__home" href={(t.homes && t.homes[lang]) || t.home} label={T.external}>{T.open}</Ext>
                        </div>
                      </div>
                    ))}
                  </div>
                </form>

                <div className="ui-card fw-grades" aria-labelledby="fw-grades-h">
                  <h3 id="fw-grades-h" className="fw-grades__title">{T.gradesTitle}</h3>
                  <p className="fw-grades__lead">{T.gradesLead}</p>
                  <ul className="fw-grades__list">
                    {GRADES.map(g => (
                      <li key={g.id} className={`fw-grade fw-grade--${g.tone}`}>
                        <div className="fw-grade__head">
                          {lang !== 'ar' && <span className="fw-grade__ar ui-arabic" lang="ar" dir="rtl">{g.ar}</span>}
                          <strong>{pick(g.label, lang)}</strong>
                        </div>
                        <p>{pick(g.def, lang)}</p>
                        <p className="fw-grade__rule"><b>{T.ruling}:</b> {pick(g.rule, lang)}</p>
                      </li>
                    ))}
                  </ul>
                  <ul className="fw-tips">
                    {GRADE_TIPS.map((tip, i) => <li key={i}>{pick(tip, lang)}</li>)}
                  </ul>
                  <a className="ui-link fw-internal" href={mustalahHref} onClick={goInternal(mustalahHref)}>
                    <Icon name="learn" size={16} /> {T.mustalah}
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* ── 2) Rəsmi mənbələr ── */}
          {sources.length > 0 && (
            <section id="fw-sources" className="fw-section" aria-labelledby="fw-sources-h">
              <div className="ui-section-head">
                <span className="fw-step ui-num" aria-hidden="true">2</span>
                <h2 id="fw-sources-h" className="ui-title ui-title--sm">{T.secSources}</h2>
                <p className="fw-section__lead">{T.sourcesLead}</p>
              </div>
              <ul className="fw-grid">
                {sources.map(s => {
                  const langs = Object.keys(s.urls || {})
                  return (
                    <li key={s.id} className="ui-card fw-src">
                      <div className="fw-src__top">
                        <span className={`ui-badge fw-kind fw-kind--${s.kind}`}>{T.kinds[s.kind]}</span>
                        <span className="fw-src__host" dir="ltr">{s.host}</span>
                      </div>
                      <h3 className="fw-src__name">{pick(s.name, lang)}</h3>
                      <p className="fw-src__scholar"><Icon name="scholars" size={15} /> {pick(s.scholar, lang)}</p>
                      <p className="fw-src__desc">{pick(s.desc, lang)}</p>
                      {s.extra?.length > 0 && (
                        <div className="fw-src__extra" aria-label={T.sections}>
                          {s.extra.map(e => (
                            <Ext key={e.url} className="fw-pill" href={e.url} label={T.external}>{pick(e.label, lang)}</Ext>
                          ))}
                        </div>
                      )}
                      <div className="fw-src__foot">
                        <div className="fw-langs" aria-label={T.versions}>
                          {langs.map(l => (
                            <Ext key={l} className={`fw-lang${fLang === l ? ' is-on' : ''}`} href={s.urls[l]} title={pick(LANG_LABELS[l], lang)} label={`${pick(LANG_LABELS[l], lang)}, ${T.external}`}>
                              {l.toUpperCase()}
                            </Ext>
                          ))}
                        </div>
                        <Ext className="ui-btn ui-btn--primary ui-btn--sm fw-src__visit" href={sourceMainUrl(s)} label={T.external}>{T.visit}</Ext>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* ── 3) Mövzu kataloqu ── */}
          {topics.length > 0 && (
            <section id="fw-topics" className="fw-section" aria-labelledby="fw-topics-h">
              <div className="ui-section-head">
                <span className="fw-step ui-num" aria-hidden="true">3</span>
                <h2 id="fw-topics-h" className="ui-title ui-title--sm">{T.secTopics}</h2>
                <p className="fw-section__lead">{T.topicsLead}</p>
              </div>
              <ul className="fw-grid fw-grid--topics">
                {topics.map(t => (
                  <li key={t.id} className="ui-card fw-topic">
                    <div className="fw-topic__head">
                      <span className="fw-topic__icon" aria-hidden="true"><Icon name={t.icon} size={20} /></span>
                      <h3 className="fw-topic__title">{pick(t.label, lang)}</h3>
                      {lang !== 'ar' && <span className="fw-topic__ar ui-arabic" lang="ar" dir="rtl">{t.ar}</span>}
                    </div>
                    <ul className="fw-topic__links">
                      {t.shown.map(([src, l, url, sub]) => (
                        <li key={url}>
                          <Ext className="fw-tlink" href={url} label={T.external}>
                            <span className="fw-tlink__src">{SOURCE_SHORT[src]}</span>
                            {sub && <span className="fw-tlink__sub ui-arabic" lang="ar" dir="rtl">{sub}</span>}
                            <span className="fw-tlink__lang">{l.toUpperCase()}</span>
                          </Ext>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── 4) Mətnlərin şərhləri ── */}
          {mutun.length > 0 && (
            <section id="fw-mutun" className="fw-section" aria-labelledby="fw-mutun-h">
              <div className="ui-section-head">
                <span className="fw-step ui-num" aria-hidden="true">4</span>
                <h2 id="fw-mutun-h" className="ui-title ui-title--sm">{T.secMutun}</h2>
                <p className="fw-section__lead">{T.mutunLead}</p>
              </div>
              <ul className="fw-grid">
                {mutun.map(c => {
                  const internal = c.lesson ? pathFor('learn', lang, c.lesson) : c.page ? pathFor(c.page, lang) : null
                  return (
                    <li key={c.id} className="ui-card fw-matn">
                      <div className="fw-matn__head">
                        <span className="fw-matn__ar ui-arabic" lang="ar" dir="rtl">{c.ar}</span>
                        <h3 className="fw-matn__title">{pick(c.title, lang)}</h3>
                        <p className="fw-matn__author">{pick(c.author, lang)}</p>
                      </div>
                      <ul className="fw-matn__links">
                        {c.links.map(([src, by, kind, url, note]) => (
                          <li key={url}>
                            <Ext className="fw-mlink" href={url} label={T.external}>
                              <Icon name={kind === 'audio' ? 'volume' : 'books'} size={16} className="fw-mlink__icon" />
                              <span className="fw-mlink__by">{pick(by, lang)}{note ? ` — ${pick(note, lang)}` : ''}</span>
                              <span className="fw-mlink__meta">{kind === 'audio' ? T.audio : T.book} · {SOURCE_SHORT[src]}</span>
                            </Ext>
                          </li>
                        ))}
                      </ul>
                      {internal && (
                        <a className="ui-btn ui-btn--secondary ui-btn--sm fw-matn__ours" href={internal} onClick={goInternal(internal)}>
                          <Icon name="learn" className="ui-btn__icon" /> {c.lesson ? T.ourLesson : T.ourPage}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {filtered && total === 0 && (
            <div className="ui-card ui-empty fw-empty" role="status">
              <Icon name="search" />
              <strong>{T.none}</strong>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={resetAll}>
                <Icon name="refresh" className="ui-btn__icon" /> {T.reset}
              </button>
            </div>
          )}

          <aside className="ui-card fw-note" aria-label={T.noteTitle}>
            <Icon name="alert" size={18} />
            <div>
              <strong>{T.noteTitle}</strong>
              <p>{T.note}</p>
              <p className="fw-note__date">{T.verified}: <time dateTime={VERIFIED_ON}>{verifiedFmt}</time></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
