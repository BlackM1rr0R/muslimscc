// ═══════════════════════════════════════════════════════
// /when-a-loved-one-dies — "Yaxınınız vəfat edəndə: ailə üçün bələdçi" (P2)
//
// Sakit, mərhələli yoxlama siyahısı: ilk saat, ilk gün, ilk həftə, sonra. Səhifə YENİ dini mətn
// yazmır — hər addımın məzmunu "Cənazə" və "Vəsiyyət" dərslərindən (src/data/lessons/janazah.js,
// wasiyyah.js) və Hisnul-Müslimdən (vəfat, müsibət, təziyə duaları) olduğu kimi, mənbələri ilə.
// Borclar — P1 borc dəftəri (/debt-ledger) marşrutu varsa ona keçid (routes.js-dən axtarılır),
// miras — miras hesablayıcısı, ildönümü xatırlatması — hesabdakı "Sevdiklərim üçün dua" (#loved).
// İnsan şəkli YOXDUR. İrəliləyiş: utils/lifeGuides (loved_guide_v1) — YALNIZ bu cihaz.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf, navLabel } from '../data/navigation'
import { PAGES, pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { LOVED_KEY, LOVED_STEP_IDS } from '../utils/lifeGuides'
import { useGuideSources, useGuideStore, GuideStep, ClearNotes, SpaLink, lessonHref } from '../components/lifeguide/GuideParts'
import { LG, LESSON_LABEL } from '../components/lifeguide/lifeGuideText'
import '../styles/LessonsPage.css'
import '../styles/LifeGuides.css'

const T = {
  az: {
    title: 'Yaxınınız vəfat edəndə: ailə üçün bələdçi',
    lead: 'Başınız sağ olsun. Hər şeyi indi oxumağa ehtiyac yoxdur — addımları bir-bir, ehtiyac olduqca açın.',
    calm: 'Hər addımın məzmunu saytın "Cənazə" və "Vəsiyyət" dərslərindən və Hisnul-Müslimdən, mənbələri ilə götürülüb.',
    hour: 'İlk saat', day: 'İlk gün', week: 'İlk həftə', later: 'Sonra',
    debtLedger: 'Borc dəftəri', inheritance: 'Miras hesablayıcısı', loved: 'Hesabım: Sevdiklərim üçün dua',
    debtsPlain: 'Mərhumun borclarını (kimə, nə qədər, sənəd) bir yerdə yazın.',
  },
  en: {
    title: 'When a loved one passes away: a family guide',
    lead: 'We are sorry for your loss. You do not need to read everything now — open the steps one at a time, as you need them.',
    calm: 'The content of each step is taken from the site’s “Funeral” and “Islamic will” lessons and from Hisn al-Muslim, with its sources.',
    hour: 'The first hour', day: 'The first day', week: 'The first week', later: 'Later',
    debtLedger: 'Debt ledger', inheritance: 'Inheritance calculator', loved: 'My account: Prayers for loved ones',
    debtsPlain: 'Write down the deceased’s debts in one place (to whom, how much, any document).',
  },
  ru: {
    title: 'Когда уходит близкий: руководство для семьи',
    lead: 'Примите наши соболезнования. Не нужно читать всё сейчас — открывайте шаги по одному, когда они понадобятся.',
    calm: 'Содержание каждого шага взято из уроков сайта «Похороны» и «Завещание» и из «Крепости мусульманина» — с источниками.',
    hour: 'Первый час', day: 'Первый день', week: 'Первая неделя', later: 'Позже',
    debtLedger: 'Книга долгов', inheritance: 'Калькулятор наследства', loved: 'Мой аккаунт: Дуа за близких',
    debtsPlain: 'Запишите долги умершего в одном месте (кому, сколько, какой документ).',
  },
  ar: {
    title: 'عند وفاة عزيز: دليل للأسرة',
    lead: 'نشارككم مصابكم. لا حاجة إلى قراءة كل شيء الآن — افتح الخطوات واحدة واحدة عند الحاجة.',
    calm: 'محتوى كل خطوة مأخوذ من درسي «الجنائز» و«الوصية» في الموقع ومن حصن المسلم، مع مصادره.',
    hour: 'الساعة الأولى', day: 'اليوم الأول', week: 'الأسبوع الأول', later: 'بعد ذلك',
    debtLedger: 'دفتر الديون', inheritance: 'حاسبة المواريث', loved: 'حسابي: الدعاء لأحبّتي',
    debtsPlain: 'اكتب ديون المتوفى في مكان واحد (لمن، وكم، وأي وثيقة).',
  },
  tr: {
    title: 'Bir yakınınız vefat ettiğinde: aile için rehber',
    lead: 'Başınız sağ olsun. Her şeyi şimdi okumanız gerekmiyor — adımları ihtiyaç duydukça birer birer açın.',
    calm: 'Her adımın içeriği sitenin “Cenaze” ve “Vasiyet” derslerinden ve Hısnu’l-Müslim’den, kaynaklarıyla alınmıştır.',
    hour: 'İlk saat', day: 'İlk gün', week: 'İlk hafta', later: 'Sonra',
    debtLedger: 'Borç defteri', inheritance: 'Miras hesaplayıcı', loved: 'Hesabım: Sevdiklerim için dua',
    debtsPlain: 'Merhumun borçlarını tek bir yere yazın (kime, ne kadar, belge).',
  },
}

// ex — dərs blokları (indekslər tests/unit/life-guides.test.js-də yoxlanır), hisn — Hisnul-Müslim fəsilləri
export const LOVED_PHASES = [
  { id: 'hour', steps: [
    { id: 'eyes', icon: 'leaf',
      title: { az: 'Vəfatdan dərhal sonra', en: 'Immediately after death', ru: 'Сразу после смерти', ar: 'بعد الوفاة مباشرة', tr: 'Vefattan hemen sonra' },
      ex: [{ s: 'janazah', sec: 'after-death', b: [0, 1, 2, 3] }] },
    { id: 'patience', icon: 'duas',
      title: { az: 'Səbr və müsibət duası', en: 'Patience and the dua at a calamity', ru: 'Терпение и дуа при беде', ar: 'الصبر ودعاء المصيبة', tr: 'Sabır ve musibet duası' },
      ex: [{ s: 'janazah', sec: 'after-death', b: [3, 4] }], hisn: [54] },
  ] },
  { id: 'day', steps: [
    { id: 'ghusl', icon: 'drop',
      title: { az: 'Mərhumun yuyulması (qüsl)', en: 'Washing the deceased (ghusl)', ru: 'Омовение умершего (гусль)', ar: 'تغسيل الميت', tr: 'Ölünün yıkanması (gusül)' },
      ex: [{ s: 'janazah', sec: 'washing', b: [0, 1, 2, 3] }] },
    { id: 'kafan', icon: 'list',
      title: { az: 'Kəfən', en: 'The shroud (kafan)', ru: 'Саван (кафан)', ar: 'الكفن', tr: 'Kefen' },
      ex: [{ s: 'janazah', sec: 'shroud', b: [0, 1, 2, 3] }] },
    { id: 'janazah', icon: 'prayer',
      title: { az: 'Cənazə namazı', en: 'The funeral prayer', ru: 'Погребальная молитва', ar: 'صلاة الجنازة', tr: 'Cenaze namazı' },
      ex: [{ s: 'janazah', sec: 'prayer', b: [0, 1, 2, 3, 4, 6] }] },
    { id: 'burial', icon: 'pin',
      title: { az: 'Aparmaq və dəfn', en: 'Carrying and burial', ru: 'Вынос и погребение', ar: 'حمل الجنازة والدفن', tr: 'Taşıma ve defin' },
      ex: [{ s: 'janazah', sec: 'burial', b: [0, 1, 2, 3, 4] }, { s: 'janazah', sec: 'after-burial', b: [0, 1] }] },
  ] },
  { id: 'week', steps: [
    { id: 'condolence', icon: 'jamaat',
      title: { az: 'Təziyə', en: 'Condolence', ru: 'Соболезнование', ar: 'التعزية', tr: 'Taziye' },
      ex: [{ s: 'janazah', sec: 'condolence', b: [0, 1] }], hisn: [58] },
    { id: 'debts', icon: 'list', debts: true,
      title: { az: 'Borclar', en: 'Debts', ru: 'Долги', ar: 'الديون', tr: 'Borçlar' },
      ex: [{ s: 'wasiyyah', sec: 'debts', b: [0, 1, 2, 3] }] },
    { id: 'will', icon: 'inheritance', estate: true,
      title: { az: 'Vəsiyyət və miras', en: 'The will and inheritance', ru: 'Завещание и наследство', ar: 'الوصية والميراث', tr: 'Vasiyet ve miras' },
      ex: [{ s: 'wasiyyah', sec: 'third', b: [0, 1, 3] }, { s: 'wasiyyah', sec: 'heir', b: [2, 3] }] },
    { id: 'mourning', icon: 'moon',
      title: { az: 'Yas müddəti', en: 'The mourning period', ru: 'Срок траура', ar: 'مدة الإحداد', tr: 'Yas süresi' },
      ex: [{ s: 'janazah', sec: 'condolence', b: [2, 3, 4] }] },
  ] },
  { id: 'later', steps: [
    { id: 'benefit', icon: 'sparkle',
      title: { az: 'Mərhuma fayda verən əməllər', en: 'Deeds that benefit the deceased', ru: 'Дела, которые приносят пользу умершему', ar: 'ما ينفع الميت', tr: 'Ölüye fayda veren ameller' },
      ex: [{ s: 'janazah', sec: 'after-burial', b: [2, 3] }, { s: 'janazah', sec: 'innovations', b: [0] }] },
    { id: 'remember', icon: 'bell', remember: true,
      title: { az: 'Onları dualarınızda yad edin', en: 'Remember them in your duas', ru: 'Вспоминайте их в своих дуа', ar: 'اذكروهم في دعائكم', tr: 'Onları dualarınızda anın' },
      text: {
        az: 'İstəsəniz, hesabınızdakı "Sevdiklərim üçün dua" bölməsinə əlavə edin — onları müntəzəm dualarınızda yad etməyiniz üçün şəxsi xatırlatma alarsınız.',
        en: 'If you wish, add them to “Prayers for loved ones” in your account — you will get a private reminder to remember them in your duas regularly.',
        ru: 'При желании добавьте их в раздел «Дуа за близких» в аккаунте — вы будете получать личное напоминание регулярно вспоминать их в своих дуа.',
        ar: 'إن شئت فأضفه إلى قسم «الدعاء لأحبّتي» في حسابك لتصلك تذكرة خاصة بالدعاء له بين حين وآخر.',
        tr: 'İsterseniz hesabınızdaki “Sevdiklerim için dua” bölümüne ekleyin — onları dualarınızda düzenli olarak anmanız için size özel bir hatırlatma gelir.',
      } },
  ] },
]

if (import.meta.env?.DEV) {
  const ids = LOVED_PHASES.flatMap((p) => p.steps).map((s) => s.id)
  if (ids.join() !== LOVED_STEP_IDS.join()) console.warn('[loved-one] steps ≠ LOVED_STEP_IDS')
}

// P1 borc dəftəri — marşrut varsa (paralel işlənir) ona keçid, yoxsa sadə mətn
const DEBT_KEY = PAGES.find((p) => p.path === 'debt-ledger')?.key || null

export default function LovedOneGuidePage({ setPage }) {
  const { lang, siteLang } = useLang()
  const t = pickUi(T, lang, 'en')
  const L = pickUi(LG, lang, 'en')
  const src = useGuideSources(['janazah', 'wasiyyah'], lang, true)
  const { data, ready, toggle, clear } = useGuideStore(LOVED_KEY)
  const [msg, setMsg] = useState('')
  const pl = siteLang || lang
  const onToggle = (id, done) => { toggle(id, done); setMsg(done ? L.saved : L.unsaved) }

  const all = LOVED_PHASES.flatMap((p) => p.steps)
  const doneN = all.filter((s) => data.d[s.id]).length
  const linksOf = (s) => {
    if (s.debts) return DEBT_KEY ? [{ href: pathFor(DEBT_KEY, pl), label: navLabel(DEBT_KEY, lang) || t.debtLedger, icon: DEBT_KEY }] : []
    if (s.estate) return [{ href: pathFor('inheritance', pl), label: t.inheritance, icon: 'inheritance' }, { href: lessonHref('wasiyyah', null, pl), label: pickUi(LESSON_LABEL.wasiyyah, lang, 'en'), icon: 'learn' }]
    if (s.remember) return [{ href: `${pathFor('account', pl)}#loved`, label: t.loved, icon: 'bell' }]
    return []
  }
  let n = 0

  return (
    <div className="lg-page lg-page--loved">
      <header className="ui-page-hero lg-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('bereavement'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {L.privateLocal}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <aside className="ui-callout ui-callout--accent lg-calm">
            <Icon name="leaf" />
            <p>{t.calm}</p>
          </aside>
          <p className="lg-progress" data-testid="lo-progress">{ready ? L.progress(doneN, all.length) : ' '}</p>
          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          {LOVED_PHASES.map((ph) => (
            <section key={ph.id} className="lg-phase" aria-labelledby={`lo-ph-${ph.id}`}>
              <h2 id={`lo-ph-${ph.id}`} className="lg-phase__title">{t[ph.id]}</h2>
              <ol className="ui-steps lg-steps">
                {ph.steps.map((s) => {
                  n += 1
                  return (
                    <GuideStep key={s.id} step={s} idPrefix="lo" lang={lang} src={src} links={linksOf(s)}
                      checkedOn={data.d[s.id]} ready={ready} onToggle={onToggle} n={n}>
                      {s.debts && !DEBT_KEY && <p className="ui-step__text">{t.debtsPlain}</p>}
                    </GuideStep>
                  )
                })}
              </ol>
            </section>
          ))}

          <aside className="ui-callout lg-scholar">
            <Icon name="learn" />
            <p>{L.scholar}{' '}
              <SpaLink className="ui-link" href={lessonHref('janazah', null, pl)}>{pickUi(LESSON_LABEL.janazah, lang, 'en')}</SpaLink>
            </p>
          </aside>
          {ready && doneN > 0 && <ClearNotes lang={lang} onClear={() => { clear(); setMsg(L.cleared) }} />}
        </div>
      </section>
    </div>
  )
}
