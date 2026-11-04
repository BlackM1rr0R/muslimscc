// ═══════════════════════════════════════════════════════
// Camaat və Cümə namazı — /jamaat (ümumi məlumat səhifəsi)
//
// Sayt artıq konkret bir məscidin saytı deyil (Muslims.cc), ona görə bu
// səhifədə camaat (iqamə) vaxtı, məscid adı və ünvanı YOXDUR. Əvəzində:
// • Növbəti namaz və bugünkü AZAN vaxtları — istifadəçinin seçdiyi şəhər
//   üçün (usePrayerTimes + utils/prayerLocation; /prayer ilə eyni seçim).
//   Vaxtlar hesablanmışdır və belə qeyd olunur.
// • Cümə kartı: növbəti cümənin tarixi və həmin günün zöhr azanı — cümə
//   namazı zöhr vaxtında qılınır; dəqiq vaxtı yaxınlıqdakı məsciddən öyrənmək
//   tövsiyə olunur ("Yaxınlıqdakı məscidi tap" → /mosques).
// • Fəzilətlər: ayələr işləmə zamanı api.alquran.cloud-dan gətirilir
//   (mətn yaddaşdan YAZILMIR), hədislər src/data/jamaatVirtues.js-dən
//   (saytın hədis bazasından olduğu kimi köçürülüb).
// ═══════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName, filled } from '../config/brand'
import usePrayerTimes, { PRAYER_NAMES, toMinutes } from '../hooks/usePrayerTimes'
import { JAMAAT_VIRTUES, JUMUA_VIRTUES } from '../data/jamaatVirtues'
import { VerseCard, HadithCard } from '../components/VirtueCards'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import CityPicker from '../components/CityPicker'
import '../styles/JamaatPage.css'
import '../styles/ToolsMotion.css'
import RollingDigits from '../components/prayer/RollingDigits'
import Breadcrumb from '../components/Breadcrumb'
import PageLink from '../components/PageLink'
import { ChartFigure, BarChart } from '../components/viz'
import { localizeSource } from '../utils/sourceNames'

