// ═══════════════════════════════════════════════════════
// DuaCapsule — dua zaman kapsulu
//
// İstifadəçi duasını / niyyətini yazır və seçdiyi günə qədər möhürləyir:
// gələn Ramazan (1 Ramazan), gələn Qurban bayramı (10 Zilhiccə), 1 il sonra
// və ya öz tarixi. Kağız zərfə qatlanır, mum möhür basılır, kapsul rəfə düşür —
// rəfdə yalnız geri sayım görünür. Vaxt çatanda zərf parlayır; toxunanda möhür
// sınır, kağız açılır: "{tarix} belə dua etmişdin: …". Sonra: qəbul olundu,
// duaya davam (yenidən möhürlə) və ya sil.
// Hər şey yalnız bu cihazda (localStorage: muslim_cc_dua_capsules) — serverə
// heç nə getmir; açar ehtiyat nüsxəyə (utils/userBackup) avtomatik düşür.
// Mətn şifrələnmir — sadəcə vaxtına qədər göstərilmir (UI-də dürüst deyilir).
// useReduced(): qatlanma / sınma animasiyası yoxdur, vəziyyət dərhal dəyişir.
// vC: hesabla daxil olan istifadəçi "Açılış günü e-poçtuma da göndər" seçə bilər — onda mətn və tarix
// (açıq razılıqla) serverə gedir: server/personal.js → "Gələcək özünə məktub" (kind: 'capsule').
// Seçilməsə, əvvəlki kimi heç nə göndərilmir. Girişsiz ziyarətçiyə qısa tizer göstərilir.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced'
import { formatGregorian, fromLocalDate } from '../utils/hijri'
import {
  STORAGE_KEY, MAX_TEXT, PRESETS, loadCapsules, saveCapsules, createCapsule, presetOpenAt,
  capsuleState, daysUntil, resealCapsule, sortCapsules,
} from '../utils/duaCapsule'
import { pathFor } from '../seo/routes'
import { createLetter, listLetters } from '../api/personal'
import { localKey } from '../utils/personalDates'
import { ConsentBox, LovedTeaser, PersonalTeaser, usePersonalText, useSignedIn } from './personal/PersonalUi'
import '../styles/DuaCapsule.css'

const SEAL_MS = 1750
const OPEN_MS = 1300

const ruDays = (n) => {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return 'день'
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'дня'
  return 'дней'
}

