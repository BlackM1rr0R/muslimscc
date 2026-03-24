import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/KidsPage.css'

const LABELS = {
  az: { title:'Uşaq Bölməsi', subtitle:'Kiçiklər üçün İslam', namesTitle:'Allahın Gözəl Adları', surahsTitle:'Qısa Surələr', duasTitle:'Gündəlik Dualar', rulesTitle:'İslamın 5 Şərti', quizTitle:'Mini Kviz', prophetsTitle:'Peyğəmbərlər', mannersTitle:'Gözəl Davranışlar', learn:'Öyrən', correct:'Afərin!', wrong:'Yenidən cəhd et', next:'Növbəti' },
  en: { title:'Kids Section', subtitle:'Islam for little ones', namesTitle:'Beautiful Names of Allah', surahsTitle:'Short Surahs', duasTitle:'Daily Duas', rulesTitle:'5 Pillars of Islam', quizTitle:'Mini Quiz', prophetsTitle:'Prophets', mannersTitle:'Good Manners', learn:'Learn', correct:'Well done!', wrong:'Try again', next:'Next' },
  ru: { title:'Детский раздел', subtitle:'Ислам для малышей', namesTitle:'Прекрасные Имена Аллаха', surahsTitle:'Короткие суры', duasTitle:'Ежедневные дуа', rulesTitle:'5 Столпов Ислама', quizTitle:'Мини-викторина', prophetsTitle:'Пророки', mannersTitle:'Хорошие манеры', learn:'Учи', correct:'Молодец!', wrong:'Попробуй ещё', next:'Далее' },
  ar: { title:'قسم الأطفال', subtitle:'الإسلام للصغار', namesTitle:'أسماء الله الحسنى', surahsTitle:'سور قصيرة', duasTitle:'أدعية يومية', rulesTitle:'أركان الإسلام', quizTitle:'اختبار صغير', prophetsTitle:'الأنبياء', mannersTitle:'الآداب الحسنة', learn:'تعلم', correct:'أحسنت!', wrong:'حاول مرة أخرى', next:'التالي' },
  tr: { title:'Çocuk Bölümü', subtitle:'Küçükler için İslam', namesTitle:'Allah\'ın Güzel İsimleri', surahsTitle:'Kısa Sureler', duasTitle:'Günlük Dualar', rulesTitle:'İslam\'ın 5 Şartı', quizTitle:'Mini Quiz', prophetsTitle:'Peygamberler', mannersTitle:'Güzel Davranışlar', learn:'Öğren', correct:'Aferin!', wrong:'Tekrar dene', next:'Sonraki' },
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
    az:'Din azadlığı haqqında. "Sizin dininiz sizə, mənim dinim mənə."',
    en_desc:'About freedom of religion. "To you your religion, to me mine."',
    ru:'О свободе вероисповедания. "Вам ваша вера, а мне моя."',
    ar_desc:'عن حرية الدين. "لكم دينكم ولي دين."',
    tr:'Din özgürlüğü hakkında. "Sizin dininiz size, benim dinim bana."' },
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

