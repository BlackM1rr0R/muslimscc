import { useLang } from '../contexts/LangContext'
import LegalDocument, { IF_EMAIL, IF_NO_EMAIL, IF_OPERATOR } from '../components/LegalDocument'

// ═══════════════════════════════════════════════════════
// Məxfilik siyasəti — saytın REAL məlumat axınına uyğun (2026-10 kod auditi):
//   • hesab/qeydiyyat yoxdur; tərcihlər yalnız brauzerdə (localStorage / sessionStorage)
//   • kuki qoyulmur, analitika/reklam/izləmə yoxdur → razılıq banneri lazım deyil
//   • push: Firestore fcm_tokens/<token> { token, userAgent, lang, loc, daily?, azan?, createdAt, updatedAt }
//     (src/firebase/messaging.js); "Söndür" sənədi silir; ölü token server tərəfindən silinir
//   • AI: sual + söhbətin son mesajları → server/server.js → OpenRouter → model (standart: Google Gemini);
//     server mətni saxlamır və loglamır; rate limit {ip}-ni 1 dəqiqə yaddaşda tutur
//   • nginx access log (statik fayllar loglanmır) — Docker json-file, 10 MB × 3 fayl
//   • mobil tətbiq: namaz xatırlatmaları cihazda planlaşdırılır (serverə ünvan getmir)
// Kodda yeni məlumat axını əlavə olunanda bu mətni də yenilə və BRAND.legal.effectiveDate-i dəyiş.
// Yer tutucular və işarələmə: components/LegalDocument.jsx.
// ═══════════════════════════════════════════════════════

