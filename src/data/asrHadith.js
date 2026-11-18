// ═══════════════════════════════════════════════════════
// Cəbrail hədisi — əsr vaxtı (components/prayer/AsrShadow.jsx)
// Əbu Davud 393 (əl-Albani: həsən səhih), Tirmizi 149 — sunnah.com, hadith-api.
//
// NİYƏ src/data: dini mətn UI obyektində olsa, əlavə dillərdə uiText lüğəti ilə
// (süni) tərcümə olunardı. src/data lüğət plaqininin fayl dəstindən kənardadır —
// əlavə dillər ingiliscə mətni görür (qayda: dini mətn süni tərcümə edilmir).
// ═══════════════════════════════════════════════════════

// lang-ok: hədisin ərəb mətni (Əbu Davud 393, hadith-api ilə söz-söz eyni) — tərcümə edilmir
export const ASR_HADITH_AR = 'وَصَلَّى بِيَ الْعَصْرَ حِينَ كَانَ ظِلُّهُ مِثْلَهُ … فَلَمَّا كَانَ الْغَدُ … وَصَلَّى بِيَ الْعَصْرَ حِينَ كَانَ ظِلُّهُ مِثْلَيْهِ'

// Mənanın qısa ifadəsi (5 dil). Günorta kölgəsi barədə izah — UI-dadır (AsrShadow T.noonNote).
export const ASR_HADITH = {
  az: 'Cəbrail (ə) Peyğəmbərə (ﷺ) iki gün namaz qıldırdı: birinci gün əsri hər şeyin kölgəsi özü qədər olanda, ikinci gün iki misli olanda.',
  en: 'Jibril (peace be upon him) led the Prophet (ﷺ) in prayer on two days: on the first day he prayed Asr when the shadow of everything was equal to it, on the second day when it was twice as long.',
  ru: 'Джибриль (мир ему) два дня руководил молитвой Пророка (ﷺ): в первый день аср — когда тень каждой вещи стала равна ей, во второй — когда вдвое длиннее.',
  tr: 'Cebrail (a.s.) Peygamber’e (ﷺ) iki gün namaz kıldırdı: ilk gün ikindiyi her şeyin gölgesi kendisi kadar olunca, ikinci gün iki katı olunca.',
  ar: 'أمَّ جبريلُ عليه السلام النبيَّ ﷺ يومين: صلى العصر في اليوم الأول حين كان ظل كل شيء مثله، وفي الثاني حين كان مثليه.',
}
