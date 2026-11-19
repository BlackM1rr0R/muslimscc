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
//   ona daxil olmayan sözlər — fərqlidir (rəng + alt xətt — yalnız rəngə güvənmir).
// • "Hansı?" özünü yoxlama: fərqli sözlər bulanıqlaşır; hafiz yadından deyib toxunur — söz açılır.
//   Heç bir xal/nəticə saxlanmır və göstərilmir.
// • Dərin keçid: /hifz?tw=2:48#twin-ayahs (Quran oxuyucusunun ayə menyusundan "Oxşar ayələr").
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { normalizeArabic } from '../../utils/hifzSrs'
import { SURAH_TABLE } from '../../data/mushafIndex'
import { getSurahLocal } from '../../data/surahNamesAz'
import { pathFor } from '../../seo/routes'
import { loadMutashabihat } from '../../utils/mutashabihat'
import '../../styles/TwinAyahs.css'

const T = {
  az: { ey: 'Hifz', title: 'Əkiz ayələr', lead: 'Bir-birinə çox oxşayan ayələr — fərqli sözlər qızılı rənglə göstərilir. Hafizlər ən çox məhz bu yerləri qarışdırır.', surah: 'Surə', pick: 'Ayəni seçin', random: 'Təsadüfi əkiz', sim: '{n}% oxşar', diff: 'fərqli söz', open: 'Quranda aç', none: 'Bu surədə əkiz ayə tapılmadı.', how: 'Mətnin özündən hesablanıb (Tanzil): ortaq söz ardıcıllığı ən azı 50%, tam eyni təkrarlar daxil deyil.', count: '{n} ayənin əkizi var', loading: 'Yüklənir…', err: 'Məlumat yüklənmədi.' },
  en: { ey: 'Hifz', title: 'Twin ayahs', lead: 'Ayahs that are very similar to each other — the words that differ are shown in gold. These are the places memorisers mix up most.', surah: 'Surah', pick: 'Pick an ayah', random: 'Random twin', sim: '{n}% similar', diff: 'different word', open: 'Open in the Quran', none: 'No twin ayahs found in this surah.', how: 'Calculated from the text itself (Tanzil): at least 50% of the word sequence shared; exact repeats are not included.', count: '{n} ayahs have a twin', loading: 'Loading…', err: 'Could not load the data.' },
  // lang-ok[Tanzil]: mənbənin adı (tanzil.net)
  ru: { ey: 'Хифз', title: 'Аяты-близнецы', lead: 'Очень похожие друг на друга аяты — отличающиеся слова выделены золотым. Именно их заучивающие путают чаще всего.', surah: 'Сура', pick: 'Выберите аят', random: 'Случайная пара', sim: 'сходство {n}%', diff: 'отличающееся слово', open: 'Открыть в Коране', none: 'В этой суре похожих аятов не найдено.', how: 'Рассчитано по самому тексту (Tanzil): не менее 50% общей последовательности слов; точные повторы не включены.', count: 'у {n} аятов есть близнец', loading: 'Загрузка…', err: 'Не удалось загрузить данные.' },
  ar: { ey: 'الحفظ', title: 'الآيات المتشابهة', lead: 'آيات متشابهة جدًا — الكلمات المختلفة بلون ذهبي. وهي أكثر المواضع التي يخلط فيها الحفّاظ.', surah: 'السورة', pick: 'اختر آية', random: 'متشابهة عشوائية', sim: 'تشابه {n}%', diff: 'كلمة مختلفة', open: 'افتح في المصحف', none: 'لا توجد آيات متشابهة في هذه السورة.', how: 'محسوبة من النص نفسه (تنزيل): تشترك في 50% على الأقل من تتابع الكلمات، ولا تدخل التكرارات المطابقة.', count: '{n} آية لها نظير', loading: 'جارٍ التحميل…', err: 'تعذّر تحميل البيانات.' },
  tr: { ey: 'Hıfz', title: 'İkiz âyetler', lead: 'Birbirine çok benzeyen âyetler — farklı kelimeler altın renkle gösterilir. Hafızların en çok karıştırdığı yerler bunlardır.', surah: 'Sure', pick: 'Âyet seçin', random: 'Rastgele ikiz', sim: '%{n} benzer', diff: 'farklı kelime', open: 'Kur’an’da aç', none: 'Bu surede ikiz âyet bulunamadı.', how: 'Metnin kendisinden hesaplandı (Tanzil): kelime dizisinin en az %50’si ortak; birebir tekrarlar dahil değil.', count: '{n} âyetin ikizi var', loading: 'Yükleniyor…', err: 'Veri yüklenemedi.' },
}
const T2 = {
  az: { quiz: 'Hansı?', quizHint: 'Fərqli sözlər gizlədilib — hər birini yadınızdan deyin, sonra yoxlamaq üçün toxunun.', hidden: 'Gizli söz — açmaq üçün toxunun', revealed: (n, m) => `${m} sözdən ${n} söz açılıb`, showAll: 'Hamısını aç', hideAgain: 'Yenidən gizlət', more: (n) => `Hamısını göstər (${n})`, less: 'Azını göstər' },
  en: { quiz: 'Which one?', quizHint: 'The differing words are hidden — recall each one, then tap it to check.', hidden: 'Hidden word — tap to reveal', revealed: (n, m) => `${n} of ${m} revealed`, showAll: 'Reveal all', hideAgain: 'Hide again', more: (n) => `Show all (${n})`, less: 'Show fewer' },
  ru: { quiz: 'Какой из них?', quizHint: 'Отличающиеся слова скрыты — вспомните каждое и нажмите, чтобы проверить.', hidden: 'Скрытое слово — нажмите, чтобы открыть', revealed: (n, m) => `Открыто ${n} из ${m}`, showAll: 'Открыть все', hideAgain: 'Скрыть снова', more: (n) => `Показать все (${n})`, less: 'Показать меньше' },
  ar: { quiz: 'أيّهما؟', quizHint: 'الكلمات المختلفة مخفيّة — تذكّر كل كلمة ثم اضغط عليها للتحقق.', hidden: 'كلمة مخفيّة — اضغط لإظهارها', revealed: (n, m) => `ظهر ${n} من ${m}`, showAll: 'أظهر الكل', hideAgain: 'أخفِ مجددًا', more: (n) => `عرض الكل (${n})`, less: 'عرض أقل' },
  tr: { quiz: 'Hangisi?', quizHint: 'Farklı kelimeler gizlendi — her birini hatırlayın, sonra kontrol için dokunun.', hidden: 'Gizli kelime — açmak için dokunun', revealed: (n, m) => `${m} kelimeden ${n} tanesi açıldı`, showAll: 'Hepsini aç', hideAgain: 'Yeniden gizle', more: (n) => `Hepsini göster (${n})`, less: 'Daha az göster' },
}
// Ayə düymələri: telefonda iç-içə sürüşmə yox — ilk CHIP_LIMIT + "Hamısını göstər (n)"
const CHIP_LIMIT = 30
const KEY_RE = /^\d{1,3}:\d{1,3}$/
const fill = (s, n) => String(s).replace('{n}', n)
const load = loadMutashabihat

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

