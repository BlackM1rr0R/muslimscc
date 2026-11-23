// Həyat bələdçilərinin (körpə, vəfat, nikah) ortaq interfeys mətnləri — dini mətn YOXDUR
export const LG = {
  az: {
    fromLesson: 'Dərs nə deyir — mənbələri ilə', fromHisn: 'Hisnul-Müslimdən dua', readLesson: 'Dərsdə tam oxu',
    openHisn: 'Hisnul-Müslimdə aç', loading: 'Yüklənir…', loadError: 'Mətn yüklənmədi. Dərsin özünü açın.',
    done: 'Etdim', doneOn: 'işarələndi', saved: 'Yadda saxlandı.', unsaved: 'İşarə götürüldü.',
    progress: (d, n) => `${n} addımdan ${d}-i işarələnib`,
    scholar: 'Bu səhifədəki bütün dini məlumat saytın dərslərindən və Hisnul-Müslimdən olduğu kimi götürülüb, mənbələri yanındadır. Öz vəziyyətinizə aid sualı etibarlı alimə verin. Dərslər onlarda göstərilən mənbə və alimlərə əsaslanır; bəzi təfərrüatlarda fiqh məzhəbləri fərqli rəydədir — öz məzhəbinizin alimindən soruşun.',
    clear: 'Qeydlərimi sil', clearAsk: 'Bu bələdçidəki bütün qeydləriniz silinsin?', clearYes: 'Bəli, sil', cancel: 'İmtina', cleared: 'Qeydlər silindi.',
    privateLocal: 'Qeydləriniz yalnız bu cihazda saxlanılır — heç yerə göndərilmir, ehtiyat nüsxəyə və sinxronizasiyaya düşmür.',
    privateSync: 'Qeydləriniz yalnız bu cihazda saxlanılır (hesabınız varsa, şifrəli sinxronizasiya ilə digər cihazlarınıza da keçir).',
  },
  en: {
    fromLesson: 'What the lesson says — with sources', fromHisn: 'Dua from Hisn al-Muslim', readLesson: 'Read it in full in the lesson',
    openHisn: 'Open in Hisn al-Muslim', loading: 'Loading…', loadError: 'The text could not be loaded. Open the lesson itself.',
    done: 'Done', doneOn: 'marked', saved: 'Saved.', unsaved: 'Mark removed.',
    progress: (d, n) => `${d} of ${n} steps marked`,
    scholar: 'All religious content on this page is quoted as it is from the site’s lessons and Hisn al-Muslim, with its sources. For a question about your own situation, ask a trusted scholar. The lessons follow the sources and scholars named in them; on some details the schools of fiqh differ — ask a scholar of your own school.',
    clear: 'Delete my notes', clearAsk: 'Delete all your notes in this guide?', clearYes: 'Yes, delete', cancel: 'Cancel', cleared: 'Notes deleted.',
    privateLocal: 'Your notes are stored only on this device — they are never sent anywhere and are not included in backups or sync.',
    privateSync: 'Your notes are stored only on this device (if you have an account, encrypted sync carries them to your other devices).',
  },
  ru: {
    fromLesson: 'Что говорится в уроке — с источниками', fromHisn: 'Дуа из «Крепости мусульманина»', readLesson: 'Читать полностью в уроке',
    openHisn: 'Открыть в «Крепости мусульманина»', loading: 'Загрузка…', loadError: 'Текст не загрузился. Откройте сам урок.',
    done: 'Сделано', doneOn: 'отмечено', saved: 'Сохранено.', unsaved: 'Отметка снята.',
    progress: (d, n) => `Отмечено шагов: ${d} из ${n}`,
    scholar: 'Всё религиозное содержание этой страницы приведено дословно из уроков сайта и «Крепости мусульманина» вместе с источниками. С вопросом о своей ситуации обратитесь к надёжному учёному. Уроки опираются на указанные в них источники и учёных; в некоторых деталях мазхабы расходятся — спросите учёного своего мазхаба.',
    clear: 'Удалить мои записи', clearAsk: 'Удалить все ваши записи в этом руководстве?', clearYes: 'Да, удалить', cancel: 'Отмена', cleared: 'Записи удалены.',
    privateLocal: 'Записи хранятся только на этом устройстве — они никуда не отправляются и не попадают в резервную копию и синхронизацию.',
    privateSync: 'Записи хранятся только на этом устройстве (если у вас есть аккаунт, зашифрованная синхронизация перенесёт их на другие устройства).',
  },
  ar: {
    fromLesson: 'ما في الدرس — مع المصادر', fromHisn: 'دعاء من حصن المسلم', readLesson: 'اقرأه كاملًا في الدرس',
    openHisn: 'افتح في حصن المسلم', loading: 'جارٍ التحميل…', loadError: 'تعذّر تحميل النص. افتح الدرس نفسه.',
    done: 'تمّ', doneOn: 'معلَّمة', saved: 'تم الحفظ.', unsaved: 'أُزيلت العلامة.',
    progress: (d, n) => `الخطوات المعلَّمة: ${d} من ${n}`,
    scholar: 'كل ما في هذه الصفحة من محتوى ديني منقول كما هو من دروس الموقع ومن حصن المسلم مع مصادره. وما يخصّ حالتك فاسأل عنه عالمًا موثوقًا. تعتمد الدروس على المصادر والعلماء المذكورين فيها، وفي بعض التفاصيل تختلف المذاهب الفقهية، فاسأل عالمًا من مذهبك.',
    clear: 'احذف ملاحظاتي', clearAsk: 'أتحذف جميع ملاحظاتك في هذا الدليل؟', clearYes: 'نعم، احذف', cancel: 'إلغاء', cleared: 'حُذفت الملاحظات.',
    privateLocal: 'ملاحظاتك محفوظة على هذا الجهاز فقط — لا تُرسل إلى أي مكان ولا تدخل في النسخ الاحتياطي ولا المزامنة.',
    privateSync: 'ملاحظاتك محفوظة على هذا الجهاز فقط (وإن كان لك حساب فالمزامنة المشفّرة تنقلها إلى أجهزتك الأخرى).',
  },
  tr: {
    fromLesson: 'Ders ne diyor — kaynaklarıyla', fromHisn: 'Hısnu’l-Müslim’den dua', readLesson: 'Derste tamamını oku',
    openHisn: 'Hısnu’l-Müslim’de aç', loading: 'Yükleniyor…', loadError: 'Metin yüklenemedi. Dersin kendisini açın.',
    done: 'Yaptım', doneOn: 'işaretlendi', saved: 'Kaydedildi.', unsaved: 'İşaret kaldırıldı.',
    progress: (d, n) => `${n} adımdan ${d} tanesi işaretlendi`,
    scholar: 'Bu sayfadaki bütün dinî içerik sitenin derslerinden ve Hısnu’l-Müslim’den olduğu gibi, kaynaklarıyla alınmıştır. Kendi durumunuzla ilgili soruyu güvenilir bir âlime sorun. Dersler, içinde anılan kaynak ve âlimlere dayanır; bazı ayrıntılarda mezhepler farklı görüştedir — kendi mezhebinizden bir âlime sorun.',
    clear: 'Notlarımı sil', clearAsk: 'Bu rehberdeki bütün notlarınız silinsin mi?', clearYes: 'Evet, sil', cancel: 'Vazgeç', cleared: 'Notlar silindi.',
    privateLocal: 'Notlarınız yalnızca bu cihazda saklanır — hiçbir yere gönderilmez, yedeğe ve eşitlemeye girmez.',
    privateSync: 'Notlarınız yalnızca bu cihazda saklanır (hesabınız varsa şifreli eşitleme onları diğer cihazlarınıza da taşır).',
  },
}

