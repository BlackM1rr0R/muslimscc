// ═══════════════════════════════════════════════════════
// /share — PWA paylaşma hədəfi ("Paylaş → Muslims.cc", Android)
//
// • public/site.webmanifest → share_target (GET): /share?title=…&text=…&url=…
//   Şəkil qəbul edilmir (halal yoxlamasında OCR yoxdur) — service worker POST tutmur.
// • Paylaşılan mətn ünvandan YALNIZ mount-dan sonra oxunur (prerender qabığı = giriş
//   izahı; ilk klient render onunla eyni). Mətni dəyişmək / yapışdırmaq da olar.
// • Ağıllı əməllər (utils/shareIntent): ərəbcə → Quranda tap (alquran.cloud, saytın
//   Quran səhifəsi ilə eyni mənbə; yalnız düymə basılanda), mətn → məna ilə axtar
//   (/quran-meaning?q=), E-kod / ştrixkod → halal yoxlaması (/halal-check?q= | ?barcode=),
//   hər şey → dua gündəliyinə (yalnız bu cihazda, "dua_journal").
// • public/sw.js paylaşılan ünvanı (sorğulu /share) keşə yazmır — şəxsi mətn Cache Storage-da qalmır.
// • noindex (routes.js). tests/e2e/share-target.spec.js, tests/unit/share-intent.test.js
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { pathFor } from '../seo/routes'
import { isPlainClick } from '../components/PageLink'
import { pickUi } from '../utils/uiText'
import {
  readShareParams, classifyShare, duaTextFromShare, halalQuery, appendDuaJournal, LIMITS,
} from '../utils/shareIntent'
import '../styles/ShareTargetPage.css'

// Brend / mənbə adları — dil kontekstindən kənarda (hər dildə eyni yazılır)
const OFF = 'Open Food Facts'
const AQC = 'alquran.cloud (Simple Clean)'
const CHROME = 'Chrome'

