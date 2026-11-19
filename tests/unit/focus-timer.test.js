// /focus — taymerin vəziyyət maşını (utils/focusTimer), yerli yaddaş və ayə seçimi (utils/focusStore),
// sinxron birləşdiriciləri (utils/syncMergers)
import { describe, it, expect } from 'vitest'
import {
  initTimer, startTimer, pauseTimer, resetTimer, tick, remaining, progress, applyConfig, skipBreak, clockText,
  clampFocus, clampBreak, phaseMs,
} from '../../src/utils/focusTimer.js'
import {
  sanitizeFocusPrefs, readFocusPrefs, writeFocusPrefs, doneToday, addDone, sanitizeDone, nextAyahIn, gentlePick, refsFromPool,
  FOCUS_PREFS_KEY, FOCUS_DONE_KEY,
} from '../../src/utils/focusStore.js'
import { runMerger } from '../../src/utils/syncMergers.js'
import { isProfileScoped } from '../../src/utils/profileCore.js'

const MIN = 60000
const cfg = { focus: 25, brk: 5 }
const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

describe('focusTimer — vəziyyət maşını', () => {
  it('başlanğıc: diqqət, gözləyir, tam uzunluq', () => {
    const st = initTimer(cfg)
    expect(st).toEqual({ phase: 'focus', status: 'idle', left: 25 * MIN, endsAt: null })
    expect(remaining(st, 123)).toBe(25 * MIN)
    expect(progress(st, cfg, 123)).toBe(0)
  })

  it('başla → fasilə ver → davam et: qalan vaxt saxlanır', () => {
    let st = startTimer(initTimer(cfg), 1000)
    expect(st.status).toBe('running')
    expect(st.endsAt).toBe(1000 + 25 * MIN)
    expect(remaining(st, 1000 + 10 * MIN)).toBe(15 * MIN)
    st = pauseTimer(st, 1000 + 10 * MIN)
    expect(st).toMatchObject({ status: 'paused', left: 15 * MIN, endsAt: null })
    // fasilədə vaxt keçmir
    expect(remaining(st, 1000 + 60 * MIN)).toBe(15 * MIN)
    st = startTimer(st, 5000000)
    expect(st.endsAt).toBe(5000000 + 15 * MIN)
    expect(progress(st, cfg, 5000000)).toBeCloseTo(0.4, 5)
  })

  it('diqqət bitəndə fasilə özü başlayır (focusDone), fasilə bitəndə diqqət gözləyir (breakDone)', () => {
    let st = startTimer(initTimer(cfg), 0)
    expect(tick(st, cfg, 25 * MIN - 1)).toEqual({ state: st, event: null })
    let r = tick(st, cfg, 25 * MIN)
    expect(r.event).toBe('focusDone')
    expect(r.state).toEqual({ phase: 'break', status: 'running', left: 5 * MIN, endsAt: 25 * MIN + 5 * MIN })
    st = r.state
    r = tick(st, cfg, 30 * MIN + 10)
    expect(r.event).toBe('breakDone')
    expect(r.state).toEqual({ phase: 'focus', status: 'idle', left: 25 * MIN, endsAt: null })
    // gözləyən taymer özbaşına dəyişmir
    expect(tick(r.state, cfg, 99 * MIN).event).toBe(null)
  })

  it('vərəq uzun müddət gizli qalıb: yalnız bir keçid, fasilə İNDİdən başlayır', () => {
    const st = startTimer(initTimer(cfg), 0)
    const r = tick(st, cfg, 200 * MIN)
    expect(r.event).toBe('focusDone')
    expect(r.state.endsAt).toBe(200 * MIN + 5 * MIN)
  })

  it('sıfırla, fasiləni ötür, ayar dəyişikliyi', () => {
    const running = startTimer(initTimer(cfg), 0)
    expect(resetTimer(cfg)).toEqual(initTimer(cfg))
    // işləyən taymerə ayar toxunmur, gözləyənə toxunur
    expect(applyConfig(running, { focus: 50, brk: 5 })).toBe(running)
    expect(applyConfig(initTimer(cfg), { focus: 50, brk: 5 }).left).toBe(50 * MIN)
    const brk = tick(running, cfg, 25 * MIN).state
    expect(skipBreak(brk, cfg)).toEqual(initTimer(cfg))
    expect(skipBreak(running, cfg)).toBe(running)
    // pauza yalnız işləyəndə
    const idle = initTimer(cfg)
    expect(pauseTimer(idle, 5)).toBe(idle)
    expect(startTimer(running, 5)).toBe(running)
  })

  it('hədlər və saat yazısı', () => {
    expect(clampFocus(2)).toBe(5)
    expect(clampFocus(200)).toBe(90)
    expect(clampFocus('abc')).toBe(25)
    expect(clampBreak(0)).toBe(1)
    expect(clampBreak(31)).toBe(30)
    expect(phaseMs('break', { focus: 25, brk: 7 })).toBe(7 * MIN)
    expect(clockText(25 * MIN)).toBe('25:00')
    expect(clockText(61 * 1000 - 1)).toBe('01:01')
    expect(clockText(0)).toBe('00:00')
    expect(clockText(-5)).toBe('00:00')
    expect(clockText(90 * MIN)).toBe('1:30:00')
  })
})

