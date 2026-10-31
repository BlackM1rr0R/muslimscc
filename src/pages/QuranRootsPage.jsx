import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import { getSurahLocal } from '../data/surahNamesAz'
import { surahInfo } from '../utils/mushaf'
import {
  loadRootsIndex, findRoot, rootDetails, groupByAyah, spacedRoot, looseKey, normalizeRootInput,
  fetchAyahWords, ROOT_CAT_LABELS, verbFormLabel,
} from '../utils/quranRoots'
import '../styles/QuranRootsPage.css'

/* ══════════════════════════════════════════════════════════════════
   KÖK AXTARIŞI — /quran-roots?root=<kök>
   Quran sözlərini ərəb kökünə görə axtarış (məs. ر ح م): kökün neçə dəfə
   işləndiyi, ondan törəyən lüğət formaları (sayları ilə) və bütün ayələr —
   söz vurğulanmış halda.
   Məlumat: public/data/quran-roots.json (scripts/build-quran-roots.mjs) —
   Quranic Arabic Corpus morfologiyası (Leeds Universiteti), GNU GPL v3.
   Ayə mətni faylda yoxdur: hər ayə görünəndə Quran.com API-dən yüklənir.
   ══════════════════════════════════════════════════════════════════ */

const PAGE_SIZE = 10
const EXAMPLES = ['رحم', 'علم', 'كتب', 'قول', 'صبر', 'هدي', 'سجد', 'نور', 'شكر', 'أمن', 'تقي', 'ذكر']
// Ekran klaviaturası: kökdə rast gəlinən hərflər (həmzə formaları ilə)
const LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ء', 'أ', 'ؤ', 'ئ']

