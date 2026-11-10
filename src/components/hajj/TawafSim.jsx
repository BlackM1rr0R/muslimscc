// ═══════════════════════════════════════════════════════
// TawafSim — təvaf simulyatoru (/hajjguide, "Təvaf simulyatoru" bölməsi)
//
//   • Yuxarıdan görünüş: Kəbə (örtük və qızılı kəmər), qapı şimal-şərq divarında,
//     Həcərül-Əsvəd şərq küncündə, Yəmani rüknü cənubda, Hicr (Hətim) şimal-qərbdə,
//     Məqami-İbrahim qapı tərəfdə; ətrafında mətaf halqası. İnsan təsviri YOXDUR.
//   • Barmaq/siçan ilə Kəbənin ətrafında saat əqrəbinin ƏKSİNƏ (Kəbə solda) çəkmək;
//     dövrə Həcərül-Əsvəd xəttindən yenidən keçəndə sayılır (utils/tawaf.js).
//   • Klaviatura: ←/→/↑/↓ — səkkizdə bir dövrə; Enter / düymə — tam dövrə.
//   • Hər dövrədə titrəmə + parıltı, aria-live elanı; 7-dən sonra yekun kartı.
//   • Qeydlər yalnız səhih/həsən mənbə ilə (mənbə nömrələri yoxlanıb).
// Stillər: ./TawafSim.css (sonsuz animasiya yoxdur).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { haptic } from '../../hooks/useHaptic'
import { isReduced } from '../../motion/reduced'
import Icon from '../Icon'
import {
  TAU, CIRCUITS, CORNERS, STONE_ANGLE, local, angleOf, createTawaf, grab, move, advanceBy, advanceCircuit,
  circuitsOf, currentCircuit, lapFraction, markerAngle, segmentAt,
} from '../../utils/tawaf'
import './TawafSim.css'

const P = (o, lang) => (o && (pickUi(o, lang, 'en') || o.az)) || ''

