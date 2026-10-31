// ═══════════════════════════════════════════════════════
// MÜHASƏBƏ GÜNDƏLİYİ — gündəlik nəfsi hesaba çəkmə (yalnız cihazda)
//
// • Məlumat YALNIZ bu brauzerin localStorage-ındadır ('muslim_cc_muhasabah_v1');
//   serverə, analitikaya, hesaba heç nə göndərilmir. İxrac / idxal JSON faylıdır.
// • Hər gün üçün: suallar siyahısı (bəli işarəsi) + sərbəst qeyd. Əhval-ruhiyyə
//   şkalası qəsdən yoxdur — mühasəbə əməllər üzərindədir.
// • Son 90 günün istilik xəritəsi (SVG), cari və ən uzun ardıcıllıq.
// • Giriş: Sələfdən iki söz — mənbəyi dürüst göstərilir (Ömərin sözü məşhur
//   əsərdir, isnadı munqatidir; hədis deyil). Ətraflı: /learn/muhasabah dərsi.
//
// Format: { v:1, entries: { 'YYYY-MM-DD': { c:[id…], n:'qeyd', u:<ms> } } }
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import { isPlainClick } from '../components/PageLink'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import '../styles/MuhasabahPage.css'

export const STORAGE_KEY = 'muslim_cc_muhasabah_v1'
const NOTE_MAX = 2000
const DAYS = 90

// Suallar — sıra və id-lər sabitdir (yaddaşda id saxlanılır)
export const ITEMS = ['salah', 'quran', 'morning', 'evening', 'tongue', 'parents', 'sadaqah', 'tawbah']
const ITEM_ICONS = { salah: 'prayer', quran: 'quran', morning: 'sunrise', evening: 'sunset', tongue: 'shield', parents: 'jamaat', sadaqah: 'charity', tawbah: 'refresh' }

