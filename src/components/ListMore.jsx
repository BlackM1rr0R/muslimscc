// ═══════════════════════════════════════════════════════
// Sonsuz siyahının altı (useInfiniteList ilə):
//   • hələ element varsa — sentinel (skeleton kartlar) + "Daha çox göstər"
//     düyməsi (klaviatura istifadəçisi və IntersectionObserver-siz brauzer üçün)
//   • hamısı açılıbsa — sakit sonluq: "Hamısı göstərildi — 1445 hədis"
//
//   <ListMore {...inf} endText="1445 hədis" skeleton={<MyCardSkeletons />} />
// ═══════════════════════════════════════════════════════
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import '../styles/ListMore.css'

const LABELS = {
  az: { more: 'Daha çox göstər', all: 'Hamısı göstərildi' },
  en: { more: 'Show more', all: 'All shown' },
  ru: { more: 'Показать ещё', all: 'Показаны все' },
  ar: { more: 'عرض المزيد', all: 'تم عرض الكل' },
  tr: { more: 'Daha fazla göster', all: 'Tümü gösterildi' },
}

function DefaultSkeleton() {
  return (
    <>
      <div className="ui-skeleton ui-skeleton--card lm-skel" />
      <div className="ui-skeleton ui-skeleton--card lm-skel" />
    </>
  )
}

export default function ListMore({
  count, total, hasMore, loadMore, sentinelRef,
  endText, skeleton, minForEnd = 0, className = '',
}) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.en
  if (!total) return null

  if (!hasMore) {
    // Qısa siyahıda (bir partiya) sonluq lazım deyil — say onsuz da yuxarıdadır
    if (total <= minForEnd) return null
    return (
      <p className={`lm-end ${className}`}>
        <span className="lm-end__line" aria-hidden="true" />
        <span className="lm-end__text">
          <Icon name="check" size={16} className="lm-end__icon" />
          {l.all}{endText ? <> — <span className="ui-num">{endText}</span></> : null}
        </span>
        <span className="lm-end__line" aria-hidden="true" />
      </p>
    )
  }

  return (
    <div className={`lm ${className}`}>
      {/* Sentinel: ekrana yaxınlaşanda növbəti partiya özü açılır */}
      <div className="lm-sentinel" ref={sentinelRef} aria-hidden="true">
        {skeleton || <DefaultSkeleton />}
      </div>
      <button type="button" className="ui-btn ui-btn--secondary lm-btn" onClick={loadMore}>
        {l.more}
        <span className="lm-btn__count ui-num" dir="ltr">{count} / {total}</span>
      </button>
    </div>
  )
}
