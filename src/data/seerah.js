// ═══════════════════════════════════════════════════════
// Siyər — Peyğəmbərin ﷺ həyatı (/seerah): yerlər və hadisələr
//
// QAYDALAR (sahibin məzmun siyasəti):
// • Hər hadisənin ən azı bir mənbəyi var (src): Quran ayəsi ("Quran s:a") və/və ya
//   Səhih əl-Buxari / Səhih Muslim nömrəsi ("Buxari N", "Muslim N"). Nömrələr fawazahmed0/hadith-api
//   (eng-bukhari, eng-muslim; Muslim — Əbdülbaqi nömrəsi = arabicnumber) mətni ilə bir-bir
//   yoxlanılıb (2026-11-27). Hədis nömrəsi şübhəlidirsə — yazılmayıb, yalnız ayə.
// • Mətnlər sitat deyil — mənbələrin qısa, ehtiyatlı xülasəsidir. Ayə mətni burada yazılmır:
//   səhifə yalnız istinad verir və Quran oxuyucusuna keçid edir.
// • Mənbədə olmayan, yalnız tarixçilərin (siyər kitablarının) verdiyi məlumat mətndə
//   "tarixçilərə görə" kimi ayrıca deyilir; tarix fərqli rəvayət olunursa — differ: true.
// • Canlı varlığın təsviri yoxdur; Peyğəmbərin adından sonra ﷺ.
// • 5 əsas dil; əlavə dillər ingiliscəyə düşür (bu fayl QƏSDƏN UI lüğətinə düşmür —
//   dini mətn AI ilə tərcümə olunmur, src/utils/uiText.js).
//
// h  — hicri il (mənfi = hicrətdən əvvəl), h2 — aralığın sonu; ce/ce2 — təxmini miladi il.
// approx — tarix təxminidir; differ — alimlər/tarixçilər arasında fərqli rəy var.
// place — xəritədəki yer (SEERAH_PLACES), also — əlavə işıqlanan yerlər.
// hijrah — bu hadisə görünəndə hicrət yolu çəkilir. link — saytın başqa bölməsinə keçid.
// ═══════════════════════════════════════════════════════

// ── Yerlər: real koordinatlar (enlik, uzunluq); approx — dəqiq yeri məlum deyil ──
// area — Məkkə/Mədinə ətrafı (əsas xəritədə bir nöqtə, böyüdülmüş çərçivədə ayrıca).
// edge — xəritədən kənarda qalan yer (kənarda ox ilə göstərilir).
export const SEERAH_PLACES = {
  makkah: { at: [21.4225, 39.8262], area: 'makkah',
    name: { az: 'Məkkə', en: 'Makkah', ru: 'Мекка', ar: 'مكة', tr: 'Mekke' } },
  thawr: { at: [21.3771, 39.8497], area: 'makkah',
    name: { az: 'Sevr mağarası', en: 'Cave of Thawr', ru: 'Пещера Саур', ar: 'غار ثور', tr: 'Sevr Mağarası' } },
  mina: { at: [21.4133, 39.8933], area: 'makkah',
    // lang-ok: yer adıdır (Mina) — dillərdə eyni yazılır
    name: { az: 'Mina', en: 'Mina', ru: 'Мина', ar: 'منى', tr: 'Mina' } },
  arafat: { at: [21.3549, 39.9842], area: 'makkah',
    name: { az: 'Ərəfat', en: 'Arafat', ru: 'Арафат', ar: 'عرفات', tr: 'Arafat' } },
  hudaybiyyah: { at: [21.4395, 39.6055], area: 'makkah',
    name: { az: 'Hüdeybiyyə', en: 'Hudaybiyyah', ru: 'Худайбия', ar: 'الحديبية', tr: 'Hudeybiye' } },
  hunayn: { at: [21.45, 40.07], area: 'makkah', approx: true,
    name: { az: 'Hüneyn', en: 'Hunayn', ru: 'Хунайн', ar: 'حنين', tr: 'Huneyn' } },
  taif: { at: [21.2703, 40.4158],
    name: { az: 'Taif', en: 'Ta’if', ru: 'Таиф', ar: 'الطائف', tr: 'Taif' } },
  madinah: { at: [24.4672, 39.6112], area: 'madinah',
    name: { az: 'Mədinə', en: 'Madinah', ru: 'Медина', ar: 'المدينة', tr: 'Medine' } },
  quba: { at: [24.4393, 39.6173], area: 'madinah',
    // lang-ok: yer adıdır (Quba)
    name: { az: 'Quba', en: 'Quba', ru: 'Куба', ar: 'قباء', tr: 'Kuba' } },
  uhud: { at: [24.5022, 39.6131], area: 'madinah',
    // lang-ok: yer adıdır (Uhud)
    name: { az: 'Uhud', en: 'Uhud', ru: 'Ухуд', ar: 'أحد', tr: 'Uhud' } },
  khandaq: { at: [24.4778, 39.5986], area: 'madinah', approx: true,
    name: { az: 'Xəndək', en: 'The Trench', ru: 'Ров', ar: 'الخندق', tr: 'Hendek' } },
  badr: { at: [23.7795, 38.7905],
    name: { az: 'Bədr', en: 'Badr', ru: 'Бадр', ar: 'بدر', tr: 'Bedir' } },
  khaybar: { at: [25.6958, 39.293],
    name: { az: 'Xeybər', en: 'Khaybar', ru: 'Хайбар', ar: 'خيبر', tr: 'Hayber' } },
  tabuk: { at: [28.3835, 36.5662],
    name: { az: 'Təbük', en: 'Tabuk', ru: 'Табук', ar: 'تبوك', tr: 'Tebük' } },
  habasha: { edge: 'sw',
    name: { az: 'Həbəşistan', en: 'Abyssinia', ru: 'Абиссиния', ar: 'الحبشة', tr: 'Habeşistan' } },
  aqsa: { edge: 'nw',
    name: { az: 'Məscidül-Əqsa', en: 'al-Masjid al-Aqsa', ru: 'Мечеть аль-Акса', ar: 'المسجد الأقصى', tr: 'Mescid-i Aksa' } },
}

