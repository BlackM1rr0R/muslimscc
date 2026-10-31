// Təfsir: sanitizer (ağ siyahı), keş (yaddaş + sessionStorage), seçim, xətalar
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  sanitizeTafsirHtml, plainLength, fetchTafsir, getCachedTafsir, clearTafsirCache,
  TAFSIRS, DEFAULT_TAFSIR, tafsirFor, saveTafsirChoice, readTafsirChoices, getTafsir, TafsirError,
} from '../../src/utils/tafsir.js'

function memStorage() {
  const m = new Map()
  return {
    get length() { return m.size },
    key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: k => { m.delete(k) },
    clear: () => m.clear(),
  }
}

const okJson = (text, verses = { '2:255': { id: 262 } }) => ({
  ok: true, status: 200,
  json: async () => ({ tafsir: { resource_id: 169, verses, text } }),
})

beforeEach(() => {
  globalThis.sessionStorage = memStorage()
  globalThis.localStorage = memStorage()
  clearTafsirCache()
})

describe('sanitizeTafsirHtml', () => {
  it('script və style məzmunu ilə silinir', () => {
    const out = sanitizeTafsirHtml('<p>a</p><script>alert(1)</script><style>p{}</style><p>b</p>')
    expect(out).toBe('<p>a</p><p>b</p>')
    expect(out).not.toMatch(/alert|script|style/i)
  })
  it('bağlanmayan <script> sonadək atılır', () => {
    expect(sanitizeTafsirHtml('<p>ok</p><script>steal()')).toBe('<p>ok</p>')
  })
  it('on* atributları, style, href, javascript: atılır', () => {
    const out = sanitizeTafsirHtml('<p onclick="x()" style="color:red">t</p><span onmouseover=\'y()\' class="ar">z</span><a href="javascript:alert(1)">l</a>')
    expect(out).toBe('<p>t</p><span class="tfc-ar">z</span>l')
    expect(out).not.toMatch(/on\w+=|style=|href|javascript/i)
  })
  it('img onerror və iframe — tamamilə yox olur', () => {
    const out = sanitizeTafsirHtml('x<img src=x onerror="alert(1)">y<iframe src="//evil"></iframe>z')
    expect(out).toBe('xyz')
  })
  it('icazəli teqlər qalır: p b i br span[class] h-teqləri', () => {
    const out = sanitizeTafsirHtml('<h2>Başlıq</h2><p lang="ar" class="ar ">x<b>b</b><i>i</i><br/><span class="arabic qpc-hafs">{ﷲ}</span></p><h4>alt</h4>')
    expect(out).toBe('<h3>Başlıq</h3><p lang="ar" class="tfc-ar">x<b>b</b><i>i</i><br><span class="tfc-arabic tfc-qpc-hafs">{ﷲ}</span></p><h4>alt</h4>')
  })
  it('naməlum teq atılır, mətni qalır; tək < qaçırılır', () => {
    expect(sanitizeTafsirHtml('<div><font>söz</font></div> 3 < 5')).toBe('söz 3 &lt; 5')
  })
  it('sinif adında təhlükəli simvol olan sinif atılır, qalanları önəklənir', () => {
    expect(sanitizeTafsirHtml('<span class="ok x&quot;y">t</span>')).toBe('<span class="tfc-ok">t</span>')
  })
  it('qarışdırılmış hiylə: <scr<script>ipt> və şərh', () => {
    const out = sanitizeTafsirHtml('<scr<script>ipt>alert(1)</script><!-- <script>x</script> -->ok')
    expect(out).not.toMatch(/<script/i)
    expect(out).toContain('ok')
  })
  it('boş / null giriş', () => {
    expect(sanitizeTafsirHtml(null)).toBe('')
    expect(sanitizeTafsirHtml('')).toBe('')
  })
})

describe('plainLength', () => {
  it('teqsiz uzunluq', () => {
    expect(plainLength('<p>abc</p> <b>de</b>')).toBe(6)
  })
})

