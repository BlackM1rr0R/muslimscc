// ═══════════════════════════════════════════════════════
// TwinAyahs (v5.9) — "Əkiz ayələr" (/hifz): bir-birinə çox oxşayan ayələr yan-yana,
// fərqli sözlər qızılı parlayır — hafiz qarışdırdığı yeri dərhal görür.
//
//   <TwinAyahs lang="az" />
//
// • Məlumat — public/data/mutashabihat.json (scripts/build-mutashabihat.mjs): Tanzil Uthmani
//   mətnindən söz-söz hesablanıb (ortaq söz ardıcıllığı ≥ 50%, tam eyni olmayan cütlər).
//   Heç bir şərh/iddia yoxdur — yalnız mətnin öz oxşarlığı. Yalnız bölmə açılanda yüklənir.
// • Fərq: iki ayənin normallaşdırılmış sözləri arasında ən uzun ortaq ardıcıllıq (LCS);
//   ona daxil olmayan sözlər — fərqlidir.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { normalizeArabic } from '../../utils/hifzSrs'
import { SURAH_TABLE } from '../../data/mushafIndex'
import { getSurahLocal } from '../../data/surahNamesAz'
import { pathFor } from '../../seo/routes'
import '../../styles/TwinAyahs.css'

const T = {
  az: { ey: 'Hifz', title: 'Əkiz ayələr', lead: 'Bir-birinə çox oxşayan ayələr — fərqli sözlər qızılı rənglə göstərilir. Hafizlər ən çox məhz bu yerləri qarışdırır.', surah: 'Surə', pick: 'Ayəni seçin', random: 'Təsadüfi əkiz', sim: '{n}% oxşar', diff: 'fərqli söz', open: 'Quranda aç', none: 'Bu surədə əkiz ayə tapılmadı.', how: 'Mətnin özündən hesablanıb (Tanzil): ortaq söz ardıcıllığı ən azı 50%, tam eyni təkrarlar daxil deyil.', count: '{n} ayənin əkizi var', loading: 'Yüklənir…', err: 'Məlumat yüklənmədi.' },
  en: { ey: 'Hifz', title: 'Twin ayahs', lead: 'Ayahs that are very similar to each other — the words that differ are shown in gold. These are the places memorisers mix up most.', surah: 'Surah', pick: 'Pick an ayah', random: 'Random twin', sim: '{n}% similar', diff: 'different word', open: 'Open in the Quran', none: 'No twin ayahs found in this surah.', how: 'Calculated from the text itself (Tanzil): at least 50% of the word sequence shared; exact repeats are not included.', count: '{n} ayahs have a twin', loading: 'Loading…', err: 'Could not load the data.' },
  // lang-ok[Tanzil]: mənbənin adı (tanzil.net)
  ru: { ey: 'Хифз', title: 'Аяты-близнецы', lead: 'Очень похожие друг на друга аяты — отличающиеся слова выделены золотым. Именно их заучивающие путают чаще всего.', surah: 'Сура', pick: 'Выберите аят', random: 'Случайная пара', sim: 'сходство {n}%', diff: 'отличающееся слово', open: 'Открыть в Коране', none: 'В этой суре похожих аятов не найдено.', how: 'Рассчитано по самому тексту (Tanzil): не менее 50% общей последовательности слов; точные повторы не включены.', count: 'у {n} аятов есть близнец', loading: 'Загрузка…', err: 'Не удалось загрузить данные.' },
  ar: { ey: 'الحفظ', title: 'الآيات المتشابهة', lead: 'آيات متشابهة جدًا — الكلمات المختلفة بلون ذهبي. وهي أكثر المواضع التي يخلط فيها الحفّاظ.', surah: 'السورة', pick: 'اختر آية', random: 'متشابهة عشوائية', sim: 'تشابه {n}%', diff: 'كلمة مختلفة', open: 'افتح في المصحف', none: 'لا توجد آيات متشابهة في هذه السورة.', how: 'محسوبة من النص نفسه (تنزيل): تشترك في 50% على الأقل من تتابع الكلمات، ولا تدخل التكرارات المطابقة.', count: '{n} آية لها نظير', loading: 'جارٍ التحميل…', err: 'تعذّر تحميل البيانات.' },
  tr: { ey: 'Hıfz', title: 'İkiz âyetler', lead: 'Birbirine çok benzeyen âyetler — farklı kelimeler altın renkle gösterilir. Hafızların en çok karıştırdığı yerler bunlardır.', surah: 'Sure', pick: 'Âyet seçin', random: 'Rastgele ikiz', sim: '%{n} benzer', diff: 'farklı kelime', open: 'Kur’an’da aç', none: 'Bu surede ikiz âyet bulunamadı.', how: 'Metnin kendisinden hesaplandı (Tanzil): kelime dizisinin en az %50’si ortak; birebir tekrarlar dahil değil.', count: '{n} âyetin ikizi var', loading: 'Yükleniyor…', err: 'Veri yüklenemedi.' },
}
const fill = (s, n) => String(s).replace('{n}', n)
let cache = null
const load = () => (cache ||= fetch('/data/mutashabihat.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json() }).catch(e => { cache = null; throw e }))

// Göstəriləcək sözlər (boşluqla) + hər birinin normallaşdırılmış forması (boş olanlar — işarə)
const tokens = (text) => String(text).split(/\s+/).filter(Boolean).map(w => ({ w, n: normalizeArabic(w) }))
/** İki söz siyahısında LCS-ə daxil olan mövqelər (normallaşdırılmış sözlərlə) */
function common(a, b) {
  const A = a.map((x, i) => [x.n, i]).filter(x => x[0]), B = b.map((x, i) => [x.n, i]).filter(x => x[0])
  const m = A.length, n = B.length, dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1))
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = A[i - 1][0] === B[j - 1][0] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  const ia = new Set(), ib = new Set()
  for (let i = m, j = n; i > 0 && j > 0;) {
    if (A[i - 1][0] === B[j - 1][0]) { ia.add(A[i - 1][1]); ib.add(B[j - 1][1]); i--; j-- } else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--
  }
  // İşarə-sözlər (boş normal forma) fərq sayılmır
  a.forEach((x, i) => { if (!x.n) ia.add(i) }); b.forEach((x, i) => { if (!x.n) ib.add(i) })
  return [ia, ib]
}