// ── Dizayn v3: yeni bölmələr (5 dil) ──
// Hədislər yoxlanılıb (fawazahmed0/hadith-api; Müslim — Əbdülbaqi nömrəsi):
//   Buxari 645 (27 dərəcə), 646 (25 dərəcə — Əbu Səid rəvayəti), 644 (camaata
//   gəlməyənlər), 657 (sübh və işa münafiqlərə ağırdır), 877 (cümə qüslü),
//   881 (cüməyə tez getmək), 934 (xütbədə susmaq), 935 (cümə günü duanın
//   qəbul anı); Müslim 881 (cümədən sonra 4 rükət).
const V3 = {
  how: {
    az: 'Necə işlədilir: seçdiyiniz şəhərin bugünkü azan vaxtları və növbəti cümə burada görünür. Camaat (iqamə) vaxtı hər məsciddə fərqlidir — onu məscidinizdən öyrənin.',
    en: 'How to use: you see today’s adhan times and the next Friday for your chosen city. The congregation (iqamah) time differs per mosque — check it with your mosque.',
    ru: 'Как пользоваться: здесь время азана на сегодня и ближайшая пятница для выбранного города. Время джамаата (икамы) в каждой мечети своё — уточняйте в своей мечети.',
    ar: 'طريقة الاستخدام: تظهر هنا مواقيت الأذان اليوم والجمعة القادمة لمدينتك. وقت الإقامة يختلف من مسجد لآخر، فاسأل عنه في مسجدك.',
    tr: 'Nasıl kullanılır: seçtiğiniz şehrin bugünkü ezan vakitleri ve sıradaki cuma burada. Cemaat (kamet) vakti her camide farklıdır — camiinizden öğrenin.',
  },
  stDeg: { az: 'dərəcə — camaatın üstünlüyü', en: 'degrees — the merit of congregation', ru: 'степеней — превосходство джамаата', ar: 'درجة — فضل الجماعة', tr: 'derece — cemaatin üstünlüğü' },
  stFri: { az: 'növbəti cümə', en: 'next Friday', ru: 'ближайшая пятница', ar: 'الجمعة القادمة', tr: 'sıradaki cuma' },
  glEyebrow: { az: 'Bir baxışda', en: 'At a glance', ru: 'С первого взгляда', ar: 'نظرة سريعة', tr: 'Bir bakışta' },
  glTitle: { az: 'Camaatla namaz — 27 dərəcə', en: 'Prayer in congregation — 27 degrees', ru: 'Намаз в джамаате — 27 степеней', ar: 'صلاة الجماعة — سبع وعشرون درجة', tr: 'Cemaatle namaz — 27 derece' },
  glLead: { az: 'Eyni namaz, fərqli savab: camaatla qılınan namaz tək qılınandan iyirmi yeddi dərəcə üstündür.', en: 'The same prayer, a different reward: prayer in congregation surpasses praying alone by twenty-seven degrees.', ru: 'Тот же намаз — разная награда: намаз в джамаате превосходит одиночный на двадцать семь степеней.', ar: 'الصلاة نفسها والأجر مختلف: صلاة الجماعة تفضل صلاة الفذّ بسبع وعشرين درجة.', tr: 'Aynı namaz, farklı sevap: cemaatle namaz tek başına kılınandan yirmi yedi derece üstündür.' },
  chTitle: { az: 'Namazın dərəcəsi', en: 'The degree of the prayer', ru: 'Степень намаза', ar: 'درجة الصلاة', tr: 'Namazın derecesi' },
  chSub: { az: 'tək namaz = 1', en: 'praying alone = 1', ru: 'одиночный намаз = 1', ar: 'صلاة الفذّ = 1', tr: 'tek namaz = 1' },
  alone: { az: 'Tək namaz', en: 'Praying alone', ru: 'Одиночный намаз', ar: 'صلاة الفذّ', tr: 'Tek başına namaz' },
  together: { az: 'Camaatla namaz', en: 'In congregation', ru: 'Намаз в джамаате', ar: 'صلاة الجماعة', tr: 'Cemaatle namaz' },
  chNote: { az: 'Mənbə: Buxari 645 (İbn Ömər). Əbu Səidin rəvayətində — 25 dərəcə (Buxari 646).', en: 'Source: Bukhari 645 (Ibn Umar). In Abu Sa‘id’s narration — 25 degrees (Bukhari 646).', ru: 'Источник: Бухари 645 (Ибн Умар). В передаче Абу Саида — 25 степеней (Бухари 646).', ar: 'المصدر: البخاري 645 (ابن عمر)، وفي رواية أبي سعيد: بخمس وعشرين درجة (البخاري 646).', tr: 'Kaynak: Buhârî 645 (İbn Ömer). Ebû Saîd rivayetinde — 25 derece (Buhârî 646).' },
  weightTitle: { az: 'Camaatın əhəmiyyəti', en: 'How important congregation is', ru: 'Важность джамаата', ar: 'أهمية الجماعة', tr: 'Cemaatin önemi' },
  weightText: { az: 'Peyğəmbər ﷺ camaata gəlməyən kişilərin evlərini yandırmağı qəsd etdiyini bildirib (Buxari 644) və münafiqlərə ən ağır namazların sübh və işa olduğunu demişdir (Buxari 657).', en: 'The Prophet ﷺ said he was about to burn the houses of men who stayed away from the congregation (Bukhari 644), and that the heaviest prayers for the hypocrites are Fajr and Isha (Bukhari 657).', ru: 'Пророк ﷺ сказал, что хотел сжечь дома мужчин, не приходящих на джамаат (Бухари 644), и что тяжелее всего для лицемеров — утренний намаз и иша (Бухари 657).', ar: 'أخبر النبي ﷺ أنه همّ أن يحرّق على رجال لا يشهدون الجماعة بيوتهم (البخاري 644)، وأن أثقل الصلاة على المنافقين الفجر والعشاء (البخاري 657).', tr: 'Peygamber ﷺ cemaate gelmeyen adamların evlerini yakmayı düşündüğünü söyledi (Buhârî 644); münafıklara en ağır gelen namazların sabah ve yatsı olduğunu bildirdi (Buhârî 657).' },
  stepsEyebrow: { az: 'Cümə günü', en: 'Friday', ru: 'Пятница', ar: 'يوم الجمعة', tr: 'Cuma günü' },
  stepsTitle: { az: 'Cümə günü — addım-addım', en: 'Friday, step by step', ru: 'Пятница шаг за шагом', ar: 'يوم الجمعة خطوة بخطوة', tr: 'Cuma günü — adım adım' },
  stepsLead: { az: 'Sünnədə gələn beş əməl — səhər qüslündən axşama qədər.', en: 'Five practices from the Sunnah — from the morning ghusl to the end of the day.', ru: 'Пять дел из Сунны — от утреннего гусля до конца дня.', ar: 'خمس سنن من الصباح إلى آخر اليوم.', tr: 'Sünnette gelen beş amel — sabah guslünden akşama kadar.' },
  steps: [
    { t: { az: 'Qüsl alın', en: 'Take a ghusl', ru: 'Совершите гусль', ar: 'الاغتسال', tr: 'Gusül alın' }, d: { az: '“Sizdən biriniz cüməyə gələndə qüsl etsin.”', en: '“When one of you comes to the Friday prayer, let him take a bath.”', ru: '«Когда кто-то из вас идёт на джуму, пусть совершит гусль».', ar: '«إذا جاء أحدكم الجمعة فليغتسل».', tr: '“Biriniz cumaya geldiğinde gusletsin.”' }, src: 'Buxari 877' },
    { t: { az: 'Tez gedin', en: 'Go early', ru: 'Приходите рано', ar: 'التبكير', tr: 'Erken gidin' }, d: { az: 'İlk saatda gələn dəvə qurban kəsmiş kimidir; imam çıxanda mələklər zikri dinləməyə gəlir.', en: 'Who comes in the first hour is like one who offered a camel; when the imam comes out, the angels come to listen to the reminder.', ru: 'Пришедший в первый час подобен принёсшему в жертву верблюда; когда выходит имам, ангелы приходят слушать напоминание.', ar: 'من راح في الساعة الأولى فكأنما قرّب بدنة، فإذا خرج الإمام حضرت الملائكة يستمعون الذكر.', tr: 'İlk saatte gelen deve kurban etmiş gibidir; imam çıkınca melekler zikri dinlemeye gelir.' }, src: 'Buxari 881' },
    { t: { az: 'Xütbəni susaraq dinləyin', en: 'Listen to the khutbah in silence', ru: 'Слушайте хутбу молча', ar: 'الإنصات للخطبة', tr: 'Hutbeyi susarak dinleyin' }, d: { az: 'İmam xütbə oxuyarkən yoldaşına “sus” desən belə, boş söz danışmış olursan.', en: 'Even saying “be quiet” to your companion while the imam is speaking is idle talk.', ru: 'Даже сказать соседу «молчи», когда имам читает хутбу, — пустословие.', ar: 'إذا قلت لصاحبك يوم الجمعة: أنصت، والإمام يخطب، فقد لغوت.', tr: 'İmam hutbe okurken arkadaşına “sus” demek bile boş söz sayılır.' }, src: 'Buxari 934' },
    { t: { az: 'Cümədən sonra 4 rükət', en: '4 rak‘ahs after Jumu‘ah', ru: '4 ракаата после джумы', ar: 'أربع ركعات بعد الجمعة', tr: 'Cumadan sonra 4 rekât' }, d: { az: '“Sizdən biriniz cüməni qıldıqdan sonra dörd rükət qılsın.”', en: '“When one of you has prayed the Friday prayer, let him pray four after it.”', ru: '«Когда кто-то из вас совершит джуму, пусть помолится после неё четыре ракаата».', ar: '«إذا صلّى أحدكم الجمعة فليصلّ بعدها أربعًا».', tr: '“Biriniz cumayı kıldıktan sonra dört rekât kılsın.”' }, src: 'Müslim 881' },
    { t: { az: 'Dua anını axtarın', en: 'Seek the moment of du‘a', ru: 'Ищите час дуа', ar: 'تحرّي ساعة الإجابة', tr: 'Dua anını arayın' }, d: { az: 'Cümə günü bir an var: müsəlman bəndə namazda ikən o an Allahdan nə istəsə, ona verilir.', en: 'On Friday there is a moment: no Muslim servant standing in prayer asks Allah for something in it but He gives it to him.', ru: 'В пятницу есть час: о чём бы мусульманин, стоящий в молитве, ни попросил в это время Аллаха, ему будет дано.', ar: 'فيه ساعة لا يوافقها عبد مسلم وهو قائم يصلي يسأل الله تعالى شيئًا إلا أعطاه إياه.', tr: 'Cuma gününde bir an vardır: namazda olan Müslüman kul o anda Allah’tan ne isterse verilir.' }, src: 'Buxari 935' },
  ],
}
// Qüsl hədisi (Buxari 877) addımlarda göstərilir — fəzilət kartlarında təkrarlanmır
const JUMUA_CARDS = JUMUA_VIRTUES.filter(h => h.source !== 'Buxari 877')