// Dərs keçidlərinin adları (dərs faylları tənbəl yüklənir — başlıqlar burada sabitdir)
export const LESSON_LABEL = {
  aqiqah: { az: 'Dərs: Əqiqə', en: 'Lesson: Aqiqah', ru: 'Урок: Акыка', ar: 'درس: العقيقة', tr: 'Ders: Akika' },
  janazah: { az: 'Dərs: Cənazə', en: 'Lesson: Funeral (Janazah)', ru: 'Урок: Похороны', ar: 'درس: الجنائز', tr: 'Ders: Cenaze' },
  wasiyyah: { az: 'Dərs: Vəsiyyət', en: 'Lesson: The Islamic will', ru: 'Урок: Завещание в исламе', ar: 'درس: الوصية', tr: 'Ders: Vasiyet' },
  nikah: { az: 'Dərs: Nikah', en: 'Lesson: Marriage (Nikah)', ru: 'Урок: Никях', ar: 'درس: النكاح', tr: 'Ders: Nikâh' },
  istikhara: { az: 'Dərs: İstixarə', en: 'Lesson: Istikhara', ru: 'Урок: Истихара', ar: 'درس: الاستخارة', tr: 'Ders: İstihare' },
  ghusl: { az: 'Dərs: Qüsl', en: 'Lesson: Ghusl', ru: 'Урок: Гусль', ar: 'درس: الغسل', tr: 'Ders: Gusül' },
}
