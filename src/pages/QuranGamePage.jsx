import { useState, useEffect, useCallback, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/QuranGamePage.css'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Quran Müsabiqəsi', subtitle:'Quran biliyinizi sınayın', modeComplete:'Ayəni tamamla', modeSurah:'Surəni tap', start:'Başla', next:'Növbəti', finish:'Bitir', score:'Xal', correct:'Düzgün', wrong:'Səhv', timeUp:'Vaxt bitdi!', playAgain:'Yenidən oyna', question:'Sual', of:'/', bestScore:'Ən yaxşı', newBest:'Yeni rekord!', back:'Geri', selectMode:'Oyun rejimini seçin', result:'Nəticə', complete:'Tamamla', fromSurah:'Surə:', timer:'Saniyə', chooseAnswer:'Cavabı seçin' },
  en: { title:'Quran Quiz', subtitle:'Test your Quran knowledge', modeComplete:'Complete the verse', modeSurah:'Find the surah', start:'Start', next:'Next', finish:'Finish', score:'Score', correct:'Correct', wrong:'Wrong', timeUp:'Time\'s up!', playAgain:'Play Again', question:'Question', of:'/', bestScore:'Best', newBest:'New record!', back:'Back', selectMode:'Select game mode', result:'Result', complete:'Complete', fromSurah:'Surah:', timer:'Seconds', chooseAnswer:'Choose answer' },
  ru: { title:'Викторина Корана', subtitle:'Проверьте знание Корана', modeComplete:'Завершите аят', modeSurah:'Найдите суру', start:'Начать', next:'Далее', finish:'Завершить', score:'Баллы', correct:'Правильно', wrong:'Неправильно', timeUp:'Время вышло!', playAgain:'Играть снова', question:'Вопрос', of:'/', bestScore:'Лучший', newBest:'Новый рекорд!', back:'Назад', selectMode:'Выберите режим', result:'Результат', complete:'Завершить', fromSurah:'Сура:', timer:'Секунд', chooseAnswer:'Выберите ответ' },
  ar: { title:'مسابقة القرآن', subtitle:'اختبر معرفتك بالقرآن', modeComplete:'أكمل الآية', modeSurah:'اعثر على السورة', start:'ابدأ', next:'التالي', finish:'إنهاء', score:'النقاط', correct:'صحيح', wrong:'خطأ', timeUp:'انتهى الوقت!', playAgain:'أعد اللعب', question:'سؤال', of:'/', bestScore:'الأفضل', newBest:'رقم قياسي!', back:'رجوع', selectMode:'اختر وضع اللعبة', result:'النتيجة', complete:'أكمل', fromSurah:'السورة:', timer:'ثوانٍ', chooseAnswer:'اختر الإجابة' },
  tr: { title:'Kuran Yarışması', subtitle:'Kuran bilginizi test edin', modeComplete:'Ayeti tamamla', modeSurah:'Sureyi bul', start:'Başla', next:'Sonraki', finish:'Bitir', score:'Puan', correct:'Doğru', wrong:'Yanlış', timeUp:'Süre doldu!', playAgain:'Tekrar Oyna', question:'Soru', of:'/', bestScore:'En iyi', newBest:'Yeni rekor!', back:'Geri', selectMode:'Oyun modunu seçin', result:'Sonuç', complete:'Tamamla', fromSurah:'Sure:', timer:'Saniye', chooseAnswer:'Cevabı seçin' },
}

