import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import { parsePath } from '../seo/routes'
import {
  GROUP_ID_RE, createGroup, getGroup, claimJuz, markDone, releaseJuz, joinGoal, tickDay, leaveGoal, adminAction,
  localRoom, saveLocalRoom, forgetLocalRoom, localRooms, savedName, saveName, localDate, streakOf,
} from '../api/groups'
import { BarChart, ChartFigure, ProgressRing } from '../components/viz'
import '../styles/GroupPage.css'

/* ══════════════════════════════════════════════════════════════════
   QRUP XƏTMİ VƏ ORTAQ HƏDƏFLƏR — /group (təqdimat + yaratma) və
   /group/<id> (otaq). Hesab YOXDUR: idarəetmə açarı və iştirak
   tokenləri yalnız bu brauzerdədir (src/api/groups.js).

   Riya'dan qorunmaq üçün hədəf otağında SIRALAMA yoxdur: iştirakçılar
   ada görə düzülür, yalnız hər kəsin öz faizi görünür; ardıcıl günlər
   yalnız istifadəçinin özünə göstərilir.
   ══════════════════════════════════════════════════════════════════ */

const POLL_MS = 20000

const LABELS = {
  az: {
    eyebrow: 'Birlikdə ibadət', title: 'Qrup xətmi və ortaq hədəflər',
    lead: 'Ailə, dostlar və ya icma üçün otaq yarat: Quranı 30 cüzə bölüb birlikdə xətm edin və ya "40 gün sübh namazı vaxtında" kimi bir vərdişi bir-birinizi ruhlandıraraq davam etdirin. Hesab lazım deyil — yalnız keçidi paylaş.',
    khatmTitle: 'Qrup xətmi', khatmText: 'Hər kəs adını yazıb bir və ya bir neçə cüz götürür, oxuyub bitirəndə işarələyir. 30 cüzün hamısı oxunanda xətm tamamlanır.',
    goalTitle: 'Ortaq hədəf', goalText: 'Hər iştirakçı hər gün özü üçün bir dəfə işarə qoyur. Sıralama yoxdur — yalnız hər kəsin öz irəliləyişi.',
    createTitle: 'Otaq yarat', type: 'Növ', fieldTitle: 'Otağın adı',
    titlePhKhatm: 'Məsələn: Ailəmizin Ramazan xətmi', titlePhGoal: 'Məsələn: Dostlarla sübh namazı',
    goalKind: 'Hədəf', fajr40: '40 gün sübh namazı vaxtında', custom: 'Öz hədəfim',
    days: 'Gün sayı', label: 'Hər gün nə edəcəksiniz?', labelPh: 'Məsələn: hər gün Qurandan 1 səhifə',
    create: 'Otağı yarat', creating: 'Yaradılır…',
    adminHint: 'Otağı idarə etmək açarı yalnız bu brauzerdə saxlanılır. Brauzer məlumatlarını silsən, idarəetmə imkanı itər.',
    myRooms: 'Bu brauzerdə açdığın otaqlar', forget: 'Siyahıdan çıxar', newRoom: 'Yeni otaq yarat',
    privacyNote: 'Yalnız yazdığın görünən ad saxlanılır; IP ünvanı və başqa şəxsi məlumat yazılmır. Son fəaliyyətdən 180 gün sonra otaq avtomatik silinir.',
    invalid: 'Sahələri yoxla: ad ən azı 2 simvol olmalıdır.',
    loading: 'Yüklənir…', notFound: 'Otaq tapılmadı. Silinmiş, müddəti bitmiş və ya keçid səhv ola bilər.',
    netErr: 'Serverə qoşulmaq alınmadı. Bir az sonra yenidən yoxla.', back: 'Qrup otaqları',
    share: 'Keçidi paylaş', copied: 'Keçid kopyalandı', copyFail: 'Keçidi kopyalamaq alınmadı',
    closedNote: 'Otaq bağlanıb — yeni dəyişiklik qəbul olunmur.', youAdmin: 'Bu otağı sən yaratmısan',
    yourName: 'Adın (başqaları görəcək)', namePh: 'Məsələn: Əli', needName: 'Əvvəlcə adını yaz.',
    progress: (d) => `${d} / 30 cüz oxunub`, juz: (n) => `Cüz ${n}`, round: (n) => `Xətm № ${n}`,
    claim: 'Götür', markDone: 'Oxudum', undo: 'Geri al', release: 'Burax', free: 'Boş', doneTag: 'Oxunub', readingTag: 'Oxunur', mine: 'Sənin',
    completedTitle: 'Xətm tamamlandı — əlhəmdulillah', completedText: 'Allah qəbul etsin.',
    completions: (n) => `Tamamlanmış xətmlər: ${n}`,
    duaTitle: 'Xətm duası haqqında',
    duaNote: 'Peyğəmbərdən ﷺ Quranın xətmi üçün xüsusi səhih dua gəlməyib. Ənəs ibn Malikin (Allah ondan razı olsun) Quranı xətm edəndə ailəsini toplayıb dua etdiyi rəvayət olunur (əd-Darimi; bəzi alimlər isnadını səhih sayıb). Bunun xüsusi mətni və mərasimi yoxdur — istədiyin duanı öz dilində et.',
    khatmNote: 'Hər kəs öz cüzünü özü oxuyur. Bu, bir-birini Quran oxumağa həvəsləndirmək üçündür, xüsusi ibadət forması deyil.',
    admin: 'İdarəetmə', resetKhatm: 'Yeni xətmə başla', resetGoal: 'İşarələri sıfırla', close: 'Otağı bağla', reopen: 'Otağı aç',
    del: 'Otağı sil', remove: 'Adı sil', confirmReset: 'Bütün götürülmüş cüzlər və ya işarələr silinsin?',
    confirmDel: 'Otaq birdəfəlik silinsin?', confirmRemove: (n) => `"${n}" silinsin?`, deleted: 'Otaq silindi',
    joinTitle: 'Hədəfə qoşul', join: 'Qoşul', leave: 'Hədəfdən çıx', confirmLeave: 'Hədəfdən çıxılsın? İşarələrin silinəcək.',
    today: 'Bu gün', yesterday: 'Dünən', myProgress: 'Sənin irəliləyişin', lastDays: 'Son 7 gün',
    streak: (n) => `Ardıcıl: ${n} gün`, daysDone: (d, t) => `${d} / ${t} gün`,
    participants: (n) => `İştirakçılar: ${n}`, groupAvg: (p) => `Qrupun ümumi irəliləyişi: ${p}%`,
    noRank: 'Burada sıralama yoxdur: əməl Allah üçündür, göstəriş (riya) üçün deyil. Faizlər yalnız bir-birinizi ruhlandırmaq üçündür; iştirakçılar ada görə düzülür.',
    fajrNote: 'Peyğəmbər ﷺ demişdir: "Münafiqlərə sübh və işa namazlarından ağır namaz yoxdur." 40 gün yalnız vərdiş qazanmaq üçün seçilmiş müddətdir — bu rəqəmə xüsusi fəzilət aid etmirik.',
    fajrSrc: 'əl-Buxari 657',
    goalDone: 'Hədəf tamamlandı — Allah qəbul etsin', empty: 'Hələ heç kim qoşulmayıb.',
    errTaken: 'Bu cüzü artıq başqası götürüb.', errLimit: 'Çox sayda sorğu. Bir az gözlə.', errFull: 'Otaq doludur.',
    errGeneric: 'Alınmadı. Yenidən yoxla.', errForbidden: 'Bu əməliyyata icazə yoxdur (bu brauzerdə açar tapılmadı).', errClosed: 'Otaq bağlanıb.',
    typeKhatm: 'Xətm', typeGoal: 'Hədəf', goalDays: (n) => `${n} günlük hədəf`,
  },
  en: {
    eyebrow: 'Worship together', title: 'Group khatm and shared goals',
    lead: 'Create a room for family, friends or your community: split the Qur’an into 30 juz and complete a khatm together, or keep up a habit such as “40 days of Fajr on time” while encouraging one another. No account needed — just share the link.',
    khatmTitle: 'Group khatm', khatmText: 'Everyone types a name, claims one or more juz and marks it when finished. When all 30 juz are read, the khatm is complete.',
    goalTitle: 'Shared goal', goalText: 'Each participant ticks once a day for themselves. There is no ranking — only each person’s own progress.',
    createTitle: 'Create a room', type: 'Type', fieldTitle: 'Room name',
    titlePhKhatm: 'e.g. Our family’s Ramadan khatm', titlePhGoal: 'e.g. Fajr with friends',
    goalKind: 'Goal', fajr40: '40 days of Fajr on time', custom: 'My own goal',
    days: 'Number of days', label: 'What will you do each day?', labelPh: 'e.g. one page of the Qur’an every day',
    create: 'Create room', creating: 'Creating…',
    adminHint: 'The key to manage this room is kept only in this browser. If you clear your browser data, you will lose the ability to manage it.',
    myRooms: 'Rooms opened in this browser', forget: 'Remove from list', newRoom: 'Create a new room',
    privacyNote: 'Only the display name you type is stored; no IP address or other personal data is kept. Rooms are deleted automatically 180 days after the last activity.',
    invalid: 'Check the fields: names must be at least 2 characters.',
    loading: 'Loading…', notFound: 'Room not found. It may have been deleted or expired, or the link is wrong.',
    netErr: 'Could not reach the server. Please try again shortly.', back: 'Group rooms',
    share: 'Share link', copied: 'Link copied', copyFail: 'Could not copy the link',
    closedNote: 'This room is closed — no new changes are accepted.', youAdmin: 'You created this room',
    yourName: 'Your name (others will see it)', namePh: 'e.g. Ali', needName: 'Type your name first.',
    progress: (d) => `${d} / 30 juz read`, juz: (n) => `Juz ${n}`, round: (n) => `Khatm #${n}`,
    claim: 'Claim', markDone: 'I read it', undo: 'Undo', release: 'Release', free: 'Free', doneTag: 'Read', readingTag: 'Reading', mine: 'Yours',
    completedTitle: 'Khatm completed — alhamdulillah', completedText: 'May Allah accept it.',
    completions: (n) => `Completed khatms: ${n}`,
    duaTitle: 'About the khatm dua',
    duaNote: 'There is no specific authentic dua from the Prophet ﷺ for completing the Qur’an. It is reported that Anas ibn Malik (may Allah be pleased with him) gathered his family when he completed the Qur’an and made dua (ad-Darimi; some scholars authenticated its chain). It has no fixed wording or ceremony — make whatever dua you wish, in your own language.',
    khatmNote: 'Each person reads their own juz. This is a way to encourage one another to read the Qur’an, not a special form of worship.',
    admin: 'Manage', resetKhatm: 'Start a new khatm', resetGoal: 'Reset ticks', close: 'Close room', reopen: 'Reopen room',
    del: 'Delete room', remove: 'Remove name', confirmReset: 'Remove all claimed juz or ticks?',
    confirmDel: 'Delete this room permanently?', confirmRemove: (n) => `Remove “${n}”?`, deleted: 'Room deleted',
    joinTitle: 'Join the goal', join: 'Join', leave: 'Leave goal', confirmLeave: 'Leave the goal? Your ticks will be removed.',
    today: 'Today', yesterday: 'Yesterday', myProgress: 'Your progress', lastDays: 'Last 7 days',
    streak: (n) => `Streak: ${n} ${n === 1 ? 'day' : 'days'}`, daysDone: (d, t) => `${d} / ${t} days`,
    participants: (n) => `Participants: ${n}`, groupAvg: (p) => `Group progress: ${p}%`,
    noRank: 'There is no ranking here: deeds are for Allah, not for show (riya’). The percentages are only to encourage one another; participants are listed by name.',
    fajrNote: 'The Prophet ﷺ said: “No prayer is heavier upon the hypocrites than Fajr and ‘Isha.” Forty days is simply a period chosen to build a habit — we do not attach any special virtue to the number.',
    fajrSrc: 'al-Bukhari 657',
    goalDone: 'Goal completed — may Allah accept it', empty: 'Nobody has joined yet.',
    errTaken: 'Someone else has already claimed this juz.', errLimit: 'Too many requests. Please wait a little.', errFull: 'The room is full.',
    errGeneric: 'Something went wrong. Please try again.', errForbidden: 'Not allowed (no key for this in this browser).', errClosed: 'The room is closed.',
    typeKhatm: 'Khatm', typeGoal: 'Goal', goalDays: (n) => `${n}-day goal`,
  },
  ru: {
    eyebrow: 'Поклонение вместе', title: 'Коллективный хатм и общие цели',
    lead: 'Создайте комнату для семьи, друзей или общины: разделите Коран на 30 джузов и завершите хатм вместе или поддерживайте привычку вроде «40 дней фаджр вовремя», вдохновляя друг друга. Учётная запись не нужна — просто поделитесь ссылкой.',
    khatmTitle: 'Коллективный хатм', khatmText: 'Каждый пишет своё имя, берёт один или несколько джузов и отмечает их по прочтении. Когда прочитаны все 30 джузов, хатм завершён.',
    goalTitle: 'Общая цель', goalText: 'Каждый участник отмечает себя раз в день. Рейтинга нет — только собственный прогресс каждого.',
    createTitle: 'Создать комнату', type: 'Тип', fieldTitle: 'Название комнаты',
    titlePhKhatm: 'Например: семейный хатм в Рамадан', titlePhGoal: 'Например: фаджр с друзьями',
    goalKind: 'Цель', fajr40: '40 дней фаджр вовремя', custom: 'Своя цель',
    days: 'Количество дней', label: 'Что вы будете делать каждый день?', labelPh: 'Например: одна страница Корана в день',
    create: 'Создать комнату', creating: 'Создаётся…',
    adminHint: 'Ключ управления комнатой хранится только в этом браузере. Если очистить данные браузера, управление будет потеряно.',
    myRooms: 'Комнаты, открытые в этом браузере', forget: 'Убрать из списка', newRoom: 'Создать новую комнату',
    privacyNote: 'Хранится только отображаемое имя, которое вы ввели; сетевой адрес и другие личные данные не сохраняются. Комната удаляется автоматически через 180 дней после последней активности.',
    invalid: 'Проверьте поля: название должно содержать не менее 2 символов.',
    loading: 'Загрузка…', notFound: 'Комната не найдена. Возможно, она удалена, срок её действия истёк или ссылка неверна.',
    netErr: 'Не удалось связаться с сервером. Попробуйте чуть позже.', back: 'Групповые комнаты',
    share: 'Поделиться ссылкой', copied: 'Ссылка скопирована', copyFail: 'Не удалось скопировать ссылку',
    closedNote: 'Комната закрыта — изменения не принимаются.', youAdmin: 'Эту комнату создали вы',
    yourName: 'Ваше имя (его увидят другие)', namePh: 'Например: Али', needName: 'Сначала введите имя.',
    progress: (d) => `Прочитано джузов: ${d} из 30`, juz: (n) => `Джуз ${n}`, round: (n) => `Хатм № ${n}`,
    claim: 'Взять', markDone: 'Прочитал', undo: 'Отменить', release: 'Освободить', free: 'Свободен', doneTag: 'Прочитан', readingTag: 'Читается', mine: 'Ваш',
    completedTitle: 'Хатм завершён — альхамдулиллях', completedText: 'Да примет Аллах.',
    completions: (n) => `Завершённых хатмов: ${n}`,
    duaTitle: 'О дуа при завершении Корана',
    duaNote: 'От Пророка ﷺ не передано особого достоверного дуа для завершения Корана. Сообщается, что Анас ибн Малик (да будет доволен им Аллах), завершая Коран, собирал свою семью и делал дуа (ад-Дарими; некоторые учёные признали иснад достоверным). У этого нет особого текста или обряда — делайте любое дуа на своём языке.',
    khatmNote: 'Каждый читает свой джуз сам. Это способ побуждать друг друга к чтению Корана, а не особая форма поклонения.',
    admin: 'Управление', resetKhatm: 'Начать новый хатм', resetGoal: 'Сбросить отметки', close: 'Закрыть комнату', reopen: 'Открыть комнату',
    del: 'Удалить комнату', remove: 'Удалить имя', confirmReset: 'Удалить все взятые джузы или отметки?',
    confirmDel: 'Удалить комнату навсегда?', confirmRemove: (n) => `Удалить «${n}»?`, deleted: 'Комната удалена',
    joinTitle: 'Присоединиться к цели', join: 'Присоединиться', leave: 'Выйти из цели', confirmLeave: 'Выйти из цели? Ваши отметки будут удалены.',
    today: 'Сегодня', yesterday: 'Вчера', myProgress: 'Ваш прогресс', lastDays: 'Последние 7 дней',
    streak: (n) => `Подряд: ${n} дн.`, daysDone: (d, t) => `${d} из ${t} дн.`,
    participants: (n) => `Участников: ${n}`, groupAvg: (p) => `Общий прогресс группы: ${p}%`,
    noRank: 'Здесь нет рейтинга: дела совершаются ради Аллаха, а не напоказ (рия). Проценты нужны лишь для взаимной поддержки; участники упорядочены по имени.',
    fajrNote: 'Пророк ﷺ сказал: «Нет для лицемеров молитвы тяжелее, чем фаджр и иша». Сорок дней — просто срок для выработки привычки; мы не приписываем этому числу особой добродетели.',
    fajrSrc: 'аль-Бухари 657',
    goalDone: 'Цель достигнута — да примет Аллах', empty: 'Пока никто не присоединился.',
    errTaken: 'Этот джуз уже взял кто-то другой.', errLimit: 'Слишком много запросов. Подождите немного.', errFull: 'Комната заполнена.',
    errGeneric: 'Не получилось. Попробуйте ещё раз.', errForbidden: 'Нет доступа (в этом браузере нет ключа).', errClosed: 'Комната закрыта.',
    typeKhatm: 'Хатм', typeGoal: 'Цель', goalDays: (n) => `цель на ${n} дн.`,
  },
  ar: {
    eyebrow: 'عبادة جماعية', title: 'الختمة الجماعية والأهداف المشتركة',
    lead: 'أنشئ غرفة لأهلك أو أصدقائك أو جماعتك: قسّموا القرآن ثلاثين جزءًا واختموه معًا، أو حافظوا على عادة مثل «أربعين يومًا على صلاة الفجر في وقتها» يشجّع بعضكم بعضًا. لا حاجة إلى حساب — شارك الرابط فقط.',
    khatmTitle: 'الختمة الجماعية', khatmText: 'يكتب كل واحد اسمه ويأخذ جزءًا أو أكثر، ثم يعلّم عليه إذا أتمّ قراءته. فإذا قُرئت الأجزاء الثلاثون تمّت الختمة.',
    goalTitle: 'هدف مشترك', goalText: 'يعلّم كل مشارك لنفسه مرة واحدة في اليوم. لا ترتيب بين المشاركين — بل تقدّم كل واحد بنفسه فقط.',
    createTitle: 'إنشاء غرفة', type: 'النوع', fieldTitle: 'اسم الغرفة',
    titlePhKhatm: 'مثال: ختمة العائلة في رمضان', titlePhGoal: 'مثال: الفجر مع الأصدقاء',
    goalKind: 'الهدف', fajr40: 'أربعون يومًا على الفجر في وقتها', custom: 'هدف خاص',
    days: 'عدد الأيام', label: 'ماذا ستفعلون كل يوم؟', labelPh: 'مثال: صفحة من القرآن كل يوم',
    create: 'أنشئ الغرفة', creating: 'جارٍ الإنشاء…',
    adminHint: 'مفتاح إدارة الغرفة محفوظ في هذا المتصفح فقط. إذا مسحت بيانات المتصفح فقدت إمكانية الإدارة.',
    myRooms: 'الغرف المفتوحة في هذا المتصفح', forget: 'إزالة من القائمة', newRoom: 'إنشاء غرفة جديدة',
    privacyNote: 'لا يُحفظ إلا الاسم الظاهر الذي تكتبه؛ لا يُحفظ عنوان بروتوكول الإنترنت ولا أي بيانات شخصية أخرى. تُحذف الغرفة تلقائيًا بعد 180 يومًا من آخر نشاط.',
    invalid: 'تحقّق من الحقول: يجب ألا يقل الاسم عن حرفين.',
    loading: 'جارٍ التحميل…', notFound: 'لم يتم العثور على الغرفة. ربما حُذفت أو انتهت مدتها أو الرابط غير صحيح.',
    netErr: 'تعذّر الاتصال بالخادم. حاول مرة أخرى بعد قليل.', back: 'الغرف الجماعية',
    share: 'مشاركة الرابط', copied: 'تم نسخ الرابط', copyFail: 'تعذّر نسخ الرابط',
    closedNote: 'الغرفة مغلقة — لا تُقبل تغييرات جديدة.', youAdmin: 'أنت من أنشأ هذه الغرفة',
    yourName: 'اسمك (سيراه الآخرون)', namePh: 'مثال: علي', needName: 'اكتب اسمك أولًا.',
    progress: (d) => `قُرئ ${d} من 30 جزءًا`, juz: (n) => `الجزء ${n}`, round: (n) => `الختمة رقم ${n}`,
    claim: 'خذه', markDone: 'قرأته', undo: 'تراجع', release: 'اتركه', free: 'متاح', doneTag: 'مقروء', readingTag: 'قيد القراءة', mine: 'لك',
    completedTitle: 'تمّت الختمة — الحمد لله', completedText: 'تقبّل الله.',
    completions: (n) => `الختمات المكتملة: ${n}`,
    duaTitle: 'عن دعاء الختم',
    duaNote: 'لم يثبت عن النبي ﷺ دعاء مخصوص لختم القرآن. ورُوي أن أنس بن مالك رضي الله عنه كان إذا ختم القرآن جمع أهله ودعا (رواه الدارمي، وصحّح بعض العلماء إسناده). وليس لذلك لفظ معيّن ولا هيئة مخصوصة — فادعُ بما شئت وبلغتك.',
    khatmNote: 'يقرأ كل واحد جزأه بنفسه. وهذا وسيلة لتشجيع بعضنا بعضًا على قراءة القرآن، لا صفة عبادة مخصوصة.',
    admin: 'الإدارة', resetKhatm: 'ابدأ ختمة جديدة', resetGoal: 'تصفير العلامات', close: 'أغلق الغرفة', reopen: 'افتح الغرفة',
    del: 'احذف الغرفة', remove: 'احذف الاسم', confirmReset: 'هل تريد حذف كل الأجزاء المأخوذة أو العلامات؟',
    confirmDel: 'هل تريد حذف الغرفة نهائيًا؟', confirmRemove: (n) => `هل تريد حذف «${n}»؟`, deleted: 'تم حذف الغرفة',
    joinTitle: 'انضم إلى الهدف', join: 'انضم', leave: 'اخرج من الهدف', confirmLeave: 'هل تريد الخروج؟ ستُحذف علاماتك.',
    today: 'اليوم', yesterday: 'أمس', myProgress: 'تقدّمك', lastDays: 'آخر 7 أيام',
    streak: (n) => `أيام متتالية: ${n}`, daysDone: (d, t) => `${d} من ${t} يومًا`,
    participants: (n) => `المشاركون: ${n}`, groupAvg: (p) => `تقدّم المجموعة: ${p}%`,
    noRank: 'لا ترتيب هنا: العمل لله لا للرياء. النسب للتشجيع فقط، والمشاركون مرتّبون بحسب الاسم.',
    fajrNote: 'قال النبي ﷺ: «ليس صلاةٌ أثقلَ على المنافقين من الفجر والعشاء». والأربعون يومًا مدة مختارة لاكتساب العادة فقط، ولا ننسب لهذا العدد فضلًا خاصًّا.',
    fajrSrc: 'البخاري 657',
    goalDone: 'تمّ الهدف — تقبّل الله', empty: 'لم ينضم أحد بعد.',
    errTaken: 'أخذ شخص آخر هذا الجزء.', errLimit: 'طلبات كثيرة. انتظر قليلًا.', errFull: 'الغرفة ممتلئة.',
    errGeneric: 'لم تنجح العملية. حاول مرة أخرى.', errForbidden: 'غير مسموح (لا يوجد مفتاح في هذا المتصفح).', errClosed: 'الغرفة مغلقة.',
    typeKhatm: 'ختمة', typeGoal: 'هدف', goalDays: (n) => `هدف لمدة ${n} يومًا`,
  },
  tr: {
    eyebrow: 'Birlikte ibadet', title: 'Grup hatmi ve ortak hedefler',
    lead: 'Aileniz, arkadaşlarınız veya cemaatiniz için bir oda oluşturun: Kur’an’ı 30 cüze bölüp birlikte hatmedin ya da “40 gün sabah namazını vaktinde” gibi bir alışkanlığı birbirinizi teşvik ederek sürdürün. Hesap gerekmez — sadece bağlantıyı paylaşın.',
    khatmTitle: 'Grup hatmi', khatmText: 'Herkes adını yazıp bir veya birkaç cüz alır, okuyup bitirince işaretler. 30 cüzün hepsi okununca hatim tamamlanır.',
    goalTitle: 'Ortak hedef', goalText: 'Her katılımcı günde bir kez kendisi için işaret koyar. Sıralama yoktur — yalnızca herkesin kendi ilerlemesi.',
    createTitle: 'Oda oluştur', type: 'Tür', fieldTitle: 'Odanın adı',
    titlePhKhatm: 'Örneğin: Ailemizin Ramazan hatmi', titlePhGoal: 'Örneğin: Arkadaşlarla sabah namazı',
    goalKind: 'Hedef', fajr40: '40 gün sabah namazı vaktinde', custom: 'Kendi hedefim',
    days: 'Gün sayısı', label: 'Her gün ne yapacaksınız?', labelPh: 'Örneğin: her gün Kur’an’dan 1 sayfa',
    create: 'Odayı oluştur', creating: 'Oluşturuluyor…',
    adminHint: 'Odayı yönetme anahtarı yalnızca bu tarayıcıda saklanır. Tarayıcı verilerini silerseniz yönetim imkânı kaybolur.',
    myRooms: 'Bu tarayıcıda açtığınız odalar', forget: 'Listeden çıkar', newRoom: 'Yeni oda oluştur',
    privacyNote: 'Yalnızca yazdığınız görünen ad saklanır; IP adresi ve diğer kişisel veriler kaydedilmez. Oda, son etkinlikten 180 gün sonra otomatik olarak silinir.',
    invalid: 'Alanları kontrol edin: ad en az 2 karakter olmalıdır.',
    loading: 'Yükleniyor…', notFound: 'Oda bulunamadı. Silinmiş, süresi dolmuş veya bağlantı hatalı olabilir.',
    netErr: 'Sunucuya bağlanılamadı. Biraz sonra tekrar deneyin.', back: 'Grup odaları',
    share: 'Bağlantıyı paylaş', copied: 'Bağlantı kopyalandı', copyFail: 'Bağlantı kopyalanamadı',
    closedNote: 'Oda kapatıldı — yeni değişiklik kabul edilmiyor.', youAdmin: 'Bu odayı siz oluşturdunuz',
    yourName: 'Adınız (başkaları görecek)', namePh: 'Örneğin: Ali', needName: 'Önce adınızı yazın.',
    progress: (d) => `30 cüzden ${d} tanesi okundu`, juz: (n) => `${n}. cüz`, round: (n) => `${n}. hatim`,
    claim: 'Al', markDone: 'Okudum', undo: 'Geri al', release: 'Bırak', free: 'Boşta', doneTag: 'Okundu', readingTag: 'Okunuyor', mine: 'Sizin',
    completedTitle: 'Hatim tamamlandı — elhamdülillah', completedText: 'Allah kabul etsin.',
    completions: (n) => `Tamamlanan hatimler: ${n}`,
    duaTitle: 'Hatim duası hakkında',
    duaNote: 'Peygamber’den ﷺ Kur’an’ı hatmetmek için özel ve sahih bir dua gelmemiştir. Enes bin Mâlik’in (Allah ondan razı olsun) Kur’an’ı hatmettiğinde ailesini toplayıp dua ettiği rivayet edilir (Dârimî; bazı âlimler senedini sahih saymıştır). Bunun belirli bir metni ya da merasimi yoktur — dilediğiniz duayı kendi dilinizle yapın.',
    khatmNote: 'Herkes kendi cüzünü kendisi okur. Bu, birbirini Kur’an okumaya teşvik etmek içindir, özel bir ibadet şekli değildir.',
    admin: 'Yönetim', resetKhatm: 'Yeni hatme başla', resetGoal: 'İşaretleri sıfırla', close: 'Odayı kapat', reopen: 'Odayı aç',
    del: 'Odayı sil', remove: 'Adı sil', confirmReset: 'Alınan bütün cüzler veya işaretler silinsin mi?',
    confirmDel: 'Oda kalıcı olarak silinsin mi?', confirmRemove: (n) => `“${n}” silinsin mi?`, deleted: 'Oda silindi',
    joinTitle: 'Hedefe katıl', join: 'Katıl', leave: 'Hedeften ayrıl', confirmLeave: 'Hedeften ayrılınsın mı? İşaretleriniz silinecek.',
    today: 'Bugün', yesterday: 'Dün', myProgress: 'Sizin ilerlemeniz', lastDays: 'Son 7 gün',
    streak: (n) => `Art arda: ${n} gün`, daysDone: (d, t) => `${t} günden ${d}`,
    participants: (n) => `Katılımcılar: ${n}`, groupAvg: (p) => `Grubun genel ilerlemesi: %${p}`,
    noRank: 'Burada sıralama yok: amel Allah içindir, gösteriş (riya) için değil. Yüzdeler yalnızca birbirinizi teşvik etmek içindir; katılımcılar ada göre sıralanır.',
    fajrNote: 'Peygamber ﷺ şöyle buyurdu: “Münafıklara sabah ve yatsı namazından daha ağır gelen bir namaz yoktur.” 40 gün yalnızca alışkanlık kazanmak için seçilmiş bir süredir — bu sayıya özel bir fazilet yüklemiyoruz.',
    fajrSrc: 'Buhârî 657',
    goalDone: 'Hedef tamamlandı — Allah kabul etsin', empty: 'Henüz kimse katılmadı.',
    errTaken: 'Bu cüzü zaten başka biri aldı.', errLimit: 'Çok fazla istek. Biraz bekleyin.', errFull: 'Oda dolu.',
    errGeneric: 'Olmadı. Tekrar deneyin.', errForbidden: 'Bu işlem için izin yok (bu tarayıcıda anahtar bulunamadı).', errClosed: 'Oda kapalı.',
    typeKhatm: 'Hatim', typeGoal: 'Hedef', goalDays: (n) => `${n} günlük hedef`,
  },
}

