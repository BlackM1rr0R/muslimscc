// ═══════════════════════════════════════════════════════
// DayStory (v5.8) — ana səhifə: "Muslims.cc ilə bir gün" — sürüşdükcə açılan hekayə
//
//   <DayStory lang="az" onNavigate={goTo} />
//
// • Solda (telefonda yuxarıda) yapışqan "səma" səhnəsi: Sübhdən İşaya rəng dəyişir,
//   günəş/ay qövs boyu hərəkət edir; sağda 5 addım — hər biri saytın bir bölməsinə aparır.
// • Hansı addımın aktiv olduğunu IntersectionObserver deyir (hər brauzerdə işləyir);
//   səma qatları yalnız opacity, disk yalnız transform ilə keçir — sonsuz animasiya yox.
//   animation-timeline dəstəklənirsə — addımlar sürüşmə ilə yumşaq girir (yalnız bəzək).
// • Mətnlər — sadə UI cümlələri (dini hökm/sitat yoxdur).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import '../../styles/DayStory.css'

const T = {
  az: { ey: 'Bir gün', title: 'Muslims.cc ilə bir gün', lead: 'Sübhdən İşaya — gün boyu hər vaxtın öz bölməsi.', go: 'Aç' },
  en: { ey: 'One day', title: 'A day with Muslims.cc', lead: 'From Fajr to Isha — a section for every part of the day.', go: 'Open' },
  ru: { ey: 'Один день', title: 'Один день с Muslims.cc', lead: 'От Фаджра до Иши — свой раздел для каждой части дня.', go: 'Открыть' },
  ar: { ey: 'يوم واحد', title: 'يوم مع Muslims.cc', lead: 'من الفجر إلى العشاء — لكل وقت من اليوم قسمه.', go: 'افتح' },
  tr: { ey: 'Bir gün', title: 'Muslims.cc ile bir gün', lead: 'Sabahtan yatsıya — günün her vakti için bir bölüm.', go: 'Aç' },
}
const STEPS = [
  { page: 'dhikr', icon: 'dhikr',
    name: { az: 'Sübh', en: 'Fajr', ru: 'Фаджр', ar: 'الفجر', tr: 'Sabah' },
    text: { az: 'Gün sübh namazı ilə açılır — ardınca səhər zikrləri, sayğacla.', en: 'The day opens with Fajr — then the morning adhkar, with a counter.', ru: 'День начинается с Фаджра — затем утренние азкары со счётчиком.', ar: 'يبدأ اليوم بصلاة الفجر — ثم أذكار الصباح مع العدّاد.', tr: 'Gün sabah namazıyla açılır — ardından sayaçla sabah zikirleri.' },
    cta: { az: 'Zikrlər', en: 'Dhikr', ru: 'Зикр', ar: 'الذكر', tr: 'Zikir' } },
  { page: 'hadith', icon: 'hadith',
    name: { az: 'Zöhr', en: 'Dhuhr', ru: 'Зухр', ar: 'الظهر', tr: 'Öğle' },
    text: { az: 'Günorta fasiləsində bir hədis — mənbəyi və dərəcəsi ilə.', en: 'A hadith in the midday break — with its source and grade.', ru: 'Хадис в обеденный перерыв — с источником и степенью достоверности.', ar: 'حديث في استراحة الظهيرة — مع مصدره ودرجته.', tr: 'Öğle arasında bir hadis — kaynağı ve derecesiyle.' },
    cta: { az: 'Hədislər', en: 'Hadith', ru: 'Хадисы', ar: 'الأحاديث', tr: 'Hadisler' } },
  { page: 'quran', icon: 'quran',
    name: { az: 'Əsr', en: 'Asr', ru: 'Аср', ar: 'العصر', tr: 'İkindi' },
    text: { az: 'Axşamüstü bir neçə ayə — tərcümə, qiraət və xətm planı.', en: 'A few ayahs in the afternoon — translation, recitation and a khatm plan.', ru: 'Несколько аятов после полудня — перевод, чтение и план хатма.', ar: 'آيات في العصر — ترجمة وتلاوة وخطة ختم.', tr: 'İkindide birkaç ayet — meal, kıraat ve hatim planı.' },
    cta: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' } },
  { page: 'duas', icon: 'duas',
    name: { az: 'Məğrib', en: 'Maghrib', ru: 'Магриб', ar: 'المغرب', tr: 'Akşam' },
    text: { az: 'Gün batır — axşam zikrləri və gündəlik dualar.', en: 'The sun sets — evening adhkar and everyday duas.', ru: 'Солнце садится — вечерние азкары и дуа на каждый день.', ar: 'تغرب الشمس — أذكار المساء وأدعية اليوم.', tr: 'Güneş batar — akşam zikirleri ve günlük dualar.' },
    cta: { az: 'Dualar', en: 'Duas', ru: 'Дуа', ar: 'الأدعية', tr: 'Dualar' } },
  { page: 'muhasabah', icon: 'muhasabah',
    name: { az: 'İşa', en: 'Isha', ru: 'Иша', ar: 'العشاء', tr: 'Yatsı' },
    text: { az: 'Gecə — günün qısa hesabı (mühasəbə) və yuxudan əvvəlki dualar.', en: 'Night — a short review of the day (muhasabah) and the duas before sleep.', ru: 'Ночь — короткий итог дня (мухасаба) и дуа перед сном.', ar: 'الليل — محاسبة قصيرة لليوم وأدعية النوم.', tr: 'Gece — günün kısa muhasebesi ve uyku öncesi dualar.' },
    cta: { az: 'Mühasəbə', en: 'Muhasabah', ru: 'Мухасаба', ar: 'المحاسبة', tr: 'Muhasebe' } },
]

// Günəşin (İşada — ayın) qövsdəki bucağı: Sübh üfüqdə solda, Zöhr zenitdə, Məğrib üfüqdə sağda
const ORB_DEG = [-72, 0, 40, 74, -38]

export default function DayStory({ lang = 'az', onNavigate }) {
  const t = pickUi(T, lang)
  const [act, setAct] = useState(0)
  const listRef = useRef(null)
  useEffect(() => {
    const items = listRef.current?.querySelectorAll('[data-ds]')
    if (!items?.length || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver((ens) => {
      for (const en of ens) if (en.isIntersecting) setAct(Number(en.target.dataset.ds))
    }, { rootMargin: '-45% 0px -45% 0px' })
    items.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
  const L = (o) => pickUi(o, lang)
  return (
    <section className="ui-section ds" aria-labelledby="ds-ttl" data-step={act}>
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="ds-ttl" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        <div className="ds__wrap">
          <div className="ds__stage" aria-hidden="true">
            <div className="ds__sky">
              {STEPS.map((_, i) => <i key={i} className={`ds__layer ds__layer--${i}${i === act ? ' is-on' : ''}`} />)}
              <span className="ds__orb" style={{ '--deg': `${ORB_DEG[act]}deg` }} />
              <span className="ds__stars" />
              <span className="ds__ground" />
              <span className="ds__label">{L(STEPS[act].name)}</span>
            </div>
            <ol className="ds__ticks">{STEPS.map((s, i) => <li key={i} className={i === act ? 'is-on' : i < act ? 'is-done' : ''}>{L(s.name)}</li>)}</ol>
          </div>
          <ol className="ds__steps" ref={listRef}>
            {STEPS.map((s, i) => (
              <li key={s.page} data-ds={i} className={`ds__step${i === act ? ' is-on' : ''}`}>
                <span className="ds__time">{L(s.name)}</span>
                <p className="ds__text">{L(s.text)}</p>
                <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor(s.page, lang)}
                  onClick={(e) => { if (onNavigate && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); onNavigate(s.page) } }}>
                  <Icon name={s.icon} className="ui-btn__icon" />{L(s.cta)}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
