// ═══════════════════════════════════════════════════════
// Ana səhifənin ekranın ALTINDAKI statik bölmələri — ayrıca tənbəl chunk
//
//   "Haradan başlamalı?" (StartSection) · Quran kafeli + rəqəmlər (FeatsSection)
//   · Tövhid (TawheedSection) · Allahın 99 adı (NamesSection) · CTA (CtaSection)
//
// NİYƏ: bu bölmələrin mətnləri (5 dil) və NumberTicker / StatTile / KhatmPulse
// əvvəl HomePage chunk-ında idi və ilk yükləmədə (LCP-dən əvvəl) endirilirdi.
// İndi HomePage onları DeferRender (idle={false}) içində, bölməyə yaxınlaşanda
// yükləyir; yer tutucu eyni hündürlükdədir (CLS yoxdur). Məzmun dəyişməyib —
// olduğu kimi pages/HomePage.jsx-dən köçürülüb.
// ═══════════════════════════════════════════════════════
import { useState, lazy, Suspense } from 'react'
import Icon from '../Icon'
import { StatTile } from '../viz'
import NumberTicker from '../../motion/NumberTicker'
import { haptic } from '../../hooks/useHaptic'
import { HADITH_COUNT } from '../../data/siteStats'
import { pathFor } from '../../seo/routes'
import { BRAND } from '../../config/brand'

// Ümmətin Canlı Xətmi: kiçik canlı sayğac (SSE açmır — keşlənmiş /api/khatm/stats)
const KhatmPulse = lazy(() => import('../khatm/KhatmPulse').catch(() => ({ default: () => null })))

// Adi sol klik — SPA naviqasiyası; Ctrl/Shift/orta klik brauzerə qalır (yeni tab)
const plainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
// Tərcümə yoxdursa əvvəl ingiliscə — ərəb/rus/türk səhifəsində azərbaycanca mətn çıxmasın
const pickL = (lk) => (obj) => obj[lk] || obj.en || obj.az || ''

// Əlçatanlıq: "Tövhid" bölməsinin telefonda üfüqi sürüşən iki zolağı —
// içində fokuslana bilən element yoxdur, ona görə zolağın özü fokuslanır
// (tabIndex=0) ki, klaviatura ilə ox düymələri ilə sürüşdürmək olsun
// (axe: scrollable-region-focusable). role="region" + ad — ekran oxuyucusu üçün.
const TW_REGION = {
  facts: { az: 'Tövhid haqqında faktlar', en: 'Facts about Tawheed', ru: 'Факты о Таухиде', ar: 'حقائق عن التوحيد', tr: 'Tevhid hakkında gerçekler' },
  info:  { az: 'Tövhid haqqında məlumat kartları', en: 'Information cards about Tawheed', ru: 'Карточки о Таухиде', ar: 'بطاقات معلومات عن التوحيد', tr: 'Tevhid hakkında bilgi kartları' },
}

// "Haradan başlamalı?" — yeni gələn üçün 4 addım (.ui-steps). Hər addım
// mövcud bölməyə aparır — məzmun təkrarlanmır, yalnız yol göstərilir.
const START = [
  { page: 'prayer', icon: 'pin',
    title: { az: 'Şəhərinizi seçin', en: 'Choose your city', ru: 'Выберите свой город', ar: 'اختر مدينتك', tr: 'Şehrinizi seçin' },
    text: { az: 'Namaz kartında şəhərin adına toxunun — beş vaxt və növbəti azana qalan vaxt görünür.', en: 'Tap the city name on the prayer card — the five times and the countdown to the next adhan appear.', ru: 'Нажмите на название города в карточке намаза — появятся пять времён и отсчёт до азана.', ar: 'اضغط على اسم المدينة في بطاقة الصلاة لتظهر الأوقات الخمسة والعدّ التنازلي للأذان.', tr: 'Namaz kartında şehir adına dokunun — beş vakit ve sonraki ezana kalan süre görünür.' } },
  { page: 'prayerguide', icon: 'prayerguide',
    title: { az: 'Namazı öyrənin', en: 'Learn the prayer', ru: 'Изучите намаз', ar: 'تعلّم الصلاة', tr: 'Namazı öğrenin' },
    text: { az: 'Dəstəmazdan salama qədər hər hərəkət addım-addım, dəlilləri ilə.', en: 'Every movement from wudu to salam, step by step, with its evidence.', ru: 'Каждое действие от омовения до салама — шаг за шагом, с доводами.', ar: 'كل حركة من الوضوء إلى التسليم خطوة بخطوة مع الدليل.', tr: 'Abdestten selama her hareket adım adım, delilleriyle.' } },
  { page: 'quran', icon: 'quran',
    title: { az: 'Quranı oxuyun', en: 'Read the Quran', ru: 'Читайте Коран', ar: 'اقرأ القرآن', tr: "Kur'an okuyun" },
    text: { az: '114 surə — ərəbcə mətn, tərcümə və qarilərin tilavəti.', en: '114 surahs — Arabic text, translation and recitation.', ru: '114 сур — арабский текст, перевод и чтение чтецов.', ar: '114 سورة — النص والتلاوة بأصوات القراء.', tr: '114 sure — Arapça metin, meal ve kârilerin tilaveti.' } },
  { page: 'learn', icon: 'learn',
    title: { az: 'Dininizi öyrənin', en: 'Learn your religion', ru: 'Изучайте религию', ar: 'تعلّم دينك', tr: 'Dininizi öğrenin' },
    text: { az: 'Qısa dərslər: tövhid, iman, ibadət — Quran, səhih Sünnə və Sələfin anlayışı ilə.', en: 'Short lessons on tawheed, faith and worship — by the Quran, authentic Sunnah and the understanding of the Salaf.', ru: 'Короткие уроки о таухиде, вере и поклонении — по Корану, достоверной Сунне и пониманию саляфов.', ar: 'دروس قصيرة في التوحيد والإيمان والعبادة — بالقرآن والسنة الصحيحة وفهم السلف.', tr: 'Tevhid, iman ve ibadet üzerine kısa dersler — Kur\'an, sahih Sünnet ve Selef anlayışıyla.' } },
]

