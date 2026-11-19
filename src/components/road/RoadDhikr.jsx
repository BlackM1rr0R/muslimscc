// ═══════════════════════════════════════════════════════
// Yolda rejimi — iri zikr sayğacı (/on-the-road)
//
// • Zikrlər saytın öz siyahısıdır (data/dhikr → DHIKRS: ərəbcə, transliterasiya, hədəf, mənbə) —
//   yeni mətn yazılmır. Mənbə localizeSource ilə göstərilir.
// • Toxunuş: tıqqıltı (WebAudio, fayl yoxdur) + titrəmə (dəstəklənirsə; "hərəkəti azalt"da yox).
//   Say günün zikr sayına da düşür (utils/myDay — yalnız şəxsi; ardıcıllıq/reytinq yoxdur).
// ═══════════════════════════════════════════════════════
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { DHIKRS } from '../../data/dhikr'
import { localizeSource } from '../../utils/sourceNames'

const T = {
  az: { tap: 'Saymaq üçün toxunun', reset: 'Sıfırla', prev: 'Əvvəlki zikr', next: 'Növbəti zikr', of: (c, n) => `${c} / ${n}`, done: 'Hədəfə çatdınız', source: 'Mənbə' },
  en: { tap: 'Tap to count', reset: 'Reset', prev: 'Previous dhikr', next: 'Next dhikr', of: (c, n) => `${c} of ${n}`, done: 'Target reached', source: 'Source' },
  ru: { tap: 'Нажмите, чтобы считать', reset: 'Сбросить', prev: 'Предыдущий зикр', next: 'Следующий зикр', of: (c, n) => `${c} из ${n}`, done: 'Цель достигнута', source: 'Источник' },
  ar: { tap: 'اضغط للعدّ', reset: 'تصفير', prev: 'الذكر السابق', next: 'الذكر التالي', of: (c, n) => `${c} من ${n}`, done: 'بلغت العدد', source: 'المصدر' },
  tr: { tap: 'Saymak için dokunun', reset: 'Sıfırla', prev: 'Önceki zikir', next: 'Sonraki zikir', of: (c, n) => `${c} / ${n}`, done: 'Hedefe ulaştınız', source: 'Kaynak' },
}

/** idx — seçilmiş zikr; count — say; onTap() / onReset() / onPick(i) — səhifə idarə edir */
export default function RoadDhikr({ idx, count, lang, onTap, onReset, onPick }) {
  const t = pickUi(T, lang, 'en')
  const d = DHIKRS[idx] || DHIKRS[0]
  const target = d.target
  const reached = count >= target
  const name = d[lang] || d.en
  const n = DHIKRS.length

  return (
    <div className="road-dhikr">
      <div className="road-dhikr__pick">
        <button type="button" className="road-btn road-btn--round" onClick={() => onPick((idx - 1 + n) % n)} aria-label={t.prev}>
          <Icon name="chevronLeft" size={36} className="ui-flip-rtl" />
        </button>
        <div className="road-dhikr__name">
          <p className="road-dhikr__ar" lang="ar" dir="rtl">{d.arabic}</p>
          {lang !== 'ar' && <p className="road-dhikr__tr">{name}</p>}
        </div>
        <button type="button" className="road-btn road-btn--round" onClick={() => onPick((idx + 1) % n)} aria-label={t.next}>
          <Icon name="chevron" size={36} className="ui-flip-rtl" />
        </button>
      </div>

      {/* Ad məzmundan gəlir (aria-label yox — axe label-content-name-mismatch): görünən yazı
          ("Tap to count" / "Target reached") adın əvvəlindədir (WCAG 2.5.3). Ad tək ui-sr-only
          blokundadır — ayrı span-lar Chrome-da "Tap to count : …" kimi artıq boşluq verirdi */}
      <button type="button" className={`road-tap${reached ? ' is-done' : ''}`} onClick={onTap} data-testid="road-tap">
        <span className="road-tap__count ui-num" aria-hidden="true">{count}</span>
        <span className="road-tap__of ui-num" aria-hidden="true">{t.of(Math.min(count, target), target)}</span>
        <span className="road-tap__hint" aria-hidden="true">{reached ? t.done : t.tap}</span>
        <span className="ui-sr-only">{`${reached ? t.done : t.tap}: ${name} — ${t.of(count, target)}`}</span>
      </button>

      <div className="road-row">
        <button type="button" className="road-btn road-btn--wide" onClick={onReset} disabled={!count}>
          <Icon name="refresh" size={24} /> {t.reset}
        </button>
      </div>
      <p className="road-hint">{t.source}: {localizeSource(d.source, lang)}</p>
    </div>
  )
}
