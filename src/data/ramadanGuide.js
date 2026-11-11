// ═══════════════════════════════════════════════════════
// RAMAZAN BƏLƏDÇİSİ — /ramadan səhifəsində imsakiyyənin altında
// Bloklar src/data/lessons/README.md formatındadır (LessonBlocks göstərir).
//
// YOXLANILIB (2026-10-31):
// • Hədislər — fawazahmed0/hadith-api (ara-*): Buxari 38, 990, 1147, 1896, 1899,
//   1901, 1903, 1904, 1909, 1921, 1923, 1930, 1933, 1943, 1950, 1957, 2010, 2017,
//   2024, 2026, 2029, 4505; Muslim (Fuad Əbdülbaqi nömrəsi, API-də "arabicnumber")
//   335, 760, 762, 986, 1079, 1098, 1121, 1151, 1154; Əbu Davud 1609 (həsən),
//   2356 (həsən səhih), 2357 (həsən), 2358 (zəif — yalnız qeyddə), 2367 (səhih),
//   2380 (səhih), 2408 (həsən səhih), 2454 (səhih); Tirmizi 806, 807, 3513
//   (hamısı Albani: səhih).
// • Ayələr — api.quran.com (uthmani): 2:183, 2:184, 2:185, 2:187, 97:3.
// • Fətvalar (açılıb oxunub):
//   İbn Baz, Məcmu əl-Fətava 15/257 (qidalı iynə), 15/258 (vena/əzələ iynəsi,
//   qan analizi, hacamat), 15/260 (pasta, göz/qulaq/burun damcısı), 15/261 (pasta),
//   15/262 (göz damcısı, sürmə), 15/265 (astma inhalyatoru), 15/274 (qan analizi);
//   Nurun alə-d-Dərb, fətva 13477 (təravihin rükət sayı).
//   İbn Useymin: Fətava Ərkan əl-İslam s. 475 (inhalyator — islamqa 37650);
//   Məcalis Şəhr Ramazan s. 70–71 (qidalı iynə, qanvermə, qusma — islamqa 38023);
//   əş-Şərh əl-Mumti 4/73–75 (təravih — islamqa 9036).
// • Fidyə, kəffarə, bayram namazı, fitrə zəkatının miqdarı — burada TƏKRARLANMIR,
//   ayrıca dərsə / səhifəyə keçid verilir (links).
// ═══════════════════════════════════════════════════════

import { localizeSource } from '../utils/sourceNames.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
// "Buxari 38" → hər dildə mənbə adı (sourceNames.js)
const S = (s) => Object.fromEntries(LANGS.map(l => [l, localizeSource(s, l)]))

const SAHIH = { az: 'səhih (əl-Albani)', en: 'sahih (al-Albani)', ru: 'достоверный (аль-Альбани)', ar: 'صحيح (الألباني)', tr: 'sahih (Elbânî)' }
const HASAN = { az: 'həsən (əl-Albani)', en: 'hasan (al-Albani)', ru: 'хороший (аль-Альбани)', ar: 'حسن (الألباني)', tr: 'hasen (Elbânî)' }
const HASAN_SAHIH = { az: 'həsən səhih (əl-Albani)', en: 'hasan sahih (al-Albani)', ru: 'хороший достоверный (аль-Альбани)', ar: 'حسن صحيح (الألباني)', tr: 'hasen sahih (Elbânî)' }

// Fətva istinadları
const BAZ = (vp) => ({
  az: `İbn Baz, «Məcmu əl-Fətava» ${vp}`,
  en: `Ibn Baz, Majmu' al-Fatawa ${vp}`,
  ru: `Ибн Баз, «Маджму аль-фатава» ${vp}`,
  ar: `ابن باز، مجموع الفتاوى ${vp}`,
  tr: `İbn Bâz, Mecmûu’l-Fetâvâ ${vp}`,
})
const URL_BAZ = {
  injections: 'https://binbaz.org.sa/fatwas/11757/%D8%AD%D9%83%D9%85-%D8%A7%D8%B3%D8%AA%D8%B9%D9%85%D8%A7%D9%84-%D8%A7%D8%A8%D8%B1-%D8%A7%D9%84%D9%88%D8%B1%D9%8A%D8%AF-%D9%88%D8%A7%D9%84%D8%B9%D8%B6%D9%84',
  drops: 'https://binbaz.org.sa/fatwas/11806/%D8%AD%D9%83%D9%85-%D8%A7%D8%B3%D8%AA%D8%B9%D9%85%D8%A7%D9%84-%D9%85%D8%B9%D8%AC%D9%88%D9%86-%D8%A7%D9%84%D8%A7%D8%B3%D9%86%D8%A7%D9%86-%D9%88%D9%82%D8%B7%D8%B1%D8%A9-%D8%A7%D9%84%D8%A7%D8%B0%D9%86-%D9%88%D8%A7%D9%84%D8%B9%D9%8A%D9%86-%D9%88%D8%A7%D9%84%D8%A7%D9%86%D9%81-%D9%84%D9%84%D8%B5%D8%A7%D9%89%D9%85',
  inhaler: 'https://binbaz.org.sa/fatwas/11820/%D8%AD%D9%83%D9%85-%D8%A7%D8%B3%D8%AA%D8%B9%D9%85%D8%A7%D9%84-%D9%85%D8%B1%D9%8A%D8%B6-%D8%A7%D9%84%D8%B1%D8%A8%D9%88-%D8%A7%D9%84%D8%A8%D8%AE%D8%A7%D8%AE-%D9%88%D9%87%D9%88-%D8%B5%D8%A7%D9%89%D9%85',
  blood: 'https://binbaz.org.sa/fatwas/11874/%D8%AD%D9%83%D9%85-%D8%B3%D8%AD%D8%A8-%D8%B9%D9%8A%D9%86%D8%A7%D8%AA-%D8%A7%D9%84%D8%AF%D9%85-%D9%85%D9%86-%D8%A7%D9%84%D8%B5%D8%A7%D9%85-%D9%84%D9%84%D8%AA%D8%AD%D9%84%D9%8A%D9%84',
  toothpaste: 'https://binbaz.org.sa/fatwas/11807/%D8%AD%D9%83%D9%85-%D8%A7%D8%B3%D8%AA%D8%B9%D9%85%D8%A7%D9%84-%D9%85%D8%B9%D8%AC%D9%88%D9%86-%D8%A7%D9%84%D8%A7%D8%B3%D9%86%D8%A7%D9%86-%D9%84%D9%84%D8%B5%D8%A7%D9%89%D9%85',
  tarawih: 'https://binbaz.org.sa/fatwas/13477/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%B2%D9%8A%D8%A7%D8%AF%D8%A9-%D8%B9%D9%84%D9%89-%D8%AB%D9%85%D8%A7%D9%86-%D8%B1%D9%83%D8%B9%D8%A7%D8%AA-%D9%81%D9%8A-%D8%A7%D9%84%D8%AA%D8%B1%D8%A7%D9%88%D9%8A%D8%AD',
}
const URL_QA = {
  breakers: 'https://islamqa.info/ar/answers/38023',
}

