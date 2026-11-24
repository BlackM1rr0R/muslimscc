// ═══════════════════════════════════════════════════════════════════════
// E-poçt göndərişi — Resend HTTP API (https://api.resend.com/emails), asılılıqsız
//
// • env RESEND_API_KEY yoxdursa: bir dəfə loga yazılır və heç nə göndərilmir
//   (hesablar işləyir, sadəcə email_verified=0 qalır). Testlər üçün
//   onMessage(msg) qarmağı — açar yoxdursa "göndərilən" məktubu ona verir.
// • Göndərən: noreply@muslims.cc (domen Resend-də təsdiqlənməlidir — docs/USER-ACCOUNTS.md).
// • Şablonlar: verify | reset | exists — 5 dil (az/en/ru/tr/ar), qalanları en.
//   Şəxsi xatırlatmalar (server/personal.js): letter | lovedRemind | friday | zakatSoon | zakatDue —
//   mətndə {name}, {names}, {date}, {amount} yer tutucuları; məktubun özü (vars.body) sitat
//   kimi; vars.unsubUrl varsa — altda "abunəlikdən çıx" keçidi + List-Unsubscribe başlıqları.
//   Hesab təhlükəsizliyi (server/security.js): newSignIn | securityChange | adminSignIn — {time},
//   {device}, {place}, {event}; "details" sətirləri ayrıca blokda.
//   Həftəlik hesabat (server/weekly.js): weekly — {date}, {prayers}, {pages}, {dhikr}, {fasts}, {wird}.
//   Xoş gəldin (server/welcome.js): welcome — ayrıca zəngin HTML (renderWelcome), dil 'bi' = en + ar.
//   Admin məktubu (server/mailCampaigns.js): renderCampaign — düz mətn + **qalın** + https keçidləri, imtina altlığı.
//   Mətn + sadə HTML; dəyişənlər HTML-escape olunur. Logda alıcı ünvanı və
//   token YOXDUR (yalnız şablon adı və HTTP statusu).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const RESEND_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'Muslims.cc <noreply@muslims.cc>'
const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