// ── Dizayn v3: təqdimat (addımlar, nümunə xəritə, temp qrafiki), otaq xəritəsi ──
// Hədis: «Quranı bir ayda oxu» … «yeddi gündə oxu, bundan artıq etmə» —
// əl-Buxari 5054 (Abdullah ibn Amr), fawazahmed0/hadith-api ilə yoxlanılıb.
const PACE_AR = 'اقْرَإِ الْقُرْآنَ فِي شَهْرٍ … فَاقْرَأْهُ فِي سَبْعٍ وَلاَ تَزِدْ عَلَى ذَلِكَ'
const PACE_GROUPS = [1, 3, 5, 10, 15, 30]
const V3 = {
  az: {
    lead: 'Ailə, dostlar və ya icma ilə Quranı 30 cüzə bölüb birlikdə xətm edin, ya da bir vərdişi birgə davam etdirin.',
    how: 'Hesab lazım deyil: otaq yarat, keçidi paylaş — hər kəs adını yazıb cüz götürür və ya hər gün işarə qoyur.',
    sampleTitle: 'Nümunə otaq', sampleSub: (d, r) => `${d} cüz oxunub · ${r} oxunur`,
    stepsEyebrow: 'Necə işləyir', stepsTitle: 'Dörd addımda qrup xətmi',
    steps: [
      { title: 'Otaq yarat', text: 'Növü seç (xətm və ya hədəf) və otağa ad ver.' },
      { title: 'Keçidi paylaş', text: 'Keçidi ailə və ya dostlarla mesajla göndər.' },
      { title: 'Cüz götür', text: 'Hər kəs adını yazır və boş cüzlərdən birini götürür.' },
      { title: '«Oxudum» işarələ', text: '30 cüzün hamısı işarələnəndə xətm tamamlanır.' },
    ],
    createEyebrow: 'Başla',
    paceEyebrow: 'Temp', paceTitle: 'Qrup böyüdükcə yük yüngülləşir', paceLead: 'Bir xətmdə 30 cüz var: iştirakçı çox olduqca hər kəsə düşən hissə azalır.',
    paceChart: 'Bir nəfərə düşən cüz', paceSub: 'Bir xətm üçün, iştirakçı sayına görə', people: (n) => `${n} nəfər`, juz: (n) => `${n} cüz`,
    paceNote: 'Hesab: 30 ÷ iştirakçı sayı.',
    hadithText: '«Quranı bir ayda oxu.» Abdullah: «Mən daha çoxuna güc tapıram», — dedi. Peyğəmbər ﷺ: «Onda yeddi gündə oxu, bundan artıq etmə», — buyurdu.',
    hadithSrc: 'əl-Buxari 5054 — Abdullah ibn Amrdan',
    mapTitle: '30 cüz xəritəsi', legendDone: 'Oxunub', legendReading: 'Oxunur', legendFree: 'Boş',
  },
  en: {
    lead: 'Split the Qur’an into 30 juz and complete a khatm together with family, friends or your community — or keep a habit going together.',
    how: 'No account needed: create a room and share the link — everyone types a name and claims a juz, or ticks once a day.',
    sampleTitle: 'Sample room', sampleSub: (d, r) => `${d} juz read · ${r} in progress`,
    stepsEyebrow: 'How it works', stepsTitle: 'A group khatm in four steps',
    steps: [
      { title: 'Create a room', text: 'Choose the type (khatm or goal) and name the room.' },
      { title: 'Share the link', text: 'Send the link to family or friends in a message.' },
      { title: 'Claim a juz', text: 'Everyone types a name and claims one of the free juz.' },
      { title: 'Mark «I read it»', text: 'When all 30 juz are marked, the khatm is complete.' },
    ],
    createEyebrow: 'Start',
    paceEyebrow: 'Pace', paceTitle: 'The bigger the group, the lighter the load', paceLead: 'A khatm has 30 juz: the more participants, the smaller each person’s share.',
    paceChart: 'Juz per person', paceSub: 'For one khatm, by number of participants', people: (n) => `${n} ${n === 1 ? 'person' : 'people'}`, juz: (n) => `${n} juz`,
    paceNote: 'Calculation: 30 ÷ number of participants.',
    hadithText: '“Read the Qur’an in a month.” Abdullah said: “I find myself able to do more.” He ﷺ said: “Then read it in seven days and do not go beyond that.”',
    hadithSrc: 'al-Bukhari 5054 — from Abdullah ibn Amr',
    mapTitle: 'Map of the 30 juz', legendDone: 'Read', legendReading: 'In progress', legendFree: 'Free',
  },
  ru: {
    lead: 'Разделите Коран на 30 джузов и завершите хатм вместе с семьёй, друзьями или общиной — или поддерживайте общую привычку.',
    how: 'Учётная запись не нужна: создайте комнату и поделитесь ссылкой — каждый пишет имя и берёт джуз или отмечается раз в день.',
    sampleTitle: 'Пример комнаты', sampleSub: (d, r) => `прочитано джузов: ${d} · читается: ${r}`,
    stepsEyebrow: 'Как это работает', stepsTitle: 'Коллективный хатм в четыре шага',
    steps: [
      { title: 'Создайте комнату', text: 'Выберите тип (хатм или цель) и назовите комнату.' },
      { title: 'Поделитесь ссылкой', text: 'Отправьте ссылку семье или друзьям в сообщении.' },
      { title: 'Возьмите джуз', text: 'Каждый пишет имя и берёт один из свободных джузов.' },
      { title: 'Отметьте «Прочитал»', text: 'Когда отмечены все 30 джузов, хатм завершён.' },
    ],
    createEyebrow: 'Начать',
    paceEyebrow: 'Темп', paceTitle: 'Чем больше группа, тем легче доля', paceLead: 'В хатме 30 джузов: чем больше участников, тем меньше доля каждого.',
    paceChart: 'Джузов на человека', paceSub: 'Для одного хатма, по числу участников', people: (n) => `${n} чел.`, juz: (n) => `${n} джуз.`,
    paceNote: 'Расчёт: 30 ÷ число участников.',
    hadithText: '«Читай Коран за месяц». Абдуллах сказал: «Я в силах на большее». Он ﷺ сказал: «Тогда читай его за семь дней и не превышай этого».',
    hadithSrc: 'аль-Бухари 5054 — от Абдуллаха ибн Амра',
    mapTitle: 'Карта 30 джузов', legendDone: 'Прочитан', legendReading: 'Читается', legendFree: 'Свободен',
  },
  ar: {
    lead: 'قسّموا القرآن ثلاثين جزءًا واختموه معًا مع الأهل أو الأصدقاء أو الجماعة — أو حافظوا على عادة مشتركة.',
    how: 'لا حاجة إلى حساب: أنشئ غرفة وشارك الرابط — يكتب كل واحد اسمه ويأخذ جزءًا، أو يعلّم مرة كل يوم.',
    sampleTitle: 'غرفة مثال', sampleSub: (d, r) => `قُرئ ${d} جزءًا · قيد القراءة ${r}`,
    stepsEyebrow: 'طريقة العمل', stepsTitle: 'الختمة الجماعية في أربع خطوات',
    steps: [
      { title: 'أنشئ غرفة', text: 'اختر النوع (ختمة أو هدف) وسمِّ الغرفة.' },
      { title: 'شارك الرابط', text: 'أرسل الرابط إلى الأهل أو الأصدقاء في رسالة.' },
      { title: 'خذ جزءًا', text: 'يكتب كل واحد اسمه ويأخذ أحد الأجزاء المتاحة.' },
      { title: 'علِّم «قرأته»', text: 'إذا عُلِّمت الأجزاء الثلاثون تمّت الختمة.' },
    ],
    createEyebrow: 'ابدأ',
    paceEyebrow: 'الوتيرة', paceTitle: 'كلما كبرت المجموعة خفّ النصيب', paceLead: 'في الختمة ثلاثون جزءًا: كلما زاد المشاركون قلّ نصيب كل واحد.',
    paceChart: 'الأجزاء لكل مشارك', paceSub: 'لختمة واحدة بحسب عدد المشاركين', people: (n) => `${n} مشارك`, juz: (n) => `${n} جزء`,
    paceNote: 'الحساب: ٣٠ ÷ عدد المشاركين.',
    hadithText: 'قال عبد الله: إني أجد قوة، فقال ﷺ: فاقرأه في سبع ولا تزد على ذلك.',
    hadithSrc: 'البخاري ٥٠٥٤ — عن عبد الله بن عمرو',
    mapTitle: 'خريطة الأجزاء الثلاثين', legendDone: 'مقروء', legendReading: 'قيد القراءة', legendFree: 'متاح',
  },
  tr: {
    lead: 'Kur’an’ı 30 cüze bölüp aileniz, arkadaşlarınız veya cemaatinizle birlikte hatmedin — ya da bir alışkanlığı birlikte sürdürün.',
    how: 'Hesap gerekmez: oda oluşturun, bağlantıyı paylaşın — herkes adını yazıp bir cüz alır veya günde bir kez işaret koyar.',
    sampleTitle: 'Örnek oda', sampleSub: (d, r) => `${d} cüz okundu · ${r} okunuyor`,
    stepsEyebrow: 'Nasıl işler', stepsTitle: 'Dört adımda grup hatmi',
    steps: [
      { title: 'Oda oluştur', text: 'Türü seç (hatim veya hedef) ve odaya ad ver.' },
      { title: 'Bağlantıyı paylaş', text: 'Bağlantıyı aileye veya arkadaşlara mesajla gönder.' },
      { title: 'Cüz al', text: 'Herkes adını yazar ve boş cüzlerden birini alır.' },
      { title: '«Okudum» işaretle', text: '30 cüzün hepsi işaretlenince hatim tamamlanır.' },
    ],
    createEyebrow: 'Başla',
    paceEyebrow: 'Tempo', paceTitle: 'Grup büyüdükçe yük hafifler', paceLead: 'Bir hatimde 30 cüz vardır: katılımcı arttıkça herkese düşen pay azalır.',
    paceChart: 'Kişi başına cüz', paceSub: 'Bir hatim için, katılımcı sayısına göre', people: (n) => `${n} kişi`, juz: (n) => `${n} cüz`,
    paceNote: 'Hesap: 30 ÷ katılımcı sayısı.',
    hadithText: '“Kur’an’ı bir ayda oku.” Abdullah: “Daha fazlasına gücüm yetiyor” dedi. Peygamber ﷺ: “O hâlde yedi günde oku, bundan fazlasını yapma” buyurdu.',
    hadithSrc: 'Buhârî 5054 — Abdullah b. Amr’dan',
    mapTitle: '30 cüz haritası', legendDone: 'Okundu', legendReading: 'Okunuyor', legendFree: 'Boşta',
  },
}

