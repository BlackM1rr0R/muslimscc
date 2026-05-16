import { useState, useMemo, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/QuizPage.css'

const LABELS = {
  az: { title:'İslami Kviz', subtitle:'Biliyini test et', categories:'Kateqoriya seç', quran:'Quran', hadith:'Hədis', names:'99 Ad', start:'Başla', next:'Növbəti', finish:'Bitir', score:'Xal', correct:'Düzgün', wrong:'Səhv', playAgain:'Yenidən', question:'Sual', of:'/', bestScore:'Ən yaxşı nəticə', newBest:'Yeni rekord!', back:'Geri', selectAnswer:'Cavab seçin' },
  en: { title:'Islamic Quiz', subtitle:'Test your knowledge', categories:'Choose category', quran:'Quran', hadith:'Hadith', names:'99 Names', start:'Start', next:'Next', finish:'Finish', score:'Score', correct:'Correct', wrong:'Wrong', playAgain:'Play Again', question:'Question', of:'/', bestScore:'Best score', newBest:'New record!', back:'Back', selectAnswer:'Select an answer' },
  ru: { title:'Исламская Викторина', subtitle:'Проверь свои знания', categories:'Выберите категорию', quran:'Коран', hadith:'Хадис', names:'99 Имён', start:'Начать', next:'Далее', finish:'Завершить', score:'Баллы', correct:'Правильно', wrong:'Неправильно', playAgain:'Играть снова', question:'Вопрос', of:'/', bestScore:'Лучший результат', newBest:'Новый рекорд!', back:'Назад', selectAnswer:'Выберите ответ' },
  ar: { title:'اختبار إسلامي', subtitle:'اختبر معلوماتك', categories:'اختر الفئة', quran:'القرآن', hadith:'الحديث', names:'٩٩ اسم', start:'ابدأ', next:'التالي', finish:'إنهاء', score:'النقاط', correct:'صحيح', wrong:'خطأ', playAgain:'أعد اللعب', question:'سؤال', of:'/', bestScore:'أفضل نتيجة', newBest:'رقم قياسي!', back:'رجوع', selectAnswer:'اختر إجابة' },
  tr: { title:'İslami Quiz', subtitle:'Bilgini test et', categories:'Kategori seç', quran:'Kuran', hadith:'Hadis', names:'99 İsim', start:'Başla', next:'Sonraki', finish:'Bitir', score:'Puan', correct:'Doğru', wrong:'Yanlış', playAgain:'Tekrar Oyna', question:'Soru', of:'/', bestScore:'En iyi skor', newBest:'Yeni rekor!', back:'Geri', selectAnswer:'Bir cevap seçin' },
}

const QUESTIONS = {
  quran: [
    {
      q: { az:'Quran neçə surədən ibarətdir?', en:'How many surahs are in the Quran?', ru:'Сколько сур в Коране?', ar:'كم عدد سور القرآن؟', tr:'Kuran kaç sureden oluşur?' },
      options: ['100','110','114','120'], correct: 2
    },
    {
      q: { az:'Ən uzun surə hansıdır?', en:'Which is the longest surah?', ru:'Какая самая длинная сура?', ar:'ما أطول سورة في القرآن؟', tr:'En uzun sure hangisidir?' },
      options: [
        { az:'Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Ali-İmran', en:'Ali Imran', ru:'Аль-Имран', ar:'آل عمران', tr:'Ali İmran' },
        { az:'Nisa', en:'An-Nisa', ru:'Ан-Ниса', ar:'النساء', tr:'Nisa' },
        { az:'Maidə', en:'Al-Maidah', ru:'Аль-Маида', ar:'المائدة', tr:'Maide' }
      ], correct: 0
    },
    {
      q: { az:'Ən qısa surə hansıdır?', en:'Which is the shortest surah?', ru:'Какая самая короткая сура?', ar:'ما أقصر سورة في القرآن؟', tr:'En kısa sure hangisidir?' },
      options: [
        { az:'İxlas', en:'Al-Ikhlas', ru:'Аль-Ихлас', ar:'الإخلاص', tr:'İhlas' },
        { az:'Kövsər', en:'Al-Kawthar', ru:'Аль-Каусар', ar:'الكوثر', tr:'Kevser' },
        { az:'Nas', en:'An-Nas', ru:'Ан-Нас', ar:'الناس', tr:'Nas' },
        { az:'Fələq', en:'Al-Falaq', ru:'Аль-Фаляк', ar:'الفلق', tr:'Felak' }
      ], correct: 1
    },
    {
      q: { az:'Quran neçə il ərzində nazil olub?', en:'Over how many years was the Quran revealed?', ru:'За сколько лет был ниспослан Коран?', ar:'كم سنة استغرق نزول القرآن؟', tr:'Kuran kaç yılda indirildi?' },
      options: ['10','15','23','30'], correct: 2
    },
    {
      q: { az:'Quranın ən çox təkrarlanan surəsi hansıdır?', en:'Which surah is recited in every prayer?', ru:'Какая сура читается в каждом намазе?', ar:'ما السورة التي تُقرأ في كل صلاة؟', tr:'Her namazda okunan sure hangisidir?' },
      options: [
        { az:'Fatihə', en:'Al-Fatiha', ru:'Аль-Фатиха', ar:'الفاتحة', tr:'Fatiha' },
        { az:'İxlas', en:'Al-Ikhlas', ru:'Аль-Ихлас', ar:'الإخلاص', tr:'İhlas' },
        { az:'Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Yasin', en:'Ya-Sin', ru:'Йа-Син', ar:'يس', tr:'Yasin' }
      ], correct: 0
    },
    {
      q: { az:'Quranın ilk nazil olan ayəsi hansı surədəndir?', en:'The first revealed verse is from which surah?', ru:'Первый ниспосланный аят из какой суры?', ar:'أول آية نزلت من أي سورة؟', tr:'İlk inen ayet hangi surededir?' },
      options: [
        { az:'Fatihə', en:'Al-Fatiha', ru:'Аль-Фатиха', ar:'الفاتحة', tr:'Fatiha' },
        { az:'Ələq', en:'Al-Alaq', ru:'Аль-Алак', ar:'العلق', tr:'Alak' },
        { az:'Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Müddəssir', en:'Al-Muddathir', ru:'Аль-Муддассир', ar:'المدثر', tr:'Müddessir' }
      ], correct: 1
    },
    {
      q: { az:'Quranın neçə cüzü var?', en:'How many juz (parts) does the Quran have?', ru:'Сколько джузов (частей) в Коране?', ar:'كم جزءاً في القرآن؟', tr:'Kuran kaç cüzden oluşur?' },
      options: ['20','25','30','40'], correct: 2
    },
    {
      q: { az:'Quranın "Quranın qəlbi" adlandırılan surəsi?', en:'Which surah is called "the Heart of the Quran"?', ru:'Какую суру называют «сердцем Корана»?', ar:'ما السورة التي تُسمى قلب القرآن؟', tr:'Kuranın kalbi olarak bilinen sure hangisidir?' },
      options: [
        { az:'Rəhman', en:'Ar-Rahman', ru:'Ар-Рахман', ar:'الرحمن', tr:'Rahman' },
        { az:'Yasin', en:'Ya-Sin', ru:'Йа-Син', ar:'يس', tr:'Yasin' },
        { az:'Mulk', en:'Al-Mulk', ru:'Аль-Мульк', ar:'الملك', tr:'Mülk' },
        { az:'Kəhf', en:'Al-Kahf', ru:'Аль-Кахф', ar:'الكهف', tr:'Kehf' }
      ], correct: 1
    },
    {
      q: { az:'Ayətəl-Kürsi hansı surədədir?', en:'Ayat al-Kursi is in which surah?', ru:'Аят аль-Курси в какой суре?', ar:'في أي سورة آية الكرسي؟', tr:'Ayetel Kürsi hangi surededir?' },
      options: [
        { az:'Ali-İmran', en:'Ali Imran', ru:'Аль-Имран', ar:'آل عمران', tr:'Ali İmran' },
        { az:'Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Nisa', en:'An-Nisa', ru:'Ан-Ниса', ar:'النساء', tr:'Nisa' },
        { az:'Maidə', en:'Al-Maidah', ru:'Аль-Маида', ar:'المائدة', tr:'Maide' }
      ], correct: 1
    },
    {
      q: { az:'Quranın neçə ayəsi var (təxmini)?', en:'Approximately how many verses are in the Quran?', ru:'Сколько примерно аятов в Коране?', ar:'كم عدد آيات القرآن تقريباً؟', tr:'Kuran yaklaşık kaç ayetten oluşur?' },
      options: ['5000','6236','7000','8000'], correct: 1
    },
    {
      q: { az:'Hansı surə "Bismillah" ilə başlamır?', en:'Which surah does not begin with Bismillah?', ru:'Какая сура не начинается с Бисмиллях?', ar:'أي سورة لا تبدأ بالبسملة؟', tr:'Hangi sure Besmele ile başlamaz?' },
      options: [
        { az:'Ət-Tövbə', en:'At-Tawbah', ru:'Ат-Тауба', ar:'التوبة', tr:'Tevbe' },
        { az:'Ən-Nəhl', en:'An-Nahl', ru:'Ан-Нахль', ar:'النحل', tr:'Nahl' },
        { az:'Əl-Kəhf', en:'Al-Kahf', ru:'Аль-Кахф', ar:'الكهف', tr:'Kehf' },
        { az:'Əl-Ənfal', en:'Al-Anfal', ru:'Аль-Анфаль', ar:'الأنفال', tr:'Enfal' }
      ], correct: 0
    },
    {
      q: { az:'Hansı surədə "Bismillah" iki dəfə keçir?', en:'Which surah contains Bismillah twice?', ru:'В какой суре Бисмиллях упоминается дважды?', ar:'أي سورة ذُكرت فيها البسملة مرتين؟', tr:'Hangi surede Besmele iki kez geçer?' },
      options: [
        { az:'Ən-Nəml', en:'An-Naml', ru:'Ан-Намль', ar:'النمل', tr:'Neml' },
        { az:'Əl-Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Ali-İmran', en:'Ali Imran', ru:'Аль-Имран', ar:'آل عمران', tr:'Ali İmran' },
        { az:'Ən-Nisa', en:'An-Nisa', ru:'Ан-Ниса', ar:'النساء', tr:'Nisa' }
      ], correct: 0
    },
    {
      q: { az:'Quranda ən çox adı çəkilən peyğəmbər kimdir?', en:'Which prophet is mentioned most in the Quran?', ru:'Какой пророк упоминается в Коране чаще всего?', ar:'من هو النبي الأكثر ذكراً في القرآن؟', tr:'Kuranda en çok adı geçen peygamber kimdir?' },
      options: [
        { az:'Hz. İbrahim', en:'Ibrahim (Abraham)', ru:'Ибрагим (Авраам)', ar:'إبراهيم', tr:'Hz. İbrahim' },
        { az:'Hz. İsa', en:'Isa (Jesus)', ru:'Иса (Иисус)', ar:'عيسى', tr:'Hz. İsa' },
        { az:'Hz. Musa', en:'Musa (Moses)', ru:'Муса (Моисей)', ar:'موسى', tr:'Hz. Musa' },
        { az:'Hz. Nuh', en:'Nuh (Noah)', ru:'Нух (Ной)', ar:'نوح', tr:'Hz. Nuh' }
      ], correct: 2
    },
    {
      q: { az:'Quranda neçə peyğəmbər adı çəkilir?', en:'How many prophets are mentioned in the Quran?', ru:'Сколько пророков упоминается в Коране?', ar:'كم عدد الأنبياء المذكورين في القرآن؟', tr:'Kuranda kaç peygamber adı geçer?' },
      options: ['20','25','30','35'], correct: 1
    },
    {
      q: { az:'Quranın üçdə birinə bərabər olan surə hansıdır?', en:'Which surah is equal to one-third of the Quran?', ru:'Какая сура равна одной трети Корана?', ar:'ما السورة التي تعادل ثلث القرآن؟', tr:'Kuranın üçte birine denk olan sure hangisidir?' },
      options: [
        { az:'Əl-İxlas', en:'Al-Ikhlas', ru:'Аль-Ихлас', ar:'الإخلاص', tr:'İhlas' },
        { az:'Əl-Fatihə', en:'Al-Fatiha', ru:'Аль-Фатиха', ar:'الفاتحة', tr:'Fatiha' },
        { az:'Əl-Kəvsər', en:'Al-Kawthar', ru:'Аль-Каусар', ar:'الكوثر', tr:'Kevser' },
        { az:'Ən-Nas', en:'An-Nas', ru:'Ан-Нас', ar:'الناس', tr:'Nas' }
      ], correct: 0
    },
    {
      q: { az:'Quranın ən uzun ayəsi hansıdır?', en:'Which is the longest verse in the Quran?', ru:'Какой самый длинный аят в Коране?', ar:'ما أطول آية في القرآن؟', tr:'Kuranın en uzun ayeti hangisidir?' },
      options: [
        { az:'Bəqərə 255 (Ayətəl-Kürsi)', en:'Al-Baqarah 255 (Ayat al-Kursi)', ru:'Аль-Бакара 255 (Аят аль-Курси)', ar:'البقرة ٢٥٥', tr:'Bakara 255 (Ayetel Kürsi)' },
        { az:'Bəqərə 282 (Borc ayəsi)', en:'Al-Baqarah 282 (Debt verse)', ru:'Аль-Бакара 282 (Аят о долге)', ar:'البقرة ٢٨٢', tr:'Bakara 282 (Borç ayeti)' },
        { az:'Ali-İmran 1', en:'Ali Imran 1', ru:'Аль-Имран 1', ar:'آل عمران ١', tr:'Ali İmran 1' },
        { az:'Nisa 12', en:'An-Nisa 12', ru:'Ан-Ниса 12', ar:'النساء ١٢', tr:'Nisa 12' }
      ], correct: 1
    },
    {
      q: { az:'Quranda neçə səcdə ayəsi var?', en:'How many sajdah (prostration) verses are in the Quran?', ru:'Сколько аятов саджда в Коране?', ar:'كم عدد سجدات التلاوة في القرآن؟', tr:'Kuranda kaç secde ayeti vardır?' },
      options: ['10','12','15','20'], correct: 2
    },
    {
      q: { az:'"Təbarək" sözü ilə başlayan surə hansıdır?', en:'Which surah begins with the word "Tabarak"?', ru:'Какая сура начинается со слова «Табарак»?', ar:'ما السورة التي تبدأ بكلمة "تبارك"؟', tr:'"Tebareke" kelimesiyle başlayan sure hangisidir?' },
      options: [
        { az:'Əl-Mulk', en:'Al-Mulk', ru:'Аль-Мульк', ar:'الملك', tr:'Mülk' },
        { az:'Əl-Furqan', en:'Al-Furqan', ru:'Аль-Фуркан', ar:'الفرقان', tr:'Furkan' },
        { az:'Əl-Həşr', en:'Al-Hashr', ru:'Аль-Хашр', ar:'الحشر', tr:'Haşr' },
        { az:'Əl-Qələm', en:'Al-Qalam', ru:'Аль-Калам', ar:'القلم', tr:'Kalem' }
      ], correct: 0
    },
    {
      q: { az:'Dəccaldan qoruyan surə hansıdır?', en:'Which surah protects from Dajjal?', ru:'Какая сура защищает от Даджаля?', ar:'ما السورة التي تحمي من الدجال؟', tr:'Deccalden koruyan sure hangisidir?' },
      options: [
        { az:'Əl-Mulk', en:'Al-Mulk', ru:'Аль-Мульк', ar:'الملك', tr:'Mülk' },
        { az:'Əl-Kəhf', en:'Al-Kahf', ru:'Аль-Кахф', ar:'الكهف', tr:'Kehf' },
        { az:'Yasin', en:'Ya-Sin', ru:'Йа-Син', ar:'يس', tr:'Yasin' },
        { az:'Əl-Vaqiə', en:'Al-Waqiah', ru:'Аль-Вакыа', ar:'الواقعة', tr:'Vakıa' }
      ], correct: 1
    },
    {
      q: { az:'İlk nazil olan söz nə olub?', en:'What was the first word revealed?', ru:'Какое было первое ниспосланное слово?', ar:'ما أول كلمة نزلت؟', tr:'İlk inen kelime neydi?' },
      options: [
        { az:'Qul (De)', en:'Qul (Say)', ru:'Куль (Скажи)', ar:'قل', tr:'Kul (De)' },
        { az:'İqrə (Oxu)', en:'Iqra (Read)', ru:'Икра (Читай)', ar:'اقرأ', tr:'İkra (Oku)' },
        { az:'Bismillah', en:'Bismillah', ru:'Бисмиллях', ar:'بسم الله', tr:'Bismillah' },
        { az:'Əlhəmdulillah', en:'Alhamdulillah', ru:'Альхамдулиллях', ar:'الحمد لله', tr:'Elhamdülillah' }
      ], correct: 1
    },
    {
      q: { az:'Məkkə surələrinin sayı neçədir?', en:'How many Makki surahs are there?', ru:'Сколько мекканских сур?', ar:'كم عدد السور المكية؟', tr:'Mekki surelerin sayısı kaçtır?' },
      options: ['76','86','90','100'], correct: 1
    },
    {
      q: { az:'Mədinə surələrinin sayı neçədir?', en:'How many Madani surahs are there?', ru:'Сколько мединских сур?', ar:'كم عدد السور المدنية؟', tr:'Medeni surelerin sayısı kaçtır?' },
      options: ['18','22','28','32'], correct: 2
    },
    {
      q: { az:'Hansı surə bir heyvana (inəyə) görə adlandırılıb?', en:'Which surah is named after a cow?', ru:'Какая сура названа в честь коровы?', ar:'ما السورة المسماة بالبقرة؟', tr:'Hangi sure bir ineğe göre adlandırılmıştır?' },
      options: [
        { az:'Ən-Nəhl', en:'An-Nahl', ru:'Ан-Нахль', ar:'النحل', tr:'Nahl' },
        { az:'Əl-Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Əl-Fil', en:'Al-Fil', ru:'Аль-Филь', ar:'الفيل', tr:'Fil' },
        { az:'Ən-Nəml', en:'An-Naml', ru:'Ан-Намль', ar:'النمل', tr:'Neml' }
      ], correct: 1
    },
    {
      q: { az:'Hansı surə arıya (bal arısına) görə adlandırılıb?', en:'Which surah is named after the bee?', ru:'Какая сура названа в честь пчелы?', ar:'ما السورة المسماة بالنحل؟', tr:'Hangi sure arıya göre adlandırılmıştır?' },
      options: [
        { az:'Əl-Ənkəbut', en:'Al-Ankabut', ru:'Аль-Анкабут', ar:'العنكبوت', tr:'Ankebut' },
        { az:'Ən-Nəml', en:'An-Naml', ru:'Ан-Намль', ar:'النمل', tr:'Neml' },
        { az:'Ən-Nəhl', en:'An-Nahl', ru:'Ан-Нахль', ar:'النحل', tr:'Nahl' },
        { az:'Əl-Fil', en:'Al-Fil', ru:'Аль-Филь', ar:'الفيل', tr:'Fil' }
      ], correct: 2
    },
    {
      q: { az:'Hansı surə hörümçəyə görə adlandırılıb?', en:'Which surah is named after the spider?', ru:'Какая сура названа в честь паука?', ar:'ما السورة المسماة بالعنكبوت؟', tr:'Hangi sure örümceğe göre adlandırılmıştır?' },
      options: [
        { az:'Əl-Ənkəbut', en:'Al-Ankabut', ru:'Аль-Анкабут', ar:'العنكبوت', tr:'Ankebut' },
        { az:'Ən-Nəhl', en:'An-Nahl', ru:'Ан-Нахль', ar:'النحل', tr:'Nahl' },
        { az:'Əl-Fil', en:'Al-Fil', ru:'Аль-Филь', ar:'الفيل', tr:'Fil' },
        { az:'Ən-Nəml', en:'An-Naml', ru:'Ан-Намль', ar:'النمل', tr:'Neml' }
      ], correct: 0
    },
    {
      q: { az:'Hansı surə filə görə adlandırılıb?', en:'Which surah is named after the elephant?', ru:'Какая сура названа в честь слона?', ar:'ما السورة المسماة بالفيل؟', tr:'Hangi sure file göre adlandırılmıştır?' },
      options: [
        { az:'Ən-Nəhl', en:'An-Nahl', ru:'Ан-Нахль', ar:'النحل', tr:'Nahl' },
        { az:'Ən-Nəml', en:'An-Naml', ru:'Ан-Намль', ar:'النمل', tr:'Neml' },
        { az:'Əl-Ənkəbut', en:'Al-Ankabut', ru:'Аль-Анкабут', ar:'العنكبوت', tr:'Ankebut' },
        { az:'Əl-Fil', en:'Al-Fil', ru:'Аль-Филь', ar:'الفيل', tr:'Fil' }
      ], correct: 3
    },
    {
      q: { az:'Hansı surə bir peyğəmbərin adını daşıyır?', en:'Which surah is named after a prophet?', ru:'Какая сура названа именем пророка?', ar:'أي سورة سميت باسم نبي؟', tr:'Hangi sure bir peygamberin adını taşır?' },
      options: [
        { az:'Əl-Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Yusuf', en:'Yusuf', ru:'Юсуф', ar:'يوسف', tr:'Yusuf' },
        { az:'Əl-Kəhf', en:'Al-Kahf', ru:'Аль-Кахф', ar:'الكهف', tr:'Kehf' },
        { az:'Əl-Mulk', en:'Al-Mulk', ru:'Аль-Мульк', ar:'الملك', tr:'Mülk' }
      ], correct: 1
    },
    {
      q: { az:'Bəqərədən sonra ən çox ayəsi olan surə?', en:'Which surah has the most verses after Al-Baqarah?', ru:'Какая сура имеет больше всего аятов после Аль-Бакара?', ar:'ما السورة التي بها أكثر آيات بعد البقرة؟', tr:'Bakaradan sonra en çok ayeti olan sure hangisidir?' },
      options: [
        { az:'Ali-İmran (200)', en:'Ali Imran (200)', ru:'Аль-Имран (200)', ar:'آل عمران (٢٠٠)', tr:'Ali İmran (200)' },
        { az:'Ən-Nisa (176)', en:'An-Nisa (176)', ru:'Ан-Ниса (176)', ar:'النساء (١٧٦)', tr:'Nisa (176)' },
        { az:'Əş-Şüəra (227)', en:'Ash-Shuara (227)', ru:'Аш-Шуара (227)', ar:'الشعراء (٢٢٧)', tr:'Şuara (227)' },
        { az:'Əl-Əraf (206)', en:'Al-A\'raf (206)', ru:'Аль-Араф (206)', ar:'الأعراف (٢٠٦)', tr:'A\'raf (206)' }
      ], correct: 2
    },
    {
      q: { az:'Quranın son nazil olan surəsi hansıdır (bir rəyə görə)?', en:'Which is considered the last revealed surah (one opinion)?', ru:'Какая сура считается последней ниспосланной (по одному мнению)?', ar:'ما آخر سورة نزلت (في أحد الأقوال)؟', tr:'Son inen sure hangisidir (bir görüşe göre)?' },
      options: [
        { az:'Ən-Nasr', en:'An-Nasr', ru:'Ан-Наср', ar:'النصر', tr:'Nasr' },
        { az:'Əl-Maidə', en:'Al-Maidah', ru:'Аль-Маида', ar:'المائدة', tr:'Maide' },
        { az:'Əl-Fatihə', en:'Al-Fatiha', ru:'Аль-Фатиха', ar:'الفاتحة', tr:'Fatiha' },
        { az:'Əl-Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' }
      ], correct: 0
    },
    {
      q: { az:'"Rəhman" sözü ən çox hansı surədə keçir?', en:'Which surah mentions "Rahman" the most?', ru:'В какой суре слово «Рахман» упоминается чаще всего?', ar:'أي سورة ذُكر فيها "الرحمن" أكثر؟', tr:'"Rahman" kelimesi en çok hangi surede geçer?' },
      options: [
        { az:'Əl-Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Məryəm', en:'Maryam', ru:'Марьям', ar:'مريم', tr:'Meryem' },
        { az:'Ər-Rəhman', en:'Ar-Rahman', ru:'Ар-Рахман', ar:'الرحمن', tr:'Rahman' },
        { az:'Yasin', en:'Ya-Sin', ru:'Йа-Син', ar:'يس', tr:'Yasin' }
      ], correct: 1
    },
    {
      q: { az:'Quranın neçə hizbi var?', en:'How many hizb are in the Quran?', ru:'Сколько хизбов в Коране?', ar:'كم عدد أحزاب القرآن؟', tr:'Kuranda kaç hizb vardır?' },
      options: ['30','60','114','120'], correct: 1
    },
    {
      q: { az:'Hansı surə Cümə namazında oxunması tövsiyə olunan surədir?', en:'Which surah is recommended to recite on Fridays?', ru:'Какую суру рекомендуется читать по пятницам?', ar:'ما السورة التي يُستحب قراءتها يوم الجمعة؟', tr:'Cuma günü okunması tavsiye edilen sure hangisidir?' },
      options: [
        { az:'Əl-Mulk', en:'Al-Mulk', ru:'Аль-Мульк', ar:'الملك', tr:'Mülk' },
        { az:'Əl-Kəhf', en:'Al-Kahf', ru:'Аль-Кахф', ar:'الكهف', tr:'Kehf' },
        { az:'Yasin', en:'Ya-Sin', ru:'Йа-Син', ar:'يس', tr:'Yasin' },
        { az:'Ər-Rəhman', en:'Ar-Rahman', ru:'Ар-Рахман', ar:'الرحمن', tr:'Rahman' }
      ], correct: 1
    },
    {
      q: { az:'Quranın "Muavvizətеyn" adlanan surələri hansılardır?', en:'Which surahs are called "Al-Muawwidhatayn"?', ru:'Какие суры называются «Аль-Муаввизатайн»?', ar:'ما هما المعوذتان؟', tr:'"Muavvizeteyn" olarak bilinen sureler hangileridir?' },
      options: [
        { az:'Fatihə və İxlas', en:'Al-Fatiha & Al-Ikhlas', ru:'Аль-Фатиха и Аль-Ихлас', ar:'الفاتحة والإخلاص', tr:'Fatiha ve İhlas' },
        { az:'Fələq və Nas', en:'Al-Falaq & An-Nas', ru:'Аль-Фаляк и Ан-Нас', ar:'الفلق والناس', tr:'Felak ve Nas' },
        { az:'Bəqərə və İmran', en:'Al-Baqarah & Ali Imran', ru:'Аль-Бакара и Аль-Имран', ar:'البقرة وآل عمران', tr:'Bakara ve Ali İmran' },
        { az:'Mulk və Yasin', en:'Al-Mulk & Ya-Sin', ru:'Аль-Мульк и Йа-Син', ar:'الملك ويس', tr:'Mülk ve Yasin' }
      ], correct: 1
    },
  ],
  hadith: [
    {
      q: { az:'Ən məşhur hədis toplularından biri olan "Səhih əl-Buxari"ni kim toplamışdır?', en:'Who compiled "Sahih al-Bukhari"?', ru:'Кто составил «Сахих аль-Бухари»?', ar:'من جمع صحيح البخاري؟', tr:'"Sahih-i Buhari"yi kim derlemiştir?' },
      options: [
        { az:'İmam Muslim', en:'Imam Muslim', ru:'Имам Муслим', ar:'الإمام مسلم', tr:'İmam Müslim' },
        { az:'İmam Buxari', en:'Imam Bukhari', ru:'Имам Бухари', ar:'الإمام البخاري', tr:'İmam Buhari' },
        { az:'İmam Əbu Davud', en:'Imam Abu Dawud', ru:'Имам Абу Дауд', ar:'الإمام أبو داود', tr:'İmam Ebu Davud' },
        { az:'İmam Tirmizi', en:'Imam Tirmidhi', ru:'Имам Тирмизи', ar:'الإمام الترمذي', tr:'İmam Tirmizi' }
      ], correct: 1
    },
    {
      q: { az:'İslamın neçə şərti var?', en:'How many pillars of Islam are there?', ru:'Сколько столпов Ислама?', ar:'كم عدد أركان الإسلام؟', tr:'İslamın kaç şartı vardır?' },
      options: ['3','4','5','6'], correct: 2
    },
    {
      q: { az:'İmanın neçə şərti var?', en:'How many articles of faith are there?', ru:'Сколько столпов веры (имана)?', ar:'كم عدد أركان الإيمان؟', tr:'İmanın kaç şartı vardır?' },
      options: ['5','6','7','8'], correct: 1
    },
    {
      q: { az:'"Əməllər niyyətlərə görədir" hədisi hansı topluda keçir?', en:'The hadith "Actions are by intentions" is found in which collection?', ru:'Хадис «Дела оцениваются по намерениям» в каком сборнике?', ar:'حديث «إنما الأعمال بالنيات» في أي مجموعة؟', tr:'"Ameller niyetlere göredir" hadisi hangi eserdedir?' },
      options: [
        { az:'Səhih Muslim', en:'Sahih Muslim', ru:'Сахих Муслим', ar:'صحيح مسلم', tr:'Sahih-i Müslim' },
        { az:'Sünən Əbu Davud', en:'Sunan Abu Dawud', ru:'Сунан Абу Дауд', ar:'سنن أبي داود', tr:'Sünen Ebu Davud' },
        { az:'Səhih Buxari', en:'Sahih Bukhari', ru:'Сахих Бухари', ar:'صحيح البخاري', tr:'Sahih-i Buhari' },
        { az:'Sünən Tirmizi', en:'Sunan Tirmidhi', ru:'Сунан Тирмизи', ar:'سنن الترمذي', tr:'Sünen Tirmizi' }
      ], correct: 2
    },
    {
      q: { az:'"Kutubi-Sittə" neçə hədis toplusuna deyilir?', en:'How many hadith collections make up "Kutub al-Sittah"?', ru:'Сколько сборников хадисов входят в «Кутуб ас-Ситта»?', ar:'كم عدد كتب الحديث في الكتب الستة؟', tr:'"Kütüb-i Sitte" kaç hadis kitabından oluşur?' },
      options: ['4','5','6','7'], correct: 2
    },
    {
      q: { az:'Hansı əməl İslamda ən fəzilətlidir (hədisə görə)?', en:'Which deed is most virtuous in Islam (according to hadith)?', ru:'Какое дело самое добродетельное в Исламе (по хадису)?', ar:'ما أفضل الأعمال في الإسلام (حسب الحديث)؟', tr:'İslamda en faziletli amel hangisidir (hadise göre)?' },
      options: [
        { az:'Namazı vaxtında qılmaq', en:'Praying on time', ru:'Совершать молитву вовремя', ar:'الصلاة على وقتها', tr:'Namazı vaktinde kılmak' },
        { az:'Oruc tutmaq', en:'Fasting', ru:'Пост', ar:'الصيام', tr:'Oruç tutmak' },
        { az:'Zəkat vermək', en:'Giving zakat', ru:'Выплата закята', ar:'إخراج الزكاة', tr:'Zekat vermek' },
        { az:'Həcc etmək', en:'Performing Hajj', ru:'Совершение Хаджа', ar:'أداء الحج', tr:'Hac yapmak' }
      ], correct: 0
    },
    {
      q: { az:'Hz. Peyğəmbərin (s.a.s) vəfat yaşı neçə idi?', en:'At what age did Prophet Muhammad (PBUH) pass away?', ru:'В каком возрасте скончался Пророк Мухаммад (мир ему)?', ar:'كم كان عمر النبي ﷺ عند وفاته؟', tr:'Hz. Peygamber (s.a.s) kaç yaşında vefat etti?' },
      options: ['60','63','65','70'], correct: 1
    },
    {
      q: { az:'Hədis elmində "səhih" nə deməkdir?', en:'What does "sahih" mean in hadith science?', ru:'Что означает «сахих» в науке о хадисах?', ar:'ما معنى "صحيح" في علم الحديث؟', tr:'Hadis ilminde "sahih" ne demektir?' },
      options: [
        { az:'Zəif', en:'Weak', ru:'Слабый', ar:'ضعيف', tr:'Zayıf' },
        { az:'Doğru/Etibarlı', en:'Authentic/Reliable', ru:'Достоверный/Надёжный', ar:'صحيح/موثوق', tr:'Doğru/Güvenilir' },
        { az:'Uydurma', en:'Fabricated', ru:'Выдуманный', ar:'موضوع', tr:'Uydurma' },
        { az:'Həsən', en:'Good', ru:'Хороший', ar:'حسن', tr:'Hasen' }
      ], correct: 1
    },
    {
      q: { az:'Hz. Peyğəmbərin (s.a.s) ilk vəhy aldığı yer?', en:'Where did Prophet Muhammad (PBUH) receive the first revelation?', ru:'Где Пророк Мухаммад (мир ему) получил первое откровение?', ar:'أين تلقى النبي ﷺ أول وحي؟', tr:'Hz. Peygamber (s.a.s) ilk vahyi nerede aldı?' },
      options: [
        { az:'Məscidül-Həram', en:'Masjid al-Haram', ru:'Масджид аль-Харам', ar:'المسجد الحرام', tr:'Mescid-i Haram' },
        { az:'Hira mağarası', en:'Cave of Hira', ru:'Пещера Хира', ar:'غار حراء', tr:'Hira Mağarası' },
        { az:'Sevr mağarası', en:'Cave of Thawr', ru:'Пещера Саур', ar:'غار ثور', tr:'Sevr Mağarası' },
        { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة', tr:'Medine' }
      ], correct: 1
    },
    {
      q: { az:'Peyğəmbərimizin (s.a.s) neçə qızı olub?', en:'How many daughters did Prophet Muhammad (PBUH) have?', ru:'Сколько дочерей было у Пророка Мухаммада (мир ему)?', ar:'كم عدد بنات النبي ﷺ؟', tr:'Hz. Peygamber (s.a.s) kaç kızı vardı?' },
      options: ['2','3','4','5'], correct: 2
    },
    {
      q: { az:'Səhih əl-Buxaridə təxminən neçə hədis var?', en:'Approximately how many hadiths are in Sahih al-Bukhari?', ru:'Сколько примерно хадисов в Сахих аль-Бухари?', ar:'كم عدد الأحاديث في صحيح البخاري تقريباً؟', tr:'Sahih-i Buhari\'de yaklaşık kaç hadis vardır?' },
      options: ['3000','5000','7563','10000'], correct: 2
    },
    {
      q: { az:'"Səhih Muslim" kitabını kim toplamışdır?', en:'Who compiled "Sahih Muslim"?', ru:'Кто составил «Сахих Муслим»?', ar:'من جمع صحيح مسلم؟', tr:'"Sahih-i Müslim"i kim derlemiştir?' },
      options: [
        { az:'İmam Buxari', en:'Imam Bukhari', ru:'Имам Бухари', ar:'الإمام البخاري', tr:'İmam Buhari' },
        { az:'İmam Muslim', en:'Imam Muslim', ru:'Имам Муслим', ar:'الإمام مسلم', tr:'İmam Müslim' },
        { az:'İmam Malik', en:'Imam Malik', ru:'Имам Малик', ar:'الإمام مالك', tr:'İmam Malik' },
        { az:'İmam Nəsai', en:'Imam Nasai', ru:'Имам Насаи', ar:'الإمام النسائي', tr:'İmam Nesai' }
      ], correct: 1
    },
    {
      q: { az:'Hədis elmində "həsən" nə deməkdir?', en:'What does "hasan" mean in hadith terminology?', ru:'Что означает «хасан» в терминологии хадисов?', ar:'ما معنى "حسن" في مصطلح الحديث؟', tr:'Hadis ilminde "hasen" ne demektir?' },
      options: [
        { az:'Səhih', en:'Authentic', ru:'Достоверный', ar:'صحيح', tr:'Sahih' },
        { az:'Yaxşı', en:'Good', ru:'Хороший', ar:'جيد', tr:'İyi' },
        { az:'Zəif', en:'Weak', ru:'Слабый', ar:'ضعيف', tr:'Zayıf' },
        { az:'Uydurma', en:'Fabricated', ru:'Выдуманный', ar:'موضوع', tr:'Uydurma' }
      ], correct: 1
    },
    {
      q: { az:'Hədis elmində "zəif" nə deməkdir?', en:'What does "da\'if" mean in hadith science?', ru:'Что означает «даиф» в науке о хадисах?', ar:'ما معنى "ضعيف" في علم الحديث؟', tr:'Hadis ilminde "zayıf" ne demektir?' },
      options: [
        { az:'Etibarlı', en:'Reliable', ru:'Надёжный', ar:'موثوق', tr:'Güvenilir' },
        { az:'Yaxşı', en:'Good', ru:'Хороший', ar:'جيد', tr:'İyi' },
        { az:'Zəif', en:'Weak', ru:'Слабый', ar:'ضعيف', tr:'Zayıf' },
        { az:'Müstəqil', en:'Independent', ru:'Независимый', ar:'مستقل', tr:'Bağımsız' }
      ], correct: 2
    },
    {
      q: { az:'Hədis elmində "isnad" nədir?', en:'What is "isnad" in hadith science?', ru:'Что такое «иснад» в науке о хадисах?', ar:'ما هو الإسناد في علم الحديث؟', tr:'Hadis ilminde "isnad" nedir?' },
      options: [
        { az:'Hədisin mətni', en:'The text of the hadith', ru:'Текст хадиса', ar:'متن الحديث', tr:'Hadisin metni' },
        { az:'Rəvayət zənciri', en:'Chain of narration', ru:'Цепочка передатчиков', ar:'سلسلة الرواة', tr:'Rivayet zinciri' },
        { az:'Hədisin mövzusu', en:'The topic of the hadith', ru:'Тема хадиса', ar:'موضوع الحديث', tr:'Hadisin konusu' },
        { az:'Hədisin hökmu', en:'The ruling of the hadith', ru:'Решение хадиса', ar:'حكم الحديث', tr:'Hadisin hükmü' }
      ], correct: 1
    },
    {
      q: { az:'Ən çox hədis rəvayət edən səhabə kimdir?', en:'Which companion narrated the most hadiths?', ru:'Какой сподвижник передал больше всего хадисов?', ar:'من هو الصحابي الأكثر رواية للحديث؟', tr:'En çok hadis rivayet eden sahabe kimdir?' },
      options: [
        { az:'Hz. Ömər', en:'Umar ibn al-Khattab', ru:'Умар ибн аль-Хаттаб', ar:'عمر بن الخطاب', tr:'Hz. Ömer' },
        { az:'Hz. Aişə', en:'Aisha', ru:'Аиша', ar:'عائشة', tr:'Hz. Aişe' },
        { az:'Əbu Hüreyrə', en:'Abu Hurairah', ru:'Абу Хурайра', ar:'أبو هريرة', tr:'Ebu Hüreyre' },
        { az:'Hz. Əli', en:'Ali ibn Abi Talib', ru:'Али ибн Абу Талиб', ar:'علي بن أبي طالب', tr:'Hz. Ali' }
      ], correct: 2
    },
    {
      q: { az:'"Hədis Qüdsi" nədir?', en:'What is a "Hadith Qudsi"?', ru:'Что такое «Хадис Кудси»?', ar:'ما هو الحديث القدسي؟', tr:'"Hadis-i Kudsi" nedir?' },
      options: [
        { az:'Peyğəmbərin öz sözü', en:'Prophet\'s own words', ru:'Собственные слова Пророка', ar:'كلام النبي', tr:'Peygamberin kendi sözü' },
        { az:'Allahdan Peyğəmbərin dili ilə rəvayət olunan hədis', en:'Words from Allah narrated by the Prophet', ru:'Слова от Аллаха, переданные Пророком', ar:'كلام الله على لسان النبي', tr:'Allah\'tan Peygamberin diliyle aktarılan hadis' },
        { az:'Quran ayəsi', en:'A Quranic verse', ru:'Аят Корана', ar:'آية قرآنية', tr:'Kuran ayeti' },
        { az:'Uydurma hədis', en:'A fabricated hadith', ru:'Выдуманный хадис', ar:'حديث موضوع', tr:'Uydurma hadis' }
      ], correct: 1
    },
    {
      q: { az:'"İslam beş əsas üzərində qurulmuşdur" hədisi hansı topluda keçir?', en:'The hadith "Islam is built on five" is from which collection?', ru:'Хадис «Ислам построен на пяти» из какого сборника?', ar:'حديث «بني الإسلام على خمس» في أي كتاب؟', tr:'"İslam beş esas üzerine kurulmuştur" hadisi hangi eserdedir?' },
      options: [
        { az:'Sünən Əbu Davud', en:'Sunan Abu Dawud', ru:'Сунан Абу Дауд', ar:'سنن أبي داود', tr:'Sünen Ebu Davud' },
        { az:'Səhih Buxari', en:'Sahih Bukhari', ru:'Сахих Бухари', ar:'صحيح البخاري', tr:'Sahih-i Buhari' },
        { az:'Sünən İbn Macə', en:'Sunan Ibn Majah', ru:'Сунан Ибн Маджа', ar:'سنن ابن ماجه', tr:'Sünen İbn Mace' },
        { az:'Müsnəd Əhməd', en:'Musnad Ahmad', ru:'Муснад Ахмад', ar:'مسند أحمد', tr:'Müsned Ahmed' }
      ], correct: 1
    },
    {
      q: { az:'"Əməllər niyyətlərə görədir" Buxaridə neçənci hədisdir?', en:'What is the hadith number of "Actions are by intentions" in Bukhari?', ru:'Какой номер хадиса «Дела по намерениям» в Бухари?', ar:'ما رقم حديث «إنما الأعمال بالنيات» في البخاري؟', tr:'"Ameller niyetlere göredir" Buhari\'de kaçıncı hadistir?' },
      options: ['1','7','40','99'], correct: 0
    },
    {
      q: { az:'"Müvəttə" kitabını kim toplamışdır?', en:'Who compiled "Al-Muwatta"?', ru:'Кто составил «Аль-Муватта»?', ar:'من ألّف الموطأ؟', tr:'"Muvatta" kitabını kim derlemiştir?' },
      options: [
        { az:'İmam Şafii', en:'Imam Shafi\'i', ru:'Имам Шафии', ar:'الإمام الشافعي', tr:'İmam Şafii' },
        { az:'İmam Malik', en:'Imam Malik', ru:'Имам Малик', ar:'الإمام مالك', tr:'İmam Malik' },
        { az:'İmam Əhməd', en:'Imam Ahmad', ru:'Имам Ахмад', ar:'الإمام أحمد', tr:'İmam Ahmed' },
        { az:'İmam Buxari', en:'Imam Bukhari', ru:'Имам Бухари', ar:'الإمام البخاري', tr:'İmam Buhari' }
      ], correct: 1
    },
    {
      q: { az:'Sünən ət-Tirmizidə təxminən neçə hədis var?', en:'Approximately how many hadiths are in Sunan at-Tirmidhi?', ru:'Сколько примерно хадисов в Сунан ат-Тирмизи?', ar:'كم عدد الأحاديث في سنن الترمذي تقريباً؟', tr:'Sünen et-Tirmizi\'de yaklaşık kaç hadis vardır?' },
      options: ['1500','2500','3956','6000'], correct: 2
    },
    {
      q: { az:'"Mütəvatir" hədis nədir?', en:'What is a "mutawatir" hadith?', ru:'Что такое «мутаватир» хадис?', ar:'ما هو الحديث المتواتر؟', tr:'"Mütevatir" hadis nedir?' },
      options: [
        { az:'Bir nəfərin rəvayət etdiyi', en:'Narrated by one person', ru:'Переданный одним человеком', ar:'رواه شخص واحد', tr:'Bir kişinin rivayet ettiği' },
        { az:'Çox sayda rəvayətçinin rəvayət etdiyi', en:'Narrated by a large number of narrators', ru:'Переданный большим числом передатчиков', ar:'رواه عدد كبير من الرواة', tr:'Çok sayıda ravinin rivayet ettiği' },
        { az:'Zəif rəvayət', en:'A weak narration', ru:'Слабое повествование', ar:'رواية ضعيفة', tr:'Zayıf rivayet' },
        { az:'Uydurma rəvayət', en:'A fabricated narration', ru:'Выдуманное повествование', ar:'رواية موضوعة', tr:'Uydurma rivayet' }
      ], correct: 1
    },
    {
      q: { az:'Hz. Peyğəmbərin (s.a.s) ilk xanımı kim idi?', en:'Who was the first wife of Prophet Muhammad (PBUH)?', ru:'Кто была первой женой Пророка Мухаммада (мир ему)?', ar:'من كانت أول زوجة للنبي ﷺ؟', tr:'Hz. Peygamber (s.a.s) ilk eşi kimdi?' },
      options: [
        { az:'Hz. Aişə', en:'Aisha', ru:'Аиша', ar:'عائشة', tr:'Hz. Aişe' },
        { az:'Hz. Xədicə', en:'Khadijah', ru:'Хадиджа', ar:'خديجة', tr:'Hz. Hatice' },
        { az:'Hz. Hafsa', en:'Hafsa', ru:'Хафса', ar:'حفصة', tr:'Hz. Hafsa' },
        { az:'Hz. Zeynəb', en:'Zaynab', ru:'Зайнаб', ar:'زينب', tr:'Hz. Zeynep' }
      ], correct: 1
    },
    {
      q: { az:'İslamın birinci xəlifəsi kimdir?', en:'Who was the first Caliph of Islam?', ru:'Кто был первым халифом Ислама?', ar:'من هو أول خليفة في الإسلام؟', tr:'İslamın ilk halifesi kimdir?' },
      options: [
        { az:'Hz. Ömər', en:'Umar', ru:'Умар', ar:'عمر', tr:'Hz. Ömer' },
        { az:'Hz. Osman', en:'Uthman', ru:'Усман', ar:'عثمان', tr:'Hz. Osman' },
        { az:'Hz. Əbu Bəkr', en:'Abu Bakr', ru:'Абу Бакр', ar:'أبو بكر', tr:'Hz. Ebu Bekir' },
        { az:'Hz. Əli', en:'Ali', ru:'Али', ar:'علي', tr:'Hz. Ali' }
      ], correct: 2
    },
    {
      q: { az:'Quranı ilk dəfə kitab halında toplayan xəlifə?', en:'Which Caliph first compiled the Quran into a book?', ru:'Какой халиф первым собрал Коран в книгу?', ar:'أي خليفة جمع القرآن في مصحف لأول مرة؟', tr:'Kuranı ilk kitap haline getiren halife kimdir?' },
      options: [
        { az:'Hz. Ömər', en:'Umar', ru:'Умар', ar:'عمر', tr:'Hz. Ömer' },
        { az:'Hz. Əbu Bəkr', en:'Abu Bakr', ru:'Абу Бакр', ar:'أبو بكر', tr:'Hz. Ebu Bekir' },
        { az:'Hz. Osman', en:'Uthman', ru:'Усман', ar:'عثمان', tr:'Hz. Osman' },
        { az:'Hz. Əli', en:'Ali', ru:'Али', ar:'علي', tr:'Hz. Ali' }
      ], correct: 1
    },
    {
      q: { az:'"40 hədis" kitabını kim yazmışdır?', en:'Who wrote the "40 Hadith" collection?', ru:'Кто написал сборник «40 хадисов»?', ar:'من ألّف كتاب الأربعين حديثاً؟', tr:'"40 Hadis" kitabını kim yazmıştır?' },
      options: [
        { az:'İmam Buxari', en:'Imam Bukhari', ru:'Имам Бухари', ar:'الإمام البخاري', tr:'İmam Buhari' },
        { az:'İmam Nəvəvi', en:'Imam Nawawi', ru:'Имам Навави', ar:'الإمام النووي', tr:'İmam Nevevi' },
        { az:'İmam Muslim', en:'Imam Muslim', ru:'Имам Муслим', ar:'الإمام مسلم', tr:'İmam Müslim' },
        { az:'İmam Əhməd', en:'Imam Ahmad', ru:'Имам Ахмад', ar:'الإمام أحمد', tr:'İmam Ahmed' }
      ], correct: 1
    },
    {
      q: { az:'Hz. Peyğəmbərin (s.a.s) hicrət etdiyi şəhər?', en:'To which city did Prophet Muhammad (PBUH) migrate?', ru:'В какой город совершил хиджру Пророк Мухаммад (мир ему)?', ar:'إلى أي مدينة هاجر النبي ﷺ؟', tr:'Hz. Peygamber (s.a.s) hangi şehre hicret etti?' },
      options: [
        { az:'Taif', en:'Taif', ru:'Таиф', ar:'الطائف', tr:'Taif' },
        { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة', tr:'Medine' },
        { az:'Beytül-Müqəddəs', en:'Jerusalem', ru:'Иерусалим', ar:'القدس', tr:'Kudüs' },
        { az:'Dəməşq', en:'Damascus', ru:'Дамаск', ar:'دمشق', tr:'Şam' }
      ], correct: 1
    },
    {
      q: { az:'İslamda ilk azan verən kimdir?', en:'Who was the first muezzin in Islam?', ru:'Кто был первым муэдзином в Исламе?', ar:'من أول مؤذن في الإسلام؟', tr:'İslamda ilk müezzin kimdir?' },
      options: [
        { az:'Hz. Bilal', en:'Bilal ibn Rabah', ru:'Билял ибн Рабах', ar:'بلال بن رباح', tr:'Hz. Bilal' },
        { az:'Hz. Ömər', en:'Umar', ru:'Умар', ar:'عمر', tr:'Hz. Ömer' },
        { az:'Hz. Əbu Bəkr', en:'Abu Bakr', ru:'Абу Бакр', ar:'أبو بكر', tr:'Hz. Ebu Bekir' },
        { az:'Hz. Osman', en:'Uthman', ru:'Усман', ar:'عثمان', tr:'Hz. Osman' }
      ], correct: 0
    },
    {
      q: { az:'Beş vaxt namaz hansı gecə fərz olunmuşdur?', en:'On which night were the five daily prayers made obligatory?', ru:'В какую ночь были предписаны пять ежедневных молитв?', ar:'في أي ليلة فُرضت الصلوات الخمس؟', tr:'Beş vakit namaz hangi gece farz kılınmıştır?' },
      options: [
        { az:'Qədr gecəsi', en:'Laylat al-Qadr', ru:'Ночь Предопределения', ar:'ليلة القدر', tr:'Kadir Gecesi' },
        { az:'Merac gecəsi', en:'Isra and Mi\'raj', ru:'Ночь Исра и Мирадж', ar:'ليلة الإسراء والمعراج', tr:'Miraç Gecesi' },
        { az:'Bərat gecəsi', en:'Laylat al-Bara\'ah', ru:'Ночь Бараат', ar:'ليلة البراءة', tr:'Berat Gecesi' },
        { az:'Rəğaib gecəsi', en:'Laylat al-Raghaib', ru:'Ночь Рагаиб', ar:'ليلة الرغائب', tr:'Regaib Gecesi' }
      ], correct: 1
    },
    {
      q: { az:'Ramazan ayında hansı ibadət fərzdir?', en:'Which act of worship is obligatory in Ramadan?', ru:'Какое поклонение обязательно в Рамадан?', ar:'أي عبادة فرض في رمضان؟', tr:'Ramazan ayında hangi ibadet farzdır?' },
      options: [
        { az:'Həcc', en:'Hajj', ru:'Хадж', ar:'الحج', tr:'Hac' },
        { az:'Zəkat', en:'Zakat', ru:'Закят', ar:'الزكاة', tr:'Zekat' },
        { az:'Oruc', en:'Fasting', ru:'Пост', ar:'الصيام', tr:'Oruç' },
        { az:'Qurban', en:'Sacrifice', ru:'Жертвоприношение', ar:'الأضحية', tr:'Kurban' }
      ], correct: 2
    },
    {
      q: { az:'Hədis elmində "mövzu" hədis nədir?', en:'What is a "mawdu" hadith?', ru:'Что такое «мавду» хадис?', ar:'ما هو الحديث الموضوع؟', tr:'"Mevzu" hadis nedir?' },
      options: [
        { az:'Etibarlı hədis', en:'Authentic hadith', ru:'Достоверный хадис', ar:'حديث صحيح', tr:'Sahih hadis' },
        { az:'Yaxşı hədis', en:'Good hadith', ru:'Хороший хадис', ar:'حديث حسن', tr:'Hasen hadis' },
        { az:'Zəif hədis', en:'Weak hadith', ru:'Слабый хадис', ar:'حديث ضعيف', tr:'Zayıf hadis' },
        { az:'Uydurma hədis', en:'Fabricated hadith', ru:'Выдуманный хадис', ar:'حديث موضوع', tr:'Uydurma hadis' }
      ], correct: 3
    },
    {
      q: { az:'Hz. Peyğəmbərin (s.a.s) əmisi oğlu və kürəkəni kimdir?', en:'Who was Prophet Muhammad\'s (PBUH) cousin and son-in-law?', ru:'Кто был двоюродным братом и зятем Пророка Мухаммада (мир ему)?', ar:'من هو ابن عم النبي ﷺ وصهره؟', tr:'Hz. Peygamber\'in (s.a.s) amca oğlu ve damadı kimdir?' },
      options: [
        { az:'Hz. Ömər', en:'Umar', ru:'Умар', ar:'عمر', tr:'Hz. Ömer' },
        { az:'Hz. Osman', en:'Uthman', ru:'Усман', ar:'عثمان', tr:'Hz. Osman' },
        { az:'Hz. Əli', en:'Ali', ru:'Али', ar:'علي', tr:'Hz. Ali' },
        { az:'Hz. Əbu Bəkr', en:'Abu Bakr', ru:'Абу Бакр', ar:'أبو بكر', tr:'Hz. Ebu Bekir' }
      ], correct: 2
    },
    {
      q: { az:'Hədis elmində "mürsel" hədis nədir?', en:'What is a "mursal" hadith?', ru:'Что такое «мурсаль» хадис?', ar:'ما هو الحديث المرسل؟', tr:'"Mürsel" hadis nedir?' },
      options: [
        { az:'Səhabə atlanan hədis', en:'A hadith where the companion is omitted from chain', ru:'Хадис, в цепочке которого пропущен сподвижник', ar:'حديث سقط منه الصحابي', tr:'Sahabenin atlandığı hadis' },
        { az:'Çox rəvayətçili hədis', en:'A hadith with many narrators', ru:'Хадис со многими передатчиками', ar:'حديث كثير الرواة', tr:'Çok ravili hadis' },
        { az:'Peyğəmbərin öz sözü', en:'Prophet\'s own saying', ru:'Собственное высказывание Пророка', ar:'قول النبي', tr:'Peygamberin kendi sözü' },
        { az:'Uydurma hədis', en:'A fabricated hadith', ru:'Выдуманный хадис', ar:'حديث موضوع', tr:'Uydurma hadis' }
      ], correct: 0
    },
  ],
  names: [
    {
      q: { az:'"Ər-Rəhman" adının mənası nədir?', en:'What does "Ar-Rahman" mean?', ru:'Что означает «Ар-Рахман»?', ar:'ما معنى "الرحمن"؟', tr:'"Er-Rahman" ne anlama gelir?' },
      options: [
        { az:'Çox Rəhimli', en:'The Most Gracious', ru:'Всемилостивый', ar:'الرحيم', tr:'Çok Merhametli' },
        { az:'Hökmdar', en:'The King', ru:'Царь', ar:'الملك', tr:'Hükümdar' },
        { az:'Yaradan', en:'The Creator', ru:'Творец', ar:'الخالق', tr:'Yaratan' },
        { az:'Hər şeyi bilən', en:'The All-Knowing', ru:'Всезнающий', ar:'العليم', tr:'Her şeyi bilen' }
      ], correct: 0
    },
    {
      q: { az:'"Əl-Malik" adının mənası nədir?', en:'What does "Al-Malik" mean?', ru:'Что означает «Аль-Малик»?', ar:'ما معنى "الملك"؟', tr:'"El-Melik" ne anlama gelir?' },
      options: [
        { az:'Müqəddəs', en:'The Holy', ru:'Священный', ar:'القدوس', tr:'Kutsal' },
        { az:'Hökmdar', en:'The King', ru:'Царь', ar:'الملك', tr:'Hükümdar' },
        { az:'Salam', en:'Peace', ru:'Мир', ar:'السلام', tr:'Barış' },
        { az:'Qoruyan', en:'The Protector', ru:'Защитник', ar:'المهيمن', tr:'Koruyucu' }
      ], correct: 1
    },
    {
      q: { az:'Allahın "Əl-Ğaffar" adı nəyi bildirir?', en:'What does "Al-Ghaffar" mean?', ru:'Что означает «Аль-Гаффар»?', ar:'ما معنى "الغفار"؟', tr:'"El-Gaffar" ne anlama gelir?' },
      options: [
        { az:'Çox Bağışlayan', en:'The Ever-Forgiving', ru:'Всепрощающий', ar:'كثير المغفرة', tr:'Çok Bağışlayan' },
        { az:'Qalib Gələn', en:'The Subduer', ru:'Покоряющий', ar:'القاهر', tr:'Galip Gelen' },
        { az:'Çox Bəxş Edən', en:'The Bestower', ru:'Щедродарящий', ar:'الوهاب', tr:'Çok Bağışlayan' },
        { az:'Ruzi Verən', en:'The Provider', ru:'Дающий пропитание', ar:'الرزاق', tr:'Rızık Veren' }
      ], correct: 0
    },
    {
      q: { az:'Allahın adlarından hansı "İşıq" mənasını verir?', en:'Which Name of Allah means "The Light"?', ru:'Какое имя Аллаха означает «Свет»?', ar:'أي اسم من أسماء الله يعني "النور"؟', tr:'Allah\'ın isimlerinden hangisi "Nur" anlamına gelir?' },
      options: [
        { az:'Əl-Hadi', en:'Al-Hadi', ru:'Аль-Хади', ar:'الهادي', tr:'El-Hadi' },
        { az:'Ən-Nur', en:'An-Nur', ru:'Ан-Нур', ar:'النور', tr:'En-Nur' },
        { az:'Əl-Bəsir', en:'Al-Basir', ru:'Аль-Басир', ar:'البصير', tr:'El-Basir' },
        { az:'Əl-Əlim', en:'Al-Alim', ru:'Аль-Алим', ar:'العليم', tr:'El-Alim' }
      ], correct: 1
    },
    {
      q: { az:'Allahın 99 adı haqqında hansı surədə bəhs edilir?', en:'In which surah are the 99 Names mentioned?', ru:'В какой суре упоминаются 99 имён?', ar:'في أي سورة ذُكرت الأسماء الحسنى؟', tr:'99 İsim hangi surede geçer?' },
      options: [
        { az:'Bəqərə', en:'Al-Baqarah', ru:'Аль-Бакара', ar:'البقرة', tr:'Bakara' },
        { az:'Əraf', en:'Al-A\'raf', ru:'Аль-Араф', ar:'الأعراف', tr:'A\'raf' },
        { az:'Həşr', en:'Al-Hashr', ru:'Аль-Хашр', ar:'الحشر', tr:'Haşr' },
        { az:'İsra', en:'Al-Isra', ru:'Аль-Исра', ar:'الإسراء', tr:'İsra' }
      ], correct: 2
    },
    {
      q: { az:'"Əs-Saməd" adının mənası nədir?', en:'What does "As-Samad" mean?', ru:'Что означает «Ас-Самад»?', ar:'ما معنى "الصمد"؟', tr:'"Es-Samed" ne anlama gelir?' },
      options: [
        { az:'Əbədi', en:'The Eternal', ru:'Вечный', ar:'الأبدي', tr:'Ebedi' },
        { az:'Ehtiyacsız', en:'The Self-Sufficient', ru:'Самодостаточный', ar:'الغني عن كل شيء', tr:'Hiçbir şeye muhtaç olmayan' },
        { az:'Birinci', en:'The First', ru:'Первый', ar:'الأول', tr:'İlk' },
        { az:'Son', en:'The Last', ru:'Последний', ar:'الآخر', tr:'Son' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Xaliq" adı nəyi bildirir?', en:'What does "Al-Khaliq" mean?', ru:'Что означает «Аль-Халик»?', ar:'ما معنى "الخالق"؟', tr:'"El-Halık" ne anlama gelir?' },
      options: [
        { az:'Ruzi Verən', en:'The Provider', ru:'Дающий пропитание', ar:'الرزاق', tr:'Rızık Veren' },
        { az:'Yaradan', en:'The Creator', ru:'Творец', ar:'الخالق', tr:'Yaratan' },
        { az:'Şəkilverən', en:'The Fashioner', ru:'Дающий облик', ar:'المصور', tr:'Şekil Veren' },
        { az:'Hər şeyi bilən', en:'The All-Knowing', ru:'Всезнающий', ar:'العليم', tr:'Her şeyi bilen' }
      ], correct: 1
    },
    {
      q: { az:'Allahın "Əl-Vəhhab" adı nəyi ifadə edir?', en:'What does "Al-Wahhab" mean?', ru:'Что означает «Аль-Ваххаб»?', ar:'ما معنى "الوهاب"؟', tr:'"El-Vehhab" ne anlama gelir?' },
      options: [
        { az:'Hökmdar', en:'The King', ru:'Царь', ar:'الملك', tr:'Hükümdar' },
        { az:'Çox Bəxş Edən', en:'The Bestower', ru:'Щедро Дарующий', ar:'كثير العطاء', tr:'Çok Bağışlayan' },
        { az:'Açan', en:'The Opener', ru:'Открывающий', ar:'الفتاح', tr:'Açan' },
        { az:'Tutan', en:'The Restrainer', ru:'Сжимающий', ar:'القابض', tr:'Sıkan' }
      ], correct: 1
    },
    {
      q: { az:'Allahın "Əl-Həyy" adı nəyi bildirir?', en:'What does "Al-Hayy" mean?', ru:'Что означает «Аль-Хайй»?', ar:'ما معنى "الحي"؟', tr:'"El-Hayy" ne anlama gelir?' },
      options: [
        { az:'Hər şeyi görən', en:'The All-Seeing', ru:'Всевидящий', ar:'البصير', tr:'Her şeyi gören' },
        { az:'Hər şeyi eşidən', en:'The All-Hearing', ru:'Всеслышащий', ar:'السميع', tr:'Her şeyi duyan' },
        { az:'Diri Olan', en:'The Ever-Living', ru:'Живой', ar:'الحي الدائم', tr:'Daima Diri' },
        { az:'Qadir Olan', en:'The All-Powerful', ru:'Всемогущий', ar:'القادر', tr:'Her şeye Kadir' }
      ], correct: 2
    },
    {
      q: { az:'Allahın "Əl-Vəkil" adının mənası nədir?', en:'What does "Al-Wakil" mean?', ru:'Что означает «Аль-Вакиль»?', ar:'ما معنى "الوكيل"؟', tr:'"El-Vekil" ne anlama gelir?' },
      options: [
        { az:'Şahid', en:'The Witness', ru:'Свидетель', ar:'الشهيد', tr:'Şahit' },
        { az:'Haqq', en:'The Truth', ru:'Истинный', ar:'الحق', tr:'Hak' },
        { az:'Vəkil / İşləri idarə edən', en:'The Trustee / Disposer of Affairs', ru:'Попечитель / Распорядитель дел', ar:'الوكيل / المتصرف بالأمور', tr:'Vekil / İşleri Yöneten' },
        { az:'Güclü', en:'The Strong', ru:'Сильный', ar:'القوي', tr:'Güçlü' }
      ], correct: 2
    },
    {
      q: { az:'"Əl-Quddus" adının mənası nədir?', en:'What does "Al-Quddus" mean?', ru:'Что означает «Аль-Куддус»?', ar:'ما معنى "القدوس"؟', tr:'"El-Kuddüs" ne anlama gelir?' },
      options: [
        { az:'Salam / Barış', en:'The Peace', ru:'Мир', ar:'السلام', tr:'Barış' },
        { az:'Müqəddəs', en:'The Holy', ru:'Святой', ar:'القدوس', tr:'Kutsal' },
        { az:'Mömin', en:'The Faithful', ru:'Верный', ar:'المؤمن', tr:'İnanan' },
        { az:'Qoruyucu', en:'The Protector', ru:'Защитник', ar:'المهيمن', tr:'Koruyucu' }
      ], correct: 1
    },
    {
      q: { az:'"Əs-Salam" adının mənası nədir?', en:'What does "As-Salam" mean?', ru:'Что означает «Ас-Салам»?', ar:'ما معنى "السلام"؟', tr:'"Es-Selam" ne anlama gelir?' },
      options: [
        { az:'Müqəddəs', en:'The Holy', ru:'Святой', ar:'القدوس', tr:'Kutsal' },
        { az:'Salam / Barış', en:'The Peace / The Source of Peace', ru:'Мир / Источник мира', ar:'السلام / مصدر السلام', tr:'Barış / Selamet Veren' },
        { az:'Mömin', en:'The Faithful', ru:'Верный', ar:'المؤمن', tr:'İnanan' },
        { az:'Əziz', en:'The Mighty', ru:'Могущественный', ar:'العزيز', tr:'Güçlü' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Əziz" adının mənası nədir?', en:'What does "Al-Aziz" mean?', ru:'Что означает «Аль-Азиз»?', ar:'ما معنى "العزيز"؟', tr:'"El-Aziz" ne anlama gelir?' },
      options: [
        { az:'Yaradan', en:'The Creator', ru:'Творец', ar:'الخالق', tr:'Yaratan' },
        { az:'Qadir', en:'The Powerful', ru:'Могущий', ar:'القادر', tr:'Kadir' },
        { az:'Güclü / Yenilməz', en:'The Mighty / The Almighty', ru:'Могущественный / Всемогущий', ar:'العزيز / الذي لا يُغلب', tr:'Güçlü / Yenilmez' },
        { az:'Böyük', en:'The Great', ru:'Великий', ar:'الكبير', tr:'Büyük' }
      ], correct: 2
    },
    {
      q: { az:'"Əl-Cəbbar" adının mənası nədir?', en:'What does "Al-Jabbar" mean?', ru:'Что означает «Аль-Джаббар»?', ar:'ما معنى "الجبار"؟', tr:'"El-Cebbar" ne anlama gelir?' },
      options: [
        { az:'Böyüklük sahibi', en:'The Supreme', ru:'Высочайший', ar:'المتعالي', tr:'Yüce' },
        { az:'Qəhhar', en:'The Subduer', ru:'Покоряющий', ar:'القهار', tr:'Kahhar' },
        { az:'Məcbur edən / Düzəldən', en:'The Compeller / The Restorer', ru:'Принуждающий / Исправляющий', ar:'الجبار / المُصلح', tr:'Zorlayan / Düzelten' },
        { az:'Mütəkəbbir', en:'The Majestic', ru:'Величественный', ar:'المتكبر', tr:'Kibriya sahibi' }
      ], correct: 2
    },
    {
      q: { az:'"Ər-Rəzzaq" adının mənası nədir?', en:'What does "Ar-Razzaq" mean?', ru:'Что означает «Ар-Раззак»?', ar:'ما معنى "الرزاق"؟', tr:'"Er-Rezzak" ne anlama gelir?' },
      options: [
        { az:'Açan', en:'The Opener', ru:'Открывающий', ar:'الفتاح', tr:'Açan' },
        { az:'Hər şeyi bilən', en:'The All-Knowing', ru:'Всезнающий', ar:'العليم', tr:'Her şeyi bilen' },
        { az:'Ruzi verən', en:'The Provider', ru:'Дающий пропитание', ar:'الرزاق', tr:'Rızık veren' },
        { az:'Sıxan', en:'The Restrainer', ru:'Сжимающий', ar:'القابض', tr:'Sıkan' }
      ], correct: 2
    },
    {
      q: { az:'"Əl-Əlim" adının mənası nədir?', en:'What does "Al-Alim" mean?', ru:'Что означает «Аль-Алим»?', ar:'ما معنى "العليم"؟', tr:'"El-Alim" ne anlama gelir?' },
      options: [
        { az:'Hər şeyi eşidən', en:'The All-Hearing', ru:'Всеслышащий', ar:'السميع', tr:'Her şeyi duyan' },
        { az:'Hər şeyi bilən', en:'The All-Knowing', ru:'Всезнающий', ar:'العليم', tr:'Her şeyi bilen' },
        { az:'Hər şeyi görən', en:'The All-Seeing', ru:'Всевидящий', ar:'البصير', tr:'Her şeyi gören' },
        { az:'Hikmət sahibi', en:'The Wise', ru:'Мудрый', ar:'الحكيم', tr:'Hikmet sahibi' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Bəsir" adının mənası nədir?', en:'What does "Al-Basir" mean?', ru:'Что означает «Аль-Басир»?', ar:'ما معنى "البصير"؟', tr:'"El-Basir" ne anlama gelir?' },
      options: [
        { az:'Hər şeyi bilən', en:'The All-Knowing', ru:'Всезнающий', ar:'العليم', tr:'Her şeyi bilen' },
        { az:'Hər şeyi eşidən', en:'The All-Hearing', ru:'Всеслышащий', ar:'السميع', tr:'Her şeyi duyan' },
        { az:'Hər şeyi görən', en:'The All-Seeing', ru:'Всевидящий', ar:'البصير', tr:'Her şeyi gören' },
        { az:'Haqq', en:'The Truth', ru:'Истинный', ar:'الحق', tr:'Hak' }
      ], correct: 2
    },
    {
      q: { az:'"Əl-Həkəm" adının mənası nədir?', en:'What does "Al-Hakam" mean?', ru:'Что означает «Аль-Хакам»?', ar:'ما معنى "الحكم"؟', tr:'"El-Hakem" ne anlama gelir?' },
      options: [
        { az:'Hikmət sahibi', en:'The Wise', ru:'Мудрый', ar:'الحكيم', tr:'Hikmet sahibi' },
        { az:'Hakim / Hökm edən', en:'The Judge', ru:'Судья', ar:'الحكم', tr:'Hakim / Hükmeden' },
        { az:'Adil', en:'The Just', ru:'Справедливый', ar:'العدل', tr:'Adil' },
        { az:'Lətif', en:'The Subtle', ru:'Утончённый', ar:'اللطيف', tr:'Latif' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Lətif" adının mənası nədir?', en:'What does "Al-Latif" mean?', ru:'Что означает «Аль-Лятиф»?', ar:'ما معنى "اللطيف"؟', tr:'"El-Latif" ne anlama gelir?' },
      options: [
        { az:'Böyük', en:'The Great', ru:'Великий', ar:'الكبير', tr:'Büyük' },
        { az:'Xəbərdar', en:'The All-Aware', ru:'Знающий всё', ar:'الخبير', tr:'Her şeyden haberdar' },
        { az:'Lütf edən / İncə', en:'The Subtle / The Kind', ru:'Добрый / Утончённый', ar:'اللطيف', tr:'Lütfeden / İnce' },
        { az:'Həlim', en:'The Forbearing', ru:'Кроткий', ar:'الحليم', tr:'Halim' }
      ], correct: 2
    },
    {
      q: { az:'"Əl-Kəbir" adının mənası nədir?', en:'What does "Al-Kabir" mean?', ru:'Что означает «Аль-Кабир»?', ar:'ما معنى "الكبير"؟', tr:'"El-Kebir" ne anlama gelir?' },
      options: [
        { az:'Yüksək', en:'The Exalted', ru:'Возвышенный', ar:'العلي', tr:'Yüce' },
        { az:'Böyük', en:'The Great / The Grand', ru:'Великий', ar:'الكبير', tr:'Büyük / Ulu' },
        { az:'Qoruyan', en:'The Preserver', ru:'Хранитель', ar:'الحفيظ', tr:'Koruyan' },
        { az:'Hesab görən', en:'The Reckoner', ru:'Считающий', ar:'الحسيب', tr:'Hesap gören' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Həfiz" adının mənası nədir?', en:'What does "Al-Hafiz" mean?', ru:'Что означает «Аль-Хафиз»?', ar:'ما معنى "الحفيظ"؟', tr:'"El-Hafiz" ne anlama gelir?' },
      options: [
        { az:'Qoruyan / Mühafizə edən', en:'The Preserver / The Protector', ru:'Хранитель / Защитник', ar:'الحفيظ / الحامي', tr:'Koruyan / Muhafaza eden' },
        { az:'Hesab görən', en:'The Reckoner', ru:'Считающий', ar:'الحسيب', tr:'Hesap gören' },
        { az:'Mərhəmətli', en:'The Merciful', ru:'Милостивый', ar:'الرحيم', tr:'Merhametli' },
        { az:'Ədalətli', en:'The Just', ru:'Справедливый', ar:'العدل', tr:'Adaletli' }
      ], correct: 0
    },
    {
      q: { az:'"Əl-Vədud" adının mənası nədir?', en:'What does "Al-Wadud" mean?', ru:'Что означает «Аль-Вадуд»?', ar:'ما معنى "الودود"؟', tr:'"El-Vedud" ne anlama gelir?' },
      options: [
        { az:'Şahid', en:'The Witness', ru:'Свидетель', ar:'الشهيد', tr:'Şahit' },
        { az:'Sevən / Məhəbbətli', en:'The Loving / The Affectionate', ru:'Любящий', ar:'الودود / المحب', tr:'Seven / Şefkatli' },
        { az:'Həmd olunan', en:'The Praiseworthy', ru:'Достохвальный', ar:'الحميد', tr:'Övülen' },
        { az:'Dirildən', en:'The Resurrector', ru:'Воскрешающий', ar:'الباعث', tr:'Dirilten' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Haqq" adının mənası nədir?', en:'What does "Al-Haqq" mean?', ru:'Что означает «Аль-Хакк»?', ar:'ما معنى "الحق"؟', tr:'"El-Hakk" ne anlama gelir?' },
      options: [
        { az:'Güclü', en:'The Strong', ru:'Сильный', ar:'القوي', tr:'Güçlü' },
        { az:'Vəkil', en:'The Trustee', ru:'Попечитель', ar:'الوكيل', tr:'Vekil' },
        { az:'Haqq / Gerçək', en:'The Truth / The Real', ru:'Истина / Истинный', ar:'الحق / الحقيقي', tr:'Hak / Gerçek' },
        { az:'Həyat verən', en:'The Giver of Life', ru:'Дающий жизнь', ar:'المحيي', tr:'Hayat veren' }
      ], correct: 2
    },
    {
      q: { az:'Allahın 99 adlarından birincisi hansıdır?', en:'What is the first of the 99 Names of Allah?', ru:'Какое первое из 99 имён Аллаха?', ar:'ما أول اسم من أسماء الله الحسنى؟', tr:'Allah\'ın 99 isminin ilki hangisidir?' },
      options: ['Ar-Rahman','Al-Malik','Allah','Al-Quddus'], correct: 2
    },
    {
      q: { az:'Allahın 99 adlarının sonuncusu hansıdır?', en:'What is the last of the 99 Names of Allah?', ru:'Какое последнее из 99 имён Аллаха?', ar:'ما آخر اسم من أسماء الله الحسنى؟', tr:'Allah\'ın 99 isminin sonuncusu hangisidir?' },
      options: [
        { az:'Əl-Varis', en:'Al-Warith', ru:'Аль-Варис', ar:'الوارث', tr:'El-Varis' },
        { az:'Ər-Rəşid', en:'Ar-Rashid', ru:'Ар-Рашид', ar:'الرشيد', tr:'Er-Reşid' },
        { az:'Əs-Sabur', en:'As-Sabur', ru:'Ас-Сабур', ar:'الصبور', tr:'Es-Sabur' },
        { az:'Ən-Nafi', en:'An-Nafi', ru:'Ан-Нафи', ar:'النافع', tr:'En-Nafi' }
      ], correct: 2
    },
    {
      q: { az:'99 ad haqqında məşhur hədisdə nə deyilir?', en:'What does the famous hadith say about the 99 Names?', ru:'Что говорится в известном хадисе о 99 именах?', ar:'ماذا يقول الحديث المشهور عن الأسماء الحسنى؟', tr:'99 İsim hakkındaki meşhur hadiste ne denir?' },
      options: [
        { az:'Onları oxuyan xəstəlikdən qorunar', en:'Whoever recites them is protected from illness', ru:'Кто их читает, защищён от болезней', ar:'من قرأها حُفظ من المرض', tr:'Onları okuyan hastalıktan korunur' },
        { az:'Onları əzbərləyən Cənnətə girər', en:'Whoever memorizes them enters Paradise', ru:'Кто их выучит, войдёт в Рай', ar:'من أحصاها دخل الجنة', tr:'Onları ezberleyen Cennete girer' },
        { az:'Onları yazan savab qazanar', en:'Whoever writes them earns reward', ru:'Кто их запишет, получит награду', ar:'من كتبها نال أجراً', tr:'Onları yazan sevap kazanır' },
        { az:'Gündə üç dəfə oxumaq lazımdır', en:'They must be recited three times daily', ru:'Их нужно читать три раза в день', ar:'يجب قراءتها ثلاث مرات يومياً', tr:'Günde üç kez okunmalıdır' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Mütəkəbbir" adının mənası nədir?', en:'What does "Al-Mutakabbir" mean?', ru:'Что означает «Аль-Мутакаббир»?', ar:'ما معنى "المتكبر"؟', tr:'"El-Mütekebbir" ne anlama gelir?' },
      options: [
        { az:'Cəbbar', en:'The Compeller', ru:'Принуждающий', ar:'الجبار', tr:'Cebbar' },
        { az:'Böyüklük sahibi / Uca', en:'The Supreme / The Majestic', ru:'Величественный / Превосходящий', ar:'المتكبر / ذو الكبرياء', tr:'Büyüklük sahibi / Yüce' },
        { az:'Yaradan', en:'The Creator', ru:'Творец', ar:'الخالق', tr:'Yaratan' },
        { az:'Şəkilverən', en:'The Fashioner', ru:'Придающий форму', ar:'المصور', tr:'Şekil veren' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Müsəvvir" adının mənası nədir?', en:'What does "Al-Musawwir" mean?', ru:'Что означает «Аль-Мусаввир»?', ar:'ما معنى "المصور"؟', tr:'"El-Musavvir" ne anlama gelir?' },
      options: [
        { az:'Yaradan', en:'The Creator', ru:'Творец', ar:'الخالق', tr:'Yaratan' },
        { az:'Çox Bağışlayan', en:'The Forgiver', ru:'Прощающий', ar:'الغفار', tr:'Bağışlayan' },
        { az:'Şəkil verən / Surət yaradan', en:'The Fashioner / The Shaper', ru:'Придающий облик / Формирующий', ar:'المصور / مُعطي الصور', tr:'Şekil veren / Suret yaratan' },
        { az:'Qalib', en:'The Prevailing', ru:'Побеждающий', ar:'القاهر', tr:'Galip' }
      ], correct: 2
    },
    {
      q: { az:'"Əl-Fəttah" adının mənası nədir?', en:'What does "Al-Fattah" mean?', ru:'Что означает «Аль-Фаттах»?', ar:'ما معنى "الفتاح"؟', tr:'"El-Fettah" ne anlama gelir?' },
      options: [
        { az:'Ruzi verən', en:'The Provider', ru:'Дающий пропитание', ar:'الرزاق', tr:'Rızık veren' },
        { az:'Açan / Fəth edən', en:'The Opener / The Revealer', ru:'Открывающий / Раскрывающий', ar:'الفتاح', tr:'Açan / Fetheden' },
        { az:'Hər şeyi bilən', en:'The All-Knowing', ru:'Всезнающий', ar:'العليم', tr:'Her şeyi bilen' },
        { az:'Sıxan', en:'The Restrainer', ru:'Сжимающий', ar:'القابض', tr:'Sıkan' }
      ], correct: 1
    },
    {
      q: { az:'"Əs-Səmi" adının mənası nədir?', en:'What does "As-Sami" mean?', ru:'Что означает «Ас-Сами»?', ar:'ما معنى "السميع"؟', tr:'"Es-Semi" ne anlama gelir?' },
      options: [
        { az:'Hər şeyi görən', en:'The All-Seeing', ru:'Всевидящий', ar:'البصير', tr:'Her şeyi gören' },
        { az:'Hər şeyi bilən', en:'The All-Knowing', ru:'Всезнающий', ar:'العليم', tr:'Her şeyi bilen' },
        { az:'Hər şeyi eşidən', en:'The All-Hearing', ru:'Всеслышащий', ar:'السميع', tr:'Her şeyi duyan' },
        { az:'Hikmət sahibi', en:'The Wise', ru:'Мудрый', ar:'الحكيم', tr:'Hikmet sahibi' }
      ], correct: 2
    },
    {
      q: { az:'"Əl-Adl" adının mənası nədir?', en:'What does "Al-Adl" mean?', ru:'Что означает «Аль-Адль»?', ar:'ما معنى "العدل"؟', tr:'"El-Adl" ne anlama gelir?' },
      options: [
        { az:'Ədalətli', en:'The Just', ru:'Справедливый', ar:'العدل', tr:'Adaletli' },
        { az:'Lətif', en:'The Subtle', ru:'Утончённый', ar:'اللطيف', tr:'Latif' },
        { az:'Xəbərdar', en:'The All-Aware', ru:'Знающий всё', ar:'الخبير', tr:'Haberdar' },
        { az:'Həlim', en:'The Forbearing', ru:'Кроткий', ar:'الحليم', tr:'Halim' }
      ], correct: 0
    },
    {
      q: { az:'"Əl-Həlim" adının mənası nədir?', en:'What does "Al-Halim" mean?', ru:'Что означает «Аль-Халим»?', ar:'ما معنى "الحليم"؟', tr:'"El-Halim" ne anlama gelir?' },
      options: [
        { az:'Böyük', en:'The Great', ru:'Великий', ar:'العظيم', tr:'Büyük' },
        { az:'Həlim / Yumuşaq xasiyyətli', en:'The Forbearing / The Clement', ru:'Кроткий / Снисходительный', ar:'الحليم', tr:'Halim / Yumuşak huylu' },
        { az:'Şükür qəbul edən', en:'The Appreciative', ru:'Благодарный', ar:'الشكور', tr:'Şükrü kabul eden' },
        { az:'Yüksək', en:'The Exalted', ru:'Возвышенный', ar:'العلي', tr:'Yüce' }
      ], correct: 1
    },
    {
      q: { az:'"Əl-Əzim" adının mənası nədir?', en:'What does "Al-Azim" mean?', ru:'Что означает «Аль-Азым»?', ar:'ما معنى "العظيم"؟', tr:'"El-Azim" ne anlama gelir?' },
      options: [
        { az:'Böyük / Əzəmətli', en:'The Magnificent / The Supreme', ru:'Великий / Величественный', ar:'العظيم', tr:'Büyük / Azametli' },
        { az:'Şükür qəbul edən', en:'The Appreciative', ru:'Благодарный', ar:'الشكور', tr:'Şükrü kabul eden' },
        { az:'Yüksək', en:'The Exalted', ru:'Возвышенный', ar:'العلي', tr:'Yüce' },
        { az:'Qoruyan', en:'The Preserver', ru:'Хранитель', ar:'الحفيظ', tr:'Koruyan' }
      ], correct: 0
    },
  ],
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getOptionText(opt, lang) {
  if (typeof opt === 'string') return opt
  return opt[lang] || opt.en || ''
}

function loadScores() {
  try {
    return JSON.parse(localStorage.getItem('quiz_scores')) || {}
  } catch { return {} }
}

function saveScore(category, score) {
  const scores = loadScores()
  if (!scores[category] || score > scores[category]) {
    scores[category] = score
    localStorage.setItem('quiz_scores', JSON.stringify(scores))
    return true
  }
  return false
}

export default function QuizPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const [phase, setPhase] = useState('categories') // categories | quiz | results
  const [category, setCategory] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)

  const questions = useMemo(() => {
    if (!category) return []
    return shuffleArray(QUESTIONS[category]).slice(0, 10)
  }, [category])

  const scores = loadScores()

  const startQuiz = (cat) => {
    setCategory(cat)
    setCurrentQ(0)
    setSelected(null)
    setAnswered(false)
    setCorrectCount(0)
    setWrongCount(0)
    setIsNewBest(false)
    setPhase('quiz')
  }

  const handleSelect = (idx) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    if (idx === questions[currentQ].correct) {
      setCorrectCount(c => c + 1)
    } else {
      setWrongCount(c => c + 1)
    }
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      const finalScore = correctCount
      const nb = saveScore(category, finalScore)
      setIsNewBest(nb)
      setPhase('results')
    } else {
      setCurrentQ(currentQ + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const handleReplay = () => {
    setPhase('categories')
    setCategory(null)
  }

  const totalQ = questions.length
  const progress = totalQ > 0 ? ((currentQ + (answered ? 1 : 0)) / totalQ) * 100 : 0

  const categoryIcons = { quran: '📖', hadith: '📜', names: '✨' }
  const categoryKeys = ['quran', 'hadith', 'names']

  // --- RENDER ---
  if (phase === 'categories') {
    return (
      <>
        <div className="page-hero theme-quiz">
          <div className="page-hero-arabic">اختبر معلوماتك الإسلامية</div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="section">
          <div className="section-inner">
            <h2 className="quiz-categories-title">{t.categories}</h2>
            <div className="quiz-categories-grid">
              {categoryKeys.map(key => (
                <button key={key} className="quiz-category-card" onClick={() => startQuiz(key)}>
                  <span className="quiz-category-icon">{categoryIcons[key]}</span>
                  <span className="quiz-category-name">{t[key]}</span>
                  <span className="quiz-category-count">
                    {QUESTIONS[key].length} {t.question.toLowerCase()}{QUESTIONS[key].length !== 1 ? '' : ''}
                  </span>
                  {scores[key] !== undefined && (
                    <span className="quiz-category-best">{t.bestScore}: {scores[key]}/{QUESTIONS[key].length}</span>
                  )}
                  <span className="quiz-category-start">{t.start} &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[currentQ]
    return (
      <>
        <div className="page-hero quiz-hero-compact">
          <h1>{t.title} — {t[category]}</h1>
        </div>
        <div className="section">
          <div className="section-inner quiz-container">
            <div className="quiz-progress-wrap">
              <div className="quiz-progress-info">
                <span>{t.question} {currentQ + 1} {t.of} {totalQ}</span>
                <span>{t.correct}: {correctCount} | {t.wrong}: {wrongCount}</span>
              </div>
              <div className="quiz-progress-bar">
                <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="quiz-question-card">
              <h3 className="quiz-question-text">{q.q[lang] || q.q.en}</h3>
              <div className="quiz-options">
                {q.options.map((opt, idx) => {
                  let cls = 'quiz-option'
                  if (answered) {
                    if (idx === q.correct) cls += ' quiz-option-correct'
                    else if (idx === selected) cls += ' quiz-option-wrong'
                  } else if (idx === selected) {
                    cls += ' quiz-option-selected'
                  }
                  return (
                    <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={answered}>
                      <span className="quiz-option-letter">{String.fromCharCode(65 + idx)}</span>
                      <span className="quiz-option-text">{getOptionText(opt, lang)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="quiz-actions">
              {answered && (
                <button className="btn-primary" onClick={handleNext}>
                  {currentQ + 1 >= totalQ ? t.finish : t.next} &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (phase === 'results') {
    const total = correctCount + wrongCount
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0
    return (
      <>
        <div className="page-hero theme-quiz">
          <h1>{t.title}</h1>
        </div>
        <div className="section">
          <div className="section-inner quiz-container">
            <div className="quiz-results-card">
              {isNewBest && <div className="quiz-new-best">{t.newBest}</div>}
              <div className="quiz-results-score">{pct}%</div>
              <div className="quiz-results-label">{t.score}</div>
              <div className="quiz-results-stats">
                <div className="quiz-stat quiz-stat-correct">
                  <span className="quiz-stat-num">{correctCount}</span>
                  <span className="quiz-stat-label">{t.correct}</span>
                </div>
                <div className="quiz-stat quiz-stat-wrong">
                  <span className="quiz-stat-num">{wrongCount}</span>
                  <span className="quiz-stat-label">{t.wrong}</span>
                </div>
                <div className="quiz-stat quiz-stat-total">
                  <span className="quiz-stat-num">{total}</span>
                  <span className="quiz-stat-label">{t.question}</span>
                </div>
              </div>
              <button className="btn-primary quiz-replay-btn" onClick={handleReplay}>
                {t.playAgain}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return null
}
