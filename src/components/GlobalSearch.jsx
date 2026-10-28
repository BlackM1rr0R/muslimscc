import { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue, Fragment } from 'react'
import { useLang } from '../contexts/LangContext'
import { INDEXABLE } from '../seo/routes'
import { META, shortName, descFor } from '../seo/meta'
import { NAV_GROUPS, navLabel } from '../data/navigation'
import { SURAH_AZ } from '../data/surahNamesAz'
import {
  GROUP_ORDER, prepareQuery, normalize, buildIndex, buildSources, buildEntries,
  buildQuranEditionItems, searchIndex, searchEntries, groupOrder,
  highlightSegments, snippetSegments, hasArabic,
} from '../utils/search'
import { localizeSource, QURAN_WORD } from '../utils/sourceNames'
import Icon from './Icon'
import '../styles/GlobalSearch.css'

// ═══════════════════════════════════════════════════════
// GlobalSearch — bir sözlə bütün saytda axtarış (komanda paneli)
//
// Mənbələr (hamısı YALNIZ dialoq açılanda dinamik import ilə yüklənir):
//   • Səhifələr  — src/seo/routes.js + navigation.js başlıqları + meta.js təsviri
//   • Hədis      — src/data/hadiths.js (2000 qeyd; təkrarlar utils/uniqueHadiths ilə çıxarılır)
//   • Quran      — src/data/quotes.js-dəki yoxlanılmış ayələr + Quranın TAM
//                  mətni (api.alquran.cloud, QuranPage.jsx ilə eyni nəşr)
//   • Dua        — src/data/duas.js
//   • 99 ad      — src/data/names99.js
//   • Lüğət      — src/data/glossary.js
//
// Quranın tam mətni niyə /v1/search yox, /v1/quran/<nəşr> ilə?
//   /v1/search "nəticə yoxdur" cavabını HTTP 404 ilə qaytarır və brauzer hər
//   dəfə konsola qırmızı "Failed to load resource" yazır (sahibin tələbi: təmiz
//   konsol). Üstəlik o, "sebr" ilə "səbr"-i tapmır və çox sözlü sorğuda 404
//   verir. Tam nəşr (~0.4–0.5 MB gzip, brauzer 24 saat keşləyir) bir dəfə
//   yüklənir, sonra hər klaviş yerli və ~3 ms-də axtarılır.
//
// İdarə: ↑/↓ seç, Enter aç, Esc bağla. Səhifə nəticəsi səhifəni açır;
// məzmun nəticəsi (hədis, ayə, dua...) yerində açılır — tam mətn, mənbə,
// "Hədislərə keç" və "Kopyala" düymələri ilə.
// ═══════════════════════════════════════════════════════

// QuranPage.jsx-dəki EDITION_MAP ilə eyni; ərəbcə üçün hərəkəli mətn
const EDITION_MAP = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet', ar: 'quran-simple' }
const ARABIC_EDITION = 'quran-simple'

const RECENT_KEY = 'qm_recent_searches'
const RECENT_MAX = 5
const ALL_CAP = 5          // "Hamısı" görünüşündə hər qrupdan
const PAGE_SIZE = 20       // qrup filtrində bir dəfəyə
const DEBOUNCE_MS = 350    // Quran nəşrini yükləməzdən əvvəl gözləmə
const OPT_ID = 'gs-opt-'

// Səhifələrin görünməyən açar sözləri — başlıq və təsvirdə olmayan, amma
// ziyarətçinin yazdığı sözlərlə səhifə tapılsın ("cümə" → Camaat və Cümə).
// Başlıqdan az, təsvirdən çox çəkisi var (utils/search.js → buildSources).
const PAGE_KEYWORDS = {
  jamaat: {
    az: 'cümə namazı camaat xütbə fəzilət', en: 'friday jumuah jumua congregation jamaat khutbah virtue',
    ru: 'пятница джума пятничный намаз джамаат хутба', ar: 'الجمعة صلاة الجمعة الجماعة الخطبة فضل',
    tr: 'cuma cuma namazı cemaat hutbe fazilet',
  },
  prayer: {
    az: 'azan namaz vaxtı şəhər geri sayım', en: 'adhan azan prayer time city countdown',
    ru: 'азан время намаза город отсчёт', ar: 'الأذان وقت الصلاة المدينة',
    tr: 'ezan namaz vakti şehir geri sayım',
  },
  donate: {
    az: 'ianə sədəqə xeyriyyə yardım infaq', en: 'donation sadaqah charity giving',
    ru: 'пожертвование садака благотворительность помощь', ar: 'تبرع صدقة خير إنفاق',
    tr: 'bağış sadaka hayır yardım infak',
  },
  mosques: {
    az: 'məscid yaxınlıqda xəritə yol', en: 'mosque masjid nearby map directions',
    ru: 'мечеть рядом карта маршрут', ar: 'مسجد قريب الخريطة',
    tr: 'cami mescit yakında harita yol tarifi',
  },
  announcements: {
    az: 'elan xəbər bildiriş tədbir', en: 'news notice events',
    ru: 'новости объявление события', ar: 'أخبار إعلان فعاليات',
    tr: 'haber duyuru etkinlik',
  },
}

// Nəticənin "keç" düyməsi hansı səhifəni açır
const TARGET = { quran: 'quran', hadith: 'hadith', dua: 'duas', name: 'names', glossary: 'glossary' }
// Növ → xətti ikon adı (Icon.jsx); səhifə nəticəsi öz bölmə ikonunu göstərir
const TYPE_ICON = { page: 'compass', quran: 'quran', hadith: 'hadith', dua: 'duas', name: 'names', glossary: 'glossary' }