// "Saytda" bölməsi — saytın İslami bölmələri (əvvəl i18n açarları səhv
// kartlara düşürdü: "Namaz" kartında hədis mətni, "50+ hədis" və s.)
const FEATURES = [
  { page: 'quran', icon: '📖', clr: '#10b981',
    title: { az: 'Qurani-Kərim', en: 'Holy Quran', ru: 'Священный Коран', ar: 'القرآن الكريم', tr: "Kur'an-ı Kerim" },
    desc: { az: '114 surə, 6236 ayə — tərcümə və tilavət', en: '114 surahs, 6236 verses — translation and recitation', ru: '114 сур, 6236 аятов — перевод и чтение', ar: '114 سورة و6236 آية — ترجمة وتلاوة', tr: '114 sure, 6236 ayet — meal ve tilavet' } },
  { page: 'prayer', icon: '🕐', clr: '#f59e0b',
    title: { az: 'Namaz təqvimi', en: 'Prayer Times', ru: 'Время намаза', ar: 'مواقيت الصلاة', tr: 'Namaz Vakitleri' },
    desc: { az: 'Namaz vaxtları və namaz izləyicisi', en: 'Prayer times and a prayer tracker', ru: 'Время намаза и трекер намазов', ar: 'مواقيت الصلاة ومتابعة الصلوات', tr: 'Namaz vakitleri ve namaz takibi' } },
  { page: 'hadith', icon: '📚', clr: '#8b5cf6',
    title: { az: 'Hədislər', en: 'Hadiths', ru: 'Хадисы', ar: 'الأحاديث', tr: 'Hadisler' },
    desc: { az: 'Buxari, Müslim və digər mənbələrdən', en: 'From Bukhari, Muslim and other collections', ru: 'Из Бухари, Муслима и других сборников', ar: 'من البخاري ومسلم وغيرهما', tr: 'Buhari, Müslim ve diğer kaynaklardan' } },
  { page: 'duas', icon: '🤲', clr: '#3b82f6',
    title: { az: 'Dualar', en: "Du'as", ru: 'Дуа', ar: 'الأدعية', tr: 'Dualar' },
    desc: { az: 'Hər məqam üçün dualar', en: 'Supplications for every occasion', ru: 'Мольбы на каждый случай', ar: 'أدعية لكل مناسبة', tr: 'Her an için dualar' } },
  { page: 'names', icon: '⭐', clr: '#ec4899',
    title: { az: 'Allahın 99 adı', en: '99 Names of Allah', ru: '99 имён Аллаха', ar: 'أسماء الله الحسنى', tr: "Allah'ın 99 İsmi" },
    desc: { az: 'Əsmaül-Hüsna — mənaları ilə', en: 'Asma ul-Husna with their meanings', ru: 'Асма уль-Хусна с их значениями', ar: 'الأسماء الحسنى ومعانيها', tr: 'Esmaü’l-Hüsna — anlamlarıyla' } },
  { page: 'zakat', icon: '💰', clr: '#ef4444',
    title: { az: 'Zəkat kalkulyatoru', en: 'Zakat Calculator', ru: 'Калькулятор закята', ar: 'حاسبة الزكاة', tr: 'Zekât Hesaplayıcı' },
    desc: { az: 'Qızıl, gümüş və nağd pul üzrə hesablama', en: 'Zakat on gold, silver and cash', ru: 'Закят с золота, серебра и денег', ar: 'زكاة الذهب والفضة والنقود', tr: 'Altın, gümüş ve nakit için hesaplama' } },
  { page: 'qibla', icon: '🧭', clr: '#14b8a6',
    title: { az: 'Qiblə', en: 'Qibla', ru: 'Кибла', ar: 'القبلة', tr: 'Kıble' },
    desc: { az: 'Kəbəyə istiqamət', en: 'Direction to the Kaaba', ru: 'Направление на Каабу', ar: 'الاتجاه نحو الكعبة', tr: 'Kâbe yönü' } },
  { page: 'dhikr', icon: '📿', clr: '#a855f7',
    title: { az: 'Zikr sayğacı', en: 'Dhikr Counter', ru: 'Счётчик зикра', ar: 'عداد الذكر', tr: 'Zikir Sayacı' },
    desc: { az: 'Sübhanallah, Əlhəmdulillah, Allahu Əkbər', en: 'SubhanAllah, Alhamdulillah, Allahu Akbar', ru: 'СубханАллах, Альхамдулиллях, Аллаху Акбар', ar: 'سبحان الله، الحمد لله، الله أكبر', tr: 'Sübhanallah, Elhamdülillah, Allahu Ekber' } },
]

