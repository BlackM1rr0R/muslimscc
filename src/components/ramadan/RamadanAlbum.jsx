// ═══════════════════════════════════════════════════════
// RamadanAlbum — "Ramazan albomu" (/ramadan, /account): hər Ramazan bir kitab fəslidir
//
//   <RamadanAlbum lang="az" compact />
//
// • Məlumat: utils/ramadanAlbum (ramadan_album_v1) — açılanda snapshot yenilənir (idempotent).
// • Rəf: hər il bir kitab cildi (düymə); seçilən fəsil iki səhifəli kitab kimi açılır.
// • Əvvəlki fəsillə müqayisə (cədvəl), PNG kart (utils/statCard — yalnız həndəsə) — yalnız YÜKLƏMƏ,
//   "paylaş" yoxdur (sahibin qərarı, 2026-11-18: ibadət insanla Allah arasındadır).
// • Rəqəmlər yalnız istifadəçinin öz qeydlərindəndir; ölçülməyən göstərici "ölçülməyib" yazılır.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { makeFormat } from '../viz/format.js'
import { formatGregorian, parseGKey } from '../../utils/hijri'
import {
  snapshotAlbum, readAlbum, chapters, compareChapters, metricOf, ALBUM_EVENT, ALBUM_KEY, METRICS, localDay,
} from '../../utils/ramadanAlbum'
import { preopenWindow, saveBlob } from '../../utils/quoteCard'
import { wrappedCards } from '../../utils/ramadanWrapped'
import { readTaraweeh } from '../../utils/taraweeh'
import { readKhatm } from '../../utils/worldKhatm'
import '../../styles/RamadanAlbum.css'

// J4: fəsil "hekayə" kimi (tam ekran kartlar + PNG) — tənbəl chunk
const RamadanWrapped = lazy(() => import('./RamadanWrapped'))
const WRAP_OPEN = { az: 'Hekayə kimi bax', en: 'View as a story', ru: 'Смотреть как историю', ar: 'اعرضه كقصة', tr: 'Hikâye olarak gör' }

