// ═══════════════════════════════════════════════════════
// Ana səhifə — "Bu gün" bento paneli (dizayn v3.2)
//
//   [ Günün hədisi (Nəvəvinin 40 hədisi) — iri, 2×2 ] [ Günün ayəsi — 2×1 ]
//   [                                             ] [ Davam et ] [ Bu gün ]
//
// QAYDALAR:
//   • Heç bir yeni dini mətn YOXDUR — hədis, fayda və mənbə yalnız
//     src/data/nawawi40.js-dən (mənbə nömrələri orada yoxlanılıb), ayə
//     günün zolağının hovuzundan (DailyReminderBar → buildDailyItems).
//   • Seçim təqvim gününə bağlıdır (dayNumber) — o gün hamı eyni hədisi görür.
//   • nawawi40.js (~300 KB) yalnız bu panel render olunanda, dinamik yüklənir.
//   • "Davam et" — yalnız bu cihazın yaddaşı (localStorage, try/catch):
//     quran_bookmark, mushaf_last_page, learn_progress_v1, arabic_course_v1.
//     Açarlar səhifələrin özlərindədir — burada yalnız OXUNUR.
//   • Paylaş: Web Share API, yoxdursa keçid buferə kopyalanır.
// ═══════════════════════════════════════════════════════
import { lazy, Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import { buildDailyItems, dayNumber } from '../DailyReminderBar'
import { localizeSource } from '../../utils/sourceNames'
import { gregorianToHijri, fromLocalDate, formatHijri, formatGregorian, weekdayName, isApproximate } from '../../utils/hijri'
import '../../styles/HomeToday.css'
import MoonPhase from '../MoonPhase'
import AyahAudio from '../AyahAudio'
import { pickUi } from '../../utils/uiText'
import { buildContinueItems } from '../../utils/continueItems'
import { TODAY_CELLS } from '../../utils/homeLayout'

const ContinueCard = lazy(() => import('../ContinueCard'))

// Statik import() — Vite hər dil üçün ayrıca kiçik chunk yaradır
const NAWAWI_HOME = {
  az: () => import('virtual:nawawi-home/az'),
  en: () => import('virtual:nawawi-home/en'),
  ru: () => import('virtual:nawawi-home/ru'),
  tr: () => import('virtual:nawawi-home/tr'),
  ar: () => import('virtual:nawawi-home/ar'),
}

const LABELS = {
  az: {
    ey: 'Bu gün', title: 'Günün paneli', sub: 'Hər gün yenilənir — hədis, ayə və qaldığınız yer.',
    hadith: 'Günün hədisi', nawawi: 'Nəvəvinin 40 hədisi', benefit: 'Faydası',
    open: 'Tam oxu', copy: 'Kopyala', copied: 'Kopyalandı', share: 'Paylaş', shared: 'Keçid kopyalandı',
    ayah: 'Günün ayəsi', toQuran: 'Qurana keç', grade: 'Dərəcəsi haqqında qeyd var',
    cont: 'Qaldığınız yerdən', contEmpty: 'Oxumağa başlayın — qaldığınız yer burada görünəcək.',
    startQuran: 'Fatihə surəsindən başla', startLearn: 'İlk dərsi aç',
    today: 'Bu gün', approx: 'təxmini', friday: 'Cümə — fəziləti və hökmləri', toCal: 'Təqvim',
  },
  en: {
    ey: 'Today', title: 'Your day', sub: 'Updated every day — a hadith, a verse and where you left off.',
    hadith: 'Hadith of the day', nawawi: 'An-Nawawi’s Forty', benefit: 'Benefit',
    open: 'Read in full', copy: 'Copy', copied: 'Copied', share: 'Share', shared: 'Link copied',
    ayah: 'Verse of the day', toQuran: 'Open the Quran', grade: 'Has a note on its grading',
    cont: 'Continue where you left off', contEmpty: 'Start reading — your place will show up here.',
    startQuran: 'Start with Al-Fatiha', startLearn: 'Open the first lesson',
    today: 'Today', approx: 'approx.', friday: 'Friday — virtues and rulings', toCal: 'Calendar',
  },
  ru: {
    ey: 'Сегодня', title: 'Ваш день', sub: 'Обновляется каждый день — хадис, аят и место, где вы остановились.',
    hadith: 'Хадис дня', nawawi: '40 хадисов ан-Навави', benefit: 'Польза',
    open: 'Читать полностью', copy: 'Копировать', copied: 'Скопировано', share: 'Поделиться', shared: 'Ссылка скопирована',
    ayah: 'Аят дня', toQuran: 'Открыть Коран', grade: 'Есть примечание о достоверности',
    cont: 'Продолжить с того же места', contEmpty: 'Начните читать — ваше место появится здесь.',
    startQuran: 'Начать с суры аль-Фатиха', startLearn: 'Открыть первый урок',
    today: 'Сегодня', approx: 'прибл.', friday: 'Пятница — достоинства и нормы', toCal: 'Календарь',
  },
  ar: {
    ey: 'اليوم', title: 'يومك', sub: 'يتجدد كل يوم — حديث وآية وموضع توقفك.',
    hadith: 'حديث اليوم', nawawi: 'الأربعون النووية', benefit: 'من فوائده',
    open: 'اقرأ كاملًا', copy: 'نسخ', copied: 'تم النسخ', share: 'مشاركة', shared: 'تم نسخ الرابط',
    ayah: 'آية اليوم', toQuran: 'افتح القرآن', grade: 'عليه تنبيه في درجته',
    cont: 'تابع من حيث توقفت', contEmpty: 'ابدأ القراءة — سيظهر موضع توقفك هنا.',
    startQuran: 'ابدأ بسورة الفاتحة', startLearn: 'افتح الدرس الأول',
    today: 'اليوم', approx: 'تقريبي', friday: 'الجمعة — الفضل والأحكام', toCal: 'التقويم',
  },
  tr: {
    ey: 'Bugün', title: 'Günün paneli', sub: 'Her gün yenilenir — hadis, ayet ve kaldığınız yer.',
    hadith: 'Günün hadisi', nawawi: 'Nevevi’nin 40 hadisi', benefit: 'Faydası',
    open: 'Tamamını oku', copy: 'Kopyala', copied: 'Kopyalandı', share: 'Paylaş', shared: 'Bağlantı kopyalandı',
    ayah: 'Günün ayeti', toQuran: 'Kur’an’a git', grade: 'Derecesi hakkında not var',
    cont: 'Kaldığınız yerden', contEmpty: 'Okumaya başlayın — kaldığınız yer burada görünecek.',
    startQuran: 'Fatiha suresiyle başla', startLearn: 'İlk dersi aç',
    today: 'Bugün', approx: 'yaklaşık', friday: 'Cuma — fazileti ve hükümleri', toCal: 'Takvim',
  },
}

function useCopy() {
  const [done, setDone] = useState('')
  useEffect(() => {
    if (!done) return undefined
    const id = setTimeout(() => setDone(''), 2000)
    return () => clearTimeout(id)
  }, [done])
  const copy = async (text, tag) => {
    try { await navigator.clipboard.writeText(text); setDone(tag) } catch { /* bufer bağlıdır */ }
  }
  return [done, copy]
}

export default function HomeToday({ cells = TODAY_CELLS }) {
  const order = cells
  const { lang } = useLang()
  const l = pickUi(LABELS, lang, 'en')
  const isAr = lang === 'ar'
  const navigate = useNavigate()
  const day = useMemo(() => dayNumber(), [])
  const [nawawi, setNawawi] = useState(null)
  const [hasCont, setHasCont] = useState(null)   // null — hələ oxunmayıb (prerender)
  const [done, copy] = useCopy()

  // Nəvəvi hədisləri — dinamik, YALNIZ cari dil və kartın sahələri
  // (vite.config.js → "virtual:nawawi-home/<dil>", ~8 KB gzip; əvvəl bütöv kitab ~93 KB)
  useEffect(() => {
    let alive = true
    const load = NAWAWI_HOME[lang] || NAWAWI_HOME.en
    load().then(m => { if (alive) setNawawi(m.default) }).catch(() => {})
    return () => { alive = false }
  }, [lang])
  // Yaddaş yalnız brauzerdə (prerender HTML-i ilə uyğunsuzluq olmasın).
  // Siyahının özünü ContinueCard göstərir (hədis, hifz, kitablar… + hesab sinxronizasiyası).
  useEffect(() => {
    const read = () => { let st = null; try { st = globalThis.localStorage } catch { /* gizli rejim */ } setHasCont(buildContinueItems(st).length > 0) }
    read()
    window.addEventListener('mcc-acctsync', read)
    return () => window.removeEventListener('mcc-acctsync', read)
  }, [])

  const h = nawawi && nawawi.length ? nawawi[((day % nawawi.length) + nawawi.length) % nawawi.length] : null
  const ayah = useMemo(() => buildDailyItems(lang, day, null).find(i => i.type === 'ayah') || null, [lang, day])

  const g = fromLocalDate(new Date())
  const hijri = gregorianToHijri(g)
  const isFriday = new Date().getDay() === 5

  const go = (href) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    window.scrollTo(0, 0)
  }

  const hHref = h ? `${pathFor('nawawi40', lang)}#h-${h.n}` : pathFor('nawawi40', lang)
  const hText = h && !isAr ? (h.text || '') : ''
  const hSrc = h ? (h.src || '') : ''
  const hTitle = h ? (h.title || '') : ''
  const hBenefit = h ? (h.benefit || '') : ''

  const shareHadith = async () => {
    if (!h) return
    const url = `${window.location.origin}${hHref}`
    const text = `${hTitle}\n\n${isAr ? h.ar : hText}\n— ${hSrc}`
    try {
      if (navigator.share) { await navigator.share({ title: hTitle, text, url }); return }
    } catch (e) { if (e?.name === 'AbortError') return }
    copy(url, 'share')
  }
  const copyHadith = () => h && copy(`${hTitle}\n\n${h.ar}\n\n${hText ? hText + '\n' : ''}— ${hSrc}\n${window.location.origin}${hHref}`, 'copy')

  const quranHref = pathFor('quran', lang, 1)

  // H1: kartların sırası / görünməsi — istifadəçinin seçimi (utils/homeLayout → TODAY_CELLS)
  const CELLS = {
    hadith: (
      <>
          {/* ── Günün hədisi ── */}
          <article className="ui-card ui-card--elevated ui-bento__cell--wide ui-bento__cell--tall hp-td-hadith" aria-labelledby="hp-td-h-ttl">
            <div className="ui-pattern ui-pattern--fade hp-td-pattern" aria-hidden="true" />
            <div className="hp-td-kicker">
              <span className="ui-badge ui-badge--brand"><Icon name="hadith" /> {l.hadith}</span>
              <span className="hp-td-from">{l.nawawi}</span>
            </div>
            {h ? (
              <>
                <div className="ui-card__head hp-td-h-head">
                  <span className="ui-card__num" aria-hidden="true">{h.n}</span>
                  <h3 id="hp-td-h-ttl" className="ui-card__title">{hTitle}</h3>
                </div>
                <p className="ui-arabic ui-clamp hp-td-ar" style={{ '--lines': isAr ? 6 : 3 }} lang="ar" dir="rtl">{h.ar}</p>
                {hText && <p className="ui-clamp hp-td-tx" style={{ '--lines': 4 }}>{hText}</p>}
                <div className="ui-card__meta">
                  <span className="ui-badge ui-badge--outline">{hSrc}</span>
                  {h.grade && <span className="ui-badge ui-badge--note" title={h.grade?.[lang] || h.grade?.en}><Icon name="info" /> {l.grade}</span>}
                </div>
                {hBenefit && (
                  <div className="ui-callout ui-callout--accent hp-td-benefit">
                    <Icon name="bulb" />
                    <div>
                      <p className="ui-callout__title">{l.benefit}</p>
                      <p className="ui-clamp" style={{ '--lines': 3 }}>{hBenefit}</p>
                    </div>
                  </div>
                )}
                <div className="ui-card__actions hp-td-actions">
                  <a className="ui-btn ui-btn--primary ui-btn--sm" href={hHref} onClick={go(hHref)}>
                    {l.open} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
                  </a>
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={copyHadith}>
                    <Icon name={done === 'copy' ? 'check' : 'copy'} className="ui-btn__icon" /> {done === 'copy' ? l.copied : l.copy}
                  </button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={shareHadith}>
                    <Icon name={done === 'share' ? 'check' : 'share'} className="ui-btn__icon" /> {done === 'share' ? l.shared : l.share}
                  </button>
                  <span className="ui-sr-only" role="status" aria-live="polite">{done === 'copy' ? l.copied : done === 'share' ? l.shared : ''}</span>
                </div>
              </>
            ) : (
              <div aria-busy="true">
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '55%', height: '1.3em' }} />
                <span className="ui-skeleton" style={{ height: 88, marginTop: 14 }} />
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '92%' }} />
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '78%' }} />
                <span className="ui-skeleton" style={{ height: 64, marginTop: 14 }} />
              </div>
            )}
          </article>
      </>
    ),
    ayah: (
      <>
          {/* ── Günün ayəsi ── */}
          {ayah && (
            <article className="ui-card ui-card--inverse ui-bento__cell--wide hp-td-ayah" aria-label={l.ayah}>
              <div className="ui-pattern hp-td-ayah-pat" aria-hidden="true" />
              <span className="hp-td-ayah-ey">{l.ayah}</span>
              {/* vau3 §14: xəttatlıq — iri Amiri, qızılı çərçivə, "mürəkkəblə" yazılır */}
              <p className="ui-arabic ui-clamp hp-td-ayah-ar vx-callig" style={{ '--lines': 4 }} lang="ar" dir="rtl" data-anim="ink" data-anim-delay="150">{ayah.ar}</p>
              {ayah.text && <p className="ui-clamp hp-td-ayah-tx" style={{ '--lines': 3 }}>{ayah.text}</p>}
              <div className="hp-td-ayah-foot">
                {ayah.source && <span className="hp-td-ayah-src">— {localizeSource(ayah.source, lang)}</span>}
                <AyahAudio refText={ayah.source} className="vx-listen--inverse" />
                <a className="ui-btn ui-btn--inverse-ghost ui-btn--sm" href={pathFor('quran', lang)} onClick={go(pathFor('quran', lang))}>
                  {l.toQuran} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
                </a>
              </div>
            </article>
          )}
      </>
    ),
    cont: (
      <>
          {/* ── Davam et ── */}
          <article className="ui-card ui-card--elevated hp-td-cont" aria-labelledby="hp-td-c-ttl">
            <h3 id="hp-td-c-ttl" className="hp-td-cell-ttl"><Icon name="books" size={16} /> {l.cont}</h3>
            {hasCont === null ? (
              <span className="ui-skeleton" style={{ height: 96 }} aria-hidden="true" />
            ) : hasCont ? (
              <Suspense fallback={<span className="ui-skeleton" style={{ height: 96 }} aria-hidden="true" />}>
                <ContinueCard bare max={3} />
              </Suspense>
            ) : (
              <div className="hp-td-empty">
                <p>{l.contEmpty}</p>
                <a className="ui-link" href={quranHref} onClick={go(quranHref)}>{l.startQuran} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" /></a>
                <a className="ui-link" href={pathFor('learn', lang)} onClick={go(pathFor('learn', lang))}>{l.startLearn} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" /></a>
              </div>
            )}
          </article>
      </>
    ),
    date: (
      <>
          {/* ── Bu gün: hicri + miladi tarix ── */}
          <article className="ui-card ui-card--elevated hp-td-date" aria-labelledby="hp-td-d-ttl">
            <h3 id="hp-td-d-ttl" className="hp-td-cell-ttl"><Icon name="calendar" size={16} /> {l.today} · {weekdayName(g, lang)}</h3>
            {/* Bu gecənin ayı (astronomik faza) */}
            <span className="hp-td-moon"><MoonPhase lang={lang} size={46} /></span>
            <p className="hp-td-hijri">
              <span className="hp-td-hday">{hijri.day}</span>
              <span className="hp-td-hrest">{formatHijri(hijri, lang).replace(/^\d+\s*/, '')}{isApproximate(hijri.year) ? ` (${l.approx})` : ''}</span>
            </p>
            <p className="hp-td-greg">{formatGregorian(g, lang)}</p>
            {isFriday && <a className="ui-badge ui-badge--accent hp-td-fri" href={pathFor('jamaat', lang)} onClick={go(pathFor('jamaat', lang))}><Icon name="star" /> {l.friday}</a>}
            <a className="ui-link hp-td-cal" href={pathFor('calendar', lang)} onClick={go(pathFor('calendar', lang))}>{l.toCal} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" /></a>
          </article>
      </>
    ),
  }

  return (
    <section className="ui-section ui-section--tight hp-td" aria-labelledby="hp-td-ttl">
      <div className="ui-container">
        <div className="ui-section-head" data-reveal>
          <span className="ui-eyebrow">{l.ey}</span>
          <h2 id="hp-td-ttl" className="ui-title">{l.title}</h2>
          <p className="ui-lead">{l.sub}</p>
        </div>

        <div className="ui-bento hp-td-grid">
          {order.map((id) => CELLS[id] ? <Fragment key={id}>{CELLS[id]}</Fragment> : null)}
        </div>
      </div>
    </section>
  )
}
