// ═══════════════════════════════════════════════════════
// ArchBuilder — «İslam memarlığında tağlar»: beş tağ növü pərgar və xətkeşlə
// addım-addım qurulur (saf SVG).
//
// • Həndəsə utils/arches.js-dədir (qurulmaların təsviri orada): nal tağ
//   (Kordova), bərabərtərəfli sivri tağ, dördmərkəzli fars tağı, çoxləçəkli
//   tağ, Osmanlı «pencî» kemeri.
// • Hər addımda yeni qövslər pərgarla «çəkilir»: qövsün çəkilmiş hissəsi
//   rAF ilə bir dəfəlik böyüyür (sonsuz animasiya yoxdur), pərgarın ayaqları
//   mərkəzdə və qələmin ucunda görünür. Sonda tağ daşlarla (voussoir) dolur;
//   Kordova tağında qırmızı kərpic və ağ daş növbələşir.
// • Aşırım sürgüsü həndəsəni dərhal yenidən qurur. Oynatma ekrandan çıxanda /
//   vərəq gizlinəndə dayanır; hərəkət azaldılıbsa son addım animasiyasız.
// • Günbəz təsviri yoxdur; şəbəkə, kitabxana yoxdur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import { ARCH_TYPES, arcPath, arcPoint, arcSweep, buildArch, intradosPath, polyPath, voussoirs } from '../utils/arches'
import '../styles/ArchBuilder.css'

const PX_PER_M = 120 / 4.5   // 9 m aşırım → yarım aşırım 120 SVG vahidi
const SPAN_MIN = 3, SPAN_MAX = 9
const HOLD_MS = 900          // oynatmada addımlar arası fasilə
const STONES = {
  horseshoe: ['#b4442c', '#f1e7d0'], // Kordova: qırmızı kərpic / ağ daş
  pointed: ['#dcc69c', '#c9b083'],
  persian: ['#c99a62', '#b4844f'],
  multifoil: ['#e8d9b8', '#d6c198'],
  ottoman: ['#efe9dc', '#d3ccbc'],
}

