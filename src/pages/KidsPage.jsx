import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import Icon from '../components/Icon'
import PageLink, { isPlainClick } from '../components/PageLink'
import { useNavigate } from 'react-router-dom'
import LessonBlocks, { pick } from '../components/lesson/LessonBlocks'
import { pathFor } from '../seo/routes'
import { KIDS_DUAS, STORIES, IMAN_PILLARS, PILLARS_SOURCES, MANNERS, PARENTS } from '../data/pageGuides/KidsPage'
import { ProgressRing } from '../components/viz'
import '../styles/LessonsPage.css'
import '../styles/KidsPage.css'
import { pickUi } from '../utils/uiText'
import { m } from 'motion/react'
import LayoutFeatures from '../motion/LayoutFeatures'
import PresenceSwap from '../motion/PresenceSwap'
import { SPRING } from '../motion/presets'

// Rüknlərin ikonları (Icon.jsx) — məlumatdakı emoji sahələri
// artıq göstərilmir (dizayn v2: emoji ikon yoxdur). Sıra PILLARS ilədir.
const PILLAR_ICONS = ['names', 'prayer', 'moon', 'zakat', 'hajjguide']

// "Gözəl davranışlar" oyunu — bu günün işarələri cihazda saxlanılır (gün dəyişəndə sıfırlanır)
const MANNERS_KEY = 'kids_manners'
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function loadManners() {
  try {
    const raw = JSON.parse(localStorage.getItem(MANNERS_KEY))
    if (!raw || raw.date !== todayKey() || !Array.isArray(raw.done)) return []
    return raw.done.filter(id => MANNERS.some(m => m.id === id))
  } catch { return [] }
}

// v3 — hero, bölmə izahları, ulduz halqası üçün əlavə mətnlər
const KX = {
  az: { lead:'Allahın adları, qısa surələr, dualar, Qurandakı peyğəmbər hekayələri və kiçik oyunlar — valideyn guşəsi ilə birlikdə.',
    how:'Aşağıdakı bölmələrdən birini seçin. Hər dua və hekayənin mənbəsi göstərilib; musiqi və canlı təsvirləri yoxdur.',
    names:'ad', surahs:'surə', duas:'dua', stories:'hekayə', todayStars:'Bu günün ulduzları', openManners:'Gözəl davranışları işarələ',
    leads:{ names:'Allahın gözəl adlarını və mənalarını öyrən.', surahs:'Namaz üçün ilk əzbərlənən qısa surələr və onların mənası.', duas:'Yeməkdə, yuxuda, evdən çıxanda — hər gün deyilən qısa dualar.', rules:'Müsəlmanın inandığı və etdiyi əsas şeylər — iki qısa siyahıda.', prophets:'Peyğəmbərlərlə tanış ol: adları və qısa məlumat.', quiz:'Öyrəndiklərini yoxla — səhv etsən də, düz cavabı görəcəksən.' } },
  en: { lead:'The Names of Allah, short surahs, duas, prophet stories from the Quran and small games — with a corner for parents.',
    how:'Choose one of the sections below. Every dua and story shows its source; there is no music and no images of living beings.',
    names:'names', surahs:'surahs', duas:'duas', stories:'stories', todayStars:'Today’s stars', openManners:'Tick your good manners',
    leads:{ names:'Learn the Beautiful Names of Allah and what they mean.', surahs:'The short surahs children memorise first for prayer, with their meaning.', duas:'Short duas for every day — eating, sleeping, leaving home and more.', rules:'The basics a Muslim believes and does — in two short lists.', prophets:'Meet the prophets: their names and a short note about each.', quiz:'Check what you learnt — if you get one wrong, you will see the right answer.' } },
  ru: { lead:'Имена Аллаха, короткие суры, дуа, рассказы о пророках из Корана и небольшие игры — и уголок для родителей.',
    how:'Выберите один из разделов ниже. У каждого дуа и рассказа указан источник; здесь нет музыки и изображений живых существ.',
    names:'имён', surahs:'сур', duas:'дуа', stories:'рассказов', todayStars:'Звёзды за сегодня', openManners:'Отметить добрые дела',
    leads:{ names:'Узнай прекрасные имена Аллаха и их значения.', surahs:'Короткие суры, которые дети заучивают первыми для намаза, и их смысл.', duas:'Короткие дуа на каждый день — за едой, перед сном, при выходе из дома.', rules:'Основы того, во что верит и что делает мусульманин, — в двух коротких списках.', prophets:'Познакомься с пророками: их имена и краткие сведения.', quiz:'Проверь, что ты узнал: если ошибёшься, увидишь правильный ответ.' } },
  ar: { lead:'أسماء الله، وسور قصيرة، وأدعية، وقصص الأنبياء من القرآن، وألعاب صغيرة، مع ركن للوالدين.',
    how:'اختر أحد الأقسام أدناه. لكل دعاء وقصة مصدر مذكور، ولا موسيقى ولا صور لذوات الأرواح.',
    names:'اسمًا', surahs:'سورة', duas:'دعاء', stories:'قصة', todayStars:'نجوم اليوم', openManners:'سجّل آدابك الحسنة',
    leads:{ names:'تعرّف على أسماء الله الحسنى ومعانيها.', surahs:'السور القصيرة التي يحفظها الأطفال أولًا للصلاة، مع معانيها.', duas:'أدعية قصيرة لكل يوم: عند الطعام والنوم والخروج من البيت وغيرها.', rules:'أساس ما يؤمن به المسلم وما يعمله في قائمتين قصيرتين.', prophets:'تعرّف على الأنبياء: أسماؤهم ونبذة قصيرة عن كل منهم.', quiz:'اختبر ما تعلمته، وإن أخطأت فسترى الإجابة الصحيحة.' } },
  tr: { lead:'Allah’ın isimleri, kısa sureler, dualar, Kur’an’dan peygamber kıssaları ve küçük oyunlar — anne-baba köşesiyle birlikte.',
    how:'Aşağıdaki bölümlerden birini seçin. Her dua ve kıssanın kaynağı gösterilmiştir; müzik ve canlı tasviri yoktur.',
    names:'isim', surahs:'sure', duas:'dua', stories:'kıssa', todayStars:'Bugünün yıldızları', openManners:'Güzel davranışlarını işaretle',
    leads:{ names:'Allah’ın güzel isimlerini ve anlamlarını öğren.', surahs:'Namaz için ilk ezberlenen kısa sureler ve anlamları.', duas:'Her gün okunan kısa dualar — yemekte, uykuda, evden çıkarken.', rules:'Bir Müslümanın inandığı ve yaptığı temel şeyler — iki kısa listede.', prophets:'Peygamberlerle tanış: isimleri ve kısa bilgi.', quiz:'Öğrendiklerini kontrol et — yanılsan da doğru cevabı göreceksin.' } },
}

