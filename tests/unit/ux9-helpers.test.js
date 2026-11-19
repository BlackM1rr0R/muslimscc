// UX-9: yuxu taymeri köməkçiləri (SleepTimer), səsli oxunun səs seçimi (ListenButton),
// əkiz ayələr sayğacı (utils/mutashabihat), bayram kartının palitraları (utils/eidCard).
import { describe, it, expect } from 'vitest'
import { sleepLeftMin, sleepProgress } from '../../src/utils/sleepTimer.js'
import { pickVoice, bcp47 } from '../../src/utils/ttsVoice.js'
import { twinCount } from '../../src/utils/mutashabihat.js'
import { EID_PALETTES } from '../../src/utils/eidCard.js'

describe('yuxu taymeri', () => {
  const now = 1_000_000
  it('qalan dəqiqə — yuxarı yuvarlanır, vaxt keçəndə 1 (ayənin sonu gözlənir)', () => {
    expect(sleepLeftMin({ mode: 'min', at: now + 29.2 * 60000 }, now)).toBe(30)
    expect(sleepLeftMin({ mode: 'min', at: now - 5000 }, now)).toBe(1)
    expect(sleepLeftMin({ mode: 'surah' }, now)).toBe(0)
    expect(sleepLeftMin(null, now)).toBe(0)
  })
  it('irəliləyiş 0…1 — dəqiqə rejimində vaxtla, surə rejimində ayə ilə', () => {
    const sl = { mode: 'min', from: now, at: now + 600000 }
    expect(sleepProgress(sl, { now })).toBe(0)
    expect(sleepProgress(sl, { now: now + 300000 })).toBeCloseTo(0.5)
    expect(sleepProgress(sl, { now: now + 900000 })).toBe(1)
    expect(sleepProgress({ mode: 'surah', from: now }, { current: 5, total: 10 })).toBeCloseTo(0.5)
    expect(sleepProgress(null)).toBe(0)
  })
})

describe('səsli oxu: səs seçimi BCP-47 ilə', () => {
  const voices = [
    { lang: 'en-US', localService: true }, { lang: 'de-DE', localService: true },
    { lang: 'fr-FR', localService: false }, { lang: 'ar-SA', localService: true },
  ]
  it('5 əsas dil xəritədə, əlavə dillər olduğu kimi', () => {
    expect(bcp47('az')).toBe('az-AZ')
    expect(bcp47('ru')).toBe('ru-RU')
    expect(bcp47('de')).toBe('de')
    expect(bcp47('pt-BR')).toBe('pt-BR')
  })
  it('əlavə dillərin (de, fr) səsi tapılır; olmayan dil — null', () => {
    expect(pickVoice(voices, bcp47('de')).lang).toBe('de-DE')
    expect(pickVoice(voices, bcp47('fr')).lang).toBe('fr-FR')
    expect(pickVoice(voices, bcp47('az'))).toBe(null)
  })
})

describe('əkiz ayələr və bayram kartı', () => {
  it('twinCount', () => {
    const d = { pairs: { '2:48': [['2:123', 79]], '1:2': [['6:45', 60], ['37:182', 70]] } }
    expect(twinCount(d, '2:48')).toBe(1)
    expect(twinCount(d, '1:2')).toBe(2)
    expect(twinCount(d, '3:1')).toBe(0)
    expect(twinCount(null, '2:48')).toBe(0)
  })
  it('3 sakit palitra, hər birində eyni sahələr', () => {
    const keys = Object.keys(EID_PALETTES.night).sort()
    expect(Object.keys(EID_PALETTES)).toEqual(['night', 'dawn', 'ink'])
    for (const p of Object.values(EID_PALETTES)) expect(Object.keys(p).sort()).toEqual(keys)
  })
})
