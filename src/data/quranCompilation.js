// ═══════════════════════════════════════════════════════
// "Quran necə toplandı" (/quran-history) — 6 mərhələ: Hiradan bugünkü mushafa
//
// QAYDALAR (sahibin məzmun siyasəti, docs/TEAM.md):
// • Ərəbcə sitatlar HƏRFBƏHƏRF saytın mənbələrindəndir — əldən yazılmayıb:
//   – ayələr: saytın Quran oxuyucusunun mətni — alquran.cloud "quran-uthmani" (seo-data/quran/
//     quran-uthmani.json; 96:1-də surənin əvvəlindəki bəsmələ ayrılıb): 96:1–5, 15:9
//   – hədislər: fawazahmed0/hadith-api, ara-bukhari (saytın hədis kitabxanasının mənbəyi,
//     src/api/hadithLibrary.js) — 4986, 4987, 4679, 4953, 3851, 3 (yoxlanıldı 2026-11-28).
//     Sitat hədisin mətnindən kəsilmiş ardıcıl hissədir (unit test mətnin özü ilə yoxlayır:
//     tests/unit/quran-history.test.js → HADITH_AR).
// • Qalan mətnlər sitat DEYİL — mənbələrin qısa, ehtiyatlı xülasəsidir.
// • Mənbədə olmayan tarixlər yalnız "təxminən" və "tarixçilərə görə" kimi verilir (approx).
//   Osmanın nüsxələrinin getdiyi şəhərlər hədisdə yoxdur («hər bölgəyə») — tarixçilərin məşhur
//   rəyidir, sayı barədə fərqli rəylər var (sahnədə ayrıca qeyd).
// • Canlı varlığın təsviri yoxdur (yalnız dağ, səhifə, qələm, xəritə nöqtələri).
// • 5 əsas dil; əlavə dillər ingiliscəyə düşür. Bu fayl QƏSDƏN UI lüğətinə düşmür
//   (scripts/extract-ui-strings.mjs src/data-nı oxumur) — dini/tarixi mətn AI ilə tərcümə olunmur.
// ═══════════════════════════════════════════════════════

// Səhih əl-Buxari: hədis nömrəsi → hədis kitabxanasındakı bölmə (src/data/hadithLibrary.js aralıqları)
export const BUKHARI_SECTION = { 3: 1, 3851: 63, 4679: 65, 4953: 65, 4986: 66, 4987: 66 }

// Osmanın nüsxələri: mərkəz Mədinə, tarixçilərin məşhur rəyindəki şəhərlər (real koordinatlar)
export const QH_CITIES = {
  madinah: { at: [24.4672, 39.6112], origin: true,
    name: { az: 'Mədinə', en: 'Madinah', ru: 'Медина', ar: 'المدينة', tr: 'Medine' } },
  makkah: { at: [21.4225, 39.8262],
    name: { az: 'Məkkə', en: 'Makkah', ru: 'Мекка', ar: 'مكة', tr: 'Mekke' } },
  sham: { at: [33.5138, 36.2765],
    name: { az: 'Şam (Dəməşq)', en: 'Sham (Damascus)', ru: 'Шам (Дамаск)', ar: 'الشام (دمشق)', tr: 'Şam (Dımaşk)' } },
  kufa: { at: [32.0281, 44.4006],
    name: { az: 'Kufə', en: 'Kufa', ru: 'Куфа', ar: 'الكوفة', tr: 'Kûfe' } },
  basra: { at: [30.5085, 47.7804],
    name: { az: 'Bəsrə', en: 'Basra', ru: 'Басра', ar: 'البصرة', tr: 'Basra' } },
}

