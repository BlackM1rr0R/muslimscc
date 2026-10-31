import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { exitDelay } from '../utils/promptCoordinator'
import {
  TAFSIRS, getTafsir, fetchTafsir, getCachedTafsir, plainLength, hasNativeTafsir,
} from '../utils/tafsir'
import '../styles/TafsirPanel.css'

// ═══════════════════════════════════════════════════════
// Ayənin altındakı təfsir: "Təfsir" düyməsi + açılan panel.
// PERFORMANS: 286 ayəlik surədə hər kartda yalnız bir düymə olur; panel
// (seçim, sorğu, mətn) YALNIZ açılanda render olunur və sorğu göndərir.
// Mətn utils/tafsir.js-də ağ siyahı ilə təmizlənib (sanitizeTafsirHtml) —
// dangerouslySetInnerHTML yalnız o çıxışla işlənir.
// ═══════════════════════════════════════════════════════

export const TAFSIR_UI = {
  az: {
    open: 'Təfsir', choose: 'Təfsiri seçin', source: 'Mənbə',
    more: 'Daha çox göstər', less: 'Qısalt', retry: 'Yenidən cəhd et',
    loading: 'Təfsir yüklənir…',
    error: 'Təfsir yüklənmədi. İnternet bağlantısını yoxlayıb yenidən cəhd edin.',
    offline: 'İnternet bağlantısı yoxdur. Bağlantı bərpa olunanda təfsir özü yüklənəcək.',
    notfound: 'Bu təfsirdə həmin ayə üçün ayrıca izah tapılmadı. Başqa təfsir seçin.',
    empty: 'Bu ayənin izahı əvvəlki ayə ilə birlikdə verilib.',
    group: { pre: 'Bu izah', post: 'ayələrini birlikdə əhatə edir.' },
    noNative: 'Azərbaycan dilində Sələf təfsirinin etibarlı mətni hələ yoxdur — maşın tərcüməsi göstərmirik. Rus, ingilis və ya ərəb dilində təfsir seçin.',
    langNames: { arabic: 'ərəbcə', english: 'ingiliscə', russian: 'rusca' },
  },
  en: {
    open: 'Tafsir', choose: 'Choose a tafsir', source: 'Source',
    more: 'Show more', less: 'Show less', retry: 'Try again',
    loading: 'Loading tafsir…',
    error: 'The tafsir could not be loaded. Check your connection and try again.',
    offline: 'You are offline. The tafsir will load once the connection is back.',
    notfound: 'This tafsir has no separate commentary on this verse. Please choose another tafsir.',
    empty: 'This verse is explained together with the previous one.',
    group: { pre: 'This commentary covers verses', post: 'together.' },
    noNative: '',
    langNames: { arabic: 'Arabic', english: 'English', russian: 'Russian' },
  },
  ru: {
    open: 'Тафсир', choose: 'Выберите тафсир', source: 'Источник',
    more: 'Показать больше', less: 'Свернуть', retry: 'Повторить',
    loading: 'Тафсир загружается…',
    error: 'Не удалось загрузить тафсир. Проверьте подключение и повторите попытку.',
    offline: 'Нет подключения к интернету. Тафсир загрузится, когда связь восстановится.',
    notfound: 'В этом тафсире нет отдельного толкования этого аята. Выберите другой тафсир.',
    empty: 'Этот аят истолкован вместе с предыдущим.',
    group: { pre: 'Это толкование охватывает аяты', post: 'вместе.' },
    noNative: '',
    langNames: { arabic: 'на арабском', english: 'на английском', russian: 'на русском' },
  },
  ar: {
    open: 'تفسير', choose: 'اختر التفسير', source: 'المصدر',
    more: 'عرض المزيد', less: 'عرض أقل', retry: 'أعد المحاولة',
    loading: 'جارٍ تحميل التفسير…',
    error: 'تعذّر تحميل التفسير. تحقّق من الاتصال وأعد المحاولة.',
    offline: 'لا يوجد اتصال بالإنترنت. سيُحمَّل التفسير تلقائيًا عند عودة الاتصال.',
    notfound: 'لا يوجد في هذا التفسير شرح مستقل لهذه الآية. اختر تفسيرًا آخر.',
    empty: 'فُسِّرت هذه الآية مع الآية السابقة.',
    group: { pre: 'يشمل هذا التفسير الآيات', post: 'معًا.' },
    noNative: '',
    langNames: { arabic: 'بالعربية', english: 'بالإنجليزية', russian: 'بالروسية' },
  },
  tr: {
    open: 'Tefsir', choose: 'Tefsir seçin', source: 'Kaynak',
    more: 'Devamını göster', less: 'Kısalt', retry: 'Tekrar dene',
    loading: 'Tefsir yükleniyor…',
    error: 'Tefsir yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.',
    offline: 'İnternet bağlantısı yok. Bağlantı gelince tefsir kendiliğinden yüklenecek.',
    notfound: 'Bu tefsirde söz konusu ayet için ayrı bir açıklama bulunamadı. Başka bir tefsir seçin.',
    empty: 'Bu ayet bir önceki ayetle birlikte açıklanmıştır.',
    group: { pre: 'Bu açıklama', post: 'ayetlerini birlikte kapsar.' },
    noNative: 'Türkçe Selef tefsirinin güvenilir dijital metni henüz yok; makine çevirisi göstermiyoruz. Rusça, İngilizce veya Arapça bir tefsir seçin.',
    langNames: { arabic: 'Arapça', english: 'İngilizce', russian: 'Rusça' },
  },
}