const LABELS = {
  az: { title:'Uşaq bölməsi', subtitle:'Kiçiklər üçün İslam', namesTitle:'Allahın gözəl adları', surahsTitle:'Qısa surələr', duasTitle:'Gündəlik dualar', rulesTitle:'İslamın və imanın rüknləri', quizTitle:'Mini kviz', prophetsTitle:'Peyğəmbərlər', storiesTitle:'Peyğəmbər hekayələri', mannersTitle:'Gözəl davranışlar', parentsTitle:'Valideyn guşəsi', learn:'Öyrən', correct:'Afərin!', wrong:'Yenidən cəhd et', next:'Növbəti',
        islamPillars:'İslamın 5 rüknü', imanPillars:'İmanın 6 rüknü', source:'Mənbə', grade:'Dərəcəsi', lessonLbl:'Dərs', storiesNote:'Hekayələr yalnız Qurandan danışılır — ayələrə istinad altdadır; İsrailiyyat rəvayətləri əlavə olunmayıb.', moreDuas:'Daha çox dua: Hisnul-Müslim', mannersLead:'Bu gün etdiyin gözəl işləri işarələ! Hər işarə bir ulduzdur. Sabah siyahı yenidən başlayır.', mannersDone:'Bu gün', mannersAll:'Maşallah! Bu gün hamısını etdin!', mannersReset:'Sıfırla', parentsLead:'Uşaq tərbiyəsi barədə Quran və səhih Sünnədən qısa bələdçi.', seeAlso:'Ətraflı' },
  en: { title:'Kids Section', subtitle:'Islam for little ones', namesTitle:'Beautiful Names of Allah', surahsTitle:'Short Surahs', duasTitle:'Daily Duas', rulesTitle:'Pillars of Islam and Iman', quizTitle:'Mini Quiz', prophetsTitle:'Prophets', storiesTitle:'Stories of the Prophets', mannersTitle:'Good Manners', parentsTitle:'Parents’ Corner', learn:'Learn', correct:'Well done!', wrong:'Try again', next:'Next',
        islamPillars:'The 5 pillars of Islam', imanPillars:'The 6 pillars of Iman', source:'Source', grade:'Grade', lessonLbl:'Lesson', storiesNote:'These stories are told only from the Quran — the verse references are below each one; no Israiliyyat reports have been added.', moreDuas:'More duas: Hisn al-Muslim', mannersLead:'Tick the good things you did today! Each tick is a star. The list starts again tomorrow.', mannersDone:'Today', mannersAll:'Masha’Allah! You did them all today!', mannersReset:'Reset', parentsLead:'A short guide to raising children from the Quran and the authentic Sunnah.', seeAlso:'Read more' },
  ru: { title:'Детский раздел', subtitle:'Ислам для малышей', namesTitle:'Прекрасные Имена Аллаха', surahsTitle:'Короткие суры', duasTitle:'Ежедневные дуа', rulesTitle:'Столпы ислама и имана', quizTitle:'Мини-викторина', prophetsTitle:'Пророки', storiesTitle:'Рассказы о пророках', mannersTitle:'Хорошие манеры', parentsTitle:'Уголок родителей', learn:'Учи', correct:'Молодец!', wrong:'Попробуй ещё', next:'Далее',
        islamPillars:'5 столпов ислама', imanPillars:'6 столпов имана', source:'Источник', grade:'Степень', lessonLbl:'Урок', storiesNote:'Рассказы передаются только по Корану — ссылки на аяты под каждым; преданий из «исраилийят» не добавлено.', moreDuas:'Больше дуа: Хиснуль-муслим', mannersLead:'Отметь хорошие дела, которые ты сделал(а) сегодня! Каждая отметка — звезда. Завтра список начнётся заново.', mannersDone:'Сегодня', mannersAll:'Ма шаа Аллах! Сегодня ты сделал(а) всё!', mannersReset:'Сбросить', parentsLead:'Краткое руководство по воспитанию детей по Корану и достоверной Сунне.', seeAlso:'Подробнее' },
  ar: { title:'قسم الأطفال', subtitle:'الإسلام للصغار', namesTitle:'أسماء الله الحسنى', surahsTitle:'سور قصيرة', duasTitle:'أدعية يومية', rulesTitle:'أركان الإسلام والإيمان', quizTitle:'اختبار صغير', prophetsTitle:'الأنبياء', storiesTitle:'قصص الأنبياء', mannersTitle:'الآداب الحسنة', parentsTitle:'ركن الوالدين', learn:'تعلم', correct:'أحسنت!', wrong:'حاول مرة أخرى', next:'التالي',
        islamPillars:'أركان الإسلام الخمسة', imanPillars:'أركان الإيمان الستة', source:'المصدر', grade:'الدرجة', lessonLbl:'درس', storiesNote:'تُروى هذه القصص من القرآن فقط مع الإحالة إلى الآيات تحت كل قصة، ولم نُضف شيئًا من الإسرائيليات.', moreDuas:'المزيد من الأدعية: حصن المسلم', mannersLead:'ضع علامة على الأعمال الطيبة التي فعلتها اليوم! كل علامة نجمة، وتبدأ القائمة من جديد غدًا.', mannersDone:'اليوم', mannersAll:'ما شاء الله! فعلتها كلها اليوم!', mannersReset:'إعادة', parentsLead:'دليل مختصر في تربية الأولاد من القرآن والسنة الصحيحة.', seeAlso:'للمزيد' },
  tr: { title:'Çocuk Bölümü', subtitle:'Küçükler için İslam', namesTitle:'Allah\'ın Güzel İsimleri', surahsTitle:'Kısa Sureler', duasTitle:'Günlük Dualar', rulesTitle:'İslam\'ın ve imanın şartları', quizTitle:'Mini Bilgi Yarışması', prophetsTitle:'Peygamberler', storiesTitle:'Peygamber Kıssaları', mannersTitle:'Güzel Davranışlar', parentsTitle:'Anne-Baba Köşesi', learn:'Öğren', correct:'Aferin!', wrong:'Tekrar dene', next:'Sonraki',
        islamPillars:'İslam\'ın 5 şartı', imanPillars:'İmanın 6 şartı', source:'Kaynak', grade:'Derecesi', lessonLbl:'Ders', storiesNote:'Kıssalar yalnızca Kur’an’dan anlatılır — ayet atıfları her birinin altındadır; İsrailiyat rivayetleri eklenmemiştir.', moreDuas:'Daha fazla dua: Hısnu’l-Müslim', mannersLead:'Bugün yaptığın güzel işleri işaretle! Her işaret bir yıldızdır. Yarın liste yeniden başlar.', mannersDone:'Bugün', mannersAll:'Maşallah! Bugün hepsini yaptın!', mannersReset:'Sıfırla', parentsLead:'Kur’an ve sahih Sünnetten çocuk terbiyesine dair kısa bir rehber.', seeAlso:'Daha fazlası' },
}

