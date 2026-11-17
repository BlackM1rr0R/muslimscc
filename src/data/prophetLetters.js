// ═══════════════════════════════════════════════════════
// Peyğəmbərin ﷺ hökmdarlara məktubları — məlumat (components/ProphetLetters.jsx)
//
// MƏNBƏ QAYDASI (dini məzmun):
// • Hədis istinadları yalnız saytın öz hədis mənbəyindən — fawazahmed0/hadith-api
//   (src/api/hadithLibrary.js, "Hədis kitabxanası" səhifəsi). Hər istinadın nömrəsi
//   və mətni həmin mənbədə yoxlanılıb (2026-11-17):
//     Buxari 7      (ara-bukhari, bölmə 1)  — Hirakl, Dihyə, Busra, İliya, sülh müddəti
//     Buxari 64     (ara-bukhari, bölmə 3)  — Kəsra məktubu cırdı (elçinin adı yoxdur)
//     Buxari 4424   (ara-bukhari, bölmə 64) — Kəsra; elçi Abdullah ibn Huzafə əs-Səhmi
//     Buxari 1245   (ara-bukhari, bölmə 23) — Nəcaşinin ölüm xəbəri və cənazə namazı
//     Müslim 1773   (ara-muslim, kitabxana № 4607, bölmə 32) — Hirakl, Dihyə
//     Müslim 1774   (ara-muslim, kitabxana № 4609, bölmə 32) — Kəsra, Qeysər, Nəcaşi
// • QUOTE sahələri (end: true — parça hədisin sonudur) hədis mətninin hərfi-hərfinə (hərəkələri ilə) PARÇASIDIR —
//   hadith-api ərəb nəşrindən kəsilib, heç nə dəyişdirilməyib. Tərcümə edilmir.
// • "facts" — bizim sözlərimizlə qısa XÜLASƏ (tərcümə deyil), hər birinin
//   istinadı yanındadır. Mənbədə olmayan heç nə yazılmayıb.
// • Saytın digər məlumatı: Hüdeybiyyə müqaviləsi — 628 (data/islamicHistory.js,
//   EVENTS "Treaty of Hudaybiyyah"); Həbəşistana hicrət və Nəcaşinin himayəsi —
//   615 (data/islamicHistory.js, EVENTS "Migration to Abyssinia"); Nəcaşiyə qiyabi
//   cənazə namazı — Buxari 1245 (data/lessons/janazah.js).
// • Müqövqis (Misir) və digər hökmdarlar QƏSDƏN yoxdur: saytın məlumatında və
//   yuxarıdakı hədislərdə onlar haqqında məlumat yoxdur.
// • Xəritə nöqtələri: Mədinə — media/SiraMaps.jsx (G.medina); Mədain —
//   media/SiraMaps.jsx (Rəşidi fəthlər xəritəsi); Məscidi-Əqsa — data/prophetPlaces.js
//   (aqsa); Busra və Həbəşistan (Aksum ətrafı) — ümumi coğrafiya, təxmini.
// ═══════════════════════════════════════════════════════

/** Yerlər: [enlik, uzunluq] + ad (5 dil). approx — nöqtə təxminidir. */
export const PL_PLACES = {
  medina: { at: [24.4672, 39.6112], name: { az: 'Mədinə', en: 'Medina', ru: 'Медина', ar: 'المدينة', tr: 'Medine' } },
  busra: { at: [32.518, 36.4815], name: { az: 'Busra', en: 'Busra (Bosra)', ru: 'Бусра', ar: 'بصرى', tr: 'Busrâ' } },
  iliya: { at: [31.776, 35.236], name: { az: 'İliya (Qüds)', en: 'Iliya (Jerusalem)', ru: 'Илия (Иерусалим)', ar: 'إيلياء (القدس)', tr: 'İliya (Kudüs)' } },
  madain: { at: [33.09, 44.58], name: { az: 'Mədain', en: 'Ctesiphon', ru: 'Ктесифон', ar: 'المدائن', tr: 'Medâin' } },
  habasha: { at: [14.13, 38.72], approx: true, name: { az: 'Həbəşistan', en: 'Abyssinia', ru: 'Абиссиния', ar: 'الحبشة', tr: 'Habeşistan' } },
}

/** Hədis istinadları. n — çap nömrəsi (göstərilir); lib — hadith-api kitabxana nömrəsi (keçid üçün). */
export const PL_REFS = {
  bukhari7: { book: 'bukhari', n: '7', lib: 7 },
  bukhari64: { book: 'bukhari', n: '64', lib: 64 },
  bukhari4424: { book: 'bukhari', n: '4424', lib: 4424 },
  bukhari1245: { book: 'bukhari', n: '1245', lib: 1245 },
  muslim1773: { book: 'muslim', n: '1773', lib: 4607 },
  muslim1774: { book: 'muslim', n: '1774', lib: 4609 },
}