const L = {
  az: {
    title: 'Mühasəbə gündəliyi',
    lead: 'Günün sonunda özünü hesaba çək: fərzlər, zikr, dil, valideynlər, sədəqə və tövbə. Qeydlər yalnız bu cihazda saxlanılır.',
    eyebrow: 'Şəxsi gündəlik',
    privacy: 'Məxfilik: bütün qeydlər yalnız bu brauzerdə saxlanılır və heç yerə göndərilmir. Brauzerin məlumatlarını silsəniz, gündəlik də silinir — vaxtaşırı ixrac edin.',
    quotesTitle: 'Sələfdən',
    lessonLink: 'Mühasəbə haqqında dərs: ayələr, hədislər və Sələfin sözləri',
    day: 'Gün', today: 'Bu gün', prev: 'Əvvəlki gün', next: 'Növbəti gün',
    checklist: 'Bu gün…',
    items: {
      salah: 'Beş fərz namazı vaxtında qıldım',
      quran: 'Quran oxudum',
      morning: 'Səhər zikrlərini dedim',
      evening: 'Axşam zikrlərini dedim',
      tongue: 'Dilimi qeybətdən, yalandan və boş sözdən qorudum',
      parents: 'Valideynlərimə yaxşılıq etdim',
      sadaqah: 'Sədəqə verdim',
      tawbah: 'Tövbə və istiğfar etdim',
    },
    note: 'Qeyd', notePh: 'Bu gün nəyi yaxşı etdim, nəyi düzəltməliyəm, sabah nə edəcəyəm?',
    saved: 'Saxlanıldı',
    heatTitle: 'Son 90 gün', heatLegendLess: 'Az', heatLegendMore: 'Çox',
    heatAria: (n) => `Son 90 gündə ${n} gün qeyd olunub`,
    cellTitle: (d, n) => `${d}: ${n} / ${ITEMS.length}`,
    streak: 'Cari ardıcıllıq', best: 'Ən uzun ardıcıllıq', recorded: 'Qeyd olunan gün (90)', avg: 'Orta tamamlanma',
    daysUnit: 'gün',
    data: 'Məlumat', export: 'JSON ixrac et', import: 'JSON idxal et', deleteAll: 'Hamısını sil',
    confirmDelete: 'Bütün mühasəbə qeydləri bu cihazdan silinsin? Bu, geri qaytarılmır.',
    confirmImport: (n) => `${n} günlük qeyd idxal olunsun? Eyni tarixli mövcud qeydlər faylınkı ilə əvəz olunacaq.`,
    imported: (n) => `${n} günlük qeyd idxal olundu.`,
    importError: 'Fayl oxunmadı: bu, mühasəbə gündəliyinin JSON faylı deyil.',
    deleted: 'Bütün qeydlər silindi.',
    storageError: 'Brauzer yaddaşı əlçatan deyil (məs. gizli rejim) — qeydlər saxlanılmaya bilər.',
  },
  en: {
    title: 'Muhasabah Journal',
    lead: 'Take account of yourself at the end of the day: the obligations, dhikr, the tongue, parents, charity and repentance. Entries stay on this device only.',
    eyebrow: 'Private journal',
    privacy: 'Privacy: all entries are stored only in this browser and are never sent anywhere. Clearing your browser data also clears the journal — export it from time to time.',
    quotesTitle: 'From the Salaf',
    lessonLink: 'Lesson on muhasabah: verses, hadith and the words of the Salaf',
    day: 'Day', today: 'Today', prev: 'Previous day', next: 'Next day',
    checklist: 'Today I…',
    items: {
      salah: 'Prayed the five obligatory prayers on time',
      quran: 'Read the Quran',
      morning: 'Said the morning adhkar',
      evening: 'Said the evening adhkar',
      tongue: 'Guarded my tongue from backbiting, lying and idle talk',
      parents: 'Was kind and dutiful to my parents',
      sadaqah: 'Gave charity (sadaqah)',
      tawbah: 'Repented and sought forgiveness',
    },
    note: 'Note', notePh: 'What did I do well today, what must I put right, what will I do tomorrow?',
    saved: 'Saved',
    heatTitle: 'Last 90 days', heatLegendLess: 'Less', heatLegendMore: 'More',
    heatAria: (n) => `${n} days recorded in the last 90 days`,
    cellTitle: (d, n) => `${d}: ${n} / ${ITEMS.length}`,
    streak: 'Current streak', best: 'Longest streak', recorded: 'Days recorded (90)', avg: 'Average completion',
    daysUnit: 'days',
    data: 'Data', export: 'Export JSON', import: 'Import JSON', deleteAll: 'Delete all',
    confirmDelete: 'Delete all muhasabah entries from this device? This cannot be undone.',
    confirmImport: (n) => `Import ${n} days of entries? Existing entries for the same dates will be replaced by the file’s.`,
    imported: (n) => `Imported ${n} days of entries.`,
    importError: 'Could not read the file: it is not a muhasabah journal JSON file.',
    deleted: 'All entries deleted.',
    storageError: 'Browser storage is unavailable (e.g. private mode) — entries may not be saved.',
  },
  ru: {
    title: 'Дневник мухасабы',
    lead: 'В конце дня потребуйте отчёта с себя: обязательные дела, зикр, язык, родители, милостыня и покаяние. Записи хранятся только на этом устройстве.',
    eyebrow: 'Личный дневник',
    privacy: 'Конфиденциальность: все записи хранятся только в этом браузере и никуда не отправляются. Если очистить данные браузера, удалится и дневник — время от времени делайте экспорт.',
    quotesTitle: 'Слова саляфа',
    lessonLink: 'Урок о мухасабе: аяты, хадисы и слова саляфа',
    day: 'День', today: 'Сегодня', prev: 'Предыдущий день', next: 'Следующий день',
    checklist: 'Сегодня я…',
    items: {
      salah: 'Совершил пять обязательных молитв вовремя',
      quran: 'Читал Коран',
      morning: 'Произнёс утренние зикры',
      evening: 'Произнёс вечерние зикры',
      tongue: 'Оберегал язык от злословия, лжи и пустословия',
      parents: 'Был добр и почтителен к родителям',
      sadaqah: 'Дал милостыню (садака)',
      tawbah: 'Каялся и просил прощения',
    },
    note: 'Заметка', notePh: 'Что я сделал хорошо сегодня, что нужно исправить, что сделаю завтра?',
    saved: 'Сохранено',
    heatTitle: 'Последние 90 дней', heatLegendLess: 'Меньше', heatLegendMore: 'Больше',
    heatAria: (n) => `За последние 90 дней отмечено дней: ${n}`,
    cellTitle: (d, n) => `${d}: ${n} / ${ITEMS.length}`,
    streak: 'Текущая серия', best: 'Самая длинная серия', recorded: 'Отмечено дней (90)', avg: 'Средняя полнота',
    daysUnit: 'дн.',
    data: 'Данные', export: 'Экспорт в JSON', import: 'Импорт из JSON', deleteAll: 'Удалить всё',
    confirmDelete: 'Удалить все записи мухасабы с этого устройства? Это нельзя отменить.',
    confirmImport: (n) => `Импортировать записи за ${n} дн.? Существующие записи с теми же датами будут заменены записями из файла.`,
    imported: (n) => `Импортировано записей за ${n} дн.`,
    importError: 'Не удалось прочитать файл: это не файл дневника мухасабы.',
    deleted: 'Все записи удалены.',
    storageError: 'Хранилище браузера недоступно (например, приватный режим) — записи могут не сохраниться.',
  },
  ar: {
    title: 'دفتر محاسبة النفس',
    lead: 'حاسب نفسك في آخر اليوم: الفرائض والذكر واللسان والوالدان والصدقة والتوبة. تُحفظ المدخلات على هذا الجهاز فقط.',
    eyebrow: 'دفتر شخصي',
    privacy: 'الخصوصية: تُحفظ جميع المدخلات في هذا المتصفح فقط ولا تُرسل إلى أي مكان. إذا مسحتَ بيانات المتصفح مُسح الدفتر أيضًا، فصدّره بين حين وآخر.',
    quotesTitle: 'من أقوال السلف',
    lessonLink: 'درس في محاسبة النفس: الآيات والأحاديث وأقوال السلف',
    day: 'اليوم', today: 'هذا اليوم', prev: 'اليوم السابق', next: 'اليوم التالي',
    checklist: 'في هذا اليوم…',
    items: {
      salah: 'صلّيتُ الصلوات الخمس المفروضة في وقتها',
      quran: 'قرأتُ القرآن',
      morning: 'قلتُ أذكار الصباح',
      evening: 'قلتُ أذكار المساء',
      tongue: 'حفظتُ لساني من الغيبة والكذب واللغو',
      parents: 'بررتُ والديّ وأحسنتُ إليهما',
      sadaqah: 'تصدّقتُ',
      tawbah: 'تبتُ واستغفرتُ',
    },
    note: 'ملاحظة', notePh: 'ما الذي أحسنتُه اليوم؟ وما الذي يجب أن أصلحه؟ وماذا سأعمل غدًا؟',
    saved: 'حُفظ',
    heatTitle: 'آخر 90 يومًا', heatLegendLess: 'أقل', heatLegendMore: 'أكثر',
    heatAria: (n) => `عدد الأيام المسجلة في آخر 90 يومًا: ${n}`,
    cellTitle: (d, n) => `${d}: ${n} / ${ITEMS.length}`,
    streak: 'السلسلة الحالية', best: 'أطول سلسلة', recorded: 'الأيام المسجلة (90)', avg: 'متوسط الإنجاز',
    daysUnit: 'يوم',
    data: 'البيانات', export: 'تصدير JSON', import: 'استيراد JSON', deleteAll: 'حذف الكل',
    confirmDelete: 'هل تريد حذف جميع مدخلات المحاسبة من هذا الجهاز؟ لا يمكن التراجع عن ذلك.',
    confirmImport: (n) => `هل تريد استيراد مدخلات ${n} يومًا؟ ستُستبدل المدخلات الموجودة بالتواريخ نفسها بما في الملف.`,
    imported: (n) => `تم استيراد مدخلات ${n} يومًا.`,
    importError: 'تعذّرت قراءة الملف: ليس ملف JSON لدفتر المحاسبة.',
    deleted: 'حُذفت جميع المدخلات.',
    storageError: 'تخزين المتصفح غير متاح (مثل التصفح الخاص)، وقد لا تُحفظ المدخلات.',
  },
  tr: {
    title: 'Muhasebe Günlüğü',
    lead: 'Gün sonunda kendini hesaba çek: farzlar, zikir, dil, anne baba, sadaka ve tövbe. Kayıtlar yalnızca bu cihazda saklanır.',
    eyebrow: 'Kişisel günlük',
    privacy: 'Gizlilik: tüm kayıtlar yalnızca bu tarayıcıda saklanır ve hiçbir yere gönderilmez. Tarayıcı verilerini silerseniz günlük de silinir — ara sıra dışa aktarın.',
    quotesTitle: 'Selef’ten',
    lessonLink: 'Muhasebe dersi: ayetler, hadisler ve Selef’in sözleri',
    day: 'Gün', today: 'Bugün', prev: 'Önceki gün', next: 'Sonraki gün',
    checklist: 'Bugün…',
    items: {
      salah: 'Beş vakit farz namazı vaktinde kıldım',
      quran: 'Kur’an okudum',
      morning: 'Sabah zikirlerini okudum',
      evening: 'Akşam zikirlerini okudum',
      tongue: 'Dilimi gıybetten, yalandan ve boş sözden korudum',
      parents: 'Anne babama iyilik ettim',
      sadaqah: 'Sadaka verdim',
      tawbah: 'Tövbe ve istiğfar ettim',
    },
    note: 'Not', notePh: 'Bugün neyi iyi yaptım, neyi düzeltmeliyim, yarın ne yapacağım?',
    saved: 'Kaydedildi',
    heatTitle: 'Son 90 gün', heatLegendLess: 'Az', heatLegendMore: 'Çok',
    heatAria: (n) => `Son 90 günde ${n} gün kaydedildi`,
    cellTitle: (d, n) => `${d}: ${n} / ${ITEMS.length}`,
    streak: 'Güncel seri', best: 'En uzun seri', recorded: 'Kaydedilen gün (90)', avg: 'Ortalama tamamlama',
    daysUnit: 'gün',
    data: 'Veriler', export: 'JSON dışa aktar', import: 'JSON içe aktar', deleteAll: 'Tümünü sil',
    confirmDelete: 'Tüm muhasebe kayıtları bu cihazdan silinsin mi? Bu işlem geri alınamaz.',
    confirmImport: (n) => `${n} günlük kayıt içe aktarılsın mı? Aynı tarihli mevcut kayıtlar dosyadakilerle değiştirilecek.`,
    imported: (n) => `${n} günlük kayıt içe aktarıldı.`,
    importError: 'Dosya okunamadı: bu bir muhasebe günlüğü JSON dosyası değil.',
    deleted: 'Tüm kayıtlar silindi.',
    storageError: 'Tarayıcı depolaması kullanılamıyor (ör. gizli mod) — kayıtlar saklanamayabilir.',
  },
}

