// ═══════════════════════════════════════════════════════
// /sharia-units — Şəri ölçü vahidləri çeviricisi
//
// Sa', mudd, dinar, dirhəm, misqal, üqiyyə, qızıl/gümüş nisabı, zira', mil, fərsəx, bərid və səfər
// məsafəsi → metrik. Dəyərlər data/shariaUnits-dəndir: saytın öz məlumatı (zəkat/fitrə, kəffarə,
// "bir mudd su", fiqh və səfər dərsləri), ondan sadə hesab və ya — saytda yoxdursa — aralıqlı alim
// təxmini; hər sətirdə hansı olduğu yazılır. Vizual müqayisələr (düyü paketi, su butulkası, piyada /
// maşınla vaxt) yalnız TƏXMİNİDİR və belə etiketlənir.
// Rəqəm formatı öz funksiyamızladır (Intl yox): prerender (Node ICU) və brauzer eyni mətni versin.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import RelatedLinks from '../components/RelatedLinks'
import { isPlainClick } from '../components/PageLink'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { parseAmount } from '../utils/parseAmount'
import { UNITS, unitById, convert, comparison, fmtNum, WALK_KMH, CAR_KMH } from '../data/shariaUnits'
import '../styles/ShariaUnitsPage.css'

const T = {
  az: {
    title: 'Şəri ölçü vahidləri',
    lead: 'Fiqh kitablarındakı ölçüləri bugünkü vahidlərlə görün: sa\', müdd, dinar, dirhəm, misqal, üqiyyə, nisab, zira\', mil, fərsəx və bərid.',
    how: 'Dəyərlər saytın zəkat, fitrə, kəffarə hesablayıcılarından və dərslərindən götürülüb; saytda olmayan yalnız aralıqlı alim təxmini kimi göstərilir.',
    unit: 'Vahid', qty: 'Miqdar', result: 'Nəticə', range: (a, b) => `aralıq: ${a} – ${b}`,
    of: { food: 'əsas qida', water: 'su', gold: 'qızıl', silver: 'gümüş' },
    basis: { site: 'Saytın məlumatı', derived: 'Saytın məlumatından hesablanıb', estimate: 'Alim təxmini (aralıq)' },
    rangeEst: 'Aralıq — alim təxmini', approx: 'Təxmini müqayisə',
    cmp: {
      rice: (n) => `≈ ${n} × 1 kq-lıq düyü və ya xurma paketi`,
      bottle: (n) => `≈ ${n} × 0,5 L-lik su butulkası`,
      water: (n) => `Çəkisi ≈ ${n} mL suyun çəkisi qədərdir`,
      forearm: (n) => `≈ ${n} × qol uzunluğu (dirsəkdən barmaq ucuna)`,
      walk: (d) => `Piyada ≈ ${d} (${WALK_KMH} km/saat)`,
      car: (d) => `Maşınla ≈ ${d} (${CAR_KMH} km/saat)`,
    },
    dur: (h, m) => (h ? `${h} saat ${m} dəq` : `${m} dəq`),
    bad: 'Düzgün miqdar yazın (məs. 1 və ya 2,5).',
    open: 'Əlaqəli bölmə', table: 'Bütün vahidlər (1 vahid)', colUnit: 'Vahid', colMetric: 'Metrik', colBasis: 'Əsas',
    caution: 'Rəqəmlər təxminidir. İbadətdə (fitrə, kəffarə, nisab) etibar etdiyiniz alimlərin göstərdiyi miqdara əməl edin.',
    related: 'Hesablayıcılar və dərslər',
    m: { kg: 'kq', g: 'q', L: 'L', cm: 'sm', km: 'km' },
    names: { saa: 'Sa\'', mudd: 'Müdd', dinar: 'Dinar', dirham: 'Dirhəm', mithqal: 'Misqal', uqiyah: 'Üqiyyə', nisabGold: 'Qızıl nisabı', nisabSilver: 'Gümüş nisabı', dhira: 'Zira\' (arşın)', mil: 'Mil (ərəb mili)', farsakh: 'Fərsəx', barid: 'Bərid', travel: 'Səfər məsafəsi (qəsr)' },
    notes: {
      saa: 'Saytın fitrə hesablayıcısı hər sa\' üçün ≈ 3 kq əsas qida götürür; kəffarə hesablayıcısında yarım sa\' ≈ 1,5 kq. Sa\' həcm ölçüsüdür (4 müdd), çəkisi qidaya görə dəyişir — təxminlər taxıla və ölçüyə görə təxminən 2 kq (Hicaz sa\'ı, buğda) ilə təxminən 3,3 kq (Hənəfi məzhəbinin işlətdiyi İraq sa\'ı) arasında dəyişir.',
      mudd: 'Saytdakı "Bir müdd su" kartında olduğu kimi ≈ 0,5–0,75 L su (Peyğəmbər ﷺ bir müdd su ilə dəstəmaz alırdı — Müslim 325 (Heyz kitabı, № 51)). Müdd sa\'ın dörddə biridir: saytın sa\' dəyəri ilə ≈ 0,75 kq qida.',
      dinar: '1 dinar = 1 misqal qızıl ≈ 4,25 q (20 misqal ≈ 85 q — qızıl nisabı).',
      dirham: '200 dirhəm = 140 misqal gümüş ≈ 595 q (gümüş nisabı), deməli 1 dirhəm ≈ 2,975 q.',
      mithqal: 'Saytın fiqh dərsi: 20 misqal qızıl ≈ 85 q, deməli 1 misqal ≈ 4,25 q.',
      uqiyah: '1 üqiyyə = 40 dirhəm ≈ 119 q gümüş; 5 üqiyyə = 200 dirhəm — gümüş nisabı.',
      nisabGold: '85 q qızıl (20 misqal) — saytın zəkat hesablayıcısı (Daimi Komitə, Fətvalar 9/254).',
      nisabSilver: '595 q gümüş (200 dirhəm, 140 misqal) — saytın zəkat hesablayıcısı.',
      dhira: 'Saytın məlumatında yoxdur — alim təxmini. Zira\' dirsəkdən barmaq ucuna qədər olan uzunluqdur; müasir təxminlər ≈ 46–50 sm; dövrə və yerə görə dəyişib.',
      mil: 'Saytın səfər dərsindən: 48 mil ≈ 80 km (bəzi alimlərə görə ≈ 83 km), deməli 1 mil ≈ 1,67–1,73 km. Bu, köhnə ərəb milidir, ingilis mili (1,609 km) deyil.',
      farsakh: '1 fərsəx = 3 mil ≈ 5–5,2 km.',
      barid: '1 bərid = 4 fərsəx = 12 mil ≈ 20–20,75 km.',
      travel: 'Cümhura görə qəsr məsafəsi: 48 mil = 16 fərsəx = 4 bərid ≈ 80 km (bəzi alimlərə görə ≈ 83 km). İbn Teymiyyə səfəri müəyyən məsafəyə yox, örfə bağlamışdır — müsafir namazı dərsinə baxın. Məzhəblər məsafəni fərqli ölçür; alimlər ixtilaf edir.',
    },
  },
  en: {
    title: 'Sharia units converter',
    lead: 'See the measures of the fiqh books in today’s units: sa\', mudd, dinar, dirham, mithqal, uqiyah, nisab, dhira\', mile, farsakh and barid.',
    how: 'Values come from the site’s zakat, fitrah and kaffarah calculators and lessons; anything not in the site’s data is shown only as a scholarly estimate with a range.',
    unit: 'Unit', qty: 'Amount', result: 'Result', range: (a, b) => `range: ${a} – ${b}`,
    of: { food: 'staple food', water: 'water', gold: 'gold', silver: 'silver' },
    basis: { site: 'From the site’s data', derived: 'Calculated from the site’s data', estimate: 'Scholarly estimate (range)' },
    rangeEst: 'Range — scholarly estimate', approx: 'Approximate comparison',
    cmp: {
      rice: (n) => `≈ ${n} × a 1 kg packet of rice or dates`,
      bottle: (n) => `≈ ${n} × a 0.5 L bottle of water`,
      water: (n) => `As heavy as ≈ ${n} mL of water`,
      forearm: (n) => `≈ ${n} × a forearm (elbow to fingertips)`,
      walk: (d) => `On foot ≈ ${d} (${WALK_KMH} km/h)`,
      car: (d) => `By car ≈ ${d} (${CAR_KMH} km/h)`,
    },
    dur: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
    bad: 'Enter a valid amount (e.g. 1 or 2.5).',
    open: 'Related section', table: 'All units (1 unit each)', colUnit: 'Unit', colMetric: 'Metric', colBasis: 'Basis',
    caution: 'Figures are approximate. For worship (fitrah, kaffarah, nisab) follow the amounts your trusted scholars give.',
    related: 'Calculators and lessons',
    m: { kg: 'kg', g: 'g', L: 'L', cm: 'cm', km: 'km' },
    names: { saa: 'Sa\'', mudd: 'Mudd', dinar: 'Dinar', dirham: 'Dirham', mithqal: 'Mithqal', uqiyah: 'Uqiyah', nisabGold: 'Gold nisab', nisabSilver: 'Silver nisab', dhira: 'Dhira\' (cubit)', mil: 'Mile (Arabic mile)', farsakh: 'Farsakh', barid: 'Barid', travel: 'Travel distance (shortening)' },
    notes: {
      saa: 'The site’s fitrah calculator uses ≈ 3 kg of staple food per sa\'; the kaffarah calculator uses half a sa\' ≈ 1.5 kg. A sa\' is a measure of volume (4 mudd), so its weight depends on the food — estimates range from about 2 kg (Hijazi sa\', wheat) to about 3.3 kg (the Iraqi sa\' used by the Hanafi school), depending on the grain and the measure.',
      mudd: 'About 0.5–0.75 L of water, as on the site’s “One mudd of water” card (the Prophet ﷺ made wudu with a mudd of water — Muslim 325 (Book of Hayd, no. 51)). A mudd is a quarter of a sa\': ≈ 0.75 kg of food with the site’s sa\'.',
      dinar: '1 dinar = 1 mithqal of gold ≈ 4.25 g (20 mithqals ≈ 85 g — the gold nisab).',
      dirham: '200 dirhams = 140 mithqals of silver ≈ 595 g (the silver nisab), so 1 dirham ≈ 2.975 g.',
      mithqal: 'The site’s fiqh lesson: 20 mithqals of gold ≈ 85 g, so 1 mithqal ≈ 4.25 g.',
      uqiyah: '1 uqiyah = 40 dirhams ≈ 119 g of silver; 5 uqiyah = 200 dirhams — the silver nisab.',
      nisabGold: '85 g of gold (20 mithqals) — the site’s zakat calculator (Permanent Committee, Fatawa 9/254).',
      nisabSilver: '595 g of silver (200 dirhams, 140 mithqals) — the site’s zakat calculator.',
      dhira: 'Not in the site’s data — a scholarly estimate. The dhira\' is the length from the elbow to the fingertips; modern estimates are ≈ 46–50 cm; it varied by period and place.',
      mil: 'From the site’s travel lesson: 48 miles ≈ 80 km (some scholars ≈ 83 km), so 1 mile ≈ 1.67–1.73 km. This is the old Arabic mile, not the English mile (1.609 km).',
      farsakh: '1 farsakh = 3 miles ≈ 5–5.2 km.',
      barid: '1 barid = 4 farsakh = 12 miles ≈ 20–20.75 km.',
      travel: 'Shortening distance according to the majority: 48 miles = 16 farsakh = 4 barid ≈ 80 km (some scholars ≈ 83 km). Ibn Taymiyyah tied travel to custom rather than a fixed distance — see the lesson on the traveller’s prayer. The schools measure it differently; scholars differ.',
    },
  },
  ru: {
    title: 'Шариатские меры',
    lead: 'Меры из книг фикха в современных единицах: саа, мудд, динар, дирхам, мискаль, укия, нисаб, локоть (зира), миля, фарсах и барид.',
    how: 'Значения взяты из калькуляторов закята, закят аль-фитра и каффары и из уроков сайта; то, чего нет в данных сайта, показано только как оценка учёных с диапазоном.',
    unit: 'Мера', qty: 'Количество', result: 'Результат', range: (a, b) => `диапазон: ${a} – ${b}`,
    of: { food: 'основной еды', water: 'воды', gold: 'золота', silver: 'серебра' },
    basis: { site: 'Данные сайта', derived: 'Рассчитано по данным сайта', estimate: 'Оценка учёных (диапазон)' },
    rangeEst: 'Диапазон — оценка учёных', approx: 'Примерное сравнение',
    cmp: {
      rice: (n) => `≈ ${n} × пакет риса или фиников по 1 кг`,
      bottle: (n) => `≈ ${n} × бутылка воды 0,5 л`,
      water: (n) => `Весит примерно как ${n} мл воды`,
      forearm: (n) => `≈ ${n} × длина предплечья (от локтя до кончиков пальцев)`,
      walk: (d) => `Пешком ≈ ${d} (${WALK_KMH} км/ч)`,
      car: (d) => `На машине ≈ ${d} (${CAR_KMH} км/ч)`,
    },
    dur: (h, m) => (h ? `${h} ч ${m} мин` : `${m} мин`),
    bad: 'Введите правильное количество (например, 1 или 2,5).',
    open: 'Связанный раздел', table: 'Все меры (по 1 единице)', colUnit: 'Мера', colMetric: 'Метрически', colBasis: 'Основа',
    caution: 'Цифры приблизительные. В поклонении (закят аль-фитр, каффара, нисаб) следуйте мерам, которые дают учёные, которым вы доверяете.',
    related: 'Калькуляторы и уроки',
    m: { kg: 'кг', g: 'г', L: 'л', cm: 'см', km: 'км' },
    names: { saa: 'Саа', mudd: 'Мудд', dinar: 'Динар', dirham: 'Дирхам', mithqal: 'Мискаль', uqiyah: 'Укия', nisabGold: 'Нисаб золота', nisabSilver: 'Нисаб серебра', dhira: 'Зира (локоть)', mil: 'Миля (арабская)', farsakh: 'Фарсах', barid: 'Барид', travel: 'Расстояние поездки (сокращение)' },
    notes: {
      saa: 'Калькулятор закят аль-фитра на сайте берёт ≈ 3 кг основной еды на один саа; калькулятор каффары — половину саа ≈ 1,5 кг. Саа — мера объёма (4 мудда), поэтому вес зависит от еды: оценки колеблются от около 2 кг (хиджазский саа, пшеница) до около 3,3 кг (иракский саа, которым пользуется ханафитский мазхаб) в зависимости от зерна и меры.',
      mudd: 'Около 0,5–0,75 л воды, как в карточке «Один мудд воды» на сайте (Пророк ﷺ совершал омовение одним муддом воды — Муслим 325 (Книга о хайде, № 51)). Мудд — четверть саа: ≈ 0,75 кг еды при значении саа на сайте.',
      dinar: '1 динар = 1 мискаль золота ≈ 4,25 г (20 мискалей ≈ 85 г — нисаб золота).',
      dirham: '200 дирхамов = 140 мискалей серебра ≈ 595 г (нисаб серебра), значит 1 дирхам ≈ 2,975 г.',
      mithqal: 'Урок фикха на сайте: 20 мискалей золота ≈ 85 г, значит 1 мискаль ≈ 4,25 г.',
      uqiyah: '1 укия = 40 дирхамов ≈ 119 г серебра; 5 укий = 200 дирхамов — нисаб серебра.',
      nisabGold: '85 г золота (20 мискалей) — калькулятор закята на сайте (Постоянный комитет, Фетвы 9/254).',
      nisabSilver: '595 г серебра (200 дирхамов, 140 мискалей) — калькулятор закята на сайте.',
      dhira: 'В данных сайта нет — оценка учёных. Зира — длина от локтя до кончиков пальцев; современные оценки ≈ 46–50 см; она менялась в зависимости от эпохи и места.',
      mil: 'Из урока о поездке: 48 миль ≈ 80 км (по мнению некоторых учёных ≈ 83 км), значит 1 миля ≈ 1,67–1,73 км. Это старая арабская миля, а не английская (1,609 км).',
      farsakh: '1 фарсах = 3 мили ≈ 5–5,2 км.',
      barid: '1 барид = 4 фарсаха = 12 миль ≈ 20–20,75 км.',
      travel: 'Расстояние для сокращения по мнению большинства: 48 миль = 16 фарсахов = 4 барида ≈ 80 км (по мнению некоторых ≈ 83 км). Ибн Таймия связывал поездку с обычаем, а не с точным расстоянием — см. урок о намазе путника. Мазхабы измеряют расстояние по-разному; учёные расходятся.',
    },
  },
  ar: {
    title: 'المقادير الشرعية',
    lead: 'اعرف مقادير كتب الفقه بالوحدات الحديثة: الصاع والمد والدينار والدرهم والمثقال والأوقية والنصاب والذراع والميل والفرسخ والبريد.',
    how: 'القيم مأخوذة من حاسبات الزكاة وزكاة الفطر والكفارة ودروس الموقع؛ وما ليس في بيانات الموقع يُعرض تقديرًا للعلماء مع مداه فقط.',
    unit: 'المقدار', qty: 'الكمية', result: 'النتيجة', range: (a, b) => `المدى: ${a} – ${b}`,
    of: { food: 'من القوت', water: 'من الماء', gold: 'من الذهب', silver: 'من الفضة' },
    basis: { site: 'من بيانات الموقع', derived: 'محسوب من بيانات الموقع', estimate: 'تقدير العلماء (مدى)' },
    rangeEst: 'المدى — تقدير العلماء', approx: 'مقارنة تقريبية',
    cmp: {
      rice: (n) => `≈ ${n} × كيس أرز أو تمر وزنه 1 كغ`,
      bottle: (n) => `≈ ${n} × قارورة ماء سعتها 0.5 لتر`,
      water: (n) => `وزنه نحو وزن ${n} مل من الماء`,
      forearm: (n) => `≈ ${n} × طول الذراع (من المرفق إلى أطراف الأصابع)`,
      walk: (d) => `مشيًا ≈ ${d} (${WALK_KMH} كم/ساعة)`,
      car: (d) => `بالسيارة ≈ ${d} (${CAR_KMH} كم/ساعة)`,
    },
    dur: (h, m) => (h ? `${h} س ${m} د` : `${m} د`),
    bad: 'اكتب كمية صحيحة (مثل 1 أو 2.5).',
    open: 'قسم ذو صلة', table: 'كل المقادير (لكل وحدة واحدة)', colUnit: 'المقدار', colMetric: 'بالوحدات الحديثة', colBasis: 'الأساس',
    caution: 'الأرقام تقريبية. وفي العبادات (زكاة الفطر، الكفارة، النصاب) اتبع المقادير التي يذكرها العلماء الذين تثق بهم.',
    related: 'الحاسبات والدروس',
    m: { kg: 'كغ', g: 'غ', L: 'لتر', cm: 'سم', km: 'كم' },
    names: { saa: 'الصاع', mudd: 'المُدّ', dinar: 'الدينار', dirham: 'الدرهم', mithqal: 'المثقال', uqiyah: 'الأوقية', nisabGold: 'نصاب الذهب', nisabSilver: 'نصاب الفضة', dhira: 'الذراع', mil: 'الميل (العربي)', farsakh: 'الفرسخ', barid: 'البريد', travel: 'مسافة القصر' },
    notes: {
      saa: 'حاسبة زكاة الفطر في الموقع تعتمد نحو 3 كغ من القوت للصاع، وحاسبة الكفارة نصف صاع ≈ 1.5 كغ. والصاع مكيال (4 أمداد) فيختلف وزنه باختلاف الطعام، وتتراوح التقديرات بين نحو 2 كغ (صاع أهل الحجاز، القمح) ونحو 3.3 كغ (الصاع العراقي الذي يعتمده الحنفية) بحسب الحَبّ والمكيال.',
      mudd: 'نحو 0.5–0.75 لتر من الماء كما في بطاقة «مُدّ من الماء» في الموقع (كان النبي ﷺ يتوضأ بالمد — مسلم 325 (كتاب الحيض، رقم 51)). والمد ربع الصاع: نحو 0.75 كغ من الطعام بقيمة الصاع في الموقع.',
      dinar: 'الدينار = مثقال من الذهب ≈ 4.25 غ (20 مثقالًا ≈ 85 غ — نصاب الذهب).',
      dirham: '200 درهم = 140 مثقالًا من الفضة ≈ 595 غ (نصاب الفضة)، فالدرهم ≈ 2.975 غ.',
      mithqal: 'درس الفقه في الموقع: 20 مثقالًا من الذهب ≈ 85 غ، فالمثقال ≈ 4.25 غ.',
      uqiyah: 'الأوقية = 40 درهمًا ≈ 119 غ من الفضة؛ وخمس أواق = 200 درهم — نصاب الفضة.',
      nisabGold: '85 غ من الذهب (20 مثقالًا) — حاسبة الزكاة في الموقع (اللجنة الدائمة، الفتاوى 9/254).',
      nisabSilver: '595 غ من الفضة (200 درهم، 140 مثقالًا) — حاسبة الزكاة في الموقع.',
      dhira: 'ليس في بيانات الموقع — تقدير للعلماء. الذراع ما بين المرفق وأطراف الأصابع، والتقديرات المعاصرة نحو 46–50 سم، وقد اختلفت باختلاف الزمان والمكان.',
      mil: 'من درس صلاة المسافر في الموقع: 48 ميلًا ≈ 80 كم (وعند بعض العلماء ≈ 83 كم)، فالميل ≈ 1.67–1.73 كم. وهو الميل العربي القديم لا الميل الإنجليزي (1.609 كم).',
      farsakh: 'الفرسخ = 3 أميال ≈ 5–5.2 كم.',
      barid: 'البريد = 4 فراسخ = 12 ميلًا ≈ 20–20.75 كم.',
      travel: 'مسافة القصر عند الجمهور: 48 ميلًا = 16 فرسخًا = 4 برد ≈ 80 كم (وعند بعضهم ≈ 83 كم). وربط ابن تيمية السفر بالعرف لا بمسافة محددة — انظر درس صلاة المسافر. وتقدّر المذاهب المسافة تقديرات مختلفة، وللعلماء في ذلك خلاف.',
    },
  },
  tr: {
    title: 'Şer’î ölçü birimleri',
    lead: 'Fıkıh kitaplarındaki ölçüleri bugünkü birimlerle görün: sâ, müd, dinar, dirhem, miskal, ukiyye, nisap, zira, mil, fersah ve berîd.',
    how: 'Değerler sitenin zekât, fıtır sadakası ve kefaret hesaplayıcılarından ve derslerinden alınmıştır; sitede olmayanlar yalnızca aralıklı âlim tahmini olarak gösterilir.',
    unit: 'Birim', qty: 'Miktar', result: 'Sonuç', range: (a, b) => `aralık: ${a} – ${b}`,
    of: { food: 'temel gıda', water: 'su', gold: 'altın', silver: 'gümüş' },
    basis: { site: 'Sitenin verisi', derived: 'Sitenin verisinden hesaplandı', estimate: 'Âlim tahmini (aralık)' },
    rangeEst: 'Aralık — âlim tahmini', approx: 'Yaklaşık karşılaştırma',
    cmp: {
      rice: (n) => `≈ ${n} × 1 kg’lık pirinç veya hurma paketi`,
      bottle: (n) => `≈ ${n} × 0,5 L’lik su şişesi`,
      water: (n) => `Ağırlığı ≈ ${n} mL suyun ağırlığı kadardır`,
      forearm: (n) => `≈ ${n} × kol boyu (dirsekten parmak uçlarına)`,
      walk: (d) => `Yürüyerek ≈ ${d} (${WALK_KMH} km/sa)`,
      car: (d) => `Arabayla ≈ ${d} (${CAR_KMH} km/sa)`,
    },
    dur: (h, m) => (h ? `${h} sa ${m} dk` : `${m} dk`),
    bad: 'Geçerli bir miktar yazın (örn. 1 veya 2,5).',
    open: 'İlgili bölüm', table: 'Tüm birimler (1 birim)', colUnit: 'Birim', colMetric: 'Metrik', colBasis: 'Dayanak',
    caution: 'Rakamlar yaklaşıktır. İbadette (fıtır sadakası, kefaret, nisap) güvendiğiniz âlimlerin bildirdiği miktara uyun.',
    related: 'Hesaplayıcılar ve dersler',
    m: { kg: 'kg', g: 'g', L: 'L', cm: 'cm', km: 'km' },
    names: { saa: 'Sâ', mudd: 'Müd', dinar: 'Altın dinar', dirham: 'Dirhem', mithqal: 'Miskal', uqiyah: 'Ukiyye', nisabGold: 'Altın nisabı', nisabSilver: 'Gümüş nisabı', dhira: 'Zira (arşın)', mil: 'Mil (Arap mili)', farsakh: 'Fersah', barid: 'Berîd', travel: 'Yolculuk mesafesi (kasr)' },
    notes: {
      saa: 'Sitenin fıtır sadakası hesaplayıcısı bir sâ için ≈ 3 kg temel gıda alır; kefaret hesaplayıcısında yarım sâ ≈ 1,5 kg. Sâ bir hacim ölçüsüdür (4 müd), ağırlığı gıdaya göre değişir — tahminler, hububata ve ölçüye göre yaklaşık 2 kg (Hicaz sâ‘ı, buğday) ile yaklaşık 3,3 kg (Hanefî mezhebinin kullandığı Irak sâ‘ı) arasında değişir.',
      mudd: 'Sitedeki “Bir müd su” kartındaki gibi ≈ 0,5–0,75 L su (Peygamber ﷺ bir müd su ile abdest alırdı — Müslim 325 (Hayız Kitabı, no. 51)). Müd, sânın dörtte biridir: sitenin sâ değeriyle ≈ 0,75 kg gıda.',
      dinar: '1 dinar = 1 miskal altın ≈ 4,25 g (20 miskal ≈ 85 g — altın nisabı).',
      dirham: '200 dirhem = 140 miskal gümüş ≈ 595 g (gümüş nisabı), yani 1 dirhem ≈ 2,975 g.',
      mithqal: 'Sitenin fıkıh dersi: 20 miskal altın ≈ 85 g, yani 1 miskal ≈ 4,25 g.',
      uqiyah: '1 ukiyye = 40 dirhem ≈ 119 g gümüş; 5 ukiyye = 200 dirhem — gümüş nisabı.',
      nisabGold: '85 g altın (20 miskal) — sitenin zekât hesaplayıcısı (Daimi Komite, Fetvalar 9/254).',
      nisabSilver: '595 g gümüş (200 dirhem, 140 miskal) — sitenin zekât hesaplayıcısı.',
      dhira: 'Sitenin verisinde yok — âlim tahmini. Zira, dirsekten parmak uçlarına kadar olan uzunluktur; günümüz tahminleri ≈ 46–50 cm; devre ve yere göre değişmiştir.',
      mil: 'Sitenin yolculuk dersinden: 48 mil ≈ 80 km (bazı âlimlere göre ≈ 83 km), yani 1 mil ≈ 1,67–1,73 km. Bu, eski Arap milidir, İngiliz mili (1,609 km) değildir.',
      farsakh: '1 fersah = 3 mil ≈ 5–5,2 km.',
      barid: '1 berîd = 4 fersah = 12 mil ≈ 20–20,75 km.',
      travel: 'Cumhura göre kasr mesafesi: 48 mil = 16 fersah = 4 berîd ≈ 80 km (bazılarına göre ≈ 83 km). İbn Teymiyye yolculuğu belirli bir mesafeye değil, örfe bağlamıştır — yolcu namazı dersine bakın. Mezhepler mesafeyi farklı ölçer; âlimler ihtilaf etmiştir.',
    },
  },
}

