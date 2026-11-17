// ═══════════════════════════════════════════════════════
// QalamPen — qamış qələm: xəttatlığın ölçü sistemi
//
// • Enli uclu qələmlə yazı vərəqi: hər seqment ucluq kəsiyi ilə hərəkətin
//   Minkovski cəmi kimi çəkilir (utils/qalam.js) — xəttin qalınlığı hərəkət
//   istiqaməti ilə uc bucağı arasındakı bucaqdan asılıdır (standart 70°).
//   Uc bucağı və eni sürgü ilə, mürəkkəb — qara / qəhvəyi / qırmızı, kağız
//   faktura ilə. Stylus təzyiqi varsa eni dəyişir. Toxunuş — romb nöqtə.
// • Ölçü sistemi: romb nöqtə vahiddir; əlif nəsxdə ~5, süls-də 7–9 nöqtə
//   ("çox vaxt belə öyrədilir"); əlif dairəsi — diametri əlifə bərabər çevrə.
//   Seçilmiş hərfin şablonu saytın xəttatlıq şriftləri ilə (Amiri, Aref Ruqaa)
//   elə miqyasda çəkilir ki, şriftdəki əlif = seçilmiş nöqtə sayı.
// • Üstündən yazanda örtük utils/traceScore.js-in evaluate()-i ilə kiçik
//   maskada hesablanır (yalnız xətt bitəndə).
// • Animasiya dövrü yoxdur: kətan yalnız dəyişiklikdə çəkilir.
// • İxrac: PNG (1080 en), küncdə muslims.cc; Web Share, yoxsa yükləmə.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import {
  ALIF_DOTS, HAIRLINE, LETTERS, NIB_DEFAULT, NIB_MAX, NIB_MIN, WIDTH_DEFAULT, WIDTH_MAX, WIDTH_MIN,
  alifHeight, dirAngle, dotColumn, dotExtent, dotRhombus, layoutGlyph, nibQuad, nibRatio, pct,
  pressureScale, smoothPoint,
} from '../utils/qalam'
import { dilate, evaluate } from '../utils/traceScore'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import '../styles/CalligraphyFonts.css'
import '../styles/QalamPen.css'

const ASPECT = 1.1 // hündürlük / en
const EXPORT_W = 1080
const MASK_W = 160
const PAPER = '#f3ead5'
const INKS = [
  { id: 'black', hex: '#1d1813' },
  { id: 'sepia', hex: '#6e4320' },
  { id: 'red', hex: '#a3241b' },
]
const FACES = [
  { id: 'amiri', name: 'Amiri', css: '"Amiri", serif' },
  { id: 'ruqaa', name: 'Aref Ruqaa', css: '"Aref Ruqaa", "Amiri", serif' },
]
// Əlif ölçüsü: nəsx 5; süls 7 / 8 / 9 (məktəbdən asılı)
const MEASURES = [
  { id: 'n5', script: 'naskh', dots: ALIF_DOTS.naskh },
  ...ALIF_DOTS.thuluth.map(d => ({ id: `t${d}`, script: 'thuluth', dots: d })),
]

