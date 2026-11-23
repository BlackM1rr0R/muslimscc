// ═══════════════════════════════════════════════════════
// Kəbənin tarixi — zaman səyahəti (components/media/KaabaHistory.jsx, /holy-places)
//
// QAYDA: hər faktın `source` sahəsi var. Quran — saytın Quran nəşrindən (public/data/kaaba-ayah,
// scripts/build-kaaba-ayah.mjs); hədis — saytın hədis kitabxanasındakı mətn (fawazahmed0/hadith-api,
// /hadith-library#<kitab>/<bölmə>/<nömrə>; mətn orada hərfi-hərfinə oxunur, burada yalnız qısa xülasədir,
// sitat kimi təqdim olunmur); tarix — adı çəkilən əsərlərdən. Rəqəm qeyri-müəyyəndirsə — aralıq və ya yoxdur.
//
// Qəsdən YOXDUR: Həcərül-Əsvədin yerinə qoyulması hadisəsi (saytın hədis/siyər məlumatında mənbəsi yoxdur).
//
// Forma (shape) — sxematik səhnə üçün:
//   h      — hündürlük, zira (dhiraʿ) ilə (null — bilinmir; çəkilir, amma rəqəm göstərilmir)
//   hijr   — Hicrin bir hissəsi binanın içindədir (İbrahimin bünövrəsi) — ~6 zira (Buxari 1586; Müslim 1333: 5)
//   roof   — damı var (false — damsız; null — bilinmir)
//   doors  — 'none' (göstərilmir) | 'east-raised' | 'two-ground' (şərq + qərb, yerlə bərabər)
//   hLabel — hündürlüyün mətn yazısı (rəqəm ilə mənbəsi faktlardadır)
// ═══════════════════════════════════════════════════════

// Hədis kitabxanasına keçid: hadith-api nömrəsi (Müslim üçün Fuad Əbdülbaqi nömrəsi `label`-dədir)
const BUKHARI = (n) => ({ kind: 'hadith', book: 'bukhari', sec: 25, n, label: `Buxari ${n}` })
const MUSLIM_1333 = (apiN) => ({ kind: 'hadith', book: 'muslim', sec: 15, n: apiN, label: 'Müslim 1333' })
const QURAN_2_127 = { kind: 'quran', ref: '2:127', label: 'Bəqərə 2:127' }