// Sələfdən iki söz. Mənbələr:
// • Ömər: Əhməd, «əz-Zühd» 633; İbn Əbid-Dünya, «Məhasəbətun-nəfs»; Tirmizi 2459-dan
//   sonra isnadsız. İsnad munqatidir (Sabit ibn əl-Həccac Öməri görməyib) — məşhur
//   əsər kimi gətirilir, hədis deyil (dorar.net/h/Wyd3xtdz).
// • Həsən əl-Bəsri: İbn Əbid-Dünya, «Məhasəbətun-nəfs»; Əbu Nueym, «Hilyə».
const QUOTES = [
  {
    ar: 'حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا',
    text: {
      az: '«Hesaba çəkilməzdən əvvəl özünüzü hesaba çəkin.»',
      en: '“Take account of yourselves before you are taken to account.”',
      ru: '«Требуйте отчёта с себя прежде, чем с вас потребуют отчёта».',
      ar: 'حاسبوا أنفسكم قبل أن تُحاسَبوا.',
      tr: '“Hesaba çekilmeden önce kendinizi hesaba çekin.”',
    },
    by: { az: 'Ömər ibn əl-Xəttab', en: 'Umar ibn al-Khattab', ru: 'Умар ибн аль-Хаттаб', ar: 'عمر بن الخطاب رضي الله عنه', tr: 'Ömer b. Hattâb' },
    src: {
      az: 'Ömərin sözüdür, Peyğəmbərin ﷺ hədisi deyil. İmam Əhməd «əz-Zühd»də (633) və İbn Əbid-Dünya «Məhasəbətun-nəfs»də rəvayət edib, Tirmizi 2459-cu hədisdən sonra isnadsız zikr edib. İsnadında qırıqlıq var (ravi Öməri görməyib); məşhur əsər kimi nəql olunur, mənası Quranla sabitdir (Həşr 59:18).',
      en: 'A saying of Umar, not a hadith of the Prophet ﷺ. Imam Ahmad reported it in az-Zuhd (633) and Ibn Abi al-Dunya in Muhasabat al-Nafs; al-Tirmidhi mentioned it without a chain after hadith 2459. Its chain is broken (the narrator did not meet Umar); it is cited as a well-known report, and its meaning is established by the Quran (al-Hashr 59:18).',
      ru: 'Это слова Умара, а не хадис Пророка ﷺ. Имам Ахмад передал их в «аз-Зухд» (633), Ибн Аби ад-Дунья — в «Мухасабат ан-нафс», ат-Тирмизи привёл без иснада после хадиса 2459. В иснаде разрыв (передатчик не застал Умара); их приводят как известное изречение, а смысл подтверждён Кораном (аль-Хашр 59:18).',
      ar: 'من قول عمر، وليس حديثًا مرفوعًا. رواه الإمام أحمد في «الزهد» (633) وابن أبي الدنيا في «محاسبة النفس»، وذكره الترمذي معلّقًا عقب الحديث 2459. وفي إسناده انقطاع (الراوي لم يدرك عمر)، وهو أثر مشهور، ومعناه ثابت بالقرآن (الحشر: 18).',
      tr: 'Ömer’in sözüdür, Peygamber’in ﷺ hadisi değildir. İmam Ahmed «ez-Zühd»de (633), İbn Ebi’d-Dünya «Muhâsebetü’n-nefs»te rivayet etmiş, Tirmizî 2459. hadisten sonra senetsiz zikretmiştir. Senedinde kopukluk vardır (ravi Ömer’e yetişmemiştir); meşhur bir söz olarak nakledilir, anlamı Kur’an ile sabittir (Haşr 59:18).',
    },
  },
  {
    ar: 'الْمُؤْمِنُ قَوَّامٌ عَلَى نَفْسِهِ، يُحَاسِبُ نَفْسَهُ لِلَّهِ',
    text: {
      az: '«Mömin öz nəfsinə nəzarət edəndir, nəfsini Allah üçün hesaba çəkir.»',
      en: '“The believer keeps watch over himself; he takes account of himself for the sake of Allah.”',
      ru: '«Верующий надзирает за своей душой и требует с неё отчёта ради Аллаха».',
      ar: 'المؤمن قوّام على نفسه، يحاسب نفسه لله.',
      tr: '“Mümin nefsini gözetendir; nefsini Allah için hesaba çeker.”',
    },
    by: { az: 'Həsən əl-Bəsri', en: 'al-Hasan al-Basri', ru: 'аль-Хасан аль-Басри', ar: 'الحسن البصري', tr: 'Hasan-ı Basrî' },
    src: {
      az: 'İbn Əbid-Dünya, «Məhasəbətun-nəfs»; Əbu Nueym, «Hilyətul-övliya».',
      en: 'Ibn Abi al-Dunya, Muhasabat al-Nafs; Abu Nu‘aym, Hilyat al-Awliya’.',
      ru: 'Ибн Аби ад-Дунья, «Мухасабат ан-нафс»; Абу Нуайм, «Хильят аль-аулия».',
      ar: 'ابن أبي الدنيا في «محاسبة النفس»، وأبو نعيم في «حلية الأولياء».',
      tr: 'İbn Ebi’d-Dünya, «Muhâsebetü’n-nefs»; Ebû Nuaym, «Hilyetü’l-evliyâ».',
    },
  },
]

