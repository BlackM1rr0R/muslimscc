// ═══════════════════════════════════════════════════════
// Təkrarlanan hədislərin çıxarılması
//
// src/data/hadiths.js-də 2000 qeyd var, amma eyni hədis bir neçə id ilə
// təkrarlanır (məs. "Buxari 645": id 35, 1119, 1764). Data faylı DƏYİŞMİR —
// göstərərkən siyahı təkrarsız edilir.
//
// İKİ QEYD EYNİ HƏDİS SAYILIR, əgər:
//   1) ərəb mətnləri normallaşdırılmış formada eynidirsə — hərəkələr, tətvil,
//      Quran işarələri, durğu və boşluqlar atılır; أ إ آ ٱ → ا, ى ئ → ي,
//      ؤ → و, ة → ه; əvvəldəki təkid ədatı (إِنَّ / إِنَّمَا) və "و" bağlayıcısı
//      atılır: "إِنَّ الصَّبْرَ" = "إِنَّمَا الصَّبْرُ عِنْدَ الصَّدْمَةِ الأُولَى",
//      "وَمَنْ يَتَصَبَّرْ" = "مَنْ يَتَصَبَّرْ" — eyni sözlər, eyni kəsik;
//   2) və ya Azərbaycanca tərcümələri hərfbəhərf eynidirsə (ərəbcədə yalnız
//      yazılış fərqi olanlar: "اقرؤوه" / "اقرءوه", "من غشنا فليس منا" /
//      "ليس منا من غشنا" — oxucu eyni kartı iki dəfə görməsin);
//   3) ərəb mətni YOXDURSA — Azərbaycanca mətn + mənbə eynidirsə.
//
// Qeyri-dəqiq ("85% oxşar") müqayisə QƏSDƏN yoxdur: "فليكرم جاره" /
// "فليكرم ضيفه" (qonşuna / qonağına ikram et) kimi bir sözlə fərqlənən
// cümlələr ayrı-ayrı təlimdir — birləşdirilsə, biri saytdan itərdi.
//
// İlk rast gələn qalır, sıra dəyişmir. Qərar Azərbaycanca siyahı (orijinal
// dil) üzrə BİR DƏFƏ verilir və bütün dillərə tətbiq olunur — hədis #N hər
// dildə eyni hədisdir, sevimlilər (id) dil dəyişəndə itmir.
//
// Bu fayl React-dan asılı deyil: HadithPage, axtarış (utils/search.js) və
// Instagram hovuzu (scripts/social/content.mjs, Node) eyni qaydanı işlədir.
// ═══════════════════════════════════════════════════════

// Hərəkələr (U+064B–U+065F), üst əlif (U+0670), tətvil (U+0640), Quran işarələri
const AR_MARKS = /[\u064B-\u065F\u0670\u0640\u06D6-\u06ED\u08D3-\u08FF]/g

// Mətnin əvvəlində atılan təkid ədatları (normallaşdırılmış yazılışla):
// إِنَّ → ان, إِنَّمَا → انما. (ألا / إلا normallaşdırmadan sonra eyni "الا"
// olur — "istisna" mənası da ola bilər, ona görə atılmır.)
const LEAD_PARTICLES = new Set(['ان', 'انما'])

