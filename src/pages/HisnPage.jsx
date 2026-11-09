import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReportErrorButton from '../components/ReportErrorButton'
import { pathFor } from '../seo/routes'
import ReaderDialog from '../components/reader/ReaderDialog'
import { copyText, readJSON, shareOrCopy, writeJSON } from '../components/reader/share'
import '../styles/HisnPage.css'
// Dizayn v6 (src/motion): fəsil kartı → oxu pəncərəsi morph (layoutId), grid növbə ilə,
// hero rəqəmləri sayğacla.
import { m } from 'motion/react'
import { ExpandableGroup, useMorphId, morphId } from '../motion/ExpandableCard'
import { Stagger } from '../motion/Stagger'
import { variantFor } from '../motion/Reveal'
import { SPRING } from '../motion/presets'
import NumberTicker from '../motion/NumberTicker'
import { pickUi } from '../utils/uiText'
import { adhkarProgress, partNow } from '../components/hisn/adhkarState'

// v5.6: səhər/axşam azkarı — tam ekran rejimi (ayrıca chunk)
const AdhkarFocus = lazy(() => import('../components/hisn/AdhkarFocus'))
const ADHKAR_CHAPTER = 28   // "Səhər və axşam zikrləri"
const AD_TXT = {
  az: { morning: 'Səhər azkarı', evening: 'Axşam azkarı', lead: 'Tam ekran: zikrlər bir-bir, sayğac və irəliləyiş. Bu gün: {d} / {n}.', start: 'Başla', cont: 'Davam et', again: 'Yenidən oxu' },
  en: { morning: 'Morning adhkar', evening: 'Evening adhkar', lead: 'Full screen: one dhikr at a time, with a counter and progress. Today: {d} / {n}.', start: 'Start', cont: 'Continue', again: 'Read again' },
  ru: { morning: 'Утренние зикры', evening: 'Вечерние зикры', lead: 'Полный экран: зикры по одному, со счётчиком и прогрессом. Сегодня: {d} / {n}.', start: 'Начать', cont: 'Продолжить', again: 'Прочитать снова' },
  ar: { morning: 'أذكار الصباح', evening: 'أذكار المساء', lead: 'ملء الشاشة: ذكر بعد ذكر مع العدّاد والتقدّم. اليوم: {d} / {n}.', start: 'ابدأ', cont: 'تابِع', again: 'اقرأ مجددًا' },
  tr: { morning: 'Sabah zikirleri', evening: 'Akşam zikirleri', lead: 'Tam ekran: zikirler tek tek, sayaç ve ilerlemeyle. Bugün: {d} / {n}.', start: 'Başla', cont: 'Devam et', again: 'Yeniden oku' },
}

