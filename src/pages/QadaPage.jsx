import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import { PRAYER_NAMES } from '../data/prayerTrackerText'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import { BarChart, ChartFigure, ProgressRing } from '../components/viz'
import QadaMountain from '../components/QadaMountain'
import {
  PRAYERS, QADA_V1_KEY, MAX_GOAL, loadQada, saveQada, loadLegacy, adjustOwed, setOwed, makeUp, undoMakeUp,
  applyEstimate, setGoal, qadaTotals, slotPct, lastDays, todayCount, daysToFinish, estimateDays,
  toBackup, fromBackup, emptyQada, isEmpty, dayKey,
} from '../utils/qada'
import { countRamadanDays, parseGKey, formatGregorian } from '../utils/hijri'
import '../styles/QadaPage.css'
import '../styles/ToolsMotion.css'
import Sparkle from '../components/prayer/Sparkle'
import { ringFrom } from '../components/prayer/ringFrom'
import { pickUi } from '../utils/uiText'
import QadaInsights from '../components/insights/QadaInsights'

// ═══════════════════════════════════════════════════════
// /qada — Qəza izləyicisi
//
// Qılınmamış 5 fərz namazın və tutulmamış Ramazan oruclarının sayğacı:
// təxmini hesablayıcı (tarixlərlə / əl ilə), "birini qıldım", gündəlik hədəf,
// son 30 günün qrafiki, JSON ehtiyat nüsxə. Hər şey yalnız bu cihazda
// (localStorage 'muslim_cc_qada_v1', utils/qada.js).
//
// Dəlillər (yoxlanılıb):
//  • Unudulan/yatılıb qaçırılan namaz — xatırlananda qılınır: Buxari 597,
//    Muslim 684 (hadith-api, ara-bukhari/597, ara-muslim 684.03).
//  • Qəsdən tərk — ixtilaf: əksəriyyət qəza vacib bilir; İbn Teymiyyə
//    (əl-İxtiyarat, s. 34) və İbn Useymin — qəza şəriətdə yoxdur, tövbə və
//    çoxlu nafilə; dəlil Muslim 1718. Mənbə: islamqa.info/en/answers/13664.
//  • Heyz/nifas — oruc qəza edilir, namaz yox: Muslim 335 (Aişə).
//  • Ramazan qəzası — 2:184–185; növbəti Ramazana qədər: Buxari 1950 (Aişə);
//    gecikdirmə və fidyə ixtilafı: islamqa.info/en/answers/26865, 39742.
// ═══════════════════════════════════════════════════════

const PRAYER_ICONS = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''))
const NUM_LOCALE = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar-u-nu-latn', tr: 'tr-TR' }
function fmtNum(n, lang) {
  try { return Number(n).toLocaleString(NUM_LOCALE[lang] || 'en-GB') } catch { return String(n) }
}
const fmtPct = (n) => (Math.round(n * 10) / 10).toString()

// IslamQA cavabları — dilin versiyası varsa həmin dildə (yoxlanılıb), yoxdursa ingiliscə
const QA_LANGS = {
  13664: ['ru', 'ar'],
  26865: ['ru', 'ar', 'tr'],
  39742: ['ar'],
}
const qaUrl = (n, lang) => `https://islamqa.info/${QA_LANGS[n].includes(lang) ? lang : 'en'}/answers/${n}`

// ── Ərəbcə mətnlər (dəlil) ──
const AR = {
  forgot: 'مَنْ نَسِيَ صَلَاةً أَوْ نَامَ عَنْهَا فَكَفَّارَتُهَا أَنْ يُصَلِّيَهَا إِذَا ذَكَرَهَا',
  bid: 'مَنْ عَمِلَ عَمَلًا لَيْسَ عَلَيْهِ أَمْرُنَا فَهُوَ رَدٌّ',
  hayd: 'كَانَ يُصِيبُنَا ذَلِكَ فَنُؤْمَرُ بِقَضَاءِ الصَّوْمِ وَلَا نُؤْمَرُ بِقَضَاءِ الصَّلَاةِ',
  ayah: 'فَمَن كَانَ مِنكُم مَّرِيضًا أَوْ عَلَىٰ سَفَرٍ فَعِدَّةٌ مِّنْ أَيَّامٍ أُخَرَ',
  aisha: 'كَانَ يَكُونُ عَلَيَّ الصَّوْمُ مِنْ رَمَضَانَ، فَمَا أَسْتَطِيعُ أَنْ أَقْضِيَ إِلَّا فِي شَعْبَانَ',
}

// ── v3: hero statistikası, "necə işləyir" addımları, borcun bölgüsü qrafiki ──
const V3 = {
  az: { how: 'Üç addım: 1) təxmini hesablayıcı ilə borcu tapın, 2) gündəlik hədəf qoyun, 3) hər qəza namazından sonra «Birini qıldım»a toxunun.', owed: 'qalan namaz', done: 'qəza edildi', fasts: 'qalan oruc', days: 'gün (təxmini)', ring: 'Ümumi irəliləyiş', ringSub: '{d} / {t} namaz', stepsTitle: 'Necə işləyir?', s1: 'Borcu hesablayın', s1t: 'Tarixlərlə və ya əl ilə — dəqiq bilmirsinizsə, ehtiyatlı təxmin yazın.', s2: 'Hədəf qoyun', s2t: 'Məsələn, hər fərzlə bir qəza — gündə 5. Qrafik tempi göstərir.', s3: 'Qəza etdikcə azaldın', s3t: 'Hər qəzadan sonra bir toxunuş; səhv olsa, «Geri al».', chartTitle: 'Namazlar üzrə qalan borc', chartSub: 'hər fərz namaz üçün ayrıca' },
  en: { how: 'Three steps: 1) find your total with the estimator, 2) set a daily goal, 3) tap “I made one up” after each make-up prayer.', owed: 'prayers left', done: 'made up', fasts: 'fasts left', days: 'days (approx.)', ring: 'Overall progress', ringSub: '{d} / {t} prayers', stepsTitle: 'How it works', s1: 'Estimate what you owe', s1t: 'By dates or manually — if unsure, enter a cautious estimate.', s2: 'Set a goal', s2t: 'For example one make-up with each obligatory prayer — 5 a day. The chart shows your pace.', s3: 'Count down as you make up', s3t: 'One tap after each make-up; if you slip, use “Undo”.', chartTitle: 'Remaining by prayer', chartSub: 'a separate count for each obligatory prayer' },
  ru: { how: 'Три шага: 1) оцените долг калькулятором, 2) задайте цель на день, 3) после каждого восполненного намаза нажимайте «Восполнил один».', owed: 'намазов осталось', done: 'восполнено', fasts: 'постов осталось', days: 'дней (примерно)', ring: 'Общий прогресс', ringSub: '{d} / {t} намазов', stepsTitle: 'Как это работает', s1: 'Оцените долг', s1t: 'По датам или вручную — если не уверены, укажите осторожную оценку.', s2: 'Задайте цель', s2t: 'Например, по одному восполнению с каждым обязательным намазом — 5 в день. График покажет темп.', s3: 'Уменьшайте по мере возмещения', s3t: 'Одно нажатие после каждого возмещения; ошиблись — «Отменить».', chartTitle: 'Остаток по намазам', chartSub: 'отдельно для каждого обязательного намаза' },
  ar: { how: 'ثلاث خطوات: 1) قدّر ما عليك بالحاسبة، 2) ضع هدفًا يوميًا، 3) اضغط «قضيتُ واحدة» بعد كل صلاة مقضية.', owed: 'صلاة متبقية', done: 'تم قضاؤها', fasts: 'يوم صيام متبقٍ', days: 'يومًا (تقريبًا)', ring: 'التقدم العام', ringSub: '{d} / {t} صلاة', stepsTitle: 'كيف تعمل؟', s1: 'قدّر ما عليك', s1t: 'بالتواريخ أو يدويًا — وإن لم تتيقن فاكتب تقديرًا احتياطيًا.', s2: 'ضع هدفًا', s2t: 'مثلًا: صلاة مقضية مع كل فريضة — خمس في اليوم. ويُظهر الرسم وتيرتك.', s3: 'أنقص كلما قضيت', s3t: 'ضغطة بعد كل قضاء؛ وإن أخطأت فاضغط «تراجع».', chartTitle: 'المتبقي لكل صلاة', chartSub: 'عدّاد مستقل لكل فريضة' },
  tr: { how: 'Üç adım: 1) tahmini hesaplayıcıyla borcu bulun, 2) günlük hedef koyun, 3) her kaza namazından sonra «Birini kıldım»a dokunun.', owed: 'kalan namaz', done: 'kaza edildi', fasts: 'kalan oruç', days: 'gün (tahmini)', ring: 'Genel ilerleme', ringSub: '{d} / {t} namaz', stepsTitle: 'Nasıl çalışır?', s1: 'Borcu hesaplayın', s1t: 'Tarihlerle veya elle — emin değilseniz ihtiyatlı bir tahmin yazın.', s2: 'Hedef koyun', s2t: 'Örneğin her farzla bir kaza — günde 5. Grafik hızınızı gösterir.', s3: 'Kaza ettikçe azaltın', s3t: 'Her kazadan sonra bir dokunuş; yanlışlıkta «Geri al».', chartTitle: 'Namazlara göre kalan borç', chartSub: 'her farz namaz için ayrı' },
}

