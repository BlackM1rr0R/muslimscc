// Ayə qeydləri (utils/quranNotes) — təmizləmə, yazma/silmə, süzgəc və axtarış
import { describe, it, expect } from 'vitest'
import { NOTES_KEY, sanitizeNotes, setNote, removeNote, listNotes, countByColor, readNotes, writeNotes, parseNoteKey, exportNotes, restoreVersion, notesFileName, HISTORY_MAX } from '../../src/utils/quranNotes.js'

const mem = () => {
  const m = new Map()
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }
}

describe('parseNoteKey / sanitizeNotes', () => {
  it('açar yoxlanır', () => {
    expect(parseNoteKey('2:255')).toEqual({ s: 2, a: 255 })
    expect(parseNoteKey('115:1')).toBe(null)
    expect(parseNoteKey('x')).toBe(null)
  })
  it('pozuq yazılar atılır, mətn qısaldılır', () => {
    const n = sanitizeNotes({ '2:255': { c: 'gold', t: 'a'.repeat(3000), u: 5 }, '1:1': { c: 'pink', t: '' }, bad: { c: 'gold' }, '3:1': null })
    expect(Object.keys(n)).toEqual(['2:255'])
    expect(n['2:255'].t.length).toBe(2000)
    expect(sanitizeNotes([])).toEqual({})
  })
})

describe('setNote / removeNote', () => {
  it('yazır, yeniləyir və boş olanda silir', () => {
    let m = setNote({}, '1:2', { c: 'green', t: 'Həmd', w: 'ٱلْحَمْدُ', p: 1 }, 10)
    expect(m['1:2']).toEqual({ c: 'green', t: 'Həmd', u: 10, d: 10, w: 'ٱلْحَمْدُ', p: 1 })
    m = setNote(m, '1:2', { c: '', t: '  ' }, 20)
    expect(m).toEqual({})
    m = setNote(m, '9:999', { c: 'gold' })
    expect(m).toEqual({})
  })
  it('removeNote yeni obyekt qaytarır', () => {
    const a = { '1:1': { c: 'gold', t: '', u: 1 } }
    const b = removeNote(a, '1:1')
    expect(b).toEqual({}); expect(a['1:1']).toBeTruthy()
    expect(removeNote(b, '1:1')).toBe(b)
  })
})

describe('listNotes / countByColor', () => {
  const map = {
    '2:255': { c: 'gold', t: 'Ayətul-Kürsi — hər namazdan sonra', u: 30 },
    '1:2': { c: 'green', t: 'Həmd', u: 10, w: 'ٱلْحَمْدُ' },
    '112:1': { c: 'gold', t: '', u: 20 },
  }
  it('ən yeni əvvəldə', () => { expect(listNotes(map).map(n => n.key)).toEqual(['2:255', '112:1', '1:2']) })
  it('rəngə görə süzgəc', () => { expect(listNotes(map, { color: 'gold' }).map(n => n.key)).toEqual(['2:255', '112:1']) })
  it('axtarış: mətn, hərəkəsiz ərəb sözü, istinad, surə adı', () => {
    expect(listNotes(map, { q: 'KÜRSİ' }).map(n => n.key)).toEqual(['2:255'])
    expect(listNotes(map, { q: 'الحمد' }).map(n => n.key)).toEqual(['1:2'])
    expect(listNotes(map, { q: '112:1' }).map(n => n.key)).toEqual(['112:1'])
    expect(listNotes(map, { q: 'ixlas', nameOf: s => (s === 112 ? 'İxlas' : '') }).map(n => n.key)).toEqual(['112:1'])
  })
  it('rəng sayları', () => { expect(countByColor(map)).toEqual({ gold: 2, green: 1, blue: 0, rose: 0, violet: 0 }) })
})

describe('readNotes / writeNotes', () => {
  it('yaddaşa yazır və oxuyur; boş xəritə açarı silir', () => {
    const s = mem()
    writeNotes({ '1:1': { c: 'blue', t: '', u: 1 } }, s)
    expect(readNotes(s)).toEqual({ '1:1': { c: 'blue', t: '', u: 1 } })
    writeNotes({}, s)
    expect(s.m.has(NOTES_KEY)).toBe(false)
    s.setItem(NOTES_KEY, '{pozuq')
    expect(readNotes(s)).toEqual({})
  })
})

