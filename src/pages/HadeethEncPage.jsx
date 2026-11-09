import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReaderDialog from '../components/reader/ReaderDialog'
import StarButton from '../components/collect/StarButton'
import { copyText, readJSON, shareOrCopy, writeJSON } from '../components/reader/share'
import {
  HE_LANGS, HE_ALL_LANGS, HE_SITE, HeError, cachedHadeeth, fetchCategories, fetchHadeeth, fetchHadeethList, hadeethUrl,
} from '../api/hadeethenc'
import '../styles/HadeethEncPage.css'
// Dizayn v6 (src/motion): hədis kartı → oxu pəncərəsi morph (layoutId), hero rəqəmləri sayğacla
import { m } from 'motion/react'
import { ExpandableGroup, useMorphId, morphId } from '../motion/ExpandableCard'
import { SPRING } from '../motion/presets'
import NumberTicker from '../motion/NumberTicker'
import { pickUi } from '../utils/uiText'
import { EXTRA_LANGS, dirOf as routeDir } from '../seo/routes'

/* ══════════════════════════════════════════════════════════════════
   HƏDİS ENSİKLOPEDİYASI — /hadith-encyclopedia
   Məlumat: HadeethEnc.com API v1 (src/api/hadeethenc.js), brauzerdən canlı.
   Bölmə ağacı (çiplər: Əqidə, Fiqh, Fəzilətlər …) → hədis kartları
   ("Daha çox" ilə səhifə-səhifə) → oxu pəncərəsi: ərəbcə mətn, tərcümə,
   dərəcə və mənbə (API-nin verdiyi kimi), şərh, faydalar, söz mənaları,
   HadeethEnc.com-dakı səhifəyə keçid; əvvəlki/növbəti, kopyala/paylaş,
   seçilmişlər (localStorage). Ünvan: /hadith-encyclopedia#id-5913.
   Mətn DƏYİŞDİRİLMİR və düz mətn kimi göstərilir (HTML kimi yox).
   Məzmun dili interfeys dilindən ayrıca seçilə bilər — tərcümələr hər
   dildə tam deyil (məs. az-da daha az hədis var).
   localStorage: "hadeethenc_clang_v1" (məzmun dili), "hadeethenc_favs_v1"
   (seçilmişlər: [{ id, title, lang }]).
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: {
    // lang-ok[ensiklopediyası]: Azərbaycan sözüdür (ensiklopediya)
    eyebrow: 'Hədis', title: 'Hədis ensiklopediyası',
    lead: 'Mövzulara bölünmüş səhih və həsən hədislər — ərəbcə mətn, tərcümə, dərəcə, mənbə, şərh və faydaları ilə.',
    how: 'Bölməni seçin, sonra karta toxunun — hədis tam şərhi ilə açılır. Ulduz ilə seçilmişlərə əlavə edin.',
    credit: 'Mənbə', creditNote: 'Mətnlər HadeethEnc.com-dan dəyişdirilmədən göstərilir.', apiVer: 'API v1, canlı',
    contentLang: 'Məzmun dili', partial: 'Hədislərin hamısı hələ bu dilə tərcümə olunmayıb. Tam siyahı üçün ərəb və ya ingilis dilini seçin.',
    otherLang: 'Məzmun interfeysdən fərqli dildədir.',
    sections: 'bölmə', subsections: 'alt bölmə', favsStat: 'seçilmiş',
    categories: 'Bölmələr', favs: 'Seçilmişlər', all: 'Hamısı', search: 'Yüklənmiş hədislərdə axtar...', clear: 'Axtarışı təmizlə',
    of: 'hədis', loaded: 'yüklənib', more: 'Daha çox göstər', loading: 'Yüklənir...', retry: 'Yenidən cəhd et',
    err: 'Məlumat yüklənmədi', errLead: 'HadeethEnc.com cavab vermədi. Bir az sonra yenidən cəhd edin.',
    offline: 'İnternet bağlantısı yoxdur', offlineLead: 'Bu bölmə məlumatı canlı yükləyir. Bağlantını yoxlayıb yenidən cəhd edin.',
    none: 'Heç nə tapılmadı.', noneLead: 'Axtarış yalnız yüklənmiş hədislərdə aparılır — «Daha çox göstər» ilə siyahını genişləndirin.',
    favNone: 'Seçilmiş hədis yoxdur', favNoneLead: 'Hədisi oxuyarkən ulduza toxunun — burada görünəcək (yalnız bu cihazda).',
    read: 'Oxu', open: 'Aç', close: 'Bağla', prev: 'Əvvəlki', next: 'Növbəti',
    grade: 'Dərəcəsi', attribution: 'Mənbəsi', explanation: 'Şərh', hints: 'Hədisin faydaları', words: 'Sözlərin mənası',
    arabic: 'Ərəbcə əsli', translation: 'Tərcümə',
    onSite: 'HadeethEnc.com-da aç', feedback: 'Tərcümədə səhv görsəniz, HadeethEnc.com-a bildirin.',
    copy: 'Kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    addFav: 'Seçilmişlərə əlavə et', removeFav: 'Seçilmişlərdən çıxar',
    notInLang: 'Bu hədis seçilmiş dildə hələ yoxdur', notInLangLead: 'Başqa dildə oxuyun:',
    keys: '← → — keçid, Esc — bağla', filterLabel: 'Bölməyə görə süzgəc', subLabel: 'Alt bölmələr',
  },
  en: {
    eyebrow: 'Hadith', title: 'Hadith Encyclopedia',
    lead: 'Authentic and good hadiths arranged by topic — with the Arabic text, translation, grade, source, explanation and benefits.',
    how: 'Pick a section, then tap a card to open the hadith with its full explanation. Use the star to save it to your favourites.',
    credit: 'Source', creditNote: 'Texts are shown unchanged from HadeethEnc.com.', apiVer: 'API v1, live',
    contentLang: 'Content language', partial: 'Not every hadith has been translated into this language yet. Choose Arabic or English for the full list.',
    otherLang: 'The content is in a different language from the interface.',
    sections: 'sections', subsections: 'subsections', favsStat: 'favourites',
    categories: 'Sections', favs: 'Favourites', all: 'All', search: 'Search the loaded hadiths...', clear: 'Clear search',
    of: 'hadiths', loaded: 'loaded', more: 'Show more', loading: 'Loading...', retry: 'Try again',
    err: 'Could not load the data', errLead: 'HadeethEnc.com did not respond. Please try again in a moment.',
    offline: 'You are offline', offlineLead: 'This section loads its data live. Check your connection and try again.',
    none: 'Nothing found.', noneLead: 'Search only covers the hadiths loaded so far — use “Show more” to extend the list.',
    favNone: 'No favourite hadiths yet', favNoneLead: 'Tap the star while reading a hadith and it will appear here (on this device only).',
    read: 'Read', open: 'Open', close: 'Close', prev: 'Previous', next: 'Next',
    grade: 'Grade', attribution: 'Reference', explanation: 'Explanation', hints: 'Benefits of the hadith', words: 'Word meanings',
    arabic: 'Arabic original', translation: 'Translation',
    onSite: 'Open on HadeethEnc.com', feedback: 'If you notice a mistake in the translation, please tell HadeethEnc.com.',
    copy: 'Copy', copied: 'Copied', share: 'Share',
    addFav: 'Add to favourites', removeFav: 'Remove from favourites',
    notInLang: 'This hadith is not yet available in the chosen language', notInLangLead: 'Read it in another language:',
    keys: '← → to move, Esc to close', filterLabel: 'Filter by section', subLabel: 'Subsections',
  },
  ru: {
    eyebrow: 'Хадисы', title: 'Энциклопедия хадисов',
    lead: 'Достоверные и хорошие хадисы по темам — с арабским текстом, переводом, степенью достоверности, источником, разъяснением и пользой.',
    how: 'Выберите раздел и нажмите на карточку — хадис откроется с полным разъяснением. Звёздочкой добавьте его в избранное.',
    credit: 'Источник', creditNote: 'Тексты приводятся с {src} без изменений.', apiVer: 'API v1, напрямую',
    contentLang: 'Язык материалов', partial: 'Пока не все хадисы переведены на этот язык. Для полного списка выберите арабский или английский.',
    otherLang: 'Материалы на другом языке, чем интерфейс.',
    sections: 'разделов', subsections: 'подразделов', favsStat: 'в избранном',
    categories: 'Разделы', favs: 'Избранное', all: 'Все', search: 'Поиск по загруженным хадисам...', clear: 'Очистить поиск',
    of: 'хадисов', loaded: 'загружено', more: 'Показать ещё', loading: 'Загрузка...', retry: 'Повторить',
    err: 'Не удалось загрузить данные', errLead: '{src} не ответил. Попробуйте ещё раз чуть позже.',
    offline: 'Нет подключения к интернету', offlineLead: 'Этот раздел загружает данные напрямую. Проверьте подключение и повторите.',
    none: 'Ничего не найдено.', noneLead: 'Поиск идёт только по уже загруженным хадисам — нажмите «Показать ещё», чтобы расширить список.',
    favNone: 'В избранном пока пусто', favNoneLead: 'Нажмите на звёздочку при чтении хадиса — он появится здесь (только на этом устройстве).',
    read: 'Читать', open: 'Открыть', close: 'Закрыть', prev: 'Предыдущий', next: 'Следующий',
    grade: 'Степень', attribution: 'Источник', explanation: 'Разъяснение', hints: 'Польза хадиса', words: 'Значения слов',
    arabic: 'Арабский оригинал', translation: 'Перевод',
    onSite: 'Открыть на {src}', feedback: 'Если заметите ошибку в переводе, сообщите {src}.',
    copy: 'Копировать', copied: 'Скопировано', share: 'Поделиться',
    addFav: 'Добавить в избранное', removeFav: 'Убрать из избранного',
    notInLang: 'Этого хадиса пока нет на выбранном языке', notInLangLead: 'Прочитайте на другом языке:',
    keys: '← → — переход, {esc} — закрыть', filterLabel: 'Фильтр по разделу', subLabel: 'Подразделы',
  },
  tr: {
    eyebrow: 'Hadis', title: 'Hadis Ansiklopedisi',
    lead: 'Konulara göre ayrılmış sahih ve hasen hadisler — Arapça metin, tercüme, derece, kaynak, şerh ve faydalarıyla.',
    how: 'Bir bölüm seçin, sonra bir karta dokunun — hadis tam şerhiyle açılır. Yıldızla favorilerinize ekleyin.',
    credit: 'Kaynak', creditNote: 'Metinler HadeethEnc.com’dan değiştirilmeden gösterilir.', apiVer: 'API v1, canlı',
    contentLang: 'İçerik dili', partial: 'Hadislerin hepsi henüz bu dile çevrilmedi. Tam liste için Arapça veya İngilizceyi seçin.',
    otherLang: 'İçerik, arayüzden farklı bir dilde.',
    sections: 'bölüm', subsections: 'alt bölüm', favsStat: 'favori',
    categories: 'Bölümler', favs: 'Favoriler', all: 'Tümü', search: 'Yüklenen hadislerde ara...', clear: 'Aramayı temizle',
    of: 'hadis', loaded: 'yüklendi', more: 'Daha fazla göster', loading: 'Yükleniyor...', retry: 'Tekrar dene',
    err: 'Veriler yüklenemedi', errLead: 'HadeethEnc.com yanıt vermedi. Biraz sonra tekrar deneyin.',
    offline: 'İnternet bağlantısı yok', offlineLead: 'Bu bölüm verileri canlı yükler. Bağlantınızı kontrol edip tekrar deneyin.',
    none: 'Bir şey bulunamadı.', noneLead: 'Arama yalnızca yüklenen hadislerde yapılır — listeyi «Daha fazla göster» ile genişletin.',
    favNone: 'Henüz favori hadis yok', favNoneLead: 'Hadisi okurken yıldıza dokunun — burada görünür (yalnızca bu cihazda).',
    read: 'Oku', open: 'Aç', close: 'Kapat', prev: 'Önceki', next: 'Sonraki',
    grade: 'Derecesi', attribution: 'Kaynağı', explanation: 'Şerh', hints: 'Hadisin faydaları', words: 'Kelimelerin anlamı',
    arabic: 'Arapça aslı', translation: 'Tercüme',
    onSite: 'HadeethEnc.com’da aç', feedback: 'Tercümede bir hata görürseniz HadeethEnc.com’a bildirin.',
    copy: 'Kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    addFav: 'Favorilere ekle', removeFav: 'Favorilerden çıkar',
    notInLang: 'Bu hadis seçilen dilde henüz yok', notInLangLead: 'Başka bir dilde okuyun:',
    keys: '← → geçiş, Esc kapat', filterLabel: 'Bölüme göre filtre', subLabel: 'Alt bölümler',
  },
  ar: {
    eyebrow: 'الحديث', title: 'موسوعة الأحاديث النبوية',
    lead: 'أحاديث صحيحة وحسنة مصنفة حسب الموضوعات، مع النص العربي والترجمة والدرجة والتخريج والشرح والفوائد.',
    how: 'اختر قسمًا ثم اضغط على البطاقة ليُفتح الحديث بشرحه كاملًا، وأضفه إلى المفضلة بالنجمة.',
    credit: 'المصدر', creditNote: 'تُعرض النصوص من موسوعة {src} دون أي تعديل.', apiVer: 'API v1، مباشرة',
    contentLang: 'لغة المحتوى', partial: 'لم تُترجم جميع الأحاديث إلى هذه اللغة بعد. اختر العربية أو الإنجليزية للقائمة الكاملة.',
    otherLang: 'المحتوى بلغة مختلفة عن لغة الواجهة.',
    sections: 'أقسام', subsections: 'قسمًا فرعيًا', favsStat: 'في المفضلة',
    categories: 'الأقسام', favs: 'المفضلة', all: 'الكل', search: 'ابحث في الأحاديث المحمَّلة...', clear: 'مسح البحث',
    of: 'حديثًا', loaded: 'محمَّلة', more: 'عرض المزيد', loading: 'جارٍ التحميل...', retry: 'أعد المحاولة',
    err: 'تعذّر تحميل البيانات', errLead: 'لم تستجب {src}. أعد المحاولة بعد قليل.',
    offline: 'لا يوجد اتصال بالإنترنت', offlineLead: 'يحمّل هذا القسم بياناته مباشرة. تحقق من الاتصال ثم أعد المحاولة.',
    none: 'لم يُعثر على شيء.', noneLead: 'البحث في الأحاديث المحمَّلة فقط، فاضغط «عرض المزيد» لتوسيع القائمة.',
    favNone: 'لا توجد أحاديث في المفضلة', favNoneLead: 'اضغط على النجمة أثناء قراءة الحديث ليظهر هنا (على هذا الجهاز فقط).',
    read: 'اقرأ', open: 'فتح', close: 'إغلاق', prev: 'السابق', next: 'التالي',
    grade: 'الدرجة', attribution: 'التخريج', explanation: 'الشرح', hints: 'من فوائد الحديث', words: 'معاني الكلمات',
    arabic: 'النص العربي', translation: 'الترجمة',
    onSite: 'افتح في {src}', feedback: 'إن لاحظت خطأ في الترجمة فأبلغ موسوعة {src}.',
    copy: 'نسخ', copied: 'تم النسخ', share: 'مشاركة',
    addFav: 'أضف إلى المفضلة', removeFav: 'أزل من المفضلة',
    notInLang: 'هذا الحديث غير متوفر باللغة المختارة بعد', notInLangLead: 'اقرأه بلغة أخرى:',
    keys: '← → للتنقل، {esc} للإغلاق', filterLabel: 'التصفية حسب القسم', subLabel: 'الأقسام الفرعية',
  },
}

// Məzmun dillərinin öz adları (dil seçicisində)
const LANG_NAMES = { az: 'Azərbaycanca', en: 'English', ru: 'Русский', tr: 'Türkçe', ar: 'العربية' }  // lang-ok: dillərin öz adları
// Əlavə dillərin öz adları (src/seo/langs.js)
for (const c of Object.keys(EXTRA_LANGS)) LANG_NAMES[c] = EXTRA_LANGS[c].name
const PER_PAGE = 24
const CLANG_KEY = 'hadeethenc_clang_v1'
const FAV_KEY = 'hadeethenc_favs_v1'
const FAV = 'fav'

function readFavs() {
  const v = readJSON(FAV_KEY, [])
  return Array.isArray(v) ? v.filter(f => f && /^\d+$/.test(String(f.id))).map(f => ({ id: String(f.id), title: String(f.title || ''), lang: HE_ALL_LANGS.includes(f.lang) ? f.lang : 'ar' })) : []
}
// ru/ar mətnlərində brend adı və klaviş yer tutucu ilə yazılır (dil yoxlayıcısı latın sözü saymasın)
const fillLabels = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.replace(/\{src\}/g, 'HadeethEnc.com').replace(/\{esc\}/g, 'Esc')]))
const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false
const dirOf = routeDir

export default function HadeethEncPage() {
  // siteLang — URL-in dili: /id/… səhifəsində hədislər HadeethEnc-in
  // indoneziyaca (yoxlanılmış) tərcüməsindən gəlir — hazır mənbə
  const { lang, siteLang = lang, dictLang } = useLang()
  const location = useLocation()
  const L = useMemo(() => fillLabels(pickUi(LABELS, lang, 'en')), [lang, dictLang]) // eslint-disable-line react-hooks/exhaustive-deps
  // Seçicidəki dillər: 5 əsas + səhifənin əlavə dili (varsa)
  const langOpts = HE_ALL_LANGS.includes(siteLang) && !HE_LANGS.includes(siteLang) ? [...HE_LANGS, siteLang] : HE_LANGS

  // ── Məzmun dili ──
  const [clang, setClang] = useState(() => {
    const v = readJSON(CLANG_KEY, null)
    if (!HE_LANGS.includes(siteLang) && HE_ALL_LANGS.includes(siteLang)) return siteLang
    return HE_LANGS.includes(v) ? v : (HE_LANGS.includes(lang) ? lang : 'en')
  })
  const chooseLang = (l) => { setClang(l); writeJSON(CLANG_KEY, l) }

  // ── Bölmələr ──
  const [cats, setCats] = useState(null)        // [{ id, title, count, parent }]
  const [catErr, setCatErr] = useState(null)
  const [catTry, setCatTry] = useState(0)
  const [trail, setTrail] = useState([])        // seçilmiş yol: [kök, alt, …] və ya ['fav']
  useEffect(() => {
    let alive = true
    setCats(null); setCatErr(null)
    fetchCategories(clang)
      .then(list => { if (alive) setCats(list) })
      .catch(e => { if (alive) setCatErr(e) })
    return () => { alive = false }
  }, [clang, catTry])

  const roots = useMemo(() => (cats || []).filter(c => c.parent == null && c.count > 0), [cats])
  const byParent = useMemo(() => {
    const m = new Map()
    for (const c of cats || []) {
      if (c.parent == null || c.count === 0) continue
      if (!m.has(c.parent)) m.set(c.parent, [])
      m.get(c.parent).push(c)
    }
    return m
  }, [cats])
  const byId = useMemo(() => new Map((cats || []).map(c => [c.id, c])), [cats])

  // Dil dəyişəndə seçim keçərsizdirsə — ilk kök bölmə
  useEffect(() => {
    if (!cats) return
    setTrail(t => {
      if (t[0] === FAV) return t
      if (t.length && t.every(id => byId.has(id) && byId.get(id).count > 0)) return t
      return roots[0] ? [roots[0].id] : []
    })
  }, [cats, roots, byId])

  const isFav = trail[0] === FAV
  const catId = isFav ? null : trail[trail.length - 1] || null

  // ── Hədis siyahısı ──
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 0, lastPage: 0, total: 0 })
  const [listState, setListState] = useState('idle')   // idle | loading | more | error
  const reqRef = useRef(0)
  const loadPage = useCallback(async (page) => {
    if (!catId) return
    const my = ++reqRef.current
    setListState(page === 1 ? 'loading' : 'more')
    try {
      const r = await fetchHadeethList(clang, catId, page, PER_PAGE)
      if (my !== reqRef.current) return
      setItems(prev => {
        const base = page === 1 ? [] : prev
        const seen = new Set(base.map(x => x.id))
        return [...base, ...r.items.filter(x => !seen.has(x.id))]
      })
      setMeta({ page: r.page, lastPage: r.lastPage, total: r.total })
      setListState('idle')
    } catch {
      if (my !== reqRef.current) return
      setListState('error')
    }
  }, [clang, catId])
  useEffect(() => { setItems([]); setMeta({ page: 0, lastPage: 0, total: 0 }); if (catId) loadPage(1) }, [catId, clang, loadPage])

  // ── Seçilmişlər ──
  const [favs, setFavs] = useState(readFavs)
  const favSet = useMemo(() => new Set(favs.map(f => f.id)), [favs])
  const toggleFav = useCallback((h) => setFavs(prev => {
    const next = prev.some(f => f.id === h.id) ? prev.filter(f => f.id !== h.id) : [...prev, { id: h.id, title: h.title, lang: h.lang || clang }]
    writeJSON(FAV_KEY, next)
    return next
  }), [clang])
  useEffect(() => {
    const onStorage = (e) => { if (e.key === FAV_KEY) setFavs(readFavs()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ── Axtarış (yalnız yüklənmiş başlıqlarda) ──
  const [q, setQ] = useState('')
  const source = isFav ? favs : items
  const list = useMemo(() => {
    const s = q.trim().toLocaleLowerCase(clang)
    if (!s) return source
    return source.filter(x => x.id === s.replace(/^#/, '') || x.title.toLocaleLowerCase(clang).includes(s))
  }, [source, q, clang])

  // ── Oxu pəncərəsi ──
  const [cur, setCur] = useState(null)         // { id, lang }
  const [from, setFrom] = useState(null)       // pəncərə hansı kartdan açılıb (morph)
  const morph = useMorphId(cur && from != null ? `he-${from}` : null)
  const morphOn = useMorphId(0) != null
  const [detail, setDetail] = useState({ status: 'idle' })
  const [detailTry, setDetailTry] = useState(0)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!cur) return undefined
    let alive = true
    setDetail({ status: 'loading' })
    fetchHadeeth(cur.lang, cur.id)
      .then(d => { if (alive) setDetail({ status: 'ok', data: d }) })
      .catch(e => { if (alive) setDetail({ status: e instanceof HeError && e.status === 404 ? 'missing' : 'error', error: e }) })
    return () => { alive = false }
  }, [cur, detailTry])

  // #id-5913 → həmin hədis açılır (hash cari girişdən götürülür, pəncərə açıq ikən yenidən yazılır)
  useEffect(() => {
    const m = /^#id-(\d{1,7})$/.exec(location.hash || '')
    if (!m) return
    try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search) } catch { /* */ }
    setCur({ id: m[1], lang: clang })
  }, [location.hash]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cur) return
    try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#id-${cur.id}`) } catch { /* */ }
  }, [cur])

  const open = (x) => { setCur({ id: x.id, lang: isFav ? (x.lang || clang) : clang }); setCopied('') }
  const close = useCallback(() => {
    setCur(null); setFrom(null); setDetail({ status: 'idle' })
    try {
      if (/^#id-\d+$/.test(window.location.hash)) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    } catch { /* */ }
  }, [])

  const idx = cur ? list.findIndex(x => x.id === cur.id) : -1
  const go = (d) => { const x = list[idx + d]; if (x) open(x) }
  const canMore = !isFav && !q && meta.page < meta.lastPage
  // Siyahının sonunda "növbəti" — növbəti səhifəni yüklə
  const nextFn = idx >= 0 && idx < list.length - 1 ? () => go(1) : undefined

  const h = detail.status === 'ok' ? detail.data : null
  const shareUrl = cur ? `${window.location.origin}${window.location.pathname}#id-${cur.id}` : ''
  const flash = (k) => { setCopied(k); setTimeout(() => setCopied(c => (c === k ? '' : c)), 1800) }
  const plainText = (x) => [
    x.title,
    x.lang !== 'ar' && x.ar.text,
    x.text,
    [x.grade && `${L.grade}: ${x.grade}`, x.attribution && `${L.attribution}: ${x.attribution}`].filter(Boolean).join(' · '),
    `HadeethEnc.com — ${hadeethUrl(x.lang, x.id)}`,
  ].filter(Boolean).join('\n\n')
  const copy = async () => { if (h && await copyText(`${plainText(h)}\n${shareUrl}`)) flash('text') }
  const share = async () => {
    if (!h) return
    const r = await shareOrCopy({ title: `${L.title} — ${h.title}`, text: plainText(h), url: shareUrl })
    if (r === 'copied') flash('share')
  }

  // ── Görünüş köməkçiləri ──
  const offline = isOffline()
  const errorBox = (onRetry) => (
    <div className="ui-empty ui-empty--card ui-empty--bad he-state" role="alert">
      <Icon name="alert" />
      <strong>{offline ? L.offline : L.err}</strong>
      <p>{offline ? L.offlineLead : L.errLead}</p>
      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onRetry}>
        <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
      </button>
    </div>
  )
  const skeleton = (n = 6) => (
    <div className="ui-skeleton-grid he-skel" aria-busy="true" aria-label={L.loading}>
      {Array.from({ length: n }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--card" />)}
    </div>
  )

  const selectRoot = (id) => { setQ(''); setTrail(id === FAV ? [FAV] : [id]) }
  const selectAt = (level, id) => { setQ(''); setTrail(t => (t[level + 1] === id ? t.slice(0, level + 1) : [...t.slice(0, level + 1), id])) }
  // Alt bölmə sıraları: yoldakı hər düyünün uşaqları
  const subRows = isFav ? [] : trail.map((id, level) => ({ level, parent: id, kids: byParent.get(id) || [] })).filter(r => r.kids.length)
  const curCat = catId ? byId.get(catId) : null
  const subCount = (cats || []).filter(c => c.parent != null && c.count > 0).length
  const cdir = dirOf(clang)

  return (
    <ExpandableGroup id="he-xc">
    <div className="he-page">
      <header className="ui-page-hero ui-page-hero--split he-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{L.eyebrow}</span>
            <h1 className="ui-display">{L.title}</h1>
            {lang !== 'ar' && <p className="he-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">موسوعة الأحاديث النبوية</p>}
            <p className="ui-lead">{L.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {L.how}</p>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card he-hero__card">
              <div className="he-lang">
                <span className="he-lang__label" id="he-lang-l">{L.contentLang}</span>
                <div className="ui-segmented he-lang__seg" role="radiogroup" aria-labelledby="he-lang-l">
                  {langOpts.map(l => (
                    <button key={l} type="button" role="radio" aria-checked={clang === l} onClick={() => chooseLang(l)}
                      lang={l} title={LANG_NAMES[l]}>{l.toUpperCase()}</button>
                  ))}
                </div>
                <span className="he-lang__name" lang={clang} dir={cdir}>{LANG_NAMES[clang]}</span>
              </div>
              <ul className="ui-page-hero__stats he-hero__stats">
                <li><b className="ui-num">{cats ? <NumberTicker value={roots.length} lang={lang} /> : '—'}</b><span>{L.sections}</span></li>
                <li><b className="ui-num">{cats ? <NumberTicker value={subCount} lang={lang} delay={0.08} /> : '—'}</b><span>{L.subsections}</span></li>
                <li><b className="ui-num"><NumberTicker value={favs.length} lang={lang} delay={0.16} /></b><span>{L.favsStat}</span></li>
              </ul>
              <p className="he-credit">
                <Icon name="books" size={15} />
                <span>{L.credit}: <a href={`${HE_SITE}/${clang}`} target="_blank" rel="noopener noreferrer">HadeethEnc.com</a> · {L.apiVer}. {L.creditNote}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container he-layout">
          {(clang !== 'ar' && clang !== 'en') && (
            <aside className="ui-callout ui-callout--note he-note">
              <Icon name="info" />
              <div><p>{L.partial}</p>{clang !== lang && <p>{L.otherLang}</p>}</div>
            </aside>
          )}
          {(clang === 'ar' || clang === 'en') && clang !== lang && (
            <aside className="ui-callout ui-callout--note he-note"><Icon name="globe" /><div><p>{L.otherLang}</p></div></aside>
          )}

          {/* Bölmə ağacı */}
          <nav className="he-cats" aria-label={L.filterLabel}>
            <h2 className="he-cats__title">{L.categories}</h2>
            {catErr ? errorBox(() => setCatTry(n => n + 1)) : !cats ? (
              <div className="he-cats__skel" aria-busy="true">{Array.from({ length: 7 }, (_, i) => <span key={i} className="ui-skeleton he-cats__sk" />)}</div>
            ) : (
              <>
                <div className="he-roots" role="group" aria-label={L.categories}>
                  {roots.map(c => (
                    <button key={c.id} type="button" className="he-root" aria-pressed={trail[0] === c.id} onClick={() => selectRoot(c.id)}>
                      <span className="he-root__t" lang={clang} dir={cdir}>{c.title}</span>
                      <span className="he-root__n ui-num">{c.count}</span>
                    </button>
                  ))}
                  <button type="button" className="he-root he-root--fav" aria-pressed={isFav} onClick={() => selectRoot(FAV)}>
                    <span className="he-root__t"><Icon name="star" size={15} /> {L.favs}</span>
                    <span className="he-root__n ui-num">{favs.length}</span>
                  </button>
                </div>
                {subRows.map(r => (
                  <div key={r.parent} className="he-subs ui-chips" role="group" aria-label={`${L.subLabel}: ${byId.get(r.parent)?.title || ''}`}>
                    {r.kids.map(k => (
                      <button key={k.id} type="button" className="ui-chip he-chip" aria-pressed={trail[r.level + 1] === k.id} onClick={() => selectAt(r.level, k.id)}>
                        <span lang={clang} dir={cdir}>{k.title}</span> <span className="ui-chip__count ui-num">{k.count}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </nav>

          {/* Alət zolağı */}
          <div className="he-toolbar">
            <div className="he-search">
              <Icon name="search" size={19} className="he-search__icon" />
              <input className="ui-input he-search__input" type="search" aria-label={L.search} placeholder={L.search}
                enterKeyHint="search" value={q} onChange={e => setQ(e.target.value)} lang={clang} dir="auto" />
              {q && (
                <button type="button" className="ui-icon-btn he-search__clear" onClick={() => setQ('')} aria-label={L.clear} title={L.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <span className="he-toolbar__count ui-num" aria-live="polite">
              {isFav ? `${list.length} ${L.of}` : (meta.total ? `${list.length} / ${meta.total} ${L.of}` : '')}
            </span>
          </div>

          {!isFav && curCat && <h2 key={`cur-${curCat.id}`} className="he-cur" lang={clang} dir={cdir}>{curCat.title}</h2>}

          {/* Kartlar */}
          {!isFav && listState === 'error' && items.length === 0 ? errorBox(() => loadPage(1))
            : !isFav && (listState === 'loading' || (!cats && !catErr)) ? skeleton()
            : list.length === 0 ? (
              <div className="ui-empty ui-empty--card he-state" role="status">
                <Icon name={isFav ? 'star' : 'search'} />
                <strong>{isFav && !q ? L.favNone : L.none}</strong>
                <p>{isFav && !q ? L.favNoneLead : L.noneLead}</p>
                {q && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setQ('')}><Icon name="refresh" className="ui-btn__icon" /> {L.clear}</button>}
              </div>
            ) : (
              <ol className="he-grid" key={`grid-${isFav ? 'fav' : (curCat?.id ?? 'all')}`}>
                {list.map(x => {
                  const xl = isFav ? x.lang : clang
                  const g = cachedHadeeth(xl, x.id)?.grade
                  const on = favSet.has(x.id)
                  return (
                    <m.li layoutId={morphOn ? morphId(`he-${x.id}`) : undefined} transition={SPRING.soft} data-wow-off=""
                      key={x.id} className={`ui-card he-card${cur?.id === x.id ? ' is-current' : ''}`}>
                      <div className="he-card__top">
                        <span className="he-card__id ui-num" dir="ltr">#{x.id}</span>
                        {g && <span className="ui-badge ui-badge--brand he-grade" lang={xl} dir={dirOf(xl)}>{g}</span>}
                        {isFav && xl !== clang && <span className="ui-badge ui-badge--outline">{xl.toUpperCase()}</span>}
                        <StarButton on={on} onToggle={() => toggleFav({ id: x.id, title: x.title, lang: xl })}
                          label={`${on ? L.removeFav : L.addFav}: ${x.title}`} className="he-card__star" />
                      </div>
                      <h3 className="he-card__title" lang={xl} dir={dirOf(xl)}>
                        <button type="button" className="he-card__open" onClick={() => { setFrom(x.id); open(x) }}>{x.title}</button>
                      </h3>
                      <span className="he-card__read" aria-hidden="true">{L.read} <Icon name="chevron" size={14} className="ui-flip-rtl" /></span>
                    </m.li>
                  )
                })}
              </ol>
            )}

          {!isFav && listState === 'error' && items.length > 0 && errorBox(() => loadPage(meta.page + 1))}
          {canMore && listState !== 'error' && (
            <div className="he-more">
              <button type="button" className="ui-btn ui-btn--secondary he-more__btn" onClick={() => loadPage(meta.page + 1)} disabled={listState === 'more'}>
                {listState === 'more' ? <><span className="he-spin" aria-hidden="true" /> {L.loading}</> : <><Icon name="chevronDown" className="ui-btn__icon" /> {L.more}</>}
              </button>
              <span className="he-more__n ui-num">{items.length} / {meta.total} {L.loaded}</span>
            </div>
          )}

          <p className="he-foot-credit">
            <Icon name="books" size={15} />
            <span>{L.credit}: <a href={HE_SITE} target="_blank" rel="noopener noreferrer">HadeethEnc.com</a> ({L.apiVer}). {L.creditNote}</span>
          </p>
        </div>
      </div>

      <ReaderDialog
        open={!!cur}
        onClose={close}
        onPrev={idx > 0 ? () => go(-1) : undefined}
        onNext={nextFn}
        labelledBy="he-reader-title"
        position={idx >= 0 ? `${idx + 1} / ${isFav ? list.length : (q ? list.length : meta.total || list.length)}` : null}
        contentKey={cur ? `${cur.lang}-${cur.id}` : ''}
        layoutId={morph}
        className="he-reader"
        labels={{ close: L.close, prev: L.prev, next: L.next }}
        head={cur && (
          <>
            <span className="he-card__id ui-num" dir="ltr">#{cur.id}</span>
            {h?.grade && <span className="ui-badge ui-badge--brand he-grade" lang={h.lang} dir={dirOf(h.lang)}>{h.grade}</span>}
          </>
        )}
        footer={h && (
          <StarButton on={favSet.has(h.id)} onToggle={() => toggleFav(h)} label={favSet.has(h.id) ? L.removeFav : L.addFav} />
        )}
      >
        {cur && detail.status === 'loading' && (
          <div className="he-read he-read--skel" aria-busy="true" aria-label={L.loading}>
            <h2 id="he-reader-title" className="ui-sr-only">{L.loading}</h2>
            <span className="ui-skeleton he-sk he-sk--title" />
            <span className="ui-skeleton he-sk he-sk--ar" />
            <span className="ui-skeleton he-sk he-sk--p" />
            <span className="ui-skeleton he-sk he-sk--p" />
          </div>
        )}
        {cur && detail.status === 'error' && (
          <div className="he-read"><h2 id="he-reader-title" className="ui-sr-only">{L.err}</h2>{errorBox(() => setDetailTry(n => n + 1))}</div>
        )}
        {cur && detail.status === 'missing' && (
          <div className="he-read">
            <div className="ui-empty ui-empty--card he-state" role="status">
              <Icon name="globe" />
              <strong id="he-reader-title">{L.notInLang}</strong>
              <p>{L.notInLangLead}</p>
              <div className="he-langbtns">
                {langOpts.filter(l => l !== cur.lang).map(l => (
                  <button key={l} type="button" className="ui-btn ui-btn--secondary ui-btn--sm" lang={l} onClick={() => setCur({ id: cur.id, lang: l })}>{LANG_NAMES[l]}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {h && (
          <article className="he-read" lang={h.lang} dir={dirOf(h.lang)}>
            <h2 id="he-reader-title" className="he-read__title">{h.title}</h2>
            {h.lang !== clang && <p className="he-read__langnote" lang={lang} dir={dirOf(lang)}><Icon name="globe" size={14} /> {LANG_NAMES[h.lang]}</p>}

            {h.ar.text && (
              <section aria-label={L.arabic} lang="ar" dir="rtl">
                <p className="he-read__ar ui-arabic">{h.ar.text}</p>
              </section>
            )}
            {h.lang !== 'ar' && h.text && (
              <section aria-label={L.translation}><p className="he-read__text">{h.text}</p></section>
            )}

            <dl className="he-read__meta">
              {h.grade && <div><dt lang={lang} dir={dirOf(lang)}>{L.grade}</dt><dd>{h.grade}{h.lang !== 'ar' && h.ar.grade && <span className="he-read__arm ui-arabic" lang="ar" dir="rtl">{h.ar.grade}</span>}</dd></div>}
              {h.attribution && <div><dt lang={lang} dir={dirOf(lang)}>{L.attribution}</dt><dd><cite>{h.attribution}</cite>{h.lang !== 'ar' && h.ar.attribution && <span className="he-read__arm ui-arabic" lang="ar" dir="rtl">{h.ar.attribution}</span>}</dd></div>}
            </dl>

            {h.explanation && (
              <section className="he-read__sec">
                <h3 className="he-read__h" lang={lang} dir={dirOf(lang)}><Icon name="list" size={15} /> {L.explanation}</h3>
                <p className="he-read__exp">{h.explanation}</p>
              </section>
            )}
            {h.hints.length > 0 && (
              <section className="he-read__sec he-read__box">
                <h3 className="he-read__h" lang={lang} dir={dirOf(lang)}><Icon name="bulb" size={15} /> {L.hints}</h3>
                <ul className="he-read__list">{h.hints.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </section>
            )}
            {(h.words.length > 0 || h.ar.words.length > 0) && (
              <section className="he-read__sec he-read__box">
                <h3 className="he-read__h" lang={lang} dir={dirOf(lang)}><Icon name="type" size={15} /> {L.words}</h3>
                {h.words.length > 0 ? (
                  <dl className="he-words">{h.words.map((w, i) => <div key={i}><dt>{w.word}</dt><dd>{w.meaning}</dd></div>)}</dl>
                ) : (
                  <dl className="he-words" lang="ar" dir="rtl">{h.ar.words.map((w, i) => <div key={i}><dt className="ui-arabic">{w.word}</dt><dd className="ui-arabic">{w.meaning}</dd></div>)}</dl>
                )}
              </section>
            )}

            <div className="he-read__actions" lang={lang} dir={dirOf(lang)}>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copy}>
                <Icon name={copied === 'text' ? 'check' : 'copy'} className="ui-btn__icon" /> {copied === 'text' ? L.copied : L.copy}
              </button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={share}>
                <Icon name={copied === 'share' ? 'check' : 'share'} className="ui-btn__icon" /> {copied === 'share' ? L.copied : L.share}
              </button>
              <span className="he-read__spacer" />
              <a className="ui-btn ui-btn--secondary ui-btn--sm he-read__site" href={hadeethUrl(h.lang, h.id)} target="_blank" rel="noopener noreferrer">
                <Icon name="external" className="ui-btn__icon" /> {L.onSite}
              </a>
            </div>
            <p className="he-read__credit" lang={lang} dir={dirOf(lang)}>
              {L.credit}: <a href={hadeethUrl(h.lang, h.id)} target="_blank" rel="noopener noreferrer">HadeethEnc.com</a> · {L.apiVer}. {L.creditNote} {L.feedback}
            </p>
            <p className="he-read__keys" aria-hidden="true" lang={lang} dir={dirOf(lang)}>{L.keys}</p>
          </article>
        )}
      </ReaderDialog>
    </div>
    </ExpandableGroup>
  )
}