const DAILY_DUAS = [
  { emoji:'🍽️',
    az_title:'Yemək duası', ar:'بِسْمِ اللَّهِ',
    az:'Bismillah — Allahın adı ilə',
    en_title:'Before eating', en_desc:'Bismillah — In the name of Allah',
    ru_title:'Перед едой', ru_desc:'Бисмиллях — Во имя Аллаха',
    ar_title:'دعاء الطعام', ar_desc:'بسم الله',
    tr_title:'Yemek duası', tr_desc:'Bismillah — Allah\'ın adıyla' },
  { emoji:'😴',
    az_title:'Yatmaq duası', ar:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    az:'Allahım, Sənin adınla ölürəm və dirilirəm',
    en_title:'Before sleeping', en_desc:'O Allah, in Your name I die and live',
    ru_title:'Перед сном', ru_desc:'О Аллах, с Твоим именем я умираю и оживаю',
    ar_title:'دعاء النوم', ar_desc:'اللهم باسمك أموت وأحيا',
    tr_title:'Uyku duası', tr_desc:'Allah\'ım, Senin adınla ölür ve dirilirim' },
  { emoji:'☀️',
    az_title:'Oyanma duası', ar:'الحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا',
    az:'Bizi dirildən Allaha həmd olsun',
    en_title:'Waking up', en_desc:'Praise to Allah who gave us life',
    ru_title:'При пробуждении', ru_desc:'Хвала Аллаху, который оживил нас',
    ar_title:'دعاء الاستيقاظ', ar_desc:'الحمد لله الذي أحيانا بعد ما أماتنا',
    tr_title:'Uyanma duası', tr_desc:'Bizi dirilten Allah\'a hamd olsun' },
  { emoji:'🚪',
    az_title:'Evdən çıxma', ar:'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ',
    az:'Allahın adı ilə, Allaha təvəkkül etdim',
    en_title:'Leaving home', en_desc:'In the name of Allah, I put my trust in Allah',
    ru_title:'Выход из дома', ru_desc:'С именем Аллаха, я уповаю на Аллаха',
    ar_title:'دعاء الخروج', ar_desc:'بسم الله توكلت على الله',
    tr_title:'Evden çıkış', tr_desc:'Allah\'ın adıyla, Allah\'a tevekkül ettim' },
  { emoji:'🤧',
    az_title:'Asqıranda', ar:'الحَمْدُ لِلَّهِ',
    az:'Əlhəmdulillah — Allaha həmd olsun',
    en_title:'When sneezing', en_desc:'Alhamdulillah — Praise be to Allah',
    ru_title:'При чихании', ru_desc:'Альхамдулиллях — Хвала Аллаху',
    ar_title:'عند العطس', ar_desc:'الحمد لله',
    tr_title:'Hapşırınca', tr_desc:'Elhamdülillah — Allah\'a hamd olsun' },
  { emoji:'🚿',
    az_title:'Tualetə girəndə', ar:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    az:'Allahım, pis şeylərdən Sənə sığınıram',
    en_title:'Entering bathroom', en_desc:'O Allah, I seek refuge in You from evil',
    ru_title:'При входе в туалет', ru_desc:'О Аллах, я прибегаю к Тебе от зла',
    ar_title:'دعاء دخول الخلاء', ar_desc:'اللهم إني أعوذ بك من الخبث والخبائث',
    tr_title:'Tuvalete girerken', tr_desc:'Allah\'ım, kötülüklerden Sana sığınırım' },
  { emoji:'🚶',
    az_title:'Tualetdən çıxanda', ar:'غُفْرَانَكَ',
    az:'Ğufranəkə — Bağışlanmanı istəyirəm',
    en_title:'Leaving bathroom', en_desc:'Ghufranaka — I seek Your forgiveness',
    ru_title:'При выходе из туалета', ru_desc:'Гуфранака — Прошу Твоего прощения',
    ar_title:'دعاء الخروج من الخلاء', ar_desc:'غفرانك',
    tr_title:'Tuvaletten çıkarken', tr_desc:'Gufraneke — Bağışlanmanı dilerim' },
  { emoji:'🕌',
    az_title:'Məscidə girəndə', ar:'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    az:'Allahım, mənə rəhmət qapılarını aç',
    en_title:'Entering mosque', en_desc:'O Allah, open the gates of Your mercy for me',
    ru_title:'При входе в мечеть', ru_desc:'О Аллах, открой мне врата Твоей милости',
    ar_title:'دعاء دخول المسجد', ar_desc:'اللهم افتح لي أبواب رحمتك',
    tr_title:'Camiye girerken', tr_desc:'Allah\'ım, bana rahmet kapılarını aç' },
  { emoji:'🏠',
    az_title:'Məsciddən çıxanda', ar:'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    az:'Allahım, Səndən lütfünü istəyirəm',
    en_title:'Leaving mosque', en_desc:'O Allah, I ask You for Your bounty',
    ru_title:'При выходе из мечети', ru_desc:'О Аллах, я прошу Тебя о Твоей милости',
    ar_title:'دعاء الخروج من المسجد', ar_desc:'اللهم إني أسألك من فضلك',
    tr_title:'Camiden çıkarken', tr_desc:'Allah\'ım, Senden lütfunu isterim' },
  { emoji:'✈️',
    az_title:'Səfərə çıxanda', ar:'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا',
    az:'Bunu bizə ram edəni təsbih edirəm',
    en_title:'Before travel', en_desc:'Glory to Him who has subjected this to us',
    ru_title:'Перед путешествием', ru_desc:'Пречист Тот, кто подчинил нам это',
    ar_title:'دعاء السفر', ar_desc:'سبحان الذي سخر لنا هذا وما كنا له مقرنين',
    tr_title:'Yolculuğa çıkarken', tr_desc:'Bunu bize boyun eğdireni tespih ederim' },
  { emoji:'🌙',
    az_title:'Yeni ayı görəndə', ar:'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَالْإِيمَانِ',
    az:'Allahım, bu ayı bizə əmin-amanlıq və imanla doğdur',
    en_title:'Seeing new moon', en_desc:'O Allah, bring this moon with safety and faith',
    ru_title:'При виде новой луны', ru_desc:'О Аллах, яви нам этот месяц с миром и верой',
    ar_title:'دعاء رؤية الهلال', ar_desc:'اللهم أهله علينا بالأمن والإيمان',
    tr_title:'Yeni ayı görünce', tr_desc:'Allah\'ım, bu ayı bize güvenlik ve imanla doğdur' },
  { emoji:'⛈️',
    az_title:'Gök gurultusu eşidəndə', ar:'سُبْحَانَ الَّذِي يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ',
    az:'Göy gurultusu həmd ilə təsbih edən Allahı təsbih edirəm',
    en_title:'Hearing thunder', en_desc:'Glory to Him whom thunder praises',
    ru_title:'При звуке грома', ru_desc:'Пречист Тот, кого гром восхваляет',
    ar_title:'دعاء سماع الرعد', ar_desc:'سبحان الذي يسبح الرعد بحمده',
    tr_title:'Gök gürültüsü duyunca', tr_desc:'Gök gürültüsünün hamd ile tespih ettiği Allah\'ı tespih ederim' },
  { emoji:'🙏',
    az_title:'Kiməsə təşəkkür edəndə', ar:'جَزَاكَ اللَّهُ خَيْرًا',
    az:'Cəzakallahu xeyran — Allah sənə xeyir versin',
    en_title:'Thanking someone', en_desc:'Jazakallahu khayran — May Allah reward you with good',
    ru_title:'Благодарность', ru_desc:'Джазакаллаху хайран — Да воздаст тебе Аллах добром',
    ar_title:'شكر الآخرين', ar_desc:'جزاك الله خيرًا',
    tr_title:'Birine teşekkür ederken', tr_desc:'Cezakallahu hayran — Allah sana hayır versin' },
  { emoji:'👔',
    az_title:'Yeni paltar geyəndə', ar:'الحَمْدُ لِلَّهِ الَّذِي كَسَانِي',
    az:'Mənə bu paltarı geyindirən Allaha həmd olsun',
    en_title:'Wearing new clothes', en_desc:'Praise to Allah who clothed me with this',
    ru_title:'Надевая новую одежду', ru_desc:'Хвала Аллаху, который одел меня в это',
    ar_title:'دعاء لبس الثوب', ar_desc:'الحمد لله الذي كساني هذا',
    tr_title:'Yeni elbise giyerken', tr_desc:'Bana bu elbiseyi giydiren Allah\'a hamd olsun' },
  { emoji:'🪞',
    az_title:'Güzgüyə baxanda', ar:'اللَّهُمَّ حَسِّنْ خُلُقِي كَمَا حَسَّنْتَ خَلْقِي',
    az:'Allahım, xilqətimi gözəl etdiyin kimi əxlaqımı da gözəlləşdir',
    en_title:'Looking in mirror', en_desc:'O Allah, beautify my character as You beautified my form',
    ru_title:'Глядя в зеркало', ru_desc:'О Аллах, укрась мой нрав, как Ты украсил мой облик',
    ar_title:'دعاء النظر في المرآة', ar_desc:'اللهم حسن خلقي كما حسنت خلقي',
    tr_title:'Aynaya bakarken', tr_desc:'Allah\'ım, yaratılışımı güzelleştirdiğin gibi ahlakımı da güzelleştir' },
]

