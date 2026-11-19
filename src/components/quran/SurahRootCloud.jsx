// ═══════════════════════════════════════════════════════
// SurahRootCloud — surənin kök buludu (/quran/<surə>)
//
//   <SurahRootCloud surah={55} lang="az" />
//
// • Düymə ilə açılır (kök indeksi ~480 KB — yalnız istəyəndə yüklənir).
// • Surədə ən çox keçən 24 kök (utils/surahRoots); ölçü — işlənmə sayı.
//   Köməkçi köklər (قول, كون, الله) çıxarılıb ki, surənin mövzusu görünsün.
// • Kökə toxunuş → /quran-roots?root=… (bütün Quranda həmin kök).
// • Əvvəlcə ən çox keçən 12 kök, "Hamısını göstər (n)" ilə qalanı (telefonda bulud 3 ekran tuturdu).
// • Rəng — tezlik pilləsi: ilk 3 — əsas yaşıl, sonrakı 6 — qızılı, qalanı — mətn rəngi.
// • Kökün altında — YALNIZ saytın lüğətində bu kökdən olan termin varsa (data/glossaryRoots.js,
//   məs. وقي → Taqwa); yoxdursa heç nə yazılmır, məna uydurulmur.
// Mənbə: Quranic Arabic Corpus morfologiyası (public/data/quran-roots.json).
// Stillər: src/styles/SurahRootCloud.css
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import { loadRootsIndex } from '../../utils/quranRoots'
import { surahRoots } from '../../utils/surahRoots'
import { pathFor } from '../../seo/routes'
import '../../styles/SurahRootCloud.css'
import { pickUi } from '../../utils/uiText'

const T2 = {
  az: { more: (n) => `Hamısını göstər (${n})`, less: 'Azını göstər', times: (k) => `${k} dəfə`, term: 'lüğət termini' },
  en: { more: (n) => `Show all (${n})`, less: 'Show fewer', times: (k) => (k === 1 ? '1 time' : `${k} times`), term: 'glossary term' },
  ru: { more: (n) => `Показать все (${n})`, less: 'Показать меньше', times: (k) => `${k} раз`, term: 'термин словаря' },
  tr: { more: (n) => `Hepsini göster (${n})`, less: 'Daha az göster', times: (k) => `${k} kez`, term: 'sözlük terimi' },
  ar: { more: (n) => `عرض الكل (${n})`, less: 'عرض أقل', times: (k) => `${k} مرة`, term: 'مصطلح في المعجم' },
}
const TOP = 12
const cap = (id) => id.charAt(0).toUpperCase() + id.slice(1)
// Lüğət: kök → termin(lər) (id-lər: "taqwa", "qiyamah")
const byRoot = (gr) => {
  const m = new Map()
  for (const [id, [root]] of Object.entries(gr || {})) { if (!m.has(root)) m.set(root, []); m.get(root).push(id) }
  return m
}

const T = {
  az: { btn: 'Surənin kök buludu', title: 'Bu surədə ən çox keçən köklər', n: (k) => `${k} dəfə`, loading: 'Yüklənir…', err: 'Köklərin siyahısını yükləmək alınmadı.', src: 'Mənbə: Quranic Arabic Corpus' },
  en: { btn: 'Root cloud of the surah', title: 'The most frequent roots in this surah', n: (k) => `${k}×`, loading: 'Loading…', err: 'Could not load the root index.', src: 'Source: Quranic Arabic Corpus' },
  // lang-ok[Quranic,Arabic,Corpus]: mənbənin adı (Quranic Arabic Corpus)
  ru: { btn: 'Облако корней суры', title: 'Самые частые корни в этой суре', n: (k) => `${k} раз`, loading: 'Загрузка…', err: 'Не удалось загрузить индекс корней.', src: 'Источник: Quranic Arabic Corpus' },
  // lang-ok[Quranic,Arabic,Corpus]: mənbənin adı (Quranic Arabic Corpus)
  tr: { btn: 'Surenin kök bulutu', title: 'Bu surede en sık geçen kökler', n: (k) => `${k} kez`, loading: 'Yükleniyor…', err: 'Kök dizini yüklenemedi.', src: 'Kaynak: Quranic Arabic Corpus' },
  // lang-ok[Quranic,Arabic,Corpus]: mənbənin adı (Quranic Arabic Corpus)
  ar: { btn: 'سحابة جذور السورة', title: 'أكثر الجذور ورودًا في هذه السورة', n: (k) => `${k} مرة`, loading: 'جارٍ التحميل…', err: 'تعذّر تحميل فهرس الجذور.', src: 'المصدر: Quranic Arabic Corpus' },
}

