// ═══════════════════════════════════════════════════════
// /new-muslim — "Yeni müsəlmanın yolu — ilk 40 gün" (C dəstəsi)
//
// Yeni müsəlmanlar və namaza başlayanlar üçün sakit, addım-addım yol. Səhifə YENİ dini mətn
// yazmır: hər addım saytın mövcud bələdçisinə (dərs, namaz bələdçisi, ərəb kursu, Fatihə,
// lüğət, dualar) keçid verir; izahlar yalnız interfeys istiqamətləridir (hökm yoxdur).
// Günlər — tövsiyədir, son tarix deyil. Ardıcıllıq (streak), xal, reytinq YOXDUR.
// İrəliləyiş: utils/newMuslimPath (new_muslim_path_v1, profilə aid, E2E sinxronizasiya) —
// prerender ilə ilk render eyni olsun deyə yalnız mount-dan sonra oxunur.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf, navLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { isPlainClick } from '../components/PageLink'
import { pickUi } from '../utils/uiText'
import { readPath, setStep, nextStep, PATH_KEY, PATH_EVENT, PATH_STEP_IDS } from '../utils/newMuslimPath'
import { dayLabel } from '../utils/dayLabel'
import '../styles/NewMuslimPathPage.css'

const T = {
  az: {
    title: 'Yeni müsəlmanın yolu — ilk 40 gün',
    lead: 'Yeni müsəlmanlar və namaza yeni başlayanlar üçün sakit yol. Hər addım saytın hazır bələdçisinə aparır — öz sürətinizlə gedin.',
    calm: 'Günlər yalnız tövsiyədir, son tarix deyil. Addımı hazır olanda işarələyin. Ardıcıllıq, xal və müqayisə yoxdur.',
    private: 'İşarələriniz yalnız bu cihazda saxlanılır (hesabınız varsa, şifrəli sinxronizasiya ilə digər cihazlarınıza da keçir).',
    progress: (d, n) => `${n} addımdan ${d}-i işarələnib`, next: 'Növbəti addım', allDone: 'Bütün addımları işarələmisiniz. Öyrənməyə öz sürətinizlə davam edin.',
    done: 'Bu addımı etdim', doneOn: 'işarələndi', open: 'Aç', steps: 'Addımlar', whenRamadan: 'Ramazan gələndə',
    days: (a, b) => `Günlər: ${a}–${b}`, saved: 'Yadda saxlandı.', unsaved: 'İşarə götürüldü.',
  },
  en: {
    title: 'New Muslim path — the first 40 days',
    lead: 'A calm path for new Muslims and anyone starting to pray. Each step leads to a guide already on the site — go at your own pace.',
    calm: 'The days are only suggestions, not deadlines. Mark a step when you feel ready. There are no streaks, points or comparisons.',
    private: 'Your marks are stored only on this device (if you have an account, encrypted sync carries them to your other devices).',
    progress: (d, n) => `${d} of ${n} steps marked`, next: 'Next step', allDone: 'You have marked every step. Keep learning at your own pace.',
    done: 'I have done this step', doneOn: 'marked', open: 'Open', steps: 'Steps', whenRamadan: 'When Ramadan comes',
    days: (a, b) => `Days ${a}–${b}`, saved: 'Saved.', unsaved: 'Mark removed.',
  },
  ru: {
    title: 'Путь нового мусульманина — первые 40 дней',
    lead: 'Спокойный путь для новых мусульман и всех, кто начинает молиться. Каждый шаг ведёт к готовому руководству на сайте — идите в своём темпе.',
    calm: 'Дни — только рекомендация, а не срок. Отмечайте шаг, когда будете готовы. Никаких серий, очков и сравнений.',
    private: 'Отметки хранятся только на этом устройстве (если у вас есть аккаунт, зашифрованная синхронизация перенесёт их на другие устройства).',
    progress: (d, n) => `Отмечено шагов: ${d} из ${n}`, next: 'Следующий шаг', allDone: 'Вы отметили все шаги. Продолжайте учиться в своём темпе.',
    done: 'Я сделал этот шаг', doneOn: 'отмечено', open: 'Открыть', steps: 'Шаги', whenRamadan: 'Когда придёт Рамадан',
    days: (a, b) => `Дни ${a}–${b}`, saved: 'Сохранено.', unsaved: 'Отметка снята.',
  },
  ar: {
    title: 'طريق المسلم الجديد — الأيام الأربعون الأولى',
    lead: 'طريق هادئ للمسلم الجديد ولكل من يبدأ الصلاة. كل خطوة تقودك إلى دليل موجود في الموقع — سِر على مهلك.',
    calm: 'الأيام اقتراح فقط وليست مواعيد نهائية. علّم الخطوة حين تكون مستعدًا. لا سلاسل ولا نقاط ولا مقارنات.',
    private: 'علاماتك محفوظة على هذا الجهاز فقط (وإن كان لك حساب فالمزامنة المشفّرة تنقلها إلى أجهزتك الأخرى).',
    progress: (d, n) => `الخطوات المعلَّمة: ${d} من ${n}`, next: 'الخطوة التالية', allDone: 'علّمت جميع الخطوات. واصل التعلّم على مهلك.',
    done: 'أنجزت هذه الخطوة', doneOn: 'معلَّمة', open: 'افتح', steps: 'الخطوات', whenRamadan: 'حين يأتي رمضان',
    days: (a, b) => `الأيام ${a}–${b}`, saved: 'تم الحفظ.', unsaved: 'أُزيلت العلامة.',
  },
  tr: {
    title: 'Yeni Müslüman yolu — ilk 40 gün',
    lead: 'Yeni Müslümanlar ve namaza yeni başlayanlar için sakin bir yol. Her adım sitedeki hazır bir rehbere götürür — kendi hızınızda ilerleyin.',
    calm: 'Günler yalnızca öneridir, son tarih değildir. Hazır olduğunuzda adımı işaretleyin. Seri, puan ve karşılaştırma yoktur.',
    private: 'İşaretleriniz yalnızca bu cihazda saklanır (hesabınız varsa şifreli eşitleme onları diğer cihazlarınıza da taşır).',
    progress: (d, n) => `${n} adımdan ${d} tanesi işaretlendi`, next: 'Sonraki adım', allDone: 'Bütün adımları işaretlediniz. Öğrenmeye kendi hızınızda devam edin.',
    done: 'Bu adımı yaptım', doneOn: 'işaretlendi', open: 'Aç', steps: 'Adımlar', whenRamadan: 'Ramazan gelince',
    days: (a, b) => `Günler: ${a}–${b}`, saved: 'Kaydedildi.', unsaved: 'İşaret kaldırıldı.',
  },
}

