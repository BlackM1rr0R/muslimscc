// ═══════════════════════════════════════════════════════
// OfflineAudio (v5.7) — "Səsi oflayn saxla": seçilmiş qarinin qiraəti telefona (/quran)
//
//   <OfflineAudio lang="az" surahUrl={(n) => 'https://api.alquran.cloud/v1/surah/…'} />
//   (surahUrl — OfflinePack-dəki ilə eyni: seçilən surələrin mətni də keşə yazılır)
//
// • Dəst: Cüz Əmmə (78–114), sevilən surələr (Fatihə, Kəhf, Yasin, Vaqiə, Mülk) və ya
//   bütün Quran. Hər ayə ayrıca fayldır (verses.quran.com, CORS açıq) → keş
//   'qm-audio-v1'; SW Range sorğusuna keşdən 206 qaytarır (public/sw.js).
// • Surə BÜTÜN ayələri yüklənəndə "saxlanıb" sayılır (utils/quranAudio.setOfflineSurahs);
//   pleyer həmin surədə keşdəki ünvanı birinci yoxlayır — internet olmadan da oxuyur.
// • Eyni anda 3 sorğu, ləğv etmək olur; "Sil" — həmin qarinin bütün faylları.
// • Ölçü təxminidir (ayə başına ~120 KB); yaddaş icazəsi (persist) istənilir.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { SURAH_TABLE } from '../../data/mushafIndex.js'
import {
  RECITERS, canOffline, offlineUrl, offlineSurahs, setOfflineSurahs, readAudioPrefs, reciterName, OFFLINE_AUDIO_CACHE,
} from '../../utils/quranAudio'
import { PAGE_CACHE } from '../OfflinePack'
import '../../styles/OfflinePack.css'

const T = {
  az: { title: 'Səsi oflayn saxla', lead: 'Qarinin qiraətini telefona yükləyin — təyyarədə, yolda, internet olmayanda da dinləyin.', reciter: 'Qari', set: 'Nə yüklənsin', btn: 'Yüklə', stop: 'Dayandır', del: 'Sil', saved: '{n} surə saxlanıb', part: '{a} / {b} ayə', err: '{n} ayə yüklənmədi — yenidən basın.', size: '~{n} MB', noCache: 'Bu brauzer oflayn yaddaşı dəstəkləmir.', sets: { amma: 'Cüz Əmmə (78–114)', fav: 'Fatihə, Kəhf, Yasin, Vaqiə, Mülk', all: 'Bütün Quran' }, bigWarn: 'Böyük yükləmədir — Wi-Fi tövsiyə olunur.' },
  en: { title: 'Save recitation offline', lead: 'Download a reciter to this device and listen on a plane, on the road or with no internet.', reciter: 'Reciter', set: 'What to download', btn: 'Download', stop: 'Stop', del: 'Delete', saved: '{n} surahs saved', part: '{a} / {b} verses', err: '{n} verses failed — press again.', size: '~{n} MB', noCache: 'This browser does not support offline storage.', sets: { amma: 'Juz ʿAmma (78–114)', fav: 'Al-Fatihah, Al-Kahf, Ya-Sin, Al-Waqiʿah, Al-Mulk', all: 'Whole Qur’an' }, bigWarn: 'Large download — Wi-Fi recommended.' },
  ru: { title: 'Сохранить чтение офлайн', lead: 'Загрузите чтеца на устройство и слушайте в самолёте, в дороге и без интернета.', reciter: 'Чтец', set: 'Что загрузить', btn: 'Загрузить', stop: 'Остановить', del: 'Удалить', saved: 'Сохранено сур: {n}', part: '{a} / {b} аятов', err: 'Не загружено аятов: {n} — нажмите ещё раз.', size: '~{n} МБ', noCache: 'Этот браузер не поддерживает офлайн-хранилище.', sets: { amma: 'Джуз Амма (78–114)', fav: 'Фатиха, Кахф, Ясин, Вакиа, Мульк', all: 'Весь Коран' }, bigWarn: 'Большая загрузка — лучше через Wi-Fi.' },
  ar: { title: 'احفظ التلاوة دون إنترنت', lead: 'نزّل تلاوة القارئ على هذا الجهاز واستمع في الطائرة أو الطريق أو دون اتصال.', reciter: 'القارئ', set: 'ما الذي يُنزَّل', btn: 'نزّل', stop: 'أوقف', del: 'احذف', saved: 'محفوظ: {n} سورة', part: '{a} / {b} آية', err: 'تعذّر تنزيل {n} آية — اضغط مجددًا.', size: '~{n} ميغابايت', noCache: 'هذا المتصفح لا يدعم التخزين دون اتصال.', sets: { amma: 'جزء عمّ (78–114)', fav: 'الفاتحة، الكهف، يس، الواقعة، الملك', all: 'القرآن كاملًا' }, bigWarn: 'تنزيل كبير — يُنصح بشبكة Wi-Fi.' },
  tr: { title: 'Tilaveti çevrimdışı kaydet', lead: 'Kârinin tilavetini cihaza indirin — uçakta, yolda, internetsiz dinleyin.', reciter: 'Kâri', set: 'Ne indirilsin', btn: 'İndir', stop: 'Durdur', del: 'Sil', saved: '{n} sure kaydedildi', part: '{a} / {b} ayet', err: '{n} ayet indirilemedi — tekrar basın.', size: '~{n} MB', noCache: 'Bu tarayıcı çevrimdışı depolamayı desteklemiyor.', sets: { amma: 'Amme cüzü (78–114)', fav: 'Fâtiha, Kehf, Yâsîn, Vâkıa, Mülk', all: 'Bütün Kur’an' }, bigWarn: 'Büyük indirme — Wi-Fi önerilir.' },
}

