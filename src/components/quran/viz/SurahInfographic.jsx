// ═══════════════════════════════════════════════════════
// SurahInfographic — "Surə bir baxışda" (/quran/<surə>, başlıq kartının altında)
//
//   <SurahInfographic n={2} lang="az" onPick={(ayah) => …} onNightSky={() => …} nightRef={ref} />
//
// • 114 surənin nazil olma sırası zolağı: hər xətt bir surədir (hündürlüyü — ayə sayı,
//   rəngi və naxışı — Məkki/Mədəni), bu surə işıqlanır. Mənbə qeydi altdadır.
// • 30 cüzün halqası: surənin keçdiyi cüzlər yanır.
// • Səcdə ayələri (düymə — ayəyə keçid), müqəttəə hərfləri (Osmani yazılışı + adları).
// • "Gecə səması" — SurahNightSky (dinlədikcə ayələr ulduz kimi yanır).
// Qrafiklər dekor deyil: hər birinin mətn qarşılığı (aria-label + görünən yazı) var.
// Yalnız ./surahViz.js-dəki real məlumat. Stillər: styles/SurahViz.css
// ═══════════════════════════════════════════════════════
import { useMemo, useRef } from 'react'
import Icon from '../../Icon'
import { pickUi } from '../../../utils/uiText'
import { useInView } from '../../viz/hooks'
import { LETTERS, MUQATTAAT, plainLetters } from '../../../data/muqattaat'
import { surahFacts, REVELATION_SEQ, juzRing } from './surahViz'
import { SURAH_META } from '../../../seo/surahMeta'
import '../../../styles/SurahViz.css'

const T = {
  az: {
    title: 'Surə bir baxışda', order: 'Nazil olma sırası', meccan: 'Məkki', medinan: 'Mədəni',
    orderAria: (o, p) => `Nazil olma sırası: ${o} / 114 (${p}). Hər xətt bir surədir, hündürlüyü ayə sayıdır.`,
    first: 'İlk', last: 'Son',
    note: 'Nazil olma sırası — məşhur cədvəl (Quran.com); alimlərin ictihadıdır, qəti deyil.',
    juz: 'Cüz', juzAria: (a, b) => (a === b ? `30 cüzdən ${a}-də` : `30 cüzdən ${a}–${b}-də`),
    sajdah: 'Səcdə ayələri', ayah: (n) => `Ayə ${n}`, letters: 'Müqəttəə hərfləri',
    night: 'Gecə səması', nightHint: 'Dinləyin — hər ayə bir ulduz kimi yanır, surənin öz bürcü yaranır.',
  },
  en: {
    title: 'The surah at a glance', order: 'Order of revelation', meccan: 'Meccan', medinan: 'Medinan',
    orderAria: (o, p) => `Order of revelation: ${o} of 114 (${p}). Each line is a surah; its height is the number of ayahs.`,
    first: 'First', last: 'Last',
    note: 'Order of revelation — the well-known table (Quran.com); a scholarly estimate, not definitive.',
    juz: 'Juz', juzAria: (a, b) => (a === b ? `In juz ${a} of 30` : `In juz ${a}–${b} of 30`),
    sajdah: 'Ayahs of prostration', ayah: (n) => `Ayah ${n}`, letters: 'The disconnected letters',
    night: 'Night sky', nightHint: 'Listen — each ayah lights up as a star and the surah’s own constellation forms.',
  },
  ru: {
    title: 'Сура с первого взгляда', order: 'Порядок ниспослания', meccan: 'Мекканская', medinan: 'Мединская',
    orderAria: (o, p) => `Порядок ниспослания: ${o} из 114 (${p}). Каждая линия — сура, высота — число аятов.`,
    first: 'Первая', last: 'Последняя',
    // lang-ok[Quran]: mənbə adı (Quran.com)
    note: 'Порядок ниспослания — известная таблица (Quran.com); это иджтихад учёных, а не точные данные.',
    juz: 'Джуз', juzAria: (a, b) => (a === b ? `Джуз ${a} из 30` : `Джузы ${a}–${b} из 30`),
    sajdah: 'Аяты земного поклона', ayah: (n) => `Аят ${n}`, letters: 'Отдельные буквы',
    night: 'Ночное небо', nightHint: 'Слушайте — каждый аят загорается звездой, и складывается созвездие суры.',
  },
  ar: {
    title: 'السورة في لمحة', order: 'ترتيب النزول', meccan: 'مكية', medinan: 'مدنية',
    orderAria: (o, p) => `ترتيب النزول: ${o} من 114 (${p}). كل خط سورة، وارتفاعه عدد آياتها.`,
    first: 'الأولى', last: 'الأخيرة',
    // lang-ok[Quran]: mənbə adı (Quran.com)
    note: 'ترتيب النزول — الجدول المشهور (Quran.com)؛ اجتهاد من العلماء وليس قطعيًا.',
    juz: 'الجزء', juzAria: (a, b) => (a === b ? `في الجزء ${a} من 30` : `في الأجزاء ${a}–${b} من 30`),
    sajdah: 'آيات السجدة', ayah: (n) => `الآية ${n}`, letters: 'الحروف المقطعة',
    night: 'سماء الليل', nightHint: 'استمع — تضيء كل آية نجمةً، وتتشكّل كوكبة السورة.',
  },
  tr: {
    title: 'Bir bakışta sure', order: 'İniş sırası', meccan: 'Mekkî', medinan: 'Medenî',
    orderAria: (o, p) => `İniş sırası: ${o} / 114 (${p}). Her çizgi bir suredir, yüksekliği ayet sayısıdır.`,
    first: 'İlk', last: 'Son',
    // lang-ok[Quran]: mənbə adı (Quran.com)
    note: 'İniş sırası — meşhur tablo (Quran.com); âlimlerin ictihadıdır, kesin değildir.',
    juz: 'Cüz', juzAria: (a, b) => (a === b ? `30 cüzden ${a}. cüzde` : `30 cüzden ${a}–${b}. cüzlerde`),
    sajdah: 'Secde ayetleri', ayah: (n) => `Ayet ${n}`, letters: 'Hurûf-ı mukattaa',
    night: 'Gece gökyüzü', nightHint: 'Dinleyin — her ayet bir yıldız gibi yanar, surenin kendi takımyıldızı oluşur.',
  },
}

