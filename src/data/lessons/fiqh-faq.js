// Fiqh sual-cavabları — hər cavab açılıb oxunmuş fətvanın qısa və sadiq xülasəsidir.
// Fətva nömrəsi `ref`-də, link `url`-dadır (islamqa.info/en/answers/<n>).

const iq = n => ({
  ref: {
    az: `IslamQA, sual № ${n}`,
    en: `IslamQA, question no. ${n}`,
    // lang-ok[IslamQA]: saytın xüsusi adı
    ru: `IslamQA, вопрос № ${n}`,
    ar: `الإسلام سؤال وجواب، رقم ${n}`,
    // lang-ok[IslamQA]: saytın xüsusi adı
    tr: `IslamQA, soru no. ${n}`,
  },
  url: `https://islamqa.info/en/answers/${n}`,
})

export const meta = {
  slug: 'fiqh-faq',
  cat: 'knowledge',
  order: 50,
  icon: 'list',
  arTitle: 'أسئلة وأجوبة فقهية',
  title: {
    az: 'Fiqh sual-cavabları: fətva nömrələri ilə',
    en: 'Fiqh Q&A with fatwa numbers',
    ru: 'Вопросы и ответы по фикху с номерами фетв',
    ar: 'أسئلة وأجوبة فقهية بأرقام الفتاوى',
    tr: 'Fetva numaralarıyla fıkıh soru-cevapları',
  },
  summary: {
    az: 'Təharət, namaz, oruc, zəkat, ailə, pul, yemək və gündəlik həyat barədə ən çox verilən suallar — hər cavab fətva nömrəsi və linki ilə.',
    en: 'The most common questions on purification, prayer, fasting, zakat, family, money, food and daily life — each answer with its fatwa number and link.',
    ru: 'Самые частые вопросы об очищении, намазе, посте, закяте, семье, деньгах, еде и быту — каждый ответ с номером фетвы и ссылкой.',
    ar: 'أكثر الأسئلة شيوعًا في الطهارة والصلاة والصيام والزكاة والأسرة والمال والطعام والحياة اليومية، مع رقم الفتوى ورابطها لكل جواب.',
    tr: 'Taharet, namaz, oruç, zekât, aile, para, yiyecek ve günlük hayat hakkında en sık sorulan sorular — her cevap fetva numarası ve bağlantısıyla.',
  },
  author: {
    az: 'İslam sual-cavab (islamqa.info) fətvaları əsasında; İbn Baz, İbn Useymin və Daimi Komitənin sözləri ilə',
    en: 'Based on the fatwas of Islam Q&A (islamqa.info), quoting Ibn Baz, Ibn Uthaymin and the Permanent Committee',
    ru: 'По фетвам сайта «Ислам: вопросы и ответы» с цитатами ибн База, ибн Усеймина и Постоянного комитета',
    ar: 'مبني على فتاوى موقع الإسلام سؤال وجواب، مع نقول عن ابن باز وابن عثيمين واللجنة الدائمة',
    tr: 'İslam Soru-Cevap sitesinin fetvalarına dayanır; İbn Baz, İbn Useymin ve Daimi Komite’nin sözleriyle',
  },
  minutes: 30,
}

