// C dəstəsi: sədəqeyi-cariyə gündəliyi (utils/jariyahJournal) və yeni müsəlmanın yolu
// (utils/newMuslimPath) — təmizləmə, yazma/silmə, profil açarları, sinxronizasiya birləşdiriciləri,
// ehtiyat nüsxəyə düşmə.
import { describe, it, expect } from 'vitest'
import {
  sanitizeJariyah, sanitizeJariyahEntry, saveJariyah, removeJariyah, readJariyah, onBehalfNames,
  JARIYAH_KEY, JARIYAH_KINDS, NOTE_MAX, ON_MAX,
} from '../../src/utils/jariyahJournal.js'
import { sanitizePath, setStep, readPath, nextStep, PATH_KEY, PATH_STEP_IDS } from '../../src/utils/newMuslimPath.js'
import { MERGERS, runMerger, CONFLICT } from '../../src/utils/syncMergers.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

const J = JSON.stringify
const store = (init = {}) => {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m,
  }
}
const E = (id, extra = {}) => ({ id, k: 'tree', d: '2026-11-01', u: 1, ...extra })

describe('sədəqeyi-cariyə gündəliyi', () => {
  it('qeyd təmizlənir: növ, gün, id; "kimin adından" və qeyd kəsilir, idarəetmə simvolları atılır', () => {
    expect(JARIYAH_KINDS).toEqual(['quran', 'tree', 'taught', 'water', 'other'])
    expect(sanitizeJariyahEntry(E('jabcd1'))).toEqual({ id: 'jabcd1', k: 'tree', d: '2026-11-01', u: 1 })
    expect(sanitizeJariyahEntry(E('jabcd1', { k: 'money' }))).toBeNull()
    expect(sanitizeJariyahEntry(E('jabcd1', { d: '2026-02-30' }))).toBeNull()
    expect(sanitizeJariyahEntry(E('bad id'))).toBeNull()
    const e = sanitizeJariyahEntry(E('jabcd1', { on: '  Atam\u0007  ', no: 'x'.repeat(NOTE_MAX + 50) }))
    expect(e.on).toBe('Atam')
    expect(e.no).toHaveLength(NOTE_MAX)
    expect(sanitizeJariyahEntry(E('jabcd1', { on: 'y'.repeat(ON_MAX + 9) })).on).toHaveLength(ON_MAX)
    // təkrarlanan id — biri qalır; günə görə sıralanır
    const all = sanitizeJariyah({ l: [E('jb2222', { d: '2026-11-05' }), E('ja1111'), E('ja1111', { k: 'water' }), 'zibil'] })
    expect(all.l.map((x) => x.id)).toEqual(['ja1111', 'jb2222'])
  })

  it('əlavə et / yenilə / sil; boş siyahı açarı silir; ad təklifləri təkrarsız', () => {
    const s = store()
    const r = saveJariyah({ k: 'quran', d: '2026-11-02', on: 'Nənəm', no: 'Məscidə Mushaf' }, s, 1000)
    expect(r.ok).toBe(true)
    expect(readJariyah(s).l).toHaveLength(1)
    saveJariyah({ k: 'water', d: '2026-11-03', on: 'Nənəm' }, s, 2000)
    const upd = saveJariyah({ ...r.item, no: 'İki Mushaf' }, s, 3000)
    expect(upd.data.l.find((x) => x.id === r.item.id)).toMatchObject({ no: 'İki Mushaf', u: 3000 })
    expect(onBehalfNames(readJariyah(s))).toEqual(['Nənəm'])
    expect(saveJariyah({ k: 'nope', d: '2026-11-03' }, s).ok).toBe(false)
    for (const x of readJariyah(s).l) removeJariyah(x.id, s)
    expect(s.getItem(JARIYAH_KEY)).toBeNull()
  })

  it('birləşdirici: iki cihazın əlavələri birləşir, silinmə keçir, eyni qeyd — təzəsi', () => {
    const base = { v: 1, l: [E('ja1111'), E('jb2222')] }
    const local = { v: 1, l: [E('ja1111', { no: 'köhnə', u: 5 }), E('jc3333', { d: '2026-11-04' })] }   // jb2222 silinib
    const remote = { v: 1, l: [E('ja1111', { no: 'təzə', u: 9 }), E('jb2222'), E('jd4444', { d: '2026-11-06' })] }
    const out = JSON.parse(runMerger(JARIYAH_KEY, J(local), J(remote), J(base)))
    expect(out.l.map((x) => x.id)).toEqual(['ja1111', 'jc3333', 'jd4444'])
    expect(out.l[0].no).toBe('təzə')
    // bazasız — birlik
    const u = JSON.parse(runMerger(JARIYAH_KEY, J(local), J(remote), undefined))
    expect(u.l.map((x) => x.id).sort()).toEqual(['ja1111', 'jb2222', 'jc3333', 'jd4444'])
    // oxunmayan JSON — ziddiyyət
    expect(runMerger(JARIYAH_KEY, '{', J(remote), undefined)).toBe(CONFLICT)
  })
})