// ── Complete the verse questions ──
const COMPLETE_QUESTIONS = [
  {
    start: 'بِسْمِ اللَّهِ',
    options: ['الرَّحْمَٰنِ الرَّحِيمِ', 'الْعَزِيزِ الْحَكِيمِ', 'رَبِّ الْعَالَمِينَ', 'الْمَلِكِ الْقُدُّوسِ'],
    correct: 0,
    fullVerse: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    surah: { az:'Fatihə 1', en:'Al-Fatiha 1', ru:'Аль-Фатиха 1', ar:'الفاتحة ١', tr:'Fatiha 1' },
  },
  {
    start: 'قُلْ هُوَ اللَّهُ',
    options: ['أَحَدٌ', 'الْوَاحِدُ', 'الصَّمَدُ', 'الْكَبِيرُ'],
    correct: 0,
    fullVerse: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    surah: { az:'İxlas 1', en:'Al-Ikhlas 1', ru:'Аль-Ихлас 1', ar:'الإخلاص ١', tr:'İhlas 1' },
  },
  {
    start: 'الْحَمْدُ لِلَّهِ',
    options: ['رَبِّ الْعَالَمِينَ', 'الْمَلِكِ الْقُدُّوسِ', 'عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', 'خَالِقِ السَّمَاوَاتِ'],
    correct: 0,
    fullVerse: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    surah: { az:'Fatihə 2', en:'Al-Fatiha 2', ru:'Аль-Фатиха 2', ar:'الفاتحة ٢', tr:'Fatiha 2' },
  },
  {
    start: 'إِيَّاكَ نَعْبُدُ',
    options: ['وَإِيَّاكَ نَسْتَعِينُ', 'وَإِيَّاكَ نَسْأَلُ', 'وَلَكَ الْحَمْدُ', 'وَعَلَيْكَ نَتَوَكَّلُ'],
    correct: 0,
    fullVerse: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    surah: { az:'Fatihə 5', en:'Al-Fatiha 5', ru:'Аль-Фатиха 5', ar:'الفاتحة ٥', tr:'Fatiha 5' },
  },
  {
    start: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
    options: ['الْحَيُّ الْقَيُّومُ', 'الْعَزِيزُ الْجَبَّارُ', 'الْغَفُورُ الرَّحِيمُ', 'السَّمِيعُ الْبَصِيرُ'],
    correct: 0,
    fullVerse: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    surah: { az:'Bəqərə 255', en:'Al-Baqarah 255', ru:'Аль-Бакара 255', ar:'البقرة ٢٥٥', tr:'Bakara 255' },
  },
  {
    start: 'قُلْ أَعُوذُ بِرَبِّ',
    options: ['الْفَلَقِ', 'النَّاسِ', 'الْعَالَمِينَ', 'السَّمَاوَاتِ'],
    correct: 0,
    fullVerse: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
    surah: { az:'Fələq 1', en:'Al-Falaq 1', ru:'Аль-Фаляк 1', ar:'الفلق ١', tr:'Felak 1' },
  },
  {
    start: 'إِذَا جَاءَ نَصْرُ اللَّهِ',
    options: ['وَالْفَتْحُ', 'وَالنُّورُ', 'وَالْهُدَىٰ', 'وَالرَّحْمَةُ'],
    correct: 0,
    fullVerse: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ',
    surah: { az:'Nəsr 1', en:'An-Nasr 1', ru:'Ан-Наср 1', ar:'النصر ١', tr:'Nasr 1' },
  },
  {
    start: 'وَالْعَصْرِ ❁ إِنَّ الْإِنسَانَ',
    options: ['لَفِي خُسْرٍ', 'لَفِي ضَلَالٍ', 'لَفِي غَفْلَةٍ', 'لَفِي نِعْمَةٍ'],
    correct: 0,
    fullVerse: 'وَالْعَصْرِ ❁ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
    surah: { az:'Əsr 1-2', en:'Al-Asr 1-2', ru:'Аль-Аср 1-2', ar:'العصر ١-٢', tr:'Asr 1-2' },
  },
  {
    start: 'إِنَّا أَعْطَيْنَاكَ',
    options: ['الْكَوْثَرَ', 'الْحِكْمَةَ', 'الْكِتَابَ', 'الْهُدَىٰ'],
    correct: 0,
    fullVerse: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
    surah: { az:'Kövsər 1', en:'Al-Kawthar 1', ru:'Аль-Каусар 1', ar:'الكوثر ١', tr:'Kevser 1' },
  },
  {
    start: 'تَبَّتْ يَدَا أَبِي لَهَبٍ',
    options: ['وَتَبَّ', 'وَخَسِرَ', 'وَهَلَكَ', 'وَضَلَّ'],
    correct: 0,
    fullVerse: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ',
    surah: { az:'Məsəd 1', en:'Al-Masad 1', ru:'Аль-Масад 1', ar:'المسد ١', tr:'Tebbet 1' },
  },
  {
    start: 'إِنَّا أَنزَلْنَاهُ فِي',
    options: ['لَيْلَةِ الْقَدْرِ', 'شَهْرِ رَمَضَانَ', 'لَيْلَةِ الْمُبَارَكَةِ', 'يَوْمِ الْجُمُعَةِ'],
    correct: 0,
    fullVerse: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ',
    surah: { az:'Qədr 1', en:'Al-Qadr 1', ru:'Аль-Кадр 1', ar:'القدر ١', tr:'Kadir 1' },
  },
  {
    start: 'أَلَمْ نَشْرَحْ لَكَ',
    options: ['صَدْرَكَ', 'قَلْبَكَ', 'أَمْرَكَ', 'دِينَكَ'],
    correct: 0,
    fullVerse: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ',
    surah: { az:'İnşirah 1', en:'Ash-Sharh 1', ru:'Аш-Шарх 1', ar:'الشرح ١', tr:'İnşirah 1' },
  },
  {
    start: 'فَإِنَّ مَعَ الْعُسْرِ',
    options: ['يُسْرًا', 'صَبْرًا', 'أَجْرًا', 'نَصْرًا'],
    correct: 0,
    fullVerse: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    surah: { az:'İnşirah 5', en:'Ash-Sharh 5', ru:'Аш-Шарх 5', ar:'الشرح ٥', tr:'İnşirah 5' },
  },
  {
    start: 'لَقَدْ خَلَقْنَا الْإِنسَانَ فِي',
    options: ['أَحْسَنِ تَقْوِيمٍ', 'أَحْسَنِ صُورَةٍ', 'خَيْرِ أُمَّةٍ', 'أَحْسَنِ حَالٍ'],
    correct: 0,
    fullVerse: 'لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ',
    surah: { az:'Tin 4', en:'At-Tin 4', ru:'Ат-Тин 4', ar:'التين ٤', tr:'Tin 4' },
  },
  {
    start: 'اقْرَأْ بِاسْمِ رَبِّكَ',
    options: ['الَّذِي خَلَقَ', 'الَّذِي رَزَقَ', 'الَّذِي هَدَىٰ', 'الَّذِي عَلَّمَ'],
    correct: 0,
    fullVerse: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
    surah: { az:'Ələq 1', en:'Al-Alaq 1', ru:'Аль-Алак 1', ar:'العلق ١', tr:'Alak 1' },
  },
  {
    start: 'وَمَا أَرْسَلْنَاكَ إِلَّا',
    options: ['رَحْمَةً لِّلْعَالَمِينَ', 'بَشِيرًا وَنَذِيرًا', 'هَادِيًا وَمُبَشِّرًا', 'شَاهِدًا وَمُبَشِّرًا'],
    correct: 0,
    fullVerse: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ',
    surah: { az:'Ənbiya 107', en:'Al-Anbiya 107', ru:'Аль-Анбия 107', ar:'الأنبياء ١٠٧', tr:'Enbiya 107' },
  },
  {
    start: 'يس ❁ وَالْقُرْآنِ',
    options: ['الْحَكِيمِ', 'الْعَظِيمِ', 'الْكَرِيمِ', 'الْمَجِيدِ'],
    correct: 0,
    fullVerse: 'يس ❁ وَالْقُرْآنِ الْحَكِيمِ',
    surah: { az:'Yasin 1-2', en:'Ya-Sin 1-2', ru:'Йа-Син 1-2', ar:'يس ١-٢', tr:'Yasin 1-2' },
  },
  {
    start: 'الرَّحْمَٰنُ ❁ عَلَّمَ',
    options: ['الْقُرْآنَ', 'الْإِنسَانَ', 'الْبَيَانَ', 'الْحِكْمَةَ'],
    correct: 0,
    fullVerse: 'الرَّحْمَٰنُ ❁ عَلَّمَ الْقُرْآنَ',
    surah: { az:'Rəhman 1-2', en:'Ar-Rahman 1-2', ru:'Ар-Рахман 1-2', ar:'الرحمن ١-٢', tr:'Rahman 1-2' },
  },
  {
    start: 'تَبَارَكَ الَّذِي بِيَدِهِ',
    options: ['الْمُلْكُ', 'الْأَمْرُ', 'الْخَيْرُ', 'النُّورُ'],
    correct: 0,
    fullVerse: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ',
    surah: { az:'Mulk 1', en:'Al-Mulk 1', ru:'Аль-Мульк 1', ar:'الملك ١', tr:'Mülk 1' },
  },
  {
    start: 'قُلْ يَا أَيُّهَا',
    options: ['الْكَافِرُونَ', 'الْمُسْلِمُونَ', 'الْمُؤْمِنُونَ', 'النَّاسُ'],
    correct: 0,
    fullVerse: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ',
    surah: { az:'Kafirun 1', en:'Al-Kafirun 1', ru:'Аль-Кафирун 1', ar:'الكافرون ١', tr:'Kafirun 1' },
  },
  {
    start: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ',
    options: ['هُدًى لِّلْمُتَّقِينَ', 'نُورًا لِّلْمُؤْمِنِينَ', 'شِفَاءً لِّلنَّاسِ', 'رَحْمَةً لِّلْعَالَمِينَ'],
    correct: 0,
    fullVerse: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ',
    surah: { az:'Bəqərə 2', en:'Al-Baqarah 2', ru:'Аль-Бакара 2', ar:'البقرة ٢', tr:'Bakara 2' },
  },
  {
    start: 'اللَّهُ نُورُ السَّمَاوَاتِ',
    options: ['وَالْأَرْضِ', 'وَالْجِبَالِ', 'وَالْبِحَارِ', 'وَالنُّجُومِ'],
    correct: 0,
    fullVerse: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
    surah: { az:'Nur 35', en:'An-Nur 35', ru:'Ан-Нур 35', ar:'النور ٣٥', tr:'Nur 35' },
  },
  {
    start: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ',
    options: ['لِلذِّكْرِ', 'لِلْعِلْمِ', 'لِلْهُدَىٰ', 'لِلنَّاسِ'],
    correct: 0,
    fullVerse: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ',
    surah: { az:'Qəmər 17', en:'Al-Qamar 17', ru:'Аль-Камар 17', ar:'القمر ١٧', tr:'Kamer 17' },
  },
  {
    start: 'إِنَّ مَعَ الْعُسْرِ',
    options: ['يُسْرًا', 'فَرَجًا', 'صَبْرًا', 'أَجْرًا'],
    correct: 0,
    fullVerse: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    surah: { az:'İnşirah 6', en:'Ash-Sharh 6', ru:'Аш-Шарх 6', ar:'الشرح ٦', tr:'İnşirah 6' },
  },
  {
    start: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي',
    options: ['قَرِيبٌ', 'سَمِيعٌ', 'عَلِيمٌ', 'رَحِيمٌ'],
    correct: 0,
    fullVerse: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
    surah: { az:'Bəqərə 186', en:'Al-Baqarah 186', ru:'Аль-Бакара 186', ar:'البقرة ١٨٦', tr:'Bakara 186' },
  },
  {
    start: 'لَا إِكْرَاهَ فِي',
    options: ['الدِّينِ', 'الْإِسْلَامِ', 'الْحَقِّ', 'الْإِيمَانِ'],
    correct: 0,
    fullVerse: 'لَا إِكْرَاهَ فِي الدِّينِ',
    surah: { az:'Bəqərə 256', en:'Al-Baqarah 256', ru:'Аль-Бакара 256', ar:'البقرة ٢٥٦', tr:'Bakara 256' },
  },
  {
    start: 'كُنتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ',
    options: ['لِلنَّاسِ', 'لِلْعَالَمِينَ', 'لِلْمُؤْمِنِينَ', 'لِلْمُسْلِمِينَ'],
    correct: 0,
    fullVerse: 'كُنتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ لِلنَّاسِ',
    surah: { az:'Ali-İmran 110', en:'Ali Imran 110', ru:'Аль-Имран 110', ar:'آل عمران ١١٠', tr:'Ali İmran 110' },
  },
  {
    start: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ',
    options: ['خَيْرٌ لَّكُمْ', 'نَفْعٌ لَّكُمْ', 'هُدًى لَّكُمْ', 'بَرَكَةٌ لَّكُمْ'],
    correct: 0,
    fullVerse: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ',
    surah: { az:'Bəqərə 216', en:'Al-Baqarah 216', ru:'Аль-Бакара 216', ar:'البقرة ٢١٦', tr:'Bakara 216' },
  },
  {
    start: 'وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ',
    options: ['وَالْجُوعِ', 'وَالْفَقْرِ', 'وَالْمَرَضِ', 'وَالضَّرِّ'],
    correct: 0,
    fullVerse: 'وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ',
    surah: { az:'Bəqərə 155', en:'Al-Baqarah 155', ru:'Аль-Бакара 155', ar:'البقرة ١٥٥', tr:'Bakara 155' },
  },
  {
    start: 'إِنَّ اللَّهَ مَعَ',
    options: ['الصَّابِرِينَ', 'الْمُحْسِنِينَ', 'الْمُؤْمِنِينَ', 'الذَّاكِرِينَ'],
    correct: 0,
    fullVerse: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    surah: { az:'Bəqərə 153', en:'Al-Baqarah 153', ru:'Аль-Бакара 153', ar:'البقرة ١٥٣', tr:'Bakara 153' },
  },
  {
    start: 'حَسْبُنَا اللَّهُ وَنِعْمَ',
    options: ['الْوَكِيلُ', 'الْمَوْلَىٰ', 'النَّصِيرُ', 'الْحَفِيظُ'],
    correct: 0,
    fullVerse: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    surah: { az:'Ali-İmran 173', en:'Ali Imran 173', ru:'Аль-Имран 173', ar:'آل عمران ١٧٣', tr:'Ali İmran 173' },
  },
  {
    start: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ',
    options: ['حَسْبُهُ', 'وَلِيُّهُ', 'نَاصِرُهُ', 'هَادِيهِ'],
    correct: 0,
    fullVerse: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    surah: { az:'Talaq 3', en:'At-Talaq 3', ru:'Ат-Талак 3', ar:'الطلاق ٣', tr:'Talak 3' },
  },
  {
    start: 'وَقُل رَّبِّ زِدْنِي',
    options: ['عِلْمًا', 'إِيمَانًا', 'هُدًى', 'صَبْرًا'],
    correct: 0,
    fullVerse: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    surah: { az:'Taha 114', en:'Ta-Ha 114', ru:'Та-Ха 114', ar:'طه ١١٤', tr:'Taha 114' },
  },
  {
    start: 'إِنَّا فَتَحْنَا لَكَ',
    options: ['فَتْحًا مُّبِينًا', 'بَابًا عَظِيمًا', 'طَرِيقًا مُسْتَقِيمًا', 'نَصْرًا كَبِيرًا'],
    correct: 0,
    fullVerse: 'إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا',
    surah: { az:'Fəth 1', en:'Al-Fath 1', ru:'Аль-Фатх 1', ar:'الفتح ١', tr:'Fetih 1' },
  },
  {
    start: 'وَنَفْسٍ وَمَا',
    options: ['سَوَّاهَا', 'خَلَقَهَا', 'هَدَاهَا', 'رَزَقَهَا'],
    correct: 0,
    fullVerse: 'وَنَفْسٍ وَمَا سَوَّاهَا',
    surah: { az:'Şəms 7', en:'Ash-Shams 7', ru:'Аш-Шамс 7', ar:'الشمس ٧', tr:'Şems 7' },
  },
  {
    start: 'فَأَلْهَمَهَا فُجُورَهَا',
    options: ['وَتَقْوَاهَا', 'وَهُدَاهَا', 'وَإِيمَانَهَا', 'وَصَلَاحَهَا'],
    correct: 0,
    fullVerse: 'فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَاهَا',
    surah: { az:'Şəms 8', en:'Ash-Shams 8', ru:'Аш-Шамс 8', ar:'الشمس ٨', tr:'Şems 8' },
  },
  {
    start: 'وَاللَّيْلِ إِذَا',
    options: ['يَغْشَىٰ', 'سَكَنَ', 'أَقْبَلَ', 'أَدْبَرَ'],
    correct: 0,
    fullVerse: 'وَاللَّيْلِ إِذَا يَغْشَىٰ',
    surah: { az:'Leyl 1', en:'Al-Layl 1', ru:'Аль-Лейль 1', ar:'الليل ١', tr:'Leyl 1' },
  },
  {
    start: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ',
    options: ['بِأَصْحَابِ الْفِيلِ', 'بِقَوْمِ نُوحٍ', 'بِقَوْمِ عَادٍ', 'بِقَوْمِ لُوطٍ'],
    correct: 0,
    fullVerse: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ',
    surah: { az:'Fil 1', en:'Al-Fil 1', ru:'Аль-Филь 1', ar:'الفيل ١', tr:'Fil 1' },
  },
  {
    start: 'وَيْلٌ لِّكُلِّ هُمَزَةٍ',
    options: ['لُّمَزَةٍ', 'خَائِنَةٍ', 'كَاذِبَةٍ', 'فَاسِقَةٍ'],
    correct: 0,
    fullVerse: 'وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ',
    surah: { az:'Həmzə 1', en:'Al-Humazah 1', ru:'Аль-Хумаза 1', ar:'الهمزة ١', tr:'Hümeze 1' },
  },
  {
    start: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ',
    options: ['بِالدِّينِ', 'بِالْحَقِّ', 'بِالْآخِرَةِ', 'بِالْقُرْآنِ'],
    correct: 0,
    fullVerse: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ',
    surah: { az:'Maun 1', en:'Al-Maun 1', ru:'Аль-Маун 1', ar:'الماعون ١', tr:'Maun 1' },
  },
  {
    start: 'إِذَا زُلْزِلَتِ الْأَرْضُ',
    options: ['زِلْزَالَهَا', 'رَجْفَةً', 'صَيْحَةً', 'قَارِعَةً'],
    correct: 0,
    fullVerse: 'إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا',
    surah: { az:'Zəlzələ 1', en:'Az-Zalzalah 1', ru:'Аз-Залзала 1', ar:'الزلزلة ١', tr:'Zilzal 1' },
  },
  {
    start: 'أَلْهَاكُمُ',
    options: ['التَّكَاثُرُ', 'الدُّنْيَا', 'الْمَالُ', 'اللَّعِبُ'],
    correct: 0,
    fullVerse: 'أَلْهَاكُمُ التَّكَاثُرُ',
    surah: { az:'Təkasur 1', en:'At-Takathur 1', ru:'Ат-Такасур 1', ar:'التكاثر ١', tr:'Tekasür 1' },
  },
  {
    start: 'الْقَارِعَةُ ❁ مَا',
    options: ['الْقَارِعَةُ', 'الْحَاقَّةُ', 'الْوَاقِعَةُ', 'الصَّاخَّةُ'],
    correct: 0,
    fullVerse: 'الْقَارِعَةُ ❁ مَا الْقَارِعَةُ',
    surah: { az:'Qariə 1-2', en:'Al-Qariah 1-2', ru:'Аль-Кариа 1-2', ar:'القارعة ١-٢', tr:'Karia 1-2' },
  },
  {
    start: 'وَالْعَادِيَاتِ',
    options: ['ضَبْحًا', 'سَبْحًا', 'صُبْحًا', 'رَكْضًا'],
    correct: 0,
    fullVerse: 'وَالْعَادِيَاتِ ضَبْحًا',
    surah: { az:'Adiyat 1', en:'Al-Adiyat 1', ru:'Аль-Адият 1', ar:'العاديات ١', tr:'Adiyat 1' },
  },
  {
    start: 'عَمَّ يَتَسَاءَلُونَ ❁ عَنِ النَّبَإِ',
    options: ['الْعَظِيمِ', 'الْكَبِيرِ', 'الْأَكْبَرِ', 'الْمُبِينِ'],
    correct: 0,
    fullVerse: 'عَمَّ يَتَسَاءَلُونَ ❁ عَنِ النَّبَإِ الْعَظِيمِ',
    surah: { az:'Nəbə 1-2', en:'An-Naba 1-2', ru:'Ан-Наба 1-2', ar:'النبأ ١-٢', tr:'Nebe 1-2' },
  },
  {
    start: 'إِذَا الشَّمْسُ',
    options: ['كُوِّرَتْ', 'انفَطَرَتْ', 'انشَقَّتْ', 'ذَهَبَتْ'],
    correct: 0,
    fullVerse: 'إِذَا الشَّمْسُ كُوِّرَتْ',
    surah: { az:'Təkvir 1', en:'At-Takwir 1', ru:'Ат-Таквир 1', ar:'التكوير ١', tr:'Tekvir 1' },
  },
  {
    start: 'إِذَا السَّمَاءُ',
    options: ['انفَطَرَتْ', 'انشَقَّتْ', 'كُشِطَتْ', 'فُتِحَتْ'],
    correct: 0,
    fullVerse: 'إِذَا السَّمَاءُ انفَطَرَتْ',
    surah: { az:'İnfitar 1', en:'Al-Infitar 1', ru:'Аль-Инфитар 1', ar:'الانفطار ١', tr:'İnfitar 1' },
  },
  {
    start: 'سَبِّحِ اسْمَ رَبِّكَ',
    options: ['الْأَعْلَى', 'الْعَظِيمِ', 'الْكَرِيمِ', 'الرَّحِيمِ'],
    correct: 0,
    fullVerse: 'سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى',
    surah: { az:'Əla 1', en:'Al-Ala 1', ru:'Аль-Аля 1', ar:'الأعلى ١', tr:'Ala 1' },
  },
  {
    start: 'هَلْ أَتَاكَ حَدِيثُ',
    options: ['الْغَاشِيَةِ', 'الْقَارِعَةِ', 'الْحَاقَّةِ', 'الصَّاخَّةِ'],
    correct: 0,
    fullVerse: 'هَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ',
    surah: { az:'Ğaşiyə 1', en:'Al-Ghashiyah 1', ru:'Аль-Гашия 1', ar:'الغاشية ١', tr:'Gaşiye 1' },
  },
  {
    start: 'لَا أُقْسِمُ بِهَٰذَا',
    options: ['الْبَلَدِ', 'الْيَوْمِ', 'الْقُرْآنِ', 'الْكِتَابِ'],
    correct: 0,
    fullVerse: 'لَا أُقْسِمُ بِهَٰذَا الْبَلَدِ',
    surah: { az:'Bələd 1', en:'Al-Balad 1', ru:'Аль-Балад 1', ar:'البلد ١', tr:'Beled 1' },
  },
]