const SUGGEST = {
  az: ['səbr', 'namaz', 'Rəhman', 'tövbə', 'cümə', 'oruc'],
  en: ['patience', 'prayer', 'Rahman', 'repentance', 'Friday', 'fasting'],
  ru: ['терпение', 'намаз', 'Милостивый', 'покаяние', 'пятница', 'пост'],
  ar: ['الصبر', 'الصلاة', 'الرحمن', 'التوبة', 'الجمعة', 'الصيام'],
  tr: ['sabır', 'namaz', 'Rahman', 'tövbe', 'cuma', 'oruç'],
}

const LABELS = {
  az: {
    placeholder: 'Hədis, ayə, dua, səhifə axtar…',
    dialog: 'Saytda axtarış', close: 'Bağla', clear: 'Sorğunu təmizlə', filters: 'Nəticə növü',
    types: { all: 'Hamısı', page: 'Səhifələr', quran: 'Quran', hadith: 'Hədis', dua: 'Dua', name: 'Allahın adları', glossary: 'Lüğət' },
    groups: { page: 'Səhifələr', quran: 'Quran ayələri', hadith: 'Hədislər', dua: 'Dualar', name: 'Allahın adları', glossary: 'Lüğət' },
    go: { quran: 'Qurana keç', hadith: 'Hədislərə keç', dua: 'Dualara keç', name: 'Allahın adlarına keç', glossary: 'Lüğətə keç' },
    showAll: 'Hamısını göstər', showMore: 'Daha çox göstər', copy: 'Kopyala', copied: 'Kopyalandı',
    recent: 'Son axtarışlar', clearRecent: 'Təmizlə', removeRecent: 'Sil', suggest: 'Bunları sınayın',
    intro: 'Bir söz yazın — Quran ayələri, hədislər, dualar, Allahın adları, lüğət və saytın bölmələri birlikdə axtarılır.',
    minChars: 'Ən azı 2 hərf yazın.',
    loading: 'Axtarış bazası yüklənir…', loadError: 'Axtarış bazası yüklənmədi.', retry: 'Yenidən cəhd et',
    quranLoading: 'Quranın tam mətnində axtarılır…',
    quranError: 'Quranın tam mətni yüklənmədi — internet bağlantısını yoxlayın.',
    translation: 'Tərcümə', noneInType: 'Bu bölmədə nəticə yoxdur.',
    noResults: q => `“${q}” üçün heç nə tapılmadı`,
    noResultsTip: 'Sözü qısaldın və ya başqa sözlə yoxlayın.',
    results: n => `${n} nəticə`,
    hintMove: 'seç', hintOpen: 'aç', hintClose: 'bağla',
  },
  en: {
    placeholder: 'Search hadith, verses, duas, pages…',
    dialog: 'Search the site', close: 'Close', clear: 'Clear search', filters: 'Result type',
    types: { all: 'All', page: 'Pages', quran: 'Quran', hadith: 'Hadith', dua: 'Duas', name: 'Names of Allah', glossary: 'Glossary' },
    groups: { page: 'Pages', quran: 'Quran verses', hadith: 'Hadith', dua: 'Duas', name: 'Names of Allah', glossary: 'Glossary' },
    go: { quran: 'Go to the Quran', hadith: 'Go to hadith', dua: 'Go to duas', name: 'Go to the 99 Names', glossary: 'Go to the glossary' },
    showAll: 'Show all', showMore: 'Show more', copy: 'Copy', copied: 'Copied',
    recent: 'Recent searches', clearRecent: 'Clear', removeRecent: 'Remove', suggest: 'Try these',
    intro: 'Type a word — Quran verses, hadith, duas, the names of Allah, the glossary and the site’s sections are searched together.',
    minChars: 'Type at least 2 letters.',
    loading: 'Loading search data…', loadError: 'Search data could not be loaded.', retry: 'Try again',
    quranLoading: 'Searching the full text of the Quran…',
    quranError: 'The full Quran text could not be loaded — check your connection.',
    translation: 'Translation', noneInType: 'No results in this section.',
    noResults: q => `Nothing found for “${q}”`,
    noResultsTip: 'Try a shorter word or a different one.',
    results: n => `${n} results`,
    hintMove: 'select', hintOpen: 'open', hintClose: 'close',
  },
  ru: {
    placeholder: 'Поиск хадисов, аятов, дуа, страниц…',
    dialog: 'Поиск по сайту', close: 'Закрыть', clear: 'Очистить запрос', filters: 'Тип результатов',
    types: { all: 'Все', page: 'Страницы', quran: 'Коран', hadith: 'Хадисы', dua: 'Дуа', name: 'Имена Аллаха', glossary: 'Словарь' },
    groups: { page: 'Страницы', quran: 'Аяты Корана', hadith: 'Хадисы', dua: 'Дуа', name: 'Имена Аллаха', glossary: 'Словарь' },
    go: { quran: 'Перейти к Корану', hadith: 'Перейти к хадисам', dua: 'Перейти к дуа', name: 'Перейти к 99 именам', glossary: 'Перейти к словарю' },
    showAll: 'Показать все', showMore: 'Показать ещё', copy: 'Копировать', copied: 'Скопировано',
    recent: 'Недавние запросы', clearRecent: 'Очистить', removeRecent: 'Удалить', suggest: 'Попробуйте',
    intro: 'Введите слово — поиск идёт сразу по аятам Корана, хадисам, дуа, именам Аллаха, словарю и разделам сайта.',
    minChars: 'Введите минимум 2 буквы.',
    loading: 'Загрузка данных поиска…', loadError: 'Не удалось загрузить данные поиска.', retry: 'Повторить',
    quranLoading: 'Поиск по полному тексту Корана…',
    quranError: 'Не удалось загрузить полный текст Корана — проверьте подключение.',
    translation: 'Перевод', noneInType: 'В этом разделе ничего нет.',
    noResults: q => `По запросу «${q}» ничего не найдено`,
    noResultsTip: 'Попробуйте более короткое или другое слово.',
    results: n => `Результатов: ${n}`,
    hintMove: 'выбрать', hintOpen: 'открыть', hintClose: 'закрыть',
  },
  ar: {
    placeholder: 'ابحث عن حديث أو آية أو دعاء أو صفحة…',
    dialog: 'البحث في الموقع', close: 'إغلاق', clear: 'مسح البحث', filters: 'نوع النتائج',
    types: { all: 'الكل', page: 'الصفحات', quran: 'القرآن', hadith: 'الحديث', dua: 'الأدعية', name: 'أسماء الله', glossary: 'المصطلحات' },
    groups: { page: 'الصفحات', quran: 'آيات القرآن', hadith: 'الأحاديث', dua: 'الأدعية', name: 'أسماء الله الحسنى', glossary: 'المصطلحات' },
    go: { quran: 'الانتقال إلى القرآن', hadith: 'الانتقال إلى الأحاديث', dua: 'الانتقال إلى الأدعية', name: 'الانتقال إلى الأسماء الحسنى', glossary: 'الانتقال إلى المصطلحات' },
    showAll: 'عرض الكل', showMore: 'عرض المزيد', copy: 'نسخ', copied: 'تم النسخ',
    recent: 'عمليات البحث الأخيرة', clearRecent: 'مسح', removeRecent: 'حذف', suggest: 'جرّب',
    intro: 'اكتب كلمة — يشمل البحث آيات القرآن والأحاديث والأدعية وأسماء الله الحسنى والمصطلحات وأقسام الموقع.',
    minChars: 'اكتب حرفين على الأقل.',
    loading: 'جارٍ تحميل بيانات البحث…', loadError: 'تعذّر تحميل بيانات البحث.', retry: 'إعادة المحاولة',
    quranLoading: 'جارٍ البحث في نص القرآن الكامل…',
    quranError: 'تعذّر تحميل نص القرآن الكامل — تحقّق من الاتصال.',
    translation: 'الترجمة', noneInType: 'لا توجد نتائج في هذا القسم.',
    noResults: q => `لا توجد نتائج لـ «${q}»`,
    noResultsTip: 'جرّب كلمة أقصر أو كلمة أخرى.',
    results: n => `${n} نتيجة`,
    hintMove: 'تنقّل', hintOpen: 'فتح', hintClose: 'إغلاق',
  },
  tr: {
    placeholder: 'Hadis, ayet, dua, sayfa ara…',
    dialog: 'Sitede ara', close: 'Kapat', clear: 'Aramayı temizle', filters: 'Sonuç türü',
    types: { all: 'Tümü', page: 'Sayfalar', quran: 'Kuran', hadith: 'Hadis', dua: 'Dua', name: 'Allah’ın isimleri', glossary: 'Sözlük' },
    groups: { page: 'Sayfalar', quran: 'Kuran ayetleri', hadith: 'Hadisler', dua: 'Dualar', name: 'Allah’ın isimleri', glossary: 'Sözlük' },
    go: { quran: 'Kuran’a git', hadith: 'Hadislere git', dua: 'Dualara git', name: 'Esmaül Hüsna’ya git', glossary: 'Sözlüğe git' },
    showAll: 'Tümünü göster', showMore: 'Daha fazla göster', copy: 'Kopyala', copied: 'Kopyalandı',
    recent: 'Son aramalar', clearRecent: 'Temizle', removeRecent: 'Sil', suggest: 'Bunları deneyin',
    intro: 'Bir kelime yazın — Kuran ayetleri, hadisler, dualar, Allah’ın isimleri, sözlük ve sitenin bölümleri birlikte aranır.',
    minChars: 'En az 2 harf yazın.',
    loading: 'Arama verileri yükleniyor…', loadError: 'Arama verileri yüklenemedi.', retry: 'Tekrar dene',
    quranLoading: 'Kuran’ın tam metninde aranıyor…',
    quranError: 'Kuran’ın tam metni yüklenemedi — bağlantınızı kontrol edin.',
    translation: 'Meal', noneInType: 'Bu bölümde sonuç yok.',
    noResults: q => `“${q}” için sonuç bulunamadı`,
    noResultsTip: 'Daha kısa ya da farklı bir kelime deneyin.',
    results: n => `${n} sonuç`,
    hintMove: 'seç', hintOpen: 'aç', hintClose: 'kapat',
  },
}