// ── Tarix köməkçiləri (yerli tarix; toISOString UTC verir) ──
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parseIso = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null }
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const LOCALE = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar', tr: 'tr-TR' }
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
function fmtDate(s, lang) {
  const d = parseIso(s)
  if (!d) return s
  if (lang === 'az') return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  try { return d.toLocaleDateString(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return s }
}

/** Pozuq/köhnə məlumat səhifəni çökdürməsin: yalnız düzgün tarix + tanınan id-lər. */
export function sanitizeEntries(raw) {
  const src = raw && typeof raw === 'object' ? (raw.entries && typeof raw.entries === 'object' ? raw.entries : null) : null
  const out = {}
  if (!src) return out
  for (const [k, v] of Object.entries(src)) {
    if (!DATE_RE.test(k) || !parseIso(k) || !v || typeof v !== 'object') continue
    const c = Array.isArray(v.c) ? [...new Set(v.c.filter(x => ITEMS.includes(x)))] : []
    const n = typeof v.n === 'string' ? v.n.slice(0, NOTE_MAX) : ''
    if (!c.length && !n.trim()) continue
    out[k] = { c, n, u: Number.isFinite(v.u) ? v.u : 0 }
  }
  return out
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return { entries: raw ? sanitizeEntries(JSON.parse(raw)) : {}, ok: true }
  } catch { return { entries: {}, ok: false } }
}
function save(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, entries })); return true } catch { return false }
}