const COLLAPSE_AT = 1200           // bu qədər simvoldan uzun mətn qısaldılmış açılır
const LANG_ORDER = [['ar', 'arabic'], ['en', 'english'], ['ru', 'russian']]

// "2:8–2:9" → ərəbcədə də rəqəmlər LTR qalsın
function rangeText(verses) {
  if (verses.length < 2) return verses[0] || ''
  return `${verses[0]}–${verses[verses.length - 1]}`
}

function TafsirBody({ surah, ayah, tafsirId, lang, ui }) {
  const meta = getTafsir(tafsirId)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState(() => {
    const hit = getCachedTafsir(tafsirId, surah, ayah)
    return hit ? { status: 'ok', data: hit } : { status: 'loading' }
  })
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const hit = getCachedTafsir(tafsirId, surah, ayah)
    setExpanded(false)
    if (hit) { setState({ status: 'ok', data: hit }); return undefined }
    setState({ status: 'loading' })
    fetchTafsir(tafsirId, surah, ayah)
      .then(data => { if (!cancelled) setState({ status: 'ok', data }) })
      .catch(e => { if (!cancelled) setState({ status: 'error', kind: e?.kind || 'network' }) })
    return () => { cancelled = true }
  }, [tafsirId, surah, ayah, attempt])

  // Oflayn idisə — bağlantı qayıdanda özü yenidən cəhd edir
  useEffect(() => {
    if (state.status !== 'error' || state.kind !== 'offline') return undefined
    const on = () => setAttempt(a => a + 1)
    window.addEventListener('online', on)
    return () => window.removeEventListener('online', on)
  }, [state])

  const textLang = meta?.lang || 'ar'
  const isArText = textLang === 'ar'

  if (state.status === 'loading') {
    return (
      <div className="tf-skel" role="status" aria-label={ui.loading}>
        <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '92%' }} />
        <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '100%' }} />
        <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '84%' }} />
        <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '56%' }} />
      </div>
    )
  }
  if (state.status === 'error') {
    const msg = state.kind === 'offline' ? ui.offline : state.kind === 'notfound' ? ui.notfound : ui.error
    return (
      <div className={`tf-msg${state.kind === 'notfound' ? '' : ' tf-msg--bad'}`} role={state.kind === 'notfound' ? 'status' : 'alert'}>
        <Icon name={state.kind === 'notfound' ? 'info' : 'alert'} size={18} className="tf-msg__icon" />
        <p className="tf-msg__text">{msg}</p>
        {state.kind !== 'notfound' && (
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm tf-retry" onClick={() => setAttempt(a => a + 1)}>
            <Icon name="refresh" className="ui-btn__icon" />{ui.retry}
          </button>
        )}
      </div>
    )
  }

  const { html, verses } = state.data
  const long = plainLength(html) > COLLAPSE_AT
  const collapsed = long && !expanded
  const textId = `tf-text-${surah}-${ayah}`
  return (
    <>
      {verses.length > 1 && (
        <p className="tf-group">
          <Icon name="link" size={15} className="tf-group__icon" />
          <span>{ui.group.pre} <bdi dir="ltr" className="ui-num">{rangeText(verses)}</bdi> {ui.group.post}</span>
        </p>
      )}
      {html ? (
        <div id={textId} className={`tf-text${isArText ? ' tf-text--ar' : ''}${collapsed ? ' is-collapsed' : ''}`}
          lang={textLang} dir={isArText ? 'rtl' : 'ltr'}
          // Təhlükəsizdir: utils/tafsir.js → sanitizeTafsirHtml (ağ siyahı)
          dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="tf-msg__text tf-empty">{ui.empty}</p>
      )}
      {long && (
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm tf-more" aria-expanded={expanded} aria-controls={textId}
          onClick={() => setExpanded(x => !x)}>
          {expanded ? ui.less : ui.more}
          <Icon name="chevronDown" size={16} className={`tf-more__icon${expanded ? ' is-up' : ''}`} />
        </button>
      )}
    </>
  )
}

