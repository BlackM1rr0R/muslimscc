// ═══════════════════════════════════════════════════════
// P3 — Hisnul-Müslim fəsillərini (public/data/hisn/<dil>.json) mətn + tərcümə + mənbə ilə göstərir.
// Heç bir dini mətn burada yazılmır — hamısı saytın məlumatındandır; mənbə localizeSource ilə.
// Yükləmə YALNIZ mount-dan sonra (prerender-də boş). Əlavə dillərdə ingiliscə nüsxə.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { pathFor } from '../../seo/routes'
import { localizeSource } from '../../utils/sourceNames'

const HISN_LANGS = new Set(['az', 'en', 'ru', 'ar', 'tr'])
const cache = new Map()
export function loadHisn(lang) {
  const l = HISN_LANGS.has(lang) ? lang : 'en'
  if (!cache.has(l)) {
    const p = fetch(`/data/hisn/${l}.json`).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d) => new Map((d?.chapters || []).map((c) => [c.id, c])))
    p.catch(() => cache.delete(l))
    cache.set(l, p)
  }
  return cache.get(l)
}

/** → Map(id → fəsil) | null (yüklənir) | false (alınmadı) */
export function useHisn(lang, on = true) {
  const [map, setMap] = useState(null)
  useEffect(() => {
    if (!on) return undefined
    let alive = true
    loadHisn(lang).then((m) => { if (alive) setMap(m) }).catch(() => { if (alive) setMap(false) })
    return () => { alive = false }
  }, [lang, on])
  return map
}

/** Fəsillərin bütün maddələri; başlıq + "Hisnul-Müslimdə aç" keçidi */
export default function HisnItems({ map, ids, lang, siteLang = lang, openLabel, testId }) {
  if (!map || !ids?.length) return null
  const chapters = ids.map((id) => map.get(id)).filter(Boolean)
  if (!chapters.length) return null
  return (
    <div className="p3-hisn" data-testid={testId}>
      {chapters.map((c) => (
        <div key={c.id} className="p3-hisn__ch">
          <h4 className="p3-hisn__title">{c.title}</h4>
          {(c.items || []).map((it, i) => (
            <div key={i} className="p3-hisn__item">
              <p className="p3-hisn__ar" lang="ar" dir="rtl">{it.ar}</p>
              {lang !== 'ar' && it.text && <p className="p3-hisn__tr">{it.text}</p>}
              {it.src && <small className="p3-hisn__src" dir="auto">{localizeSource(it.src, lang)}</small>}
            </div>
          ))}
          <a className="p3-hisn__open" href={`${pathFor('hisn', siteLang)}#hs-${c.id}`}>{openLabel}</a>
        </div>
      ))}
    </div>
  )
}