function Ayah({ k, text, same, lang, t, sim }) {
  const [s, a] = k.split(':').map(Number)
  const name = getSurahLocal(s, lang)?.name || SURAH_TABLE[s - 1]?.[5] || s
  return (
    <article className={`tw__ayah${sim ? '' : ' is-main'}`}>
      <header className="tw__head">
        <span className="tw__ref"><b className="ui-num">{s}:{a}</b> {name}</span>
        {sim ? <span className="tw__sim ui-num" style={{ '--p': sim / 100 }}>{fill(t.sim, sim)}</span> : null}
      </header>
      <p className="tw__ar" lang="ar" dir="rtl">
        {text.map((x, i) => <span key={i} className={same.has(i) ? '' : 'tw__d'} style={same.has(i) ? undefined : { '--i': i }}>{x.w} </span>)}
      </p>
      <a className="tw__open ui-link" href={`${pathFor('quran', lang, s)}?a=${a}`}>{t.open} <Icon name="arrow" size={14} className="ui-flip-rtl" /></a>
    </article>
  )
}

export default function TwinAyahs({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [data, setData] = useState(null)
  const [err, setErr] = useState(false)
  const [surah, setSurah] = useState(2)
  const [key, setKey] = useState('2:48')
  useEffect(() => { load().then(setData).catch(() => setErr(true)) }, [])
  const bySurah = useMemo(() => {
    const m = new Map()
    if (data) for (const k of Object.keys(data.pairs)) { const s = Number(k.split(':')[0]); if (!m.has(s)) m.set(s, []); m.get(s).push(k) }
    for (const l of m.values()) l.sort((x, y) => Number(x.split(':')[1]) - Number(y.split(':')[1]))
    return m
  }, [data])
  const list = bySurah.get(surah) || []
  const twins = useMemo(() => data?.pairs[key] || [], [data, key])
  const main = useMemo(() => (data?.text[key] ? tokens(data.text[key]) : []), [data, key])
  const cmp = useMemo(() => twins.map(([k, sim]) => {
    const other = tokens(data.text[k] || '')
    const [ia, ib] = common(main, other)
    return { k, sim, other, ia, ib }
  }), [twins, main, data])
  // Əsas ayədə: hər hansı əkizlə fərqli olan sözlər
  const mainSame = useMemo(() => {
    if (!cmp.length) return new Set(main.map((_, i) => i))
    return new Set(main.map((_, i) => i).filter(i => cmp.every(c => c.ia.has(i))))
  }, [cmp, main])

  const pickSurah = (s) => { setSurah(s); const l = bySurah.get(s); if (l?.length) setKey(l[0]) }
  const random = () => {
    if (!data) return
    const ks = Object.keys(data.pairs); const k = ks[Math.floor(Math.random() * ks.length)]
    setSurah(Number(k.split(':')[0])); setKey(k)
  }

  return (
    <section className="ui-section tw" aria-labelledby="tw-title" data-testid="twin-ayahs">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="tw-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        {err ? <p className="tw__note">{t.err}</p> : !data ? <p className="tw__note">{t.loading}</p> : (
          <div className="ui-card tw__card">
            <div className="tw__tools">
              <label className="tw__sel">
                <span>{t.surah}</span>
                <select className="ui-input" value={surah} onChange={(e) => pickSurah(Number(e.target.value))} data-testid="tw-surah">
                  {[...bySurah.keys()].sort((a, b) => a - b).map(s => <option key={s} value={s}>{s}. {getSurahLocal(s, lang)?.name || SURAH_TABLE[s - 1]?.[5]}</option>)}
                </select>
              </label>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={random} data-testid="tw-random"><Icon name="sparkle" className="ui-btn__icon" />{t.random}</button>
              <span className="tw__count ui-num">{fill(t.count, data.meta.ayahs)}</span>
            </div>
            <div className="tw__chips" role="listbox" aria-label={t.pick}>
              {list.length ? list.map(k => (
                <button key={k} type="button" role="option" aria-selected={k === key} className={`tw__chip ui-num${k === key ? ' is-on' : ''}`} onClick={() => setKey(k)}>{k.split(':')[1]}</button>
              )) : <p className="tw__note">{t.none}</p>}
            </div>
            {main.length > 0 && (
              <div className="tw__pair" key={key} data-testid="tw-pair">
                <Ayah k={key} text={main} same={mainSame} lang={lang} t={t} />
                {cmp.map(c => <Ayah key={c.k} k={c.k} text={c.other} same={c.ib} lang={lang} t={t} sim={c.sim} />)}
              </div>
            )}
            <p className="tw__how"><span className="tw__key" aria-hidden="true" /> {t.diff} · {t.how}</p>
          </div>
        )}
      </div>
    </section>
  )
}