describe('yeni müsəlmanın yolu', () => {
  it('yalnız tanınan addımlar və həqiqi günlər; işarələ / götür; növbəti addım', () => {
    expect(PATH_STEP_IDS[0]).toBe('shahada')
    expect(sanitizePath({ d: { shahada: '2026-11-01', bogus: '2026-11-01', fatiha: 'dünən' } })).toEqual({ v: 1, d: { shahada: '2026-11-01' } })
    const s = store()
    expect(nextStep(readPath(s))).toBe('shahada')
    setStep('shahada', true, s, '2026-11-01')
    setStep('shahada', true, s, '2026-11-09')   // təkrar işarə günü dəyişmir
    expect(readPath(s).d.shahada).toBe('2026-11-01')
    expect(nextStep(readPath(s))).toBe('purity')
    setStep('nope', true, s)
    expect(Object.keys(readPath(s).d)).toEqual(['shahada'])
    setStep('shahada', false, s)
    expect(s.getItem(PATH_KEY)).toBeNull()
    const all = store()
    for (const id of PATH_STEP_IDS) setStep(id, true, all, '2026-11-01')
    expect(nextStep(readPath(all))).toBeNull()
  })

  it('birləşdirici: addım üzrə 3 tərəfli; götürülən işarə keçir; eyni addım — ən erkən gün', () => {
    const base = { v: 1, d: { shahada: '2026-11-01', purity: '2026-11-02' } }
    const local = { v: 1, d: { shahada: '2026-11-01', times: '2026-11-05' } }                       // purity götürülüb
    const remote = { v: 1, d: { shahada: '2026-11-01', purity: '2026-11-02', times: '2026-11-03' } }
    expect(JSON.parse(runMerger(PATH_KEY, J(local), J(remote), J(base))).d).toEqual({ shahada: '2026-11-01', times: '2026-11-03' })
    expect(runMerger(PATH_KEY, J({ v: 1, d: {} }), J({ v: 1, d: {} }), undefined)).toBeUndefined()
  })
})

describe('C açarları: profil, sinxronizasiya, ehtiyat nüsxə', () => {
  it('profilə aiddir, birləşdiricisi var, ehtiyat nüsxəyə düşür; profil adı sahəsi də birləşir', () => {
    for (const k of [JARIYAH_KEY, PATH_KEY]) {
      expect(PROFILE_KEYS).toContain(k)
      expect(typeof MERGERS[k]).toBe('function')
      expect(isBackupKey(k)).toBe(true)
    }
    const a = J({ v: 1, d: { shahada: '2026-11-02' } }), b = J({ v: 1, d: { shahada: '2026-11-01' } })
    expect(JSON.parse(runMerger(`mcc_profile:pabc123:${PATH_KEY}`, a, b, undefined)).d.shahada).toBe('2026-11-01')
  })
})

describe('sədəqeyi-cariyə hədisi — saytın öz bazasından (verbatim, mənbə ilə)', () => {
  it('hər 5 dildə təkrarsız siyahıda Muslim 1631 tapılır; tərcümə "üç şeyi" sadalayır; /hadith/<id> səhifəsi var', async () => {
    const { HADITHS } = await import('../../src/data/hadiths.js')
    const { uniqueHadithsFor } = await import('../../src/utils/uniqueHadiths.js')
    const { findJariyahHadith } = await import('../../src/utils/jariyahJournal.js')
    const { HADITH_IDS } = await import('../../src/seo/hadithIds.js')
    for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
      const r = findJariyahHadith(uniqueHadithsFor(HADITHS, l))
      expect(r, l).toBeTruthy()
      expect(r.h.source).toBe('Muslim 1631')
      expect(HADITH_IDS).toContain(String(r.h.id))
      // ərəbcə tam deyilsə, səhifə yalnız tərcüməni göstərir (fullAr: false)
      if (r.fullAr) expect(r.h.ar).toContain('جَارِيَةٍ')
    }
    expect(findJariyahHadith(uniqueHadithsFor(HADITHS, 'en')).h.text).toMatch(/ongoing charity/)
  })
  it('tam ərəbcəli nüsxə üstündür; mənbəsi başqa olan götürülmür', async () => {
    const { findJariyahHadith } = await import('../../src/utils/jariyahJournal.js')
    const short = { id: 1, source: 'Muslim 1631', ar: 'إِذَا مَاتَ الإِنْسَانُ' }
    const full = { id: 2, source: 'Muslim 1631', ar: 'إِلَّا مِنْ صَدَقَةٍ جَارِيَةٍ' }
    expect(findJariyahHadith([short, full])).toEqual({ h: full, fullAr: true })
    expect(findJariyahHadith([short])).toEqual({ h: short, fullAr: false })
    expect(findJariyahHadith([{ ...full, source: 'Tirmizi 1376' }])).toBeNull()
  })
})