const LABELS = {
  az: {
    title: 'Qəza izləyicisi',
    lead: 'Qılınmamış fərz namazlarınızı və tutulmamış Ramazan oruclarınızı sakitcə qeyd edin, qəza etdikcə azaldın. Bu, sizinlə Rəbbiniz arasındadır.',
    privacy: 'Bütün qeydlər yalnız bu cihazda saxlanır — hesab, server, bulud yoxdur. Cihazı dəyişəcəksinizsə, aşağıdan ehtiyat nüsxə yükləyin.',
    saveFail: 'Brauzer yaddaşa yazmağa icazə vermir (gizli rejim ola bilər). Dəyişikliklər səhifə bağlananda itəcək.',
    countersTitle: 'Borcdakı namazlar',
    countersLead: 'Hər fərz namaz üçün ayrıca say. Birini qəza edəndə "Birini qıldım" düyməsinə toxunun.',
    fasts: 'Ramazan orucları',
    madeOne: 'Birini qıldım', fastMadeOne: 'Birini tutdum', undo: 'Geri al',
    dec: '{p}: bir azalt', inc: '{p}: bir artır', countLabel: '{p} — qalan say',
    left: 'qalıb', doneOf: '{d} qəza edildi · {pct}%',
    goalTitle: 'Gündəlik hədəf', goalLabel: 'Gündə neçə qəza namazı', goalHint: 'Məsələn, hər fərz namazla birlikdə bir qəza — gündə 5.',
    todayLine: 'Bu gün: {n} / {g}', goalDone: 'Bugünkü hədəfə çatdınız. Allah qəbul etsin.',
    finishIn: 'Bu templə qalan {n} namaz təxminən {d} günə tamamlanar.', nothingLeft: 'Qeyd olunmuş namaz borcu yoxdur.',
    overall: 'Namazlar üzrə ümumi irəliləyiş', fastsProgress: 'Oruclar üzrə irəliləyiş',
    historyTitle: 'Son 30 gün', legendP: 'Qəza namazı', legendF: 'Qəza orucu', legendGoal: 'Hədəf',
    dayAria: '{d}: {p} namaz, {f} oruc', noHistory: 'Hələ qeyd yoxdur — ilk qəzadan sonra burada görünəcək.',
    estTitle: 'Təxmini hesablayıcı',
    estLead: 'Dəqiq sayı bilmirsinizsə, ən yaxşı təxmininizi yazın — sonra istənilən vaxt düzəldə bilərsiniz.',
    modeDates: 'Tarixlərlə', modeManual: 'Əl ilə', modeGroup: 'Hesablama üsulu',
    from: 'Mükəlləfiyyətin başlanğıcı', fromHint: 'Həddi-büluğa çatdığınız (yetkinlik əlamətlərinin ilk göründüyü) təxmini tarix.',
    to: 'Namazı müntəzəm qılmağa başladığınız tarix',
    subtract: 'Çıxılacaq günlər',
    subtractHint: 'Bu aralıqda namaz qıldığınızı bildiyiniz günlər; qadınlar üçün həmçinin heyz və nifas günləri — o günlərin namazı qəza edilmir.',
    ramadanFound: 'Bu aralıqda {n} Ramazan günü var (Ümmül-Qura təqvimi ilə).',
    fasted: 'Tutduğunuz Ramazan günləri', fastedHint: 'Üzrlü tutulmayan günlər də borcdur (xəstəlik, səfər, heyz, nifas).',
    result: 'Nəticə: hər fərz namaz üçün {p}, Ramazan orucu — {f}.',
    badRange: 'Başlanğıc tarixi son tarixdən əvvəl olmalıdır.',
    addBtn: 'Sayğaclara əlavə et', setBtn: 'Sayğacları bununla əvəz et',
    confirmSet: 'Mövcud saylar bu nəticə ilə əvəz olunsun?',
    applied: 'Sayğaclar yeniləndi.',
    manualLead: 'Hər namaz üçün qalan sayı birbaşa yazın.', samePrayers: 'Bütün namazlara eyni say', saveManual: 'Yadda saxla',
    rulesTitle: 'Hökmlər və dəlillər',
    sleepTitle: 'Yuxu və ya unutqanlıq səbəbindən qaçırılan namaz',
    sleepText: 'Xatırlayan və ya oyanan kimi qılınır — bunun başqa kəffarəsi yoxdur.',
    sleepTr: '"Kim bir namazı unudarsa və ya onu yatıb qaçırarsa, onun kəffarəsi xatırladığı zaman onu qılmasıdır."',
    sleepSrc: 'Muslim 684; həmçinin Buxari 597',
    deliberateTitle: 'Qəsdən tərk edilmiş namazlar — alimlərin ixtilafı',
    deliberateIntro: 'Namazı qəsdən vaxtından keçirmək böyük günahdır; səmimi tövbə hər iki baxışda vacibdir. Fərq qəzanın özündədir:',
    viewMajority: 'Alimlərin əksəriyyəti: qəsdən tərk edilmiş namazlar da qəza edilməlidir.',
    viewIbnT: 'Şeyxul-İslam İbn Teymiyyə və Şeyx İbn Useymin: vaxtı qəsdən keçirilmiş namazın qəzası şəriətdə yoxdur və qəbul olunmur. İnsan səmimi tövbə edir, namazı vaxtında qılmağa bərk yapışır və nafilə namazları çoxaldır.',
    bidTr: '"Kim bizim işimizə uyğun olmayan bir əməl edərsə, o, rədd olunur."',
    bidSrc: 'Muslim 1718 — İbn Useyminin dəlili',
    ibnTSrc: 'İbn Teymiyyə, «əl-İxtiyarat», s. 34',
    deliberateNote: 'Bu izləyici qəza etməyi seçənlər üçündür. İkinci baxışa əməl edirsinizsə, əsas olan tövbə və nafilələri artırmaqdır. Öz vəziyyətiniz üçün etibar etdiyiniz alimdən soruşun.',
    haydTitle: 'Heyz və nifas',
    haydText: 'Qadın heyz və nifas günlərində qılmadığı namazları qəza etmir, tutmadığı orucları isə qəza edir.',
    haydTr: '"Bu (heyz) bizə də olurdu; bizə orucu qəza etmək əmr olunurdu, namazı qəza etmək isə əmr olunmurdu."',
    haydSrc: 'Aişə (Allah ondan razı olsun) — Muslim 335',
    fastTitle: 'Ramazan orucunun qəzası',
    fastText: 'Xəstəlik, səfər və ya başqa üzrlə tutulmayan Ramazan günləri sonra sayı qədər qəza edilir və növbəti Ramazana qədər tamamlanmalıdır.',
    ayahTr: '"Sizdən kim xəstə və ya səfərdə olarsa, (tutmadığı günlərin) sayı qədər başqa günlərdə (oruc tutsun)."',
    ayahSrc: 'əl-Bəqərə 2:184; həmçinin 2:185',
    aishaTr: '"Üzərimdə Ramazandan oruc borcu olurdu və mən onu yalnız Şabanda qəza edə bilirdim."',
    aishaSrc: 'Aişə (Allah ondan razı olsun) — Buxari 1950',
    delayText: 'Üzrsüz olaraq növbəti Ramazana qədər gecikdirmək günahdır: tövbə edilir və oruclar yenə qəza olunur. Bundan əlavə hər gün üçün bir yoxsulu yedirtməyin (fidyə) vacibliyində ixtilaf var: əksəriyyət vacib bilir, bəzi alimlər isə yalnız qəzanı kifayət sayır.',
    sourcesLabel: 'Ətraflı:',
    disclaimer: 'Bu səhifə fətva deyil — şəxsi vəziyyətiniz üçün etibar etdiyiniz alimə müraciət edin.',
    backupTitle: 'Ehtiyat nüsxə',
    backupLead: 'Məlumat yalnız bu brauzerdədir və brauzerin yaddaşı təmizlənərsə itə bilər. JSON faylını yükləyib özünüzdə saxlayın.',
    exportBtn: 'Faylı yüklə', importBtn: 'Fayldan bərpa et',
    importConfirm: 'Fayldakı məlumat cari sayları əvəz edəcək. Davam edilsin?',
    importOk: 'Məlumat bərpa olundu.', importBad: 'Fayl tanınmadı — Muslims.cc qəza ehtiyat nüsxəsini seçin.',
    legacyText: 'Namaz izləyicisində qəza sayları var: {p} namaz, {f} oruc.', legacyBtn: 'Buraya köçür',
    legacyConfirm: 'Cari saylar namaz izləyicisindəki saylarla əvəz olunsun?',
    resetBtn: 'Hamısını sıfırla', resetConfirm: 'Bütün saylar və tarixçə silinsin? Bunu geri qaytarmaq olmaz.',
  },
  en: {
    title: 'Qada tracker',
    lead: 'Quietly record the obligatory prayers you missed and the Ramadan fasts you did not keep, and reduce them as you make them up. This is between you and your Lord.',
    privacy: 'Everything is stored only on this device — no account, no server, no cloud. If you change devices, download a backup below.',
    saveFail: 'Your browser does not allow saving (possibly private mode). Changes will be lost when the page closes.',
    countersTitle: 'Prayers owed',
    countersLead: 'A separate count for each obligatory prayer. When you make one up, tap "I made one up".',
    fasts: 'Ramadan fasts',
    madeOne: 'I made one up', fastMadeOne: 'I fasted one', undo: 'Undo',
    dec: '{p}: decrease by one', inc: '{p}: increase by one', countLabel: '{p} — remaining',
    left: 'left', doneOf: '{d} made up · {pct}%',
    goalTitle: 'Daily goal', goalLabel: 'Make-up prayers per day', goalHint: 'For example, one make-up prayer with each obligatory prayer — 5 a day.',
    todayLine: 'Today: {n} / {g}', goalDone: 'You reached today’s goal. May Allah accept it.',
    finishIn: 'At this pace the remaining {n} prayers would take about {d} days.', nothingLeft: 'No prayers recorded as owed.',
    overall: 'Overall progress — prayers', fastsProgress: 'Progress — fasts',
    historyTitle: 'Last 30 days', legendP: 'Make-up prayers', legendF: 'Make-up fasts', legendGoal: 'Goal',
    dayAria: '{d}: {p} prayers, {f} fasts', noHistory: 'Nothing yet — your first make-up will appear here.',
    estTitle: 'Estimator',
    estLead: 'If you do not know the exact number, enter your best estimate — you can correct it at any time.',
    modeDates: 'By dates', modeManual: 'Manually', modeGroup: 'Method',
    from: 'Start of obligation', fromHint: 'The approximate date you reached puberty (when its signs first appeared).',
    to: 'Date you began praying regularly',
    subtract: 'Days to subtract',
    subtractHint: 'Days in this range on which you know you prayed; for women also days of menstruation and postnatal bleeding — prayers of those days are not made up.',
    ramadanFound: 'This range contains {n} days of Ramadan (Umm al-Qura calendar).',
    fasted: 'Ramadan days you fasted', fastedHint: 'Days missed with a valid excuse are also owed (illness, travel, menstruation, postnatal bleeding).',
    result: 'Result: {p} of each obligatory prayer, {f} Ramadan fasts.',
    badRange: 'The start date must be before the end date.',
    addBtn: 'Add to counters', setBtn: 'Replace counters with this',
    confirmSet: 'Replace the current counts with this result?',
    applied: 'Counters updated.',
    manualLead: 'Type the remaining count for each prayer directly.', samePrayers: 'Same number for all prayers', saveManual: 'Save',
    rulesTitle: 'Rulings and evidence',
    sleepTitle: 'A prayer missed through sleep or forgetfulness',
    sleepText: 'It is prayed as soon as one remembers or wakes up — there is no other expiation for it.',
    sleepTr: '"Whoever forgets a prayer or sleeps through it, its expiation is to pray it when he remembers it."',
    sleepSrc: 'Muslim 684; also al-Bukhari 597',
    deliberateTitle: 'Prayers abandoned deliberately — a difference among scholars',
    deliberateIntro: 'Deliberately letting a prayer pass its time is a major sin, and sincere repentance is required on both views. The difference concerns making it up:',
    viewMajority: 'The majority of scholars: deliberately abandoned prayers must also be made up.',
    viewIbnT: 'Shaykh al-Islam Ibn Taymiyyah and Shaykh Ibn Uthaymin: making up a prayer whose time was let pass deliberately is not prescribed and is not accepted. The person repents sincerely, holds firmly to praying on time and increases in voluntary prayers.',
    bidTr: '"Whoever does a deed that is not in accordance with our matter, it is rejected."',
    bidSrc: 'Muslim 1718 — cited by Ibn Uthaymin',
    ibnTSrc: 'Ibn Taymiyyah, al-Ikhtiyarat, p. 34',
    deliberateNote: 'This tracker is for those who choose to make up. If you follow the second view, what matters is repentance and increasing voluntary prayers. Ask a scholar you trust about your own situation.',
    haydTitle: 'Menstruation and postnatal bleeding',
    haydText: 'A woman does not make up the prayers of her days of menstruation and postnatal bleeding, but she does make up the fasts.',
    haydTr: '"That used to happen to us, and we were commanded to make up the fasts but not commanded to make up the prayers."',
    haydSrc: 'Aishah (may Allah be pleased with her) — Muslim 335',
    fastTitle: 'Making up Ramadan fasts',
    fastText: 'Days of Ramadan missed through illness, travel or another excuse are made up later, day for day, and should be completed before the next Ramadan.',
    ayahTr: '"Whoever among you is ill or on a journey — then an equal number of other days."',
    ayahSrc: 'al-Baqarah 2:184; also 2:185',
    aishaTr: '"I would owe fasts from Ramadan and I could not make them up except in Shaban."',
    aishaSrc: 'Aishah (may Allah be pleased with her) — al-Bukhari 1950',
    delayText: 'Delaying them until the next Ramadan without an excuse is a sin: one repents and still makes up the fasts. Scholars differ on whether feeding a poor person for each day (fidyah) is also required: the majority say it is, while some consider making up alone sufficient.',
    sourcesLabel: 'Further reading:',
    disclaimer: 'This page is not a fatwa — consult a scholar you trust about your own situation.',
    backupTitle: 'Backup',
    backupLead: 'The data lives only in this browser and may be lost if browser storage is cleared. Download the JSON file and keep it yourself.',
    exportBtn: 'Download file', importBtn: 'Restore from file',
    importConfirm: 'The data in the file will replace the current counts. Continue?',
    importOk: 'Data restored.', importBad: 'File not recognised — choose a Muslims.cc qada backup.',
    legacyText: 'The prayer tracker has make-up counts: {p} prayers, {f} fasts.', legacyBtn: 'Move them here',
    legacyConfirm: 'Replace the current counts with those from the prayer tracker?',
    resetBtn: 'Reset everything', resetConfirm: 'Delete all counts and history? This cannot be undone.',
  },
  ru: {
    title: 'Учёт возмещения намазов',
    lead: 'Спокойно отметьте пропущенные обязательные намазы и дни Рамадана, в которые вы не постились, и уменьшайте счёт по мере возмещения. Это — между вами и вашим Господом.',
    privacy: 'Все записи хранятся только на этом устройстве — без аккаунта, сервера и облака. Если смените устройство, скачайте резервную копию ниже.',
    saveFail: 'Браузер не разрешает сохранять данные (возможно, приватный режим). Изменения пропадут после закрытия страницы.',
    countersTitle: 'Невосполненные намазы',
    countersLead: 'Отдельный счёт для каждого обязательного намаза. Восполнив один, нажмите «Восполнил один».',
    fasts: 'Посты Рамадана',
    madeOne: 'Восполнил один', fastMadeOne: 'Отпостился один', undo: 'Отменить',
    dec: '{p}: уменьшить на один', inc: '{p}: увеличить на один', countLabel: '{p} — осталось',
    left: 'осталось', doneOf: 'восполнено {d} · {pct}%',
    goalTitle: 'Цель на день', goalLabel: 'Возмещаемых намазов в день', goalHint: 'Например, по одному возмещению с каждым обязательным намазом — 5 в день.',
    todayLine: 'Сегодня: {n} / {g}', goalDone: 'Цель на сегодня достигнута. Да примет Аллах.',
    finishIn: 'В таком темпе оставшиеся {n} намазов займут около {d} дней.', nothingLeft: 'Долгов по намазам не отмечено.',
    overall: 'Общий прогресс — намазы', fastsProgress: 'Прогресс — посты',
    historyTitle: 'Последние 30 дней', legendP: 'Возмещённые намазы', legendF: 'Возмещённые посты', legendGoal: 'Цель',
    dayAria: '{d}: намазов {p}, постов {f}', noHistory: 'Пока пусто — здесь появится ваше первое возмещение.',
    estTitle: 'Примерный расчёт',
    estLead: 'Если точное число неизвестно, укажите наилучшую оценку — исправить её можно в любой момент.',
    modeDates: 'По датам', modeManual: 'Вручную', modeGroup: 'Способ расчёта',
    from: 'Начало обязанности', fromHint: 'Примерная дата совершеннолетия (когда впервые появились его признаки).',
    to: 'Дата, с которой вы молитесь регулярно',
    subtract: 'Вычесть дней',
    subtractHint: 'Дни этого периода, в которые вы точно молились; для женщин также дни менструации и послеродового кровотечения — намазы этих дней не возмещаются.',
    ramadanFound: 'В этом периоде {n} дней Рамадана (по календарю Умм аль-Кура).',
    fasted: 'Дни Рамадана, в которые вы постились', fastedHint: 'Дни, пропущенные по уважительной причине, тоже возмещаются (болезнь, поездка, менструация, послеродовое кровотечение).',
    result: 'Итог: по {p} каждого обязательного намаза, постов Рамадана — {f}.',
    badRange: 'Начальная дата должна быть раньше конечной.',
    addBtn: 'Добавить к счётчикам', setBtn: 'Заменить счётчики этим',
    confirmSet: 'Заменить текущие значения этим результатом?',
    applied: 'Счётчики обновлены.',
    manualLead: 'Введите оставшееся число для каждого намаза.', samePrayers: 'Одно число для всех намазов', saveManual: 'Сохранить',
    rulesTitle: 'Положения и доводы',
    sleepTitle: 'Намаз, пропущенный из-за сна или забывчивости',
    sleepText: 'Его совершают, как только вспомнят или проснутся, — другого искупления нет.',
    sleepTr: '«Кто забыл намаз или проспал его, то искупление этого — совершить его, когда вспомнит».',
    sleepSrc: 'Муслим 684; также аль-Бухари 597',
    deliberateTitle: 'Намазы, оставленные намеренно, — разногласие учёных',
    deliberateIntro: 'Намеренно пропустить время намаза — тяжкий грех, и искреннее покаяние обязательно при обоих мнениях. Разногласие касается самого возмещения:',
    viewMajority: 'Большинство учёных: намеренно оставленные намазы тоже нужно возместить.',
    viewIbnT: 'Шейх аль-Ислам Ибн Таймия и шейх Ибн Усаймин: возмещение намаза, время которого пропущено намеренно, не узаконено и не принимается. Человек искренне кается, крепко держится за намаз в его время и увеличивает добровольные намазы.',
    bidTr: '«Кто совершит дело, не соответствующее нашему делу, оно будет отвергнуто».',
    bidSrc: 'Муслим 1718 — довод Ибн Усаймина',
    ibnTSrc: 'Ибн Таймия, «аль-Ихтиярат», с. 34',
    deliberateNote: 'Этот учёт — для тех, кто выбрал возмещение. Если вы следуете второму мнению, главное — покаяние и умножение добровольных намазов. Спросите о своём положении учёного, которому доверяете.',
    haydTitle: 'Менструация и послеродовое кровотечение',
    haydText: 'Женщина не возмещает намазы дней менструации и послеродового кровотечения, но возмещает посты.',
    haydTr: '«Это случалось с нами, и нам велели возмещать пост, но не велели возмещать намаз».',
    haydSrc: 'Аиша (да будет доволен ею Аллах) — Муслим 335',
    fastTitle: 'Возмещение постов Рамадана',
    fastText: 'Дни Рамадана, пропущенные из-за болезни, поездки или иной причины, возмещаются позже день за день и должны быть восполнены до следующего Рамадана.',
    ayahTr: '«А если кто-либо из вас болен или в пути, то пусть постится столько же дней в другое время».',
    ayahSrc: 'аль-Бакара 2:184; также 2:185',
    aishaTr: '«На мне бывал долг по посту Рамадана, и я могла возместить его только в шабане».',
    aishaSrc: 'Аиша (да будет доволен ею Аллах) — аль-Бухари 1950',
    delayText: 'Откладывать до следующего Рамадана без уважительной причины — грех: нужно покаяться и всё равно возместить посты. Обязательно ли ещё кормить бедняка за каждый день (фидья) — разногласие: большинство считают это обязательным, а некоторые учёные — достаточно одного возмещения.',
    sourcesLabel: 'Подробнее:',
    disclaimer: 'Эта страница — не фетва: о своём положении спросите учёного, которому доверяете.',
    backupTitle: 'Резервная копия',
    backupLead: 'Данные хранятся только в этом браузере и могут пропасть при очистке хранилища. Скачайте файл JSON и храните его у себя.',
    exportBtn: 'Скачать файл', importBtn: 'Восстановить из файла',
    importConfirm: 'Данные из файла заменят текущие значения. Продолжить?',
    importOk: 'Данные восстановлены.', importBad: 'Файл не распознан — выберите резервную копию возмещений Muslims.cc.',
    legacyText: 'В учёте намазов есть счётчики возмещения: намазов {p}, постов {f}.', legacyBtn: 'Перенести сюда',
    legacyConfirm: 'Заменить текущие значения данными из учёта намазов?',
    resetBtn: 'Сбросить всё', resetConfirm: 'Удалить все счётчики и историю? Это необратимо.',
  },
  ar: {
    title: 'متابعة قضاء الفوائت',
    lead: 'سجّل بهدوء ما فاتك من الصلوات المفروضة وأيام رمضان التي لم تصمها، وأنقصها كلما قضيت. هذا بينك وبين ربك.',
    privacy: 'تُحفظ البيانات على هذا الجهاز فقط — بلا حساب ولا خادم ولا سحابة. إن غيّرت جهازك فنزّل نسخة احتياطية من الأسفل.',
    saveFail: 'المتصفح لا يسمح بالحفظ (ربما في وضع التصفح الخاص). ستضيع التغييرات عند إغلاق الصفحة.',
    countersTitle: 'الصلوات الفائتة',
    countersLead: 'عدّاد مستقل لكل صلاة مفروضة. إذا قضيت واحدة فاضغط «قضيتُ واحدة».',
    fasts: 'صيام رمضان',
    madeOne: 'قضيتُ واحدة', fastMadeOne: 'صمتُ يومًا', undo: 'تراجع',
    dec: '{p}: إنقاص واحدة', inc: '{p}: زيادة واحدة', countLabel: '{p} — المتبقي',
    left: 'متبقٍ', doneOf: 'قُضي {d} · {pct}٪',
    goalTitle: 'الهدف اليومي', goalLabel: 'عدد الصلوات المقضية يوميًا', goalHint: 'مثلًا: صلاة مقضية مع كل فريضة — خمس في اليوم.',
    todayLine: 'اليوم: {n} / {g}', goalDone: 'بلغت هدف اليوم. تقبّل الله منك.',
    finishIn: 'بهذا المعدل تحتاج الصلوات المتبقية ({n}) إلى نحو {d} يومًا.', nothingLeft: 'لا صلوات فائتة مسجّلة.',
    overall: 'التقدم العام — الصلوات', fastsProgress: 'التقدم — الصيام',
    historyTitle: 'آخر 30 يومًا', legendP: 'صلوات مقضية', legendF: 'أيام صيام مقضية', legendGoal: 'الهدف',
    dayAria: '{d}: {p} صلاة، {f} صيام', noHistory: 'لا شيء بعد — سيظهر هنا أول قضاء لك.',
    estTitle: 'الحاسبة التقديرية',
    estLead: 'إن لم تعرف العدد بدقة فاكتب أفضل تقدير لديك، ويمكنك تعديله في أي وقت.',
    modeDates: 'بالتواريخ', modeManual: 'يدويًا', modeGroup: 'طريقة الحساب',
    from: 'بداية التكليف', fromHint: 'التاريخ التقريبي للبلوغ (حين ظهرت علاماته أول مرة).',
    to: 'تاريخ بدء المواظبة على الصلاة',
    subtract: 'أيام تُطرح',
    subtractHint: 'أيام في هذه المدة تعلم أنك صليت فيها؛ وللمرأة أيضًا أيام الحيض والنفاس — فصلوات تلك الأيام لا تُقضى.',
    ramadanFound: 'في هذه المدة {n} يومًا من رمضان (بتقويم أم القرى).',
    fasted: 'أيام رمضان التي صمتها', fastedHint: 'الأيام التي أُفطرت لعذر تُقضى أيضًا (المرض والسفر والحيض والنفاس).',
    result: 'النتيجة: {p} من كل صلاة مفروضة، و{f} يومًا من صيام رمضان.',
    badRange: 'يجب أن يسبق تاريخ البداية تاريخ النهاية.',
    addBtn: 'أضف إلى العدّادات', setBtn: 'استبدل العدّادات بهذا',
    confirmSet: 'هل تُستبدل الأعداد الحالية بهذه النتيجة؟',
    applied: 'تم تحديث العدّادات.',
    manualLead: 'اكتب العدد المتبقي لكل صلاة مباشرة.', samePrayers: 'العدد نفسه لكل الصلوات', saveManual: 'حفظ',
    rulesTitle: 'الأحكام والأدلة',
    sleepTitle: 'الصلاة الفائتة بنوم أو نسيان',
    sleepText: 'تُصلّى متى ذكرها أو استيقظ، ولا كفارة لها إلا ذلك.',
    sleepTr: 'من نسي صلاة أو نام عنها فكفارتها أن يصليها إذا ذكرها.',
    sleepSrc: 'مسلم 684؛ وانظر البخاري 597',
    deliberateTitle: 'الصلوات المتروكة عمدًا — خلاف العلماء',
    deliberateIntro: 'تأخير الصلاة عن وقتها عمدًا كبيرة من الكبائر، والتوبة النصوح واجبة على القولين. والخلاف في القضاء نفسه:',
    viewMajority: 'جمهور العلماء: يجب قضاء الصلوات المتروكة عمدًا أيضًا.',
    viewIbnT: 'شيخ الإسلام ابن تيمية والشيخ ابن عثيمين: لا يُشرع قضاء الصلاة التي تُرك وقتها عمدًا ولا تصح، بل يتوب توبة نصوحًا ويحافظ على الصلاة في وقتها ويُكثر من النوافل.',
    bidTr: 'من عمل عملًا ليس عليه أمرنا فهو ردّ.',
    bidSrc: 'مسلم 1718 — استدل به ابن عثيمين',
    ibnTSrc: 'ابن تيمية، «الاختيارات الفقهية»، ص 34',
    deliberateNote: 'هذه الأداة لمن اختار القضاء. وإن عملت بالقول الثاني فالمعتبر التوبة والإكثار من النوافل. واسأل عالمًا تثق به عن حالك.',
    haydTitle: 'الحيض والنفاس',
    haydText: 'لا تقضي المرأة صلوات أيام الحيض والنفاس، وتقضي الصيام.',
    haydTr: 'كان يصيبنا ذلك فنؤمر بقضاء الصوم ولا نؤمر بقضاء الصلاة.',
    haydSrc: 'عائشة رضي الله عنها — مسلم 335',
    fastTitle: 'قضاء صيام رمضان',
    fastText: 'ما أُفطر من رمضان لمرض أو سفر أو عذر آخر يُقضى بعدده، ويجب إتمامه قبل رمضان التالي.',
    ayahTr: 'سورة البقرة: الآية 184',
    ayahSrc: 'البقرة 2:184؛ وانظر 2:185',
    aishaTr: 'كانت عائشة تؤخر القضاء إلى شعبان لانشغالها بالنبي ﷺ.',
    aishaSrc: 'عائشة رضي الله عنها — البخاري 1950',
    delayText: 'تأخيره إلى رمضان التالي بلا عذر إثم: يتوب ويقضي الأيام. واختلف العلماء في وجوب إطعام مسكين عن كل يوم (الفدية) مع القضاء: فالجمهور على وجوبها، ويرى بعض العلماء أن القضاء وحده يكفي.',
    sourcesLabel: 'للاستزادة:',
    disclaimer: 'هذه الصفحة ليست فتوى — اسأل عالمًا تثق به عن حالك.',
    backupTitle: 'نسخة احتياطية',
    backupLead: 'البيانات في هذا المتصفح فقط وقد تضيع إذا مُسحت ذاكرته. نزّل ملف JSON واحفظه عندك.',
    exportBtn: 'تنزيل الملف', importBtn: 'استعادة من ملف',
    importConfirm: 'ستحل بيانات الملف محل الأعداد الحالية. هل تتابع؟',
    importOk: 'تمت الاستعادة.', importBad: 'لم يُتعرّف على الملف — اختر نسخة القضاء الاحتياطية من Muslims.cc.',
    legacyText: 'في متابعة الصلاة أعداد للقضاء: {p} صلاة، {f} صيام.', legacyBtn: 'انقلها إلى هنا',
    legacyConfirm: 'هل تُستبدل الأعداد الحالية بما في متابعة الصلاة؟',
    resetBtn: 'إعادة تعيين الكل', resetConfirm: 'حذف كل الأعداد والسجل؟ لا يمكن التراجع عن ذلك.',
  },
  tr: {
    title: 'Kaza takibi',
    lead: 'Kılınmamış farz namazlarınızı ve tutulmamış Ramazan oruçlarınızı sessizce kaydedin, kaza ettikçe azaltın. Bu, sizinle Rabbiniz arasındadır.',
    privacy: 'Tüm kayıtlar yalnızca bu cihazda saklanır — hesap, sunucu, bulut yok. Cihaz değiştirecekseniz aşağıdan yedek indirin.',
    saveFail: 'Tarayıcı kaydetmeye izin vermiyor (gizli mod olabilir). Değişiklikler sayfa kapanınca kaybolur.',
    countersTitle: 'Borçlu olunan namazlar',
    countersLead: 'Her farz namaz için ayrı sayaç. Birini kaza ettiğinizde "Birini kıldım" düğmesine dokunun.',
    fasts: 'Ramazan oruçları',
    madeOne: 'Birini kıldım', fastMadeOne: 'Birini tuttum', undo: 'Geri al',
    dec: '{p}: bir azalt', inc: '{p}: bir artır', countLabel: '{p} — kalan sayı',
    left: 'kaldı', doneOf: '{d} kaza edildi · %{pct}',
    goalTitle: 'Günlük hedef', goalLabel: 'Günde kaç kaza namazı', goalHint: 'Örneğin her farz namazla birlikte bir kaza — günde 5.',
    todayLine: 'Bugün: {n} / {g}', goalDone: 'Bugünkü hedefe ulaştınız. Allah kabul etsin.',
    finishIn: 'Bu hızla kalan {n} namaz yaklaşık {d} günde tamamlanır.', nothingLeft: 'Kayıtlı namaz borcu yok.',
    overall: 'Genel ilerleme — namazlar', fastsProgress: 'İlerleme — oruçlar',
    historyTitle: 'Son 30 gün', legendP: 'Kaza namazı', legendF: 'Kaza orucu', legendGoal: 'Hedef',
    dayAria: '{d}: {p} namaz, {f} oruç', noHistory: 'Henüz kayıt yok — ilk kazanız burada görünecek.',
    estTitle: 'Tahmini hesaplayıcı',
    estLead: 'Tam sayıyı bilmiyorsanız en iyi tahmininizi yazın — sonra istediğiniz zaman düzeltebilirsiniz.',
    modeDates: 'Tarihlerle', modeManual: 'Elle', modeGroup: 'Hesaplama yöntemi',
    from: 'Mükellefiyetin başlangıcı', fromHint: 'Buluğa erdiğiniz (belirtilerinin ilk görüldüğü) yaklaşık tarih.',
    to: 'Namazı düzenli kılmaya başladığınız tarih',
    subtract: 'Düşülecek günler',
    subtractHint: 'Bu aralıkta namaz kıldığınızı bildiğiniz günler; kadınlar için ayrıca hayız ve nifas günleri — o günlerin namazı kaza edilmez.',
    ramadanFound: 'Bu aralıkta {n} Ramazan günü var (Ümmü’l-Kurâ takvimine göre).',
    fasted: 'Tuttuğunuz Ramazan günleri', fastedHint: 'Özürle tutulmayan günler de borçtur (hastalık, yolculuk, hayız, nifas).',
    result: 'Sonuç: her farz namaz için {p}, Ramazan orucu — {f}.',
    badRange: 'Başlangıç tarihi bitiş tarihinden önce olmalı.',
    addBtn: 'Sayaçlara ekle', setBtn: 'Sayaçları bununla değiştir',
    confirmSet: 'Mevcut sayılar bu sonuçla değiştirilsin mi?',
    applied: 'Sayaçlar güncellendi.',
    manualLead: 'Her namaz için kalan sayıyı doğrudan yazın.', samePrayers: 'Tüm namazlara aynı sayı', saveManual: 'Kaydet',
    rulesTitle: 'Hükümler ve deliller',
    sleepTitle: 'Uyku veya unutkanlık sebebiyle kaçırılan namaz',
    sleepText: 'Hatırlar hatırlamaz veya uyanır uyanmaz kılınır — bunun başka kefareti yoktur.',
    sleepTr: '"Kim bir namazı unutur veya uyuyup kaçırırsa, kefareti onu hatırladığında kılmasıdır."',
    sleepSrc: 'Müslim 684; ayrıca Buhârî 597',
    deliberateTitle: 'Kasten terk edilen namazlar — âlimlerin ihtilafı',
    deliberateIntro: 'Namazı kasten vaktinden çıkarmak büyük günahtır; samimi tövbe her iki görüşte de gereklidir. Fark kazanın kendisindedir:',
    viewMajority: 'Âlimlerin çoğunluğu: kasten terk edilen namazlar da kaza edilmelidir.',
    viewIbnT: 'Şeyhülislam İbn Teymiyye ve Şeyh İbn Useymin: vakti kasten geçirilen namazın kazası meşru değildir ve kabul olmaz. Kişi samimi tövbe eder, namazı vaktinde kılmaya sımsıkı sarılır ve nafile namazları çoğaltır.',
    bidTr: '"Kim bizim işimize uygun olmayan bir amel işlerse, o reddedilir."',
    bidSrc: 'Müslim 1718 — İbn Useymin’in delili',
    ibnTSrc: 'İbn Teymiyye, el-İhtiyârât, s. 34',
    deliberateNote: 'Bu takip aracı kaza etmeyi seçenler içindir. İkinci görüşe uyuyorsanız esas olan tövbe ve nafileleri artırmaktır. Kendi durumunuzu güvendiğiniz bir âlime sorun.',
    haydTitle: 'Hayız ve nifas',
    haydText: 'Kadın hayız ve nifas günlerinde kılmadığı namazları kaza etmez, tutmadığı oruçları ise kaza eder.',
    haydTr: '"Bu (hayız) bize de olurdu; orucu kaza etmekle emrolunurduk, namazı kaza etmekle emrolunmazdık."',
    haydSrc: 'Âişe (Allah ondan razı olsun) — Müslim 335',
    fastTitle: 'Ramazan orucunun kazası',
    fastText: 'Hastalık, yolculuk veya başka bir özürle tutulamayan Ramazan günleri sonra sayısınca kaza edilir ve bir sonraki Ramazana kadar tamamlanmalıdır.',
    ayahTr: '"Sizden kim hasta veya yolculukta olursa, (tutamadığı günler) sayısınca başka günlerde (oruç tutsun)."',
    ayahSrc: 'Bakara 2:184; ayrıca 2:185',
    aishaTr: '"Üzerimde Ramazandan oruç borcu olurdu ve onu ancak Şabanda kaza edebilirdim."',
    aishaSrc: 'Âişe (Allah ondan razı olsun) — Buhârî 1950',
    delayText: 'Özürsüz olarak bir sonraki Ramazana kadar geciktirmek günahtır: tövbe edilir ve oruçlar yine kaza edilir. Ayrıca her gün için bir fakiri doyurmanın (fidye) gerekliliğinde ihtilaf vardır: çoğunluk gerekli görür, bazı âlimler ise yalnızca kazayı yeterli sayar.',
    sourcesLabel: 'Ayrıntılı:',
    disclaimer: 'Bu sayfa fetva değildir — kendi durumunuz için güvendiğiniz bir âlime danışın.',
    backupTitle: 'Yedek',
    backupLead: 'Veriler yalnızca bu tarayıcıdadır ve tarayıcı belleği temizlenirse kaybolabilir. JSON dosyasını indirip kendinizde saklayın.',
    exportBtn: 'Dosyayı indir', importBtn: 'Dosyadan geri yükle',
    importConfirm: 'Dosyadaki veriler mevcut sayıların yerini alacak. Devam edilsin mi?',
    importOk: 'Veriler geri yüklendi.', importBad: 'Dosya tanınmadı — Muslims.cc kaza yedeğini seçin.',
    legacyText: 'Namaz takibinde kaza sayıları var: {p} namaz, {f} oruç.', legacyBtn: 'Buraya taşı',
    legacyConfirm: 'Mevcut sayılar namaz takibindeki sayılarla değiştirilsin mi?',
    resetBtn: 'Hepsini sıfırla', resetConfirm: 'Tüm sayılar ve geçmiş silinsin mi? Bu geri alınamaz.',
  },
}