const PILLARS = [
  { emoji:'☝️', az:'Şəhadət — Allahın tək olduğuna inanmaq', en:'Shahada — Believing Allah is One', ru:'Шахада — Верить, что Аллах Един', ar:'الشهادة — الإيمان بأن الله واحد', tr:'Şehadet — Allah\'ın tek olduğuna inanmak' },
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
    az_q:'Allahın neçə gözəl adı var?', en_q:'How many Names of Allah are there?', ru_q:'Сколько прекрасных имён у Аллаха?', ar_q:'كم عدد أسماء الله الحسنى؟', tr_q:'Allah\'ın kaç güzel ismi vardır?',
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
    az_q:'Quranın ən qısa surəsinin adı nədir?', en_q:'What is the name of the shortest surah?', ru_q:'Как называется самая короткая сура?', ar_q:'ما اسم أقصر سورة؟', tr_q:'En kısa surenin adı nedir?',
    options:['Fatihə','Kövsər','İxlas','Nas'],
    en_options:['Al-Fatiha','Al-Kawthar','Al-Ikhlas','An-Nas'],
    ru_options:['Аль-Фатиха','Аль-Каусар','Аль-Ихлас','Ан-Нас'],
    ar_options:['الفاتحة','الكوثر','الإخلاص','الناس'],
    tr_options:['Fatiha','Kevser','İhlas','Nas'],
    answer:1
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
    az_q:'Hansı peyğəmbər balığın qarnında qaldı?', en_q:'Which prophet was in the belly of a whale?', ru_q:'Какой пророк был в чреве кита?', ar_q:'أي نبي بقي في بطن الحوت؟', tr_q:'Hangi peygamber balığın karnında kaldı?',
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
  { name:'Sulayman', ar:'سليمان', emoji:'🐜', az:'Heyvanlarla danışan peyğəmbər', en:'The prophet who could talk to animals', ru:'Пророк, говоривший с животными', ar_desc:'النبي الذي كان يتكلم مع الحيوانات', tr:'Hayvanlarla konuşan peygamber' },
  { name:'Yunus', ar:'يونس', emoji:'🐋', az:'Balığın qarnında qalan peyğəmbər', en:'The prophet who was in the belly of a whale', ru:'Пророк, который был в чреве кита', ar_desc:'النبي الذي بقي في بطن الحوت', tr:'Balığın karnında kalan peygamber' },
  { name:'Isa', ar:'عيسى', emoji:'✨', az:'Möcüzələrlə göndərilən peyğəmbər, İncil verildi', en:'The prophet sent with miracles, given the Gospel', ru:'Пророк, посланный с чудесами, ему дано Евангелие', ar_desc:'النبي المرسل بالمعجزات، أنزل عليه الإنجيل', tr:'Mucizelerle gönderilen peygamber, İncil verildi' },
  { name:'Muhammad ﷺ', ar:'محمد ﷺ', emoji:'🌙', az:'Son peyğəmbər, Quran verildi', en:'The last prophet, given the Quran', ru:'Последний пророк, ему дан Коран', ar_desc:'آخر الأنبياء، أنزل عليه القرآن', tr:'Son peygamber, Kuran verildi' },
]

