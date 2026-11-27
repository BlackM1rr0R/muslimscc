// ═══════════════════════════════════════════════════════
// Admin: Instagram avtoposteri (server/instagram.js, docs/INSTAGRAM.md) — oxumaq üçün bölmə
//   GET  /api/admin/instagram          — vəziyyət, yuvalar, növbəti yuva, son dərclər (admin / superadmin)
//   POST /api/admin/instagram/preview  — kartın önizləməsi (JPEG), DƏRC ETMİR (yalnız superadmin)
//   POST /api/admin/instagram/publish  — bu günün yuvasını indi dərc et, təsdiqlə (yalnız superadmin)
// Reel bölməsi: status.reel (bu günün videosu CI-dan gəlibmi, dərc vəziyyəti); superadmin — /api/ig/card/<tarix>-reel.mp4 keçidi
// Token və hesab açarları heç vaxt brauzerə gəlmir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { apiFetch } from '../../api/http'
import { AdminHeader, AdminEmpty, AdminAlert, SectionTitle } from './AdminUi'
import { Confirm } from '../community/CommunityUi'
import '../../styles/ReadTogether.css'

const T = {
  az: {
    title: 'Instagram', lead: 'Gündə 3 dəfə avtomatik post və story: günün ayəsi, hədisi, duası və ya Allahın adı — yalnız saytın mətnləri, mənbəsi ilə.',
    loading: 'Yüklənir...', loadErr: 'Məlumatı yükləmək olmadı.', status: 'Vəziyyət', on: 'Açıqdır', off: 'Sönülüdür',
    reasons: { disabled: 'IG_ENABLED=1 təyin edilməyib', missing_credentials: 'IG_ACCESS_TOKEN və ya IG_USER_ID yoxdur', bad_format: 'Giriş açarı və ya hesab ID-si yararsızdır', auth_error: 'Instagram giriş açarını qəbul etmədi — yeni açar lazımdır' },
    lang: 'Dil', stories: 'Story', yes: 'Bəli', no: 'Xeyr', slots: 'Yuvalar', next: 'Növbəti yuva', token: 'Giriş açarı', tokenEnv: 'api.env-dən', tokenRefreshed: 'avtomatik yenilənib', expires: 'bitir',
    kinds: { ayah: 'Ayə', hadith: 'Hədis', extra: 'Dua / Allahın adı', dua: 'Dua', name: 'Allahın adı' },
    posts: 'Son dərclər', none: 'Hələ dərc yoxdur.', st: { published: 'Dərc olunub', claimed: 'Gedir', retry: 'Təkrar gözləyir', failed: 'Alınmadı' },
    preview: 'Kartın önizləməsi', previewLead: 'Kart çəkilir və burada göstərilir — Instagram-a heç nə göndərilmir.', slot: 'Yuva', format: 'Format', feed: 'Post (4:5)', story: 'Story (9:16)',
    show: 'Kartı göstər', busy: 'Hazırlanır...', previewErr: 'Kartı hazırlamaq olmadı.', noItem: 'Kartda sığan mətn tapılmadı.', caption: 'Mətn (caption)', alt: 'Instagram kartının önizləməsi',
    publish: 'İndi dərc et', publishLead: 'Bu günün seçilmiş yuvası dərhal Instagram-a göndərilir (post + story). Hər yuva üçün gündə bir dəfə.',
    confirm: 'Həqiqətən Instagram-a dərc edilsin?', cancel: 'Ləğv et', sent: 'Göndərildi — nəticə bir neçə dəqiqəyə "Son dərclər"də görünəcək.', publishErr: 'Dərc başlamadı.',
    // lang-ok[Reel]: Instagram-ın video formatının adı (Reels)
    reel: 'Reel — günün ayəsinin videosu', reelLead: 'Video hər gün GitHub Actions-da hazırlanır və serverə yüklənir (serverdə çəkilmir). Dərc yalnız IG_REELS=1 olanda, göstərilən vaxtda.', reelOff: 'IG_REELS=1 təyin edilməyib — video dərc olunmur.',
    reelTime: 'Dərc vaxtı', reelFile: 'Bu günün videosu', reelReady: 'hazırdır', reelMissing: 'hələ yüklənməyib', reelSound: { alafasy: 'tilavət ilə', none: 'səssiz' },
    // lang-ok[Reel]: Instagram-ın video formatının adı (Reels)
    reelPost: 'Dərc', reelNotYet: 'hələ dərc olunmayıb', reelOpen: 'Videoya bax', reelFmt: 'Reel (video)',
    // lang-ok[karusel,Karusel]: Instagram formatının adı (Carousel)
    carousel: 'Həftəlik karusel', carouselFmt: 'Karusel',
    carouselLead: 'Həftədə bir dəfə 7 kart: üz qabığı, 5 element (növbə ilə Allahın adları, Buxari və Müslimdən hədislər, Quran ayələri) və bağlanış kartı. Yalnız saytın mənbəli mətnləri.',
    // lang-ok[karusel,karuseli]: Instagram formatının adı (Carousel)
    carouselOff: 'IG_CAROUSEL=1 təyin edilməyib — karusel dərc olunmur.', carouselWhen: 'Vaxt', carouselNext: 'Növbəti', carouselPost: 'Bu günün karuseli',
    themes: { name: 'Allahın adları', hadith: 'Buxari və Müslimdən hədislər', ayah: 'Quran ayələri' },
    weekdays: ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'],
    // lang-ok[Heşteqlər]: Azərbaycanca işlənən termin (hashtag)
    growth: 'Kəşf ayarları', altText: 'Şəkil təsviri (alt_text)', location: 'Məkan (IG_LOCATION_ID)', hashtags: 'Heşteqlər', hashtagsVal: (n) => `postda ən çox ${n}, hər gün növbə ilə`,
    insights: 'Statistika — son 30 gün', insightsLead: 'Öz postlarımızın əhatəsi, yadda saxlanma və paylaşılma sayı — gündə bir dəfə yenilənir. Yalnız ümumi rəqəmlər, heç bir şəxsi məlumat yoxdur.',
    // lang-ok[Use]: Meta tətbiqindəki bölmənin adı (Use cases) tərcümə olunmur
    insNoPerm: 'Giriş açarının statistikaya icazəsi yoxdur. Meta tətbiqi → Use cases → Instagram → Permissions: instagram_manage_insights (Instagram Login-də instagram_business_manage_insights) əlavə edin, sistem istifadəçisinin tokenini yenidən yaradın və api.env-ə yazın. Dərc buna görə dayanmır.',
    insToken: 'Statistika sorğusunda giriş açarı qəbul edilmədi.', insOff: 'IG_INSIGHTS=0 — statistika toplanmır.', insEmpty: 'Hələ məlumat yoxdur — ilk dərcdən bir gün sonra görünəcək.',
    insKind: 'Növ', insSlot: 'Vaxt', insPosts: 'Post', insReach: 'Əhatə', insSaved: 'Saxlanılıb', insShares: 'Paylaşılıb', insBestKind: 'Ən çox əhatə — növ', insBestSlot: 'Ən çox əhatə — vaxt', insChecked: 'Yeniləndi',
  },
  en: {
    title: 'Instagram', lead: 'Automatic post and story 3 times a day: verse, hadith, dua or a name of Allah of the day — only the site’s own texts, with their source.',
    loading: 'Loading...', loadErr: 'Could not load the data.', status: 'Status', on: 'On', off: 'Off',
    reasons: { disabled: 'IG_ENABLED=1 is not set', missing_credentials: 'IG_ACCESS_TOKEN or IG_USER_ID is missing', bad_format: 'The token or account ID is invalid', auth_error: 'Instagram rejected the token — a new token is needed' },
    lang: 'Language', stories: 'Story', yes: 'Yes', no: 'No', slots: 'Slots', next: 'Next slot', token: 'Token', tokenEnv: 'from api.env', tokenRefreshed: 'refreshed automatically', expires: 'expires',
    kinds: { ayah: 'Verse', hadith: 'Hadith', extra: 'Dua / Name of Allah', dua: 'Dua', name: 'Name of Allah' },
    posts: 'Recent posts', none: 'Nothing has been published yet.', st: { published: 'Published', claimed: 'In progress', retry: 'Waiting to retry', failed: 'Failed' },
    preview: 'Card preview', previewLead: 'The card is rendered and shown here — nothing is sent to Instagram.', slot: 'Slot', format: 'Format', feed: 'Post (4:5)', story: 'Story (9:16)',
    show: 'Show card', busy: 'Preparing...', previewErr: 'Could not prepare the card.', noItem: 'No text fits on the card.', caption: 'Caption', alt: 'Instagram card preview',
    publish: 'Publish now', publishLead: 'Today’s chosen slot is sent to Instagram right away (post + story). Once per slot per day.',
    confirm: 'Really publish to Instagram?', cancel: 'Cancel', sent: 'Sent — the result will appear under “Recent posts” in a few minutes.', publishErr: 'Publishing did not start.',
    reel: 'Reel — verse of the day video', reelLead: 'The video is prepared daily in GitHub Actions and uploaded to the server (it is not rendered on the server). Published only with IG_REELS=1, at the time shown.', reelOff: 'IG_REELS=1 is not set — reels are not published.',
    reelTime: 'Publish time', reelFile: 'Today’s video', reelReady: 'ready', reelMissing: 'not uploaded yet', reelSound: { alafasy: 'with recitation', none: 'silent' },
    reelPost: 'Publishing', reelNotYet: 'not published yet', reelOpen: 'Watch the video', reelFmt: 'Reel video',
    carousel: 'Weekly carousel', carouselFmt: 'Carousel',
    carouselLead: 'Once a week, 7 cards: a cover, 5 items (in turn: Names of Allah, hadiths from al-Bukhari and Muslim, verses of the Quran) and a closing card. Only the site’s sourced texts.',
    carouselOff: 'IG_CAROUSEL=1 is not set — the carousel is not published.', carouselWhen: 'Time', carouselNext: 'Next', carouselPost: 'Today’s carousel',
    themes: { name: 'Names of Allah', hadith: 'Hadiths from al-Bukhari and Muslim', ayah: 'Verses of the Quran' },
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    growth: 'Discovery settings', altText: 'Image description (alt_text)', location: 'Location (IG_LOCATION_ID)', hashtags: 'Hashtags', hashtagsVal: (n) => `at most ${n} per post, rotating daily`,
    insights: 'Statistics — last 30 days', insightsLead: 'Reach, saves and shares of our own posts — updated once a day. Totals only, no personal data.',
    insNoPerm: 'The token has no permission for statistics. In the Meta app → Use cases → Instagram → Permissions add instagram_manage_insights (instagram_business_manage_insights with Instagram Login), regenerate the system user token and put it into api.env. Publishing is not affected.',
    insToken: 'The statistics request did not accept the token.', insOff: 'IG_INSIGHTS=0 — statistics are not collected.', insEmpty: 'No data yet — it appears a day after the first post.',
    insKind: 'Type', insSlot: 'Time', insPosts: 'Posts', insReach: 'Reach', insSaved: 'Saved', insShares: 'Shared', insBestKind: 'Highest reach — type', insBestSlot: 'Highest reach — time', insChecked: 'Updated',
  },
  ru: {
    title: 'Instagram', lead: 'Автоматический пост и история 3 раза в день: аят, хадис, дуа или имя Аллаха дня — только тексты сайта, с источником.',
    loading: 'Загрузка...', loadErr: 'Не удалось загрузить данные.', status: 'Состояние', on: 'Включено', off: 'Выключено',
    // lang-ok: api.env dəyişənlərinin adları (IG_ENABLED, api.env) tərcümə olunmur
    reasons: { disabled: 'IG_ENABLED=1 не задан', missing_credentials: 'Нет IG_ACCESS_TOKEN или IG_USER_ID', bad_format: 'Токен или ID аккаунта недействительны', auth_error: 'Instagram не принял токен — нужен новый токен' },
    // lang-ok: api.env dəyişənlərinin adları (IG_ENABLED, api.env) tərcümə olunmur
    lang: 'Язык', stories: 'История', yes: 'Да', no: 'Нет', slots: 'Время публикаций', next: 'Следующая публикация', token: 'Токен', tokenEnv: 'из api.env', tokenRefreshed: 'обновлён автоматически', expires: 'истекает',
    kinds: { ayah: 'Аят', hadith: 'Хадис', extra: 'Дуа / имя Аллаха', dua: 'Дуа', name: 'Имя Аллаха' },
    posts: 'Последние публикации', none: 'Публикаций пока нет.', st: { published: 'Опубликовано', claimed: 'Выполняется', retry: 'Ждёт повтора', failed: 'Не удалось' },
    preview: 'Предпросмотр карточки', previewLead: 'Карточка создаётся и показывается здесь — в Instagram ничего не отправляется.', slot: 'Публикация', format: 'Формат', feed: 'Пост (4:5)', story: 'История (9:16)',
    show: 'Показать карточку', busy: 'Готовится...', previewErr: 'Не удалось подготовить карточку.', noItem: 'Не найден текст, который помещается на карточку.', caption: 'Подпись', alt: 'Предпросмотр карточки Instagram',
    publish: 'Опубликовать сейчас', publishLead: 'Выбранная публикация сегодняшнего дня сразу отправляется в Instagram (пост + история). Один раз в день для каждой.',
    confirm: 'Точно опубликовать в Instagram?', cancel: 'Отмена', sent: 'Отправлено — результат появится в «Последних публикациях» через несколько минут.', publishErr: 'Публикация не началась.',
    // lang-ok: GitHub Actions və IG_REELS (api.env dəyişəni) tərcümə olunmur
    reel: 'Ролик — видео аята дня', reelLead: 'Видео каждый день готовится в GitHub Actions и загружается на сервер (на сервере не создаётся). Публикуется только при IG_REELS=1, в указанное время.', reelOff: 'IG_REELS=1 не задан — ролики не публикуются.',
    reelTime: 'Время публикации', reelFile: 'Видео на сегодня', reelReady: 'готово', reelMissing: 'ещё не загружено', reelSound: { alafasy: 'с чтением Корана', none: 'без звука' },
    reelPost: 'Публикация', reelNotYet: 'ещё не опубликовано', reelOpen: 'Смотреть видео', reelFmt: 'Видеоролик',
    carousel: 'Еженедельная карусель', carouselFmt: 'Карусель',
    carouselLead: 'Раз в неделю 7 карточек: обложка, 5 элементов (по очереди: имена Аллаха, хадисы из аль-Бухари и Муслима, аяты Корана) и заключительная карточка. Только тексты сайта с источниками.',
    // lang-ok: IG_CAROUSEL — имя переменной api.env, не переводится
    carouselOff: 'IG_CAROUSEL=1 не задан — карусель не публикуется.', carouselWhen: 'Время', carouselNext: 'Следующая', carouselPost: 'Карусель сегодня',
    themes: { name: 'Имена Аллаха', hadith: 'Хадисы из аль-Бухари и Муслима', ayah: 'Аяты Корана' },
    weekdays: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
    // lang-ok: alt_text и IG_LOCATION_ID — названия параметров API / api.env
    growth: 'Настройки охвата', altText: 'Описание изображения (alt_text)', location: 'Место (IG_LOCATION_ID)', hashtags: 'Хештеги', hashtagsVal: (n) => `не больше ${n} на пост, по очереди каждый день`,
    insights: 'Статистика — последние 30 дней', insightsLead: 'Охват, сохранения и репосты наших собственных публикаций — обновляется раз в день. Только общие цифры, без личных данных.',
    // lang-ok: названия разделов Meta, разрешений и api.env не переводятся
    insNoPerm: 'У токена нет доступа к статистике. В приложении Meta → Use cases → Instagram → Permissions добавьте instagram_manage_insights (для Instagram Login — instagram_business_manage_insights), заново создайте токен системного пользователя и запишите его в api.env. Публикации это не останавливает.',
    // lang-ok: IG_INSIGHTS — имя переменной api.env
    insToken: 'Запрос статистики не принял токен.', insOff: 'IG_INSIGHTS=0 — статистика не собирается.', insEmpty: 'Данных пока нет — они появятся через день после первой публикации.',
    insKind: 'Тип', insSlot: 'Время', insPosts: 'Посты', insReach: 'Охват', insSaved: 'Сохранения', insShares: 'Репосты', insBestKind: 'Наибольший охват — тип', insBestSlot: 'Наибольший охват — время', insChecked: 'Обновлено',
  },
  ar: {
    title: 'إنستغرام', lead: 'منشور وقصة تلقائيًا 3 مرات يوميًا: آية اليوم أو حديثه أو دعاؤه أو اسم من أسماء الله — من نصوص الموقع فقط مع مصدرها.',
    loading: 'جارٍ التحميل...', loadErr: 'تعذّر تحميل البيانات.', status: 'الحالة', on: 'مفعّل', off: 'متوقف',
    // lang-ok: api.env dəyişənlərinin adları (IG_ENABLED, api.env) tərcümə olunmur
    reasons: { disabled: 'لم يُضبط IG_ENABLED=1', missing_credentials: 'IG_ACCESS_TOKEN أو IG_USER_ID غير موجود', bad_format: 'الرمز أو معرّف الحساب غير صالح', auth_error: 'رفض إنستغرام الرمز — يلزم رمز جديد' },
    // lang-ok: api.env dəyişənlərinin adları (IG_ENABLED, api.env) tərcümə olunmur
    lang: 'اللغة', stories: 'القصة', yes: 'نعم', no: 'لا', slots: 'أوقات النشر', next: 'النشر التالي', token: 'الرمز', tokenEnv: 'من api.env', tokenRefreshed: 'جُدّد تلقائيًا', expires: 'ينتهي',
    kinds: { ayah: 'آية', hadith: 'حديث', extra: 'دعاء / اسم من أسماء الله', dua: 'دعاء', name: 'اسم من أسماء الله' },
    posts: 'آخر المنشورات', none: 'لم يُنشر شيء بعد.', st: { published: 'نُشر', claimed: 'قيد التنفيذ', retry: 'بانتظار إعادة المحاولة', failed: 'تعذّر' },
    preview: 'معاينة البطاقة', previewLead: 'تُنشأ البطاقة وتُعرض هنا — لا يُرسل شيء إلى إنستغرام.', slot: 'وقت النشر', format: 'الشكل', feed: 'منشور (4:5)', story: 'قصة (9:16)',
    show: 'اعرض البطاقة', busy: 'جارٍ التحضير...', previewErr: 'تعذّر تحضير البطاقة.', noItem: 'لم يُعثر على نص يتسع في البطاقة.', caption: 'نص المنشور', alt: 'معاينة بطاقة إنستغرام',
    publish: 'انشر الآن', publishLead: 'يُرسل وقت النشر المختار لهذا اليوم إلى إنستغرام فورًا (منشور + قصة). مرة واحدة يوميًا لكل وقت.',
    confirm: 'هل تريد النشر على إنستغرام فعلًا؟', cancel: 'إلغاء', sent: 'أُرسل — ستظهر النتيجة في «آخر المنشورات» خلال دقائق.', publishErr: 'لم يبدأ النشر.',
    // lang-ok: GitHub Actions və IG_REELS (api.env dəyişəni) tərcümə olunmur
    reel: 'ريلز — فيديو آية اليوم', reelLead: 'يُحضَّر الفيديو يوميًا في GitHub Actions ويُرفع إلى الخادم (لا يُنشأ على الخادم). يُنشر فقط عند ضبط IG_REELS=1 وفي الوقت المحدد.', reelOff: 'لم يُضبط IG_REELS=1 — لا تُنشر مقاطع الريلز.',
    reelTime: 'وقت نشر الفيديو', reelFile: 'فيديو اليوم', reelReady: 'جاهز', reelMissing: 'لم يُرفع بعد', reelSound: { alafasy: 'مع التلاوة', none: 'بدون صوت' },
    reelPost: 'النشر', reelNotYet: 'لم يُنشر بعد', reelOpen: 'شاهد الفيديو', reelFmt: 'فيديو ريلز',
    carousel: 'المنشور الدوّار الأسبوعي', carouselFmt: 'منشور دوّار',
    carouselLead: 'مرة في الأسبوع 7 بطاقات: غلاف و5 عناصر (بالتناوب: أسماء الله الحسنى، أحاديث من البخاري ومسلم، آيات من القرآن) وبطاقة ختامية. من نصوص الموقع الموثقة فقط.',
    // lang-ok: IG_CAROUSEL — اسم متغير في api.env
    carouselOff: 'لم يُضبط IG_CAROUSEL=1 — لا يُنشر المنشور الدوّار.', carouselWhen: 'الوقت', carouselNext: 'القادم', carouselPost: 'منشور اليوم الدوّار',
    themes: { name: 'أسماء الله الحسنى', hadith: 'أحاديث من البخاري ومسلم', ayah: 'آيات من القرآن الكريم' },
    weekdays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    // lang-ok: alt_text و IG_LOCATION_ID — أسماء معاملات
    growth: 'إعدادات الوصول', altText: 'وصف الصورة (alt_text)', location: 'الموقع الجغرافي (IG_LOCATION_ID)', hashtags: 'الوسوم', hashtagsVal: (n) => `${n} وسوم كحد أقصى لكل منشور، بالتناوب يوميًا`,
    insights: 'الإحصاءات — آخر 30 يومًا', insightsLead: 'الوصول والحفظ والمشاركة لمنشوراتنا — تُحدَّث مرة يوميًا. أرقام إجمالية فقط دون بيانات شخصية.',
    // lang-ok: أسماء أقسام Meta والصلاحيات و api.env لا تُترجم
    insNoPerm: 'الرمز لا يملك صلاحية الإحصاءات. في تطبيق Meta ← Use cases ← Instagram ← Permissions أضف instagram_manage_insights (أو instagram_business_manage_insights مع Instagram Login)، ثم أنشئ رمز مستخدم النظام من جديد وضعه في api.env. النشر لا يتوقف بسبب ذلك.',
    // lang-ok: IG_INSIGHTS — اسم متغير في api.env
    insToken: 'لم يُقبل الرمز في طلب الإحصاءات.', insOff: 'IG_INSIGHTS=0 — لا تُجمع الإحصاءات.', insEmpty: 'لا توجد بيانات بعد — تظهر بعد يوم من أول منشور.',
    insKind: 'النوع', insSlot: 'الوقت', insPosts: 'المنشورات', insReach: 'الوصول', insSaved: 'الحفظ', insShares: 'المشاركة', insBestKind: 'أعلى وصول — النوع', insBestSlot: 'أعلى وصول — الوقت', insChecked: 'آخر تحديث',
  },
  tr: {
    title: 'Instagram', lead: 'Günde 3 kez otomatik gönderi ve hikâye: günün ayeti, hadisi, duası veya Allah’ın bir ismi — yalnızca sitenin metinleri, kaynağıyla.',
    loading: 'Yükleniyor...', loadErr: 'Veriler yüklenemedi.', status: 'Durum', on: 'Açık', off: 'Kapalı',
    reasons: { disabled: 'IG_ENABLED=1 ayarlanmamış', missing_credentials: 'IG_ACCESS_TOKEN veya IG_USER_ID yok', bad_format: 'Token veya hesap kimliği geçersiz', auth_error: 'Instagram token’ı kabul etmedi — yeni token gerekli' },
    lang: 'Dil', stories: 'Hikâye', yes: 'Evet', no: 'Hayır', slots: 'Paylaşım saatleri', next: 'Sonraki paylaşım', token: 'Token', tokenEnv: 'api.env’den', tokenRefreshed: 'otomatik yenilendi', expires: 'bitiş',
    kinds: { ayah: 'Ayet', hadith: 'Hadis', extra: 'Dua / Allah’ın ismi', dua: 'Dua', name: 'Allah’ın ismi' },
    posts: 'Son paylaşımlar', none: 'Henüz paylaşım yok.', st: { published: 'Paylaşıldı', claimed: 'Sürüyor', retry: 'Yeniden deneme bekliyor', failed: 'Olmadı' },
    preview: 'Kart önizlemesi', previewLead: 'Kart hazırlanır ve burada gösterilir — Instagram’a hiçbir şey gönderilmez.', slot: 'Paylaşım', format: 'Biçim', feed: 'Gönderi (4:5)', story: 'Hikâye (9:16)',
    show: 'Kartı göster', busy: 'Hazırlanıyor...', previewErr: 'Kart hazırlanamadı.', noItem: 'Karta sığan metin bulunamadı.', caption: 'Açıklama', alt: 'Instagram kartı önizlemesi',
    publish: 'Şimdi paylaş', publishLead: 'Bugünün seçilen paylaşımı hemen Instagram’a gönderilir (gönderi + hikâye). Her paylaşım için günde bir kez.',
    confirm: 'Gerçekten Instagram’da paylaşılsın mı?', cancel: 'İptal', sent: 'Gönderildi — sonuç birkaç dakika içinde “Son paylaşımlar”da görünecek.', publishErr: 'Paylaşım başlamadı.',
    reel: 'Reel — günün ayeti videosu', reelLead: 'Video her gün GitHub Actions’ta hazırlanır ve sunucuya yüklenir (sunucuda oluşturulmaz). Yalnızca IG_REELS=1 olduğunda, gösterilen saatte paylaşılır.', reelOff: 'IG_REELS=1 ayarlanmamış — reel paylaşılmaz.',
    reelTime: 'Paylaşım saati', reelFile: 'Bugünün videosu', reelReady: 'hazır', reelMissing: 'henüz yüklenmedi', reelSound: { alafasy: 'tilavetle', none: 'sessiz' },
    reelPost: 'Paylaşım', reelNotYet: 'henüz paylaşılmadı', reelOpen: 'Videoyu izle', reelFmt: 'Reel videosu',
    carousel: 'Haftalık karusel', carouselFmt: 'Karusel',
    carouselLead: 'Haftada bir 7 kart: kapak, 5 öğe (sırayla Allah’ın isimleri, Buhârî ve Müslim’den hadisler, Kur’an ayetleri) ve kapanış kartı. Yalnızca sitenin kaynaklı metinleri.',
    carouselOff: 'IG_CAROUSEL=1 ayarlanmamış — karusel paylaşılmaz.', carouselWhen: 'Saat', carouselNext: 'Sonraki', carouselPost: 'Bugünün karuseli',
    themes: { name: 'Allah’ın isimleri', hadith: 'Buhârî ve Müslim’den hadisler', ayah: 'Kur’an ayetleri' },
    weekdays: ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'],
    // lang-ok[text]: API parametrinin adı (alt_text)
    growth: 'Keşfet ayarları', altText: 'Görsel açıklaması (alt_text)', location: 'Konum (IG_LOCATION_ID)', hashtags: 'Etiketler', hashtagsVal: (n) => `gönderi başına en fazla ${n}, her gün sırayla`,
    insights: 'İstatistikler — son 30 gün', insightsLead: 'Kendi gönderilerimizin erişimi, kaydedilme ve paylaşılma sayıları — günde bir kez güncellenir. Yalnızca toplam rakamlar, kişisel veri yok.',
    insNoPerm: 'Token’ın istatistik izni yok. Meta uygulaması → Use cases → Instagram → Permissions bölümünde instagram_manage_insights (Instagram Login ile instagram_business_manage_insights) ekleyin, sistem kullanıcısı token’ını yeniden oluşturup api.env’e yazın. Paylaşım bundan etkilenmez.',
    insToken: 'İstatistik isteği token’ı kabul etmedi.', insOff: 'IG_INSIGHTS=0 — istatistik toplanmıyor.', insEmpty: 'Henüz veri yok — ilk paylaşımdan bir gün sonra görünür.',
    insKind: 'Tür', insSlot: 'Saat', insPosts: 'Gönderi', insReach: 'Erişim', insSaved: 'Kaydedilen', insShares: 'Paylaşılan', insBestKind: 'En yüksek erişim — tür', insBestSlot: 'En yüksek erişim — saat', insChecked: 'Güncellendi',
  },
}

