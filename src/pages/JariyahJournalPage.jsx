// ═══════════════════════════════════════════════════════
// /sadaqah-jariyah — "Sədəqeyi-cariyə gündəliyi" (C dəstəsi)
//
// Davamlı sədəqələrin GİZLİ qeydi: bağışlanan Mushaf, əkilən ağac, öyrədilən elm, su/quyu, digər;
// istəyə görə "kimin adından" (məs. vəfat etmiş yaxın), gün və qeyd. Cəm, müqayisə, paylaşma,
// reytinq YOXDUR. Saxlama: utils/jariyahJournal (sadaqah_jariyah_v1 — profilə aid; ehtiyat nüsxə və
// hesabın E2E şifrəli sinxronizasiyası onu daşıyır). Yaddaş yalnız mount-dan sonra oxunur.
// Hədis qeydi: saytın hədis bazasındakı Muslim 1631 (sədəqeyi-cariyə) — verbatim, mənbəsi ilə
// (localizeSource); yalnız düyməyə basanda yüklənir (dil modulu böyükdür).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import RelatedLinks from '../components/RelatedLinks'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pickUi } from '../utils/uiText'
import { localizeSource } from '../utils/sourceNames'
import { dayLabel } from '../utils/dayLabel'
import { pathFor } from '../seo/routes'
import { HADITH_IDS } from '../seo/hadithIds'
import { isPlainClick } from '../components/PageLink'
import {
  readJariyah, saveJariyah, removeJariyah, onBehalfNames, localDay, findJariyahHadith,
  JARIYAH_KEY, JARIYAH_EVENT, JARIYAH_KINDS, ON_MAX, NOTE_MAX,
} from '../utils/jariyahJournal'
import '../styles/JariyahJournalPage.css'

// Müslim hədisi — saytın siyasəti: səhih (HadithPage dərəcə adları ilə eyni)
const GRADE_SAHIH = { az: 'Səhih', en: 'Sahih', ru: 'Сахих', ar: 'الصحيح', tr: 'Sahih' }