const GOOD_MANNERS = [
  { emoji:'🤝', az:'Salam ver — "Əssalamu aleykum" de', en:'Say Salam — "Assalamu Alaikum"', ru:'Приветствуй — "Ассаляму алейкум"', ar:'قل السلام — السلام عليكم', tr:'Selam ver — "Esselamu aleyküm" de' },
  { emoji:'✅', az:'Həmişə doğru danış', en:'Always be honest', ru:'Всегда будь честным', ar:'كن صادقًا دائمًا', tr:'Her zaman doğru söyle' },
  { emoji:'👨‍👩‍👧', az:'Valideynlərini hörmət et', en:'Respect your parents', ru:'Уважай своих родителей', ar:'احترم والديك', tr:'Anne babana saygı göster' },
  { emoji:'🫶', az:'Başqalarına kömək et', en:'Help others', ru:'Помогай другим', ar:'ساعد الآخرين', tr:'Başkalarına yardım et' },
  { emoji:'🐱', az:'Heyvanlara yaxşı davran', en:'Be kind to animals', ru:'Будь добр к животным', ar:'كن رفيقًا بالحيوانات', tr:'Hayvanlara iyi davran' },
  { emoji:'🍞', az:'Yeməyini başqaları ilə paylaş', en:'Share your food', ru:'Делись своей едой', ar:'شارك طعامك مع الآخرين', tr:'Yemeğini başkalarıyla paylaş' },
  { emoji:'😊', az:'Gülümsə — bu da sədəqədir', en:'Smile — it is charity too', ru:'Улыбайся — это тоже милостыня', ar:'ابتسم — فالابتسامة صدقة', tr:'Gülümse — bu da sadakadır' },
  { emoji:'🧼', az:'Təmizliyə diqqət et', en:'Keep yourself clean', ru:'Соблюдай чистоту', ar:'حافظ على النظافة', tr:'Temizliğe dikkat et' },
  { emoji:'🚫', az:'Yalan danışma', en:'Do not lie', ru:'Не лги', ar:'لا تكذب', tr:'Yalan söyleme' },
  { emoji:'🕊️', az:'Səbirli ol', en:'Be patient', ru:'Будь терпелив', ar:'كن صبورًا', tr:'Sabırlı ol' },
]