export const QH_SCENES = [
  // ── 1. Hira: ilk vəhy ──
  {
    id: 'hira', art: 'hira', approx: true,
    src: ['Quran 96:1-5', 'Buxari 3', 'Buxari 4953', 'Buxari 3851'],
    when: { az: 'Təxminən 610 m. · hicrətdən 13 il əvvəl', en: 'c. 610 CE · 13 years before the Hijrah', ru: 'Около 610 г. · за 13 лет до хиджры', ar: 'نحو سنة 610م · قبل الهجرة بثلاث عشرة سنة', tr: 'Yaklaşık 610 · hicretten 13 yıl önce' },
    title: { az: 'Hira mağarası: «Oxu!»', en: 'The cave of Hira: “Read!”', ru: 'Пещера Хира: «Читай!»', ar: 'غار حراء: ﴿ٱقْرَأْ﴾', tr: 'Hira mağarası: “Oku!”' },
    text: {
      az: 'Peyğəmbər ﷺ qırx yaşında ikən Məkkə yaxınlığındakı Hira mağarasında ibadətə çəkildiyi vaxt ona Ələq surəsinin ilk beş ayəsi nazil oldu. Quranın nazil olması belə başladı.',
      en: 'When the Prophet ﷺ was forty, while he was secluding himself for worship in the cave of Hira near Makkah, the first five verses of Surah al-‘Alaq were revealed to him. This is how the revelation of the Quran began.',
      ru: 'Когда Пророку ﷺ было сорок лет и он уединялся для поклонения в пещере Хира близ Мекки, ему были ниспосланы первые пять аятов суры «Аль-Алак». Так началось ниспослание Корана.',
      ar: 'لما بلغ النبي ﷺ الأربعين، وكان يتعبّد في غار حراء قرب مكة، نزلت عليه الآيات الخمس الأولى من سورة العلق، فكان ذلك بدء نزول القرآن.',
      tr: 'Peygamber ﷺ kırk yaşındayken Mekke yakınındaki Hira mağarasında ibadete çekildiği sırada ona Alak suresinin ilk beş ayeti indirildi. Kur’an’ın inişi böyle başladı.',
    },
    // Oxuyucunun mətni (seo-data/quran/quran-uthmani.json) — hərfbəhərf (96:1–5)
    ayahs: [
      { n: 1, ar: 'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ' },
      { n: 2, ar: 'خَلَقَ ٱلْإِنسَٰنَ مِنْ عَلَقٍ' },
      { n: 3, ar: 'ٱقْرَأْ وَرَبُّكَ ٱلْأَكْرَمُ' },
      { n: 4, ar: 'ٱلَّذِى عَلَّمَ بِٱلْقَلَمِ' },
      { n: 5, ar: 'عَلَّمَ ٱلْإِنسَٰنَ مَا لَمْ يَعْلَمْ' },
    ],
    surah: 96,
  },

  // ── 2. 23 il: əzbər və yazı ──
  {
    id: 'revelation', art: 'materials', approx: true,
    src: ['Buxari 3851', 'Buxari 4986', 'Buxari 4679'],
    when: { az: 'Təxminən 610–632 m. · 23 il', en: 'c. 610–632 CE · 23 years', ru: 'Около 610–632 гг. · 23 года', ar: 'نحو 610–632م · ثلاث وعشرون سنة', tr: 'Yaklaşık 610–632 · 23 yıl' },
    title: { az: 'İyirmi üç il: sinələrdə və yazıda', en: 'Twenty-three years: in hearts and in writing', ru: 'Двадцать три года: в сердцах и на письме', ar: 'ثلاث وعشرون سنة: في الصدور والسطور', tr: 'Yirmi üç yıl: gönüllerde ve yazıda' },
    text: {
      az: 'Vəhy hissə-hissə nazil oldu: Məkkədə 13 il, hicrətdən sonra Mədinədə 10 il. Səhabələr ayələri əzbərləyir, vəhy katibləri isə onları əldə olan yazı vasitələrinə yazırdılar. Zeyd ibn Sabit də Peyğəmbər ﷺ üçün vəhy yazanlardan idi. Sonralar Quran toplananda o, bu yazılardan və əzbər bilənlərin yaddaşından istifadə etdi.',
      en: 'The revelation came down in portions: 13 years in Makkah and, after the Hijrah, 10 years in Madinah. The Companions memorised the verses, and the scribes of the revelation wrote them on whatever materials they had. Zayd ibn Thabit was one of those who wrote down the revelation for the Prophet ﷺ. Later, when the Quran was gathered, he drew on these writings and on the memories of those who knew it by heart.',
      ru: 'Откровение ниспосылалось частями: 13 лет в Мекке и, после хиджры, 10 лет в Медине. Сподвижники заучивали аяты, а писцы откровения записывали их на том, что было под рукой. Зайд ибн Сабит был одним из тех, кто записывал откровение для Пророка ﷺ. Позже, когда Коран собирали, он опирался на эти записи и на память знающих его наизусть.',
      ar: 'نزل الوحي منجَّمًا: ثلاث عشرة سنة بمكة، ثم عشر سنين بالمدينة بعد الهجرة. وكان الصحابة يحفظون الآيات، ويكتبها كُتّاب الوحي على ما تيسّر لهم، وكان زيد بن ثابت ممن يكتب الوحي للنبي ﷺ. ولما جُمع القرآن بعد ذلك تتبّعه زيد من هذه المكتوبات ومن صدور الحفّاظ.',
      tr: 'Vahiy parça parça indi: Mekke’de 13 yıl, hicretten sonra Medine’de 10 yıl. Sahabe ayetleri ezberliyor, vahiy kâtipleri de onları ellerindeki malzemelere yazıyordu. Zeyd b. Sâbit de Peygamber ﷺ için vahiy yazanlardandı. Sonraları Kur’an toplanırken bu yazılardan ve hafızların ezberinden yararlandı.',
    },
    quotes: [
      { ar: 'فَتَتَبَّعْتُ الْقُرْآنَ أَجْمَعُهُ مِنَ الْعُسُبِ وَاللِّخَافِ وَصُدُورِ الرِّجَالِ', src: 'Buxari 4986' },
    ],
    // Materiallar — sözlər hədislərin mətnindəndir (4986: العسب، اللخاف، صدور الرجال; 4679: الرقاع، الأكتاف)
    materials: [
      { ar: 'الْعُسُبِ', src: 'Buxari 4986',
        name: { az: 'xurma budaqları', en: 'palm-leaf stalks', ru: 'стебли пальмовых листьев', ar: 'جريد النخل', tr: 'hurma dalları' } },
      { ar: 'اللِّخَافِ', src: 'Buxari 4986',
        name: { az: 'nazik yastı daşlar', en: 'thin flat stones', ru: 'тонкие плоские камни', ar: 'الحجارة الرقيقة', tr: 'ince yassı taşlar' } },
      { ar: 'الرِّقَاعِ', src: 'Buxari 4679',
        // lang-ok[perqament]: Azərbaycan sözüdür (perqament — dəridən yazı vərəqi)
        name: { az: 'dəri və perqament parçaları', en: 'pieces of leather and parchment', ru: 'куски кожи и пергамента', ar: 'قطع الجلد والرَّقّ', tr: 'deri ve parşömen parçaları' } },
      { ar: 'الأَكْتَافِ', src: 'Buxari 4679',
        name: { az: 'kürək sümükləri', en: 'shoulder blades', ru: 'лопаточные кости', ar: 'عظام الأكتاف', tr: 'kürek kemikleri' } },
      { ar: 'صُدُورِ الرِّجَالِ', src: 'Buxari 4986',
        name: { az: 'əzbər bilənlərin yaddaşı', en: 'the memories of those who knew it by heart', ru: 'память знающих наизусть', ar: 'حفظ الحفّاظ', tr: 'hafızların ezberi' } },
    ],
  },

  // ── 3. Yəmamə → Əbu Bəkrin tapşırığı ──
  {
    id: 'yamama', art: 'gather', approx: true,
    src: ['Buxari 4986'],
    when: { az: 'Təxminən hicri 11–12 · 632–634 m. (tarixçilərə görə)', en: 'c. 11–12 AH · 632–634 CE (according to historians)', ru: 'Около 11–12 г. х. · 632–634 гг. (по данным историков)', ar: 'نحو سنة 11–12هـ · 632–634م (بحسب المؤرخين)', tr: 'Yaklaşık h. 11–12 · 632–634 (tarihçilere göre)' },
    title: { az: 'Yəmamədən sonra: Quranı bir yerə toplamaq', en: 'After al-Yamamah: gathering the Quran in one place', ru: 'После Ямамы: собрать Коран воедино', ar: 'بعد اليمامة: جمع القرآن', tr: 'Yemâme’den sonra: Kur’an’ı bir araya toplamak' },
    text: {
      az: 'Yəmamə döyüşündə Quranı əzbər bilən çoxlu qari şəhid oldu. Ömər (r.a.) Quranın çox hissəsinin itməsindən qorxdu və Əbu Bəkrə (r.a.) onu toplamağı təklif etdi. Əbu Bəkr əvvəlcə Peyğəmbərin ﷺ etmədiyi işi görməkdə tərəddüd etdi, sonra razı oldu və bu işi gənc, ağıllı, vəhy katibi olmuş Zeyd ibn Sabitə tapşırdı. Zeyd deyirdi ki, ona dağlardan birini yerindən daşımağı tapşırsaydılar, bu, Quranı toplamaq işindən ağır olmazdı.',
      en: 'At the battle of al-Yamamah many reciters who knew the Quran by heart were killed. ‘Umar (may Allah be pleased with him) feared that much of the Quran would be lost and advised Abu Bakr (may Allah be pleased with him) to have it gathered. Abu Bakr at first hesitated to do something the Prophet ﷺ had not done, then agreed and entrusted the task to Zayd ibn Thabit — a wise young man who had written the revelation. Zayd said that had they asked him to move one of the mountains, it would not have been heavier for him than gathering the Quran.',
      ru: 'В битве при Ямаме погибло много чтецов, знавших Коран наизусть. Умар (да будет доволен им Аллах) опасался, что большая часть Корана будет утрачена, и посоветовал Абу Бакру (да будет доволен им Аллах) собрать его. Абу Бакр сначала не решался сделать то, чего не делал Пророк ﷺ, затем согласился и поручил это Зайду ибн Сабиту — разумному юноше, записывавшему откровение. Зайд говорил, что если бы ему велели перенести одну из гор, это не было бы для него тяжелее, чем собирать Коран.',
      ar: 'استحرّ القتل يوم اليمامة بقرّاء القرآن، فخشي عمر رضي الله عنه أن يذهب كثير من القرآن، فأشار على أبي بكر رضي الله عنه بجمعه. فتردّد أبو بكر أولًا في فعل شيء لم يفعله النبي ﷺ، ثم شرح الله صدره لذلك، فكلّف به زيد بن ثابت، الشابّ العاقل الذي كان يكتب الوحي. وقال زيد: لو كلّفوه نقل جبل من الجبال ما كان أثقل عليه من جمع القرآن.',
      tr: 'Yemâme savaşında Kur’an’ı ezbere bilen pek çok kârî şehit düştü. Ömer (r.a.) Kur’an’ın büyük kısmının kaybolmasından korktu ve Ebû Bekir’e (r.a.) onu toplamasını önerdi. Ebû Bekir önce Peygamber’in ﷺ yapmadığı bir işi yapmakta tereddüt etti, sonra razı oldu ve bu işi genç, akıllı ve vahiy kâtibi olan Zeyd b. Sâbit’e verdi. Zeyd, kendisine dağlardan birini yerinden taşıması emredilseydi bunun Kur’an’ı toplamaktan daha ağır gelmeyeceğini söylerdi.',
    },
    quotes: [
      { ar: 'إِنَّ الْقَتْلَ قَدِ اسْتَحَرَّ يَوْمَ الْيَمَامَةِ بِقُرَّاءِ الْقُرْآنِ', src: 'Buxari 4986' },
      { ar: 'فَوَاللَّهِ لَوْ كَلَّفُونِي نَقْلَ جَبَلٍ مِنَ الْجِبَالِ مَا كَانَ أَثْقَلَ عَلَىَّ مِمَّا أَمَرَنِي مِنْ جَمْعِ الْقُرْآنِ', src: 'Buxari 4986' },
    ],
    people: ['abu-bakr-as-siddiq', 'umar-ibn-al-khattab'],
  },

  // ── 4. Səhifələr: Əbu Bəkr → Ömər → Həfsə ──
  {
    id: 'suhuf', art: 'suhuf',
    src: ['Buxari 4986'],
    title: { az: 'Səhifələr əmanət kimi qorunur', en: 'The sheets kept in trust', ru: 'Листы хранятся как доверенное', ar: 'الصحف في الحفظ', tr: 'Sayfalar emanet olarak korunur' },
    text: {
      az: 'Toplanmış səhifələr (suhuf) əvvəlcə Əbu Bəkrin (r.a.) yanında qaldı — Allah onun canını alana qədər; sonra Ömərin (r.a.) yanında — ömrünün sonuna qədər; sonra isə Ömərin qızı Həfsənin (r.a.) yanında.',
      en: 'The gathered sheets (suhuf) stayed first with Abu Bakr (may Allah be pleased with him) until Allah took his soul; then with ‘Umar (may Allah be pleased with him) for the rest of his life; and then with Hafsah, the daughter of ‘Umar (may Allah be pleased with her).',
      ru: 'Собранные листы (сухуф) хранились сначала у Абу Бакра (да будет доволен им Аллах), пока Аллах не забрал его душу; затем у Умара (да будет доволен им Аллах) до конца его жизни; а затем у Хафсы, дочери Умара (да будет доволен ею Аллах).',
      ar: 'بقيت الصحف المجموعة عند أبي بكر رضي الله عنه حتى توفّاه الله، ثم عند عمر رضي الله عنه حياته، ثم عند حفصة بنت عمر رضي الله عنها.',
      tr: 'Toplanan sayfalar (suhuf) önce Ebû Bekir’in (r.a.) yanında kaldı — Allah onun canını alana dek; sonra Ömer’in (r.a.) yanında — ömrünün sonuna kadar; sonra da Ömer’in kızı Hafsa’nın (r.anha) yanında.',
    },
    quotes: [
      { ar: 'فَكَانَتِ الصُّحُفُ عِنْدَ أَبِي بَكْرٍ حَتَّى تَوَفَّاهُ اللَّهُ ثُمَّ عِنْدَ عُمَرَ حَيَاتَهُ ثُمَّ عِنْدَ حَفْصَةَ بِنْتِ عُمَرَ', src: 'Buxari 4986' },
    ],
    keepers: [
      { name: { az: 'Əbu Bəkr (r.a.)', en: 'Abu Bakr', ru: 'Абу Бакр', ar: 'أبو بكر رضي الله عنه', tr: 'Ebû Bekir (r.a.)' },
        note: { az: 'vəfatına qədər', en: 'until his death', ru: 'до своей кончины', ar: 'حتى توفّاه الله', tr: 'vefatına kadar' } },
      { name: { az: 'Ömər (r.a.)', en: '‘Umar', ru: 'Умар', ar: 'عمر رضي الله عنه', tr: 'Ömer (r.a.)' },
        note: { az: 'ömrünün sonuna qədər', en: 'for the rest of his life', ru: 'до конца жизни', ar: 'حياتَه', tr: 'ömrünün sonuna kadar' } },
      { name: { az: 'Həfsə bint Ömər (r.a.)', en: 'Hafsah bint ‘Umar', ru: 'Хафса бинт Умар', ar: 'حفصة بنت عمر رضي الله عنها', tr: 'Hafsa bint Ömer (r.anha)' },
        note: { az: 'Osman onları ondan istəyənə qədər', en: 'until ‘Uthman asked her for them', ru: 'пока Усман не попросил их у неё', ar: 'حتى طلبها منها عثمان', tr: 'Osman onları ondan isteyene kadar' } },
    ],
    people: ['abu-bakr-as-siddiq', 'umar-ibn-al-khattab'],
  },

  // ── 5. Osmanın nüsxələri ──
  {
    id: 'uthman', art: 'map', approx: true,
    src: ['Buxari 4987'],
    when: { az: 'Təxminən hicri 25–30 · 645–651 m. (tarixçilərə görə; rəylər fərqlidir)', en: 'c. 25–30 AH · 645–651 CE (according to historians; views differ)', ru: 'Около 25–30 гг. х. · 645–651 гг. (по данным историков; мнения расходятся)', ar: 'نحو سنة 25–30هـ · 645–651م (بحسب المؤرخين، وفيه خلاف)', tr: 'Yaklaşık h. 25–30 · 645–651 (tarihçilere göre; görüşler farklıdır)' },
    title: { az: 'Osmanın nüsxələri bölgələrə', en: 'The copies of ‘Uthman go out to the regions', ru: 'Списки Усмана отправлены в области', ar: 'مصاحف عثمان إلى الآفاق', tr: 'Osman’ın nüshaları bölgelere' },
    text: {
      az: 'Şam və İraq əhli birlikdə Ərməniyyə və Azərbaycanın fəthi üçün vuruşarkən Hüzeyfə ibn Yəman onların Quranı oxumaqda ixtilafından narahat oldu və Osmandan (r.a.) bu ümmət Kitab barədə ixtilafa düşməzdən əvvəl tədbir görməyi istədi. Osman Həfsədən səhifələri istədi; Zeyd ibn Sabit, Abdullah ibn Zübeyr, Səid ibn As və Əbdürrəhman ibn Haris ibn Hişam onları mushaflara köçürdülər. Osman fikir ayrılığı olsa, Qüreyş ləhcəsi ilə yazmağı tapşırdı, çünki Quran onların dilində nazil olmuşdu. Sonra səhifələri Həfsəyə qaytardı, hər bölgəyə köçürülmüş mushaflardan birini göndərdi və qalan yazılı nüsxələrin yandırılmasını əmr etdi.',
      en: 'While the people of Sham and Iraq were campaigning together for the conquest of Armenia and Azerbaijan, Hudhayfah ibn al-Yaman was alarmed by their differences in reciting the Quran, and asked ‘Uthman (may Allah be pleased with him) to act before the ummah differed about the Book. ‘Uthman asked Hafsah for the sheets; Zayd ibn Thabit, ‘Abdullah ibn az-Zubayr, Sa‘id ibn al-‘As and ‘Abd ar-Rahman ibn al-Harith ibn Hisham copied them into codices. ‘Uthman told them that wherever they differed, they should write it in the dialect of Quraysh, for the Quran was revealed in their tongue. He then returned the sheets to Hafsah, sent one of the copies to every region, and ordered that all other written copies be burnt.',
      ru: 'Когда жители Шама и Ирака вместе воевали за Армению и Азербайджан, Хузайфа ибн аль-Яман встревожился их разногласиями в чтении Корана и попросил Усмана (да будет доволен им Аллах) принять меры, прежде чем умма разойдётся во мнениях о Книге. Усман попросил у Хафсы листы; Зайд ибн Сабит, Абдуллах ибн аз-Зубайр, Саид ибн аль-Ас и Абд ар-Рахман ибн аль-Харис ибн Хишам переписали их в списки (мусхафы). Усман велел при расхождении писать на наречии курайшитов, ведь Коран ниспослан на их языке. Затем он вернул листы Хафсе, отправил в каждую область по одному из списков и велел сжечь все прочие записи.',
      ar: 'قدم حذيفة بن اليمان على عثمان رضي الله عنه، وكان يغازي أهل الشام في فتح أرمينية وأذربيجان مع أهل العراق، فأفزعه اختلافهم في القراءة، فطلب من عثمان أن يدرك الأمة قبل أن تختلف في الكتاب. فأرسل عثمان إلى حفصة يطلب الصحف، فنسخها زيد بن ثابت وعبد الله بن الزبير وسعيد بن العاص وعبد الرحمن بن الحارث بن هشام في المصاحف، وأمرهم إن اختلفوا أن يكتبوه بلسان قريش لأنه نزل بلسانهم. ثم ردّ الصحف إلى حفصة، وأرسل إلى كل أفق بمصحف مما نسخوا، وأمر بما سواه أن يُحرق.',
      tr: 'Şam ve Irak halkı birlikte Ermenistan ve Azerbaycan’ın fethi için savaşırken Huzeyfe b. Yemân onların Kur’an’ı okumadaki ihtilafından endişelendi ve Osman’dan (r.a.) ümmet Kitap hakkında ihtilafa düşmeden önce tedbir almasını istedi. Osman Hafsa’dan sayfaları istedi; Zeyd b. Sâbit, Abdullah b. Zübeyr, Saîd b. Âs ve Abdurrahman b. Hâris b. Hişâm onları mushaflara geçirdiler. Osman, ihtilaf ederlerse Kureyş lehçesiyle yazmalarını emretti; çünkü Kur’an onların diliyle inmişti. Sonra sayfaları Hafsa’ya geri verdi, her bölgeye çoğaltılan mushaflardan birini gönderdi ve diğer yazılı nüshaların yakılmasını emretti.',
    },
    quotes: [
      { ar: 'أَدْرِكْ هَذِهِ الأُمَّةَ قَبْلَ أَنْ يَخْتَلِفُوا فِي الْكِتَابِ', src: 'Buxari 4987' },
      { ar: 'فَاكْتُبُوهُ بِلِسَانِ قُرَيْشٍ فَإِنَّمَا نَزَلَ بِلِسَانِهِمْ', src: 'Buxari 4987' },
      { ar: 'وَأَرْسَلَ إِلَى كُلِّ أُفُقٍ بِمُصْحَفٍ مِمَّا نَسَخُوا', src: 'Buxari 4987' },
    ],
    cities: ['makkah', 'sham', 'kufa', 'basra'],
    people: ['uthman-ibn-affan'],
  },

  // ── 6. Bu gün ──
  {
    id: 'today', art: 'mushaf',
    src: ['Quran 15:9'],
    title: { az: 'Bu gün: eyni mətn sizin qarşınızda', en: 'Today: the same text in front of you', ru: 'Сегодня: тот же текст перед вами', ar: 'اليوم: النص نفسه بين يديك', tr: 'Bugün: aynı metin önünüzde' },
    text: {
      az: 'Bugünkü mushaflar Osmanın nüsxələrinin yazı tərzi ilə — Osmani rəsmlə yazılır. Bu saytdakı Quran oxuyucusu və 604 səhifəlik Mədinə mushafı da 114 surənin həmin mətnini göstərir.',
      en: 'Today’s mushafs are written in the spelling of ‘Uthman’s copies — the ‘Uthmani rasm. The Quran reader on this site and the 604-page Madinah mushaf show that same text of the 114 surahs.',
      ru: 'Современные мусхафы пишутся по орфографии списков Усмана — османскому расму. Чтец Корана на этом сайте и 604-страничный мединский мусхаф показывают тот же текст 114 сур.',
      ar: 'تُكتب المصاحف اليوم بهجاء مصاحف عثمان — الرسم العثماني. ويعرض قارئ القرآن في هذا الموقع ومصحف المدينة ذو الصفحات الست مئة والأربع النصَّ نفسه لسور القرآن المئة والأربع عشرة.',
      tr: 'Bugünkü mushaflar Osman’ın nüshalarının yazımıyla — Resm-i Osmânî ile yazılır. Bu sitedeki Kur’an okuyucusu ve 604 sayfalık Medine mushafı da 114 surenin aynı metnini gösterir.',
    },
    // Ərəb mətni — oxuyucunun mətni; məna guides/QuranPage.js → about.quotes (15:9) ilə eyni (unit test yoxlayır)
    verse: {
      ar: 'إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَٰفِظُونَ',
      ref: '15:9',
      text: {
        az: 'Şübhəsiz ki, Zikri (Quranı) Biz nazil etdik və şübhəsiz ki, onu qoruyan da Bizik.',
        en: 'Indeed, it is We who sent down the Reminder, and indeed We will be its guardian.',
        ru: 'Воистину, Мы ниспослали Напоминание, и Мы оберегаем его.',
        tr: 'Şüphesiz Zikr’i (Kur’an’ı) Biz indirdik, onun koruyucusu da elbette Biziz.',
      },
    },
    glossary: ['mushaf', 'rasm-uthmani'],
  },
]

export const QH_BY_ID = Object.fromEntries(QH_SCENES.map(s => [s.id, s]))

/** "Buxari 4986" → { n: 4986 } | "Quran 96:1-5" → { s: 96, a: 1, a2: 5 } | null */
export function parseQhSource(src) {
  let m = /^Quran (\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/.exec(src)
  if (m) return { kind: 'quran', s: +m[1], a: +m[2], a2: m[3] ? +m[3] : null }
  m = /^Buxari (\d{1,4})$/.exec(src)
  if (m) return { kind: 'bukhari', n: +m[1] }
  return null
}

/** Səhih əl-Buxari hədisinin linkləri: saytın hədis kitabxanası (bölmə məlumdursa) və sunnah.com */
export function bukhariLinks(n) {
  const sec = BUKHARI_SECTION[n]
  return { library: sec ? `#bukhari/${sec}/${n}` : null, sunnah: `https://sunnah.com/bukhari:${n}` }
}
