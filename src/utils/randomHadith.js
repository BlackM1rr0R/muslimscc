// ═══════════════════════════════════════════════════════
// "Təsadüfi hədis" (/hadith) — saf köməkçilər (test olunur)
//
// Hovuz — səhifənin ÖZ siyahısı (yoxlanıla bilməyən rəvayətlər build zamanı
// artıq çıxarılıb — data/hadiths.js → isVerifiableSource), istifadəçinin
// süzgəcləri (mövzu, axtarış, dərəcə, sevimlilər) ilə. Qaydalar:
//   • Quran ayələri (dərəcə 'q') hədis deyil — düşmür;
//   • zəif / ixtilaflı rəvayətlər yalnız istifadəçi özü "Zəif" süzgəcini
//     seçibsə düşür;
//   • yalnız /hadith/<id> səhifəsi olanlar (rəqəmli sayt id-si);
//   • süzgəclə heç nə qalmırsa — bütün siyahıdan (eyni qaydalarla);
//   • eyni hədis ardıcıl iki dəfə düşmür.
// ═══════════════════════════════════════════════════════

/**
 * @param {Array} filtered — görünən (süzülmüş) siyahı
 * @param {Array} all — səhifənin bütöv siyahısı
 * @param {{ allowWeak?: boolean, idOf: (h) => (number|string|null), groupOf: (g) => string }} opts
 * @returns {Array<string>} — sayt id-ləri
 */
export function randomHadithPool(filtered, all, { allowWeak = false, idOf, groupOf }) {
  const ids = (arr) => {
    const out = []
    for (const h of arr || []) {
      const g = groupOf(h.g)
      if (g === 'quran' || (!allowWeak && g === 'weak')) continue
      const id = idOf(h)
      if (id != null) out.push(String(id))
    }
    return out
  }
  const own = ids(filtered)
  return own.length ? own : ids(all)
}

/** Hovuzdan təsadüfi id — `avoid`-dan fərqli (hovuzda başqası varsa). Boşdursa null. */
export function pickRandomId(pool, avoid, rand = Math.random) {
  if (!pool?.length) return null
  const a = avoid == null ? null : String(avoid)
  const rest = a != null && pool.length > 1 ? pool.filter(id => id !== a) : pool
  const list = rest.length ? rest : pool
  return list[Math.min(list.length - 1, Math.floor(rand() * list.length))]
}
