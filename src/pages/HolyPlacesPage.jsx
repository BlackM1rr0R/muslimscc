import { useState, useRef, lazy, Suspense } from 'react'
import Swap from '../components/pagefx/Swap'
import Icon3D from '../components/Icon3D'
import PressedGlide from '../components/pagefx/PressedGlide'
// Foto qalereyası — kart dəstəsi (drag, domMax) tənbəl yüklənir
const CardStack = lazy(() => import('../motion/CardStack'))
import DeferRender from '../components/DeferRender'
import ReaderDialog from '../components/reader/ReaderDialog'
import { shareLink } from '../components/collect/useStarred'
import { CopyStatus } from '../components/collect/StarButton'

// ── v3.2: kartda qısa önizləmə, "Ətraflı" — oxu pəncərəsi (əvvəlki/növbəti, paylaş) ──
const HP32 = {
  az: { more: 'Ətraflı', close: 'Bağla', prev: 'Əvvəlki', next: 'Növbəti', share: 'Paylaş', copied: 'Kopyalandı' },
  en: { more: 'Details', close: 'Close', prev: 'Previous', next: 'Next', share: 'Share', copied: 'Copied' },
  ru: { more: 'Подробнее', close: 'Закрыть', prev: 'Назад', next: 'Далее', share: 'Поделиться', copied: 'Скопировано' },
  ar: { more: 'التفاصيل', close: 'إغلاق', prev: 'السابق', next: 'التالي', share: 'مشاركة', copied: 'تم النسخ' },
  tr: { more: 'Ayrıntılar', close: 'Kapat', prev: 'Önceki', next: 'Sonraki', share: 'Paylaş', copied: 'Kopyalandı' },
}
import { useLang } from '../contexts/LangContext'
import '../styles/HolyPlacesPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
// Yer fotoları (Wikimedia Commons, açıq lisenziya) və öz SVG xəritəmiz
import PlacePhoto from '../components/media/PlacePhoto'
import { HajjRouteMap } from '../components/media/SiraMaps'
// v3: savab kafelləri, məsafə qrafiki (koordinatlardan), əlaqəli bölmələr
// Yoxlanılıb (hadith-api): Buxari 1189, 1190; Müslim 1397; İbn Macə 1406, 1412 (əl-Albani: səhih)
import { StatTile, ChartFigure, BarChart } from '../components/viz'
import PageLink from '../components/PageLink'
import { localizeSource } from '../utils/sourceNames'
import { pickUi } from '../utils/uiText'
// v5.7: 3D Məscidül-Haram (three.js — yalnız bu bölmə ekrana yaxınlaşanda yüklənir)
const Kaaba3D = lazy(() => import('../components/media/Kaaba3D'))
const MakkahLive = lazy(() => import('../components/media/MakkahLive'))

const SAHIH = { az: 'səhih (əl-Albani)', en: 'sahih (al-Albani)', ru: 'достоверный (аль-Альбани)', ar: 'صحيح (الألباني)', tr: 'sahih (Elbânî)' }

const LABELS = {
  az: { title:'Müqəddəs yerlər', subtitle:'İslamın müqəddəs məkanları', openMaps:'Xəritədə aç', significance:'Əhəmiyyəti', reference:'İstinad', adabTitle:'Ziyarət ədəbi', adabText:'İbadət niyyəti ilə səfərə yalnız üç məscidə çıxılır: Məscidül-Haram, Peyğəmbər ﷺ məscidi və Məscidül-Əqsa (Buxari 1189, Müslim 1397). Mağaralar, dağlar, daşlar və qəbirlər təbərrük yeri deyil — onlara toxunub bərəkət ummaq və ya oradan torpaq-daş götürmək sünnədə yoxdur (Tirmizi 2180). Qəbirlər isə sünnəyə uyğun ziyarət edilir: ölülərə salam verilir, onlar üçün dua edilir və axirət xatırlanır (Müslim 974, 976).' },
  en: { title:'Holy Places', subtitle:'Sacred places of Islam', openMaps:'Open in Maps', significance:'Significance', reference:'Reference', adabTitle:'Etiquette of visiting', adabText:'One may set out on a journey for the purpose of worship only to three mosques: Masjid al-Haram, the Mosque of the Prophet ﷺ and Masjid al-Aqsa (Bukhari 1189, Muslim 1397). Caves, mountains, stones and graves are not places of tabarruk — touching them seeking blessing or taking soil or stones from them has no basis in the Sunnah (Tirmidhi 2180). Graves are visited according to the Sunnah: greeting the dead with salam, supplicating for them and remembering the Hereafter (Muslim 974, 976).' },
  ru: { title:'Святые Места', subtitle:'Священные места ислама', openMaps:'Открыть на карте', significance:'Значение', reference:'Ссылка', adabTitle:'Этикет посещения', adabText:'Отправляться в путь ради поклонения можно лишь к трём мечетям: Заповедной мечети, мечети Пророка ﷺ и мечети аль-Акса (Бухари 1189, Муслим 1397). Пещеры, горы, камни и могилы не являются местами для поиска благодати — прикасаться к ним ради благословения или брать оттуда землю и камни не имеет основы в Сунне (Тирмизи 2180). Могилы посещают согласно Сунне: приветствуют умерших, молятся за них и вспоминают о Последней жизни (Муслим 974, 976).' },
  ar: { title:'الأماكن المقدسة', subtitle:'الأماكن المقدسة في الإسلام', openMaps:'افتح في الخريطة', significance:'الأهمية', reference:'المرجع', adabTitle:'آداب الزيارة', adabText:'لا تُشدّ الرحال بقصد العبادة إلا إلى ثلاثة مساجد: المسجد الحرام، ومسجد النبي ﷺ، والمسجد الأقصى (البخاري 1189، مسلم 1397). والغيران والجبال والأحجار والقبور ليست مواضع للتبرك، فالتمسح بها رجاء البركة أو أخذ ترابها وأحجارها لا أصل له في السنة (الترمذي 2180). وتُزار القبور على وفق السنة: بالسلام على أهلها والدعاء لهم وتذكّر الآخرة (مسلم 974، 976).' },
  tr: { title:'Kutsal Yerler', subtitle:'İslam\'ın kutsal mekanları', openMaps:'Haritada aç', significance:'Önemi', reference:'Referans', adabTitle:'Ziyaret adabı', adabText:'İbadet niyetiyle yolculuk yalnızca üç mescide yapılır: Mescid-i Haram, Peygamber ﷺ mescidi ve Mescid-i Aksa (Buhari 1189, Müslim 1397). Mağaralar, dağlar, taşlar ve kabirler teberrük yeri değildir — onlara dokunarak bereket ummak ya da oradan toprak ve taş almak sünnette yoktur (Tirmizi 2180). Kabirler ise sünnete uygun ziyaret edilir: ölülere selam verilir, onlar için dua edilir ve ahiret hatırlanır (Müslim 974, 976).' },
}