// ── İnterfeys ──
const T = {
  az: {
    label: 'Təvaf simulyatoru: Kəbənin ətrafında barmaqla saat əqrəbinin əksinə çəkin',
    howTo: 'Barmağınızla Kəbənin ətrafında saat əqrəbinin əksinə çəkin — Kəbə solunuzda qalsın. Klaviatura: oxlar və təsdiq düyməsi.',
    done: 'dövrə tamam', now: (n) => `İndi: ${n}-ci dövrə`, of: '/',
    next: 'Növbəti dövrə', demo: 'Bir dövrəni göstər', stop: 'Dayandır', reset: 'Yenidən başla',
    hint: 'Kəbə solunuzda olmalıdır — saat əqrəbinin əksinə gedin',
    circuitDone: (n) => `${n}-ci dövrə tamamlandı (${n} / 7)`,
    allDone: 'Təvaf tamamlandı: 7 dövrə',
    here: 'Yeriniz', notes: 'Qeyd', start: 'Başlanğıc: Həcərül-Əsvəd xətti',
  },
  en: {
    label: 'Tawaf simulator: drag counter-clockwise around the Kaaba',
    howTo: 'Drag your finger around the Kaaba counter-clockwise — keep the Kaaba on your left. Keyboard: arrow keys and Enter.',
    done: 'circuits done', now: (n) => `Now: circuit ${n}`, of: '/',
    next: 'Next circuit', demo: 'Show one circuit', stop: 'Stop', reset: 'Start again',
    hint: 'The Kaaba should be on your left — walk counter-clockwise',
    circuitDone: (n) => `Circuit ${n} complete (${n} / 7)`,
    allDone: 'Tawaf complete: 7 circuits',
    here: 'You are at', notes: 'Note', start: 'Start: the Black Stone line',
  },
  ru: {
    label: 'Симулятор тавафа: ведите пальцем вокруг Каабы против часовой стрелки',
    howTo: 'Ведите пальцем вокруг Каабы против часовой стрелки — Кааба должна быть слева от вас. Клавиатура: стрелки и клавиша ввода.',
    done: 'кругов пройдено', now: (n) => `Сейчас: круг ${n}`, of: '/',
    next: 'Следующий круг', demo: 'Показать один круг', stop: 'Стоп', reset: 'Начать заново',
    hint: 'Кааба должна быть слева — идите против часовой стрелки',
    circuitDone: (n) => `Круг ${n} завершён (${n} / 7)`,
    allDone: 'Таваф завершён: 7 кругов',
    here: 'Вы у места', notes: 'Примечание', start: 'Начало: линия Чёрного камня',
  },
  ar: {
    label: 'محاكي الطواف: اسحب حول الكعبة عكس اتجاه عقارب الساعة',
    howTo: 'اسحب بإصبعك حول الكعبة عكس عقارب الساعة، واجعل الكعبة عن يسارك. لوحة المفاتيح: الأسهم وزر الإدخال.',
    done: 'أشواط مكتملة', now: (n) => `الآن: الشوط ${n}`, of: '/',
    next: 'الشوط التالي', demo: 'اعرض شوطًا واحدًا', stop: 'إيقاف', reset: 'ابدأ من جديد',
    hint: 'اجعل الكعبة عن يسارك، وامشِ عكس عقارب الساعة',
    circuitDone: (n) => `اكتمل الشوط ${n} (${n} من ٧)`,
    allDone: 'اكتمل الطواف: سبعة أشواط',
    here: 'موضعك', notes: 'تنبيه', start: 'البداية: خط الحجر الأسود',
  },
  tr: {
    label: 'Tavaf simülatörü: Kâbe’nin etrafında saat yönünün tersine sürükleyin',
    howTo: 'Parmağınızla Kâbe’nin etrafında saat yönünün tersine sürükleyin; Kâbe solunuzda kalsın. Klavye: ok tuşları ve Enter.',
    done: 'şavt tamam', now: (n) => `Şimdi: ${n}. şavt`, of: '/',
    next: 'Sonraki şavt', demo: 'Bir şavtı göster', stop: 'Durdur', reset: 'Yeniden başla',
    hint: 'Kâbe solunuzda olmalı; saat yönünün tersine yürüyün',
    circuitDone: (n) => `${n}. şavt tamamlandı (${n} / 7)`,
    allDone: 'Tavaf tamamlandı: 7 şavt',
    here: 'Bulunduğunuz yer', notes: 'Not', start: 'Başlangıç: Hacerü’l-Esved hizası',
  },
}

// Xəritədəki adlar
const NAMES = {
  az: { stone: 'Həcərül-Əsvəd', yamani: 'Rüknü-Yəmani', hijr: 'Hicr (Hətim)', maqam: 'Məqami-İbrahim', door: 'Kəbənin qapısı' },
  en: { stone: 'Black Stone', yamani: 'Yemeni Corner', hijr: 'al-Hijr (Hatim)', maqam: 'Maqam Ibrahim', door: 'Kaaba door' },
  ru: { stone: 'Чёрный камень', yamani: 'Йеменский угол', hijr: 'Хиджр (Хатым)', maqam: 'Макам Ибрахим', door: 'Дверь Каабы' },
  ar: { stone: 'الحجر الأسود', yamani: 'الركن اليماني', hijr: 'الحِجْر (الحطيم)', maqam: 'مقام إبراهيم', door: 'باب الكعبة' },
  tr: { stone: 'Hacerü’l-Esved', yamani: 'Rükn-i Yemânî', hijr: 'Hicr (Hatîm)', maqam: 'Makam-ı İbrahim', door: 'Kâbe’nin kapısı' },
}