describe('dəftər: yazılma günü, tarixçə, sıralama, ixrac (vB)', () => {
  it('ilk yazılma günü (d) qalır, mətn dəyişəndə köhnəsi tarixçəyə düşür', () => {
    let m = setNote({}, '2:255', { c: 'gold', t: 'bir' }, 100)
    m = setNote(m, '2:255', { c: 'gold', t: 'iki' }, 200)
    expect(m['2:255']).toMatchObject({ t: 'iki', d: 100, u: 200, h: [{ t: 'bir', u: 100 }] })
    // yalnız rəng dəyişəndə tarixçə böyümür
    m = setNote(m, '2:255', { c: 'blue', t: 'iki' }, 300)
    expect(m['2:255'].h).toHaveLength(1)
    expect(m['2:255'].d).toBe(100)
  })
  it('tarixçə ≤ HISTORY_MAX və ölçüsü məhduddur', () => {
    let m = {}
    for (let i = 0; i < 8; i++) m = setNote(m, '1:1', { t: `v${i}` }, i + 1)
    expect(m['1:1'].h.length).toBe(HISTORY_MAX)
    expect(m['1:1'].h[0].t).toBe('v6')
    let big = setNote({}, '1:2', { t: 'a'.repeat(2000) }, 1)
    big = setNote(big, '1:2', { t: 'b'.repeat(2000) }, 2)
    big = setNote(big, '1:2', { t: 'c' }, 3)
    expect(big['1:2'].h.map(x => x.t.length)).toEqual([2000])
  })
  it('bərpa: əvvəlki versiya cari olur, cari tarixçəyə düşür', () => {
    let m = setNote({}, '3:1', { t: 'köhnə' }, 1)
    m = setNote(m, '3:1', { t: 'yeni' }, 2)
    m = restoreVersion(m, '3:1', 0, 3)
    expect(m['3:1'].t).toBe('köhnə')
    expect(m['3:1'].h.map(x => x.t)).toEqual(['yeni'])
    expect(restoreVersion(m, '3:1', 9)).toBe(m)
  })
  it('surə sırası ilə sıralama', () => {
    const map = { '2:255': { c: 'gold', t: 'a', u: 30 }, '1:2': { c: '', t: 'b', u: 10 }, '2:3': { c: '', t: 'c', u: 50 } }
    expect(listNotes(map, { sort: 'surah' }).map(n => n.key)).toEqual(['1:2', '2:3', '2:255'])
    expect(listNotes(map).map(n => n.key)).toEqual(['2:3', '2:255', '1:2'])
  })
  it('Markdown və mətn ixracı', () => {
    const d = new Date(2026, 0, 5, 10).getTime(), u = new Date(2026, 1, 7, 10).getTime()
    const list = listNotes({ '2:255': { c: 'gold', t: 'Kürsi', u, d, w: 'ٱللَّهُ' } })
    const md = exportNotes(list, 'md', { title: 'Dəftər', labelOf: () => 'Bəqərə, 255', colorName: () => 'Qızılı', wrote: 'Yazılıb', edited: 'Dəyişib' })
    expect(md).toContain('# Dəftər')
    expect(md).toContain('## Bəqərə, 255 (2:255)')
    expect(md).toContain('*Qızılı · Yazılıb: 2026-01-05 · Dəyişib: 2026-02-07*')
    expect(md).toContain('> ٱللَّهُ')
    expect(md).toContain('Kürsi')
    const txt = exportNotes(list, 'txt', { title: 'Dəftər' })
    expect(txt.startsWith('Dəftər\n')).toBe(true)
    expect(txt).not.toContain('##')
    expect(notesFileName('md', new Date(2026, 10, 17))).toBe('muslims-cc-quran-notes-2026-11-17.md')
    expect(notesFileName('txt', new Date(2026, 10, 17))).toMatch(/\.txt$/)
  })
})
