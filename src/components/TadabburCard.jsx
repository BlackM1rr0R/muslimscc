// ═══════════════════════════════════════════════════════
// GÜNÜN TƏDDƏBÜR SUALI — ana səhifə kartı
//
// Hər gün bir ayə + şəxsi düşüncə sualı (src/data/tadabbur.js). Seçim
// yerli tarixə görə deterministikdir: eyni gün hamıda eyni ayə, gecə
// yarısı növbəti ayəyə keçir. Şəbəkə sorğusu YOXDUR — ərəb mətni və
// tərcümələr fayla bir dəfə yazılıb.
//
// • Tərcümə saytın dilindədir (ərəbcədə yalnız ayənin özü); altında
//   tərcüməçinin adı (LicensesPage-dəki atribusiya ilə eyni).
// • Sual Muslims.cc-nindir və təfsir deyil — kartda bu açıq yazılır.
// • "Təfsir" düyməsi QuranPage-dəki TafsirPanel-i TƏNBƏL yükləyir
//   (ana səhifənin ilk yükünə əlavə olunmur); seçilmiş təfsir eyni
//   localStorage seçimidir (utils/tafsir.js).
// • "Surədə oxu" — /quran/<n>?a=<ayə> (QuranPage ayəyə sürüşür).
//
// İstifadə: <TadabburCard /> (props lazım deyil; className ötürmək olar).
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import { isPlainClick } from './PageLink'
import Icon from './Icon'
import { TADABBUR } from '../data/tadabbur'
import '../styles/TadabburCard.css'
import { pickUi } from '../utils/uiText'

const T = {
  az: {
    eyebrow: 'Günün təddəbür sualı',
    ask: 'Özünə sual ver',
    note: 'Sual şəxsi düşüncə üçündür, təfsir deyil. Ayənin mənası üçün təfsirə baxın.',
    read: 'Surədə oxu',
    tafsir: 'Təfsir',
    tafsirHide: 'Təfsiri gizlət',
    loading: 'Yüklənir…',
    transBy: 'Tərcümə',
    ayah: (s, a) => `${s} surəsi, ayə ${a}`,
  },
  en: {
    eyebrow: 'Today’s reflection',
    ask: 'Ask yourself',
    note: 'The question is for personal reflection, not tafsir. See the tafsir for the meaning of the verse.',
    read: 'Read in the surah',
    tafsir: 'Tafsir',
    tafsirHide: 'Hide tafsir',
    loading: 'Loading…',
    transBy: 'Translation',
    ayah: (s, a) => `Surah ${s}, verse ${a}`,
  },
  ru: {
    eyebrow: 'Вопрос для размышления',
    ask: 'Спросите себя',
    note: 'Вопрос — для личного размышления, а не тафсир. Смысл аята смотрите в тафсире.',
    read: 'Читать в суре',
    tafsir: 'Тафсир',
    tafsirHide: 'Скрыть тафсир',
    loading: 'Загрузка…',
    transBy: 'Перевод',
    ayah: (s, a) => `Сура ${s}, аят ${a}`,
  },
  ar: {
    eyebrow: 'سؤال التدبر لهذا اليوم',
    ask: 'اسأل نفسك',
    note: 'السؤال للتأمل الشخصي وليس تفسيرًا، ولمعنى الآية ارجع إلى التفسير.',
    read: 'اقرأ في السورة',
    tafsir: 'التفسير',
    tafsirHide: 'إخفاء التفسير',
    loading: 'جارٍ التحميل…',
    transBy: 'الترجمة',
    ayah: (s, a) => `سورة ${s}، الآية ${a}`,
  },
  tr: {
    eyebrow: 'Günün tefekkür sorusu',
    ask: 'Kendine sor',
    note: 'Soru kişisel tefekkür içindir, tefsir değildir. Ayetin anlamı için tefsire bakın.',
    read: 'Surede oku',
    tafsir: 'Tefsir',
    tafsirHide: 'Tefsiri gizle',
    loading: 'Yükleniyor…',
    transBy: 'Meal',
    ayah: (s, a) => `${s} Suresi, ${a}. ayet`,
  },
}

// Tərcüməçi — tərcümənin öz dilində (LicensesPage → TRANSLATIONS ilə eyni ad)
// lang-ok: ərəbcə interfeysdə tərcümə göstərilmir — ayənin özü oxunur
const TRANSLATOR = { az: 'Vasim Məmmədəliyev və Ziya Bünyadov', en: 'Muhammad Asad', ru: 'Эльмир Кулиев', tr: 'Diyanet İşleri Başkanlığı' }

