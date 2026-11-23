// ═══════════════════════════════════════════════════════
// /newborn-sunnah — "Yeni doğulan körpə: Sünnə planı" (P2)
//
// Valideyn doğum gününü yazır → doğum günü və 7-ci gün miladi + hicri tarixlə, addım-addım plan.
// Səhifə YENİ dini mətn yazmır: hər addımın məzmunu "Əqiqə" dərsindən (src/data/lessons/aqiqah.js)
// və Hisnul-Müslimdən olduğu kimi, mənbələri ilə göstərilir (components/lifeguide/GuideParts).
//   • Qulağa azan: dərs bu barədəki hədislərin zəif/uydurma olduğunu deyir — yalnız dərsin öz qeydi
//     göstərilir (işarələnən addım deyil).
//   • Sünnət (xitan): saytın dərslərində mənbə yoxdur — hökm və tarix VERİLMİR, yalnız bu qeyd.
//   • 7-ci günün sayılması dərsdəki qaydaya görədir: doğum günü daxildir; gecə doğulubsa — ertəsi gündən.
// Qeyd: utils/lifeGuides (newborn_plan_v1 — profilə aid, E2E sinxronizasiya), mount-dan sonra oxunur.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf, navLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { parseGKey, gregorianToHijri, formatGregorian, formatHijri, weekdayName } from '../utils/hijri'
import { NEWBORN_KEY, NEWBORN_STEP_IDS, newbornDates, daysSince, day7Ics, localDay, validDay } from '../utils/lifeGuides'
import { saveBlob } from '../utils/quoteCard'
import { useGuideSources, useGuideStore, GuideStep, ClearNotes, SpaLink, lessonHref } from '../components/lifeguide/GuideParts'
import { LG, LESSON_LABEL } from '../components/lifeguide/lifeGuideText'
import '../styles/LessonsPage.css'
import '../styles/LifeGuides.css'