// Keçid etiketləri (səhifə adı navigation.js-dən gəlməyənlər)
const L = {
  lessonNew: { az: 'Dərs: Yeni müsəlmanın ilk addımları', en: 'Lesson: First steps for a new Muslim', ru: 'Урок: Первые шаги нового мусульманина', ar: 'درس: أولى خطوات المسلم الجديد', tr: 'Ders: Yeni Müslümanın ilk adımları' },
  lessonGhusl: { az: 'Dərs: Qüsl', en: 'Lesson: Ghusl', ru: 'Урок: Гусль', ar: 'درس: الغسل', tr: 'Ders: Gusül' },
  lessonAdhkar: { az: 'Dərs: Namazdan sonrakı zikrlər', en: 'Lesson: Remembrance after the prayer', ru: 'Урок: Поминание после намаза', ar: 'درس: الأذكار بعد الصلاة', tr: 'Ders: Namazdan sonraki zikirler' },
  gShahadah: { az: 'Lüğət: şəhadət', en: 'Glossary: shahadah', ru: 'Словарь: шахада', ar: 'المعجم: الشهادة', tr: 'Sözlük: şehadet' },
  gWudu: { az: 'Lüğət: dəstəmaz', en: 'Glossary: wudu', ru: 'Словарь: омовение', ar: 'المعجم: الوضوء', tr: 'Sözlük: abdest' },
  gSawm: { az: 'Lüğət: oruc', en: 'Glossary: fasting', ru: 'Словарь: пост', ar: 'المعجم: الصوم', tr: 'Sözlük: oruç' },
  fatiha: { az: 'Fatihə surəsi', en: 'Surah Al-Fatiha', ru: 'Сура аль-Фатиха', ar: 'سورة الفاتحة', tr: 'Fâtiha suresi' },
  ikhlas: { az: 'İxlas surəsi (112)', en: 'Surah Al-Ikhlas (112)', ru: 'Сура аль-Ихлас (112)', ar: 'سورة الإخلاص (112)', tr: 'İhlâs suresi (112)' },
  falaq: { az: 'Fələq surəsi (113)', en: 'Surah Al-Falaq (113)', ru: 'Сура аль-Фаляк (113)', ar: 'سورة الفلق (113)', tr: 'Felak suresi (113)' },
  nas: { az: 'Nas surəsi (114)', en: 'Surah An-Nas (114)', ru: 'Сура ан-Нас (114)', ar: 'سورة الناس (114)', tr: 'Nâs suresi (114)' },
  reading: { az: 'Ərəb kursu: oxumaq', en: 'Arabic course: reading', ru: 'Курс арабского: чтение', ar: 'دورة العربية: القراءة', tr: 'Arapça kursu: okuma' },
}