describe('kataloq və seçim', () => {
  it('yalnız Sələf təfsirləri — Qurtubi, Vəsit, Məarif, Zilal yoxdur', () => {
    const ids = TAFSIRS.map(t => t.id)
    expect(ids.sort((a, b) => a - b)).toEqual([14, 15, 16, 91, 94, 169, 170])
    for (const bad of [90, 93, 168, 157, 817, 159]) expect(getTafsir(bad)).toBeNull()
  })
  it('hər təfsirin 5 dildə adı və müəllifi var', () => {
    for (const t of TAFSIRS) for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
      expect(t.name[l], `${t.id} name ${l}`).toBeTruthy()
      expect(t.by[l], `${t.id} by ${l}`).toBeTruthy()
    }
  })
  it('susmaya görə: ar → Müyəssər, en → İbn Kəsir, ru → əs-Sədi', () => {
    expect(tafsirFor('ar', {})).toBe(16)
    expect(tafsirFor('en', {})).toBe(169)
    expect(tafsirFor('ru', {})).toBe(170)
    expect(DEFAULT_TAFSIR.az).toBeTruthy()
  })
  it('seçim localStorage-da dil üzrə saxlanılır, səhv id atılır', () => {
    saveTafsirChoice('az', 169)
    saveTafsirChoice('ar', 91)
    expect(readTafsirChoices()).toEqual({ az: 169, ar: 91 })
    localStorage.setItem('quran_tafsir', JSON.stringify({ az: 90, en: 'x' }))
    expect(readTafsirChoices()).toEqual({})
    localStorage.setItem('quran_tafsir', '{pozuq')
    expect(readTafsirChoices()).toEqual({})
  })
})

describe('fetchTafsir — keş', () => {
  it('eyni ayə/təfsir ikinci dəfə sorğulanmır (yaddaş)', async () => {
    const f = vi.fn(async () => okJson('<p>Ayətul-kürsi</p><script>x</script>'))
    const a = await fetchTafsir(169, 2, 255, { fetchImpl: f })
    const b = await fetchTafsir(169, 2, 255, { fetchImpl: f })
    expect(f).toHaveBeenCalledTimes(1)
    expect(f.mock.calls[0][0]).toBe('https://api.quran.com/api/v4/tafsirs/169/by_ayah/2:255')
    expect(a.html).toBe('<p>Ayətul-kürsi</p>')
    expect(b).toBe(a)
  })
  it('eyni anda iki sorğu — bir şəbəkə çağırışı', async () => {
    const f = vi.fn(async () => okJson('<p>t</p>'))
    await Promise.all([fetchTafsir(16, 1, 1, { fetchImpl: f }), fetchTafsir(16, 1, 1, { fetchImpl: f })])
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('sessionStorage-dan bərpa (yaddaş təmizlənəndən sonra)', async () => {
    const f = vi.fn(async () => okJson('<p>s</p>'))
    await fetchTafsir(91, 2, 255, { fetchImpl: f })
    // yalnız yaddaşı sıfırla (səhifə yeniləndi kimi): sessionStorage qalır
    const saved = sessionStorage.getItem('tafsir:v1:91:2:255')
    clearTafsirCache()
    sessionStorage.setItem('tafsir:v1:91:2:255', saved)
    expect(getCachedTafsir(91, 2, 255)?.html).toBe('<p>s</p>')
    await fetchTafsir(91, 2, 255, { fetchImpl: f })
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('qrup halında izah: verses sıralanır, qonşu ayə də keşdə olur', async () => {
    const f = vi.fn(async () => okJson('<p>g</p>', { '2:9': { id: 16 }, '2:8': { id: 15 } }))
    const r = await fetchTafsir(169, 2, 9, { fetchImpl: f })
    expect(r.verses).toEqual(['2:8', '2:9'])
    expect(getCachedTafsir(169, 2, 8)).toBe(r)
  })
  it('404 → notfound, 500 → network; xəta keşlənmir', async () => {
    const f404 = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    await expect(fetchTafsir(14, 3, 3, { fetchImpl: f404 })).rejects.toMatchObject({ kind: 'notfound' })
    const f500 = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    await expect(fetchTafsir(14, 3, 4, { fetchImpl: f500 })).rejects.toBeInstanceOf(TafsirError)
    const fOk = vi.fn(async () => okJson('<p>ok</p>'))
    await expect(fetchTafsir(14, 3, 4, { fetchImpl: fOk })).resolves.toMatchObject({ html: '<p>ok</p>' })
  })
  it('gözlənilməz cavab → bad-response', async () => {
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ nope: 1 }) }))
    await expect(fetchTafsir(16, 5, 5, { fetchImpl: f })).rejects.toMatchObject({ kind: 'bad-response' })
  })
})
