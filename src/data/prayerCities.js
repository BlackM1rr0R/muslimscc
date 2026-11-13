// ═══════════════════════════════════════════════════════
// Namaz vaxtı şəhərləri və ölkə adları — SAF məlumat (heç bir import yoxdur).
// utils/prayerLocation.js bunları yenidən ixrac edir; ayrıca fayldadır ki, Node
// skriptləri (scripts/prerender.mjs → /prayer/<şəhər> səhifələri, build-widget.mjs) də oxuya bilsin.
// ═══════════════════════════════════════════════════════

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
  { id:'Baku', country:'AZ', lat:40.3953, lng:49.8822, tz:'Asia/Baku', label:{ az:'Bakı', en:'Baku', ru:'Баку', ar:'باكو', tr:'Bakü' } },
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
