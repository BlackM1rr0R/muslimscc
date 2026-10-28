// ═══════════════════════════════════════════════════════
// Namaz vaxtlarının YERİ — istifadəçinin seçdiyi şəhər (bütün tətbiqdə ortaq)
// (mobil; veb src/utils/prayerLocation.js ilə eyni şəhər siyahısı və qayda)
//
// Seçim BİR yerdə saxlanılır — Namaz ekranında şəhər dəyişəndə ana səhifənin
// namaz kartı, "Camaat və Cümə namazı" ekranı və namaz bildirişləri də
// həmin şəhərə keçir.
//
// Saxlama: AsyncStorage 'muslim_cc_selected_city' = şəhərin id-si ('Baku').
// Köhnə dəyərlər də oxunur: Bildirişlər ayarlarındakı aladhan adları
// ('Makkah', 'Madinah' və s.).
// Seçim yoxdursa: admin paneldəki standart şəhər (Settings → defaultCity),
// o da yoxdursa DEFAULT_PRAYER_LOCATION (config/brand.js).
//
// API:
//   PRAYER_CITIES                — seçilə bilən şəhərlər (əvvəl Azərbaycan, sonra dünya)
//   COUNTRY_NAMES, foldText(s), searchCities(q) — seçici üçün axtarış
//   cityById(id) / normalizeCityId(v)
//   getPrayerLocation()          → { id, lat, lng, utcOffsetMin, method, city:{az,en,ru,ar,tr}, isDefault }
//   loadPrayerLocation()         → Promise<yer> (saxlanılmış seçimi oxuyur)
//   setPrayerCity(id)            — seçimi yaz və abunəçilərə xəbər ver
//   setAdminDefaultCity(id)      — admin standartı (istifadəçi seçməyibsə tətbiq olunur)
//   subscribePrayerLocation(cb)  → unsubscribe
//   usePrayerLocation()          → React hook: cari yer
//   locationSig(loc)             → keş açarı 'lat,lng,method'
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_PRAYER_LOCATION } from '../config/brand'
import { subscribeToSettings } from '../data/adminContent'

const CITY_KEY = 'muslim_cc_selected_city'
const ADMIN_DEFAULT_KEY = 'muslim_cc_admin_default_city'

// Hesablama metodu bütün şəhərlər üçün eynidir (aladhan 13 = Diyanet)
const DEFAULT_METHOD = DEFAULT_PRAYER_LOCATION.method || 13