/* ══════════════════════════════════════════════════════════════════
   HİSNUL-MÜSLİM — /hisnul-muslim
   Səid ibn Əli əl-Qəhtaninin "Hisnul-Müslim" kitabı TAM: 132 fəsil, hər
   zikrin ərəb mətni, tərcüməsi, təkrar sayı və kitabdakı təxric (mənbə).

   Məlumat: public/data/hisn/<dil>.json (scripts/build-hisn.mjs qurur) —
   səhifə açılanda yalnız cari dilin faylı yüklənir. "Nə vaxt nə deyim?"
   axtarışı fəsil adları və mətnlər üzrə işləyir. Sayğac — toxunduqca
   azalır (zikri saymaq üçün), vəziyyət yadda saxlanmır.

   Dizayn v3.2: fəsillər KART GRID-dədir (nömrə, vəziyyət çipi, başlıq,
   ərəbcə ad, ilk zikrin 2 sətirlik önizləməsi, zikr sayı, ulduz). Kart
   klikdə fəsil oxu pəncərəsində (ReaderDialog) açılır: zikrlər, sayğac,
   kopyala/paylaş; əvvəlki/növbəti fəsil, ←/→/Esc. /hisnul-muslim#hs-27
   həmin fəsli açır. localStorage: "hisn_favs_v1" (ulduzlu fəsillər),
   "hisn_last_v1" (son açılan fəsil) — yalnız bu cihazda.
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: {
    eyebrow: 'Dua və zikr', title: 'Hisnul-Müslim',
    subtitle: 'Kitab və Sünnədən gündəlik zikrlər və dualar — Səid əl-Qəhtaninin "Hisnul-Müslim" kitabı tam şəkildə: ərəb mətni, tərcüməsi və mənbəsi ilə.',
    search: 'Nə vaxt nə deyim? (məs. yağış, yuxu, səfər)', clear: 'Axtarışı təmizlə', chapters: 'Fəsillər',
    results: (n) => `${n} fəsil tapıldı`, none: 'Heç nə tapılmadı. Başqa söz yoxlayın.',
    loading: 'Yüklənir…', error: 'Məlumat yüklənmədi. İnternet bağlantısını yoxlayıb yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    source: 'Mənbə', times: (n) => `${n} dəfə`, tap: 'Saymaq üçün toxunun', done: 'Tamamlandı', reset: 'Sıfırla',
    copy: 'Kopyala', copied: 'Kopyalandı', top: 'Yuxarı', author: 'Səid ibn Əli ibn Vəhf əl-Qəhtani',
    note: 'Tərcümə ərəb əslindən Muslims.cc tərəfindən süni intellektin köməyi ilə hazırlanıb və redaktə olunur. Dua ərəbcə oxunmalıdır — tərcümə mənanı anlamaq üçündür.',
    count: (n) => `${n} fəsil`,
  },
  en: {
    eyebrow: 'Dua & dhikr', title: 'Hisn al-Muslim',
    subtitle: 'Daily remembrance and supplications from the Quran and Sunnah — the complete "Fortress of the Muslim" by Sa‘id al-Qahtani, with Arabic text, translation and sources.',
    search: 'What do I say when…? (e.g. rain, sleep, travel)', clear: 'Clear search', chapters: 'Chapters',
    results: (n) => `${n} ${n === 1 ? 'chapter' : 'chapters'} found`, none: 'Nothing found. Try another word.',
    loading: 'Loading…', error: 'The data could not be loaded. Check your connection and try again.', retry: 'Try again',
    source: 'Source', times: (n) => `${n} ${n === 1 ? 'time' : 'times'}`, tap: 'Tap to count', done: 'Done', reset: 'Reset',
    copy: 'Copy', copied: 'Copied', top: 'Top', author: 'Sa‘id ibn Ali ibn Wahf al-Qahtani',
    note: 'The translation was prepared from the Arabic original by Muslims.cc with the help of AI and is being reviewed. Supplications are said in Arabic — the translation helps you understand the meaning.',
    count: (n) => `${n} chapters`,
  },
  ru: {
    eyebrow: 'Дуа и зикр', title: 'Хиснуль-муслим',
    subtitle: 'Ежедневные поминания и мольбы из Корана и Сунны — полная «Крепость мусульманина» Саида аль-Кахтани: арабский текст, перевод и источники.',
    search: 'Что говорить, когда…? (дождь, сон, поездка)', clear: 'Очистить поиск', chapters: 'Главы',
    results: (n) => `Найдено глав: ${n}`, none: 'Ничего не найдено. Попробуйте другое слово.',
    loading: 'Загрузка…', error: 'Не удалось загрузить данные. Проверьте подключение и повторите попытку.', retry: 'Повторить',
    source: 'Источник', times: (n) => `${n} раз`, tap: 'Нажмите, чтобы считать', done: 'Готово', reset: 'Сбросить',
    copy: 'Копировать', copied: 'Скопировано', top: 'Наверх', author: 'Саид ибн Али ибн Вахф аль-Кахтани',
    note: 'Перевод подготовлен Muslims.cc с арабского оригинала с помощью ИИ и проходит редактуру. Мольбы произносятся на арабском — перевод помогает понять смысл.',
    count: (n) => `Глав: ${n}`,
  },
  ar: {
    eyebrow: 'الدعاء والذكر', title: 'حصن المسلم',
    subtitle: 'حصن المسلم من أذكار الكتاب والسنة — لسعيد بن علي بن وهف القحطاني، كاملًا مع التخريج.',
    search: 'ماذا أقول عند…؟ (المطر، النوم، السفر)', clear: 'مسح البحث', chapters: 'الأبواب',
    results: (n) => `عدد الأبواب: ${n}`, none: 'لم يُعثر على شيء. جرّب كلمة أخرى.',
    loading: 'جارٍ التحميل…', error: 'تعذّر تحميل البيانات. تحقّق من الاتصال وأعد المحاولة.', retry: 'أعد المحاولة',
    source: 'التخريج', times: (n) => `${n} مرات`, tap: 'اضغط للعدّ', done: 'تمّ', reset: 'إعادة',
    copy: 'نسخ', copied: 'تم النسخ', top: 'إلى الأعلى', author: 'سعيد بن علي بن وهف القحطاني',
    note: '', count: (n) => `${n} بابًا`,
  },
  tr: {
    eyebrow: 'Dua ve zikir', title: 'Hısnu’l-Müslim',
    subtitle: 'Kur’an ve Sünnet’ten günlük zikir ve dualar — Saîd el-Kahtânî’nin “Hısnu’l-Müslim” kitabı eksiksiz: Arapça metin, meal ve kaynaklarıyla.',
    search: 'Ne zaman ne derim? (yağmur, uyku, yolculuk)', clear: 'Aramayı temizle', chapters: 'Bölümler',
    results: (n) => `${n} bölüm bulundu`, none: 'Bir şey bulunamadı. Başka bir kelime deneyin.',
    loading: 'Yükleniyor…', error: 'Veriler yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar dene',
    source: 'Kaynak', times: (n) => `${n} kez`, tap: 'Saymak için dokunun', done: 'Tamamlandı', reset: 'Sıfırla',
    copy: 'Kopyala', copied: 'Kopyalandı', top: 'Yukarı', author: 'Saîd b. Ali b. Vehf el-Kahtânî',
    note: 'Meal, Arapça aslından Muslims.cc tarafından yapay zekâ yardımıyla hazırlanmıştır ve gözden geçirilmektedir. Dualar Arapça okunur — meal anlamı kavramak içindir.',
    count: (n) => `${n} bölüm`,
  },
}

// ── "Nə vaxt nə deyim?" — kitabın 133 fəsli 11 həyat vəziyyətinə bölünür
//    (fəsil id-ləri public/data/hisn/*.json-dakı ardıcıllıqla) ──
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const CATS = [
  { id: 'day', icon: 'sunrise', ids: [2, ...range(28, 32)],
    t: { az: 'Səhər, axşam, yuxu', en: 'Morning, evening, sleep', ru: 'Утро, вечер, сон', ar: 'الصباح والمساء والنوم', tr: 'Sabah, akşam, uyku' } },
  { id: 'prayer', icon: 'prayer', ids: [9, 10, ...range(13, 27), 33, 34],
    t: { az: 'Dəstəmaz və namaz', en: 'Wudu and prayer', ru: 'Омовение и намаз', ar: 'الوضوء والصلاة', tr: 'Abdest ve namaz' } },
  { id: 'home', icon: 'home', ids: [...range(3, 8), 11, 12],
    t: { az: 'Ev, geyim, ayaqyolu', en: 'Home, clothing, toilet', ru: 'Дом, одежда, уборная', ar: 'البيت واللباس والخلاء', tr: 'Ev, giyim, tuvalet' } },
  { id: 'food', icon: 'ramadan', ids: range(69, 77),
    t: { az: 'Yemək və oruc', en: 'Food and fasting', ru: 'Еда и пост', ar: 'الطعام والصيام', tr: 'Yemek ve oruç' } },
  { id: 'distress', icon: 'shield', ids: [...range(35, 47), 83, 125, 127, 129],
    t: { az: 'Qəm, qorxu, çətinlik', en: 'Worry, fear, hardship', ru: 'Печаль, страх, трудности', ar: 'الهم والخوف والكرب', tr: 'Keder, korku, sıkıntı' } },
  { id: 'people', icon: 'group', ids: [48, 49, ...range(78, 82), ...range(84, 95), 109, 110, ...range(113, 115), 126],
    t: { az: 'Ailə və insanlar', en: 'Family and people', ru: 'Семья и люди', ar: 'الأسرة والناس', tr: 'Aile ve insanlar' } },
  { id: 'sick', icon: 'user', ids: range(50, 61),
    t: { az: 'Xəstəlik və vəfat', en: 'Illness and death', ru: 'Болезнь и смерть', ar: 'المرض والموت', tr: 'Hastalık ve vefat' } },
  { id: 'nature', icon: 'drop', ids: [...range(62, 68), 111, 112],
    t: { az: 'Külək, yağış, hilal', en: 'Wind, rain, new moon', ru: 'Ветер, дождь, новолуние', ar: 'الريح والمطر والهلال', tr: 'Rüzgâr, yağmur, hilal' } },
  { id: 'travel', icon: 'compass', ids: range(96, 106),
    t: { az: 'Səfər', en: 'Travel', ru: 'Поездка', ar: 'السفر', tr: 'Yolculuk' } },
  { id: 'hajj', icon: 'hajjguide', ids: [...range(116, 122), 128],
    t: { az: 'Həcc, ümrə, qurban', en: 'Hajj, umrah, sacrifice', ru: 'Хадж, умра, жертва', ar: 'الحج والعمرة والذبح', tr: 'Hac, umre, kurban' } },
  { id: 'virtue', icon: 'sparkle', ids: [1, 107, 108, 123, 124, ...range(130, 133)],
    t: { az: 'Zikrin fəziləti, istiğfar', en: 'Virtue of dhikr, istighfar', ru: 'Достоинство зикра, истигфар', ar: 'فضل الذكر والاستغفار', tr: 'Zikrin fazileti, istiğfar' } },
]
const CAT_OF = new Map(CATS.flatMap(c => c.ids.map(id => [id, c.id])))
// Ən çox lazım olan fəsillər — bir toxunuşla: səhər-axşam, yuxu, salamdan sonra, oyanış, səfər, qəm
const QUICK = [28, 29, 26, 2, 97, 35]

const UI_EXTRA = {
  az: { favs: 'Seçilmişlər', favAdd: 'Seçilmişlərə əlavə et', favRemove: 'Seçilmişlərdən çıxar', favEmpty: 'Fəslin kartındakı ulduz düyməsi ilə onu seçilmişlərə əlavə edin.', all: 'Hamısı', cont: 'Davam et', read: 'Oxu', prev: 'Əvvəlki fəsil', next: 'Növbəti fəsil', close: 'Bağla', share: 'Paylaş', copyAll: 'Fəsli kopyala', filterLabel: 'Göstərmə', how: 'Vəziyyəti seçin (məs. «Səfər») və ya axtarışa yazın, sonra fəslin kartına toxunun — zikrlər oxu pəncərəsində açılır. Təkrar sayı olan zikrdə dairəyə toxunaraq sayın, lazım olan fəsilləri ulduzla saxlayın.', cats: 'Nə vaxt nə deyim?', catsLead: '133 fəsil 11 həyat vəziyyətinə bölünüb — birini seçin.', quick: 'Tez açılanlar', items: 'zikr', chapters: 'fəsil', situations: 'vəziyyət', back: 'Hamısını göstər', related: 'Əlaqəli bölmələr' },
  en: { favs: 'Saved', favAdd: 'Save chapter', favRemove: 'Remove from saved', favEmpty: 'Save a chapter with the star button on its card.', all: 'All', cont: 'Continue', read: 'Read', prev: 'Previous chapter', next: 'Next chapter', close: 'Close', share: 'Share', copyAll: 'Copy chapter', filterLabel: 'Show', how: 'Pick a situation (e.g. “Travel”) or type in the search, then tap a chapter card — its remembrances open in a reader. Where a dhikr is repeated, tap the circle to count; save the chapters you need with the star.', cats: 'What do I say when…?', catsLead: '133 chapters grouped into 11 life situations — pick one.', quick: 'Quick access', items: 'adhkar', chapters: 'chapters', situations: 'situations', back: 'Show all', related: 'Related sections' },
  ru: { favs: 'Избранное', favAdd: 'Добавить в избранное', favRemove: 'Убрать из избранного', favEmpty: 'Добавляйте главы в избранное звёздочкой на карточке.', all: 'Все', cont: 'Продолжить', read: 'Читать', prev: 'Предыдущая глава', next: 'Следующая глава', close: 'Закрыть', share: 'Поделиться', copyAll: 'Копировать главу', filterLabel: 'Показать', how: 'Выберите ситуацию (например, «Поездка») или введите слово в поиск, затем нажмите на карточку главы — поминания откроются в окне чтения. Если зикр повторяется, считайте, нажимая на круг; нужные главы сохраняйте звёздочкой.', cats: 'Что говорить, когда…?', catsLead: '133 главы разделены на 11 жизненных ситуаций — выберите одну.', quick: 'Быстрый доступ', items: 'зикров', chapters: 'глав', situations: 'ситуаций', back: 'Показать все', related: 'Связанные разделы' },
  ar: { favs: 'المحفوظات', favAdd: 'احفظ الباب', favRemove: 'أزله من المحفوظات', favEmpty: 'احفظ الباب بزر النجمة في بطاقته.', all: 'الكل', cont: 'تابِع', read: 'اقرأ', prev: 'الباب السابق', next: 'الباب التالي', close: 'إغلاق', share: 'مشاركة', copyAll: 'انسخ الباب', filterLabel: 'العرض', how: 'اختر الموقف (مثل «السفر») أو اكتب في البحث، ثم اضغط على بطاقة الباب لتظهر أذكاره. وما يُكرَّر من الأذكار اضغط على الدائرة لعدّه، واحفظ ما تحتاجه من الأبواب بزر النجمة.', cats: 'ماذا أقول عند…؟', catsLead: '133 بابًا مقسّمة على 11 موقفًا من مواقف الحياة — اختر واحدًا.', quick: 'وصول سريع', items: 'ذكرًا', chapters: 'بابًا', situations: 'موقفًا', back: 'عرض الكل', related: 'أقسام ذات صلة' },
  tr: { favs: 'Kaydedilenler', favAdd: 'Bölümü kaydet', favRemove: 'Kaydedilenlerden çıkar', favEmpty: 'Bir bölümü kartındaki yıldız düğmesiyle kaydedin.', all: 'Tümü', cont: 'Devam et', read: 'Oku', prev: 'Önceki bölüm', next: 'Sonraki bölüm', close: 'Kapat', share: 'Paylaş', copyAll: 'Bölümü kopyala', filterLabel: 'Göster', how: 'Bir durum seçin (ör. «Yolculuk») ya da aramaya yazın, sonra bölüm kartına dokunun — zikirler okuma penceresinde açılır. Tekrarlanan zikirde daireye dokunarak sayın, gerekli bölümleri yıldızla kaydedin.', cats: 'Ne zaman ne derim?', catsLead: '133 bölüm 11 hayat durumuna ayrıldı — birini seçin.', quick: 'Hızlı erişim', items: 'zikir', chapters: 'bölüm', situations: 'durum', back: 'Hepsini göster', related: 'İlgili bölümler' },
}
const RELATED = [
  { href: 'dhikr', icon: 'dhikr', t: { az: 'Zikr sayğacı', en: 'Dhikr counter', ru: 'Счётчик зикра', ar: 'عداد الذكر', tr: 'Zikir sayacı' }, s: { az: 'Namazdan sonrakı zikrləri ardıcıl sayın', en: 'Count the after-prayer adhkar in order', ru: 'Зикры после намаза по порядку', ar: 'أذكار ما بعد الصلاة بالترتيب', tr: 'Namaz sonrası zikirleri sırayla sayın' } },
  { href: 'duas', icon: 'duas', t: { az: 'Dualar', en: 'Duas', ru: 'Дуа', ar: 'الأدعية', tr: 'Dualar' }, s: { az: 'Mövzulara görə seçilmiş dualar', en: 'Selected duas by topic', ru: 'Избранные дуа по темам', ar: 'أدعية مختارة حسب الموضوع', tr: 'Konulara göre seçilmiş dualar' } },
  { href: 'duajournal', icon: 'duajournal', t: { az: 'Dua gündəliyi', en: 'Dua journal', ru: 'Дневник дуа', ar: 'دفتر الدعاء', tr: 'Dua günlüğü' }, s: { az: 'Duanın ədəbi və qəbul olunma vaxtları', en: 'Etiquette and times of acceptance', ru: 'Этикет и время принятия', ar: 'آداب الدعاء وأوقات الإجابة', tr: 'Duanın edebi ve kabul vakitleri' } },
]

// Axtarış: hərf registri və ərəb hərəkələri nəzərə alınmır
const HARAKAT = /[ً-ْٰـ]/g
const norm = (s, lang) => String(s || '').replace(HARAKAT, '').toLocaleLowerCase(lang)

const cache = new Map()
function loadHisn(lang) {
  if (!cache.has(lang)) {
    const p = fetch(`/data/hisn/${lang}.json`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    p.catch(() => cache.delete(lang))
    cache.set(lang, p)
  }
  return cache.get(lang)
}

/** Təkrar sayğacı: toxunduqca azalır; bitəndə yaşıl "Tamamlandı". */
function Counter({ total, L }) {
  const [left, setLeft] = useState(total)
  const done = left === 0
  return (
    <div className="hs-counter">
      <button type="button" className={`hs-counter__btn${done ? ' is-done' : ''}`}
        onClick={() => setLeft(n => Math.max(0, n - 1))} disabled={done}
        aria-label={done ? L.done : `${L.tap}: ${left} / ${total}`}>
        {done ? <Icon name="check" size={18} className="hs-counter__ok" /> : <span key={left} className="ui-num hs-counter__n">{left}</span>}
      </button>
      <span className="hs-counter__label">{done ? L.done : L.times(total)}</span>
      {left !== total && (
        <button type="button" className="ui-icon-btn hs-counter__reset" onClick={() => setLeft(total)} aria-label={L.reset} title={L.reset}>
          <Icon name="refresh" size={15} />
        </button>
      )}
    </div>
  )
}