const T = {
  az: {
    title: 'Davamlı sədəqə gündəliyi',
    lead: 'Davam edən xeyirlərinizi sakitcə qeyd edin — bağışlanan Mushaf, əkilən ağac, öyrətdiyiniz bir şey, su. İstəsəniz, vəfat etmiş yaxınınızın adından.',
    private: 'Qeydlər yalnız sizdədir: bu cihazda, ehtiyat nüsxədə və hesabın şifrəli sinxronizasiyasında. Heç kimlə paylaşılmır, cəm və müqayisə yoxdur.',
    addTitle: 'Yeni qeyd', editTitle: 'Qeydi redaktə et', kind: 'Növ', date: 'Tarix',
    onBehalf: 'Kimin adından (istəyə bağlı)', onBehalfPh: 'Məs.: atam, nənəm', note: 'Qeyd (istəyə bağlı)', notePh: 'Məs.: məhəllə məscidinə 2 Mushaf',
    save: 'Yadda saxla', update: 'Dəyişikliyi saxla', cancel: 'Ləğv et', edit: 'Redaktə et', del: 'Sil',
    confirmDel: 'Bu qeyd silinsin?', yes: 'Bəli, sil', no: 'Xeyr',
    list: 'Qeydlərim', empty: 'Hələ qeyd yoxdur. İlk davamlı xeyrinizi yuxarıda yazın.',
    onBehalfOf: (n) => `${n} adından`, added: 'Qeyd əlavə olundu.', updated: 'Qeyd yeniləndi.', deleted: 'Qeyd silindi.', invalid: 'Növ və düzgün tarix seçin.',
    kinds: { quran: 'Mushaf bağışlandı', tree: 'Ağac əkildi', taught: 'Bir şey öyrədildi', water: 'Su / quyu', other: 'Digər' },
    hadithBtn: 'Davamlı sədəqə haqqında hədisi göstər', hadithHide: 'Hədisi gizlət', hadithLoading: 'Yüklənir…', hadithFail: 'Hədisi yükləmək alınmadı.', hadithFull: 'Tam hədis',
    related: 'Əlaqəli bölmələr',
  },
  en: {
    title: 'Sadaqah jariyah journal',
    lead: 'Quietly note your ongoing good deeds — a Quran donated, a tree planted, something you taught, water. If you wish, on behalf of a loved one who has passed away.',
    private: 'Your entries stay with you: on this device, in your backup and in your account’s encrypted sync. Nothing is shared; there are no totals or comparisons.',
    addTitle: 'New entry', editTitle: 'Edit entry', kind: 'Kind', date: 'Date',
    onBehalf: 'On behalf of (optional)', onBehalfPh: 'E.g. my father, my grandmother', note: 'Note (optional)', notePh: 'E.g. 2 copies of the Quran for the local mosque',
    save: 'Save', update: 'Save changes', cancel: 'Cancel', edit: 'Edit', del: 'Delete',
    confirmDel: 'Delete this entry?', yes: 'Yes, delete', no: 'No',
    list: 'My entries', empty: 'No entries yet. Write your first ongoing good deed above.',
    onBehalfOf: (n) => `On behalf of ${n}`, added: 'Entry added.', updated: 'Entry updated.', deleted: 'Entry deleted.', invalid: 'Choose a kind and a valid date.',
    kinds: { quran: 'Quran donated', tree: 'Tree planted', taught: 'Something taught', water: 'Water / well', other: 'Other' },
    hadithBtn: 'Show the hadith about sadaqah jariyah', hadithHide: 'Hide the hadith', hadithLoading: 'Loading…', hadithFail: 'The hadith could not be loaded.', hadithFull: 'Full hadith',
    related: 'Related sections',
  },
  ru: {
    title: 'Дневник садака джария',
    lead: 'Тихо отмечайте свои непрерывные благие дела — подаренный мусхаф, посаженное дерево, то, чему вы научили, воду. При желании — от имени умершего близкого.',
    private: 'Записи остаются только у вас: на этом устройстве, в резервной копии и в зашифрованной синхронизации аккаунта. Ничего не публикуется; нет итогов и сравнений.',
    addTitle: 'Новая запись', editTitle: 'Изменить запись', kind: 'Вид', date: 'Дата',
    onBehalf: 'От чьего имени (необязательно)', onBehalfPh: 'Напр.: мой отец, моя бабушка', note: 'Заметка (необязательно)', notePh: 'Напр.: 2 мусхафа для мечети квартала',
    save: 'Сохранить', update: 'Сохранить изменения', cancel: 'Отмена', edit: 'Изменить', del: 'Удалить',
    confirmDel: 'Удалить эту запись?', yes: 'Да, удалить', no: 'Нет',
    list: 'Мои записи', empty: 'Записей пока нет. Напишите выше первое непрерывное благое дело.',
    onBehalfOf: (n) => `От имени: ${n}`, added: 'Запись добавлена.', updated: 'Запись обновлена.', deleted: 'Запись удалена.', invalid: 'Выберите вид и правильную дату.',
    kinds: { quran: 'Подарен мусхаф', tree: 'Посажено дерево', taught: 'Преподано знание', water: 'Вода / колодец', other: 'Другое' },
    hadithBtn: 'Показать хадис о садака джария', hadithHide: 'Скрыть хадис', hadithLoading: 'Загрузка…', hadithFail: 'Не удалось загрузить хадис.', hadithFull: 'Полный хадис',
    related: 'Связанные разделы',
  },
  ar: {
    title: 'سجل الصدقة الجارية',
    lead: 'دوّن في هدوء أعمالك الخيرية الجارية — مصحف مُهدى، شجرة مغروسة، شيء علّمته، ماء. وإن شئتَ فعن قريبٍ متوفًّى.',
    private: 'سجلاتك تبقى عندك: على هذا الجهاز وفي النسخة الاحتياطية وفي مزامنة الحساب المشفّرة. لا يُشارَك شيء، ولا مجاميع ولا مقارنات.',
    addTitle: 'سجل جديد', editTitle: 'تعديل السجل', kind: 'النوع', date: 'التاريخ',
    onBehalf: 'عن من (اختياري)', onBehalfPh: 'مثال: أبي، جدتي', note: 'ملاحظة (اختياري)', notePh: 'مثال: مصحفان لمسجد الحي',
    save: 'حفظ', update: 'حفظ التعديل', cancel: 'إلغاء', edit: 'تعديل', del: 'حذف',
    confirmDel: 'هل تريد حذف هذا السجل؟', yes: 'نعم، احذف', no: 'لا',
    list: 'سجلاتي', empty: 'لا سجلات بعد. اكتب أول صدقة جارية لك في الأعلى.',
    onBehalfOf: (n) => `عن ${n}`, added: 'أُضيف السجل.', updated: 'حُدّث السجل.', deleted: 'حُذف السجل.', invalid: 'اختر النوع وتاريخًا صحيحًا.',
    kinds: { quran: 'مصحف مُهدى', tree: 'شجرة مغروسة', taught: 'علم عُلِّم', water: 'ماء / بئر', other: 'أخرى' },
    hadithBtn: 'اعرض حديث الصدقة الجارية', hadithHide: 'أخفِ الحديث', hadithLoading: 'جارٍ التحميل…', hadithFail: 'تعذّر تحميل الحديث.', hadithFull: 'الحديث كاملًا',
    related: 'أقسام ذات صلة',
  },
  tr: {
    title: 'Sadaka-i câriye günlüğü',
    lead: 'Süren hayırlarınızı sessizce kaydedin — bağışlanan bir Mushaf, dikilen bir ağaç, öğrettiğiniz bir şey, su. İsterseniz vefat etmiş bir yakınınız adına.',
    private: 'Kayıtlar yalnızca sizdedir: bu cihazda, yedekte ve hesabınızın şifreli eşitlemesinde. Hiçbir şey paylaşılmaz; toplam ve karşılaştırma yoktur.',
    addTitle: 'Yeni kayıt', editTitle: 'Kaydı düzenle', kind: 'Tür', date: 'Tarih',
    onBehalf: 'Kimin adına (isteğe bağlı)', onBehalfPh: 'Örn.: babam, ninem', note: 'Not (isteğe bağlı)', notePh: 'Örn.: mahalle camisine 2 Mushaf',
    save: 'Kaydet', update: 'Değişikliği kaydet', cancel: 'İptal', edit: 'Düzenle', del: 'Sil',
    confirmDel: 'Bu kayıt silinsin mi?', yes: 'Evet, sil', no: 'Hayır',
    list: 'Kayıtlarım', empty: 'Henüz kayıt yok. İlk süren hayrınızı yukarıya yazın.',
    onBehalfOf: (n) => `${n} adına`, added: 'Kayıt eklendi.', updated: 'Kayıt güncellendi.', deleted: 'Kayıt silindi.', invalid: 'Bir tür ve geçerli bir tarih seçin.',
    kinds: { quran: 'Mushaf bağışlandı', tree: 'Ağaç dikildi', taught: 'Bir şey öğretildi', water: 'Su / kuyu', other: 'Diğer' },
    hadithBtn: 'Sadaka-i câriye hadisini göster', hadithHide: 'Hadisi gizle', hadithLoading: 'Yükleniyor…', hadithFail: 'Hadis yüklenemedi.', hadithFull: 'Hadisin tamamı',
    related: 'İlgili bölümler',
  },
}

