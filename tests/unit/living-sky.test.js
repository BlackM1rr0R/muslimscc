import { describe, it, expect } from 'vitest'
import { skyAt } from '../../src/utils/livingSky'

const T = { fajr: '05:10', sunrise: '06:45', dhuhr: '12:20', asr: '15:40', maghrib: '17:55', isha: '19:25' }
const m = (s) => { const [h, mm] = s.split(':').map(Number); return h * 60 + mm }

describe('livingSky.skyAt', () => {
  it('fazalar namaz vaxtlarına görə', () => {
    expect(skyAt(m('03:00'), T).phase).toBe('night')
    expect(skyAt(m('05:30'), T).phase).toBe('fajr')
    expect(skyAt(m('07:00'), T).phase).toBe('sunrise')
    expect(skyAt(m('12:00'), T).phase).toBe('day')
    expect(skyAt(m('16:00'), T).phase).toBe('asr')
    expect(skyAt(m('17:40'), T).phase).toBe('maghrib')
    expect(skyAt(m('18:40'), T).phase).toBe('isha')
    expect(skyAt(m('22:00'), T).phase).toBe('night')
  })
  it('günəş şərqdən çıxır, günorta yuxarıda, qərbdə batır', () => {
    const rise = skyAt(m('06:45'), T), noon = skyAt(m('12:20'), T), set = skyAt(m('17:55'), T)
    expect(rise.x).toBeLessThan(15)
    expect(rise.y).toBeGreaterThan(85)
    expect(noon.y).toBeLessThan(5)
    expect(noon.x).toBeGreaterThan(40)
    expect(noon.x).toBeLessThan(60)
    expect(set.x).toBeGreaterThan(85)
  })
  it('vaxtlar boşdursa — sakit gündüz', () => {
    expect(skyAt(600, {}).phase).toBe('day')
  })
})

describe('HeroGreeting.partOfDay', async () => {
  const { partOfDay } = await import('../../src/utils/greeting.js')
  it('səma fazası + saat → arzu', () => {
    expect(partOfDay('fajr', 6)).toBe('morning')
    expect(partOfDay('day', 13)).toBe('day')
    expect(partOfDay('maghrib', 17)).toBe('evening')
    expect(partOfDay('night', 19)).toBe('evening')
    expect(partOfDay('night', 23)).toBe('night')
    expect(partOfDay('', 9)).toBe('morning')
  })
})