describe('focusStore — ayarlar, günün sayı, ayə seçimi', () => {
  it('ayarlar təmizlənir və yazılır', () => {
    expect(sanitizeFocusPrefs(null)).toEqual({ f: 25, b: 5, m: 'random', s: 1, p: 1, snd: true })
    expect(sanitizeFocusPrefs({ f: 300, b: -1, m: 'x', s: 200, p: 9, snd: false })).toEqual({ f: 90, b: 1, m: 'random', s: 1, p: 1, snd: false })
    // ayə surənin ayə sayından böyük ola bilməz (Fatihə — 7)
    expect(sanitizeFocusPrefs({ m: 'surah', s: 1, p: 8 }).p).toBe(1)
    expect(sanitizeFocusPrefs({ m: 'surah', s: 2, p: 255 }).p).toBe(255)
    const st = mem({ [FOCUS_PREFS_KEY]: '{bad json' })
    expect(readFocusPrefs(st).f).toBe(25)
    writeFocusPrefs({ f: 40, m: 'surah', s: 36, p: 3 }, st)
    expect(readFocusPrefs(st)).toMatchObject({ f: 40, m: 'surah', s: 36, p: 3 })
  })

  it('surədə növbəti ayə — sonda 1-ə qayıdır', () => {
    expect(nextAyahIn(1, 3)).toBe(4)
    expect(nextAyahIn(1, 7)).toBe(1)
    expect(nextAyahIn(114, 6)).toBe(1)
  })

  it('günün bitən seansları: yalnız həmin gün, son 14 gün, pozuq qeyd atılır', () => {
    const st = mem()
    expect(doneToday(st, '2026-11-19')).toBe(0)
    expect(addDone(st, '2026-11-19')).toBe(1)
    expect(addDone(st, '2026-11-19')).toBe(2)
    expect(doneToday(st, '2026-11-20')).toBe(0)
    const many = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`2026-10-${String(i + 1).padStart(2, '0')}`, 1]))
    expect(Object.keys(sanitizeDone({ ...many, bad: 3, '2026-11-01': -2, '2026-11-02': 1.5 }))).toHaveLength(14)
  })

  it('yumşaq təsadüf: sonuncu təkrarlanmır', () => {
    const refs = [{ s: 2, a: 255 }, { s: 94, a: 5 }]
    for (const rnd of [0, 0.3, 0.6, 0.99]) expect(gentlePick(refs, '2:255', rnd)).toEqual({ s: 94, a: 5 })
    expect(gentlePick([{ s: 1, a: 1 }], '1:1', 0.5)).toEqual({ s: 1, a: 1 })
    expect(gentlePick([], '', 0.5)).toBe(null)
  })

  it('"günün ayəsi" hovuzundan istinadlar: tək ayə, təkrarsız, aralıq və hədis atılır', () => {
    const pool = [
      { source: 'Quran 94:5' }, { source: 'Quran 94:5' }, { source: 'Quran 2:285-286' },
      { source: 'Buxari 1' }, { source: 'Quran 1:8' }, { source: 'Qurani-Kərim 13:28' }, {},
    ]
    expect(refsFromPool(pool)).toEqual([{ s: 94, a: 5 }, { s: 13, a: 28 }])
  })

  it('saytın real hovuzu (data/quotes.js → buildDailyPools) boş deyil', async () => {
    const [{ QUOTES }, { DUAS_DATA }, { buildDailyPools }] = await Promise.all([
      import('../../src/data/quotes.js'), import('../../src/data/duas.js'), import('../../src/utils/dailyPools.js'),
    ])
    const refs = refsFromPool(buildDailyPools(QUOTES, DUAS_DATA).AYAH_POOL)
    expect(refs.length).toBeGreaterThan(10)
  })
})

describe('sinxron birləşdiricilər — diqqət seansı', () => {
  it('günün sayları toplanır (baza ilə), ayarlarda bu cihazınkı', () => {
    const b = JSON.stringify({ '2026-11-19': 1 })
    const l = JSON.stringify({ '2026-11-19': 3 })
    const r = JSON.stringify({ '2026-11-19': 2, '2026-11-18': 4 })
    expect(JSON.parse(runMerger(FOCUS_DONE_KEY, l, r, b))).toEqual({ '2026-11-18': 4, '2026-11-19': 4 })
    expect(JSON.parse(runMerger(FOCUS_DONE_KEY, l, r, undefined))).toEqual({ '2026-11-18': 4, '2026-11-19': 3 })
    const lp = JSON.stringify({ f: 40, b: 5, m: 'random', s: 1, p: 1, snd: true })
    const rp = JSON.stringify({ f: 20, b: 5, m: 'surah', s: 2, p: 3, snd: true })
    expect(JSON.parse(runMerger(FOCUS_PREFS_KEY, lp, rp, undefined)).f).toBe(40)
    expect(JSON.parse(runMerger(FOCUS_PREFS_KEY, undefined, rp, undefined)).m).toBe('surah')
    expect(isProfileScoped(FOCUS_DONE_KEY)).toBe(true)
  })
})
