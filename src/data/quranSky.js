// ═══════════════════════════════════════════════════════
// Quranın səması (v6.2) — HilalAR mode="sky" (/calendar, telefonda)
//
// QAYDA: yalnız Quranın ADINI AÇIQ ÇƏKDİYİ göy cisimləri — Günəş (الشمس), Ay (القمر)
// və əş-Şira (الشعرى, 53:49; ərəb dilində Sirius ulduzunun adıdır). Ayə mətni
// seo-data/quran/quran-uthmani.json-dakı ilə hərfi-hərfinə eynidir (tests/unit/quran-sky.test.js).
// Tərcümə göstərilmir — ayə səhifəsinə keçid var (dini mətn maşınla tərcümə olunmur).
// ═══════════════════════════════════════════════════════

// Sirius: J2000 ekvatorial koordinatları (Hipparcos), presessiya illik ~+0.011° RA, −0.0013° Dec
export const SIRIUS_J2000 = { ra: 101.2872, dec: -16.7161 }
export function siriusNow(date = new Date()) {
  const y = date.getUTCFullYear() + date.getUTCMonth() / 12 - 2000
  return { ra: SIRIUS_J2000.ra + 0.011 * y, dec: SIRIUS_J2000.dec - 0.0013 * y }
}

export const SKY_BODIES = [
  {
    id: 'moon', ar: 'القمر',
    name: { az: 'Ay', en: 'Moon', ru: 'Луна', ar: 'القمر', tr: 'Ay' },
    ayahs: [
      ['36:39', 'وَٱلْقَمَرَ قَدَّرْنَٰهُ مَنَازِلَ حَتَّىٰ عَادَ كَٱلْعُرْجُونِ ٱلْقَدِيمِ'],
      ['21:33', 'وَهُوَ ٱلَّذِى خَلَقَ ٱلَّيْلَ وَٱلنَّهَارَ وَٱلشَّمْسَ وَٱلْقَمَرَ ۖ كُلٌّۭ فِى فَلَكٍۢ يَسْبَحُونَ'],
    ],
  },
  {
    id: 'sun', ar: 'الشمس',
    name: { az: 'Günəş', en: 'Sun', ru: 'Солнце', ar: 'الشمس', tr: 'Güneş' },
    ayahs: [
      ['36:38', 'وَٱلشَّمْسُ تَجْرِى لِمُسْتَقَرٍّۢ لَّهَا ۚ ذَٰلِكَ تَقْدِيرُ ٱلْعَزِيزِ ٱلْعَلِيمِ'],
      ['71:16', 'وَجَعَلَ ٱلْقَمَرَ فِيهِنَّ نُورًۭا وَجَعَلَ ٱلشَّمْسَ سِرَاجًۭا'],
    ],
  },
  {
    id: 'sirius', ar: 'الشعرى',
    name: { az: 'əş-Şira (Sirius)', en: 'ash-Shi‘ra (Sirius)', ru: 'аш-Шира (Сириус)', ar: 'الشِّعرى', tr: 'eş-Şi‘râ (Sirius)' },
    ayahs: [
      ['53:49', 'وَأَنَّهُۥ هُوَ رَبُّ ٱلشِّعْرَىٰ'],
    ],
  },
]