function Item({ it, n, L, lang, isAr }) {
  const [copied, setCopied] = useState(false)
  const t = useRef(null)
  useEffect(() => () => clearTimeout(t.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText([it.ar, !isAr && it.text, it.src ? `— ${it.src}` : ''].filter(Boolean).join('\n\n'))
      setCopied(true)
      clearTimeout(t.current)
      t.current = setTimeout(() => setCopied(false), 1800)
    } catch { /* icazə yoxdur */ }
  }
  return (
    <article className="ui-card hs-item">
      <div className="hs-item__head">
        <span className="hs-item__n ui-num" aria-hidden="true">{n}</span>
        <span className="hs-item__tools">
        <ReportErrorButton compact refText={`Hisnul-Müslim №${n}`} kind="translation" />
        <button type="button" className="ui-icon-btn hs-item__copy" onClick={copy} aria-label={copied ? L.copied : L.copy} title={copied ? L.copied : L.copy}>
          <Icon name={copied ? 'check' : 'copy'} size={16} />
        </button>
        </span>
      </div>
      <p className="hs-item__ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
      {!isAr && it.text && <p className="hs-item__text">{it.text}</p>}
      <div className="hs-item__foot">
        {it.repeat > 1 && <Counter key={`${lang}-${it.repeat}`} total={it.repeat} L={L} />}
        {it.src && <p className="hs-item__src"><span>{L.source}:</span> <cite dir="auto">{it.src}</cite></p>}
      </div>
    </article>
  )
}