const NAMES_OF_ALLAH = [
  { ar:'ٱللَّهُ', emoji:'🌟', az:'Allah — Yeganə Tanrı', en:'Allah — The One God', ru:'Аллах — Единый Бог', ar_desc:'الله — الإله الواحد', tr:'Allah — Tek İlah' },
  { ar:'ٱلرَّحۡمَٰنُ', emoji:'💝', az:'Rəhman — Çox Mərhəmətli', en:'Ar-Rahman — The Most Merciful', ru:'Ар-Рахман — Всемилостивый', ar_desc:'الرحمن — كثير الرحمة', tr:'Rahman — Çok Merhametli' },
  { ar:'ٱلرَّحِيمُ', emoji:'🤲', az:'Rəhim — Çox Rəhimli', en:'Ar-Rahim — The Most Compassionate', ru:'Ар-Рахим — Милосердный', ar_desc:'الرحيم — الرؤوف بعباده', tr:'Rahim — Çok Şefkatli' },
  { ar:'ٱلۡمَلِكُ', emoji:'👑', az:'Malik — Hökmdar', en:'Al-Malik — The King', ru:'Аль-Малик — Царь', ar_desc:'الملك — صاحب الملك', tr:'Melik — Hükümdar' },
  { ar:'ٱلسَّلَٰمُ', emoji:'☮️', az:'Salam — Əmin-Amanlıq Verən', en:'As-Salam — The Source of Peace', ru:'Ас-Салам — Дарующий мир', ar_desc:'السلام — مصدر السلام', tr:'Selam — Barış Veren' },
  { ar:'ٱلۡخَٰلِقُ', emoji:'🌍', az:'Xaliq — Hər Şeyi Yaradan', en:'Al-Khaliq — The Creator', ru:'Аль-Халик — Творец', ar_desc:'الخالق — خالق كل شيء', tr:'Halık — Her Şeyi Yaratan' },
  { ar:'ٱلۡغَفُورُ', emoji:'🙏', az:'Ğəfur — Çox Bağışlayan', en:'Al-Ghafur — The Forgiving', ru:'Аль-Гафур — Прощающий', ar_desc:'الغفور — كثير المغفرة', tr:'Gafur — Çok Bağışlayan' },
  { ar:'ٱلرَّزَّاقُ', emoji:'🍎', az:'Rəzzaq — Ruzi Verən', en:'Ar-Razzaq — The Provider', ru:'Ар-Раззак — Дарующий блага', ar_desc:'الرزاق — المتكفل بالرزق', tr:'Rezzak — Rızık Veren' },
  { ar:'ٱلسَّمِيعُ', emoji:'👂', az:'Səmi — Hər Şeyi Eşidən', en:'As-Sami — The All-Hearing', ru:'Ас-Сами — Всеслышащий', ar_desc:'السميع — يسمع كل شيء', tr:'Semi — Her Şeyi İşiten' },
  { ar:'ٱلۡوَدُودُ', emoji:'❤️', az:'Vədud — Çox Sevən', en:'Al-Wadud — The Most Loving', ru:'Аль-Вадуд — Любящий', ar_desc:'الودود — كثير المحبة', tr:'Vedud — Çok Seven' },
  { ar:'ٱلۡعَزِيزُ', emoji:'💪', az:'Əziz — Qüdrətli', en:'Al-Aziz — The Almighty', ru:'Аль-Азиз — Могущественный', ar_desc:'العزيز — القوي الغالب', tr:'Aziz — Güçlü' },
  { ar:'ٱلۡحَكِيمُ', emoji:'🧠', az:'Həkim — Hikmət Sahibi', en:'Al-Hakim — The All-Wise', ru:'Аль-Хаким — Мудрый', ar_desc:'الحكيم — صاحب الحكمة', tr:'Hakim — Hikmet Sahibi' },
  { ar:'ٱلۡعَلِيمُ', emoji:'📚', az:'Əlim — Hər Şeyi Bilən', en:'Al-Alim — The All-Knowing', ru:'Аль-Алим — Всезнающий', ar_desc:'العليم — يعلم كل شيء', tr:'Alim — Her Şeyi Bilen' },
  { ar:'ٱلۡبَصِيرُ', emoji:'👁️', az:'Bəsir — Hər Şeyi Görən', en:'Al-Basir — The All-Seeing', ru:'Аль-Басир — Всевидящий', ar_desc:'البصير — يرى كل شيء', tr:'Basir — Her Şeyi Gören' },
  { ar:'ٱللَّطِيفُ', emoji:'🌸', az:'Lətif — Lütf Edən', en:'Al-Latif — The Most Gentle', ru:'Аль-Латиф — Добрый', ar_desc:'اللطيف — الرفيق بعباده', tr:'Latif — Lütuf Sahibi' },
  { ar:'ٱلۡكَبِيرُ', emoji:'⭐', az:'Kəbir — Ən Böyük', en:'Al-Kabir — The Greatest', ru:'Аль-Кабир — Величайший', ar_desc:'الكبير — العظيم', tr:'Kebir — En Büyük' },
  { ar:'ٱلۡحَفِيظُ', emoji:'🛡️', az:'Həfiz — Qoruyan', en:'Al-Hafiz — The Protector', ru:'Аль-Хафиз — Хранитель', ar_desc:'الحفيظ — الحافظ لعباده', tr:'Hafız — Koruyan' },
  { ar:'ٱلشَّكُورُ', emoji:'🤝', az:'Şəkur — Şükür Qəbul Edən', en:'Ash-Shakur — The Appreciative', ru:'Аш-Шакур — Благодарный', ar_desc:'الشكور — يقبل الشكر', tr:'Şekur — Şükrü Kabul Eden' },
  { ar:'ٱلۡحَيُّ', emoji:'💚', az:'Həyy — Əbədi Diri', en:'Al-Hayy — The Ever-Living', ru:'Аль-Хайй — Вечно Живой', ar_desc:'الحي — الدائم الحياة', tr:'Hayy — Daima Diri' },
  { ar:'ٱلۡقَيُّومُ', emoji:'🌐', az:'Qayyum — Hər Şeyi Saxlayan', en:'Al-Qayyum — The Self-Sustaining', ru:'Аль-Каюм — Самодостаточный', ar_desc:'القيوم — القائم بذاته', tr:'Kayyum — Her Şeyi Ayakta Tutan' },
  { ar:'ٱلۡوَاحِدُ', emoji:'☝️', az:'Vahid — Tək Olan', en:'Al-Wahid — The One', ru:'Аль-Вахид — Единственный', ar_desc:'الواحد — الأحد', tr:'Vahid — Tek Olan' },
  { ar:'ٱلۡقَادِرُ', emoji:'⚡', az:'Qadir — Hər Şeyə Qadir', en:'Al-Qadir — The All-Powerful', ru:'Аль-Кадир — Всемогущий', ar_desc:'القادر — القادر على كل شيء', tr:'Kadir — Her Şeye Gücü Yeten' },
  { ar:'ٱلۡأَوَّلُ', emoji:'🔵', az:'Əvvəl — Başlanğıcı Olmayan', en:'Al-Awwal — The First', ru:'Аль-Авваль — Первый', ar_desc:'الأول — ليس لوجوده بداية', tr:'Evvel — İlk Olan' },
  { ar:'ٱلۡآخِرُ', emoji:'🔴', az:'Axir — Sonu Olmayan', en:'Al-Akhir — The Last', ru:'Аль-Ахир — Последний', ar_desc:'الآخر — ليس لوجوده نهاية', tr:'Ahir — Son Olan' },
  { ar:'ٱلنُّورُ', emoji:'💡', az:'Nur — İşıq, Nur Sahibi', en:'An-Nur — The Light', ru:'Ан-Нур — Свет', ar_desc:'النور — نور السماوات والأرض', tr:'Nur — Işık Sahibi' },
]

const SHORT_SURAHS = [
  { num:1, name:'الفاتحة', en:'Al-Fatiha', emoji:'📖', ayahs:7,
    az:'Quranın açılış surəsi. Hər namazda oxunur.',
    en_desc:'The opening surah. Recited in every prayer.',
    ru:'Открывающая сура. Читается в каждом намазе.',
    ar_desc:'سورة الفاتحة تُقرأ في كل صلاة.',
    tr:'Açılış suresi. Her namazda okunur.' },
  { num:112, name:'الإخلاص', en:'Al-Ikhlas', emoji:'💎', ayahs:4,
    az:'Allahın tək olduğunu öyrədir. Quranın üçdə birinə bərabərdir.',
    en_desc:'Teaches that Allah is One. Equal to one-third of the Quran.',
    ru:'Учит, что Аллах Един. Равна трети Корана.',
    ar_desc:'تعلمنا أن الله واحد. تعدل ثلث القرآن.',
    tr:'Allah\'ın bir olduğunu öğretir. Kuran\'ın üçte birine denktir.' },
  { num:113, name:'الفلق', en:'Al-Falaq', emoji:'🌅', ayahs:5,
    az:'Allahdan pisliklərə qarşı qorunma istəyirik.',
    en_desc:'We seek refuge in Allah from evil.',
    ru:'Просим у Аллаха защиты от зла.',
    ar_desc:'نستعيذ بالله من الشرور.',
    tr:'Allah\'tan kötülüklere karşı sığınırız.' },
  { num:114, name:'الناس', en:'An-Nas', emoji:'🛡️', ayahs:6,
    az:'İnsanların Rəbbindən qorunma istəyirik.',
    en_desc:'We seek refuge in the Lord of mankind.',
    ru:'Просим защиты у Господа людей.',
    ar_desc:'نستعيذ برب الناس.',
    tr:'İnsanların Rabbine sığınırız.' },
  { num:108, name:'الكوثر', en:'Al-Kawthar', emoji:'💧', ayahs:3,
    az:'Quranın ən qısa surəsi. Cənnətdəki Kövsər hovuzundan bəhs edir.',
    en_desc:'The shortest surah. About the river Kawthar in Paradise.',
    ru:'Самая короткая сура. О райском источнике Каусар.',
    ar_desc:'أقصر سورة في القرآن. عن نهر الكوثر في الجنة.',
    tr:'Kuran\'ın en kısa suresi. Cennetteki Kevser havuzundan bahseder.' },
  { num:103, name:'العصر', en:'Al-Asr', emoji:'⏳', ayahs:3,
    az:'Zamana and içən surə. İnsanın ziyana düşəcəyini xəbər verir.',
    en_desc:'Surah about time. Warns that mankind is in loss.',
    ru:'Сура о времени. Предупреждает, что человек в убытке.',
    ar_desc:'سورة عن الزمن. تحذر أن الإنسان في خسر.',
    tr:'Zamana yemin eden sure. İnsanın hüsranda olduğunu bildirir.' },
  { num:105, name:'الفيل', en:'Al-Fil', emoji:'🐘', ayahs:5,
    az:'Fil əshabı hekayəsi. Allah Kəbəni qorudu.',
    en_desc:'Story of the Elephant Army. Allah protected the Kaaba.',
    ru:'История армии слонов. Аллах защитил Каабу.',
    ar_desc:'قصة أصحاب الفيل. حمى الله الكعبة.',
    tr:'Fil ordusu kıssası. Allah Kabe\'yi korudu.' },
  { num:106, name:'قريش', en:'Quraysh', emoji:'🐪', ayahs:4,
    az:'Qüreyş qəbiləsi haqqında. Allahın nemətlərini xatırladır.',
    en_desc:'About the tribe of Quraysh. Reminds of Allah\'s blessings.',
    ru:'О племени Курайш. Напоминает о милостях Аллаха.',
    ar_desc:'عن قبيلة قريش. تذكر بنعم الله.',
    tr:'Kureyş kabilesi hakkında. Allah\'ın nimetlerini hatırlatır.' },
  { num:107, name:'الماعون', en:'Al-Maun', emoji:'🤲', ayahs:7,
    az:'Yetimə və kasıba kömək etməyi öyrədir.',
    en_desc:'Teaches to help orphans and the needy.',
    ru:'Учит помогать сиротам и нуждающимся.',
    ar_desc:'تعلم مساعدة اليتامى والمحتاجين.',
    tr:'Yetimlere ve ihtiyaç sahiplerine yardım etmeyi öğretir.' },
  { num:111, name:'المسد', en:'Al-Masad', emoji:'🔥', ayahs:5,
    az:'Əbu Ləhəb haqqında. Pis əməllərin nəticəsi.',
    en_desc:'About Abu Lahab. The consequence of evil deeds.',
    ru:'Об Абу Лахабе. Последствия злых деяний.',
    ar_desc:'عن أبي لهب. عاقبة الأعمال السيئة.',
    tr:'Ebu Leheb hakkında. Kötü amellerin sonucu.' },
  { num:110, name:'النصر', en:'An-Nasr', emoji:'🏆', ayahs:3,
    az:'Allahın köməyi və zəfər haqqında.',
    en_desc:'About Allah\'s help and victory.',
    ru:'О помощи Аллаха и победе.',
    ar_desc:'عن نصر الله والفتح.',
    tr:'Allah\'ın yardımı ve zafer hakkında.' },
  { num:109, name:'الكافرون', en:'Al-Kafirun', emoji:'🚫', ayahs:6,
    az:'Şirkdən uzaq olmaq (bəraət) haqqında. "Sizin dininiz sizə, mənim dinim mənə."',
    en_desc:'About disowning shirk (idolatry). "To you your religion, to me mine."',
    ru:'Об отречении от многобожия. "Вам ваша вера, а мне моя."',
    ar_desc:'سورة البراءة من الشرك. "لكم دينكم ولي دين."',
    tr:'Şirkten uzak durmak (beraat) hakkında. "Sizin dininiz size, benim dinim bana."' },
  { num:95, name:'التين', en:'At-Tin', emoji:'🫒', ayahs:8,
    az:'Əncir və zeytuna and içir. İnsanın ən gözəl şəkildə yaradıldığını bildirir.',
    en_desc:'Swears by the fig and olive. States man was created in the best form.',
    ru:'Клянётся инжиром и оливой. Человек создан в лучшей форме.',
    ar_desc:'يقسم بالتين والزيتون. خلق الإنسان في أحسن تقويم.',
    tr:'İncir ve zeytine yemin eder. İnsanın en güzel şekilde yaratıldığını bildirir.' },
  { num:93, name:'الضحى', en:'Ad-Duha', emoji:'🌅', ayahs:11,
    az:'Peyğəmbəri təsəlli edən surə. Allah səni tərk etmədi.',
    en_desc:'Comforts the Prophet. Allah has not abandoned you.',
    ru:'Утешает Пророка. Аллах не покинул тебя.',
    ar_desc:'تطمئن النبي. ما ودعك ربك وما قلى.',
    tr:'Peygamberi teselli eden sure. Allah seni terk etmedi.' },
  { num:97, name:'القدر', en:'Al-Qadr', emoji:'✨', ayahs:5,
    az:'Qədr gecəsi haqqında. Min aydan xeyirlidir.',
    en_desc:'About the Night of Power. Better than a thousand months.',
    ru:'О Ночи Предопределения. Лучше тысячи месяцев.',
    ar_desc:'عن ليلة القدر. خير من ألف شهر.',
    tr:'Kadir gecesi hakkında. Bin aydan daha hayırlıdır.' },
]

