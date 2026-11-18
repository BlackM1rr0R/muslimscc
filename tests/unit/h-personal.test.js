// H mərhələsi — şəxsi ana səhifə (H1), vird (H2), kitab rəfləri (H3), öyrənmə məqsədi (H4),
// uşaq rejimi kilidi (H5): saf məntiq, yaddaş, sinxronizasiya birləşdiriciləri, profil / ehtiyat nüsxə qaydaları.
import { describe, it, expect, beforeEach } from 'vitest'

const mem = new Map()
const storage = {
  get length() { return mem.size }, key: (i) => [...mem.keys()][i] ?? null,
  getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(),
}
globalThis.localStorage = storage
globalThis.window = new EventTarget()
if (typeof globalThis.CustomEvent !== 'function') globalThis.CustomEvent = class extends Event { constructor(t, o) { super(t); this.detail = o?.detail } }

const HL = await import('../../src/utils/homeLayout.js')
const W = await import('../../src/utils/wird.js')
const BS = await import('../../src/utils/bookShelf.js')
const LG = await import('../../src/utils/learnGoal.js')
const KL = await import('../../src/utils/kidLock.js')
const { runMerger, hasMerger, CONFLICT } = await import('../../src/utils/syncMergers.js')
const { PROFILE_KEYS } = await import('../../src/utils/profileCore.js')
const { isBackupKey, collectBackup } = await import('../../src/utils/userBackup.js')
const { buildContinueItems } = await import('../../src/utils/continueItems.js')
const PR = await import('../../src/utils/profiles.js')

beforeEach(() => mem.clear())

// ═══ H1 ═══
describe('homeLayout', () => {
  it('susmaya görə sıra; tanınmayan id atılır, yeni id öz yerinə əlavə olunur', () => {
    expect(HL.applyOrder(null, HL.HOME_SECTIONS)).toEqual(HL.HOME_SECTIONS)
    // köhnə saxlanmış sıra (wird hələ yox idi) + yad id
    const saved = ['quick', 'stories', 'today', 'myday', 'bogus', 'daystory', 'start', 'feats', 'tawheed', 'names']
    const o = HL.applyOrder(saved, HL.HOME_SECTIONS)
    expect(o).not.toContain('bogus')
    expect(o.indexOf('wird')).toBe(o.indexOf('myday') + 1)
    expect(o[0]).toBe('quick')
    expect(o).toHaveLength(HL.HOME_SECTIONS.length)
  })
  it('yuxarı / aşağı, sürüşdür, gizlət; kənarda hərəkət yoxdur', () => {
    let l = HL.defaultLayout()
    l = HL.moveItem(l, 's', 'quick', -1)
    expect(l.s.o.indexOf('quick')).toBe(HL.HOME_SECTIONS.indexOf('quick') - 1)
    expect(HL.moveItem(l, 's', l.s.o[0], -1)).toEqual(l)
    l = HL.moveTo(l, 'c', 'date', 0)
    expect(l.c.o[0]).toBe('date')
    l = HL.setHidden(l, 'c', 'ayah', true)
    expect(HL.visibleIds(l.c)).toEqual(['date', 'hadith', 'cont'])
    l = HL.setHidden(l, 'c', 'ayah', false)
    expect(l.c.h).toEqual([])
  })
  it('saxla / oxu: susmaya görə ilə eynidirsə açar silinir', () => {
    HL.saveLayout(HL.moveItem(HL.defaultLayout(), 's', 'names', -1), storage)
    expect(mem.has(HL.LAYOUT_KEY)).toBe(true)
    expect(HL.readLayout(storage).s.o.at(-1)).toBe('tawheed')
    HL.saveLayout(HL.defaultLayout(), storage)
    expect(mem.has(HL.LAYOUT_KEY)).toBe(false)
    mem.set(HL.LAYOUT_KEY, '{bad json')
    expect(HL.readLayout(storage)).toEqual(HL.defaultLayout())
  })
  it('birləşdirici: hissə üzrə — bir cihaz bölmələri, digəri kartları dəyişib → ikisi də qalır', () => {
    const base = HL.defaultLayout()
    const L = HL.moveItem(base, 's', 'quick', -1)
    const R = HL.setHidden(base, 'c', 'date', true)
    const out = JSON.parse(runMerger(HL.LAYOUT_KEY, JSON.stringify(L), JSON.stringify(R), JSON.stringify(base)))
    expect(out.s).toEqual(L.s)
    expect(out.c.h).toEqual(['date'])
    // hər ikisi bölmələri fərqli dəyişib — bu cihazınkı (ziddiyyət yox)
    const R2 = HL.moveItem(base, 's', 'names', -1)
    const o2 = JSON.parse(runMerger(HL.LAYOUT_KEY, JSON.stringify(L), JSON.stringify(R2), JSON.stringify(base)))
    expect(o2.s).toEqual(L.s)
  })
})

