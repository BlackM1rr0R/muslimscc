// ═══════════════════════════════════════════════════════
// NarratorGalaxy (v6.3) — "Rəvayət qalaktikası" (/sahaba)
//
//   <NarratorGalaxy lang="az" hrefOf={slug => …} />
//
// • Ən çox hədis rəvayət edən 9 səhabə (data/narratorCounts.js — İbn əl-Cövzi, Bəqiyy ibn Məxləd
//   Müsnədinin sayı) ulduz kimi: ölçü rəvayət sayının kvadrat kökünə görə, orbitlərdə yavaş fırlanır.
//   Ulduza toxun → kart: say, sıra, səhabənin səhifəsi (saytda varsa). Altda müqayisə zolaqları.
// • Hərəkət azaldılıbsa — fırlanma yoxdur.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { NARRATORS } from '../data/narratorCounts'
import '../styles/NarratorGalaxy.css'

const T = {
  az: { ey: 'Rəvayət qalaktikası', title: 'Ən çox hədis rəvayət edən səhabələr', lead: 'Min və ya daha çox hədis rəvayət edən səhabələr — «əl-mukthirun». Ulduzun ölçüsü rəvayət sayına görədir. Ulduza toxunun.', hadiths: 'hədis', rank: 'sıra', open: 'Səhabənin səhifəsi', note: 'Saylar: İbn əl-Cövzi, «Təlqihu fuhumi əhlil-əsər» — Bəqiyy ibn Məxlədin «Müsnəd»inə görə; təkrar isnadlar da sayılır. Başqa müsnədlərdə saylar fərqlidir, çünki hesablama üsulu fərqlidir.', center: 'Sünnə' },
  en: { ey: 'Galaxy of narrators', title: 'The Companions who narrated the most hadiths', lead: 'The Companions who narrated a thousand hadiths or more — “al-mukthirun”. Each star’s size follows the number of narrations. Tap a star.', hadiths: 'hadiths', rank: 'rank', open: 'Companion’s page', note: 'Counts: Ibn al-Jawzi, “Talqih fuhum ahl al-athar”, following the Musnad of Baqi ibn Makhlad; repeated chains are counted. Other musnads give different numbers because they count differently.', center: 'Sunnah' },
  ru: { ey: 'Галактика передатчиков', title: 'Сподвижники, передавшие больше всего хадисов', lead: 'Сподвижники, передавшие тысячу и более хадисов, — «аль-муксирун». Размер звезды — по числу передач. Коснитесь звезды.', hadiths: 'хадисов', rank: 'место', open: 'Страница сподвижника', note: 'Числа: Ибн аль-Джаузи, «Талких фухум ахль аль-асар», по «Муснаду» Баки ибн Махляда; повторные иснады тоже учтены. В других муснадах числа иные, так как подсчёт ведётся иначе.', center: 'Сунна' },
  ar: { ey: 'مجرّة الرواة', title: 'المكثرون من رواية الحديث من الصحابة', lead: 'الصحابة الذين رووا ألف حديث فأكثر — «المكثرون». حجم النجم بعدد المرويات. المس نجمًا.', hadiths: 'حديثًا', rank: 'الترتيب', open: 'صفحة الصحابي', note: 'الأعداد: ابن الجوزي، «تلقيح فهوم أهل الأثر»، على مسند بقيّ بن مخلد، وتدخل فيها الطرق المكررة. وتختلف الأعداد في المسانيد الأخرى لاختلاف طريقة العدّ.', center: 'السنة' },
  tr: { ey: 'Rivayet galaksisi', title: 'En çok hadis rivayet eden sahabiler', lead: 'Bin ve daha fazla hadis rivayet eden sahabiler — «el-müksirûn». Yıldızın büyüklüğü rivayet sayısına göredir. Bir yıldıza dokunun.', hadiths: 'hadis', rank: 'sıra', open: 'Sahabinin sayfası', note: 'Sayılar: İbnü’l-Cevzî, «Telkîhu fuhûmi ehli’l-eser» — Bakî b. Mahled’in «Müsned»ine göre; tekrar isnadlar da sayılır. Diğer müsnedlerde sayılar farklıdır, çünkü sayım yöntemi farklıdır.', center: 'Sünnet' },
}
const MAX = NARRATORS[0].count
const COLORS = ['#ffd36b', '#8fb8ff', '#6ee7b7', '#f59ab0', '#c4a6ff', '#7fd4ff', '#ffb07a', '#b5f07a', '#f0d0ff']

export default function NarratorGalaxy({ lang = 'az', hrefOf }) {
  const t = pickUi(T, lang)
  const [sel, setSel] = useState(0)
  const s = NARRATORS[sel]
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return (
    <section className="ui-section ui-section--tight ngx-wrap">
      <div className="ui-container">
        <div className="ngx ui-card" data-testid="narrator-galaxy">
          <div className="ngx__head">
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 className="ui-title ui-title--sm">{t.title}</h2>
            <p className="ui-lead">{t.lead}</p>
          </div>
          <div className="ngx__grid">
            <div className="ngx__sky" role="group" aria-label={t.title}>
              <div className="ngx__core" aria-hidden="true"><span>{t.center}</span></div>
              {NARRATORS.map((n, i) => {
                const orbit = 17 + i * 3.3                       // orbit radiusu — kətan eninin %-i
                const size = 16 + 44 * Math.sqrt(n.count / MAX)  // px
                const ang = i * 137.5
                return (
                  <div key={n.ar} className="ngx__orbit" style={{ '--r': `${orbit}%`, '--a': `${ang}deg`, '--d': `${70 + i * 18}s` }}>
                    <button type="button" className={`ngx__star${sel === i ? ' is-sel' : ''}`} style={{ '--s': `${size}px`, '--c': COLORS[i] }}
                      onClick={() => setSel(i)} aria-pressed={sel === i} aria-label={`${pickUi(n.name, lang)} — ${fmt(n.count)} ${t.hadiths}`} data-testid="ngx-star">
                      <span className="ngx__glow" aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="ngx__card" aria-live="polite" data-testid="ngx-card">
              <span className="ngx__rank ui-num">#{sel + 1} {t.rank}</span>
              <b className="ngx__name">{pickUi(s.name, lang)}</b>
              {lang !== 'ar' && <span className="ngx__ar ui-arabic" lang="ar">{s.ar}</span>}
              <span className="ngx__count ui-num" data-testid="ngx-count">{fmt(s.count)} <small>{t.hadiths}</small></span>
              {s.slug && hrefOf && <a className="ui-btn ui-btn--secondary ui-btn--sm" href={hrefOf(s.slug)}>{t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" /></a>}
            </div>
          </div>
          <ol className="ngx__bars">
            {NARRATORS.map((n, i) => (
              <li key={n.ar} className={sel === i ? 'is-sel' : ''}>
                <button type="button" onClick={() => setSel(i)} data-testid="ngx-bar">
                  <span className="ngx__bn">{pickUi(n.name, lang)}</span>
                  <span className="ngx__bv ui-num">{fmt(n.count)}</span>
                  <i style={{ width: `${(n.count / MAX) * 100}%`, background: COLORS[i] }} />
                </button>
              </li>
            ))}
          </ol>
          <p className="ngx__note"><Icon name="info" size={14} /> {t.note}</p>
        </div>
      </div>
    </section>
  )
}
