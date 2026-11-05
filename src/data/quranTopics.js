// ═══════════════════════════════════════════════════════
// Quranda mövzu axtarışı — mövzu → kök (/quran-roots, Quranic Arabic Corpus kökləri)
// Yalnız mənası birmənalı köklər seçilib (məs. "Cənnət" üçün جنن YOX — o kök "cin"i də əhatə edir).
// Mövzunun adı istənilən dildə axtarış sahəsinə yazılanda da bu kökə keçir (topicRoot).
// Yoxlama: tests/unit/quran-topics.test.js (bütün köklər indeksdə var)
// ═══════════════════════════════════════════════════════
export const QURAN_TOPICS = [
  { root: 'صبر', icon: 'shield', l: { az: 'Səbr', en: 'Patience', ru: 'Терпение', tr: 'Sabır', ar: 'الصبر' } },
  { root: 'شكر', icon: 'sparkle', l: { az: 'Şükr', en: 'Gratitude', ru: 'Благодарность', tr: 'Şükür', ar: 'الشكر' } },
  { root: 'رحم', icon: 'leaf', l: { az: 'Rəhmət', en: 'Mercy', ru: 'Милость', tr: 'Rahmet', ar: 'الرحمة' } },
  { root: 'غفر', icon: 'drop', l: { az: 'Bağışlanma', en: 'Forgiveness', ru: 'Прощение', tr: 'Bağışlanma', ar: 'المغفرة' } },
  { root: 'توب', icon: 'refresh', l: { az: 'Tövbə', en: 'Repentance', ru: 'Покаяние', tr: 'Tövbe', ar: 'التوبة' } },
  { root: 'وقي', icon: 'shield', l: { az: 'Təqva', en: 'God-consciousness', ru: 'Богобоязненность', tr: 'Takva', ar: 'التقوى' } },
  { root: 'صلو', icon: 'prayer', l: { az: 'Namaz', en: 'Prayer', ru: 'Молитва', tr: 'Namaz', ar: 'الصلاة' } },
  { root: 'زكو', icon: 'zakat', l: { az: 'Zəkat və paklıq', en: 'Zakat and purity', ru: 'Закят и чистота', tr: 'Zekât ve arınma', ar: 'الزكاة والتزكية' } },
  { root: 'صوم', icon: 'ramadan', l: { az: 'Oruc', en: 'Fasting', ru: 'Пост', tr: 'Oruç', ar: 'الصيام' } },
  { root: 'دعو', icon: 'duas', l: { az: 'Dua və dəvət', en: 'Supplication and call', ru: 'Мольба и призыв', tr: 'Dua ve davet', ar: 'الدعاء والدعوة' } },
  { root: 'ذكر', icon: 'dhikr', l: { az: 'Zikr', en: 'Remembrance', ru: 'Поминание', tr: 'Zikir', ar: 'الذكر' } },
  { root: 'وكل', icon: 'target', l: { az: 'Təvəkkül', en: 'Trust in Allah', ru: 'Упование', tr: 'Tevekkül', ar: 'التوكل' } },
  { root: 'علم', icon: 'learn', l: { az: 'Elm', en: 'Knowledge', ru: 'Знание', tr: 'İlim', ar: 'العلم' } },
  { root: 'عدل', icon: 'ruler', l: { az: 'Ədalət', en: 'Justice', ru: 'Справедливость', tr: 'Adalet', ar: 'العدل' } },
  { root: 'رزق', icon: 'gift', l: { az: 'Ruzi', en: 'Provision', ru: 'Удел', tr: 'Rızık', ar: 'الرزق' } },
  { root: 'ولد', icon: 'user', l: { az: 'Valideyn və övlad', en: 'Parents and children', ru: 'Родители и дети', tr: 'Anne-baba ve evlat', ar: 'الوالدان والولد' } },
  { root: 'يتم', icon: 'charity', l: { az: 'Yetim', en: 'Orphans', ru: 'Сироты', tr: 'Yetim', ar: 'اليتيم' } },
  { root: 'نور', icon: 'sun', l: { az: 'Nur', en: 'Light', ru: 'Свет', tr: 'Nur', ar: 'النور' } },
]

const fold = (s) => String(s || '').toLocaleLowerCase('tr').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/^ال/, '').trim()

/** Yazılmış mətn mövzu adıdırsa (istənilən dildə) → kök, yoxsa null */
export function topicRoot(text) {
  const q = fold(text)
  if (!q) return null
  for (const t of QURAN_TOPICS) {
    for (const v of Object.values(t.l)) {
      const f = fold(v)
      if (f === q || f.split(/\s+(?:və|and|и|ve|و)\s+/).some(w => w === q)) return t.root
    }
  }
  return null
}
