// ═══════════════════════════════════════════════════════
// Elm zənciri (v5.9) — alim kartlarındakı müəllim/tələbə siyahılarından "kim kimdən öyrənib" qrafı
// (components/ScholarChain, tests/unit/scholar-chain.test.js)
//
//   buildChain(SCHOLARS) → { nodes: [{ slug, died, era }], edges: [{ from, to }] }   from = müəllim
//
// • Yalnız kartların ÖZ məlumatı (data/scholars/*.js — mənbələri orada). Yeni əlaqə uydurulmur.
// • Uyğunlaşdırma DƏQİQDİR: siyahıdakı ad (ərəbcə, hərəkəsiz) alimin öz adına, tam adına və ya
//   aşağıdakı əl ilə yoxlanmış yazılışlardan birinə tam bərabər olmalıdır. Oxşar adlar ("أبو بكر
//   الشافعي", "محمد بن عبد الوهاب الوصابي", "محمد بن إبراهيم آل الشيخ") başqa şəxslərdir — qoşulmur.
// • Xronologiya yoxlaması: müəllim tələbə doğulmazdan əvvəl vəfat edibsə — əlaqə atılır.
// ═══════════════════════════════════════════════════════
const norm = (s) => String(s || '')
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()

// Kartlarda işlənən başqa yazılışlar (hər biri əl ilə yoxlanıb — eyni şəxsdir)
export const ALIASES = {
  'ash-shafii': ['محمد بن إدريس الشافعي'],
  'al-bukhari': ['محمد بن إسماعيل البخاري', 'البخاري'],
  'at-tirmidhi': ['أبو عيسى الترمذي'],
  'abu-dawud': ['أبو داود السجستاني'],
  'muslim-ibn-al-hajjaj': ['مسلم بن الحجاج', 'مسلم'],
  'ahmad-ibn-hanbal': ['أحمد بن حنبل'],
  'malik-ibn-anas': ['مالك بن أنس'],
  'ibn-khuzaymah': ['ابن خزيمة'],
  'ibn-al-qayyim': ['ابن قيم الجوزية'],
  'ibn-taymiyyah': ['ابن تيمية'],
  'adh-dhahabi': ['الذهبي'],
  'ibn-kathir': ['ابن كثير'],
  'ibn-rajab': ['ابن رجب الحنبلي'],
  'ibn-uthaymin': ['محمد بن صالح العثيمين'],
  'bakr-abu-zayd': ['بكر بن عبد الله أبو زيد'],
  'ibn-baz': ['عبد العزيز بن باز'],
  'abd-ar-rahman-as-sadi': ['عبد الرحمن بن ناصر السعدي'],
  'muhammad-al-amin-ash-shanqiti': ['محمد الأمين الشنقيطي'],
  'muqbil-al-wadii': ['مقبل بن هادي الوادعي'],
}

export function buildChain(scholars) {
  const index = new Map()
  for (const s of scholars) {
    for (const n of [s.name?.ar, s.fullName?.ar, ...(ALIASES[s.slug] || [])]) if (n) index.set(norm(n), s.slug)
  }
  const bySlug = Object.fromEntries(scholars.map(s => [s.slug, s]))
  // "البخاري ومسلم (في غير الصحيحين)" kimi birləşmiş yazılar — ayrı adlara bölünür
  const people = (p) => norm(p?.ar).split(/\s+و(?=\S)/).map(x => x.trim()).filter(Boolean)
  const edges = new Map()
  const add = (from, to) => {
    if (!from || !to || from === to) return
    const T = bySlug[from], S = bySlug[to]
    if (T?.died?.h && S?.born?.h && T.died.h < S.born.h) return
    edges.set(`${from}>${to}`, { from, to })
  }
  for (const s of scholars) {
    for (const p of s.teachers || []) for (const n of people(p)) add(index.get(n), s.slug)
    for (const p of s.students || []) for (const n of people(p)) add(s.slug, index.get(n))
  }
  const nodes = scholars.map(s => ({ slug: s.slug, era: s.era, died: s.died?.h ?? null, born: s.born?.h ?? null }))
  return { nodes, edges: [...edges.values()] }
}