/** Yerli tarixin gün nömrəsi (1970-01-01-dən) — saat qurşağından asılı sürüşmə olmasın. */
export function dayNumber(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

/** Verilən gün üçün siyahıdan ayə (deterministik). */
export function tadabburFor(d = new Date(), list = TADABBUR) {
  const n = list.length
  return n ? list[((dayNumber(d) % n) + n) % n] : null
}

// Təfsir paneli + seçim — yalnız "Təfsir" basılanda yüklənir
const LazyTafsir = lazy(() =>
  Promise.all([import('./TafsirPanel'), import('../utils/tafsir')]).then(([panel, util]) => ({
    default: function TadabburTafsir({ surah, ayah, lang, label }) {
      const [choices, setChoices] = useState(util.readTafsirChoices)
      const onChange = (id) => {
        util.saveTafsirChoice(lang, id)
        setChoices(util.readTafsirChoices())
      }
      return (
        <panel.TafsirPanel id={`tdb-tafsir-${surah}-${ayah}`} surah={surah} ayah={ayah} lang={lang}
          tafsirId={util.tafsirFor(lang, choices)} onChangeTafsir={onChange} label={label} />
      )
    },
  })),
)

export default function TadabburCard({ className = '' }) {
  const { lang } = useLang()
  const t = pickUi(T, lang)
  const navigate = useNavigate()
  // Tarix render zamanı bir dəfə — kart açıq qalanda gecə yarısı dəyişmir (qəsdən)
  const item = useMemo(() => tadabburFor(), [])
  const [tafsirOpen, setTafsirOpen] = useState(false)
  if (!item) return null

  const sura = pickUi(item.sura, lang, 'en')
  const refLabel = t.ayah(sura, item.a)
  const trans = lang === 'ar' ? '' : item.t[lang]
  const translator = lang === 'ar' ? '' : TRANSLATOR[lang] || ''
  const href = `${pathFor('quran', lang, item.s)}?a=${item.a}`

  const onRead = (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
  }

  return (
    <article className={`ui-card tdb-card ${className}`.trim()} aria-labelledby="tdb-title">
      <div className="ui-pattern ui-pattern--fade tdb-pattern" aria-hidden="true" />
      <header className="tdb-head">
        <span className="ui-eyebrow" id="tdb-title">{t.eyebrow}</span>
        <span className="ui-badge ui-badge--accent tdb-ref ui-num" dir="ltr">{item.ref}</span>
      </header>

      <figure className="tdb-ayah">
        <blockquote>
          <p className="tdb-ar ui-arabic" lang="ar" dir="rtl">{item.ar}</p>
          {trans && <p className="tdb-trans" dir="auto">{trans}</p>}
        </blockquote>
        <figcaption className="tdb-src">
          <span>{refLabel}</span>
          {translator && <span className="tdb-src__by">{t.transBy}: {translator}</span>}
        </figcaption>
      </figure>

      <div className="tdb-question">
        <span className="tdb-question__label">
          <Icon name="bulb" size={18} className="tdb-question__icon" /> {t.ask}
        </span>
        <p className="tdb-question__text">{pickUi(item.q, lang, 'en')}</p>
        <p className="tdb-question__note">{t.note}</p>
      </div>

      <div className="tdb-actions">
        <a className="ui-btn ui-btn--secondary ui-btn--sm" href={href} onClick={onRead}>
          <Icon name="quran" size={16} className="ui-btn__icon" /> {t.read}
        </a>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-expanded={tafsirOpen}
          aria-controls={tafsirOpen ? `tdb-tafsir-${item.s}-${item.a}` : undefined}
          onClick={() => setTafsirOpen(o => !o)}>
          <Icon name="books" size={16} className="ui-btn__icon" /> {tafsirOpen ? t.tafsirHide : t.tafsir}
        </button>
      </div>

      {tafsirOpen && (
        <div className="tdb-tafsir">
          <Suspense fallback={<p className="tdb-loading" role="status">{t.loading}</p>}>
            <LazyTafsir surah={item.s} ayah={item.a} lang={lang} label={`${t.tafsir} — ${refLabel}`} />
          </Suspense>
        </div>
      )}

    </article>
  )
}
