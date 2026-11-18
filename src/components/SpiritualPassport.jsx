// ═══════════════════════════════════════════════════════
// Mənəvi səyahət kitabçası (vB) — /analytics (Nailiyyətlər rəfinin yanında) və /account
//
// Köhnə pasport səhifələri üslubunda: hər mərhələ — dairəvi mürəkkəb möhürü (SVG, həndəsi
// naxış və hərf; canlı varlıq təsviri yoxdur). Qazanılmamış möhür solğun konturdur — altında
// necə qazanılacağı və irəliləyiş. Hesab: utils/passport (yalnız mövcud yerli məlumat);
// qazanılma günü muslim_cc_passport_v1-də bir dəfə yazılır (sinxronlanır).
// Nişan sistemi ilə (utils/badges) üst-üstə düşən möhürlərdə nişanın adı və günü işlədilir.
// Hicrət yolunun uzunluğu və ərəb dili kursunun dərs sayı ayrıca (tənbəl) yüklənir.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { useLang } from '../contexts/LangContext'
import { syncPassport } from '../utils/passport'
import { BADGE_NAMES } from './badgeNames'
import '../styles/SpiritualPassport.css'

const T = {
  az: {
    ey: 'Mənəvi səyahət', title: 'Mənəvi səyahət kitabçası',
    lead: 'Yolunuzun mərhələləri — hər biri bir möhür. Möhürlər saytdakı öz qeydlərinizdən hesablanır və qazanıldığı gün yazılır.',
    count: (n, m) => `${m} möhürdən ${n}-i`, earned: 'Qazanılıb', locked: 'Hələ qazanılmayıb', how: 'Necə qazanmaq olar',
    fresh: (x) => `Yeni möhür: ${x}`, go: 'Başla', checking: 'yoxlanılır…',
    note: 'Bu cihazda saxlanılır; hesaba daxil olsanız — bütün cihazlarınızda. Möhür bir dəfə qazanıldısa, qalır.',
  },
  en: {
    ey: 'Spiritual journey', title: 'Spiritual journey passport',
    lead: 'The milestones of your journey, each one a stamp. Stamps are worked out from your own records on this site, and the day you earn one is written in.',
    count: (n, m) => `${n} of ${m} stamps`, earned: 'Earned', locked: 'Not earned yet', how: 'How to earn it',
    fresh: (x) => `New stamp: ${x}`, go: 'Start', checking: 'checking…',
    note: 'Stored on this device; when you are signed in, on all your devices. Once a stamp is earned, it stays.',
  },
  ru: {
    ey: 'Духовный путь', title: 'Паспорт духовного пути',
    lead: 'Вехи вашего пути, и каждая из них — штамп. Штампы рассчитываются по вашим собственным записям на сайте, а день получения записывается.',
    count: (n, m) => `${n} из ${m} штампов`, earned: 'Получен', locked: 'Ещё не получен', how: 'Как получить',
    fresh: (x) => `Новый штамп: ${x}`, go: 'Начать', checking: 'проверяется…',
    note: 'Хранится на этом устройстве; если вы вошли в аккаунт, то на всех ваших устройствах. Полученный штамп остаётся навсегда.',
  },
  ar: {
    ey: 'الرحلة الروحية', title: 'جواز الرحلة الروحية',
    lead: 'محطات رحلتك، ولكل محطة ختم. تُحسب الأختام من سجلاتك أنت على الموقع، ويُكتب يوم نيلها.',
    count: (n, m) => `${n} من ${m} أختام`, earned: 'نِلتَه', locked: 'لم يُنَل بعد', how: 'كيف تناله',
    fresh: (x) => `ختم جديد: ${x}`, go: 'ابدأ', checking: 'جارٍ التحقق…',
    note: 'يُحفظ على هذا الجهاز؛ وإن سجّلت الدخول فعلى كل أجهزتك. الختم الذي نِلتَه يبقى.',
  },
  tr: {
    ey: 'Manevi yolculuk', title: 'Manevi yolculuk pasaportu',
    lead: 'Yolculuğunuzun durakları, her biri bir mühür. Mühürler sitedeki kendi kayıtlarınızdan hesaplanır ve kazanıldığı gün yazılır.',
    count: (n, m) => `${m} mühürden ${n} tanesi`, earned: 'Kazanıldı', locked: 'Henüz kazanılmadı', how: 'Nasıl kazanılır',
    fresh: (x) => `Yeni mühür: ${x}`, go: 'Başla', checking: 'kontrol ediliyor…',
    note: 'Bu cihazda saklanır; hesabınıza giriş yaptıysanız tüm cihazlarınızda. Kazanılan mühür kalır.',
  },
}

