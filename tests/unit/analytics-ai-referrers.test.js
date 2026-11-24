// GEO: AI köməkçilərindən gələn keçidlər (server/analytics.js → aiReferrers, totals.aiVisits)
import { describe, it, expect } from 'vitest'
import { require } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const A = require('../../server/analytics.js')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

describe('AI referrer-ləri', () => {
  it('isAiReferrer: məlum köməkçilər və alt domenləri; adi saytlar yox', () => {
    for (const h of ['chatgpt.com', 'perplexity.ai', 'gemini.google.com', 'copilot.microsoft.com', 'claude.ai', 'm.perplexity.ai']) {
      expect(A.isAiReferrer(h)).toBe(true)
    }
    for (const h of ['google.com', 'bing.com', 'notchatgpt.com', 'fakeperplexity.ai', null, '']) expect(A.isAiReferrer(h)).toBe(false)
    // referrerDomain www. atır — siyahı da www-siz yazılıb
    expect(A.isAiReferrer(A.referrerDomain('https://www.perplexity.ai/search?q=x'))).toBe(true)
  })

  it('stats: aiReferrers top-N limitindən asılı deyil, totals.aiVisits cəmdir', () => {
    const db = openDb(':memory:')
    const t = Date.parse('2026-11-20T10:00:00Z')
    const an = A.createAnalytics({ db, now: () => t })
    let ip = 1
    const hit = (ref, n) => { for (let i = 0; i < n; i++) an.record({ ip: `10.0.0.${ip++}`, ua: UA, path: '/quran', lang: 'en', ref }) }
    hit('google.com', 5)
    hit('chatgpt.com', 3)
    hit('perplexity.ai', 1)
    const s = an.stats({ from: '2026-11-20', to: '2026-11-20', limit: 1 })
    expect(s.referrers).toEqual([{ key: 'google.com', count: 5 }])
    expect(s.aiReferrers).toEqual([{ key: 'chatgpt.com', count: 3 }, { key: 'perplexity.ai', count: 1 }])
    expect(s.totals.aiVisits).toBe(4)
  })
})
