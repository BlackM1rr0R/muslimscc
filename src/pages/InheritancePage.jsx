import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { calculateInheritance, heirAllowed, HEIR_MAX } from '../utils/faraid'
import { useNavigate } from 'react-router-dom'
import PageLink, { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import { ChartFigure, BarChart, Donut } from '../components/viz'
import '../styles/InheritancePage.css'
import '../styles/ToolsMotion.css'
import TweenNumber from '../components/prayer/TweenNumber'

// ═══ MİRAS (FƏRAİZ) HESABLAYICISI ═══
// Hesab src/utils/faraid.js-dədir (Quran 4:11, 4:12, 4:176 + Sünnə; mübahisəli
// məsələlərdə seçilən görüşlər orada və nəticə qeydlərində yazılıb).
// Ayələrin ərəb mətni api.quran.com (Osmani yazı) mənbəyindən götürülüb; tərcümələr:
// az — Məmmədəliyev/Bünyadov, en — Sahih International, ru — Кулиев, tr — Diyanət.

const NUM_LOCALES = { az: 'az-AZ', en: 'en-US', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }

const L = {
  title:      { az:'Miras hesablayıcısı', en:'Inheritance calculator', ru:'Калькулятор наследства', ar:'حاسبة المواريث', tr:'Miras hesaplayıcı' },
  lead:       { az:'Quran və Sünnədə müəyyən edilmiş paylara görə mirası varislər arasında bölün: sabit paylar, əsəbə, məhrumetmə, övl və rədd.', en:'Divide an estate among the heirs according to the shares fixed in the Quran and Sunnah: fixed shares, residuaries, exclusion, ʿawl and radd.', ru:'Разделите наследство между наследниками по долям, установленным в Коране и Сунне: фиксированные доли, асаба, лишение, ауль и радд.', ar:'قسّم التركة على الورثة وفق الفروض المقدَّرة في الكتاب والسنة: أصحاب الفروض والعصبات والحجب والعول والرد.', tr:'Mirası Kur’an ve Sünnette belirlenen paylara göre mirasçılar arasında bölün: sabit paylar, asabe, hacb, avl ve red.' },
  estateTitle:{ az:'Mal və çıxılanlar', en:'Estate and deductions', ru:'Имущество и вычеты', ar:'التركة والحقوق المتعلقة بها', tr:'Terike ve düşülecekler' },
  estate:     { az:'Ümumi miras malı', en:'Total estate', ru:'Всё имущество', ar:'إجمالي التركة', tr:'Toplam terike' },
  funeral:    { az:'Kəfən-dəfn xərci', en:'Funeral costs', ru:'Расходы на похороны', ar:'تكاليف التجهيز والدفن', tr:'Kefen ve defin masrafı' },
  debts:      { az:'Borclar', en:'Debts', ru:'Долги', ar:'الديون', tr:'Borçlar' },
  wasiyyah:   { az:'Vəsiyyət', en:'Bequest (wasiyyah)', ru:'Завещание', ar:'الوصية', tr:'Vasiyet' },
  wasiyyahHint:{ az:'Qalanın 1/3-dən çox ola bilməz və varisə vəsiyyət edilmir', en:'At most 1/3 of what remains, and not for an heir', ru:'Не более 1/3 остатка и не в пользу наследника', ar:'لا تزيد على الثلث، ولا وصية لوارث', tr:'Kalanın 1/3’ünü aşamaz ve mirasçıya vasiyet edilmez' },
  orderNote:  { az:'Sıra: əvvəl kəfən-dəfn, sonra borclar, sonra vəsiyyət, qalanı varislərə.', en:'Order: funeral costs first, then debts, then the bequest; the rest goes to the heirs.', ru:'Порядок: сначала похороны, затем долги, затем завещание; остальное — наследникам.', ar:'الترتيب: التجهيز ثم الديون ثم الوصية، والباقي للورثة.', tr:'Sıra: önce kefen ve defin, sonra borçlar, sonra vasiyet; kalanı mirasçılara.' },
  deceased:   { az:'Vəfat edən', en:'The deceased', ru:'Умерший', ar:'المتوفى', tr:'Vefat eden' },
  male:       { az:'Kişi', en:'Man', ru:'Мужчина', ar:'رجل', tr:'Erkek' },
  female:     { az:'Qadın', en:'Woman', ru:'Женщина', ar:'امرأة', tr:'Kadın' },
  heirsTitle: { az:'Sağ qalan varislər', en:'Surviving heirs', ru:'Живые наследники', ar:'الورثة الأحياء', tr:'Hayatta olan mirasçılar' },
  heirsHint:  { az:'Yalnız ölüm anında sağ olan və müsəlman olan qohumları seçin.', en:'Select only relatives who were alive and Muslim at the time of death.', ru:'Отметьте только родственников-мусульман, живых на момент смерти.', ar:'اختر الأقارب المسلمين الأحياء وقت الوفاة فقط.', tr:'Yalnızca ölüm anında hayatta olan ve Müslüman olan akrabaları seçin.' },
  gSpouse:    { az:'Həyat yoldaşı', en:'Spouse', ru:'Супруг(а)', ar:'الزوجية', tr:'Hayat arkadaşı' },
  gParents:   { az:'Valideynlər və nənə-babalar', en:'Parents and grandparents', ru:'Родители, дед и бабушки', ar:'الأصول', tr:'Anne-baba ve büyükler' },
  gChildren:  { az:'Övladlar və nəvələr', en:'Children and grandchildren', ru:'Дети и внуки', ar:'الفروع', tr:'Çocuklar ve torunlar' },
  gSiblings:  { az:'Qardaş və bacılar', en:'Brothers and sisters', ru:'Братья и сёстры', ar:'الإخوة والأخوات', tr:'Kardeşler' },
  gRelatives: { az:'Digər kişi qohumlar', en:'Other male relatives', ru:'Другие родственники-мужчины', ar:'بقية العصبات', tr:'Diğer erkek akrabalar' },
  yes:        { az:'Var', en:'Alive', ru:'Есть', ar:'موجود', tr:'Var' },
  decrease:   { az:'Azalt', en:'Decrease', ru:'Уменьшить', ar:'إنقاص', tr:'Azalt' },
  increase:   { az:'Artır', en:'Increase', ru:'Увеличить', ar:'زيادة', tr:'Artır' },
  reset:      { az:'Sıfırla', en:'Reset', ru:'Сбросить', ar:'إعادة الضبط', tr:'Sıfırla' },
  resultTitle:{ az:'Bölgü', en:'Distribution', ru:'Распределение', ar:'القسمة', tr:'Taksim' },
  emptyResult:{ az:'Nəticəni görmək üçün malın məbləğini yazın və ən azı bir varis seçin.', en:'Enter the estate value and select at least one heir to see the result.', ru:'Введите сумму наследства и отметьте хотя бы одного наследника.', ar:'أدخل قيمة التركة واختر وارثًا واحدًا على الأقل لرؤية النتيجة.', tr:'Sonucu görmek için terike tutarını yazın ve en az bir mirasçı seçin.' },
  gross:      { az:'Ümumi mal', en:'Gross estate', ru:'Всё имущество', ar:'إجمالي التركة', tr:'Toplam terike' },
  net:        { az:'Varislərə qalan', en:'Net for heirs', ru:'Остаток для наследников', ar:'الصافي للورثة', tr:'Mirasçılara kalan' },
  colHeir:    { az:'Varis', en:'Heir', ru:'Наследник', ar:'الوارث', tr:'Mirasçı' },
  colShare:   { az:'Pay', en:'Share', ru:'Доля', ar:'النصيب', tr:'Pay' },
  colEach:    { az:'Hər birinə', en:'Each', ru:'Каждому', ar:'لكل واحد', tr:'Kişi başı' },
  colTotal:   { az:'Cəmi', en:'Total', ru:'Итого', ar:'المجموع', tr:'Toplam' },
  fardOf:     { az:'fərz', en:'fixed', ru:'фард', ar:'فرض', tr:'farz' },
  plusRest:   { az:'+ qalan', en:'+ remainder', ru:'+ остаток', ar:'+ الباقي', tr:'+ kalan' },
  residuary:  { az:'əsəbə', en:'residuary', ru:'асаба', ar:'عصبة', tr:'asabe' },
  unallocated:{ az:'Bölünməmiş qalıq', en:'Unallocated remainder', ru:'Нераспределённый остаток', ar:'باقٍ غير موزَّع', tr:'Dağıtılmayan kalan' },
  barLabel:   { az:'Payların qrafiki', en:'Chart of the shares', ru:'Диаграмма долей', ar:'رسم الأنصبة', tr:'Payların grafiği' },
  blockedTitle:{ az:'Məhrum olanlar (həcb)', en:'Excluded heirs (hajb)', ru:'Лишённые наследства (хаджб)', ar:'المحجوبون', tr:'Mahrum olanlar (hacb)' },
  notesTitle: { az:'Qeydlər', en:'Notes', ru:'Примечания', ar:'تنبيهات', tr:'Notlar' },
  evidenceTitle:{ az:'Dəlillər', en:'Evidence', ru:'Доказательства', ar:'الأدلة', tr:'Deliller' },
  evidenceLead:{ az:'Miras paylarını Allah Özü müəyyən edib — bu ayələr fəraiz elminin əsasıdır.', en:'Allah Himself fixed the shares of inheritance — these verses are the foundation of the science of faraʾid.', ru:'Доли наследства установил Сам Аллах — эти аяты являются основой науки о наследстве.', ar:'تولّى الله تعالى قسمة المواريث بنفسه، وهذه الآيات أصل علم الفرائض.', tr:'Miras paylarını bizzat Allah belirlemiştir — bu ayetler feraiz ilminin temelidir.' },
  hadithText: { az:'«Fərz paylarını sahiblərinə verin, qalanı isə ən yaxın kişi qohuma aiddir».', en:'“Give the fixed shares to those entitled to them, and whatever remains goes to the nearest male relative.”', ru:'«Отдавайте установленные доли тем, кому они положены, а остаток принадлежит ближайшему родственнику-мужчине».', ar:'أَلْحِقُوا الْفَرَائِضَ بِأَهْلِهَا، فَمَا بَقِيَ فَهُوَ لِأَوْلَى رَجُلٍ ذَكَرٍ', tr:'“Farz paylarını sahiplerine verin, geri kalanı ise en yakın erkek akrabaya aittir.”' },
  hadithSrc:  { az:'Buxari 6732, Müslim 1615', en:'al-Bukhari 6732, Muslim 1615', ru:'аль-Бухари 6732, Муслим 1615', ar:'البخاري ٦٧٣٢، مسلم ١٦١٥', tr:'Buhârî 6732, Müslim 1615' },
  disclaimerTitle:{ az:'Diqqət', en:'Important', ru:'Важно', ar:'تنبيه مهم', tr:'Dikkat' },
  disclaimer: { az:'Bu hesablayıcı adi hallar üçün köməkçi vasitədir, fətva deyil. İtkin düşmüş şəxs, cinsi bəlli olmayan (xünsa), ana bətnindəki uşaq, eyni anda (məsələn, qəzada) ölənlər, uzaq qohumlar (zəvil-ərham), qatil və ya qeyri-müsəlman varis kimi mürəkkəb hallarda mütləq alimə və ya şəriət məhkəməsinə müraciət edin.', en:'This calculator is an aid for ordinary cases, not a fatwa. For complex cases — a missing person, a person of unclear sex (khuntha), an unborn child, people who died at the same time (e.g. in an accident), distant kin (dhawu al-arham), a killer or a non-Muslim heir — be sure to consult a scholar or a sharia court.', ru:'Этот калькулятор — помощник для обычных случаев, а не фетва. В сложных случаях — пропавший без вести, человек с неясным полом (хунса), ещё не родившийся ребёнок, погибшие одновременно (например, в аварии), дальние родственники (зауль-архам), убийца или наследник-немусульманин — обязательно обратитесь к учёному или шариатскому суду.', ar:'هذه الحاسبة أداة مساعدة للمسائل المعتادة وليست فتوى. وفي المسائل المعقدة كالمفقود والخنثى المشكل والحمل والغرقى والهدمى ومن مات معًا، وذوي الأرحام، والقاتل والوارث غير المسلم، يجب الرجوع إلى أهل العلم أو المحكمة الشرعية.', tr:'Bu hesaplayıcı olağan durumlar için yardımcı bir araçtır, fetva değildir. Kayıp kişi, cinsiyeti belirsiz kişi (hünsa), anne karnındaki çocuk, aynı anda (örneğin bir kazada) ölenler, uzak akrabalar (zevi’l-erham), katil veya gayrimüslim mirasçı gibi karmaşık durumlarda mutlaka bir âlime veya şer’i mahkemeye başvurun.' },
  // ── Dizayn v3 ──
  how:        { az:'Malın məbləğini yazın, sonra ölüm anında sağ olan varisləri seçin — paylar, məbləğlər və hər payın səbəbi dərhal görünür.', en:'Enter the value of the estate, then select the heirs who were alive at the time of death — the shares, amounts and the reason for each share appear at once.', ru:'Введите сумму наследства и отметьте наследников, живых на момент смерти, — доли, суммы и причина каждой доли появятся сразу.', ar:'أدخل قيمة التركة ثم اختر الورثة الأحياء وقت الوفاة، فتظهر الأنصبة والمبالغ وسبب كل نصيب فورًا.', tr:'Terikenin tutarını yazın, sonra ölüm anında hayatta olan mirasçıları seçin — paylar, tutarlar ve her payın sebebi hemen görünür.' },
  statShares: { az:'Quranda sabit pay', en:'fixed shares in the Quran', ru:'фиксированных долей в Коране', ar:'فروض مقدّرة في القرآن', tr:'Kur’an’da sabit pay' },
  statVerses: { az:'əsas ayə (Nisa)', en:'key verses (an-Nisa)', ru:'основных аята (ан-Ниса)', ar:'آيات المواريث (النساء)', tr:'temel ayet (Nisâ)' },
  statWill:   { az:'vəsiyyətin həddi', en:'limit of a bequest', ru:'предел завещания', ar:'حدّ الوصية', tr:'vasiyetin sınırı' },
  actCalc:    { az:'Hesabla', en:'Calculate', ru:'Рассчитать', ar:'احسب', tr:'Hesapla' },
  actShares:  { az:'Paylar cədvəli', en:'The shares at a glance', ru:'Таблица долей', ar:'جدول الفروض', tr:'Paylar tablosu' },
  toResult:   { az:'Bölgüyə bax', en:'See the distribution', ru:'К распределению', ar:'اعرض القسمة', tr:'Taksime bak' },
  miniEmpty:  { az:'Məbləğ və varis seçin', en:'Enter an amount and heirs', ru:'Введите сумму и наследников', ar:'أدخل المبلغ والورثة', tr:'Tutar ve mirasçı seçin' },
  copyRes:    { az:'Nəticəni kopyala', en:'Copy the result', ru:'Скопировать результат', ar:'انسخ النتيجة', tr:'Sonucu kopyala' },
  copied:     { az:'Kopyalandı', en:'Copied', ru:'Скопировано', ar:'تم النسخ', tr:'Kopyalandı' },
  printRes:   { az:'Çap et', en:'Print', ru:'Печать', ar:'طباعة', tr:'Yazdır' },
  donutCenter:{ az:'varis', en:'heirs', ru:'наследн.', ar:'ورثة', tr:'mirasçı' },
  others:     { az:'Digər varislər', en:'Other heirs', ru:'Другие наследники', ar:'بقية الورثة', tr:'Diğer mirasçılar' },
  orderEy:    { az:'Ardıcıllıq', en:'Order', ru:'Порядок', ar:'الترتيب', tr:'Sıra' },
  orderTitle: { az:'Mal necə bölünür?', en:'How is the estate settled?', ru:'Как распределяется имущество?', ar:'كيف تُقسم التركة؟', tr:'Terike nasıl paylaştırılır?' },
  orderLead:  { az:'Varislərə çatmazdan əvvəl maldan üç hüquq çıxılır — bu sıra ilə.', en:'Three rights are taken out of the estate before the heirs receive anything — in this order.', ru:'Прежде чем наследники что-то получат, из имущества вычитаются три права — в этом порядке.', ar:'تُقدَّم ثلاثة حقوق على حق الورثة، بهذا الترتيب.', tr:'Mirasçılara geçmeden önce terikeden üç hak düşülür — bu sırayla.' },
  o1:         { az:'Kəfən və dəfn xərcləri maldan ödənilir.', en:'The shroud and burial costs are paid from the estate.', ru:'Расходы на саван и погребение оплачиваются из имущества.', ar:'تُخرج تكاليف الكفن والدفن من التركة.', tr:'Kefen ve defin masrafları terikeden ödenir.' },
  o2:         { az:'Sonra ölənin borcları tam ödənilir.', en:'Then the debts of the deceased are paid in full.', ru:'Затем полностью выплачиваются долги умершего.', ar:'ثم تُقضى ديون الميت كاملة.', tr:'Sonra ölenin borçları tamamen ödenir.' },
  o3:         { az:'Qalanın ən çoxu 1/3-i — varis olmayan şəxsə.', en:'At most 1/3 of what remains — to someone who is not an heir.', ru:'Не более 1/3 остатка — тому, кто не является наследником.', ar:'في حدود ثلث الباقي، لغير وارث.', tr:'Kalanın en fazla 1/3’ü — mirasçı olmayan birine.' },
  o4t:        { az:'Varislər', en:'The heirs', ru:'Наследники', ar:'الورثة', tr:'Mirasçılar' },
  o4:         { az:'Qalan mal Quranda müəyyən edilmiş paylarla bölünür.', en:'The remainder is divided by the shares fixed in the Quran.', ru:'Остаток делится по долям, установленным в Коране.', ar:'يُقسم الباقي على الفروض المقدّرة في القرآن.', tr:'Kalan, Kur’an’da belirlenen paylarla bölünür.' },
  sharesEy:   { az:'Fəraiz', en:'Faraʾid', ru:'Фараид', ar:'الفرائض', tr:'Feraiz' },
  sharesTitle:{ az:'Altı sabit pay bir baxışda', en:'The six fixed shares at a glance', ru:'Шесть фиксированных долей', ar:'الفروض الستة في لمحة', tr:'Altı sabit pay bir bakışta' },
  sharesLead: { az:'Quranda adı çəkilən paylar və onları kimin hansı halda aldığı. Zolaq payın malın nə qədərini tutduğunu göstərir.', en:'The shares named in the Quran and who receives each of them, and when. The bar shows how much of the estate each share is.', ru:'Доли, названные в Коране, и кто и когда их получает. Полоса показывает, какую часть имущества составляет доля.', ar:'الفروض المذكورة في القرآن ومن يستحق كلًّا منها ومتى، ويبيّن الشريط مقدار الفرض من التركة.', tr:'Kur’an’da adı geçen paylar ve onları kimin hangi durumda aldığı. Çubuk, payın terikenin ne kadarı olduğunu gösterir.' },
  sharesNote: { az:'Övlad — oğul, qız, oğul nəvəsi və oğlun qızı deməkdir. Əsəbə (qalanı alan kişi qohum) sabit paylardan sonra qalanı alır.', en:'“Children” means sons, daughters and the children of sons. A residuary (ʿasabah) takes what is left after the fixed shares.', ru:'«Дети» — сыновья, дочери и дети сыновей. Асаба получает то, что осталось после фиксированных долей.', ar:'المراد بالفرع الوارث: الأبناء والبنات وأولاد الابن. والعصبة يأخذ ما بقي بعد الفروض.', tr:'“Çocuk” — oğul, kız ve oğlun çocukları demektir. Asabe, sabit paylardan sonra kalanı alır.' },
  relTitle:   { az:'Əlaqəli bölmələr', en:'Related sections', ru:'Связанные разделы', ar:'أقسام ذات صلة', tr:'İlgili bölümler' },
  relWill:    { az:'Vəsiyyət', en:'The bequest (wasiyyah)', ru:'Завещание', ar:'الوصية', tr:'Vasiyet' },
  relWillSub: { az:'Vəsiyyətin hökmü, həddi və yazılışı', en:'Its ruling, its limit and how to write it', ru:'Его положение, предел и составление', ar:'حكمها وحدّها وكتابتها', tr:'Hükmü, sınırı ve yazılışı' },
  relJanazah: { az:'Cənazə', en:'The funeral', ru:'Похороны', ar:'الجنائز', tr:'Cenaze' },
  relJanazahSub:{ az:'Yumaq, kəfən, namaz və dəfn', en:'Washing, shroud, prayer and burial', ru:'Омовение, саван, молитва и погребение', ar:'الغسل والكفن والصلاة والدفن', tr:'Yıkama, kefen, namaz ve defin' },
  relZakat:   { az:'Zəkat kalkulyatoru', en:'Zakat calculator', ru:'Калькулятор закята', ar:'حاسبة الزكاة', tr:'Zekât hesaplayıcı' },
  relZakatSub:{ az:'Nisab və 2.5% hesabı', en:'Nisab and the 2.5% calculation', ru:'Нисаб и расчёт 2,5 %', ar:'النصاب وحساب ربع العشر', tr:'Nisap ve %2,5 hesabı' },
  methodTitle:{ az:'Hansı görüşlər əsas götürülüb?', en:'Which positions are followed?', ru:'Какие мнения взяты за основу?', ar:'ما الأقوال المعتمدة؟', tr:'Hangi görüşler esas alındı?' },
  method:     { az:'Sabit paylar, əsəbə, həcb, övl və rədd alimlərin çoxluğunun tətbiq etdiyi kimidir. Baba qardaş-bacıları ata kimi məhrum edir — Əbu Bəkr əs-Siddiq və İbn Abbasın görüşü; İbn Teymiyyə, İbn əl-Qayyim, İbn Baz və İbn Useymin bunu seçib. Müştərəkə məsələsində Hənbəli görüşü (şərikləşmə yoxdur). Atanın anası oğlu ilə birlikdə varis olur — Hənbəli məzhəbi.', en:'Fixed shares, residuaries, exclusion, ʿawl and radd follow the majority of scholars. The grandfather excludes the siblings like the father — the view of Abu Bakr as-Siddiq and Ibn ʿAbbas, chosen by Ibn Taymiyyah, Ibn al-Qayyim, Ibn Baz and Ibn ʿUthaymin. In al-mushtarakah, the Hanbali position (no sharing). The father’s mother inherits together with her son — the Hanbali position.', ru:'Фиксированные доли, асаба, лишение, ауль и радд — по мнению большинства учёных. Дед лишает братьев и сестёр, как отец, — мнение Абу Бакра ас-Сиддика и Ибн Аббаса, избранное Ибн Таймийей, Ибн аль-Каййимом, Ибн Базом и Ибн Усаймином. В вопросе «муштарака» — ханбалитское мнение (без соучастия). Мать отца наследует вместе со своим сыном — ханбалитский мазхаб.', ar:'الفروض والتعصيب والحجب والعول والرد على ما عليه جمهور العلماء. والجد يحجب الإخوة كالأب، وهو قول أبي بكر الصديق وابن عباس، واختاره ابن تيمية وابن القيم وابن باز وابن عثيمين. وفي المسألة المشتركة قول الحنابلة بعدم التشريك. وأم الأب ترث مع ابنها على مذهب الحنابلة.', tr:'Sabit paylar, asabe, hacb, avl ve red âlimlerin çoğunluğunun uyguladığı gibidir. Dede kardeşleri baba gibi mahrum eder — Ebû Bekir es-Sıddîk ve İbn Abbas’ın görüşü; İbn Teymiyye, İbnü’l-Kayyim, İbn Bâz ve İbn Useymîn bunu tercih etmiştir. Müşterekede Hanbelî görüşü (ortaklık yok). Babanın annesi oğluyla birlikte mirasçı olur — Hanbelî mezhebi.' },
}

// Varislərin adları
const HEIR = {
  husband:            { az:'Ər', en:'Husband', ru:'Муж', ar:'الزوج', tr:'Koca' },
  wife:               { az:'Arvad', en:'Wife', ru:'Жена', ar:'الزوجة', tr:'Hanım (zevce)' },
  father:             { az:'Ata', en:'Father', ru:'Отец', ar:'الأب', tr:'Baba' },
  mother:             { az:'Ana', en:'Mother', ru:'Мать', ar:'الأم', tr:'Anne' },
  paternalGrandfather:{ az:'Baba (atanın atası)', en:'Grandfather (father’s father)', ru:'Дед (отец отца)', ar:'الجد (أبو الأب)', tr:'Dede (babanın babası)' },
  paternalGrandmother:{ az:'Nənə (atanın anası)', en:'Grandmother (father’s mother)', ru:'Бабушка (мать отца)', ar:'الجدة (أم الأب)', tr:'Babaanne' },
  maternalGrandmother:{ az:'Nənə (ananın anası)', en:'Grandmother (mother’s mother)', ru:'Бабушка (мать матери)', ar:'الجدة (أم الأم)', tr:'Anneanne' },
  sons:               { az:'Oğul', en:'Son', ru:'Сын', ar:'الابن', tr:'Oğul (erkek evlat)' },
  daughters:          { az:'Qız', en:'Daughter', ru:'Дочь', ar:'البنت', tr:'Kız evlat' },
  sonsSons:           { az:'Oğul nəvəsi (oğlun oğlu)', en:'Son’s son', ru:'Сын сына', ar:'ابن الابن', tr:'Oğlun oğlu' },
  sonsDaughters:      { az:'Oğlun qızı', en:'Son’s daughter', ru:'Дочь сына', ar:'بنت الابن', tr:'Oğlun kızı' },
  fullBrothers:       { az:'Ata-ana bir qardaş', en:'Full brother', ru:'Полнородный брат', ar:'الأخ الشقيق', tr:'Öz erkek kardeş' },
  fullSisters:        { az:'Ata-ana bir bacı', en:'Full sister', ru:'Полнородная сестра', ar:'الأخت الشقيقة', tr:'Öz kız kardeş' },
  paternalBrothers:   { az:'Ata bir qardaş', en:'Paternal half-brother', ru:'Единокровный брат', ar:'الأخ لأب', tr:'Baba bir erkek kardeş' },
  paternalSisters:    { az:'Ata bir bacı', en:'Paternal half-sister', ru:'Единокровная сестра', ar:'الأخت لأب', tr:'Baba bir kız kardeş' },
  maternalBrothers:   { az:'Ana bir qardaş', en:'Maternal half-brother', ru:'Единоутробный брат', ar:'الأخ لأم', tr:'Anne bir erkek kardeş' },
  maternalSisters:    { az:'Ana bir bacı', en:'Maternal half-sister', ru:'Единоутробная сестра', ar:'الأخت لأم', tr:'Anne bir kız kardeş' },
  fullNephews:        { az:'Ata-ana bir qardaşın oğlu', en:'Full brother’s son', ru:'Сын полнородного брата', ar:'ابن الأخ الشقيق', tr:'Öz erkek kardeşin oğlu' },
  paternalNephews:    { az:'Ata bir qardaşın oğlu', en:'Paternal half-brother’s son', ru:'Сын единокровного брата', ar:'ابن الأخ لأب', tr:'Baba bir erkek kardeşin oğlu' },
  fullUncles:         { az:'Əmi (atanın ata-ana bir qardaşı)', en:'Paternal uncle (father’s full brother)', ru:'Дядя (полнородный брат отца)', ar:'العم الشقيق', tr:'Amca (babanın öz kardeşi)' },
  paternalUncles:     { az:'Əmi (atanın ata bir qardaşı)', en:'Paternal uncle (father’s paternal half-brother)', ru:'Дядя (единокровный брат отца)', ar:'العم لأب', tr:'Amca (babanın baba bir kardeşi)' },
  fullCousins:        { az:'Ata-ana bir əminin oğlu', en:'Son of a full paternal uncle', ru:'Сын полнородного дяди', ar:'ابن العم الشقيق', tr:'Öz amcanın oğlu' },
  paternalCousins:    { az:'Ata bir əminin oğlu', en:'Son of a half paternal uncle', ru:'Сын единокровного дяди', ar:'ابن العم لأب', tr:'Baba bir amcanın oğlu' },
}

// Payın / məhrumiyyətin izahı (faraid.js → reasonKey)
const REASON = {
  spouseNoChild:      { az:'Övlad və oğul nəvəsi yoxdur — tam fərz (4:12)', en:'No children or son’s children — full fixed share (4:12)', ru:'Нет детей и детей сына — полная доля (4:12)', ar:'لعدم الفرع الوارث (النساء: ١٢)', tr:'Çocuk ve oğul torunu yok — tam farz (4:12)' },
  spouseWithChild:    { az:'Övlad var — pay azalır (4:12)', en:'There are children — the share is reduced (4:12)', ru:'Есть дети — доля уменьшается (4:12)', ar:'لوجود الفرع الوارث (النساء: ١٢)', tr:'Çocuk var — pay azalır (4:12)' },
  daughterOne:        { az:'Tək, qardaşı yoxdur — 1/2 (4:11)', en:'Only one, no brother — 1/2 (4:11)', ru:'Одна, без брата — 1/2 (4:11)', ar:'لانفرادها وعدم المعصِّب (النساء: ١١)', tr:'Tek, erkek kardeşi yok — 1/2 (4:11)' },
  daughtersMany:      { az:'İki və daha çox, qardaşları yoxdur — 2/3 (4:11)', en:'Two or more, no brother — 2/3 (4:11)', ru:'Две и более, без брата — 2/3 (4:11)', ar:'لتعددهن وعدم المعصِّب (النساء: ١١)', tr:'İki veya daha fazla, erkek kardeşleri yok — 2/3 (4:11)' },
  sonsDaughterTakmila:{ az:'Bir qızla birlikdə 2/3-ü tamamlamaq üçün 1/6', en:'With one daughter — 1/6 to complete two-thirds', ru:'При одной дочери — 1/6 до двух третей', ar:'السدس تكملة الثلثين مع البنت', tr:'Bir kızla birlikte üçte ikiyi tamamlamak için 1/6' },
  fatherWithSon:      { az:'Kişi nəsil (oğul) var — 1/6 (4:11)', en:'There is a male descendant — 1/6 (4:11)', ru:'Есть потомок мужского пола — 1/6 (4:11)', ar:'السدس لوجود الفرع الوارث المذكر (النساء: ١١)', tr:'Erkek evlat var — 1/6 (4:11)' },
  fatherWithDaughter: { az:'Qadın nəsil var — 1/6 və qalan hissə (əsəbə)', en:'Female descendants only — 1/6 plus the remainder', ru:'Есть только потомки-женщины — 1/6 и остаток', ar:'السدس فرضًا والباقي تعصيبًا', tr:'Yalnız kız evlat var — 1/6 ve kalan (asabe)' },
  motherWithChild:    { az:'Övlad var — 1/6 (4:11)', en:'There are children — 1/6 (4:11)', ru:'Есть дети — 1/6 (4:11)', ar:'السدس لوجود الفرع الوارث (النساء: ١١)', tr:'Çocuk var — 1/6 (4:11)' },
  motherWithSiblings: { az:'İki və daha çox qardaş-bacı var — 1/6 (4:11)', en:'Two or more siblings — 1/6 (4:11)', ru:'Двое и более братьев или сестёр — 1/6 (4:11)', ar:'السدس لوجود جمع من الإخوة (النساء: ١١)', tr:'İki veya daha fazla kardeş var — 1/6 (4:11)' },
  motherThird:        { az:'Övlad yoxdur, qardaş-bacı ikidən azdır — 1/3 (4:11)', en:'No children, fewer than two siblings — 1/3 (4:11)', ru:'Нет детей, братьев и сестёр меньше двух — 1/3 (4:11)', ar:'الثلث لعدم الفرع الوارث وجمع الإخوة (النساء: ١١)', tr:'Çocuk yok, kardeş ikiden az — 1/3 (4:11)' },
  umariyyah:          { az:'Öməriyyə: həyat yoldaşının payından sonra qalanın 1/3-i', en:'ʿUmariyyah: 1/3 of what remains after the spouse’s share', ru:'Умарийя: 1/3 остатка после доли супруга', ar:'العُمَرية: ثلث الباقي بعد فرض الزوجين', tr:'Ömeriyye: eşin payından sonra kalanın 1/3’ü' },
  grandmotherSixth:   { az:'Nənənin payı — 1/6 (Sünnə)', en:'The grandmother’s share — 1/6 (Sunnah)', ru:'Доля бабушки — 1/6 (Сунна)', ar:'السدس للجدة (السنة)', tr:'Ninenin payı — 1/6 (Sünnet)' },
  grandmothersShare:  { az:'Nənələr 1/6-nı bərabər bölür (Sünnə)', en:'The grandmothers share 1/6 equally (Sunnah)', ru:'Бабушки делят 1/6 поровну (Сунна)', ar:'الجدتان تشتركان في السدس (السنة)', tr:'Nineler 1/6’yı eşit paylaşır (Sünnet)' },
  maternalOne:        { az:'Tək ana bir qardaş və ya bacı — 1/6 (4:12)', en:'A single maternal sibling — 1/6 (4:12)', ru:'Единственный единоутробный брат или сестра — 1/6 (4:12)', ar:'السدس للواحد من ولد الأم (النساء: ١٢)', tr:'Tek anne bir kardeş — 1/6 (4:12)' },
  maternalShareThird: { az:'1/3-ə şərikdirlər, kişi ilə qadın bərabərdir (4:12)', en:'They share 1/3, male and female equally (4:12)', ru:'Делят 1/3, мужчины и женщины поровну (4:12)', ar:'شركاء في الثلث، ذكرهم كأنثاهم (النساء: ١٢)', tr:'1/3’e ortaktırlar, erkek ve kadın eşittir (4:12)' },
  sisterOne:          { az:'Tək, qardaşı yoxdur — 1/2 (4:176)', en:'Only one, no brother — 1/2 (4:176)', ru:'Одна, без брата — 1/2 (4:176)', ar:'النصف لانفرادها (النساء: ١٧٦)', tr:'Tek, erkek kardeşi yok — 1/2 (4:176)' },
  sistersMany:        { az:'İki və daha çox — 2/3 (4:176)', en:'Two or more — 2/3 (4:176)', ru:'Две и более — 2/3 (4:176)', ar:'الثلثان لتعددهن (النساء: ١٧٦)', tr:'İki veya daha fazla — 2/3 (4:176)' },
  paternalSisterTakmila:{ az:'Ata-ana bir bacı ilə 2/3-ü tamamlamaq üçün 1/6', en:'With one full sister — 1/6 to complete two-thirds', ru:'При одной полнородной сестре — 1/6 до двух третей', ar:'السدس تكملة الثلثين مع الشقيقة', tr:'Bir öz kız kardeşle üçte ikiyi tamamlamak için 1/6' },
  sisterWithDaughters:{ az:'Qızlarla birlikdə qalanı alır (əsəbə məəl-ğayr)', en:'Takes the remainder together with daughters (ʿasabah maʿa al-ghayr)', ru:'С дочерьми получает остаток (асаба маа аль-гайр)', ar:'عصبة مع الغير (مع البنات)', tr:'Kızlarla birlikte kalanı alır (asabe me’al-gayr)' },
  asabahChildren:     { az:'Qalan; oğula iki qız payı qədər (4:11)', en:'The remainder; a male gets twice a female (4:11)', ru:'Остаток; мужчине — как двум женщинам (4:11)', ar:'الباقي تعصيبًا، للذكر مثل حظ الأنثيين (النساء: ١١)', tr:'Kalan; erkeğe iki kızın payı kadar (4:11)' },
  asabahSiblings:     { az:'Qalan; qardaşa iki bacı payı qədər (4:176)', en:'The remainder; a brother gets twice a sister (4:176)', ru:'Остаток; брату — как двум сёстрам (4:176)', ar:'الباقي تعصيبًا، للذكر مثل حظ الأنثيين (النساء: ١٧٦)', tr:'Kalan; erkek kardeşe iki kız kardeşin payı kadar (4:176)' },
  asabahSelf:         { az:'Fərzlərdən qalan — ən yaxın kişi qohum (əsəbə)', en:'What remains after the fixed shares — nearest male relative', ru:'Остаток после фиксированных долей — ближайший родственник-мужчина', ar:'الباقي تعصيبًا لأنه أولى رجل ذكر', tr:'Farzlardan kalan — en yakın erkek akraba (asabe)' },
  noRemainder:        { az:'Əsəbədir, lakin fərzlərdən sonra heç nə qalmır', en:'Residuary, but nothing remains after the fixed shares', ru:'Асаба, но после фиксированных долей ничего не остаётся', ar:'عصبة لم يبقَ لها شيء بعد الفروض', tr:'Asabedir, fakat farzlardan sonra bir şey kalmıyor' },
  blockedBySon:       { az:'Oğul onu məhrum edir', en:'Excluded by the son', ru:'Лишён(а) сыном', ar:'محجوب بالابن', tr:'Oğul onu mahrum eder' },
  blockedBySonsSon:   { az:'Oğul nəvəsi onu məhrum edir', en:'Excluded by the son’s son', ru:'Лишён(а) сыном сына', ar:'محجوب بابن الابن', tr:'Oğlun oğlu onu mahrum eder' },
  blockedByFather:    { az:'Ata onu məhrum edir', en:'Excluded by the father', ru:'Лишён(а) отцом', ar:'محجوب بالأب', tr:'Baba onu mahrum eder' },
  blockedByGrandfather:{ az:'Baba (atanın atası) onu ata kimi məhrum edir', en:'Excluded by the grandfather, as by the father', ru:'Лишён(а) дедом, как отцом', ar:'محجوب بالجد كالأب', tr:'Dede onu baba gibi mahrum eder' },
  blockedByMother:    { az:'Ana nənələri məhrum edir', en:'The mother excludes the grandmothers', ru:'Мать лишает бабушек', ar:'الأم تحجب الجدات', tr:'Anne nineleri mahrum eder' },
  blockedByDescendant:{ az:'Övlad və ya oğul nəvəsi onu məhrum edir (4:12)', en:'Excluded by children or son’s children (4:12)', ru:'Лишён(а) детьми или детьми сына (4:12)', ar:'محجوب بالفرع الوارث (النساء: ١٢)', tr:'Çocuk veya oğul torunu onu mahrum eder (4:12)' },
  blockedByTwoDaughters:{ az:'İki qız 2/3-ü tamamladı, yanında oğul nəvəsi yoxdur', en:'Two daughters completed two-thirds and there is no son’s son with her', ru:'Две дочери получили две трети, а сына сына нет', ar:'استكمل البنات الثلثين ولا معصِّب لها', tr:'İki kız üçte ikiyi tamamladı, yanında oğlun oğlu yok' },
  blockedByTwoFullSisters:{ az:'İki ata-ana bir bacı 2/3-ü tamamladı, ata bir qardaş yoxdur', en:'Two full sisters completed two-thirds and there is no paternal half-brother', ru:'Две полнородные сестры получили две трети, а единокровного брата нет', ar:'استكمل الشقيقات الثلثين ولا معصِّب لها', tr:'İki öz kız kardeş üçte ikiyi tamamladı, baba bir erkek kardeş yok' },
  blockedByFullBrother:{ az:'Ata-ana bir qardaş onu məhrum edir', en:'Excluded by the full brother', ru:'Лишён(а) полнородным братом', ar:'محجوب بالأخ الشقيق', tr:'Öz erkek kardeş onu mahrum eder' },
  blockedByFullSisterAsabah:{ az:'Qızlarla əsəbə olan ata-ana bir bacı onu məhrum edir', en:'Excluded by the full sister, who is residuary with the daughters', ru:'Лишён(а) полнородной сестрой, ставшей асаба с дочерьми', ar:'محجوب بالشقيقة لأنها عصبة مع البنات', tr:'Kızlarla asabe olan öz kız kardeş onu mahrum eder' },
  blockedByNearer:    { az:'Daha yaxın əsəbə onu məhrum edir: {who}', en:'Excluded by a nearer residuary: {who}', ru:'Лишён(а) более близким асаба: {who}', ar:'محجوب بعاصب أقرب: {who}', tr:'Daha yakın asabe onu mahrum eder: {who}' },
}

// Nəticə qeydləri (faraid.js → notes)
const NOTE = {
  awl:          { az:'Övl: fərz paylarının cəmi maldan çoxdur, ona görə bütün paylar mütənasib azaldılıb (Ömərin dövründə səhabələrin ittifaqı ilə).', en:'ʿAwl: the fixed shares add up to more than the estate, so all of them were reduced proportionally (agreed upon by the Companions in the time of ʿUmar).', ru:'Ауль: сумма фиксированных долей больше наследства, поэтому все доли пропорционально уменьшены (с согласия сподвижников во времена Умара).', ar:'عول: زادت الفروض على التركة فنقصت الأنصبة كلها بالنسبة، وقد قضى به الصحابة في عهد عمر.', tr:'Avl: farz payların toplamı terikeyi aşıyor, bu yüzden bütün paylar orantılı olarak azaltıldı (Ömer döneminde sahabenin ittifakıyla).' },
  radd:         { az:'Rədd: əsəbə yoxdur, artıq qalan hissə fərz sahiblərinə (ər-arvaddan başqa) payları nisbətində qaytarılıb.', en:'Radd: there is no residuary, so the surplus was returned to the fixed-share heirs (except the spouse) in proportion to their shares.', ru:'Радд: асаба нет, поэтому излишек возвращён наследникам с фиксированными долями (кроме супруга) пропорционально их долям.', ar:'رد: لا عاصب، فرُدّ الباقي على أصحاب الفروض بقدر فروضهم عدا الزوجين.', tr:'Red: asabe yok, artan kısım farz sahiplerine (eş hariç) payları oranında iade edildi.' },
  umariyyah:    { az:'Öməriyyə: ana malın deyil, həyat yoldaşının payından sonra qalanın 1/3-ni alır ki, ata anadan az almasın (Ömər, Zeyd ibn Sabit, İbn Məsud; dörd məzhəb).', en:'ʿUmariyyah: the mother takes 1/3 of what remains after the spouse, not of the whole estate, so that the father does not get less than her (ʿUmar, Zayd ibn Thabit, Ibn Masʿud; the four schools).', ru:'Умарийя: мать получает 1/3 не от всего имущества, а от остатка после доли супруга, чтобы отец не получил меньше неё (Умар, Зейд ибн Сабит, Ибн Масуд; четыре мазхаба).', ar:'العُمَريتان: للأم ثلث الباقي بعد فرض الزوجين لا ثلث الكل، لئلا تأخذ أكثر من الأب (قضاء عمر ووافقه زيد وابن مسعود، وعليه المذاهب الأربعة).', tr:'Ömeriyye: anne, terikenin değil eşin payından sonra kalanın 1/3’ünü alır ki baba anneden az almasın (Ömer, Zeyd b. Sâbit, İbn Mes’ûd; dört mezhep).' },
  mushtarakah:  { az:'Müştərəkə: Hənbəli görüşünə görə ata-ana bir qardaşlar ana bir qardaşlarla 1/3-ə şərik edilmir; fərzlərdən heç nə qalmadığı üçün heç nə almırlar.', en:'al-Mushtarakah: following the Hanbali position, the full brothers do not share the third with the maternal siblings; since nothing remains after the fixed shares, they receive nothing.', ru:'Муштарака: по ханбалитскому мнению полнородные братья не делят треть с единоутробными; так как после фиксированных долей ничего не осталось, они ничего не получают.', ar:'المشتركة: على قول الحنابلة لا يُشرَّك الإخوة الأشقاء مع الإخوة لأم في الثلث، ولم يبق لهم شيء فيسقطون.', tr:'Müşterreke: Hanbelî görüşüne göre öz kardeşler anne bir kardeşlerle 1/3’e ortak edilmez; farzlardan bir şey kalmadığı için bir şey almazlar.' },
  grandfatherSiblings:{ az:'Baba və qardaş-bacılar: burada baba ata kimi bütün qardaş-bacıları məhrum edir — Əbu Bəkr əs-Siddiq və İbn Abbasın görüşü (Buxari, "Babanın mirası" babı); İbn Teymiyyə, İbn əl-Qayyim, İbn Baz və İbn Useymin bunu üstün tutub. Bəzi alimlər (Zeyd ibn Sabit, üç məzhəb) qardaşları baba ilə şərik edir.', en:'Grandfather with siblings: here the grandfather excludes all siblings like the father — the view of Abu Bakr as-Siddiq and Ibn ʿAbbas (al-Bukhari, chapter on the grandfather’s inheritance), preferred by Ibn Taymiyyah, Ibn al-Qayyim, Ibn Baz and Ibn ʿUthaymin. Some scholars (Zayd ibn Thabit, three schools) let the siblings share with him.', ru:'Дед и братья с сёстрами: здесь дед, как отец, лишает всех братьев и сестёр — мнение Абу Бакра ас-Сиддика и Ибн Аббаса (аль-Бухари, глава о наследстве деда), которое предпочли Ибн Таймийя, Ибн аль-Каййим, Ибн Баз и Ибн Усаймин. Часть учёных (Зейд ибн Сабит, три мазхаба) допускает долю братьев вместе с дедом.', ar:'الجد مع الإخوة: الجد هنا يحجب الإخوة كلهم كالأب، وهو قول أبي بكر الصديق وابن عباس (البخاري، باب ميراث الجد مع الأب والإخوة)، ورجّحه ابن تيمية وابن القيم وابن باز وابن عثيمين. وذهب بعض العلماء (زيد بن ثابت والمذاهب الثلاثة) إلى مقاسمة الإخوة للجد.', tr:'Dede ve kardeşler: burada dede baba gibi bütün kardeşleri mahrum eder — Ebû Bekir es-Sıddîk ve İbn Abbas’ın görüşü (Buhârî, dedenin mirası babı); İbn Teymiyye, İbnü’l-Kayyim, İbn Bâz ve İbn Useymîn bunu tercih etmiştir. Bazı âlimler (Zeyd b. Sâbit, üç mezhep) kardeşleri dedeyle ortak kılar.' },
  grandmotherWithFather:{ az:'Atanın anası oğlu (ata) ilə birlikdə varis sayılıb — Hənbəli məzhəbi (Ömər, İbn Məsud). Alimlərin çoxu isə ata olduqda onu məhrum sayır; bu halda alimə müraciət edin.', en:'The father’s mother was counted as an heir together with her son (the father) — the Hanbali position (ʿUmar, Ibn Masʿud). Most scholars hold that the father excludes her; consult a scholar in this case.', ru:'Мать отца учтена как наследница вместе со своим сыном (отцом) — ханбалитский мазхаб (Умар, Ибн Масуд). Большинство учёных считает, что отец её лишает; в этом случае обратитесь к учёному.', ar:'ورّثنا أم الأب مع ابنها على مذهب الحنابلة (وهو قول عمر وابن مسعود)، والجمهور على أن الأب يحجبها؛ فارجع إلى أهل العلم في هذه الحال.', tr:'Babanın annesi oğluyla (baba) birlikte mirasçı sayıldı — Hanbelî mezhebi (Ömer, İbn Mes’ûd). Âlimlerin çoğu ise babanın onu mahrum ettiği görüşündedir; bu durumda bir âlime danışın.' },
  wasiyyahCapped:{ az:'Vəsiyyət qalan malın 1/3-ə endirildi: «Üçdə bir, üçdə bir də çoxdur» (Buxari 2742, Müslim 1628). Artığı yalnız varislərin razılığı ilə icra olunur.', en:'The bequest was reduced to 1/3 of the remaining estate: “One third, and one third is a lot” (al-Bukhari 2742, Muslim 1628). More is valid only with the heirs’ consent.', ru:'Завещание уменьшено до 1/3 оставшегося имущества: «Треть, и треть — это много» (аль-Бухари 2742, Муслим 1628). Больше — только с согласия наследников.', ar:'رُدّت الوصية إلى الثلث: «الثلث، والثلث كثير» (البخاري ٢٧٤٢، مسلم ١٦٢٨)، وما زاد فموقوف على إجازة الورثة.', tr:'Vasiyet kalan malın 1/3’üne indirildi: “Üçte bir; üçte bir de çoktur” (Buhârî 2742, Müslim 1628). Fazlası ancak mirasçıların rızasıyla geçerlidir.' },
  debtsExceed:  { az:'Kəfən-dəfn xərcləri və borclar malı tam əhatə edir — varislərə heç nə qalmır.', en:'Funeral costs and debts consume the whole estate — nothing is left for the heirs.', ru:'Расходы на похороны и долги покрывают всё имущество — наследникам ничего не остаётся.', ar:'استغرقت تكاليف التجهيز والديون التركة كلها فلا شيء للورثة.', tr:'Kefen-defin masrafı ve borçlar terikenin tamamını karşılıyor — mirasçılara bir şey kalmıyor.' },
  remainderNoHeirs:{ az:'Fərzlərdən qalan hissəni alan əsəbə və rədd ediləcək varis yoxdur. Qalıq uzaq qohumlara (zəvil-ərham) və ya alimlərin ixtilaf etdiyi digər yerə verilir — alimə və ya məhkəməyə müraciət edin.', en:'There is no residuary and no heir to receive radd. The remainder goes to distant kin (dhawu al-arham) or elsewhere according to differing scholarly views — consult a scholar or a court.', ru:'Нет асаба и наследников для радда. Остаток переходит дальним родственникам (зауль-архам) или иному получателю по разным мнениям учёных — обратитесь к учёному или суду.', ar:'لا عاصب ولا من يُرَدّ عليه، فالباقي لذوي الأرحام أو غيرهم على خلاف بين العلماء؛ فارجع إلى أهل العلم أو المحكمة.', tr:'Asabe ve red alacak mirasçı yok. Kalan, uzak akrabalara (zevi’l-erham) veya âlimlerin ihtilaf ettiği başka bir yere verilir — bir âlime veya mahkemeye başvurun.' },
  noHeirs:      { az:'Seçilmiş varis yoxdur. Uzaq qohumlar və ya beytülmal məsələsi üçün alimə müraciət edin.', en:'No heirs are selected. For distant kin or the public treasury, consult a scholar.', ru:'Наследники не выбраны. По вопросу дальних родственников или казны обратитесь к учёному.', ar:'لم يُختر وارث. وفي ذوي الأرحام وبيت المال ارجع إلى أهل العلم.', tr:'Seçili mirasçı yok. Uzak akrabalar veya beytülmal konusunda bir âlime danışın.' },
}

// Ayələr — ərəb mətni: api.quran.com (Osmani yazı)
const VERSES = [
  {
    key: '4:11',
    ref: { az:'Nisa, 4:11', en:'an-Nisa 4:11', ru:'ан-Ниса, 4:11', ar:'النساء: ١١', tr:'Nisâ, 4:11' },
    text: {
      ar: 'يُوصِيكُمُ ٱللَّهُ فِىٓ أَوْلَـٰدِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ ٱلْأُنثَيَيْنِ ۚ فَإِن كُنَّ نِسَآءً فَوْقَ ٱثْنَتَيْنِ فَلَهُنَّ ثُلُثَا مَا تَرَكَ ۖ وَإِن كَانَتْ وَٰحِدَةً فَلَهَا ٱلنِّصْفُ ۚ وَلِأَبَوَيْهِ لِكُلِّ وَٰحِدٍ مِّنْهُمَا ٱلسُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُۥ وَلَدٌ ۚ فَإِن لَّمْ يَكُن لَّهُۥ وَلَدٌ وَوَرِثَهُۥٓ أَبَوَاهُ فَلِأُمِّهِ ٱلثُّلُثُ ۚ فَإِن كَانَ لَهُۥٓ إِخْوَةٌ فَلِأُمِّهِ ٱلسُّدُسُ ۚ مِنۢ بَعْدِ وَصِيَّةٍ يُوصِى بِهَآ أَوْ دَيْنٍ ۗ ءَابَآؤُكُمْ وَأَبْنَآؤُكُمْ لَا تَدْرُونَ أَيُّهُمْ أَقْرَبُ لَكُمْ نَفْعًا ۚ فَرِيضَةً مِّنَ ٱللَّهِ ۗ إِنَّ ٱللَّهَ كَانَ عَلِيمًا حَكِيمًا',
      az: 'Allah övladlarınız haqqında sizə tövsiyə buyurur ki, oğula iki qız hissəsi qədər pay düşür. Əgər (ölən şəxsin) qızlarının sayı ikidən artıqdırsa, mirasın üçdə iki hissəsi onlara çatır. Əgər təkcə bir nəfər qızdırsa, mirasın yarısı onundur. Övladı olduğu təqdirdə vəfat edənin ata və anasının hər birinə mirasın altıda bir hissəsi verilir. Əgər onun övladı olmayıb, varisi yalnız ata və anadan ibarətdirsə, (malın) üçdə bir hissəsi anaya aiddir. (Qalan hissə tamamilə ataya çatır). Əgər ölmüş şəxsin qardaşları və bacıları varsa, ananın hissəsi altıda birdir. (Yerdə qalan hissəsi yenə atanın payına düşür). Bu bölgü ölən şəxsin vəsiyyəti yerinə yetirildikdən və ya borcu ödənildikdən sonra aparılır. Valideynlərinizdən və övladlarınızdan hansı birinin (xeyir və) mənfəət cəhətdən sizə daha yaxın olduğunu bilmədiyiniz üçün bu (bölgü) Allah tərəfindən müəyyən edilmişdir. Həqiqətən, Allah (hər şeyi) biləndir, hikmət sahibidir!',
      en: 'Allah instructs you concerning your children: for the male, what is equal to the share of two females. But if there are [only] daughters, two or more, for them is two thirds of one’s estate. And if there is only one, for her is half. And for one’s parents, to each one of them is a sixth of his estate if he left children. But if he had no children and the parents [alone] inherit from him, then for his mother is one third. And if he had brothers [or sisters], for his mother is a sixth, after any bequest he [may have] made or debt. Your parents or your children — you know not which of them are nearest to you in benefit. [These shares are] an obligation [imposed] by Allah. Indeed, Allah is ever Knowing and Wise.',
      ru: 'Аллах заповедует вам относительно ваших детей: мужчине достается доля, равная доле двух женщин. Если все дети являются женщинами числом более двух, то им принадлежит две трети того, что он оставил. Если же есть всего одна дочь, то ей принадлежит половина. Каждому из родителей принадлежит одна шестая того, что он оставил, если у него есть ребенок. Если же у него нет ребенка, то ему наследуют родители, и матери достается одна треть. Если же у него есть братья, то матери достается одна шестая. Таков расчет после вычета по завещанию, которое он завещал, или выплаты долга. Ваши родители и ваши дети — вы не знаете, кто из них ближе и приносит вам больше пользы. Таково предписание Аллаха. Воистину, Аллах — Знающий, Мудрый.',
      tr: 'Allah çocuklarınız hakkında, erkeğe iki dişinin hissesi kadar tavsiye eder. Eğer kadınlar ikinin üstünde ise, bırakılanın üçte ikisi onlarındır; şayet bir ise yarısı onundur. Ana babadan her birine, ölenin çocuğu varsa yaptığı vasiyetten veya borcundan arta kalanın altıda biri, çocuğu yoksa, anası babası ona varis olur, anasına üçte bir düşer. Kardeşleri varsa, altıda biri annesinindir; babalarınız ve oğullarınızdan menfaatçe hangisinin size daha yakın olduğunu siz bilmezsiniz. Bunlar Allah tarafından tesbit edilmiştir. Doğrusu Allah bilendir, Hakim olandır.',
    },
  },
  {
    key: '4:12',
    ref: { az:'Nisa, 4:12', en:'an-Nisa 4:12', ru:'ан-Ниса, 4:12', ar:'النساء: ١٢', tr:'Nisâ, 4:12' },
    text: {
      ar: '۞ وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَٰجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ ۚ فَإِن كَانَ لَهُنَّ وَلَدٌ فَلَكُمُ ٱلرُّبُعُ مِمَّا تَرَكْنَ ۚ مِنۢ بَعْدِ وَصِيَّةٍ يُوصِينَ بِهَآ أَوْ دَيْنٍ ۚ وَلَهُنَّ ٱلرُّبُعُ مِمَّا تَرَكْتُمْ إِن لَّمْ يَكُن لَّكُمْ وَلَدٌ ۚ فَإِن كَانَ لَكُمْ وَلَدٌ فَلَهُنَّ ٱلثُّمُنُ مِمَّا تَرَكْتُم ۚ مِّنۢ بَعْدِ وَصِيَّةٍ تُوصُونَ بِهَآ أَوْ دَيْنٍ ۗ وَإِن كَانَ رَجُلٌ يُورَثُ كَلَـٰلَةً أَوِ ٱمْرَأَةٌ وَلَهُۥٓ أَخٌ أَوْ أُخْتٌ فَلِكُلِّ وَٰحِدٍ مِّنْهُمَا ٱلسُّدُسُ ۚ فَإِن كَانُوٓا۟ أَكْثَرَ مِن ذَٰلِكَ فَهُمْ شُرَكَآءُ فِى ٱلثُّلُثِ ۚ مِنۢ بَعْدِ وَصِيَّةٍ يُوصَىٰ بِهَآ أَوْ دَيْنٍ غَيْرَ مُضَآرٍّ ۚ وَصِيَّةً مِّنَ ٱللَّهِ ۗ وَٱللَّهُ عَلِيمٌ حَلِيمٌ',
      az: '(Ey kişilər!) Əgər (vəfat etmiş) arvadlarınızın uşağı yoxdursa, onların vəsiyyəti yerinə yetirildikdən və ya borcu ödənildikdən sonra qoyub getdikləri malın yarısı sizindir. Onların övladları olduqda isə mirasın dörddə biri sizə çatır. Əgər sizin uşağınız yoxdursa, vəsiyyətiniz yerinə yetirildikdən və ya borcunuz ödənildikdən sonra qoyub getdiyiniz malın dörddə biri arvadlarınızın payına düşür. Övladlarınız olduqda isə mirasın səkkizdə biri onlara çatır. Əgər (vəfat etmiş) kişi və qadının (ata-anası və övladı olmayıb) eyni anadan tək bir qardaşı və ya bir bacısı varsa, onların hər birinə mirasın altıda biri düşür. Onların sayı birdən artıq olduqda isə hamısı həmin malın üçdə birinə şərikdir. Bu, (vərəsələrə) zərər toxunmadığı halda edilən vəsiyyətin yerinə yetirilməsindən və ya borcun ödənilməsindən sonra icra olunur. (Bütün bunlar) Allah tərəfindən (bəndələrə) tövsiyə olunmuşdur. Allah (hər şeyi) biləndir, həlimdir!',
      en: 'And for you is half of what your wives leave if they have no child. But if they have a child, for you is one fourth of what they leave, after any bequest they [may have] made or debt. And for the wives is one fourth if you leave no child. But if you leave a child, then for them is an eighth of what you leave, after any bequest you [may have] made or debt. And if a man or woman leaves neither ascendants nor descendants but has a brother or a sister, then for each one of them is a sixth. But if they are more than two, they share a third, after any bequest which was made or debt, as long as there is no detriment [caused]. [This is] an ordinance from Allah, and Allah is Knowing and Forbearing.',
      ru: 'Вам принадлежит половина того, что оставили ваши жены, если у них нет ребенка. Но если у них есть ребенок, то вам принадлежит четверть того, что они оставили. Таков расчет после вычета по завещанию, которое они завещали, или выплаты долга. Им принадлежит четверть того, что вы оставили, если у вас нет ребенка. Но если у вас есть ребенок, то им принадлежит одна восьмая того, что вы оставили. Таков расчет после вычета по завещанию, которое вы завещали, или выплаты долга. Если мужчина или женщина, которые оставили наследство, не имеют родителей или детей, но имеют брата или сестру, то каждому из них достается одна шестая. Но если их больше, то они имеют равные права на одну треть. Таков расчет после вычета по завещанию, которое он завещал, или выплаты долга, если это не причиняет вреда. Такова заповедь Аллаха, ведь Аллах — Знающий, Выдержанный.',
      tr: 'Kadınlarınızın çocukları yoksa bıraktıklarının yarısı sizindir, çocukları varsa, bıraktıklarının ettikleri vasiyetten veya borçtan arta kalanın dörtte biri sizindir. Sizin çocuğunuz yoksa ettiğiniz vasiyet veya borç çıktıktan sonra bıraktıklarınızın dörtte biri karılarınızındır; çocuğunuz varsa, bıraktıklarınızın sekizde biri onlarındır. Eğer bir erkek veya kadına kelale yollu (çocuğu ve babası olmadığı halde) varis olunuyor ve bunların ana-bir erkek veya bir kız kardeşi bulunuyorsa, her birine edilen vasiyetten veya borçtan arta kalanın altıda biri düşer; ikiden çoksalar, üçte birine, zarara uğratılmaksızın ortak olurlar. Bunlar Allah tarafından tavsiye edilmiştir. Allah bilendir, Halim’dir.',
    },
  },
  {
    key: '4:176',
    ref: { az:'Nisa, 4:176', en:'an-Nisa 4:176', ru:'ан-Ниса, 4:176', ar:'النساء: ١٧٦', tr:'Nisâ, 4:176' },
    text: {
      ar: 'يَسْتَفْتُونَكَ قُلِ ٱللَّهُ يُفْتِيكُمْ فِى ٱلْكَلَـٰلَةِ ۚ إِنِ ٱمْرُؤٌا۟ هَلَكَ لَيْسَ لَهُۥ وَلَدٌ وَلَهُۥٓ أُخْتٌ فَلَهَا نِصْفُ مَا تَرَكَ ۚ وَهُوَ يَرِثُهَآ إِن لَّمْ يَكُن لَّهَا وَلَدٌ ۚ فَإِن كَانَتَا ٱثْنَتَيْنِ فَلَهُمَا ٱلثُّلُثَانِ مِمَّا تَرَكَ ۚ وَإِن كَانُوٓا۟ إِخْوَةً رِّجَالًا وَنِسَآءً فَلِلذَّكَرِ مِثْلُ حَظِّ ٱلْأُنثَيَيْنِ ۗ يُبَيِّنُ ٱللَّهُ لَكُمْ أَن تَضِلُّوا۟ ۗ وَٱللَّهُ بِكُلِّ شَىْءٍ عَلِيمٌۢ',
      az: '(Ya Rəsulum!) Səndən fətva istəyirlər. De: “Atası və övladı olmayan şəxs (şəxsin mirası) haqqında Allah sizə belə fətva verir: Övladı (və atası) olmayan bir şəxs vəfat etdikdə onun (atabir-anabir və ya yalnız atabir) bir bacısı varsa, qoyub getdiyi malın yarısı bacıya çatır. Övladı (və atası) olmayan bir qadın vəfat etdikdə qardaşı onun varisidir (malının hamısı onun payına düşür). Əgər vəfat edən şəxsin iki (və ya daha artıq) bacısı varsa, mirasın üçdə ikisi onlara çatır. Əgər varislər qardaş və bacılardan (bir qardaş, bir bacı və ya bir neçə bacı-qardaşdan) ibarət olarsa, kişiyə (qardaşa) qadına (bacıya) düşən payın iki misli verilir”. Allah bunu sizə doğru yoldan çıxmamağınız üçün aydınlaşdırır. Allah hər şeyi biləndir!',
      en: 'They request from you a [legal] ruling. Say, “Allah gives you a ruling concerning one having neither descendants nor ascendants [as heirs].” If a man dies, leaving no child but [only] a sister, she will have half of what he left. And he inherits from her if she [dies and] has no child. But if there are two sisters [or more], they will have two-thirds of what he left. If there are both brothers and sisters, the male will have the share of two females. Allah makes clear to you [His law], lest you go astray. And Allah is Knowing of all things.',
      ru: 'Они просят тебя вынести решение. Скажи: «Аллах вынесет для вас решение относительно тех, кто не оставляет после себя родителей или детей». Если умрет мужчина, у которого нет ребенка, но есть сестра, то ей принадлежит половина того, что он оставил. Он также наследует ей, если у нее нет ребенка. Если их две сестры, то им принадлежат две трети того, что он оставил. Если же они являются братьями и сестрами, то мужчине принадлежит доля, равная доле двух женщин. Аллах разъясняет вам это, чтобы вы не впали в заблуждение. Аллах ведает о всякой вещи.',
      tr: 'Senden fetva isterler, de ki: “Allah size ikinci dereceden mirasçılar hakkında fetva veriyor: Şayet çocuğu olmayıp bir kızkardeşi bulunan kimse ölürse, bıraktığının yarısı kızkardeşe kalır. Fakat kızkardeşinin çocuğu yoksa kendisi, ona tamamen varis olur. Eğer iki kızkardeş kalmışsa, bıraktığının üçte ikisi onlaradır. Eğer mirasçılar erkek ve kadın kardeşlerse, erkeğe, iki dişinin hissesi kadar vardır. Doğru yoldan saparsınız diye Allah size açıklıyor.” Allah her şeyi bilir.',
    },
  },
]
const TRANSLATOR = { az:'Tərcümə: V. Məmmədəliyev, Z. Bünyadov', en:'Translation: Sahih International', ru:'Перевод: Э. Кулиев', ar:'نص المصحف العثماني', tr:'Meal: Diyanet İşleri' }

// Altı sabit pay (Nisa 4:11, 4:12, 4:176 + Sünnə) — "Paylar bir baxışda" bölməsi.
// Şərtlər qısaldılıb (dəqiq hal üçün kalkulyator — faraid.js); hamısı yuxarıdakı
// REASON izahları ilə eynidir.
const SUNNAH = { az:'Sünnə', en:'Sunnah', ru:'Сунна', ar:'السنة', tr:'Sünnet' }
const SHARES = [
  { f:'1/2', v:1/2, refs:['4:11', '4:12', '4:176'],
    who:{ az:'Ər — övlad yoxdursa · tək qız · tək oğul qızı · tək bacı (ata-ana bir və ya ata bir) — qardaşı olmadıqda', en:'Husband — if there are no children · a single daughter · a single son’s daughter · a single full or paternal sister — when she has no brother', ru:'Муж — если нет детей · единственная дочь · единственная дочь сына · единственная полнородная или единокровная сестра — если нет брата', ar:'الزوج إن لم يكن فرع وارث · البنت الواحدة · بنت الابن الواحدة · الأخت الشقيقة أو لأب الواحدة — عند عدم المعصِّب', tr:'Koca — çocuk yoksa · tek kız · oğlun tek kızı · tek öz veya baba bir kız kardeş — erkek kardeşi yoksa' } },
  { f:'1/4', v:1/4, refs:['4:12'],
    who:{ az:'Ər — övlad varsa · arvad — övlad yoxdursa', en:'Husband — if there are children · wife — if there are no children', ru:'Муж — если есть дети · жена — если детей нет', ar:'الزوج مع الفرع الوارث · الزوجة مع عدمه', tr:'Koca — çocuk varsa · hanım — çocuk yoksa' } },
  { f:'1/8', v:1/8, refs:['4:12'],
    who:{ az:'Arvad — övlad varsa (bir neçə arvad bu payı bərabər bölür)', en:'Wife — if there are children (several wives share it equally)', ru:'Жена — если есть дети (несколько жён делят долю поровну)', ar:'الزوجة مع الفرع الوارث (وتشترك فيه الزوجات)', tr:'Hanım — çocuk varsa (birden fazla hanım bu payı eşit paylaşır)' } },
  { f:'2/3', v:2/3, refs:['4:11', '4:176'],
    who:{ az:'İki və daha çox qız · iki və daha çox oğul qızı · iki və daha çox bacı — qardaşları olmadıqda', en:'Two or more daughters · two or more son’s daughters · two or more sisters — when they have no brother', ru:'Две и более дочери · две и более дочери сына · две и более сестры — если нет брата', ar:'البنتان فأكثر · بنتا الابن فأكثر · الأختان فأكثر — عند عدم المعصِّب', tr:'İki veya daha fazla kız · oğlun iki veya daha fazla kızı · iki veya daha fazla kız kardeş — erkek kardeşleri yoksa' } },
  { f:'1/3', v:1/3, refs:['4:11', '4:12'],
    who:{ az:'Ana — övlad yoxdursa və qardaş-bacı ikidən azdırsa · iki və daha çox ana bir qardaş-bacı', en:'Mother — if there are no children and fewer than two siblings · two or more maternal siblings', ru:'Мать — если нет детей и братьев-сестёр меньше двух · двое и более единоутробных братьев и сестёр', ar:'الأم مع عدم الفرع الوارث وجمع الإخوة · الإخوة لأم اثنان فأكثر', tr:'Anne — çocuk yoksa ve kardeş ikiden azsa · iki veya daha fazla anne bir kardeş' } },
  { f:'1/6', v:1/6, refs:['4:11', '4:12'], sunnah:true,
    who:{ az:'Ata və ana — övlad varsa · baba · nənə(lər) · tək ana bir qardaş və ya bacı · bir qızla oğul qızı · ata-ana bir bacı ilə ata bir bacı', en:'Father and mother — if there are children · grandfather · grandmother(s) · a single maternal sibling · a son’s daughter with one daughter · a paternal sister with one full sister', ru:'Отец и мать — если есть дети · дед · бабушка (бабушки) · единственный единоутробный брат или сестра · дочь сына при одной дочери · единокровная сестра при одной полнородной', ar:'الأب والأم مع الفرع الوارث · الجد · الجدة أو الجدات · الواحد من ولد الأم · بنت الابن مع البنت · الأخت لأب مع الشقيقة', tr:'Baba ve anne — çocuk varsa · dede · nine(ler) · tek anne bir kardeş · bir kızla oğlun kızı · öz kız kardeşle baba bir kız kardeş' } },
]

const GROUPS = [
  { k: 'gSpouse',    keys: ['husband', 'wife'] },
  { k: 'gParents',   keys: ['father', 'mother', 'paternalGrandfather', 'paternalGrandmother', 'maternalGrandmother'] },
  { k: 'gChildren',  keys: ['sons', 'daughters', 'sonsSons', 'sonsDaughters'] },
  { k: 'gSiblings',  keys: ['fullBrothers', 'fullSisters', 'paternalBrothers', 'paternalSisters', 'maternalBrothers', 'maternalSisters'] },
  { k: 'gRelatives', keys: ['fullNephews', 'paternalNephews', 'fullUncles', 'paternalUncles', 'fullCousins', 'paternalCousins'] },
]
// Tək şəxs (keçirici) — qalanları sayğacla
const SINGLE = new Set(['husband', 'father', 'mother', 'paternalGrandfather', 'paternalGrandmother', 'maternalGrandmother'])
const COUNT_MAX = 20

const pick = (obj, l) => obj?.[l] || obj?.en || ''

// Kəsrləri topla ("1/8" + "13/120" → "7/30") — donutun "Digər varislər" payı üçün
const gcd = (a, b) => (b ? gcd(b, a % b) : a)
function addFracs(list) {
  let n = 0, d = 1
  for (const f of list) {
    const [a, b = '1'] = String(f).split('/').map(Number)
    n = n * b + a * d; d = d * b
    const g = gcd(Math.abs(n), d) || 1; n /= g; d /= g
  }
  return d === 1 ? String(n) : `${n}/${d}`
}

// Kəsr — ərəbcədə də soldan sağa (1/8)
function Frac({ value }) {
  return <bdi className="inh-frac ui-num" dir="ltr">{value}</bdi>
}

function Stepper({ id, label, value, max, onChange, l }) {
  return (
    <div className={`inh-heir${value > 0 ? ' is-on' : ''}`}>
      <span className="inh-heir__label" id={`${id}-l`}>{label}</span>
      <div className="inh-stepper" role="group" aria-labelledby={`${id}-l`}>
        <button type="button" className="ui-icon-btn inh-stepper__btn" aria-label={`${pick(L.decrease, l)}: ${label}`}
          disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
          <Icon name="minus" size={18} />
        </button>
        <output className="inh-stepper__val ui-num" aria-live="polite"><span key={value} className={value > 0 ? 'inh-v4-val tm-pop' : 'inh-v4-val'}>{value}</span></output>
        <button type="button" className="ui-icon-btn inh-stepper__btn" aria-label={`${pick(L.increase, l)}: ${label}`}
          disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
          <Icon name="plus" size={18} />
        </button>
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange, l }) {
  return (
    <button type="button" className={`inh-heir inh-toggle${value ? ' is-on' : ''}`} aria-pressed={value}
      onClick={() => onChange(value ? 0 : 1)}>
      <span className="inh-heir__label">{label}</span>
      <span className="inh-toggle__state" aria-hidden="true">
        {value ? <><Icon name="check" size={16} /> {pick(L.yes, l)}</> : <Icon name="plus" size={16} />}
      </span>
    </button>
  )
}

function MoneyField({ id, label, hint, value, onChange, placeholder }) {
  return (
    <label className="ui-field inh-field" htmlFor={id}>
      <span className="ui-field__label">{label}</span>
      <input id={id} type="number" inputMode="decimal" min="0" className="ui-input inh-input"
        value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      {hint && <span className="ui-field__hint">{hint}</span>}
    </label>
  )
}

const EMPTY_HEIRS = {}

export default function InheritancePage({ setPage }) {
  const { lang } = useLang()
  const l = ['az', 'en', 'ru', 'ar', 'tr'].includes(lang) ? lang : 'en'
  const s = (k) => pick(L[k], l)
  const navigate = useNavigate()

  const [deceased, setDeceased] = useState('male')
  const [estate, setEstate] = useState('')
  const [funeral, setFuneral] = useState('')
  const [debts, setDebts] = useState('')
  const [wasiyyah, setWasiyyah] = useState('')
  const [heirs, setHeirs] = useState(EMPTY_HEIRS)

  const setHeir = (k, v) => setHeirs(prev => ({ ...prev, [k]: v }))
  const reset = () => { setEstate(''); setFuneral(''); setDebts(''); setWasiyyah(''); setHeirs(EMPTY_HEIRS) }

  const result = useMemo(() => calculateInheritance({ estate, funeral, debts, wasiyyah, deceased, heirs }),
    [estate, funeral, debts, wasiyyah, deceased, heirs])

  const fmt = (v) => (Number.isFinite(v) ? v : 0).toLocaleString(NUM_LOCALES[l] || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const moneyPh = fmt(0)

  const anyHeir = result.shares.length > 0
  const showResult = anyHeir && result.gross > 0
  const active = result.shares.filter(r => r.type !== 'blocked')
  const blockedRows = result.shares.filter(r => r.type === 'blocked')
  const heirName = (k) => pick(HEIR[k], l)

  // Donut seqmentləri: viz palitrası 4 rəngdir — ən böyük 3 pay ayrıca,
  // qalanları "Digər varislər"də birləşir; bölünməmiş qalıq boz (muted).
  const fracNum = (f) => { const [n, d = '1'] = String(f).split('/'); return Number(n) / Number(d) }
  const shareSegs = active
    .filter(r => fracNum(r.fraction) > 0)
    .map(r => ({ key: r.heir, label: heirName(r.heir) + (r.count > 1 ? ` × ${r.count}` : ''), value: fracNum(r.fraction), frac: r.fraction }))
    .sort((a, b) => b.value - a.value)
  let segments = shareSegs
  if (shareSegs.length > 4) {
    const rest = shareSegs.slice(3)
    segments = [...shareSegs.slice(0, 3), { key: 'others', label: `${s('others')} (${rest.length})`, value: rest.reduce((t, x) => t + x.value, 0), frac: addFracs(rest.map(x => x.frac)) }]
  }
  segments = segments.map((x, i) => ({ ...x, tone: i + 1 }))
  if (fracNum(result.unallocated) > 0) segments.push({ key: 'rest', label: s('unallocated'), value: fracNum(result.unallocated), frac: result.unallocated, tone: 'muted' })
  const fmtShare = (v, x) => x?.frac || `${Math.round(v * 1000) / 10}%`

  const reasonText = (r) => {
    const txt = pick(REASON[r.reasonKey], l)
    return txt.replace('{who}', r.blockedBy ? heirName(r.blockedBy) : '—')
  }

  // v3.2: dar ekranda nəticə paneli varislərin altında qalır — yapışqan mini xülasə + "Bölgüyə bax"
  const resultRef = useRef(null)
  const [resultSeen, setResultSeen] = useState(false)
  useEffect(() => {
    const el = resultRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([en]) => setResultSeen(en.isIntersecting || en.boundingClientRect.top < 0), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const heirCount = active.reduce((t, r) => t + (r.count || 1), 0)
  const goResult = () => {
    const el = resultRef.current
    if (!el) return
    el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    el.querySelector('h2')?.focus({ preventScroll: true })
  }
  const [copied, setCopied] = useState(false)
  const copyResult = async () => {
    const lines = [`${s('title')} — ${s('resultTitle')}`, `${s('gross')}: ${fmt(result.gross)}`, `${s('net')}: ${fmt(result.net)}`, '']
    active.forEach(r => lines.push(`${heirName(r.heir)}${r.count > 1 ? ` × ${r.count}` : ''}: ${r.fraction} — ${fmt(r.total)}`))
    lines.push('', s('disclaimer'))
    try { await navigator.clipboard.writeText(lines.join('\n')); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* icazə yoxdur */ }
  }

  const openLearn = (e, slug) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(pathFor('learn', lang, slug))
    window.scrollTo(0, 0)
  }

  return (
    <div className="inh-page">
      <header className="ui-page-hero inh-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={s('title')} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('inheritance') || navGroupOf('zakat'), lang)}</span>
          <h1 className="ui-display">{s('title')}</h1>
          <p className="ui-lead">{s('lead')}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {s('how')}</p>
          <ul className="ui-page-hero__stats">
            <li><b className="ui-num">6</b><span>{s('statShares')}</span></li>
            <li><b className="ui-num">3</b><span>{s('statVerses')}</span></li>
            <li><b><Frac value="1/3" /></b><span>{s('statWill')}</span></li>
          </ul>
          <div className="ui-page-hero__actions">
            <a className="ui-btn ui-btn--primary ui-btn--sm" href="#inh-calc"><Icon name="inheritance" className="ui-btn__icon" /> {s('actCalc')}</a>
            <a className="ui-btn ui-btn--secondary ui-btn--sm" href="#inh-shares">{s('actShares')}</a>
          </div>
        </div>
      </header>

      <section id="inh-calc" className="ui-section ui-section--tight">
        <div className="ui-container inh-layout">

          {/* ══ Daxiletmə: 3 nömrəli addım ══ */}
          <div className="inh-inputs">
            <div className="ui-card inh-card" data-reveal="left">
              <h2 className="inh-card__title"><span className="inh-step-n ui-num" aria-hidden="true">1</span> {s('estateTitle')}</h2>
              <div className="inh-fields">
                <MoneyField id="inh-estate" label={s('estate')} value={estate} onChange={setEstate} placeholder={moneyPh} />
                <MoneyField id="inh-funeral" label={s('funeral')} value={funeral} onChange={setFuneral} placeholder={moneyPh} />
                <MoneyField id="inh-debts" label={s('debts')} value={debts} onChange={setDebts} placeholder={moneyPh} />
                <MoneyField id="inh-wasiyyah" label={s('wasiyyah')} hint={s('wasiyyahHint')} value={wasiyyah} onChange={setWasiyyah} placeholder={moneyPh} />
              </div>
              <p className="inh-muted">{s('orderNote')}</p>
            </div>

            <div className="ui-card inh-card" data-reveal="left" data-reveal-delay="90">
              <div className="inh-card__head">
                <h2 className="inh-card__title" id="inh-deceased-l"><span className="inh-step-n ui-num" aria-hidden="true">2</span> {s('deceased')}</h2>
                <div className="ui-segmented inh-gender" role="radiogroup" aria-labelledby="inh-deceased-l">
                  {['male', 'female'].map(g => (
                    <button key={g} type="button" role="radio" aria-checked={deceased === g}
                      onClick={() => setDeceased(g)}>{s(g)}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ui-card inh-card" data-reveal="left" data-reveal-delay="180">
              <div className="inh-card__head">
                <h2 className="inh-card__title"><span className="inh-step-n ui-num" aria-hidden="true">3</span> {s('heirsTitle')}</h2>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={reset}>
                  <Icon name="refresh" className="ui-btn__icon" /> {s('reset')}
                </button>
              </div>
              <p className="inh-muted">{s('heirsHint')}</p>
              {GROUPS.map(g => {
                const keys = g.keys.filter(k => heirAllowed(k, deceased))
                return (
                  <fieldset key={g.k} className="inh-group">
                    <legend className="inh-group__title">{s(g.k)}</legend>
                    <div className="inh-heirs">
                      {keys.map(k => {
                        const v = heirs[k] || 0
                        return SINGLE.has(k)
                          ? <Toggle key={k} label={heirName(k)} value={v > 0} onChange={x => setHeir(k, x)} l={l} />
                          : <Stepper key={k} id={`inh-${k}`} label={heirName(k)} value={v} max={HEIR_MAX[k] || COUNT_MAX} onChange={x => setHeir(k, x)} l={l} />
                      })}
                    </div>
                  </fieldset>
                )
              })}
            </div>

            {/* Dar ekran: yapışqan mini xülasə (nəticə ekranda görünəndə gizlənir) */}
            <div className={`inh-mini${resultSeen ? ' is-hidden' : ''}`} data-testid="inh-mini" aria-hidden={resultSeen ? 'true' : undefined}>
              <span className="inh-mini__icon" aria-hidden="true"><Icon name="inheritance" size={18} /></span>
              <span className="inh-mini__txt">
                {showResult
                  ? <><b className="ui-num">{fmt(result.net)}</b><span>{s('net')} · <span className="ui-num">{heirCount}</span> {s('donutCenter')}</span></>
                  : <span>{s('miniEmpty')}</span>}
              </span>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm inh-mini__go" onClick={goResult} tabIndex={resultSeen ? -1 : undefined}>
                {s('toResult')} <Icon name="arrowDown" size={14} />
              </button>
            </div>
          </div>

          {/* ══ Nəticə ══ */}
          <div className="inh-result" aria-live="polite" ref={resultRef}>
            <div className="ui-card inh-card">
              <div className="inh-card__head">
                <h2 className="inh-card__title" tabIndex={-1}><Icon name="analytics" size={18} /> {s('resultTitle')}</h2>
                {showResult && (
                  <div className="inh-res-actions">
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copyResult} aria-label={s('copyRes')} title={s('copyRes')}>
                      <Icon name={copied ? 'check' : 'copy'} className="ui-btn__icon" /> <span className="inh-res-actions__l">{copied ? s('copied') : s('copyRes')}</span>
                    </button>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => window.print()} aria-label={s('printRes')} title={s('printRes')}>
                      <Icon name="download" className="ui-btn__icon" />
                    </button>
                  </div>
                )}
              </div>

              {!showResult ? (
                <div className="inh-empty">
                  <Donut segments={[]} size={96} thickness={12} legend={false} label={s('emptyResult')} />
                  <p>{s('emptyResult')}</p>
                </div>
              ) : (
                <>
                  <dl className="inh-summary">
                    <div><dt>{s('gross')}</dt><dd className="ui-num">{fmt(result.gross)}</dd></div>
                    {Number(funeral) > 0 && <div><dt>{s('funeral')}</dt><dd className="ui-num">−{fmt(Number(funeral))}</dd></div>}
                    {Number(debts) > 0 && <div><dt>{s('debts')}</dt><dd className="ui-num">−{fmt(Number(debts))}</dd></div>}
                    {result.wasiyyah > 0 && <div><dt>{s('wasiyyah')}</dt><dd className="ui-num">−{fmt(result.wasiyyah)}</dd></div>}
                    <div className="inh-summary__net"><dt>{s('net')}</dt><dd className="ui-num"><TweenNumber value={result.net} format={fmt} /></dd></div>
                  </dl>

                  {segments.length > 0 && (
                    <div className="inh-chart" key={segments.map(x => `${x.label}:${x.value}`).join('|')}>
                      <Donut segments={segments} format={fmtShare} size={132} thickness={18}
                        center={{ value: String(active.reduce((t, r) => t + (r.count || 1), 0)), label: s('donutCenter') }}
                        label={`${s('barLabel')}: ` + segments.map(x => `${x.label} ${fmtShare(x.value, x)}`).join(', ')} />
                    </div>
                  )}

                  <table className="inh-table">
                    <thead>
                      <tr>
                        <th scope="col">{s('colHeir')}</th>
                        <th scope="col">{s('colShare')}</th>
                        <th scope="col">{s('colEach')}</th>
                        <th scope="col">{s('colTotal')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.map(r => (
                        <tr key={r.heir}>
                          <th scope="row" className="inh-table__heir">
                            <span className="inh-table__name">{heirName(r.heir)}{r.count > 1 && <span className="ui-num"> × {r.count}</span>}</span>
                            <span className="inh-table__why">{reasonText(r)}</span>
                          </th>
                          <td data-label={s('colShare')}>
                            <Frac value={r.fraction} />
                            <span className="inh-table__kind">
                              {r.fard ? <>{s('fardOf')} <Frac value={r.fard} />{r.asabah ? ` ${s('plusRest')}` : ''}</> : s('residuary')}
                            </span>
                          </td>
                          <td data-label={s('colEach')} className="ui-num">{fmt(r.portionEach)}</td>
                          <td data-label={s('colTotal')} className="ui-num inh-table__total">{fmt(r.total)}</td>
                        </tr>
                      ))}
                      {fracNum(result.unallocated) > 0 && (
                        <tr className="inh-table__rest">
                          <th scope="row"><span className="inh-table__name">{s('unallocated')}</span></th>
                          <td data-label={s('colShare')}><Frac value={result.unallocated} /></td>
                          <td data-label={s('colEach')}>—</td>
                          <td data-label={s('colTotal')} className="ui-num inh-table__total">{fmt(result.net * fracNum(result.unallocated))}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {showResult && blockedRows.length > 0 && (
              <div className="ui-card inh-card">
                <h2 className="inh-card__title"><Icon name="shield" size={18} /> {s('blockedTitle')}</h2>
                <ul className="inh-blocked">
                  {blockedRows.map(r => (
                    <li key={r.heir}>
                      <strong>{heirName(r.heir)}{r.count > 1 && <span className="ui-num"> × {r.count}</span>}</strong>
                      <span>{reasonText(r)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showResult && result.notes.length > 0 && (
              <div className="ui-card inh-card inh-notes">
                <h2 className="inh-card__title"><Icon name="info" size={18} /> {s('notesTitle')}</h2>
                <ul>
                  {result.notes.map(n => <li key={n}>{pick(NOTE[n], l)}</li>)}
                </ul>
              </div>
            )}

            <aside className="ui-callout ui-callout--warn inh-disclaimer" role="note">
              <Icon name="alert" />
              <div>
                <strong className="ui-callout__title">{s('disclaimerTitle')}</strong>
                <p>{s('disclaimer')}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ══ Ardıcıllıq: kəfən → borc → vəsiyyət → varislər ══ */}
      <section className="ui-section ui-section--alt inh-order">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{s('orderEy')}</span>
            <h2 className="ui-title">{s('orderTitle')}</h2>
            <p className="ui-lead">{s('orderLead')}</p>
          </div>
          <ol className="ui-steps ui-steps--row">
            {[['funeral', 'o1'], ['debts', 'o2'], ['wasiyyah', 'o3'], ['o4t', 'o4']].map(([tk, xk], i) => (
              <li key={tk} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                <div className="ui-step__body">
                  <h3 className="ui-step__title">{s(tk)}</h3>
                  <p className="ui-step__text">{s(xk)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ Altı sabit pay ══ */}
      <section id="inh-shares" className="ui-section inh-shares ui-cv" style={{ '--cv-h': '760px' }}>
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{s('sharesEy')}</span>
            <h2 className="ui-title">{s('sharesTitle')}</h2>
            <p className="ui-lead">{s('sharesLead')}</p>
          </div>
          <ChartFigure note={s('sharesNote')}>
            <BarChart
              label={s('sharesTitle')}
              labelWidth="64px"
              max={1}
              format={(v) => `${Math.round(v * 1000) / 10}%`}
              data={SHARES.map((x, i) => ({
                key: x.f,
                label: <Frac value={x.f} />,
                value: x.v,
                tone: i < 3 ? 1 : 2,
                note: <>{pick(x.who, l)} <span className="inh-shares__ref">({x.refs.join(' · ')}{x.sunnah ? ` · ${pick(SUNNAH, l)}` : ''})</span></>,
              }))}
            />
          </ChartFigure>
        </div>
      </section>

      {/* ══ Dəlillər ══ */}
      <section className="ui-section ui-section--alt inh-evidence ui-cv" style={{ '--cv-h': '1600px' }}>
        <div className="ui-container ui-container--narrow">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{s('evidenceTitle')}</span>
            <h2 className="ui-title">{s('evidenceTitle')}</h2>
            <p className="ui-lead">{s('evidenceLead')}</p>
          </div>
          <div className="inh-verses">
            {VERSES.map(v => (
              <figure key={v.key} className="ui-quote inh-verse" data-reveal>
                <blockquote>
                  <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{v.text.ar}</p>
                  {l !== 'ar' && <p className="ui-quote__text">{v.text[l]}</p>}
                </blockquote>
                <figcaption className="ui-quote__src">— {pick(v.ref, l)}{l !== 'ar' && <span className="inh-translator"> · {pick(TRANSLATOR, l)}</span>}</figcaption>
              </figure>
            ))}
            <figure className="ui-quote inh-verse" data-reveal>
              <blockquote>
                <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{L.hadithText.ar}</p>
                {l !== 'ar' && <p className="ui-quote__text">{s('hadithText')}</p>}
              </blockquote>
              <figcaption className="ui-quote__src">— {s('hadithSrc')}</figcaption>
            </figure>
          </div>

          <div className="inh-method" data-reveal>
            <h3 className="inh-card__title"><Icon name="learn" size={18} /> {s('methodTitle')}</h3>
            <p>{s('method')}</p>
          </div>
        </div>
      </section>

      {/* ══ Əlaqəli bölmələr ══ */}
      <section className="ui-section ui-section--tight inh-related">
        <div className="ui-container ui-container--narrow">
          <h2 className="ui-title ui-title--sm inh-related__title">{s('relTitle')}</h2>
          <ul className="ui-list">
            {[['wasiyyah', 'relWill', 'list'], ['janazah', 'relJanazah', 'learn']].map(([slug, k, icon]) => (
              <li key={slug}>
                <a className="ui-list__item" href={pathFor('learn', lang, slug)} onClick={(e) => openLearn(e, slug)}>
                  <Icon name={icon} />
                  <span>{s(k)}<small>{s(k + 'Sub')}</small></span>
                  <Icon name="chevron" className="ui-list__chev ui-flip-rtl" />
                </a>
              </li>
            ))}
            <li>
              <PageLink className="ui-list__item" to="zakat" setPage={setPage} onNavigate={() => window.scrollTo(0, 0)}>
                <Icon name="zakat" />
                <span>{s('relZakat')}<small>{s('relZakatSub')}</small></span>
                <Icon name="chevron" className="ui-list__chev ui-flip-rtl" />
              </PageLink>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}