// ═══ H2 ═══
const TIMES = { fajr: '05:40', sunrise: '07:10', dhuhr: '12:20', asr: '15:00', maghrib: '17:20', isha: '18:50' }
describe('wird', () => {
  const mk = () => ['morning', 'evening', 'mulk'].reduce((w, t) => W.addItem(w, { t }), W.addItem(W.sanitizeWird(null), { t: 'quran', n: 3, at: 'dhuhr' }))
  it('element təmizlənir: tanınmayan növ atılır, say həddə sıxılır, eyni id təkrarlanmır', () => {
    const w = W.sanitizeWird({ items: [{ t: 'x' }, { t: 'quran', n: 999, at: 'fajr' }, { t: 'quran', n: 2, at: 'fajr' }, { t: 'salawat', at: 'nope' }] })
    expect(w.items).toEqual([{ id: 'quran-fajr', t: 'quran', at: 'fajr', n: 20 }, { id: 'salawat-maghrib', t: 'salawat', at: 'maghrib', n: 10 }])
  })
  it('bugünkü siyahı namaz vaxtlarına görə sıralanır; "yatmazdan əvvəl" — işadan sonra', () => {
    const s = W.buildSchedule(mk().items, TIMES, ['morning-fajr'], 13 * 60)
    expect(s.map((x) => x.id)).toEqual(['morning-fajr', 'quran-dhuhr', 'evening-asr', 'mulk-sleep'])
    expect(s[0]).toMatchObject({ done: true, due: true, min: 340 })
    expect(s[1]).toMatchObject({ due: true, done: false })
    expect(s[2].due).toBe(false)
    expect(s[3].min).toBe(18 * 60 + 50 + 90)
  })
  it('gün sərhədi sübhdədir: 00:30 — ötən gün, dəqiqələr 24·60-dan sonra', () => {
    expect(W.wirdDay('2026-11-18', 30, 340)).toBe('2026-11-17')
    expect(W.wirdDay('2026-11-18', 341, 340)).toBe('2026-11-18')
    expect(W.wirdDay('2026-03-01', 10, 340)).toBe('2026-02-28')
    const r = W.scheduleNow(new Date(2026, 10, 18, 0, 30), TIMES)
    expect(r).toEqual({ day: '2026-11-17', nowMin: 24 * 60 + 30 })
    const s = W.buildSchedule(mk().items, TIMES, [], r.nowMin)
    expect(s.every((x) => x.due)).toBe(true)   // gecə yarısından sonra hamısının vaxtı keçib
    expect(W.scheduleNow(new Date(2026, 10, 18, 6, 0), TIMES)).toEqual({ day: '2026-11-18', nowMin: 360 })
  })
  it('vaxtlar yoxdursa — təxmini vaxtlarla sıralanır', () => {
    expect(W.anchorMinutes('fajr', {})).toBe(330)
    expect(W.anchorMinutes('asr', { asr: 'bad' })).toBe(15 * 60 + 30)
  })
  it('işarə, irəliləyiş, seriya (bu gün bitməyibsə — dünənə qədər)', () => {
    let w = mk()
    const all = w.items.map((x) => x.id)
    for (const d of ['2026-11-15', '2026-11-16', '2026-11-17']) for (const id of all) w = W.toggleDone(w, d, id, true)
    expect(W.wirdStreak(w, '2026-11-18')).toBe(3)
    w = W.toggleDone(w, '2026-11-18', all[0], true)
    expect(W.progress(w, '2026-11-18')).toEqual({ done: 1, total: 4 })
    expect(W.wirdStreak(w, '2026-11-18')).toBe(3)
    for (const id of all) w = W.toggleDone(w, '2026-11-18', id, true)
    expect(W.wirdStreak(w, '2026-11-18')).toBe(4)
    w = W.toggleDone(w, '2026-11-16', all[1], false)
    expect(W.wirdStreak(w, '2026-11-18')).toBe(2)
    w = W.toggleDone(w, '2026-11-16', all[0], false)
    w = W.toggleDone(w, '2026-11-16', all[2], false)
    w = W.toggleDone(w, '2026-11-16', all[3], false)
    expect(w.log['2026-11-16']).toBeUndefined()
  })
  it('səhər / axşam azkarı adhkar_done_v1-dən avtomatik işarələnir', () => {
    const w = W.applyAuto(mk(), '2026-11-18', { morning: '2026-11-18', evening: '2026-11-10' })
    expect(w.log['2026-11-18'].d).toEqual(['morning-fajr'])
    const same = W.applyAuto(w, '2026-11-18', { morning: '2026-11-18' })
    expect(same).toBe(w)
  })
  it('birləşdirici: element 3 tərəfli, işarələr gün üzrə 3 tərəfli', () => {
    const base = W.toggleDone(mk(), '2026-11-18', 'morning-fajr', true)
    let L = W.addItem(base, { t: 'salawat', n: 100 })
    L = W.toggleDone(L, '2026-11-18', 'quran-dhuhr', true)
    let R = W.removeItem(base, 'mulk-sleep')
    R = W.toggleDone(R, '2026-11-18', 'morning-fajr', false)
    R = W.toggleDone(R, '2026-11-18', 'evening-asr', true)
    const out = JSON.parse(runMerger(W.WIRD_KEY, JSON.stringify(L), JSON.stringify(R), JSON.stringify(base)))
    expect(out.items.map((x) => x.id).sort()).toEqual(['evening-asr', 'morning-fajr', 'quran-dhuhr', 'salawat-maghrib'])
    expect(out.log['2026-11-18'].d.sort()).toEqual(['evening-asr', 'quran-dhuhr'])
    // baza yoxdur — birlik
    const u = JSON.parse(runMerger(W.WIRD_KEY, JSON.stringify(L), JSON.stringify(R), undefined))
    expect(u.items.map((x) => x.id)).toContain('mulk-sleep')
    expect(runMerger(W.WIRD_KEY, '{bad', JSON.stringify(R), undefined)).toBe(CONFLICT)
  })
  it('saxla / oxu (boş vird — açar silinir)', () => {
    W.saveWird(mk(), storage)
    expect(W.readWird(storage).items).toHaveLength(4)
    W.saveWird(W.sanitizeWird(null), storage)
    expect(mem.has(W.WIRD_KEY)).toBe(false)
  })
})

