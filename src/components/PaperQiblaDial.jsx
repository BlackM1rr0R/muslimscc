// ═══════════════════════════════════════════════════════
// PaperQiblaDial — kağız qiblə kompası və günəş saatı (çap üçün A4 vərəq)
//
// İstifadəçinin namaz şəhəri (usePrayerLocation) üçün 300 dpi-lik A4 vərəq çəkilir:
//   1) qiblə xətti və dərəcəsi olan kompas kartı (Kəbəyə böyük dairə istiqaməti);
//   2) həmin enlik üçün üfüqi günəş saatı: saat xətləri, günorta (meridian) xətti,
//      qnomonun yeri, əsr əyriləri (1 boy və 2 boy) gündönümü/bərabərlik nişanları ilə;
//   3) kəsib-qatlanan üçbucaq qnomon (bucağı = enlik), 50 mm-lik miqyas xətti;
//   4) 5 addımlıq quraşdırma, həqiqi şimal qeydi, vaxt tənliyi və bugünkü düzəliş.
// Cənub yarımkürəsində siferblat güzgülənir ("12" xətti həqiqi cənuba).
// Ön baxış — eyni çəkiliş kiçik miqyasda (yalnız görünəndə). Çap: şəkil <body>-yə portal
// ilə qoyulur, @media print yalnız onu göstərir (KidsCertificate kimi).
// Həndəsə: utils/paperDial.js; çəkiliş: utils/paperDialDraw.js.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { usePrayerLocation } from '../utils/prayerLocation'
import { qiblaBearing, clockCorrection } from '../utils/paperDial'
import { drawPaperDial, DPI300, A4 } from '../utils/paperDialDraw'
import { saveBlob, preopenWindow } from '../utils/quoteCard'
import '../styles/PaperQiblaDial.css'