// Nümunə xəritə (təqdimat hero-su) — illüstrasiya, real məlumat deyil
const SAMPLE = Array.from({ length: 30 }, (_, i) => (i < 18 ? 'done' : i < 24 ? 'reading' : 'free'))

/** 30 cüzün kiçik xəritəsi: hər xana bir cüz (rəng + nömrə; legend mətnlə) */
function JuzMap({ cells, label, compact = false }) {
  return (
    <ol className={`gp-map${compact ? ' gp-map--compact' : ''}`} aria-label={label}>
      {cells.map((st, i) => (
        <li key={i} className={`gp-map__cell is-${st}`}>
          <span className="ui-num">{i + 1}</span>
        </li>
      ))}
    </ol>
  )
}

function JuzLegend({ v, counts }) {
  return (
    <ul className="ui-legend gp-legend">
      <li><span className="ui-swatch" style={{ '--swatch': 'var(--viz-1)' }} aria-hidden="true" /><span>{v.legendDone}</span> <b>{counts.done}</b></li>
      <li><span className="ui-swatch" style={{ '--swatch': 'var(--viz-2)' }} aria-hidden="true" /><span>{v.legendReading}</span> <b>{counts.reading}</b></li>
      <li><span className="ui-swatch" style={{ '--swatch': 'var(--viz-track)' }} aria-hidden="true" /><span>{v.legendFree}</span> <b>{counts.free}</b></li>
    </ul>
  )
}