// ── Modul səviyyəli keş (dialoq bağlanıb açılanda yenidən yüklənmir) ──

let dataPromise = null
let dataCache = null
const indexCache = new Map()     // lang → indeks
const editionCache = new Map()   // nəşr → { status, entries, promise, ctrl }
let lastQuery = ''

/** Ağır məlumat faylları — yalnız dialoq ilk dəfə açılanda. */
function loadData() {
  if (dataCache) return Promise.resolve(dataCache)
  if (!dataPromise) {
    dataPromise = Promise.all([
      import('../data/hadiths'),
      import('../data/quotes'),
      import('../data/duas'),
      import('../data/names99'),
      import('../data/glossary'),
    ]).then(([h, q, d, n, g]) => {
      dataCache = { hadiths: h.HADITHS, quotes: q.QUOTES, duas: d.DUAS_DATA, names: n.NAMES_99, glossary: g.GLOSSARY }
      return dataCache
    })
    // Uğursuz olsa, növbəti cəhd yenidən yükləsin
    dataPromise.catch(() => { dataPromise = null })
  }
  return dataPromise
}

const pickLabel = (obj, lang) => (obj && (obj[lang] || obj.az || obj.en)) || ''

/** Saytın indekslənən səhifələri — başlıq navigation.js-dən, təsvir meta.js-dən. */
function buildPages(lang) {
  const info = {}
  for (const g of NAV_GROUPS || []) {
    for (const it of g.items || []) {
      info[it.key] = { icon: typeof it.icon === 'string' ? it.icon : '', group: pickLabel(g.label, lang) }
    }
  }
  const pages = []
  for (const p of INDEXABLE) {
    const title = navLabel(p.key, lang) || (META[p.key] ? shortName(p.key, lang) : '')
    if (!title) continue
    pages.push({
      key: p.key,
      title,
      desc: META[p.key] ? descFor(p.key, lang) : '',
      group: info[p.key]?.group || '',
      icon: info[p.key]?.icon || '',
      keywords: pickLabel(PAGE_KEYWORDS[p.key], lang),
    })
  }
  return pages
}

