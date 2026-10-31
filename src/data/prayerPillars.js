// ═══════════════════════════════════════════════════════
// Namazın şərtləri (9), rüknləri (14) və vacibləri (8) — /prayerguide
//
// Mənbə: Şeyx Muhəmməd ibn Abdülvəhhab, «Şürutus-salati və ərkanuha və
// vacibatuha» risaləsi (Hənbəli fiqhinin bölgüsü; maddələr risalənin
// sırası ilədir). Bəzi maddələrdə (məs. son təşəhhüddəki salavat, ikinci
// salam) fəqihlər arasında fərqli rəy var — səhifədə bu qeyd göstərilir.
// Fərz rükət sayı və səfərdə qısaldılma: Buxari 350, Müslim 685 (Aişə) —
// hadith-api (eng-bukhari 350, eng-muslim arabicnumber 685) ilə yoxlanılıb.
// Namazın özü (addımlar) burada TƏKRARLANMIR — bələdçi addımlarındadır.
// ═══════════════════════════════════════════════════════

const L = (az, en, ru, ar, tr) => ({ az, en, ru, ar, tr })

export const PILLARS_TXT = {
  eyebrow: L('Fiqh', 'Fiqh', 'Фикх', 'الفقه', 'Fıkıh'),
  title: L('Namazın quruluşu: şərt, rükn, vacib', 'The structure of prayer: conditions, pillars, obligations', 'Устройство намаза: условия, столпы, обязательные действия', 'شروط الصلاة وأركانها وواجباتها', 'Namazın yapısı: şart, rükün, vacip'),
  lead: L(
    'Namazın düzgün olması üçün nəyin vacib olduğunu üç qrupda görün — hər qrupun hökmü fərqlidir.',
    'See what a valid prayer requires in three groups — each group has a different ruling.',
    'Что требуется для действительности намаза — в трёх группах, у каждой своё положение.',
    'ما تتوقف عليه صحة الصلاة في ثلاث مجموعات، لكلٍّ منها حكم.',
    'Namazın sahih olması için gerekenleri üç grupta görün — her grubun hükmü farklıdır.',
  ),
  tabs: L('Qruplar', 'Groups', 'Группы', 'المجموعات', 'Gruplar'),
  source: L(
    'Mənbə: Muhəmməd ibn Abdülvəhhab, «Şürutus-salah və ərkanuha və vacibatuha» (Hənbəli fiqhinin bölgüsü). Bəzi maddələrdə alimlər arasında fərqli rəy var — öz vəziyyətiniz üçün imamınızdan soruşun.',
    'Source: Muhammad ibn Abd al-Wahhab, “Shurut as-Salah wa Arkanuha wa Wajibatuha” (the Hanbali classification). Scholars differ on some items — ask your imam about your own situation.',
    'Источник: Мухаммад ибн Абд аль-Ваххаб, «Шурут ас-салят ва аркануха ва ваджибатуха» (классификация ханбалитского фикха). По некоторым пунктам у учёных есть разногласия — спросите своего имама.',
    'المصدر: محمد بن عبد الوهاب، «شروط الصلاة وأركانها وواجباتها» (على تقسيم الحنابلة)، وفي بعض المسائل خلاف بين العلماء، فاسأل إمامك عما يخصك.',
    'Kaynak: Muhammed b. Abdülvehhab, “Şurûtu’s-Salât ve Erkânühâ ve Vâcibâtühâ” (Hanbelî fıkhının tasnifi). Bazı maddelerde âlimler arasında farklı görüş vardır — kendi durumunuz için imamınıza danışın.',
  ),
}