const DOC = {
  az: {
    title: 'Məxfilik siyasəti',
    lead: '{brand} hansı məlumatları emal edir, harada saxlayır və kimlə paylaşır — sadə dillə və saytın real işləməsinə uyğun.',
    sections: {
      summary: { h: 'Qısaca', body: [
        { ul: [
          '**Hesab və qeydiyyat yoxdur.** Adınızı, e-poçtunuzu və ya telefon nömrənizi soruşmuruq.',
          '**Reklam, analitika və izləmə yoxdur.** Saytda izləmə kukisi, reklam şəbəkəsi və ya ziyarətçi statistikası xidməti işləmir.',
          '**Tərcihləriniz cihazınızda qalır.** Dil, tema, şəhər, sevimlilər, zikr, hifz, dua gündəliyi və s. yalnız brauzerinizin yaddaşında saxlanılır.',
          '**Serverə yalnız zəruri olan gedir:** bildirişləri açsanız — bildiriş ünvanı və seçdiyiniz şəhər; AI köməkçiyə sual versəniz — sualınızın mətni.',
        ] },
      ] },
      controller: { h: 'Bu siyasət nəyə aiddir', body: [
        'Bu siyasət {brand} saytına ({domain}) və onun mobil tətbiqinə aiddir. Xidmət pulsuzdur və reklamsızdır.',
        { when: IF_OPERATOR, p: 'Xidməti **{operator}** idarə edir və bu siyasətdə təsvir olunan məlumatların emalına görə məsuliyyət daşıyır.' },
        'Sual və müraciətlər üçün [Əlaqə]({toContact}) bölməsinə baxın.',
      ] },
      local: { h: 'Brauzerinizdə saxlanan məlumatlar', body: [
        'Saytın funksiyaları üçün lazım olan tərcihlər brauzerin yerli yaddaşında ({localstorage}) və sessiya yaddaşında ({sessionstorage}) saxlanılır. Bu məlumatlar **bizim serverə göndərilmir** (istisnalar aşağıdakı bölmələrdə ayrıca göstərilib) və yalnız həmin brauzerdə əlçatandır.',
        { table: {
          head: ['Nə', 'Harada', 'Nə qədər'],
          rows: [
            ['Dil, tema (işıqlı/qaranlıq), əlçatanlıq ayarları, menyu vəziyyəti', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Seçilmiş şəhər və ya xüsusi yer, son seçilən şəhərlər', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Sevimli hədis və dualar, Quranda oxu yeri, son axtarışlar', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Zikr sayğacı, hifz, gündəlik ibadət və namaz statistikası, viktorina və oyun xalları, təqvim xatırlatmaları', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Dua gündəliyi və sədəqə qeydləri', 'Yerli yaddaş — yalnız bu cihazda', 'Siz silənə qədər'],
            ['AI köməkçi ilə söhbət tarixçəsi', 'Yerli yaddaş', '"Söhbəti təmizlə" düyməsinə basana və ya silənə qədər'],
            ['Bildiriş ayarları, bildiriş ünvanının surəti, oxunmuş elanlar, gizlədilmiş xatırlatmalar', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Müvəqqəti surətlər: namaz vaxtları, ayələr, siyahıda mövqe', 'Sessiya yaddaşı', 'Brauzer tabı bağlanana qədər'],
            ['Oflayn iş üçün səhifələrin və cavabların surəti', 'Brauzerin keşi ({sw})', 'Brauzer təmizləyənə və ya saytın yeni versiyasına qədər'],
          ],
        } },
        '**Necə silmək olar:** brauzerin ayarlarında {domain} üçün "sayt məlumatlarını" (və ya "kukiləri və sayt məlumatlarını") silin. Bu, yuxarıdakı bütün qeydləri — o cümlədən dua gündəliyini və statistikanı — geri qaytarılmaz şəkildə silir. Məxfi (inkoqnito) rejimdə isə məlumatlar pəncərə bağlananda öz-özünə silinir.',
        { note: 'Bu qeydlərin ehtiyat nüsxəsi bizdə yoxdur: cihazı və ya brauzeri dəyişsəniz, onlar yeni cihaza köçmür.' },
      ] },
      cookies: { h: 'Kukilər', body: [
        '{brand} **kuki qoymur** və izləmə, reklam və ya analitika məqsədli heç bir texnologiya istifadə etmir. Yuxarıda təsvir olunan yerli yaddaş yalnız sizin istədiyiniz funksiyaların işləməsi üçündür, ona görə də ayrıca "kuki razılığı" pəncərəsi göstərmirik.',
        'Üçüncü tərəflər öz kukilərini qoya bilər: {cloudflare} saytı hücumlardan qorumaq üçün zəruri texniki kuki yaza bilər; {youtube} isə videonu oynatmağa başlayanda öz qaydalarına uyğun kuki istifadə edə bilər.',
      ] },
      push: { h: 'Push bildirişləri', body: [
        'Bildirişlər yalnız siz icazə verəndə açılır. İcazə verdikdə {fcm} brauzerinizə bildiriş ünvanı (cihaza bildiriş çatdırmaq üçün təsadüfi simvollardan ibarət açar) verir və biz {firestore} verilənlər bazasında belə bir qeyd saxlayırıq:',
        { ul: [
          'bildiriş ünvanı;',
          'brauzerin texniki təsviri (brauzerin və əməliyyat sisteminin adı, versiyası);',
          'interfeys diliniz;',
          'seçdiyiniz namaz yeri: koordinatlar, saat qurşağı, şəhər adı və namaz vaxtının hesablama metodu (siyahıdan şəhər seçmisinizsə — şəhərin mərkəzi; "yerimi təyin et" ilə xüsusi yer seçmisinizsə — həmin yerin təxmini koordinatları);',
          'bildiriş seçimləriniz və qeydin yaradılma/yenilənmə vaxtı.',
        ] },
        '**Nə üçün:** serverimiz hər abunəçiyə öz şəhərinin azan vaxtında bildiriş göndərir; həmçinin bütün abunəçilərə ümumi elanlar göndərilə bilər.',
        '**Nə qədər:** siz bildirişləri söndürənə qədər. Saytdakı "Bildirişlər" panelində **"Söndür"** düyməsinə basanda qeyd verilənlər bazasından dərhal silinir. Bildirişləri yalnız brauzer və ya telefon ayarlarından bağlasanız, ünvan etibarsız olur və növbəti göndərişdə server bunu görüb qeydi silir.',
        { note: 'Mobil tətbiqdə namaz xatırlatmaları cihazın özündə planlaşdırılır — bunun üçün serverə ünvan göndərilmir.' },
      ] },
      ai: { h: 'AI köməkçi', body: [
        'AI köməkçiyə sual verdikdə sualınızın mətni, cari söhbətin son bir neçə mesajı və interfeys diliniz serverimizə, oradan isə {openrouter} xidməti vasitəsilə süni intellekt modelinə (hazırda {gemini}) göndərilir. Cavab eyni yolla geri qayıdır.',
        { ul: [
          'Serverimiz söhbətin mətnini **saxlamır və loglara yazmır** — yalnız texniki göstəricilər (cavabın müddəti və uzunluğu) qeyd olunur.',
          'Söhbət tarixçəsi yalnız brauzerinizdə saxlanılır; "Söhbəti təmizlə" ilə silə bilərsiniz.',
          'Sui-istifadənin qarşısını almaq üçün {ip} ünvanınız bir dəqiqəlik sorğu limiti üçün serverin yaddaşında qısa müddət saxlanılır.',
          '{openrouter} və model təminatçısı sorğunu öz məxfilik siyasətlərinə uyğun emal edir.',
        ] },
        { note: 'AI köməkçiyə ad, ünvan, sağlamlıq və ya ailə vəziyyəti kimi şəxsi məlumat yazmayın.' },
      ] },
      location: { h: 'Yer məlumatı', body: [
        'Cihazınızın yerini yalnız siz düyməyə basanda və brauzer icazə verəndə istəyirik:',
        { ul: [
          '**Şəhəri təyin etmək:** ən yaxın şəhər cihazınızın özündə hesablanır.',
          '**Qiblə istiqaməti:** tamamilə cihazınızda hesablanır, heç yerə göndərilmir.',
          '**Məscid axtarışı:** yerinizin koordinatları yaxınlıqdakı məscidləri tapmaq üçün {osm} məlumat xidmətinə ({overpass}) göndərilir.',
          '**Namaz vaxtları:** seçdiyiniz yerin koordinatları və saat qurşağı vaxtları hesablamaq üçün aladhan.com xidmətinə göndərilir.',
          '**Şəhər axtarışı:** yazdığınız şəhər adı {openmeteo} xidmətinə göndərilir.',
          '**Xəritədə aç / Marşrut:** bu linklərə basanda {gmaps} koordinatlarla yeni tabda açılır.',
        ] },
      ] },
      thirdparty: { h: 'Üçüncü tərəf xidmətlər', body: [
        'Sayt aşağıdakı xidmətlərdən istifadə edir. Brauzeriniz onlara qoşulanda hər internet sorğusunda olduğu kimi {ip} ünvanınız və brauzer məlumatı həmin xidmətə məlum olur; onlar bu məlumatı öz siyasətlərinə uyğun emal edir.',
        { table: {
          head: ['Xidmət', 'Nə üçün', 'Nə ötürülür'],
          rows: [
            ['{cloudflare}', 'Saytın çatdırılması (CDN) və hücumlardan qorunma', 'Sayta edilən bütün sorğular'],
            ['{firebase} ({firestore}, {fcm})', 'Elanlar, videolar, kitablar kimi məzmunun oxunması; push bildirişləri', 'Məzmun sorğuları; bildiriş açılıbsa — yuxarıdakı qeyd'],
            ['{openrouter}, {gemini}', 'AI köməkçinin cavabları', 'Sual və söhbətin son mesajları (serverimiz vasitəsilə)'],
            ['aladhan.com', 'Namaz vaxtlarının hesablanması', 'Seçilmiş yerin koordinatları, saat qurşağı, metod'],
            ['{alquran}, {islamicnetwork}, {qurancom}', 'Quran mətni, tərcümələr, qiraət səsləri', 'Surə/ayə sorğuları'],
            ['{osm} ({overpass})', 'Yaxınlıqdakı məscidlərin axtarışı', 'Axtarış bölgəsinin koordinatları'],
            ['{openmeteo}', 'Dünya şəhərlərinin axtarışı', 'Yazdığınız şəhər adı'],
            ['{exchangerate}', 'Zəkat kalkulyatorunda valyuta məzənnələri', 'Yalnız məzənnə sorğusu'],
            ['{youtube}', 'Videoların önizləmə şəkilləri və oynadılması', 'Videolar bölməsi açılanda şəkil sorğuları; oynatmağa basanda video'],
            ['{gmaps}, Instagram', 'Xəritə və sosial şəbəkə linkləri', 'Yalnız linkə basanda'],
          ],
        } },
        'Məlumatlarınızı heç kimə satmırıq, reklam və ya profil yaratmaq üçün ötürmürük.',
      ] },
      logs: { h: 'Server qeydləri (loglar)', body: [
        'Hər veb server kimi bizim server də ({nginx}) daxil olan sorğular haqqında texniki qeyd aparır: {ip} ünvanı, vaxt, açılan ünvan, cavab kodu və brauzer məlumatı. Şəkil, şrift və skript kimi statik faylların sorğuları qeyd olunmur.',
        'Bu qeydlər yalnız xətaları aradan qaldırmaq və saytı hücumlardan qorumaq üçündür. Onlar ölçü ilə məhdudlaşdırılıb (təxminən 10 MB-lıq 3 fayl): yer dolduqca ən köhnə qeydlər avtomatik olaraq yenilərinin altında silinir. Sorğular serverə {cloudflare} vasitəsilə çatır və o da trafiki öz siyasətinə uyğun emal edir.',
      ] },
      purposes: { h: 'Məqsədlər və hüquqi əsas', body: [
        { ul: [
          '**Xidmətin göstərilməsi** — saytın işləməsi, təhlükəsizliyi və xətaların aradan qaldırılması (server qeydləri, {cloudflare}): saytı etibarlı işlətməkdə qanuni marağımız.',
          '**Sizin razılığınız** — push bildirişləri və cihazın yerinə giriş: brauzer icazəni yalnız siz təsdiq etdikdən sonra verir; istənilən vaxt geri götürə bilərsiniz.',
          '**Sizin sorğunuz** — AI köməkçi, şəhər və məscid axtarışı: məlumat yalnız siz həmin funksiyanı işlədəndə və yalnız cavab almaq üçün göndərilir.',
        ] },
      ] },
      rights: { h: 'Hüquqlarınız', body: [
        'Fərdi məlumatların qorunması haqqında qanunvericilik (o cümlədən Azərbaycan Respublikasının "Fərdi məlumatlar haqqında" Qanunu və Avropa İttifaqının Ümumi Məlumatların Qorunması Qaydası — {gdpr}) ruhunda sizin aşağıdakı hüquqlarınız var:',
        { ul: [
          'haqqınızda hansı məlumatın emal olunduğunu öyrənmək;',
          'məlumatın düzəldilməsini və ya silinməsini tələb etmək;',
          'emala etiraz etmək və verdiyiniz razılığı istənilən vaxt geri götürmək;',
          'nəzarət orqanına şikayət etmək.',
        ] },
        'Hesab olmadığı üçün çox vaxt sizi tanımırıq və məlumatın çoxu onsuz da yalnız sizin cihazınızdadır — onu brauzerdə özünüz silə bilərsiniz. Bildiriş qeydini "Söndür" düyməsi ilə dərhal silə bilərsiniz. Digər sorğular üçün [bizimlə əlaqə saxlayın]({toContact}).',
      ] },
      children: { h: 'Uşaqlar', body: [
        'Sayt bütün yaşlar üçün nəzərdə tutulub, o cümlədən uşaqlar üçün bölmə var. Hesab olmadığı üçün uşaqlardan bilərəkdən fərdi məlumat toplamırıq. Uşaqların AI köməkçidən və bildirişlərdən valideynin nəzarəti ilə istifadə etməsini tövsiyə edirik.',
      ] },
      security: { h: 'Təhlükəsizlik', body: [
        'Saytla bütün əlaqə HTTPS üzərindən şifrələnmiş bağlantı ilə qurulur. Serverə giriş məhdudlaşdırılıb və sirli açarlar kodda saxlanılmır. Buna baxmayaraq, internetdə heç bir üsul tam təhlükəsizliyə zəmanət vermir.',
      ] },
      transfers: { h: 'Məlumatın başqa ölkələrə ötürülməsi', body: [
        'Yuxarıda adı çəkilən xidmətlərin serverləri müxtəlif ölkələrdə (o cümlədən ABŞ-da və Avropa İttifaqında) yerləşə bilər. Bu xidmətlərdən istifadə etdikdə müvafiq məlumat həmin ölkələrdə emal oluna bilər.',
      ] },
      changes: { h: 'Dəyişikliklər', body: [
        'Sayta yeni funksiya əlavə olunduqda bu siyasəti yeniləyə bilərik. Son yenilənmə tarixi səhifənin yuxarısında göstərilir; əhəmiyyətli dəyişiklikləri saytda ayrıca elan edəcəyik.',
      ] },
      contact: { h: 'Əlaqə', body: [
        { when: IF_EMAIL, p: 'Məxfiliklə bağlı sual və müraciətlərinizi e-poçtla göndərin:' },
        { when: IF_NO_EMAIL, p: 'Məxfiliklə bağlı sual və müraciətlərinizi saytın rəsmi Instagram səhifəsinə yaza bilərsiniz:' },
        { contact: true },
        'Həmçinin bax: [İstifadə şərtləri]({toTerms}) və [Mənbələr və lisenziyalar]({toLicenses}).',
      ] },
    },
  },

  en: {
    title: 'Privacy Policy',
    lead: 'What data {brand} processes, where it is kept and who it is shared with — in plain language and matching how the site actually works.',
    sections: {
      summary: { h: 'In short', body: [
        { ul: [
          '**No accounts, no sign-up.** We never ask for your name, email or phone number.',
          '**No ads, analytics or tracking.** The site runs no tracking cookies, ad networks or visitor-statistics services.',
          '**Your preferences stay on your device.** Language, theme, city, favourites, dhikr, hifz, your dua journal and so on are stored only in your browser.',
          '**Only what is necessary reaches our server:** if you turn on notifications — a notification address and your chosen city; if you ask the AI assistant — the text of your question.',
        ] },
      ] },
      controller: { h: 'Scope of this policy', body: [
        'This policy covers the {brand} website ({domain}) and its mobile app. The service is free and ad-free.',
        { when: IF_OPERATOR, p: 'The service is operated by **{operator}**, who is responsible for the processing described in this policy.' },
        'For questions and requests, see the [Contact]({toContact}) section.',
      ] },
      local: { h: 'Data stored in your browser', body: [
        'Preferences the site needs in order to work are kept in your browser’s local storage ({localstorage}) and session storage ({sessionstorage}). This data is **not sent to our server** (exceptions are described separately below) and is available only in that browser.',
        { table: {
          head: ['What', 'Where', 'How long'],
          rows: [
            ['Language, theme (light/dark), accessibility settings, menu state', 'Local storage', 'Until you delete it'],
            ['Selected city or custom location, recently chosen cities', 'Local storage', 'Until you delete it'],
            ['Favourite hadith and duas, your place in the Quran, recent searches', 'Local storage', 'Until you delete it'],
            ['Dhikr counter, hifz, daily worship and prayer statistics, quiz and game scores, calendar reminders', 'Local storage', 'Until you delete it'],
            ['Dua journal and charity log', 'Local storage — on this device only', 'Until you delete it'],
            ['AI assistant chat history', 'Local storage', 'Until you press “Clear chat” or delete it'],
            ['Notification settings, a copy of the notification address, read announcements, dismissed reminders', 'Local storage', 'Until you delete it'],
            ['Temporary copies: prayer times, verses, list position', 'Session storage', 'Until the browser tab is closed'],
            ['Copies of pages and responses for offline use', 'Browser cache (service worker)', 'Until the browser clears it or a new site version arrives'],
          ],
        } },
        '**How to delete it:** in your browser settings, clear the “site data” (or “cookies and site data”) for {domain}. This permanently removes everything above, including your dua journal and statistics. In private (incognito) mode, the data is deleted automatically when the window is closed.',
        { note: 'We keep no backup of this data: if you switch devices or browsers, it does not move with you.' },
      ] },
      cookies: { h: 'Cookies', body: [
        '{brand} **sets no cookies** and uses no technology for tracking, advertising or analytics. The local storage described above serves only the features you choose to use, which is why we do not show a separate “cookie consent” banner.',
        'Third parties may set their own cookies: {cloudflare} may set a strictly necessary technical cookie to protect the site from attacks, and {youtube} may use cookies under its own rules once you start playing a video.',
      ] },
      push: { h: 'Push notifications', body: [
        'Notifications are turned on only when you give permission. When you do, {fcm} gives your browser a notification address (a random key used to deliver notifications to your device), and we store a record like this in the {firestore} database:',
        { ul: [
          'the notification address;',
          'a technical description of your browser (user agent: browser and operating system name and version);',
          'your interface language;',
          'your chosen prayer location: coordinates, time zone, city name and prayer-time calculation method (the city centre if you picked a city from the list; approximate coordinates if you set a custom location with “locate me”);',
          'your notification choices and when the record was created/updated.',
        ] },
        '**Why:** our server sends each subscriber a notification at the adhan time of their own city; general announcements may also be sent to all subscribers.',
        '**How long:** until you turn notifications off. Pressing **“Disable”** in the site’s Notifications panel deletes the record from the database immediately. If you block notifications only in your browser or phone settings, the address becomes invalid and the server deletes the record the next time a delivery fails.',
        { note: 'In the mobile app, prayer reminders are scheduled on the device itself — no address is sent to our server for them.' },
      ] },
      ai: { h: 'AI assistant', body: [
        'When you ask the AI assistant a question, the text of your question, the last few messages of the current conversation and your interface language are sent to our server and from there, through the {openrouter} service, to an artificial-intelligence model (currently {gemini}). The answer comes back the same way.',
        { ul: [
          'Our server **does not store or log** the conversation text — only technical figures (response time and length) are recorded.',
          'Your chat history is stored only in your browser; you can delete it with “Clear chat”.',
          'To prevent abuse, your {ip} address is held briefly in the server’s memory for a one-minute request limit.',
          '{openrouter} and the model provider process the request under their own privacy policies.',
        ] },
        { note: 'Please do not share personal details such as your name, address, health or family situation with the AI assistant.' },
      ] },
      location: { h: 'Location data', body: [
        'We ask for your device’s location only when you press a button and your browser grants permission:',
        { ul: [
          '**Detecting your city:** the nearest city is worked out on your device.',
          '**Qibla direction:** calculated entirely on your device and never sent anywhere.',
          '**Mosque finder:** your coordinates are sent to the {osm} data service ({overpass}) to find nearby mosques.',
          '**Prayer times:** the coordinates and time zone of your chosen location are sent to aladhan.com to calculate the times.',
          '**City search:** the city name you type is sent to {openmeteo}.',
          '**Open in maps / Directions:** these links open {gmaps} in a new tab with the coordinates.',
        ] },
      ] },
      thirdparty: { h: 'Third-party services', body: [
        'The site uses the services below. As with any request on the internet, when your browser connects to them your {ip} address and browser details become known to that service, which processes them under its own policy.',
        { table: {
          head: ['Service', 'Purpose', 'What is sent'],
          rows: [
            ['{cloudflare}', 'Delivering the site (CDN) and protecting it from attacks', 'All requests to the site'],
            ['{firebase} ({firestore}, {fcm})', 'Loading content such as announcements, videos and books; push notifications', 'Content requests; if notifications are on — the record above'],
            ['{openrouter}, {gemini}', 'AI assistant answers', 'Your question and the last messages of the chat (via our server)'],
            ['aladhan.com', 'Calculating prayer times', 'Coordinates of the chosen location, time zone, method'],
            ['{alquran}, {islamicnetwork}, {qurancom}', 'Quran text, translations, recitation audio', 'Surah/verse requests'],
            ['{osm} ({overpass})', 'Finding nearby mosques', 'Coordinates of the search area'],
            ['{openmeteo}', 'Searching cities worldwide', 'The city name you type'],
            ['{exchangerate}', 'Currency rates in the zakat calculator', 'Only the exchange-rate request'],
            ['{youtube}', 'Video thumbnails and playback', 'Thumbnail requests when the Videos section opens; the video once you press play'],
            ['{gmaps}, Instagram', 'Map and social media links', 'Only when you click the link'],
          ],
        } },
        'We never sell your data or pass it on for advertising or profiling.',
      ] },
      logs: { h: 'Server logs', body: [
        'Like any web server, ours ({nginx}) keeps technical records of incoming requests: {ip} address, time, the address requested, the response code and browser details. Requests for static files such as images, fonts and scripts are not logged.',
        'These records are used only to fix errors and protect the site from attacks. They are limited by size (about 3 files of 10 MB): as space fills up, the oldest entries are automatically overwritten. Requests reach our server through {cloudflare}, which also processes the traffic under its own policy.',
      ] },
      purposes: { h: 'Purposes and legal basis', body: [
        { ul: [
          '**Providing the service** — running the site, keeping it secure and fixing errors (server logs, {cloudflare}): our legitimate interest in operating the site reliably.',
          '**Your consent** — push notifications and access to your device’s location: the browser grants permission only after you confirm it, and you can withdraw it at any time.',
          '**Your request** — the AI assistant, city and mosque search: data is sent only when you use that feature and only to get you an answer.',
        ] },
      ] },
      rights: { h: 'Your rights', body: [
        'In the spirit of data-protection law — including the Law of the Republic of Azerbaijan “On Personal Data” and the EU General Data Protection Regulation ({gdpr}) — you have the right to:',
        { ul: [
          'find out what data about you is being processed;',
          'ask for it to be corrected or deleted;',
          'object to processing and withdraw your consent at any time;',
          'lodge a complaint with a supervisory authority.',
        ] },
        'Because there are no accounts, we usually cannot identify you, and most data is only on your device anyway — you can delete it yourself in your browser. You can delete your notification record instantly with the “Disable” button. For anything else, [get in touch]({toContact}).',
      ] },
      children: { h: 'Children', body: [
        'The site is meant for all ages and includes a section for children. Since there are no accounts, we do not knowingly collect personal data from children. We recommend that children use the AI assistant and notifications under a parent’s supervision.',
      ] },
      security: { h: 'Security', body: [
        'All communication with the site goes over an encrypted HTTPS connection. Access to the server is restricted and secret keys are not kept in the code. Even so, no method on the internet can guarantee complete security.',
      ] },
      transfers: { h: 'International transfers', body: [
        'The servers of the services listed above may be located in different countries (including the United States and the European Union). When you use these services, the related data may be processed in those countries.',
      ] },
      changes: { h: 'Changes', body: [
        'We may update this policy when new features are added. The date of the last update is shown at the top of the page; significant changes will also be announced on the site.',
      ] },
      contact: { h: 'Contact', body: [
        { when: IF_EMAIL, p: 'Please send privacy questions and requests by email:' },
        { when: IF_NO_EMAIL, p: 'You can send privacy questions and requests to the site’s official Instagram account:' },
        { contact: true },
        'See also: [Terms of Use]({toTerms}) and [Sources & Licenses]({toLicenses}).',
      ] },
    },
  },

  ru: {
    title: 'Политика конфиденциальности',
    lead: 'Какие данные обрабатывает {brand}, где они хранятся и кому передаются — простым языком и в точном соответствии с тем, как работает сайт.',
    sections: {
      summary: { h: 'Коротко', body: [
        { ul: [
          '**Нет учётных записей и регистрации.** Мы не спрашиваем ваше имя, почту или номер телефона.',
          '**Нет рекламы, аналитики и отслеживания.** На сайте не работают отслеживающие куки, рекламные сети и сервисы статистики посещений.',
          '**Ваши настройки остаются на устройстве.** Язык, тема, город, избранное, зикр, хифз, дневник дуа и прочее хранятся только в вашем браузере.',
          '**На сервер попадает только необходимое:** если вы включите уведомления — адрес для уведомлений и выбранный город; если зададите вопрос ИИ-помощнику — текст вопроса.',
        ] },
      ] },
      controller: { h: 'К чему относится эта политика', body: [
        'Политика распространяется на сайт {brand} ({domain}) и его мобильное приложение. Сервис бесплатный и без рекламы.',
        { when: IF_OPERATOR, p: 'Сервисом управляет **{operator}** — он отвечает за обработку данных, описанную в этой политике.' },
        'По вопросам и запросам обращайтесь через раздел [Контакты]({toContact}).',
      ] },
      local: { h: 'Данные, которые хранятся в вашем браузере', body: [
        'Настройки, нужные для работы сайта, хранятся в локальном хранилище браузера ({localstorage}) и в хранилище сессии ({sessionstorage}). Эти данные **не отправляются на наш сервер** (исключения описаны отдельно ниже) и доступны только в этом браузере.',
        { table: {
          head: ['Что', 'Где', 'Как долго'],
          rows: [
            ['Язык, тема (светлая/тёмная), настройки доступности, состояние меню', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Выбранный город или своё место, недавно выбранные города', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Избранные хадисы и дуа, место чтения Корана, недавние поиски', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Счётчик зикра, хифз, статистика ежедневных поклонений и намазов, баллы викторин и игр, напоминания календаря', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Дневник дуа и записи о садаке', 'Локальное хранилище — только на этом устройстве', 'Пока вы их не удалите'],
            ['История чата с ИИ-помощником', 'Локальное хранилище', 'Пока вы не нажмёте «Очистить чат» или не удалите её'],
            ['Настройки уведомлений, копия адреса уведомлений, прочитанные объявления, скрытые напоминания', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Временные копии: время намаза, аяты, позиция в списке', 'Хранилище сессии', 'До закрытия вкладки'],
            ['Копии страниц и ответов для работы без сети', 'Кэш браузера (сервис-воркер)', 'Пока браузер его не очистит или не выйдет новая версия сайта'],
          ],
        } },
        '**Как удалить:** в настройках браузера удалите «данные сайта» (или «файлы куки и данные сайтов») для {domain}. Это безвозвратно сотрёт всё перечисленное, включая дневник дуа и статистику. В режиме инкогнито данные удаляются сами при закрытии окна.',
        { note: 'Резервных копий этих данных у нас нет: при смене устройства или браузера они не переносятся.' },
      ] },
      cookies: { h: 'Файлы куки', body: [
        '{brand} **не устанавливает файлы куки** и не использует никаких технологий для отслеживания, рекламы или аналитики. Описанное выше локальное хранилище служит только функциям, которыми вы пользуетесь, поэтому отдельное окно «согласия на куки» мы не показываем.',
        'Сторонние сервисы могут устанавливать свои куки: {cloudflare} может записать строго необходимый технический файл куки для защиты сайта от атак, а {youtube} — использовать куки по своим правилам, когда вы запускаете видео.',
      ] },
      push: { h: 'Пуш-уведомления', body: [
        'Уведомления включаются только с вашего разрешения. После этого {fcm} выдаёт браузеру адрес для уведомлений (случайный ключ для доставки уведомлений на ваше устройство), а мы сохраняем в базе данных {firestore} запись следующего вида:',
        { ul: [
          'адрес для уведомлений;',
          'техническое описание браузера (название и версия браузера и операционной системы);',
          'язык интерфейса;',
          'выбранное место для намаза: координаты, часовой пояс, название города и метод расчёта времени (если город выбран из списка — центр города; если своё место задано кнопкой «определить моё место» — приблизительные координаты этого места);',
          'ваш выбор уведомлений и время создания/обновления записи.',
        ] },
        '**Зачем:** сервер отправляет каждому подписчику уведомление во время азана в его городе; также всем подписчикам могут приходить общие объявления.',
        '**Как долго:** пока вы не отключите уведомления. Кнопка **«Отключить»** в панели «Уведомления» на сайте сразу удаляет запись из базы. Если запретить уведомления только в настройках браузера или телефона, адрес становится недействительным, и сервер удаляет запись при следующей неудачной отправке.',
        { note: 'В мобильном приложении напоминания о намазе планируются на самом устройстве — для них адрес на сервер не отправляется.' },
      ] },
      ai: { h: 'ИИ-помощник', body: [
        'Когда вы задаёте вопрос ИИ-помощнику, текст вопроса, несколько последних сообщений текущего диалога и язык интерфейса отправляются на наш сервер, а оттуда через сервис {openrouter} — модели искусственного интеллекта (сейчас это {gemini}). Ответ возвращается тем же путём.',
        { ul: [
          'Наш сервер **не хранит и не записывает в журналы** текст переписки — фиксируются только технические показатели (время и длина ответа).',
          'История чата хранится только в вашем браузере; её можно удалить кнопкой «Очистить чат».',
          'Для защиты от злоупотреблений ваш адрес {ip} ненадолго хранится в оперативной памяти сервера для лимита запросов в одну минуту.',
          '{openrouter} и поставщик модели обрабатывают запрос по своим политикам конфиденциальности.',
        ] },
        { note: 'Не сообщайте ИИ-помощнику личные сведения — имя, адрес, данные о здоровье или семье.' },
      ] },
      location: { h: 'Данные о местоположении', body: [
        'Мы запрашиваем местоположение устройства только после нажатия кнопки и с разрешения браузера:',
        { ul: [
          '**Определение города:** ближайший город вычисляется на вашем устройстве.',
          '**Направление киблы:** рассчитывается полностью на устройстве и никуда не передаётся.',
          '**Поиск мечетей:** ваши координаты отправляются в сервис данных {osm} ({overpass}), чтобы найти мечети поблизости.',
          '**Время намаза:** координаты и часовой пояс выбранного места отправляются на aladhan.com для расчёта.',
          '**Поиск города:** введённое название города отправляется в {openmeteo}.',
          '**Открыть на карте / Маршрут:** по этим ссылкам {gmaps} открывается в новой вкладке с координатами.',
        ] },
      ] },
      thirdparty: { h: 'Сторонние сервисы', body: [
        'Сайт использует перечисленные ниже сервисы. Как и при любом запросе в интернете, при подключении к ним ваш адрес {ip} и данные браузера становятся известны этому сервису, который обрабатывает их по своей политике.',
        { table: {
          head: ['Сервис', 'Зачем', 'Что передаётся'],
          rows: [
            ['{cloudflare}', 'Доставка сайта (CDN) и защита от атак', 'Все запросы к сайту'],
            ['{firebase} ({firestore}, {fcm})', 'Загрузка объявлений, видео, книг и другого содержимого; пуш-уведомления', 'Запросы содержимого; если уведомления включены — запись выше'],
            ['{openrouter}, {gemini}', 'Ответы ИИ-помощника', 'Вопрос и последние сообщения чата (через наш сервер)'],
            ['aladhan.com', 'Расчёт времени намаза', 'Координаты выбранного места, часовой пояс, метод'],
            ['{alquran}, {islamicnetwork}, {qurancom}', 'Текст Корана, переводы, аудио чтения', 'Запросы сур и аятов'],
            ['{osm} ({overpass})', 'Поиск ближайших мечетей', 'Координаты области поиска'],
            ['{openmeteo}', 'Поиск городов мира', 'Введённое название города'],
            ['{exchangerate}', 'Курсы валют в калькуляторе закята', 'Только запрос курса'],
            ['{youtube}', 'Превью и воспроизведение видео', 'Запросы превью при открытии раздела «Видео»; само видео — после нажатия на воспроизведение'],
            ['{gmaps}, Instagram', 'Ссылки на карты и соцсети', 'Только при нажатии на ссылку'],
          ],
        } },
        'Мы не продаём ваши данные и не передаём их для рекламы или составления профилей.',
      ] },
      logs: { h: 'Журналы сервера', body: [
        'Как и любой веб-сервер, наш сервер ({nginx}) ведёт технический журнал входящих запросов: адрес {ip}, время, запрошенный адрес, код ответа и данные браузера. Запросы статических файлов — изображений, шрифтов, скриптов — не записываются.',
        'Журналы нужны только для исправления ошибок и защиты сайта от атак. Их объём ограничен (около 3 файлов по 10 МБ): по мере заполнения самые старые записи автоматически перезаписываются. Запросы доходят до сервера через {cloudflare}, который также обрабатывает трафик по своей политике.',
      ] },
      purposes: { h: 'Цели и правовые основания', body: [
        { ul: [
          '**Оказание услуги** — работа сайта, его безопасность и исправление ошибок (журналы сервера, {cloudflare}): наш законный интерес в надёжной работе сайта.',
          '**Ваше согласие** — пуш-уведомления и доступ к местоположению: браузер даёт разрешение только после вашего подтверждения, отозвать его можно в любой момент.',
          '**Ваш запрос** — ИИ-помощник, поиск городов и мечетей: данные отправляются, только когда вы пользуетесь функцией, и только для получения ответа.',
        ] },
      ] },
      rights: { h: 'Ваши права', body: [
        'В духе законодательства о защите персональных данных — в том числе Закона Азербайджанской Республики «О персональных данных» и Общего регламента ЕС по защите данных ({gdpr}) — вы вправе:',
        { ul: [
          'узнать, какие данные о вас обрабатываются;',
          'потребовать их исправления или удаления;',
          'возразить против обработки и в любой момент отозвать согласие;',
          'подать жалобу в надзорный орган.',
        ] },
        'Поскольку учётных записей нет, обычно мы не можем вас идентифицировать, а большая часть данных и так находится только на вашем устройстве — её можно удалить в браузере самостоятельно. Запись об уведомлениях удаляется сразу кнопкой «Отключить». По остальным вопросам [свяжитесь с нами]({toContact}).',
      ] },
      children: { h: 'Дети', body: [
        'Сайт предназначен для любого возраста, в нём есть раздел для детей. Учётных записей нет, поэтому мы сознательно не собираем персональные данные детей. Рекомендуем, чтобы дети пользовались ИИ-помощником и уведомлениями под присмотром родителей.',
      ] },
      security: { h: 'Безопасность', body: [
        'Всё общение с сайтом идёт по зашифрованному соединению HTTPS. Доступ к серверу ограничен, секретные ключи не хранятся в коде. Тем не менее ни один способ в интернете не даёт полной гарантии безопасности.',
      ] },
      transfers: { h: 'Передача данных в другие страны', body: [
        'Серверы перечисленных сервисов могут находиться в разных странах (в том числе в США и Европейском союзе). При использовании этих сервисов соответствующие данные могут обрабатываться в этих странах.',
      ] },
      changes: { h: 'Изменения', body: [
        'Мы можем обновлять эту политику при появлении новых функций. Дата последнего обновления указана вверху страницы; о существенных изменениях мы дополнительно сообщим на сайте.',
      ] },
      contact: { h: 'Контакты', body: [
        { when: IF_EMAIL, p: 'Вопросы и запросы о конфиденциальности присылайте по электронной почте:' },
        { when: IF_NO_EMAIL, p: 'Вопросы и запросы о конфиденциальности можно написать в официальный аккаунт сайта в Инстаграме:' },
        { contact: true },
        'См. также: [Условия использования]({toTerms}) и [Источники и лицензии]({toLicenses}).',
      ] },
    },
  },

  ar: {
    title: 'سياسة الخصوصية',
    lead: 'ما البيانات التي يعالجها {brand}، وأين تُحفظ، ومع مَن تُشارَك — بلغة واضحة ومطابقة لطريقة عمل الموقع فعلاً.',
    sections: {
      summary: { h: 'باختصار', body: [
        { ul: [
          '**لا حسابات ولا تسجيل.** لا نطلب اسمك ولا بريدك الإلكتروني ولا رقم هاتفك.',
          '**لا إعلانات ولا تحليلات ولا تتبّع.** لا يعمل في الموقع أي ملف تعريف ارتباط للتتبّع ولا شبكة إعلانية ولا خدمة لإحصاء الزوار.',
          '**تفضيلاتك تبقى على جهازك.** اللغة والمظهر والمدينة والمفضّلة والأذكار والحفظ ومفكّرة الدعاء وغيرها تُحفظ في متصفحك فقط.',
          '**لا يصل إلى خادمنا إلا الضروري:** إذا فعّلت الإشعارات — عنوان الإشعارات والمدينة التي اخترتها؛ وإذا سألت المساعد الذكي — نص سؤالك.',
        ] },
      ] },
      controller: { h: 'نطاق هذه السياسة', body: [
        'تشمل هذه السياسة موقع {brand} ({domain}) وتطبيقه للهاتف. الخدمة مجانية وبلا إعلانات.',
        { when: IF_OPERATOR, p: 'يتولّى تشغيل الخدمة **{operator}**، وهو المسؤول عن معالجة البيانات الموصوفة في هذه السياسة.' },
        'للأسئلة والطلبات راجع قسم [التواصل]({toContact}).',
      ] },
      local: { h: 'البيانات المحفوظة في متصفحك', body: [
        'تُحفظ التفضيلات اللازمة لعمل الموقع في التخزين المحلي للمتصفح ({localstorage}) وفي تخزين الجلسة ({sessionstorage}). هذه البيانات **لا تُرسَل إلى خادمنا** (والاستثناءات مبيّنة في الأقسام التالية) ولا يمكن الوصول إليها إلا من هذا المتصفح.',
        { table: {
          head: ['ماذا', 'أين', 'إلى متى'],
          rows: [
            ['اللغة، المظهر (فاتح/داكن)، إعدادات سهولة الوصول، حالة القائمة', 'التخزين المحلي', 'حتى تحذفها'],
            ['المدينة المختارة أو موقع مخصّص، المدن المختارة مؤخراً', 'التخزين المحلي', 'حتى تحذفها'],
            ['الأحاديث والأدعية المفضّلة، موضع القراءة في القرآن، عمليات البحث الأخيرة', 'التخزين المحلي', 'حتى تحذفها'],
            ['عدّاد الأذكار، الحفظ، إحصاءات العبادات اليومية والصلاة، نتائج المسابقات والألعاب، تذكيرات التقويم', 'التخزين المحلي', 'حتى تحذفها'],
            ['مفكّرة الدعاء وسجلّ الصدقات', 'التخزين المحلي — على هذا الجهاز فقط', 'حتى تحذفها'],
            ['سجلّ المحادثة مع المساعد الذكي', 'التخزين المحلي', 'حتى تضغط «مسح المحادثة» أو تحذفه'],
            ['إعدادات الإشعارات، نسخة من عنوان الإشعارات، الإعلانات المقروءة، التذكيرات المخفيّة', 'التخزين المحلي', 'حتى تحذفها'],
            ['نسخ مؤقتة: مواقيت الصلاة، الآيات، موضعك في القائمة', 'تخزين الجلسة', 'حتى إغلاق علامة التبويب'],
            ['نسخ من الصفحات والردود للعمل دون اتصال', 'ذاكرة المتصفح المؤقتة (عامل الخدمة)', 'حتى يمسحها المتصفح أو يصدر إصدار جديد من الموقع'],
          ],
        } },
        '**طريقة الحذف:** امسح «بيانات الموقع» (أو «ملفات تعريف الارتباط وبيانات المواقع») الخاصة بـ {domain} من إعدادات متصفحك. سيؤدي ذلك إلى حذف كل ما سبق نهائياً، بما فيه مفكّرة الدعاء والإحصاءات. وفي وضع التصفح الخاص تُحذف البيانات تلقائياً عند إغلاق النافذة.',
        { note: 'لا نحتفظ بأي نسخة احتياطية من هذه البيانات: إذا غيّرت جهازك أو متصفحك فلن تنتقل معك.' },
      ] },
      cookies: { h: 'ملفات تعريف الارتباط', body: [
        '**لا يضع {brand} أي ملفات تعريف ارتباط**، ولا يستخدم أي تقنية للتتبّع أو الإعلانات أو التحليلات. والتخزين المحلي الموصوف أعلاه يخدم فقط الميزات التي تختار استخدامها، ولهذا لا نعرض نافذة منفصلة لـ«الموافقة على ملفات تعريف الارتباط».',
        'قد تضع جهات خارجية ملفاتها الخاصة: فقد يكتب {cloudflare} ملفاً تقنياً ضرورياً لحماية الموقع من الهجمات، وقد يستخدم {youtube} ملفات تعريف الارتباط وفق قواعده عند بدء تشغيل مقطع فيديو.',
      ] },
      push: { h: 'الإشعارات الفورية', body: [
        'لا تُفعَّل الإشعارات إلا بإذنك. عند منح الإذن تعطي خدمة {fcm} متصفحك عنواناً للإشعارات (مفتاحاً عشوائياً لإيصال الإشعارات إلى جهازك)، ونحفظ في قاعدة بيانات {firestore} سجلاً يتضمّن:',
        { ul: [
          'عنوان الإشعارات؛',
          'وصفاً تقنياً لمتصفحك (اسم المتصفح ونظام التشغيل وإصدارهما)؛',
          'لغة الواجهة؛',
          'موقع الصلاة الذي اخترته: الإحداثيات والمنطقة الزمنية واسم المدينة وطريقة حساب المواقيت (مركز المدينة إذا اخترتها من القائمة؛ والإحداثيات التقريبية إذا حدّدت موقعاً مخصّصاً بزر «حدّد موقعي»)؛',
          'اختياراتك للإشعارات ووقت إنشاء السجل وتحديثه.',
        ] },
        '**الغرض:** يرسل خادمنا إلى كل مشترك إشعاراً عند وقت الأذان في مدينته؛ وقد تُرسَل أيضاً إعلانات عامة إلى جميع المشتركين.',
        '**المدة:** حتى توقف الإشعارات. الضغط على زر **«إيقاف»** في لوحة «الإشعارات» في الموقع يحذف السجل من قاعدة البيانات فوراً. وإذا حظرت الإشعارات من إعدادات المتصفح أو الهاتف فقط، يصبح العنوان غير صالح ويحذف الخادم السجل عند أول محاولة إرسال فاشلة.',
        { note: 'في تطبيق الهاتف تُجدوَل تذكيرات الصلاة على الجهاز نفسه، ولا يُرسَل لأجلها أي عنوان إلى خادمنا.' },
      ] },
      ai: { h: 'المساعد الذكي', body: [
        'عندما تطرح سؤالاً على المساعد الذكي يُرسَل نص سؤالك وآخر بضع رسائل من المحادثة الحالية ولغة الواجهة إلى خادمنا، ومنه عبر خدمة {openrouter} إلى نموذج ذكاء اصطناعي (حالياً {gemini}). ويعود الجواب بالطريق نفسه.',
        { ul: [
          'خادمنا **لا يحفظ نص المحادثة ولا يسجّله** — تُسجَّل فقط مؤشرات تقنية (مدة الجواب وطوله).',
          'يُحفظ سجلّ المحادثة في متصفحك فقط، ويمكنك حذفه بزر «مسح المحادثة».',
          'لمنع إساءة الاستخدام يُحتفَظ بعنوان {ip} الخاص بك لفترة قصيرة في ذاكرة الخادم لتطبيق حدّ الطلبات في الدقيقة.',
          'تعالج {openrouter} والجهة المزوّدة للنموذج الطلب وفق سياسات الخصوصية الخاصة بهما.',
        ] },
        { note: 'لا تكتب للمساعد الذكي معلومات شخصية مثل اسمك أو عنوانك أو حالتك الصحية أو العائلية.' },
      ] },
      location: { h: 'بيانات الموقع الجغرافي', body: [
        'لا نطلب موقع جهازك إلا عندما تضغط زراً ويمنح المتصفح الإذن:',
        { ul: [
          '**تحديد المدينة:** تُحسب أقرب مدينة على جهازك.',
          '**اتجاه القبلة:** يُحسب بالكامل على جهازك ولا يُرسَل إلى أي جهة.',
          '**البحث عن المساجد:** تُرسَل إحداثياتك إلى خدمة بيانات {osm} ({overpass}) للعثور على المساجد القريبة.',
          '**مواقيت الصلاة:** تُرسَل إحداثيات الموقع المختار ومنطقته الزمنية إلى aladhan.com لحساب المواقيت.',
          '**البحث عن مدينة:** يُرسَل اسم المدينة الذي تكتبه إلى {openmeteo}.',
          '**الفتح في الخريطة / الاتجاهات:** تفتح هذه الروابط {gmaps} في علامة تبويب جديدة مع الإحداثيات.',
        ] },
      ] },
      thirdparty: { h: 'خدمات الجهات الخارجية', body: [
        'يستخدم الموقع الخدمات التالية. وكما في أي طلب عبر الإنترنت، عند اتصال متصفحك بها يصبح عنوان {ip} وبيانات المتصفح معروفة لتلك الخدمة، فتعالجها وفق سياستها.',
        { table: {
          head: ['الخدمة', 'الغرض', 'ما يُرسَل'],
          rows: [
            ['{cloudflare}', 'إيصال الموقع (شبكة توزيع المحتوى) وحمايته من الهجمات', 'جميع الطلبات إلى الموقع'],
            ['{firebase} ({firestore}، {fcm})', 'تحميل الإعلانات والفيديوهات والكتب وغيرها؛ الإشعارات الفورية', 'طلبات المحتوى؛ وإذا كانت الإشعارات مفعّلة — السجل المذكور أعلاه'],
            ['{openrouter}، {gemini}', 'إجابات المساعد الذكي', 'السؤال وآخر رسائل المحادثة (عبر خادمنا)'],
            ['aladhan.com', 'حساب مواقيت الصلاة', 'إحداثيات الموقع المختار، المنطقة الزمنية، طريقة الحساب'],
            ['{alquran}، {islamicnetwork}، {qurancom}', 'نص القرآن والترجمات وتسجيلات التلاوة', 'طلبات السور والآيات'],
            ['{osm} ({overpass})', 'البحث عن المساجد القريبة', 'إحداثيات منطقة البحث'],
            ['{openmeteo}', 'البحث عن مدن العالم', 'اسم المدينة الذي تكتبه'],
            ['{exchangerate}', 'أسعار العملات في حاسبة الزكاة', 'طلب سعر الصرف فقط'],
            ['{youtube}', 'الصور المصغّرة للفيديوهات وتشغيلها', 'طلبات الصور عند فتح قسم الفيديو؛ والفيديو نفسه بعد الضغط على التشغيل'],
            ['{gmaps}، إنستغرام', 'روابط الخرائط ووسائل التواصل', 'عند الضغط على الرابط فقط'],
          ],
        } },
        'لا نبيع بياناتك، ولا ننقلها لأغراض الإعلان أو بناء الملفات الشخصية.',
      ] },
      logs: { h: 'سجلات الخادم', body: [
        'كأي خادم ويب، يحتفظ خادمنا ({nginx}) بسجلّ تقني للطلبات الواردة: عنوان {ip}، والوقت، والعنوان المطلوب، ورمز الاستجابة، وبيانات المتصفح. ولا تُسجَّل طلبات الملفات الثابتة كالصور والخطوط والبرامج النصية.',
        'تُستخدم هذه السجلات فقط لإصلاح الأخطاء وحماية الموقع من الهجمات. وحجمها محدود (نحو ثلاثة ملفات بحجم ١٠ ميغابايت لكل منها): وكلما امتلأت المساحة تُستبدل أقدم الإدخالات تلقائياً. وتصل الطلبات إلى خادمنا عبر {cloudflare} الذي يعالج حركة المرور أيضاً وفق سياسته.',
      ] },
      purposes: { h: 'الأغراض والأساس القانوني', body: [
        { ul: [
          '**تقديم الخدمة** — تشغيل الموقع وأمانه وإصلاح الأخطاء (سجلات الخادم، {cloudflare}): مصلحتنا المشروعة في تشغيل الموقع بصورة موثوقة.',
          '**موافقتك** — الإشعارات الفورية والوصول إلى موقع جهازك: لا يمنح المتصفح الإذن إلا بعد تأكيدك، ويمكنك سحبه في أي وقت.',
          '**طلبك** — المساعد الذكي والبحث عن المدن والمساجد: لا تُرسَل البيانات إلا عند استخدامك لهذه الميزة ولغرض الحصول على الجواب فقط.',
        ] },
      ] },
      rights: { h: 'حقوقك', body: [
        'انسجاماً مع تشريعات حماية البيانات الشخصية — ومنها قانون جمهورية أذربيجان «بشأن البيانات الشخصية» واللائحة العامة لحماية البيانات في الاتحاد الأوروبي — يحق لك:',
        { ul: [
          'معرفة البيانات التي تُعالَج عنك؛',
          'طلب تصحيحها أو حذفها؛',
          'الاعتراض على المعالجة وسحب موافقتك في أي وقت؛',
          'تقديم شكوى إلى الجهة الرقابية المختصة.',
        ] },
        'ولأنه لا توجد حسابات فإننا في الغالب لا نستطيع التعرّف عليك، ومعظم البيانات موجود أصلاً على جهازك وحده — ويمكنك حذفه بنفسك من المتصفح. ويمكنك حذف سجل الإشعارات فوراً بزر «إيقاف». ولأي طلب آخر [تواصل معنا]({toContact}).',
      ] },
      children: { h: 'الأطفال', body: [
        'الموقع موجّه لجميع الأعمار، وفيه قسم خاص بالأطفال. ولأنه لا توجد حسابات فإننا لا نجمع عن علم بيانات شخصية من الأطفال. ونوصي بأن يستخدم الأطفال المساعد الذكي والإشعارات تحت إشراف الوالدين.',
      ] },
      security: { h: 'الأمان', body: [
        'يجري كل الاتصال بالموقع عبر اتصال HTTPS مشفّر. والوصول إلى الخادم مقيّد، ولا تُحفظ المفاتيح السرية في الشيفرة. ومع ذلك لا توجد وسيلة على الإنترنت تضمن الأمان التام.',
      ] },
      transfers: { h: 'نقل البيانات إلى دول أخرى', body: [
        'قد تقع خوادم الخدمات المذكورة أعلاه في دول مختلفة (منها الولايات المتحدة ودول الاتحاد الأوروبي). وعند استخدامك لهذه الخدمات قد تُعالَج البيانات المتعلقة بها في تلك الدول.',
      ] },
      changes: { h: 'التعديلات', body: [
        'قد نحدّث هذه السياسة عند إضافة ميزات جديدة. ويظهر تاريخ آخر تحديث أعلى الصفحة، وسنعلن التغييرات المهمة في الموقع أيضاً.',
      ] },
      contact: { h: 'التواصل', body: [
        { when: IF_EMAIL, p: 'أرسل أسئلتك وطلباتك المتعلقة بالخصوصية عبر البريد الإلكتروني:' },
        { when: IF_NO_EMAIL, p: 'يمكنك إرسال أسئلتك وطلباتك المتعلقة بالخصوصية إلى حساب الموقع الرسمي على إنستغرام:' },
        { contact: true },
        'انظر أيضاً: [شروط الاستخدام]({toTerms}) و[المصادر والتراخيص]({toLicenses}).',
      ] },
    },
  },

  tr: {
    title: 'Gizlilik Politikası',
    lead: '{brand} hangi verileri işler, nerede saklar ve kiminle paylaşır — sade bir dille ve sitenin gerçekte nasıl çalıştığına uygun olarak.',
    sections: {
      summary: { h: 'Kısaca', body: [
        { ul: [
          '**Hesap ve üyelik yok.** Adınızı, e-posta adresinizi veya telefon numaranızı sormuyoruz.',
          '**Reklam, analitik ve takip yok.** Sitede takip çerezi, reklam ağı veya ziyaretçi istatistiği hizmeti çalışmaz.',
          '**Tercihleriniz cihazınızda kalır.** Dil, tema, şehir, favoriler, zikir, hıfz, dua günlüğü vb. yalnızca tarayıcınızda saklanır.',
          '**Sunucumuza yalnızca gerekli olan ulaşır:** bildirimleri açarsanız bildirim adresi ve seçtiğiniz şehir; yapay zekâ asistanına soru sorarsanız sorunuzun metni.',
        ] },
      ] },
      controller: { h: 'Bu politikanın kapsamı', body: [
        'Bu politika {brand} sitesini ({domain}) ve mobil uygulamasını kapsar. Hizmet ücretsiz ve reklamsızdır.',
        { when: IF_OPERATOR, p: 'Hizmeti **{operator}** yürütür ve bu politikada anlatılan veri işlemeden sorumludur.' },
        'Soru ve talepleriniz için [İletişim]({toContact}) bölümüne bakın.',
      ] },
      local: { h: 'Tarayıcınızda saklanan veriler', body: [
        'Sitenin çalışması için gereken tercihler tarayıcının yerel depolamasında ({localstorage}) ve oturum depolamasında ({sessionstorage}) tutulur. Bu veriler **sunucumuza gönderilmez** (istisnalar aşağıda ayrıca belirtilmiştir) ve yalnızca o tarayıcıdan erişilebilir.',
        { table: {
          head: ['Ne', 'Nerede', 'Ne kadar süre'],
          rows: [
            ['Dil, tema (açık/koyu), erişilebilirlik ayarları, menü durumu', 'Yerel depolama', 'Siz silene kadar'],
            ['Seçilen şehir veya özel konum, son seçilen şehirler', 'Yerel depolama', 'Siz silene kadar'],
            ['Favori hadis ve dualar, Kur’an’da okuma yeri, son aramalar', 'Yerel depolama', 'Siz silene kadar'],
            ['Zikir sayacı, hıfz, günlük ibadet ve namaz istatistikleri, bilgi yarışması ve oyun puanları, takvim hatırlatmaları', 'Yerel depolama', 'Siz silene kadar'],
            ['Dua günlüğü ve sadaka kayıtları', 'Yerel depolama — yalnızca bu cihazda', 'Siz silene kadar'],
            ['Yapay zekâ asistanıyla sohbet geçmişi', 'Yerel depolama', '“Sohbeti temizle”ye basana veya silene kadar'],
            ['Bildirim ayarları, bildirim adresinin kopyası, okunan duyurular, gizlenen hatırlatmalar', 'Yerel depolama', 'Siz silene kadar'],
            ['Geçici kopyalar: namaz vakitleri, ayetler, listedeki konum', 'Oturum depolaması', 'Tarayıcı sekmesi kapanana kadar'],
            ['Çevrim dışı kullanım için sayfa ve yanıt kopyaları', 'Tarayıcı önbelleği ({sw})', 'Tarayıcı temizleyene veya sitenin yeni sürümüne kadar'],
          ],
        } },
        '**Nasıl silinir:** tarayıcı ayarlarından {domain} için “site verilerini” (veya “çerezleri ve site verilerini”) temizleyin. Bu işlem, dua günlüğü ve istatistikler dahil yukarıdaki her şeyi kalıcı olarak siler. Gizli (inkognito) modda veriler pencere kapanınca kendiliğinden silinir.',
        { note: 'Bu verilerin yedeği bizde yoktur: cihaz veya tarayıcı değiştirirseniz yeni cihaza taşınmazlar.' },
      ] },
      cookies: { h: 'Çerezler', body: [
        '{brand} **çerez kullanmaz**; takip, reklam veya analitik amaçlı hiçbir teknoloji kullanmaz. Yukarıda anlatılan yerel depolama yalnızca sizin kullandığınız özellikler içindir; bu nedenle ayrı bir “çerez onayı” penceresi göstermiyoruz.',
        'Üçüncü taraflar kendi çerezlerini kullanabilir: {cloudflare} siteyi saldırılara karşı korumak için zorunlu bir teknik çerez yazabilir; {youtube} ise bir videoyu oynatmaya başladığınızda kendi kurallarına göre çerez kullanabilir.',
      ] },
      push: { h: 'Anlık bildirimler', body: [
        'Bildirimler yalnızca siz izin verdiğinizde açılır. İzin verdiğinizde {fcm} tarayıcınıza bir bildirim adresi (bildirimleri cihazınıza ulaştırmak için rastgele bir anahtar) verir ve biz {firestore} veri tabanında şu bilgileri içeren bir kayıt saklarız:',
        { ul: [
          'bildirim adresi;',
          'tarayıcınızın teknik tanımı (user agent: tarayıcı ve işletim sisteminin adı ve sürümü);',
          'arayüz diliniz;',
          'seçtiğiniz namaz konumu: koordinatlar, saat dilimi, şehir adı ve vakit hesaplama yöntemi (listeden şehir seçtiyseniz şehir merkezi; “konumumu bul” ile özel konum seçtiyseniz o yerin yaklaşık koordinatları);',
          'bildirim tercihleriniz ve kaydın oluşturulma/güncellenme zamanı.',
        ] },
        '**Neden:** sunucumuz her aboneye kendi şehrinin ezan vaktinde bildirim gönderir; ayrıca tüm abonelere genel duyurular gönderilebilir.',
        '**Ne kadar süre:** bildirimleri kapatana kadar. Sitedeki “Bildirimler” panelinde **“Kapat”** düğmesine bastığınızda kayıt veri tabanından hemen silinir. Bildirimleri yalnızca tarayıcı veya telefon ayarlarından engellerseniz adres geçersiz olur ve sunucu bir sonraki başarısız gönderimde kaydı siler.',
        { note: 'Mobil uygulamada namaz hatırlatmaları cihazın kendisinde planlanır; bunun için sunucumuza adres gönderilmez.' },
      ] },
      ai: { h: 'Yapay zekâ asistanı', body: [
        'Yapay zekâ asistanına soru sorduğunuzda sorunuzun metni, mevcut sohbetin son birkaç mesajı ve arayüz diliniz sunucumuza, oradan da {openrouter} hizmeti aracılığıyla bir yapay zekâ modeline (şu an {gemini}) gönderilir. Cevap aynı yoldan geri döner.',
        { ul: [
          'Sunucumuz sohbet metnini **saklamaz ve kayıtlara yazmaz**; yalnızca teknik göstergeler (cevabın süresi ve uzunluğu) kaydedilir.',
          'Sohbet geçmişiniz yalnızca tarayıcınızda tutulur; “Sohbeti temizle” ile silebilirsiniz.',
          'Kötüye kullanımı önlemek için {ip} adresiniz, dakikalık istek sınırı amacıyla kısa süre sunucunun belleğinde tutulur.',
          '{openrouter} ve model sağlayıcısı isteği kendi gizlilik politikalarına göre işler.',
        ] },
        { note: 'Yapay zekâ asistanına adınız, adresiniz, sağlık veya aile durumunuz gibi kişisel bilgiler yazmayın.' },
      ] },
      location: { h: 'Konum verisi', body: [
        'Cihazınızın konumunu yalnızca siz bir düğmeye bastığınızda ve tarayıcı izin verdiğinde isteriz:',
        { ul: [
          '**Şehri belirleme:** en yakın şehir cihazınızın kendisinde hesaplanır.',
          '**Kıble yönü:** tamamen cihazınızda hesaplanır, hiçbir yere gönderilmez.',
          '**Cami bulucu:** yakındaki camileri bulmak için koordinatlarınız {osm} veri hizmetine ({overpass}) gönderilir.',
          '**Namaz vakitleri:** seçtiğiniz konumun koordinatları ve saat dilimi, vakitlerin hesaplanması için aladhan.com hizmetine gönderilir.',
          '**Şehir arama:** yazdığınız şehir adı {openmeteo} hizmetine gönderilir.',
          '**Haritada aç / Yol tarifi:** bu bağlantılara bastığınızda {gmaps} koordinatlarla yeni sekmede açılır.',
        ] },
      ] },
      thirdparty: { h: 'Üçüncü taraf hizmetler', body: [
        'Site aşağıdaki hizmetleri kullanır. İnternetteki her istekte olduğu gibi, tarayıcınız bunlara bağlandığında {ip} adresiniz ve tarayıcı bilgileriniz ilgili hizmete iletilir; hizmet bunları kendi politikasına göre işler.',
        { table: {
          head: ['Hizmet', 'Amaç', 'Ne iletilir'],
          rows: [
            ['{cloudflare}', 'Sitenin iletimi (CDN) ve saldırılara karşı koruma', 'Siteye yapılan tüm istekler'],
            ['{firebase} ({firestore}, {fcm})', 'Duyurular, videolar, kitaplar gibi içeriklerin yüklenmesi; anlık bildirimler', 'İçerik istekleri; bildirimler açıksa yukarıdaki kayıt'],
            ['{openrouter}, {gemini}', 'Yapay zekâ asistanının cevapları', 'Soru ve sohbetin son mesajları (sunucumuz üzerinden)'],
            ['aladhan.com', 'Namaz vakitlerinin hesaplanması', 'Seçilen konumun koordinatları, saat dilimi, yöntem'],
            ['{alquran}, {islamicnetwork}, {qurancom}', 'Kur’an metni, mealler, kıraat sesleri', 'Sure/ayet istekleri'],
            ['{osm} ({overpass})', 'Yakındaki camilerin aranması', 'Arama bölgesinin koordinatları'],
            ['{openmeteo}', 'Dünya şehirlerinde arama', 'Yazdığınız şehir adı'],
            ['{exchangerate}', 'Zekât hesaplayıcısında döviz kurları', 'Yalnızca kur isteği'],
            ['{youtube}', 'Video önizleme görselleri ve oynatma', 'Videolar bölümü açılınca görsel istekleri; oynata basınca video'],
            ['{gmaps}, Instagram', 'Harita ve sosyal medya bağlantıları', 'Yalnızca bağlantıya tıkladığınızda'],
          ],
        } },
        'Verilerinizi kimseye satmıyor, reklam veya profil oluşturma amacıyla aktarmıyoruz.',
      ] },
      logs: { h: 'Sunucu kayıtları', body: [
        'Her web sunucusu gibi bizim sunucumuz da ({nginx}) gelen istekler hakkında teknik kayıt tutar: {ip} adresi, zaman, açılan adres, yanıt kodu ve tarayıcı bilgisi. Görsel, yazı tipi ve betik gibi statik dosya istekleri kaydedilmez.',
        'Bu kayıtlar yalnızca hataları gidermek ve siteyi saldırılara karşı korumak için kullanılır. Boyutları sınırlıdır (yaklaşık 10 MB’lık 3 dosya): alan doldukça en eski kayıtların üzerine otomatik olarak yazılır. İstekler sunucumuza {cloudflare} üzerinden ulaşır; o da trafiği kendi politikasına göre işler.',
      ] },
      purposes: { h: 'Amaçlar ve hukuki dayanak', body: [
        { ul: [
          '**Hizmetin sunulması** — sitenin çalışması, güvenliği ve hataların giderilmesi (sunucu kayıtları, {cloudflare}): siteyi güvenilir şekilde işletmeye yönelik meşru menfaatimiz.',
          '**Açık rızanız** — anlık bildirimler ve cihaz konumuna erişim: tarayıcı izni ancak siz onayladıktan sonra verir; dilediğiniz zaman geri alabilirsiniz.',
          '**Talebiniz** — yapay zekâ asistanı, şehir ve cami arama: veriler yalnızca o özelliği kullandığınızda ve yalnızca cevap almak için gönderilir.',
        ] },
      ] },
      rights: { h: 'Haklarınız', body: [
        'Kişisel verilerin korunmasına ilişkin mevzuat — Azerbaycan Cumhuriyeti “Kişisel Veriler Hakkında” Kanunu, Türkiye’deki Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği Genel Veri Koruma Tüzüğü ({gdpr}) dahil — çerçevesinde şu haklara sahipsiniz:',
        { ul: [
          'hakkınızda hangi verilerin işlendiğini öğrenmek;',
          'verilerin düzeltilmesini veya silinmesini istemek;',
          'işlemeye itiraz etmek ve verdiğiniz rızayı dilediğiniz zaman geri almak;',
          'denetim makamına şikâyette bulunmak.',
        ] },
        'Hesap olmadığı için çoğu zaman sizi tanıyamayız; verilerin büyük kısmı zaten yalnızca cihazınızdadır ve tarayıcıdan kendiniz silebilirsiniz. Bildirim kaydınızı “Kapat” düğmesiyle hemen silebilirsiniz. Diğer talepler için [bizimle iletişime geçin]({toContact}).',
      ] },
      children: { h: 'Çocuklar', body: [
        'Site her yaştan kullanıcıya yöneliktir ve çocuklar için bir bölüm içerir. Hesap olmadığından çocuklardan bilerek kişisel veri toplamayız. Çocukların yapay zekâ asistanını ve bildirimleri ebeveyn gözetiminde kullanmasını öneririz.',
      ] },
      security: { h: 'Güvenlik', body: [
        'Siteyle tüm iletişim şifreli HTTPS bağlantısı üzerinden yapılır. Sunucuya erişim kısıtlıdır ve gizli anahtarlar kodda tutulmaz. Yine de internette hiçbir yöntem tam güvenliği garanti etmez.',
      ] },
      transfers: { h: 'Verilerin yurt dışına aktarılması', body: [
        'Yukarıda adı geçen hizmetlerin sunucuları farklı ülkelerde (ABD ve Avrupa Birliği dahil) bulunabilir. Bu hizmetleri kullandığınızda ilgili veriler o ülkelerde işlenebilir.',
      ] },
      changes: { h: 'Değişiklikler', body: [
        'Siteye yeni özellikler eklendiğinde bu politikayı güncelleyebiliriz. Son güncelleme tarihi sayfanın üstünde gösterilir; önemli değişiklikleri sitede ayrıca duyururuz.',
      ] },
      contact: { h: 'İletişim', body: [
        { when: IF_EMAIL, p: 'Gizlilikle ilgili soru ve taleplerinizi e-posta ile gönderin:' },
        { when: IF_NO_EMAIL, p: 'Gizlilikle ilgili soru ve taleplerinizi sitenin resmî Instagram hesabına yazabilirsiniz:' },
        { contact: true },
        'Ayrıca bakın: [Kullanım Şartları]({toTerms}) ve [Kaynaklar ve Lisanslar]({toLicenses}).',
      ] },
    },
  },
}

export default function PrivacyPage({ setPage }) {
  const { lang } = useLang()
  return <LegalDocument docKey="privacy" doc={DOC[lang] || DOC.az} setPage={setPage} />
}
