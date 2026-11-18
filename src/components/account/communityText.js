// ═══════════════════════════════════════════════════════
// K mərhələsi yazıları (5 dil; əlavə dillər — uiText lüğəti ilə ingiliscədən):
//   PP  — hesab: "Açıq profil" (server/publicProfile.js)
//   WK  — hesab: "Həftəlik hesabat" (server/weekly.js)
//   MR  — hesab: məscid nümayəndəsinin paneli (server/mosqueRep.js)
//   FD  — ailə dairəsi: dua siyahısı (server/familyDua.js)
//   DW  — /dua-wall səhifəsi (server/duaWall.js)
//   PUB — /u/<ləqəb> səhifəsi
// Dini mətn yoxdur — yalnız interfeys.
// ═══════════════════════════════════════════════════════

// Açıq profildə yalnız ÖYRƏNMƏ möhürləri (sahibin qərarı, 2026-11-18): ibadət sayı / ibadət möhürü
// (xətm, sübh 40, zikr, Kəhf, ümmət xətmi) göstərilmir — server/publicProfile.js ilə eyni siyahı
export const PUBLIC_STAMP_IDS = ['names_99', 'hijra', 'sahaba', 'arabic', 'hifz_surah']
// Açıq profildə ola biləcək sahələr (ibadət sayı yoxdur)
export const PUBLIC_FIELDS = ['displayName', 'kunya', 'stamps', 'bio', 'favSurah']
// Server xətasının kodu — kiçik faylda (xətm səhifəsi bu böyük faylı yükləməsin)
export { apiErrCode } from './verifyEmailText.js'