const roomPath = (lang, id) => `${lang === 'az' ? '' : `/${lang}`}/group${id ? `/${id}` : ''}`

/** /group/<id> → id (lider marşrutu qeydə alana qədər yolun özündən də oxunur) */
function useRoomId() {
  const location = useLocation()
  const { key, param } = parsePath(location.pathname)
  if (key === 'group' && typeof param === 'string' && GROUP_ID_RE.test(param)) return param
  const m = /\/group\/([^/?#]+)\/?$/.exec(location.pathname)
  return m ? decodeURIComponent(m[1]).toLowerCase() : null
}

const errText = (L, e) => {
  if (!e || e.status == null) return L.netErr
  if (e.status === 429) return L.errLimit
  if (e.status === 423) return L.errClosed
  if (e.status === 403) return L.errForbidden
  if (e.status === 409) return e.message === 'taken' ? L.errTaken : e.message === 'full' ? L.errFull : L.errGeneric
  return L.errGeneric
}

function useToast() {
  const [toast, setToast] = useState(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const flash = useCallback((text, ok = true) => {
    timers.current.forEach(clearTimeout)
    setToast({ text, ok, leaving: false })
    timers.current = [
      setTimeout(() => setToast(t => t && { ...t, leaving: true }), 2600),
      setTimeout(() => setToast(null), 2800),
    ]
  }, [])
  const node = toast && (
    <div className={`ui-toast gp-toast${toast.leaving ? ' is-leaving' : ''}`} role="status" style={toast.ok ? undefined : { '--toast-accent': 'var(--bad)' }}>
      <span className="ui-toast__icon"><Icon name={toast.ok ? 'check' : 'alert'} /></span>
      <div className="ui-toast__body"><strong className="ui-toast__title">{toast.text}</strong></div>
    </div>
  )
  return [flash, node]
}

const Bar = ({ value, label }) => (
  <div className="gp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
    <span className="gp-bar__fill" style={{ width: `${value}%` }} />
  </div>
)

export default function GroupPage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const id = useRoomId()
  return id ? <Room key={id} id={id} L={L} lang={lang} /> : <Landing L={L} lang={lang} />
}

/* ── Təqdimat + yaratma ── */
function Landing({ L, lang }) {
  const navigate = useNavigate()
  const [type, setType] = useState('khatm')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('fajr-40')
  const [days, setDays] = useState(30)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [rooms, setRooms] = useState(() => localRooms())

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const t = title.trim()
    const goal = type === 'goal' ? (kind === 'fajr-40' ? { kind } : { kind, days: Number(days), label: label.trim() }) : undefined
    if (t.length < 2 || (goal && goal.kind === 'custom' && (goal.label.length < 2 || !(goal.days >= 1 && goal.days <= 365)))) {
      setErr(L.invalid)
      return
    }
    setBusy(true)
    try {
      const r = await createGroup({ type, title: t, lang, goal })
      saveLocalRoom(r.id, { adminKey: r.adminKey, title: t, type })
      navigate(roomPath(lang, r.id))
    } catch (ex) {
      setErr(ex && ex.status === 400 ? L.invalid : errText(L, ex))
      setBusy(false)
    }
  }

  const v = V3[lang] || V3.en
  const sampleCounts = { done: SAMPLE.filter(x => x === 'done').length, reading: SAMPLE.filter(x => x === 'reading').length, free: SAMPLE.filter(x => x === 'free').length }

  return (
    <div className="gp-root">
      <header className="ui-page-hero ui-page-hero--split gp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{L.eyebrow}</span>
            <h1 className="ui-display">{L.title}</h1>
            <p className="ui-lead">{v.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {v.how}</p>
            <div className="ui-page-hero__actions">
              <a className="ui-btn ui-btn--primary" href="#gp-create"><Icon name="plus" className="ui-btn__icon" /> {L.createTitle}</a>
            </div>
          </div>
          <div className="ui-page-hero__aside">
            {/* Nümunə — dekorativ illüstrasiya (ekran oxuyucusundan gizli) */}
            <div className="ui-card gp-sample" aria-hidden="true">
              <div className="gp-sample__head">
                <span className="gp-sample__title">{v.sampleTitle}</span>
                <span className="gp-muted">{v.sampleSub(sampleCounts.done, sampleCounts.reading)}</span>
              </div>
              <JuzMap cells={SAMPLE} compact />
              <JuzLegend v={v} counts={sampleCounts} />
            </div>
          </div>
        </div>
      </header>

      {/* Necə işləyir — dörd addım */}
      <section className="ui-section ui-section--tight" aria-labelledby="gp-steps-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{v.stepsEyebrow}</span>
            <h2 className="ui-title" id="gp-steps-h">{v.stepsTitle}</h2>
          </div>
          <ol className="ui-steps ui-steps--row gp-steps">
            {v.steps.map((s, i) => (
              <li key={i} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                <div className="ui-step__body">
                  <h3 className="ui-step__title">{s.title}</h3>
                  <p className="ui-step__text">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ui-section ui-section--tight ui-section--alt" id="gp-create" aria-labelledby="gp-create-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{v.createEyebrow}</span>
            <h2 className="ui-title" id="gp-create-h">{L.createTitle}</h2>
          </div>
          <div className="ui-grid gp-types" style={{ '--ui-grid-min': '280px' }} data-reveal="stagger">
            <div className="ui-card">
              <div className="ui-card__head">
                <span className="ui-icon-tile"><Icon name="quran" /></span>
                <h3 className="ui-card__title">{L.khatmTitle}</h3>
              </div>
              <p className="ui-card__text">{L.khatmText}</p>
            </div>
            <div className="ui-card">
              <div className="ui-card__head">
                <span className="ui-icon-tile ui-icon-tile--accent"><Icon name="target" /></span>
                <h3 className="ui-card__title">{L.goalTitle}</h3>
              </div>
              <p className="ui-card__text">{L.goalText}</p>
            </div>
          </div>

          <div className="gp-layout">
            <form className="ui-card gp-form" onSubmit={submit} noValidate aria-label={L.createTitle}>
              <div className="gp-field">
                <span className="ui-field__label" id="gp-type-l">{L.type}</span>
                <div className="gp-chips" role="group" aria-labelledby="gp-type-l">
                  <button type="button" className="ui-chip" aria-pressed={type === 'khatm'} onClick={() => setType('khatm')}>{L.khatmTitle}</button>
                  <button type="button" className="ui-chip" aria-pressed={type === 'goal'} onClick={() => setType('goal')}>{L.goalTitle}</button>
                </div>
              </div>
              <label className="ui-field">
                <span className="ui-field__label">{L.fieldTitle}</span>
                <input className="ui-input" value={title} maxLength={80} onChange={e => setTitle(e.target.value)}
                  placeholder={type === 'khatm' ? L.titlePhKhatm : L.titlePhGoal} required />
              </label>
              {type === 'goal' && (
                <>
                  <div className="gp-field">
                    <span className="ui-field__label" id="gp-kind-l">{L.goalKind}</span>
                    <div className="gp-chips" role="group" aria-labelledby="gp-kind-l">
                      <button type="button" className="ui-chip" aria-pressed={kind === 'fajr-40'} onClick={() => setKind('fajr-40')}>{L.fajr40}</button>
                      <button type="button" className="ui-chip" aria-pressed={kind === 'custom'} onClick={() => setKind('custom')}>{L.custom}</button>
                    </div>
                  </div>
                  {kind === 'custom' && (
                    <div className="gp-row">
                      <label className="ui-field gp-days">
                        <span className="ui-field__label">{L.days}</span>
                        <input className="ui-input ui-num" type="number" inputMode="numeric" min={1} max={365} value={days} onChange={e => setDays(e.target.value)} />
                      </label>
                      <label className="ui-field gp-grow">
                        <span className="ui-field__label">{L.label}</span>
                        <input className="ui-input" value={label} maxLength={80} onChange={e => setLabel(e.target.value)} placeholder={L.labelPh} />
                      </label>
                    </div>
                  )}
                </>
              )}
              {err && <p className="gp-error" role="alert">{err}</p>}
              <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}>
                <Icon name="plus" className="ui-btn__icon" /> {busy ? L.creating : L.create}
              </button>
              <p className="gp-hint">{L.adminHint}</p>
            </form>

            <aside className="gp-side">
              {rooms.length > 0 && (
                <div className="ui-card ui-card--sunken">
                  <h2 className="gp-h3">{L.myRooms}</h2>
                  <ul className="gp-rooms">
                    {rooms.map(r => (
                      <li key={r.id}>
                        <a href={roomPath(lang, r.id)} onClick={e => { if (e.button === 0 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); navigate(roomPath(lang, r.id)) } }}>
                          <Icon name={r.type === 'goal' ? 'target' : 'quran'} size={18} /> <span>{r.title || r.id}</span>
                        </a>
                        <button type="button" className="ui-icon-btn gp-x" aria-label={L.forget} title={L.forget}
                          onClick={() => { forgetLocalRoom(r.id); setRooms(localRooms()) }}>
                          <Icon name="close" size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="gp-note"><Icon name="shield" size={18} /> <span>{L.privacyNote}</span></p>
            </aside>
          </div>
        </div>
      </section>

      {/* Temp — iştirakçı sayına görə bir nəfərə düşən cüz + Buxari 5054 */}
      <section className="ui-section ui-section--tight" aria-labelledby="gp-pace-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{v.paceEyebrow}</span>
            <h2 className="ui-title" id="gp-pace-h">{v.paceTitle}</h2>
            <p className="ui-lead">{v.paceLead}</p>
          </div>
          <div className="gp-pace">
            <ChartFigure title={v.paceChart} sub={v.paceSub} note={v.paceNote}>
              <BarChart labelWidth="30%" label={v.paceChart}
                data={PACE_GROUPS.map(n => ({ key: n, label: v.people(n), value: 30 / n }))}
                max={30} format={(x) => v.juz(Number.isInteger(x) ? x : x.toFixed(1))} />
            </ChartFigure>
            <figure className="ui-quote gp-quote">
              <blockquote>
                <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{PACE_AR}</p>
                {lang !== 'ar' && <p className="ui-quote__text">{v.hadithText}</p>}
              </blockquote>
              <figcaption className="ui-quote__src">— {v.hadithSrc}</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ── Otaq ── */
function Room({ id, L, lang }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading')   // loading | ok | missing | error
  const [local, setLocal] = useState(() => localRoom(id))
  const [busy, setBusy] = useState(false)
  const [flash, toastNode] = useToast()
  const ctl = useRef(null)

  const load = useCallback(async () => {
    if (ctl.current) ctl.current.abort()
    const c = new AbortController()
    ctl.current = c
    try {
      const g = await getGroup(id, c.signal)
      setData(g)
      setState('ok')
      saveLocalRoom(id, { title: g.title, type: g.type })
    } catch (e) {
      if (e && e.name === 'AbortError') return
      if (e && e.status === 404) { setState('missing'); return }
      setState(s => (s === 'ok' ? 'ok' : 'error'))
    }
  }, [id])

  // Görünəndə hər 20 saniyədə bir yenilə
  useEffect(() => {
    if (!GROUP_ID_RE.test(id)) { setState('missing'); return undefined }
    load()
    const t = setInterval(() => { if (document.visibilityState === 'visible') load() }, POLL_MS)
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
      if (ctl.current) ctl.current.abort()
    }
  }, [id, load])

  const updateLocal = (patch) => { saveLocalRoom(id, patch); setLocal(localRoom(id)) }

  const run = async (fn, okText) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      if (okText) flash(okText, true)
      await load()
    } catch (e) {
      flash(errText(L, e), false)
      if (e && e.status === 409) load()
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    const url = window.location.origin + roomPath(lang, id)
    if (navigator.share) {
      try { await navigator.share({ title: data ? data.title : L.title, url }); return } catch (err) {
        if (err && err.name === 'AbortError') return
      }
    }
    try { await navigator.clipboard.writeText(url); flash(L.copied, true) } catch { flash(L.copyFail, false) }
  }

  const back = (
    <nav className="ui-page-hero__crumbs" aria-label={L.title}>
      <a href={roomPath(lang)} className="gp-crumb" onClick={e => { e.preventDefault(); navigate(roomPath(lang)) }}>
        <Icon name="arrow" size={15} className="gp-back-ic" /> {L.back}
      </a>
    </nav>
  )

  if (state !== 'ok' || !data) {
    return (
      <div className="gp-root">
        <header className="ui-page-hero gp-hero">
          <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
          <div className="ui-container">
            {back}
            <h1 className="ui-display">{state === 'loading' ? L.loading : L.title}</h1>
            {state === 'missing' && <p className="ui-lead">{L.notFound}</p>}
            {state === 'error' && <p className="ui-lead">{L.netErr}</p>}
            {state !== 'loading' && (
              <div className="ui-page-hero__actions">
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => navigate(roomPath(lang))}>{L.newRoom}</button>
              </div>
            )}
          </div>
        </header>
      </div>
    )
  }

  const isAdmin = !!local.adminKey
  const admin = (action, extra, confirmText, okText) => {
    if (confirmText && !window.confirm(confirmText)) return
    run(async () => {
      await adminAction(id, local.adminKey, action, extra)
      if (action === 'delete') {
        forgetLocalRoom(id)
        navigate(roomPath(lang), { replace: true })
      }
    }, okText)
  }

  return (
    <div className="gp-root">
      <header className="ui-page-hero gp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          {back}
          <span className="ui-eyebrow">{data.type === 'khatm' ? L.khatmTitle : L.goalTitle}</span>
          <h1 className="ui-display gp-title">{data.title}</h1>
          {data.type === 'goal' && (
            <p className="ui-lead">{data.goal.kind === 'fajr-40' ? L.fajr40 : `${data.goal.label} · ${L.goalDays(data.goal.days)}`}</p>
          )}
          <div className="ui-page-hero__actions">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={share}>
              <Icon name="share" className="ui-btn__icon" /> {L.share}
            </button>
            {isAdmin && <span className="ui-badge ui-badge--accent">{L.youAdmin}</span>}
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          {data.closed && <p className="gp-banner" role="status"><Icon name="info" size={18} /> {L.closedNote}</p>}
          {data.type === 'khatm'
            ? <Khatm data={data} L={L} lang={lang} local={local} updateLocal={updateLocal} run={run} busy={busy} isAdmin={isAdmin} admin={admin} flash={flash} id={id} />
            : <Goal data={data} L={L} lang={lang} local={local} updateLocal={updateLocal} run={run} busy={busy} isAdmin={isAdmin} admin={admin} id={id} />}

          {isAdmin && (
            <div className="ui-card ui-card--sunken gp-admin">
              <h2 className="gp-h3">{L.admin}</h2>
              <div className="gp-actions">
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy}
                  onClick={() => admin('reset', {}, data.type === 'khatm' && data.khatm.completedAt ? null : L.confirmReset)}>
                  <Icon name="refresh" className="ui-btn__icon" /> {data.type === 'khatm' ? L.resetKhatm : L.resetGoal}
                </button>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy}
                  onClick={() => admin(data.closed ? 'reopen' : 'close')}>
                  {data.closed ? L.reopen : L.close}
                </button>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm gp-danger" disabled={busy}
                  onClick={() => admin('delete', {}, L.confirmDel, L.deleted)}>
                  <Icon name="trash" className="ui-btn__icon" /> {L.del}
                </button>
              </div>
              <p className="gp-hint">{L.adminHint}</p>
            </div>
          )}
          <p className="gp-note"><Icon name="shield" size={18} /> <span>{L.privacyNote}</span></p>
        </div>
      </section>
      {toastNode}
    </div>
  )
}

function NameField({ L, name, setName }) {
  return (
    <label className="ui-field gp-name">
      <span className="ui-field__label">{L.yourName}</span>
      <input className="ui-input" value={name} maxLength={40} placeholder={L.namePh} autoComplete="nickname"
        onChange={e => setName(e.target.value)} onBlur={() => saveName(name.trim())} />
    </label>
  )
}

/* ── Xətm görünüşü ── */
function Khatm({ data, L, lang, local, updateLocal, run, busy, isAdmin, admin, flash, id }) {
  const [name, setName] = useState(savedName)
  const k = data.khatm
  const doneCount = k.juz.filter(j => j.done).length
  const v = V3[lang] || V3.en
  const cells = k.juz.map(j => (j.done ? 'done' : j.name ? 'reading' : 'free'))
  const counts = { done: doneCount, reading: cells.filter(c => c === 'reading').length, free: cells.filter(c => c === 'free').length }
  const closed = data.closed
  const finished = !!k.completedAt
  const claims = local.claims || {}

  const claim = (n) => {
    const nm = name.trim()
    if (!nm) { flash(L.needName, false); return }
    saveName(nm)
    run(async () => {
      const { token } = await claimJuz(id, n, nm)
      updateLocal({ claims: { ...(localRoom(id).claims || {}), [n]: token } })
    })
  }
  const dropClaim = (n) => {
    const c = { ...(localRoom(id).claims || {}) }
    delete c[n]
    updateLocal({ claims: c })
  }

  return (
    <>
      {finished && (
        <div className="ui-card gp-complete" role="status">
          <span className="ui-icon-tile ui-icon-tile--accent"><Icon name="check" /></span>
          <div>
            <h2 className="gp-h2">{L.completedTitle}</h2>
            <p>{L.completedText}</p>
          </div>
        </div>
      )}

      <div className="ui-card gp-overview">
        <div className="gp-overview__head">
          <ProgressRing value={doneCount} max={30} size={88} thickness={8} label={L.progress(doneCount)}
            sub={(k.round > 1 || k.completions > 0) ? `${L.round(k.round)} · ${L.completions(k.completions)}` : undefined} />
          <JuzLegend v={v} counts={counts} />
        </div>
        <JuzMap cells={cells} label={v.mapTitle} />
      </div>

      {!closed && !finished && <NameField L={L} name={name} setName={setName} />}

      <ol className="gp-juz" aria-label={L.khatmTitle}>
        {k.juz.map(j => {
          const token = claims[j.n]
          const mine = !!(token && j.name)
          const cls = `gp-juz__cell${j.done ? ' is-done' : j.name ? ' is-taken' : ''}${mine ? ' is-mine' : ''}`
          return (
            <li key={j.n} className={cls}>
              <div className="gp-juz__top">
                <span className="gp-juz__n">{L.juz(j.n)}</span>
                {j.done ? <span className="ui-badge ui-badge--brand"><Icon name="check" size={12} /> {L.doneTag}</span>
                  : j.name ? <span className="ui-badge">{L.readingTag}</span> : null}
              </div>
              <div className="gp-juz__name">{j.name ? <><bdi>{j.name}</bdi>{mine && <span className="gp-mine"> · {L.mine}</span>}</> : <span className="gp-muted">{L.free}</span>}</div>
              {!closed && !finished && (
                <div className="gp-juz__actions">
                  {!j.name && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy} onClick={() => claim(j.n)}>{L.claim}</button>}
                  {mine && !j.done && <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy}
                    onClick={() => run(() => markDone(id, j.n, token, true))}>{L.markDone}</button>}
                  {mine && j.done && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy}
                    onClick={() => run(() => markDone(id, j.n, token, false))}>{L.undo}</button>}
                  {mine && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy}
                    onClick={() => run(async () => { await releaseJuz(id, j.n, token); dropClaim(j.n) })}>{L.release}</button>}
                  {isAdmin && j.name && !mine && <button type="button" className="ui-icon-btn gp-x" aria-label={L.remove} title={L.remove} disabled={busy}
                    onClick={() => admin('remove', { juz: j.n }, L.confirmRemove(j.name))}><Icon name="close" size={16} /></button>}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="gp-notes">
        <p className="gp-note"><Icon name="info" size={18} /> <span>{L.khatmNote}</span></p>
        <aside className="ui-card ui-card--sunken gp-dua">
          <h2 className="gp-h3">{L.duaTitle}</h2>
          <p>{L.duaNote}</p>
        </aside>
      </div>
    </>
  )
}

/* ── Hədəf görünüşü ── */
function Goal({ data, L, lang, local, updateLocal, run, busy, isAdmin, admin, id }) {
  const [name, setName] = useState(savedName)
  const days = data.goal.days
  const closed = data.closed
  const now = new Date()
  const todayIso = localDate(now)
  const yIso = localDate(now, -1)
  const me = local.member ? data.participants.find(p => p.pid === local.member.pid) : null
  const people = [...data.participants].sort((a, b) => a.name.localeCompare(b.name, lang))
  const pctOf = (p) => Math.min(100, Math.round((p.ticks.length / days) * 100))
  const avg = people.length ? Math.round(people.reduce((s, p) => s + pctOf(p), 0) / people.length) : 0

  const join = (e) => {
    e.preventDefault()
    const nm = name.trim()
    if (!nm) return
    saveName(nm)
    run(async () => {
      const r = await joinGoal(id, nm)
      updateLocal({ member: r })
    })
  }
  const toggle = (date, on) => run(() => tickDay(id, local.member.pid, local.member.token, date, on))
  const leave = () => {
    if (!window.confirm(L.confirmLeave)) return
    run(async () => { await leaveGoal(id, local.member.pid, local.member.token); updateLocal({ member: null }) })
  }

  const week = Array.from({ length: 7 }, (_, i) => localDate(now, i - 6))
  const dayLabel = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(lang === 'az' ? 'az-Latn-AZ' : lang, { weekday: 'short' })
  }

  return (
    <>
      {me ? (
        <div className="ui-card gp-me">
          <div className="gp-me__head">
            <h2 className="gp-h2">{L.myProgress}</h2>
            <span className="ui-badge ui-badge--accent">{L.streak(streakOf(me.ticks, now))}</span>
          </div>
          {me.ticks.length >= days && <p className="gp-complete-line" role="status"><Icon name="check" size={18} /> {L.goalDone}</p>}
          <div className="gp-summary">
            <div className="gp-summary__text"><strong className="ui-num">{L.daysDone(me.ticks.length, days)} · {pctOf(me)}%</strong></div>
            <Bar value={pctOf(me)} label={L.myProgress} />
          </div>
          {!closed && (
            <div className="gp-ticks">
              {[[todayIso, L.today], [yIso, L.yesterday]].map(([iso, lbl]) => {
                const on = me.ticks.includes(iso)
                return (
                  <button key={iso} type="button" className={`ui-btn ui-btn--sm ${on ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
                    aria-pressed={on} disabled={busy || (!on && me.ticks.length >= days)} onClick={() => toggle(iso, !on)}>
                    <Icon name={on ? 'check' : 'plus'} className="ui-btn__icon" /> {lbl}
                  </button>
                )
              })}
            </div>
          )}
          <div className="gp-week" aria-label={L.lastDays}>
            {week.map(iso => (
              <span key={iso} className={`gp-week__day${me.ticks.includes(iso) ? ' is-on' : ''}${iso === todayIso ? ' is-today' : ''}`}>
                <span className="gp-week__dot" aria-hidden="true">{me.ticks.includes(iso) ? <Icon name="check" size={14} /> : null}</span>
                <span className="gp-week__lbl">{dayLabel(iso)}</span>
              </span>
            ))}
          </div>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm gp-leave" disabled={busy} onClick={leave}>{L.leave}</button>
        </div>
      ) : !closed && (
        <form className="ui-card gp-join" onSubmit={join}>
          <h2 className="gp-h2">{L.joinTitle}</h2>
          <div className="gp-row">
            <div className="gp-grow"><NameField L={L} name={name} setName={setName} /></div>
            <button type="submit" className="ui-btn ui-btn--primary" disabled={busy || !name.trim()}>{L.join}</button>
          </div>
        </form>
      )}

      <div className="gp-people">
        <div className="gp-people__head">
          <h2 className="gp-h3">{L.participants(people.length)}</h2>
          {people.length > 0 && <span className="gp-muted">{L.groupAvg(avg)}</span>}
        </div>
        {people.length === 0 ? <p className="gp-muted">{L.empty}</p> : (
          <ul className="gp-plist">
            {people.map(p => (
              <li key={p.pid} className={me && me.pid === p.pid ? 'is-mine' : undefined}>
                <bdi className="gp-plist__name">{p.name}</bdi>
                <Bar value={pctOf(p)} label={p.name} />
                <span className="gp-plist__pct ui-num">{pctOf(p)}%</span>
                {isAdmin && (!me || me.pid !== p.pid) && (
                  <button type="button" className="ui-icon-btn gp-x" aria-label={L.remove} title={L.remove} disabled={busy}
                    onClick={() => admin('remove', { pid: p.pid }, L.confirmRemove(p.name))}><Icon name="close" size={16} /></button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="gp-notes">
        <p className="gp-note"><Icon name="shield" size={18} /> <span>{L.noRank}</span></p>
        {data.goal.kind === 'fajr-40' && (
          <aside className="ui-card ui-card--sunken gp-dua">
            <p>{L.fajrNote}</p>
            <p className="gp-src">— {L.fajrSrc}</p>
          </aside>
        )}
      </div>
    </>
  )
}