const T = {
  az: {
    title: 'Yeni doğulan körpə: Sünnə planı',
    lead: 'Körpənin doğum gününü yazın — doğum günü və yeddinci gün üçün addım-addım plan alın. Hər addım "Əqiqə" dərsindən, mənbələri ilə.',
    birth: 'Doğum günü', night: 'Gecə doğulub', nightHint: 'Dərsə görə gecə doğulubsa, günlər ertəsi gündən sayılır.',
    empty: 'Planı görmək üçün doğum gününü yazın.', badDate: 'Tarixi tam yazın (gün, ay, il).',
    day1: 'Doğum günü', day7: 'Yeddinci gün', today: 'Bu gün', passed: 'Keçib',
    inDays: (n) => (n === 1 ? 'Sabah' : `${n} gün sonra`),
    hijriNote: 'Hicri tarix Ümmül-Qura təqvimi ilədir; yerli hilal görünüşündən bir gün fərqlənə bilər.',
    ics: 'Yeddinci günü təqvimimə əlavə et (.ics)', icsTitle: 'Körpənin yeddinci günü — əqiqə, saç, ad (muslims.cc)',
    icsSaved: 'Təqvim faylı yükləndi.',
    phaseBirth: 'Doğum günü', phase7: 'Yeddinci gün', phaseLater: 'Sonra',
    planFor: (d) => `Plan: ${d}`,
    babyNames: 'Uşaq adları',
  },
  en: {
    title: 'Newborn Sunnah plan',
    lead: 'Enter your baby’s date of birth to get a step-by-step plan for the day of birth and the seventh day. Each step comes from the “Aqiqah” lesson, with its sources.',
    birth: 'Date of birth', night: 'Born at night', nightHint: 'According to the lesson, if the baby was born at night the days are counted from the next day.',
    empty: 'Enter the date of birth to see the plan.', badDate: 'Enter the full date (day, month, year).',
    day1: 'Day of birth', day7: 'Seventh day', today: 'Today', passed: 'Passed',
    inDays: (n) => (n === 1 ? 'Tomorrow' : `In ${n} days`),
    hijriNote: 'Hijri dates use the Umm al-Qura calendar and may differ by a day from your local moon sighting.',
    ics: 'Add the seventh day to my calendar (.ics)', icsTitle: 'Baby’s seventh day — aqiqah, hair, name (muslims.cc)',
    icsSaved: 'Calendar file downloaded.',
    phaseBirth: 'Day of birth', phase7: 'Seventh day', phaseLater: 'Later',
    planFor: (d) => `Plan: ${d}`,
    babyNames: 'Baby names',
  },
  ru: {
    title: 'Сунна для новорождённого: план',
    lead: 'Укажите дату рождения малыша — получите пошаговый план на день рождения и седьмой день. Каждый шаг — из урока «Акыка», с источниками.',
    birth: 'Дата рождения', night: 'Родился ночью', nightHint: 'Согласно уроку, если ребёнок родился ночью, дни отсчитываются со следующего дня.',
    empty: 'Укажите дату рождения, чтобы увидеть план.', badDate: 'Укажите полную дату (день, месяц, год).',
    day1: 'День рождения', day7: 'Седьмой день', today: 'Сегодня', passed: 'Прошёл',
    inDays: (n) => (n === 1 ? 'Завтра' : `Через ${n} дн.`),
    hijriNote: 'Даты по хиджре — по календарю Умм аль-Кура; они могут на день отличаться от местного наблюдения луны.',
    ics: 'Добавить седьмой день в мой календарь (.ics)', icsTitle: 'Седьмой день малыша — акыка, волосы, имя (muslims.cc)',
    icsSaved: 'Файл календаря загружен.',
    phaseBirth: 'День рождения', phase7: 'Седьмой день', phaseLater: 'Позже',
    planFor: (d) => `План: ${d}`,
    babyNames: 'Имена для детей',
  },
  ar: {
    title: 'سنن المولود: خطة خطوة بخطوة',
    lead: 'أدخل تاريخ ولادة طفلك لتحصل على خطة ليوم الولادة واليوم السابع. كل خطوة من درس «العقيقة» مع مصادرها.',
    birth: 'تاريخ الولادة', night: 'وُلد ليلًا', nightHint: 'بحسب الدرس: إن وُلد ليلًا فالعدّ يبدأ من اليوم التالي.',
    empty: 'أدخل تاريخ الولادة لتظهر الخطة.', badDate: 'أدخل التاريخ كاملًا (اليوم والشهر والسنة).',
    day1: 'يوم الولادة', day7: 'اليوم السابع', today: 'اليوم', passed: 'مضى',
    inDays: (n) => (n === 1 ? 'غدًا' : n === 2 ? 'بعد يومين' : n <= 10 ? `بعد ${n} أيام` : `بعد ${n} يومًا`),
    hijriNote: 'التاريخ الهجري بتقويم أم القرى، وقد يختلف يومًا عن رؤية الهلال المحلية.',
    ics: 'أضف اليوم السابع إلى تقويمي (‎.ics)', icsTitle: 'اليوم السابع للمولود — العقيقة والحلق والتسمية (muslims.cc)',
    icsSaved: 'نُزّل ملف التقويم.',
    phaseBirth: 'يوم الولادة', phase7: 'اليوم السابع', phaseLater: 'بعد ذلك',
    planFor: (d) => `الخطة: ${d}`,
    babyNames: 'أسماء المواليد',
  },
  tr: {
    title: 'Yeni doğan bebek: Sünnet planı',
    lead: 'Bebeğinizin doğum tarihini yazın — doğum günü ve yedinci gün için adım adım plan alın. Her adım “Akika” dersinden, kaynaklarıyla.',
    birth: 'Doğum tarihi', night: 'Gece doğdu', nightHint: 'Derse göre bebek gece doğduysa günler ertesi günden sayılır.',
    empty: 'Planı görmek için doğum tarihini yazın.', badDate: 'Tarihi tam yazın (gün, ay, yıl).',
    day1: 'Doğum günü', day7: 'Yedinci gün', today: 'Bugün', passed: 'Geçti',
    inDays: (n) => (n === 1 ? 'Yarın' : `${n} gün sonra`),
    hijriNote: 'Hicrî tarih Ümmü’l-Kurâ takvimine göredir; yerel hilal gözleminden bir gün farklı olabilir.',
    ics: 'Yedinci günü takvimime ekle (.ics)', icsTitle: 'Bebeğin yedinci günü — akika, saç, isim (muslims.cc)',
    icsSaved: 'Takvim dosyası indirildi.',
    phaseBirth: 'Doğum günü', phase7: 'Yedinci gün', phaseLater: 'Sonra',
    planFor: (d) => `Plan: ${d}`,
    babyNames: 'Bebek isimleri',
  },
}