const TAWHEED_PILLARS = [
  {
    icon:'☝️', key:'rub', ar:'تَوْحِيدُ الرُّبُوبِيَّة',
    az:'Rübubiyyət tövhidi', en:'Tawhid al-Rububiyyah', ru:'Таухид ар-Рубубийя', tr:'Rububiyyet Tevhidi',
    desc:{
      az:'Allahın Rəbb olduğuna inanmaqdır — O hər şeyin yaradıcısı, ruzi verəni və idarəçisidir. Heç kim Onun yaratmaq, öldürmək, diriltmək, ruzi vermək, idarə etmək kimi xüsusiyyətlərində Ona şərik ola bilməz.',
      en:'Belief in Allah\'s Lordship — that He alone creates, provides sustenance, and governs all things. Nothing can share His powers of creation, life, death, and governance.',
      ru:'Вера в господство Аллаха — что Он один творит, дарует пропитание и управляет всем. Никто не может разделять с Ним творение, жизнь, смерть и управление.',
      tr:'Allah\'ın Rablığına iman — yalnız O\'nun yaratan, rızık veren ve idare edendir. Yaratmak, hayat, ölüm ve yönetim gibi özelliklerinde hiçbir şey O\'na ortak olamaz.',
      ar:'الإيمان بأن الله وحده هو الخالق الرازق المدبّر لكل شيء، لا يشاركه أحد في الخلق والإحياء والإماتة والرزق والتدبير.',
    },
    ayah:'أَلاَ لَهُ الْخَلْقُ وَالأَمْرُ تَبَارَكَ اللَّهُ رَبُّ الْعَالَمِينَ',
    ayahRef:{ az:'Əraf 54', en:'Al-A\'raf 54', ru:'Аль-Аграф 54', tr:'Araf 54', ar:'الأعراف 54' },
    color:'#10b981',
  },
  {
    icon:'🕌', key:'ulu', ar:'تَوْحِيدُ الأُلُوهِيَّة',
    az:'Uluhiyyət tövhidi', en:'Tawhid al-Uluhiyyah', ru:'Таухид аль-Улюхийя', tr:'Uluhiyyet Tevhidi',
    desc:{
      az:'Bütün ibadətin — namaz, dua, qurban, nəzir, sevgi, qorxu, ümid, s.d.a. — yalnız Allaha edilməsidir. Bu tövhid növü peyğəmbərlərin insanlara ən çox çatdırdığı dəvətin əsasını təşkil edir.',
      en:'Dedicating all acts of worship solely to Allah: prayer, supplication, sacrifice, vows, love, fear, and hope. This is the core of every prophet\'s call to their people.',
      ru:'Посвящение всех актов поклонения исключительно Аллаху: молитва, мольба, жертвоприношение, обеты, любовь, страх, надежда. Это основа призыва каждого пророка.',
      tr:'Tüm ibadetleri yalnızca Allah\'a adamak: namaz, dua, kurban, adak, sevgi, korku, ümit. Bu, her peygamberin davetinin temelidir.',
      ar:'إفراد الله وحده بجميع أنواع العبادة: الصلاة والدعاء والذبح والنذر والمحبة والخوف والرجاء، وهو أساس دعوة جميع الأنبياء.',
    },
    ayah:'وَمَا خَلَقْتُ الجِنَّ وَالإِنسَ إِلاَّ لِيَعْبُدُونِ',
    ayahRef:{ az:'Zariyat 56', en:'Adh-Dhariyat 56', ru:'Аз-Зарийат 56', tr:'Zariyat 56', ar:'الذاريات 56' },
    color:'#f59e0b',
  },
  {
    icon:'✨', key:'asma', ar:'تَوْحِيدُ الأَسْمَاءِ وَالصِّفَاتِ',
    az:'Əsma və sifat tövhidi', en:'Tawhid al-Asma was-Sifat', ru:'Таухид аль-Асма уа ас-Сыфат', tr:'Esma ve Sıfat Tevhidi',
    desc:{
      az:'Allahın Özü üçün Quran və sünnədə sabit etdiyi bütün gözəl ad və sifətlərə iman etmək; onları məxluqata bənzətmədən, inkar etmədən, dəyişdirmədən, surətini soruşmadan.',
      en:'Affirming all the beautiful Names and Attributes that Allah established for Himself in the Quran and Sunnah — without likening them to creation, denying, distorting, or asking about their modality.',
      ru:'Утверждение всех прекрасных Имён и Атрибутов, которые Аллах установил для Себя в Коране и Сунне — без уподобления творениям, отрицания, искажения или вопросов об их природе.',
      tr:'Allah\'ın Kuran ve sünnette kendisi için sabit kıldığı tüm güzel isim ve sıfatları ispat etmek — mahlûkata benzetmeksizin, inkâr etmeksizin, tahrif etmeksizin ve keyfiyetini sormaksızın.',
      ar:'إثبات ما أثبته الله لنفسه في القرآن والسنة من الأسماء الحسنى والصفات العلى، من غير تشبيه ولا تعطيل ولا تحريف ولا تكييف.',
    },
    ayah:'وَلِلَّهِ الأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا',
    ayahRef:{ az:'Əraf 180', en:'Al-A\'raf 180', ru:'Аль-Аграф 180', tr:'Araf 180', ar:'الأعراف 180' },
    color:'#8b5cf6',
  },
]

