// ═══════════════════════════════════════════════════════
// RootGraph — kök sözün "ulduz" qrafı (/quran-roots)
//   mərkəz: kök · daxili halqa: törəmə formalar (ölçü — işlənmə sayı)
//   xarici halqa: eyni ayələrdə ən çox birgə gələn köklər (utils/quranRoots.relatedRoots)
// Xətlər və dairələr SVG-dədir; düymələr adi HTML-dir (klaviatura, fokus, ekran oxuyucu).
// Animasiya: bir dəfəlik, yalnız transform/opacity + stroke-dashoffset.
// Stillər: src/styles/RootGraph.css
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { spacedRoot } from '../utils/quranRoots'
import '../styles/RootGraph.css'

const T = {
  az: { title: 'Kök qrafı', sub: 'Mərkəzdə kök, ətrafında formaları; xaricdə eyni ayələrdə birgə gələn köklər.', forms: 'Formalar', related: 'Qonşu köklər', times: (n) => `${n} dəfə`, together: (n) => `${n} ayədə birlikdə`, openRoot: (r) => `${r} kökünü aç`, filter: (l) => `${l} formasına görə süz`, none: 'Birgə gələn kök tapılmadı.' },
  en: { title: 'Root graph', sub: 'The root in the centre, its forms around it; outside, roots that share the same verses.', forms: 'Forms', related: 'Neighbouring roots', times: (n) => `${n}×`, together: (n) => `together in ${n} verses`, openRoot: (r) => `Open root ${r}`, filter: (l) => `Filter by ${l}`, none: 'No co-occurring roots found.' },
  ru: { title: 'Граф корня', sub: 'В центре корень, вокруг — его формы; снаружи — корни из тех же аятов.', forms: 'Формы', related: 'Соседние корни', times: (n) => `${n} раз`, together: (n) => `вместе в ${n} аятах`, openRoot: (r) => `Открыть корень ${r}`, filter: (l) => `Отфильтровать по ${l}`, none: 'Совместных корней не найдено.' },
  tr: { title: 'Kök grafiği', sub: 'Ortada kök, çevresinde türevleri; dışta aynı ayetlerde birlikte geçen kökler.', forms: 'Türevler', related: 'Komşu kökler', times: (n) => `${n} kez`, together: (n) => `${n} ayette birlikte`, openRoot: (r) => `${r} kökünü aç`, filter: (l) => `${l} türevine göre süz`, none: 'Birlikte geçen kök bulunamadı.' },
  ar: { title: 'شجرة الجذر', sub: 'الجذر في المركز وصيغه حوله، وفي الخارج جذور تشترك معه في الآيات نفسها.', forms: 'الصيغ', related: 'جذور مجاورة', times: (n) => `${n} مرة`, together: (n) => `معًا في ${n} آية`, openRoot: (r) => `افتح الجذر ${r}`, filter: (l) => `صفِّ حسب ${l}`, none: 'لم يُعثر على جذور مشتركة.' },
}

const VB = 600, C = VB / 2, R_IN = 150, R_OUT = 255
const MAX_FORMS = 10

const ring = (n, r, offset = 0) => Array.from({ length: n }, (_, i) => {
  const a = -Math.PI / 2 + offset + (i * 2 * Math.PI) / Math.max(1, n)
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
})
const pct = (v) => `${((v / VB) * 100).toFixed(2)}%`

export default function RootGraph({ root, forms, related, activeForm, onForm, onRoot }) {
  const { lang } = useLang()
  const t = T[lang] || T.az

  const layout = useMemo(() => {
    const top = forms.slice().sort((a, b) => b.count - a.count).slice(0, MAX_FORMS)
    const maxC = Math.max(1, ...top.map(f => f.count))
    const inner = ring(top.length, R_IN).map((p, i) => ({ ...p, f: top[i], s: 0.72 + 0.5 * Math.sqrt(top[i].count / maxC) }))
    const maxS = Math.max(1e-6, ...related.map(r => r.score))
    const outer = ring(related.length, R_OUT, related.length ? Math.PI / related.length : 0)
      .map((p, i) => ({ ...p, r: related[i], w: 0.6 + 2.4 * (related[i].score / maxS) }))
    return { inner, outer }
  }, [forms, related])

  return (
    <section className="ui-card rg" aria-labelledby="rg-title" data-testid="root-graph">
      <h2 id="rg-title" className="ui-title ui-title--sm">{t.title}</h2>
      <p className="rg__sub">{t.sub}</p>
      <div className="rg__stage" key={root}>
        <svg className="rg__svg" viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true" focusable="false">
          <circle className="rg__orbit" cx={C} cy={C} r={R_IN} />
          <circle className="rg__orbit rg__orbit--out" cx={C} cy={C} r={R_OUT} />
          {layout.outer.map((p, i) => (
            <line key={p.r.root} className="rg__link rg__link--out" x1={C} y1={C} x2={p.x} y2={p.y}
              style={{ strokeWidth: p.w, '--i': i }} pathLength="1" />
          ))}
          {layout.inner.map((p, i) => (
            <line key={p.f.lemma} className={`rg__link${activeForm === p.f.lemma ? ' is-on' : ''}`} x1={C} y1={C} x2={p.x} y2={p.y}
              style={{ '--i': i }} pathLength="1" />
          ))}
        </svg>

        <span className="rg__root ui-arabic" lang="ar" dir="rtl" style={{ left: '50%', top: '50%' }}>{spacedRoot(root)}</span>

        <ul className="rg__nodes" aria-label={t.forms}>
          {layout.inner.map((p, i) => (
            <li key={p.f.lemma} style={{ left: pct(p.x), top: pct(p.y), '--i': i, '--s': p.s.toFixed(3) }}>
              <button type="button" className="rg__form" aria-pressed={activeForm === p.f.lemma}
                aria-label={`${p.f.lemma} — ${t.times(p.f.count)}. ${t.filter(p.f.lemma)}`}
                onClick={() => onForm(activeForm === p.f.lemma ? null : p.f.lemma)}>
                <span className="ui-arabic" lang="ar">{p.f.lemma}</span>
                <small className="ui-num">{p.f.count}</small>
              </button>
            </li>
          ))}
        </ul>
        <ul className="rg__nodes" aria-label={t.related}>
          {layout.outer.map((p, i) => (
            <li key={p.r.root} style={{ left: pct(p.x), top: pct(p.y), '--i': i + layout.inner.length }}>
              <button type="button" className="rg__rel ui-arabic" lang="ar" dir="rtl"
                title={t.together(p.r.co)} aria-label={`${t.openRoot(spacedRoot(p.r.root))} — ${t.together(p.r.co)}`}
                onClick={() => onRoot(p.r.root)}>
                {spacedRoot(p.r.root)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rg__legend">
        <span><i className="rg__dot" /> {t.forms}</span>
        <span><i className="rg__dot rg__dot--out" /> {t.related}</span>
        {!related.length && <span className="rg__none">{t.none}</span>}
      </div>
    </section>
  )
}
