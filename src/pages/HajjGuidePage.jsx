import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon3D from '../components/Icon3D'
// Dizayn v2: addım görünüşü artıq tam bu faylın öz .hg-* siniflərindədir —
// Namaz bələdçisinin CSS-i (PrayerGuidePage.css, .pg-*) idxal olunmur, o səhifə
// dəyişəndə həcc bələdçisi pozulmasın.
import HajjMap from '../components/HajjMap'
import '../styles/HajjGuidePage.css'
import Swap from '../components/pagefx/Swap'
import SpotlightCard from '../motion/SpotlightCard'
import '../components/collect/collect.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
// Yer fotoları (Wikimedia Commons) və həcc mərhələləri xəritəsi (öz SVG)
import PlacePhoto from '../components/media/PlacePhoto'
import { HajjRouteMap } from '../components/media/SiraMaps'
import DeferRender from '../components/DeferRender'
import { PLACE_PHOTOS } from '../data/placeImages'
// v3: günbəgün plan, rüknlər siyahısı, ihram qaydaları, həcc növləri (5 dil, mənbəli)
import { useNavigate } from 'react-router-dom'
import { Timeline, ProgressBar } from '../components/viz'
import { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import { HX, HAJJ_DAYS, HAJJ_RITES, IHRAM_NOT, IHRAM_OK, HAJJ_TYPES, HAJJ_VIRTUES, HAJJ_RELATED } from '../data/guides/HajjGuideExtra'
import { pickUi } from '../utils/uiText'
const HajjJourney3D = lazy(() => import('../components/media/HajjJourney3D'))
// v7: təvaf simulyatoru — yalnız bölməyə yaxınlaşanda yüklənir
const TawafSim = lazy(() => import('../components/hajj/TawafSim'))

/** 5 dilli obyektdən cari dil (yoxdursa en → az) */
const P = (o, lang) => (o && (pickUi(o, lang, 'en') || o.az)) || ''

// Seçim ekranındakı "Yerlər və yol" bölməsi (5 dil); hero-da Mina, yanda Məscidül-Haram
const MEDIA_L = {
  az: { eyebrow: 'Xəritə', title: 'Həcc yolu: Məkkədən Ərəfata və geri', lead: 'Mərhələlər Məkkənin şərqində, bir neçə kilometrlik ərazidə keçir.' },
  en: { eyebrow: 'Map', title: 'The Hajj route: from Mecca to Arafat and back', lead: 'The stages take place east of Mecca, within a few kilometres of each other.' },
  ru: { eyebrow: 'Карта', title: 'Путь хаджа: из Мекки к Арафату и обратно', lead: 'Все этапы проходят к востоку от Мекки, в нескольких километрах друг от друга.' },
  ar: { eyebrow: 'خريطة', title: 'طريق الحج: من مكة إلى عرفات والعودة', lead: 'تقع المشاعر شرق مكة على مسافة بضعة كيلومترات بعضها من بعض.' },
  tr: { eyebrow: 'Harita', title: 'Hac yolu: Mekke’den Arafat’a ve geri', lead: 'Aşamalar Mekke’nin doğusunda, birkaç kilometrelik bir alanda gerçekleşir.' },
}

// Təvaf simulyatoru bölməsi (5 dil)
const TAWAF_L = {
  az: { eyebrow: 'Simulyator', title: 'Təvafı barmağınızla edin', lead: 'Kəbənin ətrafında saat əqrəbinin əksinə 7 dövrə — Həcərül-Əsvəd xəttindən başlayıb yenə orada bitir.', open: 'Təvafı simulyatorda məşq edin' },
  en: { eyebrow: 'Simulator', title: 'Walk the tawaf with your finger', lead: 'Seven circuits counter-clockwise around the Kaaba, starting and ending at the Black Stone line.', open: 'Practise tawaf in the simulator' },
  ru: { eyebrow: 'Симулятор', title: 'Совершите таваф пальцем', lead: 'Семь кругов вокруг Каабы против часовой стрелки — от линии Чёрного камня и снова до неё.', open: 'Потренироваться в симуляторе' },
  ar: { eyebrow: 'محاكاة', title: 'طُف بإصبعك', lead: 'سبعة أشواط حول الكعبة عكس عقارب الساعة، تبدأ من خط الحجر الأسود وتنتهي عنده.', open: 'تدرّب على الطواف في المحاكي' },
  tr: { eyebrow: 'Simülatör', title: 'Tavafı parmağınızla yapın', lead: 'Kâbe’nin etrafında saat yönünün tersine 7 şavt; Hacerü’l-Esved hizasından başlar ve orada biter.', open: 'Tavafı simülatörde deneyin' },
}

const LABELS = {
  az: { title:'Həcc və ümrə bələdçisi', subtitle:'Addım-addım həcc və ümrə qaydası', heroArabic:'الْحَجّ', hajj:'Həcc', umrah:'Ümrə', step:'Addım', recite:'Oxu', prev:'Əvvəlki', next:'Növbəti', of:'/', notes:'Qeydlər', complete:'Tamamlandı!', restart:'Yenidən başla', backToSteps:'Addımlara qayıt', steps:'Addımlar' },
  en: { title:'Hajj / Umrah Guide', subtitle:'Step-by-step Hajj and Umrah guide', heroArabic:'الْحَجّ', hajj:'Hajj', umrah:'Umrah', step:'Step', recite:'Recite', prev:'Previous', next:'Next', of:'/', notes:'Notes', complete:'Completed!', restart:'Start again', backToSteps:'Back to steps', steps:'Steps' },
  ru: { title:'Хадж / Умра', subtitle:'Пошаговое руководство по Хаджу и Умре', heroArabic:'الْحَجّ', hajj:'Хадж', umrah:'Умра', step:'Шаг', recite:'Читай', prev:'Назад', next:'Далее', of:'/', notes:'Примечания', complete:'Завершено!', restart:'Начать заново', backToSteps:'К шагам', steps:'Шаги' },
  ar: { title:'دليل الحج والعمرة', subtitle:'دليل الحج والعمرة خطوة بخطوة', heroArabic:'الْحَجّ', hajj:'الحج', umrah:'العمرة', step:'الخطوة', recite:'اقرأ', prev:'السابق', next:'التالي', of:'/', notes:'ملاحظات', complete:'تم الإكمال!', restart:'ابدأ من جديد', backToSteps:'العودة للخطوات', steps:'الخطوات' },
  tr: { title:'Hac / Umre Rehberi', subtitle:'Adım adım Hac ve Umre rehberi', heroArabic:'الْحَجّ', hajj:'Hac', umrah:'Umre', step:'Adım', recite:'Oku', prev:'Önceki', next:'Sonraki', of:'/', notes:'Notlar', complete:'Tamamlandı!', restart:'Yeniden başla', backToSteps:'Adımlara dön', steps:'Adımlar' },
}

// Rəqəmdən sonra "addım" sözünün düzgün forması (ru: 4 шага / 10 шагов,
// ar: 3–10 arası cəm "خطوات", qalanı tək "خطوة"; az/tr-də rəqəmdən sonra tək)
function stepsWord(n, lang) {
  if (lang === 'ru') {
    const d = n % 10, h = n % 100
    if (d === 1 && h !== 11) return 'шаг'
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'шага'
    return 'шагов'
  }
  if (lang === 'ar') return n >= 3 && n <= 10 ? 'خطوات' : 'خطوة'
  if (lang === 'en') return n === 1 ? 'step' : 'steps'
  if (lang === 'tr') return 'adım'
  return 'addım'
}

const HAJJ_STEPS = [
  {
    id: 'ihram',
    icon: 'user',
    arabic: 'إِحْرَام',
    name: { az:'İhram', en:'Ihram', ru:'Ихрам', ar:'الإحرام', tr:'İhram' },
    description: {
      az: 'Həcc üçün niyyət edin. Qüsl alın (yuyunun), ətir vurun. Kişilər iki ağ parça geyinir (izar və rida). Qadınlar adi, təmiz geyim geyinir. Miqat məntəqəsindən ihrama girin. "Ləbbeyk Allahummə ləbbeyk" təlbiyəsini deyin.',
      en: 'Make your intention for Hajj. Perform ghusl (ritual bath), apply fragrance. Men wear two white unstitched cloths (izar and rida). Women wear modest, clean clothing. Enter ihram at the miqat point. Recite the Talbiyah: "Labbayk Allahumma labbayk."',
      ru: 'Сделайте намерение для хаджа. Совершите гусль (ритуальное омовение), нанесите благовония. Мужчины надевают два белых несшитых полотна (изар и рида). Женщины надевают скромную чистую одежду. Войдите в ихрам в точке миката. Произнесите тальбию: «Ляббайка Аллахумма ляббайк».',
      ar: 'انوِ الحج. اغتسل وتطيّب. يرتدي الرجال إزاراً ورداءً أبيضين غير مخيطين. ترتدي النساء ملابس محتشمة ونظيفة. أحرم من الميقات. ردد التلبية: "لبيك اللهم لبيك".',
      tr: 'Hac için niyet edin. Gusül alın, koku sürün. Erkekler iki beyaz dikişsiz kumaş giyer (izar ve rida). Kadınlar sade, temiz kıyafet giyer. Mikat noktasından ihrama girin. Telbiye getirin: "Lebbeyk Allahümme lebbeyk."',
    },
    recitation: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ',
    notes: {
      az: 'İhramda ikən ov etmək, saç kəsmək, ətir vurmaq, evlənmək qadağandır.',
      en: 'While in ihram: no hunting, cutting hair/nails, wearing fragrance, or marriage.',
      ru: 'В ихраме запрещено: охота, стрижка волос/ногтей, использование духов, бракосочетание.',
      ar: 'محظورات الإحرام: الصيد، قص الشعر والأظافر، التطيب، النكاح.',
      tr: 'İhramda yasak: av, saç/tırnak kesme, koku sürme, evlenme.',
    },
  },
  {
    id: 'tawaf',
    icon: 'refresh',
    arabic: 'طَوَاف',
    name: { az:'Təvaf', en:'Tawaf', ru:'Таваф', ar:'الطواف', tr:'Tavaf' },
    description: {
      az: 'Kəbəni 7 dəfə saat əqrəbinin əksinə dolanın. Həcərül-Əsvəd (Qara Daş) bucağından başlayın. Hər dövrədə Həcərül-Əsvədə işarə edin və "Bismillahi Allahu Akbar" deyin. Təvafdan sonra Məqami-İbrahimin arxasında 2 rəkət namaz qılın.',
      en: 'Circle the Kaaba 7 times counter-clockwise. Start from the Black Stone (Hajar al-Aswad) corner. At each round, point toward the Black Stone and say "Bismillahi Allahu Akbar." After tawaf, pray 2 rakat behind Maqam Ibrahim.',
      ru: 'Обойдите Каабу 7 раз против часовой стрелки. Начните от угла Чёрного камня (Хаджар аль-Асвад). На каждом круге укажите на Чёрный камень и скажите «Бисмилляхи Аллаху Акбар». После тавафа совершите 2 ракята за Макамом Ибрахима.',
      ar: 'طف حول الكعبة ٧ أشواط عكس عقارب الساعة. ابدأ من ركن الحجر الأسود. في كل شوط أشر إلى الحجر الأسود وقل "بسم الله الله أكبر". بعد الطواف صلِّ ركعتين خلف مقام إبراهيم.',
      tr: 'Kabe\'yi saat yönünün tersine 7 kez tavaf edin. Hacerül-Esved köşesinden başlayın. Her turda Hacerül-Esved\'e işaret edip "Bismillahi Allahu Ekber" deyin. Tavaftan sonra Makam-ı İbrahim\'in arkasında 2 rekat namaz kılın.',
    },
    recitation: 'بِسْمِ اللَّهِ اللَّهُ أَكْبَرُ',
    notes: {
      az: 'Kişilər yalnız gəliş (qudum) təvafının və ya ümrə təvafının ilk 3 dövrəsində sürətli addımlarla (rəml) yeriyir (Buxari 1603); digər təvaflarda rəml yoxdur. Dəstəmaz şərtdir.',
      en: 'Men walk briskly (raml) only in the first 3 rounds of the arrival tawaf (qudum) or the umrah tawaf (Bukhari 1603); there is no raml in other tawafs. Wudu is required.',
      ru: 'Мужчины быстро ходят (рамль) только в первых 3 кругах тавафа прибытия (кудум) или тавафа умры (аль-Бухари 1603); в других тавафах рамля нет. Вуду обязателен.',
      ar: 'يُستحب للرجال الرمل (المشي السريع) في الأشواط الثلاثة الأولى من طواف القدوم أو طواف العمرة فقط (البخاري 1603)، ولا رمل في غيرهما. الوضوء شرط.',
      tr: 'Erkekler yalnızca kudüm tavafının veya umre tavafının ilk 3 turunda remel (hızlı yürüyüş) yapar (Buhârî 1603); diğer tavaflarda remel yoktur. Abdest şarttır.',
    },
  },
  {
    id: 'sai',
    icon: 'arrow',
    arabic: 'سَعْي',
    name: { az:'Səy', en:"Sa'i", ru:'Саи', ar:'السعي', tr:'Say' },
    description: {
      az: 'Səfa və Mərvə təpələri arasında 7 dəfə yeriyin. Səfadan başlayın, Mərvədə bitirin. Hər təpəyə çatanda Kəbəyə tərəf dönüb dua edin. Yaşıl işıqlar arasında (kişilər) qaçın.',
      en: "Walk between the hills of Safa and Marwa 7 times. Start at Safa, end at Marwa. At each hill, face the Kaaba and make dua. Men should jog between the green lights.",
      ru: 'Пройдите между холмами Сафа и Марва 7 раз. Начните с Сафы, закончите на Марве. На каждом холме повернитесь к Каабе и сделайте дуа. Мужчины должны бежать между зелёными отметками.',
      ar: 'اسعَ بين الصفا والمروة ٧ أشواط. ابدأ من الصفا وانتهِ عند المروة. عند كل تل استقبل القبلة وادعُ. يُستحب للرجال الهرولة بين العلمين الأخضرين.',
      tr: "Safa ile Merve tepeleri arasında 7 kez yürüyün. Safa'dan başlayın, Merve'de bitirin. Her tepede Kabe'ye dönüp dua edin. Yeşil ışıklar arasında (erkekler) koşun.",
    },
    recitation: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
    notes: {
      az: 'Səfadan Mərvəyə 1 şövt, Mərvədən Səfaya 2-ci şövt sayılır.',
      en: 'Safa to Marwa is 1 lap, Marwa to Safa is the 2nd lap.',
      ru: 'От Сафы до Марвы — 1 круг, от Марвы до Сафы — 2-й круг.',
      ar: 'من الصفا إلى المروة شوط، ومن المروة إلى الصفا شوط ثانٍ.',
      tr: "Safa'dan Merve'ye 1 şavt, Merve'den Safa'ya 2. şavt sayılır.",
    },
  },
  {
    id: 'mina',
    icon: 'jamaat',
    arabic: 'مِنَى',
    name: { az:'Mina', en:'Mina', ru:'Мина', ar:'منى', tr:'Mina' },
    description: {
      az: '8 Zülhiccə (Tərviyə günü) — Minaya gedin. Gecəni orada keçirin. Zöhr, Əsr, Məğrib, İşa və Sübh namazlarını qılın (qəsr ilə). Çoxlu zikr, dua və Quran oxuyun.',
      en: '8th Dhul Hijjah (Day of Tarwiyah) — Go to Mina. Spend the night there. Pray Dhuhr, Asr, Maghrib, Isha and Fajr (shortened). Make abundant dhikr, dua and Quran recitation.',
      ru: '8-е Зуль-Хиджа (день Тарвия) — отправляйтесь в Мину. Проведите ночь там. Совершайте намазы Зухр, Аср, Магриб, Иша и Фаджр (сокращённые). Делайте много зикра, дуа и читайте Коран.',
      ar: '٨ ذي الحجة (يوم التروية) — اذهب إلى منى. بِت فيها ليلاً. صلِّ الظهر والعصر والمغرب والعشاء والفجر (قصراً). أكثر من الذكر والدعاء وتلاوة القرآن.',
      tr: '8 Zilhicce (Terviye günü) — Mina\'ya gidin. Geceyi orada geçirin. Öğle, İkindi, Akşam, Yatsı ve Sabah namazlarını kılın (kısaltılmış). Bol zikir, dua ve Kur\'an okuyun.',
    },
    recitation: '',
    notes: {
      az: 'Bu gün hazırlıq günüdür. Sakit qalın, ibadət edin.',
      en: 'This is a preparatory day. Stay calm and worship.',
      ru: 'Это подготовительный день. Сохраняйте спокойствие и поклоняйтесь.',
      ar: 'هذا يوم تحضيري. التزم الهدوء والعبادة.',
      tr: 'Bu hazırlık günüdür. Sakin olun ve ibadet edin.',
    },
  },
  {
    id: 'arafat',
    icon: 'sun',
    arabic: 'عَرَفَة',
    name: { az:'Ərəfat', en:'Arafat', ru:'Арафат', ar:'عرفة', tr:'Arafat' },
    description: {
      az: '9 Zülhiccə — Həccin ən mühüm rüknü. Ərəfata gedin — Ərəfatın hamısı dayanma yeridir (Müslim 1218). Günəş batana qədər dua edin. Zöhr və Əsr namazlarını birləşdirib qılın (cəm). Bu gün günahlardan bağışlanma günüdür.',
      en: '9th Dhul Hijjah — The most important pillar of Hajj. Go to Arafat — all of Arafat is a place of standing (Muslim 1218). Make dua until sunset. Pray Dhuhr and Asr combined. This is the day of forgiveness from sins.',
      ru: '9-е Зуль-Хиджа — самый важный столп хаджа. Отправляйтесь в Арафат — весь Арафат является местом стояния (Муслим 1218). Делайте дуа до заката. Совершайте намазы Зухр и Аср вместе. Это день прощения грехов.',
      ar: '٩ ذي الحجة — أهم ركن من أركان الحج. اذهب إلى عرفة — وعرفة كلها موقف (مسلم 1218). ادعُ حتى غروب الشمس. صلِّ الظهر والعصر جمعاً. هذا يوم المغفرة.',
      tr: '9 Zilhicce — Haccın en önemli rüknü. Arafat\'a gidin — Arafat\'ın tamamı vakfe yeridir (Müslim 1218). Güneş batana kadar dua edin. Öğle ve İkindi namazlarını cem ederek kılın. Bu günahlardan bağışlanma günüdür.',
    },
    recitation: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    notes: {
      az: 'Ərəfatda dayanmaq (vüquf) həccin fərzidir. Onu qaçıran həcci qaçırmışdır. Peyğəmbər ﷺ dağın ətəyindəki qayaların yanında dayandı (Müslim 1218) — Cəbəl ər-Rəhmə dağına çıxmaq sünnə deyil.',
      en: 'Standing at Arafat (wuquf) is the fard of Hajj. Missing it means missing Hajj. The Prophet ﷺ stood by the rocks at the foot of the mountain (Muslim 1218) — climbing Jabal ar-Rahmah is not a Sunnah.',
      ru: 'Стояние на Арафате (вукуф) — фард хаджа. Пропустивший его пропустил хадж. Пророк ﷺ стоял у скал у подножия горы (Муслим 1218) — подниматься на гору Джабаль ар-Рахма не является Сунной.',
      ar: 'الوقوف بعرفة فرض الحج. من فاته فقد فاته الحج. وقف النبي ﷺ عند الصخرات أسفل الجبل (مسلم 1218)، وصعود جبل الرحمة ليس من السنة.',
      tr: 'Arafat\'ta vakfe haccın farzıdır. Kaçıran haccı kaçırmıştır. Peygamber ﷺ dağın eteğindeki kayaların yanında vakfe yaptı (Müslim 1218) — Cebel-i Rahme\'ye çıkmak sünnet değildir.',
    },
  },
  {
    id: 'muzdalifah',
    icon: 'moon',
    arabic: 'مُزْدَلِفَة',
    name: { az:'Müzdəlifə', en:'Muzdalifah', ru:'Муздалифа', ar:'مزدلفة', tr:'Müzdelife' },
    description: {
      az: 'Günəş batdıqdan sonra Ərəfatdan Müzdəlifəyə gedin. Məğrib və İşa namazlarını birləşdirib qılın. Gecəni açıq havada keçirin. Sübh namazından sonra duaya davam edin.',
      en: 'After sunset, leave Arafat for Muzdalifah. Pray Maghrib and Isha combined. Spend the night under the open sky. Continue dua after Fajr prayer.',
      ru: 'После заката покиньте Арафат и направляйтесь в Муздалифу. Совершите намазы Магриб и Иша вместе. Проведите ночь под открытым небом. Продолжайте дуа после Фаджра.',
      ar: 'بعد الغروب انطلق من عرفة إلى مزدلفة. صلِّ المغرب والعشاء جمعاً. بِت تحت السماء. تابع الدعاء بعد صلاة الفجر.',
      tr: 'Güneş battıktan sonra Arafat\'tan Müzdelife\'ye gidin. Akşam ve Yatsı namazlarını cem ederek kılın. Geceyi açık havada geçirin. Sabah namazından sonra duaya devam edin.',
    },
    recitation: '',
    notes: {
      az: 'Zəif insanlar (qadınlar, yaşlılar, xəstələr) gecə yarısından sonra Minaya qayıda bilər.',
      en: 'Weak individuals (women, elderly, sick) may leave for Mina after midnight.',
      ru: 'Слабые (женщины, пожилые, больные) могут уйти в Мину после полуночи.',
      ar: 'يجوز للضعفاء (النساء، كبار السن، المرضى) الانصراف إلى منى بعد منتصف الليل.',
      tr: 'Zayıf kişiler (kadınlar, yaşlılar, hastalar) gece yarısından sonra Mina\'ya dönebilir.',
    },
  },
  {
    id: 'ramy',
    icon: 'target',
    arabic: 'رَمْي جَمْرَةِ الْعَقَبَة',
    name: { az:'Rəmy (Əqəbə cəmrəsi)', en:'Ramy (Jamrat al-Aqabah)', ru:'Рами (Джамрат аль-Акаба)', ar:'رمي جمرة العقبة', tr:'Remy (Akabe cemresi)' },
    description: {
      az: '10 Zülhiccə (Qurban bayramı) — səhər Müzdəlifədən Minaya gəlib yalnız Böyük cəmrəyə (Cəmrətül-Əqəbə) 7 daş atın. Hər daşla "Allahu Akbar" deyin. Digər iki cəmrəyə təşriq günlərində daş atılır.',
      en: '10th Dhul Hijjah (Eid al-Adha) — In the morning come from Muzdalifah to Mina and throw 7 pebbles at the large pillar (Jamrat al-Aqaba) only. Say "Allahu Akbar" with each throw. The other two pillars are stoned on the days of Tashreeq.',
      ru: '10-е Зуль-Хиджа (Ид аль-Адха) — утром придите из Муздалифы в Мину и бросьте 7 камешков только в большой столб (Джамрат аль-Акаба). Говорите «Аллаху Акбар» при каждом броске. В два других столба бросают в дни ташрика.',
      ar: '١٠ ذي الحجة (عيد الأضحى) — تأتي صباحًا من مزدلفة إلى منى فترمي جمرة العقبة وحدها بسبع حصيات، وتكبّر مع كل حصاة. وتُرمى الجمرتان الأخريان في أيام التشريق.',
      tr: '10 Zilhicce (Kurban Bayramı) — Sabah Müzdelife\'den Mina\'ya gelip yalnızca büyük cemreye (Cemretül-Akabe) 7 taş atın. Her taşta "Allahu Ekber" deyin. Diğer iki cemreye teşrik günlerinde taş atılır.',
    },
    recitation: 'اللَّهُ أَكْبَرُ',
    notes: {
      az: 'Daşlar noxud boyda olmalıdır. Bu gün daş günəş çıxandan sonra, zəvaldan əvvəl də atıla bilər.',
      en: 'Pebbles should be chickpea-sized. On this day the stoning may be done after sunrise, before midday.',
      ru: 'Камешки размером с горошину. В этот день бросать можно после восхода, ещё до полудня.',
      ar: 'الحصى بحجم الحمصة، ويُرمى في هذا اليوم بعد طلوع الشمس ولو قبل الزوال.',
      tr: 'Taşlar nohut büyüklüğünde olmalıdır. Bu gün taş, güneş doğduktan sonra zevalden önce de atılabilir.',
    },
  },
  {
    id: 'qurbanliq',
    icon: 'gift',
    arabic: 'هَدْي',
    name: { az:'Qurbanlıq', en:'Sacrifice (Hady)', ru:'Жертвоприношение (Хадй)', ar:'الهدي', tr:'Kurban (Hedy)' },
    description: {
      az: 'Rəmydən sonra qurbanlıq kəsin (qoyun, keçi, dəvə və ya mal). Ətini yoxsullara paylayın. Bu, Təməttü və Qiran həcci edənlər üçün vacibdir. İfrad həcci edənlərə vacib deyil.',
      en: 'After Ramy, offer a sacrifice (sheep, goat, camel or cow). Distribute the meat to the poor. This is obligatory for those performing Tamattu and Qiran Hajj. Not obligatory for Ifrad Hajj.',
      ru: 'После Рами совершите жертвоприношение (овца, коза, верблюд или корова). Раздайте мясо бедным. Это обязательно для совершающих хадж Таматту и Киран. Не обязательно для хаджа Ифрад.',
      ar: 'بعد الرمي انحر الهدي (شاة أو بقرة أو بعير). وزّع اللحم على الفقراء. الهدي واجب على المتمتع والقارن. ليس واجباً على المفرد.',
      tr: 'Remyden sonra kurban kesin (koyun, keçi, deve veya sığır). Etini fakirlere dağıtın. Temettu ve Kıran haccı yapanlar için vaciptir. İfrad haccı yapanlara vacip değildir.',
    },
    recitation: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    notes: {
      az: 'Qurbanlıq günləri: 10, 11, 12 və ya 13 Zülhiccədir.',
      en: 'Days of sacrifice: 10th, 11th, 12th or 13th of Dhul Hijjah.',
      ru: 'Дни жертвоприношения: 10, 11, 12 или 13 Зуль-Хиджа.',
      ar: 'أيام النحر: ١٠ و١١ و١٢ و١٣ من ذي الحجة.',
      tr: 'Kurban günleri: 10, 11, 12 veya 13 Zilhicce.',
    },
  },
  {
    id: 'halq',
    icon: 'sparkle',
    arabic: 'حَلْق / تَقْصِير',
    name: { az:'Halq / təqsir', en:'Halq / Taqsir', ru:'Халк / Таксир', ar:'الحلق / التقصير', tr:'Halk / Taksir' },
    description: {
      az: 'Kişilər saçlarını tamamilə qırxdırır (halq) və ya qısaldır (təqsir). Halq daha fəzilətlidir. Qadınlar saçlarından barmaq ucu boyda kəsir. Bu əməldən sonra ihram qadağaları qalxır (cinsi münasibət xaric).',
      en: 'Men shave their head completely (halq) or trim (taqsir). Shaving is more virtuous. Women cut a fingertip-length from their hair. After this, ihram restrictions are lifted (except conjugal relations).',
      ru: 'Мужчины полностью бреют голову (халк) или подстригают (таксир). Бритьё более предпочтительно. Женщины отрезают кончик пряди волос. После этого запреты ихрама снимаются (кроме супружеских отношений).',
      ar: 'يحلق الرجال رؤوسهم (حلق) أو يقصرون (تقصير). الحلق أفضل. تقص النساء قدر أنملة من شعرهن. بعد ذلك تُرفع محظورات الإحرام (عدا الجماع).',
      tr: 'Erkekler saçlarını tamamen tıraş eder (halk) veya kısaltır (taksir). Tıraş daha faziletlidir. Kadınlar saçlarından parmak ucu kadar keser. Bundan sonra ihram yasakları kalkar (cinsel ilişki hariç).',
    },
    recitation: '',
    notes: {
      az: 'Halq/Təqsirdən sonra "ilk təhəllül" baş verir — adi geyimə keçə bilərsiniz.',
      en: 'After Halq/Taqsir, the "first tahallul" occurs — you may wear regular clothes.',
      ru: 'После Халк/Таксир наступает «первый тахаллюль» — можно надеть обычную одежду.',
      ar: 'بعد الحلق/التقصير يحصل "التحلل الأول" — يجوز لبس الثياب العادية.',
      tr: 'Halk/Taksir sonrası "ilk tahallül" gerçekleşir — normal kıyafet giyebilirsiniz.',
    },
  },
  {
    id: 'ifadah',
    icon: 'refresh',
    arabic: 'طَوَافُ الْإِفَاضَة',
    name: { az:'İfadə təvafı və səy', en:"Tawaf al-Ifadah and Sa'i", ru:'Таваф аль-Ифада и саи', ar:'طواف الإفاضة والسعي', tr:'İfâda tavafı ve say' },
    description: {
      az: 'Qurban günü (və ya ondan sonra) Məkkəyə qayıdıb Kəbəni 7 dəfə təvaf edin — bu, həccin rüknüdür, onsuz həcc tamam olmur. Təməttü edən sonra həcc üçün Səfa ilə Mərvə arasında səy edir; qiran və ifrad edən gəliş təvafından sonra səy etməyibsə, indi edir. Bundan sonra ihramın bütün qadağaları qalxır (ikinci təhəllül).',
      en: "On the Day of Sacrifice (or later) return to Mecca and circle the Kaaba 7 times — this is a pillar of Hajj; without it the Hajj is not complete. One doing tamattu' then performs the sa'i of Hajj between Safa and Marwah; one doing qiran or ifrad performs it now if he did not do so after the arrival tawaf. After this all ihram restrictions are lifted (the second tahallul).",
      ru: 'В день жертвоприношения (или позже) вернитесь в Мекку и обойдите Каабу 7 раз — это столп хаджа, без него хадж не завершён. Совершающий таматту затем совершает саи хаджа между Сафой и Марвой; совершающий киран или ифрад делает его сейчас, если не сделал после тавафа прибытия. После этого снимаются все запреты ихрама (второй тахаллюль).',
      ar: 'يوم النحر (أو بعده) يرجع الحاج إلى مكة فيطوف بالبيت سبعًا، وهو ركن لا يتم الحج إلا به. ثم يسعى المتمتع بين الصفا والمروة لحجه، ويسعى القارن والمفرد إن لم يكونا سعيا بعد طواف القدوم. وبه يحل له كل شيء (التحلل الثاني).',
      tr: 'Kurban günü (veya sonrasında) Mekke\'ye dönüp Kâbe\'yi 7 kez tavaf edin — bu haccın rüknüdür, onsuz hac tamamlanmaz. Temettu yapan ardından hac için Safa ile Merve arasında say yapar; kıran ve ifrad yapan, kudüm tavafından sonra say yapmadıysa şimdi yapar. Bundan sonra ihramın bütün yasakları kalkar (ikinci tahallül).',
    },
    recitation: '',
    notes: {
      az: 'Peyğəmbər ﷺ qurban günü Məkkəyə gedib təvaf etdi və zöhrü orada qıldı (Müslim 1218).',
      en: 'On the Day of Sacrifice the Prophet ﷺ went to Mecca, performed tawaf and prayed Dhuhr there (Muslim 1218).',
      ru: 'В день жертвоприношения Пророк ﷺ отправился в Мекку, совершил таваф и помолился там зухр (Муслим 1218).',
      ar: 'أفاض النبي ﷺ يوم النحر إلى البيت فصلى بمكة الظهر (مسلم ١٢١٨).',
      tr: 'Peygamber ﷺ kurban günü Mekke\'ye gidip tavaf etti ve öğleyi orada kıldı (Müslim 1218).',
    },
  },
  {
    id: 'tashriq',
    icon: 'calendar',
    arabic: 'أَيَّامُ التَّشْرِيق',
    name: { az:'Təşriq günləri (Mina)', en:'Days of Tashreeq (Mina)', ru:'Дни ташрика (Мина)', ar:'أيام التشريق (منى)', tr:'Teşrik günleri (Mina)' },
    description: {
      az: '11, 12 (istəsəniz 13) Zülhiccə gecələrini Minada keçirin. Hər gün zəvaldan (zöhr vaxtı girəndən) sonra üç cəmrəyə 7-şər daş atın: əvvəl kiçik, sonra orta, sonra Əqəbə cəmrəsi; ilk ikisindən sonra qibləyə dönüb uzun dua edin (Buxari 1751). Tələsən 12-də günəş batmadan Minadan çıxa bilər (Bəqərə 2:203).',
      en: 'Spend the nights of the 11th, 12th (and, if you wish, the 13th) in Mina. Each day after midday (when Dhuhr time begins) throw 7 pebbles at each of the three pillars: first the small, then the middle, then Jamrat al-Aqabah; after the first two, face the qiblah and supplicate at length (Bukhari 1751). One who hastens may leave Mina on the 12th before sunset (al-Baqarah 2:203).',
      ru: 'Проведите ночи 11-го, 12-го (по желанию и 13-го) в Мине. Каждый день после полудня (с наступлением зухра) бросайте по 7 камешков в каждый из трёх столбов: сначала малый, затем средний, затем Джамрат аль-Акаба; после первых двух повернитесь к кибле и долго молитесь (аль-Бухари 1751). Спешащий может покинуть Мину 12-го до заката (аль-Бакара 2:203).',
      ar: 'بِت ليالي الحادي عشر والثاني عشر (والثالث عشر إن شئت) بمنى، وارمِ كل يوم بعد الزوال الجمرات الثلاث بسبع سبع: الصغرى ثم الوسطى ثم جمرة العقبة، وقف بعد الأوليين مستقبل القبلة تدعو طويلًا (البخاري ١٧٥١). ومن تعجّل خرج يوم الثاني عشر قبل الغروب (البقرة: ٢٠٣).',
      tr: '11, 12 (dilerseniz 13) Zilhicce gecelerini Mina\'da geçirin. Her gün zevalden (öğle vakti girdikten) sonra üç cemreye yedişer taş atın: önce küçük, sonra orta, sonra Akabe cemresi; ilk ikisinden sonra kıbleye dönüp uzun dua edin (Buhârî 1751). Acele eden 12\'sinde güneş batmadan Mina\'dan çıkabilir (Bakara 2:203).',
    },
    recitation: 'اللَّهُ أَكْبَرُ',
    notes: {
      az: 'Təşriq günləri yemək-içmək və Allahı zikr etmək günləridir — bu günlərdə oruc tutulmur (Müslim 1141).',
      en: 'The days of Tashreeq are days of eating, drinking and remembering Allah — one does not fast on them (Muslim 1141).',
      ru: 'Дни ташрика — дни еды, питья и поминания Аллаха; в эти дни не постятся (Муслим 1141).',
      ar: 'أيام التشريق أيام أكل وشرب وذكر لله، فلا تُصام (مسلم ١١٤١).',
      tr: 'Teşrik günleri yeme, içme ve Allah\'ı zikir günleridir — bu günlerde oruç tutulmaz (Müslim 1141).',
    },
  },
  {
    id: 'wada',
    icon: 'hajjguide',
    arabic: 'طَوَاف الْوَدَاع',
    name: { az:'Vida təvafı', en:'Farewell Tawaf', ru:'Прощальный таваф', ar:'طواف الوداع', tr:'Veda Tavafı' },
    description: {
      az: 'Məkkədən ayrılmadan əvvəl son təvafı edin — Kəbəni 7 dəfə dolanın. Bu, həccin son vacib əməlidir. Təvafdan sonra 2 rəkət namaz qılın. Ən son əməliniz təvaf olmalıdır.',
      en: 'Before leaving Makkah, perform the farewell tawaf — circle the Kaaba 7 times. This is the last obligatory act of Hajj. Pray 2 rakat after tawaf. Your last act should be the tawaf.',
      ru: 'Перед отъездом из Мекки совершите прощальный таваф — обойдите Каабу 7 раз. Это последний обязательный акт хаджа. Совершите 2 ракята после тавафа. Ваше последнее действие — таваф.',
      ar: 'قبل مغادرة مكة طف طواف الوداع — ٧ أشواط حول الكعبة. هذا آخر واجب في الحج. صلِّ ركعتين بعد الطواف. ليكن آخر عهدك بالبيت الطواف.',
      tr: "Mekke'den ayrılmadan önce veda tavafını yapın — Kabe'yi 7 kez dolanın. Bu haccın son vacip amelidir. Tavaftan sonra 2 rekat namaz kılın. Son işiniz tavaf olmalıdır.",
    },
    recitation: '',
    notes: {
      az: 'Heyz halında olan qadınlar vida təvafından müafdır.',
      en: 'Menstruating women are exempt from the farewell tawaf.',
      ru: 'Женщины в период менструации освобождены от прощального тавафа.',
      ar: 'تُعفى الحائض من طواف الوداع.',
      tr: 'Hayızlı kadınlar veda tavafından muaftır.',
    },
  },
]

const HAJJ_STEPS_IDS = HAJJ_STEPS.map(s => s.id)

const UMRAH_STEPS = [
  {
    id: 'u_ihram',
    icon: 'user',
    arabic: 'إِحْرَام',
    name: { az:'İhram', en:'Ihram', ru:'Ихрам', ar:'الإحرام', tr:'İhram' },
    description: {
      az: 'Ümrə üçün niyyət edin. Qüsl alın, ihram geyimini geyinin. Miqat məntəqəsindən ihrama girərək təlbiyəni söyləyin: "Ləbbeyk Allahummə ləbbeyk." İhram qadağalarına riayət edin.',
      en: 'Make your intention for Umrah. Perform ghusl, wear ihram garments. Enter ihram at the miqat saying the Talbiyah: "Labbayk Allahumma labbayk." Observe ihram restrictions.',
      ru: 'Сделайте намерение для Умры. Совершите гусль, наденьте одежду ихрама. Войдите в ихрам в микате, произнося тальбию: «Ляббайка Аллахумма ляббайк». Соблюдайте запреты ихрама.',
      ar: 'انوِ العمرة. اغتسل والبس ثياب الإحرام. أحرم من الميقات مردداً التلبية: "لبيك اللهم لبيك". التزم بمحظورات الإحرام.',
      tr: 'Umre için niyet edin. Gusül alın, ihram giysilerini giyin. Mikat noktasından ihrama girerek telbiye getirin: "Lebbeyk Allahümme lebbeyk." İhram yasaklarına uyun.',
    },
    recitation: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ',
    notes: {
      az: 'Təyyarə ilə gedənlər miqatın üzərindən keçərkən ihrama girməlidir.',
      en: 'Those traveling by air should enter ihram when passing over the miqat.',
      ru: 'Летящие самолётом должны войти в ихрам, пролетая над микатом.',
      ar: 'المسافر جواً يحرم عند محاذاة الميقات.',
      tr: 'Uçakla gidenler mikatın üzerinden geçerken ihrama girmelidir.',
    },
  },
  {
    id: 'u_tawaf',
    icon: 'refresh',
    arabic: 'طَوَاف',
    name: { az:'Təvaf', en:'Tawaf', ru:'Таваф', ar:'الطواف', tr:'Tavaf' },
    description: {
      // lang-ok[için]: "için" — az dilində "içmək" felinin əmr forması (Zəmzəm suyu için)
      az: 'Kəbəni saat əqrəbinin əksinə 7 dəfə dolanın. Həcərül-Əsvəddən başlayın. Hər dövrədə Həcərül-Əsvədə işarə edib "Bismillahi Allahu Akbar" deyin. Təvafdan sonra Məqami-İbrahimin arxasında 2 rəkət namaz qılın. Zəmzəm suyu için.',
      en: 'Circle the Kaaba 7 times counter-clockwise. Start from the Black Stone. Point toward the Black Stone each round saying "Bismillahi Allahu Akbar." After tawaf, pray 2 rakat behind Maqam Ibrahim. Drink Zamzam water.',
      ru: 'Обойдите Каабу 7 раз против часовой стрелки. Начните от Чёрного камня. На каждом круге укажите на Чёрный камень, говоря «Бисмилляхи Аллаху Акбар». После тавафа совершите 2 ракята за Макамом Ибрахима. Выпейте воду Замзам.',
      ar: 'طف حول الكعبة ٧ أشواط عكس عقارب الساعة. ابدأ من الحجر الأسود. أشر إليه كل شوط وقل "بسم الله الله أكبر". صلِّ ركعتين خلف مقام إبراهيم. اشرب من ماء زمزم.',
      tr: 'Kabe\'yi saat yönünün tersine 7 kez dolanın. Hacerül-Esved\'den başlayın. Her turda Hacerül-Esved\'e işaret edip "Bismillahi Allahu Ekber" deyin. Tavaftan sonra Makam-ı İbrahim\'in arkasında 2 rekat namaz kılın. Zemzem suyu için.',
    },
    recitation: 'بِسْمِ اللَّهِ اللَّهُ أَكْبَرُ',
    notes: {
      az: 'Dəstəmazsız təvaf etmək olmaz.',
      en: 'Tawaf cannot be performed without wudu.',
      ru: 'Таваф нельзя совершать без вуду.',
      ar: 'لا يصح الطواف بلا وضوء.',
      tr: 'Abdestsiz tavaf yapılmaz.',
    },
  },
  {
    id: 'u_sai',
    icon: 'arrow',
    arabic: 'سَعْي',
    name: { az:'Səy', en:"Sa'i", ru:'Саи', ar:'السعي', tr:'Say' },
    description: {
      az: 'Səfa və Mərvə arasında 7 dəfə yeriyin. Səfadan başlayın, Mərvədə bitirin. Hər təpədə Kəbəyə tərəf dönüb dua edin. Kişilər yaşıl sütunlar arasında sürətlə yeriməlidir.',
      en: "Walk between Safa and Marwa 7 times. Start at Safa, end at Marwa. At each hill, face the Kaaba and make dua. Men should walk briskly between the green pillars.",
      ru: 'Пройдите между Сафой и Марвой 7 раз. Начните с Сафы, закончите на Марве. На каждом холме повернитесь к Каабе и сделайте дуа. Мужчины должны быстро идти между зелёными столбами.',
      ar: 'اسعَ بين الصفا والمروة ٧ أشواط. ابدأ من الصفا وانتهِ عند المروة. عند كل تل استقبل القبلة وادعُ. يُستحب للرجال الهرولة بين العلمين.',
      tr: "Safa ile Merve arasında 7 kez yürüyün. Safa'dan başlayın, Merve'de bitirin. Her tepede Kabe'ye dönüp dua edin. Erkekler yeşil sütunlar arasında hızlı yürüsün.",
    },
    recitation: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
    notes: {
      az: 'Səy zamanı istənilən dua edə bilərsiniz.',
      en: 'You may make any dua during Sai.',
      ru: 'Во время саи можно делать любое дуа.',
      ar: 'يجوز الدعاء بما شئت أثناء السعي.',
      tr: 'Say esnasında istediğiniz duayı edebilirsiniz.',
    },
  },
  {
    id: 'u_halq',
    icon: 'sparkle',
    arabic: 'حَلْق / تَقْصِير',
    name: { az:'Halq / təqsir', en:'Halq / Taqsir', ru:'Халк / Таксир', ar:'الحلق / التقصير', tr:'Halk / Taksir' },
    description: {
      az: 'Səydən sonra saçınızı qırxdırın (halq) və ya qısaldın (təqsir). Kişilər üçün halq daha fəzilətlidir. Qadınlar saçlarından barmaq ucu boyda kəsir. Bu əməldən sonra ihramdan çıxırsınız — ümrə tamamdır!',
      en: 'After Sai, shave your head (halq) or trim your hair (taqsir). Shaving is more virtuous for men. Women cut a fingertip-length from their hair. After this, you exit ihram — Umrah is complete!',
      ru: 'После саи обрейте голову (халк) или подстригите волосы (таксир). Бритьё более предпочтительно для мужчин. Женщины отрезают кончик пряди. После этого вы выходите из ихрама — Умра завершена!',
      ar: 'بعد السعي احلق رأسك (حلق) أو قصّر شعرك (تقصير). الحلق أفضل للرجال. تقص النساء قدر أنملة. بعد ذلك تتحلل من الإحرام — اكتملت العمرة!',
      tr: 'Saydan sonra saçınızı tıraş edin (halk) veya kısaltın (taksir). Erkekler için tıraş daha faziletlidir. Kadınlar saçlarından parmak ucu kadar keser. Bundan sonra ihramdan çıkarsınız — umre tamam!',
    },
    recitation: '',
    notes: {
      az: 'Halq/Təqsirdən sonra bütün ihram qadağaları qalxır.',
      en: 'After Halq/Taqsir, all ihram restrictions are lifted.',
      ru: 'После Халк/Таксир все запреты ихрама снимаются.',
      ar: 'بعد الحلق/التقصير تُرفع جميع محظورات الإحرام.',
      tr: 'Halk/Taksir sonrası tüm ihram yasakları kalkar.',
    },
  },
]

// Rüknlər yoxlama siyahısı — yalnız bu cihazda (id-lər HAJJ_RITES-dəndir)
// ── v3.2: "qaldığın yerdən davam et" (son rejim + addım, localStorage) və klaviatura ←/→ ──
const LAST_KEY = 'hajjguide:last'
const H32 = {
  az: { resume: 'Qaldığınız yerdən davam edin', resumeBtn: 'Davam et', stepOf: (i, n) => `Addım ${i} / ${n}`, keys: 'Klaviatura: ← → addımlar arasında' },
  en: { resume: 'Continue where you left off', resumeBtn: 'Continue', stepOf: (i, n) => `Step ${i} of ${n}`, keys: 'Keyboard: ← → to move between steps' },
  ru: { resume: 'Продолжите с того же места', resumeBtn: 'Продолжить', stepOf: (i, n) => `Шаг ${i} из ${n}`, keys: 'Клавиатура: ← → между шагами' },
  ar: { resume: 'تابع من حيث توقفت', resumeBtn: 'تابع', stepOf: (i, n) => `الخطوة ${i} من ${n}`, keys: 'لوحة المفاتيح: ← → للتنقل بين الخطوات' },
  tr: { resume: 'Kaldığınız yerden devam edin', resumeBtn: 'Devam et', stepOf: (i, n) => `Adım ${i} / ${n}`, keys: 'Klavye: ← → adımlar arasında' },
}
function readLast() {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY))
    if (v && (v.mode === 'hajj' || v.mode === 'umrah') && Number.isInteger(v.step) && v.step >= 0) return v
  } catch { /* yaddaş bağlıdır */ }
  return null
}