const T = {
  az: {
    title: 'Paylaşılanı aç', eyebrow: 'Muslims.cc tətbiqi',
    lead: 'Başqa tətbiqdən paylaşdığınız mətn və ya keçid üçün uyğun addımı seçin: Quranda tapın, mənasına görə ayə axtarın, halal yoxlayın və ya dua gündəliyinə yazın.',
    label: 'Paylaşılan mətn', ph: 'Mətni bura yapışdırın — məsələn, ərəbcə ayə, tərkib siyahısı və ya dua',
    link: 'Keçid', clear: 'Təmizlə', actions: 'Nə etmək istəyirsiniz?', best: 'Tövsiyə olunur',
    empty: 'Hələ heç nə paylaşılmayıb. Mətn yapışdırın və ya aşağıdakı kimi telefonunuzdan paylaşın.',
    quranT: 'Quranda tap', quranD: 'Ərəbcə mətni Quranın mətnində axtarır (hərəkəsiz).', quranBtn: 'Quranda axtar',
    meaningT: 'Məna ilə ayə axtar', meaningD: 'Mətnin mövzusuna uyğun ayələri tapır.', meaningBtn: 'Məna ilə axtar',
    halalT: 'Halal yoxla', halalD: (n) => (n === 1 ? 'Mətndə 1 E-kod tapıldı — mənşəyinə baxın.' : `Mətndə ${n} E-kod tapıldı — mənşəyinə baxın.`),
    halalBc: `Ştrixkodla məhsulu ${OFF} bazasında yoxlayın.`, halalIngr: 'Tərkib siyahısındakı E-kodları və ştrixkodu yoxlayın.', halalBtn: 'Halal yoxlamasını aç',
    duaT: 'Dua gündəliyinə yaz', duaD: 'Mətn aktiv dua kimi saxlanılır — yalnız bu cihazda.', duaBtn: 'Gündəliyə saxla',
    saved: 'Dua gündəliyinə əlavə olundu.', openJournal: 'Gündəliyi aç', saveFail: 'Saxlanmadı: brauzerin yaddaşı bağlıdır.',
    searching: 'Quranda axtarılır…', found: (n) => (n === 1 ? '1 ayə tapıldı' : `${n} ayə tapıldı`), shownOf: (a, b) => `İlk ${a} nəticə göstərilir (cəmi ${b}).`,
    none: 'Quranın mətnində dəqiq uyğunluq tapılmadı. Yazılış fərqli ola bilər — məna ilə axtarışı yoxlayın.',
    fail: 'Axtarış alınmadı. İnternet bağlantısını yoxlayın.', retry: 'Yenidən', open: 'Ayəni aç', src: `Mətn: ${AQC}`,
    howT: 'Necə işləyir', how: [
      ['Tətbiqi quraşdırın', `Android-də ${CHROME} menyusunda «Tətbiqi quraşdır» və ya «Əsas ekrana əlavə et» seçin.`],
      ['Paylaşın', 'İstənilən tətbiqdə mətni seçin və ya «Paylaş» düyməsinə basın, siyahıdan Muslims.cc-ni seçin.'],
      ['Addımı seçin', 'Mətn burada açılır — uyğun əməl ən yuxarıda göstərilir.'],
    ],
    privacy: 'Paylaşılan mətn heç yerə avtomatik göndərilmir: yalnız seçdiyiniz addım işləyir.',
  },
  en: {
    title: 'Open what you shared', eyebrow: 'Muslims.cc app',
    lead: 'Pick the right step for text or a link you shared from another app: find it in the Quran, search verses by meaning, check halal, or write it in your dua journal.',
    label: 'Shared text', ph: 'Paste text here — for example an Arabic verse, an ingredients list or a dua',
    link: 'Link', clear: 'Clear', actions: 'What would you like to do?', best: 'Recommended',
    empty: 'Nothing has been shared yet. Paste some text, or share from your phone as shown below.',
    quranT: 'Find in the Quran', quranD: 'Searches the Quran text for the Arabic words (without vowel marks).', quranBtn: 'Search the Quran',
    meaningT: 'Search verses by meaning', meaningD: 'Finds verses that match the topic of the text.', meaningBtn: 'Search by meaning',
    halalT: 'Check halal', halalD: (n) => (n === 1 ? '1 E-number found in the text — see where it comes from.' : `${n} E-numbers found in the text — see where they come from.`),
    halalBc: `Look up the product by barcode in the ${OFF} database.`, halalIngr: 'Check the E-numbers in the ingredients list and the barcode.', halalBtn: 'Open the halal check',
    duaT: 'Write in the dua journal', duaD: 'The text is saved as an active dua — on this device only.', duaBtn: 'Save to journal',
    saved: 'Added to your dua journal.', openJournal: 'Open the journal', saveFail: 'Not saved: browser storage is blocked.',
    searching: 'Searching the Quran…', found: (n) => (n === 1 ? '1 verse found' : `${n} verses found`), shownOf: (a, b) => `Showing the first ${a} of ${b} results.`,
    none: 'No exact match in the Quran text. The spelling may differ — try the search by meaning.',
    fail: 'The search failed. Please check your connection.', retry: 'Try again', open: 'Open the verse', src: `Text: ${AQC}`,
    howT: 'How it works', how: [
      ['Install the app', `On Android, open the ${CHROME} menu and choose “Install app” or “Add to Home screen”.`],
      ['Share', 'In any app, select text or tap “Share”, then choose Muslims.cc from the list.'],
      ['Pick a step', 'The text opens here — the most fitting action is shown first.'],
    ],
    privacy: 'Shared text is never sent anywhere automatically: only the step you choose runs.',
  },
  ru: {
    title: 'Открыть отправленное', eyebrow: 'Приложение Muslims.cc',
    lead: 'Выберите подходящий шаг для текста или ссылки из другого приложения: найти в Коране, искать аяты по смыслу, проверить халяль или записать в дневник дуа.',
    label: 'Отправленный текст', ph: 'Вставьте текст сюда — например, аят на арабском, состав продукта или дуа',
    link: 'Ссылка', clear: 'Очистить', actions: 'Что вы хотите сделать?', best: 'Рекомендуем',
    empty: 'Пока ничего не отправлено. Вставьте текст или поделитесь с телефона, как показано ниже.',
    quranT: 'Найти в Коране', quranD: 'Ищет арабские слова в тексте Корана (без огласовок).', quranBtn: 'Искать в Коране',
    meaningT: 'Искать аяты по смыслу', meaningD: 'Находит аяты, подходящие к теме текста.', meaningBtn: 'Искать по смыслу',
    halalT: 'Проверить халяль', halalD: (n) => `Найдено E-кодов в тексте: ${n} — посмотрите их происхождение.`,
    halalBc: `Найдите продукт по штрихкоду в базе ${OFF}.`, halalIngr: 'Проверьте E-коды из состава и штрихкод.', halalBtn: 'Открыть проверку халяль',
    duaT: 'Записать в дневник дуа', duaD: 'Текст сохраняется как активное дуа — только на этом устройстве.', duaBtn: 'Сохранить в дневник',
    saved: 'Добавлено в дневник дуа.', openJournal: 'Открыть дневник', saveFail: 'Не сохранено: хранилище браузера заблокировано.',
    searching: 'Поиск в Коране…', found: (n) => `Найдено аятов: ${n}`, shownOf: (a, b) => `Показаны первые ${a} из ${b}.`,
    none: 'Точного совпадения в тексте Корана нет. Написание может отличаться — попробуйте поиск по смыслу.',
    fail: 'Поиск не удался. Проверьте подключение к интернету.', retry: 'Повторить', open: 'Открыть аят', src: `Текст: ${AQC}`,
    howT: 'Как это работает', how: [
      ['Установите приложение', `На Android откройте меню ${CHROME} и выберите «Установить приложение» или «Добавить на главный экран».`],
      ['Поделитесь', 'В любом приложении выделите текст или нажмите «Поделиться» и выберите Muslims.cc.'],
      ['Выберите шаг', 'Текст откроется здесь — самое подходящее действие показано первым.'],
    ],
    privacy: 'Отправленный текст никуда не передаётся автоматически: выполняется только выбранный вами шаг.',
  },
  ar: {
    title: 'افتح ما شاركته', eyebrow: 'تطبيق Muslims.cc',
    lead: 'اختر الخطوة المناسبة للنص أو الرابط الذي شاركته من تطبيق آخر: ابحث عنه في القرآن، أو ابحث عن الآيات بالمعنى، أو افحص الحلال، أو اكتبه في مذكرة الدعاء.',
    label: 'النص المشارَك', ph: 'الصق النص هنا — مثلًا آية بالعربية أو قائمة مكوّنات أو دعاء',
    link: 'الرابط', clear: 'مسح', actions: 'ماذا تريد أن تفعل؟', best: 'مقترح',
    empty: 'لم يُشارَك شيء بعد. الصق نصًا أو شارك من هاتفك كما هو موضّح أدناه.',
    quranT: 'ابحث في القرآن', quranD: 'يبحث عن الكلمات العربية في نص القرآن (دون تشكيل).', quranBtn: 'ابحث في القرآن',
    meaningT: 'ابحث عن الآيات بالمعنى', meaningD: 'يجد آيات تناسب موضوع النص.', meaningBtn: 'ابحث بالمعنى',
    halalT: 'افحص الحلال', halalD: (n) => `عدد رموز E في النص: ${n} — اطّلع على مصدرها.`,
    halalBc: `ابحث عن المنتج بالباركود في قاعدة ${OFF}.`, halalIngr: 'افحص رموز E في قائمة المكوّنات والباركود.', halalBtn: 'افتح فحص الحلال',
    duaT: 'اكتب في مذكرة الدعاء', duaD: 'يُحفظ النص دعاءً نشطًا — على هذا الجهاز فقط.', duaBtn: 'احفظ في المذكرة',
    saved: 'أُضيف إلى مذكرة الدعاء.', openJournal: 'افتح المذكرة', saveFail: 'لم يُحفظ: تخزين المتصفح مغلق.',
    searching: 'جارٍ البحث في القرآن…', found: (n) => `عدد الآيات: ${n}`, shownOf: (a, b) => `تُعرض أول ${a} من ${b}.`,
    none: 'لا تطابق تامًّا في نص القرآن. قد يختلف الرسم — جرّب البحث بالمعنى.',
    fail: 'تعذّر البحث. تحقّق من الاتصال بالإنترنت.', retry: 'أعد المحاولة', open: 'افتح الآية', src: `النص: ${AQC}`,
    howT: 'كيف يعمل', how: [
      ['ثبّت التطبيق', `على أندرويد افتح قائمة ${CHROME} واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».`],
      ['شارك', 'في أي تطبيق حدّد النص أو اضغط «مشاركة» ثم اختر Muslims.cc من القائمة.'],
      ['اختر الخطوة', 'يُفتح النص هنا — ويظهر الإجراء الأنسب أولًا.'],
    ],
    privacy: 'لا يُرسل النص المشارَك إلى أي مكان تلقائيًا: تعمل الخطوة التي تختارها فقط.',
  },
  tr: {
    title: 'Paylaşılanı aç', eyebrow: 'Muslims.cc uygulaması',
    lead: 'Başka bir uygulamadan paylaştığınız metin veya bağlantı için uygun adımı seçin: Kur’an’da bulun, anlamına göre ayet arayın, helal kontrolü yapın veya dua günlüğüne yazın.',
    label: 'Paylaşılan metin', ph: 'Metni buraya yapıştırın — örneğin Arapça bir ayet, içindekiler listesi veya bir dua',
    link: 'Bağlantı', clear: 'Temizle', actions: 'Ne yapmak istersiniz?', best: 'Önerilen',
    empty: 'Henüz bir şey paylaşılmadı. Metin yapıştırın veya aşağıdaki gibi telefonunuzdan paylaşın.',
    quranT: 'Kur’an’da bul', quranD: 'Arapça kelimeleri Kur’an metninde arar (harekesiz).', quranBtn: 'Kur’an’da ara',
    meaningT: 'Anlamına göre ayet ara', meaningD: 'Metnin konusuna uygun ayetleri bulur.', meaningBtn: 'Anlamla ara',
    halalT: 'Helal kontrolü', halalD: (n) => `Metinde ${n} E-kodu bulundu — kaynağına bakın.`,
    halalBc: `Ürünü barkodla ${OFF} veri tabanında kontrol edin.`, halalIngr: 'İçindekiler listesindeki E-kodlarını ve barkodu kontrol edin.', halalBtn: 'Helal kontrolünü aç',
    duaT: 'Dua günlüğüne yaz', duaD: 'Metin aktif dua olarak saklanır — yalnızca bu cihazda.', duaBtn: 'Günlüğe kaydet',
    saved: 'Dua günlüğüne eklendi.', openJournal: 'Günlüğü aç', saveFail: 'Kaydedilmedi: tarayıcı depolaması kapalı.',
    searching: 'Kur’an’da aranıyor…', found: (n) => `${n} ayet bulundu`, shownOf: (a, b) => `İlk ${a} sonuç gösteriliyor (toplam ${b}).`,
    none: 'Kur’an metninde tam eşleşme bulunamadı. Yazım farklı olabilir — anlamla aramayı deneyin.',
    fail: 'Arama yapılamadı. İnternet bağlantınızı kontrol edin.', retry: 'Tekrar dene', open: 'Ayeti aç', src: `Metin: ${AQC}`,
    howT: 'Nasıl çalışır', how: [
      ['Uygulamayı yükleyin', `Android’de ${CHROME} menüsünden «Uygulamayı yükle» veya «Ana ekrana ekle»yi seçin.`],
      ['Paylaşın', 'Herhangi bir uygulamada metni seçin veya «Paylaş»a dokunun, listeden Muslims.cc’yi seçin.'],
      ['Adımı seçin', 'Metin burada açılır — en uygun işlem en üstte gösterilir.'],
    ],
    privacy: 'Paylaşılan metin hiçbir yere otomatik gönderilmez: yalnızca seçtiğiniz adım çalışır.',
  },
}

