// ═══════════════════════════════════════════════════════
// QİBLƏ BƏLƏDÇİSİ — /qibla səhifəsində kompasın altında
// Bloklar src/data/lessons/README.md formatındadır (LessonBlocks göstərir).
//
// YOXLANILIB (2026-10-31):
// • Ayə — api.quran.com (uthmani): 2:144.
// • Hədislər — fawazahmed0/hadith-api (ara-*): Buxari 400, 403, 1000, 1094,
//   6251; Tirmizi 344 (Tirmizi: həsən səhih).
// • Fətvalar (açılıb oxunub):
//   islamqa.info 42574 — səhv istiqamətə qılınan namaz (Daimi Komitə 6/314,
//   İbn Baz 10/421, İbn Useymin «əş-Şərh əl-Mumti» 2/273);
//   binbaz.org.sa 4298 — təyyarədə namazın qaydası;
//   binbaz.org.sa 20706 — təyyarədə fərz namaz, ictihad, nafilə.
// • Günəşin Kəbənin üstündə olması (27/28 may 09:18 UTC, 15/16 iyul 09:27 UTC) —
//   «Qibla observation by shadows» (Wikipedia) və xəbər mənbələri.
// • Namazın qılınma qaydası burada TƏKRARLANMIR — /prayerguide-a keçid verilir.
// ═══════════════════════════════════════════════════════

import { localizeSource } from '../../utils/sourceNames.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const S = (s) => Object.fromEntries(LANGS.map(l => [l, localizeSource(s, l)]))
const SAHIH_T = { az: 'həsən səhih (Tirmizi)', en: 'hasan sahih (at-Tirmidhi)', ru: 'хороший достоверный (ат-Тирмизи)', ar: 'حسن صحيح (الترمذي)', tr: 'hasen sahih (Tirmizî)' }

const URL = {
  qa42574: 'https://islamqa.info/en/answers/42574',
  baz4298: 'https://binbaz.org.sa/fatwas/4298/%D9%85%D8%A7-%D9%83%D9%8A%D9%81%D9%8A%D8%A9-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B7%D8%A7%D9%89%D8%B1%D8%A9',
  baz20706: 'https://binbaz.org.sa/fatwas/20706/%C2%A0%D8%AD%D9%83%D9%85-%D8%B5%D9%84%D8%A7%D8%A9-%D8%A7%D9%84%D9%81%D8%B1%D9%8A%D8%B6%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B7%D8%A7%D9%89%D8%B1%D8%A9-%D9%88%D9%87%D9%88-%D8%AC%D8%A7%D9%84%D8%B3',
}

const QA42574 = { az: 'İslamQA, sual 42574 (Daimi Komitə; İbn Baz; İbn Useymin)', en: 'IslamQA, question 42574 (Standing Committee; Ibn Baz; Ibn Uthaymin)', ru: '«Ислам: вопрос и ответ», вопрос 42574 (Постоянный комитет; Ибн Баз; Ибн Усаймин)', ar: 'الإسلام سؤال وجواب، رقم 42574 (اللجنة الدائمة؛ ابن باز؛ ابن عثيمين)', tr: 'İslam Soru-Cevap, soru 42574 (Daimi Komite; İbn Bâz; İbn Useymîn)' }
const BAZ4298 = { az: 'İbn Baz — «Təyyarədə namaz necə qılınır?»', en: 'Ibn Baz — “How is prayer performed on a plane?”', ru: 'Ибн Баз — «Как молиться в самолёте?»', ar: 'ابن باز — ما كيفية الصلاة في الطائرة؟', tr: 'İbn Bâz — “Uçakta namaz nasıl kılınır?”' }
const BAZ20706 = { az: 'İbn Baz — «Təyyarədə fərz namazı oturaq qılmağın hökmü»', en: 'Ibn Baz — “Ruling on praying the obligatory prayer seated on a plane”', ru: 'Ибн Баз — «Решение об обязательной молитве сидя в самолёте»', ar: 'ابن باز — حكم صلاة الفريضة في الطائرة وهو جالس', tr: 'İbn Bâz — “Uçakta farz namazı oturarak kılmanın hükmü”' }

export const QIBLA_GUIDE_TXT = {
  eyebrow: { az: 'Hökmlər və tövsiyələr', en: 'Rulings and guidance', ru: 'Положения и советы', ar: 'أحكام وتوجيهات', tr: 'Hükümler ve tavsiyeler' },
  title: { az: 'Qiblə: bilmək lazım olanlar', en: 'The qibla: what you need to know', ru: 'Кибла: что нужно знать', ar: 'القبلة: ما ينبغي معرفته', tr: 'Kıble: bilinmesi gerekenler' },
  lead: { az: 'Qibləyə yönəlməyin hökmü, istiqamət bəlli olmayanda nə etməli, səfərdə namaz, istiqamətin necə hesablandığı və kompası düzgün işlətmək qaydaları.', en: 'The ruling on facing the qibla, what to do when the direction is unclear, praying while travelling, how the direction is calculated and how to use a compass correctly.', ru: 'Положение об обращении к кибле, что делать, если направление неясно, молитва в пути, как вычисляется направление и как правильно пользоваться компасом.', ar: 'حكم استقبال القبلة، وما يفعله من اشتبهت عليه، والصلاة في السفر، وكيف يُحسب الاتجاه، وكيف تُستعمل البوصلة استعمالًا صحيحًا.', tr: 'Kıbleye yönelmenin hükmü, yön belli olmadığında ne yapılacağı, yolculukta namaz, yönün nasıl hesaplandığı ve pusulanın doğru kullanımı.' },
  contents: { az: 'Bölmələr', en: 'Sections', ru: 'Разделы', ar: 'الأقسام', tr: 'Bölümler' },
  sources: { az: 'Mənbələr', en: 'Sources', ru: 'Источники', ar: 'المصادر', tr: 'Kaynaklar' },
  city: { az: 'Şəhər', en: 'City', ru: 'Город', ar: 'المدينة', tr: 'Şehir' },
  bearing: { az: 'Qiblə bucağı', en: 'Qibla bearing', ru: 'Угол киблы', ar: 'زاوية القبلة', tr: 'Kıble açısı' },
  // Cənubdan qərbə sapma (Azərbaycanda qiblə 180°–270° arasındadır): bucaq − 180°
  side: { az: 'Cənubdan qərbə', en: 'West of due south', ru: 'От юга к западу', ar: 'من الجنوب نحو الغرب', tr: 'Güneyden batıya' },
  dist: { az: 'Kəbəyə məsafə', en: 'Distance to the Kaaba', ru: 'Расстояние до Каабы', ar: 'المسافة إلى الكعبة', tr: 'Kâbe’ye mesafe' },
}

// Cədvəldəki Azərbaycan şəhərləri (utils/prayerLocation.js PRAYER_CITIES id-ləri).
// Bucaq və məsafə səhifədə kompasla EYNİ funksiyalarla hesablanır.
export const QIBLA_TABLE_CITIES = ['Baku', 'Sumgait', 'Ganja', 'Mingachevir', 'Shirvan', 'Nakhchivan', 'Lankaran', 'Sheki', 'Shamakhi', 'Quba', 'Shusha', 'Zagatala']