// Seqmentin adı (hacı harada)
const SEG = {
  az: { stone: 'Həcərül-Əsvəd xətti', door: 'Qapı divarı boyunca', hijr: 'Hicrin xaricindən', west: 'Şami rüknündən Yəmaniyə', between: 'Rüknü-Yəmani ilə Həcərül-Əsvəd arası', done: 'Təvaf tamam' },
  en: { stone: 'The Black Stone line', door: 'Along the door wall', hijr: 'Around the outside of al-Hijr', west: 'From the Syrian to the Yemeni Corner', between: 'Between the Yemeni Corner and the Black Stone', done: 'Tawaf complete' },
  ru: { stone: 'Линия Чёрного камня', door: 'Вдоль стены с дверью', hijr: 'Снаружи Хиджра', west: 'От Шамского угла к Йеменскому', between: 'Между Йеменским углом и Чёрным камнем', done: 'Таваф завершён' },
  ar: { stone: 'خط الحجر الأسود', door: 'بمحاذاة جدار الباب', hijr: 'من وراء الحِجْر', west: 'من الركن الشامي إلى اليماني', between: 'بين الركن اليماني والحجر الأسود', done: 'اكتمل الطواف' },
  tr: { stone: 'Hacerü’l-Esved hizası', door: 'Kapı duvarı boyunca', hijr: 'Hicr’in dışından', west: 'Rükn-i Şâmî’den Yemânî’ye', between: 'Rükn-i Yemânî ile Hacerü’l-Esved arası', done: 'Tavaf tamamlandı' },
}