// Addımlar. ex — "Əqiqə" dərsinin blokları (indekslər tests/unit/life-guides.test.js-də yoxlanır),
// hisn — Hisnul-Müslim fəsilləri. check: false — işarələnmir (yalnız məlumat).
export const NEWBORN_PHASES = [
  { id: 'birth', steps: [
    { id: 'adhan', icon: 'info', check: false,
      title: { az: 'Qulağa azan haqqında', en: 'About the adhan in the ear', ru: 'Об азане в ухо', ar: 'عن الأذان في أذن المولود', tr: 'Kulağa ezan hakkında' },
      text: { az: 'Çox soruşulur — dərsin bu barədə dediyi:', en: 'This is often asked — here is what the lesson says:', ru: 'Об этом часто спрашивают — вот что говорится в уроке:', ar: 'يكثر السؤال عنه — وهذا ما في الدرس:', tr: 'Sık sorulur — dersin bu konuda söylediği:' },
      ex: [{ s: 'aqiqah', sec: 'customs', b: [0] }] },
    { id: 'congrats', icon: 'duas', check: false,
      title: { az: 'Valideynləri təbrik', en: 'Congratulating the parents', ru: 'Поздравление родителей', ar: 'تهنئة الوالدين', tr: 'Anne babayı tebrik' },
      text: { az: 'Peyğəmbər ﷺ-in hədisi deyil — ən-Nəvəvinin (əl-Əzkar) nəql etdiyi ifadədir.', en: 'Not a hadith of the Prophet ﷺ — wording reported by an-Nawawi (al-Adhkar).', ru: 'Это не хадис Пророка ﷺ — формулировка, переданная ан-Навави («аль-Азкар»).', ar: 'ليس حديثًا عن النبي ﷺ — بل لفظ نقله النووي في «الأذكار».', tr: 'Peygamber ﷺ’in hadisi değildir — Nevevî’nin (el-Ezkâr) nakletiği ifadedir.' },
      hisn: [48] },
    { id: 'tahnik', icon: 'leaf',
      title: { az: 'Təhnik', en: 'Tahnik', ru: 'Тахник', ar: 'التحنيك', tr: 'Tahnik' },
      ex: [{ s: 'aqiqah', sec: 'tahnik', b: [0, 1, 2] }] },
    { id: 'protect', icon: 'shield', check: false,
      title: { az: 'Uşaq üçün qorunma istəmək', en: 'Seeking protection for the child', ru: 'Просьба о защите ребёнка', ar: 'تعويذ الطفل', tr: 'Çocuk için korunma dilemek' },
      hisn: [49] },
    { id: 'name', icon: 'babynames', names: true,
      title: { az: 'Ad seçmək', en: 'Choosing a name', ru: 'Выбор имени', ar: 'اختيار الاسم', tr: 'İsim seçmek' },
      ex: [{ s: 'aqiqah', sec: 'naming', b: [0, 1] }] },
  ] },
  { id: 'day7', steps: [
    { id: 'aqiqah', icon: 'gift',
      title: { az: 'Əqiqə', en: 'Aqiqah', ru: 'Акыка', ar: 'العقيقة', tr: 'Akika' },
      ex: [{ s: 'aqiqah', sec: 'ruling', b: [1, 2, 3] }, { s: 'aqiqah', sec: 'number', b: [0, 2] }, { s: 'aqiqah', sec: 'day-seven', b: [0, 1] }] },
    { id: 'shaving', icon: 'sparkle',
      title: { az: 'Saçın qırxılması və gümüş sədəqəsi', en: 'Shaving the hair and the silver charity', ru: 'Бритьё волос и садака серебром', ar: 'حلق الشعر والتصدق بوزنه فضة', tr: 'Saçın tıraşı ve gümüş sadakası' },
      ex: [{ s: 'aqiqah', sec: 'shaving', b: [0, 1] }] },
  ] },
  { id: 'later', steps: [
    { id: 'circumcision', icon: 'info', check: false,
      title: { az: 'Sünnət (xitan)', en: 'Circumcision (khitan)', ru: 'Обрезание (хитан)', ar: 'الختان', tr: 'Sünnet (hitan)' },
      text: {
        az: 'Saytın dərslərində bu mövzu hələ yoxdur, ona görə bu bələdçi onun hökmünü və vaxtını vermir. Etibarlı alimdən soruşun.',
        en: 'The site’s lessons do not cover this topic yet, so this guide gives no ruling or time for it. Ask a trusted scholar.',
        ru: 'В уроках сайта эта тема пока не раскрыта, поэтому руководство не указывает ни положения, ни срока. Спросите надёжного учёного.',
        ar: 'لا تتناول دروس الموقع هذا الموضوع بعد، لذا لا يذكر هذا الدليل حكمه ولا وقته. اسأل عالمًا موثوقًا.',
        tr: 'Sitenin derslerinde bu konu henüz yok; bu yüzden rehber hükmünü ve vaktini vermiyor. Güvenilir bir âlime sorun.',
      } },
  ] },
]

