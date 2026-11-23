// ═══════════════════════════════════════════════════════
// /nikah-preparation — "Nikaha hazırlıq" (P2)
//
// Yoxlama siyahısı + şəxsi qeydlər: seçim, istixarə, evlənməzdən əvvəl danışılacaq suallar, rüknlər,
// vəli və şahidlər, mehr, xütbə, vəlimə planı, toyda qaçınılanlar, dualar. Səhifə YENİ hökm yazmır —
// məzmun "Nikah" dərsindən (src/data/lessons/nikah.js) və Hisnul-Müslimdən olduğu kimi, mənbələri ilə.
// Suallar yalnız dərsin mövzularına (mehr, şərtlər, nəfəqə/mənzil, haqlar, toy) istinad edir.
// Tanışlıq/uyğunlaşdırma YOXDUR. Qeydlər: utils/lifeGuides (nikah_prep_v1) — YALNIZ bu cihaz.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pickUi } from '../utils/uiText'
import { NIKAH_KEY, NIKAH_STEP_IDS, NIKAH_QUESTION_IDS, NOTE_MAX, WALIMAH_NOTE_MAX, validDay } from '../utils/lifeGuides'
import { useGuideSources, useGuideStore, GuideStep, ClearNotes, SpaLink, lessonHref } from '../components/lifeguide/GuideParts'
import { LG, LESSON_LABEL } from '../components/lifeguide/lifeGuideText'
import '../styles/LessonsPage.css'
import '../styles/LifeGuides.css'

const T = {
  az: {
    title: 'Nikaha hazırlıq',
    lead: 'Mehr, şərtlər, vəli və şahidlər, evlənməzdən əvvəl danışılacaq suallar və vəlimə planı — "Nikah" dərsinə əsaslanan yoxlama siyahısı və şəxsi qeydləriniz.',
    calm: 'Bu səhifə tanışlıq xidməti deyil və yeni hökm vermir: hər addım dərsdən, mənbələri ilə.',
    before: 'Əvvəl', contract: 'Nikah əqdi', wedding: 'Toy və vəlimə',
    qLead: 'Hər sualın yanında dərsin müvafiq bölməsi var. Cavablarınızı özünüz üçün qeyd edin.',
    note: 'Qeydim', walimahDate: 'Vəlimənin tarixi', walimahNote: 'Vəlimə planı (yer, qonaqlar, hazırlıq)',
    count: (n, max) => `${n}/${max}`, seeLesson: 'Dərsdə bax',
  },
  en: {
    title: 'Preparing for nikah',
    lead: 'Mahr, conditions, the wali and witnesses, questions to discuss before marriage and a walimah plan — a checklist based on the “Marriage (Nikah)” lesson, with your private notes.',
    calm: 'This page is not a matchmaking service and gives no new rulings: every step comes from the lesson, with its sources.',
    before: 'Before', contract: 'The marriage contract', wedding: 'The wedding and walimah',
    qLead: 'Each question links to the relevant section of the lesson. Note your answers for yourself.',
    note: 'My note', walimahDate: 'Walimah date', walimahNote: 'Walimah plan (place, guests, preparation)',
    count: (n, max) => `${n}/${max}`, seeLesson: 'See in the lesson',
  },
  ru: {
    title: 'Подготовка к никяху',
    lead: 'Махр, условия, опекун и свидетели, вопросы для обсуждения до брака и план валимы — чек-лист по уроку «Никях» и ваши личные заметки.',
    calm: 'Эта страница — не служба знакомств и не даёт новых положений: каждый шаг взят из урока, с источниками.',
    before: 'Заранее', contract: 'Брачный договор', wedding: 'Свадьба и валима',
    qLead: 'У каждого вопроса есть ссылка на нужный раздел урока. Записывайте ответы для себя.',
    note: 'Моя заметка', walimahDate: 'Дата валимы', walimahNote: 'План валимы (место, гости, подготовка)',
    count: (n, max) => `${n}/${max}`, seeLesson: 'Смотреть в уроке',
  },
  ar: {
    title: 'الاستعداد للنكاح',
    lead: 'المهر والشروط والولي والشاهدان وأسئلة للنقاش قبل الزواج وخطة الوليمة — قائمة مبنية على درس «النكاح» مع ملاحظاتك الخاصة.',
    calm: 'هذه الصفحة ليست خدمة تعارف ولا تأتي بأحكام جديدة: كل خطوة من الدرس مع مصادرها.',
    before: 'قبل ذلك', contract: 'عقد النكاح', wedding: 'العرس والوليمة',
    qLead: 'بجانب كل سؤال رابط إلى القسم المناسب من الدرس. دوّن أجوبتك لنفسك.',
    note: 'ملاحظتي', walimahDate: 'تاريخ الوليمة', walimahNote: 'خطة الوليمة (المكان، الضيوف، التحضير)',
    count: (n, max) => `${n}/${max}`, seeLesson: 'انظر في الدرس',
  },
  tr: {
    title: 'Nikâha hazırlık',
    lead: 'Mehir, şartlar, velî ve şahitler, evlenmeden önce konuşulacak sorular ve velime planı — “Nikâh” dersine dayanan kontrol listesi ve kişisel notlarınız.',
    calm: 'Bu sayfa bir tanışma hizmeti değildir ve yeni hüküm vermez: her adım dersten, kaynaklarıyla.',
    before: 'Önce', contract: 'Nikâh akdi', wedding: 'Düğün ve velime',
    qLead: 'Her sorunun yanında dersin ilgili bölümü var. Cevaplarınızı kendiniz için not edin.',
    note: 'Notum', walimahDate: 'Velime tarihi', walimahNote: 'Velime planı (yer, misafirler, hazırlık)',
    count: (n, max) => `${n}/${max}`, seeLesson: 'Derste bak',
  },
}

