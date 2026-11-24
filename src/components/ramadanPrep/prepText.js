// ═══════════════════════════════════════════════════════
// Ramazana hazırlıq yolu (/road-to-ramadan) və son 10 gecə (/last-ten-nights) — interfeys yazıları (5 dil)
//
// DİNİ MƏTN BURADA YOXDUR: addımların izahı yalnız interfeys istiqamətidir (hökm, fəzilət iddiası yoxdur).
// Ayə, hədis və dualar saytın Ramazan bələdçisindən (src/data/ramadanGuide.js) olduğu kimi götürülür —
// QUOTE sahəsi yalnız həmin bölmədəki bloku göstərir (mənbəsi ilə, LessonBlocks).
// Say ifadələri bütöv cümlədir (TEAM.md, i18n).
// ═══════════════════════════════════════════════════════
import { ruPlural } from '../../utils/ramadan'

const arDays = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n <= 10 ? few(n) : many(n))

export const T = {
  az: {
    road: 'Ramazana hazırlıq yolu', nights: 'Son 10 gecə', switchLabel: 'Ramazana hazırlıq',
    leadRoad: 'Ramazana qədər hər gün bir kiçik addım: qəza oruclarını tutmaq, Ramazan üçün Quran planı, yuxu rejimi, iftar duası. Hər addım saytda artıq olan səhifəyə aparır.',
    leadNights: 'Ramazanın son on gecəsi üçün gecə-gecə siyahı: gecə namazı, Quran, dua, sədəqə və istiğfar. Tək gecələr vurğulanır.',
    private: 'İşarələriniz yalnız bu cihazda saxlanılır (hesabınız varsa, şifrəli sinxronizasiya ilə digər cihazlarınıza da keçir). Ardıcıllıq, xal və müqayisə yoxdur.',
    daysLeft: (n) => `Ramazana ${n} gün qaldı`,
    startsOn: (d) => `Gözlənilən başlanğıc: ${d}`,
    calc: 'Tarix Ümmül-Qura təqvimi ilə hesablanıb. Ramazanın başlanğıcı hilalın görülməsi ilə müəyyən olunur — yerli elan bir gün fərqlənə bilər.',
    today: 'Bugünkü addım', done: 'Bu addımı etdim', doneOn: 'edildi', opensOn: (d) => `Açılır: ${d}`,
    progress: (d, n) => `${n} addımdan ${d}-i edilib`,
    earlier: (k) => `Edilməmiş əvvəlki addımlar: ${k} — bütün yolda`, showAll: 'Bütün yolu göstər', showLess: 'Yığcam göstər', upcoming: 'Qarşıdakı addımlar',
    earlyTitle: 'Yol Ramazandan 90 gün əvvəl açılır', earlyText: (d) => `Başlanğıc: ${d}. O vaxta qədər qəza oruclarını tutmağa və Ramazan bələdçisini oxumağa indidən başlaya bilərsiniz.`,
    preview: 'İlk addımlar',
    ramadanTitle: 'Ramazan başladı', ramadanText: 'Hazırlıq yolu tamamlandı. İmsakiyyə və son 10 gecənin planı hazırdır.',
    saved: 'Yadda saxlandı.', unsaved: 'İşarə götürüldü.', dial: 'Ramazana qədər yol', loading: 'Tarix hesablanır…',
    qadaOwed: (n) => `Qəza izləyicinizdə ${n} oruc qalıb.`, guideStep: (s) => `Ramazan bələdçisi: ${s}`,
    guideText: 'Ramazan bələdçisinin bu bölməsini oxuyun — dəlilləri və mənbələri ilə.', source: 'Saytın Ramazan bələdçisindən',
    // Son 10 gecə
    nightsIn: (n) => `Son 10 gecəyə ${n} gün qaldı`, nightsBegin: (d) => `21-ci gecə ${d} axşamı başlayır`,
    previewNote: 'Önizləmə: siyahı son on gecədə aktiv olur.',
    tonight: 'Bu gecə', nightN: (n) => `${n}-ci gecə`, odd: 'Tək gecə', evening: (d) => `${d} axşamı başlayır`,
    nightProgress: (d) => `5 işdən ${d}-i edilib`, maybe30: 'Ay 30 gün olarsa',
    afterTitle: 'Bu ilin son on gecəsi bitdi', afterText: 'Allah qəbul etsin. Növbəti Ramazan üçün hazırlıq yolu sizi gözləyir.',
    why: 'Niyə bu gecələr', dua: 'Qədr gecəsinin duası',
    focus: 'Etikaf rejimi', focusLead: 'Bu gecə üçün sakit tam ekran: yalnız siyahı və dua.', close: 'Bağla',
    counter: 'Sayğac', counterNote: 'Saxlanılmır — yalnız bu ekranda.', tap: 'Toxunun', resetCount: 'Sıfırla',
    count: (n) => `Say: ${n}`, awake: 'Ekran açıq qalır.',
  },
  en: {
    road: 'Road to Ramadan', nights: 'Last ten nights', switchLabel: 'Ramadan preparation',
    leadRoad: 'One small step each day until Ramadan: making up missed fasts, a Quran plan for Ramadan, your sleep schedule, the iftar dua. Each step leads to a page already on the site.',
    leadNights: 'A night-by-night checklist for the last ten nights of Ramadan: night prayer, Quran, dua, sadaqah and seeking forgiveness. The odd nights are highlighted.',
    private: 'Your marks are stored only on this device (if you have an account, encrypted sync carries them to your other devices). There are no streaks, points or comparisons.',
    daysLeft: (n) => (n === 1 ? '1 day until Ramadan' : `${n} days until Ramadan`),
    startsOn: (d) => `Expected start: ${d}`,
    calc: 'The date is calculated with the Umm al-Qura calendar. Ramadan begins with the sighting of the new moon, so your local announcement may differ by a day.',
    today: 'Today’s step', done: 'I did this step', doneOn: 'done', opensOn: (d) => `Opens on ${d}`,
    progress: (d, n) => `${d} of ${n} steps done`,
    earlier: (k) => `Earlier steps not done yet: ${k} — see the whole road`, showAll: 'Show the whole road', showLess: 'Show less', upcoming: 'Coming up',
    earlyTitle: 'The road opens 90 days before Ramadan', earlyText: (d) => `It starts on ${d}. Until then you can already make up missed fasts and read the Ramadan guide.`,
    preview: 'The first steps',
    ramadanTitle: 'Ramadan has begun', ramadanText: 'The road is complete. The timetable and the plan for the last ten nights are ready.',
    saved: 'Saved.', unsaved: 'Mark removed.', dial: 'The road to Ramadan', loading: 'Calculating the date…',
    qadaOwed: (n) => (n === 1 ? 'Your qada tracker shows 1 fast left.' : `Your qada tracker shows ${n} fasts left.`), guideStep: (s) => `Ramadan guide: ${s}`,
    guideText: 'Read this section of the Ramadan guide — with its evidence and sources.', source: 'From the site’s Ramadan guide',
    nightsIn: (n) => (n === 1 ? 'The last ten nights begin in 1 day' : `The last ten nights begin in ${n} days`), nightsBegin: (d) => `Night 21 begins on the evening of ${d}`,
    previewNote: 'Preview: the checklist becomes active in the last ten nights.',
    tonight: 'Tonight', nightN: (n) => `Night ${n}`, odd: 'Odd night', evening: (d) => `Begins on the evening of ${d}`,
    nightProgress: (d) => `${d} of 5 done`, maybe30: 'If the month has 30 days',
    afterTitle: 'This year’s last ten nights have ended', afterText: 'May Allah accept. The road to next Ramadan is waiting for you.',
    why: 'Why these nights', dua: 'The dua for Laylat al-Qadr',
    focus: 'I’tikaf mode', focusLead: 'A calm full screen for tonight: only the checklist and the dua.', close: 'Close',
    counter: 'Counter', counterNote: 'Not saved — only on this screen.', tap: 'Tap', resetCount: 'Reset',
    count: (n) => `Count: ${n}`, awake: 'The screen stays on.',
  },
  ru: {
    road: 'Путь к Рамадану', nights: 'Последние десять ночей', switchLabel: 'Подготовка к Рамадану',
    leadRoad: 'Каждый день до Рамадана — один небольшой шаг: возместить пропущенные посты, план чтения Корана на Рамадан, режим сна, дуа ифтара. Каждый шаг ведёт на страницу, которая уже есть на сайте.',
    leadNights: 'Список на каждую из последних десяти ночей Рамадана: ночная молитва, Коран, дуа, садака и истигфар. Нечётные ночи выделены.',
    private: 'Отметки хранятся только на этом устройстве (если у вас есть аккаунт, зашифрованная синхронизация перенесёт их на другие устройства). Никаких серий, очков и сравнений.',
    daysLeft: (n) => `До Рамадана ${n} ${ruPlural(n, 'день', 'дня', 'дней')}`,
    startsOn: (d) => `Ожидаемое начало: ${d}`,
    calc: 'Дата рассчитана по календарю Умм аль-Кура. Начало Рамадана определяется по видению молодого месяца, поэтому местное объявление может отличаться на день.',
    today: 'Шаг на сегодня', done: 'Я сделал этот шаг', doneOn: 'сделано', opensOn: (d) => `Откроется ${d}`,
    progress: (d, n) => `Сделано шагов: ${d} из ${n}`,
    earlier: (k) => `Невыполненные прошлые шаги: ${k} — во всём пути`, showAll: 'Показать весь путь', showLess: 'Свернуть', upcoming: 'Впереди',
    earlyTitle: 'Путь открывается за 90 дней до Рамадана', earlyText: (d) => `Начало: ${d}. А пока уже можно возмещать пропущенные посты и читать путеводитель по Рамадану.`,
    preview: 'Первые шаги',
    ramadanTitle: 'Рамадан начался', ramadanText: 'Путь пройден. Расписание и план последних десяти ночей готовы.',
    saved: 'Сохранено.', unsaved: 'Отметка снята.', dial: 'Путь к Рамадану', loading: 'Дата рассчитывается…',
    qadaOwed: (n) => `В учёте возмещения осталось постов: ${n}.`, guideStep: (s) => `Путеводитель по Рамадану: ${s}`,
    guideText: 'Прочитайте этот раздел путеводителя по Рамадану — с доводами и источниками.', source: 'Из путеводителя по Рамадану на сайте',
    nightsIn: (n) => `До последних десяти ночей ${n} ${ruPlural(n, 'день', 'дня', 'дней')}`, nightsBegin: (d) => `21-я ночь начинается вечером ${d}`,
    previewNote: 'Предпросмотр: список станет активным в последние десять ночей.',
    tonight: 'Сегодня ночью', nightN: (n) => `${n}-я ночь`, odd: 'Нечётная ночь', evening: (d) => `Начинается вечером ${d}`,
    nightProgress: (d) => `Сделано: ${d} из 5`, maybe30: 'Если в месяце 30 дней',
    afterTitle: 'Последние десять ночей этого года завершились', afterText: 'Да примет Аллах. Путь к следующему Рамадану ждёт вас.',
    why: 'Почему эти ночи', dua: 'Дуа Ночи предопределения',
    focus: 'Режим итикафа', focusLead: 'Спокойный полноэкранный режим на эту ночь: только список и дуа.', close: 'Закрыть',
    counter: 'Счётчик', counterNote: 'Не сохраняется — только на этом экране.', tap: 'Нажмите', resetCount: 'Сбросить',
    count: (n) => `Счёт: ${n}`, awake: 'Экран не гаснет.',
  },
  ar: {
    road: 'الطريق إلى رمضان', nights: 'العشر الأواخر', switchLabel: 'الاستعداد لرمضان',
    leadRoad: 'خطوة صغيرة كل يوم حتى رمضان: قضاء ما فاتك من الصيام، وخطة لقراءة القرآن في رمضان، وتنظيم النوم، ودعاء الإفطار. كل خطوة تقودك إلى صفحة موجودة في الموقع.',
    leadNights: 'قائمة لكل ليلة من العشر الأواخر من رمضان: قيام الليل، والقرآن، والدعاء، والصدقة، والاستغفار. والليالي الوترية مميَّزة.',
    private: 'علاماتك محفوظة على هذا الجهاز فقط (وإن كان لك حساب فالمزامنة المشفّرة تنقلها إلى أجهزتك الأخرى). لا سلاسل ولا نقاط ولا مقارنات.',
    daysLeft: (n) => arDays(n, 'يوم واحد حتى رمضان', 'يومان حتى رمضان', (x) => `${x} أيام حتى رمضان`, (x) => `${x} يومًا حتى رمضان`),
    startsOn: (d) => `البداية المتوقعة: ${d}`,
    calc: 'التاريخ محسوب بتقويم أم القرى. ويبدأ رمضان برؤية الهلال، فقد يختلف الإعلان المحلي بيوم.',
    today: 'خطوة اليوم', done: 'أنجزت هذه الخطوة', doneOn: 'أُنجزت', opensOn: (d) => `تُفتح في ${d}`,
    progress: (d, n) => `أُنجزت ${d} من ${n} خطوة`,
    earlier: (k) => `خطوات سابقة لم تُنجز: ${k} — في الطريق كله`, showAll: 'اعرض الطريق كله', showLess: 'اعرض أقل', upcoming: 'الخطوات القادمة',
    earlyTitle: 'يُفتح الطريق قبل رمضان بتسعين يومًا', earlyText: (d) => `يبدأ في ${d}. وإلى ذلك الحين يمكنك من الآن قضاء ما فاتك من الصيام وقراءة دليل رمضان.`,
    preview: 'الخطوات الأولى',
    ramadanTitle: 'بدأ رمضان', ramadanText: 'اكتمل طريق الاستعداد. الإمساكية وخطة العشر الأواخر جاهزتان.',
    saved: 'تم الحفظ.', unsaved: 'أُزيلت العلامة.', dial: 'الطريق إلى رمضان', loading: 'جارٍ حساب التاريخ…',
    qadaOwed: (n) => `بقي في متابعة القضاء من الصيام: ${n}.`, guideStep: (s) => `دليل رمضان: ${s}`,
    guideText: 'اقرأ هذا القسم من دليل رمضان — بأدلته ومصادره.', source: 'من دليل رمضان في الموقع',
    nightsIn: (n) => arDays(n, 'تبدأ العشر الأواخر بعد يوم واحد', 'تبدأ العشر الأواخر بعد يومين', (x) => `تبدأ العشر الأواخر بعد ${x} أيام`, (x) => `تبدأ العشر الأواخر بعد ${x} يومًا`),
    nightsBegin: (d) => `تبدأ ليلة الحادي والعشرين مساء ${d}`,
    previewNote: 'معاينة: تصبح القائمة فعّالة في العشر الأواخر.',
    tonight: 'الليلة', nightN: (n) => `الليلة ${n}`, odd: 'ليلة وترية', evening: (d) => `تبدأ مساء ${d}`,
    nightProgress: (d) => `أُنجز ${d} من 5`, maybe30: 'إن كان الشهر ثلاثين يومًا',
    afterTitle: 'انتهت العشر الأواخر لهذا العام', afterText: 'تقبّل الله منك. طريق الاستعداد لرمضان القادم في انتظارك.',
    why: 'لماذا هذه الليالي', dua: 'دعاء ليلة القدر',
    focus: 'وضع الاعتكاف', focusLead: 'شاشة كاملة هادئة لهذه الليلة: القائمة والدعاء فقط.', close: 'إغلاق',
    counter: 'العدّاد', counterNote: 'لا يُحفظ — على هذه الشاشة فقط.', tap: 'اضغط', resetCount: 'تصفير',
    count: (n) => `العدد: ${n}`, awake: 'تبقى الشاشة مضاءة.',
  },
  tr: {
    road: 'Ramazan’a hazırlık yolu', nights: 'Son on gece', switchLabel: 'Ramazan’a hazırlık',
    leadRoad: 'Ramazan’a kadar her gün küçük bir adım: kaza oruçlarını tutmak, Ramazan için Kur’an planı, uyku düzeni, iftar duası. Her adım sitede zaten bulunan bir sayfaya götürür.',
    leadNights: 'Ramazan’ın son on gecesi için gece gece liste: gece namazı, Kur’an, dua, sadaka ve istiğfar. Tek geceler vurgulanır.',
    private: 'İşaretleriniz yalnızca bu cihazda saklanır (hesabınız varsa şifreli eşitleme onları diğer cihazlarınıza da taşır). Seri, puan ve karşılaştırma yoktur.',
    daysLeft: (n) => `Ramazan’a ${n} gün kaldı`,
    startsOn: (d) => `Beklenen başlangıç: ${d}`,
    calc: 'Tarih Ümmü’l-Kurâ takvimiyle hesaplanmıştır. Ramazan hilalin görülmesiyle başlar; yerel duyuru bir gün farklı olabilir.',
    today: 'Bugünün adımı', done: 'Bu adımı yaptım', doneOn: 'yapıldı', opensOn: (d) => `Açılış: ${d}`,
    progress: (d, n) => `${n} adımdan ${d} tanesi yapıldı`,
    earlier: (k) => `Yapılmamış önceki adımlar: ${k} — bütün yolda`, showAll: 'Bütün yolu göster', showLess: 'Daha az göster', upcoming: 'Sıradaki adımlar',
    earlyTitle: 'Yol Ramazan’dan 90 gün önce açılır', earlyText: (d) => `Başlangıç: ${d}. O zamana kadar kaza oruçlarını tutmaya ve Ramazan rehberini okumaya şimdiden başlayabilirsiniz.`,
    preview: 'İlk adımlar',
    ramadanTitle: 'Ramazan başladı', ramadanText: 'Hazırlık yolu tamamlandı. İmsakiye ve son on gecenin planı hazır.',
    saved: 'Kaydedildi.', unsaved: 'İşaret kaldırıldı.', dial: 'Ramazan’a giden yol', loading: 'Tarih hesaplanıyor…',
    qadaOwed: (n) => `Kaza takibinizde ${n} oruç kaldı.`, guideStep: (s) => `Ramazan rehberi: ${s}`,
    guideText: 'Ramazan rehberinin bu bölümünü okuyun — delilleri ve kaynaklarıyla.', source: 'Sitenin Ramazan rehberinden',
    nightsIn: (n) => `Son on geceye ${n} gün kaldı`, nightsBegin: (d) => `21. gece ${d} akşamı başlar`,
    previewNote: 'Önizleme: liste son on gecede etkin olur.',
    tonight: 'Bu gece', nightN: (n) => `${n}. gece`, odd: 'Tek gece', evening: (d) => `${d} akşamı başlar`,
    nightProgress: (d) => `5 işten ${d} tanesi yapıldı`, maybe30: 'Ay 30 gün çekerse',
    afterTitle: 'Bu yılın son on gecesi sona erdi', afterText: 'Allah kabul etsin. Gelecek Ramazan’a hazırlık yolu sizi bekliyor.',
    why: 'Neden bu geceler', dua: 'Kadir gecesinin duası',
    focus: 'İtikâf modu', focusLead: 'Bu gece için sakin tam ekran: yalnızca liste ve dua.', close: 'Kapat',
    counter: 'Sayaç', counterNote: 'Kaydedilmez — yalnızca bu ekranda.', tap: 'Dokunun', resetCount: 'Sıfırla',
    count: (n) => `Sayı: ${n}`, awake: 'Ekran açık kalır.',
  },
}

