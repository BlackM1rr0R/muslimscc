import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { apiFetch } from '../../api/http'
import Icon from '../Icon'
import {
  BentoGrid, ChartCard, KpiCard, RangeTabs, AreaChart, SegmentBreakdown, CompareBars, ActivityFeed,
  MiniTable, InlineBar, TrendCell, Delta, BarChart, makeFormat,
} from '../viz'
import { AdminAlert } from './AdminUi'
import { pickUi } from '../../utils/uiText'
import {
  rangeFor, pct, trafficKpis, withPrev, pageRows, feedbackStats, subscriberStats, notificationStats,
  errorStats, buildFeed, insightParts, utcDay,
} from '../../utils/adminOverview'

// ═══════════════════════════════════════════════════════
// Admin — İdarə paneli (icmal, viz v2 bento — DESIGN.md §5.1)
//   salam + bir cümləlik nəticə → 8 KPI (dəyişmə + mini trend) → trafik qrafiki
//   (7/30/90 gün, ştrixli əvvəlki dövr) → cihazlar → səhifələr cədvəli → canlı
//   fəaliyyət → mənbələr / dillər / brauzerlər → məzmun → sürətli əməliyyatlar.
// Məlumat YALNIZ mövcud admin API-sindən (hesab: utils/adminOverview.js):
//   /api/admin/analytics?compare=1 · /subscribers · /notification-history · /feedback · /errors
// Mənbə əlçatmazdırsa həmin kart "yüklənmədi" yazır — rəqəm uydurulmur.
// Toplanmayan məlumat göstərilmir: ölkə (analitika ölkə saxlamır), AI sual sayı və 👍
// (AIRating 👍-i heç yerə göndərmir) — yalnız 👎 şikayətləri (feedback kind 'ai').
// ═══════════════════════════════════════════════════════

