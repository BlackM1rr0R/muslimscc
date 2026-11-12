// Adı mənası ilə cütlə (components/NamesMatch.jsx) — saf köməkçi (tests/unit/v63-data.test.js)
/** Kartda göstəriləcək məna: "Əhəd (Yeganə)" → "Yeganə"; mötərizə yoxdursa — olduğu kimi */
export function shortMeaning(text) {
  const s = String(text || '').trim()
  const m = /^[^(]+\(([^)]+)\)\s*$/.exec(s)
  return (m ? m[1] : s).split(' — ')[0].trim()
}
