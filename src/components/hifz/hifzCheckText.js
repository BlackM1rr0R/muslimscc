// ═══════════════════════════════════════════════════════
// "Məni yoxla" yazıları (5 dil; əlavə dillər — uiText lüğəti ilə ingiliscədən)
// components/hifz/HifzChecks.jsx (sahib, /hifz) və pages/HifzTestPage.jsx (yoxlayan, girişsiz).
// NİTQ TANIMA YOXDUR — yoxlayan insandır (qərarla; docs/USER-ACCOUNTS.md).
// ═══════════════════════════════════════════════════════

export const HC = {
  az: {
    title: 'Məni yoxla', eyebrow: 'Hifz',
    lead: 'Əzbərlədiyiniz surəni seçin və keçidi sizi dinləyəcək şəxsə göndərin. Siz oxuyarkən o, ayələri izləyib səhv və tərəddüdləri işarələyir — nəticə təkrar planınıza düşür.',
    human: 'Mikrofon və avtomatik tanıma yoxdur — sizi insan yoxlayır.',
    surah: 'Surə', from: 'Ayədən', to: 'Ayəyə qədər', name: 'Yoxlayana görünəcək adınız',
    create: 'Keçid yarat', creating: 'Yaradılır…', created: 'Keçid hazırdır — 24 saat işləyir.',
    link: 'Yoxlama keçidi', copy: 'Keçidi kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    signIn: 'Yoxlama keçidi yaratmaq üçün daxil olun.', signInBtn: 'Daxil ol',
    mine: 'Keçidlərim', none: 'Hələ keçid yoxdur.',
    status: { open: 'Gözləyir', done: 'Nəticə gəlib', expired: 'Vaxtı keçib' },
    until: (d) => `Bitir: ${d}`, del: 'Sil',
    resultTitle: 'Yoxlamanın nəticəsi', mistakes: (n) => `Səhv: ${n}`, hesitations: (n) => `Tərəddüd: ${n}`,
    clean: 'Heç bir işarə yoxdur — maşaAllah!', imported: 'Səhvli ayələr təkrar planınıza əlavə olundu.',
    ayah: (a) => `Ayə ${a}`, words: (w) => `sözlər: ${w}`, mistake: 'Səhv', hesitation: 'Tərəddüd',
    privacy: 'Keçid yalnız seçdiyiniz ayələri və adınızı göstərir. Nəticə siz onu görəndən 7 gün sonra serverdən silinir.',
    range: (s, a, b) => `${s}, ${a}–${b} ayələr`,
    // Yoxlayan
    checkTitle: (n) => `${n} əzbərdən oxuyur`,
    checkLead: 'Mətni izləyin. Səhv olan ayədə «Səhv», tərəddüd olanda «Tərəddüd» düyməsini basın. İstəsəniz səhv sözə toxunaraq onu da qeyd edin.',
    wordMode: 'Sözləri işarələ', loading: 'Yüklənir…', textError: 'Ayələri yükləmək alınmadı.', retry: 'Yenidən cəhd et',
    submit: 'Nəticəni göndər', submitting: 'Göndərilir…', confirm: 'Göndərilsin? Sonra dəyişmək olmaz.', yes: 'Bəli, göndər', cancel: 'Ləğv et',
    submitted: 'Göndərildi. Təşəkkür edirik — Allah razı olsun!', already: 'Bu yoxlamanın nəticəsi artıq göndərilib.',
    expired: 'Bu keçidin vaxtı keçib.', invalid: 'Keçid yanlışdır və ya silinib.', noToken: 'Keçid tam deyil — onu yenidən açın.',
    source: 'Mətn: alquran.cloud (Mədinə mushafı, Həfs rəvayəti).', marked: (m, h) => `Səhv: ${m} · Tərəddüd: ${h}`,
    err: { rate: 'Çox sorğu. Bir az gözləyin.', net: 'Şəbəkə xətası. Yenidən cəhd edin.', many: 'Ən çox 10 açıq keçid ola bilər.', range: 'Ayə aralığı yanlışdır.', name: 'Adınızı yazın.', unknown: 'Alınmadı. Yenidən cəhd edin.' },
  },
  en: {
    title: 'Test me', eyebrow: 'Hifz',
    lead: 'Choose a surah you have memorised and send the link to the person who will listen to you. While you recite, they follow the ayahs and mark mistakes and hesitations — the result goes into your review plan.',
    human: 'No microphone and no automatic recognition — a person checks you.',
    surah: 'Surah', from: 'From ayah', to: 'To ayah', name: 'Your name as the checker will see it',
    create: 'Create link', creating: 'Creating…', created: 'The link is ready — it works for 24 hours.',
    link: 'Test link', copy: 'Copy link', copied: 'Copied', share: 'Share',
    signIn: 'Sign in to create a test link.', signInBtn: 'Sign in',
    mine: 'My links', none: 'No links yet.',
    status: { open: 'Waiting', done: 'Result received', expired: 'Expired' },
    until: (d) => `Expires: ${d}`, del: 'Delete',
    resultTitle: 'Test result', mistakes: (n) => `Mistakes: ${n}`, hesitations: (n) => `Hesitations: ${n}`,
    clean: 'No marks at all — mashaAllah!', imported: 'The ayahs with mistakes were added to your review plan.',
    ayah: (a) => `Ayah ${a}`, words: (w) => `words: ${w}`, mistake: 'Mistake', hesitation: 'Hesitation',
    privacy: 'The link shows only the ayahs you chose and your name. The result is deleted from the server 7 days after you see it.',
    range: (s, a, b) => `${s}, ayahs ${a}–${b}`,
    checkTitle: (n) => `${n} is reciting from memory`,
    checkLead: 'Follow the text. Press “Mistake” on an ayah with a mistake and “Hesitation” when they hesitate. If you like, tap the wrong word to mark it too.',
    wordMode: 'Mark words', loading: 'Loading…', textError: 'The ayahs could not be loaded.', retry: 'Try again',
    submit: 'Send the result', submitting: 'Sending…', confirm: 'Send it? It cannot be changed afterwards.', yes: 'Yes, send', cancel: 'Cancel',
    submitted: 'Sent. Thank you — may Allah be pleased with you!', already: 'The result of this test has already been sent.',
    expired: 'This link has expired.', invalid: 'The link is invalid or was deleted.', noToken: 'The link is incomplete — please open it again.',
    source: 'Text: alquran.cloud (Madani mushaf, narration of Hafs).', marked: (m, h) => `Mistakes: ${m} · Hesitations: ${h}`,
    err: { rate: 'Too many requests. Please wait a moment.', net: 'Network error. Please try again.', many: 'You can have up to 10 open links.', range: 'The ayah range is invalid.', name: 'Please type your name.', unknown: 'Something went wrong. Please try again.' },
  },
  ru: {
    title: 'Проверь меня', eyebrow: 'Хифз',
    lead: 'Выберите выученную суру и отправьте ссылку тому, кто будет вас слушать. Пока вы читаете, он следит за аятами и отмечает ошибки и заминки — результат попадает в ваш план повторения.',
    human: 'Без микрофона и автоматического распознавания — проверяет человек.',
    surah: 'Сура', from: 'С аята', to: 'По аят', name: 'Ваше имя, которое увидит проверяющий',
    create: 'Создать ссылку', creating: 'Создаём…', created: 'Ссылка готова — она действует 24 часа.',
    link: 'Ссылка для проверки', copy: 'Копировать ссылку', copied: 'Скопировано', share: 'Поделиться',
    signIn: 'Войдите, чтобы создать ссылку для проверки.', signInBtn: 'Войти',
    mine: 'Мои ссылки', none: 'Ссылок пока нет.',
    status: { open: 'Ожидает', done: 'Есть результат', expired: 'Истекла' },
    until: (d) => `Истекает: ${d}`, del: 'Удалить',
    resultTitle: 'Результат проверки', mistakes: (n) => `Ошибки: ${n}`, hesitations: (n) => `Заминки: ${n}`,
    clean: 'Ни одной отметки — машаАллах!', imported: 'Аяты с ошибками добавлены в ваш план повторения.',
    ayah: (a) => `Аят ${a}`, words: (w) => `слова: ${w}`, mistake: 'Ошибка', hesitation: 'Заминка',
    privacy: 'Ссылка показывает только выбранные аяты и ваше имя. Результат удаляется с сервера через 7 дней после того, как вы его увидите.',
    range: (s, a, b) => `${s}, аяты ${a}–${b}`,
    checkTitle: (n) => `${n} читает наизусть`,
    checkLead: 'Следите за текстом. Нажмите «Ошибка» на аяте с ошибкой и «Заминка», если чтец запнулся. При желании нажмите на неверное слово, чтобы отметить и его.',
    wordMode: 'Отмечать слова', loading: 'Загрузка…', textError: 'Не удалось загрузить аяты.', retry: 'Повторить',
    submit: 'Отправить результат', submitting: 'Отправляем…', confirm: 'Отправить? Потом изменить нельзя.', yes: 'Да, отправить', cancel: 'Отмена',
    submitted: 'Отправлено. Спасибо — да будет доволен вами Аллах!', already: 'Результат этой проверки уже отправлен.',
    expired: 'Срок действия ссылки истёк.', invalid: 'Ссылка неверна или удалена.', noToken: 'Ссылка неполная — откройте её заново.',
    // lang-ok[alquran,cloud]: mənbə saytın ünvanı (alquran.cloud)
    source: 'Текст: alquran.cloud (мединский мусхаф, чтение Хафса).', marked: (m, h) => `Ошибки: ${m} · Заминки: ${h}`,
    err: { rate: 'Слишком много запросов. Подождите немного.', net: 'Ошибка сети. Попробуйте ещё раз.', many: 'Можно держать не более 10 открытых ссылок.', range: 'Неверный диапазон аятов.', name: 'Введите ваше имя.', unknown: 'Не получилось. Попробуйте ещё раз.' },
  },
  tr: {
    title: 'Beni dinle', eyebrow: 'Hafızlık',
    lead: 'Ezberlediğiniz sureyi seçin ve bağlantıyı sizi dinleyecek kişiye gönderin. Siz okurken o, ayetleri takip edip hataları ve duraksamaları işaretler — sonuç tekrar planınıza eklenir.',
    human: 'Mikrofon ve otomatik tanıma yok — sizi bir insan dinler.',
    surah: 'Sure', from: 'Şu ayetten', to: 'Şu ayete kadar', name: 'Dinleyenin göreceği adınız',
    create: 'Bağlantı oluştur', creating: 'Oluşturuluyor…', created: 'Bağlantı hazır — 24 saat geçerli.',
    link: 'Dinleme bağlantısı', copy: 'Bağlantıyı kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    signIn: 'Dinleme bağlantısı oluşturmak için giriş yapın.', signInBtn: 'Giriş yap',
    mine: 'Bağlantılarım', none: 'Henüz bağlantı yok.',
    status: { open: 'Bekliyor', done: 'Sonuç geldi', expired: 'Süresi doldu' },
    until: (d) => `Bitiş: ${d}`, del: 'Sil',
    resultTitle: 'Dinlemenin sonucu', mistakes: (n) => `Hata: ${n}`, hesitations: (n) => `Duraksama: ${n}`,
    clean: 'Hiç işaret yok — maşallah!', imported: 'Hatalı ayetler tekrar planınıza eklendi.',
    ayah: (a) => `Ayet ${a}`, words: (w) => `kelimeler: ${w}`, mistake: 'Hata', hesitation: 'Duraksama',
    privacy: 'Bağlantı yalnızca seçtiğiniz ayetleri ve adınızı gösterir. Sonuç, siz gördükten 7 gün sonra sunucudan silinir.',
    range: (s, a, b) => `${s}, ${a}–${b}. ayetler`,
    checkTitle: (n) => `${n} ezberden okuyor`,
    checkLead: 'Metni takip edin. Hatalı ayette «Hata», duraksadığında «Duraksama» düğmesine basın. İsterseniz yanlış kelimeye dokunarak onu da işaretleyin.',
    wordMode: 'Kelimeleri işaretle', loading: 'Yükleniyor…', textError: 'Ayetler yüklenemedi.', retry: 'Tekrar dene',
    submit: 'Sonucu gönder', submitting: 'Gönderiliyor…', confirm: 'Gönderilsin mi? Sonra değiştirilemez.', yes: 'Evet, gönder', cancel: 'Vazgeç',
    submitted: 'Gönderildi. Teşekkürler — Allah razı olsun!', already: 'Bu dinlemenin sonucu zaten gönderildi.',
    expired: 'Bu bağlantının süresi doldu.', invalid: 'Bağlantı geçersiz ya da silinmiş.', noToken: 'Bağlantı eksik — lütfen yeniden açın.',
    // lang-ok[alquran]: mənbə saytın ünvanı (alquran.cloud)
    source: 'Metin: alquran.cloud (Medine mushafı, Hafs rivayeti).', marked: (m, h) => `Hata: ${m} · Duraksama: ${h}`,
    err: { rate: 'Çok fazla istek. Biraz bekleyin.', net: 'Ağ hatası. Tekrar deneyin.', many: 'En fazla 10 açık bağlantınız olabilir.', range: 'Ayet aralığı geçersiz.', name: 'Adınızı yazın.', unknown: 'Olmadı. Tekrar deneyin.' },
  },
  ar: {
    title: 'اختبرني', eyebrow: 'الحفظ',
    lead: 'اختر سورة حفظتها وأرسل الرابط إلى من سيستمع إليك. وأنت تتلو يتابع الآيات ويعلّم على الأخطاء والتردّد، فتدخل النتيجة في خطة مراجعتك.',
    human: 'لا ميكروفون ولا تعرّف آلي — الذي يختبرك إنسان.',
    surah: 'السورة', from: 'من الآية', to: 'إلى الآية', name: 'اسمك كما سيراه المختبِر',
    create: 'أنشئ الرابط', creating: 'جارٍ الإنشاء…', created: 'الرابط جاهز — يعمل 24 ساعة.',
    link: 'رابط الاختبار', copy: 'انسخ الرابط', copied: 'تم النسخ', share: 'مشاركة',
    signIn: 'سجّل الدخول لإنشاء رابط اختبار.', signInBtn: 'تسجيل الدخول',
    mine: 'روابطي', none: 'لا روابط بعد.',
    status: { open: 'بانتظار', done: 'وصلت النتيجة', expired: 'انتهت صلاحيته' },
    until: (d) => `ينتهي: ${d}`, del: 'حذف',
    resultTitle: 'نتيجة الاختبار', mistakes: (n) => `أخطاء: ${n}`, hesitations: (n) => `تردّد: ${n}`,
    clean: 'لا توجد أي علامة — ما شاء الله!', imported: 'أُضيفت الآيات التي فيها أخطاء إلى خطة مراجعتك.',
    ayah: (a) => `الآية ${a}`, words: (w) => `الكلمات: ${w}`, mistake: 'خطأ', hesitation: 'تردّد',
    privacy: 'لا يُظهر الرابط إلا الآيات التي اخترتها واسمك. تُحذف النتيجة من الخادم بعد 7 أيام من اطلاعك عليها.',
    range: (s, a, b) => `${s}، الآيات ${a}–${b}`,
    checkTitle: (n) => `${n} يتلو من حفظه`,
    checkLead: 'تابع النص. اضغط «خطأ» على الآية التي فيها خطأ و«تردّد» عند التردّد. ويمكنك الضغط على الكلمة الخاطئة لتعليمها أيضًا.',
    wordMode: 'علّم الكلمات', loading: 'جارٍ التحميل…', textError: 'تعذّر تحميل الآيات.', retry: 'أعد المحاولة',
    submit: 'أرسل النتيجة', submitting: 'جارٍ الإرسال…', confirm: 'هل ترسلها؟ لا يمكن تغييرها بعد ذلك.', yes: 'نعم، أرسل', cancel: 'إلغاء',
    submitted: 'أُرسلت. جزاك الله خيرًا!', already: 'أُرسلت نتيجة هذا الاختبار من قبل.',
    expired: 'انتهت صلاحية هذا الرابط.', invalid: 'الرابط غير صحيح أو حُذف.', noToken: 'الرابط ناقص — افتحه مرة أخرى.',
    // lang-ok[alquran,cloud]: mənbə saytın ünvanı (alquran.cloud)
    source: 'النص: alquran.cloud (مصحف المدينة، رواية حفص).', marked: (m, h) => `أخطاء: ${m} · تردّد: ${h}`,
    err: { rate: 'طلبات كثيرة. انتظر قليلًا.', net: 'خطأ في الشبكة. حاول مجددًا.', many: 'يمكنك فتح 10 روابط كحد أقصى.', range: 'نطاق الآيات غير صحيح.', name: 'اكتب اسمك.', unknown: 'لم ينجح ذلك. حاول مجددًا.' },
  },
}

export function hcError(e, t) {
  if (e && e.status === 429) return t.err.rate
  const c = e && e.code
  if (c === 'too_many') return t.err.many
  if (c === 'bad_range') return t.err.range
  if (c === 'bad_name') return t.err.name
  if (c === 'expired') return t.expired
  if (c === 'invalid_token') return t.invalid
  if (c === 'already_submitted') return t.already
  if (e instanceof TypeError) return t.err.net
  return t.err.unknown
}
