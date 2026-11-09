import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { parsePath, pathFor } from '../seo/routes'
import useChipIntoView from '../hooks/useChipIntoView'
import useActiveSection from '../hooks/useActiveSection'
import { ChartFigure, vizColor } from '../components/viz'
import LifespanChart from '../components/media/LifespanChart'
import { ScholarsNumbers } from '../components/numbers/PeopleNumbers'
import RelatedLinks from '../components/media/RelatedLinks'
// Məlumat — src/data/scholars.js (prerender və SEO da oxuyur)
import { SCHOLARS, ERAS, ERA_LABEL, ERA_SHORT, ERA_SPAN, scholarBySlug, dateText, lifeSpan } from '../data/scholars'
import StarButton from '../components/collect/StarButton'
import useStarred from '../components/collect/useStarred'
import '../styles/ScholarsPage.css'
import { pickUi } from '../utils/uiText'

// ── v3.2: sıralama, seçilmişlər, təsadüfi alim (5 dil) ──
const C32 = {
  az: { sort: 'Sırala', sEra: 'Dövrlər üzrə', sAz: 'Əlifba', sDied: 'Vəfat ili', favs: 'Seçilmişlər', favAdd: 'Seçilmişlərə əlavə et', random: 'Təsadüfi alim', favNone: 'Hələ seçilmiş alim yoxdur — kartdakı ulduza toxunun.' },
  en: { sort: 'Sort', sEra: 'By era', sAz: 'A–Z', sDied: 'Year of death', favs: 'Saved', favAdd: 'Save', random: 'Random scholar', favNone: 'No saved scholars yet — tap the star on a card.' },
  ru: { sort: 'Сортировка', sEra: 'По эпохам', sAz: 'А–Я', sDied: 'Год смерти', favs: 'Избранное', favAdd: 'В избранное', random: 'Случайный учёный', favNone: 'В избранном пока никого нет — нажмите звёздочку на карточке.' },
  ar: { sort: 'الترتيب', sEra: 'حسب الحقبة', sAz: 'أبجديًا', sDied: 'سنة الوفاة', favs: 'المحفوظون', favAdd: 'احفظ', random: 'عالم عشوائي', favNone: 'لا يوجد محفوظون بعد — اضغط النجمة على البطاقة.' },
  tr: { sort: 'Sırala', sEra: 'Dönemlere göre', sAz: 'Alfabe', sDied: 'Vefat yılı', favs: 'Kaydedilenler', favAdd: 'Kaydet', random: 'Rastgele âlim', favNone: 'Henüz kaydedilen âlim yok — karttaki yıldıza dokunun.' },
}