const fmtTime = (ms, lang) => {
  if (!ms) return ''
  try { return new Date(ms).toLocaleString(lang === 'az' ? 'az-Latn-AZ' : lang, { dateStyle: 'medium', timeStyle: 'short' }) } catch { return new Date(ms).toISOString().slice(0, 16) }
}

export default function InstagramManager({ superAdmin = false }) {
  const { lang } = useLang()
  const l = pickUi(T, lang, 'en')
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(() => {
    setFailed(false)
    return apiFetch('/api/admin/instagram', { admin: true }).then(setData).catch(() => { setFailed(true); setData(null) })
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div data-testid="admin-instagram">
      <AdminHeader icon="instagram" title={l.title} sub={l.lead} />
      {failed && <AdminAlert>{l.loadErr}</AdminAlert>}
      {!data && !failed && <AdminEmpty icon="instagram" busy>{l.loading}</AdminEmpty>}
      {data && <Status l={l} lang={lang} data={data} />}
      {data && superAdmin && <Preview l={l} slots={data.slots} />}
      {data && superAdmin && data.enabled && data.reason !== 'auth_error' && <PublishNow l={l} slots={data.slots} onDone={load} />}
      {data && data.reel && <Reel l={l} reel={data.reel} superAdmin={superAdmin} />}
      {data && data.carousel && <Carousel l={l} c={data.carousel} />}
      {data && data.growth && <Growth l={l} g={data.growth} />}
      {data && data.insights && <Insights l={l} lang={lang} ins={data.insights} />}
      {data && <Posts l={l} lang={lang} posts={data.posts} />}
    </div>
  )
}

function Status({ l, lang, data }) {
  const on = data.enabled && data.reason !== 'auth_error'
  return (
    <section className="admin-section" aria-label={l.status}>
      <SectionTitle icon="instagram" tone={on ? undefined : 'neutral'}>{l.status}: {on ? l.on : l.off}</SectionTitle>
      {!on && data.reason && <p className="admin-section-lead" data-testid="ig-reason">{l.reasons[data.reason] || data.reason}</p>}
      <dl className="ig-facts">
        <div><dt>{l.lang}</dt><dd>{String(data.lang || '').toUpperCase()}</dd></div>
        <div><dt>{l.stories}</dt><dd>{data.stories ? l.yes : l.no}</dd></div>
        <div><dt>{l.slots}</dt><dd>{data.slots.map((s) => `${s.time} — ${l.kinds[s.kind] || s.kind}`).join(' · ')} <span className="rt-note">({data.timezone})</span></dd></div>
        {data.next && <div><dt>{l.next}</dt><dd>{data.next.date} {data.next.time} — {l.kinds[data.next.kind] || data.next.kind}</dd></div>}
        {data.token && <div><dt>{l.token}</dt><dd>{data.token.source === 'refreshed' ? l.tokenRefreshed : l.tokenEnv}{data.token.refreshedAt ? ` · ${fmtTime(data.token.refreshedAt, lang)}` : ''}{data.token.expiresAt ? ` · ${l.expires} ${fmtTime(data.token.expiresAt, lang)}` : ''}</dd></div>}
      </dl>
    </section>
  )
}

function SlotPicker({ l, slots, value, onChange, id }) {
  return (
    <label className="ig-field" htmlFor={id}>
      <span>{l.slot}</span>
      <select id={id} className="ui-input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {slots.map((s, i) => <option key={s.time} value={i}>{s.time} — {l.kinds[s.kind] || s.kind}</option>)}
      </select>
    </label>
  )
}

function Preview({ l, slots }) {
  const [slot, setSlot] = useState(0)
  const [format, setFormat] = useState('feed')
  const [busy, setBusy] = useState(false)
  const [img, setImg] = useState(null)
  const [caption, setCaption] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => () => { if (img) URL.revokeObjectURL(img) }, [img])
  const show = async () => {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/admin/instagram/preview', {
        method: 'POST', credentials: 'include', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ slot, format }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => null)
        setErr(j && j.code === 'no_fitting_item' ? l.noItem : l.previewErr)
        return
      }
      const blob = await r.blob()
      let cap = ''
      try { cap = decodeURIComponent(r.headers.get('X-Ig-Caption') || '') } catch { /* */ }
      setCaption(cap)
      setImg(URL.createObjectURL(blob))
    } catch { setErr(l.previewErr) } finally { setBusy(false) }
  }
  return (
    <section className="admin-section" aria-label={l.preview}>
      <SectionTitle icon="eye">{l.preview}</SectionTitle>
      <p className="admin-section-lead">{l.previewLead}</p>
      <div className="ig-row">
        <SlotPicker l={l} slots={slots} value={slot} onChange={setSlot} id="ig-preview-slot" />
        <label className="ig-field" htmlFor="ig-preview-format">
          <span>{l.format}</span>
          <select id="ig-preview-format" className="ui-input" value={format} onChange={(e) => setFormat(e.target.value === 'story' ? 'story' : 'feed')}>
            <option value="feed">{l.feed}</option>
            <option value="story">{l.story}</option>
          </select>
        </label>
        <button type="button" className="ui-btn ui-btn--primary" onClick={show} disabled={busy} data-testid="ig-preview-btn">{busy ? l.busy : l.show}</button>
      </div>
      {err && <AdminAlert>{err}</AdminAlert>}
      {img && (
        <div className="ig-preview">
          <img src={img} alt={l.alt} width={format === 'story' ? 270 : 324} height={format === 'story' ? 480 : 405} data-testid="ig-preview-img" />
          {caption && <div><h3 className="ig-caption-title">{l.caption}</h3><pre className="ig-caption" dir="auto">{caption}</pre></div>}
        </div>
      )}
    </section>
  )
}