const CHECK_KEY = 'muslim_cc_hajj_checklist'
function loadChecks() {
  try {
    const v = JSON.parse(localStorage.getItem(CHECK_KEY) || '[]')
    return Array.isArray(v) ? v.filter(id => HAJJ_RITES.some(r => r.id === id)) : []
  } catch { return [] }
}

/** Rüknlər və vaciblər: işarələnən siyahı + irəliləyiş zolağı */
function RitesChecklist({ lang }) {
  const [done, setDone] = useState([])
  // localStorage yalnız brauzerdə (prerender HTML-i ilə uyğunsuzluq olmasın)
  useEffect(() => { setDone(loadChecks()) }, [])
  const save = (next) => {
    setDone(next)
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
  }
  const toggle = (id) => save(done.includes(id) ? done.filter(x => x !== id) : [...done, id])
  const groups = [
    { kind: 'rukn', label: P(HX.rukn, lang) },
    { kind: 'wajib', label: P(HX.wajib, lang) },
  ]
  return (
    <div className="hg-rites">
      <div className="hg-rites__meter">
        <span className="hg-rites__count ui-num">{done.length} / {HAJJ_RITES.length} <span>{P(HX.done, lang)}</span></span>
        <ProgressBar value={done.length} max={HAJJ_RITES.length} label={`${P(HX.ritesTitle, lang)}: ${done.length} / ${HAJJ_RITES.length}`} />
        {done.length > 0 && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => save([])}>
            <Icon name="refresh" size={15} className="ui-btn__icon" /> {P(HX.reset, lang)}
          </button>
        )}
      </div>
      <div className="hg-rites__groups">
        {groups.map(g => (
          <fieldset key={g.kind} className={`hg-rites__group hg-rites__group--${g.kind}`}>
            <legend className="hg-rites__legend">
              {g.label} <span className="ui-num">{HAJJ_RITES.filter(r => r.kind === g.kind).length}</span>
            </legend>
            <ul className="hg-rites__list">
              {HAJJ_RITES.filter(r => r.kind === g.kind).map(r => {
                const on = done.includes(r.id)
                return (
                  <li key={r.id}>
                    <label className={`hg-rite${on ? ' is-done' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(r.id)} />
                      <span className="hg-rite__box" aria-hidden="true"><Icon name="check" size={14} strokeWidth={2.6} /></span>
                      <span className="hg-rite__name">{P(r.name, lang)}</span>
                      <span className="hg-rite__when">{P(r.when, lang)}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        ))}
      </div>
      <p className="hg-src">{P(HX.ritesSource, lang)}</p>
    </div>
  )
}

/** Bölmə başlığı (eyebrow · h2 · bir cümlə) */
function Head({ id, eyebrow, title, lead }) {
  return (
    <div className="ui-section-head" data-reveal>
      <span className="ui-eyebrow">{eyebrow}</span>
      <h2 id={id} className="ui-title">{title}</h2>
      {lead && <p className="ui-lead">{lead}</p>}
    </div>
  )
}

export default function HajjGuidePage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(LABELS, lang)
  const navigate = useNavigate()

  const [mode, setMode] = useState(null) // 'hajj' | 'umrah'
  const [currentStep, setCurrentStep] = useState(0)
  // Addım kartının giriş istiqaməti: 'next' | 'prev' | 'none' (ilk açılış — animasiyasız)
  const [dir, setDir] = useState('none')
  // Seçim ekranına geri qayıdanda yumşaq giriş; ilk yükləmədə yox (səhifə keçidi onsuz da var)
  const [visited, setVisited] = useState(false)
  const h32 = pickUi(H32, lang, 'en')
  // Son açılmış addım — yalnız brauzerdə oxunur (prerender HTML-i ilə uyğunsuzluq olmasın)
  const [last, setLast] = useState(null)
  useEffect(() => { setLast(readLast()) }, [])

  const guideRef = useRef(null)
  const topbarRef = useRef(null)
  const stepsRef = useRef(null)
  const cardRef = useRef(null)

  const steps = mode === 'hajj' ? HAJJ_STEPS : mode === 'umrah' ? UMRAH_STEPS : []
  const totalSteps = steps.length
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  const isComplete = mode !== null && totalSteps > 0 && currentStep >= totalSteps
  const step = !isComplete && totalSteps > 0 ? steps[currentStep] : null

  const goTo = (i) => {
    if (i === currentStep) return
    setDir(i > currentStep ? 'next' : 'prev')
    setCurrentStep(i)
  }
  const startMode = (m) => { setMode(m); setCurrentStep(0); setDir('none'); setVisited(true) }
  // Hero düymələri: bələdçini aç və ona sürüş
  const startFromHero = (m) => {
    startMode(m)
    requestAnimationFrame(() => {
      let smooth = true
      try { smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { /* köhnə brauzer */ }
      guideRef.current?.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' })
    })
  }
  const handlePrev = () => { if (currentStep > 0) goTo(currentStep - 1) }
  const handleNext = () => { goTo(currentStep + 1) }
  const resume = () => {
    if (!last) return
    const list = last.mode === 'hajj' ? HAJJ_STEPS : UMRAH_STEPS
    startMode(last.mode)
    setCurrentStep(Math.min(last.step, list.length - 1))
  }

  // Son addımı yadda saxla (tamamlananda — sil)
  useEffect(() => {
    if (mode === null) return
    try {
      if (currentStep >= totalSteps) { localStorage.removeItem(LAST_KEY); setLast(null) }
      else { const v = { mode, step: currentStep }; localStorage.setItem(LAST_KEY, JSON.stringify(v)); setLast(v) }
    } catch { /* yaddaş bağlıdır */ }
  }, [mode, currentStep, totalSteps])

  // Klaviatura: ←/→ — əvvəlki/növbəti addım (ərəbcədə güzgülənir); sahədə yazarkən işləmir
  const navRef = useRef({})
  navRef.current = { handlePrev, handleNext, active: mode !== null && !isComplete }
  useEffect(() => {
    const onKey = (e) => {
      if (!navRef.current.active || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const tg = e.target
      if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return
      if (document.querySelector('[aria-modal="true"]')) return
      const rtl = document.documentElement.dir === 'rtl'
      const forward = (e.key === 'ArrowRight') !== rtl
      e.preventDefault()
      if (forward) navRef.current.handleNext(); else navRef.current.handlePrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const handleRestart = () => { setMode(null); setCurrentStep(0); setDir('none') }
  const handleBack = () => { setMode(null); setCurrentStep(0); setDir('none') }

  // Addım dəyişəndə (telefonda vacibdir: "Növbəti" ekranın altındadır):
  //  • aktiv addım çipini zolağın ortasına gətir — yalnız üfüqi, səhifə tərpənmir;
  //  • yeni kartın başı yapışqan zolağın altında qalıbsa, karta yumşaq sürüş.
  useEffect(() => {
    if (mode === null) return
    let smooth = true
    try { smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { /* köhnə brauzer */ }
    const behavior = smooth ? 'smooth' : 'auto'

    const strip = stepsRef.current
    const chip = strip?.querySelector('[aria-current="step"]')
    if (strip && chip && strip.scrollWidth > strip.clientWidth) {
      const c = chip.getBoundingClientRect()
      const r = strip.getBoundingClientRect()
      // Fiziki fərq — LTR və RTL-də eyni işləyir
      strip.scrollBy({ left: (c.left + c.width / 2) - (r.left + r.width / 2), behavior })
    }

    if (dir === 'none') return
    const card = cardRef.current
    if (!card) return
    let limit = 0
    try { limit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0 } catch { /* susma */ }
    const bar = topbarRef.current?.getBoundingClientRect()
    if (bar && getComputedStyle(topbarRef.current).position === 'sticky') limit = Math.max(limit, bar.bottom)
    if (card.getBoundingClientRect().top < limit) card.scrollIntoView({ block: 'start', behavior })
  }, [currentStep, mode, dir])

  // Şaquli addım xəttinin doluluğu (0…1): ilk addımda 0, sonuncuda 1
  const railP = totalSteps > 1 ? Math.min(currentStep, totalSteps - 1) / (totalSteps - 1) : 0

  // Dərsə / bölməyə keçid — həqiqi <a href>, adi klikdə SPA ilə
  const relHref = (r) => (r.learn ? pathFor('learn', lang, r.learn) : pathFor(r.to, lang))
  const openRel = (e, r) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    if (r.learn) navigate(pathFor('learn', lang, r.learn))
    else setPage?.(r.to)
    window.scrollTo(0, 0)
  }

  const media = pickUi(MEDIA_L, lang, 'en')
  const tw = pickUi(TAWAF_L, lang, 'en')
  // Təvaf addımından simulyatora yumşaq sürüş (adi klikdə; yeni vərəq/Ctrl — brauzerin işi)
  const openTawaf = (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    let smooth = true
    try { smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { /* köhnə brauzer */ }
    document.getElementById('hg-tawaf')?.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' })
  }

  return (
    <div className="hg-page">
      {/* Hero — v3: kompakt; solda izah + açar rəqəmlər + iki düymə, sağda Mina fotosu (≥900px) */}
      <header className="ui-page-hero ui-page-hero--split hg-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text" data-reveal="stagger">
            <Icon3D name="hajjguide" size={60} className="ui-hero-i3d" />
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('hajjguide'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.subtitle}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> <span>{P(HX.how, lang)}</span></p>
            <ul className="ui-page-hero__stats">
              {HX.stats.map((s, i) => <li key={i}><b dir="ltr">{s.v}</b><span>{P(s.l, lang)}</span></li>)}
            </ul>
            <div className="ui-page-hero__actions">
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => startFromHero('hajj')}>
                <Icon name="hajjguide" size={18} className="ui-btn__icon" /> {P(HX.startHajj, lang)}
              </button>
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => startFromHero('umrah')}>
                {P(HX.startUmrah, lang)}
              </button>
            </div>
          </div>
          {/* Foto yalnız ≥900px-də görünür (telefonda hero qısa qalsın); tənbəl yüklənir —
              gizli olanda brauzer onu heç yükləmir */}
          <div className="ui-page-hero__aside hg-hero-photo">
            <PlacePhoto id="mina" lang={lang} className="ph--parallax" sizes="(min-width: 900px) 440px, 100vw" />
          </div>
        </div>
      </header>

      {/* ═══ İnteraktiv bələdçi ═══ */}
      <section className="ui-section ui-section--tight hg-guide-sec" ref={guideRef} aria-labelledby={mode === null ? 'hg-pick-h' : undefined}>
        <div className="ui-container">

          {/* Seçim: Həcc və ya Ümrə */}
          {mode === null && (
            <>
              <Head id="hg-pick-h" eyebrow={P(HX.pickEyebrow, lang)} title={P(HX.pickTitle, lang)} lead={P(HX.pickLead, lang)} />
              {last && (
                <aside className="cl-spot hg-resume">
                  <span className="cl-spot__icon" aria-hidden="true"><Icon name={last.mode === 'hajj' ? 'hajjguide' : 'holyplaces'} /></span>
                  <div className="cl-spot__body">
                    <span className="cl-spot__eyebrow">{h32.resume}</span>
                    <span className="cl-spot__title">
                      {last.mode === 'hajj' ? t.hajj : t.umrah} · {(() => {
                        const list = last.mode === 'hajj' ? HAJJ_STEPS : UMRAH_STEPS
                        const i = Math.min(last.step, list.length - 1)
                        return `${h32.stepOf(i + 1, list.length)} — ${list[i].name[lang] || list[i].name.en}`
                      })()}
                    </span>
                    <span className="hg-resume__bar" aria-hidden="true">
                      <span style={{ '--p': (Math.min(last.step, (last.mode === 'hajj' ? HAJJ_STEPS : UMRAH_STEPS).length - 1) + 1) / (last.mode === 'hajj' ? HAJJ_STEPS : UMRAH_STEPS).length }} />
                    </span>
                  </div>
                  <div className="cl-spot__actions">
                    <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={resume}>
                      <Icon name="arrow" className="ui-btn__icon ui-flip-rtl" /> {h32.resumeBtn}
                    </button>
                  </div>
                </aside>
              )}
              <div className={`hg-select-grid${visited ? ' hg-view-in' : ''}`} data-reveal={visited ? undefined : 'stagger'}>
                {[
                  { m: 'hajj', icon: 'hajjguide', ar: 'الْحَجّ', name: t.hajj, list: HAJJ_STEPS },
                  { m: 'umrah', icon: 'holyplaces', ar: 'الْعُمْرَة', name: t.umrah, list: UMRAH_STEPS },
                ].map(o => (
                  <SpotlightCard as="button" key={o.m} type="button" tone="accent" className="ui-card ui-card--interactive hg-select-btn" onClick={() => startMode(o.m)}>
                    <span className="hg-select-top">
                      <span className="ui-icon-tile"><Icon name={o.icon} /></span>
                      <span className="hg-select-titles">
                        <span className="hg-select-name">{o.name}</span>
                        <span className="hg-select-count"><span className="ui-num">{o.list.length}</span> {stepsWord(o.list.length, lang)}</span>
                      </span>
                      {lang !== 'ar' && <span className="hg-select-arabic ui-arabic" lang="ar" dir="rtl">{o.ar}</span>}
                    </span>
                    {/* Addımların qısa zənciri — nə gözlədiyini əvvəlcədən görmək üçün */}
                    <span className="hg-select-chain">
                      {o.list.map((s, i) => <span key={s.id} className="hg-select-chain__i"><span className="ui-num">{i + 1}</span>{pickUi(s.name, lang, 'en')}</span>)}
                    </span>
                    <span className="hg-select-go" aria-hidden="true"><Icon name="arrow" size={18} className="ui-flip-rtl" /></span>
                  </SpotlightCard>
                ))}
              </div>
            </>
          )}

          {/* Addım-addım bələdçi */}
          {mode !== null && !isComplete && step && (
            <div className="hg-guide hg-view-in">
              {/* Üst zolaq: telefonda yapışqandır (geri + "Addım 3 / 10" + irəliləyiş) */}
              <div className="hg-topbar" ref={topbarRef}>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm hg-back-btn" onClick={handleBack}>
                  <Icon name="chevronLeft" size={18} className="ui-btn__icon ui-flip-rtl" /> {t.backToSteps}
                </button>
                <span className="hg-progress-text ui-num">
                  {t.step} {currentStep + 1} {t.of} {totalSteps}
                </span>
                {/* Doluluq transform ilə (--hg-p) — layout yenidən hesablanmır */}
                <div className="hg-progress" role="progressbar" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={currentStep + 1}
                  aria-label={`${t.step} ${currentStep + 1} ${t.of} ${totalSteps}`}>
                  <div className="hg-progress-fill" style={{ '--hg-p': `${progress}%` }} />
                </div>
              </div>

              {mode === 'hajj' && <HajjMap stepIds={HAJJ_STEPS_IDS} current={currentStep} onGo={goTo} />}

              <div className="hg-guide-body">
                {/* Addımlar: telefonda üfüqi çiplər, genişdə şaquli xətt (irəliləyiş doluluğu ilə) */}
                <nav className="hg-steps chip-scroll" ref={stepsRef} aria-label={t.steps} style={{ '--hg-rail': railP }}>
                  <span className="hg-rail" aria-hidden="true"><span className="hg-rail-fill" /></span>
                  {steps.map((st, i) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`hg-step-chip${i === currentStep ? ' is-active' : ''}${i < currentStep ? ' is-done' : ''}`}
                      aria-current={i === currentStep ? 'step' : undefined}
                      onClick={() => goTo(i)}
                    >
                      <span className="hg-step-chip-num ui-num" aria-hidden="true">
                        {i < currentStep ? <Icon name="check" size={13} strokeWidth={2.4} /> : i + 1}
                      </span>
                      <span className="hg-step-chip-label">{pickUi(st.name, lang, 'en')}</span>
                    </button>
                  ))}
                </nav>

                <div className="hg-main">
                  {/* Addım kartı — açar dəyişir: hər addım istiqamətə görə yumşaq sürüşüb gəlir */}
                  {/* v6: Motion PresenceSwap — köhnə addım qısa çıxır, yenisi istiqamətə görə sürüşüb gəlir (RTL güzgü) */}
                  <Swap swapKey={`${mode}-${step.id}`} variant="slide" dir={dir === 'prev' ? -1 : 1} className="hg-step-swap">
                  <article ref={cardRef} className="ui-card hg-step-card">
                    <div className="hg-step-header">
                      <span className="ui-icon-tile ui-icon-tile--accent hg-step-icon">
                        <Icon name={step.icon} />
                        <span className="hg-step-number ui-num" aria-hidden="true">{currentStep + 1}</span>
                      </span>
                      <div className="hg-step-titles">
                        <h2 className="hg-step-name">{pickUi(step.name, lang, 'en')}</h2>
                        {lang !== 'ar' && <p className="hg-step-arabic ui-arabic" lang="ar" dir="rtl">{step.arabic}</p>}
                      </div>
                    </div>

                    <p className="hg-description">{pickUi(step.description, lang, 'en')}</p>

                    {/* Oxunan dua / təlbiyə */}
                    {step.recitation && (
                      <div className="hg-recite">
                        <span className="hg-label">{t.recite}</span>
                        <p className="hg-recite-text ui-arabic" lang="ar" dir="rtl">{step.recitation}</p>
                      </div>
                    )}

                    {/* Təvaf addımı → simulyator */}
                    {(step.id === 'tawaf' || step.id === 'u_tawaf') && (
                      <a className="ui-btn ui-btn--secondary ui-btn--sm hg-tawaf-link" href="#hg-tawaf" onClick={openTawaf}>
                        <Icon name="touch" size={16} className="ui-btn__icon" /> {tw.open}
                      </a>
                    )}

                    {/* Qeydlər */}
                    {step.notes && step.notes[lang] && (
                      <div className="hg-notes">
                        <span className="hg-label hg-label--accent"><Icon name="info" size={15} /> {t.notes}</span>
                        <p>{step.notes[lang]}</p>
                      </div>
                    )}
                  </article>
                  </Swap>

                  {/* Əvvəlki / Növbəti */}
                  <div className="hg-nav">
                    <button type="button" className="ui-btn ui-btn--secondary" onClick={handlePrev} disabled={currentStep === 0}>
                      <Icon name="chevronLeft" size={18} className="ui-btn__icon ui-flip-rtl" /> {t.prev}
                    </button>
                    <button type="button" className="ui-btn ui-btn--primary" onClick={handleNext}>
                      {t.next} <Icon name="arrow" size={18} className="ui-btn__icon ui-flip-rtl" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tamamlandı */}
          {isComplete && (
            <div className="ui-card hg-complete" role="status">
              <span className="hg-complete-icon" aria-hidden="true">
                <span className="hg-complete-ring" />
                <Icon name="check" size={34} strokeWidth={2.2} />
              </span>
              <h2 className="hg-complete-title">{t.complete}</h2>
              <p className="hg-complete-mode">{mode === 'hajj' ? t.hajj : t.umrah}</p>
              <button type="button" className="ui-btn ui-btn--primary" onClick={handleRestart}>
                <Icon name="refresh" size={18} className="ui-btn__icon" /> {t.restart}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ v7: Təvaf simulyatoru ═══ */}
      <section className="ui-section hg-tawaf" id="hg-tawaf" aria-labelledby="hg-tawaf-h">
        <div className="ui-container">
          <Head id="hg-tawaf-h" eyebrow={tw.eyebrow} title={tw.title} lead={tw.lead} />
          <DeferRender height="560px" idle={false} rootMargin="500px 0px">
            <Suspense fallback={<div className="ui-card" style={{ minHeight: 560 }} />}>
              <TawafSim />
            </Suspense>
          </DeferRender>
        </div>
      </section>

      {/* ═══ Günbəgün: 8–13 Zülhiccə ═══ */}
      <section className="ui-section ui-section--alt hg-days ui-cv" style={{ '--cv-h': '900px' }} aria-labelledby="hg-days-h">
        <div className="ui-container">
          <Head id="hg-days-h" eyebrow={P(HX.daysEyebrow, lang)} title={P(HX.daysTitle, lang)} lead={P(HX.daysLead, lang)} />
          <Timeline wide items={HAJJ_DAYS.map(d => ({
            key: d.key, when: P(d.when, lang), title: P(d.title, lang), text: P(d.text, lang), highlight: d.highlight,
          }))} />
        </div>
      </section>

      {/* ═══ Xəritə: mərhələlər + Məscidül-Haram fotosu ═══ */}
      <section className="ui-section hg-media" aria-labelledby="hg-media-h">
        <div className="ui-container">
          <Head id="hg-media-h" eyebrow={media.eyebrow} title={media.title} lead={media.lead} />
          <div className="hg-media-grid">
            <HajjRouteMap lang={lang} />
            <div className="hg-media-side" data-reveal="stagger">
              {['masjid-al-haram'].map(k => (
                <div key={k}>
                  <PlacePhoto id={k} lang={lang} className="ph--zoom" sizes="(min-width: 1024px) 360px, 100vw" />
                  <p className="ph-strip__cap">{PLACE_PHOTOS[k].name[lang] || PLACE_PHOTOS[k].name.en}</p>
                </div>
              ))}
            </div>
          </div>
          <DeferRender height="560px" idle={false} rootMargin="400px 0px">
            <Suspense fallback={<div className="ui-card" style={{ minHeight: 560 }} />}>
              <div className="hg-3d"><HajjJourney3D lang={lang} /></div>
            </Suspense>
          </DeferRender>
        </div>
      </section>

      {/* ═══ Rüknlər və vaciblər ═══ */}
      <section className="ui-section ui-section--alt" aria-labelledby="hg-rites-h">
        <div className="ui-container">
          <Head id="hg-rites-h" eyebrow={P(HX.ritesEyebrow, lang)} title={P(HX.ritesTitle, lang)} lead={P(HX.ritesLead, lang)} />
          <RitesChecklist lang={lang} />
        </div>
      </section>

      {/* ═══ İhram: olmaz / olar ═══ */}
      <section className="ui-section" aria-labelledby="hg-ihram-h">
        <div className="ui-container">
          <Head id="hg-ihram-h" eyebrow={P(HX.ihramEyebrow, lang)} title={P(HX.ihramTitle, lang)} lead={P(HX.ihramLead, lang)} />
          <div className="hg-ihram" data-reveal="stagger">
            {[
              { k: 'not', list: IHRAM_NOT, title: P(HX.notAllowed, lang), icon: 'close' },
              { k: 'ok', list: IHRAM_OK, title: P(HX.allowed, lang), icon: 'check' },
            ].map(col => (
              <div key={col.k} className={`ui-card hg-ihram__col hg-ihram__col--${col.k}`}>
                <h3 className="hg-ihram__title">
                  <span className="hg-ihram__mark" aria-hidden="true"><Icon name={col.icon} size={15} strokeWidth={2.4} /></span>
                  {col.title} <span className="ui-num hg-ihram__n">{col.list.length}</span>
                </h3>
                <ul className="hg-ihram__list">
                  {col.list.map((it, i) => (
                    <li key={i}>
                      <span>{P(it, lang)}</span>
                      {it.ref && <span className="hg-ref">{P(it.ref, lang)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Həccin növləri ═══ */}
      <section className="ui-section ui-section--alt" aria-labelledby="hg-types-h">
        <div className="ui-container">
          <Head id="hg-types-h" eyebrow={P(HX.typesEyebrow, lang)} title={P(HX.typesTitle, lang)} lead={P(HX.typesLead, lang)} />
          <div className="ui-table-wrap hg-types" tabIndex={0} role="region" aria-label={P(HX.typesTitle, lang)}>
            <table className="ui-table">
              <thead>
                <tr>
                  <th scope="col">{P(HX.typeCol, lang)}</th>
                  <th scope="col">{P(HX.ihramCol, lang)}</th>
                  <th scope="col">{P(HX.hadyCol, lang)}</th>
                </tr>
              </thead>
              <tbody>
                {HAJJ_TYPES.map(ty => (
                  <tr key={ty.id} className={ty.id === 'tamattu' ? 'is-current' : undefined}>
                    <th scope="row">{P(ty.name, lang)}</th>
                    <td>{P(ty.ihram, lang)}</td>
                    <td><span className={`hg-hady${ty.needs ? ' is-yes' : ''}`}>{P(ty.hady, lang)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="ui-callout hg-types-note">
            <Icon name="info" />
            <div><p>{P(HX.typesNote, lang)}</p></div>
          </aside>
        </div>
      </section>

      {/* ═══ Fəzilət: ayə + iki hədis ═══ */}
      <section className="ui-section" aria-labelledby="hg-virtue-h">
        <div className="ui-container">
          <Head id="hg-virtue-h" eyebrow={P(HX.virtueEyebrow, lang)} title={P(HX.virtueTitle, lang)} />
          <div className="hg-virtues" data-reveal="stagger">
            {HAJJ_VIRTUES.map((v, i) => (
              <figure key={i} className="ui-quote hg-virtue">
                <blockquote>
                  <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{v.ar}</p>
                  {lang !== 'ar' && <p className="ui-quote__text">{P(v.text, lang)}</p>}
                </blockquote>
                <figcaption className="ui-quote__src">{P(v.src, lang)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Əlaqəli bölmələr ═══ */}
      <section className="ui-section ui-section--tight hg-related" aria-labelledby="hg-rel-h">
        <div className="ui-container">
          <h2 id="hg-rel-h" className="ui-eyebrow hg-related__h">{P(HX.related, lang)}</h2>
          <ul className="ui-tiles" style={{ '--ui-tiles-min': '220px' }} data-reveal="stagger">
            {HAJJ_RELATED.map((r, i) => (
              <li key={i}>
                <a className="ui-tile ui-tile--row" href={relHref(r)} onClick={(e) => openRel(e, r)}>
                  <span className="ui-icon-tile" aria-hidden="true"><Icon name={r.icon} /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{P(r.title, lang)}</span>
                    <span className="ui-tile__text">{P(r.text, lang)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