export default function QadaPage({ setPage }) {
  const { lang } = useLang()
  const lk = LABELS[lang] ? lang : 'en'
  const t = LABELS[lk]
  const names = PRAYER_NAMES[lk] || PRAYER_NAMES.en
  const v = V3[lk]

  const [state, setState] = useState(() => loadQada())
  const [saveOk, setSaveOk] = useState(true)
  const [lastKind, setLastKind] = useState(null)        // "Geri al" yalnız son əməliyyat üçün
  const [status, setStatus] = useState('')              // aria-live mesajı
  const [legacy, setLegacy] = useState(() => loadLegacy())
  const today = dayKey()
  const firstRender = useRef(true)

  // Yaddaşa yaz (ilk render-də yox — oxuduğumuzu yenidən yazmağa ehtiyac yoxdur)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    setSaveOk(saveQada(state))
  }, [state])

  // Başqa tabda dəyişiklik — yenidən oxu
  useEffect(() => {
    const onStorage = (e) => { if (e.key === QADA_V1_KEY) setState(loadQada()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const totals = useMemo(() => qadaTotals(state), [state])
  const days30 = useMemo(() => lastDays(state, today, 30), [state, today])
  const doneToday = todayCount(state, today)

  const update = (fn, kind = null) => { setState(s => fn(s)); setLastKind(kind) }
  const onMakeUp = (kind) => { haptic(12); update(s => makeUp(s, kind, today), kind) }
  const onUndo = (kind) => { haptic(); update(s => undoMakeUp(s, kind, today)) }
  const say = (msg) => { setStatus(''); requestAnimationFrame(() => setStatus(msg)) }

  const showLegacy = legacy && isEmpty(state)

  return (
    <div className="qd-root">
      <header className="ui-page-hero ui-page-hero--split qd-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            {lk !== 'ar' && <p className="qd-hero-ar ui-arabic" lang="ar" aria-hidden="true">قَضَاءُ الفَوَائِت</p>}
            <p className="ui-lead">{t.lead}</p>
          </div>
          <div className="ui-page-hero__aside qd-hero-aside tm-ring tm-ring--live" data-reveal="zoom"
            style={{ '--tm-ring-from': ringFrom(totals.done, Math.max(1, totals.owed + totals.done), 104, 10) }}>
            <ProgressRing value={totals.done} max={Math.max(1, totals.owed + totals.done)} size={104} thickness={10}
              label={v.ring} sub={fill(v.ringSub, { d: fmtNum(totals.done, lk), t: fmtNum(totals.owed + totals.done, lk) })} />
            <ul className="ui-page-hero__stats qd-hero-stats tm-cascade">
              <li><b className="ui-num" data-testid="qd-hero-owed">{fmtNum(totals.owed, lk)}</b><span>{v.owed}</span></li>
              <li><b className="ui-num">{fmtNum(totals.done, lk)}</b><span>{v.done}</span></li>
              <li><b className="ui-num">{fmtNum(totals.fastsOwed, lk)}</b><span>{v.fasts}</span></li>
              <li><b className="ui-num">{totals.owed ? fmtNum(daysToFinish(totals.owed, state.goal), lk) : '—'}</b><span>{v.days}</span></li>
            </ul>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight qd-how" aria-labelledby="qd-how-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <h2 className="ui-title ui-title--sm" id="qd-how-title">{v.stepsTitle}</h2>
          </div>
          <ol className="ui-steps ui-steps--row" data-reveal="stagger">
            {[['s1', 's1t'], ['s2', 's2t'], ['s3', 's3t']].map(([a, b], i) => (
              <li key={a} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                <div className="ui-step__body">
                  <h3 className="ui-step__title">{v[a]}</h3>
                  <p className="ui-step__text">{v[b]}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ui-section qd-main">
        <div className="ui-container">
          <p className="qd-privacy" data-reveal><Icon name="shield" size={18} /> <span>{t.privacy}</span></p>
          {!saveOk && <p className="qd-alert" role="alert"><Icon name="alert" size={18} /> <span>{t.saveFail}</span></p>}
          {totals.owed + totals.done > 0 && <QadaMountain done={totals.done} owed={totals.owed} lang={lk} />}
          {showLegacy && (
            <div className="qd-legacy ui-card ui-card--sunken">
              <span>{fill(t.legacyText, { p: fmtNum(PRAYERS.reduce((a, p) => a + legacy.prayers[p].owed, 0), lk), f: fmtNum(legacy.fasts.owed, lk) })}</span>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => {
                if (!window.confirm(t.legacyConfirm)) return
                update(() => ({ ...legacy, goal: state.goal, log: state.log }))
                setLegacy(null)
                say(t.applied)
              }}>{t.legacyBtn}</button>
            </div>
          )}

          <div className="qd-layout">
            <div className="qd-col qd-col--main">
            {/* ── Sayğaclar ── */}
            <div className="qd-counters ui-card" data-reveal>
              <h2 className="qd-card-title"><Icon name="refresh" size={18} /> {t.countersTitle}</h2>
              <p className="qd-card-lead">{t.countersLead}</p>
              <ul className="qd-rows tm-cascade">
                {PRAYERS.map(p => (
                  <CounterRow key={p} kind={p} icon={PRAYER_ICONS[p]} name={names[p]} slot={state.prayers[p]} t={t} lang={lk}
                    doneLabel={t.madeOne} canUndo={lastKind === p}
                    onDec={() => update(s => adjustOwed(s, p, -1))} onInc={() => update(s => adjustOwed(s, p, 1))}
                    onSet={(n) => update(s => setOwed(s, p, n))} onMakeUp={() => onMakeUp(p)} onUndo={() => onUndo(p)} />
                ))}
                <CounterRow kind="fast" icon="ramadan" name={t.fasts} slot={state.fasts} t={t} lang={lk} isFast
                  doneLabel={t.fastMadeOne} canUndo={lastKind === 'fast'}
                  onDec={() => update(s => adjustOwed(s, 'fast', -1))} onInc={() => update(s => adjustOwed(s, 'fast', 1))}
                  onSet={(n) => update(s => setOwed(s, 'fast', n))} onMakeUp={() => onMakeUp('fast')} onUndo={() => onUndo('fast')} />
              </ul>
            </div>

            {/* ── Təxmini hesablayıcı ── */}
            <Estimator t={t} lang={lk} names={names} state={state}
              onApply={(est, mode) => { update(s => applyEstimate(s, { ...est, mode })); say(t.applied) }}
              onManual={(vals) => {
                update(s => {
                  let n = s
                  for (const p of PRAYERS) n = setOwed(n, p, vals[p])
                  return setOwed(n, 'fast', vals.fast)
                })
                say(t.applied)
              }} />

            </div>

            <div className="qd-col qd-col--side">
            {/* ── Hədəf və irəliləyiş ── */}
            <div className="qd-goal ui-card" data-reveal>
              <h2 className="qd-card-title"><Icon name="target" size={18} /> {t.goalTitle}</h2>
              <label className="ui-field qd-goal-field">
                <span className="ui-field__label">{t.goalLabel}</span>
                <NumberInput value={state.goal} min={1} max={MAX_GOAL} className="ui-input qd-goal-input"
                  onCommit={(n) => update(s => setGoal(s, n))} />
                <span className="ui-field__hint">{t.goalHint}</span>
              </label>
              <div className="qd-today">
                <div className="qd-bar-head">
                  <span className="ui-num" data-testid="qd-today">{fill(t.todayLine, { n: fmtNum(doneToday, lk), g: fmtNum(state.goal, lk) })}</span>
                </div>
                <Bar pct={Math.min(100, (doneToday / state.goal) * 100)} label={t.goalTitle} />
                <p className="qd-msg" aria-live="polite">{doneToday >= state.goal ? t.goalDone : ''}</p>
                {doneToday >= state.goal && doneToday > 0 && <Sparkle key={doneToday} count={10} radius={60} />}
              </div>
              <div className="qd-overall">
                <div className="qd-bar-head">
                  <span>{t.overall}</span>
                  <span className="ui-num">{fmtPct(totals.pct)}%</span>
                </div>
                <Bar pct={totals.pct} label={t.overall} />
                <p className="qd-note">
                  {totals.owed
                    ? fill(t.finishIn, { n: fmtNum(totals.owed, lk), d: fmtNum(daysToFinish(totals.owed, state.goal), lk) })
                    : t.nothingLeft}
                </p>
              </div>
              {(totals.fastsOwed + totals.fastsDone) > 0 && (
                <div className="qd-overall">
                  <div className="qd-bar-head">
                    <span>{t.fastsProgress}</span>
                    <span className="ui-num">{fmtPct(totals.fastsPct)}%</span>
                  </div>
                  <Bar pct={totals.fastsPct} label={t.fastsProgress} accent />
                </div>
              )}
            </div>

            {/* ── Borcun namazlar üzrə bölgüsü ── */}
            <div className="qd-chart-card ui-card" data-reveal>
              <ChartFigure plain title={v.chartTitle} sub={v.chartSub}>
                <BarChart label={v.chartTitle} labelWidth="30%"
                  data={PRAYERS.map(p => ({ key: p, label: names[p], value: state.prayers[p].owed }))}
                  max={Math.max(1, ...PRAYERS.map(p => state.prayers[p].owed))}
                  format={(n) => fmtNum(n, lk)} />
              </ChartFigure>
            </div>

            {/* ── Son 30 gün ── */}
            <History t={t} lang={lk} days={days30} goal={state.goal} today={today} />

            {/* ── Ehtiyat nüsxə ── */}
            <Backup t={t} state={state} today={today}
              onImport={(s) => { update(() => s); say(t.importOk) }}
              onReset={() => { update(() => emptyQada()) }} say={say} />
            </div>
          </div>

          {/* ── v3.2: plan kartları — müxtəlif templə bitmə tarixi; klik hədəfi seçir ── */}
          <PlanCards lang={lk} owed={totals.owed} goal={state.goal} today={today}
            onPick={(n) => { haptic(); update(s => setGoal(s, n)) }} />

          <p className="ui-sr-only" role="status" aria-live="polite">{status}</p>
        </div>
      </section>

      {/* viz v2: analitika — temp, bitmə tarixi, namazlar üzrə borc */}
      <QadaInsights state={state} today={today} lang={lk} names={names} />

      <Rules t={t} lang={lk} />
    </div>
  )
}

// ── v3.2: plan kartları ──
// Yalnız hesab: qalan borc ÷ gündəlik say = gün; bitmə tarixi bu gündən sayılır.
// Fiqh hökmü deyil — tələsmək lazım olduğunu Qaydalar bölməsi izah edir.
const PLAN_PACES = [5, 10, 15, 20, 30]
const PLAN_TXT = {
  az: { title: 'Plan seçin', lead: 'Hər temp üçün borcun nə vaxt bitəcəyi. Kartı seçin — gündəlik hədəf ona görə qurulur.', perDay: 'gündə {n}', days: '{d} gün', until: 'təxminən {date}', current: 'Cari hədəf', pick: 'Bu planı seç', empty: 'Plan üçün əvvəlcə yuxarıda borcunuzu qeyd edin.', with5: 'hər fərzlə bir qəza' },
  en: { title: 'Choose a plan', lead: 'When your debt would be finished at each pace. Pick a card to set it as your daily goal.', perDay: '{n} a day', days: '{d} days', until: 'around {date}', current: 'Current goal', pick: 'Use this plan', empty: 'Record what you owe above to see plans.', with5: 'one make-up with each obligatory prayer' },
  ru: { title: 'Выберите план', lead: 'Когда долг будет погашен при каждом темпе. Выберите карточку — дневная цель будет установлена по ней.', perDay: '{n} в день', days: '{d} дн.', until: 'примерно {date}', current: 'Текущая цель', pick: 'Выбрать план', empty: 'Чтобы увидеть планы, сначала отметьте долг выше.', with5: 'по одному возмещению с каждым обязательным намазом' },
  ar: { title: 'اختر خطة', lead: 'متى ينتهي القضاء بكل معدل. اختر بطاقة لتجعلها هدفك اليومي.', perDay: '{n} يوميًا', days: '{d} يومًا', until: 'نحو {date}', current: 'الهدف الحالي', pick: 'اختر هذه الخطة', empty: 'سجّل ما عليك أعلاه لترى الخطط.', with5: 'صلاة مقضية مع كل فريضة' },
  tr: { title: 'Plan seçin', lead: 'Her hızda borcun ne zaman biteceği. Bir kart seçin — günlük hedef ona göre kurulur.', perDay: 'günde {n}', days: '{d} gün', until: 'yaklaşık {date}', current: 'Mevcut hedef', pick: 'Bu planı seç', empty: 'Planları görmek için önce borcunuzu yukarıda kaydedin.', with5: 'her farzla bir kaza' },
}
function PlanCards({ lang, owed, goal, today, onPick }) {
  const p = pickUi(PLAN_TXT, lang, 'en')
  const paces = [...new Set([...PLAN_PACES, goal])].sort((a, b) => a - b)
  const base = parseGKey(today)
  const finish = (d) => {
    if (!base) return ''
    const dt = new Date(Date.UTC(base.year, base.month - 1, base.day + Math.max(0, d - 1)))
    return formatGregorian({ year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() }, lang)
  }
  return (
    <section className="qd-plans" aria-labelledby="qd-plans-title" data-reveal>
      <div className="qd-plans-head">
        <h2 id="qd-plans-title" className="qd-card-title"><Icon name="calendar" size={18} /> {p.title}</h2>
        <p className="qd-card-lead">{owed ? p.lead : p.empty}</p>
      </div>
      {owed > 0 && (
        <ul className="qd-plan-grid tm-cascade">
          {paces.map(n => {
            const d = daysToFinish(owed, n)
            const cur = n === goal
            return (
              <li key={n}>
                <button type="button" className={`qd-plan${cur ? ' is-current' : ''}`} aria-pressed={cur} onClick={() => onPick(n)}>
                  <span className="qd-plan-top">
                    <span className="qd-plan-pace ui-num">{fill(p.perDay, { n: fmtNum(n, lang) })}</span>
                    {cur && <span className="ui-badge ui-badge--brand">{p.current}</span>}
                  </span>
                  <span className="qd-plan-days ui-num">{fill(p.days, { d: fmtNum(d, lang) })}</span>
                  <span className="qd-plan-date">{fill(p.until, { date: finish(d) })}</span>
                  {n === 5 && <span className="qd-plan-hint">{p.with5}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ── Bir sətir: ad, −/say/+, irəliləyiş, "Birini qıldım" ──
function CounterRow({ kind, icon, name, slot, t, lang, isFast, doneLabel, canUndo, onDec, onInc, onSet, onMakeUp, onUndo }) {
  const pct = slotPct(slot)
  return (
    <li className={`qd-row${isFast ? ' qd-row--fast' : ''}`} data-kind={kind}>
      <span className="qd-row-name">
        <span className="qd-row-ic" aria-hidden="true"><Icon name={icon} size={18} fallback="moon" /></span>
        {name}
      </span>
      <span className="qd-stepper">
        <button type="button" className="ui-icon-btn" aria-label={fill(t.dec, { p: name })} onClick={onDec} disabled={!slot.owed}>
          <Icon name="minus" size={16} />
        </button>
        <NumberInput value={slot.owed} min={0} className="qd-count ui-num" ariaLabel={fill(t.countLabel, { p: name })}
          onCommit={onSet} testId={`qd-owed-${kind}`} />
        <button type="button" className="ui-icon-btn" aria-label={fill(t.inc, { p: name })} onClick={onInc}>
          <Icon name="plus" size={16} />
        </button>
      </span>
      <span className="qd-row-actions">
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={!slot.owed} onClick={onMakeUp}
          data-testid={`qd-make-${kind}`}>
          <Icon name="check" className="ui-btn__icon" /> {doneLabel}
        </button>
        {canUndo && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onUndo}>{t.undo}</button>}
      </span>
      <span className="qd-row-progress">
        <Bar pct={pct} label={name} accent={isFast} small />
        <span className="qd-row-meta ui-num">{fill(t.doneOf, { d: fmtNum(slot.done, lang), pct: fmtPct(pct) })}</span>
      </span>
    </li>
  )
}

function Bar({ pct, label, accent, small }) {
  const v = Math.max(0, Math.min(100, pct || 0))
  return (
    <span className={`qd-bar${accent ? ' qd-bar--accent' : ''}${small ? ' qd-bar--sm' : ''}`} role="progressbar"
      aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)}>
      <span className="tm-grow-x" style={{ transform: `scaleX(${v / 100})` }} />
    </span>
  )
}

// Rəqəm sahəsi: yazarkən sərbəst, Enter/blur-da təsdiqlənir
function NumberInput({ value, min = 0, max, className, ariaLabel, onCommit, testId }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => { setDraft(String(value)) }, [value])
  const commit = () => {
    let n = Math.floor(Number(draft))
    if (!Number.isFinite(n) || n < min) n = min
    if (max && n > max) n = max
    setDraft(String(n))
    if (n !== value) onCommit(n)
  }
  return (
    <input type="number" inputMode="numeric" min={min} max={max} step="1" className={className}
      aria-label={ariaLabel} value={draft} data-testid={testId}
      onChange={(e) => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }} />
  )
}

// ── Son 30 günün qrafiki (öz SVG; namaz — brend, oruc — vurğu) ──
function History({ t, lang, days, goal, today }) {
  const W = 600, H = 190, top = 16, base = 160, left = 8, right = 8
  const max = Math.max(goal, 1, ...days.map(d => d.p + d.f))
  const unit = (base - top) / max
  const slot = (W - left - right) / days.length
  const bw = Math.max(6, slot * 0.62)
  const any = days.some(d => d.p || d.f)
  const g = (key) => { const [y, m, d] = key.split('-').map(Number); return { year: y, month: m, day: d } }
  const aria = days.filter(d => d.p || d.f).map(d => fill(t.dayAria, { d: formatGregorian(g(d.key), lang), p: d.p, f: d.f })).join('; ')
  const goalY = base - goal * unit
  return (
    <div className="qd-history ui-card" data-reveal>
      <h2 className="qd-card-title"><Icon name="analytics" size={18} fallback="list" /> {t.historyTitle}</h2>
      <svg className="qd-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${t.historyTitle}: ${aria || t.noHistory}`}>
        <line className="qd-axis" x1={left} x2={W - right} y1={base} y2={base} />
        <line className="qd-goal-line" x1={left} x2={W - right} y1={goalY} y2={goalY} />
        {days.map((d, i) => {
          const x = left + i * slot + (slot - bw) / 2
          const hp = d.p * unit, hf = d.f * unit
          const isToday = d.key === today
          const day = Number(d.key.slice(8))
          return (
            <g key={d.key} style={{ '--i': i }}>
              {hp > 0 && <rect className="qd-bar-p" x={x} y={base - hp} width={bw} height={hp} rx="2" />}
              {hf > 0 && <rect className="qd-bar-f" x={x} y={base - hp - hf} width={bw} height={hf} rx="2" />}
              {(i % 5 === 4 || isToday) && (
                <text className={`qd-chart-day${isToday ? ' is-today' : ''}`} x={x + bw / 2} y={base + 18} textAnchor="middle">{day}</text>
              )}
            </g>
          )
        })}
      </svg>
      <ul className="qd-legend" aria-hidden="true">
        <li><span className="qd-dot qd-dot--p" />{t.legendP}</li>
        <li><span className="qd-dot qd-dot--f" />{t.legendF}</li>
        <li><span className="qd-dash" />{t.legendGoal}</li>
      </ul>
      {!any && <p className="qd-note">{t.noHistory}</p>}
    </div>
  )
}

// ── Təxmini hesablayıcı ──
function Estimator({ t, lang, names, state, onApply, onManual }) {
  const [mode, setMode] = useState('dates')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sub, setSub] = useState('')
  const [fasted, setFasted] = useState('')
  const [manual, setManual] = useState(() => manualFrom(state))
  const [same, setSame] = useState('')

  useEffect(() => { if (mode === 'manual') setManual(manualFrom(state)) }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const gFrom = parseGKey(from), gTo = parseGKey(to)
  const badRange = !!(gFrom && gTo && to < from)
  const days = gFrom && gTo && !badRange ? estimateDays(from, to, sub) : 0
  const ramadan = useMemo(() => (gFrom && gTo && !badRange ? countRamadanDays(gFrom, gTo) : 0), [from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  const fastsOwed = Math.max(0, ramadan - (Math.floor(Number(fasted)) || 0))
  const ready = days > 0 || fastsOwed > 0
  const todayIso = dayKey()

  return (
    <div className="qd-est ui-card" data-reveal>
      <h2 className="qd-card-title"><Icon name="edit" size={18} /> {t.estTitle}</h2>
      <p className="qd-card-lead">{t.estLead}</p>
      <div className="qd-chips" role="group" aria-label={t.modeGroup}>
        <button type="button" className="ui-chip" aria-pressed={mode === 'dates'} onClick={() => setMode('dates')}>{t.modeDates}</button>
        <button type="button" className="ui-chip" aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>{t.modeManual}</button>
      </div>

      {mode === 'dates' ? (
        <div className="qd-est-body">
          <div className="qd-est-grid">
            <label className="ui-field">
              <span className="ui-field__label">{t.from}</span>
              <input className="ui-input" type="date" value={from} max={todayIso} min="0622-07-19" onChange={(e) => setFrom(e.target.value)} />
              <span className="ui-field__hint">{t.fromHint}</span>
            </label>
            <label className="ui-field">
              <span className="ui-field__label">{t.to}</span>
              <input className="ui-input" type="date" value={to} max={todayIso} min="0622-07-19" onChange={(e) => setTo(e.target.value)} />
            </label>
            <label className="ui-field">
              <span className="ui-field__label">{t.subtract}</span>
              <input className="ui-input" type="number" inputMode="numeric" min="0" value={sub} onChange={(e) => setSub(e.target.value)} />
              <span className="ui-field__hint">{t.subtractHint}</span>
            </label>
            <label className="ui-field">
              <span className="ui-field__label">{t.fasted}</span>
              <input className="ui-input" type="number" inputMode="numeric" min="0" max={ramadan || undefined} value={fasted}
                onChange={(e) => setFasted(e.target.value)} />
              <span className="ui-field__hint">
                {gFrom && gTo && !badRange ? `${fill(t.ramadanFound, { n: fmtNum(ramadan, lang) })} ` : ''}{t.fastedHint}
              </span>
            </label>
          </div>
          {badRange && <p className="qd-alert" role="alert"><Icon name="alert" size={18} /> <span>{t.badRange}</span></p>}
          {ready && (
            <div className="qd-result" aria-live="polite">
              <p className="qd-result-text ui-num" data-testid="qd-est-result">
                {fill(t.result, { p: fmtNum(days, lang), f: fmtNum(fastsOwed, lang) })}
              </p>
              <div className="qd-actions">
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm"
                  onClick={() => onApply({ prayers: days, fasts: fastsOwed }, 'add')}>
                  <Icon name="plus" className="ui-btn__icon" /> {t.addBtn}
                </button>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm"
                  onClick={() => { if (window.confirm(t.confirmSet)) onApply({ prayers: days, fasts: fastsOwed }, 'set') }}>
                  {t.setBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="qd-est-body">
          <p className="qd-note qd-note--top">{t.manualLead}</p>
          <div className="qd-same">
            <label className="ui-field">
              <span className="ui-field__label">{t.samePrayers}</span>
              <input className="ui-input" type="number" inputMode="numeric" min="0" value={same}
                onChange={(e) => {
                  setSame(e.target.value)
                  const n = Math.max(0, Math.floor(Number(e.target.value)) || 0)
                  setManual(m => ({ ...m, ...Object.fromEntries(PRAYERS.map(p => [p, n])) }))
                }} />
            </label>
          </div>
          <div className="qd-manual-grid">
            {[...PRAYERS, 'fast'].map(k => (
              <label key={k} className="ui-field">
                <span className="ui-field__label">{k === 'fast' ? t.fasts : names[k]}</span>
                <input className="ui-input" type="number" inputMode="numeric" min="0" value={manual[k]}
                  onChange={(e) => setManual(m => ({ ...m, [k]: e.target.value }))} />
              </label>
            ))}
          </div>
          <div className="qd-actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => onManual(manual)}>
              <Icon name="check" className="ui-btn__icon" /> {t.saveManual}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
function manualFrom(state) {
  const m = { fast: String(state.fasts.owed) }
  for (const p of PRAYERS) m[p] = String(state.prayers[p].owed)
  return m
}

// ── Ehtiyat nüsxə: JSON yüklə / bərpa et / sıfırla ──
function Backup({ t, state, today, onImport, onReset, say }) {
  const fileRef = useRef(null)
  const download = () => {
    try {
      const blob = new Blob([toBackup(state)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `muslims-cc-qada-${today}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { /* köhnə brauzer — səssiz */ }
  }
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let text = ''
    try { text = await file.text() } catch { say(t.importBad); return }
    const s = file.size < 2_000_000 ? fromBackup(text) : null
    if (!s) { say(t.importBad); window.alert(t.importBad); return }
    if (!window.confirm(t.importConfirm)) return
    onImport(s)
  }
  return (
    <div className="qd-backup ui-card" data-reveal>
      <h2 className="qd-card-title"><Icon name="download" size={18} /> {t.backupTitle}</h2>
      <p className="qd-card-lead">{t.backupLead}</p>
      <div className="qd-actions">
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={download}>
          <Icon name="download" className="ui-btn__icon" /> {t.exportBtn}
        </button>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => fileRef.current?.click()}>
          <Icon name="arrowUp" className="ui-btn__icon" /> {t.importBtn}
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm qd-reset"
          onClick={() => { if (window.confirm(t.resetConfirm)) onReset() }}>
          <Icon name="trash" className="ui-btn__icon" /> {t.resetBtn}
        </button>
      </div>
    </div>
  )
}

// ── Hökmlər və dəlillər ──
function Rules({ t, lang }) {
  const Quote = ({ ar, tr, src }) => (
    <figure className="ui-quote qd-quote">
      <blockquote>
        <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{ar}</p>
        {lang !== 'ar' && <p className="ui-quote__text">{tr}</p>}
      </blockquote>
      <figcaption className="ui-quote__src">— {src}</figcaption>
    </figure>
  )
  const Links = ({ ids }) => (
    <p className="qd-src">
      {t.sourcesLabel}{' '}
      {ids.map((n, i) => (
        <span key={n}>
          {i > 0 && ' · '}
          <a className="ui-link" href={qaUrl(n, lang)} target="_blank" rel="noopener noreferrer">
            <span className="qd-ltr">IslamQA {n}</span>
          </a>
        </span>
      ))}
    </p>
  )
  return (
    <section className="ui-section ui-section--alt qd-rules" aria-labelledby="qd-rules-title">
      <div className="ui-container">
        <div className="ui-section-head" data-reveal>
          <h2 className="ui-title" id="qd-rules-title">{t.rulesTitle}</h2>
          <p className="ui-lead">{t.disclaimer}</p>
        </div>
        <div className="qd-rules-grid">
          <article className="ui-card qd-rule" data-reveal>
            <h3 className="qd-card-title">{t.sleepTitle}</h3>
            <p>{t.sleepText}</p>
            <Quote ar={AR.forgot} tr={t.sleepTr} src={t.sleepSrc} />
          </article>

          <article className="ui-card qd-rule qd-rule--wide" data-reveal>
            <h3 className="qd-card-title">{t.deliberateTitle}</h3>
            <p>{t.deliberateIntro}</p>
            <ol className="qd-views">
              <li>{t.viewMajority}</li>
              <li>{t.viewIbnT} <span className="qd-src-inline">({t.ibnTSrc})</span></li>
            </ol>
            <Quote ar={AR.bid} tr={t.bidTr} src={t.bidSrc} />
            <p className="qd-note">{t.deliberateNote}</p>
            <Links ids={[13664]} />
          </article>

          <article className="ui-card qd-rule" data-reveal>
            <h3 className="qd-card-title">{t.haydTitle}</h3>
            <p>{t.haydText}</p>
            <Quote ar={AR.hayd} tr={t.haydTr} src={t.haydSrc} />
          </article>

          <article className="ui-card qd-rule qd-rule--wide" data-reveal>
            <h3 className="qd-card-title">{t.fastTitle}</h3>
            <p>{t.fastText}</p>
            <Quote ar={AR.ayah} tr={t.ayahTr} src={t.ayahSrc} />
            <Quote ar={AR.aisha} tr={t.aishaTr} src={t.aishaSrc} />
            <p>{t.delayText}</p>
            <Links ids={[26865, 39742]} />
          </article>
        </div>
      </div>
    </section>
  )
}
