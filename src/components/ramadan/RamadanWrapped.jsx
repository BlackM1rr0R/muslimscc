// ═══════════════════════════════════════════════════════
// RamadanWrapped (J4) — Ramazan albomunun fəsli "hekayə" kimi: tam ekran kartlar + paylaşılan PNG
//
//   <RamadanWrapped lang="az" year={1447} chapter={c} onClose={() => …} />
//
// • Kartlar utils/ramadanWrapped-dəndir: yalnız ÖLÇÜLƏN göstəricilər (oruc, xətm, təravih, ayə, surə,
//   zikr, dua, Ümmət xətmi). "Ən çox oxunan surə" ölçülmür — kart yoxdur.
// • Klaviatura: ← / → (ərəbcədə güzgülənir), Home / End, Esc — bağla; sürüşdürmə (swipe); fokus dialoqda
//   qalır (yerli <dialog>.showModal), bağlananda açan düyməyə qayıdır; kart dəyişəndə aria-live xəbər verir.
// • Hərəkət azaldılıbsa — keçid animasiyası yoxdur (CSS). PNG — utils/statCard (yalnız həndəsə).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { makeFormat } from '../viz/format.js'
import { formatGregorian, parseGKey } from '../../utils/hijri'
import { wrappedCards } from '../../utils/ramadanWrapped'
import { readTaraweeh } from '../../utils/taraweeh'
import { readKhatm } from '../../utils/worldKhatm'
import { canShareFile, preopenWindow, saveBlob } from '../../utils/quoteCard'
import '../../styles/RamadanWrapped.css'

