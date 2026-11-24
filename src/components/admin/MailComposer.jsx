// ═══════════════════════════════════════════════════════
// Admin: istifadəçilərə məktub — YALNIZ baş admin (server/mailCampaigns.js serverdə yoxlayır)
//   POST /api/admin/mail/preview | test | audience | campaigns, GET /api/admin/mail/campaigns,
//   POST /api/admin/mail/campaigns/:id/cancel
// Axın: alıcılar → dil (bir versiya / hər dilə ayrı) → mövzu + mətn (+ düymə) → canlı önizləmə
//   (sandbox iframe, HTML serverdə qurulur) → "Özümə sınaq" → "Göndərməyə hazırla" (say göstərilir)
//   → "Bəli, N nəfərə göndər" → növbə (irəliləyiş, dayandırma).
// Mətn sahəsindən HTML keçmir: server hər şeyi escape edir, yalnız **qalın** və https keçidləri qalır.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { AdminHeader, AdminEmpty, AdminAlert, AdminToast, SectionTitle } from './AdminUi'
import {
  adminMailAudience, adminMailCampaigns, adminMailCancel, adminMailCreate, adminMailPreview, adminMailTest,
} from '../../api/userAuth'
import { MAIL_TEMPLATES, MAIL_THEMES, THEME_NAMES, themeThumb } from '../../utils/mailTemplates'

const MAIL_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const EMPTY = { subject: '', body: '', ctaLabel: '', ctaUrl: '' }