// Danışılacaq suallar — yalnız dərsin mövzuları (sec — dərs bölməsi)
export const NIKAH_QUESTIONS = [
  { id: 'mahr', sec: 'mahr',
    q: { az: 'Mehr: nə qədər, hansı şəkildə və nəyi əqd zamanı, nəyi sonra veriləcək?', en: 'The mahr: how much, in what form, and what is given at the contract and what later?', ru: 'Махр: сколько, в какой форме, что отдаётся при заключении договора, а что позже?', ar: 'المهر: كم هو، وما نوعه، وما المعجَّل منه عند العقد وما المؤجَّل؟', tr: 'Mehir: ne kadar, hangi şekilde, ne kadarı akit sırasında ne kadarı sonra verilecek?' } },
  { id: 'conditions', sec: 'mahr',
    q: { az: 'Əqddə razılaşdırmaq istədiyiniz halal şərtlər varmı (dərsdəki nümunələr: təhsilə davam, ayrıca mənzil)?', en: 'Are there lawful conditions you want agreed in the contract (the lesson’s examples: continuing study, separate housing)?', ru: 'Есть ли дозволенные условия, которые вы хотите оговорить в договоре (примеры в уроке: продолжение учёбы, отдельное жильё)?', ar: 'هل هناك شروط مباحة تريدان الاتفاق عليها في العقد (من أمثلة الدرس: إكمال الدراسة، السكن المستقل)؟', tr: 'Akitte anlaşmak istediğiniz helal şartlar var mı (dersteki örnekler: eğitime devam, ayrı ev)?' } },
  { id: 'housing', sec: 'rights',
    q: { az: 'Nəfəqə və mənzil: harada yaşayacaqsınız, ev xərcləri necə olacaq?', en: 'Maintenance and housing: where will you live, and how will household spending work?', ru: 'Содержание и жильё: где вы будете жить и как будут устроены расходы на дом?', ar: 'النفقة والسكن: أين ستسكنان، وكيف ستكون نفقات البيت؟', tr: 'Nafaka ve ev: nerede yaşayacaksınız, ev giderleri nasıl olacak?' } },
  { id: 'rights', sec: 'rights',
    q: { az: 'Ər-arvad haqlarını dərsdən birlikdə oxuyub danışdınızmı?', en: 'Have you read the rights of the spouses in the lesson together and talked them through?', ru: 'Прочитали ли вы вместе права супругов в уроке и обсудили ли их?', ar: 'هل قرأتما حقوق الزوجين في الدرس معًا وتحدثتما فيها؟', tr: 'Eşlerin haklarını dersten birlikte okuyup konuştunuz mu?' } },
  { id: 'wedding', sec: 'wedding',
    q: { az: 'Toy: nikah necə elan olunacaq, vəliməyə kimlər dəvət ediləcək?', en: 'The wedding: how will the marriage be announced, and who will be invited to the walimah?', ru: 'Свадьба: как будет объявлен брак и кого пригласят на валиму?', ar: 'العرس: كيف سيُعلَن النكاح، ومن سيُدعى إلى الوليمة؟', tr: 'Düğün: nikâh nasıl ilan edilecek, velimeye kimler davet edilecek?' } },
]

