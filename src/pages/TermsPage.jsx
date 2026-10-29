import { useLang } from '../contexts/LangContext'
import LegalDocument, { IF_EMAIL, IF_NO_EMAIL, IF_COUNTRY } from '../components/LegalDocument'

// ═══════════════════════════════════════════════════════
// İstifadə şərtləri — pulsuz, reklamsız, hesabsız xidmət üçün.
// Əsas vurğu: dini məzmun və AI xəbərdarlığı (AI cavabı fətva deyil,
// namaz vaxtı hesablamadır, Quran tərcüməsi məna tərcüməsidir).
// "Tətbiq olunan qanun" bölməsi yalnız BRAND.legal.country doludursa görünür.
// Yer tutucular və işarələmə: components/LegalDocument.jsx.
// ═══════════════════════════════════════════════════════

const DOC = {
  az: {
    title: 'İstifadə şərtləri',
    lead: '{brand} saytından və tətbiqindən istifadə qaydaları. Saytdan istifadə etməklə bu şərtləri qəbul etmiş olursunuz.',
    sections: {
      about: { h: 'Xidmət haqqında', body: [
        '{brand} — Quran, namaz vaxtları, hədis, dua, zikr, zəkat kalkulyatoru, qiblə istiqaməti, AI köməkçi və digər İslami bilik bölmələrindən ibarət onlayn platformadır. Xidmət **pulsuzdur, reklamsızdır** və istifadə üçün hesab yaratmaq tələb olunmur.',
        'Sayt heç bir ödəniş qəbul etmir. Xeyriyyə və sədəqə bölmələri yalnız məlumat və şəxsi qeyd üçündür.',
      ] },
      asis: { h: 'Xidmət "olduğu kimi" təqdim olunur', body: [
        'Xidməti "olduğu kimi" və "mümkün olduğu qədər" təqdim edirik. Məzmunun dəqiq olması üçün çalışırıq, lakin saytın fasiləsiz və xətasız işləyəcəyinə, hər məlumatın tam və aktual olacağına zəmanət vermirik.',
        'Bölmələri istənilən vaxt dəyişə, müvəqqəti dayandıra və ya bağlaya bilərik. Saytın bəzi funksiyaları üçüncü tərəf xidmətlərindən asılıdır (məsələn, namaz vaxtları və Quran mətni) — onlar əlçatan olmadıqda həmin funksiyalar işləməyə bilər.',
      ] },
      religious: { h: 'Dini məzmun haqqında', body: [
        'Saytdakı dini məzmun **maarifləndirmə və məlumat** məqsədi daşıyır. O, alimin məsləhətini, fətvanı və ya dini təhsili əvəz etmir.',
        { ul: [
          'Bir çox məsələdə məzhəblər və alimlər arasında fərqli rəylər var; sayt hamısını əhatə etmir.',
          'Hədislərin altında mənbəyi göstərilir. Hökm çıxarmaq üçün hədisi kontekstdə və alimlərin şərhi ilə öyrənmək lazımdır.',
          'Məzmunda xəta görsəniz, [bizə bildirin]({toContact}) — yoxlayıb düzəldəcəyik.',
        ] },
      ] },
      quran: { h: 'Quran mətni və tərcümələr', body: [
        'Quranın ərəbcə mətni əsasdır. Digər dillərdəki mətnlər **məna tərcüməsidir** (məal) — onlar tərcüməçinin anlayışını əks etdirir və Quranın özü sayılmır.',
        'Tərcümələrin, qiraət səslərinin və təfsirin müəllif hüquqları müvafiq tərcüməçilərə və naşirlərə məxsusdur. Ətraflı: [Mənbələr və lisenziyalar]({toLicenses}).',
      ] },
      prayer: { h: 'Namaz vaxtları, qiblə və təqvim', body: [
        { ul: [
          '**Namaz vaxtları astronomik hesablamadır** (standart olaraq Diyanət metodu ilə). Onlar yerli məscidin və ya rəsmi dini qurumun cədvəlindən bir neçə dəqiqə fərqlənə bilər. Xüsusilə imsak və iftar vaxtını yerli məsciddə və ya rəsmi təqvimdə yoxlayın.',
          '**Qiblə istiqaməti** cihazınızın kompasından və yer məlumatından asılıdır; maqnit sahəsi və sensorun dəqiqliyi nəticəyə təsir edə bilər.',
          '**Hicri təqvim** hesablamaya əsaslanır və ay müşahidəsinə görə elan olunan tarixdən bir gün fərqlənə bilər.',
          '**Bildirişlər** cihazın ayarlarından, enerjiyə qənaət rejimindən və ya şəbəkədən asılı olaraq gecikə və ya çatmaya bilər. İbadət vaxtını yalnız bildirişlərə güvənərək təyin etməyin.',
        ] },
      ] },
      ai: { h: 'AI köməkçi', body: [
        'AI köməkçinin cavabları süni intellekt modeli tərəfindən avtomatik yaradılır və **səhv, natamam və ya köhnəlmiş** ola bilər.',
        { ul: [
          '**AI cavabı fətva deyil.** Dini hökmlər üçün etibarlı alimə müraciət edin.',
          'Tibbi, hüquqi və maliyyə məsələlərində AI cavablarına əsaslanmayın.',
          'AI köməkçidən qanunsuz, təhqiramiz, nifrət yayan və ya başqalarına zərər verən məzmun yaratmaq üçün istifadə etmək qadağandır.',
          'Sui-istifadənin qarşısını almaq üçün sorğuların sayı məhdudlaşdırılıb.',
        ] },
        'Sualların necə emal olunduğu [Məxfilik siyasətində]({toPrivacy}) izah olunub.',
      ] },
      tools: { h: 'Kalkulyatorlar və hesablamalar', body: [
        'Zəkat kalkulyatoru və digər alətlər təxmini nəticə verir: valyuta məzənnələri və qızıl-gümüş qiymətləri real vaxtdakı qiymətdən fərqlənə bilər. Zəkatın məbləği və şərtləri barədə son qərar sizindir — şübhəli hallarda alimə müraciət edin.',
      ] },
      conduct: { h: 'İstifadəçi davranışı', body: [
        'Saytdan istifadə edərkən aşağıdakılar qadağandır:',
        { ul: [
          'saytın və ya serverin işini pozmağa, həddən artıq yükləməyə, sorğu limitlərini keçməyə cəhd etmək;',
          'təhlükəsizlik tədbirlərindən yan keçmək, inzibati bölmələrə icazəsiz daxil olmağa çalışmaq;',
          'məzmunu avtomatlaşdırılmış vasitələrlə kütləvi şəkildə yığmaq;',
          'saytın məzmununu və ya AI cavablarını təhrif edərək {brand} adından rəsmi dini rəy kimi təqdim etmək.',
        ] },
      ] },
      ip: { h: 'Əqli mülkiyyət', body: [
        'Saytın dizaynı, proqram kodu, loqosu və saytın özünə məxsus mətnlər {brand} layihəsinə məxsusdur.',
        'Quran mətni, tərcümələr, qiraət səsləri, hədis tərcümələri, xəritə məlumatları, şriftlər və proqram kitabxanaları müvafiq hüquq sahiblərinə məxsusdur və onların lisenziyası ilə istifadə olunur — siyahı: [Mənbələr və lisenziyalar]({toLicenses}).',
        'Saytdakı məzmundan şəxsi, təhsil və qeyri-kommersiya məqsədləri ilə, mənbəni göstərməklə sitat gətirə bilərsiniz. Digər şirkətlərin əmtəə nişanları (məsələn, {youtube}, Instagram) öz sahiblərinə məxsusdur.',
      ] },
      links: { h: 'Xarici linklər və xidmətlər', body: [
        'Saytda üçüncü tərəflərin videoları ({youtube}), xəritələri ({gmaps}) və digər saytlara linklər var. Onların məzmununa və işinə görə məsuliyyət daşımırıq; həmin xidmətlərdən istifadə zamanı onların öz şərtləri tətbiq olunur.',
      ] },
      liability: { h: 'Məsuliyyətin məhdudlaşdırılması', body: [
        'Qanunun icazə verdiyi həddə {brand} saytdan istifadə və ya istifadə edə bilməmək nəticəsində yaranan dolayı zərərə — o cümlədən hesablama xətasına, gecikmiş bildirişə, məlumatın itməsinə (məsələn, brauzer yaddaşı silindikdə) görə məsuliyyət daşımır.',
        'Bu bənd qanuna görə məhdudlaşdırıla bilməyən məsuliyyəti və istehlakçı kimi məcburi hüquqlarınızı məhdudlaşdırmır.',
      ] },
      changes: { h: 'Şərtlərin dəyişdirilməsi', body: [
        'Bu şərtləri yeniləyə bilərik. Son yenilənmə tarixi səhifənin yuxarısında göstərilir. Dəyişiklikdən sonra saytdan istifadəni davam etdirsəniz, yenilənmiş şərtləri qəbul etmiş sayılırsınız.',
      ] },
      law: { h: 'Tətbiq olunan qanun', when: IF_COUNTRY, body: [
        'Bu şərtlər {country} qanunvericiliyinə uyğun tənzimlənir. Yaşadığınız ölkənin qanunlarının istehlakçı kimi sizə verdiyi məcburi hüquqlar qüvvədə qalır.',
      ] },
      contact: { h: 'Əlaqə', body: [
        { when: IF_EMAIL, p: 'Şərtlərlə bağlı suallarınızı e-poçtla göndərin:' },
        { when: IF_NO_EMAIL, p: 'Şərtlərlə bağlı suallarınızı saytın rəsmi Instagram səhifəsinə yaza bilərsiniz:' },
        { contact: true },
      ] },
    },
  },

  en: {
    title: 'Terms of Use',
    lead: 'The rules for using the {brand} website and app. By using the site, you agree to these terms.',
    sections: {
      about: { h: 'About the service', body: [
        '{brand} is an online platform with the Quran, prayer times, hadith, duas, dhikr, a zakat calculator, qibla direction, an AI assistant and other sections of Islamic knowledge. The service is **free and ad-free**, and no account is needed to use it.',
        'The site accepts no payments of any kind. The charity and sadaqah sections are for information and personal notes only.',
      ] },
      asis: { h: 'Provided “as is”', body: [
        'We provide the service “as is” and “as available”. We work hard to keep the content accurate, but we do not guarantee that the site will run without interruption or errors, or that every piece of information is complete and up to date.',
        'We may change, pause or close sections at any time. Some features depend on third-party services (for example, prayer times and the Quran text) and may not work when those services are unavailable.',
      ] },
      religious: { h: 'About the religious content', body: [
        'The religious content on the site is for **education and information**. It does not replace a scholar’s advice, a fatwa or religious study.',
        { ul: [
          'On many questions the schools of thought and scholars hold different views; the site does not cover all of them.',
          'Each hadith shows its source. Deriving rulings requires studying a hadith in context and with scholarly commentary.',
          'If you spot an error, [let us know]({toContact}) — we will check and correct it.',
        ] },
      ] },
      quran: { h: 'The Quran text and translations', body: [
        'The Arabic text of the Quran is the original. The texts in other languages are **translations of the meaning** — they reflect the translator’s understanding and are not the Quran itself.',
        'Copyright in the translations, recitations and tafsir belongs to the respective translators and publishers. Details: [Sources & Licenses]({toLicenses}).',
      ] },
      prayer: { h: 'Prayer times, qibla and calendar', body: [
        { ul: [
          '**Prayer times are an astronomical calculation** (by default using the Diyanet method). They may differ by a few minutes from your local mosque or official religious authority. Please check imsak and iftar times in particular with your local mosque or official calendar.',
          '**The qibla direction** depends on your device’s compass and location data; magnetic interference and sensor accuracy can affect the result.',
          '**The Hijri calendar** is calculated and may differ by a day from dates announced on the basis of moon sighting.',
          '**Notifications** may be delayed or not delivered depending on device settings, battery saving or the network. Do not rely on notifications alone to know when to pray.',
        ] },
      ] },
      ai: { h: 'AI assistant', body: [
        'The AI assistant’s answers are generated automatically by an artificial-intelligence model and may be **wrong, incomplete or outdated**.',
        { ul: [
          '**An AI answer is not a fatwa.** For religious rulings, please consult a trusted scholar.',
          'Do not rely on AI answers for medical, legal or financial matters.',
          'Using the AI assistant to create unlawful, abusive or hateful content, or content that harms others, is prohibited.',
          'The number of requests is limited to prevent abuse.',
        ] },
        'How questions are processed is explained in the [Privacy Policy]({toPrivacy}).',
      ] },
      tools: { h: 'Calculators and estimates', body: [
        'The zakat calculator and other tools give estimates: exchange rates and gold and silver prices may differ from live prices. The final decision on the amount and conditions of zakat is yours — in case of doubt, please consult a scholar.',
      ] },
      conduct: { h: 'User conduct', body: [
        'When using the site, you must not:',
        { ul: [
          'try to disrupt or overload the site or server, or get around request limits;',
          'bypass security measures or try to access administrative areas without permission;',
          'harvest content in bulk with automated tools;',
          'misrepresent the site’s content or AI answers as an official religious opinion on behalf of {brand}.',
        ] },
      ] },
      ip: { h: 'Intellectual property', body: [
        'The site’s design, software code, logo and original texts belong to the {brand} project.',
        'The Quran text, translations, recitations, hadith translations, map data, fonts and software libraries belong to their respective rights holders and are used under their licenses — see [Sources & Licenses]({toLicenses}).',
        'You may quote content from the site for personal, educational and non-commercial purposes, with the source credited. Other companies’ trademarks (such as {youtube} and Instagram) belong to their owners.',
      ] },
      links: { h: 'External links and services', body: [
        'The site contains third-party videos ({youtube}), maps ({gmaps}) and links to other websites. We are not responsible for their content or operation; their own terms apply when you use those services.',
      ] },
      liability: { h: 'Limitation of liability', body: [
        'To the extent permitted by law, {brand} is not liable for indirect damage arising from the use of, or inability to use, the site — including calculation errors, delayed notifications or loss of data (for example, when browser storage is cleared).',
        'This does not limit any liability that cannot be limited by law, nor your mandatory rights as a consumer.',
      ] },
      changes: { h: 'Changes to these terms', body: [
        'We may update these terms. The date of the last update is shown at the top of the page. If you keep using the site after a change, you are deemed to accept the updated terms.',
      ] },
      law: { h: 'Governing law', when: IF_COUNTRY, body: [
        'These terms are governed by the laws of {country}. Any mandatory consumer rights you have under the laws of your country of residence remain in effect.',
      ] },
      contact: { h: 'Contact', body: [
        { when: IF_EMAIL, p: 'Please send questions about these terms by email:' },
        { when: IF_NO_EMAIL, p: 'You can send questions about these terms to the site’s official Instagram account:' },
        { contact: true },
      ] },
    },
  },

  ru: {
    title: 'Условия использования',
    lead: 'Правила пользования сайтом и приложением {brand}. Пользуясь сайтом, вы принимаете эти условия.',
    sections: {
      about: { h: 'О сервисе', body: [
        '{brand} — онлайн-платформа с разделами Корана, времени намаза, хадисов, дуа, зикра, калькулятором закята, направлением киблы, ИИ-помощником и другими материалами по исламу. Сервис **бесплатный и без рекламы**, для пользования не нужна учётная запись.',
        'Сайт не принимает никаких платежей. Разделы о благотворительности и садаке служат только для информации и личных заметок.',
      ] },
      asis: { h: 'Сервис предоставляется «как есть»', body: [
        'Мы предоставляем сервис «как есть» и «по мере доступности». Мы стремимся к точности материалов, но не гарантируем, что сайт будет работать без перебоев и ошибок, а вся информация будет полной и актуальной.',
        'Мы можем в любое время изменять, приостанавливать или закрывать разделы. Часть функций зависит от сторонних сервисов (например, время намаза и текст Корана) и может не работать, если они недоступны.',
      ] },
      religious: { h: 'О религиозных материалах', body: [
        'Религиозные материалы сайта носят **просветительский и справочный** характер. Они не заменяют совета учёного, фетвы или религиозного обучения.',
        { ul: [
          'По многим вопросам у мазхабов и учёных разные мнения; сайт не охватывает их все.',
          'Под каждым хадисом указан источник. Чтобы выводить из хадиса решения, его нужно изучать в контексте и с комментариями учёных.',
          'Если вы заметили ошибку, [сообщите нам]({toContact}) — мы проверим и исправим.',
        ] },
      ] },
      quran: { h: 'Текст Корана и переводы', body: [
        'Основой является арабский текст Корана. Тексты на других языках — это **переводы смыслов**: они отражают понимание переводчика и не являются самим Кораном.',
        'Авторские права на переводы, аудиозаписи чтения и тафсир принадлежат соответствующим переводчикам и издателям. Подробнее: [Источники и лицензии]({toLicenses}).',
      ] },
      prayer: { h: 'Время намаза, кибла и календарь', body: [
        { ul: [
          '**Время намаза — астрономический расчёт** (по умолчанию по методу Диянет). Оно может на несколько минут отличаться от расписания местной мечети или официального духовного управления. Особенно время имсака и ифтара сверяйте с местной мечетью или официальным календарём.',
          '**Направление киблы** зависит от компаса и данных о местоположении вашего устройства; на результат могут влиять магнитные помехи и точность датчика.',
          '**Календарь хиджры** рассчитывается и может на день расходиться с датами, объявленными по наблюдению луны.',
          '**Уведомления** могут задерживаться или не приходить из-за настроек устройства, режима энергосбережения или сети. Не полагайтесь только на уведомления, определяя время молитвы.',
        ] },
      ] },
      ai: { h: 'ИИ-помощник', body: [
        'Ответы ИИ-помощника автоматически создаются моделью искусственного интеллекта и могут быть **ошибочными, неполными или устаревшими**.',
        { ul: [
          '**Ответ ИИ — не фетва.** По религиозным вопросам обращайтесь к надёжному учёному.',
          'Не полагайтесь на ответы ИИ в медицинских, юридических и финансовых вопросах.',
          'Запрещено использовать ИИ-помощника для создания незаконного, оскорбительного, разжигающего ненависть или вредящего другим содержимого.',
          'Количество запросов ограничено для защиты от злоупотреблений.',
        ] },
        'Как обрабатываются вопросы, описано в [Политике конфиденциальности]({toPrivacy}).',
      ] },
      tools: { h: 'Калькуляторы и расчёты', body: [
        'Калькулятор закята и другие инструменты дают приблизительный результат: курсы валют и цены на золото и серебро могут отличаться от текущих. Окончательное решение о размере и условиях закята остаётся за вами — в сомнительных случаях обращайтесь к учёному.',
      ] },
      conduct: { h: 'Правила поведения', body: [
        'При пользовании сайтом запрещается:',
        { ul: [
          'пытаться нарушить работу сайта или сервера, перегрузить их или обойти ограничения на число запросов;',
          'обходить меры защиты и пытаться без разрешения войти в административные разделы;',
          'массово собирать материалы сайта автоматическими средствами;',
          'искажать материалы сайта или ответы ИИ, выдавая их за официальное религиозное мнение от имени {brand}.',
        ] },
      ] },
      ip: { h: 'Интеллектуальная собственность', body: [
        'Дизайн сайта, программный код, логотип и собственные тексты сайта принадлежат проекту {brand}.',
        'Текст Корана, переводы, аудиозаписи чтения, переводы хадисов, картографические данные, шрифты и программные библиотеки принадлежат соответствующим правообладателям и используются по их лицензиям — см. [Источники и лицензии]({toLicenses}).',
        'Вы можете цитировать материалы сайта в личных, учебных и некоммерческих целях с указанием источника. Товарные знаки других компаний (например, {youtube} и Instagram) принадлежат их владельцам.',
      ] },
      links: { h: 'Внешние ссылки и сервисы', body: [
        'На сайте есть видео сторонних авторов ({youtube}), карты ({gmaps}) и ссылки на другие сайты. Мы не отвечаем за их содержание и работу; при пользовании этими сервисами действуют их собственные условия.',
      ] },
      liability: { h: 'Ограничение ответственности', body: [
        'В пределах, допускаемых законом, {brand} не несёт ответственности за косвенный ущерб от использования сайта или невозможности им воспользоваться — в том числе за ошибки расчёта, задержку уведомлений или потерю данных (например, при очистке хранилища браузера).',
        'Это положение не ограничивает ответственность, которую нельзя ограничить по закону, и ваши обязательные права потребителя.',
      ] },
      changes: { h: 'Изменение условий', body: [
        'Мы можем обновлять эти условия. Дата последнего обновления указана вверху страницы. Продолжая пользоваться сайтом после изменений, вы принимаете обновлённые условия.',
      ] },
      law: { h: 'Применимое право', when: IF_COUNTRY, body: [
        'Эти условия регулируются законодательством страны: {country}. Обязательные права потребителя, которые дают вам законы страны вашего проживания, сохраняются.',
      ] },
      contact: { h: 'Контакты', body: [
        { when: IF_EMAIL, p: 'Вопросы об условиях присылайте по электронной почте:' },
        { when: IF_NO_EMAIL, p: 'Вопросы об условиях можно написать в официальный аккаунт сайта в Инстаграме:' },
        { contact: true },
      ] },
    },
  },

  ar: {
    title: 'شروط الاستخدام',
    lead: 'قواعد استخدام موقع {brand} وتطبيقه. باستخدامك الموقع فإنك توافق على هذه الشروط.',
    sections: {
      about: { h: 'عن الخدمة', body: [
        '{brand} منصة إلكترونية تضمّ القرآن الكريم ومواقيت الصلاة والأحاديث والأدعية والأذكار وحاسبة الزكاة واتجاه القبلة ومساعداً ذكياً وأقساماً أخرى من المعرفة الإسلامية. الخدمة **مجانية وبلا إعلانات**، ولا يلزم إنشاء حساب لاستخدامها.',
        'لا يقبل الموقع أي مدفوعات. وأقسام الصدقة والتبرع للمعلومات والتدوين الشخصي فقط.',
      ] },
      asis: { h: 'الخدمة مقدَّمة «كما هي»', body: [
        'نقدّم الخدمة «كما هي» و«بحسب توفّرها». ونحرص على دقة المحتوى، لكننا لا نضمن أن يعمل الموقع دون انقطاع أو أخطاء، ولا أن تكون كل معلومة كاملة ومحدَّثة.',
        'يجوز لنا تعديل الأقسام أو إيقافها مؤقتاً أو إغلاقها في أي وقت. وتعتمد بعض الميزات على خدمات خارجية (مثل مواقيت الصلاة ونص القرآن)، وقد لا تعمل عند تعذّر الوصول إليها.',
      ] },
      religious: { h: 'عن المحتوى الديني', body: [
        'المحتوى الديني في الموقع **للتعليم والمعرفة**، ولا يغني عن استشارة العالِم ولا عن الفتوى ولا عن طلب العلم الشرعي.',
        { ul: [
          'في كثير من المسائل تختلف آراء المذاهب والعلماء، ولا يحيط الموقع بها جميعاً.',
          'يُذكر مصدر كل حديث تحته. واستنباط الأحكام يحتاج إلى دراسة الحديث في سياقه ومع شروح العلماء.',
          'إذا لاحظت خطأً [فأخبرنا]({toContact}) — سنراجعه ونصحّحه.',
        ] },
      ] },
      quran: { h: 'نص القرآن والترجمات', body: [
        'النص العربي للقرآن هو الأصل. أما النصوص بلغات أخرى فهي **ترجمات لمعاني القرآن**؛ تعكس فهم المترجم وليست هي القرآن نفسه.',
        'حقوق الترجمات وتسجيلات التلاوة والتفسير محفوظة لأصحابها من المترجمين والناشرين. التفاصيل: [المصادر والتراخيص]({toLicenses}).',
      ] },
      prayer: { h: 'مواقيت الصلاة والقبلة والتقويم', body: [
        { ul: [
          '**مواقيت الصلاة حساب فلكي** (افتراضياً بطريقة رئاسة الشؤون الدينية التركية). وقد تختلف ببضع دقائق عن جدول المسجد المحلي أو الجهة الدينية الرسمية. تحقّق خاصةً من وقتَي الإمساك والإفطار لدى مسجدك أو في التقويم الرسمي.',
          '**اتجاه القبلة** يعتمد على بوصلة جهازك وبيانات موقعك؛ وقد يتأثر بالمجال المغناطيسي ودقة المستشعر.',
          '**التقويم الهجري** محسوب، وقد يختلف بيوم واحد عن التاريخ المعلن بناءً على رؤية الهلال.',
          '**الإشعارات** قد تتأخر أو لا تصل بحسب إعدادات الجهاز ووضع توفير الطاقة والشبكة. لا تعتمد على الإشعارات وحدها في معرفة وقت الصلاة.',
        ] },
      ] },
      ai: { h: 'المساعد الذكي', body: [
        'تُولَّد إجابات المساعد الذكي آلياً بواسطة نموذج ذكاء اصطناعي، وقد تكون **خاطئة أو ناقصة أو قديمة**.',
        { ul: [
          '**إجابة المساعد الذكي ليست فتوى.** للأحكام الشرعية يُرجى الرجوع إلى عالِم موثوق.',
          'لا تعتمد على إجابات الذكاء الاصطناعي في المسائل الطبية أو القانونية أو المالية.',
          'يُمنع استخدام المساعد الذكي لإنتاج محتوى مخالف للقانون أو مسيء أو يحضّ على الكراهية أو يضرّ بالآخرين.',
          'عدد الطلبات محدود لمنع إساءة الاستخدام.',
        ] },
        'طريقة معالجة الأسئلة مشروحة في [سياسة الخصوصية]({toPrivacy}).',
      ] },
      tools: { h: 'الحاسبات والتقديرات', body: [
        'تعطي حاسبة الزكاة وغيرها من الأدوات نتائج تقريبية: فقد تختلف أسعار العملات والذهب والفضة عن الأسعار الفعلية. والقرار الأخير في مقدار الزكاة وشروطها لك — وعند الشك يُرجى الرجوع إلى عالِم.',
      ] },
      conduct: { h: 'سلوك المستخدم', body: [
        'يُمنع عند استخدام الموقع:',
        { ul: [
          'محاولة تعطيل الموقع أو الخادم أو إثقالهما أو تجاوز حدود الطلبات؛',
          'تجاوز إجراءات الحماية أو محاولة الدخول إلى الأقسام الإدارية دون إذن؛',
          'جمع محتوى الموقع على نطاق واسع بوسائل آلية؛',
          'تحريف محتوى الموقع أو إجابات المساعد الذكي وتقديمها على أنها رأي ديني رسمي باسم {brand}.',
        ] },
      ] },
      ip: { h: 'الملكية الفكرية', body: [
        'تصميم الموقع وشيفرته البرمجية وشعاره ونصوصه الخاصة ملك لمشروع {brand}.',
        'نص القرآن والترجمات وتسجيلات التلاوة وترجمات الأحاديث وبيانات الخرائط والخطوط والمكتبات البرمجية ملك لأصحاب حقوقها، وتُستخدم وفق تراخيصهم — انظر [المصادر والتراخيص]({toLicenses}).',
        'يجوز لك الاقتباس من محتوى الموقع لأغراض شخصية وتعليمية وغير تجارية مع ذكر المصدر. والعلامات التجارية للشركات الأخرى (مثل {youtube} وإنستغرام) ملك لأصحابها.',
      ] },
      links: { h: 'الروابط والخدمات الخارجية', body: [
        'يتضمن الموقع مقاطع فيديو لجهات أخرى ({youtube}) وخرائط ({gmaps}) وروابط لمواقع أخرى. لسنا مسؤولين عن محتواها أو عملها، وتسري شروطها الخاصة عند استخدامك لتلك الخدمات.',
      ] },
      liability: { h: 'حدود المسؤولية', body: [
        'في الحدود التي يسمح بها القانون، لا يتحمّل {brand} المسؤولية عن الأضرار غير المباشرة الناتجة عن استخدام الموقع أو تعذّر استخدامه — بما في ذلك أخطاء الحساب وتأخر الإشعارات وفقدان البيانات (مثلاً عند مسح تخزين المتصفح).',
        'ولا يحدّ هذا البند من المسؤولية التي لا يجوز تقييدها قانوناً، ولا من حقوقك الإلزامية بصفتك مستهلكاً.',
      ] },
      changes: { h: 'تعديل الشروط', body: [
        'قد نحدّث هذه الشروط، ويظهر تاريخ آخر تحديث أعلى الصفحة. واستمرارك في استخدام الموقع بعد التعديل يُعدّ قبولاً للشروط المحدَّثة.',
      ] },
      law: { h: 'القانون الواجب التطبيق', when: IF_COUNTRY, body: [
        'تخضع هذه الشروط لقوانين الدولة التالية: {country}. وتبقى حقوقك الإلزامية بصفتك مستهلكاً بموجب قوانين بلد إقامتك سارية.',
      ] },
      contact: { h: 'التواصل', body: [
        { when: IF_EMAIL, p: 'أرسل أسئلتك حول هذه الشروط عبر البريد الإلكتروني:' },
        { when: IF_NO_EMAIL, p: 'يمكنك إرسال أسئلتك حول هذه الشروط إلى حساب الموقع الرسمي على إنستغرام:' },
        { contact: true },
      ] },
    },
  },

  tr: {
    title: 'Kullanım Şartları',
    lead: '{brand} sitesi ve uygulamasının kullanım kuralları. Siteyi kullanarak bu şartları kabul etmiş olursunuz.',
    sections: {
      about: { h: 'Hizmet hakkında', body: [
        '{brand}; Kur’an, namaz vakitleri, hadis, dua, zikir, zekât hesaplayıcı, kıble yönü, yapay zekâ asistanı ve diğer İslami bilgi bölümlerinden oluşan çevrim içi bir platformdur. Hizmet **ücretsiz ve reklamsızdır**; kullanmak için hesap açmak gerekmez.',
        'Site hiçbir ödeme kabul etmez. Hayır ve sadaka bölümleri yalnızca bilgi ve kişisel not amaçlıdır.',
      ] },
      asis: { h: 'Hizmet “olduğu gibi” sunulur', body: [
        'Hizmeti “olduğu gibi” ve “mümkün olduğu ölçüde” sunuyoruz. İçeriğin doğru olması için çalışıyoruz; ancak sitenin kesintisiz ve hatasız çalışacağını, her bilginin eksiksiz ve güncel olacağını garanti etmiyoruz.',
        'Bölümleri dilediğimiz zaman değiştirebilir, geçici olarak durdurabilir veya kapatabiliriz. Bazı özellikler üçüncü taraf hizmetlere (örneğin namaz vakitleri ve Kur’an metni) bağlıdır; bu hizmetlere ulaşılamadığında ilgili özellikler çalışmayabilir.',
      ] },
      religious: { h: 'Dinî içerik hakkında', body: [
        'Sitedeki dinî içerik **eğitim ve bilgilendirme** amaçlıdır. Bir âlimin tavsiyesinin, fetvanın veya dinî eğitimin yerini tutmaz.',
        { ul: [
          'Birçok konuda mezhepler ve âlimler arasında farklı görüşler vardır; site bunların tamamını kapsamaz.',
          'Her hadisin altında kaynağı belirtilir. Hüküm çıkarmak için hadisi bağlamı içinde ve âlimlerin şerhleriyle incelemek gerekir.',
          'Bir hata görürseniz [bize bildirin]({toContact}); kontrol edip düzeltiriz.',
        ] },
      ] },
      quran: { h: 'Kur’an metni ve mealler', body: [
        'Kur’an’ın Arapça metni asıldır. Diğer dillerdeki metinler **meal**, yani anlam tercümesidir; mütercimin anlayışını yansıtır ve Kur’an’ın kendisi sayılmaz.',
        'Meallerin, kıraat kayıtlarının ve tefsirin telif hakları ilgili mütercimlere ve yayıncılara aittir. Ayrıntılar: [Kaynaklar ve Lisanslar]({toLicenses}).',
      ] },
      prayer: { h: 'Namaz vakitleri, kıble ve takvim', body: [
        { ul: [
          '**Namaz vakitleri astronomik bir hesaplamadır** (varsayılan olarak Diyanet yöntemiyle). Yerel caminin veya resmî dinî kurumun takviminden birkaç dakika farklı olabilir. Özellikle imsak ve iftar vaktini yerel caminizden veya resmî takvimden kontrol edin.',
          '**Kıble yönü** cihazınızın pusulasına ve konum bilgisine bağlıdır; manyetik etkiler ve sensörün hassasiyeti sonucu etkileyebilir.',
          '**Hicri takvim** hesaplamaya dayanır ve hilal gözlemine göre ilan edilen tarihten bir gün farklı olabilir.',
          '**Bildirimler** cihaz ayarlarına, güç tasarrufu moduna veya ağa bağlı olarak gecikebilir ya da ulaşmayabilir. Namaz vaktini yalnızca bildirimlere güvenerek belirlemeyin.',
        ] },
      ] },
      ai: { h: 'Yapay zekâ asistanı', body: [
        'Yapay zekâ asistanının cevapları bir yapay zekâ modeli tarafından otomatik olarak üretilir ve **yanlış, eksik veya güncelliğini yitirmiş** olabilir.',
        { ul: [
          '**Yapay zekâ cevabı fetva değildir.** Dinî hükümler için güvenilir bir âlime danışın.',
          'Tıbbi, hukuki ve mali konularda yapay zekâ cevaplarına dayanmayın.',
          'Yapay zekâ asistanını yasa dışı, hakaret içeren, nefreti körükleyen veya başkalarına zarar veren içerik üretmek için kullanmak yasaktır.',
          'Kötüye kullanımı önlemek için istek sayısı sınırlandırılmıştır.',
        ] },
        'Soruların nasıl işlendiği [Gizlilik Politikası]({toPrivacy}) sayfasında açıklanmıştır.',
      ] },
      tools: { h: 'Hesaplayıcılar ve tahminler', body: [
        'Zekât hesaplayıcı ve diğer araçlar yaklaşık sonuç verir: döviz kurları ile altın ve gümüş fiyatları anlık fiyatlardan farklı olabilir. Zekâtın miktarı ve şartları hakkında son karar size aittir; şüpheli durumlarda bir âlime danışın.',
      ] },
      conduct: { h: 'Kullanıcı davranışı', body: [
        'Siteyi kullanırken şunlar yasaktır:',
        { ul: [
          'sitenin veya sunucunun işleyişini bozmaya, aşırı yüklemeye ya da istek sınırlarını aşmaya çalışmak;',
          'güvenlik önlemlerini atlatmak, yönetim bölümlerine izinsiz girmeye çalışmak;',
          'içeriği otomatik araçlarla toplu hâlde toplamak;',
          'sitenin içeriğini veya yapay zekâ cevaplarını çarpıtarak {brand} adına resmî dinî görüş gibi sunmak.',
        ] },
      ] },
      ip: { h: 'Fikrî mülkiyet', body: [
        'Sitenin tasarımı, yazılım kodu, logosu ve siteye ait özgün metinler {brand} projesine aittir.',
        'Kur’an metni, mealler, kıraat kayıtları, hadis tercümeleri, harita verileri, yazı tipleri ve yazılım kütüphaneleri ilgili hak sahiplerine aittir ve onların lisanslarıyla kullanılır — liste: [Kaynaklar ve Lisanslar]({toLicenses}).',
        'Sitedeki içerikten kişisel, eğitim ve ticari olmayan amaçlarla, kaynak göstererek alıntı yapabilirsiniz. Diğer şirketlerin markaları (örneğin {youtube} ve Instagram) sahiplerine aittir.',
      ] },
      links: { h: 'Dış bağlantılar ve hizmetler', body: [
        'Sitede üçüncü tarafların videoları ({youtube}), haritalar ({gmaps}) ve başka sitelere bağlantılar bulunur. Bunların içeriğinden ve işleyişinden sorumlu değiliz; bu hizmetleri kullanırken onların kendi şartları geçerlidir.',
      ] },
      liability: { h: 'Sorumluluğun sınırlandırılması', body: [
        'Kanunun izin verdiği ölçüde {brand}, sitenin kullanılmasından veya kullanılamamasından doğan dolaylı zararlardan — hesaplama hataları, geciken bildirimler veya veri kaybı (örneğin tarayıcı depolaması temizlendiğinde) dahil — sorumlu değildir.',
        'Bu madde, kanunen sınırlandırılamayan sorumluluğu ve tüketici olarak zorunlu haklarınızı sınırlamaz.',
      ] },
      changes: { h: 'Şartlarda değişiklik', body: [
        'Bu şartları güncelleyebiliriz. Son güncelleme tarihi sayfanın üstünde gösterilir. Değişiklikten sonra siteyi kullanmaya devam ederseniz güncellenmiş şartları kabul etmiş sayılırsınız.',
      ] },
      law: { h: 'Uygulanacak hukuk', when: IF_COUNTRY, body: [
        'Bu şartlar şu ülkenin mevzuatına tabidir: {country}. Yaşadığınız ülkenin kanunlarının tüketici olarak size tanıdığı zorunlu haklar saklıdır.',
      ] },
      contact: { h: 'İletişim', body: [
        { when: IF_EMAIL, p: 'Şartlarla ilgili sorularınızı e-posta ile gönderin:' },
        { when: IF_NO_EMAIL, p: 'Şartlarla ilgili sorularınızı sitenin resmî Instagram hesabına yazabilirsiniz:' },
        { contact: true },
      ] },
    },
  },
}

export default function TermsPage({ setPage }) {
  const { lang } = useLang()
  return <LegalDocument docKey="terms" doc={DOC[lang] || DOC.az} setPage={setPage} />
}