/** Dil üzrə indeks — məlumat gələnə qədər yalnız səhifələr axtarılır. */
function getIndex(lang, data) {
  const key = data ? lang : lang + ':pages'
  let idx = indexCache.get(key)
  if (!idx) {
    idx = data
      ? buildIndex(buildSources(data, lang, buildPages(lang)))
      : { page: buildEntries(buildSources({}, lang, buildPages(lang)).page) }
    indexCache.set(key, idx)
  }
  return idx
}

/** Quranın tam nəşrini yüklə (bir dəfə; brauzer də 24 saat keşləyir). */
function loadEdition(ed) {
  const old = editionCache.get(ed)
  if (old && old.status !== 'error') return old.promise
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null
  const rec = { status: 'loading', entries: null, promise: null, ctrl }
  rec.promise = fetch(`https://api.alquran.cloud/v1/quran/${ed}`, ctrl ? { signal: ctrl.signal } : undefined)
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return r.json()
    })
    .then(json => {
      const entries = buildEntries(buildQuranEditionItems(json))
      if (!entries.length) throw new Error('empty edition')
      rec.entries = entries
      rec.status = 'ready'
      return rec
    })
    .catch(err => {
      // Keşdə qalır ki, hər klavişdə yenidən cəhd edilməsin ("Yenidən cəhd et"
      // düyməsi silir). Dayandırılıbsa, abortEditionDownloads onu artıq silib.
      rec.status = 'error'
      throw err
    })
  editionCache.set(ed, rec)
  return rec.promise
}

/** Dialoq bağlananda yarımçıq yükləmələri dayandır (köhnəlmiş sorğu). */
function abortEditionDownloads() {
  for (const [ed, rec] of editionCache) {
    if (rec.status === 'loading' && rec.ctrl) {
      editionCache.delete(ed)
      rec.ctrl.abort()
    }
  }
}

/**
 * Quran nəşrinin vəziyyəti: 'idle' | 'pending' (gözləmə) | 'loading' | 'ready' | 'error'
 * Yükləmə sorğu ən azı 3 hərf olanda və 350 ms fasilədən sonra başlayır.
 */
function useQuranEdition(ed, want) {
  const [, setTick] = useState(0)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!ed || !want) return undefined
    let alive = true
    const bump = () => { if (alive) setTick(t => t + 1) }
    const rec = editionCache.get(ed)
    if (rec && rec.status === 'ready') return undefined
    if (rec && rec.status === 'loading') {
      rec.promise.then(bump, bump)
      return () => { alive = false }
    }
    if (rec && rec.status === 'error' && !retry) return undefined
    const timer = setTimeout(() => {
      loadEdition(ed).then(bump, bump)
      bump()
    }, DEBOUNCE_MS)
    return () => { alive = false; clearTimeout(timer) }
  }, [ed, want, retry])

  const rec = ed ? editionCache.get(ed) : null
  const again = useCallback(() => {
    if (ed && editionCache.get(ed)?.status === 'error') editionCache.delete(ed)
    setRetry(r => r + 1)
  }, [ed])
  if (!ed || !want) return { status: 'idle', entries: null, again }
  if (!rec) return { status: 'pending', entries: null, again }
  return { status: rec.status, entries: rec.entries, again }
}

// ── Son axtarışlar (localStorage; əlçatmazdırsa sadəcə yoxdur) ──

function readRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}

function writeRecent(list) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)) } catch { /* gizli rejim və s. */ }
  return list
}

// ── Kiçik köməkçilər ──

function Hl({ segs }) {
  return segs.map((s, i) => (s.hit ? <mark key={i}>{s.text}</mark> : <Fragment key={i}>{s.text}</Fragment>))
}

function Snip({ text, q, max = 170 }) {
  const { segs, cutStart, cutEnd } = snippetSegments(text, q, max)
  return <>{cutStart && '… '}<Hl segs={segs} />{cutEnd && ' …'}</>
}

const dirOf = text => (hasArabic(text) && !/[a-zA-Zа-яА-Я]/.test(text) ? 'rtl' : undefined)