export const PP = {
  az: {
    title: 'Açıq profil', lead: 'Susmaya görə bağlıdır. Açsanız, yalnız seçdiyiniz məlumat ünvanınızda hər kəsə görünür. İzləyici sayı, müqayisə və reytinq yoxdur.',
    enable: 'Açıq profil', handle: 'Ləqəb (ünvan)', handleHint: '3–24 simvol: kiçik latın hərfi, rəqəm və «_».', check: 'Yoxla',
    free: 'Bu ləqəb boşdur.', taken: 'Bu ləqəb artıq tutulub.', reserved: 'Bu ləqəb ayrılıb — başqasını seçin.', badHandle: 'Ləqəb qaydalara uyğun deyil.',
    show: 'Nə göstərilsin', fields: { displayName: 'Ad', kunya: 'Künyə', stamps: 'Öyrənmə möhürləri (səyahət kitabçası)', bio: 'Qısa bio', favSurah: 'Sevimli surə' },
    name: 'Göstəriləcək ad', bio: 'Bio (ən çox 160 simvol, keçidsiz)', surah: 'Surənin nömrəsi (1–114)', noStamps: 'Hələ möhür yoxdur.', noKunya: 'Künyə qurulmayıb.',
    index: 'Axtarış sistemlərinə icazə ver', indexHint: 'Susmaya görə səhifə axtarışda görünmür.',
    consent: 'Seçdiyim məlumatın serverdə açıq saxlanmasına və ünvanımda hər kəsə göstərilməsinə razıyam. İstənilən vaxt bağlaya və ya silə bilərəm.',
    consentNeed: 'Davam etmək üçün razılıq qutusunu işarələyin.', save: 'Yadda saxla', saved: 'Yadda saxlanıldı.', view: 'Səhifəyə bax',
    remove: 'Açıq profili sil', removed: 'Açıq profil silindi.', confirm: 'Əminsiniz?', yes: 'Bəli', cancel: 'Ləğv et',
    moderated: 'Nəzarətçi bu profili gizlədib.',
    worshipNote: 'İbadət sizinlə Allah arasındadır — ona görə burada göstərilmir.',
    failed: 'Alınmadı. Yenidən cəhd edin.',
  },
  en: {
    title: 'Public profile', lead: 'Off by default. If you turn it on, only what you choose is shown to everyone at your address. No follower counts, comparisons or rankings.',
    enable: 'Public profile', handle: 'Handle (address)', handleHint: '3–24 characters: lowercase Latin letters, digits and “_”.', check: 'Check',
    free: 'This handle is free.', taken: 'This handle is already taken.', reserved: 'This handle is reserved — please choose another.', badHandle: 'The handle does not follow the rules.',
    show: 'What to show', fields: { displayName: 'Name', kunya: 'Kunya', stamps: 'Learning stamps (journey passport)', bio: 'Short bio', favSurah: 'Favourite surah' },
    name: 'Name to show', bio: 'Bio (up to 160 characters, no links)', surah: 'Surah number (1–114)', noStamps: 'No stamps yet.', noKunya: 'No kunya set.',
    index: 'Allow search engines', indexHint: 'By default the page does not appear in search.',
    consent: 'I agree that the information I choose is stored unencrypted on the server and shown to everyone at my address. I can turn it off or delete it at any time.',
    consentNeed: 'Tick the consent box to continue.', save: 'Save', saved: 'Saved.', view: 'View page',
    remove: 'Delete public profile', removed: 'Public profile deleted.', confirm: 'Are you sure?', yes: 'Yes', cancel: 'Cancel',
    moderated: 'A moderator has hidden this profile.',
    worshipNote: 'Worship stays between you and Allah, so it is not shown.',
    failed: 'That did not work. Please try again.',
  },
  ru: {
    title: 'Открытый профиль', lead: 'По умолчанию выключен. Если включить, по вашему адресу всем видно только то, что вы выбрали. Нет счётчиков подписчиков, сравнений и рейтингов.',
    enable: 'Открытый профиль', handle: 'Ник (адрес)', handleHint: '3–24 символа: строчные латинские буквы, цифры и «_».', check: 'Проверить',
    free: 'Этот ник свободен.', taken: 'Этот ник уже занят.', reserved: 'Этот ник зарезервирован — выберите другой.', badHandle: 'Ник не соответствует правилам.',
    show: 'Что показывать', fields: { displayName: 'Имя', kunya: 'Кунья', stamps: 'Штампы учёбы (паспорт пути)', bio: 'Коротко о себе', favSurah: 'Любимая сура' },
    name: 'Отображаемое имя', bio: 'О себе (до 160 символов, без ссылок)', surah: 'Номер суры (1–114)', noStamps: 'Штампов пока нет.', noKunya: 'Кунья не задана.',
    index: 'Разрешить поисковым системам', indexHint: 'По умолчанию страница не появляется в поиске.',
    consent: 'Я согласен, что выбранные мной данные хранятся на сервере в открытом виде и показываются всем по моему адресу. Я могу в любой момент выключить или удалить их.',
    consentNeed: 'Отметьте согласие, чтобы продолжить.', save: 'Сохранить', saved: 'Сохранено.', view: 'Открыть страницу',
    remove: 'Удалить открытый профиль', removed: 'Открытый профиль удалён.', confirm: 'Вы уверены?', yes: 'Да', cancel: 'Отмена',
    moderated: 'Модератор скрыл этот профиль.',
    worshipNote: 'Поклонение остаётся между вами и Аллахом, поэтому оно здесь не показывается.',
    failed: 'Не получилось. Попробуйте ещё раз.',
  },
  tr: {
    title: 'Açık profil', lead: 'Varsayılan olarak kapalıdır. Açarsanız adresinizde herkese yalnızca seçtikleriniz görünür. Takipçi sayısı, karşılaştırma ve sıralama yoktur.',
    enable: 'Açık profil', handle: 'Kullanıcı adı (adres)', handleHint: '3–24 karakter: küçük Latin harfi, rakam ve «_».', check: 'Kontrol et',
    free: 'Bu kullanıcı adı boş.', taken: 'Bu kullanıcı adı alınmış.', reserved: 'Bu kullanıcı adı ayrılmış — başka birini seçin.', badHandle: 'Kullanıcı adı kurallara uymuyor.',
    show: 'Ne gösterilsin', fields: { displayName: 'Ad', kunya: 'Künye', stamps: 'Öğrenme mühürleri (yolculuk pasaportu)', bio: 'Kısa biyografi', favSurah: 'Sevdiğiniz sure' },
    name: 'Gösterilecek ad', bio: 'Biyografi (en çok 160 karakter, bağlantısız)', surah: 'Sure numarası (1–114)', noStamps: 'Henüz mühür yok.', noKunya: 'Künye ayarlanmadı.',
    index: 'Arama motorlarına izin ver', indexHint: 'Varsayılan olarak sayfa aramada görünmez.',
    consent: 'Seçtiğim bilgilerin sunucuda şifresiz saklanmasını ve adresimde herkese gösterilmesini kabul ediyorum. İstediğim zaman kapatabilir veya silebilirim.',
    consentNeed: 'Devam etmek için onay kutusunu işaretleyin.', save: 'Kaydet', saved: 'Kaydedildi.', view: 'Sayfayı gör',
    remove: 'Açık profili sil', removed: 'Açık profil silindi.', confirm: 'Emin misiniz?', yes: 'Evet', cancel: 'Vazgeç',
    moderated: 'Bir moderatör bu profili gizledi.',
    worshipNote: 'İbadet sizinle Allah arasındadır, bu yüzden burada gösterilmez.',
    failed: 'Olmadı. Lütfen tekrar deneyin.',
  },
  ar: {
    title: 'الملف العام', lead: 'مغلق افتراضيًا. إن فعّلته يظهر للجميع على عنوانك ما تختاره فقط. لا عدد متابعين ولا مقارنات ولا ترتيب.',
    enable: 'الملف العام', handle: 'اسم المستخدم (العنوان)', handleHint: 'من 3 إلى 24 رمزًا: حروف لاتينية صغيرة وأرقام و«_».', check: 'تحقّق',
    free: 'اسم المستخدم متاح.', taken: 'اسم المستخدم محجوز لغيرك.', reserved: 'هذا الاسم محجوز — اختر غيره.', badHandle: 'اسم المستخدم لا يوافق القواعد.',
    show: 'ما الذي يظهر', fields: { displayName: 'الاسم', kunya: 'الكنية', stamps: 'أختام التعلّم (جواز الرحلة)', bio: 'نبذة قصيرة', favSurah: 'السورة المفضّلة' },
    name: 'الاسم الظاهر', bio: 'نبذة (حتى 160 حرفًا، بلا روابط)', surah: 'رقم السورة (1–114)', noStamps: 'لا أختام بعد.', noKunya: 'لم تُحدَّد كنية.',
    index: 'السماح لمحركات البحث', indexHint: 'افتراضيًا لا تظهر الصفحة في البحث.',
    consent: 'أوافق على حفظ المعلومات التي أختارها على الخادم دون تشفير وعرضها للجميع على عنواني. يمكنني إيقافها أو حذفها في أي وقت.',
    consentNeed: 'ضع علامة الموافقة للمتابعة.', save: 'حفظ', saved: 'تم الحفظ.', view: 'عرض الصفحة',
    remove: 'حذف الملف العام', removed: 'حُذف الملف العام.', confirm: 'هل أنت متأكد؟', yes: 'نعم', cancel: 'إلغاء',
    moderated: 'أخفى أحد المشرفين هذا الملف.',
    worshipNote: 'العبادة بينك وبين الله، لذلك لا تُعرض هنا.',
    failed: 'لم ينجح ذلك. حاول مرة أخرى.',
  },
}

