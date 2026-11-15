// ═══════════════════════════════════════════════════════
// IsraJourney (v6.9) — İsra və Merac: sürüşdürdükcə açılan yol (/history)
//
// MƏTN (sahibin təsdiqi ilə, 2026-11-15) — yalnız:
//   • İsra 17:1 — ərəbcə və tərcümələr saytın öz Quran məlumatından olduğu
//     kimi (seo-data/quran: quran-uthmani, az.mammadaliyev, en.asad,
//     ru.kuliev, tr.diyanet; bəsmələ ayədən ayrılıb).
//   • Səmalarda görüşülən peyğəmbərlər — Səhih Buxari 3207, Muslim 162
//     ardıcıllığı ilə; adlar data/islamicHistory.js-dəndir.
// Tarix, gecə ibadəti və s. heç bir əlavə iddia yoxdur.
// Hərəkət: hər mərhələ ekrana girəndə yanır (IntersectionObserver, yalnız
// sinif); qızılı yol yalnız transform (scaleY) ilə uzanır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { PROPHETS } from '../data/islamicHistory'
import { localizeSource } from '../utils/sourceNames'
import { pickUi } from '../utils/uiText'
import '../styles/IsraJourney.css'

const AYAH = {
  ar: 'سُبْحَٰنَ ٱلَّذِىٓ أَسْرَىٰ بِعَبْدِهِۦ لَيْلًۭا مِّنَ ٱلْمَسْجِدِ ٱلْحَرَامِ إِلَى ٱلْمَسْجِدِ ٱلْأَقْصَا ٱلَّذِى بَٰرَكْنَا حَوْلَهُۥ لِنُرِيَهُۥ مِنْ ءَايَٰتِنَآ ۚ إِنَّهُۥ هُوَ ٱلسَّمِيعُ ٱلْبَصِيرُ',
  az: 'Bə’zi ayələrimizi (qüdrətimizə dəlalət edən qəribəlikləri və əcaiblikləri) göstərmək üçün bəndəsini (Peyğəmbər əleyhissəlamı) bir gecə (Məkkədəki) Məscidülhəramdan ətrafını mübarək etdiyimiz (bərəkət verdiyimiz) Məscidüləqsaya (Beytülmüqəddəsə) aparan Allah pak və müqəddəsdir. O, doğrudan da, (hər şeyi) eşidəndir, görəndir!',
  en: 'LIMITLESS in His glory is He who transported His servant by night from the Inviolable House of Worship [at Mecca] to the Remote House of Worship [, at Jerusalem] - the environs of which We had blessed -so that We might show him some of Our symbols: for, verily, He alone is all-hearing, all-seeing.',
  ru: 'Пречист Тот, Кто перенес ночью Своего раба, чтобы показать ему некоторые из Наших знамений, из Заповедной мечети в мечеть аль-Акса, окрестностям которой Мы даровали благословение. Воистину, Он - Слышащий, Видящий.',
  tr: 'Kulunu (Muhammed\'i) bir gece Mescidi Haram\'dan (Mekke\'den), kendisine bir kısım ayetlerimizi göstermek için, çevresini mübarek kıldığımız Mescidi Aksa\'ya (Kudüs\'e) götüren Allah\'ın şanı yücedir. Doğrusu O, işitir ve görür.',
}

