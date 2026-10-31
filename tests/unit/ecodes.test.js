// E-kodlar: normallaşdırma, mətndən çıxarma, axtarış, kateqoriya qaydası,
// OFF analiz teqləri, ştrixkod, fetchProduct xətaları və statik baza
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  CATEGORIES, normalizeECode, displayECode, extractECodes, lookupECode, categorize,
  offTagToCode, parseAnalysisTags, halalLabelTags, normalizeBarcode, gtinCheckOk,
  fetchProduct, ProductError,
} from '../../src/utils/ecodes.js'

describe('normalizeECode', () => {
  it.each([
    ['e-120', 'e120'], ['E120', 'e120'], ['E120a', 'e120a'], ['120', 'e120'], ['E 120', 'e120'],
    ['Е120', 'e120'], // kiril Е
    ['e160a(ii)', 'e160aii'], ['E 160 a (ii)', 'e160aii'], ['en:e322i', 'e322i'], ['  e1510 ', 'e1510'],
    ['١٢٠', 'e120'], // ərəb-hind rəqəmləri
  ])('%s → %s', (inp, out) => expect(normalizeECode(inp)).toBe(out))

  it.each([null, undefined, '', 'abc', 'e12', 'e12345', '12', 'e120-x1', 'x120'])('%s → null', (inp) => {
    expect(normalizeECode(inp)).toBeNull()
  })

  it('displayECode', () => {
    expect(displayECode('e341iii')).toBe('E341iii')
    expect(displayECode('')).toBe('')
  })
})

describe('extractECodes', () => {
  it('mətnin içindən E-kodlar, təkrarsız və sıra ilə', () => {
    expect(extractECodes('şəkər, emulqator (E471), E 322, sabitləşdirici e-407, E471')).toEqual(['e471', 'e322', 'e407'])
  })
  it('şəkilçilər koda bitişikdirsə saxlanır, sonrakı sözə keçmir', () => {
    expect(extractECodes('E160a(ii), E322i and E120 and more')).toEqual(['e160aii', 'e322i', 'e120'])
  })
  it('vergüllə ayrılmış tək rəqəmlər də kod sayılır', () => {
    expect(extractECodes('120, 330; 471a')).toEqual(['e120', 'e330', 'e471a'])
  })
  it('sözün içindəki rəqəmlər kod sayılmır', () => {
    expect(extractECodes('type 1200, phone 5550123, 2024-cü il')).toEqual([])
  })
  it('kiril Е', () => expect(extractECodes('Состав: Е120, Е-322')).toEqual(['e120', 'e322']))
})

describe('lookupECode', () => {
  const items = { e322: { n: { en: 'Lecithins' } }, e160a: { n: { en: 'Carotenes' } }, e120: { n: { en: 'Cochineal' } } }
  it('dəqiq tapır', () => {
    expect(lookupECode(items, 'E-120')).toMatchObject({ code: 'e120', exact: true })
  })
  it('alt növ yoxdursa valideynə enir', () => {
    expect(lookupECode(items, 'e322iii')).toMatchObject({ code: 'e322', exact: false, requested: 'e322iii' })
    expect(lookupECode(items, 'E160a(ii)')).toMatchObject({ code: 'e160a', exact: false })
  })
  it('tapılmayan və ya səhv kod → null', () => {
    expect(lookupECode(items, 'e999')).toBeNull()
    expect(lookupECode(items, 'salam')).toBeNull()
    expect(lookupECode(null, 'e120')).toBeNull()
  })
})