export const NIKAH_PHASES = [
  { id: 'before', steps: [
    { id: 'choose', icon: 'user',
      title: { az: 'Seçim və elçilik', en: 'Choosing and the proposal', ru: 'Выбор и сватовство', ar: 'الاختيار والخِطبة', tr: 'Seçim ve kız isteme' },
      ex: [{ s: 'nikah', sec: 'intro', b: [3, 4, 5] }] },
    { id: 'istikhara', icon: 'prayer', istikhara: true,
      title: { az: 'İstixarə', en: 'Istikhara', ru: 'Истихара', ar: 'الاستخارة', tr: 'İstihare' },
      text: { az: 'İstixarə namazı və duası ayrıca dərsdə izah olunur.', en: 'The istikhara prayer and its dua are explained in a separate lesson.', ru: 'Намаз истихара и его дуа разобраны в отдельном уроке.', ar: 'صلاة الاستخارة ودعاؤها مشروحان في درس مستقل.', tr: 'İstihare namazı ve duası ayrı bir derste anlatılıyor.' } },
    { id: 'questions', icon: 'edit', questions: true,
      title: { az: 'Evlənməzdən əvvəl danışılacaq suallar', en: 'Questions to discuss before marriage', ru: 'Вопросы для обсуждения до брака', ar: 'أسئلة للنقاش قبل الزواج', tr: 'Evlenmeden önce konuşulacak sorular' } },
  ] },
  { id: 'contract', steps: [
    { id: 'pillars', icon: 'list',
      title: { az: 'Rüknlər və şərtlər', en: 'Pillars and conditions', ru: 'Столпы и условия', ar: 'الأركان والشروط', tr: 'Rükünler ve şartlar' },
      ex: [{ s: 'nikah', sec: 'pillars', b: [0, 1, 2, 4] }] },
    { id: 'wali', icon: 'group',
      title: { az: 'Vəli və iki şahid', en: 'The wali and two witnesses', ru: 'Опекун и два свидетеля', ar: 'الولي والشاهدان', tr: 'Velî ve iki şahit' },
      ex: [{ s: 'nikah', sec: 'pillars', b: [3] }, { s: 'nikah', sec: 'wali', b: [0, 1, 3] }] },
    { id: 'mahr', icon: 'gift',
      title: { az: 'Mehr', en: 'The mahr', ru: 'Махр', ar: 'المهر', tr: 'Mehir' },
      ex: [{ s: 'nikah', sec: 'mahr', b: [0, 1, 2, 3] }] },
    { id: 'khutbah', icon: 'megaphone',
      title: { az: 'Hacət xütbəsi', en: 'The sermon of need (khutbat al-hajah)', ru: 'Проповедь нужды (хутбат аль-хаджа)', ar: 'خطبة الحاجة', tr: 'Hâcet hutbesi' },
      ex: [{ s: 'nikah', sec: 'khutbah', b: [0, 1] }] },
  ] },
  { id: 'wedding', steps: [
    { id: 'walimah', icon: 'calendar', walimah: true,
      title: { az: 'Vəlimə', en: 'The walimah', ru: 'Валима', ar: 'الوليمة', tr: 'Velime' },
      ex: [{ s: 'nikah', sec: 'khutbah', b: [5] }, { s: 'nikah', sec: 'wedding', b: [0, 1, 2, 3, 4] }] },
    { id: 'avoid', icon: 'alert',
      title: { az: 'Dərsin toylarda xəbərdar etdikləri', en: 'What the lesson warns about at weddings', ru: 'О чём урок предостерегает на свадьбах', ar: 'ما يحذّر منه الدرس في الأعراس', tr: 'Dersin düğünlerde uyardığı noktalar' },
      ex: [{ s: 'nikah', sec: 'forbidden', b: [0] }] },
    { id: 'duas', icon: 'duas',
      title: { az: 'Təbrik və yeni evlinin duası', en: 'Congratulation and the dua of the newly married', ru: 'Поздравление и дуа молодожёна', ar: 'التهنئة ودعاء المتزوج', tr: 'Tebrik ve yeni evlinin duası' },
      hisn: [80, 81] },
  ] },
]