export const RAMADAN_GUIDE = [
  // ── 1. Fəzilətlər ──
  {
    id: 'virtues', icon: 'sparkle',
    title: { az: 'Ramazanın fəziləti', en: 'The virtues of Ramadan', ru: 'Достоинства Рамадана', ar: 'فضل شهر رمضان', tr: 'Ramazan’ın fazileti' },
    blocks: [
      { t: 'p', text: {
        az: 'Ramazan Quranın nazil edildiyi aydır. Bu ayın orucu İslamın beş rüknündən biridir və hər həddi-büluğa çatmış, ağıllı, oruc tutmağa gücü çatan, yolçu olmayan müsəlmana fərzdir. Allah orucu bizə təqva qazanmağımız üçün yazmışdır.',
        en: 'Ramadan is the month in which the Quran was revealed. Fasting it is one of the five pillars of Islam and is obligatory on every Muslim who has reached puberty, is sane, able to fast and not travelling. Allah prescribed it so that we may attain taqwa.',
        ru: 'Рамадан — месяц, в который был ниспослан Коран. Пост в этом месяце — один из пяти столпов ислама; он обязателен для каждого совершеннолетнего, разумного мусульманина, способного поститься и не находящегося в пути. Аллах предписал его, чтобы мы обрели богобоязненность.',
        ar: 'رمضان هو الشهر الذي أُنزل فيه القرآن، وصيامه ركن من أركان الإسلام الخمسة، وهو واجب على كل مسلم بالغ عاقل قادر مقيم. وقد كتبه الله علينا لعلنا نتقي.',
        tr: 'Ramazan, Kur’an’ın indirildiği aydır. Bu ayın orucu İslam’ın beş şartından biridir; ergenliğe ulaşmış, akıllı, oruca gücü yeten ve yolcu olmayan her Müslümana farzdır. Allah onu takvaya ulaşalım diye bize farz kılmıştır.',
      } },
      { t: 'ayah', ref: '2:183', ar: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ كُتِبَ عَلَيْكُمُ ٱلصِّيَامُ كَمَا كُتِبَ عَلَى ٱلَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ', text: {
        az: 'Ey iman gətirənlər! Sizdən əvvəlkilərə yazıldığı kimi, sizə də oruc yazıldı ki, (Allahdan) qorxub çəkinəsiniz.',
        en: 'O you who believe, fasting has been prescribed for you as it was prescribed for those before you, so that you may become mindful of Allah.',
        ru: 'О те, которые уверовали! Вам предписан пост, как он был предписан вашим предшественникам, — быть может, вы будете богобоязненны.',
        tr: 'Ey iman edenler! Oruç sizden öncekilere farz kılındığı gibi size de farz kılındı; umulur ki sakınırsınız.',
      } },
      { t: 'ayah', ref: '2:185', ar: 'شَهْرُ رَمَضَانَ ٱلَّذِىٓ أُنزِلَ فِيهِ ٱلْقُرْءَانُ هُدًى لِّلنَّاسِ وَبَيِّنَـٰتٍ مِّنَ ٱلْهُدَىٰ وَٱلْفُرْقَانِ ۚ فَمَن شَهِدَ مِنكُمُ ٱلشَّهْرَ فَلْيَصُمْهُ', text: {
        az: 'Ramazan ayı insanlara doğru yolu göstərən, doğru yolun və haqqı batildən ayıranın açıq dəlillərini özündə cəmləşdirən Quranın nazil edildiyi aydır. Sizdən kim bu aya çatarsa, onu oruc tutsun.',
        en: 'The month of Ramadan is the one in which the Quran was sent down as guidance for mankind, with clear proofs of guidance and the criterion. So whoever of you witnesses the month, let him fast it.',
        ru: 'В месяц Рамадан был ниспослан Коран — верное руководство для людей, ясные доказательства прямого пути и различения. Кто из вас застанет этот месяц, тот должен поститься.',
        tr: 'Ramazan ayı, insanlara yol gösterici, doğru yolun ve hak ile batılı ayırmanın apaçık delilleri olarak Kur’an’ın indirildiği aydır. Sizden kim bu aya ulaşırsa onu oruçla geçirsin.',
      } },
      { t: 'hadith', ar: 'إِذَا دَخَلَ شَهْرُ رَمَضَانَ فُتِّحَتْ أَبْوَابُ السَّمَاءِ، وَغُلِّقَتْ أَبْوَابُ جَهَنَّمَ، وَسُلْسِلَتِ الشَّيَاطِينُ', src: S('Buxari 1899, Muslim 1079'), text: {
        az: '«Ramazan ayı daxil olduqda səmanın qapıları açılır, Cəhənnəmin qapıları bağlanır, şeytanlar isə zəncirlənir».',
        en: '“When the month of Ramadan begins, the gates of heaven are opened, the gates of Hell are closed and the devils are chained.”',
        ru: '«Когда наступает месяц Рамадан, врата неба открываются, врата Ада запираются, а шайтаны сковываются цепями».',
        tr: '“Ramazan ayı girdiğinde göğün kapıları açılır, Cehennem’in kapıları kapanır ve şeytanlar zincire vurulur.”',
      } },
      { t: 'hadith', ar: 'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ', src: S('Buxari 38, Muslim 760'), text: {
        az: '«Kim Ramazanı iman edərək və savabını Allahdan umaraq oruc tutarsa, onun keçmiş günahları bağışlanar».',
        en: '“Whoever fasts Ramadan out of faith and seeking its reward, his previous sins will be forgiven.”',
        ru: '«Тому, кто постился в Рамадан с верой и надеждой на награду Аллаха, будут прощены его прежние грехи».',
        tr: '“Kim inanarak ve sevabını Allah’tan umarak Ramazan orucunu tutarsa geçmiş günahları bağışlanır.”',
      } },
      { t: 'hadith', ar: 'قَالَ اللَّهُ: كُلُّ عَمَلِ ابْنِ آدَمَ لَهُ إِلَّا الصِّيَامَ، فَإِنَّهُ لِي وَأَنَا أَجْزِي بِهِ. وَالصِّيَامُ جُنَّةٌ … لِلصَّائِمِ فَرْحَتَانِ يَفْرَحُهُمَا: إِذَا أَفْطَرَ فَرِحَ، وَإِذَا لَقِيَ رَبَّهُ فَرِحَ بِصَوْمِهِ', src: S('Buxari 1904, Muslim 1151'), text: {
        az: '«Allah buyurur: Adəm övladının hər əməli özü üçündür, oruc isə başqa — o, Mənim üçündür və onun mükafatını Mən verəcəyəm. Oruc qalxandır… Oruc tutanın iki sevinci var: iftar edəndə sevinir, Rəbbinə qovuşanda isə orucuna görə sevinəcək».',
        en: '“Allah said: Every deed of the son of Adam is for him except fasting; it is for Me and I shall reward it. Fasting is a shield… The fasting person has two joys: he rejoices when he breaks his fast, and he will rejoice in his fasting when he meets his Lord.”',
        ru: '«Аллах сказал: „Всякое дело сына Адама — для него самого, кроме поста: он — для Меня, и Я воздам за него“. Пост — это щит… У постящегося две радости: он радуется, разговляясь, и обрадуется своему посту, когда встретит своего Господа».',
        tr: '“Allah buyurdu: Ademoğlunun her ameli kendisi içindir, oruç hariç; o Benim içindir ve mükâfatını Ben vereceğim. Oruç bir kalkandır… Oruçlunun iki sevinci vardır: iftar ettiğinde sevinir, Rabbine kavuştuğunda da orucu sebebiyle sevinir.”',
      } },
      { t: 'hadith', ar: 'إِنَّ فِي الْجَنَّةِ بَابًا يُقَالُ لَهُ الرَّيَّانُ، يَدْخُلُ مِنْهُ الصَّائِمُونَ يَوْمَ الْقِيَامَةِ، لَا يَدْخُلُ مِنْهُ أَحَدٌ غَيْرُهُمْ', src: S('Buxari 1896, Muslim 1152'), text: {
        az: '«Cənnətdə Rəyyan adlı bir qapı var. Qiyamət günü oradan yalnız oruc tutanlar daxil olacaq, onlardan başqa heç kəs oradan girməyəcək».',
        en: '“In Paradise there is a gate called ar-Rayyan through which those who fasted will enter on the Day of Resurrection; no one else will enter through it.”',
        ru: '«В Раю есть врата, называемые ар-Райян. В День воскресения через них войдут постившиеся, и никто, кроме них, через них не войдёт».',
        tr: '“Cennet’te Reyyân denilen bir kapı vardır. Kıyamet günü oradan yalnızca oruçlular girer; onlardan başkası oradan giremez.”',
      } },
      { t: 'hadith', ar: 'مَنْ لَمْ يَدَعْ قَوْلَ الزُّورِ وَالْعَمَلَ بِهِ فَلَيْسَ لِلَّهِ حَاجَةٌ فِي أَنْ يَدَعَ طَعَامَهُ وَشَرَابَهُ', src: S('Buxari 1903'), text: {
        az: '«Kim yalan sözü və ona əməl etməyi tərk etmirsə, Allahın onun yeməyini və içməyini tərk etməsinə ehtiyacı yoxdur».',
        en: '“Whoever does not give up false speech and acting upon it, Allah has no need of his giving up his food and drink.”',
        ru: '«Кто не оставляет лживых слов и действий согласно им, то Аллах не нуждается в том, чтобы он оставлял свою еду и питьё».',
        tr: '“Kim yalan sözü ve onunla amel etmeyi bırakmazsa, Allah’ın onun yemesini ve içmesini bırakmasına ihtiyacı yoktur.”',
      } },
    ],
  },

  // ── 2. Niyyət ──
  {
    id: 'intention', icon: 'target',
    title: { az: 'Niyyət', en: 'The intention', ru: 'Намерение', ar: 'النية', tr: 'Niyet' },
    blocks: [
      { t: 'p', text: {
        az: 'Fərz orucun niyyəti gecədən — sübh açılmamış edilməlidir. Niyyət qəlbin qərarıdır: sabahın Ramazan olduğunu bilib oruc tutmağa qərar verən və səhura qalxan artıq niyyət etmişdir. Niyyəti dillə deməyin Peyğəmbərdən ﷺ gələn heç bir sözü yoxdur.',
        en: 'The intention for an obligatory fast must be made at night, before dawn. Intention is the resolve of the heart: whoever knows that tomorrow is Ramadan, resolves to fast and gets up for suhoor has already intended. No wording for pronouncing the intention has been reported from the Prophet ﷺ.',
        ru: 'Намерение для обязательного поста делается ночью, до наступления зари. Намерение — это решимость сердца: кто знает, что завтра Рамадан, решил поститься и встал на сухур, тот уже сделал намерение. От Пророка ﷺ не передано никаких слов для произнесения намерения вслух.',
        ar: 'تجب نية الصوم الواجب من الليل قبل طلوع الفجر، ومحلّها القلب؛ فمن علم أن غدًا من رمضان وعزم على صومه وقام للسحور فقد نوى. ولم يُنقل عن النبي ﷺ لفظ يُتلفّظ به في النية.',
        tr: 'Farz orucun niyeti geceden, fecir doğmadan yapılmalıdır. Niyet kalbin kararıdır: yarının Ramazan olduğunu bilip oruç tutmaya karar veren ve sahura kalkan kişi niyet etmiş olur. Peygamber’den ﷺ niyeti dille söylemek için nakledilmiş bir lafız yoktur.',
      } },
      { t: 'hadith', ar: 'مَنْ لَمْ يُجْمِعِ الصِّيَامَ قَبْلَ الْفَجْرِ فَلَا صِيَامَ لَهُ', src: S('Əbu Davud 2454'), grade: SAHIH, text: {
        az: '«Kim orucu sübhdən əvvəl qəsd etməyibsə, onun orucu yoxdur».',
        en: '“Whoever does not resolve to fast before dawn, there is no fast for him.”',
        ru: '«У того, кто не решил поститься до рассвета, нет поста».',
        tr: '“Kim fecirden önce oruca azmetmezse onun orucu yoktur.”',
      } },
      { t: 'note', kind: 'info', text: {
        az: 'Nafilə orucda isə səhər heç nə yeyib-içməmişsə, gündüz də niyyət etmək olar: Peyğəmbər ﷺ evdə yemək olmadığını eşidib «Elə isə mən oruc tuturam» demişdir (Muslim 1154).',
        en: 'For a voluntary fast, one may intend during the day if nothing has been eaten since dawn: the Prophet ﷺ, told there was no food in the house, said “Then I am fasting” (Muslim 1154).',
        ru: 'В добровольном посту можно сделать намерение и днём, если с рассвета ничего не ел и не пил: Пророк ﷺ, узнав, что дома нет еды, сказал: «Тогда я пощусь» (Муслим 1154).',
        ar: 'أما صوم النفل فتجوز نيته من النهار إن لم يأكل أو يشرب بعد الفجر؛ فقد قال النبي ﷺ لما قيل له: ليس عندنا شيء: «فإني إذًا صائم» (مسلم 1154).',
        tr: 'Nafile oruçta ise fecirden beri bir şey yenip içilmediyse gündüz de niyet edilebilir: Peygamber ﷺ evde yiyecek olmadığını duyunca “O hâlde ben oruçluyum” buyurmuştur (Müslim 1154).',
      } },
    ],
  },

  // ── 3. Orucu pozanlar ──
  {
    id: 'breakers', icon: 'alert',
    title: { az: 'Orucu pozan şeylər', en: 'What breaks the fast', ru: 'Что нарушает пост', ar: 'مفسدات الصوم', tr: 'Orucu bozan şeyler' },
    blocks: [
      { t: 'ayah', ref: '2:187', ar: 'وَكُلُوا۟ وَٱشْرَبُوا۟ حَتَّىٰ يَتَبَيَّنَ لَكُمُ ٱلْخَيْطُ ٱلْأَبْيَضُ مِنَ ٱلْخَيْطِ ٱلْأَسْوَدِ مِنَ ٱلْفَجْرِ ۖ ثُمَّ أَتِمُّوا۟ ٱلصِّيَامَ إِلَى ٱلَّيْلِ', text: {
        az: '…Dan yerinin ağ sapı qara sapından sizə seçilənədək yeyib-içə bilərsiniz. Sonra gecəyə qədər orucu tamamlayın…',
        en: '…and eat and drink until the white thread of dawn becomes distinct to you from the black thread; then complete the fast until the night…',
        ru: '…Ешьте и пейте, пока не сможете отличить белую нить рассвета от чёрной, а затем поститесь до ночи…',
        tr: '…Fecrin beyaz ipliği siyah iplikten size ayırt edilinceye kadar yiyin, için; sonra orucu geceye kadar tamamlayın…',
      } },
      { t: 'p', text: {
        az: 'Şeyx İbn Useymin «Ramazan ayının məclisləri» əsərində orucu pozan şeyləri yeddi qrupda toplayır:',
        en: 'Shaykh Ibn Uthaymin, in “Majalis Shahr Ramadan”, groups the things that break the fast into seven:',
        ru: 'Шейх Ибн Усеймин в книге «Собрания месяца Рамадан» сводит нарушающее пост к семи пунктам:',
        ar: 'جمع الشيخ ابن عثيمين في «مجالس شهر رمضان» مفسدات الصوم في سبعة:',
        tr: 'Şeyh İbn Useymîn “Ramazan ayı meclisleri” eserinde orucu bozan şeyleri yedi maddede toplar:',
      } },
      { t: 'list', ordered: true, items: [
        { az: 'Cinsi əlaqə — ən ağırıdır: tövbə, o günün qəzası və böyük kəffarə tələb edir (kəffarə ayrıca dərsdə).', en: 'Intercourse — the gravest: it requires repentance, making up the day and the major expiation (see the separate lesson).', ru: 'Половая близость — самое тяжкое: требует покаяния, возмещения дня и большого искупления (см. отдельный урок).', ar: 'الجماع، وهو أعظمها: تجب فيه التوبة وقضاء اليوم والكفارة المغلظة (انظر الدرس المستقل).', tr: 'Cinsel ilişki — en ağırıdır: tövbe, o günün kazası ve ağır kefaret gerektirir (ayrı derste).' },
        { az: 'İstəyərək məni çıxarmaq (öpüş, toxunma, əllə və s. ilə). Yuxuda ehtilam orucu pozmur.', en: 'Deliberately causing ejaculation (by kissing, touching, masturbation, etc.). A wet dream does not break the fast.', ru: 'Намеренное семяизвержение (поцелуями, прикосновениями, рукоблудием и т. п.). Поллюция во сне пост не нарушает.', ar: 'إنزال المني باختياره بتقبيل أو لمس أو استمناء ونحوه، أما الاحتلام فلا يفطر.', tr: 'Bilerek meni getirmek (öpme, dokunma, elle vb.). Uykuda ihtilam orucu bozmaz.' },
        { az: 'Bilərəkdən yemək və içmək — ağız və ya burun yolu ilə mədəyə çatan hər şey.', en: 'Deliberately eating or drinking — anything that reaches the stomach through the mouth or the nose.', ru: 'Намеренная еда и питьё — всё, что попадает в желудок через рот или нос.', ar: 'الأكل والشرب عمدًا، وهو إيصال شيء إلى الجوف عن طريق الفم أو الأنف.', tr: 'Bilerek yemek ve içmek — ağız veya burun yoluyla mideye ulaşan her şey.' },
        { az: 'Yemək-içmək mənasında olanlar: qidalandırıcı iynə və sistemlər, qan köçürülməsi.', en: 'What has the meaning of food and drink: nutritive injections and drips, blood transfusion.', ru: 'То, что равнозначно еде и питью: питательные инъекции и капельницы, переливание крови.', ar: 'ما كان بمعنى الأكل والشرب: الإبر والمحاليل المغذية، ونقل الدم إلى الصائم.', tr: 'Yeme-içme anlamında olanlar: besleyici iğne ve serumlar, kan nakli.' },
        { az: 'Hacamatla qan çıxarmaq; çox qan vermək də onun hökmündədir.', en: 'Letting blood by cupping (hijama); giving a large amount of blood takes the same ruling.', ru: 'Кровопускание хиджамой; сдача большого количества крови имеет тот же шариатский статус.', ar: 'إخراج الدم بالحجامة، ومثلها التبرع بالدم الكثير.', tr: 'Hacamatla kan aldırmak; çok miktarda kan bağışlamak da aynı hükümdedir.' },
        { az: 'Bilərəkdən qusmaq. Özbaşına gələn qusma orucu pozmur.', en: 'Deliberate vomiting. Vomiting that overcomes a person does not break the fast.', ru: 'Намеренная рвота. Невольная рвота пост не нарушает.', ar: 'التقيؤ عمدًا، أما من غلبه القيء فلا يفطر.', tr: 'Bilerek kusmak. Kendiliğinden gelen kusma orucu bozmaz.' },
        { az: 'Heyz və ya nifas qanının gəlməsi — hətta günəş batmazdan bir an əvvəl olsa belə.', en: 'The onset of menstrual or postnatal bleeding — even a moment before sunset.', ru: 'Начало менструального или послеродового кровотечения — даже за миг до заката.', ar: 'خروج دم الحيض أو النفاس ولو قبل الغروب بلحظة.', tr: 'Hayız veya nifas kanının gelmesi — güneş batmadan bir an önce bile olsa.' },
      ] },
      { t: 'hadith', ar: 'مَنْ ذَرَعَهُ قَيْءٌ وَهُوَ صَائِمٌ فَلَيْسَ عَلَيْهِ قَضَاءٌ، وَإِنِ اسْتَقَاءَ فَلْيَقْضِ', src: S('Əbu Davud 2380, Tirmizi 720'), grade: SAHIH, text: {
        az: '«Oruc tutarkən özbaşına qusan şəxsə qəza lazım deyil, bilərəkdən qusan isə qəzasını tutsun».',
        en: '“Whoever is overcome by vomiting while fasting does not have to make up the day, but whoever makes himself vomit must make it up.”',
        ru: '«Тот, кого во время поста одолела рвота, не должен возмещать день, а тот, кто вызвал её намеренно, пусть возместит».',
        tr: '“Oruçluyken kendiliğinden kusana kaza gerekmez; kim kendini kusturursa kaza etsin.”',
      } },
      { t: 'hadith', ar: 'أَفْطَرَ الْحَاجِمُ وَالْمَحْجُومُ', src: S('Əbu Davud 2367'), grade: SAHIH, text: {
        az: '«Hacamat edən də, hacamat olunan da orucunu pozdu».',
        en: '“The one who performs cupping and the one cupped have both broken their fast.”',
        ru: '«Нарушили пост и делающий кровопускание, и тот, кому его делают».',
        tr: '“Hacamat yapan da yaptıran da orucunu bozdu.”',
      } },
      { t: 'note', kind: 'warn', text: {
        az: 'Bu şeylər (heyz və nifasdan başqa) orucu yalnız üç şərtlə pozur: hökmü bilmək, oruclu olduğunu xatırlamaq və öz ixtiyarı ilə etmək. Unudaraq yeyib-içən orucunu tamamlayır: «Unudub yeyib-içən orucunu tamamlasın, çünki onu Allah yedirib-içirdib» (Buxari 1933).',
        en: 'These things (apart from menstruation and postnatal bleeding) break the fast only under three conditions: knowing the ruling, remembering that one is fasting, and doing it by choice. Whoever eats or drinks out of forgetfulness completes the fast: “If he forgets and eats or drinks, let him complete his fast, for it is Allah who fed him and gave him drink” (Bukhari 1933).',
        ru: 'Всё это (кроме менструации и послеродовых кровотечений) нарушает пост лишь при трёх условиях: знании решения, памяти о посте и добровольности. Кто поел или попил по забывчивости, продолжает пост: «Если забудет и поест или попьёт, пусть завершит свой пост, ведь это Аллах накормил и напоил его» (Бухари 1933).',
        ar: 'هذه المفطرات — سوى الحيض والنفاس — لا تفطر إلا بثلاثة شروط: العلم، والتذكر، والاختيار. ومن أكل أو شرب ناسيًا أتمّ صومه: «إِذَا نَسِيَ فَأَكَلَ وَشَرِبَ فَلْيُتِمَّ صَوْمَهُ، فَإِنَّمَا أَطْعَمَهُ اللَّهُ وَسَقَاهُ» (البخاري 1933).',
        tr: 'Bunlar (hayız ve nifas hariç) orucu ancak üç şartla bozar: hükmü bilmek, oruçlu olduğunu hatırlamak ve kendi isteğiyle yapmak. Unutarak yiyip içen orucunu tamamlar: “Unutup yer ve içerse orucunu tamamlasın; çünkü onu Allah yedirip içirmiştir” (Buhârî 1933).',
      } },
    ],
  },

  // ── 4. Orucu pozmayanlar (fətvalar) ──
  {
    id: 'allowed', icon: 'check',
    title: { az: 'Orucu pozmayanlar: tibbi və gündəlik suallar', en: 'What does not break the fast: medical and everyday questions', ru: 'Что не нарушает пост: медицинские и бытовые вопросы', ar: 'ما لا يفسد الصوم: مسائل طبية ويومية', tr: 'Orucu bozmayanlar: tıbbi ve gündelik sorular' },
    blocks: [
      { t: 'p', text: {
        az: 'Aşağıdakı cavablar Şeyx Abdüləziz ibn Baz və Şeyx Muhəmməd ibn Saleh əl-Useyminin fətvalarındandır. Hər cavabın altında mənbə və orijinal fətvanın keçidi var.',
        en: 'The answers below are from the fatwas of Shaykh Abd al-Aziz ibn Baz and Shaykh Muhammad ibn Salih al-Uthaymin. Each answer gives its source and a link to the original fatwa.',
        ru: 'Ниже — ответы из фетв шейха Абд аль-Азиза ибн База и шейха Мухаммада ибн Салиха аль-Усеймина. Под каждым ответом указан источник и ссылка на оригинал фетвы.',
        ar: 'الأجوبة التالية من فتاوى الشيخ عبد العزيز بن باز والشيخ محمد بن صالح العثيمين، مع ذكر المصدر ورابط الفتوى الأصلية تحت كل جواب.',
        tr: 'Aşağıdaki cevaplar Şeyh Abdülaziz b. Bâz ve Şeyh Muhammed b. Salih el-Useymîn’in fetvalarındandır. Her cevabın altında kaynak ve fetvanın aslına bağlantı vardır.',
      } },
      { t: 'qa', items: [
        {
          q: { az: 'Əzələ və ya venadaxili iynə (insulin, antibiotik, peyvənd) orucu pozurmu?', en: 'Do intramuscular or intravenous injections (insulin, antibiotics, vaccines) break the fast?', ru: 'Нарушают ли пост внутримышечные или внутривенные уколы (инсулин, антибиотики, прививки)?', ar: 'هل تفطّر الإبر في العضل أو الوريد (الأنسولين والمضادات الحيوية واللقاحات)؟', tr: 'Kas içi veya damar içi iğneler (insülin, antibiyotik, aşı) orucu bozar mı?' },
          a: { az: 'Xeyr. İbn Baz: «Doğrusu budur ki, onlar orucu pozmur; orucu pozan yalnız qidalandırıcı iynələrdir». Qida əvəz edən iynə və sistemlər isə bilərəkdən vurularsa orucu pozur (Məcmu 15/257); İbn Useymin də eyni fərqi qoyur («Ramazan ayının məclisləri», s. 70).', en: 'No. Ibn Baz: “The correct view is that they do not break the fast; only nutritive injections do.” Injections and drips that replace food do break the fast when taken deliberately (Majmu’ 15/257); Ibn Uthaymin makes the same distinction (Majalis Shahr Ramadan, p. 70).', ru: 'Нет. Ибн Баз: «Верно то, что они не нарушают пост; нарушают только питательные инъекции». Инъекции и капельницы, заменяющие пищу, нарушают пост, если их ставят намеренно (Маджму 15/257); так же различает и Ибн Усеймин («Собрания месяца Рамадан», с. 70).', ar: 'لا. قال ابن باز: «الصحيح أنهما لا تفطران، وإنما التي تفطر هي إبر التغذية خاصة»، وقال: «الصواب أن الإبر المغذية تفطر الصائم إذا تعمد استعمالها» (المجموع 15/257). وبهذا التفريق قال ابن عثيمين (مجالس شهر رمضان ص 70).', tr: 'Hayır. İbn Bâz: “Doğrusu bunların orucu bozmadığıdır; bozan yalnızca besleyici iğnelerdir.” Gıdanın yerini tutan iğne ve serumlar ise bilerek kullanılırsa orucu bozar (Mecmû 15/257); İbn Useymîn de aynı ayrımı yapar (Ramazan ayı meclisleri, s. 70).' },
          ref: BAZ('15/258'), url: URL_BAZ.injections,
        },
        {
          q: { az: 'Astma inhalyatoru (sprey) orucu pozurmu?', en: 'Does an asthma inhaler break the fast?', ru: 'Нарушает ли пост ингалятор от астмы?', ar: 'هل يفطّر بخاخ الربو؟', tr: 'Astım spreyi (inhaler) orucu bozar mı?' },
          a: { az: 'Xeyr. İbn Baz ehtiyac olduqda onu mübah sayır, çünki o, yemək-içməyə bənzəmir, qan analizinə və qidalandırmayan iynələrə bənzəyir (Məcmu 15/265). İbn Useymin: «Bu sprey buxarlanır və mədəyə çatmır… onu oruclu ikən istifadə etməyinizdə qəbahət yoxdur və bununla orucunuz pozulmur» («Fətava Ərkan əl-İslam», s. 475).', en: 'No. Ibn Baz considers it permissible when needed, since it does not resemble eating or drinking but rather drawing blood for tests and non-nutritive injections (Majmu’ 15/265). Ibn Uthaymin: “This inhaler evaporates and does not reach the stomach… there is no harm in using it while fasting and it does not break your fast” (Fatawa Arkan al-Islam, p. 475).', ru: 'Нет. Ибн Баз считал его дозволенным при необходимости, так как он не похож на еду и питьё, а подобен забору крови на анализ и непитательным уколам (Маджму 15/265). Ибн Усеймин: «Этот ингалятор испаряется и не достигает желудка… нет ничего плохого в том, чтобы пользоваться им во время поста, и пост этим не нарушается» («Фатава аркан аль-ислям», с. 475).', ar: 'لا. قال ابن باز: «حكمه الإباحة إذا اضطر إلى ذلك… ولأنه لا يشبه الأكل والشرب فأشبه سحب الدم للتحليل والإبر غير المغذية» (المجموع 15/265). وقال ابن عثيمين: «هذا البخاخ يتبخر ولا يصل إلى المعدة، فحينئذٍ نقول: لا بأس أن تستعمل هذا البخاخ وأنت صائم، ولا تفطر بذلك» (فتاوى أركان الإسلام ص 475).', tr: 'Hayır. İbn Bâz ihtiyaç hâlinde onu mubah sayar; çünkü yeme-içmeye benzemez, tahlil için kan almaya ve besleyici olmayan iğnelere benzer (Mecmû 15/265). İbn Useymîn: “Bu sprey buharlaşır ve mideye ulaşmaz… oruçluyken kullanmanda sakınca yoktur ve bununla orucun bozulmaz” (Fetâvâ Erkâni’l-İslam, s. 475).' },
          ref: BAZ('15/265'), url: URL_BAZ.inhaler,
        },
        {
          q: { az: 'Analiz üçün qan vermək orucu pozurmu?', en: 'Does giving a blood sample for tests break the fast?', ru: 'Нарушает ли пост сдача крови на анализ?', ar: 'هل يفطّر سحب الدم للتحليل؟', tr: 'Tahlil için kan vermek orucu bozar mı?' },
          a: { az: 'Xeyr. İbn Baz: «Belə analiz orucu pozmur, əksinə, ondan güzəşt edilir, çünki ona ehtiyac duyulur və o, şəriətdə məlum olan orucu pozanlardan deyil» (Məcmu 15/274).', en: 'No. Ibn Baz: “Such a test does not invalidate the fast; rather it is excused, because it is needed and it is not of the kind of fast-breakers known in the Shari’ah” (Majmu’ 15/274).', ru: 'Нет. Ибн Баз: «Такой анализ не портит пост, он простителен, так как в нём есть нужда и он не относится к известным в шариате нарушителям поста» (Маджму 15/274).', ar: 'لا. قال ابن باز: «مثل هذا التحليل لا يفسد الصوم بل يعفى عنه؛ لأنه مما تدعو الحاجة إليه، وليس من جنس المفطرات المعلومة من الشرع المطهر» (المجموع 15/274).', tr: 'Hayır. İbn Bâz: “Bu tür bir tahlil orucu bozmaz, bilakis affedilir; çünkü ona ihtiyaç duyulur ve şeriatta bilinen orucu bozan şeylerden değildir” (Mecmû 15/274).' },
          ref: BAZ('15/274'), url: URL_BAZ.blood,
        },
        {
          q: { az: 'Hacamat etdirmək və ya qan donoru olmaq?', en: 'What about cupping (hijama) or donating blood?', ru: 'А хиджама или донорство крови?', ar: 'وما حكم الحجامة والتبرع بالدم؟', tr: 'Hacamat yaptırmak veya kan bağışlamak?' },
          a: { az: 'Hər ikisi orucu pozur. İbn Baz: «Hacamat isə alimlərin ən doğru qovluna görə həm hacamat edəni, həm də olunanı orucdan çıxarır» (Məcmu 15/258). İbn Useymin qan donorluğunun da hacamat kimi olduğunu deyir: ancaq zərurət olan xəstəyə verilir və donor o günün qəzasını tutur («Ramazan ayının məclisləri», s. 71). Gündüz ehtiyac yoxdursa, bunu iftardan sonraya saxlamaq lazımdır.', en: 'Both break the fast. Ibn Baz: “As for cupping, it breaks the fast of both the one who performs it and the one cupped, according to the most correct of the scholars’ views” (Majmu’ 15/258). Ibn Uthaymin says donating blood is like cupping: it is given only to a patient in real need and the donor makes up that day (Majalis Shahr Ramadan, p. 71). Without a daytime need, leave it until after iftar.', ru: 'И то и другое нарушает пост. Ибн Баз: «Что же до хиджамы, то по самому верному мнению учёных она нарушает пост и того, кто делает, и того, кому делают» (Маджму 15/258). Ибн Усеймин говорит, что сдача крови подобна хиджаме: кровь сдают лишь больному в крайней нужде, а донор возмещает этот день («Собрания месяца Рамадан», с. 71). Если дневной нужды нет — отложите до ифтара.', ar: 'كلاهما يفطّر. قال ابن باز: «أما الحجامة فيفطر بها الحاجم والمحجوم في أصح أقوال العلماء» (المجموع 15/258). وجعل ابن عثيمين التبرع بالدم كالحجامة، فلا يتبرع إلا لمريض مضطر، ويقضي ذلك اليوم (مجالس شهر رمضان ص 71). فإن لم تكن حاجة في النهار فليؤخَّر إلى ما بعد الإفطار.', tr: 'İkisi de orucu bozar. İbn Bâz: “Hacamata gelince, âlimlerin en doğru görüşüne göre hacamat yapan da yaptıran da orucunu bozmuş olur” (Mecmû 15/258). İbn Useymîn kan bağışını da hacamat gibi sayar: yalnızca zaruret içindeki hastaya verilir ve bağışçı o günü kaza eder (Ramazan ayı meclisleri, s. 71). Gündüz ihtiyaç yoksa iftardan sonraya bırakın.' },
          ref: BAZ('15/258'), url: URL_BAZ.injections,
        },
        {
          q: { az: 'Diş pastası ilə dişləri fırçalamaq olarmı?', en: 'May I brush my teeth with toothpaste?', ru: 'Можно ли чистить зубы пастой?', ar: 'هل يجوز تنظيف الأسنان بالمعجون؟', tr: 'Diş macunuyla dişler fırçalanabilir mi?' },
          a: { az: 'Bəli. İbn Baz: «Bunda qəbahət yoxdur, bir şeyini udmaqdan qorunmaq şərti ilə»; misvak da günün əvvəlində və sonunda sünnədir (Məcmu 15/261). Təsadüfən boğaza bir az getsə, qəza lazım deyil (Məcmu 15/260).', en: 'Yes. Ibn Baz: “There is no harm in it, while taking care not to swallow any of it”; the siwak is also prescribed at the beginning and the end of the day (Majmu’ 15/261). If a little goes down unintentionally, no make-up is due (Majmu’ 15/260).', ru: 'Да. Ибн Баз: «В этом нет ничего плохого, при условии остерегаться проглатывания»; сивак также узаконен и в начале, и в конце дня (Маджму 15/261). Если что-то нечаянно попало в горло, возмещать не нужно (Маджму 15/260).', ar: 'نعم. قال ابن باز: «لا حرج في ذلك مع التحفظ عن ابتلاع شيء منه، كما يشرع استعمال السواك للصائم في أول النهار وآخره» (المجموع 15/261)، ومن غلبه شيء منه بغير قصد فلا قضاء عليه (المجموع 15/260).', tr: 'Evet. İbn Bâz: “Bir şey yutmaktan sakınmak şartıyla bunda sakınca yoktur”; misvak da günün başında ve sonunda meşrudur (Mecmû 15/261). Kasıtsız olarak biraz boğaza kaçarsa kaza gerekmez (Mecmû 15/260).' },
          ref: BAZ('15/261'), url: URL_BAZ.toothpaste,
        },
        {
          q: { az: 'Göz və qulaq damcıları, sürmə? Burun damcısı?', en: 'Eye and ear drops, kohl? Nasal drops?', ru: 'Глазные и ушные капли, сурьма? Капли в нос?', ar: 'قطرة العين والأذن والكحل؟ وقطرة الأنف؟', tr: 'Göz ve kulak damlası, sürme? Burun damlası?' },
          a: { az: 'Göz və qulaq damcıları, sürmə alimlərin ən doğru qovluna görə orucu pozmur, çünki göz də, qulaq da (qida üçün) keçid deyil; ehtiyat və ixtilafdan çıxmaq üçün onları gecə istifadə etmək daha yaxşıdır (Məcmu 15/262). Burun damcısı isə caiz deyil, çünki burun keçiddir; dadı boğazda hiss edilərsə, o günün qəzası tutulur (Məcmu 15/260).', en: 'Eye and ear drops and kohl do not break the fast according to the more correct of the scholars’ two views, since neither the eye nor the ear is a passage (for food); it is better to use them at night as a precaution and to avoid the disagreement (Majmu’ 15/262). Nasal drops are not allowed, because the nose is a passage; if their taste reaches the throat, the day is made up (Majmu’ 15/260).', ru: 'Глазные и ушные капли и сурьма, по более верному из двух мнений учёных, пост не нарушают, так как ни глаз, ни ухо не являются проходом (для пищи); лучше применять их ночью из осторожности и чтобы выйти из разногласия (Маджму 15/262). Капли в нос недопустимы, так как нос — проход; если вкус почувствовался в горле, день возмещается (Маджму 15/260).', ar: 'قال ابن باز: «الصحيح أن القطرة والكحل لا يفطران مطلقًا في أصح قولي العلماء… لأن العين ليست منفذًا وهكذا الأذن… والأفضل للصائم استعمال القطرة والكحل في الليل احتياطًا وخروجًا من الخلاف» (المجموع 15/262). وقال: «أما القطرة في الأنف فلا تجوز لأن الأنف منفذ»، ومن وجد طعمها في حلقه قضى (المجموع 15/260).', tr: 'Göz ve kulak damlası ile sürme, âlimlerin iki görüşünden daha doğru olanına göre orucu bozmaz; çünkü göz de kulak da (gıda için) bir geçit değildir. İhtiyaten ve ihtilaftan çıkmak için bunları gece kullanmak daha iyidir (Mecmû 15/262). Burun damlası ise caiz değildir, çünkü burun bir geçittir; tadı boğazda hissedilirse o gün kaza edilir (Mecmû 15/260).' },
          ref: BAZ('15/260, 15/262'), url: URL_BAZ.drops,
        },
        {
          q: { az: 'Cünub halında sübhə çıxmaq orucu pozurmu?', en: 'Does reaching dawn in a state of major impurity (janabah) break the fast?', ru: 'Нарушает ли пост то, что рассвет застал в состоянии большого осквернения (джанаба)?', ar: 'هل يضر الصائمَ أن يدركه الفجر وهو جنب؟', tr: 'Cünüp olarak sabaha girmek orucu bozar mı?' },
          a: { az: 'Xeyr. Aişə (Allah ondan razı olsun) deyir: «Ramazanda Peyğəmbər ﷺ cünub halda sübhə çıxar, sonra qüsl edib oruc tutardı» (Buxari 1930). Lakin sübh namazını vaxtında qılmaq üçün qüsl gecikdirilməməlidir.', en: 'No. Aisha (may Allah be pleased with her) said: “Dawn would come upon the Prophet ﷺ in Ramadan while he was in a state of janabah, then he would take a bath and fast” (Bukhari 1930). But the bath should not be delayed past the time of the Fajr prayer.', ru: 'Нет. Аиша (да будет доволен ею Аллах) сказала: «В Рамадан рассвет заставал Пророка ﷺ в состоянии джанабы, после чего он совершал полное омовение и постился» (Бухари 1930). Но омовение нельзя откладывать так, чтобы пропустить время утреннего намаза.', ar: 'لا؛ قالت عائشة رضي الله عنها: «كان النبي ﷺ يدركه الفجر جنبًا في رمضان من غير حلم فيغتسل ويصوم» (البخاري 1930). لكن لا يؤخر الغسل حتى يفوت وقت صلاة الفجر.', tr: 'Hayır. Âişe (Allah ondan razı olsun) şöyle dedi: “Peygamber ﷺ Ramazan’da cünüp olarak sabaha girer, sonra gusledip oruç tutardı” (Buhârî 1930). Ancak gusül, sabah namazının vakti geçecek kadar geciktirilmemelidir.' },
          ref: S('Buxari 1930'),
        },
        {
          q: { az: 'Diş çəkdirmək, yaradan qan axması, özbaşına qusma, kremlər?', en: 'Tooth extraction, bleeding from a wound, involuntary vomiting, creams?', ru: 'Удаление зуба, кровотечение из раны, невольная рвота, кремы?', ar: 'قلع السن، وخروج الدم من جرح، والقيء بغير اختيار، والكريمات؟', tr: 'Diş çektirmek, yaradan kan gelmesi, istemsiz kusma, kremler?' },
          a: { az: 'Bunların heç biri orucu pozmur: diş çəkdirmək və yaraların müalicəsi, yaradan və ya burundan özbaşına qan gəlməsi, istəmədən qusma, dəriyə sürtülən krem və yamaqlar, (heç nə udmamaq şərti ilə) ağzı yaxalamaq. Mənbə — İslam: sual-cavab, №38023 (İbn Useymin və Daimi Komitənin fətvalarına əsasən).', en: 'None of these breaks the fast: pulling a tooth and treating wounds, involuntary bleeding from a wound or the nose, vomiting that overcomes a person, creams and patches on the skin, and rinsing the mouth (provided nothing is swallowed). Source: Islam Q&A no. 38023 (based on fatwas of Ibn Uthaymin and the Permanent Committee).', ru: 'Ничто из этого не нарушает пост: удаление зуба и лечение ран, невольное кровотечение из раны или носа, невольная рвота, кремы и пластыри на коже, полоскание рта (если ничего не проглочено). Источник — «Ислам: вопрос и ответ», № 38023 (на основе фетв Ибн Усеймина и Постоянного комитета).', ar: 'لا يفطّر شيء من ذلك: قلع السن ومداواة الجروح، وخروج الدم من جرح أو رعاف بغير اختيار، والقيء بغير اختيار، والكريمات واللصقات على الجلد، والمضمضة إن لم يبتلع شيئًا. المصدر: الإسلام سؤال وجواب، رقم 38023 (اعتمادًا على فتاوى ابن عثيمين واللجنة الدائمة).', tr: 'Bunların hiçbiri orucu bozmaz: diş çektirmek ve yara tedavisi, yaradan veya burundan istemsiz kan gelmesi, istemsiz kusma, cilde sürülen krem ve bantlar, (bir şey yutmamak şartıyla) ağzı çalkalamak. Kaynak: İslam Soru-Cevap, no. 38023 (İbn Useymîn ve Daimi Komite fetvalarına dayanarak).' },
          ref: { az: 'İslam: sual-cavab, №38023', en: 'Islam Q&A, no. 38023', ru: '«Ислам: вопрос и ответ», № 38023', ar: 'الإسلام سؤال وجواب، رقم 38023', tr: 'İslam Soru-Cevap, no. 38023' },
          url: URL_QA.breakers,
        },
      ] },
    ],
  },

  // ── 5. Oruc tutmayanlar ──
  {
    id: 'exempt', icon: 'user',
    title: { az: 'Kimlərə güzəşt edilib və nə edirlər', en: 'Who is excused and what they do', ru: 'Кому дано облегчение и что им делать', ar: 'أصحاب الأعذار وما يلزمهم', tr: 'Kimlere ruhsat verilmiştir ve ne yaparlar' },
    links: [{ kind: 'lesson', slug: 'kaffarah-fidyah', label: { az: 'Fidyə və kəffarənin təfsilatı — dərs', en: 'Details of fidyah and kaffarah — lesson', ru: 'Подробно о фидье и каффаре — урок', ar: 'تفصيل الفدية والكفارة — درس', tr: 'Fidye ve kefaretin ayrıntıları — ders' } }],
    blocks: [
      { t: 'ayah', ref: '2:184', ar: 'فَمَن كَانَ مِنكُم مَّرِيضًا أَوْ عَلَىٰ سَفَرٍ فَعِدَّةٌ مِّنْ أَيَّامٍ أُخَرَ ۚ وَعَلَى ٱلَّذِينَ يُطِيقُونَهُۥ فِدْيَةٌ طَعَامُ مِسْكِينٍ', text: {
        az: '…Sizdən xəstə olan və ya səfərdə olan, (tutmadığı günlərin) sayı qədər başqa günlərdə oruc tutsun. Ona (çətinliklə) dözə bilənlərin üzərinə isə fidyə — bir yoxsulu yedirtmək düşür…',
        en: '…So whoever of you is ill or on a journey, then an equal number of other days. And upon those who can fast only with hardship is a ransom: feeding a poor person…',
        ru: '…А если кто-либо из вас болен или находится в пути, то пусть постится столько же дней в другое время. А на тех, кто способен поститься лишь с трудом, — искупление: накормить бедняка…',
        tr: '…Sizden kim hasta veya yolculukta olursa, tutamadığı günler sayısınca başka günlerde tutar. Ona ancak güçlükle dayananlara ise fidye, bir yoksulu doyurmak gerekir…',
      } },
      { t: 'table',
        head: [
          { az: 'Kim', en: 'Who', ru: 'Кто', ar: 'من', tr: 'Kim' },
          { az: 'Hökm', en: 'Ruling', ru: 'Решение', ar: 'الحكم', tr: 'Hüküm' },
          { az: 'Dəlil', en: 'Evidence', ru: 'Довод', ar: 'الدليل', tr: 'Delil' },
        ],
        rows: [
          [
            { az: 'Keçici xəstə', en: 'Temporarily ill', ru: 'Временно больной', ar: 'المريض مرضًا يُرجى برؤه', tr: 'Geçici hasta' },
            { az: 'Oruc ona zərər verirsə və ya çətinlik yaradırsa, tutmur; sağalandan sonra qəzasını tutur.', en: 'If fasting harms him or is a hardship, he does not fast and makes the days up after recovering.', ru: 'Если пост вредит или тяжёл, не постится и возмещает дни после выздоровления.', ar: 'إن شقّ عليه الصوم أو ضرّه أفطر، وقضى بعد برئه.', tr: 'Oruç ona zarar veriyor veya zorluk çıkarıyorsa tutmaz; iyileşince kaza eder.' },
            { az: 'Bəqərə 2:184', en: 'Quran 2:184', ru: 'Коран 2:184', ar: 'البقرة 184', tr: 'Bakara 2:184' },
          ],
          [
            { az: 'Yolçu (müsafir)', en: 'Traveller', ru: 'Путник', ar: 'المسافر', tr: 'Yolcu' },
            { az: 'Seçim edə bilər: tutar və ya tutmaz; tutmadığı günlərin qəzası lazımdır.', en: 'May choose to fast or not; days not fasted are made up.', ru: 'Вправе поститься или нет; пропущенные дни возмещает.', ar: 'مخيّر بين الصوم والفطر، ويقضي ما أفطر.', tr: 'Tutmakla tutmamak arasında serbesttir; tutmadığı günleri kaza eder.' },
            { az: 'Buxari 1943, Muslim 1121', en: 'Bukhari 1943, Muslim 1121', ru: 'Бухари 1943, Муслим 1121', ar: 'البخاري 1943، مسلم 1121', tr: 'Buhârî 1943, Müslim 1121' },
          ],
          [
            { az: 'Hamilə və ya əmizdirən qadın', en: 'Pregnant or nursing woman', ru: 'Беременная или кормящая', ar: 'الحامل والمرضع', tr: 'Hamile veya emziren kadın' },
            { az: 'Özünə və ya uşağa görə qorxarsa, tutmaya bilər və sonra qəzasını tutur. Fidyə ilə bağlı alimlərin fikri dərsdə.', en: 'If she fears for herself or the child she may not fast, and makes the days up later. The scholars’ views on fidyah are in the lesson.', ru: 'Если опасается за себя или ребёнка, может не поститься и возмещает позже. Мнения учёных о фидье — в уроке.', ar: 'إن خافت على نفسها أو ولدها أفطرت وقضت. وأقوال العلماء في الفدية في الدرس.', tr: 'Kendisi veya çocuğu için endişe ederse tutmayabilir ve sonra kaza eder. Fidye hakkındaki görüşler derstedir.' },
            { az: 'Əbu Davud 2408', en: 'Abu Dawud 2408', ru: 'Абу Дауд 2408', ar: 'أبو داود 2408', tr: 'Ebû Dâvûd 2408' },
          ],
          [
            { az: 'Qoca və sağalmaz xəstə', en: 'The elderly and the incurably ill', ru: 'Старики и неизлечимо больные', ar: 'الكبير العاجز والمريض الذي لا يُرجى برؤه', tr: 'Yaşlı ve iyileşmesi umulmayan hasta' },
            { az: 'Oruc fərz deyil; hər gün üçün bir yoxsulu yedirdir (miqdarı dərsdə).', en: 'Fasting is not required; he feeds one poor person for each day (amount in the lesson).', ru: 'Пост не обязателен; за каждый день кормит одного бедняка (размер — в уроке).', ar: 'لا يلزمه الصوم، ويطعم عن كل يوم مسكينًا (والمقدار في الدرس).', tr: 'Oruç farz değildir; her gün için bir yoksulu doyurur (miktarı derste).' },
            { az: 'Buxari 4505 (İbn Abbas)', en: 'Bukhari 4505 (Ibn Abbas)', ru: 'Бухари 4505 (Ибн Аббас)', ar: 'البخاري 4505 (ابن عباس)', tr: 'Buhârî 4505 (İbn Abbas)' },
          ],
          [
            { az: 'Heyz və ya nifas halında qadın', en: 'Woman in menstruation or postnatal bleeding', ru: 'Женщина во время менструации или послеродового кровотечения', ar: 'الحائض والنفساء', tr: 'Hayız veya nifas hâlindeki kadın' },
            { az: 'Oruc tutması caiz deyil; günlərin qəzasını tutur (namazın qəzası yoxdur).', en: 'She must not fast; she makes up the days (but not the prayers).', ru: 'Ей нельзя поститься; дни поста она возмещает (намазы — нет).', ar: 'يحرم عليها الصوم، وتقضي الصيام دون الصلاة.', tr: 'Oruç tutması caiz değildir; günleri kaza eder (namazı kaza etmez).' },
            { az: 'Muslim 335', en: 'Muslim 335', ru: 'Муслим 335', ar: 'مسلم 335', tr: 'Müslim 335' },
          ],
        ] },
      { t: 'hadith', ar: 'إِنَّ اللَّهَ تَعَالَى وَضَعَ شَطْرَ الصَّلَاةِ أَوْ نِصْفَ الصَّلَاةِ وَالصَّوْمَ عَنِ الْمُسَافِرِ وَعَنِ الْمُرْضِعِ أَوِ الْحُبْلَى', src: S('Əbu Davud 2408'), grade: HASAN_SAHIH, text: {
        az: '«Həqiqətən, Uca Allah yolçudan namazın yarısını və orucu, əmizdirən və ya hamilə qadından da (orucu) götürmüşdür».',
        en: '“Allah the Exalted has lifted half of the prayer and fasting from the traveller, and (fasting) from the nursing or pregnant woman.”',
        ru: '«Поистине, Всевышний Аллах снял с путника половину молитвы и пост, а также (пост) с кормящей и беременной».',
        tr: '“Yüce Allah yolcudan namazın yarısını ve orucu, emziren ve hamile kadından da (orucu) kaldırmıştır.”',
      } },
      { t: 'quote', ar: 'هُوَ الشَّيْخُ الْكَبِيرُ وَالْمَرْأَةُ الْكَبِيرَةُ لَا يَسْتَطِيعَانِ أَنْ يَصُومَا، فَلْيُطْعِمَانِ مَكَانَ كُلِّ يَوْمٍ مِسْكِينًا', by: { az: 'İbn Abbas (Allah onlardan razı olsun)', en: 'Ibn Abbas (may Allah be pleased with them)', ru: 'Ибн Аббас (да будет доволен Аллах ими обоими)', ar: 'ابن عباس رضي الله عنهما', tr: 'İbn Abbas (Allah ikisinden razı olsun)' }, ref: S('Buxari 4505'), text: {
        az: '«(Bu ayə) oruc tuta bilməyən qoca kişi və qoca qadın haqqındadır: onlar hər günün əvəzinə bir yoxsulu yedirtsinlər».',
        en: '“(This verse) is about the old man and the old woman who cannot fast: let them feed one poor person for each day.”',
        ru: '«(Этот аят) — о старике и старухе, которые не в силах поститься: пусть за каждый день кормят одного бедняка».',
        tr: '“(Bu ayet) oruç tutamayan yaşlı erkek ve yaşlı kadın hakkındadır: her gün yerine bir yoksulu doyursunlar.”',
      } },
      { t: 'note', kind: 'tip', text: {
        az: 'Qəza növbəti Ramazana qədər tutula bilər: Aişə (Allah ondan razı olsun) Ramazandan qalan günlərin qəzasını çox vaxt Şabanda tutardı (Buxari 1950).',
        en: 'Missed days may be made up any time before the next Ramadan: Aisha (may Allah be pleased with her) would often make up her days in Sha’ban (Bukhari 1950).',
        ru: 'Пропущенные дни можно возместить до следующего Рамадана: Аиша (да будет доволен ею Аллах) часто возмещала их лишь в шаабане (Бухари 1950).',
        ar: 'يجوز تأخير القضاء إلى ما قبل رمضان التالي؛ فقد كانت عائشة رضي الله عنها لا تستطيع أن تقضي إلا في شعبان (البخاري 1950).',
        tr: 'Kaza bir sonraki Ramazan’a kadar tutulabilir: Âişe (Allah ondan razı olsun) kaza oruçlarını çoğu zaman Şaban’da tutardı (Buhârî 1950).',
      } },
    ],
  },

  // ── 6. Səhur və iftar ──
  {
    id: 'suhoor-iftar', icon: 'moonStar',
    title: { az: 'Səhur və iftarın sünnələri', en: 'Sunnahs of suhoor and iftar', ru: 'Сунны сухура и ифтара', ar: 'سنن السحور والإفطار', tr: 'Sahur ve iftarın sünnetleri' },
    blocks: [
      { t: 'steps', items: [
        { title: { az: 'Səhur edin', en: 'Eat suhoor', ru: 'Совершайте сухур', ar: 'تسحّروا', tr: 'Sahura kalkın' },
          text: { az: '«Səhur edin, çünki səhurda bərəkət var» (Buxari 1923). Bir neçə xurma və ya bir qurtum su da səhurdur.', en: '“Eat suhoor, for in suhoor there is blessing” (Bukhari 1923). Even a few dates or a sip of water count.', ru: '«Ешьте перед рассветом, ведь в сухуре — благодать» (Бухари 1923). Сухуром будут даже несколько фиников или глоток воды.', ar: '«تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً» (البخاري 1923)، ولو بتمرات أو جرعة ماء.', tr: '“Sahur yapın, çünkü sahurda bereket vardır” (Buhârî 1923). Birkaç hurma veya bir yudum su da sahurdur.' } },
        { title: { az: 'Səhuru gecikdirin', en: 'Delay suhoor', ru: 'Откладывайте сухур', ar: 'تأخير السحور', tr: 'Sahuru geciktirin' },
          text: { az: 'Zeyd ibn Sabit: «Peyğəmbərlə ﷺ səhur etdik, sonra o, namaza qalxdı». Aralarındakı vaxt əlli ayə oxunacaq qədər idi (Buxari 1921). İmsakiyyədəki imsak vaxtı səhurun sonudur.', en: 'Zayd ibn Thabit: “We ate suhoor with the Prophet ﷺ, then he got up for the prayer” — the time between them was about the recitation of fifty verses (Bukhari 1921). The imsak time in the timetable marks the end of suhoor.', ru: 'Зейд ибн Сабит: «Мы ели сухур с Пророком ﷺ, затем он встал на молитву» — между ними было время чтения около пятидесяти аятов (Бухари 1921). Имсак в расписании — конец сухура.', ar: 'قال زيد بن ثابت: «تسحّرنا مع النبي ﷺ ثم قام إلى الصلاة»، وكان بينهما قدر خمسين آية (البخاري 1921). ووقت الإمساك في الجدول هو نهاية السحور.', tr: 'Zeyd b. Sâbit: “Peygamber ﷺ ile sahur yaptık, sonra namaza kalktı” — aralarında elli ayet okunacak kadar vakit vardı (Buhârî 1921). Tablodaki imsak vakti sahurun sonudur.' } },
        { title: { az: 'İftarı tələsdirin', en: 'Hasten iftar', ru: 'Спешите с ифтаром', ar: 'تعجيل الفطر', tr: 'İftarda acele edin' },
          text: { az: '«İnsanlar iftarı tələsdirdikcə xeyir içində olacaqlar» (Buxari 1957, Muslim 1098). Günəş batan kimi — məğrib azanı ilə — iftar edilir.', en: '“People will remain upon good as long as they hasten to break the fast” (Bukhari 1957, Muslim 1098). Break the fast as soon as the sun has set, with the Maghrib adhan.', ru: '«Люди будут пребывать в благе, пока будут спешить с разговением» (Бухари 1957, Муслим 1098). Разговляйтесь сразу после заката, с азаном магриба.', ar: '«لَا يَزَالُ النَّاسُ بِخَيْرٍ مَا عَجَّلُوا الْفِطْرَ» (البخاري 1957، مسلم 1098)، فيُفطر عند غروب الشمس مع أذان المغرب.', tr: '“İnsanlar iftarda acele ettikleri sürece hayır üzere olurlar” (Buhârî 1957, Müslim 1098). Güneş batar batmaz, akşam ezanıyla iftar edilir.' } },
        { title: { az: 'Təzə xurma, quru xurma və ya su ilə', en: 'With fresh dates, dried dates or water', ru: 'Свежими финиками, сушёными или водой', ar: 'على رطبات أو تمرات أو ماء', tr: 'Taze hurma, kuru hurma veya suyla' },
          text: { az: 'Peyğəmbər ﷺ namazdan əvvəl bir neçə təzə xurma ilə iftar edərdi; olmasa quru xurma ilə, o da olmasa bir neçə qurtum su ilə (Əbu Davud 2356; Albani: həsən səhih).', en: 'The Prophet ﷺ would break his fast before praying with a few fresh dates; if there were none, then dried dates; if none, a few sips of water (Abu Dawud 2356; al-Albani: hasan sahih).', ru: 'Пророк ﷺ разговлялся перед молитвой несколькими свежими финиками, если их не было — сушёными, а если не было и их — несколькими глотками воды (Абу Дауд 2356; аль-Альбани: хороший достоверный).', ar: 'كان النبي ﷺ يُفطر قبل أن يصلي على رطبات، فإن لم تكن فعلى تمرات، فإن لم تكن حسا حسوات من ماء (أبو داود 2356، وقال الألباني: حسن صحيح).', tr: 'Peygamber ﷺ namazdan önce birkaç taze hurmayla iftar ederdi; yoksa kuru hurmayla, o da yoksa birkaç yudum suyla (Ebû Dâvûd 2356; Elbânî: hasen sahih).' } },
        { title: { az: 'İftar duasını deyin', en: 'Say the iftar dua', ru: 'Произнесите дуа ифтара', ar: 'قول دعاء الإفطار', tr: 'İftar duasını okuyun' },
          text: { az: 'Aşağıdakı dua Peyğəmbərdən ﷺ səhih sənədlə gəlmişdir.', en: 'The dua below is reported from the Prophet ﷺ with an acceptable chain.', ru: 'Приведённое ниже дуа передано от Пророка ﷺ с приемлемым иснадом.', ar: 'الدعاء الآتي ثابت عن النبي ﷺ بإسناد حسن.', tr: 'Aşağıdaki dua Peygamber’den ﷺ makbul bir senetle nakledilmiştir.' } },
        { title: { az: 'Oruc tutanı yedirdin', en: 'Feed a fasting person', ru: 'Накормите постящегося', ar: 'تفطير الصائم', tr: 'Oruçluya iftar verin' },
          text: { az: '«Kim oruc tutanı iftar etdirsə, ona onun savabı qədər savab yazılar, oruc tutanın savabından isə heç nə əskilməz» (Tirmizi 807; Albani: səhih).', en: '“Whoever gives a fasting person something to break his fast will have a reward like his, without anything being diminished from the reward of the fasting person” (Tirmidhi 807; al-Albani: sahih).', ru: '«Тому, кто накормит постящегося при разговении, будет такая же награда, как ему, и при этом награда постящегося ничуть не уменьшится» (Тирмизи 807; аль-Альбани: достоверный).', ar: '«مَنْ فَطَّرَ صَائِمًا كَانَ لَهُ مِثْلُ أَجْرِهِ، غَيْرَ أَنَّهُ لَا يَنْقُصُ مِنْ أَجْرِ الصَّائِمِ شَيْئًا» (الترمذي 807، وصححه الألباني).', tr: '“Kim bir oruçluya iftar ettirirse, oruçlunun ecrinden hiçbir şey eksilmeden onun ecri kadar ecir alır” (Tirmizî 807; Elbânî: sahih).' } },
      ] },
      { t: 'dua', ar: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ', src: { az: 'Əbu Davud 2357 (əl-Albani: həsən)', en: 'Abu Dawud 2357 (al-Albani: hasan)', ru: 'Абу Дауд 2357 (аль-Альбани: хороший)', ar: 'أبو داود 2357 (حسّنه الألباني)', tr: 'Ebû Dâvûd 2357 (Elbânî: hasen)' },
        translit: { az: 'Zəhəbəz-zaməu vəbtəlləti-l-uruqu və səbətəl-əcru in şəə Allah.', en: 'Dhahaba-ẓ-ẓamaʾu wabtallati-l-ʿurūqu wa thabata-l-ajru in shāʾa-llāh.', ru: 'Захаба-з-замау ва-бталляти-ль-уруку ва сабата-ль-аджру ин ша Аллах.', tr: 'Zehebe’z-zamau ve’btelleti’l-urûku ve sebete’l-ecru inşâallah.' },
        text: { az: 'Susuzluq getdi, damarlar islandı və inşallah, savab sabit oldu.', en: 'The thirst is gone, the veins are moistened and the reward is assured, if Allah wills.', ru: 'Ушла жажда, увлажнились жилы, и награда утвердилась, если пожелает Аллах.', tr: 'Susuzluk gitti, damarlar ıslandı ve inşallah ecir sabit oldu.' } },
      { t: 'note', kind: 'info', text: {
        az: 'Geniş yayılmış «Allahummə ləkə sumtu və alə rizqikə əftartu» duası Əbu Davudda (2358) mürsəl sənədlə gəlir; əl-Albani onu zəif saymışdır. Ona görə yuxarıdakı həsən dua üstün tutulur.',
        en: 'The widespread “Allahumma laka sumtu wa ‘ala rizqika aftartu” is reported by Abu Dawud (2358) with a mursal chain, and al-Albani graded it weak. The hasan dua above is therefore preferred.',
        ru: 'Распространённое «Аллахумма ляка сумту ва аля ризкыка афтарту» передано у Абу Дауда (2358) с прерванным (мурсаль) иснадом, и аль-Альбани счёл его слабым. Поэтому предпочтительно хорошее дуа, приведённое выше.',
        ar: 'أما «اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ» فرواه أبو داود (2358) مرسلًا، وضعّفه الألباني؛ فالدعاء الحسن السابق أولى.',
        tr: 'Yaygın olan “Allahümme leke sumtu ve alâ rizkıke eftartu” duası Ebû Dâvûd’da (2358) mürsel bir senetle gelir; Elbânî onu zayıf saymıştır. Bu yüzden yukarıdaki hasen dua tercih edilir.',
      } },
    ],
  },

  // ── 7. Təravih ──
  {
    id: 'taraweeh', icon: 'moon',
    title: { az: 'Təravih və gecə namazı', en: 'Taraweeh and night prayer', ru: 'Таравих и ночная молитва', ar: 'التراويح وقيام الليل', tr: 'Teravih ve gece namazı' },
    blocks: [
      { t: 'hadith', ar: 'مَنْ قَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ', src: S('Buxari 37, Muslim 759'), text: {
        az: '«Kim Ramazanı iman edərək və savabını Allahdan umaraq (gecə namazı ilə) ihya edərsə, keçmiş günahları bağışlanar».',
        en: '“Whoever stands (in prayer) in Ramadan out of faith and seeking its reward, his previous sins will be forgiven.”',
        ru: '«Тому, кто простаивал (в молитве ночи) Рамадана с верой и надеждой на награду, будут прощены его прежние грехи».',
        tr: '“Kim inanarak ve sevabını umarak Ramazan gecelerini namazla ihya ederse geçmiş günahları bağışlanır.”',
      } },
      { t: 'hadith', ar: 'مَا كَانَ رَسُولُ اللَّهِ ﷺ يَزِيدُ فِي رَمَضَانَ وَلَا فِي غَيْرِهِ عَلَى إِحْدَى عَشْرَةَ رَكْعَةً، يُصَلِّي أَرْبَعًا فَلَا تَسَلْ عَنْ حُسْنِهِنَّ وَطُولِهِنَّ، ثُمَّ يُصَلِّي أَرْبَعًا فَلَا تَسَلْ عَنْ حُسْنِهِنَّ وَطُولِهِنَّ، ثُمَّ يُصَلِّي ثَلَاثًا', src: S('Buxari 1147'), text: {
        az: 'Aişə (Allah ondan razı olsun): «Allahın Elçisi ﷺ nə Ramazanda, nə də başqa vaxt on bir rükətdən artıq qılmazdı. Dörd rükət qılardı — onların gözəlliyindən və uzunluğundan soruşma; sonra yenə dörd — onların gözəlliyindən və uzunluğundan soruşma; sonra üç rükət qılardı».',
        en: 'Aisha (may Allah be pleased with her): “The Messenger of Allah ﷺ never prayed more than eleven rak’ahs, in Ramadan or outside it. He would pray four — do not ask about their beauty and length; then four — do not ask about their beauty and length; then three.”',
        ru: 'Аиша (да будет доволен ею Аллах): «Посланник Аллаха ﷺ ни в Рамадан, ни в другое время не совершал больше одиннадцати ракаатов. Он молился четыре — и не спрашивай об их красоте и продолжительности, потом ещё четыре — и не спрашивай об их красоте и продолжительности, а потом три».',
        tr: 'Âişe (Allah ondan razı olsun): “Resûlullah ﷺ ne Ramazan’da ne de başka zamanda on bir rekâttan fazla kılmazdı. Dört rekât kılardı — güzelliğini ve uzunluğunu sorma; sonra dört rekât daha — güzelliğini ve uzunluğunu sorma; sonra üç rekât kılardı.”',
      } },
      { t: 'hadith', ar: 'إِنَّهُ مَنْ قَامَ مَعَ الْإِمَامِ حَتَّى يَنْصَرِفَ كُتِبَ لَهُ قِيَامُ لَيْلَةٍ', src: S('Tirmizi 806'), grade: SAHIH, text: {
        az: '«Kim imamla birlikdə o (namazı) bitirənədək qılarsa, ona bütün gecəni ibadətlə keçirmiş kimi yazılar».',
        en: '“Whoever prays with the imam until he finishes, the reward of a whole night of prayer is written for him.”',
        ru: '«Тому, кто молится с имамом, пока тот не закончит, записывается (награда) за стояние всей ночи».',
        tr: '“Kim imamla birlikte o namazı bitirene kadar kılarsa, ona bütün geceyi ihya etmiş sevabı yazılır.”',
      } },
      { t: 'p', text: {
        az: 'Ömər (Allah ondan razı olsun) insanları məsciddə Übeyy ibn Kəbin arxasında bir imama topladı (Buxari 2010). Rükət sayına gəldikdə, Sələf alimləri arasında iki yanaşma var:',
        en: 'Umar (may Allah be pleased with him) gathered the people in the mosque behind one imam, Ubayy ibn Ka’b (Bukhari 2010). On the number of rak’ahs, the scholars of the Sunnah have two approaches:',
        ru: 'Умар (да будет доволен им Аллах) собрал людей в мечети за одним имамом — Убаййем ибн Каабом (Бухари 2010). О числе ракаатов у учёных Сунны два подхода:',
        ar: 'جمع عمر رضي الله عنه الناس في المسجد على قارئ واحد هو أُبيّ بن كعب (البخاري 2010). وأما عدد الركعات فلأهل العلم فيه مسلكان:',
        tr: 'Ömer (Allah ondan razı olsun) insanları mescitte tek bir imamın, Übey b. Kâ’b’ın arkasında topladı (Buhârî 2010). Rekât sayısı konusunda Sünnet âlimlerinin iki yaklaşımı vardır:',
      } },
      { t: 'list', items: [
        { az: 'Şeyx əl-Albani «Salətut-Təravih» kitabında Peyğəmbərin ﷺ əməlindən sabit olan on bir rükətdən artığa getməməyi seçmişdir.', en: 'Shaykh al-Albani, in his book “Salat at-Tarawih”, held to the eleven rak’ahs established from the practice of the Prophet ﷺ, without adding to them.', ru: 'Шейх аль-Альбани в книге «Салят ат-таравих» придерживался одиннадцати ракаатов, установленных из практики Пророка ﷺ, без добавлений.', ar: 'اختار الشيخ الألباني في كتابه «صلاة التراويح» الاقتصار على إحدى عشرة ركعة الثابتة من فعل النبي ﷺ.', tr: 'Şeyh Elbânî “Salâtu’t-Terâvîh” kitabında Peygamber’in ﷺ uygulamasıyla sabit olan on bir rekâtla yetinmeyi tercih etmiştir.' },
        { az: 'Şeyx İbn Baz və Şeyx İbn Useymin: müəyyən hədd yoxdur, çünki «gecə namazı ikibəikidir» (Buxari 990); ən fəzilətlisi Peyğəmbərin ﷺ çox vaxt qıldığı 11 və ya 13 rükətdir, 23 və daha çox qılmaq da caizdir.', en: 'Shaykh Ibn Baz and Shaykh Ibn Uthaymin: there is no fixed limit, since “the night prayer is two by two” (Bukhari 990); the best is 11 or 13, the Prophet’s ﷺ usual practice, while 23 or more is also permissible.', ru: 'Шейх Ибн Баз и шейх Ибн Усеймин: строгого предела нет, так как «ночная молитва — по два (ракаата)» (Бухари 990); лучше всего 11 или 13, как обычно молился Пророк ﷺ, но допустимо и 23, и больше.', ar: 'الشيخ ابن باز والشيخ ابن عثيمين: ليس لها حد محدود؛ لحديث «صَلَاةُ اللَّيْلِ مَثْنَى مَثْنَى» (البخاري 990)، والأفضل إحدى عشرة أو ثلاث عشرة وهو الغالب من فعله ﷺ، ولا بأس بثلاث وعشرين أو أكثر.', tr: 'Şeyh İbn Bâz ve Şeyh İbn Useymîn: belirli bir sınır yoktur; çünkü “gece namazı ikişer ikişerdir” (Buhârî 990). En faziletlisi Peygamber’in ﷺ çoğunlukla kıldığı 11 veya 13 rekâttır; 23 ve daha fazlası da caizdir.' },
      ] },
      { t: 'quote', ar: 'فليس لهذا حد محدود… لكن الأفضل إحدى عشرة، أو ثلاث عشرة؛ لأن هذا هو الغالب من فعل النبي ﷺ', by: { az: 'Şeyx İbn Baz', en: 'Shaykh Ibn Baz', ru: 'Шейх Ибн Баз', ar: 'الشيخ ابن باز', tr: 'Şeyh İbn Bâz' }, ref: { az: 'Nurun alə-d-Dərb, fətva 13477', en: 'Nur ‘ala ad-Darb, fatwa 13477', ru: '«Нур аля ад-дарб», фетва 13477', ar: 'نور على الدرب، الفتوى 13477', tr: 'Nûrun ale’d-Derb, fetva 13477' }, text: {
        az: '«Bunun müəyyən həddi yoxdur… lakin ən fəzilətlisi on bir və ya on üç rükətdir, çünki Peyğəmbər ﷺ çox vaxt belə qılardı».',
        en: '“There is no fixed limit for it… but the best is eleven or thirteen, because that was most often the practice of the Prophet ﷺ.”',
        ru: '«Для этого нет установленного предела… но лучше всего одиннадцать или тринадцать, так как чаще всего так поступал Пророк ﷺ».',
        tr: '“Bunun belirli bir sınırı yoktur… ancak en faziletlisi on bir veya on üç rekâttır; çünkü Peygamber ﷺ çoğunlukla böyle kılardı.”',
      } },
      { t: 'note', kind: 'tip', text: {
        az: 'İbn Useymin «əş-Şərh əl-Mumti» (4/73–75) əsərində hər iki tərəfi ifratdan çəkindirir: on birdən çox qılanı da, on birlə kifayətlənəni də qınamaq düzgün deyil. Ən vacibi namazın sakitliklə, gözəl qılınması və imamla sona qədər qalmaqdır.',
        en: 'Ibn Uthaymin, in “ash-Sharh al-Mumti’” (4/73–75), warns both sides against excess: neither those who pray more than eleven nor those who keep to eleven should be censured. What matters most is praying calmly and well, and staying with the imam until he finishes.',
        ru: 'Ибн Усеймин в «аш-Шарх аль-мумти» (4/73–75) предостерегает обе стороны от крайностей: не следует порицать ни тех, кто молится больше одиннадцати, ни тех, кто ограничивается одиннадцатью. Главное — молиться спокойно и хорошо и оставаться с имамом до конца.',
        ar: 'قال ابن عثيمين في «الشرح الممتع» (4/73–75): «لا ينبغي لنا أن نغلو أو نفرط»، فلا يُنكر على من زاد على إحدى عشرة ولا على من اقتصر عليها، والأهم الطمأنينة وإحسان الصلاة والبقاء مع الإمام حتى ينصرف.',
        tr: 'İbn Useymîn “eş-Şerhu’l-Mumti” (4/73–75) eserinde iki tarafı da aşırılıktan sakındırır: on birden fazla kılan da on birle yetinen de kınanmamalıdır. Asıl önemli olan namazı huzurla, güzelce kılmak ve imamla sonuna kadar kalmaktır.',
      } },
    ],
  },

  // ── 8. Qədr gecəsi ──
  {
    id: 'laylat-al-qadr', icon: 'star',
    title: { az: 'Qədr gecəsi', en: 'Laylat al-Qadr', ru: 'Ночь предопределения', ar: 'ليلة القدر', tr: 'Kadir gecesi' },
    blocks: [
      { t: 'ayah', ref: '97:3', ar: 'لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ', text: {
        az: 'Qədr gecəsi min aydan xeyirlidir.',
        en: 'The Night of Decree is better than a thousand months.',
        ru: 'Ночь предопределения лучше тысячи месяцев.',
        tr: 'Kadir gecesi bin aydan hayırlıdır.',
      } },
      { t: 'hadith', ar: 'تَحَرَّوْا لَيْلَةَ الْقَدْرِ فِي الْوِتْرِ مِنَ الْعَشْرِ الْأَوَاخِرِ مِنْ رَمَضَانَ', src: S('Buxari 2017'), text: {
        az: '«Qədr gecəsini Ramazanın son on gecəsinin tək gecələrində axtarın».',
        en: '“Seek Laylat al-Qadr in the odd nights of the last ten of Ramadan.”',
        ru: '«Ищите Ночь предопределения в нечётные ночи последней десятки Рамадана».',
        tr: '“Kadir gecesini Ramazan’ın son on gecesinin tek gecelerinde arayın.”',
      } },
      { t: 'hadith', ar: 'كَانَ النَّبِيُّ ﷺ إِذَا دَخَلَ الْعَشْرُ شَدَّ مِئْزَرَهُ، وَأَحْيَا لَيْلَهُ، وَأَيْقَظَ أَهْلَهُ', src: S('Buxari 2024'), text: {
        az: 'Aişə (Allah ondan razı olsun): «Son on gecə daxil olanda Peyğəmbər ﷺ belini möhkəm bağlayar (ibadətə tam hazırlaşar), gecəsini ihya edər və ailəsini oyadardı».',
        en: 'Aisha (may Allah be pleased with her): “When the last ten began, the Prophet ﷺ would tighten his waist-wrap, spend the night in worship and wake his family.”',
        ru: 'Аиша (да будет доволен ею Аллах): «Когда наступали последние десять ночей, Пророк ﷺ крепко подвязывал изар, оживлял ночь поклонением и будил свою семью».',
        tr: 'Âişe (Allah ondan razı olsun): “Son on gece girince Peygamber ﷺ eteğini sıkıca bağlar, gecesini ibadetle ihya eder ve ailesini uyandırırdı.”',
      } },
      { t: 'hadith', ar: 'مَنْ قَامَ لَيْلَةَ الْقَدْرِ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ', src: S('Buxari 1901, Muslim 760'), text: {
        az: '«Kim Qədr gecəsini iman edərək və savabını umaraq ibadətlə keçirsə, keçmiş günahları bağışlanar».',
        en: '“Whoever stands in prayer on Laylat al-Qadr out of faith and seeking its reward, his previous sins will be forgiven.”',
        ru: '«Тому, кто простоит в молитве Ночь предопределения с верой и надеждой на награду, будут прощены его прежние грехи».',
        tr: '“Kim inanarak ve sevabını umarak Kadir gecesini ihya ederse geçmiş günahları bağışlanır.”',
      } },
      { t: 'p', text: {
        az: 'Onun əlamətlərindən biri: səhəri günəş ağ, şüasız doğur (Übeyy ibn Kəb, Muslim 762). Gecənin dəqiq tarixi bildirilməyib — buna görə son onluğun hamısında, xüsusən tək gecələrdə ibadət artırılır.',
        en: 'One of its signs: the next morning the sun rises white, without rays (Ubayy ibn Ka’b, Muslim 762). Its exact date was not disclosed — so worship is increased throughout the last ten, especially the odd nights.',
        ru: 'Один из её признаков: наутро солнце восходит белым, без лучей (Убайй ибн Кааб, Муслим 762). Точная дата не сообщена — поэтому поклонение усиливают во все последние десять ночей, особенно в нечётные.',
        ar: 'ومن علاماتها أن الشمس تطلع صبيحتها بيضاء لا شعاع لها (أُبيّ بن كعب، مسلم 762). ولم تُعيَّن ليلتها، فيُجتهد في العشر كلها ولا سيما الأوتار.',
        tr: 'Alametlerinden biri: ertesi sabah güneş beyaz ve ışınsız doğar (Übey b. Kâ’b, Müslim 762). Kesin tarihi bildirilmemiştir; bu yüzden son on gecenin tamamında, özellikle tek gecelerde ibadet artırılır.',
      } },
      { t: 'dua', ar: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', src: { az: 'Tirmizi 3513 (əl-Albani: səhih)', en: 'Tirmidhi 3513 (al-Albani: sahih)', ru: 'Тирмизи 3513 (аль-Альбани: достоверный)', ar: 'الترمذي 3513 (صححه الألباني)', tr: 'Tirmizî 3513 (Elbânî: sahih)' },
        translit: { az: 'Allahummə innəkə afuvvun kərimun tuhibbul-afvə fəfu anni.', en: 'Allāhumma innaka ʿafuwwun karīmun tuḥibbu-l-ʿafwa faʿfu ʿannī.', ru: 'Аллахумма иннака афуввун карымун тухиббуль-афва фа-фу анни.', tr: 'Allahümme inneke afüvvün kerîmün tühibbü’l-afve fa’fü annî.' },
        text: { az: 'Allahım, Sən Əfv edənsən, Kərimsən, əfv etməyi sevirsən, məni də əfv et. (Aişə soruşmuşdu: «Qədr gecəsini bilsəm, nə deyim?»)', en: 'O Allah, You are Pardoning and Generous, You love to pardon, so pardon me. (Aisha had asked: “If I know which night is Laylat al-Qadr, what should I say?”)', ru: 'О Аллах, поистине, Ты — Прощающий, Щедрый, любишь прощать, так прости же меня. (Аиша спросила: «Если я узнаю, какая ночь — Ночь предопределения, что мне говорить?»)', tr: 'Allah’ım! Sen affedicisin, kerimsin, affetmeyi seversin; beni de affet. (Âişe sormuştu: “Kadir gecesini bilirsem ne diyeyim?”)' } },
    ],
  },

  // ── 9. Etikaf ──
  {
    id: 'itikaf', icon: 'mosques',
    title: { az: 'Etikaf', en: 'I’tikaf', ru: 'Итикаф', ar: 'الاعتكاف', tr: 'İtikâf' },
    blocks: [
      { t: 'p', text: {
        az: 'Etikaf — Allaha ibadət məqsədilə məsciddə qalmaqdır. Peyğəmbər ﷺ hər il Ramazanın son on gününü etikafda keçirərdi.',
        en: 'I’tikaf is staying in the mosque for the worship of Allah. The Prophet ﷺ spent the last ten days of Ramadan in i’tikaf every year.',
        ru: 'Итикаф — пребывание в мечети ради поклонения Аллаху. Пророк ﷺ каждый год проводил последние десять дней Рамадана в итикафе.',
        ar: 'الاعتكاف لزوم المسجد لطاعة الله، وكان النبي ﷺ يعتكف العشر الأواخر من رمضان.',
        tr: 'İtikâf, Allah’a ibadet için mescitte kalmaktır. Peygamber ﷺ her yıl Ramazan’ın son on gününü itikâfta geçirirdi.',
      } },
      { t: 'hadith', ar: 'أَنَّ النَّبِيَّ ﷺ كَانَ يَعْتَكِفُ الْعَشْرَ الْأَوَاخِرَ مِنْ رَمَضَانَ حَتَّى تَوَفَّاهُ اللَّهُ، ثُمَّ اعْتَكَفَ أَزْوَاجُهُ مِنْ بَعْدِهِ', src: S('Buxari 2026'), text: {
        az: 'Aişə (Allah ondan razı olsun): «Peyğəmbər ﷺ Allah onun canını alana qədər Ramazanın son on gününü etikafda keçirərdi, ondan sonra isə zövcələri etikafa girərdilər».',
        en: 'Aisha (may Allah be pleased with her): “The Prophet ﷺ used to observe i’tikaf in the last ten days of Ramadan until Allah took his soul, and after him his wives observed i’tikaf.”',
        ru: 'Аиша (да будет доволен ею Аллах): «Пророк ﷺ совершал итикаф в последние десять дней Рамадана, пока Аллах не упокоил его, а после него итикаф совершали его жёны».',
        tr: 'Âişe (Allah ondan razı olsun): “Peygamber ﷺ Allah onun ruhunu alıncaya kadar Ramazan’ın son on gününde itikâfa girerdi; ondan sonra da hanımları itikâfa girdiler.”',
      } },
      { t: 'list', items: [
        { az: 'Yeri — məsciddir: «…məscidlərdə etikafda olarkən onlara (qadınlara) yaxınlaşmayın» (Bəqərə 2:187).', en: 'Its place is the mosque: “…and do not approach them (your wives) while you are in i’tikaf in the mosques” (Quran 2:187).', ru: 'Его место — мечеть: «…и не вступайте с ними (жёнами) в близость, когда пребываете в итикафе в мечетях» (Коран 2:187).', ar: 'محله المسجد: ﴿وَلَا تُبَاشِرُوهُنَّ وَأَنتُمْ عَاكِفُونَ فِي الْمَسَاجِدِ﴾ (البقرة 187).', tr: 'Yeri mesciddir: “…mescitlerde itikâfta iken onlara (eşlerinize) yaklaşmayın” (Bakara 2:187).' },
        { az: 'Məsciddən yalnız zərurət üçün çıxılır: «O, etikafda olarkən yalnız ehtiyac üçün evə girərdi» (Buxari 2029).', en: 'One leaves the mosque only out of necessity: “He would not enter the house except for a need while in i’tikaf” (Bukhari 2029).', ru: 'Из мечети выходят лишь по необходимости: «Находясь в итикафе, он входил в дом только по нужде» (Бухари 2029).', ar: 'لا يخرج من المسجد إلا لحاجة: «وَكَانَ لَا يَدْخُلُ الْبَيْتَ إِلَّا لِحَاجَةٍ إِذَا كَانَ مُعْتَكِفًا» (البخاري 2029).', tr: 'Mescitten yalnızca zaruret için çıkılır: “İtikâfta iken ihtiyaç dışında eve girmezdi” (Buhârî 2029).' },
        { az: 'Vaxt namaz, Quran, zikr, dua və istiğfarla keçirilir; boş söhbət, telefon və dünya işləri azaldılır.', en: 'Time is spent in prayer, Quran, dhikr, dua and seeking forgiveness; idle talk, the phone and worldly matters are cut down.', ru: 'Время проводят в молитве, чтении Корана, зикре, мольбах и покаянии; пустые разговоры, телефон и мирские дела сводят к минимуму.', ar: 'يشتغل بالصلاة والقرآن والذكر والدعاء والاستغفار، ويقلّل من فضول الكلام والهاتف وأمور الدنيا.', tr: 'Vakit namaz, Kur’an, zikir, dua ve istiğfarla geçirilir; boş konuşma, telefon ve dünya işleri azaltılır.' },
        { az: 'Qadınlar da etikafa girə bilər — Peyğəmbərin ﷺ zövcələri etikaf etmişlər (Buxari 2026).', en: 'Women may also observe i’tikaf — the wives of the Prophet ﷺ did so (Bukhari 2026).', ru: 'Женщины тоже могут совершать итикаф — жёны Пророка ﷺ совершали его (Бухари 2026).', ar: 'وللمرأة أن تعتكف، فقد اعتكف أزواج النبي ﷺ (البخاري 2026).', tr: 'Kadınlar da itikâfa girebilir — Peygamber’in ﷺ hanımları itikâf yapmışlardır (Buhârî 2026).' },
      ] },
    ],
  },

  // ── 10. Fitrə zəkatı ──
  {
    id: 'zakat-al-fitr', icon: 'zakat',
    title: { az: 'Fitrə zəkatı', en: 'Zakat al-Fitr', ru: 'Закят аль-фитр', ar: 'زكاة الفطر', tr: 'Fıtır sadakası' },
    links: [{ kind: 'page', key: 'zakat', label: { az: 'Fitrə zəkatının miqdarı və hesablanması — Zəkat səhifəsi', en: 'Amount and calculation of Zakat al-Fitr — Zakat page', ru: 'Размер и расчёт закят аль-фитра — страница «Закят»', ar: 'مقدار زكاة الفطر وحسابها — صفحة الزكاة', tr: 'Fıtır sadakasının miktarı ve hesaplanması — Zekât sayfası' } }],
    blocks: [
      { t: 'hadith', ar: 'فَرَضَ رَسُولُ اللَّهِ ﷺ زَكَاةَ الْفِطْرِ طُهْرَةً لِلصَّائِمِ مِنَ اللَّغْوِ وَالرَّفَثِ، وَطُعْمَةً لِلْمَسَاكِينِ؛ مَنْ أَدَّاهَا قَبْلَ الصَّلَاةِ فَهِيَ زَكَاةٌ مَقْبُولَةٌ، وَمَنْ أَدَّاهَا بَعْدَ الصَّلَاةِ فَهِيَ صَدَقَةٌ مِنَ الصَّدَقَاتِ', src: S('Əbu Davud 1609'), grade: HASAN, text: {
        az: 'İbn Abbas: «Allahın Elçisi ﷺ fitrə zəkatını oruc tutanı boş və çirkin sözdən təmizləmək və yoxsullara yemək olsun deyə fərz etdi. Kim onu (bayram) namazından əvvəl verərsə, qəbul olunmuş zəkatdır, kim namazdan sonra verərsə, adi sədəqələrdən bir sədəqədir».',
        en: 'Ibn Abbas: “The Messenger of Allah ﷺ made Zakat al-Fitr obligatory as a purification for the fasting person from idle and indecent talk, and as food for the poor. Whoever gives it before the (Eid) prayer, it is an accepted zakat; whoever gives it after the prayer, it is just one of the charities.”',
        ru: 'Ибн Аббас: «Посланник Аллаха ﷺ вменил закят аль-фитр как очищение постящегося от пустословия и непристойностей и как пропитание для бедных. Кто выплатит его до (праздничной) молитвы — это принятый закят, а кто после молитвы — это одна из обычных милостынь».',
        tr: 'İbn Abbas: “Resûlullah ﷺ fıtır sadakasını, oruçluyu boş ve çirkin sözden arındırmak ve yoksullara yiyecek olmak üzere farz kıldı. Kim onu (bayram) namazından önce verirse kabul edilmiş zekâttır; kim namazdan sonra verirse sıradan sadakalardan bir sadakadır.”',
      } },
      { t: 'p', text: {
        az: 'Fitrə zəkatı hər bir müsəlmana — böyüyə və kiçiyə, kişiyə və qadına — vacibdir; ailə başçısı onu himayəsində olanlar üçün də verir. Allahın Elçisi ﷺ onun bayram namazına çıxmazdan əvvəl verilməsini əmr etmişdir (Muslim 986). Miqdar və hesablama Zəkat səhifəsindədir.',
        en: 'Zakat al-Fitr is due from every Muslim — young and old, male and female; the head of the household pays it for his dependants as well. The Messenger of Allah ﷺ ordered that it be given before the people go out to the Eid prayer (Muslim 986). The amount and calculation are on the Zakat page.',
        ru: 'Закят аль-фитр обязателен для каждого мусульманина — взрослого и ребёнка, мужчины и женщины; глава семьи выплачивает его и за тех, кого содержит. Посланник Аллаха ﷺ велел выплачивать его до того, как люди выйдут на праздничную молитву (Муслим 986). Размер и расчёт — на странице «Закят».',
        ar: 'تجب زكاة الفطر على كل مسلم صغير وكبير، ذكر وأنثى، ويخرجها رب الأسرة عمن يعول. وقد أمر رسول الله ﷺ بها أن تؤدى قبل خروج الناس إلى الصلاة (مسلم 986). والمقدار وطريقة الحساب في صفحة الزكاة.',
        tr: 'Fıtır sadakası küçük-büyük, erkek-kadın her Müslümana vaciptir; aile reisi bakmakla yükümlü olduklarının sadakasını da verir. Resûlullah ﷺ bayram namazına çıkılmadan önce verilmesini emretmiştir (Müslim 986). Miktar ve hesaplama Zekât sayfasındadır.',
      } },
    ],
  },

  // ── 11. Bayram ──
  {
    id: 'eid', icon: 'gift',
    title: { az: 'Ramazanın sonu və bayram', en: 'The end of Ramadan and Eid', ru: 'Завершение Рамадана и праздник', ar: 'ختام رمضان والعيد', tr: 'Ramazan’ın sonu ve bayram' },
    links: [{ kind: 'lesson', slug: 'eid-prayer', label: { az: 'Bayram namazı necə qılınır — dərs', en: 'How to pray the Eid prayer — lesson', ru: 'Как совершать праздничную молитву — урок', ar: 'كيفية صلاة العيد — درس', tr: 'Bayram namazı nasıl kılınır — ders' } }],
    blocks: [
      { t: 'hadith', ar: 'صُومُوا لِرُؤْيَتِهِ، وَأَفْطِرُوا لِرُؤْيَتِهِ، فَإِنْ غُبِّيَ عَلَيْكُمْ فَأَكْمِلُوا عِدَّةَ شَعْبَانَ ثَلَاثِينَ', src: S('Buxari 1909'), text: {
        az: '«Onu (hilalı) görəndə oruc tutun, onu görəndə orucu açın; əgər (hava) sizə bağlı olarsa, Şabanın sayını otuza tamamlayın».',
        en: '“Fast when you see it (the new moon) and stop fasting when you see it; if it is hidden from you, complete Sha’ban as thirty days.”',
        ru: '«Начинайте пост, увидев его (новый месяц), и прекращайте, увидев его; а если он будет скрыт от вас, то завершите шаабан тридцатью днями».',
        tr: '“Hilali görünce oruca başlayın, onu görünce bayram edin; eğer hava kapalı olursa Şaban’ı otuza tamamlayın.”',
      } },
      { t: 'p', text: {
        az: 'Ramazan yeni ayın hilalı görülməklə və ya otuz gün tamamlanmaqla bitir. Allah buyurur: «…sayı tamamlayasınız və sizi doğru yola yönəltdiyinə görə Allahı ucaldasınız» (Bəqərə 2:185) — buna görə bayram gecəsindən namaza qədər təkbir gətirilir. Bayram namazının qaydası ayrıca dərsdədir.',
        en: 'Ramadan ends with the sighting of the new moon or the completion of thirty days. Allah says: “…so that you complete the number and magnify Allah for having guided you” (Quran 2:185) — so takbir is said from the night of Eid until the prayer. The Eid prayer itself is explained in a separate lesson.',
        ru: 'Рамадан завершается, когда увидят новый месяц или исполнится тридцать дней. Аллах говорит: «…чтобы вы завершили определённое число дней и возвеличили Аллаха за то, что Он наставил вас на прямой путь» (Коран 2:185) — поэтому с праздничной ночи до молитвы произносят такбир. Порядок праздничной молитвы — в отдельном уроке.',
        ar: 'ينتهي رمضان برؤية هلال شوال أو بإكمال ثلاثين يومًا، قال تعالى: ﴿وَلِتُكْمِلُوا الْعِدَّةَ وَلِتُكَبِّرُوا اللَّهَ عَلَىٰ مَا هَدَاكُمْ﴾ (البقرة 185)، فيُشرع التكبير من ليلة العيد إلى الصلاة. وصفة صلاة العيد في درس مستقل.',
        tr: 'Ramazan yeni ayın hilali görülünce veya otuz gün tamamlanınca biter. Allah buyurur: “…sayıyı tamamlamanız ve sizi doğru yola ilettiği için Allah’ı yüceltmeniz içindir” (Bakara 2:185) — bu yüzden bayram gecesinden namaza kadar tekbir getirilir. Bayram namazının kılınışı ayrı bir derstedir.',
      } },
    ],
  },
]