const T = {
  az: {
    ey: 'Özün düzəlt', title: 'Kağız qiblə kompası və günəş saatı',
    lead: 'Şəhəriniz üçün A4 vərəqi: qiblə istiqaməti çəkilmiş kompas kartı və enliyiniz üçün hesablanmış üfüqi günəş saatı — əsr nişanları ilə. Çap edin, kəsin, qatlayın və günəşə qoyun.',
    city: 'Şəhər', lat: 'Enlik', qibla: 'Qiblə', corrL: 'Bugünkü düzəliş', noonL: 'Həqiqi günorta', min: 'dəq',
    N: 'Şm', S: 'C', E: 'Şq', W: 'Q',
    print: 'Çap et', download: 'PNG yüklə', making: 'Hazırlanır…', preview: 'Çap vərəqinin ön görünüşü',
    stepsTitle: 'Necə qurmalı — 5 addım',
    steps: (south) => [
      'Vərəqi A4 ölçüsündə, 100% miqyasla çap edin ("səhifəyə sığdır" olmadan); 50 mm-lik xətkeşi ölçüb yoxlayın.', // lang-ok[xətkeşi]: az sözü (xətkeş — lineyka)
      'Üçbucaq qnomonu və kompas kartını kontur üzrə kəsin; qnomonun qanadını qırıq xətt üzrə qatlayın.',
      'Qnomonu siferblatdakı qalın qırıq xəttin üstünə dik yapışdırın: iti bucağı (O) saat xətlərinin mərkəzinə, hündür tərəfi (V) "12" xəttinə tərəf.', // lang-ok[siferblatdakı]: az sözü (siferblat)
      `Vərəqi günəşli, düz səthə qoyun və "12" xəttini ${south ? 'həqiqi cənuba' : 'həqiqi şimala'} yönəldin.`,
      'Qnomonun kölgəsi yerli günəş vaxtını göstərir; saat vaxtı üçün bugünkü düzəlişi əlavə edin. Qnomonun ucunun kölgəsi əsr xəttinə çatanda əsr vaxtı girir.',
    ],
    northNote: 'Kompas kartını və siferblatı HƏQİQİ şimala görə qoyun. Maqnit kompası maqnit qütbünü göstərir — fərq (maqnit meyli) yerdən asılıdır, bəzi yerlərdə 10°-dən çoxdur. Həqiqi şimalı tapmağın yolu: həqiqi günorta anında şaquli çubuğun kölgəsi düz şimal–cənub xətti üzrə düşür.', // lang-ok[siferblatı]: az sözü (siferblat)
    eotNote: 'Günəş saatı saat vaxtını yox, yerli günəş vaxtını göstərir. İki səbəb var: (1) şəhər saat qurşağının mərkəzi meridianında deyil — uzunluğun hər 1°-si 4 dəqiqədir; (2) vaxt tənliyi — Yerin orbiti ellips, oxu isə maili olduğundan Günəş il boyu 16 dəqiqəyə qədər "irəli düşür" və ya "geri qalır".',
    asrNote: 'Əsr nişanları: kölgə = günorta kölgəsi + 1 boy (Şafii, Maliki, Hənbəli) və ya + 2 boy (Hənəfi). Nöqtələr gündönümləri və gecə-gündüz bərabərliyi üçündür; aradakı günlərdə qnomonun ucunun kölgəsi əyrinin üstünə düşür.',
    warn: 'Ekvatora yaxın yerlərdə üfüqi günəş saatının xətləri bir-birinə çox sıx düşür — dəqiqlik azdır.',
    corr: ({ date, city, total, lon, eot, noon }) => `${date}, ${city}: saat vaxtı = günəş saatı ${total} dəq (uzunluq ${lon}, vaxt tənliyi ${eot}). Həqiqi günorta saatla ${noon}. Düzəliş hər gün bir az dəyişir.`,
    dialTitle: (lat) => `Üfüqi günəş saatı — enlik ${lat}`,
    poleN: 'Həqiqi şimal', poleS: 'Həqiqi cənub', noon: '12 — həqiqi günorta (meridian)',
    glue: 'Qnomonu bu qırıq xəttə yapışdırın', asr1: 'Əsr, 1 boy (Şafii, Maliki, Hənbəli)', asr2: 'Əsr, 2 boy (Hənəfi)',
    seasons: { jun: '21 iyun', eq: '20 mart / 23 sentyabr', dec: '21 dekabr' },
    offPlate: 'nişanlar vərəqdən kənara düşür', cut: 'Kəsin', fold: 'Qatlayın', gnomon: 'Qnomon',
    trueNorth: '"Şm" həqiqi şimala (maqnit şimalına yox)', scale: '50 mm — çap miqyasını yoxlayın',
  },
  en: {
    ey: 'Make it yourself', title: 'Paper qibla compass and sundial',
    lead: 'An A4 sheet for your city: a compass card with the qibla direction and a horizontal sundial calculated for your latitude, with asr markings. Print, cut, fold and set it in the sun.',
    city: 'City', lat: 'Latitude', qibla: 'Qibla', corrL: 'Today’s correction', noonL: 'Solar noon', min: 'min',
    N: 'N', S: 'S', E: 'E', W: 'W',
    print: 'Print', download: 'Download PNG', making: 'Preparing…', preview: 'Preview of the printable sheet',
    stepsTitle: 'How to assemble — 5 steps',
    steps: (south) => [
      'Print the sheet on A4 at 100% scale (no “fit to page”); measure the 50 mm ruler to check.',
      'Cut out the triangular gnomon and the compass card along their outlines; fold the gnomon’s tab along the dashed line.',
      'Glue the gnomon upright on the thick dashed line of the dial: the sharp corner (O) at the centre of the hour lines, the tall side (V) towards the “12” line.',
      `Place the sheet on a flat, sunny surface and point the “12” line to ${south ? 'true south' : 'true north'}.`,
      'The gnomon’s shadow shows local solar time; add today’s correction to get clock time. When the shadow of the gnomon’s tip reaches an asr line, asr time has begun.',
    ],
    northNote: 'Align the compass card and the dial with TRUE north. A magnetic compass points to the magnetic pole — the difference (magnetic declination) depends on where you are and is over 10° in some places. One way to find true north: at solar noon the shadow of a vertical stick falls exactly on the north–south line.',
    eotNote: 'A sundial shows local solar time, not clock time. Two reasons: (1) the city is not on the central meridian of its time zone — every 1° of longitude is 4 minutes; (2) the equation of time — because Earth’s orbit is an ellipse and its axis is tilted, the Sun runs up to 16 minutes “fast” or “slow” through the year.',
    asrNote: 'Asr markings: shadow = noon shadow + 1 length (Shafi‘i, Maliki, Hanbali) or + 2 lengths (Hanafi). The dots are for the solstices and equinoxes; on the days between, the shadow of the gnomon’s tip falls on the curve.',
    warn: 'Near the equator the hour lines of a horizontal sundial crowd together — accuracy is low.',
    corr: ({ date, city, total, lon, eot, noon }) => `${date}, ${city}: clock time = sundial ${total} min (longitude ${lon}, equation of time ${eot}). Solar noon by the clock: ${noon}. The correction changes a little every day.`,
    dialTitle: (lat) => `Horizontal sundial — latitude ${lat}`,
    poleN: 'True north', poleS: 'True south', noon: '12 — solar noon (meridian)',
    glue: 'Glue the gnomon on this dashed line', asr1: 'Asr, 1 length (Shafi‘i, Maliki, Hanbali)', asr2: 'Asr, 2 lengths (Hanafi)',
    seasons: { jun: '21 June', eq: '20 March / 23 Sept', dec: '21 December' },
    offPlate: 'marks fall off the sheet', cut: 'Cut here', fold: 'Fold', gnomon: 'Gnomon',
    trueNorth: '“N” to true north (not magnetic north)', scale: '50 mm — check the print scale',
  },
  ru: {
    ey: 'Сделай сам', title: 'Бумажный компас киблы и солнечные часы',
    lead: 'Лист A4 для вашего города: карточка-компас с направлением киблы и горизонтальные солнечные часы, рассчитанные для вашей широты, с отметками аср. Распечатайте, вырежьте, согните и поставьте на солнце.', // lang-ok[A]: kağız formatı A4
    city: 'Город', lat: 'Широта', qibla: 'Кибла', corrL: 'Поправка сегодня', noonL: 'Истинный полдень', min: 'мин',
    N: 'С', S: 'Ю', E: 'В', W: 'З',
    print: 'Печать', download: 'Скачать PNG', making: 'Готовим…', preview: 'Предпросмотр листа для печати',
    stepsTitle: 'Как собрать — 5 шагов',
    steps: (south) => [
      'Печатайте на A4 в масштабе 100% (без «по размеру страницы»); проверьте по линейке 50 мм.', // lang-ok[A]: kağız formatı A4
      'Вырежьте треугольный гномон и карточку-компас по контуру; согните клапан гномона по пунктиру.',
      'Приклейте гномон вертикально на толстый пунктир циферблата: острый угол (O) — в центр часовых линий, высокая сторона (V) — к линии «12».', // lang-ok[O]: vərəqdəki nöqtənin adı
      `Положите лист на ровную солнечную поверхность и направьте линию «12» на ${south ? 'истинный юг' : 'истинный север'}.`,
      'Тень гномона показывает местное солнечное время; для часового времени прибавьте сегодняшнюю поправку. Когда тень вершины гномона доходит до линии аср, наступило время аср.',
    ],
    northNote: 'Ориентируйте компас и циферблат по ИСТИННОМУ северу. Магнитный компас указывает на магнитный полюс — разница (магнитное склонение) зависит от места и кое-где превышает 10°. Способ найти истинный север: в истинный полдень тень вертикальной палочки ложится точно по линии север–юг.',
    eotNote: 'Солнечные часы показывают местное солнечное время, а не часовое. Две причины: (1) город лежит не на центральном меридиане своего часового пояса — каждый 1° долготы это 4 минуты; (2) уравнение времени — орбита Земли эллиптическая, а её ось наклонена, поэтому Солнце в течение года «спешит» или «отстаёт» до 16 минут.',
    asrNote: 'Отметки аср: тень = полуденная тень + 1 длина (шафииты, маликиты, ханбалиты) или + 2 длины (ханафиты). Точки — для солнцестояний и равноденствий; в промежуточные дни тень вершины гномона падает на кривую.',
    warn: 'Вблизи экватора часовые линии горизонтальных солнечных часов сливаются — точность низкая.',
    corr: ({ date, city, total, lon, eot, noon }) => `${date}, ${city}: часовое время = солнечные часы ${total} мин (долгота ${lon}, уравнение времени ${eot}). Истинный полдень по часам: ${noon}. Поправка немного меняется каждый день.`,
    dialTitle: (lat) => `Горизонтальные солнечные часы — широта ${lat}`,
    poleN: 'Истинный север', poleS: 'Истинный юг', noon: '12 — истинный полдень (меридиан)',
    glue: 'Приклейте гномон на этот пунктир', asr1: 'Аср, 1 длина (шафииты, маликиты, ханбалиты)', asr2: 'Аср, 2 длины (ханафиты)',
    seasons: { jun: '21 июня', eq: '20 марта / 23 сентября', dec: '21 декабря' },
    offPlate: 'отметки за краем листа', cut: 'Вырезать', fold: 'Согнуть', gnomon: 'Гномон',
    trueNorth: '«С» — на истинный север (не магнитный)', scale: '50 мм — проверьте масштаб печати',
  },
  ar: {
    ey: 'اصنعه بنفسك', title: 'بوصلة قبلة ومزولة شمسية من الورق',
    lead: 'ورقة A4 لمدينتك: بطاقة بوصلة عليها اتجاه القبلة، ومزولة أفقية محسوبة لخط عرضك مع علامات العصر. اطبعها وقصّها واطوِها وضعها في الشمس.', // lang-ok[A]: kağız formatı A4
    city: 'المدينة', lat: 'خط العرض', qibla: 'القبلة', corrL: 'تصحيح اليوم', noonL: 'الزوال الحقيقي', min: 'د',
    N: 'ش', S: 'ج', E: 'ق', W: 'غ',
    print: 'اطبع', download: 'نزّل PNG', making: 'جارٍ التحضير…', preview: 'معاينة ورقة الطباعة',
    stepsTitle: 'طريقة التركيب — 5 خطوات',
    steps: (south) => [
      'اطبع الورقة بمقاس A4 وبمقياس 100% (دون «ملاءمة الصفحة»)، وتحقّق بقياس مسطرة 50 مم.', // lang-ok[A]: kağız formatı A4
      'قصّ الشاخص المثلث وبطاقة البوصلة على الخط، واطوِ لسان الشاخص على الخط المتقطع.',
      'ألصق الشاخص قائمًا على الخط المتقطع العريض في المزولة: الزاوية الحادة (O) في مركز خطوط الساعات، والضلع العالي (V) نحو خط «12».', // lang-ok[O]: vərəqdəki nöqtənin adı
      `ضع الورقة على سطح مستوٍ مشمس ووجّه خط «12» إلى ${south ? 'الجنوب الحقيقي' : 'الشمال الحقيقي'}.`,
      'ظل الشاخص يبيّن التوقيت الشمسي المحلي؛ أضف تصحيح اليوم لتحصل على وقت الساعة. إذا بلغ ظل رأس الشاخص خط العصر فقد دخل وقت العصر.',
    ],
    northNote: 'وجّه البوصلة والمزولة إلى الشمال الحقيقي. البوصلة المغناطيسية تشير إلى القطب المغناطيسي، والفرق (الانحراف المغناطيسي) يختلف من مكان لآخر ويزيد على 10° في بعض الأماكن. طريقة لمعرفة الشمال الحقيقي: عند الزوال يقع ظل العود القائم على خط الشمال والجنوب تمامًا.',
    eotNote: 'المزولة تبيّن التوقيت الشمسي المحلي لا وقت الساعة، لسببين: (1) المدينة ليست على خط الطول المركزي لمنطقتها الزمنية، وكل درجة طول تساوي 4 دقائق؛ (2) معادلة الزمن: لأن مدار الأرض إهليلجي ومحورها مائل، تتقدّم الشمس أو تتأخر حتى 16 دقيقة خلال السنة.',
    asrNote: 'علامات العصر: الظل = ظل الزوال + مثل الطول (الشافعية والمالكية والحنابلة) أو + مثلَي الطول (الحنفية). النقاط للانقلابين والاعتدالين، وفي الأيام بينها يقع ظل رأس الشاخص على المنحنى.',
    warn: 'قرب خط الاستواء تتقارب خطوط الساعات في المزولة الأفقية جدًا فتقلّ الدقة.',
    corr: ({ date, city, total, lon, eot, noon }) => `${date}، ${city}: وقت الساعة = المزولة ${total} د (خط الطول ${lon}، معادلة الزمن ${eot}). الزوال الحقيقي بالساعة: ${noon}. يتغيّر التصحيح قليلًا كل يوم.`,
    dialTitle: (lat) => `مزولة أفقية — خط العرض ${lat}`,
    poleN: 'الشمال الحقيقي', poleS: 'الجنوب الحقيقي', noon: '12 — الزوال (خط الزوال)',
    glue: 'ألصق الشاخص على هذا الخط المتقطع', asr1: 'العصر، مثل الطول (الشافعية والمالكية والحنابلة)', asr2: 'العصر، مثلا الطول (الحنفية)',
    seasons: { jun: '21 يونيو', eq: '20 مارس / 23 سبتمبر', dec: '21 ديسمبر' },
    offPlate: 'العلامات خارج الورقة', cut: 'قصّ هنا', fold: 'اطوِ', gnomon: 'الشاخص',
    trueNorth: '«ش» إلى الشمال الحقيقي (لا المغناطيسي)', scale: '50 مم — تحقّق من مقياس الطباعة',
  },
  tr: {
    ey: 'Kendin yap', title: 'Kâğıttan kıble pusulası ve güneş saati',
    lead: 'Şehriniz için A4 sayfa: kıble yönü çizilmiş pusula kartı ve enleminize göre hesaplanmış yatay güneş saati, ikindi işaretleriyle. Yazdırın, kesin, katlayın ve güneşe koyun.',
    city: 'Şehir', lat: 'Enlem', qibla: 'Kıble', corrL: 'Bugünkü düzeltme', noonL: 'Gerçek öğle', min: 'dk',
    N: 'K', S: 'G', E: 'D', W: 'B',
    print: 'Yazdır', download: 'PNG indir', making: 'Hazırlanıyor…', preview: 'Yazdırılacak sayfanın önizlemesi',
    stepsTitle: 'Nasıl kurulur — 5 adım',
    steps: (south) => [
      'Sayfayı A4, %100 ölçekle yazdırın ("sayfaya sığdır" olmadan); 50 mm’lik cetveli ölçüp kontrol edin.',
      'Üçgen gnomonu ve pusula kartını çizgi boyunca kesin; gnomonun kanadını kesikli çizgiden katlayın.',
      'Gnomonu kadrandaki kalın kesikli çizginin üstüne dik yapıştırın: dar açı (O) saat çizgilerinin merkezine, yüksek kenar (V) "12" çizgisine doğru.',
      `Sayfayı güneşli, düz bir yüzeye koyun ve "12" çizgisini ${south ? 'gerçek güneye' : 'gerçek kuzeye'} çevirin.`,
      'Gnomonun gölgesi yerel güneş saatini gösterir; saat zamanı için bugünkü düzeltmeyi ekleyin. Gnomon ucunun gölgesi ikindi çizgisine ulaşınca ikindi vakti girmiştir.',
    ],
    northNote: 'Pusula kartını ve kadranı GERÇEK kuzeye göre yerleştirin. Manyetik pusula manyetik kutbu gösterir — fark (manyetik sapma) yere göre değişir, bazı yerlerde 10°’yi aşar. Gerçek kuzeyi bulmanın bir yolu: gerçek öğle anında dik bir çubuğun gölgesi tam kuzey–güney çizgisine düşer.',
    eotNote: 'Güneş saati saat zamanını değil, yerel güneş zamanını gösterir. İki sebebi var: (1) şehir saat diliminin merkez meridyeninde değildir — boylamın her 1°’si 4 dakikadır; (2) zaman denklemi — Dünya’nın yörüngesi elips, ekseni eğik olduğundan Güneş yıl boyunca 16 dakikaya kadar "ileri" ya da "geri" kalır.',
    asrNote: 'İkindi işaretleri: gölge = öğle gölgesi + 1 boy (Şâfiî, Mâlikî, Hanbelî) veya + 2 boy (Hanefî). Noktalar gündönümleri ve ekinokslar içindir; aradaki günlerde gnomon ucunun gölgesi eğrinin üstüne düşer.',
    warn: 'Ekvatora yakın yerlerde yatay güneş saatinin çizgileri birbirine çok yakın düşer — hassasiyet düşüktür.',
    corr: ({ date, city, total, lon, eot, noon }) => `${date}, ${city}: saat zamanı = güneş saati ${total} dk (boylam ${lon}, zaman denklemi ${eot}). Gerçek öğle saatle ${noon}. Düzeltme her gün biraz değişir.`,
    dialTitle: (lat) => `Yatay güneş saati — enlem ${lat}`,
    poleN: 'Gerçek kuzey', poleS: 'Gerçek güney', noon: '12 — gerçek öğle (meridyen)',
    glue: 'Gnomonu bu kesikli çizgiye yapıştırın', asr1: 'İkindi, 1 boy (Şâfiî, Mâlikî, Hanbelî)', asr2: 'İkindi, 2 boy (Hanefî)',
    seasons: { jun: '21 Haziran', eq: '20 Mart / 23 Eylül', dec: '21 Aralık' },
    offPlate: 'işaretler sayfanın dışında', cut: 'Buradan kesin', fold: 'Katlayın', gnomon: 'Gnomon',
    trueNorth: '"K" gerçek kuzeye (manyetik kuzeye değil)', scale: '50 mm — yazdırma ölçeğini kontrol edin',
  },
}

