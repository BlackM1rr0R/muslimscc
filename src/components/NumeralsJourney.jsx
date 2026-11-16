// ═══════════════════════════════════════════════════════
// NumeralsJourney — "Rəqəmlərin səyahəti" (/history, elm bölməsi)
//
// • Xəritədə 4 dayanacaq: Hindistan (onluq mövqe sistemi, Brahmaqupta 628 — sıfır ədəd kimi),
//   Bağdad (Xarəzmi, təq. 825 — "Hind hesabı"; adı Latınca Algoritmi → "alqoritm"),
//   Məğrib və Əndəlus (qubar rəqəmləri — bugünkü "ərəb rəqəmləri"nin əcdadı),
//   Avropa (Fibonaççi, Liber Abaci, 1202 — Bicayədə öyrəndiyi hesabı tanıtdı).
//   Hər dayanacaqda 0–9 həmin yerin yazılışı ilə; "0" xətt boyunca səyahət edir.
// • Çevirici: ədəd → qərbi ərəb, şərqi ərəb, fars, devanaqari, Roma (sıfırı yoxdur).
// • "Sıfır" sözü: ərəbcə صِفْر "boş" → Latınca zephirum → zero; "şifrə" də buradan.
// Xəritə: d3-geo + world-atlas (IslamicScience ilə eyni). Stillər: styles/NumeralsJourney.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { geoEqualEarth, geoPath, geoInterpolate } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import { toDigits, toRoman, normalizeInput } from '../utils/numerals'
import '../styles/NumeralsJourney.css'

const W = 640, H = 300
const STOPS = [
  { id: 'india', ll: [78, 22], sys: 'deva' },
  { id: 'baghdad', ll: [44.4, 33.3], sys: 'arab' },
  { id: 'maghreb', ll: [-4.8, 37.9], sys: 'western' },
  { id: 'europe', ll: [10.4, 43.7], sys: 'western' },
]