const TL_W = 1140, TL_H = 56
const MAX_AYAHS = 286
const RING = juzRing(40, 2.6)

export default function SurahInfographic({ n, lang = 'az', onPick, onNightSky, nightRef }) {
  const t = pickUi(T, lang, 'en')
  const f = surahFacts(n)
  const boxRef = useRef(null)
  const shown = useInView(boxRef)
  const mq = useMemo(() => MUQATTAAT.find(x => x.s === n), [n])
  const names = useMemo(() => {
    if (!mq) return []
    const seen = new Set()
    const out = []
    for (const ch of mq.open.map(plainLetters).join('')) {
      if (seen.has(ch)) continue
      seen.add(ch)
      const L = LETTERS.find(l => l.ch === ch)
      if (L) out.push(L.name[lang] || L.name.en)
    }
    return out
  }, [mq, lang])
  if (!f) return null
  const place = f.madani ? t.medinan : t.meccan
  const juzLabel = f.juz[0] === f.juz[1] ? String(f.juz[0]) : `${f.juz[0]}–${f.juz[1]}`

  return (
    <section ref={boxRef} className={`sgi${f.madani ? ' sgi--madani' : ''}${shown ? ' is-in' : ''}`} aria-labelledby="sgi-ttl" data-testid="surah-infographic">
      <h2 id="sgi-ttl" className="ui-sr-only">{t.title}</h2>

      {/* 1) 114 surə nazil olma sırası ilə */}
      <div className="sgi-panel sgi-tl">
        <div className="sgi-head">
          <span className="sgi-label">{t.order}</span>
          <span className="sgi-big ui-num" dir="ltr"><b data-count={f.order}>{f.order}</b><span> / 114</span></span>
        </div>
        <div className="sgi-tl__wrap">
        {/* Cari surənin yeri: üstündə 8 guşəli ulduz (rəngi rəqəmlə eyni) */}
        <span className="sgi-tl__mark" aria-hidden="true" style={{ "--x": `${((REVELATION_SEQ.findIndex(x => x.n === f.n) * 10 + 5) / TL_W * 100).toFixed(2)}%` }}>
          <svg viewBox="-10 -10 20 20"><path d="M0-9 2.4-5.8 6.4-6.4 5.8-2.4 9 0 5.8 2.4 6.4 6.4 2.4 5.8 0 9-2.4 5.8-6.4 6.4-5.8 2.4-9 0-5.8-2.4-6.4-6.4-2.4-5.8z" /></svg>
        </span>
        <svg className="sgi-tl__svg" viewBox={`0 0 ${TL_W} ${TL_H}`} preserveAspectRatio="none" role="img" aria-label={t.orderAria(f.order, place)}>
          <g className="sgi-tl__ticks">
            {REVELATION_SEQ.map((s, i) => {
              const h = 6 + (TL_H - 14) * Math.sqrt(SURAH_META[s.n - 1][4] / MAX_AYAHS)
              const cur = s.n === f.n
              return <rect key={s.n} className={`sgi-tick${s.madani ? ' is-md' : ''}${cur ? ' is-cur' : ''}`}
                x={i * 10 + 2} y={TL_H - (cur ? TL_H : h)} width={cur ? 6 : 5} height={cur ? TL_H : h} rx="1.5" />
            })}
          </g>
        </svg>
        </div>
        <div className="sgi-tl__axis" aria-hidden="true">
          <span>{t.first}</span>
          <span className="sgi-legend"><i className="sgi-sw" />{t.meccan}<i className="sgi-sw is-md" />{t.medinan}</span>
          <span>{t.last}</span>
        </div>
        <p className="sgi-note">{t.note}</p>
      </div>

      {/* 2) Cüz halqası */}
      <div className="sgi-panel sgi-juz">
        <div className="sgi-ring" role="img" aria-label={t.juzAria(f.juz[0], f.juz[1])}>
          <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            {RING.map((d, i) => (
              <path key={i} d={d} pathLength="1" className={`sgi-seg${i + 1 >= f.juz[0] && i + 1 <= f.juz[1] ? ' is-on' : ''}`} style={{ '--i': i }} />
            ))}
          </svg>
          <span className="sgi-ring__c">
            <b className="ui-num" dir="ltr">{juzLabel}</b>
            <span>{t.juz}</span>
          </span>
        </div>
      </div>

      {/* 3) Səcdə, müqəttəə, gecə səması */}
      <div className="sgi-panel sgi-side">
        {mq && (
          <div className="sgi-letters">
            <span className="sgi-label">{t.letters}</span>
            <span className="sgi-letters__ar" lang="ar" dir="rtl">{mq.open.join(' · ')}</span>
            <span className="sgi-letters__names">{names.join(' · ')}</span>
          </div>
        )}
        {f.sajdah.length > 0 && (
          <div className="sgi-saj">
            <span className="sgi-label">{t.sajdah}</span>
            <span className="sgi-saj__list">
              {f.sajdah.map(a => (
                <button type="button" key={a} className="ui-chip sgi-saj__btn" onClick={() => onPick?.(a)}>
                  <b aria-hidden="true">۩</b>{t.ayah(a)}
                </button>
              ))}
            </span>
          </div>
        )}
        <div className="sgi-night">
          <button type="button" ref={nightRef} className="ui-btn ui-btn--primary sgi-night__btn" onClick={onNightSky} data-testid="night-sky-open">
            <Icon name="moonStar" size={18} className="ui-btn__icon" />{t.night}
          </button>
          <p className="sgi-night__hint">{t.nightHint}</p>
        </div>
      </div>
    </section>
  )
}