function PublishNow({ l, slots, onDone }) {
  const [slot, setSlot] = useState(0)
  const [msg, setMsg] = useState(null)
  const go = () => {
    setMsg(null)
    apiFetch('/api/admin/instagram/publish', { method: 'POST', admin: true, body: { slot, confirm: true } })
      .then(() => { setMsg({ ok: true, text: l.sent }); setTimeout(onDone, 4000) })
      .catch(() => setMsg({ ok: false, text: l.publishErr }))
  }
  return (
    <section className="admin-section" aria-label={l.publish}>
      <SectionTitle icon="send" tone="accent">{l.publish}</SectionTitle>
      <p className="admin-section-lead">{l.publishLead}</p>
      <div className="ig-row">
        <SlotPicker l={l} slots={slots} value={slot} onChange={setSlot} id="ig-publish-slot" />
        <Confirm t={{ confirm: l.confirm, yes: l.yes, cancel: l.cancel }} label={l.publish} icon="send" testId="ig-publish" onYes={go} />
      </div>
      {msg && (msg.ok ? <p className="rt-note" role="status">{msg.text}</p> : <AdminAlert>{msg.text}</AdminAlert>)}
    </section>
  )
}

// Reel (günün ayəsinin videosu): bu günün faylı (CI yükləyib?) + dərc vəziyyəti; superadmin — videoya keçid
function Reel({ l, reel, superAdmin }) {
  const f = reel.file, p = reel.post
  return (
    <section className="admin-section" aria-label={l.reel} data-testid="ig-reel">
      <SectionTitle icon="play" tone={reel.enabled ? undefined : 'neutral'}>{l.reel}</SectionTitle>
      <p className="admin-section-lead">{reel.enabled ? l.reelLead : l.reelOff}</p>
      <dl className="ig-facts">
        <div><dt>{l.reelTime}</dt><dd>{reel.time}</dd></div>
        <div><dt>{l.reelFile}</dt><dd data-testid="ig-reel-file">{reel.date} — {f ? `${l.reelReady} · ${f.ref}${f.lang ? ` (${f.lang})` : ''} · ${l.reelSound[f.audio] || f.audio} · ${(f.durationMs / 1000).toFixed(1)} s · ${(f.size / 1048576).toFixed(1)} MB` : l.reelMissing}</dd></div>
        <div><dt>{l.reelPost}</dt><dd>{p ? <>{l.st[p.status] || p.status}{p.error && p.status !== 'published' ? <span className="rt-note"> · {p.error}</span> : null}</> : l.reelNotYet}</dd></div>
      </dl>
      {superAdmin && reel.url && <p><a className="ui-btn" href={reel.url} target="_blank" rel="noopener noreferrer" data-testid="ig-reel-link">{l.reelOpen}</a></p>}
    </section>
  )
}

