// ═══════════════════════════════════════════════════════
// /quran-meaning — "Quranda məna ilə axtar" (C dəstəsi)
//
// İstifadəçi öz sözləri ilə yazır ("səbr haqqında", "çətin gündə təsəlli"). Server
// (server/quranMeaning.js) modeldən YALNIZ ayə istinadlarını alır, yoxlayır və qaytarır.
// Hər nəticənin ərəbcə mətni və tərcüməsi saytın öz Quran mənbəyindən gəlir
// (components/quote/content → fetchAyah, alquran.cloud — Quran səhifəsi ilə eyni nəşrlər).
// Modelin yazdığı dini mətn heç vaxt göstərilmir; mövzu etiketi YOXDUR (model mətni göstərilmir).
// Ünvan: ?q=… (paylaşmaq üçün) — ilk açılışda ünvandan oxunur (mount-dan sonra).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import RelatedLinks from '../components/RelatedLinks'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { isPlainClick } from '../components/PageLink'
import { pickUi } from '../utils/uiText'
import { searchQuranMeaning, QUERY_MAX } from '../api/quranMeaning'
import { fetchAyah } from '../components/quote/content'
import '../styles/QuranMeaningPage.css'

const T = {
  az: {
    title: 'Quranda məna ilə axtar',
    lead: 'Öz sözlərinizlə yazın — mövzu, hiss və ya vəziyyət. Uyğun ayələri tapıb Quranın öz mətni ilə göstərəcəyik.',
    label: 'Nə haqqında oxumaq istəyirsiniz?', ph: 'Məs.: çətin gündə təsəlli',
    search: 'Axtar', searching: 'Axtarılır…', examples: 'Nümunələr',
    ex: ['səbr haqqında', 'valideynə hörmət', 'çətin gündə təsəlli', 'şükür', 'bağışlanma ümidi'],
    noteTitle: 'Ərəbcə mətn Qurandır',
    note: 'Ərəbcə mətn Qurandır, tərcümə isə mənanın ifadəsidir (saytın Quran mənbəyindən). Ayələri süni intellekt seçib — seçim qüsurlu ola bilər, hökm və ya təfsir deyil. Hər ayəni əvvəlki və sonrakı ayələrlə birlikdə oxuyun.',
    found: (n) => `${n} ayə tapıldı`, none: 'Uyğun ayə tapılmadı. Başqa sözlərlə yazmağa çalışın.',
    results: 'Nəticələr', open: 'Kontekstdə oxu',
    textFail: 'Mətni yükləmək alınmadı — ayəni Quran səhifəsində açın.', loadingText: 'Ayə yüklənir…',
    errors: { rate: 'Çox sorğu göndərildi. Bir dəqiqə sonra yenidən cəhd edin.', timeout: 'Cavab çox gecikdi. Yenidən cəhd edin.', network: 'Serverə qoşulmaq alınmadı. İnternet bağlantısını yoxlayın.', short: 'Bir az ətraflı yazın (ən azı 2 hərf).', upstream: 'Axtarış hazırda işləmir. Bir az sonra yenidən cəhd edin.' },
    privacy: 'Sorğunuz yalnız ayələri seçmək üçün AI xidmətinə göndərilir və saxlanılmır.',
    related: 'Quranda başqa yollar',
  },
  en: {
    title: 'Search the Quran by meaning',
    lead: 'Write in your own words — a topic, a feeling or a situation. We find matching ayahs and show them in the Quran’s own text.',
    label: 'What would you like to read about?', ph: 'E.g. comfort in hard times',
    search: 'Search', searching: 'Searching…', examples: 'Examples',
    ex: ['about patience', 'respect for parents', 'comfort in hard times', 'gratitude', 'hope of forgiveness'],
    noteTitle: 'The Arabic is the Quran',
    note: 'The Arabic is the Quran; the translation is a rendering of its meaning (from the site’s Quran source). AI chose the verses — the selection can be imperfect and is not a ruling or tafsir. Read each ayah with the ayahs before and after it.',
    found: (n) => (n === 1 ? '1 ayah found' : `${n} ayahs found`), none: 'No matching ayahs were found. Try different words.',
    results: 'Results', open: 'Read in context',
    textFail: 'The text could not be loaded — open the ayah on the Quran page.', loadingText: 'Loading the ayah…',
    errors: { rate: 'Too many searches. Please try again in a minute.', timeout: 'The answer took too long. Please try again.', network: 'Could not reach the server. Check your internet connection.', short: 'Please write a little more (at least 2 letters).', upstream: 'Search is not working right now. Please try again in a moment.' },
    privacy: 'Your query is sent to an AI service only to choose the ayahs and is not stored.',
    related: 'Other ways into the Quran',
  },
  ru: {
    title: 'Поиск по смыслу в Коране',
    lead: 'Напишите своими словами — тему, чувство или ситуацию. Мы найдём подходящие аяты и покажем их в тексте самого Корана.',
    label: 'О чём вы хотите прочитать?', ph: 'Напр.: утешение в трудное время',
    search: 'Найти', searching: 'Поиск…', examples: 'Примеры',
    ex: ['о терпении', 'уважение к родителям', 'утешение в трудное время', 'благодарность', 'надежда на прощение'],
    noteTitle: 'Арабский текст — Коран',
    note: 'Арабский текст — Коран, перевод передаёт его смысл (из источника Корана на сайте). Аяты выбрал ИИ — выбор может быть неточным и не является ни фетвой, ни тафсиром. Читайте каждый аят вместе с предыдущими и последующими.',
    found: (n) => `Найдено аятов: ${n}`, none: 'Подходящих аятов не найдено. Попробуйте другие слова.',
    results: 'Результаты', open: 'Читать в контексте',
    textFail: 'Не удалось загрузить текст — откройте аят на странице Корана.', loadingText: 'Загрузка аята…',
    errors: { rate: 'Слишком много запросов. Попробуйте через минуту.', timeout: 'Ответ занял слишком много времени. Попробуйте ещё раз.', network: 'Не удалось связаться с сервером. Проверьте подключение к интернету.', short: 'Напишите чуть подробнее (не меньше 2 букв).', upstream: 'Поиск сейчас не работает. Попробуйте чуть позже.' },
    privacy: 'Запрос отправляется сервису ИИ только для выбора аятов и не сохраняется.',
    related: 'Другие пути к Корану',
  },
  ar: {
    title: 'البحث في القرآن بالمعنى',
    lead: 'اكتب بكلماتك — موضوعًا أو شعورًا أو حالًا. نجد الآيات المناسبة ونعرضها بنص القرآن نفسه.',
    label: 'عمّ تريد أن تقرأ؟', ph: 'مثال: السلوى في الشدة',
    search: 'ابحث', searching: 'جارٍ البحث…', examples: 'أمثلة',
    ex: ['عن الصبر', 'برّ الوالدين', 'السلوى في الشدة', 'الشكر', 'رجاء المغفرة'],
    noteTitle: 'النص العربي هو القرآن',
    note: 'النص العربي هو القرآن، والترجمة بيان لمعناه (من مصدر القرآن في الموقع). اختار الذكاء الاصطناعي الآيات، وقد يكون الاختيار غير دقيق، وليس فتوى ولا تفسيرًا. اقرأ كل آية مع ما قبلها وما بعدها.',
    found: (n) => `عدد الآيات: ${n}`, none: 'لم نجد آيات مناسبة. جرّب كلمات أخرى.',
    results: 'النتائج', open: 'اقرأ في السياق',
    textFail: 'تعذّر تحميل النص — افتح الآية في صفحة القرآن.', loadingText: 'جارٍ تحميل الآية…',
    errors: { rate: 'طلبات كثيرة. حاول مرة أخرى بعد دقيقة.', timeout: 'استغرق الرد وقتًا طويلًا. حاول مرة أخرى.', network: 'تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت.', short: 'اكتب أكثر قليلًا (حرفان على الأقل).', upstream: 'البحث لا يعمل الآن. حاول بعد قليل.' },
    privacy: 'يُرسل طلبك إلى خدمة الذكاء الاصطناعي لاختيار الآيات فقط ولا يُحفظ.',
    related: 'طرق أخرى إلى القرآن',
  },
  tr: {
    title: 'Kur’an’da anlamla ara',
    lead: 'Kendi sözlerinizle yazın — bir konu, bir duygu ya da bir durum. Uygun ayetleri bulup Kur’an’ın kendi metniyle gösteririz.',
    label: 'Ne hakkında okumak istersiniz?', ph: 'Örn.: zor günde teselli',
    search: 'Ara', searching: 'Aranıyor…', examples: 'Örnekler',
    ex: ['sabır hakkında', 'anne babaya saygı', 'zor günde teselli', 'şükür', 'bağışlanma umudu'],
    noteTitle: 'Arapça metin Kur’an’dır',
    note: 'Arapça metin Kur’an’dır, meal ise anlamının ifadesidir (sitenin Kur’an kaynağından). Ayetleri yapay zekâ seçti — seçim kusurlu olabilir; fetva ya da tefsir değildir. Her ayeti önceki ve sonraki ayetlerle birlikte okuyun.',
    found: (n) => `${n} ayet bulundu`, none: 'Uygun ayet bulunamadı. Başka kelimelerle deneyin.',
    results: 'Sonuçlar', open: 'Bağlamında oku',
    textFail: 'Metin yüklenemedi — ayeti Kur’an sayfasında açın.', loadingText: 'Ayet yükleniyor…',
    errors: { rate: 'Çok fazla arama yapıldı. Bir dakika sonra tekrar deneyin.', timeout: 'Cevap çok gecikti. Tekrar deneyin.', network: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.', short: 'Biraz daha ayrıntılı yazın (en az 2 harf).', upstream: 'Arama şu anda çalışmıyor. Biraz sonra tekrar deneyin.' },
    privacy: 'Sorgunuz yalnızca ayetleri seçmek için yapay zekâ hizmetine gönderilir ve saklanmaz.',
    related: 'Kur’an’a başka yollar',
  },
}

// Əlaqəli bölmələr (RelatedLinks)
const RELATED = [
  { to: 'quranroots',
    title: { az: 'Kök axtarışı', en: 'Root search', ru: 'Поиск по корню', ar: 'البحث بالجذر', tr: 'Kök araması' },
    sub: { az: 'ərəb sözünün kökünə görə', en: 'by the root of an Arabic word', ru: 'по корню арабского слова', ar: 'بجذر الكلمة العربية', tr: 'Arapça kelimenin köküne göre' } },
  { to: 'quran',
    // lang-ok: "Quran" az və en dillərində eyni yazılır
    title: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
    sub: { az: 'surələr və tərcümə', en: 'surahs and translation', ru: 'суры и перевод', ar: 'السور والترجمة', tr: 'sureler ve meal' } },
]

const errCode = (e) => {
  if (e?.name === 'AbortError') return null
  if (e instanceof TypeError) return 'network'
  if (e?.status === 429) return 'rate'
  if (e?.status === 504 || e?.code === 'timeout') return 'timeout'
  if (e?.status === 400) return 'short'
  return 'upstream'
}

/** Bir nəticə: ayənin mətni saytın Quran mənbəyindən (kart görünəndə deyil, dərhal — ən çox 10) */
function AyahResult({ r, lang, t, idx }) {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null })
  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: 'loading', data: null })
    fetchAyah(r.s, r.a, lang, ctrl.signal)
      .then((data) => { if (!ctrl.signal.aborted) setState({ status: 'ok', data }) })
      .catch(() => { if (!ctrl.signal.aborted) setState({ status: 'error', data: null }) })
    return () => ctrl.abort()
  }, [r.s, r.a, lang])
  const href = `${pathFor('quran', lang, r.s)}?a=${r.a}`
  const d = state.data
  const headId = `qmn-r-${idx}`
  return (
    <li className="ui-card qmn-result" aria-labelledby={headId} data-ref={`${r.s}:${r.a}`}>
      <div className="qmn-result__head">
        <h3 className="qmn-result__ref" id={headId}><span className="ui-num">{d?.ref || `${r.s}:${r.a}`}</span></h3>
      </div>
      {state.status === 'loading' && <p className="qmn-result__loading" aria-busy="true">{t.loadingText}</p>}
      {state.status === 'error' && <p className="qmn-result__fail">{t.textFail}</p>}
      {state.status === 'ok' && d && (
        <figure className="qmn-result__body">
          <p className="ui-arabic qmn-result__ar" lang="ar" dir="rtl">{d.ar}</p>
          {d.text && <p className="qmn-result__tr" dir="auto">{d.text}</p>}
          {d.tname && <figcaption className="qmn-result__src">— {d.tname}</figcaption>}
        </figure>
      )}
      <a className="ui-btn ui-btn--secondary ui-btn--sm qmn-result__open" href={href}
        onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }}>
        <Icon name="quran" size={16} className="ui-btn__icon" /> {t.open}
        <Icon name="chevron" size={16} className="ui-flip-rtl" />
      </a>
    </li>
  )
}