const T = {
  az: {
    ey: 'Xəttatlıq', title: 'Qamış qələm — xəttatlığın ölçü sistemi',
    lead: 'Ərəb xəttatı qamışdan yonulmuş, ucu çəp kəsilmiş qələmlə yazır. Belə enli uc xəttin qalınlığını özü dəyişir: bir istiqamətdə saç kimi nazik, başqa istiqamətdə ucun bütün genişliyi qədər. Hərflərin ölçüsü də bu ucdan gəlir — qələmin qoyduğu romb nöqtə ölçü vahididir.',
    hint: 'Çəkin — qələm izi; toxunun — romb nöqtə', canvas: 'Yazı vərəqi',
    nib: 'Uc bucağı', width: 'Ucun genişliyi', ink: 'Mürəkkəb',
    inks: { black: 'Qara', sepia: 'Qəhvəyi', red: 'Qırmızı' },
    letter: 'Hərf', measure: 'Əlifin ölçüsü', naskh: 'Nəsx', thuluth: 'Süls', dotsWord: 'nöqtə',
    face: 'Şablon şrifti', dots: 'Nöqtələr və dairə', ghost: 'Şablon',
    undo: 'Geri al', clear: 'Təmizlə', download: 'Yüklə', share: 'Paylaş',
    readout: 'Xəttin qalınlığı', ofNib: 'ucun enindən',
    cover: 'Örtük', spill: 'Kənara çıxma', noScore: 'Şablonun üstündən yazın — örtük burada görünəcək.',
    names: { 'ا': 'əlif', 'ب': 'be', 'ج': 'cim', 'د': 'dal', 'ر': 'ra', 'س': 'sin', 'ع': 'eyn', 'ف': 'fe', 'ن': 'nun', 'ه': 'he', 'و': 'vav' },
    howT: 'Uc necə işləyir',
    how: 'Uc kəsiyi üfüqlə təxminən 70° bucaq altında tutulur — nəsx və süls məşqində geniş yayılmış başlanğıc bucaqdır, ustadan ustaya bir az fərqlənir. Kəsik boyunca hərəkət saç kimi nazik, köndələn hərəkət isə ən qalın xətt verir. Bucağı dəyişib eyni hərəkəti təkrarlayın.',
    propT: 'Nöqtə, əlif və dairə',
    prop: 'Qələmi kağıza basıb öz eni qədər çəkəndə romb şəkilli nöqtə alınır. Xəttatlar hərfləri bu nöqtə ilə ölçür: nəsxdə əlif çox vaxt təxminən 5 nöqtə, süls xəttində isə məktəbdən asılı olaraq təxminən 7–9 nöqtə kimi öyrədilir. Bunlar mütləq qayda deyil, ənənəvi məşq ölçüləridir. Əlif həm də dairənin diametridir: bir çox hərfin ölçüsü bu «əlif dairəsi» ilə tutuşdurulur.', // lang-ok[diametridir]: az termini (diametr)
    hist: 'Bu mütənasib yazı sistemi — «əl-xətt əl-mənsub» — X əsrdə yaşamış Abbasi vəziri İbn Müqləyə aid edilir: nöqtə, əlif və əlif dairəsi hərflərin ölçüsünü bir-birinə bağladı. Sonrakı xəttatlar, o cümlədən İbn əl-Bəvvab, bu sistemi daha da inkişaf etdirdilər.',
    note: 'Şablon şriftlə çəkilir və şriftdəki əlif seçilmiş nöqtə sayına bərabər olacaq qədər böyüdülür; hərfin forması şriftə məxsusdur, ustanın əlyazması deyil. Rüqə gündəlik sürətli yazıdır — yuxarıdakı nöqtə sayları nəsx və süls üçündür.',
  },
  en: {
    ey: 'Calligraphy', title: 'The reed pen — calligraphy’s system of measure',
    lead: 'The Arabic calligrapher writes with a qalam — a reed pen cut with a slanted, broad nib. Such a nib changes the stroke width by itself: hair-thin in one direction, full width in another. The size of the letters also comes from the nib — the rhombic dot it makes is the unit of measure.',
    hint: 'Drag — pen stroke; tap — rhombic dot', canvas: 'Writing sheet',
    nib: 'Nib angle', width: 'Nib width', ink: 'Ink',
    inks: { black: 'Black', sepia: 'Sepia', red: 'Red' },
    letter: 'Letter', measure: 'Alif measure', naskh: 'Naskh', thuluth: 'Thuluth', dotsWord: 'dots',
    face: 'Template typeface', dots: 'Dots & circle', ghost: 'Template',
    undo: 'Undo', clear: 'Clear', download: 'Download', share: 'Share',
    readout: 'Stroke width', ofNib: 'of the nib',
    cover: 'Coverage', spill: 'Outside', noScore: 'Trace over the template — your coverage will appear here.',
    names: { 'ا': 'alif', 'ب': 'ba', 'ج': 'jim', 'د': 'dal', 'ر': 'ra', 'س': 'sin', 'ع': 'ayn', 'ف': 'fa', 'ن': 'nun', 'ه': 'ha', 'و': 'waw' },
    howT: 'How the nib works',
    how: 'The nib edge is held at roughly 70° to the horizontal — a common starting angle in Naskh and Thuluth practice, varying a little from master to master. Moving parallel to the edge gives a hairline; moving perpendicular to it gives the thickest stroke. Change the angle and repeat the same motion.',
    propT: 'The dot, the alif and the circle',
    prop: 'Pressing the pen down and drawing it its own width gives a rhombic dot. Calligraphers measure letters with this dot: in Naskh the alif is commonly taught as about 5 dots, in Thuluth as about 7–9 dots depending on the school. These are traditional teaching measures, not absolute rules. The alif is also the diameter of a circle: many letters are proportioned against this “circle of the alif”.',
    hist: 'This proportioned script — al-khatt al-mansub — is attributed to Ibn Muqla, an Abbasid vizier of the 10th century: the dot, the alif and the alif’s circle tied the sizes of the letters to one another. Later calligraphers, among them Ibn al-Bawwab, developed the system further.',
    note: 'The template is drawn from a typeface, scaled so that the typeface’s alif equals the chosen number of dots; the letter shapes belong to the typeface, not to a master’s hand. Ruq‘a is an everyday quick hand — the dot counts above refer to Naskh and Thuluth.',
  },
  ru: {
    ey: 'Каллиграфия', title: 'Тростниковый калам — система меры в каллиграфии',
    lead: 'Арабский каллиграф пишет каламом — тростниковым пером со скошенным широким срезом. Такое перо само меняет толщину линии: в одном направлении она тонкая как волос, в другом — во всю ширину. Размер букв тоже задаёт перо: ромбическая точка, которую оно ставит, служит единицей меры.',
    hint: 'Ведите — штрих пером; касание — ромбическая точка', canvas: 'Лист для письма',
    nib: 'Угол среза', width: 'Ширина пера', ink: 'Чернила',
    inks: { black: 'Чёрные', sepia: 'Сепия', red: 'Красные' },
    letter: 'Буква', measure: 'Мера алифа', naskh: 'Насх', thuluth: 'Сульс', dotsWord: 'точек',
    face: 'Шрифт шаблона', dots: 'Точки и круг', ghost: 'Шаблон',
    undo: 'Отменить', clear: 'Очистить', download: 'Скачать', share: 'Поделиться',
    readout: 'Толщина линии', ofNib: 'от ширины пера',
    cover: 'Покрытие', spill: 'За контуром', noScore: 'Обведите шаблон — здесь появится покрытие.',
    names: { 'ا': 'алиф', 'ب': 'ба', 'ج': 'джим', 'د': 'даль', 'ر': 'ра', 'س': 'син', 'ع': 'айн', 'ف': 'фа', 'ن': 'нун', 'ه': 'ха', 'و': 'вав' },
    howT: 'Как работает перо',
    how: 'Срез пера держат примерно под 70° к горизонтали — распространённый начальный угол в практике насха и сульса; у разных мастеров он немного различается. Движение вдоль среза даёт волосную линию, поперёк — самую толстую. Измените угол и повторите то же движение.',
    propT: 'Точка, алиф и круг',
    prop: 'Если прижать перо и провести его на собственную ширину, получится ромбическая точка. Каллиграфы измеряют буквы этой точкой: в насхе алиф обычно преподают как примерно 5 точек, в сульсе — примерно 7–9 точек в зависимости от школы. Это традиционные учебные меры, а не абсолютные правила. Алиф — ещё и диаметр круга: многие буквы соразмеряют с этим «кругом алифа».',
    hist: 'Эту соразмерную систему письма — «аль-хатт аль-мансуб» — приписывают Ибн Мукле, аббасидскому везиру X века: точка, алиф и круг алифа связали размеры букв друг с другом. Позднейшие каллиграфы, в том числе Ибн аль-Бавваб, развили систему дальше.',
    note: 'Шаблон нарисован шрифтом и увеличен так, чтобы алиф шрифта равнялся выбранному числу точек; форма букв принадлежит шрифту, а не руке мастера. Рика — повседневное беглое письмо; числа точек выше относятся к насху и сульсу.',
  },
  ar: {
    ey: 'الخط العربي', title: 'القلم القصبي — نظام النِّسَب في الخط',
    lead: 'يكتب الخطاط العربي بقلم من القصب بُري سنّه بقطّة مائلة عريضة. هذا السنّ العريض يغيّر سُمك الخط بنفسه: رفيعًا كالشعرة في اتجاه، وبكامل عرضه في اتجاه آخر. ومن هذا السنّ أيضًا تأتي مقاييس الحروف: فالنقطة المعيّنة التي يضعها القلم هي وحدة القياس.',
    hint: 'اسحب — أثر القلم؛ انقر — نقطة معيّنة', canvas: 'ورقة الكتابة',
    nib: 'زاوية القطّة', width: 'عرض السنّ', ink: 'الحبر',
    inks: { black: 'أسود', sepia: 'بنّي', red: 'أحمر' },
    letter: 'الحرف', measure: 'مقياس الألف', naskh: 'النسخ', thuluth: 'الثلث', dotsWord: 'نقاط',
    face: 'خط القالب', dots: 'النقاط والدائرة', ghost: 'القالب',
    undo: 'تراجع', clear: 'مسح', download: 'تنزيل', share: 'مشاركة',
    readout: 'سُمك الخط', ofNib: 'من عرض السنّ',
    cover: 'التغطية', spill: 'خارج الحرف', noScore: 'اكتب فوق القالب — ستظهر التغطية هنا.',
    names: { 'ا': 'ألف', 'ب': 'باء', 'ج': 'جيم', 'د': 'دال', 'ر': 'راء', 'س': 'سين', 'ع': 'عين', 'ف': 'فاء', 'ن': 'نون', 'ه': 'هاء', 'و': 'واو' },
    howT: 'كيف يعمل السنّ',
    how: 'تُمسَك قطّة القلم بزاوية تقارب ٧٠° مع الخط الأفقي — وهي زاوية بداية شائعة في تمرين النسخ والثلث، وتختلف قليلًا من أستاذ إلى آخر. الحركة الموازية للقطّة تعطي خطًا شعريًا، والحركة العمودية عليها تعطي أعرض خط. غيّر الزاوية وكرّر الحركة نفسها.',
    propT: 'النقطة والألف والدائرة',
    prop: 'إذا ضغطت القلم على الورق وسحبته بقدر عرضه حصلت على نقطة على شكل معيّن. بهذه النقطة يقيس الخطاطون الحروف: يُعلَّم الألف في النسخ عادةً بنحو ٥ نقاط، وفي الثلث بنحو ٧–٩ نقاط بحسب المدرسة. وهذه مقاييس تعليمية تقليدية لا قواعد مطلقة. والألف أيضًا قطر دائرة: كثير من الحروف تُقاس نسبتها إلى «دائرة الألف».',
    hist: 'يُنسب هذا النظام — «الخط المنسوب» — إلى ابن مقلة، الوزير العباسي في القرن الرابع الهجري (العاشر الميلادي): ربطت النقطة والألف ودائرة الألف مقاييس الحروف بعضها ببعض. ثم طوّره الخطاطون من بعده، ومنهم ابن البوّاب.',
    note: 'القالب مرسوم بخط حاسوبي مكبَّر بحيث يساوي ألفُه عدد النقاط المختار؛ أشكال الحروف للخط الحاسوبي لا ليد الأستاذ. والرقعة خط يومي سريع — أعداد النقاط أعلاه للنسخ والثلث.',
  },
  tr: {
    ey: 'Hat sanatı', title: 'Kamış kalem — hattın ölçü sistemi',
    lead: 'Hattat, kamıştan yontulmuş ve ucu eğik kesilmiş kalemle yazar. Böyle geniş bir uç çizginin kalınlığını kendisi değiştirir: bir yönde kıl gibi ince, başka yönde tam genişlik. Harflerin ölçüsü de bu uçtan gelir — kalemin koyduğu eşkenar dörtgen nokta ölçü birimidir.',
    hint: 'Sürükleyin — kalem izi; dokunun — eşkenar dörtgen nokta', canvas: 'Yazı kâğıdı',
    nib: 'Kat açısı', width: 'Uç genişliği', ink: 'Mürekkep',
    inks: { black: 'Siyah', sepia: 'Sepya', red: 'Kırmızı' },
    letter: 'Harf', measure: 'Elif ölçüsü', naskh: 'Nesih', thuluth: 'Sülüs', dotsWord: 'nokta',
    face: 'Şablon yazı tipi', dots: 'Noktalar ve daire', ghost: 'Şablon',
    undo: 'Geri al', clear: 'Temizle', download: 'İndir', share: 'Paylaş',
    readout: 'Çizgi kalınlığı', ofNib: 'uç genişliğinin',
    cover: 'Kaplama', spill: 'Dışarı taşma', noScore: 'Şablonun üzerinden yazın — kaplama burada görünecek.',
    names: { 'ا': 'elif', 'ب': 'be', 'ج': 'cim', 'د': 'dal', 'ر': 'rı', 'س': 'sin', 'ع': 'ayın', 'ف': 'fe', 'ن': 'nun', 'ه': 'he', 'و': 'vav' },
    howT: 'Uç nasıl çalışır',
    how: 'Kalemin kat yeri yataya yaklaşık 70° açıyla tutulur — nesih ve sülüs meşkinde yaygın bir başlangıç açısıdır, hocadan hocaya biraz değişir. Kata paralel hareket kıl gibi ince, ona dik hareket en kalın çizgiyi verir. Açıyı değiştirip aynı hareketi tekrarlayın.',
    propT: 'Nokta, elif ve daire',
    prop: 'Kalemi kâğıda bastırıp kendi genişliği kadar çekince eşkenar dörtgen bir nokta oluşur. Hattatlar harfleri bu noktayla ölçer: nesihte elif genellikle yaklaşık 5 nokta, sülüste ise ekole göre yaklaşık 7–9 nokta olarak öğretilir. Bunlar mutlak kurallar değil, geleneksel meşk ölçüleridir. Elif aynı zamanda bir dairenin çapıdır: birçok harfin oranı bu «elif dairesi» ile ölçülür.',
    hist: 'Bu orantılı yazı sistemi — «el-hattü’l-mensûb» — 10. yüzyılda yaşamış Abbâsî veziri İbn Mukle’ye nispet edilir: nokta, elif ve elif dairesi harflerin ölçülerini birbirine bağladı. Sonraki hattatlar, aralarında İbnü’l-Bevvâb da olmak üzere, sistemi daha da geliştirdi.',
    note: 'Şablon bir yazı tipiyle çizilir ve yazı tipinin elifi seçilen nokta sayısına eşit olacak kadar büyütülür; harf biçimleri yazı tipine aittir, bir hocanın eline değil. Rik‘a gündelik hızlı yazıdır — yukarıdaki nokta sayıları nesih ve sülüs içindir.',
  },
}