const LABELS = {
  az: {
    eyebrow: 'Quran', title: 'Kök axtarışı',
    lead: 'Ərəb dilində sözlərin çoxu üç hərfli kökdən törəyir. Kökü yazın — Quranda ondan neçə söz işləndiyini, hansı formalarda gəldiyini və bütün ayələri görün.',
    field: 'Ərəb kökü', placeholder: 'məs. ر ح م', search: 'Axtar', clear: 'Təmizlə',
    // lang-ok[Buckwalter,rHm]: transliterasiya sisteminin adı və nümunə yazılış
    hintInput: 'Hərfləri ayrı və ya bitişik yaza bilərsiniz; hərəkələr nəzərə alınmır. Latın hərfləri ilə Buckwalter yazılışı da olar (məs. rHm).',
    keyboard: 'Ərəb hərfləri', backspace: 'Son hərfi sil', examples: 'Nümunələr',
    loadingIndex: 'Köklər siyahısı yüklənir…', indexError: 'Köklər siyahısı yüklənmədi. İnternet bağlantısını yoxlayın.', retry: 'Yenidən cəhd et',
    notFound: 'Bu kök Quranda tapılmadı.', similar: 'Bənzər köklər', choose: 'Hansı kökü nəzərdə tutursunuz?',
    occurrences: 'dəfə işlənib', inAyahs: n => `${n} ayədə`, forms: 'Törəmə formalar', allForms: 'Bütün formalar', formsCount: n => `${n} forma`,
    ayahs: 'Ayələr', showing: (a, b, n) => `${a}–${b} / ${n} ayə`, more: 'Daha çox göstər',
    ayahError: 'Ayə yüklənmədi.', openAyah: 'Ayəni oxu', count: n => `${n} dəfə`,
    note: 'Saylar Quranic Arabic Corpus-un morfoloji təhlilinə əsaslanır; başqa lüğət və mənbələrdə bir qədər fərqli ola bilər.',
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    credit: 'Kök məlumatı: Quranic Arabic Corpus (Lids Universiteti) morfologiyası — mustafa0x/quran-morphology düzəlişli nüsxəsi əsasında. Lisenziya: GNU GPL v3. Ayə mətni: Quran.com API.',
    licenseLink: 'Lisenziya mətni', sourceLink: 'Mənbə',
  },
  en: {
    eyebrow: 'Quran', title: 'Root search',
    lead: 'Most Arabic words grow out of a three-letter root. Type a root to see how many times words from it occur in the Quran, in which forms, and in which verses.',
    field: 'Arabic root', placeholder: 'e.g. ر ح م', search: 'Search', clear: 'Clear',
    hintInput: 'Letters may be separated or joined; vowel marks are ignored. Buckwalter transliteration in Latin letters also works (e.g. rHm).',
    keyboard: 'Arabic letters', backspace: 'Delete the last letter', examples: 'Examples',
    loadingIndex: 'Loading the list of roots…', indexError: 'The list of roots could not be loaded. Please check your connection.', retry: 'Try again',
    notFound: 'This root was not found in the Quran.', similar: 'Similar roots', choose: 'Which root do you mean?',
    occurrences: 'occurrences', inAyahs: n => `in ${n} ${n === 1 ? 'verse' : 'verses'}`, forms: 'Derived forms', allForms: 'All forms', formsCount: n => `${n} ${n === 1 ? 'form' : 'forms'}`,
    ayahs: 'Verses', showing: (a, b, n) => `${a}–${b} of ${n} verses`, more: 'Show more',
    ayahError: 'The verse could not be loaded.', openAyah: 'Read the verse', count: n => `${n}×`,
    note: 'Counts follow the morphological analysis of the Quranic Arabic Corpus; other dictionaries and sources may differ slightly.',
    credit: 'Root data: Quranic Arabic Corpus morphology (University of Leeds), via the corrected fork mustafa0x/quran-morphology. Licence: GNU GPL v3. Verse text: Quran.com API.',
    licenseLink: 'Licence text', sourceLink: 'Source',
  },
  ru: {
    eyebrow: 'Коран', title: 'Поиск по корню',
    lead: 'Большинство арабских слов образовано от трёхбуквенного корня. Введите корень — и узнайте, сколько раз слова от него встречаются в Коране, в каких формах и в каких аятах.',
    field: 'Арабский корень', placeholder: 'напр. ر ح م', search: 'Найти', clear: 'Очистить',
    // lang-ok[Buckwalter,rHm]: transliterasiya sisteminin adı və nümunə yazılış
    hintInput: 'Буквы можно писать раздельно или слитно; огласовки не учитываются. Подходит и транслитерация Бакуолтера латиницей (напр. rHm).',
    keyboard: 'Арабские буквы', backspace: 'Удалить последнюю букву', examples: 'Примеры',
    loadingIndex: 'Загрузка списка корней…', indexError: 'Не удалось загрузить список корней. Проверьте подключение к интернету.', retry: 'Повторить',
    notFound: 'Этот корень в Коране не найден.', similar: 'Похожие корни', choose: 'Какой корень вы имеете в виду?',
    occurrences: 'употреблений', inAyahs: n => `в аятах: ${n}`, forms: 'Производные формы', allForms: 'Все формы', formsCount: n => `форм: ${n}`,
    ayahs: 'Аяты', showing: (a, b, n) => `${a}–${b} из ${n} аятов`, more: 'Показать ещё',
    ayahError: 'Не удалось загрузить аят.', openAyah: 'Читать аят', count: n => `${n} раз`,
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    note: 'Подсчёт основан на морфологическом разборе Quranic Arabic Corpus; в других словарях и источниках числа могут немного отличаться.',
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    credit: 'Данные о корнях: морфология Quranic Arabic Corpus (Университет Лидса) в исправленной версии mustafa0x/quran-morphology. Лицензия: GNU GPL v3. Текст аятов: API Quran.com.',
    licenseLink: 'Текст лицензии', sourceLink: 'Источник',
  },
  ar: {
    eyebrow: 'القرآن', title: 'البحث بالجذر',
    lead: 'تعود أكثر الكلمات العربية إلى جذر ثلاثي. اكتب الجذر لترى عدد مرات وروده في القرآن، وصيغه المشتقة، والآيات التي ورد فيها.',
    field: 'الجذر', placeholder: 'مثل: ر ح م', search: 'ابحث', clear: 'مسح',
    // lang-ok[Buckwalter,rHm]: transliterasiya sisteminin adı və nümunə yazılış
    hintInput: 'يمكن كتابة الحروف متصلة أو منفصلة، ولا تُعتبر الحركات. وتُقبل كذلك كتابة بكوالتر بالحروف اللاتينية (مثل rHm).',
    keyboard: 'الحروف العربية', backspace: 'احذف الحرف الأخير', examples: 'أمثلة',
    loadingIndex: 'جارٍ تحميل قائمة الجذور…', indexError: 'تعذّر تحميل قائمة الجذور. تحقّق من الاتصال بالإنترنت.', retry: 'أعد المحاولة',
    notFound: 'لم يُعثر على هذا الجذر في القرآن.', similar: 'جذور مشابهة', choose: 'أيّ جذر تقصد؟',
    occurrences: 'مرة', inAyahs: n => `في ${n} آية`, forms: 'الصيغ المشتقة', allForms: 'كل الصيغ', formsCount: n => `${n} صيغة`,
    ayahs: 'الآيات', showing: (a, b, n) => `${a}–${b} من ${n} آية`, more: 'عرض المزيد',
    ayahError: 'تعذّر تحميل الآية.', openAyah: 'اقرأ الآية', count: n => `${n} مرة`,
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    note: 'الأعداد مبنية على التحليل الصرفي لمدوّنة Quranic Arabic Corpus، وقد تختلف قليلًا في المعاجم والمصادر الأخرى.',
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    credit: 'بيانات الجذور: التحليل الصرفي لـ Quranic Arabic Corpus (جامعة ليدز) بنسخة mustafa0x/quran-morphology المصحّحة. الرخصة: GNU GPL v3. نص الآيات: Quran.com.',
    licenseLink: 'نص الرخصة', sourceLink: 'المصدر',
  },
  tr: {
    eyebrow: 'Kur’an', title: 'Kök araması',
    lead: 'Arapça kelimelerin çoğu üç harfli bir kökten türer. Kökü yazın; Kur’an’da ondan kaç kelime geçtiğini, hangi biçimlerde geldiğini ve bütün ayetleri görün.',
    field: 'Arapça kök', placeholder: 'örn. ر ح م', search: 'Ara', clear: 'Temizle',
    hintInput: 'Harfleri ayrı ya da bitişik yazabilirsiniz; harekeler dikkate alınmaz. Latin harfli Buckwalter yazımı da olur (örn. rHm).',
    keyboard: 'Arap harfleri', backspace: 'Son harfi sil', examples: 'Örnekler',
    loadingIndex: 'Kök listesi yükleniyor…', indexError: 'Kök listesi yüklenemedi. İnternet bağlantınızı kontrol edin.', retry: 'Tekrar dene',
    notFound: 'Bu kök Kur’an’da bulunamadı.', similar: 'Benzer kökler', choose: 'Hangi kökü kastediyorsunuz?',
    occurrences: 'kez geçiyor', inAyahs: n => `${n} ayette`, forms: 'Türemiş biçimler', allForms: 'Bütün biçimler', formsCount: n => `${n} biçim`,
    ayahs: 'Ayetler', showing: (a, b, n) => `${a}–${b} / ${n} ayet`, more: 'Daha fazla göster',
    ayahError: 'Ayet yüklenemedi.', openAyah: 'Ayeti oku', count: n => `${n} kez`,
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    note: 'Sayılar Quranic Arabic Corpus’un morfolojik tahliline dayanır; başka sözlük ve kaynaklarda biraz farklı olabilir.',
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    credit: 'Kök verisi: Quranic Arabic Corpus (Leeds Üniversitesi) morfolojisi — mustafa0x/quran-morphology düzeltilmiş sürümü üzerinden. Lisans: GNU GPL v3. Ayet metni: Quran.com API.',
    licenseLink: 'Lisans metni', sourceLink: 'Kaynak',
  },
}