export default function KidsPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const [openSection, setOpenSection] = useState('names')
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizState, setQuizState] = useState(null) // null, 'correct', 'wrong'
  const [score, setScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)

  const toggleSection = (s) => setOpenSection(openSection === s ? null : s)

  const getLangField = (obj, field) => {
    if (lang === 'az') return obj[field] || obj.az || ''
    if (lang === 'en') return obj[`en_${field}`] || obj[`en${field ? '_'+field : ''}`] || obj.en || obj[`en_desc`] || ''
    if (lang === 'ru') return obj[`ru_${field}`] || obj[`ru${field ? '_'+field : ''}`] || obj.ru || obj[`ru_desc`] || ''
    if (lang === 'ar') return obj[`ar_${field}`] || obj[`ar${field ? '_'+field : ''}`] || obj.ar || obj[`ar_desc`] || ''
    if (lang === 'tr') return obj[`tr_${field}`] || obj[`tr${field ? '_'+field : ''}`] || obj.tr || obj[`tr_desc`] || ''
    return obj.az || obj.en || ''
  }

  const getQuizQ = (q) => q[`${lang}_q`] || q.az_q
  const getQuizOpts = (q) => q[`${lang}_options`] || q.options

  const handleQuizAnswer = (idx) => {
    if (quizState) return
    const q = QUIZ[quizIdx]
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
    }
  }

  const resetQuiz = () => {
    setQuizIdx(0)
    setQuizState(null)
    setScore(0)
    setQuizDone(false)
  }

  const sections = [
    { key:'names', emoji:'🌟', title:t.namesTitle },
    { key:'surahs', emoji:'📖', title:t.surahsTitle },
    { key:'duas', emoji:'🤲', title:t.duasTitle },
    { key:'rules', emoji:'🕌', title:t.rulesTitle },
    { key:'prophets', emoji:'🌙', title:t.prophetsTitle },
    { key:'manners', emoji:'🤝', title:t.mannersTitle },
    { key:'quiz', emoji:'🧩', title:t.quizTitle },
  ]

  return (
    <>
      <div className="page-hero kids-hero">
        <div className="kids-hero-emojis">🌙 ⭐ 🕌 📖 🤲</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner kids-layout">

          {/* Section tabs */}
          <div className="kids-tabs">
            {sections.map(s => (
              <button key={s.key}
                className={`kids-tab ${openSection===s.key?'active':''}`}
                onClick={() => toggleSection(s.key)}>
                <span className="kids-tab-emoji">{s.emoji}</span>
                <span className="kids-tab-label">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Names of Allah */}
          {openSection === 'names' && (
            <div className="kids-section anim-fadeIn">
              <h2 className="kids-section-title">{t.namesTitle} 🌟</h2>
              <div className="kids-names-grid">
                {NAMES_OF_ALLAH.map((n, i) => (
                  <div key={i} className="kids-name-card">
                    <span className="kids-name-emoji">{n.emoji}</span>
                    <span className="kids-name-arabic">{n.ar}</span>
                    <span className="kids-name-desc">
                      {lang === 'ar' ? n.ar_desc : lang === 'en' ? n.en : lang === 'ru' ? n.ru : lang === 'tr' ? n.tr : n.az}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Short Surahs */}
          {openSection === 'surahs' && (
            <div className="kids-section anim-fadeIn">
              <h2 className="kids-section-title">{t.surahsTitle} 📖</h2>
              <div className="kids-surahs-list">
                {SHORT_SURAHS.map((s, i) => (
                  <div key={i} className="kids-surah-card">
                    <div className="kids-surah-header">
                      <span className="kids-surah-emoji">{s.emoji}</span>
                      <span className="kids-surah-arabic">{s.name}</span>
                      <span className="kids-surah-en">{s.en}</span>
                      <span className="kids-surah-ayahs">{s.ayahs} {lang === 'ar' ? 'آية' : lang === 'ru' ? 'аятов' : lang === 'tr' ? 'ayet' : lang === 'en' ? 'ayahs' : 'ayə'}</span>
                    </div>
                    <p className="kids-surah-desc">
                      {lang === 'ar' ? s.ar_desc : lang === 'en' ? s.en_desc : lang === 'ru' ? s.ru : lang === 'tr' ? s.tr : s.az}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Duas */}
          {openSection === 'duas' && (
            <div className="kids-section anim-fadeIn">
              <h2 className="kids-section-title">{t.duasTitle} 🤲</h2>
              <div className="kids-duas-list">
                {DAILY_DUAS.map((d, i) => (
                  <div key={i} className="kids-dua-card">
                    <span className="kids-dua-emoji">{d.emoji}</span>
                    <div className="kids-dua-body">
                      <h3 className="kids-dua-title">
                        {lang === 'ar' ? d.ar_title : lang === 'en' ? d.en_title : lang === 'ru' ? d.ru_title : lang === 'tr' ? d.tr_title : d.az_title}
                      </h3>
                      <div className="kids-dua-arabic">{d.ar}</div>
                      <p className="kids-dua-meaning">
                        {lang === 'ar' ? d.ar_desc : lang === 'en' ? d.en_desc : lang === 'ru' ? d.ru_desc : lang === 'tr' ? d.tr_desc : d.az}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5 Pillars */}
          {openSection === 'rules' && (
            <div className="kids-section anim-fadeIn">
              <h2 className="kids-section-title">{t.rulesTitle} 🕌</h2>
              <div className="kids-pillars-list">
                {PILLARS.map((p, i) => (
                  <div key={i} className="kids-pillar-card">
                    <span className="kids-pillar-num">{i + 1}</span>
                    <span className="kids-pillar-emoji">{p.emoji}</span>
                    <span className="kids-pillar-text">{p[lang] || p.az}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prophets */}
          {openSection === 'prophets' && (
            <div className="kids-section anim-fadeIn">
              <h2 className="kids-section-title">{t.prophetsTitle} 🌙</h2>
              <div className="kids-names-grid">
                {PROPHETS_FOR_KIDS.map((p, i) => (
                  <div key={i} className="kids-name-card">
                    <span className="kids-name-emoji">{p.emoji}</span>
                    <span className="kids-name-arabic">{p.ar}</span>
                    <span className="kids-name-desc" style={{fontWeight:'bold'}}>{p.name}</span>
                    <span className="kids-name-desc">
                      {lang === 'ar' ? p.ar_desc : lang === 'en' ? p.en : lang === 'ru' ? p.ru : lang === 'tr' ? p.tr : p.az}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Good Manners */}
          {openSection === 'manners' && (
            <div className="kids-section anim-fadeIn">
              <h2 className="kids-section-title">{t.mannersTitle} 🤝</h2>
              <div className="kids-pillars-list">
                {GOOD_MANNERS.map((m, i) => (
                  <div key={i} className="kids-pillar-card">
                    <span className="kids-pillar-num">{i + 1}</span>
                    <span className="kids-pillar-emoji">{m.emoji}</span>
                    <span className="kids-pillar-text">{lang === 'ar' ? m.ar : lang === 'en' ? m.en : lang === 'ru' ? m.ru : lang === 'tr' ? m.tr : m.az}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz */}
          {openSection === 'quiz' && (
            <div className="kids-section anim-fadeIn">
              <h2 className="kids-section-title">{t.quizTitle} 🧩</h2>
              {quizDone ? (
                <div className="kids-quiz-done">
                  <div className="kids-quiz-score-big">
                    {score === QUIZ.length ? '🏆' : score >= 3 ? '🌟' : '📚'}
                  </div>
                  <div className="kids-quiz-result">
                    {score} / {QUIZ.length}
                  </div>
                  <p className="kids-quiz-msg">
                    {score === QUIZ.length
                      ? (t.correct)
                      : (lang === 'az' ? 'Yaxşı cəhd!' : lang === 'en' ? 'Good try!' : lang === 'ru' ? 'Хорошая попытка!' : lang === 'ar' ? 'محاولة جيدة!' : 'İyi deneme!')}
                  </p>
                  <button className="kids-quiz-restart" onClick={resetQuiz}>
                    {lang === 'az' ? 'Yenidən başla' : lang === 'en' ? 'Play again' : lang === 'ru' ? 'Играть снова' : lang === 'ar' ? 'العب مرة أخرى' : 'Tekrar oyna'}
                  </button>
                </div>
              ) : (
                <div className="kids-quiz-box">
                  <div className="kids-quiz-progress">
                    {quizIdx + 1} / {QUIZ.length}
                  </div>
                  <h3 className="kids-quiz-question">{getQuizQ(QUIZ[quizIdx])}</h3>
                  <div className="kids-quiz-options">
                    {getQuizOpts(QUIZ[quizIdx]).map((opt, i) => (
                      <button key={i}
                        className={`kids-quiz-opt ${quizState && i === QUIZ[quizIdx].answer ? 'correct' : ''} ${quizState === 'wrong' && i !== QUIZ[quizIdx].answer ? 'dimmed' : ''}`}
                        onClick={() => handleQuizAnswer(i)}
                        disabled={!!quizState}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {quizState && (
                    <div className={`kids-quiz-feedback ${quizState}`}>
                      <span>{quizState === 'correct' ? t.correct : t.wrong}</span>
                      <button className="kids-quiz-next" onClick={nextQuiz}>{t.next}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
