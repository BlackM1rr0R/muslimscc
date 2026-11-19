// /on-the-road — geri sayım, xatırlatma, səs seçimi, tərcihlər (utils/roadMode), birləşdirici
import { describe, it, expect } from 'vitest'
import {
  countdownParts, countdownClock, minutesLeft, reminderDue, voiceFor, sanitizeRoad, readRoad, writeRoad, resumePoint,
  ROAD_KEY, DEFAULT_ROAD,
} from '../../src/utils/roadMode.js'
import { runMerger } from '../../src/utils/syncMergers.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}
const S = 1000, MIN = 60 * S, H = 60 * MIN

describe('geri sayım', () => {
  it('hissələr və iri rəqəmlər', () => {
    expect(countdownParts(H + 5 * MIN + 9 * S + 400)).toEqual({ h: 1, m: 5, s: 9 })
    expect(countdownClock(H + 5 * MIN + 9 * S)).toBe('1:05:09')
    expect(countdownClock(25 * MIN + 9 * S)).toBe('25:09')
    expect(countdownClock(9 * S)).toBe('00:09')
    expect(countdownClock(-3000)).toBe('00:00')
    expect(countdownClock(NaN)).toBe('00:00')
  })
  it('dəqiqələr yuxarı yuvarlanır (səsli cümlə üçün)', () => {
    expect(minutesLeft(24 * MIN + 10 * S)).toBe(25)
    expect(minutesLeft(25 * MIN)).toBe(25)
    expect(minutesLeft(1)).toBe(1)
    expect(minutesLeft(0)).toBe(0)
    expect(minutesLeft(-MIN)).toBe(0)
  })
})

describe('namaz xatırlatması', () => {
  const next = { key: 'asr', at: 10 * H }
  it('yalnız N dəqiqəlik pəncərədə, hər namaz üçün bir dəfə', () => {
    expect(reminderDue(next, 10 * H - 11 * MIN, 10)).toBe(null)
    const k = reminderDue(next, 10 * H - 10 * MIN, 10)
    expect(k).toBe(`asr@${10 * H}`)
    expect(reminderDue(next, 10 * H - 9 * MIN, 10, k)).toBe(null)
    // vaxt keçib — xatırlatma yox
    expect(reminderDue(next, 10 * H + 1, 10)).toBe(null)
  })
  it('söndürülüb və ya məlumat yoxdur', () => {
    expect(reminderDue(next, 10 * H - MIN, 0)).toBe(null)
    expect(reminderDue(null, 0, 10)).toBe(null)
    expect(reminderDue({ key: 'asr', at: NaN }, 0, 10)).toBe(null)
  })
})

describe('səs seçimi (nitq sintezi yalnız UI faktları üçün)', () => {
  const voices = [
    { lang: 'en-US', localService: true }, { lang: 'ru-RU', localService: false }, { lang: 'tr_TR', localService: true },
    { lang: 'ar-EG', localService: true },
  ]
  it('tam kod → dil prefiksi; uyğun səs yoxdursa null (başqa dilin səsi götürülmür)', () => {
    expect(voiceFor(voices, 'en').lang).toBe('en-US')
    expect(voiceFor(voices, 'ru').lang).toBe('ru-RU')
    expect(voiceFor(voices, 'tr').lang).toBe('tr_TR')
    expect(voiceFor(voices, 'ar').lang).toBe('ar-EG')
    expect(voiceFor(voices, 'az')).toBe(null)
    expect(voiceFor([], 'en')).toBe(null)
    expect(voiceFor(voices, 'id')).toBe(null)
  })
})

describe('tərcihlər və "davam et" nöqtəsi', () => {
  it('təmizlənir: tanınmayan dəyərlər standarta düşür', () => {
    expect(sanitizeRoad(null)).toEqual(DEFAULT_ROAD)
    expect(sanitizeRoad({ remind: 7, speak: 'yes', light: true, snd: false, s: 115, a: 3, d: 99, c: -1 }, 10))
      .toEqual({ ...DEFAULT_ROAD, light: true, snd: false })
    // Fatihədə 7 ayə var
    expect(sanitizeRoad({ s: 1, a: 9 })).toMatchObject({ s: 1, a: 1 })
    expect(sanitizeRoad({ s: 36, a: 12, remind: 15 })).toMatchObject({ s: 36, a: 12, remind: 15 })
  })
  it('yazılır/oxunur; pozuq JSON səhifəni çökdürmür', () => {
    const st = mem({ [ROAD_KEY]: '{x' })
    expect(readRoad(st)).toEqual(DEFAULT_ROAD)
    writeRoad({ s: 18, a: 10, speak: true }, st)
    expect(readRoad(st)).toMatchObject({ s: 18, a: 10, speak: true, remind: 10 })
  })
  it('davam et: əvvəl bu rejimin yeri, sonra Quran əlfəcini', () => {
    const st = mem({ quran_bookmark: JSON.stringify({ surah: 36, ayah: 12, name: 'Yasin', time: 1 }) })
    expect(resumePoint({ s: 18, a: 10 }, st)).toEqual({ s: 18, a: 10 })
    expect(resumePoint({ s: 0 }, st)).toEqual({ s: 36, a: 12 })
    expect(resumePoint({ s: 0 }, mem({ quran_bookmark: '{bad' }))).toBe(null)
    expect(resumePoint({ s: 0 }, mem())).toBe(null)
  })
  it('sinxron: hər iki cihaz dəyişibsə bu cihazınkı; pozuq JSON — ziddiyyət', () => {
    const l = JSON.stringify({ ...DEFAULT_ROAD, remind: 5 })
    const r = JSON.stringify({ ...DEFAULT_ROAD, remind: 20 })
    expect(JSON.parse(runMerger(ROAD_KEY, l, r, undefined)).remind).toBe(5)
    expect(JSON.parse(runMerger(ROAD_KEY, undefined, r, undefined)).remind).toBe(20)
    expect(typeof runMerger(ROAD_KEY, '{bad', r, undefined)).toBe('symbol')
  })
})