// Gündəlik dualar, hekayələr, iman rüknləri, davranışlar oyunu və valideyn guşəsi —
// src/data/pageGuides/KidsPage.js (hər birinin mənbəyi ilə)

const PILLARS = [
  { emoji:'☝️', az:'Şəhadət — Allahdan başqa ibadətə layiq heç kim olmadığına və Muhəmmədin ﷺ Allahın elçisi olduğuna şahidlik etmək', en:'Shahada — Testifying that none deserves worship except Allah and that Muhammad ﷺ is His Messenger', ru:'Шахада — Свидетельствовать, что нет достойного поклонения, кроме Аллаха, и что Мухаммад ﷺ — Его посланник', ar:'الشهادة — شهادة أن لا إله إلا الله وأن محمدًا رسول الله', tr:'Şehadet — Allah\'tan başka ibadete layık kimse olmadığına ve Muhammed\'in ﷺ O\'nun elçisi olduğuna şahitlik etmek' },
  { emoji:'🕌', az:'Namaz — Gündə 5 dəfə namaz qılmaq', en:'Salah — Praying 5 times a day', ru:'Салят — Молиться 5 раз в день', ar:'الصلاة — خمس صلوات في اليوم', tr:'Namaz — Günde 5 vakit namaz kılmak' },
  { emoji:'🌙', az:'Oruc — Ramazanda oruc tutmaq', en:'Sawm — Fasting in Ramadan', ru:'Саум — Поститься в Рамадан', ar:'الصيام — صيام رمضان', tr:'Oruç — Ramazanda oruç tutmak' },
  { emoji:'💰', az:'Zəkat — Kasıblara kömək etmək', en:'Zakat — Helping the poor', ru:'Закят — Помогать бедным', ar:'الزكاة — مساعدة الفقراء', tr:'Zekat — Fakirlere yardım etmek' },
  { emoji:'🕋', az:'Həcc — Məkkəyə ziyarət', en:'Hajj — Pilgrimage to Makkah', ru:'Хадж — Паломничество в Мекку', ar:'الحج — زيارة مكة المكرمة', tr:'Hac — Mekke\'ye ziyaret' },
]