const LABELS = {
  az: {
    notifSum: (d, n) => `Son ${d} gündə ${n} bildiriş göndərilib`,
    salam: 'Əssəlamu aleykum', admin: 'İdarə paneli', sub: 'Saytın bu gününə bir baxış',
    refresh: 'Yenilə', period: 'Dövr', ranges: { 7: '7 gün', 30: '30 gün', 90: '90 gün' },
    vsYday: 'dünənə görə', vsRange: (n) => `əvvəlki ${n} günə görə`, vsWeek: 'əvvəlki 7 günə görə',
    kVisitors: 'Ziyarətçi (bu gün)', kViews: 'Baxış (bu gün)', kWeek: 'Unikal ziyarətçi (7 gün)', kSubs: 'Bildiriş abunəçisi',
    kAi: 'AI cavab şikayəti', kFeedback: 'Açıq səhv bildirişi', kErrors: 'Brauzer xətası', kContent: 'Məzmun',
    subsHint: (n) => `son ${n} gündə +`, aiHint: 'bəyənmə saxlanmır', fbHint: (n) => `cəmi ${n}`,
    errHint: 'server başlayandan bəri', errKinds: (n) => `${n} növ`, contentHint: 'admin əlavə etdiyi',
    trafficT: 'Trafik', trafficS: (n) => `son ${n} gün · ştrixli xətt — əvvəlki ${n} gün`,
    views: 'Baxış', visitors: 'Ziyarətçi', prevPeriod: 'Əvvəlki dövr', current: 'Bu dövr',
    devicesT: 'Cihazlar', devicesS: 'baxışların payı, əvvəlki dövrə görə dəyişmə',
    pagesT: 'Ən çox baxılan səhifələr', pagesS: (n) => `son ${n} gün`, page: 'Səhifə', share: 'Pay', trend: 'Trend', change: 'Dəyişmə',
    feedT: 'Canlı fəaliyyət', feedS: 'bildirişlər, göndərişlər, xətalar, abunəliklər', feedEmpty: 'Hələ heç bir hadisə yoxdur.',
    refT: 'Gəlinən saytlar', refS: 'bu dövr və əvvəlki dövr', noRefs: 'Bu dövrdə xarici saytdan keçid olmayıb.',
    langT: 'Dillər', langS: 'baxışlar sayt dilinə görə', browsersT: 'Brauzerlər', browsersS: 'baxışların payı',
    contentT: 'Məzmun bölgüsü', contentS: 'növlər üzrə say', quickT: 'Sürətli əməliyyatlar', systemT: 'Sistem',
    failed: 'Yüklənmədi', partial: (list) => `Bəzi məlumatlar yüklənmədi: ${list}.`, noTraffic: 'Bu dövr üçün hələ ziyarət məlumatı yoxdur.',
    src: { analytics: 'statistika', subs: 'abunəçilər', history: 'bildiriş tarixçəsi', feedback: 'səhv bildirişləri', errors: 'brauzer xətaları' },
    home: 'Ana səhifə', other: 'Digər', notFound: 'Tapılmayan səhifə (404)',
    dev: { mobile: 'Telefon', tablet: 'Planşet', desktop: 'Kompüter' },
    langNames: ['Azərbaycan dili', 'İngilis dili', 'Rus dili', 'Ərəb dili', 'Türk dili'],
    ins: {
      up: (d) => `Bu gün baxışlar dünənə görə ${d} çoxdur.`, down: (d) => `Bu gün baxışlar dünənə görə ${d} azdır.`,
      same: 'Bu gün trafik dünənki səviyyədədir.', first: (n) => `Bu gün ${n} baxış var.`, none: 'Bu gün hələ ziyarət qeyd olunmayıb.',
      open: (n) => ` ${n} açıq səhv bildirişi baxılmağı gözləyir.`, ai: (n) => ` Onlardan ${n} — AI cavabına şikayət.`, clear: ' Açıq bildiriş yoxdur.',
    },
    ev: {
      ai: 'AI cavabına şikayət', feedback: (k) => `Yeni səhv bildirişi: ${k}`, push: (t) => `Bildiriş göndərildi: «${t}»`,
      pushMeta: (s, f) => `${s} çatdı${f ? `, ${f} alınmadı` : ''}`, error: (m) => `Brauzer xətası: ${m}`, errorMeta: (n) => `${n} dəfə`,
      subs: (n) => `${n} yeni bildiriş abunəsi`,
    },
    chips: { ai: 'AI', feedback: 'Bildiriş', push: 'Göndəriş', error: 'Xəta', sub: 'Abunə', open: 'açıq' },
    kinds: { text: 'mətn', translation: 'tərcümə', source: 'mənbə', hadith: 'hədis', design: 'texniki', other: 'digər', ai: 'AI' },
    videos: 'Video', books: 'Kitab', hadiths: 'Hədis', duas: 'Dua', announcements: 'Elan', quotes: 'Sitat', events: 'Hadisə',
    addVideo: 'Video əlavə et', addBook: 'Kitab əlavə et', addHadith: 'Hədis əlavə et', addDua: 'Dua əlavə et', addAnnouncement: 'Elan əlavə et',
    analytics: 'Sayt statistikası', feedbackTab: 'Səhv bildirişləri', pushTab: 'Anlıq bildiriş göndər', backup: 'Ehtiyat nüsxə', all: 'Hamısı',
  },
  en: {
    notifSum: (d, n) => `${n} notifications sent in the last ${d} days`,
    salam: 'Assalamu alaikum', admin: 'Dashboard', sub: 'A look at the site today',
    refresh: 'Refresh', period: 'Period', ranges: { 7: '7 days', 30: '30 days', 90: '90 days' },
    vsYday: 'vs yesterday', vsRange: (n) => `vs previous ${n} days`, vsWeek: 'vs previous 7 days',
    kVisitors: 'Visitors (today)', kViews: 'Page views (today)', kWeek: 'Unique visitors (7 days)', kSubs: 'Push subscribers',
    kAi: 'AI answer complaints', kFeedback: 'Open error reports', kErrors: 'Browser errors', kContent: 'Content',
    subsHint: (n) => `last ${n} days +`, aiHint: 'likes are not stored', fbHint: (n) => `${n} in total`,
    errHint: 'since the server started', errKinds: (n) => `${n} kinds`, contentHint: 'added by admins',
    trafficT: 'Traffic', trafficS: (n) => `last ${n} days · dashed line — previous ${n} days`,
    views: 'Page views', visitors: 'Visitors', prevPeriod: 'Previous period', current: 'This period',
    devicesT: 'Devices', devicesS: 'share of page views, change vs previous period',
    pagesT: 'Most viewed pages', pagesS: (n) => `last ${n} days`, page: 'Page', share: 'Share', trend: 'Trend', change: 'Change',
    feedT: 'Live activity', feedS: 'reports, notifications sent, errors, subscriptions', feedEmpty: 'No events yet.',
    refT: 'Referring sites', refS: 'this period and the previous one', noRefs: 'No visits from other sites in this period.',
    langT: 'Languages', langS: 'page views by site language', browsersT: 'Browsers', browsersS: 'share of page views',
    contentT: 'Content breakdown', contentS: 'count by type', quickT: 'Quick actions', systemT: 'System',
    failed: 'Could not load', partial: (list) => `Some data could not be loaded: ${list}.`, noTraffic: 'No visit data for this period yet.',
    src: { analytics: 'analytics', subs: 'subscribers', history: 'notification history', feedback: 'error reports', errors: 'browser errors' },
    home: 'Home page', other: 'Other', notFound: 'Not found page (404)',
    dev: { mobile: 'Phone', tablet: 'Tablet', desktop: 'Desktop computer' },
    langNames: ['Azerbaijani', 'English', 'Russian', 'Arabic', 'Turkish'],
    ins: {
      up: (d) => `Page views today are ${d} higher than yesterday.`, down: (d) => `Page views today are ${d} lower than yesterday.`,
      same: 'Traffic today is at yesterday’s level.', first: (n) => `${n} page views so far today.`, none: 'No visits recorded yet today.',
      open: (n) => ` ${n} open error reports are waiting for review.`, ai: (n) => ` ${n} of them are about AI answers.`, clear: ' No open reports.',
    },
    ev: {
      ai: 'Complaint about an AI answer', feedback: (k) => `New error report: ${k}`, push: (t) => `Notification sent: “${t}”`,
      pushMeta: (s, f) => `${s} delivered${f ? `, ${f} failed` : ''}`, error: (m) => `Browser error: ${m}`, errorMeta: (n) => `${n} times`,
      subs: (n) => `${n} new push subscriptions`,
    },
    chips: { ai: 'AI', feedback: 'Report', push: 'Sent', error: 'Error', sub: 'Subscription', open: 'open' },
    kinds: { text: 'text', translation: 'translation', source: 'source', hadith: 'hadith', design: 'technical', other: 'other', ai: 'AI' },
    videos: 'Videos', books: 'Books', hadiths: 'Hadiths', duas: 'Duas', announcements: 'Announcements', quotes: 'Quotes', events: 'Events',
    addVideo: 'Add Video', addBook: 'Add Book', addHadith: 'Add Hadith', addDua: 'Add Dua', addAnnouncement: 'Add Announcement',
    analytics: 'Site analytics', feedbackTab: 'Error reports', pushTab: 'Send a push notification', backup: 'Backup', all: 'View all',
  },
  ru: {
    notifSum: (d, n) => `За ${d} дней отправлено уведомлений: ${n}`,
    salam: 'Ассаляму алейкум', admin: 'Главная', sub: 'Сайт сегодня — коротко',
    refresh: 'Обновить', period: 'Период', ranges: { 7: '7 дней', 30: '30 дней', 90: '90 дней' },
    vsYday: 'ко вчера', vsRange: (n) => `к предыдущим ${n} дням`, vsWeek: 'к предыдущим 7 дням',
    kVisitors: 'Посетители (сегодня)', kViews: 'Просмотры (сегодня)', kWeek: 'Уникальные посетители (7 дней)', kSubs: 'Подписчики уведомлений',
    kAi: 'Жалобы на ответы ИИ', kFeedback: 'Открытые сообщения об ошибках', kErrors: 'Ошибки в браузере', kContent: 'Контент',
    subsHint: (n) => `за ${n} дней +`, aiHint: 'лайки не сохраняются', fbHint: (n) => `всего ${n}`,
    errHint: 'с запуска сервера', errKinds: (n) => `видов: ${n}`, contentHint: 'добавлено админами',
    trafficT: 'Трафик', trafficS: (n) => `последние ${n} дней · пунктир — предыдущие ${n} дней`,
    views: 'Просмотры', visitors: 'Посетители', prevPeriod: 'Предыдущий период', current: 'Этот период',
    devicesT: 'Устройства', devicesS: 'доля просмотров, изменение к предыдущему периоду',
    pagesT: 'Самые просматриваемые страницы', pagesS: (n) => `последние ${n} дней`, page: 'Страница', share: 'Доля', trend: 'Тренд', change: 'Изменение',
    feedT: 'Последние события', feedS: 'сообщения, рассылки, ошибки, подписки', feedEmpty: 'Событий пока нет.',
    refT: 'Сайты-источники', refS: 'этот и предыдущий период', noRefs: 'За этот период переходов с других сайтов не было.',
    langT: 'Языки', langS: 'просмотры по языку сайта', browsersT: 'Браузеры', browsersS: 'доля просмотров',
    contentT: 'Состав контента', contentS: 'число по типам', quickT: 'Быстрые действия', systemT: 'Система',
    failed: 'Не загрузилось', partial: (list) => `Часть данных не загрузилась: ${list}.`, noTraffic: 'За этот период данных о посещениях пока нет.',
    src: { analytics: 'статистика', subs: 'подписчики', history: 'история уведомлений', feedback: 'сообщения об ошибках', errors: 'ошибки браузера' },
    home: 'Главная страница', other: 'Прочее', notFound: 'Страница не найдена (404)',
    dev: { mobile: 'Телефон', tablet: 'Планшет', desktop: 'Компьютер' },
    langNames: ['Азербайджанский', 'Английский', 'Русский', 'Арабский', 'Турецкий'],
    ins: {
      up: (d) => `Сегодня просмотров на ${d} больше, чем вчера.`, down: (d) => `Сегодня просмотров на ${d} меньше, чем вчера.`,
      same: 'Трафик сегодня на вчерашнем уровне.', first: (n) => `Сегодня уже ${n} просмотров.`, none: 'Сегодня посещений пока нет.',
      open: (n) => ` Открытых сообщений об ошибках: ${n}.`, ai: (n) => ` Из них об ответах ИИ: ${n}.`, clear: ' Открытых сообщений нет.',
    },
    ev: {
      ai: 'Жалоба на ответ ИИ', feedback: (k) => `Новое сообщение об ошибке: ${k}`, push: (t) => `Отправлено уведомление: «${t}»`,
      pushMeta: (s, f) => `доставлено ${s}${f ? `, не доставлено ${f}` : ''}`, error: (m) => `Ошибка в браузере: ${m}`, errorMeta: (n) => `раз: ${n}`,
      subs: (n) => `Новых подписок на уведомления: ${n}`,
    },
    chips: { ai: 'ИИ', feedback: 'Сообщение', push: 'Рассылка', error: 'Ошибка', sub: 'Подписка', open: 'открыто' },
    kinds: { text: 'текст', translation: 'перевод', source: 'источник', hadith: 'хадис', design: 'техническое', other: 'другое', ai: 'ИИ' },
    videos: 'Видео', books: 'Книги', hadiths: 'Хадисы', duas: 'Дуа', announcements: 'Объявления', quotes: 'Цитаты', events: 'События',
    addVideo: 'Добавить видео', addBook: 'Добавить книгу', addHadith: 'Добавить хадис', addDua: 'Добавить дуа', addAnnouncement: 'Добавить объявление',
    analytics: 'Статистика сайта', feedbackTab: 'Сообщения об ошибках', pushTab: 'Отправить уведомление', backup: 'Резервная копия', all: 'Все',
  },
  ar: {
    notifSum: (d, n) => `أُرسل ${n} إشعارات في آخر ${d} يومًا`,
    salam: 'السلام عليكم', admin: 'لوحة التحكم', sub: 'نظرة على الموقع اليوم',
    refresh: 'تحديث', period: 'الفترة', ranges: { 7: '7 أيام', 30: '30 يومًا', 90: '90 يومًا' },
    vsYday: 'مقارنة بالأمس', vsRange: (n) => `مقارنة بالأيام الـ${n} السابقة`, vsWeek: 'مقارنة بالأيام السبعة السابقة',
    kVisitors: 'الزوار (اليوم)', kViews: 'المشاهدات (اليوم)', kWeek: 'الزوار الفريدون (7 أيام)', kSubs: 'مشتركو الإشعارات',
    kAi: 'شكاوى إجابات الذكاء الاصطناعي', kFeedback: 'بلاغات أخطاء مفتوحة', kErrors: 'أخطاء المتصفح', kContent: 'المحتوى',
    subsHint: (n) => `آخر ${n} يومًا +`, aiHint: 'الإعجاب لا يُحفَظ', fbHint: (n) => `الإجمالي ${n}`,
    errHint: 'منذ تشغيل الخادم', errKinds: (n) => `${n} أنواع`, contentHint: 'أضافه المشرفون',
    trafficT: 'الزيارات', trafficS: (n) => `آخر ${n} يومًا · الخط المتقطع — ${n} يومًا السابقة`,
    views: 'المشاهدات', visitors: 'الزوار', prevPeriod: 'الفترة السابقة', current: 'هذه الفترة',
    devicesT: 'الأجهزة', devicesS: 'نسبة المشاهدات والتغير عن الفترة السابقة',
    pagesT: 'الصفحات الأكثر مشاهدة', pagesS: (n) => `آخر ${n} يومًا`, page: 'الصفحة', share: 'النسبة', trend: 'الاتجاه', change: 'التغير',
    feedT: 'النشاط المباشر', feedS: 'البلاغات والإشعارات المرسلة والأخطاء والاشتراكات', feedEmpty: 'لا توجد أحداث بعد.',
    refT: 'المواقع المُحيلة', refS: 'هذه الفترة والفترة السابقة', noRefs: 'لا زيارات من مواقع أخرى في هذه الفترة.',
    langT: 'اللغات', langS: 'المشاهدات حسب لغة الموقع', browsersT: 'المتصفحات', browsersS: 'نسبة المشاهدات',
    contentT: 'توزيع المحتوى', contentS: 'العدد حسب النوع', quickT: 'إجراءات سريعة', systemT: 'النظام',
    failed: 'تعذّر التحميل', partial: (list) => `تعذّر تحميل بعض البيانات: ${list}.`, noTraffic: 'لا توجد بيانات زيارات لهذه الفترة بعد.',
    src: { analytics: 'الإحصائيات', subs: 'المشتركون', history: 'سجل الإشعارات', feedback: 'بلاغات الأخطاء', errors: 'أخطاء المتصفح' },
    home: 'الصفحة الرئيسية', other: 'أخرى', notFound: 'صفحة غير موجودة (404)',
    dev: { mobile: 'هاتف', tablet: 'جهاز لوحي', desktop: 'حاسوب مكتبي' },
    langNames: ['الأذربيجانية', 'الإنجليزية', 'الروسية', 'العربية', 'التركية'],
    ins: {
      up: (d) => `مشاهدات اليوم أكثر من الأمس بنسبة ${d}.`, down: (d) => `مشاهدات اليوم أقل من الأمس بنسبة ${d}.`,
      same: 'الزيارات اليوم في مستوى الأمس.', first: (n) => `${n} مشاهدة حتى الآن اليوم.`, none: 'لم تُسجَّل زيارات اليوم بعد.',
      open: (n) => ` ${n} بلاغات مفتوحة بانتظار المراجعة.`, ai: (n) => ` منها ${n} عن إجابات الذكاء الاصطناعي.`, clear: ' لا بلاغات مفتوحة.',
    },
    ev: {
      ai: 'شكوى من إجابة الذكاء الاصطناعي', feedback: (k) => `بلاغ خطأ جديد: ${k}`, push: (t) => `أُرسل إشعار: «${t}»`,
      pushMeta: (s, f) => `وصل إلى ${s}${f ? `، وفشل ${f}` : ''}`, error: (m) => `خطأ في المتصفح: ${m}`, errorMeta: (n) => `${n} مرات`,
      subs: (n) => `${n} اشتراكات جديدة في الإشعارات`,
    },
    chips: { ai: 'ذكاء', feedback: 'بلاغ', push: 'إرسال', error: 'خطأ', sub: 'اشتراك', open: 'مفتوح' },
    kinds: { text: 'النص', translation: 'الترجمة', source: 'المصدر', hadith: 'الحديث', design: 'تقني', other: 'أخرى', ai: 'الذكاء الاصطناعي' },
    videos: 'فيديوهات', books: 'كتب', hadiths: 'أحاديث', duas: 'أدعية', announcements: 'إعلانات', quotes: 'اقتباسات', events: 'أحداث',
    addVideo: 'إضافة فيديو', addBook: 'إضافة كتاب', addHadith: 'إضافة حديث', addDua: 'إضافة دعاء', addAnnouncement: 'إضافة إعلان',
    analytics: 'إحصائيات الموقع', feedbackTab: 'بلاغات الأخطاء', pushTab: 'إرسال إشعار فوري', backup: 'النسخ الاحتياطي', all: 'عرض الكل',
  },
  tr: {
    notifSum: (d, n) => `Son ${d} günde ${n} bildirim gönderildi`,
    salam: 'Esselamu aleyküm', admin: 'Yönetim Paneli', sub: 'Sitenin bugününe bir bakış',
    refresh: 'Yenile', period: 'Dönem', ranges: { 7: '7 gün', 30: '30 gün', 90: '90 gün' },
    vsYday: 'düne göre', vsRange: (n) => `önceki ${n} güne göre`, vsWeek: 'önceki 7 güne göre',
    kVisitors: 'Ziyaretçi (bugün)', kViews: 'Görüntüleme (bugün)', kWeek: 'Tekil ziyaretçi (7 gün)', kSubs: 'Bildirim abonesi',
    kAi: 'Yapay zekâ cevap şikâyeti', kFeedback: 'Açık hata bildirimi', kErrors: 'Tarayıcı hatası', kContent: 'İçerik',
    subsHint: (n) => `son ${n} günde +`, aiHint: 'beğeniler saklanmaz', fbHint: (n) => `toplam ${n}`,
    errHint: 'sunucu başladığından beri', errKinds: (n) => `${n} tür`, contentHint: 'yöneticilerin eklediği',
    trafficT: 'Trafik', trafficS: (n) => `son ${n} gün · kesikli çizgi — önceki ${n} gün`,
    views: 'Görüntüleme', visitors: 'Ziyaretçi', prevPeriod: 'Önceki dönem', current: 'Bu dönem',
    devicesT: 'Cihazlar', devicesS: 'görüntüleme payı, önceki döneme göre değişim',
    pagesT: 'En çok görüntülenen sayfalar', pagesS: (n) => `son ${n} gün`, page: 'Sayfa', share: 'Pay', trend: 'Eğilim', change: 'Değişim',
    feedT: 'Canlı etkinlik', feedS: 'bildirimler, gönderimler, hatalar, abonelikler', feedEmpty: 'Henüz bir olay yok.',
    refT: 'Yönlendiren siteler', refS: 'bu dönem ve önceki dönem', noRefs: 'Bu dönemde başka sitelerden gelen ziyaret olmadı.',
    langT: 'Diller', langS: 'site diline göre görüntülemeler', browsersT: 'Tarayıcılar', browsersS: 'görüntüleme payı',
    contentT: 'İçerik dağılımı', contentS: 'türe göre sayı', quickT: 'Hızlı işlemler', systemT: 'Sistem',
    failed: 'Yüklenemedi', partial: (list) => `Bazı veriler yüklenemedi: ${list}.`, noTraffic: 'Bu dönem için henüz ziyaret verisi yok.',
    src: { analytics: 'istatistikler', subs: 'aboneler', history: 'bildirim geçmişi', feedback: 'hata bildirimleri', errors: 'tarayıcı hataları' },
    home: 'Ana sayfa', other: 'Diğer', notFound: 'Bulunamayan sayfa (404)',
    dev: { mobile: 'Cep telefonu', tablet: 'Tablet bilgisayar', desktop: 'Masaüstü bilgisayar' },
    langNames: ['Azerbaycanca', 'İngilizce', 'Rusça', 'Arapça', 'Türkçe'],
    ins: {
      up: (d) => `Bugün görüntülemeler düne göre ${d} fazla.`, down: (d) => `Bugün görüntülemeler düne göre ${d} az.`,
      same: 'Bugünkü trafik dünkü seviyede.', first: (n) => `Bugün şimdiye kadar ${n} görüntüleme var.`, none: 'Bugün henüz ziyaret kaydedilmedi.',
      open: (n) => ` ${n} açık hata bildirimi incelenmeyi bekliyor.`, ai: (n) => ` Bunların ${n} tanesi yapay zekâ cevabıyla ilgili.`, clear: ' Açık bildirim yok.',
    },
    ev: {
      ai: 'Yapay zekâ cevabına şikâyet', feedback: (k) => `Yeni hata bildirimi: ${k}`, push: (t) => `Bildirim gönderildi: “${t}”`,
      pushMeta: (s, f) => `${s} ulaştı${f ? `, ${f} ulaşmadı` : ''}`, error: (m) => `Tarayıcı hatası: ${m}`, errorMeta: (n) => `${n} kez`,
      subs: (n) => `${n} yeni bildirim aboneliği`,
    },
    chips: { ai: 'YZ', feedback: 'Bildirim', push: 'Gönderim', error: 'Hata', sub: 'Abonelik', open: 'açık' },
    kinds: { text: 'metin', translation: 'çeviri', source: 'kaynak', hadith: 'hadis', design: 'teknik', other: 'diğer', ai: 'yapay zekâ' },
    videos: 'Video', books: 'Kitap', hadiths: 'Hadis', duas: 'Dua', announcements: 'Duyuru', quotes: 'Alıntı', events: 'Olay',
    addVideo: 'Video Ekle', addBook: 'Kitap Ekle', addHadith: 'Hadis Ekle', addDua: 'Dua Ekle', addAnnouncement: 'Duyuru Ekle',
    analytics: 'Site istatistikleri', feedbackTab: 'Hata bildirimleri', pushTab: 'Anlık bildirim gönder', backup: 'Yedekleme', all: 'Tümü',
  },
}