// photo: public/images/places/<açar> (src/data/placeImages.js);
// mapFocus: canlı təsvirsiz uyğun foto tapılmayan yerlər — həcc xəritəsində həmin sahə vurğulanır
const PLACES = [
  {
    icon: 'hajjguide',
    nameAr: 'الكعبة المشرفة / المسجد الحرام',
    name: { az:'Kəbə / Məscidül-Haram', en:'Kaaba / Masjid al-Haram', ru:'Кааба / Масджид аль-Харам', ar:'الكعبة المشرفة / المسجد الحرام', tr:'Kâbe / Mescid-i Haram' },
    photo: 'masjid-al-haram',
    lat: 21.4225, lon: 39.8262,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'İslamın ən müqəddəs yeri olan Kəbə, Məscidül-Haram məscidinin mərkəzində yerləşir. Müsəlmanlar gündə beş dəfə namazda Kəbəyə üz tuturlar. Həcc və Ümrə ziyarətlərinin mərkəzi məkanıdır.',
      en:'The Kaaba, located at the center of Masjid al-Haram, is the holiest site in Islam. Muslims face the Kaaba during their five daily prayers. It is the central site for the Hajj and Umrah pilgrimages.',
      ru:'Кааба, расположенная в центре Масджид аль-Харам, является самым священным местом в исламе. Мусульмане обращаются лицом к Каабе во время пятикратной молитвы. Это центральное место паломничества Хаджа и Умры.',
      ar:'الكعبة المشرفة الواقعة في وسط المسجد الحرام هي أقدس مكان في الإسلام. يتوجه المسلمون نحو الكعبة في صلواتهم الخمس اليومية. وهي المكان المركزي لأداء مناسك الحج والعمرة.',
      tr:'Mescid-i Haram\'ın merkezinde yer alan Kâbe, İslam\'ın en kutsal mekânıdır. Müslümanlar günde beş vakit namazda Kâbe\'ye yönelirler. Hac ve Umre ibadetlerinin merkezi mekânıdır.',
    },
    significance: {
      az:'Hz. İbrahim və İsmail tərəfindən inşa edilən ilk Beytullah. Yer üzündə ibadət üçün tikilən ilk ev.',
      en:'The first House of God built by Prophet Ibrahim and Ismail. The first house built for worship on Earth.',
      ru:'Первый Дом Аллаха, построенный пророком Ибрахимом и Исмаилом. Первый дом, построенный для поклонения на земле.',
      ar:'أول بيت لله بناه النبي إبراهيم وإسماعيل عليهما السلام. أول بيت وُضع للعبادة على الأرض.',
      tr:'Hz. İbrahim ve İsmail tarafından inşa edilen ilk Beytullah. Yeryüzünde ibadet için inşa edilen ilk ev.',
    },
    reference: { az:'Ali-İmran 96', en:'Ali \'Imran 96', ru:'Аль-Имран 96', ar:'آل عمران ٩٦', tr:'Âl-i İmrân 96' },
  },
  {
    icon: 'holyplaces',
    nameAr: 'المسجد النبوي',
    name: { az:'Məscidün-Nəbəvi', en:'Al-Masjid an-Nabawi', ru:'Масджид ан-Набави', ar:'المسجد النبوي', tr:'Mescid-i Nebevî' },
    // Foto qəsdən yoxdur: məscidin şəkillərində qəbir üzərindəki günbəz görünür (sahibin qərarı)
    lat: 24.4672, lon: 39.6112,
    city: { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' },
    desc: {
      az:'Peyğəmbərimiz Hz. Muhəmmədin (s.a.s) Mədinəyə hicrət etdikdən sonra inşa etdiyi məscid. İslam tarixinin ən mühüm məscidlərindən biridir. Peyğəmbərimizin məzarı burada yerləşir.',
      en:'The mosque built by Prophet Muhammad (PBUH) after his migration to Medina. It is one of the most important mosques in Islamic history. The Prophet\'s tomb is located here.',
      ru:'Мечеть, построенная Пророком Мухаммадом (мир ему) после переселения в Медину. Одна из важнейших мечетей в истории ислама. Здесь находится могила Пророка.',
      ar:'المسجد الذي بناه النبي محمد ﷺ بعد هجرته إلى المدينة. يُعد من أهم المساجد في تاريخ الإسلام. يضم قبر النبي ﷺ.',
      tr:'Hz. Muhammed\'in (s.a.s) Medine\'ye hicretinden sonra inşa ettiği mescid. İslam tarihinin en önemli mescitlerinden biridir. Hz. Peygamber\'in kabri burada bulunmaktadır.',
    },
    significance: {
      az:'Burada qılınan bir namaz başqa məscidlərdə qılınan min namazdan üstündür (Məscidül-Haram istisna olmaqla).',
      en:'One prayer performed here is superior to one thousand prayers in other mosques (except Masjid al-Haram).',
      ru:'Одна молитва здесь превосходит тысячу молитв в других мечетях (кроме Масджид аль-Харам).',
      ar:'صلاة في هذا المسجد خير من ألف صلاة فيما سواه إلا المسجد الحرام.',
      tr:'Burada kılınan bir namaz, diğer mescitlerde kılınan bin namazdan üstündür (Mescid-i Haram hariç).',
    },
    reference: { az:'Buxari 1190', en:'Bukhari 1190', ru:'Бухари 1190', ar:'البخاري ١١٩٠', tr:'Buhârî 1190' },
  },
  {
    icon: 'holyplaces',
    nameAr: 'المسجد الأقصى',
    name: { az:'Məscidül-Əqsa', en:'Al-Aqsa Mosque', ru:'Масджид аль-Акса', ar:'المسجد الأقصى', tr:'Mescid-i Aksâ' },
    photo: 'al-aqsa',
    lat: 31.7761, lon: 35.2358,
    city: { az:'Qüds', en:'Jerusalem', ru:'Иерусалим', ar:'القدس', tr:'Kudüs' },
    desc: {
      az:'İslamda üçüncü ən müqəddəs yer. Peyğəmbərimizin (s.a.s) İsra və Merac gecəsində ziyarət etdiyi məsciddir. İlk qiblə istiqaməti olaraq bilinir.',
      en:'The third holiest site in Islam. It is the mosque visited by Prophet Muhammad (PBUH) during the Night Journey (Isra and Mi\'raj). Known as the first direction of prayer (Qibla).',
      ru:'Третье по святости место в исламе. Мечеть, которую посетил Пророк Мухаммад (мир ему) во время Ночного путешествия (Исра и Мирадж). Известна как первая кибла.',
      ar:'ثالث أقدس مكان في الإسلام. وهو المسجد الذي زاره النبي ﷺ في ليلة الإسراء والمعراج. عُرف بالقبلة الأولى.',
      tr:'İslam\'da üçüncü en kutsal mekân. Hz. Peygamber\'in (s.a.s) İsra ve Miraç gecesinde ziyaret ettiği mescittir. İlk kıble yönü olarak bilinir.',
    },
    significance: {
      az:'Peyğəmbərlərin toplandığı və Hz. Muhəmmədin (s.a.s) onlara imam olub namaz qıldırdığı yer.',
      en:'The place where prophets gathered and Prophet Muhammad (PBUH) led them in prayer.',
      ru:'Место, где собрались пророки и Пророк Мухаммад (мир ему) возглавил их молитву.',
      ar:'المكان الذي اجتمع فيه الأنبياء وأمَّهم النبي ﷺ في الصلاة.',
      tr:'Peygamberlerin toplandığı ve Hz. Muhammed\'in (s.a.s) onlara imam olarak namaz kıldırdığı yer.',
    },
    reference: { az:'İsra 1', en:'Al-Isra 1', ru:'Аль-Исра 1', ar:'الإسراء ١', tr:'İsrâ 1' },
  },
  {
    icon: 'holyplaces',
    nameAr: 'مسجد قباء',
    name: { az:'Quba məscidi', en:'Quba Mosque', ru:'Мечеть Куба', ar:'مسجد قباء', tr:'Kuba Mescidi' },
    photo: 'quba',
    lat: 24.4397, lon: 39.6166,
    city: { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' },
    desc: {
      az:'İslam tarixində inşa edilən ilk məscid. Peyğəmbərimiz (s.a.s) Mədinəyə hicrəti zamanı burada dayanıb bu məscidi inşa etmişdir. Qurani-Kərimdə təqva üzərində qurulmuş məscid olaraq xatırlanır.',
      en:'The first mosque built in Islamic history. Prophet Muhammad (PBUH) stopped here during his migration to Medina and built this mosque. It is mentioned in the Quran as a mosque founded on piety.',
      ru:'Первая мечеть, построенная в истории ислама. Пророк Мухаммад (мир ему) остановился здесь во время переселения в Медину и построил эту мечеть. В Коране упоминается как мечеть, основанная на благочестии.',
      ar:'أول مسجد بُني في تاريخ الإسلام. توقف النبي ﷺ هنا أثناء هجرته إلى المدينة وبنى هذا المسجد. ذُكر في القرآن كمسجد أُسس على التقوى.',
      tr:'İslam tarihinde inşa edilen ilk mescit. Hz. Peygamber (s.a.s) Medine\'ye hicreti sırasında burada durarak bu mescidi inşa etmiştir. Kur\'an\'da takva üzere kurulmuş mescit olarak anılır.',
    },
    significance: {
      az:'Burada iki rükət namaz qılmaq bir ümrə savabı qazandırır.',
      en:'Performing two rak\'ahs of prayer here earns the reward of an Umrah.',
      ru:'Совершение двух ракаатов молитвы здесь равносильно награде за Умру.',
      ar:'صلاة ركعتين فيه تعدل ثواب عمرة.',
      tr:'Burada iki rekât namaz kılmak bir umre sevabı kazandırır.',
    },
    reference: { az:'Tirmizi 324', en:'Tirmidhi 324', ru:'Тирмизи 324', ar:'الترمذي ٣٢٤', tr:'Tirmizî 324' },
  },
  {
    icon: 'quran',
    nameAr: 'غار حراء',
    name: { az:'Həra mağarası', en:'Cave of Hira', ru:'Пещера Хира', ar:'غار حراء', tr:'Hira Mağarası' },
    photo: 'jabal-an-nur',
    lat: 21.4574, lon: 39.8582,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Peyğəmbərimizə (s.a.s) ilk vəhyin nazil olduğu mağara. Nur dağının zirvəsində yerləşir. Peyğəmbərlikdən əvvəl Hz. Muhəmməd (s.a.s) burada tənha qalıb ibadət edərdi (Buxari 3).',
      en:'The cave where the first revelation was sent down to Prophet Muhammad (PBUH). Located at the peak of Jabal an-Nur. Before prophethood, he used to seclude himself here in worship (Bukhari 3).',
      ru:'Пещера, в которой Пророку Мухаммаду (мир ему) было ниспослано первое откровение. Расположена на вершине горы Нур. До пророчества он уединялся здесь для поклонения (аль-Бухари 3).',
      ar:'الغار الذي نزل فيه الوحي الأول على النبي ﷺ. يقع على قمة جبل النور. كان النبي ﷺ قبل البعثة يخلو فيه فيتحنّث (البخاري 3).',
      tr:'Hz. Peygamber\'e (s.a.s) ilk vahyin indirildiği mağara. Nur Dağı\'nın zirvesinde yer alır. Peygamberlikten önce Hz. Muhammed (s.a.s) burada inzivaya çekilip ibadet ederdi (Buhârî 3).',
    },
    significance: {
      az:'İlk nazil olan Quran ayələri burada endirilmişdir — Ələq surəsinin ilk beş ayəsi. Peyğəmbərlikdən sonra nə Peyğəmbər ﷺ, nə də səhabələr bu mağaraya ibadət üçün çıxmayıblar — ora çıxmaq ibadət deyil.',
      en:'The first verses of the Quran were revealed here — the first five verses of Surah Al-Alaq. After prophethood neither the Prophet ﷺ nor his Companions climbed to this cave for worship — going up to it is not an act of worship.',
      ru:'Первые аяты Корана были ниспосланы здесь — первые пять аятов суры Аль-Алак. После начала пророчества ни Пророк ﷺ, ни сподвижники не поднимались в эту пещеру ради поклонения — подъём туда не является поклонением.',
      ar:'أُنزلت هنا أول آيات القرآن الكريم — الآيات الخمس الأولى من سورة العلق. ولم يصعد إليه النبي ﷺ ولا أصحابه بعد البعثة للتعبد، فصعوده ليس عبادة.',
      tr:'İlk Kur\'an ayetleri burada indirilmiştir — Alak suresinin ilk beş ayeti. Peygamberlikten sonra ne Peygamber ﷺ ne de sahabeler bu mağaraya ibadet için çıktı — oraya çıkmak ibadet değildir.',
    },
    reference: { az:'Ələq 1-5', en:'Al-Alaq 1-5', ru:'Аль-Алак 1-5', ar:'العلق ١-٥', tr:'Alak 1-5' },
  },
  {
    icon: 'shield',
    nameAr: 'غار ثور',
    name: { az:'Sevr mağarası', en:'Cave of Thawr', ru:'Пещера Саур', ar:'غار ثور', tr:'Sevr Mağarası' },
    photo: 'jabal-thawr',
    lat: 21.3771, lon: 39.8214,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Hz. Muhəmməd (s.a.s) və Hz. Əbu Bəkr (r.a) Mədinəyə hicrət edərkən üç gün gizləndikləri mağara. Allah-Təala onları müşriklərin gözündən qorumuşdur.',
      en:'The cave where Prophet Muhammad (PBUH) and Abu Bakr (RA) hid for three days during their migration to Medina. Allah protected them from the sight of the polytheists.',
      ru:'Пещера, в которой Пророк Мухаммад (мир ему) и Абу Бакр (да будет доволен им Аллах) скрывались три дня во время переселения в Медину. Аллах защитил их от взоров язычников.',
      ar:'الغار الذي اختبأ فيه النبي ﷺ وأبو بكر رضي الله عنه ثلاثة أيام أثناء الهجرة إلى المدينة. حماهما الله من أعين المشركين.',
      tr:'Hz. Muhammed (s.a.s) ve Hz. Ebu Bekir\'in (r.a.) Medine\'ye hicret ederken üç gün gizlendikleri mağara. Allah onları müşriklerin gözünden korumuştur.',
    },
    significance: {
      az:'Qurani-Kərimdə "ikinin ikincisi" ifadəsi ilə xatırlanır. Allahın qoruması burada təcəlli etmişdir. Bu mağaraya ibadət niyyəti ilə çıxmaq sünnədə yoxdur.',
      en:'Mentioned in the Quran with the phrase "the second of the two." Allah\'s protection was manifested here. Going up to this cave with the intention of worship has no basis in the Sunnah.',
      ru:'Упоминается в Коране фразой «второй из двоих». Здесь проявилась защита Аллаха. Подниматься в эту пещеру с намерением поклонения не имеет основы в Сунне.',
      ar:'ذُكر في القرآن بعبارة "ثاني اثنين". تجلت هنا حماية الله لنبيه ﷺ. وقصد هذا الغار بنية التعبد لا أصل له في السنة.',
      tr:'Kur\'an\'da "ikinin ikincisi" ifadesiyle anılır. Allah\'ın koruması burada tecelli etmiştir. Bu mağaraya ibadet niyetiyle çıkmanın sünnette aslı yoktur.',
    },
    reference: { az:'Tövbə 40', en:'At-Tawbah 40', ru:'Ат-Тауба 40', ar:'التوبة ٤٠', tr:'Tevbe 40' },
  },
  {
    icon: 'sun',
    nameAr: 'جبل عرفات',
    name: { az:'Ərəfat dağı', en:'Mount Arafat', ru:'Гора Арафат', ar:'جبل عرفات', tr:'Arafat Dağı' },
    mapFocus: 'arafat',
    lat: 21.3549, lon: 39.9841,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Həccin ən mühüm rüknü olan Ərəfat dayanması burada edilir. Peyğəmbərimiz (s.a.s) Vida Xütbəsini burada söyləmişdir. Zilhiccə ayının 9-cu günü milyonlarla müsəlman burada toplanır.',
      en:'The most important pillar of Hajj — the standing at Arafat — takes place here. Prophet Muhammad (PBUH) delivered his Farewell Sermon here. Millions of Muslims gather here on the 9th of Dhul-Hijjah.',
      ru:'Здесь совершается самый важный столп Хаджа — стояние на Арафате. Пророк Мухаммад (мир ему) произнес здесь прощальную проповедь. Миллионы мусульман собираются здесь 9-го Зуль-Хиджа.',
      ar:'يُؤدى هنا أهم ركن من أركان الحج — الوقوف بعرفة. ألقى النبي ﷺ خطبة الوداع هنا. يجتمع ملايين المسلمين هنا في اليوم التاسع من ذي الحجة.',
      tr:'Haccın en önemli rüknü olan Arafat vakfesi burada yapılır. Hz. Peygamber (s.a.s) Veda Hutbesi\'ni burada okumuştur. Zilhicce ayının 9. günü milyonlarca Müslüman burada toplanır.',
    },
    significance: {
      az:'"Həcc Ərəfatdır" — bu hədis Ərəfatın həccdəki mərkəzi rolunu göstərir.',
      en:'"Hajj is Arafat" — this hadith highlights the central role of Arafat in Hajj.',
      ru:'«Хадж — это Арафат» — этот хадис подчеркивает центральную роль Арафата в Хадже.',
      ar:'"الحج عرفة" — هذا الحديث يبرز الدور المركزي لعرفة في الحج.',
      tr:'"Hac Arafat\'tır" — bu hadis Arafat\'ın haccdaki merkezi rolünü gösterir.',
    },
    reference: { az:'Tirmizi 889', en:'Tirmidhi 889', ru:'Тирмизи 889', ar:'الترمذي ٨٨٩', tr:'Tirmizî 889' },
  },
  {
    icon: 'jamaat',
    nameAr: 'منى',
    name: { az:'Mina', en:'Mina', ru:'Мина', ar:'منى', tr:'Mina' },
    photo: 'mina',
    lat: 21.4134, lon: 39.8933,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Həcc zamanı hacıların daş atma (cəmərət) mərasimini icra etdikləri yer. Təşriq günlərində hacılar burada qalırlar. "Çadırlar şəhəri" olaraq da tanınır.',
      en:'The place where pilgrims perform the stoning ritual (Jamarat) during Hajj. Pilgrims stay here during the days of Tashreeq. Also known as the "City of Tents."',
      ru:'Место, где паломники совершают обряд бросания камней (Джамарат) во время Хаджа. Паломники остаются здесь в дни Ташрика. Также известно как «Город палаток».',
      ar:'المكان الذي يؤدي فيه الحجاج شعيرة رمي الجمرات أثناء الحج. يقيم الحجاج هنا أيام التشريق. تُعرف أيضاً بـ "مدينة الخيام".',
      tr:'Hac sırasında hacıların şeytan taşlama (Cemerat) merasimini ifa ettikleri yer. Teşrik günlerinde hacılar burada kalırlar. "Çadırlar şehri" olarak da bilinir.',
    },
    significance: {
      az:'Təşriq günlərində burada Allah zikr olunur (Bəqərə 2:203) və cəmərələrə daş atılır.',
      en:'During the days of Tashreeq Allah is remembered here (Al-Baqarah 2:203) and the Jamarat are stoned.',
      ru:'В дни ташрика здесь поминают Аллаха (аль-Бакара 2:203) и бросают камешки в джамараты.',
      ar:'يُذكر الله هنا في أيام التشريق (البقرة ٢٠٣) وتُرمى الجمرات.',
      tr:'Teşrik günlerinde burada Allah zikredilir (Bakara 2:203) ve cemrelere taş atılır.',
    },
    reference: { az:'Bəqərə 203', en:'Al-Baqarah 203', ru:'Аль-Бакара 203', ar:'البقرة ٢٠٣', tr:'Bakara 203' },
  },
  {
    icon: 'moon',
    nameAr: 'مزدلفة',
    name: { az:'Müzdəlifə', en:'Muzdalifah', ru:'Муздалифа', ar:'مزدلفة', tr:'Müzdelife' },
    mapFocus: 'muzdalifah',
    lat: 21.3992, lon: 39.9089,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Ərəfat ilə Mina arasında yerləşən açıq sahə. Hacılar Ərəfatdan sonra burada gecələyirlər. Burada Məğrib və İşa namazları cəm edilərək qılınır.',
      en:'An open area between Arafat and Mina. Pilgrims spend the night here after Arafat. Maghrib and Isha prayers are combined and performed here.',
      ru:'Открытая территория между Арафатом и Миной. Паломники проводят здесь ночь после Арафата. Молитвы Магриб и Иша объединяются и совершаются здесь.',
      ar:'منطقة مفتوحة بين عرفات ومنى. يبيت الحجاج هنا بعد عرفة. تُصلى صلاتا المغرب والعشاء جمعاً هنا.',
      tr:'Arafat ile Mina arasında yer alan açık alan. Hacılar Arafat\'tan sonra burada gecelerler. Akşam ve yatsı namazları burada cem edilerek kılınır.',
    },
    significance: {
      az:'Məşərul-Haram burada yerləşir. Qurani-Kərimdə zikr olunmuş müqəddəs məkandır.',
      en:'Al-Mash\'ar al-Haram is located here. It is a sacred site mentioned in the Quran.',
      ru:'Аль-Машар аль-Харам расположен здесь. Это священное место, упомянутое в Коране.',
      ar:'المشعر الحرام يقع هنا. وهو موقع مقدس ذُكر في القرآن الكريم.',
      tr:'Meş\'ar-i Haram burada yer alır. Kur\'an\'da zikredilen kutsal bir mekândır.',
    },
    reference: { az:'Bəqərə 198', en:'Al-Baqarah 198', ru:'Аль-Бакара 198', ar:'البقرة ١٩٨', tr:'Bakara 198' },
  },
  {
    icon: 'leaf',
    nameAr: 'جنة البقيع',
    name: { az:'Cənnətül-Bəqi', en:'Jannat al-Baqi', ru:'Джаннат аль-Баки', ar:'جنة البقيع', tr:'Cennetü\'l-Bakî' },
    photo: 'al-baqi',
    lat: 24.4667, lon: 39.6150,
    city: { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' },
    desc: {
      az:'Mədinədə yerləşən ən qədim İslam qəbiristanlığı. Peyğəmbərimizin (s.a.s) ailə üzvləri, səhabələr və tabeinlər burada dəfn edilmişdir.',
      en:'The oldest Islamic cemetery in Medina. Family members of the Prophet (PBUH), companions, and followers are buried here.',
      ru:'Самое древнее исламское кладбище в Медине. Здесь похоронены члены семьи Пророка (мир ему), сподвижники и последователи.',
      ar:'أقدم مقبرة إسلامية في المدينة المنورة. دُفن هنا أفراد من عائلة النبي ﷺ والصحابة والتابعون.',
      tr:'Medine\'deki en eski İslam kabristanı. Hz. Peygamber\'in (s.a.s) aile üyeleri, sahâbîler ve tâbiîn burada defnedilmiştir.',
    },
    significance: {
      az:'Peyğəmbərimiz (s.a.s) tez-tez buranı ziyarət edər və Bəqi əhli üçün dua edərdi.',
      en:'Prophet Muhammad (PBUH) frequently visited this place and prayed for the people of Baqi.',
      ru:'Пророк Мухаммад (мир ему) часто посещал это место и молился за обитателей Баки.',
      ar:'كان النبي ﷺ يزور البقيع كثيراً ويدعو لأهله.',
      tr:'Hz. Peygamber (s.a.s) burayı sık sık ziyaret eder ve Bakî ehli için dua ederdi.',
    },
    reference: { az:'Muslim 974', en:'Muslim 974', ru:'Муслим 974', ar:'مسلم ٩٧٤', tr:'Müslim 974' },
  },
]