if (import.meta.env?.DEV) {
  const ids = NIKAH_PHASES.flatMap((p) => p.steps).map((s) => s.id)
  if (ids.join() !== NIKAH_STEP_IDS.join()) console.warn('[nikah] steps ≠ NIKAH_STEP_IDS')
  if (NIKAH_QUESTIONS.map((q) => q.id).join() !== NIKAH_QUESTION_IDS.join()) console.warn('[nikah] questions ≠ NIKAH_QUESTION_IDS')
}

export default function NikahGuidePage({ setPage }) {
  const { lang, siteLang } = useLang()
  const t = pickUi(T, lang, 'en')
  const L = pickUi(LG, lang, 'en')
  const src = useGuideSources(['nikah'], lang, true)
  const { data, ready, toggle, save, clear } = useGuideStore(NIKAH_KEY)
  const [msg, setMsg] = useState('')
  const [draft, setDraft] = useState({}) // yazılan mətn (boşluqla başlayanda itməsin)
  const pl = siteLang || lang
  const onToggle = (id, done) => { toggle(id, done); setMsg(done ? L.saved : L.unsaved) }

  const setQ = (id, v) => { setDraft((d) => ({ ...d, [`q:${id}`]: v })); save({ ...data, q: { ...data.q, [id]: v } }) }
  const setW = (field, v) => { setDraft((d) => ({ ...d, [`w:${field}`]: v })); save({ ...data, w: { ...data.w, [field]: v } }) }
  const val = (k, stored) => (draft[k] ?? stored ?? '')
  const blur = (k) => setDraft((d) => { const n = { ...d }; delete n[k]; return n })

  const all = NIKAH_PHASES.flatMap((p) => p.steps)
  const doneN = all.filter((s) => data.d[s.id]).length
  const hasAny = doneN > 0 || Object.keys(data.q).length > 0 || Object.keys(data.w).length > 0
  const linksOf = (s) => (s.istikhara ? [{ href: lessonHref('istikhara', null, pl), label: pickUi(LESSON_LABEL.istikhara, lang, 'en'), icon: 'learn' }] : [])
  const wDate = val('w:date', data.w.date)
  let n = 0

  const extra = (s) => {
    if (s.questions) {
      return (
        <div className="lg-qs">
          <p className="ui-step__text">{t.qLead}</p>
          <ol className="lg-qs__list">
            {NIKAH_QUESTIONS.map((q) => {
              const k = `q:${q.id}`
              const v = val(k, data.q[q.id])
              return (
                <li key={q.id} className="lg-q" data-testid={`nk-q-${q.id}`}>
                  <label className="ui-field" htmlFor={`nk-q-${q.id}`}>
                    <span className="ui-field__label lg-q__text">{pickUi(q.q, lang, 'en')}</span>
                    <textarea id={`nk-q-${q.id}`} className="ui-input lg-textarea" rows={2} dir="auto" maxLength={NOTE_MAX}
                      value={v} disabled={!ready} onChange={(e) => setQ(q.id, e.target.value)} onBlur={() => blur(k)}
                      aria-describedby={`nk-q-${q.id}-n`} placeholder={t.note} />
                  </label>
                  <p className="lg-q__foot">
                    <span id={`nk-q-${q.id}-n`} className="ui-field__hint ui-num">{t.count([...v].length, NOTE_MAX)}</span>
                    <SpaLink className="ui-link lg-q__link" href={lessonHref('nikah', q.sec, pl)}>{t.seeLesson}</SpaLink>
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      )
    }
    if (s.walimah) {
      const note = val('w:note', data.w.note)
      return (
        <div className="lg-walimah" data-testid="nk-walimah">
          <label className="ui-field" htmlFor="nk-w-date">
            <span className="ui-field__label">{t.walimahDate}</span>
            <input id="nk-w-date" type="date" className="ui-input" min="1900-01-01" max="2100-12-31" disabled={!ready}
              value={wDate} onChange={(e) => {
                const v = e.target.value
                setDraft((d) => ({ ...d, 'w:date': v }))
                if (validDay(v) || !v) save({ ...data, w: { ...data.w, date: v || undefined } })
              }} onBlur={() => blur('w:date')} />
          </label>
          <label className="ui-field" htmlFor="nk-w-note">
            <span className="ui-field__label">{t.walimahNote}</span>
            <textarea id="nk-w-note" className="ui-input lg-textarea" rows={3} dir="auto" maxLength={WALIMAH_NOTE_MAX} disabled={!ready}
              value={note} onChange={(e) => setW('note', e.target.value)} onBlur={() => blur('w:note')} aria-describedby="nk-w-note-n" />
            <span id="nk-w-note-n" className="ui-field__hint ui-num">{t.count([...note].length, WALIMAH_NOTE_MAX)}</span>
          </label>
        </div>
      )
    }
    return null
  }

  return (
    <div className="lg-page lg-page--nikah">
      <header className="ui-page-hero lg-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('nikahprep'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {L.privateLocal}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <aside className="ui-callout ui-callout--accent lg-calm">
            <Icon name="info" />
            <p>{t.calm}</p>
          </aside>
          <p className="lg-progress" data-testid="nk-progress">{ready ? L.progress(doneN, all.length) : ' '}</p>
          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          {NIKAH_PHASES.map((ph) => (
            <section key={ph.id} className="lg-phase" aria-labelledby={`nk-ph-${ph.id}`}>
              <h2 id={`nk-ph-${ph.id}`} className="lg-phase__title">{t[ph.id]}</h2>
              <ol className="ui-steps lg-steps">
                {ph.steps.map((s) => {
                  n += 1
                  return (
                    <GuideStep key={s.id} step={s} idPrefix="nk" lang={lang} src={src} links={linksOf(s)}
                      checkedOn={data.d[s.id]} ready={ready} onToggle={onToggle} n={n}>
                      {extra(s)}
                    </GuideStep>
                  )
                })}
              </ol>
            </section>
          ))}

          <aside className="ui-callout lg-scholar">
            <Icon name="learn" />
            <p>{L.scholar}{' '}
              <SpaLink className="ui-link" href={lessonHref('nikah', null, pl)}>{pickUi(LESSON_LABEL.nikah, lang, 'en')}</SpaLink>
            </p>
          </aside>
          {ready && hasAny && <ClearNotes lang={lang} onClear={() => { clear(); setDraft({}); setMsg(L.cleared) }} />}
        </div>
      </section>
    </div>
  )
}
