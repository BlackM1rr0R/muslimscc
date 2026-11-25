// ═══════════════════════════════════════════════════════
// Ana səhifə hero-sunun və namaz kartının mətnləri (5 dil) — Hero A, 2026-11-24
//
// İki yerdə işlənir: pages/HomePage.jsx (LABELS-ə qarışır, pickUi ilə 44 dil) və
// scripts/seo-body.mjs → homeBody (prerender-dəki statik ilk ekran). Statik blok React-in
// ilk görünüşü ilə HƏRFBƏHƏRF eyni olmalıdır — mətn dəyişəndə fərq görünməsin deyə
// hər ikisi buradan oxuyur. Bu faylda import YOXDUR (node prerender-də də yüklənir).
// ═══════════════════════════════════════════════════════
export const HERO_T = {
  az: {
    badge: 'Pulsuz İslami platforma',
    btnTimes: 'Namaz vaxtları', btnQuran: 'Quran oxu',
    pcTitle: 'Namaz vaxtları', calc: 'Hesablanmış', allTimes: 'Bütün vaxtlar →',
    calcNote: (c) => `Azan vaxtları ${c} üçün aladhan.com ilə hesablanıb.`,
    loading: 'Namaz vaxtları yüklənir...',
    adFree: 'Reklamsız', langs: '50 dil', noSignup: 'Qeydiyyatsız', heroTrust: 'Saytın üstünlükləri',
  },
  en: {
    badge: 'A free Islamic platform',
    btnTimes: 'Prayer times', btnQuran: 'Read the Quran',
    pcTitle: 'Prayer times', calc: 'Calculated', allTimes: 'All times →',
    calcNote: (c) => `Adhan times for ${c} are calculated via aladhan.com.`,
    loading: 'Loading prayer times...',
    adFree: 'Ad-free', langs: '50 Languages', noSignup: 'No sign-up', heroTrust: 'Why this site',
  },
  ru: {
    badge: 'Бесплатная исламская платформа',
    btnTimes: 'Время намаза', btnQuran: 'Читать Коран',
    pcTitle: 'Время намаза', calc: 'Расчётное', allTimes: 'Всё расписание →',
    calcNote: (c) => `Время азана для города ${c} рассчитано через aladhan.com.`,
    loading: 'Загрузка времени намаза...',
    adFree: 'Без рекламы', langs: '50 языков', noSignup: 'Без регистрации', heroTrust: 'Преимущества сайта',
  },
  ar: {
    badge: 'منصة إسلامية مجانية',
    btnTimes: 'مواقيت الصلاة', btnQuran: 'اقرأ القرآن',
    pcTitle: 'مواقيت الصلاة', calc: 'محسوبة', allTimes: 'جميع المواقيت ←',
    calcNote: (c) => `أوقات الأذان لمدينة ${c} محسوبة عبر aladhan.com.`,
    loading: 'جارٍ تحميل مواقيت الصلاة...',
    adFree: 'بدون إعلانات', langs: '50 لغة', noSignup: 'بلا تسجيل', heroTrust: 'مزايا الموقع',
  },
  tr: {
    badge: 'Ücretsiz İslami platform',
    btnTimes: 'Namaz vakitleri', btnQuran: "Kur'an oku",
    pcTitle: 'Namaz vakitleri', calc: 'Hesaplanmış', allTimes: 'Tüm vakitler →',
    calcNote: (c) => `${c} ezan vakitleri aladhan.com ile hesaplanmıştır.`,
    loading: 'Namaz vakitleri yükleniyor...',
    adFree: 'Reklamsız', langs: '50 Dil', noSignup: 'Kayıtsız', heroTrust: 'Sitenin avantajları',
  },
}