// ── Kağız fakturası: bir dəfə yaradılan 256px kafel (sabit toxumlu təsadüf) ──
let paperTile = null
function getPaperTile() {
  if (paperTile || typeof document === 'undefined') return paperTile
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  if (!ctx) return null
  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const img = ctx.createImageData(256, 256)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd()
    img.data[i] = 120; img.data[i + 1] = 92; img.data[i + 2] = 50
    img.data[i + 3] = Math.round(v * v * 26)
  }
  ctx.putImageData(img, 0, 0)
  // Lif zolaqları
  ctx.strokeStyle = 'rgba(140, 105, 60, 0.07)'
  ctx.lineWidth = 0.8
  for (let k = 0; k < 70; k++) {
    const x = rnd() * 256, y = rnd() * 256, a = rnd() * Math.PI, L = 6 + rnd() * 22
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke()
  }
  paperTile = c
  return c
}

function drawPaper(ctx, w, h) {
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, w, h)
  const tile = getPaperTile()
  if (tile) {
    const pat = ctx.createPattern(tile, 'repeat')
    if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, w, h) }
  }
  // Kənarlarda yüngül kölgə (köhnə vərəq)
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
  g.addColorStop(0, 'rgba(120, 85, 40, 0)')
  g.addColorStop(1, 'rgba(120, 85, 40, 0.12)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

const poly = (ctx, pts, S) => {
  ctx.beginPath()
  ctx.moveTo(pts[0].x * S, pts[0].y * S)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * S, pts[i].y * S)
  ctx.closePath()
  ctx.fill()
}