/** Ərəb mətninin müqayisə forması ('' — ərəbcə yoxdur). */
export function normArabic(str) {
  const words = String(str || '')
    .normalize('NFC')
    .replace(AR_MARKS, '')
    .replace(/[أإآٱٲٳ]/g, 'ا')
    .replace(/[ىیئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/ک/g, 'ك')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  while (words.length > 2 && LEAD_PARTICLES.has(words[0])) words.shift()
  const s = words.join('')
  // Başdakı "و" (və) bağlayıcısı — hədisin ortasından kəsilmiş surətlərdə olur
  return s.length > 4 && s[0] === 'و' ? s.slice(1) : s
}

/** Latın/kiril mətnin müqayisə forması: kiçik hərf, diakritiksiz, durğusuz. */
export function normText(str) {
  return String(str || '')
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

// Bundan qısa tərcümə tək başına açar sayılmır ("Səbr." kimi ümumi ifadələr)
const MIN_TEXT_KEY = 10

/**
 * Bir qeydin müqayisə açarları. İstənilən açar əvvəl görülübsə — təkrardır.
 * @param {string} ar      ərəb mətni
 * @param {string} azText  Azərbaycanca tərcümə
 * @param {string} source  mənbə (yalnız ərəbcə olmayanda istifadə olunur)
 */
export function hadithKeys(ar, azText, source) {
  const a = normArabic(ar)
  const t = normText(azText)
  const keys = []
  if (a) keys.push('ar:' + a)
  if (t.length >= MIN_TEXT_KEY) keys.push('az:' + t)
  else if (!a && t) keys.push('tx:' + t + '|' + normText(source))
  return keys
}

/**
 * Ümumi təkrarsızlaşdırma: ilk rast gələn qalır, sıra dəyişmir.
 *
 * Açarı ortaq olan qeydlər bir qrupdur və bu əlaqə keçiricidir: A ilə B-nin
 * ərəbcəsi, B ilə C-nin tərcüməsi eynidirsə — A, B, C bir hədisdir (məs.
 * "Buxari 645": id 35 ↔ 1764 ərəbcə, 1764 ↔ 1119 tərcümə). Qrupdan siyahıda
 * ən əvvəl gələn qalır.
 *
 * @param {Array} list
 * @param {(item) => string[]} keysOf  elementin açarları
 * @param {object} [opts]
 * @param {(item) => any} [opts.idOf]  id (standart: item.id)
 * @param {(kept, dup) => void} [opts.onDuplicate]  hər atılan üçün (məs. boş sahələri doldurmaq)
 * @returns {{ items: Array, aliases: Map }}  aliases: atılan id → saxlanılan id
 */
export function dedupeList(list, keysOf, { idOf = (x) => x.id, onDuplicate } = {}) {
  const arr = list || []
  // Birləşmə-axtarış (union-find): kök həmişə qrupun ən kiçik indeksidir
  const parent = arr.map((_, i) => i)
  const find = (i) => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] }
    return i
  }
  const owner = new Map() // açar → onu ilk dəfə daşıyan indeks
  arr.forEach((item, i) => {
    for (const k of keysOf(item)) {
      if (!k) continue
      const j = owner.get(k)
      if (j === undefined) { owner.set(k, i); continue }
      const a = find(i)
      const b = find(j)
      if (a !== b) { if (a < b) parent[b] = a; else parent[a] = b }
    }
  })

  const items = []
  const aliases = new Map()
  arr.forEach((item, i) => {
    const root = find(i)
    if (root === i) { items.push(item); return }
    const kept = arr[root]
    aliases.set(idOf(item), idOf(kept))
    if (onDuplicate) onDuplicate(kept, item)
  })
  return { items, aliases }
}

// HADITHS obyekti → { keep:Set<id>, aliases:Map, keysById:Map } (bir dəfə hesablanır)
const infoCache = new WeakMap()

function hadithInfo(HADITHS) {
  let info = infoCache.get(HADITHS)
  if (info) return info
  const az = (HADITHS && (HADITHS.az || HADITHS.en)) || []
  // Digər dillərin tərcümələri də açar olur: bəzi cütlərin ərəbcəsi bir hərflə
  // fərqlənir (فلا يؤذ / فلا يؤذي) və az mətni də fərqlidir, amma en/ru/tr
  // tərcüməsi eynidir — /en/hadith-də iki eyni kart görünürdü (məs. id 349 və
  // 579, "Buxari 6018"). Açar dil prefiksi ilə yazılır ki, dillər arası səhv
  // uyğunluq olmasın; qısa ümumi ifadələr açar sayılmır.
  const TR_LANGS = ['en', 'ru', 'tr']
  const textById = Object.fromEntries(TR_LANGS.map(l => [
    l, new Map(((HADITHS && HADITHS[l]) || []).map(h => [h.id, h.text])),
  ]))
  // Hər qeyd bir dəfə normallaşdırılır
  const rows = az.map(h => {
    const keys = hadithKeys(h.ar, h.text, h.source)
    for (const l of TR_LANGS) {
      const t = normText(textById[l].get(h.id))
      if (t.length >= 25) keys.push(`${l}:${t}`)
    }
    return { id: h.id, keys }
  })
  const { items, aliases } = dedupeList(rows, r => r.keys)
  // Saxlanılan hədisin açarlarına qrupdakı bütün surətlərin açarları da
  // əlavə olunur — Firebase-dəki surət hansı id-dən köçürülübsə, tanınsın
  const keysById = new Map()
  for (const r of rows) {
    const root = aliases.has(r.id) ? aliases.get(r.id) : r.id
    if (!keysById.has(root)) keysById.set(root, [])
    keysById.get(root).push(...r.keys)
  }
  info = { keep: new Set(items.map(r => r.id)), aliases, keysById }
  infoCache.set(HADITHS, info)
  return info
}

/**
 * hadiths.js-dəki HADITHS obyektindən bir dilin təkrarsız siyahısı.
 * Bütün dillərdə eyni id-lər qalır (qərar Azərbaycanca siyahı üzrədir).
 */
export function uniqueHadithsFor(HADITHS, lang) {
  const list = (HADITHS && (HADITHS[lang] || HADITHS.en)) || []
  const { keep } = hadithInfo(HADITHS)
  return list.filter(h => keep.has(h.id))
}

/** Atılan id → saxlanılan id (köhnə sevimliləri yeni id-yə köçürmək üçün). */
export function hadithAliases(HADITHS) {
  return hadithInfo(HADITHS).aliases
}

/**
 * Saxlanılan yerli hədisin müqayisə açarları (Azərbaycanca mətn üzrə,
 * əvvəlcədən hesablanmış; atılan surətlərinki də daxil) — başqa siyahı ilə
 * (məs. Firebase) birləşdirmək üçün.
 */
export function staticHadithKeys(HADITHS, id) {
  return hadithInfo(HADITHS).keysById.get(id) || []
}

