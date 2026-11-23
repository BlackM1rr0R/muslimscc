// ═══════════════════════════════════════════════════════
// /family-halaqa — həftəlik ailə halqası. noindex (dəst klientdə, ISO həftəsinə görə yığılır).
//
// Hər həftə saytın MÖVCUD məzmunundan hazır dəst (utils/familyHalaqa → kitFor; məzmun — components/halaqa/halaqaData):
//   bir ayə (tadabbur.js: ərəb mətni + tərcümə + tərcüməçi + Quranda keçid), bir hədis (Nəvəvinin 40 hədisindən
//   yalnız Buxari/Müslimdə olanlar — mənbə olduğu kimi, dərəcə: səhih), qısa dərs bölməsi (LessonBlocks, mənbələri
//   ilə), 3 müzakirə sualı (UI mətni, bölmənin adı ilə; hökm YOXDUR) + ayənin düşüncə sualı (Muslims.cc-nin, təfsir
//   deyil), uşaq fəaliyyəti (/kids?section=…). Eyni həftə + variant → bütün cihazlarda eyni dəst.
// • "Qarışdır" — variant (bu həftə üçün yerli yadda qalır), keçiddə ?week=…&v=… — ailə eyni dəsti görür.
// • Ailə dairəsi ilə paylaşma: mövcud endpoint-lər yalnız hazır kart şablonlarıdır — ona görə kopyalanan keçid.
// • "Bu həftə keçirdik" — YALNIZ bu cihaz (family_halaqa_v1, ehtiyat/sinxron yox), xal/say yoxdur.
// • Çap görünüşü: FamilyHalaqa.css → @media print (yalnız dəst).
// Prerender = ilk render: həftə, URL və yaddaş YALNIZ mount-dan sonra oxunur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import LessonBlocks from '../components/lesson/LessonBlocks'
import { SpaLink, lessonHref } from '../components/lifeguide/GuideParts'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { dayLabel } from '../utils/dayLabel'
import {
  isoWeek, kitFor, readParams, shareUrl, shiftWeek, weekRange, readHalaqa,
  setHalaqaDone, setHalaqaVariant, cleanVariant, VARIANT_MAX, HALAQA_KEY, HALAQA_EVENT,
} from '../utils/familyHalaqa'
import '../styles/LessonsPage.css'
import '../styles/LifeGuides.css'
import '../styles/FamilyHalaqa.css'