// ── Dini qeydlər (mənbələr yoxlanıb; ərəb mətni dəyişməz) ──
const NOTE_STONE = {
  ar: 'اللَّهُ أَكْبَرُ',
  text: {
    az: 'Asanlıqla mümkündürsə, Həcərül-Əsvədə toxunun (istilam; Buxari 1603), deyilsə ona işarə edib «Allahu əkbər» deyin: Peyğəmbər ﷺ hər dəfə rüknə gələndə ona işarə edib təkbir deyərdi (Buxari 1613).',
    en: 'If it is easy, touch the Black Stone (istilam; al-Bukhari 1603); otherwise point to it and say “Allahu akbar”: each time the Prophet ﷺ came to the Corner he pointed to it and said takbir (al-Bukhari 1613).',
    ru: 'Если это легко, коснитесь Чёрного камня (истилям; аль-Бухари 1603), иначе укажите на него и скажите «Аллаху акбар»: каждый раз, подходя к углу, Пророк ﷺ указывал на него и произносил такбир (аль-Бухари 1613).',
    ar: 'إن تيسّر فاستلم الحجر الأسود (البخاري 1603)، وإلا فأشر إليه وقل: «الله أكبر»؛ كان النبي ﷺ كلما أتى الركن أشار إليه وكبّر (البخاري 1613).',
    tr: 'Kolaysa Hacerü’l-Esved’e dokunun (istilâm; Buhârî 1603); değilse ona işaret edip «Allahu ekber» deyin: Peygamber ﷺ rükne her gelişinde ona işaret eder ve tekbir getirirdi (Buhârî 1613).',
  },
}
const NOTE_BETWEEN = {
  ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
  meaning: {
    az: 'Rəbbimiz, bizə dünyada da, axirətdə də gözəllik ver və bizi atəş əzabından qoru (əl-Bəqərə 2:201).',
    en: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the punishment of the Fire (al-Baqarah 2:201).',
    ru: 'Господь наш, даруй нам в этом мире добро и в будущем добро и защити нас от наказания Огнём (аль-Бакара 2:201).',
    ar: 'سورة البقرة 2:201',
    tr: 'Rabbimiz, bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru (Bakara 2:201).',
  },
  text: {
    az: 'Abdullah ibn əs-Saib: «Peyğəmbərin ﷺ iki rükn arasında belə dediyini eşitdim» (Əbu Davud 1892; əl-Albani: həsən, Səhih Əbi Davud).',
    en: '‘Abdullah ibn as-Sa’ib said: “I heard the Messenger of Allah ﷺ say between the two Corners…” (Abu Dawud 1892; graded hasan by al-Albani in Sahih Abi Dawud).',
    ru: 'Абдуллах ибн ас-Саиб сказал: «Я слышал, как Посланник Аллаха ﷺ говорил между двумя углами…» (Абу Дауд 1892; аль-Албани: хасан, «Сахих Аби Дауд»).',
    ar: 'عن عبد الله بن السائب قال: سمعت رسول الله ﷺ يقول ما بين الركنين… (أبو داود 1892، وحسّنه الألباني في صحيح أبي داود).',
    tr: 'Abdullah b. es-Sâib: «Resûlullah’ın ﷺ iki rükün arasında şöyle dediğini işittim…» (Ebû Dâvûd 1892; Elbânî: hasen, Sahîhu Ebî Dâvûd).',
  },
}
const NOTE_HIJR = {
  az: 'Hicr Kəbənin bir hissəsidir (Buxari 1584) — ona görə təvaf onun xaricindən edilir, içindən keçilmir.',
  en: 'Al-Hijr is part of the House (al-Bukhari 1584), so the tawaf goes around its outside, not through it.',
  ru: 'Хиджр — часть Каабы (аль-Бухари 1584), поэтому таваф совершают снаружи него, а не через него.',
  ar: 'الحِجْر من البيت (البخاري 1584)، فيكون الطواف من ورائه لا من داخله.',
  tr: 'Hicr, Kâbe’nin bir parçasıdır (Buhârî 1584); bu yüzden tavaf onun dışından yapılır, içinden geçilmez.',
}
const NOTE_FREE = {
  az: 'Hər dövrə üçün xüsusi təyin olunmuş zikr və ya dua yoxdur — «1-ci dövrənin duası» kimi siyahılar sabit deyil. İstədiyiniz zikri, duanı edin, Quran oxuyun.',
  en: 'There is no specific dhikr or du‘a fixed for each circuit — lists such as “the du‘a of the first circuit” are not established. Make whatever dhikr and du‘a you wish, and recite the Qur’an.',
  ru: 'Для каждого круга нет особого установленного зикра или дуа — списки вроде «дуа первого круга» не подтверждены. Поминайте Аллаха, делайте любые дуа и читайте Коран.',
  ar: 'ليس لكل شوط ذكر أو دعاء مخصوص، وما يُذكر من «دعاء الشوط الأول» ونحوه لا يثبت. اذكر الله وادعُ بما شئت واقرأ القرآن.',
  tr: 'Her şavt için belirlenmiş özel bir zikir veya dua yoktur; «birinci şavtın duası» gibi listeler sabit değildir. Dilediğiniz zikri ve duayı yapın, Kur’an okuyun.',
}
// Rəml — bələdçinin öz mətni ilə uyğun (HajjGuidePage → tawaf.notes)
const NOTE_RAML = {
  az: 'Kişilər yalnız gəliş (qudum) təvafının və ya ümrə təvafının ilk 3 dövrəsində sürətli addımlarla (rəml) yeriyir (Buxari 1603, Müslim 1261); digər təvaflarda rəml yoxdur.',
  en: 'Men walk briskly (raml) only in the first 3 circuits of the arrival tawaf (qudum) or the umrah tawaf (al-Bukhari 1603, Muslim 1261); there is no raml in other tawafs.',
  ru: 'Мужчины быстро ходят (рамль) только в первых 3 кругах тавафа прибытия (кудум) или тавафа умры (аль-Бухари 1603, Муслим 1261); в других тавафах рамля нет.',
  ar: 'يُستحب للرجال الرمل (المشي السريع) في الأشواط الثلاثة الأولى من طواف القدوم أو طواف العمرة فقط (البخاري 1603، مسلم 1261)، ولا رمل في غيرهما.',
  tr: 'Erkekler yalnızca kudüm tavafının veya umre tavafının ilk 3 şavtında remel (hızlı yürüyüş) yapar (Buhârî 1603, Müslim 1261); diğer tavaflarda remel yoktur.',
}
const FINISH = {
  ar: 'وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى',
  title: { az: 'Yeddi dövrə tamamlandı', en: 'Seven circuits completed', ru: 'Семь кругов пройдено', ar: 'اكتملت الأشواط السبعة', tr: 'Yedi şavt tamamlandı' },
  text: {
    az: 'Təvafdan sonra Məqami-İbrahimin arxasında 2 rəkət namaz qılın: Peyğəmbər ﷺ Məqama gəlib bu ayəni oxudu və Məqam onunla Kəbə arasında olmaqla iki rəkət qıldı (Müslim 1218, Cabirin hədisi). Ayə: əl-Bəqərə 2:125.',
    en: 'After tawaf, pray 2 rak‘ahs behind Maqam Ibrahim: the Prophet ﷺ came to the Maqam, recited this verse and prayed two rak‘ahs with the Maqam between him and the House (Muslim 1218, the hadith of Jabir). Verse: al-Baqarah 2:125.',
    ru: 'После тавафа совершите 2 ракаата за Макамом Ибрахима: Пророк ﷺ подошёл к Макаму, прочитал этот аят и совершил два ракаата так, что Макам был между ним и Каабой (Муслим 1218, хадис Джабира). Аят: аль-Бакара 2:125.',
    ar: 'بعد الطواف صلِّ ركعتين خلف مقام إبراهيم؛ فقد نفذ النبي ﷺ إلى المقام فقرأ هذه الآية، وصلى ركعتين جاعلًا المقام بينه وبين البيت (مسلم 1218، حديث جابر). الآية: البقرة 2:125.',
    tr: 'Tavaftan sonra Makam-ı İbrahim’in arkasında 2 rekât namaz kılın: Peygamber ﷺ Makam’a gelip bu âyeti okudu ve Makam kendisiyle Kâbe arasında kalacak şekilde iki rekât kıldı (Müslim 1218, Câbir hadisi). Âyet: Bakara 2:125.',
  },
}