function surahLabel(item, lang) {
  const n = item.surah?.number || item.ref?.s
  if (lang === 'az' && SURAH_AZ[n]) return SURAH_AZ[n].name
  if (lang === 'ar' && item.surah?.name) return item.surah.name
  return item.surah?.englishName || ''
}

/**
 * Nəticənin mənbə sətri — cari dildə (utils/sourceNames):
 *   hədis/dua:  "Buxari 645" → ru "Бухари 645"
 *   Quran (az): "Bəqərə · Quran 2:45" (surə adı SURAH_AZ-dan)
 *   Quran (digər dillər): hamısı eyni formada — "Коран 2:45", tam mətndən
 *     gələnlərdə surə adı ilə: "Коран 70:5 · Al-Ma'aarij"
 */
function sourceLine(item, lang) {
  if (item.type === 'quran') {
    const ref = item.ref
    if (lang === 'az') {
      if (!item.local) return ref ? `${surahLabel(item, lang)} ${ref.s}:${ref.a}` : ''
      return ref && SURAH_AZ[ref.s] ? `${SURAH_AZ[ref.s].name} · ${item.source}` : (item.source || '')
    }
    if (!ref) return localizeSource(item.source, lang)
    const base = `${QURAN_WORD[lang] || QURAN_WORD.en} ${ref.s}:${ref.a}`
    const name = item.local ? '' : surahLabel(item, lang)
    return name ? `${base} · ${name}` : base
  }
  return localizeSource(item.source, lang)
}

function copyTextOf(item, lang) {
  const src = sourceLine(item, lang)
  switch (item.type) {
    case 'hadith':
    case 'dua':
    case 'quran':
      return [item.text, item.ar, src && `— ${src}`].filter(Boolean).join('\n')
    default:
      return ''
  }
}