const BOOK = {
  azraqi: { kind: 'book', label: { az: 'əl-Əzraqi, «Əxbar Məkkə»', en: 'al-Azraqi, Akhbar Makkah', ru: 'аль-Азраки, «Ахбар Макка»', tr: 'el-Ezrakî, Ahbâru Mekke', ar: 'الأزرقي، أخبار مكة' } },
  ibnHisham: { kind: 'book', label: { az: 'İbn Hişam, «əs-Sirə ən-Nəbəviyyə» (İbn İshaqdan)', en: 'Ibn Hisham, al-Sirah al-Nabawiyyah (from Ibn Ishaq)', ru: 'Ибн Хишам, «ас-Сира ан-Набавийя» (со слов Ибн Исхака)', tr: 'İbn Hişâm, es-Sîretü’n-Nebeviyye (İbn İshak’tan)', ar: 'ابن هشام، السيرة النبوية (عن ابن إسحاق)' } },
  tabari64: { kind: 'book', label: { az: 'ət-Təbəri, «Tarix ər-rusul vəl-muluk», h. 64-cü il', en: 'al-Tabari, Tarikh al-rusul wa-l-muluk, year 64 AH', ru: 'ат-Табари, «История пророков и царей», 64 г. х.', tr: 'Taberî, Târîhu’r-rusül ve’l-mülûk, h. 64 yılı', ar: 'الطبري، تاريخ الرسل والملوك، سنة ٦٤هـ' } },
  tabari74: { kind: 'book', label: { az: 'ət-Təbəri, «Tarix ər-rusul vəl-muluk», h. 73–74-cü illər', en: 'al-Tabari, Tarikh, years 73–74 AH', ru: 'ат-Табари, «История пророков и царей», 73–74 гг. х.', tr: 'Taberî, Târîhu’r-rusül ve’l-mülûk, h. 73–74 yılları', ar: 'الطبري، تاريخ الرسل والملوك، سنتا ٧٣–٧٤هـ' } },
  ei2: { kind: 'book', label: { az: '«Encyclopaedia of Islam», 2-ci nəşr, «Kaʿba» məqaləsi (A. J. Wensinck, J. Jomier)', en: 'Encyclopaedia of Islam, 2nd ed., art. “Kaʿba” (A. J. Wensinck, J. Jomier)', ru: '«Encyclopaedia of Islam», 2-е изд., статья «Kaʿba» (А. Й. Венсинк, Ж. Жомье)', tr: 'Encyclopaedia of Islam, 2. baskı, “Kaʿba” maddesi (A. J. Wensinck, J. Jomier)', ar: 'دائرة المعارف الإسلامية (الطبعة الثانية)، مادة «الكعبة» (فنسنك، جومييه)' } }, // lang-ok[Encyclopaedia,Encyclopaedia of Islam]: əsərin rəsmi adı
  hinz: { kind: 'book', label: { az: 'W. Hinz, «Islamische Maße und Gewichte» (1955)', en: 'W. Hinz, Islamische Maße und Gewichte (1955)', ru: 'В. Хинц, «Islamische Maße und Gewichte» (1955)', tr: 'W. Hinz, Islamische Maße und Gewichte (1955)', ar: 'فالتر هنتس، المكاييل والأوزان الإسلامية (١٩٥٥)' } }, // lang-ok[Islamische,Islamische Maße und,W. Hinz]: kitabın almanca adı
  gph: { kind: 'book', label: { az: 'Səudiyyə ensiklopediyası / İki Müqəddəs Məscidin Qayğısına Qalma Baş İdarəsi; Mumtaz və ət-Təyluş, əl-Ləali əs-sənniyyə, Məcəllətül-Hərəmeyn əş-Şərifeyn 2 (2015)', en: 'Saudipedia / General Authority for the Care of the Two Holy Mosques; Mumtaz & al-Tayloush, al-La’ali al-saniyya, Majallat al-Haramayn al-Sharifayn 2 (2015)', ru: 'Саудипедия / Главное управление по делам Двух Священных мечетей; Мумтаз и ат-Тайлюш, «аль-Лаали ас-саниййа», Маджаллат аль-Харамайн аш-Шарифайн 2 (2015)', tr: 'Saudipedia / İki Kutsal Mescid İşleri Genel Başkanlığı; Mumtaz ve et-Taylûş, el-Le’âli es-seniyye, Mecelletü’l-Haremeyni’ş-Şerifeyn 2 (2015)', ar: 'الموسوعة السعودية (سعوديبيديا) / الهيئة العامة للعناية بشؤون المسجد الحرام والمسجد النبوي؛ ممتاز والطيلوش، اللآلئ السنية، مجلة الحرمين الشريفين ٢ (٢٠١٥)' } }, // lang-ok[ensiklopediyası]: Saudipedia ensiklopediyasının adı
}

/** Zira (dhiraʿ) haqqında ümumi qeyd — səhnənin miqyası */
export const CUBIT_NOTE = {
  text: {
    az: 'Zira (ذراع) — dirsəkdən barmaq ucuna qədər ölçü, təxminən yarım metr; uzunluğu dövrə və yerə görə dəyişib.',
    en: 'A cubit (dhiraʿ, ذراع) is the length from elbow to fingertip — roughly half a metre; its exact length varied by period and place.',
    ru: 'Локоть (зира‘, ذراع) — мера от локтя до кончиков пальцев, около полуметра; точная длина менялась в разные эпохи и в разных местах.',
    tr: 'Zira (zirâ‘, ذراع) dirsekten parmak ucuna kadar olan ölçüdür — yaklaşık yarım metre; tam uzunluğu döneme ve yere göre değişmiştir.',
    ar: 'الذراع: مقياس من المرفق إلى أطراف الأصابع، نحو نصف متر تقريبًا، وقد اختلف طوله باختلاف العصور والبلدان.',
  },
  source: [BOOK.hinz],
}

