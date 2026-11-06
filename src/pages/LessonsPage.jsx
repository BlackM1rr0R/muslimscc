import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { guessLang } from '../utils/textLang'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { parsePath, pathFor } from '../seo/routes'
import useActiveSection from '../hooks/useActiveSection'
import useChipIntoView from '../hooks/useChipIntoView'
import LessonBlocks, { pick } from '../components/lesson/LessonBlocks'
import ReportErrorButton from '../components/ReportErrorButton'
import ListenButton from '../components/ListenButton'
import { ProgressRing } from '../components/viz'
import { LESSONS, LESSON_CATS, CAT_BY_KEY, lessonBySlug } from '../data/lessons/index'
import { loadLesson } from '../data/lessons/load'
import '../styles/LessonsPage.css'
import StarButton from '../components/collect/StarButton'
import useStarred from '../components/collect/useStarred'
import { pickUi } from '../utils/uiText'

// ── v3.2: vəziyyət süzgəci (oxunmamış / oxunmuş / seçilmiş), əlfəcin, şrift ölçüsü (5 dil) ──
const LS32 = {
  az: { status: 'Vəziyyət', sAll: 'Hamısı', sUnread: 'Oxunmamış', sRead: 'Oxunmuş', sFav: 'Seçilmişlər', favAdd: 'Seçilmişlərə əlavə et', favNone: 'Hələ seçilmiş dərs yoxdur — kartdakı ulduza toxunun.', font: 'Şrift ölçüsü', smaller: 'Kiçilt', larger: 'Böyüt' },
  en: { status: 'Status', sAll: 'All', sUnread: 'Unread', sRead: 'Read', sFav: 'Saved', favAdd: 'Save lesson', favNone: 'No saved lessons yet — tap the star on a card.', font: 'Text size', smaller: 'Smaller', larger: 'Larger' },
  ru: { status: 'Статус', sAll: 'Все', sUnread: 'Непрочитанные', sRead: 'Прочитанные', sFav: 'Избранное', favAdd: 'В избранное', favNone: 'В избранном пока нет уроков — нажмите звёздочку на карточке.', font: 'Размер текста', smaller: 'Меньше', larger: 'Больше' },
  ar: { status: 'الحالة', sAll: 'الكل', sUnread: 'غير مقروءة', sRead: 'مقروءة', sFav: 'المحفوظة', favAdd: 'احفظ الدرس', favNone: 'لا توجد دروس محفوظة بعد — اضغط النجمة على البطاقة.', font: 'حجم الخط', smaller: 'تصغير', larger: 'تكبير' },
  tr: { status: 'Durum', sAll: 'Tümü', sUnread: 'Okunmamış', sRead: 'Okunmuş', sFav: 'Kaydedilenler', favAdd: 'Dersi kaydet', favNone: 'Henüz kaydedilen ders yok — karttaki yıldıza dokunun.', font: 'Yazı boyutu', smaller: 'Küçült', larger: 'Büyüt' },
}
// İkon dəstində olmayan adlar (məs. "heart") — yaxın ikon
const ICON_ALIAS = { heart: 'donate' }
const iconOf = (name) => ICON_ALIAS[name] || name
const FS_KEY = 'learn:fontScale'
const FS_STEPS = [0.94, 1, 1.08, 1.16, 1.26]

