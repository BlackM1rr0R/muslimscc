// ═══════════════════════════════════════════════════════
// Namaz vaxtlarının YERİ — istifadəçinin seçdiyi şəhər (bütün saytda ortaq)
//
// Niyə ayrıca modul: əvvəl şəhər seçimi yalnız /prayer səhifəsinin içində
// idi, ana səhifə və /jamaat isə məscidin sabit koordinatını göstərirdi.
// İndi seçim BİR yerdə saxlanılır — /prayer-də şəhər dəyişəndə ana səhifənin
// namaz kartı, /jamaat, /qibla və push bildirişlərinin saatı da dərhal dəyişir.
//
// Saxlama: localStorage 'muslim_cc_selected_city' = şəhərin id-si ('Baku').
// Siyahıda olmayan (xüsusi) yer: id 'custom', yerin özü isə
// 'muslim_cc_custom_city'-də JSON kimi ({ lat, lng, tz, label, method? }).
// Köhnə dəyərlər də oxunur: köhnə siyahının indeksi ('3'), Qaraçuxur
// dövrünün 'mosque' dəyəri (məscid Bakıda idi → Bakı).
// Seçim yoxdursa: admin paneldəki standart şəhər (Settings → defaultCity),
// o da yoxdursa DEFAULT_PRAYER_LOCATION (config/brand.js).
//
// API:
//   PRAYER_CITIES                    — seçilə bilən şəhərlər (əvvəl Azərbaycan, sonra dünya)
//   COUNTRY_NAMES                    — ölkə kodu → 5 dildə ad
//   getPrayerLocation()              → { id, lat, lng, tz, method, city:{az,en,ru,ar,tr}, country, isDefault, isCustom }
//   getPrayerCityId()                → istifadəçinin seçdiyi id ('custom' daxil) və ya null
//   setPrayerCity(idOrPlace)         — id (siyahıdan) və ya xüsusi yer obyekti
//                                      { lat, lng, tz, label|name, country?, method? }; seçimi yaz,
//                                      abunəçilərə xəbər ver, FCM sənədini yenilə
//   setAdminDefaultCity(id)          — admin standartını yadda saxla (istifadəçi seçməyibsə tətbiq olunur)
//   subscribePrayerLocation(cb)      → unsubscribe; cb(getPrayerLocation()) — dəyişəndə
//   usePrayerLocation()              → React hook: cari yer (dəyişəndə yenidən render)
//   locationSig(loc)                 → keş açarı üçün 'lat,lng,method'
//   getRecentPlaces()                → son seçilən yerlər (ən çox 5; şəhər və ya xüsusi yer)
//   searchCities(query)              → PRAYER_CITIES-də diakritikasız, 5 dildə axtarış
//   foldText(s)                      → axtarış üçün sadələşdirilmiş mətn ("Şəki" → "seki")
//   nearestCity(lat, lng)            → { city, km } — siyahıdakı ən yaxın şəhər
//   searchWorldPlaces(q, lang, sig)  → Open-Meteo geocoding: dünyanın istənilən şəhəri
//   worldPlaceLabels(place, sig)     → həmin yerin adı 5 dildə (çatmayan dil → əsas ad)
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { DEFAULT_PRAYER_LOCATION } from '../config/brand'

const CITY_KEY = 'muslim_cc_selected_city'
const CUSTOM_KEY = 'muslim_cc_custom_city'
const RECENT_KEY = 'muslim_cc_recent_cities'
const ADMIN_DEFAULT_KEY = 'muslim_cc_admin_default_city'
const CHANGE_EVENT = 'qm-prayer-location'
// Firebase messaging.js ilə eyni açar — token yoxdursa Firebase heç yüklənmir
const FCM_TOKEN_KEY = 'muslim_cc_fcm_token'
const CUSTOM_ID = 'custom'
const LANG_LIST = ['az', 'en', 'ru', 'ar', 'tr']

// Hesablama metodu bütün şəhərlər üçün eynidir (əvvəlki /prayer səhifəsi
// kimi — aladhan 13 = Diyanet). Şəhər üçün başqa metod lazım olsa,
// həmin şəhərə `method` sahəsi əlavə et.
const DEFAULT_METHOD = DEFAULT_PRAYER_LOCATION.method || 13

export const COUNTRY_NAMES = {
  AZ: { az:'Azərbaycan',  en:'Azerbaijan',     ru:'Азербайджан',   ar:'أذربيجان',  tr:'Azerbaycan' },
  TR: { az:'Türkiyə',     en:'Türkiye',        ru:'Турция',        ar:'تركيا',     tr:'Türkiye' },
  RU: { az:'Rusiya',      en:'Russia',         ru:'Россия',        ar:'روسيا',     tr:'Rusya' },
  GE: { az:'Gürcüstan',   en:'Georgia',        ru:'Грузия',        ar:'جورجيا',    tr:'Gürcistan' },
  IR: { az:'İran',        en:'Iran',           ru:'Иран',          ar:'إيران',     tr:'İran' },
  SA: { az:'Səudiyyə Ərəbistanı', en:'Saudi Arabia', ru:'Саудовская Аравия', ar:'السعودية', tr:'Suudi Arabistan' },
  AE: { az:'BƏƏ',         en:'UAE',            ru:'ОАЭ',           ar:'الإمارات',  tr:'BAE' },
  EG: { az:'Misir',       en:'Egypt',          ru:'Египет',        ar:'مصر',       tr:'Mısır' },
  UZ: { az:'Özbəkistan',  en:'Uzbekistan',     ru:'Узбекистан',    ar:'أوزبكستان', tr:'Özbekistan' },
  KZ: { az:'Qazaxıstan',  en:'Kazakhstan',     ru:'Казахстан',     ar:'كازاخستان', tr:'Kazakistan' },
  GB: { az:'Böyük Britaniya', en:'United Kingdom', ru:'Великобритания', ar:'المملكة المتحدة', tr:'Birleşik Krallık' },
  DE: { az:'Almaniya',    en:'Germany',        ru:'Германия',      ar:'ألمانيا',   tr:'Almanya' },
  FR: { az:'Fransa',      en:'France',         ru:'Франция',       ar:'فرنسا',     tr:'Fransa' },
  US: { az:'ABŞ',         en:'USA',            ru:'США',           ar:'الولايات المتحدة', tr:'ABD' },
  CA: { az:'Kanada',      en:'Canada',         ru:'Канада',        ar:'كندا',      tr:'Kanada' },
  ID: { az:'İndoneziya',  en:'Indonesia',      ru:'Индонезия',     ar:'إندونيسيا', tr:'Endonezya' }, // lang-ok[İndoneziya]: rəsmi az adı
  MY: { az:'Malayziya',   en:'Malaysia',       ru:'Малайзия',      ar:'ماليزيا',   tr:'Malezya' },
}