// ar — kartın ərəbcə başlığıdır (kəlmə / ayə hissəsi). arExpl — ərəb dilində
// göstərilən qısa izah (digər dillərdəki izahın tərcüməsi; ayə deyil).
// Əvvəl ərəb dilində izahın yerində eyni ərəbcə sətir təkrarlanırdı.
const TAWHEED_FACTS = [
  { arExpl:'أساس الإسلام، ومفتاح الجنة، وأثقل الكلمات', ar:'لَا إِلَهَ إِلَّا اللَّهُ', az:'"La ilaha illallah" — İslamın əsası, cənnətin açarı, ən ağır kəlmə', en:'"La ilaha illallah" — foundation of Islam, key to Paradise, the weightiest word', ru:'"Ля иляха иллаллах" — основа ислама, ключ от рая', tr:'"La ilahe illallah" — İslam\'ın temeli, cennetin anahtarı' },
  { arExpl:'الله واحد — لا شريك له ولا ندّ ولا نظير', ar:'هُوَ اللَّهُ أَحَدٌ', az:'Allah birdir — heç bir şərikin, həmtayın, nəzirin yoxdur', en:'Allah is One — no partners, equals, or rivals', ru:'Аллах Один — без сотоварищей, равных или соперников', tr:'Allah birdir — ortağı, eşi, dengi yoktur' },
  { arExpl:'كل شيء مفتقر إليه، وهو لا يفتقر إلى أحد', ar:'اللَّهُ الصَّمَدُ', az:'Allah Saməd — hər şey Ona möhtac, O heç kimə möhtac deyil', en:'Allah is As-Samad — all depend on Him; He depends on none', ru:'Аллах — Самад: все нуждаются в Нём, Он ни в ком не нуждается', tr:'Allah Samed\'dir — herkes O\'na muhtaç, O kimseye değil' },
  { arExpl:'لا يشبهه شيء، ولا يساويه أحد', ar:'لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُواً أَحَدٌ', az:'O doğmadı, doğulmadı — heç bir şeyə bənzəmir, heç kim Onun bənzəri deyil', en:'He neither begot nor was begotten — nothing resembles Him, none equals Him', ru:'Он не рожает и не рождён — ничто Ему не подобно', tr:'O doğurmadı ve doğulmadı — hiçbir şey O\'na benzemez' },
]

// Quran zolağı — Hicr 9 ayəsinin tərcüməsi (əvvəlki mətn olduğu kimi) və
// istinad ayrıca saxlanılır ki, istinad sətirdə bölünməsin
const QBAN_TR = {
  // lang-ok: ar-da tərcümə göstərilmir — ərəbcə ayənin özü göstərilir (isAr)
  az: '"Biz Quranı Biz nazil etdik; onu Biz qoruyacağıq."',
  ru: '"Воистину, Мы ниспослали Коран и будем его оберегать."',
  tr: '"Şüphesiz Kur\'an\'ı biz indirdik ve onu koruyacak olan da biziz."',
  en: '"Indeed, it is We who revealed the Quran and indeed, We will be its Guardian."',
}
const QBAN_REF = { az: 'Hicr 9', ru: 'Аль-Хиджр 9', ar: 'الحجر 9', tr: 'Hicr 9', en: 'Al-Hijr 9' }

// 99 ad — translit = Az transliterasiya (YALNIZ azərbaycanca səhifədə görünür;
// en/ru/tr-də azərbaycanca yazılış "sızmasın" deyə gizlədilir),
// meaning = aktiv dilə uyğun seçilir (ərəbcədən başqa hamısında).
const ALLAH_NAMES = [
  { ar:'ٱلرَّحْمَٰن', translit:'Rəhman', color:'#10b981', meaning:{ az:'Mərhəmətli',        en:'The Most Gracious',          ru:'Всемилостивый',         ar:'الرحمن',                    tr:'Rahmân' } },
  { ar:'ٱلرَّحِيم',   translit:'Rəhim',  color:'#f59e0b', meaning:{ az:'Rəhmli',             en:'The Most Merciful',          ru:'Милосердный',           ar:'الرحيم',                    tr:'Rahîm' } },
  { ar:'ٱلْمَلِك',    translit:'Malik',  color:'#8b5cf6', meaning:{ az:'Hökmdar',            en:'The King',                   ru:'Царь',                  ar:'الملك',                     tr:'Melik' } },
  { ar:'ٱلْقُدُّوس', translit:'Quddus', color:'#3b82f6', meaning:{ az:'Pak olan',           en:'The Most Pure',              ru:'Святой',                ar:'القدوس',                    tr:'Kuddûs' } },
  { ar:'ٱلسَّلَٰم',  translit:'Salam',  color:'#ec4899', meaning:{ az:'Sülh verən',         en:'The Source of Peace',        ru:'Источник мира',         ar:'السلام',                    tr:'Selâm' } },
  { ar:'ٱلْمُؤْمِن', translit:'Mömin',  color:'#ef4444', meaning:{ az:'Güvən verən',        en:'The Granter of Security',    ru:'Дарующий веру',         ar:'المؤمن',                    tr:"Mü'min" } },
  { ar:'ٱلْعَزِيز',  translit:'Əziz',   color:'#f97316', meaning:{ az:'Qüdrətli',           en:'The Almighty',               ru:'Могущественный',        ar:'العزيز',                    tr:'Azîz' } },
  { ar:'ٱلْغَفُور',  translit:'Ğafur',  color:'#14b8a6', meaning:{ az:'Bağışlayan',         en:'The Forgiving',              ru:'Прощающий',             ar:'الغفور',                    tr:'Gafûr' } },
  { ar:'ٱلْوَدُود',  translit:'Vədud',  color:'#a855f7', meaning:{ az:'Sevən',              en:'The Loving',                 ru:'Любящий',               ar:'الودود',                    tr:'Vedûd' } },
  { ar:'ٱلْحَكِيم',  translit:'Həkim',  color:'#6366f1', meaning:{ az:'Hikmət sahibi',      en:'The Wise',                   ru:'Мудрый',                ar:'الحكيم',                    tr:'Hakîm' } },
  { ar:'ٱلتَّوَّاب', translit:'Tövvab', color:'#84cc16', meaning:{ az:'Tövbələri qəbul edən', en:'The Acceptor of Repentance', ru:'Принимающий покаяние', ar:'التواب',                    tr:'Tevvâb' } },
  { ar:'ٱلْكَرِيم',  translit:'Kərim',  color:'#fbbf24', meaning:{ az:'Kərəmli',            en:'The Generous',               ru:'Щедрый',                ar:'الكريم',                    tr:'Kerîm' } },
]