/// "Hamısı" süzgəcinin adı (5 dil)
const GALLERY = PLACES.filter(p => p.photo)

const ALL_LABEL = { az: 'Hamısı', en: 'All', ru: 'Все', ar: 'الكل', tr: 'Tümü' }

// ── v3 mətnləri (5 dil) ──────────────────────────────────
const V3 = {
  how: {
    az: 'Şəhərə görə süzün. Hər kartda yerin nə üçün mühüm olduğu, Quran və ya səhih hədisdən dəlili və xəritə keçidi var.',
    en: 'Filter by city. Each card shows why the place matters, its evidence from the Quran or an authentic hadith, and a map link.',
    ru: 'Фильтруйте по городу. В каждой карточке — чем важно место, довод из Корана или достоверного хадиса и ссылка на карту.',
    ar: 'صفِّ حسب المدينة. في كل بطاقة سبب أهمية المكان ودليله من القرآن أو الحديث الصحيح ورابط الخريطة.',
    tr: 'Şehre göre süzün. Her kartta yerin neden önemli olduğu, Kur’an veya sahih hadisten delili ve harita bağlantısı var.',
  },
  places: { az: 'yer', en: 'places', ru: 'мест', ar: 'أماكن', tr: 'yer' },
  cities: { az: 'şəhər', en: 'cities', ru: 'города', ar: 'مدن', tr: 'şehir' },
  mosques3: { az: 'səfər edilən məscid', en: 'mosques worth a journey', ru: 'мечети для поездки', ar: 'مساجد تُشدّ إليها الرحال', tr: 'yolculuk yapılan mescit' },
  // Üç məscid
  virtueEyebrow: { az: 'Namazın savabı', en: 'Reward of prayer', ru: 'Награда за молитву', ar: 'فضل الصلاة', tr: 'Namazın sevabı' },
  virtueTitle: { az: 'Bir namaz — neçə namaza bərabər?', en: 'One prayer — worth how many?', ru: 'Одна молитва — скольким равна?', ar: 'صلاة واحدة تعدل كم صلاة؟', tr: 'Bir namaz — kaç namaza denk?' },
  virtueLead: {
    az: 'Başqa məscidlərdə qılınan namazla müqayisədə — səhih hədislərə görə.',
    en: 'Compared with prayer in other mosques — according to authentic hadiths.',
    ru: 'В сравнении с молитвой в других мечетях — по достоверным хадисам.',
    ar: 'مقارنةً بالصلاة في سائر المساجد، بحسب الأحاديث الصحيحة.',
    tr: 'Diğer mescitlerde kılınan namaza göre — sahih hadislere dayanarak.',
  },
  haram: { az: 'Məscidül-Haram', en: 'Masjid al-Haram', ru: 'Масджид аль-Харам', ar: 'المسجد الحرام', tr: 'Mescid-i Haram' },
  nabawi: { az: 'Peyğəmbər ﷺ məscidi', en: 'The Prophet’s ﷺ Mosque', ru: 'Мечеть Пророка ﷺ', ar: 'المسجد النبوي', tr: 'Peygamber ﷺ mescidi' },
  quba: { az: 'Quba məscidi', en: 'Quba Mosque', ru: 'Мечеть Куба', ar: 'مسجد قباء', tr: 'Kuba Mescidi' },
  times: { az: 'qat', en: '×', ru: 'раз', ar: 'ضعف', tr: 'kat' },
  umrah: { az: 'ümrə', en: 'Umrah', ru: 'умра', ar: 'عمرة', tr: 'umre' },
  qubaHint: { az: 'evdə dəstəmaz alıb gəlib bir namaz qılan üçün', en: 'for one who purifies at home, then comes and prays', ru: 'тому, кто совершил омовение дома и пришёл помолиться', ar: 'لمن تطهّر في بيته ثم أتاه فصلّى', tr: 'evinde abdest alıp gelerek namaz kılana' },
  // Yerlər
  placesEyebrow: { az: 'Yerlər', en: 'Places', ru: 'Места', ar: 'الأماكن', tr: 'Yerler' },
  placesTitle: { az: 'Məkkə, Mədinə və Qüds', en: 'Mecca, Medina and Jerusalem', ru: 'Мекка, Медина и Иерусалим', ar: 'مكة والمدينة والقدس', tr: 'Mekke, Medine ve Kudüs' },
  // Məsafələr
  distEyebrow: { az: 'Məsafələr', en: 'Distances', ru: 'Расстояния', ar: 'المسافات', tr: 'Mesafeler' },
  distTitle: { az: 'Kəbədən nə qədər uzaqdır?', en: 'How far from the Kaaba?', ru: 'Как далеко от Каабы?', ar: 'كم تبعد عن الكعبة؟', tr: 'Kâbe’ye ne kadar uzak?' },
  distLead: {
    az: 'Düz xətlə, yuxarıdakı koordinatlardan hesablanıb; yol məsafəsi daha uzundur.',
    en: 'In a straight line, calculated from the coordinates above; the road distance is longer.',
    ru: 'По прямой, рассчитано по координатам выше; по дороге — длиннее.',
    ar: 'بخط مستقيم، محسوبة من الإحداثيات أعلاه، والمسافة على الطريق أطول.',
    tr: 'Kuş uçuşu, yukarıdaki koordinatlardan hesaplanmıştır; yol mesafesi daha uzundur.',
  },
  aroundMecca: { az: 'Məkkə ətrafı', en: 'Around Mecca', ru: 'Вокруг Мекки', ar: 'حول مكة', tr: 'Mekke çevresi' },
  farther: { az: 'Uzaq məscidlər', en: 'Farther mosques', ru: 'Дальние мечети', ar: 'المساجد البعيدة', tr: 'Uzak mescitler' },
  km: { az: 'km', en: 'km', ru: 'км', ar: 'كم', tr: 'km' },
  // Ədəb
  adabPoints: [
    { az: 'İbadət niyyəti ilə səfər yalnız üç məscidə', en: 'Travel for worship only to three mosques', ru: 'Поездка ради поклонения — только к трём мечетям', ar: 'لا تُشدّ الرحال للعبادة إلا إلى ثلاثة مساجد', tr: 'İbadet niyetiyle yolculuk yalnız üç mescide' },
    { az: 'Mağara, dağ, daş və qəbirdən təbərrük yoxdur', en: 'No seeking blessing from caves, mountains, stones or graves', ru: 'Нет поиска благодати от пещер, гор, камней и могил', ar: 'لا تبرّك بالغيران والجبال والأحجار والقبور', tr: 'Mağara, dağ, taş ve kabirden teberrük yoktur' },
    { az: 'Qəbir ziyarəti: salam, dua, axirəti xatırlamaq', en: 'Visiting graves: salam, supplication, remembering the Hereafter', ru: 'Посещение могил: приветствие, мольба, память о Последней жизни', ar: 'زيارة القبور: السلام والدعاء وتذكّر الآخرة', tr: 'Kabir ziyareti: selam, dua, ahireti hatırlamak' },
  ],
  related: { az: 'Əlaqəli bölmələr', en: 'Related sections', ru: 'Связанные разделы', ar: 'أقسام ذات صلة', tr: 'İlgili bölümler' },
}
const RELATED = [
  { to: 'hajjguide', title: { az: 'Həcc və ümrə bələdçisi', en: 'Hajj & Umrah guide', ru: 'Хадж и умра', ar: 'دليل الحج والعمرة', tr: 'Hac ve umre rehberi' }, text: { az: 'Günbəgün plan və ihram qaydaları', en: 'Day-by-day plan and rules of ihram', ru: 'План по дням и правила ихрама', ar: 'خطة الأيام وأحكام الإحرام', tr: 'Günbegün plan ve ihram kuralları' } },
  { to: 'qibla', title: { az: 'Qiblə', en: 'Qibla', ru: 'Кибла', ar: 'القبلة', tr: 'Kıble' }, text: { az: 'Kəbənin istiqaməti və məsafəsi', en: 'Direction and distance to the Kaaba', ru: 'Направление и расстояние до Каабы', ar: 'اتجاه الكعبة والمسافة إليها', tr: 'Kâbe’nin yönü ve uzaklığı' } },
  { to: 'history', title: { az: 'İslam tarixi', en: 'Islamic history', ru: 'История ислама', ar: 'التاريخ الإسلامي', tr: 'İslam tarihi' }, text: { az: 'Hicrət yolu və siyər xəritələri', en: 'The Hijrah route and sirah maps', ru: 'Путь хиджры и карты сиры', ar: 'طريق الهجرة وخرائط السيرة', tr: 'Hicret yolu ve siyer haritaları' } },
  { to: 'mosques', title: { az: 'Yaxındakı məscidlər', en: 'Nearby mosques', ru: 'Мечети рядом', ar: 'المساجد القريبة', tr: 'Yakındaki camiler' }, text: { az: 'Ətrafınızdakı məscidi tapın', en: 'Find a mosque around you', ru: 'Найдите мечеть рядом', ar: 'ابحث عن مسجد قريب', tr: 'Çevrenizdeki camiyi bulun' } },
]