// ═══ H3 ═══
describe('bookShelf', () => {
  it('rəf, səhifə, qeyd (≤500), yad id və idarəedici simvollar atılır', () => {
    let s = BS.sanitizeShelf(null)
    s = BS.setEntry(s, 'default-b1', { s: 'reading', t: 'Riyazus-Salihin', p: 42, n: 'x'.repeat(600) + '\u0007' }, 1000)
    s = BS.setEntry(s, 'bad id!', { s: 'read' }, 1001)
    s = BS.setEntry(s, 'b2', { s: 'nope' }, 1002)
    expect(Object.keys(s.b)).toEqual(['default-b1'])
    expect(s.b['default-b1']).toMatchObject({ s: 'reading', p: 42, t: 'Riyazus-Salihin', at: 1000 })
    expect([...s.b['default-b1'].n]).toHaveLength(BS.NOTE_MAX)
    s = BS.setEntry(s, 'default-b1', { s: null })
    expect(s.b).toEqual({})
  })
  it('rəf sayları, "oxuyuram" — ən təzə kitab "Davam et"-ə düşür', () => {
    let s = BS.sanitizeShelf(null)
    s = BS.setEntry(s, 'a1', { s: 'reading', t: 'A', p: 5 }, 100)
    s = BS.setEntry(s, 'a2', { s: 'reading', t: 'B' }, 300)
    s = BS.setEntry(s, 'a3', { s: 'read', t: 'C' }, 400)
    s = BS.setEntry(s, 'a4', { s: 'want', t: 'D' }, 500)
    expect(BS.shelfCounts(s)).toEqual({ reading: 2, want: 1, read: 1 })
    expect(BS.currentBook(s).id).toBe('a2')
    BS.saveShelf(s, storage)
    const items = buildContinueItems(storage)
    const it = items.find((x) => x.key === 'book')
    expect(it).toMatchObject({ page: 'books', search: '?book=a2', at: 300, vars: { title: 'B', page: null } })
    // "oxudum" / "istəyirəm" rəfləri "Davam et"-də yoxdur
    BS.saveShelf(BS.setEntry(BS.setEntry(s, 'a1', { s: 'read' }), 'a2', { s: 'want' }), storage)
    expect(buildContinueItems(storage).some((x) => x.key === 'book')).toBe(false)
  })
  it('birləşdirici: kitab üzrə 3 tərəfli, hər ikisi dəyişibsə — təzəsi', () => {
    const base = BS.setEntry(BS.sanitizeShelf(null), 'k1', { s: 'want', t: 'K' }, 10)
    const L = BS.setEntry(base, 'k1', { s: 'reading', p: 3 }, 20)
    const R = BS.setEntry(BS.setEntry(base, 'k1', { s: 'read' }, 30), 'k2', { s: 'want' }, 31)
    const out = JSON.parse(runMerger(BS.SHELF_KEY, JSON.stringify(L), JSON.stringify(R), JSON.stringify(base)))
    expect(out.b.k1.s).toBe('read')
    expect(out.b.k2.s).toBe('want')
    const del = BS.setEntry(base, 'k1', { s: null })
    const o2 = JSON.parse(runMerger(BS.SHELF_KEY, JSON.stringify(del), JSON.stringify(base), JSON.stringify(base)))
    expect(o2.b.k1).toBeUndefined()
  })
})