export const RW_TXT = {
  az: {
    open: 'Hekayə kimi bax', label: (y) => `Ramazan ${y} — hekayə`, prev: 'Əvvəlki', next: 'Növbəti', close: 'Bağla',
    pos: (i, n) => `${i} / ${n}`, dot: (i) => `Kart ${i}`, introTitle: 'Ramazanınız bir baxışda',
    introLead: 'Yalnız sizin qeydlərinizdən — ölçülməyən göstərici göstərilmir.',
    m: { f: 'Tutulan oruc', k: 'Xətm', tw: 'Təravih gecəsi', q: 'Oxunan ayə', su: 'Oxunan surə', dh: 'Zikr', du: 'Yazılan dua', um: 'Ümmət xətmi dövrü' },
    lead: { f: 'Hilal yolunda qeyd etdiyiniz oruclar', k: 'Ramazanda tamamladığınız xətm', tw: 'Təravih gündəliyində qeyd etdiyiniz gecələr', q: 'Ramazanda oxuduğunuz ayələr', su: 'Ramazanda açdığınız surələr', dh: 'Ramazanda etdiyiniz zikr', du: 'Dua gündəliyinizə yazdığınız dualar', um: 'İştirak etdiyiniz və Ramazanda tamamlanan dövrlər' },
    sub: { x: (n) => `üzrlü: ${n}`, rak: (r, c) => `${c} gecədə ${r} rəkət yazılıb`, da: (n) => `qəbul olundu: ${n}` },
    finalTitle: 'Paylaşmaq üçün kart', finalLead: 'Kartda yalnız rəqəmlər və həndəsi naxış var.', share: 'Kartı paylaş və ya yüklə', saved: 'Kart hazırdır.',
    cardSub: 'mənim Ramazan hekayəm', swipe: 'Kartlar arasında oxlarla və ya sürüşdürərək keçin.',
  },
  en: {
    open: 'View as a story', label: (y) => `Ramadan ${y} — story`, prev: 'Previous', next: 'Next', close: 'Close',
    pos: (i, n) => `${i} / ${n}`, dot: (i) => `Card ${i}`, introTitle: 'Your Ramadan at a glance',
    introLead: 'Only from your own records — nothing that was not measured is shown.',
    m: { f: 'Fasts kept', k: 'Khatms', tw: 'Taraweeh nights', q: 'Verses read', su: 'Surahs read', dh: 'Dhikr', du: 'Duas written', um: 'Ummah khatm rounds' },
    lead: { f: 'The fasts you logged on the crescent path', k: 'Khatms you completed in Ramadan', tw: 'Nights you marked in the taraweeh log', q: 'Verses you read in Ramadan', su: 'Surahs you opened in Ramadan', dh: 'Your dhikr in Ramadan', du: 'Duas you wrote in your journal', um: 'Rounds you took part in that were completed in Ramadan' },
    sub: { x: (n) => `excused: ${n}`, rak: (r, c) => `${r} rak‘ahs noted over ${c} nights`, da: (n) => `answered: ${n}` },
    finalTitle: 'A card to share', finalLead: 'The card shows only numbers and a geometric pattern.', share: 'Share or download the card', saved: 'Your card is ready.',
    cardSub: 'my Ramadan story', swipe: 'Move between cards with the arrow keys or by swiping.',
  },
  ru: {
    open: 'Смотреть как историю', label: (y) => `Рамадан ${y} — история`, prev: 'Назад', next: 'Далее', close: 'Закрыть',
    pos: (i, n) => `${i} / ${n}`, dot: (i) => `Карточка ${i}`, introTitle: 'Ваш Рамадан с первого взгляда',
    introLead: 'Только из ваших записей — неизмеренные показатели не показываются.',
    m: { f: 'Соблюдено постов', k: 'Хатмы', tw: 'Ночи таравиха', q: 'Прочитано аятов', su: 'Прочитано сур', dh: 'Зикр', du: 'Записано дуа', um: 'Круги хатма уммы' },
    lead: { f: 'Посты, отмеченные на пути полумесяца', k: 'Хатмы, завершённые в Рамадан', tw: 'Ночи, отмеченные в дневнике таравиха', q: 'Аяты, прочитанные в Рамадан', su: 'Суры, открытые в Рамадан', dh: 'Ваш зикр в Рамадан', du: 'Дуа, записанные в дневник', um: 'Круги с вашим участием, завершённые в Рамадан' },
    sub: { x: (n) => `освобождение: ${n}`, rak: (r, c) => `ракаатов: ${r}, ночей: ${c}`, da: (n) => `принято: ${n}` },
    finalTitle: 'Карточка, чтобы поделиться', finalLead: 'На карточке только цифры и геометрический узор.', share: 'Поделиться или скачать', saved: 'Карточка готова.',
    cardSub: 'моя история Рамадана', swipe: 'Переходите между карточками стрелками или свайпом.',
  },
  ar: {
    open: 'اعرضه كقصة', label: (y) => `رمضان ${y} — قصة`, prev: 'السابق', next: 'التالي', close: 'إغلاق',
    pos: (i, n) => `${i} / ${n}`, dot: (i) => `البطاقة ${i}`, introTitle: 'رمضانك في لمحة',
    introLead: 'من سجلاتك وحدها — لا يُعرض ما لم يُقَس.',
    m: { f: 'أيام الصيام', k: 'ختمات', tw: 'ليالي التراويح', q: 'آيات مقروءة', su: 'سور مقروءة', dh: 'الذكر', du: 'أدعية مكتوبة', um: 'دورات ختمة الأمة' },
    lead: { f: 'الصيام الذي سجلته في طريق الهلال', k: 'الختمات التي أتممتها في رمضان', tw: 'الليالي التي سجلتها في سجل التراويح', q: 'الآيات التي قرأتها في رمضان', su: 'السور التي فتحتها في رمضان', dh: 'ذكرك في رمضان', du: 'الأدعية التي كتبتها في دفترك', um: 'دورات شاركت فيها واكتملت في رمضان' },
    sub: { x: (n) => `عذر: ${n}`, rak: (r, c) => `${r} ركعة في ${c} ليلة`, da: (n) => `مستجاب: ${n}` },
    finalTitle: 'بطاقة للمشاركة', finalLead: 'في البطاقة أرقام ونقش هندسي فقط.', share: 'شارك البطاقة أو نزّلها', saved: 'بطاقتك جاهزة.',
    cardSub: 'قصتي في رمضان', swipe: 'تنقّل بين البطاقات بالأسهم أو بالسحب.',
  },
  tr: {
    open: 'Hikâye olarak gör', label: (y) => `Ramazan ${y} — hikâye`, prev: 'Önceki', next: 'Sonraki', close: 'Kapat',
    pos: (i, n) => `${i} / ${n}`, dot: (i) => `Kart ${i}`, introTitle: 'Ramazanınız bir bakışta',
    introLead: 'Yalnızca kendi kayıtlarınızdan — ölçülmeyen gösterge gösterilmez.',
    m: { f: 'Tutulan oruç', k: 'Hatim', tw: 'Teravih gecesi', q: 'Okunan ayet', su: 'Okunan sure', dh: 'Zikir', du: 'Yazılmış dua', um: 'Ümmet hatmi turu' },
    lead: { f: 'Hilal yolunda işaretlediğiniz oruçlar', k: 'Ramazan’da tamamladığınız hatimler', tw: 'Teravih günlüğünde işaretlediğiniz geceler', q: 'Ramazan’da okuduğunuz ayetler', su: 'Ramazan’da açtığınız sureler', dh: 'Ramazan’daki zikriniz', du: 'Dua günlüğünüze yazdığınız dualar', um: 'Katıldığınız ve Ramazan’da tamamlanan turlar' },
    sub: { x: (n) => `mazeretli: ${n}`, rak: (r, c) => `${c} gecede ${r} rekât yazıldı`, da: (n) => `kabul edildi: ${n}` },
    finalTitle: 'Paylaşmak için kart', finalLead: 'Kartta yalnızca rakamlar ve geometrik desen var.', share: 'Kartı paylaşın ya da indirin', saved: 'Kartınız hazır.',
    cardSub: 'benim Ramazan hikâyem', swipe: 'Kartlar arasında oklarla ya da kaydırarak geçin.',
  },
}