/** Bir seqment: ucluq izi + ucun öz qalınlığı (saç xətti) */
function drawSeg(ctx, a, b, angle, color, S) {
  ctx.fillStyle = color
  // Qonşu seqmentlər ~0.7px üst-üstə düşsün — antialiasing tikişləri görünməsin (mürəkkəb qeyri-şəffafdır)
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const ex = ((b.x - a.x) / L) * (0.7 / S), ey = ((b.y - a.y) / L) * (0.7 / S)
  poly(ctx, nibQuad({ x: a.x - ex, y: a.y - ey }, { x: b.x + ex, y: b.y + ey }, angle, a.w, b.w), S)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(0.6, HAIRLINE * ((a.w + b.w) / 2) * S)
  ctx.beginPath(); ctx.moveTo(a.x * S, a.y * S); ctx.lineTo(b.x * S, b.y * S); ctx.stroke()
}

function drawStroke(ctx, st, S, color = st.ink) {
  const p = st.pts
  if (st.dot || p.length < 2) {
    ctx.fillStyle = color
    poly(ctx, dotRhombus(p[0].x, p[0].y, st.angle, p[0].w), S)
    return
  }
  for (let i = 1; i < p.length; i++) drawSeg(ctx, p[i - 1], p[i], st.angle, color, S)
}