const FAV_KEY = 'hisn_favs_v1'
const LAST_KEY = 'hisn_last_v1'
const readIds = (k) => { const v = readJSON(k, []); return Array.isArray(v) ? v.filter(Number.isInteger) : [] }
const CAT_BY_ID = new Map(CATS.map(c => [c.id, c]))

const plainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

export default function HisnPage({ setPage }) {
  const { lang } = useLang()
  const L = pickUi(LABELS, lang, 'en')
  const X = pickUi(UI_EXTRA, lang, 'en')
  const isAr = lang === 'ar'
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [onlyFavs, setOnlyFavs] = useState(false)
  const [favs, setFavs] = useState(() => readIds(FAV_KEY))
  const [last, setLast] = useState(() => readJSON(LAST_KEY, 0))
  const [cur, setCur] = useState(null)        // açıq fəslin id-si (oxu pəncərəsi)
  const [from, setFrom] = useState(null)      // pəncərə hansı kartdan açılıb (morph)
  const morph = useMorphId(from == null ? null : `hs-${from}`)
  const morphOn = useMorphId(0) != null
  const cardV = useMemo(() => variantFor('fadeUp'), [])
  const [copied, setCopied] = useState('')
  const readerRef = useRef(null)
  const location = useLocation()
  const favSet = useMemo(() => new Set(favs), [favs])

  useEffect(() => {
    let live = true
    setStatus(s => (s === 'ok' ? s : 'loading'))
    loadHisn(lang)
      .then(d => { if (live) { setData(d); setStatus('ok') } })
      .catch(() => { if (live) setStatus('error') })
    return () => { live = false }
  }, [lang, attempt])

  const chapters = useMemo(() => data?.chapters || [], [data])
  const itemTotal = useMemo(() => chapters.reduce((s, c) => s + c.items.length, 0), [chapters])
  const catStats = useMemo(() => {
    const m = {}
    for (const c of chapters) {
      const k = CAT_OF.get(c.id) || 'virtue'
      m[k] = m[k] || { ch: 0, items: 0 }
      m[k].ch += 1
      m[k].items += c.items.length
    }
    return m
  }, [chapters])

  const filtered = useMemo(() => {
    const s = norm(q.trim(), lang)
    let out
    if (!s) out = cat === 'all' ? chapters : chapters.filter(c => (CAT_OF.get(c.id) || 'virtue') === cat)
    else out = chapters.filter(c => norm(c.title, lang).includes(s) || norm(c.titleAr, lang).includes(s)
      || c.items.some(it => norm(it.text, lang).includes(s) || norm(it.ar, lang).includes(s)))
    return onlyFavs ? out.filter(c => favSet.has(c.id)) : out
  }, [q, chapters, lang, cat, onlyFavs, favSet])

  // Nömrələmə həmişə kitabdakı ardıcıllıqla (filtrdən asılı olmasın)
  const startNum = useMemo(() => {
    const m = new Map()
    let n = 0
    for (const c of chapters) { m.set(c.id, n); n += c.items.length }
    return m
  }, [chapters])

  // Hash ilə gəlinibsə (#hs-27) — yüklənəndən sonra həmin fəslin oxu
  // pəncərəsi açılır; cari girişdən hash götürülür (Geri ilə bağlananda
  // hash-siz səhifəyə dönülür), pəncərə açıq ikən ünvanda yenidən yazılır.
  // v5.6: #adhkar — səhər/axşam azkarı tam ekranda (bildiriş də bura açır)
  const [focusPart, setFocusPart] = useState(null)
  const [, bump] = useState(0)
  useEffect(() => {
    if (status !== 'ok' || location.hash !== '#adhkar') return
    if (chapters.some(c => c.id === ADHKAR_CHAPTER)) setFocusPart(partNow())
  }, [status, location.hash, chapters])
  const closeFocus = useCallback(() => {
    setFocusPart(null)
    bump(x => x + 1)
    try { if (window.location.hash === '#adhkar') window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search) } catch { /* */ }
  }, [])

  useEffect(() => {
    if (status !== 'ok') return
    const m = /^#hs-(\d+)$/.exec(location.hash || '')
    if (!m) return
    const id = Number(m[1])
    if (!chapters.some(c => c.id === id)) return
    try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search) } catch { /* */ }
    requestAnimationFrame(() => document.getElementById(`hs-${id}`)?.scrollIntoView({ block: 'center' }))
    setCur(id)
  }, [status, location.hash, chapters])

  useEffect(() => {
    if (cur == null) return
    try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#hs-${cur}`) } catch { /* */ }
    writeJSON(LAST_KEY, cur)
    setLast(cur)
  }, [cur])

  const closeReader = useCallback(() => {
    setCur(null)
    setFrom(null)
    try {
      if (/^#hs-\d+$/.test(window.location.hash)) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    } catch { /* */ }
  }, [])
  const toggleFav = useCallback((id) => setFavs(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].sort((a, b) => a - b)
    writeJSON(FAV_KEY, next)
    return next
  }), [])

  const pickCat = (id) => {
    setCat(c => (c === id ? 'all' : id))
    setQ('')
    requestAnimationFrame(() => readerRef.current?.scrollIntoView({ block: 'start' }))
  }
  const openChapter = (id) => setCur(id)
  const flash = (k) => { setCopied(k); setTimeout(() => setCopied(c => (c === k ? '' : c)), 1800) }
  const nav = cur != null && filtered.some(c => c.id === cur) ? filtered : chapters
  const navIdx = nav.findIndex(c => c.id === cur)
  const chap = cur != null ? chapters.find(c => c.id === cur) : null
  const chapUrl = chap ? `${window.location.origin}${window.location.pathname}#hs-${chap.id}` : ''
  const chapText = chap ? [chap.title, ...chap.items.map(it => [it.ar, !isAr && it.text, it.src ? `— ${it.src}` : ''].filter(Boolean).join('\n'))].join('\n\n') : ''
  const copyChapter = async () => { if (await copyText(`${chapText}\n\n${chapUrl}`)) flash('copy') }
  const shareChapter = async () => {
    if (!chap) return
    const r = await shareOrCopy({ title: `${L.title} — ${chap.title}`, text: chapText.slice(0, 1200), url: chapUrl })
    if (r === 'copied') flash('share')
  }
  const lastCh = last ? chapters.find(c => c.id === last) : null
  const curCat = CATS.find(c => c.id === cat)
  const go = (page) => (e) => { if (setPage && plainClick(e)) { e.preventDefault(); setPage(page) } }

  return (
    <ExpandableGroup id="hs-xc">
    <div className="hs-page">
      <header className="ui-page-hero hs-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          {!isAr && <p className="hs-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">حصن المسلم من أذكار الكتاب والسنة</p>}
          <p className="ui-lead">{L.subtitle}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> <span>{X.how}</span></p>
          <ul className="ui-page-hero__stats">
            <li><b className="ui-num"><NumberTicker value={chapters.length || 133} lang={lang} /></b><span>{X.chapters}</span></li>
            <li><b className="ui-num"><NumberTicker value={itemTotal || 293} lang={lang} delay={0.08} /></b><span>{X.items}</span></li>
            <li><b className="ui-num"><NumberTicker value={CATS.length} lang={lang} delay={0.16} /></b><span>{X.situations}</span></li>
          </ul>
          <p className="hs-hero__by"><Icon name="books" size={15} /> {L.author}</p>
        </div>
      </header>

      {/* v5.6: Səhər / axşam azkarı — tam ekran rejimi (saata görə) */}
      {status === 'ok' && (() => {
        const ch = chapters.find(c => c.id === ADHKAR_CHAPTER)
        if (!ch) return null
        const AD = pickUi(AD_TXT, lang, 'en')
        const part = partNow()
        const pr = adhkarProgress(part, ch.items)
        const other = part === 'morning' ? 'evening' : 'morning'
        return (
          <section className="ui-section ui-section--tight hs-adhkar">
            <div className="ui-container">
              <div className={`hs-adhkar__card hs-adhkar__card--${part}`}>
                <div className="hs-adhkar__txt">
                  <h2 className="hs-adhkar__t">{AD[part]}</h2>
                  <p className="hs-adhkar__l">{AD.lead.replace('{d}', pr.done).replace('{n}', pr.total)}</p>
                  <div className="hs-adhkar__bar" aria-hidden="true"><i style={{ width: `${(pr.done / pr.total) * 100}%` }} /></div>
                </div>
                <div className="hs-adhkar__btns">
                  <button type="button" className="ui-btn ui-btn--inverse ui-btn--lg" onClick={() => setFocusPart(part)}>
                    <Icon name="play" className="ui-btn__icon" /> {pr.done >= pr.total ? AD.again : pr.started ? AD.cont : AD.start}
                  </button>
                  <button type="button" className="ui-btn ui-btn--inverse-ghost ui-btn--sm" onClick={() => setFocusPart(other)}>{AD[other]}</button>
                </div>
              </div>
            </div>
          </section>
        )
      })()}
      {focusPart && (() => {
        const ch = chapters.find(c => c.id === ADHKAR_CHAPTER)
        return ch ? (
          <Suspense fallback={null}>
            <AdhkarFocus items={ch.items} part={focusPart} lang={lang} isAr={isAr} onClose={closeFocus} />
          </Suspense>
        ) : null
      })()}

      <section className="ui-section ui-section--tight hs-cats" aria-labelledby="hs-cats-h">
        <div className="ui-container">
          <div className="ui-section-head">
            <h2 className="ui-title ui-title--sm" id="hs-cats-h">{X.cats}</h2>
            <p className="ui-lead">{X.catsLead}</p>
          </div>
          <ul className="ui-tiles hs-tiles" data-reveal="stagger">
            {CATS.map(c => {
              const on = cat === c.id && !q.trim()
              return (
                <li key={c.id}>
                  <button type="button" className={`ui-tile ui-tile--row hs-tile${on ? ' is-active' : ''}`}
                    aria-pressed={on} onClick={() => pickCat(c.id)}>
                    <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={c.icon} /></span>
                    <span className="ui-tile__body">
                      <span className="ui-tile__title">{pickUi(c.t, lang, 'en')}</span>
                      <span className="ui-tile__text ui-num">{catStats[c.id]?.ch ?? c.ids.length} {X.chapters} · {catStats[c.id]?.items ?? '—'} {X.items}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {chapters.length > 0 && (
            <div className="hs-quick">
              <span className="hs-quick__label">{X.quick}</span>
              {QUICK.map(id => {
                const c = chapters.find(x => x.id === id)
                return c ? (
                  <a key={id} className="ui-chip hs-quick__chip" href={`#hs-${id}`}
                    onClick={(e) => { if (plainClick(e)) { e.preventDefault(); openChapter(id) } }}>{c.title}</a>
                ) : null
              })}
            </div>
          )}
        </div>
      </section>

      <div className="ui-section ui-section--tight hs-reader" ref={readerRef}>
        <div className="ui-container hs-layout">
          {/* Yapışqan alət zolağı (şüşə fon): axtarış həmişə əl altında */}
          <div className="hs-toolbar">
          <div className="hs-search">
            <Icon name="search" size={19} className="hs-search__icon" />
            <input className="ui-input hs-search__input" type="search" aria-label={L.search} placeholder={L.search}
              enterKeyHint="search" value={q} onChange={e => setQ(e.target.value)} />
            {q && (
              <button type="button" className="ui-icon-btn hs-search__clear" onClick={() => setQ('')} aria-label={L.clear} title={L.clear}>
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
          {data && <span className="hs-toolbar__count ui-num" aria-hidden="true">{filtered.length} {X.chapters} · {itemTotal} {X.items}</span>}
          {data && (
            <div className="hs-toolbar__chips" role="group" aria-label={X.filterLabel}>
              <button type="button" className="ui-chip" aria-pressed={!onlyFavs} onClick={() => setOnlyFavs(false)}>{X.all}</button>
              <button type="button" className="ui-chip" aria-pressed={onlyFavs} onClick={() => setOnlyFavs(true)}>
                <Icon name="star" size={14} /> {X.favs} <span className="hs-chip__n ui-num">{favs.length}</span>
              </button>
              {lastCh && (
                <button type="button" className="ui-chip hs-chip--cont" onClick={() => setCur(lastCh.id)}>
                  <Icon name="play" size={14} className="ui-flip-rtl" /> {X.cont}: <span className="hs-chip__t">{lastCh.title}</span>
                </button>
              )}
            </div>
          )}
          </div>
          {L.note && <p className="hs-note"><Icon name="info" size={15} /> {L.note}</p>}

          {status === 'loading' && !data && (
            <div className="hs-loading" role="status">
              {[0, 1, 2].map(i => <span key={i} className="ui-skeleton ui-skeleton--card" />)}
              <span className="ui-sr-only">{L.loading}</span>
            </div>
          )}
          {status === 'error' && !data && (
            <div className="ui-card ui-card--sunken hs-empty" role="alert">
              <p>{L.error}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAttempt(a => a + 1)}>
                <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
              </button>
            </div>
          )}

          {data && (
            <>
              {q.trim() && <p className="hs-results" role="status">{filtered.length ? L.results(filtered.length) : L.none}</p>}
              {!q.trim() && curCat && (
                <div className="hs-filterbar">
                  <span className="hs-filterbar__name">
                    <Icon name={curCat.icon} size={18} /> {pickUi(curCat.t, lang, 'en')}
                    <span className="ui-num hs-filterbar__n">{L.count(filtered.length)}</span>
                  </span>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setCat('all')}>
                    <Icon name="close" className="ui-btn__icon" /> {X.back}
                  </button>
                </div>
              )}
              {onlyFavs && filtered.length === 0 && (
                <div className="ui-card ui-empty hs-empty-favs" role="status">
                  <Icon name="star" />
                  <strong>{X.favs}</strong>
                  <span>{X.favEmpty}</span>
                </div>
              )}
              {/* Fəsillər kart grid-də; kart klikdə oxu pəncərəsi açılır */}
              <Stagger as="ol" className="hs-grid" key={`${cat}|${onlyFavs}`} step={0.04}>
                {filtered.map(c => {
                  const k = CAT_BY_ID.get(CAT_OF.get(c.id) || 'virtue')
                  const first = c.items[0]
                  const fav = favSet.has(c.id)
                  return (
                    <m.li variants={cardV} layoutId={morphOn ? morphId(`hs-${c.id}`) : undefined} transition={SPRING.soft} data-wow-off=""
                      key={c.id} id={`hs-${c.id}`} className={`ui-card hs-card${fav ? ' is-fav' : ''}`}>
                      <div className="hs-card__top">
                        <span className="hs-card__n ui-num" aria-hidden="true">{c.id}</span>
                        {k && <span className="ui-badge hs-card__cat"><Icon name={k.icon} size={12} /> {pickUi(k.t, lang, 'en')}</span>}
                        <button type="button" className={`hs-card__fav${fav ? ' is-on' : ''}`} aria-pressed={fav}
                          onClick={() => toggleFav(c.id)} aria-label={`${fav ? X.favRemove : X.favAdd}: ${c.title}`} title={fav ? X.favRemove : X.favAdd}>
                          <Icon name="star" size={17} />
                        </button>
                      </div>
                      <h2 className="hs-card__title">
                        <button type="button" className="hs-card__open" onClick={() => { setFrom(c.id); setCur(c.id) }}>
                          <span className="ui-sr-only">{c.id}. </span>{c.title}
                        </button>
                      </h2>
                      {!isAr && <p className="hs-card__ar ui-arabic" lang="ar" dir="rtl">{c.titleAr}</p>}
                      {first && <p className={`hs-card__preview${isAr ? ' ui-arabic' : ''}`} dir={isAr ? 'rtl' : undefined}>{isAr ? first.ar : (first.text || first.ar)}</p>}
                      <div className="hs-card__foot">
                        <span className="hs-card__meta ui-num">{c.items.length} {X.items}</span>
                        <span className="hs-card__read" aria-hidden="true">{X.read} <Icon name="chevron" size={14} className="ui-flip-rtl" /></span>
                      </div>
                    </m.li>
                  )
                })}
              </Stagger>
            </>
          )}
        </div>
      </div>

      <section className="ui-section ui-section--tight hs-related" aria-labelledby="hs-rel-h">
        <div className="ui-container hs-layout">
          <h2 className="ui-title ui-title--sm" id="hs-rel-h">{X.related}</h2>
          <ul className="ui-list">
            {RELATED.map(r => (
              <li key={r.href}>
                <a className="ui-list__item" href={pathFor(r.href, lang)} onClick={go(r.href)}>
                  <Icon name={r.icon} />
                  <span>{pickUi(r.t, lang, 'en')}<small>{pickUi(r.s, lang, 'en')}</small></span>
                  <Icon name="chevron" className="ui-list__chev ui-flip-rtl" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ReaderDialog
        open={!!chap}
        onClose={closeReader}
        onPrev={navIdx > 0 ? () => setCur(nav[navIdx - 1].id) : undefined}
        onNext={navIdx >= 0 && navIdx < nav.length - 1 ? () => setCur(nav[navIdx + 1].id) : undefined}
        labelledBy="hs-dlg-title"
        position={navIdx >= 0 ? `${navIdx + 1} / ${nav.length}` : null}
        contentKey={cur}
        layoutId={morph}
        className="hs-dlg"
        labels={{ close: X.close, prev: X.prev, next: X.next }}
        head={chap && (
          <>
            <span className="hs-card__n hs-card__n--solid ui-num">{chap.id}</span>
            {CAT_BY_ID.get(CAT_OF.get(chap.id) || 'virtue') && (
              <span className="ui-badge hs-card__cat">{(CAT_BY_ID.get(CAT_OF.get(chap.id) || 'virtue').t[lang]) || CAT_BY_ID.get(CAT_OF.get(chap.id) || 'virtue').t.en}</span>
            )}
          </>
        )}
        footer={chap && (
          <button type="button" className={`ui-btn ui-btn--sm ${favSet.has(chap.id) ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
            aria-pressed={favSet.has(chap.id)} onClick={() => toggleFav(chap.id)}>
            <Icon name="star" className="ui-btn__icon" /> {X.favs}
          </button>
        )}
      >
        {chap && (
          <div className="hs-dlg__body">
            <h2 id="hs-dlg-title" className="hs-dlg__title">
              {chap.title}
              {!isAr && <span className="hs-chapter__ar ui-arabic" lang="ar" dir="rtl">{chap.titleAr}</span>}
            </h2>
            <div className="hs-dlg__items">
              {chap.items.map((it, i) => <Item key={`${chap.id}-${i}`} it={it} n={it.n || (startNum.get(chap.id) || 0) + i + 1} L={L} lang={lang} isAr={isAr} />)}
            </div>
            <div className="hs-dlg__actions">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copyChapter}>
                <Icon name={copied === 'copy' ? 'check' : 'copy'} className="ui-btn__icon" /> {copied === 'copy' ? L.copied : X.copyAll}
              </button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={shareChapter}>
                <Icon name={copied === 'share' ? 'check' : 'share'} className="ui-btn__icon" /> {copied === 'share' ? L.copied : X.share}
              </button>
            </div>
          </div>
        )}
      </ReaderDialog>
    </div>
    </ExpandableGroup>
  )
}
