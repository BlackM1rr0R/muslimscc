// ═══════════════════════════════════════════════════════
// Saytın say iddiaları — bir yerdə, ki ana səhifə və "Haqqımızda"
// eyni rəqəmi göstərsin.
//
// HƏDİS SAYI — yalnız DOĞRU rəqəm. src/data/hadiths.js-də 2000 qeyd var,
// amma hamısı ayrı hədis deyil:
//   • təkrarlar çıxarılır (utils/uniqueHadiths) → /hadith siyahısında 1482;
//   • onlardan 86-sının mənbəyi Quran surəsidir (ayədir), 2-si "Məşhur"
//     sözdür (utils/search → isNotHadith) → HƏDİS olaraq 1394 qalır.
// 1254 → yuvarlaqlaşdırılmış, şişirdilməmiş "1250+" (2026-10-31: Sələf mühəddislərinin hökmünə görə zəif/uydurma rəvayətlər çıxarıldı — src/data/hadithsRemoved.json).
// hadiths.js ~1.2 MB-dır — saymaq üçün import edilmir; data dəyişəndə bu
// rəqəmi, src/seo/meta.js-dəki hadith başlıq/təsvirlərini və index.html-dəki
// meta təsviri birlikdə yenilə.
// ═══════════════════════════════════════════════════════
export const HADITH_COUNT = 1250
