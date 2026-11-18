// H4 — şəxsi öyrənmə yolunun yazıları (5 dil)
export const GOAL_TXT = {
  az: {
    ey: 'Öyrənmə yolum', title: 'Mənim məqsədim', setGoal: 'Məqsədim et', isGoal: 'Məqsədimdir', clear: 'Məqsədi sil',
    pick: 'Dərs yollarından birini məqsəd seçin — irəliləyiş və növbəti addım burada görünəcək.', toLearn: 'Dərs yollarına bax',
    week: (n) => `Bu həftə: ${n} dərs`, prev: (n) => `ötən həftə: ${n}`, pathWeek: (n) => `yoldan: ${n}`, days: (n) => `aktiv gün: ${n} / 7`,
    next: 'Növbəti addım', nextLesson: 'Dərs', nextQuiz: 'Yol bitdi — biliyinizi testlə yoxlayın', nextArabic: 'Növbəti mərhələ — ərəb dili kursu',
    since: (d) => `Başlanğıc: ${d}`, of: (r, t) => `${r} / ${t} dərs`, weekLabel: 'Son 7 gün',
  },
  en: {
    ey: 'My learning path', title: 'My goal', setGoal: 'Make it my goal', isGoal: 'My goal', clear: 'Clear goal',
    pick: 'Choose one of the learning paths as your goal — progress and your next step will show up here.', toLearn: 'See the learning paths',
    week: (n) => (n === 1 ? 'This week: 1 lesson' : `This week: ${n} lessons`), prev: (n) => `last week: ${n}`, pathWeek: (n) => `from the path: ${n}`, days: (n) => `active days: ${n} of 7`,
    next: 'Next step', nextLesson: 'Lesson', nextQuiz: 'Path complete — test your knowledge with a quiz', nextArabic: 'Next stage — the Arabic course',
    since: (d) => `Started: ${d}`, of: (r, t) => `${r} of ${t} lessons`, weekLabel: 'Last 7 days',
  },
  ru: {
    ey: 'Мой учебный путь', title: 'Моя цель', setGoal: 'Сделать целью', isGoal: 'Моя цель', clear: 'Убрать цель',
    pick: 'Выберите один из учебных путей целью — прогресс и следующий шаг появятся здесь.', toLearn: 'Посмотреть учебные пути',
    week: (n) => `На этой неделе: уроков ${n}`, prev: (n) => `на прошлой: ${n}`, pathWeek: (n) => `из пути: ${n}`, days: (n) => `активных дней: ${n} из 7`,
    next: 'Следующий шаг', nextLesson: 'Урок', nextQuiz: 'Путь пройден — проверьте знания тестом', nextArabic: 'Следующий этап — курс арабского',
    since: (d) => `Начало: ${d}`, of: (r, t) => `Уроков: ${r} из ${t}`, weekLabel: 'Последние 7 дней',
  },
  ar: {
    ey: 'مساري التعليمي', title: 'هدفي', setGoal: 'اجعله هدفي', isGoal: 'هدفي', clear: 'إلغاء الهدف',
    pick: 'اختر أحد مسارات التعلم هدفًا لك — سيظهر هنا تقدّمك وخطوتك التالية.', toLearn: 'اعرض مسارات التعلم',
    week: (n) => `هذا الأسبوع: ${n} دروس`, prev: (n) => `الأسبوع الماضي: ${n}`, pathWeek: (n) => `من المسار: ${n}`, days: (n) => `أيام النشاط: ${n} من 7`,
    next: 'الخطوة التالية', nextLesson: 'درس', nextQuiz: 'أتممت المسار — اختبر معلوماتك', nextArabic: 'المرحلة التالية — دورة العربية',
    since: (d) => `البداية: ${d}`, of: (r, t) => `${r} من ${t} دروس`, weekLabel: 'آخر 7 أيام',
  },
  tr: {
    ey: 'Öğrenme yolum', title: 'Hedefim', setGoal: 'Hedefim yap', isGoal: 'Hedefim', clear: 'Hedefi kaldır',
    pick: 'Ders yollarından birini hedef seçin — ilerleme ve sonraki adım burada görünecek.', toLearn: 'Ders yollarına bak',
    week: (n) => `Bu hafta: ${n} ders`, prev: (n) => `geçen hafta: ${n}`, pathWeek: (n) => `yoldan: ${n}`, days: (n) => `aktif gün: ${n} / 7`,
    next: 'Sonraki adım', nextLesson: 'Ders', nextQuiz: 'Yol bitti — bilginizi testle ölçün', nextArabic: 'Sonraki aşama — Arapça kursu',
    since: (d) => `Başlangıç: ${d}`, of: (r, t) => `${r} / ${t} ders`, weekLabel: 'Son 7 gün',
  },
}
