// ═══════════════════════════════════════════════════════
// ScriptLayers (v7.3) — Quranın yazı tarixi qat-qat
//
// • Qısa ayələr (Fatihə 1:1–7, İxlas 112:1–4) saytın öz Osmani mətnindən
//   hərfi-hərfinə götürülür (public/data/script-layers.json ←
//   scripts/build-script-layers.mjs ← seo-data/quran/quran-uthmani.json).
// • Üç qat: 1 — rəsm (nöqtəsiz, hərəkəsiz skelet, ilk əlyazmalardakı kimi),
//   2 — + nöqtələr (i'cam), 3 — + hərəkələr (saytda göstərilən tam mətn).
//   QAYDA: heç bir hərf əlavə olunmur, sıra dəyişmir — qatlar yalnız
//   GİZLƏDİR (utils/scriptLayers.js, tests/unit/script-layers.test.js).
// • "Qat-qat göstər" düyməsi 1→2→3 addımlayır; ekrandan kənarda və ya
//   vərəq gizlənəndə dayanır; hərəkət azaldılıbsa keçid animasiyası yoxdur.
// • Mənbələr komponentin sonunda göstərilir.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced'
import { layerText, stripMarks, MARKS_RE } from '../utils/scriptLayers'
import '../styles/ScriptLayers.css'

