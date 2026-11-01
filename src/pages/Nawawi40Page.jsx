import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { guessLang } from '../utils/textLang'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReportErrorButton from '../components/ReportErrorButton'
import { ChartFigure, Donut, ProgressRing } from '../components/viz'
import ReaderDialog from '../components/reader/ReaderDialog'
import MemorizeText from '../components/reader/MemorizeText'
import { copyText, dayIndex, readJSON, shareOrCopy, writeJSON } from '../components/reader/share'
import { NAWAWI_40, NAWAWI_INTRO, NAWAWI_SOURCES } from '../data/nawawi40'
import '../styles/Nawawi40Page.css'

/* ══════════════════════════════════════════════════════════════════
   İMAM ƏN-NƏVƏVİNİN 40 HƏDİSİ — /nawawi40
   Hər hədis: ərəb mətni, tərcümə, mənbə (ən-Nəvəvinin göstərdiyi kimi),
   dərəcə qeydi (alimlərin zəif saydığı hədislərdə) və əsas faydalar.
   Məlumat: src/data/nawawi40.js. Ünvan: /nawawi40#h-12 — həmin hədis açılır.

   Dizayn v3.2: hero (irəliləyiş, davam et, təsadüfi) → günün hədisi →
   yapışqan alət zolağı (axtarış + mənbə/irəliləyiş çipləri + say) → KART
   GRID (nömrə, başlıq, 3 sətirlik önizləmə, mənbə çipi, öyrəndim) → kart
   klikdə oxu pəncərəsi (ReaderDialog: əvvəlki/növbəti, ←/→/Esc, əzbər
   rejimi — söz-söz açma, şrift ölçüsü, kopyala, paylaş, səhv bildir) →
   "Kitab haqqında": 42 xanalı xəritə, mənbələr diaqramı (Donut), mənbələr.
   localStorage: "nawawi40_learned_v1" (öyrənilənlər), "nawawi40_last_v1"
   (son açılan), "nawawi40_fs_v1" (şrift ölçüsü) — yalnız bu cihazda.
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: { eyebrow: 'Hədis', title: 'Ən-Nəvəvinin 40 hədisi', search: 'Hədis axtar...', clear: 'Axtarışı təmizlə', source: 'Mənbə', grade: 'Dərəcəsi', benefits: 'Faydaları', none: 'Heç nə tapılmadı.', open: 'Aç', close: 'Bağla', sources: 'Mənbələr', copy: 'Kopyala', copied: 'Kopyalandı',
    lead: 'Dinin əsaslarını toplayan 42 qısa hədis — ərəbcə mətn, tərcümə, mənbə və faydaları ilə.',
    how: 'Karta toxunun — hədis ərəbcə mətni, tərcüməsi və faydaları ilə açılır. Əzbər rejimində mətni söz-söz açaraq özünüzü yoxlayın, öyrəndiyinizi «Öyrəndim» ilə işarələyin.',
    statHadith: 'hədis', statAgreed: 'Buxari və Müslimdə', statLearned: 'öyrənilib',
    learn: 'Öyrəndim', learned: 'Öyrənilib', aboutEyebrow: 'Kitab haqqında', aboutTitle: 'Kitab, irəliləyiş və mənbələr',
    mapTitle: 'Hədislər xəritəsi', mapLead: 'Nömrəyə toxunun — hədis açılır. Yaşıl — öyrəndikləriniz (yalnız bu cihazda).', progress: 'Öyrənilib',
    chartTitle: 'Hədislər hansı toplulardandır', chartSub: 'ən-Nəvəvinin göstərdiyi mənbəyə görə',
    agreed: 'Buxari və Müslim', bukhari: 'Yalnız Buxari', muslim: 'Yalnız Müslim', other: 'Digər toplular', of: 'hədis',
    all: 'Hamısı', agreedS: 'Buxari və Müslim', bukhariS: 'Buxari', muslimS: 'Müslim', otherS: 'Digər', fLearned: 'Öyrənilənlər', fNot: 'Öyrənilməyənlər',
    filterLabel: 'Mənbəyə və irəliləyişə görə süzgəc', reset: 'Süzgəci sıfırla', random: 'Təsadüfi hədis', cont: 'Davam et', today: 'Günün hədisi', read: 'Oxu',
    gradeNote: 'Dərəcə qeydi', prev: 'Əvvəlki', next: 'Növbəti', share: 'Paylaş', memorize: 'Əzbər rejimi', memoAr: 'Ərəbcə mətn', memoTr: 'Tərcümə',
    memoLead: 'Gizli sözə toxunun və ya «Növbəti söz» düyməsini basın.', memoNext: 'Növbəti söz', memoAll: 'Hamısını göstər', memoHide: 'Yenidən gizlət',
    fsDown: 'Şrifti kiçilt', fsUp: 'Şrifti böyüt', keys: '← → — keçid, Esc — bağla', markLearned: 'Öyrəndim kimi işarələ',
    chartNote: 'Hesablama hər hədisin altındakı mənbə sətrindəndir. «Digər» — Tirmizi, Əbu Davud, İbn Macə, Darəqutni və s.' },
  en: { eyebrow: 'Hadith', title: 'An-Nawawi’s Forty Hadith', search: 'Search hadith...', clear: 'Clear search', source: 'Source', grade: 'Grade', benefits: 'Benefits', none: 'Nothing found.', open: 'Open', close: 'Close', sources: 'Sources', copy: 'Copy', copied: 'Copied',
    lead: '42 short hadiths that gather the foundations of the religion — with the Arabic text, a translation, the source and the benefits.',
    how: 'Tap a card to open the hadith with its Arabic text, translation and benefits. Test yourself word by word in memorise mode, and mark what you know with “Learned”.',
    statHadith: 'hadiths', statAgreed: 'in Bukhari and Muslim', statLearned: 'learned',
    learn: 'Learned', learned: 'Learned', aboutEyebrow: 'About the book', aboutTitle: 'The book, your progress and the sources',
    mapTitle: 'Map of the hadiths', mapLead: 'Tap a number to open the hadith. Green — the ones you have learned (on this device only).', progress: 'Learned',
    chartTitle: 'Which collections the hadiths come from', chartSub: 'by the source an-Nawawi cites',
    agreed: 'Bukhari and Muslim', bukhari: 'Bukhari only', muslim: 'Muslim only', other: 'Other collections', of: 'hadiths',
    all: 'All', agreedS: 'Bukhari & Muslim', bukhariS: 'Bukhari', muslimS: 'Muslim', otherS: 'Other', fLearned: 'Learned', fNot: 'Not learned',
    filterLabel: 'Filter by source and progress', reset: 'Reset filters', random: 'Random hadith', cont: 'Continue', today: 'Hadith of the day', read: 'Read',
    gradeNote: 'Grade note', prev: 'Previous', next: 'Next', share: 'Share', memorize: 'Memorise mode', memoAr: 'Arabic text', memoTr: 'Translation',
    memoLead: 'Tap a hidden word or press “Next word”.', memoNext: 'Next word', memoAll: 'Show all', memoHide: 'Hide again',
    fsDown: 'Smaller text', fsUp: 'Larger text', keys: '← → to move, Esc to close', markLearned: 'Mark as learned',
    chartNote: 'Counted from the source line under each hadith. “Other” — at-Tirmidhi, Abu Dawud, Ibn Majah, ad-Daraqutni etc.' },
  ru: { eyebrow: 'Хадисы', title: '40 хадисов ан-Навави', search: 'Поиск хадиса...', clear: 'Очистить поиск', source: 'Источник', grade: 'Степень', benefits: 'Польза', none: 'Ничего не найдено.', open: 'Открыть', close: 'Закрыть', sources: 'Источники', copy: 'Копировать', copied: 'Скопировано',
    lead: '42 кратких хадиса, собравших основы религии, — с арабским текстом, переводом, источником и пользой.',
    how: 'Нажмите на карточку — хадис откроется с арабским текстом, переводом и пользой. Проверяйте себя слово за словом в режиме заучивания и отмечайте выученное кнопкой «Выучено».',
    statHadith: 'хадиса', statAgreed: 'у Бухари и Муслима', statLearned: 'выучено',
    learn: 'Выучено', learned: 'Выучено', aboutEyebrow: 'О книге', aboutTitle: 'Книга, прогресс и источники',
    mapTitle: 'Карта хадисов', mapLead: 'Нажмите на номер — хадис откроется. Зелёные — выученные (только на этом устройстве).', progress: 'Выучено',
    chartTitle: 'Из каких сборников хадисы', chartSub: 'по источнику, который указал ан-Навави',
    agreed: 'Бухари и Муслим', bukhari: 'Только Бухари', muslim: 'Только Муслим', other: 'Другие сборники', of: 'хадисов',
    all: 'Все', agreedS: 'Бухари и Муслим', bukhariS: 'Бухари', muslimS: 'Муслим', otherS: 'Другие', fLearned: 'Выученные', fNot: 'Невыученные',
    filterLabel: 'Фильтр по источнику и прогрессу', reset: 'Сбросить фильтры', random: 'Случайный хадис', cont: 'Продолжить', today: 'Хадис дня', read: 'Читать',
    gradeNote: 'О степени', prev: 'Предыдущий', next: 'Следующий', share: 'Поделиться', memorize: 'Режим заучивания', memoAr: 'Арабский текст', memoTr: 'Перевод',
    memoLead: 'Нажмите на скрытое слово или на кнопку «Следующее слово».', memoNext: 'Следующее слово', memoAll: 'Показать всё', memoHide: 'Скрыть снова',
    fsDown: 'Уменьшить шрифт', fsUp: 'Увеличить шрифт', keys: '← → — переход между хадисами', markLearned: 'Отметить как выученный',
    chartNote: 'Подсчитано по строке источника под каждым хадисом. «Другие» — ат-Тирмизи, Абу Дауд, Ибн Маджа, ад-Даракутни и др.' },
  ar: { eyebrow: 'الحديث', title: 'الأربعون النووية', search: 'ابحث في الأحاديث...', clear: 'مسح البحث', source: 'التخريج', grade: 'الدرجة', benefits: 'من فوائد الحديث', none: 'لم يُعثر على شيء.', open: 'فتح', close: 'إغلاق', sources: 'المصادر', copy: 'نسخ', copied: 'تم النسخ',
    lead: 'اثنان وأربعون حديثًا جامعًا لأصول الدين، بنصها وتخريجها وفوائدها.',
    how: 'اضغط على البطاقة ليُفتح الحديث بنصه وتخريجه وفوائده، واختبر حفظك كلمةً كلمةً في وضع الحفظ، وعلِّم ما حفظته بزر «حفظته».',
    statHadith: 'حديثًا', statAgreed: 'في الصحيحين', statLearned: 'محفوظ',
    learn: 'حفظته', learned: 'محفوظ', aboutEyebrow: 'عن الكتاب', aboutTitle: 'الكتاب وتقدّمك والمصادر',
    mapTitle: 'خريطة الأحاديث', mapLead: 'اضغط على الرقم ليُفتح الحديث. الأخضر: ما حفظته (على هذا الجهاز فقط).', progress: 'المحفوظ',
    chartTitle: 'من أي كتب هذه الأحاديث', chartSub: 'بحسب تخريج النووي',
    agreed: 'البخاري ومسلم', bukhari: 'البخاري وحده', muslim: 'مسلم وحده', other: 'كتب أخرى', of: 'حديثًا',
    all: 'الكل', agreedS: 'البخاري ومسلم', bukhariS: 'البخاري', muslimS: 'مسلم', otherS: 'أخرى', fLearned: 'المحفوظة', fNot: 'غير المحفوظة',
    filterLabel: 'التصفية حسب التخريج والحفظ', reset: 'إلغاء التصفية', random: 'حديث عشوائي', cont: 'تابِع', today: 'حديث اليوم', read: 'اقرأ',
    gradeNote: 'ملاحظة في الدرجة', prev: 'السابق', next: 'التالي', share: 'مشاركة', memorize: 'وضع الحفظ', memoAr: 'النص العربي', memoTr: 'الترجمة',
    memoLead: 'اضغط على كلمة مخفية أو على زر «الكلمة التالية».', memoNext: 'الكلمة التالية', memoAll: 'إظهار الكل', memoHide: 'إخفاء من جديد',
    fsDown: 'تصغير الخط', fsUp: 'تكبير الخط', keys: '← → للتنقل بين الأحاديث', markLearned: 'علِّمه محفوظًا',
    chartNote: 'محسوب من سطر التخريج تحت كل حديث. «أخرى»: الترمذي وأبو داود وابن ماجه والدارقطني وغيرهم.' },
  tr: { eyebrow: 'Hadis', title: 'Nevevî’nin Kırk Hadisi', search: 'Hadis ara...', clear: 'Aramayı temizle', source: 'Kaynak', grade: 'Derecesi', benefits: 'Faydaları', none: 'Bir şey bulunamadı.', open: 'Aç', close: 'Kapat', sources: 'Kaynaklar', copy: 'Kopyala', copied: 'Kopyalandı',
    lead: 'Dinin esaslarını toplayan 42 kısa hadis — Arapça metin, tercüme, kaynak ve faydalarıyla.',
    how: 'Bir karta dokunun — hadis Arapça metni, tercümesi ve faydalarıyla açılır. Ezber modunda metni kelime kelime açarak kendinizi sınayın, öğrendiğinizi «Öğrendim» ile işaretleyin.',
    statHadith: 'hadis', statAgreed: 'Buhârî ve Müslim’de', statLearned: 'öğrenildi',
    learn: 'Öğrendim', learned: 'Öğrenildi', aboutEyebrow: 'Kitap hakkında', aboutTitle: 'Kitap, ilerleme ve kaynaklar',
    mapTitle: 'Hadis haritası', mapLead: 'Numaraya dokunun — hadis açılır. Yeşil — öğrendikleriniz (yalnızca bu cihazda).', progress: 'Öğrenildi',
    chartTitle: 'Hadisler hangi eserlerden', chartSub: 'Nevevî’nin gösterdiği kaynağa göre',
    agreed: 'Buhârî ve Müslim', bukhari: 'Yalnız Buhârî', muslim: 'Yalnız Müslim', other: 'Diğer eserler', of: 'hadis',
    all: 'Tümü', agreedS: 'Buhârî ve Müslim', bukhariS: 'Buhârî', muslimS: 'Müslim', otherS: 'Diğer', fLearned: 'Öğrenilenler', fNot: 'Öğrenilmeyenler',
    filterLabel: 'Kaynağa ve ilerlemeye göre filtre', reset: 'Filtreleri sıfırla', random: 'Rastgele hadis', cont: 'Devam et', today: 'Günün hadisi', read: 'Oku',
    gradeNote: 'Derece notu', prev: 'Önceki', next: 'Sonraki', share: 'Paylaş', memorize: 'Ezber modu', memoAr: 'Arapça metin', memoTr: 'Tercüme',
    memoLead: 'Gizli bir kelimeye dokunun veya «Sonraki kelime» düğmesine basın.', memoNext: 'Sonraki kelime', memoAll: 'Tümünü göster', memoHide: 'Yeniden gizle',
    fsDown: 'Yazıyı küçült', fsUp: 'Yazıyı büyüt', keys: '← → geçiş, Esc kapat', markLearned: 'Öğrenildi olarak işaretle',
    chartNote: 'Her hadisin altındaki kaynak satırından sayıldı. «Diğer» — Tirmizî, Ebû Dâvûd, İbn Mâce, Dârekutnî vb.' },
}

const pick = (o, lang) => (o && (o[lang] || o.en)) || ''
const HARAKAT = /[ً-ْٰـ]/g
const norm = (s, lang) => String(s || '').replace(HARAKAT, '').toLocaleLowerCase(lang)

// Mənbə qrupu — data-dakı ingiliscə "src" sətrinin əvvəlinə görə
function srcGroup(h) {
  const s = String(h.src?.en || '')
  if (s.startsWith('al-Bukhari')) return /Muslim \d/.test(s) ? 'agreed' : 'bukhari'
  if (s.startsWith('Muslim')) return 'muslim'
  return 'other'
}
const GROUP_COUNTS = NAWAWI_40.reduce((acc, h) => { const g = srcGroup(h); acc[g] = (acc[g] || 0) + 1; return acc }, {})
const BY_N = new Map(NAWAWI_40.map(h => [h.n, h]))

// Kartdakı qısa önizləmə: tərcümədə Peyğəmbərin ﷺ sözü dırnaqla başlayırsa
// ravi zəncirini keçib oradan göstər (mətn dəyişmir, yalnız kəsilir)
function previewText(h, lang) {
  if (lang === 'ar') return h.ar
  const t = pick(h.text, lang)
  const i = t.indexOf('“')
  return i > 0 && i < t.length * 0.6 ? t.slice(i) : t
}
// "Digər" qrupunda çip üçün mənbənin ilk hissəsi (";"-dən əvvəl)
const shortSrc = (h, lang) => pick(h.src, lang).split(/[;.]/)[0].trim()

const LEARN_KEY = 'nawawi40_learned_v1'
const LAST_KEY = 'nawawi40_last_v1'
const FS_KEY = 'nawawi40_fs_v1'
function readLearned() {
  const v = readJSON(LEARN_KEY, [])
  return Array.isArray(v) ? v.filter(Number.isInteger) : []
}
const FILTERS = ['all', 'agreed', 'bukhari', 'muslim', 'other', 'learned', 'notLearned']
const FS_STEPS = [0.9, 1, 1.12, 1.25, 1.4]

export default function Nawawi40Page() {
  const { lang } = useLang()
  const location = useLocation()
  const L = LABELS[lang] || LABELS.en
  const isAr = lang === 'ar'
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [cur, setCur] = useState(null)          // açıq hədisin nömrəsi (oxu pəncərəsi)
  const [copied, setCopied] = useState('')      // 'text' | 'share'
  const [memo, setMemo] = useState(false)
  const [memoTarget, setMemoTarget] = useState('ar')
  const [fs, setFs] = useState(() => { const v = readJSON(FS_KEY, 1); return Number.isInteger(v) && v >= 0 && v < FS_STEPS.length ? v : 1 })
  const [last, setLast] = useState(() => { const v = readJSON(LAST_KEY, 0); return BY_N.has(v) ? v : 0 })
  const [learned, setLearned] = useState(readLearned)
  const learnedSet = useMemo(() => new Set(learned), [learned])
  const today = NAWAWI_40[dayIndex(NAWAWI_40.length)]

  // #h-12 → 12-ci hədisin oxu pəncərəsi açılır. Hash cari girişdən götürülür
  // (bağlananda Geri ilə dönülən giriş hash-siz qalır), pəncərə açıq ikən
  // ünvanda yenidən yazılır — paylaşılan keçidlər işləməyə davam edir.
  useEffect(() => {
    const m = /^#h-(\d+)$/.exec(location.hash || '')
    if (!m || !BY_N.has(Number(m[1]))) return
    const n = Number(m[1])
    try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search) } catch { /* */ }
    requestAnimationFrame(() => document.getElementById(`h-${n}`)?.scrollIntoView({ block: 'center' }))
    setCur(n)
  }, [location.hash])

  // Açıq hədis → ünvanda #h-N (Geri girişi ReaderDialog-da qoyulur — ondan sonra)
  useEffect(() => {
    if (cur == null) return
    try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#h-${cur}`) } catch { /* */ }
    writeJSON(LAST_KEY, cur)
    setLast(cur)
  }, [cur])

  const close = useCallback(() => {
    setCur(null)
    setMemo(false)
    try {
      if (/^#h-\d+$/.test(window.location.hash)) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    } catch { /* */ }
  }, [])

  const searched = useMemo(() => {
    const s = norm(q.trim(), lang)
    if (!s) return NAWAWI_40
    return NAWAWI_40.filter(h => String(h.n) === s || [pick(h.title, lang), h.ar, pick(h.text, lang), pick(h.src, lang)].some(v => norm(v, lang).includes(s)))
  }, [q, lang])
  const matches = useCallback((h, f) => {
    if (f === 'all') return true
    if (f === 'learned') return learnedSet.has(h.n)
    if (f === 'notLearned') return !learnedSet.has(h.n)
    return srcGroup(h) === f
  }, [learnedSet])
  const list = useMemo(() => searched.filter(h => matches(h, filter)), [searched, filter, matches])
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f, searched.filter(h => matches(h, f)).length])), [searched, matches])

  const toggleLearned = useCallback((n) => setLearned(prev => {
    const next = prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b)
    writeJSON(LEARN_KEY, next)
    return next
  }), [])

  // Əvvəlki/növbəti — açıq hədis cari süzgəcdədirsə onun içində, yoxsa bütün kitabda
  const nav = cur != null && list.some(h => h.n === cur) ? list : NAWAWI_40
  const idx = nav.findIndex(h => h.n === cur)
  const go = (d) => { const h = nav[idx + d]; if (h) { setCur(h.n); setCopied('') } }
  const random = () => {
    const pool = (list.length ? list : NAWAWI_40).filter(h => h.n !== cur)
    const h = pool[Math.floor(Math.random() * pool.length)] || NAWAWI_40[0]
    setCur(h.n)
  }
  const flash = (k) => { setCopied(k); setTimeout(() => setCopied(c => (c === k ? '' : c)), 1800) }
  const h = cur != null ? BY_N.get(cur) : null
  const shareUrl = h ? `${window.location.origin}${window.location.pathname}#h-${h.n}` : ''
  const copy = async () => {
    if (!h) return
    if (await copyText([h.ar, !isAr && pick(h.text, lang), `— ${pick(h.src, lang)}`, shareUrl].filter(Boolean).join('\n\n'))) flash('text')
  }
  const share = async () => {
    if (!h) return
    const r = await shareOrCopy({ title: `${L.title} — ${h.n}. ${pick(h.title, lang)}`, text: `${pick(h.title, lang)}\n\n${h.ar}`, url: shareUrl })
    if (r === 'copied') flash('share')
  }
  const setFont = (d) => setFs(v => { const n = Math.min(FS_STEPS.length - 1, Math.max(0, v + d)); writeJSON(FS_KEY, n); return n })

  const learnedCount = NAWAWI_40.filter(x => learnedSet.has(x.n)).length
  const groupLabel = (x) => {
    const g = srcGroup(x)
    return g === 'other' ? shortSrc(x, lang) : L[`${g}S`]
  }
  const fLabel = { all: L.all, agreed: L.agreedS, bukhari: L.bukhariS, muslim: L.muslimS, other: L.otherS, learned: L.fLearned, notLearned: L.fNot }
  const resetAll = () => { setQ(''); setFilter('all') }
  const lastH = last ? BY_N.get(last) : null

  return (
    <div className="nw-page">
      <header className="ui-page-hero ui-page-hero--split nw-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{L.eyebrow}</span>
            <h1 className="ui-display">{L.title}</h1>
            {!isAr && <p className="nw-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الأربعون النووية</p>}
            <p className="ui-lead">{L.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {L.how}</p>
          </div>
          {/* Sağda: irəliləyiş halqası + açar rəqəmlər + davam et (kart) */}
          <div className="ui-page-hero__aside">
            <div className="ui-card nw-hero__card">
              <ProgressRing value={learnedCount} max={NAWAWI_40.length} size={88} thickness={9}
                label={L.progress} sub={`⁦${learnedCount} / ${NAWAWI_40.length}⁩`} />
              <ul className="ui-page-hero__stats nw-hero__stats">
                <li><b className="ui-num">{NAWAWI_40.length}</b><span>{L.statHadith}</span></li>
                <li><b className="ui-num">{GROUP_COUNTS.agreed || 0}</b><span>{L.statAgreed}</span></li>
              </ul>
              <div className="nw-hero__actions">
                {lastH && (
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm nw-hero__btn" onClick={() => setCur(lastH.n)}>
                    <Icon name="play" className="ui-btn__icon ui-flip-rtl" /> {L.cont} · <span className="ui-num">{lastH.n}</span>
                  </button>
                )}
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm nw-hero__btn" onClick={random}>
                  <Icon name="sparkle" className="ui-btn__icon" /> {L.random}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container nw-layout nw-layout--list">
          {/* Günün hədisi — tarixə görə sabit seçim */}
          <article className="ui-card nw-today" aria-labelledby="nw-today-h">
            <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
            <div className="nw-today__meta">
              <span className="ui-badge ui-badge--accent"><Icon name="sun" size={13} /> {L.today}</span>
              <span className="nw-today__n ui-num">№ {today.n}</span>
            </div>
            <h2 id="nw-today-h" className="nw-today__title">{pick(today.title, lang)}</h2>
            <p className="nw-today__ar ui-arabic" lang="ar" dir="rtl">{today.ar}</p>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm nw-today__btn" onClick={() => setCur(today.n)}>
              {L.read} <Icon name="chevron" className="ui-btn__icon ui-flip-rtl" />
            </button>
          </article>

          <div className="nw-toolbar">
            <div className="nw-toolbar__row">
              <div className="nw-search">
                <Icon name="search" size={19} className="nw-search__icon" />
                <input className="ui-input nw-search__input" type="search" aria-label={L.search} placeholder={L.search}
                  enterKeyHint="search" value={q} onChange={e => setQ(e.target.value)} />
                {q && (
                  <button type="button" className="ui-icon-btn nw-search__clear" onClick={() => setQ('')} aria-label={L.clear} title={L.clear}>
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
              <span className="nw-toolbar__count ui-num" aria-live="polite">{list.length} {L.statHadith}</span>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm nw-toolbar__btn" onClick={random}>
                <Icon name="sparkle" className="ui-btn__icon" /> {L.random}
              </button>
            </div>
            <div className="nw-filters" role="group" aria-label={L.filterLabel}>
              {FILTERS.map(f => (
                <button key={f} type="button" className={`ui-chip nw-chip nw-chip--${f}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {(f === 'learned') && <Icon name="check" size={14} />}
                  {fLabel[f]} <span className="nw-chip__n ui-num">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <div className="ui-card ui-empty nw-empty" role="status">
              <Icon name="search" />
              <strong>{L.none}</strong>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={resetAll}>
                <Icon name="refresh" className="ui-btn__icon" /> {L.reset}
              </button>
            </div>
          ) : (
            <ol className="nw-grid">
              {list.map(x => {
                const isLearned = learnedSet.has(x.n)
                const g = srcGroup(x)
                return (
                  <li key={x.n} id={`h-${x.n}`} className={`ui-card nw-card${isLearned ? ' is-learned' : ''}${cur === x.n ? ' is-current' : ''}`}>
                    <div className="nw-card__top">
                      <span className="nw-card__n ui-num" aria-hidden="true">{x.n}</span>
                      <span className={`ui-badge nw-src nw-src--${g}`} title={pick(x.src, lang)}>{groupLabel(x)}</span>
                      <button type="button" className={`nw-card__learn${isLearned ? ' is-on' : ''}`} aria-pressed={isLearned}
                        onClick={() => toggleLearned(x.n)} aria-label={`${L.markLearned}: ${x.n}. ${pick(x.title, lang)}`} title={isLearned ? L.learned : L.markLearned}>
                        <Icon name="check" size={16} />
                      </button>
                    </div>
                    <h3 className="nw-card__title">
                      <button type="button" className="nw-card__open" onClick={() => setCur(x.n)}>
                        <span className="ui-sr-only">{x.n}. </span>{pick(x.title, lang)}
                      </button>
                    </h3>
                    <p className={`nw-card__preview${isAr ? ' ui-arabic' : ''}`} lang={isAr ? 'ar' : undefined} dir={isAr ? 'rtl' : undefined}>{previewText(x, lang)}</p>
                    <div className="nw-card__foot">
                      {x.grade && <span className="ui-badge ui-badge--accent nw-card__grade"><Icon name="info" size={12} /> {L.gradeNote}</span>}
                      {isLearned && <span className="ui-badge ui-badge--brand"><Icon name="check" size={12} /> {L.learned}</span>}
                      <span className="nw-card__read" aria-hidden="true">{L.read} <Icon name="chevron" size={14} className="ui-flip-rtl" /></span>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      <section className="ui-section ui-section--alt nw-about" aria-labelledby="nw-about-h">
        <div className="ui-container nw-layout nw-layout--wide">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{L.aboutEyebrow}</span>
            <h2 id="nw-about-h" className="ui-title ui-title--sm">{L.aboutTitle}</h2>
            <p className="nw-about__intro">{pick(NAWAWI_INTRO, lang)}</p>
          </div>

          <div className="nw-about__grid">
            <div className="ui-card nw-map">
              <div className="nw-map__head">
                <ProgressRing value={learnedCount} max={NAWAWI_40.length} size={64} thickness={7}
                  label={L.progress} sub={`⁦${learnedCount} / ${NAWAWI_40.length}⁩`} />
              </div>
              <h3 className="nw-map__title">{L.mapTitle}</h3>
              <p className="nw-map__lead">{L.mapLead}</p>
              <ol className="nw-map__grid">
                {NAWAWI_40.map(x => (
                  <li key={x.n}>
                    <button type="button" className={`nw-map__cell ui-num${learnedSet.has(x.n) ? ' is-learned' : ''}`}
                      onClick={() => setCur(x.n)} title={pick(x.title, lang)}
                      aria-label={`${x.n}. ${pick(x.title, lang)}${learnedSet.has(x.n) ? ` — ${L.learned}` : ''}`}>
                      {x.n}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <ChartFigure className="nw-chart" title={L.chartTitle} sub={L.chartSub} note={L.chartNote}>
              <Donut size={140} thickness={18} format={(v) => `${v} ${L.of}`}
                center={{ value: String(NAWAWI_40.length), label: L.statHadith }}
                segments={[
                  { key: 'agreed', label: L.agreed, value: GROUP_COUNTS.agreed || 0, tone: 1 },
                  { key: 'bukhari', label: L.bukhari, value: GROUP_COUNTS.bukhari || 0, tone: 2 },
                  { key: 'muslim', label: L.muslim, value: GROUP_COUNTS.muslim || 0, tone: 3 },
                  { key: 'other', label: L.other, value: GROUP_COUNTS.other || 0, tone: 'muted' },
                ]} />
            </ChartFigure>
          </div>

          {NAWAWI_SOURCES?.length > 0 && (
            <div className="nw-sources" aria-labelledby="nw-sources-h">
              <h3 id="nw-sources-h" className="nw-sources__title">{L.sources}</h3>
              <ul>
                {NAWAWI_SOURCES.map((s, i) => (
                  <li key={i}>
                    <Icon name={s.url ? 'external' : 'books'} size={15} />
                    {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto" lang={guessLang(s.label)}>{s.label}</a> : <span dir="auto" lang={guessLang(s.label)}>{s.label}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Oxu pəncərəsi — ərəbcə mətn, tərcümə, mənbə, dərəcə, faydalar */}
      <ReaderDialog
        open={!!h}
        onClose={close}
        onPrev={idx > 0 ? () => go(-1) : undefined}
        onNext={idx >= 0 && idx < nav.length - 1 ? () => go(1) : undefined}
        labelledBy="nw-reader-title"
        position={idx >= 0 ? `${idx + 1} / ${nav.length}` : null}
        contentKey={cur}
        className="nw-reader"
        labels={{ close: L.close, prev: L.prev, next: L.next }}
        head={h && (
          <>
            <span className="nw-card__n nw-card__n--solid ui-num">{h.n}</span>
            <span className={`ui-badge nw-src nw-src--${srcGroup(h)}`}>{groupLabel(h)}</span>
            {learnedSet.has(h.n) && <span className="ui-badge ui-badge--brand"><Icon name="check" size={12} /> {L.learned}</span>}
          </>
        )}
        footer={h && (
          <button type="button" className={`ui-btn ui-btn--sm ${learnedSet.has(h.n) ? 'ui-btn--primary' : 'ui-btn--secondary'} nw-learn-btn`}
            aria-pressed={learnedSet.has(h.n)} onClick={() => toggleLearned(h.n)}>
            <Icon name="check" className="ui-btn__icon" /> {L.learn}
          </button>
        )}
      >
        {h && (
          <div className="nw-read" style={{ '--nw-fs': FS_STEPS[fs] }}>
            <h2 id="nw-reader-title" className="nw-read__title">{pick(h.title, lang)}</h2>
            <div className="nw-read__tools">
              <button type="button" className={`ui-chip nw-read__memo`} aria-pressed={memo} onClick={() => setMemo(m => !m)}>
                <Icon name="eye" size={15} /> {L.memorize}
              </button>
              {memo && !isAr && (
                <div className="ui-segmented nw-read__seg" role="radiogroup" aria-label={L.memorize}>
                  <button type="button" role="radio" aria-checked={memoTarget === 'ar'} onClick={() => setMemoTarget('ar')}>{L.memoAr}</button>
                  <button type="button" role="radio" aria-checked={memoTarget === 'tr'} onClick={() => setMemoTarget('tr')}>{L.memoTr}</button>
                </div>
              )}
              <span className="nw-read__spacer" />
              <div className="nw-read__fs" role="group" aria-label={`${L.fsDown} / ${L.fsUp}`}>
                <button type="button" className="ui-icon-btn" onClick={() => setFont(-1)} disabled={fs === 0} aria-label={L.fsDown} title={L.fsDown}>
                  <span aria-hidden="true" className="nw-read__a nw-read__a--sm">A</span>
                </button>
                <button type="button" className="ui-icon-btn" onClick={() => setFont(1)} disabled={fs === FS_STEPS.length - 1} aria-label={L.fsUp} title={L.fsUp}>
                  <span aria-hidden="true" className="nw-read__a">A</span>
                </button>
              </div>
            </div>
            {memo && <p className="nw-read__hint"><Icon name="info" size={14} /> {L.memoLead}</p>}

            {memo && (isAr || memoTarget === 'ar')
              ? <MemorizeText text={h.ar} lang="ar" dir="rtl" className="nw-read__ar ui-arabic" labels={{ next: L.memoNext, all: L.memoAll, hide: L.memoHide }} />
              : <p className="nw-read__ar ui-arabic" lang="ar" dir="rtl">{h.ar}</p>}
            {!isAr && (memo && memoTarget === 'tr'
              ? <MemorizeText text={pick(h.text, lang)} className="nw-read__text" labels={{ next: L.memoNext, all: L.memoAll, hide: L.memoHide }} />
              : <p className="nw-read__text">{pick(h.text, lang)}</p>)}

            <p className="nw-read__src"><Icon name="books" size={15} /> <span><strong>{L.source}:</strong> <cite>{pick(h.src, lang)}</cite></span></p>
            {h.grade && <p className="nw-read__grade"><Icon name="info" size={15} /> <span><strong>{L.grade}:</strong> {pick(h.grade, lang)}</span></p>}
            {(h.benefits?.[lang] || h.benefits?.en)?.length > 0 && (
              <div className="nw-read__benefits">
                <h3 className="nw-read__btitle"><Icon name="bulb" size={15} /> {L.benefits}</h3>
                <ul>{(h.benefits[lang] || h.benefits.en).map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
            )}
            <div className="nw-read__actions">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copy}>
                <Icon name={copied === 'text' ? 'check' : 'copy'} className="ui-btn__icon" /> {copied === 'text' ? L.copied : L.copy}
              </button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={share}>
                <Icon name={copied === 'share' ? 'check' : 'share'} className="ui-btn__icon" /> {copied === 'share' ? L.copied : L.share}
              </button>
              <span className="nw-read__spacer" />
              <ReportErrorButton refText={`${L.title} №${h.n}`} kind="translation" />
            </div>
            <p className="nw-read__keys" aria-hidden="true">{L.keys}</p>
          </div>
        )}
      </ReaderDialog>
    </div>
  )
}
