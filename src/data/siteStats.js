// ═══════════════════════════════════════════════════════
// Saytın say iddiaları — bir yerdə, ki ana səhifə və "Haqqımızda"
// eyni rəqəmi göstərsin.
//
// HƏDİS SAYI — yalnız DOĞRU rəqəm. src/data/hadiths.js-də 2000 qeyd var,
// amma hamısı ayrı hədis deyil:
//   • təkrarlar çıxarılır (utils/uniqueHadiths) → /hadith siyahısında 1482;
//   • onlardan 86-sının mənbəyi Quran surəsidir (ayədir), 2-si "Məşhur"
//     sözdür (utils/search → isNotHadith) → HƏDİS olaraq 1394 qalır.
// 2026-10-31: Sələf mühəddislərinin hökmünə görə zəif/uydurma rəvayətlər çıxarıldı (src/data/hadithsRemoved.json) → 1254.
// 2026-11-14: nömrəsiz (yoxlanıla bilməyən) mənbəli 137 qeyd göstərilmir (hadiths.js → isVerifiableSource) →
// təkrarsız 1228, ayələr çıxanda HƏDİS olaraq 1143 → yuvarlaqlaşdırılmış, şişirdilməmiş "1100+".
// hadiths.js ~1.2 MB-dır — saymaq üçün import edilmir; data dəyişəndə bu
// rəqəmi, src/seo/meta.js-dəki hadith başlıq/təsvirlərini və index.html-dəki
// meta təsviri birlikdə yenilə.
// ═══════════════════════════════════════════════════════
export const HADITH_COUNT = 1100
