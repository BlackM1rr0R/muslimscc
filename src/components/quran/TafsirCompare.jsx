// ═══════════════════════════════════════════════════════
// Təfsirlərin müqayisəsi — bir ayə üçün 3-ə qədər təfsir yan-yana
// (masaüstündə sütunlar, telefonda alt-alta). TafsirPanel-dəki
// "Təfsirləri müqayisə et" düyməsindən tənbəl yüklənir (ayrı chunk).
//
// MƏTN: hər sütun utils/tafsir.js → fetchTafsir — mənbənin mətni SÖZBƏSÖZ
// (yalnız HTML sanitizer). Heç nə qısaldılmır və süni intellektlə yaradılmır;
// hər sütunda təfsirin adı, müəllifi, dili, nəşr id-si və quran.com linki var.
// Keş, oflayn/xəta halları, "Daha çox" — TafsirBody-dən (TafsirPanel ilə eyni).
// Brauzerin <dialog> elementi: fokus tələsi, ESC; bağlananda fokus düyməyə qayıdır.
// Dialoq yalnız klikdən sonra render olunur — prerender ilə uyğunsuzluq yoxdur.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { TafsirBody, TAFSIR_UI } from '../TafsirPanel'
import { getTafsir } from '../../utils/tafsir'
import {
  COMPARE_TAFSIRS, COMPARE_MAX, readCompareChoice, saveCompareChoice, toggleCompareId,
  neighbourAyah, surahLabel, compareSource,
} from '../../utils/tafsirCompare'
import { pickUi } from '../../utils/uiText'
import '../../styles/TafsirPanel.css'
import '../../styles/TafsirCompare.css'

export const COMPARE_UI = {
  az: {
    title: 'Təfsirləri müqayisə et',
    lead: 'Təfsirlər yan-yana göstərilir — mənbədəki mətn dəyişdirilmir, yenidən yazılmır, xülasə edilmir və süni intellektlə yaradılmır (yalnız format teqləri silinir).',
    choose: 'Ən çox 3 təfsir seçin',
    count: n => `Seçilib: ${n} təfsir (ən çox 3)`,
    full: 'Başqasını əlavə etmək üçün əvvəlcə birini çıxarın.',
    nav: 'Ayələr arasında keçid', prev: 'Əvvəlki ayə', next: 'Növbəti ayə',
    close: 'Bağla', edition: 'Nəşr', source: 'Mənbə',
  },
  en: {
    title: 'Compare tafsirs',
    lead: 'The commentaries are shown side by side — no text is rewritten, summarized or machine-generated (only formatting tags are removed).',
    choose: 'Choose up to 3 tafsirs',
    count: n => (n === 1 ? '1 tafsir selected (up to 3)' : `${n} tafsirs selected (up to 3)`),
    full: 'To add another one, remove one first.',
    nav: 'Verse navigation', prev: 'Previous verse', next: 'Next verse',
    close: 'Close', edition: 'Edition', source: 'Source',
  },
  ru: {
    title: 'Сравнение тафсиров',
    lead: 'Тафсиры показаны рядом — текст не переписывается, не пересказывается и не создаётся ИИ (удалены только теги форматирования).',
    choose: 'Выберите до 3 тафсиров',
    count: n => (n === 1 ? 'Выбран 1 тафсир из 3' : `Выбрано ${n} тафсира из 3`),
    full: 'Чтобы добавить другой, сначала уберите один.',
    nav: 'Переход между аятами', prev: 'Предыдущий аят', next: 'Следующий аят',
    close: 'Закрыть', edition: 'Издание', source: 'Источник',
  },
  ar: {
    title: 'مقارنة التفاسير',
    lead: 'تُعرض التفاسير جنبًا إلى جنب دون إعادة صياغة أو تلخيص أو توليد بالذكاء الاصطناعي (تُزال وسوم التنسيق فقط).',
    choose: 'اختر حتى 3 تفاسير',
    count: n => (n === 1 ? 'تم اختيار تفسير واحد من 3' : n === 2 ? 'تم اختيار تفسيرين من 3' : `تم اختيار ${n} تفاسير من 3`),
    full: 'لإضافة تفسير آخر، أزل أحد التفاسير أولًا.',
    nav: 'التنقل بين الآيات', prev: 'الآية السابقة', next: 'الآية التالية',
    close: 'إغلاق', edition: 'الإصدار', source: 'المصدر',
  },
  tr: {
    title: 'Tefsirleri karşılaştır',
    lead: 'Tefsirler yan yana gösterilir; metin yeniden yazılmaz, özetlenmez veya yapay zekâyla üretilmez (yalnızca biçim etiketleri kaldırılır).',
    choose: 'En fazla 3 tefsir seçin',
    count: n => `${n} tefsir seçildi (en fazla 3)`,
    full: 'Başka bir tefsir eklemek için önce birini çıkarın.',
    nav: 'Ayetler arasında geçiş', prev: 'Önceki ayet', next: 'Sonraki ayet',
    close: 'Kapat', edition: 'Baskı', source: 'Kaynak',
  },
}

// Təfsir mətninin dili → TAFSIR_UI.langNames açarı (yazı deyil, açar)
const LANG_KEY = new Map([['ar', 'arabic'], ['en', 'english'], ['ru', 'russian'], ['az', 'azerbaijani']])