export default function QuranMeaningPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const location = useLocation()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [phase, setPhase] = useState('idle')   // idle | loading | done | error
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [asked, setAsked] = useState('')
  const ctrlRef = useRef(null)
  const headRef = useRef(null)
  // Fokus nəticə başlığı HƏQİQƏTƏN DOM-da olanda verilir (effekt). Əvvəl rAF idi — ?q= ünvan
  // dəyişikliyi və ya gecikən commit zamanı başlıq hələ yox/yenidən qurulmuş olurdu, fokus itirdi.
  const [wantFocus, setWantFocus] = useState(0)
  useEffect(() => {
    if (!wantFocus) return
    const el = headRef.current
    if (el && document.activeElement !== el) el.focus({ preventScroll: false })
  }, [wantFocus, results])
  const inputRef = useRef(null)

  async function run(query, { focus = true } = {}) {
    const text = String(query || '').replace(/\s+/g, ' ').trim()
    if ([...text].length < 2) { setError('short'); setPhase('error'); inputRef.current?.focus(); return }
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    setPhase('loading'); setError(''); setAsked(text)
    // Ünvanda ?q= — paylaşmaq / geri qayıtmaq üçün (tarixçəni şişirtmə)
    const search = `?q=${encodeURIComponent(text)}`
    if (location.search !== search) navigate({ pathname: location.pathname, search }, { replace: true })
    try {
      const list = await searchQuranMeaning(text, lang, ctrl.signal)
      if (ctrl.signal.aborted) return
      setResults(list)
      setPhase('done')
      if (focus) setWantFocus((n) => n + 1)
    } catch (e) {
      const code = errCode(e)
      if (!code || ctrl.signal.aborted) return
      setError(code)
      setPhase('error')
    }
  }

  // İlk açılış: ünvandakı ?q= (prerender qabığında yoxdur — yalnız mount-dan sonra)
  useEffect(() => {
    let initial = ''
    try { initial = new URLSearchParams(window.location.search).get('q') || '' } catch { /* */ }
    initial = initial.slice(0, QUERY_MAX)
    if (initial) { setQ(initial); run(initial, { focus: false }) }
    return () => ctrlRef.current?.abort()
    // yalnız ilk açılışda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = (e) => { e.preventDefault(); run(q) }
  const pickExample = (ex) => { setQ(ex); run(ex) }
  const busy = phase === 'loading'
  const errText = phase === 'error' && error ? t.errors[error] || t.errors.upstream : ''

  return (
    <div className="qmn-page">
      <header className="ui-page-hero qmn-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container ui-container--narrow">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('quranmeaning'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow qmn-main">
          <form className="ui-card qmn-form" role="search" onSubmit={onSubmit} aria-busy={busy}>
            <label className="ui-field" htmlFor="qmn-q">
              <span className="ui-field__label">{t.label}</span>
            </label>
            <div className="qmn-form__row">
              <div className="ui-search qmn-form__search">
                <Icon name="search" />
                <input id="qmn-q" ref={inputRef} className="ui-input" type="search" dir="auto" autoComplete="off" enterKeyHint="search"
                  maxLength={QUERY_MAX} placeholder={t.ph} value={q} onChange={(e) => setQ(e.target.value)}
                  aria-describedby="qmn-privacy" aria-invalid={error === 'short' ? true : undefined} />
              </div>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}>
                <Icon name="search" className="ui-btn__icon" /> {busy ? t.searching : t.search}
              </button>
            </div>
            <div className="qmn-examples">
              <span className="qmn-examples__label" id="qmn-ex-label">{t.examples}</span>
              <div className="ui-chips" role="group" aria-labelledby="qmn-ex-label">
                {t.ex.map((ex) => (
                  <button key={ex} type="button" className="ui-chip" onClick={() => pickExample(ex)} disabled={busy}>{ex}</button>
                ))}
              </div>
            </div>
            <p className="qmn-privacy" id="qmn-privacy"><Icon name="shield" size={14} /> {t.privacy}</p>
          </form>

          <aside className="ui-callout ui-callout--note qmn-note">
            <Icon name="info" />
            <div><strong className="ui-callout__title">{t.noteTitle}</strong><p>{t.note}</p></div>
          </aside>

          {/* Status — ekran oxuyucusu üçün (boş role="alert" render olunmur) */}
          <p className="ui-sr-only" role="status" aria-live="polite">
            {busy ? t.searching : phase === 'done' ? (results.length ? t.found(results.length) : t.none) : ''}
          </p>
          {errText && <p className="qmn-error" role="alert"><Icon name="alert" size={16} /> {errText}</p>}

          {busy && (
            <ul className="qmn-results qmn-results--skeleton" aria-hidden="true">
              {[0, 1, 2].map((i) => <li key={i} className="ui-card qmn-skel" />)}
            </ul>
          )}

          {phase === 'done' && (
            <section className="qmn-out" aria-labelledby="qmn-results-title">
              <h2 className="ui-title ui-title--sm qmn-out__title" id="qmn-results-title" tabIndex={-1} ref={headRef}>
                {t.results}{asked ? <span className="qmn-out__q" dir="auto"> — {asked}</span> : null}
              </h2>
              {results.length ? (
                <>
                  <p className="qmn-out__count">{t.found(results.length)}</p>
                  <ol className="qmn-results">
                    {results.map((r, i) => <AyahResult key={`${r.s}:${r.a}`} r={r} lang={lang} t={t} idx={i} />)}
                  </ol>
                </>
              ) : (
                <p className="qmn-out__none">{t.none}</p>
              )}
            </section>
          )}

          <h2 className="ui-title ui-title--sm qmn-related-title">{t.related}</h2>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