// ═══ H4 ═══
describe('learnGoal', () => {
  const PATH = { key: 'aqidah', lessons: ['usul-ath-thalatha', 'al-qawaid-al-arba', 'nawaqid-al-islam', 'kitab-at-tawhid'] }
  it('yolun irəliləyişi və növbəti addım: dərs → test → ərəb kursu', () => {
    const read = new Set(['usul-ath-thalatha'])
    expect(LG.pathProgress(PATH, read)).toEqual({ read: 1, total: 4, next: 'al-qawaid-al-arba', done: false })
    expect(LG.nextStep(PATH, read)).toEqual({ kind: 'lesson', slug: 'al-qawaid-al-arba' })
    const all = new Set(PATH.lessons)
    expect(LG.nextStep(PATH, all)).toEqual({ kind: 'quiz' })
    expect(LG.nextStep(PATH, all, { quizDone: true })).toEqual({ kind: 'arabic' })
    expect(LG.nextStep(null, all)).toBe(null)
  })
  it('jurnal və həftəlik xülasə (bu həftə / ötən həftə / yoldan)', () => {
    let g = LG.setGoal(LG.sanitizeGoal(null), 'aqidah', new Date(2026, 10, 10))
    expect(g).toMatchObject({ g: 'aqidah', since: '2026-11-10' })
    g = LG.logRead(g, 'usul-ath-thalatha', '2026-11-18')
    g = LG.logRead(g, 'usul-ath-thalatha', '2026-11-18')
    g = LG.logRead(g, 'ghusl', '2026-11-14')
    g = LG.logRead(g, 'tawbah', '2026-11-08')
    g = LG.logRead(g, 'BAD SLUG', '2026-11-18')
    const w = LG.weekSummary(g, '2026-11-18', PATH.lessons)
    expect(w).toMatchObject({ week: 2, prev: 1, pathWeek: 1, activeDays: 2 })
    expect(w.days).toHaveLength(7)
  })
  it('birləşdirici: sonra seçilən məqsəd qalib, jurnal birləşir; silmə də "seçim"dir', () => {
    const a = LG.logRead(LG.setGoal(LG.sanitizeGoal(null), 'prayer', new Date(1000)), 'ghusl', '2026-11-01')
    const b = LG.logRead(LG.setGoal(LG.sanitizeGoal(null), 'heart', new Date(2000)), 'tawbah', '2026-11-01')
    const out = JSON.parse(runMerger(LG.GOAL_KEY, JSON.stringify(a), JSON.stringify(b), undefined))
    expect(out.g).toBe('heart')
    expect(out.log['2026-11-01'].sort()).toEqual(['ghusl', 'tawbah'])
    const cleared = LG.setGoal(a, null, new Date(3000))
    expect(JSON.parse(runMerger(LG.GOAL_KEY, JSON.stringify(cleared), JSON.stringify(b), undefined)).g).toBe(null)
  })
})

