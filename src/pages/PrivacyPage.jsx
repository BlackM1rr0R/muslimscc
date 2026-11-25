import { useLang } from '../contexts/LangContext'
import LegalDocument, { IF_EMAIL, IF_NO_EMAIL, IF_OPERATOR } from '../components/LegalDocument'
import { pickUi } from '../utils/uiText'

// ═══════════════════════════════════════════════════════
// Məxfilik siyasəti — saytın REAL məlumat axınına uyğun (2026-11-25 kod auditi; əvvəlki: 2026-10).
// Hər iddianın mənbəyi (dəyişəndə mətni də yenilə və BRAND.legal.effectiveDate-i dəyiş):
//   • hesab (istəyə bağlı): server/users.js (scrypt, passkey, Google ID tokeni, sessiya — yalnız SHA-256,
//     "Brauzer · Sistem" etiketi, IP yox), server/security.js (2FA, __Host-mcc_dev, jurnal 90 gün, CF ölkəsi,
//     "Bu mən deyildim", GET /api/auth/export), server/adminSso.js (rol, panel jurnalı)
//   • kukilər: yalnız girişdə — __Host-mcc_user (30 gün, sürüşən), __Host-mcc_dev (2 il), ikisi də HttpOnly
//   • sinxronizasiya: server/sync.js (400 gün; bir dəfə yazılıb oxunmayan — 30 gün), server/syncKeys.js
//     (şifrə PBKDF2 / passkey PRF qabı), src/utils/userBackup.js (keş və texniki açarlardan başqa hər şey)
//   • məktublar: server/mailer.js (Resend), welcome.js, mailCampaigns.js (yalnız təsdiqli, imtina, 180 gün),
//     weekly.js (120 gün), personal.js (razılıq)
//   • serverdə oxunan hesab funksiyaları: family*, challenges, classes, publicProfile, duaWall, globalKhatm,
//     duaFriend, hajjJourney, calFeed, hifzTest, readTogether (yalnız yaddaş), mosqueRep — docs/USER-ACCOUNTS.md
//   • icma lövhələri: prayerRooms.js, janaza.js, volunteers.js; qrup otaqları: groups.js; əmanət: trustBox.js
//   • statistika: server/analytics.js + src/api/analytics.js (iframe-də sayılmır; AI referrer — yalnız domen)
//   • push: server/push.js (prefs), checkin.js (cavab cihazda), personal_push_links; Telegram: telegramBot.js
//     (token yoxdursa tam sönülü); AI: server.js /api/ask-ai, quranMeaning.js, feedback.js (kind 'ai')
//   • yer: prayerLocation.js, weather.js (Open-Meteo), sightings.js (1°), ummah.js (2°, yaddaş 10 dəq)
//   • xəta hesabatları: clientErrors.js, csp.js (yalnız yaddaş); paylaşma: ShareTargetPage + nginx access_log off
//   • vidcet/plagin: iframe-də statistika yoxdur, yalnız hündürlük mesajı (utils/embedHeight.js);
//     Instagram: server/instagram.js (yalnız saytın açıq məzmunu)
//   • nginx access log (statik, /api/a, /share, /api/cal/, SSE loglanmır) — Docker json-file, 10 MB × 3 fayl
// Yer tutucular və işarələmə: components/LegalDocument.jsx (NAMES — xidmət və texniki adlar).
// ═══════════════════════════════════════════════════════

