// ═══════════════════════════════════════════════════════
// MÜHASƏBƏ GÜNDƏLİYİ — gündəlik nəfsi hesaba çəkmə (yalnız cihazda)
//
// • Məlumat YALNIZ bu brauzerin localStorage-ındadır ('muslim_cc_muhasabah_v1');
//   serverə, analitikaya, hesaba heç nə göndərilmir. İxrac / idxal JSON faylıdır.
// • Hər gün üçün: suallar siyahısı (bəli işarəsi) + sərbəst qeyd. Əhval-ruhiyyə
//   şkalası qəsdən yoxdur — mühasəbə əməllər üzərindədir.
// • Son 90 günün istilik xəritəsi (ActivityHeatmap), cari və ən uzun ardıcıllıq,
//   son 7 günün və son 30 gündə hər əməlin qrafiki (components/viz).
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
import { ChartFigure, ProgressRing, StatTile, ColumnChart } from '../components/viz'
import ActivityHeatmap from '../components/ActivityHeatmap'
import RelatedLinks from '../components/RelatedLinks'
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

// ── Dizayn v3: hero, panel qrafikləri, bölmə başlıqları ──
const V3 = {
  az: {
    lead: 'Günün sonunda bir neçə dəqiqə: səkkiz suala cavab ver, qısa qeyd yaz, irəliləyişini qrafiklərdə gör.',
    how: 'Necə işlədilir: bu gün etdiyin əməlləri işarələ, istəsən qeyd yaz — avtomatik saxlanılır. Keçmiş günü seçmək üçün tarixə və ya xəritədəki xanaya toxun. Qeydlər yalnız bu cihazdadır.',
    overview: 'Göstəricilər', heatSub: 'Xanaya toxun — o gün açılsın',
    weekTitle: 'Son 7 gün', weekSub: 'Hər gün neçə sual işarələnib (8-dən)',
    itemsTitle: 'Əməllər — son 30 gün', itemsSub: 'Hər əməl neçə gün işarələnib',
    short: { salah: 'Fərz namazlar', quran: 'Quran', morning: 'Səhər zikrləri', evening: 'Axşam zikrləri', tongue: 'Dili qorumaq', parents: 'Valideynlər', sadaqah: 'Sədəqə', tawbah: 'Tövbə' },
    quotesEyebrow: 'Mənbə', quotesLead: 'Mühasəbə Sələfin yoludur — iki qısa söz, mənbəyi dürüst göstərilməklə.',
    dataEyebrow: 'Yaddaş', relEyebrow: 'Davamı', relTitle: 'Əlaqəli bölmələr',
  },
  en: {
    lead: 'A few minutes at the end of the day: answer eight questions, write a short note and see your progress in charts.',
    how: 'How to use: tick the deeds you did today and add a note if you like — it saves automatically. Tap the date or a square in the map to open a past day. Entries stay on this device only.',
    overview: 'Overview', heatSub: 'Tap a square to open that day',
    weekTitle: 'Last 7 days', weekSub: 'How many questions were ticked each day (of 8)',
    itemsTitle: 'Deeds — last 30 days', itemsSub: 'On how many days each deed was ticked',
    short: { salah: 'Obligatory prayers', quran: 'Quran', morning: 'Morning adhkar', evening: 'Evening adhkar', tongue: 'Guarding the tongue', parents: 'Parents', sadaqah: 'Charity', tawbah: 'Repentance' },
    quotesEyebrow: 'Sources', quotesLead: 'Self-accounting is the way of the Salaf — two short sayings, with their sources stated honestly.',
    dataEyebrow: 'Storage', relEyebrow: 'Continue', relTitle: 'Related sections',
  },
  ru: {
    lead: 'Несколько минут в конце дня: ответьте на восемь вопросов, напишите короткую заметку и посмотрите прогресс на графиках.',
    how: 'Как пользоваться: отметьте дела, совершённые сегодня, при желании добавьте заметку — сохраняется автоматически. Чтобы открыть прошлый день, выберите дату или клетку на карте. Записи хранятся только на этом устройстве.',
    overview: 'Показатели', heatSub: 'Нажмите на клетку, чтобы открыть день',
    weekTitle: 'Последние 7 дней', weekSub: 'Сколько вопросов отмечено за день (из 8)',
    itemsTitle: 'Дела — последние 30 дней', itemsSub: 'Сколько дней отмечено каждое дело',
    short: { salah: 'Обязательные молитвы', quran: 'Коран', morning: 'Утренние зикры', evening: 'Вечерние зикры', tongue: 'Хранить язык', parents: 'Родители', sadaqah: 'Милостыня', tawbah: 'Покаяние' },
    quotesEyebrow: 'Источники', quotesLead: 'Отчёт с самого себя — путь саляфа: два кратких изречения с честно указанными источниками.',
    dataEyebrow: 'Хранение', relEyebrow: 'Далее', relTitle: 'Связанные разделы',
  },
  ar: {
    lead: 'دقائق في آخر اليوم: أجب عن ثمانية أسئلة، واكتب ملاحظة قصيرة، وانظر تقدّمك في الرسوم.',
    how: 'طريقة الاستخدام: علِّم على الأعمال التي فعلتها اليوم، وأضف ملاحظة إن شئت — يُحفظ تلقائيًا. لفتح يوم سابق اختر التاريخ أو مربعًا في الخريطة. المدخلات على هذا الجهاز فقط.',
    overview: 'المؤشرات', heatSub: 'اضغط على مربع لفتح ذلك اليوم',
    weekTitle: 'آخر 7 أيام', weekSub: 'عدد الأسئلة المعلَّمة كل يوم (من 8)',
    itemsTitle: 'الأعمال — آخر 30 يومًا', itemsSub: 'عدد الأيام التي عُلِّم فيها كل عمل',
    short: { salah: 'الصلوات المفروضة', quran: 'القرآن', morning: 'أذكار الصباح', evening: 'أذكار المساء', tongue: 'حفظ اللسان', parents: 'الوالدان', sadaqah: 'الصدقة', tawbah: 'التوبة' },
    quotesEyebrow: 'المصادر', quotesLead: 'محاسبة النفس طريقة السلف — قولان قصيران مع بيان مصدرهما بأمانة.',
    dataEyebrow: 'الحفظ', relEyebrow: 'المزيد', relTitle: 'أقسام ذات صلة',
  },
  tr: {
    lead: 'Gün sonunda birkaç dakika: sekiz soruyu cevapla, kısa bir not yaz ve ilerlemeni grafiklerde gör.',
    how: 'Nasıl kullanılır: bugün yaptığın amelleri işaretle, istersen not yaz — otomatik kaydedilir. Geçmiş bir günü açmak için tarihe veya haritadaki kareye dokun. Kayıtlar yalnızca bu cihazdadır.',
    overview: 'Göstergeler', heatSub: 'O günü açmak için kareye dokun',
    weekTitle: 'Son 7 gün', weekSub: 'Her gün kaç soru işaretlendi (8 sorudan)',
    itemsTitle: 'Ameller — son 30 gün', itemsSub: 'Her amel kaç gün işaretlendi',
    short: { salah: 'Farz namazlar', quran: 'Kur’an', morning: 'Sabah zikirleri', evening: 'Akşam zikirleri', tongue: 'Dili korumak', parents: 'Anne baba', sadaqah: 'Sadaka', tawbah: 'Tövbe' },
    quotesEyebrow: 'Kaynaklar', quotesLead: 'Nefis muhasebesi Selef’in yoludur — kaynakları dürüstçe belirtilen iki kısa söz.',
    dataEyebrow: 'Saklama', relEyebrow: 'Devamı', relTitle: 'İlgili bölümler',
  },
}