const readRootParam = search => new URLSearchParams(search || '').get('root') || ''

function surahLabel(s, lang) {
  const info = surahInfo(s)
  if (!info) return String(s)
  if (lang === 'ar') return info.ar
  return getSurahLocal(s, lang)?.name || info.latin
}

/** Bir ayə: mətn API-dən, kökdən olan sözlər vurğulanır */
function AyahCard({ item, L, lang, onOpen }) {
  const [state, setState] = useState({ status: 'loading', words: null })
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let alive = true
    setState({ status: 'loading', words: null })
    fetchAyahWords(item.key)
      .then(words => { if (alive) setState({ status: 'ok', words }) })
      .catch(() => { if (alive) setState({ status: 'error', words: null }) })
    return () => { alive = false }
  }, [item.key, reload])
  const href = `${pathFor('quran', lang, item.s)}?a=${item.a}`
  return (
    <li className="ui-card qr-ayah">
      <div className="qr-ayah__head">
        <a className="qr-ayah__ref" href={href} onClick={onOpen(href)}>
          <span className="qr-ayah__surah">{surahLabel(item.s, lang)}</span>
          <span className="ui-num qr-ayah__key" dir="ltr">{item.key}</span>
        </a>
        <span className="qr-ayah__lemmas ui-arabic" lang="ar" dir="rtl">{item.lemmas.join(' · ')}</span>
      </div>
      {state.status === 'loading' && (
        <div className="qr-ayah__skel" aria-hidden="true">
          <span className="ui-skeleton ui-skeleton--text" />
          <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '70%' }} />
        </div>
      )}
      {state.status === 'error' && (
        <p className="qr-ayah__err" role="alert">
          {L.ayahError}{' '}
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setReload(n => n + 1)}>
            <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
          </button>
        </p>
      )}
      {state.status === 'ok' && (
        <p className="qr-ayah__text ui-arabic" lang="ar" dir="rtl">
          {state.words.map((w, i) => (
            <span key={`${w.p}-${i}`}>
              {w.type === 'end'
                ? <span className="qr-ayah__end">{w.text}</span>
                : item.words.includes(w.p) ? <mark className="qr-hit">{w.text}</mark> : w.text}
              {i < state.words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      )}
      <a className="ui-link qr-ayah__open" href={href} onClick={onOpen(href)}>
        {L.openAyah} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
      </a>
    </li>
  )
}

export default function QuranRootsPage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.az
  const location = useLocation()
  const routerNavigate = useNavigate()
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  const [index, setIndex] = useState(null)
  const [indexError, setIndexError] = useState(false)
  const [indexReload, setIndexReload] = useState(0)
  const [query, setQuery] = useState(() => readRootParam(location.search))
  const [input, setInput] = useState(() => readRootParam(location.search))
  const [form, setForm] = useState(null)      // seçilmiş lemma (null — hamısı)
  const [shown, setShown] = useState(PAGE_SIZE)
  const [kbOpen, setKbOpen] = useState(false)

  useEffect(() => {
    let alive = true
    setIndexError(false)
    loadRootsIndex()
      .then(d => { if (alive) setIndex(d) })
      .catch(() => { if (alive) setIndexError(true) })
    return () => { alive = false }
  }, [indexReload])

  // URL → sorğu (Geri/İrəli)
  useEffect(() => {
    const r = readRootParam(location.search)
    if (r !== query) { setQuery(r); setInput(r) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const runSearch = (value) => {
    const q = String(value || '').trim()
    setQuery(q)
    setInput(q)
    setForm(null)
    setShown(PAGE_SIZE)
    const search = q ? `?root=${encodeURIComponent(q)}` : ''
    if (window.location.search !== search) {
      routerNavigate({ pathname: window.location.pathname, search }, { replace: false, state: window.history.state?.usr ?? null })
    }
  }

  const found = useMemo(() => (index && query ? findRoot(index.roots, query) : { root: null, candidates: [] }), [index, query])
  const details = useMemo(() => (found.root ? rootDetails(index.roots[found.root]) : null), [found.root, index])
  const ayahs = useMemo(() => {
    if (!details) return []
    const locs = form ? details.locations.filter(l => l[3] === form) : details.locations
    return groupByAyah(locs)
  }, [details, form])
  const allAyahCount = useMemo(() => (details ? groupByAyah(details.locations).length : 0), [details])

  // Tapılmayanda bənzər köklər: ilk iki hərfi eyni olanlar (həmzəsiz müqayisə)
  const similar = useMemo(() => {
    if (!index || !query || found.root || found.candidates.length) return []
    const q = looseKey(normalizeRootInput(query))
    if (q.length < 2) return []
    const head = q.slice(0, 2)
    return Object.keys(index.roots).filter(r => looseKey(r).startsWith(head)).slice(0, 12)
  }, [index, query, found])

  const onOpen = href => e => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    routerNavigate(href)
  }

  const typeLetter = ch => {
    setInput(v => v + ch)
    inputRef.current?.focus()
  }

  const cats = ROOT_CAT_LABELS[lang] || ROOT_CAT_LABELS.en
  const visible = ayahs.slice(0, shown)

  return (
    <div className="qr-page">
      <header className="ui-page-hero qr-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          <p className="ui-lead">{L.lead}</p>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container qr-layout">
          <form className="ui-card qr-search" role="search" onSubmit={e => { e.preventDefault(); runSearch(input) }}>
            <label className="ui-field">
              <span className="ui-field__label">{L.field}</span>
              <span className="qr-search__row">
                <input ref={inputRef} className="ui-input qr-search__input" type="search" dir="auto" lang="ar"
                  autoComplete="off" autoCapitalize="off" spellCheck={false}
                  value={input} placeholder={L.placeholder} onChange={e => setInput(e.target.value)} />
                <button type="submit" className="ui-btn ui-btn--primary">
                  <Icon name="search" className="ui-btn__icon" /> {L.search}
                </button>
              </span>
              <span className="ui-field__hint">{L.hintInput}</span>
            </label>

            <div className="qr-kb">
              <button type="button" className="ui-chip" aria-pressed={kbOpen} aria-controls="qr-kb-pad" onClick={() => setKbOpen(v => !v)}>
                <Icon name="arabic" size={16} /> {L.keyboard}
              </button>
              {input && (
                <button type="button" className="ui-chip" onClick={() => { setInput(''); runSearch(''); inputRef.current?.focus() }}>
                  <Icon name="close" size={14} /> {L.clear}
                </button>
              )}
            </div>
            {kbOpen && (
              <div id="qr-kb-pad" className="qr-kb__pad" role="group" aria-label={L.keyboard} dir="rtl" lang="ar">
                {LETTERS.map(ch => (
                  <button key={ch} type="button" className="qr-kb__key ui-arabic" onClick={() => typeLetter(ch)}>{ch}</button>
                ))}
                <button type="button" className="qr-kb__key qr-kb__key--wide" onClick={() => setInput(v => [...v].slice(0, -1).join(''))} aria-label={L.backspace} title={L.backspace}>
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            )}

            <div className="qr-examples">
              <span className="qr-examples__label">{L.examples}:</span>
              {EXAMPLES.map(r => (
                <button key={r} type="button" className="ui-chip qr-root-chip ui-arabic" lang="ar" aria-pressed={found.root === r} onClick={() => runSearch(r)}>
                  {spacedRoot(r)}
                </button>
              ))}
            </div>
          </form>

          <div ref={resultsRef} className="qr-results" aria-live="polite">
            {!index && !indexError && query && <p className="qr-status" role="status">{L.loadingIndex}</p>}
            {indexError && (
              <div className="qr-empty" role="alert">
                <p>{L.indexError}</p>
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setIndexReload(n => n + 1)}>
                  <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
                </button>
              </div>
            )}

            {index && query && !found.root && found.candidates.length > 0 && (
              <div className="ui-card qr-empty">
                <p>{L.choose}</p>
                <div className="qr-chips">
                  {found.candidates.map(r => (
                    <button key={r} type="button" className="ui-chip qr-root-chip ui-arabic" lang="ar" onClick={() => runSearch(r)}>{spacedRoot(r)}</button>
                  ))}
                </div>
              </div>
            )}

            {index && query && !found.root && !found.candidates.length && (
              <div className="ui-card qr-empty">
                <span className="ui-icon-tile ui-icon-tile--lg" aria-hidden="true"><Icon name="search" /></span>
                <p>{L.notFound}</p>
                {similar.length > 0 && (
                  <>
                    <p className="qr-muted">{L.similar}:</p>
                    <div className="qr-chips">
                      {similar.map(r => (
                        <button key={r} type="button" className="ui-chip qr-root-chip ui-arabic" lang="ar" onClick={() => runSearch(r)}>{spacedRoot(r)}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {details && (
              <>
                <section className="ui-card qr-summary" aria-labelledby="qr-root-title">
                  <h2 id="qr-root-title" className="qr-summary__root ui-arabic" lang="ar" dir="rtl">{spacedRoot(found.root)}</h2>
                  <div className="qr-summary__stats">
                    <div className="ui-stat">
                      <span className="ui-stat__num">{details.total}</span>
                      <span className="ui-stat__label">{L.occurrences}</span>
                    </div>
                    <div className="ui-stat">
                      <span className="ui-stat__num">{details.forms.length}</span>
                      <span className="ui-stat__label">{L.forms}</span>
                    </div>
                    <div className="ui-stat">
                      <span className="ui-stat__num">{allAyahCount}</span>
                      <span className="ui-stat__label">{L.ayahs}</span>
                    </div>
                  </div>
                  <p className="qr-muted qr-summary__note"><Icon name="info" size={14} /> {L.note}</p>
                </section>

                <section className="qr-forms" aria-labelledby="qr-forms-title">
                  <h2 id="qr-forms-title" className="ui-title ui-title--sm">{L.forms} <span className="qr-muted">· {L.formsCount(details.forms.length)}</span></h2>
                  <div className="qr-forms__list" role="group" aria-label={L.forms}>
                    <button type="button" className="ui-chip" aria-pressed={form === null} onClick={() => { setForm(null); setShown(PAGE_SIZE) }}>
                      {L.allForms} <span className="ui-num qr-forms__n">{details.total}</span>
                    </button>
                    {details.forms.map(f => (
                      <button key={f.lemma} type="button" className="ui-chip qr-form" aria-pressed={form === f.lemma}
                        onClick={() => { setForm(form === f.lemma ? null : f.lemma); setShown(PAGE_SIZE) }}>
                        <span className="qr-form__lemma ui-arabic" lang="ar">{f.lemma}</span>
                        <span className="qr-form__cat">
                          {cats[f.cat] || ''}{f.cat === 'V' && f.vf ? ` · ${verbFormLabel(f.vf, lang)}` : ''}
                        </span>
                        <span className="ui-num qr-forms__n">{f.count}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="qr-ayahs" aria-labelledby="qr-ayahs-title">
                  <div className="qr-ayahs__head">
                    <h2 id="qr-ayahs-title" className="ui-title ui-title--sm">{L.ayahs}</h2>
                    <span className="qr-muted">{L.showing(1, Math.min(shown, ayahs.length), ayahs.length)}</span>
                  </div>
                  <ol className="qr-ayahs__list">
                    {visible.map(item => (
                      <AyahCard key={item.key} item={item} L={L} lang={lang} onOpen={onOpen} />
                    ))}
                  </ol>
                  {shown < ayahs.length && (
                    <button type="button" className="ui-btn ui-btn--secondary qr-more" onClick={() => setShown(n => n + PAGE_SIZE)}>
                      {L.more} <span className="ui-num qr-muted">({ayahs.length - shown})</span>
                    </button>
                  )}
                </section>
              </>
            )}
          </div>

          <footer className="qr-credit">
            <p>{L.credit}</p>
            <p className="qr-credit__links">
              <a className="ui-link" href="https://corpus.quran.com" target="_blank" rel="noopener noreferrer">corpus.quran.com <Icon name="external" size={14} /></a>
              <a className="ui-link" href="https://github.com/mustafa0x/quran-morphology" target="_blank" rel="noopener noreferrer">{L.sourceLink} <Icon name="external" size={14} /></a>
              <a className="ui-link" href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer">{L.licenseLink} <Icon name="external" size={14} /></a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