// ── Həndəsə (metr → SVG: y aşağı) ──
const S = (p) => ({ x: p.x, y: -p.y })
const pt = (p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`
const KAABA = ['stone', 'iraqi', 'shami', 'yamani'].map(k => S(CORNERS[k]))
// Örtük kəməri — daxilə bir qədər sıxılmış dördbucaq
const BAND = KAABA.map(p => ({ x: p.x * 0.8, y: p.y * 0.8 }))
const DOOR = [S(local(-5.85 + 1.6, 4.95)), S(local(-5.85 + 3.5, 4.95))]
const HIJR = (() => {
  const pts = []
  for (let i = 0; i <= 24; i++) {
    const t = 0.12 + (Math.PI - 0.24) * (i / 24)
    pts.push(S(local(5.85 + 0.4 + 7.6 * Math.sin(t), 4.5 * Math.cos(t))))
  }
  return pts
})()
const HIJR_LABEL = S(local(5.85 + 4.6, 0))
const MAQAM = S(local(-1.6, 4.95 + 10))
const R_TRACK = 21, R_IN = 17.2, R_OUT = 25.4
const polar = (a, r) => ({ x: r * Math.cos(a), y: -r * Math.sin(a) })
const STONE_IN = polar(STONE_ANGLE, Math.hypot(CORNERS.stone.x, CORNERS.stone.y))
const STONE_OUT = polar(STONE_ANGLE, R_OUT + 1.5)
const lab = (a, r) => polar(a, r)

/** Mətaf halqasında qövs: Həcərül-Əsvəd xəttindən saat əqrəbinin əksinə `frac` qədər */
function arcPath(frac, r) {
  if (frac <= 0) return ''
  if (frac >= 0.9999) {
    const a = polar(STONE_ANGLE, r), b = polar(STONE_ANGLE + Math.PI, r)
    return `M ${pt(a)} A ${r} ${r} 0 1 0 ${pt(b)} A ${r} ${r} 0 1 0 ${pt(a)}`
  }
  const a = polar(STONE_ANGLE, r), b = polar(STONE_ANGLE + frac * TAU, r)
  return `M ${pt(a)} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 0 ${pt(b)}`
}

const STEP_KEY = TAU / 8

export default function TawafSim() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const names = pickUi(NAMES, lang, 'en')
  const seg = pickUi(SEG, lang, 'en')

  const sim = useRef(createTawaf())
  const [progress, setProgress] = useState(0)
  const [hint, setHint] = useState(false)
  const [glow, setGlow] = useState(0)
  const [say, setSay] = useState('')
  const [demo, setDemo] = useState(false)
  const stageRef = useRef(null)
  const dragging = useRef(null)
  const raf = useRef(0)
  const demoRaf = useRef(0)
  const hintTimer = useRef(0)

  const flush = useCallback(() => {
    if (raf.current) return
    raf.current = requestAnimationFrame(() => { raf.current = 0; setProgress(sim.current.progress) })
  }, [])

  // Hadisələr: dövrə tamamlandı / geri hərəkət
  const apply = useCallback((r) => {
    sim.current = r.state
    if (r.completed.length) {
      const n = r.completed[r.completed.length - 1]
      haptic(n === CIRCUITS ? [30, 60, 30] : 22)
      setGlow(g => g + 1)
      setSay(n === CIRCUITS ? t.allDone : t.circuitDone(n))
      setHint(false)
    }
    if (r.backward) {
      setHint(true)
      clearTimeout(hintTimer.current)
      hintTimer.current = setTimeout(() => setHint(false), 2600)
    } else if (r.state.back === 0) setHint(false)
    flush()
  }, [flush, t])

  useEffect(() => () => {
    cancelAnimationFrame(raf.current); cancelAnimationFrame(demoRaf.current); clearTimeout(hintTimer.current)
  }, [])

  const stopDemo = useCallback(() => {
    cancelAnimationFrame(demoRaf.current); demoRaf.current = 0; setDemo(false)
  }, [])

  // Barmağın bucağı (riyazi: şərq 0, şimal +90°); mərkəzə çox yaxın nöqtə nəzərə alınmır
  const angleAt = (e) => {
    const r = stageRef.current.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2), y = (r.top + r.height / 2) - e.clientY
    if (Math.hypot(x, y) < r.width * 0.08) return null
    return Math.atan2(y, x)
  }
  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    stopDemo()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* köhnə brauzer */ }
    dragging.current = e.pointerId
    sim.current = grab(sim.current)
    const a = angleAt(e)
    if (a !== null) apply(move(sim.current, a))
  }
  const onMove = (e) => {
    if (dragging.current !== e.pointerId) return
    const a = angleAt(e)
    if (a !== null) apply(move(sim.current, a))
  }
  const onUp = (e) => { if (dragging.current === e.pointerId) dragging.current = null }

  // Klaviatura — fiziki istiqamət (RTL-də də ox sağa = saat əqrəbinin əksinə irəli)
  const onKey = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    let r = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') r = advanceBy({ ...sim.current, raw: sim.current.progress }, STEP_KEY)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') r = { state: sim.current, completed: [], backward: true }
    else if (e.key === 'Enter' || e.key === ' ' || e.key === 'PageUp') r = advanceCircuit(sim.current)
    if (!r) return
    e.preventDefault()
    e.stopPropagation()
    stopDemo()
    apply(r)
    if (!r.completed.length && !r.backward) setSay(`${seg[segmentAt(r.state.progress)]}`)
  }

  const nextCircuit = () => { stopDemo(); apply(advanceCircuit(sim.current)) }
  const reset = () => {
    stopDemo(); sim.current = createTawaf(); setProgress(0); setHint(false); setSay(''); setGlow(0)
  }
  const runDemo = () => {
    if (demoRaf.current) { stopDemo(); return }
    if (circuitsOf(sim.current.progress) >= CIRCUITS) return
    if (isReduced()) { apply(advanceCircuit(sim.current)); return }
    const from = sim.current.progress
    const to = (circuitsOf(from) + 1) * TAU
    const dur = 7000 * ((to - from) / TAU)
    const t0 = performance.now()
    setDemo(true)
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur)
      const target = from + (to - from) * k
      apply(advanceBy({ ...sim.current, raw: sim.current.progress }, target - sim.current.progress))
      if (k < 1) demoRaf.current = requestAnimationFrame(tick)
      else { demoRaf.current = 0; setDemo(false) }
    }
    demoRaf.current = requestAnimationFrame(tick)
  }

  const done = circuitsOf(progress)
  const finished = done >= CIRCUITS
  const lap = lapFraction(progress)
  const where = segmentAt(progress)
  const cur = currentCircuit(progress)
  const me = polar(markerAngle(progress), R_TRACK)
  const total = (done + (finished ? 0 : lap)) / CIRCUITS
  const RING = 2 * Math.PI * 26

  return (
    <div className={`tw${finished ? ' is-finished' : ''}`} data-testid="tawaf-sim">
      <div className="tw__grid">
        <div className="tw__stage-wrap">
          <div
            ref={stageRef}
            className="tw__stage"
            role="slider"
            tabIndex={0}
            aria-label={t.label}
            aria-valuemin={0}
            aria-valuemax={CIRCUITS}
            aria-valuenow={done}
            aria-valuetext={`${done} / ${CIRCUITS} — ${seg[where]}`}
            aria-keyshortcuts="ArrowRight ArrowUp Enter"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={onKey}
            data-testid="tawaf-stage"
          >
            <svg viewBox="-30 -30 60 60" className="tw__svg" aria-hidden="true" focusable="false">
              {/* Mətaf */}
              <circle className="tw__mataf" r="29" />
              <circle className="tw__band" r={(R_IN + R_OUT) / 2} strokeWidth={R_OUT - R_IN} />
              <circle className="tw__track" r={R_TRACK} />
              {lap > 0 && <path className="tw__lap" d={arcPath(lap, R_TRACK)} />}
              {/* Həcərül-Əsvəd xətti */}
              <line className="tw__line" x1={STONE_IN.x} y1={STONE_IN.y} x2={STONE_OUT.x} y2={STONE_OUT.y} />
              {/* Hicr (Hətim) */}
              <polyline className="tw__hijr" points={HIJR.map(pt).join(' ')} />
              {/* Məqami-İbrahim */}
              <g className="tw__maqam">
                <circle cx={MAQAM.x} cy={MAQAM.y} r="1.3" />
                <circle cx={MAQAM.x} cy={MAQAM.y} r="0.55" className="tw__maqam-in" />
              </g>
              {/* Kəbə: qara örtük, qızılı kəmər, qapı */}
              <polygon className="tw__kaaba" points={KAABA.map(pt).join(' ')} />
              <polygon className="tw__kiswa-band" points={BAND.map(pt).join(' ')} />
              <line className="tw__door" x1={DOOR[0].x} y1={DOOR[0].y} x2={DOOR[1].x} y2={DOOR[1].y} />
              <circle className="tw__stone" cx={KAABA[0].x} cy={KAABA[0].y} r="0.9" />
              <circle className="tw__yamani" cx={KAABA[3].x} cy={KAABA[3].y} r="0.7" />
              {/* Yazılar */}
              <g className="tw__labels">
                <text {...lab(STONE_ANGLE - 0.42, 12.2)} textAnchor="middle">{names.stone}</text>
                <text {...lab(angleOf(CORNERS.yamani), 10.4)} textAnchor="middle">{names.yamani}</text>
                <text x={HIJR_LABEL.x} y={HIJR_LABEL.y} textAnchor="middle">{names.hijr}</text>
                <text x={MAQAM.x} y={MAQAM.y - 2} textAnchor="middle">{names.maqam}</text>
              </g>
              {/* Hacı nöqtəsi (insan təsviri yoxdur) */}
              <g className="tw__me" style={{ transform: `translate(${me.x.toFixed(2)}px, ${me.y.toFixed(2)}px)` }}>
                <circle r="2.6" className="tw__me-halo" />
                <circle r="1.5" className="tw__me-dot" />
              </g>
            </svg>
            {glow > 0 && <span key={glow} className="tw__glow" aria-hidden="true" />}
          </div>
          <p className="tw__how"><Icon name="touch" size={16} /> <span>{t.howTo}</span></p>
        </div>

        <div className="tw__panel">
          {/* Sayğac */}
          <div className="tw__counter">
            <svg viewBox="0 0 60 60" className="tw__ring" aria-hidden="true">
              <circle cx="30" cy="30" r="26" className="tw__ring-bg" />
              <circle cx="30" cy="30" r="26" className="tw__ring-fill"
                style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - total) }} />
            </svg>
            <span className="tw__count">
              <b className="ui-num" data-testid="tawaf-count">{done}</b><span className="ui-num">{t.of}{CIRCUITS}</span>
            </span>
            <span className="tw__count-l">
              <span>{t.done}</span>
              {!finished && <span className="tw__now">{t.now(cur)}</span>}
            </span>
            <ol className="tw__dots" aria-hidden="true">
              {Array.from({ length: CIRCUITS }, (_, i) => (
                <li key={i} className={i < done ? 'is-done' : i === done ? 'is-cur' : undefined} />
              ))}
            </ol>
          </div>

          <div className="tw__actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={nextCircuit} disabled={finished} data-testid="tawaf-next">
              <Icon name="refresh" size={16} className="ui-btn__icon" /> {t.next}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={runDemo} disabled={finished} aria-pressed={demo}>
              <Icon name={demo ? 'pause' : 'play'} size={16} className="ui-btn__icon" /> {demo ? t.stop : t.demo}
            </button>
            {progress > 0 && (
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={reset}>{t.reset}</button>
            )}
          </div>

          <p className={`tw__hint${hint ? ' is-on' : ''}`} role="status" data-testid="tawaf-hint">{hint ? t.hint : ''}</p>

          {!finished && (
            <div className="tw__note" data-seg={where}>
              <span className="tw__where"><span>{t.here}:</span> <b>{progress === 0 ? t.start : seg[where]}</b></span>
              {where === 'stone' && (
                <>
                  <p className="tw__ar ui-arabic" lang="ar" dir="rtl">{NOTE_STONE.ar}</p>
                  <p>{P(NOTE_STONE.text, lang)}</p>
                </>
              )}
              {where === 'between' && (
                <>
                  <p className="tw__ar ui-arabic" lang="ar" dir="rtl">{NOTE_BETWEEN.ar}</p>
                  {lang !== 'ar' && <p className="tw__meaning">{P(NOTE_BETWEEN.meaning, lang)}</p>}
                  <p className="tw__src">{P(NOTE_BETWEEN.text, lang)}</p>
                </>
              )}
              {where === 'hijr' && <p>{P(NOTE_HIJR, lang)}</p>}
              {(where === 'door' || where === 'west') && <p>{P(NOTE_FREE, lang)}</p>}
              {cur <= 3 && <p className="tw__raml"><Icon name="info" size={14} /> <span>{P(NOTE_RAML, lang)}</span></p>}
            </div>
          )}

          {finished && (
            <div className="ui-card tw__finish" data-testid="tawaf-finish">
              <h3 className="tw__finish-h"><Icon name="check" size={20} strokeWidth={2.4} /> {P(FINISH.title, lang)}</h3>
              <p className="tw__ar ui-arabic" lang="ar" dir="rtl">{FINISH.ar}</p>
              <p>{P(FINISH.text, lang)}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={reset}>
                <Icon name="refresh" size={16} className="ui-btn__icon" /> {t.reset}
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="ui-sr-only" aria-live="polite" data-testid="tawaf-live">{say}</p>
    </div>
  )
}