export const KAABA_STAGES = [
  // ── 1. İbrahim və İsmail ─────────────────────────
  {
    id: 'ibrahim',
    era: { az: 'İbrahim peyğəmbərin dövrü', en: 'The time of the Prophet Ibrahim', ru: 'Время пророка Ибрахима', tr: 'Hz. İbrahim’in dönemi', ar: 'زمن إبراهيم عليه السلام' },
    title: { az: 'İbrahim və İsmail bünövrəni qaldırır', en: 'Ibrahim and Ismaʿil raise the foundations', ru: 'Ибрахим и Исмаил возводят основания', tr: 'İbrahim ve İsmail temelleri yükseltiyor', ar: 'إبراهيم وإسماعيل يرفعان القواعد' },
    ayah: '2:127',
    shape: { h: 9, hijr: true, roof: false, doors: 'none', hLabel: { az: '9 zira', en: '9 cubits', ru: '9 локтей', tr: '9 zira', ar: '٩ أذرع' } },
    facts: [
      {
        text: { az: 'İbrahim və İsmail Evin bünövrəsini qaldırarkən Allahdan bu əməli qəbul etməsini dilədilər.', en: 'Ibrahim and Ismaʿil raised the foundations of the House and asked Allah to accept it from them.', ru: 'Ибрахим и Исмаил возвели основания Дома и просили Аллаха принять это от них.', tr: 'İbrahim ve İsmail Beyt’in temellerini yükseltirken Allah’tan bunu kabul etmesini dilediler.', ar: 'رفع إبراهيم وإسماعيل القواعد من البيت وسألا الله أن يتقبّل منهما.' },
        source: [QURAN_2_127],
      },
      {
        text: { az: 'İbrahimin bünövrəsi bugünkü Hicrin (Hətimin) bir hissəsini də əhatə edirdi: Hicrin divarı Evdəndir.', en: 'Ibrahim’s foundations also took in part of what is today the Hijr (Hatim): the Hijr wall is part of the House.', ru: 'Основания Ибрахима охватывали и часть нынешнего Хиджра (Хатима): стена Хиджра — часть Дома.', tr: 'İbrahim’in temelleri bugünkü Hicr’in (Hatîm’in) bir kısmını da kapsıyordu: Hicr duvarı Beyt’tendir.', ar: 'كانت قواعد إبراهيم تشمل جزءًا مما هو اليوم الحِجر (الحطيم)، والجدر من البيت.' },
        source: [BUKHARI(1584), BUKHARI(1586)],
      },
      {
        text: { az: 'Hündürlüyü 9 zira idi, damı yox idi.', en: 'It was 9 cubits high and had no roof.', ru: 'Высота — 9 локтей, крыши не было.', tr: 'Yüksekliği 9 zira idi ve çatısı yoktu.', ar: 'كان ارتفاعه تسعة أذرع، ولم يكن مسقوفًا.' },
        source: [BOOK.azraqi],
      },
    ],
  },
  // ── 2. Qüreyş ─────────────────────────────────────
  {
    id: 'quraysh',
    era: { az: 'Təxm. 605-ci il — Peyğəmbər ﷺ 35 yaşında idi', en: 'c. 605 CE — the Prophet ﷺ was 35', ru: 'Ок. 605 г. — Пророку ﷺ было 35 лет', tr: 'Yak. 605 — Peygamber ﷺ 35 yaşındaydı', ar: 'نحو ٦٠٥م — وكان عمر النبي ﷺ خمسًا وثلاثين سنة' },
    title: { az: 'Qüreyşin tikintisi', en: 'The Quraysh rebuild', ru: 'Перестройка курайшитами', tr: 'Kureyş’in yeniden inşası', ar: 'بناء قريش' },
    shape: { h: 18, hijr: false, roof: true, doors: 'east-raised', hLabel: { az: '18 zira', en: '18 cubits', ru: '18 локтей', tr: '18 zira', ar: '١٨ ذراعًا' } },
    facts: [
      {
        text: { az: 'Qüreyş Kəbəni yenidən tikəndə Peyğəmbər ﷺ 35 yaşında idi. Ondan əvvəl bina insan boyundan bir az hündür, quru yığma daşlardan ibarət idi və damı yox idi; onu ucaldıb üstünü örtdülər.', en: 'The Prophet ﷺ was 35 when Quraysh rebuilt the Kaaba. Before that it was a structure of dry-laid stones a little above a man’s height, without a roof; they raised it and roofed it.', ru: 'Когда курайшиты перестраивали Каабу, Пророку ﷺ было 35 лет. До этого она была постройкой из камней, сложенных всухую, чуть выше человеческого роста, без крыши; её подняли и покрыли крышей.', tr: 'Kureyş Kâbe’yi yeniden inşa ettiğinde Peygamber ﷺ 35 yaşındaydı. Öncesinde bina insan boyundan biraz yüksek, çatısız, kuru yığma taşlardan ibaretti; onu yükseltip üstünü örttüler.', ar: 'كان عمر النبي ﷺ خمسًا وثلاثين سنة حين بنت قريش الكعبة، وكانت قبل ذلك رَضْمًا (حجارة مرصوفة بلا مِلاط) فوق القامة غير مسقوفة، فرفعوها وسقفوها.' },
        source: [BOOK.ibnHisham],
      },
      {
        text: { az: 'Peyğəmbər ﷺ əmisi Abbasla birlikdə tikinti üçün daş daşıyırdı.', en: 'The Prophet ﷺ carried stones for the building together with his uncle al-ʿAbbas.', ru: 'Пророк ﷺ вместе со своим дядей аль-Аббасом носил камни для стройки.', tr: 'Peygamber ﷺ amcası Abbas ile birlikte inşaat için taş taşıyordu.', ar: 'كان النبي ﷺ ينقل الحجارة للبناء مع عمّه العباس.' },
        source: [BUKHARI(1582)],
      },
      {
        text: { az: 'Xərcləri çatmadığı üçün Qüreyş Hicr tərəfdəki hissəni binaya daxil etmədi — bina İbrahimin bünövrəsindən kiçik oldu. Qapını isə istədiklərini içəri buraxıb, istəmədiklərini saxlamaq üçün yuxarı qaldırdılar.', en: 'Because their funds ran short, Quraysh left the Hijr side out of the building — it became smaller than Ibrahim’s foundations. They raised the door so they could let in whom they wished and keep out whom they wished.', ru: 'Из‑за нехватки средств курайшиты не включили в здание сторону Хиджра — оно стало меньше оснований Ибрахима. Дверь же подняли, чтобы впускать кого пожелают и не пускать кого пожелают.', tr: 'Harcamaları yetmediği için Kureyş Hicr tarafını binaya katmadı — bina İbrahim’in temellerinden küçük kaldı. Kapıyı ise istediklerini içeri alıp istemediklerini almamak için yükselttiler.', ar: 'قصّرت قريش النفقة فأخرجت جهة الحِجر من البناء، فصار دون قواعد إبراهيم، ورفعوا الباب ليُدخلوا من شاؤوا ويمنعوا من شاؤوا.' },
        source: [BUKHARI(1584), BUKHARI(1583)],
      },
      {
        text: { az: 'Qüreyşin binasının hündürlüyü 18 zira idi.', en: 'The Quraysh building was 18 cubits high.', ru: 'Высота здания курайшитов — 18 локтей.', tr: 'Kureyş’in binasının yüksekliği 18 zira idi.', ar: 'كان ارتفاع بناء قريش ثماني عشرة ذراعًا.' },
        source: [MUSLIM_1333(3245)],
      },
      {
        text: { az: 'Peyğəmbər ﷺ Aişəyə demişdi ki, xalqı cahiliyyədən yeni çıxmasaydı, Evi İbrahimin bünövrəsi üzərində yenidən tikər, kənarda qalan hissəni içəri qatar, qapını yerlə bərabər edər, biri şərqə, biri qərbə baxan iki qapı açardı. İbn Ömərin fikrincə, Peyğəmbərin ﷺ Hicr tərəfdəki iki küncə toxunmamasının səbəbi də Evin İbrahimin bünövrəsi üzərində tamamlanmaması idi.', en: 'The Prophet ﷺ told ʿAʾishah that, were her people not so recently out of the Jahiliyyah, he would rebuild the House on Ibrahim’s foundations, include the part left out, set the door level with the ground and give it two doors, one facing east and one facing west. In Ibn ʿUmar’s view, this is why the Prophet ﷺ did not touch the two corners facing the Hijr: the House had not been completed on Ibrahim’s foundations.', ru: 'Пророк ﷺ сказал Аише, что если бы её народ не вышел недавно из джахилии, он перестроил бы Дом на основаниях Ибрахима, включил бы оставленную часть, сделал бы дверь вровень с землёй и устроил две двери — на восток и на запад. По мнению Ибн Умара, Пророк ﷺ не касался двух углов со стороны Хиджра именно потому, что Дом не был достроен на основаниях Ибрахима.', tr: 'Peygamber ﷺ Âişe’ye, kavmi câhiliyeden yeni çıkmış olmasaydı Beyt’i İbrahim’in temelleri üzerine yeniden yapacağını, dışarıda kalan kısmı içine katacağını, kapıyı yerle bir seviyeye indirip biri doğuya, biri batıya bakan iki kapı açacağını söyledi. İbn Ömer’e göre Peygamber’in ﷺ Hicr tarafındaki iki köşeye dokunmamasının sebebi de Beyt’in İbrahim’in temelleri üzerinde tamamlanmamış olmasıydı.', ar: 'أخبر النبيُّ ﷺ عائشةَ أنه لولا حداثة عهد قومها بالجاهلية لهدم البيت وأدخل فيه ما أُخرج منه وألزقه بالأرض وجعل له بابين شرقيًّا وغربيًّا فيبلغ به أساس إبراهيم، ورأى ابن عمر أن النبي ﷺ لم يترك استلام الركنين اللذين يليان الحِجر إلا لأن البيت لم يُتمَّم على قواعد إبراهيم.' },
        source: [BUKHARI(1586), BUKHARI(1583)],
      },
    ],
  },
  // ── 3. Abdullah ibn əz-Zubeyr ────────────────────
  {
    id: 'zubayr',
    era: { az: 'h. 64 (683–684-cü illər)', en: '64 AH (683–684 CE)', ru: '64 г. х. (683–684 гг.)', tr: 'h. 64 (683–684)', ar: 'سنة ٦٤هـ (٦٨٣–٦٨٤م)' },
    title: { az: 'İbn əz-Zubeyr — İbrahimin bünövrəsi üzərində', en: 'Ibn al-Zubayr — on Ibrahim’s foundations', ru: 'Ибн аз-Зубайр — на основаниях Ибрахима', tr: 'İbnü’z-Zübeyr — İbrahim’in temelleri üzerinde', ar: 'ابن الزبير — على قواعد إبراهيم' },
    shape: { h: 28, hijr: true, roof: true, doors: 'two-ground', hLabel: { az: '18 + 10 zira', en: '18 + 10 cubits', ru: '18 + 10 локтей', tr: '18 + 10 zira', ar: '١٨ + ١٠ أذرع' } },
    facts: [
      {
        text: { az: 'Yezid ibn Müaviyənin dövründə Şam ordusu Məkkəyə hücum edəndə Ev yandı.', en: 'The House was burnt in the time of Yazid ibn Muʿawiyah, when the army of Syria fought in Makkah.', ru: 'Дом сгорел во времена Язида ибн Муавии, когда сирийское войско воевало в Мекке.', tr: 'Yezîd b. Muâviye döneminde Şam ordusu Mekke’ye saldırdığında Beyt yandı.', ar: 'احترق البيت زمن يزيد بن معاوية حين غزا أهلُ الشام مكة.' },
        source: [MUSLIM_1333(3245), BOOK.tabari64],
      },
      {
        text: { az: 'İbn Abbas yalnız zədələnən yerləri təmir etməyi məsləhət gördü. İbn əz-Zubeyr üç dəfə istixarə etdi, sonra binanı yerə qədər söküb yenidən tikdi.', en: 'Ibn ʿAbbas advised repairing only what was damaged. Ibn al-Zubayr prayed istikharah three times, then had the building taken down to the ground and rebuilt.', ru: 'Ибн Аббас советовал лишь починить повреждённое. Ибн аз-Зубайр трижды совершил истихару, затем разобрал здание до земли и отстроил заново.', tr: 'İbn Abbas yalnızca hasar gören yerlerin onarılmasını tavsiye etti. İbnü’z-Zübeyr üç kez istihare yaptı, sonra binayı yere kadar yıkıp yeniden yaptı.', ar: 'أشار ابن عباس بإصلاح ما وهى منها فقط، فاستخار ابن الزبير ربَّه ثلاثًا ثم نقضها حتى بلغ بها الأرض وأعاد بناءها.' },
        source: [MUSLIM_1333(3245)],
      },
      {
        text: { az: 'Hicr tərəfdən 5–6 zira əlavə etdi; İbrahimin bünövrəsi açıldı — dəvə hörgücünə bənzər daşlar — və divarı onun üzərində qaldırdı.', en: 'He added 5–6 cubits on the Hijr side; Ibrahim’s foundations came to light — stones like camels’ humps — and he built the wall on them.', ru: 'Он добавил 5–6 локтей со стороны Хиджра; открылись основания Ибрахима — камни, похожие на верблюжьи горбы, — и стену возвели на них.', tr: 'Hicr tarafından 5–6 zira ekledi; İbrahim’in temelleri ortaya çıktı — deve hörgücüne benzeyen taşlar — ve duvarı onların üzerine yükseltti.', ar: 'زاد من جهة الحِجر خمسة أذرع أو ستة حتى ظهر أساس إبراهيم — حجارة كأسنمة الإبل — فبنى عليه.' },
        source: [MUSLIM_1333(3245), BUKHARI(1586)],
      },
      {
        text: { az: 'Hündürlüyə 10 zira əlavə etdi (Qüreyşin 18 zirasının üstünə) və yerlə bərabər iki qapı açdı: biri girmək, biri çıxmaq üçün — şərqdə və qərbdə.', en: 'He added 10 cubits to the height (on top of the Quraysh 18) and made two doors at ground level, one to enter and one to leave — east and west.', ru: 'Он добавил к высоте 10 локтей (сверх 18 курайшитских) и сделал две двери вровень с землёй — для входа и для выхода, на востоке и на западе.', tr: 'Yüksekliğe 10 zira ekledi (Kureyş’in 18 zirasının üstüne) ve biri girmek, biri çıkmak için yerle bir seviyede iki kapı açtı — doğuda ve batıda.', ar: 'زاد في ارتفاعها عشر أذرع على ثماني عشرة، وجعل لها بابين لاصقين بالأرض: يُدخل من أحدهما ويُخرج من الآخر، شرقيًّا وغربيًّا.' },
        source: [MUSLIM_1333(3245), BUKHARI(1586), BOOK.azraqi],
      },
    ],
  },
  // ── 4. əl-Həccac ──────────────────────────────────
  {
    id: 'hajjaj',
    era: { az: 'h. 73–74 (692–694-cü illər)', en: '73–74 AH (692–694 CE)', ru: '73–74 гг. х. (692–694 гг.)', tr: 'h. 73–74 (692–694)', ar: '٧٣–٧٤هـ (٦٩٢–٦٩٤م)' },
    title: { az: 'əl-Həccac Qüreyşin formasını qaytarır', en: 'Al-Hajjaj restores the Quraysh form', ru: 'Аль-Хаджжадж возвращает курайшитскую форму', tr: 'Haccâc Kureyş’in biçimini geri getiriyor', ar: 'الحجاج يعيدها إلى بناء قريش' },
    shape: { h: 28, hijr: false, roof: true, doors: 'east-raised', hLabel: { az: '18 + 10 zira', en: '18 + 10 cubits', ru: '18 + 10 локтей', tr: '18 + 10 zira', ar: '١٨ + ١٠ أذرع' } },
    facts: [
      {
        text: { az: 'İbn əz-Zubeyr öldürüləndən sonra əl-Həccac xəlifə Əbdülməlik ibn Mərvana yazdı. Əbdülməlik əmr etdi: hündürlükdəki əlavə qalsın, Hicr tərəfdən əlavə olunan hissə əvvəlki binasına qaytarılsın, İbn əz-Zubeyrin açdığı qapı hörülüb bağlansın. Həccac belə də etdi.', en: 'After Ibn al-Zubayr was killed, al-Hajjaj wrote to the caliph ʿAbd al-Malik ibn Marwan, who ordered: keep the addition to the height, return what was added from the Hijr to its former building, and wall up the door Ibn al-Zubayr had opened. Al-Hajjaj did so.', ru: 'После гибели Ибн аз-Зубайра аль-Хаджжадж написал халифу Абд аль-Малику ибн Марвану. Тот велел: добавленную высоту оставить, добавленное со стороны Хиджра вернуть к прежней постройке, а дверь, открытую Ибн аз-Зубайром, заложить. Аль-Хаджжадж так и сделал.', tr: 'İbnü’z-Zübeyr öldürüldükten sonra Haccâc halife Abdülmelik b. Mervân’a yazdı. Abdülmelik şöyle emretti: yükseklikteki ilave kalsın, Hicr tarafından eklenen kısım önceki binasına döndürülsün, İbnü’z-Zübeyr’in açtığı kapı örülüp kapatılsın. Haccâc da öyle yaptı.', ar: 'لما قُتل ابن الزبير كتب الحجاج إلى عبد الملك بن مروان، فكتب إليه: أمّا ما زاد في طوله فأقِرَّه، وأمّا ما زاد فيه من الحِجر فرُدَّه إلى بنائه، وسُدَّ الباب الذي فتحه؛ فنقضه وأعاده إلى بنائه.' },
        source: [MUSLIM_1333(3245), BOOK.tabari74],
      },
      {
        text: { az: 'Sonra Əbdülməlik Aişənin rəvayətini əl-Haris ibn Abdullahdan eşidib dedi ki, kaş İbn əz-Zubeyrin tikdiyi kimi saxlayaydım.', en: 'Later, when ʿAbd al-Malik heard ʿAʾishah’s narration from al-Harith ibn ʿAbdullah, he said he wished he had left it as Ibn al-Zubayr had built it.', ru: 'Позже Абд аль-Малик, услышав рассказ Аиши от аль-Хариса ибн Абдуллаха, сказал, что лучше бы он оставил постройку Ибн аз-Зубайра.', tr: 'Sonra Abdülmelik, Âişe’nin rivayetini Hâris b. Abdullah’tan duyunca, keşke İbnü’z-Zübeyr’in yaptığı gibi bıraksaydım, dedi.', ar: 'ثم لما سمع عبد الملك حديث عائشة من الحارث بن عبد الله قال: وددتُ أني تركته وما تحمّل.' },
        source: [MUSLIM_1333(3246), MUSLIM_1333(3248)],
      },
      {
        text: { az: 'Kəbənin bugünkü forması, sonrakı təmirlərlə, bu bərpaya gedib çıxır.', en: 'With later repairs, the Kaaba’s present form goes back to this restoration.', ru: 'Нынешняя форма Каабы, с последующими ремонтами, восходит к этому восстановлению.', tr: 'Kâbe’nin bugünkü biçimi, sonraki onarımlarla birlikte, bu yeniden yapıma dayanır.', ar: 'وإلى هذا البناء يرجع شكل الكعبة الحالي مع الترميمات اللاحقة.' },
        source: [BOOK.ei2],
      },
    ],
  },
  // ── 5. 1630 seli və Osmanlı tikintisi ────────────
  {
    id: 'ottoman',
    era: { az: 'h. 1039–1040 (1630–1631-ci illər)', en: '1039–1040 AH (1630–1631 CE)', ru: '1039–1040 гг. х. (1630–1631 гг.)', tr: 'h. 1039–1040 (1630–1631)', ar: '١٠٣٩–١٠٤٠هـ (١٦٣٠–١٦٣١م)' },
    title: { az: 'Sel və Sultan IV Muradın tikintisi', en: 'The flood and Sultan Murad IV’s rebuild', ru: 'Наводнение и перестройка при султане Мураде IV', tr: 'Sel ve Sultan IV. Murad’ın inşası', ar: 'السيل وبناء السلطان مراد الرابع' },
    flood: true,
    shape: { h: 28, hijr: false, roof: true, doors: 'east-raised', hLabel: { az: '18 + 10 zira', en: '18 + 10 cubits', ru: '18 + 10 локтей', tr: '18 + 10 zira', ar: '١٨ + ١٠ أذرع' } },
    facts: [
      {
        text: { az: 'h. 1039 (1630) ilində sel Məscidül-Harama doldu, Kəbənin divarlarının bir hissəsi uçdu.', en: 'In 1039 AH (1630 CE) a flood filled the Haram and part of the Kaaba’s walls collapsed.', ru: 'В 1039 г. х. (1630) наводнение затопило Харам, и часть стен Каабы обрушилась.', tr: 'h. 1039 (1630) yılında sel Mescid-i Haram’ı doldurdu ve Kâbe’nin duvarlarının bir kısmı yıkıldı.', ar: 'في سنة ١٠٣٩هـ (١٦٣٠م) دخل السيلُ المسجدَ الحرام وسقط جزء من جدران الكعبة.' },
        source: [BOOK.ei2],
      },
      {
        text: { az: 'Osmanlı sultanı IV Muradın əmri ilə bina eyni bünövrə üzərində, əvvəlki formada yenidən tikildi; iş h. 1040-da (1631) başa çatdı.', en: 'By order of the Ottoman Sultan Murad IV it was rebuilt on the same foundations in its former shape; the work was completed in 1040 AH (1631 CE).', ru: 'По приказу османского султана Мурада IV здание отстроили на тех же основаниях в прежней форме; работы завершились в 1040 г. х. (1631).', tr: 'Osmanlı Sultanı IV. Murad’ın emriyle bina aynı temeller üzerinde, önceki biçimiyle yeniden yapıldı; iş h. 1040’ta (1631) tamamlandı.', ar: 'وبأمر السلطان العثماني مراد الرابع أُعيد بناؤها على الأساس نفسه وبالشكل السابق، وتمّ العمل سنة ١٠٤٠هـ (١٦٣١م).' },
        source: [BOOK.ei2],
      },
    ],
  },
  // ── 6. Müasir bərpa ───────────────────────────────
  {
    id: 'modern',
    era: { az: 'h. 1417 (1996-cı il)', en: '1417 AH (1996 CE)', ru: '1417 г. х. (1996 г.)', tr: 'h. 1417 (1996)', ar: '١٤١٧هـ (١٩٩٦م)' },
    title: { az: 'Müasir bərpa', en: 'The modern restoration', ru: 'Современная реставрация', tr: 'Modern restorasyon', ar: 'الترميم الحديث' },
    shape: { h: 28, hijr: false, roof: true, doors: 'east-raised', hLabel: { az: 'təxm. 13–15 m', en: 'about 13–15 m', ru: 'около 13–15 м', tr: 'yak. 13–15 m', ar: 'نحو ١٣–١٥ م' } },
    facts: [
      {
        text: { az: 'h. 1417-ci ildə (1996) Kəbədə geniş bərpa işləri aparıldı: bina möhkəmləndirildi və təmir olundu, forması dəyişmədi.', en: 'In 1417 AH (1996 CE) a comprehensive restoration was carried out: the building was strengthened and repaired, and its shape did not change.', ru: 'В 1417 г. х. (1996) Каабу капитально отреставрировали: здание укрепили и отремонтировали, форма не изменилась.', tr: 'h. 1417’de (1996) Kâbe’de kapsamlı bir restorasyon yapıldı: bina güçlendirilip onarıldı, biçimi değişmedi.', ar: 'في سنة ١٤١٧هـ (١٩٩٦م) جرى ترميم شامل للكعبة: قُوِّي البناء ورُمِّم دون تغيير شكله.' },
        source: [BOOK.gph],
      },
      {
        text: { az: 'Bu gün hündürlüyü təxminən 13–15 m, tərəfləri təxminən 10–13 m-dir — dərc olunmuş ölçmələr bir-birindən fərqlənir.', en: 'Today it is about 13–15 m high with sides of about 10–13 m — published measurements differ.', ru: 'Сегодня её высота около 13–15 м, стороны около 10–13 м — опубликованные измерения расходятся.', tr: 'Bugün yüksekliği yaklaşık 13–15 m, kenarları yaklaşık 10–13 m’dir — yayımlanmış ölçümler birbirinden farklıdır.', ar: 'ارتفاعها اليوم نحو ١٣–١٥ م وأضلاعها نحو ١٠–١٣ م، وتختلف القياسات المنشورة.' },
        source: [BOOK.ei2, BOOK.gph],
      },
      {
        text: { az: 'Hicr (Hətim) bu gün də Kəbədən kənarda, alçaq yarımdairəvi divarla əhatə olunub; qapı yerdən yuxarıdadır.', en: 'The Hijr (Hatim) is still outside the building today, enclosed by a low semicircular wall, and the door is above ground level.', ru: 'Хиджр (Хатим) и сегодня находится вне здания, его окружает низкая полукруглая стена; дверь расположена выше уровня земли.', tr: 'Hicr (Hatîm) bugün de binanın dışında, alçak yarım daire bir duvarla çevrilidir; kapı yerden yukarıdadır.', ar: 'ولا يزال الحِجر (الحطيم) خارج البناء يحيط به جدار منخفض على شكل نصف دائرة، والباب مرتفع عن الأرض.' },
        source: [BOOK.ei2],
      },
    ],
  },
]

/** Bütün mənbə sətirləri (test və hesabat üçün) */
export function allKaabaSources() {
  const out = []
  for (const s of KAABA_STAGES) for (const f of s.facts) for (const src of f.source) out.push({ stage: s.id, ...src })
  return out
}
