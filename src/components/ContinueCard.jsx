// ═══════════════════════════════════════════════════════
// "Davam et" kartı — qaldığınız yerlər: Quran, Mushaf, hədis, ərəb kursu, dərs, hifz,
// həcc bələdçisi, uşaq kitabları, zikr. Hər element birbaşa həmin yerə aparır.
//
// Məlumat yalnız bu cihazın yaddaşındandır (utils/continueItems) — hesabsız da işləyir;
// hesabla daxil olanda sinxronlanmış məlumatı göstərir (bərpadan sonra özü yenilənir).
// Ana səhifədə tənbəl (DeferRender) — tərəqqi yoxdursa heç nə göstərmir.
// <ContinueCard />           — ana səhifə bölməsi
// <ContinueCard bare />      — yalnız siyahı (hesab səhifəsinin kartında)
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { isPlainClick } from './PageLink'
import Icon from './Icon'
import { buildContinueItems, continueHref } from '../utils/continueItems'
import '../styles/ContinueCard.css'

const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

export const CONT_TXT = {
  az: {
    ey: 'Davam et', title: 'Qaldığınız yerdən', sub: 'Son oxuduğunuz və öyrəndiyiniz yerlər — bir toxunuşla davam edin.',
    synced: 'Hesabınızla sinxronlanır', empty: 'Hələ tərəqqi yoxdur — Quran, hədis və ya dərs açın, qaldığınız yer burada görünəcək.',
    quran: 'Quran', surah: (n) => `Surə ${n}`, ayah: (n) => `ayə ${n}`, mushaf: 'Mushaf', page: (n) => `Səhifə ${n}`,
    hadith: 'Hədis', hadithN: (n) => `Hədis ${n}`,
    arabic: 'Ərəb dili kursu', arabicDone: (n) => `Tamamlanan dərs: ${n}`, arabicGo: 'Dərsə davam edin',
    lesson: 'Dərs', lessonRead: (n) => `Oxunan dərs: ${n}`,
    hifz: 'Hifz', hifzSub: (m, p) => `Əzbər: ${m} surə · davam edir: ${p}`,
    hajj: 'Həcc bələdçisi', umrah: 'Ümrə bələdçisi', step: (n) => `Addım ${n}`,
    story: 'Hekayə kitabları', dhikr: 'Zikr', dhikrCount: (n) => `Sayğac: ${n}`,
  },
  en: {
    ey: 'Continue', title: 'Pick up where you left off', sub: 'The places you last read and studied — continue with one tap.',
    synced: 'Synced with your account', empty: 'No progress yet — open the Quran, a hadith or a lesson and your place will show up here.',
    quran: 'Quran', surah: (n) => `Surah ${n}`, ayah: (n) => `verse ${n}`, mushaf: 'Mushaf', page: (n) => `Page ${n}`,
    hadith: 'Hadith', hadithN: (n) => `Hadith ${n}`,
    arabic: 'Arabic course', arabicDone: (n) => `Lessons completed: ${n}`, arabicGo: 'Continue the lesson',
    lesson: 'Lesson', lessonRead: (n) => `Lessons read: ${n}`,
    hifz: 'Hifz', hifzSub: (m, p) => `Memorized: ${m} surahs · in progress: ${p}`,
    hajj: 'Hajj guide', umrah: 'Umrah guide', step: (n) => `Step ${n}`,
    story: 'Story books', dhikr: 'Dhikr', dhikrCount: (n) => `Counter: ${n}`,
  },
  ru: {
    ey: 'Продолжить', title: 'С того же места', sub: 'Места, где вы читали и учились в последний раз, — продолжайте одним касанием.',
    synced: 'Синхронизируется с аккаунтом', empty: 'Пока нет прогресса — откройте Коран, хадис или урок, и ваше место появится здесь.',
    quran: 'Коран', surah: (n) => `Сура ${n}`, ayah: (n) => `аят ${n}`, mushaf: 'Мусхаф', page: (n) => `Страница ${n}`,
    hadith: 'Хадис', hadithN: (n) => `Хадис ${n}`,
    arabic: 'Курс арабского', arabicDone: (n) => `Пройдено уроков: ${n}`, arabicGo: 'Продолжить урок',
    lesson: 'Урок', lessonRead: (n) => `Прочитано уроков: ${n}`,
    hifz: 'Хифз', hifzSub: (m, p) => `Выучено сур: ${m} · в процессе: ${p}`,
    hajj: 'Руководство по хаджу', umrah: 'Руководство по умре', step: (n) => `Шаг ${n}`,
    story: 'Книги историй', dhikr: 'Зикр', dhikrCount: (n) => `Счётчик: ${n}`,
  },
  tr: {
    ey: 'Devam et', title: 'Kaldığınız yerden', sub: 'En son okuduğunuz ve öğrendiğiniz yerler — tek dokunuşla devam edin.',
    synced: 'Hesabınızla eşitleniyor', empty: 'Henüz ilerleme yok — Kur’an, hadis veya bir ders açın, kaldığınız yer burada görünecek.',
    quran: 'Kur’an', surah: (n) => `Sure ${n}`, ayah: (n) => `ayet ${n}`, mushaf: 'Mushaf', page: (n) => `Sayfa ${n}`,
    hadith: 'Hadis', hadithN: (n) => `Hadis ${n}`,
    arabic: 'Arapça kursu', arabicDone: (n) => `Tamamlanan ders: ${n}`, arabicGo: 'Derse devam edin',
    lesson: 'Ders', lessonRead: (n) => `Okunan ders: ${n}`,
    hifz: 'Hıfz', hifzSub: (m, p) => `Ezber: ${m} sure · devam eden: ${p}`,
    hajj: 'Hac rehberi', umrah: 'Umre rehberi', step: (n) => `Adım ${n}`,
    story: 'Hikâye kitapları', dhikr: 'Zikir', dhikrCount: (n) => `Sayaç: ${n}`,
  },
  ar: {
    ey: 'تابِع', title: 'من حيث توقفت', sub: 'آخر ما قرأته وتعلّمته — تابع بلمسة واحدة.',
    synced: 'متزامن مع حسابك', empty: 'لا يوجد تقدّم بعد — افتح القرآن أو حديثًا أو درسًا وسيظهر موضع توقفك هنا.',
    quran: 'القرآن', surah: (n) => `السورة ${n}`, ayah: (n) => `الآية ${n}`, mushaf: 'المصحف', page: (n) => `الصفحة ${n}`,
    hadith: 'الحديث', hadithN: (n) => `الحديث ${n}`,
    arabic: 'دورة العربية', arabicDone: (n) => `الدروس المكتملة: ${n}`, arabicGo: 'تابع الدرس',
    lesson: 'الدرس', lessonRead: (n) => `الدروس المقروءة: ${n}`,
    hifz: 'الحفظ', hifzSub: (m, p) => `محفوظ: ${m} سورة · قيد الحفظ: ${p}`,
    hajj: 'دليل الحج', umrah: 'دليل العمرة', step: (n) => `الخطوة ${n}`,
    story: 'كتب القصص', dhikr: 'الذكر', dhikrCount: (n) => `العدّاد: ${n}`,
  },
}