export default {
  sections: [
    // ───────────────────────── GİRİŞ ─────────────────────────
    {
      id: 'intro',
      title: { az: 'Bu bölmədən necə istifadə etməli', en: 'How to use this page', ru: 'Как пользоваться этим разделом', ar: 'كيف تستفيد من هذه الصفحة', tr: 'Bu bölüm nasıl kullanılır' },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Burada müsəlmanın gündəlik həyatında tez-tez qarşılaşdığı fiqh sualları toplanıb. Hər cavab müəyyən bir fətvanın qısa xülasəsidir: fətvanın nömrəsi və linki cavabın altında verilib ki, tam mətni, dəlilləri və alimlərin sözlərini özünüz oxuya biləsiniz.',
            en: 'This page gathers fiqh questions that Muslims commonly face in daily life. Each answer is a short summary of a specific fatwa; its number and link are given under the answer so that you can read the full text, the evidence and the scholars’ words yourself.',
            ru: 'Здесь собраны вопросы фикха, с которыми мусульманин часто сталкивается в повседневной жизни. Каждый ответ — краткое изложение конкретной фетвы; её номер и ссылка указаны под ответом, чтобы вы могли сами прочитать полный текст, доводы и слова учёных.',
            ar: 'جُمعت هنا مسائل فقهية يكثر أن يحتاج إليها المسلم في حياته اليومية. وكل جواب خلاصة موجزة لفتوى بعينها، وتحت الجواب رقمها ورابطها لتقرأ نصها كاملًا بأدلته وأقوال العلماء.',
            tr: 'Burada Müslümanın günlük hayatında sıkça karşılaştığı fıkıh soruları toplanmıştır. Her cevap belirli bir fetvanın kısa özetidir; fetvanın numarası ve bağlantısı cevabın altında verilmiştir ki tam metni, delilleri ve âlimlerin sözlerini kendiniz okuyabilesiniz.',
          },
        },
        {
          t: 'ayah',
          ar: 'فَسْـَٔلُوٓا۟ أَهْلَ ٱلذِّكْرِ إِن كُنتُمْ لَا تَعْلَمُونَ',
          text: {
            az: '…Əgər bilmirsinizsə, zikr (elm) əhlindən soruşun.',
            en: '…So ask the people of the reminder (knowledge) if you do not know.',
            ru: '…Спросите же обладателей напоминания (знания), если вы не знаете.',
            ar: 'فاسألوا أهل العلم إن كنتم لا تعلمون.',
            tr: '…Eğer bilmiyorsanız zikir (ilim) ehline sorun.',
          },
          ref: '16:43',
        },
        {
          t: 'hadith',
          ar: 'مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ',
          text: {
            az: 'Allah kimə xeyir istəsə, onu dində anlayışlı (fəqih) edər.',
            en: 'Whomever Allah wants good for, He gives him understanding of the religion.',
            ru: 'Кому Аллах желает блага, тому Он даёт понимание религии.',
            ar: 'من يرد الله به خيرًا يفقهه في الدين.',
            tr: 'Allah kime hayır dilerse onu dinde anlayışlı (fakih) kılar.',
          },
          src: { az: 'Buxari 71', en: 'al-Bukhari 71', ru: 'аль-Бухари 71', ar: 'البخاري 71', tr: 'Buhârî 71' },
        },
        {
          t: 'list',
          items: [
            {
              az: 'Fətva verilmiş suala aiddir: sizin vəziyyətinizdə fərqli bir təfsilat varsa, hökm də dəyişə bilər.',
              en: 'A fatwa answers the question as asked: if your situation has a different detail, the ruling may differ.',
              ru: 'Фетва отвечает на заданный вопрос: если в вашей ситуации есть иная деталь, положение может отличаться.',
              ar: 'الفتوى جواب عن السؤال كما ورد، فإن اختلفت حالتك في تفصيل ما فقد يختلف الحكم.',
              tr: 'Fetva sorulan soruya cevaptır: sizin durumunuzda farklı bir ayrıntı varsa hüküm de değişebilir.',
            },
            {
              az: 'Rəylər arasında nəfsə xoş gələni deyil, dəlili güclü olanı seçin; «ən asan rəyi» axtarmaq düzgün yol deyil.',
              en: 'Among the views, choose the one with stronger evidence, not the one your desires prefer; hunting for the easiest opinion is not the right path.',
              ru: 'Из мнений выбирайте то, у которого доводы сильнее, а не то, что нравится душе; искать «самое лёгкое мнение» — неверный путь.',
              ar: 'اختر من الأقوال ما قوي دليله لا ما وافق الهوى، وتتبع الرخص ليس سبيلًا صحيحًا.',
              tr: 'Görüşler arasından nefse hoş geleni değil, delili güçlü olanı seçin; “en kolay görüşü” aramak doğru yol değildir.',
            },
            {
              az: 'Talaq, miras, nikahın düzgünlüyü kimi ciddi məsələlərdə yalnız oxumaqla kifayətlənməyin — etibarlı alimə şəxsən müraciət edin.',
              en: 'In serious matters such as divorce, inheritance or the validity of a marriage, do not rely on reading alone — consult a trustworthy scholar personally.',
              ru: 'В серьёзных вопросах — развод, наследство, действительность брака — не ограничивайтесь чтением, а лично обратитесь к надёжному учёному.',
              ar: 'في المسائل الكبيرة كالطلاق والميراث وصحة النكاح لا تكتفِ بالقراءة، بل اسأل عالمًا موثوقًا مباشرة.',
              tr: 'Talak, miras, nikâhın geçerliliği gibi ciddi meselelerde sadece okumakla yetinmeyin — güvenilir bir âlime bizzat danışın.',
            },
          ],
        },
        {
          t: 'note',
          kind: 'info',
          text: {
            az: 'Mübahisəli məsələlərdə dəlilə görə daha güclü sayılan rəy verilir, digər rəy isə qısa qeyd olunur. Vəziyyətiniz xüsusidirsə (talaq, miras, xəstəlik və s.), fətvanı tam oxuyun və etibarlı alimə şəxsən müraciət edin.',
            en: 'On disputed issues the view considered stronger by evidence is given, and the other view is mentioned briefly. If your situation is specific (divorce, inheritance, illness, etc.), read the full fatwa and consult a trustworthy scholar personally.',
            ru: 'В спорных вопросах приводится мнение, более сильное по доводам, а другое мнение упоминается кратко. Если ваш случай особый (развод, наследство, болезнь и т. п.), прочитайте фетву полностью и лично обратитесь к надёжному учёному.',
            ar: 'في المسائل الخلافية يُذكر القول الأرجح دليلًا ويُشار إلى القول الآخر باختصار. فإن كانت حالتك خاصة (طلاق أو ميراث أو مرض ونحوها) فاقرأ الفتوى كاملة واسأل عالمًا موثوقًا مباشرة.',
            tr: 'İhtilaflı meselelerde delil bakımından daha güçlü görülen görüş verilir, diğer görüş kısaca anılır. Durumunuz özelse (boşanma, miras, hastalık vb.), fetvayı tam okuyun ve güvenilir bir âlime bizzat danışın.',
          },
        },
      ],
    },

    // ───────────────────────── TƏHARƏT ─────────────────────────
    {
      id: 'tahara',
      title: { az: 'Təharət və dəstəmaz', en: 'Purification and wudu', ru: 'Очищение и омовение', ar: 'الطهارة والوضوء', tr: 'Taharet ve abdest' },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Qüsl və təyəmmümün qaydaları ayrıca «Qüsl» və «Təyəmmüm» dərslərindədir; burada dəstəmazla bağlı ən çox verilən suallar var.',
            en: 'The rules of ghusl and tayammum are in the separate “Ghusl” and “Tayammum” lessons; here are the most frequent questions about wudu.',
            ru: 'Правила гусля и таяммума изложены в отдельных уроках «Гусль» и «Таяммум»; здесь — самые частые вопросы об омовении.',
            ar: 'أحكام الغسل والتيمم في درسي «الغسل» و«التيمم»، وهنا أكثر الأسئلة شيوعًا عن الوضوء.',
            tr: 'Gusül ve teyemmümün hükümleri ayrı “Gusül” ve “Teyemmüm” derslerindedir; burada abdestle ilgili en sık sorulan sorular var.',
          },
        },
        {
          t: 'qa',
          items: [
            {
              q: { az: 'Dəstəmazda ayaqları yumaq əvəzinə corabın üstünə məsh etmək olarmı?', en: 'Can I wipe over my socks in wudu instead of washing my feet?', ru: 'Можно ли при омовении протирать носки вместо мытья ног?', ar: 'هل يجوز المسح على الجوربين في الوضوء بدل غسل القدمين؟', tr: 'Abdestte ayakları yıkamak yerine çorabın üzerine mesh edilebilir mi?' },
              a: {
                az: 'Bəli, dörd şərtlə: 1) corablar tam dəstəmazlı halda geyinilib; 2) corablar pakdır; 3) məsh yalnız kiçik hədəsdən sonra (dəstəmazda) edilir, cənabətdən sonrakı qüsldə yox; 4) müddət: yerində olan üçün bir gün-bir gecə, müsafir üçün üç gün-üç gecə.',
                en: 'Yes, with four conditions: 1) the socks were put on while in a state of wudu; 2) they are pure; 3) wiping is only for minor impurity (in wudu), not for ghusl after janabah; 4) the time limit: one day and night for a resident, three days and nights for a traveller.',
                ru: 'Да, при четырёх условиях: 1) носки надеты в состоянии омовения; 2) они чисты; 3) протирание — только при малом осквернении (в омовении), а не при гусле после джанабы; 4) срок: сутки для местного жителя и трое суток для путника.',
                ar: 'نعم بأربعة شروط: أن يلبسهما على طهارة، وأن يكونا طاهرين، وأن يكون المسح في الحدث الأصغر لا في الجنابة، وأن يكون في المدة المحددة: يوم وليلة للمقيم، وثلاثة أيام بلياليها للمسافر.',
                tr: 'Evet, dört şartla: 1) çoraplar abdestli iken giyilmiş olmalı; 2) temiz olmalı; 3) mesh yalnız küçük hadeste (abdestte) yapılır, cünüplükten sonraki gusülde yapılmaz; 4) süre: mukim için bir gün bir gece, yolcu için üç gün üç gece.',
              },
              ...iq(9640),
            },
            {
              q: { az: 'Dırnaqda lak varsa, dəstəmaz düzgündürmü?', en: 'Is wudu valid with nail polish on?', ru: 'Действительно ли омовение с лаком на ногтях?', ar: 'هل يصح الوضوء مع وجود طلاء الأظافر؟', tr: 'Tırnakta oje varken abdest geçerli olur mu?' },
              a: {
                az: 'Xeyr. Təharətin şərtlərindən biri suyun dəriyə çatmasıdır. Lak, boya, mum, yapışqan kimi suyun keçməsinə mane olan qat varsa, dəstəmaz düzgün olmur və onunla qılınan namaz da düzgün olmur. Ona görə dəstəmazdan əvvəl lak təmizlənməlidir. Qat yaratmayan, yalnız rəng qoyan həna isə mane deyil.',
                en: 'No. One condition of purification is that water reaches the skin. If there is a layer such as polish, paint, wax or glue that stops water reaching it, the wudu is not valid and neither is a prayer offered with it. So the polish must be removed before wudu. Henna that leaves only colour and no layer is not a barrier.',
                ru: 'Нет. Одно из условий очищения — чтобы вода достигла кожи. Если есть слой, не пропускающий воду (лак, краска, воск, клей), омовение недействительно, как и намаз, совершённый с ним. Поэтому лак нужно снять до омовения. Хна, оставляющая лишь цвет без слоя, препятствием не является.',
                ar: 'لا يصح؛ لأن من شروط صحة الطهارة وصول الماء إلى البشرة، فإذا وُجد حائل كالطلاء والدهان والشمع والغراء يمنع وصول الماء لم تصح الطهارة ولا الصلاة بها، فيجب إزالته قبل الوضوء. أما الحناء الذي يبقى لونه بلا جِرم فلا يمنع.',
                tr: 'Hayır. Taharetin şartlarından biri suyun deriye ulaşmasıdır. Oje, boya, mum, yapıştırıcı gibi suyun geçmesine engel olan bir tabaka varsa abdest geçerli olmaz, onunla kılınan namaz da geçerli olmaz. Bu yüzden abdestten önce oje çıkarılmalıdır. Tabaka bırakmayan, sadece renk veren kına ise engel değildir.',
              },
              ...iq(103738),
            },
            {
              q: { az: 'Dəvə əti yemək dəstəmazı pozurmu?', en: 'Does eating camel meat break wudu?', ru: 'Нарушает ли омовение употребление верблюжьего мяса?', ar: 'هل أكل لحم الإبل ينقض الوضوء؟', tr: 'Deve eti yemek abdesti bozar mı?' },
              a: {
                az: 'Düzgün rəyə görə bəli: dəvə ətini — bişmiş və ya çiy — yeyən dəstəmaz almalıdır. Peyğəmbərdən ﷺ «Dəvə ətindən sonra dəstəmaz alımmı?» deyə soruşanda «Bəli», qoyun ətindən soruşanda isə «İstəsən» demişdir (Müslim 360). Bunun nəsx olunduğunu deyən alimlərin dəlili bu xüsusi hədisi aradan qaldırmır.',
                en: 'According to the correct view, yes: whoever eats camel meat, cooked or raw, must do wudu. The Prophet ﷺ was asked, “Should I do wudu after camel meat?” and said “Yes”; about mutton he said “If you wish” (Muslim 360). The claim of abrogation made by some scholars does not cancel this specific hadith.',
                ru: 'Согласно правильному мнению — да: кто съел верблюжье мясо, варёное или сырое, должен совершить омовение. Пророка ﷺ спросили: «Совершать ли омовение после верблюжьего мяса?» — он ответил: «Да», а о баранине сказал: «Если хочешь» (Муслим 360). Довод об отмене этого положения, приводимый некоторыми учёными, не отменяет этот конкретный хадис.',
                ar: 'الصحيح أن من أكل لحم الإبل، مطبوخًا أو نيئًا، وجب عليه الوضوء؛ لأن النبي ﷺ سئل: أأتوضأ من لحوم الإبل؟ قال: «نعم»، وسئل عن لحوم الغنم فقال: «إن شئت» (مسلم 360). ودعوى النسخ لا تُبطل هذا النص الخاص.',
                tr: 'Doğru görüşe göre evet: deve etini — pişmiş ya da çiğ — yiyen kişi abdest almalıdır. Peygamber ﷺ’e “Deve etinden sonra abdest alayım mı?” diye sorulunca “Evet”, koyun eti sorulunca “İstersen” demiştir (Müslim 360). Bazı âlimlerin nesih iddiası bu özel hadisi ortadan kaldırmaz.',
              },
              ...iq(7103),
            },
            {
              q: { az: 'Yuxu dəstəmazı pozurmu?', en: 'Does sleep break wudu?', ru: 'Нарушает ли сон омовение?', ar: 'هل النوم ينقض الوضوء؟', tr: 'Uyku abdesti bozar mı?' },
              a: {
                az: 'Dərin yuxu — insanın dəstəmazı pozulsa belə hiss etmədiyi yuxu — dəstəmazı pozur. Yüngül mürgü, hansı vəziyyətdə olursa olsun (uzanmış, oturmuş, söykənmiş), pozmur. Bu, İbn Teymiyyənin, İbn Bazın, İbn Useyminin və Daimi Komitənin seçdiyi rəydir və bütün dəlilləri uzlaşdırır.',
                en: 'Deep sleep — in which a person would not notice if his wudu were broken — breaks wudu. Light dozing does not, whatever the position (lying, sitting or leaning). This is the view of Ibn Taymiyyah, Ibn Baz, Ibn Uthaymin and the Permanent Committee, and it reconciles all the evidence.',
                ru: 'Глубокий сон, при котором человек не почувствовал бы нарушения омовения, нарушает его. Лёгкая дремота не нарушает, в каком бы положении ни был человек (лёжа, сидя, опираясь). Таково мнение ибн Таймии, ибн База, ибн Усеймина и Постоянного комитета; оно согласует все доводы.',
                ar: 'النوم المستغرق الذي لا يشعر معه النائم لو أحدث ينقض الوضوء، أما النوم اليسير الذي يشعر معه بالحدث فلا ينقض، على أي هيئة كان. وهذا اختيار شيخ الإسلام ابن تيمية وابن باز وابن عثيمين واللجنة الدائمة، وبه تجتمع الأدلة.',
                tr: 'Derin uyku — kişinin abdesti bozulsa bile fark etmeyeceği uyku — abdesti bozar. Hafif uyuklama ise hangi durumda olursa olsun (yatarak, oturarak, dayanarak) bozmaz. Bu, İbn Teymiyye, İbn Baz, İbn Useymin ve Daimi Komite’nin tercih ettiği görüştür ve bütün delilleri uzlaştırır.',
              },
              ...iq(36889),
            },
            {
              q: { az: 'Qadına toxunmaq dəstəmazı pozurmu?', en: 'Does touching a woman break wudu?', ru: 'Нарушает ли омовение прикосновение к женщине?', ar: 'هل مس المرأة ينقض الوضوء؟', tr: 'Kadına dokunmak abdesti bozar mı?' },
              a: {
                az: 'Ən doğru rəyə görə qadına toxunmaq, şəhvətlə olsun ya olmasın, dəstəmazı pozmur. Bu, İbn Teymiyyənin, İbn Bazın, İbn Useyminin və Daimi Komitənin rəyidir; ayədəki «qadınlara toxundunuz» ifadəsi cinsi əlaqə mənasındadır. İmam Şafii hər toxunmanın dəstəmazı pozduğu qənaətində olub. (Naməhrəm qadına toxunmağın özünün haram olması ayrıca məsələdir.)',
                en: 'The most correct view is that touching a woman does not break wudu, with or without desire. This is the view of Ibn Taymiyyah, Ibn Baz, Ibn Uthaymin and the Permanent Committee; “touching women” in the verse means intercourse. Imam al-Shafi’i held that any touching breaks wudu. (That touching a non-mahram woman is itself forbidden is a separate issue.)',
                ru: 'По наиболее верному мнению, прикосновение к женщине не нарушает омовения — ни с вожделением, ни без него. Таково мнение ибн Таймии, ибн База, ибн Усеймина и Постоянного комитета; «прикосновение к женщинам» в аяте означает близость. Имам аш-Шафии считал, что любое прикосновение нарушает омовение. (То, что касаться чужой женщины само по себе запрещено, — отдельный вопрос.)',
                ar: 'الأصح أن مس المرأة لا ينقض الوضوء مطلقًا، بشهوة أو بغير شهوة، وهو اختيار ابن تيمية وابن باز وابن عثيمين واللجنة الدائمة، والملامسة في الآية هي الجماع. وذهب الشافعي إلى أن المس ينقض مطلقًا. (أما تحريم مس الأجنبية في نفسه فمسألة أخرى.)',
                tr: 'En doğru görüşe göre kadına dokunmak, şehvetle olsun olmasın, abdesti bozmaz. Bu, İbn Teymiyye, İbn Baz, İbn Useymin ve Daimi Komite’nin görüşüdür; ayetteki “kadınlara dokundunuz” ifadesi cinsel ilişki anlamındadır. İmam Şâfiî her dokunmanın abdesti bozduğu görüşündedir. (Yabancı kadına dokunmanın kendisinin haram olması ayrı bir meseledir.)',
              },
              ...iq(76115),
            },
            {
              q: { az: 'Dəstəmazımın pozulub-pozulmadığına şübhə edirəm. Nə etməliyəm?', en: 'I am unsure whether my wudu was broken. What should I do?', ru: 'Я сомневаюсь, нарушилось ли моё омовение. Что делать?', ar: 'أشك هل انتقض وضوئي أم لا، فماذا أفعل؟', tr: 'Abdestimin bozulup bozulmadığından şüpheleniyorum. Ne yapmalıyım?' },
              a: {
                az: 'Dəstəmazınız yəqindirsə, sadəcə şübhə ilə pozulmur — and içə biləcək qədər əmin olmayınca yeni dəstəmaz lazım deyil. Peyğəmbər ﷺ namazda nəsə hiss edən adama «Səs eşitməyincə və ya qoxu hiss etməyincə namazdan çıxma» demişdir (Buxari, Müslim). İbn Useymin bunu «yəqin şübhə ilə aradan qalxmaz» qaydası adlandırır; vəsvəsəyə fikir verilməməlidir.',
                en: 'If you were certain of your wudu, mere doubt does not break it — you need no new wudu until you are so sure that you could swear to it. The Prophet ﷺ told a man who felt something in prayer: “Do not leave until you hear a sound or notice a smell” (al-Bukhari, Muslim). Ibn Uthaymin calls this the principle that certainty is not removed by doubt; whispers (waswas) should be ignored.',
                ru: 'Если вы были уверены в омовении, одно сомнение его не нарушает — новое омовение не нужно, пока вы не будете уверены настолько, что могли бы поклясться. Пророк ﷺ сказал человеку, почувствовавшему что-то в намазе: «Не уходи, пока не услышишь звук или не почувствуешь запах» (аль-Бухари, Муслим). Ибн Усеймин называет это правилом «уверенность не устраняется сомнением»; наущениям (васвасе) не следует придавать значения.',
                ar: 'من تيقن الطهارة لم ينتقض وضوؤه بمجرد الشك، ولا يلزمه الوضوء حتى يتيقن الحدث يقينًا يحلف عليه؛ لقول النبي ﷺ للرجل يجد الشيء في الصلاة: «لا ينصرف حتى يسمع صوتًا أو يجد ريحًا» (البخاري ومسلم). قال ابن عثيمين: هذا أصل عظيم: اليقين لا يزول بالشك. والوسوسة لا يُلتفت إليها.',
                tr: 'Abdestinizden emin idiyseniz sırf şüpheyle bozulmaz — yemin edebilecek kadar emin olmadıkça yeni abdest gerekmez. Peygamber ﷺ namazda bir şey hisseden adama “Bir ses duymadıkça veya bir koku almadıkça namazdan çıkma” demiştir (Buhârî, Müslim). İbn Useymin bunu “kesinlik şüpheyle kalkmaz” kaidesi olarak açıklar; vesveseye aldırış edilmemelidir.',
              },
              ...iq(148426),
            },
            {
              q: { az: 'Bədəndən qan axması dəstəmazı pozurmu?', en: 'Does bleeding break wudu?', ru: 'Нарушает ли омовение кровотечение?', ar: 'هل خروج الدم من البدن ينقض الوضوء؟', tr: 'Vücuttan kan akması abdesti bozar mı?' },
              a: {
                az: 'Sidik və nəcis dəstəmazı pozur (hətta əməliyyatdan sonra başqa yerdən çıxsa belə). Yaradan axan qan və qusma kimi şeylərə gəlincə, alimlər ixtilaf ediblər: Əbu Hənifə və Əhməd pozduğunu deyib. Fətvada seçilən rəy budur ki, bədəndən qan axması dəstəmazı pozmur; bu barədəki hədis zəifdir.',
                en: 'Urine and stool break wudu (even if, after surgery, they exit from another opening). As for blood from a wound, or vomit, the scholars differed: Abu Hanifah and Ahmad held that they break it. The view chosen in the fatwa is that bleeding from the body does not break wudu; the hadith used for the other view is weak.',
                ru: 'Моча и кал нарушают омовение (даже если после операции выходят через другое отверстие). О крови из раны и рвоте учёные разошлись: Абу Ханифа и Ахмад считали, что они нарушают его. Мнение, выбранное в фетве: кровотечение не нарушает омовения; хадис, приводимый в пользу другого мнения, слаб.',
                ar: 'البول والغائط ينقضان الوضوء ولو خرجا من غير المخرج المعتاد. أما الدم والقيء ونحوهما فاختلف فيه العلماء؛ فذهب أبو حنيفة وأحمد إلى النقض، والذي رجحته الفتوى أن خروج الدم من البدن لا ينقض الوضوء، وحديث النقض ضعيف.',
                tr: 'İdrar ve dışkı abdesti bozar (ameliyat sonrası başka bir yerden çıksa bile). Yaradan akan kan ve kusma gibi şeylerde ise âlimler ihtilaf etmiştir: Ebû Hanîfe ve Ahmed bozduğunu söylemiştir. Fetvada tercih edilen görüş, vücuttan kan akmasının abdesti bozmadığıdır; aksi görüşe delil getirilen hadis zayıftır.',
              },
              ...iq(45666),
            },
          ],
        },
      ],
    },

    // ───────────────────────── NAMAZ ─────────────────────────
    {
      id: 'salah',
      title: { az: 'Namaz', en: 'Prayer', ru: 'Намаз', ar: 'الصلاة', tr: 'Namaz' },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Səfər namazı, xəstənin namazı və bayram namazı ayrıca dərslərdə izah olunur. Burada isə qəza, səhv səcdəsi, cəmaat və iş kimi gündəlik suallar var.',
            en: 'The travel prayer, the prayer of the sick and the Eid prayer are explained in separate lessons. Here are everyday questions about missed prayers, the prostration of forgetfulness, congregation and work.',
            ru: 'Намаз путника, намаз больного и праздничный намаз разобраны в отдельных уроках. Здесь — повседневные вопросы о пропущенных намазах, земном поклоне забывчивости, коллективной молитве и работе.',
            ar: 'صلاة المسافر وصلاة المريض وصلاة العيد مشروحة في دروس مستقلة، وهنا أسئلة يومية عن القضاء وسجود السهو والجماعة والعمل.',
            tr: 'Yolculuk namazı, hastanın namazı ve bayram namazı ayrı derslerde açıklanmıştır. Burada kaza, sehiv secdesi, cemaat ve iş ile ilgili günlük sorular var.',
          },
        },
        {
          t: 'qa',
          items: [
            {
              q: { az: 'İki namazı qaçırmışam. Onları hansı ardıcıllıqla qəza etməliyəm?', en: 'I missed two prayers. In what order should I make them up?', ru: 'Я пропустил два намаза. В каком порядке их восполнять?', ar: 'فاتتني صلاتان، فبأي ترتيب أقضيهما؟', tr: 'İki namazı kaçırdım. Hangi sırayla kaza etmeliyim?' },
              a: {
                az: 'Alimlərin əksəriyyətinə görə qəza namazlarını ardıcıllıqla qılmaq vacibdir: məsələn, zöhr və əsri qaçıran əvvəl zöhrü, sonra əsri qılır. Amma unudaraq və ya bu hökmü bilmədən əvvəl əsri qılan şəxsin namazı düzgündür. İmam Şafii ardıcıllığı vacib saymayıb.',
                en: 'According to most scholars, missed prayers must be made up in order: whoever missed Dhuhr and Asr prays Dhuhr first, then Asr. But if someone prays Asr first by mistake or without knowing this ruling, his prayer is valid. Imam al-Shafi’i did not consider the order obligatory.',
                ru: 'По мнению большинства учёных, пропущенные намазы нужно восполнять по порядку: кто пропустил зухр и аср, сначала совершает зухр, затем аср. Но если кто-то по ошибке или не зная этого положения совершил сначала аср, его намаз действителен. Имам аш-Шафии не считал порядок обязательным.',
                ar: 'يجب عند جمهور العلماء قضاء الفوائت مرتبة؛ فمن فاتته الظهر والعصر صلى الظهر ثم العصر. لكن من بدأ بالعصر ناسيًا أو جاهلًا بوجوب الترتيب فصلاته صحيحة. ولم يوجب الشافعي الترتيب.',
                tr: 'Âlimlerin çoğunluğuna göre kaza namazlarını sırayla kılmak vaciptir: öğle ve ikindiyi kaçıran önce öğleyi, sonra ikindiyi kılar. Ancak unutarak veya bu hükmü bilmeden önce ikindiyi kılanın namazı geçerlidir. İmam Şâfiî sırayı vacip görmemiştir.',
              },
              ...iq(49019),
            },
            {
              q: { az: 'Birinci təşəhhüdü unudub üçüncü rəkətə qalxdım. Nə etməliyəm?', en: 'I forgot the first tashahhud and stood up for the third rak‘ah. What should I do?', ru: 'Я забыл первый ташаххуд и встал на третий ракат. Что делать?', ar: 'نسيت التشهد الأول وقمت إلى الركعة الثالثة، فماذا أفعل؟', tr: 'İlk teşehhüdü unutup üçüncü rekâta kalktım. Ne yapmalıyım?' },
              a: {
                az: 'Üç hal var: 1) tam dikəlməmiş xatırladınsa — otur, təşəhhüdü oxu; 2) dikəldikdən sonra, Fatihəyə başlamamış xatırladınsa — oturmamaq daha yaxşıdır, otursan da namaz düzgündür; 3) Fatihəyə başladıqdan sonra xatırladınsa — geri qayıtma. Hər halda salamdan əvvəl iki səhv səcdəsi edirsən (Əbu Davud 1036, əl-Albani səhih sayıb).',
                en: 'There are three cases: 1) you remember before standing fully upright — sit back and recite the tashahhud; 2) after standing upright but before starting al-Fatihah — it is better not to sit, but if you do, the prayer is valid; 3) after starting al-Fatihah — do not go back. In any case, make two prostrations of forgetfulness before the salam (Abu Dawud 1036, graded sahih by al-Albani).',
                ru: 'Есть три случая: 1) вспомнил, не выпрямившись полностью, — сядь и прочитай ташаххуд; 2) выпрямился, но ещё не начал «аль-Фатиху» — лучше не садиться, но если сел, намаз действителен; 3) уже начал «аль-Фатиху» — не возвращайся. В любом случае перед таслимом сделай два земных поклона забывчивости (Абу Дауд 1036, аль-Албани назвал достоверным).',
                ar: 'له ثلاث حالات: أن يذكر قبل أن يستتم قائمًا فيرجع ويتشهد، أو بعد أن يستتم قائمًا وقبل الشروع في الفاتحة فالأولى ألا يرجع وإن رجع صحت صلاته، أو بعد الشروع في القراءة فلا يرجع. ويسجد للسهو سجدتين قبل السلام (أبو داود 1036، وصححه الألباني).',
                tr: 'Üç durum vardır: 1) tam doğrulmadan hatırladıysan — otur, teşehhüdü oku; 2) doğrulduktan sonra, Fâtiha’ya başlamadan hatırladıysan — oturmaman daha iyidir, oturursan da namaz geçerlidir; 3) Fâtiha’ya başladıktan sonra hatırladıysan — geri dönme. Her durumda selamdan önce iki sehiv secdesi yaparsın (Ebû Dâvûd 1036, Elbânî sahih saymıştır).',
              },
              ...iq(50),
            },
            {
              q: { az: 'Cəmaat namazına gecikdim. Nəyi tapmış sayılıram və qalanını necə tamamlayım?', en: 'I came late to the congregational prayer. What counts as caught, and how do I complete the rest?', ru: 'Я опоздал на коллективный намаз. Что засчитывается и как восполнить остальное?', ar: 'تأخرت عن صلاة الجماعة، فبم أكون مدركًا وكيف أتم ما فاتني؟', tr: 'Cemaat namazına geç kaldım. Neyi yakalamış sayılırım, kalanını nasıl tamamlarım?' },
              a: {
                az: 'Məscidə sakit və vüqarla gəl. İmamla tapdığın sənin namazının əvvəlidir, sonra qılacağın isə onun sonudur (Buxari 600: «Tapdığınızı qılın, qaçırdığınızı tamamlayın»). Ən azı bir rəkət tapmayan cəmaatı tapmış sayılmır; imamı rükuda tapan isə rəkəti tapmış olur, amma açılış təkbirini ayaq üstə deməlidir. İmam salam verəndən sonra qalxıb qalanını tamamla.',
                en: 'Come to the mosque calmly and with dignity. What you catch with the imam is the beginning of your prayer and what you make up is its end (al-Bukhari 600: “Pray what you catch and complete what you missed”). You have not caught the congregation unless you catch at least one rak‘ah; catching the imam in ruku‘ counts as catching the rak‘ah, but the opening takbir must be said standing. After the imam’s salam, stand and complete the rest.',
                ru: 'Иди в мечеть спокойно и степенно. То, что ты застал с имамом, — начало твоего намаза, а то, что восполняешь, — его конец (аль-Бухари 600: «Что застали — молитесь, что пропустили — восполните»). Не застав хотя бы одного раката, ты не считаешься заставшим коллективный намаз; застав имама в поясном поклоне, ты застал ракат, но начальный такбир нужно произнести стоя. После таслима имама встань и восполни остальное.',
                ar: 'يأتي المسبوق بسكينة ووقار، وما أدركه مع الإمام هو أول صلاته وما يقضيه آخرها؛ لحديث: «فما أدركتم فصلوا وما فاتكم فأتموا» (البخاري 600). ولا يدرك الجماعة إلا بإدراك ركعة، ومن أدرك الإمام راكعًا أدرك الركعة، ويجب أن يكبر تكبيرة الإحرام قائمًا. ثم يقوم بعد سلام الإمام فيتم ما فاته.',
                tr: 'Mescide sükûnet ve vakarla gel. İmamla yakaladığın kısım namazının başı, sonra kılacağın ise sonudur (Buhârî 600: “Yetiştiğinizi kılın, kaçırdığınızı tamamlayın”). En az bir rekât yakalamayan cemaate yetişmiş sayılmaz; imamı rükûda yakalayan rekâtı yakalamış olur, fakat iftitah tekbirini ayakta söylemelidir. İmam selam verdikten sonra kalkıp kalanını tamamla.',
              },
              ...iq(246225),
            },
            {
              q: { az: 'İşimə görə namazı vaxtından sonraya saxlaya və ya iki namazı birləşdirə bilərəmmi?', en: 'Can I delay prayer past its time, or combine two prayers, because of work?', ru: 'Можно ли из-за работы откладывать намаз за пределы его времени или объединять два намаза?', ar: 'هل يجوز تأخير الصلاة عن وقتها أو الجمع بين صلاتين بسبب العمل؟', tr: 'İş yüzünden namazı vaktinden sonraya bırakabilir veya iki namazı birleştirebilir miyim?' },
              a: {
                az: 'İş namazı vaxtından çıxarmaq üçün üzr deyil (Nur 24:37 — «Onları nə ticarət, nə alış-veriş Allahın zikrindən və namazdan yayındırar»). Müəyyən hallarda yalnız zöhr ilə əsr, məğrib ilə işa birləşdirilə bilər; əsr ilə məğrib birləşdirilmir. İş vaxtını namazı vaxtında qılmağa imkan verəcək şəkildə təşkil etmək lazımdır.',
                en: 'Work is not an excuse for taking prayer out of its time (an-Nur 24:37: “men whom neither trade nor sale distracts from the remembrance of Allah and prayer”). In some cases only Dhuhr with Asr, and Maghrib with Isha, may be combined; Asr may not be combined with Maghrib. You must arrange your work so that you can pray on time.',
                ru: 'Работа не оправдывает вынесение намаза за пределы его времени (ан-Нур 24:37: «люди, которых торговля и купля не отвлекают от поминания Аллаха и намаза»). В некоторых случаях можно объединять только зухр с асром и магриб с иша; аср с магрибом не объединяется. Нужно устроить рабочее время так, чтобы молиться вовремя.',
                ar: 'لا يجوز تأخير الصلاة عن وقتها لأجل العمل، فالعمل ليس عذرًا؛ قال تعالى: ﴿رِجَالٌ لَّا تُلْهِيهِمْ تِجَـٰرَةٌ وَلَا بَيْعٌ عَن ذِكْرِ ٱللَّهِ وَإِقَامِ ٱلصَّلَوٰةِ﴾ [النور: 37]. والجمع يكون في بعض الأحوال بين الظهر والعصر وبين المغرب والعشاء فقط، ولا يُجمع العصر مع المغرب. فعليك أن تنظم عملك بحيث تصلي في الوقت.',
                tr: 'İş, namazı vaktinden çıkarmak için mazeret değildir (Nûr 24:37: “Onları ne ticaret ne alışveriş Allah’ı anmaktan ve namazdan alıkoyar”). Bazı durumlarda yalnız öğle ile ikindi, akşam ile yatsı birleştirilebilir; ikindi ile akşam birleştirilmez. İş vaktini namazı vaktinde kılmaya imkân verecek şekilde düzenlemek gerekir.',
              },
              ...iq(20712),
            },
            {
              q: { az: 'Kişi üçün namazı məsciddə cəmaatla qılmaq vacibdirmi?', en: 'Is praying in congregation in the mosque obligatory for men?', ru: 'Обязателен ли для мужчин коллективный намаз в мечети?', ar: 'هل صلاة الجماعة في المسجد واجبة على الرجال؟', tr: 'Erkek için namazı camide cemaatle kılmak vacip midir?' },
              a: {
                az: 'Daha doğru rəyə görə sağlam kişilər üçün cəmaat namazı məsciddə vacibdir. Dəlillərdən biri qorxu namazı ayəsidir (Nisa 4:102): Allah qorxu halında belə cəmaatı əmr edib və ikinci dəstəni ondan azad etməyib. Bu, cəmaatın hər kəsə fərdi vacib olduğunu göstərir.',
                en: 'According to the more correct view, congregational prayer in the mosque is obligatory for healthy men. One proof is the verse of the fear prayer (an-Nisa 4:102): Allah commanded congregation even in a state of fear and did not exempt the second group. This shows it is an individual obligation.',
                ru: 'По более верному мнению, коллективный намаз в мечети обязателен для здоровых мужчин. Один из доводов — аят о намазе в состоянии страха (ан-Ниса 4:102): Аллах велел молиться сообща даже при опасности и не освободил от этого вторую группу. Это показывает, что это обязанность каждого.',
                ar: 'الراجح أن صلاة الجماعة في المسجد واجبة على الرجال القادرين، ومن أدلة ذلك آية صلاة الخوف [النساء: 102]؛ إذ أمر الله بالجماعة حال الخوف ولم يُسقطها عن الطائفة الثانية، فدل على أنها فرض عين.',
                tr: 'Daha doğru görüşe göre sağlıklı erkekler için cemaat namazı camide vaciptir. Delillerden biri korku namazı ayetidir (Nisâ 4:102): Allah korku hâlinde bile cemaati emretmiş ve ikinci grubu bundan muaf tutmamıştır. Bu, cemaatin herkese farz-ı ayn olduğunu gösterir.',
              },
              ...iq(40113),
            },
            {
              q: { az: 'Qadın üçün namazı evdə qılmaq daha yaxşıdırmı?', en: 'Is it better for a woman to pray at home?', ru: 'Лучше ли женщине молиться дома?', ar: 'هل الأفضل للمرأة أن تصلي في بيتها؟', tr: 'Kadının namazı evde kılması daha mı faziletlidir?' },
              a: {
                az: 'Bəli. Peyğəmbər ﷺ qadınların evdə namaz qılmasını üstün tutmuş və bunun savabının məsciddəkindən çox olduğunu bildirmişdir: «Qadının otağında qıldığı namaz həyətdə qıldığından, kiçik guşədə qıldığı isə otaqda qıldığından üstündür» (Əbu Davud 570, əl-Albani səhih sayıb). Bayırda namaz qılmalı olsa, örtülü yer seçər; kişinin onu görməsi namazı batil etmir.',
                en: 'Yes. The Prophet ﷺ preferred that women pray in their houses and said their reward is greater than in the mosque: “A woman’s prayer in her room is better than in her courtyard, and her prayer in her small inner room is better than in her room” (Abu Dawud 570, graded sahih by al-Albani). If she must pray in a public place, she chooses a screened spot; her prayer is not invalidated because a man sees her.',
                ru: 'Да. Пророк ﷺ предпочитал, чтобы женщины молились дома, и сообщил, что награда за это больше, чем в мечети: «Молитва женщины в её комнате лучше, чем во дворе, а в её чулане — лучше, чем в комнате» (Абу Дауд 570, аль-Албани назвал достоверным). Если ей нужно молиться в общественном месте, пусть выберет укрытое место; то, что её увидит мужчина, намаз не портит.',
                ar: 'نعم، فقد رغّب النبي ﷺ النساء في الصلاة في بيوتهن وأخبر أن أجرها أعظم من الصلاة في المسجد، وقال: «صلاة المرأة في بيتها أفضل من صلاتها في حجرتها، وصلاتها في مخدعها أفضل من صلاتها في بيتها» (أبو داود 570، وصححه الألباني). وإن احتاجت إلى الصلاة في مكان عام صلت في موضع مستور، ولا تبطل صلاتها برؤية رجل لها.',
                tr: 'Evet. Peygamber ﷺ kadınların evlerinde namaz kılmasını tercih etmiş ve bunun sevabının camidekinden fazla olduğunu bildirmiştir: “Kadının odasında kıldığı namaz avlusunda kıldığından, küçük iç odasında kıldığı da odasında kıldığından daha faziletlidir” (Ebû Dâvûd 570, Elbânî sahih saymıştır). Dışarıda kılması gerekirse örtülü bir yer seçer; bir erkeğin onu görmesi namazını bozmaz.',
              },
              ...iq(8868),
            },
            {
              q: { az: 'Namazda ərəbcədən başqa dildə dua etmək olarmı?', en: 'May I make du‘a in a language other than Arabic during prayer?', ru: 'Можно ли в намазе обращаться с мольбой не на арабском?', ar: 'هل يجوز الدعاء في الصلاة بغير العربية؟', tr: 'Namazda Arapçadan başka bir dilde dua edilebilir mi?' },
              a: {
                az: 'Ərəbcə yaxşı dua edə bilən şəxs üçün namazda başqa dildə dua etmək caiz deyil. Bacarmayan isə ərəbcə öyrənməyə başlayaraq hələlik öz dilində dua edə bilər. Namazdan kənarda isə başqa dildə dua etməyin heç bir qadağası yoxdur; İbn Teymiyyə deyir ki, Allah hər dildə olan duanı eşidir.',
                en: 'Whoever can make du‘a well in Arabic may not make it in another language within the prayer. Whoever cannot may make du‘a in his own language for now, while starting to learn Arabic. Outside the prayer there is nothing wrong with du‘a in any language; Ibn Taymiyyah said that Allah hears all voices in every language.',
                ru: 'Тому, кто может хорошо обращаться с мольбой по-арабски, в намазе нельзя молиться на другом языке. Тот, кто не может, вправе пока молиться на своём языке, начав учить арабский. Вне намаза в мольбе на любом языке нет ничего плохого; ибн Таймия сказал, что Аллах слышит все голоса на всех языках.',
                ar: 'من أحسن الدعاء بالعربية لم يجز له أن يدعو في الصلاة بغيرها، ومن عجز عنها فلا بأس أن يدعو بلغته مع شروعه في تعلم العربية. أما خارج الصلاة فلا حرج في الدعاء بغير العربية، قال شيخ الإسلام ابن تيمية: يجوز الدعاء بالعربية وبغيرها، والله يسمع الأصوات على اختلاف اللغات.',
                tr: 'Arapça güzelce dua edebilen kişinin namazda başka dilde dua etmesi caiz değildir. Edemeyen ise Arapça öğrenmeye başlayarak şimdilik kendi dilinde dua edebilir. Namaz dışında ise başka dilde dua etmekte sakınca yoktur; İbn Teymiyye, Allah’ın her dildeki sesi işittiğini söyler.',
              },
              ...iq(20953),
            },
          ],
        },
      ],
    },

    // ───────────────────────── ORUC ─────────────────────────
    {
      id: 'sawm',
      title: { az: 'Oruc', en: 'Fasting', ru: 'Пост', ar: 'الصيام', tr: 'Oruç' },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Orucu pozan şeylərin əsası yemək-içmək və onların yerini tutan şeylərdir; buna görə müasir dərmanların çoxu orucu pozmur. Kəffarə və fidyənin təfsilatı «Kəffarə və fidyə» dərsindədir.',
            en: 'What breaks the fast is essentially eating, drinking and what takes their place; that is why many modern medicines do not break it. Details of expiation and fidyah are in the “Expiation and fidyah” lesson.',
            ru: 'Пост в основе нарушают еда, питьё и то, что их заменяет; поэтому многие современные лекарства его не нарушают. Подробности искупления и фидьи — в уроке «Искупление и фидья».',
            ar: 'الأصل في المفطرات الأكل والشرب وما في معناهما، ولذلك لا يفطر كثير من الأدوية الحديثة. وتفصيل الكفارة والفدية في درس «الكفارات والفدية».',
            tr: 'Orucu bozan şeylerin esası yemek, içmek ve bunların yerini tutan şeylerdir; bu yüzden modern ilaçların çoğu orucu bozmaz. Kefaret ve fidyenin ayrıntıları “Kefaret ve fidye” dersindedir.',
          },
        },
        {
          t: 'qa',
          items: [
            {
              q: { az: 'Oruclu olduğumu unudub yedim-içdim. Orucum pozuldumu?', en: 'I forgot I was fasting and ate or drank. Is my fast broken?', ru: 'Я забыл, что пощусь, и поел или попил. Нарушен ли пост?', ar: 'نسيت أني صائم فأكلت أو شربت، فهل فسد صومي؟', tr: 'Oruçlu olduğumu unutup yiyip içtim. Orucum bozuldu mu?' },
              a: {
                az: 'Xeyr, orucun düzgündür və qəzası yoxdur. Peyğəmbər ﷺ demişdir: «Kim oruclu olduğunu unudub yeyər və ya içərsə, orucunu tamamlasın; onu Allah yedirdib-içirdib» (Buxari və Müslim). Daha doğru rəyə görə unudaraq yaxınlıq etmək də eyni hökmdədir.',
                en: 'No, your fast is valid and there is nothing to make up. The Prophet ﷺ said: “Whoever forgets that he is fasting and eats or drinks, let him complete his fast, for it is Allah who fed him and gave him drink” (al-Bukhari and Muslim). According to the more correct view, intercourse out of forgetfulness takes the same ruling.',
                ru: 'Нет, пост действителен, и восполнять его не нужно. Пророк ﷺ сказал: «Кто забыл, что постится, и поел или попил, пусть завершит свой пост, ведь это Аллах накормил и напоил его» (аль-Бухари и Муслим). По более верному мнению, близость по забывчивости имеет то же положение.',
                ar: 'لا يفسد، وصومك صحيح ولا قضاء عليك؛ لقول النبي ﷺ: «من نسي وهو صائم فأكل أو شرب فليتم صومه، فإنما أطعمه الله وسقاه» (متفق عليه). وكذلك من جامع ناسيًا على الصحيح من قولي العلماء.',
                tr: 'Hayır, orucun geçerlidir ve kazası yoktur. Peygamber ﷺ şöyle demiştir: “Kim oruçlu olduğunu unutup yer veya içerse orucunu tamamlasın; onu Allah yedirmiş ve içirmiştir” (Buhârî ve Müslim). Daha doğru görüşe göre unutarak cinsel ilişki de aynı hükümdedir.',
              },
              ...iq(22833),
            },
            {
              q: { az: 'Göz və qulaq damcıları orucu pozurmu?', en: 'Do eye drops and ear drops break the fast?', ru: 'Нарушают ли пост глазные и ушные капли?', ar: 'هل قطرة العين والأذن تفطر الصائم؟', tr: 'Göz ve kulak damlaları orucu bozar mı?' },
              a: {
                az: 'Xeyr, daha doğru rəyə görə orucu pozmur. İslam Fiqh Şurası da göz və qulaq damcılarını, burun damcısı və spreyini — boğaza çatanı udmamaq şərtilə — orucu pozmayan şeylər sırasında sayıb. Bəzi alimlər damcının dadı boğazda hiss olunarsa orucun pozulduğunu deyir; ehtiyat üçün bunları gündüz istifadə etməmək, dadı hiss edənin isə həmin günü qəza etməsi daha yaxşıdır.',
                en: 'No, according to the more correct view they do not break it. The Islamic Fiqh Council also listed eye and ear drops, nose drops and nasal sprays among things that do not break the fast, provided one does not swallow what reaches the throat. Some scholars say the fast is broken if the taste is felt in the throat; to be safe it is better to avoid them by day, and whoever tastes them should make up that day.',
                ru: 'Нет, по более верному мнению они пост не нарушают. Исламский совет по фикху также отнёс глазные и ушные капли, капли и спрей для носа к тому, что не нарушает пост, — при условии не глотать то, что дошло до горла. Некоторые учёные считают, что пост нарушается, если вкус ощущается в горле; из осторожности лучше не пользоваться ими днём, а тот, кто ощутил вкус, пусть восполнит этот день.',
                ar: 'لا تفطر على الصحيح من قولي العلماء، وقد نص مجمع الفقه الإسلامي على أن قطرة العين والأذن وقطرة الأنف وبخاخه لا تفطر إذا اجتنب ابتلاع ما يصل إلى الحلق. وبعض العلماء يرى الفطر إذا وُجد طعمها في الحلق، فالأحوط تركها نهارًا، ومن وجد طعمها فقضى ذلك اليوم فهو أحسن.',
                tr: 'Hayır, daha doğru görüşe göre orucu bozmaz. İslam Fıkıh Konseyi de göz ve kulak damlalarını, burun damlası ve spreyini — boğaza ulaşanı yutmamak şartıyla — orucu bozmayan şeyler arasında saymıştır. Bazı âlimler damlanın tadı boğazda hissedilirse orucun bozulacağını söyler; ihtiyaten bunları gündüz kullanmamak, tadını hissedenin de o günü kaza etmesi daha iyidir.',
              },
              ...iq(80208),
            },
            {
              q: { az: 'Oruclu ikən diş pastası ilə dişləri fırçalamaq olarmı?', en: 'May I brush my teeth with toothpaste while fasting?', ru: 'Можно ли чистить зубы пастой во время поста?', ar: 'هل يجوز للصائم تنظيف أسنانه بالمعجون؟', tr: 'Oruçluyken diş macunuyla dişleri fırçalamak caiz mi?' },
              a: {
                az: 'Bəli, bir şey udmamağa diqqət etmək şərtilə; İbn Baz bunu misvaka bənzədib. İbn Useymin isə deyir: caizdir, amma pasta güclü olduğu üçün boğaza keçə bilər, ona görə daha yaxşısı onu gecə istifadə etmək, gündüz isə misvakla kifayətlənməkdir.',
                en: 'Yes, provided you take care not to swallow any of it; Ibn Baz compared it to the siwak. Ibn Uthaymin said it is permitted, but since toothpaste is strong and may go down the throat, it is better to use it at night and suffice with the siwak by day.',
                ru: 'Да, если остерегаться что-либо проглотить; ибн Баз уподобил это мисваку. Ибн Усеймин сказал: это дозволено, но паста сильная и может попасть в горло, поэтому лучше пользоваться ею ночью, а днём ограничиваться мисваком.',
                ar: 'نعم مع التحرز من ابتلاع شيء منه، وقد شبهه ابن باز بالسواك. وقال ابن عثيمين: جائز، لكن الأولى تركه نهارًا لأن المعجون له نفوذ قوي قد ينزل إلى الحلق، فيستعمله ليلًا.',
                tr: 'Evet, bir şey yutmamaya dikkat etmek şartıyla; İbn Baz bunu misvağa benzetmiştir. İbn Useymin ise caiz olduğunu, ancak macunun güçlü olup boğaza inebileceği için gece kullanılmasının, gündüz misvakla yetinilmesinin daha iyi olduğunu söyler.',
              },
              ...iq(13619),
            },
            {
              q: { az: 'Oruclu ikən analiz üçün qan vermək orucu pozurmu?', en: 'Does having a blood test break the fast?', ru: 'Нарушает ли пост сдача крови на анализ?', ar: 'هل سحب الدم للتحليل يفطر الصائم؟', tr: 'Oruçluyken tahlil için kan vermek orucu bozar mı?' },
              a: {
                az: 'Xeyr. Analiz üçün alınan qan azdır və insanı zəiflətmir. İbn Baz bunu ehtiyacdan irəli gələn və bağışlanan şey sayıb; İbn Useymin deyir ki, oruc yalnız şəri dəlili olan şeylə pozular və bu az qan hacamət kimi bədənə təsir etmir.',
                en: 'No. The blood taken for a test is little and does not weaken the person. Ibn Baz considered it excused because it is needed; Ibn Uthaymin said the fast is only broken by what there is Shar‘i evidence for, and this small amount does not affect the body as cupping does.',
                ru: 'Нет. Кровь для анализа берут в малом количестве, и она не ослабляет человека. Ибн Баз считал это простительным, так как это необходимость; ибн Усеймин сказал, что пост нарушается лишь тем, на что есть шариатский довод, а это малое количество не влияет на тело, как кровопускание.',
                ar: 'لا يفطر؛ لأنه دم يسير لا يُضعف الصائم. قال ابن باز: هذا معفو عنه لأنه للحاجة، وقال ابن عثيمين: لا يفطر الصائم بسحب الدم للتحليل لأنه يسير لا يؤثر في البدن تأثير الحجامة، والأصل بقاء الصوم حتى يقوم دليل على فساده.',
                tr: 'Hayır. Tahlil için alınan kan azdır ve kişiyi zayıflatmaz. İbn Baz bunu ihtiyaçtan dolayı affedilen bir şey saymıştır; İbn Useymin ise orucun ancak şer‘î delili olan şeyle bozulacağını, bu az kanın da hacamat gibi bedene etki etmediğini söyler.',
              },
              ...iq(50406),
            },
            {
              q: { az: 'Astma inhalyatoru orucu pozurmu?', en: 'Does an asthma inhaler break the fast?', ru: 'Нарушает ли пост ингалятор от астмы?', ar: 'هل بخاخ الربو يفطر الصائم؟', tr: 'Astım spreyi (inhaler) orucu bozar mı?' },
              a: {
                az: 'Xeyr. İbn Baz, İbn Useymin və Daimi Komitə bildirir ki, inhalyator ağciyərlərə gedən təzyiqli qaz/buxardır, mədəyə çatmır və yemək-içmək deyil; ona görə orucu pozmur.',
                en: 'No. Ibn Baz, Ibn Uthaymin and the Permanent Committee explained that the inhaler is a pressurised gas or vapour that goes to the lungs, does not reach the stomach and is not food or drink, so it does not break the fast.',
                ru: 'Нет. Ибн Баз, ибн Усеймин и Постоянный комитет разъяснили, что ингалятор — это газ под давлением (пар), который идёт в лёгкие, не достигает желудка и не является едой или питьём, поэтому пост не нарушает.',
                ar: 'لا يفطر؛ فقد بيّن ابن باز وابن عثيمين واللجنة الدائمة أن بخاخ الربو غاز مضغوط يتبخر ويذهب إلى الرئتين ولا يصل إلى المعدة، وليس أكلًا ولا شربًا.',
                tr: 'Hayır. İbn Baz, İbn Useymin ve Daimi Komite, astım spreyinin akciğerlere giden basınçlı gaz/buhar olduğunu, mideye ulaşmadığını ve yiyecek-içecek olmadığını, bu yüzden orucu bozmadığını açıklamıştır.',
              },
              ...iq(37650),
            },
            {
              q: { az: 'Ramazanın qəza oruclarını növbəti Ramazana qədər tutmamışam. Nə etməliyəm?', en: 'I did not make up my missed Ramadan fasts before the next Ramadan. What must I do?', ru: 'Я не восполнил пропущенные дни Рамадана до следующего Рамадана. Что делать?', ar: 'لم أقضِ ما فاتني من رمضان حتى دخل رمضان التالي، فماذا عليّ؟', tr: 'Ramazan kazalarımı bir sonraki Ramazan’a kadar tutmadım. Ne yapmalıyım?' },
              a: {
                az: 'Qəza növbəti Ramazana qədər tutulmalıdır (Aişənin hədisi: Buxari 1950, Müslim). Gecikmə üzrlə idisə (məs. xəstəlik davam edib), yalnız qəza lazımdır. Üzrsüz idisə, günahdır: tövbə edib qəzanı tutmaq lazımdır. Hər gün üçün bir yoxsulu yedirtmək barədə alimlər ixtilaf edib: Malik, Şafii və Əhməd vacib sayıb, Əbu Hənifə və Buxari yox. İbn Useyminin seçiminə görə vacib olan yalnız qəzadır, ehtiyat üçün yedirtmək isə yaxşıdır.',
                en: 'Missed fasts should be made up before the next Ramadan (hadith of Aishah: al-Bukhari 1950, Muslim). If the delay was due to an excuse (e.g. continuing illness), only the make-up is due. If there was no excuse, it is a sin: repent and make up the fasts. On feeding a poor person for each day the scholars differed: Malik, al-Shafi’i and Ahmad required it, Abu Hanifah and al-Bukhari did not. Ibn Uthaymin’s view is that only the make-up is obligatory, and feeding as a precaution is good.',
                ru: 'Пропущенные дни нужно восполнить до следующего Рамадана (хадис Аиши: аль-Бухари 1950, Муслим). Если задержка была по уважительной причине (например, болезнь продолжалась), нужно лишь восполнение. Если без причины — это грех: покайся и восполни посты. О кормлении бедняка за каждый день учёные разошлись: Малик, аш-Шафии и Ахмад обязывали, Абу Ханифа и аль-Бухари — нет. По мнению ибн Усеймина, обязательно лишь восполнение, а кормить из осторожности — хорошо.',
                ar: 'يجب القضاء قبل رمضان التالي؛ لحديث عائشة (البخاري 1950، ومسلم). فإن كان التأخير لعذر كاستمرار المرض فليس عليه إلا القضاء، وإن كان لغير عذر أثم ولزمته التوبة مع القضاء. واختلفوا في الإطعام عن كل يوم: فأوجبه مالك والشافعي وأحمد، ولم يوجبه أبو حنيفة والبخاري، واختار ابن عثيمين أن الواجب القضاء فقط، ومن أطعم احتياطًا فحسن.',
                tr: 'Kazalar bir sonraki Ramazan’dan önce tutulmalıdır (Âişe hadisi: Buhârî 1950, Müslim). Gecikme mazeretle olduysa (ör. hastalık devam ettiyse) sadece kaza gerekir. Mazeretsiz olduysa günahtır: tövbe edip kazaları tutmak gerekir. Her gün için bir fakiri doyurma konusunda âlimler ihtilaf etmiştir: Mâlik, Şâfiî ve Ahmed vacip görmüş, Ebû Hanîfe ve Buhârî görmemiştir. İbn Useymin’e göre vacip olan yalnız kazadır, ihtiyaten doyurmak ise güzeldir.',
              },
              ...iq(26865),
            },
            {
              q: { az: 'Hamilə və ya əmizdirən qadın oruc tutmasa, qəza edirmi, yoxsa fidyə verir?', en: 'If a pregnant or breastfeeding woman does not fast, does she make up the days or pay fidyah?', ru: 'Если беременная или кормящая женщина не постится, она восполняет дни или платит фидью?', ar: 'إذا أفطرت الحامل أو المرضع، فهل تقضي أم تُطعم؟', tr: 'Hamile veya emziren kadın oruç tutmazsa kaza mı eder, fidye mi verir?' },
              a: {
                az: 'Özü və ya uşağı üçün qorxarsa, oruc tutmaya bilər. Alimlər ixtilaf edib, amma doğru rəy budur ki, o, sonradan qəza etməlidir; İbn Abbas və İbn Ömərdən nəql olunan «yalnız yoxsul yedirtmək kifayətdir» rəyi şəri dəlillərə zidd zəif rəydir. Daimi Komitə və İbn Useymin deyir: onlar xəstə və müsafir kimidir, sadəcə qəza edirlər.',
                en: 'If she fears for herself or her child, she may not fast. Scholars differed, but the correct view is that she must make up the days later; the view narrated from Ibn Abbas and Ibn Umar that feeding the poor alone suffices is weak and contrary to the Shar‘i evidence. The Permanent Committee and Ibn Uthaymin said they are like the sick and the traveller, who only make up the fasts.',
                ru: 'Если она боится за себя или за ребёнка, она может не поститься. Учёные разошлись, но правильное мнение — она должна потом восполнить дни; мнение, передаваемое от ибн Аббаса и ибн Умара, что достаточно лишь кормить бедняков, слабое и противоречит шариатским доводам. Постоянный комитет и ибн Усеймин сказали: они подобны больному и путнику, которые лишь восполняют посты.',
                ar: 'إذا خافت على نفسها أو ولدها جاز لها الفطر. والصحيح من أقوال العلماء أنها تقضي فقط، وما رُوي عن ابن عباس وابن عمر من الاكتفاء بالإطعام قول ضعيف مخالف للأدلة. وقالت اللجنة الدائمة وابن عثيمين: إنهما كالمريض والمسافر، ليس عليهما إلا القضاء.',
                tr: 'Kendisi veya çocuğu için korkarsa oruç tutmayabilir. Âlimler ihtilaf etmiştir, ancak doğru görüş, sonradan kaza etmesi gerektiğidir; İbn Abbas ve İbn Ömer’den nakledilen “sadece fakir doyurmak yeter” görüşü şer‘î delillere aykırı, zayıf bir görüştür. Daimi Komite ve İbn Useymin onların hasta ve yolcu gibi olduğunu, sadece kaza edeceklerini söyler.',
              },
              ...iq(49794),
            },
          ],
        },
      ],
    },

    // ───────────────────────── ZƏKAT ─────────────────────────
    {
      id: 'zakat',
      title: { az: 'Zəkat', en: 'Zakat', ru: 'Закят', ar: 'الزكاة', tr: 'Zekât' },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Pul üzərinə zəkat iki şərtlə vacib olur: məbləğ nisaba çatmalı və nisaba çatdığı gündən bir qəməri il keçməlidir. Dərəcə qırxda bir, yəni 2,5%-dir.',
            en: 'Zakat on money becomes due with two conditions: the amount reaches the nisab, and one lunar year passes from the day it reached the nisab. The rate is one fortieth, i.e. 2.5%.',
            ru: 'Закят с денег становится обязательным при двух условиях: сумма достигает нисаба, и с того дня проходит лунный год. Ставка — одна сороковая, то есть 2,5%.',
            ar: 'تجب الزكاة في النقود بشرطين: بلوغ النصاب، ومرور حول قمري من يوم بلوغه. ومقدارها ربع العشر، أي 2.5%.',
            tr: 'Para üzerine zekât iki şartla vacip olur: miktar nisaba ulaşmalı ve nisaba ulaştığı günden itibaren bir kamerî yıl geçmelidir. Oranı kırkta bir, yani %2,5’tir.',
          },
        },
        {
          t: 'qa',
          items: [
            {
              q: { az: 'Kağız pulun nisabı nə qədərdir?', en: 'What is the nisab for paper money?', ru: 'Каков нисаб для бумажных денег?', ar: 'كم نصاب الأوراق النقدية؟', tr: 'Kâğıt paranın nisabı ne kadardır?' },
              a: {
                az: 'Kağız pulun nisabı zəkat vacib olan vaxt 20 misqal qızılın (təqr. 85 q) və ya 140 misqal gümüşün (təqr. 595 q) dəyərinə bərabər məbləğdir. Daimi Komitəyə görə bu ikisindən yoxsullar üçün daha faydalısı götürülür; hazırda gümüş daha ucuz olduğu üçün nisab gümüşə görə hesablanır. Bir il keçəndə 2,5% verilir.',
                en: 'The nisab for paper money is the value of 20 mithqals of gold (about 85 g) or 140 mithqals of silver (about 595 g) at the time zakat is due. According to the Permanent Committee, whichever is more beneficial to the poor is used; as silver is currently cheaper, the nisab is calculated by silver. After a year, 2.5% is paid.',
                ru: 'Нисаб бумажных денег — сумма, равная на момент обязательности закята стоимости 20 мискалей золота (около 85 г) или 140 мискалей серебра (около 595 г). По мнению Постоянного комитета, берётся то, что выгоднее бедным; сейчас серебро дешевле, поэтому нисаб считают по серебру. По прошествии года выплачивается 2,5%.',
                ar: 'نصاب الأوراق النقدية ما يعادل قيمة عشرين مثقالًا من الذهب (نحو 85 غرامًا) أو مئة وأربعين مثقالًا من الفضة (نحو 595 غرامًا) وقت وجوب الزكاة، ويُعتبر الأنفع للفقراء كما أفتت اللجنة الدائمة، والفضة اليوم أرخص فيُقدَّر النصاب بها. ويُخرج 2.5% بعد الحول.',
                tr: 'Kâğıt paranın nisabı, zekâtın vacip olduğu anda 20 miskal altının (yaklaşık 85 g) veya 140 miskal gümüşün (yaklaşık 595 g) değerine eşit miktardır. Daimi Komite’ye göre ikisinden fakirlere daha faydalı olanı esas alınır; şu an gümüş daha ucuz olduğundan nisap gümüşe göre hesaplanır. Bir yıl geçince %2,5 verilir.',
              },
              ...iq(2795),
            },
            {
              q: { az: 'İl ərzində maaşdan əlavə pul yığılır. Zəkatı necə hesablayım?', en: 'Money from my salary is added during the year. How do I calculate zakat?', ru: 'В течение года к сбережениям добавляются деньги из зарплаты. Как считать закят?', ar: 'يزيد مالي خلال السنة من راتبي، فكيف أحسب الزكاة؟', tr: 'Yıl içinde maaştan biriken para ekleniyor. Zekâtı nasıl hesaplarım?' },
              a: {
                az: 'Əgər artım əsas puldan törəyirsə (məs. sərmayənin qazancı), ilin sonunda hamısından zəkat verilir. Əgər artım başqa yoldan gəlirsə (miras, hədiyyə, maaşdan yığım), hər məbləğin ayrıca ili var. Maaşdan yığılan pulda isə seçim var: birinci məbləğin ili tamam olanda hamısından vermək — bu, ili tamam olmayan hissəni qabaqcadan vermək sayılır — və ya hər hissəni öz ili ilə hesablamaq.',
                en: 'If the increase stems from the original money (e.g. profit on invested capital), zakat is paid on all of it at year end. If it came by other means (inheritance, gift, savings from salary), each amount has its own year. With salary savings you may choose: pay on the whole amount when the first sum’s year is complete — paying early for the part whose year has not passed — or count a separate year for each part.',
                ru: 'Если прирост происходит из основной суммы (например, прибыль на вложенный капитал), в конце года закят платится со всего. Если он получен иначе (наследство, подарок, накопления из зарплаты), у каждой суммы свой год. С накоплений из зарплаты можно выбрать: заплатить со всего, когда завершится год первой суммы, — это досрочная выплата за часть, по которой год не прошёл, — или считать отдельный год для каждой части.',
                ar: 'إن كانت الزيادة ناشئة عن الأصل كربح المال المستثمر زُكّي الجميع عند تمام الحول. وإن كانت من مصدر آخر كإرث أو هبة أو ادخار من الراتب فلكل مبلغ حوله. وفي الادخار من الراتب يُخيَّر بين أن يزكي الجميع عند حول المبلغ الأول فيكون معجِّلًا لزكاة ما لم يحُل عليه الحول، أو أن يحسب لكل جزء حوله.',
                tr: 'Artış ana paradan doğuyorsa (ör. yatırılan sermayenin kârı) yıl sonunda tamamından zekât verilir. Başka yoldan geldiyse (miras, hediye, maaştan birikim) her miktarın ayrı yılı vardır. Maaş birikiminde ise seçim vardır: ilk miktarın yılı dolunca tamamından vermek — bu, yılı dolmamış kısmın zekâtını önceden vermek sayılır — ya da her kısmı kendi yılıyla hesaplamak.',
              },
              ...iq(93414),
            },
            {
              q: { az: 'Qadının taxdığı qızıl bəzəklərdən zəkat verilirmi?', en: 'Is zakat due on gold jewellery that a woman wears?', ru: 'Платится ли закят с золотых украшений, которые носит женщина?', ar: 'هل تجب الزكاة في الذهب الذي تلبسه المرأة؟', tr: 'Kadının taktığı altın takılardan zekât verilir mi?' },
              a: {
                az: 'Ticarət üçün və ya haram istifadə üçün olan bəzəkdən zəkat verildiyində icma var. Taxılan halal bəzəkdə isə alimlər ixtilaf edib: bəziləri onu paltar kimi sayıb zəkat düşmədiyini deyir. Daha doğru rəyə görə isə nisaba çatarsa (və ya digər qızıl, gümüş, ticarət malı ilə birlikdə nisabı tamamlayarsa), qızıl-gümüş haqqındakı ümumi hədislərə əsasən zəkat vacibdir.',
                en: 'There is agreement that zakat is due on jewellery held for trade or for a forbidden use. On permissible jewellery that is worn the scholars differed: some regard it like clothing with no zakat. The more correct view is that zakat is due if it reaches the nisab (or completes it together with other gold, silver and trade goods), because of the general hadiths on gold and silver.',
                ru: 'Есть согласие, что закят выплачивается с украшений для торговли или запретного использования. О дозволенных украшениях, которые носят, учёные разошлись: некоторые уподобляют их одежде и не обязывают закятом. Более верное мнение — закят обязателен, если они достигают нисаба (или восполняют его вместе с другим золотом, серебром и товаром), по общему смыслу хадисов о золоте и серебре.',
                ar: 'اتفق العلماء على وجوب الزكاة في الحلي المعدّ للتجارة أو المحرّم استعماله. واختلفوا في الحلي المباح المعدّ للاستعمال، فمنهم من جعله كالثياب فلا زكاة فيه، والأصح وجوب الزكاة فيه إذا بلغ النصاب أو كمل به مع غيره من الذهب والفضة وعروض التجارة؛ لعموم الأحاديث.',
                tr: 'Ticaret için veya haram kullanım için olan takıdan zekât verileceğinde ittifak vardır. Takılan helal takıda ise âlimler ihtilaf etmiştir: bazıları onu elbise gibi sayıp zekât düşmediğini söyler. Daha doğru görüşe göre nisaba ulaşırsa (veya başka altın, gümüş ve ticaret malıyla birlikte nisabı tamamlarsa), altın ve gümüşle ilgili genel hadisler gereği zekât vaciptir.',
              },
              ...iq(19901),
            },
            {
              q: { az: 'Yaşadığım ev və sürdüyüm maşından zəkat verilirmi?', en: 'Is zakat due on the house I live in and the car I drive?', ru: 'Платится ли закят с дома, в котором я живу, и машины, на которой езжу?', ar: 'هل تجب الزكاة في البيت الذي أسكنه والسيارة التي أركبها؟', tr: 'Oturduğum ev ve kullandığım arabadan zekât verilir mi?' },
              a: {
                az: 'Xeyr. Qızıl, gümüş və puldan başqa mülkdən — ev, maşın, ev əşyaları, paltar, kitab və s. — zəkat yalnız ticarət (satış) üçün nəzərdə tutulubsa verilir. Şəxsi istifadə üçün olanlardan zəkat yoxdur.',
                en: 'No. On property other than gold, silver and money — houses, cars, furniture, clothes, books and so on — zakat is due only if it is intended for trade (resale). There is no zakat on what is for personal use.',
                ru: 'Нет. С имущества, кроме золота, серебра и денег, — дома, машины, мебели, одежды, книг и т. п. — закят платится, только если оно предназначено для торговли (перепродажи). С того, что для личного пользования, закята нет.',
                ar: 'لا؛ فما يملكه الإنسان من غير الذهب والفضة والنقود، كالعقار والسيارات والأثاث والثياب والكتب، لا زكاة فيه إلا إذا كان معدًّا للتجارة.',
                tr: 'Hayır. Altın, gümüş ve para dışındaki mallardan — ev, araba, mobilya, elbise, kitap vb. — zekât ancak ticaret (satış) için ayrılmışsa verilir. Kişisel kullanım için olanlardan zekât yoktur.',
              },
              ...iq(224770),
            },
            {
              q: { az: 'Başqasına borc vermişəm, özüm də borcluyam. Zəkatı necə hesablayım?', en: 'I have lent money to others and I am also in debt. How do I calculate zakat?', ru: 'Я дал в долг другим и сам имею долги. Как считать закят?', ar: 'لي ديون عند الناس وعليّ ديون، فكيف أزكي؟', tr: 'Başkasına borç verdim, kendim de borçluyum. Zekâtı nasıl hesaplarım?' },
              a: {
                az: 'Sizin borcunuz zəkatı düşürmür — İbn Baz bunu ən səhih rəy sayır. Sizə olan borca gəlincə: borclu varlı və ödəməyə hazırdırsa, hər il zəkatı verilir (pulu alana qədər gecikdirib sonra keçən illər üçün vermək olar). Borclu kasıbdırsa və ya inkar edirsə, zəkat düşmür; pulu alanda ehtiyat üçün bir illik zəkat verilir (Maliki rəyi).',
                en: 'Your own debts do not cancel zakat — Ibn Baz called this the soundest view. As for money owed to you: if the debtor is rich and willing to pay, zakat is due on it every year (you may wait until you receive it and then pay for the past years). If the debtor is poor or denies the debt, no zakat is due; when you receive it, pay one year’s zakat as a precaution (the Maliki view).',
                ru: 'Ваши собственные долги не отменяют закят — ибн Баз назвал это самым верным мнением. Что касается долгов вам: если должник богат и готов платить, закят с этой суммы обязателен каждый год (можно дождаться получения и заплатить за прошедшие годы). Если должник беден или отрицает долг, закята нет; получив деньги, из осторожности заплатите закят за один год (мнение маликитов).',
                ar: 'الدين الذي عليك لا يُسقط الزكاة على أصح قولي العلماء كما قال ابن باز. وأما الدين الذي لك: فإن كان على مليء باذل وجبت زكاته كل سنة، ويجوز تأخيرها حتى يقبضه فيزكيه لما مضى. وإن كان على معسر أو جاحد فلا زكاة فيه، ويزكيه احتياطًا عن سنة واحدة إذا قبضه، وهو مذهب المالكية.',
                tr: 'Sizin borcunuz zekâtı düşürmez — İbn Baz bunu en sahih görüş saymıştır. Size olan borca gelince: borçlu zengin ve ödemeye hazırsa her yıl zekâtı verilir (parayı alana kadar bekleyip sonra geçmiş yıllar için vermek caizdir). Borçlu fakirse veya inkâr ediyorsa zekât düşmez; parayı aldığınızda ihtiyaten bir yıllık zekât verilir (Mâlikî görüşü).',
              },
              ...iq(106434),
            },
            {
              q: { az: 'Fitrə sədəqəsini pulla vermək olarmı?', en: 'Can zakat al-fitr be paid in money?', ru: 'Можно ли выплатить закят аль-фитр деньгами?', ar: 'هل يجوز إخراج زكاة الفطر نقودًا؟', tr: 'Fıtır sadakası parayla verilebilir mi?' },
              a: {
                az: 'Sünnədə gələnə bağlı qalmaq lazımdır: fitrə sədəqəsi yeməklə verilir. Peyğəmbər ﷺ onu bir sa xurma və ya arpa olaraq fərz etmiş və bayram namazından əvvəl verilməsini əmr etmişdir (Buxari 1503). Ölkənin əsas qidasından (düyü, buğda və s.) hər ailə üzvü üçün bir sa — təqr. 3 kq — verilir və yalnız ehtiyacı olan müsəlmana verilir.',
                en: 'One should keep to what is recorded in the Sunnah: zakat al-fitr is given in food. The Prophet ﷺ made it obligatory as a sa‘ of dates or barley and ordered that it be given before the Eid prayer (al-Bukhari 1503). One sa‘ (about 3 kg) of the local staple (rice, wheat, etc.) is given for each family member, and only to a needy Muslim.',
                ru: 'Следует придерживаться того, что пришло в Сунне: закят аль-фитр выдаётся едой. Пророк ﷺ сделал его обязательным в размере са‘ фиников или ячменя и велел выдавать до праздничного намаза (аль-Бухари 1503). За каждого члена семьи выдаётся один са‘ (около 3 кг) основного продукта страны (рис, пшеница и т. п.), и только нуждающемуся мусульманину.',
                ar: 'الواجب التقيد بما ورد في السنة، فزكاة الفطر تُخرج طعامًا لا نقودًا؛ لأن النبي ﷺ فرضها صاعًا من تمر أو صاعًا من شعير وأمر بها أن تؤدى قبل خروج الناس إلى الصلاة (البخاري 1503). فيُخرج صاعًا (نحو 3 كيلوغرامات) من قوت البلد كالأرز والقمح عن كل فرد، ولا تُعطى إلا لمسلم محتاج.',
                tr: 'Sünnette gelene bağlı kalmak gerekir: fıtır sadakası yiyecek olarak verilir. Peygamber ﷺ onu bir sâ hurma veya arpa olarak farz kılmış ve bayram namazından önce verilmesini emretmiştir (Buhârî 1503). Ülkenin temel gıdasından (pirinç, buğday vb.) her aile ferdi için bir sâ — yaklaşık 3 kg — verilir ve yalnız ihtiyaç sahibi Müslümana verilir.',
              },
              ...iq(1396),
            },
            {
              q: { az: 'Zəkatı kasıb qardaşa, bacıya və ya əmiyə vermək olarmı?', en: 'Can I give zakat to a poor brother, sister or uncle?', ru: 'Можно ли отдать закят бедному брату, сестре или дяде?', ar: 'هل يجوز دفع الزكاة إلى الأخ أو الأخت أو العم الفقير؟', tr: 'Zekâtı fakir kardeşe, kız kardeşe veya amcaya vermek caiz mi?' },
              a: {
                az: 'Bəli, kişi və ya qadın zəkatını kasıb qardaşa, bacıya, əmiyə, bibiyə və ya digər kasıb qohuma verə bilər. Hətta bu, həm sədəqə, həm də qohumluq əlaqəsini saxlamaqdır: «Yoxsula verilən sədəqə bir sədəqədir, qohuma verilən isə həm sədəqə, həm də qohumluq əlaqəsidir».',
                en: 'Yes, a man or woman may give zakat to a poor brother, sister, paternal uncle or aunt, or any poor relative. It is in fact both charity and upholding family ties: “Charity to the poor is charity, and to a relative it is both charity and upholding the ties of kinship.”',
                ru: 'Да, мужчина или женщина может отдать закят бедному брату, сестре, дяде или тёте по отцу либо любому бедному родственнику. Более того, это и милостыня, и поддержание родственных связей: «Милостыня бедному — это милостыня, а родственнику — и милостыня, и поддержание родства».',
                ar: 'لا حرج على الرجل أو المرأة في دفع الزكاة إلى الأخ أو الأخت أو العم أو العمة أو غيرهم من الأقارب الفقراء لعموم الأدلة، بل هي في حقهم صدقة وصلة؛ لقوله ﷺ: «الصدقة على المسكين صدقة، وهي على ذي الرحم ثنتان: صدقة وصلة».',
                tr: 'Evet, erkek veya kadın zekâtını fakir erkek kardeşine, kız kardeşine, amcasına, halasına ya da başka bir fakir akrabasına verebilir. Hatta bu hem sadaka hem de akrabalık bağını gözetmektir: “Yoksula verilen sadaka bir sadakadır, akrabaya verilen ise hem sadaka hem de sıla-i rahimdir.”',
              },
              ...iq(21810),
            },
          ],
        },
      ],
    },

    // ───────────────────────── AİLƏ ─────────────────────────
    {
      id: 'family',
      title: { az: 'Nikah və ailə', en: 'Marriage and family', ru: 'Брак и семья', ar: 'النكاح والأسرة', tr: 'Nikâh ve aile' },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Nikahın rükn və şərtləri ətraflı «Nikah» dərsində izah olunur. Burada ailə həyatında tez-tez soruşulan məsələlər var.',
            en: 'The pillars and conditions of marriage are explained in detail in the “Nikah” lesson. Here are issues frequently asked about in family life.',
            ru: 'Столпы и условия брака подробно разобраны в уроке «Никях». Здесь — вопросы, которые часто задают о семейной жизни.',
            ar: 'أركان النكاح وشروطه مشروحة في درس «النكاح»، وهنا مسائل يكثر السؤال عنها في الحياة الأسرية.',
            tr: 'Nikâhın rükün ve şartları “Nikâh” dersinde ayrıntılı açıklanmıştır. Burada aile hayatında sıkça sorulan meseleler var.',
          },
        },
        {
          t: 'qa',
          items: [
            {
              q: { az: 'Qız vəlinin (atasının) icazəsi olmadan evlənə bilərmi?', en: 'Can a woman marry without the consent of her wali (guardian)?', ru: 'Может ли женщина выйти замуж без согласия опекуна (вали)?', ar: 'هل يجوز للمرأة أن تتزوج بغير إذن وليها؟', tr: 'Kız, velisinin (babasının) izni olmadan evlenebilir mi?' },
              a: {
                az: 'Xeyr. Qız olsun, əvvəl evlənmiş olsun, qadın vəlisinin icazəsi olmadan evlənə bilməz — bu, Şafii, Malik və Əhmədin daxil olduğu əksər alimlərin rəyidir; hədisdə deyilir: «Vəlisiz nikah yoxdur» (Tirmizi 1101, Əbu Davud 2085, İbn Macə 1881). Vəli əsassız yerə mane olarsa, vəlilik növbəti yaxın vəliyə və ya şəri hakimə keçir; hakim yoxdursa, etibarlı dini rəhbər (məs. İslam mərkəzinin rəhbəri) nikahı bağlaya bilər.',
                en: 'No. A woman, whether a virgin or previously married, may not marry without her guardian’s permission — this is the view of most scholars, including al-Shafi’i, Malik and Ahmad; the hadith says: “There is no marriage without a wali” (al-Tirmidhi 1101, Abu Dawud 2085, Ibn Majah 1881). If the guardian refuses without valid reason, guardianship passes to the next guardian or to a Shar‘i judge; if there is no judge, a trustworthy religious authority (e.g. the head of an Islamic centre) may conduct the marriage.',
                ru: 'Нет. Женщина — девушка или ранее бывшая замужем — не может вступить в брак без разрешения опекуна; таково мнение большинства учёных, включая аш-Шафии, Малика и Ахмада; в хадисе сказано: «Нет брака без опекуна» (ат-Тирмизи 1101, Абу Дауд 2085, ибн Маджа 1881). Если опекун без уважительной причины препятствует, опекунство переходит к следующему опекуну или к шариатскому судье; если судьи нет, брак может заключить надёжный религиозный авторитет (например, глава исламского центра).',
                ar: 'لا يجوز أن تُزوَّج المرأة بغير إذن وليها، بكرًا كانت أو ثيبًا، وهو قول جمهور العلماء ومنهم الشافعي ومالك وأحمد؛ لحديث: «لا نكاح إلا بولي» (الترمذي 1101، وأبو داود 2085، وابن ماجه 1881). فإن عضلها الولي بغير حق انتقلت الولاية إلى من بعده أو إلى القاضي الشرعي، فإن لم يوجد قاضٍ زوّجها من يقوم مقامه كمدير المركز الإسلامي.',
                tr: 'Hayır. Bakire olsun, daha önce evlenmiş olsun, kadın velisinin izni olmadan evlenemez — bu, Şâfiî, Mâlik ve Ahmed’in de aralarında bulunduğu âlimlerin çoğunluğunun görüşüdür; hadiste “Velisiz nikâh olmaz” buyrulur (Tirmizî 1101, Ebû Dâvûd 2085, İbn Mâce 1881). Veli haksız yere engel olursa velayet sonraki veliye ya da şer‘î hâkime geçer; hâkim yoksa güvenilir bir dinî otorite (ör. İslam merkezinin yöneticisi) nikâhı kıyabilir.',
              },
              ...iq(7193),
            },
            {
              q: { az: 'Müsəlman kişi xristian qadınla evlənə bilərmi?', en: 'Can a Muslim man marry a Christian woman?', ru: 'Может ли мусульманин жениться на христианке?', ar: 'هل يجوز للمسلم أن يتزوج نصرانية؟', tr: 'Müslüman erkek Hristiyan bir kadınla evlenebilir mi?' },
              a: {
                az: 'Allah müsəlman kişiyə iffətli, zinadan uzaq yəhudi və xristian qadınlarla evlənməyi halal edib (Maidə 5:5); ailədə rəhbərlik müsəlman ərdə olur. İbn Kəsir iffət şərtinin əksər alimlərin rəyi olduğunu deyir. Lakin fətvada bu evliliyin bugünkü reallıqda uşaqların dini və ailə üçün ciddi təhlükələri olduğuna diqqət çəkilir.',
                en: 'Allah permitted a Muslim man to marry Jewish and Christian women who are chaste and avoid zina (al-Ma’idah 5:5), with the Muslim husband having authority in the family. Ibn Kathir said the condition of chastity is the view of the majority. However, the fatwa draws attention to the serious risks of such marriages today for the children’s religion and the family.',
                ru: 'Аллах дозволил мусульманину жениться на целомудренных иудейках и христианках, избегающих прелюбодеяния (аль-Маида 5:5), при этом главенство в семье принадлежит мужу-мусульманину. Ибн Касир сказал, что условие целомудрия — мнение большинства. Однако в фетве обращается внимание на серьёзные опасности такого брака в наши дни для религии детей и семьи.',
                ar: 'أباح الله للمسلم نكاح اليهودية والنصرانية بشرط أن تكون محصنة عفيفة عن الزنا [المائدة: 5]، وتكون القوامة للزوج المسلم، وذكر ابن كثير أن اشتراط العفة قول الجمهور. لكن الفتوى نبهت إلى ما في هذا الزواج اليوم من مخاطر على دين الأولاد والأسرة.',
                tr: 'Allah Müslüman erkeğe iffetli, zinadan uzak Yahudi ve Hristiyan kadınlarla evlenmeyi helal kılmıştır (Mâide 5:5); ailede reislik Müslüman kocadadır. İbn Kesîr iffet şartının çoğunluğun görüşü olduğunu söyler. Ancak fetvada bu evliliğin günümüzde çocukların dini ve aile için ciddi tehlikeler taşıdığına dikkat çekilir.',
              },
              ...iq(20227),
            },
            {
              q: { az: 'Müsəlman qadın qeyri-müsəlman kişiyə ərə gedə bilərmi?', en: 'Can a Muslim woman marry a non-Muslim man?', ru: 'Может ли мусульманка выйти замуж за немусульманина?', ar: 'هل يجوز للمسلمة أن تتزوج غير مسلم؟', tr: 'Müslüman kadın gayrimüslim bir erkekle evlenebilir mi?' },
              a: {
                az: 'Xeyr. Müsəlman qadının qeyri-müsəlmanla — istər yəhudi, istər xristian, istərsə də başqa dindən olsun — evlənməsi caiz deyil. Dəlil: «Müşrik kişilər iman gətirməyincə (mömin qadınları) onlara ərə verməyin» (Bəqərə 2:221).',
                en: 'No. It is not permissible for a Muslim woman to marry a non-Muslim, whether Jewish, Christian or of any other religion. Evidence: “Do not marry (believing women) to polytheists until they believe” (al-Baqarah 2:221).',
                ru: 'Нет. Мусульманке нельзя выходить замуж за немусульманина — будь он иудей, христианин или иной веры. Доводы: «Не выдавайте (верующих женщин) за многобожников, пока они не уверуют» (аль-Бакара 2:221).',
                ar: 'لا يجوز للمسلمة أن تتزوج غير المسلم، يهوديًا كان أو نصرانيًا أو من أي دين آخر؛ لقوله تعالى: ﴿وَلَا تُنكِحُوا۟ ٱلْمُشْرِكِينَ حَتَّىٰ يُؤْمِنُوا۟﴾ [البقرة: 221].',
                tr: 'Hayır. Müslüman kadının gayrimüslimle — Yahudi, Hristiyan veya başka bir dinden olsun — evlenmesi caiz değildir. Delil: “Müşrik erkekler iman edinceye kadar (mümin kadınları) onlarla evlendirmeyin” (Bakara 2:221).',
              },
              ...iq(21380),
            },
            {
              q: { az: 'Hamiləlikdən qorunmaq üçün həb istifadə etmək olarmı?', en: 'Is it permissible to use birth control pills?', ru: 'Можно ли пользоваться противозачаточными таблетками?', ar: 'هل يجوز استعمال حبوب منع الحمل؟', tr: 'Gebelikten korunmak için hap kullanmak caiz mi?' },
              a: {
                az: 'İbn Useymin iki şərt qoyur: 1) ərin icazəsi olmalıdır, çünki uşaq sahibi olmaq onun da haqqıdır; 2) həbin qadına zərər verib-vermədiyini bilmək üçün həkimlə məsləhətləşmək lazımdır. Bu şərtlər olarsa, caizdir, amma daimi olaraq nəsli kəsən üsul seçilməməlidir. Şəriət çox övlad sahibi olmağa təşviq edir.',
                en: 'Ibn Uthaymin set two conditions: 1) the husband’s permission, because having children is his right too; 2) consulting a doctor to know whether the pills will harm her. If these are met, it is permissible, but not on a permanent basis that prevents offspring altogether. The Shari‘ah encourages having many children.',
                ru: 'Ибн Усеймин поставил два условия: 1) разрешение мужа, так как иметь детей — и его право; 2) консультация с врачом, чтобы узнать, не навредят ли таблетки. При этих условиях это дозволено, но не навсегда, так чтобы полностью прекратить потомство. Шариат побуждает иметь много детей.',
                ar: 'اشترط ابن عثيمين لاستعمالها شرطين: إذن الزوج لأن له حقًا في الولد، واستشارة الطبيب في ضررها عليها. فإذا تحقق الشرطان جاز، لكن لا يكون على وجه دائم يقطع النسل. والشرع يرغّب في كثرة الأولاد.',
                tr: 'İbn Useymin iki şart koyar: 1) kocanın izni olmalıdır, çünkü çocuk sahibi olmak onun da hakkıdır; 2) hapın kadına zarar verip vermediğini öğrenmek için doktora danışılmalıdır. Bu şartlar varsa caizdir, ancak nesli tamamen kesen kalıcı bir yöntem seçilmemelidir. Şeriat çok çocuk sahibi olmaya teşvik eder.',
              },
              ...iq(21169),
            },
            {
              q: { az: 'Ər hirsli halda «boşsan» desə, talaq olurmu?', en: 'Does divorce count if the husband says it in anger?', ru: 'Действителен ли развод, произнесённый мужем в гневе?', ar: 'هل يقع طلاق الغضبان؟', tr: 'Koca öfkeliyken “boşsun” derse talak gerçekleşir mi?' },
              a: {
                az: 'Hirsin üç növü var: 1) insan nə etdiyini dərk etməyəcək qədər hirslidirsə — bütün alimlərə görə talaq olmur; 2) çox hirslidir, nə olduğunu dərk edir, amma hirs onu bu sözə məcbur edib — düzgün rəyə görə (İbn Baz, İbn Qeyyim) talaq olmur; 3) adi, şiddətli olmayan hirs — icmaya görə talaq olur. Ər-arvad Allahdan qorxmalı və vəziyyəti ədalətlə qiymətləndirməlidir; öz halınızla bağlı alimə müraciət edin.',
                en: 'Anger is of three kinds: 1) so intense that he is no longer aware of what he is doing — divorce does not occur according to all scholars; 2) very angry and still aware, but the anger drove him to the words — divorce does not occur according to the correct view (Ibn Baz, Ibn al-Qayyim); 3) ordinary, not intense anger — divorce occurs by consensus. Both spouses should fear Allah and judge the situation fairly; in a real case consult a scholar.',
                ru: 'Гнев бывает трёх видов: 1) настолько сильный, что человек не осознаёт, что делает, — развод не происходит по мнению всех учёных; 2) очень сильный, человек осознаёт, но гнев толкнул его к этим словам, — по правильному мнению (ибн Баз, ибн аль-Каййим) развод не происходит; 3) обычный, несильный гнев — развод происходит по единогласному мнению. Супругам следует бояться Аллаха и честно оценить ситуацию; в конкретном случае обратитесь к учёному.',
                ar: 'الغضب ثلاثة أنواع: غضب يُذهب الشعور فلا يدري صاحبه ما يقول، فلا يقع معه الطلاق باتفاق العلماء؛ وغضب شديد مع بقاء الشعور لكنه ألجأه إلى الطلاق، فلا يقع على الصحيح، وهو قول ابن باز وابن القيم؛ وغضب عادي غير شديد فيقع معه الطلاق بالإجماع. فعلى الزوجين تقوى الله والإنصاف في تقدير الحال، وسؤال أهل العلم في الواقعة بعينها.',
                tr: 'Öfkenin üç türü vardır: 1) kişi ne yaptığını bilmeyecek kadar öfkeliyse — bütün âlimlere göre talak olmaz; 2) çok öfkeli, ne olduğunu biliyor ama öfke onu bu söze zorlamış — doğru görüşe göre (İbn Baz, İbnü’l-Kayyim) talak olmaz; 3) olağan, şiddetli olmayan öfke — icmaya göre talak olur. Eşler Allah’tan korkmalı ve durumu adilce değerlendirmelidir; somut durumda bir âlime danışın.',
              },
              ...iq(45174),
            },
            {
              q: { az: 'Qadın ərinin icazəsi olmadan evdən çıxa bilərmi?', en: 'May a wife leave the house without her husband’s permission?', ru: 'Может ли жена выходить из дома без разрешения мужа?', ar: 'هل يجوز للزوجة الخروج من البيت بغير إذن زوجها؟', tr: 'Kadın kocasının izni olmadan evden çıkabilir mi?' },
              a: {
                az: 'Zərurət və ya şəri vəzifə halları istisna olmaqla, qadının ərinin icazəsi olmadan evdən çıxması qadağandır; məhrəmsiz səfər etməsi də qadağandır. Digər tərəfdən, ər də qadının ailəsi ilə yaxşı davranmalıdır və onun ailəsinin onu ziyarət etməsinə mane olmağa haqqı yoxdur — yalnız onların arvadını ərinə qarşı qaldıracağından qorxarsa, istisnadır.',
                en: 'Except in cases of necessity or Shar‘i obligations, a wife may not leave the house without her husband’s permission; travelling without a mahram is also forbidden. On the other hand, the husband should treat his wife’s family well, and he has no right to prevent them from visiting her — unless he fears they will incite her to rebel against him.',
                ru: 'Кроме случаев необходимости или шариатских обязанностей, жене нельзя выходить из дома без разрешения мужа; путешествовать без махрама также запрещено. С другой стороны, муж должен хорошо обращаться с её родственниками и не вправе запрещать им навещать её — если только не опасается, что они будут подстрекать её к непокорности.',
                ar: 'يحرم على المرأة الخروج من بيتها بغير إذن زوجها إلا لضرورة أو أمر شرعي، ويحرم عليها السفر بلا محرم. وفي المقابل ينبغي للزوج أن يحسن إلى أهل زوجته، وليس له أن يمنعهم من زيارتها إلا إذا خشي أن يفسدوها عليه أو يحملوها على النشوز.',
                tr: 'Zaruret veya şer‘î bir vazife hâlleri dışında kadının kocasının izni olmadan evden çıkması yasaktır; mahremsiz yolculuk etmesi de yasaktır. Öte yandan koca da eşinin ailesine iyi davranmalıdır ve onların eşini ziyaret etmesine engel olmaya hakkı yoktur — ancak onların eşini kendisine karşı kışkırtacağından korkarsa müstesnadır.',
              },
              ...iq(69937),
            },
          ],
        },
      ],
    },

    // ───────────────────────── PUL VƏ İŞ ─────────────────────────
    {
      id: 'money',
      title: { az: 'Pul, ticarət və iş', en: 'Money, trade and work', ru: 'Деньги, торговля и работа', ar: 'المال والتجارة والعمل', tr: 'Para, ticaret ve iş' },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Riba (faiz) Quran, Sünnə və icma ilə haramdır. Müasir bank, kredit və sığorta məsələlərinin çoxu bu əsasla həll olunur.',
            en: 'Riba (interest) is forbidden by the Quran, the Sunnah and consensus. Most modern questions about banks, loans and insurance are resolved on this basis.',
            ru: 'Риба (процент) запрещена Кораном, Сунной и единогласным мнением. Большинство современных вопросов о банках, кредитах и страховании решаются на этой основе.',
            ar: 'الربا محرم بالكتاب والسنة والإجماع، وعلى هذا الأصل تُبنى أكثر المسائل المعاصرة في البنوك والقروض والتأمين.',
            tr: 'Riba (faiz) Kur’an, Sünnet ve icma ile haramdır. Banka, kredi ve sigorta ile ilgili modern soruların çoğu bu esasa göre çözülür.',
          },
        },
        {
          t: 'qa',
          items: [
            {
              q: { az: 'Hesabıma faiz yazılıb. Bu pulla nə edim?', en: 'Interest has been added to my account. What should I do with it?', ru: 'На мой счёт начислены проценты. Что с ними делать?', ar: 'أُضيفت إلى حسابي فوائد ربوية، فماذا أفعل بها؟', tr: 'Hesabıma faiz işlendi. Bu parayla ne yapmalıyım?' },
              a: {
                az: 'Sizə yalnız əsas məbləğ halaldır: «Əgər tövbə etsəniz, əsas mallarınız sizindir» (Bəqərə 2:279). Mümkündürsə faizi götürməyin. Bank onu sizə məcburən verirsə, alıb xeyriyyəyə verməklə ondan qurtulmalısınız; onu saxlamaq və ondan hər hansı şəkildə faydalanmaq caiz deyil.',
                en: 'Only the capital is lawful for you: “If you repent, you shall have your capital” (al-Baqarah 2:279). If possible, do not take the interest. If the bank insists on giving it, take it and get rid of it by giving it to charity; you may not keep it or benefit from it in any way.',
                ru: 'Вам дозволена только основная сумма: «Если вы покаетесь, вам останется ваш капитал» (аль-Бакара 2:279). По возможности не берите проценты. Если банк настаивает на их выдаче, возьмите и избавьтесь от них, отдав на благотворительность; оставлять их себе или как-либо пользоваться ими нельзя.',
                ar: 'ليس لك إلا رأس مالك؛ لقوله تعالى: ﴿وَإِن تُبْتُمْ فَلَكُمْ رُءُوسُ أَمْوَٰلِكُمْ﴾ [البقرة: 279]، فاترك الفائدة إن أمكن. فإن أصرّ البنك على دفعها إليك فخذها وتخلص منها بصرفها في وجوه الخير، ولا يجوز لك إمساكها ولا الانتفاع بها بأي وجه.',
                tr: 'Size sadece ana para helaldir: “Eğer tövbe ederseniz anaparalarınız sizindir” (Bakara 2:279). Mümkünse faizi almayın. Banka zorla veriyorsa alıp hayra vererek ondan kurtulmalısınız; onu tutmak ve herhangi bir şekilde ondan faydalanmak caiz değildir.',
              },
              ...iq(20695),
            },
            {
              q: { az: 'Faizli mənzil krediti ilə ev almaq olarmı?', en: 'Can I buy a house with an interest-based mortgage?', ru: 'Можно ли купить дом по ипотеке с процентами?', ar: 'هل يجوز شراء بيت بقرض عقاري ربوي؟', tr: 'Faizli konut kredisiyle ev almak caiz mi?' },
              a: {
                az: 'Xeyr. Belə mənzil krediti faizli borc üzərində qurulmuş haram riba müamiləsidir; onunla ev və ya dükan almaq nə müsəlman ölkələrində, nə də qeyri-müsəlman ölkələrində caizdir. Ev ehtiyacı kirayə ilə ödənilə bilər.',
                en: 'No. A mortgage is a forbidden riba transaction based on an interest-bearing loan; it is not permissible to buy a house or shop with it, in Muslim or non-Muslim countries. The need for housing can be met by renting.',
                ru: 'Нет. Ипотека — запретная ростовщическая сделка, основанная на кредите под проценты; покупать с её помощью дом или магазин нельзя ни в мусульманских, ни в немусульманских странах. Потребность в жилье можно восполнить арендой.',
                ar: 'لا يجوز؛ فالرهن العقاري معاملة ربوية محرمة قائمة على قرض بفائدة، ولا يجوز شراء البيوت أو المحلات به لا في بلاد المسلمين ولا في غيرها، والحاجة إلى السكن تندفع بالاستئجار.',
                tr: 'Hayır. Konut kredisi (ipotek) faizli borca dayanan haram bir riba muamelesidir; onunla ev veya dükkân almak ne Müslüman ülkelerde ne de gayrimüslim ülkelerde caizdir. Konut ihtiyacı kirayla karşılanabilir.',
              },
              ...iq(159213),
            },
            {
              q: { az: 'Faizli bankda (məs. kompüter sistemləri üzrə) işləmək olarmı?', en: 'May I work in an interest-based bank (e.g. in computer systems)?', ru: 'Можно ли работать в банке, основанном на процентах (например, специалистом по компьютерным системам)?', ar: 'هل يجوز العمل في بنك ربوي ولو في الحاسب الآلي؟', tr: 'Faizli bir bankada (ör. bilgisayar sistemlerinde) çalışmak caiz mi?' },
              a: {
                az: 'Xeyr. Faizli banklarda işləmək ümumiyyətlə caiz deyil, çünki bu, ribanı yemək, yazmaq, ona şahid olmaq və ya bunu edənlərə kömək etməkdir; Peyğəmbər ﷺ ribanı yeyəni, yedirəni, yazanı və şahidlərini lənətləyib (Müslim, Cabir hədisi). Daimi Komitəyə görə sürücü və ya mühafizəçi kimi işləmək də caiz deyil, çünki bu, onların işinə xidmət etməkdir.',
                en: 'No. Working in riba-based banks is not permissible at all, because it involves consuming riba, writing it, witnessing it or helping those who do so; the Prophet ﷺ cursed the one who consumes riba, the one who pays it, the one who writes it and its witnesses (Muslim, hadith of Jabir). According to the Permanent Committee even working as a driver or guard is not allowed, since it serves their business.',
                ru: 'Нет. Работать в ростовщических банках вообще нельзя, поскольку это поедание рибы, её запись, свидетельство при ней или помощь тем, кто этим занимается; Пророк ﷺ проклял того, кто ест рибу, кто её платит, кто записывает её и свидетелей при ней (Муслим, хадис Джабира). Согласно Постоянному комитету, нельзя работать даже водителем или охранником, потому что это служение их делу.',
                ar: 'لا يجوز العمل في البنوك الربوية مطلقًا؛ لأنه أكل للربا أو كتابة له أو شهادة عليه أو إعانة لأهله، وقد لعن النبي ﷺ آكل الربا وموكله وكاتبه وشاهديه (مسلم من حديث جابر). وأفتت اللجنة الدائمة بأنه لا يجوز العمل فيها ولو سائقًا أو حارسًا لأنه خدمة لمصالحها.',
                tr: 'Hayır. Faizli bankalarda çalışmak hiçbir şekilde caiz değildir; çünkü bu, ribayı yemek, yazmak, ona şahit olmak veya bunları yapanlara yardım etmektir ve Peygamber ﷺ ribayı yiyene, yedirene, yazana ve şahitlerine lanet etmiştir (Müslim, Câbir hadisi). Daimi Komite’ye göre şoför veya güvenlik görevlisi olarak çalışmak da caiz değildir, çünkü bu onların işine hizmettir.',
              },
              ...iq(26771),
            },
            {
              q: { az: 'Avtomobil sığortası etdirmək olarmı?', en: 'Is car insurance permissible?', ru: 'Допустимо ли страхование автомобиля?', ar: 'هل يجوز التأمين على السيارة؟', tr: 'Araba sigortası yaptırmak caiz mi?' },
              a: {
                az: 'Kommersiya sığortası qeyri-müəyyənlik (ğərər) və insanların malını haqsız yemək üzərində qurulduğu üçün haramdır; fiqh şuralarının əksəriyyəti də ixtiyari kommersiya sığortasını qadağan edir. Amma qanunla məcburidirsə və seçim yoxdursa, onu etdirmək caizdir, günah isə məcbur edənin üzərinədir.',
                en: 'Commercial insurance is forbidden because it is based on uncertainty (gharar) and consuming people’s wealth unlawfully; most fiqh councils forbid optional commercial insurance. But if it is compulsory by law and there is no choice, it is permissible to take it, and the sin is on those who impose it.',
                ru: 'Коммерческое страхование запрещено, так как основано на неопределённости (гарар) и незаконном присвоении чужого имущества; большинство советов по фикху запрещают добровольное коммерческое страхование. Но если оно обязательно по закону и выбора нет, его оформить дозволено, а грех лежит на тех, кто принуждает.',
                ar: 'التأمين التجاري محرم لقيامه على الغرر وأكل أموال الناس بالباطل، وأكثر المجامع الفقهية على تحريمه إذا كان اختياريًا. أما إذا كان إلزاميًا لا خيار فيه فيجوز، والإثم على من ألزم به.',
                tr: 'Ticari sigorta belirsizlik (garar) ve insanların malını haksız yere yemek üzerine kurulu olduğu için haramdır; fıkıh konseylerinin çoğu da ihtiyari ticari sigortayı yasaklar. Ancak kanunen zorunluysa ve seçenek yoksa yaptırmak caizdir, günah ise zorlayanın üzerindedir.',
              },
              ...iq(102969),
            },
            {
              q: { az: 'Borcu vaxtında ödəyəcəyimə əminəmsə, kredit kartından istifadə edə bilərəmmi?', en: 'Can I use a credit card if I am sure I will pay on time?', ru: 'Можно ли пользоваться кредитной картой, если я уверен, что погашу долг вовремя?', ar: 'هل يجوز استعمال بطاقة الائتمان إذا كنت متأكدًا من السداد في المهلة؟', tr: 'Borcu zamanında ödeyeceğimden eminsem kredi kartı kullanabilir miyim?' },
              a: {
                az: 'Xeyr, vaxtında ödəyəcəyinə əmin olsa belə istifadəsi haramdır. Çünki müqavilə gecikmə halında faiz ödəməyi öhdəliyə alır — müsəlmanın Allahın haram etdiyi şeyi öhdəsinə götürməsi caiz deyil; illik haqq da bir növ ribadır. Üstəlik insan vaxtında ödəyəcəyini düşünə bilər, amma ona mane olan bir şey baş verər.',
                en: 'No, using it is forbidden even if one is sure of paying on time. The contract commits him to paying interest in case of delay — a Muslim may not commit himself to what Allah has forbidden — and the annual fee is itself a kind of riba. Moreover, one may intend to pay on time and then something prevents it.',
                ru: 'Нет, пользоваться ею запрещено, даже если человек уверен, что заплатит вовремя. Договор обязывает платить проценты при просрочке — а мусульманину нельзя брать на себя обязательство совершить то, что запретил Аллах; годовая плата — тоже вид рибы. К тому же человек может намереваться платить вовремя, но что-то ему помешает.',
                ar: 'لا يجوز استعمالها ولو تيقن السداد في المهلة؛ لأن العقد يتضمن التزامه بدفع الفائدة عند التأخر، ولا يجوز للمسلم أن يلتزم بما حرم الله، ورسوم البطاقة السنوية نوع من الربا. ثم قد يعزم على السداد في الوقت فيطرأ ما يمنعه.',
                tr: 'Hayır, zamanında ödeyeceğinden emin olsa bile kullanması haramdır. Çünkü sözleşme gecikme hâlinde faiz ödemeyi taahhüt ettirir — Müslümanın Allah’ın haram kıldığı bir şeyi taahhüt etmesi caiz değildir — ve yıllık ücret de bir tür ribadır. Üstelik kişi zamanında ödemeye niyet eder ama ona engel olan bir şey çıkabilir.',
              },
              ...iq(13725),
            },
            {
              q: { az: 'Şirkətlərin səhmlərini almaq olarmı?', en: 'Is it permissible to buy company shares?', ru: 'Можно ли покупать акции компаний?', ar: 'هل يجوز شراء أسهم الشركات؟', tr: 'Şirket hisseleri almak caiz mi?' },
              a: {
                az: 'Əsas qayda: haram işlərlə (riba və s.) məşğul olmayan şirkətin səhmini almaq caizdir — bunlar «təmiz» şirkətlərdir. Fəaliyyəti haram olan şirkətlərin (faizli bank, kommersiya sığortası, içki zavodları və s.) səhmləri haramdır. Əsas fəaliyyəti halal olub faizlə borc alıb-verən «qarışıq» şirkətlərdə isə alimlər ixtilaf edib; ən doğru rəyə görə onların səhmini almaq, onlara sərmayə qoymaq haramdır.',
                en: 'The basic rule: it is permissible to hold shares in a company that does not deal in haram things such as riba — these are “clean” companies. Shares in companies whose activity is haram (interest-based banks, commercial insurance, breweries, etc.) are forbidden. On “mixed” companies, whose main business is permissible but which borrow or lend on interest, scholars differed; the most correct view is that buying or investing in their shares is haram.',
                ru: 'Основное правило: дозволено владеть акциями компании, не занимающейся запретным (риба и т. п.), — это «чистые» компании. Акции компаний с запретной деятельностью (ростовщические банки, коммерческое страхование, производство спиртного и т. п.) запрещены. О «смешанных» компаниях, чья основная деятельность дозволена, но которые берут или дают в долг под проценты, учёные разошлись; самое верное мнение — покупать их акции и вкладываться в них запрещено.',
                ar: 'الأصل جواز تملك أسهم الشركات التي لا تتعامل بالمحرمات كالربا، وهي الشركات «النقية». وأما الشركات ذات النشاط المحرم كالبنوك الربوية والتأمين التجاري ومصانع الخمور فلا يجوز تملك أسهمها. واختلف المعاصرون في الشركات «المختلطة» التي أصل نشاطها مباح لكنها تقترض أو تودع بالربا، والأصح تحريم المساهمة فيها والاستثمار فيها.',
                tr: 'Temel kural: riba gibi haramlarla iş yapmayan şirketin hissesine sahip olmak caizdir — bunlar “temiz” şirketlerdir. Faaliyeti haram olan şirketlerin (faizli banka, ticari sigorta, içki üretimi vb.) hisseleri haramdır. Ana faaliyeti helal olup faizle borç alan veya veren “karma” şirketlerde ise âlimler ihtilaf etmiştir; en doğru görüşe göre bunların hissesini almak ve onlara yatırım yapmak haramdır.',
              },
              ...iq(112445),
            },
            {
              q: { az: 'Nisyə (taksitlə) satışda qiyməti nağddan baha etmək olarmı?', en: 'Is it permissible to charge more when selling in instalments?', ru: 'Можно ли при продаже в рассрочку назначать цену выше, чем за наличные?', ar: 'هل يجوز أن يكون ثمن البيع بالتقسيط أكثر من ثمن النقد؟', tr: 'Taksitli satışta fiyatı peşin fiyattan yüksek tutmak caiz mi?' },
              a: {
                az: 'Bəli, taksitlə satışda qiymət nağddan çox ola bilər, amma müqavilə anında tərəflər nağd və ya taksitdən birini qəti seçməlidir. Faizi müddətə görə ayrıca maddə kimi yazmaq caiz deyil. Alıcı gecikərsə, ondan əlavə pul almaq — şərt qoyulsa da, qoyulmasa da — ribadır. Amma müqavilədə «bir neçə hissə gecikdirilsə, qalan borc dərhal ödənilir» şərtini qoymaq olar.',
                en: 'Yes, the instalment price may be higher than the cash price, but the parties must decide definitely on cash or instalments at the time of the contract. It is not permissible to state interest as a separate item based on time. If the buyer is late, charging him extra — whether stipulated or not — is riba. But it may be stipulated that if some instalments are delayed, the remaining debt becomes due at once.',
                ru: 'Да, цена в рассрочку может быть выше цены за наличные, но стороны должны при заключении сделки точно выбрать: наличные или рассрочка. Указывать процент отдельной статьёй в зависимости от срока нельзя. Если покупатель задерживает платёж, брать с него доплату — с условием или без — это риба. Но можно условиться, что при просрочке нескольких платежей оставшийся долг подлежит немедленной уплате.',
                ar: 'يجوز أن يكون ثمن البيع بالتقسيط أكثر من الثمن الحالّ، بشرط أن يجزم المتبايعان عند العقد بالنقد أو بالتقسيط، ولا يجوز ذكر فائدة مستقلة مرتبطة بالأجل. ولا يجوز إلزام المشتري المتأخر بزيادة، سواء شُرطت أم لا؛ لأنها ربا. ويجوز اشتراط حلول بقية الأقساط إذا تأخر في بعضها.',
                tr: 'Evet, taksitli fiyat peşin fiyattan yüksek olabilir, ancak taraflar akit anında peşin veya taksitten birini kesin olarak seçmelidir. Faizi süreye bağlı ayrı bir kalem olarak yazmak caiz değildir. Alıcı gecikirse ondan fazladan para almak — şart koşulsun koşulmasın — ribadır. Ancak sözleşmede “bazı taksitler gecikirse kalan borç hemen ödenir” şartı konulabilir.',
              },
              ...iq(1847),
            },
          ],
        },
      ],
    },

    // ───────────────────────── YEMƏK VƏ GEYİM ─────────────────────────
    {
      id: 'food-dress',
      title: { az: 'Yemək, içki və geyim', en: 'Food, drink and clothing', ru: 'Еда, напитки и одежда', ar: 'الأطعمة والأشربة واللباس', tr: 'Yiyecek, içecek ve giyim' },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Yeməkdə əsas qayda halallıqdır, haramlar isə dəlillə müəyyən olunub. Qadın geyimi və hicab ayrıca «Hicab» dərsindədir.',
            en: 'The basic rule in food is permissibility, and the prohibitions are established by evidence. Women’s dress and hijab are covered in the separate “Hijab” lesson.',
            ru: 'Основное правило в пище — дозволенность, а запреты установлены доводами. Женская одежда и хиджаб разобраны в отдельном уроке «Хиджаб».',
            ar: 'الأصل في الأطعمة الحل، والمحرمات ثابتة بالدليل. ولباس المرأة وحجابها في درس «الحجاب».',
            tr: 'Yiyeceklerde asıl olan helalliktir, haramlar ise delille belirlenmiştir. Kadın giyimi ve tesettür ayrı “Tesettür” dersindedir.',
          },
        },
        {
          t: 'qa',
          items: [
            {
              q: { az: 'Xristian və ya yəhudinin kəsdiyi əti yemək olarmı?', en: 'May I eat meat slaughtered by Christians or Jews?', ru: 'Можно ли есть мясо, заколотое христианами или иудеями?', ar: 'هل يجوز أكل ذبائح اليهود والنصارى؟', tr: 'Hristiyan veya Yahudinin kestiği eti yemek caiz mi?' },
              a: {
                az: 'İki şərtlə: 1) heyvan müsəlmanın kəsdiyi kimi — boğazı və qida borusu kəsilib qan axıdılaraq — kəsilib; boğmaq, cərəyan vurmaq, suda batırmaqla öldürülən ət halal deyil; 2) üzərində Allahdan başqasının (məs. Məsihin) adı çəkilməyib. Adın çəkilib-çəkilmədiyi bilinmirsə, «Bismillah» deyib yemək olar (Buxari 2057); necə kəsildiyini soruşmaq vacib deyil.',
                en: 'With two conditions: 1) the animal is slaughtered as a Muslim does — cutting the throat and oesophagus and letting the blood flow; meat killed by strangling, electric shock or drowning is not lawful; 2) no name other than Allah’s (e.g. the Messiah) is mentioned over it. If it is unknown whether Allah’s name was mentioned, say “Bismillah” and eat (al-Bukhari 2057); there is no need to ask how it was slaughtered.',
                ru: 'При двух условиях: 1) животное заколото так, как это делает мусульманин, — перерезаны горло и пищевод и выпущена кровь; мясо животного, убитого удушением, током или утоплением, недозволено; 2) над ним не произнесено иное имя, кроме имени Аллаха (например, Мессии). Если неизвестно, произнесено ли имя Аллаха, скажи «Бисмиллях» и ешь (аль-Бухари 2057); расспрашивать, как его закололи, не нужно.',
                ar: 'تحل ذبائحهم بشرطين: أن تُذبح كما يذبح المسلم بقطع الحلقوم والمريء وإنهار الدم، فما قُتل خنقًا أو صعقًا أو غرقًا لا يحل؛ وألا يُذكر عليها اسم غير الله كاسم المسيح. وإذا لم يُعلم هل سُمّي عليها أم لا، فليسمِّ الآكل ويأكل (البخاري 2057)، ولا يلزم السؤال عن كيفية الذبح.',
                tr: 'İki şartla: 1) hayvan Müslümanın kestiği gibi — boğazı ve yemek borusu kesilip kanı akıtılarak — kesilmiş olmalı; boğularak, elektrikle veya suda boğularak öldürülenin eti helal değildir; 2) üzerine Allah’tan başkasının (ör. Mesih’in) adı anılmamış olmalı. Allah’ın adının anılıp anılmadığı bilinmiyorsa “Bismillah” deyip yenir (Buhârî 2057); nasıl kesildiğini sormak gerekmez.',
              },
              ...iq(88206),
            },
            {
              q: { az: 'Tərkibində jelatin olan qidalar halaldırmı?', en: 'Are foods containing gelatin halal?', ru: 'Дозволены ли продукты с желатином?', ar: 'هل الأطعمة التي فيها الجيلاتين حلال؟', tr: 'İçinde jelatin olan yiyecekler helal mi?' },
              a: {
                az: 'Şəri qaydada kəsilmiş halal heyvanlardan və ya zərərsiz bitkilərdən alınan jelatin halaldır. Donuzdan və ya şəri qaydada kəsilməmiş heyvandan jelatin almaq isə caiz deyil. Belə jelatinin hökmü onun tam başqa maddəyə çevrilib-çevrilməməsindən (istihalə) asılıdır və mütəxəssislər bu barədə ixtilaf edir; fətvanın nəticəsi budur ki, donuz dərisindən və ya nəcis maddədən alınmış jelatinli qida, içki və dərmanları istifadə etmək caiz deyil.',
                en: 'Gelatin from permissible animals slaughtered in the Shar‘i way, or from harmless plants, is halal. Extracting gelatin from pigs or from animals not slaughtered properly is not permissible. The ruling on such gelatin depends on whether it is completely transformed into another substance (istihalah), and specialists differ about this; the fatwa concludes that foods, drinks and medicines containing gelatin derived from pigskin or other impure substances may not be consumed.',
                ru: 'Желатин из дозволенных животных, заколотых по шариату, или из безвредных растений дозволен. Получать желатин из свиней или из животных, заколотых не по шариату, нельзя. Положение такого желатина зависит от того, превратился ли он полностью в другое вещество (истихаля), и специалисты здесь расходятся; вывод фетвы: продукты, напитки и лекарства с желатином из свиной кожи или иных нечистых веществ употреблять нельзя.',
                ar: 'الجيلاتين المستخرج من الحيوانات المباحة المذكاة ذكاة شرعية أو من النباتات غير الضارة حلال، ولا يجوز استخراجه من الخنزير أو مما لم يُذكَّ ذكاة شرعية. والحكم في المستخرج من ذلك مبني على تحقق الاستحالة التامة، وقد اختلف المختصون فيها، وخلصت الفتوى إلى أنه لا يجوز تناول الأطعمة والأشربة والأدوية التي فيها جيلاتين مستخرج من جلد الخنزير أو غيره من النجاسات.',
                tr: 'Şer‘î usulle kesilmiş helal hayvanlardan veya zararsız bitkilerden elde edilen jelatin helaldir. Domuzdan veya usulüne göre kesilmemiş hayvandan jelatin elde etmek caiz değildir. Böyle jelatinin hükmü onun tamamen başka bir maddeye dönüşüp dönüşmediğine (istihale) bağlıdır ve uzmanlar bunda ihtilaf eder; fetvanın vardığı sonuç, domuz derisinden veya necis maddelerden elde edilmiş jelatinli yiyecek, içecek ve ilaçların kullanılmasının caiz olmadığıdır.',
              },
              ...iq(219137),
            },
            {
              q: { az: 'Tərkibində spirt olan qida, dərman və ətirlərin hökmü nədir?', en: 'What is the ruling on food, medicine and perfume containing alcohol?', ru: 'Каково положение пищи, лекарств и духов, содержащих спирт?', ar: 'ما حكم الأطعمة والأدوية والعطور التي فيها كحول؟', tr: 'İçinde alkol bulunan yiyecek, ilaç ve parfümlerin hükmü nedir?' },
              a: {
                az: 'Qida və dərmana qatılan spirtin aşkar təsiri varsa, onu qatmaq da, istifadə etmək də haramdır; heç bir təsiri qalmırsa, istifadəsi caizdir. Doğru rəyə görə spirt fiziki mənada nəcis deyil. Spirtli ətirlər barədə İbn Useymin deyir: ehtiyat onlardan çəkinməyi tələb edir, amma onların haram olduğunu qəti deyə bilmərik, çünki qadağanın səbəbi içməkdədir.',
                en: 'If alcohol added to food or medicine has a clear effect, adding it and using the product are haram; if no effect remains, it is permissible. According to the correct view, alcohol is not physically impure. About alcohol-based perfumes Ibn Uthaymin said: prudence calls for avoiding them, but we cannot say definitively that they are haram, since the reason for the prohibition lies in drinking.',
                ru: 'Если спирт, добавленный в пищу или лекарство, оказывает явное действие, добавлять его и употреблять продукт запрещено; если никакого действия не остаётся, это дозволено. По правильному мнению, спирт не является нечистым физически. О спиртосодержащих духах ибн Усеймин сказал: осторожность требует их избегать, но мы не можем однозначно назвать их запретными, поскольку причина запрета — в питье.',
                ar: 'إن كان للكحول المضاف إلى الطعام أو الدواء أثر ظاهر حرمت إضافته وحرم تناوله، وإن لم يبق له أثر جاز. والصحيح أن الكحول ليس نجسًا نجاسة حسية. وأما العطور الكحولية فقال ابن عثيمين: الاحتياط اجتنابها، لكن لا نجزم بتحريم استعمالها؛ لأن علة الأمر بالاجتناب إنما تظهر في الشرب.',
                tr: 'Yiyecek veya ilaca katılan alkolün açık bir etkisi varsa onu katmak da kullanmak da haramdır; hiçbir etkisi kalmıyorsa kullanmak caizdir. Doğru görüşe göre alkol fiziksel anlamda necis değildir. Alkollü parfümler hakkında İbn Useymin şöyle der: ihtiyat onlardan kaçınmayı gerektirir, ancak haram olduklarını kesin olarak söyleyemeyiz, çünkü yasağın sebebi içmektedir.',
              },
              ...iq(59899),
            },
            {
              q: { az: 'Kişinin şalvarı və ya paltarı topuqdan aşağı olarsa, günahdırmı?', en: 'Is it a sin for a man to wear trousers or garments below the ankles?', ru: 'Грешно ли мужчине носить брюки или одежду ниже щиколоток?', ar: 'هل إسبال الثوب أو البنطال تحت الكعبين حرام على الرجل؟', tr: 'Erkeğin pantolonu veya elbisesi topuktan aşağı olursa günah mıdır?' },
              a: {
                az: 'Bəli, kişi üçün paltarı topuqdan aşağı salmaq (isbal) qadağandır. Peyğəmbər ﷺ demişdir: «İzarın topuqdan aşağı olan hissəsi Oddadır» (Buxari 5787). Kim bunu təkəbbürlə yerə sürüyərsə, Qiyamət günü Allah ona baxmaz — bu daha ağır haldır.',
                en: 'Yes, letting garments hang below the ankles (isbal) is forbidden for men. The Prophet ﷺ said: “Whatever of the lower garment is below the ankles is in the Fire” (al-Bukhari 5787). Whoever drags it out of arrogance, Allah will not look at him on the Day of Resurrection — a graver case.',
                ru: 'Да, мужчине запрещено опускать одежду ниже щиколоток (исбаль). Пророк ﷺ сказал: «То, что из изара ниже щиколоток, — в Огне» (аль-Бухари 5787). А на того, кто волочит её из высокомерия, Аллах не взглянет в Судный день — это ещё тяжелее.',
                ar: 'نعم، الإسبال محرم على الرجال؛ لقول النبي ﷺ: «ما أسفل من الكعبين من الإزار ففي النار» (البخاري 5787). ومن جره خيلاء لم ينظر الله إليه يوم القيامة، وهذا أشد.',
                tr: 'Evet, erkeğin elbisesini topuktan aşağı salması (isbal) yasaktır. Peygamber ﷺ şöyle demiştir: “İzarın topuktan aşağıda kalan kısmı ateştedir” (Buhârî 5787). Kim onu kibirle yerde sürürse Kıyamet günü Allah ona bakmaz — bu daha ağır bir durumdur.',
              },
              ...iq(762),
            },
            {
              q: { az: 'Saqqalı qırxmaq olarmı?', en: 'Is it permissible to shave the beard?', ru: 'Можно ли брить бороду?', ar: 'هل يجوز حلق اللحية؟', tr: 'Sakalı tıraş etmek caiz mi?' },
              a: {
                az: 'Xeyr, saqqalı qırxmaq haramdır. Peyğəmbər ﷺ demişdir: «Müşriklərə müxalif olun: saqqalları buraxın, bığları qısaldın» (Buxari 5892, Müslim). İbn Hazm bığı qısaltmağın və saqqalı buraxmağın vacib olduğunda icma nəql edib. Kafirlərə bənzəməyi qadağan edən ümumi dəlillər də buna dəlalət edir.',
                en: 'No, shaving the beard is haram. The Prophet ﷺ said: “Be different from the polytheists: let your beards grow and trim your moustaches” (al-Bukhari 5892, Muslim). Ibn Hazm reported consensus that trimming the moustache and letting the beard grow is obligatory. The general texts forbidding imitation of the disbelievers also indicate this.',
                ru: 'Нет, брить бороду запрещено. Пророк ﷺ сказал: «Отличайтесь от многобожников: отпускайте бороды и подстригайте усы» (аль-Бухари 5892, Муслим). Ибн Хазм передал единогласное мнение о том, что подстригать усы и отпускать бороду обязательно. На это указывают и общие тексты, запрещающие уподобляться неверующим.',
                ar: 'حلق اللحية حرام؛ لقول النبي ﷺ: «خالفوا المشركين: وفّروا اللحى وأحفوا الشوارب» (البخاري 5892، ومسلم). ونقل ابن حزم الإجماع على وجوب قص الشارب وإعفاء اللحية، ويدل عليه أيضًا عموم النصوص في النهي عن التشبه بالكفار.',
                tr: 'Hayır, sakalı tıraş etmek haramdır. Peygamber ﷺ şöyle demiştir: “Müşriklere muhalefet edin: sakalları salın, bıyıkları kısaltın” (Buhârî 5892, Müslim). İbn Hazm bıyığı kısaltmanın ve sakalı salmanın vacip olduğunda icma nakletmiştir. Kâfirlere benzemeyi yasaklayan genel deliller de buna delalet eder.',
              },
              ...iq(1189),
            },
            {
              q: { az: 'Kişi gümüş üzük və ya zəncir taxa bilərmi?', en: 'May a man wear a silver ring or chain?', ru: 'Может ли мужчина носить серебряное кольцо или цепочку?', ar: 'هل يجوز للرجل لبس خاتم أو سلسلة من الفضة؟', tr: 'Erkek gümüş yüzük veya zincir takabilir mi?' },
              a: {
                az: 'Gümüş üzük taxmaq caizdir: Peyğəmbərin ﷺ gümüş üzüyü olub, üzərində «Muhəmməd Rəsulullah» yazılmışdı (Buxari, Müslim); İbn Teymiyyə bunun imamların icması ilə caiz olduğunu deyib. Qızıl üzük isə dörd imamın icması ilə kişilərə haramdır. Kişinin boyunbağı və zəncir taxması isə caiz deyil.',
                en: 'Wearing a silver ring is permissible: the Prophet ﷺ had a silver ring engraved “Muhammad the Messenger of Allah” (al-Bukhari, Muslim); Ibn Taymiyyah said it is permissible by consensus of the imams. Gold rings are forbidden to men by consensus of the four imams. Men may not wear necklaces and chains.',
                ru: 'Носить серебряное кольцо дозволено: у Пророка ﷺ было серебряное кольцо с надписью «Мухаммад — посланник Аллаха» (аль-Бухари, Муслим); ибн Таймия сказал, что это дозволено по единогласному мнению имамов. Золотые кольца запрещены мужчинам по единогласному мнению четырёх имамов. Носить ожерелья и цепочки мужчинам нельзя.',
                ar: 'يجوز للرجل لبس خاتم الفضة؛ فقد اتخذ النبي ﷺ خاتمًا من فضة نقشه «محمد رسول الله» (البخاري ومسلم)، وقال ابن تيمية: خاتم الفضة مباح باتفاق الأئمة، بخلاف خاتم الذهب فهو محرم باتفاق الأئمة الأربعة. أما السلاسل والقلائد فلا يجوز للرجال لبسها.',
                tr: 'Gümüş yüzük takmak caizdir: Peygamber’in ﷺ üzerinde “Muhammed Resûlullah” yazılı gümüş bir yüzüğü vardı (Buhârî, Müslim); İbn Teymiyye bunun imamların ittifakıyla caiz olduğunu söyler. Altın yüzük ise dört imamın ittifakıyla erkeklere haramdır. Erkeğin kolye ve zincir takması caiz değildir.',
              },
              ...iq(6697),
            },
          ],
        },
      ],
    },

    // ───────────────────────── GÜNDƏLİK HƏYAT ─────────────────────────
    {
      id: 'daily',
      title: { az: 'Gündəlik həyat', en: 'Everyday life', ru: 'Повседневная жизнь', ar: 'الحياة اليومية', tr: 'Günlük hayat' },
      blocks: [
        {
          t: 'p',
          text: {
            // lang-ok[siqaret]: Azərbaycan dilində düzgün sözdür (türkcə "sigara")
            az: 'Mövlud, Rəğaib gecəsi kimi dini bidətlər ayrıca «Bidət» dərsində izah olunur. Burada musiqi, siqaret, it saxlamaq, əl vermək və bayramlar kimi gündəlik suallar var.',
            en: 'Religious innovations such as the Mawlid or the Raghaib night are explained in the separate “Bid‘ah” lesson. Here are everyday questions about music, smoking, keeping dogs, handshakes and festivals.',
            ru: 'Религиозные нововведения, такие как Мавлид или ночь Рагаиб, разобраны в отдельном уроке «Бида». Здесь — повседневные вопросы о музыке, курении, содержании собак, рукопожатии и праздниках.',
            ar: 'البدع كالمولد وليلة الرغائب مشروحة في درس «البدعة»، وهنا أسئلة يومية عن المعازف والتدخين واقتناء الكلاب والمصافحة والأعياد.',
            tr: 'Mevlid, Regaib gecesi gibi dinî bid‘atler ayrı “Bid‘at” dersinde açıklanmıştır. Burada müzik, sigara, köpek beslemek, tokalaşma ve bayramlarla ilgili günlük sorular var.',
          },
        },
        {
          t: 'qa',
          items: [
            {
              q: { az: 'Musiqi haramdırmı?', en: 'Is music haram?', ru: 'Запрещена ли музыка?', ar: 'هل المعازف والموسيقى حرام؟', tr: 'Müzik haram mı?' },
              a: {
                az: 'Musiqi alətləri (məazif) və onlarla oxunan mahnılar Quran və Sünnənin dəlilləri ilə haramdır. İstisna — qadınların bayramlarda və toylarda zınqırovsuz dəf çalmasıdır; bu, səhih rəvayətlərlə sabitdir.',
                en: 'Musical instruments (ma‘azif) and singing with them are haram according to evidence from the Quran and Sunnah. The exception is the daff without jingles, played by women at Eids and weddings; this is established by sahih reports.',
                ru: 'Музыкальные инструменты (маазиф) и пение под них запрещены согласно доводам Корана и Сунны. Исключение — бубен (дафф) без колокольчиков, на котором играют женщины в праздники и на свадьбах; это подтверждено достоверными сообщениями.',
                ar: 'المعازف والغناء المصاحب لها محرمة بأدلة الكتاب والسنة، ويُستثنى الدف بلا جلاجل للنساء في الأعياد والأعراس؛ لثبوته في الأحاديث الصحيحة.',
                tr: 'Müzik aletleri (meâzif) ve onlarla söylenen şarkılar Kur’an ve Sünnet delilleriyle haramdır. İstisna, kadınların bayramlarda ve düğünlerde çıngıraksız def çalmasıdır; bu sahih rivayetlerle sabittir.',
              },
              ...iq(5000),
            },
            {
              // lang-ok[Siqaret]: Azərbaycan dilində düzgün sözdür (türkcə "sigara")
              q: { az: 'Siqaret çəkmək haramdırmı?', en: 'Is smoking haram?', ru: 'Запрещено ли курение?', ar: 'هل التدخين حرام؟', tr: 'Sigara içmek haram mı?' },
              a: {
                // lang-ok[siqaretin]: Azərbaycan dilində düzgün sözdür (türkcə "sigara")
                az: 'Bəli. Allah təmiz şeyləri halal, murdar şeyləri (xəbais) haram edib (Əraf 7:157); həkimlər siqaretin ciddi zərərli olduğunda razıdır. Ona görə siqaret çəkmək, onu almaq, satmaq və başqasına təklif etmək caiz deyil.',
                en: 'Yes. Allah made good things lawful and evil things (khaba’ith) unlawful (al-A‘raf 7:157), and physicians agree that smoking is seriously harmful. So it is not permissible to smoke, buy, sell or offer cigarettes to others.',
                ru: 'Да. Аллах дозволил благое и запретил скверное (хабаис) (аль-Аараф 7:157), а врачи единодушны в том, что курение серьёзно вредно. Поэтому курить, покупать, продавать сигареты и угощать ими других нельзя.',
                ar: 'نعم؛ فقد أحل الله الطيبات وحرم الخبائث [الأعراف: 157]، والأطباء متفقون على ضرر التدخين الكبير، فلا يجوز تعاطيه ولا بيعه ولا شراؤه ولا تقديمه للآخرين.',
                tr: 'Evet. Allah temiz şeyleri helal, pis şeyleri (habâis) haram kılmıştır (A‘râf 7:157); doktorlar da sigaranın ciddi zararlı olduğunda hemfikirdir. Bu yüzden sigara içmek, almak, satmak ve başkasına ikram etmek caiz değildir.',
              },
              ...iq(110),
            },
            {
              q: { az: 'Evdə it saxlamaq olarmı?', en: 'May I keep a dog?', ru: 'Можно ли держать собаку?', ar: 'هل يجوز اقتناء الكلب؟', tr: 'Köpek beslemek caiz mi?' },
              a: {
                az: 'İt saxlamaq ov, mal-qara və ya əkin mühafizəsi istisna olmaqla caiz deyil; saxlayan hər gün savabından bir və ya iki qirat itirir. Evi qorumaq üçün it saxlamaq isə şəhərdən kənarda olduqda və başqa mühafizə vasitəsi olmadıqda caizdir. İti öpmək, ağzına toxunmaq kimi başqalarını təqlid etməkdən çəkinmək lazımdır.',
                en: 'Keeping a dog is not permissible except for hunting or guarding livestock or crops; whoever keeps one loses one or two qirats of reward every day. Keeping a dog to guard a house is permissible if it is outside the city and there is no other means of protection. One should avoid imitating others by kissing dogs or touching their mouths.',
                ru: 'Держать собаку нельзя, кроме как для охоты или охраны скота и посевов; тот, кто держит её, ежедневно теряет один или два кирата награды. Держать собаку для охраны дома дозволено, если дом за городом и нет иных средств охраны. Следует избегать подражания другим — целовать собаку, касаться её пасти.',
                ar: 'لا يجوز اقتناء الكلب إلا لصيد أو حراسة ماشية أو زرع، ومن اقتناه لغير ذلك نقص من أجره كل يوم قيراط أو قيراطان. ويجوز اقتناؤه لحراسة البيوت إذا كانت خارج المدن ولم توجد وسيلة أخرى للحراسة. وينبغي ألا يقلّد المسلم غيره في تقبيل الكلب ومس فمه.',
                tr: 'Av, hayvan veya ekin koruma dışında köpek beslemek caiz değildir; besleyen her gün sevabından bir veya iki kırat kaybeder. Evi korumak için köpek beslemek ise şehir dışında olup başka koruma imkânı yoksa caizdir. Köpeği öpmek, ağzına dokunmak gibi başkalarını taklit etmekten kaçınmak gerekir.',
              },
              ...iq(69840),
            },
            {
              q: { az: 'Kişi naməhrəm qadınla əl görüşə bilərmi?', en: 'May a man shake hands with a non-mahram woman?', ru: 'Может ли мужчина пожимать руку чужой (не махрам) женщине?', ar: 'هل يجوز للرجل مصافحة المرأة الأجنبية؟', tr: 'Erkek namahrem bir kadınla tokalaşabilir mi?' },
              a: {
                az: 'Xeyr. Peyğəmbər ﷺ demişdir: «Birinizin başına dəmir iynə batırılması ona halal olmayan qadına toxunmasından xeyirlidir» (Təbərani, əl-Albani səhih sayıb). Paltar kimi bir maneə ilə əl vermək də caiz deyil və bu hökm yaşlı qadınlara da aiddir.',
                en: 'No. The Prophet ﷺ said: “For one of you to be stabbed in the head with an iron needle is better for him than to touch a woman who is not permissible for him” (al-Tabarani, graded sahih by al-Albani). Shaking hands through a barrier such as a garment is also not allowed, and the ruling includes elderly women.',
                ru: 'Нет. Пророк ﷺ сказал: «Пусть лучше голову одного из вас уколют железной иглой, чем он коснётся женщины, которая ему не дозволена» (ат-Табарани, аль-Албани назвал достоверным). Пожимать руку через преграду, например одежду, тоже нельзя, и это относится и к пожилым женщинам.',
                ar: 'لا يجوز؛ لقول النبي ﷺ: «لأن يُطعن في رأس أحدكم بمِخيط من حديد خير له من أن يمس امرأة لا تحل له» (الطبراني، وصححه الألباني). ولا تجوز المصافحة ولو من وراء حائل كالثوب، والحكم يشمل العجائز.',
                tr: 'Hayır. Peygamber ﷺ şöyle demiştir: “Birinizin başına demir bir iğne batırılması, kendisine helal olmayan bir kadına dokunmasından daha hayırlıdır” (Taberânî, Elbânî sahih saymıştır). Elbise gibi bir engelin üstünden tokalaşmak da caiz değildir ve hüküm yaşlı kadınları da kapsar.',
              },
              ...iq(21183),
            },
            {
              q: { az: 'Ad günü qeyd etmək olarmı?', en: 'Is it permissible to celebrate birthdays?', ru: 'Можно ли отмечать дни рождения?', ar: 'هل يجوز الاحتفال بأعياد الميلاد؟', tr: 'Doğum günü kutlamak caiz mi?' },
              a: {
                az: 'Quran və Sünnənin dəlilləri göstərir ki, ad günü qeyd etmək pak şəriətdə əsli olmayan bidətdir. Belə qeydlərə dəvəti qəbul etmək də caiz deyil, çünki bu, bidəti dəstəkləmək və təşviq etməkdir.',
                en: 'The evidence of the Quran and Sunnah indicates that celebrating birthdays is an innovation with no basis in the pure Shari‘ah. It is also not permissible to accept invitations to such celebrations, because that means supporting and encouraging the innovation.',
                ru: 'Доводы Корана и Сунны указывают, что празднование дня рождения — нововведение, не имеющее основы в чистом шариате. Принимать приглашения на такие празднования тоже нельзя, так как это поддержка и поощрение нововведения.',
                ar: 'دلت أدلة الكتاب والسنة على أن الاحتفال بأعياد الميلاد بدعة لا أصل لها في الشرع المطهر، ولا تجوز إجابة الدعوة إليها لما فيها من تأييد البدعة والتشجيع عليها.',
                tr: 'Kur’an ve Sünnet delilleri, doğum günü kutlamanın tertemiz şeriatta aslı olmayan bir bid‘at olduğunu gösterir. Bu tür kutlamalara daveti kabul etmek de caiz değildir, çünkü bu bid‘ati desteklemek ve teşvik etmektir.',
              },
              ...iq(1027),
            },
            {
              q: { az: 'Qeyri-müsəlmanları Milad kimi dini bayramları münasibətilə təbrik etmək olarmı?', en: 'May I congratulate non-Muslims on their religious festivals such as Christmas?', ru: 'Можно ли поздравлять немусульман с их религиозными праздниками, например Рождеством?', ar: 'هل يجوز تهنئة غير المسلمين بأعيادهم الدينية كعيد الميلاد؟', tr: 'Gayrimüslimleri Noel gibi dinî bayramlarından dolayı tebrik etmek caiz mi?' },
              a: {
                az: 'Xeyr. İbn Useymin və İbn Qeyyim bildirir ki, kafirləri yalnız onlara aid dini bayramları ilə təbrik etmək icma ilə haramdır, çünki bu, onların küfr ayinlərini qəbul etmək mənasını verir — insan özü onları qəbul etməsə belə. Onlar bizi bu bayramlarla təbrik etsələr, cavab vermirik; belə münasibətlərə dəvəti qəbul etmək isə daha pisdir.',
                en: 'No. Ibn Uthaymin and Ibn al-Qayyim stated that congratulating disbelievers on religious festivals that belong only to them is forbidden by consensus, because it implies approving of their rituals of disbelief — even if one does not accept them oneself. If they greet us on these festivals we do not respond, and accepting invitations to such occasions is worse.',
                ru: 'Нет. Ибн Усеймин и ибн аль-Каййим указали, что поздравлять неверующих с их сугубо религиозными праздниками запрещено единогласно, поскольку это означает одобрение их обрядов неверия, даже если сам человек их не принимает. Если они поздравляют нас с этими праздниками, мы не отвечаем; а принимать приглашения на такие события — ещё хуже.',
                ar: 'لا يجوز؛ قال ابن عثيمين، ونقل ابن القيم: تهنئة الكفار بشعائرهم وأعيادهم المختصة بهم حرام بالاتفاق؛ لما فيها من الإقرار والرضا بشعائر الكفر وإن لم يرضه لنفسه. وإذا هنؤونا بأعيادهم فلا نجيبهم على ذلك، وإجابة دعوتهم في هذه المناسبات أشد من التهنئة.',
                tr: 'Hayır. İbn Useymin ve İbnü’l-Kayyim, kâfirleri yalnız kendilerine ait dinî bayramlarından dolayı tebrik etmenin icma ile haram olduğunu bildirir; çünkü bu, kişi kendisi kabul etmese bile onların küfür ayinlerini onaylamak anlamına gelir. Onlar bizi bu bayramlarda tebrik ederse karşılık vermeyiz; bu vesilelerle yapılan davetleri kabul etmek ise daha kötüdür.',
              },
              ...iq(947),
            },
            {
              q: { az: 'Döymə (tatu) etdirmək haramdırmı?', en: 'Are tattoos haram?', ru: 'Запрещены ли татуировки?', ar: 'هل الوشم حرام؟', tr: 'Dövme yaptırmak haram mı?' },
              a: {
                az: 'Bəli, dəriyə iynə ilə boya yeridilən döymə, ağrı versin-verməsin, hər formada haramdır. Çünki bu, Allahın yaratdığını dəyişməkdir və Peyğəmbər ﷺ döymə edəni də, etdirəni də lənətləyib (Buxari, Müslim — İbn Məsud hədisi).',
                en: 'Yes, tattooing — piercing the skin with a needle and inserting dye — is haram in all forms, painful or not. It changes the creation of Allah, and the Prophet ﷺ cursed both the one who does tattoos and the one who has them done (al-Bukhari, Muslim — hadith of Ibn Mas‘ud).',
                ru: 'Да, татуировка — введение краски под кожу иглой — запрещена в любом виде, болезненна она или нет. Это изменение творения Аллаха, и Пророк ﷺ проклял и делающую татуировку, и ту, которой её делают (аль-Бухари, Муслим — хадис ибн Масуда).',
                ar: 'نعم، الوشم — وهو غرز الجلد بالإبرة وحشوه بالكحل أو غيره — محرم بجميع صوره، مؤلمًا كان أو غير مؤلم؛ لأنه تغيير لخلق الله، وقد لعن النبي ﷺ الواشمة والمستوشمة (البخاري ومسلم من حديث ابن مسعود).',
                tr: 'Evet, deriye iğneyle boya işlenen dövme, acı versin vermesin, her şekliyle haramdır. Çünkü bu, Allah’ın yarattığını değiştirmektir ve Peygamber ﷺ dövme yapana da yaptırana da lanet etmiştir (Buhârî, Müslim — İbn Mes‘ûd hadisi).',
              },
              ...iq(20283),
            },
          ],
        },
      ],
    },

  ],
  sources: [
    { label: 'İslam sual-cavab (islamqa.info) — cavablarda istinad olunan bütün fətvalar', url: 'https://islamqa.info/en' },
    { label: 'Məcmu fətava İbn Baz — Əbdüləziz ibn Baz' },
    { label: 'Fətava Ərkan əl-İslam; əş-Şərh əl-Mumti — Muhəmməd ibn Saleh əl-Useymin' },
    { label: 'Fətava əl-Ləcnə əd-Daimə — Daimi Fətva Komitəsi' },
    { label: 'əl-Muğni — İbn Qudamə' },
  ],
}