function CompareColumn({ id, s, a, lang, tui, ui }) {
  const meta = getTafsir(id)
  const src = compareSource(id, s, a)
  if (!meta || !src) return null
  const headId = `tfc-h-${id}`
  return (
    <article className="tfc-col" aria-labelledby={headId} data-tafsir={id}>
      <header className="tfc-col__head">
        <h3 id={headId} className="tf-name tfc-col__name">{pickUi(meta.name, lang, 'en')}</h3>
        <p className="tf-author tfc-col__by">{pickUi(meta.by, lang, 'en')}</p>
        <span className="tfc-col__lang">{tui.langNames[LANG_KEY.get(meta.lang)]}</span>
      </header>
      <div className="tfc-col__body">
        <TafsirBody surah={s} ayah={a} tafsirId={id} ui={tui} idBase={`tfc-text-${id}`} />
      </div>
      <footer className="tf-src tfc-col__src">
        <span>{ui.source}:{' '}
          <a href={src.url} target="_blank" rel="noopener noreferrer" className="tf-src__link" dir="ltr">
            quran.com<Icon name="external" size={13} className="tf-src__icon" />
          </a>
        </span>
        <span className="tfc-col__ed">{ui.edition}: <bdi dir="ltr">{src.edition}</bdi></span>
      </footer>
    </article>
  )
}

export default function TafsirCompare({ surah, ayah, lang, onClose }) {
  const ui = pickUi(COMPARE_UI, lang, 'en')
  const tui = pickUi(TAFSIR_UI, lang, 'en')
  const ref = useRef(null)
  const [pos, setPos] = useState({ s: Number(surah), a: Number(ayah) })
  // Yalnız klikdən sonra render olunur — localStorage-ı ilk renderdə oxumaq təhlükəsizdir
  const [ids, setIds] = useState(() => readCompareChoice(lang))

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) { try { d.showModal() } catch { d.setAttribute('open', '') } }
    const onCancel = (e) => { e.preventDefault(); onClose() }
    d?.addEventListener('cancel', onCancel)
    return () => d?.removeEventListener('cancel', onCancel)
  }, [onClose])

  const toggle = (id) => {
    const next = toggleCompareId(ids, id)
    if (next === ids) return
    setIds(next)
    saveCompareChoice(lang, next)
  }
  const prev = neighbourAyah(pos.s, pos.a, -1)
  const next = neighbourAyah(pos.s, pos.a, 1)
  const full = ids.length >= COMPARE_MAX
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <dialog ref={ref} className="tfc-dialog" aria-labelledby="tfc-title" aria-describedby="tfc-lead" dir={dir}
      data-testid="tafsir-compare" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      // Səhifənin qısayolları (G — "ayəyə keç", oxla sürüşmə) dialoq açıqkən işləməsin
      onKeyDown={(e) => e.stopPropagation()}>
      <div className="tfc-body">
        <div className="tfc-top">
          <h2 id="tfc-title" className="tfc-title"><Icon name="books" size={20} fallback="quran" /> {ui.title}</h2>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--icon tfc-close" aria-label={ui.close} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <p id="tfc-lead" className="tfc-lead">{ui.lead}</p>

        <fieldset className="tfc-pick">
          <legend className="tfc-pick__legend">{ui.choose}</legend>
          <div className="tfc-chips">
            {COMPARE_TAFSIRS.map(t => {
              const on = ids.includes(t.id)
              const locked = on ? ids.length === 1 : full
              return (
                <label key={t.id} className={`tfc-chip${on ? ' is-on' : ''}${locked && !on ? ' is-off' : ''}`}>
                  <input type="checkbox" checked={on} disabled={locked} onChange={() => toggle(t.id)} />
                  <span className="tfc-chip__name">{pickUi(t.name, lang, 'en')}</span>
                  <span className="tfc-chip__lang">{tui.langNames[LANG_KEY.get(t.lang)]}</span>
                </label>
              )
            })}
          </div>
          <p className="tfc-count" aria-live="polite">{ui.count(ids.length)}{full ? ` ${ui.full}` : ''}</p>
        </fieldset>

        <nav className="tfc-nav" aria-label={ui.nav}>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm tfc-nav__btn" disabled={!prev}
            onClick={() => prev && setPos(prev)}>
            <Icon name="chevronLeft" size={16} className="ui-btn__icon ui-flip-rtl" />{ui.prev}
          </button>
          <p className="tfc-ref" aria-live="polite" aria-atomic="true">
            <span className="tfc-ref__name">{surahLabel(pos.s, lang)}</span>{' '}
            <bdi dir="ltr" className="ui-num tfc-ref__num">{pos.s}:{pos.a}</bdi>
          </p>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm tfc-nav__btn" disabled={!next}
            onClick={() => next && setPos(next)}>
            {ui.next}<Icon name="chevron" size={16} className="ui-btn__icon ui-flip-rtl" />
          </button>
        </nav>

        <div className="tfc-cols" style={{ '--tfc-n': ids.length }}>
          {ids.map(id => (
            <CompareColumn key={id} id={id} s={pos.s} a={pos.a} lang={lang} tui={tui} ui={ui} />
          ))}
        </div>
      </div>
    </dialog>
  )
}
