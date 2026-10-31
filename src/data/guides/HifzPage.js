// ═══════════════════════════════════════════════════════
// HİFZ SƏHİFƏSİ (/hifz) — idarə panelinin mətnləri və "Necə əzbərləmək" bələdçisi.
//
// YOXLANILIB (2026-11-01):
// • Ayə — api.quran.com (uthmani): 54:17.
// • Hədislər — fawazahmed0/hadith-api: Buxari 5033 (Quranı təkrar edin —
//   dəvədən tez qaçır); Tirmizi 2914 (Tirmizi: «həsən səhih»).
// • Qalan addımlar dəlil iddiası olmayan praktik məsləhətdir (saytın öz
//   alətlərinə — gizlət/aç, qari ilə müqayisə, aralıqlı təkrar — uyğun).
// • TƏKRARLANMIR: Quran oxumağın ədəbi və fəziləti — /quran səhifəsinin
//   bələdçisində (orada Müslim 798, Tirmizi 2910 və s.). Burada keçid verilir.
// ═══════════════════════════════════════════════════════

import { localizeSource } from '../../utils/sourceNames.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const S = (s) => Object.fromEntries(LANGS.map(l => [l, localizeSource(s, l)]))

export const HIFZ_GUIDE = {
  hero: {
    lead: {
      az: 'Gündəlik plan, aralıqlı təkrar və irəliləyiş qrafikləri ilə Quranı əzbərləyin.',
      en: 'Memorise the Quran with a daily plan, spaced reviews and progress charts.',
      ru: 'Заучивайте Коран с ежедневным планом, интервальным повторением и графиками прогресса.',
      ar: 'احفظ القرآن بخطة يومية ومراجعة متباعدة ورسوم توضّح تقدّمك.',
      tr: 'Günlük plan, aralıklı tekrar ve ilerleme grafikleriyle Kur’an’ı ezberleyin.',
    },
    how: {
      az: 'Surə seçin, «Əzbərləməyə başla» düyməsini basın və hər ayədən sonra özünüzə qiymət verin — təkrar günü avtomatik təyin olunur.',
      en: 'Pick a surah, press “Start memorizing” and grade yourself after each ayah — the review day is set automatically.',
      ru: 'Выберите суру, нажмите «Начать заучивание» и оценивайте себя после каждого аята — день повторения назначится сам.',
      ar: 'اختر سورة واضغط «ابدأ الحفظ»، وقيّم قراءتك بعد كل آية فيُحدَّد موعد المراجعة تلقائيًا.',
      tr: 'Bir sure seçin, “Ezberlemeye başla” düğmesine basın ve her ayetten sonra kendinize not verin — tekrar günü kendiliğinden belirlenir.',
    },
    toPlan: { az: 'Bu günün planı', en: 'Today’s plan', ru: 'План на сегодня', ar: 'خطة اليوم', tr: 'Bugünün planı' },
    toMethod: { az: 'Necə əzbərləmək', en: 'How to memorise', ru: 'Как заучивать', ar: 'كيف تحفظ', tr: 'Nasıl ezberlenir' },
    overall: { az: 'Quranın əzbərlənən hissəsi', en: 'Share of the Quran memorised', ru: 'Выученная часть Корана', ar: 'المحفوظ من القرآن', tr: 'Kur’an’ın ezberlenen kısmı' },
    ayahsOf: { az: n => `${n} / 6236 ayə`, en: n => `${n} / 6236 ayahs`, ru: n => `${n} / 6236 аятов`, ar: n => `${n} / 6236 آية`, tr: n => `${n} / 6236 ayet` },
    amma: { az: '30-cu cüz (Əmmə)', en: 'Juz 30 (‘Amma)', ru: '30-й джуз (‘Амма)', ar: 'جزء عمّ', tr: '30. cüz (Amme)' },
    surahsDone: { az: 'Əzbər surə', en: 'Surahs memorised', ru: 'Выучено сур', ar: 'سور محفوظة', tr: 'Ezber sure' },
    streak: { az: 'Ardıcıl gün', en: 'Day streak', ru: 'Дней подряд', ar: 'أيام متتالية', tr: 'Seri gün' },
    note: { az: 'Yalnız bu cihazda saxlanılır.', en: 'Stored on this device only.', ru: 'Хранится только на этом устройстве.', ar: 'تُحفظ على هذا الجهاز فقط.', tr: 'Yalnızca bu cihazda saklanır.' },
  },

  queue: {
    title: { az: 'Növbədəki ayələr', en: 'Up next', ru: 'Очередь аятов', ar: 'الآيات التالية', tr: 'Sıradaki ayetler' },
    more: { az: n => `+${n} ayə`, en: n => `+${n} ayahs`, ru: n => `+${n} аятов`, ar: n => `+${n} آية`, tr: n => `+${n} ayet` },
    forecast: { az: 'Gələn 7 gündə təkrar', en: 'Reviews in the next 7 days', ru: 'Повторения на 7 дней', ar: 'المراجعات في الأيام السبعة القادمة', tr: 'Önümüzdeki 7 günde tekrar' },
    forecastSub: { az: 'gün üzrə ayə sayı', en: 'ayahs per day', ru: 'аятов в день', ar: 'عدد الآيات لكل يوم', tr: 'günlere göre ayet sayısı' },
    today: { az: 'Bu gün', en: 'Today', ru: 'Сегодня', ar: 'اليوم', tr: 'Bugün' },
  },

  tracker: {
    eyebrow: { az: 'Surələr', en: 'Surahs', ru: 'Суры', ar: 'السور', tr: 'Sureler' },
    lead: {
      az: 'Hansı surəni əzbərlədiyinizi qeyd edin — kartlara toxunmaqla statusu dəyişin.',
      en: 'Mark which surahs you know — tap a card to change its status.',
      ru: 'Отмечайте выученные суры — нажатие на карточку меняет статус.',
      ar: 'سجّل السور التي حفظتها؛ اضغط على البطاقة لتغيير حالتها.',
      tr: 'Hangi sureleri ezberlediğinizi işaretleyin — durumu değiştirmek için karta dokunun.',
    },
    donut: { az: 'Status üzrə bölgü', en: 'By status', ru: 'По статусу', ar: 'حسب الحالة', tr: 'Duruma göre' },
  },

  method: {
    eyebrow: { az: 'Üsul', en: 'Method', ru: 'Метод', ar: 'المنهج', tr: 'Yöntem' },
    title: { az: 'Necə əzbərləmək', en: 'How to memorise', ru: 'Как заучивать', ar: 'كيف تحفظ', tr: 'Nasıl ezberlenir' },
    lead: {
      az: 'Quranı əzbərləmək Allahın asanlaşdırdığı işdir — əsas şərt az, amma hər gün olmasıdır.',
      en: 'Allah has made the Quran easy to remember — the key is a little, but every day.',
      ru: 'Аллах облегчил Коран для запоминания — главное понемногу, но каждый день.',
      ar: 'يسّر الله القرآن للذكر، والمهم القليل الدائم كل يوم.',
      tr: 'Allah Kur’an’ı ezberlemeyi kolaylaştırmıştır — esas olan az ama her gün olmasıdır.',
    },
    steps: [
      { title: { az: 'Niyyəti xalis et, qısa surələrdən başla', en: 'Purify your intention, start with short surahs', ru: 'Очисти намерение, начни с коротких сур', ar: 'أخلص النية وابدأ بقصار السور', tr: 'Niyetini halis kıl, kısa surelerle başla' },
        text: { az: 'Allahın razılığı üçün əzbərlə. Çoxları 30-cu cüzdən (Nas → Nəbə) başlayır: surələr qısadır, namazda tez-tez oxunur.', en: 'Memorise for the sake of Allah. Many begin with juz 30 (an-Nas → an-Naba’): the surahs are short and often recited in prayer.', ru: 'Заучивай ради Аллаха. Многие начинают с 30-го джуза (ан-Нас → ан-Наба): суры короткие и часто читаются в молитве.', ar: 'احفظ ابتغاء وجه الله، ويبدأ كثيرون بجزء عمّ (من الناس إلى النبأ) لقِصَر سوره وكثرة قراءتها في الصلاة.', tr: 'Allah rızası için ezberle. Çoğu kişi 30. cüzden (Nâs → Nebe’) başlar: sureler kısadır ve namazda sık okunur.' } },
      { title: { az: 'Az götür: gündə 3–5 ayə', en: 'Take a little: 3–5 ayahs a day', ru: 'Бери понемногу: 3–5 аятов в день', ar: 'خذ قليلًا: ٣–٥ آيات يوميًا', tr: 'Az al: günde 3–5 ayet' },
        text: { az: 'Gündəlik hədəfi «Bu günün planı» bölməsində qurun. Hər gün az öyrənmək, arada bir çox öyrənməkdən daha möhkəm qalır.', en: 'Set the daily goal in “Today’s plan”. A little every day sticks better than a lot now and then.', ru: 'Задайте дневную цель в разделе «План на сегодня». Понемногу каждый день запоминается прочнее, чем много изредка.', ar: 'حدّد الهدف اليومي في «خطة اليوم»؛ فالقليل كل يوم أثبت من الكثير أحيانًا.', tr: 'Günlük hedefi “Bugünün planı” bölümünde belirleyin. Her gün az öğrenmek, arada bir çok öğrenmekten daha kalıcıdır.' } },
      { title: { az: 'Əvvəl dinlə, sonra təkrarla', en: 'Listen first, then repeat', ru: 'Сначала слушай, потом повторяй', ar: 'استمع أولًا ثم ردّد', tr: 'Önce dinle, sonra tekrarla' },
        text: { az: 'Ayəni qaridən bir neçə dəfə dinləyin, sonra öz səsinizi yazıb müqayisə edin — tələffüz düzgün yadda qalsın.', en: 'Listen to the reciter a few times, then record yourself and compare — so the pronunciation is memorised correctly.', ru: 'Послушайте чтеца несколько раз, затем запишите себя и сравните — чтобы произношение запомнилось правильно.', ar: 'استمع إلى القارئ مرات، ثم سجّل تلاوتك وقارن، ليثبت النطق الصحيح.', tr: 'Ayeti kâriden birkaç kez dinleyin, sonra kendi sesinizi kaydedip karşılaştırın — telaffuz doğru ezberlensin.' } },
      { title: { az: 'Yaddan oxu: sözləri gizlət', en: 'Recite from memory: hide the words', ru: 'Читай по памяти: скрой слова', ar: 'اقرأ غيبًا: أخفِ الكلمات', tr: 'Ezberden oku: kelimeleri gizle' },
        text: { az: '«İlk söz» və «Gizli mətn» rejimlərində sözü yalnız çətinlikdə açın. Özünüzü yoxlamaq ən güclü məşqdir.', en: 'In “First word” and “Hidden text” modes reveal a word only when stuck. Testing yourself is the strongest practice.', ru: 'В режимах «Первое слово» и «Скрытый текст» открывайте слово, только если застряли. Самопроверка — лучшая тренировка.', ar: 'في وضعَي «الكلمة الأولى» و«نص مخفي» لا تُظهر الكلمة إلا عند التعثّر؛ فاختبار النفس أقوى تمرين.', tr: '“İlk kelime” ve “Gizli metin” modlarında kelimeyi yalnızca takıldığınızda açın. Kendini sınamak en güçlü alıştırmadır.' } },
      { title: { az: 'Hər gün təkrar et', en: 'Review every day', ru: 'Повторяй каждый день', ar: 'راجع كل يوم', tr: 'Her gün tekrar et' },
        text: { az: 'Sayt hər ayənin təkrar gününü qiymətinizə görə planlaşdırır: çətin ayə tez-tez, asan ayə seyrək qayıdır.', en: 'The site schedules each ayah by your grade: hard ayahs come back often, easy ones rarely.', ru: 'Сайт планирует повторение каждого аята по вашей оценке: трудные возвращаются часто, лёгкие — редко.', ar: 'يجدول الموقع مراجعة كل آية بحسب تقييمك: الصعبة تعود كثيرًا والسهلة قليلًا.', tr: 'Site her ayetin tekrar gününü notunuza göre planlar: zor ayet sık, kolay ayet seyrek döner.' } },
      { title: { az: 'Namazda oxu', en: 'Recite it in prayer', ru: 'Читай в молитве', ar: 'اقرأ به في الصلاة', tr: 'Namazda oku' },
        text: { az: 'Yeni əzbərlədiyinizi nafilə və fərz namazlarında oxuyun — yaddaş ən yaxşı belə möhkəmlənir.', en: 'Recite what you have newly memorised in voluntary and obligatory prayers — that is how memory is best reinforced.', ru: 'Читайте выученное в добровольных и обязательных молитвах — так память закрепляется лучше всего.', ar: 'اقرأ ما حفظته حديثًا في النوافل والفرائض، فهذا من أنفع ما يثبّت الحفظ.', tr: 'Yeni ezberlediğinizi nafile ve farz namazlarda okuyun — hafıza en iyi böyle pekişir.' } },
    ],
    quotes: [
      { kind: 'quran', ar: 'وَلَقَدْ يَسَّرْنَا ٱلْقُرْءَانَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ', ref: '54:17',
        text: { az: 'Həqiqətən, Biz Quranı öyüd almaq (və yadda saxlamaq) üçün asanlaşdırdıq. Öyüd alan varmı?', en: 'And We have certainly made the Quran easy to remember. So is there anyone who will be mindful?', ru: 'Мы облегчили Коран для поминания. Но есть ли среди вас поминающие?', tr: 'Andolsun, Kur’an’ı öğüt almak (ve ezberlemek) için kolaylaştırdık. Öğüt alan yok mu?' } },
      { kind: 'hadith', ar: 'تَعَاهَدُوا الْقُرْآنَ، فَوَالَّذِي نَفْسِي بِيَدِهِ لَهُوَ أَشَدُّ تَفَصِّيًا مِنَ الْإِبِلِ فِي عُقُلِهَا', src: S('Buxari 5033'),
        text: { az: 'Quranı daim təkrar edin! Canım əlində olana and olsun ki, o, yaddan çıxmaqda bağlı dəvənin ipindən qurtulmasından da sürətlidir.', en: 'Keep revising the Quran! By Him in whose hand is my soul, it escapes faster than camels from their hobbles.', ru: 'Постоянно повторяйте Коран! Клянусь Тем, в Чьей руке моя душа, он ускользает быстрее, чем верблюды из своих пут.', tr: 'Kur’an’ı sürekli tekrar edin! Canım elinde olana yemin olsun ki o, (hafızadan) kaçmakta bağlı devenin ipinden kurtulmasından daha hızlıdır.' } },
      { kind: 'hadith', ar: 'يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا، فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَأُ بِهَا', src: S('Tirmizi 2914'),
        grade: { az: 'həsən səhih (Tirmizi)', en: 'hasan sahih (at-Tirmidhi)', ru: 'хороший достоверный (ат-Тирмизи)', ar: 'حسن صحيح (الترمذي)', tr: 'hasen sahih (Tirmizî)' },
        text: { az: 'Quran sahibinə deyiləcək: «Oxu və yüksəl, dünyada tərtil ilə oxuduğun kimi tərtil ilə oxu. Sənin məqamın oxuduğun son ayənin yanındadır».', en: 'It will be said to the companion of the Quran: “Recite and rise, and recite slowly as you used to in the world, for your rank is at the last verse you recite.”', ru: 'Обладателю Корана будет сказано: «Читай и поднимайся, и читай размеренно, как читал в мире этом, ведь твоё место — у последнего аята, который ты прочтёшь».', tr: 'Kur’an sahibine şöyle denilecek: “Oku ve yüksel; dünyada tertil ile okuduğun gibi oku. Senin makamın okuduğun son ayetin yanındadır.”' } },
    ],
    more: { az: 'Quran oxumağın ədəbi və fəziləti', en: 'Etiquette and virtue of reciting the Quran', ru: 'Этикет и достоинство чтения Корана', ar: 'آداب التلاوة وفضلها', tr: 'Kur’an okumanın edebi ve fazileti' },
    moreText: { az: 'Quran səhifəsində — dəlilləri ilə', en: 'On the Quran page — with evidence', ru: 'На странице Корана — с доводами', ar: 'في صفحة القرآن، بالأدلة', tr: 'Kur’an sayfasında — delilleriyle' },
  },
  quran: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
  grade: { az: 'Dərəcəsi', en: 'Grade', ru: 'Степень', ar: 'الدرجة', tr: 'Derecesi' },
}