const ICONS = { quran: 'quran', meaning: 'quranmeaning', halal: 'halalcheck', dua: 'duajournal' }
const SHOW_MAX = 10
const QURAN_SEARCH = (q) => `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/quran-simple-clean`

/** Sayt daxili keçid: adi klik — SPA naviqasiyası, Ctrl/orta klik — brauzerin özü */
function InLink({ href, className, children }) {
  const navigate = useNavigate()
  return (
    <a className={className} href={href}
      onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }}>
      {children}
    </a>
  )
}

export default function ShareTargetPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const uid = useId().replace(/:/g, '')
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState('')      // '' | 'ok' | 'fail'
  const [qs, setQs] = useState({ phase: 'idle' }) // Quran axtarışı: idle | loading | done | error
  const ctrlRef = useRef(null)
  const resultsRef = useRef(null)

  // Paylaşılan sahələr — yalnız mount-dan sonra (prerender ilə ilk render eyni olsun)
  useEffect(() => {
    const p = readShareParams(window.location.search)
    const parts = []
    if (p.title && !p.text.includes(p.title)) parts.push(p.title)
    if (p.text) parts.push(p.text)
    if (p.url && !p.text.includes(p.url)) parts.push(p.url)
    if (parts.length) setDraft(parts.join('\n').slice(0, LIMITS.text))
    // Şəxsi mətn ünvanda qalmasın (tarixçə, eyni-mənşəli Referer, təkrar açılış) — sorğu sətrini sil
    if (window.location.search) {
      try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash) } catch { /* */ }
    }
    return () => ctrlRef.current?.abort()
  }, [])

  const c = useMemo(() => classifyShare({ text: draft }), [draft])
  // Mətn dəyişəndə əvvəlki nəticələr köhnəlir
  useEffect(() => { setSaved(''); ctrlRef.current?.abort(); setQs({ phase: 'idle' }) }, [draft])

  const searchQuran = async () => {
    if (!c.quranQuery) return
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    setQs({ phase: 'loading' })
    try {
      const r = await fetch(QURAN_SEARCH(c.quranQuery), { signal: ctrl.signal })
      // API tapılmayanda 404 JSON qaytarır — bu "nəticə yoxdur"dur, xəta deyil
      const d = await r.json().catch(() => null)
      if (ctrl.signal.aborted) return
      if (!r.ok && r.status !== 404) throw new Error(String(r.status))
      const matches = d?.code === 200 && Array.isArray(d.data?.matches) ? d.data.matches : []
      const list = matches
        .filter((m) => m?.surah?.number && m.numberInSurah)
        .map((m) => ({ s: m.surah.number, a: m.numberInSurah, name: String(m.surah.name || ''), text: String(m.text || '').replace(/^﻿/, '') }))
      setQs({ phase: 'done', list, total: d?.data?.count || list.length })
      requestAnimationFrame(() => resultsRef.current?.focus())
    } catch {
      if (!ctrl.signal.aborted) setQs({ phase: 'error' })
    }
  }

  const saveDua = () => {
    let store = null
    try { store = window.localStorage } catch { /* yaddaş bağlıdır */ }
    const id = appendDuaJournal(store, duaTextFromShare(c))
    setSaved(id ? 'ok' : 'fail')
  }

  const has = Boolean(draft.trim())
  const halalDesc = c.ecodes.length ? t.halalD(c.ecodes.length) : c.barcode ? t.halalBc : t.halalIngr
  const status = qs.phase === 'loading' ? t.searching
    : qs.phase === 'done' ? (qs.list.length ? t.found(qs.total) : t.none)
    : saved === 'ok' ? t.saved : ''

  const card = (key, i) => {
    const best = i === 0 && c.actions.length > 1
    const head = (title, desc) => (
      <div className="shr-act__head">
        <span className="shr-act__icon" aria-hidden="true"><Icon name={ICONS[key]} size={22} /></span>
        <div className="shr-act__text">
          <h3 className="shr-act__title" id={`${uid}-${key}`}>
            {title}{best && <span className="ui-badge ui-badge--brand shr-act__best">{t.best}</span>}
          </h3>
          <p className="shr-act__desc">{desc}</p>
        </div>
      </div>
    )
    if (key === 'quran') {
      return (
        <li key={key} className={`ui-card shr-act${best ? ' is-best' : ''}`} aria-labelledby={`${uid}-${key}`} data-action={key}>
          {head(t.quranT, t.quranD)}
          <p className="shr-act__q" lang="ar" dir="rtl">{c.quranQuery}</p>
          <button type="button" className={`ui-btn ${best ? 'ui-btn--primary' : 'ui-btn--secondary'} shr-act__btn`} onClick={searchQuran} disabled={qs.phase === 'loading'}>
            <Icon name="search" className="ui-btn__icon" /> {qs.phase === 'loading' ? t.searching : t.quranBtn}
          </button>
          {qs.phase === 'error' && (
            <p className="shr-err" role="alert"><Icon name="alert" size={16} /> {t.fail}
              <button type="button" className="ui-link" onClick={searchQuran}>{t.retry}</button></p>
          )}
          {qs.phase === 'done' && (
            <div className="shr-res" data-testid="share-quran-results">
              <p className="shr-res__count" tabIndex={-1} ref={resultsRef}>
                {qs.list.length ? t.found(qs.total) : t.none}
                {qs.list.length > SHOW_MAX ? ` ${t.shownOf(SHOW_MAX, qs.total)}` : ''}
              </p>
              {qs.list.length > 0 && (
                <ol className="shr-res__list">
                  {qs.list.slice(0, SHOW_MAX).map((m) => {
                    const href = `${pathFor('quran', lang, m.s)}?a=${m.a}`
                    return (
                      <li key={`${m.s}:${m.a}`} className="shr-res__item">
                        <p className="shr-res__ar ui-arabic" lang="ar" dir="rtl">{m.text}</p>
                        <div className="shr-res__meta">
                          <span className="shr-res__ref"><span lang="ar" dir="rtl">{m.name}</span> <span className="ui-num" dir="ltr">{m.s}:{m.a}</span></span>
                          <InLink href={href} className="ui-btn ui-btn--ghost ui-btn--sm">{t.open} <Icon name="arrow" size={16} className="ui-btn__icon ui-flip-rtl" /></InLink>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
              <p className="shr-res__src">{t.src}</p>
            </div>
          )}
        </li>
      )
    }
    if (key === 'meaning') {
      const href = `${pathFor('quranmeaning', lang)}?q=${encodeURIComponent(c.body.slice(0, LIMITS.meaning))}`
      return (
        <li key={key} className={`ui-card shr-act${best ? ' is-best' : ''}`} aria-labelledby={`${uid}-${key}`} data-action={key}>
          {head(t.meaningT, t.meaningD)}
          <InLink href={href} className={`ui-btn ${best ? 'ui-btn--primary' : 'ui-btn--secondary'} shr-act__btn`}>
            <Icon name="quranmeaning" className="ui-btn__icon" /> {t.meaningBtn}
          </InLink>
        </li>
      )
    }
    if (key === 'halal') {
      const href = `${pathFor('halalcheck', lang)}${halalQuery(c)}`
      return (
        <li key={key} className={`ui-card shr-act${best ? ' is-best' : ''}`} aria-labelledby={`${uid}-${key}`} data-action={key}>
          {head(t.halalT, halalDesc)}
          {c.ecodes.length > 0 && <p className="shr-act__codes ui-num" dir="ltr">{c.ecodes.slice(0, 12).map((x) => `E${x.slice(1)}`).join(' · ')}</p>}
          <InLink href={href} className={`ui-btn ${best ? 'ui-btn--primary' : 'ui-btn--secondary'} shr-act__btn`}>
            <Icon name="halalcheck" className="ui-btn__icon" /> {t.halalBtn}
          </InLink>
        </li>
      )
    }
    return (
      <li key={key} className={`ui-card shr-act${best ? ' is-best' : ''}`} aria-labelledby={`${uid}-${key}`} data-action={key}>
        {head(t.duaT, t.duaD)}
        {saved === 'ok' ? (
          <p className="shr-ok"><Icon name="check" size={18} /> {t.saved}{' '}
            <InLink href={pathFor('duajournal', lang)} className="ui-link">{t.openJournal}</InLink></p>
        ) : (
          <button type="button" className={`ui-btn ${best ? 'ui-btn--primary' : 'ui-btn--secondary'} shr-act__btn`} onClick={saveDua}>
            <Icon name="duajournal" className="ui-btn__icon" /> {t.duaBtn}
          </button>
        )}
        {saved === 'fail' && <p className="shr-err" role="alert"><Icon name="alert" size={16} /> {t.saveFail}</p>}
      </li>
    )
  }

  return (
    <div className="shr-page">
      <header className="ui-page-hero shr-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container ui-container--narrow">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{t.eyebrow}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow shr-main">
          <div className="ui-card shr-input">
            <label className="ui-field" htmlFor={`${uid}-text`}>
              <span className="ui-field__label">{t.label}</span>
            </label>
            <textarea id={`${uid}-text`} className="ui-input shr-input__area" rows={has ? 5 : 3} dir="auto" maxLength={LIMITS.text}
              placeholder={t.ph} value={draft} onChange={(e) => setDraft(e.target.value)} aria-describedby={`${uid}-privacy`} data-testid="share-text" />
            {c.url && (
              <p className="shr-input__link">
                <Icon name="link" size={16} /> <span className="shr-input__link-label">{t.link}:</span>{' '}
                <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" dir="ltr">{(() => { try { return new URL(c.url).hostname } catch { return c.url } })()}</a>
              </p>
            )}
            <div className="shr-input__foot">
              <p className="shr-privacy" id={`${uid}-privacy`}><Icon name="shield" size={14} /> {t.privacy}</p>
              {has && (
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setDraft('')}>
                  <Icon name="close" className="ui-btn__icon" /> {t.clear}
                </button>
              )}
            </div>
          </div>

          {/* Status — ekran oxuyucusu üçün (boş role="alert" render olunmur) */}
          <p className="ui-sr-only" role="status" aria-live="polite">{status}</p>

          {has && c.actions.length > 0 ? (
            <section aria-labelledby={`${uid}-acts`}>
              <h2 className="ui-title ui-title--sm shr-acts__title" id={`${uid}-acts`}>{t.actions}</h2>
              <ol className="shr-acts" data-testid="share-actions">
                {c.actions.map(card)}
              </ol>
            </section>
          ) : (
            <aside className="ui-callout ui-callout--note shr-empty" data-testid="share-empty">
              <Icon name="info" />
              <div><p>{t.empty}</p></div>
            </aside>
          )}

          <section className="shr-how" aria-labelledby={`${uid}-how`}>
            <h2 className="ui-title ui-title--sm" id={`${uid}-how`}>{t.howT}</h2>
            <ol className="shr-how__list">
              {t.how.map(([h, d], i) => (
                <li key={h} className="shr-how__step">
                  <span className="shr-how__n ui-num" aria-hidden="true">{i + 1}</span>
                  <div><strong>{h}</strong><p>{d}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
    </div>
  )
}
