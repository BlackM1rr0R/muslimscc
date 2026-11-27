// ═══════════════════════════════════════════════════════
// Admin: TikTok yükləyicisi (server/tiktok.js, docs/TIKTOK.md) — gündə 3 video (hədis, dua / ad, Quran passajı)
//   GET  /api/admin/tiktok             — vəziyyət, hesab, bu günün videosu, son yükləmələr (admin / superadmin)
//   GET  /api/tiktok/connect           — bir dəfəlik qoşulma: TikTok-un razılıq səhifəsinə yönləndirmə (yalnız superadmin)
//   POST /api/admin/tiktok/post        — yuvanın bu günkü videosunu indi göndər ({ confirm, slot }), təsdiqlə (yalnız superadmin)
//   POST /api/admin/tiktok/disconnect  — hesabı ayır (token silinir), təsdiqlə (yalnız superadmin)
// Qoşulmadan sonra server panelə ?tiktok=<nəticə> ilə qaytarır. Token və açarlar heç vaxt brauzerə gəlmir.
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
    // lang-ok[reel]: Instagram-ın video formatının adı (Reels)
    title: 'TikTok', lead: 'Gündə üç video (hədis, dua və ya Allahın adı, Quran ayələri — Instagram-dakı ilə eyni) TikTok-a göndərilir — yalnız saytın açıq məzmunu, mənbəsi ilə.',
    loading: 'Yüklənir...', loadErr: 'Məlumatı yükləmək olmadı.', status: 'Vəziyyət', on: 'Açıqdır', off: 'Sönülüdür',
    reasons: { disabled: 'TIKTOK_ENABLED=1 təyin edilməyib', missing_credentials: 'TIKTOK_CLIENT_KEY və ya TIKTOK_CLIENT_SECRET yoxdur', bad_format: 'Tətbiq açarı yararsızdır' },
    mode: 'Rejim', modes: { inbox: 'Qaralama — video TikTok-un Gələnlər qutusuna düşür, dərci tətbiqdə özünüz edirsiniz', direct: 'Birbaşa dərc' },
    modeShort: { inbox: 'Qaralama', direct: 'Birbaşa dərc' },
    privacy: 'Görünmə', privacies: { SELF_ONLY: 'Yalnız mən', MUTUAL_FOLLOW_FRIENDS: 'Dostlar', FOLLOWER_OF_CREATOR: 'İzləyicilər', PUBLIC_TO_EVERYONE: 'Hamı' },
    time: 'Vaxt', account: 'Hesab', notConnected: 'Qoşulmayıb', connectedAs: 'Qoşulub', refreshUntil: 'Yenidən qoşulmadan işləyir', refreshSoon: 'Tezliklə yenidən qoşmaq lazımdır.',
    authError: 'TikTok girişi qəbul etmədi — hesabı yenidən qoşun.', scopeMissing: 'Lazımi icazə verilməyib — yenidən qoşun və bütün icazələri təsdiqləyin.',
    connect: 'TikTok-u qoş', reconnect: 'Yenidən qoş', connectLead: 'TikTok-un səhifəsi açılır: @muslimscc hesabı ilə daxil olun və icazə verin. Bir dəfə lazımdır.',
    disconnect: 'Hesabı ayır', disconnectAsk: 'TikTok hesabı ayrılsın?', yes: 'Bəli', cancel: 'Ləğv et', disconnected: 'Hesab ayrıldı.',
    results: { connected: 'TikTok hesabı qoşuldu.', denied: 'TikTok-da icazə verilmədi.', bad_state: 'Qoşulma vaxtı keçib və ya başqa brauzerdə açılıb — yenidən cəhd edin.', exchange_failed: 'TikTok qoşulmanı təsdiqləmədi — bir az sonra yenidən cəhd edin.', scope_missing: 'Qoşuldu, amma video icazəsi verilmədi — yenidən qoşun.', bad_request: 'Qoşulma alınmadı.', error: 'Qoşulma alınmadı.' },
    slotsTitle: 'Bu günün videoları', slotOff: 'söndürülüb', pending: 'Gələnlər qutusunda gözləyən qaralamalar', pendingFull: 'TikTok limiti doludur — qaralamaları tətbiqdə dərc edin, sonra növbəti video gedəcək.',
    kinds: { hadith: 'Hədis', dua: 'Dua', name: 'Allahın adı', ayah: 'Quran ayələri (tilavətlə)' }, postAskSlot: 'Bu video indi TikTok-a göndərilsin?',
    today: 'Bu günün videosu', file: 'Fayl', ready: 'hazırdır', missing: 'hələ yüklənməyib', upload: 'Göndəriş', notYet: 'hələ göndərilməyib',
    st: { claimed: 'Gedir', retry: 'Təkrar gözləyir', processing: 'TikTok emal edir', sent: 'TikTok-un Gələnlər qutusundadır', published: 'Dərc olunub', failed: 'Alınmadı' },
    caption: 'Mətn (caption)', captionInbox: 'TikTok-da dərc etməzdən əvvəl bu mətni yapışdırın (qaralama rejimində mətn avtomatik qoyulmur).', copy: 'Kopyala', copied: 'Kopyalandı',
    postNow: 'İndi göndər', postAsk: 'Bu günün videosu indi TikTok-a göndərilsin?', postSent: 'Göndərildi — nəticə bir neçə dəqiqəyə burada görünəcək.', postErr: 'Göndəriş başlamadı.',
    recent: 'Son göndərişlər', none: 'Hələ göndəriş yoxdur.',
    audit: 'Qeyd: TikTok yoxlamasından (audit) keçməmiş tətbiq birbaşa dərcdə yalnız "Yalnız mən" görünməsi ilə paylaşa bilər. Ona görə susmaya görə qaralama rejimidir. Hamıya açıq birbaşa dərc üçün tətbiqi TikTok yoxlamasına göndərin (docs/TIKTOK.md).',
  },
  en: {
    title: 'TikTok', lead: 'Three videos a day (a hadith, a dua or a Name of Allah, and Quran verses — the same as on Instagram) are sent to TikTok — only the site’s public content, with its source.',
    loading: 'Loading...', loadErr: 'Could not load the data.', status: 'Status', on: 'On', off: 'Off',
    reasons: { disabled: 'TIKTOK_ENABLED=1 is not set', missing_credentials: 'TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET is missing', bad_format: 'The app key is invalid' },
    mode: 'Mode', modes: { inbox: 'Draft — the video lands in your TikTok inbox and you post it in the app', direct: 'Direct post' },
    modeShort: { inbox: 'Draft', direct: 'Direct post' },
    privacy: 'Visibility', privacies: { SELF_ONLY: 'Only me', MUTUAL_FOLLOW_FRIENDS: 'Friends', FOLLOWER_OF_CREATOR: 'Followers', PUBLIC_TO_EVERYONE: 'Everyone' },
    time: 'Time', account: 'Account', notConnected: 'Not connected', connectedAs: 'Connected', refreshUntil: 'Works without reconnecting until', refreshSoon: 'You will need to reconnect soon.',
    authError: 'TikTok rejected the sign-in — connect the account again.', scopeMissing: 'A required permission was not granted — reconnect and approve all permissions.',
    connect: 'Connect TikTok', reconnect: 'Reconnect', connectLead: 'The TikTok page opens: sign in with the @muslimscc account and allow access. Needed only once.',
    disconnect: 'Disconnect account', disconnectAsk: 'Disconnect the TikTok account?', yes: 'Yes', cancel: 'Cancel', disconnected: 'The account was disconnected.',
    results: { connected: 'The TikTok account is connected.', denied: 'Access was not granted on TikTok.', bad_state: 'The connection expired or was opened in another browser — please try again.', exchange_failed: 'TikTok did not confirm the connection — try again a little later.', scope_missing: 'Connected, but the video permission was not granted — reconnect.', bad_request: 'The connection failed.', error: 'The connection failed.' },
    slotsTitle: 'Today’s videos', slotOff: 'turned off', pending: 'Drafts waiting in the TikTok inbox', pendingFull: 'The TikTok limit is reached — post the drafts in the app, then the next video will be sent.',
    kinds: { hadith: 'Hadith', dua: 'Dua', name: 'Name of Allah', ayah: 'Quran verses (with recitation)' }, postAskSlot: 'Send this video to TikTok now?',
    today: 'Today’s video', file: 'File', ready: 'ready', missing: 'not uploaded yet', upload: 'Upload', notYet: 'not sent yet',
    st: { claimed: 'In progress', retry: 'Waiting to retry', processing: 'TikTok is processing', sent: 'In your TikTok inbox', published: 'Published', failed: 'Failed' },
    caption: 'Caption', captionInbox: 'Paste this text in TikTok before posting (in draft mode the caption is not filled in automatically).', copy: 'Copy', copied: 'Copied',
    postNow: 'Send now', postAsk: 'Send today’s video to TikTok now?', postSent: 'Sent — the result will appear here in a few minutes.', postErr: 'Sending did not start.',
    recent: 'Recent uploads', none: 'Nothing has been sent yet.',
    audit: 'Note: an app that has not passed the TikTok audit can direct-post only with “Only me” visibility. That is why draft mode is the default. For public direct posting, submit the app for the TikTok audit (docs/TIKTOK.md).',
  },
  ru: {
    title: 'TikTok', lead: 'Три видео в день (хадис, дуа или имя Аллаха и аяты Корана — те же, что в Instagram) отправляются в TikTok — только открытое содержимое сайта, с источником.',
    loading: 'Загрузка...', loadErr: 'Не удалось загрузить данные.', status: 'Состояние', on: 'Включено', off: 'Выключено',
    // lang-ok: api.env dəyişənlərinin adları tərcümə olunmur
    reasons: { disabled: 'TIKTOK_ENABLED=1 не задан', missing_credentials: 'Нет TIKTOK_CLIENT_KEY или TIKTOK_CLIENT_SECRET', bad_format: 'Ключ приложения недействителен' },
    mode: 'Режим', modes: { inbox: 'Черновик — видео приходит во «Входящие» TikTok, публикуете вы сами в приложении', direct: 'Прямая публикация' },
    modeShort: { inbox: 'Черновик', direct: 'Прямая публикация' },
    privacy: 'Видимость', privacies: { SELF_ONLY: 'Только я', MUTUAL_FOLLOW_FRIENDS: 'Друзья', FOLLOWER_OF_CREATOR: 'Подписчики', PUBLIC_TO_EVERYONE: 'Все' },
    time: 'Время', account: 'Аккаунт', notConnected: 'Не подключён', connectedAs: 'Подключён', refreshUntil: 'Работает без переподключения до', refreshSoon: 'Скоро нужно будет подключить заново.',
    authError: 'TikTok не принял вход — подключите аккаунт заново.', scopeMissing: 'Нужное разрешение не выдано — подключите заново и подтвердите все разрешения.',
    // lang-ok[muslimscc]: имя аккаунта (@muslimscc)
    connect: 'Подключить TikTok', reconnect: 'Подключить заново', connectLead: 'Откроется страница TikTok: войдите в аккаунт @muslimscc и разрешите доступ. Нужно один раз.',
    disconnect: 'Отключить аккаунт', disconnectAsk: 'Отключить аккаунт TikTok?', yes: 'Да', cancel: 'Отмена', disconnected: 'Аккаунт отключён.',
    results: { connected: 'Аккаунт TikTok подключён.', denied: 'Доступ в TikTok не разрешён.', bad_state: 'Время подключения истекло или оно открыто в другом браузере — попробуйте снова.', exchange_failed: 'TikTok не подтвердил подключение — попробуйте чуть позже.', scope_missing: 'Подключено, но разрешение на видео не выдано — подключите заново.', bad_request: 'Подключение не удалось.', error: 'Подключение не удалось.' },
    slotsTitle: 'Видео на сегодня', slotOff: 'выключено', pending: 'Черновики во «Входящих» TikTok', pendingFull: 'Лимит TikTok исчерпан — опубликуйте черновики в приложении, затем уйдёт следующее видео.',
    kinds: { hadith: 'Хадис', dua: 'Дуа', name: 'Имя Аллаха', ayah: 'Аяты Корана (с чтением)' }, postAskSlot: 'Отправить это видео в TikTok сейчас?',
    today: 'Видео дня', file: 'Файл', ready: 'готов', missing: 'ещё не загружен', upload: 'Отправка', notYet: 'ещё не отправлено',
    st: { claimed: 'Идёт', retry: 'Ждёт повтора', processing: 'TikTok обрабатывает', sent: 'Во «Входящих» TikTok', published: 'Опубликовано', failed: 'Не удалось' },
    caption: 'Текст публикации', captionInbox: 'Вставьте этот текст в TikTok перед публикацией (в режиме черновика текст не подставляется автоматически).', copy: 'Копировать', copied: 'Скопировано',
    postNow: 'Отправить сейчас', postAsk: 'Отправить видео дня в TikTok сейчас?', postSent: 'Отправлено — результат появится здесь через несколько минут.', postErr: 'Отправка не началась.',
    recent: 'Последние отправки', none: 'Ещё ничего не отправлено.',
    // lang-ok[docs,md]: путь к файлу документации
    audit: 'Примечание: приложение без проверки TikTok (аудита) может публиковать напрямую только с видимостью «Только я». Поэтому по умолчанию — режим черновика. Для открытой прямой публикации отправьте приложение на проверку TikTok (docs/TIKTOK.md).',
  },
  tr: {
    title: 'TikTok', lead: 'Günde üç video (hadis, dua veya Allah’ın ismi ve Kur’an ayetleri — Instagram’dakiyle aynı) TikTok’a gönderilir — yalnızca sitenin açık içeriği, kaynağıyla.',
    loading: 'Yükleniyor...', loadErr: 'Veriler yüklenemedi.', status: 'Durum', on: 'Açık', off: 'Kapalı',
    reasons: { disabled: 'TIKTOK_ENABLED=1 ayarlanmamış', missing_credentials: 'TIKTOK_CLIENT_KEY veya TIKTOK_CLIENT_SECRET yok', bad_format: 'Uygulama anahtarı geçersiz' },
    mode: 'Mod', modes: { inbox: 'Taslak — video TikTok gelen kutunuza düşer, paylaşımı uygulamada siz yaparsınız', direct: 'Doğrudan paylaşım' },
    modeShort: { inbox: 'Taslak', direct: 'Doğrudan paylaşım' },
    privacy: 'Görünürlük', privacies: { SELF_ONLY: 'Yalnızca ben', MUTUAL_FOLLOW_FRIENDS: 'Arkadaşlar', FOLLOWER_OF_CREATOR: 'Takipçiler', PUBLIC_TO_EVERYONE: 'Herkes' },
    time: 'Saat', account: 'Hesap', notConnected: 'Bağlı değil', connectedAs: 'Bağlı', refreshUntil: 'Yeniden bağlanmadan çalışır', refreshSoon: 'Yakında yeniden bağlanmanız gerekecek.',
    authError: 'TikTok girişi kabul etmedi — hesabı yeniden bağlayın.', scopeMissing: 'Gerekli izin verilmedi — yeniden bağlanıp tüm izinleri onaylayın.',
    connect: 'TikTok’u bağla', reconnect: 'Yeniden bağla', connectLead: 'TikTok sayfası açılır: @muslimscc hesabıyla giriş yapıp izin verin. Bir kez gerekir.',
    disconnect: 'Hesabın bağlantısını kes', disconnectAsk: 'TikTok hesabının bağlantısı kesilsin mi?', yes: 'Evet', cancel: 'İptal', disconnected: 'Hesabın bağlantısı kesildi.',
    results: { connected: 'TikTok hesabı bağlandı.', denied: 'TikTok’ta izin verilmedi.', bad_state: 'Bağlantının süresi doldu veya başka bir tarayıcıda açıldı — tekrar deneyin.', exchange_failed: 'TikTok bağlantıyı onaylamadı — biraz sonra tekrar deneyin.', scope_missing: 'Bağlandı ama video izni verilmedi — yeniden bağlayın.', bad_request: 'Bağlantı kurulamadı.', error: 'Bağlantı kurulamadı.' },
    slotsTitle: 'Bugünün videoları', slotOff: 'kapalı', pending: 'TikTok gelen kutusunda bekleyen taslaklar', pendingFull: 'TikTok sınırı doldu — taslakları uygulamada paylaşın, sonra sıradaki video gönderilir.',
    kinds: { hadith: 'Hadis', dua: 'Dua', name: 'Allah’ın ismi', ayah: 'Kur’an ayetleri (tilavetle)' }, postAskSlot: 'Bu video şimdi TikTok’a gönderilsin mi?',
    today: 'Bugünün videosu', file: 'Dosya', ready: 'hazır', missing: 'henüz yüklenmedi', upload: 'Gönderim', notYet: 'henüz gönderilmedi',
    st: { claimed: 'Sürüyor', retry: 'Yeniden denemeyi bekliyor', processing: 'TikTok işliyor', sent: 'TikTok gelen kutusunda', published: 'Paylaşıldı', failed: 'Başarısız' },
    caption: 'Açıklama metni', captionInbox: 'Paylaşmadan önce bu metni TikTok’a yapıştırın (taslak modunda metin otomatik eklenmez).', copy: 'Kopyala', copied: 'Kopyalandı',
    postNow: 'Şimdi gönder', postAsk: 'Bugünün videosu şimdi TikTok’a gönderilsin mi?', postSent: 'Gönderildi — sonuç birkaç dakika içinde burada görünecek.', postErr: 'Gönderim başlamadı.',
    recent: 'Son gönderimler', none: 'Henüz gönderim yok.',
    audit: 'Not: TikTok denetiminden geçmemiş bir uygulama doğrudan paylaşımda yalnızca “Yalnızca ben” görünürlüğüyle paylaşabilir. Bu yüzden varsayılan taslak modudur. Herkese açık doğrudan paylaşım için uygulamayı TikTok denetimine gönderin (docs/TIKTOK.md).',
  },
  ar: {
    title: 'تيك توك', lead: 'تُرسل ثلاثة فيديوهات يوميًا (حديث، ودعاء أو اسم من أسماء الله، وآيات من القرآن — نفس ما في إنستغرام) إلى تيك توك — محتوى الموقع العام فقط، مع مصدره.',
    loading: 'جارٍ التحميل...', loadErr: 'تعذّر تحميل البيانات.', status: 'الحالة', on: 'مفعّل', off: 'معطّل',
    // lang-ok: أسماء متغيرات api.env لا تُترجم
    reasons: { disabled: 'لم يُضبط TIKTOK_ENABLED=1', missing_credentials: 'لا يوجد TIKTOK_CLIENT_KEY أو TIKTOK_CLIENT_SECRET', bad_format: 'مفتاح التطبيق غير صالح' },
    mode: 'الوضع', modes: { inbox: 'مسودة — يصل الفيديو إلى صندوق الوارد في تيك توك وتنشره أنت من التطبيق', direct: 'نشر مباشر' },
    modeShort: { inbox: 'مسودة', direct: 'نشر مباشر' },
    privacy: 'الظهور', privacies: { SELF_ONLY: 'أنا فقط', MUTUAL_FOLLOW_FRIENDS: 'الأصدقاء', FOLLOWER_OF_CREATOR: 'المتابعون', PUBLIC_TO_EVERYONE: 'الجميع' },
    time: 'الوقت', account: 'الحساب', notConnected: 'غير مرتبط', connectedAs: 'مرتبط', refreshUntil: 'يعمل دون إعادة الربط حتى', refreshSoon: 'ستحتاج إلى إعادة الربط قريبًا.',
    authError: 'رفض تيك توك تسجيل الدخول — اربط الحساب من جديد.', scopeMissing: 'لم يُمنح إذن مطلوب — أعد الربط ووافق على جميع الأذونات.',
    // lang-ok: اسم الحساب
    connect: 'ربط تيك توك', reconnect: 'إعادة الربط', connectLead: 'تُفتح صفحة تيك توك: سجّل الدخول بحساب @muslimscc واسمح بالوصول. مرة واحدة فقط.',
    disconnect: 'فصل الحساب', disconnectAsk: 'هل تريد فصل حساب تيك توك؟', yes: 'نعم', cancel: 'إلغاء', disconnected: 'تم فصل الحساب.',
    results: { connected: 'تم ربط حساب تيك توك.', denied: 'لم يُمنح الإذن في تيك توك.', bad_state: 'انتهت مهلة الربط أو فُتح في متصفح آخر — حاول مرة أخرى.', exchange_failed: 'لم يؤكد تيك توك الربط — حاول بعد قليل.', scope_missing: 'تم الربط لكن لم يُمنح إذن الفيديو — أعد الربط.', bad_request: 'فشل الربط.', error: 'فشل الربط.' },
    slotsTitle: 'فيديوهات اليوم', slotOff: 'معطّل', pending: 'المسودات المنتظرة في صندوق وارد تيك توك', pendingFull: 'بلغ حد تيك توك — انشر المسودات من التطبيق، ثم سيُرسل الفيديو التالي.',
    kinds: { hadith: 'حديث', dua: 'دعاء', name: 'اسم من أسماء الله', ayah: 'آيات من القرآن (مع التلاوة)' }, postAskSlot: 'هل تريد إرسال هذا الفيديو إلى تيك توك الآن؟',
    today: 'فيديو اليوم', file: 'الملف', ready: 'جاهز', missing: 'لم يُرفع بعد', upload: 'الإرسال', notYet: 'لم يُرسل بعد',
    st: { claimed: 'جارٍ', retry: 'بانتظار إعادة المحاولة', processing: 'تيك توك يعالج الفيديو', sent: 'في صندوق الوارد في تيك توك', published: 'نُشر', failed: 'فشل' },
    caption: 'نص المنشور', captionInbox: 'الصق هذا النص في تيك توك قبل النشر (في وضع المسودة لا يُضاف النص تلقائيًا).', copy: 'نسخ', copied: 'تم النسخ',
    postNow: 'أرسل الآن', postAsk: 'هل تريد إرسال فيديو اليوم إلى تيك توك الآن؟', postSent: 'تم الإرسال — ستظهر النتيجة هنا خلال دقائق.', postErr: 'لم يبدأ الإرسال.',
    recent: 'آخر الإرسالات', none: 'لم يُرسل شيء بعد.',
    // lang-ok: مسار ملف التوثيق
    audit: 'ملاحظة: التطبيق الذي لم يجتز مراجعة تيك توك لا يستطيع النشر المباشر إلا بظهور «أنا فقط». لذلك وضع المسودة هو الافتراضي. للنشر المباشر العام أرسل التطبيق لمراجعة تيك توك (docs/TIKTOK.md).',
  },
}

