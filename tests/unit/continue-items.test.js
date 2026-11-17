// "Davam et": hədisin son oxunan yeri (utils/hadithLastRead) və kartın siyahısı (utils/continueItems)
import { describe, it, expect, beforeEach } from 'vitest'
import { recordHadithRead, readHadithLast, cleanHadithEntry, HADITH_LAST_KEY, _resetHadithLast } from '../../src/utils/hadithLastRead.js'
import { buildContinueItems, continueHref } from '../../src/utils/continueItems.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

function mem(init = {}) {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m,
  }
}

describe('hədis — son oxunan yer', () => {
  beforeEach(() => _resetHadithLast())

  it('kitabxana və sayt hədisi yazılır, oxunur; açar ehtiyat nüsxəyə (və sinxronizasiyaya) düşür', () => {
    const s = mem()
    expect(recordHadithRead({ src: 'lib', book: 'bukhari', sec: 3, n: 25, lang: 'az' }, { storage: s, immediate: true, now: 1000 })).toBe(true)
    expect(readHadithLast(s)).toEqual({ src: 'lib', book: 'bukhari', sec: 3, n: 25, lang: 'az', at: 1000 })
    recordHadithRead({ src: 'site', id: 412, lang: 'en' }, { storage: s, immediate: true, now: 2000 })
    expect(readHadithLast(s)).toEqual({ src: 'site', id: 412, lang: 'en', at: 2000 })
    expect(isBackupKey(HADITH_LAST_KEY)).toBe(true)
  })

  it('eyni hədis təkrar yazılmır; pozuq giriş rədd edilir', () => {
    const s = mem()
    recordHadithRead({ src: 'site', id: 7, lang: 'az' }, { storage: s, immediate: true })
    expect(recordHadithRead({ src: 'site', id: 7, lang: 'az' }, { storage: s, immediate: true })).toBe(false)
    expect(recordHadithRead({ src: 'lib', book: '../x', sec: 1, n: 1 }, { storage: s, immediate: true })).toBe(false)
    expect(recordHadithRead({ src: 'site', id: 'abc' }, { storage: s, immediate: true })).toBe(false)
    expect(cleanHadithEntry({ src: 'evil' })).toBeNull()
    s.setItem(HADITH_LAST_KEY, '{pozuq')
    expect(readHadithLast(s)).toBeNull()
  })

  it('ardıcıl açılışlarda yalnız sonuncu, gecikmə ilə yazılır (perf)', async () => {
    const s = mem()
    recordHadithRead({ src: 'site', id: 1, lang: 'az' }, { storage: s })
    recordHadithRead({ src: 'site', id: 2, lang: 'az' }, { storage: s })
    recordHadithRead({ src: 'site', id: 3, lang: 'az' }, { storage: s })
    expect(s.getItem(HADITH_LAST_KEY)).toBeNull()
    await new Promise((r) => setTimeout(r, 800))
    expect(readHadithLast(s).id).toBe(3)
  })
})

describe('buildContinueItems', () => {
  const pathFor = (key, lang, param) => `${lang === 'az' ? '' : '/' + lang}/${key}${param != null ? '/' + param : ''}`

  it('boş yaddaş → boş siyahı; storage yoxdur → boş', () => {
    expect(buildContinueItems(mem())).toEqual([])
    expect(buildContinueItems(null)).toEqual([])
  })

  it('bütün mənbələr; vaxtı bilinənlər əvvəl (ən təzəsi), hər element dəqiq yerə aparır', () => {
    const s = mem({
      quran_bookmark: JSON.stringify({ surah: 2, ayah: 255, name: 'Bəqərə', time: 5000 }),
      mushaf_last_page: '42',
      muslim_cc_hadith_last: JSON.stringify({ src: 'lib', book: 'muslim', sec: 1, n: 8, lang: 'az', at: 9000 }),
      arabic_course_v1: JSON.stringify({ best: { letters: 90, harakat: 40 }, last: 'harakat' }),
      learn_progress_v1: JSON.stringify({ last: 'wudu', read: ['a', 'b'] }),
      hifz_progress: JSON.stringify({ 1: 2, 112: 2, 2: 1, 999: 2 }),
      'hajjguide:last': JSON.stringify({ mode: 'umrah', step: 2 }),
      muslim_cc_storybooks: JSON.stringify({ adam: 3, nuh: 1, __last: 'nuh' }),
      dhikr_session: JSON.stringify({ selIdx: 0, count: 17 }),
    })
    const items = buildContinueItems(s)
    expect(items.map((i) => i.key)).toEqual(['hadith', 'quran', 'mushaf', 'arabic', 'lesson', 'hifz', 'hajj', 'story', 'dhikr'])
    const href = Object.fromEntries(items.map((i) => [i.key, continueHref(i, pathFor, 'en')]))
    expect(href).toEqual({
      hadith: '/en/hadithbooks#muslim/1/8',
      quran: '/en/quran/2?a=255',
      mushaf: '/en/mushaf?p=42',
      arabic: '/en/arabic#harakat',
      lesson: '/en/learn/wudu',
      hifz: '/en/hifz',
      hajj: '/en/hajjguide?resume=1',
      story: '/en/kids?section=books&book=nuh',
      dhikr: '/en/dhikr',
    })
    const by = Object.fromEntries(items.map((i) => [i.key, i.vars]))
    expect(by.hifz).toEqual({ memorized: 2, inProgress: 1 })          // 999 sayılmır
    expect(by.arabic.done).toBe(1)
    expect(by.hajj).toEqual({ mode: 'umrah', step: 3 })
    expect(by.story).toEqual({ book: 'nuh', page: 2 })
  })

  it('sayt hədisi /hadith/<id>; ayəsiz surə; pozuq dəyərlər nəzərə alınmır', () => {
    const s = mem({
      quran_bookmark: JSON.stringify({ surah: 36 }),
      muslim_cc_hadith_last: JSON.stringify({ src: 'site', id: 12, lang: 'az', at: 1 }),
      mushaf_last_page: '9999',
      dhikr_session: '{"count":0}',
      'hajjguide:last': '{"mode":"x","step":1}',
      arabic_course_v1: '[1,2]',
      hifz_progress: 'pozuq',
    })
    const items = buildContinueItems(s)
    expect(items.map((i) => i.key)).toEqual(['hadith', 'quran'])
    expect(continueHref(items[0], pathFor, 'az')).toBe('/hadith/12')
    expect(continueHref(items[1], pathFor, 'az')).toBe('/quran/36')
  })
})