// Həftəlik karusel: gün / vaxt, növbəti tarix və mövzu, bu günün dərc vəziyyəti
function Carousel({ l, c }) {
  const p = c.post
  return (
    <section className="admin-section" aria-label={l.carousel} data-testid="ig-carousel">
      <SectionTitle icon="image" tone={c.enabled ? undefined : 'neutral'}>{l.carousel}</SectionTitle>
      <p className="admin-section-lead">{c.enabled ? l.carouselLead : l.carouselOff}</p>
      <dl className="ig-facts">
        <div><dt>{l.carouselWhen}</dt><dd>{l.weekdays[c.day] || c.day} {c.time}</dd></div>
        {c.next && <div><dt>{l.carouselNext}</dt><dd>{c.next.date} — {l.themes[c.next.theme] || c.next.theme}</dd></div>}
        {p && <div><dt>{l.carouselPost}</dt><dd>{l.st[p.status] || p.status}{p.error && p.status !== 'published' ? <span className="rt-note"> · {p.error}</span> : null}</dd></div>}
      </dl>
    </section>
  )
}

function Growth({ l, g }) {
  return (
    <section className="admin-section" aria-label={l.growth}>
      <SectionTitle icon="search">{l.growth}</SectionTitle>
      <dl className="ig-facts">
        <div><dt>{l.altText}</dt><dd>{g.altText ? l.yes : l.no}</dd></div>
        <div><dt>{l.location}</dt><dd>{g.location ? l.yes : l.no}</dd></div>
        <div><dt>{l.hashtags}</dt><dd>{l.hashtagsVal(g.hashtagsMax)}</dd></div>
      </dl>
    </section>
  )
}