export const RA_TXT = {
  az: {
    ey: 'Ramazan albomu', title: 'Ramazan albomu', lead: 'Hər Ramazan öz fəsli kimi arxivlənir: oruclar, Quran, zikr, dualar — yalnız sizin qeydlərinizdən.',
    empty: 'Albom hələ boşdur. Ramazanda Hilal yolunda oruclarınızı qeyd edin, Quran oxuyun, dua yazın — fəsil özü yaranacaq.',
    shelf: 'Fəsillər', chapter: (y) => `Ramazan ${y}`, open: (y) => `Ramazan ${y} fəslini aç`,
    m: { f: 'Oruc', q: 'Oxunan ayə', k: 'Xətm', su: 'Surə', dh: 'Zikr', du: 'Yazılan dua', da: 'Qəbul olunan dua', ii: 'İftar dəvəti' },
    ofDays: (n) => `${n} gündən`, excused: (n) => `üzrlü: ${n}`, notMeasured: 'ölçülməyib', since: (d) => `${d} tarixindən bəri`,
    during: 'davam edir', fin: 'başa çatdı',
    compare: (y) => `Ramazan ${y} ilə müqayisə`, noPrev: 'Müqayisə üçün əvvəlki fəsil hələ yoxdur.',
    colNow: 'Bu fəsil', colPrev: 'Əvvəlki', colDelta: 'Fərq', same: 'eyni',
    dl: 'Özüm üçün yüklə', privateNote: 'İbadətiniz sizinlə Allah arasındadır — bu şəkil yalnız sizin üçündür.', saved: 'Kart hazırdır.', cardSub: 'mənim Ramazan fəslim',
    note: 'Rəqəmlər yalnız saytda etdiyiniz qeydlərdəndir. Oxunan ayələr Ramazanda sayta girdiyiniz günlərdən ölçülür; zikr gündəliyi son 60 günü saxlayır.',
    privacy: 'Albom bu cihazda və hesabınızın uçdan-uca şifrəli nüsxəsindədir.',
  },
  en: {
    ey: 'Ramadan album', title: 'Ramadan album', lead: 'Every Ramadan is archived as its own chapter: fasts, Quran, dhikr and duas — only from your own records.',
    empty: 'The album is empty for now. During Ramadan, log your fasts on the crescent path, read the Quran and write duas — the chapter will appear by itself.',
    shelf: 'Chapters', chapter: (y) => `Ramadan ${y}`, open: (y) => `Open the Ramadan ${y} chapter`,
    m: { f: 'Fasts', q: 'Verses read', k: 'Khatms', su: 'Surahs', dh: 'Dhikr', du: 'Duas written', da: 'Duas answered', ii: 'Iftar invitations' },
    ofDays: (n) => `of ${n} days`, excused: (n) => `excused: ${n}`, notMeasured: 'not measured', since: (d) => `since ${d}`,
    during: 'in progress', fin: 'complete',
    compare: (y) => `Compared with Ramadan ${y}`, noPrev: 'There is no earlier chapter to compare with yet.',
    colNow: 'This chapter', colPrev: 'Previous', colDelta: 'Change', same: 'same',
    dl: 'Download for myself', privateNote: 'Your worship is between you and Allah — this image is for you.', saved: 'Your card is ready.', cardSub: 'my Ramadan chapter',
    note: 'The numbers come only from what you log on the site. Verses read are measured from the days you visited during Ramadan; the dhikr log keeps the last 60 days.',
    privacy: 'The album stays on this device and in your account’s end-to-end encrypted copy.',
  },
  ru: {
    ey: 'Альбом Рамадана', title: 'Альбом Рамадана', lead: 'Каждый Рамадан сохраняется отдельной главой: посты, Коран, зикр, дуа — только из ваших записей.',
    empty: 'Альбом пока пуст. В Рамадан отмечайте посты на пути полумесяца, читайте Коран, записывайте дуа — глава появится сама.',
    shelf: 'Главы', chapter: (y) => `Рамадан ${y}`, open: (y) => `Открыть главу «Рамадан ${y}»`,
    m: { f: 'Посты', q: 'Прочитано аятов', k: 'Хатмы', su: 'Суры', dh: 'Зикр', du: 'Записано дуа', da: 'Принятые дуа', ii: 'Приглашения на ифтар' },
    ofDays: (n) => `из ${n} дн.`, excused: (n) => `освобождение: ${n}`, notMeasured: 'не измерено', since: (d) => `с ${d}`,
    during: 'идёт', fin: 'завершён',
    compare: (y) => `Сравнение с Рамаданом ${y}`, noPrev: 'Пока нет предыдущей главы для сравнения.',
    colNow: 'Эта глава', colPrev: 'Прошлая', colDelta: 'Разница', same: 'так же',
    dl: 'Скачать для себя', privateNote: 'Ваше поклонение — между вами и Аллахом. Это изображение только для вас.', saved: 'Карточка готова.', cardSub: 'моя глава Рамадана',
    note: 'Цифры — только из ваших записей на сайте. Прочитанные аяты считаются с дней, когда вы заходили в Рамадан; дневник зикра хранит последние 60 дней.',
    privacy: 'Альбом хранится на этом устройстве и в сквозно зашифрованной копии вашего аккаунта.',
  },
  ar: {
    ey: 'ألبوم رمضان', title: 'ألبوم رمضان', lead: 'يُحفظ كل رمضان فصلًا مستقلًا: الصيام والقرآن والذكر والدعاء — من سجلاتك وحدها.',
    empty: 'الألبوم فارغ حاليًا. في رمضان سجّل صيامك في طريق الهلال، واقرأ القرآن، واكتب أدعيتك — وسيظهر الفصل تلقائيًا.',
    shelf: 'الفصول', chapter: (y) => `رمضان ${y}`, open: (y) => `افتح فصل رمضان ${y}`,
    m: { f: 'الصيام', q: 'آيات مقروءة', k: 'ختمات', su: 'سور', dh: 'الذكر', du: 'أدعية مكتوبة', da: 'أدعية مستجابة', ii: 'دعوات إفطار' },
    ofDays: (n) => `من ${n} يومًا`, excused: (n) => `عذر: ${n}`, notMeasured: 'لم يُقَس', since: (d) => `منذ ${d}`,
    during: 'جارٍ', fin: 'مكتمل',
    compare: (y) => `مقارنة برمضان ${y}`, noPrev: 'لا يوجد فصل سابق للمقارنة بعد.',
    colNow: 'هذا الفصل', colPrev: 'السابق', colDelta: 'الفرق', same: 'كما هو',
    dl: 'نزّلها لنفسي', privateNote: 'عبادتك بينك وبين الله — هذه الصورة لك وحدك.', saved: 'بطاقتك جاهزة.', cardSub: 'فصلي من رمضان',
    note: 'الأرقام من سجلاتك في الموقع فقط. تُقاس الآيات المقروءة من الأيام التي زرت فيها الموقع في رمضان، ويحفظ سجل الذكر آخر 60 يومًا.',
    privacy: 'يبقى الألبوم على هذا الجهاز وفي نسخة حسابك المشفّرة من طرف إلى طرف.',
  },
  tr: {
    ey: 'Ramazan albümü', title: 'Ramazan albümü', lead: 'Her Ramazan kendi bölümü olarak arşivlenir: oruçlar, Kur’an, zikir, dualar — yalnızca sizin kayıtlarınızdan.',
    empty: 'Albüm şimdilik boş. Ramazan’da hilal yolunda oruçlarınızı işaretleyin, Kur’an okuyun, dua yazın — bölüm kendiliğinden oluşacak.',
    shelf: 'Bölümler', chapter: (y) => `Ramazan ${y} bölümü`, open: (y) => `Ramazan ${y} bölümünü aç`,
    m: { f: 'Oruç', q: 'Okunan ayet', k: 'Hatim', su: 'Sure', dh: 'Zikir', du: 'Yazılmış dua', da: 'Kabul edilen dua', ii: 'İftar daveti' },
    ofDays: (n) => `${n} günün`, excused: (n) => `mazeretli: ${n}`, notMeasured: 'ölçülmedi', since: (d) => `${d} tarihinden beri`,
    during: 'devam ediyor', fin: 'tamamlandı',
    compare: (y) => `Ramazan ${y} ile karşılaştırma`, noPrev: 'Karşılaştırma için önceki bölüm henüz yok.',
    colNow: 'Bu bölüm', colPrev: 'Önceki', colDelta: 'Fark', same: 'aynı',
    dl: 'Kendim için indir', privateNote: 'İbadetiniz sizinle Allah arasındadır — bu görsel yalnızca sizin için.', saved: 'Kartınız hazır.', cardSub: 'benim Ramazan bölümüm',
    note: 'Rakamlar yalnızca sitede tuttuğunuz kayıtlardan gelir. Okunan ayetler Ramazan’da siteye girdiğiniz günlerden ölçülür; zikir günlüğü son 60 günü saklar.',
    privacy: 'Albüm bu cihazda ve hesabınızın uçtan uca şifreli kopyasında durur.',
  },
}

