// ⚠ SURƏT — əsl mənbə: src/config/brand.js (veb). Orada dəyişəndə bura da köçür.
// Metro bundler layihə kökündən kənara import edə bilmədiyi üçün fayl təkrarlanıb.
// Yeganə fərq: IS_DEV sətri (RN-də import.meta yoxdur, __DEV__ var).

// ═══════════════════════════════════════════════════════
// Muslims.cc — brend və sayt məlumatlarının YEGANƏ mənbəyi
//
// Saytın, SEO-nun, mobil tətbiqin və Instagram avtoposterinin hamısı
// adı, domeni və standart namaz yerini buradan oxuyur. Ad dəyişəndə
// yalnız bu faylı redaktə et.
//
// ⚠ MOBİL: mobile/src/config/brand.js bu faylın surətidir (Metro bundler
//   layihə kökündən kənara import edə bilmir). Burada dəyişiklik edəndə
//   ora da köçür — CI (scripts/check-config-sync.mjs) fərqi tutur.
//
// Tarixçə: 2026-09 — 2026-10 arası sayt "Qaraçuxur Məscidi" adı ilə
// işlədi; sahibin qərarı ilə yenidən Muslims.cc oldu. Məscid versiyası
// "qaracuxur-mescidi" git branch-ında tam saxlanılıb.
//
// ─── DİL QAYDASI ───────────────────────────────────────
// Ziyarətçi hansı dili seçibsə, hər mətn TAMAMİLƏ o dildə olmalıdır.
// Hər çoxdilli sahədə 5 dilin hamısı doldurulmalıdır. tr() əskik dili
// başqa dillə "susqun" əvəz etmir: inkişaf rejimində konsola xəbərdarlıq
// yazır (e2e testləri konsol xəbərdarlığında yıxılır), istehsalda isə
// boş səhifə əvəzinə ingiliscəyə düşür.
// ═══════════════════════════════════════════════════════

export const LANGS = ['az', 'en', 'ru', 'ar', 'tr']

// ── Brend ────────────────────────────────────────────
export const BRAND = {
  // Tam ad — başlıqlarda, footer-də, SEO-da (domen adı — tərcümə olunmur)
  name: {
    az: 'Muslims.cc',
    en: 'Muslims.cc',
    ru: 'Muslims.cc',
    tr: 'Muslims.cc',
    ar: 'Muslims.cc',
  },

  // Qısa ad — dar yerlər üçün (mobil başlıq, PWA ikonu altı)
  short: {
    az: 'Muslims.cc',
    en: 'Muslims.cc',
    ru: 'Muslims.cc',
    tr: 'Muslims.cc',
    ar: 'Muslims.cc',
  },

  // Bir sətirlik təqdimat — hero, meta description əsası
  tagline: {
    az: 'Quran, namaz vaxtları, hədis, dua və zikr — pulsuz və reklamsız İslami platforma',
    en: 'Quran, prayer times, hadith, duas and dhikr — a free, ad-free Islamic platform',
    ru: 'Коран, время намаза, хадисы, дуа и зикр — бесплатная исламская платформа без рекламы',
    tr: 'Kur’an, namaz vakitleri, hadis, dua ve zikir — ücretsiz ve reklamsız İslami platform',
    ar: 'القرآن ومواقيت الصلاة والحديث والأدعية والأذكار — منصة إسلامية مجانية بلا إعلانات',
  },

  // Uzun təsvir — PWA manifest, "Haqqımızda"
  description: {
    az: '5 dildə pulsuz İslami platforma: Quran oxu və dinlə, namaz vaxtları, hədislər, dualar, zikr sayğacı, zəkat kalkulyatoru, qiblə istiqaməti, hifz izləyicisi və İslami bilik.',
    en: 'A free Islamic platform in 5 languages: read and listen to the Quran, prayer times, hadith, duas, a dhikr counter, a zakat calculator, qibla direction, a hifz tracker and Islamic knowledge.',
    ru: 'Бесплатная исламская платформа на 5 языках: чтение и прослушивание Корана, время намаза, хадисы, дуа, счётчик зикра, калькулятор закята, направление киблы, трекер хифза и исламские знания.',
    tr: '5 dilde ücretsiz İslami platform: Kur’an okuma ve dinleme, namaz vakitleri, hadisler, dualar, zikir sayacı, zekât hesaplayıcı, kıble yönü, hıfz takipçisi ve İslami bilgi.',
    ar: 'منصة إسلامية مجانية بخمس لغات: قراءة القرآن والاستماع إليه، ومواقيت الصلاة، والأحاديث، والأدعية، وعدّاد الأذكار، وحاسبة الزكاة، واتجاه القبلة، ومتابعة الحفظ، والمعرفة الإسلامية.',
  },

  domain: 'muslims.cc',
  url: 'https://muslims.cc',

  // Ev ekranı ikonu altındakı ad (PWA short_name) — ~12 simvoldan sonra kəsilir
  iconLabel: 'Muslims.cc',

  // Instagram avtoposter
  hashtag: '#muslimscc',
  instagram: 'muslims_cc',

  // AI köməkçinin görünən adı
  aiName: {
    az: 'AI Köməkçi',
    en: 'AI Assistant',
    ru: 'ИИ-помощник',
    tr: 'Yapay Zekâ Asistanı',
    ar: 'المساعد الذكي',
  },

  // AI cavabları yanında MÜTLƏQ göstərilməli xəbərdarlıq
  aiDisclaimer: {
    az: 'AI cavabları ümumi məlumatdır, fətva deyil. Dini hökmlər üçün etibarlı bir alimə müraciət edin.',
    en: 'AI answers are general information, not a fatwa. For religious rulings, please consult a trusted scholar.',
    ru: 'Ответы ИИ — это общая информация, а не фетва. По религиозным вопросам обращайтесь к надёжному учёному.',
    tr: 'Yapay zekâ cevapları genel bilgidir, fetva değildir. Dinî hükümler için güvenilir bir âlime danışın.',
    ar: 'إجابات المساعد الذكي معلومات عامة وليست فتوى. للأحكام الشرعية يُرجى الرجوع إلى عالم موثوق.',
  },

  // Ərəbcə dekorativ başlıq (hero, şəkillər)
  arabicMotto: 'بِسْمِ اللَّهِ',

  // Hüquqi səhifələr (Məxfilik siyasəti, İstifadə şərtləri) üçün sahib məlumatı.
  // BOŞ sahə səhifədə GÖSTƏRİLMİR (heç vaxt "XXX" və ya uydurma ünvan yox):
  //   operator      — xidməti idarə edən şəxsin/təşkilatın hüquqi adı
  //   email         — məxfilik və hüquqi sorğular üçün e-poçt (boşdursa Instagram göstərilir)
  //   country       — sahibin ölkəsi; ya sətir, ya 5 dilli obyekt { az, en, ru, ar, tr }.
  //                   Boşdursa "Tətbiq olunan qanun" bəndi səhifədə görünmür
  //   effectiveDate — sənədlərin qüvvəyə minmə / son yenilənmə tarixi (YYYY-MM-DD)
  legal: {
    operator: { az: 'Elçin Abdullayev', en: 'Elchin Abdullayev', ru: 'Эльчин Абдуллаев', ar: 'Elchin Abdullayev', tr: 'Elçin Abdullayev' }, // lang-ok: şəxs adı ərəb mətnində latınca qalır (pasportdakı yazılış)
    email: 'abdllyevv@gmail.com',
    country: { az: 'Azərbaycan Respublikası', en: 'the Republic of Azerbaijan', ru: 'Азербайджанская Республика', ar: 'جمهورية أذربيجان', tr: 'Azerbaycan Cumhuriyeti' },
    effectiveDate: '2026-10-30',
  },
}

