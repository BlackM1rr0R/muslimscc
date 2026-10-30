// Allahın 99 gözəl adı (Əsmaül Hüsna) — az / en / ru / tr + ərəb
// DİQQƏT: "tr" sahəsi türkcə DEYİL — latın transliterasiyasıdır (Ar-Rahman),
// hər dildə adın altında göstərilir. Türkcə məna "tr_meaning"-dədir.
// NamesPage.jsx-dən çıxarıldı ki, Node skriptləri (məs. scripts/social)
// də oxuya bilsin — JSX faylından import etmək mümkün deyil.
//
// SİYAHININ MƏNBƏYİ:
// Şeyx Məhəmməd ibn Saleh əl-Useymin, "əl-Qavaid əl-Musla fi Sifatillahi
// Təala və Əsmaihil-Husna", altıncı qayda ("Allahın adları müəyyən bir saya
// məhdud deyil"). Şeyx Quran və səhih Sünnədən 99 ad toplayıb: 81-i Qurandan,
// 18-i Sünnədən — ardıcıllıq kitabdakı kimidir (əvvəl Qurandakılar, sonra
// Sünnədəkilər). Mətn iki nəşrdə tutuşdurulub:
//   https://shamela.ws/book/8874/19 , /20   (əl-Qavaid əl-Musla)
//   https://shamela.ws/book/12293/884 , /885 (Məcmu Fətava və Rəsail əl-Useymin)
// Şeyx özü "əl-Həfiyy" və "əl-Muhsin" adlarını daxil etməkdə tərəddüd etdiyini
// qeyd edib; izafətli adlar (Malikül-Mülk, Zülcəlali vəl-İkram) da Allahın
// adlarındandır, lakin bu siyahıya daxil edilməyib.
//
// SƏLƏF MÖVQEYİ (99 ad siyahısı haqqında):
// • "Allahın 99 adı var, kim onları sayıb-əzbərləsə Cənnətə girər" hədisi
//   səhihdir (Buxari 2736, Müslim 2677). Lakin adların Tirmizi 3507-dəki
//   sadalanması Peyğəmbərin ﷺ sözü deyil, ravinin əlavəsidir (idrac) —
//   İbn Teymiyyə, Məcmu əl-Fətava 6/379-382; İbn Useymin, "əl-Qavaid əl-Musla"
//   ("ولم يصح عن النبي ﷺ تعيين هذه الأسماء، والحديث المروي عنه تعيينها ضعيف").
//   Əvvəlki siyahı (Tirmizi 3507) buna görə bu siyahı ilə əvəz edildi.
// • Allahın adları 99-la məhdud deyil: "...əsəlukə bikulli ismin huvə ləkə..."
//   (Əhməd 3712; Albani: səhih) — eyni qaydada.
// • Sifətlər olduğu kimi isbat edilir: təhrif, təətil, keyfiyyət soruşmaq və
//   təşbih olmadan (əş-Şura 42:11). Mənalar Sədi təfsiri və İbn Useyminin
//   şərhlərinə uyğundur.
//
// "proof" sahəsi — adın Quran/Sünnədə AD kimi sabit olduğu yer:
//   q:'surə:ayə'  — Quranda ad kimi gəlir
//   s:'mənbə'     — səhih Sünnədə ad kimi gəlir (kitab + hədis nömrəsi)
// tests/unit/names99.test.js siyahının kitabdakı ilə eyni olduğunu yoxlayır.
// Köhnə siyahının URL-ləri: src/seo/detailSlugs.js → REMOVED_NAME_SLUGS.

