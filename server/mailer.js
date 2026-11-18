// ═══════════════════════════════════════════════════════════════════════
// E-poçt göndərişi — Resend HTTP API (https://api.resend.com/emails), asılılıqsız
//
// • env RESEND_API_KEY yoxdursa: bir dəfə loga yazılır və heç nə göndərilmir
//   (hesablar işləyir, sadəcə email_verified=0 qalır). Testlər üçün
//   onMessage(msg) qarmağı — açar yoxdursa "göndərilən" məktubu ona verir.
// • Göndərən: noreply@muslims.cc (domen Resend-də təsdiqlənməlidir — docs/USER-ACCOUNTS.md).
// • Şablonlar: verify | reset | exists — 5 dil (az/en/ru/tr/ar), qalanları en.
//   Şəxsi xatırlatmalar (server/personal.js): letter | anniversary | friday | zakatSoon | zakatDue —
//   mətndə {name}, {n}, {names}, {date}, {amount} yer tutucuları; məktubun özü (vars.body) sitat
//   kimi; vars.unsubUrl varsa — altda "abunəlikdən çıx" keçidi + List-Unsubscribe başlıqları.
//   Hesab təhlükəsizliyi (server/security.js): newSignIn | securityChange | adminSignIn — {time},
//   {device}, {place}, {event}; "details" sətirləri ayrıca blokda.
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
  // Vəfat ildönümü — dini mətn YOXDUR, yalnız xatırlatma; keçid saytdakı mənbəli duaya (cənazə dərsi, Müslim 963)
  anniversary: {
    az: { subject: '{name} — ildönümü', intro: 'Bu gün {name} dünyasını dəyişməsinin {n} ili tamam olur. Onu dualarınızda yad edin.', button: 'Mərhum üçün dua', note: 'Bu xatırlatmanı Muslims.cc hesabınızda "Sevdiklərim üçün dua" bölməsində qurmusunuz.', unsub: 'Bu xatırlatmaları e-poçtla almaq istəmirəm' },
    en: { subject: '{name} — anniversary', intro: 'Today is the {n} anniversary of the passing of {name}. Remember them in your duas.', button: 'Dua for the deceased', note: 'You set up this reminder under "Prayers for loved ones" in your Muslims.cc account.', unsub: 'Stop these email reminders' },
    ru: { subject: '{name} — годовщина', intro: 'Сегодня {n}-я годовщина ухода {name}. Вспомните его в своих дуа.', button: 'Дуа за умершего', note: 'Вы настроили это напоминание в разделе «Дуа за близких» аккаунта Muslims.cc.', unsub: 'Не присылать эти напоминания по почте' },
    tr: { subject: '{name} — yıl dönümü', intro: 'Bugün {name} vefatının {n}. yıl dönümü. Onu dualarınızda anın.', button: 'Ölüye dua', note: 'Bu hatırlatmayı Muslims.cc hesabınızdaki "Sevdiklerim için dua" bölümünde kurdunuz.', unsub: 'Bu hatırlatmaları e-postayla almak istemiyorum' },
    ar: { subject: '{name} — ذكرى الوفاة', intro: 'اليوم تمرّ الذكرى السنوية رقم {n} لوفاة {name}. اذكره في دعائك.', button: 'الدعاء للميت', note: 'أعددتَ هذا التذكير في قسم «الدعاء لأحبّتي» في حسابك على Muslims.cc.', unsub: 'إيقاف هذه التذكيرات بالبريد' },
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
/** İngiliscə sıra sayı: 1st, 2nd, 3rd, 11th … */
const ordinalEn = (n) => {
  const a = n % 10, b = n % 100
  return `${n}${a === 1 && b !== 11 ? 'st' : a === 2 && b !== 12 ? 'nd' : a === 3 && b !== 13 ? 'rd' : 'th'}`
}
/** "{name}" yer tutucuları; dəyişənlərdən idarə simvolları (başlıq inyeksiyası) atılır */
function fill(str, vars, l) {
  return String(str).replace(/\{(name|n|names|date|amount|time|device|place|event)\}/g, (_, k) => {
    let v = vars[k]
    if (v == null) return ''
    if (k === 'n' && l === 'en') v = ordinalEn(Number(v))
    return String(v).replace(/\p{Cc}/gu, ' ').slice(0, 2000)
  })
}

/**
 * Şablon → { subject, text, html, headers? }. vars.url — məktubdakı keçid (yalnız https/http).
 * Şəxsi xatırlatmalar üçün: vars.body (sitat), vars.unsubUrl (abunəlikdən çıxma keçidi) və yer tutucuları.
 * Köhnə şablonlarda (verify/reset/exists) yer tutucu yoxdur — nəticə əvvəlki ilə eynidir.
 */
function render(kind, lang, vars = {}) {
  const tpl = T[kind]
  if (!tpl) throw new Error('unknown template')
  const l = pickLang(lang)
  const t = tpl[l]
  const safeUrl = URL_RE.test(String(vars.url || '')) ? String(vars.url) : ''
  const unsubUrl = URL_RE.test(String(vars.unsubUrl || '')) ? String(vars.unsubUrl) : ''
  const body = typeof vars.body === 'string' ? vars.body.slice(0, 8000) : ''
  const intro = fill(t.intro, vars, l)
  const amount = t.amount && vars.amount ? fill(t.amount, vars, l) : ''
  const details = t.details ? fill(t.details, vars, l) : ''
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
  const out = { subject: fill(t.subject, vars, l), text, html }
  // RFC 8058: poçt proqramının "abunəlikdən çıx" düyməsi (POST, girişsiz)
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

module.exports = { createMailer, render, LANGS, RESEND_URL }