const fmtTime = (ms, lang) => {
  if (!ms) return ''
  try { return new Date(ms).toLocaleString(lang === 'az' ? 'az-Latn-AZ' : lang, { dateStyle: 'medium', timeStyle: 'short' }) } catch { return new Date(ms).toISOString().slice(0, 16) }
}
// Qoşulmadan qayıdış: ?tiktok=<nəticə> (server/tiktok.js → callback)
const RESULTS = ['connected', 'denied', 'bad_state', 'exchange_failed', 'scope_missing', 'bad_request', 'error']
function readResult() {
  try {
    const v = new URLSearchParams(window.location.search).get('tiktok')
    return RESULTS.includes(v) ? v : null
  } catch { return null }
}

export default function TikTokManager({ superAdmin = false }) {
  const { lang } = useLang()
  const l = pickUi(T, lang, 'en')
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [result] = useState(readResult)
  const load = useCallback(() => {
    setFailed(false)
    return apiFetch('/api/admin/tiktok', { admin: true }).then(setData).catch(() => { setFailed(true); setData(null) })
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div data-testid="admin-tiktok">
      <AdminHeader icon="tiktok" title={l.title} sub={l.lead} />
      {result && (result === 'connected' ? <p className="rt-note" role="status" data-testid="tt-result">{l.results[result]}</p> : <AdminAlert>{l.results[result]}</AdminAlert>)}
      {failed && <AdminAlert>{l.loadErr}</AdminAlert>}
      {!data && !failed && <AdminEmpty icon="tiktok" busy>{l.loading}</AdminEmpty>}
      {data && <Status l={l} lang={lang} data={data} superAdmin={superAdmin} onChange={load} />}
      {data && data.enabled && (Array.isArray(data.slots)
        ? <Slots l={l} data={data} superAdmin={superAdmin} onDone={load} />
        : <Today l={l} data={data} superAdmin={superAdmin} onDone={load} />)}
      {data && data.enabled && <Recent l={l} lang={lang} posts={data.posts} />}
      {data && <p className="admin-section-lead" data-testid="tt-audit">{l.audit}</p>}
    </div>
  )
}

function Status({ l, lang, data, superAdmin, onChange }) {
  const [msg, setMsg] = useState(null)
  const on = data.enabled && data.connected && !data.authError
  const tok = data.token
  const disconnect = () => {
    setMsg(null)
    apiFetch('/api/admin/tiktok/disconnect', { method: 'POST', admin: true, body: { confirm: true } })
      .then(() => { setMsg({ ok: true, text: l.disconnected }); onChange() })
      .catch(() => setMsg({ ok: false, text: l.results.error }))
  }
  return (
    <section className="admin-section" aria-label={l.status}>
      <SectionTitle icon="tiktok" tone={on ? undefined : 'neutral'}>{l.status}: {on ? l.on : l.off}</SectionTitle>
      {!data.enabled && data.reason && <p className="admin-section-lead" data-testid="tt-reason">{l.reasons[data.reason] || data.reason}</p>}
      {data.enabled && (
        <dl className="ig-facts">
          <div><dt>{l.mode}</dt><dd>{l.modes[data.mode] || data.mode}</dd></div>
          {data.mode === 'direct' && data.privacy && <div><dt>{l.privacy}</dt><dd>{l.privacies[data.privacy] || data.privacy}</dd></div>}
          <div><dt>{l.time}</dt><dd>{Array.isArray(data.slots) ? data.slots.map((s) => s.time || l.slotOff).join(' · ') : data.time} <span className="rt-note">({data.timezone})</span></dd></div>
          {data.pending && <div><dt>{l.pending}</dt><dd data-testid="tt-pending">{data.pending.count} / {data.pending.max}</dd></div>}
          <div><dt>{l.account}</dt><dd data-testid="tt-account">{data.connected ? `${l.connectedAs}${data.account && data.account.name ? ` · ${data.account.name}` : ''}` : l.notConnected}</dd></div>
          {tok && tok.refreshExpiresAt && <div><dt>{l.refreshUntil}</dt><dd>{fmtTime(tok.refreshExpiresAt, lang)}</dd></div>}
        </dl>
      )}
      {data.authError && <AdminAlert>{l.authError}</AdminAlert>}
      {tok && !tok.scopeOk && !data.authError && <AdminAlert>{l.scopeMissing}</AdminAlert>}
      {tok && tok.refreshSoon && !data.authError && <p className="admin-section-lead">{l.refreshSoon}</p>}
      {data.enabled && superAdmin && (
        <>
          <p className="admin-section-lead">{l.connectLead}</p>
          <div className="ig-row">
            <button type="button" className="ui-btn ui-btn--primary" onClick={() => window.location.assign('/api/tiktok/connect')} data-testid="tt-connect">
              {data.connected ? l.reconnect : l.connect}
            </button>
            {data.connected && <Confirm t={{ confirm: l.disconnectAsk, yes: l.yes, cancel: l.cancel }} label={l.disconnect} testId="tt-disconnect" onYes={disconnect} />}
          </div>
          {msg && (msg.ok ? <p className="rt-note" role="status">{msg.text}</p> : <AdminAlert>{msg.text}</AdminAlert>)}
        </>
      )}
    </section>
  )
}

function Today({ l, data, superAdmin, onDone }) {
  const { file: f, post: p } = data.today
  const [msg, setMsg] = useState(null)
  const [copied, setCopied] = useState(false)
  const caption = (p && p.caption) || null
  const canPost = superAdmin && data.connected && !data.authError && f && !p
  const go = () => {
    setMsg(null)
    apiFetch('/api/admin/tiktok/post', { method: 'POST', admin: true, body: { confirm: true } })
      .then(() => { setMsg({ ok: true, text: l.postSent }); setTimeout(onDone, 5000) })
      .catch(() => setMsg({ ok: false, text: l.postErr }))
  }
  const copy = () => {
    try { navigator.clipboard.writeText(caption).then(() => setCopied(true), () => {}) } catch { /* */ }
  }
  return (
    <section className="admin-section" aria-label={l.today} data-testid="tt-today">
      <SectionTitle icon="play">{l.today}</SectionTitle>
      <dl className="ig-facts">
        <div><dt>{l.file}</dt><dd data-testid="tt-file">{data.today.date} — {f ? `${l.ready} · ${f.ref} · ${(f.durationMs / 1000).toFixed(1)} s · ${(f.size / 1048576).toFixed(1)} MB` : l.missing}</dd></div>
        <div><dt>{l.upload}</dt><dd>{p ? <>{l.st[p.status] || p.status}{p.error && p.status !== 'published' && p.status !== 'sent' ? <span className="rt-note"> · {p.error}</span> : null}</> : l.notYet}</dd></div>
      </dl>
      {caption && (
        <div>
          <h3 className="ig-caption-title">{l.caption}</h3>
          {data.mode === 'inbox' && <p className="admin-section-lead">{l.captionInbox}</p>}
          <pre className="ig-caption" dir="auto" data-testid="tt-caption">{caption}</pre>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copy}>{copied ? l.copied : l.copy}</button>
        </div>
      )}
      {canPost && (
        <div className="ig-row">
          <Confirm t={{ confirm: l.postAsk, yes: l.yes, cancel: l.cancel }} label={l.postNow} icon="send" testId="tt-post" onYes={go} />
        </div>
      )}
      {msg && (msg.ok ? <p className="rt-note" role="status">{msg.text}</p> : <AdminAlert>{msg.text}</AdminAlert>)}
    </section>
  )
}

