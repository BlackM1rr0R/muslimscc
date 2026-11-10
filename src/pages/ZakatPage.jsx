import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { localizeSource } from '../utils/sourceNames'
import '../styles/ZakatPage.css'
import '../styles/ToolsMotion.css'
import Sparkle from '../components/prayer/Sparkle'
import GeoStarfield from '../components/prayer/GeoStarfield'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { useNavigate } from 'react-router-dom'
import PageLink, { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import { parseAmount, cleanAmountInput } from '../utils/parseAmount'
import { ChartFigure, BarChart, SegmentBreakdown, ProgressBar } from '../components/viz'
import ZakatFlow from '../components/ZakatFlow'
import { pickUi } from '../utils/uiText'
import ShineButton from '../motion/ShineButton'

// ═══ ZƏKAT HESABI — Sələf alimlərinin fətvalarına uyğun ═══
// • Zəkat nisaba çatan və üzərindən bir hicri il (hövl) keçən mala düşür. Aylıq maaş
//   (və icarə gəliri) ×12 edilib zəkat malına qatılmır — maaşın özü zəkat malı deyil,
//   ondan yığılıb əldə bir il qalan hissə sayılır (Daimi Komitə, Fətvalar 9/280 —
//   https://islamqa.info/en/answers/26113). Əvvəlki "maaş × 12" və "icarə × 12" sahələri çıxarıldı.
// • Kağız pulun nisabı: 85 q qızıl VƏ YA 595 q gümüşün dəyəri; kasıblar üçün hansı daha
//   faydalıdırsa o götürülür (Daimi Komitə, Fətvalar 9/254, 9/257 —
//   https://islamqa.info/en/answers/2795). Bu gün gümüş nisabı aşağıdır — standart seçim gümüşdür,
//   istifadəçi qızılı seçə bilər.
// • Fitrə pulla deyil, ərzaqla verilir: hər nəfərə bir sa' (≈3 kq) əsas qida
//   (Buxari 1503, 1506 — https://islamqa.info/en/answers/1396; yerli əsas qida —
//   https://islamqa.info/en/answers/145564, İbn Useymin, Məcmu Fətava 18/282).
//
// Təxmini qiymətlər (USD / qram) — istifadəçi bugünkü bazar qiymətini özü yaza bilər.
// Ehtiyat qiymətlər (2026-11-09 bazarı) — adətən canlı qiymət yüklənir (aşağıda METALS_URL)
const GOLD_USD_PER_G   = 132
const SILVER_USD_PER_G = 1.70
const NISAB_GOLD_G   = 85
const NISAB_SILVER_G = 595
// Bir sa' ≈ 3 kq (https://islamqa.info/en/answers/1396)
const SAA_KG = 3

// Bayraq emojiləri çıxarıldı: Windows-da iki hərf kimi görünür ("AZ AZN ₼")
const CURRENCIES = [
  { code:'AZN', symbol:'₼'   },
  { code:'USD', symbol:'$'   },
  { code:'EUR', symbol:'€'   },
  { code:'RUB', symbol:'₽'   },
  { code:'TRY', symbol:'₺'   },
  { code:'SAR', symbol:'﷼'  },
  { code:'GBP', symbol:'£'   },
  { code:'AED', symbol:'د.إ' },
]
const NUM_LOCALES = { az: 'az-AZ', en: 'en-US', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }
const FALLBACK = { USD:1, AZN:1.70, EUR:0.92, RUB:91, TRY:32, SAR:3.75, GBP:0.79, AED:3.67 }
// v5.9: canlı qızıl/gümüş qiyməti və valyuta məzənnəsi bir mənbədən — fawazahmed0/currency-api
// (jsDelivr, gündəlik yenilənir; xau/xag = 1 USD-yə düşən troya unsiyası). Alınmasa — köhnə
// məzənnə API-si və yuxarıdakı ehtiyat qiymətlər ("təxmini" nişanı ilə).
const METALS_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
const TROY_OZ_G = 31.1034768

const L = {
  savingsLabel: { az:'Yığım / bank hesabı',   ru:'Сбережения / Банк',   ar:'المدخرات / البنك',   tr:'Birikim / Banka',      en:'Savings / Bank'      },
  otherLabel:   { az:'Digər pul varlıqları',  ru:'Прочие активы',       ar:'أصول أخرى',          tr:'Diğer Varlıklar',      en:'Other Assets'        },
  goldLabel:    { az:'Qızıl (qram)',          ru:'Золото (граммы)',      ar:'الذهب (غرام)',       tr:'Altın (gram)',          en:'Gold (grams)'        },
  silverLabel:  { az:'Gümüş (qram)',          ru:'Серебро (граммы)',     ar:'الفضة (غرام)',       tr:'Gümüş (gram)',          en:'Silver (grams)'      },
  stocksLabel:  { az:'Ticarət malları / səhmlər', ru:'Товары для торговли / акции', ar:'عروض التجارة / الأسهم', tr:'Ticaret malları / hisseler', en:'Trade goods / shares' },
  stocksHint:   { az:'Satış üçün saxlanılan malın bugünkü bazar dəyəri', ru:'Текущая рыночная стоимость товара, хранимого для продажи', ar:'القيمة السوقية الحالية لما يُعدّ للبيع', tr:'Satış için tutulan malın bugünkü piyasa değeri', en:'Current market value of goods held for sale' },
  hawlTitle:    { az:'Zəkat hansı mala düşür?', ru:'С какого имущества выплачивается закят?', ar:'على أي مال تجب الزكاة؟', tr:'Zekât hangi mala düşer?', en:'What is zakat due on?' },
  hawlNote:     { az:'Zəkat nisaba çatan və üzərindən bir hicri il (hövl) keçən pul, qızıl, gümüş və ticarət malına düşür. Maaşın və icarə gəlirinin özü zəkat malı deyil: onlardan yığılıb əlinizdə bir il qalan hissəni "Yığım" sahəsinə yazın.', ru:'Закят выплачивается с денег, золота, серебра и товаров для торговли, достигших нисаба, если над ними прошёл один лунный год (хауль). Зарплата и арендный доход сами по себе не являются имуществом для закята: впишите в поле «Сбережения» ту их часть, которая накоплена и пролежала у вас год.', ar:'تجب الزكاة في النقود والذهب والفضة وعروض التجارة إذا بلغت النصاب وحال عليها الحول الهجري. والراتب ودخل الإيجار ليسا مالًا زكويًا بذاتهما: اكتب في خانة «المدخرات» ما ادّخرته منهما وبقي عندك حولًا.', tr:'Zekât, nisaba ulaşan ve üzerinden bir hicri yıl (havl) geçen para, altın, gümüş ve ticaret malına düşer. Maaş ve kira gelirinin kendisi zekât malı değildir: bunlardan biriktirip elinizde bir yıl kalan kısmı "Birikim" alanına yazın.', en:'Zakat is due on money, gold, silver and trade goods that reach the nisab and have been held for one lunar year (hawl). A salary or rental income is not itself zakatable: enter the part you have saved and held for a year under "Savings".' },
  hawlSrc:      { az:'Daimi Komitə fətvaları, 9/280', ru:'Фетвы Постоянного комитета, 9/280', ar:'فتاوى اللجنة الدائمة، ٩/٢٨٠', tr:'Daimi Komite fetvaları, 9/280', en:'Fatawa al-Lajnah al-Daimah, 9/280' },
  nisabBasis:   { az:'Nisab nəyə görə hesablansın?', ru:'По чему считать нисаб?', ar:'على أي أساس يُحسب النصاب؟', tr:'Nisap neye göre hesaplansın?', en:'Calculate the nisab by' },
  basisSilver:  { az:'Gümüş — 595 q', ru:'Серебро — 595 г', ar:'الفضة — ٥٩٥ غ', tr:'Gümüş — 595 g', en:'Silver — 595 g' },
  basisGold:    { az:'Qızıl — 85 q', ru:'Золото — 85 г', ar:'الذهب — ٨٥ غ', tr:'Altın — 85 g', en:'Gold — 85 g' },
  nisabExplain: { az:'Kağız pulun nisabı 85 q qızılın və ya 595 q gümüşün dəyəridir. Daimi Komitə hansı kasıblar üçün daha faydalıdırsa onu əsas götürməyi bildirib; bu gün bu, adətən gümüşdür.', ru:'Нисаб бумажных денег — стоимость 85 г золота или 595 г серебра. Постоянный комитет указал брать то, что полезнее для бедных; сегодня это обычно серебро.', ar:'نصاب الأوراق النقدية قيمة ٨٥ غرامًا من الذهب أو ٥٩٥ غرامًا من الفضة، وقد أفتت اللجنة الدائمة بالأخذ بالأنفع للفقراء، وهو اليوم غالبًا الفضة.', tr:'Kâğıt paranın nisabı 85 g altının veya 595 g gümüşün değeridir. Daimi Komite fakirler için hangisi daha faydalıysa onun esas alınmasını bildirmiştir; bugün bu genellikle gümüştür.', en:'The nisab for paper money is the value of 85 g of gold or 595 g of silver. The Permanent Committee advised using whichever is more beneficial to the poor; today that is usually silver.' },
  nisabSrc:     { az:'Daimi Komitə fətvaları, 9/254, 9/257', ru:'Фетвы Постоянного комитета, 9/254, 9/257', ar:'فتاوى اللجنة الدائمة، ٩/٢٥٤، ٩/٢٥٧', tr:'Daimi Komite fetvaları, 9/254, 9/257', en:'Fatawa al-Lajnah al-Daimah, 9/254, 9/257' },
  salaryTitle:  { az:'Maaşla yaşayırsınız?', ru:'Живёте на зарплату?', ar:'تعيش على الراتب؟', tr:'Maaşla mı geçiniyorsunuz?', en:'Living on a salary?' },
  salaryText:   { az:'Maaşın özünə zəkat düşmür — ondan yığılıb əlinizdə qalan pula düşür. Hər ayın yığımının ilini ayrı-ayrı saymaq çətindir; Daimi Komitənin göstərdiyi asan yol: ildə bir zəkat günü seçin və həmin gün əlinizdə olan bütün puldan 2,5% verin. Hələ bir il tamam olmayan hissə üçün verilən əvvəlcədən ödənmiş zəkat sayılır.', ru:'С самой зарплаты закят не выплачивается — он выплачивается с накопленного из неё. Считать год для каждого месячного остатка трудно; простой путь, указанный Постоянным комитетом: выберите один день закята в году и в этот день отдайте 2,5% со всех денег, которые у вас есть. За часть, над которой ещё не прошёл год, это считается закятом, выплаченным заранее.', ar:'لا زكاة في الراتب نفسه، وإنما فيما يُدَّخر منه. ويشقّ حساب الحول لكل مبلغ شهري؛ والطريق الأيسر الذي ذكرته اللجنة الدائمة: أن تجعل لك يومًا في السنة تزكي فيه جميع ما عندك من مال بنسبة 2.5%، وما لم يحل عليه الحول يكون زكاةً معجَّلة.', tr:'Maaşın kendisine zekât düşmez — ondan biriktirip elinizde kalan paraya düşer. Her ayın birikiminin yılını ayrı ayrı saymak zordur; Daimi Komite\u2019nin gösterdiği kolay yol: yılda bir zekât günü seçin ve o gün elinizdeki bütün paranın %2,5\u2019ini verin. Henüz yılı dolmayan kısım için verilen, peşin ödenmiş zekât sayılır.', en:'Zakat is not due on the salary itself but on what you save from it. Counting a year for every month\u2019s savings is hard; the easier way the Permanent Committee gives: choose one zakat day a year and on that day give 2.5% of all the money you have. For the part that has not yet completed a year, it counts as zakat paid in advance.' },
  salaryLabel:  { az:'Maaşdan yığılan pul (bu gün əlinizdə)', ru:'Накоплено из зарплаты (на сегодня)', ar:'المدَّخر من الراتب (اليوم)', tr:'Maaştan biriken para (bugün elinizde)', en:'Saved from salary (in hand today)' },
  salaryHint:   { az:'Aylıq maaşın özü yox — ondan qalıb yığılan məbləğ', ru:'Не сама месячная зарплата, а накопленный из неё остаток', ar:'ليس الراتب الشهري نفسه، بل ما بقي منه وادُّخر', tr:'Aylık maaşın kendisi değil — ondan artıp biriken tutar', en:'Not the monthly salary itself — the amount left over and saved' },
  livePrice:    { az:'{d} bazar qiyməti', ru:'рыночная цена на {d}', ar:'سعر السوق في {d}', tr:'{d} piyasa fiyatı', en:'market price on {d}' },
  approxPrice:  { az:'təxmini qiymət — bugünkü qiyməti yazın', ru:'примерная цена — укажите сегодняшнюю', ar:'سعر تقريبي — أدخل سعر اليوم', tr:'yaklaşık fiyat — bugünkü fiyatı yazın', en:'approximate price — enter today\u2019s' },
  priceHint:    { az:'Bugünkü bazar qiymətini yaza bilərsiniz', ru:'Можно указать сегодняшнюю рыночную цену', ar:'يمكنك إدخال سعر السوق اليوم', tr:'Bugünkü piyasa fiyatını yazabilirsiniz', en:'You can enter today’s market price' },
  debtLabel: { az:'Zəkat günündən əvvəl ödədiyiniz borc', ru:'Долг, выплачиваемый до дня закята', ar:'الدين الذي تقضيه قبل موعد الزكاة', tr:'Zekât gününden önce ödediğiniz borç', en:'Debt you pay off before the zakat date' },
  fitrTitle:    { az:'Fitrə zəkatı',          ru:'Закят аль-Фитр',      ar:'زكاة الفطر',         tr:'Fıtır Sadakası',        en:'Zakat al-Fitr'       },
  fitrDesc:     { az:"Bayram namazından əvvəl hər ailə üzvü üçün bir sa' (≈3 kq) əsas qida verilir", ru:"До праздничной молитвы за каждого члена семьи выдаётся один са' (≈3 кг) основной еды", ar:'تُخرج قبل صلاة العيد صاعًا (≈٣ كغ) من قوت البلد عن كل فرد', tr:"Bayram namazından önce her aile üyesi için bir sâ' (≈3 kg) temel gıda verilir", en:"One saa' (≈3 kg) of staple food per family member, given before the Eid prayer" },
  fitrPeople:   { az:'Ailə üzvləri sayı',     ru:'Кол-во членов семьи', ar:'عدد أفراد الأسرة',   tr:'Aile üyesi sayısı',     en:'Number of family members' },
  fitrAmount:   { az:'Hər nəfərə', ru:'На одного человека', ar:'عن كل فرد', tr:'Kişi başına', en:'Per person' },
  fitrTotal:    { az:'Cəmi əsas qida', ru:'Всего основной еды', ar:'إجمالي القوت', tr:'Toplam temel gıda', en:'Total staple food' },
  kg:           { az:'kq', ru:'кг', ar:'كغ', tr:'kg', en:'kg' },
  fitrNote:     { az:'Sünnəyə görə fitrə pulla deyil, ərzaqla (düyü, un, xurma, buğda və s. — yerli əsas qida) verilir.', ru:'По Сунне закят аль-фитр выдаётся не деньгами, а едой (рис, мука, финики, пшеница и т. п. — местная основная пища).', ar:'السنة إخراج زكاة الفطر طعامًا لا نقودًا: من قوت البلد كالأرز والدقيق والتمر والقمح.', tr:'Sünnete göre fıtır sadakası parayla değil, gıdayla (pirinç, un, hurma, buğday vb. — yerel temel gıda) verilir.', en:'According to the Sunnah, zakat al-fitr is given as food, not money (rice, flour, dates, wheat etc. — the local staple).' },
  sourceLabel:  { az:'Mənbə', ru:'Источник', ar:'المصدر', tr:'Kaynak', en:'Source' },
  goldPrice:    { az:'Qızıl qiyməti / qram',   ru:'Цена золота / грамм', ar:'سعر الذهب / غرام',  tr:'Altın fiyatı / gram',    en:'Gold price / gram'   },
  silverPrice:  { az:'Gümüş qiyməti / qram',   ru:'Цена серебра / грамм', ar:'سعر الفضة / غرام', tr:'Gümüş fiyatı / gram',   en:'Silver price / gram'  },
  totalLabel:   { az:'Zəkat hesabı üçün cəm', ru:'Итого для расчёта',  ar:'المجموع للحساب',     tr:'Hesap Toplamı',        en:'Total for Zakat'     },
  nisabLabel:   { az:'Nisab həddi',            ru:'Порог Нисаба',         ar:'حد النصاب',          tr:'Nisap Sınırı',         en:'Nisab Threshold'     },
  aboveNisab:   { az:'Nisab üzərindədir',     ru:'Выше нисаба',          ar:'يبلغ النصاب',        tr:'Nisap üzerinde',       en:'Above Nisab'         },
  belowNisab:   { az:'Nisab altındadır',      ru:'Ниже нисаба',          ar:'دون النصاب',         tr:'Nisap altında',        en:'Below Nisab'         },
  zakatDue:     { az:'Ödənilməli zəkat',      ru:'Закят к уплате',       ar:'الزكاة الواجبة',     tr:'Ödenecek Zekât',       en:'Zakat Due'           },
  nisabNote:    { az:'Nisabdan aşağı — zəkat vacib deyil', ru:'Ниже нисаба — закят не обязателен', ar:'أقل من النصاب — لا زكاة', tr:'Nisap altında — zekât gerekmez', en:'Below nisab — zakat not obligatory' },
  currency:     { az:'Valyuta',               ru:'Валюта',                ar:'العملة',             tr:'Para Birimi',           en:'Currency'            },
  rateLabel:    { az:'1 USD =',               ru:'1 USD =',               ar:'1 دولار =',            tr:'1 USD =',               en:'1 USD ='             },
  rateLoading:  { az:'Yüklənir...',           ru:'Загрузка...',           ar:'تحميل...',           tr:'Yükleniyor...',         en:'Loading...'          },
  assetsTitle:  { az:'Varlıqlarınız',         ru:'Ваши активы',           ar:'أصولك',              tr:'Varlıklarınız',         en:'Your Assets'         },
  resultTitle:  { az:'Zəkat nəticəsi',        ru:'Расчёт закята',         ar:'نتيجة الزكاة',       tr:'Zekât Sonucu',          en:'Zakat Result'        },
  perYear:      { az:'/ hicri il',            ru:'/ лунный год',           ar:'/ حول',              tr:'/ hicri yıl',           en:'/ lunar year'        },
  reset:        { az:'Sıfırla',               ru:'Сброс',                  ar:'إعادة',              tr:'Sıfırla',               en:'Reset'               },
  priceNote:    { az:'Qiymətlər təxminidir: qızıl ≈ {g}/q, gümüş ≈ {s}/q', ru:'Цены приблизительные: золото ≈ {g}/г, серебро ≈ {s}/г', ar:'الأسعار تقريبية: الذهب ≈ {g}/غ، الفضة ≈ {s}/غ', tr:'Fiyatlar yaklaşıktır: altın ≈ {g}/g, gümüş ≈ {s}/g', en:'Prices are approximate: gold ≈ {g}/g, silver ≈ {s}/g' },

  // ── Dizayn v3: hero, addımlar, qrafiklər, yeni bölmələr ──
  how: { az:'Yalnız əlinizdə bir hicri il qalan malı yazın. Kalkulyator cəmi nisabla müqayisə edir və 2.5%-ni göstərir. Borc zəkatı düşürmür — yalnız zəkat günündən əvvəl faktiki ödədiyiniz borc maldan çıxılır.', ru:'Вписывайте только то имущество, которое пролежало у вас лунный год. Калькулятор сравнит итог с нисабом и покажет 2,5 %. Долг не отменяет закят — вычитается лишь долг, фактически выплаченный до дня закята.', ar:'اكتب المال الذي حال عليه الحول عندك فقط، وتقارن الحاسبة المجموع بالنصاب وتُظهر ربع العشر. والدين لا يمنع الزكاة، وإنما يُخصم ما قضيته فعلًا قبل موعدها.', tr:'Yalnızca elinizde bir hicri yıl kalan malı yazın. Hesaplayıcı toplamı nisapla karşılaştırır ve %2,5’ini gösterir. Borç zekâtı düşürmez — yalnızca zekât gününden önce fiilen ödediğiniz borç maldan düşülür.', en:'Enter only wealth you have held for a full lunar year. The calculator compares the total with the nisab and shows 2.5% of it. Debt does not cancel zakat — only debt you actually pay off before the zakat date is taken out.' },
  statRate:     { az:'zəkat dərəcəsi', ru:'ставка закята', ar:'مقدار الزكاة', tr:'zekât oranı', en:'zakat rate' },
  statGold:     { az:'qızıl nisabı', ru:'нисаб золота', ar:'نصاب الذهب', tr:'altın nisabı', en:'gold nisab' },
  statSilver:   { az:'gümüş nisabı', ru:'нисаб серебра', ar:'نصاب الفضة', tr:'gümüş nisabı', en:'silver nisab' },
  statHawl:     { az:'hicri il (hövl)', ru:'лунный год (хауль)', ar:'حول هجري', tr:'hicri yıl (havl)', en:'lunar year (hawl)' },
  gUnit:        { az:'q', ru:'г', ar:'غ', tr:'g', en:'g' },
  actCalc:      { az:'Hesabla', ru:'Рассчитать', ar:'احسب', tr:'Hesapla', en:'Calculate' },
  actWho:       { az:'Zəkat kimə verilir?', ru:'Кому дают закят?', ar:'لمن تُعطى الزكاة؟', tr:'Zekât kime verilir?', en:'Who receives zakat?' },
  step1:        { az:'Valyuta və qiymətlər', ru:'Валюта и цены', ar:'العملة والأسعار', tr:'Para birimi ve fiyatlar', en:'Currency and prices' },
  step1Text:    { az:'Pul vahidini seçin. Qızıl və gümüşün bugünkü qiymətini bilirsinizsə, yazın — bilmirsinizsə təxmini qiymət götürülür.', ru:'Выберите валюту. Если знаете сегодняшнюю цену золота и серебра, впишите её — иначе берётся приблизительная.', ar:'اختر العملة، وإن عرفت سعر الذهب والفضة اليوم فاكتبه، وإلا أُخذ سعر تقريبي.', tr:'Para birimini seçin. Altın ve gümüşün bugünkü fiyatını biliyorsanız yazın — bilmiyorsanız yaklaşık fiyat alınır.', en:'Choose the currency. If you know today’s gold and silver prices, enter them — otherwise an approximate price is used.' },
  step2:        { az:'Bir il saxlanılan mal', ru:'Имущество, пролежавшее год', ar:'المال الذي حال عليه الحول', tr:'Bir yıl tutulan mal', en:'Wealth held for a year' },
  step3:        { az:'Borclar', ru:'Долги', ar:'الديون', tr:'Borçlar', en:'Debts' },
  step3Text: { az:'Borc zəkatın vacibliyinə mane olmur (İbn Baz və İbn Useyminin seçdiyi rəy). Yalnız zəkat günündən əvvəl faktiki ödədiyiniz borcu yazın — o, artıq sizin malınız deyil.', ru:'Долг не препятствует обязательности закята (мнение, избранное Ибн Базом и Ибн Усаймином). Впишите лишь долг, фактически выплачиваемый до дня закята, — это уже не ваше имущество.', ar:'الدين لا يمنع وجوب الزكاة (وهو اختيار ابن باز وابن عثيمين)، فاكتب فقط الدين الذي تقضيه فعلًا قبل موعد الزكاة لأنه لم يعد من مالك.', tr:'Borç zekâtın farziyetine engel değildir (İbn Bâz ve İbn Useymîn’in tercihi). Yalnızca zekât gününden önce fiilen ödediğiniz borcu yazın — o artık sizin malınız değildir.', en:'Debt does not prevent zakat from being due (the view chosen by Ibn Baz and Ibn Uthaymin). Enter only the debt you actually pay off before the zakat date — it is no longer your wealth.' },
  ofNisab:      { az:'Nisabın {p}%-i', ru:'{p} % нисаба', ar:'{p}٪ من النصاب', tr:'Nisabın %{p} kadarı', en:'{p}% of the nisab' },
  flowTitle:    { az:'Malınızın axını: zəkat haradan gəlir', ru:'Движение имущества: откуда берётся закят', ar:'مسار مالك: من أين تُخرج الزكاة', tr:'Malınızın akışı: zekât nereden çıkar', en:'How your wealth flows: where the zakat comes from' },
  flowTotal:    { az:'Cəm', ru:'Итого', ar:'المجموع', tr:'Toplam', en:'Total' },
  flowRest:     { az:'Sizdə qalır', ru:'Остаётся у вас', ar:'يبقى لك', tr:'Sizde kalır', en:'Stays with you' },
  flowDebt:     { az:'Ödənilən borc', ru:'Выплаченный долг', ar:'الدين المقضي', tr:'Ödenen borç', en:'Debt paid off' },
  flowBelow:    { az:'Cəm nisaba çatmır — bu il zəkat vacib deyil.', ru:'Итог не достигает нисаба — в этом году закят не обязателен.', ar:'المجموع دون النصاب، فلا زكاة هذا العام.', tr:'Toplam nisaba ulaşmıyor — bu yıl zekât gerekmez.', en:'The total is below the nisab — no zakat is due this year.' },
  compTitle:    { az:'Varlıqların tərkibi', ru:'Состав имущества', ar:'تركيب المال', tr:'Varlıkların dağılımı', en:'What your wealth is made of' },
  compCash:     { az:'Nağd və bank', ru:'Наличные и банк', ar:'النقد والبنك', tr:'Nakit ve banka', en:'Cash and bank' },
  compTrade:    { az:'Ticarət malı', ru:'Товары для торговли', ar:'عروض التجارة', tr:'Ticaret malı', en:'Trade goods' },
  compGold:     { az:'Qızıl', ru:'Золото', ar:'الذهب', tr:'Altın', en:'Gold' },
  compSilver:   { az:'Gümüş', ru:'Серебро', ar:'الفضة', tr:'Gümüş', en:'Silver' },
  ruleEy:       { az:'Qayda', ru:'Правило', ar:'القاعدة', tr:'Kural', en:'The rule' },
  ruleTitle:    { az:'Zəkat necə hesablanır?', ru:'Как рассчитывается закят?', ar:'كيف تُحسب الزكاة؟', tr:'Zekât nasıl hesaplanır?', en:'How is zakat calculated?' },
  ruleLead:     { az:'Dörd addım — kalkulyator da eyni ardıcıllıqla işləyir.', ru:'Четыре шага — калькулятор работает в том же порядке.', ar:'أربع خطوات، وتعمل الحاسبة بالترتيب نفسه.', tr:'Dört adım — hesaplayıcı da aynı sırayla çalışır.', en:'Four steps — the calculator follows the same order.' },
  r1:           { az:'Malı toplayın', ru:'Сложите имущество', ar:'اجمع المال', tr:'Malı toplayın', en:'Add up the wealth' },
  r1t:          { az:'Pul, bank hesabı, qızıl, gümüş və satış üçün saxlanılan malın bugünkü dəyəri.', ru:'Деньги, банковский счёт, золото, серебро и текущая стоимость товара для продажи.', ar:'النقود وحساب البنك والذهب والفضة وقيمة عروض التجارة اليوم.', tr:'Para, banka hesabı, altın, gümüş ve satış için tutulan malın bugünkü değeri.', en:'Money, bank balance, gold, silver and today’s value of goods held for sale.' },
  r2: { az:'Ödənən borcu çıxın', ru:'Вычтите выплаченный долг', ar:'اخصم الدين المقضيّ', tr:'Ödenen borcu düşün', en:'Subtract debt paid off' },
  r2t: { az:'Zəkat günündən əvvəl faktiki ödədiyiniz borcu cəmdən çıxın; qalan borclar zəkatı düşürmür.', ru:'Вычтите долг, выплаченный до дня закята; остальные долги закят не отменяют.', ar:'اخصم ما قضيته من الدين قبل موعد الزكاة، وبقية الديون لا تُسقطها.', tr:'Zekât gününden önce fiilen ödediğiniz borcu toplamdan düşün; kalan borçlar zekâtı düşürmez.', en:'Take out the debt you actually pay off before the zakat date; other debts do not cancel zakat.' },
  r3:           { az:'Nisabla müqayisə edin', ru:'Сравните с нисабом', ar:'قارن بالنصاب', tr:'Nisapla karşılaştırın', en:'Compare with the nisab' },
  r3t:          { az:'Qalan məbləğ nisaba çatıbsa və üzərindən bir hicri il keçibsə, zəkat vacibdir.', ru:'Если остаток достиг нисаба и над ним прошёл лунный год, закят обязателен.', ar:'إذا بلغ الباقي النصاب وحال عليه الحول وجبت الزكاة.', tr:'Kalan tutar nisaba ulaşmış ve üzerinden bir hicri yıl geçmişse zekât farzdır.', en:'If what remains reaches the nisab and a lunar year has passed over it, zakat is due.' },
  r4:           { az:'Qırxda birini verin', ru:'Отдайте сороковую часть', ar:'أخرج ربع العشر', tr:'Kırkta birini verin', en:'Give one fortieth' },
  r4t:          { az:'Məbləğin qırxda biri, yəni 2.5%-i zəkatdır.', ru:'Закят — сороковая часть суммы, то есть 2,5 %.', ar:'الزكاة ربع العشر، أي ٢٫٥٪ من المال.', tr:'Tutarın kırkta biri, yani %2,5’i zekâttır.', en:'Zakat is one fortieth of the amount, i.e. 2.5%.' },
  nisabChart:   { az:'Bu gün nisab: qızıl və gümüş', ru:'Нисаб сегодня: золото и серебро', ar:'النصاب اليوم: الذهب والفضة', tr:'Bugün nisap: altın ve gümüş', en:'The nisab today: gold and silver' },
  nisabChartSub:{ az:'seçilmiş valyutada, yuxarıdakı qiymətlərlə', ru:'в выбранной валюте, по ценам выше', ar:'بالعملة المختارة وبالأسعار أعلاه', tr:'seçilen para biriminde, yukarıdaki fiyatlarla', en:'in the chosen currency, at the prices above' },
  recEy:        { az:'Tövbə, 9:60', ru:'ат-Тауба, 9:60', ar:'التوبة: ٦٠', tr:'Tevbe, 9:60', en:'at-Tawbah 9:60' },
  recTitle:     { az:'Zəkat kimə verilir?', ru:'Кому выплачивается закят?', ar:'مصارف الزكاة', tr:'Zekât kimlere verilir?', en:'Who receives zakat?' },
  recLead:      { az:'Zəkatın kimlərə veriləcəyini Allah Quranda Özü səkkiz növ olaraq sayıb.', ru:'Аллах Сам перечислил в Коране восемь категорий получателей закята.', ar:'تولّى الله تعالى بيان مصارف الزكاة في كتابه، وهي ثمانية أصناف.', tr:'Zekâtın kimlere verileceğini Allah Kur’an’da bizzat sekiz sınıf olarak saymıştır.', en:'Allah Himself listed in the Quran the eight kinds of people who receive zakat.' },
  fitrEy:       { az:'Ramazanın sonu', ru:'Конец Рамадана', ar:'آخر رمضان', tr:'Ramazan’ın sonu', en:'End of Ramadan' },
  relTitle:     { az:'Əlaqəli bölmələr', ru:'Связанные разделы', ar:'أقسام ذات صلة', tr:'İlgili bölümler', en:'Related sections' },
  relFaq:       { az:'Zəkat haqqında suallar', ru:'Вопросы о закяте', ar:'أسئلة في الزكاة', tr:'Zekât hakkında sorular', en:'Questions about zakat' },
  relFaqSub:    { az:'Zinət qızılı, maaşdan yığım, ev və maşın — fətva nömrələri ilə', ru:'Украшения, накопления с зарплаты, дом и машина — с номерами фетв', ar:'الحلي والادخار من الراتب والبيت والسيارة — مع أرقام الفتاوى', tr:'Ziynet altını, maaştan birikim, ev ve araba — fetva numaralarıyla', en:'Jewellery, savings from a salary, house and car — with fatwa numbers' },
  relCharity:   { az:'Sədəqə gündəliyi', ru:'Дневник садаки', ar:'يوميات الصدقة', tr:'Sadaka günlüğü', en:'Charity diary' },
  relCharitySub:{ az:'Könüllü sədəqələrinizi qeyd edin', ru:'Записывайте добровольную милостыню', ar:'سجّل صدقاتك التطوعية', tr:'Gönüllü sadakalarınızı kaydedin', en:'Log your voluntary charity' },
  relDonate:    { az:'Sədəqənin fəziləti', ru:'Достоинства садаки', ar:'فضل الصدقة', tr:'Sadakanın fazileti', en:'The virtue of charity' },
  relDonateSub: { az:'Davamlı sədəqə və vermənin ədəbi', ru:'Постоянная милостыня и этикет', ar:'الصدقة الجارية وآداب العطاء', tr:'Sadaka-i cariye ve vermenin edebi', en:'Ongoing charity and the etiquette of giving' },
  relInh:       { az:'Miras hesablayıcısı', ru:'Калькулятор наследства', ar:'حاسبة المواريث', tr:'Miras hesaplayıcı', en:'Inheritance calculator' },
  relInhSub:    { az:'Quran paylarına görə bölgü', ru:'Раздел по долям Корана', ar:'القسمة على فروض القرآن', tr:'Kur’an paylarına göre taksim', en:'Division by the Quranic shares' },
  ayahTitle:    { az:'Namazı qılın, zəkatı verin', ru:'Совершайте намаз и выплачивайте закят', ar:'وأقيموا الصلاة وآتوا الزكاة', tr:'Namazı kılın, zekâtı verin', en:'Establish prayer and give zakat' },
  muadh:        { az:'Peyğəmbər ﷺ Muazı Yəmənə göndərəndə dedi: «…onlara öyrət ki, Allah onların mallarında zəkatı fərz edib: varlılarından alınıb kasıblarına verilir».', ru:'Отправляя Муаза в Йемен, Пророк ﷺ сказал: «…научи их, что Аллах обязал их выплачивать закят с имущества: он берётся у богатых и отдаётся бедным».', ar:'لما بعث النبي ﷺ معاذًا إلى اليمن قال: «…فأعلمهم أن الله افترض عليهم صدقة في أموالهم، تؤخذ من أغنيائهم وتُرد على فقرائهم».', tr:'Peygamber ﷺ Muaz’ı Yemen’e gönderirken şöyle dedi: “…onlara Allah’ın mallarında zekâtı farz kıldığını öğret: zenginlerinden alınır, fakirlerine verilir.”', en:'When the Prophet ﷺ sent Muʿadh to Yemen he said: “…teach them that Allah has made zakat obligatory on their wealth: it is taken from their rich and given to their poor.”' },
  muadhSrc:     { az:'Buxari 1395', ru:'аль-Бухари 1395', ar:'البخاري ١٣٩٥', tr:'Buhârî 1395', en:'al-Bukhari 1395' },
}

// Zəkatın 8 alıcısı — Tövbə 9:60 (ərəb mətni api.quran.com, Osmani yazı).
// Qısa izahlar fiqh kitablarındakı məşhur təriflərdir (məs. fəqir — ehtiyacının
// yarısını tapmayan, miskin — yarısını və ya çoxunu tapan, amma kifayət etməyən).
const AYAH_9_60 = '۞ إِنَّمَا ٱلصَّدَقَـٰتُ لِلْفُقَرَآءِ وَٱلْمَسَـٰكِينِ وَٱلْعَـٰمِلِينَ عَلَيْهَا وَٱلْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِى ٱلرِّقَابِ وَٱلْغَـٰرِمِينَ وَفِى سَبِيلِ ٱللَّهِ وَٱبْنِ ٱلسَّبِيلِ ۖ فَرِيضَةً مِّنَ ٱللَّهِ ۗ وَٱللَّهُ عَلِيمٌ حَكِيمٌ'
const RECIPIENTS = [
  { k:'fuqara', icon:'home', ar:'الفقراء',
    t:{ az:'Fəqirlər', en:'The poor', ru:'Бедняки', ar:'الفقراء', tr:'Fakirler' },
    d:{ az:'Heç nəyi olmayan və ya ehtiyacının yarısını belə tapmayanlar', en:'Those who have nothing, or less than half of what they need', ru:'Те, у кого нет ничего или меньше половины необходимого', ar:'من لا يجد شيئًا أو يجد أقل من نصف كفايته', tr:'Hiçbir şeyi olmayan ya da ihtiyacının yarısını bile bulamayanlar' } },
  { k:'masakin', icon:'user', ar:'المساكين',
    t:{ az:'Miskinlər', en:'The needy', ru:'Неимущие', ar:'المساكين', tr:'Miskinler' },
    d:{ az:'Ehtiyacının yarısını və ya çoxunu tapan, amma kifayət etməyənlər', en:'Those who have half or more of their needs, but not enough', ru:'Те, у кого есть половина необходимого или больше, но не хватает', ar:'من يجد نصف كفايته أو أكثرها دون تمامها', tr:'İhtiyacının yarısını veya çoğunu bulup yetmeyenler' } },
  { k:'amilin', icon:'list', ar:'العاملون عليها',
    t:{ az:'Zəkat işçiləri', en:'Zakat workers', ru:'Сборщики закята', ar:'العاملون عليها', tr:'Zekât görevlileri' },
    d:{ az:'Hökmdarın zəkatı toplamaq və bölmək üçün təyin etdiyi şəxslər', en:'People appointed by the ruler to collect and distribute it', ru:'Назначенные правителем для сбора и распределения закята', ar:'من يوليهم الإمام جمعها وتوزيعها', tr:'Yöneticinin zekâtı toplamak ve dağıtmak için atadığı kişiler' } },
  { k:'muallafa', icon:'jamaat', ar:'المؤلفة قلوبهم',
    t:{ az:'Qəlbləri isindiriləcək olanlar', en:'Those whose hearts are to be reconciled', ru:'Те, чьи сердца хотят расположить', ar:'المؤلفة قلوبهم', tr:'Kalpleri ısındırılacak olanlar' },
    d:{ az:'Məsələn, imanı möhkəmlənsin deyə yeni müsəlman', en:'For example, a new Muslim whose faith is to be strengthened', ru:'Например, новый мусульманин, чтобы укрепить его веру', ar:'كمن أسلم حديثًا ليقوى إيمانه', tr:'Örneğin imanı güçlensin diye yeni Müslüman olan' } },
  { k:'riqab', icon:'shield', ar:'في الرقاب',
    t:{ az:'Azad etmək üçün', en:'Freeing those in bondage', ru:'Освобождение невольников', ar:'في الرقاب', tr:'Köle azadı için' },
    d:{ az:'Kölələri azad etmək və müsəlman əsirləri fidyə ilə qurtarmaq', en:'Freeing slaves and ransoming Muslim captives', ru:'Освобождение рабов и выкуп пленных мусульман', ar:'عتق الرقيق وفكاك الأسرى من المسلمين', tr:'Köleleri azat etmek ve Müslüman esirleri fidyeyle kurtarmak' } },
  { k:'gharimin', icon:'minus', ar:'الغارمون',
    t:{ az:'Borclular', en:'Debtors', ru:'Должники', ar:'الغارمون', tr:'Borçlular' },
    d:{ az:'Halal borcunu ödəyə bilməyənlər', en:'Those unable to repay a lawful debt', ru:'Те, кто не может выплатить дозволенный долг', ar:'من عجز عن سداد دين مباح', tr:'Helal borcunu ödeyemeyenler' } },
  { k:'sabilillah', icon:'compass', ar:'في سبيل الله',
    t:{ az:'Allah yolunda', en:'In the cause of Allah', ru:'На пути Аллаха', ar:'في سبيل الله', tr:'Allah yolunda' },
    d:{ az:'Allah yolunda cihad edənlər', en:'Those striving in jihad in the path of Allah', ru:'Сражающиеся на пути Аллаха', ar:'الغزاة المجاهدون في سبيل الله', tr:'Allah yolunda cihad edenler' } },
  { k:'ibnsabil', icon:'pin', ar:'ابن السبيل',
    t:{ az:'Yolda qalmış müsafir', en:'The stranded traveller', ru:'Путник', ar:'ابن السبيل', tr:'Yolda kalmış yolcu' },
    d:{ az:'Evində varlı olsa da, səfərdə pulsuz qalan', en:'One left without means on a journey, even if wealthy at home', ru:'Оставшийся без средств в пути, даже если дома богат', ar:'المسافر المنقطع ولو كان غنيًا في بلده', tr:'Memleketinde zengin olsa da yolculukta parasız kalan' } },
]
const s = (k, l) => L[k]?.[l] || L[k]?.en || ''
const pickL = (o, l) => o?.[l] || o?.en || ''

// ── Ayə: mətn yaddaşdan yazılmır, alquran.cloud-dan gəlir ──
// Ərəbcə Osmani yazısı + cari dilin tərcüməsi (ərəbcədə yalnız əsl mətn).
// Sessiya ərzində sessionStorage-də saxlanılır; sorğu alınmasa kart görünmür.
const AYAH_AR = 'quran-uthmani'
const AYAH_EDITIONS = { az:'az.mammadaliyev', en:'en.asad', ru:'ru.kuliev', tr:'tr.diyanet' }

function readAyah(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const d = JSON.parse(raw)
    return d && typeof d.ar === 'string' && d.ar ? d : null
  } catch {
    return null
  }
}