const ICONS = { f: 'ramadan', q: 'quran', k: 'sparkle', su: 'mushaf', dh: 'dhikr', du: 'duajournal', da: 'check', ii: 'gift' }
const dayLabel = (d, lang) => { const g = parseGKey(d); return g ? formatGregorian(g, lang) : d }

function useAlbum() {
  const [album, setAlbum] = useState(() => (typeof window === 'undefined' ? { v: 1, y: {} } : readAlbum()))
  useEffect(() => {
    setAlbum(snapshotAlbum(undefined, localDay()))
    const re = () => setAlbum(readAlbum())
    const onStorage = (e) => { if (!e.key || e.key === ALBUM_KEY) re() }
    window.addEventListener(ALBUM_EVENT, re)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(ALBUM_EVENT, re); window.removeEventListener('storage', onStorage) }
  }, [])
  return album
}

export default function RamadanAlbum({ lang = 'az', compact = false }) {
  const t = pickUi(RA_TXT, lang, 'en')
  const fmt = useMemo(() => makeFormat(lang), [lang])
  const album = useAlbum()
  const list = useMemo(() => chapters(album), [album])
  const [sel, setSel] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const cur = list.find((x) => x.y === sel) || list[0] || null
  const cmp = useMemo(() => (cur?.prev ? compareChapters(cur.c, cur.prev.c) : []), [cur])
  // Hekayədə ən azı bir ölçülən göstərici olmalıdır
  const canWrap = useMemo(() => (cur ? wrappedCards(cur.c, { y: cur.y, taraweeh: readTaraweeh(), khatm: readKhatm() }).length > 0 : false), [cur])
  const [wrap, setWrap] = useState(false)
  const wrapBtn = useRef(null)
  const closeWrap = useMemo(() => () => { setWrap(false); setTimeout(() => wrapBtn.current?.focus(), 0) }, [])

  const valueText = (c, m) => {
    const v = metricOf(c, m)
    return v == null ? t.notMeasured : fmt.num(v, { maximumFractionDigits: 0 })
  }
  const days = cur ? Math.max(29, Math.round((Date.parse(`${cur.c.e}T12:00:00Z`) - Date.parse(`${cur.c.s}T12:00:00Z`)) / 86400000) + 1) : 30

  const card = async () => {
    if (!cur || busy) return
    const win = preopenWindow()
    setBusy(true)
    try {
      const { statCardBlob } = await import('../../utils/statCard')
      const stats = METRICS.map((m) => ({ m, v: metricOf(cur.c, m) })).filter((x) => x.v).map((x) => ({ v: fmt.num(x.v, { maximumFractionDigits: 0 }), l: t.m[x.m] }))
      const blob = await statCardBlob({
        eyebrow: t.ey, title: t.chapter(cur.y), sub: `${dayLabel(cur.c.s, lang)} — ${dayLabel(cur.c.e, lang)}`,
        stats, foot: t.cardSub, rtl: lang === 'ar', tone: 'night',
      })
      if (!blob) return
      saveBlob(blob, `ramadan-${cur.y}.png`, win)
      setStatus(t.saved)
    } finally { setBusy(false) }
  }

  return (
    <section className={`ui-card ra${compact ? ' ra--compact' : ''}`} {...(compact ? { 'aria-label': t.title } : { 'aria-labelledby': 'ra-title' })}
      data-testid="ramadan-album" data-chapters={list.length}>
      {!compact && <>
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 className="ra__title" id="ra-title">{t.title}</h2>
        <p className="ra__lead">{t.lead}</p>
      </>}

      {!cur ? <p className="ra__empty" data-testid="ra-empty">{t.empty}</p> : (
        <>
          {list.length > 1 && (
            <div className="ra__shelf" role="group" aria-label={t.shelf}>
              {list.map((x) => (
                <button key={x.y} type="button" className={`ra__spine${x.y === cur.y ? ' is-on' : ''}`} aria-pressed={x.y === cur.y}
                  aria-label={t.open(x.y)} onClick={() => { setSel(x.y); setStatus('') }}>
                  <span className="ra__spine-y ui-num">{x.y}</span>
                </button>
              ))}
            </div>
          )}

          <article className="ra__book" key={cur.y} data-testid="ra-chapter" data-year={cur.y}>
            <div className="ra__page ra__page--cover">
              <svg className="ra__moon" viewBox="0 0 64 64" aria-hidden="true">
                <path d="M40 8a24 24 0 1 0 16 40A20 20 0 1 1 40 8z" />
                <path className="ra__moon-star" d="M48 14l2 5 5 .4-4 3.3 1.3 5-4.3-2.7-4.3 2.7 1.3-5-4-3.3 5-.4z" />
              </svg>
              <h3 className="ra__ch">{t.chapter(cur.y)}</h3>
              <p className="ra__dates">{dayLabel(cur.c.s, lang)} — {dayLabel(cur.c.e, lang)}</p>
              <span className={`ui-badge ${cur.c.fin ? 'ui-badge--brand' : 'ui-badge--accent'}`}>{cur.c.fin ? t.fin : t.during}</span>
            </div>
            <div className="ra__page">
              <dl className="ra__stats">
                {METRICS.map((m) => (
                  <div key={m} className={`ra__stat${metricOf(cur.c, m) ? '' : ' is-zero'}`} data-metric={m}>
                    <dt><Icon name={ICONS[m]} size={16} /> {t.m[m]}</dt>
                    <dd className="ui-num">
                      {valueText(cur.c, m)}
                      {m === 'f' && <span className="ra__sub"> {t.ofDays(days)}{cur.c.x ? ` · ${t.excused(cur.c.x)}` : ''}</span>}
                      {m === 'q' && cur.c.b && cur.c.b > cur.c.s && <span className="ra__sub"> · {t.since(dayLabel(cur.c.b, lang))}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>

          {!compact && (cur.prev ? (
            <div className="ra__cmp">
              <table className="ra__table">
                <caption>{t.compare(cur.prev.y)}</caption>
                <thead><tr><th scope="col"><span className="ui-sr-only">{t.shelf}</span></th><th scope="col">{t.colNow}</th><th scope="col">{t.colPrev}</th><th scope="col">{t.colDelta}</th></tr></thead>
                <tbody>
                  {cmp.map((r) => (
                    <tr key={r.m}>
                      <th scope="row">{t.m[r.m]}</th>
                      <td className="ui-num">{fmt.num(r.cur, { maximumFractionDigits: 0 })}</td>
                      <td className="ui-num">{fmt.num(r.prev, { maximumFractionDigits: 0 })}</td>
                      <td className={`ui-num ra__d${r.delta > 0 ? ' is-up' : r.delta < 0 ? ' is-down' : ''}`}>
                        <bdi>{r.delta === 0 ? t.same : `${r.delta > 0 ? '+' : '−'}${fmt.num(Math.abs(r.delta), { maximumFractionDigits: 0 })}`}</bdi>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="ra__muted">{t.noPrev}</p>)}

          <div className="ra__actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={card} disabled={busy} data-testid="ra-card">
              <Icon name="download" className="ui-btn__icon" /> {t.dl}
            </button>
            {canWrap && (
              <button type="button" ref={wrapBtn} className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setWrap(true)} data-testid="ra-wrapped">
                <Icon name="play" className="ui-btn__icon ui-flip-rtl" /> {pickUi(WRAP_OPEN, lang, 'en')}
              </button>
            )}
            <span className="ra__status" role="status">{status}</span>
          </div>
          <p className="ra__muted ra__private" data-testid="ra-private-note">{t.privateNote}</p>
          {!compact && <p className="ra__note">{t.note}</p>}
        </>
      )}
      <p className="ra__privacy"><Icon name="lock" size={14} /> {t.privacy}</p>
      {wrap && cur && (
        <Suspense fallback={null}>
          <RamadanWrapped lang={lang} year={cur.y} chapter={cur.c} onClose={closeWrap} />
        </Suspense>
      )}
    </section>
  )
}