const PHASE_TITLE = { birth: 'phaseBirth', day7: 'phase7', later: 'phaseLater' }

// Sıra yerli qeydlərin açarları ilə eynidir — dev-də yoxla
if (import.meta.env?.DEV) {
  const ids = NEWBORN_PHASES.flatMap((p) => p.steps).filter((s) => s.check !== false).map((s) => s.id)
  if (ids.join() !== NEWBORN_STEP_IDS.join()) console.warn('[newborn] steps ≠ NEWBORN_STEP_IDS')
}

function DayCard({ label, dayKey, t, lang, today, testId, hidePassed = false }) {
  const g = parseGKey(dayKey)
  if (!g) return null
  const h = gregorianToHijri(g)
  const diff = daysSince(today, dayKey) // > 0 — gələcəkdə
  const badge = diff === 0 ? t.today : diff > 0 ? t.inDays(diff) : hidePassed ? null : t.passed
  return (
    <div className="ui-card lg-day" data-testid={testId}>
      <p className="lg-day__label">{label} {badge && <span className={`ui-badge ${diff === 0 ? 'ui-badge--brand' : 'ui-badge--outline'}`}>{badge}</span>}</p>
      <p className="lg-day__g"><span>{weekdayName(g, lang)}</span>, <span className="ui-num">{formatGregorian(g, lang)}</span></p>
      {h && <p className="lg-day__h ui-num">{formatHijri(h, lang)}</p>}
    </div>
  )
}

