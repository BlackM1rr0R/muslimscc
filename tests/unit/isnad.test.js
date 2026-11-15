import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { parseIsnad } from '../../src/utils/isnad.js'

const ar = (id) => JSON.parse(fs.readFileSync(`public/data/hadith-full/${id}.json`, 'utf8')).ar

describe('isnad (ravilər zənciri)', () => {
  it('Buxari 8: dörd ravi, adlar mətndən olduğu kimi', () => {
    const c = parseIsnad(ar(1))
    expect(c).toHaveLength(4)
    const plain = (x) => x.replace(/[ً-ٰٟ]/g, '')
    expect(plain(c[0])).toBe('عبيد الله بن موسى')
    expect(plain(c[3])).toBe('ابن عمر')
    for (const n of c) expect(ar(1).includes(n)).toBe(true)
  })
  it('تحويل ("ح") və şübhəli ("كلاهما") zəncirlər göstərilmir', () => {
    expect(parseIsnad('حدثنا أبو بكر حدثنا وكيع عن سفيان ح وحدثنا محمد عن قيس عن طارق قال رسول الله ﷺ')).toBeNull()
    expect(parseIsnad('حدثنا يحيى وعثمان كلاهما عن جرير عن الأعمش عن أبي سفيان عن جابر قال قال رسول الله')).toBeNull()
  })
  it('"قال لعن رسول الله" — "لعن" ravi sayılmır', () => {
    expect(parseIsnad('حدثنا محمد بن الصباح حدثنا هشيم أخبرنا أبو الزبير عن جابر قال لعن رسول الله آكل الربا')).toEqual(['محمد بن الصباح', 'هشيم', 'أبو الزبير', 'جابر'])
  })
  it('generasiya olunmuş bütün zəncirlərdə hər ad mətndə var', () => {
    let n = 0
    for (const f of fs.readdirSync('public/data/hadith-full')) {
      const d = JSON.parse(fs.readFileSync(`public/data/hadith-full/${f}`, 'utf8'))
      if (!d.isnad) continue
      n++
      for (const name of d.isnad) expect(d.ar.replace(/\s+/g, ' ').includes(name.split(' ')[0])).toBe(true)
    }
    expect(n).toBeGreaterThan(900)
  })
})
