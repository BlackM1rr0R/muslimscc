// ═══════════════════════════════════════════════════════
// OfflinePack — "Oflayn saxla": Quranın 114 surəsi (cari dildə) + Hisnul-Müslim (/quran)
//
//   <OfflinePack lang="az" surahUrl={(n) => 'https://api.alquran.cloud/v1/surah/…'} />
//
// • Cavablar brauzer keşinə ("muslims-cc-v6" — public/sw.js-in səhifə keşi) eyni URL ilə
//   yazılır; service worker şəbəkə olmayanda onları caches.match ilə verir.
// • Eyni anda 2 sorğu (429-da gözləyib təkrar), irəliləyiş zolağı, ləğv etmək olur; nəticə və tarix localStorage-da.
// • Yalnız istifadəçi düyməni basanda yüklənir (~ 8–12 MB). Stillər: src/styles/OfflinePack.css
// ═══════════════════════════════════════════════════════
import { useRef, useState } from 'react'
import Icon from './Icon'
import '../styles/OfflinePack.css'
import { pickUi } from '../utils/uiText'

export const PAGE_CACHE = 'muslims-cc-v6'
const KEY = 'muslim_cc_offline_pack_v1'
const T = {
  az: { title: 'Oflayn saxla', lead: 'Quranın bütün surələrini (ərəbcə + tərcümə) və Hisnul-Müslimi bu cihaza yükləyin — internet olmayanda da açılacaq.', btn: 'Yüklə (~10 MB)', again: 'Yenilə', stop: 'Dayandır', done: (d) => `Saxlanıb · ${d}`, part: (a, b) => `${a} / ${b} hissə`, err: (n) => `${n} hissə yüklənmədi — internet bərpa olanda «Yenilə»yə basın.`, noCache: 'Bu brauzer oflayn yaddaşı dəstəkləmir.' },
  en: { title: 'Save for offline', lead: 'Download every surah (Arabic + translation) and Hisn al-Muslim to this device — they will open without internet.', btn: 'Download (~10 MB)', again: 'Refresh', stop: 'Stop', done: (d) => `Saved · ${d}`, part: (a, b) => `${a} / ${b} parts`, err: (n) => `${n} parts failed — press “Refresh” when you are back online.`, noCache: 'This browser does not support offline storage.' },
  ru: { title: 'Сохранить офлайн', lead: 'Загрузите все суры (арабский + перевод) и «Хисн аль-муслим» на это устройство — они откроются без интернета.', btn: 'Загрузить (~10 МБ)', again: 'Обновить', stop: 'Остановить', done: (d) => `Сохранено · ${d}`, part: (a, b) => `${a} / ${b} частей`, err: (n) => `Не загружено частей: ${n} — нажмите «Обновить», когда появится интернет.`, noCache: 'Этот браузер не поддерживает офлайн-хранилище.' },
  tr: { title: 'Çevrimdışı kaydet', lead: 'Tüm sureleri (Arapça + meal) ve Hısnu’l-Müslim’i bu cihaza indirin — internet olmadan da açılır.', btn: 'İndir (~10 MB)', again: 'Yenile', stop: 'Durdur', done: (d) => `Kaydedildi · ${d}`, part: (a, b) => `${a} / ${b} parça`, err: (n) => `${n} parça indirilemedi — internet gelince «Yenile»ye basın.`, noCache: 'Bu tarayıcı çevrimdışı depolamayı desteklemiyor.' },
  ar: { title: 'احفظ للاستخدام دون إنترنت', lead: 'نزّل كل السور (العربية + التفسير) وحصن المسلم على هذا الجهاز لتفتح دون اتصال.', btn: 'نزّل (~10 ميغابايت)', again: 'حدّث', stop: 'أوقف', done: (d) => `محفوظ · ${d}`, part: (a, b) => `${a} / ${b} جزء`, err: (n) => `تعذّر تنزيل ${n} جزء — اضغط «حدّث» عند عودة الاتصال.`, noCache: 'هذا المتصفح لا يدعم التخزين دون اتصال.' },
}

function readState() { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }

/** Saf: hansı URL-lər yüklənməlidir (tests/unit/offline-pack.test.js) */
export function packUrls(lang, surahUrl) {
  return [...Array.from({ length: 114 }, (_, i) => surahUrl(i + 1)), `/data/hisn/${lang}.json`]
}

export default function OfflinePack({ lang = 'az', surahUrl }) {
  const t = pickUi(T, lang)
  const [saved, setSaved] = useState(() => (typeof window === 'undefined' ? {} : readState()[lang] || null))
  const [prog, setProg] = useState(null) // { done, total, failed }
  const stopRef = useRef(false)
  const hasCache = typeof window !== 'undefined' && 'caches' in window

  const run = async () => {
    if (!hasCache || prog) return
    stopRef.current = false
    const urls = packUrls(lang, surahUrl)
    const cache = await caches.open(PAGE_CACHE)
    let done = 0, failed = 0, next = 0
    setProg({ done, total: urls.length, failed })
    const worker = async () => {
      while (next < urls.length && !stopRef.current) {
        const url = urls[next++]
        // alquran.cloud çox sorğuda 429 qaytarır — gözləyib təkrar (3 cəhd)
        let ok = false
        for (let attempt = 0; attempt < 3 && !ok && !stopRef.current; attempt++) {
          if (attempt) await new Promise(r => setTimeout(r, 1500 * attempt))
          try {
            const res = await fetch(url, { cache: 'no-cache' })
            if (res.ok) { await cache.put(url, res); ok = true }
            else if (res.status !== 429 && res.status < 500) break
          } catch { /* şəbəkə — təkrar */ }
        }
        if (!ok) failed++
        done++
        setProg({ done, total: urls.length, failed })
      }
    }
    await Promise.all([worker(), worker()])
    if (!stopRef.current) {
      const st = readState()
      st[lang] = { at: new Date().toISOString().slice(0, 10), failed }
      try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* yaddaş bağlıdır */ }
      setSaved(st[lang])
    }
    setProg(null)
  }

  const pct = prog ? Math.round((prog.done / prog.total) * 100) : 0
  return (
    <section className="ui-card op" data-testid="offline-pack" aria-labelledby="op-title">
      <span className="op__ic" aria-hidden="true"><Icon name={saved && !saved.failed ? 'check' : 'download'} size={22} /></span>
      <div className="op__body">
        <h2 id="op-title" className="op__title">{t.title}</h2>
        <p className="op__lead">{t.lead}</p>
        {prog && (
          <div className="op__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t.part(prog.done, prog.total)}>
            <i style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
        )}
        <p className="op__status ui-num" aria-live="polite">
          {!hasCache ? t.noCache
            : prog ? t.part(prog.done, prog.total)
            : saved ? <>{t.done(saved.at)}{saved.failed ? ` · ${t.err(saved.failed)}` : ''}</> : ''}
        </p>
      </div>
      {hasCache && (prog
        ? <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { stopRef.current = true }}>{t.stop}</button>
        : <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={run} data-testid="offline-pack-run">
            <Icon name="download" className="ui-btn__icon" /> {saved ? t.again : t.btn}
          </button>)}
    </section>
  )
}