/**
 * Açılan panel. tafsirId — seçilmiş təfsir (QuranPage-dən; bütün açıq
 * panellər üçün ortaq), onChangeTafsir — seçim dəyişəndə (localStorage-a yazılır).
 */
export function TafsirPanel({ id, surah, ayah, lang, tafsirId, onChangeTafsir, leaving, label }) {
  const ui = TAFSIR_UI[lang] || TAFSIR_UI.en
  const meta = getTafsir(tafsirId) || getTafsir(16)
  const selectId = `${id}-select`
  // Saytın dilində təfsir yoxdursa (az, tr) — dürüst qeyd
  const showNoNative = !hasNativeTafsir(lang) && ui.noNative
  return (
    <section id={id} className={`tf-panel${leaving ? ' is-leaving' : ''}`} aria-label={label}>
      <div className="tf-head">
        <div className="tf-meta">
          <span className="tf-name">{meta.name[lang] || meta.name.en}</span>
          <span className="tf-author">{meta.by[lang] || meta.by.en}</span>
        </div>
        <label className="tf-pick" htmlFor={selectId}>
          <span className="ui-sr-only">{ui.choose}</span>
          <select id={selectId} className="ui-input tf-select" value={meta.id}
            onChange={e => onChangeTafsir(Number(e.target.value))}>
            {LANG_ORDER.map(([l, nameKey]) => (
              <optgroup key={l} label={ui.langNames[nameKey]}>
                {TAFSIRS.filter(t => t.lang === l).map(t => (
                  <option key={t.id} value={t.id}>{t.name[lang] || t.name.en}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <Icon name="chevronDown" size={16} className="tf-select__icon" />
        </label>
      </div>
      {showNoNative && meta.lang !== lang && (
        <p className="tf-note"><Icon name="info" size={16} className="tf-note__icon" />{ui.noNative}</p>
      )}
      <TafsirBody key={`${meta.id}`} surah={surah} ayah={ayah} tafsirId={meta.id} lang={lang} ui={ui} />
      <p className="tf-src">
        {ui.source}:{' '}
        <a href={`https://quran.com/${surah}:${ayah}/tafsirs/${meta.slug}`} target="_blank" rel="noopener noreferrer"
          className="tf-src__link" dir="ltr">quran.com<Icon name="external" size={13} className="tf-src__icon" /></a>
      </p>
    </section>
  )
}

/**
 * Ayə kartının içində: düymə + (açıqdırsa) panel. Bağlananda panel qısa
 * çıxış animasiyası alır (hərəkət azaldılıbsa — dərhal çıxır).
 */
export default function AyahTafsir({ surah, ayah, lang, open, tafsirId, onToggle, onChangeTafsir, ayahName }) {
  const ui = TAFSIR_UI[lang] || TAFSIR_UI.en
  const [mounted, setMounted] = useState(open)
  const [leaving, setLeaving] = useState(false)
  const timer = useRef(null)
  useEffect(() => {
    clearTimeout(timer.current)
    if (open) { setMounted(true); setLeaving(false); return undefined }
    if (!mounted) return undefined
    const ms = exitDelay(180)
    if (!ms) { setMounted(false); setLeaving(false); return undefined }
    setLeaving(true)
    timer.current = setTimeout(() => { setMounted(false); setLeaving(false) }, ms)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  // Bağlı kartda tafsirId = 0 gəlir (memo — seçim dəyişəndə 286 kart yenidən
  // çəkilməsin); çıxış animasiyası zamanı son seçim saxlanılır
  const lastId = useRef(tafsirId)
  if (tafsirId) lastId.current = tafsirId
  const shownId = tafsirId || lastId.current
  const panelId = `tafsir-${surah}-${ayah}`
  const label = `${ui.open} — ${ayahName}`
  return (
    <div className="tf-wrap">
      <button type="button" className={`tf-toggle${open ? ' is-open' : ''}`} aria-expanded={open}
        aria-controls={mounted ? panelId : undefined} aria-label={label}
        onClick={() => onToggle(ayah)}>
        <Icon name="books" size={16} fallback="quran" className="tf-toggle__icon" />
        <span>{ui.open}</span>
        <Icon name="chevronDown" size={16} className="tf-toggle__chev" />
      </button>
      {mounted && (
        <TafsirPanel id={panelId} surah={surah} ayah={ayah} lang={lang} tafsirId={shownId}
          onChangeTafsir={onChangeTafsir} leaving={leaving} label={label} />
      )}
    </div>
  )
}