const QUIZ = [
  {
    az_q:'Quranın neçə surəsi var?', en_q:'How many surahs are in the Quran?', ru_q:'Сколько сур в Коране?', ar_q:'كم عدد سور القرآن؟', tr_q:'Kuran\'da kaç sure var?',
    options:['66','114','100','99'], answer:1
  },
  {
    az_q:'Gündə neçə dəfə namaz qılınır?', en_q:'How many times a day do Muslims pray?', ru_q:'Сколько раз в день молятся мусульмане?', ar_q:'كم مرة يصلي المسلم في اليوم؟', tr_q:'Müslümanlar günde kaç vakit namaz kılar?',
    options:['3','4','5','7'], answer:2
  },
  {
    az_q:'Peyğəmbər ﷺ Allahın neçə adını sayıb-əzbərləyənin Cənnətə girəcəyini bildirib?', en_q:'The Prophet ﷺ said whoever learns how many Names of Allah will enter Paradise?', ru_q:'Пророк ﷺ сказал, что тот, кто выучит сколько имён Аллаха, войдёт в Рай?', ar_q:'كم اسمًا لله أخبر النبي ﷺ أن من أحصاها دخل الجنة؟', tr_q:'Peygamber ﷺ Allah\'ın kaç ismini ezberleyenin Cennete gireceğini bildirdi?',
    options:['50','77','99','114'], answer:2
  },
  {
    az_q:'Hansı ay oruc tutulur?', en_q:'In which month do Muslims fast?', ru_q:'В каком месяце постятся мусульмане?', ar_q:'في أي شهر يصوم المسلمون؟', tr_q:'Hangi ayda oruç tutulur?',
    options:['Şəvval','Ramazan','Muharram','Rəcəb'],
    en_options:['Shawwal','Ramadan','Muharram','Rajab'],
    ru_options:['Шавваль','Рамадан','Мухаррам','Раджаб'],
    ar_options:['شوال','رمضان','محرم','رجب'],
    tr_options:['Şevval','Ramazan','Muharrem','Recep'],
    answer:1
  },
  {
    az_q:'Quranın ən qısa surəsi hansıdır?', en_q:'What is the shortest surah?', ru_q:'Какая самая короткая сура?', ar_q:'ما هي أقصر سورة؟', tr_q:'En kısa sure hangisidir?',
    options:['İxlas','Nas','Kövsər','Fil'],
    en_options:['Al-Ikhlas','An-Nas','Al-Kawthar','Al-Fil'],
    ru_options:['Аль-Ихлас','Ан-Нас','Аль-Каусар','Аль-Филь'],
    ar_options:['الإخلاص','الناس','الكوثر','الفيل'],
    tr_options:['İhlas','Nas','Kevser','Fil'],
    answer:2
  },
  {
    az_q:'İlk nazil olan söz hansıdır?', en_q:'What was the first word revealed?', ru_q:'Какое первое слово было ниспослано?', ar_q:'ما هي أول كلمة نزلت؟', tr_q:'İlk inen kelime nedir?',
    options:['İqra','Bismillah','Əlhəmd','Qul'],
    en_options:['Iqra (Read)','Bismillah','Alhamd','Qul'],
    ru_options:['Икра (Читай)','Бисмиллях','Альхамд','Куль'],
    ar_options:['اقرأ','بسم الله','الحمد','قل'],
    tr_options:['İkra (Oku)','Bismillah','Elhamd','Kul'],
    answer:0
  },
  {
    az_q:'Kəbə hansı şəhərdədir?', en_q:'In which city is the Kaaba?', ru_q:'В каком городе находится Кааба?', ar_q:'في أي مدينة تقع الكعبة؟', tr_q:'Kabe hangi şehirdedir?',
    options:['Mədinə','Məkkə','Qüds','İstanbul'],
    en_options:['Madinah','Makkah','Jerusalem','Istanbul'],
    ru_options:['Медина','Мекка','Иерусалим','Стамбул'],
    ar_options:['المدينة','مكة','القدس','إسطنبول'],
    tr_options:['Medine','Mekke','Kudüs','İstanbul'],
    answer:1
  },
  {
    az_q:'Kəbəni hansı peyğəmbər tikdi?', en_q:'Which prophet built the Kaaba?', ru_q:'Какой пророк построил Каабу?', ar_q:'أي نبي بنى الكعبة؟', tr_q:'Kabe\'yi hangi peygamber inşa etti?',
    options:['Musa','Nuh','İbrahim','İsa'],
    en_options:['Musa','Nuh','Ibrahim','Isa'],
    ru_options:['Муса','Нух','Ибрахим','Иса'],
    ar_options:['موسى','نوح','إبراهيم','عيسى'],
    tr_options:['Musa','Nuh','İbrahim','İsa'],
    answer:2
  },
  {
    az_q:'Qədr gecəsi neçə aydan xeyirlidir?', en_q:'The Night of Power is better than how many months?', ru_q:'Ночь Предопределения лучше скольких месяцев?', ar_q:'ليلة القدر خير من كم شهر؟', tr_q:'Kadir gecesi kaç aydan daha hayırlıdır?',
    options:['100','500','1000','10000'], answer:2
  },
  {
    // Əvvəl "ən qısa surə" sualı iki dəfə soruşulurdu — əvəzinə iman rüknləri
    az_q:'İmanın neçə rüknü var?', en_q:'How many pillars of iman are there?', ru_q:'Сколько столпов у имана?', ar_q:'كم عدد أركان الإيمان؟', tr_q:'İmanın kaç şartı vardır?',
    options:['4','5','6','7'], answer:2
  },
  {
    az_q:'Quran hansı dildə nazil olub?', en_q:'In which language was the Quran revealed?', ru_q:'На каком языке был ниспослан Коран?', ar_q:'بأي لغة نزل القرآن؟', tr_q:'Kuran hangi dilde indirildi?',
    options:['Farsca','Türkcə','Ərəbcə','İbranicə'],
    en_options:['Persian','Turkish','Arabic','Hebrew'],
    ru_options:['Персидский','Турецкий','Арабский','Иврит'],
    ar_options:['الفارسية','التركية','العربية','العبرية'],
    tr_options:['Farsça','Türkçe','Arapça','İbranice'],
    answer:2
  },
  {
    az_q:'Müsəlmanlar hansı istiqamətə namaz qılır?', en_q:'In which direction do Muslims pray?', ru_q:'В каком направлении молятся мусульмане?', ar_q:'في أي اتجاه يصلي المسلمون؟', tr_q:'Müslümanlar hangi yöne doğru namaz kılar?',
    options:['Şərq','Qərb','Qiblə (Kəbə)','Şimal'],
    en_options:['East','West','Qibla (Kaaba)','North'],
    ru_options:['Восток','Запад','Кибла (Кааба)','Север'],
    ar_options:['الشرق','الغرب','القبلة (الكعبة)','الشمال'],
    tr_options:['Doğu','Batı','Kıble (Kabe)','Kuzey'],
    answer:2
  },
  {
    az_q:'Həcc hansı ayda yerinə yetirilir?', en_q:'In which month is Hajj performed?', ru_q:'В каком месяце совершается Хадж?', ar_q:'في أي شهر يؤدى الحج؟', tr_q:'Hac hangi ayda yapılır?',
    options:['Ramazan','Zilhiccə','Muharram','Şəban'],
    en_options:['Ramadan','Dhul Hijjah','Muharram','Shaban'],
    ru_options:['Рамадан','Зуль-Хиджа','Мухаррам','Шаабан'],
    ar_options:['رمضان','ذو الحجة','محرم','شعبان'],
    tr_options:['Ramazan','Zilhicce','Muharrem','Şaban'],
    answer:1
  },
  {
    az_q:'Müsəlmanların müqəddəs kitabının adı nədir?', en_q:'What is the name of the Muslim holy book?', ru_q:'Как называется священная книга мусульман?', ar_q:'ما اسم الكتاب المقدس للمسلمين؟', tr_q:'Müslümanların kutsal kitabının adı nedir?',
    options:['Tövrat','İncil','Quran','Zəbur'],
    en_options:['Torah','Bible','Quran','Psalms'],
    ru_options:['Тора','Библия','Коран','Псалмы'],
    ar_options:['التوراة','الإنجيل','القرآن','الزبور'],
    tr_options:['Tevrat','İncil','Kuran','Zebur'],
    answer:2
  },
  {
    az_q:'Muhəmməd ﷺ kimdir?', en_q:'Who is Muhammad ﷺ?', ru_q:'Кто такой Мухаммад ﷺ?', ar_q:'من هو محمد ﷺ؟', tr_q:'Muhammed ﷺ kimdir?',
    options:['Səhabə','Son peyğəmbər','Melek','Xəlifə'],
    en_options:['A companion','The last prophet','An angel','A caliph'],
    ru_options:['Сподвижник','Последний пророк','Ангел','Халиф'],
    ar_options:['صحابي','آخر الأنبياء','ملك','خليفة'],
    tr_options:['Sahabe','Son peygamber','Melek','Halife'],
    answer:1
  },
  {
    az_q:'İslamın neçə şərti var?', en_q:'How many pillars does Islam have?', ru_q:'Сколько столпов в Исламе?', ar_q:'كم عدد أركان الإسلام؟', tr_q:'İslam\'ın kaç şartı vardır?',
    options:['3','4','5','7'], answer:2
  },
  {
    az_q:'Quran neçə cüzdən ibarətdir?', en_q:'How many Juz (parts) are in the Quran?', ru_q:'Сколько джузов (частей) в Коране?', ar_q:'كم عدد أجزاء القرآن؟', tr_q:'Kuran kaç cüzden oluşur?',
    options:['20','25','30','40'], answer:2
  },
  {
    az_q:'Hansı peyğəmbər balığın qarnında qaldı?', en_q:'Which prophet was in the belly of a big fish?', ru_q:'Какой пророк был во чреве большой рыбы?', ar_q:'أي نبي بقي في بطن الحوت؟', tr_q:'Hangi peygamber balığın karnında kaldı?',
    options:['İbrahim','Musa','Yunus','Davud'],
    en_options:['Ibrahim','Musa','Yunus','Dawud'],
    ru_options:['Ибрахим','Муса','Юнус','Давуд'],
    ar_options:['إبراهيم','موسى','يونس','داود'],
    tr_options:['İbrahim','Musa','Yunus','Davud'],
    answer:2
  },
  {
    az_q:'Ramazan ayında nə etmək vacibdir?', en_q:'What is obligatory in Ramadan?', ru_q:'Что обязательно в Рамадане?', ar_q:'ماذا يجب في رمضان؟', tr_q:'Ramazanda ne yapmak farzdır?',
    options:['Həcc','Oruc','Zəkat','Qurban'],
    en_options:['Hajj','Fasting','Zakat','Sacrifice'],
    ru_options:['Хадж','Пост','Закят','Жертвоприношение'],
    ar_options:['الحج','الصيام','الزكاة','الأضحية'],
    tr_options:['Hac','Oruç','Zekat','Kurban'],
    answer:1
  },
  {
    az_q:'Cənnət nədir?', en_q:'What is Jannah?', ru_q:'Что такое Джаннат?', ar_q:'ما هي الجنة؟', tr_q:'Cennet nedir?',
    options:['Şəhər','Dağ','Cənnət bağı','Kitab'],
    en_options:['A city','A mountain','Paradise','A book'],
    ru_options:['Город','Гора','Рай','Книга'],
    ar_options:['مدينة','جبل','الجنة','كتاب'],
    tr_options:['Şehir','Dağ','Cennet bahçesi','Kitap'],
    answer:2
  },
]