const T = {
  az: {
    eyebrow: 'Zaman kapsulu', title: 'Duanı möhürlə',
    lead: 'Duanı və ya niyyətini yaz, seçdiyin günə qədər möhürlə. O gün gələndə zərfi açıb oxuyacaqsan — və Allahın necə cavab verdiyini xatırlayacaqsan.',
    label: 'Duan və ya niyyətin', ph: 'Məs.: Ya Rəbb, ailəmə sağlamlıq, mənə halal ruzi nəsib et…',
    count: (n) => `${n} / ${MAX_TEXT}`, when: 'Nə vaxt açılsın?',
    presets: { ramadan: 'Gələn Ramazan', adha: 'Gələn Qurban bayramı', year: '1 ildən sonra', custom: 'Öz tarixim' },
    customLabel: 'Açılış tarixi', badDate: 'Gələcəkdə bir tarix seç.',
    seal: 'Möhürlə', sealing: 'Möhürlənir…',
    privacy: 'Heç nə göndərilmir — kapsul yalnız bu cihazda saxlanır. Mətn şifrələnmir, sadəcə açılış gününə qədər göstərilmir.',
    sealedMsg: (d) => `Dua möhürləndi. ${d} tarixində açılacaq.`,
    shelf: 'Kapsullarım', empty: 'Hələ möhürlənmiş dua yoxdur.',
    inDays: (n) => n === 1 ? 'Sabah açılacaq' : `${n} gündən sonra açılacaq`,
    opensOn: (d) => `Açılış: ${d}`, sealedOn: (d) => `Möhürləndi: ${d}`,
    ready: 'Açılmağa hazırdır', open: 'Aç', openLabel: (d) => `${d} tarixində möhürlənmiş kapsulu aç`,
    prayed: (d) => `${d} tarixində belə dua etmişdin:`,
    answered: 'Əlhəmdulillah, qəbul olundu', answeredBadge: 'Qəbul olundu — Əlhəmdulillah',
    keep: 'Duaya davam et', keepWhen: 'Yenidən nə vaxt açılsın?', resealedMsg: (d) => `Yenidən möhürləndi. ${d} tarixində açılacaq.`,
    del: 'Kapsulu sil', delConfirm: 'Bəli, sil', cancel: 'Ləğv et', deletedMsg: 'Kapsul silindi.', answeredMsg: 'Qəbul olunmuş kimi qeyd edildi.',
    envelope: 'Möhürlü zərf',
  },
  en: {
    eyebrow: 'Time capsule', title: 'Seal your dua',
    lead: 'Write a dua or an intention and seal it until a day you choose. When that day comes you will open the envelope and read it — and remember how Allah answered.',
    label: 'Your dua or intention', ph: 'E.g. O Allah, grant my family good health and me a halal provision…',
    count: (n) => `${n} / ${MAX_TEXT}`, when: 'When should it open?',
    presets: { ramadan: 'Next Ramadan', adha: 'Next Eid al-Adha', year: 'In 1 year', custom: 'My own date' },
    customLabel: 'Opening date', badDate: 'Choose a date in the future.',
    seal: 'Seal it', sealing: 'Sealing…',
    privacy: 'Nothing is sent anywhere — the capsule is stored only on this device. The text is not encrypted, just not shown until the opening day.',
    sealedMsg: (d) => `Your dua is sealed. It will open on ${d}.`,
    shelf: 'My capsules', empty: 'No sealed duas yet.',
    inDays: (n) => n === 1 ? 'Opens tomorrow' : `Opens in ${n} days`,
    opensOn: (d) => `Opens: ${d}`, sealedOn: (d) => `Sealed: ${d}`,
    ready: 'Ready to open', open: 'Open', openLabel: (d) => `Open the capsule sealed on ${d}`,
    prayed: (d) => `On ${d} you prayed:`,
    answered: 'Alhamdulillah, it was answered', answeredBadge: 'Answered — Alhamdulillah',
    keep: 'Keep praying', keepWhen: 'When should it open again?', resealedMsg: (d) => `Sealed again. It will open on ${d}.`,
    del: 'Delete capsule', delConfirm: 'Yes, delete', cancel: 'Cancel', deletedMsg: 'Capsule deleted.', answeredMsg: 'Marked as answered.',
    envelope: 'Sealed envelope',
  },
  ru: {
    eyebrow: 'Капсула времени', title: 'Запечатайте свою дуа',
    lead: 'Напишите дуа или намерение и запечатайте до выбранного дня. Когда он наступит, вы откроете конверт и прочтёте — и вспомните, как ответил Аллах.',
    label: 'Ваша дуа или намерение', ph: 'Напр.: О Аллах, даруй моей семье здоровье, а мне — дозволенный удел…',
    count: (n) => `${n} / ${MAX_TEXT}`, when: 'Когда открыть?',
    presets: { ramadan: 'Следующий Рамадан', adha: 'Следующий Курбан-байрам', year: 'Через год', custom: 'Своя дата' },
    customLabel: 'Дата открытия', badDate: 'Выберите дату в будущем.',
    seal: 'Запечатать', sealing: 'Запечатываем…',
    privacy: 'Ничего никуда не отправляется — капсула хранится только на этом устройстве. Текст не шифруется, просто не показывается до дня открытия.',
    sealedMsg: (d) => `Дуа запечатана. Откроется ${d}.`,
    shelf: 'Мои капсулы', empty: 'Запечатанных дуа пока нет.',
    inDays: (n) => n === 1 ? 'Откроется завтра' : `Откроется через ${n} ${ruDays(n)}`,
    opensOn: (d) => `Открытие: ${d}`, sealedOn: (d) => `Запечатано: ${d}`,
    ready: 'Можно открыть', open: 'Открыть', openLabel: (d) => `Открыть капсулу, запечатанную ${d}`,
    prayed: (d) => `${d} вы просили:`,
    answered: 'Альхамдулиллях, дуа принята', answeredBadge: 'Принята — Альхамдулиллях',
    keep: 'Продолжать просить', keepWhen: 'Когда открыть снова?', resealedMsg: (d) => `Снова запечатано. Откроется ${d}.`,
    del: 'Удалить капсулу', delConfirm: 'Да, удалить', cancel: 'Отмена', deletedMsg: 'Капсула удалена.', answeredMsg: 'Отмечено как принятое.',
    envelope: 'Запечатанный конверт',
  },
  tr: {
    eyebrow: 'Zaman kapsülü', title: 'Duanı mühürle',
    lead: 'Duanı ya da niyetini yaz, seçtiğin güne kadar mühürle. O gün geldiğinde zarfı açıp okuyacaksın — ve Allah’ın nasıl cevap verdiğini hatırlayacaksın.',
    label: 'Duan ya da niyetin', ph: 'Örn.: Rabbim, aileme sağlık, bana helal rızık nasip et…',
    count: (n) => `${n} / ${MAX_TEXT}`, when: 'Ne zaman açılsın?',
    presets: { ramadan: 'Gelecek Ramazan', adha: 'Gelecek Kurban Bayramı', year: '1 yıl sonra', custom: 'Kendi tarihim' },
    customLabel: 'Açılış tarihi', badDate: 'Gelecekte bir tarih seç.',
    seal: 'Mühürle', sealing: 'Mühürleniyor…',
    privacy: 'Hiçbir şey gönderilmez — kapsül yalnızca bu cihazda saklanır. Metin şifrelenmez, sadece açılış gününe kadar gösterilmez.',
    sealedMsg: (d) => `Dua mühürlendi. ${d} tarihinde açılacak.`,
    shelf: 'Kapsüllerim', empty: 'Henüz mühürlenmiş dua yok.',
    inDays: (n) => n === 1 ? 'Yarın açılacak' : `${n} gün sonra açılacak`,
    opensOn: (d) => `Açılış: ${d}`, sealedOn: (d) => `Mühürlendi: ${d}`,
    ready: 'Açılmaya hazır', open: 'Aç', openLabel: (d) => `${d} tarihinde mühürlenen kapsülü aç`,
    prayed: (d) => `${d} tarihinde şöyle dua etmiştin:`,
    answered: 'Elhamdülillah, kabul oldu', answeredBadge: 'Kabul oldu — Elhamdülillah',
    keep: 'Duaya devam et', keepWhen: 'Yeniden ne zaman açılsın?', resealedMsg: (d) => `Yeniden mühürlendi. ${d} tarihinde açılacak.`,
    del: 'Kapsülü sil', delConfirm: 'Evet, sil', cancel: 'Vazgeç', deletedMsg: 'Kapsül silindi.', answeredMsg: 'Kabul olmuş olarak işaretlendi.',
    envelope: 'Mühürlü zarf',
  },
  ar: {
    eyebrow: 'كبسولة الزمن', title: 'اختم دعاءك',
    lead: 'اكتب دعاءً أو نيّة واختمه حتى يوم تختاره. فإذا جاء ذلك اليوم فتحت الظرف وقرأته — وتذكّرت كيف استجاب الله.',
    label: 'دعاؤك أو نيّتك', ph: 'مثال: اللهم ارزق أهلي العافية وارزقني رزقًا حلالًا…',
    count: (n) => `${n} / ${MAX_TEXT}`, when: 'متى يُفتح؟',
    presets: { ramadan: 'رمضان القادم', adha: 'عيد الأضحى القادم', year: 'بعد سنة', custom: 'تاريخ أختاره' },
    customLabel: 'تاريخ الفتح', badDate: 'اختر تاريخًا في المستقبل.',
    seal: 'اختمه', sealing: 'جارٍ الختم…',
    privacy: 'لا يُرسل شيء إلى أي مكان — تُحفظ الكبسولة على هذا الجهاز فقط. النص غير مشفّر، لكنه لا يُعرض قبل يوم الفتح.',
    sealedMsg: (d) => `خُتم دعاؤك. يُفتح في ${d}.`,
    shelf: 'كبسولاتي', empty: 'لا يوجد دعاء مختوم بعد.',
    inDays: (n) => n === 1 ? 'يُفتح غدًا' : `يُفتح بعد ${n} يوم`,
    opensOn: (d) => `الفتح: ${d}`, sealedOn: (d) => `خُتم: ${d}`,
    ready: 'جاهز للفتح', open: 'افتح', openLabel: (d) => `افتح الكبسولة المختومة في ${d}`,
    prayed: (d) => `في ${d} دعوتَ:`,
    answered: 'الحمد لله، استُجيب', answeredBadge: 'استُجيب — الحمد لله',
    keep: 'واصل الدعاء', keepWhen: 'متى يُفتح مجددًا؟', resealedMsg: (d) => `خُتم من جديد. يُفتح في ${d}.`,
    del: 'احذف الكبسولة', delConfirm: 'نعم، احذف', cancel: 'إلغاء', deletedMsg: 'حُذفت الكبسولة.', answeredMsg: 'عُلّم كمستجاب.',
    envelope: 'ظرف مختوم',
  },
}

