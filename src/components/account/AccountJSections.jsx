// ═══════════════════════════════════════════════════════
// /account — J mərhələsi: şəxsi mənəvi səyahət (hamısı yerli + hesabın şifrəli sinxronu)
//
//   <JTop user={user} lang="az" />          — ildönümü / ad günü kartları, kunya (profil bölməsinin altında)
//   <AccountJSections user={user} lang="az" /> — məzhəb + sevimli qari, ad günü, "İslam yolundakı hekayəm",
//                                               yol mərhələsi (avatar çərçivəsi)
// Heç nə uydurulmur: rəqəmlər yalnız istifadəçinin öz qeydlərindəndir (utils/journey), dua — saytın
// mənbəli dua bazasından (src/data/duas.js, Bəqərə 2:201) və "ad gününə xas dua yoxdur" qeydi ilə.
// AccountPage bu faylı tənbəl yükləyir.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../Icon'
import DeferRender from '../DeferRender'
import JourneyFrame from './JourneyFrame'
import MadhabPicker from '../prayer/MadhabPicker'
import { stampName } from '../SpiritualPassport'
import { staticSurahName } from './AccountQuranSections'
import { pickUi } from '../../utils/uiText'
import { makeFormat } from '../viz/format.js'
import { formatGregorian, parseGKey, G_MONTHS } from '../../utils/hijri'
import { localizeSource } from '../../utils/sourceNames'
import { RECITERS, reciterName, favoriteReciter, setFavoriteReciter, previewSources, AUDIO_PREFS_EVENT } from '../../utils/quranAudio'
import { recordHifzDates } from '../../utils/hifzDates'
import {
  gatherJourney, yearSummary, anniversaryOf, birthdayToday, readBirthday, writeBirthday, readCelebrate, markCelebrated,
  readKunya, writeKunya, kunyaText, readMilestones, addMilestone, removeMilestone, buildTimeline, journeyLevel,
  localDay, JOURNEY_EVENT, NOTE_MAX, TITLE_MAX, KUNYA_NAME_MAX, MILESTONE_KINDS, LEVEL_THRESHOLDS, LEVEL_POINTS,
} from '../../utils/journey'
import '../../styles/AccountJ.css'