export const HQ = {
  az: {
    title: 'Həftəlik ailə halqası',
    lead: 'Hər həftə ailəniz üçün hazır dəst: bir ayə, bir hədis, qısa dərs, müzakirə sualları və uşaqlar üçün fəaliyyət. Eyni həftədə bütün cihazlarda eyni dəst görünür.',
    privacy: 'İşarələriniz yalnız bu cihazda qalır — heç yerə göndərilmir, xal və ya say yoxdur.',
    source: 'Bütün dini mətnlər saytın öz məlumatındandır, mənbələri ilə. Suallar söhbət üçündür, dini hökm deyil — hökm üçün etibarlı alimə müraciət edin.',
    loading: 'Bu həftənin dəsti hazırlanır…', loadError: 'Məzmun yüklənmədi. Səhifəni yeniləyin.',
    week: (w, y) => `${y}-ci ilin ${w}-ci həftəsi`, range: (a, b) => `${a} — ${b}`,
    prev: 'Əvvəlki həftə', next: 'Növbəti həftə', thisWeek: 'Bu həftə',
    shuffle: 'Başqa dəst', standard: 'Həftənin əsas dəsti', shuffled: 'Başqa dəst seçildi.', restored: 'Həftənin əsas dəsti qaytarıldı.',
    print: 'Çap et', copy: 'Keçidi kopyala', copied: 'Keçid kopyalandı.', copyFail: 'Kopyalanmadı — keçidi əl ilə seçin.',
    shareLabel: 'Bu həftənin dəstinə keçid', shareNote: 'Keçidi ailə dairənizə və ya yaxınlarınıza göndərin — açan hər kəs eyni dəsti görür.',
    ayah: 'Ayə', hadith: 'Hədis', lesson: 'Qısa dərs', discuss: 'Müzakirə sualları', kids: 'Uşaqlar üçün',
    ayahRef: (s, a) => `${s} surəsi, ${a}-cü ayə`, translator: (n) => `Tərcümə: ${n}`, readSurah: 'Surədə oxu',
    gradeSahih: 'Dərəcəsi: səhih', openHadith: 'Nəvəvinin 40 hədisində aç', openLesson: 'Dərsin tamamını oxu',
    fromAyah: 'Ayə barədə düşüncə sualı (Muslims.cc-nin sualıdır, təfsir deyil)',
    openKids: 'Uşaq bölməsini aç',
    done: 'Bu həftə halqanı keçirdik', doneOn: (d) => `işarələndi: ${d}`, saved: 'İşarələndi.', unsaved: 'İşarə götürüldü.',
  },
  en: {
    title: 'Weekly family halaqa',
    lead: 'A ready kit for your family every week: one ayah, one hadith, a short lesson, discussion questions and an activity for children. The same week shows the same kit on every device.',
    privacy: 'Your marks stay only on this device — nothing is sent anywhere, and there are no points or counts.',
    source: 'All religious texts come from the site’s own data, with their sources. The questions are for conversation, not religious rulings — for a ruling, ask a trusted scholar.',
    loading: 'Preparing this week’s kit…', loadError: 'The content could not be loaded. Please reload the page.',
    week: (w, y) => `Week ${w} of ${y}`, range: (a, b) => `${a} — ${b}`,
    prev: 'Previous week', next: 'Next week', thisWeek: 'This week',
    shuffle: 'Another kit', standard: 'The week’s main kit', shuffled: 'Another kit was chosen.', restored: 'The week’s main kit is back.',
    print: 'Print', copy: 'Copy link', copied: 'Link copied.', copyFail: 'Could not copy — please select the link by hand.',
    shareLabel: 'Link to this week’s kit', shareNote: 'Send the link to your family circle or loved ones — everyone who opens it sees the same kit.',
    ayah: 'Ayah', hadith: 'Hadith', lesson: 'Short lesson', discuss: 'Discussion questions', kids: 'For children',
    ayahRef: (s, a) => `Surah ${s}, ayah ${a}`, translator: (n) => `Translation: ${n}`, readSurah: 'Read in the surah',
    gradeSahih: 'Grade: sahih', openHadith: 'Open in an-Nawawi’s Forty', openLesson: 'Read the whole lesson',
    fromAyah: 'A reflection question on the ayah (written by Muslims.cc, not tafsir)',
    openKids: 'Open the children’s section',
    done: 'We held this week’s halaqa', doneOn: (d) => `marked: ${d}`, saved: 'Marked.', unsaved: 'Mark removed.',
  },
  ru: {
    title: 'Семейный халяк недели',
    lead: 'Каждую неделю — готовый набор для семьи: один аят, один хадис, короткий урок, вопросы для обсуждения и занятие для детей. На одной и той же неделе набор одинаков на всех устройствах.',
    privacy: 'Ваши отметки хранятся только на этом устройстве — ничего никуда не отправляется, нет ни баллов, ни счётчиков.',
    source: 'Все религиозные тексты взяты из данных самого сайта вместе с источниками. Вопросы — для беседы, а не религиозные решения; за решением обратитесь к надёжному учёному.',
    loading: 'Готовим набор этой недели…', loadError: 'Не удалось загрузить материалы. Обновите страницу.',
    week: (w, y) => `Неделя ${w}, ${y} год`, range: (a, b) => `${a} — ${b}`,
    prev: 'Предыдущая неделя', next: 'Следующая неделя', thisWeek: 'Эта неделя',
    shuffle: 'Другой набор', standard: 'Основной набор недели', shuffled: 'Выбран другой набор.', restored: 'Возвращён основной набор недели.',
    print: 'Печать', copy: 'Скопировать ссылку', copied: 'Ссылка скопирована.', copyFail: 'Не удалось скопировать — выделите ссылку вручную.',
    shareLabel: 'Ссылка на набор этой недели', shareNote: 'Отправьте ссылку своему семейному кругу или близким — каждый, кто откроет её, увидит тот же набор.',
    ayah: 'Аят', hadith: 'Хадис', lesson: 'Короткий урок', discuss: 'Вопросы для обсуждения', kids: 'Для детей',
    ayahRef: (s, a) => `Сура «${s}», аят ${a}`, translator: (n) => `Перевод: ${n}`, readSurah: 'Читать в суре',
    gradeSahih: 'Степень: сахих', openHadith: 'Открыть в «40 хадисах ан-Навави»', openLesson: 'Читать урок полностью',
    fromAyah: 'Вопрос для размышления над аятом (составлен Muslims.cc, это не тафсир)',
    openKids: 'Открыть детский раздел',
    done: 'Мы провели халяк этой недели', doneOn: (d) => `отмечено: ${d}`, saved: 'Отмечено.', unsaved: 'Отметка снята.',
  },
  tr: {
    title: 'Haftalık aile halkası',
    lead: 'Her hafta aileniz için hazır bir set: bir ayet, bir hadis, kısa bir ders, sohbet soruları ve çocuklar için bir etkinlik. Aynı hafta her cihazda aynı set görünür.',
    privacy: 'İşaretleriniz yalnızca bu cihazda kalır — hiçbir yere gönderilmez; puan veya sayı yoktur.',
    source: 'Tüm dinî metinler sitenin kendi verisinden, kaynaklarıyla alınmıştır. Sorular sohbet içindir, dinî hüküm değildir — hüküm için güvenilir bir âlime danışın.',
    loading: 'Bu haftanın seti hazırlanıyor…', loadError: 'İçerik yüklenemedi. Lütfen sayfayı yenileyin.',
    week: (w, y) => `${y} yılının ${w}. haftası`, range: (a, b) => `${a} — ${b}`,
    prev: 'Önceki hafta', next: 'Sonraki hafta', thisWeek: 'Bu hafta',
    shuffle: 'Başka bir set', standard: 'Haftanın asıl seti', shuffled: 'Başka bir set seçildi.', restored: 'Haftanın asıl seti geri geldi.',
    print: 'Yazdır', copy: 'Bağlantıyı kopyala', copied: 'Bağlantı kopyalandı.', copyFail: 'Kopyalanamadı — bağlantıyı elle seçin.',
    shareLabel: 'Bu haftanın setine bağlantı', shareNote: 'Bağlantıyı aile çevrenize veya yakınlarınıza gönderin — açan herkes aynı seti görür.',
    ayah: 'Ayet', hadith: 'Hadis', lesson: 'Kısa ders', discuss: 'Sohbet soruları', kids: 'Çocuklar için',
    ayahRef: (s, a) => `${s} suresi, ${a}. ayet`, translator: (n) => `Meal: ${n}`, readSurah: 'Surede oku',
    gradeSahih: 'Derecesi: sahih', openHadith: 'Nevevî’nin Kırk Hadisi’nde aç', openLesson: 'Dersin tamamını oku',
    fromAyah: 'Ayet üzerine bir tefekkür sorusu (Muslims.cc’nin sorusudur, tefsir değildir)',
    openKids: 'Çocuk bölümünü aç',
    done: 'Bu haftanın halkasını yaptık', doneOn: (d) => `işaretlendi: ${d}`, saved: 'İşaretlendi.', unsaved: 'İşaret kaldırıldı.',
  },
  ar: {
    title: 'الحلقة الأسرية الأسبوعية',
    lead: 'مجموعة جاهزة لأسرتك كل أسبوع: آية وحديث ودرس قصير وأسئلة للنقاش ونشاط للأطفال. في الأسبوع نفسه تظهر المجموعة نفسها على كل الأجهزة.',
    privacy: 'علاماتك تبقى على هذا الجهاز فقط — لا يُرسَل شيء إلى أي مكان، ولا نقاط ولا أعداد.',
    source: 'كل النصوص الشرعية مأخوذة من بيانات الموقع نفسه مع مصادرها. والأسئلة للحوار وليست أحكامًا شرعية — للحكم اسأل عالمًا موثوقًا.',
    loading: 'جارٍ تجهيز مجموعة هذا الأسبوع…', loadError: 'تعذّر تحميل المحتوى. أعد تحميل الصفحة.',
    week: (w, y) => `الأسبوع ${w} من عام ${y}`, range: (a, b) => `${a} — ${b}`,
    prev: 'الأسبوع السابق', next: 'الأسبوع التالي', thisWeek: 'هذا الأسبوع',
    shuffle: 'مجموعة أخرى', standard: 'المجموعة الأساسية للأسبوع', shuffled: 'اختيرت مجموعة أخرى.', restored: 'عادت المجموعة الأساسية للأسبوع.',
    print: 'طباعة', copy: 'نسخ الرابط', copied: 'نُسخ الرابط.', copyFail: 'تعذّر النسخ — حدّد الرابط يدويًا.',
    shareLabel: 'رابط مجموعة هذا الأسبوع', shareNote: 'أرسل الرابط إلى دائرتك الأسرية أو أحبّتك — كل من يفتحه يرى المجموعة نفسها.',
    ayah: 'الآية', hadith: 'الحديث', lesson: 'درس قصير', discuss: 'أسئلة للنقاش', kids: 'للأطفال',
    ayahRef: (s, a) => `سورة ${s}، الآية ${a}`, translator: (n) => `الترجمة: ${n}`, readSurah: 'اقرأ في السورة',
    gradeSahih: 'الدرجة: صحيح', openHadith: 'افتح في الأربعين النووية', openLesson: 'اقرأ الدرس كاملًا',
    fromAyah: 'سؤال للتأمل في الآية (من إعداد Muslims.cc، وليس تفسيرًا)',
    openKids: 'افتح قسم الأطفال',
    done: 'أقمنا حلقة هذا الأسبوع', doneOn: (d) => `عُلِّمت: ${d}`, saved: 'تم التعليم.', unsaved: 'أُزيلت العلامة.',
  },
}