// ═══════════════════════════════════════════════════════
// PERFORMANS: dillərə bölünmüş hədis modulları (build zamanı)
//
// NƏ: vite.config.js → "virtual:hadiths/<dil>" modulu buildHadithLangData()
// ilə qurulur: yalnız həmin dilin TƏKRARSIZ siyahısı (id, cat, source, ar,
// text) və atılan id → saxlanılan id cədvəli. Firebase birləşməsi üçün
// müqayisə açarlarının qısa həşləri dildən asılı deyil — ayrıca
// "virtual:hadiths/keys" modulundadır (buildHadithMergeKeys, ~31 KB gzip) və
// yalnız /hadith-də, ilk boyamadan sonra yüklənir. Veb (HadithPage,
// GlobalSearch) modulları src/utils/hadithData.js ilə dinamik yükləyir.
// NİYƏ: əvvəl /hadith bütöv hadiths.js-i (5 dilin hamısı, ~1.2 MB xam /
// ~400 KB gzip) yükləyirdi və təkrarsızlaşdırmanı (bütün dillərin mətnini
// normallaşdırmaqla) brauzerdə hesablayırdı. İndi bir dil 67–135 KB gzip-dir (ölçülüb) və
// hesablama build zamanı bir dəfə aparılır. Ölçülmüş fayda: cavabda/PR-da.
//
// Nəticə köhnə runtime funksiyaları ilə EYNİDİR (tests/unit/hadith-lang-data
// .test.js 5 dil üçün müqayisə edir). Orijinal src/data/hadiths.js QALIR —
// Instagram skripti, mobil tətbiq və admin "toxum" paneli onu oxuyur.
// ═══════════════════════════════════════════════════════

/**
 * Açar sətrinin qısa həşi (cyrb53, 53 bit → base36, ~11 simvol).
 * NİYƏ: staticHadithKeys tam normallaşdırılmış mətni qaytarır — hər dil
 * moduluna onları yazmaq Azərbaycanca + ərəbcə mətni ikinci dəfə daşımaq
 * olardı. Müqayisə yalnız bərabərlikdir, ona görə həş kifayətdir
 * (~5000 açarda toqquşma ehtimalı ~1e-9).
 */
export function hashKey(str) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

// Firebase (admin) hədisinin açarları yalnız bu prefikslərlə olur
// (hadithKeys: ar / az / tx). Yerli qeydlərin en/ru/tr açarları heç bir admin
// açarı ilə üst-üstə düşə bilməz, saxlanılan yerli hədislər isə öz aralarında
// artıq ortaq açarsızdır (union-find qrupları) — ona görə o açarlar birləşmə
// nəticəsini dəyişmir və modula yazılmır.
const MERGE_PREFIX = /^(ar|az|tx):/

/** Admin (Firebase) hədisinin həşlənmiş açarları — dil modulundakı açarlarla müqayisə üçün. */
export function customHadithKeyHashes(ar, azText, source) {
  return hadithKeys(ar, azText, source).map(hashKey)
}

/**
 * Bir dilin build-zamanı məlumatı (JSON-a yazıla bilən):
 *   list    — uniqueHadithsFor(HADITHS, lang) ilə eyni sıra və sahələr;
 *             ərəbcədə text === ar olanda text yazılmır (yükləyici bərpa edir)
 *   aliases — [[atılan id, saxlanılan id], ...] (hadithAliases ilə eyni)
 */
export function buildHadithLangData(HADITHS, lang) {
  const info = hadithInfo(HADITHS)
  const list = uniqueHadithsFor(HADITHS, lang).map(h => {
    const row = { id: h.id, cat: h.cat, source: h.source, ar: h.ar, text: h.text }
    if (row.text === row.ar && row.ar) delete row.text
    return row
  })
  return { list, aliases: [...info.aliases] }
}

/**
 * Firebase birləşməsi üçün açarlar (bütün dillər üçün eyni):
 * { id: [həş, ...] } — staticHadithKeys(HADITHS, id)-nin ar/az/tx açarları, həşlənmiş.
 */
export function buildHadithMergeKeys(HADITHS) {
  const info = hadithInfo(HADITHS)
  const keys = {}
  for (const id of info.keep) {
    const ks = [...new Set((info.keysById.get(id) || []).filter(k => MERGE_PREFIX.test(k)).map(hashKey))]
    if (ks.length) keys[id] = ks
  }
  return keys
}

/** buildHadithLangData() nəticəsini runtime formasına çevir (yükləyici və testlər üçün). */
export function reviveHadithLangData(raw) {
  return {
    list: raw.list.map(h => ('text' in h ? h : { ...h, text: h.ar })),
    aliases: new Map(raw.aliases),
  }
}

/** buildHadithMergeKeys() nəticəsi → keysOf(id) funksiyası. */
export function reviveHadithMergeKeys(raw) {
  const keyMap = new Map(Object.entries(raw).map(([id, ks]) => [Number(id), ks]))
  return (id) => keyMap.get(id) || []
}