export const QIBLA_GUIDE = [
  // ── 1. Şərt ──
  {
    id: 'condition', icon: 'qibla',
    title: { az: 'Qibləyə yönəlmək — namazın şərti', en: 'Facing the qibla — a condition of prayer', ru: 'Обращение к кибле — условие молитвы', ar: 'استقبال القبلة شرط لصحة الصلاة', tr: 'Kıbleye yönelmek — namazın şartı' },
    blocks: [
      {
        t: 'ayah', ref: '2:144',
        ar: 'قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِى ٱلسَّمَآءِ ۖ فَلَنُوَلِّيَنَّكَ قِبْلَةً تَرْضَىٰهَا ۚ فَوَلِّ وَجْهَكَ شَطْرَ ٱلْمَسْجِدِ ٱلْحَرَامِ ۚ وَحَيْثُ مَا كُنتُمْ فَوَلُّوا۟ وُجُوهَكُمْ شَطْرَهُۥ ۗ وَإِنَّ ٱلَّذِينَ أُوتُوا۟ ٱلْكِتَـٰبَ لَيَعْلَمُونَ أَنَّهُ ٱلْحَقُّ مِن رَّبِّهِمْ ۗ وَمَا ٱللَّهُ بِغَـٰفِلٍ عَمَّا يَعْمَلُونَ',
        text: {
          az: '«Biz sənin üzünü (vəhy gözləyərək) göyə çevirdiyini görürük. Səni razı qalacağın bir qibləyə mütləq yönəldəcəyik. Üzünü Məscidül-Hərama tərəf çevir! Harada olursunuzsa olun, üzünüzü ona tərəf çevirin. Kitab verilənlər bunun Rəbbindən gələn haqq olduğunu bilirlər. Allah onların etdiklərindən qafil deyildir.»',
          en: '“We have seen the turning of your face towards the heaven. So We will surely turn you to a qibla with which you will be pleased. So turn your face towards al-Masjid al-Haram. And wherever you are, turn your faces towards it. Those who were given the Scripture know well that it is the truth from their Lord. And Allah is not unaware of what they do.”',
          ru: '«Мы видели, как ты обращал своё лицо к небу. Мы непременно обратим тебя к кибле, которой ты будешь доволен. Обрати же лицо в сторону Заповедной мечети. Где бы вы ни были, обращайте ваши лица в её сторону. Те, кому даровано Писание, знают, что это — истина от их Господа. Аллах не находится в неведении о том, что они совершают».',
          tr: '“Yüzünü (vahiy beklercesine) göğe çevirip durduğunu görüyoruz. Elbette seni hoşnut olacağın bir kıbleye çevireceğiz. Yüzünü Mescid-i Haram tarafına çevir. Nerede olursanız olun yüzlerinizi o tarafa çevirin. Kendilerine Kitap verilenler bunun Rablerinden gelen bir gerçek olduğunu bilirler. Allah onların yaptıklarından habersiz değildir.”',
        },
      },
      { t: 'p', text: {
        az: 'Qibləyə yönəlmək Quran, Sünnə və alimlərin icması ilə namazın düzgünlüyünün şərtlərindəndir: buna gücü çatan şəxs qibləyə yönəlmədən fərz namaz qılarsa, namazı keçərli olmur. Peyğəmbər ﷺ namazı düzgün qılmayan şəxsə öyrədərkən bu şərti ayrıca qeyd etmişdir:',
        en: 'Facing the qibla is one of the conditions for the validity of prayer, by the Quran, the Sunnah and the consensus of the scholars: whoever is able to face it and prays an obligatory prayer without doing so has not prayed validly. When the Prophet ﷺ taught the man who prayed badly, he mentioned this condition explicitly:',
        ru: 'Обращение к кибле — одно из условий действительности молитвы согласно Корану, Сунне и единогласному мнению учёных: если человек, способный обратиться к ней, совершил обязательную молитву, не обратившись, его молитва недействительна. Обучая человека, который молился неправильно, Пророк ﷺ особо упомянул это условие:',
        ar: 'استقبال القبلة شرط من شروط صحة الصلاة بالكتاب والسنة والإجماع؛ فمن قدر عليه وصلى الفريضة إلى غيرها لم تصح صلاته. وقد نصّ عليه النبي ﷺ حين علّم المسيء صلاته:',
        tr: 'Kıbleye yönelmek Kur’an, Sünnet ve âlimlerin icmâsıyla namazın sıhhat şartlarındandır: gücü yettiği hâlde kıbleye yönelmeden farz namaz kılanın namazı geçerli olmaz. Peygamber ﷺ namazını kötü kılan adama öğretirken bu şartı özellikle belirtmiştir:',
      } },
      {
        t: 'hadith', src: S('Buxari 6251'),
        ar: 'إِذَا قُمْتَ إِلَى الصَّلاَةِ فَأَسْبِغِ الْوُضُوءَ، ثُمَّ اسْتَقْبِلِ الْقِبْلَةَ فَكَبِّرْ',
        text: {
          az: '«Namaza duranda dəstəmazı kamil al, sonra qibləyə yönəl və təkbir de...»',
          en: '“When you stand for prayer, perform ablution thoroughly, then face the qibla and say the takbir…”',
          ru: '«Когда встаёшь на молитву, соверши омовение как следует, затем обратись к кибле и произнеси такбир…»',
          tr: '“Namaza kalktığında abdestini güzelce al, sonra kıbleye yönel ve tekbir getir…”',
        },
      },
      { t: 'p', text: {
        az: 'Kəbəni görən şəxs binanın özünə yönəlməlidir. Uzaqda olan isə onun tərəfinə (cihətinə) yönəlir — dəqiq dərəcəyə qədər tutmaq tələb olunmur. Peyğəmbər ﷺ qibləsi cənubda olan Mədinə əhli üçün belə buyurmuşdur:',
        en: 'Whoever can see the Kaaba must face the building itself. Whoever is far away faces its direction — hitting the exact degree is not required. The Prophet ﷺ said, addressing the people of Madinah, whose qibla is to the south:',
        ru: 'Тот, кто видит Каабу, должен обратиться к самому зданию. Находящийся вдали обращается в её сторону — попадать в точный градус не требуется. Пророк ﷺ сказал жителям Медины, чья кибла находится на юге:',
        ar: 'من يشاهد الكعبة فعليه أن يستقبل عينها، ومن بَعُد عنها فالواجب عليه استقبال جهتها، ولا يُشترط إصابة الدرجة الدقيقة؛ قال النبي ﷺ — وهو خطاب لأهل المدينة الذين قبلتهم جهة الجنوب:',
        tr: 'Kâbe’yi gören kişi binanın kendisine yönelmelidir. Uzakta olan ise onun tarafına (cihetine) yönelir; tam dereceyi tutturmak gerekmez. Peygamber ﷺ kıblesi güneyde olan Medine halkına hitaben şöyle buyurmuştur:',
      } },
      {
        t: 'hadith', src: S('Tirmizi 344'), grade: SAHIH_T,
        ar: 'مَا بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ قِبْلَةٌ',
        text: {
          az: '«Şərqlə qərbin arası qiblədir.»',
          en: '“What is between the east and the west is qibla.”',
          ru: '«То, что между востоком и западом, — кибла».',
          tr: '“Doğu ile batı arası kıbledir.”',
        },
      },
      { t: 'note', kind: 'info', text: {
        az: 'İbn Useymin: «Əgər bir insanın qiblədən bir az kənara yönəlib namaz qıldığını görsək, bunun zərəri yoxdur.» Yəni bir neçə dərəcəlik fərq namazı pozmur; əsas olan düzgün tərəfə yönəlməkdir (İslam Soru-Cevap, 42574).',
        en: 'Ibn Uthaymin: “If we see a person praying in a direction that is slightly off from the qibla, that does not matter.” A deviation of a few degrees does not invalidate the prayer; what matters is facing the right direction (IslamQA, 42574).',
        ru: 'Ибн Усаймин: «Если мы видим человека, который молится, немного отклонившись от киблы, в этом нет ничего страшного». Отклонение на несколько градусов не делает молитву недействительной; главное — обращаться в правильную сторону («Ислам: вопрос и ответ», 42574).',
        ar: 'قال ابن عثيمين: إذا رأينا إنسانًا يصلي منحرفًا عن القبلة انحرافًا يسيرًا فإن ذلك لا يضر. فالفرق بدرجات قليلة لا يبطل الصلاة، والمعتبر استقبال الجهة (الإسلام سؤال وجواب، 42574).',
        tr: 'İbn Useymîn: “Kıbleden biraz sapmış olarak namaz kılan birini görürsek bunun zararı yoktur.” Birkaç derecelik fark namazı bozmaz; önemli olan doğru tarafa yönelmektir (İslam Soru-Cevap, 42574).',
      } },
      { t: 'p', text: {
        az: 'Qibləyə yönəlmək yalnız gücü çatana vacibdir: məsələn, yatağa bağlı xəstəni qibləyə çevirən adam yoxdursa, o, olduğu vəziyyətdə qılır — «Allahdan bacardığınız qədər qorxun» (Təğabun, 64:16). Səfərdə nafilə namazın istisnası aşağıda izah olunur.',
        en: 'Facing the qibla is required only of one who is able: for example, a bedridden patient with no one to turn him prays as he is — “So fear Allah as much as you are able” (at-Taghabun 64:16). The exception for voluntary prayers while travelling is explained below.',
        ru: 'Обращение к кибле обязательно лишь для того, кто способен на это: например, лежачий больной, которого некому повернуть, молится в том положении, в каком находится, — «Бойтесь же Аллаха, насколько можете» (ат-Тагабун, 64:16). Исключение для добровольных молитв в пути разъясняется ниже.',
        ar: 'ولا يجب استقبال القبلة إلا على القادر؛ فالمريض العاجز الذي لا يجد من يوجّهه يصلي على حاله، لقوله تعالى: ﴿فَاتَّقُوا اللَّهَ مَا اسْتَطَعْتُمْ﴾ (التغابن: 16). وأما استثناء النافلة في السفر فيأتي بيانه.',
        tr: 'Kıbleye yönelmek ancak gücü yetene farzdır: örneğin onu kıbleye çevirecek kimsesi olmayan yatalak hasta bulunduğu hâlde kılar — “Gücünüz yettiğince Allah’tan korkun” (Teğâbün 64:16). Yolculukta nafile namazın istisnası aşağıda açıklanmıştır.',
      } },
    ],
    links: [{ kind: 'page', key: 'prayerguide', label: { az: 'Namaz addım-addım — Namaz bələdçisi', en: 'Prayer step by step — Prayer guide', ru: 'Намаз шаг за шагом — руководство', ar: 'الصلاة خطوة بخطوة — دليل الصلاة', tr: 'Adım adım namaz — Namaz rehberi' } }],
  },

  // ── 2. İstiqamət bəlli deyilsə ──
  {
    id: 'unsure', icon: 'compass',
    title: { az: 'İstiqamət bəlli olmayanda', en: 'When you are unsure of the direction', ru: 'Если направление неизвестно', ar: 'إذا اشتبهت القبلة', tr: 'Yön belli olmadığında' },
    blocks: [
      { t: 'steps', items: [
        { title: { az: 'Bilən adamdan soruşun', en: 'Ask someone who knows', ru: 'Спросите знающего', ar: 'اسأل من يعرف', tr: 'Bilene sorun' },
          text: { az: 'Yerli etibarlı müsəlmandan soruşmaq və ya yaxınlıqdakı məscidin mehrabına baxmaq ən etibarlı yoldur — məscidlərin istiqaməti adətən diqqətlə müəyyən edilir.', en: 'Asking a trustworthy local Muslim or looking at the mihrab of a nearby mosque is the most reliable way — mosque directions are usually set carefully.', ru: 'Спросить надёжного местного мусульманина или посмотреть на михраб ближайшей мечети — самый надёжный путь: направление мечетей обычно определяют тщательно.', ar: 'سؤال مسلم ثقة من أهل البلد أو النظر إلى محراب مسجد قريب أوثق الطرق؛ فالمساجد تُحرَّر قبلتها عادة.', tr: 'Güvenilir yerel bir Müslümana sormak veya yakındaki bir caminin mihrabına bakmak en güvenilir yoldur; camilerin yönü genellikle dikkatle belirlenir.' } },
        { title: { az: 'Alətlərdən istifadə edin', en: 'Use tools', ru: 'Используйте инструменты', ar: 'استعن بالوسائل', tr: 'Araçlardan yararlanın' },
          text: { az: 'Bu səhifənin kompası, adi kompas və hesablanmış bucaq, günəşin və ya ulduzların yeri — hamısı istiqaməti tapmağa kömək edən əlamətlərdir.', en: 'This page’s compass, an ordinary compass with the calculated bearing, the position of the sun or the stars — all are signs that help find the direction.', ru: 'Компас на этой странице, обычный компас с вычисленным углом, положение солнца или звёзд — всё это признаки, помогающие найти направление.', ar: 'بوصلة هذه الصفحة، أو بوصلة عادية مع الزاوية المحسوبة، أو موضع الشمس والنجوم — كلها علامات تعين على معرفة الجهة.', tr: 'Bu sayfanın pusulası, hesaplanmış açıyla sıradan bir pusula, güneşin veya yıldızların konumu — hepsi yönü bulmaya yardım eden işaretlerdir.' } },
        { title: { az: 'İctihad edin', en: 'Make your best judgement (ijtihad)', ru: 'Приложите усилие (иджтихад)', ar: 'اجتهد وتحرَّ', tr: 'İçtihat edin' },
          text: { az: 'Heç bir vasitə yoxdursa, əlamətlərə baxıb ən güclü zənninizə görə istiqaməti seçin və o tərəfə qılın. Bu sizin borcunuzdur və namazınız keçərlidir.', en: 'If no means are available, weigh the signs, choose the direction you most strongly believe is right and pray towards it. That is what is required of you, and your prayer is valid.', ru: 'Если никаких средств нет, оцените признаки, выберите направление, в правильности которого вы уверены больше всего, и молитесь в эту сторону. Это то, что от вас требуется, и ваша молитва действительна.', ar: 'فإن لم تتيسر وسيلة فتحرَّ بالعلامات وصلِّ إلى الجهة التي يغلب على ظنك أنها القبلة؛ وهذا هو الواجب عليك، وصلاتك صحيحة.', tr: 'Hiçbir imkân yoksa işaretlere bakın, en güçlü kanaatinize göre yönü seçin ve o tarafa kılın. Sizden istenen budur ve namazınız geçerlidir.' } },
        { title: { az: 'Heç bir səy göstərmədən qılmayın', en: 'Do not pray without any effort', ru: 'Не молитесь без всякого старания', ar: 'لا تصلِّ بلا تحرٍّ', tr: 'Hiç çaba göstermeden kılmayın' },
          text: { az: 'İbn Baz: istiqaməti öyrənməyə çalışmadan qılınan fərz namaz caiz deyil və (istiqamət səhv çıxarsa) təkrar qılınmalıdır.', en: 'Ibn Baz: praying an obligatory prayer without trying to determine the direction is not allowed, and (if the direction turns out wrong) it must be repeated.', ru: 'Ибн Баз: совершать обязательную молитву, не постаравшись определить направление, нельзя, и (если направление оказалось неверным) её нужно повторить.', ar: 'قال ابن باز: لا يجوز أن يصلي الفريضة دون اجتهاد في معرفة القبلة، ومن فعل ذلك فعليه الإعادة.', tr: 'İbn Bâz: yönü öğrenmeye çalışmadan kılınan farz namaz caiz değildir ve (yön yanlış çıkarsa) yeniden kılınmalıdır.' } },
      ] },
      { t: 'p', text: {
        az: 'Qiblə dəyişəndə Quba əhli sübh namazında idi. Xəbər gələndə onlar namazı pozmadan Kəbəyə tərəf döndülər və namazı tamamladılar. Alimlər bundan çıxarış edir ki, namaz əsnasında düzgün istiqaməti öyrənən şəxs dönür və namazına davam edir.',
        en: 'When the qibla was changed, the people of Quba were in the Fajr prayer. When the news reached them, they turned towards the Kaaba without breaking their prayer and completed it. Scholars infer from this that whoever learns the correct direction during the prayer turns and continues.',
        ru: 'Когда кибла была изменена, жители Кубы совершали утреннюю молитву. Получив весть, они, не прерывая молитвы, повернулись к Каабе и завершили её. Учёные выводят отсюда, что тот, кто узнал правильное направление во время молитвы, поворачивается и продолжает её.',
        ar: 'لما حُوِّلت القبلة كان أهل قباء في صلاة الصبح، فلما جاءهم الخبر استداروا إلى الكعبة وأتمّوا صلاتهم ولم يستأنفوها؛ ويستدل العلماء بذلك على أن من علم الصواب أثناء الصلاة استدار وبنى عليها.',
        tr: 'Kıble değiştiğinde Kuba halkı sabah namazındaydı. Haber gelince namazı bozmadan Kâbe’ye döndüler ve namazı tamamladılar. Âlimler buradan, namaz esnasında doğru yönü öğrenen kişinin dönüp namazına devam edeceği sonucunu çıkarır.',
      } },
      {
        t: 'hadith', src: S('Buxari 403'),
        ar: 'بَيْنَا النَّاسُ بِقُبَاءٍ فِي صَلاَةِ الصُّبْحِ إِذْ جَاءَهُمْ آتٍ فَقَالَ: إِنَّ رَسُولَ اللَّهِ ﷺ قَدْ أُنْزِلَ عَلَيْهِ اللَّيْلَةَ قُرْآنٌ، وَقَدْ أُمِرَ أَنْ يَسْتَقْبِلَ الْكَعْبَةَ فَاسْتَقْبِلُوهَا. وَكَانَتْ وُجُوهُهُمْ إِلَى الشَّأْمِ، فَاسْتَدَارُوا إِلَى الْكَعْبَةِ',
        text: {
          az: 'İbn Ömər dedi: «İnsanlar Qubada sübh namazında ikən onlara biri gəlib dedi: “Bu gecə Allahın Elçisinə ﷺ Quran nazil olub, ona Kəbəyə yönəlmək əmr edilib, siz də ona yönəlin.” Onların üzləri Şama tərəf idi, Kəbəyə tərəf döndülər.»',
          en: 'Ibn Umar said: “While the people were at Quba in the Fajr prayer, someone came to them and said: ‘Quran has been revealed to the Messenger of Allah ﷺ tonight and he has been commanded to face the Kaaba, so face it.’ Their faces were towards Sham, and they turned round towards the Kaaba.”',
          ru: 'Ибн Умар сказал: «Когда люди в Кубе совершали утреннюю молитву, к ним пришёл человек и сказал: “Этой ночью Посланнику Аллаха ﷺ был ниспослан Коран, и ему велено обращаться к Каабе, так обратитесь же к ней”. Их лица были обращены к Шаму, и они повернулись к Каабе».',
          tr: 'İbn Ömer dedi ki: “İnsanlar Kuba’da sabah namazındayken birisi gelip şöyle dedi: ‘Bu gece Allah’ın Resûlü’ne ﷺ Kur’an indirildi ve Kâbe’ye yönelmesi emredildi; siz de ona yönelin.’ Yüzleri Şam tarafına dönüktü, Kâbe’ye doğru döndüler.”',
        },
      },
      { t: 'qa', items: [
        { q: { az: 'Səy göstərib qıldım, sonra istiqamətin səhv olduğunu bildim. Namazı təkrarlamalıyammı?', en: 'I tried my best and prayed, then learned the direction was wrong. Must I repeat the prayer?', ru: 'Я постарался, помолился, а потом узнал, что направление было неверным. Нужно ли повторять молитву?', ar: 'اجتهدت وصليت ثم تبيّن لي الخطأ في القبلة، فهل أعيد؟', tr: 'Çaba gösterip kıldım, sonra yönün yanlış olduğunu öğrendim. Namazı tekrar kılmalı mıyım?' },
          a: { az: 'Xeyr. Daimi Komitə və İbn Baz bildirir ki, qibləni öyrənmək üçün əlindən gələni edib qılan şəxsin namazı keçərlidir, sonradan səhv aşkar olunsa belə. Sonrakı namazları düzgün istiqamətə qılırsınız.', en: 'No. The Standing Committee and Ibn Baz state that whoever did his best to find the qibla and prayed, his prayer is valid even if the mistake becomes clear afterwards. You pray the following prayers in the correct direction.', ru: 'Нет. Постоянный комитет и Ибн Баз указывают: если человек сделал всё возможное, чтобы определить киблу, и помолился, его молитва действительна, даже если ошибка выяснилась потом. Следующие молитвы совершаются в правильном направлении.', ar: 'لا. قررت اللجنة الدائمة وابن باز أن من اجتهد في معرفة القبلة وصلى فصلاته صحيحة ولو تبيّن خطؤه بعد ذلك، ويصلي ما بعدها إلى الجهة الصحيحة.', tr: 'Hayır. Daimi Komite ve İbn Bâz, kıbleyi bulmak için elinden geleni yapıp kılanın namazının, sonradan hata ortaya çıksa bile geçerli olduğunu belirtir. Sonraki namazları doğru yöne kılarsınız.' },
          ref: QA42574, url: URL.qa42574 },
        { q: { az: 'Kompas bir neçə dərəcə fərqli göstərir. Bu, namaza təsir edirmi?', en: 'My compass shows a few degrees of difference. Does that affect the prayer?', ru: 'Компас показывает разницу в несколько градусов. Влияет ли это на молитву?', ar: 'البوصلة تُظهر فرقًا بدرجات قليلة، فهل يؤثر ذلك في الصلاة؟', tr: 'Pusula birkaç derece farklı gösteriyor. Bu namazı etkiler mi?' },
          a: { az: 'Xeyr. Uzaqda olan şəxsdən qiblənin tərəfinə yönəlmək tələb olunur; az kənara çıxmaq zərər vermir. Ciddi və bilərəkdən fərq isə düzəldilməlidir.', en: 'No. One who is far away is required to face the direction of the qibla; a slight deviation does no harm. A large, knowing deviation, however, must be corrected.', ru: 'Нет. От находящегося вдали требуется обращаться в сторону киблы; небольшое отклонение не вредит. Значительное и осознанное отклонение следует исправить.', ar: 'لا؛ فالواجب على البعيد استقبال الجهة، والانحراف اليسير لا يضر، أما الانحراف الكبير مع العلم فيجب تصحيحه.', tr: 'Hayır. Uzakta olandan kıblenin tarafına yönelmesi istenir; biraz sapma zarar vermez. Büyük ve bilerek yapılan sapma ise düzeltilmelidir.' },
          ref: QA42574, url: URL.qa42574 },
      ] },
    ],
  },

  // ── 3. Səfərdə ──
  {
    id: 'travel', icon: 'globe',
    title: { az: 'Təyyarədə, qatarda və maşında namaz', en: 'Praying on a plane, train or in a car', ru: 'Молитва в самолёте, поезде и машине', ar: 'الصلاة في الطائرة والقطار والسيارة', tr: 'Uçakta, trende ve arabada namaz' },
    blocks: [
      { t: 'p', text: {
        az: 'Sünnə fərz namazla nafilə namaz arasında fərq qoyur: Peyğəmbər ﷺ səfərdə nafiləni minik heyvanının üstündə, o hansı tərəfə gedirsə, o tərəfə qılırdı; fərz üçün isə enib qibləyə yönəlirdi.',
        en: 'The Sunnah distinguishes between obligatory and voluntary prayers: when travelling, the Prophet ﷺ prayed voluntary prayers on his mount in whatever direction it was heading, but for the obligatory prayer he dismounted and faced the qibla.',
        ru: 'Сунна различает обязательную и добровольную молитву: в пути Пророк ﷺ совершал добровольные молитвы верхом, куда бы ни направлялось животное, а для обязательной молитвы спешивался и обращался к кибле.',
        ar: 'فرّقت السنة بين الفريضة والنافلة؛ فكان النبي ﷺ في السفر يتنفّل على راحلته حيث توجهت به، فإذا أراد الفريضة نزل فاستقبل القبلة.',
        tr: 'Sünnet farz ile nafile namaz arasında ayrım yapar: Peygamber ﷺ yolculukta nafileyi bineğinin üzerinde, o hangi yöne gidiyorsa o yöne kılar; farz için ise inip kıbleye yönelirdi.',
      } },
      {
        t: 'hadith', src: S('Buxari 1094'),
        ar: 'أَنَّ النَّبِيَّ ﷺ كَانَ يُصَلِّي التَّطَوُّعَ وَهْوَ رَاكِبٌ فِي غَيْرِ الْقِبْلَةِ',
        text: {
          az: 'Cabir ibn Abdullah: «Peyğəmbər ﷺ nafilə namazı minikdə ikən qiblədən başqa tərəfə qılırdı.»',
          en: 'Jabir ibn Abdullah: “The Prophet ﷺ used to pray voluntary prayers while riding, facing other than the qibla.”',
          ru: 'Джабир ибн Абдуллах: «Пророк ﷺ совершал добровольные молитвы верхом, не обращаясь к кибле».',
          tr: 'Câbir b. Abdullah: “Peygamber ﷺ nafile namazı binek üzerindeyken kıbleden başka bir yöne kılardı.”',
        },
      },
      {
        t: 'hadith', src: S('Buxari 400'),
        ar: 'كَانَ رَسُولُ اللَّهِ ﷺ يُصَلِّي عَلَى رَاحِلَتِهِ حَيْثُ تَوَجَّهَتْ، فَإِذَا أَرَادَ الْفَرِيضَةَ نَزَلَ فَاسْتَقْبَلَ الْقِبْلَةَ',
        text: {
          az: 'Cabir: «Allahın Elçisi ﷺ minik heyvanının üstündə, o hara yönəlirdisə, (o tərəfə) namaz qılırdı. Fərz namaz qılmaq istəyəndə isə enir və qibləyə yönəlirdi.»',
          en: 'Jabir: “The Messenger of Allah ﷺ used to pray on his mount wherever it faced; when he wanted to pray the obligatory prayer he dismounted and faced the qibla.”',
          ru: 'Джабир: «Посланник Аллаха ﷺ молился верхом, куда бы ни было обращено животное, а когда хотел совершить обязательную молитву, спешивался и обращался к кибле».',
          tr: 'Câbir: “Allah’ın Resûlü ﷺ bineği nereye yönelirse (o yöne) namaz kılardı; farz namazı kılmak istediğinde ise iner ve kıbleye yönelirdi.”',
        },
      },
      {
        t: 'hadith', src: S('Buxari 1000'),
        ar: 'كَانَ النَّبِيُّ ﷺ يُصَلِّي فِي السَّفَرِ عَلَى رَاحِلَتِهِ، حَيْثُ تَوَجَّهَتْ بِهِ، يُومِئُ إِيمَاءً، صَلاَةَ اللَّيْلِ إِلاَّ الْفَرَائِضَ، وَيُوتِرُ عَلَى رَاحِلَتِهِ',
        text: {
          az: 'İbn Ömər: «Peyğəmbər ﷺ səfərdə gecə namazını minik heyvanının üstündə, o hara gedirdisə, işarə ilə qılırdı — fərzlərdən başqa; vitri də minikdə qılırdı.»',
          en: 'Ibn Umar: “When travelling, the Prophet ﷺ prayed the night prayer on his mount, wherever it took him, making gestures — except the obligatory prayers — and he prayed witr on his mount.”',
          ru: 'Ибн Умар: «В пути Пророк ﷺ совершал ночную молитву верхом, куда бы ни везло его животное, делая знаки, — кроме обязательных молитв, и совершал витр верхом».',
          tr: 'İbn Ömer: “Peygamber ﷺ yolculukta gece namazını bineğinin üzerinde, o nereye giderse, işaretle kılardı — farzlar hariç; vitri de binek üzerinde kılardı.”',
        },
      },
      { t: 'table',
        head: [
          { az: 'Məsələ', en: 'Issue', ru: 'Вопрос', ar: 'المسألة', tr: 'Mesele' },
          { az: 'Fərz namaz', en: 'Obligatory prayer', ru: 'Обязательная молитва', ar: 'الفريضة', tr: 'Farz namaz' },
          { az: 'Nafilə namaz', en: 'Voluntary prayer', ru: 'Добровольная молитва', ar: 'النافلة', tr: 'Nafile namaz' },
        ],
        rows: [
          [
            { az: 'Qiblə', en: 'Qibla', ru: 'Кибла', ar: 'القبلة', tr: 'Kıble' },
            { az: 'Vacibdir; nəqliyyat dönəndə siz də qibləyə tərəf dönürsünüz', en: 'Required; when the vehicle turns, you turn back towards the qibla', ru: 'Обязательна; когда транспорт поворачивает, вы снова поворачиваетесь к кибле', ar: 'واجبة، ويدور مع الطائرة إلى القبلة كلما انحرفت', tr: 'Farzdır; araç döndükçe siz de kıbleye doğru dönersiniz' },
            { az: 'Vacib deyil — hərəkət istiqamətinə qılmaq olar', en: 'Not required — you may pray in the direction of travel', ru: 'Не обязательна — можно молиться в направлении движения', ar: 'لا تجب، ويكفي أن يصلي إلى جهة سيره', tr: 'Farz değil — gidiş yönüne kılınabilir' },
          ],
          [
            { az: 'Qiyam, rüku, səcdə', en: 'Standing, bowing, prostration', ru: 'Стояние, поясной и земной поклоны', ar: 'القيام والركوع والسجود', tr: 'Kıyam, rükû, secde' },
            { az: 'Bacarırsınızsa — ayaq üstə, tam; bacarmırsınızsa — oturaq, işarə ilə', en: 'If you can — standing and in full; if not — seated, by gestures', ru: 'Если можете — стоя и полностью; если нет — сидя, знаками', ar: 'يصلي قائمًا يركع ويسجد إن قدر، وإلا صلى جالسًا يومئ', tr: 'Gücünüz yetiyorsa — ayakta ve tam; yetmiyorsa — oturarak, işaretle' },
            { az: 'Oturaq, işarə ilə qılmaq olar (rükudan səcdə bir az aşağı)', en: 'May be prayed seated, by gestures (the prostration lower than the bow)', ru: 'Можно сидя, знаками (земной поклон ниже поясного)', ar: 'يجوز جالسًا يومئ، ويجعل السجود أخفض من الركوع', tr: 'Oturarak, işaretle kılınabilir (secde rükûdan biraz alçak)' },
          ],
          [
            { az: 'Vaxt', en: 'Timing', ru: 'Время', ar: 'الوقت', tr: 'Vakit' },
            { az: 'Vaxt çıxmamış enib yerdə qılmaq mümkündürsə, bu daha yaxşıdır', en: 'If you can land and pray on the ground before the time ends, that is better', ru: 'Если можно приземлиться и помолиться на земле до конца времени — так лучше', ar: 'إن أمكن تأخيرها حتى ينزل في الوقت فلا بأس، وهو أحوط', tr: 'Vakit çıkmadan inip yerde kılmak mümkünse bu daha iyidir' },
            { az: 'İstənilən vaxt (qadağan vaxtlardan başqa)', en: 'Any time (outside the forbidden times)', ru: 'В любое время (кроме запретных)', ar: 'في أي وقت عدا أوقات النهي', tr: 'Her zaman (yasak vakitler dışında)' },
          ],
        ],
      },
      { t: 'qa', items: [
        { q: { az: 'Uzun uçuşda fərz namazın vaxtı girir. Necə qılım?', en: 'The time of an obligatory prayer comes in during a long flight. How do I pray?', ru: 'Во время долгого перелёта наступает время обязательной молитвы. Как молиться?', ar: 'دخل وقت الفريضة وأنا في رحلة طويلة، فكيف أصلي؟', tr: 'Uzun uçuşta farz namazın vakti giriyor. Nasıl kılayım?' },
          a: { az: 'İbn Baz: imkanına görə qılır — bacarırsa, gəmidə olduğu kimi ayaq üstə, rüku və səcdə ilə; bacarmırsa, oturduğu yerdə işarə ilə. Qibləyə yönəlir və təyyarə istiqamətini dəyişdikcə onunla birlikdə dönür. Nafilədə isə uçuş istiqamətinə yönəlmək kifayətdir.', en: 'Ibn Baz: he prays according to his ability — standing with bowing and prostration if he can, as on a ship; if not, seated, by gestures. He faces the qibla and turns with the plane as it changes course. For voluntary prayers, facing the direction of flight is enough.', ru: 'Ибн Баз: молится по возможности — если может, стоя, с поясным и земным поклоном, как на корабле; если нет — сидя на месте, знаками. Он обращается к кибле и поворачивается вместе с самолётом, когда тот меняет курс. В добровольной молитве достаточно обращаться по направлению полёта.', ar: 'قال ابن باز: يصلي على حسب حاله، إن قدر صلى قائمًا يركع ويسجد كالسفينة، وإلا صلى جالسًا يومئ، ويستقبل القبلة ويدور مع الطائرة، أما النافلة فيكفيه أن يكون إلى جهة سيره.', tr: 'İbn Bâz: imkânına göre kılar — gücü yetiyorsa gemide olduğu gibi ayakta, rükû ve secdeyle; yetmiyorsa oturduğu yerde işaretle. Kıbleye yönelir ve uçak yön değiştirdikçe onunla birlikte döner. Nafilede ise uçuş yönüne yönelmek yeterlidir.' },
          ref: BAZ4298, url: URL.baz4298 },
        { q: { az: 'Təyyarədə qiblənin hara olduğunu bilmirəm.', en: 'I do not know where the qibla is on the plane.', ru: 'Я не знаю, где кибла в самолёте.', ar: 'لا أعرف جهة القبلة في الطائرة.', tr: 'Uçakta kıblenin nerede olduğunu bilmiyorum.' },
          a: { az: 'İbn Baz: təyyarədə və ya səhrada olan müsəlman qibləni bilənlərdən soruşmaq və ya əlamətlərə baxmaqla öyrənməyə çalışmalıdır. Bu mümkün deyilsə, ictihad edib qılır və namazı keçərlidir, sonra səhv çıxsa belə. Vaxt kifayət edirsə, enənə qədər gecikdirməkdə də eyib yoxdur. Nafilədə — təyyarə, maşın və minikdə — qibləyə yönəlmək vacib deyil; mümkünsə, başlanğıc təkbirdə qibləyə yönəlmək müstəhəbdir.', en: 'Ibn Baz: a Muslim on a plane or in the desert must try to learn the qibla by asking those who know or by looking at its signs. If that is not possible, he makes ijtihad and prays, and his prayer is valid even if it later proves mistaken. If there is enough time, there is no harm in delaying until landing. In voluntary prayers — on a plane, in a car or on a mount — facing the qibla is not required; if easy, it is recommended to face it at the opening takbir.', ru: 'Ибн Баз: мусульманин в самолёте или в пустыне должен постараться узнать киблу, спросив знающих или посмотрев на её признаки. Если это невозможно, он прилагает усилие (иджтихад) и молится, и молитва действительна, даже если потом окажется ошибочной. Если времени достаточно, нет ничего плохого в том, чтобы отложить молитву до посадки. В добровольной молитве — в самолёте, машине или верхом — обращение к кибле не обязательно; если легко, желательно обратиться к ней при начальном такбире.', ar: 'قال ابن باز: الواجب على المسلم إذا كان في الطائرة أو في الصحراء أن يجتهد في معرفة القبلة بسؤال أهل الخبرة أو بالنظر في علاماتها، فإن لم يتيسر اجتهد وتحرى وصلى ويجزئه ذلك ولو بان خطؤه، ولا حرج في تأخيرها حتى ينزل إذا كان الوقت متسعًا. أما النافلة في الطائرة والسيارة والدابة فلا يجب فيها الاستقبال، ويُستحب أن يستقبل القبلة عند الإحرام إن تيسر.', tr: 'İbn Bâz: uçakta veya çölde bulunan Müslüman, bilenlere sorarak ya da işaretlerine bakarak kıbleyi öğrenmeye çalışmalıdır. Bu mümkün değilse içtihat edip kılar; sonradan hata ortaya çıksa bile namazı geçerlidir. Vakit yeterliyse inişe kadar ertelemesinde de sakınca yoktur. Nafilede — uçakta, arabada ve binekte — kıbleye yönelmek farz değildir; kolaysa iftitah tekbirinde kıbleye yönelmek müstehaptır.' },
          ref: BAZ20706, url: URL.baz20706 },
        { q: { az: 'Maşın sürərkən və ya avtobusda fərz namazı oturaq qılmaq olarmı?', en: 'May I pray an obligatory prayer seated while driving or on a bus?', ru: 'Можно ли совершать обязательную молитву сидя за рулём или в автобусе?', ar: 'هل أصلي الفريضة جالسًا وأنا أقود السيارة أو في الحافلة؟', tr: 'Araba sürerken veya otobüste farz namazı oturarak kılabilir miyim?' },
          a: { az: 'Fərz namazda qibləyə yönəlmək və qiyam, rüku, səcdə — gücü çatana vacibdir. Ona görə maşını saxlayıb yerdə qılmaq mümkündürsə, belə edilir (Peyğəmbər ﷺ fərz üçün minikdən enirdi). Nafiləni isə maşında hərəkət istiqamətinə qılmaq olar.', en: 'In an obligatory prayer, facing the qibla and standing, bowing and prostrating are required of whoever is able. So if you can stop and pray on the ground, do so (the Prophet ﷺ dismounted for the obligatory prayer). Voluntary prayers may be prayed in the car facing the direction of travel.', ru: 'В обязательной молитве обращение к кибле, стояние, поясной и земной поклоны обязательны для способного. Поэтому, если можно остановиться и помолиться на земле, так и делают (Пророк ﷺ спешивался для обязательной молитвы). Добровольные молитвы можно совершать в машине по направлению движения.', ar: 'الفريضة يجب فيها الاستقبال والقيام والركوع والسجود على القادر، فإن أمكنه أن يقف ويصلي على الأرض فعل، كما كان النبي ﷺ ينزل للفريضة. أما النافلة فتجوز في السيارة إلى جهة سيره.', tr: 'Farz namazda kıbleye yönelmek ile kıyam, rükû ve secde gücü yetene farzdır. Bu yüzden durup yerde kılmak mümkünse öyle yapılır (Peygamber ﷺ farz için bineğinden inerdi). Nafile ise arabada gidiş yönüne kılınabilir.' } },
      ] },
    ],
  },

  // ── 4. Hesablama ──
  {
    id: 'calculation', icon: 'globe',
    title: { az: 'İstiqamət necə hesablanır', en: 'How the direction is calculated', ru: 'Как вычисляется направление', ar: 'كيف يُحسب الاتجاه', tr: 'Yön nasıl hesaplanır' },
    blocks: [
      { t: 'p', text: {
        az: 'Yer kürəsi kürəşəkillidir, ona görə iki nöqtə arasındakı ən qısa yol düz xətt yox, «böyük dairə» qövsüdür — uzaq məsafəli təyyarələrin xəritədə əyri görünən marşrutu kimi. Qiblə bucağı sizin olduğunuz yerdən Kəbəyə gedən bu ən qısa qövsün başlanğıc istiqamətidir və coğrafi şimaldan saat əqrəbi istiqamətində ölçülür.',
        en: 'The Earth is a sphere, so the shortest path between two points is not a straight line but an arc of a “great circle” — like a long-haul flight route that looks curved on a map. The qibla bearing is the starting direction of this shortest arc from where you are to the Kaaba, measured clockwise from true (geographic) north.',
        ru: 'Земля — шар, поэтому кратчайший путь между двумя точками — не прямая, а дуга «большого круга», как маршрут дальнего авиарейса, который на карте выглядит изогнутым. Угол киблы — это начальное направление этой кратчайшей дуги от вашего места до Каабы, отсчитанное по часовой стрелке от географического севера.',
        ar: 'الأرض كروية، فأقصر طريق بين نقطتين ليس خطًا مستقيمًا بل قوس من «دائرة عظمى»، كمسار الطائرات البعيدة الذي يبدو منحنيًا على الخريطة. وزاوية القبلة هي الاتجاه الابتدائي لهذا القوس الأقصر من موضعك إلى الكعبة، مقيسةً من الشمال الجغرافي باتجاه عقارب الساعة.',
        tr: 'Dünya küre şeklindedir; bu yüzden iki nokta arasındaki en kısa yol düz bir çizgi değil, bir “büyük daire” yayıdır — uzun mesafeli uçuşların haritada eğri görünen rotası gibi. Kıble açısı, bulunduğunuz yerden Kâbe’ye giden bu en kısa yayın başlangıç yönüdür ve coğrafi kuzeyden saat yönünde ölçülür.',
      } },
      { t: 'steps', items: [
        { title: { az: 'İki nöqtə', en: 'Two points', ru: 'Две точки', ar: 'نقطتان', tr: 'İki nokta' },
          text: { az: 'Sizin koordinatlarınız (φ₁, λ₁) — cihazın məkanından və ya seçilmiş şəhərdən; Kəbənin koordinatları (φ₂, λ₂) — 21,3891° şm. e., 39,8579° ş. u.', en: 'Your coordinates (φ₁, λ₁) — from the device location or the selected city; the Kaaba’s coordinates (φ₂, λ₂) — 21.3891° N, 39.8579° E.', ru: 'Ваши координаты (φ₁, λ₁) — по местоположению устройства или выбранному городу; координаты Каабы (φ₂, λ₂) — 21,3891° с. ш., 39,8579° в. д.', ar: 'إحداثياتك (φ₁، λ₁) من موقع الجهاز أو المدينة المختارة، وإحداثيات الكعبة (φ₂، λ₂): 21.3891° شمالًا، 39.8579° شرقًا.', tr: 'Sizin koordinatlarınız (φ₁, λ₁) — cihazın konumundan veya seçili şehirden; Kâbe’nin koordinatları (φ₂, λ₂) — 21,3891° K, 39,8579° D.' } },
        { title: { az: 'Uzunluq fərqi', en: 'Difference in longitude', ru: 'Разница долгот', ar: 'فرق خطّي الطول', tr: 'Boylam farkı' },
          text: { az: 'Δλ = λ₂ − λ₁ — Kəbənin sizdən nə qədər şərqdə və ya qərbdə olduğu.', en: 'Δλ = λ₂ − λ₁ — how far east or west of you the Kaaba lies.', ru: 'Δλ = λ₂ − λ₁ — насколько Кааба восточнее или западнее вас.', ar: 'Δλ = λ₂ − λ₁، أي مقدار بُعد الكعبة عنك شرقًا أو غربًا.', tr: 'Δλ = λ₂ − λ₁ — Kâbe’nin sizin ne kadar doğusunda veya batısında olduğu.' } },
        { title: { az: 'Başlanğıc bucaq düsturu', en: 'Initial bearing formula', ru: 'Формула начального угла', ar: 'معادلة الزاوية الابتدائية', tr: 'Başlangıç açısı formülü' },
          // lang-ok[atan,sin,cos]: riyazi düstur (funksiya adları)
          text: { az: 'θ = atan2( sin Δλ · cos φ₂ ,  cos φ₁ · sin φ₂ − sin φ₁ · cos φ₂ · cos Δλ ). Birinci hissə şərq-qərb, ikinci hissə şimal-cənub payıdır; atan2 onlardan bucağı tapır.', en: 'θ = atan2( sin Δλ · cos φ₂ ,  cos φ₁ · sin φ₂ − sin φ₁ · cos φ₂ · cos Δλ ). The first part is the east–west share, the second the north–south share; atan2 turns them into an angle.', ru: 'θ = atan2( sin Δλ · cos φ₂ ,  cos φ₁ · sin φ₂ − sin φ₁ · cos φ₂ · cos Δλ ). Первая часть — доля «восток–запад», вторая — «север–юг»; функция atan2 превращает их в угол.', ar: 'θ = atan2( sin Δλ · cos φ₂ ،  cos φ₁ · sin φ₂ − sin φ₁ · cos φ₂ · cos Δλ ). الجزء الأول نصيب الشرق والغرب، والثاني نصيب الشمال والجنوب، والدالة atan2 تحوّلهما إلى زاوية.', tr: 'θ = atan2( sin Δλ · cos φ₂ ,  cos φ₁ · sin φ₂ − sin φ₁ · cos φ₂ · cos Δλ ). Birinci kısım doğu–batı payı, ikinci kısım kuzey–güney payıdır; atan2 bunları açıya çevirir.' } },
        { title: { az: '0–360° aralığı', en: 'Range 0–360°', ru: 'Диапазон 0–360°', ar: 'من 0 إلى 360°', tr: '0–360° aralığı' },
          text: { az: 'Nəticə dərəcəyə çevrilir və 0–360° aralığına gətirilir: 0° — şimal, 90° — şərq, 180° — cənub, 270° — qərb.', en: 'The result is converted to degrees and brought into 0–360°: 0° is north, 90° east, 180° south, 270° west.', ru: 'Результат переводится в градусы и приводится к диапазону 0–360°: 0° — север, 90° — восток, 180° — юг, 270° — запад.', ar: 'تُحوَّل النتيجة إلى درجات وتُجعل بين 0 و360: الصفر شمال، و90 شرق، و180 جنوب، و270 غرب.', tr: 'Sonuç dereceye çevrilir ve 0–360° aralığına getirilir: 0° kuzey, 90° doğu, 180° güney, 270° batı.' } },
      ] },
      { t: 'p', text: {
        az: 'Niyə adi xəritədə çəkilmiş düz xətt yox? Düz (Merkator) xəritələr kürəni dartıb açır, istiqamətlər təhrif olunur. Məsələn, Şimali Amerikadan qiblə xəritədə göründüyü kimi cənub-şərqə deyil, şimal-şərqə düşür. Azərbaycan Məkkəyə yaxın olduğuna görə burada fərq kiçikdir, amma hesablama hər yerdə eyni düsturla aparılır.',
        en: 'Why not a straight line drawn on an ordinary map? Flat (Mercator) maps stretch the sphere and distort directions. For example, from North America the qibla is north-east, not south-east as a flat map suggests. Azerbaijan is relatively close to Makkah, so the difference here is small, but the calculation uses the same formula everywhere.',
        ru: 'Почему не прямая линия на обычной карте? Плоские карты (Меркатора) растягивают шар и искажают направления. Например, из Северной Америки кибла находится на северо-востоке, а не на юго-востоке, как кажется по плоской карте. Азербайджан относительно близок к Мекке, поэтому разница здесь невелика, но расчёт везде ведётся по одной формуле.',
        ar: 'لماذا لا يُرسم خط مستقيم على الخريطة العادية؟ لأن الخرائط المسطحة (مركاتور) تمدّ الكرة فتشوّه الاتجاهات؛ فمن أمريكا الشمالية مثلًا تكون القبلة إلى الشمال الشرقي لا الجنوب الشرقي كما توحي الخريطة. وأذربيجان قريبة نسبيًا من مكة فالفرق فيها يسير، لكن الحساب بالمعادلة نفسها في كل مكان.',
        tr: 'Neden sıradan bir haritada çizilen düz çizgi değil? Düz (Mercator) haritalar küreyi gerip açar ve yönleri bozar. Örneğin Kuzey Amerika’dan kıble, düz haritanın gösterdiği gibi güneydoğuda değil, kuzeydoğudadır. Azerbaycan Mekke’ye nispeten yakın olduğu için buradaki fark küçüktür, ama hesap her yerde aynı formülle yapılır.',
      } },
      { t: 'note', kind: 'info', text: {
        az: 'Məsafə də kürə üzərində hesablanır (kürə səthi üçün olan düsturla, Yerin radiusu 6371 km). Bu səhifədəki bucaq coğrafi şimala görədir.',
        en: 'The distance is also calculated on the sphere (the haversine formula, Earth radius 6371 km). The bearing on this page is relative to true (geographic) north.',
        ru: 'Расстояние тоже вычисляется на шаре (формула гаверсинусов, радиус Земли 6371 км). Угол на этой странице отсчитывается от географического севера.',
        ar: 'وتُحسب المسافة على الكرة أيضًا (معادلة هافرساين، ونصف قطر الأرض 6371 كم). والزاوية في هذه الصفحة منسوبة إلى الشمال الجغرافي.',
        tr: 'Mesafe de küre üzerinde hesaplanır (haversin formülü, Dünya yarıçapı 6371 km). Bu sayfadaki açı coğrafi kuzeye göredir.',
      } },
    ],
  },

  // ── 5. Kompas ──
  {
    id: 'compass', icon: 'target',
    title: { az: 'Telefon kompası: kalibrləmə və maneələr', en: 'Phone compass: calibration and interference', ru: 'Компас телефона: калибровка и помехи', ar: 'بوصلة الهاتف: المعايرة والتشويش', tr: 'Telefon pusulası: kalibrasyon ve parazit' },
    blocks: [
      { t: 'list', items: [
        { az: 'Telefonu üfüqi, düz tutun — ekran yuxarı baxsın. Maili tutulan cihazın göstəricisi səhv ola bilər.', en: 'Hold the phone flat and level, screen facing up. A tilted device can give a wrong reading.', ru: 'Держите телефон ровно, горизонтально, экраном вверх. Наклонённое устройство может показывать неверно.', ar: 'أمسك الهاتف مستويًا أفقيًا والشاشة إلى الأعلى؛ فالميل قد يعطي قراءة خاطئة.', tr: 'Telefonu yatay ve düz tutun, ekran yukarı baksın. Eğik tutulan cihaz yanlış gösterebilir.' },
        { az: 'Kalibrləyin: telefonu havada bir neçə dəfə «8» rəqəmi şəklində yavaş-yavaş hərəkət etdirin, həm də hər oxu ətrafında fırladın. Əqrəb atılıb-düşürsə və ya qeyri-sabitdirsə, bunu təkrarlayın.', en: 'Calibrate: slowly move the phone through the air in a figure-of-eight a few times, also turning it around each axis. Repeat if the needle jumps or will not settle.', ru: 'Откалибруйте: несколько раз медленно проведите телефоном в воздухе «восьмёрку», поворачивая его вокруг каждой оси. Повторите, если стрелка прыгает или не успокаивается.', ar: 'عايِر البوصلة: حرّك الهاتف ببطء في الهواء على شكل الرقم 8 عدة مرات مع تدويره حول كل محور، وأعد ذلك إن اضطرب المؤشر أو لم يستقر.', tr: 'Kalibre edin: telefonu havada birkaç kez yavaşça “8” şeklinde hareket ettirin, her eksen etrafında da çevirin. İbre zıplıyor veya oturmuyorsa tekrarlayın.' },
        { az: 'Maqnit maneələrindən uzaq durun: maqnitli qab və tutacaqlar, maşının içi, dəmir masa, dəmir-beton divar, kolonka, noutbuk, yüksək gərginlik xətləri kompası bir neçə on dərəcə yayındıra bilər.', en: 'Keep away from magnetic interference: magnetic cases and mounts, the inside of a car, steel tables, reinforced-concrete walls, speakers, laptops and power lines can throw a compass off by tens of degrees.', ru: 'Держитесь подальше от магнитных помех: магнитные чехлы и держатели, салон автомобиля, металлические столы, железобетонные стены, колонки, ноутбуки и линии электропередачи могут сбить компас на десятки градусов.', ar: 'ابتعد عن مصادر التشويش المغناطيسي: الأغطية والحوامل المغناطيسية، وداخل السيارة، والطاولات الحديدية، والجدران الخرسانية المسلحة، ومكبرات الصوت، والحواسيب المحمولة، وخطوط الكهرباء؛ فقد تحرف البوصلة عشرات الدرجات.', tr: 'Manyetik parazitten uzak durun: mıknatıslı kılıf ve tutucular, araç içi, çelik masalar, betonarme duvarlar, hoparlörler, dizüstü bilgisayarlar ve elektrik hatları pusulayı onlarca derece saptırabilir.' },
        { az: 'Yoxlayın: kompasın göstərdiyini məlum bir istiqamətlə — məscidin mehrabı, qibləsi bəlli otaq — müqayisə edin. Fərq böyükdürsə, etibarlı istiqaməti əsas götürün.', en: 'Check: compare the compass with a known direction — a mosque mihrab or a room whose qibla is known. If the difference is large, rely on the trusted direction.', ru: 'Проверьте: сравните показание компаса с известным направлением — михрабом мечети или комнатой, где кибла известна. Если разница велика, полагайтесь на надёжное направление.', ar: 'تحقّق: قارن البوصلة باتجاه معروف كمحراب مسجد أو غرفة معلومة القبلة، فإن كان الفرق كبيرًا فاعتمد الجهة الموثوقة.', tr: 'Kontrol edin: pusulayı bilinen bir yönle — caminin mihrabı veya kıblesi bilinen bir oda — karşılaştırın. Fark büyükse güvenilir yönü esas alın.' },
        { az: 'Məkan icazəsini verin: bucaq dəqiq yerinizə görə hesablanır. Bəzi telefonlarda brauzer kompası ayrıca icazə istəyir — yuxarıdakı «Kompası aktivləşdir» düyməsi bunun üçündür.', en: 'Allow location access: the bearing is calculated for your exact position. On some phones the browser compass needs a separate permission — that is what the “Enable compass” button above is for.', ru: 'Разрешите доступ к местоположению: угол рассчитывается для вашей точной позиции. На некоторых телефонах компас в браузере требует отдельного разрешения — для этого кнопка «Включить компас» выше.', ar: 'اسمح بالوصول إلى الموقع؛ فالزاوية تُحسب لموضعك الدقيق. وفي بعض الهواتف تحتاج بوصلة المتصفح إذنًا مستقلًا، ولذلك زر «تفعيل البوصلة» أعلاه.', tr: 'Konum izni verin: açı tam konumunuza göre hesaplanır. Bazı telefonlarda tarayıcı pusulası ayrı izin ister — yukarıdaki “Pusulayı etkinleştir” düğmesi bunun içindir.' },
      ] },
      { t: 'note', kind: 'tip', text: {
        az: 'Maqnit şimalı coğrafi şimaldan bir qədər fərqlənir (maqnit meyli). Azərbaycanda bu fərq bir neçə dərəcədir — yuxarıda deyildiyi kimi, belə kiçik fərq namaza təsir etmir.',
        en: 'Magnetic north differs somewhat from true north (magnetic declination). In Azerbaijan the difference is a few degrees — as explained above, such a small difference does not affect the prayer.',
        ru: 'Магнитный север немного отличается от географического (магнитное склонение). В Азербайджане разница составляет несколько градусов — как сказано выше, столь малое отличие не влияет на молитву.',
        ar: 'الشمال المغناطيسي يختلف قليلًا عن الشمال الجغرافي (الانحراف المغناطيسي)، وفي أذربيجان يبلغ الفرق بضع درجات، وهذا الفرق اليسير لا يؤثر في الصلاة كما سبق.',
        tr: 'Manyetik kuzey coğrafi kuzeyden biraz farklıdır (manyetik sapma). Azerbaycan’da bu fark birkaç derecedir — yukarıda belirtildiği gibi bu kadar küçük bir fark namazı etkilemez.',
      } },
      { t: 'p', text: {
        az: 'Kompassız üsul — günəş: ildə iki dəfə günəş düz Kəbənin üstündə olur: 27/28 may Məkkə vaxtı ilə 12:18-də (Bakı vaxtı 13:18) və 15/16 iyul 12:27-də (Bakı vaxtı 13:27). Həmin anda şaquli dirəyin kölgəsi qiblənin əks tərəfinə düşür — qiblə kölgənin əksinədir.',
        en: 'A method without a compass — the sun: twice a year the sun stands directly above the Kaaba: on 27/28 May at 12:18 Makkah time (09:18 UTC) and on 15/16 July at 12:27 (09:27 UTC). At that moment the shadow of a vertical pole points directly away from the qibla — the qibla is opposite the shadow.',
        ru: 'Способ без компаса — солнце: дважды в год солнце стоит прямо над Каабой: 27/28 мая в 12:18 по мекканскому времени (13:18 по бакинскому) и 15/16 июля в 12:27 (13:27 по бакинскому). В этот момент тень вертикального шеста указывает прямо от киблы — кибла противоположна тени.',
        ar: 'طريقة بلا بوصلة — الشمس: تتعامد الشمس على الكعبة مرتين في السنة: يوم 27/28 مايو الساعة 12:18 بتوقيت مكة، ويوم 15/16 يوليو الساعة 12:27. وفي تلك اللحظة يكون ظل العمود القائم في عكس جهة القبلة، فالقبلة في الجهة المقابلة للظل.',
        tr: 'Pusulasız yöntem — güneş: yılda iki kez güneş tam Kâbe’nin üzerinde olur: 27/28 Mayıs’ta Mekke saatiyle 12:18’de (Türkiye saatiyle de 12:18) ve 15/16 Temmuz’da 12:27’de. O anda dikey bir direğin gölgesi kıblenin tam tersini gösterir — kıble gölgenin karşı tarafıdır.',
      } },
    ],
  },

  // ── 6. Şəhərlər (cədvəl səhifədə hesablanır) ──
  {
    id: 'cities', icon: 'pin', cityTable: true,
    title: { az: 'Azərbaycan şəhərləri üçün qiblə bucağı', en: 'Qibla bearings for Azerbaijani cities', ru: 'Угол киблы для городов Азербайджана', ar: 'زاوية القبلة لمدن أذربيجان', tr: 'Azerbaycan şehirleri için kıble açısı' },
    blocks: [
      { t: 'p', text: {
        az: 'Aşağıdakı bucaqlar kompasla eyni düsturla, şəhər mərkəzinin koordinatlarına görə hesablanır (coğrafi şimaldan saat əqrəbi istiqamətində). Azərbaycanın hər yerindən qiblə təxminən cənub-cənub-qərbə düşür: kompasla cənubu tapıb cədvəldəki dərəcə qədər qərbə dönün.',
        en: 'The bearings below are calculated with the same formula as the compass, from the coordinates of each city centre (clockwise from true north). From anywhere in Azerbaijan the qibla lies roughly south-south-west: find due south with a compass and turn west by the number of degrees in the table.',
        ru: 'Углы ниже вычислены по той же формуле, что и компас, по координатам центра каждого города (по часовой стрелке от географического севера). Из любой точки Азербайджана кибла находится примерно на юго-юго-западе: найдите по компасу юг и повернитесь к западу на указанное в таблице число градусов.',
        ar: 'الزوايا التالية محسوبة بالمعادلة نفسها التي تستعملها البوصلة، وفق إحداثيات وسط كل مدينة (من الشمال الجغرافي باتجاه عقارب الساعة). والقبلة من أي مكان في أذربيجان تقع تقريبًا إلى الجنوب الجنوبي الغربي: حدّد الجنوب بالبوصلة ثم انحرف نحو الغرب بعدد الدرجات المذكور في الجدول.',
        tr: 'Aşağıdaki açılar pusulayla aynı formülle, her şehir merkezinin koordinatlarına göre hesaplanmıştır (coğrafi kuzeyden saat yönünde). Azerbaycan’ın her yerinden kıble yaklaşık güney-güneybatıdadır: pusulayla güneyi bulup tablodaki derece kadar batıya dönün.',
      } },
    ],
  },
]

export const QIBLA_SOURCES = [
  { label: 'IslamQA — 42574: A mistake in the direction of the qiblah', url: URL.qa42574 },
  { label: 'ابن باز — ما كيفية الصلاة في الطائرة؟', url: URL.baz4298 },
  { label: 'ابن باز — حكم صلاة الفريضة في الطائرة وهو جالس', url: URL.baz20706 },
  { label: 'Quran.com — 2:144', url: 'https://quran.com/2/144' },
]