const ICONS = { f: 'ramadan', k: 'quran', tw: 'moonStar', q: 'quran', su: 'mushaf', dh: 'dhikr', du: 'duajournal', um: 'sparkle' }
const dayLabel = (d, lang) => { const g = parseGKey(d); return g ? formatGregorian(g, lang) : d }

/** Bu fəsil üçün kartlar (yaddaşdan təravih + Ümmət xətmi) — boşdursa düymə göstərilmir */
export function useWrappedCards(chapter, year) {
  return useMemo(() => (chapter ? wrappedCards(chapter, { y: year, taraweeh: readTaraweeh(), khatm: readKhatm() }) : []), [chapter, year])
}

export default function RamadanWrapped({ lang = 'az', year, chapter, onClose }) {
  const t = pickUi(RW_TXT, lang, 'en')
  const fmt = useMemo(() => makeFormat(lang), [lang])
  const metrics = useWrappedCards(chapter, year)
  const total = metrics.length + 2   // giriş + göstəricilər + paylaşma
  const [i, setI] = useState(0)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const dlg = useRef(null)
  const head = useRef(null)
  const touch = useRef(null)
  const rtl = lang === 'ar'
  const num = (v) => fmt.num(v, { maximumFractionDigits: 0 })

  useEffect(() => {
    const d = dlg.current
    if (!d) return undefined
    try { d.showModal() } catch { d.setAttribute('open', '') }
    head.current?.focus()
    const onCancel = (e) => { e.preventDefault(); onClose?.() }
    d.addEventListener('cancel', onCancel)
    return () => { d.removeEventListener('cancel', onCancel); try { d.close() } catch { /* */ } }
  }, [onClose])

  const go = (n) => setI(Math.max(0, Math.min(total - 1, n)))
  const onKey = (e) => {
    if (e.target?.closest?.('input, select, textarea')) return
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === fwd) { e.preventDefault(); go(i + 1) }
    else if (e.key === back) { e.preventDefault(); go(i - 1) }
    else if (e.key === 'Home') { e.preventDefault(); go(0) }
    else if (e.key === 'End') { e.preventDefault(); go(total - 1) }
  }
  const onPointerDown = (e) => { touch.current = { x: e.clientX, y: e.clientY } }
  const onPointerUp = (e) => {
    const s = touch.current
    touch.current = null
    if (!s) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
    const forward = rtl ? dx > 0 : dx < 0
    go(i + (forward ? 1 : -1))
  }

  const share = async () => {
    if (busy) return
    const win = preopenWindow()
    setBusy(true)
    try {
      const { statCardBlob } = await import('../../utils/statCard')
      const blob = await statCardBlob({
        eyebrow: t.label(year), title: t.introTitle, sub: chapter ? `${dayLabel(chapter.s, lang)} — ${dayLabel(chapter.e, lang)}` : '',
        stats: metrics.slice(0, 6).map((c) => ({ v: num(c.v), l: t.m[c.k] })), foot: t.cardSub, rtl, tone: 'night',
      })
      if (!blob) return
      const name = `ramadan-${year}-story.png`
      const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null
      if (file && canShareFile(file)) {
        try { await navigator.share({ files: [file], title: t.label(year) }) } catch { /* imtina */ }
        win?.close?.()
      } else saveBlob(blob, name, win)
      setStatus(t.saved)
    } finally { setBusy(false) }
  }

  const card = (() => {
    if (i === 0) return (
      <div className="rw__card rw__card--intro">
        <svg className="rw__moon" viewBox="0 0 64 64" aria-hidden="true"><path d="M40 8a24 24 0 1 0 16 40A20 20 0 1 1 40 8z" /></svg>
        <p className="rw__k">{t.label(year)}</p>
        <p className="rw__big rw__big--title">{t.introTitle}</p>
        {chapter && <p className="rw__lead">{dayLabel(chapter.s, lang)} — {dayLabel(chapter.e, lang)}</p>}
        <p className="rw__lead">{t.introLead}</p>
      </div>
    )
    if (i === total - 1) return (
      <div className="rw__card rw__card--final">
        <p className="rw__big rw__big--title">{t.finalTitle}</p>
        <ul className="rw__mini">
          {metrics.map((c) => <li key={c.k}><b className="ui-num">{num(c.v)}</b> {t.m[c.k]}</li>)}
        </ul>
        <p className="rw__lead">{t.finalLead}</p>
        <button type="button" className="ui-btn ui-btn--primary" onClick={share} disabled={busy} data-testid="wrapped-png">
          <Icon name="image" className="ui-btn__icon" /> {t.share}
        </button>
        <p className="rw__status" role="status">{status}</p>
      </div>
    )
    const c = metrics[i - 1]
    const sub = c.sub ? (c.k === 'f' ? t.sub.x(num(c.sub.x)) : c.k === 'tw' ? t.sub.rak(num(c.sub.rakats), num(c.sub.counted)) : c.k === 'du' ? t.sub.da(num(c.sub.da)) : '') : ''
    return (
      <div className={`rw__card rw__card--${c.k}`} data-metric={c.k}>
        <span className="rw__icon" aria-hidden="true"><Icon name={ICONS[c.k]} size={34} /></span>
        <p className="rw__k">{t.m[c.k]}</p>
        <p className="rw__big ui-num" data-testid="wrapped-value">{num(c.v)}</p>
        <p className="rw__lead">{t.lead[c.k]}</p>
        {sub && <p className="rw__sub">{sub}</p>}
      </div>
    )
  })()
  const live = i === 0 ? t.introTitle : i === total - 1 ? t.finalTitle : `${t.m[metrics[i - 1].k]}: ${num(metrics[i - 1].v)}`

  return (
    <dialog ref={dlg} className="rw" aria-labelledby="rw-title" onKeyDown={onKey} data-testid="ramadan-wrapped" data-card={i} data-total={total}
      dir={rtl ? 'rtl' : undefined}>
      <div className="rw__frame" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <header className="rw__top">
          <h2 className="rw__title" id="rw-title" tabIndex={-1} ref={head}>{t.label(year)}</h2>
          <button type="button" className="rw__close" onClick={() => onClose?.()} aria-label={t.close} data-testid="wrapped-close">
            <Icon name="close" size={20} />
          </button>
        </header>
        <ol className="rw__dots" aria-label={t.swipe}>
          {Array.from({ length: total }, (_, k) => (
            <li key={k}>
              <button type="button" className={`rw__dot${k === i ? ' is-on' : ''}${k < i ? ' is-past' : ''}`} aria-label={t.dot(k + 1)}
                aria-current={k === i ? 'step' : undefined} onClick={() => go(k)} />
            </li>
          ))}
        </ol>
        <div className="rw__stage" key={i}>{card}</div>
        <p className="ui-sr-only" aria-live="polite" data-testid="wrapped-live">{`${t.pos(i + 1, total)} · ${live}`}</p>
        <footer className="rw__nav">
          <button type="button" className="ui-btn ui-btn--secondary" onClick={() => go(i - 1)} aria-disabled={i === 0 ? 'true' : undefined} data-testid="wrapped-prev">
            <Icon name="arrow" size={16} className="ui-btn__icon rw__flip" /> {t.prev}
          </button>
          <span className="rw__pos ui-num" aria-hidden="true">{t.pos(i + 1, total)}</span>
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => go(i + 1)} aria-disabled={i === total - 1 ? 'true' : undefined} data-testid="wrapped-next">
            {t.next} <Icon name="arrow" size={16} className="ui-btn__icon ui-flip-rtl" />
          </button>
        </footer>
      </div>
    </dialog>
  )
}