// Addımlar — sıra PATH_STEP_IDS ilə eynidir. win: [ilk gün, son gün] (tövsiyə) və ya null (Ramazan).
// links: { to, param?, search?, hash?, label? } — label yoxdursa navigation.js-dəki səhifə adı.
const STEPS = [
  { id: 'shahada', icon: 'learn', win: [1, 3],
    title: { az: 'Şəhadətin mənası', en: 'The meaning of the shahadah', ru: 'Смысл шахады', ar: 'معنى الشهادتين', tr: 'Şehadetin anlamı' },
    text: { az: 'İki şəhadətin nə demək olduğunu yavaş-yavaş oxuyun. Dərs hər hissəni mənbələri ilə izah edir.', en: 'Read slowly what the two testimonies of faith mean. The lesson explains each part with its sources.', ru: 'Неторопливо прочитайте, что означают два свидетельства. Урок объясняет каждую часть с источниками.', ar: 'اقرأ على مهل معنى الشهادتين. يشرح الدرس كل جزء مع مصادره.', tr: 'İki şehadetin ne anlama geldiğini yavaşça okuyun. Ders her bölümü kaynaklarıyla açıklar.' },
    links: [{ to: 'learn', param: 'new-muslim', label: L.lessonNew }, { to: 'glossary', param: 'shahadah', label: L.gShahadah }] },
  { id: 'purity', icon: 'drop', win: [1, 5],
    title: { az: 'Qüsl və dəstəmaz', en: 'Ghusl and wudu', ru: 'Гусль и омовение', ar: 'الغسل والوضوء', tr: 'Gusül ve abdest' },
    text: { az: 'Qüslü, sonra dəstəmazı addım-addım öyrənin. Namaz bələdçisində şəkilli dəstəmaz rejimi var.', en: 'Learn ghusl, then wudu, step by step. The prayer guide has an illustrated wudu mode.', ru: 'Изучите гусль, затем омовение — шаг за шагом. В руководстве по намазу есть иллюстрированный режим омовения.', ar: 'تعلّم الغسل ثم الوضوء خطوة خطوة. في دليل الصلاة وضع مصوَّر للوضوء.', tr: 'Gusülü, ardından abdesti adım adım öğrenin. Namaz rehberinde resimli abdest bölümü var.' },
    links: [{ to: 'learn', param: 'ghusl', label: L.lessonGhusl }, { to: 'prayerguide' }, { to: 'glossary', param: 'wudu', label: L.gWudu }] },
  { id: 'times', icon: 'prayer', win: [3, 7],
    title: { az: 'Beş namaz vaxtı', en: 'The five prayer times', ru: 'Пять времён намаза', ar: 'أوقات الصلوات الخمس', tr: 'Beş vakit namaz' },
    text: { az: 'Şəhərinizin bugünkü namaz vaxtlarına baxın və qibləni tapın. İstəsəniz, sakit xatırlatma qoşa bilərsiniz.', en: 'Look up today’s prayer times for your city and find the qibla. You can turn on a gentle reminder if you wish.', ru: 'Посмотрите сегодняшнее время намаза в вашем городе и найдите киблу. При желании можно включить спокойное напоминание.', ar: 'اطّلع على مواقيت الصلاة اليوم في مدينتك وحدّد القبلة. ويمكنك تفعيل تذكير هادئ إن شئت.', tr: 'Şehrinizin bugünkü namaz vakitlerine bakın ve kıbleyi bulun. İsterseniz sakin bir hatırlatma açabilirsiniz.' },
    links: [{ to: 'prayer' }, { to: 'qibla' }] },
  { id: 'fatiha', icon: 'quran', win: [3, 10],
    title: { az: 'Fatihəni öyrənmək', en: 'Learning Al-Fatiha', ru: 'Изучение аль-Фатихи', ar: 'تعلّم الفاتحة', tr: 'Fâtiha’yı öğrenmek' },
    text: { az: 'Fatihəni dinləyin və ayə-ayə oxuyun. Hər gün bir az təkrarlayın — tələsməyə ehtiyac yoxdur.', en: 'Listen to Al-Fatiha and read it ayah by ayah. Repeat a little each day — there is no rush.', ru: 'Слушайте аль-Фатиху и читайте её аят за аятом. Повторяйте понемногу каждый день — спешить не нужно.', ar: 'استمع إلى الفاتحة واقرأها آية آية. كرّر قليلًا كل يوم — لا داعي للعجلة.', tr: 'Fâtiha’yı dinleyin ve ayet ayet okuyun. Her gün biraz tekrar edin — acele etmeye gerek yok.' },
    links: [{ to: 'quran', param: 1, label: L.fatiha }, { to: 'arabic', hash: 'reading', label: L.reading }] },
  { id: 'first-prayer', icon: 'prayerguide', win: [5, 14],
    title: { az: 'İlk namazınız', en: 'Your first prayer', ru: 'Ваш первый намаз', ar: 'صلاتك الأولى', tr: 'İlk namazınız' },
    text: { az: 'Bələdçini hərəkət-hərəkət izləyin, öz sürətinizlə. Namaz izləyicisi yalnız sizə faydalı olarsa istifadə üçündür.', en: 'Follow the guide movement by movement, at your own pace. The prayer tracker is there only if you find it helpful.', ru: 'Следуйте руководству движение за движением, в своём темпе. Трекер намазов — только если он вам помогает.', ar: 'اتبع الدليل حركةً حركة على مهلك. ومتابعة الصلاة متاحة فقط إن وجدتها نافعة.', tr: 'Rehberi hareket hareket, kendi hızınızda izleyin. Namaz takibi yalnızca faydalı bulursanız içindir.' },
    links: [{ to: 'prayerguide' }, { to: 'tracker' }] },
  { id: 'letters', icon: 'arabic', win: [7, 21],
    title: { az: 'Ərəb hərfləri', en: 'The Arabic letters', ru: 'Арабские буквы', ar: 'الحروف العربية', tr: 'Arap harfleri' },
    text: { az: 'Gündə bir neçə hərf kifayətdir. Kurs əlifbadan başlayıb oxumağa qədər aparır.', en: 'A few letters a day are enough. The course starts from the alphabet and leads to reading.', ru: 'Нескольких букв в день достаточно. Курс начинается с алфавита и доводит до чтения.', ar: 'بضعة حروف في اليوم تكفي. تبدأ الدورة من الحروف وتصل بك إلى القراءة.', tr: 'Günde birkaç harf yeterlidir. Kurs alfabeden başlayıp okumaya kadar götürür.' },
    links: [{ to: 'arabic' }] },
  { id: 'short-surahs', icon: 'hifz', win: [10, 25],
    title: { az: 'Bir neçə qısa surə', en: 'A few short surahs', ru: 'Несколько коротких сур', ar: 'بعض السور القصيرة', tr: 'Birkaç kısa sure' },
    text: { az: 'Fatihədən sonra İxlas, Fələq və Nas kimi qısa surələr. Hifz aləti onları təkrarlamağa kömək edir.', en: 'After Al-Fatiha, short surahs such as Al-Ikhlas, Al-Falaq and An-Nas. The memorisation tool helps you repeat them.', ru: 'После аль-Фатихи — короткие суры, например аль-Ихлас, аль-Фаляк и ан-Нас. Инструмент хифза помогает их повторять.', ar: 'بعد الفاتحة سور قصيرة مثل الإخلاص والفلق والناس. وأداة الحفظ تعينك على تكرارها.', tr: 'Fâtiha’dan sonra İhlâs, Felak ve Nâs gibi kısa sureler. Hıfz aracı onları tekrar etmenize yardım eder.' },
    links: [{ to: 'quran', param: 112, label: L.ikhlas }, { to: 'quran', param: 113, label: L.falaq }, { to: 'quran', param: 114, label: L.nas }, { to: 'hifz' }] },
  { id: 'daily-duas', icon: 'duas', win: [7, 30],
    title: { az: 'Gündəlik dualar', en: 'Everyday duas', ru: 'Повседневные дуа', ar: 'أدعية اليوم والليلة', tr: 'Günlük dualar' },
    text: { az: 'Oyananda, yeməkdə, evdən çıxanda oxunan dualar. Bir-ikisini seçin və yaxınınızda saxlayın.', en: 'Duas for waking up, eating and leaving home. Pick one or two and keep them close.', ru: 'Дуа при пробуждении, за едой, при выходе из дома. Выберите одно-два и держите под рукой.', ar: 'أدعية الاستيقاظ والطعام والخروج من البيت. اختر دعاءً أو دعاءين واجعلهما قريبين منك.', tr: 'Uyanınca, yemekte, evden çıkarken okunan dualar. Bir ikisini seçin ve yakınınızda tutun.' },
    links: [{ to: 'hisn' }, { to: 'duas' }] },
  { id: 'after-prayer', icon: 'dhikr', win: [14, 30],
    title: { az: 'Namazdan sonra zikr', en: 'Remembrance after prayer', ru: 'Зикр после намаза', ar: 'الذكر بعد الصلاة', tr: 'Namazdan sonra zikir' },
    text: { az: 'Namazdan sonra deyilənlər haqqında qısa dərs — mənbələri ilə.', en: 'A short lesson on what is said after the prayer — with its sources.', ru: 'Короткий урок о том, что говорят после намаза, — с источниками.', ar: 'درس قصير فيما يُقال بعد الصلاة مع مصادره.', tr: 'Namazdan sonra söylenenler hakkında kısa bir ders — kaynaklarıyla.' },
    links: [{ to: 'learn', param: 'adhkar-after-salah', label: L.lessonAdhkar }, { to: 'dhikr' }] },
  { id: 'words', icon: 'glossary', win: [1, 40],
    title: { az: 'Eşidəcəyiniz sözlər', en: 'Words you will hear', ru: 'Слова, которые вы услышите', ar: 'كلمات ستسمعها', tr: 'Duyacağınız kelimeler' },
    text: { az: 'Namaz, dəstəmaz, qiblə, sünnə… Lüğət tez-tez işlənən terminləri sadə dillə izah edir.', en: 'Salah, wudu, qibla, sunnah… The glossary explains common terms in plain words.', ru: 'Намаз, омовение, кибла, сунна… Словарь простыми словами объясняет частые термины.', ar: 'الصلاة، الوضوء، القبلة، السنة… يشرح المعجم المصطلحات الشائعة بكلمات بسيطة.', tr: 'Namaz, abdest, kıble, sünnet… Sözlük sık geçen terimleri sade bir dille açıklar.' },
    links: [{ to: 'glossary' }] },
  { id: 'friday', icon: 'jamaat', win: [7, 40],
    title: { az: 'Cümə və məscid', en: 'Friday and the mosque', ru: 'Пятница и мечеть', ar: 'الجمعة والمسجد', tr: 'Cuma ve cami' },
    text: { az: 'Yaxınlıqdakı məscidi tapın, camaat və cümə haqqında oxuyun.', en: 'Find a mosque near you and read about the congregation and Friday.', ru: 'Найдите мечеть рядом и прочитайте о джамаате и пятнице.', ar: 'ابحث عن مسجد قريب واقرأ عن الجماعة والجمعة.', tr: 'Yakınınızdaki camiyi bulun, cemaat ve cuma hakkında okuyun.' },
    links: [{ to: 'mosques' }, { to: 'jamaat' }] },
  { id: 'ramadan', icon: 'ramadan', win: null,
    title: { az: 'İlk Ramazanınız', en: 'Your first Ramadan', ru: 'Ваш первый Рамадан', ar: 'رمضانك الأول', tr: 'İlk Ramazanınız' },
    text: { az: 'Ramazan gələndə imsakiyyə şəhərinizin sahur və iftar vaxtlarını göstərir. Təqvim onun nə vaxt başladığını göstərir.', en: 'When Ramadan comes, the timetable shows suhoor and iftar times for your city. The calendar shows when it begins.', ru: 'Когда придёт Рамадан, расписание покажет время сухура и ифтара в вашем городе. Календарь покажет, когда он начинается.', ar: 'حين يأتي رمضان تعرض الإمساكية أوقات السحور والإفطار في مدينتك، ويبيّن التقويم موعد بدايته.', tr: 'Ramazan gelince imsakiye şehrinizin sahur ve iftar vakitlerini gösterir. Takvim ne zaman başladığını gösterir.' },
    links: [{ to: 'ramadan' }, { to: 'calendar' }, { to: 'glossary', param: 'sawm', label: L.gSawm }] },
  { id: 'community', icon: 'fatwa', win: [14, 40],
    title: { az: 'Suallar və dəstək', en: 'Questions and support', ru: 'Вопросы и поддержка', ar: 'الأسئلة والعون', tr: 'Sorular ve destek' },
    text: { az: 'Sualların olması təbiidir. Yeni müsəlman dərsində kimdən soruşmaq barədə bölmə var; fətvalar səhifəsi etibarlı elm mənbələrini sadalayır.', en: 'Having questions is natural. The new Muslim lesson has a section on whom to ask; the fatwas page lists trusted scholarly sources.', ru: 'Вопросы — это нормально. В уроке для новых мусульман есть раздел о том, к кому обращаться; на странице фетв перечислены надёжные источники знаний.', ar: 'من الطبيعي أن تكون لديك أسئلة. في درس المسلم الجديد قسم عمّن تسأل، وصفحة الفتاوى تذكر مصادر علمية موثوقة.', tr: 'Sorularınızın olması doğaldır. Yeni Müslüman dersinde kime soracağınıza dair bir bölüm var; fetvalar sayfası güvenilir ilim kaynaklarını sıralar.' },
    links: [{ to: 'learn', param: 'new-muslim', label: L.lessonNew }, { to: 'fatwa' }] },
  { id: 'keep-learning', icon: 'learn', win: [30, 40],
    title: { az: 'Öyrənməyə davam', en: 'Keep learning', ru: 'Продолжайте учиться', ar: 'واصل التعلّم', tr: 'Öğrenmeye devam' },
    text: { az: 'Dərs yolları sizi mövzu-mövzu irəli aparır. Öz sürətinizlə gedin.', en: 'Lesson paths lead you on, topic by topic. Go at your own pace.', ru: 'Пути уроков ведут дальше, тема за темой. Идите в своём темпе.', ar: 'مسارات الدروس تأخذك موضوعًا بعد موضوع. سِر على مهلك.', tr: 'Ders yolları sizi konu konu ileri götürür. Kendi hızınızda ilerleyin.' },
    links: [{ to: 'learn' }] },
]