/** Element → { title, sub } (yazılar cari dildə) */
function describe(it, l, lang, books) {
  const v = it.vars
  switch (it.key) {
    case 'quran': return { title: `${l.quran} · ${v.name || l.surah(v.surah)}`, sub: v.ayah ? l.ayah(v.ayah) : l.surah(v.surah) }
    case 'mushaf': return { title: l.mushaf, sub: l.page(v.page) }
    case 'hadith': {
      if (v.book) {
        const b = books?.find((x) => x.key === v.book)
        const name = b ? (b.name?.[lang] || b.name?.en || '') : ''
        return { title: name ? `${l.hadith} · ${name}` : l.hadith, sub: l.hadithN(v.n) }
      }
      return { title: l.hadith, sub: l.hadithN(v.id) }
    }
    case 'arabic': return { title: l.arabic, sub: v.done ? l.arabicDone(v.done) : l.arabicGo }
    case 'lesson': return { title: l.lesson, sub: l.lessonRead(v.read) }
    case 'hifz': return { title: l.hifz, sub: l.hifzSub(v.memorized, v.inProgress) }
    case 'hajj': return { title: v.mode === 'umrah' ? l.umrah : l.hajj, sub: l.step(v.step) }
    case 'story': return { title: l.story, sub: l.page(v.page) }
    case 'dhikr': return { title: l.dhikr, sub: l.dhikrCount(v.count) }
    default: return { title: '', sub: '' }
  }
}