function trapFocus(e, root) {
  if (!root) return
  const nodes = root.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
  const list = Array.prototype.filter.call(nodes, n => n.offsetParent !== null || n === document.activeElement)
  if (!list.length) return
  const first = list[0]
  const last = list[list.length - 1]
  if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

// ── İkonlar ──

const SearchIcon = () => (
  <svg className="gs-head-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)
const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const Chevron = ({ className = '' }) => (
  <svg className={`gs-chev ${className}`} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ═══════════════════════════════════════════════════════

/**
 * Props: { open, onClose, setPage, initialQuery }
 * Bağlı olanda heç nə render etmir (vəziyyət sıfırlanır, son sorğu yadda qalır).
 */
export default function GlobalSearch({ open, onClose, setPage, initialQuery }) {
  if (!open) return null
  return <SearchDialog onClose={onClose} setPage={setPage} initialQuery={initialQuery} />
}

function SearchDialog({ onClose, setPage, initialQuery }) {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en

  const [query, setQuery] = useState(() => (initialQuery ? String(initialQuery) : lastQuery))
  const [filter, setFilter] = useState('all')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [data, setData] = useState(dataCache)
  const [dataErr, setDataErr] = useState(false)
  const [dataTry, setDataTry] = useState(0)
  const [active, setActive] = useState(0)
  const [openId, setOpenId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [recent, setRecent] = useState(readRecent)

  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const bodyRef = useRef(null)
  const kbdNavRef = useRef(false)
  const copyTimer = useRef(null)
  const queryRef = useRef(query)
  queryRef.current = query

  const close = useCallback(() => { if (typeof onClose === 'function') onClose() }, [onClose])

  // Header ?q= ilə və ya yenidən açanda yeni sorğu verə bilər
  useEffect(() => {
    if (initialQuery) setQuery(String(initialQuery))
  }, [initialQuery])

  // Açılış: fokus, arxa fonun sürüşməsini kilidlə; bağlanış: hamısını bərpa et.
  // Kilid <html> sinfi ilə qurulur (body.style yox) ki, SideNav-ın öz inline
  // kilidi ilə bir-birini "bərpa edib" səhifəni kilidli qoymasınlar.
  useEffect(() => {
    const prevFocus = document.activeElement
    const root = document.documentElement
    const scrollbar = window.innerWidth - root.clientWidth
    root.style.setProperty('--gs-sbw', `${scrollbar > 0 ? scrollbar : 0}px`)
    root.classList.add('gs-open')
    const input = inputRef.current
    if (input) {
      input.focus({ preventScroll: true })
      input.select()
    }
    return () => {
      root.classList.remove('gs-open')
      root.style.removeProperty('--gs-sbw')
      lastQuery = queryRef.current
      clearTimeout(copyTimer.current)
      abortEditionDownloads()
      if (prevFocus && prevFocus !== document.body && prevFocus.isConnected && typeof prevFocus.focus === 'function') {
        try { prevFocus.focus({ preventScroll: true }) } catch { /* fokus bərpası vacib deyil */ }
      }
    }
  }, [])

  // Yerli məlumat (hədis, dua, ...) — dialoq açılan kimi
  useEffect(() => {
    if (data) return undefined
    let alive = true
    loadData().then(
      d => { if (alive) { setData(d); setDataErr(false) } },
      () => { if (alive) setDataErr(true) },
    )
    return () => { alive = false }
  }, [data, dataTry])

  // ── Axtarış ──
  const deferredQuery = useDeferredValue(query)
  const q = useMemo(() => prepareQuery(deferredQuery), [deferredQuery])
  const index = useMemo(() => getIndex(lang, data), [lang, data])
  const local = useMemo(() => (q.valid ? searchIndex(index, q) : null), [index, q])

  const edKey = q.valid ? ((q.arabic || lang === 'ar') ? ARABIC_EDITION : (EDITION_MAP[lang] || EDITION_MAP.en)) : null
  const wantEd = Boolean(edKey) && q.norm.replace(/ /g, '').length >= 3
  const edition = useQuranEdition(edKey, wantEd)

  const remote = useMemo(
    () => (edition.status === 'ready' && edition.entries && q.valid ? searchEntries(edition.entries, q) : []),
    [edition.status, edition.entries, q],
  )

  const results = useMemo(() => {
    if (!local) return null
    const groups = { ...local.groups }
    const localQuran = groups.quran || []
    const seen = new Set(localQuran.map(r => (r.item.ref ? `${r.item.ref.s}:${r.item.ref.a}` : r.item.id)))
    groups.quran = localQuran.concat(remote.filter(r => !seen.has(`${r.item.ref.s}:${r.item.ref.a}`)))
    const quranBusy = wantEd && (edition.status === 'pending' || edition.status === 'loading')
    const quranErr = wantEd && edition.status === 'error'
    const order = groupOrder(groups)
    if ((quranBusy || quranErr) && !order.includes('quran')) order.push('quran')
    const counts = {}
    let total = 0
    for (const t of GROUP_ORDER) {
      counts[t] = (groups[t] || []).length
      total += counts[t]
    }
    return { groups, order, counts, total, quranBusy, quranErr }
  }, [local, remote, wantEd, edition.status])

  const sections = useMemo(() => {
    if (!results) return []
    const types = filter === 'all' ? results.order : [filter]
    const cap = filter === 'all' ? ALL_CAP : limit
    let start = 0
    const out = []
    for (const type of types) {
      const list = results.groups[type] || []
      const items = list.slice(0, cap)
      const busy = type === 'quran' && (results.quranBusy || results.quranErr)
      if (!items.length && !busy) continue
      out.push({ type, items, total: list.length, more: list.length > cap, start })
      start += items.length
    }
    return out
  }, [results, filter, limit])

  const options = useMemo(() => sections.flatMap(s => s.items), [sections])
  const act = options.length ? Math.min(active, options.length - 1) : -1

  // Sorğu və ya filtr dəyişəndə seçim yuxarı qayıdır
  useEffect(() => {
    setActive(0)
    setOpenId(null)
    setLimit(PAGE_SIZE)
  }, [q.norm, filter, lang])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [filter])

  // Klaviatura ilə seçiləni görünən yerə gətir
  useEffect(() => {
    if (!kbdNavRef.current) return
    kbdNavRef.current = false
    const el = document.getElementById(OPT_ID + act)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [act])

  // ── Əməliyyatlar ──
  const remember = useCallback(() => {
    const t = queryRef.current.trim()
    if (!prepareQuery(t).valid) return
    const n = normalize(t)
    setRecent(writeRecent([t, ...readRecent().filter(x => normalize(x) !== n)].slice(0, RECENT_MAX)))
  }, [])

  const go = useCallback((key) => {
    remember()
    close()
    if (typeof setPage === 'function') setPage(key)
  }, [remember, close, setPage])

  const activate = (r, i) => {
    setActive(i)
    if (r.item.type === 'page') {
      go(r.item.key)
      return
    }
    remember()
    setOpenId(id => (id === r.item.id ? null : r.item.id))
  }

  const copy = (item) => {
    const text = copyTextOf(item, lang)
    const cb = typeof navigator !== 'undefined' ? navigator.clipboard : null
    if (!text || !cb || typeof cb.writeText !== 'function') return
    cb.writeText(text).then(() => {
      setCopiedId(item.id)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopiedId(null), 1600)
    }, () => { /* icazə verilmədi — səssiz */ })
  }

  const pick = (s) => {
    setQuery(s)
    inputRef.current?.focus()
  }

  const removeRecent = (s) => setRecent(writeRecent(readRecent().filter(x => x !== s)))
  const clearRecent = () => { setRecent(writeRecent([])); inputRef.current?.focus() }

  const onKeyDown = (e) => {
    // Header-in qlobal qısayolları ("/", Ctrl+K) dialoq daxilində işləməsin
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key === 'Tab') {
      trapFocus(e, dialogRef.current)
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const n = options.length
      if (!n) return
      e.preventDefault()
      kbdNavRef.current = true
      setActive(i => {
        const cur = Math.min(i, n - 1)
        return e.key === 'ArrowDown' ? (cur + 1) % n : (cur - 1 + n) % n
      })
      if (document.activeElement !== inputRef.current) inputRef.current?.focus()
      return
    }
    if (e.key === 'Enter' && e.target === inputRef.current && !e.nativeEvent.isComposing) {
      if (act >= 0 && options[act]) {
        e.preventDefault()
        activate(options[act], act)
      }
    }
  }

  const onOverlayDown = (e) => {
    if (e.target === e.currentTarget) close()
  }

  // ── Render ──
  const trimmed = query.trim()
  const showResults = q.valid && results
  const noResults = showResults && data && results.total === 0 && !results.quranBusy && !results.quranErr
  const emptyInType = showResults && !noResults && filter !== 'all' && !sections.length

  const renderOption = (r, i, k = 0) => {
    const it = r.item
    const type = it.type
    const isOpen = openId === it.id
    const selected = i === act
    const icon = type === 'page'
      ? <Icon name={it.key} size={18} fallback={<Icon name={TYPE_ICON.page} size={18} />} />
      : <Icon name={TYPE_ICON[type]} size={18} />
    let main = null

    if (type === 'page') {
      main = (
        <>
          <div className="gs-opt-title"><Hl segs={highlightSegments(it.title, q)} /></div>
          {it.desc && <div className="gs-opt-desc"><Hl segs={highlightSegments(it.desc, q)} /></div>}
          {it.group && <div className="gs-opt-meta">{it.group}</div>}
        </>
      )
    } else if (type === 'name') {
      main = (
        <>
          <div className="gs-name">
            <span className="gs-name-ar" lang="ar" dir="rtl"><Hl segs={highlightSegments(it.ar, q)} /></span>
            <span className="gs-name-tr" dir="ltr"><Hl segs={highlightSegments(it.translit, q)} /></span>
          </div>
          {it.meaning && <div className="gs-opt-text"><Hl segs={highlightSegments(it.meaning, q)} /></div>}
          <div className="gs-opt-meta"><bdi>{it.n}</bdi> / 99</div>
        </>
      )
    } else if (type === 'glossary') {
      // Termin (term) Azərbaycan yazılışıdır — digər dillərdə başlıq
      // transliterasiya ("Tawhid"), ərəbcədə isə ərəb yazılışıdır
      const title = lang === 'az' ? it.term : (lang === 'ar' ? (it.ar || it.translit) : (it.translit || it.term))
      const sub = lang === 'az'
        ? (it.translit && it.translit !== it.term ? it.translit : '')
        : (lang === 'ar' ? it.translit : '')
      const showAr = lang !== 'ar' && it.ar
      main = (
        <>
          <div className="gs-opt-title">
            <span dir={lang === 'ar' ? 'rtl' : undefined} lang={lang === 'ar' ? 'ar' : undefined}><Hl segs={highlightSegments(title, q)} /></span>
            {sub && <span className="gs-opt-sub"> · <bdi dir="ltr"><Hl segs={highlightSegments(sub, q)} /></bdi></span>}
            {showAr && <span className="gs-inline-ar" lang="ar" dir="rtl"><Hl segs={highlightSegments(it.ar, q)} /></span>}
          </div>
          {it.def && (
            <div className="gs-opt-text" dir={dirOf(it.def)}>
              {isOpen ? <Hl segs={highlightSegments(it.def, q)} /> : <Snip text={it.def} q={q} max={140} />}
            </div>
          )}
        </>
      )
    } else {
      // hədis, ayə, dua — mənbə cari dildə
      const srcLine = sourceLine(it, lang)
      const meta = srcLine ? `— ${srcLine}` : ''
      main = (
        <>
          <div className="gs-opt-text" dir={dirOf(it.text)} lang={dirOf(it.text) ? 'ar' : undefined}>
            {isOpen ? <Hl segs={highlightSegments(it.text, q)} /> : <Snip text={it.text} q={q} />}
          </div>
          {it.ar && (
            <div className={`gs-opt-ar${isOpen ? ' is-full' : ''}`} lang="ar" dir="rtl">
              <Hl segs={highlightSegments(it.ar, q)} />
            </div>
          )}
          {isOpen && type === 'dua' && it.translit && <div className="gs-opt-translit" dir="ltr">{it.translit}</div>}
          {meta && <div className="gs-opt-meta"><bdi>{meta}</bdi></div>}
          {isOpen && type === 'quran' && !it.local && it.translator && (
            <div className="gs-opt-meta">{L.translation}: {it.translator}</div>
          )}
        </>
      )
    }

    const copyable = type === 'hadith' || type === 'quran' || type === 'dua'
    return (
      <div
        key={it.id}
        id={OPT_ID + i}
        role="option"
        aria-selected={selected}
        className={`gs-opt gs-opt-${type}${isOpen ? ' is-open' : ''}`}
        style={{ '--i': Math.min(k, 7) }}
        onMouseMove={() => { if (active !== i) setActive(i) }}
        onClick={(e) => {
          if (e.target.closest('.gs-actions')) return
          // Açıq mətndən hissə seçib kopyalayanda bağlanmasın
          if (isOpen && String(window.getSelection?.() || '').trim()) return
          activate(r, i)
        }}
      >
        <span className="gs-opt-icon" aria-hidden="true">{icon}</span>
        <div className="gs-opt-main">
          {main}
          {isOpen && type !== 'page' && (
            <div className="gs-actions">
              <button type="button" className="gs-btn" onClick={() => go(TARGET[type])}>
                {L.go[type]} <Chevron className="gs-chev-inline" />
              </button>
              {copyable && (
                <button type="button" className="gs-btn gs-btn-ghost" onClick={() => copy(it)}>
                  {copiedId === it.id ? <><Icon name="check" size={15} /> {L.copied}</> : <><Icon name="copy" size={15} /> {L.copy}</>}
                </button>
              )}
            </div>
          )}
        </div>
        <Chevron className={type === 'page' ? 'gs-chev-go' : `gs-chev-expand${isOpen ? ' is-open' : ''}`} />
      </div>
    )
  }

  return (
    <div className="gs-overlay" onMouseDown={onOverlayDown}>
      <div
        ref={dialogRef}
        className="gs-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={L.dialog}
        onKeyDown={onKeyDown}
      >
        <div className="gs-head">
          <SearchIcon />
          <input
            ref={inputRef}
            className="gs-input"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls="gs-listbox"
            aria-autocomplete="list"
            aria-activedescendant={act >= 0 ? OPT_ID + act : undefined}
            aria-label={L.placeholder}
            placeholder={L.placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={100}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="gs-icon-btn" aria-label={L.clear} onClick={() => { setQuery(''); inputRef.current?.focus() }}>
              <XIcon />
            </button>
          )}
          <button type="button" className="gs-close" aria-label={L.close} onClick={close}>
            <kbd className="gs-esc" aria-hidden="true">Esc</kbd>
            <span className="gs-close-txt" aria-hidden="true">{L.close}</span>
          </button>
        </div>

        <div className="gs-chips" role="group" aria-label={L.filters}>
          {['all', ...GROUP_ORDER].map(t => {
            const pending = showResults && !data && t !== 'all' && t !== 'page'
            const n = showResults ? (t === 'all' ? results.total : results.counts[t]) : null
            const busy = showResults && t === 'quran' && results.quranBusy
            return (
              <button
                key={t}
                type="button"
                className={`gs-chip${showResults && !n && !busy && !pending ? ' is-empty' : ''}`}
                aria-pressed={filter === t}
                onClick={() => setFilter(t)}
              >
                {L.types[t]}
                {showResults && <span className="gs-chip-n">{pending ? '…' : n}{busy && !pending ? '+' : ''}</span>}
              </button>
            )
          })}
        </div>

        <div className="gs-body" ref={bodyRef}>
          <div id="gs-listbox" role="listbox" aria-label={L.dialog}>
            {showResults && sections.map(sec => (
              <div key={sec.type} className="gs-section" role="group" aria-labelledby={`gs-sec-${sec.type}`}>
                <div className="gs-sec-head">
                  <span id={`gs-sec-${sec.type}`} className="gs-sec-title">
                    <span className="gs-sec-icon" aria-hidden="true"><Icon name={TYPE_ICON[sec.type]} size={15} /></span> {L.groups[sec.type]}
                    {sec.total > 0 && <span className="gs-sec-n">{sec.total}</span>}
                  </span>
                  {filter === 'all' && sec.more && (
                    <button type="button" className="gs-link" onClick={() => setFilter(sec.type)}>
                      {L.showAll} <Chevron className="gs-chev-inline" />
                    </button>
                  )}
                </div>
                {sec.items.map((r, k) => renderOption(r, sec.start + k, k))}
                {sec.type === 'quran' && results.quranBusy && (
                  <div className="gs-status" role="status"><span className="gs-spin" aria-hidden="true" /> {L.quranLoading}</div>
                )}
                {sec.type === 'quran' && results.quranErr && (
                  <div className="gs-status">
                    {L.quranError}
                    <button type="button" className="gs-link" onClick={edition.again}>{L.retry}</button>
                  </div>
                )}
                {filter !== 'all' && sec.more && (
                  <button type="button" className="gs-more" onClick={() => setLimit(l => l + PAGE_SIZE)}>
                    {L.showMore} ({sec.total - sec.items.length})
                  </button>
                )}
              </div>
            ))}
          </div>

          {showResults && !data && !dataErr && (
            <div className="gs-status" role="status"><span className="gs-spin" aria-hidden="true" /> {L.loading}</div>
          )}
          {dataErr && (
            <div className="gs-status">
              {L.loadError}
              <button type="button" className="gs-link" onClick={() => { setDataErr(false); setDataTry(n => n + 1) }}>{L.retry}</button>
            </div>
          )}

          {emptyInType && (
            <div className="gs-none gs-none-small">
              <p className="gs-hint">{L.noneInType}</p>
              <button type="button" className="gs-link" onClick={() => setFilter('all')}>{L.types.all} ({results.total})</button>
            </div>
          )}

          {noResults && (
            <div className="gs-none">
              <div className="gs-none-icon" aria-hidden="true"><Icon name="search" size={26} /></div>
              <p className="gs-none-title">{L.noResults(trimmed)}</p>
              <p className="gs-hint">{L.noResultsTip}</p>
              <div className="gs-suggest">
                {(SUGGEST[lang] || SUGGEST.en).map(s => (
                  <button key={s} type="button" className="gs-chip gs-chip-soft" onClick={() => pick(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {!q.valid && (
            <div className="gs-empty">
              <p className="gs-intro">{trimmed ? L.minChars : L.intro}</p>
              {recent.length > 0 && (
                <div className="gs-block">
                  <div className="gs-block-head">
                    <span>{L.recent}</span>
                    <button type="button" className="gs-link" onClick={clearRecent}>{L.clearRecent}</button>
                  </div>
                  <ul className="gs-recent">
                    {recent.map(s => (
                      <li key={s}>
                        <button type="button" className="gs-recent-btn" onClick={() => pick(s)}>
                          <ClockIcon /> <span dir="auto">{s}</span>
                        </button>
                        <button type="button" className="gs-icon-btn" aria-label={`${L.removeRecent}: ${s}`} onClick={() => removeRecent(s)}>
                          <XIcon size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="gs-block">
                <div className="gs-block-head"><span>{L.suggest}</span></div>
                <div className="gs-suggest">
                  {(SUGGEST[lang] || SUGGEST.en).map(s => (
                    <button key={s} type="button" className="gs-chip gs-chip-soft" onClick={() => pick(s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="gs-foot" aria-hidden="true">
          <span><kbd><Icon name="arrowUp" size={12} strokeWidth={2.2} /></kbd><kbd><Icon name="arrowDown" size={12} strokeWidth={2.2} /></kbd> {L.hintMove}</span>
          <span><kbd><Icon name="enter" size={12} strokeWidth={2.2} className="ui-flip-rtl" /></kbd> {L.hintOpen}</span>
          <span><kbd>Esc</kbd> {L.hintClose}</span>
        </div>

        <div className="gs-sr" aria-live="polite">{showResults && data ? L.results(results.total) : ''}</div>
      </div>
    </div>
  )
}