describe('categorize — yalnız OFF faktlarından', () => {
  it('vegan/vegetarian yes → heyvan mənşəyi yoxdur', () => {
    expect(categorize({ vegan: 'yes', vegetarian: 'yes', name: 'Ascorbic acid' })).toBe('none')
  })
  it('vegetarian no və ya vegan no → heyvan mənşəli', () => {
    expect(categorize({ vegan: 'no', vegetarian: 'no', name: 'Gelatine' })).toBe('animal')
    expect(categorize({ vegan: 'no', vegetarian: 'yes', name: 'Lanolin' })).toBe('animal')
  })
  it('maybe → mənbəni yoxlamaq lazımdır', () => {
    expect(categorize({ vegan: 'maybe', vegetarian: 'maybe', name: 'Mono- and diglycerides of fatty acids' })).toBe('maybe')
    expect(categorize({ vegan: 'maybe', vegetarian: 'yes' })).toBe('maybe')
  })
  it('status yoxdursa → naməlum', () => {
    expect(categorize({})).toBe('unknown')
    expect(categorize({ vegan: 'yes' })).toBe('unknown')
  })
  it('həşərat: mətn və ya Wikidata sübutu', () => {
    expect(categorize({ vegan: 'no', vegetarian: 'no', name: 'Shellac', desc: 'resin secreted by lac insects' })).toBe('insect')
    expect(categorize({ vegan: 'no', vegetarian: 'yes', name: 'Beeswax', insectEvidence: true })).toBe('insect')
    // sübut yoxdursa, ad tanış olsa belə, ehtimal edilmir
    expect(categorize({ vegan: 'no', vegetarian: 'no', name: 'Cochineal' })).toBe('animal')
  })
  it('spirt: adı etanoldur və ya mənşəyi şərabçılıqdır', () => {
    expect(categorize({ vegan: 'yes', vegetarian: 'yes', name: 'Ethanol' })).toBe('alcohol')
    expect(categorize({ name: 'Monopotassium tartrate', desc: 'is a byproduct of winemaking.' })).toBe('alcohol')
  })
  it('"şərabda işlədilir" və kimyəvi "alcohol" adları spirt sayılmır', () => {
    expect(categorize({ vegan: 'yes', vegetarian: 'yes', name: 'Sulphur dioxide', desc: 'used in dried fruits, wine, fruit juices' })).toBe('none')
    expect(categorize({ vegan: 'yes', vegetarian: 'yes', name: 'Polyvinyl alcohol' })).toBe('none')
    expect(categorize({ vegan: 'yes', vegetarian: 'yes', name: 'maltitol', desc: 'a sugar alcohol' })).toBe('none')
  })
  it('heyvan mənşəyi spirt qaydasından öndədir', () => {
    expect(categorize({ vegan: 'no', vegetarian: 'no', name: 'Ethanol' })).toBe('animal')
  })
  it('CATEGORIES sırası', () => {
    expect(CATEGORIES).toEqual(['insect', 'animal', 'alcohol', 'maybe', 'none', 'unknown'])
  })
})

describe('OFF teqləri', () => {
  it('offTagToCode', () => {
    expect(offTagToCode('en:e322i')).toBe('e322i')
    expect(offTagToCode('en:sugar')).toBeNull()
  })
  it('parseAnalysisTags', () => {
    expect(parseAnalysisTags(['en:palm-oil-free', 'en:non-vegan', 'en:vegetarian'])).toEqual({ vegan: 'no', vegetarian: 'yes', palmOil: 'free' })
    expect(parseAnalysisTags(['en:maybe-vegan', 'en:vegetarian-status-unknown', 'en:may-contain-palm-oil'])).toEqual({ vegan: 'maybe', vegetarian: 'unknown', palmOil: 'maybe' })
    expect(parseAnalysisTags(['en:palm-oil'])).toMatchObject({ palmOil: 'contains' })
    expect(parseAnalysisTags(undefined)).toEqual({ vegan: 'unknown', vegetarian: 'unknown', palmOil: 'unknown' })
  })
  it('halalLabelTags', () => {
    expect(halalLabelTags(['en:no-gluten', 'en:halal', 'fr:certifie-halal-par-x', 'ar:حلال'])).toEqual(['en:halal', 'fr:certifie-halal-par-x', 'ar:حلال'])
    expect(halalLabelTags(null)).toEqual([])
  })
})

describe('ştrixkod', () => {
  it('normalizeBarcode', () => {
    expect(normalizeBarcode(' 3017624010701 ')).toBe('3017624010701')
    expect(normalizeBarcode('3017-6240-10701')).toBe('3017624010701')
    expect(normalizeBarcode('1234567')).toBeNull()
    expect(normalizeBarcode('30176240107a1')).toBeNull()
  })
  it('gtinCheckOk', () => {
    expect(gtinCheckOk('3017624010701')).toBe(true) // EAN-13
    expect(gtinCheckOk('3017624010702')).toBe(false)
    expect(gtinCheckOk('96385074')).toBe(true) // EAN-8
    expect(gtinCheckOk('036000291452')).toBe(true) // UPC-A
    expect(gtinCheckOk('abc')).toBe(false)
  })
})