const T = {
  az: {
    k: { khatm: 'Xətm', surahs: 'Oxunan surə', stamps: 'Möhür', fasts: 'Oruc', taraweeh: 'Təravih gecəsi', ramadan: 'Ramazan fəsli', dhikr: 'Zikr', duas: 'Yazılan dua', mosques: 'Məscid ziyarəti', ummah: 'Ümmət xətmi dövrü', ayahsLife: 'Ömürlük mozaikada ayə (cəmi)' },
    anniv: (n) => (n === 1 ? 'Bir il əvvəl bu gün bizə qoşuldunuz' : `${n} il əvvəl bu gün bizə qoşuldunuz`),
    annivLead: 'Son ilinizin xülasəsi — yalnız öz qeydlərinizdən:',
    bday: 'Bu gün ad gününüzdür', bdayLead: 'Son 12 ayınız — yalnız öz qeydlərinizdən:',
    emptyYear: 'Bu dövr üçün hələ qeyd yoxdur — yol davam edir.', dhikrNote: 'Zikr gündəliyi son 60 günü saxlayır.',
    close: 'Bağla', duaNote: 'Ad gününə xas dua Sünnədə yoxdur; istənilən gün edilə bilən ümumi bir dua:', duaLabel: 'Ümumi dua',
    welcome: 'İstəyə bağlı addım: kunya', welcomeLead: 'Hesabınız hazırdır. İstəsəniz, adınızın yanında görünən kunya seçin — ya da bu addımı keçin.', skip: 'Keç',
    kunya: 'Kunya', kunyaLead: 'Kunya — ərəb ad ənənəsidir: «Əbu» — «atası», «Ümmü» — «anası» deməkdir (məsələn, «Əbu Yusif» — Yusifin atası). Kunya yalnız hesabınızda, adınızın yanında görünür.',
    abu: 'Əbu (atası)', umm: 'Ümmü (anası)', kname: 'Ad (məsələn, övladınızın adı)', kshow: (s) => `Görünəcək: ${s}`, save: 'Yadda saxla', remove: 'Sil',
    kSaved: 'Kunya yadda saxlanıldı.', kRemoved: 'Kunya silindi.', kNeed: 'Adı yazın.', kPrefix: 'Ön söz',
    prefs: 'Namaz və Quran ayarları', prefsLead: 'Bütün cihazlarınızda: məzhəbə görə əsr vaxtı və sevimli qari.',
    reciter: 'Sevimli qari', reciterHint: 'Saytdakı Quran pleyerləri bu qari ilə başlayır (söz-söz qiraət və təlim səsləri öz qarisi ilə qalır).',
    listen: 'Dinlə', stop: 'Dayandır', rSaved: 'Sevimli qari yadda saxlanıldı.', rFail: 'Önizləmə yüklənmədi.',
    birthday: 'Ad günü', birthdayLead: 'İstəyə bağlı. Ad gününüzdə son 12 ayın mənəvi xülasəsi göstərilir. Yalnız sizə görünür.',
    month: 'Ay', day: 'Gün', year: 'İl (istəyə bağlı)', choose: 'Seçin', bSaved: 'Ad günü yadda saxlanıldı.', bRemoved: 'Ad günü silindi.', bNeed: 'Ayı və günü seçin.',
    story: 'İslam yolundakı hekayəm', storyLead: 'Qeydlərinizdən yığılan tarixli anlar və öz mərhələləriniz. Gizlidir — yalnız sizə görünür.',
    storyEmpty: 'Hələ tarixli an yoxdur. Quran oxuyun, möhür qazanın və ya aşağıda öz mərhələnizi əlavə edin.',
    ev: {
      account: 'Hesabınız yaradıldı', khatm: (n) => (n === 1 ? 'İlk xətm' : `Xətm №${n}`), ramadan: (y) => `Ramazan ${y} fəsli`,
      hifz: (s) => `Əzbərləndi: ${s}`, hifzNote: 'qeyd olunduğu gün', stamp: (s) => `Möhür: ${s}`,
      ummah: (n) => `Ümmət xətmi dövrü №${n} tamamlandı`, mosque: 'İlk məscid ziyarəti', dua: 'Dua gündəliyində ilk dua',
    },
    kinds: { hajj: 'İlk Həcc', umrah: 'İlk Umrə', other: 'Başqa' },
    addTitle: 'Öz mərhələni əlavə et', kind: 'Növ', mTitle: 'Ad', date: 'Tarix', note: 'Qeyd (istəyə bağlı)', add: 'Əlavə et',
    mAdded: 'Mərhələ əlavə olundu.', mRemoved: 'Mərhələ silindi.', mNeedTitle: 'Adı yazın.', mNeedDate: 'Tarixi seçin.', chars: (n, m) => `${n}/${m}`,
    removeM: (s) => `Sil: ${s}`, mine: 'öz mərhələm',
    level: 'Yol mərhələsi', levelLead: 'Profil nişanınızın çərçivəsi saytdakı irəliləyişinizlə dəyişir. Bu, iman və ya dərəcə ölçüsü deyil — yalnız sizə görünür.',
    stages: ['Başlanğıc', 'Yolçu', 'Davamlı', 'Təcrübəli', 'Uzun yol'], current: 'Hazırkı mərhələ', points: (n) => `${n} xal`,
    toNext: (n) => `Növbəti mərhələyə ${n} xal qalıb`, last: 'Son mərhələ', how: 'Xallar necə hesablanır',
    rules: (p) => [`Hər xətm — ${p.khatm} xal`, `Hər mənəvi səyahət möhürü — ${p.stamp} xal`, `İştirak etdiyiniz hər Ümmət xətmi dövrü — ${p.ummah} xal`, `Hər 10 əzbər ayə — ${p.ayahs10} xal`],
    colStage: 'Mərhələ', colFrom: 'Başlanğıc xal', yours: (a) => `Sizdə: ${a.khatms} xətm · ${a.stamps} möhür · ${a.ummah} dövr · ${a.ayahs} əzbər ayə`,
  },
  en: {
    k: { khatm: 'Khatms', surahs: 'Surahs read', stamps: 'Stamps earned', fasts: 'Fasts', taraweeh: 'Taraweeh nights', ramadan: 'Ramadan chapters', dhikr: 'Dhikr', duas: 'Duas written', mosques: 'Mosque visits', ummah: 'Ummah khatm rounds', ayahsLife: 'Verses in your lifetime mosaic (total)' },
    anniv: (n) => (n === 1 ? 'One year ago today you joined us' : `${n} years ago today you joined us`),
    annivLead: 'A summary of your past year — only from your own records:',
    bday: 'Today is your birthday', bdayLead: 'Your last 12 months — only from your own records:',
    emptyYear: 'Nothing recorded for this period yet — the journey goes on.', dhikrNote: 'The dhikr log keeps the last 60 days.',
    close: 'Close', duaNote: 'There is no birthday-specific dua in the Sunnah; here is a general dua you can make on any day:', duaLabel: 'General dua',
    welcome: 'Optional step: a kunya', welcomeLead: 'Your account is ready. If you like, choose a kunya to show next to your name — or skip this step.', skip: 'Skip',
    kunya: 'Kunya', kunyaLead: 'A kunya is an Arabic naming tradition: “Abu” means “father of” and “Umm” means “mother of” (for example, “Abu Yusuf” — the father of Yusuf). It is shown only in your account, next to your name.',
    abu: 'Abu (father of)', umm: 'Umm (mother of)', kname: 'Name (for example, your child’s name)', kshow: (s) => `It will show as: ${s}`, save: 'Save', remove: 'Remove',
    kSaved: 'Kunya saved.', kRemoved: 'Kunya removed.', kNeed: 'Enter a name.', kPrefix: 'Prefix',
    prefs: 'Prayer and Quran settings', prefsLead: 'On all your devices: the Asr time by school of law and your favourite reciter.',
    reciter: 'Favourite reciter', reciterHint: 'The site’s Quran players start with this reciter (word-by-word recitation and lesson audio keep their own reciter).',
    listen: 'Listen', stop: 'Stop', rSaved: 'Favourite reciter saved.', rFail: 'The preview did not load.',
    birthday: 'Birthday', birthdayLead: 'Optional. On your birthday you will see a spiritual summary of the last 12 months. Only you can see it.',
    month: 'Month', day: 'Day', year: 'Year (optional)', choose: 'Choose', bSaved: 'Birthday saved.', bRemoved: 'Birthday removed.', bNeed: 'Choose the month and day.',
    story: 'My story on the path of Islam', storyLead: 'Dated moments gathered from your records, plus your own milestones. Private — only you can see it.',
    storyEmpty: 'No dated moments yet. Read the Quran, earn a stamp or add your own milestone below.',
    ev: {
      account: 'You created your account', khatm: (n) => (n === 1 ? 'First khatm' : `Khatm no. ${n}`), ramadan: (y) => `Ramadan ${y} chapter`,
      hifz: (s) => `Memorised: ${s}`, hifzNote: 'the day it was marked', stamp: (s) => `Stamp: ${s}`,
      ummah: (n) => `Ummah khatm round ${n} completed`, mosque: 'First mosque visit', dua: 'First dua in your journal',
    },
    kinds: { hajj: 'First Hajj', umrah: 'First Umrah', other: 'Other' },
    addTitle: 'Add your own milestone', kind: 'Type', mTitle: 'Title', date: 'Date', note: 'Note (optional)', add: 'Add',
    mAdded: 'Milestone added.', mRemoved: 'Milestone removed.', mNeedTitle: 'Enter a title.', mNeedDate: 'Choose a date.', chars: (n, m) => `${n}/${m}`,
    removeM: (s) => `Remove: ${s}`, mine: 'my milestone',
    level: 'Journey stage', levelLead: 'The frame around your profile badge changes with your progress on the site. It is not a measure of faith or rank — only you can see it.',
    stages: ['Beginning', 'Traveller', 'Steady', 'Seasoned', 'Long road'], current: 'Current stage', points: (n) => `${n} points`,
    toNext: (n) => `${n} points to the next stage`, last: 'Final stage', how: 'How points are counted',
    rules: (p) => [`Each khatm — ${p.khatm} points`, `Each spiritual journey stamp — ${p.stamp} points`, `Each Ummah khatm round you took part in — ${p.ummah} points`, `Every 10 memorised verses — ${p.ayahs10} point`],
    colStage: 'Stage', colFrom: 'Starts at', yours: (a) => `Yours: ${a.khatms} khatms · ${a.stamps} stamps · ${a.ummah} rounds · ${a.ayahs} memorised verses`,
  },
  ru: {
    k: { khatm: 'Хатмы', surahs: 'Прочитано сур', stamps: 'Получено штампов', fasts: 'Посты', taraweeh: 'Ночи таравиха', ramadan: 'Главы Рамадана', dhikr: 'Зикр', duas: 'Записано дуа', mosques: 'Посещения мечетей', ummah: 'Круги хатма уммы', ayahsLife: 'Аятов в мозаике жизни (всего)' },
    anniv: (n) => (n === 1 ? 'Год назад в этот день вы присоединились к нам' : `В этот день вы присоединились к нам — лет назад: ${n}`),
    annivLead: 'Итоги вашего года — только из ваших записей:',
    bday: 'Сегодня ваш день рождения', bdayLead: 'Ваши последние 12 месяцев — только из ваших записей:',
    emptyYear: 'За этот период пока нет записей — путь продолжается.', dhikrNote: 'Дневник зикра хранит последние 60 дней.',
    close: 'Закрыть', duaNote: 'Особого дуа для дня рождения в Сунне нет; вот общее дуа, которое можно читать в любой день:', duaLabel: 'Общее дуа',
    welcome: 'Необязательный шаг: кунья', welcomeLead: 'Аккаунт готов. Если хотите, выберите кунью, которая будет видна рядом с именем, — или пропустите этот шаг.', skip: 'Пропустить',
    kunya: 'Кунья', kunyaLead: 'Кунья — арабская традиция имён: «Абу» означает «отец», «Умм» — «мать» (например, «Абу Юсуф» — отец Юсуфа). Кунья видна только в вашем аккаунте, рядом с именем.',
    abu: 'Абу (отец)', umm: 'Умм (мать)', kname: 'Имя (например, имя вашего ребёнка)', kshow: (s) => `Будет показано: ${s}`, save: 'Сохранить', remove: 'Удалить',
    kSaved: 'Кунья сохранена.', kRemoved: 'Кунья удалена.', kNeed: 'Введите имя.', kPrefix: 'Приставка',
    prefs: 'Настройки намаза и Корана', prefsLead: 'На всех ваших устройствах: время аср по мазхабу и любимый чтец.',
    reciter: 'Любимый чтец', reciterHint: 'Плееры Корана на сайте начинают с этого чтеца (чтение по словам и учебное аудио остаются со своим чтецом).',
    listen: 'Слушать', stop: 'Стоп', rSaved: 'Любимый чтец сохранён.', rFail: 'Не удалось загрузить отрывок.',
    birthday: 'День рождения', birthdayLead: 'Необязательно. В день рождения вы увидите духовные итоги последних 12 месяцев. Видно только вам.',
    month: 'Месяц', day: 'День', year: 'Год (необязательно)', choose: 'Выберите', bSaved: 'День рождения сохранён.', bRemoved: 'День рождения удалён.', bNeed: 'Выберите месяц и день.',
    story: 'Моя история на пути ислама', storyLead: 'Датированные моменты из ваших записей и ваши собственные вехи. Скрыто — видно только вам.',
    storyEmpty: 'Пока нет датированных моментов. Читайте Коран, получайте штампы или добавьте свою веху ниже.',
    ev: {
      account: 'Вы создали аккаунт', khatm: (n) => (n === 1 ? 'Первый хатм' : `Хатм № ${n}`), ramadan: (y) => `Глава «Рамадан ${y}»`,
      hifz: (s) => `Выучена: ${s}`, hifzNote: 'день, когда отмечено', stamp: (s) => `Штамп: ${s}`,
      ummah: (n) => `Завершён круг хатма уммы № ${n}`, mosque: 'Первое посещение мечети', dua: 'Первое дуа в дневнике',
    },
    kinds: { hajj: 'Первый хадж', umrah: 'Первая умра', other: 'Другое' },
    addTitle: 'Добавить свою веху', kind: 'Тип', mTitle: 'Название', date: 'Дата', note: 'Заметка (необязательно)', add: 'Добавить',
    mAdded: 'Веха добавлена.', mRemoved: 'Веха удалена.', mNeedTitle: 'Введите название.', mNeedDate: 'Выберите дату.', chars: (n, m) => `${n}/${m}`,
    removeM: (s) => `Удалить: ${s}`, mine: 'моя веха',
    level: 'Этап пути', levelLead: 'Рамка вокруг значка профиля меняется вместе с вашим прогрессом на сайте. Это не мера веры или степени — видно только вам.',
    stages: ['Начало', 'Путник', 'Постоянство', 'Опыт', 'Долгий путь'], current: 'Текущий этап', points: (n) => `Очков: ${n}`,
    toNext: (n) => `До следующего этапа очков: ${n}`, last: 'Последний этап', how: 'Как считаются очки',
    rules: (p) => [`Каждый хатм — ${p.khatm}`, `Каждый штамп духовного пути — ${p.stamp}`, `Каждый круг хатма уммы с вашим участием — ${p.ummah}`, `Каждые 10 выученных аятов — ${p.ayahs10}`],
    colStage: 'Этап', colFrom: 'С очков', yours: (a) => `У вас: хатмов ${a.khatms} · штампов ${a.stamps} · кругов ${a.ummah} · выученных аятов ${a.ayahs}`,
  },
  ar: {
    k: { khatm: 'ختمات', surahs: 'سور مقروءة', stamps: 'أختام', fasts: 'صيام', taraweeh: 'ليالي التراويح', ramadan: 'فصول رمضان', dhikr: 'الذكر', duas: 'أدعية مكتوبة', mosques: 'زيارات المساجد', ummah: 'دورات ختمة الأمة', ayahsLife: 'آيات في فسيفساء العمر (المجموع)' },
    anniv: (n) => (n === 1 ? 'قبل عام في مثل هذا اليوم انضممت إلينا' : `في مثل هذا اليوم انضممت إلينا — عدد السنوات: ${n}`),
    annivLead: 'ملخص عامك الماضي — من سجلاتك وحدها:',
    bday: 'اليوم يوم ميلادك', bdayLead: 'آخر اثني عشر شهرًا — من سجلاتك وحدها:',
    emptyYear: 'لا توجد سجلات لهذه المدة بعد — والطريق مستمر.', dhikrNote: 'يحفظ سجل الذكر آخر 60 يومًا.',
    close: 'إغلاق', duaNote: 'لا يوجد في السنة دعاء خاص بيوم الميلاد؛ وهذا دعاء عام يُدعى به في أي يوم:', duaLabel: 'دعاء عام',
    welcome: 'خطوة اختيارية: الكنية', welcomeLead: 'حسابك جاهز. إن شئت فاختر كنية تظهر بجانب اسمك — أو تخطَّ هذه الخطوة.', skip: 'تخطٍّ',
    kunya: 'الكنية', kunyaLead: 'الكنية من تقاليد التسمية العربية: «أبو» بمعنى الأب و«أم» بمعنى الأم (مثل «أبو يوسف» أي والد يوسف). تظهر في حسابك فقط بجانب اسمك.',
    abu: 'أبو', umm: 'أم', kname: 'الاسم (مثل اسم ولدك)', kshow: (s) => `ستظهر هكذا: ${s}`, save: 'حفظ', remove: 'حذف',
    kSaved: 'حُفظت الكنية.', kRemoved: 'حُذفت الكنية.', kNeed: 'اكتب الاسم.', kPrefix: 'البادئة',
    prefs: 'إعدادات الصلاة والقرآن', prefsLead: 'على كل أجهزتك: وقت العصر حسب المذهب وقارئك المفضل.',
    reciter: 'القارئ المفضل', reciterHint: 'تبدأ مشغلات القرآن في الموقع بهذا القارئ (التلاوة كلمةً كلمة وصوت الدروس تبقى بقارئها).',
    listen: 'استمع', stop: 'إيقاف', rSaved: 'حُفظ القارئ المفضل.', rFail: 'تعذّر تحميل المقطع.',
    birthday: 'يوم الميلاد', birthdayLead: 'اختياري. في يوم ميلادك يظهر ملخص روحي لآخر اثني عشر شهرًا. يراه أنت فقط.',
    month: 'الشهر', day: 'اليوم', year: 'السنة (اختياري)', choose: 'اختر', bSaved: 'حُفظ يوم الميلاد.', bRemoved: 'حُذف يوم الميلاد.', bNeed: 'اختر الشهر واليوم.',
    story: 'قصتي في طريق الإسلام', storyLead: 'لحظات مؤرخة من سجلاتك ومحطاتك الخاصة. خاصة — يراها أنت فقط.',
    storyEmpty: 'لا توجد لحظات مؤرخة بعد. اقرأ القرآن أو احصل على ختم أو أضف محطتك أدناه.',
    ev: {
      account: 'أنشأت حسابك', khatm: (n) => (n === 1 ? 'أول ختمة' : `الختمة رقم ${n}`), ramadan: (y) => `فصل رمضان ${y}`,
      hifz: (s) => `حُفظت: ${s}`, hifzNote: 'يوم التسجيل', stamp: (s) => `ختم: ${s}`,
      ummah: (n) => `اكتملت دورة ختمة الأمة رقم ${n}`, mosque: 'أول زيارة لمسجد', dua: 'أول دعاء في دفترك',
    },
    kinds: { hajj: 'أول حجة', umrah: 'أول عمرة', other: 'أخرى' },
    addTitle: 'أضف محطتك', kind: 'النوع', mTitle: 'العنوان', date: 'التاريخ', note: 'ملاحظة (اختياري)', add: 'إضافة',
    mAdded: 'أُضيفت المحطة.', mRemoved: 'حُذفت المحطة.', mNeedTitle: 'اكتب العنوان.', mNeedDate: 'اختر التاريخ.', chars: (n, m) => `${n}/${m}`,
    removeM: (s) => `حذف: ${s}`, mine: 'محطتي',
    level: 'مرحلة الطريق', levelLead: 'يتغيّر إطار شارة ملفك مع تقدّمك في الموقع. ليس مقياسًا للإيمان أو للدرجة — يراه أنت فقط.',
    stages: ['البداية', 'المسافر', 'الثبات', 'الخبرة', 'الطريق الطويل'], current: 'المرحلة الحالية', points: (n) => `${n} نقطة`,
    toNext: (n) => `بقي ${n} نقطة للمرحلة التالية`, last: 'المرحلة الأخيرة', how: 'كيف تُحسب النقاط',
    rules: (p) => [`كل ختمة — ${p.khatm} نقاط`, `كل ختم من أختام الرحلة الروحية — ${p.stamp} نقاط`, `كل دورة من ختمة الأمة شاركت فيها — ${p.ummah} نقاط`, `كل 10 آيات محفوظة — ${p.ayahs10} نقطة`],
    colStage: 'المرحلة', colFrom: 'تبدأ من', yours: (a) => `لديك: ${a.khatms} ختمة · ${a.stamps} ختم · ${a.ummah} دورة · ${a.ayahs} آية محفوظة`,
  },
  tr: {
    k: { khatm: 'Hatim', surahs: 'Okunan sure', stamps: 'Mühür', fasts: 'Oruç', taraweeh: 'Teravih gecesi', ramadan: 'Ramazan bölümü', dhikr: 'Zikir', duas: 'Yazılmış dua', mosques: 'Cami ziyareti', ummah: 'Ümmet hatmi turu', ayahsLife: 'Ömür boyu mozaikteki ayet (toplam)' },
    anniv: (n) => (n === 1 ? 'Bir yıl önce bugün aramıza katıldınız' : `${n} yıl önce bugün aramıza katıldınız`),
    annivLead: 'Geçen yılınızın özeti — yalnızca kendi kayıtlarınızdan:',
    bday: 'Bugün doğum gününüz', bdayLead: 'Son 12 ayınız — yalnızca kendi kayıtlarınızdan:',
    emptyYear: 'Bu dönem için henüz kayıt yok — yol devam ediyor.', dhikrNote: 'Zikir günlüğü son 60 günü saklar.',
    close: 'Kapat', duaNote: 'Sünnette doğum gününe özel bir dua yoktur; her gün yapılabilecek genel bir dua:', duaLabel: 'Genel dua',
    welcome: 'İsteğe bağlı adım: künye', welcomeLead: 'Hesabınız hazır. İsterseniz adınızın yanında görünecek bir künye seçin — ya da bu adımı geçin.', skip: 'Geç',
    kunya: 'Künye', kunyaLead: 'Künye bir Arap ad geleneğidir: «Ebu» «babası», «Ümmü» «annesi» demektir (örneğin «Ebu Yusuf» — Yusuf’un babası). Künye yalnızca hesabınızda, adınızın yanında görünür.',
    abu: 'Ebu (babası)', umm: 'Ümmü (annesi)', kname: 'Ad (örneğin çocuğunuzun adı)', kshow: (s) => `Şöyle görünecek: ${s}`, save: 'Kaydet', remove: 'Kaldır',
    kSaved: 'Künye kaydedildi.', kRemoved: 'Künye kaldırıldı.', kNeed: 'Bir ad yazın.', kPrefix: 'Ön ek',
    prefs: 'Namaz ve Kur’an ayarları', prefsLead: 'Tüm cihazlarınızda: mezhebe göre ikindi vakti ve sevdiğiniz kâri.',
    reciter: 'Sevdiğiniz kâri', reciterHint: 'Sitedeki Kur’an oynatıcıları bu kâriyle başlar (kelime kelime tilavet ve ders sesleri kendi kârisiyle kalır).',
    listen: 'Dinle', stop: 'Durdur', rSaved: 'Sevdiğiniz kâri kaydedildi.', rFail: 'Önizleme yüklenemedi.',
    birthday: 'Doğum günü', birthdayLead: 'İsteğe bağlı. Doğum gününüzde son 12 ayın manevi özeti gösterilir. Yalnızca siz görürsünüz.',
    month: 'Ay', day: 'Gün', year: 'Yıl (isteğe bağlı)', choose: 'Seçin', bSaved: 'Doğum günü kaydedildi.', bRemoved: 'Doğum günü kaldırıldı.', bNeed: 'Ayı ve günü seçin.',
    story: 'İslam yolundaki hikâyem', storyLead: 'Kayıtlarınızdan toplanan tarihli anlar ve kendi kilometre taşlarınız. Gizlidir — yalnızca siz görürsünüz.',
    storyEmpty: 'Henüz tarihli an yok. Kur’an okuyun, mühür kazanın ya da aşağıdan kendi kilometre taşınızı ekleyin.',
    ev: {
      account: 'Hesabınızı oluşturdunuz', khatm: (n) => (n === 1 ? 'İlk hatim' : `${n}. hatim`), ramadan: (y) => `Ramazan ${y} bölümü`,
      hifz: (s) => `Ezberlendi: ${s}`, hifzNote: 'işaretlendiği gün', stamp: (s) => `Mühür: ${s}`,
      ummah: (n) => `Ümmet hatminin ${n}. turu tamamlandı`, mosque: 'İlk cami ziyareti', dua: 'Dua günlüğündeki ilk dua',
    },
    kinds: { hajj: 'İlk hac', umrah: 'İlk umre', other: 'Diğer' },
    addTitle: 'Kendi kilometre taşını ekle', kind: 'Tür', mTitle: 'Başlık', date: 'Tarih', note: 'Not (isteğe bağlı)', add: 'Ekle',
    mAdded: 'Kilometre taşı eklendi.', mRemoved: 'Kilometre taşı kaldırıldı.', mNeedTitle: 'Bir başlık yazın.', mNeedDate: 'Bir tarih seçin.', chars: (n, m) => `${n}/${m}`,
    removeM: (s) => `Kaldır: ${s}`, mine: 'kendi kilometre taşım',
    level: 'Yol aşaması', levelLead: 'Profil rozetinizin çerçevesi sitedeki ilerlemenizle değişir. Bu bir iman ya da derece ölçüsü değildir — yalnızca siz görürsünüz.',
    stages: ['Başlangıç', 'Yolcu', 'İstikrar', 'Tecrübe', 'Uzun yolculuk'], current: 'Şu anki aşama', points: (n) => `${n} puan`,
    toNext: (n) => `Sonraki aşamaya ${n} puan kaldı`, last: 'Son aşama', how: 'Puanlar nasıl hesaplanır',
    rules: (p) => [`Her hatim — ${p.khatm} puan`, `Her manevi yolculuk mührü — ${p.stamp} puan`, `Katıldığınız her ümmet hatmi turu — ${p.ummah} puan`, `Her 10 ezber ayet — ${p.ayahs10} puan`],
    colStage: 'Aşama', colFrom: 'Başlangıç puanı', yours: (a) => `Sizde: ${a.khatms} hatim · ${a.stamps} mühür · ${a.ummah} tur · ${a.ayahs} ezber ayet`,
  },
}

