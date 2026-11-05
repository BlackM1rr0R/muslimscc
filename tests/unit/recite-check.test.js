// Səsli hifz yoxlaması (utils/reciteCheck) — normallaşdırma və düzülüş
import { describe, it, expect } from 'vitest'
import { normAr, alignRecitation, sameWord } from '../../src/utils/reciteCheck.js'

const IKHLAS = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ'

describe('reciteCheck', () => {
  it('hərəkə və əlif növləri atılır', () => {
    expect(normAr('ٱللَّهُ أَحَدٌ')).toBe('الله احد')
    expect(normAr('رَحْمَةٌ')).toBe('رحمه')
  })
  it('tam oxunuş — hamısı ok', () => {
    const r = alignRecitation(IKHLAS, 'قل هو الله احد الله الصمد لم يلد ولم يولد ولم يكن له كفوا احد')
    expect(r.score).toBe(1)
  })
  it('buraxılmış söz miss olur, qalanı ok', () => {
    const r = alignRecitation(IKHLAS, 'قل هو الله احد الله الصمد لم يلد ولم يكن له كفوا احد')
    expect(r.marks.filter(x => x === 'miss')).toHaveLength(2) // "ولم يولد"dan biri + ardıcıllıq
    expect(r.score).toBeGreaterThan(0.8)
  })
  it('kiçik tanıma xətasına dözür, fərqli söz qəbul edilmir', () => {
    expect(sameWord('الصمد', 'الصمت')).toBe(true)
    expect(sameWord('لم', 'لن')).toBe(false)
    expect(alignRecitation(IKHLAS, '').score).toBe(0)
  })
})