// Gecənin işləri (utils/ramadanPrep → NIGHT_ITEMS ilə eyni id-lər)
export const NIGHT_TEXT = {
  qiyam: {
    icon: 'moonStar',
    title: { az: 'Gecə namazı (qiyam)', en: 'Night prayer (qiyam)', ru: 'Ночная молитва (кыям)', ar: 'قيام الليل', tr: 'Gece namazı (kıyam)' },
    hint: { az: 'Təravih və ya gecə namazı — gücünüz çatan qədər.', en: 'Taraweeh or night prayer — as much as you are able.', ru: 'Таравих или ночная молитва — сколько сможете.', ar: 'التراويح أو قيام الليل بقدر استطاعتك.', tr: 'Teravih veya gece namazı — gücünüz yettiği kadar.' },
  },
  quran: {
    icon: 'quran',
    title: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
    hint: { az: 'Bu gecə Qurandan oxuyun.', en: 'Read from the Quran tonight.', ru: 'Почитайте Коран этой ночью.', ar: 'اقرأ من القرآن الليلة.', tr: 'Bu gece Kur’an’dan okuyun.' },
  },
  dua: {
    icon: 'duas',
    title: { az: 'Dua', en: 'Dua', ru: 'Дуа', ar: 'الدعاء', tr: 'Dua' },
    hint: { az: 'Dua edin — aşağıdakı dua mənbəsi ilə verilib.', en: 'Make dua — the dua below is given with its source.', ru: 'Обращайтесь с дуа — ниже приведено дуа с источником.', ar: 'ادعُ الله — والدعاء أدناه مذكور بمصدره.', tr: 'Dua edin — aşağıdaki dua kaynağıyla verilmiştir.' },
  },
  sadaqah: {
    icon: 'charity',
    title: { az: 'Sədəqə', en: 'Sadaqah', ru: 'Садака', ar: 'الصدقة', tr: 'Sadaka' },
    hint: { az: 'Az da olsa, bir şey verin.', en: 'Give something, even a little.', ru: 'Дайте что-нибудь, пусть даже немного.', ar: 'تصدّق بشيء ولو قليلًا.', tr: 'Az da olsa bir şey verin.' },
  },
  istighfar: {
    icon: 'refresh',
    title: { az: 'İstiğfar', en: 'Seeking forgiveness (istighfar)', ru: 'Истигфар', ar: 'الاستغفار', tr: 'İstiğfar' },
    hint: { az: 'Allahdan bağışlanma diləyin.', en: 'Ask Allah for forgiveness.', ru: 'Просите у Аллаха прощения.', ar: 'استغفر الله.', tr: 'Allah’tan bağışlanma dileyin.' },
  },
}