/** Ardıcıllıqlar: gün "qeydli"dir, əgər ən azı bir işarə və ya qeyd varsa. */
export function streaks(entries, today = new Date()) {
  const has = (d) => !!entries[iso(d)]
  // Cari: bu gün hələ yazılmayıbsa dünəndən sayılır
  let cur = 0
  let d = has(today) ? today : addDays(today, -1)
  while (has(d)) { cur += 1; d = addDays(d, -1) }
  const keys = Object.keys(entries).sort()
  let best = 0
  let run = 0
  let prev = null
  for (const k of keys) {
    const day = parseIso(k)
    run = prev && iso(addDays(prev, 1)) === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = day
  }
  return { cur, best }
}

// ── İstilik xəritəsi: 90 gün, həftələr sütun, Bazar ertəsi yuxarıda ──
const CELL = 14
const GAP = 3
function Heatmap({ entries, today, selected, onPick, t, lang }) {
  const start = addDays(today, -(DAYS - 1))
  const offset = (start.getDay() + 6) % 7 // B.e. = 0
  const cells = []
  for (let i = 0; i < DAYS; i++) {
    const d = addDays(start, i)
    const k = iso(d)
    const n = entries[k]?.c.length || 0
    const has = !!entries[k]
    const idx = i + offset
    cells.push({ k, n, has, x: Math.floor(idx / 7) * (CELL + GAP), y: (idx % 7) * (CELL + GAP) })
  }
  const cols = Math.ceil((DAYS + offset) / 7)
  const w = cols * (CELL + GAP) - GAP
  const h = 7 * (CELL + GAP) - GAP
  const level = (c) => (!c.has ? 0 : c.n === 0 ? 1 : Math.min(4, 1 + Math.ceil((c.n / ITEMS.length) * 3)))
  const recorded = cells.filter(c => c.has).length
  return (
    <div className="mh-heat">
      <svg className="mh-heat__svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={t.heatAria(recorded)}>
        {cells.map(c => (
          <rect key={c.k} x={c.x} y={c.y} width={CELL} height={CELL} rx="3"
            className={`mh-cell mh-cell--${level(c)}${c.k === selected ? ' is-selected' : ''}`}
            onClick={() => onPick(c.k)}>
            <title>{t.cellTitle(fmtDate(c.k, lang), c.n)}</title>
          </rect>
        ))}
      </svg>
      <div className="mh-heat__legend" aria-hidden="true">
        <span>{t.heatLegendLess}</span>
        {[0, 1, 2, 3, 4].map(l => (
          <svg key={l} width={CELL} height={CELL} viewBox={`0 0 ${CELL} ${CELL}`}><rect width={CELL} height={CELL} rx="3" className={`mh-cell mh-cell--${l}`} /></svg>
        ))}
        <span>{t.heatLegendMore}</span>
      </div>
    </div>
  )
}

