// ═══════════════════════════════════════════════════════
// Quranda ADI KEÇƏN yerlər və orada xatırlanan peyğəmbərlər (v5.9, components/ProphetPlacesMap)
//
// QAYDA: yalnız Quranın özünün adını çəkdiyi yer; hər birinin yanında həmin adın keçdiyi ayə.
// Hamısı seo-data/quran/quran-uthmani.json mətnində söz-söz yoxlanılıb (tests/unit/prophet-places.test.js).
// Xəritədəki nöqtə — yerin məşhur, təxmini təyini (approx: true olanların dəqiq yeri məlum deyil).
// Peyğəmbər — data/islamicHistory.js → PROPHETS[].num. Adı Quranda keçməyən yerlər (Yunus, Lut,
// İsa və b.) xəritəyə salınmayıb.
// ═══════════════════════════════════════════════════════
export const PROPHET_PLACES = [
  { id: 'judi', at: [37.37, 42.35], approx: true, word: 'الجودي', refs: [['11:44', [3]]],
    name: { az: 'Cudi dağı', en: 'Mount Judi', ru: 'Гора Джуди', ar: 'الجودي', tr: 'Cûdi Dağı' } },
  { id: 'ahqaf', at: [17.6, 48.9], approx: true, word: 'بالاحقاف', refs: [['46:21', [4]]],
    name: { az: 'Əhqaf', en: 'Al-Ahqaf', ru: 'Аль-Ахкаф', ar: 'الأحقاف', tr: 'Ahkâf' } },
  { id: 'hijr', at: [26.79, 37.95], word: 'الحجر', refs: [['15:80', [5]]],
    name: { az: 'Hicr', en: 'Al-Hijr', ru: 'Аль-Хиджр', ar: 'الحجر', tr: 'Hicr' } },
  { id: 'makkah', at: [21.4225, 39.8262], word: 'مكه', refs: [['2:127', [6, 8]], ['14:37', [6]], ['48:24', [25]]],
    name: { az: 'Məkkə (Bəkkə)', en: 'Mecca (Bakkah)', ru: 'Мекка (Бакка)', ar: 'مكة (بكة)', tr: 'Mekke (Bekke)' } },
  { id: 'madyan', at: [28.48, 35.0], approx: true, word: 'مدين', refs: [['7:85', [13]], ['28:22', [14]]],
    name: { az: 'Mədyən', en: 'Madyan', ru: 'Мадьян', ar: 'مدين', tr: 'Medyen' } },
  { id: 'misr', at: [30.05, 31.24], approx: true, word: 'مصر', refs: [['12:21', [11]], ['10:87', [14, 15]]],
    name: { az: 'Misir', en: 'Egypt (Misr)', ru: 'Египет (Миср)', ar: 'مصر', tr: 'Mısır' } },
  { id: 'tur', at: [28.54, 33.97], approx: true, word: 'الطور', refs: [['19:52', [14]]],
    name: { az: 'Tur dağı', en: 'Mount Tur', ru: 'Гора Тур', ar: 'الطور', tr: 'Tûr Dağı' } },
  { id: 'saba', at: [15.43, 45.33], approx: true, word: 'سبا', refs: [['27:22', [18]]],
    name: { az: 'Səba', en: 'Sheba (Saba’)', ru: 'Саба', ar: 'سبأ', tr: 'Sebe' } },
  { id: 'madinah', at: [24.4672, 39.6112], word: 'المدينه', refs: [['33:13', [25]], ['9:101', [25]]],
    name: { az: 'Mədinə (Yəsrib)', en: 'Medina (Yathrib)', ru: 'Медина (Ясриб)', ar: 'المدينة (يثرب)', tr: 'Medine (Yesrib)' } },
  { id: 'aqsa', at: [31.776, 35.236], word: 'المسجد الاقصا', refs: [['17:1', [25]]],
    name: { az: 'Məscidül-Əqsa', en: 'Al-Masjid al-Aqsa', ru: 'Аль-Масджид аль-Акса', ar: 'المسجد الأقصى', tr: 'Mescid-i Aksâ' } },
]
// Ayədə adın özü (yoxlama üçün): Məkkə üçün 48:24 "مكه", 2:127 — "البيت", 14:37 — "بيتك المحرم"; Mədinə 33:13 — "يثرب"
export const PLACE_WORDS = { '2:127': 'البيت', '14:37': 'بيتك المحرم', '33:13': 'يثرب' }