const durParts = (min) => { const m = Math.max(1, Math.round(min)); return [Math.floor(m / 60), m % 60] }

const RELATED = [
  { to: 'zakat',
    title: { az: 'Zəkat və fitrə hesablayıcısı', en: 'Zakat and fitrah calculator', ru: 'Калькулятор закята и закят аль-фитра', ar: 'حاسبة الزكاة وزكاة الفطر', tr: 'Zekât ve fıtır sadakası hesaplayıcı' },
    sub: { az: 'nisab, 2,5%, hər nəfərə bir sa\'', en: 'nisab, 2.5%, one sa\' per person', ru: 'нисаб, 2,5 %, один саа на человека', ar: 'النصاب، 2.5٪، صاع عن كل فرد', tr: 'nisap, %2,5, kişi başı bir sâ' } },
  { to: 'qada',
    title: { az: 'Fidyə və kəffarə', en: 'Fidyah and kaffarah', ru: 'Фидья и каффара', ar: 'الفدية والكفارة', tr: 'Fidye ve kefaret' },
    sub: { az: 'yarım sa\' ≈ 1,5 kq hər kasıba', en: 'half a sa\' ≈ 1.5 kg per poor person', ru: 'половина саа ≈ 1,5 кг на бедного', ar: 'نصف صاع ≈ 1.5 كغ لكل مسكين', tr: 'fakir başına yarım sâ ≈ 1,5 kg' } },
  { learn: 'travel-prayer',
    title: { az: 'Müsafirin namazı', en: 'The traveller’s prayer', ru: 'Намаз путника', ar: 'صلاة المسافر', tr: 'Yolcu namazı' },
    sub: { az: 'səfər məsafəsi, qəsr və cəm', en: 'travel distance, shortening and combining', ru: 'расстояние, сокращение и объединение', ar: 'مسافة السفر والقصر والجمع', tr: 'yolculuk mesafesi, kasr ve cem' } },
]

