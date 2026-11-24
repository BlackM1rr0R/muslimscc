// ═══════════════════════════════════════════════════════
// Admin məktubu üçün hazır şablonlar (MailComposer → "Şablonlar")
//   Klik → 5 dilin hamısında mövzu, mətn, düymə + rəng mövzusu doldurulur, rejim "hər dilə ayrı versiya".
//   theme — server/mailer.js CAMPAIGN_THEMES açarı (server allowlist ilə yoxlayır; rəng klientdən getmir).
//   Mətn qaydası (content-reviewer): yalnız təbriklər ("Ramazan mübarək", "Bayramınız mübarək",
//   "Cüməniz mübarək"); dua, hədis, fəzilət iddiası, reytinq, təzyiq YOXDUR. Saytda olmayan şeyə vəd yoxdur.
//   ctaUrl — yol ("/ramadan"); server dil prefiksini özü əlavə edir.
//   Fayl QƏSDƏN src/utils-dədir (src/components yox): vite-ui-dict-plugin komponentlərdəki { en: … }
//   obyektlərini əlavə dillərin lüğəti ilə əvəz edir — məktubun ingiliscə versiyası dəyişməməlidir.
// ═══════════════════════════════════════════════════════

/** Rəng mövzuları (sıra — seçim siyahısındakı sıra) */
export const MAIL_THEMES = ['emerald', 'dawn', 'night', 'festive', 'sand']
/** Kartın kiçik şəkli — başlıq GIF-inin 1-ci kadrı (scripts/build-mail-headers.mjs) */
export const themeThumb = (theme) => `/email/thumb-${theme}-v1.webp`

export const THEME_NAMES = {
  az: { emerald: 'Zümrüd gecə', dawn: 'Qızılı şəfəq', night: 'Ulduzlu göy', festive: 'Bayram', sand: 'Yumşaq qum' },
  en: { emerald: 'Emerald night', dawn: 'Golden dawn', night: 'Starry blue', festive: 'Festive', sand: 'Soft sand' },
  ru: { emerald: 'Изумрудная ночь', dawn: 'Золотой рассвет', night: 'Звёздная синь', festive: 'Праздничная', sand: 'Мягкий песок' },
  tr: { emerald: 'Zümrüt gece', dawn: 'Altın şafak', night: 'Yıldızlı mavi', festive: 'Bayram', sand: 'Yumuşak kum' },
  ar: { emerald: 'ليل زمردي', dawn: 'فجر ذهبي', night: 'زرقة مرصّعة بالنجوم', festive: 'احتفالي', sand: 'رمل ناعم' },
}