// ── Namaz vaxtı: standart yer ────────────────────────
// İstifadəçi şəhər seçməyibsə və yeri məlum deyilsə, Bakı mərkəzi götürülür
// (saytın əsas auditoriyası). method: aladhan.com metodu (13 = Diyanet).
export const DEFAULT_PRAYER_LOCATION = {
  lat: 40.4093,
  lng: 49.8671,
  method: 13,
  tz: 'Asia/Baku',
  city: { az: 'Bakı', en: 'Baku', ru: 'Баку', tr: 'Bakü', ar: 'باكو' },
}

// ── Köməkçilər ───────────────────────────────────────

/** Dəyər doldurulubmu? Boş sətir, null, boş massiv və boş dil obyekti "yox" sayılır. */
export function filled(v) {
  if (v == null) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (typeof v === 'number') return Number.isFinite(v)
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'object') return Object.values(v).some(filled)
  return Boolean(v)
}

// Eyni əskik tərcümə üçün konsol bir dəfə xəbərdar edilsin
const warned = new Set()
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__ // RN: import.meta yoxdur

/**
 * Çoxdilli sahədən cari dili seç.
 * Əskik dil BAŞQA DİLLƏ SUSQUN ƏVƏZ OLUNMUR: inkişafda xəbərdarlıq yazılır
 * (testlər tutur); istehsalda boş qalmasın deyə en → az sırası ilə düşür.
 */
export function tr(obj, lang = 'az') {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  if (filled(obj[lang])) return obj[lang]
  if (IS_DEV) {
    const sample = String(obj.az || obj.en || '').slice(0, 40)
    const key = lang + '|' + sample
    if (!warned.has(key)) {
      warned.add(key)
      console.warn(`[i18n] "${lang}" tərcüməsi yoxdur: "${sample}"`)
    }
  }
  return obj.en || obj.az || ''
}

/** Brend adı cari dildə. */
export function brandName(lang = 'az') {
  return tr(BRAND.name, lang)
}

/**
 * schema.org/WebSite + Organization — Google axtarışı üçün.
 * (Qaraçuxur dövründəki schema.org/Mosque əvəzinə: sayt artıq konkret bir
 * məkan deyil, onlayn platformadır.)
 */
export function siteJsonLd(lang = 'az') {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': BRAND.url + '/#website',
        name: brandName(lang),
        url: BRAND.url + '/',
        description: tr(BRAND.tagline, lang),
        inLanguage: lang,
        publisher: { '@id': BRAND.url + '/#org' },
      },
      {
        '@type': 'Organization',
        '@id': BRAND.url + '/#org',
        name: brandName(lang),
        url: BRAND.url + '/',
        logo: BRAND.url + '/android-chrome-512x512.png',
        image: BRAND.url + '/og-image.png',
        sameAs: [`https://instagram.com/${BRAND.instagram}`],
      },
    ],
  }
}