function Visual({ kind, n }) {
  // Yalnız say ilə göstərilən müqayisələr üçün kiçik ikonlar (ən çox 12; sonuncu qismən)
  if (!['rice', 'bottle', 'forearm'].includes(kind) || !(n > 0)) return null
  const full = Math.min(12, Math.floor(n))
  const part = n < 12 ? n - Math.floor(n) : 0
  const items = Array.from({ length: full }, () => 1)
  if (part > 0.05) items.push(part)
  return (
    <span className="shu-vis" aria-hidden="true" data-kind={kind}>
      {items.map((f, i) => <span key={i} className="shu-vis__item" style={{ '--f': f }} />)}
      {n > 12 && <span className="shu-vis__more">+</span>}
    </span>
  )
}

export default function ShariaUnitsPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const [id, setId] = useState('saa')
  const [qtyIn, setQtyIn] = useState('1')

  const qty = parseAmount(qtyIn)
  const valid = Number.isFinite(qty) && qty >= 0 && qty <= 1e7
  const u = unitById(id)
  const rows = valid ? convert(id, qty) : []
  const cmp = valid ? comparison(id, qty) : null
  const m = (k) => t.m[k]
  const val = (o) => `${fmtNum(o.v, lang)} ${m(o.m)}`
  const rng = (o) => (o.lo !== o.hi ? t.range(`${fmtNum(o.lo, lang)}`, `${fmtNum(o.hi, lang)} ${m(o.m)}`) : '')
  const cmpText = (c) => {
    if (!c) return ''
    if (c.kind === 'walk' || c.kind === 'car') { const [h, mm] = durParts(c.n); return t.cmp[c.kind](t.dur(h, mm)) }
    return t.cmp[c.kind](fmtNum(c.n, lang, 1))
  }
  const linkOf = (l) => (l ? pathFor(l.key, lang, l.param) : null)
  const go = (e, href) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }
  const href = linkOf(u?.link)
  const summary = rows.length ? `${fmtNum(qty, lang)} × ${t.names[id]} ≈ ${rows.map(val).join(' · ')}` : ''

  return (
    <div className="shu-page">
      <header className="ui-page-hero shu-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container ui-container--narrow">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('units'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {t.how}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow shu-main">
          <form className="ui-card shu-form" onSubmit={(e) => e.preventDefault()} aria-labelledby="shu-form-title">
            <h2 className="ui-title ui-title--sm" id="shu-form-title">{t.result}</h2>
            <div className="shu-form__grid">
              <label className="ui-field">
                <span className="ui-field__label">{t.unit}</span>
                <select className="ui-input" value={id} onChange={(e) => setId(e.target.value)} data-testid="shu-unit">
                  {UNITS.map((x) => (
                    <option key={x.id} value={x.id}>{lang === 'ar' ? t.names[x.id] : `${t.names[x.id]} — ${x.ar}`}</option>
                  ))}
                </select>
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{t.qty}</span>
                <input className="ui-input" type="text" inputMode="decimal" autoComplete="off" value={qtyIn}
                  onChange={(e) => setQtyIn(e.target.value)} aria-invalid={valid ? undefined : 'true'}
                  aria-describedby={valid ? undefined : 'shu-bad'} data-testid="shu-qty" />
              </label>
            </div>
            {!valid && qtyIn.trim() !== '' && <p className="shu-bad" id="shu-bad" role="alert">{t.bad}</p>}

            <p className="ui-sr-only" aria-live="polite">{summary}</p>
            {rows.length > 0 && (
              <div className="shu-result" data-testid="shu-result">
                <p className="shu-result__head" lang="ar" dir="rtl">{u.ar}</p>
                <ul className="shu-rows">
                  {rows.map((o) => (
                    <li key={o.m} className="shu-row" data-basis={o.b}>
                      <span className="shu-row__val ui-num">≈ {val(o)}</span>
                      {o.of && <span className="shu-row__of">{t.of[o.of]}</span>}
                      <span className={`shu-badge shu-badge--${o.b}`}>{t.basis[o.b]}</span>
                      {rng(o) && <span className="shu-row__range ui-num">{rng(o)}{o.rb === 'estimate' ? ` · ${t.rangeEst}` : ''}</span>}
                    </li>
                  ))}
                </ul>
                {cmp && (
                  <p className="shu-cmp" data-testid="shu-cmp">
                    <span className="shu-cmp__label">{t.approx}:</span> <span className="ui-num">{cmpText(cmp)}</span>
                    <Visual kind={cmp.kind} n={cmp.n} />
                  </p>
                )}
                <p className="shu-note">{t.notes[id]}</p>
                {href && (
                  <a className="ui-link shu-open" href={href} onClick={(e) => go(e, href)}>
                    {t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" />
                  </a>
                )}
              </div>
            )}
          </form>

          <p className="shu-caution"><Icon name="alert" size={16} /> {t.caution}</p>

          <section aria-labelledby="shu-table-title" className="shu-table-wrap">
            <h2 className="ui-title ui-title--sm" id="shu-table-title">{t.table}</h2>
            <div className="shu-table-scroll">
              <table className="shu-table">
                <thead><tr><th scope="col">{t.colUnit}</th><th scope="col">{t.colMetric}</th><th scope="col">{t.colBasis}</th></tr></thead>
                <tbody>
                  {UNITS.map((x) => (
                    <tr key={x.id}>
                      <th scope="row">{t.names[x.id]} {lang !== 'ar' && <span className="shu-table__ar" lang="ar" dir="rtl">{x.ar}</span>}</th>
                      <td className="ui-num">{x.out.map((o) => `≈ ${val(o)}`).join(' · ')}</td>
                      <td>{t.basis[x.out[0].b]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <h2 className="ui-title ui-title--sm shu-related-title">{t.related}</h2>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