const T = {
  az: { ey: 'Elm tarixi', title: 'Rəqəmlərin səyahəti', lead: 'Hər gün yazdığımız 0–9 rəqəmləri Hindistandan çıxıb Bağdad və Əndəlus yolu ilə dünyaya yayılıb. Dayanacaqları bir-bir açın.',
    stops: {
      india: { t: 'Hindistan · VI–VII əsr', d: 'Onluq mövqe sistemi yarandı: rəqəmin dəyəri yerindən asılıdır. Brahmaqupta 628-ci ildə sıfırla hesablama qaydalarını yazdı — sıfır ilk dəfə ədəd kimi işləndi.' },
      baghdad: { t: 'Bağdad · təq. 825', d: 'Məhəmməd ibn Musa əl-Xarəzmi "Hind hesabı" haqqında kitab yazdı: toplama, çıxma, sıfırla yazılış. Kitab Latın dilinə "Algoritmi…" adı ilə keçdi — "alqoritm" sözü buradandır.' },
      maghreb: { t: 'Məğrib və Əndəlus · X–XII əsr', d: 'Qərbi İslam dünyasında rəqəmlər "qubar" (toz) adlı yazılışda işləndi — toz lövhədə hesablanırdı. Bu gün "ərəb rəqəmləri" dediyimiz 0–9 formaları bu yazılışdan gəlir.' },
      europe: { t: 'Avropa · 1202', d: 'Fibonaççi hesabı Bicayədə (indiki Əlcəzair) müsəlman müəllimlərdən öyrəndi və "Liber Abaci" kitabı ilə Avropaya tanıtdı. Roma rəqəmləri tədricən yerini bu rəqəmlərə verdi.' }, // lang-ok[Liber,Abaci]: kitabın adı
    },
    sifrT: 'Sıfır sözü haradandır?', sifr: 'Ərəbcə صِفْر (sifr) — "boş". Latınca zephirum, italyanca zero oldu; "şifrə" sözü də eyni kökdəndir.',
    conv: 'Ədədinizi yazın', convPh: 'Məs.: 2026', sys: { western: 'Qərbi ərəb (bugünkü)', arab: 'Şərqi ərəb', arabext: 'Fars / urdu', deva: 'Hind (devanaqari)', roman: 'Roma' }, noRoman: 'yoxdur — Roma rəqəmlərində sıfır və 3999-dan böyük ədəd yazılmır',
    play: 'Səyahəti oynat', prev: 'Əvvəlki', next: 'Növbəti', src: 'Mənbələr: G. Ifrah, «Rəqəmlərin ümumi tarixi»; Britannica — Hindu-Arabic numerals.' }, // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero,Ifrah,Britannica,Hindu,Arabic,numerals]: əsər adları və sözlərin mənşəyi
  en: { ey: 'History of science', title: 'The journey of numerals', lead: 'The digits 0–9 we write every day set out from India and reached the world through Baghdad and al-Andalus. Open the stops one by one.',
    stops: {
      india: { t: 'India · 6th–7th c.', d: 'The decimal place-value system arose: a digit’s value depends on its position. In 628 Brahmagupta wrote rules for calculating with zero — zero used as a number for the first time.' },
      baghdad: { t: 'Baghdad · c. 825', d: 'Muḥammad ibn Mūsā al-Khwārizmī wrote a book on “Indian reckoning”: addition, subtraction, writing with zero. Its Latin version began “Algoritmi…” — the origin of the word “algorithm”.' },
      maghreb: { t: 'Maghreb & al-Andalus · 10th–12th c.', d: 'In the western Islamic world the digits were written in the “ghubār” (dust) style — sums were done on a dust board. The 0–9 shapes we call “Arabic numerals” come from it.' },
      europe: { t: 'Europe · 1202', d: 'Fibonacci learned this arithmetic from Muslim teachers in Bejaia (today’s Algeria) and introduced it to Europe in his Liber Abaci. Roman numerals gradually gave way.' },
    },
    sifrT: 'Where does “zero” come from?', sifr: 'Arabic صِفْر (ṣifr) — “empty”. It became Latin zephirum and Italian zero; “cipher” comes from the same root.',
    conv: 'Type your number', convPh: 'E.g. 2026', sys: { western: 'Western Arabic (today)', arab: 'Eastern Arabic', arabext: 'Persian / Urdu', deva: 'Indian (Devanagari)', roman: 'Roman' }, noRoman: 'none — Roman numerals have no zero and stop at 3999',
    play: 'Play the journey', prev: 'Previous', next: 'Next', src: 'Sources: G. Ifrah, The Universal History of Numbers; Britannica — Hindu-Arabic numerals.' },
  ru: { ey: 'История науки', title: 'Путешествие цифр', lead: 'Цифры 0–9, которые мы пишем каждый день, вышли из Индии и разошлись по миру через Багдад и аль-Андалус. Откройте остановки по очереди.',
    stops: {
      india: { t: 'Индия · VI–VII вв.', d: 'Возникла десятичная позиционная система: значение цифры зависит от её места. В 628 году Брахмагупта записал правила вычислений с нулём — ноль впервые стал числом.' },
      baghdad: { t: 'Багдад · ок. 825', d: 'Мухаммад ибн Муса аль-Хорезми написал книгу об «индийском счёте»: сложение, вычитание, запись с нулём. Латинский перевод начинался словами «Algoritmi…» — отсюда слово «алгоритм».' }, // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero]: kitab adı və etimologiya
      maghreb: { t: 'Магриб и аль-Андалус · X–XII вв.', d: 'На западе исламского мира цифры писали в стиле «губар» (пыль) — считали на доске с пылью. Формы 0–9, которые мы называем «арабскими цифрами», происходят оттуда.' },
      europe: { t: 'Европа · 1202', d: 'Фибоначчи изучил этот счёт у мусульманских учителей в Беджае (нынешний Алжир) и познакомил с ним Европу в книге «Liber Abaci». Римские цифры постепенно уступили место.' }, // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero]: kitab adı və etimologiya
    },
    sifrT: 'Откуда слово «ноль» и «цифра»?', sifr: 'Арабское صِفْر (сифр) — «пустой». Отсюда латинское zephirum и итальянское zero; слово «цифра» — того же корня.', // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero]: kitab adı və etimologiya
    conv: 'Введите число', convPh: 'Напр.: 2026', sys: { western: 'Западноарабские (сегодня)', arab: 'Восточноарабские', arabext: 'Персидские / урду', deva: 'Индийские (деванагари)', roman: 'Римские' }, noRoman: 'нет — в римских цифрах нет нуля, и они заканчиваются на 3999',
    play: 'Запустить путешествие', prev: 'Назад', next: 'Дальше', src: 'Источники: Ж. Ифра, «Всеобщая история цифр»; Britannica — Hindu-Arabic numerals.' }, // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero,Britannica,Hindu,Arabic,numerals]: названия трудов и этимология
  tr: { ey: 'Bilim tarihi', title: 'Rakamların yolculuğu', lead: 'Her gün yazdığımız 0–9 rakamları Hindistan’dan çıkıp Bağdat ve Endülüs yoluyla dünyaya yayıldı. Durakları tek tek açın.',
    stops: {
      india: { t: 'Hindistan · VI–VII. yy', d: 'Onluk basamak sistemi doğdu: rakamın değeri yerine bağlıdır. Brahmagupta 628’de sıfırla hesap kurallarını yazdı — sıfır ilk kez sayı olarak kullanıldı.' },
      baghdad: { t: 'Bağdat · y. 825', d: 'Muhammed bin Musa el-Harezmî “Hint hesabı” üzerine bir kitap yazdı: toplama, çıkarma, sıfırla yazım. Latince çevirisi “Algoritmi…” diye başlıyordu — “algoritma” kelimesi buradan gelir.' },
      maghreb: { t: 'Mağrip ve Endülüs · X–XII. yy', d: 'İslam dünyasının batısında rakamlar “gubar” (toz) yazısıyla kullanıldı — hesap tozlu tahtada yapılırdı. “Arap rakamları” dediğimiz 0–9 biçimleri buradan gelir.' },
      europe: { t: 'Avrupa · 1202', d: 'Fibonacci bu hesabı Bicaye’de (bugünkü Cezayir) Müslüman hocalardan öğrendi ve “Liber Abaci” ile Avrupa’ya tanıttı. Roma rakamları zamanla yerini bıraktı.' },
    },
    sifrT: '“Sıfır” kelimesi nereden gelir?', sifr: 'Arapça صِفْر (sıfr) — “boş”. Latincede zephirum, İtalyancada zero oldu; “şifre” kelimesi de aynı köktendir.',
    conv: 'Sayınızı yazın', convPh: 'Örn.: 2026', sys: { western: 'Batı Arap (bugünkü)', arab: 'Doğu Arap', arabext: 'Farsça / Urduca', deva: 'Hint (Devanagari)', roman: 'Roma' }, noRoman: 'yok — Roma rakamlarında sıfır yoktur ve 3999’dan büyük sayı yazılmaz',
    play: 'Yolculuğu oynat', prev: 'Önceki', next: 'Sonraki', src: 'Kaynaklar: G. Ifrah, «Rakamların Evrensel Tarihi»; Britannica — Hindu-Arabic numerals.' },
  ar: { ey: 'تاريخ العلوم', title: 'رحلة الأرقام', lead: 'الأرقام ٠–٩ التي نكتبها كل يوم خرجت من الهند وانتشرت في العالم عبر بغداد والأندلس. افتح المحطات واحدة واحدة.',
    stops: {
      india: { t: 'الهند · القرنان السادس والسابع', d: 'نشأ النظام العشري الموضعي: قيمة الرقم بحسب موضعه. وكتب براهماغوبتا سنة ٦٢٨ قواعد الحساب بالصفر — فاستُعمل الصفر عددًا لأول مرة.' },
      baghdad: { t: 'بغداد · نحو ٨٢٥', d: 'ألّف محمد بن موسى الخوارزمي كتابًا في «حساب الهند»: الجمع والطرح والكتابة بالصفر. وبدأت ترجمته اللاتينية بكلمة «Algoritmi…» — ومنها كلمة «الخوارزمية».' }, // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero,cipher]: اسم الكتاب وأصل الكلمة
      maghreb: { t: 'المغرب والأندلس · القرون ١٠–١٢', d: 'كُتبت الأرقام في غرب العالم الإسلامي بالقلم «الغباري» — إذ كان الحساب على لوح من الغبار. ومنه جاءت أشكال ٠–٩ التي تُسمّى اليوم «الأرقام العربية».' },
      europe: { t: 'أوروبا · ١٢٠٢', d: 'تعلّم فيبوناتشي هذا الحساب من معلمين مسلمين في بجاية (الجزائر اليوم) وعرّف به أوروبا في كتابه «Liber Abaci»، فتراجعت الأرقام الرومانية شيئًا فشيئًا.' }, // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero,cipher]: اسم الكتاب وأصل الكلمة
    },
    sifrT: 'من أين جاءت كلمة zero؟', sifr: 'من العربية «صِفْر» أي الخالي، فصارت في اللاتينية zephirum وفي الإيطالية zero، ومنها أيضًا cipher.', // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero,cipher]: اسم الكتاب وأصل الكلمة
    conv: 'اكتب عددك', convPh: 'مثال: ٢٠٢٦', sys: { western: 'الأرقام الغربية (اليوم)', arab: 'الأرقام المشرقية', arabext: 'الفارسية / الأردية', deva: 'الهندية (ديفاناغاري)', roman: 'الرومانية' }, noRoman: 'لا يوجد — ليس في الأرقام الرومانية صفر، ولا تتجاوز ٣٩٩٩',
    play: 'شغّل الرحلة', prev: 'السابق', next: 'التالي', src: 'المصادر: ج. إفراه، «التاريخ العالمي للأرقام»؛ بريتانيكا.' }, // lang-ok[Algoritmi,Liber,Abaci,zephirum,zero,cipher]: أسماء الكتب وأصل الكلمات
}

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then((r) => r.json()).then((topo) => feature(topo, topo.objects.land)))