// Öz postlarımızın statistikası (insights): icazə yoxdursa necə əlavə ediləcəyi göstərilir; dərcə təsir etmir
function Insights({ l, lang, ins }) {
  const kindName = (r) => `${l.kinds[r.kind] || l.themes[r.kind] || r.kind} · ${r.format === 'reel' ? l.reelFmt : r.format === 'carousel' ? l.carouselFmt : l.feed}`
  const note = !ins.enabled ? l.insOff : ins.state === 'no_permission' ? l.insNoPerm : ins.state === 'token_error' ? l.insToken : null
  const bestKind = ins.best && ins.best.kind ? ins.byKind.find((r) => r.kind === ins.best.kind.kind && r.format === ins.best.kind.format) : null
  return (
    <section className="admin-section" aria-label={l.insights} data-testid="ig-insights">
      <SectionTitle icon="analytics" tone={note ? 'neutral' : undefined}>{l.insights}</SectionTitle>
      <p className="admin-section-lead">{l.insightsLead}</p>
      {note && <p className="admin-section-lead" data-testid="ig-insights-note">{note}</p>}
      {!note && !ins.byKind.length && <AdminEmpty icon="analytics">{l.insEmpty}</AdminEmpty>}
      {ins.byKind.length > 0 && (
        <>
          <dl className="ig-facts">
            {bestKind && <div><dt>{l.insBestKind}</dt><dd>{kindName(bestKind)}</dd></div>}
            {ins.best && ins.best.slot && <div><dt>{l.insBestSlot}</dt><dd>{ins.best.slot}</dd></div>}
            {ins.checkedAt && <div><dt>{l.insChecked}</dt><dd>{fmtTime(ins.checkedAt, lang)}</dd></div>}
          </dl>
          <div className="ig-table-wrap">
            <table className="ig-table">
              <thead><tr><th scope="col">{l.insKind}</th><th scope="col">{l.insPosts}</th><th scope="col">{l.insReach}</th><th scope="col">{l.insSaved}</th><th scope="col">{l.insShares}</th></tr></thead>
              <tbody>
                {ins.byKind.map((r) => (
                  <tr key={`${r.kind}-${r.format}`}><td>{kindName(r)}</td><td>{r.posts}</td><td>{r.reach ?? '—'}</td><td>{r.saved ?? '—'}</td><td>{r.shares ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {ins.bySlot.length > 0 && (
            <div className="ig-table-wrap">
              <table className="ig-table">
                <thead><tr><th scope="col">{l.insSlot}</th><th scope="col">{l.insPosts}</th><th scope="col">{l.insReach}</th><th scope="col">{l.insSaved}</th><th scope="col">{l.insShares}</th></tr></thead>
                <tbody>
                  {ins.bySlot.map((r) => (
                    <tr key={r.slot}><td>{r.slot}</td><td>{r.posts}</td><td>{r.reach ?? '—'}</td><td>{r.saved ?? '—'}</td><td>{r.shares ?? '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Posts({ l, lang, posts }) {
  return (
    <section className="admin-section" aria-label={l.posts}>
      <SectionTitle icon="list">{l.posts}</SectionTitle>
      {!posts.length && <AdminEmpty icon="instagram">{l.none}</AdminEmpty>}
      {posts.length > 0 && (
        <div className="ig-table-wrap">
          <table className="ig-table">
            <tbody>
              {posts.map((p) => (
                <tr key={`${p.day}-${p.slot}-${p.format}`}>
                  <td>{p.day} {p.slot}</td>
                  <td>{p.format === 'story' ? l.story : p.format === 'reel' ? l.reelFmt : p.format === 'carousel' ? l.carouselFmt : l.feed}</td>
                  <td>{p.format === 'carousel' ? (l.themes[p.kind] || p.kind) : (l.kinds[p.kind] || p.kind)}{p.item ? <span className="rt-note"> · {p.item}</span> : null}</td>
                  <td>{l.st[p.status] || p.status}{p.error && p.status !== 'published' ? <span className="rt-note"> · {p.error}</span> : null}</td>
                  <td className="rt-note">{fmtTime(p.updated_at, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