// Koordinatlar şəhər mərkəzidir; tz — IANA saat qurşağı (geri sayım və
// "növbəti namaz" həmin şəhərin saatı ilə hesablanır).
// Azərbaycan şəhərlərinin koordinatları Open-Meteo geocoding (GeoNames) və
// Nominatim (OpenStreetMap) ilə alınıb və tutuşdurulub (fərq > 5 km olanlar
// əl ilə yoxlanılıb). `alt` — axtarış üçün əlavə yazılışlar.
// Mobil siyahı (mobile/src/services/prayerLocation.js) eyni id və koordinatlarla.
export const PRAYER_CITIES = [
  // ── Azərbaycan (75) ──
  /* @@AZ_CITIES@@ */
  { id:'Baku', country:'AZ', lat:40.4093, lng:49.8671, tz:'Asia/Baku', label:{ az:'Bakı', en:'Baku', ru:'Баку', ar:'باكو', tr:'Bakü' } },
  { id:'Sumgait', country:'AZ', lat:40.5897, lng:49.6686, tz:'Asia/Baku', label:{ az:'Sumqayıt', en:'Sumgait', ru:'Сумгаит', ar:'سومغايت', tr:'Sumgayıt' }, alt:['Sumqayit','Sumgayit'] },
  { id:'Ganja', country:'AZ', lat:40.6828, lng:46.3606, tz:'Asia/Baku', label:{ az:'Gəncə', en:'Ganja', ru:'Гянджа', ar:'كنجة', tr:'Gence' }, alt:['Gyandzha'] },
  { id:'Aghjabadi', country:'AZ', lat:40.0502, lng:47.4594, tz:'Asia/Baku', label:{ az:'Ağcabədi', en:'Aghjabadi', ru:'Агджабеди', ar:'أغجابيدي', tr:'Ağcabedi' }, alt:['Agjabadi'] },
  { id:'Aghdam', country:'AZ', lat:39.991, lng:46.9274, tz:'Asia/Baku', label:{ az:'Ağdam', en:'Aghdam', ru:'Агдам', ar:'أغدام', tr:'Ağdam' }, alt:['Agdam'] },
  { id:'Aghdash', country:'AZ', lat:40.647, lng:47.4738, tz:'Asia/Baku', label:{ az:'Ağdaş', en:'Agdash', ru:'Агдаш', ar:'أغداش', tr:'Ağdaş' }, alt:['Aghdash'] },
  { id:'Aghdara', country:'AZ', lat:40.2113, lng:46.8214, tz:'Asia/Baku', label:{ az:'Ağdərə', en:'Aghdara', ru:'Агдере', ar:'أغدره', tr:'Ağdere' }, alt:['Agdara'] },
  { id:'Aghstafa', country:'AZ', lat:41.1189, lng:45.4539, tz:'Asia/Baku', label:{ az:'Ağstafa', en:'Aghstafa', ru:'Агстафа', ar:'أغستافا', tr:'Ağstafa' }, alt:['Agstafa'] },
  { id:'Agsu', country:'AZ', lat:40.5703, lng:48.4009, tz:'Asia/Baku', label:{ az:'Ağsu', en:'Agsu', ru:'Агсу', ar:'أغسو', tr:'Ağsu' }, alt:['Aghsu','Ахсу'] },
  { id:'Astara', country:'AZ', lat:38.456, lng:48.875, tz:'Asia/Baku', label:{ az:'Astara', en:'Astara', ru:'Астара', ar:'آستارا', tr:'Astara' } },
  { id:'Babek', country:'AZ', lat:39.1546, lng:45.4428, tz:'Asia/Baku', label:{ az:'Babək', en:'Babek', ru:'Бабек', ar:'بابك', tr:'Babek' } },
  { id:'Balakan', country:'AZ', lat:41.7263, lng:46.4048, tz:'Asia/Baku', label:{ az:'Balakən', en:'Balakan', ru:'Балакен', ar:'بالاكن', tr:'Balaken' }, alt:['Belokany','Белоканы'] },
  { id:'Beylagan', country:'AZ', lat:39.7756, lng:47.6186, tz:'Asia/Baku', label:{ az:'Beyləqan', en:'Beylagan', ru:'Бейлаган', ar:'بيلقان', tr:'Beylegan' } },
  { id:'Barda', country:'AZ', lat:40.3758, lng:47.1262, tz:'Asia/Baku', label:{ az:'Bərdə', en:'Barda', ru:'Барда', ar:'بردعة', tr:'Berde' } },
  { id:'Bilasuvar', country:'AZ', lat:39.4583, lng:48.545, tz:'Asia/Baku', label:{ az:'Biləsuvar', en:'Bilasuvar', ru:'Билясувар', ar:'بيله سوار', tr:'Bilesuvar' } },
  { id:'Jabrayil', country:'AZ', lat:39.3992, lng:47.0284, tz:'Asia/Baku', label:{ az:'Cəbrayıl', en:'Jabrayil', ru:'Джебраил', ar:'جبرائيل', tr:'Cebrail' }, alt:['Jabrail'] },
  { id:'Jalilabad', country:'AZ', lat:39.2096, lng:48.4919, tz:'Asia/Baku', label:{ az:'Cəlilabad', en:'Jalilabad', ru:'Джалилабад', ar:'جليل آباد', tr:'Celilabad' } },
  { id:'Julfa', country:'AZ', lat:38.954, lng:45.6296, tz:'Asia/Baku', label:{ az:'Culfa', en:'Julfa', ru:'Джульфа', ar:'جلفا', tr:'Culfa' }, alt:['Jolfa'] },
  { id:'Dashkasan', country:'AZ', lat:40.5239, lng:46.0819, tz:'Asia/Baku', label:{ az:'Daşkəsən', en:'Dashkasan', ru:'Дашкесан', ar:'داشكسن', tr:'Daşkesen' } },
  { id:'Fuzuli', country:'AZ', lat:39.6009, lng:47.1453, tz:'Asia/Baku', label:{ az:'Füzuli', en:'Fuzuli', ru:'Физули', ar:'فضولي', tr:'Füzuli' }, alt:['Fizuli'] },
  { id:'Gadabay', country:'AZ', lat:40.5705, lng:45.8123, tz:'Asia/Baku', label:{ az:'Gədəbəy', en:'Gadabay', ru:'Гедабек', ar:'كيدابك', tr:'Gedebey' }, alt:['Kedabek'] },
  { id:'Goranboy', country:'AZ', lat:40.6103, lng:46.7897, tz:'Asia/Baku', label:{ az:'Goranboy', en:'Goranboy', ru:'Геранбой', ar:'كورانبوي', tr:'Goranboy' } },
  { id:'Goychay', country:'AZ', lat:40.6506, lng:47.7422, tz:'Asia/Baku', label:{ az:'Göyçay', en:'Goychay', ru:'Гёйчай', ar:'جويجاي', tr:'Göyçay' }, alt:['Geokchay','Геокчай'] },
  { id:'Goygol', country:'AZ', lat:40.5858, lng:46.3189, tz:'Asia/Baku', label:{ az:'Göygöl', en:'Goygol', ru:'Гёйгёль', ar:'جويجول', tr:'Göygöl' }, alt:['Khanlar','Xanlar'] },
  { id:'Hajigabul', country:'AZ', lat:40.0387, lng:48.9429, tz:'Asia/Baku', label:{ az:'Hacıqabul', en:'Hajigabul', ru:'Гаджигабул', ar:'حاجي قابول', tr:'Hacıkabul' }, alt:['Qazıməmməd','Kazi-Magomed'] },
  { id:'Khachmaz', country:'AZ', lat:41.4643, lng:48.8056, tz:'Asia/Baku', label:{ az:'Xaçmaz', en:'Khachmaz', ru:'Хачмаз', ar:'خاشماز', tr:'Haçmaz' }, alt:['Хачмас'] },
  { id:'Khankendi', country:'AZ', lat:39.8177, lng:46.7528, tz:'Asia/Baku', label:{ az:'Xankəndi', en:'Khankendi', ru:'Ханкенди', ar:'خانكندي', tr:'Hankendi' } },
  { id:'Khirdalan', country:'AZ', lat:40.4481, lng:49.755, tz:'Asia/Baku', label:{ az:'Xırdalan', en:'Khirdalan', ru:'Хырдалан', ar:'خيردالان', tr:'Hırdalan' }, alt:['Abşeron','Absheron','Xirdalan'] },
  { id:'Khizi', country:'AZ', lat:40.9085, lng:49.0748, tz:'Asia/Baku', label:{ az:'Xızı', en:'Khizi', ru:'Хызы', ar:'خيزي', tr:'Hızı' }, alt:['Xizi'] },
  { id:'Khojaly', country:'AZ', lat:39.9136, lng:46.7921, tz:'Asia/Baku', label:{ az:'Xocalı', en:'Khojaly', ru:'Ходжалы', ar:'خوجالي', tr:'Hocalı' }, alt:['Khojali'] },
  { id:'Khojavend', country:'AZ', lat:39.795, lng:47.1117, tz:'Asia/Baku', label:{ az:'Xocavənd', en:'Khojavend', ru:'Ходжавенд', ar:'خوجافند', tr:'Hocavend' } },
  { id:'Imishli', country:'AZ', lat:39.871, lng:48.06, tz:'Asia/Baku', label:{ az:'İmişli', en:'Imishli', ru:'Имишли', ar:'إميشلي', tr:'İmişli' } },
  { id:'Ismayilli', country:'AZ', lat:40.7848, lng:48.1514, tz:'Asia/Baku', label:{ az:'İsmayıllı', en:'Ismayilli', ru:'Исмаиллы', ar:'إسماعيلي', tr:'İsmayıllı' } },
  { id:'Kalbajar', country:'AZ', lat:40.1098, lng:46.0445, tz:'Asia/Baku', label:{ az:'Kəlbəcər', en:'Kalbajar', ru:'Кельбаджар', ar:'كلبجر', tr:'Kelbecer' } },
  { id:'Kangarli', country:'AZ', lat:39.3994, lng:45.1151, tz:'Asia/Baku', label:{ az:'Kəngərli', en:'Kangarli', ru:'Кенгерли', ar:'كنكرلي', tr:'Kengerli' }, alt:['Qıvraq','Givrag','Гывраг'] },
  { id:'Kurdamir', country:'AZ', lat:40.3426, lng:48.1565, tz:'Asia/Baku', label:{ az:'Kürdəmir', en:'Kurdamir', ru:'Кюрдамир', ar:'كوردامير', tr:'Kürdemir' } },
  { id:'Gakh', country:'AZ', lat:41.4183, lng:46.9204, tz:'Asia/Baku', label:{ az:'Qax', en:'Gakh', ru:'Гах', ar:'قاخ', tr:'Kah' }, alt:['Qakh','Кахи'] },
  { id:'Gazakh', country:'AZ', lat:41.0925, lng:45.3656, tz:'Asia/Baku', label:{ az:'Qazax', en:'Gazakh', ru:'Газах', ar:'قازاخ', tr:'Kazak' }, alt:['Qazakh','Kazakh','Казах'] },
  { id:'Gabala', country:'AZ', lat:40.9814, lng:47.8458, tz:'Asia/Baku', label:{ az:'Qəbələ', en:'Gabala', ru:'Габала', ar:'قابالا', tr:'Gebele' }, alt:['Qabala','Kabala','Kebele'] },
  { id:'Gobustan', country:'AZ', lat:40.5336, lng:48.9282, tz:'Asia/Baku', label:{ az:'Qobustan', en:'Gobustan', ru:'Гобустан', ar:'قوبوستان', tr:'Gobustan' }, alt:['Mərəzə','Maraza','Qobustan'] },
  { id:'Quba', country:'AZ', lat:41.3611, lng:48.5134, tz:'Asia/Baku', label:{ az:'Quba', en:'Quba', ru:'Губа', ar:'قوبا', tr:'Kuba' }, alt:['Guba','Куба'] },
  { id:'Gubadli', country:'AZ', lat:39.3444, lng:46.5818, tz:'Asia/Baku', label:{ az:'Qubadlı', en:'Gubadli', ru:'Губадлы', ar:'قبادلي', tr:'Kubadlı' }, alt:['Qubadli','Kubatli'] },
  { id:'Qusar', country:'AZ', lat:41.4275, lng:48.4302, tz:'Asia/Baku', label:{ az:'Qusar', en:'Qusar', ru:'Гусар', ar:'قوسار', tr:'Kusar' }, alt:['Gusar','Кусары'] },
  { id:'Lachin', country:'AZ', lat:39.6374, lng:46.5498, tz:'Asia/Baku', label:{ az:'Laçın', en:'Lachin', ru:'Лачин', ar:'لاتشين', tr:'Laçın' } },
  { id:'Lerik', country:'AZ', lat:38.7739, lng:48.415, tz:'Asia/Baku', label:{ az:'Lerik', en:'Lerik', ru:'Лерик', ar:'لريك', tr:'Lerik' } },
  { id:'Lankaran', country:'AZ', lat:38.7529, lng:48.8475, tz:'Asia/Baku', label:{ az:'Lənkəran', en:'Lankaran', ru:'Ленкорань', ar:'لنكران', tr:'Lenkeran' }, alt:['Лянкяран'] },
  { id:'Masally', country:'AZ', lat:39.0353, lng:48.6654, tz:'Asia/Baku', label:{ az:'Masallı', en:'Masally', ru:'Масаллы', ar:'ماسالي', tr:'Masallı' }, alt:['Masalli'] },
  { id:'Mingachevir', country:'AZ', lat:40.7642, lng:47.0623, tz:'Asia/Baku', label:{ az:'Mingəçevir', en:'Mingachevir', ru:'Мингечевир', ar:'مينغاشوير', tr:'Mingeçevir' }, alt:['Мингечаур','Mingechaur'] }, // lang-ok[Mingəçevir]: rəsmi yazılış
  { id:'Naftalan', country:'AZ', lat:40.5082, lng:46.8203, tz:'Asia/Baku', label:{ az:'Naftalan', en:'Naftalan', ru:'Нафталан', ar:'نفتالان', tr:'Naftalan' } },
  { id:'Nakhchivan', country:'AZ', lat:39.2089, lng:45.4122, tz:'Asia/Baku', label:{ az:'Naxçıvan', en:'Nakhchivan', ru:'Нахчыван', ar:'ناختشيفان', tr:'Nahçıvan' }, alt:['Нахичевань','Nakhichevan'] },
  { id:'Neftchala', country:'AZ', lat:39.3768, lng:49.247, tz:'Asia/Baku', label:{ az:'Neftçala', en:'Neftchala', ru:'Нефтчала', ar:'نفتجالا', tr:'Neftçala' }, alt:['Нефтечала'] },
  { id:'Oghuz', country:'AZ', lat:41.0713, lng:47.4653, tz:'Asia/Baku', label:{ az:'Oğuz', en:'Oghuz', ru:'Огуз', ar:'أوغوز', tr:'Oğuz' }, alt:['Oguz'] },
  { id:'Ordubad', country:'AZ', lat:38.9096, lng:46.0227, tz:'Asia/Baku', label:{ az:'Ordubad', en:'Ordubad', ru:'Ордубад', ar:'أوردوباد', tr:'Ordubad' } },
  { id:'Saatli', country:'AZ', lat:39.9321, lng:48.3689, tz:'Asia/Baku', label:{ az:'Saatlı', en:'Saatly', ru:'Саатлы', ar:'ساتلي', tr:'Saatlı' }, alt:['Saatli'] },
  { id:'Sabirabad', country:'AZ', lat:40.0087, lng:48.477, tz:'Asia/Baku', label:{ az:'Sabirabad', en:'Sabirabad', ru:'Сабирабад', ar:'صابرآباد', tr:'Sabirabad' } },
  { id:'Salyan', country:'AZ', lat:39.5962, lng:48.9848, tz:'Asia/Baku', label:{ az:'Salyan', en:'Salyan', ru:'Сальян', ar:'ساليان', tr:'Salyan' }, alt:['Сальяны'] },
  { id:'Samukh', country:'AZ', lat:40.7649, lng:46.4087, tz:'Asia/Baku', label:{ az:'Samux', en:'Samukh', ru:'Самух', ar:'ساموخ', tr:'Samuh' }, alt:['Nəbiağalı','Nabiagali'] },
  { id:'Sadarak', country:'AZ', lat:39.7229, lng:44.8485, tz:'Asia/Baku', label:{ az:'Sədərək', en:'Sadarak', ru:'Садарак', ar:'سدرك', tr:'Sederek' }, alt:['Heydərabad','Heydarabad'] },
  { id:'Siyazan', country:'AZ', lat:41.0781, lng:49.1156, tz:'Asia/Baku', label:{ az:'Siyəzən', en:'Siyazan', ru:'Сиязань', ar:'سيازان', tr:'Siyezen' }, alt:['Сиазань'] },
  { id:'Shabran', country:'AZ', lat:41.2012, lng:48.9871, tz:'Asia/Baku', label:{ az:'Şabran', en:'Shabran', ru:'Шабран', ar:'شابران', tr:'Şabran' }, alt:['Dəvəçi','Devechi','Дивичи'] },
  { id:'Shahbuz', country:'AZ', lat:39.4072, lng:45.5739, tz:'Asia/Baku', label:{ az:'Şahbuz', en:'Shahbuz', ru:'Шахбуз', ar:'شاهبوز', tr:'Şahbuz' } },
  { id:'Shamakhi', country:'AZ', lat:40.6314, lng:48.6414, tz:'Asia/Baku', label:{ az:'Şamaxı', en:'Shamakhi', ru:'Шамахы', ar:'شماخي', tr:'Şamahı' }, alt:['Shamakha','Шемаха'] },
  { id:'Sheki', country:'AZ', lat:41.1919, lng:47.1706, tz:'Asia/Baku', label:{ az:'Şəki', en:'Sheki', ru:'Шеки', ar:'شكي', tr:'Şeki' }, alt:['Shaki'] },
  { id:'Shamkir', country:'AZ', lat:40.8298, lng:46.0178, tz:'Asia/Baku', label:{ az:'Şəmkir', en:'Shamkir', ru:'Шамкир', ar:'شمكير', tr:'Şemkir' } },
  { id:'Sharur', country:'AZ', lat:39.553, lng:44.9799, tz:'Asia/Baku', label:{ az:'Şərur', en:'Sharur', ru:'Шарур', ar:'شرور', tr:'Şerur' } },
  { id:'Shirvan', country:'AZ', lat:39.9378, lng:48.929, tz:'Asia/Baku', label:{ az:'Şirvan', en:'Shirvan', ru:'Ширван', ar:'شروان', tr:'Şirvan' }, alt:['Əli Bayramlı','Ali Bayramli'] },
  { id:'Shusha', country:'AZ', lat:39.7601, lng:46.7499, tz:'Asia/Baku', label:{ az:'Şuşa', en:'Shusha', ru:'Шуша', ar:'شوشا', tr:'Şuşa' }, alt:['Shushi'] },
  { id:'Tartar', country:'AZ', lat:40.342, lng:46.9316, tz:'Asia/Baku', label:{ az:'Tərtər', en:'Tartar', ru:'Тертер', ar:'ترتر', tr:'Terter' }, alt:['Terter'] },
  { id:'Tovuz', country:'AZ', lat:40.9925, lng:45.6284, tz:'Asia/Baku', label:{ az:'Tovuz', en:'Tovuz', ru:'Товуз', ar:'توفوز', tr:'Tovuz' }, alt:['Тауз'] },
  { id:'Ujar', country:'AZ', lat:40.519, lng:47.6542, tz:'Asia/Baku', label:{ az:'Ucar', en:'Ujar', ru:'Уджар', ar:'أوجار', tr:'Ucar' }, alt:['Udjar','Уджары'] },
  { id:'Yardimli', country:'AZ', lat:38.9077, lng:48.2405, tz:'Asia/Baku', label:{ az:'Yardımlı', en:'Yardimli', ru:'Ярдымлы', ar:'يارديملي', tr:'Yardımlı' } },
  { id:'Yevlakh', country:'AZ', lat:40.6183, lng:47.1501, tz:'Asia/Baku', label:{ az:'Yevlax', en:'Yevlakh', ru:'Евлах', ar:'يفلاخ', tr:'Yevlah' }, alt:['Yevlax'] },
  { id:'Zagatala', country:'AZ', lat:41.6316, lng:46.6448, tz:'Asia/Baku', label:{ az:'Zaqatala', en:'Zagatala', ru:'Загатала', ar:'زاقاتالا', tr:'Zakatala' }, alt:['Zakatala'] },
  { id:'Zangilan', country:'AZ', lat:39.068, lng:46.695, tz:'Asia/Baku', label:{ az:'Zəngilan', en:'Zangilan', ru:'Зангилан', ar:'زنكيلان', tr:'Zengilan' }, alt:['Zangelan','Зангелан'] },
  { id:'Zardab', country:'AZ', lat:40.2184, lng:47.7121, tz:'Asia/Baku', label:{ az:'Zərdab', en:'Zardab', ru:'Зардаб', ar:'زرداب', tr:'Zerdab' } },
  /* @@AZ_END@@ */
  // ── Dünya (23) ──
  /* @@WORLD_CITIES@@ */
  { id:'Mecca', country:'SA', lat:21.4225, lng:39.8262, tz:'Asia/Riyadh', label:{ az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' }, alt:['Makkah'] },
  { id:'Medina', country:'SA', lat:24.4672, lng:39.6111, tz:'Asia/Riyadh', label:{ az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' }, alt:['Madinah'] },
  { id:'Istanbul', country:'TR', lat:41.0082, lng:28.9784, tz:'Europe/Istanbul', label:{ az:'İstanbul', en:'Istanbul', ru:'Стамбул', ar:'إسطنبول', tr:'İstanbul' } },
  { id:'Ankara', country:'TR', lat:39.9334, lng:32.8597, tz:'Europe/Istanbul', label:{ az:'Ankara', en:'Ankara', ru:'Анкара', ar:'أنقرة', tr:'Ankara' } },
  { id:'Moscow', country:'RU', lat:55.7558, lng:37.6173, tz:'Europe/Moscow', label:{ az:'Moskva', en:'Moscow', ru:'Москва', ar:'موسكو', tr:'Moskova' } },
  { id:'Saint Petersburg', country:'RU', lat:59.9386, lng:30.3141, tz:'Europe/Moscow', label:{ az:'Sankt-Peterburq', en:'Saint Petersburg', ru:'Санкт-Петербург', ar:'سانت بطرسبرغ', tr:'Sankt-Peterburg' }, alt:['Petersburg','Peterburq'] }, // lang-ok[Peterburq]: rəsmi az yazılışı
  { id:'Kazan', country:'RU', lat:55.7963, lng:49.1088, tz:'Europe/Moscow', label:{ az:'Kazan', en:'Kazan', ru:'Казань', ar:'قازان', tr:'Kazan' } },
  { id:'Derbent', country:'RU', lat:42.0662, lng:48.2876, tz:'Europe/Moscow', label:{ az:'Dərbənd', en:'Derbent', ru:'Дербент', ar:'دربند', tr:'Derbent' } },
  { id:'Tbilisi', country:'GE', lat:41.6914, lng:44.8341, tz:'Asia/Tbilisi', label:{ az:'Tbilisi', en:'Tbilisi', ru:'Тбилиси', ar:'تبليسي', tr:'Tiflis' } },
  { id:'Marneuli', country:'GE', lat:41.4876, lng:44.7985, tz:'Asia/Tbilisi', label:{ az:'Marneuli', en:'Marneuli', ru:'Марнеули', ar:'مارنيولي', tr:'Marneuli' }, alt:['Borçalı','Borchali'] }, // lang-ok[Marneuli]: gürcü toponimi
  { id:'Tabriz', country:'IR', lat:38.0962, lng:46.2738, tz:'Asia/Tehran', label:{ az:'Təbriz', en:'Tabriz', ru:'Тебриз', ar:'تبريز', tr:'Tebriz' } },
  { id:'Tehran', country:'IR', lat:35.6944, lng:51.4215, tz:'Asia/Tehran', label:{ az:'Tehran', en:'Tehran', ru:'Тегеран', ar:'طهران', tr:'Tahran' } },
  { id:'Dubai', country:'AE', lat:25.2048, lng:55.2708, tz:'Asia/Dubai', label:{ az:'Dubay', en:'Dubai', ru:'Дубай', ar:'دبي', tr:'Dubai' } },
  { id:'Cairo', country:'EG', lat:30.0444, lng:31.2357, tz:'Africa/Cairo', label:{ az:'Qahirə', en:'Cairo', ru:'Каир', ar:'القاهرة', tr:'Kahire' } },
  { id:'Tashkent', country:'UZ', lat:41.2647, lng:69.2163, tz:'Asia/Tashkent', label:{ az:'Daşkənd', en:'Tashkent', ru:'Ташкент', ar:'طشقند', tr:'Taşkent' } },
  { id:'Almaty', country:'KZ', lat:43.2525, lng:76.9115, tz:'Asia/Almaty', label:{ az:'Almatı', en:'Almaty', ru:'Алматы', ar:'ألماتي', tr:'Almatı' } },
  { id:'London', country:'GB', lat:51.5074, lng:-0.1278, tz:'Europe/London', label:{ az:'London', en:'London', ru:'Лондон', ar:'لندن', tr:'Londra' } },
  { id:'Berlin', country:'DE', lat:52.52, lng:13.405, tz:'Europe/Berlin', label:{ az:'Berlin', en:'Berlin', ru:'Берлин', ar:'برلين', tr:'Berlin' } },
  { id:'Paris', country:'FR', lat:48.8566, lng:2.3522, tz:'Europe/Paris', label:{ az:'Paris', en:'Paris', ru:'Париж', ar:'باريس', tr:'Paris' } },
  { id:'New York', country:'US', lat:40.7128, lng:-74.006, tz:'America/New_York', label:{ az:'Nyu-York', en:'New York', ru:'Нью-Йорк', ar:'نيويورك', tr:'New York' } },
  { id:'Toronto', country:'CA', lat:43.6532, lng:-79.3832, tz:'America/Toronto', label:{ az:'Toronto', en:'Toronto', ru:'Торонто', ar:'تورونتو', tr:'Toronto' } },
  { id:'Jakarta', country:'ID', lat:-6.2088, lng:106.8456, tz:'Asia/Jakarta', label:{ az:'Cakarta', en:'Jakarta', ru:'Джакарта', ar:'جاكرتا', tr:'Cakarta' } },
  { id:'Kuala Lumpur', country:'MY', lat:3.139, lng:101.6869, tz:'Asia/Kuala_Lumpur', label:{ az:'Kuala-Lumpur', en:'Kuala Lumpur', ru:'Куала-Лумпур', ar:'كوالالمبور', tr:'Kuala Lumpur' } },
  /* @@WORLD_END@@ */
]

// Köhnə versiyalar şəhəri siyahıdakı İNDEKSLƏ yazırdı — həmin sıra
const LEGACY_ORDER = ['Baku','Ganja','Istanbul','Ankara','Moscow','Cairo','Mecca','Medina','Dubai','London',
  'Sheki','Lankaran','Tabriz','Berlin','Paris','New York','Toronto','Kazan','Jakarta','Kuala Lumpur']

const CITY_BY_ID = new Map(PRAYER_CITIES.map(c => [c.id, c]))

// ── localStorage köməkçiləri (gizli rejimdə və s. atıla bilər) ──
// Yaddaş bağlıdırsa (gizli rejim, kvota) seçim yalnız bu açılışda — yaddaşda (mem*) qalır
let storageBroken = false
function readLS(key) {
  try { return localStorage.getItem(key) } catch { storageBroken = true; return null }
}
function writeLS(key, value) {
  try { localStorage.setItem(key, value) } catch { storageBroken = true }
}
function readJSON(key) {
  try { return JSON.parse(readLS(key) || 'null') } catch { return null }
}

// Yaddaş bağlı olanda da seçim bu açılış ərzində işləsin
let memSelection = null   // id və ya 'custom'
let memCustom = null

const validTz = (tz) => {
  if (typeof tz !== 'string' || !tz) return false
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true } catch { return false }
}

/** Brauzerin öz saat qurşağı (dəqiq koordinat seçiləndə). */
function deviceTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/**
 * Xüsusi yer obyektini yoxla və ortaq formata sal; yararsızdırsa null.
 * label: 5 dildə obyekt və ya tək ad (name) — çatmayan dillər əsas adla doldurulur,
 * çünki server bildirişdə city[lang]-ı yazır (server/prayer-utils.js → normLoc).
 */
function sanitizePlace(p) {
  if (!p || typeof p !== 'object') return null
  const lat = Number(p.lat), lng = Number(p.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  const src = p.label && typeof p.label === 'object' ? p.label : {}
  const base = String(src.en || src.az || p.name || Object.values(src).find(Boolean) || '').trim().slice(0, 80)
  if (!base) return null
  const label = {}
  for (const l of LANG_LIST) label[l] = String(src[l] || base).trim().slice(0, 80)
  const method = Number.isInteger(Number(p.method)) && p.method != null ? Number(p.method) : undefined
  return {
    lat: Math.round(lat * 1e4) / 1e4,
    lng: Math.round(lng * 1e4) / 1e4,
    tz: validTz(p.tz) ? p.tz : deviceTz(),
    label,
    country: typeof p.country === 'string' ? p.country.slice(0, 2).toUpperCase() : '',
    ...(method ? { method } : {}),
  }
}

/** Saxlanmış dəyəri şəhər id-sinə çevir (köhnə formatlar da daxil); tanınmırsa null. */
// SettingsManager-in 2026-10-dan əvvəlki siyahısı Məkkə/Mədinəni başqa adla
// saxlayırdı — admin bunları seçibsə, standart səssizcə Bakıya düşməsin
const LEGACY_ADMIN_IDS = { Makkah: 'Mecca', Madinah: 'Medina' }

function normalizeId(saved) {
  if (saved == null || saved === '') return null
  // Qaraçuxur dövrü: 'mosque' — məscid Bakıda idi
  if (saved === 'mosque') return 'Baku'
  // Ən köhnə versiya köhnə siyahının indeksini yazırdı (0 = Bakı)
  if (/^\d+$/.test(saved)) return LEGACY_ORDER[Number(saved)] || null
  // Admin panelinin köhnə şəhər siyahısı fərqli id-lər yazırdı
  if (LEGACY_ADMIN_IDS[saved]) return LEGACY_ADMIN_IDS[saved]
  return CITY_BY_ID.has(saved) ? saved : null
}

function readCustom() {
  return sanitizePlace(readJSON(CUSTOM_KEY)) || (storageBroken ? memCustom : null)
}

/** İstifadəçinin özü seçdiyi şəhərin id-si ('custom' — xüsusi yer); seçməyibsə null. */
export function getPrayerCityId() {
  const saved = readLS(CITY_KEY)
  const id = saved === CUSTOM_ID ? CUSTOM_ID : normalizeId(saved) || (storageBroken ? memSelection : null)
  if (id === CUSTOM_ID) return readCustom() ? CUSTOM_ID : null
  return id
}

/** Şəhər obyekti → ortaq yer formatı. */
function fromCity(c, isDefault) {
  return {
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    tz: c.tz,
    method: c.method || DEFAULT_METHOD,
    city: c.label,
    country: c.country,
    isDefault,
    isCustom: false,
  }
}

function fromCustom(p) {
  return {
    id: CUSTOM_ID,
    lat: p.lat,
    lng: p.lng,
    tz: p.tz,
    method: p.method || DEFAULT_METHOD,
    city: p.label,
    country: p.country || '',
    isDefault: false,
    isCustom: true,
  }
}

/**
 * Cari namaz yeri: istifadəçinin seçimi → admin standartı → DEFAULT_PRAYER_LOCATION.
 * Həmişə tam obyekt qaytarır (heç vaxt null deyil).
 */
export function getPrayerLocation() {
  const own = getPrayerCityId()
  if (own === CUSTOM_ID) return fromCustom(readCustom())
  if (own) return fromCity(CITY_BY_ID.get(own), false)
  const adminId = normalizeId(readLS(ADMIN_DEFAULT_KEY))
  if (adminId) return fromCity(CITY_BY_ID.get(adminId), true)
  // Standart yer siyahıdakı şəhərlə üst-üstə düşürsə, onun id-si ilə qaytar —
  // seçicidə həmin şəhər seçilmiş görünsün
  const d = DEFAULT_PRAYER_LOCATION
  const same = PRAYER_CITIES.find(c => Math.abs(c.lat - d.lat) < 0.05 && Math.abs(c.lng - d.lng) < 0.05)
  return {
    id: same ? same.id : null,
    lat: d.lat,
    lng: d.lng,
    tz: d.tz,
    method: d.method || DEFAULT_METHOD,
    city: same ? same.label : d.city,
    country: same ? same.country : '',
    isDefault: true,
    isCustom: false,
  }
}

/** Keş və müqayisə açarı — yalnız vaxtlara təsir edən sahələr. */
export function locationSig(loc) {
  return `${loc.lat},${loc.lng},${loc.method}`
}

function emitChange() {
  try { window.dispatchEvent(new Event(CHANGE_EVENT)) } catch { /* SSR / köhnə brauzer */ }
}

/**
 * Push bildirişləri açıqdırsa (token var), Firestore-dakı fcm_tokens sənədinə
 * yeni yeri yaz — server hər istifadəçiyə ÖZ şəhərinin azan vaxtında göndərir.
 * Token yoxdursa Firebase modulu ümumiyyətlə yüklənmir.
 */
function syncPushLocation() {
  if (!readLS(FCM_TOKEN_KEY)) return
  import('../firebase/messaging')
    .then(m => m.updateTokenLocation?.())
    .catch(() => { /* şəbəkə yoxdur — növbəti token yazılışında yenilənəcək */ })
}

// ── Son seçilənlər: [{ id }] və ya [{ id:'custom', place }] ──
const RECENT_MAX = 5
const placeKey = (p) => `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`

/** Son seçilən yerlər (yenidən köhnəyə): { id, city?, place? } */
export function getRecentPlaces() {
  const raw = readJSON(RECENT_KEY)
  if (!Array.isArray(raw)) return []
  const out = []
  for (const r of raw) {
    if (r?.id && CITY_BY_ID.has(r.id)) out.push({ id: r.id, city: CITY_BY_ID.get(r.id) })
    else if (r?.place) { const p = sanitizePlace(r.place); if (p) out.push({ id: CUSTOM_ID, place: p }) }
  }
  return out.slice(0, RECENT_MAX)
}

function pushRecent(entry) {
  const keyOf = (r) => (r.place ? `p:${placeKey(r.place)}` : `c:${r.id}`)
  const k = keyOf(entry)
  const prev = getRecentPlaces().map(r => (r.place ? { place: r.place } : { id: r.id }))
  const next = [entry, ...prev.filter(r => keyOf(r) !== k)].slice(0, RECENT_MAX)
  writeLS(RECENT_KEY, JSON.stringify(next))
}

/**
 * İstifadəçinin seçimi.
 *   setPrayerCity('Sheki')                         — siyahıdakı şəhər
 *   setPrayerCity({ lat, lng, tz, label, country }) — siyahıda olmayan yer
 * Yararsız dəyər səssizcə nəzərə alınmır (əvvəlki davranış).
 */
export function setPrayerCity(idOrPlace) {
  if (idOrPlace && typeof idOrPlace === 'object') {
    const p = sanitizePlace(idOrPlace)
    if (!p) return
    // Siyahıdakı şəhərlə eyni nöqtədirsə — o şəhəri seç (adlar 5 dildə hazırdır)
    const near = nearestCity(p.lat, p.lng)
    if (near && near.km < 1) { setPrayerCity(near.city.id); return }
    memCustom = p
    memSelection = CUSTOM_ID
    writeLS(CUSTOM_KEY, JSON.stringify(p))
    writeLS(CITY_KEY, CUSTOM_ID)
    pushRecent({ place: p })
  } else {
    const id = idOrPlace
    if (!CITY_BY_ID.has(id)) return
    memSelection = id
    writeLS(CITY_KEY, id)
    pushRecent({ id })
  }
  emitChange()
  // Həmişə yazılır (eyni şəhər olsa belə): köhnə tokenlərin sənədində loc yox idi
  syncPushLocation()
}

/**
 * Admin paneldəki standart şəhər (Settings → defaultCity). Yalnız istifadəçi
 * özü seçməyibsə təsir edir; növbəti açılışlar üçün yadda saxlanılır.
 */
export function setAdminDefaultCity(id) {
  const norm = normalizeId(id)
  const prev = normalizeId(readLS(ADMIN_DEFAULT_KEY))
  if (norm === prev) return
  if (norm) writeLS(ADMIN_DEFAULT_KEY, norm)
  else { try { localStorage.removeItem(ADMIN_DEFAULT_KEY) } catch { /* */ } }
  if (!getPrayerCityId()) emitChange()
}

/** Yer dəyişəndə cb(getPrayerLocation()) çağırılır (başqa tab da daxil). */
export function subscribePrayerLocation(cb) {
  if (typeof window === 'undefined') return () => {}
  const onChange = () => cb(getPrayerLocation())
  const onStorage = (e) => {
    if (e.key === CITY_KEY || e.key === ADMIN_DEFAULT_KEY || e.key === CUSTOM_KEY) onChange()
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

/** React hook: cari namaz yeri; vaxta təsir etməyən dəyişikliklərdə obyekt eyni qalır. */
export function usePrayerLocation() {
  const [loc, setLoc] = useState(getPrayerLocation)
  useEffect(() => subscribePrayerLocation(next => {
    setLoc(prev => (prev.id === next.id && locationSig(prev) === locationSig(next) && prev.isDefault === next.isDefault
      && prev.city?.en === next.city?.en ? prev : next))
  }), [])
  return loc
}

// ═══ Axtarış ═══════════════════════════════════════════

// Azərbaycan/türk hərfləri latın əsasına; NFD diakritikaları (ü, ö, ç …) silir
const FOLD_MAP = { 'ə':'e', 'ı':'i', 'İ':'i', 'ş':'s', 'ç':'c', 'ğ':'g', 'ö':'o', 'ü':'u', 'ё':'е', 'й':'и',
  'أ':'ا', 'إ':'ا', 'آ':'ا', 'ٱ':'ا', 'ة':'ه', 'ى':'ي' }

/** Axtarış üçün sadələşdirilmiş mətn: kiçik hərf, diakritikasız ("Şəki" → "seki"). */
export function foldText(s) {
  return String(s || '')
    .replace(/[əıİşçğöüёйأإآٱةى]/gi, ch => FOLD_MAP[ch] ?? FOLD_MAP[ch.toLowerCase()] ?? ch)
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[‐-―'’`ʼ.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Hər şəhər üçün axtarış mətnləri bir dəfə hazırlanır
const SEARCH_INDEX = PRAYER_CITIES.map(c => ({
  city: c,
  keys: [...new Set([c.id, ...Object.values(c.label), ...(c.alt || [])].map(foldText))],
}))

/**
 * Siyahıda axtarış: əvvəl adın başlanğıcı, sonra sözün başlanğıcı, sonra
 * hər hansı hissə. Boş sorğu → bütün siyahı (sıra dəyişmir).
 */
export function searchCities(query) {
  const q = foldText(query)
  if (!q) return PRAYER_CITIES.slice()
  const scored = []
  for (const { city, keys } of SEARCH_INDEX) {
    let best = 9
    for (const k of keys) {
      if (k === q) best = Math.min(best, 0)
      else if (k.startsWith(q)) best = Math.min(best, 1)
      else if (k.split(' ').some(w => w.startsWith(q))) best = Math.min(best, 2)
      else if (q.length >= 3 && k.includes(q)) best = Math.min(best, 3)
    }
    if (best < 9) scored.push([best, city])
  }
  // Bərabər xalda siyahı sırası qalır (Azərbaycan əvvəl)
  return scored.sort((a, b) => a[0] - b[0]).map(x => x[1])
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const r = Math.PI / 180
  const dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Siyahıdakı ən yaxın şəhər: { city, km } (siyahı boşdursa null). */
export function nearestCity(lat, lng) {
  let best = null
  for (const c of PRAYER_CITIES) {
    const km = haversineKm(lat, lng, c.lat, c.lng)
    if (!best || km < best.km) best = { city: c, km }
  }
  return best
}

// ═══ Dünya axtarışı (Open-Meteo geocoding — açarsız, CORS açıq) ═══

const GEO_API = 'https://geocoding-api.open-meteo.com/v1'
const GEO_LANG = { az: 'az', en: 'en', ru: 'ru', ar: 'ar', tr: 'tr' }

/**
 * Dünyanın istənilən yaşayış məntəqəsi: [{ gid, name, lat, lng, tz, country, region, countryName }].
 * Yalnız yaşayış məntəqələri (feature_code PPL*); tz-i olmayanlar atılır.
 */
export async function searchWorldPlaces(query, lang = 'az', signal) {
  const q = String(query || '').trim()
  if (q.length < 2) return []
  const url = `${GEO_API}/search?name=${encodeURIComponent(q)}&count=12&format=json&language=${GEO_LANG[lang] || 'en'}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`geocoding ${res.status}`)
  const data = await res.json()
  return (data?.results || [])
    .filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && validTz(r.timezone)
      && (!r.feature_code || /^PPL/.test(r.feature_code)))
    .map(r => ({
      gid: r.id,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      tz: r.timezone,
      country: (r.country_code || '').toUpperCase(),
      countryName: r.country || '',
      region: r.admin1 || '',
    }))
}

/**
 * Seçilən dünya yerinin adı 5 dildə (Open-Meteo /get?id=…&language=…).
 * Şəbəkə gec qalarsa (3 san) və ya dil üçün ad yoxdursa — əsas ad.
 */
export async function worldPlaceLabels(place, lang = 'az') {
  const label = { [lang]: place.name }
  if (!place.gid) return label
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), 3000)
  try {
    await Promise.all(LANG_LIST.filter(l => l !== lang).map(async l => {
      try {
        const r = await fetch(`${GEO_API}/get?id=${place.gid}&language=${l}`, { signal: ctrl?.signal })
        const d = r.ok ? await r.json() : null
        if (d?.name) label[l] = d.name
      } catch { /* bu dil üçün əsas ad qalır */ }
    }))
  } finally { clearTimeout(timer) }
  return label
}
