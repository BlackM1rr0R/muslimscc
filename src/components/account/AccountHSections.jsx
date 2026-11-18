// ═══════════════════════════════════════════════════════
// /account — H mərhələsi: mənim virdim, mənim kitabxanam, öyrənmə məqsədim, uşaq rejimi,
// ana səhifəni fərdiləşdirmək. Hamısı localStorage-dadır (wird_v1, books_shelf_v1, learn_goal_v1,
// home_layout_v1 — profilə aid, hesabla uçdan-uca şifrəli sinxronlanır; mcc_kidlock — yalnız bu cihaz).
// AccountPage bu faylı tənbəl yükləyir; hər bölmə ekrana yaxınlaşanda qurulur (DeferRender).
// ═══════════════════════════════════════════════════════
import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import DeferRender from '../DeferRender'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'

const WirdPanel = lazy(() => import('../my/WirdPanel'))
const MyLibrary = lazy(() => import('../my/MyLibrary'))
const LearnGoalCard = lazy(() => import('../my/LearnGoalCard'))
const KidLockSetup = lazy(() => import('../kid/KidLockSetup'))

const T = {
  az: {
    wird: 'Mənim virdim', wirdLead: 'Gündəlik ibadət siyahınız namaz vaxtlarına görə — halqa və seriya ilə.',
    lib: 'Mənim kitabxanam', libLead: 'Oxuduğunuz, oxumaq istədiyiniz və bitirdiyiniz kitablar.',
    goal: 'Öyrənmə məqsədim', goalLead: 'Seçdiyiniz dərs yolu, həftəlik irəliləyiş və növbəti addım.',
    kid: 'Uşaq rejimi', kidLead: 'Valideyn PIN-i ilə kilidlənən sakit uşaq görünüşü.',
    home: 'Şəxsi ana səhifə', homeLead: 'Ana səhifədə hansı bölmələrin, hansı sırada görünəcəyini seçin.', homeGo: 'Ana səhifədə fərdiləşdir',
  },
  en: {
    wird: 'My wird', wirdLead: 'Your daily litany by your prayer times — with a progress ring and a streak.',
    lib: 'My library', libLead: 'The books you are reading, want to read and have finished.',
    goal: 'My learning goal', goalLead: 'The learning path you chose, weekly progress and your next step.',
    kid: 'Kid mode', kidLead: 'A calm view for children, locked with a parent PIN.',
    home: 'Personal home page', homeLead: 'Choose which sections appear on the home page, and in what order.', homeGo: 'Customize on the home page',
  },
  ru: {
    wird: 'Мой вирд', wirdLead: 'Ежедневный вирд по вашим временам намаза — с кольцом прогресса и серией.',
    lib: 'Моя библиотека', libLead: 'Книги, которые вы читаете, хотите прочитать и уже прочитали.',
    goal: 'Моя учебная цель', goalLead: 'Выбранный учебный путь, прогресс за неделю и следующий шаг.',
    kid: 'Детский режим', kidLead: 'Спокойный вид для детей, закрытый ПИН-кодом родителя.',
    home: 'Личная главная страница', homeLead: 'Выберите, какие разделы и в каком порядке показывать на главной.', homeGo: 'Настроить на главной',
  },
  ar: {
    wird: 'وِردي', wirdLead: 'وِردك اليومي حسب مواقيت صلاتك — مع حلقة التقدّم والمتتالية.',
    lib: 'مكتبتي', libLead: 'الكتب التي تقرؤها وتريد قراءتها وأتممتها.',
    goal: 'هدفي التعليمي', goalLead: 'مسار التعلم الذي اخترته، والتقدّم الأسبوعي، والخطوة التالية.',
    kid: 'وضع الأطفال', kidLead: 'واجهة هادئة للأطفال مقفلة برمز وليّ الأمر.',
    home: 'الصفحة الرئيسية الشخصية', homeLead: 'اختر الأقسام التي تظهر في الصفحة الرئيسية وترتيبها.', homeGo: 'خصّص في الصفحة الرئيسية',
  },
  tr: {
    wird: 'Benim virdim', wirdLead: 'Namaz vakitlerinize göre günlük virdiniz — ilerleme halkası ve seriyle.',
    lib: 'Kütüphanem', libLead: 'Okuduğunuz, okumak istediğiniz ve bitirdiğiniz kitaplar.',
    goal: 'Öğrenme hedefim', goalLead: 'Seçtiğiniz ders yolu, haftalık ilerleme ve sonraki adım.',
    kid: 'Çocuk modu', kidLead: 'Ebeveyn şifresiyle kilitlenen sakin bir çocuk görünümü.',
    home: 'Kişisel ana sayfa', homeLead: 'Ana sayfada hangi bölümlerin hangi sırayla görüneceğini seçin.', homeGo: 'Ana sayfada kişiselleştir',
  },
}

function Section({ icon, title, lead, id, testId, children }) {
  return (
    <section className="ui-card acc-section" aria-labelledby={id} data-testid={testId}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name={icon} size={20} /></span>
        <div>
          <h2 className="acc-section__title" id={id}>{title}</h2>
          {lead && <p className="acc-section__lead">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

export default function AccountHSections({ lang = 'az', siteLang = lang }) {
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const fb = (h) => <div style={{ minHeight: h }} />
  const homeHref = pathFor('home', siteLang)
  return (
    <>
      <Section icon="dhikr" title={t.wird} lead={t.wirdLead} id="acc-h-wird" testId="acc-wird">
        <DeferRender height="320px"><Suspense fallback={fb(320)}><WirdPanel heading={false} /></Suspense></DeferRender>
      </Section>
      <Section icon="books" title={t.lib} lead={t.libLead} id="acc-h-lib" testId="acc-library">
        <DeferRender height="200px"><Suspense fallback={fb(200)}><MyLibrary /></Suspense></DeferRender>
      </Section>
      <Section icon="learn" title={t.goal} lead={t.goalLead} id="acc-h-goal" testId="acc-goal">
        <DeferRender height="180px"><Suspense fallback={fb(180)}><LearnGoalCard standalone /></Suspense></DeferRender>
      </Section>
      <Section icon="home" title={t.home} lead={t.homeLead} id="acc-h-home" testId="acc-home">
        <a className="ui-link" href={homeHref} onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); navigate(homeHref); window.scrollTo(0, 0) } }}>
          {t.homeGo} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" />
        </a>
      </Section>
      <Section icon="kids" title={t.kid} lead={t.kidLead} id="acc-h-kid" testId="acc-kid">
        <DeferRender height="220px"><Suspense fallback={fb(220)}><KidLockSetup /></Suspense></DeferRender>
      </Section>
    </>
  )
}