// ═══ H5 ═══
describe('kidLock', () => {
  it('marşrut qoruyucusu: yalnız uşaq bölməsi, Quran, dualar', () => {
    for (const p of ['kids', 'quran', 'duas']) expect(KL.kidAllowed(p)).toBe(true)
    for (const p of ['aichat', 'account', 'admin', 'adminlogin', 'home', 'notfound', 'books', 'hadith']) expect(KL.kidAllowed(p)).toBe(false)
  })
  it('PIN-siz kilid ola bilməz; PIN heşlənir (PBKDF2, duz), açıq PIN saxlanmır', async () => {
    expect(() => KL.enableLock(storage)).toThrow('no_pin')
    expect(KL.sanitizeLock({ on: true }).on).toBe(false)
    await expect(KL.setPin('12a4', storage, 10000)).rejects.toThrow('bad_pin')
    await KL.setPin('2580', storage, 10000)
    const raw = mem.get(KL.KIDLOCK_KEY)
    expect(raw).not.toContain('2580')
    const st = JSON.parse(raw)
    expect(st.pin.it).toBe(10000)
    expect(st.pin.salt).not.toBe(JSON.parse(raw).pin.hash)
    // eyni PIN, fərqli duz → fərqli heş
    const h2 = await KL.hashPin('2580', KL.newSalt(), 10000)
    expect(h2).not.toBe(st.pin.hash)
    expect(await KL.hashPin('2580', st.pin.salt, 10000)).toBe(st.pin.hash)
  })
  it('kilid → səhv PIN-lər → gözləmə (ikiqat) → doğru PIN ilə çıxış', async () => {
    await KL.setPin('135790', storage, 10000)
    KL.enableLock(storage)
    expect(KL.isKidLocked(storage)).toBe(true)
    let now = 1_000_000
    for (let i = 1; i <= 2; i++) expect(await KL.disableWithPin('000000', storage, now)).toMatchObject({ ok: false, wait: 0, fails: i })
    const r3 = await KL.disableWithPin('000000', storage, now)
    expect(r3).toMatchObject({ ok: false, wait: 30_000, fails: 3 })
    // gözləmə bitməyib — doğru PIN belə yoxlanmır
    const blocked = await KL.disableWithPin('135790', storage, now + 1000)
    expect(blocked.ok).toBe(false)
    expect(blocked.wait).toBe(29_000)
    expect(KL.isKidLocked(storage)).toBe(true)
    now += 31_000
    expect((await KL.disableWithPin('111111', storage, now)).wait).toBe(60_000)
    now += 61_000
    expect(await KL.disableWithPin('135790', storage, now)).toEqual({ ok: true })
    expect(KL.isKidLocked(storage)).toBe(false)
    expect(KL.readLock(storage)).toMatchObject({ f: 0, u: 0 })
  })
  it('gözləmə həddi: 30 s · 2^(n−3), ən çox 15 dəqiqə', () => {
    expect([0, 1, 2].map(KL.backoffMs)).toEqual([0, 0, 0])
    expect(KL.backoffMs(3)).toBe(30_000)
    expect(KL.backoffMs(4)).toBe(60_000)
    expect(KL.backoffMs(20)).toBe(15 * 60_000)
  })
  it('kilid açıq ikən profil dəyişmək bağlıdır', async () => {
    PR.enableProfiles({ name: 'Ana' }, { name: 'Ali', kid: true }, storage)
    const [a, b] = PR.readRegistry(storage).list
    await KL.setPin('4321', storage, 10000)
    KL.enableLock(storage, a.id)
    expect(PR.switchProfile(b.id, storage)).toBe(false)
    expect(PR.activeId(storage)).toBe(a.id)
    await KL.disableWithPin('4321', storage)
    expect(PR.switchProfile(b.id, storage)).toBe(true)
  })
  it('kilid yalnız bu cihazdadır — ehtiyat nüsxəyə / sinxrona düşmür', async () => {
    await KL.setPin('4321', storage, 10000)
    expect(isBackupKey(KL.KIDLOCK_KEY)).toBe(false)
    expect(collectBackup(storage).data[KL.KIDLOCK_KEY]).toBeUndefined()
  })
})

describe('yeni açarlar: birləşdirici + profil', () => {
  it('hər yeni açarın birləşdiricisi var və profilə aiddir', () => {
    for (const k of ['home_layout_v1', 'wird_v1', 'books_shelf_v1', 'learn_goal_v1']) {
      expect(hasMerger(k)).toBe(true)
      expect(hasMerger(`mcc_profile:pabc123:${k}`)).toBe(true)
      expect(PROFILE_KEYS).toContain(k)
      expect(isBackupKey(k)).toBe(true)
    }
    expect(PROFILE_KEYS).not.toContain('mcc_kidlock')
    expect(runMerger('learn_path_v1', 'heart', 'prayer', 'new')).toBe('heart')
  })
})