// Müzakirə sualları — UI mətni (dini hökm YOXDUR); s — dərs bölməsinin adı
export const PROMPTS = {
  new: {
    az: (s) => `«${s}» mövzusunda sizin üçün yeni olan nə idi?`, en: (s) => `What was new for you in “${s}”?`,
    ru: (s) => `Что нового было для вас в теме «${s}»?`, tr: (s) => `“${s}” konusunda sizin için yeni olan neydi?`,
    ar: (s) => `ما الجديد الذي عرفته في موضوع «${s}»؟`,
  },
  step: {
    az: (s) => `«${s}» mövzusundan bu həftə ailəmiz hansı kiçik addımı ata bilər?`, en: (s) => `What is one small step our family can take this week from “${s}”?`,
    ru: (s) => `Какой маленький шаг из темы «${s}» наша семья может сделать на этой неделе?`, tr: (s) => `“${s}” konusundan bu hafta ailece hangi küçük adımı atabiliriz?`,
    ar: (s) => `ما الخطوة الصغيرة التي تستطيع أسرتنا أن تخطوها هذا الأسبوع من موضوع «${s}»؟`,
  },
  remember: {
    az: () => 'Bu həftənin ayəsindən və ya hədisindən hər birimiz hansı sözləri yadda saxlamaq istərdi və niyə?', en: () => 'Which words from this week’s ayah or hadith would each of us like to remember, and why?',
    ru: () => 'Какие слова из аята или хадиса этой недели каждый из нас хотел бы запомнить и почему?', tr: () => 'Bu haftanın ayetinden veya hadisinden her birimiz hangi sözleri aklında tutmak ister, neden?',
    ar: () => 'أيّ كلمات من آية هذا الأسبوع أو حديثه يحبّ كلٌّ منا أن يحفظها، ولماذا؟',
  },
  example: {
    az: (s) => `«${s}» mövzusunu ailəmizin ən kiçiyinə öz sözlərimizlə necə izah edərdik?`, en: (s) => `How would we explain “${s}” to the youngest in our family in our own words?`,
    ru: (s) => `Как бы мы своими словами объяснили тему «${s}» самому младшему в семье?`, tr: (s) => `“${s}” konusunu ailemizin en küçüğüne kendi sözlerimizle nasıl anlatırdık?`,
    ar: (s) => `كيف نشرح موضوع «${s}» لأصغر فرد في أسرتنا بكلماتنا؟`,
  },
  ask: {
    az: (s) => `«${s}» barədə bilikli bir insandan nəyi soruşmaq istərdiniz?`, en: (s) => `What would you like to ask a knowledgeable person about “${s}”?`,
    ru: (s) => `О чём вы хотели бы спросить знающего человека по теме «${s}»?`, tr: (s) => `“${s}” hakkında bilgili birine ne sormak isterdiniz?`,
    ar: (s) => `ماذا تحبّ أن تسأل أهل العلم عن موضوع «${s}»؟`,
  },
  thank: {
    az: () => 'Bu həftənin hansı neməti üçün hər birimiz Allaha şükür etmək istərdi?', en: () => 'For which blessing of this week would each of us like to thank Allah?',
    ru: () => 'За какую милость этой недели каждый из нас хотел бы поблагодарить Аллаха?', tr: () => 'Bu haftanın hangi nimeti için her birimiz Allah’a şükretmek ister?',
    ar: () => 'على أيّ نعمة في هذا الأسبوع يحبّ كلٌّ منا أن يشكر الله؟',
  },
}

