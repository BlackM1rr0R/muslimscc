// ═══════════════════════════════════════════════════════
// SurahRootCloud — surənin kök buludu (/quran/<surə>)
//
//   <SurahRootCloud surah={55} lang="az" />
//
// • Düymə ilə açılır (kök indeksi ~480 KB — yalnız istəyəndə yüklənir).
// • Surədə ən çox keçən 24 kök (utils/surahRoots); ölçü — işlənmə sayı.
//   Köməkçi köklər (قول, كون, الله) çıxarılıb ki, surənin mövzusu görünsün.
// • Kökə toxunuş → /quran-roots?root=… (bütün Quranda həmin kök).
// Mənbə: Quranic Arabic Corpus morfologiyası (public/data/quran-roots.json).
// Stillər: src/styles/SurahRootCloud.css
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import { loadRootsIndex } from '../../utils/quranRoots'
import { surahRoots } from '../../utils/surahRoots'
import { pathFor } from '../../seo/routes'
import '../../styles/SurahRootCloud.css'

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
  const t = T[lang] || T.az
  const [state, setState] = useState(null) // null | 'loading' | 'err' | [{root,n}]
  const open = () => {
    if (Array.isArray(state)) { setState(null); return }
    setState('loading')
    loadRootsIndex().then(d => setState(surahRoots(d.roots, surah))).catch(() => setState('err'))
  }
  const list = Array.isArray(state) ? state : []
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
              return (
                <a key={x.root} className={`src-cloud__w src-cloud__w--${i % 3}`} style={{ '--k': k.toFixed(3), '--i': i }}
                  href={`${pathFor('quranroots', lang)}?root=${encodeURIComponent(x.root)}`} title={t.n(x.n)}>
                  <span className="ui-arabic" lang="ar" dir="rtl">{[...x.root].join(' ')}</span>
                  <small className="ui-num">{x.n}</small>
                </a>
              )
            })}
          </div>
          <p className="src-cloud__src">{t.src}</p>
        </figure>
      )}
    </div>
  )
}