const isLinkedToAccount = () => {
  try { return Boolean(JSON.parse(safeStorage()?.getItem('muslim_cc_sync') || 'null')?.acct) } catch { return false }
}

export default function ContinueCard({ bare = false, max = 6 }) {
  const { lang, siteLang = lang } = useLang()
  const l = pickUi(CONT_TXT, lang, 'en')
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [linked, setLinked] = useState(false)
  const [books, setBooks] = useState(null)

  // Yaddaş yalnız brauzerdə; hesabdan bərpa / başqa cihazdan gələn məlumatdan sonra yenidən oxunur
  useEffect(() => {
    const read = () => { setItems(buildContinueItems(safeStorage())); setLinked(isLinkedToAccount()) }
    read()
    const onSync = (e) => { const t = e.detail?.status || e.detail?.type; if (t === 'restored' || t === 'pulled' || t === 'linked') read() }
    window.addEventListener('mcc-acctsync', onSync)
    window.addEventListener('qm-autosync', onSync)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener('mcc-acctsync', onSync)
      window.removeEventListener('qm-autosync', onSync)
      window.removeEventListener('storage', read)
    }
  }, [])
  // Hədis kitabxanasının kitab adları — yalnız lazım olanda (kiçik statik modul)
  const needBooks = Boolean(items?.some((it) => it.key === 'hadith' && it.vars.book))
  useEffect(() => {
    if (!needBooks || books) return undefined
    let alive = true
    import('../data/hadithLibrary').then((m) => { if (alive) setBooks(m.BOOKS) }).catch(() => {})
    return () => { alive = false }
  }, [needBooks, books])

  if (items === null) return null
  const shown = items.slice(0, max)
  if (!shown.length) return bare ? <p className="cc-empty">{l.empty}</p> : null

  const go = (href) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    window.scrollTo(0, 0)
  }

  const list = (
    <ul className="cc-grid" data-testid="continue-list">
      {shown.map((it) => {
        const { title, sub } = describe(it, l, lang, books)
        const href = continueHref(it, pathFor, siteLang)
        return (
          <li key={it.key}>
            <a className="ui-card cc-item" href={href} onClick={go(href)} data-kind={it.key}>
              <span className="ui-icon-tile cc-item__ic" aria-hidden="true"><Icon name={it.icon} /></span>
              <span className="cc-item__b">
                <span className="cc-item__t">{title}</span>
                <span className="cc-item__s ui-num">{sub}</span>
              </span>
              <Icon name="chevron" size={16} className="cc-item__chev ui-flip-rtl" />
            </a>
          </li>
        )
      })}
    </ul>
  )
  if (bare) return list

  return (
    <section className="ui-section ui-section--tight cc" aria-labelledby="cc-ttl" data-testid="continue-card">
      <div className="ui-container">
        <div className="cc-head">
          <div>
            <span className="ui-eyebrow">{l.ey}</span>
            <h2 id="cc-ttl" className="ui-title cc-title">{l.title}</h2>
            <p className="ui-lead cc-sub">{l.sub}</p>
          </div>
          {linked && <span className="ui-badge ui-badge--ok cc-synced"><Icon name="refresh" size={14} /> {l.synced}</span>}
        </div>
        {list}
      </div>
    </section>
  )
}