const todayKey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const tomorrowKey = () => { const d = new Date(); d.setDate(d.getDate() + 1); return todayKey(d) }
const fmt = (iso, lang) => formatGregorian(fromLocalDate(new Date(iso)), lang)

// Zərf: gövdə, qapaq (flap), iki yarımdan ibarət mum möhür (sınanda ayrılır)
function Envelope({ className = '' }) {
  return (
    <svg className={`dc-env ${className}`} viewBox="0 0 120 84" aria-hidden="true" focusable="false">
      <rect className="dc-env__body" x="4" y="14" width="112" height="66" rx="6" />
      <path className="dc-env__fold" d="M4 78 L60 44 L116 78" />
      <path className="dc-env__flap" d="M4 18 Q4 14 8 14 L112 14 Q116 14 116 18 L60 52 Z" />
      <g className="dc-env__seal">
        <path className="dc-env__half dc-env__half--l" d="M60 35 L57 41 L62 46 L58 52 L60 57 A11 11 0 0 1 60 35 Z" />
        <path className="dc-env__half dc-env__half--r" d="M60 57 L58 52 L62 46 L57 41 L60 35 A11 11 0 0 1 60 57 Z" />
        <path className="dc-env__mark" d="M63.5 40.5 A6 6 0 1 0 63.5 51.5 A4.6 4.6 0 1 1 63.5 40.5 Z" />
      </g>
    </svg>
  )
}

