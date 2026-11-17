// ═══════════════════════════════════════════════════════
// Profillər + ailə dairəsi yazıları (5 dil; əlavə dillər — uiText lüğəti ilə ingiliscədən)
// components/account/ProfilesSection.jsx, FamilySection.jsx, ProfileMenu.jsx (başlıq menyusu)
// Təşviq kartları — SABİT ŞABLONLAR (server/family.js → CARD_TEMPLATES); sərbəst mətn yoxdur.
// ═══════════════════════════════════════════════════════

export const PRF = {
  az: {
    title: 'Profillər', menu: 'Profil', manage: 'Profilləri idarə et',
    lead: 'Bir hesabda ailə üzvləri üçün ayrıca profillər: hər profilin hifzi, Quran mozaikası, namaz izləyicisi, zikri və uşaq kitabları ayrıdır. Dil, mövzu və şəhər ortaqdır.',
    enable: 'Profilləri aç', enableLead: 'Mövcud irəliləyişiniz birinci profilə aid olacaq.', yourName: 'Sizin profilinizin adı', firstKid: 'İkinci profil (məs. uşaq) — istəyə bağlı',
    add: 'Profil əlavə et', name: 'Ad', kid: 'Uşaq profili', avatar: 'Nişan', color: 'Rəng', save: 'Yadda saxla', cancel: 'Ləğv et',
    active: 'Aktiv', switchTo: 'Bu profilə keç', edit: 'Düzəlt', remove: 'Sil', removeAsk: 'Bu profil və onun bütün irəliləyişi silinsin?', yes: 'Bəli, sil',
    disable: 'Profilləri bağla', disableNote: 'Yalnız bir profil qalanda bağlamaq olar — məlumat yerində qalır.',
    max: (n) => `Ən çox ${n} profil.`, filled: (n) => `${n} bölmədə irəliləyiş`, kidBadge: 'Uşaq',
    sync: 'Profillər hesabınızla uçdan-uca şifrəli sinxronlanır; aktiv profil hər cihazda ayrıca seçilir.',
    failed: 'Keçid alınmadı (yaddaş dolu ola bilər). Heç nə itməyib.', nameNeed: 'Ad yazın.',
    avatars: { letter: 'Hərf', star8: 'Səkkizguşəli ulduz', crescent: 'Hilal', hexagon: 'Altıbucaqlı', diamond: 'Romb', arch: 'Tağ', circle: 'Dairə', drop: 'Damla' },
    colors: { emerald: 'Zümrüd', teal: 'Firuzəyi', sky: 'Səma mavisi', indigo: 'İndiqo', violet: 'Bənövşəyi', rose: 'Qızılgül', amber: 'Kəhrəba', slate: 'Boz' },
  },
  en: {
    title: 'Profiles', menu: 'Profile', manage: 'Manage profiles',
    lead: 'Separate profiles for family members in one account: each profile has its own hifz, Quran mosaic, prayer tracker, dhikr and children’s books. Language, theme and city are shared.',
    enable: 'Turn on profiles', enableLead: 'Your current progress will belong to the first profile.', yourName: 'Name of your profile', firstKid: 'Second profile (e.g. a child) — optional',
    add: 'Add a profile', name: 'Name', kid: 'Child profile', avatar: 'Badge', color: 'Colour', save: 'Save', cancel: 'Cancel',
    active: 'Active', switchTo: 'Switch to this profile', edit: 'Edit', remove: 'Delete', removeAsk: 'Delete this profile and all its progress?', yes: 'Yes, delete',
    disable: 'Turn off profiles', disableNote: 'Can be turned off when only one profile is left — the data stays.',
    max: (n) => `Up to ${n} profiles.`, filled: (n) => `Progress in ${n} sections`, kidBadge: 'Child',
    sync: 'Profiles sync end-to-end encrypted with your account; the active profile is chosen separately on each device.',
    failed: 'Could not switch (storage may be full). Nothing was lost.', nameNeed: 'Please type a name.',
    avatars: { letter: 'Letter', star8: 'Eight-pointed star', crescent: 'Crescent', hexagon: 'Hexagon', diamond: 'Diamond', arch: 'Arch', circle: 'Circle', drop: 'Drop' },
    colors: { emerald: 'Emerald', teal: 'Teal', sky: 'Sky blue', indigo: 'Indigo', violet: 'Violet', rose: 'Rose', amber: 'Amber', slate: 'Slate' },
  },
  ru: {
    title: 'Профили', menu: 'Профиль', manage: 'Управление профилями',
    lead: 'Отдельные профили для членов семьи в одном аккаунте: у каждого профиля свой хифз, мозаика Корана, трекер намаза, зикр и детские книги. Язык, тема и город общие.',
    enable: 'Включить профили', enableLead: 'Ваш текущий прогресс будет принадлежать первому профилю.', yourName: 'Имя вашего профиля', firstKid: 'Второй профиль (например, ребёнок) — необязательно',
    add: 'Добавить профиль', name: 'Имя', kid: 'Детский профиль', avatar: 'Значок', color: 'Цвет', save: 'Сохранить', cancel: 'Отмена',
    active: 'Активный', switchTo: 'Перейти на этот профиль', edit: 'Изменить', remove: 'Удалить', removeAsk: 'Удалить этот профиль и весь его прогресс?', yes: 'Да, удалить',
    disable: 'Выключить профили', disableNote: 'Выключить можно, когда остался один профиль, — данные сохранятся.',
    max: (n) => `Не более ${n} профилей.`, filled: (n) => `Прогресс в разделах: ${n}`, kidBadge: 'Ребёнок',
    sync: 'Профили синхронизируются с аккаунтом со сквозным шифрованием; активный профиль выбирается на каждом устройстве отдельно.',
    failed: 'Не удалось переключиться (возможно, память заполнена). Ничего не потеряно.', nameNeed: 'Введите имя.',
    avatars: { letter: 'Буква', star8: 'Восьмиконечная звезда', crescent: 'Полумесяц', hexagon: 'Шестиугольник', diamond: 'Ромб', arch: 'Арка', circle: 'Круг', drop: 'Капля' },
    colors: { emerald: 'Изумрудный', teal: 'Бирюзовый', sky: 'Небесный', indigo: 'Индиго', violet: 'Фиолетовый', rose: 'Розовый', amber: 'Янтарный', slate: 'Серый' },
  },
  tr: {
    title: 'Profiller', menu: 'Profil', manage: 'Profilleri yönet',
    lead: 'Tek hesapta aile üyeleri için ayrı profiller: her profilin hafızlığı, Kur’an mozaiği, namaz takibi, zikri ve çocuk kitapları ayrıdır. Dil, tema ve şehir ortaktır.',
    enable: 'Profilleri aç', enableLead: 'Mevcut ilerlemeniz ilk profile ait olacak.', yourName: 'Profilinizin adı', firstKid: 'İkinci profil (ör. çocuk) — isteğe bağlı',
    add: 'Profil ekle', name: 'Ad', kid: 'Çocuk profili', avatar: 'Rozet', color: 'Renk', save: 'Kaydet', cancel: 'Vazgeç',
    active: 'Etkin', switchTo: 'Bu profile geç', edit: 'Düzenle', remove: 'Sil', removeAsk: 'Bu profil ve tüm ilerlemesi silinsin mi?', yes: 'Evet, sil',
    disable: 'Profilleri kapat', disableNote: 'Yalnızca bir profil kaldığında kapatılabilir — veriler yerinde kalır.',
    max: (n) => `En fazla ${n} profil.`, filled: (n) => `${n} bölümde ilerleme`, kidBadge: 'Çocuk',
    sync: 'Profiller hesabınızla uçtan uca şifreli eşitlenir; etkin profil her cihazda ayrı seçilir.',
    failed: 'Geçiş yapılamadı (depolama dolu olabilir). Hiçbir şey kaybolmadı.', nameNeed: 'Bir ad yazın.',
    avatars: { letter: 'Harf', star8: 'Sekiz köşeli yıldız', crescent: 'Hilal', hexagon: 'Altıgen', diamond: 'Eşkenar dörtgen', arch: 'Kemer', circle: 'Daire', drop: 'Damla' },
    colors: { emerald: 'Zümrüt', teal: 'Turkuaz', sky: 'Gök mavisi', indigo: 'Çivit', violet: 'Mor', rose: 'Gül', amber: 'Kehribar', slate: 'Gri' },
  },
  ar: {
    title: 'الملفات الشخصية', menu: 'الملف الشخصي', manage: 'إدارة الملفات',
    lead: 'ملفات مستقلة لأفراد العائلة في حساب واحد: لكل ملف حفظه وفسيفساء القرآن ومتتبّع الصلاة والذكر وكتب الأطفال الخاصة به. اللغة والمظهر والمدينة مشتركة.',
    enable: 'فعّل الملفات', enableLead: 'سيصبح تقدّمك الحالي للملف الأول.', yourName: 'اسم ملفك', firstKid: 'ملف ثانٍ (مثلًا لطفل) — اختياري',
    add: 'أضف ملفًا', name: 'الاسم', kid: 'ملف طفل', avatar: 'الشارة', color: 'اللون', save: 'حفظ', cancel: 'إلغاء',
    active: 'نشط', switchTo: 'انتقل إلى هذا الملف', edit: 'تعديل', remove: 'حذف', removeAsk: 'حذف هذا الملف وكل تقدّمه؟', yes: 'نعم، احذف',
    disable: 'أوقف الملفات', disableNote: 'يمكن الإيقاف حين يبقى ملف واحد — وتبقى البيانات.',
    max: (n) => `${n} ملفات كحد أقصى.`, filled: (n) => `تقدّم في ${n} أقسام`, kidBadge: 'طفل',
    sync: 'تُزامَن الملفات مع حسابك بتشفير تام بين الطرفين؛ ويُختار الملف النشط في كل جهاز على حدة.',
    failed: 'تعذّر الانتقال (قد تكون الذاكرة ممتلئة). لم يضِع شيء.', nameNeed: 'اكتب اسمًا.',
    avatars: { letter: 'حرف', star8: 'نجمة ثمانية', crescent: 'هلال', hexagon: 'سداسي', diamond: 'معيّن', arch: 'قوس', circle: 'دائرة', drop: 'قطرة' },
    colors: { emerald: 'زمرّدي', teal: 'فيروزي', sky: 'سماوي', indigo: 'نيلي', violet: 'بنفسجي', rose: 'وردي', amber: 'كهرماني', slate: 'رمادي' },
  },
}