const LABELS = {
  az: {
    title: 'E-poçt göndər', sub: 'Saytın istifadəçilərinə məktub — yalnız baş admin',
    recipients: 'Alıcılar', recAll: 'Bütün təsdiqlənmiş istifadəçilər', recSelected: 'Seçilmiş istifadəçilər: {n}', recOne: 'Bir istifadəçi',
    recNote: 'Təsdiqlənməmiş, bloklanmış və bu məktublardan imtina etmiş hesablar heç vaxt məktub almır.',
    pickHint: 'Ayrı-ayrı istifadəçiləri seçmək üçün «İstifadəçilər» bölməsində qutucuqları işarələyin.', clearTargets: 'Seçimi təmizlə',
    language: 'Dil', langSingle: 'Hamıya bir versiya', langPer: 'Hər dilə ayrı versiya', langOf: 'Məktubun dili',
    include: 'Hansı dillərdə yazırsınız', fallback: 'Ehtiyat dil',
    fallbackHint: 'Sayt dili yazdığınız versiyalardan biri olmayan istifadəçilər ehtiyat dilin versiyasını alır.',
    header: 'Başlıq', headerGif: 'Animasiyalı (palitranın şəkli)', headerText: 'Sadə mətn başlığı', theme: 'Rəng palitrası',
    templates: 'Hazır şablonlar', templatesHint: 'Şablonu seçin — 5 dilin hamısında mövzu, mətn, düymə və rəng palitrası doldurulacaq. Sonra istədiyiniz kimi dəyişə bilərsiniz.',
    tplApplied: '«{name}» şablonu tətbiq olundu — 5 dildə versiya hazırdır', undo: 'Geri qaytar', undone: 'Əvvəlki mətn qaytarıldı', errTheme: 'Rəng palitrası düzgün deyil',
    edit: 'Versiyanı redaktə et', subject: 'Mövzu', body: 'Mətn',
    bodyHint: 'Boş sətir — yeni abzas. **qalın**, [mətn](https://…) və ya sadəcə https://… keçid. HTML qəbul olunmur.',
    ctaLabel: 'Düymənin mətni (ixtiyari)', ctaUrl: 'Düymənin keçidi',
    ctaHint: 'Yalnız muslims.cc keçidi. «/quran» kimi yol yazsanız, dil prefiksi özü əlavə olunur.',
    preview: 'Önizləmə', previewEmpty: 'Mövzu və mətni yazın — önizləmə burada görünəcək', previewFrame: 'Məktubun önizləməsi',
    test: 'Özümə sınaq göndər', testSent: 'Sınaq məktubu panel e-poçtunuza göndərildi',
    prepare: 'Göndərməyə hazırla', confirmTitle: 'Göndərişi təsdiqləyin', confirmCount: 'Bu məktub {n} nəfərə göndəriləcək.',
    confirmLangs: 'Versiyalar üzrə', excluded: 'Kənarda qalır — təsdiqlənməmiş: {u}, bloklanmış: {d}, imtina etmiş: {o}',
    confirmPace: 'Məktublar növbə ilə gedir: saatda ən çox 300. Bu səhifəni bağlasanız da göndəriş davam edir.',
    confirmYes: 'Bəli, {n} nəfərə göndər', back: 'Geri', queued: 'Göndəriş növbəyə qoyuldu',
    history: 'Göndərişlər', historyNone: 'Hələ göndəriş yoxdur', progress: 'Göndərilib: {sent} / {total}',
    failedN: 'Alınmadı: {n}', skippedN: 'Ötürülüb: {n}', stSending: 'Göndərilir', stDone: 'Bitib', stCancelled: 'Dayandırılıb',
    stop: 'Dayandır', stopped: 'Göndəriş dayandırıldı', hourLimit: 'Son bir saatda göndərilib: {n} / {max}', by: 'Göndərən',
    mailOff: 'Serverdə e-poçt göndərişi sönülüdür — məktublar getməyəcək.',
    errSubject: 'Mövzu boşdur və ya çox uzundur (150 simvola qədər)', errBody: 'Mətn boşdur və ya çox uzundur (10 000 simvola qədər)',
    errCta: 'Düymə üçün həm mətn, həm də muslims.cc keçidi lazımdır', errLang: 'Dil seçimi düzgün deyil',
    errFallback: 'Ehtiyat dil yazdığınız versiyalardan biri olmalıdır', errRecipients: 'Alıcı seçilməyib',
    errNoRecipients: 'Bu seçimdə məktub ala biləcək istifadəçi yoxdur', errCountChanged: 'Alıcıların sayı dəyişdi — yenidən yoxlayın',
    errMailOff: 'E-poçt göndərişi serverdə sönülüdür', errSendFailed: 'Məktub göndərilmədi — bir az sonra yenidən cəhd edin',
    errNotActive: 'Bu göndəriş artıq bitib', errSuperOnly: 'Bu bölmə yalnız baş admin üçündür',
    errSessionReq: 'Bu bölmə üçün panelə e-poçt və şifrə ilə yenidən daxil olun', errMany: 'Çox sorğu — bir az gözləyin',
    errNet: 'Serverə qoşulmaq alınmadı', errUnknown: 'Xəta baş verdi', inVersion: 'Versiya: {lang}',
  },
  en: {
    title: 'Send email', sub: 'Email the site’s users — superadmin only',
    recipients: 'Recipients', recAll: 'All verified users', recSelected: 'Selected users: {n}', recOne: 'One user',
    recNote: 'Unverified, blocked and unsubscribed accounts never receive these emails.',
    pickHint: 'To pick individual users, tick the boxes in the “Users” section.', clearTargets: 'Clear selection',
    language: 'Language', langSingle: 'One version for everyone', langPer: 'A version per language', langOf: 'Email language',
    include: 'Languages you are writing in', fallback: 'Fallback language',
    fallbackHint: 'Users whose site language is not one of your versions get the fallback version.',
    header: 'Header', headerGif: 'Animated (theme image)', headerText: 'Simple text header', theme: 'Colour theme',
    templates: 'Ready-made templates', templatesHint: 'Pick a template — subject, message, button and colour theme are filled in for all 5 languages. You can then edit anything.',
    tplApplied: 'The “{name}” template was applied — versions in 5 languages are ready', undo: 'Undo', undone: 'Your previous text was restored', errTheme: 'The colour theme is not valid',
    edit: 'Edit version', subject: 'Subject', body: 'Message',
    bodyHint: 'Blank line — new paragraph. **bold**, [text](https://…) or a plain https://… link. HTML is not accepted.',
    ctaLabel: 'Button text (optional)', ctaUrl: 'Button link',
    ctaHint: 'Only a muslims.cc link. If you type a path like “/quran”, the language prefix is added for you.',
    preview: 'Preview', previewEmpty: 'Write a subject and a message — the preview appears here', previewFrame: 'Email preview',
    test: 'Send a test to me', testSent: 'The test email was sent to your panel email',
    prepare: 'Prepare to send', confirmTitle: 'Confirm sending', confirmCount: 'This email will go to {n} people.',
    confirmLangs: 'By version', excluded: 'Left out — unverified: {u}, blocked: {d}, unsubscribed: {o}',
    confirmPace: 'Emails go out in a queue: at most 300 per hour. Sending continues even if you close this page.',
    confirmYes: 'Yes, send to {n} people', back: 'Back', queued: 'Sending has been queued',
    history: 'Campaigns', historyNone: 'Nothing sent yet', progress: 'Sent: {sent} / {total}',
    failedN: 'Failed: {n}', skippedN: 'Skipped: {n}', stSending: 'Sending', stDone: 'Finished', stCancelled: 'Stopped',
    stop: 'Stop', stopped: 'Sending stopped', hourLimit: 'Sent in the last hour: {n} / {max}', by: 'Sent by',
    mailOff: 'Email sending is turned off on the server — no emails will go out.',
    errSubject: 'The subject is empty or too long (up to 150 characters)', errBody: 'The message is empty or too long (up to 10,000 characters)',
    errCta: 'The button needs both a text and a muslims.cc link', errLang: 'The language choice is not valid',
    errFallback: 'The fallback language must be one of your versions', errRecipients: 'No recipients chosen',
    errNoRecipients: 'Nobody in this selection can receive email', errCountChanged: 'The number of recipients changed — check again',
    errMailOff: 'Email sending is turned off on the server', errSendFailed: 'The email was not sent — try again a bit later',
    errNotActive: 'This campaign has already finished', errSuperOnly: 'This section is for the superadmin only',
    errSessionReq: 'Sign in to the panel again with email and password to use this section', errMany: 'Too many requests — wait a little',
    errNet: 'Could not reach the server', errUnknown: 'Something went wrong', inVersion: 'Version: {lang}',
  },
  ru: {
    title: 'Отправить письмо', sub: 'Письмо пользователям сайта — только для суперадминистратора',
    recipients: 'Получатели', recAll: 'Все подтверждённые пользователи', recSelected: 'Выбранные пользователи: {n}', recOne: 'Один пользователь',
    recNote: 'Неподтверждённые, заблокированные и отписавшиеся аккаунты никогда не получают эти письма.',
    pickHint: 'Чтобы выбрать отдельных пользователей, отметьте их в разделе «Пользователи».', clearTargets: 'Сбросить выбор',
    language: 'Язык', langSingle: 'Одна версия для всех', langPer: 'Своя версия для каждого языка', langOf: 'Язык письма',
    include: 'На каких языках вы пишете', fallback: 'Запасной язык',
    fallbackHint: 'Пользователи, чей язык сайта не совпадает ни с одной версией, получат версию на запасном языке.',
    header: 'Шапка', headerGif: 'Анимированная (картинка темы)', headerText: 'Простая текстовая шапка', theme: 'Цветовая тема',
    templates: 'Готовые шаблоны', templatesHint: 'Выберите шаблон — тема письма, текст, кнопка и цветовая тема заполнятся на всех 5 языках. Потом всё можно изменить.',
    tplApplied: 'Шаблон «{name}» применён — версии на 5 языках готовы', undo: 'Отменить', undone: 'Прежний текст восстановлен', errTheme: 'Неверная цветовая тема',
    edit: 'Редактировать версию', subject: 'Тема', body: 'Текст',
    // lang-ok[HTML,https]: синтаксис разметки, не текст
    bodyHint: 'Пустая строка — новый абзац. **жирный**, [текст](https://…) или просто ссылка https://… HTML не принимается.',
    ctaLabel: 'Текст кнопки (необязательно)', ctaUrl: 'Ссылка кнопки',
    // lang-ok[muslims,cc,quran]: название сайта и путь URL
    ctaHint: 'Только ссылка на muslims.cc. Если указать путь вроде «/quran», языковой префикс добавится сам.',
    preview: 'Предпросмотр', previewEmpty: 'Напишите тему и текст — предпросмотр появится здесь', previewFrame: 'Предпросмотр письма',
    test: 'Отправить тест себе', testSent: 'Тестовое письмо отправлено на почту вашей панели',
    prepare: 'Подготовить отправку', confirmTitle: 'Подтвердите отправку', confirmCount: 'Письмо получат {n} чел.',
    confirmLangs: 'По версиям', excluded: 'Не получат — неподтверждённые: {u}, заблокированные: {d}, отписавшиеся: {o}',
    confirmPace: 'Письма уходят по очереди: не более 300 в час. Отправка продолжится, даже если закрыть эту страницу.',
    confirmYes: 'Да, отправить ({n} чел.)', back: 'Назад', queued: 'Отправка поставлена в очередь',
    history: 'Рассылки', historyNone: 'Пока ничего не отправлено', progress: 'Отправлено: {sent} из {total}',
    failedN: 'Не удалось: {n}', skippedN: 'Пропущено: {n}', stSending: 'Отправляется', stDone: 'Завершена', stCancelled: 'Остановлена',
    stop: 'Остановить', stopped: 'Отправка остановлена', hourLimit: 'Отправлено за последний час: {n} из {max}', by: 'Отправитель',
    mailOff: 'Отправка почты на сервере выключена — письма не уйдут.',
    errSubject: 'Тема пуста или слишком длинная (до 150 символов)', errBody: 'Текст пуст или слишком длинный (до 10 000 символов)',
    // lang-ok[muslims,cc]: название сайта
    errCta: 'Для кнопки нужны и текст, и ссылка на muslims.cc', errLang: 'Неверный выбор языка',
    errFallback: 'Запасной язык должен быть одной из ваших версий', errRecipients: 'Получатели не выбраны',
    errNoRecipients: 'В этой выборке никто не может получить письмо', errCountChanged: 'Число получателей изменилось — проверьте снова',
    errMailOff: 'Отправка почты на сервере выключена', errSendFailed: 'Письмо не отправлено — попробуйте чуть позже',
    errNotActive: 'Эта рассылка уже завершена', errSuperOnly: 'Этот раздел только для суперадминистратора',
    errSessionReq: 'Чтобы открыть этот раздел, войдите в панель снова по почте и паролю', errMany: 'Слишком много запросов — подождите немного',
    errNet: 'Не удалось связаться с сервером', errUnknown: 'Произошла ошибка', inVersion: 'Версия: {lang}',
  },
  tr: {
    title: 'E-posta gönder', sub: 'Sitenin kullanıcılarına e-posta — yalnızca süper yönetici',
    recipients: 'Alıcılar', recAll: 'Tüm onaylı kullanıcılar', recSelected: 'Seçilen kullanıcılar: {n}', recOne: 'Tek kullanıcı',
    recNote: 'Onaylanmamış, engellenmiş ve abonelikten çıkmış hesaplar bu e-postaları asla almaz.',
    pickHint: 'Tek tek kullanıcı seçmek için «Kullanıcılar» bölümünde kutucukları işaretleyin.', clearTargets: 'Seçimi temizle',
    language: 'Dil', langSingle: 'Herkese tek sürüm', langPer: 'Her dile ayrı sürüm', langOf: 'E-postanın dili',
    include: 'Hangi dillerde yazıyorsunuz', fallback: 'Yedek dil',
    fallbackHint: 'Site dili sürümlerinizden biri olmayan kullanıcılar yedek dildeki sürümü alır.',
    header: 'Üst kısım', headerGif: 'Hareketli (temanın görseli)', headerText: 'Sade metin başlığı', theme: 'Renk teması',
    templates: 'Hazır şablonlar', templatesHint: 'Bir şablon seçin — 5 dilin hepsinde konu, metin, düğme ve renk teması doldurulur. Sonra dilediğiniz gibi değiştirebilirsiniz.',
    tplApplied: '«{name}» şablonu uygulandı — 5 dilde sürüm hazır', undo: 'Geri al', undone: 'Önceki metin geri getirildi', errTheme: 'Renk teması geçersiz',
    edit: 'Sürümü düzenle', subject: 'Konu', body: 'Metin',
    bodyHint: 'Boş satır — yeni paragraf. **kalın**, [metin](https://…) veya düz https://… bağlantısı. HTML kabul edilmez.',
    ctaLabel: 'Düğme metni (isteğe bağlı)', ctaUrl: 'Düğme bağlantısı',
    // lang-ok[quran]: URL yolu (path), metin değil
    ctaHint: 'Yalnızca muslims.cc bağlantısı. «/quran» gibi bir yol yazarsanız dil öneki kendiliğinden eklenir.',
    preview: 'Önizleme', previewEmpty: 'Konuyu ve metni yazın — önizleme burada görünecek', previewFrame: 'E-posta önizlemesi',
    test: 'Kendime deneme gönder', testSent: 'Deneme e-postası panel e-postanıza gönderildi',
    prepare: 'Göndermeye hazırla', confirmTitle: 'Gönderimi onaylayın', confirmCount: 'Bu e-posta {n} kişiye gidecek.',
    confirmLangs: 'Sürümlere göre', excluded: 'Dışarıda kalan — onaysız: {u}, engelli: {d}, abonelikten çıkmış: {o}',
    confirmPace: 'E-postalar sırayla gider: saatte en fazla 300. Bu sayfayı kapatsanız da gönderim sürer.',
    confirmYes: 'Evet, {n} kişiye gönder', back: 'Geri', queued: 'Gönderim sıraya alındı',
    history: 'Gönderimler', historyNone: 'Henüz gönderim yok', progress: 'Gönderildi: {sent} / {total}',
    failedN: 'Başarısız: {n}', skippedN: 'Atlandı: {n}', stSending: 'Gönderiliyor', stDone: 'Bitti', stCancelled: 'Durduruldu',
    stop: 'Durdur', stopped: 'Gönderim durduruldu', hourLimit: 'Son bir saatte gönderilen: {n} / {max}', by: 'Gönderen',
    mailOff: 'Sunucuda e-posta gönderimi kapalı — e-postalar gitmeyecek.',
    errSubject: 'Konu boş veya çok uzun (en fazla 150 karakter)', errBody: 'Metin boş veya çok uzun (en fazla 10.000 karakter)',
    errCta: 'Düğme için hem metin hem de muslims.cc bağlantısı gerekir', errLang: 'Dil seçimi geçersiz',
    errFallback: 'Yedek dil sürümlerinizden biri olmalı', errRecipients: 'Alıcı seçilmedi',
    errNoRecipients: 'Bu seçimde e-posta alabilecek kullanıcı yok', errCountChanged: 'Alıcı sayısı değişti — yeniden kontrol edin',
    errMailOff: 'Sunucuda e-posta gönderimi kapalı', errSendFailed: 'E-posta gönderilemedi — biraz sonra yeniden deneyin',
    errNotActive: 'Bu gönderim zaten bitti', errSuperOnly: 'Bu bölüm yalnızca süper yönetici içindir',
    errSessionReq: 'Bu bölüm için panele e-posta ve şifreyle yeniden giriş yapın', errMany: 'Çok fazla istek — biraz bekleyin',
    errNet: 'Sunucuya bağlanılamadı', errUnknown: 'Bir hata oluştu', inVersion: 'Sürüm: {lang}',
  },
  ar: {
    title: 'إرسال بريد', sub: 'رسالة إلى مستخدمي الموقع — للمشرف الأعلى فقط',
    recipients: 'المستلمون', recAll: 'كل المستخدمين المؤكَّدين', recSelected: 'المستخدمون المحددون: {n}', recOne: 'مستخدم واحد',
    recNote: 'الحسابات غير المؤكَّدة والمحظورة والملغاة اشتراكها لا تصلها هذه الرسائل أبدًا.',
    pickHint: 'لاختيار مستخدمين بعينهم، حدّد المربعات في قسم «المستخدمون».', clearTargets: 'مسح التحديد',
    language: 'اللغة', langSingle: 'نسخة واحدة للجميع', langPer: 'نسخة لكل لغة', langOf: 'لغة الرسالة',
    include: 'اللغات التي تكتب بها', fallback: 'اللغة الاحتياطية',
    fallbackHint: 'من لم تكن لغة الموقع لديه إحدى نسخك يتلقى نسخة اللغة الاحتياطية.',
    header: 'الترويسة', headerGif: 'متحركة (صورة السمة)', headerText: 'ترويسة نصية بسيطة', theme: 'سمة الألوان',
    templates: 'قوالب جاهزة', templatesHint: 'اختر قالبًا — يُملأ الموضوع والنص والزر وسمة الألوان باللغات الخمس كلها. بعد ذلك يمكنك تعديل ما تشاء.',
    tplApplied: 'طُبّق قالب «{name}» — النسخ باللغات الخمس جاهزة', undo: 'تراجع', undone: 'استُعيد نصك السابق', errTheme: 'سمة الألوان غير صالحة',
    edit: 'تحرير النسخة', subject: 'الموضوع', body: 'النص',
    // lang-ok[HTML,https]: صيغة التنسيق وليست نصًا
    bodyHint: 'سطر فارغ — فقرة جديدة. **عريض**، [نص](https://…) أو رابط https://… مباشر. لا يُقبل HTML.',
    ctaLabel: 'نص الزر (اختياري)', ctaUrl: 'رابط الزر',
    // lang-ok[muslims,cc,quran]: اسم الموقع ومسار
    ctaHint: 'رابط muslims.cc فقط. إن كتبت مسارًا مثل «/quran» تُضاف بادئة اللغة تلقائيًا.',
    preview: 'معاينة', previewEmpty: 'اكتب الموضوع والنص — تظهر المعاينة هنا', previewFrame: 'معاينة الرسالة',
    test: 'أرسل تجربة إليّ', testSent: 'أُرسلت رسالة التجربة إلى بريد لوحتك',
    prepare: 'التحضير للإرسال', confirmTitle: 'تأكيد الإرسال', confirmCount: 'ستُرسل هذه الرسالة إلى {n} شخص.',
    confirmLangs: 'حسب النسخة', excluded: 'المستثنون — غير المؤكَّدين: {u}، المحظورون: {d}، الملغاة اشتراكاتهم: {o}',
    confirmPace: 'تُرسل الرسائل بالدور: 300 في الساعة على الأكثر. يستمر الإرسال حتى لو أغلقت هذه الصفحة.',
    confirmYes: 'نعم، أرسل إلى {n} شخص', back: 'رجوع', queued: 'وُضع الإرسال في الطابور',
    history: 'الإرسالات', historyNone: 'لم يُرسل شيء بعد', progress: 'أُرسل: {sent} من {total}',
    failedN: 'تعذّر: {n}', skippedN: 'تُخطّي: {n}', stSending: 'جارٍ الإرسال', stDone: 'انتهى', stCancelled: 'أُوقف',
    stop: 'إيقاف', stopped: 'أُوقف الإرسال', hourLimit: 'أُرسل في الساعة الأخيرة: {n} من {max}', by: 'المرسِل',
    mailOff: 'إرسال البريد معطّل على الخادم — لن تُرسل الرسائل.',
    errSubject: 'الموضوع فارغ أو طويل جدًا (حتى 150 حرفًا)', errBody: 'النص فارغ أو طويل جدًا (حتى 10000 حرف)',
    // lang-ok[muslims,cc]: اسم الموقع
    errCta: 'يحتاج الزر إلى نص ورابط muslims.cc معًا', errLang: 'اختيار اللغة غير صالح',
    errFallback: 'يجب أن تكون اللغة الاحتياطية إحدى نسخك', errRecipients: 'لم يُحدَّد مستلمون',
    errNoRecipients: 'لا أحد في هذا التحديد يمكنه تلقي البريد', errCountChanged: 'تغيّر عدد المستلمين — تحقّق مجددًا',
    errMailOff: 'إرسال البريد معطّل على الخادم', errSendFailed: 'لم تُرسل الرسالة — حاول بعد قليل',
    errNotActive: 'هذا الإرسال انتهى بالفعل', errSuperOnly: 'هذا القسم للمشرف الأعلى فقط',
    errSessionReq: 'لاستخدام هذا القسم سجّل الدخول إلى اللوحة مجددًا بالبريد وكلمة المرور', errMany: 'طلبات كثيرة — انتظر قليلًا',
    errNet: 'تعذّر الاتصال بالخادم', errUnknown: 'حدث خطأ', inVersion: 'النسخة: {lang}',
  },
}

