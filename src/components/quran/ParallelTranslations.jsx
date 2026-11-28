// ═══════════════════════════════════════════════════════
// Paralel tərcümə — Quran oxuyucusunda ərəb mətni + 2–3 tərcümə yan-yana sütunlarda.
//   <ParallelPanel lang surah total stdRows keys onKeys onCols />  — seçici + yükləmə
//   <ParallelHead cols lang />                                     — sütun başlıqları
// Tənbəl yüklənir (QuranPage.jsx → lazy) — adi oxuma rejimini yavaşlatmır.
//
// Sətirlər ayə kartının içindədir (QuranPage → AyahCard, .par-row): hər ayə bir
// CSS grid sətri, sütun enləri bütün kartlarda eynidir — sütunlar JS-siz düzülür,
// birlikdə sürüşür. Telefonda (<720px) sütunlar alt-alta, tərcüməçi adı nişanla.
//
// Mətnlər: alquran.cloud (seçilmiş nəşrlər BİR sorğuda, vergüllə) + QuranEnc.com
// (utils/quranEnc → öz keşi). Cari dilin standart nəşri surənin öz sorğusundan
// götürülür (təkrar yüklənmir). Heç bir mətn dəyişdirilmir və uydurulmur.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { dirOf } from '../../seo/routes'
import { pickUi } from '../../utils/uiText'
import { fetchQuranEncSura, quranEncUrl } from '../../utils/quranEnc'
import { BASE_EDITIONS, BASE_LANGS, PAR_MAX, PAR_MIN, editionRows, parallelEntry, parallelGroups, toggleKey } from '../../utils/quranParallel'
import '../../styles/QuranParallel.css'

const L = {
  az: {
    pick: 'Sütunlarda göstəriləcək tərcümələr (2–3)', arabic: 'Ərəb mətni', loading: 'Tərcümələr yüklənir…',
    failed: (name) => `«${name}» tərcüməsi yüklənmədi. İnternet bağlantısını yoxlayın.`, retry: 'Yenidən cəhd et',
    needMore: 'Yan-yana oxumaq üçün ən azı 2 tərcümə seçin.', max: 'Ən çox 3 tərcümə seçmək olar.', source: 'Mənbə',
    tap: 'Ayəyə toxunun — həmin sətir bütün sütunlarda vurğulanır.',
    langs: ['Azərbaycanca', 'İngiliscə', 'Rusca', 'Türkcə', 'Ərəbcə'],
  },
  en: {
    pick: 'Translations to show in columns (2–3)', arabic: 'Arabic text', loading: 'Loading translations…',
    failed: (name) => `The “${name}” translation could not be loaded. Please check your connection.`, retry: 'Try again',
    needMore: 'Choose at least 2 translations to read side by side.', max: 'You can choose up to 3 translations.', source: 'Source',
    tap: 'Tap a verse to highlight that row in every column.',
    langs: ['Azerbaijani', 'English', 'Russian', 'Turkish', 'Arabic'],
  },
  ru: {
    pick: 'Переводы в колонках (2–3)', arabic: 'Арабский текст', loading: 'Загрузка переводов…',
    failed: (name) => `Не удалось загрузить перевод «${name}». Проверьте подключение к интернету.`, retry: 'Повторить',
    needMore: 'Выберите не менее 2 переводов, чтобы читать их рядом.', max: 'Можно выбрать не более 3 переводов.', source: 'Источник',
    tap: 'Нажмите на аят — эта строка выделится во всех колонках.',
    langs: ['Азербайджанский', 'Английский', 'Русский', 'Турецкий', 'Арабский'],
  },
  tr: {
    pick: 'Sütunlarda gösterilecek mealler (2–3)', arabic: 'Arapça metin', loading: 'Mealler yükleniyor…',
    failed: (name) => `«${name}» meali yüklenemedi. İnternet bağlantınızı kontrol edin.`, retry: 'Tekrar dene',
    needMore: 'Yan yana okumak için en az 2 meal seçin.', max: 'En fazla 3 meal seçebilirsiniz.', source: 'Kaynak',
    tap: 'Bir ayete dokunun — o satır bütün sütunlarda vurgulanır.',
    langs: ['Azerbaycanca', 'İngilizce', 'Rusça', 'Türkçe', 'Arapça'],
  },
  ar: {
    pick: 'الترجمات المعروضة في الأعمدة (2–3)', arabic: 'النص العربي', loading: 'جارٍ تحميل الترجمات…',
    failed: (name) => `تعذّر تحميل «${name}». تحقّق من الاتصال بالإنترنت.`, retry: 'أعد المحاولة',
    needMore: 'اختر ترجمتين على الأقل للقراءة جنبًا إلى جنب.', max: 'يمكنك اختيار ثلاث ترجمات على الأكثر.', source: 'المصدر',
    tap: 'اضغط على آية لتظليل سطرها في كل الأعمدة.',
    langs: ['الأذربيجانية', 'الإنجليزية', 'الروسية', 'التركية', 'العربية'],
  },
}

// Dil adları massivdədir (BASE_LANGS sırası: az, en, ru, tr, ar)
const langName = (l, code) => l.langs[BASE_LANGS.indexOf(code)] || code