/* ══════════════════════════════════════════════════════════════════
   DƏRSLƏR — /learn (siyahı, kateqoriyalar üzrə) və /learn/<slug> (dərs)

   Məzmun src/data/lessons/*.js-dədir (format: README.md). Siyahı yalnız
   meta-nı (index.js) yükləyir; dərsin mətni açılanda ayrıca chunk kimi
   gəlir. Səhifə heç bir fakt əlavə etmir — hamısı məlumatdandır.

   Dizayn v3: kompakt hero + irəliləyiş halqası, "Haradan başlamalı?"
   addımları, kateqoriya kafelləri (filtr), dərs kartları; dərsdə oxu
   zolağı, nömrələnmiş mono bölmə başlıqları, "Oxudum" işarəsi.
   İrəliləyiş yalnız bu cihazda saxlanılır: localStorage "learn_progress_v1"
   = { read: [slug…], last: slug }.
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: {
    eyebrow: 'Hədis və bilik', title: 'Dərslər',
    subtitle: 'Əqidə, fiqh, əxlaq və elm üzrə qısa, dəlilli dərslər — Quran, səhih Sünnə və Sələf alimlərinin sözləri əsasında.',
    how: 'Mövzu seçin və ya axtarın. Hər dərsin oxu vaxtı göstərilir; sonunda «Oxudum» düyməsi irəliləyişinizi bu cihazda saxlayır.',
    search: 'Dərs axtar...', clear: 'Axtarışı təmizlə', all: 'Hamısı', noResults: 'Nəticə tapılmadı',
    read: 'Oxu', min: (n) => `${n} dəq`, contents: 'İçindəkilər', sources: 'Mənbələr', allLessons: 'Bütün dərslər',
    loading: 'Dərs yüklənir…', error: 'Dərs yüklənmədi. İnternet bağlantısını yoxlayıb yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    prev: 'Əvvəlki dərs', next: 'Növbəti dərs', sameCat: 'Bu bölmədən', count: (n) => `${n} dərs`, by: 'Əsas mənbə',
    share: 'Paylaş', copied: 'Keçid kopyalandı', copyFail: 'Keçidi kopyalamaq alınmadı',
    statLessons: 'dərs', statCats: 'bölmə', statHours: 'saat oxu', hours: (n) => `~${n}`,
    progress: 'İrəliləyişiniz', progressSub: (r, t) => `⁦${r} / ${t}⁩ dərs oxunub`, progressEmpty: 'Hələ heç bir dərs oxunmayıb — aşağıdakı yoldan başlayın.',
    cont: 'Davam et', startEyebrow: 'Haradan başlamalı?', startTitle: 'Əqidədən başlayın',
    startLead: 'Təklif etdiyimiz ardıcıllıq: qısa risalələrdən daha genişinə. Hər addım ayrıca dərsdir.',
    catalogEyebrow: 'Kataloq', catalogTitle: 'Bütün dərslər', catalogLead: 'Bölmə seçin — siyahı süzülür. Oxunmuş dərslər işarələnir.',
    cats: 'Bölmələr', isRead: 'Oxunub', sections: (n) => `${n} bölmə`,
    markRead: 'Oxudum', markedRead: 'Oxunub — geri al', doneTitle: 'Dərsi bitirdiniz?', doneText: 'İşarələyin — irəliləyiş «Dərslər» səhifəsində görünəcək (yalnız bu cihazda).',
    readingProgress: 'Oxu irəliləyişi',
  },
  en: {
    eyebrow: 'Hadith & knowledge', title: 'Lessons',
    subtitle: 'Short lessons with evidence on creed, fiqh, character and knowledge — based on the Quran, the authentic Sunnah and the words of the scholars of the Salaf.',
    how: 'Pick a topic or search. Each lesson shows its reading time; the “I’ve read it” button at the end saves your progress on this device.',
    search: 'Search lessons...', clear: 'Clear search', all: 'All', noResults: 'No results found',
    read: 'Read', min: (n) => `${n} min`, contents: 'Contents', sources: 'Sources', allLessons: 'All lessons',
    loading: 'Loading the lesson…', error: 'The lesson could not be loaded. Check your connection and try again.', retry: 'Try again',
    prev: 'Previous lesson', next: 'Next lesson', sameCat: 'From this section', count: (n) => `${n} ${n === 1 ? 'lesson' : 'lessons'}`, by: 'Main source',
    share: 'Share', copied: 'Link copied', copyFail: 'Could not copy the link',
    statLessons: 'lessons', statCats: 'sections', statHours: 'hours of reading', hours: (n) => `~${n}`,
    progress: 'Your progress', progressSub: (r, t) => `⁦${r} / ${t}⁩ lessons read`, progressEmpty: 'No lessons read yet — start with the path below.',
    cont: 'Continue', startEyebrow: 'Where to start?', startTitle: 'Begin with creed',
    startLead: 'Our suggested order: from the short treatises to the longer ones. Each step is a separate lesson.',
    catalogEyebrow: 'Catalogue', catalogTitle: 'All lessons', catalogLead: 'Choose a section to filter the list. Lessons you have read are marked.',
    cats: 'Sections', isRead: 'Read', sections: (n) => `${n} ${n === 1 ? 'section' : 'sections'}`,
    markRead: 'I’ve read it', markedRead: 'Read — undo', doneTitle: 'Finished the lesson?', doneText: 'Mark it — your progress will appear on the Lessons page (on this device only).',
    readingProgress: 'Reading progress',
  },
  ru: {
    eyebrow: 'Хадисы и знание', title: 'Уроки',
    subtitle: 'Краткие уроки с доказательствами по вероубеждению, фикху, нравам и знанию — на основе Корана, достоверной Сунны и слов учёных саляфа.',
    how: 'Выберите тему или воспользуйтесь поиском. У каждого урока указано время чтения; кнопка «Прочитано» в конце сохраняет прогресс на этом устройстве.',
    search: 'Поиск уроков...', clear: 'Очистить поиск', all: 'Все', noResults: 'Результаты не найдены',
    read: 'Читать', min: (n) => `${n} мин`, contents: 'Содержание', sources: 'Источники', allLessons: 'Все уроки',
    loading: 'Урок загружается…', error: 'Не удалось загрузить урок. Проверьте подключение и повторите попытку.', retry: 'Повторить',
    prev: 'Предыдущий урок', next: 'Следующий урок', sameCat: 'Из этого раздела', count: (n) => `${n} ${ruPlural(n, 'урок', 'урока', 'уроков')}`, by: 'Основной источник',
    share: 'Поделиться', copied: 'Ссылка скопирована', copyFail: 'Не удалось скопировать ссылку',
    statLessons: 'уроков', statCats: 'разделов', statHours: 'часов чтения', hours: (n) => `~${n}`,
    progress: 'Ваш прогресс', progressSub: (r, t) => `Прочитано ${r} из ${t}`, progressEmpty: 'Пока ничего не прочитано — начните с пути ниже.',
    cont: 'Продолжить', startEyebrow: 'С чего начать?', startTitle: 'Начните с вероубеждения',
    startLead: 'Предлагаемый порядок: от кратких трактатов к более объёмным. Каждый шаг — отдельный урок.',
    catalogEyebrow: 'Каталог', catalogTitle: 'Все уроки', catalogLead: 'Выберите раздел — список отфильтруется. Прочитанные уроки отмечены.',
    cats: 'Разделы', isRead: 'Прочитано', sections: (n) => `${n} ${ruPlural(n, 'раздел', 'раздела', 'разделов')}`,
    markRead: 'Прочитано', markedRead: 'Прочитано — отменить', doneTitle: 'Закончили урок?', doneText: 'Отметьте его — прогресс появится на странице «Уроки» (только на этом устройстве).',
    readingProgress: 'Прогресс чтения',
  },
  ar: {
    eyebrow: 'الحديث والعلم', title: 'الدروس',
    subtitle: 'دروس مختصرة بالأدلة في العقيدة والفقه والأخلاق والعلم، من القرآن والسنة الصحيحة وكلام علماء السلف.',
    how: 'اختر موضوعًا أو ابحث. يظهر وقت القراءة لكل درس، وزر «قرأته» في آخره يحفظ تقدّمك على هذا الجهاز.',
    search: 'ابحث في الدروس...', clear: 'مسح البحث', all: 'الكل', noResults: 'لم يتم العثور على نتائج',
    read: 'اقرأ', min: (n) => `${n} د`, contents: 'المحتويات', sources: 'المصادر', allLessons: 'جميع الدروس',
    loading: 'جارٍ تحميل الدرس…', error: 'تعذّر تحميل الدرس. تحقّق من الاتصال وأعد المحاولة.', retry: 'أعد المحاولة',
    prev: 'الدرس السابق', next: 'الدرس التالي', sameCat: 'من هذا القسم', count: (n) => `${n} ${n >= 3 && n <= 10 ? 'دروس' : 'درسًا'}`, by: 'المصدر الأساسي',
    share: 'مشاركة', copied: 'تم نسخ الرابط', copyFail: 'تعذّر نسخ الرابط',
    statLessons: 'درسًا', statCats: 'أقسام', statHours: 'ساعات قراءة', hours: (n) => `~${n}`,
    progress: 'تقدّمك', progressSub: (r, t) => `قرأت ${r} من ${t}`, progressEmpty: 'لم تقرأ أي درس بعد — ابدأ بالطريق أدناه.',
    cont: 'تابع', startEyebrow: 'من أين أبدأ؟', startTitle: 'ابدأ بالعقيدة',
    startLead: 'الترتيب الذي نقترحه: من الرسائل المختصرة إلى الأطول. كل خطوة درس مستقل.',
    catalogEyebrow: 'الفهرس', catalogTitle: 'جميع الدروس', catalogLead: 'اختر قسمًا لتصفية القائمة. الدروس المقروءة معلَّمة.',
    cats: 'الأقسام', isRead: 'مقروء', sections: (n) => `${n} ${n >= 3 && n <= 10 ? 'أقسام' : 'قسمًا'}`,
    markRead: 'قرأته', markedRead: 'مقروء — تراجع', doneTitle: 'أنهيت الدرس؟', doneText: 'علِّمه مقروءًا — يظهر تقدّمك في صفحة الدروس (على هذا الجهاز فقط).',
    readingProgress: 'تقدّم القراءة',
  },
  tr: {
    eyebrow: 'Hadis ve ilim', title: 'Dersler',
    subtitle: 'Akide, fıkıh, ahlak ve ilim üzerine delilli kısa dersler — Kur’an, sahih Sünnet ve Selef âlimlerinin sözlerine göre.',
    how: 'Bir konu seçin veya arayın. Her dersin okuma süresi gösterilir; sondaki «Okudum» düğmesi ilerlemenizi bu cihazda saklar.',
    search: 'Ders ara...', clear: 'Aramayı temizle', all: 'Tümü', noResults: 'Sonuç bulunamadı',
    read: 'Oku', min: (n) => `${n} dk`, contents: 'İçindekiler', sources: 'Kaynaklar', allLessons: 'Tüm dersler',
    loading: 'Ders yükleniyor…', error: 'Ders yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar dene',
    prev: 'Önceki ders', next: 'Sonraki ders', sameCat: 'Bu bölümden', count: (n) => `${n} ders`, by: 'Ana kaynak',
    share: 'Paylaş', copied: 'Bağlantı kopyalandı', copyFail: 'Bağlantı kopyalanamadı',
    statLessons: 'ders', statCats: 'bölüm', statHours: 'saat okuma', hours: (n) => `~${n}`,
    progress: 'İlerlemeniz', progressSub: (r, t) => `⁦${r} / ${t}⁩ ders okundu`, progressEmpty: 'Henüz hiç ders okunmadı — aşağıdaki yoldan başlayın.',
    cont: 'Devam et', startEyebrow: 'Nereden başlamalı?', startTitle: 'Akideyle başlayın',
    startLead: 'Önerdiğimiz sıra: kısa risalelerden daha geniş olanlara. Her adım ayrı bir derstir.',
    catalogEyebrow: 'Katalog', catalogTitle: 'Tüm dersler', catalogLead: 'Bir bölüm seçin — liste süzülür. Okunan dersler işaretlenir.',
    cats: 'Bölümler', isRead: 'Okundu', sections: (n) => `${n} bölüm`,
    markRead: 'Okudum', markedRead: 'Okundu — geri al', doneTitle: 'Dersi bitirdiniz mi?', doneText: 'İşaretleyin — ilerlemeniz «Dersler» sayfasında görünür (yalnızca bu cihazda).',
    readingProgress: 'Okuma ilerlemesi',
  },
}

// "Haradan başlamalı?" — əqidə risalələri qısadan uzuna (hamısı saytda dərsdir)
const START_PATH = ['usul-ath-thalatha', 'al-qawaid-al-arba', 'nawaqid-al-islam', 'kitab-at-tawhid']

function ruPlural(n, one, few, many) {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}
const prefersReduced = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return true }
}

/* ── İrəliləyiş (yalnız bu cihaz) ── */
const PROGRESS_KEY = 'learn_progress_v1'
function readProgress() {
  try {
    const v = JSON.parse(localStorage.getItem(PROGRESS_KEY))
    return { read: Array.isArray(v?.read) ? v.read.filter(s => typeof s === 'string') : [], last: typeof v?.last === 'string' ? v.last : null }
  } catch { return { read: [], last: null } }
}
function useLessonProgress() {
  const [p, setP] = useState(readProgress)
  useEffect(() => {
    const onStorage = (e) => { if (e.key === PROGRESS_KEY) setP(readProgress()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const save = useCallback((fn) => setP(prev => {
    const next = fn(prev)
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
    return next
  }), [])
  const readSet = useMemo(() => new Set(p.read), [p.read])
  const toggleRead = useCallback((slug) => save(prev => ({
    ...prev, read: prev.read.includes(slug) ? prev.read.filter(s => s !== slug) : [...prev.read, slug],
  })), [save])
  const setLast = useCallback((slug) => save(prev => (prev.last === slug ? prev : { ...prev, last: slug })), [save])
  return { readSet, last: p.last, toggleRead, setLast }
}

export default function LessonsPage() {
  const { lang } = useLang()
  const L = pickUi(LABELS, lang, 'en')
  const location = useLocation()
  const routerNavigate = useNavigate()
  const { key: routeKey, param } = parsePath(location.pathname)
  const selected = routeKey === 'learn' && param ? lessonBySlug(param) : null
  const progress = useLessonProgress()

  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState('all')
  const X = pickUi(LS32, lang, 'en')
  const star = useStarred('learn:favs')

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(lang)
    return LESSONS.filter(l => {
      if (cat !== 'all' && l.cat !== cat) return false
      if (status === 'read' && !progress.readSet.has(l.slug)) return false
      if (status === 'unread' && progress.readSet.has(l.slug)) return false
      if (status === 'fav' && !star.list.includes(l.slug)) return false
      if (!q) return true
      return [pick(l.title, lang), pick(l.summary, lang), pick(l.author, lang), l.arTitle, l.title.en]
        .some(v => String(v || '').toLocaleLowerCase(lang).includes(q))
    })
  }, [search, cat, lang, status, progress.readSet, star.list])

  // Dərs yuxarıdan açılır, siyahıya qayıdanda əvvəlki yer
  const listY = useRef(0)
  const prevSel = useRef(null)
  useLayoutEffect(() => {
    const was = prevSel.current
    prevSel.current = selected
    if (selected && selected !== was) window.scrollTo(0, 0)
    else if (!selected && was) {
      const y = listY.current
      window.scrollTo(0, y)
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
  }, [selected])

  const open = (l, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    listY.current = window.scrollY
    routerNavigate(pathFor('learn', lang, l.slug), { state: { lsList: true } })
  }
  const goSibling = (l, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    routerNavigate(pathFor('learn', lang, l.slug), { replace: true, state: window.history.state?.usr ?? null })
  }
  const backToList = () => {
    if (window.history.state?.usr?.lsList) window.history.back()
    else routerNavigate(pathFor('learn', lang))
  }

  if (selected) {
    return <Lesson key={selected.slug} m={selected} L={L} lang={lang} onBack={backToList} onSibling={goSibling} progress={progress}
      starOn={star.has(selected.slug)} onStar={() => star.toggle(selected.slug)} X={X} />
  }

  const { readSet, last } = progress
  const counts = Object.fromEntries(LESSON_CATS.map(c => [c.key, LESSONS.filter(l => l.cat === c.key).length]))
  const readIn = Object.fromEntries(LESSON_CATS.map(c => [c.key, LESSONS.filter(l => l.cat === c.key && readSet.has(l.slug)).length]))
  const readTotal = LESSONS.filter(l => readSet.has(l.slug)).length
  const hours = Math.round(LESSONS.reduce((s, l) => s + (l.minutes || 5), 0) / 60)
  const lastLesson = last ? lessonBySlug(last) : null
  const path = START_PATH.map(lessonBySlug).filter(Boolean)
  const grouped = cat === 'all' && !search.trim() && status === 'all'

  const card = (l) => {
    const done = readSet.has(l.slug)
    return (
      <li key={l.slug} className="ls-cell">
        <StarButton className="ls-card-star" on={star.has(l.slug)} onToggle={() => star.toggle(l.slug)} label={`${X.favAdd}: ${pick(l.title, lang)}`} />
        <a className={`ui-card ui-card--interactive ls-card${done ? ' is-read' : ''}`} href={pathFor('learn', lang, l.slug)} onClick={(e) => open(l, e)}>
          <span className="ls-card__top">
            <span className="ui-icon-tile ui-icon-tile--sm"><Icon name={iconOf(l.icon) || CAT_BY_KEY[l.cat]?.icon || 'books'} /></span>
            {done
              ? <span className="ls-card__done"><Icon name="check" size={14} /> {L.isRead}</span>
              : <span className="ls-card__min ui-num"><Icon name="clock" size={14} /> {L.min(l.minutes || 5)}</span>}
          </span>
          <span className="ls-card__title">{pick(l.title, lang)}</span>
          <span className="ls-card__sum">{pick(l.summary, lang)}</span>
          <span className="ls-card__foot">
            <span className="ls-card__by">{pick(l.author, lang)}</span>
            <Icon name="arrow" size={16} className="ls-card__arrow ui-link__arrow ui-flip-rtl" />
          </span>
        </a>
      </li>
    )
  }

  return (
    <div className="ls-page ls-listing">
      <header className="ui-page-hero ui-page-hero--split ls-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{L.eyebrow}</span>
            <h1 className="ui-display">{L.title}</h1>
            <p className="ui-lead">{L.subtitle}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {L.how}</p>
            <ul className="ui-page-hero__stats">
              <li><b className="ui-num" data-count={LESSONS.length}>{LESSONS.length}</b><span>{L.statLessons}</span></li>
              <li><b className="ui-num" data-count={LESSON_CATS.length}>{LESSON_CATS.length}</b><span>{L.statCats}</span></li>
              <li><b className="ui-num"><bdi dir="ltr">{L.hours(hours)}</bdi></b><span>{L.statHours}</span></li>
            </ul>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card ls-progress" data-reveal="zoom">
              <ProgressRing value={readTotal} max={LESSONS.length} size={76} thickness={8}
                label={L.progress} sub={L.progressSub(readTotal, LESSONS.length)} />
              {lastLesson ? (
                <a className="ui-btn ui-btn--primary ui-btn--sm ls-progress__cta" href={pathFor('learn', lang, lastLesson.slug)} onClick={(e) => open(lastLesson, e)}>
                  <span className="ls-progress__cta-text">{L.cont}: {pick(lastLesson.title, lang)}</span>
                  <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
                </a>
              ) : readTotal === 0 && <p className="ls-progress__empty">{L.progressEmpty}</p>}
            </div>
          </div>
        </div>
      </header>

      {path.length > 0 && (
        <section className="ui-section ui-section--tight ls-start" aria-labelledby="ls-start-h">
          <div className="ui-container">
            <div className="ui-section-head" data-reveal>
              <span className="ui-eyebrow">{L.startEyebrow}</span>
              <h2 id="ls-start-h" className="ui-title ui-title--sm">{L.startTitle}</h2>
              <p className="ui-lead">{L.startLead}</p>
            </div>
            <ol className="ui-steps ui-steps--row ls-path" data-reveal="stagger-blur">
              {path.map((l, i) => (
                <li key={l.slug} className={`ui-step${readSet.has(l.slug) ? ' is-done' : ''}`}>
                  <span className="ui-step__n" aria-hidden="true">{readSet.has(l.slug) ? <Icon name="check" size={14} /> : i + 1}</span>
                  <div className="ui-step__body">
                    <h3 className="ui-step__title">
                      <a className="ls-path__link" href={pathFor('learn', lang, l.slug)} onClick={(e) => open(l, e)}>{pick(l.title, lang)}</a>
                    </h3>
                    <p className="ui-step__text ui-num">{L.min(l.minutes || 5)}{readSet.has(l.slug) ? ` · ${L.isRead}` : ''}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="ui-section ui-section--tight ls-catalog" aria-labelledby="ls-catalog-h">
        <div className="ui-container">
          <div className="ui-section-head ls-catalog__head" data-reveal>
            <span className="ui-eyebrow">{L.catalogEyebrow}</span>
            <h2 id="ls-catalog-h" className="ui-title ui-title--sm">{L.catalogTitle}</h2>
            <p className="ui-lead">{L.catalogLead}</p>
          </div>

          <div className="ls-toolbar">
            <div className="ls-search">
              <Icon name="search" size={19} className="ls-search__icon" />
              <input className="ui-input ls-search__input" type="search" aria-label={L.search} placeholder={L.search}
                enterKeyHint="search" value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button type="button" className="ui-icon-btn ls-search__clear" onClick={() => setSearch('')} aria-label={L.clear} title={L.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="ls-status">
            <div className="ui-segmented ls-status__seg" role="group" aria-label={X.status}>
              {[['all', X.sAll, LESSONS.length], ['unread', X.sUnread, LESSONS.length - readTotal], ['read', X.sRead, readTotal], ['fav', X.sFav, star.count]].map(([k, lbl, n]) => (
                <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(k)}>
                  {k === 'fav' && <Icon name="star" size={14} />}{lbl} <span className="ls-status__n ui-num">{n}</span>
                </button>
              ))}
            </div>
            <span className="ls-status__count ui-num" aria-live="polite">{L.count(filtered.length)}</span>
          </div>
          <div className="ls-cats" role="group" aria-label={L.cats}>
            <button type="button" className="ls-cat" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
              <span className="ls-cat__icon" aria-hidden="true"><Icon name="learn" size={18} /></span>
              <span className="ls-cat__body">
                <span className="ls-cat__label">{L.all}</span>
                <span className="ls-cat__meta ui-num">{L.count(LESSONS.length)}</span>
              </span>
            </button>
            {LESSON_CATS.filter(c => counts[c.key] > 0).map(c => (
              <button key={c.key} type="button" className="ls-cat" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}>
                <span className="ls-cat__icon" aria-hidden="true"><Icon name={c.icon} size={18} /></span>
                <span className="ls-cat__body">
                  <span className="ls-cat__label">{pick(c.label, lang)}</span>
                  <span className="ls-cat__meta ui-num">{readIn[c.key] > 0 ? <bdi dir="ltr">{readIn[c.key]} / {counts[c.key]}</bdi> : L.count(counts[c.key])}</span>
                </span>
                {readIn[c.key] > 0 && <span className="ls-cat__bar" aria-hidden="true" style={{ '--w': `${(readIn[c.key] / counts[c.key]) * 100}%` }} />}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="ui-card ui-card--sunken ls-empty">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="search" /></span>
              <p>{L.noResults}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setCat('all') }}>
                <Icon name="close" className="ui-btn__icon" /> {L.clear}
              </button>
            </div>
          ) : grouped ? (
            LESSON_CATS.map(c => {
              const items = filtered.filter(l => l.cat === c.key)
              if (!items.length) return null
              return (
                <section key={c.key} className="ls-group" aria-labelledby={`ls-cat-${c.key}`}>
                  <div className="ls-group__head" data-reveal>
                    <span className="ui-icon-tile ui-icon-tile--sm"><Icon name={c.icon} /></span>
                    <div>
                      <h3 id={`ls-cat-${c.key}`} className="ls-group__title">{pick(c.label, lang)} <span className="ls-group__n ui-num">{L.count(items.length)}</span></h3>
                      <p className="ls-group__desc">{pick(c.desc, lang)}</p>
                    </div>
                  </div>
                  <ul className="ls-grid" data-reveal="stagger">{items.map(card)}</ul>
                </section>
              )
            })
          ) : (
            <ul className="ls-grid" data-reveal="stagger" key={`${cat}|${search ? 'q' : ''}`}>{filtered.map(card)}</ul>
          )}
        </div>
      </section>
    </div>
  )
}

/* ── Oxu zolağı: məqalənin nə qədəri oxunub (yalnız transform; re-render yox) ── */
function ReadingBar({ targetRef, label }) {
  const barRef = useRef(null)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = targetRef.current
      const bar = barRef.current
      if (!el || !bar) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight * 0.6
      const frac = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0
      bar.style.transform = `scaleX(${frac})`
      bar.parentElement?.setAttribute('aria-valuenow', String(Math.round(frac * 100)))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [targetRef])
  return (
    <div className="ls-readbar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
      <span ref={barRef} className="ls-readbar__fill" />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   DƏRS — hero → içindəkilər (yuxarıda yapışqan çip zolağı) → bölmələr → "Oxudum" →
   mənbələr → əvvəlki/növbəti + eyni kateqoriyadan.
   ══════════════════════════════════════════════════════════════════ */
function Lesson({ m, L, lang, onBack, onSibling, progress, starOn, onStar, X = LS32.en }) {
  // Şrift ölçüsü — bütün dərslər üçün bir seçim (localStorage, try/catch)
  const [fs, setFsState] = useState(() => {
    try { const raw = localStorage.getItem(FS_KEY); const v = raw == null ? 1 : Number(raw); return Number.isInteger(v) && v >= 0 && v < FS_STEPS.length ? v : 1 } catch { return 1 }
  })
  const setFs = (v) => { setFsState(v); try { localStorage.setItem(FS_KEY, String(v)) } catch { /* yaddaş bağlıdır */ } }
  const [state, setState] = useState({ status: 'loading', data: null })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    const p = loadLesson(m.slug)
    if (!p) { setState({ status: 'error', data: null }); return }
    setState(s => (s.data ? s : { status: 'loading', data: null }))
    p.then(data => { if (live) setState({ status: 'ok', data }) })
      .catch(() => { if (live) setState({ status: 'error', data: null }) })
    return () => { live = false }
  }, [m.slug, attempt])

  const { readSet, toggleRead, setLast } = progress
  useEffect(() => { setLast(m.slug) }, [m.slug, setLast])
  const isRead = readSet.has(m.slug)

  const data = state.data
  const sections = useMemo(() => (data?.sections || []).map(s => ({ id: `ls-${s.id}`, label: pick(s.title, lang) })), [data, lang])
  const [active, setActive] = useActiveSection(sections.map(x => x.id), `${m.slug}|${lang}|${sections.length}`)
  const articleRef = useRef(null)
  const tocRef = useRef(null)
  useChipIntoView(tocRef, active)

  const inCat = LESSONS.filter(x => x.cat === m.cat)
  const idx = LESSONS.indexOf(m)
  const prev = idx > 0 ? LESSONS[idx - 1] : null
  const next = idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null
  const catMeta = CAT_BY_KEY[m.cat]

  const jump = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
    el.querySelector('h2')?.focus({ preventScroll: true })
  }

  const [toast, setToast] = useState(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const flash = (text, ok) => {
    timers.current.forEach(clearTimeout)
    setToast({ text, ok, leaving: false })
    timers.current = [
      setTimeout(() => setToast(t => t && { ...t, leaving: true }), 2400),
      setTimeout(() => setToast(null), prefersReduced() ? 2400 : 2600),
    ]
  }
  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: `${pick(m.title, lang)} — Muslims.cc`, url }); return } catch (err) {
        if (err && err.name === 'AbortError') return
      }
    }
    try { await navigator.clipboard.writeText(url); flash(L.copied, true) } catch { flash(L.copyFail, false) }
  }

  const siblingCard = (x, dir) => (
    <a className={`ui-card ui-card--interactive ls-pager__card ls-pager__card--${dir}`} href={pathFor('learn', lang, x.slug)} onClick={(e) => onSibling(x, e)}>
      <span className="ls-pager__dir">
        {dir === 'prev' ? <><Icon name="arrow" size={15} className="ls-back-ic" /> {L.prev}</> : <>{L.next} <Icon name="arrow" size={15} className="ui-flip-rtl" /></>}
      </span>
      <span className="ls-pager__name">{pick(x.title, lang)}</span>
    </a>
  )

  const readBtn = () => (
    <button type="button" className={`ui-btn ui-btn--sm ${isRead ? 'ui-btn--secondary' : 'ui-btn--primary'} ls-readbtn`}
      aria-pressed={isRead} onClick={() => toggleRead(m.slug)}>
      <Icon name="check" className="ui-btn__icon" /> {isRead ? L.markedRead : L.markRead}
    </button>
  )

  return (
    <div className="ls-page ls-lesson">
      <ReadingBar targetRef={articleRef} label={L.readingProgress} />
      <header className="ui-page-hero ls-lhero" data-ls-slug={m.slug}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <nav className="ui-page-hero__crumbs" aria-label={L.title}>
            <button type="button" className="ls-crumb-btn" onClick={onBack}>
              <Icon name="arrow" size={15} className="ls-back-ic" /> {L.allLessons}
            </button>
          </nav>
          <span className="ui-eyebrow">{pick(catMeta?.label, lang)}</span>
          <h1 className="ui-display ls-lhero__title">{pick(m.title, lang)}</h1>
          {lang !== 'ar' && m.arTitle && <p className="ls-lhero__ar ui-arabic" lang="ar" dir="rtl">{m.arTitle}</p>}
          <p className="ui-lead">{pick(m.summary, lang)}</p>
          <ul className="ls-lhero__meta">
            {m.author && <li><Icon name="books" size={15} /> <span><span className="ui-sr-only">{L.by}: </span>{pick(m.author, lang)}</span></li>}
            <li className="ui-num"><Icon name="clock" size={15} /> {L.min(m.minutes || 5)}</li>
            {sections.length > 0 && <li className="ui-num"><Icon name="list" size={15} /> {L.sections(sections.length)}</li>}
            {isRead && <li className="ls-lhero__read"><Icon name="check" size={15} /> {L.isRead}</li>}
          </ul>
          <div className="ui-page-hero__actions ls-lhero__actions">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={share}>
              <Icon name="share" className="ui-btn__icon" /> {L.share}
            </button>
            {onStar && <StarButton className="ls-lhero__star" on={starOn} onToggle={onStar} label={X.favAdd} />}
            <span className="ui-segmented ls-fs" role="group" aria-label={X.font}>
              <button type="button" onClick={() => setFs(Math.max(0, fs - 1))} disabled={fs === 0} aria-label={X.smaller} title={X.smaller}>A−</button>
              <button type="button" onClick={() => setFs(Math.min(FS_STEPS.length - 1, fs + 1))} disabled={fs === FS_STEPS.length - 1} aria-label={X.larger} title={X.larger}>A+</button>
            </span>
            {data && <ListenButton target=".ls-article" selector="h2, h3, p, li, blockquote" />}
          </div>
        </div>
      </header>

      <div className="ui-section ls-body">
        <div className="ui-container ls-layout">
          {sections.length > 1 && (
            <aside className="ls-toc">
              <nav aria-label={L.contents}>
                <p className="ls-toc__title">{L.contents}</p>
                <ol className="ls-toc__list" ref={tocRef}>
                  {sections.map((x, i) => (
                    <li key={x.id}>
                      <a href={`#${x.id}`} className="ls-toc__link" title={x.label} aria-current={active === x.id ? 'true' : undefined} onClick={(e) => jump(e, x.id)}>
                        <span className="ls-toc__n ui-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <span className="ls-toc__label">{x.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          )}

          <article className="ls-article" ref={articleRef} aria-busy={state.status === 'loading'} data-fs={fs !== 1 ? '' : undefined} style={{ '--ls-fs': FS_STEPS[fs] }}>
            {state.status === 'loading' && (
              <div className="ls-loading" role="status">
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '40%' }} />
                <span className="ui-skeleton ui-skeleton--text" />
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '85%' }} />
                <span className="ui-sr-only">{L.loading}</span>
              </div>
            )}
            {state.status === 'error' && (
              <div className="ui-card ui-card--sunken ls-empty" role="alert">
                <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="alert" /></span>
                <p>{L.error}</p>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAttempt(a => a + 1)}>
                  <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
                </button>
              </div>
            )}
            {/* Bölmə nömrəsi (01, 02 …) CSS sayğacı ilə — "Dinlə" onu oxumur */}
            {data && data.sections.map(s => (
              <section key={s.id} id={`ls-${s.id}`} className="ls-sec" aria-labelledby={`ls-${s.id}-h`}>
                <h2 id={`ls-${s.id}-h`} className="ls-sec__title" tabIndex={-1}>{pick(s.title, lang)}</h2>
                <LessonBlocks blocks={s.blocks} lang={lang} />
              </section>
            ))}
            {data?.sources?.length > 0 && (
              <section className="ls-sec ls-sources" aria-labelledby="ls-sources-h">
                <h2 id="ls-sources-h" className="ls-sec__title ls-sources__title" tabIndex={-1}>{L.sources}</h2>
                <ul className="ls-sources__list">
                  {data.sources.map((r, i) => (
                    <li key={i}>
                      <Icon name={r.url ? 'external' : 'books'} size={15} />
                      {r.url
                        ? <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto" lang={guessLang(r.label)}>{r.label}</a>
                        : <span dir="auto" lang={guessLang(r.label)}>{r.label}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data && (
              <div className="ls-report">
                <ReportErrorButton refText={`${pick(m.title, lang)} (/learn/${m.slug})`} kind="text" />
              </div>
            )}
          </article>
        </div>

        <div className="ui-container ls-after">
          {data && (
            <div className={`ls-done${isRead ? ' is-read' : ''}`}>
              <span className="ui-icon-tile" aria-hidden="true"><Icon name={isRead ? 'check' : 'learn'} /></span>
              <div className="ls-done__body">
                <p className="ls-done__title">{L.doneTitle}</p>
                <p className="ls-done__text">{L.doneText}</p>
              </div>
              {readBtn()}
            </div>
          )}
          <nav className="ls-pager" aria-label={L.title}>
            {prev ? siblingCard(prev, 'prev') : <span aria-hidden="true"></span>}
            {next ? siblingCard(next, 'next') : <span aria-hidden="true"></span>}
          </nav>
          {inCat.length > 1 && (
            <section className="ls-same" aria-labelledby="ls-same-h">
              <h2 id="ls-same-h" className="ls-same__title">{L.sameCat} <span className="ls-same__cat">· {pick(catMeta?.label, lang)}</span></h2>
              <ul className="ls-same__list">
                {inCat.filter(x => x !== m).map(x => (
                  <li key={x.slug}>
                    <a className="ls-same__item" href={pathFor('learn', lang, x.slug)} onClick={(e) => onSibling(x, e)}>
                      <Icon name={readSet.has(x.slug) ? 'check' : (iconOf(x.icon) || 'books')} size={16} />
                      <span>{pick(x.title, lang)}</span>
                      <span className="ls-same__min ui-num">{L.min(x.minutes || 5)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="ls-all">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onBack}>
              <Icon name="books" className="ui-btn__icon" /> {L.allLessons}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`ui-toast ls-toast${toast.leaving ? ' is-leaving' : ''}`} role="status" style={toast.ok ? undefined : { '--toast-accent': 'var(--bad)' }}>
          <span className="ui-toast__icon"><Icon name={toast.ok ? 'check' : 'alert'} /></span>
          <div className="ui-toast__body"><strong className="ui-toast__title">{toast.text}</strong></div>
        </div>
      )}
    </div>
  )
}