const LABELS = {
  az: {
    title: 'Camaat və cümə namazı',
    lead: 'Seçdiyiniz şəhər üçün bugünkü azan vaxtları, növbəti cümə namazı və camaatla namazın fəziləti haqqında ayə və hədislər.',
    next: 'Növbəti namaz', tomorrow: 'sabah', nextBadge: 'Növbəti', jumuaTag: 'Cümə',
    untilAdhan: 'azana qalıb',
    adhanTitle: 'Bugünkü azan vaxtları', calcBadge: 'Hesablanmış',
    cityLine: (c) => `${c} üçün hesablanıb`, changeCity: 'Şəhəri dəyiş',
    sunriseNote: 'Sübh namazının vaxtı bitir',
    friday: 'Cümə namazı', dhuhrAdhan: 'Zöhr azanı',
    fridayGeneral: 'Cümə namazı zöhr vaxtında, camaatla qılınır. Xütbənin və namazın dəqiq vaxtını yaxınlığınızdakı məsciddən öyrənin.',
    khutbahBefore: 'Cümə namazından əvvəl xütbə oxunur — xütbəyə çatmaq üçün bir az tez gəlin.',
    rel: (n) => (n === 0 ? 'Bu gün' : n === 1 ? 'Sabah' : `${n} gün sonra`),
    more: 'Faydalı keçidlər',
    findMosque: 'Yaxınlıqdakı məscidi tap', findMosqueSub: 'Xəritədə ən yaxın məscidlər və yol tarifi',
    otherCities: 'Namaz vaxtları', otherCitiesSub: 'Başqa şəhər seçin, namaz izləyicisi',
    qibla: 'Qiblə istiqaməti', qiblaSub: 'Kəbəyə dəqiq istiqamət',
    virtues: 'Fəzilətlər', virtuesSub: 'Camaat və cümə namazı haqqında ayə və hədislər',
    groupJamaat: 'Camaat namazı', groupJumua: 'Cümə namazı',
    source: 'Azan vaxtları aladhan.com xidməti ilə astronomik hesablanır. Hesablama metodu: {method}.',
    tzNote: (c) => `Bütün vaxtlar ${c} saatı ilə göstərilir.`,
    loading: 'Namaz vaxtları yüklənir...',
    error: 'Namaz vaxtlarını yükləmək alınmadı.', errorSub: 'İnternet bağlantınızı yoxlayıb yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    hijriSuffix: 'H',
    hm: (h, m) => (h ? `${h} saat ${m} dəqiqə` : `${m} dəqiqə`),
  },
  en: {
    title: 'Congregational & Friday Prayer',
    lead: 'Today’s adhan times for your chosen city, the next Friday prayer, and verses and hadith on the virtue of praying in congregation.',
    next: 'Next prayer', tomorrow: 'tomorrow', nextBadge: 'Next', jumuaTag: 'Jumu’ah',
    untilAdhan: 'until adhan',
    adhanTitle: 'Today’s adhan times', calcBadge: 'Calculated',
    cityLine: (c) => `Calculated for ${c}`, changeCity: 'Change city',
    sunriseNote: 'Fajr time ends',
    friday: 'Friday prayer (Jumu’ah)', dhuhrAdhan: 'Dhuhr adhan',
    fridayGeneral: 'The Friday prayer is held in congregation at Dhuhr time. Check the exact time of the khutbah and prayer with a mosque near you.',
    khutbahBefore: 'The khutbah (sermon) is delivered before the Friday prayer — come a little early to hear it.',
    rel: (n) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`),
    more: 'Useful links',
    findMosque: 'Find a nearby mosque', findMosqueSub: 'The closest mosques on the map, with directions',
    otherCities: 'Prayer times', otherCitiesSub: 'Choose another city, prayer tracker',
    qibla: 'Qibla direction', qiblaSub: 'Precise direction to the Kaaba',
    virtues: 'Virtues', virtuesSub: 'Verses and hadith on congregational and Friday prayer',
    groupJamaat: 'Congregational prayer', groupJumua: 'Friday prayer',
    source: 'Adhan times are astronomically calculated via aladhan.com. Calculation method: {method}.',
    tzNote: (c) => `All times are shown in ${c} local time.`,
    loading: 'Loading prayer times...',
    error: 'Couldn’t load prayer times.', errorSub: 'Please check your internet connection and try again.', retry: 'Try again',
    hijriSuffix: 'AH',
    hm: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
  },
  ru: {
    title: 'Коллективный и пятничный намаз',
    lead: 'Время азана на сегодня для выбранного города, ближайший пятничный намаз, аяты и хадисы о достоинстве коллективной молитвы.',
    next: 'Следующий намаз', tomorrow: 'завтра', nextBadge: 'Следующий', jumuaTag: 'Джума',
    untilAdhan: 'до азана',
    adhanTitle: 'Время азана сегодня', calcBadge: 'Расчётное',
    cityLine: (c) => `Рассчитано для города ${c}`, changeCity: 'Сменить город',
    sunriseNote: 'Время Фаджра заканчивается',
    friday: 'Пятничный намаз (Джума)', dhuhrAdhan: 'Азан Зухр',
    fridayGeneral: 'Пятничный намаз совершается коллективно во время Зухра. Точное время хутбы и намаза уточняйте в ближайшей мечети.',
    khutbahBefore: 'Перед пятничным намазом читается хутба — приходите немного раньше, чтобы её услышать.',
    rel: (n) => {
      if (n === 0) return 'Сегодня'
      if (n === 1) return 'Завтра'
      const m10 = n % 10, m100 = n % 100
      const w = m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней'
      return `Через ${n} ${w}`
    },
    more: 'Полезные ссылки',
    findMosque: 'Найти мечеть рядом', findMosqueSub: 'Ближайшие мечети на карте и маршрут',
    otherCities: 'Время намаза', otherCitiesSub: 'Выбрать другой город, трекер намазов',
    qibla: 'Направление Киблы', qiblaSub: 'Точное направление к Каабе',
    virtues: 'Достоинства', virtuesSub: 'Аяты и хадисы о коллективном и пятничном намазе',
    groupJamaat: 'Коллективный намаз', groupJumua: 'Пятничный намаз',
    source: 'Время азана рассчитано астрономически сервисом aladhan.com. Метод расчёта: {method}.',
    tzNote: (c) => `Всё время указано по местному времени (${c}).`,
    loading: 'Загрузка времени намаза...',
    error: 'Не удалось загрузить время намаза.', errorSub: 'Проверьте подключение к интернету и попробуйте снова.', retry: 'Повторить',
    hijriSuffix: 'г. х.',
    hm: (h, m) => (h ? `${h} ч ${m} мин` : `${m} мин`),
  },
  ar: {
    title: 'صلاة الجماعة والجمعة',
    lead: 'مواقيت الأذان لهذا اليوم في المدينة التي تختارها، وموعد صلاة الجمعة القادمة، وآيات وأحاديث في فضل صلاة الجماعة.',
    next: 'الصلاة القادمة', tomorrow: 'غدًا', nextBadge: 'التالية', jumuaTag: 'الجمعة',
    untilAdhan: 'حتى الأذان',
    adhanTitle: 'أوقات الأذان اليوم', calcBadge: 'محسوبة',
    cityLine: (c) => `محسوبة لمدينة ${c}`, changeCity: 'تغيير المدينة',
    sunriseNote: 'ينتهي وقت الفجر',
    friday: 'صلاة الجمعة', dhuhrAdhan: 'أذان الظهر',
    fridayGeneral: 'تُقام صلاة الجمعة جماعةً في وقت الظهر. تحقّق من الوقت الدقيق للخطبة والصلاة في أقرب مسجد إليك.',
    khutbahBefore: 'تُلقى خطبة الجمعة قبل الصلاة — احرص على الحضور مبكرًا لسماعها.',
    rel: (n) => (n === 0 ? 'اليوم' : n === 1 ? 'غدًا' : n === 2 ? 'بعد يومين' : n <= 10 ? `بعد ${n} أيام` : `بعد ${n} يومًا`),
    more: 'روابط مفيدة',
    findMosque: 'ابحث عن مسجد قريب', findMosqueSub: 'أقرب المساجد على الخريطة مع الاتجاهات',
    otherCities: 'مواقيت الصلاة', otherCitiesSub: 'اختر مدينة أخرى، متابعة الصلوات',
    qibla: 'اتجاه القبلة', qiblaSub: 'الاتجاه الدقيق نحو الكعبة',
    virtues: 'الفضائل', virtuesSub: 'آيات وأحاديث في فضل صلاة الجماعة وصلاة الجمعة',
    groupJamaat: 'صلاة الجماعة', groupJumua: 'صلاة الجمعة',
    source: 'أوقات الأذان محسوبة فلكيًا عبر خدمة aladhan.com. طريقة الحساب: {method}.',
    tzNote: (c) => `جميع الأوقات بالتوقيت المحلي لمدينة ${c}.`,
    loading: 'جارٍ تحميل مواقيت الصلاة...',
    error: 'تعذّر تحميل مواقيت الصلاة.', errorSub: 'يُرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.', retry: 'إعادة المحاولة',
    hijriSuffix: 'هـ',
    hm: (h, m) => (h ? `${h} ساعة و${m} دقيقة` : `${m} دقيقة`),
  },
  tr: {
    title: 'Cemaat ve Cuma Namazı',
    lead: 'Seçtiğiniz şehir için bugünkü ezan vakitleri, sıradaki cuma namazı ve cemaatle namazın fazileti hakkında ayet ve hadisler.',
    next: 'Sıradaki namaz', tomorrow: 'yarın', nextBadge: 'Sıradaki', jumuaTag: 'Cuma',
    untilAdhan: 'ezana kaldı',
    adhanTitle: 'Bugünkü ezan vakitleri', calcBadge: 'Hesaplanmış',
    cityLine: (c) => `${c} için hesaplandı`, changeCity: 'Şehri değiştir',
    sunriseNote: 'Sabah namazı vakti biter',
    friday: 'Cuma namazı', dhuhrAdhan: 'Öğle ezanı',
    fridayGeneral: 'Cuma namazı öğle vaktinde cemaatle kılınır. Hutbenin ve namazın kesin saatini yakınınızdaki camiden öğrenin.',
    khutbahBefore: 'Cuma namazından önce hutbe okunur — hutbeye yetişmek için biraz erken gelin.',
    rel: (n) => (n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : `${n} gün sonra`),
    more: 'Faydalı bağlantılar',
    findMosque: 'Yakındaki camiyi bul', findMosqueSub: 'Haritada en yakın camiler ve yol tarifi',
    otherCities: 'Namaz vakitleri', otherCitiesSub: 'Başka bir şehir seçin, namaz takibi',
    qibla: 'Kıble yönü', qiblaSub: 'Kâbe’ye tam yön',
    virtues: 'Faziletler', virtuesSub: 'Cemaat ve cuma namazı hakkında ayet ve hadisler',
    groupJamaat: 'Cemaatle namaz', groupJumua: 'Cuma namazı',
    source: 'Ezan vakitleri aladhan.com hizmetiyle astronomik olarak hesaplanır. Hesaplama yöntemi: {method}.',
    tzNote: (c) => `Tüm vakitler ${c} yerel saatiyle gösterilir.`,
    loading: 'Namaz vakitleri yükleniyor...',
    error: 'Namaz vakitleri yüklenemedi.', errorSub: 'İnternet bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar dene',
    hijriSuffix: 'H',
    hm: (h, m) => (h ? `${h} saat ${m} dakika` : `${m} dakika`),
  },
}

// Hicri ay adları (CalendarPage ilə eyni yazılış)
const HIJRI_MONTHS = {
  az: ['Məhərrəm','Səfər','Rəbiül-Əvvəl','Rəbiül-Axir','Cəmadiyül-Əvvəl','Cəmadiyül-Axir','Rəcəb','Şaban','Ramazan','Şəvval','Zülqədə','Zülhiccə'],
  en: ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
  ru: ['Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани','Джумада аль-Уля','Джумада ас-Сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'],
  tr: ['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
}

// aladhan hesablama metodları (saytda istifadə olunan)
const METHOD_NAMES = {
  99: {
    az: 'Bakı, Əbu Bəkr məscidinin cədvəli (Ümmül-Qura: sübh 18.5°, işa məğribdən 90 dəq. sonra)',
    en: 'Abu Bakr Mosque, Baku timetable (Umm al-Qura: Fajr 18.5°, Isha 90 min after Maghrib)',
    ru: 'Расписание мечети Абу Бакр, Баку (Умм аль-Кура: фаджр 18,5°, иша через 90 мин после магриба)',
    ar: 'جدول مسجد أبي بكر في باكو (أم القرى: الفجر 18.5°، العشاء بعد المغرب بـ90 دقيقة)',
    tr: 'Bakü Ebu Bekir Camii takvimi (Ümmü’l-Kurâ: sabah 18,5°, yatsı akşamdan 90 dk sonra)',
  },
  13: {
    az: 'Türkiyə Diyanət İşləri Başqanlığı',
    en: 'Diyanet (Presidency of Religious Affairs, Türkiye)',
    ru: 'Диянет (Управление по делам религии Турции)',
    ar: 'رئاسة الشؤون الدينية التركية (ديانت)',
    tr: 'Diyanet İşleri Başkanlığı',
  },
}

// v2: emoji əvəzinə xətti ikonlar (Icon.jsx) — /prayer və ana səhifə ilə eyni
const PRAYER_ICONS = { fajr: 'sunrise', sunrise: 'sun', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }

// Qriqorian tarix üçün lokal — ərəbcədə Qriqorian təqvim və latın rəqəmləri
// (vaxtlar da latın rəqəmləri ilə göstərilir)
const LOCALES = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }

// Bəzi brauzerlərdə (məs. Chrome-un yığcam ICU-su) "az" lokalı yoxdur və
// tarix "2026 M09 19" kimi çıxır — ona görə azərbaycanca əl ilə yazılır
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']
const AZ_WEEKDAYS = ['bazar','bazar ertəsi','çərşənbə axşamı','çərşənbə','cümə axşamı','cümə','şənbə']

const pad2 = (n) => String(n).padStart(2, '0')

/** 'DD-MM-YYYY' → dilə uyğun uzun tarix (istəyə görə həftə günü ilə). */
function formatGregorian(dateKey, lang, withWeekday = true) {
  const [d, m, y] = String(dateKey || '').split('-').map(Number)
  if (!d || !m || !y) return ''
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  if (lang === 'az') {
    const base = `${d} ${AZ_MONTHS[m - 1]} ${y}`
    return withWeekday ? `${base}, ${AZ_WEEKDAYS[date.getUTCDay()]}` : base
  }
  const opts = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
  if (withWeekday) opts.weekday = 'long'
  try {
    return date.toLocaleDateString(LOCALES[lang] || 'en-GB', opts)
  } catch {
    return date.toLocaleDateString('en-GB', opts)
  }
}

function formatHijri(hijri, lang, suffix) {
  if (!hijri || !filled(hijri.day) || !filled(hijri.year)) return ''
  const idx = Number(hijri.month) - 1
  const month = HIJRI_MONTHS[lang]?.[idx] || (lang === 'ar' ? hijri.monthAr : hijri.monthEn)
  if (!filled(month)) return ''
  return `${hijri.day} ${month} ${hijri.year} ${suffix}`
}

/** Ziyarətçinin cihazı seçilmiş şəhərdən başqa saat qurşağındadırsa true. */
function isForeignTimezone(tz) {
  try {
    const own = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz || own === tz) return false
    const fmt = (zone) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date())
    return fmt(own) !== fmt(tz)
  } catch {
    return false
  }
}

// ── Canlı geri sayım — yalnız bu kiçik komponent hər saniyə yenilənir ──
function Countdown({ at, from, hm }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [at])

  const total = Math.max(0, Math.floor((at - now) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  // Əvvəlki fərz azanından bu ana qədər ötən hissə — zolaq scaleX ilə dolur
  const span = from != null ? at - from : 0
  const frac = span > 0 && span < 86400000 ? Math.min(1, Math.max(0, (now - from) / span)) : null

  return (
    <>
      <div className="jm-count" role="timer" aria-label={hm(h, m)}>
        <span className="jm-time"><RollingDigits value={`${pad2(h)}:${pad2(m)}:${pad2(s)}`} /></span>
      </div>
      {frac != null && (
        <span className="jm-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${frac.toFixed(4)})` }} />
        </span>
      )}
    </>
  )
}