const DOC = {
  az: {
    title: 'Məxfilik siyasəti',
    lead: '{brand} hansı məlumatları emal edir, harada saxlayır və kimlə paylaşır — sadə dillə və saytın real işləməsinə uyğun.',
    sections: {
      summary: { h: 'Qısaca', body: [
        { ul: [
          '**Hesab istəyə bağlıdır.** Saytın çox hissəsi hesabsız işləyir. Hesab yaratsanız, e-poçt ünvanınızı, istəyə bağlı görünən adınızı və necə daxil olduğunuzu saxlayırıq (ətraflı aşağıda).',
          '**Reklam və izləmə yoxdur.** Reklam və izləmə kukisi, reklam şəbəkəsi yoxdur. Hesaba daxil olmaq üçün iki zəruri kuki işlənir; ziyarət statistikası isə anonimdir, kukisizdir və öz serverimizdə aparılır.',
          '**Məlumatınız cihazınızda qalır.** Tərcihlər, sevimlilər, zikr, hifz, dua gündəliyi və s. brauzerinizdə saxlanılır. Sinxronizasiyanı açsanız, onlar əvvəlcə brauzerinizdə şifrələnir — serverimizdə yalnız oxuya bilmədiyimiz nüsxə qalır.',
          '**Serverə yalnız lazım olan çatır:** məsələn, bildirişləri açsanız — bildiriş ünvanı və şəhər, AI köməkçiyə sual versəniz — sualın mətni, icma və ailə bölmələrində isə yalnız paylaşmağı özünüz seçdiyiniz. Aşağıdakı hər bölmə nəyin saxlandığını, kimin gördüyünü və nə qədər qaldığını izah edir.',
          '**Məlumatınızı heç vaxt satmırıq**, reklam və ya profil yaratmaq üçün heç kimə ötürmürük.',
        ] },
      ] },
      controller: { h: 'Bu siyasət nəyə aiddir', body: [
        'Bu siyasət {brand} saytına ({domain}), onun mobil tətbiqinə, saytın məzmununu başqa saytlarda göstərən namaz vaxtı bloklarına və {wordpress} plagininə, həmçinin saytın {telegram} botuna aiddir. Xidmət pulsuzdur və reklamsızdır.',
        { when: IF_OPERATOR, p: 'Xidməti **{operator}** idarə edir və bu siyasətdə təsvir olunan məlumatların emalına görə məsuliyyət daşıyır.' },
        'Sual və müraciətlər üçün [Əlaqə]({toContact}) bölməsinə baxın.',
      ] },
      local: { h: 'Brauzerinizdə saxlanan məlumatlar', body: [
        'Saytın funksiyaları üçün lazım olan tərcihlər brauzerin yerli yaddaşında ({localstorage}) və sessiya yaddaşında ({sessionstorage}) saxlanılır. Bu məlumatlar **bizim serverə göndərilmir** (istisnalar aşağıdakı bölmələrdə ayrıca göstərilib) və yalnız həmin brauzerdə əlçatandır.',
        { table: {
          head: ['Nə', 'Harada', 'Nə qədər'],
          rows: [
            ['Dil, tema (işıqlı/qaranlıq), əlçatanlıq ayarları, menyu vəziyyəti, ana səhifənin düzülüşü', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Seçilmiş şəhər və ya xüsusi yer, son seçilən şəhərlər', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Sevimli hədis və dualar, Quranda oxu yeri, Quran qeydləri və vurğuları, kitabxananız, son axtarışlar', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Zikr sayğacı, hifz, vird, gündəlik ibadət və namaz statistikası, öyrənmə irəliləyişi və nişanlar, viktorina və oyun xalları, təqvim xatırlatmaları', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Dua gündəliyi, sədəqə qeydləri və qəza namazı qeydləri', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Profillər (6-ya qədər) və uşaq rejiminin kilidi', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['AI köməkçi ilə söhbət tarixçəsi', 'Yerli yaddaş', '"Söhbəti təmizlə" düyməsinə basana və ya silənə qədər'],
            ['Bildiriş ayarları, bildiriş ünvanının surəti, oxunmuş elanlar, gizlədilmiş xatırlatmalar', 'Yerli yaddaş', 'Siz silənə qədər'],
            ['Hesaba daxil olduğunuz barədə qeyd (şifrə və sessiya açarı deyil), bu cihazın sinxronizasiya ayarları, yaratdığınız və ya qoşulduğunuz otaq və keçidlərin açarları', 'Yerli yaddaş', 'Çıxana, ayrılana və ya silənə qədər'],
            ['Müvəqqəti surətlər: namaz vaxtları, ayələr, indiki hava, siyahıda mövqe', 'Sessiya yaddaşı', 'Brauzer tabı bağlanana qədər'],
            ['Oflayn iş üçün səhifələrin, cavabların və endirilmiş Quran səslərinin surəti', 'Brauzerin keşi ({sw})', 'Brauzer təmizləyənə və ya saytın yeni versiyasına qədər'],
          ],
        } },
        '**Necə silmək olar:** brauzerin ayarlarında {domain} üçün "sayt məlumatlarını" (və ya "kukiləri və sayt məlumatlarını") silin. Bu, yuxarıdakı bütün qeydləri — o cümlədən dua gündəliyini və statistikanı — geri qaytarılmaz şəkildə silir. Məxfi (inkoqnito) rejimdə isə məlumatlar pəncərə bağlananda öz-özünə silinir.',
        { note: 'Bu məlumatların ehtiyat nüsxəsi bizdə avtomatik saxlanılmır. Səhifənin altındakı "Məlumatlarım" bölməsində onları fayl kimi yükləyə və ya uçdan-uca şifrəli sinxronizasiyanı aça bilərsiniz — bax: [Sinxronizasiya və ehtiyat nüsxə]({toSync}).' },
      ] },
      sync: { h: 'Sinxronizasiya və ehtiyat nüsxə', body: [
        'Cihazlar arası sinxronizasiya siz açana qədər sönülüdür. Açanda məlumatınız **brauzerinizdə** bərpa kodunuzdan alınan açarla şifrələnir ({aesgcm}). Serverimiz yalnız şifrəli nüsxəni saxlayır və onu oxuya bilmir; nə kod, nə də açar bizə heç vaxt çatmır.',
        { ul: [
          '**Hesabsız:** nüsxə yenə bərpa kodundan alınan tanıdıcı altında saxlanılır — ona heç bir hesab, kuki və ya {ip} ünvanı bağlanmır. Bərpa kodunu bilən hər kəs nüsxəni aça bilər, ona görə kodu etibarlı yerdə saxlayın.',
          '**Hesabla:** eyni şifrəli nüsxə hesabınıza bağlana bilər ki, yeni cihazda daxil olandan sonra açılsın. Bunun üçün serverimiz bərpa kodunuzu da saxlayır — brauzerinizdə şifrənizdən ({pbkdf2}, 600 000 dövr) və ya passkey-dən alınan açarla kilidlənmiş halda; o açar bizə heç vaxt gəlmir.',
          '**Nə qədər:** "Serverdən sil" düyməsinə basana və ya hesabı silənə qədər. 400 gün heç kəsin toxunmadığı nüsxə avtomatik silinir; yalnız bir dəfə yazılıb sonra heç açılmayan nüsxə isə 30 gün sonra silinir.',
        ] },
        { note: 'Şifrə ilə hər girişdə olduğu kimi, daxil olanda şifrəniz serverimizdən keçir (biz onun yalnız birtərəfli {scrypt} heşini saxlayırıq). Ona görə sinxron məlumatın ən güclü qorunması passkey ilə daxil olanda və ya sinxronizasiyanı bərpa kodu ilə açanda olur.' },
        '"Məlumatlarım" bölməsində yüklədiyiniz ehtiyat faylı brauzerinizdə yaranır və yalnız cihazınızda saxlanılır.',
      ] },
      cookies: { h: 'Kukilər', body: [
        '{brand} **izləmə və ya reklam üçün kuki işlətmir**; hesaba daxil olmayan ziyarətçilərə isə bizdən heç bir kuki gəlmir. Yuxarıda təsvir olunan yerli yaddaş yalnız sizin istədiyiniz funksiyaların işləməsi üçündür, ona görə də ayrıca "kuki razılığı" pəncərəsi göstərmirik.',
        'Hesaba daxil olanda iki zəruri kuki qoyuruq. Hər ikisi {httponly} kukidir (səhifədəki skriptlər onları oxuya bilmir) və yalnız {domain} ünvanına göndərilir:',
        { table: {
          head: ['Kuki', 'Nə üçün', 'Nə qədər'],
          rows: [
            ['{cookieuser}', 'Sizi hesabda saxlayır (təsadüfi sessiya açarı; serverdə yalnız onun heşi saxlanılır)', '30 gün, saytdan istifadə etdikcə uzanır; çıxanda silinir'],
            ['{cookiedev}', 'Artıq daxil olduğunuz cihazı tanıyır ki, yeni cihazdan girişlər barədə sizə məktub yaza bilək', '2 il'],
          ],
        } },
        'Üçüncü tərəflər öz kukilərini qoya bilər: {cloudflare} saytı hücumlardan qorumaq üçün zəruri texniki kuki yaza bilər; {youtube} videonu oynatmağa başlayanda öz qaydalarına uyğun kuki istifadə edə bilər; {google} ilə daxil olsanız, {google}-un giriş pəncərəsi öz qaydaları ilə işləyir.',
      ] },
      analytics: { h: 'Ziyarət statistikası', body: [
        'Saytın hansı bölmələrinin faydalı olduğunu anlamaq üçün öz serverimizdə sadə, **kukisiz** ziyarət statistikası aparırıq; üçüncü tərəf analitika xidməti istifadə olunmur. Səhifə açılanda serverə yalnız səhifənin ünvanı (sorğu sətri olmadan), interfeys dili və sizi göndərən saytın yalnız əsas ünvanı gedir; brauzerin təsvirindən yalnız cihaz növü və brauzer ailəsi çıxarılır, ölkə və yer təyin edilmir. Gündəlik unikal ziyarətçiləri saymaq üçün {ip} ünvanınızdan, brauzerin təsvirindən və tarixdən hər gün yenilənən gizli açarla birtərəfli heş hesablanır — o, yalnız serverin yaddaşında, ən çox bir gün qalır və diskə yazılmır. Bazada yalnız cəmlər saxlanılır və 400 gündən sonra silinir. Kuki, tanıdıcı nömrə və ya "barmaq izi" yoxdur; brauzerinizdə izləmə qadağası (Do Not Track və ya Global Privacy Control) açıqdırsa, ziyarətiniz sayılmır.',
        'Bir AI köməkçidən (məsələn, {chatgpt} və ya {perplexity}) gəlsəniz, statistikada yalnız həmin saytın əsas ünvanını görürük — söhbətiniz barədə heç nə. Başqa saytın içində açılan səhifələr (bloklarımız və {wordpress} plagini), idarə paneli və avtomatlaşdırılmış brauzerlər sayılmır. Sui-istifadənin qarşısını almaq üçün {ip} ünvanınız serverin yaddaşında ən çox bir dəqiqə saxlanılır.',
      ] },
      account: { h: 'Hesabınız', body: [
        'Hesab istəyə bağlıdır. Onu e-poçt və şifrə ilə, passkey ilə və ya {google} ilə yarada bilərsiniz. Belə olduqda bunları saxlayırıq:',
        { ul: [
          'e-poçt ünvanınızı və onun təsdiqlənib-təsdiqlənmədiyini, istəyə bağlı görünən adınızı, rolunuzu (məsələn, məscid nümayəndəsi), hesabın yaradılma və son giriş vaxtını, işlətdiyiniz sayt dilini (məktublarımız sizə öz dilinizdə çatsın deyə);',
          'necə daxil olduğunuzu: şifrənizin birtərəfli {scrypt} heşini (şifrənin özünü heç vaxt), passkey-lərinizin açıq açarlarını (gizli açar cihazınızdan çıxmır), {google} işlədirsinizsə — {google}-un hesabınıza verdiyi tanıdıcını;',
          'iki addımlı yoxlamanı açsanız: kod tətbiqinizin sirrini (şifrəli) və birdəfəlik ehtiyat kodlarınızın heşlərini;',
          'sessiyalarınızı: hər biri üçün təsadüfi açar (yalnız heşi saxlanılır), "{devlabel}" kimi qısa cihaz adı və tarixlər — {ip} ünvanı yox;',
          'girişlərin və təhlükəsizlik dəyişikliklərinin (şifrə, iki addımlı yoxlama, passkey-lər) jurnalını — giriş üsulu, cihazın qısa adı və {cloudflare}-in bildirdiyi təxmini ölkə ilə; 90 gün saxlanılır.',
        ] },
        '**{google} ilə daxil olmaq:** {google}-un skripti yalnız giriş və qeydiyyat səhifələrində yüklənir. Onu işlətsəniz, {google} bizə e-poçt ünvanınızı, adınızı və hesab tanıdıcısını verir; biz tanıdıcını və e-poçtu saxlayırıq, adı isə yeni hesabın görünən adı kimi işlədirik. {google} şifrənizi heç vaxt görmürük.',
        '**Təhlükəsizlik məktubları:** kimsə yeni cihazdan daxil olanda və şifrəniz, iki addımlı yoxlamanız və ya passkey-ləriniz dəyişəndə sizə yazırıq. Belə məktubdakı "Bu mən deyildim" keçidi bütün cihazlardan çıxış edir və yeni şifrə qoyana qədər şifrə və {google} ilə girişi dayandırır (passkey-lər işləməyə davam edir).',
        '**Təxmin etməyə qarşı qorunma:** təkrar giriş cəhdlərini məhdudlaşdırmaq üçün {ip} ünvanınız yalnız serverin yaddaşında, qısa müddət işlənir və diskə yazılmır.',
        '**Görmək, yükləmək, silmək:** hesab səhifəniz nəyi saxladığımızı göstərir, "Mənim məlumatlarım" isə hamısını fayl kimi yükləməyə imkan verir. "Hesabı sil" hesabı və ona bağlı hər şeyi — o cümlədən hesaba bağlı şifrəli sinxron nüsxəni — bazamızdan silir. Yalnız Ümmətin Canlı Xətmində oxuduğunuz səhifələr adınız olmadan həmin dövrün anonim sayında qalır.',
        'Məscid nümayəndəsi və ya redaktor kimi rolları administratorlar verir. Hər rol dəyişikliyi audit jurnalına yazılır (yalnız hesabın nömrəsi və rollar — bu qeyd hesab silinəndən sonra da qalır), idarə panelini açmağınız isə təhlükəsizlik jurnalınızda qeyd olunur.',
      ] },
      email: { h: 'Məktublar', body: [
        'Məktubları yalnız hesabınızın e-poçt ünvanına, e-poçt göndərmə xidmətimiz {resend} vasitəsilə göndəririk; o, alıcının ünvanını və hər məktubun mətnini alır. Loglarımızda e-poçt ünvanı olmur.',
        { ul: [
          '**Xidmət məktubları** (həmişə): ünvanın təsdiqi, şifrənin bərpası, kimsə sizin ünvanla qeydiyyatdan keçməyə çalışanda xəbərdarlıq və yuxarıda təsvir olunan təhlükəsizlik məktubları.',
          '**Xoş gəldin məktubu** (bir dəfə): ünvanınızı təsdiqləyəndən sonra — işlətdiyiniz sayt dilində, dil məlum deyilsə ingilis və ərəb dillərində.',
          '**Özünüz açdığınız məktublar:** həftəlik hesabat və qurduğunuz xatırlatmalar (növbəti bölməyə baxın). Onlar yalnız təsdiqlənmiş ünvana gedir və hər birində abunəlikdən çıxmaq keçidi var.',
          '**Sayt komandasından ara-sıra xəbərlər:** yalnız təsdiqlənmiş hesablara və heç vaxt abunəlikdən çıxmış ünvana. Hər belə məktubda bir kliklə abunəlikdən çıxmaq keçidi var; çıxmaq yalnız bu məktubları dayandırır, xidmət və təhlükəsizlik məktublarını yox. Bu məktublardan hansının hansı hesaba getdiyini göndəriş bitəndən sonra 180 gün saxlayırıq.',
        ] },
      ] },
      accountdata: { h: 'Serverdə oxunan hesab funksiyaları', body: [
        'Hesabınızda etdiklərinizin çoxu uçdan-uca şifrəlidir. Aşağıdakı funksiyalar isə fərqlidir: xatırlatmanı vaxtında göndərmək və ya nəyisə ailənizə göstərmək üçün serverimiz məlumatı oxumalıdır, ona görə o **şifrəsiz** saxlanılır. Hamısı siz açana qədər sönülüdür, çoxu əvvəlcə açıq razılığınızı istəyir və məlumatı istənilən vaxt silə bilərsiniz. Hamısı hesabla birlikdə silinir və hesab ixracına daxildir.',
        { table: {
          head: ['Funksiya', 'Nə saxlanılır', 'Kim görür və nə qədər'],
          rows: [
            ['Xatırlatmalar: gələcəkdəki özünüzə məktub, vəfat etmiş yaxınlarınız üçün dua, zəkat tarixiniz', 'Məktub və onun çatdırılma tarixi; yaxınlarınızın adları (istəyə bağlı yaxınlıq və qeydlə); zəkat ilinizin başlanğıcı (məbləğ yalnız özünüz yazsanız); saat qurşağınız və diliniz', 'Yalnız siz; siyahınızı izləməyə dəvət etdiyiniz şəxslər adları görür, qeydlərinizi yox. Siz silənə qədər'],
            ['Həftəlik hesabat (e-poçtla)', 'Seçdiyiniz gün, saat qurşağınız və diliniz, brauzerinizin hesabladığı həftəlik beş rəqəm (namaz, Quran səhifəsi, zikr, oruc günləri, vird)', 'Yalnız siz. Rəqəmlər 120 gün sonra silinir'],
            ['Ailə dairəsi (8 hesaba qədər), ailə duaları və ailənin Ramazan lövhəsi', 'Üzvlük; yalnız paylaşmağı seçdiyiniz xülasə rəqəmləri; kartlar (şablon və rəqəm, sərbəst mətn yox); yazdığınız dua istəkləri; Ramazan sayları, cüz və iftar siyahılarındakı adlar', 'Dairənizin üzvləri. Kartlar 60 gün, dua istəkləri 30–90 gün sonra silinir'],
            ['Qrup çağırışları və müəllim sinfi', 'Üzvlük və gündəlik işarələriniz; sinifdə tapşırıqlar və — yalnız razılığınızla — irəliləyiş rəqəmləriniz', 'Digər üzvlər yalnız gündəlik cəmləri görür, ad və reytinq yoxdur; müəllim şagirdin fərdi irəliləyişini yalnız onun razılığı ilə görür. Çağırış bitəndən 30 gün sonra silinir'],
            ['Açıq profil (susmaya görə bağlı)', 'Ləqəb, görünən ad, künyə, qısa bio, sevimli surə və öyrənmə nişanları', 'Açıq olduğu müddətdə hər kəs, {profilepath} ünvanında. Profil barədə şikayətlər 180 gün saxlanılır'],
            ['Dua divarı', 'İstəyiniz (300 simvola qədər), istəyə bağlı ad (susmaya görə "Anonim") və dili', 'Nəzarətçi təsdiqləyəndən sonra 30 gün hər kəs. Nəzarətçilər e-poçt ünvanınızı heç vaxt görmür'],
            ['Ümmətin Canlı Xətmi', 'Götürdüyünüz səhifə, iştirak etdiyiniz dövrlər, istəyə bağlı ithaf adı və — yalnız razılığınızla — təxminən 110 km-ə yuvarlaqlaşdırılmış yeriniz', 'İthaf heç vaxt ictimai deyil (yalnız ithafların sayı göstərilir) və dövr bitəndən 30 gün sonra silinir. Yer canlı xəritədə bir dəfə görünür və silinir; ölkə ({cloudflare}-dən) şəxs üzrə yox, yalnız dövrün ölkələr siyahısında sayılır'],
            ['Gizli dua dostu', 'Qoşulduğunuz, diliniz və saat qurşağınız, cütləşməniz və işarələdiyiniz günlər', 'Dostunuz kim olduğunuzu heç vaxt bilmir. Cütləşmə və işarələr 30 günlük dövr bitəndə, üzvlük isə siz çıxanda silinir'],
            ['Həcc səfəri', 'Səfərin növü, işarələdiyiniz mərhələlər və istəyə bağlı qısa ad — yeriniz heç vaxt', 'Ailə dairəniz və gizli keçidiniz olan şəxslər. Başlayandan 30 gün sonra silinir'],
            ['Təqvim axını', 'Gizli keçid (yalnız heşi), seçdiyiniz bölmələr və diliniz', 'Axını keçidlə yükləyən təqvim tətbiqiniz və ya xidmətiniz. Söndürənə və ya yeni keçid yaradana qədər'],
            ['«Məni yoxla» hifz keçidi', 'Surə və ayə aralığı, göstəriləcək ad və dinləyənin işarələri (sərbəst mətn yox)', 'Siz və keçidi olan şəxs. Nəticələr siz açandan 7 gün sonra silinir'],
            ['«Birlikdə oxu»', 'Otaq və içindəkilərin ləqəbləri — yalnız serverin yaddaşında, diskə heç vaxt yazılmır', 'Otaqdakılar. 24 saat fəaliyyətsizlikdən sonra bağlanır'],
            ['Məscid nümayəndəsi', 'Məscidiniz üçün iqamə vaxtları, Cümə xütbəsinin mövzusu və elanlar', 'Hər kəs — məscid ekranında və məscid axtarışında. Elanlar vaxtı bitəndən 30 gün sonra silinir'],
          ],
        } },
        '"Bu cihaza da bildiriş göndər" seçsəniz, xatırlatmalarınız ora da çatsın deyə həmin cihazın bildiriş ünvanını da hesabınıza bağlayırıq.',
      ] },
      community: { h: 'İcma lövhələri: namaz otaqları, cənazə elanı, könüllülər', body: [
        'Bu bölmələrdən hesabla istifadə etsəniz, aşağıdakılar serverimizdə **şifrəsiz** saxlanılır və hesabınıza bağlanır. Yerləşdirmək, yazılmaq və şikayət etmək üçün e-poçtunuz təsdiqlənməlidir.',
        { ul: [
          '**Namaz otağı təklifi:** yerin adı, növü, şəhəri, ünvanı, koordinatları, mərtəbə və qeyd. Təsdiqdən sonra hər kəsə görünür; adınız və e-poçtunuz göstərilmir. Rədd edilən təklif 30 gün, gözləyən isə 90 gün sonra silinir. Yer barədə şikayəti (səbəb və qısa qeyd) yalnız nəzarətçilər görür. «Yaxınımdakılar» üçün yeriniz yalnız brauzerinizdə işlənir və serverə göndərilmir.',
          '**Cənazə elanı** (yalnız açıq razılığınızla): mərhumun adı, namazın tarixi və saatı, yer, istəyə bağlı dəfn yeri və ailənin əlaqəsi. Gizli keçidi olan hər kəs görür (keçidin özü bazada yalnız heş kimi saxlanılır); ictimai siyahıya yalnız istəsəniz və nəzarətçi yoxlayandan sonra düşür, orada əlaqə göstərilmir. Elan namaz günündən 30 gün sonra avtomatik silinir. «Dua etdim» üçün ailə yalnız say görür: hesaba daxil olmuş ziyarətçi üçün hər hesaba bir qeyd saxlanılır ki, bir dəfə sayılsın, qalanları üçün bazaya heç nə yazılmır.',
          '**Könüllü yazılışı:** yazdığınız ad və (yalnız razılığınızla) e-poçtunuz yalnız həmin məscidin nümayəndəsinə görünür; ictimai siyahıda yalnız dolu yerlərin sayı var. Tarixi keçən işlər 30 gün sonra yazılışlarla birlikdə silinir.',
        ] },
        'Bu qeydləri istənilən vaxt özünüz silə bilərsiniz; hesabı silsəniz, hamısı silinir. Onlar hesabdakı məlumat ixracına daxildir.',
      ] },
      groups: { h: 'Qrup xətmi və ortaq hədəflər', body: [
        'Qrup otağı yaradanda və ona qoşulanda serverdə yalnız sizin yazdığınız görünən ad (məsələn, "Əli"), qeydləriniz (hansı cüzü götürdüyünüz, hansı günləri işarələdiyiniz) və dua otağında yazdığınız istəklər saxlanılır. Hesab yaradılmır, {ip} ünvanı və başqa şəxsi məlumat yazılmır. İdarəetmə və iştirak açarları yalnız brauzerinizin yerli yaddaşında qalır. Otaq son fəaliyyətdən 180 gün sonra avtomatik silinir; onu yaradan istənilən vaxt silə bilər.',
      ] },
      trustbox: { h: 'Əmanət qutusu', body: [
        'Hesabınızda əmanət qutusu yaratsanız, qeydləriniz (vəsiyyət istəkləri, borclar, sənədlərin yeri, ailəyə sözlər) **brauzerinizdə** yalnız sizin bildiyiniz əmanət parolu ilə şifrələnir (PBKDF2-SHA256, 600 000 dövr; AES-256-GCM). Serverimizdə yalnız şifrəli mətn, təsadüfi duz, gizli keçidin SHA-256 heşi, yaradılma və dəyişmə vaxtı və keçidlə son açılış günü saxlanır — parol, açıq mətn və {ip} ünvanı heç vaxt saxlanmır.',
        '**Nə qədər:** qutunu silənə qədər; hesab silinəndə də silinir. Hesab ixracında şifrəli şəkildə verilir. Parol itsə, məzmunu heç kim — biz də — bərpa edə bilmərik.',
      ] },
      push: { h: 'Push bildirişləri', body: [
        'Bildirişlər yalnız siz icazə verəndə açılır. İcazə verdikdə brauzerinizin öz push xidməti ({pushsvc}) brauzerinizə bildiriş ünvanı (cihaza bildiriş çatdırmaq üçün təsadüfi simvollardan ibarət açar) verir və biz öz serverimizin verilənlər bazasında belə bir qeyd saxlayırıq:',
        { ul: [
          'bildiriş ünvanı;',
          'brauzerin texniki təsviri (brauzerin və əməliyyat sisteminin adı, versiyası);',
          'interfeys diliniz;',
          'seçdiyiniz namaz yeri: koordinatlar, saat qurşağı, şəhər adı və namaz vaxtının hesablama metodu (siyahıdan şəhər seçmisinizsə — şəhərin mərkəzi; "yerimi təyin et" ilə xüsusi yer seçmisinizsə — həmin yerin təxmini koordinatları);',
          'bildiriş seçimləriniz və qeydin yaradılma/yenilənmə vaxtı.',
        ] },
        '**Nə üçün:** serverimiz hər abunəçiyə öz şəhərinin azan vaxtında bildiriş göndərir, üstəlik yalnız sizin açdığınız əlavə xatırlatmaları (məsələn, "Qıldınızmı?", səhər və axşam zikrləri, Cümə, sünnə orucları, tutulmalar, günün ayəsi və ya hədisi); həmçinin bütün abunəçilərə ümumi elanlar göndərilə bilər. "Qıldınızmı?" sualına cavabınız cihazınızda qalır və bizə heç vaxt göndərilmir.',
        '**Nə qədər:** siz bildirişləri söndürənə qədər. Saytdakı "Bildirişlər" panelində **"Söndür"** düyməsinə basanda qeyd verilənlər bazasından dərhal silinir. Bildirişləri yalnız brauzer və ya telefon ayarlarından bağlasanız, ünvan etibarsız olur və növbəti göndərişdə server bunu görüb qeydi silir.',
        'Hesaba daxil olub şəxsi xatırlatmalarınız üçün "Bu cihaza da bildiriş göndər" seçsəniz, bildiriş ünvanı hesabınıza da bağlanır.',
        { note: 'Mobil tətbiqdə namaz xatırlatmaları cihazın özündə planlaşdırılır — bunun üçün serverə ünvan göndərilmir.' },
      ] },
      telegram: { h: 'Telegram botu', body: [
        'Bot biz onu {telegram}-a qoşana qədər sönülüdür; sönülü olduğu müddətdə aşağıdakıların heç biri baş vermir.',
        // lang-ok[Telegram]: xidmətin adı
        'Saytın Telegram botundan istifadə etdikdə əmrləriniz Telegram şirkətinin serverləri vasitəsilə bizim serverimizə çatır; bu yolda Telegram-ın öz məxfilik siyasəti tətbiq olunur. Bot şəhər seçdikdən sonra serverimizin verilənlər bazasında yalnız bu qeydi saxlayır (şifrələnmədən — şəhər seçməklə buna razılıq verirsiniz):',
        { ul: [
          // lang-ok[Telegram]: xidmətin adı
          'söhbət nömrəsi (Telegram-ın söhbətə verdiyi nömrə — sizə cavab göndərmək üçün);',
          // lang-ok[Telegram]: xidmətin adı
          'interfeys diliniz (Telegram-ın bildirdiyi dil kodundan);',
          'seçdiyiniz şəhər (saytın şəhər siyahısından);',
          'azan xatırlatmasının açıq və ya sönülü olması və qeydin yaradılma vaxtı.',
        ] },
        'Adınız, istifadəçi adınız, telefon nömrəniz və mesajlarınızın mətni saxlanmır və loglanmır; {ip} ünvanı yazılmır.',
        '**Nə qədər:** botda /stop əmrini göndərənə və ya botu bloklayana qədər — hər iki halda qeyd dərhal silinir.',
      ] },
      ai: { h: 'AI köməkçi', body: [
        'AI köməkçiyə sual verdikdə sualınızın mətni, cari söhbətin son bir neçə mesajı və interfeys diliniz serverimizə, oradan isə {openrouter} xidməti vasitəsilə süni intellekt modelinə (hazırda {gemini}) göndərilir. Cavab eyni yolla geri qayıdır.',
        { ul: [
          'Serverimiz söhbətin mətnini **saxlamır və loglara yazmır** — yalnız texniki göstəricilər (cavabın müddəti və uzunluğu) qeyd olunur.',
          'Söhbət tarixçəsi yalnız brauzerinizdə saxlanılır; "Söhbəti təmizlə" ilə silə bilərsiniz.',
          'Sui-istifadənin qarşısını almaq üçün {ip} ünvanınız bir dəqiqəlik sorğu limiti üçün serverin yaddaşında qısa müddət saxlanılır.',
          '{openrouter} və model təminatçısı sorğunu öz məxfilik siyasətlərinə uyğun emal edir.',
        ] },
        '**Quranda məna ilə axtarış** da oxşar işləyir: yazdığınız sözlər və interfeys diliniz serverimiz və {openrouter} vasitəsilə modelə gedir; model yalnız ayə nömrələrini seçir — gördüyünüz ayə mətni saytın öz Quran məlumatındandır. Heç nə saxlanmır, axtarış mətni loglanmır; eyni axtarışlar qısa müddət serverin yaddaşında qalır.',
        '**Cavabı qiymətləndirmək:** cavabı faydasız kimi işarələsəniz, sual, cavab, seçdiyiniz səbəb və istəyə bağlı şərhiniz yoxlanmaq üçün serverimizdə saxlanılır — bax: [Xəta hesabatları və rəylər]({toFeedback}).',
        { note: 'AI köməkçiyə ad, ünvan, sağlamlıq və ya ailə vəziyyəti kimi şəxsi məlumat yazmayın.' },
      ] },
      location: { h: 'Yer məlumatı', body: [
        'Cihazınızın yerini yalnız siz düyməyə basanda və brauzer icazə verəndə istəyirik. Yer məlumatı hara gedir:',
        { ul: [
          '**Şəhəri təyin etmək:** ən yaxın şəhər cihazınızın özündə hesablanır.',
          '**Qiblə istiqaməti:** tamamilə cihazınızda hesablanır, heç yerə göndərilmir.',
          '**Məscid axtarışı:** yerinizin koordinatları yaxınlıqdakı məscidləri tapmaq üçün {osm} məlumat xidmətinə ({overpass}) göndərilir.',
          '**Namaz vaxtları:** Azərbaycan şəhərləri üçün vaxtlar cihazınızda hesablanır; başqa yerlər üçün seçdiyiniz yerin koordinatları və saat qurşağı aladhan.com xidmətinə göndərilir.',
          '**Şəhər axtarışı:** yazdığınız şəhər adı {openmeteo} xidmətinə göndərilir.',
          '**Ana səhifədə hava:** indiki havanı göstərmək üçün seçdiyiniz şəhərin və ya yerin koordinatları {openmeteo} xidmətinə göndərilir.',
          '**Hilal müşahidəsi xəritəsi:** göndərdiyiniz qeyddə yalnız təxminən 110 km-lik sahə, axşamın tarixi və saatı, hilalı görüb-görmədiyiniz və necə baxdığınız saxlanılır — hesab, ad və {ip} ünvanı yox.',
          '**"İndi zikr edənlər" xəritəsi:** zikr və ya salavat sayanda, namaz vaxtları üçün öz şəhərinizi seçmisinizsə, həmin şəhərin təxminən 200 km-ə yuvarlaqlaşdırılmış yeri 10 dəqiqə serverin yaddaşında qalır və heç vaxt saxlanmır. Ümmət sayğacının gündəlik cəmlərində şəxsi məlumat yoxdur.',
          '**Xəritədə aç / Marşrut:** bu linklərə basanda {gmaps} koordinatlarla yeni tabda açılır.',
        ] },
      ] },
      feedback: { h: 'Xəta hesabatları və rəylər', body: [
        '**"Səhv bildir":** səhifə, səhvin növü, mətniniz və — yalnız özünüz yazsanız — sizinlə əlaqə yolu serverimizdə saxlanılır. Onları yalnız administratorlar oxuyur və idarə panelində silir; onlarla birlikdə {ip} ünvanı, kuki və brauzer məlumatı saxlanmır.',
        '**AI cavabını qiymətləndirmək:** cavabı faydasız kimi işarələsəniz, sual, cavab, seçdiyiniz səbəb və istəyə bağlı şərhiniz eyni qaydada saxlanılır.',
        '**Avtomatik xəta hesabatları:** səhifədə proqram xətası baş versə, brauzeriniz bizə xəta mesajını, skript faylını və sətrini, səhifənin yolunu (sorğu sətri olmadan) göndərir; mesajdakı e-poçt ünvanları və uzun rəqəmlər gizlədilir. Bu hesabatlar yalnız serverin yaddaşında qalır və o yenidən başlayanda silinir; {ip} ünvanı, kuki və brauzerin təsviri saxlanmır. Brauzerlərin göndərdiyi təhlükəsizlik siyasəti ({csp}) pozuntusu hesabatları da eyni qaydada işlənir.',
      ] },
      embeds: { h: 'Bloklar, paylaşma və Instagram', body: [
        { ul: [
          '**Başqa saytlarda:** namaz vaxtları blokumuz, məscid ekranı və ya {wordpress} plagini başqa saytda göstəriləndə ziyarət statistikası göndərmir və kuki qoymur; görünüş ayarlarını brauzerinizdə — hər sayt üçün ayrıca — saxlaya bilər. Yığcam məscid ekranı onu əhatə edən səhifəyə yalnız məzmunun hündürlüyünü (bir rəqəm) bildirir ki, çərçivə ona uyğunlaşsın. Avtomatik xəta hesabatları yuxarıda təsvir olunduğu kimi işləyir. Azərbaycandan kənar yerlər üçün vaxtları brauzeriniz aladhan.com-dan alır.',
          '**Sayta paylaşmaq:** başqa tətbiqdən mətni {brand} ilə paylaşsanız (Android-də "Paylaş"), mətn brauzerinizdə qalır — serverimizdə saxlanmır, server loglarına yazılmır və oflayn keşə düşmür. O, yalnız seçdiyiniz əməl üçün işlənir: məsələn, Quranda axtarış ərəbcə mətni {alquran} xidmətinə göndərir, dua gündəliyinə əlavə etmək isə onu cihazınızda saxlayır.',
          '**Instagram səhifəmiz:** postlar avtomatik dərc olunur və yalnız saytın açıq məzmunundan ibarətdir (ayə, hədis, dua və ya Allahın adlarından biri) — heç bir ziyarətçi və ya hesab məlumatı işlənmir. Instagram-ı açanda onun öz məxfilik siyasəti tətbiq olunur.',
        ] },
      ] },
      thirdparty: { h: 'Üçüncü tərəf xidmətlər', body: [
        'Sayt aşağıdakı xidmətlərdən istifadə edir. Brauzeriniz onlara qoşulanda hər internet sorğusunda olduğu kimi {ip} ünvanınız və brauzer məlumatı həmin xidmətə məlum olur; onlar bu məlumatı öz siyasətlərinə uyğun emal edir.',
        { table: {
          head: ['Xidmət', 'Nə üçün', 'Nə ötürülür'],
          rows: [
            ['{cloudflare}', 'Saytın çatdırılması (CDN) və hücumlardan qorunma', 'Sayta edilən bütün sorğular'],
            ['{pushsvc}', 'Push bildirişlərinin cihazınıza çatdırılması (brauzerinizin öz xidməti)', 'Bildiriş açılıbsa — şifrələnmiş bildiriş mətni və bildiriş ünvanı'],
            ['{openrouter}, {gemini}', 'AI köməkçinin cavabları və Quranda məna ilə axtarış', 'Sual və söhbətin son mesajları və ya axtarış sözləriniz (serverimiz vasitəsilə)'],
            ['{resend}', 'Məktublarımızın çatdırılması', 'E-poçt ünvanınız və məktubun mətni (yalnız hesabınız varsa)'],
            ['{google}', '{google} ilə daxil olmaq', 'Yalnız onu işlətsəniz, giriş və qeydiyyat səhifələrində'],
            ['aladhan.com', 'Azərbaycandan kənar yerlər üçün namaz vaxtlarının hesablanması', 'Seçilmiş yerin koordinatları, saat qurşağı, metod'],
            ['{alquran}, {islamicnetwork}, {qurancom}', 'Quran mətni, tərcümələr, qiraət səsləri', 'Surə/ayə sorğuları'],
            ['{quranenc}, {hadeethenc}, {jsdelivr}, {github}', 'Məna tərcümələri və hədis mətnləri', 'Açdığınız mətnlərin sorğuları'],
            ['hisnmuslim.com', 'Duaların səsi', 'Yalnız "Dinlə" düyməsinə basanda'],
            ['{osm} ({overpass})', 'Yaxınlıqdakı məscidlərin axtarışı', 'Axtarış bölgəsinin koordinatları'],
            ['{openmeteo}', 'Dünya şəhərlərinin axtarışı və ana səhifədə indiki hava', 'Yazdığınız şəhər adı; seçdiyiniz yerin koordinatları'],
            ['{openfoodfacts}', 'Halal yoxlamasında məhsul axtarışı', 'Yalnız yazdığınız ştrixkod'],
            ['{exchangerate}', 'Zəkat kalkulyatorunda valyuta məzənnələri', 'Yalnız məzənnə sorğusu'],
            ['{youtube}', 'Videoların önizləmə şəkilləri və oynadılması (məxfilik rejimi)', 'Videolar bölməsi açılanda şəkil sorğuları; oynatmağa basanda video'],
            ['{telegram}', 'Saytın botu', 'Yalnız bota yazsanız'],
            ['{gmaps}, Instagram', 'Xəritə və sosial şəbəkə linkləri', 'Yalnız linkə basanda'],
          ],
        } },
        'Məlumatlarınızı heç kimə satmırıq, reklam və ya profil yaratmaq üçün ötürmürük.',
      ] },
      logs: { h: 'Server qeydləri (loglar)', body: [
        'Hər veb server kimi bizim server də ({nginx}) daxil olan sorğular haqqında texniki qeyd aparır: {ip} ünvanı, vaxt, açılan ünvan, cavab kodu və brauzer məlumatı. Şəkil, şrift və skript kimi statik faylların sorğuları, statistika mayakı, paylaşma səhifəsi, təqvim axınları və canlı yeniləmələr qeyd olunmur.',
        'Bu qeydlər yalnız xətaları aradan qaldırmaq və saytı hücumlardan qorumaq üçündür. Onlar ölçü ilə məhdudlaşdırılıb (təxminən 10 MB-lıq 3 fayl): yer dolduqca ən köhnə qeydlər avtomatik olaraq yenilərinin altında silinir. Sorğular serverə {cloudflare} vasitəsilə çatır və o da trafiki öz siyasətinə uyğun emal edir.',
      ] },
      purposes: { h: 'Məqsədlər və hüquqi əsas', body: [
        { ul: [
          '**Xidmətin göstərilməsi** — saytın işləməsi, saytın və hesabınızın təhlükəsizliyi, xətaların aradan qaldırılması (server qeydləri, sorğu limitləri, təhlükəsizlik jurnalı və xəbərdarlıqları, xəta hesabatları, {cloudflare}): saytı etibarlı və təhlükəsiz işlətməkdə qanuni marağımız.',
          '**Hesabınız** — onun yaradılması və işləməsi, girişiniz və onunla bağlı məktublar (təsdiq, şifrə bərpası, təhlükəsizlik xəbərdarlıqları): istədiyiniz hesabı təqdim etmək üçün zəruridir.',
          '**Sizin razılığınız** — push bildirişləri, cihazın yerinə giriş və serverdə oxunan məlumat saxlayan əlavə funksiyalar (xatırlatmalar, həftəlik hesabat, ailə və icma funksiyaları, açıq profil): hər birini özünüz açırsınız və onu söndürməklə və ya məlumatı silməklə istənilən vaxt geri götürə bilərsiniz.',
          '**Sizin sorğunuz** — AI köməkçi, Quranda məna ilə axtarış, şəhər və məscid axtarışı, halal yoxlaması: məlumat yalnız siz həmin funksiyanı işlədəndə və yalnız cavab almaq üçün göndərilir.',
          '**Anonim statistika və ara-sıra xəbər məktubları** — saytın hansı hissələrinin faydalı olduğunu anlamaq və hesab sahiblərinə xidmət barədə xəbər vermək: qanuni marağımız; statistika heç kimi tanımır, xəbər məktublarından isə bir kliklə çıxa bilərsiniz.',
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
        'Hesabınız varsa, bunların çoxunu hesab səhifəsində özünüz edə bilərsiniz: məlumatınızı görmək və yükləmək ("Mənim məlumatlarım"), görünən adınızı və şifrənizi düzəltmək, ayrı-ayrı qeydləri və ya bütün hesabı silmək. Hesab yoxdursa, çox vaxt sizi tanımırıq və məlumatın çoxu onsuz da yalnız cihazınızdadır — onu brauzerdə özünüz silə bilərsiniz. Bildiriş qeydini "Söndür" düyməsi ilə dərhal silə bilərsiniz. Digər sorğular üçün [bizimlə əlaqə saxlayın]({toContact}).',
      ] },
      children: { h: 'Uşaqlar', body: [
        'Sayt bütün yaşlar üçün nəzərdə tutulub və uşaqlar üçün bölməsi var; o bölmə hesabsız işləyir və uşaq barədə serverimizə heç nə göndərmir. Profillər və uşaq rejiminin kilidi valideynə uşaq üçün öz hesabının içində ayrıca yer qurmağa imkan verir; onlar cihazda və ya şifrəli sinxronizasiyada qalır. Uşaqların hesabdan, icma funksiyalarından, AI köməkçidən və bildirişlərdən valideynin nəzarəti ilə istifadə etməsini tövsiyə edirik.',
      ] },
      security: { h: 'Təhlükəsizlik', body: [
        'Saytla bütün əlaqə HTTPS üzərindən şifrələnmiş bağlantı ilə qurulur. Şifrələr yalnız birtərəfli {scrypt} heşi kimi, sessiya açarları və gizli keçidlər yalnız {sha256} heşi kimi saxlanılır, iki addımlı yoxlamanın sirləri şifrələnir; sinxron məlumatınız və əmanət qutunuz bizə çatmazdan əvvəl brauzerinizdə şifrələnir. Serverə giriş məhdudlaşdırılıb və sirli açarlar kodda saxlanılmır. Buna baxmayaraq, internetdə heç bir üsul tam təhlükəsizliyə zəmanət vermir.',
      ] },
      transfers: { h: 'Məlumatın başqa ölkələrə ötürülməsi', body: [
        'Yuxarıda adı çəkilən xidmətlərin — o cümlədən e-poçt göndərmə xidmətimizin — serverləri müxtəlif ölkələrdə (o cümlədən ABŞ-da və Avropa İttifaqında) yerləşə bilər. Bu xidmətlərdən istifadə etdikdə müvafiq məlumat həmin ölkələrdə emal oluna bilər.',
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
          '**An account is optional.** Most of the site works without one. If you create an account, we store your email address, an optional display name and how you sign in (details below).',
          '**No ads or tracking.** No advertising or tracking cookies and no ad networks. Signing in uses two strictly necessary cookies, and our visit statistics are anonymous, cookieless and kept on our own server.',
          '**Your data stays on your device.** Preferences, favourites, dhikr, hifz, your dua journal and so on are stored in your browser. If you turn on sync, they are encrypted in your browser first — our server keeps only a copy it cannot read.',
          '**Only what is needed reaches our server:** for example a notification address and city if you turn on notifications, the text of your question if you ask the AI assistant, and in community and family features only what you choose to share. Each section below explains what is stored, who sees it and for how long.',
          '**We never sell your data** and never pass it on for advertising or profiling.',
        ] },
      ] },
      controller: { h: 'Scope of this policy', body: [
        'This policy covers the {brand} website ({domain}), its mobile app, the prayer-times widgets and {wordpress} plugin that show the site’s content on other websites, and the site’s {telegram} bot. The service is free and ad-free.',
        { when: IF_OPERATOR, p: 'The service is operated by **{operator}**, who is responsible for the processing described in this policy.' },
        'For questions and requests, see the [Contact]({toContact}) section.',
      ] },
      local: { h: 'Data stored in your browser', body: [
        'Preferences the site needs in order to work are kept in your browser’s local storage ({localstorage}) and session storage ({sessionstorage}). This data is **not sent to our server** (exceptions are described separately below) and is available only in that browser.',
        { table: {
          head: ['What', 'Where', 'How long'],
          rows: [
            ['Language, theme (light/dark), accessibility settings, menu state, home page layout', 'Local storage', 'Until you delete it'],
            ['Selected city or custom location, recently chosen cities', 'Local storage', 'Until you delete it'],
            ['Favourite hadith and duas, your place in the Quran, Quran notes and highlights, your library, recent searches', 'Local storage', 'Until you delete it'],
            ['Dhikr counter, hifz, wird, daily worship and prayer statistics, learning progress and badges, quiz and game scores, calendar reminders', 'Local storage', 'Until you delete it'],
            ['Dua journal, charity log and missed-prayer (qada) records', 'Local storage', 'Until you delete it'],
            ['Profiles (up to 6) and the kid-mode lock', 'Local storage', 'Until you delete them'],
            ['AI assistant chat history', 'Local storage', 'Until you press “Clear chat” or delete it'],
            ['Notification settings, a copy of the notification address, read announcements, dismissed reminders', 'Local storage', 'Until you delete it'],
            ['A note that you are signed in (not your password or session key), this device’s sync settings, the keys of rooms and links you created or joined', 'Local storage', 'Until you sign out, leave or delete it'],
            ['Temporary copies: prayer times, verses, current weather, list position', 'Session storage', 'Until the browser tab is closed'],
            ['Copies of pages, responses and downloaded Quran audio for offline use', 'Browser cache (service worker)', 'Until the browser clears it or a new site version arrives'],
          ],
        } },
        '**How to delete it:** in your browser settings, clear the “site data” (or “cookies and site data”) for {domain}. This permanently removes everything above, including your dua journal and statistics. In private (incognito) mode, the data is deleted automatically when the window is closed.',
        { note: 'We do not back up this data automatically. Under "My data" at the bottom of the page you can download it as a file or turn on end-to-end encrypted sync — see [Sync and backups]({toSync}).' },
      ] },
      sync: { h: 'Sync and backups', body: [
        'Sync between devices is off until you turn it on. When you do, your data is encrypted **in your browser** ({aesgcm}) with a key derived from your recovery code. Our server stores only the encrypted copy and cannot read it; neither the code nor the key ever reaches us.',
        { ul: [
          '**Without an account:** the copy is stored under an identifier that is also derived from your recovery code — no account, cookie or {ip} address is linked to it. Anyone who has your recovery code can open the copy, so keep the code safe.',
          '**With an account:** the same encrypted copy can be linked to your account so that it opens on a new device after you sign in. For this, our server also keeps your recovery code, locked in your browser with a key made from your password ({pbkdf2}, 600,000 rounds) or from your passkey — we never receive that key.',
          '**How long:** until you press “Delete from server” or delete your account. A copy that nobody has touched for 400 days is deleted automatically, and a copy that was saved only once and never opened again is deleted after 30 days.',
        ] },
        { note: 'As with any sign-in with a password, your password passes through our server when you sign in (we store only a one-way {scrypt} hash of it). Synced data is therefore best protected when you sign in with a passkey or unlock sync with your recovery code.' },
        'A backup file you download under “My data” is created in your browser and saved only on your device.',
      ] },
      cookies: { h: 'Cookies', body: [
        '{brand} **uses no cookies for tracking or advertising**, and visitors who do not sign in get no cookies from us at all. The local storage described above serves only the features you choose to use, which is why we do not show a separate “cookie consent” banner.',
        'When you sign in, we set two strictly necessary cookies. Both are {httponly} cookies (scripts on the page cannot read them) and are sent only to {domain}:',
        { table: {
          head: ['Cookie', 'Why', 'How long'],
          rows: [
            ['{cookieuser}', 'Keeps you signed in (a random session key; our server stores only its hash)', '30 days, extended while you use the site; deleted when you sign out'],
            ['{cookiedev}', 'Recognises a device you have already signed in on, so that we can email you about sign-ins from new devices', '2 years'],
          ],
        } },
        'Third parties may set their own cookies: {cloudflare} may set a strictly necessary technical cookie to protect the site from attacks; {youtube} may use cookies under its own rules once you start playing a video; and if you sign in with {google}, {google}’s sign-in window works under {google}’s rules.',
      ] },
      analytics: { h: 'Visit statistics', body: [
        'To understand which parts of the site are useful, we keep simple, **cookieless** visit statistics on our own server; no third-party analytics service is used. When a page opens, the server receives only the page address (without the query string), the interface language and the domain name alone of the site that referred you; from the browser description we derive only the device type and browser family, and we do not determine your country or location. To count daily unique visitors, a one-way hash is computed from your {ip}, browser description and the date, using a secret key that changes every day — it lives only in the server’s memory for at most one day and is never written to disk. Only aggregate totals are stored, and they are deleted after 400 days. There are no cookies, identifiers or fingerprinting; if your browser sends “Do Not Track” or Global Privacy Control, your visit is not counted at all.',
        'If you arrive from an AI assistant (for example {chatgpt} or {perplexity}), all we see in the statistics is that site’s domain name — nothing about your conversation. Pages opened inside another website (our widgets and the {wordpress} plugin), the admin panel and automated browsers are not counted. To prevent abuse, your {ip} address is held in the server’s memory for at most one minute.',
      ] },
      account: { h: 'Your account', body: [
        'An account is optional. You can create one with an email address and password, with a passkey, or with {google}. We then store:',
        { ul: [
          'your email address and whether it is confirmed, an optional display name, your role (for example, mosque representative), when the account was created and when you last signed in, and the site language you use (so that our emails reach you in your language);',
          'how you sign in: a one-way {scrypt} hash of your password (never the password itself), the public keys of your passkeys (the private key never leaves your device) and, if you use {google}, {google}’s identifier for your account;',
          'two-step verification, if you turn it on: the secret of your authenticator app (encrypted) and hashes of your one-time backup codes;',
          'your sessions: for each one a random key (stored only as a hash), a short device label such as “{devlabel}” and dates — no {ip} address;',
          'a log of sign-ins and security changes (password, two-step verification, passkeys) with the sign-in method, the device label and the approximate country reported by {cloudflare} — kept for 90 days.',
        ] },
        '**Signing in with {google}:** {google}’s script loads only on the sign-in and sign-up pages. When you use it, {google} gives us your email address, your name and an account identifier; we keep the identifier and the email address and use the name as the display name of a new account. We never see your {google} password.',
        '**Security emails:** we write to you when someone signs in from a new device and when your password, two-step verification or passkeys change. The “This wasn’t me” link in such an email signs out every device and pauses sign-in with a password or {google} until you set a new password (passkeys keep working).',
        '**Protection against guessing:** to limit repeated sign-in attempts, your {ip} address is used only in the server’s memory, for a short time, and is never written to disk.',
        '**See, download or delete:** your account page shows what we keep, and “My data” lets you download all of it as a file. “Delete account” removes the account and everything linked to it from our database, including the encrypted sync copy linked to it. Only the pages you completed in the Ummah’s Live Khatm remain, without your name, in that round’s anonymous count.',
        'Roles such as mosque representative or editor are given by administrators. Every change of role is recorded in an audit log (only the account number and the roles — this record stays after the account is deleted), and opening the admin panel is recorded in your security log.',
      ] },
      email: { h: 'Emails', body: [
        'We send emails only to the address of your account, through our email delivery service {resend}, which receives the recipient’s address and the content of each email. Our logs never contain email addresses.',
        { ul: [
          '**Service emails** (always): confirming your address, resetting your password, a notice if someone tries to register with your address, and the security emails described above.',
          '**A welcome email** (once): after you confirm your address — in the site language you use, or in English and Arabic if we do not know it.',
          '**Emails you turn on yourself:** the weekly report and the reminders you set up (see the next section). They go only to a confirmed address, and each one has an unsubscribe link.',
          '**Occasional news from the site team:** only to confirmed accounts and never to an address that has unsubscribed. Each such email has a one-click unsubscribe link; unsubscribing stops these emails but not service or security emails. We keep a record of which of these emails went to which account for 180 days after the mailing ends.',
        ] },
      ] },
      accountdata: { h: 'Account features that store readable data', body: [
        'Most of what you do in your account is end-to-end encrypted. The features below are different: to send a reminder on time or to show something to your family, our server has to read the data, so it is stored **unencrypted**. All of them stay off until you turn them on, most ask for your explicit consent first, and you can delete the data at any time. Everything is deleted with your account and is included in your account export.',
        { table: {
          head: ['Feature', 'What is stored', 'Who sees it, and for how long'],
          rows: [
            ['Reminders: a letter to your future self, duas for loved ones who have passed away, your zakat date', 'The letter and its delivery date; the names of your loved ones (with an optional relation and note); the start of your zakat year (the amount only if you add it); your time zone and language', 'Only you; people you invite to follow your list see the names, not your notes. Until you delete them'],
            ['Weekly report by email', 'The day you chose, your time zone and language, and five numbers per week worked out by your browser (prayers, Quran pages, dhikr, fasting days, wird)', 'Only you. The numbers are deleted after 120 days'],
            ['Family circle (up to 8 accounts), family duas and the family Ramadan board', 'Membership; only the summary numbers you choose to share; cards (a template and a number, no free text); the dua requests you write; Ramadan counts and the names on the juz and iftar lists', 'Members of your circle. Cards are deleted after 60 days, dua requests after 30–90 days'],
            ['Group challenges and teacher classes', 'Membership and your daily ticks; in a class, the assignments and — only with your consent — your progress numbers', 'Other members see only daily totals, never names or rankings; a teacher sees one student’s progress only with that student’s consent. A challenge is deleted 30 days after it ends'],
            ['Public profile (off by default)', 'A handle, display name, kunya, short bio, favourite surah and learning badges', 'Anyone, at {profilepath}, while it is switched on. Reports about a profile are kept for 180 days'],
            ['Dua wall', 'Your request (up to 300 characters), an optional name (“Anonymous” by default) and its language', 'Everyone, for 30 days after a moderator approves it. Moderators never see your email address'],
            ['The Ummah’s Live Khatm', 'The page you take, the rounds you took part in, an optional dedication name and — only if you agree — your location rounded to about 110 km', 'A dedication is never public (only the number of dedications is shown) and is deleted 30 days after the round ends. The location appears once on the live map and is then deleted; the country (from {cloudflare}) is counted only in the round’s list of countries, not per person'],
            ['Secret dua friend', 'That you joined, your language and time zone, your pairing and the days you marked', 'Your friend never learns who you are. Pairings and marks are deleted when the 30-day round ends, your membership when you leave'],
            ['Hajj journey', 'The type of journey, the stages you tick and an optional short name — never your location', 'Your family circle and people with your private link. Deleted 30 days after you start'],
            ['Calendar feed', 'A secret link (stored only as a hash), the sections you choose and your language', 'Your calendar app or service, which fetches the feed with the link. Until you turn it off or create a new link'],
            ['«Test me» hifz link', 'The surah and verse range, the name to show and the listener’s marks (no free text)', 'You and the person with the link. Results are deleted 7 days after you open them'],
            ['«Read together»', 'The room and the nicknames of the people in it — only in the server’s memory, never on disk', 'People in the room. Closed after 24 hours without activity'],
            ['Mosque representative', 'Iqamah times, the Jumuah khutbah topic and announcements for your mosque', 'Everyone, on the mosque display and in the mosque finder. Announcements are deleted 30 days after they end'],
          ],
        } },
        'If you choose “Also send notifications to this device”, we also link that device’s notification address to your account so that your reminders arrive there.',
      ] },
      community: { h: 'Community boards: prayer rooms, janaza notices, volunteers', body: [
        'If you use these sections with an account, the following is stored on our server **unencrypted** and linked to your account. Posting, signing up and reporting require a confirmed email address.',
        { ul: [
          '**A prayer room suggestion:** the name, type, city, address, coordinates, floor and note of the place. After approval it is visible to everyone; your name and email are never shown. A rejected suggestion is deleted after 30 days, one still waiting after 90 days. A report about a place (the reason and a short note) is seen only by moderators. For “Near me” your location is used only in your browser and is not sent to the server.',
          '**A janaza notice** (only with your explicit consent): the name of the deceased, the date and time of the prayer, the place, and optionally the burial place and a family contact. Anyone with the private link can see it (the link itself is stored only as a hash); it appears in the public list only if you ask and after a moderator checks it, and the contact is never shown there. The notice is deleted automatically 30 days after the prayer date. For “I made dua” the family sees only a number: for signed-in visitors we keep one record per account so that each counts once, and for others nothing is written to the database.',
          '**A volunteer signup:** the name you enter and (only with your consent) your email are visible only to that mosque’s representative; the public list shows only how many slots are filled. Past tasks are deleted together with their signups after 30 days.',
        ] },
        'You can delete these records yourself at any time; deleting your account deletes all of them. They are included in your account data export.',
      ] },
      groups: { h: 'Group khatm and shared goals', body: [
        'When you create or join a room, only the display name you type (e.g. “Ali”), your marks (which juz you claimed, which days you ticked) and, in a dua room, the requests you write are stored on the server. No account is created and no {ip} address or other personal data is recorded. The management and participation keys stay only in your browser’s local storage. A room is deleted automatically 180 days after its last activity, and its creator can delete it at any time.',
      ] },
      trustbox: { h: 'Trust box', body: [
        'If you create a trust box in your account, your notes (will wishes, debts, where your documents are, words to your family) are encrypted **in your browser** with a trust passphrase that only you know (PBKDF2-SHA256 with 600,000 rounds; AES-256-GCM). Our server stores only the ciphertext, a random salt, the SHA-256 hash of the private link, the creation and change times and the day it was last opened with the link — never the passphrase, never the readable text and never your {ip} address.',
        '**How long:** until you delete the box; it is also deleted with your account. It is included, still encrypted, in your account export. If the passphrase is lost, nobody — including us — can recover the content.',
      ] },
      push: { h: 'Push notifications', body: [
        'Notifications are turned on only when you give permission. When you do, your browser’s own push service ({pushsvc}) gives your browser a notification address (a random key used to deliver notifications to your device), and we store a record like this in our own server’s database:',
        { ul: [
          'the notification address;',
          'a technical description of your browser (user agent: browser and operating system name and version);',
          'your interface language;',
          'your chosen prayer location: coordinates, time zone, city name and prayer-time calculation method (the city centre if you picked a city from the list; approximate coordinates if you set a custom location with “locate me”);',
          'your notification choices and when the record was created/updated.',
        ] },
        '**Why:** our server sends each subscriber a notification at the adhan time of their own city, plus only the optional reminders you switch on (for example “Did you pray?”, morning and evening adhkar, Jumuah, sunnah fasts, eclipses, the verse or hadith of the day); general announcements may also be sent to all subscribers. Your answer to “Did you pray?” stays on your device and is never sent to us.',
        '**How long:** until you turn notifications off. Pressing **“Disable”** in the site’s Notifications panel deletes the record from the database immediately. If you block notifications only in your browser or phone settings, the address becomes invalid and the server deletes the record the next time a delivery fails.',
        'If you are signed in and choose “Also send notifications to this device” for your personal reminders, the notification address is also linked to your account.',
        { note: 'In the mobile app, prayer reminders are scheduled on the device itself — no address is sent to our server for them.' },
      ] },
      telegram: { h: 'Telegram bot', body: [
        'The bot stays switched off until we connect it to {telegram}; while it is off, none of the following happens.',
        'When you use the site’s Telegram bot, your commands reach our server through Telegram’s servers; Telegram’s own privacy policy applies on that path. After you choose a city, the bot keeps only this record in our server’s database (unencrypted — by choosing a city you agree to this):',
        { ul: [
          'chat number (Telegram’s chat identifier — to send you replies);',
          'your interface language (from the language code Telegram reports);',
          'the city you chose (from the site’s city list);',
          'whether the adhan reminder is on or off, and when the record was created.',
        ] },
        'Your name, username, phone number and the text of your messages are not stored or logged; your {ip} address is not recorded.',
        '**How long:** until you send the /stop command to the bot or block the bot — in both cases the record is deleted immediately.',
      ] },
      ai: { h: 'AI assistant', body: [
        'When you ask the AI assistant a question, the text of your question, the last few messages of the current conversation and your interface language are sent to our server and from there, through the {openrouter} service, to an artificial-intelligence model (currently {gemini}). The answer comes back the same way.',
        { ul: [
          'Our server **does not store or log** the conversation text — only technical figures (response time and length) are recorded.',
          'Your chat history is stored only in your browser; you can delete it with “Clear chat”.',
          'To prevent abuse, your {ip} address is held briefly in the server’s memory for a one-minute request limit.',
          '{openrouter} and the model provider process the request under their own privacy policies.',
        ] },
        '**Quran search by meaning** works in a similar way: the words you type and your interface language go through our server and {openrouter} to the model, which only picks verse numbers — the verse text you see comes from the site’s own Quran data. Nothing is saved and the search text is not logged; identical searches are kept in the server’s memory for a short time.',
        '**Rating an answer:** if you mark an answer as not helpful, the question, the answer, the reason you choose and your optional comment are saved on our server for review — see [Error reports and feedback]({toFeedback}).',
        { note: 'Please do not share personal details such as your name, address, health or family situation with the AI assistant.' },
      ] },
      location: { h: 'Location data', body: [
        'We ask for your device’s location only when you press a button and your browser grants permission. Where location data goes:',
        { ul: [
          '**Detecting your city:** the nearest city is worked out on your device.',
          '**Qibla direction:** calculated entirely on your device and never sent anywhere.',
          '**Mosque finder:** your coordinates are sent to the {osm} data service ({overpass}) to find nearby mosques.',
          '**Prayer times:** for cities in Azerbaijan the times are calculated on your device; for other places the coordinates and time zone of your chosen location are sent to aladhan.com.',
          '**City search:** the city name you type is sent to {openmeteo}.',
          '**Weather on the home page:** the coordinates of your chosen city or location are sent to {openmeteo} to show the current weather.',
          '**Crescent sighting map:** a report you send stores only an area of about 110 km, the evening and the hour, whether you saw the crescent and how you looked — no account, name or {ip} address.',
          '**“Remembering Allah right now” map:** when you count dhikr or salawat and have chosen your own city for prayer times, that city’s position, rounded to about 200 km, stays in the server’s memory for 10 minutes and is never saved. The daily totals of the Ummah counter contain no personal data.',
          '**Open in maps / Directions:** these links open {gmaps} in a new tab with the coordinates.',
        ] },
      ] },
      feedback: { h: 'Error reports and feedback', body: [
        '**“Report an error”:** the page, the kind of error, your text and — only if you enter it — a way to contact you are stored on our server. Only administrators can read them, and they delete them in the admin panel; no {ip} address, cookie or browser details are saved with them.',
        '**Rating an AI answer:** if you mark an answer as not helpful, the question, the answer, the reason you pick and your optional comment are stored in the same way.',
        '**Automatic error reports:** if a page hits a programming error, your browser sends us the error message, the script file and line, and the page path (without the query string); email addresses and long numbers in the message are masked. These reports are kept only in the server’s memory and are cleared when it restarts; no {ip} address, cookie or browser description is stored. Security-policy ({csp}) violation reports sent by browsers are handled the same way.',
      ] },
      embeds: { h: 'Widgets, sharing and Instagram', body: [
        { ul: [
          '**On other websites:** when our prayer-times widget, the mosque display or the {wordpress} plugin is shown on another site, it sends no visit statistics and sets no cookies; it may keep display settings in your browser, separately for each site. The compact mosque display tells the page around it only the height of its content (a number), so that the frame fits. Automatic error reports work as described above. For places outside Azerbaijan, your browser fetches the times from aladhan.com.',
          '**Sharing to {brand}:** if you share text to {brand} from another app (“Share” on Android), the text stays in your browser — it is not saved on our server, not written to our server logs and not kept in the offline cache. It is used only for the action you choose: for example, a Quran search sends the Arabic text to {alquran}, and adding it to your dua journal keeps it on your device.',
          '**Our Instagram account:** posts are published automatically and contain only the site’s public content (a verse, a hadith, a dua or one of the names of Allah) — no visitor or account data is used. When you open Instagram, its own privacy policy applies.',
        ] },
      ] },
      thirdparty: { h: 'Third-party services', body: [
        'The site uses the services below. As with any request on the internet, when your browser connects to them your {ip} address and browser details become known to that service, which processes them under its own policy.',
        { table: {
          head: ['Service', 'Purpose', 'What is sent'],
          rows: [
            ['{cloudflare}', 'Delivering the site (CDN) and protecting it from attacks', 'All requests to the site'],
            ['{pushsvc}', 'Delivering push notifications to your device (your browser’s own service)', 'If notifications are on — the encrypted notification text and the notification address'],
            ['{openrouter}, {gemini}', 'AI assistant answers and Quran search by meaning', 'Your question and the last messages of the chat, or your search words (via our server)'],
            ['{resend}', 'Delivering our emails', 'Your email address and the content of the email (only if you have an account)'],
            ['{google}', 'Signing in with {google}', 'Only if you use it, on the sign-in and sign-up pages'],
            ['aladhan.com', 'Calculating prayer times for places outside Azerbaijan', 'Coordinates of the chosen location, time zone, method'],
            ['{alquran}, {islamicnetwork}, {qurancom}', 'Quran text, translations, recitation audio', 'Surah/verse requests'],
            ['{quranenc}, {hadeethenc}, {jsdelivr}, {github}', 'Translations of the meanings and hadith texts', 'Requests for the texts you open'],
            ['hisnmuslim.com', 'Audio of the duas', 'Only when you press “Listen”'],
            ['{osm} ({overpass})', 'Finding nearby mosques', 'Coordinates of the search area'],
            ['{openmeteo}', 'Searching cities worldwide and the current weather on the home page', 'The city name you type; the coordinates of your chosen location'],
            ['{openfoodfacts}', 'Product lookup in the halal check', 'Only the barcode you enter'],
            ['{exchangerate}', 'Currency rates in the zakat calculator', 'Only the exchange-rate request'],
            ['{youtube}', 'Video thumbnails and playback (privacy-enhanced mode)', 'Thumbnail requests when the Videos section opens; the video once you press play'],
            ['{telegram}', 'The site’s bot', 'Only if you write to the bot'],
            ['{gmaps}, Instagram', 'Map and social media links', 'Only when you click the link'],
          ],
        } },
        'We never sell your data or pass it on for advertising or profiling.',
      ] },
      logs: { h: 'Server logs', body: [
        'Like any web server, ours ({nginx}) keeps technical records of incoming requests: {ip} address, time, the address requested, the response code and browser details. Requests for static files such as images, fonts and scripts are not logged, and neither are the statistics beacon, the sharing page, calendar feeds and live updates.',
        'These records are used only to fix errors and protect the site from attacks. They are limited by size (about 3 files of 10 MB): as space fills up, the oldest entries are automatically overwritten. Requests reach our server through {cloudflare}, which also processes the traffic under its own policy.',
      ] },
      purposes: { h: 'Purposes and legal basis', body: [
        { ul: [
          '**Providing the service** — running the site, keeping it and your account secure and fixing errors (server logs, request limits, the security log and alerts, error reports, {cloudflare}): our legitimate interest in operating the site reliably and safely.',
          '**Your account** — creating and running it, signing you in and the emails that come with it (confirmation, password reset, security alerts): necessary to provide the account you asked for.',
          '**Your consent** — push notifications, access to your device’s location and the optional features that store readable data on our server (reminders, the weekly report, family and community features, the public profile): you turn each one on yourself and can withdraw at any time by turning it off or deleting the data.',
          '**Your request** — the AI assistant, Quran search by meaning, city and mosque search, the halal check: data is sent only when you use that feature and only to get you an answer.',
          '**Anonymous statistics and occasional news emails** — understanding which parts of the site are useful and telling account holders about the service: our legitimate interest; the statistics identify no one, and you can unsubscribe from news emails with one click.',
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
        'If you have an account, you can do most of this yourself on your account page: see and download your data (“My data”), correct your display name and password, and delete individual records or the whole account. Without an account we usually cannot identify you, and most data is only on your device anyway — you can delete it yourself in your browser. You can delete your notification record instantly with the “Disable” button. For anything else, [get in touch]({toContact}).',
      ] },
      children: { h: 'Children', body: [
        'The site is meant for all ages and includes a section for children, which works without an account and sends nothing about the child to our server. Profiles and the kid-mode lock let a parent set up a space for a child inside the parent’s own account; they stay on the device or in the encrypted sync. We recommend that children use accounts, community features, the AI assistant and notifications only under a parent’s supervision.',
      ] },
      security: { h: 'Security', body: [
        'All communication with the site goes over an encrypted HTTPS connection. Passwords are stored only as one-way {scrypt} hashes, session keys and private links only as {sha256} hashes, and two-step verification secrets are encrypted; your synced data and your trust box are encrypted in your browser before they reach us. Access to the server is restricted and secret keys are not kept in the code. Even so, no method on the internet can guarantee complete security.',
      ] },
      transfers: { h: 'International transfers', body: [
        'The servers of the services listed above — including our email delivery service — may be located in different countries (including the United States and the European Union). When you use these services, the related data may be processed in those countries.',
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
          '**Учётная запись необязательна.** Большая часть сайта работает без неё. Если вы её создадите, мы храним ваш адрес почты, отображаемое имя (по желанию) и способ входа (подробнее ниже).',
          '**Нет рекламы и отслеживания.** Нет рекламных и отслеживающих куки и рекламных сетей. Для входа в аккаунт используются два строго необходимых куки, а статистика посещений анонимная, без куки и ведётся на собственном сервере.',
          '**Ваши данные остаются на устройстве.** Настройки, избранное, зикр, хифз, дневник дуа и прочее хранятся в вашем браузере. Если включить синхронизацию, они сначала шифруются в браузере — на сервере остаётся только копия, которую мы не можем прочитать.',
          '**На сервер попадает только необходимое:** например, адрес для уведомлений и город, если вы их включите, текст вопроса, если спросите ИИ-помощника, а в разделах сообщества и семьи — только то, чем вы сами решите поделиться. В каждом разделе ниже сказано, что хранится, кто это видит и как долго.',
          '**Мы никогда не продаём ваши данные** и не передаём их для рекламы или составления профилей.',
        ] },
      ] },
      controller: { h: 'К чему относится эта политика', body: [
        'Политика распространяется на сайт {brand} ({domain}), его мобильное приложение, виджеты времени намаза и плагин {wordpress}, которые показывают материалы сайта на других сайтах, а также на Telegram-бота сайта. Сервис бесплатный и без рекламы.',
        { when: IF_OPERATOR, p: 'Сервисом управляет **{operator}** — он отвечает за обработку данных, описанную в этой политике.' },
        'По вопросам и запросам обращайтесь через раздел [Контакты]({toContact}).',
      ] },
      local: { h: 'Данные, которые хранятся в вашем браузере', body: [
        'Настройки, нужные для работы сайта, хранятся в локальном хранилище браузера ({localstorage}) и в хранилище сессии ({sessionstorage}). Эти данные **не отправляются на наш сервер** (исключения описаны отдельно ниже) и доступны только в этом браузере.',
        { table: {
          head: ['Что', 'Где', 'Как долго'],
          rows: [
            ['Язык, тема (светлая/тёмная), настройки доступности, состояние меню, порядок блоков на главной', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Выбранный город или своё место, недавно выбранные города', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Избранные хадисы и дуа, место чтения Корана, заметки и выделения в Коране, ваша библиотека, недавние поиски', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Счётчик зикра, хифз, вирд, статистика ежедневных поклонений и намазов, прогресс обучения и значки, баллы викторин и игр, напоминания календаря', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Дневник дуа, записи о садаке и о пропущенных намазах (када)', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Профили (до 6) и замок детского режима', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['История чата с ИИ-помощником', 'Локальное хранилище', 'Пока вы не нажмёте «Очистить чат» или не удалите её'],
            ['Настройки уведомлений, копия адреса уведомлений, прочитанные объявления, скрытые напоминания', 'Локальное хранилище', 'Пока вы их не удалите'],
            ['Отметка о том, что вы вошли (не пароль и не ключ сессии), настройки синхронизации этого устройства, ключи созданных или открытых вами комнат и ссылок', 'Локальное хранилище', 'Пока вы не выйдете, не покинете комнату или не удалите их'],
            ['Временные копии: время намаза, аяты, текущая погода, позиция в списке', 'Хранилище сессии', 'До закрытия вкладки'],
            ['Копии страниц, ответов и скачанного аудио Корана для работы без сети', 'Кэш браузера (сервис-воркер)', 'Пока браузер его не очистит или не выйдет новая версия сайта'],
          ],
        } },
        '**Как удалить:** в настройках браузера удалите «данные сайта» (или «файлы куки и данные сайтов») для {domain}. Это безвозвратно сотрёт всё перечисленное, включая дневник дуа и статистику. В режиме инкогнито данные удаляются сами при закрытии окна.',
        { note: 'Мы не создаём резервные копии этих данных автоматически. В разделе «Мои данные» внизу страницы их можно скачать файлом или включить синхронизацию со сквозным шифрованием — см. [Синхронизация и резервные копии]({toSync}).' },
      ] },
      sync: { h: 'Синхронизация и резервные копии', body: [
        'Синхронизация между устройствами выключена, пока вы её не включите. После включения данные шифруются **в вашем браузере** ({aesgcm}) ключом, полученным из кода восстановления. Сервер хранит только зашифрованную копию и не может её прочитать; ни код, ни ключ к нам никогда не попадают.',
        { ul: [
          '**Без аккаунта:** копия хранится под идентификатором, который тоже получен из кода восстановления, — к ней не привязаны ни аккаунт, ни куки, ни {ip}-адрес. Открыть копию может любой, у кого есть код, поэтому храните его надёжно.',
          '**С аккаунтом:** ту же зашифрованную копию можно привязать к аккаунту, чтобы она открывалась на новом устройстве после входа. Для этого сервер также хранит ваш код восстановления, запертый в браузере ключом из пароля ({pbkdf2}, 600 000 итераций) или из ключа доступа, — сам этот ключ мы никогда не получаем.',
          '**Как долго:** пока вы не нажмёте «Удалить с сервера» или не удалите аккаунт. Копия, к которой никто не обращался 400 дней, удаляется автоматически, а копия, сохранённая один раз и больше ни разу не открытая, — через 30 дней.',
        ] },
        { note: 'Как и при любом входе по паролю, пароль проходит через наш сервер в момент входа (мы храним только его одностороннюю хеш-сумму {scrypt}). Поэтому сильнее всего синхронизированные данные защищены, если входить с ключом доступа или открывать синхронизацию кодом восстановления.' },
        'Файл резервной копии, который вы скачиваете в разделе «Мои данные», создаётся в браузере и хранится только на вашем устройстве.',
      ] },
      cookies: { h: 'Файлы куки', body: [
        '{brand} **не использует куки для отслеживания или рекламы**, а посетители, которые не входят в аккаунт, вообще не получают от нас куки. Описанное выше локальное хранилище служит только функциям, которыми вы пользуетесь, поэтому отдельное окно «согласия на куки» мы не показываем.',
        'При входе в аккаунт мы устанавливаем два строго необходимых куки. Оба имеют пометку {httponly} (скрипты на странице не могут их прочитать) и отправляются только на {domain}:',
        { table: {
          head: ['Куки', 'Зачем', 'Как долго'],
          rows: [
            ['{cookieuser}', 'Сохраняет вход в аккаунт (случайный ключ сессии; на сервере хранится только его хеш)', '30 дней, продлевается, пока вы пользуетесь сайтом; удаляется при выходе'],
            ['{cookiedev}', 'Узнаёт устройство, с которого вы уже входили, чтобы мы могли написать вам о входах с новых устройств', '2 года'],
          ],
        } },
        'Сторонние сервисы могут устанавливать свои куки: {cloudflare} может записать строго необходимый технический файл куки для защиты сайта от атак, {youtube} — использовать куки по своим правилам, когда вы запускаете видео, а если вы входите через {google}, окно входа {google} работает по его правилам.',
      ] },
      analytics: { h: 'Статистика посещений', body: [
        // lang-ok[Do,Not,Track,Global,Privacy,Control]: стандартные названия
        'Чтобы понимать, какие разделы сайта полезны, мы ведём простую статистику посещений **без куки** на собственном сервере; сторонние сервисы аналитики не используются. При открытии страницы на сервер передаются только адрес страницы (без строки запроса), язык интерфейса и лишь доменное имя сайта, с которого вы пришли; из описания браузера извлекаются только тип устройства и семейство браузера, страна и местоположение не определяются. Для подсчёта уникальных посетителей за день из вашего адреса {ip}, описания браузера и даты вычисляется односторонний хеш с секретным ключом, который меняется каждый день, — он хранится только в памяти сервера не дольше суток и не записывается на диск. В базе хранятся только итоговые суммы, которые удаляются через 400 дней. Куки, идентификаторов и «отпечатков» нет; если в браузере включён «Do Not Track» или Global Privacy Control, посещение не учитывается вовсе.',
        'Если вы пришли от ИИ-помощника (например, {chatgpt} или {perplexity}), мы видим в статистике только доменное имя этого сайта — ничего о вашем разговоре. Страницы, открытые внутри другого сайта (наши виджеты и плагин {wordpress}), панель управления и автоматические браузеры не учитываются. Для защиты от злоупотреблений ваш {ip}-адрес хранится в памяти сервера не дольше минуты.',
      ] },
      account: { h: 'Ваш аккаунт', body: [
        'Аккаунт необязателен. Его можно создать по адресу почты и паролю, с ключом доступа или через {google}. Тогда мы храним:',
        { ul: [
          'адрес почты и отметку о его подтверждении, отображаемое имя (по желанию), вашу роль (например, представитель мечети), даты создания аккаунта и последнего входа, а также язык сайта, которым вы пользуетесь (чтобы письма приходили на вашем языке);',
          'способ входа: одностороннюю хеш-сумму пароля {scrypt} (никогда не сам пароль), открытые ключи ваших ключей доступа (секретный ключ не покидает устройство), а если вы входите через {google} — идентификатор вашего аккаунта {google};',
          'двухэтапную проверку, если вы её включили: секрет приложения для кодов (в зашифрованном виде) и хеши одноразовых резервных кодов;',
          'ваши сессии: для каждой — случайный ключ (хранится только его хеш), короткая метка устройства вроде «{devlabel}» и даты — без {ip}-адреса;',
          'журнал входов и изменений безопасности (пароль, двухэтапная проверка, ключи доступа) со способом входа, меткой устройства и примерной страной, которую сообщает {cloudflare}, — хранится 90 дней.',
        ] },
        '**Вход через {google}:** скрипт {google} загружается только на страницах входа и регистрации. Когда вы им пользуетесь, {google} передаёт нам адрес почты, имя и идентификатор аккаунта; мы храним идентификатор и адрес, а имя используем как отображаемое имя нового аккаунта. Пароль от {google} мы никогда не видим.',
        '**Письма о безопасности:** мы пишем вам, когда кто-то входит с нового устройства и когда меняются пароль, двухэтапная проверка или ключи доступа. Ссылка «Это был не я» в таком письме завершает сессии на всех устройствах и приостанавливает вход по паролю и через {google}, пока вы не зададите новый пароль (ключи доступа продолжают работать).',
        '**Защита от подбора:** чтобы ограничить повторные попытки входа, ваш {ip}-адрес используется только в памяти сервера, недолго, и не записывается на диск.',
        '**Посмотреть, скачать, удалить:** страница аккаунта показывает, что мы храним, а «Мои данные» позволяют скачать всё это файлом. «Удалить аккаунт» стирает из нашей базы аккаунт и всё, что с ним связано, включая привязанную к нему зашифрованную копию синхронизации. Остаются только страницы, прочитанные вами в Живом хатме уммы, — без имени, как часть анонимного счёта этого круга.',
        'Роли вроде представителя мечети или редактора назначают администраторы. Каждая смена роли записывается в журнал аудита (только номер аккаунта и роли — эта запись остаётся и после удаления аккаунта), а открытие панели управления — в ваш журнал безопасности.',
      ] },
      email: { h: 'Письма', body: [
        'Мы отправляем письма только на адрес вашего аккаунта через сервис доставки почты {resend}, который получает адрес получателя и текст каждого письма. В наших журналах адресов почты нет.',
        { ul: [
          '**Служебные письма** (всегда): подтверждение адреса, сброс пароля, уведомление, если кто-то пытается зарегистрироваться с вашим адресом, и письма о безопасности, описанные выше.',
          '**Приветственное письмо** (один раз): после подтверждения адреса — на языке сайта, которым вы пользуетесь, а если он неизвестен — на английском и арабском.',
          '**Письма, которые вы включаете сами:** еженедельный отчёт и настроенные вами напоминания (см. следующий раздел). Они приходят только на подтверждённый адрес, и в каждом есть ссылка для отписки.',
          '**Иногда — новости от команды сайта:** только на подтверждённые аккаунты и никогда на адрес, который отписался. В каждом таком письме есть ссылка для отписки в один клик; отписка останавливает эти письма, но не служебные и не письма о безопасности. Запись о том, какое из этих писем ушло на какой аккаунт, хранится 180 дней после окончания рассылки.',
        ] },
      ] },
      accountdata: { h: 'Функции аккаунта, данные которых читает сервер', body: [
        'Большая часть того, что вы делаете в аккаунте, защищена сквозным шифрованием. С функциями ниже иначе: чтобы вовремя отправить напоминание или показать что-то семье, сервер должен читать данные, поэтому они хранятся **без шифрования**. Все они выключены, пока вы их не включите, большинство сначала просит явного согласия, и данные можно удалить в любой момент. Всё удаляется вместе с аккаунтом и входит в выгрузку данных аккаунта.',
        { table: {
          head: ['Функция', 'Что хранится', 'Кто видит и как долго'],
          rows: [
            ['Напоминания: письмо себе в будущее, дуа за умерших близких, дата закята', 'Письмо и дата его доставки; имена близких (по желанию — степень родства и заметка); начало вашего года закята (сумма — только если вы её укажете); часовой пояс и язык', 'Только вы; приглашённые вами следить за списком видят имена, но не заметки. Пока вы их не удалите'],
            ['Еженедельный отчёт на почту', 'Выбранный день, часовой пояс и язык и пять чисел за неделю, которые считает ваш браузер (намазы, страницы Корана, зикр, дни поста, вирд)', 'Только вы. Числа удаляются через 120 дней'],
            ['Семейный круг (до 8 аккаунтов), семейные дуа и семейная доска Рамадана', 'Членство; только те итоговые числа, которыми вы решили поделиться; открытки (шаблон и число, без свободного текста); ваши просьбы о дуа; счёт за Рамадан и имена в списках джузов и ифтаров', 'Участники вашего круга. Открытки удаляются через 60 дней, просьбы о дуа — через 30–90 дней'],
            ['Групповые челленджи и классы учителей', 'Членство и ваши ежедневные отметки; в классе — задания и, только с вашего согласия, ваши показатели прогресса', 'Остальные видят только общие итоги за день, без имён и рейтингов; учитель видит прогресс отдельного ученика только с его согласия. Челлендж удаляется через 30 дней после окончания'],
            ['Открытый профиль (по умолчанию выключен)', 'Ник, отображаемое имя, кунья, короткое описание, любимая сура и значки обучения', 'Все, по адресу {profilepath}, пока профиль включён. Жалобы на профиль хранятся 180 дней'],
            ['Стена дуа', 'Ваша просьба (до 300 символов), имя по желанию (по умолчанию «Аноним») и её язык', 'Все — 30 дней после одобрения модератором. Модераторы никогда не видят ваш адрес почты'],
            ['Живой хатм уммы', 'Взятая вами страница, круги, в которых вы участвовали, посвящение (по желанию) и — только с вашего согласия — ваше место, округлённое примерно до 110 км', 'Посвящение никогда не публикуется (показывается только число посвящений) и удаляется через 30 дней после окончания круга. Место один раз появляется на живой карте и удаляется; страна ({cloudflare}) учитывается только в общем списке стран круга, а не по людям'],
            ['Тайный друг по дуа', 'Факт участия, язык и часовой пояс, ваша пара и отмеченные дни', 'Друг никогда не узнаёт, кто вы. Пары и отметки удаляются по окончании 30-дневного круга, участие — когда вы выйдете'],
            ['Путешествие в хадж', 'Вид поездки, отмеченные этапы и короткое имя по желанию — никогда не ваше местоположение', 'Ваш семейный круг и обладатели вашей закрытой ссылки. Удаляется через 30 дней после начала'],
            ['Календарная подписка', 'Секретная ссылка (хранится только хеш), выбранные разделы и язык', 'Ваше приложение или сервис календаря, который загружает подписку по ссылке. Пока вы её не выключите или не создадите новую ссылку'],
            ['Ссылка «Проверь меня» для хифза', 'Сура и диапазон аятов, показываемое имя и отметки слушающего (без свободного текста)', 'Вы и человек со ссылкой. Результаты удаляются через 7 дней после того, как вы их открыли'],
            ['«Читаем вместе»', 'Комната и ники участников — только в памяти сервера, никогда на диске', 'Участники комнаты. Закрывается после 24 часов без активности'],
            ['Представитель мечети', 'Время икамы, тема пятничной хутбы и объявления вашей мечети', 'Все — на экране мечети и в поиске мечетей. Объявления удаляются через 30 дней после окончания'],
          ],
        } },
        'Если выбрать «Также присылать уведомления на это устройство», мы также привязываем адрес уведомлений этого устройства к аккаунту, чтобы напоминания приходили и туда.',
      ] },
      community: { h: 'Доски сообщества: комнаты для намаза, объявления о джаназе, волонтёры', body: [
        'Если вы пользуетесь этими разделами с аккаунтом, на нашем сервере **без шифрования** хранится и привязывается к аккаунту следующее. Чтобы публиковать, записываться и жаловаться, нужен подтверждённый адрес почты.',
        { ul: [
          '**Предложение комнаты для намаза:** название, тип, город, адрес, координаты, этаж и заметка. После одобрения видно всем; ваше имя и почта не показываются. Отклонённое предложение удаляется через 30 дней, ожидающее — через 90 дней. Жалобу на место (причину и короткую заметку) видят только модераторы. Для «Рядом со мной» местоположение используется только в браузере и на сервер не отправляется.',
          '**Объявление о джаназе** (только с вашего явного согласия): имя умершего, дата и время молитвы, место, по желанию — место погребения и связь с семьёй. Его видит каждый, у кого есть закрытая ссылка (сама ссылка хранится только в виде хеша); в общий список оно попадает только по вашему желанию и после проверки модератором, связь с семьёй там не показывается. Объявление удаляется автоматически через 30 дней после даты молитвы. По отметке «Сделал(а) дуа» семья видит только число: для вошедших посетителей хранится одна запись на аккаунт, чтобы каждый учитывался один раз, а для остальных в базу ничего не записывается.',
          '**Запись волонтёром:** указанное вами имя и (только с вашего согласия) почта видны только представителю этой мечети; в общем списке — только число занятых мест. Прошедшие задачи удаляются вместе с записями через 30 дней.',
        ] },
        'Вы можете удалить эти записи сами в любое время; при удалении аккаунта удаляется всё. Они входят в выгрузку данных аккаунта.',
      ] },
      groups: { h: 'Общий хатм и общие цели', body: [
        'При создании комнаты или присоединении к ней на сервере хранятся только введённое вами отображаемое имя (например, «Али»), ваши отметки (какой джуз вы взяли, какие дни отметили) и, в комнате дуа, написанные вами просьбы. Учётная запись не создаётся, адрес {ip} и другие личные данные не записываются. Ключи управления и участия остаются только в локальном хранилище вашего браузера. Комната удаляется автоматически через 180 дней после последней активности; её создатель может удалить её в любое время.',
      ] },
      trustbox: { h: 'Ящик доверия', body: [
        // lang-ok[PBKDF,SHA,AES-]: alqoritmlərin adları tərcümə olunmur
        'Если вы создадите в аккаунте ящик доверия, ваши записи (пожелания по завещанию, долги, где лежат документы, слова семье) шифруются **в вашем браузере** парольной фразой, которую знаете только вы (PBKDF2-SHA256, 600 000 итераций; AES-256-GCM). На нашем сервере хранятся только шифротекст, случайная соль, хеш SHA-256 секретной ссылки, время создания и изменения и день последнего открытия по ссылке — но никогда не фраза, не читаемый текст и не ваш {ip}-адрес.',
        '**Как долго:** пока вы не удалите ящик; он удаляется и вместе с аккаунтом. В экспорт аккаунта он попадает в зашифрованном виде. Если фраза потеряна, восстановить содержимое не может никто — и мы тоже.',
      ] },
      push: { h: 'Пуш-уведомления', body: [
        'Уведомления включаются только с вашего разрешения. После этого собственная пуш-служба вашего браузера ({pushsvc}) выдаёт браузеру адрес для уведомлений (случайный ключ для доставки уведомлений на ваше устройство), а мы сохраняем в базе данных нашего сервера запись следующего вида:',
        { ul: [
          'адрес для уведомлений;',
          'техническое описание браузера (название и версия браузера и операционной системы);',
          'язык интерфейса;',
          'выбранное место для намаза: координаты, часовой пояс, название города и метод расчёта времени (если город выбран из списка — центр города; если своё место задано кнопкой «определить моё место» — приблизительные координаты этого места);',
          'ваш выбор уведомлений и время создания/обновления записи.',
        ] },
        '**Зачем:** сервер отправляет каждому подписчику уведомление во время азана в его городе и только те дополнительные напоминания, которые вы включили (например, «Вы совершили намаз?», утренние и вечерние азкары, пятница, сунна-посты, затмения, аят или хадис дня); также всем подписчикам могут приходить общие объявления. Ваш ответ на «Вы совершили намаз?» остаётся на устройстве и нам не отправляется.',
        '**Как долго:** пока вы не отключите уведомления. Кнопка **«Отключить»** в панели «Уведомления» на сайте сразу удаляет запись из базы. Если запретить уведомления только в настройках браузера или телефона, адрес становится недействительным, и сервер удаляет запись при следующей неудачной отправке.',
        'Если вы вошли в аккаунт и для личных напоминаний выбрали «Также присылать уведомления на это устройство», адрес уведомлений привязывается и к аккаунту.',
        { note: 'В мобильном приложении напоминания о намазе планируются на самом устройстве — для них адрес на сервер не отправляется.' },
      ] },
      telegram: { h: 'Telegram-бот', body: [
        'Бот выключен, пока мы не подключим его к {telegram}; пока он выключен, ничего из описанного ниже не происходит.',
        'Когда вы пользуетесь Telegram-ботом сайта, ваши команды доходят до нашего сервера через серверы Telegram; на этом пути действует собственная политика конфиденциальности Telegram. После выбора города бот хранит в базе данных нашего сервера только такую запись (без шифрования — выбирая город, вы соглашаетесь с этим):',
        { ul: [
          'номер чата (идентификатор чата Telegram — чтобы отправлять вам ответы);',
          'язык интерфейса (по коду языка, который сообщает Telegram);',
          'выбранный город (из списка городов сайта);',
          'включено ли напоминание об азане и время создания записи.',
        ] },
        'Ваше имя, имя пользователя, номер телефона и текст сообщений не сохраняются и не записываются в журналы; {ip}-адрес не сохраняется.',
        // lang-ok[stop]: botun əmr adı (/stop)
        '**Как долго:** пока вы не отправите боту команду /stop или не заблокируете бота — в обоих случаях запись сразу удаляется.',
      ] },
      ai: { h: 'ИИ-помощник', body: [
        'Когда вы задаёте вопрос ИИ-помощнику, текст вопроса, несколько последних сообщений текущего диалога и язык интерфейса отправляются на наш сервер, а оттуда через сервис {openrouter} — модели искусственного интеллекта (сейчас это {gemini}). Ответ возвращается тем же путём.',
        { ul: [
          'Наш сервер **не хранит и не записывает в журналы** текст переписки — фиксируются только технические показатели (время и длина ответа).',
          'История чата хранится только в вашем браузере; её можно удалить кнопкой «Очистить чат».',
          'Для защиты от злоупотреблений ваш адрес {ip} ненадолго хранится в оперативной памяти сервера для лимита запросов в одну минуту.',
          '{openrouter} и поставщик модели обрабатывают запрос по своим политикам конфиденциальности.',
        ] },
        '**Поиск по смыслу в Коране** устроен похоже: введённые вами слова и язык интерфейса идут через наш сервер и {openrouter} к модели, которая лишь выбирает номера аятов, — текст аятов вы видите из собственных данных сайта. Ничего не сохраняется, и текст поиска не записывается в журналы; одинаковые запросы недолго хранятся в памяти сервера.',
        '**Оценка ответа:** если вы отметите ответ как бесполезный, вопрос, ответ, выбранная причина и ваш комментарий (по желанию) сохраняются на сервере для проверки — см. [Сообщения об ошибках и отзывы]({toFeedback}).',
        { note: 'Не сообщайте ИИ-помощнику личные сведения — имя, адрес, данные о здоровье или семье.' },
      ] },
      location: { h: 'Данные о местоположении', body: [
        'Мы запрашиваем местоположение устройства только после нажатия кнопки и с разрешения браузера. Куда попадают данные о местоположении:',
        { ul: [
          '**Определение города:** ближайший город вычисляется на вашем устройстве.',
          '**Направление киблы:** рассчитывается полностью на устройстве и никуда не передаётся.',
          '**Поиск мечетей:** ваши координаты отправляются в сервис данных {osm} ({overpass}), чтобы найти мечети поблизости.',
          '**Время намаза:** для городов Азербайджана время рассчитывается на вашем устройстве; для других мест координаты и часовой пояс выбранного места отправляются на aladhan.com.',
          '**Поиск города:** введённое название города отправляется в {openmeteo}.',
          '**Погода на главной:** чтобы показать текущую погоду, координаты выбранного города или места отправляются в {openmeteo}.',
          '**Карта наблюдения месяца:** в вашем сообщении хранятся только участок примерно 110 км, вечер и час, видели ли вы молодой месяц и как смотрели, — без аккаунта, имени и {ip}-адреса.',
          '**Карта «Сейчас поминают Аллаха»:** когда вы считаете зикр или салават и выбрали свой город для времени намаза, положение этого города, округлённое примерно до 200 км, 10 минут хранится в памяти сервера и никогда не сохраняется. В дневных итогах счётчика уммы нет личных данных.',
          '**Открыть на карте / Маршрут:** по этим ссылкам {gmaps} открывается в новой вкладке с координатами.',
        ] },
      ] },
      feedback: { h: 'Сообщения об ошибках и отзывы', body: [
        '**«Сообщить об ошибке»:** на сервере сохраняются страница, вид ошибки, ваш текст и — только если вы его укажете — способ связаться с вами. Читают это только администраторы, они же удаляют записи в панели управления; {ip}-адрес, куки и данные браузера вместе с ними не сохраняются.',
        '**Оценка ответа ИИ:** если вы отметите ответ как бесполезный, вопрос, ответ, выбранная причина и комментарий (по желанию) сохраняются так же.',
        '**Автоматические отчёты об ошибках:** если на странице происходит программная ошибка, браузер отправляет нам текст ошибки, файл скрипта и строку, а также путь страницы (без строки запроса); адреса почты и длинные числа в тексте маскируются. Эти отчёты хранятся только в памяти сервера и стираются при его перезапуске; {ip}-адрес, куки и описание браузера не сохраняются. Так же обрабатываются отчёты браузеров о нарушениях политики безопасности ({csp}).',
      ] },
      embeds: { h: 'Виджеты, «Поделиться» и Instagram', body: [
        { ul: [
          '**На других сайтах:** когда наш виджет времени намаза, экран мечети или плагин {wordpress} показывается на другом сайте, он не отправляет статистику посещений и не ставит куки; настройки отображения он может хранить в вашем браузере — отдельно для каждого сайта. Компактный экран мечети сообщает окружающей странице только высоту своего содержимого (число), чтобы рамка подстроилась под него. Автоматические отчёты об ошибках работают, как описано выше. Для мест за пределами Азербайджана время запрашивает у aladhan.com ваш браузер.',
          '**Поделиться с {brand}:** если вы поделитесь текстом с {brand} из другого приложения («Поделиться» на Android), текст остаётся в браузере — он не сохраняется на сервере, не записывается в журналы сервера и не попадает в офлайн-кэш. Он используется только для выбранного вами действия: например, поиск в Коране отправляет арабский текст в {alquran}, а добавление в дневник дуа сохраняет его на устройстве.',
          '**Наш аккаунт в Instagram:** публикации выходят автоматически и содержат только открытые материалы сайта (аят, хадис, дуа или одно из имён Аллаха) — данные посетителей и аккаунтов не используются. Когда вы открываете Instagram, действует его собственная политика конфиденциальности.',
        ] },
      ] },
      thirdparty: { h: 'Сторонние сервисы', body: [
        'Сайт использует перечисленные ниже сервисы. Как и при любом запросе в интернете, при подключении к ним ваш адрес {ip} и данные браузера становятся известны этому сервису, который обрабатывает их по своей политике.',
        { table: {
          head: ['Сервис', 'Зачем', 'Что передаётся'],
          rows: [
            ['{cloudflare}', 'Доставка сайта (CDN) и защита от атак', 'Все запросы к сайту'],
            ['{pushsvc}', 'Доставка пуш-уведомлений на ваше устройство (собственная служба браузера)', 'Если уведомления включены — зашифрованный текст уведомления и адрес для уведомлений'],
            ['{openrouter}, {gemini}', 'Ответы ИИ-помощника и поиск по смыслу в Коране', 'Вопрос и последние сообщения чата или слова поиска (через наш сервер)'],
            ['{resend}', 'Доставка наших писем', 'Ваш адрес почты и текст письма (только если у вас есть аккаунт)'],
            ['{google}', 'Вход через {google}', 'Только если вы им пользуетесь — на страницах входа и регистрации'],
            ['aladhan.com', 'Расчёт времени намаза для мест за пределами Азербайджана', 'Координаты выбранного места, часовой пояс, метод'],
            ['{alquran}, {islamicnetwork}, {qurancom}', 'Текст Корана, переводы, аудио чтения', 'Запросы сур и аятов'],
            ['{quranenc}, {hadeethenc}, {jsdelivr}, {github}', 'Переводы смыслов и тексты хадисов', 'Запросы открываемых вами текстов'],
            ['hisnmuslim.com', 'Аудио дуа', 'Только при нажатии «Слушать»'],
            ['{osm} ({overpass})', 'Поиск ближайших мечетей', 'Координаты области поиска'],
            ['{openmeteo}', 'Поиск городов мира и текущая погода на главной', 'Введённое название города; координаты выбранного места'],
            ['{openfoodfacts}', 'Поиск продукта в проверке на халяльность', 'Только введённый вами штрихкод'],
            ['{exchangerate}', 'Курсы валют в калькуляторе закята', 'Только запрос курса'],
            ['{youtube}', 'Превью и воспроизведение видео (режим повышенной конфиденциальности)', 'Запросы превью при открытии раздела «Видео»; само видео — после нажатия на воспроизведение'],
            ['{telegram}', 'Бот сайта', 'Только если вы пишете боту'],
            ['{gmaps}, Instagram', 'Ссылки на карты и соцсети', 'Только при нажатии на ссылку'],
          ],
        } },
        'Мы не продаём ваши данные и не передаём их для рекламы или составления профилей.',
      ] },
      logs: { h: 'Журналы сервера', body: [
        'Как и любой веб-сервер, наш сервер ({nginx}) ведёт технический журнал входящих запросов: адрес {ip}, время, запрошенный адрес, код ответа и данные браузера. Запросы статических файлов — изображений, шрифтов, скриптов, — маяк статистики, страница «Поделиться», календарные подписки и живые обновления не записываются.',
        'Журналы нужны только для исправления ошибок и защиты сайта от атак. Их объём ограничен (около 3 файлов по 10 МБ): по мере заполнения самые старые записи автоматически перезаписываются. Запросы доходят до сервера через {cloudflare}, который также обрабатывает трафик по своей политике.',
      ] },
      purposes: { h: 'Цели и правовые основания', body: [
        { ul: [
          '**Оказание услуги** — работа сайта, безопасность сайта и вашего аккаунта, исправление ошибок (журналы сервера, ограничения запросов, журнал и уведомления безопасности, отчёты об ошибках, {cloudflare}): наш законный интерес в надёжной и безопасной работе сайта.',
          '**Ваш аккаунт** — его создание и работа, вход и связанные с ним письма (подтверждение, сброс пароля, уведомления о безопасности): необходимо, чтобы предоставить аккаунт, который вы запросили.',
          '**Ваше согласие** — пуш-уведомления, доступ к местоположению и дополнительные функции, хранящие на сервере читаемые данные (напоминания, еженедельный отчёт, семейные функции и функции сообщества, открытый профиль): каждую вы включаете сами и в любой момент можете отозвать согласие, выключив её или удалив данные.',
          '**Ваш запрос** — ИИ-помощник, поиск по смыслу в Коране, поиск городов и мечетей, проверка на халяльность: данные отправляются, только когда вы пользуетесь функцией, и только для получения ответа.',
          '**Анонимная статистика и редкие письма с новостями** — понимать, какие разделы сайта полезны, и сообщать владельцам аккаунтов о сервисе: наш законный интерес; статистика никого не идентифицирует, а от новостей можно отписаться в один клик.',
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
        'Если у вас есть аккаунт, большую часть этого можно сделать самому на странице аккаунта: посмотреть и скачать свои данные («Мои данные»), исправить отображаемое имя и пароль, удалить отдельные записи или весь аккаунт. Без аккаунта мы обычно не можем вас идентифицировать, а большая часть данных и так находится только на вашем устройстве — её можно удалить в браузере самостоятельно. Запись об уведомлениях удаляется сразу кнопкой «Отключить». По остальным вопросам [свяжитесь с нами]({toContact}).',
      ] },
      children: { h: 'Дети', body: [
        'Сайт предназначен для любого возраста, в нём есть раздел для детей: он работает без аккаунта и ничего не отправляет на сервер о ребёнке. Профили и замок детского режима позволяют родителю устроить для ребёнка отдельное пространство внутри своего аккаунта; они остаются на устройстве или в зашифрованной синхронизации. Рекомендуем, чтобы дети пользовались аккаунтами, функциями сообщества, ИИ-помощником и уведомлениями под присмотром родителей.',
      ] },
      security: { h: 'Безопасность', body: [
        'Всё общение с сайтом идёт по зашифрованному соединению HTTPS. Пароли хранятся только в виде односторонних хеш-сумм {scrypt}, ключи сессий и закрытые ссылки — только в виде хешей {sha256}, а секреты двухэтапной проверки зашифрованы; синхронизированные данные и ящик доверия шифруются в браузере до того, как попадут к нам. Доступ к серверу ограничен, секретные ключи не хранятся в коде. Тем не менее ни один способ в интернете не даёт полной гарантии безопасности.',
      ] },
      transfers: { h: 'Передача данных в другие страны', body: [
        'Серверы перечисленных сервисов — в том числе нашего сервиса доставки почты — могут находиться в разных странах (в том числе в США и Европейском союзе). При использовании этих сервисов соответствующие данные могут обрабатываться в этих странах.',
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
          '**الحساب اختياري.** معظم الموقع يعمل بدونه. وإن أنشأت حسابًا حفظنا بريدك الإلكتروني واسمًا ظاهرًا اختياريًا وطريقة دخولك (التفاصيل أدناه).',
          '**لا إعلانات ولا تتبّع.** لا ملفات تعريف ارتباط للإعلان أو التتبّع ولا شبكات إعلانية. ويستخدم تسجيل الدخول ملفَّي تعريف ارتباط ضروريين فقط، أما إحصائيات الزيارات فمجهولة الهوية وبلا ملفات تعريف ارتباط وتُحفظ على خادمنا الخاص.',
          '**بياناتك تبقى على جهازك.** التفضيلات والمفضّلة والأذكار والحفظ ومفكّرة الدعاء وغيرها تُحفظ في متصفحك. وإن فعّلت المزامنة تُشفَّر أولًا في متصفحك، فلا يبقى على خادمنا إلا نسخة لا نستطيع قراءتها.',
          '**لا يصل إلى خادمنا إلا الضروري:** مثل عنوان الإشعارات والمدينة إن فعّلت الإشعارات، ونص سؤالك إن سألت المساعد الذكي، وفي أقسام المجتمع والأسرة ما تختار مشاركته فقط. ويبيّن كل قسم أدناه ما يُحفظ ومن يراه وإلى متى.',
          '**لا نبيع بياناتك أبدًا** ولا ننقلها لأغراض الإعلان أو بناء الملفات الشخصية.',
        ] },
      ] },
      controller: { h: 'نطاق هذه السياسة', body: [
        'تشمل هذه السياسة موقع {brand} ({domain}) وتطبيقه للهاتف وأدوات مواقيت الصلاة وإضافة {wordpress} التي تعرض محتوى الموقع في مواقع أخرى، وبوت الموقع على تيليجرام. الخدمة مجانية وبلا إعلانات.',
        { when: IF_OPERATOR, p: 'يتولّى تشغيل الخدمة **{operator}**، وهو المسؤول عن معالجة البيانات الموصوفة في هذه السياسة.' },
        'للأسئلة والطلبات راجع قسم [التواصل]({toContact}).',
      ] },
      local: { h: 'البيانات المحفوظة في متصفحك', body: [
        'تُحفظ التفضيلات اللازمة لعمل الموقع في التخزين المحلي للمتصفح ({localstorage}) وفي تخزين الجلسة ({sessionstorage}). هذه البيانات **لا تُرسَل إلى خادمنا** (والاستثناءات مبيّنة في الأقسام التالية) ولا يمكن الوصول إليها إلا من هذا المتصفح.',
        { table: {
          head: ['ماذا', 'أين', 'إلى متى'],
          rows: [
            ['اللغة، المظهر (فاتح/داكن)، إعدادات سهولة الوصول، حالة القائمة، ترتيب الصفحة الرئيسية', 'التخزين المحلي', 'حتى تحذفها'],
            ['المدينة المختارة أو موقع مخصّص، المدن المختارة مؤخراً', 'التخزين المحلي', 'حتى تحذفها'],
            ['الأحاديث والأدعية المفضّلة، موضع القراءة في القرآن، ملاحظات القرآن وتظليله، مكتبتك، عمليات البحث الأخيرة', 'التخزين المحلي', 'حتى تحذفها'],
            ['عدّاد الأذكار، الحفظ، الورد، إحصاءات العبادات اليومية والصلاة، تقدّم التعلّم والأوسمة، نتائج المسابقات والألعاب، تذكيرات التقويم', 'التخزين المحلي', 'حتى تحذفها'],
            ['مفكّرة الدعاء وسجلّ الصدقات وسجلّ قضاء الصلوات', 'التخزين المحلي', 'حتى تحذفها'],
            ['الملفات الشخصية (حتى 6) وقفل وضع الأطفال', 'التخزين المحلي', 'حتى تحذفها'],
            ['سجلّ المحادثة مع المساعد الذكي', 'التخزين المحلي', 'حتى تضغط «مسح المحادثة» أو تحذفه'],
            ['إعدادات الإشعارات، نسخة من عنوان الإشعارات، الإعلانات المقروءة، التذكيرات المخفيّة', 'التخزين المحلي', 'حتى تحذفها'],
            ['علامة على أنك مسجّل الدخول (لا كلمة المرور ولا مفتاح الجلسة)، وإعدادات المزامنة لهذا الجهاز، ومفاتيح الغرف والروابط التي أنشأتها أو انضممت إليها', 'التخزين المحلي', 'حتى تسجّل الخروج أو تغادر أو تحذفها'],
            ['نسخ مؤقتة: مواقيت الصلاة، الآيات، الطقس الحالي، موضعك في القائمة', 'تخزين الجلسة', 'حتى إغلاق علامة التبويب'],
            ['نسخ من الصفحات والردود وتلاوات القرآن المنزّلة للعمل دون اتصال', 'ذاكرة المتصفح المؤقتة (عامل الخدمة)', 'حتى يمسحها المتصفح أو يصدر إصدار جديد من الموقع'],
          ],
        } },
        '**طريقة الحذف:** امسح «بيانات الموقع» (أو «ملفات تعريف الارتباط وبيانات المواقع») الخاصة بـ {domain} من إعدادات متصفحك. سيؤدي ذلك إلى حذف كل ما سبق نهائياً، بما فيه مفكّرة الدعاء والإحصاءات. وفي وضع التصفح الخاص تُحذف البيانات تلقائياً عند إغلاق النافذة.',
        { note: 'لا ننشئ نسخة احتياطية من هذه البيانات تلقائيًا. ويمكنك من قسم «بياناتي» أسفل الصفحة تنزيلها في ملف أو تشغيل المزامنة المشفّرة من طرف إلى طرف — انظر [المزامنة والنسخ الاحتياطية]({toSync}).' },
      ] },
      sync: { h: 'المزامنة والنسخ الاحتياطية', body: [
        'المزامنة بين الأجهزة معطّلة حتى تفعّلها. وعند تفعيلها تُشفَّر بياناتك **في متصفحك** ({aesgcm}) بمفتاح مشتق من رمز الاستعادة. ولا يحفظ خادمنا إلا النسخة المشفّرة ولا يستطيع قراءتها؛ ولا يصل إلينا الرمز ولا المفتاح أبدًا.',
        { ul: [
          '**دون حساب:** تُحفظ النسخة تحت معرّف مشتق هو أيضًا من رمز الاستعادة، ولا يُربط بها حساب ولا ملف تعريف ارتباط ولا عنوان {ip}. ومن يملك رمز الاستعادة يستطيع فتح النسخة، فاحفظه في مكان آمن.',
          '**مع حساب:** يمكن ربط النسخة المشفّرة نفسها بحسابك لتُفتح على جهاز جديد بعد تسجيل الدخول. ولذلك يحفظ خادمنا أيضًا رمز الاستعادة مقفلًا في متصفحك بمفتاح مأخوذ من كلمة المرور ({pbkdf2}، 600 000 دورة) أو من مفتاح المرور، ولا يصل إلينا ذلك المفتاح أبدًا.',
          '**المدة:** حتى تضغط «حذف من الخادم» أو تحذف حسابك. وتُحذف تلقائيًا النسخة التي لم يستخدمها أحد 400 يوم، والنسخة التي حُفظت مرة واحدة ولم تُفتح بعدها أبدًا بعد 30 يومًا.',
        ] },
        { note: 'كما في أي دخول بكلمة مرور، تمرّ كلمة المرور عبر خادمنا عند تسجيل الدخول (ولا نحفظ منها إلا بصمة {scrypt} أحادية الاتجاه). ولذلك تكون حماية البيانات المتزامنة أقوى ما تكون عند الدخول بمفتاح مرور أو فتح المزامنة برمز الاستعادة.' },
        'ملف النسخة الاحتياطية الذي تنزّله من «بياناتي» يُنشأ في متصفحك ويُحفظ على جهازك فقط.',
      ] },
      cookies: { h: 'ملفات تعريف الارتباط', body: [
        '**لا يستخدم {brand} ملفات تعريف الارتباط للتتبّع أو الإعلان**، ولا يتلقى الزائر الذي لا يسجّل الدخول أي ملف منّا أصلًا. والتخزين المحلي الموصوف أعلاه يخدم فقط الميزات التي تختار استخدامها، ولهذا لا نعرض نافذة منفصلة لـ«الموافقة على ملفات تعريف الارتباط».',
        'عند تسجيل الدخول نضع ملفَّي تعريف ارتباط ضروريين. كلاهما من نوع {httponly} (لا تستطيع البرامج النصية في الصفحة قراءتهما) ولا يُرسلان إلا إلى {domain}:',
        { table: {
          head: ['الملف', 'لماذا', 'المدة'],
          rows: [
            ['{cookieuser}', 'يُبقيك مسجّل الدخول (مفتاح جلسة عشوائي، ولا يُحفظ على الخادم إلا بصمته)', '30 يومًا، تُمدَّد ما دمت تستخدم الموقع، ويُحذف عند تسجيل الخروج'],
            ['{cookiedev}', 'يتعرّف على جهاز سجّلت منه الدخول من قبل، لنراسلك عند الدخول من أجهزة جديدة', 'سنتان'],
          ],
        } },
        'قد تضع جهات خارجية ملفاتها الخاصة: فقد يكتب {cloudflare} ملفاً تقنياً ضرورياً لحماية الموقع من الهجمات، وقد يستخدم {youtube} ملفات تعريف الارتباط وفق قواعده عند بدء تشغيل مقطع فيديو، وإن سجّلت الدخول عبر {google} فإن نافذة الدخول تعمل وفق قواعد {google}.',
      ] },
      analytics: { h: 'إحصائيات الزيارات', body: [
        // lang-ok[Do,Not,Track,Global,Privacy,Control]: أسماء قياسية
        'لمعرفة أقسام الموقع المفيدة نحتفظ بإحصائيات زيارات بسيطة **بلا ملفات تعريف ارتباط** على خادمنا الخاص، ولا نستخدم أي خدمة تحليلات خارجية. عند فتح صفحة يصل إلى الخادم عنوان الصفحة فقط (دون سلسلة الاستعلام) ولغة الواجهة واسم نطاق الموقع المُحيل وحده؛ ومن وصف المتصفح نستخرج نوع الجهاز وعائلة المتصفح فقط، ولا نحدد بلدك أو موقعك. ولعدّ الزوار الفريدين يوميًا تُحسب تجزئة أحادية الاتجاه من عنوان {ip} ووصف المتصفح والتاريخ بمفتاح سري يتجدد كل يوم، وتبقى في ذاكرة الخادم فقط مدة أقصاها يوم واحد ولا تُكتب على القرص. لا تُحفظ في قاعدة البيانات إلا المجاميع، وتُحذف بعد 400 يوم. لا ملفات تعريف ارتباط ولا معرّفات ولا بصمة للجهاز؛ وإن كان متصفحك يرسل «Do Not Track» أو Global Privacy Control فلا تُحتسب زيارتك أصلًا.',
        'إن جئت من مساعد ذكاء اصطناعي (مثل {chatgpt} أو {perplexity}) فلا نرى في الإحصائيات إلا اسم نطاق ذلك الموقع، ولا شيء عن محادثتك. ولا تُحتسب الصفحات المفتوحة داخل موقع آخر (أدواتنا وإضافة {wordpress}) ولا لوحة الإدارة ولا المتصفحات الآلية. ولمنع إساءة الاستخدام يبقى عنوان {ip} في ذاكرة الخادم دقيقة واحدة على الأكثر.',
      ] },
      account: { h: 'حسابك', body: [
        'الحساب اختياري. يمكنك إنشاؤه ببريد إلكتروني وكلمة مرور، أو بمفتاح مرور، أو عبر {google}. وعندئذ نحفظ:',
        { ul: [
          'بريدك الإلكتروني وهل هو مؤكَّد، واسمًا ظاهرًا اختياريًا، ودورك (مثل ممثل مسجد)، وتاريخ إنشاء الحساب وآخر دخول، ولغة الموقع التي تستخدمها (لتصلك رسائلنا بلغتك)؛',
          'طريقة دخولك: بصمة {scrypt} أحادية الاتجاه لكلمة المرور (لا كلمة المرور نفسها أبدًا)، والمفاتيح العامة لمفاتيح المرور (المفتاح السري لا يغادر جهازك)، وإن استخدمت {google} فمعرّف حسابك لدى {google}؛',
          'التحقق بخطوتين إن فعّلته: سرّ تطبيق المصادقة (مشفّرًا) وبصمات رموز الاحتياط ذات الاستخدام الواحد؛',
          'جلساتك: لكل جلسة مفتاح عشوائي (لا تُحفظ إلا بصمته)، ووصف قصير للجهاز مثل «{devlabel}»، والتواريخ — دون عنوان {ip}؛',
          'سجلّ عمليات الدخول وتغييرات الأمان (كلمة المرور، التحقق بخطوتين، مفاتيح المرور) مع طريقة الدخول ووصف الجهاز والبلد التقريبي الذي يبلّغ عنه {cloudflare}، ويُحفظ 90 يومًا.',
        ] },
        '**الدخول عبر {google}:** لا يُحمَّل سكربت {google} إلا في صفحتَي الدخول وإنشاء الحساب. وعند استخدامه يعطينا {google} بريدك الإلكتروني واسمك ومعرّف الحساب؛ فنحفظ المعرّف والبريد، ونستخدم الاسم اسمًا ظاهرًا للحساب الجديد. ولا نرى كلمة مرور {google} أبدًا.',
        '**رسائل الأمان:** نراسلك عندما يسجّل أحد الدخول من جهاز جديد وعندما تتغيّر كلمة المرور أو التحقق بخطوتين أو مفاتيح المرور. ورابط «لم أكن أنا» في هذه الرسالة يُنهي الجلسات على كل الأجهزة ويوقف الدخول بكلمة المرور وعبر {google} حتى تعيّن كلمة مرور جديدة (وتبقى مفاتيح المرور عاملة).',
        '**الحماية من التخمين:** للحدّ من محاولات الدخول المتكررة لا يُستخدم عنوان {ip} إلا في ذاكرة الخادم ولمدة قصيرة، ولا يُكتب على القرص.',
        '**الاطلاع والتنزيل والحذف:** تعرض صفحة حسابك ما نحفظه، ويتيح «بياناتي» تنزيله كله في ملف. ويحذف «حذف الحساب» الحساب وكل ما يرتبط به من قاعدة بياناتنا، بما في ذلك نسخة المزامنة المشفّرة المرتبطة به. ولا يبقى إلا الصفحات التي أتممتها في ختمة الأمة الحيّة، بلا اسمك، ضمن العدد المجهول لتلك الدورة.',
        'يمنح مسؤولو الموقع أدوارًا مثل ممثل المسجد أو المحرّر. ويُسجَّل كل تغيير للدور في سجلّ تدقيق (رقم الحساب والأدوار فقط، ويبقى هذا السجل حتى بعد حذف الحساب)، ويُسجَّل فتحك للوحة الإدارة في سجلّ الأمان الخاص بك.',
      ] },
      email: { h: 'الرسائل البريدية', body: [
        'لا نرسل الرسائل إلا إلى عنوان حسابك، عبر خدمة إرسال البريد {resend} التي تتلقى عنوان المستلم ومحتوى كل رسالة. ولا تحتوي سجلاتنا على عناوين البريد.',
        { ul: [
          '**رسائل الخدمة** (دائمًا): تأكيد العنوان، وإعادة تعيين كلمة المرور، وتنبيه إن حاول أحد التسجيل بعنوانك، ورسائل الأمان الموصوفة أعلاه.',
          '**رسالة ترحيب** (مرة واحدة): بعد تأكيد عنوانك — بلغة الموقع التي تستخدمها، أو بالإنجليزية والعربية إن لم نعرفها.',
          '**رسائل تفعّلها بنفسك:** التقرير الأسبوعي والتذكيرات التي تُعدّها (انظر القسم التالي). ولا تُرسل إلا إلى عنوان مؤكَّد، وفي كل منها رابط لإلغاء الاشتراك.',
          '**أخبار من فريق الموقع أحيانًا:** إلى الحسابات المؤكَّدة فقط، ولا تُرسل أبدًا إلى عنوان ألغى الاشتراك. وفي كل رسالة منها رابط لإلغاء الاشتراك بنقرة واحدة؛ والإلغاء يوقف هذه الرسائل وحدها لا رسائل الخدمة والأمان. ونحتفظ بسجلّ أيّ هذه الرسائل أُرسل إلى أيّ حساب مدة 180 يومًا بعد انتهاء الإرسال.',
        ] },
      ] },
      accountdata: { h: 'ميزات الحساب التي يقرأ الخادم بياناتها', body: [
        'معظم ما تفعله في حسابك مشفّر من طرف إلى طرف. أما الميزات أدناه فمختلفة: فلكي يرسل الخادم تذكيرًا في وقته أو يعرض شيئًا لأسرتك يجب أن يقرأ البيانات، ولذلك تُحفظ **دون تشفير**. وكلها معطّلة حتى تفعّلها، ومعظمها يطلب موافقتك الصريحة أولًا، ويمكنك حذف البيانات في أي وقت. وكلها تُحذف مع حسابك وتدخل في تصدير بيانات الحساب.',
        { table: {
          head: ['الميزة', 'ما يُحفظ', 'من يراه وإلى متى'],
          rows: [
            ['التذكيرات: رسالة إلى نفسك في المستقبل، والدعاء للأحبة المتوفَّين، وموعد زكاتك', 'الرسالة وتاريخ تسليمها؛ أسماء أحبتك (مع صلة القرابة وملاحظة اختياريتين)؛ بداية حولك في الزكاة (والمبلغ فقط إن أضفته)؛ منطقتك الزمنية ولغتك', 'أنت وحدك؛ ومن تدعوهم لمتابعة قائمتك يرون الأسماء دون ملاحظاتك. حتى تحذفها'],
            ['التقرير الأسبوعي بالبريد', 'اليوم الذي اخترته ومنطقتك الزمنية ولغتك، وخمسة أرقام أسبوعية يحسبها متصفحك (الصلوات، صفحات القرآن، الأذكار، أيام الصيام، الورد)', 'أنت وحدك. وتُحذف الأرقام بعد 120 يومًا'],
            ['دائرة العائلة (حتى 8 حسابات) وأدعية العائلة ولوحة رمضان العائلية', 'العضوية؛ والأرقام الموجزة التي تختار مشاركتها فقط؛ والبطاقات (قالب ورقم، بلا نص حر)؛ وطلبات الدعاء التي تكتبها؛ وأعداد رمضان والأسماء في قوائم الأجزاء والإفطار', 'أعضاء دائرتك. وتُحذف البطاقات بعد 60 يومًا، وطلبات الدعاء بعد 30–90 يومًا'],
            ['التحديات الجماعية وفصول المعلّمين', 'العضوية وعلاماتك اليومية؛ وفي الفصل: الواجبات، وأرقام تقدّمك بموافقتك فقط', 'يرى الآخرون المجاميع اليومية فقط، بلا أسماء ولا ترتيب؛ ولا يرى المعلّم تقدّم طالب بعينه إلا بموافقته. ويُحذف التحدي بعد 30 يومًا من انتهائه'],
            ['الملف العام (معطّل افتراضيًا)', 'اسم مستخدم واسم ظاهر وكنية ونبذة قصيرة والسورة المفضّلة وأوسمة التعلّم', 'الجميع، على العنوان {profilepath}، ما دام مفعّلًا. وتُحفظ البلاغات عن الملف 180 يومًا'],
            ['جدار الدعاء', 'طلبك (حتى 300 حرف) واسم اختياري («مجهول» افتراضيًا) ولغته', 'الجميع، مدة 30 يومًا بعد موافقة المشرف. ولا يرى المشرفون بريدك الإلكتروني أبدًا'],
            ['ختمة الأمة الحيّة', 'الصفحة التي تأخذها، والدورات التي شاركت فيها، واسم إهداء اختياري، وموقعك مقرّبًا إلى نحو 110 كم بموافقتك فقط', 'الإهداء لا يُنشر أبدًا (يُعرض عدد الإهداءات فقط) ويُحذف بعد 30 يومًا من انتهاء الدورة. ويظهر الموقع مرة واحدة على الخريطة الحية ثم يُحذف؛ أما البلد (من {cloudflare}) فيُحتسب في قائمة بلدان الدورة فقط لا لكل شخص'],
            ['صديق الدعاء السري', 'انضمامك ولغتك ومنطقتك الزمنية والاقتران والأيام التي علّمتها', 'لا يعرف صديقك من أنت أبدًا. ويُحذف الاقتران والعلامات بانتهاء الدورة ذات الثلاثين يومًا، والعضوية عند خروجك'],
            ['رحلة الحج', 'نوع الرحلة والمراحل التي تعلّمها واسم قصير اختياري — ولا موقعك أبدًا', 'دائرة عائلتك ومن يملك رابطك الخاص. وتُحذف بعد 30 يومًا من بدايتها'],
            ['اشتراك التقويم', 'رابط سري (تُحفظ بصمته فقط) والأقسام التي تختارها ولغتك', 'تطبيق التقويم أو خدمته التي تجلب الاشتراك بالرابط. حتى توقفه أو تنشئ رابطًا جديدًا'],
            ['رابط «اختبرني» للحفظ', 'السورة ونطاق الآيات والاسم المعروض وعلامات المستمع (بلا نص حر)', 'أنت ومن لديه الرابط. وتُحذف النتائج بعد 7 أيام من فتحك لها'],
            ['«لنقرأ معًا»', 'الغرفة وألقاب من فيها — في ذاكرة الخادم فقط ولا تُكتب على القرص أبدًا', 'من في الغرفة. وتُغلق بعد 24 ساعة دون نشاط'],
            ['ممثل المسجد', 'أوقات الإقامة وموضوع خطبة الجمعة وإعلانات مسجدك', 'الجميع، على شاشة المسجد وفي البحث عن المساجد. وتُحذف الإعلانات بعد 30 يومًا من انتهائها'],
          ],
        } },
        'إن اخترت «أرسل الإشعارات إلى هذا الجهاز أيضًا» ربطنا عنوان إشعارات ذلك الجهاز بحسابك أيضًا لتصلك التذكيرات عليه.',
      ] },
      community: { h: 'لوحات المجتمع: المصليات وإعلانات الجنازة والتطوع', body: [
        'إن استخدمت هذه الأقسام بحساب، فإن ما يلي يُحفظ على خادمنا **دون تشفير** ويُربط بحسابك. ويحتاج النشر والتسجيل والإبلاغ إلى بريد إلكتروني مؤكَّد.',
        { ul: [
          '**اقتراح مصلى:** اسم المكان ونوعه ومدينته وعنوانه وإحداثياته والطابق والملاحظة. يظهر للجميع بعد القبول، ولا يظهر اسمك ولا بريدك أبدًا. ويُحذف الاقتراح المرفوض بعد 30 يومًا، والمنتظر بعد 90 يومًا. ولا يرى البلاغ عن مكان (السبب وملاحظة قصيرة) إلا المشرفون. ولخيار «بالقرب مني» يُستخدم موقعك في متصفحك فقط ولا يُرسل إلى الخادم.',
          '**إعلان جنازة** (بموافقتك الصريحة فقط): اسم المتوفى وتاريخ الصلاة ووقتها والمكان، واختياريًا مكان الدفن ووسيلة التواصل مع الأسرة. يراه كل من لديه الرابط الخاص (ويُحفظ الرابط نفسه بصيغة مُجزّأة فقط)، ولا يظهر في القائمة العامة إلا إن طلبت ذلك وبعد مراجعة المشرف، ولا تظهر وسيلة التواصل هناك. ويُحذف الإعلان تلقائيًا بعد 30 يومًا من تاريخ الصلاة. ولا ترى الأسرة من «دعوتُ للميت» إلا عددًا: فللزوار المسجّلين نحفظ سجلًا واحدًا لكل حساب ليُحتسب مرة واحدة، ولغيرهم لا يُكتب شيء في قاعدة البيانات.',
          '**التسجيل للتطوع:** الاسم الذي تكتبه وبريدك (بموافقتك فقط) لا يراهما إلا ممثل ذلك المسجد، وتعرض القائمة العامة عدد الأماكن المشغولة فقط. وتُحذف الأعمال المنتهية مع تسجيلاتها بعد 30 يومًا.',
        ] },
        'يمكنك حذف هذه السجلات بنفسك في أي وقت، وحذف الحساب يحذفها كلها. وهي مشمولة في تصدير بيانات الحساب.',
      ] },
      groups: { h: 'الختمة الجماعية والأهداف المشتركة', body: [
        'عند إنشاء غرفة أو الانضمام إليها لا يُحفظ على الخادم إلا الاسم الظاهر الذي تكتبه (مثل «علي») وعلاماتك (الجزء الذي أخذته والأيام التي علّمتها)، وفي غرفة الدعاء الطلبات التي تكتبها. لا يُنشأ حساب، ولا يُسجَّل عنوان {ip} ولا أي بيانات شخصية أخرى. تبقى مفاتيح الإدارة والمشاركة في التخزين المحلي لمتصفحك فقط. تُحذف الغرفة تلقائيًا بعد 180 يومًا من آخر نشاط، ويستطيع منشئها حذفها في أي وقت.',
      ] },
      trustbox: { h: 'صندوق الأمانة', body: [
        // lang-ok[PBKDF,SHA,AES-]: alqoritmlərin adları tərcümə olunmur
        'إذا أنشأت صندوق أمانة في حسابك فإن ملاحظاتك (ما توصي به، والديون، وأماكن الوثائق، وكلماتك لأهلك) تُشفَّر **في متصفحك** بعبارة مرور أمانة لا يعرفها سواك (PBKDF2-SHA256 بـ 600 000 دورة؛ AES-256-GCM). لا يحفظ خادمنا إلا النص المشفَّر، وملحًا عشوائيًا، وبصمة SHA-256 للرابط الخاص، ووقتَي الإنشاء والتعديل، ويومَ آخر فتح بالرابط — ولا يحفظ أبدًا العبارة ولا النص المقروء ولا عنوان {ip}.',
        '**المدة:** حتى تحذف الصندوق، ويُحذف كذلك مع حسابك. ويُضمَّن مشفَّرًا في تصدير بيانات حسابك. إن ضاعت العبارة فلا أحد — ولا نحن — يستطيع استعادة المحتوى.',
      ] },
      push: { h: 'الإشعارات الفورية', body: [
        'لا تُفعَّل الإشعارات إلا بإذنك. عند منح الإذن تعطي خدمة الإشعارات الخاصة بمتصفحك ({pushsvc}) متصفحك عنواناً للإشعارات (مفتاحاً عشوائياً لإيصال الإشعارات إلى جهازك)، ونحفظ في قاعدة بيانات خادمنا سجلاً يتضمّن:',
        { ul: [
          'عنوان الإشعارات؛',
          'وصفاً تقنياً لمتصفحك (اسم المتصفح ونظام التشغيل وإصدارهما)؛',
          'لغة الواجهة؛',
          'موقع الصلاة الذي اخترته: الإحداثيات والمنطقة الزمنية واسم المدينة وطريقة حساب المواقيت (مركز المدينة إذا اخترتها من القائمة؛ والإحداثيات التقريبية إذا حدّدت موقعاً مخصّصاً بزر «حدّد موقعي»)؛',
          'اختياراتك للإشعارات ووقت إنشاء السجل وتحديثه.',
        ] },
        '**الغرض:** يرسل خادمنا إلى كل مشترك إشعارًا عند وقت الأذان في مدينته، ولا يرسل من التذكيرات الإضافية إلا ما فعّلته (مثل «هل صلّيت؟» وأذكار الصباح والمساء والجمعة وصيام السنة والكسوف وآية اليوم أو حديثه)؛ وقد تُرسَل أيضًا إعلانات عامة إلى جميع المشتركين. وجوابك عن «هل صلّيت؟» يبقى على جهازك ولا يُرسل إلينا أبدًا.',
        '**المدة:** حتى توقف الإشعارات. الضغط على زر **«إيقاف»** في لوحة «الإشعارات» في الموقع يحذف السجل من قاعدة البيانات فوراً. وإذا حظرت الإشعارات من إعدادات المتصفح أو الهاتف فقط، يصبح العنوان غير صالح ويحذف الخادم السجل عند أول محاولة إرسال فاشلة.',
        'إن كنت مسجّل الدخول واخترت «أرسل الإشعارات إلى هذا الجهاز أيضًا» لتذكيراتك الشخصية، يُربط عنوان الإشعارات بحسابك كذلك.',
        { note: 'في تطبيق الهاتف تُجدوَل تذكيرات الصلاة على الجهاز نفسه، ولا يُرسَل لأجلها أي عنوان إلى خادمنا.' },
      ] },
      telegram: { h: 'بوت تيليجرام', body: [
        'البوت معطّل إلى أن نربطه بتيليجرام، وما دام معطّلًا لا يحدث شيء مما يلي.',
        'عند استخدامك بوت تيليجرام الخاص بالموقع تصل أوامرك إلى خادمنا عبر خوادم تيليجرام، وتنطبق في هذا المسار سياسة الخصوصية الخاصة بتيليجرام. بعد اختيارك مدينةً يحتفظ البوت في قاعدة بيانات خادمنا بهذا السجل فقط (دون تشفير — وباختيار المدينة توافق على ذلك):',
        { ul: [
          'رقم المحادثة (معرّف المحادثة في تيليجرام — لإرسال الردود إليك)؛',
          'لغة الواجهة (من رمز اللغة الذي يرسله تيليجرام)؛',
          'المدينة التي اخترتها (من قائمة مدن الموقع)؛',
          'هل تذكير الأذان مفعّل أم لا، ووقت إنشاء السجل.',
        ] },
        'لا يُحفظ اسمك ولا اسم المستخدم ولا رقم هاتفك ولا نص رسائلك ولا يُسجَّل، ولا يُسجَّل عنوان {ip}.',
        // lang-ok[stop]: botun əmr adı (/stop)
        '**إلى متى:** حتى ترسل الأمر /stop إلى البوت أو تحظره — وفي الحالتين يُحذف السجل فورًا.',
      ] },
      ai: { h: 'المساعد الذكي', body: [
        'عندما تطرح سؤالاً على المساعد الذكي يُرسَل نص سؤالك وآخر بضع رسائل من المحادثة الحالية ولغة الواجهة إلى خادمنا، ومنه عبر خدمة {openrouter} إلى نموذج ذكاء اصطناعي (حالياً {gemini}). ويعود الجواب بالطريق نفسه.',
        { ul: [
          'خادمنا **لا يحفظ نص المحادثة ولا يسجّله** — تُسجَّل فقط مؤشرات تقنية (مدة الجواب وطوله).',
          'يُحفظ سجلّ المحادثة في متصفحك فقط، ويمكنك حذفه بزر «مسح المحادثة».',
          'لمنع إساءة الاستخدام يُحتفَظ بعنوان {ip} الخاص بك لفترة قصيرة في ذاكرة الخادم لتطبيق حدّ الطلبات في الدقيقة.',
          'تعالج {openrouter} والجهة المزوّدة للنموذج الطلب وفق سياسات الخصوصية الخاصة بهما.',
        ] },
        '**البحث في القرآن بالمعنى** يعمل بطريقة مشابهة: تمرّ الكلمات التي تكتبها ولغة الواجهة عبر خادمنا و{openrouter} إلى النموذج، فيختار أرقام الآيات فقط — ونص الآيات الذي تراه من بيانات القرآن في الموقع نفسه. لا يُحفظ شيء ولا يُسجَّل نص البحث؛ وتبقى عمليات البحث المتطابقة في ذاكرة الخادم مدة قصيرة.',
        '**تقييم الإجابة:** إن وسمت إجابة بأنها غير مفيدة، يُحفظ السؤال والإجابة والسبب الذي تختاره وتعليقك الاختياري على خادمنا للمراجعة — انظر [تقارير الأخطاء والملاحظات]({toFeedback}).',
        { note: 'لا تكتب للمساعد الذكي معلومات شخصية مثل اسمك أو عنوانك أو حالتك الصحية أو العائلية.' },
      ] },
      location: { h: 'بيانات الموقع الجغرافي', body: [
        'لا نطلب موقع جهازك إلا عندما تضغط زرًا ويمنح المتصفح الإذن. وإليك أين تذهب بيانات الموقع:',
        { ul: [
          '**تحديد المدينة:** تُحسب أقرب مدينة على جهازك.',
          '**اتجاه القبلة:** يُحسب بالكامل على جهازك ولا يُرسَل إلى أي جهة.',
          '**البحث عن المساجد:** تُرسَل إحداثياتك إلى خدمة بيانات {osm} ({overpass}) للعثور على المساجد القريبة.',
          '**مواقيت الصلاة:** تُحسب مواقيت مدن أذربيجان على جهازك؛ أما الأماكن الأخرى فتُرسَل إحداثيات الموقع المختار ومنطقته الزمنية إلى aladhan.com.',
          '**البحث عن مدينة:** يُرسَل اسم المدينة الذي تكتبه إلى {openmeteo}.',
          '**الطقس في الصفحة الرئيسية:** تُرسَل إحداثيات المدينة أو الموقع المختار إلى {openmeteo} لعرض الطقس الحالي.',
          '**خريطة رصد الهلال:** لا يُحفظ من بلاغك إلا منطقة تقارب 110 كم، والمساء والساعة، وهل رأيت الهلال وكيف رصدته — بلا حساب ولا اسم ولا عنوان {ip}.',
          '**خريطة «الذاكرون الآن»:** عندما تعدّ الأذكار أو الصلاة على النبي وقد اخترت مدينتك لمواقيت الصلاة، يبقى موضع تلك المدينة مقرّبًا إلى نحو 200 كم في ذاكرة الخادم 10 دقائق ولا يُحفظ أبدًا. ولا تحتوي المجاميع اليومية لعدّاد الأمة على أي بيانات شخصية.',
          '**الفتح في الخريطة / الاتجاهات:** تفتح هذه الروابط {gmaps} في علامة تبويب جديدة مع الإحداثيات.',
        ] },
      ] },
      feedback: { h: 'تقارير الأخطاء والملاحظات', body: [
        '**«الإبلاغ عن خطأ»:** تُحفظ على خادمنا الصفحة ونوع الخطأ ونصك ووسيلة للتواصل معك إن كتبتها فقط. ولا يقرؤها إلا مسؤولو الموقع، وهم من يحذفونها من لوحة الإدارة؛ ولا يُحفظ معها عنوان {ip} ولا ملفات تعريف الارتباط ولا بيانات المتصفح.',
        '**تقييم إجابة المساعد الذكي:** إن وسمت إجابة بأنها غير مفيدة، يُحفظ السؤال والإجابة والسبب الذي تختاره وتعليقك الاختياري بالطريقة نفسها.',
        '**تقارير الأخطاء التلقائية:** إن وقع خطأ برمجي في صفحة، يرسل متصفحك إلينا رسالة الخطأ وملف السكربت والسطر ومسار الصفحة (دون سلسلة الاستعلام)، مع إخفاء عناوين البريد والأرقام الطويلة في الرسالة. وتبقى هذه التقارير في ذاكرة الخادم فقط وتُمحى عند إعادة تشغيله، ولا يُحفظ عنوان {ip} ولا ملفات تعريف الارتباط ولا وصف المتصفح. وتُعالَج بالطريقة نفسها تقارير المتصفحات عن مخالفات سياسة الأمان ({csp}).',
      ] },
      embeds: { h: 'الأدوات والمشاركة وإنستغرام', body: [
        { ul: [
          '**في المواقع الأخرى:** عند عرض أداة مواقيت الصلاة أو شاشة المسجد أو إضافة {wordpress} في موقع آخر، لا ترسل إحصائيات زيارات ولا تضع ملفات تعريف ارتباط، وقد تحفظ إعدادات العرض في متصفحك منفصلةً لكل موقع. وتُبلغ شاشة المسجد المختصرة الصفحةَ المحيطة بها بارتفاع محتواها فقط (رقم واحد) ليتلاءم الإطار معه. وتعمل تقارير الأخطاء التلقائية كما سبق. ولأماكن خارج أذربيجان يطلب متصفحك المواقيت من aladhan.com.',
          '**المشاركة إلى {brand}:** إن شاركت نصًا إلى {brand} من تطبيق آخر («مشاركة» في أندرويد)، يبقى النص في متصفحك — فلا يُحفظ على خادمنا، ولا يُكتب في سجلات الخادم، ولا يدخل ذاكرة العمل دون اتصال. ولا يُستخدم إلا للإجراء الذي تختاره: فالبحث في القرآن مثلًا يرسل النص العربي إلى {alquran}، والإضافة إلى مفكّرة الدعاء تحفظه على جهازك.',
          '**حسابنا على إنستغرام:** تُنشر المنشورات تلقائيًا ولا تحتوي إلا على محتوى الموقع العام (آية أو حديث أو دعاء أو اسم من أسماء الله) — ولا تُستخدم أي بيانات للزوار أو الحسابات. وعند فتح إنستغرام تسري سياسة الخصوصية الخاصة به.',
        ] },
      ] },
      thirdparty: { h: 'خدمات الجهات الخارجية', body: [
        'يستخدم الموقع الخدمات التالية. وكما في أي طلب عبر الإنترنت، عند اتصال متصفحك بها يصبح عنوان {ip} وبيانات المتصفح معروفة لتلك الخدمة، فتعالجها وفق سياستها.',
        { table: {
          head: ['الخدمة', 'الغرض', 'ما يُرسَل'],
          rows: [
            ['{cloudflare}', 'إيصال الموقع (شبكة توزيع المحتوى) وحمايته من الهجمات', 'جميع الطلبات إلى الموقع'],
            ['{pushsvc}', 'إيصال الإشعارات الفورية إلى جهازك (خدمة متصفحك نفسه)', 'إذا كانت الإشعارات مفعّلة — نص الإشعار مشفّراً وعنوان الإشعارات'],
            ['{openrouter}، {gemini}', 'إجابات المساعد الذكي والبحث في القرآن بالمعنى', 'السؤال وآخر رسائل المحادثة أو كلمات البحث (عبر خادمنا)'],
            ['{resend}', 'إيصال رسائلنا البريدية', 'بريدك الإلكتروني ومحتوى الرسالة (إن كان لديك حساب فقط)'],
            ['{google}', 'الدخول عبر {google}', 'إن استخدمته فقط، في صفحتَي الدخول وإنشاء الحساب'],
            ['aladhan.com', 'حساب مواقيت الصلاة للأماكن خارج أذربيجان', 'إحداثيات الموقع المختار، المنطقة الزمنية، طريقة الحساب'],
            ['{alquran}، {islamicnetwork}، {qurancom}', 'نص القرآن والترجمات وتسجيلات التلاوة', 'طلبات السور والآيات'],
            ['{quranenc}، {hadeethenc}، {jsdelivr}، {github}', 'ترجمات معاني القرآن ونصوص الأحاديث', 'طلبات النصوص التي تفتحها'],
            ['hisnmuslim.com', 'تسجيلات الأدعية الصوتية', 'عند الضغط على «استمع» فقط'],
            ['{osm} ({overpass})', 'البحث عن المساجد القريبة', 'إحداثيات منطقة البحث'],
            ['{openmeteo}', 'البحث عن مدن العالم والطقس الحالي في الصفحة الرئيسية', 'اسم المدينة الذي تكتبه؛ إحداثيات الموقع المختار'],
            ['{openfoodfacts}', 'البحث عن المنتج في فحص الحلال', 'الرمز الشريطي الذي تُدخله فقط'],
            ['{exchangerate}', 'أسعار العملات في حاسبة الزكاة', 'طلب سعر الصرف فقط'],
            ['{youtube}', 'الصور المصغّرة للفيديوهات وتشغيلها (وضع الخصوصية المحسّنة)', 'طلبات الصور عند فتح قسم الفيديو؛ والفيديو نفسه بعد الضغط على التشغيل'],
            ['{telegram}', 'بوت الموقع', 'إن راسلت البوت فقط'],
            ['{gmaps}، إنستغرام', 'روابط الخرائط ووسائل التواصل', 'عند الضغط على الرابط فقط'],
          ],
        } },
        'لا نبيع بياناتك، ولا ننقلها لأغراض الإعلان أو بناء الملفات الشخصية.',
      ] },
      logs: { h: 'سجلات الخادم', body: [
        'كأي خادم ويب، يحتفظ خادمنا ({nginx}) بسجلّ تقني للطلبات الواردة: عنوان {ip}، والوقت، والعنوان المطلوب، ورمز الاستجابة، وبيانات المتصفح. ولا تُسجَّل طلبات الملفات الثابتة كالصور والخطوط والبرامج النصية، ولا إشارة الإحصائيات، ولا صفحة المشاركة، ولا اشتراكات التقويم، ولا التحديثات الحية.',
        'تُستخدم هذه السجلات فقط لإصلاح الأخطاء وحماية الموقع من الهجمات. وحجمها محدود (نحو ثلاثة ملفات بحجم ١٠ ميغابايت لكل منها): وكلما امتلأت المساحة تُستبدل أقدم الإدخالات تلقائياً. وتصل الطلبات إلى خادمنا عبر {cloudflare} الذي يعالج حركة المرور أيضاً وفق سياسته.',
      ] },
      purposes: { h: 'الأغراض والأساس القانوني', body: [
        { ul: [
          '**تقديم الخدمة** — تشغيل الموقع وأمان الموقع وحسابك وإصلاح الأخطاء (سجلات الخادم، وحدود الطلبات، وسجلّ الأمان وتنبيهاته، وتقارير الأخطاء، و{cloudflare}): مصلحتنا المشروعة في تشغيل الموقع بصورة موثوقة وآمنة.',
          '**حسابك** — إنشاؤه وتشغيله وتسجيل دخولك والرسائل المرتبطة به (التأكيد، إعادة تعيين كلمة المرور، تنبيهات الأمان): لازم لتقديم الحساب الذي طلبته.',
          '**موافقتك** — الإشعارات الفورية والوصول إلى موقع جهازك والميزات الإضافية التي تحفظ بيانات مقروءة على الخادم (التذكيرات، التقرير الأسبوعي، ميزات العائلة والمجتمع، الملف العام): تفعّل كل واحدة بنفسك، ويمكنك سحب موافقتك في أي وقت بتعطيلها أو حذف بياناتها.',
          '**طلبك** — المساعد الذكي والبحث في القرآن بالمعنى والبحث عن المدن والمساجد وفحص الحلال: لا تُرسَل البيانات إلا عند استخدامك لهذه الميزة ولغرض الحصول على الجواب فقط.',
          '**الإحصائيات المجهولة ورسائل الأخبار العرضية** — معرفة أقسام الموقع المفيدة وإخبار أصحاب الحسابات بالخدمة: مصلحتنا المشروعة؛ فالإحصائيات لا تعرّف بأحد، ويمكنك إلغاء الاشتراك في الأخبار بنقرة واحدة.',
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
        'إن كان لديك حساب فيمكنك فعل معظم ذلك بنفسك في صفحة حسابك: الاطلاع على بياناتك وتنزيلها («بياناتي»)، وتصحيح اسمك الظاهر وكلمة المرور، وحذف سجلات بعينها أو الحساب كله. ومن دون حساب فإننا في الغالب لا نستطيع التعرّف عليك، ومعظم البيانات موجود أصلًا على جهازك وحده — ويمكنك حذفه بنفسك من المتصفح. ويمكنك حذف سجل الإشعارات فورًا بزر «إيقاف». ولأي طلب آخر [تواصل معنا]({toContact}).',
      ] },
      children: { h: 'الأطفال', body: [
        'الموقع موجّه لجميع الأعمار، وفيه قسم خاص بالأطفال يعمل دون حساب ولا يرسل إلى خادمنا شيئًا عن الطفل. وتتيح الملفات الشخصية وقفل وضع الأطفال للوالد إعداد مساحة لطفله داخل حسابه هو، وتبقى على الجهاز أو في المزامنة المشفّرة. ونوصي بأن يستخدم الأطفال الحسابات وميزات المجتمع والمساعد الذكي والإشعارات تحت إشراف الوالدين.',
      ] },
      security: { h: 'الأمان', body: [
        'يجري كل الاتصال بالموقع عبر اتصال HTTPS مشفّر. ولا تُحفظ كلمات المرور إلا بصمات {scrypt} أحادية الاتجاه، ولا مفاتيح الجلسات والروابط الخاصة إلا بصمات {sha256}، وأسرار التحقق بخطوتين مشفّرة؛ وتُشفَّر بياناتك المتزامنة وصندوق الأمانة في متصفحك قبل أن تصل إلينا. والوصول إلى الخادم مقيّد، ولا تُحفظ المفاتيح السرية في الشيفرة. ومع ذلك لا توجد وسيلة على الإنترنت تضمن الأمان التام.',
      ] },
      transfers: { h: 'نقل البيانات إلى دول أخرى', body: [
        'قد تقع خوادم الخدمات المذكورة أعلاه — ومنها خدمة إرسال البريد — في دول مختلفة (منها الولايات المتحدة ودول الاتحاد الأوروبي). وعند استخدامك لهذه الخدمات قد تُعالَج البيانات المتعلقة بها في تلك الدول.',
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
          '**Hesap isteğe bağlıdır.** Sitenin büyük kısmı hesapsız çalışır. Hesap oluşturursanız e-posta adresinizi, isteğe bağlı görünen adınızı ve nasıl giriş yaptığınızı saklarız (ayrıntılar aşağıda).',
          '**Reklam ve takip yok.** Reklam veya takip çerezi ve reklam ağı yoktur. Hesaba giriş için iki zorunlu çerez kullanılır; ziyaret istatistikleri ise anonimdir, çerezsizdir ve kendi sunucumuzda tutulur.',
          '**Verileriniz cihazınızda kalır.** Tercihler, favoriler, zikir, hıfz, dua günlüğü vb. tarayıcınızda saklanır. Eşitlemeyi açarsanız önce tarayıcınızda şifrelenir — sunucumuzda yalnızca okuyamadığımız bir kopya kalır.',
          '**Sunucumuza yalnızca gerekli olan ulaşır:** örneğin bildirimleri açarsanız bildirim adresi ve şehir, yapay zekâ asistanına soru sorarsanız sorunuzun metni, topluluk ve aile bölümlerinde ise yalnızca paylaşmayı seçtikleriniz. Aşağıdaki her bölüm neyin saklandığını, kimin gördüğünü ve ne kadar süre kaldığını açıklar.',
          '**Verilerinizi asla satmayız**, reklam veya profil oluşturma amacıyla kimseye aktarmayız.',
        ] },
      ] },
      controller: { h: 'Bu politikanın kapsamı', body: [
        'Bu politika {brand} sitesini ({domain}), mobil uygulamasını, sitenin içeriğini başka sitelerde gösteren namaz vakitleri araçlarını ve {wordpress} eklentisini, ayrıca sitenin {telegram} botunu kapsar. Hizmet ücretsiz ve reklamsızdır.',
        { when: IF_OPERATOR, p: 'Hizmeti **{operator}** yürütür ve bu politikada anlatılan veri işlemeden sorumludur.' },
        'Soru ve talepleriniz için [İletişim]({toContact}) bölümüne bakın.',
      ] },
      local: { h: 'Tarayıcınızda saklanan veriler', body: [
        'Sitenin çalışması için gereken tercihler tarayıcının yerel depolamasında ({localstorage}) ve oturum depolamasında ({sessionstorage}) tutulur. Bu veriler **sunucumuza gönderilmez** (istisnalar aşağıda ayrıca belirtilmiştir) ve yalnızca o tarayıcıdan erişilebilir.',
        { table: {
          head: ['Ne', 'Nerede', 'Ne kadar süre'],
          rows: [
            ['Dil, tema (açık/koyu), erişilebilirlik ayarları, menü durumu, ana sayfa düzeni', 'Yerel depolama', 'Siz silene kadar'],
            ['Seçilen şehir veya özel konum, son seçilen şehirler', 'Yerel depolama', 'Siz silene kadar'],
            ['Favori hadis ve dualar, Kur’an’da okuma yeri, Kur’an notları ve vurgular, kitaplığınız, son aramalar', 'Yerel depolama', 'Siz silene kadar'],
            ['Zikir sayacı, hıfz, vird, günlük ibadet ve namaz istatistikleri, öğrenme ilerlemesi ve rozetler, bilgi yarışması ve oyun puanları, takvim hatırlatmaları', 'Yerel depolama', 'Siz silene kadar'],
            ['Dua günlüğü, sadaka kayıtları ve kaza namazı kayıtları', 'Yerel depolama', 'Siz silene kadar'],
            ['Profiller (6’ya kadar) ve çocuk modu kilidi', 'Yerel depolama', 'Siz silene kadar'],
            ['Yapay zekâ asistanıyla sohbet geçmişi', 'Yerel depolama', '“Sohbeti temizle”ye basana veya silene kadar'],
            ['Bildirim ayarları, bildirim adresinin kopyası, okunan duyurular, gizlenen hatırlatmalar', 'Yerel depolama', 'Siz silene kadar'],
            ['Giriş yaptığınıza dair bir işaret (şifre veya oturum anahtarı değil), bu cihazın eşitleme ayarları, oluşturduğunuz veya katıldığınız oda ve bağlantıların anahtarları', 'Yerel depolama', 'Çıkış yapana, ayrılana veya silene kadar'],
            ['Geçici kopyalar: namaz vakitleri, ayetler, güncel hava durumu, listedeki konum', 'Oturum depolaması', 'Tarayıcı sekmesi kapanana kadar'],
            ['Çevrim dışı kullanım için sayfa, yanıt ve indirilen Kur’an seslerinin kopyaları', 'Tarayıcı önbelleği ({sw})', 'Tarayıcı temizleyene veya sitenin yeni sürümüne kadar'],
          ],
        } },
        '**Nasıl silinir:** tarayıcı ayarlarından {domain} için “site verilerini” (veya “çerezleri ve site verilerini”) temizleyin. Bu işlem, dua günlüğü ve istatistikler dahil yukarıdaki her şeyi kalıcı olarak siler. Gizli (inkognito) modda veriler pencere kapanınca kendiliğinden silinir.',
        { note: 'Bu verileri otomatik olarak yedeklemiyoruz. Sayfanın altındaki "Verilerim" bölümünden dosya olarak indirebilir veya uçtan uca şifreli eşitlemeyi açabilirsiniz — bkz. [Eşitleme ve yedekler]({toSync}).' },
      ] },
      sync: { h: 'Eşitleme ve yedekler', body: [
        'Cihazlar arası eşitleme siz açana kadar kapalıdır. Açtığınızda verileriniz **tarayıcınızda** kurtarma kodunuzdan türetilen bir anahtarla şifrelenir ({aesgcm}). Sunucumuz yalnızca şifreli kopyayı saklar ve onu okuyamaz; ne kod ne de anahtar bize hiçbir zaman ulaşır.',
        { ul: [
          '**Hesapsız:** kopya, yine kurtarma kodundan türetilen bir kimlik altında saklanır — ona hiçbir hesap, çerez veya {ip} adresi bağlanmaz. Kurtarma kodunu bilen herkes kopyayı açabilir; bu yüzden kodu güvenli bir yerde tutun.',
          '**Hesapla:** aynı şifreli kopya, yeni cihazda giriş yaptıktan sonra açılsın diye hesabınıza bağlanabilir. Bunun için sunucumuz kurtarma kodunuzu da saklar — tarayıcınızda şifrenizden ({pbkdf2}, 600.000 tur) veya geçiş anahtarınızdan türetilen bir anahtarla kilitlenmiş olarak; bu anahtar bize hiçbir zaman gelmez.',
          '**Ne kadar süre:** "Sunucudan sil" düğmesine basana veya hesabınızı silene kadar. 400 gün kimsenin dokunmadığı kopya otomatik silinir; yalnızca bir kez kaydedilip bir daha hiç açılmayan kopya ise 30 gün sonra silinir.',
        ] },
        { note: 'Şifreyle yapılan her girişte olduğu gibi, giriş yaparken şifreniz sunucumuzdan geçer (yalnızca tek yönlü {scrypt} özetini saklarız). Bu yüzden eşitlenen veriler en güçlü biçimde, geçiş anahtarıyla giriş yaptığınızda veya eşitlemeyi kurtarma koduyla açtığınızda korunur.' },
        '"Verilerim" bölümünden indirdiğiniz yedek dosyası tarayıcınızda oluşturulur ve yalnızca cihazınızda saklanır.',
      ] },
      cookies: { h: 'Çerezler', body: [
        '{brand} **takip veya reklam için çerez kullanmaz**; giriş yapmayan ziyaretçilere ise bizden hiç çerez gelmez. Yukarıda anlatılan yerel depolama yalnızca sizin kullandığınız özellikler içindir; bu nedenle ayrı bir “çerez onayı” penceresi göstermiyoruz.',
        'Giriş yaptığınızda iki zorunlu çerez kullanırız. İkisi de {httponly} çerezdir (sayfadaki betikler onları okuyamaz) ve yalnızca {domain} adresine gönderilir:',
        { table: {
          head: ['Çerez', 'Neden', 'Ne kadar süre'],
          rows: [
            ['{cookieuser}', 'Oturumunuzu açık tutar (rastgele bir oturum anahtarı; sunucuda yalnızca özeti saklanır)', '30 gün, siteyi kullandıkça uzar; çıkış yapınca silinir'],
            ['{cookiedev}', 'Daha önce giriş yaptığınız cihazı tanır; böylece yeni cihazlardan yapılan girişleri size e-postayla bildirebiliriz', '2 yıl'],
          ],
        } },
        'Üçüncü taraflar kendi çerezlerini kullanabilir: {cloudflare} siteyi saldırılara karşı korumak için zorunlu bir teknik çerez yazabilir; {youtube} bir videoyu oynatmaya başladığınızda kendi kurallarına göre çerez kullanabilir; {google} ile giriş yaparsanız {google} giriş penceresi kendi kurallarıyla çalışır.',
      ] },
      analytics: { h: 'Ziyaret istatistikleri', body: [
        'Sitenin hangi bölümlerinin faydalı olduğunu anlamak için kendi sunucumuzda basit, **çerezsiz** ziyaret istatistikleri tutuyoruz; üçüncü taraf analitik hizmeti kullanılmaz. Bir sayfa açıldığında sunucuya yalnızca sayfa adresi (sorgu dizesi olmadan), arayüz dili ve sizi yönlendiren sitenin yalnızca alan adı gider; tarayıcı tanımından yalnızca cihaz türü ve tarayıcı ailesi çıkarılır, ülke ve konum belirlenmez. Günlük tekil ziyaretçileri saymak için {ip} adresinizden, tarayıcı tanımından ve tarihten, her gün yenilenen gizli bir anahtarla tek yönlü bir özet (hash) hesaplanır; bu değer yalnızca sunucunun belleğinde en fazla bir gün kalır ve diske yazılmaz. Veritabanında yalnızca toplamlar tutulur ve 400 gün sonra silinir. Çerez, kimlik veya parmak izi yoktur; tarayıcınız “Do Not Track” ya da Global Privacy Control gönderiyorsa ziyaretiniz hiç sayılmaz.',
        'Bir yapay zekâ asistanından (örneğin {chatgpt} veya {perplexity}) geldiyseniz istatistiklerde yalnızca o sitenin alan adını görürüz — sohbetinizle ilgili hiçbir şeyi değil. Başka bir sitenin içinde açılan sayfalar (araçlarımız ve {wordpress} eklentisi), yönetim paneli ve otomatik tarayıcılar sayılmaz. Kötüye kullanımı önlemek için {ip} adresiniz sunucunun belleğinde en fazla bir dakika tutulur.',
      ] },
      account: { h: 'Hesabınız', body: [
        'Hesap isteğe bağlıdır. E-posta ve şifreyle, geçiş anahtarıyla veya {google} ile oluşturabilirsiniz. Bu durumda şunları saklarız:',
        { ul: [
          'e-posta adresinizi ve doğrulanıp doğrulanmadığını, isteğe bağlı görünen adınızı, rolünüzü (örneğin cami temsilcisi), hesabın oluşturulma ve son giriş tarihlerini ve kullandığınız site dilini (e-postalarımız size kendi dilinizde ulaşsın diye);',
          'nasıl giriş yaptığınızı: şifrenizin tek yönlü {scrypt} özetini (şifrenin kendisini asla), geçiş anahtarlarınızın açık anahtarlarını (gizli anahtar cihazınızdan çıkmaz) ve {google} kullanıyorsanız {google}’ın hesabınıza verdiği kimliği;',
          'iki adımlı doğrulamayı açarsanız: doğrulama uygulamanızın sırrını (şifreli) ve tek kullanımlık yedek kodlarınızın özetlerini;',
          'oturumlarınızı: her biri için rastgele bir anahtar (yalnızca özeti saklanır), “{devlabel}” gibi kısa bir cihaz etiketi ve tarihler — {ip} adresi yok;',
          'girişlerin ve güvenlik değişikliklerinin (şifre, iki adımlı doğrulama, geçiş anahtarları) kaydını — giriş yöntemi, cihaz etiketi ve {cloudflare}’ın bildirdiği yaklaşık ülkeyle; 90 gün saklanır.',
        ] },
        '**{google} ile giriş:** {google} betiği yalnızca giriş ve kayıt sayfalarında yüklenir. Kullandığınızda {google} bize e-posta adresinizi, adınızı ve bir hesap kimliği verir; kimliği ve e-posta adresini saklarız, adı ise yeni bir hesabın görünen adı olarak kullanırız. {google} şifrenizi asla görmeyiz.',
        '**Güvenlik e-postaları:** biri yeni bir cihazdan giriş yaptığında ve şifreniz, iki adımlı doğrulamanız veya geçiş anahtarlarınız değiştiğinde size yazarız. Böyle bir e-postadaki “Bu ben değildim” bağlantısı tüm cihazlardaki oturumları kapatır ve yeni şifre belirleyene kadar şifreyle ve {google} ile girişi durdurur (geçiş anahtarları çalışmaya devam eder).',
        '**Tahmine karşı koruma:** tekrarlanan giriş denemelerini sınırlamak için {ip} adresiniz yalnızca sunucunun belleğinde, kısa süre kullanılır ve diske yazılmaz.',
        '**Görmek, indirmek, silmek:** hesap sayfanız neleri sakladığımızı gösterir; "Verilerim" ise hepsini dosya olarak indirmenizi sağlar. "Hesabı sil", hesabı ve ona bağlı her şeyi — hesaba bağlı şifreli eşitleme kopyası dahil — veritabanımızdan siler. Yalnızca Ümmetin Canlı Hatminde okuduğunuz sayfalar, adınız olmadan o turun anonim sayısında kalır.',
        'Cami temsilcisi veya editör gibi rolleri yöneticiler verir. Her rol değişikliği bir denetim kaydına yazılır (yalnızca hesap numarası ve roller — bu kayıt hesap silindikten sonra da kalır); yönetim panelini açmanız ise güvenlik kaydınıza işlenir.',
      ] },
      email: { h: 'E-postalar', body: [
        'E-postaları yalnızca hesabınızın adresine, e-posta gönderim hizmetimiz {resend} aracılığıyla göndeririz; bu hizmet alıcının adresini ve her e-postanın içeriğini alır. Kayıtlarımızda e-posta adresi bulunmaz.',
        { ul: [
          '**Hizmet e-postaları** (her zaman): adres doğrulama, şifre sıfırlama, biri adresinizle kayıt olmaya çalıştığında bildirim ve yukarıda anlatılan güvenlik e-postaları.',
          '**Hoş geldin e-postası** (bir kez): adresinizi doğruladıktan sonra — kullandığınız site dilinde, dil bilinmiyorsa İngilizce ve Arapça.',
          '**Kendi açtığınız e-postalar:** haftalık rapor ve kurduğunuz hatırlatmalar (bir sonraki bölüme bakın). Yalnızca doğrulanmış adrese gider ve her birinde abonelikten çıkma bağlantısı vardır.',
          '**Site ekibinden ara sıra haberler:** yalnızca doğrulanmış hesaplara gider, abonelikten çıkmış bir adrese asla gönderilmez. Bu e-postaların her birinde tek tıkla abonelikten çıkma bağlantısı vardır; çıkmak yalnızca bu e-postaları durdurur, hizmet ve güvenlik e-postalarını değil. Bu e-postalardan hangisinin hangi hesaba gittiğinin kaydını gönderim bittikten sonra 180 gün tutarız.',
        ] },
      ] },
      accountdata: { h: 'Sunucunun okuduğu hesap özellikleri', body: [
        'Hesabınızda yaptıklarınızın çoğu uçtan uca şifrelidir. Aşağıdaki özellikler ise farklıdır: bir hatırlatmayı zamanında göndermek ya da ailenize bir şey göstermek için sunucumuzun veriyi okuması gerekir; bu yüzden veri **şifrelenmeden** saklanır. Hepsi siz açana kadar kapalıdır, çoğu önce açık rızanızı ister ve verileri dilediğiniz zaman silebilirsiniz. Hepsi hesabınızla birlikte silinir ve hesap dışa aktarımına dahildir.',
        { table: {
          head: ['Özellik', 'Ne saklanır', 'Kim görür, ne kadar süre'],
          rows: [
            ['Hatırlatmalar: gelecekteki kendinize mektup, vefat etmiş yakınlarınız için dua, zekât tarihiniz', 'Mektup ve teslim tarihi; yakınlarınızın adları (isteğe bağlı yakınlık ve notla); zekât yılınızın başlangıcı (tutar yalnızca siz eklerseniz); saat diliminiz ve diliniz', 'Yalnızca siz; listenizi takip etmeye davet ettiğiniz kişiler adları görür, notlarınızı değil. Siz silene kadar'],
            ['E-postayla haftalık rapor', 'Seçtiğiniz gün, saat diliminiz ve diliniz ile tarayıcınızın hesapladığı haftalık beş sayı (namaz, Kur’an sayfası, zikir, oruç günleri, vird)', 'Yalnızca siz. Sayılar 120 gün sonra silinir'],
            ['Aile çevresi (8 hesaba kadar), aile duaları ve aile Ramazan panosu', 'Üyelik; yalnızca paylaşmayı seçtiğiniz özet sayılar; kartlar (şablon ve sayı, serbest metin yok); yazdığınız dua istekleri; Ramazan sayıları ile cüz ve iftar listelerindeki adlar', 'Çevrenizin üyeleri. Kartlar 60 gün, dua istekleri 30–90 gün sonra silinir'],
            ['Grup meydan okumaları ve öğretmen sınıfları', 'Üyelik ve günlük işaretleriniz; sınıfta ödevler ve — yalnızca rızanızla — ilerleme sayılarınız', 'Diğer üyeler yalnızca günlük toplamları görür, ad veya sıralama yoktur; öğretmen bir öğrencinin ilerlemesini yalnızca onun rızasıyla görür. Meydan okuma bittikten 30 gün sonra silinir'],
            ['Açık profil (varsayılan olarak kapalı)', 'Kullanıcı adı, görünen ad, künye, kısa tanıtım, sevdiğiniz sure ve öğrenme rozetleri', 'Açık olduğu sürece herkes, {profilepath} adresinde. Profil şikâyetleri 180 gün saklanır'],
            ['Dua duvarı', 'İsteğiniz (300 karaktere kadar), isteğe bağlı bir ad (varsayılan “Anonim”) ve dili', 'Bir moderatör onayladıktan sonra 30 gün boyunca herkes. Moderatörler e-posta adresinizi asla görmez'],
            ['Ümmetin Canlı Hatmi', 'Aldığınız sayfa, katıldığınız turlar, isteğe bağlı bir ithaf adı ve — yalnızca izninizle — yaklaşık 110 km’ye yuvarlanmış konumunuz', 'İthaf asla herkese açık değildir (yalnızca ithaf sayısı gösterilir) ve tur bittikten 30 gün sonra silinir. Konum canlı haritada bir kez görünür ve silinir; ülke ({cloudflare}’dan) kişi bazında değil, yalnızca turun ülke listesinde sayılır'],
            ['Gizli dua arkadaşı', 'Katıldığınız, diliniz ve saat diliminiz, eşleşmeniz ve işaretlediğiniz günler', 'Arkadaşınız kim olduğunuzu asla öğrenmez. Eşleşme ve işaretler 30 günlük tur bitince, üyelik ise siz ayrılınca silinir'],
            ['Hac yolculuğu', 'Yolculuğun türü, işaretlediğiniz aşamalar ve isteğe bağlı kısa bir ad — konumunuz asla', 'Aile çevreniz ve gizli bağlantınıza sahip kişiler. Başladıktan 30 gün sonra silinir'],
            ['Takvim beslemesi', 'Gizli bir bağlantı (yalnızca özeti), seçtiğiniz bölümler ve diliniz', 'Beslemeyi bağlantıyla çeken takvim uygulamanız veya hizmetiniz. Kapatana veya yeni bağlantı oluşturana kadar'],
            ['«Beni dinle» hıfz bağlantısı', 'Sure ve ayet aralığı, gösterilecek ad ve dinleyenin işaretleri (serbest metin yok)', 'Siz ve bağlantıya sahip kişi. Sonuçlar siz açtıktan 7 gün sonra silinir'],
            ['«Birlikte oku»', 'Oda ve içindekilerin takma adları — yalnızca sunucunun belleğinde, asla diskte değil', 'Odadakiler. 24 saat hareketsizlikten sonra kapanır'],
            ['Cami temsilcisi', 'Caminiz için kamet vakitleri, cuma hutbesinin konusu ve duyurular', 'Herkes — cami ekranında ve cami aramada. Duyurular süresi bittikten 30 gün sonra silinir'],
          ],
        } },
        '"Bu cihaza da bildirim gönder" seçeneğini seçerseniz, hatırlatmalarınız oraya da ulaşsın diye o cihazın bildirim adresini de hesabınıza bağlarız.',
      ] },
      community: { h: 'Topluluk panoları: namaz odaları, cenaze ilanları, gönüllüler', body: [
        'Bu bölümleri hesapla kullanırsanız aşağıdakiler sunucumuzda **şifrelenmeden** saklanır ve hesabınıza bağlanır. Yayınlamak, kaydolmak ve şikâyet etmek için e-posta adresinizin doğrulanmış olması gerekir.',
        { ul: [
          '**Namaz odası önerisi:** yerin adı, türü, şehri, adresi, koordinatları, katı ve notu. Onaydan sonra herkese görünür; adınız ve e-postanız gösterilmez. Reddedilen öneri 30 gün, bekleyen öneri 90 gün sonra silinir. Bir yer hakkındaki şikâyeti (sebep ve kısa not) yalnızca moderatörler görür. “Yakınımdakiler” için konumunuz yalnızca tarayıcınızda kullanılır ve sunucuya gönderilmez.',
          '**Cenaze ilanı** (yalnızca açık rızanızla): vefat edenin adı, namazın tarihi ve saati, yer, isteğe bağlı olarak defin yeri ve aileyle iletişim. Gizli bağlantıya sahip herkes görür (bağlantının kendisi veritabanında yalnızca özet değeri olarak saklanır); açık listeye yalnızca isterseniz ve moderatör kontrolünden sonra girer, orada iletişim bilgisi gösterilmez. İlan, namaz gününden 30 gün sonra otomatik silinir. “Dua ettim” için aile yalnızca bir sayı görür: giriş yapmış ziyaretçiler için her hesap bir kez sayılsın diye hesap başına bir kayıt tutulur, diğerleri için veritabanına hiçbir şey yazılmaz.',
          '**Gönüllü kaydı:** yazdığınız ad ve (yalnızca rızanızla) e-postanız yalnızca o caminin temsilcisine görünür; açık listede yalnızca dolan yer sayısı vardır. Tarihi geçen işler 30 gün sonra kayıtlarıyla birlikte silinir.',
        ] },
        'Bu kayıtları dilediğiniz zaman kendiniz silebilirsiniz; hesabı silerseniz hepsi silinir. Hesap veri dışa aktarımına dahildir.',
      ] },
      groups: { h: 'Grup hatmi ve ortak hedefler', body: [
        'Bir oda oluşturduğunuzda veya bir odaya katıldığınızda sunucuda yalnızca yazdığınız görünen ad (örneğin “Ali”), işaretleriniz (hangi cüzü aldığınız, hangi günleri işaretlediğiniz) ve dua odasında yazdığınız istekler saklanır. Hesap oluşturulmaz; {ip} adresi ve diğer kişisel veriler kaydedilmez. Yönetim ve katılım anahtarları yalnızca tarayıcınızın yerel deposunda kalır. Oda, son etkinlikten 180 gün sonra otomatik olarak silinir; odayı oluşturan kişi onu istediği zaman silebilir.',
      ] },
      trustbox: { h: 'Emanet kutusu', body: [
        'Hesabınızda bir emanet kutusu oluşturursanız notlarınız (vasiyet istekleri, borçlar, belgelerin yeri, ailenize sözler) **tarayıcınızda** yalnızca sizin bildiğiniz bir emanet parolasıyla şifrelenir (PBKDF2-SHA256, 600.000 tur; AES-256-GCM). Sunucumuzda yalnızca şifreli metin, rastgele bir tuz, gizli bağlantının SHA-256 özeti, oluşturma ve değişiklik zamanı ve bağlantıyla son açılış günü saklanır — parola, okunabilir metin ve {ip} adresiniz asla saklanmaz.',
        '**Ne kadar süre:** kutuyu silene kadar; hesabınız silindiğinde de silinir. Hesap dışa aktarımında şifreli hâliyle yer alır. Parola kaybolursa içeriği hiç kimse — biz de — kurtaramaz.',
      ] },
      push: { h: 'Anlık bildirimler', body: [
        'Bildirimler yalnızca siz izin verdiğinizde açılır. İzin verdiğinizde tarayıcınızın kendi anlık bildirim hizmeti ({pushsvc}) tarayıcınıza bir bildirim adresi (bildirimleri cihazınıza ulaştırmak için rastgele bir anahtar) verir ve biz kendi sunucumuzun veri tabanında şu bilgileri içeren bir kayıt saklarız:',
        { ul: [
          'bildirim adresi;',
          'tarayıcınızın teknik tanımı (user agent: tarayıcı ve işletim sisteminin adı ve sürümü);',
          'arayüz diliniz;',
          'seçtiğiniz namaz konumu: koordinatlar, saat dilimi, şehir adı ve vakit hesaplama yöntemi (listeden şehir seçtiyseniz şehir merkezi; “konumumu bul” ile özel konum seçtiyseniz o yerin yaklaşık koordinatları);',
          'bildirim tercihleriniz ve kaydın oluşturulma/güncellenme zamanı.',
        ] },
        '**Neden:** sunucumuz her aboneye kendi şehrinin ezan vaktinde bildirim gönderir, ayrıca yalnızca sizin açtığınız ek hatırlatmaları (örneğin “Namazınızı kıldınız mı?”, sabah ve akşam zikirleri, cuma, sünnet oruçları, tutulmalar, günün ayeti veya hadisi); tüm abonelere genel duyurular da gönderilebilir. “Namazınızı kıldınız mı?” sorusuna cevabınız cihazınızda kalır ve bize asla gönderilmez.',
        '**Ne kadar süre:** bildirimleri kapatana kadar. Sitedeki “Bildirimler” panelinde **“Kapat”** düğmesine bastığınızda kayıt veri tabanından hemen silinir. Bildirimleri yalnızca tarayıcı veya telefon ayarlarından engellerseniz adres geçersiz olur ve sunucu bir sonraki başarısız gönderimde kaydı siler.',
        'Giriş yapmışsanız ve kişisel hatırlatmalarınız için "Bu cihaza da bildirim gönder" seçeneğini seçerseniz, bildirim adresi hesabınıza da bağlanır.',
        { note: 'Mobil uygulamada namaz hatırlatmaları cihazın kendisinde planlanır; bunun için sunucumuza adres gönderilmez.' },
      ] },
      telegram: { h: 'Telegram botu', body: [
        'Bot, biz onu {telegram}’a bağlayana kadar kapalıdır; kapalıyken aşağıdakilerin hiçbiri gerçekleşmez.',
        'Sitenin Telegram botunu kullandığınızda komutlarınız sunucumuza Telegram’ın sunucuları üzerinden ulaşır; bu yolda Telegram’ın kendi gizlilik politikası geçerlidir. Bir şehir seçtikten sonra bot sunucumuzun veritabanında yalnızca şu kaydı tutar (şifrelenmeden — şehir seçerek buna onay vermiş olursunuz):',
        { ul: [
          'sohbet numarası (Telegram’ın sohbet kimliği — size yanıt göndermek için);',
          'arayüz diliniz (Telegram’ın bildirdiği dil kodundan);',
          'seçtiğiniz şehir (sitenin şehir listesinden);',
          'ezan hatırlatmasının açık veya kapalı olduğu ve kaydın oluşturulma zamanı.',
        ] },
        'Adınız, kullanıcı adınız, telefon numaranız ve mesajlarınızın metni saklanmaz ve kayda geçirilmez; {ip} adresi yazılmaz.',
        '**Ne kadar süre:** bota /stop komutunu gönderene veya botu engelleyene kadar — her iki durumda da kayıt hemen silinir.',
      ] },
      ai: { h: 'Yapay zekâ asistanı', body: [
        'Yapay zekâ asistanına soru sorduğunuzda sorunuzun metni, mevcut sohbetin son birkaç mesajı ve arayüz diliniz sunucumuza, oradan da {openrouter} hizmeti aracılığıyla bir yapay zekâ modeline (şu an {gemini}) gönderilir. Cevap aynı yoldan geri döner.',
        { ul: [
          'Sunucumuz sohbet metnini **saklamaz ve kayıtlara yazmaz**; yalnızca teknik göstergeler (cevabın süresi ve uzunluğu) kaydedilir.',
          'Sohbet geçmişiniz yalnızca tarayıcınızda tutulur; “Sohbeti temizle” ile silebilirsiniz.',
          'Kötüye kullanımı önlemek için {ip} adresiniz, dakikalık istek sınırı amacıyla kısa süre sunucunun belleğinde tutulur.',
          '{openrouter} ve model sağlayıcısı isteği kendi gizlilik politikalarına göre işler.',
        ] },
        '**Kur’an’da anlamla arama** da benzer çalışır: yazdığınız kelimeler ve arayüz diliniz sunucumuz ve {openrouter} üzerinden modele gider; model yalnızca ayet numaralarını seçer — gördüğünüz ayet metni sitenin kendi Kur’an verisinden gelir. Hiçbir şey saklanmaz, arama metni kayda geçirilmez; aynı aramalar kısa süre sunucunun belleğinde tutulur.',
        '**Cevabı değerlendirme:** bir cevabı faydasız olarak işaretlerseniz soru, cevap, seçtiğiniz sebep ve isteğe bağlı yorumunuz incelenmek üzere sunucumuzda saklanır — bkz. [Hata raporları ve geri bildirim]({toFeedback}).',
        { note: 'Yapay zekâ asistanına adınız, adresiniz, sağlık veya aile durumunuz gibi kişisel bilgiler yazmayın.' },
      ] },
      location: { h: 'Konum verisi', body: [
        'Cihazınızın konumunu yalnızca siz bir düğmeye bastığınızda ve tarayıcı izin verdiğinde isteriz. Konum verisinin gittiği yerler:',
        { ul: [
          '**Şehri belirleme:** en yakın şehir cihazınızın kendisinde hesaplanır.',
          '**Kıble yönü:** tamamen cihazınızda hesaplanır, hiçbir yere gönderilmez.',
          '**Cami bulucu:** yakındaki camileri bulmak için koordinatlarınız {osm} veri hizmetine ({overpass}) gönderilir.',
          '**Namaz vakitleri:** Azerbaycan şehirleri için vakitler cihazınızda hesaplanır; diğer yerler için seçtiğiniz konumun koordinatları ve saat dilimi aladhan.com hizmetine gönderilir.',
          '**Şehir arama:** yazdığınız şehir adı {openmeteo} hizmetine gönderilir.',
          '**Ana sayfada hava durumu:** güncel havayı göstermek için seçtiğiniz şehrin veya konumun koordinatları {openmeteo} hizmetine gönderilir.',
          '**Hilal gözlem haritası:** gönderdiğiniz bildirimde yalnızca yaklaşık 110 km’lik bir alan, akşamın tarihi ve saati, hilali görüp görmediğiniz ve nasıl baktığınız saklanır — hesap, ad veya {ip} adresi yok.',
          '**“Şu an zikredenler” haritası:** zikir veya salavat saydığınızda, namaz vakitleri için kendi şehrinizi seçtiyseniz o şehrin yaklaşık 200 km’ye yuvarlanmış konumu 10 dakika boyunca sunucunun belleğinde kalır ve asla kaydedilmez. Ümmet sayacının günlük toplamlarında kişisel veri yoktur.',
          '**Haritada aç / Yol tarifi:** bu bağlantılara bastığınızda {gmaps} koordinatlarla yeni sekmede açılır.',
        ] },
      ] },
      feedback: { h: 'Hata raporları ve geri bildirim', body: [
        '**“Hata bildir”:** sayfa, hatanın türü, metniniz ve — yalnızca siz yazarsanız — size ulaşma yolu sunucumuzda saklanır. Bunları yalnızca yöneticiler okur ve yönetim panelinden siler; bunlarla birlikte {ip} adresi, çerez veya tarayıcı bilgisi saklanmaz.',
        '**Yapay zekâ cevabını değerlendirme:** bir cevabı faydasız olarak işaretlerseniz soru, cevap, seçtiğiniz sebep ve isteğe bağlı yorumunuz aynı şekilde saklanır.',
        '**Otomatik hata raporları:** bir sayfada program hatası olursa tarayıcınız bize hata mesajını, betik dosyasını ve satırını, sayfanın yolunu (sorgu dizesi olmadan) gönderir; mesajdaki e-posta adresleri ve uzun sayılar maskelenir. Bu raporlar yalnızca sunucunun belleğinde tutulur ve sunucu yeniden başladığında silinir; {ip} adresi, çerez veya tarayıcı tanımı saklanmaz. Tarayıcıların gönderdiği güvenlik politikası ({csp}) ihlali raporları da aynı şekilde işlenir.',
      ] },
      embeds: { h: 'Araçlar, paylaşma ve Instagram', body: [
        { ul: [
          '**Başka sitelerde:** namaz vakitleri aracımız, cami ekranı veya {wordpress} eklentisi başka bir sitede gösterildiğinde ziyaret istatistiği göndermez ve çerez kullanmaz; görünüm ayarlarını tarayıcınızda — her site için ayrı — saklayabilir. Sade cami ekranı, çevresindeki sayfaya yalnızca içeriğinin yüksekliğini (bir sayı) bildirir; böylece çerçeve ona uyar. Otomatik hata raporları yukarıda anlatıldığı gibi çalışır. Azerbaycan dışındaki yerler için vakitleri tarayıcınız aladhan.com’dan alır.',
          '**{brand} ile paylaşma:** başka bir uygulamadan {brand} ile metin paylaşırsanız (Android’de “Paylaş”), metin tarayıcınızda kalır — sunucumuzda saklanmaz, sunucu kayıtlarına yazılmaz ve çevrim dışı önbelleğe alınmaz. Yalnızca seçtiğiniz işlem için kullanılır: örneğin Kur’an’da arama Arapça metni {alquran} hizmetine gönderir, dua günlüğüne eklemek ise onu cihazınızda saklar.',
          '**Instagram hesabımız:** gönderiler otomatik yayınlanır ve yalnızca sitenin herkese açık içeriğinden oluşur (bir ayet, bir hadis, bir dua veya Allah’ın isimlerinden biri) — hiçbir ziyaretçi veya hesap verisi kullanılmaz. Instagram’ı açtığınızda onun kendi gizlilik politikası geçerlidir.',
        ] },
      ] },
      thirdparty: { h: 'Üçüncü taraf hizmetler', body: [
        'Site aşağıdaki hizmetleri kullanır. İnternetteki her istekte olduğu gibi, tarayıcınız bunlara bağlandığında {ip} adresiniz ve tarayıcı bilgileriniz ilgili hizmete iletilir; hizmet bunları kendi politikasına göre işler.',
        { table: {
          head: ['Hizmet', 'Amaç', 'Ne iletilir'],
          rows: [
            ['{cloudflare}', 'Sitenin iletimi (CDN) ve saldırılara karşı koruma', 'Siteye yapılan tüm istekler'],
            ['{pushsvc}', 'Anlık bildirimlerin cihazınıza ulaştırılması (tarayıcınızın kendi hizmeti)', 'Bildirimler açıksa — şifrelenmiş bildirim metni ve bildirim adresi'],
            ['{openrouter}, {gemini}', 'Yapay zekâ asistanının cevapları ve Kur’an’da anlamla arama', 'Soru ve sohbetin son mesajları ya da arama kelimeleriniz (sunucumuz üzerinden)'],
            ['{resend}', 'E-postalarımızın iletilmesi', 'E-posta adresiniz ve e-postanın içeriği (yalnızca hesabınız varsa)'],
            ['{google}', '{google} ile giriş', 'Yalnızca kullanırsanız, giriş ve kayıt sayfalarında'],
            ['aladhan.com', 'Azerbaycan dışındaki yerler için namaz vakitlerinin hesaplanması', 'Seçilen konumun koordinatları, saat dilimi, yöntem'],
            ['{alquran}, {islamicnetwork}, {qurancom}', 'Kur’an metni, mealler, kıraat sesleri', 'Sure/ayet istekleri'],
            ['{quranenc}, {hadeethenc}, {jsdelivr}, {github}', 'Mealler ve hadis metinleri', 'Açtığınız metinlerin istekleri'],
            ['hisnmuslim.com', 'Duaların sesi', 'Yalnızca “Dinle”ye bastığınızda'],
            ['{osm} ({overpass})', 'Yakındaki camilerin aranması', 'Arama bölgesinin koordinatları'],
            ['{openmeteo}', 'Dünya şehirlerinde arama ve ana sayfada güncel hava durumu', 'Yazdığınız şehir adı; seçtiğiniz konumun koordinatları'],
            ['{openfoodfacts}', 'Helal kontrolünde ürün arama', 'Yalnızca girdiğiniz barkod'],
            ['{exchangerate}', 'Zekât hesaplayıcısında döviz kurları', 'Yalnızca kur isteği'],
            ['{youtube}', 'Video önizleme görselleri ve oynatma (gelişmiş gizlilik modu)', 'Videolar bölümü açılınca görsel istekleri; oynata basınca video'],
            ['{telegram}', 'Sitenin botu', 'Yalnızca bota yazarsanız'],
            ['{gmaps}, Instagram', 'Harita ve sosyal medya bağlantıları', 'Yalnızca bağlantıya tıkladığınızda'],
          ],
        } },
        'Verilerinizi kimseye satmıyor, reklam veya profil oluşturma amacıyla aktarmıyoruz.',
      ] },
      logs: { h: 'Sunucu kayıtları', body: [
        'Her web sunucusu gibi bizim sunucumuz da ({nginx}) gelen istekler hakkında teknik kayıt tutar: {ip} adresi, zaman, açılan adres, yanıt kodu ve tarayıcı bilgisi. Görsel, yazı tipi ve betik gibi statik dosya istekleri, istatistik işareti, paylaşma sayfası, takvim beslemeleri ve canlı güncellemeler kaydedilmez.',
        'Bu kayıtlar yalnızca hataları gidermek ve siteyi saldırılara karşı korumak için kullanılır. Boyutları sınırlıdır (yaklaşık 10 MB’lık 3 dosya): alan doldukça en eski kayıtların üzerine otomatik olarak yazılır. İstekler sunucumuza {cloudflare} üzerinden ulaşır; o da trafiği kendi politikasına göre işler.',
      ] },
      purposes: { h: 'Amaçlar ve hukuki dayanak', body: [
        { ul: [
          '**Hizmetin sunulması** — sitenin çalışması, sitenin ve hesabınızın güvenliği, hataların giderilmesi (sunucu kayıtları, istek sınırları, güvenlik kaydı ve uyarıları, hata raporları, {cloudflare}): siteyi güvenilir ve güvenli şekilde işletmeye yönelik meşru menfaatimiz.',
          '**Hesabınız** — oluşturulması ve çalışması, girişiniz ve buna bağlı e-postalar (doğrulama, şifre sıfırlama, güvenlik uyarıları): istediğiniz hesabı sunmak için gereklidir.',
          '**Açık rızanız** — anlık bildirimler, cihaz konumuna erişim ve sunucuda okunabilir veri saklayan ek özellikler (hatırlatmalar, haftalık rapor, aile ve topluluk özellikleri, açık profil): her birini kendiniz açarsınız; kapatarak veya verileri silerek rızanızı dilediğiniz zaman geri alabilirsiniz.',
          '**Talebiniz** — yapay zekâ asistanı, Kur’an’da anlamla arama, şehir ve cami arama, helal kontrolü: veriler yalnızca o özelliği kullandığınızda ve yalnızca cevap almak için gönderilir.',
          '**Anonim istatistikler ve ara sıra haber e-postaları** — sitenin hangi bölümlerinin faydalı olduğunu anlamak ve hesap sahiplerini hizmet hakkında bilgilendirmek: meşru menfaatimiz; istatistikler kimseyi tanımlamaz, haber e-postalarından tek tıkla çıkabilirsiniz.',
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
        'Hesabınız varsa bunların çoğunu hesap sayfanızda kendiniz yapabilirsiniz: verilerinizi görmek ve indirmek ("Verilerim"), görünen adınızı ve şifrenizi düzeltmek, tek tek kayıtları veya tüm hesabı silmek. Hesabınız yoksa çoğu zaman sizi tanıyamayız; verilerin büyük kısmı zaten yalnızca cihazınızdadır ve tarayıcıdan kendiniz silebilirsiniz. Bildirim kaydınızı “Kapat” düğmesiyle hemen silebilirsiniz. Diğer talepler için [bizimle iletişime geçin]({toContact}).',
      ] },
      children: { h: 'Çocuklar', body: [
        'Site her yaştan kullanıcıya yöneliktir ve çocuklar için bir bölüm içerir; bu bölüm hesapsız çalışır ve çocuk hakkında sunucumuza hiçbir şey göndermez. Profiller ve çocuk modu kilidi, ebeveynin kendi hesabının içinde çocuğu için ayrı bir alan kurmasını sağlar; bunlar cihazda veya şifreli eşitlemede kalır. Çocukların hesapları, topluluk özelliklerini, yapay zekâ asistanını ve bildirimleri ebeveyn gözetiminde kullanmasını öneririz.',
      ] },
      security: { h: 'Güvenlik', body: [
        'Siteyle tüm iletişim şifreli HTTPS bağlantısı üzerinden yapılır. Şifreler yalnızca tek yönlü {scrypt} özetleri, oturum anahtarları ve gizli bağlantılar yalnızca {sha256} özetleri olarak saklanır; iki adımlı doğrulama sırları şifrelenir; eşitlenen verileriniz ve emanet kutunuz bize ulaşmadan önce tarayıcınızda şifrelenir. Sunucuya erişim kısıtlıdır ve gizli anahtarlar kodda tutulmaz. Yine de internette hiçbir yöntem tam güvenliği garanti etmez.',
      ] },
      transfers: { h: 'Verilerin yurt dışına aktarılması', body: [
        'Yukarıda adı geçen hizmetlerin — e-posta gönderim hizmetimiz dahil — sunucuları farklı ülkelerde (ABD ve Avrupa Birliği dahil) bulunabilir. Bu hizmetleri kullandığınızda ilgili veriler o ülkelerde işlenebilir.',
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
  return <LegalDocument docKey="privacy" doc={pickUi(DOC, lang)} setPage={setPage} />
}
