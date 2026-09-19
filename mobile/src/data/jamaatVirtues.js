// Camaat və cümə namazının fəzilətləri — AVTOMATİK YARADILIB, əl ilə redaktə etmə.
// Mətnlər src/data/hadiths.js və src/data/quotes.js-dən proqramla, bayt-bayt köçürülüb
// (ref sahəsi mənbə qeydini göstərir). Böyük hədis faylını (1.2 MB) camaat səhifəsinə
// yükləməmək üçün yalnız lazım olan qeydlər buradadır.
//
// Ayələr (Cümə 62:9, Bəqərə 2:43) burada DEYİL — onlar Quran səhifəsinin istifadə etdiyi
// api.alquran.cloud-dan işləmə zamanı gətirilir; mətn yaddaşdan yazılmır.
export const JAMAAT_VIRTUES = [
  {
    "ref": "hadiths.js#35",
    "source": "Buxari 645",
    "ar": "صَلاَةُ الجَمَاعَةِ تَفْضُلُ صَلاَةَ الفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً",
    "text": {
      "az": "Camaatla namaz tək başına namazdan iyirmi yeddi dərəcə üstündür.",
      "en": "Prayer in congregation is superior to individual prayer by twenty-seven degrees.",
      "ru": "Молитва в мечети превосходит одиночную молитву на двадцать семь степеней.",
      "tr": "Cemaatle namaz, tek başına kılınan namazdan yirmi yedi derece üstündür.",
      "ar": "صَلاَةُ الجَمَاعَةِ تَفْضُلُ صَلاَةَ الفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً"
    }
  },
  {
    "ref": "hadiths.js#1915",
    "source": "Muslim, Mesacid 260",
    "ar": "مَنْ صَلَّى الْعِشَاءَ فِي جَمَاعَةٍ فَكَأَنَّمَا قَامَ نِصْفَ اللَّيْلِ وَمَنْ صَلَّى الصُّبْحَ فِي جَمَاعَةٍ فَكَأَنَّمَا صَلَّى اللَّيْلَ كُلَّهُ",
    "text": {
      "az": "Kim işa namazını camaatla qılsa, gecənin yarısını ibadətlə keçirmiş kimidir. Kim sübh namazını camaatla qılsa, bütün gecəni namaz qılmış kimidir.",
      "en": "Whoever prays Isha in congregation, it is as if he stood in prayer for half the night. Whoever prays Fajr in congregation, it is as if he prayed the entire night.",
      "ru": "Кто помолится ишу в коллективе, как будто молился полночи. Кто помолится утреннюю в коллективе, как будто молился всю ночь.",
      "tr": "Kim yatsı namazını cemaatle kılarsa gecenin yarısını ibadetle geçirmiş gibidir. Kim sabah namazını cemaatle kılarsa bütün geceyi namaz kılmış gibidir.",
      "ar": "مَنْ صَلَّى الْعِشَاءَ فِي جَمَاعَةٍ فَكَأَنَّمَا قَامَ نِصْفَ اللَّيْلِ وَمَنْ صَلَّى الصُّبْحَ فِي جَمَاعَةٍ فَكَأَنَّمَا صَلَّى اللَّيْلَ كُلَّهُ"
    }
  }
]

export const JUMUA_VIRTUES = [
  {
    "ref": "quotes.js[353]",
    "source": "Muslim 854",
    "ar": "خَيْرُ يَوْمٍ طَلَعَتْ فِيهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ",
    "text": {
      "az": "Günəşin doğduğu ən xeyirli gün Cümə günüdür",
      "en": "The best day on which the sun rises is Friday",
      "ru": "Лучший день, в который восходит солнце, — пятница",
      "tr": "Güneşin doğduğu en hayırlı gün Cuma günüdür"
    }
  },
  {
    "ref": "hadiths.js#347",
    "source": "Muslim 857",
    "ar": "مَنْ تَوَضَّأَ فَأَحْسَنَ وُضُوءَهُ ثُمَّ أَتَى الجُمُعَةَ",
    "text": {
      "az": "Dəstəmazı gözəl alıb Cümə namazına gələn, iki Cümə arası günahlar üçün bağışlanma alar.",
      "en": "Whoever makes good ablution then comes to Friday prayer will be forgiven sins between the two Fridays.",
      "ru": "Кто хорошо совершит омовение и придёт на пятничную молитву, тому прощаются грехи между двумя пятницами.",
      "tr": "Abdestini güzel alıp Cuma namazına gelen, iki Cuma arasındaki günahlar için bağışlanır.",
      "ar": "مَنْ تَوَضَّأَ فَأَحْسَنَ وُضُوءَهُ ثُمَّ أَتَى الجُمُعَةَ"
    }
  },
  {
    "ref": "hadiths.js#870",
    "source": "Buxari 877",
    "ar": "مَنْ أَتَى الْجُمُعَةَ فَلْيَغْتَسِلْ",
    "text": {
      "az": "Kim Cüməyə gəlirsə, qüsl etsin.",
      "en": "Whoever comes to the Friday prayer, let him take a bath.",
      "ru": "Кто идёт на пятничную молитву, пусть совершит полное омовение.",
      "tr": "Kim Cuma namazına gelirse gusül alsın.",
      "ar": "مَنْ أَتَى الْجُمُعَةَ فَلْيَغْتَسِلْ"
    }
  }
]

export const VIRTUE_VERSES = [
  { ref: '62:9', topic: 'jumua' },
  { ref: '2:43', topic: 'jamaat' },
]