// ── Vaxt siyahısının bir sətri ──
function TimeRow({ p, l, name, time, isNext, isPassed, jumuaTag, note }) {
  const cls = [
    'jm-li',
    'jm-li--adhan',
    p.key === 'sunrise' ? 'is-sunrise' : '',
    isNext ? 'is-next' : '',
    isPassed ? 'is-passed' : '',
  ].filter(Boolean).join(' ')
  return (
    <li className={cls} aria-current={isNext ? 'time' : undefined}>
      <span className="jm-li-icon" aria-hidden="true"><Icon name={PRAYER_ICONS[p.key]} /></span>
      <span className="jm-li-name">
        <span className="jm-li-title">
          {name}
          {jumuaTag && <span className="jm-tag jm-tag--gold">{l.jumuaTag}</span>}
          {isNext && <span className="jm-tag">{l.nextBadge}</span>}
        </span>
        {filled(note) && <small className="jm-li-note">{note}</small>}
      </span>
      <span className="jm-time jm-li-time">{time}</span>
      <span className="jm-li-chk" aria-hidden="true">{isPassed && !isNext ? <Icon name="check" size={14} strokeWidth={2.2} /> : null}</span>
    </li>
  )
}

/** Keçid sətri (düymə — SPA naviqasiyası) */
// Həqiqi link (PageLink): Ctrl/orta klik yeni tabda açır
function LinkRow({ icon, title, sub, to, setPage, onNavigate }) {
  return (
    <PageLink className="ui-tile ui-tile--row jm-link" to={to} setPage={setPage} onNavigate={onNavigate}>
      <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={icon} /></span>
      <span className="ui-tile__body">
        <span className="ui-tile__title">{title}</span>
        <span className="ui-tile__text">{sub}</span>
      </span>
    </PageLink>
  )
}