// Koordinatlar şəhər mərkəzidir. utcOffsetMin — standart (qış) UTC fərqi:
// yalnız ilk aladhan cavabı gələnə qədər işlədilir; əsl fərq (yay vaxtı
// daxil) cavabdan götürülür (hooks/usePrayerTimes.js). Hermes-də Intl saat
// qurşağı dəstəyi cihazdan asılı olduğu üçün IANA adı əvəzinə rəqəm saxlanılır.
export const PRAYER_CITIES = [
  // ── Azərbaycan (75) ──
  /* @@AZ_CITIES@@ */
  { id:'Baku', country:'AZ', lat:40.4093, lng:49.8671, utcOffsetMin:240, label:{ az:'Bakı', en:'Baku', ru:'Баку', ar:'باكو', tr:'Bakü' } },
  { id:'Sumgait', country:'AZ', lat:40.5897, lng:49.6686, utcOffsetMin:240, label:{ az:'Sumqayıt', en:'Sumgait', ru:'Сумгаит', ar:'سومغايت', tr:'Sumgayıt' }, alt:['Sumqayit','Sumgayit'] },
  { id:'Ganja', country:'AZ', lat:40.6828, lng:46.3606, utcOffsetMin:240, label:{ az:'Gəncə', en:'Ganja', ru:'Гянджа', ar:'كنجة', tr:'Gence' }, alt:['Gyandzha'] },
  { id:'Aghjabadi', country:'AZ', lat:40.0502, lng:47.4594, utcOffsetMin:240, label:{ az:'Ağcabədi', en:'Aghjabadi', ru:'Агджабеди', ar:'أغجابيدي', tr:'Ağcabedi' }, alt:['Agjabadi'] },
  { id:'Aghdam', country:'AZ', lat:39.991, lng:46.9274, utcOffsetMin:240, label:{ az:'Ağdam', en:'Aghdam', ru:'Агдам', ar:'أغدام', tr:'Ağdam' }, alt:['Agdam'] },
  { id:'Aghdash', country:'AZ', lat:40.647, lng:47.4738, utcOffsetMin:240, label:{ az:'Ağdaş', en:'Agdash', ru:'Агдаш', ar:'أغداش', tr:'Ağdaş' }, alt:['Aghdash'] },
  { id:'Aghdara', country:'AZ', lat:40.2113, lng:46.8214, utcOffsetMin:240, label:{ az:'Ağdərə', en:'Aghdara', ru:'Агдере', ar:'أغدره', tr:'Ağdere' }, alt:['Agdara'] },
  { id:'Aghstafa', country:'AZ', lat:41.1189, lng:45.4539, utcOffsetMin:240, label:{ az:'Ağstafa', en:'Aghstafa', ru:'Агстафа', ar:'أغستافا', tr:'Ağstafa' }, alt:['Agstafa'] },
  { id:'Agsu', country:'AZ', lat:40.5703, lng:48.4009, utcOffsetMin:240, label:{ az:'Ağsu', en:'Agsu', ru:'Агсу', ar:'أغسو', tr:'Ağsu' }, alt:['Aghsu','Ахсу'] },
  { id:'Astara', country:'AZ', lat:38.456, lng:48.875, utcOffsetMin:240, label:{ az:'Astara', en:'Astara', ru:'Астара', ar:'آستارا', tr:'Astara' } },
  { id:'Babek', country:'AZ', lat:39.1546, lng:45.4428, utcOffsetMin:240, label:{ az:'Babək', en:'Babek', ru:'Бабек', ar:'بابك', tr:'Babek' } },
  { id:'Balakan', country:'AZ', lat:41.7263, lng:46.4048, utcOffsetMin:240, label:{ az:'Balakən', en:'Balakan', ru:'Балакен', ar:'بالاكن', tr:'Balaken' }, alt:['Belokany','Белоканы'] },
  { id:'Beylagan', country:'AZ', lat:39.7756, lng:47.6186, utcOffsetMin:240, label:{ az:'Beyləqan', en:'Beylagan', ru:'Бейлаган', ar:'بيلقان', tr:'Beylegan' } },
  { id:'Barda', country:'AZ', lat:40.3758, lng:47.1262, utcOffsetMin:240, label:{ az:'Bərdə', en:'Barda', ru:'Барда', ar:'بردعة', tr:'Berde' } },
  { id:'Bilasuvar', country:'AZ', lat:39.4583, lng:48.545, utcOffsetMin:240, label:{ az:'Biləsuvar', en:'Bilasuvar', ru:'Билясувар', ar:'بيله سوار', tr:'Bilesuvar' } },
  { id:'Jabrayil', country:'AZ', lat:39.3992, lng:47.0284, utcOffsetMin:240, label:{ az:'Cəbrayıl', en:'Jabrayil', ru:'Джебраил', ar:'جبرائيل', tr:'Cebrail' }, alt:['Jabrail'] },
  { id:'Jalilabad', country:'AZ', lat:39.2096, lng:48.4919, utcOffsetMin:240, label:{ az:'Cəlilabad', en:'Jalilabad', ru:'Джалилабад', ar:'جليل آباد', tr:'Celilabad' } },
  { id:'Julfa', country:'AZ', lat:38.954, lng:45.6296, utcOffsetMin:240, label:{ az:'Culfa', en:'Julfa', ru:'Джульфа', ar:'جلفا', tr:'Culfa' }, alt:['Jolfa'] },
  { id:'Dashkasan', country:'AZ', lat:40.5239, lng:46.0819, utcOffsetMin:240, label:{ az:'Daşkəsən', en:'Dashkasan', ru:'Дашкесан', ar:'داشكسن', tr:'Daşkesen' } },
  { id:'Fuzuli', country:'AZ', lat:39.6009, lng:47.1453, utcOffsetMin:240, label:{ az:'Füzuli', en:'Fuzuli', ru:'Физули', ar:'فضولي', tr:'Füzuli' }, alt:['Fizuli'] },
  { id:'Gadabay', country:'AZ', lat:40.5705, lng:45.8123, utcOffsetMin:240, label:{ az:'Gədəbəy', en:'Gadabay', ru:'Гедабек', ar:'كيدابك', tr:'Gedebey' }, alt:['Kedabek'] },
  { id:'Goranboy', country:'AZ', lat:40.6103, lng:46.7897, utcOffsetMin:240, label:{ az:'Goranboy', en:'Goranboy', ru:'Геранбой', ar:'كورانبوي', tr:'Goranboy' } },
  { id:'Goychay', country:'AZ', lat:40.6506, lng:47.7422, utcOffsetMin:240, label:{ az:'Göyçay', en:'Goychay', ru:'Гёйчай', ar:'جويجاي', tr:'Göyçay' }, alt:['Geokchay','Геокчай'] },
  { id:'Goygol', country:'AZ', lat:40.5858, lng:46.3189, utcOffsetMin:240, label:{ az:'Göygöl', en:'Goygol', ru:'Гёйгёль', ar:'جويجول', tr:'Göygöl' }, alt:['Khanlar','Xanlar'] },
  { id:'Hajigabul', country:'AZ', lat:40.0387, lng:48.9429, utcOffsetMin:240, label:{ az:'Hacıqabul', en:'Hajigabul', ru:'Гаджигабул', ar:'حاجي قابول', tr:'Hacıkabul' }, alt:['Qazıməmməd','Kazi-Magomed'] },
  { id:'Khachmaz', country:'AZ', lat:41.4643, lng:48.8056, utcOffsetMin:240, label:{ az:'Xaçmaz', en:'Khachmaz', ru:'Хачмаз', ar:'خاشماز', tr:'Haçmaz' }, alt:['Хачмас'] },
  { id:'Khankendi', country:'AZ', lat:39.8177, lng:46.7528, utcOffsetMin:240, label:{ az:'Xankəndi', en:'Khankendi', ru:'Ханкенди', ar:'خانكندي', tr:'Hankendi' } },
  { id:'Khirdalan', country:'AZ', lat:40.4481, lng:49.755, utcOffsetMin:240, label:{ az:'Xırdalan', en:'Khirdalan', ru:'Хырдалан', ar:'خيردالان', tr:'Hırdalan' }, alt:['Abşeron','Absheron','Xirdalan'] },
  { id:'Khizi', country:'AZ', lat:40.9085, lng:49.0748, utcOffsetMin:240, label:{ az:'Xızı', en:'Khizi', ru:'Хызы', ar:'خيزي', tr:'Hızı' }, alt:['Xizi'] },
  { id:'Khojaly', country:'AZ', lat:39.9136, lng:46.7921, utcOffsetMin:240, label:{ az:'Xocalı', en:'Khojaly', ru:'Ходжалы', ar:'خوجالي', tr:'Hocalı' }, alt:['Khojali'] },
  { id:'Khojavend', country:'AZ', lat:39.795, lng:47.1117, utcOffsetMin:240, label:{ az:'Xocavənd', en:'Khojavend', ru:'Ходжавенд', ar:'خوجافند', tr:'Hocavend' } },
  { id:'Imishli', country:'AZ', lat:39.871, lng:48.06, utcOffsetMin:240, label:{ az:'İmişli', en:'Imishli', ru:'Имишли', ar:'إميشلي', tr:'İmişli' } },
  { id:'Ismayilli', country:'AZ', lat:40.7848, lng:48.1514, utcOffsetMin:240, label:{ az:'İsmayıllı', en:'Ismayilli', ru:'Исмаиллы', ar:'إسماعيلي', tr:'İsmayıllı' } },
  { id:'Kalbajar', country:'AZ', lat:40.1098, lng:46.0445, utcOffsetMin:240, label:{ az:'Kəlbəcər', en:'Kalbajar', ru:'Кельбаджар', ar:'كلبجر', tr:'Kelbecer' } },
  { id:'Kangarli', country:'AZ', lat:39.3994, lng:45.1151, utcOffsetMin:240, label:{ az:'Kəngərli', en:'Kangarli', ru:'Кенгерли', ar:'كنكرلي', tr:'Kengerli' }, alt:['Qıvraq','Givrag','Гывраг'] },
  { id:'Kurdamir', country:'AZ', lat:40.3426, lng:48.1565, utcOffsetMin:240, label:{ az:'Kürdəmir', en:'Kurdamir', ru:'Кюрдамир', ar:'كوردامير', tr:'Kürdemir' } },
  { id:'Gakh', country:'AZ', lat:41.4183, lng:46.9204, utcOffsetMin:240, label:{ az:'Qax', en:'Gakh', ru:'Гах', ar:'قاخ', tr:'Kah' }, alt:['Qakh','Кахи'] },
  { id:'Gazakh', country:'AZ', lat:41.0925, lng:45.3656, utcOffsetMin:240, label:{ az:'Qazax', en:'Gazakh', ru:'Газах', ar:'قازاخ', tr:'Kazak' }, alt:['Qazakh','Kazakh','Казах'] },
  { id:'Gabala', country:'AZ', lat:40.9814, lng:47.8458, utcOffsetMin:240, label:{ az:'Qəbələ', en:'Gabala', ru:'Габала', ar:'قابالا', tr:'Gebele' }, alt:['Qabala','Kabala','Kebele'] },
  { id:'Gobustan', country:'AZ', lat:40.5336, lng:48.9282, utcOffsetMin:240, label:{ az:'Qobustan', en:'Gobustan', ru:'Гобустан', ar:'قوبوستان', tr:'Gobustan' }, alt:['Mərəzə','Maraza','Qobustan'] },
  { id:'Quba', country:'AZ', lat:41.3611, lng:48.5134, utcOffsetMin:240, label:{ az:'Quba', en:'Quba', ru:'Губа', ar:'قوبا', tr:'Kuba' }, alt:['Guba','Куба'] },
  { id:'Gubadli', country:'AZ', lat:39.3444, lng:46.5818, utcOffsetMin:240, label:{ az:'Qubadlı', en:'Gubadli', ru:'Губадлы', ar:'قبادلي', tr:'Kubadlı' }, alt:['Qubadli','Kubatli'] },
  { id:'Qusar', country:'AZ', lat:41.4275, lng:48.4302, utcOffsetMin:240, label:{ az:'Qusar', en:'Qusar', ru:'Гусар', ar:'قوسار', tr:'Kusar' }, alt:['Gusar','Кусары'] },
  { id:'Lachin', country:'AZ', lat:39.6374, lng:46.5498, utcOffsetMin:240, label:{ az:'Laçın', en:'Lachin', ru:'Лачин', ar:'لاتشين', tr:'Laçın' } },
  { id:'Lerik', country:'AZ', lat:38.7739, lng:48.415, utcOffsetMin:240, label:{ az:'Lerik', en:'Lerik', ru:'Лерик', ar:'لريك', tr:'Lerik' } },
  { id:'Lankaran', country:'AZ', lat:38.7529, lng:48.8475, utcOffsetMin:240, label:{ az:'Lənkəran', en:'Lankaran', ru:'Ленкорань', ar:'لنكران', tr:'Lenkeran' }, alt:['Лянкяран'] },
  { id:'Masally', country:'AZ', lat:39.0353, lng:48.6654, utcOffsetMin:240, label:{ az:'Masallı', en:'Masally', ru:'Масаллы', ar:'ماسالي', tr:'Masallı' }, alt:['Masalli'] },
  { id:'Mingachevir', country:'AZ', lat:40.7642, lng:47.0623, utcOffsetMin:240, label:{ az:'Mingəçevir', en:'Mingachevir', ru:'Мингечевир', ar:'مينغاشوير', tr:'Mingeçevir' }, alt:['Мингечаур','Mingechaur'] }, // lang-ok[Mingəçevir]: rəsmi yazılış
  { id:'Naftalan', country:'AZ', lat:40.5082, lng:46.8203, utcOffsetMin:240, label:{ az:'Naftalan', en:'Naftalan', ru:'Нафталан', ar:'نفتالان', tr:'Naftalan' } },
  { id:'Nakhchivan', country:'AZ', lat:39.2089, lng:45.4122, utcOffsetMin:240, label:{ az:'Naxçıvan', en:'Nakhchivan', ru:'Нахчыван', ar:'ناختشيفان', tr:'Nahçıvan' }, alt:['Нахичевань','Nakhichevan'] },
  { id:'Neftchala', country:'AZ', lat:39.3768, lng:49.247, utcOffsetMin:240, label:{ az:'Neftçala', en:'Neftchala', ru:'Нефтчала', ar:'نفتجالا', tr:'Neftçala' }, alt:['Нефтечала'] },
  { id:'Oghuz', country:'AZ', lat:41.0713, lng:47.4653, utcOffsetMin:240, label:{ az:'Oğuz', en:'Oghuz', ru:'Огуз', ar:'أوغوز', tr:'Oğuz' }, alt:['Oguz'] },
  { id:'Ordubad', country:'AZ', lat:38.9096, lng:46.0227, utcOffsetMin:240, label:{ az:'Ordubad', en:'Ordubad', ru:'Ордубад', ar:'أوردوباد', tr:'Ordubad' } },
  { id:'Saatli', country:'AZ', lat:39.9321, lng:48.3689, utcOffsetMin:240, label:{ az:'Saatlı', en:'Saatly', ru:'Саатлы', ar:'ساتلي', tr:'Saatlı' }, alt:['Saatli'] },
  { id:'Sabirabad', country:'AZ', lat:40.0087, lng:48.477, utcOffsetMin:240, label:{ az:'Sabirabad', en:'Sabirabad', ru:'Сабирабад', ar:'صابرآباد', tr:'Sabirabad' } },
  { id:'Salyan', country:'AZ', lat:39.5962, lng:48.9848, utcOffsetMin:240, label:{ az:'Salyan', en:'Salyan', ru:'Сальян', ar:'ساليان', tr:'Salyan' }, alt:['Сальяны'] },
  { id:'Samukh', country:'AZ', lat:40.7649, lng:46.4087, utcOffsetMin:240, label:{ az:'Samux', en:'Samukh', ru:'Самух', ar:'ساموخ', tr:'Samuh' }, alt:['Nəbiağalı','Nabiagali'] },
  { id:'Sadarak', country:'AZ', lat:39.7229, lng:44.8485, utcOffsetMin:240, label:{ az:'Sədərək', en:'Sadarak', ru:'Садарак', ar:'سدرك', tr:'Sederek' }, alt:['Heydərabad','Heydarabad'] },
  { id:'Siyazan', country:'AZ', lat:41.0781, lng:49.1156, utcOffsetMin:240, label:{ az:'Siyəzən', en:'Siyazan', ru:'Сиязань', ar:'سيازان', tr:'Siyezen' }, alt:['Сиазань'] },
  { id:'Shabran', country:'AZ', lat:41.2012, lng:48.9871, utcOffsetMin:240, label:{ az:'Şabran', en:'Shabran', ru:'Шабран', ar:'شابران', tr:'Şabran' }, alt:['Dəvəçi','Devechi','Дивичи'] },
  { id:'Shahbuz', country:'AZ', lat:39.4072, lng:45.5739, utcOffsetMin:240, label:{ az:'Şahbuz', en:'Shahbuz', ru:'Шахбуз', ar:'شاهبوز', tr:'Şahbuz' } },
  { id:'Shamakhi', country:'AZ', lat:40.6314, lng:48.6414, utcOffsetMin:240, label:{ az:'Şamaxı', en:'Shamakhi', ru:'Шамахы', ar:'شماخي', tr:'Şamahı' }, alt:['Shamakha','Шемаха'] },
  { id:'Sheki', country:'AZ', lat:41.1919, lng:47.1706, utcOffsetMin:240, label:{ az:'Şəki', en:'Sheki', ru:'Шеки', ar:'شكي', tr:'Şeki' }, alt:['Shaki'] },
  { id:'Shamkir', country:'AZ', lat:40.8298, lng:46.0178, utcOffsetMin:240, label:{ az:'Şəmkir', en:'Shamkir', ru:'Шамкир', ar:'شمكير', tr:'Şemkir' } },
  { id:'Sharur', country:'AZ', lat:39.553, lng:44.9799, utcOffsetMin:240, label:{ az:'Şərur', en:'Sharur', ru:'Шарур', ar:'شرور', tr:'Şerur' } },
  { id:'Shirvan', country:'AZ', lat:39.9378, lng:48.929, utcOffsetMin:240, label:{ az:'Şirvan', en:'Shirvan', ru:'Ширван', ar:'شروان', tr:'Şirvan' }, alt:['Əli Bayramlı','Ali Bayramli'] },
  { id:'Shusha', country:'AZ', lat:39.7601, lng:46.7499, utcOffsetMin:240, label:{ az:'Şuşa', en:'Shusha', ru:'Шуша', ar:'شوشا', tr:'Şuşa' }, alt:['Shushi'] },
  { id:'Tartar', country:'AZ', lat:40.342, lng:46.9316, utcOffsetMin:240, label:{ az:'Tərtər', en:'Tartar', ru:'Тертер', ar:'ترتر', tr:'Terter' }, alt:['Terter'] },
  { id:'Tovuz', country:'AZ', lat:40.9925, lng:45.6284, utcOffsetMin:240, label:{ az:'Tovuz', en:'Tovuz', ru:'Товуз', ar:'توفوز', tr:'Tovuz' }, alt:['Тауз'] },
  { id:'Ujar', country:'AZ', lat:40.519, lng:47.6542, utcOffsetMin:240, label:{ az:'Ucar', en:'Ujar', ru:'Уджар', ar:'أوجار', tr:'Ucar' }, alt:['Udjar','Уджары'] },
  { id:'Yardimli', country:'AZ', lat:38.9077, lng:48.2405, utcOffsetMin:240, label:{ az:'Yardımlı', en:'Yardimli', ru:'Ярдымлы', ar:'يارديملي', tr:'Yardımlı' } },
  { id:'Yevlakh', country:'AZ', lat:40.6183, lng:47.1501, utcOffsetMin:240, label:{ az:'Yevlax', en:'Yevlakh', ru:'Евлах', ar:'يفلاخ', tr:'Yevlah' }, alt:['Yevlax'] },
  { id:'Zagatala', country:'AZ', lat:41.6316, lng:46.6448, utcOffsetMin:240, label:{ az:'Zaqatala', en:'Zagatala', ru:'Загатала', ar:'زاقاتالا', tr:'Zakatala' }, alt:['Zakatala'] },
  { id:'Zangilan', country:'AZ', lat:39.068, lng:46.695, utcOffsetMin:240, label:{ az:'Zəngilan', en:'Zangilan', ru:'Зангилан', ar:'زنكيلان', tr:'Zengilan' }, alt:['Zangelan','Зангелан'] },
  { id:'Zardab', country:'AZ', lat:40.2184, lng:47.7121, utcOffsetMin:240, label:{ az:'Zərdab', en:'Zardab', ru:'Зардаб', ar:'زرداب', tr:'Zerdab' } },
  /* @@AZ_END@@ */
  // ── Dünya (23) ──
  /* @@WORLD_CITIES@@ */
  { id:'Mecca', country:'SA', lat:21.4225, lng:39.8262, utcOffsetMin:180, label:{ az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' }, alt:['Makkah'] },
  { id:'Medina', country:'SA', lat:24.4672, lng:39.6111, utcOffsetMin:180, label:{ az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' }, alt:['Madinah'] },
  { id:'Istanbul', country:'TR', lat:41.0082, lng:28.9784, utcOffsetMin:180, label:{ az:'İstanbul', en:'Istanbul', ru:'Стамбул', ar:'إسطنبول', tr:'İstanbul' } },
  { id:'Ankara', country:'TR', lat:39.9334, lng:32.8597, utcOffsetMin:180, label:{ az:'Ankara', en:'Ankara', ru:'Анкара', ar:'أنقرة', tr:'Ankara' } },
  { id:'Moscow', country:'RU', lat:55.7558, lng:37.6173, utcOffsetMin:180, label:{ az:'Moskva', en:'Moscow', ru:'Москва', ar:'موسكو', tr:'Moskova' } },
  { id:'Saint Petersburg', country:'RU', lat:59.9386, lng:30.3141, utcOffsetMin:180, label:{ az:'Sankt-Peterburq', en:'Saint Petersburg', ru:'Санкт-Петербург', ar:'سانت بطرسبرغ', tr:'Sankt-Peterburg' }, alt:['Petersburg','Peterburq'] }, // lang-ok[Peterburq]: rəsmi az yazılışı
  { id:'Kazan', country:'RU', lat:55.7963, lng:49.1088, utcOffsetMin:180, label:{ az:'Kazan', en:'Kazan', ru:'Казань', ar:'قازان', tr:'Kazan' } },
  { id:'Derbent', country:'RU', lat:42.0662, lng:48.2876, utcOffsetMin:180, label:{ az:'Dərbənd', en:'Derbent', ru:'Дербент', ar:'دربند', tr:'Derbent' } },
  { id:'Tbilisi', country:'GE', lat:41.6914, lng:44.8341, utcOffsetMin:240, label:{ az:'Tbilisi', en:'Tbilisi', ru:'Тбилиси', ar:'تبليسي', tr:'Tiflis' } },
  { id:'Marneuli', country:'GE', lat:41.4876, lng:44.7985, utcOffsetMin:240, label:{ az:'Marneuli', en:'Marneuli', ru:'Марнеули', ar:'مارنيولي', tr:'Marneuli' }, alt:['Borçalı','Borchali'] }, // lang-ok[Marneuli]: gürcü toponimi
  { id:'Tabriz', country:'IR', lat:38.0962, lng:46.2738, utcOffsetMin:210, label:{ az:'Təbriz', en:'Tabriz', ru:'Тебриз', ar:'تبريز', tr:'Tebriz' } },
  { id:'Tehran', country:'IR', lat:35.6944, lng:51.4215, utcOffsetMin:210, label:{ az:'Tehran', en:'Tehran', ru:'Тегеран', ar:'طهران', tr:'Tahran' } },
  { id:'Dubai', country:'AE', lat:25.2048, lng:55.2708, utcOffsetMin:240, label:{ az:'Dubay', en:'Dubai', ru:'Дубай', ar:'دبي', tr:'Dubai' } },
  { id:'Cairo', country:'EG', lat:30.0444, lng:31.2357, utcOffsetMin:120, label:{ az:'Qahirə', en:'Cairo', ru:'Каир', ar:'القاهرة', tr:'Kahire' } },
  { id:'Tashkent', country:'UZ', lat:41.2647, lng:69.2163, utcOffsetMin:300, label:{ az:'Daşkənd', en:'Tashkent', ru:'Ташкент', ar:'طشقند', tr:'Taşkent' } },
  { id:'Almaty', country:'KZ', lat:43.2525, lng:76.9115, utcOffsetMin:300, label:{ az:'Almatı', en:'Almaty', ru:'Алматы', ar:'ألماتي', tr:'Almatı' } },
  { id:'London', country:'GB', lat:51.5074, lng:-0.1278, utcOffsetMin:0, label:{ az:'London', en:'London', ru:'Лондон', ar:'لندن', tr:'Londra' } },
  { id:'Berlin', country:'DE', lat:52.52, lng:13.405, utcOffsetMin:60, label:{ az:'Berlin', en:'Berlin', ru:'Берлин', ar:'برلين', tr:'Berlin' } },
  { id:'Paris', country:'FR', lat:48.8566, lng:2.3522, utcOffsetMin:60, label:{ az:'Paris', en:'Paris', ru:'Париж', ar:'باريس', tr:'Paris' } },
  { id:'New York', country:'US', lat:40.7128, lng:-74.006, utcOffsetMin:-300, label:{ az:'Nyu-York', en:'New York', ru:'Нью-Йорк', ar:'نيويورك', tr:'New York' } },
  { id:'Toronto', country:'CA', lat:43.6532, lng:-79.3832, utcOffsetMin:-300, label:{ az:'Toronto', en:'Toronto', ru:'Торонто', ar:'تورونتو', tr:'Toronto' } },
  { id:'Jakarta', country:'ID', lat:-6.2088, lng:106.8456, utcOffsetMin:420, label:{ az:'Cakarta', en:'Jakarta', ru:'Джакарта', ar:'جاكرتا', tr:'Cakarta' } },
  { id:'Kuala Lumpur', country:'MY', lat:3.139, lng:101.6869, utcOffsetMin:480, label:{ az:'Kuala-Lumpur', en:'Kuala Lumpur', ru:'Куала-Лумпур', ar:'كوالالمبور', tr:'Kuala Lumpur' } },
  /* @@WORLD_END@@ */
]

const CITY_BY_ID = new Map(PRAYER_CITIES.map(c => [c.id, c]))

// Köhnə mobil adları (Namaz/Bildirişlər ekranlarının əvvəlki siyahısı)
const ALIASES = { makkah: 'Mecca', madinah: 'Medina' }

/** Saxlanmış dəyəri şəhər id-sinə çevir (köhnə formatlar da daxil); tanınmırsa null. */
export function normalizeCityId(saved) {
  if (saved == null || saved === '') return null
  const s = String(saved)
  if (CITY_BY_ID.has(s)) return s
  const low = s.toLowerCase()
  if (ALIASES[low]) return ALIASES[low]
  const found = PRAYER_CITIES.find(c => c.id.toLowerCase() === low || Object.values(c.label).some(v => v.toLowerCase() === low))
  return found ? found.id : null
}

// ── Ölkə adları (veb src/utils/prayerLocation.js → COUNTRY_NAMES ilə eyni) ──
export const COUNTRY_NAMES = {
  AZ: { az:'Azərbaycan', en:'Azerbaijan', ru:'Азербайджан', ar:'أذربيجان', tr:'Azerbaycan' },
  TR: { az:'Türkiyə', en:'Türkiye', ru:'Турция', ar:'تركيا', tr:'Türkiye' },
  RU: { az:'Rusiya', en:'Russia', ru:'Россия', ar:'روسيا', tr:'Rusya' },
  GE: { az:'Gürcüstan', en:'Georgia', ru:'Грузия', ar:'جورجيا', tr:'Gürcistan' },
  IR: { az:'İran', en:'Iran', ru:'Иран', ar:'إيران', tr:'İran' },
  SA: { az:'Səudiyyə Ərəbistanı', en:'Saudi Arabia', ru:'Саудовская Аравия', ar:'السعودية', tr:'Suudi Arabistan' },
  AE: { az:'BƏƏ', en:'UAE', ru:'ОАЭ', ar:'الإمارات', tr:'BAE' },
  EG: { az:'Misir', en:'Egypt', ru:'Египет', ar:'مصر', tr:'Mısır' },
  UZ: { az:'Özbəkistan', en:'Uzbekistan', ru:'Узбекистан', ar:'أوزبكستان', tr:'Özbekistan' },
  KZ: { az:'Qazaxıstan', en:'Kazakhstan', ru:'Казахстан', ar:'كازاخستان', tr:'Kazakistan' },
  GB: { az:'Böyük Britaniya', en:'United Kingdom', ru:'Великобритания', ar:'المملكة المتحدة', tr:'Birleşik Krallık' },
  DE: { az:'Almaniya', en:'Germany', ru:'Германия', ar:'ألمانيا', tr:'Almanya' },
  FR: { az:'Fransa', en:'France', ru:'Франция', ar:'فرنسا', tr:'Fransa' },
  US: { az:'ABŞ', en:'USA', ru:'США', ar:'الولايات المتحدة', tr:'ABD' },
  CA: { az:'Kanada', en:'Canada', ru:'Канада', ar:'كندا', tr:'Kanada' },
  ID: { az:'İndoneziya', en:'Indonesia', ru:'Индонезия', ar:'إندونيسيا', tr:'Endonezya' }, // lang-ok[İndoneziya]: rəsmi az adı
  MY: { az:'Malayziya', en:'Malaysia', ru:'Малайзия', ar:'ماليزيا', tr:'Malezya' },
}

// ── Axtarış (diakritikasız, 5 dildə): "seki" → Şəki, "gence" → Gəncə ──
// Hermes-də String.normalize və \p{…} hər cihazda olmaya bilər — əl ilə cədvəl
const FOLD = { 'ə':'e','ı':'i','i̇':'i','ş':'s','ç':'c','ğ':'g','ö':'o','ü':'u','â':'a','î':'i','û':'u','é':'e','ё':'е','й':'и',
  'أ':'ا','إ':'ا','آ':'ا','ٱ':'ا','ة':'ه','ى':'ي' }
export function foldText(v) {
  return String(v || '')
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .toLowerCase()
    .replace(/i̇|[əışçğöüâîûéёйأإآٱةى]/g, ch => FOLD[ch] || ch)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[‐-―'’`ʼ.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const SEARCH_INDEX = PRAYER_CITIES.map(c => ({
  city: c,
  keys: [...new Set([c.id, ...Object.values(c.label), ...(c.alt || [])].map(foldText))],
}))

/** Siyahıda axtarış: əvvəl adın başlanğıcı, sonra sözün başlanğıcı, sonra hər hansı hissə. */
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
  return scored.sort((a, b) => a[0] - b[0]).map(x => x[1])
}

/** id → şəhər obyekti; tanınmırsa null. */
export function cityById(id) {
  const norm = normalizeCityId(id)
  return norm ? CITY_BY_ID.get(norm) : null
}

// Yaddaşdakı vəziyyət (AsyncStorage asinxron olduğu üçün)
let userCityId = null
let adminCityId = null
let loaded = false
let loadPromise = null
const listeners = new Set()

function fromCity(c, isDefault) {
  return {
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    utcOffsetMin: c.utcOffsetMin,
    method: c.method || DEFAULT_METHOD,
    city: c.label,
    isDefault,
  }
}

/**
 * Cari namaz yeri: istifadəçinin seçimi → admin standartı → DEFAULT_PRAYER_LOCATION.
 * Həmişə tam obyekt qaytarır (heç vaxt null deyil).
 */
export function getPrayerLocation() {
  if (userCityId) return fromCity(CITY_BY_ID.get(userCityId), false)
  if (adminCityId) return fromCity(CITY_BY_ID.get(adminCityId), true)
  const d = DEFAULT_PRAYER_LOCATION
  const same = PRAYER_CITIES.find(c => Math.abs(c.lat - d.lat) < 0.05 && Math.abs(c.lng - d.lng) < 0.05)
  if (same) return fromCity(same, true)
  return { id: null, lat: d.lat, lng: d.lng, utcOffsetMin: 240, method: d.method || DEFAULT_METHOD, city: d.city, isDefault: true }
}

/** İstifadəçinin özü seçdiyi şəhərin id-si; seçməyibsə null. */
export function getPrayerCityId() {
  return userCityId
}

/** Keş və müqayisə açarı — yalnız vaxtlara təsir edən sahələr. */
export function locationSig(loc) {
  return `${loc.lat},${loc.lng},${loc.method}`
}

function emit() {
  const loc = getPrayerLocation()
  listeners.forEach(fn => { try { fn(loc) } catch { /* */ } })
}

// Admin paneldəki standart şəhəri real-vaxtda izlə (bir dəfə qoşulur)
let settingsWatched = false
function watchAdminDefault() {
  if (settingsWatched) return
  settingsWatched = true
  try {
    subscribeToSettings(settings => {
      if (settings && settings.defaultCity !== undefined) setAdminDefaultCity(settings.defaultCity)
    })
  } catch { /* Firebase əlçatan deyil — saxlanılmış standart qalır */ }
}

/** Saxlanılmış seçimi bir dəfə oxu; cari yeri qaytarır. */
export function loadPrayerLocation() {
  watchAdminDefault()
  if (loaded) return Promise.resolve(getPrayerLocation())
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const [own, admin] = await Promise.all([
          AsyncStorage.getItem(CITY_KEY),
          AsyncStorage.getItem(ADMIN_DEFAULT_KEY),
        ])
        // Bu arada setPrayerCity çağırılıbsa onu ləğv etmə
        if (!userCityId) userCityId = normalizeCityId(own)
        if (!adminCityId) adminCityId = normalizeCityId(admin)
      } catch { /* yaddaş əlçatan deyil — standart yer qalır */ }
      loaded = true
      emit()
      return getPrayerLocation()
    })()
  }
  return loadPromise
}