const KIND_ICON = { quran: 'quran', tree: 'leaf', taught: 'learn', water: 'drop', other: 'sparkle' }

const RELATED = [
  { to: 'charity',
    title: { az: 'Sədəqə gündəliyi', en: 'Sadaqah Journal', ru: 'Дневник садаки', ar: 'سجل الصدقات', tr: 'Sadaka Günlüğü' },
    sub: { az: 'gündəlik xeyir əməlləri', en: 'everyday good deeds', ru: 'ежедневные добрые дела', ar: 'أعمال الخير اليومية', tr: 'günlük hayır işleri' } },
  { to: 'donate',
    title: { az: 'Xeyriyyə və ianə', en: 'Charity & Giving', ru: 'Благотворительность', ar: 'الصدقة والتبرع', tr: 'Hayır ve Bağış' },
    sub: { az: 'sədəqənin növləri', en: 'kinds of charity', ru: 'виды милостыни', ar: 'أنواع الصدقة', tr: 'sadaka türleri' } },
]

const EMPTY_FORM = { id: null, k: 'quran', d: '', on: '', no: '' }

export default function JariyahJournalPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const [data, setData] = useState({ v: 1, l: [] })
  const [ready, setReady] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [today, setToday] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [hadith, setHadith] = useState({ open: false, status: 'idle', h: null })
  const formRef = useRef(null)
  const listHeadRef = useRef(null)

  useEffect(() => {
    const load = () => setData(readJariyah())
    load()
    const d = localDay()
    setToday(d)
    setForm((f) => (f.d ? f : { ...f, d }))
    setReady(true)
    const onStorage = (e) => { if (!e.key || e.key === JARIYAH_KEY || e.key.endsWith(`:${JARIYAH_KEY}`)) load() }
    window.addEventListener('storage', onStorage)
    window.addEventListener(JARIYAH_EVENT, load)
    window.addEventListener('mcc-profile', load)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(JARIYAH_EVENT, load)
      window.removeEventListener('mcc-profile', load)
    }
  }, [])

  // Dil dəyişəndə hədis o dilin bazasından yenidən yüklənsin
  useEffect(() => { setHadith({ open: false, status: 'idle', h: null }) }, [lang])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const resetForm = () => setForm({ ...EMPTY_FORM, d: today })

  function submit(e) {
    e.preventDefault()
    const r = saveJariyah({ id: form.id || undefined, k: form.k, d: form.d, on: form.on, no: form.no })
    if (!r.ok) { setErr(t.invalid); return }
    setErr('')
    setData(r.data)
    setMsg(form.id ? t.updated : t.added)
    resetForm()
  }
  function startEdit(x) {
    setForm({ id: x.id, k: x.k, d: x.d, on: x.on || '', no: x.no || '' })
    setErr('')
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: 'start' })
      formRef.current?.querySelector('input[type="radio"]:checked')?.focus()
    })
  }
  function doDelete(id) {
    setData(removeJariyah(id))
    setConfirmId(null)
    setMsg(t.deleted)
    if (form.id === id) resetForm()
    requestAnimationFrame(() => listHeadRef.current?.focus())
  }

  async function toggleHadith() {
    if (hadith.open) { setHadith((h) => ({ ...h, open: false })); return }
    if (hadith.h) { setHadith((h) => ({ ...h, open: true })); return }
    setHadith({ open: true, status: 'loading', h: null })
    try {
      const { loadHadithData } = await import('../utils/hadithData')
      const d = await loadHadithData(lang)
      const found = findJariyahHadith(d.list)
      setHadith({ open: true, status: found ? 'ok' : 'error', h: found })
    } catch {
      setHadith({ open: true, status: 'error', h: null })
    }
  }

  const names = onBehalfNames(data)
  const list = [...data.l].reverse()
  const editing = Boolean(form.id)

  return (
    <div className="jrj-page">
      <header className="ui-page-hero jrj-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container ui-container--narrow">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('jariyah'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="lock" size={16} /> {t.private}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow jrj-main">
          <div className="jrj-hadith">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-expanded={hadith.open} aria-controls="jrj-hadith-box" onClick={toggleHadith}>
              <Icon name="hadith" size={16} className="ui-btn__icon" /> {hadith.open ? t.hadithHide : t.hadithBtn}
            </button>
            <div id="jrj-hadith-box" hidden={!hadith.open}>
              {hadith.status === 'loading' && <p className="jrj-muted">{t.hadithLoading}</p>}
              {hadith.status === 'error' && <p className="jrj-muted">{t.hadithFail}</p>}
              {hadith.status === 'ok' && hadith.h && (
                <figure className="ui-quote jrj-quote" data-testid="jrj-hadith">
                  <blockquote>
                    {/* Ərəbcə yalnız tam mətndirsə (kəsik nüsxə heç bir dildə, ərəbcədə də göstərilmir — "Tam hədis" linki qalır) */}
                    {hadith.h.fullAr && <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{hadith.h.h.ar}</p>}
                    {lang !== 'ar' && hadith.h.h.text && hadith.h.h.text !== hadith.h.h.ar && <p className="ui-quote__text" dir="auto">{hadith.h.h.text}</p>}
                  </blockquote>
                  <figcaption className="ui-quote__src">
                    — {localizeSource(hadith.h.h.source, lang)} · {GRADE_SAHIH[lang] || GRADE_SAHIH.en}
                    {HADITH_IDS.includes(String(hadith.h.h.id)) && (() => {
                      const href = pathFor('hadith', lang, String(hadith.h.h.id))
                      return <> · <a className="ui-link" href={href} onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }}>{t.hadithFull}</a></>
                    })()}
                  </figcaption>
                </figure>
              )}
            </div>
          </div>

          <form ref={formRef} className="ui-card jrj-form" onSubmit={submit} aria-labelledby="jrj-form-title" noValidate>
            <h2 className="ui-title ui-title--sm" id="jrj-form-title">{editing ? t.editTitle : t.addTitle}</h2>
            <fieldset className="jrj-kinds">
              <legend className="ui-field__label">{t.kind}</legend>
              <div className="jrj-kinds__row">
                {JARIYAH_KINDS.map((k) => (
                  <label key={k} className={`ui-chip jrj-kind${form.k === k ? ' is-on' : ''}`}>
                    <input type="radio" name="jrj-kind" value={k} checked={form.k === k} onChange={set('k')} className="jrj-kind__input" />
                    <Icon name={KIND_ICON[k]} size={16} /> <span>{t.kinds[k]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="jrj-form__grid">
              <label className="ui-field">
                <span className="ui-field__label">{t.date}</span>
                <input className="ui-input" type="date" required value={form.d} max={today || undefined} min="1900-01-01" onChange={set('d')} disabled={!ready} />
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{t.onBehalf}</span>
                <input className="ui-input" type="text" dir="auto" maxLength={ON_MAX} placeholder={t.onBehalfPh} value={form.on} onChange={set('on')}
                  list={names.length ? 'jrj-names' : undefined} autoComplete="off" />
              </label>
            </div>
            {names.length > 0 && <datalist id="jrj-names">{names.map((n) => <option key={n} value={n} />)}</datalist>}
            <label className="ui-field">
              <span className="ui-field__label">{t.note}</span>
              <textarea className="ui-input jrj-note" dir="auto" rows={3} maxLength={NOTE_MAX} placeholder={t.notePh} value={form.no} onChange={set('no')} />
            </label>
            {err && <p className="jrj-error" role="alert">{err}</p>}
            <div className="jrj-form__actions">
              {editing && (
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { resetForm(); setErr('') }}>
                  <Icon name="close" className="ui-btn__icon" /> {t.cancel}
                </button>
              )}
              <button type="submit" className="ui-btn ui-btn--primary" disabled={!ready}>
                <Icon name="check" className="ui-btn__icon" /> {editing ? t.update : t.save}
              </button>
            </div>
          </form>

          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          <section aria-labelledby="jrj-list-title" className="jrj-list-wrap">
            <h2 className="ui-title ui-title--sm" id="jrj-list-title" tabIndex={-1} ref={listHeadRef}>{t.list}</h2>
            {ready && list.length === 0 && <p className="jrj-muted">{t.empty}</p>}
            {list.length > 0 && (
              <ul className="jrj-list">
                {list.map((x) => (
                  <li key={x.id} className="ui-card jrj-item" data-kind={x.k}>
                    <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={KIND_ICON[x.k]} size={18} /></span>
                    <div className="jrj-item__body">
                      <p className="jrj-item__title"><strong>{t.kinds[x.k]}</strong> <span className="jrj-item__date ui-num">{dayLabel(x.d, lang)}</span></p>
                      {x.on && <p className="jrj-item__on" dir="auto">{t.onBehalfOf(x.on)}</p>}
                      {x.no && <p className="jrj-item__note" dir="auto">{x.no}</p>}
                      {confirmId === x.id ? (
                        <div className="jrj-item__confirm" role="group" aria-label={t.confirmDel}>
                          <span>{t.confirmDel}</span>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--secondary jrj-danger" onClick={() => doDelete(x.id)} autoFocus>{t.yes}</button>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => setConfirmId(null)}>{t.no}</button>
                        </div>
                      ) : (
                        <div className="jrj-item__actions">
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => startEdit(x)} aria-label={`${t.edit}: ${t.kinds[x.k]}, ${dayLabel(x.d, lang)}`}>
                            <Icon name="edit" size={16} className="ui-btn__icon" /> {t.edit}
                          </button>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => setConfirmId(x.id)} aria-label={`${t.del}: ${t.kinds[x.k]}, ${dayLabel(x.d, lang)}`}>
                            <Icon name="trash" size={16} className="ui-btn__icon" /> {t.del}
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <h2 className="ui-title ui-title--sm jrj-related-title">{t.related}</h2>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