describe('fetchProduct', () => {
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body })
  const kind = async (p) => { try { await p; return 'ok' } catch (e) { expect(e).toBeInstanceOf(ProductError); return e.kind } }

  it('tapılan məhsul', async () => {
    let url = ''
    const r = await fetchProduct('3017624010701', {
      online: true,
      fetchImpl: async (u) => { url = u; return res(200, { status: 1, product: { product_name: 'Nutella' } }) },
    })
    expect(r).toEqual({ code: '3017624010701', product: { product_name: 'Nutella' } })
    expect(url).toContain('/api/v2/product/3017624010701.json?fields=')
    expect(url).toContain('ingredients_analysis_tags')
  })
  it('səhv kod → invalid (sorğu getmir)', async () => {
    let called = false
    expect(await kind(fetchProduct('12', { fetchImpl: async () => { called = true } }))).toBe('invalid')
    expect(called).toBe(false)
  })
  it('status 0 və ya 404 → notfound', async () => {
    expect(await kind(fetchProduct('3017624010701', { online: true, fetchImpl: async () => res(200, { status: 0 }) }))).toBe('notfound')
    expect(await kind(fetchProduct('3017624010701', { online: true, fetchImpl: async () => res(404, { status: 0 }) }))).toBe('notfound')
  })
  it('oflayn → offline', async () => {
    expect(await kind(fetchProduct('3017624010701', { online: false, fetchImpl: async () => res(200, {}) }))).toBe('offline')
    expect(await kind(fetchProduct('3017624010701', { online: true, fetchImpl: async () => { throw new TypeError('Failed to fetch') } }))).toBe('offline')
  })
  it('vaxt bitir → timeout', async () => {
    const hang = (_u, { signal }) => new Promise((_ok, fail) => signal.addEventListener('abort', () => fail(new DOMException('aborted', 'AbortError'))))
    expect(await kind(fetchProduct('3017624010701', { online: true, timeoutMs: 20, fetchImpl: hang }))).toBe('timeout')
  })
  it('server xətası → http', async () => {
    expect(await kind(fetchProduct('3017624010701', { online: true, fetchImpl: async () => res(503, {}) }))).toBe('http')
  })
})

describe('public/data/ecodes.json', () => {
  const file = path.resolve(__dirname, '../../public/data/ecodes.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  it('mənbə və lisenziya qeydi var', () => {
    expect(data.meta.sourceUrl).toBe('https://static.openfoodfacts.org/data/taxonomies/additives.json')
    expect(data.meta.license).toMatch(/ODbL/)
    expect(data.meta.count).toBe(Object.keys(data.items).length)
    expect(data.meta.count).toBeGreaterThan(500)
  })
  it('hər element: düzgün kod, məlum kateqoriya, kateqoriya qayda ilə uyğun', () => {
    for (const [code, it] of Object.entries(data.items)) {
      expect(normalizeECode(code)).toBe(code)
      expect(CATEGORIES).toContain(it.cat)
      expect(categorize({ vegan: it.vegan, vegetarian: it.vegetarian, name: it.n.en, desc: it.desc, insectEvidence: !!it.insect })).toBe(it.cat)
    }
  })
  it('heç bir elementdə halal/haram hökmü sahəsi yoxdur', () => {
    for (const it of Object.values(data.items)) {
      expect(Object.keys(it).some((k) => /halal|haram|verdict|ruling/i.test(k))).toBe(false)
    }
  })
  it('bilinən OFF faktları', () => {
    expect(data.items.e428).toMatchObject({ vegan: 'no', vegetarian: 'no', cat: 'animal' })
    expect(data.items.e1510.cat).toBe('alcohol')
    expect(data.items.e471.cat).toBe('maybe')
    expect(data.items.e300.cat).toBe('none')
  })
})