function Ayah({ k, text, same, lang, t, t2, sim, quiz, open, onReveal }) {
  const [s, a] = k.split(':').map(Number)
  const name = getSurahLocal(s, lang)?.name || SURAH_TABLE[s - 1]?.[5] || s
  return (
    <article className={`twa__ayah${sim ? '' : ' is-main'}${quiz ? ' is-quiz' : ''}`}>
      <header className="twa__head">
        <span className="twa__ref"><b className="ui-num">{s}:{a}</b> {name}</span>
        {sim ? <span className="twa__sim ui-num" style={{ '--p': sim / 100 }}>{fill(t.sim, sim)}</span> : null}
      </header>
      <p className="twa__ar" lang="ar" dir="rtl">
        {text.map((x, i) => {
          if (same.has(i)) return <span key={i}>{x.w} </span>
          if (!quiz) return <span key={i} className="twa__d" style={{ '--i': i }}>{x.w} </span>
          const id = `${k}|${i}`
          const on = open.has(id)
          return (
            <span key={i}>
              <button type="button" className={`twa__d twa__hide${on ? ' is-open' : ''}`} aria-pressed={on} onClick={() => onReveal(id)}>
                <span aria-hidden={on ? undefined : 'true'}>{x.w}</span>{!on && <span className="ui-sr-only">{t2.hidden}</span>}
              </button>{' '}
            </span>
          )
        })}
      </p>
      <a className="twa__open ui-link" href={`${pathFor('quran', lang, s)}?a=${a}`}>{t.open} <Icon name="arrow" size={14} className="ui-flip-rtl" /></a>
    </article>
  )
}