const T = {
  az: { eyebrow: 'Sira', title: 'İsra və Merac', lead: 'Aşağı sürüşdürün: Məscidül-Həramdan Məscidül-Əqsaya, oradan yeddi səmaya.', ayah: 'İsra surəsi, 1', haram: 'Məscidül-Həram', haramSub: 'Məkkə', aqsa: 'Məscidül-Əqsa', aqsaSub: 'Qüds', sky: '{n}-ci səma', met: 'Görüşülən peyğəmbər', src: 'Səmalarda görüşülən peyğəmbərlər — {s}' },
  en: { eyebrow: 'Seerah', title: 'Al-Isra and al-Miraj', lead: 'Scroll down: from al-Masjid al-Haram to al-Masjid al-Aqsa, and from there to the seven heavens.', ayah: 'Surah al-Isra, 1', haram: 'al-Masjid al-Haram', haramSub: 'Makkah', aqsa: 'al-Masjid al-Aqsa', aqsaSub: 'Jerusalem', sky: 'Heaven {n}', met: 'Prophet met', src: 'The prophets met in the heavens — {s}' },
  ru: { eyebrow: 'Сира', title: 'Исра и Мирадж', lead: 'Прокрутите вниз: от Заповедной мечети к мечети аль-Акса, а оттуда — к семи небесам.', ayah: 'Сура аль-Исра, 1', haram: 'Заповедная мечеть', haramSub: 'Мекка', aqsa: 'Мечеть аль-Акса', aqsaSub: 'Иерусалим', sky: '{n}-е небо', met: 'Встреченный пророк', src: 'Пророки, встреченные на небесах, — {s}' },
  ar: { eyebrow: 'السيرة', title: 'الإسراء والمعراج', lead: 'مرِّر إلى الأسفل: من المسجد الحرام إلى المسجد الأقصى، ثم إلى السماوات السبع.', ayah: 'سورة الإسراء، ١', haram: 'المسجد الحرام', haramSub: 'مكة', aqsa: 'المسجد الأقصى', aqsaSub: 'القدس', sky: 'السماء {n}', met: 'النبي', src: 'الأنبياء في السماوات — {s}' },
  tr: { eyebrow: 'Siyer', title: 'İsrâ ve Mîrac', lead: 'Aşağı kaydırın: Mescid-i Haram’dan Mescid-i Aksa’ya, oradan yedi kat semaya.', ayah: 'İsrâ suresi, 1', haram: 'Mescid-i Haram', haramSub: 'Mekke', aqsa: 'Mescid-i Aksa', aqsaSub: 'Kudüs', sky: '{n}. kat sema', met: 'Görüşülen peygamber', src: 'Semalarda görüşülen peygamberler — {s}' },
}

// Səhih Buxari 3207, Muslim 162 — səmalar ardıcıllığı
const HEAVENS = [['Adam'], ['Yahya', 'Isa'], ['Yusuf'], ['Idris'], ['Harun'], ['Musa'], ['Ibrahim']]
const nameOf = (key, lang) => {
  const p = PROPHETS.find(x => x.name.en === key || x.name.en.startsWith(`${key} (`))
  return p ? (p.name[lang] || p.name.en) : key
}

export default function IsraJourney({ lang }) {
  const u = pickUi(T, lang, 'en')
  const ref = useRef(null)
  const [lit, setLit] = useState(0)
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const stops = [...root.querySelectorAll('.isj__stop')]
    if (typeof IntersectionObserver === 'undefined') { setLit(stops.length); return undefined }
    const io = new IntersectionObserver((ents) => {
      let max = 0
      for (const e of ents) if (e.isIntersecting) max = Math.max(max, Number(e.target.dataset.i) + 1)
      if (max) setLit(v => Math.max(v, max))
    }, { rootMargin: '0px 0px -35% 0px' })
    stops.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [])
  const total = HEAVENS.length + 2
  const tr = lang === 'ar' ? null : (AYAH[lang] || AYAH.en)
  const stop = (i, cls, title, sub, body) => (
    <li key={i} className={`isj__stop ${cls}${i < lit ? ' is-on' : ''}`} data-i={i}>
      <span className="isj__dot" aria-hidden="true" />
      <div className="isj__card">
        <p className="isj__name">{title}</p>
        {sub && <p className="isj__sub">{sub}</p>}
        {body}
      </div>
    </li>
  )
  return (
    <section className="ui-card isj" aria-labelledby="isj-title" data-testid="isra-journey" ref={ref}>
      <span className="ui-eyebrow">{u.eyebrow}</span>
      <h3 id="isj-title" className="isj__title">{u.title}</h3>
      <p className="isj__lead">{u.lead}</p>
      <figure className="isj__ayah">
        <blockquote>
          <p className="ui-arabic isj__ar" lang="ar" dir="rtl">{AYAH.ar}</p>
          {tr && <p className="isj__tr">{tr}</p>}
        </blockquote>
        <figcaption>— {u.ayah}</figcaption>
      </figure>
      <div className="isj__path">
        <span className="isj__rail" aria-hidden="true"><i style={{ transform: `scaleY(${(lit / total).toFixed(3)})` }} /></span>
        <ol className="isj__stops">
          {stop(0, 'isj__stop--earth', u.haram, u.haramSub)}
          {stop(1, 'isj__stop--earth', u.aqsa, u.aqsaSub)}
          {HEAVENS.map((names, k) => stop(k + 2, 'isj__stop--sky', u.sky.replace('{n}', String(k + 1)), null,
            <p className="isj__met"><span>{u.met}:</span> {names.map(n => nameOf(n, lang)).join(lang === 'ar' ? ' و' : ' · ')}</p>))}
        </ol>
      </div>
      <p className="isj__src">{u.src.replace('{s}', `${localizeSource('Buxari 3207', lang)}, ${localizeSource('Muslim 162', lang)}`)}</p>
    </section>
  )
}