const CODE = {
  bad_subject: 'errSubject', bad_body: 'errBody', bad_cta: 'errCta', bad_lang: 'errLang', bad_mode: 'errLang', bad_fallback: 'errFallback', bad_theme: 'errTheme',
  bad_recipients: 'errRecipients', no_recipients: 'errNoRecipients', count_changed: 'errCountChanged', confirm_required: 'errCountChanged',
  mail_disabled: 'errMailOff', send_failed: 'errSendFailed', not_active: 'errNotActive', superadmin_required: 'errSuperOnly',
  session_required: 'errSessionReq', rate_limited: 'errMany', no_email: 'errSendFailed',
}
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k])))
const newRequestId = () => {
  try { if (globalThis.crypto && globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID() } catch { /* köhnə brauzer */ }
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

/** Klientdə ilkin yoxlama (server də yoxlayır) → xəta açarı | '' */
function localError(content) {
  for (const v of Object.values(content.versions)) {
    if (!v.subject.trim() || v.subject.trim().length > 150) return 'errSubject'
    if (!v.body.trim() || v.body.length > 10000) return 'errBody'
    if (Boolean(v.ctaLabel.trim()) !== Boolean(v.ctaUrl.trim())) return 'errCta'
  }
  return ''
}

export default function MailComposer({ targets = [], onClearTargets }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang)
  const hasTargets = targets.length > 0
  const [useAll, setUseAll] = useState(!hasTargets)
  const [langMode, setLangMode] = useState('single')
  const [singleLang, setSingleLang] = useState('az')
  const [included, setIncluded] = useState(['az', 'en'])
  const [fallback, setFallback] = useState('en')
  const [editLang, setEditLang] = useState('az')
  const [header, setHeader] = useState('gif')
  const [theme, setTheme] = useState('emerald')
  const [tplId, setTplId] = useState('')
  const [tplNote, setTplNote] = useState('')
  const [undo, setUndo] = useState(null)
  const [versions, setVersions] = useState(() => Object.fromEntries(MAIL_LANGS.map((x) => [x, { ...EMPTY }])))
  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [list, setList] = useState(null)
  const toastTimer = useRef(0)
  const requestId = useRef('')

  const langs = langMode === 'single' ? [singleLang] : MAIL_LANGS.filter((x) => included.includes(x))
  const activeLang = langs.includes(editLang) ? editLang : langs[0]
  const content = useMemo(() => ({
    mode: langMode, header, theme,
    ...(langMode === 'perLang' ? { fallback: langs.includes(fallback) ? fallback : langs[0] } : {}),
    versions: Object.fromEntries(langs.map((x) => [x, versions[x]])),
  }), [langMode, header, theme, fallback, versions, langs.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
  // Seçim təmizlənibsə — "hamısı"; əks halda 1 nəfər → "one", çox → "selected"
  const recMode = useAll || !hasTargets ? 'all' : targets.length === 1 ? 'one' : 'selected'
  const recipients = recMode === 'all' ? { mode: 'all' } : { mode: recMode, ids: targets.map((t) => t.id) }
  const invalid = localError(content)

  const errMsg = useCallback((e) => {
    if (e && e.status === 429) return l.errMany
    const k = e && CODE[e.code]
    if (k) return l[k]
    if (e && e.name === 'TypeError') return l.errNet
    return l.errUnknown
  }, [l])
  const flash = (msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // ── Canlı önizləmə (gecikmə ilə; HTML serverdə qurulur) ──
  const contentKey = JSON.stringify(content)
  useEffect(() => {
    if (invalid) return undefined
    let live = true
    const h = setTimeout(() => {
      adminMailPreview(content, activeLang).then((r) => { if (live) setPreview(r) }).catch((e) => { if (live) { setPreview(null); setErr(errMsg(e)) } })
    }, 600)
    return () => { live = false; clearTimeout(h) }
  }, [contentKey, activeLang, invalid]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Göndərişlər + irəliləyiş (göndəriş gedirkən 4 saniyədə bir) ──
  const loadList = useCallback(async () => {
    try { setList(await adminMailCampaigns()) } catch (e) { setList((x) => x || { campaigns: [] }); setErr(errMsg(e)) }
  }, [errMsg])
  useEffect(() => { loadList() }, [loadList])
  const active = Boolean(list && list.campaigns.some((c) => c.status === 'sending'))
  useEffect(() => {
    if (!active) return undefined
    const h = setInterval(loadList, 4000)
    return () => clearInterval(h)
  }, [active, loadList])

  // ── Şablon: 5 dilin hamısını + rəng mövzusunu doldurur; əvvəlki vəziyyət "Geri qaytar" üçün saxlanır ──
  const applyTemplate = (t) => {
    setUndo({ langMode, singleLang, included, fallback, editLang, header, theme, versions, tplId })
    setConfirm(null)
    setVersions(Object.fromEntries(MAIL_LANGS.map((x) => [x, { ...EMPTY, ...t.versions[x] }])))
    setLangMode('perLang')
    setIncluded([...MAIL_LANGS])
    setFallback('en')
    setEditLang(MAIL_LANGS.includes(lang) ? lang : 'az')
    setHeader('gif')
    setTheme(t.theme)
    setTplId(t.id)
    setTplNote(fill(l.tplApplied, { name: t.name[lang] || t.name.en }))
  }
  const undoTemplate = () => {
    const u = undo
    if (!u) return
    setUndo(null)
    setConfirm(null)
    setLangMode(u.langMode); setSingleLang(u.singleLang); setIncluded(u.included); setFallback(u.fallback)
    setEditLang(u.editLang); setHeader(u.header); setTheme(u.theme); setVersions(u.versions); setTplId(u.tplId)
    setTplNote(l.undone)
  }
  const themeNames = THEME_NAMES[lang] || THEME_NAMES.en

  const setField = (k, v) => { setConfirm(null); setVersions((vs) => ({ ...vs, [activeLang]: { ...vs[activeLang], [k]: v } })) }
  const toggleLang = (x) => {
    setConfirm(null)
    setIncluded((cur) => {
      const next = cur.includes(x) ? cur.filter((y) => y !== x) : [...cur, x]
      return next.length ? next : cur
    })
    setEditLang(x)
  }

  const run = async (kind, fn) => {
    setBusy(kind); setErr('')
    try { await fn() } catch (e) { setErr(errMsg(e)) } finally { setBusy('') }
  }
  const sendTest = () => run('test', async () => { await adminMailTest(content); flash(l.testSent) })
  const prepare = () => run('prepare', async () => {
    const a = await adminMailAudience(recipients, content)
    requestId.current = newRequestId()
    setConfirm(a)
  })
  const send = () => run('send', async () => {
    try {
      await adminMailCreate({ content, recipients, confirmCount: confirm.count, requestId: requestId.current })
    } catch (e) {
      if (e && e.code === 'count_changed' && e.body && Number.isInteger(e.body.count)) setConfirm((c) => c && { ...c, count: e.body.count })
      throw e
    }
    setConfirm(null)
    flash(l.queued)
    loadList()
  })
  const stop = (id) => run(`stop-${id}`, async () => { await adminMailCancel(id); flash(l.stopped); loadList() })

  const fmt = useMemo(() => {
    let f = null
    try { f = new Intl.DateTimeFormat(lang === 'az' ? 'az-Latn-AZ' : lang, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) } catch { /* köhnə brauzer */ }
    return (ms) => (ms ? (f ? f.format(new Date(ms)) : new Date(ms).toLocaleString()) : '')
  }, [lang])
  const v = versions[activeLang]
  const stText = { sending: l.stSending, done: l.stDone, cancelled: l.stCancelled }

  return (
    <div className="admin-mail">
      <AdminHeader icon="mail" title={l.title} sub={l.sub} />
      {list && list.mailEnabled === false && <AdminAlert tone="warn">{l.mailOff}</AdminAlert>}
      {err && <AdminAlert>{err}</AdminAlert>}

      <section className="admin-section" aria-labelledby="mail-tpl">
        <span id="mail-tpl"><SectionTitle icon="palette">{l.templates}</SectionTitle></span>
        <p className="admin-hint" id="mail-tpl-hint">{l.templatesHint}</p>
        <div className="admin-mail__tpls" role="group" aria-labelledby="mail-tpl" aria-describedby="mail-tpl-hint" data-testid="mail-templates">
          {MAIL_TEMPLATES.map((t) => (
            <button key={t.id} type="button" className="admin-mail__tpl" aria-pressed={tplId === t.id} onClick={() => applyTemplate(t)} data-testid={`mail-tpl-${t.id}`}>
              <img className="admin-mail__tpl-img" src={themeThumb(t.theme)} alt="" width="300" height="110" loading="lazy" decoding="async" />
              <span className="admin-mail__tpl-name">{t.name[lang] || t.name.en}</span>
              <span className="admin-mail__tpl-theme">{themeNames[t.theme]}</span>
            </button>
          ))}
        </div>
        <div className="admin-mail__tplnote" aria-live="polite" data-testid="mail-tpl-note">
          {tplNote && (
            <>
              <span>{tplNote}</span>
              {undo && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={undoTemplate}>{l.undo}</button>}
            </>
          )}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="mail-rcp">
        <span id="mail-rcp"><SectionTitle icon="user">{l.recipients}</SectionTitle></span>
        <div className="ui-segmented" role="radiogroup" aria-label={l.recipients}>
          <button type="button" role="radio" aria-checked={recMode === 'all'} onClick={() => { setConfirm(null); setUseAll(true) }}>{l.recAll}</button>
          {hasTargets && (
            <button type="button" role="radio" aria-checked={recMode !== 'all'} onClick={() => { setConfirm(null); setUseAll(false) }}>
              {targets.length === 1 ? l.recOne : fill(l.recSelected, { n: targets.length })}
            </button>
          )}
        </div>
        {hasTargets && recMode !== 'all' && (
          <div className="admin-mail__targets" data-testid="mail-targets">
            {targets.slice(0, 20).map((t) => <span key={t.id} className="ui-badge ui-badge--outline"><bdi>{t.email}</bdi></span>)}
            {targets.length > 20 && <span className="ui-badge">+{targets.length - 20}</span>}
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setConfirm(null); onClearTargets && onClearTargets() }}>{l.clearTargets}</button>
          </div>
        )}
        <p className="admin-hint">{l.recNote} {!hasTargets && l.pickHint}</p>
      </section>

      <section className="admin-section" aria-labelledby="mail-lang">
        <span id="mail-lang"><SectionTitle icon="globe">{l.language}</SectionTitle></span>
        <div className="ui-segmented" role="radiogroup" aria-label={l.language}>
          <button type="button" role="radio" aria-checked={langMode === 'single'} onClick={() => { setConfirm(null); setLangMode('single') }}>{l.langSingle}</button>
          <button type="button" role="radio" aria-checked={langMode === 'perLang'} onClick={() => { setConfirm(null); setLangMode('perLang') }}>{l.langPer}</button>
        </div>
        <div className="admin-form-row admin-mail__langrow">
          {langMode === 'single' ? (
            <label className="admin-input-group">
              <span className="admin-input-label">{l.langOf}</span>
              <select className="admin-input admin-select" value={singleLang} onChange={(e) => { setConfirm(null); setSingleLang(e.target.value); setEditLang(e.target.value) }} data-testid="mail-single-lang">
                {MAIL_LANGS.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}
              </select>
            </label>
          ) : (
            <>
              <fieldset className="admin-input-group admin-mail__include">
                <legend className="admin-input-label">{l.include}</legend>
                <div className="admin-mail__chips">
                  {MAIL_LANGS.map((x) => (
                    <label key={x} className="admin-mail__chip">
                      <input type="checkbox" checked={included.includes(x)} onChange={() => toggleLang(x)} data-testid={`mail-include-${x}`} /> {x.toUpperCase()}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="admin-input-group">
                <span className="admin-input-label">{l.fallback}</span>
                <select className="admin-input admin-select" value={content.fallback} onChange={(e) => { setConfirm(null); setFallback(e.target.value) }} data-testid="mail-fallback">
                  {langs.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}
                </select>
                <span className="admin-hint">{l.fallbackHint}</span>
              </label>
            </>
          )}
          <label className="admin-input-group">
            <span className="admin-input-label">{l.header}</span>
            <select className="admin-input admin-select" value={header} onChange={(e) => { setConfirm(null); setHeader(e.target.value) }} data-testid="mail-header">
              <option value="gif">{l.headerGif}</option>
              <option value="text">{l.headerText}</option>
            </select>
          </label>
          <label className="admin-input-group">
            <span className="admin-input-label">{l.theme}</span>
            <select className="admin-input admin-select" value={theme} onChange={(e) => { setConfirm(null); setTheme(e.target.value) }} data-testid="mail-theme">
              {MAIL_THEMES.map((x) => <option key={x} value={x}>{themeNames[x]}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="admin-section" aria-labelledby="mail-edit">
        <span id="mail-edit"><SectionTitle icon="edit">{langMode === 'perLang' ? l.edit : l.body}</SectionTitle></span>
        {langMode === 'perLang' && (
          <div className="admin-lang-tabs" role="group" aria-label={l.edit}>
            {langs.map((x) => (
              <button key={x} type="button" className={`admin-lang-tab ${activeLang === x ? 'active' : ''}`} aria-pressed={activeLang === x} onClick={() => setEditLang(x)}>{x.toUpperCase()}</button>
            ))}
          </div>
        )}
        <div className="admin-form" dir={activeLang === 'ar' ? 'rtl' : undefined} lang={activeLang}>
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="mail-subject">{l.subject}</label>
            <input id="mail-subject" className="admin-input" value={v.subject} maxLength={150} onChange={(e) => setField('subject', e.target.value)} />
          </div>
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="mail-body">{l.body}</label>
            <textarea id="mail-body" className="admin-input admin-textarea admin-mail__body" rows={10} value={v.body} maxLength={10000} onChange={(e) => setField('body', e.target.value)} aria-describedby="mail-body-hint" />
            <div className="admin-hint" id="mail-body-hint">{l.bodyHint}</div>
            <div className="admin-hint admin-hint--end" aria-live="polite">{v.body.length}/10000</div>
          </div>
          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="mail-cta-label">{l.ctaLabel}</label>
              <input id="mail-cta-label" className="admin-input" value={v.ctaLabel} maxLength={60} onChange={(e) => setField('ctaLabel', e.target.value)} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="mail-cta-url">{l.ctaUrl}</label>
              <input id="mail-cta-url" className="admin-input" dir="ltr" value={v.ctaUrl} maxLength={500} placeholder="/quran" spellCheck={false} autoCapitalize="none" onChange={(e) => setField('ctaUrl', e.target.value)} aria-describedby="mail-cta-hint" />
              <div className="admin-hint" id="mail-cta-hint">{l.ctaHint}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-section" aria-labelledby="mail-preview">
        <span id="mail-preview"><SectionTitle icon="eye">{l.preview}{langMode === 'perLang' && <> · {fill(l.inVersion, { lang: activeLang.toUpperCase() })}</>}</SectionTitle></span>
        {preview && !invalid ? (
          <>
            <p className="admin-mail__subject" data-testid="mail-preview-subject"><bdi>{preview.subject}</bdi></p>
            {/* sandbox="" — skript, forma, keçid açılışı yoxdur; HTML serverdə escape olunub */}
            <iframe className="admin-mail__frame" title={l.previewFrame} sandbox="" srcDoc={preview.html} data-testid="mail-preview" />
          </>
        ) : invalid ? <AdminEmpty icon="mail">{l.previewEmpty}</AdminEmpty> : <AdminEmpty icon="mail" busy />}
      </section>

      <div className="admin-form-actions admin-mail__actions">
        <button type="button" className="ui-btn ui-btn--secondary" onClick={sendTest} disabled={Boolean(invalid) || Boolean(busy)}>
          <Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {l.test}
        </button>
        <button type="button" className="ui-btn ui-btn--primary" onClick={prepare} disabled={Boolean(invalid) || Boolean(busy) || Boolean(confirm)}>
          <Icon name="mail" className="ui-btn__icon" /> {l.prepare}
        </button>
      </div>
      {invalid && (versions[activeLang].subject || versions[activeLang].body) && <p className="admin-hint">{l[invalid]}</p>}

      {confirm && (
        <section className="ui-card admin-mail__confirm" role="group" aria-labelledby="mail-confirm-title" data-testid="mail-confirm">
          <h2 id="mail-confirm-title" className="admin-mail__confirm-title">{l.confirmTitle}</h2>
          <p className="admin-mail__count"><strong>{fill(l.confirmCount, { n: confirm.count })}</strong></p>
          {langMode === 'perLang' && confirm.byVersion && (
            <p className="admin-hint">{l.confirmLangs}: {Object.entries(confirm.byVersion).map(([k, n]) => `${k.toUpperCase()} ${n}`).join(' · ')}</p>
          )}
          {confirm.excluded && (
            <p className="admin-hint">{fill(l.excluded, { u: confirm.excluded.unverified + (confirm.excluded.missing || 0), d: confirm.excluded.disabled, o: confirm.excluded.optedOut })}</p>
          )}
          <p className="admin-hint">{l.confirmPace}</p>
          <div className="admin-form-actions">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setConfirm(null)} disabled={busy === 'send'}>{l.back}</button>
            <button type="button" className="ui-btn ui-btn--primary" onClick={send} disabled={busy === 'send' || confirm.count < 1} data-testid="mail-confirm-send">
              <Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {fill(l.confirmYes, { n: confirm.count })}
            </button>
          </div>
        </section>
      )}

      <section className="admin-section admin-mail__history" aria-labelledby="mail-history">
        <span id="mail-history"><SectionTitle icon="clock">{l.history}</SectionTitle></span>
        {list && list.queue && <p className="admin-hint">{fill(l.hourLimit, { n: list.queue.sentLastHour, max: list.queue.maxPerHour })}</p>}
        {list === null ? <AdminEmpty busy /> : list.campaigns.length === 0 ? <AdminEmpty icon="mail">{l.historyNone}</AdminEmpty> : (
          <ul className="admin-items" data-testid="mail-campaigns">
            {list.campaigns.map((c) => {
              const done = c.sent + c.failed + c.skipped
              return (
                <li key={c.id} className="admin-item admin-mail__campaign" data-testid="mail-campaign">
                  <div className="admin-item__body">
                    <div className="admin-item__title"><bdi>{c.subject}</bdi></div>
                    <div className="admin-hint">
                      {fmt(c.createdAt)}{c.createdBy && <> · {l.by}: <bdi>{c.createdBy}</bdi></>} · {(c.langs || []).map((x) => x.toUpperCase()).join(', ')}
                    </div>
                    <progress className="admin-mail__progress" max={Math.max(1, c.recipientCount)} value={done} aria-label={fill(l.progress, { sent: c.sent, total: c.recipientCount })} />
                    <div className="admin-mail__stats">
                      <span className={`ui-badge ${c.status === 'sending' ? 'ui-badge--brand' : c.status === 'done' ? 'ui-badge--ok' : 'ui-badge--warn'}`}>{stText[c.status] || c.status}</span>
                      <span className="ui-num">{fill(l.progress, { sent: c.sent, total: c.recipientCount })}</span>
                      {c.failed > 0 && <span className="ui-badge ui-badge--bad">{fill(l.failedN, { n: c.failed })}</span>}
                      {c.skipped > 0 && <span className="ui-badge">{fill(l.skippedN, { n: c.skipped })}</span>}
                    </div>
                  </div>
                  {c.status === 'sending' && (
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => stop(c.id)} disabled={busy === `stop-${c.id}`}>
                      <Icon name="pause" className="ui-btn__icon" /> {l.stop}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <AdminToast message={toast} />
    </div>
  )
}