// ── Hadisələr (miladi ilə artan sıra) ──
export const SEERAH_EVENTS = [
  { id: 'birth', place: 'makkah', h: -53, ce: 570, approx: true, differ: true, src: ['Muslim 1162'],
    title: { az: 'Peyğəmbərin ﷺ doğulması', en: 'Birth of the Prophet ﷺ', ru: 'Рождение Пророка ﷺ', ar: 'مولد النبي ﷺ', tr: 'Peygamber’in ﷺ doğumu' },
    text: {
      az: 'Muhəmməd ﷺ Məkkədə dünyaya gəldi. Bazar ertəsi doğulduğunu özü xəbər vermişdir. Dəqiq tarix barədə tarixçilər fərqli fikirdədir; çoxu onu Fil ilinə, təxminən 570-ci ilə aid edir.',
      en: 'Muhammad ﷺ was born in Makkah. He himself said that he was born on a Monday. Historians differ on the exact date; most place it in the Year of the Elephant, around 570 CE.',
      ru: 'Мухаммад ﷺ родился в Мекке. Он сам сообщил, что родился в понедельник. Историки расходятся в точной дате; большинство относит её к Году слона — около 570 года.',
      ar: 'وُلد محمد ﷺ في مكة، وأخبر بنفسه أنه وُلد يوم الاثنين. واختلف المؤرخون في تاريخ مولده بالتحديد، وأكثرهم على أنه عام الفيل، نحو سنة 570م.',
      tr: 'Muhammed ﷺ Mekke’de dünyaya geldi. Pazartesi günü doğduğunu kendisi haber vermiştir. Kesin tarih konusunda tarihçiler farklı görüştedir; çoğu onu Fil Yılı’na, yaklaşık 570 yılına yerleştirir.',
    },
    kids: {
      az: 'Peyğəmbərimiz Muhəmməd ﷺ Məkkə şəhərində, bazar ertəsi günü dünyaya gəldi.',
      en: 'The Prophet Muhammad ﷺ was born in the city of Makkah, on a Monday.',
      ru: 'Пророк Мухаммад ﷺ родился в городе Мекке, в понедельник.',
      ar: 'وُلد نبينا محمد ﷺ في مدينة مكة يوم الاثنين.',
      tr: 'Peygamberimiz Muhammed ﷺ Mekke şehrinde, bir pazartesi günü dünyaya geldi.',
    } },

  { id: 'revelation', place: 'makkah', h: -13, ce: 610, approx: true, src: ['Quran 96:1-5', 'Buxari 3', 'Muslim 160', 'Buxari 3902'],
    title: { az: 'İlk vəhy', en: 'The first revelation', ru: 'Первое откровение', ar: 'بدء الوحي', tr: 'İlk vahiy' },
    text: {
      az: 'Təxminən qırx yaşında, Məkkə yaxınlığındakı Hira mağarasında tənhalığa çəkildiyi vaxt ona Ələq surəsinin ilk ayələri (96:1–5) nazil oldu. O, evə qayıdıb Xədicəyə danışdı, Xədicə isə ona təsəlli verib dəstək oldu.',
      en: 'At about forty years of age, while in seclusion in the cave of Hira near Makkah, the first verses of Surah al-‘Alaq (96:1–5) were revealed to him. He returned home and told Khadijah, who comforted and supported him.',
      ru: 'Примерно в сорок лет, когда он уединялся в пещере Хира близ Мекки, ему были ниспосланы первые аяты суры «Аль-Алак» (96:1–5). Он вернулся домой и рассказал Хадидже, которая утешила и поддержала его.',
      ar: 'وفي نحو الأربعين من عمره، وهو يتعبّد في غار حراء قرب مكة، نزلت عليه أوائل سورة العلق (96: 1–5)، فرجع إلى بيته وأخبر خديجة، فطمأنته وآزرته.',
      tr: 'Yaklaşık kırk yaşındayken, Mekke yakınındaki Hira mağarasında inzivaya çekildiği sırada ona Alak suresinin ilk ayetleri (96:1–5) indirildi. Eve dönüp Hatice’ye anlattı; Hatice onu teselli edip destekledi.',
    },
    kids: {
      az: 'Hira mağarasında mələk ona Quranın ilk ayələrini gətirdi. Həyat yoldaşı Xədicə ona təsəlli verdi.',
      en: 'In the cave of Hira, the angel brought him the first verses of the Quran. His wife Khadijah comforted him.',
      ru: 'В пещере Хира ангел принёс ему первые аяты Корана. Его жена Хадиджа утешила его.',
      ar: 'في غار حراء جاءه المَلَك بأول آيات القرآن، وطمأنته زوجته خديجة.',
      tr: 'Hira mağarasında melek ona Kur’an’ın ilk ayetlerini getirdi. Eşi Hatice onu teselli etti.',
    } },

  { id: 'publiccall', place: 'makkah', h: -10, ce: 613, approx: true, src: ['Quran 26:214', 'Quran 15:94', 'Buxari 4770', 'Muslim 208'],
    title: { az: 'Açıq dəvət', en: 'The public call', ru: 'Открытый призыв', ar: 'الجهر بالدعوة', tr: 'Açık davet' },
    text: {
      az: 'Ən yaxın qohumlarını xəbərdar etmək əmri nazil olanda (26:214) Səfa təpəsinə çıxdı, Qüreyş tirələrini bir yerə çağırıb onları xəbərdar etdi. Tarixçilər bunu ilk vəhydən təxminən üç il sonraya aid edirlər.',
      en: 'When the command to warn his nearest kinsfolk was revealed (26:214), he climbed the hill of as-Safa, called the clans of Quraysh together and warned them. Historians place this about three years after the first revelation.',
      ru: 'Когда было ниспослано повеление предостеречь ближайших родственников (26:214), он поднялся на холм ас-Сафа, созвал роды курайшитов и предостерёг их. Историки относят это примерно к третьему году после первого откровения.',
      ar: 'لمّا نزل الأمر بإنذار عشيرته الأقربين (الشعراء 214) صعد الصفا ونادى بطون قريش حتى اجتمعوا فأنذرهم. ويجعل المؤرخون ذلك بعد نحو ثلاث سنين من بدء الوحي.',
      tr: 'En yakın akrabalarını uyarma emri inince (26:214) Safa tepesine çıktı, Kureyş boylarını bir araya çağırıp onları uyardı. Tarihçiler bunu ilk vahiyden yaklaşık üç yıl sonraya tarihlendirir.',
    },
    kids: {
      az: 'Allah ona insanları açıq dəvət etməyi əmr etdi. O, Səfa təpəsinə çıxıb qövmünü çağırdı.',
      en: 'Allah told him to call people openly. He stood on the hill of as-Safa and called his people.',
      ru: 'Аллах повелел ему открыто призывать людей. Он поднялся на холм ас-Сафа и позвал свой народ.',
      ar: 'أمره الله أن يدعو الناس جهرًا، فصعد على الصفا ونادى قومه.',
      tr: 'Allah ona insanları açıkça davet etmesini emretti. Safa tepesine çıkıp kavmini çağırdı.',
    } },

  { id: 'abyssinia', place: 'makkah', also: ['habasha'], h: -8, ce: 615, approx: true, differ: true, src: ['Buxari 5807', 'Buxari 3876'],
    title: { az: 'Həbəşistana hicrət', en: 'Migration to Abyssinia', ru: 'Переселение в Абиссинию', ar: 'الهجرة إلى الحبشة', tr: 'Habeşistan’a hicret' },
    text: {
      az: 'Məkkədə təzyiqlər artanda bəzi müsəlmanlar Qırmızı dənizi keçib Həbəşistana köçdülər və Nəcaşinin ölkəsində sığınacaq tapdılar. Onlardan bəziləri, məsələn, Cəfər ibn Əbu Talib, orada illərlə qaldı.',
      en: 'As persecution in Makkah grew, some Muslims emigrated across the Red Sea to Abyssinia and found refuge in the land of the Negus (an-Najashi). Some of them, such as Ja‘far ibn Abi Talib, stayed there for years.',
      ru: 'Когда гонения в Мекке усилились, часть мусульман переселилась за Красное море в Абиссинию и нашла убежище в стране Негуса (ан-Наджаши). Некоторые из них, например Джафар ибн Абу Талиб, прожили там долгие годы.',
      ar: 'لمّا اشتدّ الأذى بمكة هاجر بعض المسلمين عبر البحر الأحمر إلى الحبشة، فوجدوا الأمان في أرض النجاشي، ومكث بعضهم هناك سنين، كجعفر بن أبي طالب.',
      tr: 'Mekke’de baskılar artınca bazı Müslümanlar Kızıldeniz’i geçip Habeşistan’a göç ettiler ve Necâşî’nin ülkesinde sığınak buldular. Onlardan bazıları, örneğin Ca‘fer b. Ebû Tâlib, orada yıllarca kaldı.',
    },
    kids: {
      az: 'Bəzi müsəlmanlar gəmi ilə Qırmızı dənizi keçib Həbəşistana getdilər və orada əmin-amanlıqda yaşadılar.',
      en: 'Some Muslims sailed across the Red Sea to Abyssinia and lived there in safety.',
      ru: 'Некоторые мусульмане переплыли Красное море, отправились в Абиссинию и жили там в безопасности.',
      ar: 'ركب بعض المسلمين البحر إلى الحبشة، فعاشوا هناك آمنين.',
      tr: 'Bazı Müslümanlar gemiyle Kızıldeniz’i geçip Habeşistan’a gittiler ve orada güven içinde yaşadılar.',
    } },

  { id: 'boycott', place: 'makkah', h: -7, h2: -4, ce: 616, ce2: 619, approx: true, differ: true, src: ['Buxari 1590'],
    title: { az: 'Haşim oğullarına boykot', en: 'The boycott of Banu Hashim', ru: 'Бойкот Бану Хашим', ar: 'مقاطعة بني هاشم', tr: 'Hâşimoğullarına boykot' },
    text: {
      az: 'Qüreyş Haşim və Müttəlib oğullarına qarşı əhd bağladı: Peyğəmbəri ﷺ təhvil verməyənə qədər onlarla nə evlənəcək, nə də alış-veriş edəcəkdilər. Tarixçilərə görə boykot təxminən üç il çəkdi.',
      en: 'Quraysh made a pact against Banu Hashim and Banu al-Muttalib not to marry with them or trade with them until they handed the Prophet ﷺ over. According to historians the boycott lasted about three years.',
      ru: 'Курайшиты заключили договор против Бану Хашим и Бану аль-Мутталиб: не вступать с ними в браки и не торговать, пока те не выдадут Пророка ﷺ. По словам историков, бойкот длился около трёх лет.',
      ar: 'تحالفت قريش على بني هاشم وبني المطلب ألّا يناكحوهم ولا يبايعوهم حتى يُسلموا إليهم النبي ﷺ، ودامت المقاطعة نحو ثلاث سنين على ما يذكره المؤرخون.',
      tr: 'Kureyş, Peygamber’i ﷺ teslim edinceye kadar Hâşimoğulları ve Muttaliboğulları ile evlenmemek ve alışveriş yapmamak üzere ahitleşti. Tarihçilere göre boykot yaklaşık üç yıl sürdü.',
    },
    kids: {
      az: 'Məkkəlilərin bir qismi təzyiq üçün Peyğəmbərin ﷺ ailəsi ilə alış-verişi dayandırmağa razılaşdı.',
      en: 'Some people of Makkah agreed to stop trading with the Prophet’s ﷺ family, to pressure them.',
      ru: 'Часть мекканцев договорилась не торговать с семьёй Пророка ﷺ, чтобы оказать на неё давление.',
      ar: 'اتفق بعض أهل مكة على ترك البيع والشراء مع أسرة النبي ﷺ ليضغطوا عليهم.',
      tr: 'Mekkelilerin bir kısmı baskı kurmak için Peygamber’in ﷺ ailesiyle alışverişi kesmeye karar verdi.',
    } },

  { id: 'sorrow', place: 'makkah', h: -3, ce: 619, approx: true, src: ['Buxari 3883', 'Buxari 3884', 'Quran 28:56', 'Buxari 3896'],
    title: { az: 'Əbu Talib və Xədicənin vəfatı', en: 'Deaths of Abu Talib and Khadijah', ru: 'Кончина Абу Талиба и Хадиджи', ar: 'وفاة أبي طالب وخديجة', tr: 'Ebû Tâlib ile Hatice’nin vefatı' },
    text: {
      az: 'Onu himayə edən əmisi Əbu Talib İslamı qəbul etmədən vəfat etdi; həyat yoldaşı Xədicə isə hicrətdən üç il əvvəl dünyasını dəyişdi. Tarixçilər hər iki itkini eyni ilə aid edirlər.',
      en: 'His uncle Abu Talib, who had protected him, died without accepting Islam, and his wife Khadijah died three years before the Hijrah. Historians place both losses in the same year.',
      ru: 'Его дядя Абу Талиб, защищавший его, умер, не приняв ислам, а жена Хадиджа скончалась за три года до хиджры. Историки относят обе утраты к одному году.',
      ar: 'تُوفي عمه أبو طالب الذي كان يحوطه ويغضب له دون أن يُسلم، وتُوفيت زوجته خديجة قبل الهجرة بثلاث سنين، ويجعل المؤرخون الفقدين في عام واحد.',
      tr: 'Onu koruyan amcası Ebû Tâlib İslam’ı kabul etmeden vefat etti; eşi Hatice ise hicretten üç yıl önce vefat etti. Tarihçiler her iki kaybı aynı yıla yerleştirir.',
    },
    kids: {
      az: 'Onu qoruyan əmisi Əbu Talib və həyat yoldaşı Xədicə vəfat etdilər. Bu, kədərli bir dövr idi.',
      en: 'His uncle Abu Talib, who protected him, and his wife Khadijah passed away. It was a time of sadness.',
      ru: 'Умерли его дядя Абу Талиб, который защищал его, и его жена Хадиджа. Это было время печали.',
      ar: 'تُوفي عمه أبو طالب الذي كان يحميه، وزوجته خديجة، فكان ذلك وقت حزن.',
      tr: 'Onu koruyan amcası Ebû Tâlib ve eşi Hatice vefat ettiler. Bu, hüzünlü bir dönemdi.',
    } },

  { id: 'taif', place: 'taif', h: -3, ce: 619, approx: true, differ: true, src: ['Buxari 3231', 'Muslim 1795'],
    title: { az: 'Taif səfəri', en: 'The journey to Ta’if', ru: 'Поездка в Таиф', ar: 'الخروج إلى الطائف', tr: 'Taif yolculuğu' },
    text: {
      az: 'Taif əhlini dəvət etmək üçün ora getdi, başçıları İbn Əbd Yalilə müraciət etdi, lakin rədd edildi və dərin kədərlə geri döndü. Dağların mələyi onları cəzalandırmağı təklif edəndə razı olmadı və onların nəslindən tək Allaha ibadət edənlərin çıxacağına ümid etdiyini bildirdi.',
      en: 'He went to Ta’if to call its people, presented himself to its leader Ibn ‘Abd Yalil and was rejected, and left in deep sorrow. When the angel of the mountains offered to punish them, he declined, hoping that Allah would bring from their descendants people who worship Him alone.',
      ru: 'Он отправился в Таиф, чтобы призвать его жителей, обратился к их вождю Ибн Абд Ялилю, но был отвергнут и ушёл в глубокой печали. Когда ангел гор предложил наказать их, он отказался, надеясь, что Аллах выведет из их потомков тех, кто будет поклоняться Ему одному.',
      ar: 'خرج إلى الطائف يدعو أهلها، وعرض نفسه على ابن عبد ياليل فلم يُجبه، فانصرف مهمومًا. ولمّا عرض عليه مَلَك الجبال أن يُهلكهم أبى، راجيًا أن يُخرج الله من أصلابهم من يعبد الله وحده.',
      tr: 'Taif halkını davet etmek için oraya gitti, liderleri İbn Abdiyâlîl’e başvurdu, ancak reddedildi ve derin bir üzüntüyle geri döndü. Dağların meleği onları cezalandırmayı teklif edince kabul etmedi ve onların neslinden yalnız Allah’a ibadet edenlerin çıkmasını umduğunu söyledi.',
    },
    kids: {
      az: 'Taifə insanları dəvət etməyə getdi, lakin onu qəbul etmədilər. Yenə də onlara pislik arzulamadı, övladlarının Allaha ibadət edəcəyinə ümid etdi.',
      en: 'He went to Ta’if to invite people, but they turned him away. Still he did not wish them harm; he hoped their children would worship Allah.',
      ru: 'Он пошёл в Таиф звать людей к Аллаху, но они прогнали его. И всё же он не пожелал им зла — он надеялся, что их дети будут поклоняться Аллаху.',
      ar: 'ذهب إلى الطائف يدعو الناس فردّوه، ومع ذلك لم يتمنَّ لهم السوء، بل رجا أن يعبد أبناؤهم الله.',
      tr: 'İnsanları davet etmek için Taif’e gitti, ama onu kabul etmediler. Yine de onlara kötülük dilemedi; çocuklarının Allah’a ibadet edeceğini umdu.',
    } },

  { id: 'isra', place: 'makkah', also: ['aqsa'], h: -1, ce: 621, approx: true, differ: true, src: ['Quran 17:1', 'Buxari 3207', 'Muslim 162'],
    link: 'isra',
    title: { az: 'İsra və Merac', en: 'Al-Isra and al-Mi‘raj', ru: 'Исра и Мирадж', ar: 'الإسراء والمعراج', tr: 'İsrâ ve Mi‘rac' },
    text: {
      az: 'Allah bəndəsini bir gecə Məscidül-Həramdan Məscidül-Əqsaya apardı (17:1), oradan səmalara yüksəldildi; beş vaxt namaz həmin səfərdə fərz edildi. Bu, hicrətdən əvvəl olub; ili və ayı barədə alimlər ixtilaf edir.',
      en: 'Allah took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa (17:1), and from there he was taken up through the heavens; the five daily prayers were made obligatory on that journey. It happened before the Hijrah; scholars differ on its year and month.',
      ru: 'Аллах перенёс Своего раба ночью из Заповедной мечети в мечеть аль-Акса (17:1), а оттуда он был вознесён через небеса; в этом путешествии были предписаны пять ежедневных молитв. Это произошло до хиджры; о годе и месяце учёные расходятся.',
      ar: 'أسرى الله بعبده ليلًا من المسجد الحرام إلى المسجد الأقصى (الإسراء 1)، ثم عُرج به إلى السماوات، وفُرضت في تلك الرحلة الصلوات الخمس. وكان ذلك قبل الهجرة، واختلف العلماء في سنته وشهره.',
      tr: 'Allah kulunu bir gece Mescid-i Haram’dan Mescid-i Aksa’ya götürdü (17:1), oradan göklere yükseltildi; beş vakit namaz bu yolculukta farz kılındı. Hicretten önce gerçekleşti; yılı ve ayı konusunda âlimler ihtilaf etmiştir.',
    },
    kids: {
      az: 'Bir gecədə Allah Peyğəmbəri ﷺ Məkkədən Əqsaya, oradan səmalara apardı. Beş vaxt namaz o zaman fərz edildi.',
      en: 'In one night Allah took the Prophet ﷺ from Makkah to al-Aqsa and up through the heavens. The five daily prayers were made obligatory then.',
      ru: 'За одну ночь Аллах перенёс Пророка ﷺ из Мекки в аль-Аксу, а затем на небеса. Тогда и были предписаны пять ежедневных молитв.',
      ar: 'في ليلة واحدة أسرى الله بالنبي ﷺ من مكة إلى الأقصى ثم إلى السماوات، وفيها فُرضت الصلوات الخمس.',
      tr: 'Bir gecede Allah, Peygamber’i ﷺ Mekke’den Aksa’ya, oradan göklere götürdü. Beş vakit namaz o zaman farz kılındı.',
    } },

  { id: 'aqabah', place: 'mina', h: -2, h2: -1, ce: 621, ce2: 622, approx: true, src: ['Buxari 18', 'Buxari 3892'],
    title: { az: 'Əqəbə beyətləri', en: 'The pledges of al-‘Aqabah', ru: 'Присяги у Акабы', ar: 'بيعتا العقبة', tr: 'Akabe biatları' },
    text: {
      az: 'Həcc mövsümündə Minadakı Əqəbədə Yəsribdən (Mədinədən) gələn möminlər Peyğəmbərə ﷺ beyət etdilər: Allaha heç nəyi şərik qoşmamaq, oğurluq etməmək və başqa öhdəliklər üzərinə. Tarixçilərə görə ertəsi il daha böyük bir dəstə ikinci beyəti verdi və bu, hicrətə yol açdı.',
      en: 'During the pilgrimage season, at al-‘Aqabah in Mina, believers from Yathrib (Madinah) pledged allegiance to the Prophet ﷺ: not to associate anything with Allah, not to steal, and other commitments. According to historians, a larger group gave a second pledge the following year, opening the way to the Hijrah.',
      ru: 'В сезон паломничества у Акабы в Мине верующие из Ясриба (Медины) присягнули Пророку ﷺ: не придавать Аллаху сотоварищей, не воровать и соблюдать другие обязательства. По словам историков, через год большая группа принесла вторую присягу, и это открыло путь к хиджре.',
      ar: 'في موسم الحج بايع مؤمنون من يثرب (المدينة) النبيَّ ﷺ عند العقبة بمنى على ألّا يشركوا بالله شيئًا ولا يسرقوا، وعلى أمور أخرى. ويذكر المؤرخون أن جمعًا أكبر بايعه في العام التالي البيعة الثانية، فكانت تمهيدًا للهجرة.',
      tr: 'Hac mevsiminde Mina’daki Akabe’de Yesrib’den (Medine’den) gelen müminler Peygamber’e ﷺ biat ettiler: Allah’a hiçbir şeyi ortak koşmamak, hırsızlık yapmamak ve diğer yükümlülükler üzerine. Tarihçilere göre ertesi yıl daha büyük bir grup ikinci biatı verdi ve bu, hicretin yolunu açtı.',
    },
    kids: {
      az: 'Mədinədən gələn möminlər Minada Peyğəmbərlə ﷺ görüşüb tək Allaha ibadət edəcəklərinə və pis işlərdən uzaq duracaqlarına söz verdilər.',
      en: 'Believers from Madinah met the Prophet ﷺ at Mina and promised to worship Allah alone and keep away from wrongdoing.',
      ru: 'Верующие из Медины встретились с Пророком ﷺ в Мине и пообещали поклоняться одному Аллаху и сторониться дурных дел.',
      ar: 'التقى مؤمنون من المدينة بالنبي ﷺ في منى، ووعدوه أن يعبدوا الله وحده ويجتنبوا المعاصي.',
      tr: 'Medine’den gelen müminler Mina’da Peygamber ile ﷺ buluşup yalnız Allah’a ibadet edeceklerine ve kötülüklerden uzak duracaklarına söz verdiler.',
    } },

  { id: 'hijrah', place: 'thawr', also: ['makkah', 'quba', 'madinah'], hijrah: true, h: 1, ce: 622, src: ['Quran 9:40', 'Buxari 3905', 'Buxari 3653', 'Muslim 2381'],
    title: { az: 'Hicrət', en: 'The Hijrah', ru: 'Хиджра', ar: 'الهجرة', tr: 'Hicret' },
    text: {
      az: 'Allahın izni ilə Peyğəmbər ﷺ Əbu Bəkrlə birlikdə Məkkədən çıxdı. Onlar üç gecə Sevr mağarasında gizləndilər, sonra tutulmuş bələdçi onları sahil yolu ilə şimala apardı. Mağarada o, yoldaşını Allahın onlarla olduğunu xatırladaraq sakitləşdirdi (9:40).',
      en: 'With Allah’s permission the Prophet ﷺ left Makkah with Abu Bakr. They hid for three nights in the cave of Thawr, then a hired guide led them north along the coastal road. In the cave he reassured his companion that Allah was with them (9:40).',
      ru: 'С дозволения Аллаха Пророк ﷺ покинул Мекку вместе с Абу Бакром. Три ночи они скрывались в пещере Саур, затем нанятый проводник повёл их на север прибрежной дорогой. В пещере он успокоил спутника, напомнив, что Аллах с ними (9:40).',
      ar: 'خرج النبي ﷺ بإذن الله من مكة مع أبي بكر، فاختبآ في غار ثور ثلاث ليال، ثم سلك بهما دليلٌ استأجراه طريق الساحل شمالًا. وفي الغار طمأن صاحبه بأن الله معهما (التوبة 40).',
      tr: 'Allah’ın izniyle Peygamber ﷺ Ebû Bekir ile birlikte Mekke’den çıktı. Üç gece Sevr mağarasında gizlendiler, sonra tutulan rehber onları sahil yoluyla kuzeye götürdü. Mağarada, Allah’ın onlarla olduğunu hatırlatarak arkadaşını teselli etti (9:40).',
    },
    kids: {
      az: 'Peyğəmbər ﷺ dostu Əbu Bəkrlə Məkkədən Mədinəyə yola düşdü. Yolda Allaha təvəkkül edərək bir mağarada gizləndilər.',
      en: 'The Prophet ﷺ and his friend Abu Bakr travelled from Makkah to Madinah. On the way they hid in a cave, trusting in Allah.',
      ru: 'Пророк ﷺ и его друг Абу Бакр отправились из Мекки в Медину. По пути они укрылись в пещере, уповая на Аллаха.',
      ar: 'خرج النبي ﷺ وصاحبه أبو بكر من مكة إلى المدينة، واختبآ في الطريق في غار متوكلين على الله.',
      tr: 'Peygamber ﷺ ve arkadaşı Ebû Bekir Mekke’den Medine’ye yola çıktı. Yolda Allah’a güvenerek bir mağarada saklandılar.',
    } },

  { id: 'quba', place: 'quba', h: 1, ce: 622, src: ['Buxari 3906', 'Buxari 428'],
    title: { az: 'Quba məscidi', en: 'The mosque of Quba', ru: 'Мечеть Куба', ar: 'مسجد قباء', tr: 'Kuba Mescidi' },
    text: {
      az: 'Rəbiül-əvvəl ayında Mədinənin kənarındakı Qubaya, Bəni Amr ibn Avf məhəlləsinə çatdılar. Peyğəmbər ﷺ orada on neçə gecə qaldı və Quba məscidinin əsasını qoydu.',
      en: 'In Rabi‘ al-Awwal they reached Quba, the quarter of Banu ‘Amr ibn ‘Awf on the edge of Madinah. The Prophet ﷺ stayed there some ten-odd nights and founded the mosque of Quba.',
      ru: 'В месяце раби‘ аль-авваль они достигли Кубы — квартала Бану Амр ибн Ауф на окраине Медины. Пророк ﷺ провёл там более десяти ночей и заложил мечеть Куба.',
      ar: 'وفي شهر ربيع الأول بلغوا قباء في بني عمرو بن عوف على طرف المدينة، فلبث فيهم النبي ﷺ بضع عشرة ليلة، وأسّس مسجد قباء.',
      tr: 'Rebîülevvel ayında Medine’nin kenarındaki Kuba’ya, Amr b. Avf oğullarının mahallesine ulaştılar. Peygamber ﷺ orada on küsur gece kaldı ve Kuba Mescidi’nin temelini attı.',
    },
    kids: {
      az: 'Mədinə yaxınlığındakı Qubada Peyğəmbər ﷺ dincəldi və bir məscid tikdi.',
      en: 'At Quba, near Madinah, the Prophet ﷺ rested and built a mosque.',
      ru: 'В Кубе, недалеко от Медины, Пророк ﷺ отдохнул и построил мечеть.',
      ar: 'في قباء قرب المدينة استراح النبي ﷺ وبنى مسجدًا.',
      tr: 'Medine yakınındaki Kuba’da Peygamber ﷺ dinlendi ve bir mescid yaptı.',
    } },

  { id: 'mosque', place: 'madinah', h: 1, ce: 622, src: ['Buxari 3906', 'Buxari 428'],
    title: { az: 'Peyğəmbər məscidinin tikilməsi', en: 'Building the Prophet’s Mosque', ru: 'Строительство мечети Пророка', ar: 'بناء المسجد النبوي', tr: 'Mescid-i Nebevî’nin inşası' },
    text: {
      az: 'Mədinədə dəvəsi iki yetimə məxsus xurma qurutma yerində çökdü. Peyğəmbər ﷺ həmin yeri satın aldı və səhabələrlə birlikdə məscidi tikdi, kərpicləri özü də daşıdı.',
      en: 'In Madinah his camel knelt at a date-drying yard belonging to two orphans. The Prophet ﷺ bought the land and built the mosque with his companions, carrying mud bricks himself.',
      ru: 'В Медине его верблюдица опустилась на месте, где два сироты сушили финики. Пророк ﷺ купил этот участок и вместе со сподвижниками построил мечеть, сам нося сырцовые кирпичи.',
      ar: 'بركت ناقته في المدينة عند مِربد لغلامين يتيمين، فابتاعه النبي ﷺ وبناه مسجدًا مع أصحابه، وكان ينقل اللَّبِن بنفسه.',
      tr: 'Medine’de devesi iki yetime ait hurma kurutma yerine çöktü. Peygamber ﷺ orayı satın aldı ve sahabelerle birlikte mescidi inşa etti; kerpiçleri kendisi de taşıdı.',
    },
    kids: {
      az: 'Mədinədə Peyğəmbər ﷺ və səhabələri birlikdə məscid tikdilər. O, özü də kərpic daşıyırdı.',
      en: 'In Madinah the Prophet ﷺ and his companions built a mosque together. He carried bricks too.',
      ru: 'В Медине Пророк ﷺ и его сподвижники вместе построили мечеть. Он тоже носил кирпичи.',
      ar: 'في المدينة بنى النبي ﷺ وأصحابه المسجد معًا، وكان يحمل اللَّبِن معهم.',
      tr: 'Medine’de Peygamber ﷺ ve sahabeler birlikte bir mescid yaptılar. O da kerpiç taşıdı.',
    } },

  { id: 'brotherhood', place: 'madinah', h: 1, ce: 622, approx: true, src: ['Buxari 2048', 'Buxari 2049'],
    title: { az: 'Mühacir və ənsar qardaşlığı', en: 'Brotherhood of the Muhajirun and the Ansar', ru: 'Братство мухаджиров и ансаров', ar: 'المؤاخاة بين المهاجرين والأنصار', tr: 'Muhacir ve Ensar kardeşliği' },
    text: {
      az: 'Peyğəmbər ﷺ Məkkədən gələn mühacirlərlə Mədinənin ənsarı arasında qardaşlıq bağladı; məsələn, Əbdürrəhman ibn Avf Səd ibn Rəbi ilə qardaş edildi.',
      en: 'The Prophet ﷺ joined the emigrants from Makkah and the Ansar of Madinah in bonds of brotherhood; for example, ‘Abd al-Rahman ibn ‘Awf was made the brother of Sa‘d ibn al-Rabi‘.',
      ru: 'Пророк ﷺ побратал переселенцев из Мекки с ансарами Медины; например, Абдуррахман ибн Ауф стал братом Сада ибн ар-Раби.',
      ar: 'آخى النبي ﷺ بين المهاجرين من مكة والأنصار من أهل المدينة، فآخى مثلًا بين عبد الرحمن بن عوف وسعد بن الربيع.',
      tr: 'Peygamber ﷺ Mekke’den gelen muhacirlerle Medine’nin ensarı arasında kardeşlik kurdu; örneğin Abdurrahman b. Avf, Sa‘d b. Rebî ile kardeş yapıldı.',
    },
    kids: {
      az: 'Mədinə əhli Məkkədən gələnləri qardaş kimi qarşıladı və varlarını onlarla bölüşdü.',
      en: 'The people of Madinah welcomed those who came from Makkah like brothers and shared with them.',
      ru: 'Жители Медины встретили пришедших из Мекки как братьев и делились с ними.',
      ar: 'استقبل أهل المدينة القادمين من مكة كالإخوة، وشاركوهم ما عندهم.',
      tr: 'Medineliler Mekke’den gelenleri kardeş gibi karşıladı ve sahip olduklarını onlarla paylaştı.',
    } },

  { id: 'qibla', place: 'madinah', h: 2, ce: 624, approx: true, src: ['Quran 2:144', 'Buxari 40', 'Buxari 4486', 'Muslim 525'],
    title: { az: 'Qiblənin dəyişməsi', en: 'Change of the qibla', ru: 'Смена киблы', ar: 'تحويل القبلة', tr: 'Kıblenin değişmesi' },
    text: {
      az: 'Mədinədə on altı-on yeddi ay müsəlmanlar Beytül-Müqəddəsə üz tutub namaz qıldılar. Sonra 2:144 ayəsi nazil oldu və qiblə Məkkədəki Kəbəyə çevrildi.',
      en: 'For sixteen or seventeen months in Madinah the Muslims prayed towards Bayt al-Maqdis. Then 2:144 was revealed and the qibla was turned to the Ka‘bah in Makkah.',
      ru: 'Шестнадцать или семнадцать месяцев в Медине мусульмане молились в сторону Байт аль-Макдис. Затем был ниспослан аят 2:144, и кибла была обращена к Каабе в Мекке.',
      ar: 'صلّى المسلمون في المدينة ستة عشر أو سبعة عشر شهرًا نحو بيت المقدس، ثم نزلت الآية (البقرة 144) فحُوّلت القبلة إلى الكعبة بمكة.',
      tr: 'Medine’de on altı ya da on yedi ay boyunca Müslümanlar Beytülmakdis’e yönelerek namaz kıldılar. Sonra 2:144 ayeti indi ve kıble Mekke’deki Kâbe’ye çevrildi.',
    },
    kids: {
      az: 'Əvvəlcə müsəlmanlar Qüdsə üz tutub namaz qılırdılar. Sonra Allah onlara Məkkədəki Kəbəyə üz tutmağı əmr etdi.',
      en: 'At first Muslims prayed facing Jerusalem. Then Allah told them to face the Ka‘bah in Makkah.',
      ru: 'Сначала мусульмане молились лицом к Иерусалиму. Затем Аллах повелел им обращаться к Каабе в Мекке.',
      ar: 'كان المسلمون يصلّون أولًا نحو بيت المقدس، ثم أمرهم الله أن يتوجّهوا إلى الكعبة في مكة.',
      tr: 'Önceleri Müslümanlar Kudüs’e yönelerek namaz kılıyordu. Sonra Allah onlara Mekke’deki Kâbe’ye yönelmelerini emretti.',
    } },

  { id: 'badr', place: 'badr', h: 2, ce: 624, src: ['Quran 3:123', 'Quran 8:41-44', 'Muslim 1763', 'Buxari 3957'],
    title: { az: 'Bədr döyüşü', en: 'The Battle of Badr', ru: 'Битва при Бадре', ar: 'غزوة بدر', tr: 'Bedir Savaşı' },
    text: {
      az: 'Hicrətin ikinci ilində (tarixçilərə görə Ramazan ayında) Bədr quyuları yanında üç yüzdən bir qədər çox müsəlman təxminən min nəfərlik Qüreyş qoşunu ilə qarşılaşdı və Allah onlara qələbə verdi (3:123). Quran bu günü Furqan günü adlandırır (8:41).',
      en: 'In the second year after the Hijrah (in Ramadan, according to historians), a little over three hundred Muslims met a Quraysh army of about a thousand at the wells of Badr, and Allah gave them victory (3:123). The Quran calls it the Day of the Criterion (8:41).',
      ru: 'На второй год после хиджры (по словам историков, в рамадан) у колодцев Бадра немногим более трёхсот мусульман встретились с курайшитским войском около тысячи человек, и Аллах даровал им победу (3:123). Коран называет этот день Днём различения (8:41).',
      ar: 'في السنة الثانية من الهجرة (في رمضان على ما يذكره المؤرخون) التقى عند ماء بدر ثلاثمئة وبضعة عشر من المسلمين بجيش قريش وهم نحو ألف، فنصرهم الله (آل عمران 123)، وسمّى القرآن ذلك اليوم يوم الفرقان (الأنفال 41).',
      tr: 'Hicretin ikinci yılında (tarihçilere göre Ramazan ayında) Bedir kuyuları yanında üç yüzü biraz aşkın Müslüman, yaklaşık bin kişilik Kureyş ordusuyla karşılaştı ve Allah onlara zafer verdi (3:123). Kur’an bu günü Furkan günü olarak adlandırır (8:41).',
    },
    kids: {
      az: 'Bədrdə kiçik bir mömin dəstəsi özündən qat-qat böyük qoşunla qarşılaşdı və Allah onlara kömək etdi.',
      en: 'At Badr a small group of believers faced a much bigger army, and Allah helped them.',
      ru: 'При Бадре небольшой отряд верующих встретился с гораздо большим войском, и Аллах помог им.',
      ar: 'في بدر واجهت فئة قليلة من المؤمنين جيشًا أكبر منها بكثير، فنصرهم الله.',
      tr: 'Bedir’de küçük bir mümin topluluğu kendinden çok daha büyük bir orduyla karşılaştı ve Allah onlara yardım etti.',
    } },

  { id: 'uhud', place: 'uhud', h: 3, ce: 625, src: ['Quran 3:121-122', 'Quran 3:152-155', 'Buxari 3039'],
    title: { az: 'Uhud döyüşü', en: 'The Battle of Uhud', ru: 'Битва при Ухуде', ar: 'غزوة أحد', tr: 'Uhud Savaşı' },
    text: {
      az: 'Qüreyş Mədinə üzərinə yürüdü və döyüş Uhud dağının ətəyində baş verdi. Peyğəmbər ﷺ oxatanlara yerlərini tərk etməməyi əmr etmişdi; onların bir qismi yerini tərk edəndə müsəlmanlar ağır itki verdilər.',
      en: 'Quraysh marched on Madinah and the battle took place at the foot of Mount Uhud. The Prophet ﷺ had ordered the archers not to leave their post; when some of them left it, the Muslims suffered heavy losses.',
      ru: 'Курайшиты выступили на Медину, и битва произошла у подножия горы Ухуд. Пророк ﷺ велел лучникам не покидать позицию; когда часть из них ушла, мусульмане понесли тяжёлые потери.',
      ar: 'سارت قريش إلى المدينة، فكانت المعركة عند سفح جبل أحد. وكان النبي ﷺ قد أمر الرماة ألّا يبرحوا مكانهم، فلمّا ترك بعضهم موضعه أصاب المسلمين قرحٌ شديد.',
      tr: 'Kureyş Medine üzerine yürüdü ve savaş Uhud dağının eteğinde gerçekleşti. Peygamber ﷺ okçulara yerlerini terk etmemelerini emretmişti; bir kısmı yerini bırakınca Müslümanlar ağır kayıplar verdi.',
    },
    kids: {
      az: 'Uhudda Peyğəmbər ﷺ oxatanlara yerlərində qalmağı tapşırdı. Bəziləri yerini tərk edəndə müsəlmanlar çətin gün yaşadılar — bu, ona itaət dərsi oldu.',
      en: 'At Uhud the Prophet ﷺ told the archers to stay in place. When some left, the Muslims had a hard day — a lesson in obeying him.',
      ru: 'При Ухуде Пророк ﷺ велел лучникам оставаться на месте. Когда некоторые ушли, мусульманам пришлось тяжело — это стало уроком послушания ему.',
      ar: 'في أحد أمر النبي ﷺ الرماة أن يثبتوا في أماكنهم، فلمّا تركها بعضهم مرّ المسلمون بيوم عصيب، فكان درسًا في طاعته.',
      tr: 'Uhud’da Peygamber ﷺ okçulara yerlerinde kalmalarını söyledi. Bazıları yerini bırakınca Müslümanlar zor bir gün yaşadı — bu, ona itaat konusunda bir ders oldu.',
    } },

  { id: 'khandaq', place: 'khandaq', h: 5, ce: 627, differ: true, src: ['Quran 33:9-27', 'Buxari 2834', 'Buxari 4101'],
    title: { az: 'Xəndək (Əhzab) döyüşü', en: 'The Battle of the Trench (al-Ahzab)', ru: 'Битва у рва (аль-Ахзаб)', ar: 'غزوة الخندق (الأحزاب)', tr: 'Hendek (Ahzâb) Savaşı' },
    text: {
      az: 'Müttəfiq qəbilələr (Əhzab) Mədinəni mühasirəyə alanda müsəlmanlar şəhərin açıq tərəfində xəndək qazdılar; Peyğəmbər ﷺ soyuqda onlarla birlikdə qazırdı. Allah mühasirəni küləklə və onların görmədiyi qoşunlarla dağıtdı (33:9). Çoxu bunu hicri 5-ci ilə, bəzi tarixçilər 4-cü ilə aid edir.',
      en: 'When the allied tribes (al-Ahzab) besieged Madinah, the Muslims dug a trench on its open side; the Prophet ﷺ dug with them in the cold. Allah broke the siege with a wind and with forces they did not see (33:9). Most date it to AH 5; some historians say AH 4.',
      ru: 'Когда союз племён (аль-Ахзаб) осадил Медину, мусульмане вырыли ров с её открытой стороны; Пророк ﷺ копал вместе с ними в холод. Аллах снял осаду ветром и воинством, которого они не видели (33:9). Большинство относит это к 5 году хиджры, некоторые историки — к 4-му.',
      ar: 'لمّا حاصرت الأحزاب المدينة حفر المسلمون خندقًا في جهتها المكشوفة، وكان النبي ﷺ يحفر معهم في البرد، ففرّق الله الأحزاب بريح وجنود لم يروها (الأحزاب 9). وأكثرهم على أنها في السنة الخامسة، وقال بعض أهل المغازي في الرابعة.',
      tr: 'Müttefik kabileler (Ahzâb) Medine’yi kuşatınca Müslümanlar şehrin açık tarafına hendek kazdılar; Peygamber ﷺ soğukta onlarla birlikte kazdı. Allah kuşatmayı bir rüzgârla ve onların görmediği ordularla dağıttı (33:9). Çoğu bunu hicri 5. yıla, bazı tarihçiler 4. yıla tarihlendirir.',
    },
    kids: {
      az: 'Mədinəni qorumaq üçün müsəlmanlar uzun bir xəndək qazdılar. Hava soyuq olsa da, Peyğəmbər ﷺ onlarla birlikdə qazırdı.',
      en: 'To protect Madinah, the Muslims dug a long trench. The Prophet ﷺ dug with them, even though it was cold.',
      ru: 'Чтобы защитить Медину, мусульмане вырыли длинный ров. Пророк ﷺ копал вместе с ними, хотя было холодно.',
      ar: 'حفر المسلمون خندقًا طويلًا ليحموا المدينة، وكان النبي ﷺ يحفر معهم رغم البرد.',
      tr: 'Medine’yi korumak için Müslümanlar uzun bir hendek kazdılar. Hava soğuk olsa da Peygamber ﷺ onlarla birlikte kazdı.',
    } },

  { id: 'hudaybiyyah', place: 'hudaybiyyah', h: 6, ce: 628, src: ['Quran 48:18', 'Quran 48:1', 'Buxari 2731', 'Buxari 4150', 'Buxari 4154'],
    title: { az: 'Hüdeybiyyə sülhü', en: 'The Treaty of Hudaybiyyah', ru: 'Худайбийский мир', ar: 'صلح الحديبية', tr: 'Hudeybiye Barışı' },
    text: {
      az: 'Peyğəmbər ﷺ təxminən 1400 səhabə ilə ümrəyə yola düşdü, lakin Qüreyş onları Məkkəyə buraxmadı. Səhabələr ağacın altında beyət etdilər (48:18), sonra Qüreyşlə sülh bağlandı. Səhabə Bəra ibn Azib 48:1-də deyilən fəthin məhz bu beyət olduğunu söyləmişdir.',
      en: 'The Prophet ﷺ set out for ‘umrah with about 1,400 companions, but Quraysh barred them from Makkah. The companions gave the pledge under the tree (48:18), and a truce was then concluded with Quraysh. The companion al-Bara’ ibn ‘Azib said that the victory mentioned in 48:1 was this pledge.',
      ru: 'Пророк ﷺ отправился совершить умру примерно с 1400 сподвижниками, но курайшиты не пустили их в Мекку. Сподвижники принесли присягу под деревом (48:18), а затем с курайшитами было заключено перемирие. Сподвижник аль-Бара ибн Азиб говорил, что победа, упомянутая в аяте 48:1, — это и есть та присяга.',
      ar: 'خرج النبي ﷺ معتمرًا في نحو ألف وأربعمئة من أصحابه، فصدّتهم قريش عن مكة، فبايعه أصحابه تحت الشجرة (الفتح 18)، ثم عُقد الصلح مع قريش. وكان البراء بن عازب يعدّ بيعة الرضوان هي الفتح المذكور في (الفتح 1).',
      tr: 'Peygamber ﷺ yaklaşık 1400 sahabeyle umreye çıktı, ancak Kureyş onları Mekke’ye sokmadı. Sahabeler ağacın altında biat ettiler (48:18), ardından Kureyş ile barış yapıldı. Sahabi Berâ b. Âzib, 48:1’de bahsedilen fethin bu biat olduğunu söylemiştir.',
    },
    kids: {
      az: 'Peyğəmbər ﷺ Kəbəni ziyarət etmək istədi, lakin buraxılmadı. O, sülhü seçdi və razılaşma bağladı.',
      en: 'The Prophet ﷺ wanted to visit the Ka‘bah but was stopped. He chose peace and made an agreement.',
      ru: 'Пророк ﷺ хотел посетить Каабу, но его не пустили. Он выбрал мир и заключил соглашение.',
      ar: 'أراد النبي ﷺ زيارة الكعبة فمُنع، فاختار الصلح وعقد اتفاقًا.',
      tr: 'Peygamber ﷺ Kâbe’yi ziyaret etmek istedi ama izin verilmedi. Barışı seçti ve bir anlaşma yaptı.',
    } },

  { id: 'letters', place: 'madinah', h: 6, h2: 7, ce: 628, approx: true, src: ['Buxari 7'],
    link: 'letters',
    title: { az: 'Hökmdarlara məktublar', en: 'Letters to the rulers', ru: 'Письма правителям', ar: 'الكتب إلى الملوك', tr: 'Hükümdarlara mektuplar' },
    text: {
      az: 'Qüreyşlə sülh dövründə Peyğəmbər ﷺ hökmdarlara İslama dəvət məktubları göndərdi. Bizans imperatoru Herakla yazdığı məktubun əhvalatını Buxari ətraflı rəvayət edir.',
      en: 'During the truce with Quraysh the Prophet ﷺ sent letters inviting rulers to Islam. The story of his letter to the Byzantine emperor Heraclius is narrated in detail by al-Bukhari.',
      ru: 'В период перемирия с курайшитами Пророк ﷺ отправлял правителям письма с призывом к исламу. История его письма византийскому императору Ираклию подробно передана у аль-Бухари.',
      ar: 'في مدة الهدنة مع قريش كتب النبي ﷺ إلى الملوك يدعوهم إلى الإسلام، وقد روى البخاري قصة كتابه إلى هرقل عظيم الروم مفصّلة.',
      tr: 'Kureyş ile barış döneminde Peygamber ﷺ hükümdarlara İslam’a davet mektupları gönderdi. Bizans imparatoru Herakleios’a yazdığı mektubun hikâyesini Buhârî ayrıntılı olarak rivayet eder.',
    },
    kids: {
      az: 'Peyğəmbər ﷺ padşahlara məktublar göndərib onları İslama dəvət etdi.',
      en: 'The Prophet ﷺ sent letters to kings, inviting them to Islam.',
      ru: 'Пророк ﷺ отправил царям письма и пригласил их в ислам.',
      ar: 'أرسل النبي ﷺ رسائل إلى الملوك يدعوهم فيها إلى الإسلام.',
      tr: 'Peygamber ﷺ krallara mektuplar gönderip onları İslam’a davet etti.',
    } },

  { id: 'khaybar', place: 'khaybar', h: 7, ce: 628, src: ['Buxari 4197', 'Buxari 4210', 'Muslim 2406'],
    title: { az: 'Xeybərin fəthi', en: 'The conquest of Khaybar', ru: 'Взятие Хайбара', ar: 'فتح خيبر', tr: 'Hayber’in fethi' },
    text: {
      az: 'Mədinənin şimalındakı Xeybər qalaları mühasirəyə alınıb fəth edildi. Peyğəmbər ﷺ bayrağı Allahı və Rəsulunu sevən, onların da sevdiyi bir kişiyə verəcəyini bildirdi; onu Əliyə verib əvvəlcə onları İslama dəvət etməyi tapşırdı.',
      en: 'The forts of Khaybar, north of Madinah, were besieged and taken. The Prophet ﷺ said he would give the banner to a man who loves Allah and His Messenger and is loved by them; he gave it to ‘Ali and told him to call them to Islam first.',
      ru: 'Крепости Хайбара к северу от Медины были осаждены и взяты. Пророк ﷺ сказал, что вручит знамя человеку, который любит Аллаха и Его Посланника и любим ими; он вручил его Али и велел сначала призвать их к исламу.',
      ar: 'حوصرت حصون خيبر شمال المدينة وفُتحت، وأخبر النبي ﷺ أنه سيعطي الراية رجلًا يحب الله ورسوله ويحبه الله ورسوله، فأعطاها عليًّا، وأمره أن يدعوهم إلى الإسلام أولًا.',
      tr: 'Medine’nin kuzeyindeki Hayber kaleleri kuşatılıp fethedildi. Peygamber ﷺ sancağı Allah’ı ve Resûlü’nü seven ve onların da sevdiği bir adama vereceğini söyledi; onu Ali’ye verip önce onları İslam’a davet etmesini emretti.',
    },
    kids: {
      az: 'Xeybərdə Peyğəmbər ﷺ bayrağı Əliyə verdi və ona əvvəlcə insanları İslama dəvət etməyi tapşırdı.',
      en: 'At Khaybar the Prophet ﷺ gave the banner to ‘Ali and told him to invite people to Islam first.',
      ru: 'При Хайбаре Пророк ﷺ вручил знамя Али и велел ему сначала призвать людей к исламу.',
      ar: 'في خيبر أعطى النبي ﷺ الراية لعليّ، وأمره أن يدعو الناس إلى الإسلام أولًا.',
      tr: 'Hayber’de Peygamber ﷺ sancağı Ali’ye verdi ve ona önce insanları İslam’a davet etmesini söyledi.',
    } },

  { id: 'umrah', place: 'makkah', h: 7, ce: 629, src: ['Buxari 4252', 'Buxari 4251'],
    title: { az: 'Qəza ümrəsi', en: 'The ‘Umrah of al-Qada’', ru: 'Умра аль-Када', ar: 'عمرة القضاء', tr: 'Kaza umresi' },
    text: {
      az: 'Hüdeybiyyə sülhünün şərtinə uyğun olaraq Peyğəmbər ﷺ ertəsi il səhabələrlə Məkkəyə gəlib ümrə etdi və orada üç gün qaldı.',
      en: 'In accordance with the Hudaybiyyah treaty, the Prophet ﷺ came to Makkah the following year with his companions, performed ‘umrah and stayed there three days.',
      ru: 'Согласно условиям Худайбийского мира, через год Пророк ﷺ пришёл со сподвижниками в Мекку, совершил умру и пробыл там три дня.',
      ar: 'ووفقًا لشرط صلح الحديبية جاء النبي ﷺ مكة في العام التالي مع أصحابه، فاعتمر وأقام بها ثلاثة أيام.',
      tr: 'Hudeybiye Barışı’nın şartına uygun olarak Peygamber ﷺ ertesi yıl sahabelerle Mekke’ye gelip umre yaptı ve orada üç gün kaldı.',
    },
    kids: {
      az: 'Bir il sonra, razılaşmaya uyğun olaraq, Peyğəmbər ﷺ və səhabələri Kəbəni ziyarət edib ümrə etdilər.',
      en: 'A year later, as agreed, the Prophet ﷺ and his companions visited the Ka‘bah and performed ‘umrah.',
      ru: 'Через год, как и было условлено, Пророк ﷺ и его сподвижники посетили Каабу и совершили умру.',
      ar: 'بعد عام، كما اتُّفق، زار النبي ﷺ وأصحابه الكعبة واعتمروا.',
      tr: 'Bir yıl sonra, anlaşıldığı gibi, Peygamber ﷺ ve sahabeler Kâbe’yi ziyaret edip umre yaptılar.',
    } },

  { id: 'conquest', place: 'makkah', h: 8, ce: 630, src: ['Buxari 4276', 'Buxari 4287', 'Quran 17:81'],
    title: { az: 'Məkkənin fəthi', en: 'The conquest of Makkah', ru: 'Завоевание Мекки', ar: 'فتح مكة', tr: 'Mekke’nin fethi' },
    text: {
      az: 'Hicrətdən səkkiz il yarım sonra, Ramazan ayında Peyğəmbər ﷺ on min nəfərlə yola çıxdı və Məkkəyə daxil oldu. Kəbənin ətrafındakı bütləri əlindəki çubuqla yıxarkən 17:81 ayəsini oxuyurdu.',
      en: 'In Ramadan, eight and a half years after the Hijrah, the Prophet ﷺ set out with ten thousand men and entered Makkah. He struck down the idols around the Ka‘bah with a stick in his hand while reciting 17:81.',
      ru: 'В рамадан, через восемь с половиной лет после хиджры, Пророк ﷺ выступил с десятью тысячами человек и вошёл в Мекку. Он сбивал идолов вокруг Каабы палкой, которую держал в руке, читая аят 17:81.',
      ar: 'في رمضان، بعد ثماني سنين ونصف من الهجرة، خرج النبي ﷺ في عشرة آلاف فدخل مكة، وجعل يطعن الأصنام حول الكعبة بعودٍ في يده وهو يتلو (الإسراء 81).',
      tr: 'Hicretten sekiz buçuk yıl sonra, Ramazan ayında Peygamber ﷺ on bin kişiyle yola çıktı ve Mekke’ye girdi. Kâbe’nin etrafındaki putları elindeki değnekle devirirken 17:81 ayetini okuyordu.',
    },
    kids: {
      az: 'Peyğəmbər ﷺ vaxtilə tərk etdiyi Məkkəyə qayıtdı. Kəbə bütlərdən təmizləndi.',
      en: 'The Prophet ﷺ returned to Makkah, the city he had left. The Ka‘bah was cleansed of idols.',
      ru: 'Пророк ﷺ вернулся в Мекку, которую когда-то покинул. Кааба была очищена от идолов.',
      ar: 'عاد النبي ﷺ إلى مكة التي خرج منها، وطُهّرت الكعبة من الأصنام.',
      tr: 'Peygamber ﷺ bir zamanlar ayrıldığı Mekke’ye döndü. Kâbe putlardan temizlendi.',
    } },

  { id: 'hunayn', place: 'hunayn', h: 8, ce: 630, src: ['Quran 9:25-26', 'Buxari 2864', 'Buxari 4315', 'Muslim 1776'],
    title: { az: 'Hüneyn döyüşü', en: 'The Battle of Hunayn', ru: 'Битва при Хунайне', ar: 'غزوة حنين', tr: 'Huneyn Savaşı' },
    text: {
      az: 'Məkkənin fəthindən az sonra müsəlmanlar Hüneyn vadisində Həvazin qəbiləsi ilə qarşılaşdılar. Çoxluqları onları sevindirsə də, əvvəlcə çoxu geri çəkildi; Peyğəmbər ﷺ yerində möhkəm durdu və sonra qələbə gəldi (9:25–26).',
      en: 'Shortly after the conquest of Makkah, the Muslims met the Hawazin in the valley of Hunayn. Though their great numbers pleased them, many fell back at first; the Prophet ﷺ stood firm, and then victory came (9:25–26).',
      ru: 'Вскоре после взятия Мекки мусульмане встретились с племенем хавазин в долине Хунайн. Хотя их многочисленность радовала их, поначалу многие отступили; Пророк ﷺ стоял твёрдо, а затем пришла победа (9:25–26).',
      ar: 'بعد فتح مكة بقليل لقي المسلمون هوازن في وادي حنين، فأعجبتهم كثرتهم، وولّى كثير منهم أول الأمر، وثبت النبي ﷺ، ثم جاء النصر (التوبة 25–26).',
      tr: 'Mekke’nin fethinden kısa süre sonra Müslümanlar Huneyn vadisinde Hevâzin kabilesiyle karşılaştılar. Kalabalık olmaları onları sevindirmişti; yine de başta çoğu geri çekildi, Peygamber ﷺ yerinde sebat etti ve sonra zafer geldi (9:25–26).',
    },
    kids: {
      az: 'Hüneyndə əvvəlcə çoxları geri qaçdı, lakin Peyğəmbər ﷺ yerində möhkəm durdu və Allah kömək göndərdi.',
      en: 'At Hunayn many people ran back at first, but the Prophet ﷺ stood firm and Allah sent help.',
      ru: 'При Хунайне поначалу многие отступили, но Пророк ﷺ стоял твёрдо, и Аллах ниспослал помощь.',
      ar: 'في حنين فرّ كثيرون أول الأمر، لكن النبي ﷺ ثبت، فأنزل الله نصره.',
      tr: 'Huneyn’de başta birçokları geri kaçtı, ama Peygamber ﷺ yerinde sebat etti ve Allah yardım gönderdi.',
    } },

  { id: 'taifsiege', place: 'taif', h: 8, ce: 630, src: ['Buxari 4325'],
    title: { az: 'Taifin mühasirəsi', en: 'The siege of Ta’if', ru: 'Осада Таифа', ar: 'حصار الطائف', tr: 'Taif kuşatması' },
    text: {
      az: 'Hüneyndən sonra Taif mühasirəyə alındı, lakin şəhər alınmadı və Peyğəmbər ﷺ geri qayıtmağa qərar verdi. Tarixçilərə görə Taif əhli (Səqif) bir il sonra Mədinəyə nümayəndə göndərib İslamı qəbul etdi.',
      en: 'After Hunayn, Ta’if was besieged, but it was not taken, and the Prophet ﷺ decided to return. According to historians, the people of Ta’if (Thaqif) sent a delegation to Madinah the next year and accepted Islam.',
      ru: 'После Хунайна Таиф был осаждён, но не взят, и Пророк ﷺ решил вернуться. По словам историков, через год жители Таифа (сакиф) отправили в Медину делегацию и приняли ислам.',
      ar: 'بعد حنين حوصرت الطائف فلم تُفتح، فقرّر النبي ﷺ الرجوع. ويذكر المؤرخون أن ثقيفًا أرسلت وفدها إلى المدينة في العام التالي فأسلمت.',
      tr: 'Huneyn’den sonra Taif kuşatıldı, ancak şehir alınamadı ve Peygamber ﷺ geri dönmeye karar verdi. Tarihçilere göre Taif halkı (Sakîf) ertesi yıl Medine’ye heyet gönderip İslam’ı kabul etti.',
    },
    kids: {
      az: 'Peyğəmbər ﷺ Taifi mühasirəyə aldı, sonra geri qayıtdı. Sonralar oranın əhli özü gəlib müsəlman oldu.',
      en: 'The Prophet ﷺ besieged Ta’if, then went back. Later its people came themselves and accepted Islam.',
      ru: 'Пророк ﷺ осадил Таиф, а затем вернулся. Позже его жители сами пришли и приняли ислам.',
      ar: 'حاصر النبي ﷺ الطائف ثم رجع، وبعد ذلك جاء أهلها فأسلموا.',
      tr: 'Peygamber ﷺ Taif’i kuşattı, sonra geri döndü. Daha sonra oranın halkı kendileri gelip Müslüman oldu.',
    } },

  { id: 'tabuk', place: 'tabuk', h: 9, ce: 630, src: ['Quran 9:38-42', 'Quran 9:117-118', 'Buxari 4418', 'Muslim 2769'],
    title: { az: 'Təbük yürüşü', en: 'The expedition to Tabuk', ru: 'Поход на Табук', ar: 'غزوة تبوك', tr: 'Tebük Seferi' },
    text: {
      az: 'Şiddətli isti və çətinlik vaxtında Peyğəmbər ﷺ böyük qoşunla şimala, Təbükə yürüş etdi. Bu yürüşdən geri qalan üç səhabənin tövbəsinin qəbul olunması 9:117–118 ayələrində xəbər verilir.',
      en: 'In a time of intense heat and hardship, the Prophet ﷺ led a large army north to Tabuk. The acceptance of the repentance of three companions who had stayed behind is told in 9:117–118.',
      ru: 'Во время сильной жары и трудностей Пророк ﷺ повёл большое войско на север, к Табуку. О принятии покаяния трёх сподвижников, не вышедших в поход, сообщается в аятах 9:117–118.',
      ar: 'في وقت شدة الحر والعسرة سار النبي ﷺ بجيش كبير شمالًا إلى تبوك، وفي الآيتين (التوبة 117–118) خبر التوبة على الثلاثة الذين خُلّفوا.',
      tr: 'Şiddetli sıcak ve zorluk zamanında Peygamber ﷺ büyük bir orduyla kuzeye, Tebük’e sefer düzenledi. Bu seferden geri kalan üç sahabenin tövbesinin kabulü 9:117–118 ayetlerinde haber verilir.',
    },
    kids: {
      az: 'Peyğəmbər ﷺ çox isti havada uzaq şimala, Təbükə getdi. Geri qalan üç səhabə tövbə etdi və Allah onları bağışladı.',
      en: 'The Prophet ﷺ travelled far north to Tabuk in great heat. Three companions who stayed behind repented, and Allah forgave them.',
      ru: 'Пророк ﷺ в сильную жару отправился далеко на север, к Табуку. Три сподвижника, оставшиеся дома, покаялись, и Аллах простил их.',
      ar: 'سافر النبي ﷺ في حرّ شديد شمالًا إلى تبوك، وتاب ثلاثة من الصحابة تخلّفوا عنه فتاب الله عليهم.',
      tr: 'Peygamber ﷺ çok sıcak bir havada uzak kuzeye, Tebük’e gitti. Geride kalan üç sahabe tövbe etti ve Allah onları bağışladı.',
    } },

  { id: 'farewell', place: 'arafat', also: ['makkah', 'mina'], h: 10, ce: 632, src: ['Quran 5:3', 'Buxari 45', 'Buxari 4404', 'Muslim 1218'],
    title: { az: 'Vida həcci', en: 'The Farewell Hajj', ru: 'Прощальный хадж', ar: 'حجة الوداع', tr: 'Veda Haccı' },
    text: {
      az: 'Peyğəmbər ﷺ hicrətdən sonrakı yeganə həccini etdi və Ərəfədə insanlara xütbə söylədi. Dinin kamil edildiyini bildirən 5:3 ayəsi Ərəfədə, cümə günü nazil oldu.',
      en: 'The Prophet ﷺ performed his only Hajj after the Hijrah and addressed the people at ‘Arafah. The verse on the perfection of the religion (5:3) was revealed at ‘Arafah, on a Friday.',
      ru: 'Пророк ﷺ совершил свой единственный после хиджры хадж и обратился к людям с проповедью в Арафате. Аят о завершении религии (5:3) был ниспослан в Арафате, в пятницу.',
      ar: 'حجّ النبي ﷺ حجته الوحيدة بعد الهجرة، وخطب الناس بعرفة، ونزلت آية إكمال الدين (المائدة 3) بعرفة يوم الجمعة.',
      tr: 'Peygamber ﷺ hicretten sonraki tek haccını yaptı ve Arafat’ta insanlara hutbe irad etti. Dinin kemale erdirildiğini bildiren 5:3 ayeti Arafat’ta, bir cuma günü indi.',
    },
    kids: {
      az: 'Peyğəmbər ﷺ çoxlu müsəlmanla birlikdə həcc etdi və Ərəfədə onlara nəsihət verdi.',
      en: 'The Prophet ﷺ made Hajj with a great many Muslims and gave them advice at ‘Arafah.',
      ru: 'Пророк ﷺ совершил хадж вместе с множеством мусульман и дал им наставления в Арафате.',
      ar: 'حجّ النبي ﷺ مع جمع كبير من المسلمين، ووعظهم بعرفة.',
      tr: 'Peygamber ﷺ pek çok Müslümanla birlikte hac yaptı ve Arafat’ta onlara öğütler verdi.',
    } },

  { id: 'passing', place: 'madinah', h: 11, ce: 632, src: ['Buxari 4450', 'Buxari 3536', 'Buxari 3668', 'Quran 3:144'],
    title: { az: 'Peyğəmbərin ﷺ vəfatı', en: 'The passing of the Prophet ﷺ', ru: 'Кончина Пророка ﷺ', ar: 'وفاة النبي ﷺ', tr: 'Peygamber’in ﷺ vefatı' },
    text: {
      az: 'Peyğəmbər ﷺ Mədinədə, Aişənin evində, altmış üç yaşında vəfat etdi. Əbu Bəkr kədərlənmiş insanlara müraciət edib 3:144 ayəsini oxudu. Tarixçilərə görə bu, hicri 11-ci ilin Rəbiül-əvvəl ayında oldu.',
      en: 'The Prophet ﷺ passed away in Madinah, in the house of ‘A’ishah, at the age of sixty-three. Abu Bakr addressed the grieving people and recited 3:144. According to historians it was in Rabi‘ al-Awwal of AH 11.',
      ru: 'Пророк ﷺ скончался в Медине, в доме Аиши, в возрасте шестидесяти трёх лет. Абу Бакр обратился к скорбящим людям и прочитал аят 3:144. По словам историков, это было в месяце раби‘ аль-авваль 11 года хиджры.',
      ar: 'تُوفي النبي ﷺ في المدينة في بيت عائشة وهو ابن ثلاث وستين سنة، فخطب أبو بكر الناس وهم في حزنهم وتلا (آل عمران 144). وكان ذلك في ربيع الأول سنة 11 للهجرة على ما يذكره المؤرخون.',
      tr: 'Peygamber ﷺ Medine’de, Âişe’nin evinde, altmış üç yaşında vefat etti. Ebû Bekir üzüntülü insanlara hitap edip 3:144 ayetini okudu. Tarihçilere göre bu, hicri 11. yılın Rebîülevvel ayında oldu.',
    },
    kids: {
      az: 'Peyğəmbər ﷺ altmış üç yaşında Mədinədə vəfat etdi. Əbu Bəkr hamıya Allahın əbədi diri olduğunu xatırlatdı.',
      en: 'The Prophet ﷺ passed away in Madinah at the age of sixty-three. Abu Bakr reminded everyone that Allah is Ever-Living.',
      ru: 'Пророк ﷺ скончался в Медине в возрасте шестидесяти трёх лет. Абу Бакр напомнил всем, что Аллах Вечно Живой.',
      ar: 'تُوفي النبي ﷺ في المدينة وهو ابن ثلاث وستين سنة، وذكّر أبو بكر الناس بأن الله حيٌّ لا يموت.',
      tr: 'Peygamber ﷺ altmış üç yaşında Medine’de vefat etti. Ebû Bekir herkese Allah’ın daima diri olduğunu hatırlattı.',
    } },
]

export const SEERAH_BY_ID = Object.fromEntries(SEERAH_EVENTS.map(e => [e.id, e]))

/** Yerin hadisələri (sıra ilə) — xəritədə klik və yer siyahısı üçün. */
export function eventsAt(placeId) {
  return SEERAH_EVENTS.filter(e => e.place === placeId)
}

/** Mənbə sətri → { kind: 'quran', s, a, a2 } | { kind: 'hadith', book, n } */
export function parseSeerahSource(src) {
  let m = /^Quran (\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/.exec(src)
  if (m) return { kind: 'quran', s: +m[1], a: +m[2], a2: m[3] ? +m[3] : null }
  m = /^(Buxari|Muslim) (\d{1,4})$/.exec(src)
  if (m) return { kind: 'hadith', book: m[1], n: +m[2] }
  return null
}

/** Məkkə (hicrətdən əvvəl) və ya Mədinə dövrü */
export const periodOf = (e) => (e.h < 1 ? 'makkah' : 'madinah')