export const PILLAR_GROUPS = [
  {
    id: 'shurut', icon: 'shield', count: 9,
    name: L('Şərtlər', 'Conditions', 'Условия', 'الشروط', 'Şartlar'),
    rule: L(
      'Namazdan əvvəl olmalı və bütün namaz boyu qalmalıdır. Biri olmasa, namaz düzgün olmur.',
      'Must be present before the prayer and remain throughout it. If one is missing, the prayer is not valid.',
      'Должны быть до намаза и сохраняться всё время. Без любого из них намаз недействителен.',
      'تكون قبل الصلاة وتستمر فيها، ولا تصح الصلاة بفقد واحد منها.',
      'Namazdan önce bulunmalı ve namaz boyunca devam etmelidir. Biri eksikse namaz sahih olmaz.',
    ),
    items: [
      L('İslam', 'Islam', 'Ислам', 'الإسلام', 'İslam'),
      L('Ağıl', 'Sound mind', 'Разум', 'العقل', 'Akıl'),
      L('Təmyiz — yaxşını pisdən ayıra bilən yaş', 'Discernment — the age of understanding', 'Различение (тамйиз) — возраст понимания', 'التمييز', 'Temyiz — iyiyi kötüden ayırabilecek yaş'),
      L('Hədəsin qaldırılması — dəstəmaz və ya qüsl', 'Removing ritual impurity — wudu or ghusl', 'Снятие ритуальной нечистоты — омовение или гусль', 'رفع الحدث', 'Hadesten taharet — abdest veya gusül'),
      L('Bədən, paltar və yerin nəcasətdən təmizliyi', 'Body, clothes and place free of impurity', 'Чистота тела, одежды и места от нечистот', 'إزالة النجاسة', 'Beden, elbise ve yerin necasetten temizliği'),
      L('Övrətin örtülməsi', 'Covering the awrah', 'Покрытие аурата', 'ستر العورة', 'Avret yerinin örtülmesi'),
      L('Namaz vaxtının daxil olması', 'The prayer time having begun', 'Наступление времени намаза', 'دخول الوقت', 'Namaz vaktinin girmesi'),
      L('Qibləyə yönəlmək', 'Facing the qibla', 'Обращение к кибле', 'استقبال القبلة', 'Kıbleye yönelmek'),
      L('Niyyət (qəlbdə)', 'Intention (in the heart)', 'Намерение (в сердце)', 'النية', 'Niyet (kalpte)'),
    ],
  },
  {
    id: 'arkan', icon: 'star', count: 14,
    name: L('Rüknlər', 'Pillars', 'Столпы', 'الأركان', 'Rükünler'),
    rule: L(
      'Namazın özüdür. Unudulsa belə səhv səcdəsi ilə düzəlmir — həmin rükn (və ya rükət) yerinə yetirilməlidir.',
      'The prayer itself. Even if forgotten, a prostration of forgetfulness does not replace it — the pillar (or rak‘ah) must be performed.',
      'Сама суть намаза. Даже если забыт, земной поклон забывчивости его не заменяет — столп (или ракаат) нужно совершить.',
      'هي ذات الصلاة، لا تسقط عمدًا ولا سهوًا، ولا يجبرها سجود السهو، بل يُؤتى بها.',
      'Namazın kendisidir. Unutulsa bile sehiv secdesiyle telafi edilmez — o rükün (veya rekat) yerine getirilmelidir.',
    ),
    items: [
      L('Gücü çatana ayaq üstə durmaq (qiyam)', 'Standing, for one who is able', 'Стояние для того, кто в силах', 'القيام مع القدرة', 'Gücü yetene ayakta durmak (kıyam)'),
      L('İhram təkbiri', 'The opening takbir', 'Открывающий такбир', 'تكبيرة الإحرام', 'İftitah tekbiri'),
      L('Fatihənin oxunması', 'Reciting al-Fatiha', 'Чтение аль-Фатихи', 'قراءة الفاتحة', 'Fatiha’nın okunması'),
      L('Rüku', 'Bowing (ruku‘)', 'Поясной поклон', 'الركوع', 'Rükû'),
      L('Rükudan qalxmaq', 'Rising from ruku‘', 'Выпрямление после поклона', 'الرفع منه', 'Rükûdan doğrulmak'),
      L('Yeddi üzv üzərində səcdə', 'Prostration on the seven parts', 'Земной поклон на семи частях тела', 'السجود على الأعضاء السبعة', 'Yedi uzuv üzerine secde'),
      L('Səcdədən qalxıb düzəlmək', 'Rising up from prostration', 'Подъём из земного поклона', 'الاعتدال منه', 'Secdeden doğrulmak'),
      L('İki səcdə arası oturuş', 'Sitting between the two prostrations', 'Сидение между двумя поклонами', 'الجلسة بين السجدتين', 'İki secde arası oturuş'),
      L('Bütün rüknlərdə sükunət (tələsməmək)', 'Calmness in every pillar (not rushing)', 'Спокойствие в каждом столпе (без спешки)', 'الطمأنينة في جميع الأركان', 'Bütün rükünlerde itminan (acele etmemek)'),
      L('Rüknlərin ardıcıllığı', 'Performing the pillars in order', 'Порядок столпов', 'الترتيب', 'Rükünlerin sırası'),
      L('Son təşəhhüd', 'The final tashahhud', 'Последний ташаххуд', 'التشهد الأخير', 'Son teşehhüd'),
      L('Son təşəhhüd üçün oturuş', 'Sitting for the final tashahhud', 'Сидение для последнего ташаххуда', 'الجلوس له', 'Son teşehhüd için oturuş'),
      L('Peyğəmbərə ﷺ salavat', 'Sending salah upon the Prophet ﷺ', 'Салават Пророку ﷺ', 'الصلاة على النبي ﷺ', 'Peygamber’e ﷺ salavat'),
      L('İki salam', 'The two salams', 'Два приветствия (таслим)', 'التسليمتان', 'İki selam'),
    ],
  },
  {
    id: 'wajibat', icon: 'check', count: 8,
    name: L('Vaciblər', 'Obligations', 'Обязательные', 'الواجبات', 'Vacipler'),
    rule: L(
      'Qəsdən tərk edilsə namaz batil olur; unudulsa, səhv səcdəsi ilə düzəlir.',
      'Leaving one deliberately invalidates the prayer; if forgotten, a prostration of forgetfulness makes up for it.',
      'Умышленный пропуск делает намаз недействительным; если забыто — восполняется земным поклоном забывчивости.',
      'تبطل الصلاة بتركها عمدًا، وتسقط سهوًا ويجبرها سجود السهو.',
      'Kasten terk edilirse namaz bozulur; unutulursa sehiv secdesiyle telafi edilir.',
    ),
    items: [
      L('İhram təkbirindən başqa bütün təkbirlər', 'Every takbir other than the opening one', 'Все такбиры, кроме открывающего', 'جميع التكبيرات غير تكبيرة الإحرام', 'İftitah tekbiri dışındaki bütün tekbirler'),
      L('Rükuda «Subhanə Rabbiyəl-azim»', '“Subhana Rabbiyal-‘Azim” in ruku‘', '«Субхана Раббияль-‘Азым» в поклоне', 'قول: سبحان ربي العظيم في الركوع', 'Rükûda “Sübhâne Rabbiye’l-azîm”'),
      L('İmam və tək qılan üçün «Səmiallahu limən həmidəh»', '“Sami‘a Allahu liman hamidah” — for the imam and one praying alone', '«Сами‘а Ллаху лиман хамидах» — для имама и молящегося в одиночку', 'قول: سمع الله لمن حمده للإمام والمنفرد', 'İmam ve tek kılan için “Semiallâhu limen hamideh”'),
      L('Hamı üçün «Rabbənə va ləkəl-həmd»', '“Rabbana wa lakal-hamd” — for everyone', '«Раббана ва лякаль-хамд» — для всех', 'قول: ربنا ولك الحمد للكل', 'Herkes için “Rabbenâ ve leke’l-hamd”'),
      L('Səcdədə «Subhanə Rabbiyəl-əla»', '“Subhana Rabbiyal-A‘la” in prostration', '«Субхана Раббияль-А‘ля» в земном поклоне', 'قول: سبحان ربي الأعلى في السجود', 'Secdede “Sübhâne Rabbiye’l-a‘lâ”'),
      L('İki səcdə arasında «Rabbiğfir li»', '“Rabbighfir li” between the prostrations', '«Раббигфир ли» между поклонами', 'قول: رب اغفر لي بين السجدتين', 'İki secde arasında “Rabbiğfir lî”'),
      L('Birinci təşəhhüd', 'The first tashahhud', 'Первый ташаххуд', 'التشهد الأول', 'İlk teşehhüd'),
      L('Birinci təşəhhüd üçün oturuş', 'Sitting for the first tashahhud', 'Сидение для первого ташаххуда', 'الجلوس له', 'İlk teşehhüd için oturuş'),
    ],
  },
]