export const WK = {
  az: {
    title: 'Həftəlik hesabat', lead: 'Hər həftə seçdiyiniz gün saat 09:00-da (öz saat qurşağınızda) e-poçtla qısa xülasə: namaz, Quran, zikr, oruc, vird.',
    enable: 'Həftəlik hesabatı e-poçtla göndər', weekday: 'Hesabat günü', days: ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'],
    consent: 'Həftənin 5 rəqəmi bu cihazda hesablanır və məktub üçün serverimizdə şifrəsiz saxlanır (120 gün). İstənilən vaxt söndürə və silə bilərəm.',
    consentNeed: 'Davam etmək üçün razılıq qutusunu işarələyin.', save: 'Yadda saxla', saved: 'Yadda saxlanıldı.', next: 'Növbəti hesabat:',
    skipNote: 'Həmin həftə bu cihazlardan heç biri açılmasa, rəqəm göndərilmir və məktub da getmir.',
    unverified: 'Məktub yalnız təsdiqlənmiş e-poçta gedir — əvvəlcə e-poçtunuzu təsdiqləyin.',
    preview: 'Bu həftə (indiyə qədər)', prayers: 'Namaz', pages: 'Quran səhifəsi (təxmini)', dhikr: 'Zikr', fasts: 'Oruc günü', wird: 'Vird', noWird: 'vird qurulmayıb',
    wipe: 'Hesabat məlumatını sil', wiped: 'Silindi.', confirm: 'Əminsiniz?', yes: 'Bəli', cancel: 'Ləğv et', failed: 'Alınmadı. Yenidən cəhd edin.',
  },
  en: {
    title: 'Weekly report', lead: 'Every week on the day you choose, at 09:00 in your time zone, a short email summary: prayers, Quran, dhikr, fasting, wird.',
    enable: 'Email me a weekly report', weekday: 'Report day', days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    consent: 'The week’s 5 numbers are calculated on this device and stored unencrypted on our server for the email (120 days). I can turn it off and delete it at any time.',
    consentNeed: 'Tick the consent box to continue.', save: 'Save', saved: 'Saved.', next: 'Next report:',
    skipNote: 'If none of your devices opens the site that week, no numbers are sent and no email goes out.',
    unverified: 'The email only goes to a confirmed address — please confirm your email first.',
    preview: 'This week (so far)', prayers: 'Prayers', pages: 'Quran pages (approx.)', dhikr: 'Dhikr', fasts: 'Fasting days', wird: 'Wird', noWird: 'no wird set up',
    wipe: 'Delete report data', wiped: 'Deleted.', confirm: 'Are you sure?', yes: 'Yes', cancel: 'Cancel', failed: 'That did not work. Please try again.',
  },
  ru: {
    title: 'Еженедельный отчёт', lead: 'Каждую неделю в выбранный день в 09:00 по вашему времени — короткий итог на почту: намаз, Коран, зикр, пост, вирд.',
    enable: 'Присылать еженедельный отчёт на почту', weekday: 'День отчёта', days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    consent: 'Пять цифр недели считаются на этом устройстве и хранятся на сервере в открытом виде для письма (120 дней). Я могу в любой момент выключить и удалить их.',
    consentNeed: 'Отметьте согласие, чтобы продолжить.', save: 'Сохранить', saved: 'Сохранено.', next: 'Следующий отчёт:',
    skipNote: 'Если за неделю сайт не открывался ни на одном устройстве, цифры не отправляются и письма не будет.',
    unverified: 'Письмо уходит только на подтверждённый адрес — сначала подтвердите почту.',
    preview: 'Эта неделя (пока)', prayers: 'Намазы', pages: 'Страниц Корана (примерно)', dhikr: 'Зикр', fasts: 'Дней поста', wird: 'Вирд', noWird: 'вирд не настроен',
    wipe: 'Удалить данные отчёта', wiped: 'Удалено.', confirm: 'Вы уверены?', yes: 'Да', cancel: 'Отмена', failed: 'Не получилось. Попробуйте ещё раз.',
  },
  tr: {
    title: 'Haftalık rapor', lead: 'Her hafta seçtiğiniz gün, kendi saat diliminizde 09:00’da e-postayla kısa özet: namaz, Kur’an, zikir, oruç, vird.',
    enable: 'Haftalık raporu e-postayla gönder', weekday: 'Rapor günü', days: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    consent: 'Haftanın 5 rakamı bu cihazda hesaplanır ve e-posta için sunucumuzda şifresiz saklanır (120 gün). İstediğim zaman kapatıp silebilirim.',
    consentNeed: 'Devam etmek için onay kutusunu işaretleyin.', save: 'Kaydet', saved: 'Kaydedildi.', next: 'Sonraki rapor:',
    skipNote: 'O hafta cihazlarınızın hiçbiri siteyi açmazsa rakam gönderilmez ve e-posta da gitmez.',
    unverified: 'E-posta yalnızca onaylanmış adrese gider — önce e-postanızı onaylayın.',
    preview: 'Bu hafta (şimdiye kadar)', prayers: 'Namaz', pages: 'Kur’an sayfası (yaklaşık)', dhikr: 'Zikir', fasts: 'Oruç günü', wird: 'Vird', noWird: 'vird ayarlanmadı',
    wipe: 'Rapor verilerini sil', wiped: 'Silindi.', confirm: 'Emin misiniz?', yes: 'Evet', cancel: 'Vazgeç', failed: 'Olmadı. Lütfen tekrar deneyin.',
  },
  ar: {
    title: 'التقرير الأسبوعي', lead: 'كل أسبوع في اليوم الذي تختاره، الساعة 09:00 بتوقيتك، ملخّص قصير بالبريد: الصلاة والقرآن والذكر والصيام والورد.',
    enable: 'أرسل لي تقريرًا أسبوعيًا بالبريد', weekday: 'يوم التقرير', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    consent: 'تُحسب أرقام الأسبوع الخمسة على هذا الجهاز وتُحفظ على خادمنا دون تشفير لأجل الرسالة (120 يومًا). يمكنني إيقافها وحذفها في أي وقت.',
    consentNeed: 'ضع علامة الموافقة للمتابعة.', save: 'حفظ', saved: 'تم الحفظ.', next: 'التقرير القادم:',
    skipNote: 'إن لم يُفتح الموقع على أي من أجهزتك في ذلك الأسبوع فلا تُرسل أرقام ولا رسالة.',
    unverified: 'تُرسل الرسالة إلى بريد مؤكَّد فقط — أكّد بريدك أولًا.',
    preview: 'هذا الأسبوع (حتى الآن)', prayers: 'الصلوات', pages: 'صفحات القرآن (تقريبًا)', dhikr: 'الذكر', fasts: 'أيام الصيام', wird: 'الورد', noWird: 'لم يُضبط ورد',
    wipe: 'حذف بيانات التقرير', wiped: 'تم الحذف.', confirm: 'هل أنت متأكد؟', yes: 'نعم', cancel: 'إلغاء', failed: 'لم ينجح ذلك. حاول مرة أخرى.',
  },
}