// Sıra yerli qeydlərin açarları ilə eynidir (utils/newMuslimPath) — dev-də yoxla
if (import.meta.env?.DEV && STEPS.map((s) => s.id).join() !== PATH_STEP_IDS.join()) console.warn('[new-muslim] STEPS ≠ PATH_STEP_IDS')

const hrefOf = (l, lang) => {
  const base = pathFor(l.to, lang, l.param)
  return `${base}${l.search || ''}${l.hash ? `#${l.hash}` : ''}`
}

export default function NewMuslimPathPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  // Prerender = ilk render: boş; yaddaş mount-dan sonra oxunur
  const [data, setData] = useState({ v: 1, d: {} })
  const [ready, setReady] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const load = () => setData(readPath())
    load()
    setReady(true)
    const onStorage = (e) => { if (!e.key || e.key === PATH_KEY || e.key.endsWith(`:${PATH_KEY}`)) load() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('mcc-profile', load)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('mcc-profile', load) }
  }, [])
  // Başqa komponent dəyişəndə (eyni vərəq)
  useEffect(() => {
    const on = () => setData(readPath())
    window.addEventListener(PATH_EVENT, on)
    return () => window.removeEventListener(PATH_EVENT, on)
  }, [])

  const toggle = (id, done) => {
    setData(setStep(id, done))
    setMsg(done ? t.saved : t.unsaved)
  }
  const go = (e, href) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }

  const total = STEPS.length
  const doneN = STEPS.filter((s) => data.d[s.id]).length
  const nextId = nextStep(data)
  const nextIdx = STEPS.findIndex((s) => s.id === nextId)
  const label = (l) => (l.label ? pickUi(l.label, lang, 'en') : navLabel(l.to, lang))

  return (
    <div className="nmp-page">
      <header className="ui-page-hero ui-page-hero--split nmp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('newmuslim'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {t.private}</p>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card nmp-summary" data-testid="nmp-summary">
              <p className="nmp-summary__count">{ready ? t.progress(doneN, total) : ' '}</p>
              {ready && nextIdx >= 0 && (
                <a className="ui-btn ui-btn--primary ui-btn--sm" href={`#nmp-step-${nextId}`}
                  onClick={(e) => { e.preventDefault(); const el = document.getElementById(`nmp-step-${nextId}`); el?.scrollIntoView({ block: 'start' }); el?.querySelector('h3')?.focus() }}>
                  <Icon name="arrow" size={16} className="ui-btn__icon ui-flip-rtl" /> {t.next}: {pickUi(STEPS[nextIdx].title, lang, 'en')}
                </a>
              )}
              {ready && nextIdx < 0 && <p className="nmp-summary__done">{t.allDone}</p>}
            </div>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <aside className="ui-callout ui-callout--accent nmp-calm">
            <Icon name="leaf" />
            <p>{t.calm}</p>
          </aside>
          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          <h2 className="ui-sr-only">{t.steps}</h2>
          <ol className="ui-steps nmp-steps">
            {STEPS.map((s, i) => {
              const on = Boolean(data.d[s.id])
              const cbId = `nmp-cb-${s.id}`
              return (
                <li key={s.id} id={`nmp-step-${s.id}`} className={`ui-step nmp-step${on ? ' is-done' : ''}${s.id === nextId && ready ? ' is-next' : ''}`}>
                  <span className="ui-step__n" aria-hidden="true">{on ? <Icon name="check" size={16} /> : i + 1}</span>
                  <div className="ui-step__body ui-card nmp-step__card">
                    <div className="nmp-step__top">
                      <span className="ui-badge ui-badge--outline nmp-step__days">{s.win ? t.days(s.win[0], s.win[1]) : t.whenRamadan}</span>
                    </div>
                    <h3 className="ui-step__title nmp-step__title" tabIndex={-1}>
                      <Icon name={s.icon} size={18} /> {pickUi(s.title, lang, 'en')}
                    </h3>
                    <p className="ui-step__text">{pickUi(s.text, lang, 'en')}</p>
                    <ul className="nmp-links">
                      {s.links.map((l) => {
                        const href = hrefOf(l, lang)
                        return (
                          <li key={href}>
                            <a className="ui-chip nmp-link" href={href} onClick={(e) => go(e, href)}>
                              <Icon name={l.to === 'learn' && l.param ? 'learn' : l.to} size={16} /> {label(l)}
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                    <label className="nmp-check" htmlFor={cbId}>
                      <input id={cbId} type="checkbox" checked={on} disabled={!ready} onChange={(e) => toggle(s.id, e.target.checked)} />
                      <span>{t.done}</span>
                      {on && <span className="nmp-check__on"> · {t.doneOn} <span className="ui-num">{dayLabel(data.d[s.id], lang)}</span></span>}
                    </label>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    </div>
  )
}