// Gündəlik fərz rükətlər və səfərdə qısaldılma
export const RAKAT_TXT = {
  eyebrow: L('Bir baxışda', 'At a glance', 'С одного взгляда', 'في لمحة', 'Bir bakışta'),
  title: L('Gündə 17 fərz rükət', '17 obligatory rak‘ahs a day', '17 обязательных ракаатов в день', 'سبع عشرة ركعة مفروضة في اليوم', 'Günde 17 farz rekat'),
  lead: L(
    'Hər namazın neçə rükət olduğu və bir rükətin hansı hərəkətlərdən qurulduğu.',
    'How many rak‘ahs each prayer has, and which movements make up one rak‘ah.',
    'Сколько ракаатов в каждом намазе и из каких движений состоит один ракаат.',
    'عدد ركعات كل صلاة، ومن أي الحركات تتكون الركعة الواحدة.',
    'Her namazın kaç rekat olduğu ve bir rekatın hangi hareketlerden oluştuğu.',
  ),
  chart: L('Fərz rükətlərin sayı', 'Number of obligatory rak‘ahs', 'Число обязательных ракаатов', 'عدد الركعات المفروضة', 'Farz rekat sayısı'),
  chartSub: L('cəmi 17', '17 in total', 'всего 17', 'المجموع 17', 'toplam 17'),
  note: L(
    'Səfərdə dörd rükətlilər iki rükət qılınır (Buxari 350, Müslim 685) — ətraflı «Səfər namazı» dərsində.',
    'While travelling, the four-rak‘ah prayers are prayed as two (al-Bukhari 350, Muslim 685) — details in the “Prayer while travelling” lesson.',
    'В пути четырёхракаатные намазы совершаются по два ракаата (аль-Бухари 350, Муслим 685) — подробно в уроке «Намаз в пути».',
    'وفي السفر تُصلى الرباعية ركعتين (البخاري 350، مسلم 685)، والتفصيل في درس «صلاة المسافر».',
    'Yolculukta dört rekatlı namazlar iki rekat kılınır (Buhârî 350, Müslim 685) — ayrıntısı “Yolculuk namazı” dersinde.',
  ),
  rakahTitle: L('Bir rükət — 6 hərəkət', 'One rak‘ah — 6 movements', 'Один ракаат — 6 движений', 'الركعة: ست حركات', 'Bir rekat — 6 hareket'),
  rakahSub: L(
    'Hər rükət qiyamla başlayır və ikinci səcdə ilə bitir; ikinci və sonuncu rükətdən sonra təşəhhüd üçün oturulur.',
    'Each rak‘ah starts standing and ends with the second prostration; after the second and the last rak‘ah you sit for the tashahhud.',
    'Каждый ракаат начинается стоя и заканчивается вторым земным поклоном; после второго и последнего ракаата садятся для ташаххуда.',
    'تبدأ كل ركعة بالقيام وتنتهي بالسجدة الثانية، ويُجلس للتشهد بعد الثانية والأخيرة.',
    'Her rekat kıyamla başlar ve ikinci secdeyle biter; ikinci ve son rekattan sonra teşehhüd için oturulur.',
  ),
}