// Uşaq fəaliyyəti — KidsPage bölmələri (məzmun orada; burada yalnız ad və necə etmək)
export const KIDS = {
  stories: {
    title: { az: 'Peyğəmbərlərin hekayələri', en: 'Stories of the prophets', ru: 'Истории о пророках', tr: 'Peygamber kıssaları', ar: 'قصص الأنبياء' },
    how: { az: 'Bir hekayəni birlikdə oxuyun, sonra uşaqlar onu öz sözləri ilə danışsın.', en: 'Read one story together, then let the children retell it in their own words.', ru: 'Прочитайте вместе одну историю, а потом пусть дети перескажут её своими словами.', tr: 'Bir kıssayı birlikte okuyun, sonra çocuklar onu kendi sözleriyle anlatsın.', ar: 'اقرؤوا قصة واحدة معًا، ثم دعوا الأطفال يعيدون روايتها بكلماتهم.' },
  },
  prophets: {
    title: { az: 'Uşaqlar üçün peyğəmbərlər', en: 'Prophets for children', ru: 'Пророки для детей', tr: 'Çocuklar için peygamberler', ar: 'الأنبياء للأطفال' },
    how: { az: 'Bir peyğəmbər haqqında birlikdə oxuyun və ondan nə öyrəndiyinizi danışın.', en: 'Read about one prophet together and talk about what you learned from him.', ru: 'Прочитайте вместе об одном пророке и обсудите, чему вы у него научились.', tr: 'Bir peygamber hakkında birlikte okuyun ve ondan ne öğrendiğinizi konuşun.', ar: 'اقرؤوا عن نبيّ واحد معًا وتحدّثوا عمّا تعلّمتموه منه.' },
  },
  manners: {
    title: { az: 'Gözəl davranışlar oyunu', en: 'Good manners game', ru: 'Игра «Хорошие поступки»', tr: 'Güzel davranışlar oyunu', ar: 'لعبة الأخلاق الحسنة' },
    how: { az: 'Siyahıdan bir gözəl davranış seçin və bu həftə onu birlikdə edin.', en: 'Choose one good deed from the list and do it together this week.', ru: 'Выберите из списка один хороший поступок и совершайте его вместе на этой неделе.', tr: 'Listeden bir güzel davranış seçin ve bu hafta onu birlikte yapın.', ar: 'اختاروا خُلقًا حسنًا من القائمة واعملوا به معًا هذا الأسبوع.' },
  },
  quiz: {
    title: { az: 'Uşaq viktorinası', en: 'Kids’ quiz', ru: 'Детская викторина', tr: 'Çocuk bilgi yarışması', ar: 'مسابقة الأطفال' },
    how: { az: 'Sualları birlikdə cavablandırın — xal saymadan, sadəcə öyrənmək üçün.', en: 'Answer the questions together — without keeping score, just to learn.', ru: 'Отвечайте на вопросы вместе — без подсчёта очков, просто чтобы узнать новое.', tr: 'Soruları birlikte cevaplayın — puan tutmadan, sadece öğrenmek için.', ar: 'أجيبوا عن الأسئلة معًا — دون عدّ النقاط، للتعلّم فقط.' },
  },
  memory: {
    title: { az: 'Yaddaş oyunu', en: 'Memory game', ru: 'Игра на память', tr: 'Hafıza oyunu', ar: 'لعبة الذاكرة' },
    how: { az: 'Bir dəfə birlikdə oynayın — ən kiçik başlasın.', en: 'Play a round together — the youngest goes first.', ru: 'Сыграйте вместе один раунд — первым ходит самый младший.', tr: 'Birlikte bir tur oynayın — en küçük başlasın.', ar: 'العبوا جولة معًا — ويبدأ الأصغر.' },
  },
  surahs: {
    title: { az: 'Qısa surələr', en: 'Short surahs', ru: 'Короткие суры', tr: 'Kısa sureler', ar: 'السور القصيرة' },
    how: { az: 'Bir qısa surəni birlikdə dinləyin və təkrar edin.', en: 'Listen to one short surah together and repeat it.', ru: 'Послушайте вместе одну короткую суру и повторите её.', tr: 'Bir kısa sureyi birlikte dinleyin ve tekrar edin.', ar: 'استمعوا إلى سورة قصيرة معًا وردّدوها.' },
  },
  duas: {
    title: { az: 'Uşaqlar üçün dualar', en: 'Duas for children', ru: 'Дуа для детей', tr: 'Çocuklar için dualar', ar: 'أدعية للأطفال' },
    how: { az: 'Bir duanı birlikdə öyrənin və bu həftə yeri gələndə deyin.', en: 'Learn one dua together and say it at the right moment this week.', ru: 'Выучите вместе одно дуа и произносите его в нужный момент на этой неделе.', tr: 'Bir duayı birlikte öğrenin ve bu hafta yeri geldiğinde okuyun.', ar: 'تعلّموا دعاءً واحدًا معًا وقولوه في موضعه هذا الأسبوع.' },
  },
  names: {
    title: { az: 'Allahın adları', en: 'The names of Allah', ru: 'Имена Аллаха', tr: 'Allah’ın isimleri', ar: 'أسماء الله الحسنى' },
    how: { az: 'Bir adı seçin, onun mənasını birlikdə oxuyun.', en: 'Choose one name and read its meaning together.', ru: 'Выберите одно имя и прочитайте вместе его значение.', tr: 'Bir isim seçin ve anlamını birlikte okuyun.', ar: 'اختاروا اسمًا واحدًا واقرؤوا معناه معًا.' },
  },
  crossword: {
    title: { az: 'Krossvord', en: 'Crossword', ru: 'Кроссворд', tr: 'Bulmaca', ar: 'الكلمات المتقاطعة' },
    how: { az: 'Krossvordu birlikdə həll edin.', en: 'Solve the crossword together.', ru: 'Разгадайте кроссворд вместе.', tr: 'Bulmacayı birlikte çözün.', ar: 'حلّوا الكلمات المتقاطعة معًا.' },
  },
  wudu: {
    title: { az: 'Dəstəmazı öyrənək', en: 'Learning wudu', ru: 'Учимся омовению', tr: 'Abdesti öğrenelim', ar: 'نتعلّم الوضوء' },
    how: { az: 'Dəstəmazın addımlarını birlikdə keçin.', en: 'Go through the steps of wudu together.', ru: 'Пройдите вместе шаги омовения.', tr: 'Abdestin adımlarını birlikte gözden geçirin.', ar: 'راجعوا خطوات الوضوء معًا.' },
  },
}

