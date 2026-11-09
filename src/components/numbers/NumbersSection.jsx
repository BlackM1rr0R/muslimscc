// ═══════════════════════════════════════════════════════
// "Rəqəmlərlə" — ümumi məlumat səhifələrində viz v2 bento bölməsi.
//
//   <NumbersSection id="qn" lang={lang} title="Quran rəqəmlərlə" lead="…" alt>
//     <KpiCard span={3} … /> <ChartCard span={8} … />
//   </NumbersSection>
//
// Rəqəmlər yalnız repo-dakı məlumatdan (utils/numbersData.js) — DESIGN.md §5.1.
// Stil: src/styles/NumbersSection.css (yalnız düzülüş; qrafiklər viz.css-dən).
// ═══════════════════════════════════════════════════════
import { BentoGrid } from '../viz'
import { pickUi } from '../../utils/uiText'
import '../../styles/NumbersSection.css'

export const NUM_EYEBROW = { az: 'Rəqəmlərlə', en: 'In numbers', ru: 'В цифрах', ar: 'بالأرقام', tr: 'Rakamlarla' }

export default function NumbersSection({ id, lang, eyebrow, title, lead, alt = false, tight = true, className = '', headingLevel = 'h2', children }) {
  const H = headingLevel
  return (
    <section id={id} className={`ui-section${tight ? ' ui-section--tight' : ''}${alt ? ' ui-section--alt' : ''} nm-sec ${className}`} aria-labelledby={`${id}-h`}>
      <div className="ui-container">
        <div className="ui-section-head nm-sec__head" data-reveal>
          <span className="ui-eyebrow">{eyebrow || pickUi(NUM_EYEBROW, lang, 'en')}</span>
          <H id={`${id}-h`} className="ui-title ui-title--sm">{title}</H>
          {lead && <p className="ui-lead">{lead}</p>}
        </div>
        <BentoGrid className="nm-bento">{children}</BentoGrid>
      </div>
    </section>
  )
}
