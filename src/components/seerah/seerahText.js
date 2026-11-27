// ═══════════════════════════════════════════════════════
// /seerah — interfeys yazıları (5 dil) və il formatı
//
// Ayrıca faylda: həm səhifə (pages/SeerahPage.jsx), həm də prerender-in statik bloku
// (scripts/seo-body.mjs) eyni yazıları işlədir. Adi JS — JSX yoxdur, Node-da yüklənir.
// Dini mətn YOXDUR — hadisə mətnləri src/data/seerah.js-dədir.
// ═══════════════════════════════════════════════════════

// Rus dilində cəm: 1 год, 2 года, 5 лет
const ruPlural = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10
  if (a > 10 && a < 20) return many
  if (b === 1) return one
  if (b >= 2 && b <= 4) return few
  return many
}
const arCount = (n) => (n === 1 ? 'حدث واحد' : n === 2 ? 'حدثان' : n <= 10 ? `${arDigits(n)} أحداث` : `${arDigits(n)} حدثًا`)

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
/** Qərb rəqəmləri → ərəb-hind rəqəmləri (ərəbcə interfeys və xəttat il nişanı üçün). */
export function arDigits(v) {
  return String(v).replace(/\d/g, (d) => AR_DIGITS[d])
}

export const SEERAH_T = {
  az: {
    title: 'Siyər — Peyğəmbərin ﷺ həyatı',
    lead: 'Məkkədə doğulduğu gündən Mədinədə vəfat etdiyi günə qədər Peyğəmbərin ﷺ həyatının əsas hadisələri — xəritədə və zaman xəttində, hər birinin mənbəyi ilə.',
    how: 'Aşağı sürüşdürün — hadisənin yeri xəritədə işıqlanır. Xəritədə yerə toxunsanız, onun hadisəsinə keçəcəksiniz.',
    kids: 'Uşaqlar üçün', kidsOn: 'Uşaqlar üçün sadə mətn göstərilir', kidsOff: 'Tam mətn göstərilir',
    makkahPeriod: 'Məkkə dövrü', madinahPeriod: 'Mədinə dövrü',
    makkahSpan: 'Doğumdan hicrətə qədər', madinahSpan: 'Hicrətdən vəfata qədər',
    source: 'Mənbə', approx: 'təxminən', differ: 'Tarixdə fərqli rəylər var',
    hijri: (n) => `Hicri ${n}`, hijriR: (a, b) => `Hicri ${a}–${b}`,
    before: (n) => `Hicrətdən ${n} il əvvəl`, beforeR: (a, b) => `Hicrətdən ${a}–${b} il əvvəl`,
    ce: (y) => `${y} m.`, ceR: (a, b) => `${a}–${b} m.`,
    places: 'Siyər yerləri', placesHint: 'Yeri seçin — onun hadisəsinə keçin.',
    nEvents: (n) => `${n} hadisə`,
    mapNote: 'Sxematik xəritə: nöqtələr real koordinatlardandır, sahil xətti sadələşdirilib. Qırıq xətt — hicrətin təxmini yolu.',
    makkahArea: 'Məkkə ətrafı', madinahArea: 'Mədinə ətrafı', approxPlace: 'yeri təxminidir', sea: 'Qırmızı dəniz', north: 'Ş',
    openAyah: 'Quranda aç',
    isra: 'İsra və Merac səyahəti — İslam tarixi bölməsində',
    letters: 'Peyğəmbərin ﷺ məktubları — İslam tarixi bölməsində',
    noteTitle: 'Bu səhifə haqqında',
    note: 'Mətnlər mənbələrin qısa xülasəsidir, sitat deyil. Hər hadisənin altında Quran ayəsi və ya Səhih əl-Buxari və Səhih Muslimdən hədis nömrəsi göstərilib; yalnız siyər kitablarında olan məlumat «tarixçilərə görə» kimi qeyd olunub. Hicri və miladi illər təxminidir.',
    relEyebrow: 'Davamı', relTitle: 'Əlaqəli bölmələr',
  },
  en: {
    title: 'Seerah — the life of the Prophet ﷺ',
    lead: 'The key events in the life of the Prophet ﷺ, from his birth in Makkah to his passing in Madinah — on a map and a timeline, each with its source.',
    how: 'Scroll down — the place of each event lights up on the map. Tap a place on the map to jump to its event.',
    kids: 'For kids', kidsOn: 'Showing simple text for kids', kidsOff: 'Showing the full text',
    makkahPeriod: 'The Makkan period', madinahPeriod: 'The Madinan period',
    makkahSpan: 'From his birth to the Hijrah', madinahSpan: 'From the Hijrah to his passing',
    source: 'Source', approx: 'c.', differ: 'Dates differ in the sources',
    hijri: (n) => `AH ${n}`, hijriR: (a, b) => `AH ${a}–${b}`,
    before: (n) => (n === 1 ? '1 year before the Hijrah' : `${n} years before the Hijrah`), beforeR: (a, b) => `${a}–${b} years before the Hijrah`,
    ce: (y) => `${y} CE`, ceR: (a, b) => `${a}–${b} CE`,
    places: 'Places of the Seerah', placesHint: 'Pick a place to jump to its event.',
    nEvents: (n) => (n === 1 ? '1 event' : `${n} events`),
    mapNote: 'Schematic map: points use real coordinates; the coastline is simplified. Dashed line — the approximate route of the Hijrah.',
    makkahArea: 'Around Makkah', madinahArea: 'Around Madinah', approxPlace: 'location approximate', sea: 'Red Sea', north: 'N',
    openAyah: 'Open in the Quran',
    isra: 'The journey of al-Isra and al-Mi‘raj — in Islamic History',
    letters: 'The letters of the Prophet ﷺ — in Islamic History',
    noteTitle: 'About this page',
    note: 'The texts are short summaries of the sources, not quotations. Each event lists a Quran verse or a hadith number from Sahih al-Bukhari and Sahih Muslim; details found only in the seerah books are marked “according to historians”. Hijri and Gregorian years are approximate.',
    relEyebrow: 'Continue', relTitle: 'Related sections',
  },
  ru: {
    title: 'Сира — жизнь Пророка ﷺ',
    lead: 'Главные события жизни Пророка ﷺ — от рождения в Мекке до кончины в Медине — на карте и на шкале времени, у каждого указан источник.',
    how: 'Прокручивайте вниз — место события подсвечивается на карте. Нажмите на место на карте, чтобы перейти к его событию.',
    kids: 'Для детей', kidsOn: 'Показан простой текст для детей', kidsOff: 'Показан полный текст',
    makkahPeriod: 'Мекканский период', madinahPeriod: 'Мединский период',
    makkahSpan: 'От рождения до хиджры', madinahSpan: 'От хиджры до кончины',
    source: 'Источник', approx: 'ок.', differ: 'В источниках даты расходятся',
    hijri: (n) => `${n} г. х.`, hijriR: (a, b) => `${a}–${b} гг. х.`,
    before: (n) => `за ${n} ${ruPlural(n, 'год', 'года', 'лет')} до хиджры`, beforeR: (a, b) => `за ${a}–${b} ${ruPlural(b, 'год', 'года', 'лет')} до хиджры`,
    ce: (y) => `${y} г.`, ceR: (a, b) => `${a}–${b} гг.`,
    places: 'Места сиры', placesHint: 'Выберите место, чтобы перейти к его событию.',
    nEvents: (n) => `${n} ${ruPlural(n, 'событие', 'события', 'событий')}`,
    mapNote: 'Схематичная карта: точки по реальным координатам, береговая линия упрощена. Пунктир — примерный путь хиджры.',
    makkahArea: 'Окрестности Мекки', madinahArea: 'Окрестности Медины', approxPlace: 'место приблизительно', sea: 'Красное море', north: 'С',
    openAyah: 'Открыть в Коране',
    isra: 'Путешествие Исра и Мирадж — в разделе «История ислама»',
    letters: 'Письма Пророка ﷺ — в разделе «История ислама»',
    noteTitle: 'Об этой странице',
    note: 'Тексты — краткое изложение источников, а не цитаты. У каждого события указан аят Корана или номер хадиса из «Сахиха» аль-Бухари и «Сахиха» Муслима; сведения, которые есть только в книгах сиры, отмечены словами «по словам историков». Годы по хиджре и по григорианскому календарю приблизительны.',
    relEyebrow: 'Дальше', relTitle: 'Связанные разделы',
  },
  ar: {
    title: 'السيرة النبوية — حياة النبي ﷺ',
    lead: 'أبرز أحداث حياة النبي ﷺ من مولده في مكة إلى وفاته في المدينة — على خريطة وخط زمني، مع مصدر كل حدث.',
    how: 'مرِّر إلى الأسفل لتضيء على الخريطة مواضع الأحداث، واضغط على موضع في الخريطة للانتقال إلى حدثه.',
    kids: 'للأطفال', kidsOn: 'يُعرض نص مبسّط للأطفال', kidsOff: 'يُعرض النص الكامل',
    makkahPeriod: 'العهد المكي', madinahPeriod: 'العهد المدني',
    makkahSpan: 'من المولد إلى الهجرة', madinahSpan: 'من الهجرة إلى الوفاة',
    source: 'المصدر', approx: 'نحو', differ: 'في تاريخه خلاف',
    hijri: (n) => `${arDigits(n)} هـ`, hijriR: (a, b) => `${arDigits(a)}–${arDigits(b)} هـ`,
    before: (n) => `${arDigits(n)} ق.هـ`, beforeR: (a, b) => `${arDigits(a)}–${arDigits(b)} ق.هـ`,
    ce: (y) => `${arDigits(y)} م`, ceR: (a, b) => `${arDigits(a)}–${arDigits(b)} م`,
    places: 'أماكن السيرة', placesHint: 'اختر موضعًا للانتقال إلى حدثه.',
    nEvents: arCount,
    mapNote: 'خريطة تخطيطية: النقاط بإحداثيات حقيقية، وخط الساحل مبسّط. الخط المتقطع — طريق الهجرة التقريبي.',
    makkahArea: 'ما حول مكة', madinahArea: 'ما حول المدينة', approxPlace: 'الموضع تقريبي', sea: 'البحر الأحمر', north: 'ش',
    openAyah: 'افتح في المصحف',
    isra: 'رحلة الإسراء والمعراج — في قسم التاريخ الإسلامي',
    letters: 'كتب النبي ﷺ إلى الملوك — في قسم التاريخ الإسلامي',
    noteTitle: 'عن هذه الصفحة',
    note: 'النصوص خلاصات موجزة للمصادر وليست نقولًا حرفية. ذُكر تحت كل حدث آية من القرآن أو رقم حديث من صحيح البخاري وصحيح مسلم، وما انفردت به كتب السيرة نُبّه عليه بعبارة «على ما يذكره المؤرخون». والسنوات الهجرية والميلادية تقريبية.',
    relEyebrow: 'للمتابعة', relTitle: 'أقسام ذات صلة',
  },
  tr: {
    title: 'Siyer — Peygamber’in ﷺ hayatı',
    lead: 'Mekke’de doğduğu günden Medine’de vefat ettiği güne kadar Peygamber’in ﷺ hayatının temel olayları — haritada ve zaman çizelgesinde, her birinin kaynağıyla.',
    how: 'Aşağı kaydırın — olayın yeri haritada parlar. Haritada bir yere dokunursanız o yerin olayına geçersiniz.',
    kids: 'Çocuklar için', kidsOn: 'Çocuklar için sade metin gösteriliyor', kidsOff: 'Tam metin gösteriliyor',
    makkahPeriod: 'Mekke dönemi', madinahPeriod: 'Medine dönemi',
    makkahSpan: 'Doğumdan hicrete kadar', madinahSpan: 'Hicretten vefata kadar',
    source: 'Kaynak', approx: 'yaklaşık', differ: 'Tarihi konusunda farklı görüşler var',
    hijri: (n) => `Hicri ${n}`, hijriR: (a, b) => `Hicri ${a}–${b}`,
    before: (n) => `Hicretten ${n} yıl önce`, beforeR: (a, b) => `Hicretten ${a}–${b} yıl önce`,
    ce: (y) => `M. ${y}`, ceR: (a, b) => `M. ${a}–${b}`,
    places: 'Siyer mekânları', placesHint: 'Bir yer seçin, olayına geçin.',
    nEvents: (n) => `${n} olay`,
    mapNote: 'Şematik harita: noktalar gerçek koordinatlardandır, kıyı çizgisi sadeleştirilmiştir. Kesik çizgi — hicretin yaklaşık yolu.',
    makkahArea: 'Mekke çevresi', madinahArea: 'Medine çevresi', approxPlace: 'yeri yaklaşıktır', sea: 'Kızıldeniz', north: 'K',
    openAyah: 'Kur’an’da aç',
    isra: 'İsrâ ve Mi‘rac yolculuğu — İslam Tarihi bölümünde',
    letters: 'Peygamber’in ﷺ mektupları — İslam Tarihi bölümünde',
    noteTitle: 'Bu sayfa hakkında',
    note: 'Metinler kaynakların kısa özetidir, alıntı değildir. Her olayın altında bir Kur’an ayeti veya Sahîh-i Buhârî ve Sahîh-i Müslim’den hadis numarası verilmiştir; yalnızca siyer kitaplarında geçen bilgiler “tarihçilere göre” diye belirtilmiştir. Hicri ve miladi yıllar yaklaşıktır.',
    relEyebrow: 'Devamı', relTitle: 'İlgili bölümler',
  },
}

/** Hadisənin il yazıları: { hijri, ce, approx } — t = SEERAH_T[lang] (əlavə dildə — en). */
export function yearText(e, t) {
  const hijri = e.h > 0
    ? (e.h2 ? t.hijriR(e.h, e.h2) : t.hijri(e.h))
    : (e.h2 ? t.beforeR(-e.h, -e.h2) : t.before(-e.h))
  const ce = e.ce2 ? t.ceR(e.ce, e.ce2) : t.ce(e.ce)
  return { hijri, ce: e.approx ? `${t.approx} ${ce}` : ce }
}

/** Xəttat il nişanı (həmişə ərəbcə, bəzək): "٢ هـ", "١٣ ق.هـ" */
export function calligraphicYear(e) {
  const a = Math.abs(e.h)
  const b = e.h2 != null ? Math.abs(e.h2) : null
  const n = b != null ? `${arDigits(a)}–${arDigits(b)}` : arDigits(a)
  return `${n} ${e.h > 0 ? 'هـ' : 'ق.هـ'}`
}
