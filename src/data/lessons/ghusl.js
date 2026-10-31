// Qüsl (böyük təharət) — dəlilləri ilə. Hədis nömrələri fawazahmed0/hadith-api ilə yoxlanılıb
// (Müslim — Fuad Abdülbaqi nömrələnməsi). Fətvalar açılıb yoxlanılıb.

export const meta = {
  slug: 'ghusl',
  cat: 'tahara',
  order: 10,
  icon: 'drop',
  arTitle: 'الغُسْل',
  title: {
    az: 'Qüsl: nə vaxt vacibdir və necə alınır',
    en: 'Ghusl: when it is required and how to do it',
    ru: 'Гусль: когда он обязателен и как его совершать',
    ar: 'الغسل: متى يجب وكيف يكون',
    tr: 'Gusül: ne zaman farz olur ve nasıl alınır',
  },
  summary: {
    az: 'Qüslü vacib edən hallar, kifayət edən və kamil qüslün qaydası, qadınlara aid hökmlər və sünnə qüslləri — Quran və səhih Sünnə əsasında.',
    en: 'What makes ghusl obligatory, the minimum valid and the complete ghusl, rulings for women and the recommended baths — from the Quran and authentic Sunnah.',
    ru: 'Что делает гусль обязательным, достаточный и полный гусль, положения для женщин и желательные омовения — по Корану и достоверной Сунне.',
    ar: 'موجبات الغسل، وصفة الغسل المجزئ والكامل، وأحكام تخص المرأة، والأغسال المستحبة، من القرآن والسنة الصحيحة.',
    tr: 'Guslü farz kılan durumlar, yeterli ve kâmil gusül, kadınlara özel hükümler ve sünnet gusüller — Kur’an ve sahih Sünnet ışığında.',
  },
  author: {
    az: 'Səhih hədislər; İbn Baz və İbn Useyminin fətvaları',
    en: 'Authentic hadith; fatwas of Ibn Baz and Ibn Uthaymin',
    ru: 'Достоверные хадисы; фетвы Ибн База и Ибн Усаймина',
    ar: 'الأحاديث الصحيحة؛ فتاوى ابن باز وابن عثيمين',
    tr: 'Sahih hadisler; İbn Baz ve İbn Useymin’in fetvaları',
  },
  minutes: 11,
}