// Mənbələr siyahısı (səhifənin sonunda) — adlar orijinal (ərəb) başlıqlarıdır
export const RAMADAN_SOURCES = [
  { label: 'ابن باز — الإبر المغذية تفطر (مجموع الفتاوى 15/257)', url: 'https://binbaz.org.sa/fatwas/11755/%D8%A7%D9%84%D8%A7%D8%A8%D8%B1-%D8%A7%D9%84%D9%85%D8%BA%D8%B0%D9%8A%D8%A9-%D8%AA%D9%81%D8%B7%D8%B1' },
  { label: 'ابن باز — حكم استعمال إبر الوريد والعضل (15/258)', url: URL_BAZ.injections },
  { label: 'ابن باز — معجون الأسنان وقطرة الأذن والعين والأنف (15/260)', url: URL_BAZ.drops },
  { label: 'ابن باز — حكم القطرة والكحل أثناء الصيام (15/262)', url: 'https://binbaz.org.sa/fatwas/15965/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%B4%D8%B1%D8%A8-%D9%82%D8%A7%D9%89%D9%85%D8%A7' },
  { label: 'ابن باز — حكم استعمال مريض الربو البخاخ (15/265)', url: URL_BAZ.inhaler },
  { label: 'ابن باز — حكم سحب عينات الدم للتحليل (15/274)', url: URL_BAZ.blood },
  { label: 'ابن باز — حكم الزيادة على ثمان ركعات في التراويح', url: URL_BAZ.tarawih },
  { label: 'الإسلام سؤال وجواب 38023 — مفسدات الصيام', url: URL_QA.breakers },
  { label: 'الإسلام سؤال وجواب 37650 — هل بخاخ الربو يفطر؟', url: 'https://islamqa.info/ar/answers/37650' },
  { label: 'الإسلام سؤال وجواب 9036 — عدد ركعات صلاة التراويح', url: 'https://islamqa.info/ar/answers/9036' },
]

// ── 30 günlük xətm planı: hər gün bir cüz ──
// Başlanğıc və son ayələr — api.quran.com /v4/juzs (verse_mapping), yoxlanılıb.
export const JUZ_RANGES = [
  ['1:1', '2:141'], ['2:142', '2:252'], ['2:253', '3:92'], ['3:93', '4:23'], ['4:24', '4:147'],
  ['4:148', '5:81'], ['5:82', '6:110'], ['6:111', '7:87'], ['7:88', '8:40'], ['8:41', '9:92'],
  ['9:93', '11:5'], ['11:6', '12:52'], ['12:53', '14:52'], ['15:1', '16:128'], ['17:1', '18:74'],
  ['18:75', '20:135'], ['21:1', '22:78'], ['23:1', '25:20'], ['25:21', '27:55'], ['27:56', '29:45'],
  ['29:46', '33:30'], ['33:31', '36:27'], ['36:28', '39:31'], ['39:32', '41:46'], ['41:47', '45:37'],
  ['46:1', '51:30'], ['51:31', '57:29'], ['58:1', '66:12'], ['67:1', '77:50'], ['78:1', '114:6'],
]