export default function JamaatPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.en
  const {
    loading, error, date, hijri, prayers, next,
    isFriday, nextJumua, nowSecs, method, location, reload,
  } = usePrayerTimes()

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const name = (key) => PRAYER_NAMES[key]?.[lang] || key

  const brand = brandName(lang)
  const city = location?.city?.[lang] || ''
  const gregorian = formatGregorian(date, lang)
  const hijriStr = formatHijri(hijri, lang, l.hijriSuffix)
  const showTzNote = useMemo(() => isForeignTimezone(location?.tz), [location?.tz])
  const methodName = METHOD_NAMES[method]?.[lang] || `aladhan #${method}`
  const hasData = prayers.length > 0

  // ── Cədvəldə "növbəti" və "keçmiş" sətirlər (şəhərin saatı ilə) ──
  const passed = (hhmm) => {
    const m = toMinutes(hhmm)
    return m != null && m * 60 <= nowSecs
  }
  const nextAdhanKey = next && !next.tomorrow ? next.key : null

  // ── Cümə ──
  const nj = nextJumua || {}
  const fridayDate = formatGregorian(nj.date, lang, false)
  const fridayRel = typeof nj.inDays === 'number' ? l.rel(nj.inDays) : ''
  const P = (o) => o[lang] || o.en

  return (
    <div className="jm-page">
      {/* v2: sakit kağız hero — iz, eyebrow, bir h1, giriş, tarix nişanları */}
      <header className="ui-page-hero jm-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={l.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{l.title}</h1>
          <p className="ui-lead">{l.lead.replace('{brand}', brand)}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {P(V3.how)}</p>
          <ul className="ui-page-hero__stats">
            <li><b>27×</b><span>{P(V3.stDeg)}</span></li>
            {fridayRel && <li><b>{fridayRel}</b><span>{P(V3.stFri)}</span></li>}
          </ul>
          {(gregorian || hijriStr) && (
            <p className="jm-hero-sub">
              {gregorian && <span><Icon name="calendar" size={14} /> {gregorian}</span>}
              {hijriStr && <span><Icon name="moon" size={14} /> {hijriStr}</span>}
            </p>
          )}
        </div>
      </header>

      <div className="jm-wrap">

        {/* ── Yüklənmə / xəta ── */}
        {loading && (
          <div className="jm-loading" aria-busy="true">
            <span className="jm-sr" role="status">{l.loading}</span>
            <div className="skeleton jm-loading-next" aria-hidden="true" />
            <div className="jm-card jm-loading-card" aria-hidden="true">
              <span className="skeleton jm-loading-title" />
              {[0, 1, 2, 3, 4].map(i => <span key={i} className="skeleton jm-loading-row" />)}
            </div>
          </div>
        )}

        {!loading && error && !hasData && (
          <section className="jm-card jm-state" role="alert">
            <span className="jm-state-icon ui-icon-tile ui-icon-tile--neutral ui-icon-tile--lg" aria-hidden="true"><Icon name="alert" /></span>
            <p className="jm-state-title">{l.error}</p>
            <p className="jm-state-sub">{l.errorSub}</p>
            <button type="button" className="ui-btn ui-btn--primary" onClick={reload}><Icon name="refresh" className="ui-btn__icon" /> {l.retry}</button>
          </section>
        )}

        {/* ── Növbəti namaz: azana geri sayım ── */}
        {next && (
          <section className="jm-next" data-reveal="scale" aria-labelledby="jm-next-title">
            <div className="jm-next-info">
              <div className="jm-next-label" id="jm-next-title">
                {l.next}
                {next.tomorrow && <span className="jm-tag">{l.tomorrow}</span>}
              </div>
              <div className="jm-next-name">
                <span className="jm-next-icon" aria-hidden="true"><Icon name={PRAYER_ICONS[next.key]} size={26} /></span>
                <span>{name(next.key)}</span>
                {isFriday && !next.tomorrow && next.key === 'dhuhr' && <span className="jm-tag jm-tag--gold">{l.jumuaTag}</span>}
              </div>
              <dl className="jm-next-times">
                <div>
                  <dt>{city}</dt>
                  <dd><span className="jm-time">{next.adhan}</span></dd>
                </div>
              </dl>
            </div>
            <div className="jm-next-count">
              <Countdown at={next.at} from={next.prevAt} hm={l.hm} />
              <div className="jm-next-caption">{l.untilAdhan}</div>
            </div>
          </section>
        )}

        {/* ── Azan vaxtları | Cümə namazı ── */}
        <div className="jm-grid2">
          {hasData && (
            <section className="jm-card jm-card--jamaat" data-reveal data-reveal-delay="40" aria-labelledby="jm-adhan-title">
              <div className="jm-card-head">
                <h2 id="jm-adhan-title" className="jm-card-title">{l.adhanTitle}</h2>
                <span className="ui-badge">{l.calcBadge}</span>
              </div>

              <ol className="jm-list tm-cascade">
                {prayers.map(p => (
                  <TimeRow
                    key={p.key}
                    p={p}
                    l={l}
                    name={name(p.key)}
                    time={p.adhan}
                    // Cümə günü zöhr sətrində "Cümə" qeydi — camaat vaxtı göstərilmir
                    jumuaTag={isFriday && p.key === 'dhuhr'}
                    note={p.key === 'sunrise' ? l.sunriseNote : ''}
                    isNext={p.key === nextAdhanKey}
                    isPassed={passed(p.adhan)}
                  />
                ))}
              </ol>

              <p className="jm-foot jm-foot--geo">
                <Icon name="pin" size={15} className="jm-foot-ic" /> {l.cityLine(city)}
                <span aria-hidden="true"> · </span>
                {/* Şəhər burada da dəyişir — /prayer-ə keçmədən (components/CityPicker) */}
                <CityPicker renderTrigger={(p) => <button {...p} className="jm-inline-link">{l.changeCity}</button>} />
              </p>
            </section>
          )}

          <section
            className={`jm-card jm-friday ${nj.isToday ? 'is-today' : ''}`}
            data-reveal
            data-reveal-delay="80"
            aria-labelledby="jm-friday-title"
          >
            <div className="jm-card-head">
              <h2 id="jm-friday-title" className="jm-card-title">
                <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--accent" aria-hidden="true"><Icon name="holyplaces" /></span>
                {l.friday}
              </h2>
              {fridayRel && <span className="ui-badge ui-badge--accent">{fridayRel}</span>}
            </div>

            {fridayDate && <p className="jm-friday-date">{fridayDate}</p>}

            <p className="jm-friday-text">{l.fridayGeneral}</p>
            {(filled(nj.adhan) || nj.loading) && (
              <p className="jm-friday-meta">
                {l.dhuhrAdhan}{city ? ` (${city})` : ''}:{' '}
                {filled(nj.adhan)
                  ? <strong><span className="jm-time">{nj.adhan}</span></strong>
                  : <span className="skeleton jm-skel jm-skel--time" aria-hidden="true" />}
              </p>
            )}

            <p className="jm-friday-khutbah">
              <Icon name="mic" size={18} className="jm-friday-khutbah-icon" />
              <span>{l.khutbahBefore}</span>
            </p>

            <PageLink className="ui-btn ui-btn--secondary jm-friday-btn" to="mosques" setPage={setPage} onNavigate={toTop}>
              <Icon name="mosques" className="ui-btn__icon" /> {l.findMosque}
            </PageLink>
          </section>
        </div>

        {/* ── Bir baxışda: 27 dərəcə (BarChart) + camaatın əhəmiyyəti ── */}
        <section className="jm-glance" aria-labelledby="jm-glance-title">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.glEyebrow)}</span>
            <h2 id="jm-glance-title" className="ui-title">{P(V3.glTitle)}</h2>
            <p className="ui-lead">{P(V3.glLead)}</p>
          </div>
          <div className="jm-glance-grid">
            <ChartFigure title={P(V3.chTitle)} sub={P(V3.chSub)} note={P(V3.chNote)}>
              <BarChart labelWidth="34%" label={P(V3.chTitle)} max={27}
                data={[
                  { label: P(V3.alone), value: 1, tone: 'muted' },
                  { label: P(V3.together), value: 27 },
                ]}
                format={(v) => `${v}×`} />
            </ChartFigure>
            <aside className="ui-callout ui-callout--accent jm-weight">
              <Icon name="jamaat" />
              <div>
                <strong className="ui-callout__title">{P(V3.weightTitle)}</strong>
                <p>{P(V3.weightText)}</p>
              </div>
            </aside>
          </div>
        </section>

        {/* ── Cümə günü addım-addım (.ui-steps) ── */}
        <section className="jm-steps" aria-labelledby="jm-steps-title">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.stepsEyebrow)}</span>
            <h2 id="jm-steps-title" className="ui-title">{P(V3.stepsTitle)}</h2>
            <p className="ui-lead">{P(V3.stepsLead)}</p>
          </div>
          <ol className="ui-steps ui-steps--row jm-steps-list" data-reveal="stagger">
            {V3.steps.map((st, i) => (
              <li key={i} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                <div className="ui-step__body">
                  <h3 className="ui-step__title">{P(st.t)}</h3>
                  <p className="ui-step__text">{P(st.d)} <span className="jm-src">{localizeSource(st.src, lang)}</span></p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Fəzilətlər: ayə + hədislər ── */}
        <section className="jm-virtues" aria-labelledby="jm-virtues-title">
          <div className="ui-section-head ui-section-head--center jm-sec-head" data-reveal>
            <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star" /></div>
            <h2 id="jm-virtues-title" className="ui-title">{l.virtues}</h2>
            <p className="ui-lead">{l.virtuesSub}</p>
          </div>

          <div className="jm-vgrid">
            <div className="jm-vgroup" role="group" aria-labelledby="jm-vg-jamaat" data-reveal="stagger">
              <h3 id="jm-vg-jamaat" className="jm-vgroup-title">
                <span className="jm-vgroup-icon ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="jamaat" /></span>
                {l.groupJamaat}
              </h3>
              <VerseCard verseRef="2:43" lang={lang} />
              {JAMAAT_VIRTUES.map(h => <HadithCard key={h.ref} h={h} lang={lang} />)}
            </div>

            <div className="jm-vgroup" role="group" aria-labelledby="jm-vg-jumua" data-reveal="stagger">
              <h3 id="jm-vg-jumua" className="jm-vgroup-title">
                <span className="jm-vgroup-icon ui-icon-tile ui-icon-tile--sm ui-icon-tile--accent" aria-hidden="true"><Icon name="holyplaces" /></span>
                {l.groupJumua}
              </h3>
              <VerseCard verseRef="62:9" lang={lang} />
              {JUMUA_CARDS.map(h => <HadithCard key={h.ref} h={h} lang={lang} />)}
            </div>
          </div>
        </section>

        {/* ── Keçidlər ── */}
        <nav className="jm-links" data-reveal aria-labelledby="jm-links-title">
          <h2 id="jm-links-title" className="jm-links-title">{l.more}</h2>
          <div className="jm-links-list" data-reveal="stagger">
            <LinkRow icon="mosques" title={l.findMosque} sub={l.findMosqueSub} to="mosques" setPage={setPage} onNavigate={toTop} />
            <LinkRow icon="prayer" title={l.otherCities} sub={l.otherCitiesSub} to="prayer" setPage={setPage} onNavigate={toTop} />
            <LinkRow icon="qibla" title={l.qibla} sub={l.qiblaSub} to="qibla" setPage={setPage} onNavigate={toTop} />
          </div>
        </nav>

        {/* ── Mənbə qeydləri ── */}
        <div className="jm-notes" role="note">
          <p>{l.source.replace('{method}', methodName)}</p>
          {showTzNote && city && <p>{l.tzNote(city)}</p>}
        </div>
      </div>
    </div>
  )
}
