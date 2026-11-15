// ═══════════════════════════════════════════════════════
// SahabaNarrations (v6.9) — səhabə profilində "Saytdakı rəvayətləri"
//
//   <SahabaNarrations slug="abu-hurairah" lang="az" />
//
// Ravi hadith-api ingilis nəşrinin başlığından (scripts/build-hadith-full.mjs →
// data/hadithFull.js), profil — data/hadithNarrators.js → SAHABA_EN. Hədis
// mətni /hadith ilə eyni məlumatdandır (utils/hadithData — tənbəl yüklənir).
// Hər hədis öz səhifəsinə (/hadith/<id>) aparır.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { hadithIdsBySahaba } from '../utils/hadithFull'
import { loadHadithData, peekHadithData } from '../utils/hadithData'
import { localizeSource } from '../utils/sourceNames'
import { pathFor } from '../seo/routes'
import { HADITH_IDS } from '../seo/hadithIds'
import { pickUi } from '../utils/uiText'
import { isPlainClick } from './PageLink'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

const T = {
  az: { title: 'Saytdakı rəvayətləri', lead: 'Bu səhabənin rəvayət etdiyi hədislər (saytdakı hədis siyahısından).', more: 'Hamısını göstər', open: 'Hədisə bax' },
  en: { title: 'Narrations on this site', lead: 'Hadith narrated by this Companion (from the site’s hadith list).', more: 'Show all', open: 'Open hadith' },
  ru: { title: 'Его передачи на сайте', lead: 'Хадисы, переданные этим сподвижником (из списка хадисов сайта).', more: 'Показать все', open: 'Открыть хадис' },
  ar: { title: 'مروياته في الموقع', lead: 'الأحاديث التي رواها هذا الصحابي من قائمة أحاديث الموقع.', more: 'عرض الكل', open: 'افتح الحديث' },
  tr: { title: 'Sitedeki rivayetleri', lead: 'Bu sahabinin rivayet ettiği hadisler (sitenin hadis listesinden).', more: 'Tümünü göster', open: 'Hadise git' },
}
const FIRST = 6
const PAGE_IDS = new Set(HADITH_IDS.map(String))

export default function SahabaNarrations({ slug, lang }) {
  const u = pickUi(T, lang, 'en')
  const ids = useMemo(() => hadithIdsBySahaba(slug), [slug])
  const [data, setData] = useState(() => peekHadithData(lang))
  const [all, setAll] = useState(false)
  const nav = useNavigate()
  useEffect(() => {
    if (!ids.length) return undefined
    let live = true
    loadHadithData(lang).then(d => { if (live) setData(d) }).catch(() => { /* bölmə sadəcə görünmür */ })
    return () => { live = false }
  }, [ids.length, lang])
  const items = useMemo(() => {
    if (!data) return []
    const want = new Set(ids)
    return data.list.filter(h => want.has(Number(h.id)))
  }, [data, ids])
  if (!ids.length || !items.length) return null
  const shown = all ? items : items.slice(0, FIRST)
  return (
    <section id="sp-narrations" className="sp-sec" aria-labelledby="sp-narr-h" data-testid="sahaba-narrations">
      <h2 id="sp-narr-h" className="sp-sec__title" tabIndex={-1}>{u.title} <span className="ui-num sp-narr__n">{items.length}</span></h2>
      <p className="sp-narr__lead">{u.lead}</p>
      <ul className="sp-narr__list">
        {shown.map(h => {
          const href = PAGE_IDS.has(String(h.id)) ? pathFor('hadith', lang, String(h.id)) : null
          const text = (h.text || '').trim()
          return (
            <li key={h.id} className="ui-quote sp-quote sp-narr__item">
              <p className="ui-quote__ar ui-arabic sp-quote__ar" lang="ar" dir="rtl">{h.ar}</p>
              {text && text !== (h.ar || '').trim() && <p className="sp-quote__text">{text}</p>}
              <p className="ui-quote__src sp-narr__src">
                — {localizeSource(h.source, lang)}
                {href && (
                  <a className="ui-link sp-narr__open" href={href}
                    onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); nav(href) } }}>
                    {u.open} <Icon name="arrow" size={13} className="ui-link__arrow ui-flip-rtl" />
                  </a>
                )}
              </p>
            </li>
          )
        })}
      </ul>
      {!all && items.length > FIRST && (
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAll(true)}>
          {u.more} ({items.length})
        </button>
      )}
    </section>
  )
}
