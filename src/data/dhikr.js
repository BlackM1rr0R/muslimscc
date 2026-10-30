// ═══ ZİKRLƏR ═══
// Zikr sayğacı (DhikrPage) və ana səhifənin "Günün zikri" zolağı (DailyReminderBar)
// eyni siyahını istifadə edir. Siyahı DhikrPage.jsx-dən olduğu kimi köçürülüb —
// mətnləri burada dəyişəndə hər iki yerdə dəyişir.
//
// FƏZİLƏTLƏR (Sələf mənhəcinə uyğunlaşdırma): hər fəzilət yalnız səhih hədisə
// bağlanır və source sahəsində mənbəyi göstərilir (sunnah.com ilə yoxlanılıb):
//   Muslim 223 — "Sübhanəllah və Əlhəmdulillah göylə yer arasını doldurur",
//                "Əlhəmdulillah tərəzini doldurur"
//   Muslim 2137 — Allaha ən sevimli dörd kəlmə
//   Tirmizi 3383 — "Ən üstün zikr Lə ilahə illəllahdır" (Albani: həsən)
//   Muslim 2702 — Peyğəmbərin ﷺ gündə yüz dəfə istiğfarı
//   Buxari 6384 — "Lə həvlə..." Cənnət xəzinəsidir
//   Buxari 6405 — "Sübhanəllahi və bihəmdihi" gündə 100 dəfə
//   Tirmizi 3464 — "Sübhanəllahil-əzimi və bihəmdihi" deyənə Cənnətdə xurma ağacı
//                  (Albani: səhih, Silsilə Səhihə 64). Əvvəl bu fəzilət səhvən
//                  "Sübhanəllah"a, "Ərşin altında xəzinə" isə "Sübhanəllahil-əzim"ə yazılmışdı.
//   Muslim 408 — bir salavata Allahın on salavatı
//   Buxari 4563 — "Həsbunallahu..." İbrahimin (əleyhissəlam) odda dediyi söz
// Sayılar: 33/33/33 + 1 namazdan sonra — Muslim 597; 100 — Buxari 6405, Muslim 2702.

