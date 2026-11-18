// J2: sevimli qari — bütün Quran pleyerlərinin susmaya görə qarisi (utils/quranAudio → readAudioPrefs)
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'

const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)) },
  removeItem: (k) => { mem.delete(k) },
}
const { favoriteReciter, setFavoriteReciter, readAudioPrefs, writeAudioPrefs, previewSources, ayahSources, DEFAULT_RECITER, AUDIO_PREFS_KEY } = await import('../../src/utils/quranAudio.js')

beforeEach(() => mem.clear())

describe('sevimli qari', () => {
  it('susmaya görə əl-Əfasi; seçim pleyer ayarlarına yazılır (sürət, təkrar qalır)', () => {
    expect(favoriteReciter()).toBe(DEFAULT_RECITER)
    writeAudioPrefs({ reciter: 'alafasy', rate: 1.25, repeat: 3, autoNext: true })
    expect(setFavoriteReciter('sudais')).toBe('sudais')
    expect(readAudioPrefs()).toEqual({ reciter: 'sudais', rate: 1.25, repeat: 3, autoNext: true })
    expect(JSON.parse(mem.get(AUDIO_PREFS_KEY)).reciter).toBe('sudais')
  })
  it('naməlum qari qəbul olunmur', () => {
    setFavoriteReciter('husary')
    expect(setFavoriteReciter('nobody')).toBe('husary')
  })
  it('önizləmə və ayə ünvanları seçilən qarinindir', () => {
    setFavoriteReciter('sudais')
    expect(previewSources('sudais')[0]).toContain('ar.abdurrahmaansudais/1.mp3')
    expect(ayahSources(favoriteReciter(), { g: 262, s: 2, a: 255 })[0]).toContain('ar.abdurrahmaansudais/262.mp3')
  })
  it('pleyerlər susmaya görə qarini readAudioPrefs-dən götürür', () => {
    for (const f of ['src/components/QuranPlayer.jsx', 'src/components/AyahAudio.jsx', 'src/components/quran/OfflineAudio.jsx',
      'src/components/quran/QuranRadio.jsx', 'src/pages/HifzPage.jsx']) {
      expect(readFileSync(f, 'utf8'), f).toMatch(/useState\(readAudioPrefs\)|readAudioPrefs\(\)/)
    }
  })
})
