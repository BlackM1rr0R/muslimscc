// utils/scriptableWidget — iPhone vidcet skripti: sintaksis və Scriptable API-nin saxta mühitində işləməsi
import { describe, it, expect } from 'vitest'
import { buildScriptableWidget, widgetJsonUrl } from '../../src/utils/scriptableWidget.js'

// Scriptable API-nin kifayət qədər saxta versiyası: hər obyekt istənilən metodu qəbul edir
function fakeNode(log) {
  const node = {
    texts: [], dates: [], stacks: [],
    addStack: () => { const s = fakeNode(log); node.stacks.push(s); return s },
    addText: (t) => { log.push(String(t)); const o = {}; node.texts.push(o); return o },
    addDate: (d) => { log.push('DATE:' + d.toISOString()); const o = { applyTimerStyle() { o.timer = true } }; node.dates.push(o); return o },
    addImage: () => ({}),
    addSpacer: () => ({}),
    layoutVertically() {}, layoutHorizontally() {}, centerAlignContent() {}, setPadding() {},
  }
  return node
}

async function run(script, { family, json, fail = false }) {
  const log = []
  const out = {}
  const env = {
    config: { widgetFamily: family, runsInWidget: true },
    Request: class { constructor(u) { out.url = u } async loadJSON() { if (fail) throw new Error('offline'); return json } },
    FileManager: { local: () => ({ joinPath: (a, b) => `${a}/${b}`, cacheDirectory: () => '/c', writeString() {}, fileExists: () => false, readString: () => '' }) },
    ListWidget: class { constructor() { Object.assign(this, fakeNode(log)) } presentMedium() {} },
    LinearGradient: class {},
    Color: Object.assign(class { constructor(h, a) { this.h = h; this.a = a } }, { white: () => ({}) }),
    Font: new Proxy({}, { get: () => () => ({}) }),
    Size: class { constructor(w, h) { this.w = w; this.h = h } },
    SFSymbol: { named: () => ({ applyFont() {}, image: {} }) },
    Script: { setWidget: (w) => { out.widget = w }, complete() {} },
  }
  const fn = new Function(...Object.keys(env), `return (async () => {\n${script}\n})()`)
  await fn(...Object.values(env))
  return { log, out }
}

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date())
const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date(Date.now() + 864e5))
const json = {
  city: 'Bakı', tz: 'Asia/Baku', lang: 'az',
  names: { fajr: 'Sübh', dhuhr: 'Zöhr', asr: 'Əsr', maghrib: 'Məğrib', isha: 'İşa' },
  days: [
    { date: today, times: { fajr: '00:01', dhuhr: '00:02', asr: '00:03', maghrib: '00:04', isha: '00:05' } },
    { date: tomorrow, times: { fajr: '06:10', dhuhr: '12:20', asr: '15:00', maghrib: '17:20', isha: '18:50' } },
  ],
}

describe('scriptableWidget', () => {
  const url = 'https://muslims.cc/api/prayer.json?lat=40.4093&lng=49.8671&tz=Asia%2FBaku&method=99&lang=az&city=Bak%C4%B1'
  const script = buildScriptableWidget({ url, lang: 'az' })

  it('ics URL-i JSON URL-inə çevrilir', () => {
    expect(widgetJsonUrl('https://x/api/prayer.ics?lat=1')).toBe('https://x/api/prayer.json?lat=1')
  })

  it('sintaksis düzgündür, URL skriptdədir', () => {
    expect(() => new Function(`return (async () => {\n${script}\n})`)).not.toThrow()
    expect(script).toContain(JSON.stringify(url))
  })

  for (const family of ['small', 'medium', 'large', 'accessoryRectangular', 'accessoryCircular']) {
    it(`${family}: növbəti namaz sabahın sübhüdür (bu günün vaxtları keçib)`, async () => {
      const { log, out } = await run(script, { family, json })
      expect(out.url).toBe(url)
      expect(out.widget).toBeTruthy()
      expect(log.join('|')).toContain('06:10')
      if (family !== 'accessoryCircular') expect(log.join('|')).toContain('Sübh')
      if (family === 'medium' || family === 'large') {
        expect(log).toContain('Məğrib')
        expect(log).toContain('00:04')   // bu günün cədvəli
      }
      // yenilənmə növbəti azandan bir dəqiqə sonra
      expect(out.widget.refreshAfterDate.getTime()).toBeGreaterThan(Date.now())
    })
  }

  it('internet və keş yoxdursa — xəta mətni', async () => {
    const { log } = await run(script, { family: 'medium', json: null, fail: true })
    expect(log).toContain('Namaz vaxtları yüklənmədi')
  })
})