const T = {
  az: {
    ey: 'İslam memarlığı', title: 'İslam memarlığında tağlar',
    lead: 'Usta tağı pərgar və xətkeşlə qururdu: bir neçə mərkəz, bir neçə qövs — sonra daş-daş hörülən forma. Tağı seçin, addımları izləyin, aşırımı dəyişin.', // lang-ok[xətkeşlə]: az sözü (xətkeş — cetvel)
    play: 'Oynat', pause: 'Dayandır', next: 'Növbəti', prev: 'Əvvəlki', step: 'Addım', span: 'Aşırım', m: 'm',
    svg: 'Tağın qurulma sxemi', example: 'Nümunə',
    note: 'Qurulmalar klassik üsulların sadələşdirilmiş variantlarıdır; real tikililərdə nisbətlər bir qədər fərqlənir.',
    types: {
      horseshoe: {
        name: 'Nal tağ',
        steps: [
          'Aşırımı çəkirik: A və B dabanları — tağın sütunların üstündən başladığı nöqtələr.',
          'Mərkəz O ortada, dabanlar xəttindən yuxarıda qoyulur: OA = OB = r və O xətdən r/2 hündürdədir. Ona görə çevrə dabanlardan aşağı enir.',
          'Pərgarın ucunu O-ya qoyub B-dən A-ya qövs çəkirik: 240° — yarımdairədən 60° artıq. Bu, nal formasıdır.',
          'Qövs boyunca tağ daşlarını düzürük: Kordovadakı kimi qırmızı kərpic və ağ daş növbələşir; tağı düzbucaqlı çərçivə — alfiz əhatə edir.',
        ],
        ex: 'Kordova Böyük Məscidi (VIII–X əsrlər): yüzlərlə sütun üzərində qırmızı-ağ daşlı nal tağlar.',
      },
      pointed: {
        name: 'Sivri tağ',
        steps: [
          'Aşırım AB-ni çəkirik.',
          'Pərgarı aşırım qədər açırıq: mərkəzlər dabanların özüdür — A və B, radius r = AB.',
          'Mərkəz A-da: B-dən yuxarı qövs çəkirik.',
          'Mərkəz B-də: A-dan yuxarı qövs çəkirik. Qövslər C təpəsində kəsişir; ABC bərabərtərəfli üçbucaqdır, C-də əyri sınır — tağ sivri olur.',
          'Daşları düzürük; təpədə açar daşı yox, oynaq var — iki yarım bir-birinə söykənir.',
        ],
        ex: 'İbn Tulun məscidi, Qahirə (876–879): bütün revaqları sivri tağlıdır — sivri tağın erkən böyük nümunələrindən.',
      },
      persian: {
        name: 'Fars tağı',
        steps: [
          'Aşırım AB-ni dörd bərabər hissəyə bölürük.',
          'Alt mərkəzlər O₁ və O₂ — dörddə bir nöqtələri, radius aşırımın dörddə biri. Dabanlardan 45° qövs çəkirik (E nöqtələrinə qədər).',
          'O₁E xəttini o biri tərəfə uzadırıq: yuxarı mərkəz O₃ bu xətt üzərində, dabanlar xəttindən aşağıda, oxun o tayında aşırımın 1/8-i qədər. O₄ — onun güzgü əksi.',
          'O₃ və O₄-dən böyük qövslər E-dən təpə C-yə gedir. E-də qövslər toxunur — keçid hamardır, təpədə isə sivri.',
          'Daşları düzürük. Dördmərkəzli tağ alçaq və geniş açılır — eyvanlar üçün əlverişlidir.', // lang-ok[əlverişlidir]: az sözü
        ],
        ex: 'Uluqbəy mədrəsəsi, Səmərqənd, Registan (1417–1420): Teymuri eyvanlarında dördmərkəzli tağ.',
      },
      multifoil: {
        name: 'Çoxləçəkli tağ',
        steps: [
          'Aşırım AB-ni çəkirik.',
          'O mərkəzli, AB diametrli yarımçevrəni köməkçi xətt kimi çəkirik.', // lang-ok[diametrli]: az termini
          'Yarımçevrəni 7 bərabər hissəyə bölürük. Hər hissənin vətərinin ortası bir ləçəyin mərkəzidir.', // lang-ok[Yarımçevrəni]: az termini
          'Hər mərkəzdən vətərin yarısı radiusu ilə yarımçevrə çəkirik — ləçəklər xaricə qabarır, bölgü nöqtələrində içəri baxan dişlər qalır.', // lang-ok[yarımçevrə]: az termini
          'Daşlar O-dan radial düzülür.',
        ],
        ex: 'Kordova Böyük Məscidi, II Hakəmin genişləndirməsi (961–976) və Saraqosadakı Əlcəfəriyyə sarayı (XI əsr): bir-birini kəsən çoxləçəkli tağlar.',
      },
      ottoman: {
        name: 'Osmanlı tağı',
        steps: [
          'Aşırımı beş bərabər hissəyə bölürük («pencî» — beşlik).', // lang-ok[î]: osmanlıca termin «pencî»
          'Mərkəzlər M₁ və M₂ orta hissənin uclarıdır; radius uzaq dabana qədərdir: r = 0,6 · aşırım.',
          'M₁ mərkəzindən B-dən başlayan qövs çəkirik.',
          'M₂ mərkəzindən A-dan başlayan qövs çəkirik; C-də kəsişirlər — bərabərtərəflidən alçaq, yumşaq sivri tağ.',
          'Daşları düzürük.',
        ],
        ex: 'Süleymaniyə məscidi, İstanbul (Memar Sinan, 1550–1557): həyətin revaqlarında sivri tağlar.',
      },
    },
  },
  en: {
    ey: 'Islamic architecture', title: 'Arches in Islamic architecture',
    lead: 'A master builder laid out an arch with compass and straightedge: a few centres, a few arcs — then the form was built stone by stone. Pick an arch, follow the steps, change the span.',
    play: 'Play', pause: 'Pause', next: 'Next', prev: 'Back', step: 'Step', span: 'Span', m: 'm',
    svg: 'Arch construction diagram', example: 'Example',
    note: 'The constructions are simplified versions of classical methods; real buildings vary the proportions.',
    types: {
      horseshoe: {
        name: 'Horseshoe arch',
        steps: [
          'Draw the span: A and B are the springing points, where the arch starts above the columns.',
          'Place the centre O on the axis above the springing line: OA = OB = r and O sits r/2 above the line, so the circle dips below the springing points.',
          'With the compass point at O, sweep from B to A: 240° — 60° more than a semicircle. That is the horseshoe.',
          'Lay the voussoirs along the curve: as in Córdoba, red brick alternates with white stone; a rectangular frame — the alfiz — encloses the arch.',
        ],
        ex: 'Great Mosque of Córdoba (8th–10th c.): horseshoe arches with red-and-white voussoirs on hundreds of columns.',
      },
      pointed: {
        name: 'Pointed arch',
        steps: [
          'Draw the span AB.',
          'Open the compass to the full span: the centres are the springing points A and B themselves, radius r = AB.',
          'Centre at A: sweep up from B.',
          'Centre at B: sweep up from A. The arcs meet at the apex C; ABC is equilateral and the curve breaks at C — the arch is pointed.',
          'Lay the voussoirs; there is no keystone at the crown but a joint — the two halves lean on each other.',
        ],
        ex: 'Mosque of Ibn Tulun, Cairo (876–879): all its arcades are pointed — one of the early large-scale uses of the pointed arch.',
      },
      persian: {
        name: 'Persian arch',
        steps: [
          'Divide the span AB into four equal parts.',
          'The lower centres O₁ and O₂ are the quarter points, radius a quarter of the span. Sweep 45° up from the springing points (to the points E).',
          'Extend the line O₁E beyond the centre: the upper centre O₃ lies on it, below the springing line, one eighth of the span across the axis. O₄ is its mirror image.',
          'From O₃ and O₄ the large arcs run from E to the apex C. At E the arcs are tangent — a smooth join — while the crown is pointed.',
          'Lay the voussoirs. The four-centred arch opens low and wide — well suited to iwans.',
        ],
        ex: 'Ulugh Beg Madrasa, Registan, Samarkand (1417–1420): four-centred arches in Timurid iwans.',
      },
      multifoil: {
        name: 'Multifoil arch',
        steps: [
          'Draw the span AB.',
          'Draw the semicircle on diameter AB with centre O as a guide.',
          'Divide the semicircle into 7 equal parts. The midpoint of each chord is the centre of a lobe.',
          'From each centre sweep a half-circle with radius half the chord — the lobes bulge outward, leaving inward-pointing cusps at the division points.',
          'The voussoirs radiate from O.',
        ],
        ex: 'Great Mosque of Córdoba, extension of al-Hakam II (961–976), and the Aljafería palace in Zaragoza (11th c.): interlacing polylobed arches.',
      },
      ottoman: {
        name: 'Ottoman arch',
        steps: [
          'Divide the span into five equal parts (pencî — “of five”).',
          'The centres M₁ and M₂ are the ends of the middle part; the radius reaches the far springing point: r = 0.6 × span.',
          'From centre M₁ sweep the arc starting at B.',
          'From centre M₂ sweep the arc starting at A; they meet at C — a gently pointed arch, lower than the equilateral one.',
          'Lay the voussoirs.',
        ],
        ex: 'Süleymaniye Mosque, Istanbul (Mimar Sinan, 1550–1557): pointed arches in the courtyard porticoes.',
      },
    },
  },
  ru: {
    ey: 'Исламская архитектура', title: 'Арки в исламской архитектуре',
    lead: 'Мастер строил арку циркулем и линейкой: несколько центров, несколько дуг — а затем форму выкладывали камень за камнем. Выберите арку, пройдите шаги, измените пролёт.',
    play: 'Запустить', pause: 'Пауза', next: 'Далее', prev: 'Назад', step: 'Шаг', span: 'Пролёт', m: 'м',
    svg: 'Схема построения арки', example: 'Пример',
    note: 'Построения — упрощённые варианты классических приёмов; в реальных зданиях пропорции немного отличаются.',
    types: {
      horseshoe: {
        name: 'Подковообразная арка',
        steps: [
          'Проводим пролёт: А и В — точки пят, где арка начинается над колоннами.',
          'Центр О ставим на оси выше линии пят: ОА = ОВ = радиус, а О поднят над линией на половину радиуса, поэтому окружность опускается ниже пят.',
          'Ставим ножку циркуля в О и ведём дугу от В к А: 240° — на 60° больше полуокружности. Это и есть подкова.',
          'Выкладываем клинчатые камни: как в Кордове, красный кирпич чередуется с белым камнем; арку обрамляет прямоугольная рамка — альфис.',
        ],
        ex: 'Большая мечеть Кордовы (VIII–X вв.): подковообразные арки с красно-белыми камнями на сотнях колонн.',
      },
      pointed: {
        name: 'Стрельчатая арка',
        steps: [
          'Проводим пролёт АВ.',
          'Раскрываем циркуль на весь пролёт: центры — сами точки пят А и В, радиус равен АВ.',
          'Центр в А: ведём дугу вверх от В.',
          'Центр в В: ведём дугу вверх от А. Дуги сходятся в вершине С; треугольник АВС равносторонний, в С кривая ломается — арка стрельчатая.',
          'Выкладываем камни; в вершине не замковый камень, а шов — две половины опираются друг на друга.',
        ],
        ex: 'Мечеть Ибн Тулуна, Каир (876–879): все её галереи на стрельчатых арках — один из ранних крупных примеров.',
      },
      persian: {
        name: 'Персидская арка',
        steps: [
          'Делим пролёт АВ на четыре равные части.',
          'Нижние центры О₁ и О₂ — точки четвертей, радиус — четверть пролёта. От пят ведём дуги на 45° (до точек Е).',
          'Продолжаем линию О₁Е за центр: верхний центр О₃ лежит на ней ниже линии пят, по другую сторону оси на 1/8 пролёта. О₄ — его зеркальное отражение.',
          'Из О₃ и О₄ большие дуги идут от Е к вершине С. В Е дуги касаются — переход плавный, а вершина острая.',
          'Выкладываем камни. Четырёхцентровая арка открывается низко и широко — удобно для айванов.',
        ],
        ex: 'Медресе Улугбека, Регистан, Самарканд (1417–1420): четырёхцентровые арки тимуридских айванов.',
      },
      multifoil: {
        name: 'Многолопастная арка',
        steps: [
          'Проводим пролёт АВ.',
          'Вспомогательно чертим полуокружность с центром О на диаметре АВ.',
          'Делим полуокружность на 7 равных частей. Середина каждой хорды — центр лопасти.',
          'Из каждого центра проводим полуокружность радиусом в половину хорды — лопасти выгибаются наружу, в точках деления остаются зубцы, направленные внутрь.',
          'Камни расходятся радиально от О.',
        ],
        ex: 'Большая мечеть Кордовы, пристройка аль-Хакама II (961–976), и дворец Альхаферия в Сарагосе (XI в.): переплетающиеся многолопастные арки.',
      },
      ottoman: {
        name: 'Османская арка',
        steps: [
          'Делим пролёт на пять равных частей («пенджи» — «пятерная»).',
          'Центры М₁ и М₂ — концы средней части; радиус доходит до дальней пяты и равен 0,6 пролёта.',
          'Из центра М₁ ведём дугу, начиная от В.',
          'Из центра М₂ ведём дугу, начиная от А; они сходятся в С — мягко заострённая арка, ниже равносторонней.',
          'Выкладываем камни.',
        ],
        ex: 'Мечеть Сулеймание, Стамбул (Мимар Синан, 1550–1557): стрельчатые арки галерей двора.',
      },
    },
  },
  ar: {
    ey: 'العمارة الإسلامية', title: 'العقود في العمارة الإسلامية',
    lead: 'كان المعماري يرسم العقد بالفرجار والمسطرة: بضعة مراكز وبضعة أقواس، ثم يُبنى الشكل حجرًا حجرًا. اختر عقدًا، وتابع الخطوات، وغيّر فتحته.',
    play: 'تشغيل', pause: 'إيقاف', next: 'التالي', prev: 'السابق', step: 'الخطوة', span: 'الفتحة', m: 'م',
    svg: 'مخطط إنشاء العقد', example: 'مثال',
    note: 'هذه الإنشاءات صيغ مبسطة للطرق التقليدية، وتختلف النسب قليلًا في المباني الحقيقية.',
    types: {
      horseshoe: {
        name: 'العقد الحدوي',
        steps: [
          'نرسم الفتحة: طرفاها نقطتا الارتكاز حيث يبدأ العقد فوق الأعمدة.',
          'نضع المركز على المحور فوق خط الارتكاز: بُعده عن الطرفين نصف القطر، وارتفاعه عن الخط نصف نصف القطر، فتنزل الدائرة تحت نقطتي الارتكاز.',
          'نثبّت سنّ الفرجار في المركز ونرسم القوس من الطرف الأيمن إلى الأيسر: 240° — أي أكثر من نصف الدائرة بستين درجة. هذا هو شكل الحدوة.',
          'نصفّ الصنجات على القوس: كما في قرطبة يتناوب الآجر الأحمر مع الحجر الأبيض، ويحيط بالعقد إطار مستطيل هو الإفريز.',
        ],
        ex: 'المسجد الجامع بقرطبة (القرن الثاني إلى الرابع الهجري): عقود حدوية بصنجات حمراء وبيضاء على مئات الأعمدة.',
      },
      pointed: {
        name: 'العقد المدبب',
        steps: [
          'نرسم الفتحة.',
          'نفتح الفرجار بقدر الفتحة كلها: المركزان هما نقطتا الارتكاز نفسهما، ونصف القطر يساوي الفتحة.',
          'المركز في الطرف الأيسر: نرسم القوس صاعدًا من الطرف الأيمن.',
          'المركز في الطرف الأيمن: نرسم القوس صاعدًا من الطرف الأيسر. يلتقي القوسان في الرأس فيتكوّن مثلث متساوي الأضلاع، وينكسر المنحنى عند الرأس فيصير العقد مدببًا.',
          'نصفّ الصنجات؛ وليس في الرأس حجر مفتاح بل فاصل، فيستند النصفان أحدهما إلى الآخر.',
        ],
        ex: 'جامع أحمد بن طولون بالقاهرة (263–265هـ / 876–879م): أروقته كلها على عقود مدببة، وهو من أقدم الأمثلة الكبيرة عليها.',
      },
      persian: {
        name: 'العقد الفارسي',
        steps: [
          'نقسم الفتحة إلى أربعة أقسام متساوية.',
          'المركزان السفليان عند نقطتي الربع، ونصف القطر ربع الفتحة. نرسم من نقطتي الارتكاز قوسين بزاوية 45°.',
          'نمدّ الخط من المركز السفلي إلى نهاية القوس الصغير إلى ما وراء المركز: يقع المركز العلوي عليه تحت خط الارتكاز، في الجهة الأخرى من المحور على بُعد ثُمن الفتحة. والمركز الرابع صورته المتناظرة.',
          'من المركزين العلويين يمتد القوسان الكبيران من نهاية القوسين الصغيرين إلى الرأس. عند الالتقاء يتماسّ القوسان فيكون الانتقال سلسًا، أما الرأس فمدبب.',
          'نصفّ الصنجات. العقد ذو المراكز الأربعة منخفض واسع، فيلائم الإيوانات.',
        ],
        ex: 'مدرسة ألغ بيك في ميدان ريجستان بسمرقند (1417–1420م): عقود رباعية المراكز في الإيوانات التيمورية.',
      },
      multifoil: {
        name: 'العقد المفصص',
        steps: [
          'نرسم الفتحة.',
          'نرسم نصف دائرة قطرها الفتحة خطًّا مساعدًا.',
          'نقسم نصف الدائرة إلى سبعة أقسام متساوية، ومنتصف كل وتر هو مركز فص.',
          'من كل مركز نرسم نصف دائرة نصف قطرها نصف الوتر، فتبرز الفصوص إلى الخارج وتبقى عند نقاط التقسيم أسنان متجهة إلى الداخل.',
          'تتشعّع الصنجات من المركز.',
        ],
        ex: 'المسجد الجامع بقرطبة، زيادة الحكم المستنصر (350–366هـ / 961–976م)، وقصر الجعفرية بسرقسطة (القرن الخامس الهجري): عقود مفصصة متشابكة.',
      },
      ottoman: {
        name: 'العقد العثماني',
        steps: [
          'نقسم الفتحة إلى خمسة أقسام متساوية (العقد «الخُمسي»).',
          'المركزان هما طرفا القسم الأوسط، ونصف القطر يصل إلى نقطة الارتكاز البعيدة: ستة أعشار الفتحة.',
          'من المركز الأيسر نرسم القوس بدءًا من الطرف الأيمن.',
          'من المركز الأيمن نرسم القوس بدءًا من الطرف الأيسر، فيلتقيان في الرأس: عقد مدبب لطيف أخفض من المتساوي الأضلاع.',
          'نصفّ الصنجات.',
        ],
        ex: 'جامع السليمانية بإسطنبول (المعمار سنان، 1550–1557م): عقود مدببة في أروقة الصحن.',
      },
    },
  },
  tr: {
    ey: 'İslam mimarisi', title: 'İslam mimarisinde kemerler',
    lead: 'Usta kemeri pergel ve cetvelle kurardı: birkaç merkez, birkaç yay — sonra taş taş örülen biçim. Bir kemer seçin, adımları izleyin, açıklığı değiştirin.',
    play: 'Oynat', pause: 'Durdur', next: 'Sonraki', prev: 'Önceki', step: 'Adım', span: 'Açıklık', m: 'm',
    svg: 'Kemer kuruluş şeması', example: 'Örnek',
    note: 'Kuruluşlar klasik yöntemlerin sadeleştirilmiş hâlleridir; gerçek yapılarda oranlar biraz farklıdır.',
    types: {
      horseshoe: {
        name: 'Nal kemer',
        steps: [
          'Açıklığı çiziyoruz: A ve B üzengi noktaları — kemerin sütunların üstünde başladığı yerler.',
          'Merkez O eksende, üzengi hattının üstüne konur: OA = OB = r ve O hattın r/2 yukarısındadır; bu yüzden çember üzengilerin altına iner.',
          'Pergelin ucunu O’ya koyup B’den A’ya yay çiziyoruz: 240° — yarım daireden 60° fazla. İşte nal biçimi.',
          'Yay boyunca kemer taşlarını diziyoruz: Kurtuba’daki gibi kırmızı tuğla ile beyaz taş sırayla gelir; kemeri dikdörtgen bir çerçeve — alfiz — kuşatır.',
        ],
        ex: 'Kurtuba Ulu Camii (VIII–X. yüzyıllar): yüzlerce sütun üzerinde kırmızı-beyaz taşlı nal kemerler.',
      },
      pointed: {
        name: 'Sivri kemer',
        steps: [
          'Açıklık AB’yi çiziyoruz.',
          'Pergeli açıklık kadar açıyoruz: merkezler üzengi noktalarının kendisidir — A ve B, yarıçap r = AB.',
          'Merkez A’da: B’den yukarı yay çiziyoruz.',
          'Merkez B’de: A’dan yukarı yay çiziyoruz. Yaylar C tepesinde kesişir; ABC eşkenar üçgendir, C’de eğri kırılır — kemer sivri olur.',
          'Taşları diziyoruz; tepede kilit taşı değil derz vardır — iki yarı birbirine yaslanır.',
        ],
        ex: 'İbn Tolun Camii, Kahire (876–879): bütün revakları sivri kemerlidir — sivri kemerin erken büyük örneklerinden.',
      },
      persian: {
        name: 'İran kemeri',
        steps: [
          'Açıklık AB’yi dört eşit parçaya bölüyoruz.',
          'Alt merkezler O₁ ve O₂ çeyrek noktalarıdır, yarıçap açıklığın dörtte biri. Üzengilerden 45° yay çiziyoruz (E noktalarına kadar).',
          'O₁E doğrusunu merkezin öte yanına uzatıyoruz: üst merkez O₃ bu doğru üzerinde, üzengi hattının altında, eksenin öbür yanında açıklığın 1/8’i kadar uzaktadır. O₄ onun ayna görüntüsüdür.',
          'O₃ ve O₄’ten büyük yaylar E’den tepe C’ye gider. E’de yaylar teğettir — geçiş yumuşaktır, tepe ise sivri.',
          'Taşları diziyoruz. Dört merkezli kemer alçak ve geniş açılır — eyvanlar için elverişlidir.',
        ],
        ex: 'Uluğ Bey Medresesi, Registan, Semerkant (1417–1420): Timurlu eyvanlarında dört merkezli kemer.',
      },
      multifoil: {
        name: 'Çok dilimli kemer',
        steps: [
          'Açıklık AB’yi çiziyoruz.',
          'O merkezli, AB çaplı yarım çemberi yardımcı çizgi olarak çiziyoruz.',
          'Yarım çemberi 7 eşit parçaya bölüyoruz. Her parçanın kirişinin ortası bir dilimin merkezidir.',
          'Her merkezden kirişin yarısı yarıçapla yarım çember çiziyoruz — dilimler dışa taşar, bölme noktalarında içe bakan dişler kalır.',
          'Taşlar O’dan ışınsal dizilir.',
        ],
        ex: 'Kurtuba Ulu Camii, II. Hakem’in genişletmesi (961–976) ve Zaragoza’daki Aljafería sarayı (XI. yüzyıl): birbirini kesen çok dilimli kemerler.',
      },
      ottoman: {
        name: 'Osmanlı kemeri',
        steps: [
          'Açıklığı beş eşit parçaya bölüyoruz (pencî — “beşli”).',
          'Merkezler M₁ ve M₂ orta parçanın uçlarıdır; yarıçap uzak üzengiye kadardır: r = 0,6 × açıklık.',
          'M₁ merkezinden B’den başlayan yayı çiziyoruz.',
          'M₂ merkezinden A’dan başlayan yayı çiziyoruz; C’de kesişirler — eşkenardan alçak, yumuşak sivri bir kemer.',
          'Taşları diziyoruz.',
        ],
        ex: 'Süleymaniye Camii, İstanbul (Mimar Sinan, 1550–1557): avlu revaklarında sivri kemerler.',
      },
    },
  },
}

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const sv = (p, k = PX_PER_M) => [p[0] * k, -p[1] * k]
const scaleArc = (arc, k) => ({ ...arc, cx: arc.cx * k, cy: arc.cy * k, r: arc.r * k })

