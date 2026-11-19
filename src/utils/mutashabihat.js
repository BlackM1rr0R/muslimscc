// Oxşar (əkiz) ayələr məlumatı — public/data/mutashabihat.json (scripts/build-mutashabihat.mjs).
// Bir dəfə yüklənir və modul yaddaşında qalır: TwinAyahs (/hifz) və Quran oxuyucusunun ayə menyusu
// ("Oxşar ayələr (n)") eyni sorğunu paylaşır. Xəta olsa — növbəti çağırışda yenidən cəhd.
let cache = null
export const loadMutashabihat = () => (cache ||= fetch('/data/mutashabihat.json')
  .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
  .catch(e => { cache = null; throw e }))

/** Ayənin əkizlərinin sayı ("2:48" → 3); yoxdursa 0 */
export const twinCount = (data, key) => (data?.pairs?.[key]?.length || 0)