const T = {
  az: {
    ey: 'Yazı tarixi', title: 'Quranın yazısı qat-qat',
    lead: 'Mushafın səhifəsi bu gün gördüyümüz şəklə birdən gəlməyib. Qatları dəyişin: əvvəl ilk əlyazmalardakı kimi yalnız hərflərin çılpaq cizgisi, sonra hərfləri ayıran nöqtələr, sonda bugünkü hərəkələr.',
    layers: ['Rəsm', '+ nöqtələr (i‘cam)', '+ hərəkələr'],
    caps: [
      'Hərflərin çılpaq cizgisi: nöqtə və hərəkə yoxdur. Bir neçə hərf eyni formadadır — məsələn, ب ت ث ن ي sözün içində eyni "diş"dir.',
      'Nöqtələr hərfləri bir-birindən ayırır (ب ت ث; ج ح خ). Hərəkələr hələ yoxdur.',
      'Saytda göstərilən tam mətn: hərəkələr, tənvin, sükun, şəddə və digər işarələr.',
    ],
    hidden: 'Gizlənən işarə', skel: 'Nöqtəsiz formaya düşən hərf', play: 'Qat-qat göstər', stop: 'Dayandır', slider: 'Qat',
    surah: { 1: 'Fatihə', 112: 'İxlas' }, ayahs: 'Ayə',
    hist: 'İlk Quran əlyazmaları yalnız samit hərflərin cizgisi ilə — az nöqtə ilə və ya nöqtəsiz, hərəkəsiz — yazılırdı. Səsləri göstərən ilk işarələr (adətən qırmızı nöqtələr) Əbul-Əsvəd əd-Düəliyə nisbət edilir. Hərfləri ayıran nöqtələr (i‘cam) Əməvilər dövründə Nəsr ibn Asim və Yəhya ibn Yəmərə, bu gün işlənən hərəkələr isə əl-Xəlil ibn Əhməd əl-Fərahidiyə nisbət olunur.',
    note: 'Qatlar yalnız yazının tarixini göstərir. Quranın mətni və qiraəti həm yaddaşda, həm yazıda qorunub — sözlər dəyişməyib; sonradan yalnız oxumağı asanlaşdıran işarələr əlavə olunub.',
    tech: 'Rəsm qatı saytdakı mətnin hərflərindən avtomatik qurulub (Unicode-un nöqtəsiz hərfləri ilə) — konkret bir əlyazmanın surəti deyil.', // lang-ok[Unicode]: standartın adı
    src: 'Mənbələr',
  },
  en: {
    ey: 'History of writing', title: 'The Quran’s script, layer by layer',
    lead: 'The page of the mushaf did not reach the form we see today all at once. Switch the layers: first only the skeleton of the letters, as in the earliest manuscripts, then the dots that tell letters apart, and finally today’s vowel signs.',
    layers: ['Rasm', '+ dots (iʿjām)', '+ vowel signs'],
    caps: [
      'The skeleton of the letters: no dots, no vowel signs. Several letters share one shape — inside a word ب ت ث ن ي are the same “tooth”.',
      'Dots distinguish letters from one another (ب ت ث; ج ح خ). There are no vowel signs yet.',
      'The full text as shown on the site: vowels, tanwin, sukun, shadda and other signs.',
    ],
    hidden: 'Signs hidden', skel: 'Letters reduced to skeleton', play: 'Play the layers', stop: 'Stop', slider: 'Layer',
    surah: { 1: 'Al-Fatiha', 112: 'Al-Ikhlas' }, ayahs: 'Verse',
    hist: 'The earliest Quran manuscripts were written in a consonantal script — with few or no dots and no vowel signs. The first vowel marks (usually red dots) are associated with Abu al-Aswad ad-Duʾali. The dots that distinguish letters (iʿjām) are attributed to Nasr ibn ʿAsim and Yahya ibn Yaʿmar in the Umayyad period, and the vowel signs used today to al-Khalil ibn Ahmad al-Farahidi.',
    note: 'The layers show only the history of writing. The Quran’s text and recitation were preserved both orally and in writing — the words never changed; only signs that make reading easier were added later.',
    tech: 'The rasm layer is generated automatically from the letters of the site’s text (using Unicode dotless letters) — it is not a copy of any particular manuscript.',
    src: 'Sources',
  },
  ru: {
    ey: 'История письма', title: 'Письмо Корана слой за слоем',
    lead: 'Страница мусхафа не сразу приняла тот вид, который мы видим сегодня. Переключайте слои: сначала только скелет букв, как в ранних рукописях, затем точки, различающие буквы, и наконец нынешние огласовки.',
    layers: ['Расм', '+ точки (иджам)', '+ огласовки'],
    caps: [
      'Скелет букв: нет ни точек, ни огласовок. Несколько букв имеют одну форму — внутри слова ب ت ث ن ي выглядят одинаковым «зубцом».',
      'Точки отличают буквы друг от друга (ب ت ث; ج ح خ). Огласовок ещё нет.',
      'Полный текст, как он показан на сайте: огласовки, танвин, сукун, шадда и другие знаки.',
    ],
    hidden: 'Скрыто знаков', skel: 'Букв сведено к скелету', play: 'Показать по слоям', stop: 'Стоп', slider: 'Слой',
    surah: { 1: 'Аль-Фатиха', 112: 'Аль-Ихлас' }, ayahs: 'Аят',
    hist: 'Ранние рукописи Корана писались консонантным письмом — с небольшим числом точек или без них и без огласовок. Первые знаки гласных (обычно красные точки) связывают с Абу-ль-Асвадом ад-Дуали. Точки, различающие буквы (иджам), приписывают Насру ибн Асиму и Яхье ибн Ямару в эпоху Омейядов, а используемые сегодня огласовки — аль-Халилю ибн Ахмаду аль-Фарахиди.',
    note: 'Слои показывают лишь историю письма. Текст Корана и его чтение сохранялись и в памяти, и на письме — слова не менялись; позже добавлялись только знаки, облегчающие чтение.',
    tech: 'Слой расма построен автоматически из букв текста сайта (безточечными буквами Юникода) — это не копия какой-либо конкретной рукописи.',
    src: 'Источники',
  },
  ar: {
    ey: 'تاريخ الكتابة', title: 'خطّ المصحف طبقةً طبقة',
    lead: 'لم تبلغ صفحة المصحف صورتها التي نراها اليوم دفعةً واحدة. بدّل الطبقات: أولًا هيكل الحروف وحده كما في المخطوطات الأولى، ثم النقط التي تميّز الحروف، وأخيرًا الحركات المستعملة اليوم.',
    layers: ['الرسم', '+ الإعجام', '+ الحركات'],
    caps: [
      'هيكل الحروف بلا نقط ولا حركات. تشترك حروف عدة في صورة واحدة — فـ ب ت ث ن ي في وسط الكلمة سنٌّ واحدة.',
      'النقط تميّز الحروف بعضها من بعض (ب ت ث؛ ج ح خ). ولا حركات بعد.',
      'النص كاملًا كما يظهر في الموقع: الحركات والتنوين والسكون والشدّة وسائر العلامات.',
    ],
    hidden: 'علامات مخفية', skel: 'حروف رُدّت إلى هيكلها', play: 'اعرض الطبقات', stop: 'إيقاف', slider: 'الطبقة',
    surah: { 1: 'الفاتحة', 112: 'الإخلاص' }, ayahs: 'آية',
    hist: 'كُتبت أقدم مخطوطات المصحف بالرسم المجرّد — بنقط قليلة أو بلا نقط، ومن غير حركات. وتُنسب أولى علامات الحركات (وكانت نقطًا حمراء في الغالب) إلى أبي الأسود الدؤلي، ويُنسب نقط الإعجام الذي يميّز الحروف إلى نصر بن عاصم ويحيى بن يعمر في العصر الأموي، والحركات المستعملة اليوم إلى الخليل بن أحمد الفراهيدي.',
    note: 'الطبقات تعرض تاريخ الكتابة فحسب. لقد حُفظ نصّ القرآن وتلاوته في الصدور والسطور معًا — فلم تتغيّر كلماته، وإنما أُضيفت لاحقًا علامات تيسّر القراءة.',
    tech: 'طبقة الرسم مولَّدة آليًّا من حروف نصّ الموقع (بحروف يونيكود غير المنقوطة) — وليست نسخة من مخطوطة بعينها.',
    src: 'المصادر',
  },
  tr: {
    ey: 'Yazı tarihi', title: 'Kur’an’ın yazısı katman katman',
    lead: 'Mushaf sayfası bugün gördüğümüz şekle bir anda ulaşmadı. Katmanları değiştirin: önce ilk yazmalardaki gibi yalnız harflerin iskeleti, sonra harfleri ayıran noktalar, en sonda bugünkü harekeler.',
    layers: ['Resm', '+ noktalar (i‘câm)', '+ harekeler'],
    caps: [
      'Harflerin iskeleti: nokta ve hareke yok. Birkaç harf aynı şekildedir — kelime içinde ب ت ث ن ي aynı “diş”tir.',
      'Noktalar harfleri birbirinden ayırır (ب ت ث; ج ح خ). Henüz hareke yok.',
      'Sitede gösterilen tam metin: harekeler, tenvin, sükûn, şedde ve diğer işaretler.',
    ],
    hidden: 'Gizlenen işaret', skel: 'İskelete indirilen harf', play: 'Katman katman göster', stop: 'Durdur', slider: 'Katman',
    surah: { 1: 'Fâtiha', 112: 'İhlâs' }, ayahs: 'Âyet',
    hist: 'İlk Kur’an yazmaları ünsüz iskeletle — az noktayla ya da noktasız, harekesiz — yazılırdı. Sesleri gösteren ilk işaretler (çoğunlukla kırmızı noktalar) Ebü’l-Esved ed-Düelî’ye nispet edilir. Harfleri ayıran noktalar (i‘câm) Emevîler döneminde Nasr b. Âsım ile Yahyâ b. Ya‘mer’e, bugün kullanılan harekeler ise Halîl b. Ahmed el-Ferâhîdî’ye nispet edilir.',
    note: 'Katmanlar yalnızca yazının tarihini gösterir. Kur’an’ın metni ve kıraati hem hafızalarda hem yazıda korunmuştur — kelimeler değişmemiştir; sonradan yalnız okumayı kolaylaştıran işaretler eklenmiştir.',
    tech: 'Resm katmanı sitedeki metnin harflerinden otomatik oluşturulmuştur (Unicode noktasız harfleriyle) — belirli bir yazmanın kopyası değildir.',
    src: 'Kaynaklar',
  },
}