const copyText = async (text) => {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

export default function FamilyHalaqaPage({ setPage }) {
  const { lang, siteLang } = useLang()
  const t = pickUi(HQ, lang, 'en')
  const pl = siteLang || lang
  const [week, setWeek] = useState(null)        // null — prerender / hələ oxunmayıb
  const [today, setToday] = useState(null)
  const [variant, setVariant] = useState(0)
  const [store, setStore] = useState({ v: 1, d: {}, s: {} })
  const [base, setBase] = useState(null)        // { tad, nawawi, lessonBySlug } | false
  const [section, setSection] = useState(null)  // dərs bölməsi | false
  const [msg, setMsg] = useState('')
  const [origin, setOrigin] = useState('')

  // Həftə, URL parametrləri və yaddaş — yalnız brauzerdə
  useEffect(() => {
    const cur = isoWeek().key
    const p = readParams(window.location.search)
    const st = readHalaqa()
    const w = p.week || cur
    setToday(cur)
    setWeek(w)
    setVariant(p.v ?? (st.s[w] || 0))
    setStore(st)
    setOrigin(window.location.origin)
    const load = () => setStore(readHalaqa())
    const onStorage = (e) => { if (!e.key || e.key === HALAQA_KEY) load() }
    window.addEventListener(HALAQA_EVENT, load)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(HALAQA_EVENT, load); window.removeEventListener('storage', onStorage) }
  }, [])

  useEffect(() => {
    if (!week) return undefined
    let alive = true
    import('../components/halaqa/halaqaData')
      .then((m) => m.loadBase(lang))
      .then((b) => { if (alive) setBase(b) })
      .catch(() => { if (alive) setBase(false) })
    return () => { alive = false }
  }, [lang, week])

  const kit = useMemo(() => (week && base ? kitFor(week, variant, base.tad.TADABBUR.length) : null), [week, variant, base])
  const lessonKey = kit ? `${kit.lesson.s}#${kit.lesson.sec}` : ''
  useEffect(() => {
    if (!lessonKey) return undefined
    let alive = true
    const [s, sec] = lessonKey.split('#')
    setSection(null)
    import('../components/halaqa/halaqaData')
      .then((m) => m.loadSection(s, sec))
      .then((x) => { if (alive) setSection(x || false) })
      .catch(() => { if (alive) setSection(false) })
    return () => { alive = false }
  }, [lessonKey])

  const goWeek = useCallback((w) => {
    if (!w) return
    setWeek(w)
    setVariant(readHalaqa().s[w] || 0)
    setMsg('')
  }, [])
  const shuffle = () => {
    const v = (cleanVariant(variant) % VARIANT_MAX) + 1
    setVariant(v)
    setStore(setHalaqaVariant(week, v))
    setMsg(t.shuffled)
  }
  const restore = () => {
    setVariant(0)
    setStore(setHalaqaVariant(week, 0))
    setMsg(t.restored)
  }
  const onDone = (on) => {
    // Sinxron yazılır — işarə dərhal görünür (yaddaş bağlıdırsa da vəziyyət qayıdan dəyərdən)
    setStore(setHalaqaDone(week, on))
    setMsg(on ? t.saved : t.unsaved)
  }
  const link = week && origin ? shareUrl(origin, pathFor('halaqa', pl), week, variant) : ''
  const onCopy = async () => { setMsg((await copyText(link)) ? t.copied : t.copyFail) }

  const range = week ? weekRange(week) : null
  const wNum = week ? Number(week.slice(6)) : 0
  const wYear = week ? Number(week.slice(0, 4)) : 0
  const failed = base === false || section === false
  const loc = (o) => pickUi(o, lang, 'en')

  // Hissələr
  const ayah = kit && base ? base.tad.TADABBUR[kit.ayah] : null
  const translator = ayah && lang !== 'ar' ? base.tad.TADABBUR_SOURCES.find((x) => x.part === (['az', 'en', 'ru', 'tr'].includes(lang) ? lang : 'en')) : null
  const hadith = kit && base ? base.nawawi.find((h) => h.n === kit.hadith) : null
  const lessonMeta = kit && base ? base.lessonBySlug(kit.lesson.s) : null
  const secTitle = section ? loc(section.title) : ''
  const doneOn = week ? store.d[week] : null

  return (
    <div className="lg-page hq-page">
      <header className="ui-page-hero lg-hero hq-noprint">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('halaqa'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {t.privacy}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          {!week || base === null ? (
            <p className="hq-wait" data-testid="hq-loading">{t.loading}</p>
          ) : base === false ? (
            <p className="hq-wait" data-testid="hq-error">{t.loadError}</p>
          ) : (
            <>
              <div className="hq-bar hq-noprint" data-testid="hq-bar">
                <div className="hq-week">
                  <h2 className="hq-week__title" data-testid="hq-week">{t.week(wNum, wYear)}</h2>
                  {range && <p className="hq-week__range ui-num">{t.range(dayLabel(range.from, lang), dayLabel(range.to, lang))}</p>}
                </div>
                <div className="hq-row">
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => goWeek(shiftWeek(week, -1))} data-testid="hq-prev">
                    <Icon name="chevronLeft" className="ui-btn__icon ui-flip-rtl" /> {t.prev}
                  </button>
                  {today && week !== today && (
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => goWeek(today)} data-testid="hq-today">{t.thisWeek}</button>
                  )}
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => goWeek(shiftWeek(week, 1))} data-testid="hq-next">
                    {t.next} <Icon name="chevron" className="ui-btn__icon ui-flip-rtl" />
                  </button>
                </div>
                <div className="hq-row">
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={shuffle} data-testid="hq-shuffle">
                    <Icon name="refresh" className="ui-btn__icon" /> {t.shuffle}
                  </button>
                  {variant > 0 && (
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={restore} data-testid="hq-standard">{t.standard}</button>
                  )}
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { try { window.print() } catch { /* */ } }} data-testid="hq-print">
                    <Icon name="print" className="ui-btn__icon" /> {t.print}
                  </button>
                </div>
              </div>

              <article className="hq-kit" data-testid="hq-kit" data-week={week} data-v={variant} aria-labelledby="hq-kit-h">
                <h2 className="hq-print-title" id="hq-kit-h">{t.title} · <span className="ui-num">{t.week(wNum, wYear)}</span></h2>

                {/* 1. Ayə */}
                {ayah && (
                  <section className="ui-card hq-card" aria-labelledby="hq-ayah-h" data-testid="hq-ayah">
                    <h3 className="hq-card__title" id="hq-ayah-h"><Icon name="quran" size={18} /> {t.ayah}</h3>
                    <p className="hq-ar ui-arabic" lang="ar" dir="rtl">{ayah.ar}</p>
                    {lang !== 'ar' && ayah.t[lang] && <p className="hq-tr">{ayah.t[lang]}</p>}
                    {lang !== 'ar' && !ayah.t[lang] && ayah.t.en && <p className="hq-tr" lang="en">{ayah.t.en}</p>}
                    <p className="hq-src">
                      <cite>{t.ayahRef(loc(ayah.sura), ayah.a)}</cite>
                      {translator && <> · {t.translator(translator.name)}</>}
                    </p>
                    <p className="hq-more hq-noprint">
                      <SpaLink className="ui-link" href={`${pathFor('quran', pl, ayah.s)}?a=${ayah.a}`}>{t.readSurah}</SpaLink>
                    </p>
                  </section>
                )}

                {/* 2. Hədis */}
                {hadith && (
                  <section className="ui-card hq-card" aria-labelledby="hq-hadith-h" data-testid="hq-hadith">
                    <h3 className="hq-card__title" id="hq-hadith-h"><Icon name="hadith" size={18} /> {t.hadith}: {hadith.title}</h3>
                    <p className="hq-ar ui-arabic" lang="ar" dir="rtl">{hadith.ar}</p>
                    {lang !== 'ar' && hadith.text && <p className="hq-tr">{hadith.text}</p>}
                    <p className="hq-src"><cite dir="auto">{hadith.src}</cite> · <span className="ui-badge ui-badge--brand">{t.gradeSahih}</span></p>
                    <p className="hq-more hq-noprint">
                      <SpaLink className="ui-link" href={`${pathFor('nawawi40', pl)}#h-${hadith.n}`}>{t.openHadith}</SpaLink>
                    </p>
                  </section>
                )}

                {/* 3. Dərs */}
                <section className="ui-card hq-card" aria-labelledby="hq-lesson-h" data-testid="hq-lesson">
                  <h3 className="hq-card__title" id="hq-lesson-h">
                    <Icon name="learn" size={18} /> {t.lesson}{secTitle ? `: ${secTitle}` : ''}
                  </h3>
                  {lessonMeta && <p className="hq-src">{loc(lessonMeta.title)}</p>}
                  {section ? <LessonBlocks blocks={section.blocks} lang={lang} />
                    : <p className="hq-wait">{failed ? t.loadError : t.loading}</p>}
                  {kit && (
                    <p className="hq-more hq-noprint">
                      <SpaLink className="ui-link" href={lessonHref(kit.lesson.s, kit.lesson.sec, pl)}>{t.openLesson}</SpaLink>
                    </p>
                  )}
                </section>

                {/* 4. Müzakirə sualları */}
                {kit && (
                  <section className="ui-card hq-card" aria-labelledby="hq-discuss-h" data-testid="hq-discuss">
                    <h3 className="hq-card__title" id="hq-discuss-h"><Icon name="jamaat" size={18} /> {t.discuss}</h3>
                    <ol className="hq-qs">
                      {secTitle && kit.prompts.map((id) => (
                        <li key={id} data-testid="hq-q">{pickUi(PROMPTS[id], lang, 'en')(secTitle)}</li>
                      ))}
                      {ayah && (
                        <li data-testid="hq-q">
                          {loc(ayah.q)}
                          <small className="hq-q__note">{t.fromAyah}</small>
                        </li>
                      )}
                    </ol>
                  </section>
                )}

                {/* 5. Uşaqlar üçün */}
                {kit && KIDS[kit.kids] && (
                  <section className="ui-card hq-card" aria-labelledby="hq-kids-h" data-testid="hq-kids">
                    <h3 className="hq-card__title" id="hq-kids-h"><Icon name="kids" size={18} /> {t.kids}: {loc(KIDS[kit.kids].title)}</h3>
                    <p className="hq-tr">{loc(KIDS[kit.kids].how)}</p>
                    <p className="hq-more hq-noprint">
                      <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`${pathFor('kids', pl)}?section=${kit.kids}`} data-testid="hq-kids-link">
                        <Icon name="kids" className="ui-btn__icon" /> {t.openKids}
                      </a>
                    </p>
                  </section>
                )}

                <p className="hq-note">{t.source}</p>
              </article>

              <div className="ui-card hq-card hq-noprint" data-testid="hq-done-card">
                <label className="lg-check lg-check--plain" htmlFor="hq-done">
                  <input id="hq-done" type="checkbox" checked={Boolean(doneOn)} onChange={(e) => onDone(e.target.checked)} data-testid="hq-done" />
                  <span>{t.done}</span>
                  {doneOn && <span className="lg-check__on">· {t.doneOn(dayLabel(doneOn, lang))}</span>}
                </label>
              </div>

              <div className="ui-card hq-card hq-noprint" data-testid="hq-share">
                <label className="ui-field__label" htmlFor="hq-link">{t.shareLabel}</label>
                <div className="hq-row hq-share">
                  <input id="hq-link" className="ui-input hq-link" dir="ltr" readOnly value={link} onFocus={(e) => e.target.select()} />
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={onCopy} disabled={!link} data-testid="hq-copy">
                    <Icon name="copy" className="ui-btn__icon" /> {t.copy}
                  </button>
                </div>
                <p className="hq-note">{t.shareNote}</p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