export const NAMES_99 = [
  { n:1, ar:'ٱللَّهُ', tr:'Allah', az:'Uca Allah', en:'Allah', ru:'Аллах', tr_meaning:'Yüce Allah', proof:{ q:'59:22' } },
  { n:2, ar:'ٱلۡأَحَدُ', tr:'Al-Ahad', az:'Əhəd (Yeganə)', en:'The Unique', ru:'Единственный', tr_meaning:'Ehad (Tek)', proof:{ q:'112:1' } },
  { n:3, ar:'ٱلۡأَعۡلَىٰ', tr:'Al-A\'la', az:'Əla (Ən Uca — hər şeydən yuxarı olan)', en:'The Most High, Above All', ru:'Высочайший (превыше всего)', tr_meaning:'A\'lâ (Her Şeyin Üstünde Olan)', proof:{ q:'87:1' } },
  { n:4, ar:'ٱلۡأَكۡرَمُ', tr:'Al-Akram', az:'Əkrəm (Kərəmi ən çox olan)', en:'The Most Generous', ru:'Щедрейший', tr_meaning:'Ekrem (Cömertliği En Büyük)', proof:{ q:'96:3' } },
  { n:5, ar:'ٱلۡإِلَٰهُ', tr:'Al-Ilah', az:'İlah (Haqq olaraq ibadət edilən yeganə Məbud)', en:'The God (the only One truly worshipped)', ru:'Бог (единственный, кто истинно достоин поклонения)', tr_meaning:'İlâh (Hak Olarak İbadet Edilen Tek Mabud)', proof:{ q:'2:163' } },
  { n:6, ar:'ٱلۡأَوَّلُ', tr:'Al-Awwal', az:'Əvvəl (İlk Olan)', en:'The First', ru:'Первый', tr_meaning:'Evvel (Başlangıcı Olmayan)', proof:{ q:'57:3' } },
  { n:7, ar:'ٱلۡآخِرُ', tr:'Al-Akhir', az:'Axir (Son Olan)', en:'The Last', ru:'Последний', tr_meaning:'Âhir (Sonu Olmayan)', proof:{ q:'57:3' } },
  { n:8, ar:'ٱلظَّاهِرُ', tr:'Az-Zahir', az:'Zahir (Ən Uca — Ondan yuxarı heç nə yoxdur)', en:'The Most High (nothing is above Him)', ru:'Явный (нет ничего выше Него)', tr_meaning:'Zâhir (Üstünde Hiçbir Şey Olmayan)', proof:{ q:'57:3' } },
  { n:9, ar:'ٱلۡبَاطِنُ', tr:'Al-Batin', az:'Batin (Ondan yaxın heç nə yoxdur)', en:'The Most Near (nothing is nearer than Him)', ru:'Скрытый (нет ничего ближе Него)', tr_meaning:'Bâtın (Ondan Daha Yakın Hiçbir Şey Olmayan)', proof:{ q:'57:3' } },
  { n:10, ar:'ٱلۡبَارِئُ', tr:'Al-Bari\'', az:'Bari (Var Edən)', en:'The Originator', ru:'Создатель', tr_meaning:'Bâri (Kusursuz Yaratan)', proof:{ q:'59:24' } },
  { n:11, ar:'ٱلۡبَرُّ', tr:'Al-Barr', az:'Bərr (Yaxşılıq Edən)', en:'The Source of Goodness', ru:'Источник добра', tr_meaning:'Berr (İyilik Eden)', proof:{ q:'52:28' } },
  { n:12, ar:'ٱلۡبَصِيرُ', tr:'Al-Basir', az:'Bəsir (Görən)', en:'The All-Seeing', ru:'Всевидящий', tr_meaning:'Basîr (Her Şeyi Gören)', proof:{ q:'42:11' } },
  { n:13, ar:'ٱلتَّوَّابُ', tr:'At-Tawwab', az:'Təvvab (Tövbəni Qəbul Edən)', en:'The Acceptor of Repentance', ru:'Принимающий покаяние', tr_meaning:'Tevvâb (Tövbeleri Kabul Eden)', proof:{ q:'2:37' } },
  { n:14, ar:'ٱلۡجَبَّارُ', tr:'Al-Jabbar', az:'Cəbbar (Qüdrətli)', en:'The Compeller', ru:'Всесильный', tr_meaning:'Cebbâr (Dilediğini Yaptıran)', proof:{ q:'59:23' } },
  { n:15, ar:'ٱلۡحَافِظُ', tr:'Al-Haafiz', az:'Hafiz (Qoruyub saxlayan)', en:'The Guardian', ru:'Охраняющий', tr_meaning:'Hâfız (Koruyup Gözeten)', proof:{ q:'12:64' } },
  { n:16, ar:'ٱلۡحَسِيبُ', tr:'Al-Hasib', az:'Həsib (Hesablayan)', en:'The Reckoner', ru:'Учитывающий', tr_meaning:'Hasîb (Hesaba Çeken)', proof:{ q:'4:6' } },
  { n:17, ar:'ٱلۡحَفِيظُ', tr:'Al-Hafiz', az:'Həfiz (Qoruyan)', en:'The Preserver', ru:'Хранящий', tr_meaning:'Hafîz (Koruyan)', proof:{ q:'11:57' } },
  { n:18, ar:'ٱلۡحَفِيُّ', tr:'Al-Hafiyy', az:'Həfiyy (Bəndəsinə lütfkar, ona qayğı göstərən)', en:'The Ever-Gracious (to His servant)', ru:'Благосклонный (к Своему рабу)', tr_meaning:'Hafiyy (Kuluna Karşı Lütufkâr)', proof:{ q:'19:47' } },
  { n:19, ar:'ٱلۡحَقُّ', tr:'Al-Haqq', az:'Haqq (Varlığı Həqiqi Olan)', en:'The Truth', ru:'Истинный', tr_meaning:'Hak (Varlığı Gerçek Olan)', proof:{ q:'24:25' } },
  { n:20, ar:'ٱلۡمُبِينُ', tr:'Al-Mubin', az:'Mübin (Haqlığı aşkar olan, haqqı aydınlaşdıran)', en:'The Manifest (who makes the truth clear)', ru:'Явный (разъясняющий истину)', tr_meaning:'Mübîn (Apaçık Olan, Hakkı Açıklayan)', proof:{ q:'24:25' } },
  { n:21, ar:'ٱلۡحَكِيمُ', tr:'Al-Hakim', az:'Həkim (Hikmət Sahibi)', en:'The Wise', ru:'Мудрый', tr_meaning:'Hakîm (Hikmet Sahibi)', proof:{ q:'59:24' } },
  { n:22, ar:'ٱلۡحَلِيمُ', tr:'Al-Halim', az:'Həlim (Tələsmədən Cəzalandırmayan)', en:'The Forbearing', ru:'Кроткий', tr_meaning:'Halîm (Cezada Acele Etmeyen)', proof:{ q:'2:235' } },
  { n:23, ar:'ٱلۡحَمِيدُ', tr:'Al-Hamid', az:'Həmid (Həmd Edilən)', en:'The Praiseworthy', ru:'Достохвальный', tr_meaning:'Hamîd (Övülmeye Layık)', proof:{ q:'42:28' } },
  { n:24, ar:'ٱلۡحَيُّ', tr:'Al-Hayy', az:'Həyy (Diri Olan)', en:'The Ever-Living', ru:'Живой', tr_meaning:'Hayy (Diri)', proof:{ q:'2:255' } },
  { n:25, ar:'ٱلۡقَيُّومُ', tr:'Al-Qayyum', az:'Qayyum (Özü Mövcud)', en:'The Self-Sustaining', ru:'Самодостаточный', tr_meaning:'Kayyûm (Her Şeyi Ayakta Tutan)', proof:{ q:'2:255' } },
  { n:26, ar:'ٱلۡخَبِيرُ', tr:'Al-Khabir', az:'Xəbir (Xəbərdar)', en:'The All-Aware', ru:'Осведомлённый', tr_meaning:'Habîr (Her Şeyden Haberdar)', proof:{ q:'6:103' } },
  { n:27, ar:'ٱلۡخَٰلِقُ', tr:'Al-Khaliq', az:'Xaliq (Yaradan)', en:'The Creator', ru:'Творец', tr_meaning:'Hâlık (Yaratan)', proof:{ q:'59:24' } },
  { n:28, ar:'ٱلۡخَلَّٰقُ', tr:'Al-Khallaq', az:'Xəllaq (Daim və çoxlu yaradan)', en:'The Ever-Creating', ru:'Непрестанно творящий', tr_meaning:'Hallâk (Durmadan Yaratan)', proof:{ q:'36:81' } },
  { n:29, ar:'ٱلرَّءُوفُ', tr:'Ar-Ra\'uf', az:'Rəuf (Şəfqətli)', en:'The Most Kind', ru:'Снисходительный', tr_meaning:'Raûf (Çok Şefkatli)', proof:{ q:'2:143' } },
  { n:30, ar:'ٱلرَّحۡمَٰنُ', tr:'Ar-Rahman', az:'Rəhman (Çox Rəhimli)', en:'The Most Gracious', ru:'Всемилостивый', tr_meaning:'Rahmân (Çok Merhametli)', proof:{ q:'59:22' } },
  { n:31, ar:'ٱلرَّحِيمُ', tr:'Ar-Rahim', az:'Rəhim (Çox Mərhəmətli)', en:'The Most Merciful', ru:'Милосердный', tr_meaning:'Rahîm (Çok Esirgeyen)', proof:{ q:'59:22' } },
  { n:32, ar:'ٱلرَّزَّاقُ', tr:'Ar-Razzaq', az:'Rəzzaq (Ruzi Verən)', en:'The Provider', ru:'Питающий', tr_meaning:'Rezzâk (Rızık Veren)', proof:{ q:'51:58' } },
  { n:33, ar:'ٱلرَّقِيبُ', tr:'Ar-Raqib', az:'Rəqib (Nəzarət edən)', en:'The Watchful', ru:'Бдительный', tr_meaning:'Rakîb (Gözetleyen)', proof:{ q:'4:1' } },
  { n:34, ar:'ٱلسَّلَٰمُ', tr:'As-Salam', az:'Salam (Əmin-Amanlıq)', en:'The Source of Peace', ru:'Мир', tr_meaning:'Selâm (Esenlik Veren)', proof:{ q:'59:23' } },
  { n:35, ar:'ٱلسَّمِيعُ', tr:'As-Sami', az:'Səmi (Eşidən)', en:'The All-Hearing', ru:'Всеслышащий', tr_meaning:'Semî (Her Şeyi İşiten)', proof:{ q:'42:11' } },
  { n:36, ar:'ٱلشَّاكِرُ', tr:'Ash-Shakir', az:'Şakir (Əməlin əvəzini artıqlaması ilə verən)', en:'The Rewarder of Good Deeds', ru:'Вознаграждающий (за благие дела)', tr_meaning:'Şâkir (Amellerin Karşılığını Fazlasıyla Veren)', proof:{ q:'2:158' } },
  { n:37, ar:'ٱلشَّكُورُ', tr:'Ash-Shakur', az:'Şəkur (Şükür Edən)', en:'The Appreciative', ru:'Благодарный', tr_meaning:'Şekûr (Az İyiliğe Çok Karşılık Veren)', proof:{ q:'35:30' } },
  { n:38, ar:'ٱلشَّهِيدُ', tr:'Ash-Shahid', az:'Şəhid (Şahid Olan)', en:'The Witness', ru:'Свидетель', tr_meaning:'Şehîd (Her Şeye Şahit)', proof:{ q:'4:79' } },
  { n:39, ar:'ٱلصَّمَدُ', tr:'As-Samad', az:'Saməd (Ehtiyacsız)', en:'The Eternal', ru:'Самодостаточный', tr_meaning:'Samed (Hiçbir Şeye Muhtaç Olmayan)', proof:{ q:'112:2' } },
  { n:40, ar:'ٱلۡعَٰلِمُ', tr:'Al-\'Aalim', az:'Alim (Qeybi və aşkarı bilən)', en:'The Knower (of the unseen and the seen)', ru:'Знающий (сокровенное и явное)', tr_meaning:'Âlim (Gaybı ve Görüneni Bilen)', proof:{ q:'6:73' } },
  { n:41, ar:'ٱلۡعَزِيزُ', tr:'Al-\'Aziz', az:'Əziz (Güclü, Üstün)', en:'The Almighty', ru:'Могущественный', tr_meaning:'Azîz (Mağlup Edilmeyen, Üstün)', proof:{ q:'59:23' } },
  { n:42, ar:'ٱلۡعَظِيمُ', tr:'Al-\'Azim', az:'Əzim (Böyük)', en:'The Great', ru:'Великий', tr_meaning:'Azîm (Pek Büyük)', proof:{ q:'2:255' } },
  { n:43, ar:'ٱلۡعَفُوُّ', tr:'Al-\'Afuww', az:'Əfuv (Əfv Edən)', en:'The Pardoner', ru:'Прощающий', tr_meaning:'Afüvv (Affeden)', proof:{ q:'4:43' } },
  { n:44, ar:'ٱلۡعَلِيمُ', tr:'Al-\'Alim', az:'Əlim (Hər Şeyi Bilən)', en:'The All-Knowing', ru:'Всезнающий', tr_meaning:'Alîm (Her Şeyi Bilen)', proof:{ q:'2:32' } },
  { n:45, ar:'ٱلۡعَلِيُّ', tr:'Al-\'Aliyy', az:'Əliyy (Uca — zatı, qədri və qəhri ilə)', en:'The Most High (in essence, rank and dominion)', ru:'Всевышний (Сущностью, достоинством и господством)', tr_meaning:'Aliyy (Zâtı, Kadri ve Kahrıyla Yüce)', proof:{ q:'2:255' } },
  { n:46, ar:'ٱلۡغَفَّارُ', tr:'Al-Ghaffar', az:'Ğaffar (Çox Bağışlayan)', en:'The Ever-Forgiving', ru:'Всепрощающий', tr_meaning:'Gaffâr (Çok Bağışlayan)', proof:{ q:'38:66' } },
  { n:47, ar:'ٱلۡغَفُورُ', tr:'Al-Ghafur', az:'Ğəfur (Bağışlayan)', en:'The Forgiving', ru:'Прощающий', tr_meaning:'Gafûr (Bağışlayan)', proof:{ q:'15:49' } },
  { n:48, ar:'ٱلۡغَنِيُّ', tr:'Al-Ghani', az:'Ğani (Ehtiyacsız)', en:'The Rich', ru:'Богатый', tr_meaning:'Ganî (Hiçbir Şeye Muhtaç Olmayan)', proof:{ q:'35:15' } },
  { n:49, ar:'ٱلۡفَتَّاحُ', tr:'Al-Fattah', az:'Fəttah (Açan)', en:'The Opener', ru:'Открывающий', tr_meaning:'Fettâh (Açan)', proof:{ q:'34:26' } },
  { n:50, ar:'ٱلۡقَادِرُ', tr:'Al-Qadir', az:'Qadir (Qadir Olan)', en:'The All-Powerful', ru:'Всемогущий', tr_meaning:'Kâdir (Gücü Yeten)', proof:{ q:'6:65' } },
  { n:51, ar:'ٱلۡقَاهِرُ', tr:'Al-Qahir', az:'Qahir (Bəndələri üzərində qalib olan)', en:'The Irresistible (above His servants)', ru:'Господствующий (над Своими рабами)', tr_meaning:'Kâhir (Kulları Üzerinde Galip Olan)', proof:{ q:'6:18' } },
  { n:52, ar:'ٱلۡقُدُّوسُ', tr:'Al-Quddus', az:'Quddus (Müqəddəs)', en:'The Most Holy', ru:'Священный', tr_meaning:'Kuddûs (Her Eksiklikten Uzak)', proof:{ q:'59:23' } },
  { n:53, ar:'ٱلۡقَدِيرُ', tr:'Al-Qadeer', az:'Qədir (Hər şeyə qadir olan)', en:'The Omnipotent (over all things)', ru:'Всемогущий (над всякой вещью)', tr_meaning:'Kadîr (Her Şeye Gücü Yeten)', proof:{ q:'30:54' } },
  { n:54, ar:'ٱلۡقَرِيبُ', tr:'Al-Qarib', az:'Qərib (Yaxın — dua edənə cavab verən)', en:'The Near (answering those who call on Him)', ru:'Близкий (отвечающий взывающим к Нему)', tr_meaning:'Karîb (Yakın — Dua Edene İcabet Eden)', proof:{ q:'11:61' } },
  { n:55, ar:'ٱلۡقَوِيُّ', tr:'Al-Qawiyy', az:'Qəvi (Güclü)', en:'The Strong', ru:'Сильный', tr_meaning:'Kaviyy (Pek Güçlü)', proof:{ q:'22:40' } },
  { n:56, ar:'ٱلۡقَهَّارُ', tr:'Al-Qahhar', az:'Qahhar (Qalib Gələn)', en:'The Subduer', ru:'Всепобеждающий', tr_meaning:'Kahhâr (Her Şeye Galip Gelen)', proof:{ q:'13:16' } },
  { n:57, ar:'ٱلۡكَبِيرُ', tr:'Al-Kabir', az:'Kəbir (Böyük)', en:'The Most Great', ru:'Величайший', tr_meaning:'Kebîr (Pek Büyük)', proof:{ q:'13:9' } },
  { n:58, ar:'ٱلۡكَرِيمُ', tr:'Al-Karim', az:'Kərim (Kərəmli)', en:'The Generous', ru:'Щедрый', tr_meaning:'Kerîm (Cömert)', proof:{ q:'82:6' } },
  { n:59, ar:'ٱللَّطِيفُ', tr:'Al-Latif', az:'Lətif (Nazik, Xeyirxah)', en:'The Subtle', ru:'Тонкий', tr_meaning:'Latîf (Lütufkâr, İnceliklere Vâkıf)', proof:{ q:'6:103' } },
  { n:60, ar:'ٱلۡمُؤۡمِنُ', tr:'Al-Mu\'min', az:'Mömin (Güvən Verən)', en:'The Guardian of Faith', ru:'Дающий веру', tr_meaning:'Mü\'min (Güven Veren)', proof:{ q:'59:23' } },
  { n:61, ar:'ٱلۡمُتَعَالِي', tr:'Al-Muta\'ali', az:'Mütəali (Yüksək)', en:'The Most Exalted', ru:'Превозвышенный', tr_meaning:'Müteâlî (Pek Yüce)', proof:{ q:'13:9' } },
  { n:62, ar:'ٱلۡمُتَكَبِّرُ', tr:'Al-Mutakabbir', az:'Mütəkəbbir (Uca)', en:'The Supreme', ru:'Превеликий', tr_meaning:'Mütekebbir (Büyüklükte Eşsiz)', proof:{ q:'59:23' } },
  { n:63, ar:'ٱلۡمَتِينُ', tr:'Al-Matin', az:'Mətin (Möhkəm)', en:'The Firm', ru:'Твёрдый', tr_meaning:'Metîn (Çok Sağlam)', proof:{ q:'51:58' } },
  { n:64, ar:'ٱلۡمُجِيبُ', tr:'Al-Mujib', az:'Mücib (Cavab Verən)', en:'The Responsive', ru:'Отвечающий', tr_meaning:'Mucîb (Duaları Kabul Eden)', proof:{ q:'11:61' } },
  { n:65, ar:'ٱلۡمَجِيدُ', tr:'Al-Majid', az:'Məcid (Şanlı)', en:'The Most Glorious', ru:'Славный', tr_meaning:'Mecîd (Şanı Yüce)', proof:{ q:'11:73' } },
  { n:66, ar:'ٱلۡمُحِيطُ', tr:'Al-Muhit', az:'Mühit (Elmi və qüdrəti ilə hər şeyi əhatə edən)', en:'The Encompasser (in knowledge and power)', ru:'Охватывающий (знанием и могуществом)', tr_meaning:'Muhît (İlmi ve Kudretiyle Her Şeyi Kuşatan)', proof:{ q:'4:126' } },
  { n:67, ar:'ٱلۡمُصَوِّرُ', tr:'Al-Musawwir', az:'Müsavvir (Şəkilverən)', en:'The Fashioner', ru:'Дающий облик', tr_meaning:'Musavvir (Şekil Veren)', proof:{ q:'59:24' } },
  { n:68, ar:'ٱلۡمُقۡتَدِرُ', tr:'Al-Muqtadir', az:'Müqtədir (Güclü)', en:'The Powerful', ru:'Могущественный', tr_meaning:'Muktedir (Kudret Sahibi)', proof:{ q:'54:42' } },
  { n:69, ar:'ٱلۡمُقِيتُ', tr:'Al-Muqit', az:'Müqit (Qüvvət Verən)', en:'The Nourisher', ru:'Питающий', tr_meaning:'Mukît (Güç ve Rızık Veren)', proof:{ q:'4:85' } },
  { n:70, ar:'ٱلۡمَلِكُ', tr:'Al-Malik', az:'Malik (Hökmdar)', en:'The King', ru:'Царь', tr_meaning:'Melik (Mülkün Sahibi, Hükümdar)', proof:{ q:'59:23' } },
  { n:71, ar:'ٱلۡمَلِيكُ', tr:'Al-Maleek', az:'Məlik (Mülkü kamil olan Hökmdar)', en:'The Sovereign', ru:'Владыка', tr_meaning:'Melîk (Mülkü Kâmil Olan Hükümdar)', proof:{ q:'54:55' } },
  { n:72, ar:'ٱلۡمَوۡلَىٰ', tr:'Al-Mawla', az:'Məvla (Möminlərin Sahibi və Yardımçısı)', en:'The Patron (of the believers)', ru:'Господин и Заступник (верующих)', tr_meaning:'Mevlâ (Müminlerin Sahibi ve Yardımcısı)', proof:{ q:'8:40' } },
  { n:73, ar:'ٱلۡمُهَيۡمِنُ', tr:'Al-Muhaymin', az:'Müheymin (Qoruyucu)', en:'The Protector', ru:'Хранитель', tr_meaning:'Müheymin (Gözetip Koruyan)', proof:{ q:'59:23' } },
  { n:74, ar:'ٱلنَّصِيرُ', tr:'An-Nasir', az:'Nəsir (Yardım Edən)', en:'The Helper', ru:'Помощник', tr_meaning:'Nasîr (Yardım Eden)', proof:{ q:'8:40' } },
  { n:75, ar:'ٱلۡوَاحِدُ', tr:'Al-Wahid', az:'Vahid (Bir Olan)', en:'The One', ru:'Единый', tr_meaning:'Vâhid (Bir)', proof:{ q:'13:16' } },
  { n:76, ar:'ٱلۡوَارِثُ', tr:'Al-Warith', az:'Varis (Hər Şeyin Varisi)', en:'The Inheritor', ru:'Наследующий', tr_meaning:'Vâris (Her Şeyin Asıl Sahibi)', proof:{ q:'15:23' } },
  { n:77, ar:'ٱلۡوَٰسِعُ', tr:'Al-Wasi', az:'Vasi (Genişlik Verən)', en:'The All-Encompassing', ru:'Объемлющий', tr_meaning:'Vâsi (Rahmeti Geniş)', proof:{ q:'2:115' } },
  { n:78, ar:'ٱلۡوَدُودُ', tr:'Al-Wadud', az:'Vədud (Sevən)', en:'The Loving', ru:'Любящий', tr_meaning:'Vedûd (Seven, Sevilen)', proof:{ q:'85:14' } },
  { n:79, ar:'ٱلۡوَكِيلُ', tr:'Al-Wakil', az:'Vəkil (Hər İşi Ona Həvalə Edilən)', en:'The Trustee', ru:'Попечитель', tr_meaning:'Vekîl (Kendisine Güvenilen)', proof:{ q:'3:173' } },
  { n:80, ar:'ٱلۡوَلِيُّ', tr:'Al-Waliyy', az:'Vəliy (Dost)', en:'The Protecting Friend', ru:'Покровитель', tr_meaning:'Veliyy (Dost)', proof:{ q:'42:9' } },
  { n:81, ar:'ٱلۡوَهَّابُ', tr:'Al-Wahhab', az:'Vəhhab (Çox Bəxş Edən)', en:'The Bestower', ru:'Щедродарящий', tr_meaning:'Vehhâb (Karşılıksız Veren)', proof:{ q:'38:9' } },
  { n:82, ar:'ٱلۡجَمِيلُ', tr:'Al-Jamil', az:'Cəmil (Zatı, adları, sifətləri və işləri gözəl olan)', en:'The Beautiful', ru:'Прекрасный', tr_meaning:'Cemîl (Zâtı, İsimleri ve Sıfatları Güzel Olan)', proof:{ s:'Muslim 91' } },
  { n:83, ar:'ٱلۡجَوَادُ', tr:'Al-Jawad', az:'Cəvad (Çox Səxavətli)', en:'The Most Bountiful', ru:'Щедро дающий', tr_meaning:'Cevâd (Çok Cömert)', proof:{ s:'Tirmidhi 2799; Bayhaqi, Shuab al-Iman' } },
  { n:84, ar:'ٱلۡحَكَمُ', tr:'Al-Hakam', az:'Həkəm (Hökm Edən)', en:'The Judge', ru:'Судья', tr_meaning:'Hakem (Hükmeden)', proof:{ s:'Abu Dawud 4955; Nasai 5387' } },
  { n:85, ar:'ٱلۡحَيِيُّ', tr:'Al-Hayiyy', az:'Həyiyy (Həya sahibi — Ona layiq şəkildə)', en:'The Modest (as befits Him)', ru:'Стыдливый (как подобает Ему)', tr_meaning:'Hayiyy (Kendisine Yakışır Şekilde Hayâ Sahibi)', proof:{ s:'Abu Dawud 1488; Tirmidhi 3556' } },
  { n:86, ar:'ٱلرَّبُّ', tr:'Ar-Rabb', az:'Rəbb (Yaradan, Malik və hər işi idarə edən)', en:'The Lord', ru:'Господь', tr_meaning:'Rab (Yaratan, Sahip Olan ve Yöneten)', proof:{ s:'Muslim 479' } },
  { n:87, ar:'ٱلرَّفِيقُ', tr:'Ar-Rafiq', az:'Rəfiq (Mülayim, mülayimliyi sevən)', en:'The Gentle', ru:'Мягкий (любящий мягкость)', tr_meaning:'Refîk (Yumuşak Davranan, Yumuşaklığı Seven)', proof:{ s:'Bukhari 6927; Muslim 2593' } },
  { n:88, ar:'ٱلسُّبُّوحُ', tr:'As-Subbuh', az:'Sübbuh (Hər nöqsandan pak olan)', en:'The Glorified (free of every imperfection)', ru:'Пречистый', tr_meaning:'Sübbûh (Her Eksiklikten Münezzeh)', proof:{ s:'Muslim 487' } },
  { n:89, ar:'ٱلسَّيِّدُ', tr:'As-Sayyid', az:'Seyyid (Kamil mənada Ağa)', en:'The Master', ru:'Господин', tr_meaning:'Seyyid (Mutlak Efendi)', proof:{ s:'Abu Dawud 4806' } },
  { n:90, ar:'ٱلشَّافِي', tr:'Ash-Shafi', az:'Şafi (Şəfa Verən)', en:'The Healer', ru:'Исцеляющий', tr_meaning:'Şâfî (Şifa Veren)', proof:{ s:'Bukhari 5675; Muslim 2191' } },
  { n:91, ar:'ٱلطَّيِّبُ', tr:'At-Tayyib', az:'Təyyib (Pak olan, yalnız pak olanı qəbul edən)', en:'The Pure (accepting only what is pure)', ru:'Благой (принимающий лишь благое)', tr_meaning:'Tayyib (Temiz, Yalnız Temiz Olanı Kabul Eden)', proof:{ s:'Muslim 1015' } },
  { n:92, ar:'ٱلۡقَابِضُ', tr:'Al-Qabid', az:'Qabiz (Tutan)', en:'The Restrainer', ru:'Сжимающий', tr_meaning:'Kâbız (Daraltan)', proof:{ s:'Abu Dawud 3451; Tirmidhi 1314' } },
  { n:93, ar:'ٱلۡبَاسِطُ', tr:'Al-Basit', az:'Basit (Genişləndirən)', en:'The Extender', ru:'Расширяющий', tr_meaning:'Bâsıt (Genişleten)', proof:{ s:'Abu Dawud 3451; Tirmidhi 1314' } },
  { n:94, ar:'ٱلۡمُقَدِّمُ', tr:'Al-Muqaddim', az:'Müqəddim (Öndə Tutan)', en:'The Expediter', ru:'Опережающий', tr_meaning:'Mukaddim (Öne Alan)', proof:{ s:'Bukhari 1120; Muslim 771' } },
  { n:95, ar:'ٱلۡمُؤَخِّرُ', tr:'Al-Mu\'akhkhir', az:'Mü\'əxxir (Arxada Tutan)', en:'The Delayer', ru:'Откладывающий', tr_meaning:'Muahhir (Geriye Bırakan)', proof:{ s:'Bukhari 1120; Muslim 771' } },
  { n:96, ar:'ٱلۡمُحۡسِنُ', tr:'Al-Muhsin', az:'Mühsin (Ehsan və yaxşılıq edən)', en:'The Doer of Good', ru:'Благодетельный', tr_meaning:'Muhsin (İhsan Eden)', proof:{ s:'Tabarani, al-Mujam al-Awsat' } },
  { n:97, ar:'ٱلۡمُعۡطِي', tr:'Al-Mu\'ti', az:'Mu\'ti (Verən, Bəxş edən)', en:'The Giver', ru:'Дающий', tr_meaning:'Mu\'tî (Veren)', proof:{ s:'Bukhari 3116' } },
  { n:98, ar:'ٱلۡمَنَّانُ', tr:'Al-Mannan', az:'Mənnan (Nemətləri bol olan)', en:'The Bestower of Favours', ru:'Оказывающий милости', tr_meaning:'Mennân (Nimeti Bol Olan)', proof:{ s:'Abu Dawud 1495; Nasai 1300' } },
  { n:99, ar:'ٱلۡوِتۡرُ', tr:'Al-Witr', az:'Vitr (Tək — şəriki və bənzəri olmayan)', en:'The Single (without partner or like)', ru:'Непарный (без сотоварища и подобия)', tr_meaning:'Vitr (Tek, Eşi ve Benzeri Olmayan)', proof:{ s:'Bukhari 6410; Muslim 2677' } },
]