/** 3 yuva (server/tiktok.js status().slots): vaxt, növ, fayl, göndəriş, caption + Kopyala, "İndi göndər". */
function Slots({ l, data, superAdmin, onDone }) {
  const full = data.pending && data.pending.count >= data.pending.max
  return (
    <section className="admin-section" aria-label={l.slotsTitle} data-testid="tt-today">
      <SectionTitle icon="play">{l.slotsTitle} <span className="rt-note">({data.today.date})</span></SectionTitle>
      {full && <AdminAlert>{l.pendingFull}</AdminAlert>}
      {data.slots.map((s) => <SlotRow key={s.key} l={l} s={s} data={data} superAdmin={superAdmin} onDone={onDone} />)}
    </section>
  )
}

function SlotRow({ l, s, data, superAdmin, onDone }) {
  const [msg, setMsg] = useState(null)
  const [copied, setCopied] = useState(false)
  const { file: f, post: p } = s
  const caption = (p && p.caption) || null
  const canPost = superAdmin && s.time && data.connected && !data.authError && f && !p
  const go = () => {
    setMsg(null)
    apiFetch('/api/admin/tiktok/post', { method: 'POST', admin: true, body: { confirm: true, slot: s.key } })
      .then(() => { setMsg({ ok: true, text: l.postSent }); setTimeout(onDone, 5000) })
      .catch(() => setMsg({ ok: false, text: l.postErr }))
  }
  const copy = () => {
    try { navigator.clipboard.writeText(caption).then(() => setCopied(true), () => {}) } catch { /* */ }
  }
  const what = f ? `${l.ready} · ${f.ref || f.item || ''} · ${(f.durationMs / 1000).toFixed(1)} s · ${(f.size / 1048576).toFixed(1)} MB` : l.missing
  return (
    <div data-testid={`tt-slot-${s.key}`}>
      <h3 className="ig-caption-title">{s.time || l.slotOff} — {l.kinds[s.kind] || s.kind}</h3>
      <dl className="ig-facts">
        <div><dt>{l.file}</dt><dd>{what}</dd></div>
        <div><dt>{l.upload}</dt><dd>{p ? <>{l.st[p.status] || p.status}{p.error && p.status !== 'published' && p.status !== 'sent' ? <span className="rt-note"> · {p.error}</span> : null}</> : l.notYet}</dd></div>
      </dl>
      {caption && (
        <div>
          {data.mode === 'inbox' && <p className="admin-section-lead">{l.captionInbox}</p>}
          <pre className="ig-caption" dir="auto" data-testid={`tt-caption-${s.key}`}>{caption}</pre>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copy}>{copied ? l.copied : l.copy}</button>
        </div>
      )}
      {canPost && (
        <div className="ig-row">
          <Confirm t={{ confirm: l.postAskSlot, yes: l.yes, cancel: l.cancel }} label={l.postNow} icon="send" testId={`tt-post-${s.key}`} onYes={go} />
        </div>
      )}
      {msg && (msg.ok ? <p className="rt-note" role="status">{msg.text}</p> : <AdminAlert>{msg.text}</AdminAlert>)}
    </div>
  )
}

function Recent({ l, lang, posts }) {
  return (
    <section className="admin-section" aria-label={l.recent}>
      <SectionTitle icon="list">{l.recent}</SectionTitle>
      {!posts.length && <AdminEmpty icon="tiktok">{l.none}</AdminEmpty>}
      {posts.length > 0 && (
        <div className="ig-table-wrap">
          <table className="ig-table">
            <tbody>
              {posts.map((p) => (
                <tr key={`${p.day}-${p.slot || 'ayah'}`}>
                  <td>{p.day}</td>
                  <td>{p.kind ? `${l.kinds[p.kind] || p.kind} · ` : ''}{l.modeShort[p.mode] || p.mode}{p.item ? <span className="rt-note"> · {p.item}</span> : null}</td>
                  <td>{l.st[p.status] || p.status}{p.error && p.status !== 'published' && p.status !== 'sent' ? <span className="rt-note"> · {p.error}</span> : null}</td>
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