/* ══════════════════════════════════════════════════════════════════
   SƏLƏF ALİMLƏRİ — /scholars (siyahı) və /scholars/<slug> (profil)

   ŞƏKİL YOXDUR: alimin fotoşəkli/portreti göstərilmir (sahibin qərarı —
   Sələf alimlərinin çoxu öz şəklinin yayılmasını istəməyib). Əvəzinə adın
   ərəbcə XƏTTATLIQ KARTI: Amiri şrifti, xatəm naxışlı həndəsi çərçivə,
   dövrə görə rəng (Sələf — zümrüd, orta əsr — qum-qızılı, yeni dövr və
   müasir — sakit neytral/zümrüd), yer nişanı.

   Profil quruluşu SahabePage-dəki "kitab səhifəsi"nə oxşayır (hero →
   Bir baxışda → Həyatı → … → Mənbələr → Əvvəlki/Növbəti), amma kod
   ondan asılı deyil. Mətnlərin hamısı məlumatdandır — burada heç bir
   fakt əlavə olunmur.
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: {
    how: 'Kartı seçin — alimin həyatı, müəllimləri, əsərləri və mənbələri açılır. Axtarış ada, ləqəbə və şəhərə görə işləyir.',
    statScholars: 'alim', statEras: 'dövr', statCenturies: 'əsr (hicri)', toTimeline: 'Zaman xətti',
    tlEyebrow: 'Bir baxışda', tlTitle: 'Alimlər zaman xəttində', tlLead: 'Hər zolaq bir alimin ömrüdür (doğum → vəfat, hicri il). Boşluqlar dövrlər arasındakı əsrlərdir.',
    tlFig: 'Alimlərin ömrü', tlSub: 'hicri il üzrə; rəng — dövr', tlNote: 'Solğun başlanğıc — doğum ili təxminidir; ucu açıq zolaq — alim sağdır. Tarixlər hər profilin mənbələrindəndir.',
    relEyebrow: 'Davamı', relTitle: 'Əlaqəli bölmələr',
    eyebrow: 'Hədis və bilik', title: 'Alimlər',
    subtitle: 'Əhli-sünnə vəl-cəmaat yolunda olan alimlər — tabiinlərdən müasir dövrədək: həyatı, müəllimləri, əsərləri və alimlərin onlar haqqında sözləri, mənbələri ilə.',
    search: 'Alim axtar...', clear: 'Axtarışı təmizlə', filter: 'Dövr', all: 'Hamısı', noResults: 'Nəticə tapılmadı',
    read: 'Həyatını oxu', allScholars: 'Bütün alimlər', share: 'Paylaş', copied: 'Keçid kopyalandı', copyFail: 'Keçidi kopyalamaq alınmadı',
    contents: 'İçindəkilər', glance: 'Bir baxışda', fullName: 'Tam adı', born: 'Doğulub', died: 'Vəfat edib',
    birthplace: 'Doğulduğu yer', city: 'Yaşadığı yer', era: 'Dövr', life: 'Həyatı', contribution: 'Elmə töhfəsi',
    people: 'Müəllimləri və tələbələri', teachers: 'Müəllimləri', students: 'Tələbələri', works: 'Əsas əsərləri',
    praise: 'Alimlər onun haqqında', note: 'Qeyd', sources: 'Mənbələr',
    sourcesNote: 'Bu səhifədəki məlumatların götürüldüyü kitab və saytlar.', prev: 'Əvvəlki alim', next: 'Növbəti alim',
    sameEra: 'Eyni dövrdən', count: (n) => `${n} alim`, noPhoto: 'Alimlərin şəkli göstərilmir — yalnız adının ərəbcə yazılışı.',
  },
  en: {
    how: 'Pick a card to open the scholar’s life, teachers, works and sources. Search works by name, title and city.',
    statScholars: 'scholars', statEras: 'eras', statCenturies: 'centuries (AH)', toTimeline: 'Timeline',
    tlEyebrow: 'At a glance', tlTitle: 'Scholars on a timeline', tlLead: 'Each bar is one scholar’s lifetime (birth → death, Hijri year). The gaps are the centuries between the eras.',
    tlFig: 'Lifetimes of the scholars', tlSub: 'by Hijri year; colour = era', tlNote: 'A faded start means the birth year is approximate; an open-ended bar means the scholar is alive. Dates come from each profile’s sources.',
    relEyebrow: 'Continue', relTitle: 'Related sections',
    eyebrow: 'Hadith & knowledge', title: 'Scholars',
    subtitle: 'Scholars upon the way of Ahl as-Sunnah wal-Jama‘ah — from the Tabi‘un to our time: their lives, teachers, works and what other scholars said about them, with sources.',
    search: 'Search scholars...', clear: 'Clear search', filter: 'Era', all: 'All', noResults: 'No results found',
    read: 'Read biography', allScholars: 'All scholars', share: 'Share', copied: 'Link copied', copyFail: 'Could not copy the link',
    contents: 'Contents', glance: 'At a glance', fullName: 'Full name', born: 'Born', died: 'Died',
    birthplace: 'Birthplace', city: 'Lived in', era: 'Era', life: 'Biography', contribution: 'Contribution to knowledge',
    people: 'Teachers and students', teachers: 'Teachers', students: 'Students', works: 'Major works',
    praise: 'What scholars said about him', note: 'Note', sources: 'Sources',
    sourcesNote: 'Books and websites from which the information on this page is taken.', prev: 'Previous scholar', next: 'Next scholar',
    sameEra: 'From the same era', count: (n) => `${n} ${n === 1 ? 'scholar' : 'scholars'}`, noPhoto: 'No pictures of the scholars are shown — only their names in Arabic script.',
  },
  ru: {
    how: 'Выберите карточку — откроются жизнь учёного, его учителя, труды и источники. Поиск работает по имени, прозвищу и городу.',
    statScholars: 'учёных', statEras: 'эпохи', statCenturies: 'веков (хиджры)', toTimeline: 'Шкала времени',
    tlEyebrow: 'Коротко', tlTitle: 'Учёные на шкале времени', tlLead: 'Каждая полоса — жизнь одного учёного (рождение → смерть, год хиджры). Пробелы — века между эпохами.',
    tlFig: 'Годы жизни учёных', tlSub: 'по годам хиджры; цвет — эпоха', tlNote: 'Бледное начало — год рождения приблизителен; открытый конец — учёный жив. Даты взяты из источников каждого профиля.',
    relEyebrow: 'Дальше', relTitle: 'Связанные разделы',
    eyebrow: 'Хадисы и знание', title: 'Учёные',
    subtitle: 'Учёные пути ахлю-сунна валь-джамаа — от табиинов до нашего времени: их жизнь, учителя, труды и слова других учёных о них, с источниками.',
    search: 'Поиск учёных...', clear: 'Очистить поиск', filter: 'Эпоха', all: 'Все', noResults: 'Результаты не найдены',
    read: 'Читать биографию', allScholars: 'Все учёные', share: 'Поделиться', copied: 'Ссылка скопирована', copyFail: 'Не удалось скопировать ссылку',
    contents: 'Содержание', glance: 'Коротко', fullName: 'Полное имя', born: 'Родился', died: 'Скончался',
    birthplace: 'Место рождения', city: 'Жил в', era: 'Эпоха', life: 'Биография', contribution: 'Вклад в науку',
    people: 'Учителя и ученики', teachers: 'Учителя', students: 'Ученики', works: 'Основные труды',
    praise: 'Учёные о нём', note: 'Примечание', sources: 'Источники',
    sourcesNote: 'Книги и сайты, из которых взяты сведения на этой странице.', prev: 'Предыдущий учёный', next: 'Следующий учёный',
    sameEra: 'Из той же эпохи', count: (n) => `${n} ${ruPlural(n, 'учёный', 'учёных', 'учёных')}`, noPhoto: 'Изображения учёных не показываются — только их имена арабским письмом.',
  },
  ar: {
    how: 'اختر بطاقة لتفتح سيرة العالم وشيوخه ومؤلفاته ومصادرها. يعمل البحث بالاسم واللقب والمدينة.',
    statScholars: 'عالمًا', statEras: 'حقب', statCenturies: 'قرنًا هجريًا', toTimeline: 'الخط الزمني',
    tlEyebrow: 'لمحة سريعة', tlTitle: 'العلماء على خط الزمن', tlLead: 'كل شريط عمرُ عالمٍ واحد (من المولد إلى الوفاة بالسنة الهجرية)، والفراغات هي القرون بين الحقب.',
    tlFig: 'أعمار العلماء', tlSub: 'بالسنة الهجرية؛ اللون = الحقبة', tlNote: 'البداية الباهتة: سنة المولد تقريبية؛ والشريط المفتوح الطرف: العالم حيّ. التواريخ من مصادر كل صفحة.',
    relEyebrow: 'للمتابعة', relTitle: 'أقسام ذات صلة',
    eyebrow: 'الحديث والعلم', title: 'العلماء',
    subtitle: 'علماء على طريقة أهل السنة والجماعة، من التابعين إلى عصرنا: سيرهم وشيوخهم ومؤلفاتهم وثناء العلماء عليهم، مع المصادر.',
    search: 'ابحث عن عالم...', clear: 'مسح البحث', filter: 'الحقبة', all: 'الكل', noResults: 'لم يتم العثور على نتائج',
    read: 'اقرأ السيرة', allScholars: 'جميع العلماء', share: 'مشاركة', copied: 'تم نسخ الرابط', copyFail: 'تعذّر نسخ الرابط',
    contents: 'المحتويات', glance: 'لمحة سريعة', fullName: 'الاسم الكامل', born: 'المولد', died: 'الوفاة',
    birthplace: 'مكان المولد', city: 'موطنه', era: 'الحقبة', life: 'السيرة', contribution: 'أثره في العلم',
    people: 'شيوخه وتلاميذه', teachers: 'شيوخه', students: 'تلاميذه', works: 'أبرز مؤلفاته',
    praise: 'ثناء العلماء عليه', note: 'تنبيه', sources: 'المصادر',
    sourcesNote: 'الكتب والمواقع التي أُخذت منها معلومات هذه الصفحة.', prev: 'العالم السابق', next: 'العالم التالي',
    sameEra: 'من الحقبة نفسها', count: (n) => arCount(n), noPhoto: 'لا تُعرض صور العلماء، وإنما أسماؤهم بالخط العربي.',
  },
  tr: {
    how: 'Bir kart seçin — âlimin hayatı, hocaları, eserleri ve kaynakları açılır. Arama ad, lakap ve şehre göre çalışır.',
    statScholars: 'âlim', statEras: 'dönem', statCenturies: 'asır (hicri)', toTimeline: 'Zaman çizelgesi',
    tlEyebrow: 'Bir bakışta', tlTitle: 'Âlimler zaman çizelgesinde', tlLead: 'Her çubuk bir âlimin ömrüdür (doğum → vefat, hicri yıl). Boşluklar dönemler arasındaki asırlardır.',
    tlFig: 'Âlimlerin ömrü', tlSub: 'hicri yıla göre; renk — dönem', tlNote: 'Soluk başlangıç — doğum yılı yaklaşıktır; ucu açık çubuk — âlim hayattadır. Tarihler her profilin kaynaklarındandır.',
    relEyebrow: 'Devamı', relTitle: 'İlgili bölümler',
    eyebrow: 'Hadis ve ilim', title: 'Âlimler',
    subtitle: 'Ehl-i sünnet ve’l-cemaat yolundaki âlimler — tâbiînden günümüze: hayatları, hocaları, eserleri ve diğer âlimlerin onlar hakkındaki sözleri, kaynaklarıyla.',
    search: 'Âlim ara...', clear: 'Aramayı temizle', filter: 'Dönem', all: 'Tümü', noResults: 'Sonuç bulunamadı',
    read: 'Hayatını oku', allScholars: 'Tüm âlimler', share: 'Paylaş', copied: 'Bağlantı kopyalandı', copyFail: 'Bağlantı kopyalanamadı',
    contents: 'İçindekiler', glance: 'Bir bakışta', fullName: 'Tam adı', born: 'Doğumu', died: 'Vefatı',
    birthplace: 'Doğum yeri', city: 'Yaşadığı yer', era: 'Dönem', life: 'Hayatı', contribution: 'İlme katkısı',
    people: 'Hocaları ve talebeleri', teachers: 'Hocaları', students: 'Talebeleri', works: 'Başlıca eserleri',
    praise: 'Âlimler onun hakkında', note: 'Not', sources: 'Kaynaklar',
    sourcesNote: 'Bu sayfadaki bilgilerin alındığı kitap ve siteler.', prev: 'Önceki âlim', next: 'Sonraki âlim',
    sameEra: 'Aynı dönemden', count: (n) => `${n} âlim`, noPhoto: 'Âlimlerin resmi gösterilmez — yalnızca adlarının Arapça yazılışı.',
  },
}

function ruPlural(n, one, few, many) {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}
function arCount(n) {
  if (n === 1) return 'عالم واحد'
  if (n === 2) return 'عالمان'
  if (n % 100 >= 3 && n % 100 <= 10) return `${n} علماء`
  return `${n} عالمًا`
}

// "Əlaqəli bölmələr" — məzmunu təkrarlamırıq, keçid veririk
const RELATED = [
  { page: 'sahaba', title: { az: 'Səhabələr', en: 'Companions', ru: 'Сахабы', ar: 'الصحابة', tr: 'Sahabeler' },
    text: { az: 'Alimlərin elmi götürdüyü ilk nəsil', en: 'The first generation the scholars learned from', ru: 'Первое поколение, у которого учились учёные', ar: 'الجيل الأول الذي أخذ عنه العلماء', tr: 'Âlimlerin ilmi aldığı ilk nesil' } },
  { page: 'history', title: { az: 'İslami tarix', en: 'Islamic history', ru: 'Исламская история', ar: 'التاريخ الإسلامي', tr: 'İslam tarihi' },
    text: { az: 'Alimlərin yaşadığı dövrlərin hadisələri', en: 'Events of the eras the scholars lived in', ru: 'События эпох, в которые жили учёные', ar: 'أحداث العصور التي عاش فيها العلماء', tr: 'Âlimlerin yaşadığı dönemlerin olayları' } },
  { page: 'nawawi40', title: { az: 'Nəvəvinin 40 hədisi', en: 'An-Nawawi’s 40 hadith', ru: '40 хадисов ан-Навави', ar: 'الأربعون النووية', tr: 'Nevevî’nin 40 hadisi' },
    text: { az: 'İmam Nəvəvinin məşhur toplusu — şərhi ilə', en: 'Imam an-Nawawi’s famous collection, with commentary', ru: 'Знаменитый сборник имама ан-Навави — с пояснением', ar: 'المجموعة المشهورة للإمام النووي مع الشرح', tr: 'İmam Nevevî’nin meşhur derlemesi — şerhiyle' } },
  { page: 'books', title: { az: 'Kitabxana', en: 'Library', ru: 'Библиотека', ar: 'المكتبة', tr: 'Kütüphane' },
    text: { az: 'Alimlərin əsərləri və tərcümələri', en: 'Works of the scholars and translations', ru: 'Труды учёных и переводы', ar: 'مؤلفات العلماء وترجماتها', tr: 'Âlimlerin eserleri ve tercümeleri' } },
]

// Dilə görə sahə (yoxdursa ingiliscə)
const pick = (obj, lang) => (obj && (pickUi(obj, lang, 'en'))) || ''
const prefersReduced = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return true }
}

/* ── Xəttatlıq kartı — adın ərəbcə yazılışı həndəsi çərçivədə ──
   Dekorativdir (aria-hidden): ad mətndə onsuz da var. Rəng dövrdən. */