/** İstifadəçinin seçimi: id PRAYER_CITIES-dən biri olmalıdır (köhnə adlar da qəbul olunur). */
export async function setPrayerCity(id) {
  const norm = normalizeCityId(id)
  if (!norm) return
  const changed = norm !== userCityId
  userCityId = norm
  if (changed) emit()
  try { await AsyncStorage.setItem(CITY_KEY, norm) } catch { /* yalnız bu açılışda qalır */ }
}

/**
 * Admin paneldəki standart şəhər (Settings → defaultCity). Yalnız istifadəçi
 * özü seçməyibsə təsir edir; növbəti açılışlar üçün yadda saxlanılır.
 */
export async function setAdminDefaultCity(id) {
  const norm = normalizeCityId(id)
  if (norm === adminCityId) return
  adminCityId = norm
  if (!userCityId) emit()
  try {
    if (norm) await AsyncStorage.setItem(ADMIN_DEFAULT_KEY, norm)
    else await AsyncStorage.removeItem(ADMIN_DEFAULT_KEY)
  } catch { /* */ }
}

/** Yer dəyişəndə cb(getPrayerLocation()) çağırılır. */
export function subscribePrayerLocation(cb) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

/** React hook: cari namaz yeri; vaxta təsir etməyən dəyişikliklərdə obyekt eyni qalır. */
export function usePrayerLocation() {
  const [loc, setLoc] = useState(getPrayerLocation)
  useEffect(() => {
    const update = (next) => {
      setLoc(prev => (prev.id === next.id && locationSig(prev) === locationSig(next) && prev.isDefault === next.isDefault ? prev : next))
    }
    const unsub = subscribePrayerLocation(update)
    loadPrayerLocation().then(update)
    return unsub
  }, [])
  return loc
}