const ICON = { khatm: 'quran', surahs: 'mushaf', stamps: 'star', fasts: 'ramadan', taraweeh: 'moonStar', ramadan: 'ramadan', dhikr: 'dhikr', duas: 'duajournal', mosques: 'mosques', ummah: 'sparkle', ayahsLife: 'hifz' }
const EV_ICON = { account: 'user', khatm: 'quran', ramadan: 'ramadan', hifz: 'hifz', stamp: 'star', ummah: 'sparkle', mosque: 'mosques', dua: 'duajournal', milestone: 'compass' }
const dayLabel = (d, lang) => { const g = parseGKey(d); return g ? formatGregorian(g, lang) : d }

function Section({ icon, title, lead, id, testId, children }) {
  return (
    <section className="ui-card acc-section" aria-labelledby={id} data-testid={testId}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name={icon} size={20} /></span>
        <div>
          <h2 className="acc-section__title" id={id}>{title}</h2>
          {lead && <p className="acc-section__lead">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

/** Yerli səyahət məlumatı — dəyişəndə (bu tab / başqa tab / sinxron) yenidən oxunur */
function useJourney() {
  const [rev, setRev] = useState(0)
  useEffect(() => {
    const re = () => setRev((n) => n + 1)
    window.addEventListener(JOURNEY_EVENT, re)
    window.addEventListener('storage', re)
    return () => { window.removeEventListener(JOURNEY_EVENT, re); window.removeEventListener('storage', re) }
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => gatherJourney(), [rev])
}

function Live({ msg }) {
  return <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>
}

// ═══ Ildönümü / ad günü kartları ═══
function SummaryList({ items, t, fmt }) {
  if (!items.length) return <p className="accj-empty">{t.emptyYear}</p>
  return (
    <>
      <dl className="accj-stats">
        {items.map((x) => (
          <div key={x.k} className="accj-stat" data-k={x.k}>
            <dt><Icon name={ICON[x.k]} size={16} /> {t.k[x.k]}</dt>
            <dd className="ui-num">{fmt.num(x.v, { maximumFractionDigits: 0 })}</dd>
          </div>
        ))}
      </dl>
      {items.some((x) => x.k === 'dhikr') && <p className="accj-note">{t.dhikrNote}</p>}
    </>
  )
}

function GeneralDua({ t, lang }) {
  const [dua, setDua] = useState(null)
  useEffect(() => {
    let on = true
    import('../../data/duas.js').then((m) => { if (on) setDua((m.DUAS_DATA || []).find((d) => d.id === 83) || null) }).catch(() => {})
    return () => { on = false }
  }, [])
  return (
    <figure className="accj-dua" data-testid="bday-dua">
      <p className="accj-dua__note" data-testid="bday-dua-note"><Icon name="info" size={16} /> {t.duaNote}</p>
      {dua && <>
        <span className="ui-eyebrow">{t.duaLabel}</span>
        <blockquote className="ui-arabic accj-dua__ar" lang="ar" dir="rtl">{dua.ar}</blockquote>
        {lang !== 'ar' && <p className="accj-dua__tr" dir="ltr" lang="ar-Latn">{dua.translit}</p>}
        {lang !== 'ar' && <p className="accj-dua__mean">{dua[lang] || dua.en}</p>}
        <figcaption className="accj-dua__src">{localizeSource(dua.source, lang)}</figcaption>
      </>}
    </figure>
  )
}

function CelebrationCard({ kind, title, lead, items, t, fmt, lang, onClose }) {
  return (
    <section className={`ui-card accj-celebrate accj-celebrate--${kind}`} aria-labelledby={`accj-${kind}-t`} data-testid={kind === 'a' ? 'acc-anniv-card' : 'acc-bday-card'}>
      <svg className="accj-celebrate__art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <path d="M60 8l9 21 22-9-9 22 21 9-21 9 9 22-22-9-9 21-9-21-22 9 9-22-21-9 21-9-9-22 22 9z" />
        <circle cx="60" cy="60" r="18" />
      </svg>
      <div className="accj-celebrate__body">
        <h2 className="accj-celebrate__title" id={`accj-${kind}-t`}>{title}</h2>
        <p className="accj-celebrate__lead">{lead}</p>
        <SummaryList items={items} t={t} fmt={fmt} />
        {kind === 'b' && <GeneralDua t={t} lang={lang} />}
      </div>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm accj-celebrate__close" onClick={onClose}>
        <Icon name="close" size={16} /> {t.close}
      </button>
    </section>
  )
}

function Celebrations({ user, t, fmt, lang, today }) {
  const src = useJourney()
  const [seen, setSeen] = useState(() => readCelebrate())
  const [bday, setBday] = useState(() => readBirthday())
  useEffect(() => {
    const re = () => { setSeen(readCelebrate()); setBday(readBirthday()) }
    window.addEventListener(JOURNEY_EVENT, re)
    return () => window.removeEventListener(JOURNEY_EVENT, re)
  }, [])
  const year = Number(today.slice(0, 4))
  const ann = anniversaryOf(user?.createdAt, today)
  const bd = birthdayToday(bday, today)
  const annItems = useMemo(() => (ann ? yearSummary(src, ann.since, today) : []), [ann?.since, src, today])   // eslint-disable-line react-hooks/exhaustive-deps
  const bdItems = useMemo(() => (bd ? yearSummary(src, bd.since, today) : []), [bd?.since, src, today])   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {ann && seen.a !== year && (
        <CelebrationCard kind="a" title={t.anniv(ann.years)} lead={t.annivLead} items={annItems} t={t} fmt={fmt} lang={lang}
          onClose={() => setSeen(markCelebrated('a', year))} />
      )}
      {bd && seen.b !== year && (
        <CelebrationCard kind="b" title={t.bday} lead={t.bdayLead} items={bdItems} t={t} fmt={fmt} lang={lang}
          onClose={() => setSeen(markCelebrated('b', year))} />
      )}
    </>
  )
}

// ═══ Kunya ═══
function KunyaForm({ t, lang, onDone }) {
  const cur = readKunya()
  const [p, setP] = useState(cur?.p || 'abu')
  const [n, setN] = useState(cur?.n || '')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const preview = n.trim() ? kunyaText({ p, n }, lang) : ''
  const save = (e) => {
    e.preventDefault()
    if (!n.trim()) { setErr(t.kNeed); return }
    writeKunya({ p, n })
    setErr(''); setMsg(t.kSaved)
    onDone?.()
  }
  return (
    <form className="acc-form accj-kunya" onSubmit={save} noValidate data-testid="kunya-form">
      <fieldset className="accj-seg">
        <legend className="ui-field__label">{t.kPrefix}</legend>
        {['abu', 'umm'].map((k) => (
          <label key={k} className={`accj-seg__opt${p === k ? ' is-on' : ''}`}>
            <input type="radio" name="kunya-p" value={k} checked={p === k} onChange={() => setP(k)} /> <span>{t[k]}</span>
          </label>
        ))}
      </fieldset>
      <div className="ui-field acc-field">
        <label className="ui-field__label" htmlFor="kunya-n">{t.kname}</label>
        <input id="kunya-n" className="ui-input" value={n} maxLength={KUNYA_NAME_MAX} dir="auto" autoComplete="off"
          onChange={(e) => setN(e.target.value)} aria-invalid={err ? 'true' : undefined} aria-describedby="kunya-prev" />
        <span className="ui-field__hint" id="kunya-prev">{preview ? t.kshow(preview) : ' '}</span>
      </div>
      {err && <p className="acc-msg acc-msg--bad" role="alert">{err}</p>}
      <div className="acc-row">
        <button type="submit" className="ui-btn ui-btn--primary" data-testid="kunya-save">{t.save}</button>
        {cur && <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { writeKunya(null); setN(''); setMsg(t.kRemoved) }}>{t.remove}</button>}
      </div>
      <Live msg={msg} />
    </form>
  )
}

/** Profil bölməsinin altı: bayram kartları, (qeydiyyatdan sonra) kunya addımı, kunya */
export function JTop({ user, lang = 'az' }) {
  const t = pickUi(T, lang, 'en')
  const fmt = useMemo(() => makeFormat(lang), [lang])
  const location = useLocation()
  const welcome = new URLSearchParams(location.search).get('welcome') === '1'
  const [step, setStep] = useState(() => welcome && !readKunya())
  const today = localDay()
  const stepRef = useRef(null)
  useEffect(() => { if (step) stepRef.current?.focus() }, [step])
  return (
    <>
      <Celebrations user={user} t={t} fmt={fmt} lang={lang} today={today} />
      {step && (
        <section className="ui-card acc-section accj-welcome" aria-labelledby="accj-welcome-t" data-testid="kunya-welcome">
          <header className="acc-section__head">
            <span className="ui-icon-tile"><Icon name="user" size={20} /></span>
            <div>
              <h2 className="acc-section__title" id="accj-welcome-t" tabIndex={-1} ref={stepRef}>{t.welcome}</h2>
              <p className="acc-section__lead">{t.welcomeLead}</p>
            </div>
          </header>
          <p className="accj-note">{t.kunyaLead}</p>
          <KunyaForm t={t} lang={lang} onDone={() => setStep(false)} />
          <div><button type="button" className="ui-btn ui-btn--secondary" onClick={() => setStep(false)} data-testid="kunya-skip">{t.skip}</button></div>
        </section>
      )}
      {!step && (
        <Section icon="user" title={t.kunya} lead={t.kunyaLead} id="acc-kunya" testId="acc-kunya">
          <KunyaForm t={t} lang={lang} />
        </Section>
      )}
    </>
  )
}

// ═══ Sevimli qari ═══
function ReciterPicker({ t, lang }) {
  const [id, setId] = useState(() => favoriteReciter())
  const [msg, setMsg] = useState('')
  const [playing, setPlaying] = useState(false)
  const audio = useRef(null)
  useEffect(() => {
    const re = () => setId(favoriteReciter())
    window.addEventListener(AUDIO_PREFS_EVENT, re)
    window.addEventListener('storage', re)
    return () => {
      window.removeEventListener(AUDIO_PREFS_EVENT, re); window.removeEventListener('storage', re)
      audio.current?.pause()
    }
  }, [])
  const stop = () => { audio.current?.pause(); setPlaying(false) }
  const play = () => {
    if (playing) { stop(); return }
    const urls = previewSources(id)
    const a = audio.current || (audio.current = new Audio())
    let i = 0
    const next = () => {
      if (i >= urls.length) { setPlaying(false); setMsg(t.rFail); return }
      a.src = urls[i++]
      a.play().then(() => setPlaying(true)).catch(() => { /* error hadisəsində növbəti */ })
    }
    a.onerror = next
    a.onended = () => setPlaying(false)
    next()
  }
  return (
    <div className="ui-field accj-reciter" data-testid="reciter-picker">
      <label className="ui-field__label" htmlFor="accj-reciter">{t.reciter}</label>
      <div className="acc-row">
        <select id="accj-reciter" className="ui-input" value={id} aria-describedby="accj-reciter-hint" data-testid="reciter-select"
          onChange={(e) => { stop(); setId(setFavoriteReciter(e.target.value)); setMsg(t.rSaved) }}>
          {RECITERS.map((r) => <option key={r.id} value={r.id}>{reciterName(r.id, lang)}</option>)}
        </select>
        <button type="button" className="ui-btn ui-btn--secondary" onClick={play} aria-pressed={playing} data-testid="reciter-preview">
          <Icon name={playing ? 'pause' : 'volume'} size={16} className="ui-btn__icon" /> {playing ? t.stop : t.listen}
        </button>
      </div>
      <span className="ui-field__hint" id="accj-reciter-hint">{t.reciterHint}</span>
      <Live msg={msg} />
    </div>
  )
}

// ═══ Ad günü ═══
function BirthdayForm({ t, lang }) {
  const cur = readBirthday()
  const [m, setM] = useState(cur ? String(cur.m) : '')
  const [d, setD] = useState(cur ? String(cur.d) : '')
  const [y, setY] = useState(cur?.y ? String(cur.y) : '')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const months = G_MONTHS[lang] || G_MONTHS.en
  const maxD = m ? [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(m) - 1] : 31
  const save = (e) => {
    e.preventDefault()
    if (!m || !d) { setErr(t.bNeed); return }
    writeBirthday({ m: Number(m), d: Number(d), y: y ? Number(y) : undefined })
    setErr(''); setMsg(t.bSaved)
  }
  return (
    <form className="acc-form" onSubmit={save} noValidate data-testid="birthday-form">
      <div className="accj-grid3">
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="accj-bm">{t.month}</label>
          <select id="accj-bm" className="ui-input" value={m} onChange={(e) => setM(e.target.value)} data-testid="bday-month">
            <option value="">{t.choose}</option>
            {months.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="accj-bd">{t.day}</label>
          <select id="accj-bd" className="ui-input" value={d} onChange={(e) => setD(e.target.value)} data-testid="bday-day">
            <option value="">{t.choose}</option>
            {Array.from({ length: maxD }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </div>
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="accj-by">{t.year}</label>
          <input id="accj-by" className="ui-input" inputMode="numeric" maxLength={4} value={y} onChange={(e) => setY(e.target.value.replace(/\D/g, ''))} autoComplete="bday-year" />
        </div>
      </div>
      {err && <p className="acc-msg acc-msg--bad" role="alert">{err}</p>}
      <div className="acc-row">
        <button type="submit" className="ui-btn ui-btn--primary" data-testid="bday-save">{t.save}</button>
        {cur && <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { writeBirthday(null); setM(''); setD(''); setY(''); setMsg(t.bRemoved) }}>{t.remove}</button>}
      </div>
      <Live msg={msg} />
    </form>
  )
}

// ═══ İslam yolundakı hekayəm ═══
function eventText(e, t, lang) {
  switch (e.k) {
    case 'account': return t.ev.account
    case 'khatm': return t.ev.khatm(e.n)
    case 'ramadan': return t.ev.ramadan(e.y)
    case 'hifz': return t.ev.hifz(staticSurahName(e.s, lang))
    case 'stamp': return t.ev.stamp(stampName(e.id, lang))
    case 'ummah': return t.ev.ummah(e.no)
    case 'mosque': return t.ev.mosque
    case 'dua': return t.ev.dua
    case 'milestone': return e.m.k === 'other' ? e.m.ti : (e.m.ti || t.kinds[e.m.k])
    default: return ''
  }
}

function MilestoneForm({ t, onAdded }) {
  const [k, setK] = useState('hajj')
  const [ti, setTi] = useState('')
  const [d, setD] = useState('')
  const [no, setNo] = useState('')
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!d) { setErr(t.mNeedDate); return }
    if (k === 'other' && !ti.trim()) { setErr(t.mNeedTitle); return }
    const r = addMilestone({ d, k, ti: k === 'other' ? ti : '', no })
    if (!r.ok) { setErr(t.mNeedDate); return }
    setErr(''); setTi(''); setD(''); setNo('')
    onAdded(t.mAdded)
  }
  return (
    <form className="acc-form accj-mform" onSubmit={submit} noValidate data-testid="milestone-form">
      <h3 className="accj-h3">{t.addTitle}</h3>
      <div className="accj-grid3">
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="accj-mk">{t.kind}</label>
          <select id="accj-mk" className="ui-input" value={k} onChange={(e) => setK(e.target.value)} data-testid="milestone-kind">
            {MILESTONE_KINDS.map((x) => <option key={x} value={x}>{t.kinds[x]}</option>)}
          </select>
        </div>
        {k === 'other' && (
          <div className="ui-field">
            <label className="ui-field__label" htmlFor="accj-mt">{t.mTitle}</label>
            <input id="accj-mt" className="ui-input" value={ti} maxLength={TITLE_MAX} dir="auto" onChange={(e) => setTi(e.target.value)} data-testid="milestone-title" />
          </div>
        )}
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="accj-md">{t.date}</label>
          <input id="accj-md" type="date" className="ui-input" value={d} max={localDay()} onChange={(e) => setD(e.target.value)} data-testid="milestone-date" />
        </div>
      </div>
      <div className="ui-field">
        <label className="ui-field__label" htmlFor="accj-mn">{t.note}</label>
        <textarea id="accj-mn" className="ui-input" rows={2} maxLength={NOTE_MAX} dir="auto" value={no} onChange={(e) => setNo(e.target.value)}
          aria-describedby="accj-mn-c" data-testid="milestone-note" />
        <span className="ui-field__hint ui-num" id="accj-mn-c">{t.chars([...no].length, NOTE_MAX)}</span>
      </div>
      {err && <p className="acc-msg acc-msg--bad" role="alert">{err}</p>}
      <div><button type="submit" className="ui-btn ui-btn--primary" data-testid="milestone-add"><Icon name="plus" size={16} className="ui-btn__icon" /> {t.add}</button></div>
    </form>
  )
}

function Timeline({ user, t, lang }) {
  const src = useJourney()
  const [msg, setMsg] = useState('')
  // Tarixi olmayan əzbər surələr — bu gündən qeyd olunur (geriyə tarix uydurulmur)
  useEffect(() => { recordHifzDates(src.hifz) }, [src.hifz])
  const [mRev, setMRev] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const milestones = useMemo(() => readMilestones(), [mRev, src])
  const events = useMemo(() => buildTimeline(src, { createdAt: user?.createdAt, milestones }), [src, user?.createdAt, milestones])
  const groups = useMemo(() => {
    const g = []
    for (const e of events) {
      const y = e.d.slice(0, 4)
      if (!g.length || g[g.length - 1].y !== y) g.push({ y, list: [] })
      g[g.length - 1].list.push(e)
    }
    return g
  }, [events])
  return (
    <>
      {!events.length ? <p className="accj-empty">{t.storyEmpty}</p> : (
        <div className="accj-tl" data-testid="timeline" data-count={events.length}>
          {groups.map((g) => (
            <section key={g.y} className="accj-tl__year" aria-labelledby={`accj-y-${g.y}`}>
              <h3 className="accj-tl__y ui-num" id={`accj-y-${g.y}`}>{g.y}</h3>
              <ol className="accj-tl__list">
                {g.list.map((e, i) => {
                  const label = eventText(e, t, lang)
                  return (
                    <li key={`${e.k}-${e.d}-${i}`} className={`accj-tl__item accj-tl__item--${e.k}`} data-k={e.k}>
                      <span className="accj-tl__dot" aria-hidden="true"><Icon name={EV_ICON[e.k]} size={14} /></span>
                      <div className="accj-tl__body">
                        <time className="accj-tl__date" dateTime={e.d}>{dayLabel(e.d, lang)}{e.k === 'hifz' ? ` · ${t.ev.hifzNote}` : ''}</time>
                        <strong className="accj-tl__title"><bdi>{label}</bdi></strong>
                        {e.k === 'milestone' && <>
                          <span className="ui-badge ui-badge--outline accj-tl__mine">{t.mine}</span>
                          {e.m.no && <p className="accj-tl__note"><bdi>{e.m.no}</bdi></p>}
                          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm accj-tl__rm" aria-label={t.removeM(label)}
                            onClick={() => { removeMilestone(e.m.id); setMRev((n) => n + 1); setMsg(t.mRemoved) }}>
                            <Icon name="trash" size={14} className="ui-btn__icon" /> {t.remove}
                          </button>
                        </>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
      <MilestoneForm t={t} onAdded={(m) => { setMRev((n) => n + 1); setMsg(m) }} />
      <Live msg={msg} />
    </>
  )
}

// ═══ Yol mərhələsi ═══
function LevelPanel({ user, t, fmt }) {
  const src = useJourney()
  const lv = useMemo(() => journeyLevel(src), [src])
  const initial = ([...String(user?.displayName || user?.email || '?').trim()][0] || '?').toLocaleUpperCase()
  return (
    <div className="accj-level" data-testid="journey-level" data-stage={lv.stage}>
      <div className="accj-level__now">
        <JourneyFrame stage={lv.stage} size="lg"><span className="acc-avatar acc-avatar--lg" aria-hidden="true">{initial}</span></JourneyFrame>
        <div>
          <p className="accj-level__k">{t.current}</p>
          <p className="accj-level__name" data-testid="journey-stage-name">{t.stages[lv.stage]}</p>
          <p className="accj-level__pts ui-num">{t.points(fmt.num(lv.points, { maximumFractionDigits: 0 }))} · {lv.next == null ? t.last : t.toNext(fmt.num(lv.next - lv.points, { maximumFractionDigits: 0 }))}</p>
          <p className="accj-note">{t.yours(lv.parts)}</p>
        </div>
      </div>
      <details className="accj-level__how">
        <summary>{t.how}</summary>
        <ul>{t.rules(LEVEL_POINTS).map((r) => <li key={r}>{r}</li>)}</ul>
        <table className="ui-table ui-table--compact">
          <thead><tr><th scope="col">{t.colStage}</th><th scope="col">{t.colFrom}</th></tr></thead>
          <tbody>
            {LEVEL_THRESHOLDS.map((p, i) => (
              <tr key={p} className={i === lv.stage ? 'is-on' : ''}>
                <th scope="row"><span className="accj-level__mini"><JourneyFrame stage={i} size="sm"><span className="accj-level__chip" /></JourneyFrame></span> {t.stages[i]}</th>
                <td className="ui-num">{fmt.num(p, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}

export default function AccountJSections({ user, lang = 'az' }) {
  const t = pickUi(T, lang, 'en')
  const fmt = useMemo(() => makeFormat(lang), [lang])
  return (
    <>
      <Section icon="prayer" title={t.prefs} lead={t.prefsLead} id="acc-jprefs" testId="acc-jprefs">
        <div className="acc-form">
          <MadhabPicker lang={lang} id="acc-madhab" />
          <ReciterPicker t={t} lang={lang} />
        </div>
      </Section>
      <Section icon="gift" title={t.birthday} lead={t.birthdayLead} id="acc-birthday" testId="acc-birthday">
        <BirthdayForm t={t} lang={lang} />
      </Section>
      <Section icon="history" title={t.story} lead={t.storyLead} id="acc-story" testId="acc-story">
        <DeferRender height="320px" idle={false} rootMargin="300px 0px">
          <Timeline user={user} t={t} lang={lang} />
        </DeferRender>
      </Section>
      <Section icon="compass" title={t.level} lead={t.levelLead} id="acc-level" testId="acc-level">
        <LevelPanel user={user} t={t} fmt={fmt} />
      </Section>
    </>
  )
}