// ── Find the surah questions ──
const FIND_SURAH_QUESTIONS = [
  {
    verse: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    options: [
      { az:'Fatihə', en:'Al-Fatiha', ar:'الفاتحة', tr:'Fatiha', ru:'Аль-Фатиха' },
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'İxlas', en:'Al-Ikhlas', ar:'الإخلاص', tr:'İhlas', ru:'Аль-Ихлас' },
      { az:'Nas', en:'An-Nas', ar:'الناس', tr:'Nas', ru:'Ан-Нас' },
    ],
    correct: 0,
  },
  {
    verse: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    options: [
      { az:'İxlas', en:'Al-Ikhlas', ar:'الإخلاص', tr:'İhlas', ru:'Аль-Ихлас' },
      { az:'Fatihə', en:'Al-Fatiha', ar:'الفاتحة', tr:'Fatiha', ru:'Аль-Фатиха' },
      { az:'Nas', en:'An-Nas', ar:'الناس', tr:'Nas', ru:'Ан-Нас' },
      { az:'Fələq', en:'Al-Falaq', ar:'الفلق', tr:'Felak', ru:'Аль-Фаляк' },
    ],
    correct: 0,
  },
  {
    verse: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
    options: [
      { az:'Kövsər', en:'Al-Kawthar', ar:'الكوثر', tr:'Kevser', ru:'Аль-Каусар' },
      { az:'Nəsr', en:'An-Nasr', ar:'النصر', tr:'Nasr', ru:'Ан-Наср' },
      { az:'Əsr', en:'Al-Asr', ar:'العصر', tr:'Asr', ru:'Аль-Аср' },
      { az:'Fil', en:'Al-Fil', ar:'الفيل', tr:'Fil', ru:'Аль-Филь' },
    ],
    correct: 0,
  },
  {
    verse: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ',
    options: [
      { az:'Qədr', en:'Al-Qadr', ar:'القدر', tr:'Kadir', ru:'Аль-Кадр' },
      { az:'Duxan', en:'Ad-Dukhan', ar:'الدخان', tr:'Duhan', ru:'Ад-Духан' },
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'Mulk', en:'Al-Mulk', ar:'الملك', tr:'Mülk', ru:'Аль-Мульк' },
    ],
    correct: 0,
  },
  {
    verse: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ',
    options: [
      { az:'Məsəd', en:'Al-Masad', ar:'المسد', tr:'Tebbet', ru:'Аль-Масад' },
      { az:'Qureyş', en:'Quraysh', ar:'قريش', tr:'Kureyş', ru:'Курайш' },
      { az:'Fil', en:'Al-Fil', ar:'الفيل', tr:'Fil', ru:'Аль-Филь' },
      { az:'Həmzə', en:'Al-Humazah', ar:'الهمزة', tr:'Hümeze', ru:'Аль-Хумаза' },
    ],
    correct: 0,
  },
  {
    verse: 'وَالْعَصْرِ ❁ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
    options: [
      { az:'Əsr', en:'Al-Asr', ar:'العصر', tr:'Asr', ru:'Аль-Аср' },
      { az:'Tin', en:'At-Tin', ar:'التين', tr:'Tin', ru:'Ат-Тин' },
      { az:'Duha', en:'Ad-Duha', ar:'الضحى', tr:'Duha', ru:'Ад-Духа' },
      { az:'Leyl', en:'Al-Layl', ar:'الليل', tr:'Leyl', ru:'Аль-Лейль' },
    ],
    correct: 0,
  },
  {
    verse: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
    options: [
      { az:'Ələq', en:'Al-Alaq', ar:'العلق', tr:'Alak', ru:'Аль-Алак' },
      { az:'Qələm', en:'Al-Qalam', ar:'القلم', tr:'Kalem', ru:'Аль-Калям' },
      { az:'Müzzəmmil', en:'Al-Muzzammil', ar:'المزمل', tr:'Müzzemmil', ru:'Аль-Муззаммиль' },
      { az:'Fatihə', en:'Al-Fatiha', ar:'الفاتحة', tr:'Fatiha', ru:'Аль-Фатиха' },
    ],
    correct: 0,
  },
  {
    verse: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ',
    options: [
      { az:'İnşirah', en:'Ash-Sharh', ar:'الشرح', tr:'İnşirah', ru:'Аш-Шарх' },
      { az:'Duha', en:'Ad-Duha', ar:'الضحى', tr:'Duha', ru:'Ад-Духа' },
      { az:'Tin', en:'At-Tin', ar:'التين', tr:'Tin', ru:'Ат-Тин' },
      { az:'Ələq', en:'Al-Alaq', ar:'العلق', tr:'Alak', ru:'Аль-Алак' },
    ],
    correct: 0,
  },
  {
    verse: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ',
    options: [
      { az:'Nəsr', en:'An-Nasr', ar:'النصر', tr:'Nasr', ru:'Ан-Наср' },
      { az:'Fəth', en:'Al-Fath', ar:'الفتح', tr:'Fetih', ru:'Аль-Фатх' },
      { az:'Hücurat', en:'Al-Hujurat', ar:'الحجرات', tr:'Hucurat', ru:'Аль-Худжурат' },
      { az:'Səf', en:'As-Saff', ar:'الصف', tr:'Saf', ru:'Ас-Сафф' },
    ],
    correct: 0,
  },
  {
    verse: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
    options: [
      { az:'Nas', en:'An-Nas', ar:'الناس', tr:'Nas', ru:'Ан-Нас' },
      { az:'Fələq', en:'Al-Falaq', ar:'الفلق', tr:'Felak', ru:'Аль-Фаляк' },
      { az:'İxlas', en:'Al-Ikhlas', ar:'الإخلاص', tr:'İhlas', ru:'Аль-Ихлас' },
      { az:'Kafirun', en:'Al-Kafirun', ar:'الكافرون', tr:'Kafirun', ru:'Аль-Кафирун' },
    ],
    correct: 0,
  },
  {
    verse: 'يس ❁ وَالْقُرْآنِ الْحَكِيمِ',
    options: [
      { az:'Yasin', en:'Ya-Sin', ar:'يس', tr:'Yasin', ru:'Йа-Син' },
      { az:'Rəhman', en:'Ar-Rahman', ar:'الرحمن', tr:'Rahman', ru:'Ар-Рахман' },
      { az:'Vaqiə', en:'Al-Waqiah', ar:'الواقعة', tr:'Vakıa', ru:'Аль-Вакиа' },
      { az:'Sad', en:'Sad', ar:'ص', tr:'Sad', ru:'Сад' },
    ],
    correct: 0,
  },
  {
    verse: 'الرَّحْمَٰنُ ❁ عَلَّمَ الْقُرْآنَ',
    options: [
      { az:'Rəhman', en:'Ar-Rahman', ar:'الرحمن', tr:'Rahman', ru:'Ар-Рахман' },
      { az:'Yasin', en:'Ya-Sin', ar:'يس', tr:'Yasin', ru:'Йа-Син' },
      { az:'Mulk', en:'Al-Mulk', ar:'الملك', tr:'Mülk', ru:'Аль-Мульк' },
      { az:'Qəmər', en:'Al-Qamar', ar:'القمر', tr:'Kamer', ru:'Аль-Камар' },
    ],
    correct: 0,
  },
  {
    verse: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ',
    options: [
      { az:'Mulk', en:'Al-Mulk', ar:'الملك', tr:'Mülk', ru:'Аль-Мульк' },
      { az:'Rəhman', en:'Ar-Rahman', ar:'الرحمن', tr:'Rahman', ru:'Ар-Рахман' },
      { az:'Həşr', en:'Al-Hashr', ar:'الحشر', tr:'Haşr', ru:'Аль-Хашр' },
      { az:'Hədid', en:'Al-Hadid', ar:'الحديد', tr:'Hadid', ru:'Аль-Хадид' },
    ],
    correct: 0,
  },
  {
    verse: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ',
    options: [
      { az:'Ənbiya', en:'Al-Anbiya', ar:'الأنبياء', tr:'Enbiya', ru:'Аль-Анбия' },
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Nisa', en:'An-Nisa', ar:'النساء', tr:'Nisa', ru:'Ан-Ниса' },
      { az:'Maidə', en:'Al-Maidah', ar:'المائدة', tr:'Maide', ru:'Аль-Маида' },
    ],
    correct: 0,
  },
  {
    verse: 'لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ',
    options: [
      { az:'Tin', en:'At-Tin', ar:'التين', tr:'Tin', ru:'Ат-Тин' },
      { az:'İnsan', en:'Al-Insan', ar:'الإنسان', tr:'İnsan', ru:'Аль-Инсан' },
      { az:'Ələq', en:'Al-Alaq', ar:'العلق', tr:'Alak', ru:'Аль-Алак' },
      { az:'Əsr', en:'Al-Asr', ar:'العصر', tr:'Asr', ru:'Аль-Аср' },
    ],
    correct: 0,
  },
  {
    verse: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ',
    options: [
      { az:'Kafirun', en:'Al-Kafirun', ar:'الكافرون', tr:'Kafirun', ru:'Аль-Кафирун' },
      { az:'Nas', en:'An-Nas', ar:'الناس', tr:'Nas', ru:'Ан-Нас' },
      { az:'İxlas', en:'Al-Ikhlas', ar:'الإخلاص', tr:'İhlas', ru:'Аль-Ихлас' },
      { az:'Fələq', en:'Al-Falaq', ar:'الفلق', tr:'Felak', ru:'Аль-Фаляк' },
    ],
    correct: 0,
  },
  {
    verse: 'لِإِيلَافِ قُرَيْشٍ',
    options: [
      { az:'Qureyş', en:'Quraysh', ar:'قريش', tr:'Kureyş', ru:'Курайш' },
      { az:'Fil', en:'Al-Fil', ar:'الفيل', tr:'Fil', ru:'Аль-Филь' },
      { az:'Maun', en:'Al-Maun', ar:'الماعون', tr:'Maun', ru:'Аль-Маун' },
      { az:'Həmzə', en:'Al-Humazah', ar:'الهمزة', tr:'Hümeze', ru:'Аль-Хумаза' },
    ],
    correct: 0,
  },
  {
    verse: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ',
    options: [
      { az:'Fil', en:'Al-Fil', ar:'الفيل', tr:'Fil', ru:'Аль-Филь' },
      { az:'Qureyş', en:'Quraysh', ar:'قريش', tr:'Kureyş', ru:'Курайш' },
      { az:'Büruc', en:'Al-Buruj', ar:'البروج', tr:'Büruc', ru:'Аль-Бурудж' },
      { az:'Tariq', en:'At-Tariq', ar:'الطارق', tr:'Tarık', ru:'Ат-Тарик' },
    ],
    correct: 0,
  },
  {
    verse: 'وَالضُّحَىٰ ❁ وَاللَّيْلِ إِذَا سَجَىٰ',
    options: [
      { az:'Duha', en:'Ad-Duha', ar:'الضحى', tr:'Duha', ru:'Ад-Духа' },
      { az:'Leyl', en:'Al-Layl', ar:'الليل', tr:'Leyl', ru:'Аль-Лейль' },
      { az:'Şəms', en:'Ash-Shams', ar:'الشمس', tr:'Şems', ru:'Аш-Шамс' },
      { az:'Fəcr', en:'Al-Fajr', ar:'الفجر', tr:'Fecr', ru:'Аль-Фаджр' },
    ],
    correct: 0,
  },
  {
    verse: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    options: [
      { az:'Rəhman', en:'Ar-Rahman', ar:'الرحمن', tr:'Rahman', ru:'Ар-Рахман' },
      { az:'Cin', en:'Al-Jinn', ar:'الجن', tr:'Cin', ru:'Аль-Джинн' },
      { az:'Mulk', en:'Al-Mulk', ar:'الملك', tr:'Mülk', ru:'Аль-Мульк' },
      { az:'Nəbə', en:'An-Naba', ar:'النبأ', tr:'Nebe', ru:'Ан-Наба' },
    ],
    correct: 0,
  },
  {
    verse: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ',
    options: [
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Nisa', en:'An-Nisa', ar:'النساء', tr:'Nisa', ru:'Ан-Ниса' },
      { az:'Maidə', en:'Al-Maidah', ar:'المائدة', tr:'Maide', ru:'Аль-Маида' },
    ],
    correct: 0,
  },
  {
    verse: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    options: [
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Taha', en:'Ta-Ha', ar:'طه', tr:'Taha', ru:'Та-Ха' },
      { az:'Həşr', en:'Al-Hashr', ar:'الحشر', tr:'Haşr', ru:'Аль-Хашр' },
    ],
    correct: 0,
  },
  {
    verse: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
    options: [
      { az:'Nur', en:'An-Nur', ar:'النور', tr:'Nur', ru:'Ан-Нур' },
      { az:'Fatir', en:'Fatir', ar:'فاطر', tr:'Fatır', ru:'Фатыр' },
      { az:'Mulk', en:'Al-Mulk', ar:'الملك', tr:'Mülk', ru:'Аль-Мульк' },
      { az:'Hədid', en:'Al-Hadid', ar:'الحديد', tr:'Hadid', ru:'Аль-Хадид' },
    ],
    correct: 0,
  },
  {
    verse: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ',
    options: [
      { az:'Qəmər', en:'Al-Qamar', ar:'القمر', tr:'Kamer', ru:'Аль-Камар' },
      { az:'Rəhman', en:'Ar-Rahman', ar:'الرحمن', tr:'Rahman', ru:'Ар-Рахман' },
      { az:'Vaqiə', en:'Al-Waqiah', ar:'الواقعة', tr:'Vakıa', ru:'Аль-Вакиа' },
      { az:'Hədid', en:'Al-Hadid', ar:'الحديد', tr:'Hadid', ru:'Аль-Хадид' },
    ],
    correct: 0,
  },
  {
    verse: 'إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا',
    options: [
      { az:'Fəth', en:'Al-Fath', ar:'الفتح', tr:'Fetih', ru:'Аль-Фатх' },
      { az:'Nəsr', en:'An-Nasr', ar:'النصر', tr:'Nasr', ru:'Ан-Наср' },
      { az:'Muhəmməd', en:'Muhammad', ar:'محمد', tr:'Muhammed', ru:'Мухаммад' },
      { az:'Hücurat', en:'Al-Hujurat', ar:'الحجرات', tr:'Hucurat', ru:'Аль-Худжурат' },
    ],
    correct: 0,
  },
  {
    verse: 'كُنتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ لِلنَّاسِ',
    options: [
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'Nisa', en:'An-Nisa', ar:'النساء', tr:'Nisa', ru:'Ан-Ниса' },
      { az:'Maidə', en:'Al-Maidah', ar:'المائدة', tr:'Maide', ru:'Аль-Маида' },
    ],
    correct: 0,
  },
  {
    verse: 'لَا إِكْرَاهَ فِي الدِّينِ',
    options: [
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Maidə', en:'Al-Maidah', ar:'المائدة', tr:'Maide', ru:'Аль-Маида' },
      { az:'Ənfal', en:'Al-Anfal', ar:'الأنفال', tr:'Enfal', ru:'Аль-Анфаль' },
    ],
    correct: 0,
  },
  {
    verse: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    options: [
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Ənfal', en:'Al-Anfal', ar:'الأنفال', tr:'Enfal', ru:'Аль-Анфаль' },
      { az:'Tövbə', en:'At-Tawbah', ar:'التوبة', tr:'Tevbe', ru:'Ат-Тауба' },
      { az:'Yunus', en:'Yunus', ar:'يونس', tr:'Yunus', ru:'Юнус' },
    ],
    correct: 0,
  },
  {
    verse: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    options: [
      { az:'Talaq', en:'At-Talaq', ar:'الطلاق', tr:'Talak', ru:'Ат-Талак' },
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'Nisa', en:'An-Nisa', ar:'النساء', tr:'Nisa', ru:'Ан-Ниса' },
    ],
    correct: 0,
  },
  {
    verse: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    options: [
      { az:'Taha', en:'Ta-Ha', ar:'طه', tr:'Taha', ru:'Та-Ха' },
      { az:'Ənbiya', en:'Al-Anbiya', ar:'الأنبياء', tr:'Enbiya', ru:'Аль-Анбия' },
      { az:'Kəhf', en:'Al-Kahf', ar:'الكهف', tr:'Kehf', ru:'Аль-Кахф' },
      { az:'Muminun', en:'Al-Muminun', ar:'المؤمنون', tr:'Müminun', ru:'Аль-Муминун' },
    ],
    correct: 0,
  },
  {
    verse: 'وَنَفْسٍ وَمَا سَوَّاهَا',
    options: [
      { az:'Şəms', en:'Ash-Shams', ar:'الشمس', tr:'Şems', ru:'Аш-Шамс' },
      { az:'Leyl', en:'Al-Layl', ar:'الليل', tr:'Leyl', ru:'Аль-Лейль' },
      { az:'Duha', en:'Ad-Duha', ar:'الضحى', tr:'Duha', ru:'Ад-Духа' },
      { az:'Fəcr', en:'Al-Fajr', ar:'الفجر', tr:'Fecr', ru:'Аль-Фаджр' },
    ],
    correct: 0,
  },
  {
    verse: 'إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا',
    options: [
      { az:'Zəlzələ', en:'Az-Zalzalah', ar:'الزلزلة', tr:'Zilzal', ru:'Аз-Залзала' },
      { az:'Qariə', en:'Al-Qariah', ar:'القارعة', tr:'Karia', ru:'Аль-Кариа' },
      { az:'Nəbə', en:'An-Naba', ar:'النبأ', tr:'Nebe', ru:'Ан-Наба' },
      { az:'Təkvir', en:'At-Takwir', ar:'التكوير', tr:'Tekvir', ru:'Ат-Таквир' },
    ],
    correct: 0,
  },
  {
    verse: 'أَلْهَاكُمُ التَّكَاثُرُ',
    options: [
      { az:'Təkasur', en:'At-Takathur', ar:'التكاثر', tr:'Tekasür', ru:'Ат-Такасур' },
      { az:'Əsr', en:'Al-Asr', ar:'العصر', tr:'Asr', ru:'Аль-Аср' },
      { az:'Həmzə', en:'Al-Humazah', ar:'الهمزة', tr:'Hümeze', ru:'Аль-Хумаза' },
      { az:'Adiyat', en:'Al-Adiyat', ar:'العاديات', tr:'Adiyat', ru:'Аль-Адият' },
    ],
    correct: 0,
  },
  {
    verse: 'وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ',
    options: [
      { az:'Həmzə', en:'Al-Humazah', ar:'الهمزة', tr:'Hümeze', ru:'Аль-Хумаза' },
      { az:'Təkasur', en:'At-Takathur', ar:'التكاثر', tr:'Tekasür', ru:'Ат-Такасур' },
      { az:'Maun', en:'Al-Maun', ar:'الماعون', tr:'Maun', ru:'Аль-Маун' },
      { az:'Məsəd', en:'Al-Masad', ar:'المسد', tr:'Tebbet', ru:'Аль-Масад' },
    ],
    correct: 0,
  },
  {
    verse: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ',
    options: [
      { az:'Maun', en:'Al-Maun', ar:'الماعون', tr:'Maun', ru:'Аль-Маун' },
      { az:'Kafirun', en:'Al-Kafirun', ar:'الكافرون', tr:'Kafirun', ru:'Аль-Кафирун' },
      { az:'Həmzə', en:'Al-Humazah', ar:'الهمزة', tr:'Hümeze', ru:'Аль-Хумаза' },
      { az:'Fil', en:'Al-Fil', ar:'الفيل', tr:'Fil', ru:'Аль-Филь' },
    ],
    correct: 0,
  },
  {
    verse: 'الْقَارِعَةُ ❁ مَا الْقَارِعَةُ',
    options: [
      { az:'Qariə', en:'Al-Qariah', ar:'القارعة', tr:'Karia', ru:'Аль-Кариа' },
      { az:'Zəlzələ', en:'Az-Zalzalah', ar:'الزلزلة', tr:'Zilzal', ru:'Аз-Залзала' },
      { az:'Haqqə', en:'Al-Haqqah', ar:'الحاقة', tr:'Hakka', ru:'Аль-Хакка' },
      { az:'Vaqiə', en:'Al-Waqiah', ar:'الواقعة', tr:'Vakıa', ru:'Аль-Вакиа' },
    ],
    correct: 0,
  },
  {
    verse: 'عَمَّ يَتَسَاءَلُونَ ❁ عَنِ النَّبَإِ الْعَظِيمِ',
    options: [
      { az:'Nəbə', en:'An-Naba', ar:'النبأ', tr:'Nebe', ru:'Ан-Наба' },
      { az:'Naziat', en:'An-Naziat', ar:'النازعات', tr:'Naziat', ru:'Ан-Назиат' },
      { az:'Əbəsə', en:'Abasa', ar:'عبس', tr:'Abese', ru:'Абаса' },
      { az:'Təkvir', en:'At-Takwir', ar:'التكوير', tr:'Tekvir', ru:'Ат-Таквир' },
    ],
    correct: 0,
  },
  {
    verse: 'إِذَا الشَّمْسُ كُوِّرَتْ',
    options: [
      { az:'Təkvir', en:'At-Takwir', ar:'التكوير', tr:'Tekvir', ru:'Ат-Таквир' },
      { az:'İnfitar', en:'Al-Infitar', ar:'الانفطار', tr:'İnfitar', ru:'Аль-Инфитар' },
      { az:'İnşiqaq', en:'Al-Inshiqaq', ar:'الانشقاق', tr:'İnşikak', ru:'Аль-Иншикак' },
      { az:'Şəms', en:'Ash-Shams', ar:'الشمس', tr:'Şems', ru:'Аш-Шамс' },
    ],
    correct: 0,
  },
  {
    verse: 'إِذَا السَّمَاءُ انفَطَرَتْ',
    options: [
      { az:'İnfitar', en:'Al-Infitar', ar:'الانفطار', tr:'İnfitar', ru:'Аль-Инфитар' },
      { az:'Təkvir', en:'At-Takwir', ar:'التكوير', tr:'Tekvir', ru:'Ат-Таквир' },
      { az:'İnşiqaq', en:'Al-Inshiqaq', ar:'الانشقاق', tr:'İnşikak', ru:'Аль-Иншикак' },
      { az:'Qəmər', en:'Al-Qamar', ar:'القمر', tr:'Kamer', ru:'Аль-Камар' },
    ],
    correct: 0,
  },
  {
    verse: 'وَالْفَجْرِ ❁ وَلَيَالٍ عَشْرٍ',
    options: [
      { az:'Fəcr', en:'Al-Fajr', ar:'الفجر', tr:'Fecr', ru:'Аль-Фаджр' },
      { az:'Şəms', en:'Ash-Shams', ar:'الشمس', tr:'Şems', ru:'Аш-Шамс' },
      { az:'Leyl', en:'Al-Layl', ar:'الليل', tr:'Leyl', ru:'Аль-Лейль' },
      { az:'Duha', en:'Ad-Duha', ar:'الضحى', tr:'Duha', ru:'Ад-Духа' },
    ],
    correct: 0,
  },
  {
    verse: 'وَالتِّينِ وَالزَّيْتُونِ',
    options: [
      { az:'Tin', en:'At-Tin', ar:'التين', tr:'Tin', ru:'Ат-Тин' },
      { az:'Ələq', en:'Al-Alaq', ar:'العلق', tr:'Alak', ru:'Аль-Алак' },
      { az:'Bələd', en:'Al-Balad', ar:'البلد', tr:'Beled', ru:'Аль-Балад' },
      { az:'Əsr', en:'Al-Asr', ar:'العصر', tr:'Asr', ru:'Аль-Аср' },
    ],
    correct: 0,
  },
  {
    verse: 'وَالضُّحَىٰ ❁ وَاللَّيْلِ إِذَا سَجَىٰ ❁ مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
    options: [
      { az:'Duha', en:'Ad-Duha', ar:'الضحى', tr:'Duha', ru:'Ад-Духа' },
      { az:'Leyl', en:'Al-Layl', ar:'الليل', tr:'Leyl', ru:'Аль-Лейль' },
      { az:'İnşirah', en:'Ash-Sharh', ar:'الشرح', tr:'İnşirah', ru:'Аш-Шарх' },
      { az:'Fəcr', en:'Al-Fajr', ar:'الفجر', tr:'Fecr', ru:'Аль-Фаджр' },
    ],
    correct: 0,
  },
  {
    verse: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
    options: [
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Ənam', en:'Al-Anam', ar:'الأنعام', tr:'Enam', ru:'Аль-Анам' },
      { az:'Əraf', en:'Al-Araf', ar:'الأعراف', tr:'Araf', ru:'Аль-Араф' },
    ],
    correct: 0,
  },
  {
    verse: 'وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ',
    options: [
      { az:'Bəqərə', en:'Al-Baqarah', ar:'البقرة', tr:'Bakara', ru:'Аль-Бакара' },
      { az:'Ali-İmran', en:'Ali Imran', ar:'آل عمران', tr:'Ali İmran', ru:'Аль-Имран' },
      { az:'Muhəmməd', en:'Muhammad', ar:'محمد', tr:'Muhammed', ru:'Мухаммад' },
      { az:'Ənfal', en:'Al-Anfal', ar:'الأنفال', tr:'Enfal', ru:'Аль-Анфаль' },
    ],
    correct: 0,
  },
  {
    verse: 'وَالْعَادِيَاتِ ضَبْحًا',
    options: [
      { az:'Adiyat', en:'Al-Adiyat', ar:'العاديات', tr:'Adiyat', ru:'Аль-Адият' },
      { az:'Qariə', en:'Al-Qariah', ar:'القارعة', tr:'Karia', ru:'Аль-Кариа' },
      { az:'Zəlzələ', en:'Az-Zalzalah', ar:'الزلزلة', tr:'Zilzal', ru:'Аз-Залзала' },
      { az:'Tariq', en:'At-Tariq', ar:'الطارق', tr:'Tarık', ru:'Ат-Тарик' },
    ],
    correct: 0,
  },
  {
    verse: 'وَاللَّيْلِ إِذَا يَغْشَىٰ ❁ وَالنَّهَارِ إِذَا تَجَلَّىٰ',
    options: [
      { az:'Leyl', en:'Al-Layl', ar:'الليل', tr:'Leyl', ru:'Аль-Лейль' },
      { az:'Şəms', en:'Ash-Shams', ar:'الشمس', tr:'Şems', ru:'Аш-Шамс' },
      { az:'Duha', en:'Ad-Duha', ar:'الضحى', tr:'Duha', ru:'Ад-Духа' },
      { az:'Fəcr', en:'Al-Fajr', ar:'الفجر', tr:'Fecr', ru:'Аль-Фаджр' },
    ],
    correct: 0,
  },
  {
    verse: 'وَالسَّمَاءِ ذَاتِ الْبُرُوجِ',
    options: [
      { az:'Büruc', en:'Al-Buruj', ar:'البروج', tr:'Büruc', ru:'Аль-Бурудж' },
      { az:'Tariq', en:'At-Tariq', ar:'الطارق', tr:'Tarık', ru:'Ат-Тарик' },
      { az:'Şəms', en:'Ash-Shams', ar:'الشمس', tr:'Şems', ru:'Аш-Шамс' },
      { az:'Nəcm', en:'An-Najm', ar:'النجم', tr:'Necm', ru:'Ан-Наджм' },
    ],
    correct: 0,
  },
  {
    verse: 'وَالسَّمَاءِ وَالطَّارِقِ',
    options: [
      { az:'Tariq', en:'At-Tariq', ar:'الطارق', tr:'Tarık', ru:'Ат-Тарик' },
      { az:'Büruc', en:'Al-Buruj', ar:'البروج', tr:'Büruc', ru:'Аль-Бурудж' },
      { az:'Nəcm', en:'An-Najm', ar:'النجم', tr:'Necm', ru:'Ан-Наджм' },
      { az:'Şəms', en:'Ash-Shams', ar:'الشمس', tr:'Şems', ru:'Аш-Шамс' },
    ],
    correct: 0,
  },
  {
    verse: 'سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى',
    options: [
      { az:'Əla', en:'Al-Ala', ar:'الأعلى', tr:'Ala', ru:'Аль-Аля' },
      { az:'Ğaşiyə', en:'Al-Ghashiyah', ar:'الغاشية', tr:'Gaşiye', ru:'Аль-Гашия' },
      { az:'Bələd', en:'Al-Balad', ar:'البلد', tr:'Beled', ru:'Аль-Балад' },
      { az:'Fəcr', en:'Al-Fajr', ar:'الفجر', tr:'Fecr', ru:'Аль-Фаджр' },
    ],
    correct: 0,
  },
  {
    verse: 'هَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ',
    options: [
      { az:'Ğaşiyə', en:'Al-Ghashiyah', ar:'الغاشية', tr:'Gaşiye', ru:'Аль-Гашия' },
      { az:'Əla', en:'Al-Ala', ar:'الأعلى', tr:'Ala', ru:'Аль-Аля' },
      { az:'Nəbə', en:'An-Naba', ar:'النبأ', tr:'Nebe', ru:'Ан-Наба' },
      { az:'Naziat', en:'An-Naziat', ar:'النازعات', tr:'Naziat', ru:'Ан-Назиат' },
    ],
    correct: 0,
  },
]

