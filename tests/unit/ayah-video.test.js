// Ayədən video (utils/ayahVideo) — format seçimi və sözlərin sətirlərə bölünməsi
import { describe, it, expect } from 'vitest'
import { pickMime, layoutWords } from '../../src/utils/ayahVideo.js'

describe('ayahVideo', () => {
  it('mp4 dəstəklənirsə mp4, yoxsa webm, heç biri — null', () => {
    expect(pickMime(t => t.startsWith('video/mp4'))).toMatch(/^video\/mp4/)
    expect(pickMime(t => t === 'video/webm')).toBe('video/webm')
    expect(pickMime(() => false)).toBeNull()
  })
  it('sözlər eni aşanda yeni sətrə keçir', () => {
    const lines = layoutWords([300, 300, 300, 200], 700, 20)
    expect(lines.map(l => l.words)).toEqual([[0, 1], [2, 3]])
    expect(lines[0].width).toBe(620)
    expect(layoutWords([900], 700, 20)).toEqual([{ words: [0], width: 900 }])
  })
})
