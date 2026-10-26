// ═══════════════════════════════════════════════════════
// Qaraçuxur Məscidi — brend və məscid məlumatlarının YEGANƏ mənbəyi
//
// Saytın, SEO-nun, mobil tətbiqin və Instagram avtoposterinin hamısı
// adı, domeni və məscid məlumatlarını buradan oxuyur. Ad dəyişəndə və ya
// məlumat yenilənəndə yalnız bu faylı redaktə et.
//
// ⚠ MOBİL: mobile/src/config/mosque.js bu faylın surətidir (Metro bundler
//   layihə kökündən kənara import edə bilmir). Burada dəyişiklik edəndə
//   ora da köçür.
//
// ─── MƏLUMAT QAYDASI ───────────────────────────────────
// Bu REAL bir məsciddir. Aşağıdakı MOSQUE sahələri qəsdən BOŞ qoyulub —
// ünvan, telefon, imam, camaat vaxtları, tarix uydurulmamalıdır.
//
// Boş sahə saytda GÖSTƏRİLMİR (bax: filled()). Yəni:
//   • telefon boşdursa, "Zəng et" düyməsi çıxmır
//   • camaat vaxtı boşdursa, yalnız hesablanmış azan vaxtı göstərilir
//   • ianə rekvizitləri boşdursa, ianə bölməsi "tezliklə" deyir
// Ziyarətçi heç vaxt "XXX", "TODO" və ya uydurma rəqəm görmür.
//
// Doldurulmamış sahələrin siyahısı: missingMosqueFields()
// ═══════════════════════════════════════════════════════

export const LANGS = ['az', 'en', 'ru', 'ar', 'tr']

// ── Brend ────────────────────────────────────────────
export const BRAND = {
  // Tam ad — başlıqlarda, footer-də, SEO-da
  name: {
    az: 'Qaraçuxur Məscidi',
    en: 'Garachukhur Mosque',
    ru: 'Мечеть Карачухур',
    tr: 'Karaçuhur Camii',
    ar: 'مسجد قاراچوخور',
  },

  // Qısa ad — dar yerlər üçün (mobil başlıq, PWA ikonu altı)
  short: {
    az: 'Qaraçuxur Məscidi',
    en: 'Garachukhur Mosque',
    ru: 'Мечеть Карачухур',
    tr: 'Karaçuhur Camii',
    ar: 'مسجد قاراچوخور',
  },

  // Bir sətirlik təqdimat — hero, meta description əsası
  tagline: {
    az: 'Namaz vaxtları, camaat namazı, elanlar və İslami bilik — bir yerdə',
    en: 'Prayer times, congregational prayers, announcements and Islamic knowledge in one place',
    ru: 'Время намаза, коллективные молитвы, объявления и исламские знания в одном месте',
    tr: 'Namaz vakitleri, cemaat namazları, duyurular ve İslami bilgi bir arada',
    ar: 'مواقيت الصلاة وصلاة الجماعة والإعلانات والمعرفة الإسلامية في مكان واحد',
  },

  // Domen dəyişmir — SEO və Search Console muslims.cc üzərində qurulub
  domain: 'muslims.cc',
  url: 'https://muslims.cc',

  // Ev ekranı ikonu altındakı ad (PWA short_name, mobil tətbiq) —
  // telefonlar ~12 simvoldan sonra kəsir
  iconLabel: 'Qaraçuxur',

  // Instagram avtoposter hashtag-i
  hashtag: '#qaracuxurmescidi',

  // AI köməkçinin görünən adı (əvvəl "MuslimAI")
  aiName: {
    az: 'AI Köməkçi',
    en: 'AI Assistant',
    ru: 'ИИ-помощник',
    tr: 'Yapay Zekâ Asistanı',
    ar: 'المساعد الذكي',
  },

  // AI cavabları yanında MÜTLƏQ göstərilməli xəbərdarlıq: real bir məscidin
  // adı altında verilən cavab asanlıqla məscidin rəsmi fətvası sanıla bilər.
  aiDisclaimer: {
    az: 'AI cavabları məscidin rəsmi mövqeyi və ya fətva deyil. Dini hökmlər üçün məscidin imamına müraciət edin.',
    en: 'AI answers are not the mosque’s official position or a fatwa. For religious rulings, please consult the mosque’s imam.',
    ru: 'Ответы ИИ не являются официальной позицией мечети или фетвой. По религиозным вопросам обращайтесь к имаму мечети.',
    tr: 'Yapay zekâ cevapları caminin resmî görüşü veya fetva değildir. Dinî hükümler için caminin imamına danışın.',
    ar: 'إجابات المساعد الذكي ليست الموقف الرسمي للمسجد ولا فتوى. للأحكام الشرعية يُرجى الرجوع إلى إمام المسجد.',
  },

  // Ərəbcə dekorativ başlıq (hero, şəkillər)
  arabicMotto: 'بيوت الله',
}

