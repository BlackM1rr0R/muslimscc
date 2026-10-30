import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
// Dizayn v2: addım görünüşü artıq tam bu faylın öz .hg-* siniflərindədir —
// Namaz bələdçisinin CSS-i (PrayerGuidePage.css, .pg-*) idxal olunmur, o səhifə
// dəyişəndə həcc bələdçisi pozulmasın.
import '../styles/HajjGuidePage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'

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
    arabic: 'رَمْي',
    name: { az:'Rəmy', en:'Ramy (Stoning)', ru:'Рами (Бросание камней)', ar:'رمي الجمرات', tr:'Remy (Şeytan Taşlama)' },
    description: {
      az: '10 Zülhiccə (Qurban bayramı) — Böyük cəmrəyə (Cəmrətül-Aqaba) 7 daş atın. Hər daş atarkən "Allahu Akbar" deyin. 11-12 Zülhiccədə hər üç cəmrəyə (kiçik, orta, böyük) 7-şər daş atın.',
      en: '10th Dhul Hijjah (Eid al-Adha) — Throw 7 pebbles at the large pillar (Jamrat al-Aqaba). Say "Allahu Akbar" with each throw. On 11th-12th Dhul Hijjah, stone all three pillars (small, medium, large) with 7 pebbles each.',
      ru: '10-е Зуль-Хиджа (Ид аль-Адха) — бросьте 7 камешков в большой столб (Джамрат аль-Акаба). Говорите «Аллаху Акбар» при каждом броске. 11-12 Зуль-Хиджа бросайте по 7 камешков во все три столба (малый, средний, большой).',
      ar: '١٠ ذي الحجة (عيد الأضحى) — ارمِ جمرة العقبة الكبرى بـ٧ حصيات. كبّر مع كل حصاة. في ١١-١٢ ذي الحجة ارمِ الجمرات الثلاث (الصغرى والوسطى والكبرى) بـ٧ حصيات لكل واحدة.',
      tr: '10 Zilhicce (Kurban Bayramı) — Büyük cemreye (Cemretül-Akabe) 7 taş atın. Her taşta "Allahu Ekber" deyin. 11-12 Zilhicce\'de üç cemreye (küçük, orta, büyük) 7\'şer taş atın.',
    },
    recitation: 'اللَّهُ أَكْبَرُ',
    notes: {
      az: 'Daşlar noxud boyda olmalıdır. Zöhrdən sonra atın (10-cu gün istisna).',
      en: 'Pebbles should be chickpea-sized. Throw after Dhuhr (except on the 10th).',
      ru: 'Камешки размером с горошину. Бросайте после Зухра (кроме 10-го дня).',
      ar: 'الحصى بحجم الحمصة. ارمِ بعد الظهر (ما عدا يوم العاشر).',
      tr: 'Taşlar nohut büyüklüğünde olmalıdır. Öğleden sonra atın (10. gün hariç).',
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
    id: 'tawaf_ifadah',
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

export default function HajjGuidePage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const [mode, setMode] = useState(null) // 'hajj' | 'umrah'
  const [currentStep, setCurrentStep] = useState(0)
  // Addım kartının giriş istiqaməti: 'next' | 'prev' | 'none' (ilk açılış — animasiyasız)
  const [dir, setDir] = useState('none')
  // Seçim ekranına geri qayıdanda yumşaq giriş; ilk yükləmədə yox (səhifə keçidi onsuz da var)
  const [visited, setVisited] = useState(false)

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
  const handlePrev = () => { if (currentStep > 0) goTo(currentStep - 1) }
  const handleNext = () => { goTo(currentStep + 1) }
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

  return (
    <div className="hg-page">
      {/* Hero — dizayn v2: sakit kağız fon + xatəm naxışı, bir <h1> */}
      <header className="ui-page-hero hg-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('hajjguide'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="hg-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">{t.heroArabic}</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">

          {/* Seçim: Həcc və ya Ümrə */}
          {mode === null && (
            <div className={`hg-select-grid${visited ? ' hg-view-in' : ''}`} data-reveal={visited ? undefined : 'stagger'}>
              {[
                { m: 'hajj', icon: 'hajjguide', ar: 'الْحَجّ', name: t.hajj, list: HAJJ_STEPS },
                { m: 'umrah', icon: 'holyplaces', ar: 'الْعُمْرَة', name: t.umrah, list: UMRAH_STEPS },
              ].map(o => (
                <button key={o.m} type="button" className="ui-card ui-card--interactive hg-select-btn" onClick={() => startMode(o.m)}>
                  <span className="ui-icon-tile ui-icon-tile--lg"><Icon name={o.icon} /></span>
                  <span className="hg-select-arabic ui-arabic" lang="ar" dir="rtl">{o.ar}</span>
                  <span className="hg-select-name">{o.name}</span>
                  <span className="ui-badge ui-badge--brand hg-select-count">
                    <span className="ui-num">{o.list.length}</span> {stepsWord(o.list.length, lang)}
                  </span>
                  {/* Addımların qısa zənciri — nə gözlədiyini əvvəlcədən görmək üçün */}
                  <span className="hg-select-chain">
                    {o.list.map(s => s.name[lang] || s.name.en).join(' · ')}
                  </span>
                  <span className="hg-select-go" aria-hidden="true"><Icon name="arrow" size={18} className="ui-flip-rtl" /></span>
                </button>
              ))}
            </div>
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
                      <span className="hg-step-chip-label">{st.name[lang] || st.name.en}</span>
                    </button>
                  ))}
                </nav>

                <div className="hg-main">
                  {/* Addım kartı — açar dəyişir: hər addım istiqamətə görə yumşaq sürüşüb gəlir */}
                  <article key={`${mode}-${step.id}`} ref={cardRef} className={`ui-card hg-step-card is-${dir}`}>
                    <div className="hg-step-header">
                      <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--accent hg-step-icon">
                        <Icon name={step.icon} />
                        <span className="hg-step-number ui-num" aria-hidden="true">{currentStep + 1}</span>
                      </span>
                      <div className="hg-step-titles">
                        <h2 className="hg-step-name">{step.name[lang] || step.name.en}</h2>
                        {lang !== 'ar' && <p className="hg-step-arabic ui-arabic" lang="ar" dir="rtl">{step.arabic}</p>}
                      </div>
                    </div>

                    <p className="hg-description">{step.description[lang] || step.description.en}</p>

                    {/* Oxunan dua / təlbiyə */}
                    {step.recitation && (
                      <div className="hg-recite">
                        <span className="hg-label">{t.recite}</span>
                        <p className="hg-recite-text ui-arabic" lang="ar" dir="rtl">{step.recitation}</p>
                      </div>
                    )}

                    {/* Qeydlər */}
                    {step.notes && step.notes[lang] && (
                      <div className="hg-notes">
                        <span className="hg-label hg-label--accent"><Icon name="info" size={15} /> {t.notes}</span>
                        <p>{step.notes[lang]}</p>
                      </div>
                    )}
                  </article>

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
    </div>
  )
}