const STORAGE_SCORES = 'quran_game_scores'
const QUESTIONS_PER_ROUND = 10
const TIME_PER_Q = 30

function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_SCORES)
    return raw ? JSON.parse(raw) : { complete: 0, surah: 0 }
  } catch { return { complete: 0, surah: 0 } }
}

function saveScores(s) {
  try { localStorage.setItem(STORAGE_SCORES, JSON.stringify(s)) } catch {}
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuranGamePage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az
  const [scores, setScores] = useState(loadScores)
  const [mode, setMode] = useState(null) // 'complete' | 'surah'
  const [questions, setQuestions] = useState([])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [phase, setPhase] = useState('menu') // 'menu' | 'playing' | 'result'
  const timerRef = useRef(null)

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || answered) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setAnswered(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, answered, qIdx])

  const startGame = useCallback((m) => {
    setMode(m)
    const pool = m === 'complete' ? COMPLETE_QUESTIONS : FIND_SURAH_QUESTIONS
    setQuestions(shuffle(pool).slice(0, QUESTIONS_PER_ROUND))
    setQIdx(0)
    setSelected(null)
    setCorrectCount(0)
    setAnswered(false)
    setTimeLeft(TIME_PER_Q)
    setPhase('playing')
  }, [])

  const handleAnswer = useCallback((idx) => {
    if (answered) return
    clearInterval(timerRef.current)
    setSelected(idx)
    setAnswered(true)
    const q = questions[qIdx]
    if (idx === q.correct) {
      setCorrectCount(c => c + 1)
    }
  }, [answered, questions, qIdx])

  const nextQuestion = useCallback(() => {
    if (qIdx + 1 >= questions.length) {
      // Game over
      const finalScore = correctCount
      const key = mode === 'complete' ? 'complete' : 'surah'
      const best = scores[key]
      if (finalScore > best) {
        const newScores = { ...scores, [key]: finalScore }
        setScores(newScores)
        saveScores(newScores)
      }
      setPhase('result')
    } else {
      setQIdx(i => i + 1)
      setSelected(null)
      setAnswered(false)
      setTimeLeft(TIME_PER_Q)
    }
  }, [qIdx, questions, correctCount, mode, scores])

  const backToMenu = useCallback(() => {
    setPhase('menu')
    setMode(null)
  }, [])

  const q = questions[qIdx]
  const isNewBest = phase === 'result' && correctCount > 0 && correctCount >= (scores[mode === 'complete' ? 'complete' : 'surah'] || 0)

  return (
    <>
      <div className="page-hero theme-qurangame">
        <div className="breadcrumb">
          <button onClick={() => setPage('home')}>Muslim.cc</button>
          <span>/</span>
          <span>{t.title}</span>
        </div>
        <div className="page-hero-arabic">مسابقة القرآن</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner qgame-layout">

          {/* ── Mode Selection ── */}
          {phase === 'menu' && (
            <div className="qgame-menu anim-fadeUp">
              <h2 className="qgame-menu-title">{t.selectMode}</h2>
              <div className="qgame-modes">
                <button className="qgame-mode-card" onClick={() => startGame('complete')}>
                  <span className="qgame-mode-icon">✍️</span>
                  <span className="qgame-mode-name">{t.modeComplete}</span>
                  <span className="qgame-mode-best">{t.bestScore}: {scores.complete}/{QUESTIONS_PER_ROUND}</span>
                </button>
                <button className="qgame-mode-card" onClick={() => startGame('surah')}>
                  <span className="qgame-mode-icon">📖</span>
                  <span className="qgame-mode-name">{t.modeSurah}</span>
                  <span className="qgame-mode-best">{t.bestScore}: {scores.surah}/{QUESTIONS_PER_ROUND}</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Playing ── */}
          {phase === 'playing' && q && (
            <div className="qgame-play anim-fadeUp">
              {/* Progress & Timer */}
              <div className="qgame-top-bar">
                <button className="btn-ghost" onClick={backToMenu}>{t.back}</button>
                <span className="qgame-q-count">{t.question} {qIdx + 1}{t.of}{questions.length}</span>
                <span className={`qgame-timer ${timeLeft <= 5 ? 'danger' : ''}`}>
                  {timeLeft}s
                </span>
              </div>

              <div className="qgame-progress-bar">
                <div className="qgame-progress-fill" style={{ width: `${((qIdx) / questions.length) * 100}%` }} />
              </div>

              {/* Question */}
              <div className="qgame-question-card" key={qIdx}>
                {mode === 'complete' ? (
                  <>
                    <p className="qgame-instruction">{t.modeComplete}:</p>
                    <p className="qgame-verse arabic-text">{q.start} ...</p>
                  </>
                ) : (
                  <>
                    <p className="qgame-instruction">{t.modeSurah}:</p>
                    <p className="qgame-verse arabic-text">{q.verse}</p>
                  </>
                )}
              </div>

              {/* Options */}
              <div className="qgame-options">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correct
                  const isSelected = i === selected
                  let cls = 'qgame-option'
                  if (answered) {
                    if (isCorrect) cls += ' correct'
                    else if (isSelected) cls += ' wrong'
                    else cls += ' faded'
                  }
                  const label = typeof opt === 'string' ? opt : (opt[lang] || opt.en)
                  return (
                    <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={answered}>
                      <span className="qgame-option-letter">{String.fromCharCode(65 + i)}</span>
                      <span className={`qgame-option-text ${mode === 'complete' ? 'arabic-text' : ''}`}>{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* After answer info */}
              {answered && (
                <div className="qgame-answer-info anim-scaleIn">
                  {selected === q.correct ? (
                    <span className="qgame-result-badge correct">{t.correct}!</span>
                  ) : timeLeft === 0 && selected === null ? (
                    <span className="qgame-result-badge timeout">{t.timeUp}</span>
                  ) : (
                    <span className="qgame-result-badge wrong">{t.wrong}</span>
                  )}
                  {mode === 'complete' && q.fullVerse && (
                    <p className="qgame-full-verse arabic-text">{q.fullVerse}</p>
                  )}
                  {mode === 'complete' && q.surah && (
                    <p className="qgame-surah-ref">{t.fromSurah} {q.surah[lang] || q.surah.en}</p>
                  )}
                  <button className="btn-primary qgame-next-btn" onClick={nextQuestion}>
                    {qIdx + 1 >= questions.length ? t.finish : t.next}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Results ── */}
          {phase === 'result' && (
            <div className="qgame-results anim-fadeUp">
              <div className="qgame-results-card">
                {isNewBest && <div className="qgame-new-best anim-scaleIn">{t.newBest}</div>}
                <div className="qgame-results-icon">{correctCount >= 7 ? '🏆' : correctCount >= 4 ? '👍' : '💪'}</div>
                <h2>{t.result}</h2>
                <div className="qgame-results-score">
                  <span className="qgame-results-num">{correctCount}</span>
                  <span className="qgame-results-of">/ {questions.length}</span>
                </div>
                <div className="qgame-results-detail">
                  <span className="qgame-detail correct">{t.correct}: {correctCount}</span>
                  <span className="qgame-detail wrong">{t.wrong}: {questions.length - correctCount}</span>
                </div>
                <div className="qgame-results-actions">
                  <button className="btn-primary" onClick={() => startGame(mode)}>{t.playAgain}</button>
                  <button className="btn-secondary" onClick={backToMenu}>{t.back}</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