const fill = (str, o) => str.replace(/\{(\w+)\}/g, (m, k) => (k in o ? String(o[k]) : m))
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
export const SETS = { amma: range(78, 114), fav: [1, 18, 36, 56, 67], all: range(1, 114) }
const KB_PER_AYAH = 120
export const ayahCount = (list) => list.reduce((n, s) => n + (SURAH_TABLE[s - 1]?.[2] || 0), 0)

export default function OfflineAudio({ lang = 'az', surahUrl }) {
  const t = pickUi(T, lang)
  const options = RECITERS.filter(r => canOffline(r.id))
  const [rid, setRid] = useState(() => {
    const p = typeof window === 'undefined' ? null : readAudioPrefs().reciter
    return p && canOffline(p) ? p : options[0].id
  })
  const [setKey, setSetKey] = useState('amma')
  const [saved, setSaved] = useState(() => new Set())
  const [prog, setProg] = useState(null) // { done, total, failed }
  const [failed, setFailed] = useState(0)
  const stopRef = useRef(false)
  const hasCache = typeof window !== 'undefined' && 'caches' in window

  useEffect(() => { setSaved(offlineSurahs(rid)); setFailed(0) }, [rid])

  const surahs = SETS[setKey]
  const todo = surahs.filter(s => !saved.has(s))
  const mb = Math.max(1, Math.round((ayahCount(todo.length ? todo : surahs) * KB_PER_AYAH) / 1024))

  const run = async () => {
    if (!hasCache || prog || !todo.length) return
    stopRef.current = false
    try { await navigator.storage?.persist?.() } catch { /* icazə verilmədi — yenə də yüklə */ }
    const cache = await caches.open(OFFLINE_AUDIO_CACHE)
    // Surənin mətni də (ərəbcə + tərcümə) — səhifə internetsiz açılsın (OfflinePack ilə eyni keş)
    if (surahUrl) {
      const pages = await caches.open(PAGE_CACHE)
      await Promise.all(todo.map(async (s) => {
        const u = surahUrl(s)
        try { if (!(await pages.match(u))) { const r = await fetch(u); if (r.ok) await pages.put(u, r) } } catch { /* mətn sonra */ }
      }))
    }
    const jobs = todo.flatMap(s => range(1, SURAH_TABLE[s - 1][2]).map(a => ({ s, a })))
    const bad = new Map() // surə → uğursuz ayə sayı
    let done = 0, next = 0, fails = 0
    setProg({ done, total: jobs.length })
    const have = new Set(saved)
    const left = new Map(todo.map(s => [s, SURAH_TABLE[s - 1][2]]))
    const worker = async () => {
      while (next < jobs.length && !stopRef.current) {
        const { s, a } = jobs[next++]
        const url = offlineUrl(rid, s, a)
        let ok = Boolean(await cache.match(url).catch(() => null))
        for (let i = 0; i < 2 && !ok && !stopRef.current; i++) {
          if (i) await new Promise(r => setTimeout(r, 1200))
          try {
            const res = await fetch(url, { mode: 'cors' })
            if (res.ok) { await cache.put(url, res); ok = true }
          } catch { /* şəbəkə — təkrar */ }
        }
        if (!ok) { fails++; bad.set(s, (bad.get(s) || 0) + 1) }
        left.set(s, left.get(s) - 1)
        if (left.get(s) === 0 && !bad.get(s)) { have.add(s); setOfflineSurahs(rid, have) }
        done++
        setProg({ done, total: jobs.length })
      }
    }
    await Promise.all([worker(), worker(), worker()])
    setSaved(new Set(have))
    setFailed(fails)
    setProg(null)
  }

  const remove = async () => {
    if (prog) return
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE)
      await Promise.all([...saved].flatMap(s => range(1, SURAH_TABLE[s - 1][2]).map(a => cache.delete(offlineUrl(rid, s, a)))))
    } catch { /* */ }
    setOfflineSurahs(rid, new Set())
    setSaved(new Set())
  }

  const pct = prog ? Math.round((prog.done / prog.total) * 100) : 0
  const allSaved = !todo.length
  return (
    <section className="ui-card op op--audio" data-testid="offline-audio" aria-labelledby="oa-title">
      <span className="op__ic" aria-hidden="true"><Icon name={allSaved ? 'check' : 'volume'} size={22} /></span>
      <div className="op__body">
        <h2 id="oa-title" className="op__title">{t.title}</h2>
        <p className="op__lead">{t.lead}</p>
        <div className="op__row">
          <label className="ui-field">
            <span className="ui-field__label">{t.reciter}</span>
            <select className="ui-input" value={rid} disabled={!!prog} onChange={e => setRid(e.target.value)} data-testid="oa-reciter">
              {options.map(r => <option key={r.id} value={r.id}>{reciterName(r.id, lang)}</option>)}
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-field__label">{t.set}</span>
            <select className="ui-input" value={setKey} disabled={!!prog} onChange={e => setSetKey(e.target.value)} data-testid="oa-set">
              {Object.keys(SETS).map(k => <option key={k} value={k}>{t.sets[k]}</option>)}
            </select>
          </label>
        </div>
        {prog && (
          <div className="op__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={fill(t.part, { a: prog.done, b: prog.total })}>
            <i style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
        )}
        <p className="op__status ui-num" aria-live="polite">
          {!hasCache ? t.noCache
            : prog ? fill(t.part, { a: prog.done, b: prog.total })
            : <>
              {saved.size > 0 && fill(t.saved, { n: saved.size })}
              {failed > 0 && ` · ${fill(t.err, { n: failed })}`}
              {!allSaved && <>{saved.size > 0 || failed > 0 ? ' · ' : ''}{fill(t.size, { n: mb })}{setKey === 'all' && !saved.size ? ` · ${t.bigWarn}` : ''}</>}
            </>}
        </p>
      </div>
      {hasCache && (
        <div className="op__btns">
          {prog
            ? <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { stopRef.current = true }}>{t.stop}</button>
            : <>
              {!allSaved && (
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={run} data-testid="oa-run">
                  <Icon name="download" className="ui-btn__icon" /> {t.btn}
                </button>
              )}
              {saved.size > 0 && (
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={remove} data-testid="oa-del">
                  <Icon name="trash" className="ui-btn__icon" /> {t.del}
                </button>
              )}
            </>}
        </div>
      )}
    </section>
  )
}