export default function NumeralsJourney() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [land, setLand] = useState(null)
  const [step, setStep] = useState(0)
  const [prog, setProg] = useState(1)   // 0…1 — "0" xətt boyunca hərəkət (son seqment)
  const [num, setNum] = useState('2026')

  useEffect(() => { let live = true; loadLand().then((l) => { if (live) setLand(l) }).catch(() => {}); return () => { live = false } }, [])

  const proj = useMemo(() => geoEqualEarth().rotate([-35, 0]).fitExtent([[12, 12], [W - 12, H - 12]],
    { type: 'MultiPoint', coordinates: [[-12, 18], [90, 18], [-12, 52], [90, 52]] }), [])
  const path = useMemo(() => geoPath(proj), [proj])
  const pts = STOPS.map((s) => proj(s.ll))

  // Seqmentin animasiyası: əvvəlki dayanacaqdan indikinə
  useEffect(() => {
    if (reduced || step === 0) { setProg(1); return undefined }
    let raf = 0
    const t0 = performance.now()
    const tick = (now) => { const p = Math.min(1, (now - t0) / 1100); setProg(p); if (p < 1) raf = requestAnimationFrame(tick) }
    setProg(0); raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step, reduced])

  const traveller = useMemo(() => {
    if (step === 0) return pts[0]
    const ip = geoInterpolate(STOPS[step - 1].ll, STOPS[step].ll)
    return proj(ip(prog))
  }, [step, prog, pts, proj])

  const routeD = useMemo(() => {
    const coords = []
    for (let i = 1; i <= step; i++) {
      const ip = geoInterpolate(STOPS[i - 1].ll, STOPS[i].ll)
      const end = i === step ? prog : 1
      for (let k = 0; k <= 24; k++) coords.push(ip((k / 24) * end))
    }
    return coords.length ? path({ type: 'LineString', coordinates: coords }) : ''
  }, [step, prog, path])

  const play = () => {
    if (reduced) { setStep(STOPS.length - 1); return }
    setStep(0)
    STOPS.slice(1).forEach((_, i) => setTimeout(() => setStep(i + 1), 1500 * (i + 1)))
  }

  const s = STOPS[step]
  const n = normalizeInput(num)
  const roman = n ? toRoman(Number(n)) : null

  return (
    <section className="ui-card nj" aria-labelledby="nj-title" data-testid="numerals-journey" data-step={step}>
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="nj-title" className="nj__title">{t.title}</h2>
      <p className="nj__lead">{t.lead}</p>

      <div className="nj__map">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.title}>
          {land && <path d={path(land)} className="nj__land" />}
          <path d={path({ type: 'LineString', coordinates: STOPS.map((x) => x.ll) })} className="nj__ghost" />
          {routeD && <path d={routeD} className="nj__route" />}
          {STOPS.map((x, i) => (
            <g key={x.id} transform={`translate(${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)})`} className={`nj__stop${i <= step ? ' is-on' : ''}${i === step ? ' is-cur' : ''}`}
              onClick={() => setStep(i)}>
              <circle r="12" fill="transparent" />
              <circle r={i === step ? 7 : 5} />
            </g>
          ))}
          <g transform={`translate(${traveller[0].toFixed(1)} ${(traveller[1] - 18).toFixed(1)})`} className="nj__zero" aria-hidden="true">
            <circle r="13" /><text textAnchor="middle" dy="5">{toDigits('0', s.sys)}</text>
          </g>
        </svg>
      </div>

      <div className="nj__nav">
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setStep((i) => Math.max(0, i - 1))} disabled={step === 0} aria-label={t.prev}><Icon name="chevronLeft" className="ui-flip-rtl" /></button>
        <ol className="nj__steps">
          {STOPS.map((x, i) => (
            <li key={x.id}><button type="button" className="ui-chip" aria-pressed={i === step} onClick={() => setStep(i)}>{i + 1}</button></li>
          ))}
        </ol>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setStep((i) => Math.min(STOPS.length - 1, i + 1))} disabled={step === STOPS.length - 1} aria-label={t.next} data-testid="nj-next"><Icon name="chevron" className="ui-flip-rtl" /></button>
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={play}><Icon name="play" className="ui-btn__icon" /> {t.play}</button>
      </div>

      <div className="nj__card" aria-live="polite">
        <h3 className="nj__h">{t.stops[s.id].t}</h3>
        <p className="nj__digits" dir="ltr" lang={s.sys === 'arab' ? 'ar' : s.sys === 'deva' ? 'hi' : undefined}>
          {toDigits('0123456789', s.sys).split('').map((d, i) => <span key={i} style={{ '--i': i }}>{d}</span>)}
        </p>
        <p className="nj__p">{t.stops[s.id].d}</p>
      </div>

      <div className="nj__sifr">
        <span className="nj__sifr-ar" lang="ar" dir="rtl">صِفْر</span>
        <div><b>{t.sifrT}</b><p>{t.sifr}</p></div>
      </div>

      <div className="nj__conv">
        <label className="ui-field" htmlFor="nj-num">
          <span className="ui-field__label">{t.conv}</span>
          <input id="nj-num" className="ui-input" inputMode="numeric" value={num} placeholder={t.convPh} maxLength={14}
            onChange={(e) => setNum(e.target.value)} data-testid="nj-input" />
        </label>
        <dl className="nj__out">
          {['western', 'arab', 'arabext', 'deva'].map((k) => (
            <div key={k} className="nj__row"><dt>{t.sys[k]}</dt><dd dir="ltr" data-sys={k}>{n ? toDigits(n, k) : '—'}</dd></div>
          ))}
          <div className="nj__row"><dt>{t.sys.roman}</dt><dd dir="ltr" data-sys="roman">{roman || <small>{n ? t.noRoman : '—'}</small>}</dd></div>
        </dl>
      </div>
      <p className="nj__src">{t.src}</p>
    </section>
  )
}