export default function SurahRootCloud({ surah, lang = 'az' }) {
  const t = pickUi(T, lang)
  const t2 = pickUi(T2, lang)
  const [state, setState] = useState(null) // null | 'loading' | 'err' | [{root,n}]
  const [terms, setTerms] = useState(() => new Map())
  const [all, setAll] = useState(false)
  const open = () => {
    if (Array.isArray(state)) { setState(null); return }
    setState('loading')
    setAll(false)
    import('../../data/glossaryRoots').then(m => setTerms(byRoot(m.GLOSSARY_ROOTS))).catch(() => {})
    loadRootsIndex().then(d => setState(surahRoots(d.roots, surah))).catch(() => setState('err'))
  }
  const full = Array.isArray(state) ? state : []
  // tier — tezlik pilləsi (sıra ilə: siyahı artıq çoxdan aza düzülüb)
  const list = (all ? full : full.slice(0, TOP)).map((x, i) => ({ ...x, tier: i < 3 ? 0 : i < 9 ? 1 : 2 }))
  const max = Math.max(1, ...list.map(x => x.n)), min = Math.min(...list.map(x => x.n), max)
  // Bulud forması: böyüklər ortada
  const cloud = []
  list.forEach((x, i) => { if (i % 2) cloud.push(x); else cloud.unshift(x) })

  return (
    <div className="src-cloud" data-testid="surah-root-cloud">
      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={open} aria-expanded={Array.isArray(state)}>
        <Icon name="quranroots" className="ui-btn__icon" /> {t.btn}
      </button>
      {state === 'loading' && <p className="src-cloud__msg">{t.loading}</p>}
      {state === 'err' && <p className="src-cloud__msg" role="alert">{t.err}</p>}
      {list.length > 0 && (
        <figure className="src-cloud__box">
          <figcaption className="src-cloud__title">{t.title}</figcaption>
          <div className="src-cloud__words">
            {cloud.map((x, i) => {
              const k = max === min ? 0.5 : (x.n - min) / (max - min)
              const g = (terms.get(x.root) || []).slice(0, 2).map(cap).join(' · ')
              const spaced = [...x.root].join(' ')
              return (
                <a key={x.root} className={`src-cloud__w src-cloud__w--${x.tier}`} style={{ '--k': k.toFixed(3), '--i': i }}
                  href={`${pathFor('quranroots', lang)}?root=${encodeURIComponent(x.root)}`} title={t.n(x.n)}
                  aria-label={`${spaced} — ${t2.times(x.n)}${g ? ` · ${t2.term}: ${g}` : ''}`}>
                  <span className="ui-arabic" lang="ar" dir="rtl">{spaced}</span>
                  <small className="ui-num">{x.n}</small>
                  {g && <small className="src-cloud__g">{g}</small>}
                </a>
              )
            })}
          </div>
          {full.length > TOP && (
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm src-cloud__more" aria-expanded={all} onClick={() => setAll(v => !v)} data-testid="root-cloud-more">
              {all ? t2.less : t2.more(full.length)}
            </button>
          )}
          <p className="src-cloud__src">{t.src}</p>
        </figure>
      )}
    </div>
  )
}