function useAyah(ref, lang) {
  const edition = lang === 'ar' ? '' : (pickUi(AYAH_EDITIONS, lang, 'en'))
  const key = `zakat_ayah_${ref.replace(':', '_')}_${lang}`
  const [state, setState] = useState(() => ({ key, data: readAyah(key) }))

  useEffect(() => {
    const cached = readAyah(key)
    if (cached) { setState({ key, data: cached }); return undefined }
    setState({ key, data: null })

    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10000)
    const eds = edition ? `${AYAH_AR},${edition}` : AYAH_AR
    fetch(`https://api.alquran.cloud/v1/ayah/${ref}/editions/${eds}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : (json?.data ? [json.data] : [])
        const arabic = list.find(a => a?.edition?.identifier === AYAH_AR)
        const trans = edition ? list.find(a => a?.edition?.identifier === edition) : null
        if (!arabic?.text || (edition && !trans?.text)) throw new Error('bad response')
        const data = { ar: arabic.text, text: trans?.text || '' }
        try { sessionStorage.setItem(key, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
        if (alive) setState({ key, data })
      })
      .catch(() => { if (alive) setState({ key, data: null }) })
      .finally(() => clearTimeout(timer))

    return () => {
      alive = false
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [key, ref, edition])

  // Dil dəyişəndə köhnə dilin ayəsi bir anlıq da görünməsin
  return state.key === key ? state.data : readAyah(key)
}

// "Hərəkəti azalt" seçilibmi? (say-artım animasiyası onda dərhal son dəyəri göstərir)
const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/** Say-artım (count-up): dəyər dəyişəndə rəqəm köhnədən yenisinə ~0.65 san.
 *  ərzində yumşaq "axır" (yalnız mətn dəyişir — layout/transform yoxdur).
 *  Hesablama düsturuna toxunmur: yalnız GÖSTƏRİLƏN rəqəmdir, son kadr
 *  dəqiq hədəf dəyərdir. Hərəkət azaldılıbsa — dərhal son dəyər. */
function useCountUp(target, duration = 650) {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    const start = from.current
    if (start === target) return undefined
    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      from.current = target
      setShown(target)
      return undefined
    }
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const val = p === 1 ? target : start + (target - start) * eased
      from.current = val
      setShown(val)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return shown
}

/** Animasiyalı pul məbləği: <Money value={…} symbol="₼" fmt={fmt} /> */
function Money({ value, symbol, fmt, className = '' }) {
  const v = useCountUp(value)
  return <span className={`zakat-money ui-num${className ? ' ' + className : ''}`}>{symbol}{fmt(v)}</span>
}

// ── Varlıq sahəsi (dizayn v2): ikon + etiket → valyuta önəkli sahə → izah.
// Bütün blok <label>-dir: ikona və ya yazıya toxunmaq da sahəni fokuslayır.
// tone — ikon kafelinin variantı (ui-icon-tile--accent | --neutral | susma brend)
function ZakatField({ icon, tone = '', label, prefix, value, onChange, placeholder = '0', hint = null, className = '' }) {
  return (
    <label className={`ui-field zakat-field${className ? ' ' + className : ''}`}>
      <span className="zakat-field-head">
        <span className={`ui-icon-tile ui-icon-tile--sm${tone ? ` ui-icon-tile--${tone}` : ''}`}><Icon name={icon} /></span>
        <span className="ui-field__label">{label}</span>
      </span>
      <span className="zakat-input-wrap">
        <span className="zakat-cur-prefix" aria-hidden="true"><bdi>{prefix}</bdi></span>
        {/* Mətn sahəsi (inputMode="decimal"): type="number" iPhone-da vergüllü onluğu qəbul etmirdi */}
        <input type="text" inputMode="decimal" autoComplete="off" spellCheck={false} className="ui-input zakat-input"
          value={value} placeholder={placeholder}
          aria-invalid={parseAmount(value) < 0 || undefined}
          onChange={e => onChange(cleanAmountInput(e.target.value))} />
      </span>
      {hint && <span className="ui-field__hint zakat-field-hint">{hint}</span>}
    </label>
  )
}

/** Kalkulyatorun nömrəli addımı (dizayn v3): nömrə · başlıq · bir cümlə → sahələr */
function CalcStep({ n, title, text, id, children, className = '' }) {
  return (
    <li className={`ui-card zakat-step${className ? ' ' + className : ''}`} aria-labelledby={id}>
      <div className="zakat-step__head">
        <span className="zakat-step__n ui-num" aria-hidden="true">{n}</span>
        <div className="zakat-step__intro">
          <h2 className="zakat-step__title" id={id}>{title}</h2>
          {text && <p className="zakat-step__text">{text}</p>}
        </div>
      </div>
      {children}
    </li>
  )
}

export default function ZakatPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang)?.zakat || T.az.zakat
  const l = ['az','ru','ar','tr'].includes(lang) ? lang : 'en'
  const navigate = useNavigate()

  const [currency,    setCurrency]    = useState('AZN')
  const [rates,       setRates]       = useState(FALLBACK)
  const [rateLoading, setRateLoading] = useState(true)
  const [savings,     setSavings]     = useState('')
  const [salarySaved, setSalarySaved] = useState('')
  // Canlı qiymət (USD/qram) və tarixi; null — ehtiyat qiymət işlənir
  const [metals,      setMetals]      = useState(null)
  const [other,       setOther]       = useState('')
  const [gold,        setGold]        = useState('')
  const [silver,      setSilver]      = useState('')
  const [stocks,      setStocks]      = useState('')
  const [debt,        setDebt]        = useState('')
  const [fitrPeople,  setFitrPeople]  = useState('1')
  // Nisab əsası: 'silver' (kasıblar üçün daha faydalı — standart) və ya 'gold'
  const [nisabBasis,  setNisabBasis]  = useState('silver')
  // İstifadəçinin yazdığı qiymət (seçilmiş valyutada, 1 qram); boşdursa təxmini qiymət
  const [goldPriceIn,   setGoldPriceIn]   = useState('')
  const [silverPriceIn, setSilverPriceIn] = useState('')
  const ayah = useAyah('2:43', lang)
  const ayahRec = useAyah('9:60', lang)
  const dueRef = useRef(null)

  // Yapışqan cəm zolağına toxunanda "Ödənilməli Zəkat" kartına keç
  const scrollToDue = () => {
    let smooth = true
    try { smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { /* köhnə brauzer */ }
    dueRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
  }

  useEffect(() => {
    const fromOld = () => fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => {
        if (d.rates) {
          const r = {}
          CURRENCIES.forEach(c => { r[c.code] = d.rates[c.code] || FALLBACK[c.code] })
          setRates(r)
        }
      })
      .catch(() => {})
    // Əsas mənbə: valyuta + qızıl/gümüş birlikdə
    fetch(METALS_URL)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => {
        const u = d?.usd
        if (!u) throw new Error('bad')
        const r = {}
        CURRENCIES.forEach(c => { const x = Number(u[c.code.toLowerCase()]); r[c.code] = Number.isFinite(x) && x > 0 ? x : FALLBACK[c.code] })
        r.USD = 1
        setRates(r)
        const g = 1 / Number(u.xau) / TROY_OZ_G, sv = 1 / Number(u.xag) / TROY_OZ_G
        if (Number.isFinite(g) && g > 10 && g < 1000 && Number.isFinite(sv) && sv > 0.1 && sv < 20) setMetals({ gold: g, silver: sv, date: String(d.date || '') })
      })
      .catch(() => fromOld())
      .finally(() => setRateLoading(false))
  }, [])

  const cur      = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]
  const rate     = rates[currency] || 1

  // Mənfi, sonsuz (1e999) və ya boş dəyər hesabı pozmasın: yalnız sonlu, ≥ 0 ədəd.
  // Əvvəl "-5000" yığımı cəmdən çıxırdı, mənfi borc isə cəmə əlavə olunurdu.
  const n = v => { const x = parseAmount(v); return Number.isFinite(x) && x > 0 ? x : 0 }

  // 1 qramın qiyməti seçilmiş valyutada (istifadəçi yazıbsa — onun dəyəri)
  const goldBase    = (metals?.gold ?? GOLD_USD_PER_G) * rate
  const silverBase  = (metals?.silver ?? SILVER_USD_PER_G) * rate
  const goldPrice   = n(goldPriceIn)   || goldBase
  const silverPrice = n(silverPriceIn) || silverBase
  const nisabGoldVal   = NISAB_GOLD_G * goldPrice
  const nisabSilverVal = NISAB_SILVER_G * silverPrice
  const nisabLoc = nisabBasis === 'gold' ? nisabGoldVal : nisabSilverVal

  // Yalnız bir il saxlanılan varlıqlar (maaş/icarə ×12 YOXDUR — bax faylın başı)
  const savingsVal   = n(savings) + n(salarySaved)
  const otherVal     = n(other)
  const goldVal      = n(gold) * goldPrice
  const silverVal    = n(silver) * silverPrice
  const stocksVal    = n(stocks)
  const debtVal      = n(debt)

  const totalAssets = savingsVal + otherVal + goldVal + silverVal + stocksVal
  const total       = Math.max(totalAssets - debtVal, 0)
  const aboveNisab  = total >= nisabLoc
  const zakatYear   = aboveNisab ? total * 0.025 : 0

  // Fitrə — ərzaqla: hər nəfərə bir sa' (≈3 kq) əsas qida
  const fitrCount   = Math.floor(n(fitrPeople))   // 2.5 nəfər olmur
  const fitrTotalKg = SAA_KG * fitrCount
  const fmtKg = v => `${v.toLocaleString(NUM_LOCALES[lang] || 'en-US', { maximumFractionDigits: 1 })} ${s('kg', l)}`

  // Rəqəm formatı saytın dilinə görədir (əvvəl brauzerin dili idi: ru səhifədə "1,234.56",
  // sıfır isə həmişə "0.00" — eyni kartda iki fərqli format). Ərəbcədə latın rəqəmləri.
  const fmt = v => (Number.isFinite(v) ? v : 0).toLocaleString(NUM_LOCALES[lang] || 'en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
  const money = v => `${cur.symbol}${fmt(v)}`
  const pct  = nisabLoc > 0 ? Math.min((total / nisabLoc) * 100, 100) : 0
  // Pul sahələrinin yer tutucusu da saytın dilinə görə ("0,00" ru/az/tr-də;
  // əvvəl hər dildə "0.00" idi, nəticə kartlarında isə "0,00")
  const moneyPh = fmt(0)

  const reset = () => { setSavings(''); setSalarySaved(''); setOther(''); setGold(''); setSilver(''); setStocks(''); setDebt(''); setFitrPeople('1'); setGoldPriceIn(''); setSilverPriceIn('') }

  // Cəm cədvəlinin sətirləri (sıfır olan isteğe bağlı sətirlər gizlənir)
  const rows = [
    { k: 'savings', icon: 'shield',    label: s('savingsLabel',l), val: savingsVal, show: true },
    { k: 'other',   icon: 'list',      label: s('otherLabel',l),   val: otherVal, show: true },
    { k: 'gold',    icon: 'zakat',     label: s('goldLabel',l),    val: goldVal, show: n(gold) > 0 },
    { k: 'silver',  icon: 'zakat',     label: s('silverLabel',l),  val: silverVal, show: n(silver) > 0 },
    { k: 'stocks',  icon: 'analytics', label: s('stocksLabel',l),  val: stocksVal, show: n(stocks) > 0 },
  ]

  // Tərkib qrafiki — 4 qrup (viz palitrası 4 rəngdir): nağd+digər, ticarət, qızıl, gümüş
  const comp = [
    { key: 'cash',   label: s('compCash', l),   value: savingsVal + otherVal, tone: 1 },
    { key: 'trade',  label: s('compTrade', l),  value: stocksVal, tone: 3 },
    { key: 'gold',   label: s('compGold', l),   value: goldVal, tone: 2 },
    { key: 'silver', label: s('compSilver', l), value: silverVal, tone: 4 },
  ].filter(x => x.value > 0)

  const gU = s('gUnit', l)
  // Qiymət sahəsinin altı: canlı qiymətin tarixi və ya "təxmini"
  const priceNote = metals ? `${s('livePrice', l).replace('{d}', metals.date)} · ${s('priceHint', l)}` : (rateLoading ? s('priceHint', l) : s('approxPrice', l))
  const openLearn = (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(pathFor('learn', lang, 'fiqh-faq') + '#zakat')
  }
  const related = [
    { to: 'charity', icon: 'charity', title: s('relCharity', l), sub: s('relCharitySub', l) },
    { to: 'donate', icon: 'donate', title: s('relDonate', l), sub: s('relDonateSub', l) },
    { to: 'inheritance', icon: 'inheritance', title: s('relInh', l), sub: s('relInhSub', l) },
  ]

  return (
    <div className="zakat-page">
      {/* Hero — v3: kompakt; eyebrow · h1 · bir cümlə · necə işlədilir · 4 açar rəqəm */}
      <header className="ui-page-hero zakat-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('zakat'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.subtitle}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {s('how', l)}</p>
          <ul className="ui-page-hero__stats zakat-hero-stats">
            <li><b className="ui-num">2.5%</b><span>{s('statRate', l)}</span></li>
            <li><b className="ui-num">{NISAB_GOLD_G} {gU}</b><span>{s('statGold', l)}</span></li>
            <li><b className="ui-num">{NISAB_SILVER_G} {gU}</b><span>{s('statSilver', l)}</span></li>
            <li><b className="ui-num">1</b><span>{s('statHawl', l)}</span></li>
          </ul>
          <div className="ui-page-hero__actions">
            <ShineButton as="a" size="sm" href="#zakat-calc" icon={<Icon name="zakat" className="ui-btn__icon" />}>
              {' '}{s('actCalc', l)}
            </ShineButton>
            <a className="ui-btn ui-btn--secondary ui-btn--sm" href="#zakat-recipients">{s('actWho', l)}</a>
          </div>
        </div>
      </header>

      {/* ══ Kalkulyator: 3 nömrəli addım | yapışqan nəticə sütunu ══ */}
      <section id="zakat-calc" className="ui-section ui-section--tight zakat-calc">
        <div className="ui-container zakat-layout">

          <div className="zakat-inputs">
            <ol className="zakat-steps">
              {/* 1 — Valyuta, nisab əsası, qiymətlər */}
              <CalcStep n={1} id="zakat-step-1" title={s('step1', l)} text={s('step1Text', l)}>
                <div className="zakat-currency-header">
                  <span className="zakat-block-label" id="zakat-cur-label">
                    <Icon name="globe" size={16} /> {s('currency',l)}
                  </span>
                  {rateLoading
                    ? <span className="ui-badge zakat-rate-badge">{s('rateLoading',l)}</span>
                    : <span className="ui-badge ui-badge--brand zakat-rate-badge">{s('rateLabel',l)} <strong className="ui-num">{fmt(rate)} {cur.symbol}</strong></span>
                  }
                </div>
                <div className="zakat-currency-grid" role="group" aria-labelledby="zakat-cur-label">
                  {CURRENCIES.map(c => (
                    <button key={c.code} type="button"
                      className="ui-chip zakat-cur-btn"
                      aria-pressed={currency === c.code}
                      onClick={() => setCurrency(c.code)}
                    >
                      <span>{c.code}</span>
                      <small aria-hidden="true">{c.symbol}</small>
                    </button>
                  ))}
                </div>

                <div className="zakat-basis">
                  <span className="zakat-block-label" id="zakat-basis-label">{s('nisabBasis',l)}</span>
                  <div className="ui-segmented zakat-basis__seg" role="radiogroup" aria-labelledby="zakat-basis-label">
                    {['silver', 'gold'].map(b => (
                      <button key={b} type="button" role="radio" aria-checked={nisabBasis === b}
                        onClick={() => setNisabBasis(b)}>
                        {s(b === 'silver' ? 'basisSilver' : 'basisGold', l)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="zakat-fields">
                  <ZakatField icon="zakat" tone="accent" label={s('goldPrice',l)} prefix={cur.symbol} placeholder={fmt(goldBase)}
                    value={goldPriceIn} onChange={setGoldPriceIn} hint={priceNote} />
                  <ZakatField icon="zakat" tone="neutral" label={s('silverPrice',l)} prefix={cur.symbol} placeholder={fmt(silverBase)}
                    value={silverPriceIn} onChange={setSilverPriceIn} hint={priceNote} />
                </div>
              </CalcStep>

              {/* 2 — Bir il saxlanılan mal (hövl qaydası) */}
              <CalcStep n={2} id="zakat-step-2" title={s('step2', l)} text={s('hawlNote', l)}>
                <p className="zakat-src">{s('sourceLabel',l)}: <a href="https://islamqa.info/en/answers/26113" target="_blank" rel="noopener noreferrer">{s('hawlSrc',l)}</a></p>
                <div className="ui-callout zakat-salary" data-testid="zakat-salary">
                  <Icon name="info" size={18} />
                  <div><strong className="ui-callout__title">{s('salaryTitle',l)}</strong><p>{s('salaryText',l)}</p></div>
                </div>
                <div className="zakat-fields">
                  <ZakatField icon="shield" label={s('savingsLabel',l)} prefix={cur.symbol} placeholder={moneyPh}
                    value={savings} onChange={setSavings} />
                  <ZakatField icon="clock" label={s('salaryLabel',l)} prefix={cur.symbol} placeholder={moneyPh}
                    value={salarySaved} onChange={setSalarySaved} hint={s('salaryHint',l)} />
                  <ZakatField icon="list" label={s('otherLabel',l)} prefix={cur.symbol} placeholder={moneyPh}
                    value={other} onChange={setOther} />
                  <ZakatField icon="analytics" label={s('stocksLabel',l)} prefix={cur.symbol} placeholder={moneyPh}
                    value={stocks} onChange={setStocks} hint={s('stocksHint',l)} />
                  <ZakatField icon="zakat" tone="accent" label={s('goldLabel',l)} prefix={gU} placeholder="0"
                    value={gold} onChange={setGold}
                    hint={n(gold) > 0 && <b className="zakat-ltr ui-num">≈ {money(goldVal)}</b>} />
                  <ZakatField icon="zakat" tone="neutral" label={s('silverLabel',l)} prefix={gU} placeholder="0"
                    value={silver} onChange={setSilver}
                    hint={n(silver) > 0 && <b className="zakat-ltr ui-num">≈ {money(silverVal)}</b>} />
                </div>
              </CalcStep>

              {/* 3 — Borclar */}
              <CalcStep n={3} id="zakat-step-3" title={s('step3', l)} text={s('step3Text', l)}>
                <div className="zakat-fields">
                  <ZakatField icon="minus" tone="neutral" label={s('debtLabel',l)} prefix={`−${cur.symbol}`} placeholder={moneyPh}
                    value={debt} onChange={setDebt} className="zakat-field-debt" />
                </div>
              </CalcStep>
            </ol>

            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm zakat-reset-btn" onClick={reset}>
              <Icon name="refresh" className="ui-btn__icon" /> {s('reset',l)}
            </button>

            {/* Tək sütunlu düzümdə: yazdıqca zəkat məbləği ekranın altında
                görünür (sahələr bitənə qədər yapışqan qalır); toxunanda nəticəyə keçir.
                İki sütunlu düzümdə gizlidir — nəticə sütunu yanda görünür. */}
            {totalAssets > 0 && (
              <button type="button" className="zakat-sticky-sum" onClick={scrollToDue}>
                <span className="zakat-sticky-text">
                  <span className="zakat-sticky-title">{s('zakatDue',l)}</span>
                  <span className={`zakat-sticky-sub ${aboveNisab ? 'yes' : 'no'}`}>
                    {aboveNisab ? s('aboveNisab',l) : s('belowNisab',l)}
                  </span>
                </span>
                <span className="zakat-sticky-amount-wrap">
                  <Money value={zakatYear} symbol={cur.symbol} fmt={fmt} className="zakat-sticky-amount" />
                  <span className="zakat-sticky-period">{s('perYear',l)}</span>
                </span>
                <Icon name="chevronDown" size={18} className="zakat-sticky-chev" />
              </button>
            )}
          </div>

          {/* ══ Nəticə ══ */}
          <aside className="zakat-result" aria-label={s('resultTitle', l)}>

            {/* Ödənilməli zəkat — nisab keçiləndə kart tünd zümrüdə keçir */}
            <div ref={dueRef} key={aboveNisab ? 'on' : 'off'}
              className={`ui-card zakat-due-card ${aboveNisab ? 'ui-card--inverse active' : 'inactive'}`}>
              {aboveNisab && <GeoStarfield className="zakat-due-sky" />}
              {aboveNisab && <Sparkle count={12} radius={84} />}
              <div className="zakat-due-top">
                <span className="zakat-due-label">{s('zakatDue',l)}</span>
                <span className={`zakat-due-status ${aboveNisab ? 'yes' : 'no'}`}>
                  <Icon name={aboveNisab ? 'check' : 'info'} size={14} />
                  {aboveNisab ? s('aboveNisab',l) : s('belowNisab',l)}
                </span>
              </div>
              {aboveNisab
                ? <Money value={zakatYear} symbol={cur.symbol} fmt={fmt} className="zakat-due-amount" />
                : <div className="zakat-due-amount zakat-money ui-num">{money(0)}</div>}
              <div className="zakat-due-period">
                {aboveNisab ? <><span className="ui-num">2.5%</span> {s('perYear',l)}</> : s('nisabNote',l)}
              </div>

              {/* Nisab ölçəni — cəmin nisaba nisbəti */}
              <div className="zakat-meter">
                <div className="zakat-meter__row">
                  <span>{s('nisabLabel',l)}</span>
                  <b className="zakat-ltr ui-num">{money(nisabLoc)}</b>
                </div>
                <ProgressBar value={Math.round(pct)} max={100} label={s('nisabLabel',l)} tone={aboveNisab ? 2 : 1} className="zakat-meter__bar" />
                <div className="zakat-meter__row zakat-meter__row--sub">
                  <span>{s('ofNisab', l).replace('{p}', String(Math.round(pct)))}</span>
                  <span className="zakat-ltr ui-num">{money(total)} / {money(nisabLoc)}</span>
                </div>
              </div>
            </div>

            {/* Axın: varlıqlar → cəm → zəkat / qalan */}
            {comp.length > 0 && (
              <ZakatFlow sources={comp} debt={Math.min(debtVal, totalAssets)} net={total} zakat={zakatYear} above={aboveNisab} money={money}
                labels={{ title: s('flowTitle', l), total: s('flowTotal', l), debt: s('flowDebt', l), zakat: s('zakatDue', l), rest: s('flowRest', l), below: s('flowBelow', l) }} />
            )}

            {/* Cəm: tərkib qrafiki + sətirlər */}
            <div className="ui-card zakat-breakdown" data-reveal="fade">
              <h2 className="zakat-block-label zakat-breakdown-title">
                <Icon name="analytics" size={16} /> {s('resultTitle',l)}
              </h2>
              {comp.length > 0 && (
                <div className="zakat-comp">
                  <span className="zakat-comp__title">{s('compTitle', l)}</span>
                  <SegmentBreakdown items={comp} format={money} label={s('compTitle', l)} lang={lang} className="zakat-comp__bar" />
                </div>
              )}
              <ul className="breakdown-list tm-cascade">
                {rows.filter(r => r.show).map(r => (
                  <li key={r.k} className="breakdown-row">
                    <span className="breakdown-icon" aria-hidden="true"><Icon name={r.icon} size={16} /></span>
                    <span className="breakdown-label">{r.label}</span>
                    <span className="breakdown-val ui-num">{money(r.val)}</span>
                  </li>
                ))}
                {n(debt) > 0 && (
                  <li className="breakdown-row breakdown-debt">
                    <span className="breakdown-icon" aria-hidden="true"><Icon name="minus" size={16} /></span>
                    <span className="breakdown-label">{s('debtLabel',l)}</span>
                    <span className="breakdown-val ui-num">−{money(debtVal)}</span>
                  </li>
                )}
              </ul>
              <div className="breakdown-total">
                <span>{s('totalLabel',l)}</span>
                <Money value={total} symbol={cur.symbol} fmt={fmt} className="total-amount" />
              </div>
              <p className="zakat-note">{t.note}</p>
              <p className="zakat-note">
                {s('priceNote',l)
                  .replace('{g}', money(goldPrice))
                  .replace('{s}', money(silverPrice))}
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ══ Qayda: 4 addım + nisab müqayisəsi ══ */}
      <section className="ui-section ui-section--alt zakat-rule">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{s('ruleEy', l)}</span>
            <h2 className="ui-title">{s('ruleTitle', l)}</h2>
            <p className="ui-lead">{s('ruleLead', l)}</p>
          </div>
          <ol className="ui-steps ui-steps--row zakat-rule__steps" data-reveal="stagger-blur">
            {[1, 2, 3, 4].map(i => (
              <li key={i} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i}</span>
                <div className="ui-step__body">
                  <h3 className="ui-step__title">{s(`r${i}`, l)}</h3>
                  <p className="ui-step__text">{s(`r${i}t`, l)}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="zakat-rule__grid">
            <ChartFigure title={s('nisabChart', l)} sub={s('nisabChartSub', l)}>
              <BarChart
                label={s('nisabChart', l)}
                labelWidth="32%"
                format={money}
                data={[
                  { key: 'gold', label: `${s('compGold', l)} · ${NISAB_GOLD_G} ${gU}`, value: nisabGoldVal, tone: 2, muted: nisabBasis !== 'gold' },
                  { key: 'silver', label: `${s('compSilver', l)} · ${NISAB_SILVER_G} ${gU}`, value: nisabSilverVal, tone: 4, muted: nisabBasis !== 'silver' },
                ]}
              />
            </ChartFigure>
            <div className="zakat-rule__text">
              <p>{s('nisabExplain',l)}</p>
              <p className="zakat-src">{s('sourceLabel',l)}: <a href="https://islamqa.info/en/answers/2795" target="_blank" rel="noopener noreferrer">{s('nisabSrc',l)}</a></p>
              <figure className="ui-quote zakat-hadith">
                <blockquote><p className="ui-quote__text">{s('muadh', l)}</p></blockquote>
                <figcaption className="ui-quote__src">— {s('muadhSrc', l)}</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Zəkatın 8 alıcısı (Tövbə 9:60) ══ */}
      <section id="zakat-recipients" className="ui-section zakat-rec ui-cv" style={{ '--cv-h': '900px' }}>
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{s('recEy', l)}</span>
            <h2 className="ui-title">{s('recTitle', l)}</h2>
            <p className="ui-lead">{s('recLead', l)}</p>
          </div>
          <ol className="zakat-rec__grid" data-reveal="stagger">
            {RECIPIENTS.map((r, i) => (
              <li key={r.k} className="zakat-rec__item">
                <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={r.icon} /></span>
                <span className="zakat-rec__body">
                  <span className="zakat-rec__title"><span className="zakat-rec__n ui-num">{i + 1}</span> {pickL(r.t, l)}</span>
                  {l !== 'ar' && <span className="zakat-rec__ar" lang="ar" dir="rtl">{r.ar}</span>}
                  <span className="zakat-rec__text">{pickL(r.d, l)}</span>
                </span>
              </li>
            ))}
          </ol>
          <figure className="ui-quote zakat-ayah">
            <blockquote>
              <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{ayahRec?.ar || AYAH_9_60}</p>
              {ayahRec?.text && <p className="ui-quote__text">«{ayahRec.text}»</p>}
            </blockquote>
            <figcaption className="ui-quote__src">— {localizeSource('Tövbə 9:60', lang)}</figcaption>
          </figure>
        </div>
      </section>

      {/* ══ Fitrə zəkatı ══ */}
      <section id="zakat-fitr" className="ui-section ui-section--alt zakat-fitr ui-cv" style={{ '--cv-h': '520px' }}>
        <div className="ui-container zakat-fitr__wrap">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{s('fitrEy', l)}</span>
            <h2 className="ui-title">{s('fitrTitle',l)}</h2>
            <p className="ui-lead">{s('fitrDesc',l)}</p>
          </div>
          <div className="ui-card fitr-card">
            <div className="fitr-row">
              <label className="fitr-label" htmlFor="zakat-fitr-people">{s('fitrPeople',l)}</label>
              <input id="zakat-fitr-people" type="number" inputMode="numeric" className="ui-input fitr-input" min="1" value={fitrPeople}
                onChange={e => setFitrPeople(e.target.value)} />
            </div>
            <div className="fitr-stats">
              <div className="fitr-stat">
                <span className="fitr-label">{s('fitrAmount',l)}</span>
                <span className="fitr-val ui-num">≈ {fmtKg(SAA_KG)}</span>
              </div>
              <div className="fitr-stat fitr-stat--total">
                <span className="fitr-label">{s('fitrTotal',l)}</span>
                <span className="fitr-total-val zakat-money ui-num">≈ {fmtKg(fitrTotalKg)}</span>
              </div>
            </div>
            <p className="fitr-note">{s('fitrNote',l)}</p>
            <p className="fitr-note zakat-src">{s('sourceLabel',l)}: {localizeSource('Buxari 1503, 1506', lang)} · <a href="https://islamqa.info/en/answers/1396" target="_blank" rel="noopener noreferrer">islamqa.info 1396</a></p>
          </div>
        </div>
      </section>

      {/* ══ Ayə + əlaqəli bölmələr ══ */}
      <section className="ui-section ui-section--tight zakat-end ui-cv" style={{ '--cv-h': '520px' }}>
        <div className="ui-container zakat-end__grid">
          {ayah ? (
            <figure className="ui-quote zakat-ayah">
              <blockquote>
                <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{ayah.ar}</p>
                {ayah.text && <p className="ui-quote__text">«{ayah.text}»</p>}
              </blockquote>
              <figcaption className="ui-quote__src">— {localizeSource('Bəqərə 2:43', lang)}</figcaption>
            </figure>
          ) : <div />}
          <nav aria-labelledby="zakat-rel-h">
            <h2 id="zakat-rel-h" className="ui-title ui-title--sm zakat-rel__title">{s('relTitle', l)}</h2>
            <ul className="ui-list">
              <li>
                <a className="ui-list__item" href={pathFor('learn', lang, 'fiqh-faq') + '#zakat'} onClick={openLearn}>
                  <Icon name="learn" />
                  <span>{s('relFaq', l)}<small>{s('relFaqSub', l)}</small></span>
                  <Icon name="chevron" className="ui-list__chev ui-flip-rtl" />
                </a>
              </li>
              {related.map(r => (
                <li key={r.to}>
                  <PageLink className="ui-list__item" to={r.to} setPage={setPage} onNavigate={() => window.scrollTo(0, 0)}>
                    <Icon name={r.icon} />
                    <span>{r.title}<small>{r.sub}</small></span>
                    <Icon name="chevron" className="ui-list__chev ui-flip-rtl" />
                  </PageLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </div>
  )
}