// Ölçmə: 1000px şriftdə hərfin qutusu
let measureCtx = null
function measure(ch, fam) {
  if (!measureCtx && typeof document !== 'undefined') measureCtx = document.createElement('canvas').getContext('2d')
  const z = { left: 0, right: 0, ascent: 0, descent: 0 }
  if (!measureCtx) return z
  measureCtx.font = `1000px ${fam}`
  measureCtx.textAlign = 'left'
  measureCtx.textBaseline = 'alphabetic'
  try { measureCtx.direction = 'ltr' } catch { /* köhnə brauzer */ }
  const m = measureCtx.measureText(ch)
  return {
    left: m.actualBoundingBoxLeft || 0, right: m.actualBoundingBoxRight || m.width || 0,
    ascent: m.actualBoundingBoxAscent || 0, descent: m.actualBoundingBoxDescent || 0,
  }
}

function drawGlyph(ctx, g, S, fill, outline) {
  ctx.font = `${g.size * S}px ${g.fam}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  try { ctx.direction = 'ltr' } catch { /* köhnə brauzer */ }
  if (fill) {
    // Şrift xətti qələmdən nazikdir — şablon qələmin çəkisinə qədər qalınlaşdırılır (qeyri-şəffaf rənglə, üst-üstə düşmə görünməsin)
    ctx.fillStyle = fill
    ctx.fillText(g.ch, g.x * S, g.y * S)
    ctx.save()
    ctx.strokeStyle = fill
    ctx.lineJoin = 'round'
    ctx.lineWidth = g.weight * S
    ctx.strokeText(g.ch, g.x * S, g.y * S)
    ctx.restore()
  }
  if (outline) {
    ctx.save()
    ctx.strokeStyle = outline
    ctx.lineWidth = 1.2
    ctx.setLineDash([5, 4])
    ctx.strokeText(g.ch, g.x * S, g.y * S)
    ctx.restore()
  }
}

function drawGuide(ctx, g, S, showDots, showGhost) {
  if (!g) return
  if (showDots) {
    // Əlif dairəsi
    ctx.save()
    ctx.strokeStyle = 'rgba(150, 95, 35, 0.5)'
    ctx.lineWidth = 1.2
    ctx.setLineDash([3, 5])
    ctx.beginPath(); ctx.arc(g.cx * S, g.cy * S, (g.H / 2) * S, 0, Math.PI * 2); ctx.stroke()
    // Əlif hündürlüyü xətləri
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(150, 95, 35, 0.35)'
    ctx.beginPath()
    ctx.moveTo((g.colX - g.dotW) * S, g.top * S); ctx.lineTo((g.colX + g.dotW) * S, g.top * S)
    ctx.moveTo((g.colX - g.dotW) * S, (g.top + g.H) * S); ctx.lineTo((g.colX + g.dotW) * S, (g.top + g.H) * S)
    ctx.stroke()
    ctx.restore()
    // Nöqtələr sütunu
    ctx.fillStyle = 'rgba(70, 45, 20, 0.55)'
    for (const d of g.column) poly(ctx, d.pts, S)
    ctx.fillStyle = 'rgba(110, 70, 30, 0.85)'
    ctx.font = `600 ${Math.max(11, 0.032 * S)}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(String(g.dots), g.colX * S, (g.top - g.dotW * 0.4) * S)
  }
  if (showGhost) drawGlyph(ctx, g, S, 'rgb(228, 209, 174)', 'rgba(120, 75, 30, 0.6)')
}