const P = (o, lang) => (o && (pickUi(o, lang, 'en') || o.az)) || ''

/** İki nöqtə arasında düz xətlə məsafə (km, haversine) */
function distKm(a, b) {
  const R = 6371, rad = (v) => (v * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function HolyPlacesPage({ setPage }) {
  const { lang } = useLang()
  const lk = lang
  const lb = LABELS[lk] || LABELS.az
  const [filter, setFilter] = useState('all')
  const hx = HP32[lk] || HP32.en
  const [openI, setOpenI] = useState(null)
  const [status, setStatus] = useState('')
  const openAt = (i) => { setStatus(''); setOpenI(i) }
  const chipsRef = useRef(null)
  // Qalereya: yalnız fotosu olan yerlər; "Ətraflı" süzgəci sıfırlayır ki, oxu pəncərəsi tam siyahı üzrə olsun
  const [deckI, setDeckI] = useState(0)
  const deckPlace = GALLERY[deckI] || GALLERY[0]
  const openFromDeck = (p) => { setFilter('all'); openAt(PLACES.indexOf(p)) }

  const cities = [...new Set(PLACES.map(p => p.city.en))]
  const filtered = filter === 'all' ? PLACES : PLACES.filter(p => p.city.en === filter)
  const countOf = (c) => PLACES.filter(p => p.city.en === c).length
  const num = (n) => n.toLocaleString(lk === 'ar' ? 'ar-EG' : lk === 'az' ? 'az-Latn-AZ' : lk, { maximumFractionDigits: n < 100 ? 1 : 0 })

  // Kəbədən məsafələr — PLACES-in öz koordinatlarından
  const kaaba = PLACES[0]
  const near = PLACES.filter(p => p.city.en === 'Mecca' && p !== kaaba)
    .map(p => ({ key: p.name.en, label: p.name[lk] || p.name.en, value: Math.round(distKm(kaaba, p) * 10) / 10 }))
    .sort((a, b) => a.value - b.value)
  const far = PLACES.filter(p => p.city.en !== 'Mecca' && p.icon === 'holyplaces')
    .map(p => ({ key: p.name.en, label: p.name[lk] || p.name.en, value: Math.round(distKm(kaaba, p)) }))
  const kmFmt = (v) => `${num(v)} ${P(V3.km, lk)}`

  return (
    <div className="holy-page">
      {/* Hero — v3: kompakt split; foto yalnız ≥900px (telefonda hero qısa qalır) */}
      <header className="ui-page-hero ui-page-hero--split holy-hero-v2">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text" data-reveal="stagger">
            <Icon3D name="hajjguide" size={60} className="ui-hero-i3d" />
            <Breadcrumb setPage={setPage} current={lb.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('holyplaces'), lk)}</span>
            <h1 className="ui-display">{lb.title}</h1>
            <p className="ui-lead">{lb.subtitle}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> <span>{P(V3.how, lk)}</span></p>
            <ul className="ui-page-hero__stats">
              <li><b data-count={PLACES.length}>{PLACES.length}</b><span>{P(V3.places, lk)}</span></li>
              <li><b data-count={cities.length}>{cities.length}</b><span>{P(V3.cities, lk)}</span></li>
              <li><b data-count="3">3</b><span>{P(V3.mosques3, lk)}</span></li>
            </ul>
          </div>
          <div className="ui-page-hero__aside holy-hero-photo">
            <PlacePhoto id="masjid-al-haram" lang={lk} sizes="(min-width: 900px) 440px, 100vw" />
          </div>
        </div>
      </header>

      {/* ═══ Üç məscid: namazın savabı + ziyarət ədəbi ═══ */}
      <section className="ui-section ui-section--tight" aria-labelledby="holy-virtue-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.virtueEyebrow, lk)}</span>
            <h2 id="holy-virtue-h" className="ui-title">{P(V3.virtueTitle, lk)}</h2>
            <p className="ui-lead">{P(V3.virtueLead, lk)}</p>
          </div>
          <div className="ui-stats holy-stats" data-reveal="stagger">
            <StatTile icon="hajjguide" label={P(V3.haram, lk)} value={num(100000)} count={100000} unit={P(V3.times, lk)}
              hint={`${localizeSource('İbn Macə 1406', lk)} · ${P(SAHIH, lk)}`} tone="brand" />
            <StatTile icon="holyplaces" label={P(V3.nabawi, lk)} value={num(1000)} count={1000} unit={P(V3.times, lk)}
              hint={localizeSource('Buxari 1190', lk)} />
            <StatTile icon="holyplaces" label={P(V3.quba, lk)} value={`= 1`} unit={P(V3.umrah, lk)}
              hint={`${P(V3.qubaHint, lk)} — ${localizeSource('İbn Macə 1412', lk)}`} tone="accent" />
          </div>

          {/* Ziyarət ədəbi — Sələf mövqeyi: səfər niyyəti yalnız üç məscidə; yerlərdən təbərrük yoxdur */}
          <aside className="ui-callout ui-callout--accent holy-adab" aria-labelledby="holy-adab-h">
            <Icon name="books" />
            <div>
              <strong id="holy-adab-h" className="ui-callout__title">{lb.adabTitle}</strong>
              <ul className="holy-adab-points">
                {V3.adabPoints.map((p, i) => <li key={i}><Icon name="check" size={14} strokeWidth={2.4} /> {P(p, lk)}</li>)}
              </ul>
              <p className="holy-adab-text">{lb.adabText}</p>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══ 3D model ═══ */}
      <section className="ui-section ui-section--tight" aria-label="3D">
        <div className="ui-container">
          <DeferRender height="520px" idle={false} rootMargin="400px 0px">
            <Suspense fallback={<div className="ui-card" style={{ minHeight: 520 }} />}>
              <MakkahLive lang={lk} />
              <Kaaba3D lang={lk} />
            </Suspense>
          </DeferRender>
        </div>
      </section>

      {/* ═══ Yerlər ═══ */}
      <section className="ui-section ui-section--alt" aria-labelledby="holy-places-h">
        <div className="ui-container">
          <div className="ui-section-head ui-section-head--row" data-reveal>
            <div>
              <span className="ui-eyebrow">{P(V3.placesEyebrow, lk)}</span>
              <h2 id="holy-places-h" className="ui-title">{P(V3.placesTitle, lk)}</h2>
            </div>
          </div>
          {/* v6: foto qalereyası — kart dəstəsi (21st.dev "circular gallery / card stack" ideyası) +
              yavaş Ken Burns; yanında cari yerin qısa izahı. Sürüşdürmə + düymələr + ←/→. */}
          <div className="holy-gallery">
            <div className="holy-gallery__deck">
              <Suspense fallback={<div className="holy-gallery__ph" aria-hidden="true" />}>
                <CardStack items={GALLERY} lang={lk} label={P(V3.placesTitle, lk)} index={deckI} onIndexChange={setDeckI}
                  getKey={(p) => p.photo}
                  renderItem={(p) => (
                    <div className="holy-gallery__card">
                      <PlacePhoto id={p.photo} lang={lk} creditLinks={false} className="holy-kb" sizes="(min-width: 1024px) 460px, 92vw" />
                    </div>
                  )} />
              </Suspense>
            </div>
            <Swap swapKey={deckPlace.photo} variant="blur" className="holy-gallery__cap">
              <span className="holy-card-city"><Icon name="pin" size={13} /> {deckPlace.city[lk] || deckPlace.city.az}</span>
              <h3 className="holy-gallery__name">{deckPlace.name[lk] || deckPlace.name.az}</h3>
              {lk !== 'ar' && <p className="holy-card-ar ui-arabic" lang="ar" dir="rtl">{deckPlace.nameAr}</p>}
              <p className="holy-gallery__sig">{deckPlace.significance[lk] || deckPlace.significance.az}</p>
              <button type="button" className="holy-card-more" onClick={() => openFromDeck(deckPlace)} aria-haspopup="dialog">
                {hx.more}<span className="ui-sr-only">: {deckPlace.name[lk] || deckPlace.name.az}</span> <Icon name="arrow" size={15} className="ui-flip-rtl" />
              </button>
            </Swap>
          </div>

          {/* Süzgəc: telefonda bir sətirdə sürüşən çiplər, genişdə sarınır */}
          <div className="holy-filters chip-scroll wrap-desktop pfx-glide-host" role="group" aria-label={lb.title} ref={chipsRef}>
            <PressedGlide containerRef={chipsRef} deps={[filter, lk]} />
            <button type="button" className="ui-chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              {ALL_LABEL[lk] || ALL_LABEL.en}
              <span className="holy-chip-num ui-num">{PLACES.length}</span>
            </button>
            {cities.map(c => (
              <button key={c} type="button" className="ui-chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
                {PLACES.find(p => p.city.en === c).city[lk] || c}
                <span className="holy-chip-num ui-num">{countOf(c)}</span>
              </button>
            ))}
          </div>

          <div className="holy-grid">
            {filtered.map((place, i) => (
              // Sabit açar: süzgəc dəyişəndə yeni kartlar görünmə animasiyası ilə gəlir
              <article key={place.name.en} className="ui-card holy-card holy-card--click" data-reveal="" data-reveal-delay={(i % 3) * 60}
                onClick={(e) => { if (!e.target.closest('a, button')) openAt(i) }}>
                <div className="holy-card-media">
                  {place.photo
                    ? <PlacePhoto id={place.photo} lang={lk} className="ph--zoom ph--parallax" sizes="(min-width: 1200px) 380px, (min-width: 768px) 46vw, 100vw" />
                    : place.mapFocus
                      ? <HajjRouteMap lang={lk} highlight={place.mapFocus} compact />
                      // Foto və xəritə yoxdursa (Məscidün-Nəbəvi) — yalnız yazılı lövhə, canlı təsvir yox
                      : <span className="holy-card-plaque" aria-hidden="true">
                          <span className="ui-pattern" />
                          <span className="holy-card-plaque__ar ui-arabic" lang="ar" dir="rtl">{place.nameAr}</span>
                        </span>}
                </div>
                <div className="holy-card-body">
                  <div className="holy-card-titles">
                    <span className="holy-card-city"><Icon name="pin" size={13} /> {place.city[lk] || place.city.az}</span>
                    <h3 className="holy-card-name">{place.name[lk] || place.name.az}</h3>
                    {/* Ərəbcədə başlıq onsuz da ərəbcədir — eyni adı ikinci dəfə göstərmə */}
                    {lk !== 'ar' && <p className="holy-card-ar ui-arabic" lang="ar" dir="rtl">{place.nameAr}</p>}
                  </div>

                  <p className="holy-card-desc">{place.desc[lk] || place.desc.az}</p>

                  <div className="holy-card-sig">
                    <span className="holy-card-label"><Icon name="star" size={13} /> {lb.significance}</span>
                    <p>{place.significance[lk] || place.significance.az}</p>
                  </div>

                  <button type="button" className="holy-card-more" onClick={() => openAt(i)} aria-haspopup="dialog">
                    {hx.more}<span className="ui-sr-only">: {place.name[lk] || place.name.az}</span> <Icon name="arrow" size={15} className="ui-flip-rtl" />
                  </button>

                  <div className="holy-card-foot">
                    <span className="holy-card-ref" title={lb.reference}>
                      <Icon name="books" size={13} /> <span className="ui-sr-only">{lb.reference}: </span>{place.reference[lk] || place.reference.az}
                    </span>
                    <a
                      className="ui-link holy-card-maps"
                      href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {lb.openMaps} <Icon name="external" size={14} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ReaderDialog
        open={openI != null && !!filtered[openI]}
        onClose={() => setOpenI(null)}
        onPrev={openI > 0 ? () => openAt(openI - 1) : undefined}
        onNext={openI != null && openI < filtered.length - 1 ? () => openAt(openI + 1) : undefined}
        labelledBy="holy-read-title"
        position={openI != null ? `${openI + 1} / ${filtered.length}` : null}
        labels={{ close: hx.close, prev: hx.prev, next: hx.next }}
        contentKey={openI}
        className="holy-read"
        head={openI != null && filtered[openI] && <span className="holy-card-city"><Icon name="pin" size={13} /> {filtered[openI].city[lk] || filtered[openI].city.az}</span>}
        footer={openI != null && filtered[openI] && (
          <div className="cl-tools">
            <a className="ui-btn ui-btn--ghost ui-btn--sm" href={`https://www.google.com/maps?q=${filtered[openI].lat},${filtered[openI].lon}`} target="_blank" rel="noopener noreferrer">
              <Icon name="pin" className="ui-btn__icon" /> {lb.openMaps}
            </a>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={async () => {
              const p = filtered[openI]
              const r = await shareLink({ title: p.name[lk] || p.name.az, text: `${p.name[lk] || p.name.az} (${p.nameAr}) — ${p.desc[lk] || p.desc.az}`, url: window.location.href.split('#')[0] })
              if (r === 'copied') setStatus(hx.copied)
            }}>
              <Icon name="share" className="ui-btn__icon" /> {hx.share}
            </button>
            <CopyStatus text={status} />
          </div>
        )}
      >
        {openI != null && filtered[openI] && (() => {
          const place = filtered[openI]
          return (
            <article className="holy-read__body">
              {place.photo && <div className="holy-read__media"><PlacePhoto id={place.photo} lang={lk} sizes="(min-width: 768px) 720px, 100vw" /></div>}
              <header className="holy-read__head">
                <h2 id="holy-read-title" className="holy-read__title">{place.name[lk] || place.name.az}</h2>
                {lk !== 'ar' && <p className="holy-card-ar ui-arabic" lang="ar" dir="rtl">{place.nameAr}</p>}
              </header>
              <p className="holy-read__desc">{place.desc[lk] || place.desc.az}</p>
              <div className="holy-card-sig">
                <span className="holy-card-label"><Icon name="star" size={13} /> {lb.significance}</span>
                <p>{place.significance[lk] || place.significance.az}</p>
              </div>
              <p className="holy-card-ref"><Icon name="books" size={13} /> {lb.reference}: {place.reference[lk] || place.reference.az}</p>
            </article>
          )
        })()}
      </ReaderDialog>

      {/* ═══ Məsafələr (koordinatlardan hesablanır) ═══ */}
      <section className="ui-section ui-cv" style={{ '--cv-h': '560px' }} aria-labelledby="holy-dist-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.distEyebrow, lk)}</span>
            <h2 id="holy-dist-h" className="ui-title">{P(V3.distTitle, lk)}</h2>
            <p className="ui-lead">{P(V3.distLead, lk)}</p>
          </div>
          <div className="holy-dist">
            <ChartFigure title={P(V3.aroundMecca, lk)} sub={P(V3.km, lk)}>
              <BarChart data={near} format={kmFmt} label={P(V3.aroundMecca, lk)} labelWidth="38%" />
            </ChartFigure>
            <ChartFigure title={P(V3.farther, lk)} sub={P(V3.km, lk)}>
              <BarChart data={far} format={kmFmt} label={P(V3.farther, lk)} tone={2} labelWidth="38%" />
            </ChartFigure>
          </div>
        </div>
      </section>

      {/* ═══ Əlaqəli bölmələr ═══ */}
      <section className="ui-section ui-section--tight holy-related" aria-labelledby="holy-rel-h">
        <div className="ui-container">
          <h2 id="holy-rel-h" className="ui-eyebrow holy-related__h">{P(V3.related, lk)}</h2>
          <ul className="ui-tiles" style={{ '--ui-tiles-min': '220px' }} data-reveal="stagger">
            {RELATED.map(r => (
              <li key={r.to}>
                <PageLink className="ui-tile ui-tile--row" to={r.to} setPage={setPage} onNavigate={() => window.scrollTo(0, 0)}>
                  <span className="ui-icon-tile" aria-hidden="true"><Icon name={r.to} /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{P(r.title, lk)}</span>
                    <span className="ui-tile__text">{P(r.text, lk)}</span>
                  </span>
                </PageLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