export const FAM = {
  az: {
    title: 'Ailə dairəsi', lead: 'Ailə üzvlərinin hesablarını birləşdirin: hər kəs öz seçdiyi xülasəni paylaşır, bir-birinizə təşviq kartı göndərə bilərsiniz.',
    create: 'Ailə dairəsi yarat', invite: 'Dəvət keçidi yarat', inviteNote: 'Keçid birdəfəlikdir və 7 gün işləyir. Yalnız daxil olmuş hesab qoşula bilər.',
    inviteLink: 'Dəvət keçidi', copy: 'Keçidi kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    openInvites: 'Açıq dəvətlər', revoke: 'Ləğv et', until: (d) => `Bitir: ${d}`,
    members: 'Üzvlər', owner: 'Sahib', member: 'Üzv', you: 'siz', removeMember: 'Çıxar', leave: 'Dairədən çıx', dissolve: 'Dairəni sil',
    confirm: 'Əminsiniz?', yes: 'Bəli', cancel: 'Ləğv et', notShared: 'Hələ heç nə paylaşmır.', updated: (d) => `Yenilənib: ${d}`,
    shareTitle: 'Mənim paylaşdıqlarım', shareLead: 'Seçdiyiniz rəqəmlər bu cihazda hesablanır və yalnız onlar serverə göndərilir. Qalan məlumatınız şifrəli qalır.',
    consent: 'Seçdiyim xülasə rəqəmlərinin ailə dairəmə göstərilməsi üçün serverdə saxlanmasına razıyam.', consentNeed: 'Davam etmək üçün razılığı təsdiqləyin.',
    fromProfile: (n) => `Rəqəmlər aktiv profildən götürülür: ${n}`,
    save: 'Paylaş / yenilə', stop: 'Paylaşmanı dayandır', shared: 'Paylaşıldı.', stopped: 'Paylaşma dayandırıldı.',
    fields: {
      quranAyahsTotal: 'Oxunan ayələr (ümumi)', quranDaysWeek: 'Bu həftə Quran oxunan günlər', storybooksRead: 'Açılan nağıl kitabları',
      prayerStarsWeek: 'Bu həftə qeyd olunan namazlar', hifzAyahs: 'Hifz planındakı ayələr', dhikrWeek: 'Bu həftə zikr sayı',
    },
    cardsTitle: 'Təşviq kartı göndər', to: 'Kimə', card: 'Kart', n: 'Rəqəm (istəyə bağlı)', send: 'Göndər', sent: 'Kart göndərildi.',
    cardsNote: 'Kartlar hazır şablonlardır — sərbəst mətn yoxdur, uşaqlar üçün təhlükəsizdir.',
    inbox: 'Mənə gələn kartlar', none: 'Hələ kart yoxdur.', from: (n) => `${n} göndərdi`, newCard: 'Sizə yeni təşviq kartı gəlib!', del: 'Sil', close: 'Bağla',
    joinTitle: 'Ailə dairəsinə dəvət', joinLead: (o) => `${o} sizi ailə dairəsinə dəvət edir.`, join: 'Qoşul', joined: 'Ailə dairəsinə qoşuldunuz.',
    err: {
      inCircle: 'Siz artıq bir ailə dairəsindəsiniz — əvvəlcə ondan çıxın.', token: 'Dəvət keçidi yanlışdır, istifadə olunub və ya vaxtı keçib.',
      full: 'Dairə doludur (ən çox 8 nəfər).', tooMany: 'Açıq dəvət çoxdur — birini ləğv edin.', consent: 'Davam etmək üçün razılığı təsdiqləyin.',
      rate: 'Bu gün çox kart göndərilib. Sabah yenə cəhd edin.', net: 'Şəbəkə xətası. Yenidən cəhd edin.', unknown: 'Alınmadı. Yenidən cəhd edin.',
    },
  },
  en: {
    title: 'Family circle', lead: 'Connect your family members’ accounts: everyone shares the summary they choose, and you can send each other encouragement cards.',
    create: 'Create a family circle', invite: 'Create an invite link', inviteNote: 'The link works once and for 7 days. Only a signed-in account can join.',
    inviteLink: 'Invite link', copy: 'Copy link', copied: 'Copied', share: 'Share',
    openInvites: 'Open invites', revoke: 'Revoke', until: (d) => `Expires: ${d}`,
    members: 'Members', owner: 'Owner', member: 'Member', you: 'you', removeMember: 'Remove', leave: 'Leave the circle', dissolve: 'Delete the circle',
    confirm: 'Are you sure?', yes: 'Yes', cancel: 'Cancel', notShared: 'Not sharing anything yet.', updated: (d) => `Updated: ${d}`,
    shareTitle: 'What I share', shareLead: 'The numbers you choose are calculated on this device and only they are sent to the server. The rest of your data stays encrypted.',
    consent: 'I agree that the summary numbers I choose are stored on the server to be shown to my family circle.', consentNeed: 'Please confirm your consent to continue.',
    fromProfile: (n) => `Numbers are taken from the active profile: ${n}`,
    save: 'Share / update', stop: 'Stop sharing', shared: 'Shared.', stopped: 'Sharing stopped.',
    fields: {
      quranAyahsTotal: 'Ayahs read (total)', quranDaysWeek: 'Days with Quran this week', storybooksRead: 'Storybooks opened',
      prayerStarsWeek: 'Prayers logged this week', hifzAyahs: 'Ayahs in the hifz plan', dhikrWeek: 'Dhikr count this week',
    },
    cardsTitle: 'Send an encouragement card', to: 'To', card: 'Card', n: 'Number (optional)', send: 'Send', sent: 'Card sent.',
    cardsNote: 'Cards are ready-made templates — no free text, so they are safe for children.',
    inbox: 'Cards for me', none: 'No cards yet.', from: (n) => `From ${n}`, newCard: 'You have a new encouragement card!', del: 'Delete', close: 'Close',
    joinTitle: 'Family circle invitation', joinLead: (o) => `${o} invites you to their family circle.`, join: 'Join', joined: 'You joined the family circle.',
    err: {
      inCircle: 'You are already in a family circle — leave it first.', token: 'The invite link is invalid, already used or expired.',
      full: 'The circle is full (up to 8 people).', tooMany: 'Too many open invites — revoke one.', consent: 'Please confirm your consent to continue.',
      rate: 'Too many cards sent today. Try again tomorrow.', net: 'Network error. Please try again.', unknown: 'Something went wrong. Please try again.',
    },
  },
  ru: {
    title: 'Семейный круг', lead: 'Объедините аккаунты членов семьи: каждый делится выбранной сводкой, а друг другу можно отправлять открытки-поддержки.',
    create: 'Создать семейный круг', invite: 'Создать ссылку-приглашение', inviteNote: 'Ссылка одноразовая и действует 7 дней. Присоединиться может только вошедший в аккаунт.',
    inviteLink: 'Ссылка-приглашение', copy: 'Копировать ссылку', copied: 'Скопировано', share: 'Поделиться',
    openInvites: 'Открытые приглашения', revoke: 'Отозвать', until: (d) => `Истекает: ${d}`,
    members: 'Участники', owner: 'Владелец', member: 'Участник', you: 'вы', removeMember: 'Удалить', leave: 'Выйти из круга', dissolve: 'Удалить круг',
    confirm: 'Вы уверены?', yes: 'Да', cancel: 'Отмена', notShared: 'Пока ничем не делится.', updated: (d) => `Обновлено: ${d}`,
    shareTitle: 'Чем я делюсь', shareLead: 'Выбранные числа считаются на этом устройстве, и на сервер отправляются только они. Остальные ваши данные остаются зашифрованными.',
    consent: 'Я согласен(на), чтобы выбранные итоговые числа хранились на сервере и показывались моему семейному кругу.', consentNeed: 'Подтвердите согласие, чтобы продолжить.',
    fromProfile: (n) => `Числа берутся из активного профиля: ${n}`,
    save: 'Поделиться / обновить', stop: 'Перестать делиться', shared: 'Отправлено.', stopped: 'Вы перестали делиться.',
    fields: {
      quranAyahsTotal: 'Прочитано аятов (всего)', quranDaysWeek: 'Дней с Кораном на этой неделе', storybooksRead: 'Открыто детских книг',
      prayerStarsWeek: 'Намазов отмечено на этой неделе', hifzAyahs: 'Аятов в плане хифза', dhikrWeek: 'Зикров на этой неделе',
    },
    cardsTitle: 'Отправить открытку-поддержку', to: 'Кому', card: 'Открытка', n: 'Число (необязательно)', send: 'Отправить', sent: 'Открытка отправлена.',
    cardsNote: 'Открытки — готовые шаблоны, без свободного текста, поэтому безопасны для детей.',
    inbox: 'Открытки для меня', none: 'Открыток пока нет.', from: (n) => `От: ${n}`, newCard: 'Вам пришла новая открытка-поддержка!', del: 'Удалить', close: 'Закрыть',
    joinTitle: 'Приглашение в семейный круг', joinLead: (o) => `${o} приглашает вас в семейный круг.`, join: 'Присоединиться', joined: 'Вы присоединились к семейному кругу.',
    err: {
      inCircle: 'Вы уже в семейном круге — сначала выйдите из него.', token: 'Ссылка-приглашение неверна, уже использована или истекла.',
      full: 'Круг заполнен (до 8 человек).', tooMany: 'Слишком много открытых приглашений — отзовите одно.', consent: 'Подтвердите согласие, чтобы продолжить.',
      rate: 'Сегодня отправлено слишком много открыток. Попробуйте завтра.', net: 'Ошибка сети. Попробуйте ещё раз.', unknown: 'Не получилось. Попробуйте ещё раз.',
    },
  },
  tr: {
    title: 'Aile çevresi', lead: 'Aile üyelerinin hesaplarını birleştirin: herkes seçtiği özeti paylaşır, birbirinize teşvik kartı gönderebilirsiniz.',
    create: 'Aile çevresi oluştur', invite: 'Davet bağlantısı oluştur', inviteNote: 'Bağlantı tek kullanımlıktır ve 7 gün geçerlidir. Yalnızca giriş yapmış bir hesap katılabilir.',
    inviteLink: 'Davet bağlantısı', copy: 'Bağlantıyı kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    openInvites: 'Açık davetler', revoke: 'İptal et', until: (d) => `Bitiş: ${d}`,
    members: 'Üyeler', owner: 'Sahibi', member: 'Üye', you: 'siz', removeMember: 'Çıkar', leave: 'Çevreden ayrıl', dissolve: 'Çevreyi sil',
    confirm: 'Emin misiniz?', yes: 'Evet', cancel: 'Vazgeç', notShared: 'Henüz bir şey paylaşmıyor.', updated: (d) => `Güncellendi: ${d}`,
    shareTitle: 'Paylaştıklarım', shareLead: 'Seçtiğiniz sayılar bu cihazda hesaplanır ve sunucuya yalnızca onlar gönderilir. Diğer verileriniz şifreli kalır.',
    consent: 'Seçtiğim özet sayıların aile çevreme gösterilmesi için sunucuda saklanmasını kabul ediyorum.', consentNeed: 'Devam etmek için onayınızı verin.',
    fromProfile: (n) => `Sayılar etkin profilden alınır: ${n}`,
    save: 'Paylaş / güncelle', stop: 'Paylaşmayı durdur', shared: 'Paylaşıldı.', stopped: 'Paylaşım durduruldu.',
    fields: {
      quranAyahsTotal: 'Okunan ayetler (toplam)', quranDaysWeek: 'Bu hafta Kur’an okunan günler', storybooksRead: 'Açılan masal kitapları',
      prayerStarsWeek: 'Bu hafta işaretlenen namazlar', hifzAyahs: 'Hafızlık planındaki ayetler', dhikrWeek: 'Bu hafta zikir sayısı',
    },
    cardsTitle: 'Teşvik kartı gönder', to: 'Kime', card: 'Kart', n: 'Sayı (isteğe bağlı)', send: 'Gönder', sent: 'Kart gönderildi.',
    cardsNote: 'Kartlar hazır şablonlardır — serbest metin yoktur, çocuklar için güvenlidir.',
    inbox: 'Bana gelen kartlar', none: 'Henüz kart yok.', from: (n) => `Gönderen: ${n}`, newCard: 'Size yeni bir teşvik kartı geldi!', del: 'Sil', close: 'Kapat',
    joinTitle: 'Aile çevresine davet', joinLead: (o) => `${o} sizi aile çevresine davet ediyor.`, join: 'Katıl', joined: 'Aile çevresine katıldınız.',
    err: {
      inCircle: 'Zaten bir aile çevresindesiniz — önce ondan ayrılın.', token: 'Davet bağlantısı geçersiz, kullanılmış ya da süresi dolmuş.',
      full: 'Çevre dolu (en fazla 8 kişi).', tooMany: 'Çok fazla açık davet var — birini iptal edin.', consent: 'Devam etmek için onayınızı verin.',
      rate: 'Bugün çok fazla kart gönderildi. Yarın tekrar deneyin.', net: 'Ağ hatası. Tekrar deneyin.', unknown: 'Olmadı. Tekrar deneyin.',
    },
  },
  ar: {
    title: 'دائرة العائلة', lead: 'اربط حسابات أفراد عائلتك: يشارك كل واحد الملخّص الذي يختاره، ويمكنكم إرسال بطاقات تشجيع بعضكم لبعض.',
    create: 'أنشئ دائرة العائلة', invite: 'أنشئ رابط دعوة', inviteNote: 'الرابط يُستخدم مرة واحدة ويعمل 7 أيام. لا ينضم إلا حساب مسجَّل الدخول.',
    inviteLink: 'رابط الدعوة', copy: 'انسخ الرابط', copied: 'تم النسخ', share: 'مشاركة',
    openInvites: 'دعوات مفتوحة', revoke: 'ألغِ', until: (d) => `ينتهي: ${d}`,
    members: 'الأعضاء', owner: 'المالك', member: 'عضو', you: 'أنت', removeMember: 'إخراج', leave: 'غادر الدائرة', dissolve: 'احذف الدائرة',
    confirm: 'هل أنت متأكد؟', yes: 'نعم', cancel: 'إلغاء', notShared: 'لا يشارك شيئًا بعد.', updated: (d) => `حُدّث: ${d}`,
    shareTitle: 'ما أشاركه', shareLead: 'تُحسب الأرقام التي تختارها على هذا الجهاز ولا يُرسل إلى الخادم غيرها. تبقى بقية بياناتك مشفّرة.',
    consent: 'أوافق على حفظ أرقام الملخّص التي أختارها في الخادم لتُعرض على دائرة عائلتي.', consentNeed: 'أكّد موافقتك للمتابعة.',
    fromProfile: (n) => `تؤخذ الأرقام من الملف النشط: ${n}`,
    save: 'شارك / حدّث', stop: 'أوقف المشاركة', shared: 'تمت المشاركة.', stopped: 'أُوقفت المشاركة.',
    fields: {
      quranAyahsTotal: 'الآيات المقروءة (إجمالًا)', quranDaysWeek: 'أيام قراءة القرآن هذا الأسبوع', storybooksRead: 'كتب القصص المفتوحة',
      prayerStarsWeek: 'الصلوات المسجّلة هذا الأسبوع', hifzAyahs: 'الآيات في خطة الحفظ', dhikrWeek: 'عدد الأذكار هذا الأسبوع',
    },
    cardsTitle: 'أرسل بطاقة تشجيع', to: 'إلى', card: 'البطاقة', n: 'رقم (اختياري)', send: 'أرسل', sent: 'أُرسلت البطاقة.',
    cardsNote: 'البطاقات قوالب جاهزة بلا نص حرّ، فهي آمنة للأطفال.',
    inbox: 'بطاقات وصلتني', none: 'لا بطاقات بعد.', from: (n) => `من ${n}`, newCard: 'وصلتك بطاقة تشجيع جديدة!', del: 'حذف', close: 'إغلاق',
    joinTitle: 'دعوة إلى دائرة العائلة', joinLead: (o) => `يدعوك ${o} إلى دائرة عائلته.`, join: 'انضمام', joined: 'انضممت إلى دائرة العائلة.',
    err: {
      inCircle: 'أنت في دائرة عائلة بالفعل — غادرها أولًا.', token: 'رابط الدعوة غير صحيح أو مستخدم أو منتهي الصلاحية.',
      full: 'الدائرة ممتلئة (حتى 8 أشخاص).', tooMany: 'دعوات مفتوحة كثيرة — ألغِ واحدة.', consent: 'أكّد موافقتك للمتابعة.',
      rate: 'أُرسلت بطاقات كثيرة اليوم. حاول غدًا.', net: 'خطأ في الشبكة. حاول مجددًا.', unknown: 'لم ينجح ذلك. حاول مجددًا.',
    },
  },
}