export default function MuhasabahPage({ setPage }) {
  const { lang } = useLang()
  const t = L[lang] || L.az
  const navigate = useNavigate()
  const [entries, setEntries] = useState({})
  const [storageOk, setStorageOk] = useState(true)
  const [date, setDate] = useState(() => iso(new Date()))
  const [flash, setFlash] = useState('')
  const [savedTick, setSavedTick] = useState(0)
  const fileRef = useRef(null)
  const today = useMemo(() => new Date(), [])
  const todayIso = iso(today)
  const minIso = iso(addDays(today, -(DAYS - 1)))

  useEffect(() => {
    const r = load()
    setEntries(r.entries)
    setStorageOk(r.ok)
  }, [])

  // Başqa tabda dəyişsə — yenilə
  useEffect(() => {
    const onStorage = (e) => { if (e.key === STORAGE_KEY) setEntries(load().entries) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const persist = useCallback((next) => {
    setEntries(next)
    if (!save(next)) setStorageOk(false)
    else setSavedTick(x => x + 1)
  }, [])

  const entry = entries[date] || { c: [], n: '', u: 0 }

  const updateEntry = (patch) => {
    const nextEntry = { ...entry, ...patch, u: Date.now() }
    const next = { ...entries }
    if (!nextEntry.c.length && !nextEntry.n.trim()) delete next[date]
    else next[date] = nextEntry
    persist(next)
  }

  const toggle = (id) => {
    const c = entry.c.includes(id) ? entry.c.filter(x => x !== id) : ITEMS.filter(x => x === id || entry.c.includes(x))
    updateEntry({ c })
  }

  const shift = (n) => {
    const d = addDays(parseIso(date) || today, n)
    const k = iso(d)
    if (k > todayIso || k < minIso) return
    setDate(k)
  }

  const { cur, best } = useMemo(() => streaks(entries, today), [entries, today])
  const stats = useMemo(() => {
    let rec = 0
    let sum = 0
    for (let i = 0; i < DAYS; i++) {
      const e = entries[iso(addDays(today, -i))]
      if (e) { rec += 1; sum += e.c.length / ITEMS.length }
    }
    return { rec, avg: rec ? Math.round((sum / rec) * 100) : 0 }
  }, [entries, today])

  const doExport = () => {
    const data = { app: 'muslims.cc', kind: 'muhasabah', v: 1, exported: new Date().toISOString(), entries }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `muhasabah-${todayIso}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const doImport = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('too big')
      const raw = JSON.parse(await file.text())
      if (!raw || (raw.kind && raw.kind !== 'muhasabah')) throw new Error('kind')
      const imported = sanitizeEntries(raw)
      const n = Object.keys(imported).length
      if (!n) throw new Error('empty')
      if (!window.confirm(t.confirmImport(n))) return
      persist({ ...entries, ...imported })
      setFlash(t.imported(n))
    } catch {
      setFlash(t.importError)
    }
  }

  const doDelete = () => {
    if (!window.confirm(t.confirmDelete)) return
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* yaddaş bağlıdır */ }
    setEntries({})
    setFlash(t.deleted)
  }

  const lessonHref = pathFor('learn', lang, 'muhasabah')
  const onLesson = (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(lessonHref)
  }

  const group = navGroupLabel(navGroupOf('muhasabah'), lang)

  return (
    <div className="mh-page">
      <header className="ui-page-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{group || t.eyebrow}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="mh-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">مُحَاسَبَةُ النَّفْسِ</p>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow mh-layout">
          {/* Sələfdən — qısa giriş, ətraflısı dərsdə */}
          <div className="mh-quotes" data-reveal="stagger">
            <h2 className="ui-title ui-title--sm">{t.quotesTitle}</h2>
            {QUOTES.map((q, i) => (
              <figure className="ui-quote mh-quote" key={i}>
                <blockquote>
                  <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{q.ar}</p>
                  {lang !== 'ar' && <p className="ui-quote__text">{q.text[lang]}</p>}
                </blockquote>
                <figcaption className="ui-quote__src">
                  — {q.by[lang]}
                  <span className="mh-quote__ref">{q.src[lang]}</span>
                </figcaption>
              </figure>
            ))}
            <a className="ui-link mh-lesson" href={lessonHref} onClick={onLesson}>
              <Icon name="learn" size={18} /> {t.lessonLink}
              <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
            </a>
          </div>

          <p className="mh-privacy" role="note">
            <Icon name="shield" size={18} className="mh-privacy__icon" /> {t.privacy}
          </p>
          {!storageOk && <p className="mh-alert" role="alert"><Icon name="alert" size={18} /> {t.storageError}</p>}

          {/* Gün seçimi */}
          <div className="ui-card mh-day">
            <div className="mh-day__nav">
              <button type="button" className="ui-icon-btn" onClick={() => shift(-1)} disabled={date <= minIso} aria-label={t.prev} title={t.prev}>
                <Icon name="chevronLeft" size={20} className="ui-flip-rtl" />
              </button>
              <label className="mh-day__pick">
                <span className="ui-sr-only">{t.day}</span>
                <input type="date" className="ui-input mh-day__input" value={date} min={minIso} max={todayIso}
                  onChange={e => { const v = e.target.value; if (DATE_RE.test(v) && v <= todayIso && v >= minIso) setDate(v) }} />
              </label>
              <button type="button" className="ui-icon-btn" onClick={() => shift(1)} disabled={date >= todayIso} aria-label={t.next} title={t.next}>
                <Icon name="chevron" size={20} className="ui-flip-rtl" />
              </button>
              {date !== todayIso && (
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setDate(todayIso)}>{t.today}</button>
              )}
            </div>
            <p className="mh-day__label">{fmtDate(date, lang)}</p>

            <fieldset className="mh-check">
              <legend className="mh-check__legend">{t.checklist}</legend>
              {ITEMS.map(id => {
                const on = entry.c.includes(id)
                return (
                  <label key={id} className={`mh-item${on ? ' is-on' : ''}`}>
                    <input type="checkbox" className="mh-item__box" checked={on} onChange={() => toggle(id)} />
                    <span className="mh-item__mark" aria-hidden="true"><Icon name="check" size={16} /></span>
                    <Icon name={ITEM_ICONS[id]} size={18} className="mh-item__icon" />
                    <span className="mh-item__text">{t.items[id]}</span>
                  </label>
                )
              })}
            </fieldset>

            <label className="ui-field mh-note">
              <span className="ui-field__label">{t.note}</span>
              <textarea className="ui-input mh-note__input" dir="auto" rows={4} maxLength={NOTE_MAX}
                placeholder={t.notePh} value={entry.n} onChange={e => updateEntry({ n: e.target.value })} />
            </label>
            <p className="mh-saved" role="status" aria-live="polite">
              {savedTick > 0 && <span key={savedTick} className="ui-enter-fade"><Icon name="check" size={14} /> {t.saved}</span>}
            </p>
          </div>

          {/* Statistika + istilik xəritəsi */}
          <div className="ui-card mh-stats-card">
            <h2 className="ui-title ui-title--sm">{t.heatTitle}</h2>
            <div className="mh-stats">
              <div className="ui-stat"><span className="ui-stat__num">{cur}</span><span className="ui-stat__label">{t.streak} ({t.daysUnit})</span></div>
              <div className="ui-stat"><span className="ui-stat__num">{best}</span><span className="ui-stat__label">{t.best} ({t.daysUnit})</span></div>
              <div className="ui-stat"><span className="ui-stat__num">{stats.rec}</span><span className="ui-stat__label">{t.recorded}</span></div>
              <div className="ui-stat"><span className="ui-stat__num">{stats.avg}%</span><span className="ui-stat__label">{t.avg}</span></div>
            </div>
            <Heatmap entries={entries} today={today} selected={date} onPick={setDate} t={t} lang={lang} />
          </div>

          {/* Məlumat: ixrac / idxal / sil */}
          <div className="ui-card ui-card--sunken mh-data">
            <h2 className="ui-title ui-title--sm">{t.data}</h2>
            <div className="mh-data__actions">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={doExport} disabled={!Object.keys(entries).length}>
                <Icon name="download" size={16} className="ui-btn__icon" /> {t.export}
              </button>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => fileRef.current?.click()}>
                <Icon name="arrowUp" size={16} className="ui-btn__icon" /> {t.import}
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={doImport} />
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm mh-danger" onClick={doDelete} disabled={!Object.keys(entries).length}>
                <Icon name="trash" size={16} className="ui-btn__icon" /> {t.deleteAll}
              </button>
            </div>
            {flash && <p className="mh-flash" role="status">{flash}</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
