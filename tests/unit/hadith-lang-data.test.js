// Build-zamanı dillərə bölünmüş hədis modulları (vite.config.js → hadithLangPlugin,
// src/utils/uniqueHadiths.js → buildHadithLangData / buildHadithMergeKeys) köhnə
// runtime nəticəsi ilə EYNİ olmalıdır: siyahı, alias cədvəli, Firebase birləşməsi
// və axtarış. Modul JSON kimi yazıldığı üçün burada da JSON-dan keçirilir.
import { describe, it, expect } from 'vitest'
import { HADITHS } from '../../src/data/hadiths.js'
import {
  uniqueHadithsFor, hadithAliases, staticHadithKeys, hadithKeys, dedupeList,
  buildHadithLangData, buildHadithMergeKeys, reviveHadithLangData, reviveHadithMergeKeys,
  customHadithKeyHashes, hashKey,
} from '../../src/utils/uniqueHadiths.js'
import { buildSources } from '../../src/utils/search.js'

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const viaJson = (x) => JSON.parse(JSON.stringify(x))
const langData = (l) => reviveHadithLangData(viaJson(buildHadithLangData(HADITHS, l)))
const keysOf = reviveHadithMergeKeys(viaJson(buildHadithMergeKeys(HADITHS)))

describe('dil modulları = köhnə runtime nəticəsi', () => {
  for (const l of LANGS) {
    it(`${l}: təkrarsız siyahı eynidir (sıra, id, mətn, ərəbcə, mənbə, kateqoriya)`, () => {
      const old = uniqueHadithsFor(HADITHS, l)
      const neu = langData(l).list
      expect(neu.length).toBe(old.length)
      neu.forEach((h, i) => {
        const o = old[i]
        expect([h.id, h.cat, h.source, h.ar, h.text]).toEqual([o.id, o.cat, o.source, o.ar, o.text])
      })
    })

    it(`${l}: alias cədvəli eynidir`, () => {
      expect([...langData(l).aliases]).toEqual([...hadithAliases(HADITHS)])
    })
  }

  it('birləşmə açarları = staticHadithKeys-in ar/az/tx açarlarının həşi', () => {
    for (const h of uniqueHadithsFor(HADITHS, 'az')) {
      const want = [...new Set(staticHadithKeys(HADITHS, h.id).filter(k => /^(ar|az|tx):/.test(k)).map(hashKey))]
      expect(keysOf(h.id)).toEqual(want)
    }
  })

  it('həş toqquşması yoxdur (fərqli açar → fərqli həş)', () => {
    const all = new Set()
    for (const h of uniqueHadithsFor(HADITHS, 'az')) for (const k of staticHadithKeys(HADITHS, h.id)) all.add(k)
    const hashes = new Set([...all].map(hashKey))
    expect(hashes.size).toBe(all.size)
  })
})

describe('Firebase (admin) hədisləri ilə birləşmə eynidir', () => {
  // Admin "toxumu" yerli hədisləri köçürür — həm saxlanılan, həm ATILAN surət
  // id-lərindən (alias), üstəlik yerli siyahıda olmayan yeni hədis.
  const raw = (id) => HADITHS.az.find(h => h.id === id)
  const aliasIds = [...hadithAliases(HADITHS).keys()].slice(0, 40)
  const keptIds = uniqueHadithsFor(HADITHS, 'az').slice(0, 60).map(h => h.id)
  const custom = [...aliasIds, ...keptIds].map((id, i) => {
    const h = raw(id)
    // Bəziləri yalnız ərəbcə, bəziləri yalnız az mətni ilə (ərəbcəsi boş)
    return { id: 'c' + i, ar: i % 3 === 1 ? '' : h.ar, _az: i % 3 === 2 ? '' : h.text, source: h.source, text: 'admin ' + i, _custom: true }
  })
  custom.push({ id: 'new1', ar: 'نص جديد تماما لا يوجد في القائمة', _az: 'Tamamilə yeni admin hədisi, siyahıda yoxdur', source: 'Admin', text: 'yeni', _custom: true })

  const run = (staticList, keyFn) => {
    const all = [...custom, ...staticList].map(h => ({ ...h, _ids: [h.id] }))
    return dedupeList(all, keyFn, { onDuplicate: (kept, dup) => kept._ids.push(dup.id) }).items
      .map(h => [h.id, ...h._ids].join(','))
  }

  for (const l of LANGS) {
    it(`${l}: nəticə köhnə (tam açarlı) birləşmə ilə eynidir`, () => {
      const old = run(uniqueHadithsFor(HADITHS, l),
        (h) => (h._custom ? hadithKeys(h.ar, h._az, h.source) : staticHadithKeys(HADITHS, h.id)))
      const neu = run(langData(l).list,
        (h) => (h._custom ? customHadithKeyHashes(h.ar, h._az, h.source) : keysOf(h.id)))
      expect(neu).toEqual(old)
      // Test həqiqətən birləşmə yoxlayır: admin surətlərinin çoxu yerli kartla birləşib
      expect(old.length).toBeLessThan(custom.length + uniqueHadithsFor(HADITHS, l).length - 50)
    })
  }
})

describe('axtarış (utils/search.js) dil modulu ilə eynidir', () => {
  for (const l of LANGS) {
    it(`${l}: hədis qrupu eynidir`, () => {
      const old = buildSources({ hadiths: HADITHS }, l).hadith
      const neu = buildSources({ hadithList: langData(l).list }, l).hadith
      expect(neu).toEqual(old)
    })
  }
})