// ── Məscid məlumatları — REAL MƏLUMATLA DOLDURULMALIDIR ──
export const MOSQUE = {
  // Ünvan — tam küçə ünvanı
  // Mənbə: məscid sahibinin verdiyi məlumat (2026-09-20)
  address: {
    az: 'Bakı şəhəri, Suraxanı rayonu, Qaraçuxur qəsəbəsi, Ə.Mehbalıyev küçəsi 58/1',
    en: 'A. Mehbaliyev str. 58/1, Garachukhur settlement, Surakhani district, Baku',
    ru: 'г. Баку, Сураханский район, посёлок Карачухур, ул. А. Мехбалыева, 58/1',
    tr: 'Bakü, Suraxanı ilçesi, Karaçuhur kasabası, Ə. Mehbalıyev sokak 58/1',
    ar: 'باكو، منطقة سوراخاني، قصبة قاراچوخور، شارع أ. محبالييف 58/1',
  },

  // Yalnız küçə/bina — schema.org "streetAddress" üçün (yuxarıdakı tam ünvanda
  // şəhər və rayon da var; onlar ayrıca sahələrdə verilir, təkrarlanmasın)
  street: {
    az: 'Ə.Mehbalıyev küçəsi 58/1',
    en: 'A. Mehbaliyev str. 58/1',
    ru: 'ул. А. Мехбалыева, 58/1',
    tr: 'Ə. Mehbalıyev sokak 58/1',
    ar: 'شارع أ. محبالييف 58/1',
  },

  // Yaşayış məntəqəsi — addan birbaşa məlumdur
  locality: {
    az: 'Qaraçuxur, Bakı',
    en: 'Garachukhur, Baku',
    ru: 'Карачухур, Баку',
    tr: 'Karaçuhur, Bakü',
    ar: 'قاراچوخور، باكو',
  },
  country: 'AZ',

  // Məscidin dəqiq koordinatı (xəritə nişanı, "yol tarifi" və namaz vaxtı üçün).
  // Mənbə: məscid sahibinin verdiyi Google Maps yeri ("Qaracuxur mescidi",
  // place id 0x40306300454ca0c7:0x9d884c9b36470871) — !3d/!4d dəyərləri.
  geo: { lat: 40.4024035, lng: 49.9734733 },

  // Namaz vaxtı hesablaması üçün yer. geo doldurulana qədər Bakı mərkəzi
  // istifadə olunur — Qaraçuxurla fərq 1 dəqiqədən azdır.
  // method: aladhan.com hesablama metodu (13 = Diyanet; saytın qalanı ilə eyni)
  prayerCalc: { lat: 40.4093, lng: 49.8671, method: 13 },

  // Google Maps linki (izləmə parametrləri — entry, g_ep — çıxarılıb)
  mapUrl: 'https://www.google.com/maps/place/Qaracuxur+mescidi/@40.4024076,49.9708984,17z/data=!3m1!4b1!4m6!3m5!1s0x40306300454ca0c7:0x9d884c9b36470871!8m2!3d40.4024035!4d49.9734733!16s%2Fg%2F11xgq_xlqv',

  // Əlaqə
  phone: '',          // +994 ...
  whatsapp: '',       // +994 ... (yalnız rəqəmlər də olar)
  email: '',

  // İmam
  imam: {
    name: '',
    // Qısa tanıtım — hər dildə
    bio: { az: '', en: '', ru: '', tr: '', ar: '' },
  },

  // Camaat (iqamə) vaxtları.
  // Hər biri ya "HH:MM" (sabit vaxt), ya "+N" (azandan N dəqiqə sonra),
  // ya da boş (göstərilmir — yalnız azan vaxtı çıxır).
  // Sahibin göstərişi ilə azan vaxtından hesablanır (məscidlərdə geniş yayılmış
  // fasilələr). Məscid dəqiq vaxt təyin etsə, Admin → "Camaat vaxtları"
  // bölməsindən (Firestore) dəyişdirilir — o dəyər bunun üstünə yazılır.
  jamaat: { fajr: '+20', dhuhr: '+15', asr: '+15', maghrib: '+5', isha: '+15' },

  // Cümə namazı
  jumua: {
    time: '+30',                                    // cümə günü zöhr azanından 30 dəq sonra (xütbədən sonra)
    khutbahLang: { az: '', en: '', ru: '', tr: '', ar: '' }, // məs. "Azərbaycan dilində"
  },

  // Məscidin tarixi — bir neçə abzas, hər dildə
  // Mənbə: məscid sahibinin verdiyi mətn (2026-09-20). Abzaslar boş sətirlə
  // ayrılır (MosquePage → paragraphs). Digər dillər bu mətnin tərcüməsidir —
  // burada heç nə əlavə edilməyib.
  history: {
    az:
      'Bakının böyük məscidlərindən olan “Qaraçuxur qəsəbə” məscidi 1996-cı ildə ' +
      'Türkiyə Diyanət Vəqfinin və xeyriyyəçi şəxslərin vəsaiti ilə inşa edilmişdir. ' +
      'Ənənəvi Osmanlı memarlığı üslubunda inşa edilmiş məscidin təxminən 22 metr ' +
      'hündürlüyündə minarəsi var.' +
      '\n\n' +
      'Məscid iki mərtəbəlidir, ibadət zalının sahəsi 750 kvadratmetrdir. Əllə işlənmiş ' +
      'minbəri və kürsüsü Türkiyədən gətirilmişdir. Məscidin qübbəsində yüksək xəttatlıqla ' +
      'Qurani-Kərimin “əl-İxlas” surəsi, mehrabında isə “Ayətül-kürsü” yazılmışdır.',
    en:
      'One of Baku’s large mosques, the “Garachukhur settlement” mosque was built in 1996 ' +
      'with funds from the Turkish Diyanet Foundation and from benefactors. Built in the ' +
      'traditional Ottoman architectural style, it has a minaret about 22 metres high.' +
      '\n\n' +
      'The mosque has two floors and its prayer hall covers 750 square metres. Its ' +
      'hand-crafted minbar and kursi were brought from Türkiye. Surah al-Ikhlas is ' +
      'inscribed on the dome in fine calligraphy, and Ayat al-Kursi in the mihrab.',
    ru:
      'Мечеть посёлка Карачухур — одна из больших мечетей Баку — построена в 1996 году ' +
      'на средства Турецкого фонда «Диянет» и благотворителей. Она возведена в традиционном ' +
      'османском архитектурном стиле, высота минарета — около 22 метров.' +
      '\n\n' +
      'Мечеть двухэтажная, площадь молитвенного зала — 750 квадратных метров. Минбар и ' +
      'кюрси ручной работы привезены из Турции. На куполе мечети искусной каллиграфией ' +
      'написана сура «аль-Ихляс», а в михрабе — «Аятуль-Курси».',
    tr:
      'Bakü’nün büyük camilerinden olan “Karaçuhur kasabası” camii, 1996 yılında Türkiye ' +
      'Diyanet Vakfı’nın ve hayırseverlerin katkılarıyla inşa edilmiştir. Geleneksel Osmanlı ' +
      'mimarisi üslubunda inşa edilen caminin yaklaşık 22 metre yüksekliğinde minaresi vardır.' +
      '\n\n' +
      'Cami iki katlıdır, ibadet salonunun alanı 750 metrekaredir. El işçiliğiyle yapılmış ' +
      'minberi ve kürsüsü Türkiye’den getirilmiştir. Caminin kubbesinde yüksek hat sanatıyla ' +
      'Kur’an-ı Kerim’in İhlâs sûresi, mihrabında ise Âyetü’l-Kürsî yazılıdır.',
    ar:
      'مسجد قصبة قاراچوخور من المساجد الكبيرة في باكو، بُني عام 1996 بتمويل من وقف الديانة ' +
      'التركي وأهل الخير. شُيّد على الطراز المعماري العثماني التقليدي، ويبلغ ارتفاع مئذنته ' +
      'نحو 22 مترًا.' +
      '\n\n' +
      'المسجد من طابقين، وتبلغ مساحة قاعة الصلاة 750 مترًا مربعًا. وقد جُلب منبره وكرسيه ' +
      'المصنوعان يدويًا من تركيا. وكُتبت على قبة المسجد سورة الإخلاص بخط بديع، وفي محرابه ' +
      'آية الكرسي.',
  },
  founded: '1996',    // tikilmə ili (sahibin məlumatı)

  // Məsciddə göstərilən xidmətlər — real olanları əlavə et.
  // Nümunə forma: { az: 'Uşaqlar üçün Quran kursu', en: 'Quran classes for children', ... }
  services: [],

  // Ianə rekvizitləri
  donation: {
    recipient: '',    // alıcının adı
    bankName: '',
    iban: '',
    cardNumber: '',   // istəyə bağlı
    note: { az: '', en: '', ru: '', tr: '', ar: '' },
  },

  // Sosial şəbəkələr — tam URL
  social: {
    instagram: '',    // https://instagram.com/...
    facebook: '',
    youtube: '',
    telegram: '',
  },
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

/**
 * Çoxdilli sahədən cari dili seç. Boşdursa az, sonra en-ə düşür.
 * Heç biri yoxdursa boş sətir qaytarır — çağıran filled() ilə yoxlamalıdır.
 */
export function tr(obj, lang = 'az') {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[lang] || obj.az || obj.en || ''
}

/** Brend adı cari dildə. */
export function brandName(lang = 'az') {
  return tr(BRAND.name, lang)
}

/** Məscidin dəqiq koordinatı varsa onu, yoxsa hesablama yerini qaytar. */
export function prayerLocation() {
  const { lat, lng } = MOSQUE.geo
  if (filled(lat) && filled(lng)) return { lat, lng, method: MOSQUE.prayerCalc.method, exact: true }
  return { ...MOSQUE.prayerCalc, exact: false }
}

/**
 * Camaat vaxtını azan vaxtından hesabla.
 * @param {string} rule  — "HH:MM", "+N" və ya boş
 * @param {string} adhan — "HH:MM" (aladhan cavabı; "05:12 (+04)" formasını da qəbul edir)
 * @returns {string} "HH:MM" və ya '' (qayda yoxdursa)
 */
export function jamaatTime(rule, adhan) {
  if (!filled(rule)) return ''
  const r = rule.trim()
  if (/^\d{1,2}:\d{2}$/.test(r)) return r.padStart(5, '0')
  const m = r.match(/^\+(\d{1,3})$/)
  if (!m || !adhan) return ''
  const [h, min] = String(adhan).slice(0, 5).split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(min)) return ''
  const total = h * 60 + min + Number(m[1])
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Doldurulmamış vacib sahələrin siyahısı — admin paneli və konsol xəbərdarlığı üçün. */
export function missingMosqueFields() {
  const checks = {
    'MOSQUE.address': MOSQUE.address,
    'MOSQUE.geo': MOSQUE.geo.lat,
    'MOSQUE.mapUrl': MOSQUE.mapUrl,
    'MOSQUE.phone': MOSQUE.phone,
    'MOSQUE.imam.name': MOSQUE.imam.name,
    'MOSQUE.jamaat': MOSQUE.jamaat,
    'MOSQUE.jumua.time': MOSQUE.jumua.time,
    'MOSQUE.history': MOSQUE.history,
    'MOSQUE.services': MOSQUE.services,
    'MOSQUE.donation.iban': MOSQUE.donation.iban,
    'MOSQUE.social': MOSQUE.social,
  }
  return Object.entries(checks).filter(([, v]) => !filled(v)).map(([k]) => k)
}

/**
 * schema.org/Mosque strukturlu məlumatı — Google yerli axtarışı üçün.
 * YALNIZ doldurulmuş sahələr daxil edilir: boş ünvan və ya uydurma
 * koordinat strukturlu məlumata düşməməlidir (Google bunu cəzalandırır).
 */
export function mosqueJsonLd(lang = 'az') {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Mosque',
    name: brandName(lang),
    alternateName: LANGS.map(l => tr(BRAND.name, l)).filter(n => n !== brandName(lang)),
    url: BRAND.url + '/',
    logo: BRAND.url + '/android-chrome-512x512.png',
    image: BRAND.url + '/og-image.png',
    description: tr(BRAND.tagline, lang),
  }

  const addressLine = tr(MOSQUE.address, lang)
  data.address = {
    '@type': 'PostalAddress',
    addressLocality: lang === 'az' ? 'Qaraçuxur' : 'Garachukhur',
    addressRegion: lang === 'az' ? 'Bakı' : 'Baku',
    addressCountry: MOSQUE.country,
    // Küçə sahəsi varsa onu ver (tam ünvan şəhəri də təkrarlayır)
    ...(filled(tr(MOSQUE.street, lang)) ? { streetAddress: tr(MOSQUE.street, lang) }
      : filled(addressLine) ? { streetAddress: addressLine } : {}),
  }

  if (filled(MOSQUE.geo.lat) && filled(MOSQUE.geo.lng)) {
    data.geo = { '@type': 'GeoCoordinates', latitude: MOSQUE.geo.lat, longitude: MOSQUE.geo.lng }
  }
  if (filled(MOSQUE.mapUrl)) data.hasMap = MOSQUE.mapUrl
  if (filled(MOSQUE.phone)) data.telephone = MOSQUE.phone
  if (filled(MOSQUE.email)) data.email = MOSQUE.email
  if (filled(MOSQUE.founded)) data.foundingDate = MOSQUE.founded

  const sameAs = Object.values(MOSQUE.social).filter(filled)
  if (sameAs.length) data.sameAs = sameAs

  return data
}