/** Saytın tarix xronologiyasından (data/islamicHistory.js → EVENTS) */
export const PL_HUDAYBIYYAH = {
  year: { az: '628 e.', en: '628 CE', ru: '628 н.э.', ar: '٦٢٨ م', tr: 'MS 628' },
  title: { az: 'Hüdeybiyyə müqaviləsi', en: 'Treaty of Hudaybiyyah', ru: 'Худайбийский договор', ar: 'صلح الحديبية', tr: 'Hudeybiye Antlaşması' },
}

export const PL_LETTERS = [
  {
    id: 'heraclius',
    color: '#b5522d',
    ruler: { az: 'Hirakl (Herakl)', en: 'Heraclius', ru: 'Ираклий', ar: 'هرقل', tr: 'Herakleios (Hirakl)' },
    rulerAr: 'هِرَقْلُ عَظِيمُ الرُّومِ',
    realm: { az: 'Rum (Bizans) hökmdarı', en: 'Ruler of the Romans (Byzantium)', ru: 'Правитель румов (Византия)', ar: 'عظيم الروم', tr: 'Rum (Bizans) hükümdarı' },
    route: ['medina', 'busra', 'iliya'],
    seat: 'iliya',
    place: {
      az: 'Busra hakimi vasitəsilə; Hirakl Əbu Süfyanı İliyada (Qüdsdə) qəbul etdi',
      en: 'Via the governor of Busra; Heraclius received Abu Sufyan in Iliya (Jerusalem)',
      ru: 'Через правителя Бусры; Ираклий принял Абу Суфьяна в Илии (Иерусалиме)',
      ar: 'عن طريق عظيم بصرى؛ واستقبل هرقل أبا سفيان بإيلياء',
      tr: 'Busrâ valisi aracılığıyla; Herakleios Ebû Süfyân’ı İliya’da (Kudüs) kabul etti',
    },
    envoy: { name: { az: 'Dihyə əl-Kəlbi', en: 'Dihyah al-Kalbi', ru: 'Дихья аль-Кальби', ar: 'دحية الكلبي', tr: 'Dıhye el-Kelbî' }, refs: ['bukhari7', 'muslim1773'] },
    when: {
      text: {
        az: 'Peyğəmbərlə ﷺ Qureyş arasındakı sülh müddətində',
        en: 'During the truce between the Prophet ﷺ and Quraysh',
        ru: 'В период перемирия между Пророком ﷺ и курайшитами',
        ar: 'في مدة الصلح بين النبي ﷺ وقريش',
        tr: 'Peygamber ﷺ ile Kureyş arasındaki barış süresinde',
      },
      refs: ['bukhari7'],
      hudaybiyyah: true,
    },
    facts: [
      {
        text: {
          az: 'Məktubu Dihyə əl-Kəlbi Busra hakiminə apardı, o da onu Hirakla çatdırdı.',
          en: 'Dihyah al-Kalbi took the letter to the governor of Busra, who passed it on to Heraclius.',
          ru: 'Дихья аль-Кальби доставил письмо правителю Бусры, а тот передал его Ираклию.',
          ar: 'حمل دحية الكلبي الكتاب إلى عظيم بصرى، فدفعه إلى هرقل.',
          tr: 'Mektubu Dıhye el-Kelbî Busrâ valisine götürdü, o da Herakleios’a ulaştırdı.',
        },
        refs: ['bukhari7', 'muslim1773'],
      },
      {
        text: {
          az: 'Hirakl o vaxt Şamda ticarətlə məşğul olan Əbu Süfyanı və yanındakı Qureyşliləri İliyada yanına çağırıb Peyğəmbər ﷺ haqqında sorğu-sual etdi, sonra məktubu gətirtdi və oxudu.',
          en: 'Heraclius summoned Abu Sufyan and the Quraysh traders then in Syria to him in Iliya, questioned him about the Prophet ﷺ, then called for the letter and read it.',
          ru: 'Ираклий вызвал к себе в Илию Абу Суфьяна и курайшитских купцов, бывших тогда в Шаме, расспросил его о Пророке ﷺ, а затем велел принести письмо и прочитал его.',
          ar: 'استدعى هرقل أبا سفيان ومن معه من تجار قريش الذين كانوا بالشام إلى إيلياء، وسأله عن النبي ﷺ، ثم دعا بالكتاب فقرأه.',
          tr: 'Herakleios, o sırada Şam’da ticaretle uğraşan Ebû Süfyân’ı ve yanındaki Kureyşlileri İliya’ya çağırıp Peygamber ﷺ hakkında sorguladı, ardından mektubu getirtip okudu.',
        },
        refs: ['bukhari7'],
      },
    ],
    quote: { ar: 'مِنْ مُحَمَّدٍ عَبْدِ اللَّهِ وَرَسُولِهِ إِلَى هِرَقْلَ عَظِيمِ الرُّومِ', ref: 'bukhari7' },
    refs: ['bukhari7', 'muslim1773', 'muslim1774'],
  },
  {
    id: 'khosrow',
    color: '#6b4fc4',
    ruler: { az: 'Kəsra', en: 'Kisra (Khosrow)', ru: 'Кисра (Хосров)', ar: 'كسرى', tr: 'Kisrâ (Hüsrev)' },
    rulerAr: 'كِسْرَى',
    realm: { az: 'Fars (Sasani) şahı', en: 'Shah of Persia (Sasanian)', ru: 'Шах Персии (Сасаниды)', ar: 'ملك الفرس', tr: 'Fars (Sâsânî) şahı' },
    route: ['medina', 'madain'],
    seat: 'madain',
    place: {
      az: 'Bəhreyn hakimi vasitəsilə. Hədisdə şəhərin adı çəkilmir — xəritədə Sasani paytaxtı Mədain göstərilib',
      en: 'Via the governor of Bahrain. The hadith names no city — the map shows the Sasanian capital, Ctesiphon',
      ru: 'Через правителя Бахрейна. Город в хадисе не назван — на карте показана сасанидская столица Ктесифон',
      ar: 'عن طريق عظيم البحرين. لم يُذكر اسم المدينة في الحديث، وفي الخريطة عاصمة الساسانيين المدائن',
      tr: 'Bahreyn valisi aracılığıyla. Hadiste şehir adı geçmez — haritada Sâsânî başkenti Medâin gösterildi',
    },
    envoy: { name: { az: 'Abdullah ibn Huzafə əs-Səhmi', en: 'Abdullah ibn Hudhafah as-Sahmi', ru: 'Абдуллах ибн Хузафа ас-Сахми', ar: 'عبد الله بن حذافة السهمي', tr: 'Abdullah b. Huzâfe es-Sehmî' }, refs: ['bukhari4424'] },
    facts: [
      {
        text: {
          az: 'Elçiyə məktubu Bəhreyn hakiminə verməsi tapşırıldı; hakim onu Kəsraya göndərdi.',
          en: 'The envoy was told to hand the letter to the governor of Bahrain, who sent it on to Kisra.',
          ru: 'Посланцу было велено передать письмо правителю Бахрейна, а тот отправил его Кисре.',
          ar: 'أُمر الرسول أن يدفع الكتاب إلى عظيم البحرين، فدفعه عظيم البحرين إلى كسرى.',
          tr: 'Elçiye mektubu Bahreyn valisine vermesi emredildi; vali onu Kisrâ’ya gönderdi.',
        },
        refs: ['bukhari64', 'bukhari4424'],
      },
      {
        text: {
          az: 'Kəsra məktubu oxuyanda onu cırıb parça-parça etdi.',
          en: 'When Kisra read the letter, he tore it to pieces.',
          ru: 'Прочитав письмо, Кисра разорвал его.',
          ar: 'لما قرأ كسرى الكتاب مزّقه.',
          tr: 'Kisrâ mektubu okuyunca onu yırtıp parçaladı.',
        },
        refs: ['bukhari64', 'bukhari4424'],
      },
    ],
    quote: { ar: 'فَلَمَّا قَرَأَهُ مَزَّقَهُ', ref: 'bukhari4424' },
    refs: ['bukhari64', 'bukhari4424', 'muslim1774'],
  },
  {
    id: 'negus',
    color: '#1f7a58',
    ruler: { az: 'Nəcaşi', en: 'The Negus (an-Najashi)', ru: 'Негус (ан-Наджаши)', ar: 'النجاشي', tr: 'Necâşî' },
    rulerAr: 'النَّجَاشِيُّ',
    realm: { az: 'Həbəşistan hökmdarı', en: 'King of Abyssinia', ru: 'Царь Абиссинии', ar: 'ملك الحبشة', tr: 'Habeşistan hükümdarı' },
    route: ['medina', 'habasha'],
    seat: 'habasha',
    place: {
      az: 'Həbəşistan (xəritədə nöqtə təxminidir)',
      en: 'Abyssinia (the map point is approximate)',
      ru: 'Абиссиния (точка на карте приблизительна)',
      ar: 'الحبشة (الموضع في الخريطة تقريبي)',
      tr: 'Habeşistan (haritadaki nokta yaklaşıktır)',
    },
    envoy: null,
    facts: [
      {
        text: {
          az: 'Ənəs rəvayət edir ki, Peyğəmbər ﷺ Kəsraya, Qeysərə, Nəcaşiyə və hər bir zorba hökmdara yazıb onları Allaha dəvət etdi.',
          en: 'Anas reports that the Prophet ﷺ wrote to Kisra, to Caesar, to the Negus and to every tyrant ruler, calling them to Allah.',
          ru: 'Анас передаёт, что Пророк ﷺ написал Кисре, Кайсару, Негусу и каждому тирану, призывая их к Аллаху.',
          ar: 'روى أنس أن النبي ﷺ كتب إلى كسرى وقيصر والنجاشي وكل جبار يدعوهم إلى الله.',
          tr: 'Enes’in rivayetine göre Peygamber ﷺ Kisrâ’ya, Kayser’e, Necâşî’ye ve her zorba hükümdara yazıp onları Allah’a davet etti.',
        },
        refs: ['muslim1774'],
      },
      {
        text: {
          az: 'Həmin rəvayətdə deyilir ki, bu Nəcaşi Peyğəmbərin ﷺ cənazə namazını qıldığı Nəcaşi deyil.',
          en: 'The same narration states that this Negus was not the Negus over whom the Prophet ﷺ prayed the funeral prayer.',
          ru: 'В том же предании сказано, что это не тот Негус, над которым Пророк ﷺ совершил погребальную молитву.',
          ar: 'وفي الرواية نفسها أنه ليس النجاشي الذي صلى عليه النبي ﷺ.',
          tr: 'Aynı rivayette bu Necâşî’nin, Peygamber’in ﷺ cenaze namazını kıldığı Necâşî olmadığı belirtilir.',
        },
        refs: ['muslim1774'],
      },
    ],
    // Fərqləndirmə: saytdakı digər Nəcaşi məlumatı (məktubla qarışdırılmasın)
    context: {
      text: {
        az: 'Saytda Nəcaşi haqqında başqa məlumat da var: müsəlmanlar 615-ci ildə Həbəşistana hicrət edib Nəcaşinin himayəsinə sığındılar (tarix xronologiyası); Peyğəmbər ﷺ Nəcaşinin ölüm xəbərini verib ona qiyabi cənazə namazı qıldı (Buxari 1245). Müslim 1774-ə görə məktub alan Nəcaşi cənazə namazı qılınan Nəcaşi deyil.',
        en: 'The site has other information about a Negus: in 615 CE the Muslims migrated to Abyssinia and sought refuge with the Negus (history timeline); the Prophet ﷺ announced the death of the Negus and prayed over him in absentia (Bukhari 1245). According to Muslim 1774, the Negus who received the letter is not the one prayed over.',
        ru: 'На сайте есть и другие сведения о Негусе: в 615 г. мусульмане переселились в Абиссинию и нашли убежище у Негуса (хронология истории); Пророк ﷺ сообщил о смерти Негуса и совершил над ним заочную погребальную молитву (Бухари 1245). Согласно Муслиму 1774, Негус, получивший письмо, — не тот, над которым была совершена молитва.',
        ar: 'في الموقع معلومات أخرى عن النجاشي: هاجر المسلمون إلى الحبشة سنة ٦١٥ م والتجؤوا إلى النجاشي (التسلسل التاريخي)، ونعى النبي ﷺ النجاشي وصلى عليه صلاة الغائب (البخاري ١٢٤٥). وفي مسلم ١٧٧٤ أن النجاشي الذي كُتب إليه ليس الذي صُلّي عليه.',
        tr: 'Sitede Necâşî hakkında başka bilgiler de var: Müslümanlar MS 615’te Habeşistan’a hicret edip Necâşî’nin himayesine sığındılar (tarih kronolojisi); Peygamber ﷺ Necâşî’nin ölüm haberini verip onun gıyabi cenaze namazını kıldı (Buhârî 1245). Müslim 1774’e göre mektubu alan Necâşî, cenaze namazı kılınan Necâşî değildir.',
      },
      refs: ['bukhari1245'],
    },
    quote: { ar: 'كَتَبَ إِلَى كِسْرَى وَإِلَى قَيْصَرَ وَإِلَى النَّجَاشِيِّ وَإِلَى كُلِّ جَبَّارٍ يَدْعُوهُمْ إِلَى اللَّهِ تَعَالَى وَلَيْسَ بِالنَّجَاشِيِّ الَّذِي صَلَّى عَلَيْهِ النَّبِيُّ صلى الله عليه وسلم', ref: 'muslim1774', end: true },
    refs: ['muslim1774'],
  },
]

export const PL_IDS = PL_LETTERS.map(l => l.id)