const NameCard = ({ s, size = 'md' }) => (
  <span className={`sc-callig sc-callig--${size} sc-era--${s.era}`} aria-hidden="true">
    <span className="sc-callig__pattern" />
    <span className="sc-callig__frame">
      <span className="sc-callig__star sc-callig__star--s" />
      <span className="sc-callig__star sc-callig__star--e" />
      <span className="sc-callig__name" lang="ar" dir="rtl">{s.name.ar}</span>
    </span>
  </span>
)

const EraBadge = ({ era, lang }) => (
  <span className={`ui-badge sc-era-badge sc-era--${era}`}>{pick(ERA_SHORT[era], lang)}</span>
)

const Place = ({ s, lang }) => (
  <span className="sc-place"><Icon name="pin" size={14} /> {pick(s.city, lang)}</span>
)

export default function ScholarsPage() {
  const { lang } = useLang()
  const L = pickUi(LABELS, lang, 'en')
  const isAr = lang === 'ar'
  const location = useLocation()
  const routerNavigate = useNavigate()
  const { key: routeKey, param } = parsePath(location.pathname)
  const selected = routeKey === 'scholars' && param ? scholarBySlug(param) : null

  const [search, setSearch] = useState('')
  const [era, setEra] = useState('all')
  const [sort, setSort] = useState('era')
  const X = pickUi(C32, lang, 'en')
  const star = useStarred('scholars:favs')

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(lang)
    const list = SCHOLARS.filter(s => {
      if (era === 'fav') { if (!star.list.includes(s.slug)) return false }
      else if (era !== 'all' && s.era !== era) return false
      if (!q) return true
      const hay = [pick(s.name, lang), pick(s.fullName, lang), pick(s.title, lang), pick(s.city, lang), s.name.en, s.name.ar, s.fullName.ar]
      return hay.some(v => String(v || '').toLocaleLowerCase(lang).includes(q))
    })
    if (sort === 'az') {
      const coll = new Intl.Collator(lang === 'ru' ? 'ru' : lang === 'ar' ? 'ar' : lang === 'tr' ? 'tr' : lang === 'az' ? 'az' : 'en', { sensitivity: 'base' })
      return [...list].sort((a, b) => coll.compare(pick(a.name, lang), pick(b.name, lang)))
    }
    if (sort === 'died') {
      const y = (s) => s.died?.h ?? 99999
      return [...list].sort((a, b) => y(a) - y(b))
    }
    return list
  }, [search, era, lang, sort, star.list])

  /* ── Sürüşmə: profil yuxarıdan açılır, siyahıya qayıdanda əvvəlki yer ── */
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

  // Kart və qonşu linkləri <a href>-dir: adi klik SPA ilə, Ctrl/orta klik — yeni tabda
  const openProfile = (s, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    listY.current = window.scrollY
    routerNavigate(pathFor('scholars', lang, s.slug), { state: { scList: true } })
  }
  // Əvvəlki / növbəti / eyni dövrdən: girişi əvəz et — "geri" yenə siyahıya aparsın
  const goSibling = (s, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    routerNavigate(pathFor('scholars', lang, s.slug), { replace: true, state: window.history.state?.usr ?? null })
  }
  const backToList = () => {
    if (window.history.state?.usr?.scList) window.history.back()
    else routerNavigate(pathFor('scholars', lang))
  }
  const openRandom = (e) => {
    e?.preventDefault?.()
    const pool = filtered.length ? filtered : SCHOLARS
    listY.current = window.scrollY
    routerNavigate(pathFor('scholars', lang, pool[Math.floor(Math.random() * pool.length)].slug), { state: { scList: true } })
  }

  if (selected) {
    return <Profile key={selected.slug} s={selected} L={L} lang={lang} isAr={isAr} onBack={backToList} onSibling={goSibling}
      starOn={star.has(selected.slug)} onStar={() => star.toggle(selected.slug)} starLabel={X.favAdd} />
  }

  const counts = Object.fromEntries(ERAS.map(k => [k, SCHOLARS.filter(s => s.era === k).length]))
  // Filtr və axtarış yoxdursa — dövr üzrə qruplar (başlıqla); varsa — düz siyahı
  const grouped = era === 'all' && !search.trim() && sort === 'era'
  const card = (s) => (
    <li key={s.slug} className="sc-cell">
      <StarButton className="sc-card-star" on={star.has(s.slug)} onToggle={() => star.toggle(s.slug)} label={`${X.favAdd}: ${pick(s.name, lang)}`} />
      <a className="ui-card ui-card--interactive sc-card" href={pathFor('scholars', lang, s.slug)} onClick={(e) => openProfile(s, e)}>
        <NameCard s={s} />
        <span className="sc-card__body">
          <span className="sc-card__top"><EraBadge era={s.era} lang={lang} /> <span className="sc-card__years ui-num">{lifeSpan(s, lang)}</span></span>
          <span className="sc-card__name">{pick(s.name, lang)}</span>
          <span className="sc-card__title">{pick(s.title, lang)}</span>
          <span className="sc-card__foot">
            <Place s={s} lang={lang} />
            <span className="sc-card__read">{L.read} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" /></span>
          </span>
        </span>
      </a>
    </li>
  )

  return (
    <div className="sc-page sc-list">
      <header className="ui-page-hero sc-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          {!isAr && <p className="sc-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">علماء السلف</p>}
          <p className="ui-lead">{L.subtitle}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {L.how}</p>
          <ul className="ui-page-hero__stats">
            <li><b className="ui-num">{SCHOLARS.length}</b><span>{L.statScholars}</span></li>
            <li><b className="ui-num">{ERAS.length}</b><span>{L.statEras}</span></li>
            <li><b className="ui-num">15</b><span>{L.statCenturies}</span></li>
            <li className="sc-hero__jump"><a className="ui-link" href="#sc-timeline" onClick={(e) => { e.preventDefault(); document.getElementById('sc-timeline')?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' }) }}>
              <Icon name="history" size={16} /> {L.toTimeline} <Icon name="arrowDown" size={14} />
            </a></li>
          </ul>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container">
          <div className="sc-toolbar">
            <div className="sc-search">
              <Icon name="search" size={19} className="sc-search__icon" />
              <input
                className="ui-input sc-search__input"
                type="search"
                aria-label={L.search}
                placeholder={L.search}
                enterKeyHint="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="ui-icon-btn sc-search__clear" onClick={() => setSearch('')} aria-label={L.clear} title={L.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <div className="sc-chips" role="group" aria-label={L.filter}>
              <button type="button" className="ui-chip" aria-pressed={era === 'all'} onClick={() => setEra('all')}>
                {L.all} <span className="sc-chip__n ui-num">{SCHOLARS.length}</span>
              </button>
              {ERAS.filter(k => counts[k] > 0).map(k => (
                <button key={k} type="button" className="ui-chip" aria-pressed={era === k} onClick={() => setEra(k)}>
                  <span className={`sc-dot sc-era--${k}`} aria-hidden="true" /> {pick(ERA_SHORT[k], lang)} <span className="sc-chip__n ui-num">{counts[k]}</span>
                </button>
              ))}
              <button type="button" className="ui-chip sc-fav-chip" aria-pressed={era === 'fav'} onClick={() => setEra(era === 'fav' ? 'all' : 'fav')}>
                <Icon name="star" size={14} /> {X.favs} <span className="sc-chip__n ui-num">{star.count}</span>
              </button>
            </div>
          </div>
          <div className="sc-subbar">
            <div className="ui-segmented sc-sort" role="group" aria-label={X.sort}>
              {[['era', X.sEra], ['az', X.sAz], ['died', X.sDied]].map(([k, lbl]) => (
                <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{lbl}</button>
              ))}
            </div>
            <span className="sc-count ui-num" aria-live="polite">{filtered.length} / {SCHOLARS.length}</span>
            <a className="ui-btn ui-btn--secondary ui-btn--sm sc-random" href={pathFor('scholars', lang)} onClick={openRandom}>
              <Icon name="refresh" className="ui-btn__icon" /> {X.random}
            </a>
          </div>
          <p className="sc-photo-note"><Icon name="info" size={15} /> {L.noPhoto}</p>

          {filtered.length === 0 ? (
            <div className="ui-card ui-card--sunken sc-empty">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="search" /></span>
              <p>{era === 'fav' && !star.count ? X.favNone : L.noResults}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setEra('all') }}>
                <Icon name="close" className="ui-btn__icon" /> {L.clear}
              </button>
            </div>
          ) : grouped ? (
            ERAS.map(k => {
              const items = filtered.filter(s => s.era === k)
              if (!items.length) return null
              return (
                <section key={k} className="sc-group" aria-labelledby={`sc-era-${k}`}>
                  <div className="sc-group__head" data-reveal>
                    <span className={`sc-dot sc-dot--lg sc-era--${k}`} aria-hidden="true" />
                    <h2 id={`sc-era-${k}`} className="sc-group__title">{pick(ERA_LABEL[k], lang)}</h2>
                    <span className="sc-group__span">{pick(ERA_SPAN[k], lang)} · {L.count(items.length)}</span>
                  </div>
                  <ul className="sc-grid" data-reveal="stagger">{items.map(card)}</ul>
                </section>
              )
            })
          ) : (
            <ul className="sc-grid" data-reveal="stagger" key={`${era}|${search ? 'q' : ''}|${sort}`}>{filtered.map(card)}</ul>
          )}
        </div>
      </div>

      {/* Zaman xətti — hər alimin ömrü bir zolaqda (hicri il), rəng dövrdən */}
      <section id="sc-timeline" className="ui-section ui-section--alt sc-timeline" aria-labelledby="sc-timeline-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{L.tlEyebrow}</span>
            <h2 id="sc-timeline-h" className="ui-title">{L.tlTitle}</h2>
            <p className="ui-lead">{L.tlLead}</p>
          </div>
          <ChartFigure title={L.tlFig} sub={L.tlSub} note={L.tlNote}>
            <ul className="ui-legend sc-tl-legend">
              {ERAS.map((k, i) => (
                <li key={k}><span className="ui-swatch" style={{ '--swatch': vizColor(i + 1) }} aria-hidden="true" />{pick(ERA_SHORT[k], lang)} <b>{counts[k]}</b></li>
              ))}
            </ul>
            <LifespanChart
              label={L.tlFig}
              min={0} max={1450}
              ticks={[0, 250, 500, 750, 1000, 1250, 1450].map(v => ({ v, label: String(v) }))}
              rows={SCHOLARS.map(s => ({
                key: s.slug,
                name: pick(s.name, lang),
                sub: lifeSpan(s, lang),
                href: pathFor('scholars', lang, s.slug),
                onClick: (e) => openProfile(s, e),
                start: s.born?.h ?? (s.died ? s.died.h - 60 : null),
                end: s.died?.h ?? null,
                open: !s.died,
                approx: Boolean(s.born?.approx) || !s.born,
                tone: ERAS.indexOf(s.era) + 1,
              }))}
            />
          </ChartFigure>
        </div>
      </section>

      {/* v5.9: "Alimlər rəqəmlərlə" — viz v2 bento */}
      <ScholarsNumbers scholars={SCHOLARS} eras={ERAS} lang={lang} eraLabel={(k) => pick(ERA_SHORT[k], lang)}
        nameOf={(s) => pick(s.name, lang)} hrefOf={(s) => pathFor('scholars', lang, s.slug)} onOpen={openProfile} />

      <section className="ui-section ui-section--tight sc-related" aria-labelledby="sc-rel-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{L.relEyebrow}</span>
            <h2 id="sc-rel-h" className="ui-title ui-title--sm">{L.relTitle}</h2>
          </div>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PROFİL — hero (xəttatlıq kartı, ad, tam ad, ləqəb, ömür, yer, paylaş)
   → Bir baxışda → Həyatı → Elmə töhfəsi → Müəllim/tələbə → Əsərlər →
   Alimlərin sözü → Qeyd (varsa) → Mənbələr → Əvvəlki/Növbəti + eyni dövrdən.
   ══════════════════════════════════════════════════════════════════ */
function Profile({ s, L, lang, isAr, onBack, onSibling, starOn, onStar, starLabel }) {
  const n = pick(s.name, lang)
  const idx = SCHOLARS.indexOf(s)
  const prev = idx > 0 ? SCHOLARS[idx - 1] : null
  const next = idx < SCHOLARS.length - 1 ? SCHOLARS[idx + 1] : null
  const sameEra = SCHOLARS.filter(x => x.era === s.era && x !== s)
  const bio = pickUi(s.bio, lang, 'en') || []
  const teachers = s.teachers || []
  const students = s.students || []
  const works = s.works || []
  const praise = s.praise || []

  const sections = [
    { id: 'sc-glance', label: L.glance, icon: 'info' },
    { id: 'sc-life', label: L.life, icon: 'user' },
    { id: 'sc-contrib', label: L.contribution, icon: 'bulb' },
    teachers.length || students.length ? { id: 'sc-people', label: L.people, icon: 'jamaat' } : null,
    works.length ? { id: 'sc-works', label: L.works, icon: 'books' } : null,
    praise.length ? { id: 'sc-praise', label: L.praise, icon: 'quotes' } : null,
    s.note ? { id: 'sc-note', label: L.note, icon: 'alert' } : null,
    { id: 'sc-sources', label: L.sources, icon: 'link' },
  ].filter(Boolean)
  const [active, setActive] = useActiveSection(sections.map(x => x.id), `${s.slug}|${lang}`)
  const tocRef = useRef(null)
  useChipIntoView(tocRef, active)

  const jump = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
    el.querySelector('h2')?.focus({ preventScroll: true })
  }

  /* ── Paylaş: Web Share API; yoxdursa keçidi kopyala + sakit toast ── */
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
      try { await navigator.share({ title: `${n} — Muslims.cc`, url }); return } catch (err) {
        if (err && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      flash(L.copied, true)
    } catch {
      flash(L.copyFail, false)
    }
  }

  const glance = [
    { k: 'full', label: L.fullName, v: pick(s.fullName, lang), wide: true },
    { k: 'born', label: L.born, v: dateText(s.born, lang) },
    { k: 'died', label: L.died, v: dateText(s.died, lang) },
    { k: 'bp', label: L.birthplace, v: s.birthplace ? pick(s.birthplace, lang) : '' },
    { k: 'city', label: L.city, v: pick(s.city, lang) },
    { k: 'era', label: L.era, v: `${pick(ERA_LABEL[s.era], lang)} · ${pick(ERA_SPAN[s.era], lang)}`, wide: true },
  ].filter(r => r.v)

  const peopleList = (title, list) => (list.length > 0 && (
    <div className="sc-people__col">
      <h3 className="sc-people__title">{title}</h3>
      <ul className="sc-people__list">
        {list.map((p, i) => (
          <li key={i}>
            <span>{pick(p, lang)}</span>
            {!isAr && p.ar && <span className="sc-people__ar ui-arabic" lang="ar" dir="rtl">{p.ar}</span>}
          </li>
        ))}
      </ul>
    </div>
  ))

  const siblingCard = (x, dir) => (
    <a className={`ui-card ui-card--interactive sc-pager__card sc-pager__card--${dir}`} href={pathFor('scholars', lang, x.slug)} onClick={(e) => onSibling(x, e)}>
      <span className="sc-pager__dir">
        {dir === 'prev' ? <><Icon name="arrow" size={15} className="sc-back-ic" /> {L.prev}</> : <>{L.next} <Icon name="arrow" size={15} className="ui-flip-rtl" /></>}
      </span>
      <span className="sc-pager__who">
        <NameCard s={x} size="sm" />
        <span className="sc-pager__name">{pick(x.name, lang)}<span className="sc-pager__years ui-num">{lifeSpan(x, lang)}</span></span>
      </span>
    </a>
  )

  return (
    <div className="sc-page sc-profile">
      <header className="ui-page-hero sc-phero" data-sc-slug={s.slug}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <nav className="ui-page-hero__crumbs" aria-label={L.title}>
            <button type="button" className="sc-crumb-btn" onClick={onBack}>
              <Icon name="arrow" size={15} className="sc-back-ic" /> {L.allScholars}
            </button>
          </nav>
          <div className="sc-phero__grid">
            <NameCard s={s} size="lg" />
            <div className="sc-phero__text">
              <span className="sc-phero__eyebrow"><EraBadge era={s.era} lang={lang} /> <span className="ui-eyebrow">{pick(s.title, lang)}</span></span>
              <h1 className="ui-display sc-phero__name">{n}</h1>
              {!isAr && <p className="sc-phero__ar ui-arabic" lang="ar" dir="rtl">{s.fullName.ar}</p>}
              <p className="ui-lead sc-phero__lead">{pick(s.summary, lang)}</p>
              <div className="sc-phero__meta">
                <span className="sc-meta-chip ui-num"><Icon name="calendar" size={15} /> {lifeSpan(s, lang)}</span>
                <span className="sc-meta-chip"><Icon name="pin" size={15} /> {pick(s.city, lang)}</span>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={share}>
                  <Icon name="share" className="ui-btn__icon" /> {L.share}
                </button>
                {onStar && <StarButton on={starOn} onToggle={onStar} label={starLabel} />}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="ui-section sc-body">
        <div className="ui-container sc-layout">
          <aside className="sc-toc">
            <nav aria-label={L.contents}>
              <p className="sc-toc__title">{L.contents}</p>
              <ol className="sc-toc__list" ref={tocRef}>
                {sections.map(x => (
                  <li key={x.id}>
                    <a href={`#${x.id}`} className="sc-toc__link" aria-current={active === x.id ? 'true' : undefined} onClick={(e) => jump(e, x.id)}>
                      <Icon name={x.icon} size={16} /> <span>{x.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="sc-article">
            <section id="sc-glance" className="sc-sec ui-card sc-glance" aria-labelledby="sc-glance-h">
              <h2 id="sc-glance-h" className="sc-sec__title" tabIndex={-1}>{L.glance}</h2>
              <dl className="sc-glance__grid">
                {glance.map(r => (
                  <div key={r.k} className={`sc-glance__item${r.wide ? ' sc-glance__item--wide' : ''}`}>
                    <dt>{r.label}</dt>
                    <dd>{r.v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="sc-life" className="sc-sec" aria-labelledby="sc-life-h">
              <h2 id="sc-life-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.life}</h2>
              <div className="sc-prose">
                {bio.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star"></span></div>
            </section>

            <section id="sc-contrib" className="sc-sec" aria-labelledby="sc-contrib-h">
              <h2 id="sc-contrib-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.contribution}</h2>
              <p className="sc-contrib">{pick(s.contribution, lang)}</p>
            </section>

            {(teachers.length > 0 || students.length > 0) && (
              <section id="sc-people" className="sc-sec" aria-labelledby="sc-people-h">
                <h2 id="sc-people-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.people}</h2>
                <div className="sc-people">
                  {peopleList(L.teachers, teachers)}
                  {peopleList(L.students, students)}
                </div>
              </section>
            )}

            {works.length > 0 && (
              <section id="sc-works" className="sc-sec" aria-labelledby="sc-works-h">
                <h2 id="sc-works-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.works}</h2>
                <ol className="sc-works">
                  {works.map((w, i) => (
                    <li key={i} className="sc-works__item">
                      <Icon name="books" size={18} />
                      <span className="sc-works__text">
                        <span className="sc-works__name">{pick(w, lang)}</span>
                        {!isAr && w.ar && <span className="sc-works__ar ui-arabic" lang="ar" dir="rtl">{w.ar}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {praise.length > 0 && (
              <section id="sc-praise" className="sc-sec" aria-labelledby="sc-praise-h">
                <h2 id="sc-praise-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.praise}</h2>
                <div className="sc-quotes">
                  {praise.map((q, i) => (
                    <figure key={i} className="ui-quote sc-quote">
                      <blockquote>
                        <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{q.ar}</p>
                        {!isAr && <p className="ui-quote__text">{pick(q, lang)}</p>}
                      </blockquote>
                      <figcaption className="ui-quote__src">— {pick(q.by, lang)}, <cite>{pick(q.ref, lang)}</cite></figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {s.note && (
              <section id="sc-note" className="sc-sec ui-card sc-note" aria-labelledby="sc-note-h">
                <h2 id="sc-note-h" className="sc-sec__title" tabIndex={-1}><Icon name="alert" size={18} /> {L.note}</h2>
                <p>{pick(s.note, lang)}</p>
              </section>
            )}

            <section id="sc-sources" className="sc-sec ui-card ui-card--sunken sc-sources" aria-labelledby="sc-sources-h">
              <h2 id="sc-sources-h" className="sc-sec__title" tabIndex={-1}>{L.sources}</h2>
              <p className="sc-sources__note">{L.sourcesNote}</p>
              <ul className="sc-sources__list">
                {s.sources.map((r, i) => (
                  <li key={i}>
                    <Icon name="external" size={15} />
                    {/* Mənbə adı (kitab/sayt) olduğu kimi — dir="auto" ərəbcə adlar üçün */}
                    <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{r.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </div>

        <div className="ui-container sc-after">
          <nav className="sc-pager" aria-label={L.title}>
            {prev ? siblingCard(prev, 'prev') : <span aria-hidden="true"></span>}
            {next ? siblingCard(next, 'next') : <span aria-hidden="true"></span>}
          </nav>

          {sameEra.length > 0 && (
            <section className="sc-same" aria-labelledby="sc-same-h">
              <h2 id="sc-same-h" className="sc-same__title">{L.sameEra} <span className="sc-same__era">· {pick(ERA_LABEL[s.era], lang)}</span></h2>
              <ul className="sc-same__list">
                {sameEra.map(x => (
                  <li key={x.slug}>
                    <a className="ui-chip sc-same__chip" href={pathFor('scholars', lang, x.slug)} onClick={(e) => onSibling(x, e)}>
                      {pick(x.name, lang)}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="sc-all">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onBack}>
              <Icon name="scholars" className="ui-btn__icon" /> {L.allScholars}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`ui-toast sc-toast${toast.leaving ? ' is-leaving' : ''}`} role="status" style={toast.ok ? undefined : { '--toast-accent': 'var(--bad)' }}>
          <span className="ui-toast__icon"><Icon name={toast.ok ? 'check' : 'alert'} /></span>
          <div className="ui-toast__body"><strong className="ui-toast__title">{toast.text}</strong></div>
        </div>
      )}
    </div>
  )
}
