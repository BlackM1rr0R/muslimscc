// Ayə qeydləri (utils/quranNotes) — təmizləmə, yazma/silmə, süzgəc və axtarış
import { describe, it, expect } from 'vitest'
import { NOTES_KEY, sanitizeNotes, setNote, removeNote, listNotes, countByColor, readNotes, writeNotes, parseNoteKey } from '../../src/utils/quranNotes.js'

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
    expect(m['1:2']).toEqual({ c: 'green', t: 'Həmd', u: 10, w: 'ٱلْحَمْدُ', p: 1 })
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
