// <title>-a brend şəkilçisi — yalnız sığanda (meta.js, detail.js; tests/unit/seo-detail.test.js)
// Google axtarışda ~60 simvoldan sonrasını "…" ilə kəsir və sayt adını onsuz da ayrıca göstərir;
// uzun başlıqda " | Muslims.cc" mənalı hissəni sıxışdırırdı (2026-11-06 auditi: 563 səhifə > 65 simvol).
export const TITLE_MAX = 60
export function withBrand(t, brand) {
  const full = `${t} | ${brand}`
  return full.length <= TITLE_MAX ? full : t
}