// ── Yolun addımları ──
// links: { to, param?, hash?, label? } (label yoxdursa — navigation.js-dəki səhifə adı)
// quote: { sec, t, item? } — ramadanGuide.js-dəki bölmənin ilk "t" bloku (steps üçün item — sıra)
const L = {
  fastsLesson: { az: 'Dərs: Sünnə orucları', en: 'Lesson: Sunnah fasts', ru: 'Урок: Желательные посты', ar: 'درس: صيام التطوع', tr: 'Ders: Nafile oruçlar' },
}

export const STEP_TEXT = {
  'qada-count': {
    icon: 'qada', links: [{ to: 'qada' }], quote: { sec: 'exempt', t: 'note' },
    title: { az: 'Qəza oruclarınızı sayın', en: 'Count your missed fasts', ru: 'Посчитайте пропущенные посты', ar: 'احسب ما فاتك من الصيام', tr: 'Kaza oruçlarınızı sayın' },
    text: { az: 'Ramazan oruclarından buraxdığınız varsa, sayını qəza izləyicisinə yazın və Ramazana qədər tutmaq üçün günlər seçin.', en: 'If you missed any Ramadan fasts, enter the number in the qada tracker and choose days to make them up before Ramadan.', ru: 'Если вы пропустили посты Рамадана, внесите их число в учёт возмещения и выберите дни, чтобы возместить их до Рамадана.', ar: 'إن فاتك شيء من صيام رمضان فاكتب عدده في متابعة القضاء واختر أيامًا لقضائه قبل رمضان.', tr: 'Ramazan oruçlarından kaçırdığınız varsa sayısını kaza takibine yazın ve Ramazan’dan önce tutmak için günler seçin.' },
  },
  prayers: {
    icon: 'tracker', links: [{ to: 'tracker' }],
    title: { az: 'Beş namazı möhkəmləndirin', en: 'Strengthen the five prayers', ru: 'Укрепите пять намазов', ar: 'حافظ على الصلوات الخمس', tr: 'Beş vakti güçlendirin' },
    text: { az: 'Bir həftə namazlarınızı namaz izləyicisində qeyd edin və hansının diqqətə ehtiyacı olduğunu görün.', en: 'Mark your prayers in the prayer tracker for a week and see which one needs care.', ru: 'Отмечайте намазы в трекере неделю и посмотрите, какой из них требует внимания.', ar: 'سجّل صلواتك في متابعة الصلاة أسبوعًا لترى أيّها يحتاج عناية.', tr: 'Bir hafta namazlarınızı namaz takibinde işaretleyin ve hangisinin özen istediğini görün.' },
  },
  'dua-list': {
    icon: 'duajournal', links: [{ to: 'duajournal' }],
    title: { az: 'Dua siyahısına başlayın', en: 'Start a list of duas', ru: 'Начните список дуа', ar: 'ابدأ قائمة أدعيتك', tr: 'Dua listesine başlayın' },
    text: { az: 'Ramazanda etmək istədiyiniz duaları yazın — özünüz, ailəniz və başqaları üçün.', en: 'Write down the duas you want to make in Ramadan — for yourself, your family and others.', ru: 'Запишите дуа, с которыми хотите обращаться в Рамадан, — за себя, семью и других.', ar: 'اكتب الأدعية التي تريد أن تدعو بها في رمضان لنفسك ولأهلك ولغيرك.', tr: 'Ramazan’da etmek istediğiniz duaları yazın — kendiniz, aileniz ve başkaları için.' },
  },
  zakat: {
    icon: 'zakat', links: [{ to: 'zakat' }],
    title: { az: 'Zəkatınızı yoxlayın', en: 'Check your zakat', ru: 'Проверьте закят', ar: 'راجع زكاتك', tr: 'Zekâtınızı kontrol edin' },
    text: { az: 'Zəkat verirsinizsə, vaxtının çatıb-çatmadığına baxın — hesablayıcı kömək edir.', en: 'If you pay zakat, see whether it falls due — the calculator helps.', ru: 'Если вы выплачиваете закят, проверьте, не наступил ли срок, — поможет калькулятор.', ar: 'إن كنت تخرج الزكاة فانظر هل حان وقتها — والحاسبة تعينك.', tr: 'Zekât veriyorsanız vaktinin gelip gelmediğine bakın — hesaplayıcı yardımcı olur.' },
  },
  'fasts-lesson': {
    icon: 'calendar', links: [{ to: 'learn', param: 'sunnah-fasts', label: L.fastsLesson }],
    title: { az: 'Ramazandan əvvəl nafilə oruclar', en: 'Voluntary fasts before Ramadan', ru: 'Добровольные посты до Рамадана', ar: 'صيام التطوع قبل رمضان', tr: 'Ramazan’dan önce nafile oruçlar' },
    text: { az: 'Sünnə orucları dərsi hansı nafilə orucların olduğunu, o cümlədən Şabanı, dəlilləri ilə izah edir.', en: 'The lesson on Sunnah fasts explains which voluntary fasts there are, including Sha’ban, with their evidence.', ru: 'Урок о желательных постах объясняет, какие бывают добровольные посты, в том числе в шаабан, с доводами.', ar: 'يشرح درس صيام التطوع أنواعه، ومنها صيام شعبان، بأدلتها.', tr: 'Nafile oruçlar dersi hangi nafile oruçların olduğunu, Şaban dahil, delilleriyle açıklar.' },
  },
  muhasabah: {
    icon: 'muhasabah', links: [{ to: 'muhasabah' }],
    title: { az: 'Sakit bir nəzər', en: 'A quiet look back', ru: 'Спокойный взгляд назад', ar: 'وقفة هادئة مع النفس', tr: 'Sakin bir bakış' },
    text: { az: 'Bir neçə dəqiqə özünüzü hesaba çəkin: Ramazandan əvvəl nəyi saxlamaq, nəyi tərk etmək istəyirsiniz.', en: 'Spend a few minutes on self-reflection: what to keep and what to leave behind before Ramadan.', ru: 'Уделите несколько минут самоотчёту: что сохранить и что оставить до Рамадана.', ar: 'خصّص دقائق لمحاسبة نفسك: ما الذي تبقيه وما الذي تتركه قبل رمضان.', tr: 'Birkaç dakika nefis muhasebesi yapın: Ramazan’dan önce neyi tutmak, neyi bırakmak istiyorsunuz.' },
  },
  family: {
    icon: 'halaqa', links: [{ to: 'halaqa' }],
    title: { az: 'Ailə hədəfi', en: 'A family goal', ru: 'Семейная цель', ar: 'هدف للأسرة', tr: 'Aile hedefi' },
    text: { az: 'Ailənizlə Ramazan üçün bir ortaq hədəf razılaşdırın — məsələn, hər həftə birlikdə oxumaq.', en: 'Agree with your family on one shared goal for Ramadan — for example, reading together each week.', ru: 'Договоритесь с семьёй об одной общей цели на Рамадан — например, читать вместе каждую неделю.', ar: 'اتفق مع أسرتك على هدف مشترك لرمضان — كالقراءة معًا كل أسبوع.', tr: 'Ailenizle Ramazan için ortak bir hedefte anlaşın — örneğin her hafta birlikte okumak.' },
  },
  shaban: {
    icon: 'calendar', links: [{ to: 'calendar' }, { to: 'learn', param: 'sunnah-fasts', label: L.fastsLesson }],
    title: { az: 'Şaban ayı daxil oldu', en: 'Sha’ban has begun', ru: 'Начался шаабан', ar: 'دخل شهر شعبان', tr: 'Şaban ayı başladı' },
    text: { az: 'Ramazana təxminən bir ay qalıb. Təqvim və Sünnə orucları dərsi bu ayı mənbələri ilə təsvir edir.', en: 'Ramadan is about a month away. The calendar and the lesson on Sunnah fasts describe this month with their sources.', ru: 'До Рамадана около месяца. Календарь и урок о желательных постах описывают этот месяц с источниками.', ar: 'بقي على رمضان نحو شهر. ويصف التقويم ودرس صيام التطوع هذا الشهر بمصادرهما.', tr: 'Ramazan’a yaklaşık bir ay kaldı. Takvim ve nafile oruçlar dersi bu ayı kaynaklarıyla anlatır.' },
  },
  'sadaqah-plan': {
    icon: 'charity', links: [{ to: 'charity' }],
    title: { az: 'Sədəqə planı', en: 'Plan your sadaqah', ru: 'План садаки', ar: 'خطّط لصدقتك', tr: 'Sadaka planı' },
    text: { az: 'Ramazanda nə qədər və kimə vermək istədiyinizi qərarlaşdırın. Sədəqə səhifəsi qeydlərinizi saxlayır.', en: 'Decide how much you would like to give during Ramadan and to whom. The charity page keeps your notes.', ru: 'Решите, сколько и кому вы хотите дать в Рамадан. Страница садаки хранит ваши записи.', ar: 'حدّد كم تريد أن تتصدق في رمضان ولمن. وصفحة الصدقة تحفظ ملاحظاتك.', tr: 'Ramazan’da ne kadar ve kime vermek istediğinize karar verin. Sadaka sayfası notlarınızı saklar.' },
  },
  khatm: {
    icon: 'khatm', links: [{ to: 'khatm' }, { to: 'ramadan' }],
    title: { az: 'Ramazan üçün Quran planı', en: 'A Quran plan for Ramadan', ru: 'План чтения Корана на Рамадан', ar: 'خطة القرآن في رمضان', tr: 'Ramazan için Kur’an planı' },
    text: { az: 'Hər gün nə qədər oxuyacağınızı seçin. Xətm planlayıcısı Quranı sizin üçün bölür; imsakiyyə səhifəsində gündə bir cüz planı var.', en: 'Choose how much to read each day. The khatm planner divides the Quran for you; the timetable page has a juz-a-day plan.', ru: 'Выберите, сколько читать в день. Планировщик хатма разделит Коран за вас; на странице расписания есть план «джуз в день».', ar: 'اختر مقدار وردك اليومي. مخطط الختمة يقسّم القرآن لك، وفي صفحة الإمساكية خطة جزء كل يوم.', tr: 'Her gün ne kadar okuyacağınızı seçin. Hatim planlayıcısı Kur’an’ı sizin için böler; imsakiye sayfasında günde bir cüz planı var.' },
  },
  'iftar-invite': {
    icon: 'mail', links: [{ to: 'ramadan' }], quote: { sec: 'suhoor-iftar', t: 'steps', item: 5 },
    title: { az: 'Kimisə iftara dəvət edin', en: 'Invite someone to iftar', ru: 'Пригласите кого-нибудь на ифтар', ar: 'ادعُ أحدًا إلى الإفطار', tr: 'Birini iftara davet edin' },
    text: { az: 'Ramazanda iftara dəvət edə biləcəyiniz birini düşünün. İmsakiyyə səhifəsi dəvət kartı hazırlayır.', en: 'Think of someone you could invite to iftar during Ramadan. The timetable page can make an invitation card.', ru: 'Подумайте, кого можно пригласить на ифтар в Рамадан. На странице расписания можно сделать карточку-приглашение.', ar: 'فكّر في شخص تدعوه إلى الإفطار في رمضان. وصفحة الإمساكية تصنع بطاقة دعوة.', tr: 'Ramazan’da iftara davet edebileceğiniz birini düşünün. İmsakiye sayfası davet kartı hazırlar.' },
  },
  sleep: {
    icon: 'bedtime', links: [{ to: 'bedtime' }],
    title: { az: 'Yuxunu tezə çəkin', en: 'Shift your sleep earlier', ru: 'Ложитесь пораньше', ar: 'قدّم موعد نومك', tr: 'Uykunuzu öne alın' },
    text: { az: 'Hər gecə bir az tez yatın ki, səhura qalxmaq asan olsun. Yatmazdan əvvəlki ardıcıllıq sakitləşməyə kömək edir.', en: 'Go to bed a little earlier each night so that waking for suhoor is easier. The bedtime routine helps you wind down.', ru: 'Ложитесь каждый вечер немного раньше, чтобы легче вставать на сухур. Распорядок перед сном поможет успокоиться.', ar: 'نم كل ليلة أبكر قليلًا ليسهل عليك القيام للسحور. وتعينك سنن النوم على الهدوء.', tr: 'Sahura kalkmak kolay olsun diye her gece biraz erken yatın. Yatmadan önceki sıra sakinleşmeye yardım eder.' },
  },
  waking: {
    icon: 'waking', links: [{ to: 'waking' }],
    title: { az: 'Tez oyanmağı məşq edin', en: 'Practise waking early', ru: 'Потренируйтесь вставать рано', ar: 'تدرّب على الاستيقاظ مبكرًا', tr: 'Erken uyanmayı deneyin' },
    text: { az: 'Bu həftə səhurdakı kimi sübhdən bir az əvvəl oyanmağa çalışın.', en: 'This week, try waking a little before dawn, as you will for suhoor.', ru: 'На этой неделе попробуйте просыпаться немного до рассвета, как на сухур.', ar: 'حاول هذا الأسبوع أن تستيقظ قبل الفجر بقليل كما ستفعل للسحور.', tr: 'Bu hafta sahurdaki gibi fecirden biraz önce uyanmayı deneyin.' },
  },
  'iftar-dua': {
    icon: 'duas', links: [{ to: 'ramadan', hash: 'rp-g-suhoor-iftar' }], quote: { sec: 'suhoor-iftar', t: 'dua' },
    title: { az: 'İftar duasını öyrənin', en: 'Learn the iftar dua', ru: 'Выучите дуа ифтара', ar: 'تعلّم دعاء الإفطار', tr: 'İftar duasını öğrenin' },
    text: { az: 'Bu gün onu bir neçə dəfə oxuyun — qısadır.', en: 'Read it a few times today — it is short.', ru: 'Прочитайте его сегодня несколько раз — оно короткое.', ar: 'اقرأه اليوم بضع مرات — فهو قصير.', tr: 'Bugün birkaç kez okuyun — kısadır.' },
  },
  timetable: {
    icon: 'ramadan', links: [{ to: 'ramadan' }],
    title: { az: 'Şəhərinizi seçin', en: 'Choose your city', ru: 'Выберите город', ar: 'اختر مدينتك', tr: 'Şehrinizi seçin' },
    text: { az: 'İmsakiyyəni açıb şəhərinizi seçin — imsak və iftar vaxtları hazır olacaq.', en: 'Open the Ramadan timetable and select your city — the imsak and iftar times will be ready.', ru: 'Откройте расписание Рамадана и выберите город — время имсака и ифтара будет готово.', ar: 'افتح إمساكية رمضان واختر مدينتك — فتكون أوقات الإمساك والإفطار جاهزة.', tr: 'İmsakiyeyi açıp şehrinizi seçin — imsak ve iftar vakitleri hazır olur.' },
  },
  'last-ten': {
    icon: 'lastten', links: [{ to: 'lastten' }],
    title: { az: 'Son 10 gecəyə bir baxış', en: 'A look at the last ten nights', ru: 'Взгляд на последние десять ночей', ar: 'نظرة على العشر الأواخر', tr: 'Son on geceye bir bakış' },
    text: { az: 'Son on gecənin planını açın və Ramazan başlamazdan əvvəl necə işlədiyinə baxın.', en: 'Open the planner for the last ten nights and see how it works before Ramadan begins.', ru: 'Откройте план последних десяти ночей и посмотрите, как он устроен, до начала Рамадана.', ar: 'افتح خطة العشر الأواخر واطّلع على طريقتها قبل أن يبدأ رمضان.', tr: 'Son on gecenin planını açın ve Ramazan başlamadan nasıl işlediğine bakın.' },
  },
  moon: {
    icon: 'moonStar', links: [{ to: 'calendar' }], quote: { sec: 'eid', t: 'hadith' },
    title: { az: 'Elanı gözləyin', en: 'Watch for the announcement', ru: 'Следите за объявлением', ar: 'ترقّب الإعلان', tr: 'Duyuruyu takip edin' },
    text: { az: 'Ramazanın başlanğıcı hilalın görülməsinə bağlıdır. Bu axşam yerli elana baxın.', en: 'The start of Ramadan depends on the sighting of the new moon. Check your local announcement this evening.', ru: 'Начало Рамадана зависит от видения молодого месяца. Проверьте местное объявление сегодня вечером.', ar: 'بداية رمضان مرتبطة برؤية الهلال. تابع الإعلان المحلي هذا المساء.', tr: 'Ramazan’ın başlangıcı hilalin görülmesine bağlıdır. Bu akşam yerel duyuruya bakın.' },
  },
  // Gündəlik vərdişlər (növbə ilə)
  'quran-page': {
    icon: 'mushaf', links: [{ to: 'mushaf' }],
    title: { az: 'Qurandan bir səhifə', en: 'One page of the Quran', ru: 'Одна страница Корана', ar: 'صفحة من القرآن', tr: 'Kur’an’dan bir sayfa' },
    text: { az: 'Bu gün sakitcə Qurandan bir səhifə oxuyun.', en: 'Read one page of the Quran today, calmly.', ru: 'Спокойно прочитайте сегодня одну страницу Корана.', ar: 'اقرأ اليوم صفحة من القرآن بهدوء.', tr: 'Bugün sakince Kur’an’dan bir sayfa okuyun.' },
  },
  'qada-fast': {
    icon: 'qada', links: [{ to: 'qada' }],
    title: { az: 'Bu həftə bir qəza orucu', en: 'A make-up fast this week', ru: 'Один пост-возмещение на этой неделе', ar: 'صيام يوم قضاء هذا الأسبوع', tr: 'Bu hafta bir kaza orucu' },
    text: { az: 'Qəza orucunuz varsa, bu həftə birini tutmaq üçün gün seçin və qəza izləyicisində qeyd edin.', en: 'If you owe fasts, choose a day this week to make one up and mark it in the qada tracker.', ru: 'Если за вами есть посты, выберите день на этой неделе, чтобы возместить один, и отметьте его в учёте.', ar: 'إن كان عليك صيام فاختر يومًا هذا الأسبوع لقضاء يوم منه وسجّله في متابعة القضاء.', tr: 'Kaza orucunuz varsa bu hafta birini tutmak için bir gün seçin ve kaza takibinde işaretleyin.' },
  },
  'sadaqah-small': {
    icon: 'charity', links: [{ to: 'charity' }],
    title: { az: 'Kiçik bir sədəqə', en: 'A small sadaqah', ru: 'Небольшая садака', ar: 'صدقة صغيرة', tr: 'Küçük bir sadaka' },
    text: { az: 'Bu gün az da olsa bir şey verin.', en: 'Give something today, even a little.', ru: 'Дайте сегодня что-нибудь, пусть даже немного.', ar: 'تصدّق اليوم بشيء ولو قليلًا.', tr: 'Bugün az da olsa bir şey verin.' },
  },
  'dua-write': {
    icon: 'duajournal', links: [{ to: 'duajournal' }],
    title: { az: 'Siyahıya bir dua', en: 'One more dua for your list', ru: 'Ещё одно дуа в список', ar: 'دعاء جديد لقائمتك', tr: 'Listeye bir dua' },
    text: { az: 'Ramazan dua siyahınıza bir dua əlavə edin.', en: 'Add one dua to your Ramadan list.', ru: 'Добавьте одно дуа в свой список на Рамадан.', ar: 'أضف دعاءً واحدًا إلى قائمة رمضان.', tr: 'Ramazan dua listenize bir dua ekleyin.' },
  },
  'prayer-time': {
    icon: 'prayer', links: [{ to: 'prayer' }],
    title: { az: 'Namazı vaxtının əvvəlində', en: 'Pray at the start of its time', ru: 'Намаз в начале времени', ar: 'الصلاة في أول وقتها', tr: 'Namazı vaktinin başında' },
    text: { az: 'Bu gün bir namazı seçin və onu vaxtı girən kimi qılın.', en: 'Choose one prayer today and pray it as soon as its time begins.', ru: 'Выберите сегодня один намаз и совершите его, как только наступит время.', ar: 'اختر صلاة اليوم وصلّها حين يدخل وقتها.', tr: 'Bugün bir namaz seçin ve vakti girer girmez kılın.' },
  },
  dhikr: {
    icon: 'dhikr', links: [{ to: 'hisn' }, { to: 'dhikr' }],
    title: { az: 'Səhər və axşam zikrləri', en: 'Morning and evening remembrance', ru: 'Утренние и вечерние поминания', ar: 'أذكار الصباح والمساء', tr: 'Sabah ve akşam zikirleri' },
    text: { az: 'Bu gün səhər və ya axşam zikrlərini deyin.', en: 'Say the morning or evening adhkar today.', ru: 'Произнесите сегодня утренние или вечерние азкары.', ar: 'قل اليوم أذكار الصباح أو المساء.', tr: 'Bugün sabah veya akşam zikirlerini söyleyin.' },
  },
  'family-talk': {
    icon: 'ramadan', links: [{ to: 'ramadan', hash: 'rp-g-virtues' }],
    title: { az: 'Evdə Ramazan söhbəti', en: 'Talk about Ramadan at home', ru: 'Поговорите дома о Рамадане', ar: 'حديث عن رمضان في البيت', tr: 'Evde Ramazan sohbeti' },
    text: { az: 'Ramazan haqqında öyrəndiyiniz bir şeyi ailənizlə bölüşün.', en: 'Share one thing you have learned about Ramadan with your family.', ru: 'Поделитесь с семьёй одной вещью, которую вы узнали о Рамадане.', ar: 'شارك أسرتك شيئًا تعلّمته عن رمضان.', tr: 'Ramazan hakkında öğrendiğiniz bir şeyi ailenizle paylaşın.' },
  },
}