// Ümmətin Canlı Xətmi möhürü (pages/KhatmPage, utils/worldKhatm)
const STAMP_NAME = { az: 'Ümmət xətmində iştirak', en: 'Part of the Ummah’s khatm', ru: 'Участие в хатме уммы', ar: 'المشاركة في ختمة الأمة', tr: 'Ümmet hatmine katılım' }
const STAMP_HOW = {
  az: 'Ümmətin Canlı Xətmində bir səhifə oxuyun: həmin xətm tamamlananda möhür verilir.',
  en: 'Read a page in the Ummah’s Live Khatm: the stamp is given when that khatm is complete.',
  ru: 'Прочитайте страницу в живом хатме уммы: штамп даётся, когда этот хатм завершится.',
  ar: 'اقرأ صفحة في ختمة الأمة الحيّة، ويُمنح الختم عند اكتمال تلك الختمة.',
  tr: 'Ümmetin Canlı Hatminde bir sayfa okuyun: o hatim tamamlanınca mühür verilir.',
}

const NAMES = {
  fajr_40: { az: '40 gün Sübh', en: '40 days of Fajr', ru: '40 дней фаджра', ar: 'أربعون يومًا من الفجر', tr: '40 gün sabah namazı' },
  names_99: { az: '99 ad', en: 'The 99 Names', ru: '99 имён', ar: 'الأسماء الحسنى', tr: '99 isim' },
  hijra: { az: 'Hicrət yolu', en: 'The Hijra road', ru: 'Путь хиджры', ar: 'طريق الهجرة', tr: 'Hicret yolu' },
  sahaba: { az: 'Səhabə albomu', en: 'The Sahaba album', ru: 'Альбом сподвижников', ar: 'ألبوم الصحابة', tr: 'Sahabe albümü' },
  arabic: { az: 'Ərəb dili kursu', en: 'The Arabic course', ru: 'Курс арабского', ar: 'دورة العربية', tr: 'Arapça kursu' },
  ummah_khatm: STAMP_NAME,
  hifz_surah: { az: 'İlk əzbər surə', en: 'First surah memorised', ru: 'Первая выученная сура', ar: 'أول سورة محفوظة', tr: 'İlk ezber sure' },
}
/** Möhürün adı (J6 — mənəvi zaman xətti də işlədir) */
export const stampName = (id, lang) => pickUi(NAMES[id] || BADGE_NAMES[id], lang, 'en') || id
const HOW = {
  khatm: { az: 'Quranı xətm edin: Xətm planı ilə və ya ömürlük mozaikada bütün ayələri oxuyaraq.', en: 'Complete the Quran, with the khatm plan or by reading every verse in the lifetime mosaic.', ru: 'Завершите чтение Корана: по плану хатма или прочитав все аяты в мозаике на всю жизнь.', ar: 'اختم القرآن، بخطة الختمة أو بقراءة كل الآيات في فسيفساء العمر.', tr: 'Kur’an’ı hatmedin: hatim planıyla ya da ömür boyu mozaikteki tüm ayetleri okuyarak.' },
  fajr_40: { az: 'Namaz izləyicisində Sübh namazını 40 gün ardıcıl vaxtında qılındı kimi qeyd edin.', en: 'Mark Fajr as prayed on time for 40 days in a row in the prayer tracker.', ru: 'Отмечайте фаджр совершённым вовремя 40 дней подряд в трекере намаза.', ar: 'سجّل صلاة الفجر في وقتها أربعين يومًا متتالية في متتبّع الصلاة.', tr: 'Namaz takipçisinde sabah namazını 40 gün art arda vaktinde kılındı olarak işaretleyin.' },
  names_99: { az: 'Allahın 99 adının hamısını əzbərləmə məşqində «əzbərlənib» kimi qeyd edin.', en: 'Mark all 99 Names of Allah as memorised in the memorisation practice.', ru: 'Отметьте все 99 имён Аллаха как выученные в тренировке запоминания.', ar: 'علِّم الأسماء الحسنى التسعة والتسعين كلها محفوظةً في تمرين الحفظ.', tr: 'Allah’ın 99 isminin hepsini ezber çalışmasında «ezberlendi» olarak işaretleyin.' },
  hijra: { az: 'Hicrət yolunu (Məkkə → Mədinə) addımlarınızla axıra qədər qət edin.', en: 'Walk the whole Hijra road (Makkah → Madinah) with your own steps.', ru: 'Пройдите весь путь хиджры (Мекка → Медина) своими шагами.', ar: 'اقطع طريق الهجرة كله (مكة ← المدينة) بخطواتك.', tr: 'Hicret yolunu (Mekke → Medine) adımlarınızla sonuna kadar yürüyün.' },
  sahaba: { az: 'Səhabə albomundakı bütün kartları toplayın: hər səhabənin profilini oxuyun.', en: 'Collect every card in the Sahaba album by reading each companion’s profile.', ru: 'Соберите все карточки альбома сподвижников, читая профиль каждого.', ar: 'اجمع كل بطاقات ألبوم الصحابة بقراءة صفحة كل صحابي.', tr: 'Sahabe albümündeki tüm kartları toplayın: her sahabinin profilini okuyun.' },
  arabic: { az: 'Ərəb dili kursunun bütün dərslərini ən azı 70% nəticə ilə bitirin.', en: 'Pass every lesson of the Arabic course with at least 70%.', ru: 'Пройдите все уроки курса арабского минимум на 70%.', ar: 'اجتز كل دروس دورة العربية بنسبة 70% على الأقل.', tr: 'Arapça kursunun bütün derslerini en az %70 ile geçin.' },
  hifz_surah: { az: 'Hifz bölməsində ilk surənizi «əzbərlənib» kimi qeyd edin.', en: 'Mark your first surah as memorised in the Hifz section.', ru: 'Отметьте свою первую суру как выученную в разделе хифза.', ar: 'علِّم أول سورة تحفظها «محفوظة» في قسم الحفظ.', tr: 'Hıfz bölümünde ilk surenizi «ezberlendi» olarak işaretleyin.' },
  dhikr_1000: { az: 'Zikr sayğacında cəmi 1000 zikrə çatın.', en: 'Reach 1,000 dhikr in total on the dhikr counter.', ru: 'Наберите в сумме 1000 зикров на счётчике.', ar: 'بلغ ألف ذكر في المجموع على عدّاد الذكر.', tr: 'Zikir sayacında toplam 1000 zikre ulaşın.' },
  ummah_khatm: STAMP_HOW,
  kahf_4: { az: 'Kəhf surəsini 4 fərqli cümə günü oxuyun.', en: 'Read Surah al-Kahf on 4 different Fridays.', ru: 'Прочитайте суру «аль-Кахф» в 4 разные пятницы.', ar: 'اقرأ سورة الكهف في أربع جُمَع مختلفة.', tr: 'Kehf suresini 4 farklı cuma günü okuyun.' },
}
const LINK = { khatm: 'quran', fajr_40: 'tracker', names_99: 'names', hijra: 'history', sahaba: 'sahaba', arabic: 'arabic', hifz_surah: 'hifz', dhikr_1000: 'dhikr', kahf_4: 'quran', ummah_khatm: 'khatm' }
const INK = { khatm: '#8c1d2c', fajr_40: '#9a3412', names_99: '#1e4f8f', hijra: '#7a5212', sahaba: '#1f6b4f', arabic: '#6a3d8f', hifz_surah: '#0f6b74', dhikr_1000: '#3f4a9a', kahf_4: '#7c2d5b', ummah_khatm: '#7a5a12' }
const TILT = { khatm: -6, fajr_40: 4, names_99: -3, hijra: 7, sahaba: -8, arabic: 3, hifz_surah: -5, dhikr_1000: 6, kahf_4: -2, ummah_khatm: 5 }
const DATE_LOC = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }
const fmtDate = (key, lang) => {
  const [y, m, d] = String(key).split('-').map(Number)
  try { return new Date(y, m - 1, d).toLocaleDateString(DATE_LOC[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return key }
}
const readBadges = () => { try { const v = JSON.parse(localStorage.getItem('qm_badges_v1') || '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} } }

// Hicrət yolunun uzunluğu (components/HijraWalk ilə eyni hesab) və ərəb kursunun irəliləyişi — tənbəl
let refsPromise = null
const loadRefs = () => (refsPromise ||= Promise.all([
  Promise.all([import('./media/SiraMaps'), import('../utils/hijraWalk')]).then(([m, h]) => h.routeLength(m.HIJRA_ROUTE)),
  Promise.all([import('./arabic/progress'), import('../data/arabicCourse')]).then(([p, c]) => ({ passed: p.passedCount(p.readProgress()), total: c.LESSONS.length })),
]).then(([hijraKm, ar]) => ({ hijraKm, arabicPassed: ar.passed, arabicTotal: ar.total })))

/** Möhürün mərkəzindəki həndəsi işarə (canlı varlıq yoxdur) */
function Emblem({ id }) {
  switch (id) {
    case 'khatm': return (<g><path d="M36 66 Q48 58 60 66 Q72 58 84 66 V46 Q72 38 60 46 Q48 38 36 46 Z" /><path d="M60 46 V66" /><path d="M44 74 L76 82 M76 74 L44 82" /></g>)
    case 'fajr_40': return (<g><path d="M32 70 H88" /><path d="M44 70 A16 16 0 0 1 76 70" /><path d="M60 46 V40 M47 52 L43 48 M73 52 L77 48 M40 62 H35 M80 62 H85" /><path d="M40 78 H80" strokeDasharray="2 4" /></g>)
    case 'names_99': return (<g><rect x="44" y="44" width="32" height="32" /><rect x="44" y="44" width="32" height="32" transform="rotate(45 60 60)" /><circle cx="60" cy="60" r="7" /></g>)
    case 'hijra': return (<g><path d="M36 78 Q50 70 54 60 T70 48 T84 40" strokeDasharray="3 4" /><circle cx="36" cy="78" r="3.5" fill="currentColor" /><circle cx="84" cy="40" r="3.5" fill="currentColor" /><path d="M48 44 A8 8 0 1 0 56 34 A6 6 0 1 1 48 44 Z" fill="currentColor" stroke="none" /></g>)
    case 'sahaba': return (<g fill="currentColor" stroke="none">{[[60, 48, 7], [46, 60, 5], [74, 60, 5], [52, 74, 4.5], [68, 74, 4.5]].map(([x, y, r]) => <path key={`${x}${y}`} d={starPath(x, y, r)} />)}</g>)
    case 'arabic': return (<text x="60" y="74" textAnchor="middle" fontSize="40" fontFamily="Amiri, 'Noto Naskh Arabic', serif" fill="currentColor" stroke="none">ع</text>)
    case 'hifz_surah': return (<g><path d="M44 82 V58 Q44 42 60 36 Q76 42 76 58 V82 Z" /><path d="M50 82 V60 Q50 48 60 44 Q70 48 70 60 V82" /><circle cx="60" cy="62" r="3" fill="currentColor" /></g>)
    case 'dhikr_1000': return (<g>{Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / 12; return <circle key={i} cx={60 + Math.cos(a) * 18} cy={56 + Math.sin(a) * 18} r="3" fill="currentColor" stroke="none" /> })}<path d="M60 74 V86 M56 86 H64" /></g>)
    case 'kahf_4': return (<g><path d="M34 80 Q36 44 60 40 Q84 44 86 80" /><path d="M46 80 Q48 58 60 56 Q72 58 74 80" /><path d="M30 80 H90" />{[50, 56.7, 63.3, 70].map(x => <circle key={x} cx={x} cy="70" r="1.8" fill="currentColor" stroke="none" />)}</g>)
    case 'ummah_khatm': return (<g><circle cx="60" cy="60" r="13" /><path d="M47 60 H73 M60 47 Q52 60 60 73 Q68 60 60 47" />{Array.from({ length: 24 }, (_, i) => { const a = (i * Math.PI) / 12; return <path key={i} d={`M${(60 + Math.cos(a) * 20).toFixed(1)} ${(60 + Math.sin(a) * 20).toFixed(1)} L${(60 + Math.cos(a) * 26).toFixed(1)} ${(60 + Math.sin(a) * 26).toFixed(1)}`} /> })}</g>)
    default: return null
  }
}
function starPath(x, y, r) {
  let d = ''
  for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 8, rr = i % 2 ? r * 0.5 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}` }
  return `${d}Z`
}

function Stamp({ id, earned, at, uid }) {
  const pid = `${uid}-${id}`
  return (
    <svg className="spp__svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs><path id={pid} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" /></defs>
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={earned ? undefined : '4 5'}>
        <circle cx="60" cy="60" r="56" strokeWidth="3" />
        <circle cx="60" cy="60" r="51" strokeWidth="1" />
        <circle cx="60" cy="60" r="35" strokeWidth="1.2" />
        <Emblem id={id} />
      </g>
      {earned && (
        <text className="spp__ring" fontSize="8.5" letterSpacing="1.5" fill="currentColor">
          <textPath href={`#${pid}`} startOffset="0">{`✦ MUSLIMS.CC ✦ ${at} ✦ MUSLIMS.CC ✦ ${at}`}</textPath>
        </text>
      )}
    </svg>
  )
}