/** Pərgar: iti uc mərkəzdə, qələm qövs üzərində, oynaq yuxarıda */
function Compass({ c, p }) {
  const dx = p[0] - c[0], dy = p[1] - c[1]
  const L = Math.hypot(dx, dy)
  if (L < 1) return null
  const leg = 0.62 * L + 16
  const h = Math.sqrt(Math.max(0, leg * leg - (L / 2) ** 2))
  // SVG-də (y aşağı) normalın "yuxarı" tərəfi
  let nx = dy / L, ny = -dx / L
  if (ny > 0) { nx = -nx; ny = -ny }
  const H = [(c[0] + p[0]) / 2 + nx * h, (c[1] + p[1]) / 2 + ny * h]
  return (
    <g className="ab__compass" aria-hidden="true">
      <line x1={H[0]} y1={H[1]} x2={c[0]} y2={c[1]} className="ab__leg" />
      <line x1={H[0]} y1={H[1]} x2={p[0]} y2={p[1]} className="ab__leg ab__leg--pen" />
      <circle cx={H[0]} cy={H[1]} r="4.5" className="ab__hinge" />
      <circle cx={p[0]} cy={p[1]} r="2.6" className="ab__nib" />
    </g>
  )
}

export default function ArchBuilder() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [type, setType] = useState('horseshoe')
  const [spanM, setSpanM] = useState(7.5)
  const [step, setStep] = useState(0)
  const [prog, setProg] = useState(1)       // cari addımın qövslərinin çəkilmiş hissəsi
  const [playing, setPlaying] = useState(false)
  const [running, setRunning] = useState(false)

  const g = useMemo(() => buildArch(type, spanM), [type, spanM])
  const vs = useMemo(() => voussoirs(g).map(poly => polyPath(poly.map(q => [q[0] * PX_PER_M, q[1] * PX_PER_M]))), [g])
  const last = g.steps - 1
  const info = u.types[type]

  // ── Animasiya: yalnız lazım olanda rAF; görünməzdə dayanır ──
  const rootRef = useRef(null)
  const rafRef = useRef(0)
  const st = useRef({ t: 0, last: 0, step: 0, playing: false, visible: true, dur: 1600, steps: 4 })
  st.current.step = step
  st.current.playing = playing
  st.current.steps = g.steps

  const stepItems = useCallback((k) => [...g.guides, ...g.arcs].filter(x => x.step === k), [g])
  const durOf = useCallback((k) => {
    const n = stepItems(k).length
    return n ? Math.min(3200, 1300 + 260 * (n - 1)) : 450
  }, [stepItems])

  const stopLoop = () => { cancelAnimationFrame(rafRef.current); rafRef.current = 0; setRunning(false) }
  const tick = useCallback((now) => {
    rafRef.current = 0
    const s = st.current
    const dt = s.last ? Math.min(50, now - s.last) : 0
    s.last = now
    s.t += dt
    const p = clamp01(s.t / s.dur)
    setProg(p)
    if (p >= 1) {
      if (!s.playing || s.step >= s.steps - 1) { s.pending = false; setPlaying(false); setRunning(false); return }
      if (s.t >= s.dur + HOLD_MS) {
        const nx = s.step + 1
        s.step = nx
        s.t = 0
        s.dur = durOf(nx)
        setStep(nx)
        setProg(0)
      }
    }
    if (s.visible && !document.hidden) rafRef.current = requestAnimationFrame(tick)
    else setRunning(false)
  }, [durOf])
  const startLoop = useCallback(() => {
    if (rafRef.current) return
    st.current.last = 0
    setRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])
  useEffect(() => {
    const el = rootRef.current
    let io = null
    const resume = () => { if (st.current.visible && !document.hidden && st.current.pending) startLoop() }
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => { st.current.visible = e.isIntersecting; if (e.isIntersecting) resume() })
      io.observe(el)
    }
    const onVis = () => { if (!document.hidden) resume() }
    document.addEventListener('visibilitychange', onVis)
    return () => { if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [startLoop])

  // Bir addıma keç (animate — həmin addımın qövslərini pərgarla çək)
  const goTo = useCallback((k, animate) => {
    const s = st.current
    s.step = k
    setStep(k)
    if (!animate || reduced) {
      cancelAnimationFrame(rafRef.current); rafRef.current = 0; setRunning(false)
      s.t = 0; s.dur = 1; s.pending = false
      setProg(1)
      return
    }
    s.t = 0
    s.dur = durOf(k)
    s.pending = true
    setProg(0)
    startLoop()
  }, [reduced, durOf, startLoop])

  // Hərəkət azaldılıbsa — son addım, animasiyasız
  useEffect(() => {
    if (!reduced) return
    setPlaying(false)
    goTo(st.current.steps - 1, false)
  }, [reduced, goTo])

  const pickType = (t) => {
    if (t === type) return
    setPlaying(false)
    st.current.playing = false
    setType(t)
    const n = buildArch(t, spanM).steps
    st.current.steps = n
    goTo(reduced ? n - 1 : 0, false)
  }
  const next = () => {
    setPlaying(false); st.current.playing = false
    if (step < last) goTo(step + 1, true)
  }
  const prev = () => {
    setPlaying(false); st.current.playing = false
    if (step > 0) goTo(step - 1, false)
  }
  const play = () => {
    if (playing) { setPlaying(false); st.current.playing = false; st.current.pending = false; stopLoop(); return }
    if (reduced) { goTo(last, false); return }
    setPlaying(true)
    st.current.playing = true
    if (step >= last && prog >= 1) goTo(0, true)
    else if (prog >= 1) goTo(step + 1, true)
    else { st.current.pending = true; startLoop() }
  }
  const onSpan = (v) => {
    setSpanM(v)
    if (!running) setProg(1)
  }

  // ── Çəkiliş ──
  const K = PX_PER_M
  const cur = stepItems(step)
  const weights = cur.map(x => arcSweep(x))
  const W = weights.reduce((s, x) => s + x, 0) || 1
  const fracOf = (item) => {
    if (item.step < step) return 1
    if (item.step > step) return 0
    const i = cur.indexOf(item)
    const before = weights.slice(0, i).reduce((s, x) => s + x, 0)
    return clamp01((prog * W - before) / weights[i])
  }
  let compass = null
  if (running && prog < 1) {
    const active = cur.find(x => { const f = fracOf(x); return f > 0 && f < 1 }) || cur.find(x => fracOf(x) === 0)
    if (active) {
      const f = fracOf(active)
      const sa = scaleArc(active, 1)
      compass = { c: sv([sa.cx, sa.cy]), p: sv(arcPoint(sa, sa.a0 + f * arcSweep(sa))) }
    }
  }
  const final = step === g.vStep
  const a = g.a * K
  const pierW = Math.max(14, 0.24 * a)
  const show = (x) => x.step <= step
  const colors = STONES[type]
  const fmtSpan = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(spanM)
  const textOf = info.steps[step]

  return (
    <section ref={rootRef} className="ui-card ab" aria-labelledby="ab-title" data-testid="arch-builder"
      data-arch={type} data-step={step} data-steps={g.steps}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="ab-title" className="ab__title">{u.title}</h2>
      <p className="ab__lead">{u.lead}</p>
      <div className="ab__chips" role="group" aria-label={u.title}>
        {ARCH_TYPES.map(t => (
          <button key={t} type="button" className="ui-chip" data-arch-btn={t} aria-pressed={type === t} onClick={() => pickType(t)}>
            {u.types[t].name}
          </button>
        ))}
      </div>
      <div className="ab__grid">
        <div className="ab__stage">
          <svg viewBox="-200 -262 400 372" className={`ab__svg${final ? ' is-final' : ''}${reduced ? ' is-still' : ''}`} role="img"
            aria-label={`${u.svg}: ${info.name}. ${u.step} ${step + 1}/${g.steps}. ${textOf}`}>
            {/* Dayaqlar (sütun/payə) */}
            <g className="ab__piers">
              <rect x={a} y="0" width={pierW} height="110" />
              <rect x={-a - pierW} y="0" width={pierW} height="110" />
              <rect x={a - 3} y="0" width={pierW + 6} height="7" className="ab__impost" />
              <rect x={-a - pierW - 3} y="0" width={pierW + 6} height="7" className="ab__impost" />
            </g>
            {/* Alfiz (Kordova) */}
            {g.alfiz && show(g.alfiz) && (
              <rect key={`alf-${type}`} className="ab__alfiz ab__in" x={g.alfiz.x0 * K} y={-g.alfiz.y1 * K}
                width={(g.alfiz.x1 - g.alfiz.x0) * K} height={(g.alfiz.y1 - g.alfiz.y0) * K} />
            )}
            {/* Tağ daşları */}
            {final && (
              <g className="ab__stones" key={`v-${type}`}>
                {vs.map((d, i) => (
                  <path key={i} d={d} fill={colors[i % 2]} className="ab__stone"
                    style={reduced ? undefined : { animationDelay: `${i * 55}ms` }} />
                ))}
              </g>
            )}
            {/* Qurulma xətləri */}
            <g className="ab__constr">
              {g.lines.filter(show).map(l => {
                const [x1, y1] = sv(l.from), [x2, y2] = sv(l.to)
                return <line key={`${type}-${l.id}`} x1={x1} y1={y1} x2={x2} y2={y2} className={`ab__line ab__line--${l.kind} ab__in`} />
              })}
              {g.guides.map(arc => {
                const f = fracOf(arc)
                return f > 0 ? <path key={`${type}-${arc.id}`} d={arcPath(scaleArc(arc, K), f)} className="ab__guide" /> : null
              })}
            </g>
            {/* Tağın daxili əyrisi */}
            {g.arcs.map(arc => {
              const f = fracOf(arc)
              return f > 0 ? <path key={`${type}-${arc.id}`} d={arcPath(scaleArc(arc, K), f)} className="ab__arc" /> : null
            })}
            {final && <path d={intradosPath({ arcs: g.arcs.map(x => scaleArc(x, K)) })} className="ab__intrados" />}
            {/* Ölçü: aşırım */}
            <text x="0" y="24" className="ab__dim">{fmtSpan} {u.m}</text>
            {/* Nöqtələr və mərkəzlər */}
            {g.marks.filter(show).map(m => {
              const [x, y] = sv(m.p)
              if (m.tick) return <line key={`${type}-${m.id}`} x1={x} y1={y - 6} x2={x} y2={y + 6} className="ab__tick ab__in" />
              return (
                <g key={`${type}-${m.id}`} className="ab__in">
                  <circle cx={x} cy={y} r="3.2" className="ab__pt" />
                  {m.label && <text x={x + (x < 0 ? -9 : 9)} y={y < -2 ? y - 8 : y + 18} className="ab__lbl" textAnchor="middle">{m.label}</text>}
                </g>
              )
            })}
            {g.centres.filter(show).map(c => {
              const [x, y] = sv(c.p)
              return (
                <g key={`${type}-${c.id}`} className="ab__in">
                  <circle cx={x} cy={y} r={c.small ? 2.4 : 4} className="ab__ctr" />
                  {!c.small && c.label && <text x={x + (x < 0 ? -11 : 11)} y={y - 8} className="ab__lbl ab__lbl--c" textAnchor="middle">{c.label}</text>}
                </g>
              )
            })}
            {compass && <Compass c={compass.c} p={compass.p} />}
            <text x="196" y="104" className="ab__mark" textAnchor="end">muslims.cc</text>
          </svg>
          <p className="ab__step" aria-live="polite">
            <b>{u.step} {step + 1}/{g.steps}.</b> {textOf}
          </p>
        </div>
        <div className="ab__panel">
          <div className="ab__btns">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={prev} disabled={step === 0} data-testid="ab-prev">
              <span className="ab__flip" aria-hidden="true"><Icon name="chevronLeft" size={16} /></span>{u.prev}
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={play} aria-pressed={playing} data-testid="ab-play">
              <Icon name={playing ? 'pause' : 'play'} size={16} />{playing ? u.pause : u.play}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={next} disabled={step >= last} data-testid="ab-next">
              {u.next}<span className="ab__flip ab__flip--r" aria-hidden="true"><Icon name="chevronLeft" size={16} /></span>
            </button>
          </div>
          <ol className="ab__list">
            {info.steps.map((s, i) => (
              <li key={i} className={i === step ? 'is-cur' : i < step ? 'is-done' : ''}>
                <button type="button" onClick={() => { setPlaying(false); st.current.playing = false; goTo(i, i === step + 1) }} aria-current={i === step ? 'step' : undefined}>
                  <span className="ab__n">{i + 1}</span><span>{s}</span>
                </button>
              </li>
            ))}
          </ol>
          <label className="ab__range">
            <span className="ab__rl"><span>{u.span}</span><output>{fmtSpan} {u.m}</output></span>
            <input type="range" min={SPAN_MIN} max={SPAN_MAX} step="0.5" value={spanM} data-testid="ab-span"
              onChange={e => onSpan(Number(e.target.value))} />
          </label>
          <p className="ab__ex"><b>{u.example}:</b> {info.ex}</p>
          <p className="ab__note">{u.note}</p>
        </div>
      </div>
    </section>
  )
}
