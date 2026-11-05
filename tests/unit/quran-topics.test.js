// Quranda mövzu axtarışı (data/quranTopics.js)
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { QURAN_TOPICS, topicRoot } from '../../src/data/quranTopics.js'

describe('QURAN_TOPICS', () => {
  const { roots } = JSON.parse(fs.readFileSync('public/data/quran-roots.json', 'utf8'))
  it('hər kök indeksdədir, 5 dildə ad var, köklər təkrarlanmır', () => {
    expect(new Set(QURAN_TOPICS.map(t => t.root)).size).toBe(QURAN_TOPICS.length)
    for (const t of QURAN_TOPICS) {
      expect(roots[t.root], t.root).toBeTruthy()
      for (const l of ['az', 'en', 'ru', 'tr', 'ar']) expect(t.l[l], `${t.root}.${l}`).toBeTruthy()
    }
  })
  it('istənilən dildə ad → kök; birləşmənin hissəsi də tanınır; naməlum — null', () => {
    expect(topicRoot('Səbr')).toBe('صبر')
    expect(topicRoot('patience')).toBe('صبر')
    expect(topicRoot('терпение')).toBe('صبر')
    expect(topicRoot('valideyn')).toBe('ولد')
    expect(topicRoot('الصبر')).toBe('صبر')
    expect(topicRoot('رحم')).toBeNull()
    expect(topicRoot('')).toBeNull()
  })
})