export default function NewbornGuidePage({ setPage }) {
  const { lang, siteLang } = useLang()
  const t = pickUi(T, lang, 'en')
  const L = pickUi(LG, lang, 'en')
  const src = useGuideSources(['aqiqah'], lang, true)
  const { data, ready, toggle, save, clear } = useGuideStore(NEWBORN_KEY)
  const [msg, setMsg] = useState('')
  const [draft, setDraft] = useState(null) // yazılan, hələ tam olmayan tarix
  const today = ready ? localDay() : null
  const dates = ready ? newbornDates(data.b, data.n) : null
  const pl = siteLang || lang

  const onDate = (e) => {
    const v = e.target.value
    setDraft(v)
    if (validDay(v)) { save({ ...data, b: v }); setDraft(null) }
    else if (!v) { save({ ...data, b: undefined }); setDraft(null) }
  }
  const onNight = (e) => save({ ...data, n: e.target.checked || undefined })
  const onToggle = (id, done) => { toggle(id, done); setMsg(done ? L.saved : L.unsaved) }
  const onIcs = () => {
    if (!dates) return
    const ics = day7Ics({ day7: dates.day7, title: t.icsTitle, description: `https://muslims.cc${pathFor('newborn', pl)}` })
    saveBlob(new Blob([ics], { type: 'text/calendar' }), `muslims-cc-newborn-${dates.day7}.ics`)
    setMsg(t.icsSaved)
  }

  const checkable = NEWBORN_PHASES.flatMap((p) => p.steps).filter((s) => s.check !== false)
  const doneN = checkable.filter((s) => data.d[s.id]).length
  const dateVal = draft ?? (data.b || '')
  const bad = draft != null && draft !== '' && !validDay(draft)
  let n = 0

  return (
    <div className="lg-page lg-page--newborn">
      <header className="ui-page-hero ui-page-hero--split lg-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('newborn'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {L.privateSync}</p>
          </div>
          <div className="ui-page-hero__aside">
            <form className="ui-card lg-form" onSubmit={(e) => e.preventDefault()} data-testid="nb-form">
              <label className="ui-field" htmlFor="nb-birth">
                <span className="ui-field__label">{t.birth}</span>
                <input id="nb-birth" type="date" className="ui-input" min="1900-01-01" max="2100-12-31"
                  value={dateVal} onChange={onDate} disabled={!ready}
                  aria-invalid={bad || undefined} aria-describedby={bad ? 'nb-birth-err' : undefined} />
              </label>
              {bad && <p id="nb-birth-err" className="lg-form__err">{t.badDate}</p>}
              <label className="lg-check lg-check--plain" htmlFor="nb-night">
                <input id="nb-night" type="checkbox" checked={Boolean(data.n)} onChange={onNight} disabled={!ready} aria-describedby="nb-night-hint" />
                <span>{t.night}</span>
              </label>
              <p id="nb-night-hint" className="ui-field__hint lg-form__hint">{t.nightHint}</p>
            </form>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>
          {dates ? (
            <div className="lg-days" data-testid="nb-dates">
              <DayCard label={t.day1} dayKey={dates.birth} t={t} lang={lang} today={today} testId="nb-day1" hidePassed />
              <DayCard label={t.day7} dayKey={dates.day7} t={t} lang={lang} today={today} testId="nb-day7" />
              <p className="lg-days__note">{t.hijriNote}</p>
              <div className="lg-days__actions">
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onIcs}>
                  <Icon name="calendar" size={16} className="ui-btn__icon" /> {t.ics}
                </button>
                <span className="lg-progress" data-testid="nb-progress">{L.progress(doneN, checkable.length)}</span>
              </div>
            </div>
          ) : (
            <aside className="ui-callout ui-callout--accent lg-calm"><Icon name="calendar" /><p>{ready ? t.empty : ' '}</p></aside>
          )}

          {NEWBORN_PHASES.map((ph) => (
            <section key={ph.id} className="lg-phase" aria-labelledby={`nb-ph-${ph.id}`}>
              <h2 id={`nb-ph-${ph.id}`} className="lg-phase__title">
                {t[PHASE_TITLE[ph.id]]}
                {dates && ph.id !== 'later' && (
                  <span className="lg-phase__date ui-num"> · {formatGregorian(parseGKey(ph.id === 'birth' ? dates.birth : dates.day7), lang)}</span>
                )}
              </h2>
              <ol className="ui-steps lg-steps">
                {ph.steps.map((s) => {
                  if (s.check !== false) n += 1
                  const links = s.names ? [{ href: pathFor('babynames', pl), label: navLabel('babynames', lang) || t.babyNames, icon: 'babynames' }] : []
                  return (
                    <GuideStep key={s.id} step={s} idPrefix="nb" lang={lang} src={src} links={links}
                      checkedOn={data.d[s.id]} ready={ready} onToggle={onToggle} n={n} />
                  )
                })}
              </ol>
            </section>
          ))}

          <aside className="ui-callout lg-scholar">
            <Icon name="learn" />
            <p>{L.scholar}{' '}
              <SpaLink className="ui-link" href={lessonHref('aqiqah', null, pl)}>{pickUi(LESSON_LABEL.aqiqah, lang, 'en')}</SpaLink>
            </p>
          </aside>
          {ready && (data.b || doneN > 0) && (
            <ClearNotes lang={lang} onClear={() => { clear(); setDraft(null); setMsg(L.cleared) }} />
          )}
        </div>
      </section>
    </div>
  )
}