const DATE_LOC = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }
const signed = (m) => `${m >= 0 ? '+' : '−'}${Math.abs(Math.round(m))}`
function fmtDate(ms, tz, lang) {
  try { return new Date(ms).toLocaleDateString(DATE_LOC[lang] || 'en-GB', { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' }) } catch { return new Date(ms).toISOString().slice(0, 10) }
}
function fmtTime(ms, tz) {
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms)) } catch { return new Date(ms).toISOString().slice(11, 16) }
}

export default function PaperQiblaDial() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const loc = usePrayerLocation()
  const rtl = lang === 'ar'
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const printImgRef = useRef(null)
  const blobRef = useRef({ key: '', blob: null, url: '' })
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  const south = loc.lat < 0
  const cityName = loc.city?.[lang] || loc.city?.en || loc.label || ''
  const qibla = qiblaBearing(loc.lat, loc.lng)
  const now = useMemo(() => Date.now(), [loc]) // eslint-disable-line react-hooks/exhaustive-deps
  const corr = useMemo(() => clockCorrection(loc, now), [loc, now])
  const latTxt = `${Math.abs(loc.lat).toFixed(2)}° ${south ? t.S : t.N}`
  const lngTxt = `${Math.abs(loc.lng).toFixed(2)}° ${loc.lng < 0 ? t.W : t.E}`
  const dateTxt = fmtDate(now, loc.tz, lang)
  const noonTxt = fmtTime(corr.noonMs, loc.tz)
  const steps = t.steps(south)

  const sheet = useMemo(() => ({
    title: t.title,
    meta: `${cityName} · ${latTxt}, ${lngTxt} · ${t.qibla} ${qibla.toFixed(1)}° · ${dateTxt}`,
    dialTitle: t.dialTitle(latTxt), pole: south ? t.poleS : t.poleN, noon: t.noon, glue: t.glue,
    asr1: t.asr1, asr2: t.asr2, seasons: t.seasons, offPlate: t.offPlate, cut: t.cut, fold: t.fold, gnomon: t.gnomon,
    dirs: [t.N, t.E, t.S, t.W], qibla: t.qibla, trueNorth: t.trueNorth, scale: t.scale,
    steps, northNote: t.northNote, eotNote: t.eotNote, warn: Math.abs(loc.lat) < 8 ? t.warn : '',
    corr: t.corr({ date: dateTxt, city: cityName, total: signed(corr.total), lon: signed(corr.lon), eot: signed(corr.eot), noon: noonTxt }),
  }), [t, cityName, latTxt, lngTxt, qibla, dateTxt, south, steps, loc.lat, corr, noonTxt])
  const sheetKey = JSON.stringify([loc.lat, loc.lng, sheet.corr, sheet.meta, lang])

  // Ön baxış yalnız görünəndə çəkilir (bir dəfə, sonra yalnız məlumat dəyişəndə)
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined }
    const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { setVisible(true); io.disconnect() } }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const c = canvasRef.current
    if (!visible || !c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = Math.round(Math.min(1240, Math.max(360, (c.clientWidth || 520) * dpr)))
    c.width = W; c.height = Math.round(W * A4.h / A4.w)
    drawPaperDial(c.getContext('2d'), c.width, c.height, { lat: loc.lat, lng: loc.lng, qibla, rtl, s: sheet })
  }, [visible, sheet, loc.lat, loc.lng, qibla, rtl])

  // Köhnə çap şəklini burax
  useEffect(() => () => { if (blobRef.current.url) URL.revokeObjectURL(blobRef.current.url) }, [])

  const makeBlob = useCallback(async () => {
    const cur = blobRef.current
    if (cur.key === sheetKey && cur.blob) return cur
    const c = document.createElement('canvas')
    c.width = DPI300.w; c.height = DPI300.h
    drawPaperDial(c.getContext('2d'), c.width, c.height, { lat: loc.lat, lng: loc.lng, qibla, rtl, s: sheet })
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'))
    c.width = 0; c.height = 0
    if (!blob) return null
    if (cur.url) URL.revokeObjectURL(cur.url)
    blobRef.current = { key: sheetKey, blob, url: URL.createObjectURL(blob) }
    return blobRef.current
  }, [sheetKey, sheet, loc.lat, loc.lng, qibla, rtl])

  const fileName = () => `muslims-cc-qibla-sundial-${(loc.city?.en || 'city').replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.png`

  const download = async () => {
    if (busy) return
    const win = preopenWindow()
    setBusy(true)
    try { const r = await makeBlob(); if (r) saveBlob(r.blob, fileName(), win) } finally { setBusy(false) }
  }

  const print = async () => {
    if (busy) return
    setBusy(true)
    let r = null
    try {
      r = await makeBlob()
      const img = printImgRef.current
      if (r && img) {
        if (img.src !== r.url) img.src = r.url
        try { await img.decode() } catch { /* köhnə brauzer — şəkil onsuz da yüklənir */ }
      }
    } finally { setBusy(false) }
    if (!r) return
    const html = document.documentElement
    html.classList.add('pd-printing')
    const done = () => { html.classList.remove('pd-printing'); window.removeEventListener('afterprint', done) }
    window.addEventListener('afterprint', done)
    setTimeout(() => { window.print(); setTimeout(done, 1000) }, 50)
  }

  return (
    <section ref={rootRef} className="ui-card pd" aria-labelledby="pd-title" data-testid="paper-dial"
      data-lat={Math.round(loc.lat)} data-qibla={Math.round(qibla)} dir={rtl ? 'rtl' : undefined}>
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="pd-title" className="pd__title">{t.title}</h2>
      <p className="pd__lead">{t.lead}</p>
      <div className="pd__grid">
        <div className="pd__stage">
          <canvas ref={canvasRef} className="pd__canvas" data-testid="pd-preview" role="img" aria-label={`${t.preview}: ${sheet.meta}`} />
        </div>
        <div className="pd__panel">
          <dl className="pd__read">
            <div><dt>{t.city}</dt><dd>{cityName}</dd></div>
            <div><dt>{t.lat}</dt><dd>{latTxt}</dd></div>
            <div><dt>{t.qibla}</dt><dd dir="ltr">{qibla.toFixed(1)}°</dd></div>
            <div><dt>{t.corrL}</dt><dd>{signed(corr.total)} {t.min}</dd></div>
            <div><dt>{t.noonL}</dt><dd dir="ltr">{noonTxt}</dd></div>
          </dl>
          <div className="pd__btns">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={print} disabled={busy}>
              <Icon name="list" className="ui-btn__icon" /> {busy ? t.making : t.print}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={download} disabled={busy} data-testid="pd-download">
              <Icon name="download" className="ui-btn__icon" /> {t.download}
            </button>
          </div>
          <h3 className="pd__h3">{t.stepsTitle}</h3>
          <ol className="pd__steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <p className="pd__note"><Icon name="compass" size={14} /> {t.northNote}</p>
          <p className="pd__note"><Icon name="clock" size={14} /> {t.eotNote}</p>
          <p className="pd__note"><Icon name="sun" size={14} /> {t.asrNote}</p>
          {Math.abs(loc.lat) < 8 && <p className="pd__note pd__warn"><Icon name="alert" size={14} /> {t.warn}</p>}
          <p className="pd__corr">{sheet.corr}</p>
        </div>
      </div>
      {createPortal(<div className="pd-print" aria-hidden="true"><img ref={printImgRef} alt="" /></div>, document.body)}
    </section>
  )
}