export default {
  sections: [
    {
      id: 'intro',
      title: { az: 'Qüsl nədir?', en: 'What is ghusl?', ru: 'Что такое гусль?', ar: 'ما هو الغسل؟', tr: 'Gusül nedir?' },
      blocks: [
        { t: 'p', text: {
          az: 'Qüsl — niyyətlə bütün bədəni su ilə yumaqdır. O, böyük natəmizliyi (cənabəti, aybaşı və zahılıq halını) aradan qaldırır. Böyük natəmizlik halında olan şəxs qüsl almadan namaz qıla bilməz.',
          en: 'Ghusl is washing the whole body with water, with the intention of purification. It removes major ritual impurity (janabah, menstruation and post-natal bleeding). A person in that state may not pray until they take ghusl.',
          ru: 'Гусль — это омовение всего тела водой с намерением очищения. Он снимает большое осквернение (джанабу, менструацию и послеродовое кровотечение). Человек в таком состоянии не может совершать намаз, пока не совершит гусль.',
          ar: 'الغسل هو تعميم البدن بالماء بنية التطهر، وبه يرتفع الحدث الأكبر من جنابة وحيض ونفاس. ومن كان عليه حدث أكبر لا تصح صلاته حتى يغتسل.',
          tr: 'Gusül, niyetle bütün bedeni suyla yıkamaktır. Büyük hadesi (cünüplük, hayız ve nifas hâlini) giderir. Bu hâldeki kişi gusül almadan namaz kılamaz.',
        } },
        { t: 'ayah', ar: 'وَإِن كُنتُمْ جُنُبًا فَٱطَّهَّرُوا۟', ref: '5:6', text: {
          az: '“Əgər cünub olsanız, (bütün bədəninizi yuyaraq) təmizlənin.”',
          en: '“And if you are in a state of janabah, then purify yourselves.”',
          ru: '«А если вы находитесь в состоянии осквернения (джанабы), то очиститесь».',
          ar: 'وإن كنتم جنبًا فاطهروا.',
          tr: '“Eğer cünüp iseniz, iyice temizlenin.”',
        } },
        { t: 'ayah', ar: 'وَلَا جُنُبًا إِلَّا عَابِرِى سَبِيلٍ حَتَّىٰ تَغْتَسِلُوا۟', ref: '4:43', text: {
          az: '“…cünub olduğunuz halda da — yoldan keçən olmağınız istisna olmaqla — qüsl alana qədər (namaza yaxınlaşmayın).”',
          en: '“…nor (approach prayer) in a state of janabah, except when passing through, until you have washed.”',
          ru: '«…и не (приближайтесь к намазу) в состоянии осквернения, если только вы не проходите мимо, пока не искупаетесь».',
          ar: 'ولا جنبًا إلا عابري سبيل حتى تغتسلوا.',
          tr: '“…cünüp iken de — yolcu olmanız hâli müstesna — yıkanıncaya kadar (namaza yaklaşmayın).”',
        } },
      ],
    },
    {
      id: 'obligatory',
      title: { az: 'Qüslü vacib edən hallar', en: 'What makes ghusl obligatory', ru: 'Что делает гусль обязательным', ar: 'موجبات الغسل', tr: 'Guslü farz kılan durumlar' },
      blocks: [
        { t: 'list', ordered: true, items: [
          {
            az: 'Oyaq ikən şəhvətlə və ya yuxuda (ehtilam) məninin xaric olması — kişi və qadın üçün eynidir.',
            en: 'Emission of sexual fluid with desire while awake, or in sleep (a wet dream) — the same for men and women.',
            ru: 'Выделение семени со страстью наяву или во сне (поллюция) — одинаково для мужчин и женщин.',
            ar: 'خروج المني دفقًا بلذة في اليقظة، أو بالاحتلام في النوم، للرجل والمرأة.',
            tr: 'Uyanıkken şehvetle veya uykuda (ihtilam) meninin çıkması — erkek ve kadın için aynıdır.',
          },
          {
            az: 'Cinsi yaxınlıq — məni xaric olmasa belə.',
            en: 'Sexual intercourse — even if there is no emission.',
            ru: 'Половая близость — даже если не было семяизвержения.',
            ar: 'الجماع ولو لم ينزل.',
            tr: 'Cinsel ilişki — meni gelmese bile.',
          },
          {
            az: 'Aybaşı (heyz) və zahılıq (nifas) qanının kəsilməsi.',
            en: 'The end of menstruation (hayd) and of post-natal bleeding (nifas).',
            ru: 'Прекращение менструации (хайд) и послеродового кровотечения (нифас).',
            ar: 'انقطاع دم الحيض والنفاس.',
            tr: 'Hayız ve nifas kanının kesilmesi.',
          },
          {
            az: 'Ölüm — müsəlman meyiti yuyulur (ətraflı: “Cənazə” dərsi).',
            en: 'Death — the deceased Muslim is washed (see the lesson “Janazah”).',
            ru: 'Смерть — умершего мусульманина омывают (подробно: урок «Джаназа»).',
            ar: 'الموت، فيُغسَّل الميت المسلم (والتفصيل في درس «الجنائز»).',
            tr: 'Ölüm — Müslüman cenaze yıkanır (ayrıntı: “Cenaze” dersi).',
          },
          {
            az: 'Kafirin İslamı qəbul etməsi — Peyğəmbər ﷺ İslamı qəbul edən Qeys ibn Asimə qüsl almağı əmr etmişdir. Alimlərin bir qismi bunu vacib, digərləri müstəhəb sayır.',
            en: 'A non-Muslim entering Islam — the Prophet ﷺ ordered Qays ibn Asim to take ghusl when he accepted Islam. Some scholars hold it obligatory, others recommended.',
            ru: 'Принятие ислама неверующим — Пророк ﷺ велел Кайсу ибн Асыму совершить гусль, когда тот принял ислам. Часть учёных считает это обязательным, другие — желательным.',
            ar: 'إسلام الكافر؛ فقد أمر النبي ﷺ قيس بن عاصم لما أسلم أن يغتسل، فأوجبه بعض العلماء واستحبه آخرون.',
            tr: 'Kâfirin Müslüman olması — Peygamber ﷺ Müslüman olan Kays b. Âsım’a gusletmesini emretmiştir. Âlimlerin bir kısmı bunu farz, diğerleri müstehap sayar.',
          },
        ] },
        { t: 'hadith', ar: 'إِذَا جَلَسَ بَيْنَ شُعَبِهَا الأَرْبَعِ ثُمَّ جَهَدَهَا فَقَدْ وَجَبَ عَلَيْهِ الْغُسْلُ. وَفِي حَدِيثِ مَطَرٍ: وَإِنْ لَمْ يُنْزِلْ', text: {
          az: '“Kişi qadının dörd üzvü arasına oturub ona yaxınlıq etdikdə qüsl vacib olur.” Bir rəvayətdə: “Məni xaric olmasa belə.”',
          en: '“When a man sits between her four limbs and exerts himself with her, ghusl becomes obligatory.” In one narration: “Even if he does not ejaculate.”',
          ru: '«Когда мужчина сядет между четырёх её конечностей и совершит с ней близость, гусль становится обязательным». В одной версии: «Даже если не было семяизвержения».',
          ar: 'إذا جلس بين شعبها الأربع ثم جهدها فقد وجب الغسل، وفي رواية: وإن لم ينزل.',
          tr: '“Erkek kadının dört uzvu arasına oturup onunla ilişkiye girdiğinde gusül farz olur.” Bir rivayette: “Meni gelmese bile.”',
        }, src: { az: 'Buxari 291, Müslim 348', en: 'Bukhari 291, Muslim 348', ru: 'Бухари 291, Муслим 348', ar: 'البخاري 291، مسلم 348', tr: 'Buhârî 291, Müslim 348' } },
        { t: 'hadith', ar: 'جَاءَتْ أُمُّ سُلَيْمٍ إِلَى رَسُولِ اللَّهِ ﷺ فَقَالَتْ: يَا رَسُولَ اللَّهِ، إِنَّ اللَّهَ لاَ يَسْتَحْيِي مِنَ الْحَقِّ، فَهَلْ عَلَى الْمَرْأَةِ مِنْ غُسْلٍ إِذَا احْتَلَمَتْ؟ قَالَ: نَعَمْ، إِذَا رَأَتِ الْمَاءَ', text: {
          az: 'Ümmü Süleym Allahın Elçisinin ﷺ yanına gəlib dedi: “Ey Allahın Elçisi! Allah haqqı söyləməkdən çəkinmir. Qadın ehtilam olarsa, ona qüsl lazımdırmı?” O buyurdu: “Bəli, əgər suyu (mənini) görərsə.”',
          en: 'Umm Sulaym came to the Messenger of Allah ﷺ and said: “O Messenger of Allah, Allah is not shy of the truth. Must a woman take ghusl if she has a wet dream?” He said: “Yes, if she sees the fluid.”',
          ru: 'Умм Сулейм пришла к Посланнику Аллаха ﷺ и сказала: «О Посланник Аллаха, поистине, Аллах не стесняется истины. Обязан ли женщине гусль, если у неё была поллюция?» Он ответил: «Да, если она увидит влагу».',
          ar: 'سؤال أم سليم عن احتلام المرأة، وجواب النبي ﷺ: نعم إذا رأت الماء.',
          tr: 'Ümmü Süleym, Allah’ın Resûlü’ne ﷺ gelip dedi: “Ey Allah’ın Resûlü! Allah haktan utanmaz. Kadın ihtilam olursa gusül gerekir mi?” Buyurdu: “Evet, eğer suyu (meniyi) görürse.”',
        }, src: { az: 'Buxari 130, Müslim 313', en: 'Bukhari 130, Muslim 313', ru: 'Бухари 130, Муслим 313', ar: 'البخاري 130، مسلم 313', tr: 'Buhârî 130, Müslim 313' } },
        { t: 'note', kind: 'info', text: {
          az: 'Yuxu görüb, amma oyananda heç bir iz tapmayan şəxsə qüsl lazım deyil. Yuxunu xatırlamasa da, paltarında məni izi görən isə qüsl alır. Peyğəmbərdən ﷺ bu barədə soruşulduqda belə cavab vermişdir (Əbu Davud 236, Tirmizi 113; əl-Albani həsən/səhih saymışdır).',
          en: 'Someone who dreams but finds no trace on waking does not need ghusl; someone who finds traces of fluid but does not remember a dream must take ghusl. This is how the Prophet ﷺ answered when asked (Abu Dawud 236, at-Tirmidhi 113; graded hasan/sahih by al-Albani).',
          ru: 'Кто видел сон, но, проснувшись, не нашёл следов, тому гусль не нужен; а кто нашёл следы семени, но не помнит сна, тот совершает гусль. Так ответил Пророк ﷺ, когда его спросили (Абу Дауд 236, ат-Тирмизи 113; аль-Альбани счёл хорошим/достоверным).',
          ar: 'من رأى أنه احتلم ولم يجد بللًا فلا غسل عليه، ومن وجد بللًا ولم يذكر احتلامًا اغتسل؛ كذا أجاب النبي ﷺ لما سئل (أبو داود 236، الترمذي 113، وحسّنه/صححه الألباني).',
          tr: 'Rüya görüp uyandığında hiçbir iz bulamayana gusül gerekmez; rüyayı hatırlamasa da meni izi bulan ise gusleder. Peygamber ﷺ bu konuda sorulduğunda böyle cevap vermiştir (Ebû Dâvûd 236, Tirmizî 113; el-Albânî hasen/sahih saymıştır).',
        } },
      ],
    },
    {
      id: 'minimum',
      title: { az: 'Kifayət edən qüsl (vacib hissələr)', en: 'The minimum valid ghusl', ru: 'Достаточный гусль (обязательные части)', ar: 'الغسل المجزئ', tr: 'Yeterli gusül (farz kısımları)' },
      blocks: [
        { t: 'p', text: {
          az: 'Qüslün düzgün olması üçün iki şey vacibdir: 1) ürəkdə niyyət — natəmizliyi qaldırmaq niyyəti (dillə deməyə ehtiyac yoxdur); 2) suyun bütün bədənə çatması — saç dibləri, qoltuq altı, göbək, qulaq arxası, ayaq barmaqlarının arası daxil. Ağzı və burnu yaxalamaq da bədəni yumağın bir hissəsidir və alimlərin bir çoxu onu qüsldə vacib sayır; buna görə onu tərk etmək olmaz.',
          en: 'Two things are required for a valid ghusl: 1) the intention in the heart to remove the impurity (it is not spoken aloud); 2) water reaching the entire body — including the roots of the hair, the armpits, the navel, behind the ears and between the toes. Rinsing the mouth and nose is part of washing the body, and many scholars consider it obligatory in ghusl, so it should not be left out.',
          ru: 'Для действительного гусля обязательны две вещи: 1) намерение в сердце снять осквернение (его не произносят вслух); 2) чтобы вода достигла всего тела — включая корни волос, подмышки, пупок, за ушами и между пальцами ног. Полоскание рта и носа — часть омовения тела, и многие учёные считают его обязательным в гусле, поэтому его не следует оставлять.',
          ar: 'يجب في الغسل أمران: النية بالقلب لرفع الحدث، ولا يُتلفظ بها؛ وتعميم البدن بالماء حتى أصول الشعر والإبطين والسرة وخلف الأذنين وبين أصابع الرجلين. والمضمضة والاستنشاق من تعميم البدن، وأوجبهما في الغسل كثير من العلماء، فلا ينبغي تركهما.',
          tr: 'Guslün sahih olması için iki şey gerekir: 1) kalpte hadesi kaldırma niyeti (dille söylenmez); 2) suyun bütün bedene ulaşması — saç dipleri, koltuk altları, göbek, kulak arkası ve ayak parmaklarının arası dâhil. Ağza ve buruna su vermek de bedeni yıkamanın bir parçasıdır ve âlimlerin çoğu bunu gusülde farz sayar; bu yüzden terk edilmemelidir.',
        } },
        { t: 'note', kind: 'warn', text: {
          az: 'Suyun dəriyə çatmasına mane olan hər şey (dırnaq lakı, boya, yapışqan, su keçirməyən krem) qüsldən əvvəl təmizlənməlidir. Xınanın rəngi isə mane deyil, çünki onun qalınlığı yoxdur.',
          en: 'Anything that prevents water reaching the skin (nail polish, paint, glue, waterproof cream) must be removed before ghusl. The colour of henna is not a barrier, as it has no layer.',
          ru: 'Всё, что мешает воде достичь кожи (лак для ногтей, краска, клей, водостойкий крем), нужно удалить до гусля. Цвет хны не является преградой, так как у неё нет слоя.',
          ar: 'كل ما يمنع وصول الماء إلى البشرة كطلاء الأظافر والدهان والغراء والكريمات العازلة يجب إزالته قبل الغسل، أما لون الحناء فليس حائلًا لأنه لا جرم له.',
          tr: 'Suyun deriye ulaşmasına engel olan her şey (oje, boya, yapıştırıcı, su geçirmez krem) gusülden önce giderilmelidir. Kınanın rengi ise engel değildir, çünkü katmanı yoktur.',
        } },
      ],
    },
    {
      id: 'complete',
      title: { az: 'Kamil qüsl — Peyğəmbərin ﷺ qüslü', en: 'The complete ghusl of the Prophet ﷺ', ru: 'Полный гусль — как совершал Пророк ﷺ', ar: 'الغسل الكامل كما اغتسل النبي ﷺ', tr: 'Kâmil gusül — Peygamber’in ﷺ guslü' },
      blocks: [
        { t: 'hadith', ar: 'كَانَ رَسُولُ اللَّهِ ﷺ إِذَا اغْتَسَلَ مِنَ الْجَنَابَةِ يَبْدَأُ فَيَغْسِلُ يَدَيْهِ، ثُمَّ يُفْرِغُ بِيَمِينِهِ عَلَى شِمَالِهِ فَيَغْسِلُ فَرْجَهُ، ثُمَّ يَتَوَضَّأُ وُضُوءَهُ لِلصَّلاَةِ، ثُمَّ يَأْخُذُ الْمَاءَ فَيُدْخِلُ أَصَابِعَهُ فِي أُصُولِ الشَّعْرِ، حَتَّى إِذَا رَأَى أَنْ قَدِ اسْتَبْرَأَ حَفَنَ عَلَى رَأْسِهِ ثَلاَثَ حَفَنَاتٍ، ثُمَّ أَفَاضَ عَلَى سَائِرِ جَسَدِهِ، ثُمَّ غَسَلَ رِجْلَيْهِ', text: {
          az: 'Aişə (Allah ondan razı olsun) deyir: “Allahın Elçisi ﷺ cənabətdən qüsl aldıqda əvvəlcə əllərini yuyar, sonra sağ əli ilə sol əlinə su töküb övrətini yuyar, sonra namaz üçün aldığı kimi dəstəmaz alardı. Sonra su götürüb barmaqlarını saç diblərinə yeridər, dərinin islandığını gördükdə başına üç ovuc su tökər, sonra bədəninin qalan hissəsinə su axıdar, sonra ayaqlarını yuyardı.”',
          en: '‘A’ishah said: “When the Messenger of Allah ﷺ bathed from janabah, he began by washing his hands, then poured water with his right hand onto his left and washed his private parts, then performed wudu as for prayer. Then he took water and ran his fingers into the roots of his hair, and when he saw that it had reached the skin, he poured three handfuls over his head, then poured water over the rest of his body, then washed his feet.”',
          ru: 'Аиша (да будет доволен ею Аллах) сказала: «Когда Посланник Аллаха ﷺ совершал гусль от джанабы, он сначала мыл руки, затем правой рукой лил воду на левую и мыл половые органы, затем совершал омовение, как для намаза. Потом он брал воду и вводил пальцы в корни волос, а убедившись, что кожа намокла, лил на голову три пригоршни, затем обливал водой остальное тело, затем мыл ноги».',
          ar: 'حديث عائشة رضي الله عنها في صفة غسل النبي ﷺ من الجنابة.',
          tr: 'Âişe (r.anha) der ki: “Allah’ın Resûlü ﷺ cünüplükten gusledeceği zaman önce ellerini yıkar, sonra sağ eliyle sol eline su döküp avret yerini yıkar, sonra namaz abdesti gibi abdest alırdı. Sonra su alıp parmaklarını saç diplerine sokar, derinin ıslandığını görünce başına üç avuç su döker, sonra bedeninin geri kalanına su akıtır, sonra ayaklarını yıkardı.”',
        }, src: { az: 'Buxari 248, Müslim 316', en: 'Bukhari 248, Muslim 316', ru: 'Бухари 248, Муслим 316', ar: 'البخاري 248، مسلم 316', tr: 'Buhârî 248, Müslim 316' } },
        { t: 'steps', items: [
          {
            title: { az: 'Niyyət', en: 'Intention', ru: 'Намерение', ar: 'النية', tr: 'Niyet' },
            text: { az: 'Ürəkdə böyük natəmizliyi qaldırmağa niyyət edin.', en: 'Intend in your heart to remove the major impurity.', ru: 'Намерьтесь в сердце снять большое осквернение.', ar: 'انوِ بقلبك رفع الحدث الأكبر.', tr: 'Kalbinizle büyük hadesi kaldırmaya niyet edin.' },
          },
          {
            title: { az: 'Əlləri yumaq', en: 'Wash the hands', ru: 'Вымыть кисти рук', ar: 'غسل الكفين', tr: 'Elleri yıkamak' },
            text: { az: 'Əlləri iki-üç dəfə yuyun.', en: 'Wash your hands two or three times.', ru: 'Вымойте кисти рук два-три раза.', ar: 'اغسل كفيك مرتين أو ثلاثًا.', tr: 'Ellerinizi iki üç kez yıkayın.' },
          },
          {
            title: { az: 'Övrəti yumaq', en: 'Wash the private parts', ru: 'Вымыть половые органы', ar: 'غسل الفرج', tr: 'Avret yerini yıkamak' },
            text: { az: 'Sol əllə övrəti və ona dəyən çirki yuyun, sonra əli torpağa sürtün və ya sabunla yuyun — Meymunənin hədisində olduğu kimi.', en: 'Wash the private parts and any dirt with the left hand, then rub the hand on the ground or wash it with soap — as in the hadith of Maymunah.', ru: 'Левой рукой вымойте половые органы и нечистоту, затем потрите руку о землю или вымойте мылом — как в хадисе Маймуны.', ar: 'اغسل فرجك وما أصابك من أذى بشمالك، ثم ادلك يدك بالأرض أو اغسلها بالصابون، كما في حديث ميمونة.', tr: 'Sol elle avret yerini ve bulaşan kiri yıkayın, sonra eli toprağa sürtün veya sabunla yıkayın — Meymûne’nin hadisinde olduğu gibi.' },
          },
          {
            title: { az: 'Tam dəstəmaz', en: 'Full wudu', ru: 'Полное малое омовение', ar: 'الوضوء الكامل', tr: 'Tam abdest' },
            text: { az: 'Namaz dəstəmazı kimi dəstəmaz alın. Ayaqları sona saxlamaq da olar — Meymunənin rəvayətində Peyğəmbər ﷺ ayaqlarını axırda, başqa yerə keçib yumuşdur.', en: 'Perform wudu as for prayer. You may leave the feet until the end — in Maymunah’s narration the Prophet ﷺ moved aside and washed his feet last.', ru: 'Совершите омовение, как для намаза. Ноги можно оставить на конец — в передаче Маймуны Пророк ﷺ отошёл в сторону и вымыл ноги в последнюю очередь.', ar: 'توضأ وضوءك للصلاة، ولك أن تؤخر غسل الرجلين إلى آخر الغسل، كما في رواية ميمونة أنه ﷺ تنحى فغسل رجليه.', tr: 'Namaz abdesti gibi abdest alın. Ayakları sona bırakmak da olur — Meymûne’nin rivayetinde Peygamber ﷺ kenara çekilip ayaklarını en son yıkamıştır.' },
          },
          {
            title: { az: 'Saç dibləri və baş', en: 'Hair roots and head', ru: 'Корни волос и голова', ar: 'تخليل الشعر والرأس', tr: 'Saç dipleri ve baş' },
            text: { az: 'Islaq barmaqları saç diblərinə yeridin, sonra başa üç ovuc su tökün.', en: 'Run wet fingers into the roots of the hair, then pour three handfuls of water over the head.', ru: 'Введите мокрые пальцы в корни волос, затем вылейте на голову три пригоршни воды.', ar: 'خلّل أصول شعرك بأصابعك المبللة، ثم صب على رأسك ثلاث حفنات.', tr: 'Islak parmakları saç diplerine sokun, sonra başa üç avuç su dökün.' },
          },
          {
            title: { az: 'Bədənin qalanı — sağdan başlayaraq', en: 'The rest of the body — starting on the right', ru: 'Остальное тело — начиная с правой стороны', ar: 'إفاضة الماء على سائر الجسد بالتيامن', tr: 'Bedenin geri kalanı — sağdan başlayarak' },
            text: { az: 'Bütün bədənə su axıdın, sağ tərəfdən başlayın; Peyğəmbər ﷺ təharətdə sağdan başlamağı sevərdi (Buxari 168, Müslim 268). Gizli yerlərə diqqət edin.', en: 'Pour water over the whole body, starting with the right side; the Prophet ﷺ liked to start with the right in purification (Bukhari 168, Muslim 268). Pay attention to hidden areas.', ru: 'Облейте всё тело, начиная с правой стороны; Пророк ﷺ любил начинать с правого при очищении (Бухари 168, Муслим 268). Следите за скрытыми местами.', ar: 'أفض الماء على سائر جسدك مبتدئًا بالشق الأيمن، فقد كان ﷺ يعجبه التيمن في طهوره (البخاري 168، مسلم 268)، وتعاهد المواضع الخفية.', tr: 'Bütün bedene su akıtın, sağ taraftan başlayın; Peygamber ﷺ temizlikte sağdan başlamayı severdi (Buhârî 168, Müslim 268). Gizli yerlere dikkat edin.' },
          },
          {
            title: { az: 'Ayaqlar', en: 'The feet', ru: 'Ноги', ar: 'غسل الرجلين', tr: 'Ayaklar' },
            text: { az: 'Dəstəmazda yumamısınızsa, sonda ayaqları yuyun.', en: 'If you did not wash them in wudu, wash your feet at the end.', ru: 'Если вы не вымыли ноги при омовении, вымойте их в конце.', ar: 'إن لم تغسل رجليك في الوضوء فاغسلهما في آخر الغسل.', tr: 'Abdestte yıkamadıysanız ayakları en sonda yıkayın.' },
          },
        ] },
        { t: 'hadith', ar: 'ثُمَّ أَفَاضَ عَلَى رَأْسِهِ الْمَاءَ، ثُمَّ غَسَلَ جَسَدَهُ، ثُمَّ تَنَحَّى فَغَسَلَ رِجْلَيْهِ. قَالَتْ: فَأَتَيْتُهُ بِخِرْقَةٍ فَلَمْ يُرِدْهَا، فَجَعَلَ يَنْفُضُ بِيَدِهِ', text: {
          az: 'Meymunə deyir: “…Sonra başına su tökdü, bədənini yudu, sonra kənara çəkilib ayaqlarını yudu. Ona dəsmal gətirdim, istəmədi və suyu əli ilə silkələməyə başladı.”',
          en: 'Maymunah said: “…Then he poured water over his head, washed his body, then moved aside and washed his feet. I brought him a cloth, but he did not want it and began shaking the water off with his hand.”',
          ru: 'Маймуна сказала: «…Затем он облил голову водой, вымыл тело, потом отошёл в сторону и вымыл ноги. Я принесла ему ткань, но он не взял её и стал стряхивать воду рукой».',
          ar: 'من حديث ميمونة رضي الله عنها في صفة الغسل.',
          tr: 'Meymûne der ki: “…Sonra başına su döktü, bedenini yıkadı, sonra kenara çekilip ayaklarını yıkadı. Ona bir bez getirdim, istemedi ve suyu eliyle silkelemeye başladı.”',
        }, src: { az: 'Buxari 274, Müslim 317', en: 'Bukhari 274, Muslim 317', ru: 'Бухари 274, Муслим 317', ar: 'البخاري 274، مسلم 317', tr: 'Buhârî 274, Müslim 317' } },
        { t: 'note', kind: 'tip', text: {
          az: 'Dəstəmazın qaydası ayrıca “Dəstəmaz” bələdçisində izah olunub. Duş altında qüsl də eyni qaydadadır: əsas şərt — niyyət və suyun bütün bədənə çatmasıdır.',
          en: 'The method of wudu is explained separately in the wudu guide. A ghusl in the shower follows the same method: what matters is the intention and water reaching the whole body.',
          ru: 'Порядок малого омовения подробно описан в отдельном руководстве по омовению. Гусль под душем совершается так же: главное — намерение и то, чтобы вода достигла всего тела.',
          ar: 'صفة الوضوء مفصلة في دليل الوضوء. والاغتسال تحت الدُّش كغيره؛ المعتبر النية وتعميم البدن بالماء.',
          tr: 'Abdestin şekli ayrıca abdest rehberinde anlatılmıştır. Duş altında gusül de aynıdır: esas olan niyet ve suyun bütün bedene ulaşmasıdır.',
        } },
      ],
    },
    {
      id: 'women',
      title: { az: 'Qadınlara aid hökmlər', en: 'Rulings specific to women', ru: 'Положения для женщин', ar: 'أحكام تخص المرأة', tr: 'Kadınlara özel hükümler' },
      blocks: [
        { t: 'hadith', ar: 'قُلْتُ: يَا رَسُولَ اللَّهِ، إِنِّي امْرَأَةٌ أَشُدُّ ضَفْرَ رَأْسِي، فَأَنْقُضُهُ لِغُسْلِ الْجَنَابَةِ؟ قَالَ: لاَ، إِنَّمَا يَكْفِيكِ أَنْ تَحْثِي عَلَى رَأْسِكِ ثَلاَثَ حَثَيَاتٍ، ثُمَّ تُفِيضِينَ عَلَيْكِ الْمَاءَ فَتَطْهُرِينَ', text: {
          az: 'Ümmü Sələmə dedi: “Ey Allahın Elçisi! Mən saçımı hörürəm. Cənabət qüslü üçün hörükləri açımmı?” O buyurdu: “Xeyr, başına üç ovuc su tökməyin, sonra bədəninə su axıtmağın kifayətdir və təmizlənmiş olursan.”',
          en: 'Umm Salamah said: “O Messenger of Allah, I braid my hair tightly. Must I undo it for the ghusl of janabah?” He said: “No. It is enough for you to pour three handfuls over your head, then pour water over yourself, and you will be purified.”',
          ru: 'Умм Салама сказала: «О Посланник Аллаха, я туго заплетаю волосы. Расплетать ли мне их для гусля от джанабы?» Он ответил: «Нет, тебе достаточно вылить на голову три пригоршни, затем облить себя водой — и ты очистишься».',
          ar: 'حديث أم سلمة في عدم نقض الضفائر لغسل الجنابة.',
          tr: 'Ümmü Seleme dedi: “Ey Allah’ın Resûlü! Saçımı sıkıca örüyorum. Cünüplük guslü için örgüleri çözeyim mi?” Buyurdu: “Hayır, başına üç avuç su dökmen, sonra üzerine su akıtman yeterlidir; temizlenmiş olursun.”',
        }, src: { az: 'Müslim 330', en: 'Muslim 330', ru: 'Муслим 330', ar: 'مسلم 330', tr: 'Müslim 330' } },
        { t: 'list', items: [
          {
            az: 'Hörüklü saçı açmaq vacib deyil; əsas şərt suyun saç diblərinə çatmasıdır.',
            en: 'Undoing braids is not required; what matters is that water reaches the roots of the hair.',
            ru: 'Расплетать косы не обязательно; главное — чтобы вода достигла корней волос.',
            ar: 'لا يجب نقض الضفائر، وإنما الواجب إيصال الماء إلى أصول الشعر.',
            tr: 'Örgüleri çözmek gerekmez; esas olan suyun saç diplerine ulaşmasıdır.',
          },
          {
            az: 'Aybaşı və zahılıqdan qüsl cənabət qüslü kimidir. Qadına qüsldən sonra qan yerinə ətirli pambıq tətbiq etmək tövsiyə olunur ki, iy getsin (Buxari 314, Müslim 332).',
            en: 'The ghusl after menstruation and post-natal bleeding is like the ghusl of janabah. It is recommended for her to apply a piece of cotton with musk to the place of the blood to remove the odour (Bukhari 314, Muslim 332).',
            ru: 'Гусль после менструации и послеродового кровотечения такой же, как гусль от джанабы. Женщине желательно приложить кусочек ваты с мускусом к месту крови, чтобы устранить запах (Бухари 314, Муслим 332).',
            ar: 'غسل الحيض والنفاس كغسل الجنابة، ويستحب لها أن تأخذ قطعة فيها مسك فتتبع بها أثر الدم (البخاري 314، مسلم 332).',
            tr: 'Hayız ve nifastan sonraki gusül, cünüplük guslü gibidir. Kadının, kokuyu gidermek için misk sürülmüş bir pamuğu kan yerine sürmesi müstehaptır (Buhârî 314, Müslim 332).',
          },
          {
            az: 'Qan namaz vaxtı daxilində kəsilərsə, qadın qüsl alıb həmin namazı qılır; qüslü vaxt çıxana qədər təxirə salmaq olmaz.',
            en: 'If the bleeding stops within a prayer’s time, she takes ghusl and prays that prayer; she must not delay the ghusl until the time has passed.',
            ru: 'Если кровь прекратилась во время намаза, женщина совершает гусль и молится этот намаз; нельзя откладывать гусль до выхода времени.',
            ar: 'إذا طهرت في وقت صلاة اغتسلت وصلتها، ولا يجوز لها تأخير الغسل حتى يخرج الوقت.',
            tr: 'Kan bir namaz vakti içinde kesilirse kadın gusledip o namazı kılar; guslü vakit çıkıncaya kadar ertelemek caiz değildir.',
          },
        ] },
      ],
    },
    {
      id: 'sunnah-baths',
      title: { az: 'Sünnə (müstəhəb) qüsllər', en: 'Recommended baths', ru: 'Желательные омовения (гусль)', ar: 'الأغسال المستحبة', tr: 'Sünnet (müstehap) gusüller' },
      blocks: [
        { t: 'hadith', ar: 'الْغُسْلُ يَوْمَ الْجُمُعَةِ وَاجِبٌ عَلَى كُلِّ مُحْتَلِمٍ', text: {
          az: '“Cümə günü qüsl almaq hər həddi-buluğa çatmış şəxsə vacibdir.”',
          en: '“Ghusl on Friday is obligatory upon everyone who has reached puberty.”',
          ru: '«Гусль в пятницу обязателен для каждого достигшего зрелости».',
          ar: 'الغسل يوم الجمعة واجب على كل محتلم.',
          tr: '“Cuma günü gusletmek, ergenlik çağına gelen herkese vaciptir.”',
        }, src: { az: 'Buxari 858, Müslim 846', en: 'Bukhari 858, Muslim 846', ru: 'Бухари 858, Муслим 846', ar: 'البخاري 858، مسلم 846', tr: 'Buhârî 858, Müslim 846' } },
        { t: 'p', text: {
          az: 'Cümə qüslünün hökmündə alimlər ixtilaf etmişlər. Bəziləri (o cümlədən Şeyx İbn Useymin) bu hədisə əsasən onu cüməyə gələn üçün vacib sayır. Çoxluq isə onu müəkkəd sünnə hesab edir; onlar Ömərin (Allah ondan razı olsun) xütbə vaxtı yalnız dəstəmaz alıb gələn səhabəni məsciddən geri qaytarmamasını dəlil gətirirlər (Buxari 878, Müslim 845). Hər halda mömin onu tərk etməməlidir.',
          en: 'Scholars differ on the ruling of the Friday ghusl. Some, including Shaykh Ibn Uthaymin, hold it obligatory for those attending Jumu’ah, based on this hadith. The majority hold it a strongly emphasised sunnah, citing that ‘Umar did not send back the Companion who came during the khutbah having made only wudu (Bukhari 878, Muslim 845). Either way, a believer should not neglect it.',
          ru: 'Учёные разошлись в положении пятничного гусля. Некоторые, в том числе шейх Ибн Усаймин, на основании этого хадиса считают его обязательным для идущего на джуму. Большинство считают его подтверждённой сунной, приводя в довод то, что Умар не отправил назад сподвижника, пришедшего во время хутбы лишь с малым омовением (Бухари 878, Муслим 845). В любом случае верующему не следует его оставлять.',
          ar: 'اختلف العلماء في حكم غسل الجمعة؛ فأوجبه بعضهم على من يحضر الجمعة أخذًا بهذا الحديث، ومنهم الشيخ ابن عثيمين، وذهب الجمهور إلى أنه سنة مؤكدة، واستدلوا بأن عمر لم يأمر الصحابي الذي جاء متوضئًا أثناء الخطبة بالرجوع (البخاري 878، مسلم 845). وعلى كل حال لا ينبغي للمؤمن أن يتركه.',
          tr: 'Âlimler cuma guslünün hükmünde ihtilaf etmiştir. Bazıları — Şeyh İbn Useymin de dâhil — bu hadise dayanarak onu cumaya gelen için vacip sayar. Çoğunluk ise onu müekked sünnet kabul eder; Ömer’in (r.a.) hutbe sırasında sadece abdest alıp gelen sahabiyi geri göndermemesini delil getirir (Buhârî 878, Müslim 845). Her hâlükârda mümin onu terk etmemelidir.',
        } },
        { t: 'table',
          head: [
            { az: 'Qüsl', en: 'Bath', ru: 'Омовение', ar: 'الغسل', tr: 'Gusül' },
            { az: 'Dəlil', en: 'Evidence', ru: 'Довод', ar: 'الدليل', tr: 'Delil' },
          ],
          rows: [
            [
              { az: 'Cümə namazı üçün', en: 'For the Friday prayer', ru: 'Для пятничного намаза', ar: 'لصلاة الجمعة', tr: 'Cuma namazı için' },
              { az: 'Buxari 858, 877; Müslim 846', en: 'Bukhari 858, 877; Muslim 846', ru: 'Бухари 858, 877; Муслим 846', ar: 'البخاري 858، 877؛ مسلم 846', tr: 'Buhârî 858, 877; Müslim 846' },
            ],
            [
              { az: 'Həcc və ya ümrə üçün ehrama girərkən', en: 'On entering ihram for Hajj or ‘Umrah', ru: 'При вступлении в ихрам для хаджа или умры', ar: 'عند الإحرام بالحج أو العمرة', tr: 'Hac veya umre için ihrama girerken' },
              { az: 'Tirmizi 830 (əl-Albani: səhih)', en: 'At-Tirmidhi 830 (al-Albani: sahih)', ru: 'Ат-Тирмизи 830 (аль-Альбани: достоверный)', ar: 'الترمذي 830 (صححه الألباني)', tr: 'Tirmizî 830 (el-Albânî: sahih)' },
            ],
            [
              { az: 'Meyiti yuduqdan sonra', en: 'After washing a deceased person', ru: 'После омовения умершего', ar: 'بعد تغسيل الميت', tr: 'Cenaze yıkadıktan sonra' },
              { az: 'Əbu Davud 3161 (əl-Albani: səhih); çoxluğa görə müstəhəbdir', en: 'Abu Dawud 3161 (al-Albani: sahih); recommended according to the majority', ru: 'Абу Дауд 3161 (аль-Альбани: достоверный); по мнению большинства — желательно', ar: 'أبو داود 3161 (صححه الألباني)، وهو مستحب عند الجمهور', tr: 'Ebû Dâvûd 3161 (el-Albânî: sahih); çoğunluğa göre müstehaptır' },
            ],
          ],
        },
        { t: 'note', kind: 'info', text: {
          az: 'Bayram namazından əvvəl qüsl haqqında “Bayram namazı” dərsinə baxın.',
          en: 'For the bath before the Eid prayer, see the lesson “The Eid prayer”.',
          ru: 'О гусле перед праздничным намазом см. урок «Праздничный намаз».',
          ar: 'وأما الغسل لصلاة العيد فانظر درس «صلاة العيد».',
          tr: 'Bayram namazından önceki gusül için “Bayram namazı” dersine bakın.',
        } },
      ],
    },
    {
      id: 'junub',
      title: { az: 'Cünub şəxsin hökmləri', en: 'Rulings for the person in janabah', ru: 'Положения для находящегося в джанабе', ar: 'أحكام الجنب', tr: 'Cünüp kişinin hükümleri' },
      blocks: [
        { t: 'list', items: [
          {
            az: 'Qüsl almadan namaz qılmaq və Kəbəni təvaf etmək olmaz.',
            en: 'He may not pray or perform tawaf around the Ka‘bah until he takes ghusl.',
            ru: 'Нельзя совершать намаз и обход Каабы (таваф), пока не совершён гусль.',
            ar: 'لا يصلي ولا يطوف بالكعبة حتى يغتسل.',
            tr: 'Gusletmeden namaz kılamaz ve Kâbe’yi tavaf edemez.',
          },
          {
            az: 'Məsciddə oturmaq olmaz, yalnız oradan keçmək olar (Nisa 4:43).',
            en: 'He may not stay in the mosque, though he may pass through it (an-Nisa 4:43).',
            ru: 'Нельзя пребывать в мечети, но можно пройти через неё (ан-Ниса 4:43).',
            ar: 'لا يمكث في المسجد إلا عابر سبيل (النساء 43).',
            tr: 'Mescitte kalamaz, sadece içinden geçebilir (Nisâ 4:43).',
          },
          {
            az: 'Alimlərin çoxluğuna görə Mushafa toxunmaz və qüsl alana qədər Quran oxumaz. Zikr, dua və salavat isə icazəlidir.',
            en: 'According to the majority of scholars, he does not touch the Mushaf or recite the Quran until he takes ghusl. Dhikr, du‘a and salawat are permitted.',
            ru: 'По мнению большинства учёных, он не касается Мусхафа и не читает Коран, пока не совершит гусль. Поминание Аллаха, мольбы и благословения Пророку разрешены.',
            ar: 'لا يمس المصحف ولا يقرأ القرآن حتى يغتسل عند جمهور العلماء، ويجوز له الذكر والدعاء والصلاة على النبي ﷺ.',
            tr: 'Âlimlerin çoğunluğuna göre Mushaf’a dokunmaz ve gusledinceye kadar Kur’an okumaz. Zikir, dua ve salavat ise caizdir.',
          },
          {
            az: 'Qüslü yuxudan sonraya saxlamaq olar, amma namaz vaxtını keçirmək olmaz. Yatmazdan əvvəl dəstəmaz almaq sünnədir.',
            en: 'He may delay ghusl until after sleep, but not beyond a prayer time. Making wudu before sleeping is sunnah.',
            ru: 'Гусль можно отложить на после сна, но нельзя пропускать время намаза. Перед сном желательно совершить малое омовение.',
            ar: 'يجوز تأخير الغسل إلى ما بعد النوم ما لم يفت وقت الصلاة، والسنة أن يتوضأ قبل أن ينام.',
            tr: 'Guslü uyku sonrasına bırakabilir, ama namaz vaktini geçiremez. Uyumadan önce abdest almak sünnettir.',
          },
        ] },
        { t: 'hadith', ar: 'أَنَّ عُمَرَ قَالَ: يَا رَسُولَ اللَّهِ، أَيَرْقُدُ أَحَدُنَا وَهُوَ جُنُبٌ؟ قَالَ: نَعَمْ، إِذَا تَوَضَّأَ', text: {
          az: 'Ömər soruşdu: “Ey Allahın Elçisi! Bizdən biri cünub halında yata bilərmi?” O buyurdu: “Bəli, əgər dəstəmaz alarsa.”',
          en: '‘Umar asked: “O Messenger of Allah, may one of us sleep while in janabah?” He said: “Yes, if he performs wudu.”',
          ru: 'Умар спросил: «О Посланник Аллаха, может ли кто-то из нас спать в состоянии джанабы?» Он ответил: «Да, если совершит омовение».',
          ar: 'سؤال عمر عن نوم الجنب، وجوابه ﷺ: نعم إذا توضأ.',
          tr: 'Ömer sordu: “Ey Allah’ın Resûlü! Birimiz cünüp iken uyuyabilir mi?” Buyurdu: “Evet, abdest alırsa.”',
        }, src: { az: 'Buxari 287, Müslim 306', en: 'Bukhari 287, Muslim 306', ru: 'Бухари 287, Муслим 306', ar: 'البخاري 287، مسلم 306', tr: 'Buhârî 287, Müslim 306' } },
      ],
    },
    {
      id: 'faq',
      title: { az: 'Tez-tez verilən suallar', en: 'Common questions', ru: 'Частые вопросы', ar: 'أسئلة شائعة', tr: 'Sık sorulan sorular' },
      blocks: [
        { t: 'qa', items: [
          {
            q: { az: 'Qüsldən sonra namaz üçün yenidən dəstəmaz almaq lazımdırmı?', en: 'Do I need a separate wudu for prayer after ghusl?', ru: 'Нужно ли после гусля отдельно совершать омовение для намаза?', ar: 'هل يجزئ الغسل عن الوضوء؟', tr: 'Gusülden sonra namaz için ayrıca abdest almak gerekir mi?' },
            a: {
              az: 'Cənabət, aybaşı və ya zahılıqdan alınan vacib qüsl dəstəmazı da əvəz edir, çünki kiçik natəmizlik böyüyün içinə daxildir; amma qüsldən əvvəl dəstəmaz almaq sünnədir. Cümə qüslü kimi müstəhəb qüsl və ya sərinləmək üçün çimmək isə dəstəmazı əvəz etmir.',
              en: 'An obligatory ghusl from janabah, menstruation or post-natal bleeding also counts as wudu, since the minor impurity is included in the major one; still, it is sunnah to make wudu at the start of ghusl. A recommended bath such as the Friday ghusl, or bathing to cool off, does not replace wudu.',
              ru: 'Обязательный гусль от джанабы, менструации или послеродового кровотечения засчитывается и за малое омовение, так как малое осквернение входит в большое; однако по сунне в начале гусля совершают омовение. Желательный гусль, например пятничный, или купание для охлаждения не заменяет омовения.',
              ar: 'الغسل الواجب من الجنابة أو الحيض أو النفاس يجزئ عن الوضوء لدخول الحدث الأصغر في الأكبر، والسنة أن يتوضأ في أول غسله. أما الغسل المستحب كغسل الجمعة أو الغسل للتبرد فلا يجزئ عن الوضوء.',
              tr: 'Cünüplük, hayız veya nifastan alınan farz gusül abdesti de yerine getirir, çünkü küçük hades büyüğün içine girer; yine de guslün başında abdest almak sünnettir. Cuma guslü gibi müstehap gusül veya serinlemek için yıkanmak ise abdestin yerini tutmaz.',
            },
            ref: { az: 'İslamQA 99543', en: 'IslamQA 99543', ru: 'IslamQA 99543', ar: 'الإسلام سؤال وجواب 99543', tr: 'IslamQA 99543' }, // lang-ok[IslamQA]: saytın xüsusi adı
            url: 'https://islamqa.info/ar/answers/99543',
          },
          {
            q: { az: 'Qüsl alarkən nəsə demək lazımdırmı?', en: 'Is there something to say during ghusl?', ru: 'Нужно ли что-то произносить во время гусля?', ar: 'هل للغسل ذكر خاص؟', tr: 'Gusül alırken bir şey söylemek gerekir mi?' },
            a: {
              az: 'Niyyət ürəkdədir və dillə deyilmir. Qüsl üçün səhih Sünnədə xüsusi dua yoxdur; hər bir üzv üçün “xüsusi dualar” oxumağın əsli yoxdur.',
              en: 'The intention is in the heart and is not spoken. There is no special du‘a for ghusl in the authentic Sunnah; “special supplications” for each limb have no basis.',
              ru: 'Намерение — в сердце, его не произносят. В достоверной Сунне нет особой мольбы для гусля; «особые мольбы» для каждой части тела не имеют основы.',
              ar: 'النية محلها القلب ولا يُتلفظ بها، ولم يثبت في السنة الصحيحة دعاء خاص بالغسل، والأدعية المخصوصة لكل عضو لا أصل لها.',
              tr: 'Niyet kalptedir ve dille söylenmez. Sahih Sünnette gusle özel bir dua yoktur; her uzuv için “özel dualar” okumanın aslı yoktur.',
            },
          },
          {
            q: { az: 'Su tapılmasa və ya istifadəsi zərərli olsa nə etməli?', en: 'What if there is no water, or using it is harmful?', ru: 'Что делать, если нет воды или её использование вредно?', ar: 'ماذا يفعل إذا لم يجد الماء أو تضرر باستعماله؟', tr: 'Su bulunmazsa veya kullanmak zararlıysa ne yapmalı?' },
            a: {
              az: 'Bu halda qüslün yerinə təyəmmüm edilir. Ətraflı: “Təyəmmüm” dərsi.',
              en: 'In that case tayammum is performed in place of ghusl. See the lesson “Tayammum”.',
              ru: 'В этом случае вместо гусля совершают таяммум. Подробно: урок «Таяммум».',
              ar: 'يتيمم بدلًا من الغسل، والتفصيل في درس «التيمم».',
              tr: 'Bu durumda gusül yerine teyemmüm edilir. Ayrıntı: “Teyemmüm” dersi.',
            },
          },
        ] },
      ],
    },
  ],
  sources: [
    { label: 'Səhih əl-Buxari, Kitab əl-Ğusl — İmam əl-Buxari' },
    { label: 'Səhih Müslim, Kitab əl-Heyz — İmam Müslim' },
    { label: 'Sünən Əbu Davud, Sünən ət-Tirmizi — əl-Albaninin təhqiqi ilə' },
    { label: 'əş-Şərh əl-Mumti‘ — Şeyx Muhəmməd ibn Saleh əl-Useymin' },
    { label: 'İslamQA 99543 — Hel yucziu-l-ğuslu ‘ani-l-vudu’', url: 'https://islamqa.info/ar/answers/99543' },
    { label: 'Hadith API (fawazahmed0) — mətn və nömrələrin yoxlanması', url: 'https://github.com/fawazahmed0/hadith-api' },
  ],
}