// ── alquran.cloud: bir sorğuda bir neçə nəşr; yaddaş keşi (surə|nəşr) ──
const TIMEOUT = 15000
const alqCache = new Map()
async function fetchEditions(surah, eds, total, signal) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/surah/${surah}/editions/${eds.join(',')}`, { signal: ctrl.signal })
    if (!r.ok) throw new Error(`http-${r.status}`)
    const d = await r.json()
    const rows = editionRows(d?.data, total)
    for (const [id, list] of Object.entries(rows)) alqCache.set(`${surah}|${id}`, list)
    return rows
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Seçici + yükləyici. onCols([{ key, name, lang, dir, kind, rows: string[]|null, status }])
 * — səhifə sətirləri ayə kartlarına ötürür. stdRows — cari dilin standart nəşri (surənin öz sorğusu).
 */
export default function ParallelPanel({ lang, surah, total, stdRows, keys, onKeys, onCols }) {
  const l = pickUi(L, lang, 'en')
  const groups = useMemo(() => parallelGroups(lang), [lang])
  // Yüklənmiş sətirlər: { 'surə|açar': string[] | 'error' }
  const [loaded, setLoaded] = useState({})
  const [attempt, setAttempt] = useState(0)
  const keysStr = keys.join(',')
  const stdKey = BASE_EDITIONS[lang] || ''

  useEffect(() => {
    if (!surah || !total) return undefined
    const ctrl = new AbortController()
    const want = keysStr ? keysStr.split(',') : []
    const put = (patch) => { if (!ctrl.signal.aborted) setLoaded(prev => ({ ...prev, ...patch })) }
    const ready = {}
    const eds = []
    for (const k of want) {
      const e = parallelEntry(k)
      if (!e) continue
      const id = `${surah}|${k}`
      if (e.kind === 'alq') {
        if (k === stdKey && stdRows?.length === total) ready[id] = stdRows
        else if (alqCache.get(id)?.length === total) ready[id] = alqCache.get(id)
        else eds.push(k)
      } else {
        fetchQuranEncSura(k, surah, total, ctrl.signal)
          .then(rows => put({ [id]: rows.map(x => x.tr) }))
          .catch(() => put({ [id]: 'error' }))
      }
    }
    if (Object.keys(ready).length) put(ready)
    if (eds.length) {
      fetchEditions(surah, eds, total, ctrl.signal)
        .then(rows => put(Object.fromEntries(eds.map(k => [`${surah}|${k}`, rows[k] || 'error']))))
        .catch(() => put(Object.fromEntries(eds.map(k => [`${surah}|${k}`, 'error']))))
    }
    return () => ctrl.abort()
  }, [surah, total, keysStr, stdKey, stdRows, attempt])

  const cols = useMemo(() => keys.map(k => {
    const e = parallelEntry(k)
    const v = loaded[`${surah}|${k}`]
    const rows = Array.isArray(v) && v.length === total ? v : null
    return { key: k, kind: e.kind, name: e.name, lang: e.lang, dir: dirOf(e.lang), rows, status: rows ? 'ok' : v === 'error' ? 'error' : 'loading' }
  }), [keys, loaded, surah, total])

  useEffect(() => { onCols(cols, surah) }, [cols, onCols, surah])

  const failed = cols.filter(c => c.status === 'error')
  const loading = cols.some(c => c.status === 'loading')
  const full = keys.length >= PAR_MAX
  const retry = () => {
    setLoaded(prev => Object.fromEntries(Object.entries(prev).filter(([, v]) => v !== 'error')))
    setAttempt(a => a + 1)
  }
  const qeCols = cols.filter(c => c.kind === 'qe')

  return (
    <div className="qpar" data-testid="par-panel">
      <fieldset className="qpar__pick">
        <legend className="qpar__legend">{l.pick}</legend>
        {groups.map(g => (
          <div className="qpar__group" key={g.lang} role="group" aria-label={langName(l, g.lang)}>
            <span className="qpar__lang" aria-hidden="true">{langName(l, g.lang)}</span>
            <div className="qpar__chips">
              {g.items.map(it => {
                const on = keys.includes(it.key)
                const disabled = !on && full
                return (
                  <label key={it.key} className={`qpar__chip${on ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}`}>
                    <input type="checkbox" checked={on} disabled={disabled} data-key={it.key}
                      onChange={() => onKeys(toggleKey(keys, it.key))} />
                    <span lang={it.lang} dir={dirOf(it.lang)}>{it.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </fieldset>
      <p className="qpar__status" aria-live="polite">
        {keys.length < PAR_MIN ? l.needMore : <>{l.tap}{full ? ` ${l.max}` : ''}</>}
        {loading ? <span className="qpar__loading"> {l.loading}</span> : null}
      </p>
      {failed.length > 0 && (
        <div className="qpar__error" role="status">
          {failed.map(c => <p key={c.key}>{l.failed(c.name)}</p>)}
          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={retry}>{l.retry}</button>
        </div>
      )}
      {qeCols.length > 0 && (
        <p className="qpar__src">
          {l.source}:{' '}
          {qeCols.map((c, i) => (
            <span key={c.key}>{i > 0 ? ' · ' : ''}<span lang={c.lang} dir={c.dir}>{c.name}</span> — <a href={quranEncUrl(c.key, surah, lang)} target="_blank" rel="noopener noreferrer">QuranEnc.com</a></span>
          ))}
        </p>
      )}
    </div>
  )
}

/** Sütun başlıqları (kart quruluşunu təkrarlayır: nömrə yeri · sütunlar · alət yeri). Ekran oxuyucusu üçün ad hər xanadadır. */
export function ParallelHead({ cols, lang }) {
  const l = pickUi(L, lang, 'en')
  return (
    <div className="par-head" aria-hidden="true" data-testid="par-head">
      <span className="par-head__gap" />
      <div className="par-row par-head__row" style={{ '--par-n': cols.length }}>
        <span className="par-head__cell par-head__cell--ar">{l.arabic}</span>
        {cols.map(c => (
          <span key={c.key} className="par-head__cell" lang={c.lang} dir={c.dir}>
            {c.name}<small lang={lang} dir={dirOf(lang)}>{langName(l, c.lang)}</small>
          </span>
        ))}
      </div>
      <span className="par-head__gap" />
    </div>
  )
}