// Təşviq kartlarının mətni — server yalnız şablon id-si + istəyə bağlı rəqəm saxlayır
export const CARDS = {
  az: {
    mashallah: () => 'MaşaAllah, belə davam et!',
    letters: (n) => (n ? `Bu gün ${n} hərf öyrəndin, maşaAllah!` : 'Bu gün yeni hərflər öyrəndin, maşaAllah!'),
    quran: (n) => (n ? `Bu gün ${n} ayə oxudun — Allah qəbul etsin!` : 'Bu gün Quran oxudun — Allah qəbul etsin!'),
    prayer: () => 'Namazlarını vaxtında qıldın — çox sevindim!',
    story: () => 'Nağıl kitabını oxuduğun üçün təşəkkür edirəm!',
    hifz: (n) => (n ? `${n} ayə əzbərlədin — Quran qəlbinə nur olsun!` : 'Yeni ayələr əzbərlədin — Quran qəlbinə nur olsun!'),
    dua: () => 'Sənin üçün dua edirəm.',
    proud: () => 'Səninlə fəxr edirəm!',
  },
  en: {
    mashallah: () => 'MashaAllah, keep it up!',
    letters: (n) => (n ? `You learned ${n} letters today, mashaAllah!` : 'You learned new letters today, mashaAllah!'),
    quran: (n) => (n ? `You read ${n} ayahs today — may Allah accept it!` : 'You read the Quran today — may Allah accept it!'),
    prayer: () => 'You prayed on time — that made me so happy!',
    story: () => 'Thank you for reading your storybook!',
    hifz: (n) => (n ? `You memorised ${n} ayahs — may the Quran be a light in your heart!` : 'You memorised new ayahs — may the Quran be a light in your heart!'),
    dua: () => 'I am making dua for you.',
    proud: () => 'I am proud of you!',
  },
  ru: {
    mashallah: () => 'МашаАллах, так держать!',
    letters: (n) => (n ? `Сегодня ты выучил(а) букв: ${n}, машаАллах!` : 'Сегодня ты выучил(а) новые буквы, машаАллах!'),
    quran: (n) => (n ? `Сегодня ты прочитал(а) аятов: ${n} — да примет Аллах!` : 'Сегодня ты читал(а) Коран — да примет Аллах!'),
    prayer: () => 'Ты совершил(а) намазы вовремя — я очень рад(а)!',
    story: () => 'Спасибо, что прочитал(а) свою книжку!',
    hifz: (n) => (n ? `Ты выучил(а) наизусть аятов: ${n} — пусть Коран будет светом в твоём сердце!` : 'Ты выучил(а) новые аяты — пусть Коран будет светом в твоём сердце!'),
    dua: () => 'Я делаю за тебя дуа.',
    proud: () => 'Я горжусь тобой!',
  },
  tr: {
    mashallah: () => 'Maşallah, böyle devam et!',
    letters: (n) => (n ? `Bugün ${n} harf öğrendin, maşallah!` : 'Bugün yeni harfler öğrendin, maşallah!'),
    quran: (n) => (n ? `Bugün ${n} ayet okudun — Allah kabul etsin!` : 'Bugün Kur’an okudun — Allah kabul etsin!'),
    prayer: () => 'Namazlarını vaktinde kıldın — çok sevindim!',
    story: () => 'Masal kitabını okuduğun için teşekkür ederim!',
    hifz: (n) => (n ? `${n} ayet ezberledin — Kur’an kalbine nur olsun!` : 'Yeni ayetler ezberledin — Kur’an kalbine nur olsun!'),
    dua: () => 'Senin için dua ediyorum.',
    proud: () => 'Seninle gurur duyuyorum!',
  },
  ar: {
    mashallah: () => 'ما شاء الله، واصل!',
    letters: (n) => (n ? `تعلّمت اليوم ${n} حروف، ما شاء الله!` : 'تعلّمت اليوم حروفًا جديدة، ما شاء الله!'),
    quran: (n) => (n ? `قرأت اليوم ${n} آيات — تقبّل الله منك!` : 'قرأت القرآن اليوم — تقبّل الله منك!'),
    prayer: () => 'صلّيت صلواتك في وقتها — فرحت كثيرًا!',
    story: () => 'شكرًا لأنك قرأت كتاب القصص!',
    hifz: (n) => (n ? `حفظت ${n} آيات — جعل الله القرآن نورًا في قلبك!` : 'حفظت آيات جديدة — جعل الله القرآن نورًا في قلبك!'),
    dua: () => 'أدعو لك.',
    proud: () => 'أنا فخور بك!',
  },
}
export const CARD_N = new Set(['letters', 'quran', 'hifz'])

export function famError(e, t) {
  if (e && e.status === 429) return t.err.rate
  const c = e && e.code
  if (c === 'in_circle') return t.err.inCircle
  if (c === 'invalid_token') return t.err.token
  if (c === 'circle_full') return t.err.full
  if (c === 'too_many') return t.err.tooMany
  if (c === 'consent_required') return t.err.consent
  if (e instanceof TypeError) return t.err.net
  return t.err.unknown
}