const PROPHETS_FOR_KIDS = [
  { name:'Adam', ar:'آدم', emoji:'🌿', az:'İlk insan və ilk peyğəmbər', en:'First human and first prophet', ru:'Первый человек и первый пророк', ar_desc:'أول إنسان وأول نبي', tr:'İlk insan ve ilk peygamber' },
  { name:'Nuh', ar:'نوح', emoji:'🚢', az:'Böyük gəmini tikən peyğəmbər', en:'The prophet who built the great ark', ru:'Пророк, построивший великий ковчег', ar_desc:'النبي الذي بنى السفينة العظيمة', tr:'Büyük gemiyi yapan peygamber' },
  { name:'Ibrahim', ar:'إبراهيم', emoji:'🕋', az:'Kəbəni tikən peyğəmbər', en:'The prophet who built the Kaaba', ru:'Пророк, построивший Каабу', ar_desc:'النبي الذي بنى الكعبة', tr:'Kabe\'yi inşa eden peygamber' },
  { name:'Ismail', ar:'إسماعيل', emoji:'💧', az:'İbrahimin oğlu, Kəbəni tikməyə kömək etdi', en:'Son of Ibrahim, helped build the Kaaba', ru:'Сын Ибрахима, помогал строить Каабу', ar_desc:'ابن إبراهيم، ساعد في بناء الكعبة', tr:'İbrahim\'in oğlu, Kabe\'yi inşa etmeye yardım etti' },
  { name:'Musa', ar:'موسى', emoji:'🌊', az:'Dənizi yaran peyğəmbər', en:'The prophet who parted the sea', ru:'Пророк, раздвинувший море', ar_desc:'النبي الذي شق البحر', tr:'Denizi yaran peygamber' },
  { name:'Dawud', ar:'داود', emoji:'🎵', az:'Gözəl səsi olan peyğəmbər, Zəbur verildi', en:'The prophet with a beautiful voice, given the Psalms', ru:'Пророк с прекрасным голосом, ему даны Псалмы', ar_desc:'النبي ذو الصوت الجميل، أنزل عليه الزبور', tr:'Güzel sesli peygamber, Zebur verildi' },
  { name:'Sulayman', ar:'سليمان', emoji:'🐜', az:'Quşların dilini anlayan peyğəmbər', en:'The prophet taught the language of birds', ru:'Пророк, обученный языку птиц', ar_desc:'النبي الذي عُلِّم منطق الطير', tr:'Kuşların dilini anlayan peygamber' },
  { name:'Yunus', ar:'يونس', emoji:'🐋', az:'Balığın qarnında qalan peyğəmbər', en:'The prophet who was in the belly of a big fish', ru:'Пророк, который был во чреве большой рыбы', ar_desc:'النبي الذي بقي في بطن الحوت', tr:'Balığın karnında kalan peygamber' },
  { name:'Isa', ar:'عيسى', emoji:'✨', az:'Möcüzələrlə göndərilən peyğəmbər, İncil verildi', en:'The prophet sent with miracles, given the Gospel', ru:'Пророк, посланный с чудесами, ему дано Евангелие', ar_desc:'النبي المرسل بالمعجزات، أنزل عليه الإنجيل', tr:'Mucizelerle gönderilen peygamber, İncil verildi' },
  { name:'Muhammad ﷺ', ar:'محمد ﷺ', emoji:'🌙', az:'Son peyğəmbər, Quran verildi', en:'The last prophet, given the Quran', ru:'Последний пророк, ему дан Коран', ar_desc:'آخر الأنبياء، أنزل عليه القرآن', tr:'Son peygamber, Kuran verildi' },
]