export const MAIL_TEMPLATES = [
  {
    id: 'whatsnew', theme: 'emerald',
    name: { az: 'Yeniliklər', en: 'What’s new', ru: 'Что нового', tr: 'Yenilikler', ar: 'ما الجديد' },
    versions: {
      az: {
        subject: 'Muslims.cc-də yeniliklər',
        body: 'Əssəlamu aleykum!\n\nSon həftələrdə sayta yeni alətlər və bölmələr əlavə etdik, mövcud olanları isə daha sürətli və rahat etdik.\n\nNələrin dəyişdiyini «Yeniliklər» səhifəsində qısa turla görə bilərsiniz.\n\nBizimlə olduğunuz üçün təşəkkür edirik.\n— Muslims.cc komandası',
        ctaLabel: 'Yeniliklərə bax', ctaUrl: '/whats-new',
      },
      en: {
        subject: 'What’s new on Muslims.cc',
        body: 'Assalamu alaykum!\n\nOver the past weeks we have added new tools and sections to the site, and made the existing ones faster and easier to use.\n\nYou can see what has changed on the “What’s new” page, with a short guided tour.\n\nThank you for being with us.\n— The Muslims.cc team',
        ctaLabel: 'See what’s new', ctaUrl: '/whats-new',
      },
      ru: {
        // lang-ok[Muslims,cc]: название сайта
        subject: 'Что нового на Muslims.cc',
        // lang-ok[Muslims,cc]: название сайта
        body: 'Ассаляму алейкум!\n\nЗа последние недели мы добавили на сайт новые инструменты и разделы, а существующие сделали быстрее и удобнее.\n\nЧто изменилось, можно посмотреть на странице «Что нового» — там есть короткая экскурсия.\n\nСпасибо, что вы с нами.\n— Команда Muslims.cc',
        ctaLabel: 'Посмотреть новинки', ctaUrl: '/whats-new',
      },
      tr: {
        subject: 'Muslims.cc’de yenilikler',
        body: 'Esselâmü aleyküm!\n\nSon haftalarda siteye yeni araçlar ve bölümler ekledik, mevcut olanları da daha hızlı ve kullanışlı hâle getirdik.\n\nNelerin değiştiğini «Yenilikler» sayfasında kısa bir turla görebilirsiniz.\n\nBizimle olduğunuz için teşekkür ederiz.\n— Muslims.cc ekibi',
        ctaLabel: 'Yeniliklere göz at', ctaUrl: '/whats-new',
      },
      ar: {
        // lang-ok[Muslims,cc]: اسم الموقع
        subject: 'ما الجديد في Muslims.cc',
        // lang-ok[Muslims,cc]: اسم الموقع
        body: 'السلام عليكم!\n\nأضفنا في الأسابيع الماضية أدوات وأقسامًا جديدة إلى الموقع، وجعلنا الموجود منها أسرع وأسهل استخدامًا.\n\nيمكنك الاطلاع على ما تغيّر في صفحة «ما الجديد» مع جولة تعريفية قصيرة.\n\nشكرًا لأنك معنا.\n— فريق Muslims.cc',
        ctaLabel: 'اطّلع على الجديد', ctaUrl: '/whats-new',
      },
    },
  },
  {
    id: 'ramadan', theme: 'dawn',
    name: { az: 'Ramazan təbriki', en: 'Ramadan greeting', ru: 'Поздравление с Рамаданом', tr: 'Ramazan tebriği', ar: 'تهنئة رمضان' },
    versions: {
      az: {
        subject: 'Ramazan ayınız mübarək!',
        body: 'Əssəlamu aleykum!\n\nRamazan ayınız mübarək! Sizə və yaxınlarınıza bu ayı sağlıq, rahatlıq və sevinclə keçirməyi arzulayırıq.\n\nRamazan bölməmizdə şəhəriniz üçün imsak və iftar vaxtları, ayın bütün günləri üçün təqvim var.\n\n— Muslims.cc komandası',
        ctaLabel: 'Ramazan təqvimi', ctaUrl: '/ramadan',
      },
      en: {
        subject: 'Ramadan Mubarak!',
        body: 'Assalamu alaykum!\n\nRamadan Mubarak! We wish you and your loved ones a month of good health, calm and joy.\n\nOur Ramadan section has imsak and iftar times for your city and a timetable for every day of the month.\n\n— The Muslims.cc team',
        ctaLabel: 'Ramadan timetable', ctaUrl: '/ramadan',
      },
      ru: {
        subject: 'Рамадан мубарак!',
        // lang-ok[Muslims,cc]: название сайта
        body: 'Ассаляму алейкум!\n\nРамадан мубарак! Желаем вам и вашим близким провести этот месяц в здоровье, спокойствии и радости.\n\nВ нашем разделе о Рамадане есть время имсака и ифтара для вашего города и расписание на каждый день месяца.\n\n— Команда Muslims.cc',
        ctaLabel: 'Расписание Рамадана', ctaUrl: '/ramadan',
      },
      tr: {
        subject: 'Hayırlı Ramazanlar!',
        body: 'Esselâmü aleyküm!\n\nHayırlı Ramazanlar! Size ve sevdiklerinize bu ayı sağlık, huzur ve sevinç içinde geçirmenizi dileriz.\n\nRamazan bölümümüzde şehriniz için imsak ve iftar vakitleri ile ayın her günü için bir takvim bulabilirsiniz.\n\n— Muslims.cc ekibi',
        ctaLabel: 'Ramazan takvimi', ctaUrl: '/ramadan',
      },
      ar: {
        subject: 'رمضان مبارك!',
        // lang-ok[Muslims,cc]: اسم الموقع
        body: 'السلام عليكم!\n\nرمضان مبارك! نتمنى لك ولأحبّتك شهرًا مليئًا بالصحة والسكينة والفرح.\n\nفي قسم رمضان لدينا مواقيت الإمساك والإفطار لمدينتك وجدول لكل أيام الشهر.\n\n— فريق Muslims.cc',
        ctaLabel: 'إمساكية رمضان', ctaUrl: '/ramadan',
      },
    },
  },
  {
    id: 'eidFitr', theme: 'festive',
    name: { az: 'Ramazan bayramı', en: 'Eid al-Fitr', ru: 'Ураза-байрам', tr: 'Ramazan Bayramı', ar: 'عيد الفطر' },
    versions: {
      az: {
        subject: 'Ramazan bayramınız mübarək!',
        body: 'Əssəlamu aleykum!\n\nRamazan bayramınız mübarək! Sizə və ailənizə sağlıq, sevinc və xoş günlər arzulayırıq.\n\nBayramı yaxınlarınızla birlikdə gözəl keçirin.\n\n— Muslims.cc komandası',
        ctaLabel: 'İslami təqvim', ctaUrl: '/calendar',
      },
      en: {
        subject: 'Eid Mubarak!',
        body: 'Assalamu alaykum!\n\nEid Mubarak! We wish you and your family good health, joy and happy days.\n\nEnjoy the celebration together with your loved ones.\n\n— The Muslims.cc team',
        ctaLabel: 'Islamic calendar', ctaUrl: '/calendar',
      },
      ru: {
        subject: 'С праздником Ураза-байрам!',
        // lang-ok[Muslims,cc]: название сайта
        body: 'Ассаляму алейкум!\n\nИд мубарак! Желаем вам и вашей семье здоровья, радости и светлых дней.\n\nПусть праздник пройдёт тепло, в кругу близких.\n\n— Команда Muslims.cc',
        ctaLabel: 'Исламский календарь', ctaUrl: '/calendar',
      },
      tr: {
        subject: 'Ramazan Bayramınız mübarek olsun!',
        body: 'Esselâmü aleyküm!\n\nRamazan Bayramınız mübarek olsun! Size ve ailenize sağlık, sevinç ve güzel günler dileriz.\n\nBayramı sevdiklerinizle birlikte güzelce geçirin.\n\n— Muslims.cc ekibi',
        ctaLabel: 'Hicri takvim', ctaUrl: '/calendar',
      },
      ar: {
        subject: 'عيد فطر مبارك!',
        // lang-ok[Muslims,cc]: اسم الموقع
        body: 'السلام عليكم!\n\nعيد فطر مبارك! نتمنى لك ولعائلتك الصحة والفرح وأيامًا سعيدة.\n\nنتمنى لكم عيدًا جميلًا مع أحبّتكم.\n\n— فريق Muslims.cc',
        ctaLabel: 'التقويم الهجري', ctaUrl: '/calendar',
      },
    },
  },
  {
    id: 'eidAdha', theme: 'festive',
    name: { az: 'Qurban bayramı', en: 'Eid al-Adha', ru: 'Курбан-байрам', tr: 'Kurban Bayramı', ar: 'عيد الأضحى' },
    versions: {
      az: {
        subject: 'Qurban bayramınız mübarək!',
        body: 'Əssəlamu aleykum!\n\nQurban bayramınız mübarək! Sizə və ailənizə sağlıq, bərəkət və sevinc dolu günlər arzulayırıq.\n\nBayramı yaxınlarınızla birlikdə gözəl keçirin.\n\n— Muslims.cc komandası',
        ctaLabel: 'İslami təqvim', ctaUrl: '/calendar',
      },
      en: {
        subject: 'Eid al-Adha Mubarak!',
        body: 'Assalamu alaykum!\n\nEid al-Adha Mubarak! We wish you and your family good health and days full of joy.\n\nEnjoy the celebration together with your loved ones.\n\n— The Muslims.cc team',
        ctaLabel: 'Islamic calendar', ctaUrl: '/calendar',
      },
      ru: {
        subject: 'С праздником Курбан-байрам!',
        // lang-ok[Muslims,cc]: название сайта
        body: 'Ассаляму алейкум!\n\nС праздником Курбан-байрам! Желаем вам и вашей семье здоровья и дней, полных радости.\n\nПусть праздник пройдёт тепло, в кругу близких.\n\n— Команда Muslims.cc',
        ctaLabel: 'Исламский календарь', ctaUrl: '/calendar',
      },
      tr: {
        subject: 'Kurban Bayramınız mübarek olsun!',
        body: 'Esselâmü aleyküm!\n\nKurban Bayramınız mübarek olsun! Size ve ailenize sağlık ve sevinç dolu günler dileriz.\n\nBayramı sevdiklerinizle birlikte güzelce geçirin.\n\n— Muslims.cc ekibi',
        ctaLabel: 'Hicri takvim', ctaUrl: '/calendar',
      },
      ar: {
        subject: 'عيد أضحى مبارك!',
        // lang-ok[Muslims,cc]: اسم الموقع
        body: 'السلام عليكم!\n\nعيد أضحى مبارك! نتمنى لك ولعائلتك الصحة وأيامًا مليئة بالفرح.\n\nنتمنى لكم عيدًا جميلًا مع أحبّتكم.\n\n— فريق Muslims.cc',
        ctaLabel: 'التقويم الهجري', ctaUrl: '/calendar',
      },
    },
  },
  {
    id: 'jumuah', theme: 'night',
    name: { az: 'Cümə', en: 'Jumu’ah', ru: 'Джума', tr: 'Cuma', ar: 'الجمعة' },
    versions: {
      az: {
        subject: 'Cüməniz mübarək!',
        body: 'Əssəlamu aleykum!\n\nCüməniz mübarək! Sizə sakit və xeyirli bir gün arzulayırıq.\n\nNövbəti cümənin tarixini və şəhəriniz üçün zöhr vaxtını saytımızda görə bilərsiniz.\n\n— Muslims.cc komandası',
        ctaLabel: 'Camaat və Cümə namazı', ctaUrl: '/jamaat',
      },
      en: {
        subject: 'Jumu’ah Mubarak!',
        body: 'Assalamu alaykum!\n\nJumu’ah Mubarak! We wish you a calm and blessed day.\n\nOn our site you can see the date of the next Friday and the Dhuhr time for your city.\n\n— The Muslims.cc team',
        ctaLabel: 'Congregation and Friday prayer', ctaUrl: '/jamaat',
      },
      ru: {
        subject: 'Джума мубарак!',
        // lang-ok[Muslims,cc]: название сайта
        body: 'Ассаляму алейкум!\n\nДжума мубарак! Желаем вам спокойного и благословенного дня.\n\nНа нашем сайте можно узнать дату ближайшей пятницы и время зухра для вашего города.\n\n— Команда Muslims.cc',
        ctaLabel: 'Коллективный и пятничный намаз', ctaUrl: '/jamaat',
      },
      tr: {
        subject: 'Hayırlı Cumalar!',
        body: 'Esselâmü aleyküm!\n\nHayırlı Cumalar! Size huzurlu ve bereketli bir gün dileriz.\n\nBir sonraki cumanın tarihini ve şehriniz için öğle vaktini sitemizde görebilirsiniz.\n\n— Muslims.cc ekibi',
        ctaLabel: 'Cemaat ve cuma namazı', ctaUrl: '/jamaat',
      },
      ar: {
        subject: 'جمعة مباركة!',
        // lang-ok[Muslims,cc]: اسم الموقع
        body: 'السلام عليكم!\n\nجمعة مباركة! نتمنى لك يومًا هادئًا مباركًا.\n\nيمكنك على موقعنا معرفة تاريخ الجمعة القادمة ووقت الظهر في مدينتك.\n\n— فريق Muslims.cc',
        ctaLabel: 'الجماعة وصلاة الجمعة', ctaUrl: '/jamaat',
      },
    },
  },
  {
    id: 'quran', theme: 'emerald',
    name: { az: 'Qurana dəvət', en: 'Quran invitation', ru: 'Приглашение к Корану', tr: 'Kur’an’a davet', ar: 'دعوة إلى القرآن' },
    versions: {
      az: {
        subject: 'Bu gün Qurandan bir neçə səhifə',
        body: 'Əssəlamu aleykum!\n\nGünün qarışıqlığında Quran üçün sakit bir neçə dəqiqə ayırmaq istəsəniz, Muslims.cc-də tərcümə, qiraət və təfsirlə Quran sizi gözləyir.\n\nSayt oxuduğunuz yeri yadda saxlayır — növbəti dəfə qaldığınız yerdən davam edə bilərsiniz.\n\n— Muslims.cc komandası',
        ctaLabel: 'Quranı aç', ctaUrl: '/quran',
      },
      en: {
        subject: 'A few pages of the Quran today',
        body: 'Assalamu alaykum!\n\nIf you would like a few quiet minutes with the Quran in a busy day, the Quran with translation, recitation and tafsir is waiting for you on Muslims.cc.\n\nThe site remembers where you were reading — next time you can continue where you left off.\n\n— The Muslims.cc team',
        ctaLabel: 'Open the Quran', ctaUrl: '/quran',
      },
      ru: {
        subject: 'Несколько страниц Корана сегодня',
        // lang-ok[Muslims,cc]: название сайта
        body: 'Ассаляму алейкум!\n\nЕсли среди дневной суеты хочется уделить Корану несколько спокойных минут, на Muslims.cc вас ждёт Коран с переводом, чтением и тафсиром.\n\nСайт запоминает, где вы остановились, — в следующий раз можно продолжить с того же места.\n\n— Команда Muslims.cc',
        ctaLabel: 'Открыть Коран', ctaUrl: '/quran',
      },
      tr: {
        subject: 'Bugün Kur’an’dan birkaç sayfa',
        body: 'Esselâmü aleyküm!\n\nGünün koşuşturmasında Kur’an’a birkaç sakin dakika ayırmak isterseniz, Muslims.cc’de meal, kıraat ve tefsirle Kur’an sizi bekliyor.\n\nSite okuduğunuz yeri hatırlar — bir dahaki sefere kaldığınız yerden devam edebilirsiniz.\n\n— Muslims.cc ekibi',
        ctaLabel: 'Kur’an’ı aç', ctaUrl: '/quran',
      },
      ar: {
        subject: 'صفحات من القرآن اليوم',
        // lang-ok[Muslims,cc]: اسم الموقع
        body: 'السلام عليكم!\n\nإن رغبت في دقائق هادئة مع القرآن وسط زحمة اليوم، فالقرآن مع الترجمة والتلاوة والتفسير بانتظارك في Muslims.cc.\n\nيحفظ الموقع موضع قراءتك — وفي المرة القادمة تتابع من حيث توقفت.\n\n— فريق Muslims.cc',
        ctaLabel: 'افتح القرآن', ctaUrl: '/quran',
      },
    },
  },
  {
    id: 'plain', theme: 'sand',
    name: { az: 'Sadə məktub', en: 'Plain letter', ru: 'Простое письмо', tr: 'Sade mektup', ar: 'رسالة بسيطة' },
    // Boş — sahib özü yazır (mövzu və mətn boş, düymə yoxdur)
    versions: {
      az: { subject: '', body: '', ctaLabel: '', ctaUrl: '' },
      en: { subject: '', body: '', ctaLabel: '', ctaUrl: '' },
      ru: { subject: '', body: '', ctaLabel: '', ctaUrl: '' },
      tr: { subject: '', body: '', ctaLabel: '', ctaUrl: '' },
      ar: { subject: '', body: '', ctaLabel: '', ctaUrl: '' },
    },
  },
]