export default function DuaCapsule() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const { t: pt, siteLang } = usePersonalText()
  const { status } = useSignedIn()
  const [mailIt, setMailIt] = useState(false)
  const [mailConsent, setMailConsent] = useState(false)
  const [consentKnown, setConsentKnown] = useState(null)   // null — bilinmir; true/false — serverdən
  const reduced = useReduced()
  const [list, setList] = useState(() => loadCapsules())
  const [text, setText] = useState('')
  const [preset, setPreset] = useState('ramadan')
  const [custom, setCustom] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [sealing, setSealing] = useState(null)        // { id, text } — animasiya gedir
  const [openingId, setOpeningId] = useState(null)
  const [freshId, setFreshId] = useState(null)        // yenicə rəfə düşən / açılan
  const [resealId, setResealId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const timers = useRef([])

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id) }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Geri sayım: dəqiqədə bir və səhifəyə qayıdanda yenilə
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 60000)
    const vis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [])

  // Başqa vərəqdə (və ya ehtiyat nüsxə bərpasında) dəyişəndə
  useEffect(() => {
    const onStorage = (e) => { if (e.key === STORAGE_KEY || e.key === null) setList(loadCapsules()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = (next) => { setList(next); saveCapsules(next) }
  const sorted = useMemo(() => sortCapsules(list, now), [list, now])
  const shelf = sealing ? sorted.filter(c => c.id !== sealing.id) : sorted

  const seal = (e) => {
    e?.preventDefault()
    if (sealing) return
    setErr('')
    const at = new Date()
    const openAt = presetOpenAt(preset, at, custom)
    if (!openAt) { setErr(t.badDate); return }
    const c = createCapsule(text, openAt, at)
    if (!c) return
    if (mailIt && status === 'user' && !consentKnown && !mailConsent) { setErr(pt.consentNeed); return }
    commit([...list, c])
    if (mailIt && status === 'user') {
      createLetter({ body: c.text, deliverOn: localKey(openAt), kind: 'capsule', lang, consent: !consentKnown && mailConsent })
        .then(() => { setConsentKnown(true); setMsg(pt.capsuleMailed) })
        .catch(() => setErr(pt.err.unknown))
    }
    setText('')
    setNow(at)
    const done = () => { setSealing(null); setFreshId(c.id); setMsg(t.sealedMsg(fmt(c.openAt, lang))) }
    if (reduced) { done(); return }
    setMsg(t.sealing)
    setSealing({ id: c.id, text: c.text })
    later(done, SEAL_MS)
  }

  const open = (c) => {
    if (openingId) return
    const finish = () => {
      setOpeningId(null)
      setFreshId(c.id)
      setList(cur => { const next = cur.map(x => x.id === c.id ? { ...x, opened: true } : x); saveCapsules(next); return next })
      setMsg(t.prayed(fmt(c.createdAt, lang)))
    }
    if (reduced) { finish(); return }
    setOpeningId(c.id)
    later(finish, OPEN_MS)
  }

  const markAnswered = (c) => { commit(list.map(x => x.id === c.id ? { ...x, answered: true } : x)); setMsg(t.answeredMsg) }
  const reseal = (c, p) => {
    const at = new Date()
    const openAt = presetOpenAt(p, at)
    if (!openAt) return
    commit(list.map(x => x.id === c.id ? resealCapsule(x, openAt) : x))
    setResealId(null); setFreshId(c.id); setNow(at)
    setMsg(t.resealedMsg(fmt(openAt.toISOString(), lang)))
  }
  const remove = (c) => { commit(list.filter(x => x.id !== c.id)); setConfirmId(null); setMsg(t.deletedMsg) }

  const delControls = (c) => confirmId === c.id ? (
    <span className="dc-confirm">
      <button type="button" className="ui-btn ui-btn--sm dc-btn-danger" onClick={() => remove(c)}>{t.delConfirm}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setConfirmId(null)}>{t.cancel}</button>
    </span>
  ) : (
    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dc-del" onClick={() => setConfirmId(c.id)} aria-label={t.del} title={t.del}>
      <Icon name="trash" className="ui-btn__icon" />
    </button>
  )

  return (
    <section className={`dc${reduced ? ' dc--still' : ''}`} data-testid="dua-capsule" aria-labelledby="dc-title">
      <header className="dc-head">
        <span className="ui-eyebrow">{t.eyebrow}</span>
        <h2 id="dc-title" className="ui-title">{t.title}</h2>
        <p className="ui-lead">{t.lead}</p>
      </header>

      <form className="dc-form ui-card" onSubmit={seal}>
        <label className="ui-field" htmlFor="dc-text">
          <span className="ui-field__label">{t.label}</span>
          <textarea id="dc-text" className="ui-input dc-text" value={text} maxLength={MAX_TEXT} rows={4} placeholder={t.ph}
            dir="auto" disabled={!!sealing} aria-describedby="dc-count dc-privacy" onChange={(e) => setText(e.target.value)} />
          <span id="dc-count" className="dc-count">{t.count(text.length)}</span>
        </label>

        <div className="ui-field">
          <span className="ui-field__label" id="dc-when">{t.when}</span>
          <div className="dc-presets" role="group" aria-labelledby="dc-when">
            {PRESETS.map((p) => (
              <button key={p} type="button" className="ui-chip" aria-pressed={preset === p}
                onClick={() => { setPreset(p); setErr('') }}>{t.presets[p]}</button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <label className="ui-field dc-date" htmlFor="dc-date">
            <span className="ui-field__label">{t.customLabel}</span>
            <input id="dc-date" type="date" className="ui-input" value={custom} min={tomorrowKey()}
              aria-invalid={err ? 'true' : undefined} aria-describedby={err ? 'dc-err' : undefined}
              onChange={(e) => { setCustom(e.target.value); setErr('') }} />
          </label>
        )}
        {err && <p id="dc-err" className="dc-err" role="alert">{err}</p>}

        {status === 'user' && (
          <div className="pr-capsule-mail">
            <label className="acc-check" htmlFor="dc-mail">
              <input id="dc-mail" type="checkbox" checked={mailIt} data-testid="dc-mail"
                onChange={(e) => {
                  setMailIt(e.target.checked); setErr('')
                  if (e.target.checked && consentKnown === null) listLetters().then((r) => setConsentKnown(Boolean(r.consent))).catch(() => setConsentKnown(false))
                }} />
              <span>{pt.capsuleMail}</span>
            </label>
            {mailIt && consentKnown === false && <ConsentBox t={pt} checked={mailConsent} onChange={setMailConsent} id="dc-mail-consent" />}
          </div>
        )}

        <button type="submit" className="ui-btn ui-btn--primary dc-seal-btn" data-testid="dc-seal"
          disabled={!text.trim() || !!sealing || (preset === 'custom' && !custom)}>
          <Icon name="duajournal" className="ui-btn__icon" /> {sealing ? t.sealing : t.seal}
        </button>
        <p id="dc-privacy" className="dc-privacy"><Icon name="shield" size={14} /> {mailIt ? pt.consentNote : t.privacy}</p>
        {status === 'anon' && <PersonalTeaser text={pt.teaser.letters} next={pathFor('duajournal', siteLang)} testId="capsule-teaser" icon="mail" />}
      </form>

      {sealing && (
        <div className="dc-stage" aria-hidden="true">
          <div className="dc-paper"><p dir="auto">{sealing.text}</p></div>
          <Envelope className="dc-env--sealing" />
        </div>
      )}

      <p className="dc-live" role="status" aria-live="polite">{msg}</p>

      <div className="dc-shelf-wrap">
        <h3 className="dc-shelf-title">{t.shelf}</h3>
        {shelf.length === 0 ? (
          <p className="dc-empty">{t.empty}</p>
        ) : (
          <ul className="dc-shelf">
            {shelf.map((c) => {
              const st = capsuleState(c, now)
              const cls = `dc-item dc-item--${st}${freshId === c.id ? ' is-fresh' : ''}${openingId === c.id ? ' is-opening' : ''}`
              if (st === 'sealed') {
                return (
                  <li key={c.id} className={cls} data-testid="dc-item" data-state="sealed">
                    <Envelope />
                    <p className="dc-countdown">{t.inDays(daysUntil(c.openAt, now))}</p>
                    <p className="dc-meta">{t.opensOn(fmt(c.openAt, lang))}</p>
                    <div className="dc-item-actions">{delControls(c)}</div>
                  </li>
                )
              }
              if (st === 'ready') {
                return (
                  <li key={c.id} className={cls} data-testid="dc-item" data-state="ready">
                    <button type="button" className="dc-open" onClick={() => open(c)} disabled={openingId === c.id}
                      aria-label={t.openLabel(fmt(c.createdAt, lang))}>
                      <span className="dc-glow" aria-hidden="true" />
                      <Envelope />
                      <span className="dc-ready">{t.ready}</span>
                      <span className="dc-open-cta">{t.open}</span>
                    </button>
                    <p className="dc-meta">{t.sealedOn(fmt(c.createdAt, lang))}</p>
                  </li>
                )
              }
              return (
                <li key={c.id} className={cls} data-testid="dc-item" data-state="opened">
                  <div className="dc-letter">
                    <p className="dc-prayed">{t.prayed(fmt(c.createdAt, lang))}</p>
                    <blockquote className="dc-quote" dir="auto">{c.text}</blockquote>
                    {c.answered && <p className="dc-badge"><Icon name="check" size={14} /> {t.answeredBadge}</p>}
                  </div>
                  <div className="dc-item-actions">
                    {!c.answered && (
                      <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => markAnswered(c)}>
                        <Icon name="sparkle" className="ui-btn__icon" /> {t.answered}
                      </button>
                    )}
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-expanded={resealId === c.id}
                      onClick={() => setResealId(resealId === c.id ? null : c.id)}>
                      <Icon name="refresh" className="ui-btn__icon" /> {t.keep}
                    </button>
                    {delControls(c)}
                  </div>
                  {resealId === c.id && (
                    <div className="dc-reseal" role="group" aria-label={t.keepWhen}>
                      <span className="dc-reseal-label">{t.keepWhen}</span>
                      {['ramadan', 'adha', 'year'].map((p) => (
                        <button key={p} type="button" className="ui-chip" onClick={() => reseal(c, p)}>{t.presets[p]}</button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <LovedTeaser />
    </section>
  )
}