function renderExport(strokes) {
  const W = EXPORT_W, H = Math.round(EXPORT_W * ASPECT)
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  drawPaper(ctx, W, H)
  for (const st of strokes) drawStroke(ctx, st, W)
  const label = 'muslims.cc'
  ctx.font = '600 28px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const lw = ctx.measureText(label).width
  ctx.fillStyle = 'rgba(60, 40, 20, 0.55)'
  ctx.fillText(label, W - lw - 40, H - 36)
  return new Promise(res => c.toBlob(res, 'image/png'))
}

export default function QalamPen() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const names = u.names || T.en.names
  const reduced = useReduced()

  const [angle, setAngle] = useState(NIB_DEFAULT)
  const [width, setWidth] = useState(WIDTH_DEFAULT)
  const [ink, setInk] = useState(INKS[0].id)
  const [letter, setLetter] = useState(LETTERS[0])
  const [measureId, setMeasureId] = useState(MEASURES[0].id)
  const [face, setFace] = useState(FACES[0].id)
  const [showDots, setShowDots] = useState(true)
  const [showGhost, setShowGhost] = useState(true)
  const [count, setCount] = useState(0)
  const [score, setScore] = useState(null)
  const [busy, setBusy] = useState(false)
  const [fontTick, setFontTick] = useState(0)
  const [sizeTick, setSizeTick] = useState(0)

  const canvasRef = useRef(null)
  const readRef = useRef(null)
  const strokesRef = useRef([])
  const curRef = useRef(null)
  const scaleRef = useRef({ s: 0, dpr: 1 })
  const maskRef = useRef(null)

  const inkHex = INKS.find(i => i.id === ink).hex
  const fam = FACES.find(f => f.id === face).css
  const meas = MEASURES.find(m => m.id === measureId)

  // Şriftlər yüklənəndə şablonu yenidən ölç
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.load) return undefined
    let alive = true
    Promise.all([
      document.fonts.load('100px "Amiri"', 'ابجد'),
      document.fonts.load('100px "Aref Ruqaa"', 'ابجد'),
    ]).catch(() => {}).then(() => { if (alive) setFontTick(t => t + 1) })
    return () => { alive = false }
  }, [])

  // Şablonun həndəsəsi (normal vahidlərdə: en = 1)
  const guide = useMemo(() => {
    void fontTick
    const H = alifHeight(meas.dots, angle, width)
    const dotW = dotExtent(angle, width).w
    const cx = 0.45, cy = ASPECT / 2
    const L = layoutGlyph(measure('ا', fam), measure(letter, fam), H, cx, cy)
    const colX = Math.min(0.97 - dotW / 2, Math.max(L.box.maxX, cx + H / 2) + dotW * 1.6)
    const top = cy - H / 2
    return {
      ...L, ch: letter, fam, H, cx, cy, top, colX, dotW, dots: meas.dots, weight: width * 0.3,
      column: dotColumn(meas.dots, colX, top, angle, width),
    }
  }, [meas, angle, width, letter, fam, fontTick])

  const guideRef = useRef(guide)
  guideRef.current = guide

  const redraw = useCallback(() => {
    const c = canvasRef.current
    const { s, dpr } = scaleRef.current
    if (!c || !s) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawPaper(ctx, s, s * ASPECT)
    drawGuide(ctx, guideRef.current, s, showDots, showGhost)
    for (const st of strokesRef.current) drawStroke(ctx, st, s)
    if (curRef.current) drawStroke(ctx, curRef.current, s)
  }, [showDots, showGhost])

  // Örtük — kiçik maskada (yalnız xətt bitəndə / şablon dəyişəndə)
  const rescore = useCallback(() => {
    const strokes = strokesRef.current
    const g = guideRef.current
    if (!strokes.length || !g || typeof document === 'undefined') { setScore(null); return }
    const w = MASK_W, h = Math.round(MASK_W * ASPECT)
    if (!maskRef.current) { maskRef.current = document.createElement('canvas'); maskRef.current.width = w; maskRef.current.height = h }
    const ctx = maskRef.current.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    const grab = () => {
      const d = ctx.getImageData(0, 0, w, h).data
      const m = new Uint8Array(w * h)
      for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 96 ? 1 : 0
      return m
    }
    ctx.clearRect(0, 0, w, h)
    drawGlyph(ctx, g, w, '#000', null)
    const glyph = grab()
    ctx.clearRect(0, 0, w, h)
    for (const st of strokes) drawStroke(ctx, st, w, '#000')
    const inkM = grab()
    const near = dilate(glyph, w, h, 3)
    setScore(evaluate(glyph, near, inkM, w, h, 1))
  }, [])

  // Ölçü: ResizeObserver + DPR (≤ 2)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return undefined
    const fit = () => {
      const w = c.clientWidth
      if (!w) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (scaleRef.current.s === w && scaleRef.current.dpr === dpr) return
      c.width = Math.round(w * dpr)
      c.height = Math.round(w * ASPECT * dpr)
      scaleRef.current = { s: w, dpr }
      setSizeTick(t => t + 1)
    }
    fit()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fit); ro.observe(c) }
    else window.addEventListener('resize', fit)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit) }
  }, [])

  useEffect(() => { redraw() }, [redraw, guide, sizeTick])
  useEffect(() => { rescore() }, [rescore, guide])

  const toModel = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.width }
  }
  const showRatio = (r) => {
    const el = readRef.current
    if (el) el.textContent = `${pct(r)}%`
  }

  const onDown = (e) => {
    if (e.button && e.button !== 0) return
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* köhnə brauzer */ }
    const p = toModel(e)
    p.w = width * pressureScale(e.pointerType, e.pressure)
    curRef.current = { id: e.pointerId, ink: inkHex, angle, pts: [p], start: p, moved: false }
  }
  const onMove = (e) => {
    const st = curRef.current
    if (!st || st.id !== e.pointerId) return
    const evs = e.nativeEvent?.getCoalescedEvents?.() || []
    const list = evs.length ? evs : [e]
    const c = canvasRef.current
    const { s, dpr } = scaleRef.current
    const ctx = c?.getContext('2d')
    for (const ev of list) {
      const raw = toModel(ev)
      raw.w = width * pressureScale(e.pointerType, ev.pressure)
      if (!st.moved && Math.hypot(raw.x - st.start.x, raw.y - st.start.y) < 0.004) continue
      st.moved = true
      const last = st.pts[st.pts.length - 1]
      const sm = smoothPoint(last, raw, 0.5)
      if (Math.hypot(sm.x - last.x, sm.y - last.y) < 0.0015) continue
      st.pts.push(sm)
      if (ctx && s) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawSeg(ctx, last, sm, st.angle, st.ink, s) }
      showRatio(nibRatio(dirAngle(last, sm), st.angle))
    }
  }
  const finish = (st) => {
    const { s, dpr } = scaleRef.current
    const ctx = canvasRef.current?.getContext('2d')
    if (!st.moved) st.dot = true
    if (ctx && s) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (st.dot) drawStroke(ctx, st, s)
    }
    const h = strokesRef.current
    h.push({ ink: st.ink, angle: st.angle, pts: st.pts, dot: !!st.dot })
    setCount(h.length)
    rescore()
  }
  const onUp = (e) => {
    const st = curRef.current
    if (!st || st.id !== e.pointerId) return
    curRef.current = null
    if (e.type === 'pointercancel' && !st.moved) return
    if (st.moved) {
      const raw = toModel(e)
      raw.w = st.pts[st.pts.length - 1].w
      const last = st.pts[st.pts.length - 1]
      if (Math.hypot(raw.x - last.x, raw.y - last.y) >= 0.0015) {
        st.pts.push(raw)
        const { s, dpr } = scaleRef.current
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx && s) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawSeg(ctx, last, raw, st.angle, st.ink, s) }
      }
    }
    finish(st)
  }
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    // Klaviatura: əlif sütununun yanına növbəti nöqtə
    const g = guideRef.current
    const k = strokesRef.current.filter(s => s.dot).length % Math.max(1, g.dots)
    const d = dotColumn(g.dots, g.colX - g.dotW * 1.4, g.top, angle, width)[k]
    finish({ ink: inkHex, angle, pts: [{ x: d.cx, y: d.cy, w: width }], moved: false })
  }

  const undo = () => {
    if (!strokesRef.current.length) return
    strokesRef.current.pop()
    setCount(strokesRef.current.length)
    redraw(); rescore()
  }
  const clear = () => {
    strokesRef.current = []
    setCount(0)
    redraw(); rescore()
  }

  const download = async () => {
    const win = preopenWindow()
    setBusy(true)
    try {
      const blob = await renderExport(strokesRef.current)
      if (blob) saveBlob(blob, 'qalam-muslims-cc.png', win)
    } finally { setBusy(false) }
  }
  const share = async () => {
    setBusy(true)
    try {
      const blob = await renderExport(strokesRef.current)
      if (!blob) return
      const file = new File([blob], 'qalam-muslims-cc.png', { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(blob, 'qalam-muslims-cc.png')
    } finally { setBusy(false) }
  }

  const stars = score ? score.stars : 0

  return (
    <section
      className="ui-card qpn" aria-labelledby="qpn-title" data-testid="qalam-pen"
      data-nib={angle} data-letter={letter} data-dots={meas.dots} data-strokes={count}
      data-coverage={score ? pct(score.coverage) : ''}
    >
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="qpn-title" className="qpn__title">{u.title}</h2>
      <p className="qpn__lead">{u.lead}</p>

      <div className="qpn__grid">
        <div className="qpn__stage">
          <canvas
            ref={canvasRef}
            className="qpn__canvas"
            data-testid="qp-canvas"
            role="img"
            tabIndex={0}
            aria-label={`${u.canvas}. ${u.hint}`}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            onKeyDown={onKey}
          />
          <p className="qpn__hint">{u.hint}</p>
          <div className="qpn__score" aria-live="polite">
            {score ? (
              <>
                <span className="qpn__stars" aria-hidden="true">
                  {[0, 1, 2].map(i => <span key={i} className={i < stars ? 'is-on' : ''}>★</span>)}
                </span>
                <span>{u.cover}: <b>{pct(score.coverage)}%</b></span>
                <span>{u.spill}: <b>{pct(score.spill)}%</b></span>
              </>
            ) : <span className="qpn__muted">{u.noScore}</span>}
          </div>
        </div>

        <div className="qpn__panel">
          <div className="qpn__nibrow">
            <svg className="qpn__nibic" viewBox="-24 -24 48 48" aria-hidden="true">
              <circle r="21" className="qpn__nibring" />
              <g style={{ transform: `rotate(${-angle}deg)`, transition: reduced ? 'none' : undefined }} className="qpn__nibg">
                <line x1="-15" y1="0" x2="15" y2="0" />
              </g>
              <path d="M-21 0H21" className="qpn__nibbase" />
            </svg>
            <div className="qpn__sliders">
              <label className="qpn__field">
                <span>{u.nib} <b dir="ltr">{angle}°</b></span>
                <input type="range" min={NIB_MIN} max={NIB_MAX} step={1} value={angle}
                  onChange={e => setAngle(Number(e.target.value))} data-testid="qp-angle" />
              </label>
              <label className="qpn__field">
                <span>{u.width}</span>
                <input type="range" min={WIDTH_MIN} max={WIDTH_MAX} step={0.001} value={width}
                  onChange={e => setWidth(Number(e.target.value))} data-testid="qp-width" />
              </label>
              <p className="qpn__readout">{u.readout}: <b ref={readRef} dir="ltr">—</b> {u.ofNib}</p>
            </div>
          </div>

          <fieldset className="qpn__group">
            <legend>{u.ink}</legend>
            <div className="qpn__swatches">
              {INKS.map(i => (
                <button key={i.id} type="button" className="qpn__sw" style={{ '--sw': i.hex }} data-ink={i.id}
                  aria-pressed={ink === i.id} aria-label={u.inks[i.id]} title={u.inks[i.id]}
                  onClick={() => setInk(i.id)} />
              ))}
            </div>
          </fieldset>

          <fieldset className="qpn__group">
            <legend>{u.letter}</legend>
            <div className="qpn__chips">
              {LETTERS.map(ch => (
                <button key={ch} type="button" className="ui-chip qpn__letter" data-letter={ch}
                  aria-pressed={letter === ch} onClick={() => setLetter(ch)}>
                  <span className="qpn__glyph" lang="ar" style={{ fontFamily: fam }}>{ch}</span>
                  <span className="qpn__lname">{names[ch]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="qpn__group">
            <legend>{u.measure}</legend>
            <div className="qpn__chips">
              {MEASURES.map(m => (
                <button key={m.id} type="button" className="ui-chip" data-measure={m.id} data-dots={m.dots}
                  aria-pressed={measureId === m.id} onClick={() => setMeasureId(m.id)}>
                  {u[m.script]} · <span dir="ltr">{m.dots}</span> {u.dotsWord}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="qpn__group">
            <legend>{u.face}</legend>
            <div className="qpn__chips">
              {FACES.map(f => (
                <button key={f.id} type="button" className="ui-chip" data-face={f.id}
                  aria-pressed={face === f.id} onClick={() => setFace(f.id)}>
                  <span dir="ltr">{f.name}</span>
                </button>
              ))}
              <button type="button" className="ui-chip" data-testid="qp-dots" aria-pressed={showDots}
                onClick={() => setShowDots(v => !v)}>{u.dots}</button>
              <button type="button" className="ui-chip" data-testid="qp-ghost" aria-pressed={showGhost}
                onClick={() => setShowGhost(v => !v)}>{u.ghost}</button>
            </div>
          </fieldset>

          <div className="qpn__btns">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={undo} disabled={!count} data-testid="qp-undo">
              <Icon name="refresh" size={16} className="qpn__undo-ic" />{u.undo}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clear} disabled={!count} data-testid="qp-clear">
              <Icon name="trash" size={16} />{u.clear}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={download} disabled={busy} data-testid="qp-export">
              <Icon name="download" size={16} />{u.download}
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} disabled={busy} data-testid="qp-share">
              <Icon name="share" size={16} />{u.share}
            </button>
          </div>
        </div>
      </div>

      <div className="qpn__notes">
        <div className="qpn__note">
          <h3>{u.howT}</h3>
          <p>{u.how}</p>
        </div>
        <div className="qpn__note">
          <h3>{u.propT}</h3>
          <p>{u.prop}</p>
        </div>
        <p className="qpn__hist">{u.hist}</p>
        <p className="qpn__small">{u.note}</p>
      </div>
    </section>
  )
}