export const DHIKRS = [
  { az:'Sübhanəllah',  en:'SubhanAllah',  ru:'СубханАллах',  ar:'سُبْحَانَ اللَّه',    tr:'Sübhanallah',  arabic:'سُبۡحَانَ ٱللَّهِ', target:33,  source:'Muslim 223', virtue:{ az:'Sübhanəllah və Əlhəmdulillah göylərlə yerin arasını doldurur', en:'SubhanAllah and Alhamdulillah fill what is between the heavens and the earth', ru:'«СубханАллах» и «Альхамдулиллях» наполняют пространство между небесами и землёй', ar:'سبحان الله والحمد لله تملآن ما بين السماوات والأرض', tr:'Sübhanallah ve Elhamdülillah gökler ile yer arasını doldurur' } },
  { az:'Əlhəmdulillah',en:'Alhamdulillah',ru:'Альхамдулиллях',ar:'الحَمْدُ لِلَّه',   tr:'Elhamdülillah',arabic:'ٱلۡحَمۡدُ لِلَّهِ',   target:33,  source:'Muslim 223', virtue:{ az:'Tərəzini doldurur', en:'Fills the scales', ru:'Наполняет весы', ar:'تملأ الميزان', tr:'Tartıları doldurur' } },
  { az:'Allahu Əkbər', en:'Allahu Akbar', ru:'Аллаху Акбар',  ar:'اللَّهُ أَكْبَر',   tr:'Allahu Ekber', arabic:'ٱللَّهُ أَكۡبَرُ',    target:33,  source:'Muslim 2137', virtue:{ az:'Allaha ən sevimli dörd kəlmədən biridir', en:'One of the four words most beloved to Allah', ru:'Одно из четырёх слов, наиболее любимых Аллахом', ar:'من أحب الكلام إلى الله', tr:"Allah'a en sevimli dört sözden biridir" } },
  { az:'La ilahə illəllah', en:'La ilaha illallah', ru:'Ла иляха иллаллах', ar:'لَا إِلَهَ إِلَّا اللَّه', tr:'La ilahe illallah', arabic:'لَا إِلَٰهَ إِلَّا ٱللَّهُ', target:100, source:'Tirmizi 3383', virtue:{ az:'Ən üstün zikrdir', en:'The best of all dhikr', ru:'Лучший из всех зикров', ar:'أفضل الذكر', tr:'En üstün zikirdir' } },
  { az:'Əstəğfirullah', en:'Astaghfirullah', ru:'Астагфируллах', ar:'أَسْتَغْفِرُ اللَّه', tr:'Estağfirullah', arabic:'أَسۡتَغۡفِرُ ٱللَّهَ', target:100, source:'Muslim 2702', virtue:{ az:'Peyğəmbər ﷺ gündə yüz dəfə istiğfar edərdi', en:'The Prophet ﷺ sought forgiveness a hundred times a day', ru:'Пророк ﷺ просил прощения сто раз в день', ar:'كان النبي ﷺ يستغفر في اليوم مائة مرة', tr:'Peygamber ﷺ günde yüz defa istiğfar ederdi' } },
  { az:'La həvlə vəla quvvətə illə billah', en:'La hawla wa la quwwata illa billah', ru:'Ла хауля ва ля куввата илля биллях', ar:'لاَ حَوْلَ وَلاَ قُوَّةَ إِلَّا بِاللَّه', tr:'La havle vela kuvvete illa billah', arabic:'لَا حَوۡلَ وَلَا قُوَّةَ إِلَّا بِٱللَّهِ', target:33, source:'Buxari 6384', virtue:{ az:'Cənnət xəzinələrindən bir xəzinədir', en:'A treasure from the treasures of Paradise', ru:'Сокровище из сокровищ Рая', ar:'كنز من كنوز الجنة', tr:'Cennet hazinelerinden bir hazinedir' } },
  { az:'Sübhanəllahi və bihəmdihi', en:'SubhanAllahi wa bihamdihi', ru:'СубханАллахи ва бихамдихи', ar:'سُبْحَانَ اللَّهِ وَبِحَمْدِه', tr:'Sübhanallahi ve bihamdihi', arabic:'سُبۡحَانَ ٱللَّهِ وَبِحَمۡدِهِ', target:100, source:'Buxari 6405', virtue:{ az:'Gündə yüz dəfə deyənin günahları dəniz köpüyü qədər olsa da silinir', en:'Said a hundred times a day, sins are forgiven even if like sea foam', ru:'Кто скажет это сто раз в день, тому простятся грехи, даже если их как морской пены', ar:'من قالها في يوم مائة مرة حُطت خطاياه وإن كانت مثل زبد البحر', tr:'Günde yüz defa söyleyenin günahları deniz köpüğü kadar olsa da silinir' } },
  { az:'Sübhanəllahil-əzimi və bihəmdihi', en:'SubhanAllahil-Azeemi wa bihamdihi', ru:'СубханАллахиль-Азыми ва бихамдихи', ar:'سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِه', tr:'Sübhanallahil-azimi ve bihamdihi', arabic:'سُبۡحَانَ ٱللَّهِ ٱلۡعَظِيمِ وَبِحَمۡدِهِ', target:33, source:'Tirmizi 3464', virtue:{ az:'Deyənə Cənnətdə bir xurma ağacı əkilir', en:'A palm tree is planted for the one who says it in Paradise', ru:'Для сказавшего это сажается пальма в Раю', ar:'غُرست له نخلة في الجنة', tr:'Söyleyene Cennette bir hurma ağacı dikilir' } },
  { az:'Salavat', en:'Salawat', ru:'Салават', ar:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّد', tr:'Salavat', arabic:'ٱللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', target:100, source:'Muslim 408', virtue:{ az:'Bir salavat deyənə Allah on salavat edər', en:'Whoever sends one salawat, Allah sends ten upon him', ru:'Кто произнесёт один салават, тому Аллах воздаст десятью', ar:'من صلى عليّ واحدة صلى الله عليه عشرًا', tr:"Bir salavat getirene Allah on salavat eder" } },
  { az:'Həsbunallahu və niməl vəkil', en:'Hasbunallahu wa ni\'mal wakeel', ru:'ХасбунАллаху ва ни\'маль вакиль', ar:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيل', tr:'Hasbünallahü ve ni\'mel vekil', arabic:'حَسۡبُنَا ٱللَّهُ وَنِعۡمَ ٱلۡوَكِيلُ', target:33, source:'Buxari 4563', virtue:{ az:'İbrahimin atəşə atılarkən dediyi söz', en:'What Ibrahim said when thrown into the fire', ru:'Слова Ибрахима, когда его бросили в огонь', ar:'قالها إبراهيم حين ألقي في النار', tr:'İbrahim ateşe atıldığında söylediği söz' } },
]
