// ═══════════════════════════════════════════════════════
// Quranda su dövranı (v8) — components/QuranWater.jsx
//
// QAYDA: hər mərhələnin yanında yalnız həmin mərhələni AÇIQ çəkən 1–2 ayə (və ya ardıcıl ayə qrupu).
//   • refs[].ref — '30:48' və ya ardıcıl qrup '55:19-20';
//   • refs[].keys — açar söz qrupları (hərəkəsiz, plainAr). Ayədə (qrupda — birləşmiş mətndə) HƏR qrupdan
//     ən azı bir forma AYRICA SÖZ kimi keçməlidir (و/ف, ب/ك/ل, ال önşəkilçiləri və ها/ا sonluğu atılır —
//     quranPlants/quranColors ilə eyni üsul). scripts/build-quran-water.mjs və test bunu yoxlayır —
//     tapılmasa build dayanır (səhv ayə yayımlanmasın).
// «Buxarlanma» haqqında açıq ayə yoxdur — həmin mərhələdə küləklərin buludu QALDIRDIĞI (فَتُثِيرُ سَحَابًا)
//   ayələr göstərilir; elmi iddia, təfsir yazılmır — ayə yalnız mərhələnin yanında durur.
// Ayə mətni və tərcüməsi burada yazılmır — build skripti seo-data/quran-dan hərfi-hərfinə götürür →
// public/data/quran-water/<dil>.json.
// ═══════════════════════════════════════════════════════
import { plainAr } from './quranPlants.js'

export { plainAr }

/** Dövran sırası: dəniz → qalxan buludlar → küləklər → topa buludlar → yağış → bulaqlar → (yenə dəniz) */
export const QURAN_WATER = [
  { id: 'sea', ar: 'مَرَجَ ٱلْبَحْرَيْنِ · بَرْزَخ', icon: 'waves',
    refs: [{ ref: '25:53', keys: [['بحرين'], ['برزخ']] }, { ref: '55:19-20', keys: [['بحرين'], ['برزخ']] }],
    name: { az: 'Dəniz', en: 'The sea', ru: 'Море', ar: 'البحر', tr: 'Deniz' } },
  { id: 'evaporation', ar: 'فَتُثِيرُ سَحَابًا', icon: 'sun',
    refs: [{ ref: '30:48', keys: [['تثير'], ['سحاب']] }, { ref: '35:9', keys: [['تثير'], ['سحاب']] }],
    name: { az: 'Qaldırılan buludlar', en: 'Clouds raised up', ru: 'Поднятые облака', ar: 'إثارة السحاب', tr: 'Kaldırılan bulutlar' } },
  { id: 'wind', ar: 'ٱلرِّيَاح', icon: 'wind',
    refs: [{ ref: '7:57', keys: [['ريح'], ['سحاب']] }, { ref: '15:22', keys: [['ريح']] }],
    name: { az: 'Küləklər', en: 'The winds', ru: 'Ветры', ar: 'الرياح', tr: 'Rüzgârlar' } },
  { id: 'clouds', ar: 'رُكَامًا · بَرَد', icon: 'cloudRain',
    refs: [{ ref: '24:43', keys: [['سحاب'], ['ركام'], ['برد']] }],
    name: { az: 'Topa buludlar və dolu', en: 'Heaped clouds and hail', ru: 'Нагромождённые облака и град', ar: 'السحاب الركام والبرد', tr: 'Üst üste bulutlar ve dolu' } },
  { id: 'rain', ar: 'مَاءً بِقَدَرٍ', icon: 'drop',
    refs: [{ ref: '23:18', keys: [['ماء'], ['قدر']] }, { ref: '43:11', keys: [['ماء'], ['قدر']] }],
    name: { az: 'Ölçü ilə yağış', en: 'Rain in due measure', ru: 'Дождь в меру', ar: 'الماء بقدر', tr: 'Ölçüyle yağmur' } },
  { id: 'rivers', ar: 'يَنَابِيع · كُلَّ شَيْءٍ حَيٍّ', icon: 'leaf',
    refs: [{ ref: '39:21', keys: [['ينبيع']] }, { ref: '21:30', keys: [['ماء'], ['حى']] }],
    name: { az: 'Bulaqlar və həyat', en: 'Springs and life', ru: 'Источники и жизнь', ar: 'الينابيع والحياة', tr: 'Pınarlar ve hayat' } },
]

export const STAGES = QURAN_WATER.map(s => s.id)

/** '55:19-20' → ['55:19', '55:20']; '30:48' → ['30:48'] */
export function expandRef(ref) {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(String(ref))
  if (!m) return []
  const s = +m[1], a = +m[2], b = m[3] ? +m[3] : a
  if (b < a) return []
  return Array.from({ length: b - a + 1 }, (_, i) => `${s}:${a + i}`)
}

/** Bütün ayrıca ayələr (build və test üçün) */
export const allAyahRefs = () => [...new Set(QURAN_WATER.flatMap(s => s.refs.flatMap(r => expandRef(r.ref))))]

/** Sözün önşəkilçilərini (و/ف, ب/ك/ل, ال) və ها/ا sonluğunu at → lüğət forması namizədləri (quranPlants.js ilə eyni) */
const stems = (w) => {
  const out = new Set([w])
  for (const a of [w, w.replace(/^[وف]/, '')]) {
    for (const b of [a, a.replace(/^[بكل]/, '')]) {
      for (const c of [b, b.replace(/^ال/, '')]) { out.add(c); out.add(c.replace(/(ها|ا)$/, '')) }
    }
  }
  return out
}
const wordHas = (w, forms) => { const s = stems(plainAr(w)); return forms.some(f => s.has(f)) }

/** Mətndə hər açar qrupundan ən azı bir forma ayrıca söz kimi keçirmi? */
export function keysInText(keys, text) {
  const words = plainAr(String(text || '')).split(/\s+/).filter(Boolean)
  return keys.length > 0 && keys.every(forms => words.some(w => wordHas(w, forms)))
}

/** Tapılmayan açar qrupları (build xətası üçün) */
export const missingKeys = (keys, text) => keys.filter(forms => !keysInText([forms], text))

/** Ayə mətnində açar sözlərin indeksləri (boşluqla bölünmüş orijinal mətndə) — vurğulamaq üçün; mətn dəyişmir */
export function keyWordIdx(keys, text) {
  const forms = keys.flat()
  return String(text || '').split(' ').map((w, i) => (wordHas(w, forms) ? i : -1)).filter(i => i >= 0)
}

/** Dövranda növbəti mərhələ (rivers → sea) */
export const nextStage = (id) => STAGES[(STAGES.indexOf(id) + 1) % STAGES.length]