// ── Bölmələr. Props: lang, l (HomePage LABELS), goTo, cv (hündürlük stili) ──

export function StartSection({ lang, l, goTo, cv }) {
  const L = pickL(lang)
  return (
    <section className="ui-section ui-section--tight hp-start ui-cv" style={cv} aria-labelledby="hp-start-ttl">
      <div className="ui-container">
        <div className="ui-section-head" data-anim="blur">
          <span className="ui-eyebrow">{l.startEy}</span>
          <h2 id="hp-start-ttl" className="ui-title">{l.startTitle}</h2>
          <p className="ui-lead">{l.startSub}</p>
        </div>
        <ol className="ui-steps ui-steps--row hp-steps" data-anim-stagger="90" data-anim="rise">
          {START.map((s, i) => (
            <li key={s.page} className="ui-step">
              <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
              <div className="ui-step__body">
                <h3 className="ui-step__title">
                  <a className="hp-step-link" href={pathFor(s.page, lang)} onClick={(e) => { if (plainClick(e)) { e.preventDefault(); goTo(s.page) } }}>
                    {L(s.title)}
                    <Icon name="arrow" size={16} className="ui-flip-rtl" />
                  </a>
                </h3>
                <p className="ui-step__text">{L(s.text)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function FeatsSection({ lang, l, goTo, cv }) {
  const L = pickL(lang)
  const lk = lang
  const isAr = lk === 'ar'
  const stats = [
    {num:114,  s:'',  icon:'quran', l:{az:'Quran surəsi',  en:'Quran Surahs',   ru:'Сур Корана',    tr:'Sure',         ar:'سورة'}},
    {num:6236, s:'',  icon:'mushaf', l:{az:'Quran ayəsi',   en:'Quran Verses',   ru:'Аятов Корана',  tr:'Ayet',         ar:'آية'}},
    // Təkrarsız 1255 hədis — "1100+" (bax: data/siteStats.js)
    {num:HADITH_COUNT, s:'+', icon:'hadith', l:{az:'Hədis',  en:'Hadiths',        ru:'Хадисов',       tr:'Hadis',        ar:'حديث'}},
    {num:99,   s:'',  icon:'names', l:{az:"Allahın adı",   en:"Names of Allah", ru:'Имён Аллаха',   tr:"Allah'ın İsmi",ar:'اسمًا لله'}},
    {num:50,   s:'',  icon:'globe', l:{az:'Dil',            en:'Languages',      ru:'Языков',        tr:'Dil',          ar:'لغات'}},
    {num:100,  s:'%', icon:'gift', l:{az:'Pulsuz',         en:'Free',           ru:'Бесплатно',     tr:'Ücretsiz',     ar:'مجاناً'}},
  ]
  return (
    <section className="ui-section ui-section--tight hp-feats ui-cv" style={cv} aria-labelledby="hp-stats-ttl">
      <div className="ui-container hp-qs">
        <div className="hp-bento-quran" data-anim="zoom">
          <div className="ui-pattern hp-bq-pattern" aria-hidden="true" />
          <div className="hp-bq-top">
            <span className="ui-icon-tile ui-icon-tile--lg hp-bq-ic" aria-hidden="true"><Icon name="quran" /></span>
            <span className="hp-bq-ttl">{L(FEATURES[0].title)}</span>
            <span className="hp-bq-desc">{L(FEATURES[0].desc)}</span>
          </div>
          <div className="hp-qban-l">
            <div className="hp-qban-ar ui-arabic" lang="ar" dir="rtl" data-anim="ink" data-anim-delay="250">إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ</div>
            {/* Ərəb dilində yalnız istinad — tərcümə ayənin təkrarı olardı.
                İstinad bölünmür ("— Hicr" / "9" ayrı sətirdə qalmasın) */}
            <div className="hp-qban-tr">
              {!isAr && <>{L(QBAN_TR)}{' '}</>}
              <span className="hp-qban-ref">— {L(QBAN_REF)}</span>
            </div>
          </div>
          <div className="hp-qban-r">
            <button type="button" className="ui-btn ui-btn--inverse" onClick={()=>goTo('quran')}>
              {l.btnQuran}
              <Icon name="arrow" size={18} className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
            </button>
            <Suspense fallback={null}><KhatmPulse lang={lang} onNavigate={goTo} /></Suspense>
          </div>
        </div>

        <div className="hp-stats-col">
          <div className="hp-stats-hd" data-reveal>
            <span className="ui-eyebrow">{l.statsEy}</span>
            <h2 id="hp-stats-ttl" className="ui-title ui-title--sm">{l.statsTitle}</h2>
          </div>
          <div className="ui-stats hp-stats-grid" data-anim-stagger="70" data-anim="blur">
            {stats.map((s, i) => (
              <StatTile key={i} icon={s.icon} label={L(s.l)} value={<NumberTicker value={s.num} lang={lang} delay={i * 0.06} />} unit={s.s || undefined} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function TawheedSection({ lang, cv }) {
  const L = pickL(lang)
  const lk = lang
  const isAr = lk === 'ar'
  const [activeTW, setActiveTW] = useState(0)
  const twPillar = TAWHEED_PILLARS[activeTW]
  return (
    <section className="hp-tw ui-cv" style={cv}>
      {/* v2: tünd zümrüd "inverse" bölmə + incə xatəm naxışı (ui.css) */}
      <div className="ui-pattern hp-tw-pattern" aria-hidden="true" />
      <div className="hp-sec-in">

        <div className="hp-sec-hd" data-reveal>
          <div className="ui-eyebrow hp-tw-ey">{lk==='az'?'İslamın əsası':lk==='ru'?'Основа ислама':lk==='ar'?'أساس الإسلام':lk==='tr'?'İslam\'ın Temeli':'Foundation of Islam'}</div>
          <h2 className="ui-title hp-sec-ttl hp-tw-ttl">
            {lk==='az'?'Tövhid — Allahın birliyi':lk==='ru'?'Таухид — Единство Аллаха':lk==='ar'?'التوحيد — وحدانية الله':lk==='tr'?'Tevhid — Allah\'ın Birliği':'Tawheed — The Oneness of Allah'}
          </h2>
          <p className="hp-sec-sub">
            {lk==='az'?'Tövhid İslamın qəlbi və əsasıdır. O, Allahın yalnız bir olduğunu, heç bir şərikin, mislin, nəzirin olmadığını elan edir. Bütün peyğəmbərlər bu dəvətlə gəlmişdir.':
             lk==='ru'?'Таухид — сердце и основа ислама. Он утверждает, что Аллах один, без сотоварищей, подобных или равных. Все пророки пришли с этим призывом.':
             lk==='ar'?'التوحيد هو قلب الإسلام وأساسه. يُعلن أن الله واحد لا شريك له ولا مثيل ولا نظير. جاء بهذه الدعوة جميع الأنبياء والمرسلون.':
             lk==='tr'?'Tevhid İslam\'ın kalbi ve temelidir. Allah\'ın tek olduğunu, ortağı, benzeri ve dengi olmadığını ilan eder. Tüm peygamberler bu çağrıyla geldi.':
             'Tawheed is the heart and foundation of Islam. It proclaims that Allah is One — without partners, equals, or rivals. All prophets came with this call.'}
          </p>
        </div>

        {/* Kalima */}
        <div className="hp-kalima" data-reveal="scale">
          <div className="hp-kal-ar" lang="ar" dir="rtl" data-anim="ink" data-anim-delay="200">لَا إِلَهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ</div>
          {!isAr && (
            <div className="hp-kal-tr">
              {lk==='az'?'"Allahdan başqa ilah yoxdur, Muhəmməd Allahın elçisidir"':
               lk==='ru'?'"Нет бога, кроме Аллаха; Мухаммад — Посланник Аллаха"':
               lk==='tr'?'"Allah\'tan başka ilah yoktur; Muhammed Allah\'ın elçisidir"':
               '"There is no god but Allah; Muhammad is the Messenger of Allah"'}
            </div>
          )}
          <div className="hp-kal-glow" aria-hidden="true"/>
        </div>

        {/* Üç növ — sekmələr. Ərəb dilində ad sətri ərəbcə başlığın təkrarıdır — gizlənir.
            Telefonda şaquli seqment idarəsidir: seçilmiş sətrin altındakı ağ
            "hap" (.hp-tw-thumb) yumşaq sürüşür (yalnız transform). */}
        <div className="hp-tw-tabs" data-reveal style={{'--tw-i':activeTW}}>
          <span className="hp-tw-thumb" aria-hidden="true" />
          {TAWHEED_PILLARS.map((p,i)=>(
            <button type="button" key={p.key} className={`hp-tw-tab ${activeTW===i?'hp-tw-tab--on':''}`}
              aria-pressed={activeTW===i}
              onClick={()=>{ if (activeTW!==i) haptic(); setActiveTW(i) }}>
              <span className="hp-twtab-num" aria-hidden="true">{i+1}</span>
              <span className="hp-twtab-text">
                <span className="hp-twtab-ar" lang="ar" dir="rtl">{p.ar}</span>
                {!isAr && <span className="hp-twtab-nm">{p[lk]||p.en}</span>}
              </span>
            </button>
          ))}
        </div>

        {/* Seçilmiş növün paneli */}
        <div className="hp-tw-panel">
          <div key={twPillar.key} className="hp-twp-content">
            {/* Nişan (sıra) və ərəbcə ad bir sətirdə — əvvəl nişan tək sətirdə
                qalıb üstdə boş yer yaradırdı */}
            <div className="hp-twp-head">
              <span className="hp-twp-badge" aria-hidden="true">{activeTW+1}</span>
              <h3 className="hp-twp-ar" lang="ar" dir="rtl">{twPillar.ar}</h3>
            </div>
            {!isAr && <h4 className="hp-twp-nm">{twPillar[lk]||twPillar.en}</h4>}
            <p className="hp-twp-desc">{L(twPillar.desc)}</p>
            <div className="hp-twp-ayah">
              <div className="hp-twp-a-ar" lang="ar" dir="rtl">{twPillar.ayah}</div>
              <div className="hp-twp-a-ref">— {L(twPillar.ayahRef)}</div>
            </div>
          </div>
        </div>

        {/* Faktlar — telefonda üfüqi sürüşən sıra */}
        <div className="hp-tw-facts" data-reveal="stagger" tabIndex={0} role="region" aria-label={L(TW_REGION.facts)}>
          {TAWHEED_FACTS.map((f,i)=>(
            <div key={i} className="hp-tw-fact">
              <div className="hp-twf-ar" lang="ar" dir="rtl">{f.ar}</div>
              <div className="hp-twf-tr">{isAr ? f.arExpl : L(f)}</div>
            </div>
          ))}
        </div>

        {/* Kartlar — telefonda üfüqi sürüşən sıra */}
        <div className="hp-tw-info" data-reveal="stagger" tabIndex={0} role="region" aria-label={L(TW_REGION.info)}>
          <div className="hp-twi-card">
            <span className="hp-twi-ic ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="names" /></span>
            <h4>{lk==='az'?'Niyə Tövhid?':lk==='ru'?'Почему Таухид?':lk==='ar'?'لماذا التوحيد؟':lk==='tr'?'Neden Tevhid?':'Why Tawheed?'}</h4>
            <p>{lk==='az'?'Tövhid bütün peyğəmbərlərin — Nuh, İbrahim, Musa, İsa, Muhəmməd (s.a.s) — dəvət etdiyi əsas prinsipdir. Allah buyurur: "Biz hər ümmətə: Allaha ibadət edin, tağutdan çəkinin — deyə peyğəmbər göndərdik." (Nəhl 36)':
                lk==='ru'?'Таухид — основной принцип, к которому призывали все пророки: Нух, Ибрахим, Муса, Иса, Мухаммад (мир им). Аллах говорит: "Мы отправили к каждому народу посланника с велением: поклоняйтесь Аллаху и избегайте тагута." (Нахль 36)':
                lk==='ar'?'التوحيد هو المبدأ الأساسي الذي دعا إليه جميع الأنبياء — نوح وإبراهيم وموسى وعيسى ومحمد ﷺ. يقول الله: "وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ." (النحل 36)':
                lk==='tr'?'Tevhid, tüm peygamberlerin — Nuh, İbrahim, Musa, İsa, Muhammed (s.a.s) — davet ettiği temel ilkedir. Allah buyurur: "Her ümmete Allah\'a ibadet edin, tağuttan kaçının diye peygamber gönderdik." (Nahl 36)':
                'Tawheed is the core principle all prophets called to — Noah, Abraham, Moses, Jesus, Muhammad (peace be upon them). Allah says: "We sent to every nation a messenger: worship Allah and avoid false deities." (An-Nahl 36)'}</p>
          </div>
          <div className="hp-twi-card">
            <span className="hp-twi-ic ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="shield" /></span>
            <h4>{lk==='az'?'Şirkdən uzaq ol':lk==='ru'?'Избегай ширка':lk==='ar'?'ابتعد عن الشرك':lk==='tr'?'Şirkten Uzak Dur':'Avoid Shirk'}</h4>
            <p>{lk==='az'?'Şirk — Allaha ortaq qoşmaqdır. Bu ən böyük günahdır. Allah buyurur: "Həqiqətən, Allah Özünə şərik qoşulmasını bağışlamaz, bundan başqasını istədiyinə bağışlar." (Nisa 48) Şirk ibadəti batil edir, bağışlanmaz.':
                lk==='ru'?'Ширк — придание сотоварищей Аллаху. Это величайший грех. Аллах говорит: "Аллах не прощает придания Ему сотоварищей, но прощает всё остальное, кому пожелает." (Ниса 48) Ширк обнуляет поклонение и не прощается.':
                lk==='ar'?'الشرك هو إشراك شيء مع الله. وهو أعظم الذنوب. قال الله تعالى: "إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَاءُ." (النساء 48) الشرك يحبط العبادة ولا يُغفر.':
                lk==='tr'?'Şirk, Allah\'a ortak koşmaktır. En büyük günahtır. Allah buyurur: "Allah kendisine şirk koşulmasını bağışlamaz; bunun dışındakini dilediği kimse için bağışlar." (Nisa 48) Şirk ibadeti iptal eder, affedilmez.':
                'Shirk is associating partners with Allah — the greatest sin. Allah says: "Allah does not forgive that partners be associated with Him, but He forgives all else to whom He wills." (An-Nisa 48) Shirk nullifies worship and is unforgivable.'}</p>
          </div>
          <div className="hp-twi-card">
            <span className="hp-twi-ic ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="donate" /></span>
            <h4>{lk==='az'?'Tövhidin meyvəsi':lk==='ru'?'Плоды Таухида':lk==='ar'?'ثمار التوحيد':lk==='tr'?'Tevhidin Meyvesi':'Fruits of Tawheed'}</h4>
            <p>{lk==='az'?'Tövhid qəlbə rahatlıq, həyata mənalılıq, günahlara kəffarə, cənnətə giriş açarı verir. Allah buyurur: "İman gətirib imanlarını zülmlə qarışdırmayanlar — əmin-amanlıq onlar üçündür və onlar doğru yoldadırlar." (Ənam 82)':
                lk==='ru'?'Таухид дарует покой сердцу, смысл жизни, искупление грехов и ключ к раю. Аллах говорит: "Те, кто не смешивает своей веры с несправедливостью, — для них безопасность, и они на верном пути." (Аль-Анам 82)':
                lk==='ar'?'التوحيد يمنح الطمأنينة للقلب والمعنى للحياة وكفارة للذنوب ومفتاحاً للجنة. قال الله: "الَّذِينَ آمَنُوا وَلَمْ يَلْبِسُوا إِيمَانَهُم بِظُلْمٍ أُولَٰئِكَ لَهُمُ الْأَمْنُ وَهُم مُّهْتَدُونَ." (الأنعام 82)':
                lk==='tr'?'Tevhid kalbe huzur, hayata anlam, günahlara kefaret ve cennete giriş anahtarı verir. Allah buyurur: "İman edip imanlarını zulümle (şirk) karıştırmayanlar — güvende olanlar onlardır ve onlar doğru yoldadırlar." (En\'am 82)':
                'Tawheed grants peace of heart, meaning in life, expiation of sins, and the key to Paradise. Allah says: "Those who believe and do not mix their faith with wrongdoing — for them is security, and they are rightly guided." (Al-An\'am 82)'}</p>
          </div>
        </div>

      </div>
    </section>
  )
}

export function NamesSection({ lang, goTo, cv }) {
  const lk = lang
  const isAr = lk === 'ar'
  return (
    <section className="hp-names ui-cv" style={cv}>
      <div className="hp-sec-in">
        <div className="hp-sec-hd" data-reveal>
          <div className="ui-eyebrow"><span lang="ar" dir="rtl" className="ui-arabic hp-eyebrow-ar">أسماء الله الحسنى</span></div>
          <h2 className="ui-title hp-sec-ttl">{lk==='az'?"Allahın 99 gözəl adı":lk==='ru'?'99 Прекрасных Имён Аллаха':lk==='ar'?'أسماء الله الحسنى':lk==='tr'?"Allah'ın 99 Güzel İsmi":'99 Beautiful Names of Allah'}</h2>
          <p className="hp-sec-sub">
            {lk==='az'?'"Allahın doxsan doqquz adı var; kim onları saya bilsə, cənnətə girər." — (Buxari)':
             lk==='ru'?'"У Аллаха девяносто девять имён; кто их перечислит, войдёт в рай." — (Бухари)':
             lk==='ar'?'"إن لله تسعة وتسعين اسماً من أحصاها دخل الجنة." — (البخاري)':
             lk==='tr'?'"Allah\'ın doksan dokuz ismi vardır; bunları bilen cennete girer." — (Buhari)':
             '"Allah has ninety-nine names; whoever enumerates them will enter Paradise." — (Bukhari)'}
          </p>
        </div>
        {/* Transliterasiya azərbaycancadır — yalnız az-da; ərəb dilində yalnız
            adın özü ("məna" sahəsi orada adın hərəkəsiz təkrarıdır) */}
        <div className={`hp-names-grid${isAr ? ' hp-names-grid--ar' : ''}`} data-anim-stagger="50" data-anim="zoom">
          {ALLAH_NAMES.map((n,i)=>(
            <div key={i} className="hp-name">
              <div className="hp-name-ar" lang="ar" dir="rtl">{n.ar}</div>
              {lang === 'az' && <div className="hp-name-az">{n.translit}</div>}
              {!isAr && <div className="hp-name-en">{n.meaning?.[lk] || n.meaning?.en}</div>}
            </div>
          ))}
        </div>
        <div className="hp-names-more">
          <button type="button" className="ui-btn ui-btn--secondary" onClick={()=>goTo('names')}>
            {lk==='az'?'Bütün 99 adı gör':lk==='ru'?'Все 99 имён':lk==='ar'?'عرض جميع الأسماء':lk==='tr'?'Tüm 99 İsmi Gör':'See All 99 Names'}
            <Icon name="arrow" size={18} className="ui-btn__icon ui-flip-rtl" />
          </button>
        </div>
      </div>
    </section>
  )
}

export function CtaSection({ l, goTo, cv }) {
  // Bildiriş ayarları panelini aç (FloatingDock / köhnə vidjet bu hadisəni dinləyir)
  const openNotifications = () => window.dispatchEvent(new CustomEvent('open-notifications'))
  return (
    <section className="vx-cta-wrap ui-cv" style={cv}>
      <div className="vx-cta vx-cta--aurora" data-spotlight="">
        <div className="ui-pattern" aria-hidden="true" />
        <div className="vx-cta__float" aria-hidden="true">
          <span className="ui-icon-tile"><Icon name="quran" /></span>
          <span className="ui-icon-tile ui-icon-tile--accent"><Icon name="bell" /></span>
          <span className="ui-icon-tile ui-icon-tile--accent"><Icon name="prayer" /></span>
          <span className="ui-icon-tile"><Icon name="hadith" /></span>
        </div>
        <div className="vx-cta__ar" lang="ar" dir="rtl">{BRAND.arabicMotto}</div>
        <h2 className="vx-cta__title">{l.ctaTitle}</h2>
        <p className="vx-cta__text">{l.ctaDesc}</p>
        <div className="vx-cta__btns">
          <button type="button" className="ui-btn ui-btn--inverse ui-btn--lg hp-cta-main" onClick={()=>goTo('prayer')}><Icon name="prayer" className="ui-btn__icon" /> {l.ctaTimes}</button>
          <button type="button" className="ui-btn ui-btn--inverse-ghost ui-btn--lg" onClick={openNotifications}><Icon name="bell" className="ui-btn__icon" /> {l.ctaNotif}</button>
        </div>
        <div className="vx-cta__trust">
          <span><Icon name="shield" size={16} /> {l.adFree}</span>
          <span><Icon name="check" size={16} /> {l.free}</span>
          <span><Icon name="globe" size={16} /> {l.langs}</span>
        </div>
      </div>
    </section>
  )
}