// Mənbələr — əsərlərin öz adları ilə (tərcümə olunmur)
const SOURCES = [
  'Abū ʿAmr al-Dānī, al-Muḥkam fī naqṭ al-maṣāḥif',
  'Ghānim Qaddūrī al-Ḥamad, Rasm al-Muṣḥaf: dirāsa lughawiyya tārīkhiyya (1982)',
  'François Déroche, Qur’ans of the Umayyads: A First Overview (Brill, 2014)',
]

const LAYERS = [1, 2, 3]
const STEP_MS = 1800
let dataPromise = null
const loadData = () => (dataPromise ||= fetch('/data/script-layers.json')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
  .catch(e => { dataPromise = null; throw e }))

export default function ScriptLayers() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [ref, setRef] = useState('1:1')
  const [layer, setLayer] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [onscreen, setOnscreen] = useState(true)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const root = useRef(null)

  useEffect(() => {
    let alive = true
    loadData().then(d => { if (alive) setData(d) }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [])

  // Ekrandan kənarda / gizli vərəqdə avtomatik addım dayanır
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver(([e]) => setOnscreen(!!e?.isIntersecting), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const on = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  useEffect(() => {
    if (!playing || !onscreen || !visible) return undefined
    const id = setTimeout(() => {
      if (layer >= 3) setPlaying(false)
      else setLayer(l => l + 1)
    }, STEP_MS)
    return () => clearTimeout(id)
  }, [playing, onscreen, visible, layer])

  const ayah = useMemo(() => data?.ayahs?.find(a => a.ref === ref) || data?.ayahs?.[0] || null, [data, ref])
  const shown = ayah ? layerText(ayah.text, layer) : ''
  const stats = useMemo(() => {
    if (!ayah) return null
    const l2 = [...stripMarks(ayah.text)], l1 = [...layerText(ayah.text, 1)]
    return {
      marks: (ayah.text.match(MARKS_RE) || []).length,
      skel: l2.reduce((n, c, i) => n + (c !== l1[i] ? 1 : 0), 0),
    }
  }, [ayah])

  const pick = (n) => { setPlaying(false); setLayer(n) }
  const play = () => {
    if (playing) { setPlaying(false); return }
    setLayer(1); setPlaying(true)
  }
  const groups = useMemo(() => {
    const g = []
    for (const a of data?.ayahs || []) {
      const last = g[g.length - 1]
      if (last && last.surah === a.surah) last.items.push(a)
      else g.push({ surah: a.surah, items: [a] })
    }
    return g
  }, [data])

  return (
    <section ref={root} className="ui-card sl" data-testid="script-layers" data-layer={layer}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 className="sl__title">{u.title}</h2>
      <p className="sl__lead">{u.lead}</p>

      <div className="sl__ayahs">
        {groups.map(g => (
          <div key={g.surah} className="sl__group">
            <span className="sl__surah">{u.surah[g.surah]}</span>
            <div className="sl__chips">
              {g.items.map(a => (
                <button key={a.ref} type="button" className="ui-chip sl__chip ui-num" data-ayah={a.ref}
                  aria-pressed={a.ref === ayah?.ref} aria-label={`${u.surah[a.surah]} ${a.ref}`}
                  onClick={() => setRef(a.ref)}>{a.ref}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={`sl__page sl__page--${layer}`}>
        <div className="sl__layers" role="group" aria-label={u.slider}>
          {LAYERS.map(n => (
            <button key={n} type="button" data-layer-btn={n} aria-pressed={layer === n}
              className={`ui-btn ui-btn--sm ${layer === n ? 'ui-btn--primary' : 'ui-btn--ghost'}`}
              onClick={() => pick(n)}>
              <span className="sl__num ui-num">{n}</span> {u.layers[n - 1]}
            </button>
          ))}
        </div>
        <input className="sl__range" type="range" min="1" max="3" step="1" value={layer}
          aria-label={u.slider} aria-valuetext={u.layers[layer - 1]}
          onChange={(e) => pick(Number(e.target.value))} />

        <div className="sl__stage" aria-live="polite">
          {ayah ? (
            <p key={`${ayah.ref}-${layer}`} className={`sl__text${reduced ? '' : ' is-anim'}`} lang="ar" dir="rtl" data-testid="sl-text">
              {shown}
              <span className="sl__ref ui-num" dir="ltr">({ayah.ref})</span>
            </p>
          ) : failed ? null : <div className="sl__skel" aria-hidden="true" />}
        </div>

        <p className="sl__cap">{u.caps[layer - 1]}</p>
        {stats && (
          <dl className="sl__stats">
            <div className={layer < 3 ? 'is-on' : ''}><dt>{u.hidden}</dt><dd className="ui-num">{stats.marks}</dd></div>
            <div className={layer < 2 ? 'is-on' : ''}><dt>{u.skel}</dt><dd className="ui-num">{stats.skel}</dd></div>
          </dl>
        )}
        <div className="sl__ctl">
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={play} aria-pressed={playing}>
            {playing ? u.stop : u.play}
          </button>
        </div>
      </div>

      <p className="sl__hist">{u.hist}</p>
      <p className="sl__note">{u.note}</p>
      <p className="sl__tech">{u.tech}</p>
      <p className="sl__src"><strong>{u.src}:</strong> <span lang="en">{SOURCES.join(' · ')}</span>.</p>
    </section>
  )
}