const LANG_CODES = ['az', 'en', 'ru', 'ar', 'tr']
const RANGES = [7, 30, 90]
const SOURCES = ['analytics', 'subs', 'history', 'feedback', 'errors']
const noon = (k) => new Date(`${k}T12:00:00Z`)

/** Dil kodu → ad: 5 əsas dil lüğətdən, qalanları Intl.DisplayNames ilə (yoxdursa kod) */
function langNamer(l, lang) {
  let dn = null
  try { dn = new Intl.DisplayNames([lang === 'az' ? 'az-Latn' : lang], { type: 'language' }) } catch { dn = null }
  return (code) => {
    const i = LANG_CODES.indexOf(code)
    if (i >= 0) return l.langNames[i]
    try { return (dn && dn.of(code)) || code } catch { return code }
  }
}

export default function DashboardOverview({ counts, setActiveTab }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang)
  const f = useMemo(() => makeFormat(lang), [lang])
  const [range, setRange] = useState(30)
  const [data, setData] = useState({})        // { analytics, subs, history, feedback, errors }
  const [failed, setFailed] = useState([])
  const [busy, setBusy] = useState(true)
  const [now, setNow] = useState(() => Date.now())
  const req = useRef({})        // mənbə → son sorğunun nömrəsi (köhnə cavab yenisini əzməsin)
  const pending = useRef(0)

  // Bir mənbə — bir sorğu; biri alınmasa digərləri göstərilir
  const fetchAll = useCallback(async (days, which = SOURCES) => {
    const { from, to } = rangeFor(days)
    const urls = {
      analytics: `/api/admin/analytics?from=${from}&to=${to}&compare=1`,
      subs: '/api/admin/subscribers',
      history: '/api/admin/notification-history',
      feedback: '/api/admin/feedback',
      errors: '/api/admin/errors',
    }
    pending.current++
    setBusy(true)
    await Promise.all(which.map(async (k) => {
      const id = (req.current[k] || 0) + 1
      req.current[k] = id
      let value = null, ok = true
      try { value = await apiFetch(urls[k], { admin: true }) } catch { ok = false }
      if (req.current[k] !== id) return
      setData(d => ({ ...d, [k]: ok ? value : null }))
      setFailed(prev => (ok ? prev.filter(x => x !== k) : prev.includes(k) ? prev : [...prev, k]))
    }))
    setNow(Date.now())
    if (--pending.current === 0) setBusy(false)
  }, [])

  const first = useRef(true)
  useEffect(() => {
    // İlk açılışda hamısı; dövr dəyişəndə yalnız statistika
    fetchAll(range, first.current ? SOURCES : ['analytics'])
    first.current = false
  }, [range, fetchAll])

  const go = (tab) => (e) => { if (e) e.preventDefault(); setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ── Hesab ──
  const a = data.analytics
  const k = useMemo(() => (a ? trafficKpis(a) : null), [a])
  const fb = useMemo(() => (Array.isArray(data.feedback) ? feedbackStats(data.feedback, range, now) : null), [data.feedback, range, now])
  const subs = useMemo(() => (data.subs ? subscriberStats(data.subs, range, now) : null), [data.subs, range, now])
  const notif = useMemo(() => (Array.isArray(data.history) ? notificationStats(data.history, range, now) : null), [data.history, range, now])
  const errs = useMemo(() => (data.errors ? errorStats(data.errors) : null), [data.errors])
  const langName = useMemo(() => langNamer(l, lang), [l, lang])

  const pageLabel = (key) => (key === '/' ? l.home : key === '(other)' ? l.other : key === '/404' ? l.notFound : key)
  const dimLabel = (key, map) => (key === '(other)' ? l.other : map ? map(key) : key)

  const cards = [
    { key: 'videos', icon: 'videos', add: l.addVideo }, { key: 'books', icon: 'books', add: l.addBook },
    { key: 'hadiths', icon: 'hadith', add: l.addHadith }, { key: 'duas', icon: 'duas', add: l.addDua },
    { key: 'quotes', icon: 'quotes' }, { key: 'announcements', icon: 'announcements', add: l.addAnnouncement },
    { key: 'events', icon: 'calendar' },
  ].map(c => ({ ...c, label: l[c.key], count: counts[c.key] || 0 }))
  const contentTotal = cards.reduce((s, c) => s + c.count, 0)

  const dash = '—'
  const isFailed = (src) => failed.includes(src)
  const val = (src, v) => (data[src] == null ? (isFailed(src) ? dash : '…') : v)

  const kpis = [
    {
      key: 'visitors', icon: 'user', label: l.kVisitors, value: val('analytics', k && f.num(k.todayVisitors)),
      delta: k && k.ydayVisitors != null ? { value: pct(k.todayVisitors, k.ydayVisitors), vs: l.vsYday } : null,
      spark: k?.sparkVisitors, tab: 'analytics', tone: 1,
    },
    {
      key: 'views', icon: 'eye', label: l.kViews, value: val('analytics', k && f.num(k.todayViews)),
      delta: k && k.ydayViews != null ? { value: pct(k.todayViews, k.ydayViews), vs: l.vsYday } : null,
      spark: k?.sparkViews, tab: 'analytics', tone: 1,
    },
    {
      key: 'week', icon: 'analytics', label: l.kWeek, value: val('analytics', k && f.num(k.visitors7)),
      delta: k && k.visitors7Prev != null ? { value: pct(k.visitors7, k.visitors7Prev), vs: l.vsWeek } : null,
      spark: k?.spark7, tab: 'analytics', tone: 3,
    },
    {
      key: 'subs', icon: 'bell', label: l.kSubs, value: val('subs', subs && f.num(subs.count)),
      delta: subs?.hasDaily && subs.addedPrev > 0 ? { value: pct(subs.added, subs.addedPrev), vs: l.vsRange(range) } : null,
      hint: subs?.hasDaily ? `${l.subsHint(range)}${f.num(subs.added)}` : null,
      spark: subs?.hasDaily ? subs.daily : null, tab: 'pushNotif', tone: 2,
    },
    {
      key: 'ai', icon: 'sparkle', label: l.kAi, value: val('feedback', fb && f.num(fb.ai)),
      delta: fb && fb.aiPrev > 0 ? { value: pct(fb.ai, fb.aiPrev), positiveIsGood: false, vs: l.vsRange(range) } : null,
      hint: l.aiHint, spark: fb?.aiDaily, tab: 'feedback', tone: 4,
    },
    {
      key: 'feedback', icon: 'alert', label: l.kFeedback, value: val('feedback', fb && f.num(fb.open)),
      delta: fb && fb.reportsPrev > 0 ? { value: pct(fb.reports, fb.reportsPrev), positiveIsGood: false, vs: l.vsRange(range) } : null,
      hint: fb ? l.fbHint(f.num(fb.total)) : null, spark: fb?.reportsDaily, tab: 'feedback', tone: 2,
    },
    {
      key: 'errors', icon: 'bolt', label: l.kErrors, value: val('errors', errs && f.num(errs.total)),
      hint: errs ? `${l.errKinds(f.num(errs.kinds))} · ${l.errHint}` : null, tone: 4,
    },
    {
      key: 'content', icon: 'list', label: l.kContent, value: f.num(contentTotal), hint: l.contentHint, tab: 'videos', tone: 1,
    },
  ]

  // ── Bir cümləlik nəticə ──
  const insight = (() => {
    if (!k && !fb) return l.sub
    const p = insightParts(k, fb)
    let s = ''
    if (k) {
      s = p.traffic === 'up' ? l.ins.up(f.pct(p.delta, 0)) : p.traffic === 'down' ? l.ins.down(f.pct(-p.delta, 0))
        : p.traffic === 'same' ? l.ins.same : p.traffic === 'first' ? l.ins.first(f.num(k.todayViews)) : l.ins.none
    }
    if (fb) s += p.open > 0 ? l.ins.open(f.num(p.open)) + (p.aiOpen > 0 ? l.ins.ai(f.num(p.aiOpen)) : '') : l.ins.clear
    return s.trim()
  })()

  // ── Trafik qrafiki ──
  const series = Array.isArray(a?.series) ? a.series : []
  const prevSeries = Array.isArray(a?.prev?.series) ? a.prev.series : null
  const labels = series.map(r => r.day)
  const trafficEmpty = a && !(a.totals?.views > 0)
  const xFormat = (key) => (key ? f.date(noon(key), { day: 'numeric', month: 'short' }) : '')
  const tipTitle = (key) => (key ? f.date(noon(key), { weekday: 'short', day: 'numeric', month: 'long' }) : '')

  // ── Ölçülər ──
  const devices = a ? withPrev(a.devices, a.prev?.devices, { limit: 4 }).map((r, i) => ({ ...r, label: dimLabel(r.key, (x) => l.dev[x] || x), tone: i + 1 })) : []
  const browsers = a ? withPrev(a.browsers, a.prev?.browsers, { limit: 4 }).map((r, i) => ({ ...r, label: dimLabel(r.key, (x) => (x === 'Other' ? l.other : x)), tone: i + 1 })) : []
  const langs = a ? withPrev(a.languages, a.prev?.languages, { limit: 6 }).map(r => ({ ...r, label: dimLabel(r.key, langName) })) : []
  const refs = a ? withPrev(a.referrers, a.prev?.referrers, { limit: 6 }).map(r => ({ ...r, label: dimLabel(r.key) })) : []
  const pages = a ? pageRows(a, 8) : []
  const maxShare = Math.max(0.0001, ...pages.map(p => p.share))

  // ── Lent ──
  const feed = useMemo(() => {
    const names = { ...l.ev, feedback: (kind) => l.ev.feedback(l.kinds[kind] || kind) }
    return buildFeed({ feedback: data.feedback, history: data.history, errors: data.errors, subs: data.subs }, names, { max: 8 })
      .map(e => ({
        key: e.key, icon: e.icon, title: e.title, meta: e.meta, time: e.day || e.t,
        chip: e.open ? { label: `${l.chips[e.kind]} · ${l.chips.open}`, tone: 'accent' } : { label: l.chips[e.kind], tone: e.kind === 'error' ? undefined : 'muted' },
        ...(e.tab ? { href: `#${e.tab}`, onClick: go(e.tab) } : {}),
      }))
  // go — sabit davranış (setActiveTab)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.feedback, data.history, data.errors, data.subs, l])

  const failedNote = failed.length ? l.partial(failed.map(s => l.src[s]).join(', ')) : ''
  const cardFailed = (src) => (isFailed(src) ? <p className="vz-empty">{l.failed}</p> : null)
  const rangeOpts = RANGES.map(n => ({ value: n, label: l.ranges[n] }))
  const today = utcDay(now)

  const system = [
    { tab: 'pushNotif', icon: 'bell', label: l.pushTab }, { tab: 'analytics', icon: 'analytics', label: l.analytics },
    { tab: 'feedback', icon: 'alert', label: l.feedbackTab }, { tab: 'backup', icon: 'download', label: l.backup },
  ]

  return (
    <div className={`admin-dash ado${busy ? ' is-busy' : ''}`} aria-busy={busy || undefined}>
      <header className="ado-hero" data-reveal="fade">
        <div className="ado-hero__text">
          <p className="ado-hero__date">
            <span>{l.salam}</span><span aria-hidden="true"> · </span>
            <time dateTime={today}>{f.date(noon(today), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time>
          </p>
          <h1 className="ado-hero__title">{l.admin}</h1>
          <p className="ado-hero__insight" data-testid="ado-insight" aria-live="polite">{insight}</p>
        </div>
        <div className="ado-hero__tools">
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => fetchAll(range)} disabled={busy}>
            <Icon name="refresh" className={`ui-btn__icon${busy ? ' ui-spin' : ''}`} /> {l.refresh}
          </button>
        </div>
      </header>

      {failedNote && <AdminAlert tone="warn">{failedNote}</AdminAlert>}

      <BentoGrid className="ado-bento">
        {kpis.map(c => (
          <KpiCard key={c.key} span={3} icon={c.icon} label={c.label} value={c.value} tone={c.tone} lang={lang}
            delta={c.delta && c.delta.value != null ? c.delta : null} hint={c.hint}
            spark={Array.isArray(c.spark) && c.spark.some(v => v > 0) ? c.spark : null} sparkLabel={`${c.label}: trend`}
            {...(c.tab ? { href: `#${c.tab}`, onClick: go(c.tab) } : {})} />
        ))}

        <ChartCard span={8} id="ado-traffic" headingLevel="h2" icon="analytics" title={l.trafficT} sub={l.trafficS(range)}
          actions={<RangeTabs label={l.period} value={range} onChange={setRange} options={rangeOpts} />}
          footer={{ label: l.analytics, href: '#analytics', onClick: go('analytics') }}>
          {cardFailed('analytics') || (trafficEmpty ? <p className="vz-empty">{l.noTraffic}</p> : (
            <AreaChart key={`t-${range}`} mode="overlay" height={280} integer lang={lang} label={l.trafficT}
              labels={labels} xFormat={xFormat} tooltipTitle={tipTitle} legendValue="total" compareLabel={l.prevPeriod}
              series={[
                { key: 'views', label: l.views, tone: 1, values: series.map(r => r.views), ...(prevSeries ? { compare: prevSeries.map(r => r.views) } : {}) },
                { key: 'visitors', label: l.visitors, tone: 3, values: series.map(r => r.visitors) },
              ]}
              emptyText={l.noTraffic} />
          ))}
        </ChartCard>

        <ChartCard span={4} id="ado-devices" headingLevel="h2" icon="phone" title={l.devicesT} sub={l.devicesS}>
          {cardFailed('analytics') || (devices.length ? <SegmentBreakdown items={devices} label={l.devicesT} lang={lang} /> : <p className="vz-empty">{l.noTraffic}</p>)}
        </ChartCard>

        <ChartCard span={7} id="ado-pages" headingLevel="h2" icon="list" title={l.pagesT} sub={l.pagesS(range)} flush>
          {cardFailed('analytics') || (pages.length ? (
            <MiniTable caption={l.pagesT} rows={pages} columns={[
              { key: 'page', label: l.page, render: (r) => <bdi className="ado-path" dir="ltr">{pageLabel(r.key)}</bdi> },
              { key: 'views', label: l.views, align: 'end', render: (r) => <span className="ui-num">{f.num(r.views)}</span> },
              { key: 'share', label: l.share, hideSm: true, render: (r) => (
                <InlineBar value={r.share} max={maxShare} label={`${pageLabel(r.key)}: ${f.pct(r.share * 100, 0)}`} lang={lang}
                  format={(v) => f.pct(v * 100, 0)} />
              ) },
              { key: 'trend', label: l.trend, hideSm: true, render: (r) => <TrendCell values={r.trend} label={`${pageLabel(r.key)}: ${l.trend}`} /> },
              { key: 'delta', label: l.change, align: 'end', render: (r) => (r.prev != null && r.prev > 0
                ? <Delta value={pct(r.views, r.prev)} vs={false} lang={lang} /> : <span className="ado-muted">{dash}</span>) },
            ]} />
          ) : <p className="vz-empty ado-pad">{l.noTraffic}</p>)}
        </ChartCard>

        <ChartCard span={5} id="ado-feed" headingLevel="h2" icon="bolt" title={l.feedT} sub={l.feedS}
          footer={{ label: l.feedbackTab, href: '#feedback', onClick: go('feedback') }}>
          <ActivityFeed items={feed} now={now} lang={lang} label={l.feedT} empty={<p className="vz-empty">{l.feedEmpty}</p>} />
          {notif && notif.count > 0 && (
            <p className="ado-note"><Icon name="bell" size={14} /> {l.notifSum(range, f.num(notif.count))} · {l.ev.pushMeta(f.num(notif.sent), notif.failed ? f.num(notif.failed) : 0)}{notif.rate != null ? ` (${f.pct(notif.rate, 0)})` : ''}</p>
          )}
        </ChartCard>

        <ChartCard span={4} id="ado-refs" headingLevel="h2" icon="link" title={l.refT} sub={l.refS}>
          {cardFailed('analytics') || (refs.length
            ? <CompareBars items={refs} label={l.refT} currentLabel={l.current} prevLabel={l.prevPeriod} lang={lang} />
            : <p className="vz-empty">{l.noRefs}</p>)}
        </ChartCard>

        <ChartCard span={4} id="ado-langs" headingLevel="h2" icon="globe" title={l.langT} sub={l.langS}>
          {cardFailed('analytics') || (langs.length
            ? <CompareBars items={langs} label={l.langT} currentLabel={l.current} prevLabel={l.prevPeriod} tone={3} lang={lang} />
            : <p className="vz-empty">{l.noTraffic}</p>)}
        </ChartCard>

        <ChartCard span={4} id="ado-browsers" headingLevel="h2" icon="compass" title={l.browsersT} sub={l.browsersS}>
          {cardFailed('analytics') || (browsers.length ? <SegmentBreakdown items={browsers} label={l.browsersT} lang={lang} /> : <p className="vz-empty">{l.noTraffic}</p>)}
        </ChartCard>

        <ChartCard span={6} id="ado-content" headingLevel="h2" icon="books" title={l.contentT} sub={l.contentS}>
          <BarChart data={cards.map(c => ({ key: c.key, label: c.label, value: c.count }))} label={l.contentT} labelWidth="34%" />
        </ChartCard>

        <ChartCard span={6} id="ado-quick" headingLevel="h2" icon="plus" title={l.quickT}>
          <ul className="admin-quick ado-quick">
            {cards.filter(c => c.add).map(c => (
              <li key={c.key}>
                <button type="button" className="admin-quick-btn" onClick={go(c.key)}>
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="plus" size={16} /></span>
                  <span>{c.add}</span>
                </button>
              </li>
            ))}
            {system.map(s => (
              <li key={s.tab}>
                <button type="button" className="admin-quick-btn" onClick={go(s.tab)}>
                  <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral" aria-hidden="true"><Icon name={s.icon} size={16} /></span>
                  <span>{s.label}</span>
                  <Icon name="chevron" size={16} className="admin-quick-chev ui-flip-rtl" />
                </button>
              </li>
            ))}
          </ul>
        </ChartCard>
      </BentoGrid>
    </div>
  )
}