export default function TwinAyahs({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const t2 = pickUi(T2, lang)
  const rootRef = useRef(null)
  const [quiz, setQuiz] = useState(false)
  const [open, setOpen] = useState(() => new Set())
  const [allChips, setAllChips] = useState(false)
  const [data, setData] = useState(null)
  const [err, setErr] = useState(false)
  const [surah, setSurah] = useState(2)
  const [key, setKey] = useState('2:48')
  useEffect(() => { load().then(setData).catch(() => setErr(true)) }, [])
  // Dərin keçid (?tw=2:48#twin-ayahs) — yalnız mount-dan sonra (prerender ilə eyni ilk render)
  useEffect(() => {
    if (!data || typeof window === 'undefined') return
    const want = new URLSearchParams(window.location.search).get('tw')
    if (want && KEY_RE.test(want) && data.pairs[want]) { setSurah(Number(want.split(':')[0])); setKey(want) }
    if (window.location.hash === '#twin-ayahs') {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }))
    }
  }, [data])
  // Ayə və ya rejim dəyişəndə açılmış sözlər sıfırlanır
  useEffect(() => { setOpen(new Set()) }, [key, quiz])
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

  const pickSurah = (s) => { setSurah(s); setAllChips(false); const l = bySurah.get(s); if (l?.length) setKey(l[0]) }
  // Gizli (fərqli) sözlərin hamısı — "3 of 5 revealed"
  const hiddenKeys = useMemo(() => {
    const out = []
    main.forEach((_, i) => { if (!mainSame.has(i)) out.push(`${key}|${i}`) })
    cmp.forEach(c => c.other.forEach((_, i) => { if (!c.ib.has(i)) out.push(`${c.k}|${i}`) }))
    return out
  }, [main, mainSame, cmp, key])
  const reveal = (id) => setOpen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const openCount = hiddenKeys.filter(x => open.has(x)).length
  const allOpen = hiddenKeys.length > 0 && openCount === hiddenKeys.length
  const head = list.slice(0, CHIP_LIMIT)
  const shownChips = allChips || list.length <= CHIP_LIMIT ? list : (head.includes(key) ? head : [...head, key])
  const random = () => {
    if (!data) return
    const ks = Object.keys(data.pairs); const k = ks[Math.floor(Math.random() * ks.length)]
    setSurah(Number(k.split(':')[0])); setKey(k)
  }

  return (
    <section className="ui-section twa" id="twin-ayahs" ref={rootRef} aria-labelledby="tw-title" data-testid="twin-ayahs">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="tw-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        {err ? <p className="twa__note">{t.err}</p> : !data ? <p className="twa__note">{t.loading}</p> : (
          <div className="ui-card twa__card">
            <div className="twa__tools">
              <label className="twa__sel">
                <span>{t.surah}</span>
                <select className="ui-input" value={surah} onChange={(e) => pickSurah(Number(e.target.value))} data-testid="tw-surah">
                  {[...bySurah.keys()].sort((a, b) => a - b).map(s => <option key={s} value={s}>{s}. {getSurahLocal(s, lang)?.name || SURAH_TABLE[s - 1]?.[5]}</option>)}
                </select>
              </label>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={random} data-testid="tw-random"><Icon name="sparkle" className="ui-btn__icon" />{t.random}</button>
              <button type="button" className={`ui-btn ui-btn--sm ${quiz ? 'ui-btn--primary' : 'ui-btn--ghost'}`} aria-pressed={quiz} onClick={() => setQuiz(q => !q)} data-testid="tw-quiz">
                <Icon name="eye" className="ui-btn__icon" />{t2.quiz}
              </button>
              <span className="twa__count ui-num">{fill(t.count, data.meta.ayahs)}</span>
            </div>
            <div className="twa__chips" role="group" aria-label={t.pick}>
              {list.length ? shownChips.map(k => (
                <button key={k} type="button" aria-pressed={k === key} className={`twa__chip ui-num${k === key ? ' is-on' : ''}`} onClick={() => setKey(k)}>{k.split(':')[1]}</button>
              )) : <p className="twa__note">{t.none}</p>}
              {list.length > CHIP_LIMIT && (
                <button type="button" className="twa__chip twa__more" aria-expanded={allChips} onClick={() => setAllChips(v => !v)} data-testid="tw-more">
                  {allChips ? t2.less : t2.more(list.length)}
                </button>
              )}
            </div>
            {quiz && main.length > 0 && (
              <div className="twa__quizbar" data-testid="tw-quizbar">
                <p className="twa__note">{t2.quizHint}</p>
                <span className="twa__qcount ui-num" role="status" aria-live="polite">{t2.revealed(openCount, hiddenKeys.length)}</span>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setOpen(allOpen ? new Set() : new Set(hiddenKeys))}>
                  {allOpen ? t2.hideAgain : t2.showAll}
                </button>
              </div>
            )}
            {main.length > 0 && (
              <div className="twa__pair" key={key} data-testid="tw-pair">
                <Ayah k={key} text={main} same={mainSame} lang={lang} t={t} t2={t2} quiz={quiz} open={open} onReveal={reveal} />
                {cmp.map(c => <Ayah key={c.k} k={c.k} text={c.other} same={c.ib} lang={lang} t={t} t2={t2} sim={c.sim} quiz={quiz} open={open} onReveal={reveal} />)}
              </div>
            )}
            <p className="twa__how"><span className="twa__key" aria-hidden="true" /> {t.diff} · {t.how}</p>
          </div>
        )}
      </div>
    </section>
  )
}