export default function SpiritualPassport({ lang = 'az', bare = false, siteLang }) {
  const t = pickUi(T, lang, 'en')
  const ctx = useLang()
  const uid = useId().replace(/:/g, '')
  const [refs, setRefs] = useState({})
  const [res, setRes] = useState(() => syncPassport({ badges: readBadges() }))
  const [fresh, setFresh] = useState([])

  useEffect(() => {
    let alive = true
    loadRefs().then(r => {
      if (!alive) return
      setRefs(r)
      const next = syncPassport({ refs: r, badges: readBadges() })
      setRes(next)
      if (next.fresh.length) setFresh(f => [...f, ...next.fresh])
    }).catch(() => {})
    return () => { alive = false }
  }, [])
  // Ilk hesabdakı yeni möhürlər (refs gözləmədən)
  useEffect(() => { if (res.fresh.length) setFresh(f => [...new Set([...f, ...res.fresh])]) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const name = (id) => pickUi(NAMES[id] || BADGE_NAMES[id], lang, 'en')
  const earnedN = res.stamps.filter(s => s.earned).length
  const freshNames = useMemo(() => fresh.map(name).join(', '), [fresh, lang]) // eslint-disable-line react-hooks/exhaustive-deps
  const pl = siteLang || ctx?.siteLang || lang
  const loaded = Object.keys(refs).length > 0
  const Hn = bare ? 'h4' : 'h3'

  return (
    <section className={`spp${bare ? ' spp--bare' : ''}`} data-testid="passport" data-earned={earnedN} aria-labelledby={`${uid}-t`}>
      <header className="spp__cover">
        <svg className="spp__emblem" viewBox="0 0 64 64" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="16" y="16" width="32" height="32" /><rect x="16" y="16" width="32" height="32" transform="rotate(45 32 32)" /><circle cx="32" cy="32" r="9" /><circle cx="32" cy="32" r="27" /></g>
        </svg>
        <div className="spp__cover-text">
          <span className="spp__ey">{t.ey}</span>
          {bare ? <h3 className="spp__title" id={`${uid}-t`}>{t.title}</h3> : <h2 className="spp__title" id={`${uid}-t`}>{t.title}</h2>}
          <span className="spp__count ui-num" data-testid="passport-count">{t.count(earnedN, res.stamps.length)}</span>
        </div>
      </header>
      <p className="spp__lead">{t.lead}</p>
      <ol className="spp__pages" role="list">
        {res.stamps.map(s => {
          const nm = name(s.id)
          const isFresh = fresh.includes(s.id)
          const pending = !s.earned && !s.ready && !loaded
          return (
            <li key={s.id} className={`spp__slot${s.earned ? ' is-earned' : ' is-locked'}`} data-stamp={s.id} data-earned={s.earned ? '' : undefined}
              data-fresh={isFresh ? '' : undefined} style={{ '--ink': INK[s.id], '--tilt': `${TILT[s.id]}deg` }}>
              <div className="spp__stamp"><Stamp id={s.id} earned={s.earned} at={s.at || ''} uid={uid} /></div>
              <div className="spp__cap">
                <Hn className="spp__name">{nm}</Hn>
                {s.earned ? (
                  <p className="spp__date"><span className="ui-sr-only">{t.earned}: </span><time dateTime={s.at}>{fmtDate(s.at, lang)}</time></p>
                ) : (
                  <>
                    <p className="spp__how"><span className="ui-sr-only">{t.locked}. {t.how}: </span>{pickUi(HOW[s.id], lang, 'en')}</p>
                    {pending ? <p className="spp__prog-t">{t.checking}</p> : s.ready && s.goal > 1 && (
                      <div className="spp__prog">
                        <progress max={s.goal} value={s.value} aria-label={nm} />
                        <span className="ui-num" dir="ltr">{Math.floor(s.value)} / {Math.round(s.goal)}</span>
                      </div>
                    )}
                    <a className="spp__go" href={pathFor(LINK[s.id], pl)} aria-label={`${t.go}: ${nm}`}>{t.go}<Icon name="chevron" size={13} className="ui-flip-rtl" /></a>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="ui-sr-only" role="status" aria-live="polite">{fresh.length ? t.fresh(freshNames) : ''}</p>
      <p className="spp__note"><Icon name="shield" size={14} /> {t.note}</p>
    </section>
  )
}