export const MR = {
  az: {
    title: 'Məscidim — nümayəndə paneli', lead: 'Təsdiqlənmiş nümayəndə kimi məscidinizin iqamə vaxtlarını, Cümə xütbəsini, elanlarını və iftar proqramını idarə edin. Məscid ekranı bu məlumatı özü yeniləyir.',
    noMosque: 'Hesabınıza hələ məscid bağlanmayıb. Sayt idarəsi ilə əlaqə saxlayın.', mosqueId: 'Məscidin ID-si',
    name: 'Məscidin adı (ekranda)', iqama: 'İqamə vaxtları', offset: 'Azandan sonra (dəq.)', fixed: 'Sabit saat', none: 'Göstərmə',
    prayers: { fajr: 'Sübh', dhuhr: 'Zöhr', asr: 'Əsr', maghrib: 'Məğrib', isha: 'İşa' },
    jumuah: 'Cümə xütbəsi', jTime: 'Vaxt', jTopic: 'Mövzu (ən çox 120 simvol)', ramadan: 'Ramazan iftar proqramı (ən çox 500 simvol)',
    save: 'Yadda saxla', saved: 'Yadda saxlanıldı — ekranlar bir dəqiqə ərzində yenilənir.',
    ann: 'Elanlar', annBody: 'Elan mətni (ən çox 500 simvol, keçidsiz)', annUntil: 'Son gün', annAdd: 'Elan əlavə et', annNone: 'Aktiv elan yoxdur.', until: 'son gün', del: 'Sil',
    tv: 'Məscid ekranının linki', tvHint: 'Bu linki məsciddəki televizorun brauzerində açın — vaxtlar və elanlar avtomatik gələcək.', copy: 'Kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    failed: 'Alınmadı. Dəyərləri yoxlayın.',
  },
  en: {
    title: 'My mosque — representative panel', lead: 'As a verified representative, manage your mosque’s iqamah times, Friday khutbah, announcements and iftar programme. The mosque display updates itself.',
    noMosque: 'No mosque is linked to your account yet. Please contact the site team.', mosqueId: 'Mosque ID',
    name: 'Mosque name (on the display)', iqama: 'Iqamah times', offset: 'After the adhan (min)', fixed: 'Fixed time', none: 'Do not show',
    prayers: { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    jumuah: 'Friday khutbah', jTime: 'Time', jTopic: 'Topic (up to 120 characters)', ramadan: 'Ramadan iftar programme (up to 500 characters)',
    save: 'Save', saved: 'Saved — displays update within a minute.',
    ann: 'Announcements', annBody: 'Announcement text (up to 500 characters, no links)', annUntil: 'Last day', annAdd: 'Add announcement', annNone: 'No active announcements.', until: 'last day', del: 'Delete',
    tv: 'Mosque display link', tvHint: 'Open this link in the browser of the TV at the mosque — times and announcements will arrive automatically.', copy: 'Copy', copied: 'Copied', share: 'Share',
    failed: 'That did not work. Please check the values.',
  },
  ru: {
    title: 'Моя мечеть — панель представителя', lead: 'Как подтверждённый представитель управляйте временем икамы, пятничной хутбой, объявлениями и программой ифтара. Экран мечети обновляется сам.',
    noMosque: 'К вашему аккаунту пока не привязана мечеть. Свяжитесь с командой сайта.', mosqueId: 'ID мечети',
    name: 'Название мечети (на экране)', iqama: 'Время икамы', offset: 'После азана (мин)', fixed: 'Точное время', none: 'Не показывать',
    prayers: { fajr: 'Фаджр', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' },
    jumuah: 'Пятничная хутба', jTime: 'Время', jTopic: 'Тема (до 120 символов)', ramadan: 'Программа ифтаров в Рамадан (до 500 символов)',
    save: 'Сохранить', saved: 'Сохранено — экраны обновятся в течение минуты.',
    ann: 'Объявления', annBody: 'Текст объявления (до 500 символов, без ссылок)', annUntil: 'Последний день', annAdd: 'Добавить объявление', annNone: 'Активных объявлений нет.', until: 'до', del: 'Удалить',
    tv: 'Ссылка на экран мечети', tvHint: 'Откройте эту ссылку в браузере телевизора в мечети — время и объявления придут автоматически.', copy: 'Копировать', copied: 'Скопировано', share: 'Поделиться',
    failed: 'Не получилось. Проверьте значения.',
  },
  tr: {
    title: 'Camim — temsilci paneli', lead: 'Onaylı temsilci olarak caminizin ikamet vakitlerini, Cuma hutbesini, duyurularını ve iftar programını yönetin. Cami ekranı kendini günceller.',
    noMosque: 'Hesabınıza henüz bir cami bağlanmadı. Site ekibiyle iletişime geçin.', mosqueId: 'Cami kimliği',
    name: 'Caminin adı (ekranda)', iqama: 'İkamet vakitleri', offset: 'Ezandan sonra (dk)', fixed: 'Sabit saat', none: 'Gösterme',
    prayers: { fajr: 'Sabah', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
    jumuah: 'Cuma hutbesi', jTime: 'Saat', jTopic: 'Konu (en çok 120 karakter)', ramadan: 'Ramazan iftar programı (en çok 500 karakter)',
    save: 'Kaydet', saved: 'Kaydedildi — ekranlar bir dakika içinde güncellenir.',
    ann: 'Duyurular', annBody: 'Duyuru metni (en çok 500 karakter, bağlantısız)', annUntil: 'Son gün', annAdd: 'Duyuru ekle', annNone: 'Etkin duyuru yok.', until: 'son gün', del: 'Sil',
    tv: 'Cami ekranı bağlantısı', tvHint: 'Bu bağlantıyı camideki televizyonun tarayıcısında açın — vakitler ve duyurular kendiliğinden gelir.', copy: 'Kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    failed: 'Olmadı. Değerleri kontrol edin.',
  },
  ar: {
    title: 'مسجدي — لوحة الممثّل', lead: 'بصفتك ممثّلًا موثّقًا، أدِر أوقات الإقامة وخطبة الجمعة والإعلانات وبرنامج الإفطار لمسجدك. تتحدّث شاشة المسجد تلقائيًا.',
    noMosque: 'لم يُربط أي مسجد بحسابك بعد. تواصل مع فريق الموقع.', mosqueId: 'معرّف المسجد',
    name: 'اسم المسجد (على الشاشة)', iqama: 'أوقات الإقامة', offset: 'بعد الأذان (دقيقة)', fixed: 'وقت ثابت', none: 'لا تُظهر',
    prayers: { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    jumuah: 'خطبة الجمعة', jTime: 'الوقت', jTopic: 'الموضوع (حتى 120 حرفًا)', ramadan: 'برنامج الإفطار في رمضان (حتى 500 حرف)',
    save: 'حفظ', saved: 'تم الحفظ — تتحدّث الشاشات خلال دقيقة.',
    ann: 'الإعلانات', annBody: 'نص الإعلان (حتى 500 حرف، بلا روابط)', annUntil: 'آخر يوم', annAdd: 'أضف إعلانًا', annNone: 'لا إعلانات نشطة.', until: 'حتى', del: 'حذف',
    tv: 'رابط شاشة المسجد', tvHint: 'افتح هذا الرابط في متصفح تلفاز المسجد — ستصل الأوقات والإعلانات تلقائيًا.', copy: 'نسخ', copied: 'تم النسخ', share: 'مشاركة',
    failed: 'لم ينجح ذلك. راجع القيم.',
  },
}

export const FD = {
  az: {
    title: 'Ailə dua siyahısı', lead: 'Ailənizdən dua istəyin — yalnız bu dairənin üzvləri görür. Dua edən toxunur, siz yalnız sayı görürsünüz.',
    ph: 'Məsələn: sabahkı imtahanım üçün dua edin', post: 'Dua istə', none: 'Hələ dua istəyi yoxdur.',
    prayed: 'Sizin üçün dua etdim', prayedDone: 'Dua etdiniz', count: (n) => `${n} nəfər dua etdi`,
    answered: 'Qəbul olundu', markAnswered: 'Qəbul olundu kimi işarələ', unmark: 'İşarəni götür', del: 'Sil', report: 'Dairə sahibinə bildir', reported: 'Bildirildi',
    flags: (n) => `${n} bildiriş`, you: 'siz', confirm: 'Əminsiniz?', yes: 'Bəli', cancel: 'Ləğv et', failed: 'Alınmadı. Yenidən cəhd edin.', limit: 'Bu gün üçün hədd dolub.',
  },
  en: {
    title: 'Family dua list', lead: 'Ask your family for dua — only members of this circle can see it. Those who make dua tap a button; you only see the count.',
    ph: 'For example: please make dua for my exam tomorrow', post: 'Ask for dua', none: 'No dua requests yet.',
    prayed: 'I made dua for you', prayedDone: 'You made dua', count: (n) => (n === 1 ? '1 person made dua' : `${n} people made dua`),
    answered: 'Answered', markAnswered: 'Mark as answered', unmark: 'Remove mark', del: 'Delete', report: 'Tell the circle owner', reported: 'Reported',
    flags: (n) => `Reported: ${n}`, you: 'you', confirm: 'Are you sure?', yes: 'Yes', cancel: 'Cancel', failed: 'That did not work. Please try again.', limit: 'Today’s limit has been reached.',
  },
  ru: {
    title: 'Семейный список дуа', lead: 'Попросите семью о дуа — видят только участники этого круга. Кто сделал дуа, нажимает кнопку; вы видите только число.',
    ph: 'Например: сделайте дуа за мой завтрашний экзамен', post: 'Попросить дуа', none: 'Просьб о дуа пока нет.',
    prayed: 'Я сделал за вас дуа', prayedDone: 'Вы сделали дуа', count: (n) => `Сделали дуа: ${n}`,
    answered: 'Принято', markAnswered: 'Отметить как принятое', unmark: 'Снять отметку', del: 'Удалить', report: 'Сообщить владельцу круга', reported: 'Отправлено',
    flags: (n) => `Жалоб: ${n}`, you: 'вы', confirm: 'Вы уверены?', yes: 'Да', cancel: 'Отмена', failed: 'Не получилось. Попробуйте ещё раз.', limit: 'Лимит на сегодня исчерпан.',
  },
  tr: {
    title: 'Aile dua listesi', lead: 'Ailenizden dua isteyin — yalnızca bu çemberin üyeleri görür. Dua eden bir düğmeye dokunur; siz yalnızca sayıyı görürsünüz.',
    ph: 'Örneğin: yarınki sınavım için dua edin', post: 'Dua iste', none: 'Henüz dua isteği yok.',
    prayed: 'Senin için dua ettim', prayedDone: 'Dua ettiniz', count: (n) => `${n} kişi dua etti`,
    answered: 'Kabul oldu', markAnswered: 'Kabul oldu olarak işaretle', unmark: 'İşareti kaldır', del: 'Sil', report: 'Çember sahibine bildir', reported: 'Bildirildi',
    flags: (n) => `${n} bildirim`, you: 'siz', confirm: 'Emin misiniz?', yes: 'Evet', cancel: 'Vazgeç', failed: 'Olmadı. Lütfen tekrar deneyin.', limit: 'Bugünün sınırı doldu.',
  },
  ar: {
    title: 'قائمة دعاء العائلة', lead: 'اطلب الدعاء من عائلتك — لا يراه إلا أعضاء هذه الدائرة. من يدعو يضغط زرًّا، وأنت ترى العدد فقط.',
    ph: 'مثلًا: ادعوا لي في امتحان الغد', post: 'اطلب الدعاء', none: 'لا طلبات دعاء بعد.',
    prayed: 'دعوتُ لك', prayedDone: 'دعوتَ', count: (n) => `دعا ${n}`,
    answered: 'استُجيب', markAnswered: 'علّمه مستجابًا', unmark: 'أزل العلامة', del: 'حذف', report: 'أبلغ صاحب الدائرة', reported: 'تم الإبلاغ',
    flags: (n) => `بلاغات: ${n}`, you: 'أنت', confirm: 'هل أنت متأكد؟', yes: 'نعم', cancel: 'إلغاء', failed: 'لم ينجح ذلك. حاول مرة أخرى.', limit: 'بلغت حدّ اليوم.',
  },
}

export const DW = {
  az: {
    eyebrow: 'Ümmət', title: 'Dua divarı', lead: 'Dua istəyinizi yazın — nəzarətçi baxandan sonra divarda görünür və müsəlmanlar sizin üçün dua edir. Adınız yalnız özünüz yazsanız görünür.',
    rulesTitle: 'Qaydalar', rules: ['Yalnız dua istəyi: xəstəlik, imtahan, ailə, hidayət…', 'Keçid, telefon, e-poçt və başqasının şəxsi məlumatı olmasın', 'Hörmətli dil; reklam yoxdur', 'Hər istək nəzarətçinin təsdiqindən sonra 30 gün görünür', 'Gündə ən çox 3 istək'],
    formTitle: 'Dua istə', body: 'Dua istəyiniz (10–300 simvol)', name: 'Ad (istəyə bağlı)', nameHint: 'Boş qalsa, "Anonim" görünür. Yalnız ad yazın — soyad və əlaqə məlumatı yox.',
    lang: 'Dil', submit: 'Göndər', sent: 'Göndərildi. Nəzarətçi baxandan sonra divarda görünəcək.', login: 'Dua istəmək üçün hesabınıza daxil olun.', loginBtn: 'Daxil ol',
    mine: 'İstəklərim', status: { pending: 'Baxılır', approved: 'Divarda', rejected: 'Qəbul olunmadı', expired: 'Müddəti bitib' },
    reasons: { personal_info: 'şəxsi məlumat var', not_dua: 'dua istəyi deyil', inappropriate: 'uyğunsuz mətn', duplicate: 'təkrar', commercial: 'reklam', other: 'başqa səbəb' },
    del: 'Sil', wall: 'Divar', all: 'Bütün dillər', onlyLang: 'Yalnız bu dil', empty: 'Divar hələ boşdur — ilk dua istəyini siz yazın.', emptyWrite: 'İstək yaz', anon: 'Anonim', more: 'Daha çox',
    pray: 'Dua etdim', prayed: 'Dua etdiniz', count: (n) => `${n} dua`, report: 'Şikayət et', reportReasons: { inappropriate: 'Uyğunsuz', personal_info: 'Şəxsi məlumat', spam: 'Lazımsız reklam', other: 'Başqa' },
    reportSend: 'Göndər', reported: 'Təşəkkürlər — nəzarətçi baxacaq.', cancel: 'Ləğv et',
    err: { too_short: 'Mətn çox qısadır.', links_not_allowed: 'Keçid, sayt ünvanı və e-poçt olmamalıdır.', personal_info: 'Telefon nömrəsi və şəxsi məlumat yazmayın.', not_allowed: 'Bu mətn qəbul olunmadı.', bad_name: 'Adda yalnız hərflər olsun.', daily_limit: 'Bu gün üçün 3 istək həddi dolub.', generic: 'Alınmadı. Yenidən cəhd edin.' },
  },
  en: {
    eyebrow: 'Ummah', title: 'Dua wall', lead: 'Write your dua request — after a moderator reviews it, it appears on the wall and Muslims make dua for you. Your name only shows if you write it yourself.',
    rulesTitle: 'Rules', rules: ['Dua requests only: illness, exams, family, guidance…', 'No links, phone numbers, emails or anyone’s personal details', 'Respectful language; no advertising', 'Each request is shown for 30 days after a moderator approves it', 'Up to 3 requests a day'],
    formTitle: 'Ask for dua', body: 'Your dua request (10–300 characters)', name: 'Name (optional)', nameHint: 'If empty, “Anonymous” is shown. First name only — no surname or contact details.',
    lang: 'Language', submit: 'Send', sent: 'Sent. It will appear on the wall after a moderator reviews it.', login: 'Sign in to your account to ask for dua.', loginBtn: 'Sign in',
    mine: 'My requests', status: { pending: 'In review', approved: 'On the wall', rejected: 'Not accepted', expired: 'Expired' },
    reasons: { personal_info: 'contains personal details', not_dua: 'not a dua request', inappropriate: 'inappropriate text', duplicate: 'duplicate', commercial: 'advertising', other: 'other reason' },
    del: 'Delete', wall: 'Wall', all: 'All languages', onlyLang: 'This language only', empty: 'The wall is still empty — be the first to write a dua request.', emptyWrite: 'Write a request', anon: 'Anonymous', more: 'Load more',
    pray: 'I made dua', prayed: 'You made dua', count: (n) => (n === 1 ? '1 person made dua' : `${n} people made dua`), report: 'Report', reportReasons: { inappropriate: 'Inappropriate', personal_info: 'Personal details', spam: 'Spam', other: 'Other' },
    reportSend: 'Send', reported: 'Thank you — a moderator will review it.', cancel: 'Cancel',
    err: { too_short: 'The text is too short.', links_not_allowed: 'Links, domains and emails are not allowed.', personal_info: 'Please do not write phone numbers or personal details.', not_allowed: 'This text was not accepted.', bad_name: 'The name should contain letters only.', daily_limit: 'You have reached today’s limit of 3 requests.', generic: 'That did not work. Please try again.' },
  },
  ru: {
    eyebrow: 'Умма', title: 'Стена дуа', lead: 'Напишите просьбу о дуа — после проверки модератором она появится на стене, и мусульмане сделают за вас дуа. Имя видно, только если вы сами его укажете.',
    rulesTitle: 'Правила', rules: ['Только просьбы о дуа: болезнь, экзамен, семья, наставление…', 'Без ссылок, телефонов, почты и чужих личных данных', 'Уважительный язык; без рекламы', 'Каждая просьба видна 30 дней после одобрения модератором', 'Не больше 3 просьб в день'],
    formTitle: 'Попросить дуа', body: 'Ваша просьба (10–300 символов)', name: 'Имя (необязательно)', nameHint: 'Если пусто, показывается «Аноним». Только имя — без фамилии и контактов.',
    lang: 'Язык', submit: 'Отправить', sent: 'Отправлено. Появится на стене после проверки модератором.', login: 'Войдите в аккаунт, чтобы попросить дуа.', loginBtn: 'Войти',
    mine: 'Мои просьбы', status: { pending: 'На проверке', approved: 'На стене', rejected: 'Не принято', expired: 'Срок истёк' },
    reasons: { personal_info: 'есть личные данные', not_dua: 'это не просьба о дуа', inappropriate: 'неуместный текст', duplicate: 'повтор', commercial: 'реклама', other: 'другая причина' },
    del: 'Удалить', wall: 'Стена', all: 'Все языки', onlyLang: 'Только этот язык', empty: 'Стена пока пуста — напишите первую просьбу о дуа.', emptyWrite: 'Написать просьбу', anon: 'Аноним', more: 'Показать ещё',
    pray: 'Я сделал дуа', prayed: 'Вы сделали дуа', count: (n) => `Дуа: ${n}`, report: 'Пожаловаться', reportReasons: { inappropriate: 'Неуместно', personal_info: 'Личные данные', spam: 'Спам', other: 'Другое' },
    reportSend: 'Отправить', reported: 'Спасибо — модератор проверит.', cancel: 'Отмена',
    err: { too_short: 'Текст слишком короткий.', links_not_allowed: 'Ссылки, домены и почта запрещены.', personal_info: 'Не пишите номера телефонов и личные данные.', not_allowed: 'Этот текст не принят.', bad_name: 'В имени должны быть только буквы.', daily_limit: 'Лимит 3 просьбы на сегодня исчерпан.', generic: 'Не получилось. Попробуйте ещё раз.' },
  },
  tr: {
    eyebrow: 'Ümmet', title: 'Dua duvarı', lead: 'Dua isteğinizi yazın — bir moderatör inceledikten sonra duvarda görünür ve Müslümanlar sizin için dua eder. Adınız yalnızca kendiniz yazarsanız görünür.',
    rulesTitle: 'Kurallar', rules: ['Yalnızca dua isteği: hastalık, sınav, aile, hidayet…', 'Bağlantı, telefon, e-posta ve başkasının kişisel bilgisi olmasın', 'Saygılı dil; reklam yok', 'Her istek moderatör onayından sonra 30 gün görünür', 'Günde en çok 3 istek'],
    formTitle: 'Dua iste', body: 'Dua isteğiniz (10–300 karakter)', name: 'Ad (isteğe bağlı)', nameHint: 'Boş kalırsa “Anonim” görünür. Yalnızca ad — soyad ve iletişim bilgisi yok.',
    lang: 'Dil', submit: 'Gönder', sent: 'Gönderildi. Moderatör inceledikten sonra duvarda görünecek.', login: 'Dua istemek için hesabınıza giriş yapın.', loginBtn: 'Giriş yap',
    mine: 'İsteklerim', status: { pending: 'İnceleniyor', approved: 'Duvarda', rejected: 'Kabul edilmedi', expired: 'Süresi doldu' },
    reasons: { personal_info: 'kişisel bilgi var', not_dua: 'dua isteği değil', inappropriate: 'uygunsuz metin', duplicate: 'tekrar', commercial: 'reklam', other: 'başka sebep' },
    del: 'Sil', wall: 'Duvar', all: 'Tüm diller', onlyLang: 'Yalnızca bu dil', empty: 'Duvar henüz boş — ilk dua isteğini siz yazın.', emptyWrite: 'İstek yaz', anon: 'Anonim', more: 'Daha fazla',
    pray: 'Dua ettim', prayed: 'Dua ettiniz', count: (n) => `${n} dua`, report: 'Şikâyet et', reportReasons: { inappropriate: 'Uygunsuz', personal_info: 'Kişisel bilgi', spam: 'İstenmeyen ileti', other: 'Diğer' },
    reportSend: 'Gönder', reported: 'Teşekkürler — moderatör inceleyecek.', cancel: 'Vazgeç',
    err: { too_short: 'Metin çok kısa.', links_not_allowed: 'Bağlantı, alan adı ve e-posta olmamalı.', personal_info: 'Telefon numarası ve kişisel bilgi yazmayın.', not_allowed: 'Bu metin kabul edilmedi.', bad_name: 'Adda yalnızca harf olsun.', daily_limit: 'Bugün için 3 istek sınırı doldu.', generic: 'Olmadı. Lütfen tekrar deneyin.' },
  },
  ar: {
    eyebrow: 'الأمة', title: 'جدار الدعاء', lead: 'اكتب طلب دعائك — يظهر على الجدار بعد مراجعة المشرف، ويدعو لك المسلمون. لا يظهر اسمك إلا إن كتبته بنفسك.',
    rulesTitle: 'القواعد', rules: ['طلبات الدعاء فقط: مرض، امتحان، أسرة، هداية…', 'بلا روابط ولا أرقام هواتف ولا بريد ولا بيانات شخصية لأحد', 'لغة محترمة، وبلا إعلانات', 'يظهر كل طلب 30 يومًا بعد موافقة المشرف', '3 طلبات في اليوم على الأكثر'],
    formTitle: 'اطلب الدعاء', body: 'طلب دعائك (من 10 إلى 300 حرف)', name: 'الاسم (اختياري)', nameHint: 'إن تُرك فارغًا يظهر «مجهول». الاسم الأول فقط — بلا لقب ولا وسيلة تواصل.',
    lang: 'اللغة', submit: 'إرسال', sent: 'أُرسل. سيظهر على الجدار بعد مراجعة المشرف.', login: 'سجّل الدخول إلى حسابك لتطلب الدعاء.', loginBtn: 'تسجيل الدخول',
    mine: 'طلباتي', status: { pending: 'قيد المراجعة', approved: 'على الجدار', rejected: 'لم يُقبل', expired: 'انتهت مدّته' },
    reasons: { personal_info: 'فيه بيانات شخصية', not_dua: 'ليس طلب دعاء', inappropriate: 'نص غير لائق', duplicate: 'مكرّر', commercial: 'إعلان', other: 'سبب آخر' },
    del: 'حذف', wall: 'الجدار', all: 'كل اللغات', onlyLang: 'هذه اللغة فقط', empty: 'الجدار ما زال فارغًا — كن أول من يكتب طلب دعاء.', emptyWrite: 'اكتب طلبًا', anon: 'مجهول', more: 'المزيد',
    pray: 'دعوتُ', prayed: 'دعوتَ', count: (n) => `دعاء: ${n}`, report: 'إبلاغ', reportReasons: { inappropriate: 'غير لائق', personal_info: 'بيانات شخصية', spam: 'رسائل مزعجة', other: 'أخرى' },
    reportSend: 'إرسال', reported: 'شكرًا — سيراجعه المشرف.', cancel: 'إلغاء',
    err: { too_short: 'النص قصير جدًا.', links_not_allowed: 'لا يُسمح بالروابط والنطاقات والبريد.', personal_info: 'لا تكتب أرقام الهواتف أو البيانات الشخصية.', not_allowed: 'لم يُقبل هذا النص.', bad_name: 'يجب أن يحتوي الاسم على حروف فقط.', daily_limit: 'بلغت حدّ اليوم وهو 3 طلبات.', generic: 'لم ينجح ذلك. حاول مرة أخرى.' },
  },
}

export const PUB = {
  az: { eyebrow: 'Açıq profil', stamps: 'Möhürlər', fav: 'Sevimli surə', surah: (n) => `${n}-ci surə`, report: 'Şikayət et', reasons: { spam: 'Lazımsız reklam', offensive: 'Təhqiramiz', impersonation: 'Başqasını təqlid', personal_info: 'Şəxsi məlumat', other: 'Başqa' }, send: 'Göndər', cancel: 'Ləğv et', reported: 'Təşəkkürlər — nəzarətçi baxacaq.', login: 'Şikayət üçün daxil olun', note: 'Bu səhifəni istifadəçi özü açıb və nəyin görünəcəyini özü seçib.', loading: 'Yüklənir…' },
  en: { eyebrow: 'Public profile', stamps: 'Stamps', fav: 'Favourite surah', surah: (n) => `Surah ${n}`, report: 'Report', reasons: { spam: 'Spam', offensive: 'Offensive', impersonation: 'Impersonation', personal_info: 'Personal details', other: 'Other' }, send: 'Send', cancel: 'Cancel', reported: 'Thank you — a moderator will review it.', login: 'Sign in to report', note: 'The user opened this page and chose what it shows.', loading: 'Loading…' },
  ru: { eyebrow: 'Открытый профиль', stamps: 'Штампы', fav: 'Любимая сура', surah: (n) => `Сура ${n}`, report: 'Пожаловаться', reasons: { spam: 'Спам', offensive: 'Оскорбление', impersonation: 'Выдаёт себя за другого', personal_info: 'Личные данные', other: 'Другое' }, send: 'Отправить', cancel: 'Отмена', reported: 'Спасибо — модератор проверит.', login: 'Войдите, чтобы пожаловаться', note: 'Эту страницу открыл сам пользователь и сам выбрал, что на ней видно.', loading: 'Загрузка…' },
  tr: { eyebrow: 'Açık profil', stamps: 'Mühürler', fav: 'Sevdiği sure', surah: (n) => `${n}. sure`, report: 'Şikâyet et', reasons: { spam: 'İstenmeyen ileti', offensive: 'Saldırgan', impersonation: 'Başkasını taklit', personal_info: 'Kişisel bilgi', other: 'Diğer' }, send: 'Gönder', cancel: 'Vazgeç', reported: 'Teşekkürler — moderatör inceleyecek.', login: 'Şikâyet için giriş yapın', note: 'Bu sayfayı kullanıcı kendisi açtı ve neyin görüneceğini kendisi seçti.', loading: 'Yükleniyor…' },
  ar: { eyebrow: 'الملف العام', stamps: 'الأختام', fav: 'السورة المفضّلة', surah: (n) => `السورة ${n}`, report: 'إبلاغ', reasons: { spam: 'رسائل مزعجة', offensive: 'مسيء', impersonation: 'انتحال شخصية', personal_info: 'بيانات شخصية', other: 'أخرى' }, send: 'إرسال', cancel: 'إلغاء', reported: 'شكرًا — سيراجعه المشرف.', login: 'سجّل الدخول للإبلاغ', note: 'فتح المستخدم هذه الصفحة بنفسه واختار ما يظهر فيها.', loading: 'جارٍ التحميل…' },
}