export default function KidsPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(LABELS, lang)
  const k = pickUi(KX, lang)
  const navigate = useNavigate()

  const [openSection, setOpenSection] = useState('names')
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizState, setQuizState] = useState(null) // null, 'correct', 'wrong'
  const [score, setScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [picked, setPicked] = useState(null) // seçilən variant (səhvi göstərmək üçün)
  // Gözəl davranışlar oyunu — bu gün işarələnənlər
  const [mannersDone, setMannersDone] = useState(loadManners)
  useEffect(() => {
    try { localStorage.setItem(MANNERS_KEY, JSON.stringify({ date: todayKey(), done: mannersDone })) } catch { /* yaddaş bağlıdır */ }
  }, [mannersDone])
  const toggleManner = (id) => {
    haptic(8)
    setMannersDone(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }

  const layoutRef = useRef(null)
  const tabsRef = useRef(null)

  // Bölmə seçimi (sekmə kimi — aktiv sekməyə yenidən basmaq məzmunu bağlamır).
  // Uzun siyahını (99 ad) aşağı sürüşdürüb başqa bölməyə keçəndə yeni
  // bölmə əvvəlindən görünsün; telefonda aktiv sekmə zolağın ortasına gəlsin.
  const toggleSection = (s, tabEl) => {
    setOpenSection(s)
    let behavior = 'smooth'
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) behavior = 'auto' } catch {}
    requestAnimationFrame(() => {
      const strip = tabsRef.current
      if (strip && tabEl && strip.scrollWidth > strip.clientWidth) {
        const sr = strip.getBoundingClientRect()
        const tr = tabEl.getBoundingClientRect()
        strip.scrollBy({ left: (tr.left + tr.width / 2) - (sr.left + sr.width / 2), behavior })
      }
      const layout = layoutRef.current
      if (!layout) return
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64
      const target = layout.getBoundingClientRect().top + window.scrollY - headerH
      if (window.scrollY > target + 1) window.scrollTo({ top: target, behavior })
    })
  }

  const getQuizQ = (q) => q[`${lang}_q`] || q.az_q
  const getQuizOpts = (q) => q[`${lang}_options`] || q.options

  const handleQuizAnswer = (idx) => {
    if (quizState) return
    const q = QUIZ[quizIdx]
    // Toxunma ekranında yüngül titrəmə (səhvdə bir az uzun)
    haptic(idx === q.answer ? 8 : 18)
    setPicked(idx)
    if (idx === q.answer) {
      setQuizState('correct')
      setScore(s => s + 1)
    } else {
      setQuizState('wrong')
    }
  }

  const nextQuiz = () => {
    if (quizIdx + 1 >= QUIZ.length) {
      setQuizDone(true)
    } else {
      setQuizIdx(i => i + 1)
      setQuizState(null)
      setPicked(null)
    }
  }

  const resetQuiz = () => {
    setQuizIdx(0)
    setQuizState(null)
    setPicked(null)
    setScore(0)
    setQuizDone(false)
  }

  // Bölmələr — ikonlar Icon.jsx-dən (əvvəl emoji idi)
  const sections = [
    { key:'names', icon:'names', title:t.namesTitle },
    { key:'surahs', icon:'quran', title:t.surahsTitle },
    { key:'duas', icon:'duas', title:t.duasTitle },
    { key:'rules', icon:'holyplaces', title:t.rulesTitle },
    { key:'stories', icon:'books', title:t.storiesTitle },
    { key:'prophets', icon:'history', title:t.prophetsTitle },
    { key:'manners', icon:'donate', title:t.mannersTitle },
    { key:'quiz', icon:'quiz', title:t.quizTitle },
    { key:'parents', icon:'jamaat', title:t.parentsTitle },
  ]
  // Ayə istinadı → Quran səhifəsindəki surəyə keçid ("2:30-37")
  const ayahLink = (ref) => {
    const n = Number(String(ref).split(':')[0])
    return <a key={ref} href={pathFor('quran', lang, n)} className="kids-ref ui-num" dir="ltr">{ref}</a>
  }
  // Dərsə keçid — həqiqi <a href>, adi klikdə SPA ilə (LessonsPage ilə eyni)
  const learnHref = (slug) => pathFor('learn', lang, slug)
  const openLesson = (e, slug) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(learnHref(slug))
    window.scrollTo(0, 0)
  }
  const current = sections.find(s => s.key === openSection) || sections[0]
  // Ayə sözü — rus dilində say ilə uzlaşır (əvvəl həmişə 'аятов': '4 аятов')
  const ayahWord = (n) => lang === 'ar' ? 'آية' : lang === 'tr' ? 'ayet' : lang === 'en' ? 'ayahs' : lang === 'ru'
    ? (n % 10 === 1 && n % 100 !== 11 ? 'аят' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'аята' : 'аятов')
    : 'ayə'
  const q = QUIZ[quizIdx]

  // Bölmə başlığı: ikon kafeli + h2 (əvvəl başlığın sonunda emoji var idi)
  const SectionTitle = () => (
    <div className="kids-section-head">
      <span className="ui-icon-tile kids-section-icon" aria-hidden="true"><Icon name={current.icon} /></span>
      <div className="kids-section-titles">
        <h2 className="ui-title ui-title--sm kids-section-title">{current.title}</h2>
        {k.leads[current.key] && <p className="kids-section-lead">{k.leads[current.key]}</p>}
      </div>
    </div>
  )

  return (
    <>
      {/* Sakit kağız hero (dizayn v2); sonda dekorativ ikon kafelləri
          (əvvəl "🌙 ⭐ 🕌 📖 🤲" emoji sətri idi) */}
      <header className="ui-page-hero ui-page-hero--split kids-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{t.subtitle}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{k.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {k.how}</p>
            <ul className="ui-page-hero__stats">
              <li><b data-count={NAMES_OF_ALLAH.length}>{NAMES_OF_ALLAH.length}</b><span>{k.names}</span></li>
              <li><b data-count={SHORT_SURAHS.length}>{SHORT_SURAHS.length}</b><span>{k.surahs}</span></li>
              <li><b data-count={KIDS_DUAS.length}>{KIDS_DUAS.length}</b><span>{k.duas}</span></li>
              <li><b data-count={STORIES.length}>{STORIES.length}</b><span>{k.stories}</span></li>
            </ul>
          </div>
          {/* Sağda: bu günün "ulduzları" — gözəl davranışlar oyununun halqası */}
          <div className="ui-page-hero__aside">
            <div className="ui-card kids-stars">
              <ProgressRing value={mannersDone.length} max={MANNERS.length} size={84} thickness={8} tone={2}
                label={k.todayStars} sub={<bdi dir="ltr">{mannersDone.length} / {MANNERS.length}</bdi>} />
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => toggleSection('manners', null)}>
                <Icon name="star" className="ui-btn__icon" /> {k.openManners}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="section kids-section-wrap">
        <div className="section-inner kids-layout" ref={layoutRef}>

          {/* Bölmə sekmələri — telefonda üfüqi sürüşən, başlığın altına yapışan zolaq */}
          {/* v6: aktiv sekmənin yaşıl "hapı" yayla (bouncy) yeni sekməyə sıçrayır — layoutId, domMax tənbəl */}
          <LayoutFeatures>
          <div className="kids-tabs" ref={tabsRef} role="group" aria-label={t.learn}>
            {sections.map(s => (
              <button key={s.key}
                type="button"
                className={`kids-tab kids-tab--mo ${openSection===s.key?'active':''}`}
                aria-pressed={openSection===s.key}
                onClick={(e) => toggleSection(s.key, e.currentTarget)}>
                {openSection === s.key && <m.span layoutId="kids-tab-pill" className="kids-tab-pill" transition={SPRING.bouncy} aria-hidden="true" />}
                <span className="kids-tab-icon" aria-hidden="true"><Icon name={s.icon} size={18} /></span>
                <span className="kids-tab-label">{s.title}</span>
              </button>
            ))}
          </div>
          </LayoutFeatures>

          {/* Allahın gözəl adları — nömrə xatəm ulduzunda */}
          {openSection === 'names' && (
            <section className="kids-section" key="names">
              <SectionTitle />
              <div className="kids-names-grid" data-reveal="stagger-zoom">
                {NAMES_OF_ALLAH.map((n, i) => (
                  <div key={i} className="kids-name-card">
                    <span className="kids-star-num ui-num" aria-hidden="true">{i + 1}</span>
                    <span className="kids-name-arabic" lang="ar">{n.ar}</span>
                    <span className="kids-name-desc">
                      {lang === 'ar' ? n.ar_desc : lang === 'en' ? n.en : lang === 'ru' ? n.ru : lang === 'tr' ? n.tr : n.az}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Qısa surələr */}
          {openSection === 'surahs' && (
            <section className="kids-section" key="surahs">
              <SectionTitle />
              <div className="kids-surahs-list" data-reveal="stagger">
                {SHORT_SURAHS.map((s, i) => (
                  <div key={i} className="kids-surah-card">
                    <div className="kids-surah-header">
                      <span className="kids-star-num ui-num" aria-hidden="true">{s.num}</span>
                      <span className="kids-surah-titles">
                        {lang !== 'ar' && <span className="kids-surah-en">{s.en}</span>}
                        <span className="kids-surah-arabic" lang="ar">{s.name}</span>
                      </span>
                      <span className="ui-badge kids-surah-ayahs ui-num">{s.ayahs} {ayahWord(s.ayahs)}</span>
                    </div>
                    <p className="kids-surah-desc">
                      {lang === 'ar' ? s.ar_desc : lang === 'en' ? s.en_desc : lang === 'ru' ? s.ru : lang === 'tr' ? s.tr : s.az}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gündəlik dualar */}
          {openSection === 'duas' && (
            <section className="kids-section" key="duas">
              <SectionTitle />
              <div className="kids-duas-list" data-reveal="stagger">
                {KIDS_DUAS.map((d, i) => (
                  <div key={i} className="kids-dua-card">
                    <span className="ui-icon-tile ui-icon-tile--accent kids-dua-icon" aria-hidden="true"><Icon name={d.icon || 'duas'} /></span>
                    <div className="kids-dua-body">
                      <h3 className="kids-dua-title">{pick(d.title, lang)}</h3>
                      <div className="kids-dua-arabic" lang="ar" dir="rtl">{d.ar}</div>
                      <p className="kids-dua-meaning">{pick(d.text, lang)}</p>
                      <p className="kids-dua-src">
                        {t.source}: <cite>{pick(d.src, lang)}</cite>
                        {d.grade && <> · {t.grade}: {pick(d.grade, lang)}</>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <PageLink to="hisn" setPage={setPage} className="ui-link kids-more-link">
                {t.moreDuas} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
              </PageLink>
            </section>
          )}

          {/* İslamın 5 və imanın 6 rüknü */}
          {openSection === 'rules' && (
            <section className="kids-section" key="rules">
              <SectionTitle />
              <h3 className="kids-sub-title">{t.islamPillars}</h3>
              <ol className="kids-pillars-list" data-reveal="stagger">
                {PILLARS.map((p, i) => (
                  <li key={i} className="kids-pillar-card">
                    <span className="kids-pillar-num ui-num" aria-hidden="true">{i + 1}</span>
                    <span className="kids-pillar-icon" aria-hidden="true"><Icon name={PILLAR_ICONS[i] || 'names'} /></span>
                    <span className="kids-pillar-text">{pickUi(p, lang)}</span>
                  </li>
                ))}
              </ol>
              <p className="kids-src-line">{t.source}: <cite>{pick(PILLARS_SOURCES.islam, lang)}</cite></p>

              <h3 className="kids-sub-title">{t.imanPillars}</h3>
              <ol className="kids-iman-grid" data-reveal="stagger">
                {IMAN_PILLARS.map((p, i) => (
                  <li key={i} className="ui-card kids-iman-card">
                    <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={p.icon} /></span>
                    <span className="kids-iman-body">
                      <strong className="kids-iman-title"><span className="ui-num">{i + 1}.</span> {pick(p.title, lang)}</strong>
                      <span className="kids-iman-text">{pick(p.text, lang)}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="kids-src-line">
                {t.source}: <cite>{pick(PILLARS_SOURCES.iman, lang)}</cite> ·{' '}
                <PageLink to="nawawi40" setPage={setPage} className="ui-link">{t.seeAlso}: {lang === 'ar' ? 'الأربعون النووية ٢' : lang === 'ru' ? '40 хадисов, № 2' : lang === 'tr' ? '40 Hadis, 2' : lang === 'en' ? '40 Hadith, No. 2' : '40 hədis, 2'}</PageLink>
              </p>
            </section>
          )}

          {/* Peyğəmbərlər */}
          {/* Peyğəmbər hekayələri — yalnız Qurandan */}
          {openSection === 'stories' && (
            <section className="kids-section" key="stories">
              <SectionTitle />
              <p className="kids-lead">{t.storiesNote}</p>
              <div className="kids-stories" data-reveal="stagger">
                {STORIES.map((st, i) => (
                  <article key={i} className="ui-card kids-story">
                    <header className="kids-story-head">
                      <span className="kids-name-arabic kids-story-ar" lang="ar" dir="rtl">{st.ar}</span>
                      <span>
                        {lang !== 'ar' && <span className="kids-story-name">{pick(st.name, lang)}</span>}
                        <h3 className="kids-story-title">{pick(st.title, lang)}</h3>
                      </span>
                    </header>
                    <p className="kids-story-text">{pick(st.text, lang)}</p>
                    <p className="kids-story-lesson">
                      <Icon name="bulb" size={18} />
                      <span>{pick(st.lesson, lang)}</span>
                    </p>
                    <p className="kids-src-line">
                      {lang === 'ar' ? 'القرآن' : lang === 'ru' ? 'Коран' : lang === 'tr' ? 'Kur’an' : 'Quran'}: {st.refs.map((r, k) => <span key={r}>{k > 0 && ', '}{ayahLink(r)}</span>)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {openSection === 'prophets' && (
            <section className="kids-section" key="prophets">
              <SectionTitle />
              <div className="kids-names-grid" data-reveal="stagger-zoom">
                {PROPHETS_FOR_KIDS.map((p, i) => (
                  <div key={i} className="kids-name-card">
                    <span className="kids-star-num ui-num" aria-hidden="true">{i + 1}</span>
                    <span className="kids-name-arabic" lang="ar">{p.ar}</span>
                    {lang !== 'ar' && <span className="kids-name-title">{p.name}</span>}
                    <span className="kids-name-desc">
                      {lang === 'ar' ? p.ar_desc : lang === 'en' ? p.en : lang === 'ru' ? p.ru : lang === 'tr' ? p.tr : p.az}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gözəl davranışlar */}
          {openSection === 'manners' && (
            <section className="kids-section" key="manners">
              <SectionTitle />
              <p className="kids-lead">{t.mannersLead}</p>
              <div className="ui-card kids-mgame-top">
                <ProgressRing value={mannersDone.length} max={MANNERS.length} size={56} thickness={6} tone={2}
                  label={t.mannersDone} sub={<bdi dir="ltr">{mannersDone.length} / {MANNERS.length}</bdi>} />
                {mannersDone.length > 0 && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setMannersDone([])}>
                    <Icon name="refresh" className="ui-btn__icon" /> {t.mannersReset}
                  </button>
                )}
              </div>
              {mannersDone.length === MANNERS.length && (
                <p className="kids-mgame-all" role="status"><Icon name="sparkle" size={18} /> {t.mannersAll}</p>
              )}
              <ul className="kids-mgame-list">
                {MANNERS.map(m => {
                  const on = mannersDone.includes(m.id)
                  return (
                    <li key={m.id}>
                      <button type="button" className={`kids-mgame-item${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleManner(m.id)}>
                        <span className="kids-mgame-check" aria-hidden="true"><Icon name={on ? 'check' : m.icon} size={18} /></span>
                        <span className="kids-mgame-body">
                          <span className="kids-mgame-text">{pick(m.text, lang)}</span>
                          <span className="kids-mgame-why">{pick(m.why, lang)} <cite className="kids-mgame-src">({pick(m.src, lang)})</cite></span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Mini kviz */}
          {openSection === 'quiz' && (
            <section className="kids-section" key="quiz">
              <SectionTitle />
              {quizDone ? (
                <div className="kids-quiz-done">
                  <div className="kids-quiz-ring">
                    <ProgressRing value={score} max={QUIZ.length} size={112} thickness={10} showPercent={false} tone={2} />
                    <div className="kids-quiz-result ui-num"><bdi dir="ltr">{score} / {QUIZ.length}</bdi></div>
                  </div>
                  <p className="kids-quiz-msg">
                    {score === QUIZ.length
                      ? (t.correct)
                      : (lang === 'az' ? 'Yaxşı cəhd!' : lang === 'en' ? 'Good try!' : lang === 'ru' ? 'Хорошая попытка!' : lang === 'ar' ? 'محاولة جيدة!' : 'İyi deneme!')}
                  </p>
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--lg kids-quiz-restart" onClick={resetQuiz}>
                    <Icon name="refresh" className="ui-btn__icon" />
                    {lang === 'az' ? 'Yenidən başla' : lang === 'en' ? 'Play again' : lang === 'ru' ? 'Играть снова' : lang === 'ar' ? 'العب مرة أخرى' : 'Tekrar oyna'}
                  </button>
                </div>
              ) : (
                <PresenceSwap swapKey={quizIdx} variant="slide" className="kids-quiz-box kids-quiz-box--mo">
                  <div className="kids-quiz-top">
                    <span className="kids-quiz-progress ui-num" dir="ltr">{quizIdx + 1} / {QUIZ.length}</span>
                    <span className="kids-quiz-score ui-num"><Icon name="star" size={16} /><m.span key={score} className="kids-quiz-score__n" initial={score ? { scale: 1.5, y: -4 } : false} animate={{ scale: 1, y: 0, transition: SPRING.bouncy }}>{score}</m.span></span>
                  </div>
                  {/* İrəliləyiş zolağı — transform: scaleX */}
                  <div className="kids-quiz-bar" aria-hidden="true">
                    <span style={{ transform: `scaleX(${(quizIdx + (quizState ? 1 : 0)) / QUIZ.length})` }} />
                  </div>
                  <h3 className="kids-quiz-question">{getQuizQ(q)}</h3>
                  <div className="kids-quiz-options">
                    {getQuizOpts(q).map((opt, i) => {
                      // Səhv seçilən variant da qeyd olunur (əvvəl yalnız düzgün cavab vurğulanırdı)
                      const cls = !quizState ? ''
                        : i === q.answer ? ' correct'
                        : i === picked ? ' wrong'
                        : ' dimmed'
                      return (
                        <button key={i} type="button"
                          className={`kids-quiz-opt${cls}`}
                          style={{ '--i': i }}
                          onClick={() => handleQuizAnswer(i)}
                          disabled={!!quizState}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {quizState && (
                    <div className={`kids-quiz-feedback ${quizState}`} aria-live="polite">
                      <span className="kids-quiz-feedback-msg">
                        <Icon name={quizState === 'correct' ? 'check' : 'refresh'} size={18} strokeWidth={2.2} />
                        {quizState === 'correct' ? t.correct : t.wrong}
                      </span>
                      <button type="button" className="ui-btn ui-btn--primary kids-quiz-next" onClick={nextQuiz}>
                        {t.next} <Icon name="arrow" size={16} className="ui-flip-rtl" />
                      </button>
                    </div>
                  )}
                </PresenceSwap>
              )}
            </section>
          )}

          {/* Valideyn guşəsi — LessonBlocks formatında (ayə, hədis, addımlar) */}
          {openSection === 'parents' && (
            <section className="kids-section kids-parents" key="parents">
              <SectionTitle />
              <p className="kids-lead">{t.parentsLead}</p>
              {PARENTS.sections.map(sec => (
                <section key={sec.id} className="kids-guide-sec" aria-labelledby={`kids-p-${sec.id}`}>
                  <h3 id={`kids-p-${sec.id}`} className="kids-sub-title">{pick(sec.title, lang)}</h3>
                  <LessonBlocks blocks={sec.blocks} lang={lang} />
                </section>
              ))}
              <nav className="kids-guide-links" aria-label={t.seeAlso}>
                <h3 className="kids-sub-title">{t.seeAlso}</h3>
                <ul>
                  {PARENTS.links.map((l, i) => (
                    <li key={i}>
                      {l.learn
                        ? <a className="ui-chip kids-guide-chip" href={learnHref(l.learn)} onClick={(e) => openLesson(e, l.learn)}><Icon name="learn" size={15} /> {pick(l.label, lang)}</a>
                        : <PageLink to={l.to} setPage={setPage} className="ui-chip kids-guide-chip"><Icon name={l.to} size={15} /> {pick(l.label, lang)}</PageLink>}
                    </li>
                  ))}
                </ul>
              </nav>
            </section>
          )}

        </div>
      </div>
    </>
  )
}