const T = {
  verify: {
    az: { subject: 'E-poçtunuzu təsdiqləyin — Muslims.cc', intro: 'Muslims.cc hesabınızı təsdiqləmək üçün aşağıdakı keçidə basın:', button: 'E-poçtu təsdiqlə', note: 'Keçid 24 saat etibarlıdır. Bu hesabı siz yaratmamısınızsa, məktuba məhəl qoymayın.' },
    en: { subject: 'Confirm your email — Muslims.cc', intro: 'Click the link below to confirm your Muslims.cc account:', button: 'Confirm email', note: 'The link is valid for 24 hours. If you did not create this account, you can ignore this email.' },
    ru: { subject: 'Подтвердите e-mail — Muslims.cc', intro: 'Нажмите на ссылку ниже, чтобы подтвердить аккаунт Muslims.cc:', button: 'Подтвердить e-mail', note: 'Ссылка действительна 24 часа. Если вы не создавали этот аккаунт, просто проигнорируйте письмо.' },
    tr: { subject: 'E-postanızı doğrulayın — Muslims.cc', intro: 'Muslims.cc hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:', button: 'E-postayı doğrula', note: 'Bağlantı 24 saat geçerlidir. Bu hesabı siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.' },
    ar: { subject: 'أكِّد بريدك الإلكتروني — Muslims.cc', intro: 'اضغط على الرابط أدناه لتأكيد حسابك في Muslims.cc:', button: 'تأكيد البريد', note: 'الرابط صالح لمدة 24 ساعة. إن لم تُنشئ هذا الحساب فتجاهل هذه الرسالة.' },
  },
  reset: {
    az: { subject: 'Şifrəni bərpa et — Muslims.cc', intro: 'Muslims.cc hesabınız üçün şifrə bərpası istənilib. Yeni şifrə qoymaq üçün keçidə basın:', button: 'Yeni şifrə qoy', note: 'Keçid 1 saat etibarlıdır. Bunu siz istəməmisinizsə, məktuba məhəl qoymayın — şifrəniz dəyişməyəcək.' },
    en: { subject: 'Reset your password — Muslims.cc', intro: 'A password reset was requested for your Muslims.cc account. Click the link to set a new password:', button: 'Set a new password', note: 'The link is valid for 1 hour. If you did not request this, ignore this email — your password will not change.' },
    ru: { subject: 'Сброс пароля — Muslims.cc', intro: 'Для вашего аккаунта Muslims.cc запрошен сброс пароля. Нажмите на ссылку, чтобы задать новый пароль:', button: 'Задать новый пароль', note: 'Ссылка действительна 1 час. Если вы этого не запрашивали, проигнорируйте письмо — пароль не изменится.' },
    tr: { subject: 'Şifrenizi sıfırlayın — Muslims.cc', intro: 'Muslims.cc hesabınız için şifre sıfırlama istendi. Yeni şifre belirlemek için bağlantıya tıklayın:', button: 'Yeni şifre belirle', note: 'Bağlantı 1 saat geçerlidir. Bunu siz istemediyseniz bu e-postayı yok sayın — şifreniz değişmeyecek.' },
    ar: { subject: 'إعادة تعيين كلمة المرور — Muslims.cc', intro: 'طُلبت إعادة تعيين كلمة المرور لحسابك في Muslims.cc. اضغط على الرابط لتعيين كلمة مرور جديدة:', button: 'تعيين كلمة مرور جديدة', note: 'الرابط صالح لمدة ساعة واحدة. إن لم تطلب ذلك فتجاهل الرسالة — لن تتغير كلمة المرور.' },
  },
  // Kimsə mövcud e-poçtla qeydiyyatdan keçməyə çalışdı (cavab hesabın varlığını açmasın deyə
  // ekranda "poçtunuzu yoxlayın" deyilir, sahibinə isə bu məktub gedir)
  exists: {
    az: { subject: 'Hesabınız artıq var — Muslims.cc', intro: 'Bu e-poçtla Muslims.cc-də yenidən qeydiyyat cəhdi olub. Hesabınız artıq var — daxil olun və ya şifrəni bərpa edin:', button: 'Daxil ol', note: 'Bunu siz etməmisinizsə, heç nə etməyin — hesabınız təhlükəsizdir.' },
    en: { subject: 'You already have an account — Muslims.cc', intro: 'Someone tried to sign up to Muslims.cc with this email. You already have an account — sign in or reset your password:', button: 'Sign in', note: 'If this was not you, no action is needed — your account is safe.' },
    ru: { subject: 'У вас уже есть аккаунт — Muslims.cc', intro: 'Кто-то пытался зарегистрироваться на Muslims.cc с этим e-mail. У вас уже есть аккаунт — войдите или сбросьте пароль:', button: 'Войти', note: 'Если это были не вы, ничего делать не нужно — ваш аккаунт в безопасности.' },
    tr: { subject: 'Zaten bir hesabınız var — Muslims.cc', intro: 'Biri bu e-postayla Muslims.cc\'ye kaydolmaya çalıştı. Zaten bir hesabınız var — giriş yapın veya şifrenizi sıfırlayın:', button: 'Giriş yap', note: 'Bu siz değilseniz bir şey yapmanıza gerek yok — hesabınız güvende.' },
    ar: { subject: 'لديك حساب بالفعل — Muslims.cc', intro: 'حاول أحدهم التسجيل في Muslims.cc بهذا البريد. لديك حساب بالفعل — سجّل الدخول أو أعد تعيين كلمة المرور:', button: 'تسجيل الدخول', note: 'إن لم تكن أنت فلا حاجة لأي إجراء — حسابك آمن.' },
  },
  // ── Şəxsi xatırlatmalar (server/personal.js) ──
  // Gələcək özünə məktub: istifadəçinin öz mətni (vars.body) sitat kimi
  letter: {
    az: { subject: 'Gələcək özünə məktub — Muslims.cc', intro: '{date} tarixində özünüzə bu məktubu yazmışdınız:', button: 'Məktublarıma bax', note: 'Bu məktubu Muslims.cc hesabınızda özünüz planlaşdırmısınız. Məktublarınızı hesab səhifəsində silə bilərsiniz.' },
    en: { subject: 'A letter to your future self — Muslims.cc', intro: 'On {date} you wrote this letter to yourself:', button: 'View my letters', note: 'You scheduled this letter yourself in your Muslims.cc account. You can delete your letters on your account page.' },
    ru: { subject: 'Письмо себе в будущее — Muslims.cc', intro: '{date} вы написали себе это письмо:', button: 'Мои письма', note: 'Вы сами запланировали это письмо в аккаунте Muslims.cc. Удалить письма можно на странице аккаунта.' },
    tr: { subject: 'Geleceğe mektup — Muslims.cc', intro: '{date} tarihinde kendinize bu mektubu yazmıştınız:', button: 'Mektuplarımı gör', note: 'Bu mektubu Muslims.cc hesabınızda kendiniz planladınız. Mektuplarınızı hesap sayfasında silebilirsiniz.' },
    ar: { subject: 'رسالة إلى نفسك في المستقبل — Muslims.cc', intro: 'في {date} كتبتَ لنفسك هذه الرسالة:', button: 'عرض رسائلي', note: 'جدولتَ هذه الرسالة بنفسك في حسابك على Muslims.cc. يمكنك حذف رسائلك من صفحة الحساب.' },
  },
  // Sevdiklərim — "ayda bir" xatırlatma (istifadəçinin seçdiyi gün; vəfat tarixinə BAĞLI DEYİL — ildönümü
  // məclisləri bidətdir). Dini mətn YOXDUR, yalnız xatırlatma; keçid saytdakı mənbəli duaya (cənazə dərsi, Müslim 963)
  lovedRemind: {
    az: { subject: '{name} üçün dua xatırlatması', intro: '{name} üçün dua etməyi unutmayın — bu, kiçik bir xatırlatmadır.', button: 'Mərhum üçün dua', note: 'Bu xatırlatmanı Muslims.cc hesabınızda "Sevdiklərim üçün dua" bölməsində qurmusunuz.', unsub: 'Bu xatırlatmaları e-poçtla almaq istəmirəm' },
    en: { subject: 'A reminder to make dua for {name}', intro: 'A reminder to make dua for {name}.', button: 'Dua for the deceased', note: 'You set up this reminder under "Prayers for loved ones" in your Muslims.cc account.', unsub: 'Stop these email reminders' },
    ru: { subject: 'Напоминание о дуа за {name}', intro: 'Напоминание сделать дуа за {name}.', button: 'Дуа за умершего', note: 'Вы настроили это напоминание в разделе «Дуа за близких» аккаунта Muslims.cc.', unsub: 'Не присылать эти напоминания по почте' },
    tr: { subject: '{name} için dua hatırlatması', intro: '{name} için dua etmeniz için bir hatırlatma.', button: 'Ölüye dua', note: 'Bu hatırlatmayı Muslims.cc hesabınızdaki "Sevdiklerim için dua" bölümünde kurdunuz.', unsub: 'Bu hatırlatmaları e-postayla almak istemiyorum' },
    ar: { subject: 'تذكير بالدعاء لـ{name}', intro: 'تذكير بالدعاء لـ{name}.', button: 'الدعاء للميت', note: 'أعددتَ هذا التذكير في قسم «الدعاء لأحبّتي» في حسابك على Muslims.cc.', unsub: 'إيقاف هذه التذكيرات بالبريد' },
  },
  friday: {
    az: { subject: 'Cümə — sevdikləriniz üçün dua', intro: 'Bu gün Cümədir. Sevdiklərinizi dualarınızda yad edin: {names}.', button: 'Mərhum üçün dua', note: 'Bu xatırlatmanı Muslims.cc hesabınızda "Sevdiklərim üçün dua" bölməsində qurmusunuz.', unsub: 'Bu xatırlatmaları e-poçtla almaq istəmirəm' },
    en: { subject: 'Friday — dua for your loved ones', intro: 'Today is Friday. Remember your loved ones in your duas: {names}.', button: 'Dua for the deceased', note: 'You set up this reminder under "Prayers for loved ones" in your Muslims.cc account.', unsub: 'Stop these email reminders' },
    ru: { subject: 'Пятница — дуа за близких', intro: 'Сегодня пятница. Вспомните своих близких в дуа: {names}.', button: 'Дуа за умершего', note: 'Вы настроили это напоминание в разделе «Дуа за близких» аккаунта Muslims.cc.', unsub: 'Не присылать эти напоминания по почте' },
    tr: { subject: 'Cuma — sevdikleriniz için dua', intro: 'Bugün Cuma. Sevdiklerinizi dualarınızda anın: {names}.', button: 'Ölüye dua', note: 'Bu hatırlatmayı Muslims.cc hesabınızdaki "Sevdiklerim için dua" bölümünde kurdunuz.', unsub: 'Bu hatırlatmaları e-postayla almak istemiyorum' },
    ar: { subject: 'الجمعة — الدعاء لأحبّتك', intro: 'اليوم الجمعة. اذكر أحبّتك في دعائك: {names}.', button: 'الدعاء للميت', note: 'أعددتَ هذا التذكير في قسم «الدعاء لأحبّتي» في حسابك على Muslims.cc.', unsub: 'إيقاف هذه التذكيرات بالبريد' },
  },
  zakatSoon: {
    az: { subject: 'Zəkat ilinizin tamamlanmasına 7 gün qalıb', intro: 'Zəkat iliniz (hövl) {date} tarixində tamamlanır. Malınızı yenidən hesablamaq vaxtıdır.', amount: 'Son hesablanmış zəkat: {amount}', button: 'Zəkatı hesabla', note: 'Bu xatırlatmanı Muslims.cc-nin zəkat səhifəsində qurmusunuz.', unsub: 'Zəkat xatırlatmasını dayandır' },
    en: { subject: 'Your zakat year completes in 7 days', intro: 'Your zakat year (hawl) completes on {date}. It is time to recalculate your wealth.', amount: 'Last calculated zakat: {amount}', button: 'Calculate zakat', note: 'You set up this reminder on the Muslims.cc zakat page.', unsub: 'Stop the zakat reminder' },
    ru: { subject: 'До завершения года закята — 7 дней', intro: 'Ваш год закята (хауль) завершается {date}. Пора заново рассчитать имущество.', amount: 'Последний расчёт закята: {amount}', button: 'Рассчитать закят', note: 'Вы настроили это напоминание на странице закята Muslims.cc.', unsub: 'Отключить напоминание о закяте' },
    tr: { subject: 'Zekât yılınızın dolmasına 7 gün kaldı', intro: 'Zekât yılınız (havl) {date} tarihinde doluyor. Malınızı yeniden hesaplama zamanı.', amount: 'Son hesaplanan zekât: {amount}', button: 'Zekâtı hesapla', note: 'Bu hatırlatmayı Muslims.cc zekât sayfasında kurdunuz.', unsub: 'Zekât hatırlatmasını durdur' },
    ar: { subject: 'بقي ٧ أيام على تمام حول زكاتك', intro: 'يتمّ حول زكاتك في {date}. حان وقت إعادة حساب مالك.', amount: 'آخر زكاة محسوبة: {amount}', button: 'احسب الزكاة', note: 'أعددتَ هذا التذكير في صفحة الزكاة على Muslims.cc.', unsub: 'إيقاف تذكير الزكاة' },
  },
  zakatDue: {
    az: { subject: 'Bu gün zəkat iliniz tamamlanır', intro: 'Bu gün ({date}) zəkat iliniz (hövl) tamamlanır. Malınız nisaba çatırsa, zəkatını hesablayıb verin.', amount: 'Son hesablanmış zəkat: {amount}', button: 'Zəkatı hesabla', note: 'Bu xatırlatmanı Muslims.cc-nin zəkat səhifəsində qurmusunuz.', unsub: 'Zəkat xatırlatmasını dayandır' },
    en: { subject: 'Your zakat year completes today', intro: 'Today ({date}) your zakat year (hawl) completes. If your wealth reaches the nisab, calculate and pay its zakat.', amount: 'Last calculated zakat: {amount}', button: 'Calculate zakat', note: 'You set up this reminder on the Muslims.cc zakat page.', unsub: 'Stop the zakat reminder' },
    ru: { subject: 'Сегодня завершается ваш год закята', intro: 'Сегодня ({date}) завершается ваш год закята (хауль). Если имущество достигает нисаба, рассчитайте и выплатите закят.', amount: 'Последний расчёт закята: {amount}', button: 'Рассчитать закят', note: 'Вы настроили это напоминание на странице закята Muslims.cc.', unsub: 'Отключить напоминание о закяте' },
    tr: { subject: 'Zekât yılınız bugün doluyor', intro: 'Bugün ({date}) zekât yılınız (havl) doluyor. Malınız nisaba ulaşıyorsa zekâtını hesaplayıp verin.', amount: 'Son hesaplanan zekât: {amount}', button: 'Zekâtı hesapla', note: 'Bu hatırlatmayı Muslims.cc zekât sayfasında kurdunuz.', unsub: 'Zekât hatırlatmasını durdur' },
    ar: { subject: 'اليوم يتمّ حول زكاتك', intro: 'اليوم ({date}) يتمّ حول زكاتك. إن بلغ مالك النصاب فاحسب زكاته وأخرجها.', amount: 'آخر زكاة محسوبة: {amount}', button: 'احسب الزكاة', note: 'أعددتَ هذا التذكير في صفحة الزكاة على Muslims.cc.', unsub: 'إيقاف تذكير الزكاة' },
  },
  // ── K5. Həftəlik hesabat (server/weekly.js) — {date}, {prayers}, {pages}, {dhikr}, {fasts}, {wird};
  //    dropEmpty: dəyəri olmayan sətir (məs. vird qurulmayıb) "details"-dən atılır ──
  weekly: {
    az: { subject: 'Həftəniz — Muslims.cc', intro: 'Bu, {date} tarixinə qədərki 7 günün qısa xülasəsidir. Allah qəbul etsin!', details: 'Qılınan namaz: {prayers} / 35\nQuran səhifəsi (təxmini): {pages}\nZikr: {dhikr}\nOruc günü: {fasts}\nVird tamamlanması: {wird}%', button: 'Hesabımı aç', note: 'Rəqəmlər cihazınızda hesablanıb və yalnız bu məktub üçün göndərilib. Həftəlik hesabatı Muslims.cc hesabınızda açmısınız.', unsub: 'Həftəlik hesabatı dayandır', dropEmpty: true },
    en: { subject: 'Your week — Muslims.cc', intro: 'Here is a short summary of the 7 days before {date}. May Allah accept it from you!', details: 'Prayers logged: {prayers} / 35\nQuran pages (approx.): {pages}\nDhikr: {dhikr}\nFasting days: {fasts}\nWird completed: {wird}%', button: 'Open my account', note: 'The numbers were calculated on your device and sent only for this email. You turned on the weekly summary in your Muslims.cc account.', unsub: 'Stop the weekly summary', dropEmpty: true },
    ru: { subject: 'Ваша неделя — Muslims.cc', intro: 'Краткий итог 7 дней до {date}. Да примет Аллах!', details: 'Отмечено намазов: {prayers} / 35\nСтраниц Корана (примерно): {pages}\nЗикр: {dhikr}\nДней поста: {fasts}\nВирд выполнен: {wird}%', button: 'Открыть аккаунт', note: 'Цифры посчитаны на вашем устройстве и отправлены только для этого письма. Вы включили еженедельный итог в аккаунте Muslims.cc.', unsub: 'Отключить еженедельный итог', dropEmpty: true },
    tr: { subject: 'Haftanız — Muslims.cc', intro: '{date} tarihinden önceki 7 günün kısa özeti. Allah kabul etsin!', details: 'Kılınan namaz: {prayers} / 35\nKur’an sayfası (yaklaşık): {pages}\nZikir: {dhikr}\nOruç günü: {fasts}\nVird tamamlama: %{wird}', button: 'Hesabımı aç', note: 'Rakamlar cihazınızda hesaplandı ve yalnızca bu e-posta için gönderildi. Haftalık özeti Muslims.cc hesabınızda açtınız.', unsub: 'Haftalık özeti durdur', dropEmpty: true },
    ar: { subject: 'أسبوعك — Muslims.cc', intro: 'هذا ملخّص قصير للأيام السبعة التي سبقت {date}. تقبّل الله منك!', details: 'الصلوات المسجّلة: {prayers} / 35\nصفحات القرآن (تقريبًا): {pages}\nالذكر: {dhikr}\nأيام الصيام: {fasts}\nإتمام الورد: {wird}%', button: 'افتح حسابي', note: 'حُسبت الأرقام على جهازك وأُرسلت لهذه الرسالة فقط. فعّلتَ الملخّص الأسبوعي في حسابك على Muslims.cc.', unsub: 'إيقاف الملخّص الأسبوعي', dropEmpty: true },
  },
  // ── Hesab təhlükəsizliyi (server/security.js) — {time}, {device}, {place}, {event}; düymə — "Bu mən deyildim" ──
  newSignIn: {
    az: { subject: 'Yeni cihazdan giriş — Muslims.cc', intro: 'Muslims.cc hesabınıza yeni cihazdan daxil olundu.', details: 'Vaxt: {time}\nCihaz: {device}\nTəxmini yer: {place}', button: 'Bu mən deyildim', note: 'Bu sizsinizsə, heç nə etməyin. Siz deyilsinizsə, düyməyə basın — bütün girişlər bağlanacaq və şifrəni yeniləmək üçün məktub göndəriləcək. Keçid 7 gün etibarlıdır.' },
    en: { subject: 'New sign-in from a new device — Muslims.cc', intro: 'Your Muslims.cc account was signed in to from a new device.', details: 'Time: {time}\nDevice: {device}\nApproximate location: {place}', button: 'This wasn’t me', note: 'If this was you, no action is needed. If not, press the button — all sessions will be signed out and we will email you a link to set a new password. The link is valid for 7 days.' },
    ru: { subject: 'Вход с нового устройства — Muslims.cc', intro: 'В ваш аккаунт Muslims.cc выполнен вход с нового устройства.', details: 'Время: {time}\nУстройство: {device}\nПримерное место: {place}', button: 'Это был не я', note: 'Если это были вы, ничего делать не нужно. Если нет, нажмите кнопку — все сеансы будут закрыты, и мы пришлём ссылку для нового пароля. Ссылка действует 7 дней.' },
    tr: { subject: 'Yeni bir cihazdan giriş — Muslims.cc', intro: 'Muslims.cc hesabınıza yeni bir cihazdan giriş yapıldı.', details: 'Zaman: {time}\nCihaz: {device}\nYaklaşık konum: {place}', button: 'Bu ben değildim', note: 'Bu sizseniz bir şey yapmanıza gerek yok. Değilseniz düğmeye basın — tüm oturumlar kapatılır ve yeni şifre için bir bağlantı gönderilir. Bağlantı 7 gün geçerlidir.' },
    ar: { subject: 'تسجيل دخول من جهاز جديد — Muslims.cc', intro: 'تم تسجيل الدخول إلى حسابك في Muslims.cc من جهاز جديد.', details: 'الوقت: {time}\nالجهاز: {device}\nالموقع التقريبي: {place}', button: 'لم أكن أنا', note: 'إن كنت أنت فلا حاجة لأي إجراء. وإلا فاضغط الزر — ستُغلق جميع الجلسات ونرسل إليك رابطًا لتعيين كلمة مرور جديدة. الرابط صالح لمدة 7 أيام.' },
  },
  securityChange: {
    az: { subject: 'Hesabınızda dəyişiklik: {event} — Muslims.cc', intro: 'Muslims.cc hesabınızda təhlükəsizlik dəyişikliyi oldu: {event}.', details: 'Vaxt: {time}\nCihaz: {device}\nTəxmini yer: {place}', button: 'Bu mən deyildim', note: 'Bunu siz etmisinizsə, heç nə etməyin. Siz deyilsinizsə, düyməyə basın — bütün girişlər bağlanacaq və şifrəni yeniləmək üçün məktub göndəriləcək.' },
    en: { subject: 'Account change: {event} — Muslims.cc', intro: 'A security change was made to your Muslims.cc account: {event}.', details: 'Time: {time}\nDevice: {device}\nApproximate location: {place}', button: 'This wasn’t me', note: 'If this was you, no action is needed. If not, press the button — all sessions will be signed out and we will email you a link to set a new password.' },
    ru: { subject: 'Изменение в аккаунте: {event} — Muslims.cc', intro: 'В вашем аккаунте Muslims.cc изменены настройки безопасности: {event}.', details: 'Время: {time}\nУстройство: {device}\nПримерное место: {place}', button: 'Это был не я', note: 'Если это были вы, ничего делать не нужно. Если нет, нажмите кнопку — все сеансы будут закрыты, и мы пришлём ссылку для нового пароля.' },
    tr: { subject: 'Hesap değişikliği: {event} — Muslims.cc', intro: 'Muslims.cc hesabınızda bir güvenlik değişikliği yapıldı: {event}.', details: 'Zaman: {time}\nCihaz: {device}\nYaklaşık konum: {place}', button: 'Bu ben değildim', note: 'Bunu siz yaptıysanız bir şey yapmanıza gerek yok. Değilseniz düğmeye basın — tüm oturumlar kapatılır ve yeni şifre için bir bağlantı gönderilir.' },
    ar: { subject: 'تغيير في الحساب: {event} — Muslims.cc', intro: 'جرى تغيير أمني في حسابك على Muslims.cc: {event}.', details: 'الوقت: {time}\nالجهاز: {device}\nالموقع التقريبي: {place}', button: 'لم أكن أنا', note: 'إن كنت أنت فلا حاجة لأي إجراء. وإلا فاضغط الزر — ستُغلق جميع الجلسات ونرسل إليك رابطًا لتعيين كلمة مرور جديدة.' },
  },
  // Admin paneli: yeni cihazdan giriş (e-poçtla bərpa yoxdur — şifrə və 2FA serverdə skriptlə)
  adminSignIn: {
    az: { subject: 'Admin panelinə yeni cihazdan giriş — Muslims.cc', intro: 'Muslims.cc admin panelindəki hesabınıza yeni cihazdan daxil olundu.', details: 'Vaxt: {time}\nCihaz: {device}\nTəxmini yer: {place}', button: 'Admin panelini aç', note: 'Siz deyilsinizsə: serverdə şifrəni dəyişin (admin-user.js set-password) — bu, bütün sessiyaları bağlayır — və iki addımlı yoxlamanı açın.' },
    en: { subject: 'Admin panel sign-in from a new device — Muslims.cc', intro: 'Your Muslims.cc admin panel account was signed in to from a new device.', details: 'Time: {time}\nDevice: {device}\nApproximate location: {place}', button: 'Open the admin panel', note: 'If this was not you: change the password on the server (admin-user.js set-password) — this signs out all sessions — and turn on two-step verification.' },
    ru: { subject: 'Вход в админ-панель с нового устройства — Muslims.cc', intro: 'В ваш аккаунт админ-панели Muslims.cc выполнен вход с нового устройства.', details: 'Время: {time}\nУстройство: {device}\nПримерное место: {place}', button: 'Открыть админ-панель', note: 'Если это были не вы: смените пароль на сервере (admin-user.js set-password) — это закроет все сеансы — и включите двухэтапную проверку.' },
    tr: { subject: 'Yönetim paneline yeni cihazdan giriş — Muslims.cc', intro: 'Muslims.cc yönetim paneli hesabınıza yeni bir cihazdan giriş yapıldı.', details: 'Zaman: {time}\nCihaz: {device}\nYaklaşık konum: {place}', button: 'Yönetim panelini aç', note: 'Bu siz değilseniz: sunucuda şifreyi değiştirin (admin-user.js set-password) — bu tüm oturumları kapatır — ve iki adımlı doğrulamayı açın.' },
    ar: { subject: 'دخول إلى لوحة الإدارة من جهاز جديد — Muslims.cc', intro: 'تم تسجيل الدخول إلى حسابك في لوحة إدارة Muslims.cc من جهاز جديد.', details: 'الوقت: {time}\nالجهاز: {device}\nالموقع التقريبي: {place}', button: 'فتح لوحة الإدارة', note: 'إن لم تكن أنت: غيّر كلمة المرور على الخادم (admin-user.js set-password) — وهذا يغلق جميع الجلسات — وفعّل التحقق بخطوتين.' },
  },
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const pickLang = (lang) => (LANGS.includes(lang) ? lang : 'en')

const URL_RE = /^https?:\/\/[^\s"'<>]+$/
/** "{name}" yer tutucuları; dəyişənlərdən idarə simvolları (başlıq inyeksiyası) atılır */
function fill(str, vars) {
  return String(str).replace(/\{(name|names|date|amount|time|device|place|event|prayers|pages|dhikr|fasts|wird)\}/g, (_, k) => {
    const v = vars[k]
    if (v == null) return ''
    return String(v).replace(/\p{Cc}/gu, ' ').slice(0, 2000)
  })
}

/**
 * Şablon → { subject, text, html, headers? }. vars.url — məktubdakı keçid (yalnız https/http).
 * Şəxsi xatırlatmalar üçün: vars.body (sitat), vars.unsubUrl (abunəlikdən çıxma keçidi) və yer tutucuları.
 * Köhnə şablonlarda (verify/reset/exists) yer tutucu yoxdur — nəticə əvvəlki ilə eynidir.
 */
function render(kind, lang, vars = {}) {
  if (kind === 'welcome') return renderWelcome(lang, vars)
  const tpl = T[kind]
  if (!tpl) throw new Error('unknown template')
  const l = pickLang(lang)
  const t = tpl[l]
  const safeUrl = URL_RE.test(String(vars.url || '')) ? String(vars.url) : ''
  const unsubUrl = URL_RE.test(String(vars.unsubUrl || '')) ? String(vars.unsubUrl) : ''
  const body = typeof vars.body === 'string' ? vars.body.slice(0, 8000) : ''
  const intro = fill(t.intro, vars)
  const amount = t.amount && vars.amount ? fill(t.amount, vars) : ''
  // dropEmpty (həftəlik hesabat): dəyəri olmayan yer tutuculu sətir atılır
  const details = !t.details ? '' : t.dropEmpty
    ? t.details.split('\n').filter((line) => [...line.matchAll(/\{(\w+)\}/g)].every((m) => vars[m[1]] != null && vars[m[1]] !== '')).map((line) => fill(line, vars)).join('\n')
    : fill(t.details, vars)
  const dir = l === 'ar' ? 'rtl' : 'ltr'
  const text = `${intro}\n\n` + (details ? `${details}\n\n` : '') + (body ? `${body}\n\n` : '') + (amount ? `${amount}\n\n` : '') +
    `${safeUrl}\n\n${t.note}\n\n— Muslims.cc` + (unsubUrl ? `\n\n${t.unsub}: ${unsubUrl}` : '')
  const html = `<!doctype html><html lang="${l}" dir="${dir}"><body style="margin:0;padding:24px;background:#f6f7f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2a24">` +
    `<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">` +
    `<p style="font-size:18px;font-weight:600;margin:0 0 16px">Muslims.cc</p>` +
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px">${esc(intro)}</p>` +
    (details ? `<p dir="auto" style="font-size:14px;line-height:1.7;margin:0 0 20px;padding:12px 16px;background:#f3f6f4;border-radius:8px;white-space:pre-line">${esc(details)}</p>` : '') +
    (body ? `<blockquote dir="auto" style="margin:0 0 20px;padding:16px 18px;background:#f3f6f4;border-inline-start:4px solid #0f6b4f;border-radius:8px;font-size:15px;line-height:1.7;white-space:pre-wrap">${esc(body)}</blockquote>` : '') +
    (amount ? `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;font-weight:600">${esc(amount)}</p>` : '') +
    (safeUrl ? `<p style="margin:0 0 20px"><a href="${esc(safeUrl)}" style="display:inline-block;background:#0f6b4f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${esc(t.button)}</a></p>` +
      `<p style="font-size:12px;color:#5b6b63;word-break:break-all;margin:0 0 20px">${esc(safeUrl)}</p>` : '') +
    `<p style="font-size:13px;color:#5b6b63;line-height:1.5;margin:0">${esc(t.note)}</p>` +
    (unsubUrl ? `<p style="font-size:12px;margin:16px 0 0"><a href="${esc(unsubUrl)}" style="color:#5b6b63">${esc(t.unsub)}</a></p>` : '') +
    `</div></body></html>`
  const out = { subject: fill(t.subject, vars), text, html }
  // RFC 8058: poçt proqramının "abunəlikdən çıx" düyməsi (POST, girişsiz)
  if (unsubUrl) out.headers = { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
  return out
}

// ═══════════════════════════════════════════════════════════════════════
// Xoş gəldin məktubu (server/welcome.js) — render('welcome', lang, { name, origin })
//   lang: az | en | ru | tr | ar | 'bi' (en + ar alt-alta; dili bilinməyən köhnə istifadəçilər üçün)
//   Cədvəl əsaslı, inline stillər, max 600px; başlıqda animasiyalı GIF (public/email/welcome-v1.gif,
//   scripts/build-welcome-gif.mjs). Keçidlər dilin prefiksi ilə (az — prefikssiz). İzləmə/UTM YOXDUR.
// ═══════════════════════════════════════════════════════════════════════
const WELCOME_IMG = '/email/welcome-v1.gif'
const WELCOME = {
  az: {
    subject: 'Muslims.cc-yə xoş gəlmisiniz', hello: 'Əssəlamu aleykum, {name}!', helloAnon: 'Əssəlamu aleykum!',
    thanks: 'Muslims.cc-yə qoşulduğunuz üçün təşəkkür edirik. Sizi burada görməyimizə şadıq.',
    start: 'Başlamaq üçün bir neçə yer:',
    cards: [
      { path: '/prayer', title: 'Namaz vaxtları', desc: 'Şəhəriniz üçün namaz vaxtları və azan xatırlatması', button: 'Namaz vaxtlarını aç' },
      { path: '/quran', title: 'Qurani-Kərim', desc: 'Tərcümə, qiraət və təfsirlə Quran', button: 'Quranı aç' },
      { path: '/whats-new', title: 'Yeniliklər', desc: 'Yeniliklər və saytla bir dəqiqəlik tanışlıq turu', button: 'Yeniliklərə bax' },
    ],
    sync: 'Hesabınız irəliləyişinizi (Quran oxunuşu, qeydlər, zikr) qoruyur və cihazlarınız arasında uçdan-uca şifrəli şəkildə sinxronlaşdırır.',
    only: 'Bu, sizə göndərdiyimiz yeganə məktubdur. Xatırlatmalar və həftəlik xülasə yalnız onları hesabınızda açsanız gələcək.',
    sign: '— Muslims.cc komandası',
    alt: 'Muslims.cc — səkkizguşəli ulduz və aypara',
  },
  en: {
    subject: 'Welcome to Muslims.cc', hello: 'Assalamu alaykum, {name}!', helloAnon: 'Assalamu alaykum!',
    thanks: 'Thank you for joining Muslims.cc. We’re glad you’re here.',
    start: 'A few places to start:',
    cards: [
      { path: '/prayer', title: 'Prayer times', desc: 'Prayer times for your city, with the adhan reminder', button: 'Open prayer times' },
      { path: '/quran', title: 'The Quran', desc: 'The Quran with translation, recitation and tafsir', button: 'Open the Quran' },
      { path: '/whats-new', title: 'What’s new', desc: 'What’s new, plus a one-minute tour of the site', button: 'See what’s new' },
    ],
    sync: 'Your account keeps your progress (Quran reading, notes, dhikr) safe and in sync across your devices, end-to-end encrypted.',
    only: 'This is the only email we send you. Reminders and the weekly summary arrive only if you turn them on in your account.',
    sign: '— The Muslims.cc team',
    alt: 'Muslims.cc — an eight-pointed star and a crescent',
  },
  ru: {
    subject: 'Добро пожаловать в Muslims.cc', hello: 'Ассаляму алейкум, {name}!', helloAnon: 'Ассаляму алейкум!',
    thanks: 'Спасибо, что присоединились к Muslims.cc. Мы рады, что вы с нами.',
    start: 'С чего начать:',
    cards: [
      { path: '/prayer', title: 'Время намаза', desc: 'Время намаза для вашего города с напоминанием об азане', button: 'Открыть время намаза' },
      { path: '/quran', title: 'Коран', desc: 'Коран с переводом, чтением и тафсиром', button: 'Открыть Коран' },
      { path: '/whats-new', title: 'Что нового', desc: 'Что нового на сайте и экскурсия по нему за одну минуту', button: 'Посмотреть новое' },
    ],
    sync: 'Ваш аккаунт сохраняет ваш прогресс (чтение Корана, заметки, зикр) и синхронизирует его между устройствами со сквозным шифрованием.',
    only: 'Это единственное письмо, которое мы вам отправляем. Напоминания и еженедельный итог приходят, только если вы включите их в аккаунте.',
    sign: '— Команда Muslims.cc',
    alt: 'Muslims.cc — восьмиконечная звезда и полумесяц',
  },
  tr: {
    subject: 'Muslims.cc’ye hoş geldiniz', hello: 'Esselâmü aleyküm, {name}!', helloAnon: 'Esselâmü aleyküm!',
    thanks: 'Muslims.cc’ye katıldığınız için teşekkür ederiz. Burada olmanıza sevindik.',
    start: 'Başlamak için birkaç yer:',
    cards: [
      { path: '/prayer', title: 'Namaz vakitleri', desc: 'Şehriniz için namaz vakitleri ve ezan hatırlatıcısı', button: 'Namaz vakitlerini aç' },
      { path: '/quran', title: 'Kur’an-ı Kerim', desc: 'Meal, tilavet ve tefsirle Kur’an-ı Kerim', button: 'Kur’an’ı aç' },
      { path: '/whats-new', title: 'Yenilikler', desc: 'Yenilikler ve bir dakikalık site turu', button: 'Yeniliklere bak' },
    ],
    sync: 'Hesabınız ilerlemenizi (Kur’an okuma, notlar, zikir) güvende tutar ve cihazlarınız arasında uçtan uca şifreli olarak eşitler.',
    only: 'Size gönderdiğimiz tek e-posta budur. Hatırlatmalar ve haftalık özet yalnızca hesabınızda açarsanız gelir.',
    sign: '— Muslims.cc ekibi',
    alt: 'Muslims.cc — sekiz köşeli yıldız ve hilal',
  },
  ar: {
    subject: 'أهلاً بك في Muslims.cc', hello: 'السلام عليكم، {name}!', helloAnon: 'السلام عليكم!',
    thanks: 'شكرًا لانضمامك إلى Muslims.cc، يسعدنا وجودك معنا.',
    start: 'من أين تبدأ:',
    cards: [
      { path: '/prayer', title: 'مواقيت الصلاة', desc: 'مواقيت الصلاة لمدينتك مع تذكير الأذان', button: 'افتح مواقيت الصلاة' },
      { path: '/quran', title: 'القرآن الكريم', desc: 'القرآن الكريم مع الترجمة والتلاوة والتفسير', button: 'افتح القرآن' },
      { path: '/whats-new', title: 'ما الجديد', desc: 'ما الجديد وجولة قصيرة في الموقع', button: 'اطّلع على الجديد' },
    ],
    sync: 'حسابك يحفظ تقدّمك (القراءة والملاحظات والأذكار) ويزامنه بين أجهزتك بتشفير تام.',
    only: 'هذه هي الرسالة الوحيدة التي نرسلها إليك؛ التذكيرات والملخص الأسبوعي تصلك فقط إذا فعّلتها من حسابك.',
    sign: '— فريق Muslims.cc',
    alt: 'Muslims.cc — نجمة ثمانية وهلال',
  },
}
const WELCOME_BI_SUBJECT = `${WELCOME.en.subject} · ${WELCOME.ar.subject}`
const ORIGIN_RE = /^https?:\/\/[a-z0-9.-]+(:\d+)?$/i
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const FONT_AR = "'Segoe UI',Tahoma,'Geeza Pro','Noto Naskh Arabic',Arial,sans-serif"
// Rənglər: tünd başlıq + açıq kart; qaranlıq rejimdə (Apple Mail, Outlook.com) <style> bloku əvəz edir,
// Gmail tətbiqinin məcburi inversiyasında da oxunaqlı qalır (saf ağ/qara yoxdur)
const C = { page: '#eef2ee', card: '#fbfcfa', ink: '#16241e', muted: '#4f6158', line: '#dfe7e1', tile: '#f1f6f2', brand: '#0f6b4f', gold: '#c99a3e', head: '#062a20' }

function welcomeCopy(l, name) {
  const t = WELCOME[l]
  const n = typeof name === 'string' ? name.replace(/[\p{Cc}‪-‮⁦-⁩]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) : ''
  // ərəbcə blokda latın adı düzgün yerləşsin — Unicode izolyasiyası (FSI … PDI)
  const hello = n ? t.hello.replace('{name}', l === 'ar' ? `⁨${n}⁩` : n) : t.helloAnon
  return { t, hello }
}

function welcomeLinks(l, origin) {
  const prefix = l === 'az' ? '' : '/' + l
  return WELCOME[l].cards.map((c) => ({ ...c, url: `${origin}${prefix}${c.path}` }))
}

function welcomeBlockHtml(l, origin, name) {
  const { t, hello } = welcomeCopy(l, name)
  const rtl = l === 'ar'
  const dir = rtl ? 'rtl' : 'ltr'
  const align = rtl ? 'right' : 'left'
  const font = rtl ? FONT_AR : FONT
  const accent = rtl ? 'border-right' : 'border-left'
  const p = (txt, extra = '') => `<p class="mcc-ink" style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${C.ink};${extra}">${esc(txt)}</p>`
  const cards = welcomeLinks(l, origin).map((c) =>
    `<tr><td style="padding:0 0 12px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mcc-tile" style="background:${C.tile};border-radius:10px;${accent}:4px solid ${C.gold}">` +
    `<tr><td dir="${dir}" style="padding:16px 18px;text-align:${align};font-family:${font}">` +
    `<p class="mcc-ink" style="margin:0 0 4px;font-size:17px;font-weight:700;line-height:1.4;color:${C.ink}">${esc(c.title)}</p>` +
    `<p class="mcc-muted" style="margin:0 0 14px;font-size:15px;line-height:1.5;color:${C.muted}">${esc(c.desc)}</p>` +
    // "bulletproof" düymə: rəng hüceyrədədir (Outlook şəkilsiz/CSS-siz də göstərir), keçid bütün sahəni tutur
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}"><tr>` +
    `<td bgcolor="${C.brand}" style="border-radius:8px;background:${C.brand}">` +
    `<a href="${esc(c.url)}" target="_blank" style="display:inline-block;padding:11px 20px;font-family:${font};font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:8px">${esc(c.button)}&nbsp;${rtl ? '&larr;' : '&rarr;'}</a>` +
    `</td></tr></table>` +
    `</td></tr></table></td></tr>`).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}" lang="${l}">` +
    `<tr><td dir="${dir}" style="padding:28px 28px 8px;text-align:${align};font-family:${font}">` +
    `<h1 class="mcc-ink" style="margin:0 0 12px;font-size:24px;line-height:1.3;font-weight:700;color:${C.ink}">${esc(hello)}</h1>` +
    p(t.thanks) +
    `<p class="mcc-muted" style="margin:8px 0 12px;font-size:13px;font-weight:700;letter-spacing:${rtl ? '0' : '0.06em'};text-transform:${rtl ? 'none' : 'uppercase'};color:${C.muted}">${esc(t.start)}</p>` +
    `</td></tr>` +
    `<tr><td style="padding:0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cards}</table></td></tr>` +
    `<tr><td dir="${dir}" style="padding:8px 28px 4px;text-align:${align};font-family:${font}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td width="28" valign="top" style="width:28px;padding-top:2px;font-size:18px;line-height:1;color:${C.gold}">&#9670;</td>` +
    `<td dir="${dir}" class="mcc-muted" style="font-size:15px;line-height:1.6;color:${C.muted};text-align:${align}">${esc(t.sync)}</td>` +
    `</tr></table></td></tr>` +
    `<tr><td dir="${dir}" style="padding:16px 28px 28px;text-align:${align};font-family:${font}">` +
    `<p class="mcc-muted" style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${C.muted}">${esc(t.only)}</p>` +
    `<p class="mcc-ink" style="margin:0;font-size:16px;font-weight:700;color:${C.ink}">${esc(t.sign)}</p>` +
    `</td></tr></table>`
}

function welcomeBlockText(l, origin, name) {
  const { t, hello } = welcomeCopy(l, name)
  const cards = welcomeLinks(l, origin).map((c) => `• ${c.title} — ${c.desc}\n  ${c.url}`).join('\n\n')
  return `${hello}\n\n${t.thanks}\n\n${t.start}\n\n${cards}\n\n${t.sync}\n\n${t.only}\n\n${t.sign}`
}

/** Xoş gəldin məktubu: lang — az|en|ru|tr|ar|'bi'; vars.name (ixtiyari), vars.origin (susmaya görə https://muslims.cc). */
function renderWelcome(lang, vars = {}) {
  const bi = lang === 'bi'
  const l = bi ? 'en' : pickLang(lang)
  const origin = ORIGIN_RE.test(String(vars.origin || '')) ? String(vars.origin).replace(/\/+$/, '') : 'https://muslims.cc'
  const name = vars.name
  const blocks = bi ? ['en', 'ar'] : [l]
  const subject = bi ? WELCOME_BI_SUBJECT : WELCOME[l].subject
  const pre = blocks.map((b) => WELCOME[b].thanks).join(' · ')
  const alt = blocks.map((b) => WELCOME[b].alt).join(' · ')
  const dir = !bi && l === 'ar' ? 'rtl' : 'ltr'
  const text = blocks.map((b) => welcomeBlockText(b, origin, name)).join('\n\n— — —\n\n') + `\n\n${origin}${l === 'az' && !bi ? '' : '/' + l}`
  const divider = `<tr><td style="padding:0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="mcc-line" style="border-top:1px solid ${C.line};font-size:0;line-height:0;height:1px">&nbsp;</td></tr></table></td></tr>`
  const body = blocks.map((b) => `<tr><td>${welcomeBlockHtml(b, origin, name)}</td></tr>`).join(divider)
  const home = `${origin}${!bi && l === 'az' ? '' : '/' + l}`
  const html = '<!doctype html>' +
    `<html lang="${l}" dir="${dir}" xmlns="http://www.w3.org/1999/xhtml"><head>` +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    `<title>${esc(subject)}</title>` +
    '<style>:root{color-scheme:light dark;supported-color-schemes:light dark}' +
    'body{margin:0;padding:0;-webkit-text-size-adjust:100%}img{border:0;outline:none;text-decoration:none}' +
    'a{text-decoration:none}' +
    '@media (prefers-color-scheme: dark){' +
    '.mcc-page{background:#0c1512!important}.mcc-card{background:#12211b!important}' +
    '.mcc-tile{background:#183128!important}.mcc-ink{color:#eef3ef!important}.mcc-muted{color:#b5c4bb!important}' +
    '.mcc-line{border-color:#264238!important}}' +
    '[data-ogsc] .mcc-ink{color:#eef3ef!important}[data-ogsc] .mcc-muted{color:#b5c4bb!important}' +
    '</style></head>' +
    `<body class="mcc-page" style="margin:0;padding:0;background:${C.page}">` +
    // önizləmə mətni (gizli)
    `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};opacity:0">${esc(pre)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mcc-page" style="background:${C.page}"><tr><td align="center" style="padding:16px 8px">` +
    '<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->' +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mcc-card" style="width:100%;max-width:600px;background:${C.card};border-radius:14px;overflow:hidden">` +
    `<tr><td style="padding:0;background:${C.head};line-height:0;font-size:0" bgcolor="${C.head}">` +
    `<a href="${esc(home)}" target="_blank"><img src="${esc(origin + WELCOME_IMG)}" width="600" height="220" alt="${esc(alt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;background:${C.head};color:#e8c16a;font-family:${FONT};font-size:22px;line-height:1.3"></a>` +
    `</td></tr>` +
    body +
    `<tr><td style="padding:14px 28px 18px;background:${C.head};text-align:center;font-family:${FONT};font-size:13px;line-height:1.5" bgcolor="${C.head}">` +
    `<a href="${esc(home)}" target="_blank" style="color:#e8c16a;text-decoration:none;font-weight:700">Muslims.cc</a>` +
    `</td></tr>` +
    '</table>' +
    '<!--[if mso]></td></tr></table><![endif]-->' +
    '</td></tr></table></body></html>'
  return { subject, text, html }
}

// ═══════════════════════════════════════════════════════════════════════
// Admin məktubu (server/mailCampaigns.js) — renderCampaign(lang, vars)
//   vars: { subject, body, ctaLabel?, ctaUrl?, header: 'gif'|'text', unsubUrl, origin?, test? }
//   Gövdə — DÜZ MƏTN + sadə işarələmə: boş sətir = abzas, sətir sonu = <br>, **qalın**,
//   [mətn](https://…) və çılpaq https://… keçidləri. Formadan gələn HTML HEÇ VAXT keçmir —
//   hər şey əvvəlcə escape olunur, işarələmə sonra tətbiq edilir. Yalnız https keçidləri
//   (istifadəçi adı/şifrəli URL — yox). Altlıq: "hesabınız olduğu üçün" + bir kliklə imtina
//   (List-Unsubscribe + List-Unsubscribe-Post başlıqları).
// ═══════════════════════════════════════════════════════════════════════
const CAMPAIGN_FOOT = {
  az: { reason: 'Bu məktubu Muslims.cc hesabınız olduğu üçün alırsınız.', unsub: 'Bu cür məktublardan imtina et' },
  en: { reason: 'You receive this because you have a Muslims.cc account.', unsub: 'Unsubscribe from these emails' },
  ru: { reason: 'Вы получили это письмо, потому что у вас есть аккаунт Muslims.cc.', unsub: 'Отписаться от таких писем' },
  tr: { reason: 'Bu e-postayı Muslims.cc hesabınız olduğu için alıyorsunuz.', unsub: 'Bu tür e-postalardan çık' },
  ar: { reason: 'تصلك هذه الرسالة لأن لديك حسابًا في Muslims.cc.', unsub: 'إلغاء الاشتراك في هذه الرسائل' },
}
// İdarə simvolları (\n-dən başqa) və bidi-override simvolları atılır (saxtakarlıq / başlıq inyeksiyası)
const cleanText = (s) => String(s == null ? '' : s).replace(/\r\n?/g, '\n').replace(/[‪-‮⁦-⁩]/g, '').replace(/[^\P{Cc}\n]/gu, ' ')
const cleanLine = (s) => cleanText(s).replace(/\s+/g, ' ').trim()

/** Yalnız https, istifadəçi adı/şifrəsiz, ≤ 500 simvol → normal URL | '' */
function safeHttpsUrl(u) {
  if (typeof u !== 'string' || u.length > 500 || !/^https:\/\//i.test(u)) return ''
  try {
    const x = new URL(u)
    if (x.protocol !== 'https:' || x.username || x.password || !x.hostname) return ''
    return x.href
  } catch { return '' }
}

const LINK_RE = /\[([^\]\n]{1,200})\]\((https:\/\/[^\s()<>"']{1,500})\)|(https:\/\/[^\s<>"'()]{1,500})/g
const boldHtml = (t) => esc(t).replace(/\*\*([^*\n]{1,500}?)\*\*/g, '<strong>$1</strong>')

function inlineHtml(s) {
  let out = '', last = 0
  for (const m of s.matchAll(LINK_RE)) {
    out += boldHtml(s.slice(last, m.index))
    let raw = m[1] ? m[2] : m[3], tail = ''
    if (!m[1]) { const t = /[.,;:!?]+$/.exec(raw); if (t) { tail = t[0]; raw = raw.slice(0, -tail.length) } }
    const href = safeHttpsUrl(raw)
    const label = m[1] || raw
    out += href ? `<a href="${esc(href)}" target="_blank" class="mcc-link" style="color:${C.brand};text-decoration:underline">${boldHtml(label)}</a>` : boldHtml(m[1] ? m[0] : raw)
    out += boldHtml(tail)
    last = m.index + m[0].length
  }
  return out + boldHtml(s.slice(last))
}

/** Düz mətn → abzaslar (sətirlər massivi) */
const paragraphs = (body) => cleanText(body).split(/\n[ \t]*\n+/).map((p) => p.replace(/^\n+|\n+$/g, '')).filter((p) => p.trim())

/** Gövdə → { html, text } (təhlükəsiz) */
function formatCampaignBody(body) {
  const paras = paragraphs(String(body || '').slice(0, 10000))
  const html = paras.map((p) => p.split('\n').map(inlineHtml).join('<br>'))
  const text = paras.map((p) => p
    .replace(/\[([^\]\n]{1,200})\]\((https:\/\/[^\s()<>"']{1,500})\)/g, (_, l, u) => (safeHttpsUrl(u) ? `${l} (${u})` : `${l}`))
    .replace(/\*\*([^*\n]{1,500}?)\*\*/g, '$1'))
  return { html, text }
}

function renderCampaign(lang, vars = {}) {
  const l = pickLang(lang)
  const rtl = l === 'ar'
  const dir = rtl ? 'rtl' : 'ltr'
  const align = rtl ? 'right' : 'left'
  const font = rtl ? FONT_AR : FONT
  const origin = ORIGIN_RE.test(String(vars.origin || '')) ? String(vars.origin).replace(/\/+$/, '') : 'https://muslims.cc'
  const home = `${origin}${l === 'az' ? '' : '/' + l}`
  const f = CAMPAIGN_FOOT[l]
  const subject = (vars.test ? '[Test] ' : '') + cleanLine(vars.subject).slice(0, 150)
  const body = formatCampaignBody(vars.body)
  const ctaLabel = cleanLine(vars.ctaLabel).slice(0, 60)
  const ctaUrl = ctaLabel ? safeHttpsUrl(String(vars.ctaUrl || '')) : ''
  const unsubUrl = URL_RE.test(String(vars.unsubUrl || '')) ? String(vars.unsubUrl) : ''
  const pre = body.text.join(' ').replace(/\s+/g, ' ').slice(0, 140)
  const header = vars.header === 'text'
    ? `<tr><td style="padding:26px 28px;background:${C.head};text-align:center;font-family:${FONT}" bgcolor="${C.head}">` +
      `<a href="${esc(home)}" target="_blank" style="color:#e8c16a;text-decoration:none;font-size:26px;font-weight:700;letter-spacing:0.02em">Muslims.cc</a></td></tr>`
    : `<tr><td style="padding:0;background:${C.head};line-height:0;font-size:0" bgcolor="${C.head}">` +
      `<a href="${esc(home)}" target="_blank"><img src="${esc(origin + WELCOME_IMG)}" width="600" height="220" alt="${esc(WELCOME[l].alt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;background:${C.head};color:#e8c16a;font-family:${FONT};font-size:22px;line-height:1.3"></a></td></tr>`
  const paras = body.html.map((h) => `<p class="mcc-ink" style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${C.ink}">${h}</p>`).join('')
  const cta = ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" style="margin:8px 0 8px"><tr>` +
      `<td bgcolor="${C.brand}" style="border-radius:8px;background:${C.brand}">` +
      `<a href="${esc(ctaUrl)}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:${font};font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:8px">${esc(ctaLabel)}&nbsp;${rtl ? '&larr;' : '&rarr;'}</a>` +
      `</td></tr></table>`
    : ''
  const html = '<!doctype html>' +
    `<html lang="${l}" dir="${dir}" xmlns="http://www.w3.org/1999/xhtml"><head>` +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">' +
    `<title>${esc(subject)}</title>` +
    '<style>:root{color-scheme:light dark;supported-color-schemes:light dark}' +
    'body{margin:0;padding:0;-webkit-text-size-adjust:100%}img{border:0;outline:none;text-decoration:none}' +
    '@media (prefers-color-scheme: dark){' +
    '.mcc-page{background:#0c1512!important}.mcc-card{background:#12211b!important}' +
    '.mcc-ink{color:#eef3ef!important}.mcc-muted{color:#b5c4bb!important}.mcc-link{color:#7fd3b0!important}' +
    '.mcc-line{border-color:#264238!important}}' +
    '[data-ogsc] .mcc-ink{color:#eef3ef!important}[data-ogsc] .mcc-muted{color:#b5c4bb!important}[data-ogsc] .mcc-link{color:#7fd3b0!important}' +
    '</style></head>' +
    `<body class="mcc-page" style="margin:0;padding:0;background:${C.page}">` +
    `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};opacity:0">${esc(pre)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mcc-page" style="background:${C.page}"><tr><td align="center" style="padding:16px 8px">` +
    '<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->' +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mcc-card" style="width:100%;max-width:600px;background:${C.card};border-radius:14px;overflow:hidden">` +
    header +
    `<tr><td dir="${dir}" lang="${l}" style="padding:28px 28px 12px;text-align:${align};font-family:${font}">` +
    `<h1 class="mcc-ink" style="margin:0 0 16px;font-size:22px;line-height:1.35;font-weight:700;color:${C.ink}">${esc(cleanLine(vars.subject).slice(0, 150))}</h1>` +
    paras + cta +
    `</td></tr>` +
    `<tr><td style="padding:0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="mcc-line" style="border-top:1px solid ${C.line};font-size:0;line-height:0;height:1px">&nbsp;</td></tr></table></td></tr>` +
    `<tr><td dir="${dir}" style="padding:14px 28px 22px;text-align:${align};font-family:${font}">` +
    `<p class="mcc-muted" style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${C.muted}">${esc(f.reason)}</p>` +
    (unsubUrl ? `<p style="margin:0;font-size:13px;line-height:1.5"><a href="${esc(unsubUrl)}" target="_blank" class="mcc-muted" style="color:${C.muted};text-decoration:underline">${esc(f.unsub)}</a></p>` : '') +
    `</td></tr>` +
    `<tr><td style="padding:14px 28px 18px;background:${C.head};text-align:center;font-family:${FONT};font-size:13px;line-height:1.5" bgcolor="${C.head}">` +
    `<a href="${esc(home)}" target="_blank" style="color:#e8c16a;text-decoration:none;font-weight:700">Muslims.cc</a></td></tr>` +
    '</table>' +
    '<!--[if mso]></td></tr></table><![endif]-->' +
    '</td></tr></table></body></html>'
  const text = `${cleanLine(vars.subject).slice(0, 150)}\n\n${body.text.join('\n\n')}` +
    (ctaUrl ? `\n\n${ctaLabel}: ${ctaUrl}` : '') +
    `\n\n— Muslims.cc\n${home}\n\n${f.reason}` + (unsubUrl ? `\n${f.unsub}: ${unsubUrl}` : '')
  const out = { subject, text, html }
  if (unsubUrl) out.headers = { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
  return out
}

/**
 * opts.apiKey   — RESEND_API_KEY (yoxdursa göndəriş sönülüdür)
 * opts.from     — göndərən (susmaya görə noreply@muslims.cc)
 * opts.fetchImpl — testlər üçün
 * opts.onMessage — açar YOXDURSA hər "göndərilən" məktub buna verilir (test qarmağı)
 */
function createMailer({ apiKey = process.env.RESEND_API_KEY, from = DEFAULT_FROM, fetchImpl = (...a) => fetch(...a), onMessage = null, log = console } = {}) {
  const enabled = Boolean(apiKey)
  let warned = false

  async function send({ to, subject, text, html, headers, kind = 'custom' }) {
    if (!enabled) {
      if (onMessage) { onMessage({ to, subject, text, html, kind, ...(headers ? { headers } : {}) }); return { ok: true, skipped: true } }
      if (!warned) { warned = true; log.warn('XƏBƏRDARLIQ: RESEND_API_KEY yoxdur — e-poçt göndərilmir (hesablar email_verified=0 qalır)') }
      return { ok: false, skipped: true }
    }
    try {
      const r = await fetchImpl(RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, html, ...(headers ? { headers } : {}) }),
        signal: AbortSignal.timeout(10000),
      })
      if (!r.ok) log.error(`mail ${kind}: Resend ${r.status}`)
      return { ok: r.ok }
    } catch (e) {
      log.error(`mail ${kind}: ${e && e.name}`)
      return { ok: false }
    }
  }

  return {
    enabled,
    send,
    /** Şablonla göndər. Xəta atmır (nəticə { ok }). onMessage qarmağı sinxron çağırılır. */
    sendTemplate(kind, lang, to, vars) {
      const m = render(kind, lang, vars)
      return send({ to, ...m, kind })
    },
  }
}

module.exports = { createMailer, render, renderWelcome, renderCampaign, formatCampaignBody, safeHttpsUrl, LANGS, RESEND_URL, WELCOME_IMG }