const MH_RELATED = [
  { learn: 'tawbah', title: { az: 'Tövbə', en: 'Repentance (tawbah)', ru: 'Покаяние (тауба)', ar: 'التوبة', tr: 'Tövbe' },
    sub: { az: 'Tövbənin şərtləri — dərs', en: 'The conditions of repentance — lesson', ru: 'Условия покаяния — урок', ar: 'شروط التوبة — درس', tr: 'Tövbenin şartları — ders' } },
  { to: 'tracker', icon: 'tracker', title: { az: 'Namaz izləyicisi', en: 'Prayer tracker', ru: 'Трекер намаза', ar: 'متابعة الصلاة', tr: 'Namaz takibi' },
    sub: { az: 'Beş namazı ayrı-ayrılıqda qeyd et', en: 'Log each of the five prayers', ru: 'Отмечайте каждую из пяти молитв', ar: 'سجّل كل صلاة من الخمس', tr: 'Beş vaktin her birini kaydet' } },
  { to: 'hisn', title: { az: 'Hisnul-Müslim', en: 'Hisn al-Muslim', ru: 'Хиснуль-муслим', ar: 'حصن المسلم', tr: 'Hısnu’l-Müslim' },
    sub: { az: 'Səhər və axşam zikrləri', en: 'Morning and evening adhkar', ru: 'Утренние и вечерние зикры', ar: 'أذكار الصباح والمساء', tr: 'Sabah ve akşam zikirleri' } },
  { to: 'dailytracker', title: { az: 'Gündəlik ibadət', en: 'Daily worship', ru: 'Ежедневное поклонение', ar: 'العبادة اليومية', tr: 'Günlük ibadet' },
    sub: { az: 'Gündəlik əməllərin izlənməsi', en: 'Track your daily deeds', ru: 'Учёт ежедневных дел', ar: 'متابعة الأعمال اليومية', tr: 'Günlük amellerin takibi' } },
]

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
const AZ_WEEKDAYS = ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.']
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

  const v = V3[lang] || V3.en
  const group = navGroupLabel(navGroupOf('muhasabah'), lang)
  const todayEntry = entries[todayIso]
  const todayDone = todayEntry ? todayEntry.c.length : 0

  // Son 30 gündə hər əməl neçə gün işarələnib (BarChart)
  const perItem = useMemo(() => {
    const cnt = Object.fromEntries(ITEMS.map(id => [id, 0]))
    const marks = Object.fromEntries(ITEMS.map(id => [id, Array(30).fill(false)]))
    for (let i = 0; i < 30; i++) {
      const e = entries[iso(addDays(today, -i))]
      if (e) for (const id of e.c) { if (id in cnt) { cnt[id] += 1; marks[id][29 - i] = true } }
    }
    return ITEMS.map(id => ({ key: id, label: v.short[id], value: cnt[id], days: marks[id] }))
  }, [entries, today, v])
  // Son 7 gün: gündəlik tamamlanma (ColumnChart)
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    const k = iso(d)
    let wd = ''
    // az-AZ Intl bəzi brauzerlərdə ingiliscə qaytarır — öz qısaltmalarımız
    if (lang === 'az') wd = AZ_WEEKDAYS[d.getDay()]
    else { try { wd = d.toLocaleDateString(LOCALE[lang] || 'en-GB', { weekday: 'short' }) } catch { wd = k.slice(8) } }
    return { key: k, label: wd, value: entries[k]?.c.length || 0, current: k === todayIso }
  }), [entries, today, todayIso, lang])

  const level = (k) => {
    const e = entries[k]
    if (!e) return 0
    return e.c.length === 0 ? 1 : Math.min(4, 1 + Math.ceil((e.c.length / ITEMS.length) * 3))
  }

  return (
    <div className="mh-page">
      <header className="ui-page-hero ui-page-hero--split">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text" data-reveal="stagger">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{group || t.eyebrow}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{v.lead}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {v.how}</p>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card mh-summary">
              <ProgressRing value={todayDone} max={ITEMS.length} size={84} thickness={8} label={t.today} sub={`${todayDone} / ${ITEMS.length}`} />
              <dl className="mh-summary__kv">
                <div><dt>{t.streak}</dt><dd className="ui-num">{cur} <small>{t.daysUnit}</small></dd></div>
                <div><dt>{t.best}</dt><dd className="ui-num">{best} <small>{t.daysUnit}</small></dd></div>
              </dl>
            </div>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container mh-split">
          {/* ── Gün: suallar + qeyd ── */}
          <div className="mh-main">
            {!storageOk && <p className="mh-alert" role="alert"><Icon name="alert" size={18} /> {t.storageError}</p>}
            <div className="ui-card mh-day">
              <div className="mh-day__nav">
                <button type="button" className="ui-icon-btn" onClick={() => shift(-1)} disabled={date <= minIso} aria-label={t.prev} title={t.prev}>
                  <Icon name="chevronLeft" size={20} className="ui-flip-rtl" />
                </button>
                <label className="mh-day__pick">
                  <span className="ui-sr-only">{t.day}</span>
                  <input type="date" className="ui-input mh-day__input" value={date} min={minIso} max={todayIso}
                    onChange={e => { const val = e.target.value; if (DATE_RE.test(val) && val <= todayIso && val >= minIso) setDate(val) }} />
                </label>
                <button type="button" className="ui-icon-btn" onClick={() => shift(1)} disabled={date >= todayIso} aria-label={t.next} title={t.next}>
                  <Icon name="chevron" size={20} className="ui-flip-rtl" />
                </button>
                {date !== todayIso && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setDate(todayIso)}>{t.today}</button>
                )}
              </div>
              <p className="mh-day__label">{fmtDate(date, lang)} <span className="mh-day__count ui-num" aria-hidden="true">{entry.c.length} / {ITEMS.length}</span></p>

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
            <ChartFigure title={v.itemsTitle} sub={v.itemsSub}>
              {/* 30 xanalı istilik zolağı: hər əməl hansı günlərdə edilib */}
              <ul className="mh-heat">
                {perItem.map(m => (
                  <li key={m.key} className="mh-heat__row" aria-label={`${m.label}: ${m.value} / 30`}>
                    <span className="mh-heat__label">{m.label}</span>
                    <span className="mh-heat__cells" aria-hidden="true">
                      {m.days.map((on, i) => <span key={i} className={`mh-heat__cell${on ? ' is-on' : ''}${i === 29 ? ' is-today' : ''}`} />)}
                    </span>
                    <span className="mh-heat__count ui-num" aria-hidden="true">{m.value}<small>/30</small></span>
                  </li>
                ))}
              </ul>
            </ChartFigure>
          </div>

          {/* ── Panel: göstəricilər və qrafiklər ── */}
          <aside className="mh-side" aria-label={v.overview}>
            <div className="ui-stats mh-stats">
              <StatTile variant="sunken" value={String(stats.rec)} label={t.recorded} />
              <StatTile variant="sunken" value={String(stats.avg)} unit="%" label={t.avg} />
            </div>
            <ChartFigure title={t.heatTitle} sub={v.heatSub}>
              <ActivityHeatmap days={DAYS} today={today} levelOf={level} selected={date} onPick={setDate}
                titleOf={(k) => t.cellTitle(fmtDate(k, lang), entries[k]?.c.length || 0)}
                label={t.heatAria(stats.rec)} less={t.heatLegendLess} more={t.heatLegendMore} />
            </ChartFigure>
            <ChartFigure title={v.weekTitle} sub={v.weekSub}>
              <ColumnChart data={week} max={ITEMS.length} height={96} label={v.weekTitle} />
            </ChartFigure>
          </aside>
        </div>
      </section>

      {/* ── Sələfdən — qısa giriş, ətraflısı dərsdə ── */}
      <section className="ui-section ui-section--tight ui-section--alt" aria-labelledby="mh-quotes-h">
        <div className="ui-container mh-quotes">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{v.quotesEyebrow}</span>
            <h2 className="ui-title" id="mh-quotes-h">{t.quotesTitle}</h2>
            <p className="ui-lead">{v.quotesLead}</p>
          </div>
          <div className="mh-quotes__grid">
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
          </div>
          <a className="ui-link mh-lesson" href={lessonHref} onClick={onLesson}>
            <Icon name="learn" size={18} /> {t.lessonLink}
            <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
          </a>
        </div>
      </section>

      {/* ── Məlumat: ixrac / idxal / sil + əlaqəli bölmələr ── */}
      <section className="ui-section ui-section--tight" aria-labelledby="mh-data-h">
        <div className="ui-container mh-bottom">
          <div className="mh-data">
            <div className="ui-section-head">
              <span className="ui-eyebrow">{v.dataEyebrow}</span>
              <h2 className="ui-title ui-title--sm" id="mh-data-h">{t.data}</h2>
              <p className="ui-lead">{t.privacy}</p>
            </div>
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
          <div>
            <div className="ui-section-head">
              <span className="ui-eyebrow">{v.relEyebrow}</span>
              <h2 className="ui-title ui-title--sm">{v.relTitle}</h2>
            </div>
            <RelatedLinks items={MH_RELATED} />
          </div>
        </div>
      </section>
    </div>
  )
}
